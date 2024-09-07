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
import { clusterPositions } from '../kmeans'
import Vehicle from '../../models/vehicle'
import Booking from '../../models/Booking'

const dispatch = (
  cars: Observable<Vehicle>,
  bookings: Observable<Booking>
): Observable<void> => {
  return cars.pipe(
    toArray(),
    tap((cars: Vehicle[]) => info(`🚚 Dispatch ${cars.length} vehicles`)),
    tap((cars: Vehicle[]) => {
      if (!cars.length) {
        warn('Fleet has no cars, dispatch is not possible.')
      }
    }),
    filter((cars: Vehicle[]) => cars.length > 0), // TODO: Move this check to the caller.
    tap((cars: Vehicle[]) => {
      const fleet = cars[0].fleet.name
      info(`🚚 Dispatch ${cars.length} vehicles in ${fleet}`)
    }),
    filter((cars) => cars.length > 0),
    mergeMap((cars: Vehicle[]) =>
      bookings.pipe(
        filter((booking: Booking) => !booking.car),
        bufferTime(5000, null, 300),
        filter((b) => b.length > 0),
        //mergeMap((bookings) => getVroomPlan(cars, bookings)),
        mergeMap(async (bookings: Booking[]) => {
          if (bookings.length < cars.length) {
            return [
              {
                car: cars[0],
                bookings,
              },
            ]
          }

          info(
            `Clustering ${bookings.length} bookings into ${cars.length} cars`
          )
          const clusters = await clusterPositions(bookings, cars.length)
          return clusters.map(
            ({ items: bookings }: { items: Booking[] }, i: number) => ({
              car: cars[i],
              bookings,
            })
          )
        }),
        catchError((err: any, caught) => {
          error('cluster err', err)
          return caught
        }),
        mergeAll(),
        filter(({ bookings }: { bookings: Booking[] }) => bookings.length > 0),
        tap(({ car, bookings }: { car: Car; bookings: Booking[] }) =>
          debug(
            `Plan ${car.id} (${car.fleet.name}) received ${bookings.length} bookings`
          )
        ),
        mergeMap(({ car, bookings }: { car: Car; bookings: Booking[] }) =>
          from(bookings).pipe(
            mergeMap((booking: Booking) => car.handleBooking(booking), 1)
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
