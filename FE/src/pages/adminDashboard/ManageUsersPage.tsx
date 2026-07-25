import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react'
import { adminUserService } from '@services/adminUserService'
import { useAuth } from '@hooks/useAuth'
import type { User } from '@/types'
import { notify } from '../../utils/toast';

/**
 * Component Quản lý Khách hàng & Nhân viên (Dành cho Admin/Manager).
 * Hiển thị danh sách toàn bộ tài khoản trong hệ thống.
 * Cho phép tìm kiếm, lọc theo vai trò (role) và trạng thái (status).
 * Hỗ trợ tính năng khóa (banned) và mở khóa tài khoản người dùng vi phạm.
 *
 * @author MinhLD
 */
export const ManageUsersPage = () => {
  const { user: currentUser } = useAuth()
  
  /** Mảng lưu trữ danh sách các Users lấy được từ backend để render ra bảng (Data Grid) */
  const [usersList, setUsersList] = useState<User[]>([])
  
  /** Cờ trạng thái hiển thị loading spinner cho toàn bộ màn hình Quản lý thành viên */
  const [loading, setLoading] = useState(false)
  
  /** Biến tạm lưu trữ đối tượng User đang được người quản trị chọn để tiến hành Khóa hoặc Mở khóa */
  const [confirmLockUser, setConfirmLockUser] = useState<User | null>(null)
  
  /** Trạng thái lưu trữ lỗi HTTP Error từ backend trả về nếu API sập */
  const [error, setError] = useState<string | null>(null)
  
  /** State lưu trữ giá trị text tìm kiếm người dùng (theo email, SĐT, tên) */
  const [searchQuery, setSearchQuery] = useState('')
  
  /** State lưu trữ tùy chọn phân quyền (Role Filter) như Admin, Staff, Customer đang được chọn */
  const [selectedRole, setSelectedRole] = useState<string>('')
  
  /** State lưu trữ tùy chọn lọc theo trạng thái tài khoản (Active, Inactive, Banned) */
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  
  /** State quản lý số thứ tự trang hiện tại (Mặc định khởi tạo là trang số 1) */
  const [page, setPage] = useState(1)
  
  /** State quản lý tổng số lượng trang, phụ thuộc vào công thức: Tổng record / Limit */
  const [totalPages, setTotalPages] = useState(1)
  
  /** Biến đếm tổng lượng tài khoản có trong DB khớp với bộ lọc truy vấn hiện tại */
  const [totalCount, setTotalCount] = useState(0)

  // Fetch users from backend
  /**
   * Gọi API lấy danh sách người dùng với các tham số phân trang, 
   * từ khóa tìm kiếm, vai trò và trạng thái tương ứng.
   */
  const fetchUsers = async () => {
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
      if (selectedRole) {
        params.role = selectedRole
      }
      if (selectedStatus) {
        params.status = selectedStatus
      }
      
      const response = await adminUserService.listUsers(params)
      if (response.success) {
        setUsersList(response.data.users)
        setTotalPages(response.data.pagination.totalPages || 1)
        setTotalCount(response.data.pagination.total || 0)
      } else {
        setError(response.message || 'Không thể tải danh sách thành viên.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi kết nối với máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  // Reload lists when page, filters, or search query changes (with debounce for search)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers()
    }, 400)
    
    return () => clearTimeout(delayDebounce)
  }, [page, selectedRole, selectedStatus, searchQuery])

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedRole, selectedStatus, searchQuery])

  // Lock/Unlock user handler
  const handleToggleLock = async (user: User) => {
    if (!currentUser) return
    
    if (user.id === currentUser.id) {
      notify.error('Bạn không thể tự khóa tài khoản của chính mình!')
      return
    }
    
    if (user.role === 'admin') {
      notify.error('Không thể khóa tài khoản có quyền Quản trị viên (Admin) khác!')
      return
    }
    
    setConfirmLockUser(user)
  }

  /**
   * Xử lý xác nhận khóa/mở khóa tài khoản.
   * Gọi API tương ứng dựa trên trạng thái hiện tại của tài khoản.
   * Cập nhật lại danh sách ngay sau khi thao tác thành công.
   */
  const confirmLockAction = async () => {
    if (!confirmLockUser) return

    const isBanned = confirmLockUser.status === 'banned'
    const actionText = isBanned ? 'mở khóa' : 'khóa'

    try {
      setLoading(true)
      setError(null)
      
      let res
      if (isBanned) {
        res = await adminUserService.unlockUser(confirmLockUser.id)
      } else {
        res = await adminUserService.lockUser(confirmLockUser.id)
      }
      
      if (res.success) {
        notify.success(`Đã ${actionText} thành công tài khoản "${confirmLockUser.fullName}".`)
        fetchUsers() // refresh list
      } else {
        setError(res.message || `Thao tác ${actionText} tài khoản thất bại.`)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || `Lỗi khi thực hiện ${actionText} tài khoản.`
      setError(msg)
    } finally {
      setLoading(false)
      setConfirmLockUser(null)
    }
  }

  // Helpers for UI rendering
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-error-container text-on-error-container border border-error/20'
      case 'branch_manager':
        return 'bg-secondary-container text-on-secondary-container border border-secondary/20'
      case 'staff':
        return 'bg-primary-container text-on-primary-container border border-primary/20'
      default:
        return 'bg-emerald-100 text-emerald-800 border border-emerald-600/20'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'branch_manager':
        return 'Quản lý'
      case 'staff':
        return 'Nhân viên'
      default:
        return 'Khách hàng'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success'
      case 'banned':
        return 'bg-error/10 text-error'
      default:
        return 'bg-outline-variant/30 text-on-surface-variant'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động'
      case 'banned':
        return 'Bị khóa'
      default:
        return 'Chưa kích hoạt'
    }
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary font-mono">Back-Office</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl flex items-center gap-2">
            <Users size={28} className="text-primary" />
            Quản lý Khách hàng & Nhân viên
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Danh sách toàn bộ tài khoản trong hệ thống. Cấp quyền quản trị hoặc khóa/mở khóa các tài khoản vi phạm.
          </p>
        </div>
      </section>

      {/* ── FILTERS BAR ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
        {/* Search member */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Tìm thành viên theo tên, email, điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-5 pl-11 focus:ring-2 focus:ring-primary transition-all text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
        </div>

        {/* Filter Role */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Vai trò:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-surface-container-low border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary text-xs font-semibold transition-all"
          >
            <option value="">Tất cả</option>
            <option value="customer">Khách hàng</option>
            <option value="staff">Nhân viên</option>
            <option value="branch_manager">Quản lý chi nhánh</option>
            <option value="admin">Quản trị viên (Admin)</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Trạng thái:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-surface-container-low border-none rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary text-xs font-semibold transition-all"
          >
            <option value="">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Chưa kích hoạt</option>
            <option value="banned">Bị khóa (Banned)</option>
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
      {loading && usersList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant">
          <Loader2 size={36} className="text-primary animate-spin mb-3" />
          <p className="text-sm text-on-surface-variant font-medium">Đang tải danh sách thành viên...</p>
        </div>
      ) : usersList.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <Users size={48} className="mx-auto mb-4 text-on-surface-variant opacity-60" />
          <h3 className="text-lg font-bold text-on-surface">Không tìm thấy thành viên nào</h3>
          <p className="mt-2 text-sm text-on-surface-variant max-w-sm mx-auto">
            Không tìm thấy tài khoản người dùng nào phù hợp với từ khóa tìm kiếm hoặc bộ lọc bạn chọn.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="p-4 font-bold text-on-surface-variant text-center">STT</th>
                  <th className="p-4 font-bold text-on-surface-variant">Thành viên</th>
                  <th className="p-4 font-bold text-on-surface-variant">Email</th>
                  <th className="p-4 font-bold text-on-surface-variant">Điện thoại</th>
                  <th className="p-4 font-bold text-on-surface-variant text-center">Vai trò</th>
                  <th className="p-4 font-bold text-on-surface-variant text-center">Trạng thái</th>
                  <th className="p-4 font-bold text-on-surface-variant">Ngày đăng ký</th>
                  <th className="p-4 font-bold text-on-surface-variant text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {usersList.map((usr, idx) => {
                  const isSelf = currentUser?.id === usr.id
                  const isAdmin = usr.role === 'admin'
                  const isBanned = usr.status === 'banned'
                  
                  return (
                    <tr key={usr.id} className={`hover:bg-surface-container-low/20 transition-colors ${isSelf ? 'bg-primary/5' : ''}`}>
                      {/* STT */}
                      <td className="p-4 text-center font-semibold text-on-surface-variant">
                        {(page - 1) * 10 + idx + 1}
                      </td>
                      
                      {/* Avatar + FullName */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant flex items-center justify-center bg-primary-container text-on-primary-container font-black text-sm">
                            {usr.avatarUrl ? (
                              <img
                                src={usr.avatarUrl}
                                alt={usr.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              usr.fullName.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-on-surface block leading-tight">
                              {usr.fullName}
                            </span>
                            {isSelf && (
                              <span className="inline-flex text-[9px] uppercase font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-0.5">
                                Bạn
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Email */}
                      <td className="p-4 font-medium text-on-surface">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} className="text-on-surface-variant" />
                          {usr.email}
                        </div>
                      </td>
                      
                      {/* Phone */}
                      <td className="p-4 text-on-surface-variant">
                        {usr.phone ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <Phone size={12} className="text-on-surface-variant" />
                            {usr.phone}
                          </div>
                        ) : (
                          <span className="italic opacity-40 text-xs">Chưa cập nhật</span>
                        )}
                      </td>
                      
                      {/* Role */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getRoleBadge(usr.role)}`}>
                          {getRoleLabel(usr.role)}
                        </span>
                      </td>
                      
                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(usr.status)}`}>
                          {isBanned ? <XCircle size={12} /> : <CheckCircle size={12} />}
                          {getStatusLabel(usr.status)}
                        </span>
                      </td>
                      
                      {/* CreatedAt */}
                      <td className="p-4 text-on-surface-variant text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-on-surface-variant" />
                          {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="p-4 text-center">
                        {isSelf || isAdmin ? (
                          <span className="text-xs text-on-surface-variant italic opacity-40">Không khả dụng</span>
                        ) : (
                          <button
                            onClick={() => handleToggleLock(usr)}
                            disabled={loading}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                              isBanned
                                ? 'bg-success/10 text-success hover:bg-success/20'
                                : 'bg-error/10 text-error hover:bg-error/20'
                            }`}
                            title={isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {isBanned ? (
                              <>
                                <ShieldCheck size={14} />
                                Mở khóa
                              </>
                            ) : (
                              <>
                                <ShieldAlert size={14} />
                                Khóa
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low/30 px-6 py-4">
            <div className="text-xs font-semibold text-on-surface-variant">
              Hiển thị <span className="font-bold text-on-surface">{usersList.length}</span> trên <span className="font-bold text-on-surface">{totalCount}</span> thành viên (Trang {page} / {totalPages})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Trang trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Lock User Modal */}
      {confirmLockUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col text-on-surface">
            <div className={`p-5 flex items-center justify-between border-b border-outline-variant ${confirmLockUser.status === 'banned' ? 'bg-emerald-100 text-emerald-800' : 'bg-error-container text-on-error-container'}`}>
              <h3 className="text-lg font-black flex items-center gap-2">
                {confirmLockUser.status === 'banned' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
                Xác nhận {confirmLockUser.status === 'banned' ? 'Mở khóa' : 'Khóa'}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmLockUser(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 text-sm">
              <p className="mb-2">Bạn có chắc chắn muốn <span className="font-bold">{confirmLockUser.status === 'banned' ? 'mở khóa' : 'khóa'}</span> tài khoản này không?</p>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3 mb-4">
                <p className="font-bold text-on-surface">{confirmLockUser.fullName}</p>
                <p className="text-on-surface-variant text-xs mt-1">{confirmLockUser.email}</p>
              </div>
              <p className="text-xs text-on-surface-variant">
                {confirmLockUser.status === 'banned' 
                  ? 'Tài khoản sau khi được mở khóa sẽ có thể đăng nhập và tiếp tục sử dụng hệ thống.'
                  : 'Tài khoản bị khóa sẽ không thể truy cập vào hệ thống cho đến khi được mở lại.'}
              </p>
            </div>
            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmLockUser(null)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50 cursor-pointer text-on-surface border border-outline-variant"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmLockAction}
                disabled={loading}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-sm ${confirmLockUser.status === 'banned' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-error hover:bg-error/90'}`}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
