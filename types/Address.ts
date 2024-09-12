import Position from "../packages/simulator/models/Position"

export interface Address {
  position: Position
  name?: string
  street?: string
}
