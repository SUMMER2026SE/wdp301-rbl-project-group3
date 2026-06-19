import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useCart } from '@/contexts/CartContext'
import { productService } from '@services/productService'
import type { Product } from '@/types'
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
  LogOut,
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

type FlashSaleProduct = {
  discount: string
  image: string
  alt: string
  title: string
  unit: string
  price: string
  originalPrice: string
}

type RecommendedProduct = {
  image: string
  alt: string
  rating: string
  reviews: string
  title: string
  unit: string
  price: string
  hasFavorite?: boolean
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
}

const categories: Category[] = [
  { icon: 'eco', label: 'Fruits & Vegetables', active: true },
  { icon: 'restaurant', label: 'Fresh Meat & Seafood' },
  { icon: 'egg', label: 'Dairy & Eggs' },
  { icon: 'local_drink', label: 'Beverages' },
  { icon: 'bakery_dining', label: 'Snacks & Bakery' },
  { icon: 'outdoor_grill', label: 'Cooking Essentials' },
]

const flashSaleProducts: FlashSaleProduct[] = [
  {
    discount: '-25%',
    image: '/assets/winmart/tomatoes.png',
    alt: 'Fresh organic tomatoes on the vine',
    title: 'Fresh Organic Tomato',
    unit: '500g / box',
    price: '$1.20',
    originalPrice: '$1.60',
  },
  {
    discount: '-15%',
    image: '/assets/winmart/ribeye.png',
    alt: 'Premium ribeye steak with rosemary',
    title: 'Premium Ribeye Steak',
    unit: '300g / pack',
    price: '$8.50',
    originalPrice: '$10.00',
  },
  {
    discount: '-40%',
    image: '/assets/winmart/berries.png',
    alt: 'Mixed berry bowl',
    title: 'Mixed Berry Bowl',
    unit: '250g / box',
    price: '$4.20',
    originalPrice: '$7.00',
  },
  {
    discount: '-10%',
    image: '/assets/winmart/milk.png',
    alt: 'Whole organic milk bottle',
    title: 'Whole Organic Milk',
    unit: '1L / bottle',
    price: '$2.10',
    originalPrice: '$2.35',
  },
  {
    discount: '-20%',
    image: '/assets/winmart/sourdough.png',
    alt: 'Artisan sourdough loaf',
    title: 'Artisan Sourdough',
    unit: '450g / loaf',
    price: '$3.60',
    originalPrice: '$4.50',
  },
]

const recommendedProducts: RecommendedProduct[] = [
  {
    image: '/assets/winmart/carrots.png',
    alt: 'Organic carrots with green tops',
    rating: '4.8',
    reviews: '120',
    title: 'Organic Bunch Carrots',
    unit: '/ kg',
    price: '$2.45',
    hasFavorite: true,
  },
  {
    image: '/assets/winmart/sparkling-water.png',
    alt: 'Sparkling water bottle on ice',
    rating: '4.9',
    reviews: '85',
    title: 'Pure Alpine Sparkle',
    unit: '750ml / bottle',
    price: '$1.99',
  },
  {
    image: '/assets/winmart/asparagus.png',
    alt: 'Fresh green asparagus bunch',
    rating: '4.7',
    reviews: '240',
    title: 'Young Green Asparagus',
    unit: '250g / bunch',
    price: '$3.50',
  },
  {
    image: '/assets/winmart/greek-yogurt.png',
    alt: 'Greek yogurt with honey and walnuts',
    rating: '4.9',
    reviews: '310',
    title: 'Velvet Greek Yogurt',
    unit: '500g / tub',
    price: '$4.15',
  },
  {
    image: '/assets/winmart/sea-bass.png',
    alt: 'Fresh whole sea bass on ice',
    rating: '5.0',
    reviews: '42',
    title: 'Fresh Whole Sea Bass',
    unit: '/ kg',
    price: '$12.50',
  },
]

const filterTabs = ['All', 'Fresh Food', 'Drinks', 'Snacks']

const heroImage = '/assets/winmart/hero-market.png'

const citrusImage = '/assets/winmart/citrus.png'

const bbqImage = '/assets/winmart/bbq.png'


const getCountdownTime = (): CountdownTime => {
  const now = new Date()
  const hours = 23 - now.getHours()
  const minutes = 59 - now.getMinutes()
  const seconds = 59 - now.getSeconds()

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

const FlashSaleCard = ({ product, onAddToCart }: { product: FlashSaleProduct; onAddToCart?: () => void }) => (
  <article className="bg-surface-container-lowest rounded-xl p-4 soft-lift group hover:scale-[0.98] transition-all cursor-pointer relative border border-transparent hover:border-primary/20">
    <div className="absolute top-2 left-2 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-1 rounded-full z-10">
      {product.discount}
    </div>
    <div className="aspect-square bg-surface-container-low rounded-lg mb-4 overflow-hidden">
      <img
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        src={product.image}
        alt={product.alt}
      />
    </div>
    <h3 className="font-label-lg text-label-lg mb-1 truncate">{product.title}</h3>
    <p className="text-[12px] text-on-surface-variant mb-3">{product.unit}</p>
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-secondary font-bold text-headline-sm">{product.price}</span>
        <span className="text-[10px] line-through text-on-surface-variant opacity-60">
          {product.originalPrice}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onAddToCart?.()
        }}
        className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center beveled-btn hover:bg-primary hover:text-white transition-colors"
        type="button"
        aria-label={`Add ${product.title} to cart`}
      >
        <Icon>add_shopping_cart</Icon>
      </button>
    </div>
  </article>
)

const RecommendedCard = ({ product, onAddToCart }: { product: RecommendedProduct; onAddToCart?: () => void }) => (
  <article className="bg-surface-container-lowest rounded-xl p-4 soft-lift border border-transparent hover:border-primary/20 group transition-all">
    <div className="aspect-square bg-surface-container-low rounded-lg mb-4 relative overflow-hidden">
      <img className="w-full h-full object-cover" src={product.image} alt={product.alt} />
      {product.hasFavorite ? (
        <button
          className="absolute bottom-2 right-2 bg-white/90 p-2 rounded-full shadow-md text-primary opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
          type="button"
          aria-label={`Favorite ${product.title}`}
        >
          <Icon>favorite</Icon>
        </button>
      ) : null}
    </div>
    <div className="flex items-center gap-1 mb-1">
      <Icon className="text-tertiary w-[14px] h-[14px]" filled>
        star
      </Icon>
      <span className="text-[12px] font-bold">{product.rating}</span>
      <span className="text-[12px] text-on-surface-variant opacity-60">({product.reviews})</span>
    </div>
    <h3 className="font-label-lg text-label-lg mb-1 truncate">{product.title}</h3>
    <p className="text-[12px] text-on-surface-variant mb-4">{product.unit}</p>
    <div className="flex justify-between items-center">
      <span className="text-primary font-bold text-headline-sm">{product.price}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onAddToCart?.()
        }}
        className="flex items-center justify-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-[12px] font-bold beveled-btn hover:bg-primary-container transition-all"
        type="button"
        aria-label={`Add ${product.title} to cart`}
      >
        <Icon className="w-[18px] h-[18px]">add</Icon> Add
      </button>
    </div>
  </article>
)

export const HomePage = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { cart, addToCart, updateQuantity, removeItem, clearCart } = useCart()
  const [countdown, setCountdown] = useState<CountdownTime>(() => getCountdownTime())
  const heroImageRef = useRef<HTMLImageElement | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [dbProducts, setDbProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const res = await productService.getProducts()
        if (res.success) {
          setDbProducts(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch products:', err)
      }
    }
    fetchDbProducts()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdown(getCountdownTime())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

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
            <Icon className="w-[18px] h-[18px]">phone</Icon> Hotline: 1-800-FRESH
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
            <h1 className="font-headline-lg text-headline-lg font-black text-primary">PMAN-Mart</h1>
            <div className="hidden xl:flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                Deliver from
              </span>
              <div className="flex items-center text-primary font-bold cursor-pointer">
                <span className="text-body-md">PMAN-Mart Nguyen Hue</span>
                <Icon>expand_more</Icon>
              </div>
            </div>
          </div>

          <div className="order-3 w-full md:order-none md:flex-1 md:max-w-2xl relative group">
            <input
              className="w-full bg-surface-container-low border-none rounded-full py-3 px-6 pl-12 focus:ring-2 focus:ring-primary transition-all"
              placeholder="What are you looking for today?"
              type="text"
              aria-label="Search products"
            />
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </Icon>
          </div>

          <div className="ml-auto hidden sm:flex items-center gap-3 md:gap-6">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 cursor-pointer group"
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
                  <span className="font-label-lg text-label-lg hidden lg:block">
                    {user.fullName}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-lg shadow-xl py-2 z-50">
                    <button
                      onClick={() => {
                        navigate('/dashboard')
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-surface-container-low transition-colors flex items-center gap-2"
                    >
                      <Icon>dashboard</Icon>
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        navigate('/dashboard/profile')
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-surface-container-low transition-colors flex items-center gap-2"
                    >
                      <Icon>person</Icon>
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left hover:bg-surface-container-low transition-colors flex items-center gap-2 text-error"
                    >
                      <LogOut size={20} />
                      Logout
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
        <section className="grid grid-cols-12 gap-gutter-md">
          <aside className="col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-inset-card hidden lg:flex flex-col gap-2">
            <div className="mb-2 px-2">
              <h2 className="font-headline-sm text-headline-sm text-primary">Categories</h2>
              <p className="text-label-md text-on-surface-variant">Shop by Department</p>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Product categories">
              {categories.map((category) => (
                <a
                  key={category.label}
                  className={
                    category.active
                      ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-bold transition-all scale-[0.98]'
                      : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-primary-container/10 hover:text-primary transition-all'
                  }
                  href="/"
                >
                  <Icon className="w-5 h-5">{category.icon}</Icon>
                  {category.label}
                </a>
              ))}
            </nav>
          </aside>

          <section
            className="col-span-12 lg:col-span-9 min-w-0 relative overflow-hidden rounded-xl h-[520px] sm:h-[460px] lg:h-[420px] bg-primary group"
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
          >
            <img
              ref={heroImageRef}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80 transition-transform duration-700 group-hover:scale-105"
              src={heroImage}
              alt="Premium organic supermarket aisle with fresh produce"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center px-6 md:px-12 text-white">
              <span className="bg-secondary text-white font-bold px-4 py-1 rounded-full w-fit mb-4 text-label-lg animate-bounce">
                Exclusive Offer
              </span>
              <h2 className="font-headline-lg text-[36px] sm:text-[40px] md:text-[48px] leading-tight mb-4 max-w-[11ch] sm:max-w-none">
                Fresh Food Festival
                <br />
                <span className="text-primary-fixed">Up to 30% OFF</span>
              </h2>
              <p className="text-body-lg mb-8 opacity-90 max-w-[280px] sm:max-w-sm md:max-w-none">
                Experience the peak of season&apos;s harvest with our premium organic selection.
                <br />
                Use code: <span className="font-bold border-b-2 border-primary-fixed">FRESH2026</span>
              </p>
              <button
                className="beveled-btn bg-primary-container hover:bg-primary text-on-primary-container hover:text-white px-8 py-4 rounded-xl font-bold w-fit transition-all flex items-center gap-2 group-hover:translate-x-2"
                type="button"
              >
                Shop Now <Icon>arrow_forward</Icon>
              </button>
            </div>
          </section>
        </section>

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
            {flashSaleProducts.map((product) => {
              const dbProduct = dbProducts.find((p) => p.productName === product.title)
              return (
                <FlashSaleCard
                  key={product.title}
                  product={product}
                  onAddToCart={async () => {
                    if (!isAuthenticated) {
                      navigate('/login')
                      return
                    }
                    if (dbProduct) {
                      try {
                        await addToCart(dbProduct._id, 1)
                      } catch (err: any) {
                        alert(err.message || 'Failed to add to cart')
                      }
                    } else {
                      alert('Product not available in database!')
                    }
                  }}
                />
              )
            })}
          </div>
        </section>

        <section className="mt-stack-lg grid grid-cols-1 md:grid-cols-3 gap-gutter-md h-auto md:h-[400px]">
          <div className="col-span-1 min-h-[260px] rounded-xl bg-[#FEE2E2] relative overflow-hidden group">
            <div className="p-8 z-10 relative">
              <h3 className="text-secondary font-black text-headline-md mb-2">BOGO SPECIAL</h3>
              <p className="text-on-surface-variant font-bold mb-4">
                Buy 1 Get 1 Free on all Citrus Fruits
              </p>
              <button
                className="text-secondary border-2 border-secondary px-4 py-2 rounded-lg font-bold hover:bg-secondary hover:text-white transition-all"
                type="button"
              >
                Claim Now
              </button>
            </div>
            <img
              className="absolute bottom-0 right-0 w-2/3 object-contain opacity-40 group-hover:scale-110 transition-transform duration-500"
              src={citrusImage}
              alt="Sliced oranges and lemons"
            />
          </div>

          <div className="col-span-1 md:col-span-2 min-h-[260px] rounded-xl bg-[#E0F2FE] relative overflow-hidden group">
            <div className="p-8 z-10 relative flex flex-col justify-center h-full max-w-sm">
              <h3 className="text-primary font-black text-headline-md mb-2">BBQ SEASON READY</h3>
              <p className="text-on-surface-variant font-bold mb-4">
                Get the best marinated meats and grilling gear for your next weekend party.
              </p>
              <button
                className="bg-primary text-white px-6 py-3 rounded-lg font-bold beveled-btn hover:scale-105 transition-all w-fit"
                type="button"
              >
                Browse Gear
              </button>
            </div>
            <img
              className="absolute top-0 right-0 h-full w-1/2 object-cover mix-blend-multiply opacity-60 group-hover:scale-105 transition-transform duration-700"
              src={bbqImage}
              alt="Outdoor grill with skewers and steaks"
            />
          </div>
        </section>

        <section className="mt-stack-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="font-headline-md text-headline-md">Recommended for You</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filterTabs.map((tab, index) => (
                <button
                  key={tab}
                  className={
                    index === 0
                      ? 'px-6 py-2 rounded-full bg-primary text-white font-bold text-label-lg transition-all'
                      : 'px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-label-lg hover:bg-primary-container/20 hover:text-primary transition-all'
                  }
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-gutter-md">
            {recommendedProducts.map((product) => {
              const dbProduct = dbProducts.find((p) => p.productName === product.title)
              return (
                <RecommendedCard
                  key={product.title}
                  product={product}
                  onAddToCart={async () => {
                    if (!isAuthenticated) {
                      navigate('/login')
                      return
                    }
                    if (dbProduct) {
                      try {
                        await addToCart(dbProduct._id, 1)
                      } catch (err: any) {
                        alert(err.message || 'Failed to add to cart')
                      }
                    } else {
                      alert('Product not available in database!')
                    }
                  }}
                />
              )
            })}
          </div>
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
                const image = productImageMap[item.product.name] || '/assets/winmart/tomatoes.png'
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
                Estimated Total: <span className="text-primary font-bold">${cart.totalAmount.toFixed(2)}</span>
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
            <h2 className="font-headline-md text-headline-md font-bold text-primary">PMAN-Mart</h2>
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
            <h3 className="font-label-lg text-label-lg text-on-surface mb-4">About PMAN-Mart</h3>
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
          <span>&copy; 2026 PMAN-Mart Premium. All rights reserved.</span>
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
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to clear your cart?')) {
                          try {
                            await clearCart()
                          } catch (err: any) {
                            alert(err.message)
                          }
                        }
                      }}
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
                    <p className="font-bold text-body-lg">Your cart is empty</p>
                    <p className="text-body-md">Add items to start shopping!</p>
                  </div>
                ) : (
                  cart.items.map((item) => {
                    const image = productImageMap[item.product.name] || '/assets/winmart/tomatoes.png'
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
                            ${item.product.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await removeItem(item.itemId)
                              } catch (err: any) {
                                alert(err.message)
                              }
                            }}
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
                                  try {
                                    await removeItem(item.itemId)
                                  } catch (err: any) {
                                    alert(err.message)
                                  }
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
              {cart && cart.items.length > 0 && (
                <div className="px-6 py-5 border-t border-outline-variant bg-surface-container-low space-y-4">
                  <div className="flex justify-between items-center text-body-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary text-headline-sm">${cart.totalAmount.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false)
                      navigate('/checkout')
                    }}
                    className="w-full bg-primary hover:bg-on-primary-fixed-variant text-white py-4 rounded-xl font-bold text-body-md transition-all flex items-center justify-center gap-2 shadow-lg"
                    type="button"
                  >
                    Proceed to Checkout
                    <Icon>arrow_forward</Icon>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
