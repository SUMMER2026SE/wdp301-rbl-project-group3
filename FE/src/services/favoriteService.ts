import apiClient from '@services/api'
import type { ApiResponse, Product } from '@/types'

/**
 * Persists a user's favorite product collection.
 * Request construction and response normalization stay here so UI code remains presentation-focused.
 */
export const favoriteService = {
  // Get all favorites
  getFavorites: async (): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get('/api/favorites')
    const raw = response.data
    const list = raw.data ?? []
    const normalized: Product[] = list.map((p: any) => ({
      ...p,
      productName: p.productName || p.name || 'Unnamed Product',
      salePrice: p.salePrice ?? 0,
    }))
    return {
      success: raw.success,
      message: raw.message,
      data: normalized,
    }
  },

  // Add to favorites
  addToFavorites: async (productId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/api/favorites', { productId })
    return response.data
  },

  // Remove from favorites
  removeFromFavorites: async (productId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/api/favorites/${productId}`)
    return response.data
  },
}
/**
 * Frontend API client module that centralizes requests and response contracts for one feature.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
