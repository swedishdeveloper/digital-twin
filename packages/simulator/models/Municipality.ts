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
} from 'rxjs'
import Vehicle from './vehicles/Vehicle'
import RecycleTruck from './vehicles/RecycleTruck'
import Citizen from './Citizen'
import Booking from './Booking'
import Fleet from './Fleet'
import { searchOne } from '../lib/pelias'

interface MunicipalityParams {
  geometry?: any
  name: string
  id: string
  packageVolumes?: any
  email?: string
  zip?: string
  center?: any
  telephone?: string
  population?: number
  recycleCollectionPoints?: any
  citizens?: Observable<Citizen>
  squares?: any
  fleets?: any
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
  telephone?: string
  packageVolumes: any
  busesPerCapita: number
  population?: number
  privateCars: ReplaySubject<Vehicle>
  unhandledBookings: Subject<Booking>
  recycleCollectionPoints: Observable<Booking>
  citizens: Observable<Citizen>
  fleets: Observable<Fleet>
  buses: Observable<Vehicle>
  recycleTrucks: Observable<RecycleTruck>
  dispatchedBookings: Observable<Booking>
  cars: Observable<Vehicle>

  constructor({
    geometry,
    name,
    id,
    packageVolumes,
    email,
    zip,
    center,
    telephone,
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
    this.telephone = telephone
    this.recycleCollectionPoints = recycleCollectionPoints
    this.packageVolumes = packageVolumes
    this.busesPerCapita = 100 / 80_000
    this.population = population
    this.privateCars = new ReplaySubject()
    this.unhandledBookings = new Subject()

    this.co2 = 0
    this.citizens = citizens

    this.fleets = from(fleets).pipe(
      mergeMap(async (fleet: Fleet) => {
        const hub = fleet.hubAddress
          ? await searchOne(fleet.hubAddress)
              .then((r) => r.position)
              .catch((err) => error(err) || center)
          : center

        return new Fleet({ hub, ...fleet, municipality: this })
      }),
      shareReplay()
    )

    this.buses = this.fleets.pipe(
      mergeMap((fleet) => fleet.cars),
      filter((car) => car.type === 'bus'),
      catchError((err) => {
        error('buses -> fleet', err)
        return []
      })
    )

    this.recycleTrucks = this.fleets.pipe(
      mergeMap((fleet) => fleet.cars),
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
            first((fleet) => fleet.canHandleBooking(booking)),
            mergeMap((fleet) => fleet.handleBooking(booking))
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
