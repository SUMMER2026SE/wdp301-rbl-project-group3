import { useEffect, useRef, useState, useMemo, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useCart } from '@/contexts/CartContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useSocket } from '@/contexts/SocketContext'
import { productService } from '@services/productService'
import { branchService } from '@services/branchService'
import { categoryService } from '@services/categoryService'
import { flashSaleService } from '@services/flashSaleService'
import { bannerService } from '@services/bannerService'
import type { Product, Branch, Category as DbCategory, Banner } from '@/types'
import {
  ArrowRight,
  Camera,
  ChevronDown,
  CookingPot,
  CreditCard,
  Croissant,
  Egg,
  Heart,
  Languages,
  Leaf,
  MapPin,
  Milk,
  Phone,
  PlayCircle,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  Trophy,
  User,
  Utensils,
  WalletCards,
  Zap,
  X,
  type LucideIcon,
} from 'lucide-react'

type IconProps = {
  children: ReactNode
  className?: string
  filled?: boolean
}

type Category = {
  icon: string
  label: string
  active?: boolean
}

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

type CountdownTime = {
  hours: string
  minutes: string
  seconds: string
}

const iconMap: Record<string, LucideIcon> = {
  account_balance_wallet: WalletCards,
  add: Plus,
  add_shopping_cart: ShoppingCart,
  arrow_forward: ArrowRight,
  bakery_dining: Croissant,
  bolt: Zap,
  contactless: CreditCard,
  credit_card: CreditCard,
  eco: Leaf,
  egg: Egg,
  expand_more: ChevronDown,
  favorite: Heart,
  ios: Smartphone,
  language: Languages,
  local_drink: Milk,
  location_on: MapPin,
  outdoor_grill: CookingPot,
  person: User,
  phone: Phone,
  photo_camera: Camera,
  play_circle: PlayCircle,
  restaurant: Utensils,
  search: Search,
  shop: Store,
  shopping_bag: ShoppingBag,
  shopping_cart: ShoppingCart,
  social_leaderboard: Trophy,
  star: Star,
  close: X,
}

const categoryIconMap: Record<string, string> = {
  'DO-UONG': 'local_drink',
  'THUC-AN-NHE': 'bakery_dining',
  'FRUITS': 'eco',
  'MEAT': 'restaurant',
  'DAIRY': 'egg',
  'COOKING': 'outdoor_grill',
  'Beverages': 'local_drink',
  'Snacks & Bakery': 'bakery_dining',
  'Fruits & Vegetables': 'eco',
  'Fresh Meat & Seafood': 'restaurant',
  'Dairy & Eggs': 'egg',
  'Cooking Essentials': 'outdoor_grill',
}

const categories: Category[] = [
  { icon: 'eco', label: 'Fruits & Vegetables', active: true },
  { icon: 'restaurant', label: 'Fresh Meat & Seafood' },
  { icon: 'egg', label: 'Dairy & Eggs' },
  { icon: 'local_drink', label: 'Beverages' },
  { icon: 'bakery_dining', label: 'Snacks & Bakery' },
  { icon: 'outdoor_grill', label: 'Cooking Essentials' },
]

const heroImage = '/assets/winmart/hero-market.png'

const ALL_BRANCH: Branch = {
  _id: '',
  name: 'Tất cả chi nhánh',
  code: 'ALL',
  address: 'Hiển thị sản phẩm từ tất cả chi nhánh hệ thống',
  status: 'active'
}


const getCountdownTime = (endDateStr?: string): CountdownTime => {
  if (!endDateStr) {
    return { hours: '00', minutes: '00', seconds: '00' }
  }
  const end = new Date(endDateStr).getTime()
  const now = new Date().getTime()
  const diff = end - now

  if (diff <= 0) {
    return { hours: '00', minutes: '00', seconds: '00' }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  }
}

const Icon = ({ children, className = '', filled = false }: IconProps) => {
  const iconName = String(children)
  const IconComponent = iconMap[iconName] ?? ShoppingCart

  return (
    <IconComponent
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      fill={filled ? 'currentColor' : 'none'}
      size={20}
      strokeWidth={2}
    />
  )
}

const getCategoryKeywords = (label: string): string[] => {
  switch (label) {
    case 'Fruits & Vegetables':
      return ['tomato', 'carrot', 'asparagus', 'fruit', 'vegetable', 'onion', 'potato', 'cabbage', 'apple', 'banana', 'orange', 'lemon', 'berry', 'berries', 'citrus']
    case 'Fresh Meat & Seafood':
      return ['steak', 'ribeye', 'meat', 'beef', 'pork', 'chicken', 'fish', 'bass', 'salmon', 'seafood', 'shrimp']
    case 'Dairy & Eggs':
      return ['milk', 'egg', 'yogurt', 'cheese', 'butter', 'dairy']
    case 'Beverages':
    case 'Drinks':
      return ['water', 'sparkle', 'drink', 'juice', 'soda', 'coke', 'tea', 'coffee']
    case 'Snacks & Bakery':
    case 'Snacks':
      return ['sourdough', 'bread', 'croissant', 'snack', 'bakery', 'cake', 'cookie', 'chip']
    case 'Cooking Essentials':
      return ['oil', 'salt', 'sauce', 'pepper', 'sugar', 'vinegar', 'spice']
    case 'Fresh Food':
      return ['tomato', 'carrot', 'asparagus', 'fruit', 'vegetable', 'onion', 'potato', 'cabbage', 'apple', 'banana', 'orange', 'lemon', 'berry', 'berries', 'citrus', 'steak', 'ribeye', 'meat', 'beef', 'pork', 'chicken', 'fish', 'bass', 'salmon', 'seafood', 'shrimp']
    default:
      return []
  }
}

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

const FlashSaleCard = ({
  product,
  flashSalePrice,
  onAddToCart
}: {
  product: any;
  flashSalePrice: number;
  onAddToCart?: () => void
}) => {
  const title = product.productName || product.name
  const price = formatVND(flashSalePrice)
  const originalPrice = formatVND(product.salePrice || 0)

  const originalVal = product.salePrice || 0
  const discountPercent = originalVal > 0
    ? Math.round(((originalVal - flashSalePrice) / originalVal) * 100)
    : 20
  const discount = `-${discountPercent}%`

  const unit = product.unit || 'unit'
  const image = product.imageUrl || productImageMap[title] || '/assets/winmart/tomatoes.png'

  return (
    <article className="bg-surface-container-lowest rounded-xl p-4 soft-lift group hover:scale-[0.98] transition-all cursor-pointer relative border border-transparent hover:border-primary/20">
      <div className="absolute top-2 left-2 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-1 rounded-full z-10">
        {discount}
      </div>
      <div className="aspect-square bg-surface-container-low rounded-lg mb-4 overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          src={image}
          alt={title}
        />
      </div>
      <h3 className="font-label-lg text-label-lg mb-1 truncate" title={title}>{title}</h3>
      <p className="text-[12px] text-on-surface-variant mb-3">{unit}</p>
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-secondary font-bold text-headline-sm">{price}</span>
          <span className="text-[10px] line-through text-on-surface-variant opacity-60">
            {originalPrice}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart?.()
          }}
          className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center beveled-btn hover:bg-primary hover:text-white transition-colors"
          type="button"
          aria-label={`Add ${title} to cart`}
        >
          <Icon>add_shopping_cart</Icon>
        </button>
      </div>
    </article>
  )
}

const RecommendedCard = ({ product, onAddToCart }: { product: any; onAddToCart?: () => void }) => {
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites()
  const title = product.productName || product.name
  const price = formatVND(product.salePrice || 0)
  const unit = product.unit || 'unit'
  const image = product.imageUrl || productImageMap[title] || '/assets/winmart/tomatoes.png'
  const rating = '4.8'
  const reviews = '15'
  const hasFavorite = true
  const prodId = product._id || product.id
  const favorited = isFavorite(prodId)

  const handleFavoriteClick = (e: any) => {
    e.stopPropagation()
    if (favorited) {
      removeFromFavorites(prodId)
    } else {
      addToFavorites(prodId)
    }
  }

  return (
    <article className="bg-surface-container-lowest rounded-xl p-4 soft-lift border border-transparent hover:border-primary/20 group transition-all">
      <div className="aspect-square bg-surface-container-low rounded-lg mb-4 relative overflow-hidden">
        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={image} alt={title} />
        {hasFavorite ? (
          <button
            onClick={handleFavoriteClick}
            className={`absolute bottom-2 right-2 p-2 rounded-full shadow-md transition-all translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 ${favorited ? 'bg-error text-white opacity-100 translate-y-0' : 'bg-white/90 text-primary opacity-0'
              }`}
            type="button"
            aria-label={`Favorite ${title}`}
          >
            <Icon filled={favorited}>favorite</Icon>
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-1 mb-1">
        <Icon className="text-tertiary w-[14px] h-[14px]" filled>
          star
        </Icon>
        <span className="text-[12px] font-bold">{rating}</span>
        <span className="text-[12px] text-on-surface-variant opacity-60">({reviews})</span>
      </div>
      <h3 className="font-label-lg text-label-lg mb-1 truncate" title={title}>{title}</h3>
      <p className="text-[12px] text-on-surface-variant mb-4">{unit}</p>
      <div className="flex justify-between items-center">
        <span className="text-primary font-bold text-headline-sm">{price}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart?.()
          }}
          className="flex items-center justify-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-[12px] font-bold beveled-btn hover:bg-primary-container transition-all"
          type="button"
          aria-label={`Thêm ${title} vào giỏ`}
        >
          <Icon className="w-[18px] h-[18px]">add</Icon> Thêm
        </button>
      </div>
    </article>
  )
}

export const HomePage = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { cart, addToCart, updateQuantity, removeItem, clearCart, refreshCart } = useCart()
  const { socket } = useSocket()
  const [activeFlashSale, setActiveFlashSale] = useState<any | null>(null)
  const [countdown, setCountdown] = useState<CountdownTime>({ hours: '00', minutes: '00', seconds: '00' })
  const heroImageRef = useRef<HTMLImageElement | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [dbProducts, setDbProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [liveSearchResults, setLiveSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | DbCategory>('All')
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false)
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([])
  const [publicSettings, setPublicSettings] = useState<Record<string, any>>({})
  const [confirmClearCart, setConfirmClearCart] = useState(false)
  const [confirmRemoveItem, setConfirmRemoveItem] = useState<any | null>(null)

  const [activeBanners, setActiveBanners] = useState<Banner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const currentBanner = activeBanners[currentBannerIndex]

  // Branch states
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const [branchSearch, setBranchSearch] = useState('')

  const fetchPublicSettings = async () => {
    try {
      const res = await fetch('/api/settings/public')
      const data = await res.json()
      if (data?.success && data?.data?.settings) {
        setPublicSettings(data.data.settings)
      }
    } catch (err) {
      console.error('Failed to fetch public settings:', err)
    }
  }

  const fetchDbProducts = async (keyword?: string, branchId?: string) => {
    setActiveSearchQuery(keyword || '')
    setHasLoadedProducts(false)
    try {
      const activeBranchId = branchId || selectedBranch?._id
      const res = await productService.getProducts({
        keyword,
        status: 'active',
        branchId: activeBranchId,
        limit: 1000
      })
      if (res.success) {
        setDbProducts(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setHasLoadedProducts(true)
    }
  }

  const fetchActiveFlashSale = async (branchId?: string) => {
    try {
      const activeBranchId = branchId || selectedBranch?._id
      const res = await flashSaleService.getActiveFlashSale(activeBranchId)
      if (res.success && res.data) {
        setActiveFlashSale(res.data.flashSale)
      } else {
        setActiveFlashSale(null)
      }
    } catch (err) {
      console.error('Failed to fetch active flash sale:', err)
      setActiveFlashSale(null)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await branchService.getBranches({ status: 'active' })
      if (res.success && res.data) {
        setBranches(res.data)
        let activeBranch = res.data[0]
        const savedBranchStr = localStorage.getItem('selectedBranch')
        if (savedBranchStr) {
          try {
            const parsed = JSON.parse(savedBranchStr)
            if (parsed && parsed._id === '') {
              activeBranch = ALL_BRANCH
            } else {
              const found = res.data.find((b) => b._id === parsed._id)
              if (found) {
                activeBranch = found
              }
            }
          } catch (e) {
            console.error('Failed to parse saved branch', e)
          }
        }
        setSelectedBranch(activeBranch)
        localStorage.setItem('selectedBranch', JSON.stringify(activeBranch))
        fetchDbProducts(searchQuery, activeBranch?._id)
        fetchActiveFlashSale(activeBranch?._id)
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getCategories({ status: 'active' })
      if (res.success && res.data) {
        setDbCategories(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchActiveBanners = async () => {
    try {
      const res = await bannerService.getActiveBanners()
      if (res.success && res.data?.banners) {
        setActiveBanners(res.data.banners)
      }
    } catch (err) {
      console.error('Failed to fetch banners:', err)
    }
  }

  useEffect(() => {
    fetchBranches()
    fetchCategories()
    fetchActiveBanners()
    fetchPublicSettings()
  }, [])

  // Đăng ký lắng nghe các thay đổi thời gian thực
  useEffect(() => {
    if (!socket) return

    const handleProductChange = () => {
      fetchDbProducts(searchQuery, selectedBranch?._id)
    }

    const handleBannerChange = () => {
      fetchActiveBanners()
    }

    const handleFlashSaleChange = () => {
      fetchActiveFlashSale(selectedBranch?._id)
    }

    const handleCategoryChange = () => {
      fetchCategories()
    }

    socket.on('product:created', handleProductChange)
    socket.on('product:updated', handleProductChange)
    socket.on('product:deleted', handleProductChange)
    socket.on('banner:updated', handleBannerChange)
    socket.on('flash_sale:updated', handleFlashSaleChange)
    socket.on('category:updated', handleCategoryChange)

    return () => {
      socket.off('product:created', handleProductChange)
      socket.off('product:updated', handleProductChange)
      socket.off('product:deleted', handleProductChange)
      socket.off('banner:updated', handleBannerChange)
      socket.off('flash_sale:updated', handleFlashSaleChange)
      socket.off('category:updated', handleCategoryChange)
    }
  }, [socket, selectedBranch, searchQuery])

  useEffect(() => {
    if (activeBanners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [activeBanners])

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
    fetchDbProducts(searchQuery, branch._id)
    fetchActiveFlashSale(branch._id)
    refreshCart()
  }

  const filteredRecommendedProducts = useMemo(() => {
    if (hasLoadedProducts && dbProducts.length === 0) return []

    if (selectedCategory === 'All') return dbProducts

    if (typeof selectedCategory === 'object' && selectedCategory !== null) {
      return dbProducts.filter((product) => product.categoryId === selectedCategory._id)
    }

    const keywords = getCategoryKeywords(selectedCategory)
    return dbProducts.filter((product) => {
      const name = (product.productName || product.name || '').toLowerCase()
      return keywords.some((kw) => name.includes(kw))
    })
  }, [dbProducts, selectedCategory, hasLoadedProducts])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setLiveSearchResults([])
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await productService.getProducts({
          keyword: searchQuery,
          status: 'active',
          branchId: selectedBranch?._id,
          limit: 5
        })
        if (res.success) {
          setLiveSearchResults(res.data)
        } else {
          setLiveSearchResults([])
        }
      } catch (err) {
        console.error('Live search error:', err)
        setLiveSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedBranch])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdown(getCountdownTime(activeFlashSale?.endDate))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [activeFlashSale])

  const handleHeroMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (!heroImageRef.current) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 20
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 20
    heroImageRef.current.style.transform = `scale(1.05) translate(${x}px, ${y}px)`
  }

  const handleHeroMouseLeave = () => {
    if (heroImageRef.current) {
      heroImageRef.current.style.transform = 'scale(1) translate(0px, 0px)'
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setShowUserMenu(false)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-on-surface font-body-md">
      <nav className="bg-primary text-on-primary font-label-md text-label-md docked full-width top-0 z-50 flex justify-between items-center w-full px-4 md:px-8 h-10 overflow-hidden">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <span className="flex items-center gap-1">
            <Icon className="w-[18px] h-[18px]">location_on</Icon> Store Locator
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Icon className="w-[18px] h-[18px]">phone</Icon> Hotline: {publicSettings.hotline || '1-800-FRESH'}
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a className="hover:text-white transition-colors" href="/">
            Partner
          </a>
          <a className="hover:text-white transition-colors" href="/">
            Tracking
          </a>
          <span className="flex items-center gap-1 cursor-pointer">
            <Icon className="w-[18px] h-[18px]">language</Icon> English
          </span>
        </div>
      </nav>

      <header className="sticky top-10 w-full bg-surface-container-lowest z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-wrap md:flex-nowrap justify-start md:justify-between items-center gap-4 md:gap-8">
          <div className="flex items-center gap-8">
            <h1 className="font-headline-lg text-headline-lg font-black text-primary">
              {publicSettings.store_name || 'PMAN-Mart'}
            </h1>
            <div className="hidden xl:flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                Deliver from
              </span>
              <div
                onClick={() => setIsBranchModalOpen(true)}
                className="flex items-center text-primary font-bold cursor-pointer hover:opacity-80 transition-all"
              >
                <span className="text-body-md truncate max-w-[180px]">
                  {selectedBranch ? selectedBranch.name : 'Chọn chi nhánh'}
                </span>
                <Icon>expand_more</Icon>
              </div>
            </div>
          </div>

          <div className="order-3 w-full md:order-none md:flex-1 md:max-w-2xl relative group z-50">
            <input
              className="w-full bg-surface-container-low border-none rounded-full py-3 px-6 pl-12 focus:ring-2 focus:ring-primary transition-all"
              placeholder="What are you looking for today? (Press Enter to search)"
              type="text"
              aria-label="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Delay hiding dropdown so clicks on items register
                setTimeout(() => setIsSearchFocused(false), 200)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchDbProducts(searchQuery)
                  document.getElementById('recommended-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setIsSearchFocused(false)
                }
              }}
            />
            <button
              onClick={() => {
                fetchDbProducts(searchQuery)
                document.getElementById('recommended-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setIsSearchFocused(false)
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              type="button"
            >
              <Icon>search</Icon>
            </button>

            {isSearchFocused && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center text-on-surface-variant gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-bold">Đang tìm kiếm...</span>
                  </div>
                ) : liveSearchResults.length === 0 ? (
                  <div className="p-4 text-center text-on-surface-variant text-sm font-bold">
                    Không tìm thấy sản phẩm nào khớp với "{searchQuery}"
                  </div>
                ) : (
                  <ul className="flex flex-col">
                    {liveSearchResults.map((product) => (
                      <li key={product._id}>
                        <button
                          className="w-full text-left p-3 hover:bg-surface-container-low transition-colors flex items-center justify-between gap-3 border-b border-outline-variant/10 last:border-0"
                          onClick={() => {
                            // If user clicks, perform the full search
                            setSearchQuery(product.name || '')
                            fetchDbProducts(product.name || '')
                            document.getElementById('recommended-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden shrink-0">
                              <img
                                src={product.imageUrl || '/assets/winmart/tomatoes.png'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-body-md font-bold text-on-surface truncate">{product.name}</span>
                              <span className="text-label-sm text-on-surface-variant truncate">{product.categoryId || ''}</span>
                            </div>
                          </div>
                          <span className="text-primary font-bold whitespace-nowrap text-body-md">
                            {formatVND(product.salePrice || 0)}
                          </span>
                        </button>
                      </li>
                    ))}
                    <li className="p-2 bg-surface-container-lowest">
                      <button
                        className="w-full text-center text-sm text-primary font-bold hover:underline py-2"
                        onClick={() => {
                          fetchDbProducts(searchQuery)
                          document.getElementById('recommended-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                      >
                        Xem tất cả kết quả cho "{searchQuery}"
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto hidden sm:flex items-center gap-3 md:gap-6">
            {isAuthenticated && user ? (
              <div className="relative flex h-full items-center">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 cursor-pointer group lg:min-w-[200px]"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="text-primary">person</Icon>
                    )}
                  </div>
                  <span className="font-label-lg text-label-lg hidden lg:block pr-1">
                    {user.fullName}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-[calc(100%+16px)] w-full min-w-[200px] bg-surface-container-lowest rounded-b-xl shadow-lg py-2 z-50 border border-t-0 border-outline-variant flex flex-col">
                    <button
                      onClick={() => {
                        const isBackOffice = ['admin', 'branch_manager', 'staff'].includes(user.role)
                        navigate(isBackOffice ? '/admin' : '/dashboard')
                        setShowUserMenu(false)
                      }}
                      className="flex w-full items-center gap-[18px] pl-[10px] pr-4 py-2.5 text-left text-sm hover:bg-surface-container-low transition-colors text-on-surface"
                    >
                      <Icon className="text-on-surface-variant text-[20px]">dashboard</Icon>
                      <span className="font-medium">Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/dashboard/profile')
                        setShowUserMenu(false)
                      }}
                      className="flex w-full items-center gap-[18px] pl-[10px] pr-4 py-2.5 text-left text-sm hover:bg-surface-container-low transition-colors text-on-surface"
                    >
                      <Icon className="text-on-surface-variant text-[20px]">person</Icon>
                      <span className="font-medium">Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      className="flex w-full items-center gap-[18px] pl-[10px] pr-4 py-2.5 text-left text-sm text-error hover:bg-error-container transition-colors"
                    >
                      <Icon className="text-[20px]">logout</Icon>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Icon className="text-primary">person</Icon>
                </div>
                <span className="font-label-lg text-label-lg hidden lg:block">Login</span>
              </button>
            )}
            <div
              onClick={() => setIsCartOpen(true)}
              className="relative hidden sm:block cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Icon className="text-primary" filled>
                  shopping_cart
                </Icon>
              </div>
              {cart && cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.totalItems}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-stack-lg">
        {activeBanners.length > 0 && (
          <section
            className="w-full min-w-0 relative overflow-hidden rounded-xl h-[520px] sm:h-[460px] lg:h-[420px] bg-primary group mb-8"
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
          >
            <img
              ref={heroImageRef}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80 transition-transform duration-700 group-hover:scale-105"
              src={currentBanner ? currentBanner.imageUrl : heroImage}
              alt={currentBanner ? currentBanner.title : "Premium organic supermarket aisle with fresh produce"}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center px-6 md:px-12 text-white">
              <span className="bg-secondary text-white font-bold px-4 py-1 rounded-full w-fit mb-4 text-label-lg animate-bounce">
                {currentBanner ? "Ưu Đãi Đặc Biệt" : "Exclusive Offer"}
              </span>
              <h2 className="font-headline-lg text-[36px] sm:text-[40px] md:text-[48px] leading-tight mb-4 max-w-[11ch] sm:max-w-none">
                {currentBanner ? currentBanner.title : "Fresh Food Festival"}
                <br />
                <span className="text-primary-fixed">{currentBanner ? currentBanner.subtitle : "Up to 30% OFF"}</span>
              </h2>
              <p className="text-body-lg mb-8 opacity-90 max-w-[280px] sm:max-w-sm md:max-w-none">
                {currentBanner ? currentBanner.description : "Experience the peak of season's harvest with our premium organic selection."}
                {currentBanner?.promoCode && (
                  <>
                    <br />
                    Mã code: <span className="font-bold border-b-2 border-primary-fixed">{currentBanner.promoCode}</span>
                  </>
                )}
                {!currentBanner && (
                  <>
                    <br />
                    Use code: <span className="font-bold border-b-2 border-primary-fixed">FRESH2026</span>
                  </>
                )}
              </p>
              <button
                onClick={() => {
                  const targetId = currentBanner?.linkUrl || '#recommended-products';
                  if (targetId.startsWith('#')) {
                    document.getElementById(targetId.substring(1))?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate(targetId);
                  }
                }}
                className="beveled-btn bg-primary-container hover:bg-primary text-on-primary-container hover:text-white px-8 py-4 rounded-xl font-bold w-fit transition-all flex items-center gap-2 group-hover:translate-x-2"
                type="button"
              >
                Shop Now <Icon>arrow_forward</Icon>
              </button>
            </div>

            {/* Dot Indicators for carousel */}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-primary w-6' : 'bg-white/50 hover:bg-white'
                      }`}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <section className="mt-stack-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <h2 className="font-headline-md text-headline-md flex items-center gap-2">
                <Icon className="text-secondary" filled>
                  bolt
                </Icon>
                Flash Sale
              </h2>
              <div className="flex gap-2 text-white font-bold" aria-label="Flash sale countdown">
                <span className="bg-secondary px-2 py-1 rounded">{countdown.hours}</span>:
                <span className="bg-secondary px-2 py-1 rounded">{countdown.minutes}</span>:
                <span className="bg-secondary px-2 py-1 rounded">{countdown.seconds}</span>
              </div>
            </div>
            <a className="text-primary font-bold hover:underline" href="/">
              View All &gt;
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-gutter-md">
            {(() => {
              if (!activeFlashSale || !activeFlashSale.products || activeFlashSale.products.length === 0) {
                return (
                  <div className="col-span-full text-center py-12 text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <p className="text-sm font-bold">Không có sản phẩm Flash Sale nào đang hoạt động tại chi nhánh này</p>
                  </div>
                )
              }

              // Lọc các sản phẩm có tồn kho tại chi nhánh hiện tại (hoặc hiển thị toàn bộ nếu chọn Tất cả chi nhánh)
              const availableFlashProducts = activeFlashSale.products.filter((fp: any) => {
                const product = fp.productId
                if (!product) return false
                const productIdStr = typeof product === 'object' && product !== null ? product._id : product
                return selectedBranch?._id === '' || dbProducts.some((p) => p._id === productIdStr)
              })

              if (availableFlashProducts.length === 0) {
                return (
                  <div className="col-span-full text-center py-12 text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <p className="text-sm font-bold">Không có sản phẩm Flash Sale nào đang hoạt động tại chi nhánh này</p>
                  </div>
                )
              }

              return availableFlashProducts.slice(0, 5).map((fp: any) => {
                const product = fp.productId
                const productIdStr = typeof product === 'object' && product !== null ? product._id : product

                return (
                  <FlashSaleCard
                    key={productIdStr}
                    product={product}
                    flashSalePrice={fp.flashSalePrice}
                    onAddToCart={async () => {
                      if (!isAuthenticated) {
                        navigate('/login')
                        return
                      }
                      try {
                        await addToCart(productIdStr, 1)
                      } catch (err: any) {
                        alert(err.message || 'Thêm vào giỏ hàng thất bại.')
                      }
                    }}
                  />
                )
              })
            })()}
          </div>
        </section>


        <section className="mt-stack-lg grid grid-cols-12 gap-gutter-md">
          <aside className="col-span-12 lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-inset-card hidden lg:flex flex-col gap-2">
            <div className="mb-2 px-2">
              <h2 className="font-headline-sm text-headline-sm text-primary">Danh mục</h2>
              <p className="text-label-md text-on-surface-variant">Mua sắm theo ngành hàng</p>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Danh mục sản phẩm">
              <button
                onClick={() => setSelectedCategory('All')}
                className={
                  selectedCategory === 'All'
                    ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-bold transition-all scale-[0.98] text-left w-full'
                    : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-primary-container/10 hover:text-primary transition-all text-left w-full'
                }
                type="button"
              >
                <Icon className="w-5 h-5">shop</Icon>
                Tất cả ngành hàng
              </button>
              {(dbCategories.length > 0 ? dbCategories : categories).map((category) => {
                const isDb = '_id' in category
                const label = isDb ? (category as DbCategory).name : (category as any).label
                const code = isDb ? (category as DbCategory).code : (category as any).label
                const iconName = isDb ? (categoryIconMap[code] || categoryIconMap[label] || 'eco') : (category as any).icon
                const active = typeof selectedCategory === 'object' && selectedCategory !== null
                  ? (isDb && selectedCategory._id === (category as DbCategory)._id)
                  : (!isDb && selectedCategory === label)

                return (
                  <button
                    key={isDb ? (category as DbCategory)._id : label}
                    onClick={() => setSelectedCategory(category as any)}
                    className={
                      active
                        ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-bold transition-all scale-[0.98] text-left w-full'
                        : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-primary-container/10 hover:text-primary transition-all text-left w-full'
                    }
                    type="button"
                  >
                    <Icon className="w-5 h-5">{iconName}</Icon>
                    {label}
                  </button>
                )
              })}
            </nav>
          </aside>

          <section id="recommended-products" className="col-span-12 lg:col-span-9 scroll-mt-24">
            <div className="mb-8">
              <h2 className="font-headline-md text-headline-md">
                {activeSearchQuery ? `Kết quả tìm kiếm cho "${activeSearchQuery}"` : "Gợi ý dành cho bạn"}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter-md">
              {hasLoadedProducts && filteredRecommendedProducts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/30">
                  <p className="text-sm font-bold">Không có sản phẩm nào được gợi ý tại chi nhánh này</p>
                </div>
              ) : (
                filteredRecommendedProducts.map((product) => {
                  return (
                    <RecommendedCard
                      key={product._id}
                      product={product}
                      onAddToCart={async () => {
                        if (!isAuthenticated) {
                          navigate('/login')
                          return
                        }
                        try {
                          await addToCart(product._id, 1)
                        } catch (err: any) {
                          alert(err.message || 'Thêm vào giỏ hàng thất bại.')
                        }
                      }}
                    />
                  )
                })
              )}
            </div>
          </section>
        </section>
      </main>

      {isAuthenticated && cart && cart.totalItems > 0 && (
        <div
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg glass-cart rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3 shadow-2xl z-50 border border-white/20 cursor-pointer hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex -space-x-4">
              {cart.items.slice(0, 3).map((item) => {
                const image = item.product.imageUrl || productImageMap[item.product.name] || '/assets/winmart/tomatoes.png'
                return (
                  <div
                    key={item.itemId}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white overflow-hidden bg-surface-container"
                  >
                    <img className="w-full h-full object-cover" src={image} alt={item.product.name} />
                  </div>
                )
              })}
              {cart.items.length > 3 && (
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white flex items-center justify-center bg-primary-container text-white text-[10px] font-bold">
                  +{cart.items.length - 3}
                </div>
              )}
            </div>
            <div>
              <p className="text-label-lg font-bold whitespace-nowrap">{cart.totalItems} items in cart</p>
              <p className="text-[12px] text-on-surface-variant">
                Estimated Total: <span className="text-primary font-bold">{formatVND(cart.totalAmount)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/checkout')
            }}
            className="hidden sm:flex bg-primary text-white px-4 md:px-6 py-3 rounded-xl font-bold text-body-md hover:bg-on-primary-fixed-variant transition-all items-center gap-2"
            type="button"
          >
            <span className="hidden sm:inline">Checkout</span>
            <Icon>shopping_bag</Icon>
          </button>
        </div>
      )}

      <footer className="bg-surface-container-highest border-t border-outline-variant mt-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter-md w-full px-8 py-stack-lg max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <h2 className="font-headline-md text-headline-md font-bold text-primary">
              {publicSettings.store_name || 'PMAN-Mart'}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Your premium choice for organic groceries and fresh food since 2026.
            </p>
            <div className="flex gap-4 mt-2">
              <Icon className="text-primary cursor-pointer hover:scale-110 transition-transform">
                social_leaderboard
              </Icon>
              <Icon className="text-primary cursor-pointer hover:scale-110 transition-transform">
                photo_camera
              </Icon>
              <Icon className="text-primary cursor-pointer hover:scale-110 transition-transform">
                play_circle
              </Icon>
            </div>
          </div>

          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface mb-4">
              About {publicSettings.store_name || 'PMAN-Mart'}
            </h3>
            <ul className="flex flex-col gap-2">
              {['About Us', 'Branches', 'Sustainability', 'Careers'].map((item) => (
                <li key={item}>
                  <a
                    className="text-on-surface-variant hover:text-primary underline-offset-4 hover:underline"
                    href="/"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface mb-4">Customer Support</h3>
            <ul className="flex flex-col gap-2">
              {['Shipping Policy', 'Return Policy', 'Payment Methods', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <a
                    className="text-on-surface-variant hover:text-primary underline-offset-4 hover:underline"
                    href="/"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface mb-4">Download App</h3>
            <div className="flex flex-col gap-3">
              <div className="bg-black text-white p-2 rounded-lg flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <Icon className="w-8 h-8">shop</Icon>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase">Get it on</span>
                  <span className="text-[14px] font-bold">Google Play</span>
                </div>
              </div>
              <div className="bg-black text-white p-2 rounded-lg flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <Icon className="w-8 h-8">ios</Icon>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase">Download on the</span>
                  <span className="text-[14px] font-bold">App Store</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-6 border-t border-outline-variant/30 flex justify-between items-center text-on-surface-variant text-label-md">
          <span>&copy; 2026 {publicSettings.store_name || 'PMAN-Mart'} Premium. All rights reserved.</span>
          <div className="flex gap-6">
            <Icon className="w-5 h-5">credit_card</Icon>
            <Icon className="w-5 h-5">account_balance_wallet</Icon>
            <Icon className="w-5 h-5">contactless</Icon>
          </div>
        </div>
      </footer>

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-surface-container-lowest shadow-2xl flex flex-col">
              {/* Header */}
              <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="text-primary" filled>shopping_cart</Icon>
                  <h2 className="text-headline-sm font-bold">Shopping Cart</h2>
                </div>
                <div className="flex items-center gap-2">
                  {cart && cart.items.length > 0 && (
                    <button
                      onClick={() => setConfirmClearCart(true)}
                      className="text-error font-bold text-label-md flex items-center gap-1 hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors"
                      type="button"
                    >
                      <Icon className="w-5 h-5">delete</Icon> Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
                    type="button"
                    aria-label="Close cart"
                  >
                    <Icon>close</Icon>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!cart || cart.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                    <Icon className="text-outline w-16 h-16 mb-4 animate-bounce">shopping_cart_off</Icon>
                    <p className="font-bold text-body-lg">Giỏ hàng của bạn đang trống</p>
                    <p className="text-body-md">Thêm sản phẩm để bắt đầu mua sắm!</p>
                  </div>
                ) : (
                  cart.items.map((item) => {
                    const image = (item.product as any).imageUrl || productImageMap[item.product.name] || '/assets/winmart/tomatoes.png'
                    return (
                      <div
                        key={item.itemId}
                        className="flex items-center gap-4 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                          <img className="w-full h-full object-cover" src={image} alt={item.product.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-body-md truncate">{item.product.name}</h4>
                          {item.product.unit && (
                            <p className="text-label-md text-on-surface-variant">{item.product.unit}</p>
                          )}
                          <p className="text-primary font-bold text-body-md mt-1">
                            {formatVND(item.product.price)}
                          </p>
                          {item.product.isAvailable === false && (
                            <span className="text-[10px] font-bold text-error bg-error-container/20 border border-error/10 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                              Hết hàng tại chi nhánh này
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => setConfirmRemoveItem(item)}
                            className="text-on-surface-variant hover:text-error transition-colors"
                            type="button"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <Icon className="w-5 h-5">delete</Icon>
                          </button>
                          <div className="flex items-center border border-outline rounded-lg overflow-hidden bg-surface">
                            <button
                              onClick={async () => {
                                if (item.quantity > 1) {
                                  try {
                                    await updateQuantity(item.itemId, item.quantity - 1)
                                  } catch (err: any) {
                                    alert(err.message)
                                  }
                                } else {
                                  setConfirmRemoveItem(item)
                                }
                              }}
                              className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high transition-colors font-bold"
                              type="button"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-label-lg font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={async () => {
                                try {
                                  await updateQuantity(item.itemId, item.quantity + 1)
                                } catch (err: any) {
                                  alert(err.message)
                                }
                              }}
                              className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high transition-colors font-bold"
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {cart && cart.items.length > 0 && (() => {
                const hasUnavailableItems = cart.items.some(item => item.product.isAvailable === false);
                return (
                  <div className="px-6 py-5 border-t border-outline-variant bg-surface-container-low space-y-4">
                    {hasUnavailableItems && (
                      <div className="bg-error-container/20 text-error p-3 rounded-xl flex items-start gap-2 text-xs font-bold border border-error/15 leading-relaxed">
                        <Icon className="text-sm shrink-0 mt-0.5">error</Icon>
                        <span>Giỏ hàng có sản phẩm hết hàng hoặc không đủ tồn kho tại chi nhánh này. Vui lòng gỡ bỏ để tiếp tục thanh toán.</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-body-lg font-bold">
                      <span>Tổng tiền</span>
                      <span className="text-primary text-headline-sm">{formatVND(cart.totalAmount)}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (!hasUnavailableItems) {
                          setIsCartOpen(false)
                          navigate('/checkout')
                        }
                      }}
                      disabled={hasUnavailableItems}
                      className={`w-full py-4 rounded-xl font-bold text-body-md transition-all flex items-center justify-center gap-2 shadow-lg ${
                        hasUnavailableItems
                          ? 'bg-outline-variant/40 text-on-surface-variant/40 cursor-not-allowed shadow-none'
                          : 'bg-primary hover:bg-on-primary-fixed-variant text-white cursor-pointer'
                      }`}
                      type="button"
                    >
                      Tiến hành thanh toán
                      <Icon>arrow_forward</Icon>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Branch Selection Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-on-surface">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant p-5 bg-surface-container-low">
              <div>
                <h3 className="text-lg font-black text-primary flex items-center gap-2">
                  <Icon className="text-primary">location_on</Icon>
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
                <Icon>close</Icon>
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-5 border-b border-outline-variant/30 bg-surface-container-lowest">
              <div className="relative">
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60">search</Icon>
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
                  <MapPin className="mx-auto mb-3 text-on-surface-variant/40" size={40} />
                  <p className="text-sm font-bold">Không tìm thấy chi nhánh nào</p>
                  <p className="text-xs mt-1">Vui lòng thử từ khóa khác.</p>
                </div>
              ) : (
                <>
                  {/* Option: Tất cả chi nhánh */}
                  <div
                    onClick={() => handleSelectBranch(ALL_BRANCH)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 mb-3 ${selectedBranch?._id === ''
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/40 hover:border-primary/30 hover:bg-surface-container-low'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${selectedBranch?._id === '' ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
                          }`}>
                          ALL
                        </span>
                        <h4 className="font-black text-sm truncate text-on-surface">Tất cả chi nhánh</h4>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                        Hiển thị sản phẩm từ tất cả chi nhánh thuộc hệ thống siêu thị PMAN-Mart
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedBranch?._id === '' ? 'border-primary bg-primary' : 'border-outline'
                      }`}>
                      {selectedBranch?._id === '' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {filteredBranches.map((branch) => {
                    const isSelected = selectedBranch?._id === branch._id
                    return (
                      <div
                        key={branch._id}
                        onClick={() => handleSelectBranch(branch)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 ${isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/40 hover:border-primary/30 hover:bg-surface-container-low'
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
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
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-outline'
                          }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear Cart Modal */}
      {confirmClearCart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col text-on-surface">
            <div className="p-5 flex items-center justify-between border-b border-outline-variant bg-error-container text-on-error-container">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Icon className="w-5 h-5">delete</Icon>
                Xóa giỏ hàng
              </h3>
              <button
                type="button"
                onClick={() => setConfirmClearCart(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
              >
                <Icon className="w-5 h-5">close</Icon>
              </button>
            </div>
            <div className="p-5 text-sm">
              <p className="mb-2">Bạn có chắc chắn muốn xóa tất cả sản phẩm ra khỏi giỏ hàng không?</p>
              <p className="text-xs text-error font-semibold mt-4">
                Lưu ý: Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmClearCart(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-surface hover:bg-surface-container-highest transition-colors cursor-pointer text-on-surface border border-outline-variant"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmClearCart(false)
                  try {
                    await clearCart()
                  } catch (err: any) {
                    alert(err.message)
                  }
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer flex items-center gap-2 shadow-sm bg-error hover:bg-error/90"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Item Modal */}
      {confirmRemoveItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col text-on-surface">
            <div className="p-5 flex items-center justify-between border-b border-outline-variant bg-error-container text-on-error-container">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Icon className="w-5 h-5">delete</Icon>
                Xóa sản phẩm
              </h3>
              <button
                type="button"
                onClick={() => setConfirmRemoveItem(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
              >
                <Icon className="w-5 h-5">close</Icon>
              </button>
            </div>
            <div className="p-5 text-sm">
              <p className="mb-2">Bạn có chắc chắn muốn xóa sản phẩm này ra khỏi giỏ hàng?</p>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3 mb-4 flex gap-3">
                <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center overflow-hidden">
                  <img
                    src={confirmRemoveItem.product.imageUrl || productImageMap[confirmRemoveItem.product.productName || confirmRemoveItem.product.name] || '/assets/winmart/tomatoes.png'}
                    alt={confirmRemoveItem.product.productName || confirmRemoveItem.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-on-surface">{confirmRemoveItem.product.productName || confirmRemoveItem.product.name}</p>
                  <p className="text-on-surface-variant text-xs mt-1">Số lượng: {confirmRemoveItem.quantity}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemoveItem(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-surface hover:bg-surface-container-highest transition-colors cursor-pointer text-on-surface border border-outline-variant"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  const itemId = confirmRemoveItem.itemId
                  setConfirmRemoveItem(null)
                  try {
                    await removeItem(itemId)
                  } catch (err: any) {
                    alert(err.message)
                  }
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer flex items-center gap-2 shadow-sm bg-error hover:bg-error/90"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
