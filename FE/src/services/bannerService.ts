import apiClient from '@services/api'
import type { ApiResponse, Banner } from '@/types'

/**
 * Retrieves and maintains promotional banners shown in storefront and admin views.
 * Request construction and response normalization stay here so UI code remains presentation-focused.
 */
export const bannerService = {
  createBanner: async (data: FormData): Promise<ApiResponse<{ banner: Banner }>> => {
    const response = await apiClient.post('/api/banners', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getBanners: async (params?: any): Promise<ApiResponse<{ items: Banner[]; total: number; page: number; limit: number; totalPages: number }>> => {
    const response = await apiClient.get('/api/banners', { params })
    return response.data
  },

  getBannerById: async (id: string): Promise<ApiResponse<{ banner: Banner }>> => {
    const response = await apiClient.get(`/api/banners/${id}`)
    return response.data
  },

  updateBanner: async (id: string, data: FormData): Promise<ApiResponse<{ banner: Banner }>> => {
    const response = await apiClient.patch(`/api/banners/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  deleteBanner: async (id: string): Promise<ApiResponse<{ banner: Banner }>> => {
    const response = await apiClient.delete(`/api/banners/${id}`)
    return response.data
  },

  getActiveBanners: async (): Promise<ApiResponse<{ banners: Banner[] }>> => {
    const response = await apiClient.get('/api/banners/active')
    return response.data
  },
}

export default bannerService
/**
 * Frontend API client module that centralizes requests and response contracts for one feature.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
