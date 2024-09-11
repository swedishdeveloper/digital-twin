import { PositionType } from './Position'

export interface VehicleType {
  id: string
  type: string
  position: PositionType
  heading?: PositionType
  speed?: number,
  bearing?: number,
  status: string,
  fleet?: string,
  co2?: number,
  distance?: number,
  ema?: number,
  cargo: number,
  passengers: number,
  queue: number,
}