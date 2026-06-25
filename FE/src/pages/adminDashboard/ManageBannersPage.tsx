import { useEffect, useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  RefreshCw,
  X,
  Layers,
  Link as LinkIcon,
  Ticket,
} from 'lucide-react'
import { bannerService } from '@/services/bannerService'
import { useAuth } from '@hooks/useAuth'
import type { Banner } from '@/types'

export const ManageBannersPage = () => {
  const { user } = useAuth()
  const isStaff = user?.role === 'staff'

  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  // Form Fields
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [order, setOrder] = useState('0')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      setErrorMsg('')
      const res = await bannerService.getBanners()
      if (res.success && res.data) {
        setBanners(res.data.items || [])
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch banners')
    } finally {
      setIsLoading(false)
    }
  };

  const openCreateModal = () => {
    if (isStaff) return
    setEditingBanner(null)
    setTitle('')
    setSubtitle('')
    setDescription('')
    setPromoCode('')
    setLinkUrl('')
    setStatus('active')
    setOrder('0')
    setImageFile(null)
    setPreviewUrl(null)
    setIsModalOpen(true)
  }

  const openEditModal = (banner: Banner) => {
    if (isStaff) return
    setEditingBanner(banner)
    setTitle(banner.title)
    setSubtitle(banner.subtitle)
    setDescription(banner.description || '')
    setPromoCode(banner.promoCode || '')
    setLinkUrl(banner.linkUrl || '')
    setStatus(banner.status)
    setOrder(String(banner.order || 0))
    setImageFile(null)
    setPreviewUrl(banner.imageUrl)
    setIsModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleStatusToggle = async (banner: Banner) => {
    if (isStaff) return
    try {
      setIsLoading(true)
      const nextStatus = banner.status === 'active' ? 'inactive' : 'active'
      
      const formData = new FormData()
      formData.append('status', nextStatus)
      
      const res = await bannerService.updateBanner(banner._id || banner.id, formData)
      if (res.success) {
        showSuccess(`Đã thay đổi trạng thái banner thành công!`)
        fetchBanners()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể cập nhật trạng thái')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (banner: Banner) => {
    if (isStaff) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return

    try {
      setIsLoading(true)
      const id = banner._id || banner.id
      const res = await bannerService.deleteBanner(id)
      if (res.success) {
        showSuccess('Đã xóa banner thành công!')
        fetchBanners()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể xóa banner')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isStaff) return
    setErrorMsg('')

    if (!title || !subtitle) {
      setErrorMsg('Vui lòng điền Tiêu đề và Phụ đề.')
      return
    }

    if (!editingBanner && !imageFile) {
      setErrorMsg('Vui lòng chọn ảnh cho banner mới.')
      return
    }

    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      formData.append('description', description)
      formData.append('promoCode', promoCode)
      formData.append('linkUrl', linkUrl)
      formData.append('status', status)
      formData.append('order', order)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      let res
      if (editingBanner) {
        res = await bannerService.updateBanner(editingBanner._id || editingBanner.id, formData)
      } else {
        res = await bannerService.createBanner(formData)
      }

      if (res.success) {
        showSuccess(editingBanner ? 'Cập nhật banner thành công!' : 'Tạo banner mới thành công!')
        setIsModalOpen(false)
        fetchBanners()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi lưu banner')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-headline-md font-headline-md flex items-center gap-3 text-on-surface">
            <Layers className="text-primary w-8 h-8" />
            Quản lý Banner Động
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Thiết lập các banner chiến dịch nổi bật hiển thị ở đầu trang chủ khách hàng.
          </p>
        </div>

        {!isStaff && (
          <button
            onClick={openCreateModal}
            className="beveled-btn bg-primary hover:bg-primary/95 text-on-primary px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all w-fit shadow-md"
          >
            <Plus size={18} />
            Thêm Banner Mới
          </button>
        )}
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-3">
          <div className="bg-emerald-500 text-white rounded-full p-1">
            <Check size={16} />
          </div>
          <span className="font-bold text-sm">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={20} />
          <span className="font-bold text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Main List Grid */}
      {isLoading && banners.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/30">
          <ImageIcon className="mx-auto w-12 h-12 text-on-surface-variant/40 mb-3" />
          <h3 className="font-bold text-lg text-on-surface">Không tìm thấy banner nào</h3>
          <p className="text-sm text-on-surface-variant mt-1">Vui lòng bấm Thêm Banner Mới để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div
              key={banner._id || banner.id}
              className={`bg-surface-container rounded-2xl border ${
                banner.status === 'active' ? 'border-primary/20' : 'border-outline-variant/30 opacity-75'
              } overflow-hidden shadow-sm flex flex-col`}
            >
              {/* Banner Preview Graphic */}
              <div className="h-48 relative overflow-hidden bg-primary/10">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-end p-5 text-white">
                  {banner.promoCode && (
                    <span className="bg-secondary text-white text-[10px] font-black px-2 py-0.5 rounded-full w-fit mb-2 uppercase flex items-center gap-1">
                      <Ticket size={10} />
                      {banner.promoCode}
                    </span>
                  )}
                  <h3 className="font-headline-sm text-lg leading-tight font-black">{banner.title}</h3>
                  <p className="text-xs text-primary-fixed font-bold">{banner.subtitle}</p>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                      banner.status === 'active'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {banner.status === 'active' ? 'Đang hoạt động' : 'Tạm ẩn'}
                  </span>
                  <span className="bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                    Thứ tự: {banner.order}
                  </span>
                </div>
              </div>

              {/* Banner Metadata & Controls */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  {banner.description && (
                    <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{banner.description}</p>
                  )}
                  {banner.linkUrl && (
                    <p className="text-xs text-primary font-bold flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-lg w-fit">
                      <LinkIcon size={12} />
                      {banner.linkUrl}
                    </p>
                  )}
                </div>

                {!isStaff && (
                  <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 mt-auto">
                    <button
                      onClick={() => handleStatusToggle(banner)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        banner.status === 'active'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {banner.status === 'active' ? 'Tạm ẩn banner' : 'Kích hoạt'}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(banner)}
                        className="p-2 hover:bg-surface-container-high rounded-xl text-primary transition-all border border-outline-variant/20"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(banner)}
                        className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all border border-red-100"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <h2 className="text-lg font-bold text-on-surface">
                {editingBanner ? 'Cập nhật Banner' : 'Tạo Banner Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Form Image Upload & Preview */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">Ảnh banner *</label>
                <div className="relative border-2 border-dashed border-outline-variant/50 rounded-xl h-44 flex flex-col items-center justify-center bg-surface-container-lowest overflow-hidden group">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <label className="bg-white/90 text-on-surface text-xs font-bold px-3 py-2 rounded-lg cursor-pointer hover:bg-white transition-all">
                          Thay đổi ảnh
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full p-4">
                      <ImageIcon className="w-8 h-8 text-on-surface-variant/40 mb-2" />
                      <span className="text-xs text-on-surface-variant font-bold">Kéo thả hoặc click để chọn tệp</span>
                      <span className="text-[10px] text-on-surface-variant/70 mt-0.5">JPEG, PNG, WEBP (Tối đa 5MB)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Tiêu đề chính *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Fresh Food Festival"
                    className="w-full bg-surface-container-high rounded-xl border border-outline-variant/30 px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-all text-on-surface"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Phụ đề (Phần trăm/Offer) *</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ví dụ: Up to 30% OFF"
                    className="w-full bg-surface-container-high rounded-xl border border-outline-variant/30 px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-all text-on-surface"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Mô tả ngắn</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chiến dịch..."
                  rows={2}
                  className="w-full bg-surface-container-high rounded-xl border border-outline-variant/30 px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-all text-on-surface resize-none"
                />
              </div>

              {/* PromoCode & Target Link */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Mã voucher đi kèm</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Ví dụ: FRESH2026"
                    className="w-full bg-surface-container-high rounded-xl border border-outline-variant/30 px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-all text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Liên kết / Nút chuyển</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Ví dụ: #recommended-products"
                    className="w-full bg-surface-container-high rounded-xl border border-outline-variant/30 px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-all text-on-surface"
                  />
                </div>
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full bg-surface-container-high rounded-xl border border-outline-variant/30 px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-all text-on-surface"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Trạng thái</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-surface-container-high rounded-xl border border-outline-variant/30 px-3.5 py-2 text-sm focus:outline-none focus:border-primary transition-all text-on-surface"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm ẩn</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-6 bg-surface-container-lowest">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant/30 font-bold text-xs hover:bg-surface-container-high transition-all text-on-surface"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs hover:bg-primary/95 transition-all shadow-md flex items-center gap-2"
                >
                  {isLoading && <RefreshCw size={12} className="animate-spin" />}
                  {editingBanner ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
