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

export const DashboardProfilePage = () => {
  const { user, refreshUser } = useAuth()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

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

      setSuccess('Profile updated successfully.')
      setAvatarFile(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile.'))
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
      setSuccess('OTP sent to your email.')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send OTP.'))
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
      setSuccess('Email verified successfully.')
      await refreshUser()
    } catch (err) {
      setOtpError(getErrorMessage(err, 'Invalid OTP.'))
    } finally {
      setOtpLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Loader className="animate-spin" size={20} />
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-primary">Profile</p>
        <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
          Personal information
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Keep your contact details current for smoother deliveries and account recovery.
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
                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
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
                  title="Upload avatar"
                  aria-label="Upload avatar"
                />
              </label>
            </div>
            <p className="mt-3 text-center text-xs text-on-surface-variant lg:text-left">
              JPG or PNG recommended.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-bold text-on-surface">Full Name</label>
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
                    Verified
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-secondary-container hover:text-on-secondary-container disabled:opacity-50"
                  >
                    Verify Email
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-bold text-on-surface">
                Phone Number
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
                  placeholder="Add your phone number"
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
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
            <h2 className="text-xl font-black text-on-surface">Verify Email</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Enter the 6-digit OTP sent to <span className="font-bold">{user.email}</span>.
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant disabled:opacity-50"
                >
                  {otpLoading ? <Loader className="animate-spin" size={18} /> : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
