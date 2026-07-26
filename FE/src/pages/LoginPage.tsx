import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '@hooks/useAuth'
import { authService } from '@services/authService'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader,
  ShoppingBasket,
  Globe,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import '@/styles/login.css'



type ApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError
  const msg = apiError.response?.data?.message || apiError.message || fallback
  
  // Dịch các thông báo lỗi từ backend sang Tiếng Việt
  if (msg === 'Invalid credentials') {
    return 'Email hoặc mật khẩu không chính xác.'
  }
  if (msg === 'Please verify your email before logging in') {
    return 'Vui lòng xác minh địa chỉ email trước khi đăng nhập.'
  }
  if (msg === 'Account is not active') {
    return 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt.'
  }
  if (msg === 'Please login with Google') {
    return 'Tài khoản này được đăng ký qua Google. Vui lòng chọn đăng nhập bằng Google.'
  }
  return msg
}

/**
 * Authenticates local or Google users and redirects them to their permitted area.
 * This boundary owns its UI state and delegates persistence to the appropriate service layer.
 */
export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [storeName, setStoreName] = useState('PMAN-Mart')

  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data?.settings?.store_name) {
          setStoreName(data.data.settings.store_name)
        }
      })
      .catch(() => {})
  }, [])

  const BACK_OFFICE_ROLES = ['admin', 'branch_manager', 'staff']

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Vui lòng điền đầy đủ thông tin các trường')
      return
    }

    try {
      const response = await login({ email, password })
      const role = response?.data?.user?.role
      if (role && BACK_OFFICE_ROLES.includes(role)) {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng nhập thất bại'))
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError('')
      if (!credentialResponse.credential) {
        setError('Đăng nhập bằng Google thất bại')
        return
      }

      const response = await authService.googleLogin(credentialResponse.credential)
      const role = response?.data?.user?.role
      if (role && BACK_OFFICE_ROLES.includes(role)) {
        navigate('/admin')
      } else {
        navigate('/')
      }
      window.location.reload()
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng nhập bằng Google thất bại'))
    }
  }

  const handleGoogleError = () => {
    setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.')
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-surface">
      {/* Left Side: Branding (Hidden on Mobile) */}
      <section className="hidden lg:flex lg:w-1/2 bg-primary relative flex-col justify-center px-16 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255, 255, 255, 0.1) 2px, transparent 2px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="z-10 max-w-lg">
          <h1 className="font-headline-lg text-headline-lg mb-4">
            Tươi ngon &amp; Tiện lợi ở cùng một nơi.
          </h1>
          <p className="font-body-lg text-body-lg text-white/80 leading-relaxed mb-12">
            Nền tảng hợp nhất cho mua sắm thông minh và quản lý chuỗi cửa hàng bán lẻ thời gian thực.
            Tham gia cùng hàng ngàn người dùng để tối ưu hóa nhu cầu thiết yếu hàng ngày của bạn.
          </p>

          <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
            <img
              alt="Smart Grocery Store"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAclkah2AZLzyLSEMAlukf82KEVgxK7CQATB0tN5JTDIG1F-CXEKG63LMq0g9ByOpjFbQc9M5ebEdaSdCmMyTKwfEnH00LvTFYlhPDScXBe2pYjUfG8-kaInRAWVmcOLdlllPgSrquNhuo-J4sJoUisQL5yhrHHJXUAaOZNZUuk8HOtHZowVlEPnNhX5_S_NL3FSZbMxs1RsX6oXFattYw_SHS1HqBJ3iG_8vAV-6dXbHxd73VGUj5OXX0vov0HGudgKtQtQAwKZF4"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>

        {/* Floating Badge */}
        <div className="absolute bottom-10 left-16 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <ShieldCheck size={20} className="text-white" />
          <span className="font-label-md text-label-md text-white">
            Nhà bán lẻ đạt chuẩn chất lượng
          </span>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <main className="w-full lg:w-1/2 bg-surface flex flex-col relative overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between lg:justify-end items-center px-6 lg:px-12 py-6 w-full gap-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingBasket size={16} className="text-white" />
            </div>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">
              {storeName}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all">
              <Globe size={20} />
              <span className="font-label-md text-label-md">VN</span>
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all group"
            >
              <span className="font-label-md text-label-md">Quay lại trang chủ</span>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </header>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-12">
          <div className="max-w-[440px] w-full mx-auto">
            {/* Desktop Brand */}
            <div className="hidden lg:flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary-container/20">
                <ShoppingBasket size={20} className="text-white" />
              </div>
              <span className="font-headline-md text-headline-md text-primary font-black tracking-tight">
                {storeName}
              </span>
            </div>

            {/* Intro */}
            <div className="mb-8">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
                Chào mừng quay lại
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Đăng nhập tài khoản để vào bảng điều khiển mua sắm.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-2">
                <AlertCircle size={20} />
                <span className="text-label-md">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="font-label-lg text-label-lg text-on-surface-variant ml-1">
                  Địa chỉ Email
                </label>
                <div className="relative group">
                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                    placeholder="email@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="font-label-lg text-label-lg text-on-surface-variant ml-1">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <Lock
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                    placeholder="Nhập mật khẩu của bạn"
                    disabled={loading}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowPassword(!showPassword)}
                    onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') setShowPassword(!showPassword); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer flex items-center justify-center h-full w-10"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              {/* Utilities */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                  />
                  <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                    Duy trì đăng nhập
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="font-label-md text-label-md text-primary font-bold hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-label-lg text-label-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-4 font-label-md text-label-md text-on-surface-variant">
                  Hoặc tiếp tục bằng
                </span>
              </div>
            </div>

            {/* Google Login */}
            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            </div>

            {/* Footer */}
            <div className="mt-10 text-center transition-opacity duration-300">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Mới mua sắm lần đầu?{' '}
                <Link
                  to="/register"
                  className="text-primary font-bold hover:underline ml-1"
                >
                  Tạo tài khoản mới
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden w-full h-1 bg-primary-container" />
      </main>
    </div>
  )
}
/**
 * Customer-facing route component responsible for this standalone application screen.
 * UI state, loading behavior, and user actions are kept close to this route boundary.
 */
