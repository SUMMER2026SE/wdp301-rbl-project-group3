import apiClient from '@services/api'
import type { ApiResponse, CompetitorProduct } from '@/types'

export const competitorProductService = {
  // Get crawled products from competitor
  getCompetitorProducts: async (params?: { keyword?: string; page?: number; limit?: number }): Promise<ApiResponse<CompetitorProduct[]> & { pagination?: any }> => {
    const response = await apiClient.get('/api/competitor-products', { params })
    const raw = response.data
    const rawList = raw.data?.items ?? []
    return {
      success: raw.success,
      message: raw.message,
      data: rawList,
      pagination: raw.data?.pagination,
    }
  },

  // Import selected competitor products into catalog
  importToCatalog: async (ids: string[]): Promise<ApiResponse<{ importedCount: number }>> => {
    const response = await apiClient.post('/api/competitor-products/import', { ids })
    return response.data
  },

  // Delete selected competitor products
  deleteCompetitorProducts: async (ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> => {
    const response = await apiClient.post('/api/competitor-products/delete', { ids })
    return response.data
  }
}
