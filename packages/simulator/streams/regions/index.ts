import { from, share } from 'rxjs'
import stockholm from './stockholm'

const regions = {
  stockholm,
}

export default (municipalitiesStream) => {
  return from(
    Object.entries(regions)
      .filter(
        ([region]) =>
          process.env.REGIONS?.includes(region) ||
          process.env.REGIONS === '*' ||
          !process.env.REGIONS
      )
      .map(([, region]) => region(municipalitiesStream))
  ).pipe(share())
}
