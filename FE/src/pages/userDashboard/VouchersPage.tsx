import { useEffect, useState } from 'react'
import { Clock, Ticket, AlertCircle, Check, Lock, Crown, Sparkles } from 'lucide-react'
import { promotionService } from '@/services/promotionService'
import { useAuth } from '@/hooks/useAuth'
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

const getLevelInfo = (level: string = 'new', lifetimePoints: number = 0) => {
  const lp = Math.max(0, lifetimePoints)
  switch (level) {
    case 'bronze':
      return {
        name: 'Đồng (Bronze)',
        gradient: 'from-amber-800 via-amber-700 to-amber-900 border-amber-600/30 text-white',
        accentColor: 'text-amber-400',
        progressBarBg: 'bg-white/20',
        progressBarFill: 'bg-gradient-to-r from-amber-400 to-yellow-300',
        nextLevel: 'Bạc',
        nextLevelPoints: 300,
        progress: Math.min(100, Math.max(0, ((lp - 100) / 200) * 100)),
        pointsNeeded: Math.max(0, 300 - lp),
      }
    case 'silver':
      return {
        name: 'Bạc (Silver)',
        gradient: 'from-slate-400 via-slate-500 to-slate-600 border-slate-300/30 text-white',
        accentColor: 'text-slate-200',
        progressBarBg: 'bg-white/20',
        progressBarFill: 'bg-gradient-to-r from-slate-300 to-zinc-200',
        nextLevel: 'Vàng',
        nextLevelPoints: 600,
        progress: Math.min(100, Math.max(0, ((lp - 300) / 300) * 100)),
        pointsNeeded: Math.max(0, 600 - lp),
      }
    case 'gold':
      return {
        name: 'Vàng (Gold)',
        gradient: 'from-yellow-500 via-amber-500 to-yellow-600 border-yellow-400/30 text-white',
        accentColor: 'text-yellow-300',
        progressBarBg: 'bg-white/20',
        progressBarFill: 'bg-gradient-to-r from-yellow-400 to-amber-300',
        nextLevel: 'Kim cương',
        nextLevelPoints: 1000,
        progress: Math.min(100, Math.max(0, ((lp - 600) / 400) * 100)),
        pointsNeeded: Math.max(0, 1000 - lp),
      }
    case 'diamond':
      return {
        name: 'Kim cương (Diamond)',
        gradient: 'from-cyan-500 via-blue-600 to-indigo-700 border-cyan-400/30 text-white',
        accentColor: 'text-cyan-300',
        progressBarBg: 'bg-white/20',
        progressBarFill: 'bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300',
        nextLevel: '',
        nextLevelPoints: 1000,
        progress: 100,
        pointsNeeded: 0,
      }
    case 'new':
    default:
      return {
        name: 'Mới (New)',
        gradient: 'from-slate-700 via-slate-800 to-slate-900 border-slate-600/30 text-white',
        accentColor: 'text-slate-400',
        progressBarBg: 'bg-white/20',
        progressBarFill: 'bg-gradient-to-r from-slate-400 to-zinc-300',
        nextLevel: 'Đồng',
        nextLevelPoints: 100,
        progress: Math.min(100, Math.max(0, (lp / 100) * 100)),
        pointsNeeded: Math.max(0, 100 - lp),
      }
  }
}

export const VouchersPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, refreshUser } = useAuth()

  const levelInfo = user ? getLevelInfo(user.memberLevel, user.lifetimePoints || 0) : null

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

  const [claimLoadingId, setClaimLoadingId] = useState<string | null>(null)

  const handleClaimVoucher = async (promoId: string, code: string, pointCost: number) => {
    if (pointCost > 0) {
      if (!user) {
        alert('Vui lòng đăng nhập để thực hiện đổi điểm tích lũy lấy Voucher.')
        return
      }
      if ((user.points || 0) < pointCost) {
        alert(`Bạn không đủ điểm tích lũy để quy đổi! (Cần ${pointCost} điểm, hiện có ${user.points || 0} điểm)`)
        return
      }
      const confirmClaim = window.confirm(
        `Bạn có chắc chắn muốn sử dụng ${pointCost} điểm tích lũy để đổi lấy Voucher "${code}" không?`
      )
      if (!confirmClaim) return
    }

    try {
      setClaimLoadingId(promoId)
      const res = await promotionService.claimVoucher(code)
      if (res.success) {
        setPromotions((prev) =>
          prev.map((p) => {
            if (p.id === promoId && p.vouchersDetail) {
              return {
                ...p,
                vouchersDetail: p.vouchersDetail.map((v) =>
                  v.code === code ? { ...v, isClaimed: true, claimStatus: 'active' } : v
                ),
              }
            }
            return p
          })
        )
        if (pointCost > 0) {
          // Tải lại thông tin user để hiển thị số điểm mới
          refreshUser().catch(console.error)
        }
      } else {
        setError(res.message || 'Không thể nhận mã giảm giá.')
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setClaimLoadingId(null)
    }
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
      {/* Header and Title */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Khuyến Mãi & Ưu Đãi</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
            Ưu đãi dành cho bạn
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Xem các chương trình khuyến mãi đang diễn ra. Nhận hoặc đổi mã giảm giá để áp dụng khi thanh toán.
          </p>
        </div>
      </section>

      {/* Premium Membership Card Section */}
      {user && levelInfo && (
        <section className="relative overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-md transition-all duration-300 hover:shadow-lg">
          {/* Card subtle glowing circle backdrops */}
          <div className="absolute right-0 top-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            {/* Visual Card (reminiscent of premium physical member card) */}
            <div className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg border w-full lg:w-[380px] min-h-[200px] transition-all duration-500 shrink-0 ${levelInfo.gradient}`}>
              {/* Radial light overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent)] pointer-events-none"></div>
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">THẺ THÀNH VIÊN</span>
                  <h3 className="mt-1 text-xl font-black tracking-wide">{levelInfo.name}</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <Crown size={20} className="text-white animate-pulse" />
                </div>
              </div>

              <div className="mt-8 flex items-end justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 block">Hội viên</span>
                  <p className="text-sm font-black tracking-wide truncate max-w-[200px]">{user.fullName || user.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 block">Mã hội viên</span>
                  <p className="font-mono text-xs font-bold">{user.id.substring(user.id.length - 8).toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Dynamic statistics and progress bars */}
            <div className="flex flex-col justify-between flex-1 py-1 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4 transition-all hover:bg-surface-container-high">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Điểm tiêu dùng</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-primary">{user.points || 0}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant">điểm</span>
                  </div>
                  <p className="mt-1 text-[10px] text-on-surface-variant/80">Khả dụng để đổi voucher</p>
                </div>

                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4 transition-all hover:bg-surface-container-high">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Điểm trọn đời (LP)</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-on-surface">{user.lifetimePoints || 0}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant">điểm</span>
                  </div>
                  <p className="mt-1 text-[10px] text-on-surface-variant/80">Dùng để xếp hạng cấp độ</p>
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-on-surface">Cấp độ hiện tại: {levelInfo.name}</span>
                  {levelInfo.nextLevel ? (
                    <span className="font-bold text-on-surface-variant">Cấp kế tiếp: Hạng {levelInfo.nextLevel} ({levelInfo.nextLevelPoints} LP)</span>
                  ) : (
                    <span className="font-bold text-primary flex items-center gap-1"><Sparkles size={12} /> Cấp tối đa</span>
                  )}
                </div>

                <div className="relative h-2.5 w-full rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/20">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${levelInfo.progress}%`,
                      backgroundImage: user.memberLevel === 'diamond' ? 'linear-gradient(to right, #06b6d4, #3b82f6, #6366f1)' :
                                      user.memberLevel === 'gold' ? 'linear-gradient(to right, #eab308, #ca8a04)' :
                                      user.memberLevel === 'silver' ? 'linear-gradient(to right, #94a3b8, #64748b)' :
                                      user.memberLevel === 'bronze' ? 'linear-gradient(to right, #d97706, #b45309)' :
                                      'linear-gradient(to right, #475569, #334155)'
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-on-surface-variant font-medium">Tiến trình: {Math.round(levelInfo.progress)}%</span>
                  <span className="font-bold text-primary">
                    {levelInfo.nextLevel ? (
                      `Cần tích lũy thêm ${levelInfo.pointsNeeded} điểm trọn đời (LP) để lên hạng ${levelInfo.nextLevel}`
                    ) : (
                      'Chúc mừng! Bạn đã đạt hạng cao cấp nhất và nhận mọi đặc quyền.'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Prominent header for promotions */}
      <div>
        <h2 className="text-lg font-black text-on-surface">Mã giảm giá đang diễn ra</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Sử dụng điểm tích lũy hoặc nhận mã giảm giá miễn phí</p>
      </div>

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

            const voucherDetail = promo.vouchersDetail?.[0]
            const voucherCode = voucherDetail?.code || promo.vouchers?.[0]
            const isClaimed = voucherDetail?.isClaimed || false
            const pointCost = voucherDetail?.pointCost || (promo as any).pointCost || 0
            
            const isPointsVoucher = pointCost > 0
            const isEligible = promo.isEligible !== false // default to true if undefined

            return (
              <article
                key={promo.id}
                className={`overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
                  !isEligible ? 'opacity-75 filter grayscale-[15%] border-error/10' : ''
                }`}
              >
                <div>
                  <div className={`bg-gradient-to-br p-6 border-b flex items-start gap-4 relative ${toneClass}`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-black/20 shadow-sm relative">
                      <Ticket size={24} className="text-inherit" />
                      {!isEligible && (
                        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white shadow-sm">
                          <Lock size={10} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-black leading-tight text-on-surface">{title}</h2>
                      <p className="text-xs font-bold opacity-75 text-on-surface-variant font-medium">Chiến dịch: {promo.name}</p>
                      
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {isPointsVoucher ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-black text-amber-800 dark:text-amber-300 border border-amber-500/20">
                            Đổi bằng {pointCost} điểm
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                            Nhận miễn phí
                          </span>
                        )}

                        {promo.targetMemberLevel && promo.targetMemberLevel !== 'all' && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black border uppercase ${
                            promo.targetMemberLevel === 'new' ? 'bg-slate-500/20 border-slate-500/20 text-slate-700 dark:text-slate-300' :
                            promo.targetMemberLevel === 'bronze' ? 'bg-amber-700/20 border-amber-700/20 text-amber-700 dark:text-amber-400' :
                            promo.targetMemberLevel === 'silver' ? 'bg-slate-400/20 border-slate-400/20 text-slate-600 dark:text-slate-300' :
                            promo.targetMemberLevel === 'gold' ? 'bg-yellow-500/20 border-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                            'bg-cyan-500/20 border-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                          }`}>
                            Hạng {
                              promo.targetMemberLevel === 'new' ? 'Mới' :
                              promo.targetMemberLevel === 'bronze' ? 'Đồng+' :
                              promo.targetMemberLevel === 'silver' ? 'Bạc+' :
                              promo.targetMemberLevel === 'gold' ? 'Vàng+' : 'Kim cương'
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visual warning locks for ineligible tier */}
                  {!isEligible && promo.ineligibleReason && (
                    <div className="mx-6 mt-4 flex items-center gap-2 text-xs font-bold text-error bg-error/10 px-3 py-2 rounded-xl border border-error/20">
                      <Lock size={13} className="shrink-0 text-error" />
                      <span>{promo.ineligibleReason}</span>
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    <p className="text-sm text-on-surface-variant leading-relaxed min-h-[40px]">
                      {description}
                    </p>
                    
                    {voucherCode && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">Mã:</span>
                        <span className="font-mono font-black text-xs tracking-wider text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 select-all">
                          {voucherCode}
                        </span>
                      </div>
                    )}

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
                  
                  {voucherCode ? (
                    isClaimed ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-high text-on-surface-variant/40 px-4 py-2 text-xs font-black transition-all shadow-sm cursor-default"
                      >
                        <Check size={13} /> Đã nhận
                      </button>
                    ) : !isEligible ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-high text-on-surface-variant/40 px-4 py-2 text-xs font-black transition-all shadow-sm cursor-default"
                      >
                        <Lock size={13} /> Chưa đủ cấp độ
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={claimLoadingId === promo.id}
                        onClick={() => handleClaimVoucher(promo.id, voucherCode, pointCost)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                          isPointsVoucher 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                            : 'bg-primary hover:bg-opacity-95 text-white'
                        }`}
                      >
                        {claimLoadingId === promo.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Ticket size={13} />
                        )}
                        {isPointsVoucher ? 'Đổi điểm' : 'Nhận mã'}
                      </button>
                    )
                  ) : (
                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg">
                      Không khả dụng
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
