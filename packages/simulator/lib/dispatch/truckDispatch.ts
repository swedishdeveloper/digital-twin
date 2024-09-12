import Booking from '../../models/Booking'
import Vehicle from '../../models/vehicles/Vehicle'

import Vroom from '../../lib/vroom'

export const findBestRouteToPickupBookings = async (
  truck: Vehicle,
  bookings: Booking[]
) => {
  const vehicles = [Vroom.truckToVehicle(truck, 0)]
  const shipments = bookings.map(Vroom.bookingToShipment)

  const result = await Vroom.plan({ shipments, vehicles })

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
