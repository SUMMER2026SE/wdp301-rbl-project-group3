import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  X,
  Eye,
  Calendar,
  User,
  MapPin,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react'
import { orderService } from '@services/orderService'
import { branchService } from '@services/branchService'
import { useAuth } from '@hooks/useAuth'
import type { AdminOrder, AdminOrderStatus, Branch } from '@/types'

// Format currency in VND
const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

// Format date nicely
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get status styling and text
const getStatusConfig = (status: AdminOrderStatus) => {
  switch (status) {
    case 'pending':
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        text: 'Chờ xác nhận',
        icon: <Clock size={16} className="text-amber-700" />,
      }
    case 'confirmed':
      return {
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
        text: 'Đã xác nhận',
        icon: <CheckCircle2 size={16} className="text-purple-700" />,
      }
    case 'preparing':
      return {
        bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        text: 'Đang chuẩn bị',
        icon: <Package size={16} className="text-indigo-700" />,
      }
    case 'delivering':
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        text: 'Đang giao hàng',
        icon: <Truck size={16} className="text-blue-700" />,
      }
    case 'delivered':
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        text: 'Đã giao hàng',
        icon: <CheckCircle2 size={16} className="text-emerald-700" />,
      }
    case 'cancelled':
      return {
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
        text: 'Đã hủy',
        icon: <X size={16} className="text-rose-700" />,
      }
    default:
      return {
        bg: 'bg-gray-100 text-gray-800 border-gray-200',
        text: status,
        icon: <Clock size={16} className="text-gray-700" />,
      }
  }
}

export const ManageOrdersPage = () => {
  const { user, loading: authLoading } = useAuth()
  const isManagerOrStaff = user?.role === 'branch_manager' || user?.role === 'staff'
  const userBranchId = user?.branchId || ''

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Date range filter states
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showDateFilter, setShowDateFilter] = useState(false)

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Selected order for details modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Pagination states
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Sync selected branch when user info loads and user is manager/staff
  useEffect(() => {
    if (!authLoading && isManagerOrStaff && userBranchId) {
      setSelectedBranch(userBranchId)
    }
  }, [authLoading, isManagerOrStaff, userBranchId])

  // Fetch initial data
  const fetchData = async () => {
    try {
      setError(null)
      // Get branches for filter dropdown
      const branchesResponse = await branchService.getBranches()
      if (branchesResponse.success) {
        setBranches(branchesResponse.data)
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi tải dữ liệu.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Refetch orders specifically when branch, status, search, dates, or page changes
  const fetchFilteredOrders = async () => {
    try {
      setLoading(true)
      const params: { branchId?: string; status?: string; keyword?: string; startDate?: string; endDate?: string; page?: number; limit?: number } = {
        page,
        limit: 10,
      }
      if (selectedBranch) params.branchId = selectedBranch
      if (selectedStatus) params.status = selectedStatus
      if (searchQuery.trim()) params.keyword = searchQuery.trim()
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const response = await orderService.getAdminOrders(params)
      if (response.success && response.data) {
        setOrders(response.data.orders || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
        setTotalItems(response.data.pagination?.total || 0)
      } else {
        setError(response.message || 'Không thể tải danh sách đơn hàng.')
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải bộ lọc đơn hàng.')
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch filtered list whenever active dropdowns or page changes (with debounce for search)
  useEffect(() => {
    if (authLoading) return
    
    const delayDebounce = setTimeout(() => {
      fetchFilteredOrders()
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [selectedBranch, selectedStatus, searchQuery, startDate, endDate, page, authLoading])

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedBranch, selectedStatus, searchQuery, startDate, endDate])
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return
    
    const intervalId = setInterval(() => {
      fetchFilteredOrders()
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(intervalId)
  }, [autoRefresh, selectedBranch, selectedStatus, page])
  
  // Handle confirming order (pending -> confirmed)
  const handleConfirmOrder = async (orderId: string) => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      const response = await orderService.confirmOrder(orderId)
      if (response.success) {
        // Refresh orders list
        await fetchFilteredOrders()
        // Update currently opened modal data if applicable
        if (selectedOrder && selectedOrder._id === orderId) {
          const updatedOrder = await orderService.getAdminOrderById(orderId)
          if (updatedOrder.success) {
            setSelectedOrder(updatedOrder.data)
          }
        }
      } else {
        alert(response.message || 'Duyệt đơn hàng không thành công.')
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối khi duyệt đơn.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle changing status (transition states)
  const handleUpdateStatus = async (orderId: string, nextStatus: AdminOrderStatus) => {
    if (actionLoading) return
    const statusLabels: Record<AdminOrderStatus, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Xác nhận',
      preparing: 'Chuẩn bị hàng',
      delivering: 'Giao hàng',
      delivered: 'Giao hàng thành công',
      cancelled: 'Hủy đơn hàng',
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng này sang "${statusLabels[nextStatus]}"?`
      )
    ) {
      return
    }

    try {
      setActionLoading(true)
      const response = await orderService.updateOrderStatus(orderId, nextStatus)
      if (response.success) {
        // Refresh orders list
        await fetchFilteredOrders()
        // Update currently opened modal data if applicable
        if (selectedOrder && selectedOrder._id === orderId) {
          const updatedOrder = await orderService.getAdminOrderById(orderId)
          if (updatedOrder.success) {
            setSelectedOrder(updatedOrder.data)
          }
        }
      } else {
        alert(response.message || 'Cập nhật trạng thái không thành công.')
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối khi cập nhật trạng thái.')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredOrders = orders
  
  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Chi nhánh', 'Tổng tiền', 'Trạng thái']
    const rows = filteredOrders.map(order => {
      const customerName = order.customerId && typeof order.customerId === 'object' 
        ? order.customerId.fullName 
        : 'Khách vãng lai'
      const branchName = order.branchId && typeof order.branchId === 'object'
        ? order.branchId.name
        : 'Mặc định'
      
      return [
        order.code,
        customerName,
        formatDate(order.createdAt),
        branchName,
        order.totalAmount,
        getStatusConfig(order.status).text
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Open detail modal helper
  const handleOpenDetails = (order: AdminOrder) => {
    setSelectedOrder(order)
  }
  
  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredOrders.length
    const pending = filteredOrders.filter(o => o.status === 'pending').length
    const confirmed = filteredOrders.filter(o => o.status === 'confirmed').length
    const delivering = filteredOrders.filter(o => o.status === 'delivering').length
    const delivered = filteredOrders.filter(o => o.status === 'delivered').length
    const cancelled = filteredOrders.filter(o => o.status === 'cancelled').length
    const totalRevenue = filteredOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0)
    const pendingRevenue = filteredOrders
      .filter(o => ['pending', 'confirmed', 'preparing', 'delivering'].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0)
    
    return {
      total,
      pending,
      confirmed,
      delivering,
      delivered,
      cancelled,
      totalRevenue,
      pendingRevenue,
    }
  }, [filteredOrders])

  return (
    <div className="space-y-6">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Back-Office Portal
          </span>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">
            Quản lý Đơn hàng
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Duyệt đơn, theo dõi lộ trình và cập nhật trạng thái đơn hàng của khách hàng.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchFilteredOrders()
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-surface-container-low border border-outline px-4 py-2 text-sm font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
              autoRefresh 
                ? 'bg-primary text-white border-primary' 
                : 'bg-surface-container-low border-outline hover:bg-surface-container-high'
            }`}
          >
            <Clock size={16} />
            {autoRefresh ? 'Tự động: Bật' : 'Tự động: Tắt'}
          </button>
          
          <button
            onClick={exportToCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 rounded-lg bg-surface-container-low border border-outline px-4 py-2 text-sm font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            Xuất Excel
          </button>
        </div>
      </div>
      
      {/* ── STATISTICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Tổng đơn hàng
              </p>
              <p className="mt-1 text-2xl font-black text-blue-900">{totalItems}</p>
            </div>
            <div className="rounded-full bg-blue-200 p-3">
              <ShoppingCart size={24} className="text-blue-700" />
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Chờ xác nhận
              </p>
              <p className="mt-1 text-2xl font-black text-amber-900">{statistics.pending}</p>
            </div>
            <div className="rounded-full bg-amber-200 p-3">
              <Clock size={24} className="text-amber-700" />
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Đã giao hàng
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-900">{statistics.delivered}</p>
            </div>
            <div className="rounded-full bg-emerald-200 p-3">
              <CheckCircle2 size={24} className="text-emerald-700" />
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Doanh thu
              </p>
              <p className="mt-1 text-lg font-black text-purple-900">{formatVND(statistics.totalRevenue)}</p>
            </div>
            <div className="rounded-full bg-purple-200 p-3">
              <TrendingUp size={24} className="text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm sm:grid-cols-3">
          {/* Branch filter */}
          <div className="relative">
            <label
              htmlFor="filter-branch"
              className="absolute -top-2 left-3 bg-surface-container-lowest px-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"
            >
              Lọc theo chi nhánh
            </label>
            <div className="flex items-center">
              <Building2 size={16} className="absolute left-3 text-on-surface-variant opacity-60" />
              <select
                id="filter-branch"
                value={selectedBranch}
                disabled={isManagerOrStaff}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full rounded-lg border border-outline bg-transparent py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isManagerOrStaff ? null : <option value="">Tất cả chi nhánh</option>}
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status filter */}
          <div className="relative">
            <label
              htmlFor="filter-status"
              className="absolute -top-2 left-3 bg-surface-container-lowest px-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"
            >
              Lọc trạng thái đơn
            </label>
            <div className="flex items-center">
              <Clock size={16} className="absolute left-3 text-on-surface-variant opacity-60" />
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-outline bg-transparent py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận (Pending)</option>
                <option value="confirmed">Đã xác nhận (Confirmed)</option>
                <option value="preparing">Đang chuẩn bị (Preparing)</option>
                <option value="delivering">Đang giao hàng (Delivering)</option>
                <option value="delivered">Đã giao hàng (Delivered)</option>
                <option value="cancelled">Đã hủy (Cancelled)</option>
              </select>
            </div>
          </div>

          {/* Text search */}
          <div className="relative">
            <label
              htmlFor="search-orders"
              className="absolute -top-2 left-3 bg-surface-container-lowest px-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"
            >
              Tìm kiếm nhanh
            </label>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-on-surface-variant opacity-60" />
              <input
                id="search-orders"
                type="text"
                placeholder="Nhập mã đơn, tên, sđt khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-outline bg-transparent py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
        
        {/* Date Range Filter - Collapsible */}
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-primary" />
              <span className="text-sm font-bold text-on-surface">Lọc theo khoảng thời gian</span>
              {(startDate || endDate) && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Đang áp dụng
                </span>
              )}
            </div>
            <Calendar size={16} className={`text-on-surface-variant transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
          </button>
          
          {showDateFilter && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-t border-outline-variant bg-surface-container-low/30">
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-outline bg-transparent py-2 px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-outline bg-transparent py-2 px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="w-full rounded-lg border border-outline bg-surface-container-low px-4 py-2 text-sm font-bold hover:bg-surface-container-high transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ERROR STATE ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-error bg-error-container p-4 text-on-error-container">
          <AlertCircle size={20} className="shrink-0 text-error" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchData}
            type="button"
            className="ml-auto rounded-lg bg-error px-3 py-1.5 text-xs font-bold text-white hover:bg-error/95"
          >
            Tải lại
          </button>
        </div>
      )}

      {/* ── MAIN ORDERS LIST ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-16 w-full animate-pulse rounded-xl bg-surface-container-low border border-outline-variant/60"
            />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest py-16 text-center shadow-inner">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant">
            <Package size={24} className="opacity-60" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-on-surface">Không có đơn hàng nào</h3>
          <p className="mt-1 text-sm text-on-surface-variant max-w-xs mx-auto">
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="p-4 font-bold text-on-surface-variant">Mã Đơn</th>
                  <th className="p-4 font-bold text-on-surface-variant">Khách hàng</th>
                  <th className="p-4 font-bold text-on-surface-variant">Ngày đặt</th>
                  <th className="p-4 font-bold text-on-surface-variant">Chi nhánh</th>
                  <th className="p-4 font-bold text-on-surface-variant text-right">Tổng tiền</th>
                  <th className="p-4 font-bold text-on-surface-variant text-center">Trạng thái</th>
                  <th className="p-4 font-bold text-on-surface-variant text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {filteredOrders.map((order) => {
                  const statusCfg = getStatusConfig(order.status)
                  const customerName =
                    order.customerId && typeof order.customerId === 'object'
                      ? order.customerId.fullName
                      : 'Khách vãng lai'
                  const customerPhone =
                    order.customerId && typeof order.customerId === 'object'
                      ? order.customerId.phone || 'N/A'
                      : 'N/A'

                  const branchName =
                    order.branchId && typeof order.branchId === 'object'
                      ? order.branchId.name
                      : 'Mặc định'

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-surface-container-low/20 transition-colors"
                    >
                      {/* Order Code */}
                      <td className="p-4 font-mono font-bold text-primary">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(order)}
                          className="hover:underline text-left outline-none"
                        >
                          {order.code}
                        </button>
                      </td>

                      {/* Customer info */}
                      <td className="p-4">
                        <div className="font-bold text-on-surface">{customerName}</div>
                        <div className="text-xs text-on-surface-variant">{customerPhone}</div>
                      </td>

                      {/* Created date */}
                      <td className="p-4 text-on-surface-variant">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Branch Name */}
                      <td className="p-4 font-medium text-on-surface">
                        {branchName}
                      </td>

                      {/* Total Amount */}
                      <td className="p-4 font-black text-right text-on-surface">
                        {formatVND(order.totalAmount)}
                      </td>

                      {/* Status select dropdown */}
                      <td className="p-4 text-center">
                        {['delivered', 'cancelled'].includes(order.status) ? (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm ${statusCfg.bg}`}
                          >
                            {statusCfg.icon}
                            {statusCfg.text}
                          </span>
                        ) : (
                          <select
                            value={order.status}
                            disabled={actionLoading}
                            onChange={(e) => {
                              const nextStatus = e.target.value as AdminOrderStatus
                              if (nextStatus === order.status) return

                              if (order.status === 'pending' && nextStatus === 'confirmed') {
                                handleConfirmOrder(order._id)
                              } else {
                                handleUpdateStatus(order._id, nextStatus)
                              }
                            }}
                            className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm outline-none cursor-pointer transition focus:ring-1 focus:ring-primary ${statusCfg.bg}`}
                          >
                            <option value={order.status}>{statusCfg.text}</option>
                            {order.status === 'pending' && (
                              <>
                                <option value="confirmed">Xác nhận</option>
                                <option value="cancelled">Hủy đơn</option>
                              </>
                            )}
                            {order.status === 'confirmed' && (
                              <>
                                <option value="preparing">Chuẩn bị hàng</option>
                                <option value="pending">Chờ xác nhận</option>
                                <option value="cancelled">Hủy đơn</option>
                              </>
                            )}
                            {order.status === 'preparing' && (
                              <>
                                <option value="delivering">Giao hàng</option>
                                <option value="confirmed">Đã xác nhận</option>
                                <option value="cancelled">Hủy đơn</option>
                              </>
                            )}
                            {order.status === 'delivering' && (
                              <>
                                <option value="delivered">Giao thành công</option>
                                <option value="preparing">Chuẩn bị hàng</option>
                                <option value="cancelled">Hủy đơn</option>
                              </>
                            )}
                          </select>
                        )}
                      </td>

                      {/* Action trigger */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-medium transition-colors"
                        >
                          <Eye size={14} />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low/30 px-6 py-4">
              <div className="text-xs font-semibold text-on-surface-variant">
                Hiển thị <span className="font-bold text-on-surface">{filteredOrders.length}</span> trên <span className="font-bold text-on-surface">{totalItems}</span> đơn hàng (Trang {page} / {totalPages})
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ORDER DETAILS MODAL ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-outline bg-surface-container-lowest shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low p-4 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black text-on-surface">
                    Chi tiết đơn hàng #{selectedOrder.code}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-sm ${getStatusConfig(selectedOrder.status).bg
                      }`}
                  >
                    {getStatusConfig(selectedOrder.status).icon}
                    {getStatusConfig(selectedOrder.status).text}
                  </span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant flex items-center gap-1">
                  <Calendar size={12} />
                  Thời gian đặt: {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                aria-label="Đóng chi tiết"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Left side: Item list (span 2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                    <Package size={16} />
                    Danh sách sản phẩm ({selectedOrder.items?.length || 0})
                  </h3>

                  <div className="rounded-xl border border-outline-variant bg-surface-container-low/30 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low/80 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          <th className="p-3">Sản phẩm</th>
                          <th className="p-3 text-right">Đơn giá</th>
                          <th className="p-3 text-center">Số lượng</th>
                          <th className="p-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/40">
                        {selectedOrder.items?.map((item, idx) => {
                          const prod = typeof item.productId === 'object' && item.productId !== null ? item.productId : null
                          const prodName = prod ? prod.productName : 'Sản phẩm'
                          const prodSku = prod?.sku || 'N/A'
                          const prodUnit = prod?.unit || 'sp'
                          const prodImg = prod?.imageUrl || null

                          return (
                            <tr key={idx} className="hover:bg-surface-container-low/10">
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <div className="w-8 h-8 rounded border border-outline-variant bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                                    {prodImg ? (
                                      <img src={prodImg} alt={prodName} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package size={14} className="text-on-surface-variant opacity-60" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-on-surface">{prodName}</p>
                                    <p className="text-[10px] font-mono text-on-surface-variant">SKU: {prodSku}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-right text-on-surface">
                                {formatVND(item.unitPrice)}
                              </td>
                              <td className="p-3 text-center font-bold text-on-surface">
                                {item.quantity} <span className="text-[10px] font-normal text-on-surface-variant">{prodUnit}</span>
                              </td>
                              <td className="p-3 text-right font-black text-on-surface">
                                {formatVND(item.subtotal)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Note block */}
                  {selectedOrder.note && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <FileText size={14} />
                        Ghi chú từ khách hàng
                      </h4>
                      <p className="text-sm text-amber-900 italic font-medium">
                        "{selectedOrder.note}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Right side: Customer/Branch details & Action flow */}
                <div className="space-y-6">

                  {/* Customer information block */}
                  <div className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-low/20 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                      <User size={14} />
                      Thông tin khách hàng
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="font-bold text-on-surface">
                          {selectedOrder.customerId && typeof selectedOrder.customerId === 'object'
                            ? selectedOrder.customerId.fullName
                            : 'Khách vãng lai'}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          {selectedOrder.customerId && typeof selectedOrder.customerId === 'object'
                            ? selectedOrder.customerId.email
                            : 'N/A'}
                        </div>
                      </div>

                      <div className="border-t border-outline-variant/60 pt-2 text-xs space-y-1.5">
                        <p className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="font-bold text-on-surface">Số ĐT:</span>
                          {selectedOrder.customerId && typeof selectedOrder.customerId === 'object'
                            ? selectedOrder.customerId.phone || 'Chưa cập nhật'
                            : 'N/A'}
                        </p>
                        <p className="flex items-start gap-1.5 text-on-surface-variant">
                          <MapPin size={12} className="shrink-0 mt-0.5" />
                          <span>
                            <span className="font-bold text-on-surface">Địa chỉ giao:</span>{' '}
                            {selectedOrder.deliveryAddress || 'Nhận tại quầy'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Handling Branch block */}
                  <div className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-low/20 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                      <Building2 size={14} />
                      Chi nhánh xử lý
                    </h3>
                    <div className="text-sm">
                      <p className="font-bold text-on-surface">
                        {selectedOrder.branchId && typeof selectedOrder.branchId === 'object'
                          ? selectedOrder.branchId.name
                          : 'Cửa hàng mặc định'}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Mã: {selectedOrder.branchId && typeof selectedOrder.branchId === 'object'
                          ? selectedOrder.branchId.code
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Financial summary */}
                  <div className="space-y-2 rounded-xl bg-surface-container-low p-4">
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Tiền hàng</span>
                      <span>{formatVND(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Phí vận chuyển</span>
                      <span>0 đ</span>
                    </div>
                    <div className="border-t border-outline-variant pt-2 flex justify-between font-black text-on-surface text-base">
                      <span>TỔNG CỘNG</span>
                      <span className="text-primary">{formatVND(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Action & Transitions Block */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Thao tác nghiệp vụ
                    </h3>

                    {/* Pending state actions (Duyệt/Xác nhận) */}
                    {selectedOrder.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmOrder(selectedOrder._id)}
                          disabled={actionLoading}
                          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                        >
                          {actionLoading ? 'Đang thực hiện...' : 'Xác nhận đơn hàng'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelled')}
                          disabled={actionLoading}
                          className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          Hủy đơn hàng
                        </button>
                      </div>
                    )}

                    {/* Confirmed state actions */}
                    {selectedOrder.status === 'confirmed' && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedOrder._id, 'preparing')}
                          disabled={actionLoading}
                          className="w-full rounded-xl bg-purple-700 py-3 text-sm font-bold text-white hover:bg-purple-800 transition-colors shadow-sm disabled:opacity-50"
                        >
                          Bắt đầu chuẩn bị hàng
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder._id, 'pending')}
                            disabled={actionLoading}
                            className="flex-1 rounded-xl border border-outline py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
                          >
                            Quay lại: Chờ duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelled')}
                            disabled={actionLoading}
                            className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                          >
                            Hủy đơn hàng
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Preparing state actions */}
                    {selectedOrder.status === 'preparing' && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedOrder._id, 'delivering')}
                          disabled={actionLoading}
                          className="w-full rounded-xl bg-indigo-700 py-3 text-sm font-bold text-white hover:bg-indigo-800 transition-colors shadow-sm disabled:opacity-50"
                        >
                          Bắt đầu giao hàng
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder._id, 'confirmed')}
                            disabled={actionLoading}
                            className="flex-1 rounded-xl border border-outline py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
                          >
                            Quay lại: Xác nhận
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelled')}
                            disabled={actionLoading}
                            className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                          >
                            Hủy đơn hàng
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delivering state actions */}
                    {selectedOrder.status === 'delivering' && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered')}
                          disabled={actionLoading}
                          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                          Xác nhận giao thành công
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder._id, 'preparing')}
                            disabled={actionLoading}
                            className="flex-1 rounded-xl border border-outline py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
                          >
                            Quay lại: Chuẩn bị
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelled')}
                            disabled={actionLoading}
                            className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                          >
                            Hủy đơn hàng
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Finalized states (Delivered, Cancelled) */}
                    {['delivered', 'cancelled'].includes(selectedOrder.status) && (
                      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-center">
                        <p className="text-xs text-on-surface-variant">
                          Đơn hàng này đã kết thúc xử lý. Không thể thay đổi trạng thái.
                        </p>
                        {selectedOrder.confirmedBy && (
                          <p className="mt-2 text-[10px] text-on-surface-variant font-mono">
                            Người duyệt:{' '}
                            {typeof selectedOrder.confirmedBy === 'object'
                              ? selectedOrder.confirmedBy.fullName
                              : selectedOrder.confirmedBy}
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
