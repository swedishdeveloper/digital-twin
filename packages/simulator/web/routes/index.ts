import { Server } from 'socket.io'

import { register as registerBookings } from './bookings'
import { register as registerBuses } from './buses'
import { register as registerCars } from './cars'
import { register as registerMunicipalities } from './municipalities'

export function register(io: Server): void {
  registerBookings(io)
  registerBuses(io)
  registerCars(io)
  registerMunicipalities(io)
}
