import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartService } from '@services/cartService'
import type { CartResponse } from '@/types'
import { useSocket } from './SocketContext'

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

  const { socket } = useSocket()

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

  // Lắng nghe thay đổi tồn kho thời gian thực để cập nhật giỏ hàng
  useEffect(() => {
    if (!socket) return

    const handleInventoryUpdated = (data: { branchId: string; productId: string; quantity: number }) => {
      console.log('Realtime inventory update received in cart:', data)
      
      let currentBranchId: string | undefined
      const savedBranchStr = localStorage.getItem('selectedBranch')
      if (savedBranchStr) {
        try {
          const branch = JSON.parse(savedBranchStr)
          currentBranchId = branch._id
        } catch {}
      }

      if (currentBranchId && currentBranchId === data.branchId) {
        setCart((prevCart) => {
          if (!prevCart) return null

          let cartChanged = false
          const updatedItems = prevCart.items.map((item) => {
            const itemProdId = item.product.id
            if (itemProdId === data.productId) {
              if (item.quantity > data.quantity) {
                cartChanged = true
                
                const prodName = item.product.name
                import('../utils/toast').then(({ notify }) => {
                  notify.error(
                    `Sản phẩm "${prodName}" chỉ còn ${data.quantity} sản phẩm trong kho. Giỏ hàng đã tự động cập nhật!`
                  )
                })
                
                return {
                  ...item,
                  quantity: data.quantity,
                  subtotal: data.quantity * (item.product.price ?? 0),
                }
              }
            }
            return item
          })

          if (cartChanged) {
            const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
            const totalAmount = updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
            
            const changedItem = updatedItems.find(
              (item, idx) => item.quantity !== prevCart.items[idx].quantity
            )
            if (changedItem) {
              cartService.updateItem(changedItem.itemId, changedItem.quantity, currentBranchId).catch(console.error)
            }

            return {
              ...prevCart,
              items: updatedItems,
              totalItems,
              totalAmount,
            }
          }

          return prevCart
        })
      }
    }

    socket.on('inventory:updated', handleInventoryUpdated)

    return () => {
      socket.off('inventory:updated', handleInventoryUpdated)
    }
  }, [socket])

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
