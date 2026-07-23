import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Bell, CheckCircle, Loader, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { authService } from '@services/authService'

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
  return apiError.response?.data?.message || apiError.message || fallback
}

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(true)

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const resetPasswordFlow = () => {
    setIsChangingPassword(false)
    setOtpSent(false)
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleRequestOtp = async () => {
    setError('')
    setSuccess('')

    if (!user?.isEmailVerified) {
      setError('Vui lòng xác thực email trong trang Hồ sơ trước khi đổi mật khẩu.')
      return
    }

    setLoading(true)
    try {
      await authService.requestPasswordChangeOtp()
      setOtpSent(true)
      setSuccess('Mã OTP đã được gửi về email đã xác thực của bạn.')
    } catch (err) {
      setError(getErrorMessage(err, 'Gửi mã OTP thất bại.'))
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không trùng khớp.')
      return
    }

    setLoading(true)
    try {
      await authService.changePasswordWithOtp({ otp, newPassword })
      setSuccess('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')
      resetPasswordFlow()

      window.setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setError(getErrorMessage(err, 'Đổi mật khẩu thất bại.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-primary">Cài đặt</p>
        <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
          Tùy chọn tài khoản
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Quản lý thông báo, trạng thái xác thực email và bảo mật mật khẩu của bạn.
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

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="grid gap-4 border-b border-outline-variant p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <Bell size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-on-surface">Thông báo đẩy</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Nhận cập nhật đơn hàng, cảnh báo khuyến mãi và các thông báo khác.
              </p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center justify-self-start sm:justify-self-end">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={notifications}
              onChange={() => setNotifications((current) => !current)}
              aria-label="Chuyển đổi thông báo đẩy"
            />
            <span className="h-6 w-11 rounded-full bg-surface-container-highest transition-colors peer-checked:bg-primary peer-focus:ring-4 peer-focus:ring-primary/20" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <Lock size={22} />
              </div>
              <div>
                <h2 className="text-base font-black text-on-surface">Mật khẩu</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Thay đổi mật khẩu tài khoản bằng mã xác thực gửi về địa chỉ email đã đăng ký.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface-variant">
                  <ShieldCheck size={14} />
                  {user?.isEmailVerified ? 'Email đã xác thực' : 'Yêu cầu xác thực Email'}
                </div>
              </div>
            </div>

            {!isChangingPassword ? (
              <button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant"
              >
                Cập nhật
              </button>
            ) : null}
          </div>

          {isChangingPassword ? (
            <div className="mt-6 rounded-xl bg-surface-container-low p-4 sm:ml-[3.75rem]">
              {!otpSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-on-surface-variant">
                    Vui lòng gửi mã OTP trước. Sau khi xác minh, bạn có thể thiết lập mật khẩu mới.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={resetPasswordFlow}
                      className="rounded-lg px-4 py-2.5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant disabled:opacity-50"
                    >
                      {loading ? <Loader className="animate-spin" size={18} /> : 'Gửi mã OTP'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-on-surface">
                      Mã OTP
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full rounded-lg border border-transparent bg-surface-container-lowest px-3 py-3 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-on-surface">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full rounded-lg border border-transparent bg-surface-container-lowest px-3 py-3 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-on-surface">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="w-full rounded-lg border border-transparent bg-surface-container-lowest px-3 py-3 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetPasswordFlow}
                      className="rounded-lg px-4 py-2.5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant disabled:opacity-50"
                    >
                      {loading ? <Loader className="animate-spin" size={18} /> : 'Thay đổi'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
