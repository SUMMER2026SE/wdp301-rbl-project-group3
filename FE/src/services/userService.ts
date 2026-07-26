import apiClient from '@services/api'
import type { User, UpdateProfileData, ApiResponse } from '@/types'

/**
 * Provides authenticated customer profile and account-management requests.
 * Request construction and response normalization stay here so UI code remains presentation-focused.
 */
export const userService = {
  // Get user profile
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.get('/api/users/me')
    return response.data
  },

  // Update user profile
  updateProfile: async (
    data: UpdateProfileData,
  ): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.patch('/api/users/me', data)
    return response.data
  },

  // Update user avatar
  updateAvatar: async (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await apiClient.patch('/api/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
/**
 * Frontend API client module that centralizes requests and response contracts for one feature.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
