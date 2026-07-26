import { useState, useCallback } from 'react'

/**
 * Reads and updates a localStorage value while keeping React state synchronized.
 * This boundary owns its UI state and delegates persistence to the appropriate service layer.
 */
export const useLocalStorage = (key: string, initialValue?: string) => {
  const [storedValue, setStoredValue] = useState<string | null>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? item : initialValue || null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return initialValue || null
    }
  })

  const setValue = useCallback(
    (value: string | null) => {
      try {
        if (value === null) {
          window.localStorage.removeItem(key)
          setStoredValue(null)
        } else {
          window.localStorage.setItem(key, value)
          setStoredValue(value)
        }
      } catch (error) {
        console.error('Error writing to localStorage:', error)
      }
    },
    [key],
  )

  return [storedValue, setValue] as const
}
/**
 * Custom React hook that encapsulates reusable stateful client behavior.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
