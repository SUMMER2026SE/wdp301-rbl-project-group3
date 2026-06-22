import apiClient from '@services/api'
import type { ApiResponse, Product } from '@/types'

export const productService = {
  // Get products (active or all, filterable by keyword)
  getProducts: async (params?: { keyword?: string; status?: string; page?: number; limit?: number }): Promise<ApiResponse<Product[]> & { pagination?: any }> => {
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
      pagination: raw.data?.pagination,
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
    categoryId?: string
    status?: 'active' | 'inactive'
    image?: File
  }): Promise<ApiResponse<Product>> => {
    let payload: any = productData
    let headers: any = {}

    if (productData.image) {
      const formData = new FormData()
      formData.append('name', productData.name)
      formData.append('sku', productData.sku)
      formData.append('salePrice', String(productData.salePrice))
      if (productData.unit) formData.append('unit', productData.unit)
      if (productData.description) formData.append('description', productData.description)
      if (productData.categoryId) formData.append('categoryId', productData.categoryId)
      if (productData.status) formData.append('status', productData.status)
      formData.append('image', productData.image)

      payload = formData
      headers['Content-Type'] = 'multipart/form-data'
    }

    const response = await apiClient.post('/api/products', payload, { headers })
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

  // Update an existing product
  updateProduct: async (
    id: string,
    productData: {
      name?: string
      sku?: string
      salePrice?: number
      unit?: string
      description?: string
      imageUrl?: string
      categoryId?: string
      status?: 'active' | 'inactive'
      image?: File
    }
  ): Promise<ApiResponse<Product>> => {
    let payload: any = productData
    let headers: any = {}

    if (productData.image) {
      const formData = new FormData()
      if (productData.name !== undefined) formData.append('name', productData.name)
      if (productData.sku !== undefined) formData.append('sku', productData.sku)
      if (productData.salePrice !== undefined) formData.append('salePrice', String(productData.salePrice))
      if (productData.unit !== undefined) formData.append('unit', productData.unit)
      if (productData.description !== undefined) formData.append('description', productData.description)
      if (productData.categoryId !== undefined) formData.append('categoryId', productData.categoryId)
      if (productData.status !== undefined) formData.append('status', productData.status)
      formData.append('image', productData.image)

      payload = formData
      headers['Content-Type'] = 'multipart/form-data'
    }

    const response = await apiClient.patch(`/api/products/${id}`, payload, { headers })
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

  // Delete/Deactivate a product
  deleteProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await apiClient.delete(`/api/products/${id}`)
    return response.data
  },
}

