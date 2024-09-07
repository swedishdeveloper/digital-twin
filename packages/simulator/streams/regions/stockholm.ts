import { stops } from '../publicTransport';
import { filter, shareReplay } from 'rxjs';
import Region from '../../lib/region';

const includedMunicipalities = ['Södertälje municipality'];

const stockholm = (municipalitiesStream: any) => {
  const municipalities = municipalitiesStream.pipe(
    filter((municipality: any) =>
      includedMunicipalities.includes(municipality.name)
    ),
    shareReplay()
  );

  return new Region({
    id: 'stockholm',
    name: 'Stockholm',
    municipalities: municipalities,
    stops,
  });
}

export default stockholm;
