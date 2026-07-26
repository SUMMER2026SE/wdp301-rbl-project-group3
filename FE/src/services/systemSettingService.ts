import apiClient from '@services/api'
import type { ApiResponse, SystemSetting, SystemSettingGroups } from '@/types'

/**
 * Reads and updates system-wide operational settings.
 * Request construction and response normalization stay here so UI code remains presentation-focused.
 */
export const systemSettingService = {
  // GET /api/admin/settings/groups — fetch all settings grouped by category
  getSettingsByGroup: async (): Promise<ApiResponse<SystemSettingGroups>> => {
    const response = await apiClient.get('/api/admin/settings/groups')
    return response.data
  },

  // PATCH /api/admin/settings/:key — update a single setting
  updateSetting: async (
    key: string,
    data: { value: string | number | boolean }
  ): Promise<ApiResponse<{ setting: SystemSetting }>> => {
    const response = await apiClient.patch(`/api/admin/settings/${key}`, data)
    return response.data
  },

  // PATCH /api/admin/settings/bulk — update multiple settings at once
  bulkUpdate: async (
    settings: { key: string; value: string | number | boolean }[]
  ): Promise<ApiResponse<{ settings: SystemSetting[] }>> => {
    const response = await apiClient.patch('/api/admin/settings/bulk', { settings })
    return response.data
  },
}
/**
 * Frontend API client module that centralizes requests and response contracts for one feature.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
