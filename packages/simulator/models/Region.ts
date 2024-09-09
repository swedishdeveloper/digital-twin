import { from, mergeMap, merge, Subject, of, Observable } from 'rxjs'
import {
  map,
  groupBy,
  filter,
  pairwise,
  mergeAll,
  share,
  toArray,
  catchError,
  retryWhen,
  delay,
  take,
  shareReplay,
  first,
} from 'rxjs/operators'
import { isInsideCoordinates } from '../lib/polygon'
import { error, info } from '../lib/log'
import Booking from './Booking'
import Vehicle from './vehicles/Vehicle'
import Citizen from './Citizen'
import Municipality from './Municipality'
import RecycleTruck from './vehicles/RecycleTruck'

class Region {
  id: string
  name: string
  geometry: any
  municipalities: Observable<Municipality>
  buses: Observable<Vehicle>
  cars: Observable<Vehicle>
  taxis: Observable<Vehicle>
  recycleTrucks: Observable<RecycleTruck>
  recycleCollectionPoints: Observable<Booking>
  citizens: Observable<Citizen>
  manualBookings: Subject<Booking>
  unhandledBookings: Observable<Booking>
  dispatchedBookings: Observable<Booking>

  constructor({ id, name, geometry, municipalities }: Region) {
    this.id = id
    this.geometry = geometry
    this.name = name
    this.municipalities = municipalities

    this.buses = municipalities.pipe(
      map((municipality) => municipality.buses),
      mergeAll(),
      shareReplay()
    )

    this.cars = municipalities.pipe(
      mergeMap((municipality) => municipality.cars)
    )

    this.taxis = municipalities.pipe(
      mergeMap((municipality) => municipality.cars),
      filter((car) => car.vehicleType === 'taxi'),
      catchError((err) => error('taxi err', err))
    )

    this.recycleTrucks = municipalities.pipe(
      mergeMap((municipality) => municipality.recycleTrucks),
      catchError((err) => error('recycle trucks err', err))
    )

    this.recycleCollectionPoints = municipalities.pipe(
      mergeMap((municipality) => municipality.recycleCollectionPoints),
      catchError((err) => error('recycleCollectionPoints err', err))
    )

    this.citizens = municipalities.pipe(
      mergeMap((municipality) => municipality.citizens)
    )

    this.manualBookings = new Subject()

    this.unhandledBookings = this.citizens.pipe(
      mergeMap((passenger) => passenger.bookings),
      filter((booking) => !booking.assigned),
      catchError((err) => error('unhandledBookings', err)),
      share()
    )

    this.dispatchedBookings = merge(
      this.municipalities.pipe(
        mergeMap((municipality) => municipality.dispatchedBookings)
      ),
      this.municipalities.pipe(
        mergeMap((municipality) => municipality.fleets),
        mergeMap((fleet) => fleet.dispatchedBookings)
      )
    ).pipe(share())
  }
}

export default Region
