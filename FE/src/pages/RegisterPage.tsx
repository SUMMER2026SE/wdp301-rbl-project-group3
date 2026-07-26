import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '@hooks/useAuth'
import { authService } from '@services/authService'
import { Mail, Lock, User as UserIcon, Phone, AlertCircle, Loader, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { notify } from '@utils/toast'

type ApiError = {
  response?: {
    data?: {
      errors?: { message?: string }[]
      message?: string
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError
  const firstValidationMessage = apiError.response?.data?.errors?.[0]?.message
  return firstValidationMessage || apiError.response?.data?.message || apiError.message || fallback
}

/**
 * Collects account details and starts the email-verification registration flow.
 * This boundary owns its UI state and delegates persistence to the appropriate service layer.
 */
export const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, loading } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin các trường bắt buộc')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp')
      return
    }

    if (password.length < 8) {
      setError('Mật khẩu phải chứa ít nhất 8 ký tự')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Mật khẩu phải chứa ít nhất một chữ cái in hoa')
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Mật khẩu phải chứa ít nhất một chữ số')
      return
    }

    try {
      await register({ fullName, email, password, phone: phone || undefined })
      setShowOtp(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng ký thất bại'))
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setOtpLoading(true)

    try {
      await authService.verifyEmail(email, otp)
      setSuccess(true)
      setShowOtp(false)
      notify.success('Đăng ký và xác thực tài khoản thành công!')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(getErrorMessage(err, 'Mã OTP không hợp lệ hoặc đã hết hạn'))
    } finally {
      setOtpLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError('')
      if (!credentialResponse.credential) {
        setError('Đăng nhập Google thất bại')
        return
      }

      await authService.googleLogin(credentialResponse.credential)
      // Remove the token so they are not automatically logged in
      localStorage.removeItem('accessToken')
      notify.success('Đăng ký bằng Google thành công! Chuyển hướng đến trang đăng nhập...')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng nhập Google thất bại'))
    }
  }

  const handleGoogleError = () => {
    setError('Đăng nhập Google thất bại. Vui lòng thử lại.')
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-primary" size={32} />
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">
              Đăng ký thành công!
            </h2>
            <p className="text-body-md text-on-surface-variant mb-4">
              Tài khoản của bạn đã được xác thực. Hiện tại bạn đã có thể đăng nhập.
            </p>
            <p className="text-label-sm text-on-surface-variant">
              Đang chuyển hướng đến trang đăng nhập...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showOtp) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8 text-center">
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Xác thực Email</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Vui lòng nhập mã OTP gồm 6 chữ số đã được gửi tới <span className="font-bold">{email}</span>.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg flex items-center gap-2 text-left">
                <AlertCircle size={20} className="shrink-0" />
                <span className="text-label-md">{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full rounded-lg border border-transparent bg-surface-container-low px-4 py-4 text-center text-3xl font-black tracking-[0.5em] outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                required
              />
              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold text-label-lg hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Đang xác thực...
                  </>
                ) : (
                  'Xác thực tài khoản'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              Tạo tài khoản
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Tham gia PMAN-Mart ngay hôm nay
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="text-label-md">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="block text-label-md font-label-md text-on-surface mb-2"
              >
                Họ và tên *
              </label>
              <div className="relative">
                <UserIcon
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={20}
                />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-label-md font-label-md text-on-surface mb-2"
              >
                Email *
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={20}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="email@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-label-md font-label-md text-on-surface mb-2"
              >
                Số điện thoại (Tùy chọn)
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={20}
                />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Ví dụ: 0912345678"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-label-md font-label-md text-on-surface mb-2"
              >
                Mật khẩu *
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={20}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="********"
                  disabled={loading}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowPassword(!showPassword)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(!showPassword); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center h-full w-10"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-label-md font-label-md text-on-surface mb-2"
              >
                Nhập lại mật khẩu *
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={20}
                />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="********"
                  disabled={loading}
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
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold text-label-lg hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Đang tạo tài khoản...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-label-sm">
                <span className="px-4 bg-surface-container-lowest text-on-surface-variant">
                  Hoặc tiếp tục bằng
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
              width="100%"
            />
          </div>

          <div className="mt-6 text-center text-label-md text-on-surface-variant">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
/**
 * Customer-facing route component responsible for this standalone application screen.
 * UI state, loading behavior, and user actions are kept close to this route boundary.
 */
