import { useContext, useEffect, useRef } from 'react'
import { SocketIOContext } from '../context/socketIOContext'

type Callback = (...args: any[]) => void

export const useSocket = (eventKey: string, callback: Callback) => {
  const socket = useContext(SocketIOContext)
  const callbackRef = useRef<Callback>(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const socketHandlerRef = useRef<Callback>(function (...args: any[]) {
    if (callbackRef.current) {
      callbackRef.current.apply(this, args)
    }
  })

  useEffect(() => {
    const subscribe = () => {
      if (eventKey) {
        socket.on(eventKey, socketHandlerRef.current)
      }
    }

    const unsubscribe = () => {
      if (eventKey) {
        socket.removeListener(eventKey, socketHandlerRef.current)
      }
    }

    subscribe()

    return unsubscribe
  }, [eventKey, socket])

  return { socket }
}
