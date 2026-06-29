import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { orderService } from '@/services/orderService'
import { promotionService } from '@/services/promotionService'
import { branchService } from '@/services/branchService'
import { addressService } from '@/services/addressService'
import type { Branch, UserAddress } from '@/types'

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
  Search,
} from 'lucide-react'

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
  const { cart, clearCart, refreshCart } = useCart()

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'banking' | 'momo' | 'vnpay'>('COD')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOrder, setSuccessOrder] = useState<any | null>(null)

  // Branch states
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const [branchSearch, setBranchSearch] = useState('')

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [voucherSuccessMsg, setVoucherSuccessMsg] = useState<string | null>(null)
  const [availablePromotions, setAvailablePromotions] = useState<any[]>([])
  const [isVoucherListModalOpen, setIsVoucherListModalOpen] = useState(false)
  const [isLoadingAvailableVouchers, setIsLoadingAvailableVouchers] = useState(false)

  // Saved Address states
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('PMAN-Mart')
  const [publicSettings, setPublicSettings] = useState<Record<string, any>>({})

  const shippingFee = useMemo(() => {
    if (!cart) return 0
    const threshold = Number(publicSettings.free_shipping_threshold ?? 200000)
    const fee = Number(publicSettings.default_delivery_fee ?? 15000)
    return cart.totalAmount >= threshold ? 0 : fee
  }, [cart, publicSettings])

  const vatRate = useMemo(() => {
    return Number(publicSettings.vat_rate ?? 10)
  }, [publicSettings])

  const vatAmount = useMemo(() => {
    if (!cart) return 0
    const amountAfterDiscount = Math.max(0, cart.totalAmount - discountAmount)
    return Math.round(amountAfterDiscount * (vatRate / 100))
  }, [cart, discountAmount, vatRate])

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await fetch('/api/settings/public')
        const data = await res.json()
        if (data?.success && data?.data?.settings) {
          setPublicSettings(data.data.settings)
          if (data.data.settings.store_name) {
            setStoreName(data.data.settings.store_name)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchPublicSettings()

    const fetchBranches = async () => {
      try {
        const res = await branchService.getBranches({ status: 'active' })
        if (res.success && res.data) {
          setBranches(res.data)
          
          const savedBranchStr = localStorage.getItem('selectedBranch')
          if (savedBranchStr) {
            try {
              const parsed = JSON.parse(savedBranchStr)
              const found = res.data.find((b) => b._id === parsed._id)
              if (found) {
                setSelectedBranch(found)
                return
              }
            } catch (e) {
              console.error('Failed to parse saved branch', e)
            }
          }
          
          if (res.data.length > 0) {
            setSelectedBranch(res.data[0])
            localStorage.setItem('selectedBranch', JSON.stringify(res.data[0]))
          }
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err)
      }
    }
    fetchBranches()
  }, [])

  useEffect(() => {
    const fetchAvailablePromotions = async () => {
      if (!selectedBranch) return
      setIsLoadingAvailableVouchers(true)
      try {
        const res = await promotionService.getActivePromotions({
          branchId: selectedBranch._id,
          limit: 100,
          onlyClaimed: true,
        })
        if (res.success && res.data) {
          setAvailablePromotions(res.data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch available promotions:', err)
      } finally {
        setIsLoadingAvailableVouchers(false)
      }
    }
    fetchAvailablePromotions()

    const fetchSavedAddresses = async () => {
      try {
        const res = await addressService.getAddresses()
        if (res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any).addresses || []
          setSavedAddresses(list)
          const defaultAddr = list.find((addr: any) => addr.isDefault)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr._id)
            setFullName(defaultAddr.receiverName)
            setPhoneNumber(defaultAddr.phoneNumber)
            setShippingAddress(defaultAddr.addressDetail)
          } else if (list.length > 0) {
            setSelectedAddressId(list[0]._id)
            setFullName(list[0].receiverName)
            setPhoneNumber(list[0].phoneNumber)
            setShippingAddress(list[0].addressDetail)
          }
        }
      } catch (err) {
        console.error('Failed to fetch saved addresses:', err)
      }
    }
    fetchSavedAddresses()
  }, [selectedBranch])

  const handleSelectVoucherFromList = (code: string) => {
    setVoucherCode(code)
    setIsVoucherListModalOpen(false)
    triggerApplyVoucherDirectly(code)
  }

  const triggerApplyVoucherDirectly = async (codeStr: string) => {
    if (!cart || cart.items.length === 0 || !selectedBranch) return
    setIsCheckingVoucher(true)
    setVoucherError(null)
    setVoucherSuccessMsg(null)
    try {
      const res = await promotionService.lookupVoucher(
        codeStr.trim().toUpperCase(),
        cart.totalAmount,
        selectedBranch._id
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

  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr._id)
    setFullName(addr.receiverName)
    setPhoneNumber(addr.phoneNumber)
    setShippingAddress(addr.addressDetail)
  }

  const handleUseNewAddress = () => {
    setSelectedAddressId(null)
    setFullName('')
    setPhoneNumber('')
    setShippingAddress('')
  }

  const filteredBranches = useMemo(() => {
    const kw = branchSearch.trim().toLowerCase()
    if (!kw) return branches
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(kw) ||
        (b.address && b.address.toLowerCase().includes(kw)) ||
        (b.code && b.code.toLowerCase().includes(kw))
    )
  }, [branches, branchSearch])

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch)
    localStorage.setItem('selectedBranch', JSON.stringify(branch))
    setIsBranchModalOpen(false)
    refreshCart()
    if (appliedVoucher) {
      handleRemoveVoucher()
      setVoucherError('Chi nhánh thay đổi, vui lòng áp dụng lại mã giảm giá.')
    }
  }

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá.')
      return
    }
    if (!cart || cart.items.length === 0) return

    if (!selectedBranch) {
      setVoucherError('Vui lòng chọn chi nhánh trước khi áp dụng mã giảm giá.')
      return
    }

    setIsCheckingVoucher(true)
    setVoucherError(null)
    setVoucherSuccessMsg(null)

    try {
      const res = await promotionService.lookupVoucher(
        voucherCode.trim().toUpperCase(),
        cart.totalAmount,
        selectedBranch._id
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

    const minOrderVal = Number(publicSettings.min_order_amount ?? 0)
    if (cart.totalAmount < minOrderVal) {
      setError(`Giá trị đơn hàng tối thiểu phải từ ${formatVND(minOrderVal)} trở lên.`)
      return
    }

    if (!fullName.trim() || !phoneNumber.trim() || !shippingAddress.trim()) {
      setError('Please fill in all required delivery fields.')
      return
    }

    if (!selectedBranch) {
      setError('Please select a branch first.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await orderService.placeOrder({
        branchId: selectedBranch._id,
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
            Thank you for shopping with {storeName}. Your order ID is{' '}
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

              {cart.totalAmount < Number(publicSettings.min_order_amount ?? 0) && (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>
                    Giá trị đơn hàng tối thiểu phải từ {formatVND(Number(publicSettings.min_order_amount))} trở lên để đặt hàng.
                  </span>
                </div>
              )}

              {/* Delivery Information */}
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                  <MapPin className="text-primary w-5 h-5" />
                  Delivery Details
                </h3>

                {savedAddresses.length > 0 && (
                  <div className="space-y-2 mb-4 pb-4 border-b border-outline-variant/30">
                    <label className="text-[12px] text-on-surface-variant font-bold uppercase tracking-wider">
                      Chọn địa chỉ đã lưu
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr._id
                        return (
                          <div
                            key={addr._id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-outline-variant/40 hover:border-primary/20 hover:bg-surface-container-high'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm truncate max-w-[150px]">
                                {addr.receiverName}
                              </span>
                              {addr.isDefault && (
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                              SĐT: {addr.phoneNumber}
                            </p>
                            <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                              Đ/C: {addr.addressDetail}
                            </p>
                          </div>
                        )
                      })}
                      <div
                        onClick={handleUseNewAddress}
                        className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[96px] ${
                          selectedAddressId === null
                            ? 'border-primary bg-primary/5'
                            : 'border-outline-variant/60 hover:border-primary/30 hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          + Nhập địa chỉ mới
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3 mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <MapPin className="text-primary w-5 h-5" />
                    Chi nhánh mua hàng
                  </h3>
                  <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full shrink-0">
                    Cố định theo giỏ hàng
                  </span>
                </div>
                {selectedBranch ? (
                  <div className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-primary/20">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-on-surface truncate">{selectedBranch.name}</h4>
                      <p className="text-[12px] text-on-surface-variant mt-0.5 leading-relaxed">
                        {selectedBranch.address}
                      </p>
                      {selectedBranch.phone && (
                        <p className="text-[10px] text-on-surface-variant mt-1">
                          Phone: {selectedBranch.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
                    <p className="text-sm font-bold text-error">Vui lòng chọn chi nhánh mua hàng tại Trang chủ trước khi thêm sản phẩm.</p>
                  </div>
                )}
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
                    const image = item.product.imageUrl || productImageMap[item.product.name] || '/assets/winmart/tomatoes.png'
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

                  {!appliedVoucher && (
                    <div className="flex justify-between items-center text-[11px] mt-1 bg-surface p-2 rounded-lg border border-outline-variant/30">
                      <span className="text-on-surface-variant font-semibold">Hoặc chọn từ danh sách ưu đãi:</span>
                      <button
                        type="button"
                        onClick={() => setIsVoucherListModalOpen(true)}
                        className="text-primary font-black hover:underline cursor-pointer flex items-center gap-1 transition active:scale-95"
                      >
                        <Ticket className="w-3.5 h-3.5" /> Chọn mã giảm giá
                      </button>
                    </div>
                  )}

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
                    <span>VAT ({vatRate}%)</span>
                    <span>{formatVND(vatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Shipping Fee</span>
                    <span className={shippingFee === 0 ? "text-success font-bold" : "font-bold"}>
                      {shippingFee === 0 ? 'FREE' : formatVND(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-body-lg font-bold border-t border-outline-variant/30 pt-3">
                    <span>Total Amount</span>
                    <span className="text-primary text-headline-sm">
                      {formatVND(Math.max(0, cart.totalAmount - discountAmount) + vatAmount + shippingFee)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || cart.totalAmount < Number(publicSettings.min_order_amount ?? 0)}
                  className="w-full bg-primary hover:bg-on-primary-fixed-variant disabled:bg-primary/50 text-white py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  type="button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" /> Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order ({formatVND(Math.max(0, cart.totalAmount - discountAmount) + vatAmount + shippingFee)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Branch Selection Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-on-surface">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant p-5 bg-surface-container-low">
              <div>
                <h3 className="text-lg font-black text-primary flex items-center gap-2">
                  <MapPin className="text-primary w-5 h-5" />
                  Chọn chi nhánh mua hàng
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Chọn chi nhánh gần nhất để đặt hàng nhanh hơn
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-5 border-b border-outline-variant/30 bg-surface-container-lowest">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
                <input
                  type="text"
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  placeholder="Tìm theo tên chi nhánh, mã code hoặc địa chỉ..."
                  className="w-full bg-surface-container-low border border-outline/30 rounded-full py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary focus:bg-surface transition-all text-sm outline-none"
                />
              </div>
            </div>

            {/* Branches List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-surface-container-lowest">
              {filteredBranches.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant">
                  <MapPin className="mx-auto mb-3 text-on-surface-variant/40 w-10 h-10" />
                  <p className="text-sm font-bold">Không tìm thấy chi nhánh nào</p>
                  <p className="text-xs mt-1">Vui lòng thử từ khóa khác.</p>
                </div>
              ) : (
                filteredBranches.map((branch) => {
                  const isSelected = selectedBranch?._id === branch._id
                  return (
                    <div
                      key={branch._id}
                      onClick={() => handleSelectBranch(branch)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/40 hover:border-primary/30 hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
                          }`}>
                            {branch.code}
                          </span>
                          <h4 className="font-black text-sm truncate text-on-surface">{branch.name}</h4>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                          Địa chỉ: {branch.address}
                        </p>
                        {branch.phone && (
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            SĐT: {branch.phone}
                          </p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-outline'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voucher Selection Modal */}
      {isVoucherListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-on-surface">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant p-5 bg-surface-container-low">
              <div>
                <h3 className="text-lg font-black text-primary flex items-center gap-2">
                  <Ticket className="text-primary w-5 h-5" />
                  Chọn mã giảm giá
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Chọn mã giảm giá phù hợp nhất cho đơn hàng của bạn
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherListModalOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vouchers List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-container-lowest">
              {isLoadingAvailableVouchers ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-on-surface-variant font-bold">Đang tải mã giảm giá khả dụng...</p>
                </div>
              ) : availablePromotions.length === 0 || !availablePromotions.some(p => p.vouchers && p.vouchers.length > 0) ? (
                <div className="text-center py-10 text-on-surface-variant">
                  <Ticket className="mx-auto mb-3 text-on-surface-variant/40 w-10 h-10" />
                  <p className="text-sm font-bold">Hiện chưa có mã giảm giá nào</p>
                  <p className="text-xs mt-1">Quay lại sau để cập nhật các ưu đãi mới nhất.</p>
                </div>
              ) : (
                availablePromotions.map((promo) => {
                  const isPercentage = promo.discountType === 'percentage'
                  const minOrder = promo.minOrderAmount || 0
                  const isMinOrderMet = (cart?.totalAmount || 0) >= minOrder
                  const vouchersList = promo.vouchers || []

                  if (vouchersList.length === 0) return null

                  return vouchersList.map((codeStr: string) => {
                    const isSelected = appliedVoucher?.code === codeStr
                    return (
                      <div
                        key={codeStr}
                        onClick={() => {
                          if (isMinOrderMet && !isSelected) {
                            handleSelectVoucherFromList(codeStr)
                          }
                        }}
                        className={`p-4 rounded-xl border-2 flex items-start gap-4 transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/5 cursor-default'
                            : isMinOrderMet
                            ? 'border-outline-variant/40 hover:border-primary/30 hover:bg-surface-container-low cursor-pointer'
                            : 'border-outline-variant/20 bg-surface-container-high/30 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {/* Left visual icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                          isSelected
                            ? 'bg-primary text-white'
                            : isMinOrderMet
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          <Ticket className="w-6 h-6" />
                        </div>

                        {/* Middle info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm tracking-wider text-primary uppercase">
                              {codeStr}
                            </span>
                            <span className="text-[10px] font-black text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                              {promo.name}
                            </span>
                          </div>

                          <p className="font-black text-sm mt-1.5 text-on-surface">
                            {isPercentage ? `Giảm ${promo.discountValue}%` : `Giảm ${formatVND(promo.discountValue)}`}
                            {isPercentage && promo.maxDiscountAmount && ` (Tối đa ${formatVND(promo.maxDiscountAmount)})`}
                          </p>

                          <p className="text-[10px] text-on-surface-variant mt-1">
                            Áp dụng cho đơn từ {formatVND(minOrder)}
                          </p>

                          {!isMinOrderMet && (
                            <p className="text-[10px] text-error font-bold mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Chưa đạt đơn tối thiểu (Cần mua thêm {formatVND(minOrder - (cart?.totalAmount || 0))})
                            </p>
                          )}
                        </div>

                        {/* Right action indicator */}
                        <div className="shrink-0 pt-0.5">
                          {isSelected ? (
                            <span className="text-xs font-black text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-lg">
                              Đã áp dụng
                            </span>
                          ) : isMinOrderMet ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectVoucherFromList(codeStr)
                              }}
                              className="bg-primary hover:bg-opacity-90 text-white text-xs font-black px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                            >
                              Dùng ngay
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-on-surface-variant/40 bg-surface-container px-2.5 py-1.5 rounded-lg">
                              Chưa đủ đk
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                })
              )}
            </div>
            {/* Modal Footer */}
            <div className="border-t border-outline-variant p-4 bg-surface-container-low flex justify-end">
              <button
                type="button"
                onClick={() => setIsVoucherListModalOpen(false)}
                className="bg-surface-container-highest hover:bg-surface-container text-on-surface font-bold text-xs px-5 py-2.5 rounded-xl transition"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
