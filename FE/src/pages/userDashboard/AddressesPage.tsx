import { useState, useEffect } from 'react'
import { Edit2, MapPin, Plus, Trash2, Loader2, AlertCircle, X, Check } from 'lucide-react'
import { addressService } from '@/services/addressService'
import type { UserAddress } from '@/types'

export const AddressesPage = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)
  const [receiverName, setReceiverName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadAddresses = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await addressService.getAddresses()
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).addresses || []
        setAddresses(list)
      } else {
        setError(res.message || 'Không thể tải danh sách địa chỉ.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể kết nối dữ liệu địa chỉ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAddresses()
  }, [])

  const handleOpenAddModal = () => {
    setEditingAddress(null)
    setReceiverName('')
    setPhoneNumber('')
    setAddressDetail('')
    setIsDefault(addresses.length === 0) // default if first address
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (addr: UserAddress) => {
    setEditingAddress(addr)
    setReceiverName(addr.receiverName)
    setPhoneNumber(addr.phoneNumber)
    setAddressDetail(addr.addressDetail)
    setIsDefault(addr.isDefault)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return
    try {
      const res = await addressService.deleteAddress(addressId)
      if (res.success) {
        setAddresses((prev) => prev.filter((a) => a._id !== addressId))
      } else {
        alert(res.message || 'Xóa địa chỉ thất bại')
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      const res = await addressService.setDefault(addressId)
      if (res.success) {
        loadAddresses()
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Thao tác thất bại')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiverName.trim() || !phoneNumber.trim() || !addressDetail.trim()) {
      setFormError('Vui lòng nhập đầy đủ các trường bắt buộc.')
      return
    }

    setFormSubmitting(true)
    setFormError(null)

    try {
      if (editingAddress) {
        const res = await addressService.updateAddress(editingAddress._id, {
          receiverName,
          phoneNumber,
          addressDetail,
          isDefault,
        })
        if (res.success) {
          setIsModalOpen(false)
          loadAddresses()
        } else {
          setFormError(res.message || 'Cập nhật địa chỉ thất bại')
        }
      } else {
        const res = await addressService.addAddress({
          receiverName,
          phoneNumber,
          addressDetail,
          isDefault,
        })
        if (res.success) {
          setIsModalOpen(false)
          loadAddresses()
        } else {
          setFormError(res.message || 'Thêm địa chỉ thất bại')
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Lưu địa chỉ không thành công.')
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Sổ địa chỉ</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
            Địa chỉ nhận hàng
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Quản lý danh sách địa chỉ nhận hàng của bạn để sử dụng khi thanh toán.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant cursor-pointer"
        >
          <Plus size={18} />
          Thêm địa chỉ mới
        </button>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant">
          <Loader2 size={30} className="text-primary animate-spin mb-2" />
          <p className="text-xs text-on-surface-variant font-semibold">Đang tải danh sách địa chỉ...</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant border-dashed">
          <MapPin size={40} className="mx-auto mb-3 text-on-surface-variant opacity-40" />
          <p className="text-sm font-bold text-on-surface-variant">Bạn chưa lưu địa chỉ giao hàng nào</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-2 text-xs font-bold text-primary underline cursor-pointer"
          >
            Tạo địa chỉ đầu tiên ngay
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {addresses.map((address) => (
            <article
              key={address._id}
              className={`relative rounded-xl border bg-surface-container-lowest p-5 transition-all ${
                address.isDefault ? 'border-primary shadow-sm bg-primary/[0.01]' : 'border-outline-variant hover:border-primary/45'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <MapPin size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-black text-on-surface">Địa chỉ nhận</h2>
                    {address.isDefault ? (
                      <span className="rounded-full bg-primary-container px-2.5 py-1 text-xs font-bold text-on-primary-container">
                        Mặc định
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        className="text-xs text-primary font-bold hover:underline cursor-pointer"
                      >
                        Thiết lập mặc định
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-bold text-on-surface">
                    Người nhận: {address.receiverName} · {address.phoneNumber}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                    Địa chỉ chi tiết: {address.addressDetail}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(address)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary-container/10 cursor-pointer"
                    >
                      <Edit2 size={16} />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address._id)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-error transition-colors hover:bg-error-container/10 cursor-pointer"
                    >
                      <Trash2 size={16} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col text-on-surface">
            <div className="flex items-center justify-between border-b border-outline-variant p-5 bg-surface-container-low">
              <h3 className="text-lg font-black text-primary flex items-center gap-2">
                <MapPin className="text-primary w-5 h-5" />
                {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ giao hàng mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3.5 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-xs font-bold border border-error/15">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Tên người nhận *
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Nhập tên người nhận (ví dụ: Nguyễn Văn A)"
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Nhập số điện thoại liên hệ"
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Địa chỉ chi tiết *
                </label>
                <input
                  type="text"
                  required
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDefault(!isDefault)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    isDefault ? 'bg-primary border-primary text-white' : 'border-outline hover:border-primary/50'
                  }`}
                >
                  {isDefault && <Check size={14} />}
                </button>
                <span className="text-sm font-semibold text-on-surface-variant">
                  Đặt làm địa chỉ nhận hàng mặc định
                </span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-3 rounded-xl font-bold text-sm transition-all text-center border border-outline-variant/20 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 bg-primary hover:bg-on-primary-fixed-variant text-white px-4 py-3 rounded-xl font-bold text-sm transition-all text-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    'Lưu địa chỉ'
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
