import apiClient from '@services/api'
import type { ApiResponse, Banner } from '@/types'

/**
 * Retrieves and maintains promotional banners shown in storefront and admin views.
 * Request construction and response normalization stay here so UI code remains presentation-focused.
 */
export const bannerService = {
  /**
   * Tải lên một Banner (Hình ảnh quảng cáo) mới lên máy chủ.
   * @param data FormData chứa file hình ảnh và các metadata liên quan (tiêu đề, đường dẫn).
   */
  createBanner: async (data: FormData): Promise<ApiResponse<{ banner: Banner }>> => {
    const response = await apiClient.post('/api/banners', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Lấy danh sách toàn bộ các Banner đang có trong hệ thống (cả Active và Inactive).
   * Thường được sử dụng trong giao diện Quản trị viên (Admin Dashboard) kèm theo phân trang.
   * @param params Các tham số phân trang và lọc dữ liệu (page, limit).
   */
  getBanners: async (params?: any): Promise<ApiResponse<{ items: Banner[]; total: number; page: number; limit: number; totalPages: number }>> => {
    const response = await apiClient.get('/api/banners', { params })
    return response.data
  },

  getBannerById: async (id: string): Promise<ApiResponse<{ banner: Banner }>> => {
    const response = await apiClient.get(`/api/banners/${id}`)
    return response.data
  },

  updateBanner: async (id: string, data: FormData): Promise<ApiResponse<{ banner: Banner }>> => {
    const response = await apiClient.patch(`/api/banners/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  deleteBanner: async (id: string): Promise<ApiResponse<{ banner: Banner }>> => {
    const response = await apiClient.delete(`/api/banners/${id}`)
    return response.data
  },

  /**
   * Trả về danh sách tất cả các Banner đang ở trạng thái kích hoạt (Active).
   * Hàm này chủ yếu được gọi từ trang chủ (Client side) để render slideshow quảng cáo 
   * mà không quan tâm đến các banner đã bị ẩn.
   */
  getActiveBanners: async (): Promise<ApiResponse<{ banners: Banner[] }>> => {
    const response = await apiClient.get('/api/banners/active')
    return response.data
  },
}

export default bannerService
/**
 * Frontend API client module that centralizes requests and response contracts for one feature.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
