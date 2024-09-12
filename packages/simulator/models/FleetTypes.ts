import Position from './models/Position'

export interface FleetConstructorArgs {
  name: string
  marketshare: number
  vehicles: Record<string, number>
  hub: any
  type: string
  municipality: any
}
