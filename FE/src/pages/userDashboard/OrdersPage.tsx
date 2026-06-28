import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  Clock,
  Package,
  Search,
  ShoppingBag,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  FileText,
  Calendar,
  X,
  Truck
} from 'lucide-react'
import { orderService } from '@/services/orderService'
import type { Order, OrderStatus } from '@/types'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

const statusMeta: Record<
  OrderStatus,
  { label: string; icon: any; className: string; color: string }
> = {
  pending: {
    label: 'Chờ xác nhận',
    icon: Clock,
    className: 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30',
    color: '#79747E'
  },
  confirmed: {
    label: 'Đã xác nhận',
    icon: CheckCircle,
    className: 'bg-primary/10 text-primary border border-primary/20',
    color: '#6750A4'
  },
  preparing: {
    label: 'Đang chuẩn bị',
    icon: Package,
    className: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
    color: '#625B71'
  },
  delivering: {
    label: 'Đang giao hàng',
    icon: Truck,
    className: 'bg-secondary/10 text-secondary border border-secondary/20',
    color: '#625B71'
  },
  delivered: {
    label: 'Đã giao thành công',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border border-success/20',
    color: '#2E7D32'
  },
  cancelled: {
    label: 'Đã hủy',
    icon: XCircle,
    className: 'bg-error/10 text-error border border-error/20',
    color: '#B3261E'
  },
}

const statusTabs: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả đơn' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

export const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination states
  const [page, setPage] = useState(1)
  const limit = 5

  // Reset page to 1 when tab filters or search query changes
  useEffect(() => {
    setPage(1)
  }, [selectedStatusTab, searchQuery])

  // Detailed Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [trackingList, setTrackingList] = useState<any[]>([])
  const [trackingLoading, setTrackingLoading] = useState(false)

  // Cancel Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      // Fetch latest 100 orders of the customer
      const response = await orderService.getOrders({ page: 1, limit: 100 })
      if (response.success) {
        setOrders(response.data.orders || [])
      } else {
        setError(response.message || 'Không thể tải lịch sử đơn hàng.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi kết nối dữ liệu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Calculate order counts for tabs locally
  const orderCounts = useMemo(() => {
    const counts = { all: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0 }
    orders.forEach((o) => {
      counts.all++
      if (o.status === 'pending') {
        counts.pending++
      } else if (['confirmed', 'preparing', 'delivering'].includes(o.status)) {
        counts.processing++
      } else if (o.status === 'delivered') {
        counts.delivered++
      } else if (o.status === 'cancelled') {
        counts.cancelled++
      }
    })
    return counts
  }, [orders])

  // Filter orders based on tabs and search query
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    
    return orders.filter((order) => {
      // Tab filter
      let statusMatches = false
      if (selectedStatusTab === 'all') {
        statusMatches = true
      } else if (selectedStatusTab === 'pending') {
        statusMatches = order.status === 'pending'
      } else if (selectedStatusTab === 'processing') {
        statusMatches = ['confirmed', 'preparing', 'delivering'].includes(order.status)
      } else if (selectedStatusTab === 'delivered') {
        statusMatches = order.status === 'delivered'
      } else if (selectedStatusTab === 'cancelled') {
        statusMatches = order.status === 'cancelled'
      }

      // Search filter
      const codeMatches = order.code ? order.code.toLowerCase().includes(query) : false
      const idMatches = order.orderId.toLowerCase().includes(query)
      const itemMatches = order.items.some((item) => 
        item.productName.toLowerCase().includes(query) || (item.sku && item.sku.toLowerCase().includes(query))
      )
      const queryMatches = !query || codeMatches || idMatches || itemMatches

      return statusMatches && queryMatches
    })
  }, [orders, selectedStatusTab, searchQuery])

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * limit
    return filteredOrders.slice(start, start + limit)
  }, [filteredOrders, page])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / limit) || 1
  }, [filteredOrders])

  // Open details modal and fetch tracking logs
  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order)
    setDetailModalOpen(true)
    setTrackingList([])
    
    try {
      setTrackingLoading(true)
      const response = await orderService.trackOrder(order.orderId)
      if (response.success && response.data) {
        setTrackingList(response.data.tracking || [])
      }
    } catch (err) {
      console.error('Failed to load tracking details:', err)
    } finally {
      setTrackingLoading(false)
    }
  }

  // Handle Cancel Order initiation
  const handleOpenCancelModal = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation()
    setOrderToCancel(order)
    setCancelReason('')
    setCancelModalOpen(true)
  }

  // Submit Cancel Order
  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderToCancel) return

    try {
      setCancelling(true)
      const reason = cancelReason.trim() || 'Hủy bởi khách hàng'
      const response = await orderService.cancelOrder(orderToCancel.orderId, reason)
      
      if (response.success) {
        alert('Hủy đơn hàng thành công.')
        setCancelModalOpen(false)
        setOrderToCancel(null)
        fetchOrders() // refresh list
        
        // If details modal is open for this order, close it or refresh it
        if (selectedOrder && selectedOrder.orderId === orderToCancel.orderId) {
          setDetailModalOpen(false)
          setSelectedOrder(null)
        }
      } else {
        alert(response.message || 'Hủy đơn hàng thất bại.')
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi hủy đơn hàng.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Khách hàng</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
            Lịch sử mua hàng
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Theo dõi trạng thái giao nhận đơn hàng, xem chi tiết hóa đơn và hành trình vận chuyển.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant shadow-md"
        >
          <ShoppingBag size={18} />
          Tiếp tục mua sắm
        </Link>
      </section>

      {/* ── FILTER & SEARCH BAR ── */}
      <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo mã đơn, tên sản phẩm hoặc SKU..."
              className="w-full rounded-xl border border-transparent bg-surface-container-low py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusTabs.map((tab) => {
            const active = selectedStatusTab === tab.value
            const count = orderCounts[tab.value as keyof typeof orderCounts] ?? 0

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedStatusTab(tab.value)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                  active
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    active
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── ORDERS LIST ── */}
      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
          <Loader2 size={36} className="text-primary animate-spin mb-3" />
          <p className="text-sm text-on-surface-variant font-medium">Đang tải lịch sử mua hàng của bạn...</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-error-container text-on-error-container rounded-2xl border border-error/20">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest py-16 text-center">
          <Package size={54} className="mx-auto mb-4 text-on-surface-variant opacity-60" />
          <h3 className="text-lg font-bold text-on-surface">Không tìm thấy đơn hàng nào</h3>
          <p className="mt-2 text-sm text-on-surface-variant max-w-xs mx-auto">
            Không có giao dịch nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            {paginatedOrders.map((order) => {
              const meta = statusMeta[order.status] || statusMeta.pending
              const StatusIcon = meta.icon

              return (
                <article
                  key={order.orderId}
                  onClick={() => handleViewDetails(order)}
                  className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest hover:border-primary/30 transition-all cursor-pointer shadow-sm group"
                >
                  {/* Header of Order card */}
                  <div className="grid gap-4 border-b border-outline-variant/60 bg-surface-container-low/40 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
                        <StatusIcon size={20} style={{ color: meta.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">
                          Đơn hàng #{order.code || order.orderId.substring(order.orderId.length - 8).toUpperCase()}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
                          <Calendar size={12} />
                          Đặt ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')} {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
                      >
                        <StatusIcon size={12} />
                        {meta.label}
                      </span>
                      <p className="text-lg font-black text-primary">{formatVND(order.totalAmount)}</p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="divide-y divide-outline-variant/40">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[4rem_1fr_auto] gap-4 p-4">
                        <div className="h-14 w-14 overflow-hidden rounded-lg bg-surface border border-outline-variant/20 flex-shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package size={20} className="text-on-surface-variant/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-on-surface">{item.productName}</p>
                          <p className="mt-1 text-xs text-on-surface-variant font-medium">
                            Số lượng: {item.quantity} {item.unit ? `x ${item.unit}` : ''} x {formatVND(item.unitPrice ?? item.price ?? 0)}
                          </p>
                        </div>
                        <p className="text-sm font-black text-on-surface">
                          {formatVND(item.subtotal)}
                        </p>
                      </div>
                    ))}

                    {order.items.length > 2 && (
                      <div className="p-3 text-center text-xs font-bold text-primary bg-surface-container-low/20">
                        Xem thêm {order.items.length - 2} sản phẩm khác
                      </div>
                    )}
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex flex-col gap-3 border-t border-outline-variant/40 bg-surface-container-low/20 p-4 sm:flex-row sm:justify-between sm:items-center">
                    <div className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
                      <MapPin size={14} className="text-primary" />
                      <span>Chi nhánh: {order.branch?.name || 'PMAN-Mart'}</span>
                    </div>

                    <div className="flex gap-2 justify-end">
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenCancelModal(order, e)}
                          className="rounded-xl border border-error/30 bg-error/5 text-error px-4 py-2 text-xs font-bold transition-all hover:bg-error hover:text-white cursor-pointer"
                        >
                          Hủy đơn hàng
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded-xl bg-primary text-white px-4 py-2 text-xs font-bold transition-all hover:bg-on-primary-fixed-variant shadow-sm cursor-pointer"
                      >
                        Chi tiết đơn
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border border-outline-variant bg-surface-container-lowest px-6 py-4 mt-6 rounded-2xl shadow-sm">
              <div className="text-xs font-semibold text-on-surface-variant">
                Hiển thị <span className="font-bold text-on-surface">{paginatedOrders.length}</span> trên <span className="font-bold text-on-surface">{filteredOrders.length}</span> đơn hàng (Trang {page} / {totalPages})
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── DETAIL & TIMELINE MODAL ── */}
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest max-w-4xl w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant p-4 bg-surface-container-low">
              <div>
                <h3 className="text-lg font-black text-on-surface">
                  Chi tiết đơn hàng #{selectedOrder.code || selectedOrder.orderId.substring(selectedOrder.orderId.length - 8).toUpperCase()}
                </h3>
                <p className="text-[11px] text-on-surface-variant font-medium mt-1">
                  Mã ID: {selectedOrder.orderId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false)
                  setSelectedOrder(null)
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: Order summary & Info (7/12 width) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Branch and Delivery details */}
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-3">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider">Thông tin giao nhận</h4>
                  
                  <div className="space-y-2 text-sm text-on-surface">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Địa chỉ giao hàng:</p>
                        <p className="text-on-surface-variant text-xs mt-0.5">{selectedOrder.deliveryAddress || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 border-t border-outline-variant/20 pt-2">
                      <Phone size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Điện thoại nhận hàng:</p>
                        <p className="text-on-surface-variant text-xs mt-0.5 font-mono">{selectedOrder.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>

                    {selectedOrder.note && (
                      <div className="flex items-start gap-2 border-t border-outline-variant/20 pt-2">
                        <FileText size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Ghi chú của bạn:</p>
                          <p className="text-on-surface-variant text-xs mt-0.5 italic">"{selectedOrder.note}"</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 border-t border-outline-variant/20 pt-2">
                      <Package size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Chi nhánh xử lý:</p>
                        <p className="text-on-surface-variant text-xs mt-0.5">
                          {selectedOrder.branch?.name || 'PMAN-Mart'} 
                          {selectedOrder.branch?.address ? ` - ${selectedOrder.branch.address}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider">Danh sách sản phẩm</h4>
                  
                  <div className="divide-y divide-outline-variant/40 border border-outline-variant/40 rounded-xl overflow-hidden bg-surface-container-low/20">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-4 items-center">
                        <div className="h-12 h-12 w-12 overflow-hidden rounded-lg bg-surface border border-outline-variant/30 shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package size={18} className="text-on-surface-variant/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">{item.productName}</p>
                          {item.sku && <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">SKU: {item.sku}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-on-surface">
                            {item.quantity} {item.unit || 'item'} x {formatVND(item.unitPrice ?? item.price ?? 0)}
                          </p>
                          <p className="text-[11px] font-bold text-on-surface-variant mt-0.5">
                            {formatVND(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Details summary */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Hình thức thanh toán:</span>
                      <span className="font-bold uppercase text-xs">{selectedOrder.paymentMethod || 'COD (Tiền mặt)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Trạng thái thanh toán:</span>
                      <span className="font-bold text-xs capitalize text-tertiary">{selectedOrder.paymentStatus || 'Chưa thanh toán'}</span>
                    </div>
                    <div className="flex justify-between border-t border-outline-variant/20 pt-2 text-base font-black">
                      <span>Tổng tiền thanh toán:</span>
                      <span className="text-primary">{formatVND(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Vertical Tracking Timeline (5/12 width) */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-xs font-black text-primary uppercase tracking-wider">Hành trình đơn hàng</h4>
                
                {trackingLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 size={24} className="text-primary animate-spin mb-2" />
                    <p className="text-xs text-on-surface-variant font-semibold">Đang tải hành trình...</p>
                  </div>
                ) : trackingList.length === 0 ? (
                  /* If backend returns no tracking logs, generate a default timeline based on current status */
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/50">
                    {/* Delivired event (if completed) */}
                    {selectedOrder.status === 'delivered' && (
                      <div className="relative flex gap-3 text-xs">
                        <div className="absolute left-[-21px] top-1.5 w-3 h-3 rounded-full bg-success ring-4 ring-success/15" />
                        <div>
                          <p className="font-bold text-success">Đã giao thành công</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">Hoàn thành giao nhận tại siêu thị/địa chỉ</p>
                        </div>
                      </div>
                    )}

                    {/* Cancelled event (if cancelled) */}
                    {selectedOrder.status === 'cancelled' && (
                      <div className="relative flex gap-3 text-xs">
                        <div className="absolute left-[-21px] top-1.5 w-3 h-3 rounded-full bg-error ring-4 ring-error/15" />
                        <div>
                          <p className="font-bold text-error">Đơn hàng đã hủy</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">Đơn hàng bị hủy bỏ</p>
                        </div>
                      </div>
                    )}

                    {/* Shipping event (if delivering) */}
                    {['delivering', 'delivered'].includes(selectedOrder.status) && (
                      <div className="relative flex gap-3 text-xs">
                        <div className={`absolute left-[-21px] top-1.5 w-3 h-3 rounded-full ${selectedOrder.status === 'delivering' ? 'bg-primary ring-4 ring-primary/15' : 'bg-outline-variant'}`} />
                        <div>
                          <p className={`font-bold ${selectedOrder.status === 'delivering' ? 'text-primary' : 'text-on-surface'}`}>Đang giao hàng</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">Nhân viên đang giao hàng đến bạn</p>
                        </div>
                      </div>
                    )}

                    {/* Confirm event (if confirmed/preparing/delivering/delivered) */}
                    {['confirmed', 'preparing', 'delivering', 'delivered'].includes(selectedOrder.status) && (
                      <div className="relative flex gap-3 text-xs">
                        <div className={`absolute left-[-21px] top-1.5 w-3 h-3 rounded-full ${['confirmed', 'preparing'].includes(selectedOrder.status) ? 'bg-primary ring-4 ring-primary/15' : 'bg-outline-variant'}`} />
                        <div>
                          <p className={`font-bold ${['confirmed', 'preparing'].includes(selectedOrder.status) ? 'text-primary' : 'text-on-surface'}`}>Đã xác nhận</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">Siêu thị đã xác nhận và chuẩn bị đóng gói hàng hóa</p>
                        </div>
                      </div>
                    )}

                    {/* Initial event */}
                    <div className="relative flex gap-3 text-xs">
                      <div className={`absolute left-[-21px] top-1.5 w-3 h-3 rounded-full ${selectedOrder.status === 'pending' ? 'bg-primary ring-4 ring-primary/15' : 'bg-outline-variant'}`} />
                      <div>
                        <p className={`font-bold ${selectedOrder.status === 'pending' ? 'text-primary' : 'text-on-surface'}`}>Đặt đơn thành công</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          Đơn hàng chờ siêu thị duyệt
                        </p>
                        <p className="text-[9px] font-mono text-on-surface-variant/70 mt-1">
                          {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Display actual tracking logs returned by API */
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/60">
                    {trackingList.map((log, index) => {
                      const isLatest = index === trackingList.length - 1
                      const meta = statusMeta[log.status as OrderStatus] || statusMeta.pending
                      
                      return (
                        <div key={log.trackingId} className="relative flex gap-3 text-xs animate-fade-in">
                          {/* Node circle */}
                          <div 
                            className={`absolute left-[-21px] top-1.5 w-3 h-3 rounded-full ${
                              isLatest ? 'ring-4' : ''
                            }`} 
                            style={{ 
                              backgroundColor: meta.color,
                              borderColor: meta.color,
                              // If latest, add glow ring
                              boxShadow: isLatest ? `0 0 0 4px ${meta.color}25` : 'none'
                            }} 
                          />
                          
                          <div>
                            <p 
                              className="font-bold" 
                              style={{ color: isLatest ? meta.color : 'inherit' }}
                            >
                              {meta.label}
                            </p>
                            
                            {log.note && (
                              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                                {log.note}
                              </p>
                            )}
                            {log.location && (
                              <p className="text-[9px] text-on-surface-variant/80 italic mt-0.5">
                                Vị trí: {log.location}
                              </p>
                            )}
                            
                            <p className="text-[9px] font-mono text-on-surface-variant/60 mt-1">
                              {new Date(log.timestamp).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-outline-variant/60 p-4 flex justify-between items-center bg-surface-container-low/40">
              <span className="text-xs font-semibold text-on-surface-variant">
                Trạng thái: <span className="font-black text-primary capitalize">{selectedOrder.status}</span>
              </span>

              <div className="flex gap-2">
                {selectedOrder.status === 'pending' && (
                  <button
                    type="button"
                    onClick={(e) => handleOpenCancelModal(selectedOrder, e)}
                    className="rounded-xl border border-error bg-error/5 text-error px-4 py-2.5 text-xs font-bold transition-all hover:bg-error hover:text-white cursor-pointer"
                  >
                    Hủy đơn hàng này
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false)
                    setSelectedOrder(null)
                  }}
                  className="rounded-xl bg-surface-container-highest px-5 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container-high-variant transition-colors cursor-pointer border border-outline-variant/30"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCEL ORDER CONFIRMATION MODAL ── */}
      {cancelModalOpen && orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant p-4 bg-surface-container-low">
              <h3 className="text-base font-black text-error flex items-center gap-2">
                <AlertCircle size={20} />
                Xác nhận hủy đơn hàng
              </h3>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => {
                  setCancelModalOpen(false)
                  setOrderToCancel(null)
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitCancel} className="p-6 space-y-4">
              <p className="text-sm text-on-surface font-medium leading-relaxed">
                Bạn có chắc chắn muốn hủy đơn hàng có mã{' '}
                <span className="font-bold text-primary">
                  #{orderToCancel.code || orderToCancel.orderId.substring(orderToCancel.orderId.length - 8).toUpperCase()}
                </span>{' '}
                không? Hành động này không thể hoàn tác.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="cancel-reason" className="text-xs font-bold text-on-surface-variant">
                  Lý do hủy đơn (Tùy chọn)
                </label>
                <textarea
                  id="cancel-reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn đổi sản phẩm khác, Nhập sai địa chỉ giao hàng..."
                  className="w-full bg-surface border border-outline rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  disabled={cancelling}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-outline-variant mt-6">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => {
                    setCancelModalOpen(false)
                    setOrderToCancel(null)
                  }}
                  className="flex-1 bg-surface-container-highest hover:bg-surface-container-high-variant text-on-surface px-4 py-2.5 rounded-xl font-bold text-xs transition-all border border-outline-variant/30 cursor-pointer disabled:opacity-50"
                >
                  Không, quay lại
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="flex-1 bg-error hover:bg-opacity-95 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Đang hủy...
                    </>
                  ) : (
                    'Xác nhận hủy'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
