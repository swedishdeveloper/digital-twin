import {
  Subject,
  range,
  from,
  merge,
  of,
  firstValueFrom,
  Observable,
} from 'rxjs'
import { shareReplay, mergeMap, share, catchError, first } from 'rxjs/operators'
import { FleetConstructorArgs } from './FleetTypes'
import RecycleTruck from './vehicles/RecycleTruck'
import Municipality from './Municipality'
import Position from './Position'
import Vehicle from './vehicles/Vehicle'
import Booking from './Booking'

const vehicleTypes = {
  recycleTruck: {
    weight: 10 * 1000,
    parcelCapacity: 500,
    class: RecycleTruck,
  },
  taxi: {
    weight: 1000,
    parcelCapacity: 0,
    passengerCapacity: 4,
    class: Taxi,
  },
}

class Fleet {
  name: string
  type: string
  marketshare: number
  municipality: Municipality
  hubAddress?: string
  hub: { position: Position }
  cars: Observable<Vehicle>

  unhandledBookings: Subject<Booking>
  manualDispatchedBookings: Subject<Booking>
  dispatchedBookings: Observable<Booking>

  constructor({
    name,
    marketshare,
    vehicles,
    hub,
    type,
    municipality,
  }: FleetConstructorArgs) {
    this.name = name
    this.type = type
    this.marketshare = marketshare
    this.hub = { position: new Position(hub) }

    this.municipality = municipality
    this.cars = from(Object.entries(vehicles)).pipe(
      mergeMap(([type, count]) =>
        range(0, count).pipe(
          mergeMap(() => {
            const Vehicle = vehicleTypes[type].class

            return of(
              new Vehicle({
                ...vehicleTypes[type],
                fleet: this,
                position: this.hub.position,
              })
            )
          }),
          catchError(async (err) =>
            error(`Error vehicle for fleet ${name}`, err)
          )
        )
      ),
      shareReplay()
    )
    this.unhandledBookings = new Subject<Booking>()
    this.manualDispatchedBookings = new Subject<Booking>()
    this.dispatchedBookings = merge(
      this.manualDispatchedBookings,
      dispatch(this.cars, this.unhandledBookings)
    ).pipe(share())
  }

  async canHandleBooking(booking) {
    debug(`🚗 Fleet ${this.name} checking booking ${booking.id}`)
    return firstValueFrom(
      this.cars.pipe(
        first((car) => car.canHandleBooking(booking), false /* defaultValue */)
        // TODO: handle case when all cars are busy or full?
      )
    )
  }

  async handleBooking(booking, car) {
    booking.fleet = this
    if (car) {
      debug(`📦 Dispatching ${booking.id} to ${this.name} (manual)`)
      this.manualDispatchedBookings.next(booking)
      return await car.handleBooking(booking)
    } else {
      debug(`📦 Dispatching ${booking.id} to ${this.name}`)
      this.unhandledBookings.next(booking)
    }
    return booking
  }
}

export default Fleet
