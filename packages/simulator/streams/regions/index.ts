import { from, Observable, share } from 'rxjs'
import stockholm from './stockholm'
import Region from '../../models/Region'

const regions = {
  stockholm,
}

export function createRegions({ municipalities }): Observable<Region> {
  return from(Object.values(regions)).pipe(
    map((region) => region(municipalities)),
    share()
  )
}
