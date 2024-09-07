import Municipality from '../../models/Municipality'
import { stops } from '../publicTransport.ts'
import { filter, shareReplay } from 'rxjs'

const includedMunicipalities = ['Södertälje kommun']

const stockholm = (municipalitiesStream: Observable<Municipality>) => {
  const municipalities = municipalitiesStream.pipe(
    filter((municipality: any) =>
      includedMunicipalities.includes(municipality.name)
    ),
    shareReplay()
  )

  return new Region({
    id: 'stockholm',
    name: 'Stockholm',
    municipalities: municipalities,
    stops,
  })
}

export default stockholm
