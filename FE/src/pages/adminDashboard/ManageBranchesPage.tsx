import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  MapPin,
  Phone,
  Search,
  Plus,
  Pencil,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Users,
  Package,
  CircleDollarSign,
  Clock,
} from 'lucide-react'
import { branchService } from '@services/branchService'
import type { Branch } from '@/types'
import { useAuth } from '@hooks/useAuth'

interface BranchStats {
  employeeCount: number
  productCount: number
  todayRevenue: number
  todayOrderCount: number
}

const WEEKDAYS_MAP: Record<string, { en: string; vi: string }> = {
  Monday: { en: 'Monday', vi: 'T2' },
  Tuesday: { en: 'Tuesday', vi: 'T3' },
  Wednesday: { en: 'Wednesday', vi: 'T4' },
  Thursday: { en: 'Thursday', vi: 'T5' },
  Friday: { en: 'Friday', vi: 'T6' },
  Saturday: { en: 'Saturday', vi: 'T7' },
  Sunday: { en: 'CN', vi: 'CN' },
}

const WEEKDAYS_LIST = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const isBranchOpen = (branch: Branch) => {
  if (!branch.openingTime || !branch.closingTime) return true

  const now = new Date()
  const days = branch.activeDays || WEEKDAYS_LIST

  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
  if (!days.includes(currentDay)) return false

  const [opH, opM] = branch.openingTime.split(':').map(Number)
  const [clH, clM] = branch.closingTime.split(':').map(Number)

  const currentH = now.getHours()
  const currentM = now.getMinutes()

  const openMinutes = opH * 60 + opM
  const closeMinutes = clH * 60 + clM
  const currentMinutes = currentH * 60 + currentM

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
}

const formatActiveDays = (days?: string[]) => {
  if (!days || days.length === 0) return 'Không hoạt động'
  if (days.length === 7) return 'Mỗi ngày'

  const shortDaysMap: Record<string, string> = {
    Monday: 'T2',
    Tuesday: 'T3',
    Wednesday: 'T4',
    Thursday: 'T5',
    Friday: 'T6',
    Saturday: 'T7',
    Sunday: 'CN',
  }

  return WEEKDAYS_LIST
    .filter((day) => days.includes(day))
    .map((day) => shortDaysMap[day])
    .join(', ')
}

export const ManageBranchesPage = () => {
  const { user } = useAuth()
  // Master states
  const [branches, setBranches] = useState<Branch[]>([])
  const [statsMap, setStatsMap] = useState<Record<string, BranchStats>>({})
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters state
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formOpeningTime, setFormOpeningTime] = useState('08:00')
  const [formClosingTime, setFormClosingTime] = useState('22:00')
  const [formActiveDays, setFormActiveDays] = useState<string[]>(WEEKDAYS_LIST)

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { status?: 'active' | 'inactive'; keyword?: string } = {}
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (keyword.trim()) {
        params.keyword = keyword.trim()
      }

      const response = await branchService.getBranches(params)
      if (response.success) {
        setBranches(response.data)
      } else {
        setError(response.message || 'Không thể tải danh sách chi nhánh.')
      }
    } catch (err: any) {
      console.error('Fetch branches error:', err)
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu chi nhánh.')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter])

  // Fetch stats for branch
  const fetchStatsForBranch = useCallback(async (branchId: string) => {
    setLoadingStats((prev) => ({ ...prev, [branchId]: true }))
    try {
      const response = await branchService.getBranchQuickStats(branchId)
      if (response.success && response.data) {
        setStatsMap((prev) => ({ ...prev, [branchId]: response.data }))
      }
    } catch (err) {
      console.error(`Failed to fetch stats for branch ${branchId}:`, err)
    } finally {
      setLoadingStats((prev) => ({ ...prev, [branchId]: false }))
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBranches()
    }, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [fetchBranches])

  useEffect(() => {
    const displayedBranches = user?.role === 'admin'
      ? branches
      : branches.filter((b) => b._id === user?.branchId)
      
    if (displayedBranches.length > 0) {
      displayedBranches.forEach((branch) => {
        fetchStatsForBranch(branch._id)
      })
    }
  }, [branches, user?.branchId, user?.role, fetchStatsForBranch])

  // Clear messages after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingBranch(null)
    setFormName('')
    setFormCode('')
    setFormAddress('')
    setFormPhone('')
    setFormOpeningTime('08:00')
    setFormClosingTime('22:00')
    setFormActiveDays(WEEKDAYS_LIST)
    setValidationError(null)
    setIsModalOpen(true)
  }

  // Open Modal for Edit
  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch)
    setFormName(branch.name)
    setFormCode(branch.code)
    setFormAddress(branch.address)
    setFormPhone(branch.phone || '')
    setFormOpeningTime(branch.openingTime || '08:00')
    setFormClosingTime(branch.closingTime || '22:00')
    setFormActiveDays(
      branch.activeDays || WEEKDAYS_LIST
    )
    setValidationError(null)
    setIsModalOpen(true)
  }

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // Form Client-side validations
    if (formName.trim().length < 2 || formName.trim().length > 100) {
      setValidationError('Tên chi nhánh phải từ 2 đến 100 ký tự.')
      return
    }
    if (formCode.trim().length < 2 || formCode.trim().length > 30) {
      setValidationError('Mã code phải từ 2 đến 30 ký tự.')
      return
    }
    if (formAddress.trim().length < 5 || formAddress.trim().length > 255) {
      setValidationError('Địa chỉ phải từ 5 đến 255 ký tự.')
      return
    }
    if (formPhone.trim() && formPhone.trim().length > 20) {
      setValidationError('Số điện thoại không được dài quá 20 ký tự.')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        openingTime: formOpeningTime,
        closingTime: formClosingTime,
        activeDays: formActiveDays,
      }

      if (user?.role === 'admin') {
        payload.name = formName.trim()
        payload.code = formCode.trim().toUpperCase()
        payload.address = formAddress.trim()
      }
      
      // Only include phone if it is non-empty
      if (formPhone.trim()) {
        payload.phone = formPhone.trim()
      }

      let response
      if (editingBranch) {
        response = await branchService.updateBranch(editingBranch._id, payload)
      } else {
        // Default to active status for new branches
        payload.status = 'active'
        response = await branchService.createBranch(payload)
      }

      if (response.success) {
        setSuccessMessage(
          editingBranch ? 'Cập nhật thông tin chi nhánh thành công!' : 'Thêm mới chi nhánh thành công!'
        )
        setIsModalOpen(false)
        fetchBranches()
      } else {
        setValidationError(response.message || 'Thao tác thất bại. Vui lòng kiểm tra lại.')
      }
    } catch (err: any) {
      console.error('Submit branch error:', err)
      setValidationError(
        err?.response?.data?.message || 'Có lỗi xảy ra trong quá trình xử lý yêu cầu.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle active/inactive status
  const handleToggleStatus = async (branch: Branch) => {
    setTogglingId(branch._id)
    try {
      const newStatus = branch.status === 'active' ? 'inactive' : 'active'
      let response
      
      if (newStatus === 'inactive') {
        // Use deactivate endpoint (DELETE /api/branches/:id)
        response = await branchService.deactivateBranch(branch._id)
      } else {
        // Use patch endpoint to update status to active
        response = await branchService.updateBranch(branch._id, { status: 'active' })
      }

      if (response.success) {
        setSuccessMessage(
          newStatus === 'active'
            ? `Đã kích hoạt hoạt động chi nhánh "${branch.name}"!`
            : `Đã ngừng hoạt động chi nhánh "${branch.name}"!`
        )
        fetchBranches()
      } else {
        setError(response.message || 'Không thể cập nhật trạng thái chi nhánh.')
      }
    } catch (err: any) {
      console.error('Toggle status error:', err)
      setError(
        err?.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái chi nhánh.'
      )
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface flex items-center gap-3">
            <Building2 className="text-primary h-7 w-7" />
            Quản lý Chi nhánh
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Quản lý thông tin và trạng thái hoạt động của các cửa hàng bán lẻ PMAN-Mart.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-opacity-95 hover:shadow-primary/35 active:scale-95 shrink-0"
          >
            <Plus size={18} />
            Thêm chi nhánh
          </button>
        )}
      </div>

      {/* ── ALERTS ── */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-success-container text-on-success-container rounded-2xl border border-success/20 animate-in fade-in duration-200">
          <CheckCircle2 size={20} className="shrink-0 text-success" />
          <p className="text-sm font-bold">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-2xl border border-error/20 animate-in fade-in duration-200">
          <AlertCircle size={20} className="shrink-0 text-error" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* ── FILTERS ── */}
      <div className="flex flex-col md:flex-row gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã chi nhánh..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface placeholder-on-surface-variant/50"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-on-surface-variant whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold transition-all text-on-surface"
          >
            <option value="all">Tất cả chi nhánh</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* ── BRANCH GRID ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-primary h-10 w-10" />
          <p className="text-sm font-medium text-on-surface-variant">Đang tải danh sách chi nhánh...</p>
        </div>
      ) : user?.role !== 'admin' && !user?.branchId ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant border-dashed">
          <Building2 size={48} className="text-on-surface-variant opacity-30 mb-4" />
          <p className="text-lg font-bold text-on-surface">Chưa được gán chi nhánh</p>
          <p className="text-sm text-on-surface-variant mt-1 max-w-md">
            Tài khoản của bạn chưa được gán quản lý chi nhánh nào. Vui lòng liên hệ Admin để được hỗ trợ.
          </p>
        </div>
      ) : (user?.role === 'admin' ? branches : branches.filter((b) => b._id === user?.branchId)).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant border-dashed">
          <Building2 size={48} className="text-on-surface-variant opacity-30 mb-4" />
          <p className="text-lg font-bold text-on-surface">Không tìm thấy chi nhánh nào</p>
          <p className="text-sm text-on-surface-variant mt-1 max-w-md">
            Không có chi nhánh nào phù hợp với bộ lọc tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(user?.role === 'admin' ? branches : branches.filter((b) => b._id === user?.branchId)).map((branch) => {
            const isActive = branch.status === 'active'
            const isToggling = togglingId === branch._id

            return (
              <div
                key={branch._id}
                className={`bg-surface rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isActive
                    ? 'border-outline-variant hover:border-primary/40'
                    : 'border-outline-variant opacity-80 bg-surface-container-low/30'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-outline-variant">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-black text-lg text-on-surface line-clamp-1">
                        {branch.name}
                      </h3>
                      <span className="inline-block font-mono font-bold text-xs bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-lg border border-outline-variant">
                        {branch.code}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-success-container text-on-success-container'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                      
                      {isActive && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            isBranchOpen(branch)
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-error/10 text-error border-error/20'
                          }`}
                        >
                          {isBranchOpen(branch) ? 'Đang mở cửa' : 'Đang đóng cửa'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-on-surface-variant shrink-0 mt-0.5 opacity-70" />
                    <span className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                      {branch.address}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-on-surface-variant shrink-0 opacity-70" />
                    <span className="text-sm text-on-surface-variant font-medium">
                      {branch.phone || 'Chưa cập nhật số điện thoại'}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-on-surface-variant shrink-0 mt-0.5 opacity-70" />
                    <span className="text-sm text-on-surface-variant font-medium">
                      Giờ hoạt động: {branch.openingTime || '08:00'} - {branch.closingTime || '22:00'} ({formatActiveDays(branch.activeDays)})
                    </span>
                  </div>

                  {/* Quick Stats Panel */}
                  <div className="mt-4 pt-4 border-t border-outline-variant/60 space-y-2.5">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Thống kê hôm nay</h4>
                    {loadingStats[branch._id] ? (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant py-2">
                        <Loader2 className="animate-spin h-3.5 w-3.5 text-primary" />
                        <span>Đang tải thống kê...</span>
                      </div>
                    ) : statsMap[branch._id] ? (
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/40">
                          <Users size={14} className="text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] text-on-surface-variant/70 leading-none">Nhân viên</p>
                            <p className="text-xs font-black text-on-surface mt-1 truncate">{statsMap[branch._id].employeeCount} active</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/40">
                          <Package size={14} className="text-secondary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] text-on-surface-variant/70 leading-none">Mặt hàng</p>
                            <p className="text-xs font-black text-on-surface mt-1 truncate">{statsMap[branch._id].productCount} SKU</p>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center gap-3 bg-primary-container/20 px-3 py-2 rounded-xl border border-primary/10">
                          <CircleDollarSign size={16} className="text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-on-surface-variant/70 leading-none">Doanh thu hôm nay</p>
                            <div className="flex items-baseline justify-between gap-1 mt-1">
                              <span className="text-sm font-black text-primary truncate">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(statsMap[branch._id].todayRevenue)}
                              </span>
                              <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                                ({statsMap[branch._id].todayOrderCount} đơn)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-on-surface-variant/60 italic">Không thể tải dữ liệu thống kê.</p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                {(user?.role === 'admin' || (user?.role === 'branch_manager' && user?.branchId === branch._id)) && (
                  <div className="px-5 py-4 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between gap-4">
                    <button
                      onClick={() => handleOpenEditModal(branch)}
                      className="inline-flex items-center gap-2 rounded-xl border border-outline px-4 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container-low active:scale-95 transition-all"
                    >
                      <Pencil size={14} />
                      Chỉnh sửa
                    </button>

                    {user?.role === 'admin' && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-on-surface-variant">
                          {isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(branch)}
                          disabled={isToggling}
                          aria-label={`Bật tắt hoạt động cho ${branch.name}`}
                          className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            isToggling ? 'opacity-50 cursor-not-allowed' : ''
                          } ${isActive ? 'bg-primary' : 'bg-outline-variant'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-0.5 ${
                              isActive ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <Building2 size={20} className="text-primary" />
                {editingBranch ? 'Cập Nhật Thông Tin Chi Nhánh' : 'Thêm Chi Nhánh Mới'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
                  <AlertCircle size={20} className="shrink-0 text-error" />
                  <p className="text-sm font-semibold">{validationError}</p>
                </div>
              )}

              {/* Tên chi nhánh */}
              <div className="space-y-1.5">
                <label htmlFor="branch-name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Tên chi nhánh <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="branch-name"
                  required
                  value={formName}
                  disabled={user?.role === 'branch_manager'}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: PMAN-Mart Cầu Giấy"
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface placeholder-on-surface-variant/40 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Mã chi nhánh & Điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="branch-code" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Mã code <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="branch-code"
                    required
                    value={formCode}
                    disabled={user?.role === 'branch_manager'}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ví dụ: CG01"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface placeholder-on-surface-variant/40 uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="branch-phone" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    id="branch-phone"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ví dụ: 0243123456"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface placeholder-on-surface-variant/40"
                  />
                </div>
              </div>

              {/* Giờ hoạt động */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="branch-opening" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Giờ mở cửa <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    id="branch-opening"
                    required
                    value={formOpeningTime}
                    onChange={(e) => setFormOpeningTime(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="branch-closing" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Giờ đóng cửa <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    id="branch-closing"
                    required
                    value={formClosingTime}
                    onChange={(e) => setFormClosingTime(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface"
                  />
                </div>
              </div>

              {/* Ngày hoạt động */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Ngày hoạt động trong tuần
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS_LIST.map((day) => {
                    const info = WEEKDAYS_MAP[day]
                    const isChecked = formActiveDays.includes(day)
                    return (
                      <label
                        key={day}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer select-none transition-all active:scale-95 ${
                          isChecked
                            ? 'bg-primary/10 border-primary text-primary shadow-sm'
                            : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant/80 hover:bg-surface-container-high'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              if (formActiveDays.length > 1) {
                                setFormActiveDays(formActiveDays.filter((d) => d !== day))
                              }
                            } else {
                              setFormActiveDays([...formActiveDays, day])
                            }
                          }}
                          className="sr-only"
                        />
                        {info.vi}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="space-y-1.5">
                <label htmlFor="branch-address" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Địa chỉ <span className="text-error">*</span>
                </label>
                <textarea
                  id="branch-address"
                  required
                  rows={3}
                  value={formAddress}
                  disabled={user?.role === 'branch_manager'}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Ví dụ: Số 123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội"
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface placeholder-on-surface-variant/40 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md shadow-primary/10 transition-all hover:bg-opacity-95 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang xử lý...
                    </>
                  ) : editingBranch ? (
                    'Lưu thay đổi'
                  ) : (
                    'Thêm chi nhánh'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
