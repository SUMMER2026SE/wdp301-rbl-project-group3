import apiClient from '@services/api'
import type { ApiResponse, Product } from '@/types'

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
