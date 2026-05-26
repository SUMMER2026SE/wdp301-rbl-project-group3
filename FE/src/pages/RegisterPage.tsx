import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '@hooks/useAuth'
import { authService } from '@services/authService'
import { Mail, Lock, User as UserIcon, Phone, AlertCircle, Loader, CheckCircle } from 'lucide-react'

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return
    }

    try {
      await register({ fullName, email, password, phone: phone || undefined })
      setShowOtp(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'))
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setOtpLoading(true)

    try {
      await authService.verifyEmail(otp)
      setSuccess(true)
      setShowOtp(false)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired OTP'))
    } finally {
      setOtpLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError('')
      if (!credentialResponse.credential) {
        setError('Google login failed')
        return
      }

      await authService.googleLogin(credentialResponse.credential)
      navigate('/')
      window.location.reload() // Reload to update auth state
    } catch (err) {
      setError(getErrorMessage(err, 'Google login failed'))
    }
  }

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.')
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
              Registration Successful!
            </h2>
            <p className="text-body-md text-on-surface-variant mb-4">
              Your account has been verified. You can now sign in.
            </p>
            <p className="text-label-sm text-on-surface-variant">
              Redirecting to login page...
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
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Verify Email</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Please enter the 6-digit OTP sent to <span className="font-bold">{email}</span>.
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
                    Verifying...
                  </>
                ) : (
                  'Verify Account'
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
              Create Account
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Join WinMart+ today
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
                Full Name *
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
                  placeholder="John Doe"
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
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-label-md font-label-md text-on-surface mb-2"
              >
                Phone (Optional)
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
                  placeholder="+1 234 567 8900"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-label-md font-label-md text-on-surface mb-2"
              >
                Password *
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={20}
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="********"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-label-md font-label-md text-on-surface mb-2"
              >
                Confirm Password *
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={20}
                />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                  placeholder="********"
                  disabled={loading}
                />
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
                  Creating account...
                </>
              ) : (
                'Create Account'
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
                  Or continue with
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
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
