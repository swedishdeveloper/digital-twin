import Position from '../models/Position'

function pythagoras(from: Position | any, to: Position | any): number {
  from = Position.convertPosition(from)
  to = Position.convertPosition(to)
  // quick approximation with pythagoras theorem
  return Math.sqrt(
    Math.pow(Math.abs(from.lat - to.lat), 2) +
      Math.pow(Math.abs(from.lon - to.lon), 2)
  )
}

function rad(x: number): number {
  return (x * Math.PI) / 180
}

/* Distance in meters between two points using the Haversine algo.
 */
function haversine(p1: Position | any, p2: Position | any): number {
  p1 = Position.convertPosition(p1)
  p2 = Position.convertPosition(p2)

  const R = 6371000
  const dLat = rad(p2.lat - p1.lat)
  const dLong = rad(p2.lon - p1.lon)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat)) *
      Math.cos(rad(p2.lat)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c

  return Math.round(d) || 0
}

function bearing(p1: Position | any, p2: Position | any): number {
  return Math.round(
    (Math.atan2(
      Math.cos(p1.lat) * Math.sin(p2.lat) -
        Math.sin(p1.lat) * Math.cos(p2.lat) * Math.cos(p2.lon - p1.lon),
      Math.sin(p2.lon - p1.lon) * Math.cos(p2.lat)
    ) *
      180) /
      Math.PI
  )
}

/* Add meters to a position
 */
function addMeters(
  p1: Position | any,
  { x, y }: { x: number; y: number }
): Position {
  p1 = Position.convertPosition(p1)
  const R = 6371000

  const lat = p1.lat + (y / R) * (180 / Math.PI)
  const lon =
    p1.lon + ((x / R) * (180 / Math.PI)) / Math.cos((p1.lat * Math.PI) / 180)

  return new Position({ lon, lat })
}
function getNrOfPointsBetween(
  p1: Position,
  p2: Position,
  quantity: number
): Position[] {
  const points: Position[] = []
  var latDiff = p2.lat - p1.lat,
    lonDiff = p2.lon - p1.lon
  var slope = (p2.lat - p1.lat) / (p2.lon - p1.lon)
  var lon, lat

  for (var i = 0; i <= quantity; i++) {
    if (slope == 0) {
      lat = 0
      lon = lonDiff * (i / quantity)
    }
    if (slope != 0) {
      lat = latDiff * (i / quantity)
      lon = lat / slope
    }

    points.push(new Position({ lon: lon + p1.lon, lat: lat + p1.lat }))
  }

  return points
}
export { pythagoras, haversine, bearing, addMeters, getNrOfPointsBetween }
