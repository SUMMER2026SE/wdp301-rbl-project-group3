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
  name?: string
  categoryId: string
  price: number
  salePrice?: number
  sku?: string
  description?: string
  unit?: string
  imageUrl?: string
  barcode?: string
  status: boolean | string | 'active' | 'inactive'
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

export interface Branch {
  _id: string
  name: string
  code: string
  address: string
  phone?: string
  managerId?: string
  status: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

export interface InventoryProduct {
  _id: string
  name: string
  productName?: string
  sku: string
  unit: string
  salePrice: number
  price?: number
  imageUrl?: string
}

export interface InventoryBranch {
  _id: string
  name: string
  code: string
  address?: string
}

export interface Inventory {
  _id: string
  branchId: InventoryBranch | string
  productId: InventoryProduct
  quantity: number
  averageCost: number
  lastImportCost?: number
  lowStockThreshold: number
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface ImportReceiptItem {
  productId: InventoryProduct
  quantity: number
  unitCost: number
  subtotal: number
}

export interface ImportReceipt {
  _id: string
  code: string
  branchId: InventoryBranch
  supplierName?: string
  note?: string
  items: ImportReceiptItem[]
  totalCost: number
  createdBy: { _id: string; fullName: string; email: string } | string
  createdAt: string
  updatedAt?: string
}

export interface CreateImportReceiptInput {
  branchId: string
  supplierName?: string
  note?: string
  items: {
    productId: string
    quantity: number
    unitCost: number
  }[]
}


