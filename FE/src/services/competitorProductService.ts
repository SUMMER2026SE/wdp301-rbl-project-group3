import apiClient from '@services/api'
import type { ApiResponse, CompetitorProduct } from '@/types'

/**
 * Connects back-office product comparison screens to competitor-price data.
 * Request construction and response normalization stay here so UI code remains presentation-focused.
 */
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
  }
}
/**
 * Frontend API client module that centralizes requests and response contracts for one feature.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
