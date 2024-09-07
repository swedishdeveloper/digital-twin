import Municipality from '../../models/Municipality'
import Region from '../../models/Region'
import { filter, Observable, shareReplay } from 'rxjs'

const includedMunicipalities = ['Södertälje kommun']

const stockholm = (municipalitiesStream: Observable<Municipality>) => {
  return new Region({
    id: 'stockholm',
    name: 'Stockholm',
    municipalities: municipalities.pipe(
      filter((municipality) =>
        includedMunicipalities.includes(municipality.name)
      ),
      shareReplay()
    ),
  })
}

export default stockholm
