import { PositionType } from './Position'

export interface Address {
  position: PositionType
  name?: string
  street?: string
}
