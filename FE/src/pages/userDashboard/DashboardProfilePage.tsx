import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { authService } from '@services/authService'
import { userService } from '@services/userService'
import { useAuth } from '@hooks/useAuth'
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Loader,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react'

/**
 * Định nghĩa cấu trúc lỗi trả về từ API backend.
 * Giúp TypeScript hiểu và gợi ý code chính xác khi bắt lỗi (catch error).
 */
type ApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

/**
 * Hàm tiện ích để trích xuất thông báo lỗi an toàn từ đối tượng error.
 * Nếu API trả về message cụ thể, sử dụng message đó.
 * Ngược lại, sử dụng câu thông báo mặc định (fallback).
 * 
 * @param {unknown} error - Đối tượng lỗi (có thể từ axios hoặc logic code)
 * @param {string} fallback - Thông báo lỗi mặc định
 * @returns {string} Thông báo lỗi cuối cùng để hiển thị cho người dùng
 */
const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError
  return apiError.response?.data?.message || apiError.message || fallback
}

/**
 * Component Quản lý Thông tin cá nhân (Profile).
 * Cho phép người dùng cập nhật họ tên, số điện thoại, ảnh đại diện (avatar).
 * Hỗ trợ chức năng xác thực email thông qua mã OTP (nếu email chưa được xác thực).
 *
 * @author MinhLD
 */
export const DashboardProfilePage = () => {
  const { user, refreshUser } = useAuth()

  /** Trạng thái lưu trữ họ và tên của người dùng đang chỉnh sửa trên form */
  const [fullName, setFullName] = useState('')
  
  /** Trạng thái lưu trữ số điện thoại liên hệ của người dùng */
  const [phone, setPhone] = useState('')
  
  /** Trạng thái đối tượng File vật lý khi người dùng chọn tải ảnh đại diện lên */
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  /** Trạng thái lưu trữ URL dạng Data URI (base64) để hiển thị ảnh xem trước trên giao diện */
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  /** Trạng thái loading toàn trang khi đang lưu form Profile */
  const [loading, setLoading] = useState(false)
  
  /** Trạng thái lưu trữ nội dung thông báo lỗi khi cập nhật thất bại */
  const [error, setError] = useState('')
  
  /** Trạng thái lưu trữ nội dung thông báo thành công khi cập nhật Profile hoàn tất */
  const [success, setSuccess] = useState('')

  /** Cờ bật/tắt (boolean) hộp thoại (modal) xác thực mã OTP cho email */
  const [showOtpModal, setShowOtpModal] = useState(false)
  
  /** Trạng thái lưu trữ chuỗi 6 số OTP do người dùng nhập vào ô xác thực */
  const [otp, setOtp] = useState('')
  
  /** Trạng thái loading riêng biệt dành riêng cho nút bấm gửi OTP */
  const [otpLoading, setOtpLoading] = useState(false)
  
  /** Trạng thái lưu trữ lỗi xác thực OTP (nếu nhập sai mã) */
  const [otpError, setOtpError] = useState('')

  /**
   * Hook đồng bộ dữ liệu (Sync hook): Tự động điền dữ liệu của user vào form
   * mỗi khi component được mount hoặc khi object `user` thay đổi.
   */
  useEffect(() => {
    if (user) {
      setFullName(user.fullName)
      setPhone(user.phone || '')
      setAvatarPreview(user.avatarUrl || null)
    }
  }, [user])

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  /**
   * Xử lý lưu thông tin cá nhân (Họ tên, Số điện thoại) và Ảnh đại diện lên server.
   * Nếu có upload ảnh mới, gọi API updateAvatar trước.
   * Sau khi thành công, gọi refreshUser() để cập nhật lại context toàn cục.
   *
   * @param {FormEvent} event - Sự kiện submit form
   */
  const handleUpdateProfile = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (avatarFile) {
        await userService.updateAvatar(avatarFile)
      }

      await userService.updateProfile({ fullName, phone: phone || undefined })
      await refreshUser()

      setSuccess('Cập nhật thông tin tài khoản thành công.')
      setAvatarFile(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Cập nhật thông tin thất bại.'))
    } finally {
      setLoading(false)
    }
  }

  const handleRequestOtp = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await authService.requestEmailVerificationOtp()
      setShowOtpModal(true)
      setSuccess('Mã OTP đã được gửi về email của bạn.')
    } catch (err) {
      setError(getErrorMessage(err, 'Yêu cầu gửi mã OTP thất bại.'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault()
    setOtpError('')
    setOtpLoading(true)

    try {
      await authService.verifyEmailOtp(otp)
      setShowOtpModal(false)
      setOtp('')
      setSuccess('Xác thực email thành công.')
      await refreshUser()
    } catch (err) {
      setOtpError(getErrorMessage(err, 'Mã OTP không chính xác.'))
    } finally {
      setOtpLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Loader className="animate-spin" size={20} />
          Đang tải thông tin tài khoản...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-primary">Hồ sơ</p>
        <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
          Thông tin cá nhân
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Cập nhật chi tiết liên lạc của bạn để quá trình nhận hàng và bảo mật tài khoản tốt hơn.
        </p>
      </section>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-error-container p-4 text-on-error-container">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <span className="text-sm font-bold">{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-2 rounded-lg bg-primary-container p-4 text-on-primary-container">
          <CheckCircle size={20} className="mt-0.5 shrink-0" />
          <span className="text-sm font-bold">{success}</span>
        </div>
      ) : null}

      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <form
          onSubmit={handleUpdateProfile}
          className="grid gap-6 lg:grid-cols-[12rem_1fr]"
        >
          <div>
            <div className="relative mx-auto h-32 w-32 lg:mx-0">
              <div className="h-full w-full overflow-hidden rounded-full bg-surface-container-high">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Xem trước ảnh đại diện" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                    <UserIcon size={46} />
                  </div>
                )}
              </div>
              <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-sm transition-colors hover:bg-on-primary-fixed-variant">
                <Camera size={18} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={loading}
                  title="Tải ảnh đại diện lên"
                  aria-label="Tải ảnh đại diện lên"
                />
              </label>
            </div>
            <p className="mt-3 text-center text-xs text-on-surface-variant lg:text-left">
              Khuyên dùng ảnh định dạng JPG hoặc PNG.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-bold text-on-surface">Họ và tên</label>
              <div className="relative">
                <UserIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={18}
                />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-transparent bg-surface-container-low py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-bold text-on-surface">Email</label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                    size={18}
                  />
                  <input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-lg border border-transparent bg-surface-container-low py-3 pl-10 pr-4 text-sm text-on-surface-variant"
                  />  
                </div>

                {user.isEmailVerified ? (
                  <div className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary-container px-3 py-2 text-sm font-bold text-on-primary-container">
                    <ShieldCheck size={18} />
                    Đã xác thực
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-secondary-container hover:text-on-secondary-container disabled:opacity-50"
                  >
                    Xác thực Email
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-bold text-on-surface">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={18}
                />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={loading}
                  placeholder="Nhập số điện thoại của bạn"
                  className="w-full rounded-lg border border-transparent bg-surface-container-low py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {showOtpModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-xl">
            <h2 className="text-xl font-black text-on-surface">Xác thực Email</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Nhập mã OTP gồm 6 chữ số đã được gửi tới <span className="font-bold">{user.email}</span>.
            </p>

            {otpError ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-error-container p-3 text-on-error-container">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="text-sm font-bold">{otpError}</span>
              </div>
            ) : null}

            <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, ''))}
                className="w-full rounded-lg border border-transparent bg-surface-container-low px-4 py-3 text-center text-2xl font-black tracking-[0.5em] outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant disabled:opacity-50"
                >
                  {otpLoading ? <Loader className="animate-spin" size={18} /> : 'Xác thực'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
