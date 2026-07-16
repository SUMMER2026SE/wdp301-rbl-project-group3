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
