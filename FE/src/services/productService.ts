import apiClient from '@services/api'
import type { ApiResponse, Product } from '@/types'

export const productService = {
  // Get all active products
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get('/api/products')
    return response.data
  },
}
