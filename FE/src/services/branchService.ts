import apiClient from '@services/api'
import type { ApiResponse, Branch } from '@/types'

export const branchService = {
  // Get list of branches (filterable by status/keyword)
  getBranches: async (params?: { status?: 'active' | 'inactive'; keyword?: string }): Promise<ApiResponse<Branch[]>> => {
    const response = await apiClient.get('/api/branches', { params })
    const raw = response.data
    // Backend wraps response in: { success, data: { branches: [...] } } or { success, data: [...] }
    const rawList = raw.data?.branches ?? raw.data ?? []
    
    // Normalize branch properties
    const normalized: Branch[] = rawList.map((b: any) => ({
      ...b,
      name: b.name || b.branchName || 'Unnamed Branch',
      code: b.code || ('B-' + b._id.substring(b._id.length - 4).toUpperCase()),
      status: (b.status === 'active' || b.status === 'true' || b.status === true) ? 'active' : 'inactive',
    }))

    return {
      success: raw.success,
      message: raw.message,
      data: normalized,
    }
  },

  // Get details of a single branch by ID
  getBranchById: async (id: string): Promise<ApiResponse<Branch>> => {
    const response = await apiClient.get(`/api/branches/${id}`)
    const raw = response.data
    const b = raw.data?.branch ?? raw.data
    const normalized = b ? {
      ...b,
      name: b.name || b.branchName || 'Unnamed Branch',
      code: b.code || ('B-' + b._id.substring(b._id.length - 4).toUpperCase()),
      status: (b.status === 'active' || b.status === 'true' || b.status === true) ? 'active' : 'inactive',
    } : b

    return {
      success: raw.success,
      message: raw.message,
      data: normalized,
    }
  },

  // Create a new branch
  createBranch: async (branchData: Omit<Branch, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Branch>> => {
    const response = await apiClient.post('/api/branches', branchData)
    return response.data
  },

  // Update branch details
  updateBranch: async (id: string, branchData: Partial<Omit<Branch, '_id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Branch>> => {
    const response = await apiClient.patch(`/api/branches/${id}`, branchData)
    return response.data
  },

  // Toggle active/inactive status of a branch
  deactivateBranch: async (id: string): Promise<ApiResponse<Branch>> => {
    const response = await apiClient.delete(`/api/branches/${id}`)
    return response.data
  },
}
