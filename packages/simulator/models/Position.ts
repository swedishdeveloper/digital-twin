import { PositionType } from '../../../types/Position'
import { haversine } from '../lib/distance'

function convertPosition(pos: any): { lon: number; lat: number } {
  return {
    lon: pos.longitude || pos.lon || pos.lng || pos[0],
    lat: pos.latitude || pos.lat || pos[1],
  }
}

class Position implements PositionType {
  lon: number
  lat: number

  constructor(pos: any) {
    const { lon, lat } = convertPosition(pos)
    this.lon = lon
    this.lat = lat
  }

  isValid(): boolean {
    if (!this.lon || !this.lat) return false
    if (this.lon < -180 || this.lon > 180) return false
    if (this.lat < -90 || this.lat > 90) return false
    if (isNaN(this.lon) || isNaN(this.lat)) return false

    return true
  }

  distanceTo(position: Position): number {
    return haversine(this, position)
  }

  toObject(): { lon: number; lat: number } {
    return { lon: this.lon, lat: this.lat }
  }

  toString(): string {
    return JSON.stringify(this.toObject(), null, 2)
  }
}

export default Position
