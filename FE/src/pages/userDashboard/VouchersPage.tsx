import { Clock, Ticket } from 'lucide-react'

type Voucher = {
  id: string
  title: string
  description: string
  expiresIn: string
  code: string
  tone: string
}

const vouchers: Voucher[] = [
  {
    id: 'fresh20',
    title: 'Giảm 20%',
    description: 'Chi tiêu tối thiểu 1.000.000đ. Giảm tối đa 500.000đ.',
    expiresIn: '2 ngày',
    code: 'FRESH20',
    tone: 'bg-tertiary-container text-on-tertiary-container',
  },
  {
    id: 'shipfree',
    title: 'Miễn phí vận chuyển',
    description: 'Áp dụng cho đơn hàng từ 500.000đ.',
    expiresIn: '5 ngày',
    code: 'SHIPFREE',
    tone: 'bg-primary-container text-on-primary-container',
  },
  {
    id: 'milk10',
    title: 'Giảm 250.000đ',
    description: 'Áp dụng riêng cho danh mục sữa và bánh ngọt.',
    expiresIn: '12 ngày',
    code: 'MILK10',
    tone: 'bg-secondary-fixed text-on-secondary-fixed',
  },
]

export const VouchersPage = () => {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-primary">Vouchers</p>
        <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
          Available savings
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Apply vouchers at checkout before they expire.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vouchers.map((voucher) => (
          <article
            key={voucher.id}
            className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
          >
            <div className={`flex items-center gap-3 p-5 ${voucher.tone}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/45">
                <Ticket size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black">{voucher.title}</h2>
                <p className="text-xs font-bold opacity-80">Code: {voucher.code}</p>
              </div>
            </div>

            <div className="p-5">
              <p className="text-sm text-on-surface-variant">{voucher.description}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-3 py-1 text-xs font-bold text-on-error-container">
                  <Clock size={14} />
                  {voucher.expiresIn}
                </span>
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant"
                >
                  Use
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
