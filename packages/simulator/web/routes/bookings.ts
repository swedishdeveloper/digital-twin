import { pipe, map, bufferTime, filter } from 'rxjs'
import { Socket } from 'socket.io'
import { Experiment } from '../../../../types/Experiment'

const cleanBookings = () =>
  // TODO: Replace cleanBookings with .toObject() on Booking
  pipe(
    map(
      ({
        pickup,
        destination,
        assigned,
        id,
        status,
        isCommercial,
        co2,
        cost,
        deliveryTime,
        car,
        type,
      }) => ({
        id,
        pickup: pickup.position,
        assigned,
        destination: destination.position,
        status,
        isCommercial,
        deliveryTime,
        co2,
        cost,
        carId: car?.id,
        type,
      })
    )
  )

const register = (experiment: Experiment, socket: Socket): void => {
  return [
    experiment.dispatchedBookings
      .pipe(
        cleanBookings(),
        bufferTime(100, null, 1000),
        filter((e) => e.length)
      )
      .subscribe((bookings) => {
        socket.emit('bookings', bookings)
      }),

    experiment.bookingUpdates
      .pipe(
        cleanBookings(),
        bufferTime(100, null, 1000),
        filter((e) => e.length)
      )
      .subscribe((bookings) => {
        socket.emit('bookings', bookings)
      }),
  ]
}

export { register }
