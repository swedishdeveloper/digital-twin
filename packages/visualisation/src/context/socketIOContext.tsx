import { createContext, Context } from 'react'

type SocketType = {
  on: (event: string, callback: (...args: any[]) => void) => void
  emit: (event: string, ...args: any[]) => void
}

interface SocketContextType {
  socket: SocketType
}

const SocketIOContext: Context<SocketContextType> = createContext({
  socket: {
    on: () => {},
    emit: () => {},
  },
})

export { SocketIOContext }
