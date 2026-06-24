import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  MapPin,
  X,
  UserCheck
} from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { employeeService } from '@/services/employeeService'
import { branchService } from '@/services/branchService'
import type { Employee, Branch } from '@/types'

export const ManageEmployeesPage = () => {
  const { user: currentUser } = useAuth()
  
  // State variables
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [role, setRole] = useState<'branch_manager' | 'staff'>('staff')
  const [branchId, setBranchId] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalSubmitting, setModalSubmitting] = useState(false)

  const isManager = currentUser?.role === 'branch_manager'
  const managerBranchId = currentUser?.branchId || ''

  // Fetch branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await branchService.getBranches({ status: 'active' })
        if (res.success && res.data) {
          setBranches(res.data)
        }
      } catch (err) {
        console.error('Failed to load branches:', err)
      }
    }
    loadBranches()
  }, [])

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page,
        limit: 10
      }
      
      if (searchQuery.trim()) {
        params.keyword = searchQuery.trim()
      }
      
      // Scoping based on role
      if (isManager) {
        params.branchId = managerBranchId
        params.role = 'staff' // Managers can only manage staff
      } else {
        if (selectedBranch) params.branchId = selectedBranch
        if (selectedRole) params.role = selectedRole
      }

      if (selectedStatus) {
        params.status = selectedStatus
      }
      
      const response = await employeeService.listEmployees(params)
      if (response.success && response.data) {
        setEmployees(response.data.employees)
        setTotalPages(response.data.pagination.totalPages || 1)
        setTotalCount(response.data.pagination.total || 0)
      } else {
        setError(response.message || 'Không thể tải danh sách nhân viên.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  // Load list when query, page or filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees()
    }, 400)
    
    return () => clearTimeout(delayDebounce)
  }, [page, searchQuery, selectedBranch, selectedRole, selectedStatus])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedBranch, selectedRole, selectedStatus])

  const handleOpenAddModal = () => {
    setEditingEmployee(null)
    setFullName('')
    setEmail('')
    setPassword('')
    setPhone('')
    setAddress('')
    setRole('staff')
    setBranchId(isManager ? managerBranchId : (branches[0]?._id || ''))
    setStatus('active')
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp)
    setFullName(emp.fullName)
    setEmail(emp.email)
    setPassword('') // leave blank if no password update
    setPhone(emp.phone || '')
    setAddress(emp.address || '')
    setRole(emp.role)
    setBranchId(emp.branch?.id || branches[0]?._id || '')
    setStatus(emp.status === 'active' ? 'active' : 'inactive')
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      setModalError('Tên và email không được để trống.')
      return
    }
    if (!editingEmployee && !password) {
      setModalError('Mật khẩu là bắt buộc khi tạo tài khoản mới.')
      return
    }

    try {
      setModalSubmitting(true)
      setModalError(null)

      if (editingEmployee) {
        const payload: any = {
          fullName,
          email,
          phone: phone.trim() || null,
          address: address.trim() || null,
          role,
          status
        }
        if (branchId) payload.branchId = branchId
        if (password) payload.password = password
        
        const res = await employeeService.updateEmployee(editingEmployee.id, payload)
        if (res.success) {
          setIsModalOpen(false)
          fetchEmployees()
        } else {
          setModalError(res.message || 'Cập nhật nhân viên thất bại.')
        }
      } else {
        const res = await employeeService.createEmployee({
          fullName,
          email,
          password,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          role,
          branchId,
          status
        })
        if (res.success) {
          setIsModalOpen(false)
          fetchEmployees()
        } else {
          setModalError(res.message || 'Tạo nhân viên thất bại.')
        }
      }
    } catch (err: any) {
      const responseData = err.response?.data
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        const detailMsg = responseData.errors
          .map((e: any) => `${e.field}: ${e.message}`)
          .join(', ')
        setModalError(`Lỗi xác thực: ${detailMsg}`)
      } else {
        setModalError(responseData?.message || err.message || 'Đã có lỗi xảy ra.')
      }
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('Bạn không thể tự vô hiệu hóa tài khoản của chính mình!')
      return
    }
    if (!window.confirm(`Bạn có chắc chắn muốn ngưng hoạt động nhân viên "${name}"?`)) return
    try {
      const res = await employeeService.deactivateEmployee(id)
      if (res.success) {
        alert('Ngưng hoạt động nhân viên thành công.')
        fetchEmployees()
      } else {
        alert(res.message || 'Thao tác thất bại.')
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra.')
    }
  }

  // Helper labels
  const getRoleLabel = (r: string) => {
    return r === 'branch_manager' ? 'Quản lý' : 'Nhân viên'
  }

  const getRoleBadge = (r: string) => {
    return r === 'branch_manager'
      ? 'bg-secondary-container text-on-secondary-container border border-secondary/20'
      : 'bg-primary-container text-on-primary-container border border-primary/20'
  }

  const currentBranchName = branches.find(b => b._id === managerBranchId)?.name || 'Chi nhánh của bạn'

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary font-mono">Back-Office</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl flex items-center gap-2">
            <UserCheck size={28} className="text-primary" />
            Quản lý Nhân sự Chi nhánh
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {isManager 
              ? `Danh sách nhân viên tại chi nhánh: ${currentBranchName}.` 
              : 'Quản lý tài khoản Trưởng chi nhánh và Nhân viên tại tất cả các cửa hàng PMAN-Mart.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-on-primary-fixed-variant"
        >
          <Plus size={18} />
          Thêm nhân viên
        </button>
      </section>

      {/* ── FILTERS BAR ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Tìm nhân viên theo tên, email, điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-5 pl-11 focus:ring-2 focus:ring-primary transition text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
        </div>

        {/* Filter Branch (Admin only) */}
        {!isManager && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Chi nhánh:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-surface-container-low border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary text-xs font-semibold"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Filter Role (Admin only) */}
        {!isManager && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Vai trò:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-surface-container-low border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary text-xs font-semibold"
            >
              <option value="">Tất cả vai trò</option>
              <option value="staff">Nhân viên (Staff)</option>
              <option value="branch_manager">Quản lý (Manager)</option>
            </select>
          </div>
        )}

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Trạng thái:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-surface-container-low border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary text-xs font-semibold"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Chưa kích hoạt / Khóa</option>
          </select>
        </div>
      </section>

      {/* ── ERROR MESSAGE ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      {loading && employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant">
          <Loader2 size={36} className="text-primary animate-spin mb-3" />
          <p className="text-sm text-on-surface-variant font-medium">Đang tải danh sách nhân viên...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <Users size={48} className="mx-auto mb-4 text-on-surface-variant opacity-60" />
          <h3 className="text-lg font-bold text-on-surface">Không tìm thấy nhân viên nào</h3>
          <p className="mt-2 text-sm text-on-surface-variant max-w-sm mx-auto">
            Vui lòng thay đổi bộ lọc hoặc thêm tài khoản nhân viên mới vào hệ thống.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="p-4 font-bold text-on-surface-variant text-center">STT</th>
                  <th className="p-4 font-bold text-on-surface-variant">Tên nhân viên</th>
                  <th className="p-4 font-bold text-on-surface-variant">Email</th>
                  <th className="p-4 font-bold text-on-surface-variant">Điện thoại</th>
                  <th className="p-4 font-bold text-on-surface-variant text-center">Vai trò</th>
                  <th className="p-4 font-bold text-on-surface-variant">Chi nhánh</th>
                  <th className="p-4 font-bold text-on-surface-variant text-center">Trạng thái</th>
                  <th className="p-4 font-bold text-on-surface-variant text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {employees.map((emp, idx) => {
                  const isSelf = currentUser?.id === emp.id
                  const isActive = emp.status === 'active'
                  
                  return (
                    <tr key={emp.id} className={`hover:bg-surface-container-low/20 transition-colors ${isSelf ? 'bg-primary/5' : ''}`}>
                      <td className="p-4 text-center font-semibold text-on-surface-variant">
                        {(page - 1) * 10 + idx + 1}
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="font-bold text-on-surface block leading-tight">{emp.fullName}</span>
                          {isSelf && (
                            <span className="inline-flex text-[9px] uppercase font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-0.5">
                              Tài khoản của bạn
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-on-surface">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} className="text-on-surface-variant" />
                          {emp.email}
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant">
                        {emp.phone ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <Phone size={12} className="text-on-surface-variant" />
                            {emp.phone}
                          </div>
                        ) : (
                          <span className="italic opacity-40 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getRoleBadge(emp.role)}`}>
                          {getRoleLabel(emp.role)}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface font-medium">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin size={12} className="text-on-surface-variant" />
                          {emp.branch?.name || 'Chưa phân bổ'}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isActive ? 'bg-success/10 text-success' : 'bg-outline-variant/30 text-on-surface-variant'
                        }`}>
                          {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {isActive ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Sửa nhân viên"
                          >
                            <Edit2 size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDelete(emp.id, emp.fullName)}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                              title="Ngưng hoạt động"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low/30 px-6 py-4">
            <div className="text-xs font-semibold text-on-surface-variant">
              Hiển thị <span className="font-bold text-on-surface">{employees.length}</span> trên <span className="font-bold text-on-surface">{totalCount}</span> tài khoản (Trang {page} / {totalPages})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high transition disabled:opacity-40"
              >
                Trang trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high transition disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-surface-container-lowest p-6 shadow-2xl border border-outline-variant/60 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
              <h2 className="text-xl font-black text-on-surface">
                {editingEmployee ? 'Chỉnh sửa tài khoản nhân sự' : 'Thêm tài khoản nhân sự mới'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="flex items-center gap-2 p-3 bg-error-container text-on-error-container rounded-xl border border-error/20 mb-4 text-xs font-bold">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase">Tên nhân viên *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase">
                    Mật khẩu {editingEmployee && '(Để trống nếu không đổi)'} *
                  </label>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase">Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase">Địa chỉ</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role selection */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase">Chức vụ *</label>
                  <select
                    value={role}
                    disabled={isManager}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold"
                  >
                    <option value="staff">Nhân viên bán hàng (Staff)</option>
                    <option value="branch_manager">Quản lý chi nhánh (Manager)</option>
                  </select>
                </div>

                {/* Branch selection */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase">Chi nhánh phân bổ *</label>
                  <select
                    value={branchId}
                    disabled={isManager || branches.length === 0}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold"
                  >
                    {isManager ? (
                      <option value={managerBranchId}>{currentBranchName}</option>
                    ) : (
                      branches.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {editingEmployee && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase">Trạng thái hoạt động</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold"
                  >
                    <option value="active">Đang hoạt động (Active)</option>
                    <option value="inactive">Tạm ngưng / Khóa (Inactive)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-on-primary-fixed-variant disabled:opacity-50"
                >
                  {modalSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
