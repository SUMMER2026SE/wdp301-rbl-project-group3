import apiClient from '@services/api'
import type { ApiResponse, Product } from '@/types'

export const productService = {
  // Get all active products
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get('/api/products')
    const raw = response.data
    // BE wraps array inside: { success, data: { products: [...] } }
    return {
      success: raw.success,
      message: raw.message,
      data: raw.data?.products ?? raw.data ?? [],
    }
  },
}
