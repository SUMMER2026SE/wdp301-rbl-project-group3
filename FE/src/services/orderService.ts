import apiClient from '@services/api'
import type {
  ApiResponse,
  Order,
  PlaceOrderInput,
  OrdersListResponse,
  AdminOrder,
  AdminOrderStatus,
} from '@/types'

export const orderService = {
  // ── CUSTOMER PORTAL API CALLS ──

  // Get all orders for the current customer (paginated, filterable by status)
  getOrders: async (params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<OrdersListResponse>> => {
    const response = await apiClient.get('/api/orders/my', { params })
    return response.data
  },

  // Get order details by ID for customer
  getOrderById: async (orderId: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.get(`/api/orders/my/${orderId}`)
    return response.data
  },

  // Cancel customer order (only if status is pending)
  cancelOrder: async (orderId: string, reason?: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.patch(`/api/orders/my/${orderId}/cancel`, { reason })
    return response.data
  },

  // Track customer order timeline
  trackOrder: async (orderId: string): Promise<ApiResponse<{ order: Order; tracking: any[]; currentStatus: string }>> => {
    const response = await apiClient.get(`/api/orders/my/${orderId}/tracking`)
    return response.data
  },

  // Place a new order (customer checkout - BE implementation pending)
  placeOrder: async (data: PlaceOrderInput): Promise<ApiResponse<Order>> => {
    const response = await apiClient.post('/api/orders', data)
    return response.data
  },

  // ── BACK-OFFICE ADMIN PORTAL API CALLS ──

  // Get all orders for admin, filterable by branchId and status
  getAdminOrders: async (params?: { branchId?: string; status?: string; page?: number; limit?: number }): Promise<ApiResponse<{ orders: AdminOrder[]; pagination?: any }>> => {
    const response = await apiClient.get('/api/orders', { params })
    const raw = response.data
    // Backend wraps response in: { success, data: { orders: [...] } } or { success, data: [...] }
    const rawList = raw.data?.orders ?? raw.data ?? []

    // Normalize order items and product names
    const normalized: AdminOrder[] = rawList.map((order: any) => {
      const normalizedItems = (order.items || []).map((item: any) => {
        if (item.productId && typeof item.productId === 'object') {
          return {
            ...item,
            productId: {
              ...item.productId,
              productName: item.productId.productName || item.productId.name || 'Unnamed Product',
            },
          }
        }
        return item
      })
      return {
        ...order,
        items: normalizedItems,
      }
    })

    return {
      success: raw.success,
      message: raw.message,
      data: {
        orders: normalized,
        pagination: raw.data?.pagination,
      },
    }
  },

  // Get details of a single order by ID for admin (fully populated)
  getAdminOrderById: async (id: string): Promise<ApiResponse<AdminOrder>> => {
    const response = await apiClient.get(`/api/orders/${id}`)
    const raw = response.data
    const order = raw.data?.order ?? raw.data
    if (order && order.items) {
      order.items = order.items.map((item: any) => {
        if (item.productId && typeof item.productId === 'object') {
          return {
            ...item,
            productId: {
              ...item.productId,
              productName: item.productId.productName || item.productId.name || 'Unnamed Product',
            },
          }
        }
        return item
      })
    }
    return {
      success: raw.success,
      message: raw.message,
      data: order,
    }
  },

  // Confirm an order (transition from pending -> confirmed, triggers stock deduction)
  confirmOrder: async (id: string): Promise<ApiResponse<AdminOrder>> => {
    const response = await apiClient.patch(`/api/orders/${id}/confirm`)
    return response.data
  },

  // Update order status (transition between other allowed states)
  updateOrderStatus: async (id: string, status: AdminOrderStatus): Promise<ApiResponse<AdminOrder>> => {
    const response = await apiClient.patch(`/api/orders/${id}/status`, { status })
    return response.data
  },
}
