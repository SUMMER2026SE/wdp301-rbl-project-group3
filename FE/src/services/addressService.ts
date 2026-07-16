import apiClient from '@services/api'
import type { UserAddress, ApiResponse } from '@/types'

export const addressService = {
  // Get all saved addresses for the current user
  getAddresses: async (): Promise<ApiResponse<UserAddress[]>> => {
    const response = await apiClient.get('/api/addresses')
    return response.data
  },

  // Add a new address
  addAddress: async (data: {
    receiverName: string
    phoneNumber: string
    addressDetail: string
    isDefault?: boolean
  }): Promise<ApiResponse<UserAddress>> => {
    const response = await apiClient.post('/api/addresses', data)
    return response.data
  },

  // Update an address
  updateAddress: async (
    addressId: string,
    data: {
      receiverName?: string
      phoneNumber?: string
      addressDetail?: string
      isDefault?: boolean
    }
  ): Promise<ApiResponse<UserAddress>> => {
    const response = await apiClient.patch(`/api/addresses/${addressId}`, data)
    return response.data
  },

  // Delete an address
  deleteAddress: async (addressId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/api/addresses/${addressId}`)
    return response.data
  },

  // Set an address as default
  setDefault: async (addressId: string): Promise<ApiResponse<UserAddress>> => {
    const response = await apiClient.patch(`/api/addresses/${addressId}/default`)
    return response.data
  },
}
