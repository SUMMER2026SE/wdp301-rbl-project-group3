import apiClient from '@services/api'
import type { ApiResponse, SystemSetting, SystemSettingGroups } from '@/types'

export const systemSettingService = {
  /**
   * Lấy toàn bộ các cấu hình hệ thống (System Settings) từ backend, 
   * và được nhóm (group) lại theo từng danh mục (ví dụ: SEO, Email, General, Payment).
   * Giúp cho việc render UI trên màn hình Cấu hình hệ thống dễ dàng phân chia thành các Tabs.
   */
  getSettingsByGroup: async (): Promise<ApiResponse<SystemSettingGroups>> => {
    const response = await apiClient.get('/api/admin/settings/groups')
    return response.data
  },

  /**
   * Cập nhật một tham số cấu hình hệ thống duy nhất dựa theo khóa (key).
   * 
   * @param key Khóa định danh của cấu hình (VD: 'store_name', 'smtp_host').
   * @param data Giá trị mới cần lưu (hỗ trợ dạng chuỗi, số hoặc boolean).
   */
  updateSetting: async (
    key: string,
    data: { value: string | number | boolean }
  ): Promise<ApiResponse<{ setting: SystemSetting }>> => {
    const response = await apiClient.patch(`/api/admin/settings/${key}`, data)
    return response.data
  },

  /**
   * Cập nhật đồng loạt (Bulk Update) nhiều cấu hình hệ thống cùng một lúc.
   * Thường được sử dụng khi người quản trị bấm nút "Lưu thay đổi" sau khi đã chỉnh sửa 
   * nhiều trường thông tin trên cùng một form.
   * 
   * @param settings Mảng chứa các cặp Key-Value cần cập nhật vào hệ thống.
   */
  bulkUpdate: async (
    settings: { key: string; value: string | number | boolean }[]
  ): Promise<ApiResponse<{ settings: SystemSetting[] }>> => {
    const response = await apiClient.patch('/api/admin/settings/bulk', { settings })
    return response.data
  },
}
