import Municipality from '../../models/Municipality'
import Region from '../../models/Region'
import publicTransport from '../publicTransport'
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
    stops: publicTransport('sl').stops,
  })
}

export default stockholm
