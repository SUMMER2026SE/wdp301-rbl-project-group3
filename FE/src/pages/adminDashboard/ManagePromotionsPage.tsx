import { useEffect, useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Ticket,
  Calendar,
  Ban,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  Percent,
  CircleDollarSign,
  AlertTriangle,
} from 'lucide-react'
import { promotionService } from '@services/promotionService'
import { branchService } from '@services/branchService'
import type { Promotion, Voucher, Branch } from '@/types'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

export const ManagePromotionsPage = () => {
  // State lists
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Pagination states
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPromotions, setTotalPromotions] = useState(0)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterScope, setFilterScope] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isVouchersModalOpen, setIsVouchersModalOpen] = useState(false)

  // Selected items & payloads
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [customVoucherCode, setCustomVoucherCode] = useState<string>('')

  // Promotion Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    discountValue: 0,
    maxDiscountAmount: '',
    minOrderAmount: '',
    scope: 'global' as 'global' | 'branch',
    branchId: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    status: 'draft' as 'draft' | 'active',
  })
  const [formError, setFormError] = useState('')
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  // Vouchers modal states
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [vouchersPage, setVouchersPage] = useState(1)
  const [vouchersTotalPages, setVouchersTotalPages] = useState(1)
  const [vouchersTotal, setVouchersTotal] = useState(0)
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false)
  const [voucherStatusFilter, setVoucherStatusFilter] = useState<string>('all')

  // Load data helper
  const loadPromotions = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const params: any = {
        page,
        limit,
      }
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterScope !== 'all') params.scope = filterScope

      const res = await promotionService.getPromotions(params)
      if (res.success && res.data) {
        setPromotions(res.data.data || [])
        setTotalPages(res.data.pagination?.totalPages || 1)
        setTotalPromotions(res.data.pagination?.total || 0)
      } else {
        setErrorMsg(res.message || 'Không thể tải danh sách khuyến mãi')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Lỗi hệ thống khi tải danh sách khuyến mãi')
    } finally {
      setIsLoading(false)
    }
  }

  const loadBranches = async () => {
    try {
      const res = await branchService.getBranches()
      if (res.success && res.data) {
        setBranches(res.data)
      }
    } catch (err) {
      console.error('Failed to load branches:', err)
    }
  }

  useEffect(() => {
    loadPromotions()
  }, [page, filterStatus, filterScope])

  useEffect(() => {
    loadBranches()
  }, [])

  // Auto clear alerts
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  // Filter client-side by search keyword
  const filteredPromotions = useMemo(() => {
    if (!searchTerm.trim()) return promotions
    const kw = searchTerm.toLowerCase()
    return promotions.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        (p.description && p.description.toLowerCase().includes(kw))
    )
  }, [promotions, searchTerm])

  // Reset form helper
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      maxDiscountAmount: '',
      minOrderAmount: '',
      scope: 'global',
      branchId: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      status: 'draft',
    })
    setFormError('')
  }

  // Open Form modal for Create
  const handleOpenCreate = () => {
    setSelectedPromotion(null)
    resetForm()
    // Pre-fill default dates (today & next week)
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)

    setFormData((prev) => ({
      ...prev,
      startDate: today.toISOString().substring(0, 16),
      endDate: nextWeek.toISOString().substring(0, 16),
    }))
    setIsFormModalOpen(true)
  }

  // Open Form modal for Edit
  const handleOpenEdit = (promo: Promotion) => {
    setSelectedPromotion(promo)
    setFormData({
      name: promo.name,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscountAmount: promo.maxDiscountAmount?.toString() || '',
      minOrderAmount: promo.minOrderAmount?.toString() || '',
      scope: promo.scope,
      branchId: typeof promo.branchId === 'object' && promo.branchId !== null ? (promo.branchId as any)._id : promo.branchId || '',
      startDate: new Date(promo.startDate).toISOString().substring(0, 16),
      endDate: new Date(promo.endDate).toISOString().substring(0, 16),
      usageLimit: promo.usageLimit?.toString() || '',
      status: promo.status === 'expired' ? 'inactive' : (promo.status as any),
    })
    setFormError('')
    setIsFormModalOpen(true)
  }

  // Form Submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmittingForm(true)

    // Basic Validation
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên chương trình')
      setIsSubmittingForm(false)
      return
    }
    if (formData.discountValue <= 0) {
      setFormError('Giá trị giảm giá phải lớn hơn 0')
      setIsSubmittingForm(false)
      return
    }
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      setFormError('Giảm giá phần trăm không được vượt quá 100%')
      setIsSubmittingForm(false)
      return
    }
    if (formData.scope === 'branch' && !formData.branchId) {
      setFormError('Vui lòng chọn chi nhánh áp dụng')
      setIsSubmittingForm(false)
      return
    }

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    if (end <= start) {
      setFormError('Ngày kết thúc phải sau ngày bắt đầu')
      setIsSubmittingForm(false)
      return
    }

    const payload: any = {
      ...formData,
      maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
      minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
      branchId: formData.scope === 'branch' ? formData.branchId : undefined,
    }

    try {
      let res
      if (selectedPromotion) {
        res = await promotionService.updatePromotion(selectedPromotion.id || (selectedPromotion as any)._id, payload)
      } else {
        res = await promotionService.createPromotion(payload)
      }

      if (res.success) {
        setSuccessMsg(selectedPromotion ? 'Cập nhật khuyến mãi thành công!' : 'Tạo khuyến mãi mới thành công!')
        setIsFormModalOpen(false)
        loadPromotions()
      } else {
        setFormError(res.message || 'Không thể lưu thông tin khuyến mãi')
      }
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || 'Lỗi hệ thống khi lưu khuyến mãi')
    } finally {
      setIsSubmittingForm(false)
    }
  }

  // Action status toggle
  const handleToggleStatus = async (promo: Promotion) => {
    setErrorMsg('')
    const promoId = promo.id || (promo as any)._id
    try {
      let res
      if (promo.status === 'active') {
        res = await promotionService.deactivatePromotion(promoId)
      } else {
        res = await promotionService.activatePromotion(promoId)
      }

      if (res.success) {
        setSuccessMsg(`Đã thay đổi trạng thái khuyến mãi sang ${promo.status === 'active' ? 'ngừng hoạt động' : 'hoạt động'}!`)
        loadPromotions()
      } else {
        setErrorMsg(res.message || 'Không thể thay đổi trạng thái')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Lỗi hệ thống khi đổi trạng thái')
    }
  }

  // Delete promotion
  const handleDeletePromotion = async (promo: Promotion) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chương trình khuyến mãi "${promo.name}" không?`)) return
    setErrorMsg('')
    const promoId = promo.id || (promo as any)._id
    try {
      const res = await promotionService.deletePromotion(promoId)
      if (res.success) {
        setSuccessMsg('Đã xóa chương trình khuyến mãi thành công!')
        loadPromotions()
      } else {
        setErrorMsg(res.message || 'Không thể xóa chương trình')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Lỗi hệ thống khi xóa chương trình')
    }
  }

  // Generate vouchers handler
  const handleOpenGenerate = (promo: Promotion) => {
    setSelectedPromotion(promo)
    setCustomVoucherCode('')
    setIsGenerateModalOpen(true)
  }

  const handleGenerateVouchersSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPromotion) return
    setIsGenerating(true)
    const promoId = selectedPromotion.id || (selectedPromotion as any)._id
    try {
      const codeClean = customVoucherCode.trim().toUpperCase()
      if (!codeClean || codeClean.length < 2) {
        alert('Vui lòng nhập mã voucher từ 2 ký tự trở lên!')
        setIsGenerating(false)
        return
      }
      const res = await promotionService.generateVouchers(promoId, codeClean)

      if (res.success) {
        setSuccessMsg(`Đã tạo thành công mã voucher "${codeClean}"!`)
        setIsGenerateModalOpen(false)
      } else {
        alert(res.message || 'Không thể tạo mã voucher')
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Lỗi hệ thống khi tạo voucher')
    } finally {
      setIsGenerating(false)
    }
  }

  // View Vouchers list
  const handleOpenVouchers = (promo: Promotion) => {
    setSelectedPromotion(promo)
    setVouchers([])
    setVouchersPage(1)
    setVoucherStatusFilter('all')
    setIsVouchersModalOpen(true)
  }

  const loadVouchers = async () => {
    if (!selectedPromotion) return
    setIsLoadingVouchers(true)
    const promoId = selectedPromotion.id || (selectedPromotion as any)._id
    try {
      const params: any = {
        page: vouchersPage,
        limit: 10,
      }
      if (voucherStatusFilter !== 'all') params.status = voucherStatusFilter

      const res = await promotionService.getVouchers(promoId, params)
      if (res.success && res.data) {
        setVouchers(res.data.data || [])
        setVouchersTotalPages(res.data.pagination?.totalPages || 1)
        setVouchersTotal(res.data.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to load vouchers:', err)
    } finally {
      setIsLoadingVouchers(false)
    }
  }

  useEffect(() => {
    if (isVouchersModalOpen) {
      loadVouchers()
    }
  }, [selectedPromotion, vouchersPage, voucherStatusFilter, isVouchersModalOpen])

  // Disable single voucher
  const handleDisableVoucher = async (voucher: Voucher) => {
    if (!confirm(`Bạn có chắc muốn vô hiệu hóa mã voucher "${voucher.code}" không?`)) return
    try {
      const res = await promotionService.disableVoucher(voucher.id || (voucher as any)._id)
      if (res.success) {
        setSuccessMsg(`Đã vô hiệu hóa voucher ${voucher.code}`)
        loadVouchers()
      } else {
        alert(res.message || 'Không thể vô hiệu hóa voucher')
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Lỗi hệ thống khi vô hiệu hóa voucher')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── BANNER HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 text-white shadow-lg md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-white/10 blur-lg" />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-2xl font-black md:text-3xl">
              <Sparkles className="text-secondary-fixed animate-pulse" />
              Quản lý Chương trình Khuyến mãi
            </h2>
            <p className="text-sm opacity-90">
              Thiết lập các chiến dịch giảm giá, ưu đãi và phát hành mã voucher cho khách hàng.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary shadow transition hover:scale-105 hover:bg-surface-container-lowest"
            type="button"
          >
            <Plus size={18} />
            Tạo khuyến mãi mới
          </button>
        </div>
      </div>

      {/* ── ALERT MESSAGES ── */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-success-container p-4 text-on-success-container shadow-sm border border-success-container/20">
          <Check size={18} className="shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-error-container p-4 text-on-error-container shadow-sm border border-error-container/20">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* ── CONTROLS & FILTER BAR ── */}
      <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Tìm kiếm khuyến mãi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filters status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase">Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
            >
              <option value="all">Tất cả</option>
              <option value="draft">Bản nháp (Draft)</option>
              <option value="active">Đang chạy (Active)</option>
              <option value="inactive">Ngừng chạy (Inactive)</option>
              <option value="expired">Hết hạn (Expired)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase">Phạm vi:</span>
            <select
              value={filterScope}
              onChange={(e) => {
                setFilterScope(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
            >
              <option value="all">Tất cả</option>
              <option value="global">Toàn hệ thống (Global)</option>
              <option value="branch">Theo Chi nhánh</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFilterStatus('all')
              setFilterScope('all')
              setSearchTerm('')
              setPage(1)
              loadPromotions()
            }}
            className="flex items-center justify-center p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
            title="Làm mới bộ lọc"
            type="button"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── PROMOTIONS TABLE ── */}
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                <th className="px-6 py-4">Chương trình</th>
                <th className="px-6 py-4">Hình thức giảm</th>
                <th className="px-6 py-4">Giá trị giảm</th>
                <th className="px-6 py-4">Phạm vi</th>
                <th className="px-6 py-4">Hiệu lực</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <span className="font-medium text-xs">Đang tải dữ liệu khuyến mãi...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                    Không tìm thấy chương trình khuyến mãi nào.
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => {
                  const isPercentage = promo.discountType === 'percentage'
                  const scopeLabel = promo.scope === 'global' ? 'Toàn bộ' : 'Chi nhánh'
                  const branchName =
                    promo.scope === 'branch' && typeof promo.branchId === 'object' && promo.branchId !== null
                      ? (promo.branchId as any).name
                      : ''

                  return (
                    <tr
                      key={promo.id || (promo as any)._id}
                      className="group transition-colors hover:bg-surface-container-low/50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">
                            {promo.name}
                          </p>
                          {promo.description && (
                            <p className="text-[12px] text-on-surface-variant max-w-[250px] truncate mt-0.5" title={promo.description}>
                              {promo.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-bold text-xs">
                          {isPercentage ? (
                            <>
                              <Percent size={14} className="text-secondary" />
                              Phần trăm
                            </>
                          ) : (
                            <>
                              <CircleDollarSign size={14} className="text-primary" />
                              Số tiền cố định
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {isPercentage ? (
                          <span>{promo.discountValue}%</span>
                        ) : (
                          <span className="text-primary">{formatVND(promo.discountValue)}</span>
                        )}
                        {isPercentage && promo.maxDiscountAmount && (
                          <span className="block text-[10px] text-on-surface-variant font-medium mt-0.5">
                            Tối đa: {formatVND(promo.maxDiscountAmount)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-xs text-on-surface">
                          {scopeLabel}
                        </span>
                        {branchName && (
                          <span className="block text-[10px] text-on-surface-variant truncate max-w-[150px] mt-0.5" title={branchName}>
                            ({branchName})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[11px] font-semibold text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-primary" />
                            {new Date(promo.startDate).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="flex items-center gap-1">
                            <X size={12} className="text-error" />
                            {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            promo.status === 'active'
                              ? 'bg-success-container text-on-success-container'
                              : promo.status === 'draft'
                              ? 'bg-surface-container-high text-on-surface-variant'
                              : promo.status === 'expired'
                              ? 'bg-error-container text-on-error-container opacity-60'
                              : 'bg-outline-variant text-on-surface opacity-75'
                          }`}
                        >
                          {promo.status === 'active'
                            ? 'Đang hoạt động'
                            : promo.status === 'draft'
                            ? 'Bản nháp'
                            : promo.status === 'expired'
                            ? 'Hết hạn'
                            : 'Ngừng hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle active / inactive */}
                          {promo.status !== 'expired' && (
                            <button
                              onClick={() => handleToggleStatus(promo)}
                              className={`rounded-lg p-1.5 transition-colors ${
                                promo.status === 'active'
                                  ? 'text-error hover:bg-error-container'
                                  : 'text-success hover:bg-success-container'
                              }`}
                              title={promo.status === 'active' ? 'Ngừng kích hoạt' : 'Kích hoạt ngay'}
                              type="button"
                            >
                              {promo.status === 'active' ? <Ban size={16} /> : <Check size={16} />}
                            </button>
                          )}

                          {/* Generate Vouchers */}
                          <button
                            onClick={() => handleOpenGenerate(promo)}
                            className="rounded-lg p-1.5 text-primary hover:bg-primary-container transition-colors"
                            title="Sinh mã Voucher"
                            type="button"
                          >
                            <Ticket size={16} />
                          </button>

                          {/* View Vouchers */}
                          <button
                            onClick={() => handleOpenVouchers(promo)}
                            className="rounded-lg p-1.5 text-secondary hover:bg-secondary-container transition-colors text-xs font-bold px-2.5 border border-secondary/20 hover:border-transparent"
                            title="Xem danh sách Voucher đã sinh"
                            type="button"
                          >
                            Xem Mã
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(promo)}
                            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                            title="Chỉnh sửa thông tin"
                            type="button"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeletePromotion(promo)}
                            className="rounded-lg p-1.5 text-error hover:bg-error-container transition-colors"
                            title="Xóa khuyến mãi"
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-6 py-4">
            <span className="text-xs font-semibold text-on-surface-variant">
              Hiển thị {filteredPromotions.length} trên tổng số {totalPromotions} khuyến mãi
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-1.5 transition hover:bg-surface-container-low disabled:opacity-50"
                type="button"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-1.5 transition hover:bg-surface-container-low disabled:opacity-50"
                type="button"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: CREATE / EDIT FORM ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
              <h3 className="text-lg font-black text-primary flex items-center gap-2">
                <Ticket className="text-secondary" />
                {selectedPromotion ? 'Cập nhật chương trình khuyến mãi' : 'Thêm chương trình khuyến mãi mới'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-error-container p-3.5 text-on-error-container text-xs font-bold border border-error-container/20 mb-4">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Tên chương trình khuyến mãi *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Ví dụ: Giảm giá mùa hè, Ưu đãi khai trương..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    id="description"
                    placeholder="Mô tả các điều kiện, thể lệ của chương trình khuyến mãi..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2 px-3.5 text-sm outline-none transition focus:border-primary resize-none"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label htmlFor="discountType" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Hình thức giảm giá *
                  </label>
                  <select
                    id="discountType"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm font-semibold outline-none focus:border-primary"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed_amount">Số tiền cố định (đ)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label htmlFor="discountValue" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Giá trị giảm giá *
                  </label>
                  <input
                    id="discountValue"
                    type="number"
                    min={0}
                    required
                    value={formData.discountValue || ''}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    placeholder={formData.discountType === 'percentage' ? 'Ví dụ: 15' : 'Ví dụ: 50000'}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary font-bold"
                  />
                </div>

                {/* Max Discount (Only for percentage) */}
                {formData.discountType === 'percentage' && (
                  <div>
                    <label htmlFor="maxDiscountAmount" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                      Giảm tối đa (VND)
                    </label>
                    <input
                      id="maxDiscountAmount"
                      type="number"
                      min={0}
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="Không giới hạn"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary"
                    />
                  </div>
                )}

                {/* Min Order Amount */}
                <div className={formData.discountType !== 'percentage' ? 'md:col-span-2' : ''}>
                  <label htmlFor="minOrderAmount" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Đơn hàng tối thiểu (VND)
                  </label>
                  <input
                    id="minOrderAmount"
                    type="number"
                    min={0}
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    placeholder="Không yêu cầu"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* Scope */}
                <div>
                  <label htmlFor="scope" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Phạm vi áp dụng *
                  </label>
                  <select
                    id="scope"
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm font-semibold outline-none focus:border-primary"
                  >
                    <option value="global">Toàn hệ thống (Global)</option>
                    <option value="branch">Theo chi nhánh</option>
                  </select>
                </div>

                {/* Branch selector (Only for scope branch) */}
                {formData.scope === 'branch' && (
                  <div>
                    <label htmlFor="branchId" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                      Chọn Chi nhánh áp dụng *
                    </label>
                    <select
                      id="branchId"
                      required
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm font-semibold outline-none focus:border-primary"
                    >
                      <option value="">-- Chọn chi nhánh --</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Start Date */}
                <div>
                  <label htmlFor="startDate" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    id="startDate"
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary font-semibold"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label htmlFor="endDate" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    id="endDate"
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary font-semibold"
                  />
                </div>

                {/* Usage Limit */}
                <div>
                  <label htmlFor="usageLimit" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Giới hạn sử dụng (Số lần sử dụng/voucher)
                  </label>
                  <input
                    id="usageLimit"
                    type="number"
                    min={1}
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Mặc định: 1 lần"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                {/* Status (Only on creation) */}
                {!selectedPromotion && (
                  <div>
                    <label htmlFor="status" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                      Trạng thái ban đầu
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm font-semibold outline-none focus:border-primary"
                    >
                      <option value="draft">Bản nháp (Draft)</option>
                      <option value="active">Kích hoạt ngay (Active)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions button */}
              <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-4 mt-6">
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition"
                  type="button"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow hover:scale-[0.98] transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingForm ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Lưu thông tin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GENERATE VOUCHERS ── */}
      {isGenerateModalOpen && selectedPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
              <h3 className="text-lg font-black text-primary flex items-center gap-2">
                <Ticket className="text-secondary" />
                Khởi tạo Voucher mới
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1">Chương trình áp dụng:</span>
              <span className="text-sm font-bold text-on-surface">
                {selectedPromotion.name}
              </span>
            </div>

            <form onSubmit={handleGenerateVouchersSubmit} className="space-y-4">
              <div>
                <label htmlFor="customCode" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                  Nhập mã Voucher thủ công *
                </label>
                <input
                  id="customCode"
                  type="text"
                  required
                  placeholder="Ví dụ: MHTM50, CHAOSUNG26..."
                  value={customVoucherCode}
                  onChange={(e) => setCustomVoucherCode(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm font-bold outline-none transition focus:border-primary uppercase tracking-wider font-mono"
                />
                <p className="text-[10px] text-on-surface-variant mt-1.5 leading-normal">
                  Mã voucher tự đặt phải là duy nhất trên toàn hệ thống và không được trùng lặp.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-4 mt-6">
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition"
                  type="button"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow hover:scale-[0.98] transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang khởi tạo...
                    </>
                  ) : (
                    'Tạo Voucher'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW VOUCHERS LIST ── */}
      {isVouchersModalOpen && selectedPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-primary flex items-center gap-2">
                  <Ticket className="text-secondary" />
                  Danh sách Voucher đã phát hành
                </h3>
                <span className="text-xs text-on-surface-variant font-bold mt-0.5 block">
                  Thuộc chương trình: {selectedPromotion.name}
                </span>
              </div>
              <button
                onClick={() => setIsVouchersModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick status filter */}
            <div className="flex items-center gap-3 mb-4 rounded-lg bg-surface-container-low p-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase pl-2">Lọc trạng thái:</span>
              <div className="flex items-center gap-1.5">
                {['all', 'active', 'used', 'disabled', 'expired'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setVoucherStatusFilter(st)
                      setVouchersPage(1)
                    }}
                    className={`rounded px-2.5 py-1 text-xs font-bold uppercase transition ${
                      voucherStatusFilter === st
                        ? 'bg-primary text-white'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                    type="button"
                  >
                    {st === 'all' ? 'Tất cả' : st === 'active' ? 'Hoạt động' : st === 'used' ? 'Đã dùng' : st === 'disabled' ? 'Bị vô hiệu' : 'Hết hạn'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table & List */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">Mã Voucher</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Chi tiết giảm</th>
                    <th className="px-4 py-3">Đơn hàng tối thiểu</th>
                    <th className="px-4 py-3">Hết hạn</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {isLoadingVouchers ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-on-surface-variant">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                          <span className="font-semibold text-xs">Đang tải mã voucher...</span>
                        </div>
                      </td>
                    </tr>
                  ) : vouchers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-on-surface-variant font-semibold">
                        Không tìm thấy voucher nào của chương trình.
                      </td>
                    </tr>
                  ) : (
                    vouchers.map((v) => {
                      const st = v.status
                      return (
                        <tr key={v.id || (v as any)._id} className="transition-colors hover:bg-surface-container-low/30">
                          <td className="px-4 py-3 font-mono font-bold text-primary text-sm tracking-wider">
                            {v.code}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                                st === 'active'
                                  ? 'bg-success-container text-on-success-container'
                                  : st === 'used'
                                  ? 'bg-primary-container text-on-primary-container'
                                  : st === 'disabled'
                                  ? 'bg-error-container text-on-error-container opacity-60'
                                  : 'bg-outline-variant text-on-surface-variant opacity-60'
                              }`}
                            >
                              {st === 'active' ? 'Hoạt động' : st === 'used' ? 'Đã dùng' : st === 'disabled' ? 'Vô hiệu hóa' : 'Hết hạn'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-xs">
                            {v.discountType === 'percentage' ? (
                              <>
                                Giảm {v.discountValue}%
                                {v.maxDiscountAmount && ` (Tối đa ${formatVND(v.maxDiscountAmount)})`}
                              </>
                            ) : (
                              <>Giảm {formatVND(v.discountValue)}</>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-xs">
                            {v.minOrderAmount ? formatVND(v.minOrderAmount) : 'Không có'}
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant font-medium">
                            {new Date(v.expiresAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {v.status === 'active' && (
                              <button
                                onClick={() => handleDisableVoucher(v)}
                                className="rounded bg-error-container hover:bg-error/15 px-2.5 py-1 text-[11px] font-bold text-error transition"
                                title="Vô hiệu hóa mã này"
                                type="button"
                              >
                                Vô hiệu hóa
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for vouchers */}
            {!isLoadingVouchers && vouchersTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-4 py-3 mt-4">
                <span className="text-[11px] font-bold text-on-surface-variant">
                  Tổng cộng {vouchersTotal} voucher
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVouchersPage((p) => Math.max(p - 1, 1))}
                    disabled={vouchersPage === 1}
                    className="rounded border border-outline-variant bg-surface-container-lowest p-1 transition hover:bg-surface-container-low disabled:opacity-50"
                    type="button"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] font-bold">
                    {vouchersPage} / {vouchersTotalPages}
                  </span>
                  <button
                    onClick={() => setVouchersPage((p) => Math.min(p + 1, vouchersTotalPages))}
                    disabled={vouchersPage === vouchersTotalPages}
                    className="rounded border border-outline-variant bg-surface-container-lowest p-1 transition hover:bg-surface-container-low disabled:opacity-50"
                    type="button"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end border-t border-outline-variant pt-4 mt-4">
              <button
                onClick={() => setIsVouchersModalOpen(false)}
                className="rounded-lg bg-surface-container-high px-5 py-2 text-sm font-bold text-on-surface hover:bg-surface-container transition"
                type="button"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
