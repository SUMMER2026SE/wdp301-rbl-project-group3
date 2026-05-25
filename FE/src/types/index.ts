export interface User {
  id: string
  fullName: string
  email: string
  role: 'customer' | 'admin'
  avatarUrl?: string
  phone?: string
  isEmailVerified: boolean
  status: 'active' | 'inactive' | 'banned'
  authProvider: 'local' | 'google'
  createdAt?: Date
  updatedAt?: Date
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface RegisterData {
  fullName: string
  email: string
  password: string
  phone?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface UpdateProfileData {
  fullName?: string
  phone?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ErrorResponse {
  success: false
  message: string
  statusCode?: number
}
