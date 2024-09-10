import Municipality from '../../models/Municipality'
import Region from '../../models/Region'
import { filter, Observable, shareReplay } from 'rxjs'
import municipalitiesJson from '.../../../data/municipalities.json'
const includedMunicipalities = ['Södertälje kommun']

const stockholm = (municipalities: Observable<Municipality>) => {
  return new Region({
    id: 'stockholm',
    name: 'Stockholm',
    ...municipalitiesJson.find(
      (municipality) => municipality.namn === 'Stockholm'
    ),
    municipalities: municipalities.pipe(
      filter((municipality) =>
        includedMunicipalities.includes(municipality.name)
      ),
      shareReplay()
    ),
  })
}

export default stockholm
