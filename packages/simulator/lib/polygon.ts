import inside from 'point-in-polygon'

type Coordinates = {
  lon: number
  lat: number
}

function isInsideCoordinates(
  { lon, lat }: Coordinates,
  coordinates: number[][][]
): boolean {
  return coordinates.some((coordinates) => inside([lon, lat], coordinates))
}

export { isInsideCoordinates }
