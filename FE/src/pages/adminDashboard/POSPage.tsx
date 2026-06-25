import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Camera,
  Printer,
  CheckCircle,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  User,
  Phone,
  FileText,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { inventoryService } from '@services/inventoryService'
import { orderService } from '@services/orderService'
import { branchService } from '@services/branchService'
import { Html5Qrcode } from 'html5-qrcode'
import type { Inventory, Branch, AdminOrder } from '@/types'

interface CartItem {
  inventoryItem: Inventory
  quantity: number
}

export const POSPage: React.FC = () => {
  const { user } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false)

  // Webcam scanning states
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false)
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null)

  // Scanner Simulator & Search State
  const [barcodeInput, setBarcodeInput] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  // Cart & Customer Membership State
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'banking' | 'momo' | 'vnpay'>('COD')
  const [note, setNote] = useState<string>('')
  
  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState<boolean>(false)
  const [createdOrder, setCreatedOrder] = useState<AdminOrder | null>(null)

  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // Play synthesized scanner beep sound
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.value = 1150 // Hz frequency for beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime)
      
      oscillator.start()
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12)
      oscillator.stop(audioCtx.currentTime + 0.12)
    } catch (err) {
      console.error('Không thể phát tiếng bíp bíp:', err)
    }
  }

  // Common processing method for SKU/barcode match
  const processScannedCode = (code: string): boolean => {
    const sku = code.trim().toUpperCase()
    const matchedItem = inventory.find(
      (item) => item.productId && item.productId.sku?.toUpperCase() === sku
    )

    if (matchedItem) {
      addToCart(matchedItem)
      playBeep()
      showScanFeedback(`Đã quét: ${matchedItem.productId.name}`, 'success')
      return true
    } else {
      showScanFeedback(`Không tìm thấy mã sản phẩm: "${sku}"`, 'error')
      return false
    }
  }

  // Camera start / stop functions
  const startCamera = async () => {
    try {
      setError('')
      setIsCameraOn(true)

      // Allow DOM to update and render #pos-scanner-viewport before initializing
      setTimeout(async () => {
        try {
          const html5Qrcode = new Html5Qrcode('pos-scanner-viewport')
          html5QrcodeRef.current = html5Qrcode

          let isThrottled = false

          await html5Qrcode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: (width, height) => {
                return {
                  width: Math.min(width * 0.85, 260),
                  height: Math.min(height * 0.65, 140)
                }
              }
            },
            (decodedText) => {
              if (isThrottled) return

              const success = processScannedCode(decodedText)
              if (success) {
                isThrottled = true
                // Throttle further scans for 1.8 seconds
                setTimeout(() => {
                  isThrottled = false
                }, 1800)
              }
            },
            () => {
              // Ignore scanning frame errors
            }
          )
        } catch (err: any) {
          console.error('Lỗi khi mở camera html5-qrcode:', err)
          setError('Không thể khởi động camera. Hãy thử lại.')
          setIsCameraOn(false)
        }
      }, 200)

    } catch (err: any) {
      console.error('Lỗi khởi chạy camera:', err)
      alert('Không thể truy cập camera. Vui lòng cấp quyền camera cho trang web.')
    }
  }

  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop()
        }
      } catch (err) {
        console.error('Lỗi tắt camera html5-qrcode:', err)
      }
      html5QrcodeRef.current = null
    }
    setIsCameraOn(false)
  }

  // Auto focus barcode input on mount and when modal closes
  useEffect(() => {
    if (barcodeInputRef.current && !isCameraOn) {
      barcodeInputRef.current.focus()
    }
  }, [showReceipt, isCameraOn])

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(console.error)
      }
    }
  }, [])

  // Fetch branches if Admin, or set assigned branch
  useEffect(() => {
    const initBranches = async () => {
      if (user?.role === 'admin') {
        try {
          const res = await branchService.getBranches({ status: 'active' })
          if (res.success && res.data.length > 0) {
            setBranches(res.data)
            // Use the first active branch as default
            setSelectedBranchId(res.data[0]._id)
          }
        } catch (err: any) {
          setError('Không thể tải danh sách chi nhánh.')
        }
      } else if (user?.branchId) {
        setSelectedBranchId(user.branchId)
      }
    }
    initBranches()
  }, [user])

  // Load Inventory for selected branch
  useEffect(() => {
    const fetchInventory = async () => {
      if (!selectedBranchId) return
      setLoading(true)
      setError('')
      try {
        const res = await inventoryService.getInventory({ branchId: selectedBranchId })
        if (res.success) {
          setInventory(res.data)
        } else {
          setError(res.message || 'Lỗi khi tải kho hàng.')
        }
      } catch (err: any) {
        setError('Không thể kết nối máy chủ để tải kho hàng.')
      } finally {
        setLoading(false)
      }
    }
    fetchInventory()
  }, [selectedBranchId])

  // Handle Scanning Simulation via keyboard Enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return
    processScannedCode(barcodeInput.trim())
    setBarcodeInput('')
  }

  const showScanFeedback = (text: string, type: 'success' | 'error') => {
    setScanMessage({ text, type })
    setTimeout(() => {
      setScanMessage(null)
    }, 3000)
  }

  // Add Item to POS Cart
  const addToCart = (item: Inventory) => {
    if (item.quantity <= 0) {
      showScanFeedback(`Sản phẩm ${item.productId.name} đã hết hàng!`, 'error')
      return
    }

    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.inventoryItem._id === item._id)
      if (existing) {
        if (existing.quantity >= item.quantity) {
          showScanFeedback(`Đã đạt giới hạn tồn kho (${item.quantity} sản phẩm)`, 'error')
          return prevCart
        }
        return prevCart.map((ci) =>
          ci.inventoryItem._id === item._id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        )
      }
      return [...prevCart, { inventoryItem: item, quantity: 1 }]
    })
  }

  // Update Cart Item Quantity
  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.inventoryItem._id === itemId) {
            const newQty = item.quantity + delta
            if (newQty <= 0) return null
            if (newQty > item.inventoryItem.quantity) {
              alert(`Không thể vượt quá số lượng tồn kho (${item.inventoryItem.quantity} sản phẩm).`)
              return item
            }
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    })
  }

  // Remove Item from Cart
  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.inventoryItem._id !== itemId))
  }

  // Calculate POS Total Amount
  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = item.inventoryItem.productId.salePrice ?? 0
      return total + price * item.quantity
    }, 0)
  }

  // Handle Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống!')
      return
    }

    setCheckoutLoading(true)
    setError('')

    try {
      const payload = {
        branchId: selectedBranchId,
        customerPhone: customerPhone.trim() || undefined,
        customerName: customerName.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.inventoryItem.productId._id,
          quantity: item.quantity,
        })),
        paymentMethod,
        note: note.trim() || undefined,
      }

      const res = await orderService.placeOfflineOrder(payload)
      if (res.success) {
        setCreatedOrder(res.data)
        setShowReceipt(true)
        // Clear cart and customer info
        setCart([])
        setCustomerPhone('')
        setCustomerName('')
        setNote('')
        
        // Refresh local inventory stock levels
        const refreshInv = await inventoryService.getInventory({ branchId: selectedBranchId })
        if (refreshInv.success) {
          setInventory(refreshInv.data)
        }
      } else {
        alert(res.message || 'Lỗi khi thanh toán đơn hàng.')
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng bán tại quầy.'
      alert(errMsg)
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Filter Inventory based on search queries
  const filteredProducts = inventory.filter((item) => {
    if (!item.productId) return false
    const nameMatch = item.productId.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const skuMatch = item.productId.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch || skuMatch
  })

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Print function
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] p-6 POS-container">
      {/* Printable Receipt ONLY Area */}
      {showReceipt && createdOrder && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-receipt-only, .print-receipt-only * {
              visibility: visible;
            }
            .print-receipt-only {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
              padding: 20px;
            }
            .POS-container {
              display: none !important;
            }
          }
        `}} />
      )}

      {/* Main Cashier Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            Hệ thống Bán tại Quầy (POS)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Giao diện bán hàng offline kết hợp quét mã vạch và quản lý hội viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {user?.role === 'admin' ? (
            <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-2 rounded-lg border border-slate-700 w-full md:w-auto">
              <span className="text-xs text-slate-400 font-medium">Chi nhánh:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-sm text-white border-none focus:outline-none cursor-pointer font-semibold"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id} className="bg-[#1e293b] text-white">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-[#1e293b] px-4 py-2 rounded-lg border border-slate-700 text-sm font-medium flex items-center gap-2 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Chi nhánh hoạt động:</span>
              <span className="font-semibold text-white">
                {branches.find((b) => b._id === selectedBranchId)?.name || 'Cẩm Lệ'}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              if (selectedBranchId) {
                setLoading(true)
                inventoryService.getInventory({ branchId: selectedBranchId })
                  .then((res) => res.success && setInventory(res.data))
                  .finally(() => setLoading(false))
              }
            }}
            className="p-2 rounded-lg bg-[#1e293b] border border-slate-700 hover:bg-[#334155] text-slate-300 transition-colors"
            title="Làm mới tồn kho"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-rose-900/30 border border-rose-700/50 text-rose-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Barcode Scan Simulator and Products Quick Grid (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          {/* Scanner Simulation Block */}
          <div className="bg-[#1e293b]/90 backdrop-blur-md rounded-xl p-5 border border-slate-700 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Cashier Simulator V1.0
            </div>

            <h2 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-500" />
              Giả lập Quét mã vạch (Barcode Scanner)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Live Camera Viewfinder using html5-qrcode */}
              <div className="md:col-span-4 h-36 bg-black rounded-lg relative overflow-hidden border border-slate-800 flex flex-col items-center justify-center text-center text-xs text-slate-500">
                {isCameraOn ? (
                  <>
                    <div id="pos-scanner-viewport" className="absolute inset-0 w-full h-full object-cover" />
                    
                    {/* Scanning animation laser line */}
                    <div className="absolute inset-x-0 h-[2px] bg-red-500 opacity-80 pointer-events-none" style={{
                      top: '50%',
                      boxShadow: '0 0 8px #ef4444',
                      animation: 'scannerLine 2s infinite ease-in-out',
                      zIndex: 10
                    }} />
                    
                    <div className="absolute inset-2 border border-slate-500/20 rounded flex flex-col justify-between p-1 pointer-events-none" style={{ zIndex: 10 }}>
                      <div className="flex justify-between">
                        <span className="w-2 h-2 border-t-2 border-l-2 border-emerald-500"></span>
                        <span className="w-2 h-2 border-t-2 border-r-2 border-emerald-500"></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="w-2 h-2 border-b-2 border-l-2 border-emerald-500"></span>
                        <span className="w-2 h-2 border-b-2 border-r-2 border-emerald-500"></span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="absolute bottom-2 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow hover:bg-rose-500 transition-colors"
                      style={{ zIndex: 20 }}
                    >
                      Tắt Camera
                    </button>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-slate-700 mb-1" />
                    <span className="text-[10px] text-slate-500 mb-2 font-semibold">Webcam Quét thật</span>
                    
                    <button
                      type="button"
                      onClick={startCamera}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1.5 rounded transition-colors"
                    >
                      Bật Camera Quét
                    </button>
                  </>
                )}
              </div>

              {/* Barcode Input Form */}
              <div className="md:col-span-8">
                <form onSubmit={handleBarcodeSubmit} className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400">
                    Nhập mã SKU sản phẩm (USB scanner sẽ tự gõ và nhấn Enter tại đây):
                  </label>
                  <div className="relative">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Quét hoặc nhập mã SKU (ví dụ: SP001, GIAY-01)..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="w-full bg-[#0f172a] text-white px-4 py-3 pr-10 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm tracking-wider placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-2 p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 transition-colors"
                    >
                      Bắn mã
                    </button>
                  </div>
                </form>

                {/* Scan Feedback message */}
                <div className="mt-2 h-6">
                  {scanMessage && (
                    <div className={`text-xs font-medium flex items-center gap-1.5 ${
                      scanMessage.type === 'success' ? 'text-emerald-400 animate-bounce' : 'text-rose-400'
                    }`}>
                      {scanMessage.type === 'success' ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      <span>{scanMessage.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Quick-Add Directory */}
          <div className="bg-[#1e293b]/90 backdrop-blur-md rounded-xl p-5 border border-slate-700 shadow-xl flex-1 flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Danh sách sản phẩm trong kho
              </h2>
              {/* Dynamic search inside branch inventory */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm theo Tên / SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0f172a] text-slate-200 pl-9 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-2" />
                <span className="text-sm text-slate-400">Đang đồng bộ dữ liệu tồn kho...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12 border-2 border-dashed border-slate-800 rounded-lg">
                <AlertCircle className="h-8 w-8 text-slate-600 mb-2" />
                <span>Không tìm thấy sản phẩm nào trong kho của chi nhánh này.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[500px] pr-1">
                {filteredProducts.map((item) => {
                  const product = item.productId
                  if (!product) return null
                  const outOfStock = item.quantity <= 0
                  return (
                    <button
                      key={item._id}
                      onClick={() => addToCart(item)}
                      disabled={outOfStock}
                      className={`flex flex-col text-left bg-[#0f172a] hover:bg-[#1e293b] rounded-lg p-3 border transition-all relative group ${
                        outOfStock
                          ? 'border-rose-950/40 opacity-55 cursor-not-allowed'
                          : 'border-slate-800 hover:border-emerald-600/50'
                      }`}
                    >
                      {/* Product Image Mock */}
                      <div className="w-full h-24 bg-[#1e293b] rounded-md mb-2 overflow-hidden flex items-center justify-center relative">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-slate-700" />
                        )}

                        {/* SKU badge */}
                        <span className="absolute top-1 left-1 bg-black/70 text-[9px] text-slate-300 font-mono px-1 rounded">
                          {product.sku}
                        </span>

                        {/* Stock status indicator */}
                        <span className={`absolute bottom-1 right-1 text-[9px] px-1 rounded font-bold ${
                          outOfStock
                            ? 'bg-rose-600 text-white'
                            : item.quantity <= item.lowStockThreshold
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {outOfStock ? 'Hết hàng' : `Tồn: ${item.quantity}`}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <span className="text-xs font-semibold text-slate-200 line-clamp-2 min-h-[32px] group-hover:text-white transition-colors">
                          {product.name}
                        </span>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-emerald-400">
                            {formatCurrency(product.price ?? product.salePrice ?? 0)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            /{product.unit || 'item'}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: POS Cart & Checkout Dashboard (4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
            {/* Header info */}
            <div className="bg-[#0f172a] px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                Chi tiết Giỏ hàng
              </h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} món
              </span>
            </div>

            {/* Cart Items list */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[300px] min-h-[200px] bg-[#1e293b]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
                  <ShoppingBag className="h-10 w-10 text-slate-700 mb-2" />
                  <span className="text-sm font-medium">Quầy bán hàng trống.</span>
                  <span className="text-[11px] text-slate-600 mt-1">Hãy quét barcode hoặc chọn sản phẩm ở bảng bên trái.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((item) => {
                    const product = item.inventoryItem.productId
                    const price = product.price ?? product.salePrice ?? 0
                    return (
                      <div
                        key={item.inventoryItem._id}
                        className="flex items-center justify-between gap-3 bg-[#0f172a] p-3 rounded-lg border border-slate-800"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-mono">{product.sku}</span>
                            <span className="text-xs text-emerald-400 font-bold">{formatCurrency(price)}</span>
                          </div>
                        </div>

                        {/* Adjust Quantity Buttons */}
                        <div className="flex items-center gap-1.5 bg-[#1e293b] p-1 rounded-md border border-slate-700">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.inventoryItem._id, -1)}
                            className="p-1 rounded bg-[#0f172a] hover:bg-[#334155] text-slate-300 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1.5 w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.inventoryItem._id, 1)}
                            className="p-1 rounded bg-[#0f172a] hover:bg-[#334155] text-slate-300 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.inventoryItem._id)}
                          className="text-slate-500 hover:text-rose-500 p-1 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Customer Lookup & Membership Register */}
            <div className="p-4 border-t border-slate-800 bg-[#0f172a]/50 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-500" />
                Thành viên / Hội viên
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Số điện thoại:</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="0987xxx..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#0f172a] text-xs text-white pl-8 pr-2 py-1.5 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Tên khách hàng:</label>
                  <input
                    type="text"
                    placeholder="Nhập tên thành viên..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={!customerPhone}
                    className="w-full bg-[#0f172a] text-xs text-white px-2 py-1.5 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              {customerPhone ? (
                <p className="text-[10px] text-slate-500">
                  * Nhập số điện thoại sẽ tự động tìm kiếm hội viên hoặc đăng ký mới khi lưu đơn hàng.
                </p>
              ) : (
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="h-1 w-1 bg-emerald-400 rounded-full animate-ping"></span>
                  Đang để trống - Sẽ thanh toán dưới dạng Khách vãng lai (Guest).
                </p>
              )}
            </div>

            {/* Checkout Actions and Methods */}
            <div className="p-4 border-t border-slate-800 bg-[#0f172a] flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-400">Thành tiền:</span>
                <span className="text-lg font-black text-emerald-400">
                  {formatCurrency(getSubtotal())}
                </span>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Hình thức thanh toán:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'COD', label: 'Tiền mặt' },
                    { id: 'banking', label: 'Banking' },
                    { id: 'momo', label: 'Ví Momo' },
                    { id: 'vnpay', label: 'Ví VNPAY' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`py-2 px-3 rounded text-xs font-semibold border transition-all ${
                        paymentMethod === method.id
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-[#1e293b] text-slate-300 border-slate-700 hover:bg-[#334155]'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cashier Notes */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Ghi chú giao dịch:</label>
                <textarea
                  placeholder="Ghi chú đơn hàng (nếu có)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#1e293b] text-xs text-slate-200 px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-12 resize-none"
                />
              </div>

              {/* Submit Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg border border-emerald-500 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
              >
                {checkoutLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang hoàn tất thanh toán...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Thanh toán & Xuất hóa đơn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POS Printable Receipt Modal */}
      {showReceipt && createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl max-w-md w-full shadow-2xl p-6 relative flex flex-col gap-4 POS-receipt-modal print-receipt-only">
            
            {/* Success icon / header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-700 flex flex-col items-center">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
              <h2 className="text-lg font-bold text-white">Thanh toán Thành công!</h2>
              <p className="text-xs text-slate-400 mt-0.5">Hóa đơn đã được ghi nhận trên hệ thống</p>
            </div>

            {/* Dashed Border Receipt Visual representation */}
            <div className="bg-white text-black p-5 rounded font-mono text-[11px] leading-relaxed flex flex-col gap-2 shadow-inner">
              <div className="text-center font-bold text-base mb-1 border-b border-black pb-1">
                HOÀ ĐƠN BÁN LẺ (POS)
              </div>

              <div className="flex justify-between">
                <span>MÃ HĐ:</span>
                <span className="font-bold">{createdOrder.code}</span>
              </div>
              <div className="flex justify-between">
                <span>NGÀY TẠO:</span>
                <span>{new Date(createdOrder.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between border-b border-black pb-1">
                <span>CHI NHÁNH:</span>
                <span>{(createdOrder.branchId as any)?.name || 'Chi nhánh Cẩm Lệ'}</span>
              </div>

              {/* Items Table */}
              <div className="mt-1 border-b border-black pb-1">
                <div className="grid grid-cols-12 font-bold mb-1">
                  <span className="col-span-6">Tên SP</span>
                  <span className="col-span-2 text-center">SL</span>
                  <span className="col-span-4 text-right">Thành tiền</span>
                </div>

                {createdOrder.items.map((item: any, idx: number) => {
                  const product = item.productId
                  return (
                    <div key={idx} className="grid grid-cols-12 mb-1 gap-1">
                      <span className="col-span-6 line-clamp-1">{product?.name || product?.productName || 'Sản phẩm'}</span>
                      <span className="col-span-2 text-center">{item.quantity}</span>
                      <span className="col-span-4 text-right font-bold">{formatCurrency(item.subtotal)}</span>
                    </div>
                  )
                })}
              </div>

              {/* Customer & Total Details */}
              <div className="flex justify-between font-bold text-xs pt-1 border-b border-black pb-1">
                <span>TỔNG TIỀN:</span>
                <span>{formatCurrency(createdOrder.totalAmount)}</span>
              </div>

              <div className="flex flex-col gap-1 mt-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Hội viên:</span>
                  <span>{(createdOrder.customerId as any)?.fullName || 'Khách vãng lai'}</span>
                </div>
                {((createdOrder.customerId as any)?.phone) && (
                  <div className="flex justify-between">
                    <span>SĐT hội viên:</span>
                    <span>{(createdOrder.customerId as any)?.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Hình thức:</span>
                  <span className="uppercase">{createdOrder.paymentMethod || 'COD'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thu ngân:</span>
                  <span>{user?.fullName || 'Nhân viên thu ngân'}</span>
                </div>
              </div>

              <div className="text-center mt-3 pt-2 border-t border-black text-[9px] font-bold">
                CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!
              </div>
            </div>

            {/* Print and Close controls */}
            <div className="flex gap-3 justify-end mt-2 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition-colors"
              >
                <Printer className="h-4 w-4" />
                In Hóa đơn
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReceipt(false)
                  setCreatedOrder(null)
                }}
                className="py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
