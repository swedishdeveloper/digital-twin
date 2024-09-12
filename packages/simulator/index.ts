import {
  filter,
  share,
  merge,
  shareReplay,
  Subscription,
  Observable,
} from 'rxjs'
import { mergeMap, catchError } from 'rxjs/operators'

import { read } from './config'
import { info, error, logStream } from './lib/log'

import { createMunicipalities } from './streams/municipalities'
import { createRegions } from './streams/regions'
import { ExperimentParameters } from '../../types/Experiment'
import { safeId } from './lib/id'
import { VirtualTime } from './models/VirtualTime'
import Municipality from './models/Municipality'
import RecycleTruck from './models/vehicles/RecycleTruck'
import Vehicle from './models/vehicles/Vehicle'
import Booking from './models/Booking'
import Citizen from './models/Citizen'

export class Experiment {
  subscriptions: Subscription[]
  logStream: Observable<string>
  parameters: ExperimentParameters
  municipalities: Observable<Municipality>
  virtualTime: VirtualTime

  // VEHICLES
  cars: Observable<Vehicle>
  recycleTrucks: Observable<RecycleTruck>
  carUpdates: Observable<Vehicle>

  // BOOKINGS
  recycleCollectionPoints: Observable<Booking>
  dispatchedBookings: Observable<Booking>
  bookingUpdates: Observable<Booking>

  // PASSENGERS
  passengerUpdates: Observable<Citizen>
  passengers: Observable<Citizen>

  // EVENTS
  stop = async () => {
    this.virtualTime.stop()
    this.subscriptions.forEach((sub) => sub.unsubscribe())
    logStream.complete()
  }

  constructor({ id = safeId(), emitters }: ExperimentParameters) {
    this.subscriptions = []
    this.parameters = { ...read(), emitters }
    this.virtualTime = new VirtualTime()

    // Log experiment start information
    info(`*** Starting experiment ${id} with params:`, {
      id: this.parameters.id,
      emitters: this.parameters?.emitters,
      municipalities: Object.keys(this.parameters.municipalities).map(
        (municipality) => {
          return `${municipality} (${this.parameters.municipalities[municipality].fleets.length} fleets)`
        }
      ),
    })

    // Rregions and municipalities
    const regions = createRegions(
      createMunicipalities(this.parameters, this.virtualTime)
    )
    this.municipalities = regions.pipe(
      mergeMap((region) => region.municipalities),
      catchError((err) => error('Experiment -> municipalities', err)),
      shareReplay()
    )

    // BOOKINGS
    this.dispatchedBookings = merge(
      regions.pipe(
        mergeMap((region) => region.dispatchedBookings),
        catchError((err) => error('Experiment -> dispatchedBookings', err)),
        share()
      )
    )

    this.recycleCollectionPoints = regions.pipe(
      mergeMap((region) => region.recycleCollectionPoints),
      catchError((err) => error('Experiment -> RecycleCollectionPoints', err)),
      shareReplay()
    )

    this.bookingUpdates = this.dispatchedBookings.pipe(
      mergeMap((booking) => booking.statusEvents),
      catchError((err) => error('Experiment -> bookingUpdates', err)),
      share()
    )

    // PASSENGERS

    this.passengers = regions.pipe(
      mergeMap((region) => region.citizens),
      shareReplay()
    )
    this.passengerUpdates = this.passengers.pipe(
      mergeMap(({ deliveredEvents, pickedUpEvents }) =>
        merge(deliveredEvents, pickedUpEvents)
      ),
      catchError(async (err) => error('passengerUpdates', err)),
      filter((f) => f instanceof Citizen),
      share()
    )
    this.logStream = logStream // create new logstream for each experiment?

    // VEHICLES
    this.cars = regions.pipe(mergeMap((region) => region.cars))
    this.recycleTrucks = regions.pipe(
      mergeMap((region) => region.recycleTrucks),
      share()
    )
    this.carUpdates = merge(
      // experiment.buses, // Uncomment if needed
      // experiment.cars,  // Uncomment if needed
      // experiment.taxis, // Uncomment if needed
      this.cars
    ).pipe(
      mergeMap((car) => car.movedEvents),
      catchError(async (err) => error('Experiment -> carUpdates', err)),
      filter((f) => f instanceof Vehicle),
      share()
    )
  }
}
