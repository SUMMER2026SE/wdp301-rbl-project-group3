import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@services/authService'
import { Mail, Lock, AlertCircle, Loader, CheckCircle, ArrowLeft } from 'lucide-react'

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

export const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!email) {
      setError('Please enter your email')
      return
    }

    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setStep('otp')
      setSuccess('If your email exists in our system, an OTP has been sent.')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to request OTP'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      // The API takes 'token' and 'newPassword', where 'token' is our OTP
      await authService.resetPassword(otp, newPassword)
      setSuccess('Password has been reset successfully. You can now login.')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired OTP'))
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
              Back to login
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              Forgot Password
            </h1>
            <p className="text-body-md text-on-surface-variant">
              {step === 'email' ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="your@email.com"
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
                {loading ? <Loader className="animate-spin" size={20} /> : 'Send OTP'}
              </button>
            </form>
          ) : (
             <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-primary transition-all"
                  placeholder="000000"
                  disabled={loading || success.includes('successfully')}
                  required
                />
              </div>

              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="********"
                    disabled={loading || success.includes('successfully')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-12 focus:ring-2 focus:ring-primary transition-all"
                    placeholder="********"
                    disabled={loading || success.includes('successfully')}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || success.includes('successfully')}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold text-label-lg hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="animate-spin" size={20} /> : 'Reset Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
