import * as moment from 'moment';

interface Stop {
  tripId: string;
  routeId: string;
  stopId: string;
  lineNumber: string;
  position: any;
  services: any;
}
import gtfs from './gtfs';

import { shareReplay, from, firstValueFrom, groupBy, pipe, Observable } from 'rxjs';
import {
  map,
  mergeMap,
  filter,
  catchError,
  reduce,
  toArray,
  mergeAll,
} from 'rxjs/operators';
import { error } from '../lib/log';

/**
 * Creates a reducer function that accumulates items into a Map using a specified property as the key.
 * @param idProp - The property to use as the key for the Map.
 */
const reduceMap = <T extends Record<string, any>>(idProp: keyof T = 'id') =>
  pipe(
    reduce(
      (map: Map<T[keyof T], T>, item: T) => {
        map.set(item[idProp], item);
        return map;
      },
      new Map<T[keyof T], T>()
    )
  );

/**
 * Adds a new property to each item in the stream, calculated using a provided function.
 * @param prop - The name of the property to add.
 * @param fn - A function that takes an item and returns the value for the new property.
 */
const addProp = <T extends Record<string, any>, K extends keyof T>(
  prop: K,
  fn: (item: T) => T[K]
) =>
  pipe(
    map((item: T) => ({
      ...item,
      [prop]: fn(item),
    }))
  );

async function getStopsForDate(date: string, operator: string): Promise<Observable<Stop>> {
  const {
    stops,
    busStops,
    trips,
    serviceDates,
    routeNames,
    excludedLineNumbers,
  }: {
    stops: Observable<Record<string, any>>,
    busStops: Observable<Record<string, any>>,
    trips: Observable<Record<string, any>>,
    serviceDates: Observable<Record<string, any>>,
    routeNames: Observable<Record<string, any>>,
    excludedLineNumbers: Observable<string>
  } = gtfs(operator)

  const allTrips = await firstValueFrom(trips.pipe(reduceMap()))
  const allRouteNames = await firstValueFrom(routeNames.pipe(reduceMap()))
  const allStops = await firstValueFrom(stops.pipe(reduceMap()))
  const allServices = await firstValueFrom(serviceDates.pipe(reduceMap('serviceId')))
  const todaysServices = allServices.get(date).services

  const excludedLineNumberArray = []
  excludedLineNumbers
    .pipe(map((line) => excludedLineNumberArray.push(line)))
    .subscribe()

  return busStops.pipe(
    addProp('trip', (stop) => allTrips.get(stop.tripId)),
    addProp('route', ({ trip: { routeId } }) => allRouteNames.get(routeId)),
    addProp('lineNumber', ({ route }) => route.lineNumber),
    filter(({ trip: { serviceId } }) => todaysServices.includes(serviceId)),
    addProp('stop', (stop) => allStops.get(stop.stopId)),
    addProp('position', ({ stop }) => stop.position),
    filter((stop) => {
      // NOTE: This is a relatively manual way of filtering out routes and stops that are not actually buses.
      return excludedLineNumberArray.indexOf(stop.lineNumber) === -1
    }),
    catchError((err) => {
      error('PublicTransport error', err)
      throw err
    })
  )
}

function publicTransport(operator: string): { stops: Observable<Stop> } {
  // stop_times.trip_id -> trips.service_id -> calendar_dates.service_id
  const todaysDate = moment().format('YYYYMMDD')

  const todaysStops = from(getStopsForDate(todaysDate, operator)).pipe(
    mergeAll(),
    shareReplay()
  )

  return {
    stops: todaysStops,
  }
}

export default publicTransport;
