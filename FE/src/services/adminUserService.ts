import apiClient from '@services/api'
import type { ApiResponse, User } from '@/types'

export interface ListUsersParams {
  page?: number
  limit?: number
  keyword?: string
  role?: 'admin' | 'branch_manager' | 'staff' | 'customer'
  status?: 'active' | 'inactive' | 'banned'
}

export interface ListUsersResult {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const adminUserService = {
  /**
   * Dịch vụ dành riêng cho Admin (Backend sẽ kiểm tra RBAC - Role Based Access Control).
   * Truy vấn danh sách toàn bộ người dùng, quản trị viên, nhân viên hệ thống.
   * Cho phép lọc người dùng theo vai trò (Role) và tình trạng tài khoản (Status).
   * 
   * @param params Đối tượng chứa từ khóa, role, limit để phân trang.
   */
  listUsers: async (params?: ListUsersParams): Promise<ApiResponse<ListUsersResult>> => {
    const response = await apiClient.get('/api/admin/users', { params })
    return response.data
  },

  /**
   * Khóa tài khoản vĩnh viễn hoặc tạm thời (Ban Account).
   * Ngay lập tức thu hồi quyền đăng nhập và các token đang active của người này.
   * Rất hữu dụng khi phát hiện tài khoản spam hoặc vi phạm quy chế bán hàng.
   * 
   * @param id ID của người dùng (User ID) cần cấm.
   */
  lockUser: async (id: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.patch(`/api/admin/users/${id}/lock`)
    return response.data
  },

  /**
   * Mở khóa tài khoản đã bị Ban trước đó, phục hồi toàn bộ quyền lợi và trạng thái Active.
   * 
   * @param id ID của người dùng (User ID) cần mở khóa.
   */
  unlockUser: async (id: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.patch(`/api/admin/users/${id}/unlock`)
    return response.data
  },
}
