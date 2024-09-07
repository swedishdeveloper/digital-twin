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
} from 'rxjs'
import Fleet from '../lib/fleet'
import { error } from '../log'
import { searchOne } from '../pelias'

import { MunicipalityData as MunicipalityArgs } from '../../../types/MunicipalityData';

class Municipality {
  squares: any
  geometry: any
  name: string
  id: string
  email: string
  zip: string
  center: any
  telephone: string
  postombud: any
  recycleCollectionPoints: any
  packageVolumes: any
  busesPerCapita: number
  population: number
  privateCars: ReplaySubject<any>
  unhandledBookings: Subject<any>
  co2: number
  citizens: any
  fleets: any
  buses: any
  recycleTrucks: any
  dispatchedBookings: any
  cars: any

  constructor({
    geometry,
    name,
    id,
    packageVolumes,
    email,
    zip,
    center,
    telephone,
    postombud,
    population,
    recycleCollectionPoints,
    citizens,
    squares,
    fleets,
  }: MunicipalityArgs) {
    this.squares = squares
    this.geometry = geometry
    this.name = name
    this.id = id
    this.email = email
    this.zip = zip
    this.center = center
    this.telephone = telephone
    this.postombud = postombud
    this.recycleCollectionPoints = recycleCollectionPoints
    this.packageVolumes = packageVolumes
    this.busesPerCapita = 100 / 80_000
    this.population = population
    this.privateCars = new ReplaySubject()
    this.unhandledBookings = new Subject()

    this.co2 = 0
    this.citizens = citizens

    this.fleets = from(fleets).pipe(
      mergeMap(async (fleet) => {
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
        catchError((err) => {
          error('municipality dispatchedBookings err', err)
          return []
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
