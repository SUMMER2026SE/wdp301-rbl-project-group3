"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeService = exports.EmployeeService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const backOfficeAccess_util_1 = require("../../utils/backOfficeAccess.util");
const branchManager_util_1 = require("../../utils/branchManager.util");
const hash_util_1 = require("../../utils/hash.util");
const branch_service_1 = require("../branch/branch.service");
const employee_repository_1 = require("./employee.repository");
function toEmployeeResponse(employee) {
    const branch = employee.branchId;
    return {
        id: employee._id.toString(),
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone ?? null,
        address: employee.address ?? null,
        role: employee.role,
        status: employee.status,
        branch: branch?._id
            ? {
                id: branch._id.toString(),
                name: branch.name,
                code: branch.code,
                address: branch.address,
                status: branch.status,
            }
            : employee.branchId
                ? { id: employee.branchId.toString() }
                : null,
        lastLoginAt: employee.lastLoginAt ?? null,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
    };
}
class EmployeeService {
    async listEmployees(filters, actor) {
        const branchId = await (0, backOfficeAccess_util_1.resolveBackOfficeBranch)(actor, filters.branchId);
        const role = actor.role === 'branch_manager' ? 'staff' : filters.role;
        const result = await employee_repository_1.employeeRepository.findPaginated({ ...filters, branchId, role }, filters.page, filters.limit);
        return {
            employees: result.employees.map(toEmployeeResponse),
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        };
    }
    async getEmployee(id, actor) {
        const employee = await this.getAccessibleEmployee(id, actor);
        return toEmployeeResponse(employee);
    }
    async createEmployee(data, actor) {
        const branchId = await (0, backOfficeAccess_util_1.resolveBackOfficeBranch)(actor, data.branchId, true);
        this.assertRoleCanBeManaged(actor, data.role);
        await this.ensureActiveBranch(branchId);
        const existing = await employee_repository_1.employeeRepository.findByEmail(data.email);
        if (existing)
            throw new errorHandler_middleware_1.AppError('Email already exists', 409);
        const passwordHash = await (0, hash_util_1.hashPassword)(data.password);
        const employeeId = new mongoose_1.Types.ObjectId().toString();
        const shouldClaimManager = data.role === 'branch_manager' && data.status === 'active';
        let employee;
        try {
            employee = await employee_repository_1.employeeRepository.create({
                ...data,
                id: employeeId,
                branchId: branchId,
                passwordHash,
            });
            if (shouldClaimManager) {
                await (0, branchManager_util_1.claimBranchManager)(branchId, employeeId);
            }
        }
        catch (error) {
            await employee_repository_1.employeeRepository.deleteFreshEmployee(employeeId);
            throw error;
        }
        return toEmployeeResponse((await employee_repository_1.employeeRepository.findById(employee._id.toString())));
    }
    async updateEmployee(id, data, actor) {
        if (id === actor.userId) {
            throw new errorHandler_middleware_1.AppError('You cannot modify your own employee account here', 400);
        }
        const employee = await this.getAccessibleEmployee(id, actor, true);
        const currentBranchId = employee.branchId ? employee.branchId.toString() : '';
        const nextRole = data.role || employee.role;
        const nextStatus = data.status || employee.status;
        const nextBranchId = (await (0, backOfficeAccess_util_1.resolveBackOfficeBranch)(actor, data.branchId || currentBranchId, true));
        this.assertRoleCanBeManaged(actor, nextRole);
        await this.ensureActiveBranch(nextBranchId);
        if (data.email && data.email.toLowerCase() !== employee.email) {
            const existing = await employee_repository_1.employeeRepository.findByEmail(data.email);
            if (existing && existing._id.toString() !== id) {
                throw new errorHandler_middleware_1.AppError('Email already exists', 409);
            }
        }
        const becomingActiveManager = nextRole === 'branch_manager' && nextStatus === 'active';
        const needsManagerClaim = becomingActiveManager &&
            (employee.role !== 'branch_manager' ||
                currentBranchId !== nextBranchId ||
                employee.status !== 'active');
        if (needsManagerClaim) {
            await (0, branchManager_util_1.claimBranchManager)(nextBranchId, id);
        }
        const passwordHash = data.password ? await (0, hash_util_1.hashPassword)(data.password) : undefined;
        const securityChanged = Boolean(passwordHash ||
            data.role ||
            data.branchId ||
            data.status === 'inactive' ||
            data.status === 'banned');
        let updated;
        try {
            updated = await employee_repository_1.employeeRepository.update(id, {
                fullName: data.fullName,
                email: data.email,
                passwordHash,
                passwordChangedAt: passwordHash ? new Date() : undefined,
                phone: data.phone,
                address: data.address,
                branchId: nextBranchId,
                role: nextRole,
                status: data.status,
            }, securityChanged);
        }
        catch (error) {
            if (needsManagerClaim) {
                await (0, branchManager_util_1.releaseBranchManager)(nextBranchId, id);
            }
            throw error;
        }
        if (!updated) {
            if (needsManagerClaim) {
                await (0, branchManager_util_1.releaseBranchManager)(nextBranchId, id);
            }
            throw new errorHandler_middleware_1.AppError('Employee not found', 404);
        }
        await this.syncBranchManagerAssignment(id, currentBranchId, nextBranchId, employee.role, nextRole, updated.status);
        return toEmployeeResponse(updated);
    }
    async deactivateEmployee(id, actor) {
        if (id === actor.userId) {
            throw new errorHandler_middleware_1.AppError('You cannot deactivate your own account', 400);
        }
        const employee = await this.getAccessibleEmployee(id, actor, true);
        if (employee.status === 'inactive') {
            throw new errorHandler_middleware_1.AppError('Employee is already inactive', 409);
        }
        const managerBranchId = employee.role === 'branch_manager'
            ? employee.branchId?.toString()
            : undefined;
        const updated = await employee_repository_1.employeeRepository.update(id, { status: 'inactive' }, true);
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Employee not found', 404);
        if (managerBranchId) {
            await (0, branchManager_util_1.releaseBranchManagerWithRetry)(managerBranchId, employee._id.toString());
        }
        return toEmployeeResponse(updated);
    }
    async getAccessibleEmployee(id, actor, raw = false) {
        const employee = raw
            ? await employee_repository_1.employeeRepository.findRawById(id)
            : await employee_repository_1.employeeRepository.findById(id);
        if (!employee || !['branch_manager', 'staff'].includes(employee.role)) {
            throw new errorHandler_middleware_1.AppError('Employee not found', 404);
        }
        this.assertRoleCanBeManaged(actor, employee.role);
        if (actor.role !== 'admin' && !employee.branchId) {
            throw new errorHandler_middleware_1.AppError('Employee is not assigned to a branch', 409);
        }
        if (employee.branchId) {
            await (0, backOfficeAccess_util_1.resolveBackOfficeBranch)(actor, employee.branchId.toString(), true);
        }
        return employee;
    }
    assertRoleCanBeManaged(actor, role) {
        if (actor.role === 'branch_manager' && role !== 'staff') {
            throw new errorHandler_middleware_1.AppError('Branch managers can only manage staff accounts', 403);
        }
    }
    async ensureActiveBranch(branchId) {
        const branch = await branch_service_1.branchService.getBranchById(branchId);
        if (branch.status !== 'active') {
            throw new errorHandler_middleware_1.AppError('Employees cannot be assigned to an inactive branch', 409);
        }
    }
    async syncBranchManagerAssignment(employeeId, oldBranchId, newBranchId, oldRole, newRole, status) {
        if (oldBranchId &&
            oldRole === 'branch_manager' &&
            (newRole !== 'branch_manager' || oldBranchId !== newBranchId || status !== 'active')) {
            await (0, branchManager_util_1.releaseBranchManagerWithRetry)(oldBranchId, employeeId);
        }
        if (newRole === 'branch_manager' && status === 'active') {
            await (0, branchManager_util_1.claimBranchManager)(newBranchId, employeeId);
        }
    }
}
exports.EmployeeService = EmployeeService;
exports.employeeService = new EmployeeService();
//# sourceMappingURL=employee.service.js.map