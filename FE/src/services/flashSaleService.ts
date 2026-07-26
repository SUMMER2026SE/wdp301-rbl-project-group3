import apiClient from '@services/api'
import type { ApiResponse, FlashSale } from '@/types'

/**
 * Manages time-limited sales and retrieves their customer-facing offers.
 * Request construction and response normalization stay here so UI code remains presentation-focused.
 */
export const flashSaleService = {
  createFlashSale: async (data: any): Promise<ApiResponse<{ flashSale: FlashSale }>> => {
    const response = await apiClient.post('/api/flash-sales', data)
    return response.data
  },

  getFlashSales: async (params?: any): Promise<ApiResponse<{ data: FlashSale[]; total: number }>> => {
    const response = await apiClient.get('/api/flash-sales', { params })
    return response.data
  },

  getFlashSaleById: async (id: string): Promise<ApiResponse<{ flashSale: FlashSale }>> => {
    const response = await apiClient.get(`/api/flash-sales/${id}`)
    return response.data
  },

  updateFlashSale: async (id: string, data: any): Promise<ApiResponse<{ flashSale: FlashSale }>> => {
    const response = await apiClient.put(`/api/flash-sales/${id}`, data)
    return response.data
  },

  deleteFlashSale: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/api/flash-sales/${id}`)
    return response.data
  },

  getActiveFlashSale: async (branchId?: string): Promise<ApiResponse<{ flashSale: FlashSale | null }>> => {
    const response = await apiClient.get('/api/flash-sales/active', {
      params: branchId ? { branchId } : undefined,
    })
    return response.data
  },
}
export default flashSaleService
/**
 * Frontend API client module that centralizes requests and response contracts for one feature.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
