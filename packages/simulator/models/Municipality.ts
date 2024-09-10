import {
  from,
  shareReplay,
  Subject,
  ReplaySubject,
  mergeMap,
  merge,
  filter,
  catchError,
  first,
  Observable,
  tap,
} from 'rxjs'
import Vehicle from './vehicles/Vehicle'
import RecycleTruck from './vehicles/RecycleTruck'
import Citizen from './Citizen'
import Booking from './Booking'
import Fleet from './Fleet'
import { error } from '../lib/log'

interface MunicipalityParams {
  geometry?: any
  name: string
  id: string
  email?: string
  zip?: string
  center?: any
  telephone?: string
  population?: number
  recycleCollectionPoints?: any
  citizens?: Observable<Citizen>
  squares?: any
  fleets: Observable<Fleet>
}

class Municipality {
  squares: any
  geometry: any
  name: string
  id: string
  email?: string
  zip?: string
  center?: any
  co2: number
  packageVolumes: any
  population?: number
  privateCars: ReplaySubject<Vehicle>
  unhandledBookings: Subject<Booking>
  recycleCollectionPoints: Observable<Booking>
  citizens?: Observable<Citizen>
  fleets: Observable<Fleet>
  recycleTrucks: Observable<RecycleTruck>
  dispatchedBookings: Observable<Booking>
  cars: Observable<Vehicle>

  constructor({
    geometry,
    name,
    id,
    email,
    zip,
    center,
    population,
    recycleCollectionPoints,
    citizens,
    squares,
    fleets,
  }: MunicipalityParams) {
    this.squares = squares
    this.geometry = geometry
    this.name = name
    this.id = id
    this.email = email
    this.zip = zip
    this.center = center
    this.recycleCollectionPoints = recycleCollectionPoints
    this.population = population
    this.privateCars = new ReplaySubject()
    this.unhandledBookings = new Subject()

    this.co2 = 0
    this.citizens = citizens

    this.fleets = fleets.pipe(tap((fleet) => (fleet.municipality = this)))

    this.recycleTrucks = this.fleets.pipe(
      mergeMap((fleet) => fleet.cars as Observable<RecycleTruck>), // TODO: can we filter on fleet type instead of the cars?
      filter((car) => car.vehicleType === 'recycleTruck'),
      catchError((err) => {
        error('recycleTrucks -> fleet', err)
        return []
      })
    )

    this.dispatchedBookings = merge(
      this.recycleCollectionPoints.pipe(
        mergeMap((booking) =>
          this.fleets.pipe(
            mergeMap(async (fleet) => ({
              fleet,
              canHandle: await fleet.canHandleBooking(booking),
            })),
            first(({ canHandle }) => canHandle !== null),
            mergeMap(({ fleet }) => fleet.handleBooking(booking))
          )
        ),
        catchError(async (err) => {
          error('municipality dispatchedBookings err', err)
        })
      )
    )

    this.cars = merge(
      this.privateCars,
      this.fleets.pipe(mergeMap((fleet) => fleet.cars))
    ).pipe(shareReplay())
  }
}

export default Municipality
