import { useState, type ReactNode } from 'react'
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import {
  ChevronRight,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  Package,
  Layers,
  X,
  UserCheck,
  Users,
  Ticket,
  Settings2,
  Zap,
  TrendingUp,
  Calendar,
  ChevronLeft,
  Home,
  User,
  LayoutDashboard,
  Heart,
  Settings,
} from 'lucide-react'

type NavItem = {
  path: string
  label: string
  description: string
  icon: ReactNode
}

const getInitials = (name?: string) => {
  if (!name) return 'A'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

const BACK_OFFICE_ROLES = ['admin', 'branch_manager', 'staff'] as const
type BackOfficeRole = (typeof BACK_OFFICE_ROLES)[number]

const isBackOffice = (role: string): role is BackOfficeRole =>
  (BACK_OFFICE_ROLES as readonly string[]).includes(role)

export const AdminLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Wait for auth to finish loading before making redirect decisions
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-surface"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  // Redirect non-backoffice users
  if (!user || !isBackOffice(user.role)) {
    return <Navigate to="/login" replace />
  }

  const displayName = user.fullName || 'Staff'
  const roleLabel = user.role

  const customerRoutes = [
    '/admin/customer-overview',
    '/admin/orders-history',
    '/admin/favorites',
    '/admin/profile',
    '/admin/addresses',
    '/admin/vouchers',
    '/admin/customer-settings',
  ]
  const isCustomerView = customerRoutes.includes(location.pathname)

  let navItems: NavItem[] = []

  if (isCustomerView) {
    navItems = [
      {
        path: '/admin/customer-overview',
        label: 'Tổng quan',
        description: 'Tóm tắt tài khoản',
        icon: <LayoutDashboard size={20} />,
      },
      {
        path: '/admin/orders-history',
        label: 'Đơn hàng của tôi',
        description: 'Theo dõi mua sắm',
        icon: <ShoppingBag size={20} />,
      },
      {
        path: '/admin/favorites',
        label: 'Sản phẩm yêu thích',
        description: 'Sản phẩm đã lưu',
        icon: <Heart size={20} />,
      },
      {
        path: '/admin/profile',
        label: 'Hồ sơ cá nhân',
        description: 'Thông tin tài khoản',
        icon: <User size={20} />,
      },
      {
        path: '/admin/addresses',
        label: 'Sổ địa chỉ',
        description: 'Địa chỉ giao hàng',
        icon: <MapPin size={20} />,
      },
      {
        path: '/admin/vouchers',
        label: 'Kho Voucher',
        description: 'Mã giảm giá',
        icon: <Ticket size={20} />,
      },
      {
        path: '/admin/customer-settings',
        label: 'Cài đặt',
        description: 'Bảo mật & thông báo',
        icon: <Settings size={20} />,
      },
      {
        path: '/admin',
        label: 'Quay lại Bảng điều khiển',
        description: 'Trở về trang quản trị',
        icon: <ChevronLeft size={20} />,
      },
    ]
  } else {
    navItems = [
      {
        path: '/admin',
        label: 'Quản lý Đơn hàng',
        description: 'Duyệt & theo dõi đơn hàng',
        icon: <ShoppingBag size={20} />,
      },
      {
        path: '/admin/inventory',
        label: 'Kho hàng & Nhập kho',
        description: 'Tồn kho & phiếu nhập',
        icon: <Package size={20} />,
      },
      {
        path: '/admin/branches',
        label: 'Chi nhánh',
        description: 'Quản lý cửa hàng',
        icon: <MapPin size={20} />,
      },
      {
        path: '/admin/shifts',
        label: 'Lịch & Ca làm',
        description: 'Đăng ký & quản lý ca làm',
        icon: <Calendar size={20} />,
      },
    ]

    if (user?.role === 'admin' || user?.role === 'branch_manager') {
      navItems.unshift({
        path: '/admin/statistics',
        label: 'Báo cáo & Thống kê',
        description: 'Phân tích doanh thu & KPIs',
        icon: <TrendingUp size={20} />,
      })
      navItems.push({
        path: '/admin/promotions',
        label: 'Khuyến mãi',
        description: 'Quản lý ưu đãi & voucher',
        icon: <Ticket size={20} />,
      })
      navItems.push({
        path: '/admin/flash-sales',
        label: 'Quản lý Flash Sale',
        description: 'Giờ vàng giảm giá sốc',
        icon: <Zap size={20} />,
      })
      navItems.push({
        path: '/admin/banners',
        label: 'Quản lý Banner',
        description: 'Thiết lập banner trang chủ',
        icon: <Layers size={20} />,
      })
      navItems.push({
        path: '/admin/employees',
        label: 'Nhân viên',
        description: 'Quản lý nhân viên chi nhánh',
        icon: <UserCheck size={20} />,
      })
    }

    if (user?.role === 'admin') {
      navItems.push({
        path: '/admin/categories',
        label: 'Danh mục',
        description: 'Quản lý danh mục sản phẩm',
        icon: <Layers size={20} />,
      })
      navItems.push({
        path: '/admin/users',
        label: 'Thành viên',
        description: 'Quản lý người dùng',
        icon: <Users size={20} />,
      })
      navItems.push({
        path: '/admin/settings',
        label: 'Cài đặt hệ thống',
        description: 'Thông số vận hành hệ thống',
        icon: <Settings2 size={20} />,
      })
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          {/* Left: hamburger + logo */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((c) => !c)}
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface lg:hidden"
              aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link to="/" className="flex items-center gap-2" title="Quay lại trang chủ">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <Layers size={18} />
              </div>
              <div className="hidden sm:block">
                <p className="text-lg font-black leading-none text-primary">PMAN-Mart Admin</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                  Back-Office Portal
                </p>
              </div>
            </Link>
          </div>

          {/* Center: search bar */}
          <div className="hidden flex-1 justify-center md:flex">
            <div className="relative w-full max-w-xl">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                id="admin-search"
                type="text"
                placeholder="Tìm kiếm đơn hàng, sản phẩm, chi nhánh..."
                className="w-full rounded-lg border border-transparent bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                aria-label="Tìm kiếm back-office"
              />
            </div>
          </div>

          {/* Right: user info */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3 h-full">
            <div className="flex h-full items-center gap-2 border-l border-outline-variant pl-3">
              <div className="relative flex h-full items-center">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-left cursor-pointer group sm:min-w-[200px]"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(displayName)
                    )}
                  </div>
                  <div className="hidden sm:block pr-1">
                    <p className="max-w-36 truncate text-sm font-bold text-on-surface">
                      {displayName}
                    </p>
                    <div className="flex items-center gap-1">
                      <UserCheck size={12} className="text-primary" />
                      <p className="text-[10px] uppercase font-black tracking-wider text-primary">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-0 w-full min-w-[200px] bg-surface-container-lowest rounded-b-xl shadow-lg py-2 z-50 border border-t-0 border-outline-variant flex flex-col">
                    <Link
                      to="/"
                      className="flex w-full items-center gap-[17px] pl-[9px] pr-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Home size={18} className="text-on-surface-variant" />
                      <span className="font-medium">Trang chủ</span>
                    </Link>
                    <Link
                      to="/admin/profile"
                      className="flex w-full items-center gap-[17px] pl-[9px] pr-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={18} className="text-on-surface-variant" />
                      <span className="font-medium">Hồ sơ cá nhân</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      className="flex w-full items-center gap-[17px] pl-[9px] pr-4 py-2.5 text-sm text-error hover:bg-error-container transition-colors"
                    >
                      <LogOut size={18} />
                      <span className="font-medium">Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ── SIDEBAR ── */}
        <aside
          className={`fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r border-outline-variant bg-surface-container-lowest transition-all duration-300 lg:sticky ${
            isCollapsed ? 'w-20' : 'w-72'
          } ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3.5 top-12 hidden lg:flex h-12 w-3.5 items-center justify-center rounded-r-md border border-l-0 border-outline-variant bg-surface-container-lowest text-on-surface hover:text-primary hover:bg-surface-container-low transition-colors z-50 cursor-pointer shadow-sm"
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <div className="flex flex-col gap-1 opacity-60">
              <div className="w-0.5 h-1 bg-current rounded-full"></div>
              <div className="w-0.5 h-1 bg-current rounded-full"></div>
              <div className="w-0.5 h-1 bg-current rounded-full"></div>
            </div>
          </button>

          <div className="flex h-full flex-col p-4 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <nav className="space-y-1" aria-label="Admin navigation">
              {navItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center rounded-lg transition-colors group ${
                      isCollapsed ? 'justify-center p-2' : 'px-3 py-3'
                    } ${
                      active
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                  >
                    <span className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          active 
                            ? (isCollapsed ? 'bg-transparent' : 'bg-white/45') 
                            : 'bg-surface-container-low group-hover:bg-surface-container-high'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span 
                        className={`flex-1 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${
                          isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-48 opacity-100 ml-1'
                        }`}
                      >
                        <span className="block truncate text-sm font-bold">{item.label}</span>
                        <span className="block truncate text-xs opacity-75">
                          {item.description}
                        </span>
                      </span>
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay khi sidebar mở trên mobile */}
        {sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/45 lg:hidden"
            aria-label="Đóng menu"
          />
        ) : null}

        {/* ── MAIN CONTENT ── */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2 text-sm text-on-surface-variant">
              <Link to="/admin" className="hover:text-primary transition-colors">
                Admin
              </Link>
              <ChevronRight size={16} />
              <span className="font-bold text-on-surface capitalize">
                {location.pathname === '/admin'
                  ? 'Đơn hàng'
                  : location.pathname.split('/').pop()}
              </span>
            </div>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
