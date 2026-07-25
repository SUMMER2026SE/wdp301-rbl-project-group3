import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@services/authService'
import { Mail, Lock, AlertCircle, Loader, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { notify } from '@utils/toast'

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
 * Component hiển thị trang Quên mật khẩu.
 * Cho phép người dùng nhập email để nhận mã OTP và đặt lại mật khẩu mới.
 * Quy trình gồm 2 bước:
 * 1. Nhập email -> Gửi yêu cầu OTP
 * 2. Nhập mã OTP + Mật khẩu mới -> Cập nhật mật khẩu
 *
 * @author MinhLD
 */
export const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  
  /** Trạng thái điều hướng luồng: 'email' (Nhập email) hoặc 'otp' (Nhập mã xác thực & Đổi mật khẩu) */
  const [step, setStep] = useState<'email' | 'otp'>('email')
  
  /** Trạng thái lưu trữ địa chỉ email do người dùng nhập vào để xin cấp lại mật khẩu */
  const [email, setEmail] = useState('')
  
  /** Trạng thái lưu trữ mã OTP 6 số nhận được từ email */
  const [otp, setOtp] = useState('')
  
  /** Trạng thái lưu trữ mật khẩu mới người dùng muốn đặt */
  const [newPassword, setNewPassword] = useState('')
  
  /** Trạng thái lưu trữ mật khẩu nhập lại để đối chiếu (confirm) với mật khẩu mới */
  const [confirmPassword, setConfirmPassword] = useState('')
  
  /** Cờ (boolean) quản lý việc hiển thị (nhìn thấy) hoặc ẩn (dấu sao) mật khẩu mới */
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  /** Cờ (boolean) quản lý việc hiển thị (nhìn thấy) hoặc ẩn (dấu sao) xác nhận mật khẩu mới */
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  /** Trạng thái loading (true/false) khi đang gọi API, dùng để khóa nút bấm và hiển thị spinner */
  const [loading, setLoading] = useState(false)
  
  /** Trạng thái lưu trữ thông báo lỗi để hiển thị lên giao diện (UI) */
  const [error, setError] = useState('')
  
  /** Trạng thái lưu trữ thông báo thành công (Success Message) sau khi API phản hồi tốt */
  const [success, setSuccess] = useState('')

  /**
   * Xử lý gửi yêu cầu cấp mã OTP đến email của người dùng.
   * Kiểm tra tính hợp lệ của email và gọi API tương ứng.
   *
   * @param {FormEvent} e - Sự kiện submit form
   */
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault()
    // Đặt lại trạng thái thông báo trước khi gửi yêu cầu mới
    setError('')
    setSuccess('')
    
    // Validate dữ liệu đầu vào: Bắt buộc phải có email
    if (!email) {
      setError('Vui lòng nhập địa chỉ email của bạn')
      return
    }

    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setStep('otp')
      setSuccess('Nếu email của bạn tồn tại trong hệ thống, mã OTP đã được gửi đi.')
    } catch (err) {
      setError(getErrorMessage(err, 'Yêu cầu gửi mã OTP thất bại'))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Xử lý xác nhận mã OTP và đặt lại mật khẩu mới.
   * Validate độ dài mật khẩu và xác nhận mật khẩu khớp nhau trước khi gọi API.
   * Nếu thành công, chuyển hướng người dùng về trang Đăng nhập sau 3 giây.
   *
   * @param {FormEvent} e - Sự kiện submit form
   */
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    // Reset thông báo lỗi/thành công
    setError('')
    setSuccess('')

    // Kiểm tra xem mật khẩu mới và mật khẩu xác nhận có khớp không
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    
    if (newPassword.length < 8) {
      setError('Mật khẩu phải chứa ít nhất 8 ký tự')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(email, otp, newPassword)
      setSuccess('Mật khẩu đã được đặt lại thành công. Bạn đã có thể đăng nhập.')
      notify.success('Đổi mật khẩu thành công! Chuyển hướng đến trang đăng nhập...')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(getErrorMessage(err, 'Mã OTP không hợp lệ hoặc đã hết hạn'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8">
          
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-bold">
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              Quên mật khẩu
            </h1>
            <p className="text-body-md text-on-surface-variant">
              {step === 'email' ? 'Nhập email của bạn để nhận mã OTP' : 'Nhập mã OTP và mật khẩu mới'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg flex items-center gap-2">
              <AlertCircle size={20} className="shrink-0" />
              <span className="text-label-md">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-primary-container text-on-primary-container rounded-lg flex items-center gap-2">
              <CheckCircle size={20} className="shrink-0" />
              <span className="text-label-md">{success}</span>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-label-md font-label-md text-on-surface mb-2">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="email@example.com"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold text-label-lg hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="animate-spin" size={20} /> : 'Gửi mã OTP'}
              </button>
            </form>
          ) : (
             <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-2">
                  Mã OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-primary transition-all"
                  placeholder="000000"
                  disabled={loading || success.includes('successfully') || success.includes('thành công')}
                  required
                />
              </div>

              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="********"
                    disabled={loading || success.includes('successfully') || success.includes('thành công')}
                    required
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowNewPassword(!showNewPassword); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center h-full w-10"
                    aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="********"
                    disabled={loading || success.includes('successfully') || success.includes('thành công')}
                    required
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowConfirmPassword(!showConfirmPassword); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center h-full w-10"
                    aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiển thị xác nhận mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || success.includes('successfully') || success.includes('thành công')}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold text-label-lg hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="animate-spin" size={20} /> : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
