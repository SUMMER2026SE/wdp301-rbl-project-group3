import { Link } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}
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
  type LucideIcon,
} from 'lucide-react'

type StatCard = {
  title: string
  value: string | number
  helper: string
  icon: LucideIcon
  tone: string
  link: string
}

type RecentOrder = {
  id: string
  date: string
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  items: number
}

const stats: StatCard[] = [
  {
    title: 'Total Orders',
    value: 24,
    helper: '2 orders in progress',
    icon: ShoppingBag,
    tone: 'bg-primary-container text-on-primary-container',
    link: '/dashboard/orders',
  },
  {
    title: 'Favorites',
    value: 12,
    helper: '3 items on sale',
    icon: Heart,
    tone: 'bg-error-container text-on-error-container',
    link: '/dashboard/favorites',
  },
  {
    title: 'Vouchers',
    value: 5,
    helper: '1 expires soon',
    icon: Ticket,
    tone: 'bg-tertiary-container text-on-tertiary-container',
    link: '/dashboard/vouchers',
  },
  {
    title: 'Total Spent',
    value: '1.234.000 đ',
    helper: 'Across 24 orders',
    icon: TrendingUp,
    tone: 'bg-secondary-container text-white',
    link: '/dashboard/orders',
  },
]

const recentOrders: RecentOrder[] = [
  {
    id: 'ORD-001',
    date: '2026-05-24',
    total: 270000,
    status: 'completed',
    items: 5,
  },
  {
    id: 'ORD-002',
    date: '2026-05-23',
    total: 90000,
    status: 'processing',
    items: 3,
  },
  {
    id: 'ORD-003',
    date: '2026-05-20',
    total: 490000,
    status: 'pending',
    items: 8,
  },
]

const statusMeta: Record<
  RecentOrder['status'],
  { label: string; icon: LucideIcon; className: string }
> = {
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-primary-container text-on-primary-container',
  },
  processing: {
    label: 'Processing',
    icon: Package,
    className: 'bg-tertiary-container text-on-tertiary-container',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-surface-container-high text-on-surface-variant',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-error-container text-on-error-container',
  },
}

export const DashboardOverview = () => {
  const { user } = useAuth()
  const displayName = user?.fullName || 'Customer'

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Account overview
            </p>
            <h1 className="mt-2 text-2xl font-black text-on-surface sm:text-3xl">
              Welcome back, {displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant sm:text-base">
              Review active orders, saved products, vouchers, and account security from one place.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant"
          >
            Continue Shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="group rounded-xl border border-outline-variant bg-surface-container-lowest p-5 transition-colors hover:border-primary/40"
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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between border-b border-outline-variant p-5">
            <div>
              <h2 className="text-lg font-black text-on-surface">Recent Orders</h2>
              <p className="text-sm text-on-surface-variant">Latest account activity</p>
            </div>
            <Link
              to="/dashboard/orders"
              className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="divide-y divide-outline-variant">
            {recentOrders.map((order) => {
              const meta = statusMeta[order.status]
              const StatusIcon = meta.icon

              return (
                <div
                  key={order.id}
                  className="grid gap-3 p-5 transition-colors hover:bg-surface-container-low sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-on-surface">{order.id}</p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}
                      >
                        <StatusIcon size={14} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {order.date} · {order.items} items
                    </p>
                  </div>
                  <p className="text-lg font-black text-primary">{formatVND(order.total)}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="text-lg font-black text-on-surface">Quick Actions</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Shortcuts for common account tasks.
          </p>

          <div className="mt-5 space-y-3">
            <Link
              to="/dashboard/vouchers"
              className="flex items-center justify-between rounded-lg bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-container text-on-tertiary-container">
                  <Ticket size={20} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-on-surface">Use Voucher</span>
                  <span className="block text-xs text-on-surface-variant">5 available</span>
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
                  <span className="block text-sm font-bold text-on-surface">Verify Profile</span>
                  <span className="block text-xs text-on-surface-variant">
                    {user?.isEmailVerified ? 'Email verified' : 'Email verification pending'}
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
