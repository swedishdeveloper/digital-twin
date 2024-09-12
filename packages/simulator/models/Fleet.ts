import {
  Subject,
  range,
  from,
  merge,
  of,
  Observable,
  firstValueFrom,
  shareReplay,
  mergeMap,
  share,
  catchError,
  first,
} from 'rxjs'
import RecycleTruck from './vehicles/RecycleTruck'
import Taxi from './vehicles/Taxi'
import Municipality from './Municipality'
import Position from './Position'
import Vehicle from './vehicles/Vehicle'
import Booking from './Booking'
import { manualDispatch } from '../lib/dispatch/manual'
import { debug } from 'console'
import { error } from '../lib/log'

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

interface FleetParams {
  name: string
  marketshare: number
  vehicles: { [key: string]: number }
  hub: any
}

class Fleet {
  name: string
  marketshare: number
  municipality?: Municipality
  hubAddress?: string
  hub: { position: Position }
  cars: Observable<Vehicle>

  unhandledBookings: Subject<Booking>
  manualDispatchedBookings: Subject<Booking>
  dispatchedBookings: Observable<Booking>

  constructor({ name, marketshare, vehicles, hub }: FleetParams) {
    this.name = name
    this.marketshare = marketshare
    this.hub = { position: new Position(hub) }

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
      manualDispatch(this.cars, this.unhandledBookings)
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

  async handleBooking(booking, car?) {
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
