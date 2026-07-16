import apiClient from '@services/api'
import type { ApiResponse, VoucherLookupResponse, ActivePromotionsResponse, Promotion, Voucher } from '@/types'

export const promotionService = {
  // Get all active promotions for client display
  getActivePromotions: async (params?: {
    branchId?: string
    page?: number
    limit?: number
    onlyClaimed?: boolean
  }): Promise<ApiResponse<ActivePromotionsResponse>> => {
    const response = await apiClient.get('/api/promotions/active', { params })
    return response.data
  },

  // Claim a voucher
  claimVoucher: async (code: string): Promise<ApiResponse<{ message: string; code: string }>> => {
    const response = await apiClient.post('/api/promotions/vouchers/claim', { code })
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

  // ─── ADMIN API METHODS ─────────────────────────────────────────────────────────

  // Get all promotions for admin/branch manager
  getPromotions: async (params?: {
    status?: string
    scope?: string
    branchId?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ data: Promotion[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>> => {
    const response = await apiClient.get('/api/promotions', { params })
    return response.data
  },

  // Create a new promotion
  createPromotion: async (data: {
    name: string
    description?: string
    discountType: 'percentage' | 'fixed_amount'
    discountValue: number
    maxDiscountAmount?: number
    minOrderAmount?: number
    scope: 'global' | 'branch'
    branchId?: string
    startDate: string
    endDate: string
    usageLimit?: number
    status?: 'draft' | 'active'
  }): Promise<ApiResponse<Promotion>> => {
    const response = await apiClient.post('/api/promotions', data)
    return response.data
  },

  // Get details of a single promotion
  getPromotion: async (id: string): Promise<ApiResponse<Promotion>> => {
    const response = await apiClient.get(`/api/promotions/${id}`)
    return response.data
  },

  // Update promotion
  updatePromotion: async (
    id: string,
    data: Partial<{
      name: string
      description: string
      discountType: 'percentage' | 'fixed_amount'
      discountValue: number
      maxDiscountAmount: number
      minOrderAmount: number
      startDate: string
      endDate: string
      usageLimit: number
      status: 'draft' | 'active' | 'inactive'
    }>
  ): Promise<ApiResponse<Promotion>> => {
    const response = await apiClient.patch(`/api/promotions/${id}`, data)
    return response.data
  },

  // Delete a promotion
  deletePromotion: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/api/promotions/${id}`)
    return response.data
  },

  // Activate a promotion
  activatePromotion: async (id: string): Promise<ApiResponse<Promotion>> => {
    const response = await apiClient.patch(`/api/promotions/${id}/activate`)
    return response.data
  },

  // Deactivate a promotion
  deactivatePromotion: async (id: string): Promise<ApiResponse<Promotion>> => {
    const response = await apiClient.patch(`/api/promotions/${id}/deactivate`)
    return response.data
  },

  // Generate vouchers for a promotion
  generateVouchers: async (
    id: string,
    code: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post(`/api/promotions/${id}/vouchers/generate`, { code })
    return response.data
  },

  // List vouchers for a promotion
  getVouchers: async (
    id: string,
    params?: {
      status?: 'active' | 'used' | 'expired' | 'disabled'
      page?: number
      limit?: number
    }
  ): Promise<ApiResponse<{ data: Voucher[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>> => {
    const response = await apiClient.get(`/api/promotions/${id}/vouchers`, { params })
    return response.data
  },

  // Disable a single voucher
  disableVoucher: async (voucherId: string): Promise<ApiResponse<Voucher>> => {
    const response = await apiClient.patch(`/api/promotions/vouchers/${voucherId}/disable`)
    return response.data
  },
}
