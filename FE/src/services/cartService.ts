import apiClient from '@services/api'
import type { ApiResponse, CartResponse } from '@/types'

export const cartService = {
  // Get cart content
  getCart: async (branchId?: string): Promise<ApiResponse<CartResponse>> => {
    const params = branchId ? { branchId } : {}
    const response = await apiClient.get('/api/cart', { params })
    return response.data
  },

  // Add an item to the cart
  addToCart: async (productId: string, quantity: number, branchId?: string): Promise<ApiResponse<CartResponse>> => {
    const response = await apiClient.post('/api/cart/items', { productId, quantity, branchId })
    return response.data
  },

  // Update item quantity
  updateItem: async (itemId: string, quantity: number, branchId?: string): Promise<ApiResponse<CartResponse>> => {
    const response = await apiClient.patch(`/api/cart/items/${itemId}`, { quantity, branchId })
    return response.data
  },

  // Remove item from cart
  removeItem: async (itemId: string, branchId?: string): Promise<ApiResponse<CartResponse>> => {
    const params = branchId ? { branchId } : {}
    const response = await apiClient.delete(`/api/cart/items/${itemId}`, { params })
    return response.data
  },

  // Clear entire cart
  clearCart: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete('/api/cart')
    return response.data
  },
}
