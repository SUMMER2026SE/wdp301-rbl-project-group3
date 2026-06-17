import apiClient from '@services/api'
import type { ApiResponse, CartResponse } from '@/types'

export const cartService = {
  // Get cart content
  getCart: async (): Promise<ApiResponse<CartResponse>> => {
    const response = await apiClient.get('/api/cart')
    return response.data
  },

  // Add an item to the cart
  addToCart: async (productId: string, quantity: number): Promise<ApiResponse<CartResponse>> => {
    const response = await apiClient.post('/api/cart/items', { productId, quantity })
    return response.data
  },

  // Update item quantity
  updateItem: async (itemId: string, quantity: number): Promise<ApiResponse<CartResponse>> => {
    const response = await apiClient.patch(`/api/cart/items/${itemId}`, { quantity })
    return response.data
  },

  // Remove item from cart
  removeItem: async (itemId: string): Promise<ApiResponse<CartResponse>> => {
    const response = await apiClient.delete(`/api/cart/items/${itemId}`)
    return response.data
  },

  // Clear entire cart
  clearCart: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete('/api/cart')
    return response.data
  },
}
