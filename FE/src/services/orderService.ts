import apiClient from '@services/api'
import type { ApiResponse, Order, PlaceOrderInput, OrdersListResponse } from '@/types'

export const orderService = {
  // Get all orders for the current customer (paginated, filterable by status)
  getOrders: async (params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<OrdersListResponse>> => {
    const response = await apiClient.get('/api/orders', { params })
    return response.data
  },

  // Get order details by ID
  getOrderById: async (orderId: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.get(`/api/orders/${orderId}`)
    return response.data
  },

  // Place a new order
  placeOrder: async (data: PlaceOrderInput): Promise<ApiResponse<Order>> => {
    const response = await apiClient.post('/api/orders', data)
    return response.data
  },
}
