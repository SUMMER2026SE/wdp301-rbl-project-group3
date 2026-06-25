import { useState, useEffect } from 'react'
import { 
  Layers, 
  Search, 
  Loader2, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertCircle,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  Info
} from 'lucide-react'
import { categoryService } from '@services/categoryService'
import { useAuth } from '@hooks/useAuth'
import type { Category } from '@/types'

export const ManageCategoriesPage = () => {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'

  // State variables
  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Pagination states
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedStatus])

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page,
        limit
      }
      if (searchQuery.trim()) {
        params.keyword = searchQuery.trim()
      }
      if (selectedStatus) {
        params.status = selectedStatus
      }
      
      const response = await categoryService.getCategories(params)
      if (response.success) {
        setCategoriesList(response.data)
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1)
          setTotalCount(response.data.pagination.total || 0)
        } else {
          setTotalPages(1)
          setTotalCount(response.data.length || 0)
        }
      } else {
        setError(response.message || 'Không thể tải danh sách danh mục.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi kết nối với máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  // Reload list when search query, filter, or page changes (with debounce)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCategories()
    }, 450)
    
    return () => clearTimeout(delayDebounce)
  }, [searchQuery, selectedStatus, page])

  // Open modal for creating category
  const handleOpenCreateModal = () => {
    if (!isAdmin) return
    setEditingCategory(null)
    setName('')
    setCode('')
    setDescription('')
    setStatus('active')
    setFormError(null)
    setModalOpen(true)
  }

  // Open modal for editing category
  const handleOpenEditModal = (category: Category) => {
    if (!isAdmin) return
    setEditingCategory(category)
    setName(category.name)
    setCode(category.code)
    setDescription(category.description || '')
    setStatus(category.status)
    setFormError(null)
    setModalOpen(true)
  }

  // Save form handler (create or update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    // Simple client-side validation
    if (!name.trim() || name.trim().length < 2) {
      setFormError('Tên danh mục phải có ít nhất 2 ký tự.')
      return
    }
    if (!code.trim() || code.trim().length < 2) {
      setFormError('Mã danh mục phải có ít nhất 2 ký tự.')
      return
    }

    try {
      setIsSubmitting(true)
      setFormError(null)

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        status,
      }

      let res
      if (editingCategory) {
        res = await categoryService.updateCategory(editingCategory._id, payload)
      } else {
        res = await categoryService.createCategory(payload)
      }

      if (res.success) {
        setModalOpen(false)
        fetchCategories() // Refresh list
      } else {
        setFormError(res.message || 'Lưu danh mục thất bại. Vui lòng kiểm tra lại.')
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi lưu danh mục.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete/Deactivate category handler
  const handleDeleteCategory = async (category: Category) => {
    if (!isAdmin) return

    const confirmText = `Bạn có chắc chắn muốn ngưng hoạt động danh mục "${category.name}" (Mã: ${category.code})?\nLưu ý: Thao tác này sẽ chuyển đổi trạng thái của danh mục sang "Ngừng hoạt động".`
    
    if (window.confirm(confirmText)) {
      try {
        setLoading(true)
        setError(null)
        
        const res = await categoryService.deleteCategory(category._id)
        if (res.success) {
          alert(`Đã chuyển trạng thái danh mục "${category.name}" sang ngừng hoạt động thành công.`)
          fetchCategories()
        } else {
          setError(res.message || 'Xóa danh mục thất bại.')
        }
      } catch (err: any) {
        // Catch 409 Conflict when category is in use
        if (err.response?.status === 409 || err.status === 409 || err.message?.includes('409') || err.response?.data?.message?.includes('in use')) {
          setError(`Không thể xóa danh mục này vì hiện tại có sản phẩm đang thuộc danh mục "${category.name}". Vui lòng xóa hoặc chuyển các sản phẩm đó sang danh mục khác trước.`)
        } else {
          setError(err.response?.data?.message || err.message || 'Lỗi khi xóa danh mục.')
        }
      } finally {
        setLoading(false)
      }
    }
  }

  // Helpers for UI rendering
  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-success/10 text-success'
      : 'bg-outline-variant/40 text-on-surface-variant'
  }

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary font-mono">Back-Office</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl flex items-center gap-2">
            <Layers size={28} className="text-primary" />
            Quản lý Danh mục Sản phẩm
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Tạo lập và quản lý các danh mục phân loại hàng hóa trong hệ thống siêu thị.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-on-primary-fixed-variant shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            Thêm danh mục
          </button>
        )}
      </section>

      {/* ── FILTERS BAR ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-5 pl-11 focus:ring-2 focus:ring-primary transition-all text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
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
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>
      </section>

      {/* ── ERROR MESSAGE ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      {loading && categoriesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant">
          <Loader2 size={36} className="text-primary animate-spin mb-3" />
          <p className="text-sm text-on-surface-variant font-medium">Đang tải danh sách danh mục...</p>
        </div>
      ) : categoriesList.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <Layers size={48} className="mx-auto mb-4 text-on-surface-variant opacity-60" />
          <h3 className="text-lg font-bold text-on-surface">Không tìm thấy danh mục nào</h3>
          <p className="mt-2 text-sm text-on-surface-variant max-w-sm mx-auto">
            Không tìm thấy danh mục nào khớp với từ khóa tìm kiếm hoặc bộ lọc bạn chọn.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="p-4 font-bold text-on-surface-variant text-center w-16">STT</th>
                  <th className="p-4 font-bold text-on-surface-variant w-40">Mã danh mục</th>
                  <th className="p-4 font-bold text-on-surface-variant w-56">Tên danh mục</th>
                  <th className="p-4 font-bold text-on-surface-variant">Mô tả</th>
                  <th className="p-4 font-bold text-on-surface-variant text-center w-36">Trạng thái</th>
                  <th className="p-4 font-bold text-on-surface-variant w-44">Ngày tạo</th>
                  {isAdmin && <th className="p-4 font-bold text-on-surface-variant text-center w-32">Hành động</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {categoriesList.map((cat, idx) => {
                  const isActiveState = cat.status === 'active'
                  
                  return (
                    <tr key={cat._id} className="hover:bg-surface-container-low/20 transition-colors">
                      {/* STT */}
                      <td className="p-4 text-center font-semibold text-on-surface-variant">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      
                      {/* Category Code */}
                      <td className="p-4 font-mono font-bold text-primary text-xs uppercase">
                        {cat.code}
                      </td>
                      
                      {/* Category Name */}
                      <td className="p-4 font-bold text-on-surface">
                        {cat.name}
                      </td>
                      
                      {/* Description */}
                      <td className="p-4 text-on-surface-variant font-medium max-w-xs truncate" title={cat.description}>
                        {cat.description || <span className="italic opacity-30 text-xs">Không có mô tả</span>}
                      </td>
                      
                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(cat.status)}`}>
                          {isActiveState ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {getStatusLabel(cat.status)}
                        </span>
                      </td>
                      
                      {/* CreatedAt */}
                      <td className="p-4 text-on-surface-variant text-xs">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar size={12} className="text-on-surface-variant" />
                          {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                      </td>
                      
                      {/* Actions (Admin only) */}
                      {isAdmin && (
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(cat)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all"
                              title="Chỉnh sửa danh mục"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-error/10 text-error hover:bg-error/20 active:scale-95 transition-all"
                              title="Ngừng hoạt động"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low/30 px-6 py-4 rounded-b-2xl">
              <div className="text-xs font-semibold text-on-surface-variant">
                Hiển thị <span className="font-bold text-on-surface">{categoriesList.length}</span> trên <span className="font-bold text-on-surface">{totalCount}</span> danh mục (Trang {page} / {totalPages})
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE/EDIT MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-low max-w-md w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant p-4 bg-surface-container-high">
              <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
                <Layers size={20} className="text-primary" />
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-error-container text-on-error-container rounded-xl border border-error/20 text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Rau Củ Quả, Sữa & Bơ..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              {/* Category Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                  Mã danh mục *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory} // Disable editing the code once created to prevent breaking references
                  placeholder="Ví dụ: RAUCU, SUA"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono uppercase disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:cursor-not-allowed"
                />
                {!editingCategory && (
                  <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                    <Info size={10} /> Viết hoa liền nhau, không dấu, dùng để liên kết sản phẩm.
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">Mô tả</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả tóm tắt về danh mục hàng hóa này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-outline-variant mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-surface-container-highest hover:bg-surface-container-high-variant text-on-surface px-4 py-2.5 rounded-xl font-bold text-xs transition-all border border-outline-variant/30 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-on-primary-fixed-variant disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
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
