import { config } from 'dotenv'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server } from 'socket.io'
import { env } from 'process'
import { register } from './routes'

config()

const port: number = parseInt(env.PORT || '4000', 10)

const ok = function (req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200)
  res.end('PM Digital Twin Engine. Status: OK')
}

const server = createServer(ok)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
  },
})

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

register(io)
