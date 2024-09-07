import { emit } from 'process'
import { createContext } from 'react'

const SocketIOContext = createContext({
  socket: {
    on: () => {
      throw new Error('SocketIOContext not found')
    },
    emit: () => {
      throw new Error('SocketIOContext not found')
    },
  },
})

export { SocketIOContext }
