import { Types } from 'mongoose';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IUser } from '../../models/user.model';
import { UserStatus } from '../../types/common.types';
import { BackOfficeActor, resolveBackOfficeBranch } from '../../utils/backOfficeAccess.util';
import {
  claimBranchManager,
  releaseBranchManager,
  releaseBranchManagerWithRetry,
} from '../../utils/branchManager.util';
import { hashPassword } from '../../utils/hash.util';
import { branchService } from '../branch/branch.service';
import { employeeRepository } from './employee.repository';

type EmployeeRole = 'branch_manager' | 'staff';

function toEmployeeResponse(employee: IUser) {
  const branch = employee.branchId as unknown as {
    _id?: { toString(): string };
    name?: string;
    code?: string;
    address?: string;
    status?: string;
  };

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

export class EmployeeService {
  async listEmployees(
    filters: {
      page: number;
      limit: number;
      keyword?: string;
      branchId?: string;
      role?: EmployeeRole;
      status?: UserStatus;
    },
    actor: BackOfficeActor
  ) {
    const branchId = await resolveBackOfficeBranch(actor, filters.branchId);
    const role = actor.role === 'branch_manager' ? 'staff' : filters.role;
    const result = await employeeRepository.findPaginated(
      { ...filters, branchId, role },
      filters.page,
      filters.limit
    );

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

  async getEmployee(id: string, actor: BackOfficeActor) {
    const employee = await this.getAccessibleEmployee(id, actor);
    return toEmployeeResponse(employee);
  }

  async createEmployee(
    data: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
      address?: string;
      role: EmployeeRole;
      branchId: string;
      status: 'active' | 'inactive';
    },
    actor: BackOfficeActor
  ) {
    const branchId = await resolveBackOfficeBranch(actor, data.branchId, true);
    this.assertRoleCanBeManaged(actor, data.role);
    await this.ensureActiveBranch(branchId!);

    const existing = await employeeRepository.findByEmail(data.email);
    if (existing) throw new AppError('Email already exists', 409);

    const passwordHash = await hashPassword(data.password);
    const employeeId = new Types.ObjectId().toString();
    const shouldClaimManager =
      data.role === 'branch_manager' && data.status === 'active';

    let employee: IUser;
    try {
      employee = await employeeRepository.create({
        ...data,
        id: employeeId,
        branchId: branchId!,
        passwordHash,
      });
      if (shouldClaimManager) {
        await claimBranchManager(branchId!, employeeId);
      }
    } catch (error) {
      await employeeRepository.deleteFreshEmployee(employeeId);
      throw error;
    }

    return toEmployeeResponse((await employeeRepository.findById(employee._id.toString()))!);
  }

  async updateEmployee(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      password?: string;
      phone?: string | null;
      address?: string | null;
      role?: EmployeeRole;
      branchId?: string;
      status?: UserStatus;
    },
    actor: BackOfficeActor
  ) {
    if (id === actor.userId) {
      throw new AppError('You cannot modify your own employee account here', 400);
    }

    const employee = await this.getAccessibleEmployee(id, actor, true);
    const currentBranchId = employee.branchId!.toString();
    const nextRole = data.role || (employee.role as EmployeeRole);
    const nextStatus = data.status || employee.status;
    const nextBranchId =
      (await resolveBackOfficeBranch(actor, data.branchId || currentBranchId, true))!;

    this.assertRoleCanBeManaged(actor, nextRole);
    await this.ensureActiveBranch(nextBranchId);

    if (data.email && data.email.toLowerCase() !== employee.email) {
      const existing = await employeeRepository.findByEmail(data.email);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Email already exists', 409);
      }
    }

    const becomingActiveManager =
      nextRole === 'branch_manager' && nextStatus === 'active';
    const needsManagerClaim =
      becomingActiveManager &&
      (employee.role !== 'branch_manager' ||
        currentBranchId !== nextBranchId ||
        employee.status !== 'active');
    if (needsManagerClaim) {
      await claimBranchManager(nextBranchId, id);
    }

    const passwordHash = data.password ? await hashPassword(data.password) : undefined;
    const securityChanged = Boolean(
      passwordHash ||
      data.role ||
      data.branchId ||
      data.status === 'inactive' ||
      data.status === 'banned'
    );

    let updated: IUser | null;
    try {
      updated = await employeeRepository.update(
        id,
        {
          fullName: data.fullName,
          email: data.email,
          passwordHash,
          passwordChangedAt: passwordHash ? new Date() : undefined,
          phone: data.phone,
          address: data.address,
          branchId: nextBranchId,
          role: nextRole,
          status: data.status,
        },
        securityChanged
      );
    } catch (error) {
      if (needsManagerClaim) {
        await releaseBranchManager(nextBranchId, id);
      }
      throw error;
    }
    if (!updated) {
      if (needsManagerClaim) {
        await releaseBranchManager(nextBranchId, id);
      }
      throw new AppError('Employee not found', 404);
    }

    await this.syncBranchManagerAssignment(
      id,
      currentBranchId,
      nextBranchId,
      employee.role as EmployeeRole,
      nextRole,
      updated.status
    );

    return toEmployeeResponse(updated);
  }

  async deactivateEmployee(id: string, actor: BackOfficeActor) {
    if (id === actor.userId) {
      throw new AppError('You cannot deactivate your own account', 400);
    }

    const employee = await this.getAccessibleEmployee(id, actor, true);
    if (employee.status === 'inactive') {
      throw new AppError('Employee is already inactive', 409);
    }

    const managerBranchId =
      employee.role === 'branch_manager'
        ? employee.branchId?.toString()
        : undefined;
    const updated = await employeeRepository.update(
      id,
      { status: 'inactive' },
      true
    );
    if (!updated) throw new AppError('Employee not found', 404);

    if (managerBranchId) {
      await releaseBranchManagerWithRetry(
        managerBranchId,
        employee._id.toString()
      );
    }
    return toEmployeeResponse(updated);
  }

  private async getAccessibleEmployee(
    id: string,
    actor: BackOfficeActor,
    raw = false
  ): Promise<IUser> {
    const employee = raw
      ? await employeeRepository.findRawById(id)
      : await employeeRepository.findById(id);
    if (!employee || !['branch_manager', 'staff'].includes(employee.role)) {
      throw new AppError('Employee not found', 404);
    }

    this.assertRoleCanBeManaged(actor, employee.role as EmployeeRole);
    if (!employee.branchId) {
      throw new AppError('Employee is not assigned to a branch', 409);
    }
    await resolveBackOfficeBranch(actor, employee.branchId.toString(), true);
    return employee;
  }

  private assertRoleCanBeManaged(actor: BackOfficeActor, role: EmployeeRole): void {
    if (actor.role === 'branch_manager' && role !== 'staff') {
      throw new AppError('Branch managers can only manage staff accounts', 403);
    }
  }

  private async ensureActiveBranch(branchId: string): Promise<void> {
    const branch = await branchService.getBranchById(branchId);
    if (branch.status !== 'active') {
      throw new AppError('Employees cannot be assigned to an inactive branch', 409);
    }
  }

  private async syncBranchManagerAssignment(
    employeeId: string,
    oldBranchId: string,
    newBranchId: string,
    oldRole: EmployeeRole,
    newRole: EmployeeRole,
    status: UserStatus
  ): Promise<void> {
    if (
      oldRole === 'branch_manager' &&
      (newRole !== 'branch_manager' || oldBranchId !== newBranchId || status !== 'active')
    ) {
      await releaseBranchManagerWithRetry(oldBranchId, employeeId);
    }

    if (newRole === 'branch_manager' && status === 'active') {
      await claimBranchManager(newBranchId, employeeId);
    }
  }
}

export const employeeService = new EmployeeService();
