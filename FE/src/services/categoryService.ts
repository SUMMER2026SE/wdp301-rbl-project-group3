import apiClient from '@services/api'
import type { ApiResponse, Category } from '@/types'

export const categoryService = {
  // Get all categories (filterable by status/keyword/page/limit)
  getCategories: async (params?: {
    status?: 'active' | 'inactive';
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Category[] & { pagination?: { page: number; limit: number; total: number; totalPages: number } }>> => {
    const response = await apiClient.get('/api/categories', { params })
    const raw = response.data
    // Backend wraps response in: { success, data: { categories: [...] } } or { success, data: [...] }
    const rawList = raw.data?.categories ?? raw.data ?? []

    const normalized: Category[] = rawList.map((c: any) => ({
      ...c,
      status: (c.status === 'active' || c.status === 'true' || c.status === true) ? 'active' : 'inactive',
    }))

    const data = raw.data?.pagination 
      ? Object.assign(normalized, { pagination: raw.data.pagination }) 
      : normalized;

    return {
      success: raw.success,
      message: raw.message,
      data: data as any,
    }
  },

  // Get single category by ID
  getCategoryById: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await apiClient.get(`/api/categories/${id}`)
    const raw = response.data
    const c = raw.data?.category ?? raw.data
    const normalized = c ? {
      ...c,
      status: (c.status === 'active' || c.status === 'true' || c.status === true) ? 'active' : 'inactive',
    } : c

    return {
      success: raw.success,
      message: raw.message,
      data: normalized,
    }
  },

  // Create a new category
  createCategory: async (categoryData: { name: string; code: string; description?: string; status?: 'active' | 'inactive' }): Promise<ApiResponse<Category>> => {
    const response = await apiClient.post('/api/categories', categoryData)
    return response.data
  },

  // Update a category
  updateCategory: async (id: string, categoryData: Partial<{ name: string; code: string; description?: string; status?: 'active' | 'inactive' }>): Promise<ApiResponse<Category>> => {
    const response = await apiClient.patch(`/api/categories/${id}`, categoryData)
    return response.data
  },

  // Delete a category (sets status to inactive, or throws error if in use)
  deleteCategory: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await apiClient.delete(`/api/categories/${id}`)
    return response.data
  },
}
