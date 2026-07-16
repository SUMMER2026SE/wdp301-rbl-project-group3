import apiClient from '@services/api'
import type { ApiResponse } from '@/types'

export interface ShiftTemplate {
  _id: string;
  branchId: string;
  name: string;
  startTime: string;
  endTime: string;
  maxStaff: number;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftRegistration {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
  };
  branchId: string;
  date: string;
  shiftTemplateId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  managerNote?: string;
  approvedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const shiftService = {
  // --- Templates ---
  getTemplates: async (params?: { branchId?: string }): Promise<ApiResponse<{ templates: ShiftTemplate[] }>> => {
    const response = await apiClient.get('/api/shifts/templates', { params })
    return response.data
  },

  createTemplate: async (data: { name: string; startTime: string; endTime: string; maxStaff?: number; branchId?: string }): Promise<ApiResponse<{ template: ShiftTemplate }>> => {
    const response = await apiClient.post('/api/shifts/templates', data)
    return response.data
  },

  updateTemplate: async (id: string, data: Partial<ShiftTemplate>): Promise<ApiResponse<{ template: ShiftTemplate }>> => {
    const response = await apiClient.put(`/api/shifts/templates/${id}`, data)
    return response.data
  },

  deleteTemplate: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/api/shifts/templates/${id}`)
    return response.data
  },

  // --- Registrations ---
  getRegistrations: async (params?: {
    branchId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<ApiResponse<{ registrations: ShiftRegistration[] }>> => {
    const response = await apiClient.get('/api/shifts/registrations', { params })
    return response.data
  },

  registerShift: async (data: { date: string; shiftTemplateId: string; note?: string }): Promise<ApiResponse<{ registration: ShiftRegistration }>> => {
    const response = await apiClient.post('/api/shifts/registrations', data)
    return response.data
  },

  cancelRegistration: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/api/shifts/registrations/${id}`)
    return response.data
  },

  reviewRegistration: async (id: string, data: { status: 'approved' | 'rejected'; managerNote?: string }): Promise<ApiResponse<{ registration: ShiftRegistration }>> => {
    const response = await apiClient.post(`/api/shifts/registrations/${id}/review`, data)
    return response.data
  },
}

export default shiftService
