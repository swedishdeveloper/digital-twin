import { filter, share, merge, shareReplay } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';

import { read } from './config';
import { info, error, logStream } from './lib/log';

import { Experiment, ExperimentParameters } from '../../../types/Experiment';

class Engine {
  subscriptions: any[];

  constructor() {
    this.subscriptions = [];
  }

  createExperiment({
    defaultEmitters,
    id = safeId(),
  }: { defaultEmitters: any; id?: string } = {}): Experiment {
    console.log('Creating experiment');
    const savedParams = read();

    // Log experiment start information
    info(`*** Starting experiment ${id} with params:`, {
      id: savedParams.id,
      fixedRoute: savedParams.fixedRoute,
      emitters: savedParams.emitters,
      municipalities: Object.keys(savedParams.fleets).map((municipality) => {
        return `${municipality} (${savedParams.fleets[municipality].fleets.length} fleets)`
      }),
    })

    // Initialize regions stream
    const regions = require('./streams/regions')(savedParams);

    // Define experiment parameters
    const parameters: ExperimentParameters = {
      id,
      startDate: new Date(),
      fixedRoute: savedParams.fixedRoute || 100,
      emitters: defaultEmitters,
      fleets: savedParams.fleets,
    }
    // statistics.collectExperimentMetadata(parameters)
    // Create experiment object
    const experiment: Experiment = {
      logStream,
      busStops: regions.pipe(
        filter((region) => region.stops),
        mergeMap((region) => region.stops),
        shareReplay()
      ),
      lineShapes: regions.pipe(
        filter((region) => region.lineShapes),
        mergeMap((region) => region.lineShapes),
        shareReplay()
      ),
      postombud: regions.pipe(mergeMap((region) => region.postombud)),
      municipalities: regions.pipe(
        mergeMap((region) => region.municipalities),
        shareReplay()
      ),
      subscriptions: [],
      virtualTime,
      dispatchedBookings: merge(
        regions.pipe(mergeMap((region) => region.dispatchedBookings))
      ),

      // VEHICLES
      cars: regions.pipe(mergeMap((region) => region.cars)),
      buses: regions.pipe(mergeMap((region) => region.buses)),
      taxis: regions.pipe(mergeMap((region) => region.taxis)),
      recycleTrucks: regions.pipe(
        mergeMap((region) => region.recycleTrucks),
        catchError((err) => error('Experiment -> RecycleTrucks', err))
      ),

      parameters,
      passengers: regions.pipe(
        filter((region) => region.citizens),
        mergeMap((region) => region.citizens),
        catchError((err) => error('Experiment -> Passengers', err)),
        shareReplay()
      ),

      // Adding recycle collection points
      recycleCollectionPoints: regions.pipe(
        mergeMap((region) => region.recycleCollectionPoints),
        catchError((err) => error('Experiment -> RecycleCollectionPoints', err))
      ),
    }
    // Handle passenger bookings
    experiment.passengers
      .pipe(
        mergeMap((passenger) => passenger.bookings),
        catchError((err) => error('passenger statistics err', err)),
        shareReplay()
      )
      // TODO:take care of this subscription so we know how to unsubscribe
      .subscribe((booking) => {
        try {
          statistics.collectBooking(booking, parameters)
        } catch (err) {
          error('collectBooking err', err)
        }
      })

    // Setup booking updates stream
    experiment.bookingUpdates = experiment.dispatchedBookings.pipe(
      mergeMap((booking) => booking.statusEvents),
      catchError((err) => error('bookingUpdates', err)),
      share()
    )

    // Setup passenger updates stream
    experiment.passengerUpdates = experiment.passengers.pipe(
      mergeMap(({ deliveredEvents, pickedUpEvents }) =>
        merge(deliveredEvents, pickedUpEvents)
      ),
      catchError((err) => error('passengerUpdates', err)),
      share()
    )

    // Setup vehicle updates stream
    experiment.carUpdates = merge(
      // experiment.buses, // Uncomment if needed
      // experiment.cars,  // Uncomment if needed
      // experiment.taxis, // Uncomment if needed
      experiment.recycleTrucks
    ).pipe(
      mergeMap((car) => car.movedEvents),
      catchError((err) => error('car updates err', err)),

      share()
    )

    return experiment
  }
}

const engine = new Engine();
