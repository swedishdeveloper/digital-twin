import { from, map, Observable, share } from 'rxjs'
import stockholm from './stockholm'
import Region from '../../models/Region'
import Municipality from '../../models/Municipality'

const regions = {
  stockholm,
}

export function createRegions(
  municipalities: Observable<Municipality>
): Observable<Region> {
  return from(Object.values(regions)).pipe(
    map((region) => region(municipalities)),
    share()
  )
}
