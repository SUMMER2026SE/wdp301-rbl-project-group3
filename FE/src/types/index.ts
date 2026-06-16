export interface User {
  id: string
  fullName: string
  email: string
  role: 'customer' | 'admin' | 'branch_manager' | 'staff'
  avatarUrl?: string
  phone?: string
  isEmailVerified: boolean
  status: 'active' | 'inactive' | 'banned'
  authProvider: 'local' | 'google'
  createdAt?: Date
  updatedAt?: Date
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface RegisterData {
  fullName: string
  email: string
  password: string
  phone?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface UpdateProfileData {
  fullName?: string
  phone?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ErrorResponse {
  success: false
  message: string
  statusCode?: number
}

export interface CartProduct {
  id: string
  name: string
  price: number
  unit?: string
}

export interface CartItem {
  itemId: string
  product: CartProduct
  quantity: number
  subtotal: number
  addedAt: string
}

export interface CartResponse {
  cartId: string
  items: CartItem[]
  totalItems: number
  totalAmount: number
}

export interface Product {
  _id: string
  productName: string
  categoryId: string
  price: number
  unit?: string
  barcode?: string
  status: boolean
  createdAt?: string
  updatedAt?: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface Order {
  orderId: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  paymentMethod: 'COD' | 'banking' | 'momo' | 'vnpay'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: string
  phoneNumber: string
  note?: string
  orderDate: string
  items: OrderItem[]
  totalAmount: number
  createdAt: string
}

export interface PlaceOrderInput {
  branchId: string
  shippingAddress: string
  phoneNumber: string
  note?: string
  paymentMethod: 'COD' | 'banking' | 'momo' | 'vnpay'
  selectedItemIds?: string[]
}

export interface OrdersListResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
}


