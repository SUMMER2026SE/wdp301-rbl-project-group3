import apiClient from '@services/api'
import type { ApiResponse, Product } from '@/types'

export const productService = {
  // Get products (active or all, filterable by keyword)
  getProducts: async (params?: { keyword?: string; status?: string }): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get('/api/products', { params })
    const raw = response.data
    // BE wraps array inside: { success, data: { products: [...] } }
    const rawList = raw.data?.products ?? raw.data ?? []
    const normalized: Product[] = rawList.map((p: any) => ({
      ...p,
      productName: p.productName || p.name || 'Unnamed Product',
      price: p.price ?? p.salePrice ?? 0,
    }))
    return {
      success: raw.success,
      message: raw.message,
      data: normalized,
    }
  },

  // Create a new product (Back-office only)
  createProduct: async (productData: {
    name: string
    sku: string
    salePrice: number
    unit?: string
    description?: string
    imageUrl?: string
    status?: 'active' | 'inactive'
  }): Promise<ApiResponse<Product>> => {
    const response = await apiClient.post('/api/products', productData)
    const raw = response.data
    // Normalize return value
    if (raw.success && raw.data?.product) {
      const p = raw.data.product
      raw.data.product = {
        ...p,
        productName: p.productName || p.name || 'Unnamed Product',
        price: p.price ?? p.salePrice ?? 0,
      }
    }
    return raw
  },
}
