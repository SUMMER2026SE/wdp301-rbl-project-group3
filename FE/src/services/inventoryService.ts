import apiClient from '@services/api'
import type { ApiResponse, Inventory, ImportReceipt, CreateImportReceiptInput } from '@/types'

export const inventoryService = {
  // Get inventory records (lowStock, branchId, productId)
  getInventory: async (params?: {
    branchId?: string
    productId?: string
    lowStock?: 'true' | 'false'
  }): Promise<ApiResponse<Inventory[]>> => {
    const response = await apiClient.get('/api/inventory', { params })
    const raw = response.data
    // Backend wraps response in: { success, data: { inventory: [...] } } or { success, data: [...] }
    const rawList = raw.data?.inventory ?? raw.data ?? []
    
    // Normalize products inside inventory records
    const normalized: Inventory[] = rawList.map((item: any) => {
      if (item.productId) {
        item.productId = {
          ...item.productId,
          productName: item.productId.productName || item.productId.name || 'Unnamed Product',
          price: item.productId.price ?? item.productId.salePrice ?? 0,
        }
      }
      return item
    })

    return {
      success: raw.success,
      message: raw.message,
      data: normalized,
    }
  },

  // Get list of import receipts
  getImportReceipts: async (params?: { branchId?: string }): Promise<ApiResponse<ImportReceipt[]>> => {
    const response = await apiClient.get('/api/inventory/import-receipts', { params })
    const raw = response.data
    // Backend wraps response in: { success, data: { receipts: [...] } } or { success, data: [...] }
    const rawList = raw.data?.receipts ?? raw.data ?? []

    // Normalize products inside receipt items
    const normalized: ImportReceipt[] = rawList.map((receipt: any) => {
      if (receipt.items) {
        receipt.items = receipt.items.map((item: any) => {
          if (item.productId) {
            item.productId = {
              ...item.productId,
              productName: item.productId.productName || item.productId.name || 'Unnamed Product',
              price: item.productId.price ?? item.productId.salePrice ?? 0,
            }
          }
          return item
        })
      }
      return receipt
    })

    return {
      success: raw.success,
      message: raw.message,
      data: normalized,
    }
  },

  // Create a new import receipt and add stock
  createImportReceipt: async (data: CreateImportReceiptInput): Promise<ApiResponse<ImportReceipt>> => {
    const response = await apiClient.post('/api/inventory/import-receipts', data)
    return response.data
  },

  // Manually add a product stock entry to branch inventory
  createInventory: async (data: {
    branchId: string
    productId: string
    quantity: number
    averageCost: number
    lowStockThreshold: number
  }): Promise<ApiResponse<Inventory>> => {
    const response = await apiClient.post('/api/inventory', data)
    return response.data
  },

  // Manually update stock quantity, average cost or threshold
  updateInventory: async (
    id: string,
    data: {
      quantity?: number
      averageCost?: number
      lowStockThreshold?: number
    }
  ): Promise<ApiResponse<Inventory>> => {
    const response = await apiClient.patch(`/api/inventory/${id}`, data)
    return response.data
  },

  // Manually delete an inventory stock record
  deleteInventory: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/api/inventory/${id}`)
    return response.data
  },
}
