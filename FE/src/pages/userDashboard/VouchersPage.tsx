import { useEffect, useState } from 'react'
import { Clock, Ticket, AlertCircle, Copy, Check } from 'lucide-react'
import { promotionService } from '@/services/promotionService'
import type { Promotion } from '@/types'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

const getExpirationDays = (endDateStr: string) => {
  const end = new Date(endDateStr)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Đã hết hạn'
  return `Còn ${diffDays} ngày`
}

export const VouchersPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await promotionService.getActivePromotions({ limit: 50 })
        if (res.success && res.data) {
          // The backend returns { success: true, data: { data: Promotion[], pagination: ... } }
          const list = res.data.data || []
          setPromotions(list)
        } else {
          setError(res.message || 'Không thể tải danh sách khuyến mãi.')
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra.')
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [])

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Curated, beautiful gradients for voucher tones
  const tones = [
    'from-rose-500/10 to-orange-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',
    'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
    'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    'from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
    'from-purple-500/10 to-fuchsia-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400',
  ]

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-primary">Khuyến Mãi & Ưu Đãi</p>
        <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
          Ưu đãi dành cho bạn
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Xem các chương trình khuyến mãi đang diễn ra. Nhận mã Voucher từ các chiến dịch để áp dụng khi thanh toán.
        </p>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-on-surface-variant font-medium">Đang tải danh sách ưu đãi...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-error/20 bg-error-container/10 p-6 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="mx-auto text-error" size={32} />
          <h3 className="text-md font-bold text-on-error-container">Lỗi tải dữ liệu</h3>
          <p className="text-sm text-on-error-container/80">{error}</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest py-20 text-center max-w-lg mx-auto">
          <Ticket size={56} className="mx-auto mb-4 text-on-surface-variant/40" />
          <h3 className="text-lg font-black text-on-surface">Chưa có khuyến mãi nào</h3>
          <p className="mt-2 text-sm text-on-surface-variant max-w-xs mx-auto">
            Hiện tại hệ thống chưa có chương trình ưu đãi nào đang kích hoạt. Vui lòng quay lại sau!
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {promotions.map((promo, idx) => {
            const toneClass = tones[idx % tones.length]
            const isPercentage = promo.discountType === 'percentage'
            
            // Format title
            const title = isPercentage 
              ? `Giảm ${promo.discountValue}%`
              : `Giảm ${formatVND(promo.discountValue)}`

            // Format description if empty
            const description = promo.description || 
              `Áp dụng cho đơn hàng từ ${formatVND(promo.minOrderAmount || 0)}.${
                promo.maxDiscountAmount ? ` Giảm tối đa ${formatVND(promo.maxDiscountAmount)}.` : ''
              }`

            // Mock display a copyable preview tag for testing, referencing campaign
            const promoCodePreview = `PROMO${promo.id.substring(promo.id.length - 6).toUpperCase()}`

            return (
              <article
                key={promo.id}
                className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`bg-gradient-to-br p-6 border-b flex items-start gap-4 ${toneClass}`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-black/20 shadow-sm">
                      <Ticket size={24} className="text-inherit" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-black leading-tight text-on-surface">{title}</h2>
                      <p className="text-xs font-bold opacity-75 text-on-surface-variant">Chiến dịch: {promo.name}</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-sm text-on-surface-variant leading-relaxed min-h-[40px]">
                      {description}
                    </p>
                    
                    {promo.minOrderAmount && promo.minOrderAmount > 0 ? (
                      <div className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg inline-block">
                        Đơn tối thiểu: {formatVND(promo.minOrderAmount)}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 border-t border-outline-variant/20 mt-auto flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-error-container/20 px-3 py-1.5 text-xs font-bold text-error">
                    <Clock size={14} />
                    {getExpirationDays(promo.endDate)}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleCopyCode(promo.id, promoCodePreview)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-opacity-95 text-white px-4 py-2 text-xs font-black transition-all shadow-sm cursor-pointer"
                  >
                    {copiedId === promo.id ? (
                      <>
                        <Check size={13} /> Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Nhận mã
                      </>
                    )}
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
