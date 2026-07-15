import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartService } from '@services/cartService'
import type { CartResponse } from '@/types'

interface CartContextType {
  cart: CartResponse | null
  loading: boolean
  error: string | null
  addToCart: (productId: string, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setCart(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Get branchId from localStorage
      let branchId: string | undefined
      const savedBranchStr = localStorage.getItem('selectedBranch')
      if (savedBranchStr) {
        try {
          const branch = JSON.parse(savedBranchStr)
          branchId = branch._id
        } catch (e) {
          console.error('Failed to parse selectedBranch:', e)
        }
      }
      
      const response = await cartService.getCart(branchId)
      if (response.success) {
        setCart(response.data)
      } else {
        setError(response.message || 'Failed to fetch cart')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch cart')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch cart initially if token exists
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addToCart = useCallback(async (productId: string, quantity: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Get branchId from localStorage
      let branchId: string | undefined
      const savedBranchStr = localStorage.getItem('selectedBranch')
      if (savedBranchStr) {
        try {
          const branch = JSON.parse(savedBranchStr)
          branchId = branch._id
        } catch (e) {
          console.error('Failed to parse selectedBranch:', e)
        }
      }
      
      const response = await cartService.addToCart(productId, quantity, branchId)
      if (response.success) {
        setCart(response.data)
      } else {
        setError(response.message || 'Failed to add item to cart')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add item to cart'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Get branchId from localStorage
      let branchId: string | undefined
      const savedBranchStr = localStorage.getItem('selectedBranch')
      if (savedBranchStr) {
        try {
          const branch = JSON.parse(savedBranchStr)
          branchId = branch._id
        } catch (e) {
          console.error('Failed to parse selectedBranch:', e)
        }
      }
      
      const response = await cartService.updateItem(itemId, quantity, branchId)
      if (response.success) {
        setCart(response.data)
      } else {
        setError(response.message || 'Failed to update item quantity')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update item quantity'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Get branchId from localStorage
      let branchId: string | undefined
      const savedBranchStr = localStorage.getItem('selectedBranch')
      if (savedBranchStr) {
        try {
          const branch = JSON.parse(savedBranchStr)
          branchId = branch._id
        } catch (e) {
          console.error('Failed to parse selectedBranch:', e)
        }
      }
      
      const response = await cartService.removeItem(itemId, branchId)
      if (response.success) {
        setCart(response.data)
      } else {
        setError(response.message || 'Failed to remove item')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove item'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await cartService.clearCart()
      if (response.success) {
        setCart({ cartId: '', items: [], totalItems: 0, totalAmount: 0 })
      } else {
        setError(response.message || 'Failed to clear cart')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to clear cart'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
