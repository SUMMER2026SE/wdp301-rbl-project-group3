import apiClient from '@services/api'
import type { ApiResponse, Category } from '@/types'

export const categoryService = {
  /**
   * Lấy danh sách toàn bộ hoặc một phần danh mục sản phẩm từ cơ sở dữ liệu.
   * Hỗ trợ chức năng phân trang (Pagination) và Lọc đa chiều (Filtering & Searching).
   * Kết quả trả về được chuẩn hóa ép kiểu (normalize) lại cấu trúc trạng thái 'active'/'inactive'.
   * 
   * @param params Các tham số truy vấn trên thanh URL (Query string) như status, keyword, page.
   * @returns Một mảng Category đã chuẩn hóa kèm theo thông tin tổng số trang để render Table.
   */
  getCategories: async (params?: {
    status?: 'active' | 'inactive';
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Category[] & { pagination?: { page: number; limit: number; total: number; totalPages: number } }>> => {
    const response = await apiClient.get('/api/categories', { params })
    const raw = response.data
    // Backend wraps response in: { success, data: { categories: [...] } } or { success, data: [...] }
    const rawList = raw.data?.categories ?? raw.data ?? []

    const normalized: Category[] = rawList.map((c: any) => ({
      ...c,
      status: (c.status === 'active' || c.status === 'true' || c.status === true) ? 'active' : 'inactive',
    }))

    const data = raw.data?.pagination 
      ? Object.assign(normalized, { pagination: raw.data.pagination }) 
      : normalized;

    return {
      success: raw.success,
      message: raw.message,
      data: data as any,
    }
  },

  // Get single category by ID
  getCategoryById: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await apiClient.get(`/api/categories/${id}`)
    const raw = response.data
    const c = raw.data?.category ?? raw.data
    const normalized = c ? {
      ...c,
      status: (c.status === 'active' || c.status === 'true' || c.status === true) ? 'active' : 'inactive',
    } : c

    return {
      success: raw.success,
      message: raw.message,
      data: normalized,
    }
  },

  /**
   * Tạo một phân loại/danh mục sản phẩm mới vào hệ thống (Admin Only).
   * Yêu cầu chuỗi `code` phải là duy nhất và không chứa ký tự đặc biệt theo quy chuẩn.
   * 
   * @param categoryData Object chứa Tên, Mã, Mô tả và Trạng thái hiển thị
   */
  createCategory: async (categoryData: { name: string; code: string; description?: string; status?: 'active' | 'inactive' }): Promise<ApiResponse<Category>> => {
    const response = await apiClient.post('/api/categories', categoryData)
    return response.data
  },

  /**
   * Chỉnh sửa thông tin một danh mục đã tồn tại dựa vào UUID hoặc ID định danh.
   * Có thể cập nhật một phần (Partial) dữ liệu mà không cần gửi toàn bộ Model.
   * 
   * @param id Khóa chính (Primary Key) của danh mục
   * @param categoryData Dữ liệu cần cập nhật mới
   */
  updateCategory: async (id: string, categoryData: Partial<{ name: string; code: string; description?: string; status?: 'active' | 'inactive' }>): Promise<ApiResponse<Category>> => {
    const response = await apiClient.patch(`/api/categories/${id}`, categoryData)
    return response.data
  },

  // Delete a category (sets status to inactive, or throws error if in use)
  deleteCategory: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await apiClient.delete(`/api/categories/${id}`)
    return response.data
  },
}
