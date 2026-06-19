import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to request headers if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto refresh token on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {}, {
          withCredentials: true
        })
        if (response.data?.success && response.data?.data?.accessToken) {
          const newToken = response.data.data.accessToken
          localStorage.setItem('accessToken', newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        // Force redirect to home/login if refresh token fails (session expired)
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
