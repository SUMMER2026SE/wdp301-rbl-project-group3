import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useSocket } from '@/contexts/SocketContext'
import { orderService } from '@/services/orderService'
import type { Order } from '@/types'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Heart,
  Package,
  ShoppingBag,
  Ticket,
  TrendingUp,
  XCircle,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

/**
 * Định nghĩa cấu trúc cho các thẻ thống kê tổng quan (Thẻ Card vuông góc trên).
 * Bao gồm tên thống kê, giá trị thực tế, mô tả phụ, icon và định dạng màu sắc (tone).
 */
type StatCard = {
  title: string
  value: string | number
  helper: string
  icon: LucideIcon
  tone: string
  link: string
}

/** 
 * Kiểu dữ liệu hẹp (Union Type) liệt kê các trạng thái có thể có của đơn hàng 
 * để hiển thị riêng trên Dashboard (đã được gom nhóm từ các trạng thái chi tiết của backend).
 */
type RecentOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

/**
 * Định nghĩa cấu trúc dữ liệu tóm tắt (View Model) của Đơn hàng để hiển thị trên bảng danh sách.
 * Giúp bóc tách logic hiển thị UI khỏi dữ liệu thô (raw data) trả về từ API.
 */
type DisplayOrder = {
  id: string
  code: string
  date: string
  total: number
  status: RecentOrderStatus
  itemsCount: number
}

/**
 * Bảng ánh xạ cấu hình (Configuration Map) liên kết giữa trạng thái đơn hàng (RecentOrderStatus)
 * và cách hiển thị tương ứng trên UI (như nhãn tiếng Việt, biểu tượng icon, CSS class màu sắc).
 */
const statusMeta: Record<
  RecentOrderStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  completed: {
    label: 'Đã hoàn thành',
    icon: CheckCircle,
    className: 'bg-primary-container text-on-primary-container',
  },
  processing: {
    label: 'Đang xử lý',
    icon: Package,
    className: 'bg-tertiary-container text-on-tertiary-container',
  },
  pending: {
    label: 'Chờ duyệt',
    icon: Clock,
    className: 'bg-surface-container-high text-on-surface-variant',
  },
  cancelled: {
    label: 'Đã hủy',
    icon: XCircle,
    className: 'bg-error-container text-on-error-container',
  },
}

/**
 * Component hiển thị trang Tổng quan (Dashboard Overview) của người dùng.
 * Cung cấp cái nhìn toàn cảnh về tài khoản: thống kê đơn hàng, tổng chi tiêu,
 * đơn hàng gần đây và các phím tắt nhanh tới các chức năng khác.
 * Tích hợp Socket.io để cập nhật trạng thái đơn hàng theo thời gian thực.
 *
 * @author MinhLD
 */
export const DashboardOverview = () => {
  const { user } = useAuth()
  
  /** Tên hiển thị (Display Name) của người dùng, dùng làm lời chào trên banner. Dự phòng là 'Customer'. */
  const displayName = user?.fullName || 'Customer'

  /** Trạng thái lưu trữ danh sách nguyên bản (raw data) toàn bộ đơn hàng của người dùng trả về từ API */
  const [orders, setOrders] = useState<Order[]>([])
  
  /** Trạng thái cờ tải dữ liệu (loading flag), mặc định bật để render khung xương (skeleton/spinner) lúc ban đầu */
  const [loading, setLoading] = useState(true)
  
  /** Trạng thái lưu trữ nội dung chuỗi thông báo lỗi để hiển thị cảnh báo (Alert) nếu API sập */
  const [error, setError] = useState<string | null>(null)

  /** Khởi tạo Context để lấy đối tượng websocket (socket.io) dùng cho việc kết nối thời gian thực */
  const { socket } = useSocket()

  /**
   * Gọi API để tải danh sách đơn hàng của người dùng hiện tại.
   * Lấy tối đa 100 đơn hàng gần nhất để phục vụ cho việc tính toán thống kê.
   */
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await orderService.getOrders({ page: 1, limit: 100 })
      if (response.success && response.data) {
        setOrders(response.data.orders || [])
      } else {
        setError(response.message || 'Không thể tải thông tin đơn hàng.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể kết nối dữ liệu đơn hàng.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  /**
   * Hook lắng nghe (Listener hook) kết nối với Socket.io của Backend.
   * Khi Backend phát tín hiệu đơn hàng có sự thay đổi (được tạo mới hoặc cập nhật trạng thái),
   * Dashboard sẽ lập tức bắt tín hiệu (trigger) và tự động gọi lại hàm loadData() để refresh giao diện
   * mà không cần người dùng phải bấm tải lại trang (F5).
   */
  useEffect(() => {
    if (!socket) return

    const handleOrderChange = () => {
      console.log('Realtime order update received in dashboard overview')
      loadData() // Refresh danh sách
    }

    // Lắng nghe 2 kênh sự kiện chính
    socket.on('order:status_updated', handleOrderChange)
    socket.on('order:new', handleOrderChange)

    // Cleanup function: Hủy đăng ký lắng nghe khi component unmount để tránh rò rỉ bộ nhớ (Memory Leak)
    return () => {
      socket.off('order:status_updated', handleOrderChange)
      socket.off('order:new', handleOrderChange)
    }
  }, [socket])

  /**
   * Sử dụng Hook useMemo để tối ưu hóa hiệu năng (Performance Optimization).
   * Đoạn code tính toán các chỉ số thống kê (tổng chi tiêu, tổng đơn, v.v.) khá nặng, 
   * nên useMemo sẽ lưu lại kết quả (cache) và CHỈ tính toán lại khi mảng dependency [orders] thực sự thay đổi.
   */
  const statsData = useMemo(() => {
    const totalOrders = orders.length
    
    // Sum of delivered orders totalAmount
    const totalSpent = orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0)

    // In-progress orders count
    const inProgressCount = orders.filter((o) =>
      ['pending', 'confirmed', 'preparing', 'delivering'].includes(o.status)
    ).length

    // Map recent orders (take top 3)
    const recentDisplay: DisplayOrder[] = orders.slice(0, 3).map((o) => {
      let displayStatus: RecentOrderStatus = 'pending'
      if (['confirmed', 'preparing', 'delivering'].includes(o.status)) {
        displayStatus = 'processing'
      } else if (o.status === 'delivered') {
        displayStatus = 'completed'
      } else if (o.status === 'cancelled') {
        displayStatus = 'cancelled'
      }

      const totalItems = o.items.reduce((sum, item) => sum + item.quantity, 0)
      const dateStr = new Date(o.createdAt).toLocaleDateString('vi-VN')

      return {
        id: o.orderId,
        code: o.code || o.orderId.substring(o.orderId.length - 8).toUpperCase(),
        date: dateStr,
        total: o.totalAmount,
        status: displayStatus,
        itemsCount: totalItems,
      }
    })

    return {
      totalOrders,
      totalSpent,
      inProgressCount,
      recentDisplay,
    }
  }, [orders])

  const stats: StatCard[] = [
    {
      title: 'Tổng số đơn hàng',
      value: statsData.totalOrders,
      helper: `${statsData.inProgressCount} đơn đang xử lý`,
      icon: ShoppingBag,
      tone: 'bg-primary-container text-on-primary-container',
      link: '/dashboard/orders',
    },
    {
      title: 'Yêu thích',
      value: 0,
      helper: 'Sản phẩm đã lưu',
      icon: Heart,
      tone: 'bg-error-container text-on-error-container',
      link: '/dashboard/favorites',
    },
    {
      title: 'Mã giảm giá',
      value: 0,
      helper: 'Voucher của tôi',
      icon: Ticket,
      tone: 'bg-tertiary-container text-on-tertiary-container',
      link: '/dashboard/vouchers',
    },
    {
      title: 'Đã chi tiêu',
      value: formatVND(statsData.totalSpent),
      helper: `Tính trên các đơn hoàn thành`,
      icon: TrendingUp,
      tone: 'bg-secondary-container text-white',
      link: '/dashboard/orders',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Overview Welcome Banner */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Tổng quan tài khoản
            </p>
            <h1 className="mt-2 text-2xl font-black text-on-surface sm:text-3xl">
              Xin chào, {displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant sm:text-base">
              Theo dõi tình trạng các đơn hàng đang giao dịch, lịch sử mua sắm và các chương trình ưu đãi của bạn.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant"
          >
            Tiếp tục mua sắm
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 bg-surface-container-lowest rounded-xl border border-outline-variant">
          <Loader2 size={30} className="text-primary animate-spin mb-2" />
          <p className="text-xs text-on-surface-variant font-semibold">Đang tổng hợp thông số tài khoản...</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <Link
                key={stat.title}
                to={stat.link}
                className="group rounded-xl border border-outline-variant bg-surface-container-lowest p-5 transition-colors hover:border-primary/40 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.tone}`}>
                    <Icon size={22} />
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-on-surface-variant transition-transform group-hover:translate-x-1 group-hover:text-primary"
                  />
                </div>
                <p className="mt-5 text-sm text-on-surface-variant">{stat.title}</p>
                <p className="mt-1 text-2xl font-black text-on-surface">{stat.value}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{stat.helper}</p>
              </Link>
            )
          })}
        </section>
      )}

      {/* Main content grid */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem]">
        {/* Recent Orders List Card */}
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant p-5">
            <div>
              <h2 className="text-lg font-black text-on-surface">Đơn hàng gần đây</h2>
              <p className="text-sm text-on-surface-variant">Lịch sử giao dịch mới nhất của bạn</p>
            </div>
            <Link
              to="/dashboard/orders"
              className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              Xem tất cả
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          ) : statsData.recentDisplay.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={36} className="mx-auto mb-2 text-on-surface-variant opacity-45" />
              <p className="text-sm font-bold text-on-surface-variant">Chưa có đơn hàng nào được tạo</p>
              <Link to="/" className="text-xs text-primary hover:underline mt-1 inline-block">Bắt đầu mua hàng ngay</Link>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {statsData.recentDisplay.map((order) => {
                const meta = statusMeta[order.status]
                const StatusIcon = meta.icon

                return (
                  <div
                    key={order.id}
                    className="grid gap-3 p-5 transition-colors hover:bg-surface-container-low sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-on-surface">Đơn hàng #{order.code}</p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}
                        >
                          <StatusIcon size={14} />
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Ngày đặt: {order.date} · Số lượng: {order.itemsCount} sản phẩm
                      </p>
                    </div>
                    <p className="text-lg font-black text-primary">{formatVND(order.total)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-black text-on-surface">Phím tắt nhanh</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Truy cập nhanh các tính năng thường dùng
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/dashboard/vouchers"
              className="flex items-center justify-between rounded-lg bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-container text-on-tertiary-container">
                  <Ticket size={20} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-on-surface">Mã giảm giá</span>
                  <span className="block text-xs text-on-surface-variant">Xem các voucher khả dụng</span>
                </span>
              </span>
              <ArrowRight size={18} className="text-on-surface-variant" />
            </Link>

            <Link
              to="/dashboard/profile"
              className="flex items-center justify-between rounded-lg bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <CheckCircle size={20} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-on-surface">Xác thực hồ sơ</span>
                  <span className="block text-xs text-on-surface-variant">
                    {user?.isEmailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}
                  </span>
                </span>
              </span>
              <ArrowRight size={18} className="text-on-surface-variant" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
