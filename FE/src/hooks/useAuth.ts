import { useState, useEffect, useCallback } from 'react'
import { authService } from '@services/authService'
import type { User, LoginData, RegisterData, ChangePasswordData } from '@/types'

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

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await authService.getCurrentUser()
        setUser(response.data.user)
      } catch (err) {
        localStorage.removeItem('accessToken')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (data: LoginData) => {
    try {
      setError(null)
      setLoading(true)
      const response = await authService.login(data)
      setUser(response.data.user)
      return response
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Login failed')
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    try {
      setError(null)
      setLoading(true)
      const response = await authService.register(data)
      return response
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Registration failed')
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setError(null)
      await authService.logout()
      setUser(null)
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Logout failed')
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const logoutAll = useCallback(async () => {
    try {
      setError(null)
      await authService.logoutAll()
      setUser(null)
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Logout failed')
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    try {
      setError(null)
      const response = await authService.changePassword(data)
      // After password change, user needs to login again
      setUser(null)
      return response
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Password change failed')
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      setError(null)
      const response = await authService.getCurrentUser()
      setUser(response.data.user)
      return response.data.user
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to refresh user')
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    logoutAll,
    changePassword,
    refreshUser,
  }
}
