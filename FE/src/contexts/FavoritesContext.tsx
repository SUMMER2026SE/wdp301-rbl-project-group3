import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { favoriteService } from '@services/favoriteService'
import type { Product } from '@/types'
import { useAuth } from '@hooks/useAuth'
import toast from 'react-hot-toast'

interface FavoritesContextType {
  favorites: Product[]
  loading: boolean
  error: string | null
  addToFavorites: (productId: string) => Promise<void>
  removeFromFavorites: (productId: string) => Promise<void>
  isFavorite: (productId: string) => boolean
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

/**
 * Maintains the current user's favorite products and exposes mutation helpers.
 * This boundary owns its UI state and delegates persistence to the appropriate service layer.
 */
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refreshFavorites = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token || !isAuthenticated) {
      setFavorites([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await favoriteService.getFavorites()
      if (response.success && response.data) {
        setFavorites(response.data)
      } else {
        setError(response.message || 'Failed to fetch favorites')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch favorites')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshFavorites()
  }, [refreshFavorites])

  const isFavorite = useCallback((productId: string) => {
    return favorites.some((fav) => fav._id === productId)
  }, [favorites])

  const addToFavorites = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu sản phẩm yêu thích!')
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await favoriteService.addToFavorites(productId)
      if (response.success) {
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích!')
        await refreshFavorites()
      } else {
        setError(response.message || 'Failed to add item to favorites')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add item to favorites'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, refreshFavorites])

  const removeFromFavorites = useCallback(async (productId: string) => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      setError(null)
      const response = await favoriteService.removeFromFavorites(productId)
      if (response.success) {
        toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích!')
        await refreshFavorites()
      } else {
        setError(response.message || 'Failed to remove item')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove item'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, refreshFavorites])

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        error,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

/**
 * Returns the favorites context for pages and reusable product UI.
 * This boundary owns its UI state and delegates persistence to the appropriate service layer.
 */
export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
/**
 * Provides shared client state and side effects to descendant React components.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
