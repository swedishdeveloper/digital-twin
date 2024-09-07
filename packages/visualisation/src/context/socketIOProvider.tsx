import React, { useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { SocketIOContext } from './socketIOContext'

export const SocketIOProvider = ({ url, opts, children }) => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !socketRef.current) {
      socketRef.current = io(url, opts || {})

      return () => {
        socketRef?.current?.disconnect() // Cleanup socket connection on unmount
      }
    }
  }, [url, opts])

  return (
    <SocketIOContext.Provider value={socketRef.current}>
      {children}
    </SocketIOContext.Provider>
  )
}
