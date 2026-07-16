import apiClient from '@services/api'
import type { ApiResponse } from '@/types'

export interface DashboardParams {
  from?: string
  to?: string
  groupBy?: 'day' | 'month'
}

export interface AdminDashboardData {
  cards: {
    totalBranches: number
    totalStaff: number
    totalCustomers: number
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    promotionRevenue: number
    vouchersUsed: number
    totalInventoryValue: number
    totalInventoryQuantity: number
  }
  charts: {
    revenueTrend: {
      range: { from: string; to: string; groupBy: string }
      data: Array<{ _id: string; totalRevenue: number; orderCount: number }>
    }
    revenueByBranch: Array<{ _id: string; branchName: string; totalRevenue: number; orderCount: number }>
    userRegistrationTrend: {
      range: { from: string; to: string; groupBy: string }
      data: Array<{ _id: string; count: number }>
    }
  }
  lists: {
    topSellingProducts: Array<{
      productId: string
      productName: string
      sku: string
      unit: string
      quantitySold: number
      totalRevenue: number
    }>
    lowStockProducts: Array<{
      productId: string
      productName: string
      sku: string
      unit: string
      branchName: string
      quantity: number
      lowStockThreshold: number
    }>
    topCustomers: Array<{
      customerId: string
      fullName: string
      email: string
      phone: string
      totalSpent: number
      orderCount: number
    }>
    topStaff: Array<{
      staffId: string
      fullName: string
      email: string
      phone: string
      totalProcessedRevenue: number
      processedOrderCount: number
    }>
  }
  generatedAt: string
}

export interface BranchDashboardData {
  cards: {
    totalStaff: number
    totalCustomers: number
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    promotionRevenue: number
    vouchersUsed: number
    totalInventoryValue: number
    totalInventoryQuantity: number
  }
  charts: {
    revenueTrend: {
      range: { from: string; to: string; groupBy: string }
      data: Array<{ _id: string; totalRevenue: number; orderCount: number }>
    }
  }
  lists: {
    topSellingProducts: Array<{
      productId: string
      productName: string
      sku: string
      unit: string
      quantitySold: number
      totalRevenue: number
    }>
    lowStockProducts: Array<{
      productId: string
      productName: string
      sku: string
      unit: string
      branchName: string
      quantity: number
      lowStockThreshold: number
    }>
    topCustomers: Array<{
      customerId: string
      fullName: string
      email: string
      phone: string
      totalSpent: number
      orderCount: number
    }>
    topStaff: Array<{
      staffId: string
      fullName: string
      email: string
      phone: string
      totalProcessedRevenue: number
      processedOrderCount: number
    }>
  }
  branchId: string
  generatedAt: string
}

export const statisticsService = {
  getAdminDashboard: async (params?: DashboardParams): Promise<ApiResponse<AdminDashboardData>> => {
    const response = await apiClient.get('/api/statistics/admin/dashboard', { params })
    return response.data
  },

  getBranchDashboard: async (params?: DashboardParams & { branchId?: string }): Promise<ApiResponse<BranchDashboardData>> => {
    const response = await apiClient.get('/api/statistics/branch/dashboard', { params })
    return response.data
  }
}
