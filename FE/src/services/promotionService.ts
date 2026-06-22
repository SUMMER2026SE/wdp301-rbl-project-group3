import apiClient from '@services/api'
import type { ApiResponse, VoucherLookupResponse, ActivePromotionsResponse } from '@/types'

export const promotionService = {
  // Get all active promotions for client display
  getActivePromotions: async (params?: {
    branchId?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<ActivePromotionsResponse>> => {
    const response = await apiClient.get('/api/promotions/active', { params })
    return response.data
  },

  // Lookup voucher information and validation state
  lookupVoucher: async (
    code: string,
    orderValue: number,
    branchId?: string
  ): Promise<ApiResponse<VoucherLookupResponse>> => {
    const response = await apiClient.get('/api/promotions/vouchers/lookup', {
      params: { code, orderValue, branchId },
    })
    return response.data
  },
}
