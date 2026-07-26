import apiClient from '@services/api'
import type { ApiResponse, User } from '@/types'

export interface ListUsersParams {
  page?: number
  limit?: number
  keyword?: string
  role?: 'admin' | 'branch_manager' | 'staff' | 'customer'
  status?: 'active' | 'inactive' | 'banned'
}

export interface ListUsersResult {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Exposes administrative account-management operations for back-office screens.
 * Request construction and response normalization stay here so UI code remains presentation-focused.
 */
export const adminUserService = {
  listUsers: async (params?: ListUsersParams): Promise<ApiResponse<ListUsersResult>> => {
    const response = await apiClient.get('/api/admin/users', { params })
    return response.data
  },

  lockUser: async (id: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.patch(`/api/admin/users/${id}/lock`)
    return response.data
  },

  unlockUser: async (id: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.patch(`/api/admin/users/${id}/unlock`)
    return response.data
  },
}
/**
 * Frontend API client module that centralizes requests and response contracts for one feature.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
