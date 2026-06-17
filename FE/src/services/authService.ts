import apiClient from '@services/api'
import type {
  AuthResponse,
  User,
  RegisterData,
  LoginData,
  ChangePasswordData,
  ApiResponse,
} from '@/types'

export const authService = {
  // Register new user
  register: async (data: RegisterData): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/register', data)
    return response.data
  },

  // Verify email with email and otp
  verifyEmail: async (email: string, otp: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/verify-email', { email, otp })
    return response.data
  },

  // Login with email and password
  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/api/auth/login', data)
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken)
    }
    return response.data
  },

  // Login with Google
  googleLogin: async (idToken: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/api/auth/google-login', { idToken })
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken)
    }
    return response.data
  },

  // Refresh access token
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await apiClient.post('/api/auth/refresh-token')
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken)
    }
    return response.data
  },

  // Logout current session
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/api/auth/logout')
    localStorage.removeItem('accessToken')
    return response.data
  },

  // Logout from all devices
  logoutAll: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/logout-all')
    localStorage.removeItem('accessToken')
    return response.data
  },

  // Request password reset
  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/api/auth/forgot-password', { email })
    return response.data
  },

  // Reset password with token
  resetPassword: async (
    token: string,
    newPassword: string,
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/api/auth/reset-password', {
      token,
      newPassword,
    })
    localStorage.removeItem('accessToken')
    return response.data
  },

  // Change password (authenticated)
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/api/auth/change-password', data)
    localStorage.removeItem('accessToken')
    return response.data
  },

  // Get current user info
  getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.get('/api/users/me')
    return response.data
  },

  // Request email verification OTP
  requestEmailVerificationOtp: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/request-email-otp')
    return response.data
  },

  // Request password change OTP
  requestPasswordChangeOtp: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/request-password-change-otp')
    return response.data
  },

  // Verify email using OTP
  verifyEmailOtp: async (otp: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/verify-email-otp', { otp })
    return response.data
  },

  // Change password using OTP
  changePasswordWithOtp: async (data: { otp: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/change-password-otp', data)
    localStorage.removeItem('accessToken')
    return response.data
  },
}
