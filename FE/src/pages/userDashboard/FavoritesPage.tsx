import { useState } from 'react'
import { Grid, Heart, List, ShoppingCart, Star, Trash2 } from 'lucide-react'

type Product = {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  inStock: boolean
  rating: number
  unit: string
}

const favorites: Product[] = [
  {
    id: '1',
    name: 'Fresh Organic Tomato',
    price: 1.2,
    originalPrice: 1.6,
    image: '/assets/winmart/tomatoes.png',
    inStock: true,
    rating: 4.8,
    unit: '500g / box',
  },
  {
    id: '2',
    name: 'Premium Ribeye Steak',
    price: 8.5,
    originalPrice: 10,
    image: '/assets/winmart/ribeye.png',
    inStock: true,
    rating: 4.9,
    unit: '300g / pack',
  },
  {
    id: '3',
    name: 'Organic Bunch Carrots',
    price: 2.45,
    image: '/assets/winmart/carrots.png',
    inStock: false,
    rating: 4.7,
    unit: '1 kg',
  },
]

export const FavoritesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Favorites</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
            Saved products
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {favorites.length} items saved for later.
          </p>
        </div>

        <div className="inline-flex w-fit rounded-lg bg-surface-container-low p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            aria-label="Grid view"
          >
            <Grid size={20} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-md p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            aria-label="List view"
          >
            <List size={20} />
          </button>
        </div>
      </section>

      <section
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
            : 'space-y-4'
        }
      >
        {favorites.map((product) => (
          <article
            key={product.id}
            className={`overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition-colors hover:border-primary/40 ${
              viewMode === 'list' ? 'grid grid-cols-[8rem_1fr] sm:grid-cols-[10rem_1fr]' : ''
            }`}
          >
            <div
              className={`relative bg-surface-container-low ${
                viewMode === 'grid' ? 'aspect-square' : 'h-full min-h-36'
              }`}
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-error shadow-sm transition-transform hover:scale-105"
                aria-label={`Remove ${product.name} from favorites`}
              >
                <Heart size={17} fill="currentColor" />
              </button>
              {!product.inStock ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <span className="rounded-full bg-error px-3 py-1 text-xs font-bold text-white">
                    Out of Stock
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-black text-on-surface">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-on-surface-variant">{product.unit}</p>
                </div>
                {viewMode === 'list' ? (
                  <button
                    type="button"
                    className="rounded-lg p-2 text-error transition-colors hover:bg-error-container"
                    aria-label={`Delete ${product.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-1 text-sm">
                <Star size={15} className="text-tertiary" fill="currentColor" />
                <span className="font-bold text-on-surface">{product.rating}</span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-black text-primary">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice ? (
                  <span className="text-sm text-on-surface-variant line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={!product.inStock}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart size={17} />
                  Add to Cart
                </button>
                {viewMode === 'grid' ? (
                  <button
                    type="button"
                    className="rounded-lg p-2.5 text-error transition-colors hover:bg-error-container"
                    aria-label={`Delete ${product.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>

      {favorites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest py-16 text-center">
          <Heart size={54} className="mx-auto mb-4 text-on-surface-variant" />
          <h3 className="text-lg font-black text-on-surface">No favorites yet</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Save products to compare and buy them later.
          </p>
        </div>
      ) : null}
    </div>
  )
}
