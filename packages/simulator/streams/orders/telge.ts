import {
  catchError,
  filter,
  from,
  map,
  mergeAll,
  mergeMap,
  Observable,
  share,
  take,
  throwError,
  toArray,
} from 'rxjs'
import { error } from '../../lib/log'

import Booking from '../../models/Booking'
import Position from '../../models/Position'
import { searchOne } from '../../lib/pelias'
import { VirtualTime } from '../../models/VirtualTime'
import json from '../../data/telge/ruttdata_2024-09-03.json'

function read(virtualTime: VirtualTime): Observable<Booking> {
  return from(json)
    .pipe(
      map(
        ({
          Turid: id,
          Datum: pickupDate,
          Tjtyp: serviceType,
          Lat: lat,
          Lng: lon,
        }) => ({
          id,
          pickup: {
            name: serviceType,
            date: pickupDate,
            position: new Position({ lat, lon }),
          },
          sender: 'TELGE',
          serviceType,
        })
      ),
      filter(({ pickup }) => pickup.position.isValid()),
      toArray(),
      mergeMap(async (rows) => {
        // TODO: Where do we leave the trash?
        const recyleCenters = [
          'Pålhagsvägen 4, Södertälje',
          'Bovallsvägen 5, 152 42 Södertälje',
        ]
        const deliveryPoints = await Promise.all(
          recyleCenters.map((addr) =>
            searchOne(addr).then(({ name, position }) => ({ name, position }))
          )
        )
        return rows.map((row, i) => ({
          ...row,
          id: row.id + '_' + i,
          destination: deliveryPoints[i % deliveryPoints.length],
        }))
      }, 1),
      mergeAll(),
      take(5), // Start with just a few bookings for debug reasons
      map((row) => new Booking({ type: 'recycleBin', ...row, virtualTime })),
      share()
    )
    .pipe(
      catchError((err) => {
        error('TELGE -> from CSV', err)
        return throwError(() => err)
      })
    )
}

export default read
