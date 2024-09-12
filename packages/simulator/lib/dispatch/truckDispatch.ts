import Booking from '../../models/Booking'
import Truck from '../../models/vehicles/Truck'

const { plan, truckToVehicle, bookingToShipment } = require('../vroom')
const { error } = require('../log')

export const findBestRouteToPickupBookings = async (
  truck: Truck,
  bookings: Booking[]
) => {
  const vehicles = [truckToVehicle(truck, 0)]
  const shipments = bookings.map(bookingToShipment)

  const result = await plan({ shipments, vehicles })

  if (result.unassigned?.length > 0) {
    error(`Unassigned bookings: ${result.unassigned}`)
  }

  return result.routes[0]?.steps
    .filter(({ type }) => ['pickup', 'delivery', 'start'].includes(type))
    .map(({ id, type, arrival, departure }) => {
      const booking = bookings[id]
      const instruction = {
        action: type,
        arrival,
        departure,
        booking,
      }
      return instruction
    })
}
