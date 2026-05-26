import { useState, type ReactNode } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import {
  Bell,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Ticket,
  User,
  X,
} from 'lucide-react'

type NavItem = {
  path: string
  label: string
  description: string
  icon: ReactNode
  badge?: number
}

const getInitials = (name?: string) => {
  if (!name) return 'U'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export const DashboardLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const displayName = user?.fullName || 'Customer'
  const roleLabel = user?.role || 'customer'

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Overview',
      description: 'Account summary',
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: '/dashboard/orders',
      label: 'Orders',
      description: 'Track purchases',
      icon: <ShoppingBag size={20} />,
      badge: 2,
    },
    {
      path: '/dashboard/favorites',
      label: 'Favorites',
      description: 'Saved products',
      icon: <Heart size={20} />,
    },
    {
      path: '/dashboard/addresses',
      label: 'Addresses',
      description: 'Delivery locations',
      icon: <MapPin size={20} />,
    },
    {
      path: '/dashboard/vouchers',
      label: 'Vouchers',
      description: 'Available savings',
      icon: <Ticket size={20} />,
    },
    {
      path: '/dashboard/profile',
      label: 'Profile',
      description: 'Personal details',
      icon: <User size={20} />,
    },
    {
      path: '/dashboard/settings',
      label: 'Settings',
      description: 'Security and alerts',
      icon: <Settings size={20} />,
    },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path
    }

    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface lg:hidden"
              aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <ShoppingBag size={18} />
              </div>
              <div className="hidden sm:block">
                <p className="text-lg font-black leading-none text-primary">WinMart+</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                  Account
                </p>
              </div>
            </Link>
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="relative w-full max-w-xl">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                type="text"
                placeholder="Search orders, products, vouchers..."
                className="w-full rounded-lg border border-transparent bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                aria-label="Search dashboard"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="relative rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
            </button>

            <div className="flex items-center gap-2 border-l border-outline-variant pl-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              <div className="hidden sm:block">
                <p className="max-w-36 truncate text-sm font-bold text-on-surface">
                  {displayName}
                </p>
                <p className="text-xs capitalize text-on-surface-variant">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-72 border-r border-outline-variant bg-surface-container-lowest transition-transform duration-300 lg:sticky ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex h-full flex-col justify-between p-4">
            <nav className="space-y-1" aria-label="Dashboard navigation">
              {navItems.map((item) => {
                const active = isActive(item.path)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-3 transition-colors ${
                      active
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          active ? 'bg-white/45' : 'bg-surface-container-low'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{item.label}</span>
                        <span className="block truncate text-xs opacity-75">
                          {item.description}
                        </span>
                      </span>
                    </span>

                    {item.badge ? (
                      <span className="ml-3 rounded-full bg-error px-2 py-0.5 text-xs font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-error transition-colors hover:bg-error-container"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-container">
                <LogOut size={20} />
              </span>
              <span className="text-sm font-bold">Logout</span>
            </button>
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/45 lg:hidden"
            aria-label="Close navigation overlay"
          />
        ) : null}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center gap-2 text-sm text-on-surface-variant">
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
              <ChevronRight size={16} />
              <span className="font-bold text-on-surface">Dashboard</span>
            </div>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
