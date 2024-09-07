import { from, mergeMap, merge, Subject, of, Observable } from 'rxjs'
import {
  map,
  groupBy,
  tap,
  filter,
  pairwise,
  mergeAll,
  share,
  toArray,
  catchError,
  switchMap,
  bufferTime,
  retryWhen,
  delay,
  take,
  scan,
  debounceTime,
  concatMap,
  shareReplay,
  first,
} from 'rxjs/operators'
import { busDispatch } from '../lib/dispatch/busDispatch'
import { isInsideCoordinates } from '../lib/polygon'
import { clusterPositions } from '../lib/kmeans'
import { haversine } from '../lib/distance'
import { taxiDispatch } from '../lib/dispatch/taxiDispatch'
import { error, info } from '../lib/log'
import Booking from './models/booking'

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
  );

const tripsInMunicipality = (municipalities: Observable<Municipality>) => (
  stops: Observable<Stop>
) =>
  stops.pipe(
    groupBy(({ tripId }) => tripId),
    mergeMap((s) => s.pipe(toArray())),
    filter((stops) => stops.length > 1),
    mergeMap((stops) => {
      const firstStop = stops[0];
      const lastStop = stops[stops.length - 1];
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
      );
    })
  );

interface Municipality {
  name: string;
  geometry: {
    coordinates: any;
  };
  postombud: any;
  buses: any;
  cars: any;
  recycleTrucks: any;
  recycleCollectionPoints: any;
  citizens: any;
  dispatchedBookings: any;
  fleets: any;
}

interface Stop {
  tripId: string;
  lineNumber: string;
  position: any;
  name: string;
}

interface Trip {
  tripId: string;
  lineNumber: string;
  stops: Stop[];
  firstStop: Stop;
  lastStop: Stop;
  municipality: string;
}

class Region {
  id: string;
  name: string;
  geometry: any;
  trips: Observable<Trip>;
  stops: Observable<any>;
  lineShapes: Observable<any>;
  municipalities: Observable<Municipality>;
  postombud: Observable<any>;
  buses: Observable<any>;
  cars: Observable<any>;
  taxis: Observable<any>;
  recycleTrucks: Observable<any>;
  recycleCollectionPoints: Observable<any>;
  citizens: Observable<any>;
  stopAssignments: Observable<any>;
  manualBookings: Subject<any>;
  unhandledBookings: Observable<any>;
  dispatchedBookings: Observable<any>;

  constructor({
    id,
    name,
    geometry,
    stops,
    municipalities,
  }: {
    id: string;
    name: string;
    geometry: any;
    stops: Observable<Stop>;
    municipalities: Observable<Municipality>;
  }) {
    this.id = id;
    this.geometry = geometry;
    this.name = name;
    this.trips = tripsInMunicipality(municipalities)(stops).pipe(shareReplay());
    this.stops = this.trips.pipe(
      mergeMap(({ municipality, stops }) =>
        municipalities.pipe(
          first(({ name }) => name === municipality, null),
          mergeMap((municipality) => (municipality ? stops : of(null)))
        )
      )
    );
    this.lineShapes = this.trips.pipe(
      map(
        ({ tripId, stops, lineNumber, firstStop, lastStop, municipality }) => ({
          tripId,
          lineNumber,
          from: firstStop.name,
          to: lastStop.name,
          municipality,
          stops: stops.map(({ position }) => position),
        })
      )
    );
    this.municipalities = municipalities;

    this.postombud = municipalities.pipe(
      mergeMap((municipality) => municipality.postombud)
    );

    this.buses = municipalities.pipe(
      map((municipality) => municipality.buses),
      mergeAll(),
      shareReplay()
    );

    this.cars = municipalities.pipe(
      mergeMap((municipality) => municipality.cars)
    );

    this.taxis = municipalities.pipe(
      mergeMap((municipality) => municipality.cars),
      filter((car) => car.vehicleType === 'taxi'),
      catchError((err) => error('taxi err', err))
    );

    this.recycleTrucks = municipalities.pipe(
      mergeMap((municipality) => municipality.recycleTrucks),
      catchError((err) => error('recycle trucks err', err))
    );

    this.recycleCollectionPoints = municipalities.pipe(
      mergeMap((municipality) => municipality.recycleCollectionPoints),
      catchError((err) => error('recycleCollectionPoints err', err))
    );

    this.citizens = municipalities.pipe(
      mergeMap((municipality) => municipality.citizens)
    );

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
    );

    this.manualBookings = new Subject();

    this.unhandledBookings = this.citizens.pipe(
      mergeMap((passenger) => passenger.bookings),
      filter((booking) => !booking.assigned),
      catchError((err) => error('unhandledBookings', err)),
      share()
    );

    this.dispatchedBookings = merge(
      this.municipalities.pipe(
        mergeMap((municipality) => municipality.dispatchedBookings)
      ),
      this.municipalities.pipe(
        mergeMap((municipality) => municipality.fleets),
        mergeMap((fleet) => fleet.dispatchedBookings)
      )
    ).pipe(share());
  }
}

const stopsToBooking = ([pickup, destination]: [Stop, Stop]) =>
  new Booking({
    pickup,
    destination,
    lineNumber: pickup.lineNumber ?? destination.lineNumber,
    type: 'busstop',
  });

export default Region;
