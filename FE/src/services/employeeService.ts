import apiClient from './api'
import type { ApiResponse, Employee } from '@/types'

export const employeeService = {
  listEmployees: async (params?: {
    page?: number
    limit?: number
    keyword?: string
    branchId?: string
    role?: 'branch_manager' | 'staff'
    status?: 'active' | 'inactive' | 'banned'
  }): Promise<ApiResponse<{ employees: Employee[]; pagination: any }>> => {
    const response = await apiClient.get('/api/employees', { params })
    return response.data
  },

  getEmployee: async (id: string): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.get(`/api/employees/${id}`)
    return response.data
  },

  createEmployee: async (data: {
    fullName: string
    email: string
    password?: string
    phone?: string
    address?: string
    role: 'branch_manager' | 'staff'
    branchId: string
    status: 'active' | 'inactive'
  }): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.post('/api/employees', data)
    return response.data
  },

  updateEmployee: async (
    id: string,
    data: {
      fullName?: string
      email?: string
      password?: string
      phone?: string | null
      address?: string | null
      role?: 'branch_manager' | 'staff'
      branchId?: string
      status?: 'active' | 'inactive' | 'banned'
    }
  ): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.patch(`/api/employees/${id}`, data)
    return response.data
  },

  deactivateEmployee: async (id: string): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.delete(`/api/employees/${id}`)
    return response.data
  },
}
