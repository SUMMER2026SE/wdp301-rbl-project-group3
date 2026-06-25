import { useEffect, useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Zap,
  X,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { flashSaleService } from '@services/flashSaleService'
import { productService } from '@services/productService'
import { branchService } from '@services/branchService'
import { useAuth } from '@hooks/useAuth'
import type { FlashSale, Product, Branch } from '@/types'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

export const ManageFlashSalesPage = () => {
  const { user } = useAuth()

  // State lists
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Pagination states
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterScope, setFilterScope] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedFlashSale, setSelectedFlashSale] = useState<FlashSale | null>(null)

  // Flash Sale Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope: 'global' as 'global' | 'branch',
    branchId: '',
    startDate: '',
    endDate: '',
    status: 'draft' as 'draft' | 'active' | 'inactive',
    products: [] as { productId: string; flashSalePrice: number; limitQuantity: number }[],
  })
  const [formError, setFormError] = useState('')
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  // Form helper: add product item
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('')
  const [tempFlashPrice, setTempFlashPrice] = useState<number>(0)
  const [tempLimitQty, setTempLimitQty] = useState<number>(10)

  // Role permissions helpers
  const isStaff = user?.role === 'staff'
  const isBranchManager = user?.role === 'branch_manager'

  // Load data helper
  const loadFlashSales = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const params: any = {
        page,
        limit,
      }
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterScope !== 'all') params.scope = filterScope

      const res = await flashSaleService.getFlashSales(params)
      if (res.success && res.data) {
        setFlashSales(res.data.data || [])
        setTotalPages(Math.ceil(res.data.total / limit) || 1)
        setTotalItems(res.data.total || 0)
      } else {
        setErrorMsg(res.message || 'Không thể tải danh sách Flash Sale')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Lỗi hệ thống khi tải danh sách Flash Sale')
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

  const loadProducts = async (branchId?: string) => {
    try {
      const res = await productService.getProducts({ status: 'active', branchId })
      if (res.success && res.data) {
        setProducts(res.data)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  useEffect(() => {
    loadFlashSales()
  }, [page, filterStatus, filterScope])

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    const targetBranchId = formData.scope === 'branch' ? formData.branchId : undefined
    loadProducts(targetBranchId)
  }, [formData.scope, formData.branchId])

  // Auto clear alerts
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  // Filter client-side by search keyword
  const filteredFlashSales = useMemo(() => {
    if (!searchTerm.trim()) return flashSales
    const kw = searchTerm.toLowerCase()
    return flashSales.filter(
      (f) =>
        f.name.toLowerCase().includes(kw) ||
        (f.description && f.description.toLowerCase().includes(kw))
    )
  }, [flashSales, searchTerm])

  const getBranchName = (fs: FlashSale) => {
    if (fs.scope === 'global') return 'Toàn hệ thống'
    if (typeof fs.branchId === 'object' && fs.branchId !== null) {
      return fs.branchId.name
    }
    const match = branches.find((b) => b._id === fs.branchId)
    return match ? match.name : 'Chi nhánh cụ thể'
  }

  // Open modal for Create
  const handleOpenCreateModal = () => {
    if (isStaff) return
    setSelectedFlashSale(null)
    setFormData({
      name: '',
      description: '',
      scope: isBranchManager ? 'branch' : 'global',
      branchId: isBranchManager && user?.branchId ? user.branchId : '',
      startDate: '',
      endDate: '',
      status: 'draft',
      products: [],
    })
    setSelectedProductIdToAdd('')
    setTempFlashPrice(0)
    setTempLimitQty(10)
    setFormError('')
    setIsFormModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEditModal = (fs: FlashSale) => {
    if (isStaff) return
    
    // Check Branch Manager bounds
    if (isBranchManager) {
      const branchIdStr = typeof fs.branchId === 'object' && fs.branchId !== null ? fs.branchId._id : fs.branchId
      if (fs.scope === 'global' || branchIdStr !== user?.branchId) {
        alert('Bạn chỉ có quyền chỉnh sửa Flash Sale của chi nhánh mình quản lý!')
        return
      }
    }

    setSelectedFlashSale(fs)

    const branchIdStr = typeof fs.branchId === 'object' && fs.branchId !== null 
      ? fs.branchId._id 
      : (fs.branchId as string) || ''

    // Format Date strings for datetime-local input fields (YYYY-MM-DDTHH:MM)
    const formatInputDate = (dStr: string) => {
      if (!dStr) return ''
      const d = new Date(dStr)
      if (isNaN(d.getTime())) return ''
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    setFormData({
      name: fs.name,
      description: fs.description || '',
      scope: fs.scope,
      branchId: branchIdStr,
      startDate: formatInputDate(fs.startDate),
      endDate: formatInputDate(fs.endDate),
      status: fs.status as 'draft' | 'active' | 'inactive',
      products: fs.products.map((p) => {
        const prodId = typeof p.productId === 'object' && p.productId !== null ? p.productId._id : p.productId
        return {
          productId: prodId as string,
          flashSalePrice: p.flashSalePrice,
          limitQuantity: p.limitQuantity,
        }
      }),
    })
    setSelectedProductIdToAdd('')
    setTempFlashPrice(0)
    setTempLimitQty(10)
    setFormError('')
    setIsFormModalOpen(true)
  }

  // Handle Delete
  const handleDeleteFlashSale = async (id: string, fs: FlashSale) => {
    if (isStaff) return
    
    // Check Branch Manager bounds
    if (isBranchManager) {
      const branchIdStr = typeof fs.branchId === 'object' && fs.branchId !== null ? fs.branchId._id : fs.branchId
      if (fs.scope === 'global' || branchIdStr !== user?.branchId) {
        alert('Bạn chỉ có quyền xóa Flash Sale của chi nhánh mình quản lý!')
        return
      }
    }

    if (!confirm('Bạn có chắc chắn muốn xóa chương trình Flash Sale này?')) return

    try {
      const res = await flashSaleService.deleteFlashSale(id)
      if (res.success) {
        setSuccessMsg('Xóa chương trình Flash Sale thành công')
        loadFlashSales()
      } else {
        setErrorMsg(res.message || 'Lỗi khi xóa Flash Sale')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi kết nối xóa Flash Sale')
    }
  }

  // Form: handle add product item to temp list
  const handleAddProductItem = () => {
    if (!selectedProductIdToAdd) return
    const matchProduct = products.find((p) => p._id === selectedProductIdToAdd)
    if (!matchProduct) return

    // Check if already in list
    if (formData.products.some((p) => p.productId === selectedProductIdToAdd)) {
      setFormError('Sản phẩm này đã có trong danh sách Flash Sale')
      return
    }

    if (tempFlashPrice < 0) {
      setFormError('Giá sale phải lớn hơn hoặc bằng 0')
      return
    }

    if (tempLimitQty < 1) {
      setFormError('Số lượng giới hạn tối thiểu là 1')
      return
    }

    setFormData({
      ...formData,
      products: [
        ...formData.products,
        {
          productId: selectedProductIdToAdd,
          flashSalePrice: tempFlashPrice,
          limitQuantity: tempLimitQty,
        },
      ],
    })

    setSelectedProductIdToAdd('')
    setTempFlashPrice(0)
    setTempLimitQty(10)
    setFormError('')
  }

  // Form: remove product item from temp list
  const handleRemoveProductItem = (prodId: string) => {
    setFormData({
      ...formData,
      products: formData.products.filter((p) => p.productId !== prodId),
    })
  }

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmittingForm(true)

    // Form client-side validation
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên chương trình')
      setIsSubmittingForm(false)
      return
    }
    if (!formData.startDate || !formData.endDate) {
      setFormError('Vui lòng nhập thời gian bắt đầu và kết thúc')
      setIsSubmittingForm(false)
      return
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError('Thời gian kết thúc phải sau thời gian bắt đầu')
      setIsSubmittingForm(false)
      return
    }
    if (formData.scope === 'branch' && !formData.branchId) {
      setFormError('Vui lòng chọn chi nhánh áp dụng')
      setIsSubmittingForm(false)
      return
    }
    if (formData.products.length === 0) {
      setFormError('Danh sách sản phẩm tham gia Flash Sale không được để trống')
      setIsSubmittingForm(false)
      return
    }

    try {
      let res
      const payload = {
        ...formData,
        branchId: formData.scope === 'branch' ? formData.branchId : undefined,
      }

      if (selectedFlashSale) {
        res = await flashSaleService.updateFlashSale(selectedFlashSale._id || selectedFlashSale.id, payload)
      } else {
        res = await flashSaleService.createFlashSale(payload)
      }

      if (res.success) {
        setSuccessMsg(
          selectedFlashSale
            ? 'Cập nhật Flash Sale thành công'
            : 'Tạo chương trình Flash Sale thành công'
        )
        setIsFormModalOpen(false)
        loadFlashSales()
      } else {
        setFormError(res.message || 'Lỗi từ phía server khi lưu Flash Sale')
      }
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || 'Lỗi khi lưu chương trình Flash Sale')
    } finally {
      setIsSubmittingForm(false)
    }
  }

  const getProductInfo = (prodId: string) => {
    return products.find((p) => p._id === prodId)
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">Quản lý Flash Sale</h1>
          <p className="text-sm text-on-surface-variant">
            Thiết lập các khung giờ vàng giảm giá sốc giới hạn số lượng sản phẩm.
          </p>
        </div>
        {!isStaff && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-container hover:text-on-primary-container hover:-translate-y-0.5"
            type="button"
          >
            <Plus size={18} />
            Tạo Flash Sale
          </button>
        )}
      </div>

      {/* ── ALERTS ── */}
      {successMsg && (
        <div className="rounded-xl bg-emerald-100 p-4 text-emerald-800 flex items-center gap-2 border border-emerald-200">
          <Check size={20} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl bg-error-container p-4 text-on-error-container flex items-center gap-2">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* ── FILTER & SEARCH ── */}
      <div className="flex flex-wrap gap-4 rounded-2xl bg-surface-container-low p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên chiến dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Scope Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Phạm vi:</span>
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest py-2 px-3 text-sm outline-none focus:border-primary"
          >
            <option value="all">Tất cả</option>
            <option value="global">Toàn hệ thống (Global)</option>
            <option value="branch">Theo chi nhánh</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest py-2 px-3 text-sm outline-none focus:border-primary"
          >
            <option value="all">Tất cả</option>
            <option value="draft">Bản nháp (Draft)</option>
            <option value="active">Đang chạy (Active)</option>
            <option value="inactive">Đã tắt (Inactive)</option>
          </select>
        </div>
      </div>

      {/* ── FLASH SALES TABLE ── */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-6 py-4">Tên chiến dịch</th>
                <th className="px-6 py-4">Phạm vi</th>
                <th className="px-6 py-4">Khung thời gian</th>
                <th className="px-6 py-4 text-center">Sản phẩm</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                    Đang tải danh sách Flash Sale...
                  </td>
                </tr>
              ) : filteredFlashSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                    Không tìm thấy chương trình Flash Sale nào.
                  </td>
                </tr>
              ) : (
                filteredFlashSales.map((fs) => {
                  const isActive = fs.status === 'active'
                  const isDraft = fs.status === 'draft'

                  return (
                    <tr key={fs.id || fs._id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-secondary" />
                          <div>
                            <span className="block font-bold text-on-surface">{fs.name}</span>
                            {fs.description && (
                              <span className="block text-xs text-on-surface-variant max-w-xs truncate">
                                {fs.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          fs.scope === 'global'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {fs.scope === 'global' ? 'Global' : 'Chi nhánh'}
                        </span>
                        <span className="block text-xs text-on-surface-variant mt-1">
                          {getBranchName(fs)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs text-on-surface-variant gap-0.5">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-on-surface">Bắt đầu:</span>
                            {new Date(fs.startDate).toLocaleString('vi-VN')}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-on-surface">Kết thúc:</span>
                            {new Date(fs.endDate).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface">
                          {fs.products?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDraft
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {fs.status === 'active' ? 'Đang chạy' : fs.status === 'draft' ? 'Nháp' : 'Đã tắt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(fs)}
                            disabled={isStaff}
                            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Chỉnh sửa"
                            type="button"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteFlashSale(fs._id || fs.id, fs)}
                            disabled={isStaff}
                            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Xóa"
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

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low/40 px-6 py-4">
            <span className="text-xs text-on-surface-variant">
              Hiển thị <span className="font-bold text-on-surface">{filteredFlashSales.length}</span> trên{' '}
              <span className="font-bold text-on-surface">{totalItems}</span> Flash Sale
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-bold transition hover:bg-surface-container-high disabled:opacity-40"
                type="button"
              >
                Trước
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-bold transition hover:bg-surface-container-high disabled:opacity-40"
                type="button"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── FORM MODAL ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
              <div className="flex items-center gap-2">
                <Zap className="text-secondary" />
                <h3 className="text-lg font-bold text-on-surface">
                  {selectedFlashSale ? 'Cập nhật Flash Sale' : 'Tạo mới Flash Sale'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="rounded-xl bg-error-container p-4 text-on-error-container flex items-center gap-2">
                  <AlertTriangle size={20} />
                  <span className="text-xs font-bold">{formError}</span>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">
                    Tên chương trình *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-surface-container-low border border-transparent focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition"
                    placeholder="Ví dụ: Chợ Đêm Giá Sốc"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">
                    Trạng thái hoạt động
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-surface-container-low border border-transparent focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition"
                  >
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="active">Kích hoạt ngay (Active)</option>
                    <option value="inactive">Tắt (Inactive)</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">
                    Mô tả ngắn
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-surface-container-low border border-transparent focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition h-20 resize-none"
                    placeholder="Mô tả chiến dịch..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">
                    Thời gian bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-surface-container-low border border-transparent focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">
                    Thời gian kết thúc *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-surface-container-low border border-transparent focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition"
                  />
                </div>

                {/* Scope configuration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">
                    Phạm vi áp dụng *
                  </label>
                  <select
                    disabled={isBranchManager}
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                    className="w-full bg-surface-container-low border border-transparent focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition disabled:opacity-50"
                  >
                    <option value="global">Toàn hệ thống (Global)</option>
                    <option value="branch">Riêng chi nhánh</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">
                    Chi nhánh áp dụng
                  </label>
                  {formData.scope === 'global' ? (
                    <input
                      type="text"
                      disabled
                      value="Áp dụng trên toàn bộ chi nhánh"
                      className="w-full bg-surface-container-low/50 border border-transparent rounded-xl py-3 px-4 text-sm outline-none cursor-not-allowed opacity-60"
                    />
                  ) : (
                    <select
                      disabled={isBranchManager}
                      required={formData.scope === 'branch'}
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full bg-surface-container-low border border-transparent focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition disabled:opacity-50"
                    >
                      <option value="">-- Chọn chi nhánh --</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Products Sub-Form */}
              <div className="border-t border-outline-variant pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-on-surface uppercase flex items-center gap-1">
                    <Package size={16} className="text-primary" />
                    Sản phẩm tham gia Flash Sale ({formData.products.length})
                  </h4>
                </div>

                {/* Add product line */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface-container-low p-4 rounded-xl items-end">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Sản phẩm</label>
                    <select
                      value={selectedProductIdToAdd}
                      onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                      className="w-full border border-outline-variant bg-surface-container-lowest rounded-lg py-2 px-3 text-xs outline-none focus:border-primary"
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.productName || p.name} ({formatVND(p.salePrice || p.price || 0)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Giá Flash Sale (đ)</label>
                    <input
                      type="number"
                      value={tempFlashPrice}
                      onChange={(e) => setTempFlashPrice(Number(e.target.value))}
                      className="w-full border border-outline-variant bg-surface-container-lowest rounded-lg py-2 px-3 text-xs outline-none focus:border-primary"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="space-y-1 flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Giới hạn số lượng</label>
                      <input
                        type="number"
                        value={tempLimitQty}
                        onChange={(e) => setTempLimitQty(Number(e.target.value))}
                        className="w-full border border-outline-variant bg-surface-container-lowest rounded-lg py-2 px-3 text-xs outline-none focus:border-primary"
                        placeholder="10"
                        min="1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProductItem}
                      className="h-9 px-3 rounded-lg bg-primary text-white font-bold text-xs self-end flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Products list sub-table */}
                {formData.products.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic text-center py-4 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
                    Chưa có sản phẩm nào được thêm. Hãy chọn sản phẩm ở trên.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-container-low text-[10px] font-bold uppercase text-on-surface-variant border-b border-outline-variant">
                          <th className="px-4 py-2.5">Tên sản phẩm</th>
                          <th className="px-4 py-2.5 text-right">Giá gốc</th>
                          <th className="px-4 py-2.5 text-right text-secondary">Giá Flash Sale</th>
                          <th className="px-4 py-2.5 text-center">Giới hạn số lượng</th>
                          <th className="px-4 py-2.5 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {formData.products.map((p) => {
                          const pInfo = getProductInfo(p.productId)
                          const originalPriceVal = pInfo?.salePrice || pInfo?.price || 0

                          return (
                            <tr key={p.productId} className="hover:bg-surface-container-low/20">
                              <td className="px-4 py-3 font-semibold text-on-surface">
                                {pInfo ? pInfo.productName || pInfo.name : 'Sản phẩm không rõ'}
                                <span className="block text-[10px] text-on-surface-variant font-normal mt-0.5">
                                  SKU: {pInfo?.sku}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-on-surface-variant">
                                {formatVND(originalPriceVal)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-secondary">
                                {formatVND(p.flashSalePrice)}
                              </td>
                              <td className="px-4 py-3 text-center font-semibold">
                                {p.limitQuantity}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductItem(p.productId)}
                                  className="text-red-500 hover:text-red-700 transition p-1 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Submit footer */}
              <div className="border-t border-outline-variant pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-3 font-bold text-on-surface transition hover:bg-surface-container-low"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/10 transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50"
                >
                  {isSubmittingForm ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default ManageFlashSalesPage
