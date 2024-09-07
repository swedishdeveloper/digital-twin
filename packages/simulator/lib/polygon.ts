import inside from 'point-in-polygon'

import { Position as Coordinates } from '../../../types/Position';

function isInsideCoordinates(
  { lon, lat }: Coordinates,
  coordinates: number[][][]
): boolean {
  return coordinates.some((coordinates) => inside([lon, lat], coordinates))
}

export { isInsideCoordinates }
