import apiClient from '@services/api'
import type {
  AuthResponse,
  User,
  RegisterData,
  LoginData,
  ChangePasswordData,
  ApiResponse,
} from '@/types'

/**
 * Owns client requests for authentication, session recovery, and identity verification.
 * Request construction and response normalization stay here so UI code remains presentation-focused.
 */
export const authService = {
  /**
   * Đăng ký tài khoản người dùng mới vào hệ thống.
   * API này sẽ gửi thông tin cơ bản (email, mật khẩu, tên) để khởi tạo một bản ghi User mới.
   * @param data Payload chứa thông tin đăng ký (RegisterData)
   * @returns ApiResponse chứa message thông báo thành công hoặc lỗi từ server.
   */
  register: async (data: RegisterData): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/register', data)
    return response.data
  },

  /**
   * Xác thực địa chỉ email ngay sau khi đăng ký bằng mã OTP 6 số.
   * Đây là bước bắt buộc để kích hoạt tài khoản và cho phép đăng nhập (tránh spam account).
   * @param email Địa chỉ email của người dùng
   * @param otp Mã xác thực gửi về email
   * @returns ApiResponse chứa trạng thái kích hoạt
   */
  verifyEmail: async (email: string, otp: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/verify-email', { email, otp })
    return response.data
  },

  /**
   * Xử lý luồng đăng nhập truyền thống (Email/Password).
   * Nếu thành công, hàm sẽ tự động trích xuất accessToken từ payload và lưu vào `localStorage`
   * để sử dụng cho các request cần xác thực (authenticated requests) tiếp theo.
   * @param data Đối tượng chứa email và mật khẩu của người dùng.
   * @returns ApiResponse chứa thông tin AuthResponse (token và user profile).
   */
  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/api/auth/login', data)
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken)
    }
    return response.data
  },

  /**
   * Đăng nhập thông qua tài khoản Google (OAuth2).
   * Client (Frontend) sẽ sử dụng Google SDK lấy `idToken` và đẩy xuống Backend để xác thực.
   * Sau khi verify token thành công, backend cấp accessToken của hệ thống.
   * @param idToken Chuỗi token JWT được trả về từ máy chủ Google.
   */
  googleLogin: async (idToken: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/api/auth/google-login', { idToken })
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken)
    }
    return response.data
  },

  /**
   * Cấp lại (Refresh) một accessToken mới khi token cũ đã hết hạn.
   * Thường phụ thuộc vào refreshToken được lưu trữ an toàn bằng HttpOnly Cookie ở phía Backend.
   * Hàm này sẽ lưu token mới trực tiếp vào localStorage.
   */
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await apiClient.post('/api/auth/refresh-token')
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken)
    }
    return response.data
  },

  /**
   * Đăng xuất người dùng ra khỏi thiết bị hiện tại (Xóa phiên làm việc hiện tại).
   * Gọi API báo hiệu backend vô hiệu hóa token và xóa accessToken ở localStorage (Frontend).
   */
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/api/auth/logout')
    localStorage.removeItem('accessToken')
    return response.data
  },

  // Logout from all devices
  logoutAll: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/logout-all')
    localStorage.removeItem('accessToken')
    return response.data
  },

  /**
   * Khởi tạo luồng Khôi phục Mật khẩu. 
   * Gửi email yêu cầu đến backend, backend sẽ sinh ra một mã OTP và gửi về email tương ứng.
   * @param email Email của tài khoản bị quên mật khẩu
   */
  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/api/auth/forgot-password', { email })
    return response.data
  },

  // Reset password with token
  resetPassword: async (
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/api/auth/reset-password', {
      email,
      otp,
      newPassword,
    })
    localStorage.removeItem('accessToken')
    return response.data
  },

  // Change password (authenticated)
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/api/auth/change-password', data)
    localStorage.removeItem('accessToken')
    return response.data
  },

  /**
   * Lấy thông tin cá nhân của người dùng hiện đang đăng nhập (Current Session).
   * Yêu cầu gửi kèm Authorization Header (accessToken).
   * Được dùng rất nhiều trong Context/Redux để lấy Role và Avatar hiển thị lên Navbar/Sidebar.
   */
  getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.get('/api/users/me')
    return response.data
  },

  // Request email verification OTP
  requestEmailVerificationOtp: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/request-email-otp')
    return response.data
  },

  // Request password change OTP
  requestPasswordChangeOtp: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/request-password-change-otp')
    return response.data
  },

  // Verify email using OTP
  verifyEmailOtp: async (otp: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/verify-email-otp', { otp })
    return response.data
  },

  // Change password using OTP
  changePasswordWithOtp: async (data: { otp: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/api/auth/change-password-otp', data)
    localStorage.removeItem('accessToken')
    return response.data
  },
}
/**
 * Frontend API client module that centralizes requests and response contracts for one feature.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
