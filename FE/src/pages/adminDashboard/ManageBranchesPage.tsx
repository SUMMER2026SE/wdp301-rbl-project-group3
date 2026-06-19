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
} from 'lucide-react'
import { branchService } from '@services/branchService'
import type { Branch } from '@/types'

export const ManageBranchesPage = () => {
  // Master states
  const [branches, setBranches] = useState<Branch[]>([])
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBranches()
    }, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [fetchBranches])

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
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        address: formAddress.trim(),
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

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-opacity-95 hover:shadow-primary/35 active:scale-95 shrink-0"
        >
          <Plus size={18} />
          Thêm chi nhánh
        </button>
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
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant border-dashed">
          <Building2 size={48} className="text-on-surface-variant opacity-30 mb-4" />
          <p className="text-lg font-bold text-on-surface">Không tìm thấy chi nhánh nào</p>
          <p className="text-sm text-on-surface-variant mt-1 max-w-md">
            Không có chi nhánh nào phù hợp với bộ lọc tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => {
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

                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                        isActive
                          ? 'bg-success-container text-on-success-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
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
                </div>

                {/* Card Actions */}
                <div className="px-5 py-4 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between gap-4">
                  <button
                    onClick={() => handleOpenEditModal(branch)}
                    className="inline-flex items-center gap-2 rounded-xl border border-outline px-4 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container-low active:scale-95 transition-all"
                  >
                    <Pencil size={14} />
                    Chỉnh sửa
                  </button>

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
                </div>
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
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: PMAN-Mart Cầu Giấy"
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface placeholder-on-surface-variant/40"
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
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ví dụ: CG01"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface placeholder-on-surface-variant/40 uppercase"
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
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Ví dụ: Số 123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội"
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all text-on-surface placeholder-on-surface-variant/40 resize-none"
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
