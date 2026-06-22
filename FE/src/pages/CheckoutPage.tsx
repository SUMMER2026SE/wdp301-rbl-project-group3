import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { orderService } from '@/services/orderService'
import { promotionService } from '@/services/promotionService'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader,
  Ticket,
  Tag,
  X,
} from 'lucide-react'

const DUMMY_BRANCH_ID = '60d5ec3888339c2d1c68f123'

const productImageMap: Record<string, string> = {
  'Fresh Organic Tomato': '/assets/winmart/tomatoes.png',
  'Premium Ribeye Steak': '/assets/winmart/ribeye.png',
  'Mixed Berry Bowl': '/assets/winmart/berries.png',
  'Whole Organic Milk': '/assets/winmart/milk.png',
  'Artisan Sourdough': '/assets/winmart/sourdough.png',
  'Organic Bunch Carrots': '/assets/winmart/carrots.png',
  'Pure Alpine Sparkle': '/assets/winmart/sparkling-water.png',
  'Young Green Asparagus': '/assets/winmart/asparagus.png',
  'Velvet Greek Yogurt': '/assets/winmart/greek-yogurt.png',
  'Fresh Whole Sea Bass': '/assets/winmart/sea-bass.png',
}

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'banking' | 'momo' | 'vnpay'>('COD')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOrder, setSuccessOrder] = useState<any | null>(null)

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [voucherSuccessMsg, setVoucherSuccessMsg] = useState<string | null>(null)

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá.')
      return
    }
    if (!cart || cart.items.length === 0) return

    setIsCheckingVoucher(true)
    setVoucherError(null)
    setVoucherSuccessMsg(null)

    try {
      const res = await promotionService.lookupVoucher(
        voucherCode.trim().toUpperCase(),
        cart.totalAmount,
        DUMMY_BRANCH_ID
      )
      if (res.success && res.data) {
        const { voucher, discountAmount: calculatedDiscount } = res.data
        setAppliedVoucher(voucher)
        setDiscountAmount(calculatedDiscount)
        setVoucherSuccessMsg(`Áp dụng thành công! Bạn được giảm ${formatVND(calculatedDiscount)}`)
      } else {
        setVoucherError(res.message || 'Mã giảm giá không hợp lệ hoặc không áp dụng được.')
      }
    } catch (err: any) {
      setVoucherError(
        err.response?.data?.message ||
          err.message ||
          'Không thể kiểm tra mã giảm giá lúc này.'
      )
    } finally {
      setIsCheckingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setDiscountAmount(0)
    setVoucherCode('')
    setVoucherSuccessMsg(null)
    setVoucherError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart || cart.items.length === 0) return

    if (!fullName.trim() || !phoneNumber.trim() || !shippingAddress.trim()) {
      setError('Please fill in all required delivery fields.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await orderService.placeOrder({
        branchId: DUMMY_BRANCH_ID,
        shippingAddress: `${fullName} - ${shippingAddress}`,
        phoneNumber,
        note: note.trim() || undefined,
        paymentMethod,
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
      })

      if (res.success) {
        setSuccessOrder(res.data)
        // Clear local cart
        await clearCart()
      } else {
        setError(res.message || 'Failed to place order. Please try again.')
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Something went wrong while placing order.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successOrder) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4">
        <div className="bg-surface-container-low max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-outline-variant/30 animate-fade-in">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-on-surface mb-2">Order Placed Successfully!</h1>
          <p className="text-on-surface-variant mb-6 text-sm">
            Thank you for shopping with PMAN-Mart. Your order ID is{' '}
            <span className="font-bold text-primary">{successOrder.orderId}</span>.
          </p>

          <div className="bg-surface-container-high rounded-xl p-4 mb-6 text-left space-y-2 text-sm text-on-surface">
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-bold">Total Amount:</span>
              <span className="font-black text-primary">{formatVND(successOrder.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-bold">Payment Method:</span>
              <span className="uppercase font-bold">{successOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-bold">Status:</span>
              <span className="capitalize font-bold text-tertiary">{successOrder.status}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              to="/dashboard/orders"
              className="flex-1 bg-surface-container-highest hover:bg-surface-container-high-variant text-on-surface px-4 py-3 rounded-xl font-bold text-sm transition-all text-center border border-outline-variant/30"
            >
              Track Orders
            </Link>
            <Link
              to="/"
              className="flex-1 bg-primary hover:bg-on-primary-fixed-variant text-white px-4 py-3 rounded-xl font-bold text-sm transition-all text-center shadow-md"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      {/* Top Bar */}
      <header className="sticky top-0 bg-surface-container-low border-b border-outline-variant z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black leading-none">Checkout</h1>
            <p className="text-[12px] text-on-surface-variant mt-1">Complete your purchase details</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/30 max-w-lg mx-auto">
            <AlertCircle className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="text-on-surface-variant text-sm mt-1 mb-6">
              Add some delicious groceries first before checkout!
            </p>
            <Link
              to="/"
              className="inline-flex bg-primary hover:bg-on-primary-fixed-variant text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
            >
              Go to Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
              {error && (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Delivery Information */}
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                  <MapPin className="text-primary w-5 h-5" />
                  Delivery Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant font-bold flex items-center gap-1.5">
                      <User className="w-4 h-4" /> Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant font-bold flex items-center gap-1.5">
                      <Phone className="w-4 h-4" /> Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0912345678"
                      className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant font-bold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> Shipping Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. 123 Nguyen Hue, District 1, HCMC"
                    className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant font-bold flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Order Notes
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Special instructions for delivery..."
                    className="w-full bg-surface border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Branch Information */}
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
                <h3 className="text-lg font-bold flex items-center gap-2 border-b border-outline-variant/30 pb-3 mb-4">
                  <MapPin className="text-primary w-5 h-5" />
                  Select Branch
                </h3>
                <div className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-primary/20">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">PMAN-Mart Quận 1 (Central Hub)</h4>
                    <p className="text-[12px] text-on-surface-variant mt-0.5">
                      15 Le Thanh Ton, District 1, Ho Chi Minh City
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                  <CreditCard className="text-primary w-5 h-5" />
                  Payment Method
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'COD', label: 'Cash on Delivery (COD)', desc: 'Pay with cash upon delivery' },
                    { id: 'momo', label: 'MoMo Wallet', desc: 'Pay using MoMo sandbox gateway' },
                    { id: 'vnpay', label: 'VNPay Gateway', desc: 'Fast bank transfer via VNPay' },
                    { id: 'banking', label: 'Direct Bank Transfer', desc: 'Transfer to our company account' },
                  ].map((method) => {
                    const active = paymentMethod === method.id
                    return (
                      <div
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          active
                            ? 'border-primary bg-primary/5'
                            : 'border-outline-variant/40 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{method.label}</span>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              active ? 'border-primary bg-primary text-white' : 'border-outline'
                            }`}
                          >
                            {active && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-[12px] text-on-surface-variant mt-1">{method.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </form>

            {/* Cart Summary Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 space-y-4">
                <h3 className="text-lg font-bold border-b border-outline-variant/30 pb-3">
                  Order Summary
                </h3>

                <div className="divide-y divide-outline-variant/30 max-h-96 overflow-y-auto pr-2">
                  {cart.items.map((item) => {
                    const image = productImageMap[item.product.name] || '/assets/winmart/tomatoes.png'
                    return (
                      <div key={item.itemId} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                        <div className="w-12 h-12 rounded-lg bg-surface overflow-hidden border border-outline-variant/30 flex-shrink-0">
                          <img className="w-full h-full object-cover" src={image} alt={item.product.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                          <p className="text-[12px] text-on-surface-variant mt-0.5">
                            Qty {item.quantity} x {formatVND(item.product.price)}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-on-surface">
                          {formatVND(item.subtotal)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Voucher Section */}
                <div className="border-t border-outline-variant/30 pt-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                      <input
                        type="text"
                        disabled={!!appliedVoucher || isCheckingVoucher}
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="Nhập mã giảm giá..."
                        className="w-full bg-surface border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/50"
                      />
                    </div>
                    {appliedVoucher ? (
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="bg-error-container text-on-error-container hover:bg-opacity-90 px-4 rounded-xl text-xs font-bold transition-all border border-error/20 flex items-center justify-center cursor-pointer gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Gỡ bỏ
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isCheckingVoucher || !voucherCode.trim()}
                        onClick={handleApplyVoucher}
                        className="bg-primary text-white hover:bg-opacity-95 disabled:bg-primary/50 px-5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center min-w-[70px]"
                      >
                        {isCheckingVoucher ? <Loader className="w-4 h-4 animate-spin" /> : 'Áp dụng'}
                      </button>
                    )}
                  </div>

                  {voucherError && (
                    <div className="text-[11px] font-bold text-error flex items-center gap-1.5 bg-error-container/20 p-2.5 rounded-lg border border-error/10 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{voucherError}</span>
                    </div>
                  )}

                  {voucherSuccessMsg && (
                    <div className="text-[11px] font-bold text-success flex items-center gap-1.5 bg-success-container/20 p-2.5 rounded-lg border border-success/10 animate-fade-in">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{voucherSuccessMsg}</span>
                    </div>
                  )}

                  {appliedVoucher && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-on-surface">Mã đã áp dụng: {appliedVoucher.code}</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            {appliedVoucher.discountType === 'percentage' 
                              ? `Giảm ${appliedVoucher.discountValue}%` 
                              : `Giảm ${formatVND(appliedVoucher.discountValue)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-outline-variant/30 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal ({cart.totalItems} items)</span>
                    <span>{formatVND(cart.totalAmount)}</span>
                  </div>
                  {appliedVoucher && (
                    <div className="flex justify-between text-success font-medium">
                      <span>Giảm giá (Voucher)</span>
                      <span>-{formatVND(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Shipping Fee</span>
                    <span className="text-success font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-body-lg font-bold border-t border-outline-variant/30 pt-3">
                    <span>Total Amount</span>
                    <span className="text-primary text-headline-sm">
                      {formatVND(Math.max(0, cart.totalAmount - discountAmount))}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-on-primary-fixed-variant disabled:bg-primary/50 text-white py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  type="button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" /> Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order ({formatVND(Math.max(0, cart.totalAmount - discountAmount))})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
