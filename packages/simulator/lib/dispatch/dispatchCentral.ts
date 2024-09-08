import { mergeAll, from, Observable } from 'rxjs'
import {
  tap,
  filter,
  delay,
  mergeMap,
  catchError,
  bufferTime,
  retryWhen,
  toArray,
} from 'rxjs/operators'
import { info, error, warn, debug } from '../log'
import { clusterBookings } from '../kmeans'
import Vehicle from '../../models/vehicles/Vehicle'
import Booking from '../../models/Booking'

const dispatch = (
  cars: Observable<Vehicle>,
  bookings: Observable<Booking>
): Observable<Booking> => {
  return cars.pipe(
    toArray<Vehicle>(),
    tap((cars) => info(`🚚 Dispatch ${cars.length} vehicles`)),
    tap((cars) => {
      if (!cars.length) {
        warn('Fleet has no cars, dispatch is not possible.')
      }
    }),
    filter((cars) => cars.length > 0), // TODO: Move this check to the caller.
    tap((cars) => {
      const fleet = cars[0].fleet.name
      info(`🚚 Dispatch ${cars.length} vehicles in ${fleet}`)
    }),
    mergeMap((cars) =>
      bookings.pipe(
        filter((booking) => !booking.car),
        bufferTime(5000, null, 300),
        filter((b) => b.length > 0),
        //mergeMap((bookings) => getVroomPlan(cars, bookings)),
        mergeMap(async (bookings) => {
          info(
            `Clustering ${bookings.length} bookings into ${cars.length} cars`
          )
          const clusters = await clusterBookings(bookings, cars.length)
          return clusters.map(({ bookings }, i: number) => ({
            car: cars[i],
            bookings,
          }))
        }),
        mergeAll(),
        filter(({ bookings }) => bookings.length > 0),
        tap(({ car, bookings }) =>
          debug(
            `Plan ${car.id} (${car.fleet.name}) received ${bookings.length} bookings`
          )
        ),
        mergeMap(({ car, bookings }) =>
          from(bookings).pipe(
            mergeMap((booking) => car.handleBooking(booking), 1)
          )
        ),
        // tap((bookings) => info('dispatched', bookings)),
        retryWhen((errors: Observable<any>) =>
          errors.pipe(
            tap((err: any) => error('dispatch error, retrying in 1s...', err)),
            delay(1000)
          )
        )
      )
    ),
    catchError((err: any, caught) => {
      error('dispatchCentral -> dispatch', err)
      return caught
    })
  )
}

export { dispatch }
