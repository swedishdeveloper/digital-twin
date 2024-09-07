import { filter, share, merge, shareReplay } from 'rxjs'
import { mergeMap, catchError } from 'rxjs/operators'

import { read } from './config'
import { info, error, logStream } from './lib/log'

import { createRegions } from './streams/regions'
import { Experiment, ExperimentParameters } from '../../types/Experiment'

class Engine {
  subscriptions: any[]

  constructor() {
    this.subscriptions = []
  }

  createExperiment({ id = safeId() }: ExperimentParameters) {
    const savedParams = read()

    // Log experiment start information
    info(`*** Starting experiment ${id} with params:`, {
      id: savedParams.id,
      fixedRoute: savedParams.fixedRoute,
      emitters: savedParams.emitters,
      municipalities: Object.keys(savedParams.fleets).map((municipality) => {
        return `${municipality} (${savedParams.fleets[municipality].fleets.length} fleets)`
      }),
    })

    // Rregions and municipalities
    const regions = createRegions(savedParams)
    const municipalities = regions.pipe(
      mergeMap((region) => region.municipalities),
      catchError((err) => error('Experiment -> municipalities', err)),
      shareReplay()
    )

    // BOOKINGS
    const dispatchedBookings = merge(
      regions.pipe(
        mergeMap((region) => region.dispatchedBookings),
        catchError((err) => error('Experiment -> dispatchedBookings', err)),
        share()
      )
    )

    const recycleCollectionPoints = regions.pipe(
      mergeMap((region) => region.recycleCollectionPoints),
      catchError((err) => error('Experiment -> RecycleCollectionPoints', err)),
      shareReplay()
    )

    const bookingUpdates = dispatchedBookings.pipe(
      mergeMap((booking) => booking.statusEvents),
      catchError((err) => error('Experiment -> bookingUpdates', err)),
      share()
    )

    // PASSENGERS

    const passengers = regions.pipe(
      filter((region) => !!region.citizens),
      mergeMap((region) => region.citizens),
      catchError(async (err) => error('Experiment -> Passengers', err)),
      shareReplay()
    )
    const passengerUpdates = passengers.pipe(
      mergeMap(({ deliveredEvents, pickedUpEvents }) =>
        merge(deliveredEvents, pickedUpEvents)
      ),
      catchError(async (err) => error('passengerUpdates', err)),
      share()
    )

    // VEHICLES
    const cars = regions.pipe(mergeMap((region) => region.cars))
    const recycleTrucks = regions.pipe(
      mergeMap((region) => region.recycleTrucks),
      share()
    )
    const carUpdates = merge(
      // experiment.buses, // Uncomment if needed
      // experiment.cars,  // Uncomment if needed
      // experiment.taxis, // Uncomment if needed
      recycleTrucks
    ).pipe(
      mergeMap((car) => car.movedEvents),
      catchError(async (err) => error('Experiment -> carUpdates', err)),
      share()
    )

    // Define experiment parameters
    const parameters: ExperimentParameters = {
      id,
      startDate: new Date(),
      fleets: savedParams.fleets,
    }
    // statistics.collectExperimentMetadata(parameters)
    // Create experiment object
    const experiment: Experiment = {
      logStream,
      parameters,

      municipalities,
      subscriptions: [],
      virtualTime,
      dispatchedBookings,

      // VEHICLES
      cars,
      recycleTrucks,
      passengers,

      // Adding recycle collection points
      recycleCollectionPoints,

      bookingUpdates,
      passengerUpdates,
      carUpdates,
    }

    return experiment
  }
}

const engine = new Engine()
