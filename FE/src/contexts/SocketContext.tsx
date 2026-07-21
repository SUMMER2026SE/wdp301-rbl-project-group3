import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@hooks/useAuth'

interface SocketContextProps {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  connected: false,
})

export const useSocket = () => useContext(SocketContext)

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Kết nối tới Socket.io server thông qua Vite proxy
    const socketInstance = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
    })

    socketInstance.on('connect', () => {
      console.log('Socket.io connected:', socketInstance.id)
      setConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket.io disconnected')
      setConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Tham gia vào các phòng phân quyền/phòng cá nhân khi thông tin User thay đổi
  useEffect(() => {
    if (!socket || !connected) return

    if (user) {
      // Phòng cá nhân
      socket.emit('join', `customer:${user.id}`)
      console.log(`Socket joined customer room: customer:${user.id}`)

      // Phòng phân quyền
      socket.emit('join', `role:${user.role}`)
      console.log(`Socket joined role room: role:${user.role}`)

      // Phòng chi nhánh
      if (user.branchId) {
        socket.emit('join', `branch:${user.branchId}`)
        console.log(`Socket joined branch room: branch:${user.branchId}`)
      }
    }

    return () => {
      if (user) {
        socket.emit('leave', `customer:${user.id}`)
        socket.emit('leave', `role:${user.role}`)
        if (user.branchId) {
          socket.emit('leave', `branch:${user.branchId}`)
        }
      }
    }
  }, [socket, connected, user])

  // Lắng nghe trạng thái bảo trì thời gian thực
  useEffect(() => {
    if (!socket) return

    socket.on('maintenance:updated', (data: { enabled: boolean }) => {
      console.log('Realtime maintenance status updated:', data.enabled)
      if (data.enabled) {
        if (window.location.pathname !== '/maintenance') {
          window.location.href = '/maintenance'
        }
      } else {
        if (window.location.pathname === '/maintenance') {
          window.location.href = '/'
        }
      }
    })

    return () => {
      socket.off('maintenance:updated')
    }
  }, [socket])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}
