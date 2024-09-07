import { from, share } from 'rxjs';
import stockholm from './stockholm';
import municipalities from '../municipalities';

const regions = {
  stockholm,
};

export default (savedParams: any) => {
  const municipalitiesStream = municipalities.read(savedParams);
  const includedRegions = Object.entries(regions)
    .filter(
      ([region]) =>
        process.env.REGIONS?.includes(region) ||
        process.env.REGIONS === '*' ||
        !process.env.REGIONS
    )
    .map(([, region]) => region);
  return from(
    includedRegions.map((region) => region(municipalitiesStream))
  ).pipe(share());
}
