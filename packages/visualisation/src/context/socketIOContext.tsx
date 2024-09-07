import { createContext, Context } from 'react'
import { Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket
}

const SocketIOContext: Context<SocketContextType> = createContext({
  socket: {
    on: () => {},
    emit: () => {},
  } as unknown as Socket,
})

export { SocketIOContext }
