import Position from '../Position'
import Truck from './Truck'

interface RecycleTruck {
  recycleCapacity: number
  position: Position
}

class RecycleTruck extends Truck {
  constructor(args: RecycleTruck) {
    super(args)
    this.vehicleType = 'recycleTruck'

    this.position = args.position
    this.startPosition = args.startPosition || args.position
  }
}

export default RecycleTruck
