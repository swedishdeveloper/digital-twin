import Booking from '../Booking'
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
  canHandleBooking(booking: Booking): boolean {
    return (
      booking.type === 'recycleBin' && this.cargo.length < this.parcelCapacity!
    )
  }
}

export default RecycleTruck
