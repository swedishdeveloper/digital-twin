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
import { busDispatch } from '../lib/dispatch/busDispatch'
import { isInsideCoordinates } from '../lib/polygon'
import { error, info } from '../lib/log'
import Booking from './Booking'
import Vehicle from './vehicles/Vehicle'
import Citizen from './Citizen'
import Municipality from './Municipality'
import RecycleTruck from './vehicles/RecycleTruck'

const flattenProperty = (property: string) => (stream: Observable<any>) =>
  stream.pipe(
    mergeMap((object) =>
      object[property].pipe(
        toArray(),
        map((arr) => ({
          ...object,
          [property]: arr,
        }))
      )
    )
  )

const tripsInMunicipality =
  (municipalities: Observable<Municipality>) => (stops: Observable<any>) =>
    stops.pipe(
      groupBy(({ tripId }) => tripId),
      mergeMap((s) => s.pipe(toArray())),
      filter((stops) => stops.length > 1),
      mergeMap((stops) => {
        const firstStop = stops[0]
        const lastStop = stops[stops.length - 1]
        return municipalities.pipe(
          filter(({ geometry }) =>
            isInsideCoordinates(firstStop.position, geometry.coordinates)
          ),
          map(({ name }) => ({
            tripId: firstStop.tripId,
            lineNumber: stops[0].lineNumber,
            stops,
            firstStop,
            lastStop,
            municipality: name,
          }))
        )
      })
    )

class Region {
  id: string
  name: string
  geometry: any
  municipalities: Observable<Municipality>
  postombud: Observable<Booking>
  buses: Observable<Vehicle>
  cars: Observable<Vehicle>
  taxis: Observable<Vehicle>
  recycleTrucks: Observable<RecycleTruck>
  recycleCollectionPoints: Observable<Booking>
  citizens: Observable<Citizen>
  stopAssignments: Observable<any>
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

    this.stopAssignments = this.trips.pipe(
      groupBy((trip) => trip.municipality),
      map((trips) => ({
        buses: this.buses.pipe(
          filter((bus) => bus.fleet.municipality.name === trips.key)
        ),
        trips,
      })),
      flattenProperty('buses'),
      flattenProperty('trips'),
      filter(({ buses, trips }) => buses.length && trips.length),
      mergeMap(({ buses, trips }) => busDispatch(buses, trips), 1),
      catchError((err) => error('stopAssignments', err)),
      retryWhen((errors) => errors.pipe(delay(1000), take(10))),
      mergeAll(),
      mergeMap(({ bus, stops }) =>
        from(stops).pipe(
          pairwise(),
          map(stopsToBooking),
          map((booking) => ({ bus, booking }))
        )
      ),
      catchError((err) => error('stopAssignments', err)),
      share()
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

const stopsToBooking = ([pickup, destination]) =>
  new Booking({
    pickup,
    destination,
    lineNumber: pickup.lineNumber ?? destination.lineNumber,
    type: 'busstop',
  })

export default Region
