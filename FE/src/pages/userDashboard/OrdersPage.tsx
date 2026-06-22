import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}
import {
  CheckCircle,
  Clock,
  Filter,
  Package,
  Search,
  ShoppingBag,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

type OrderStatus = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled'

type Order = {
  id: string
  date: string
  total: number
  status: Exclude<OrderStatus, 'all'>
  items: {
    name: string
    quantity: number
    price: number
    image: string
  }[]
}

const orders: Order[] = [
  {
    id: 'ORD-001',
    date: '2026-05-24',
    total: 270000,
    status: 'completed',
    items: [
      {
        name: 'Fresh Organic Tomato',
        quantity: 2,
        price: 30000,
        image: '/assets/winmart/tomatoes.png',
      },
      {
        name: 'Premium Ribeye Steak',
        quantity: 1,
        price: 210000,
        image: '/assets/winmart/ribeye.png',
      },
    ],
  },
  {
    id: 'ORD-002',
    date: '2026-05-23',
    total: 90000,
    status: 'processing',
    items: [
      {
        name: 'Whole Organic Milk',
        quantity: 3,
        price: 30000,
        image: '/assets/winmart/milk.png',
      },
    ],
  },
  {
    id: 'ORD-003',
    date: '2026-05-20',
    total: 490000,
    status: 'pending',
    items: [
      {
        name: 'Fresh Whole Sea Bass',
        quantity: 1,
        price: 310000,
        image: '/assets/winmart/sea-bass.png',
      },
      {
        name: 'Young Green Asparagus',
        quantity: 2,
        price: 90000,
        image: '/assets/winmart/asparagus.png',
      },
    ],
  },
]

const statusMeta: Record<
  Exclude<OrderStatus, 'all'>,
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

const statusTabs: { value: OrderStatus; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const OrdersPage = () => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const orderCounts = useMemo(() => {
    return statusTabs.reduce<Record<OrderStatus, number>>(
      (counts, tab) => {
        counts[tab.value] =
          tab.value === 'all'
            ? orders.length
            : orders.filter((order) => order.status === tab.value).length
        return counts
      },
      { all: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 },
    )
  }, [])

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return orders.filter((order) => {
      const statusMatches = selectedStatus === 'all' || order.status === selectedStatus
      const queryMatches =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.items.some((item) => item.name.toLowerCase().includes(query))

      return statusMatches && queryMatches
    })
  }, [searchQuery, selectedStatus])

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Orders</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
            Purchase history
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Track order status, totals, and purchased items.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant"
        >
          <ShoppingBag size={18} />
          Shop Again
        </Link>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by order ID or product name"
              className="w-full rounded-lg border border-transparent bg-surface-container-low py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const active = selectedStatus === tab.value

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedStatus(tab.value)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-primary-container font-bold text-on-primary-container'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    active
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {orderCounts[tab.value]}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        {filteredOrders.map((order) => {
          const meta = statusMeta[order.status]
          const StatusIcon = meta.icon

          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
            >
              <div className="grid gap-4 border-b border-outline-variant bg-surface-container-low p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
                    <StatusIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-on-surface">Order {order.id}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Placed on {order.date}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
                  >
                    <StatusIcon size={14} />
                    {meta.label}
                  </span>
                  <p className="text-xl font-black text-primary">{formatVND(order.total)}</p>
                </div>
              </div>

              <div className="divide-y divide-outline-variant">
                {order.items.map((item) => (
                  <div key={item.name} className="grid grid-cols-[4rem_1fr_auto] gap-4 p-5">
                    <div className="h-16 w-16 overflow-hidden rounded-lg bg-surface-container-low">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-on-surface">{item.name}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Qty {item.quantity} x {formatVND(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-black text-on-surface">
                      {formatVND(item.quantity * item.price)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant"
                >
                  View Details
                </button>
                {order.status === 'completed' ? (
                  <button
                    type="button"
                    className="rounded-lg bg-surface-container-high px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
                  >
                    Buy Again
                  </button>
                ) : null}
              </div>
            </article>
          )
        })}
      </section>

      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest py-16 text-center">
          <Package size={54} className="mx-auto mb-4 text-on-surface-variant" />
          <h3 className="text-lg font-black text-on-surface">No orders found</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Try a different status or search term.
          </p>
        </div>
      ) : null}
    </div>
  )
}
