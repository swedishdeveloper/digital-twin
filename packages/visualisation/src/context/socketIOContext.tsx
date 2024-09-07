import { createContext, Context } from 'react'
import { Socket } from 'socket.io-client'

const SocketIOContext: Context<Socket | null> = createContext<Socket | null>(
  null
)

export { SocketIOContext }
