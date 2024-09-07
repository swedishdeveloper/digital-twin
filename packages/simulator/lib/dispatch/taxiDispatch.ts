import Vroom from '../Vroom'
import moment from 'moment'
import { error, debug, write, info } from '../log'
import { virtualTime } from '../../models/VirtualTime'

type Taxi = {
  // Define the properties of a Taxi
}

type Booking = {
  pickup: {
    departureTime: string
  }
  // Define other properties of a Booking
}

const taxiDispatch = async (taxis: Taxi[], bookings: Booking[]) => {
  const vehicles = taxis.map(taxiToVehicle)
  const shipments = bookings.map(bookingToShipment) // TODO: concat bookings from existing vehicles with previous assignments
  info(
    `Finding optimal route for ${vehicles.length} taxis and ${shipments.length} pickups`
  )
  write('🚕')
  const result = await plan({ shipments, vehicles })
  const virtualNow = await virtualTime.getTimeInMillisecondsAsPromise()
  const now = moment(new Date(virtualNow))

  return result?.routes.map((route: any) => {
    write('✅')
    return {
      taxi: taxis[route.vehicle],
      bookings: route.steps
        .filter((s) => s.type === 'pickup')
        .flatMap((step) => {
          const booking = bookings[step.id]

          booking.pickup.departureTime = now
            .add(step.arrival - step.duration, 'seconds')
            .format('hh:mm:ss')

          return booking
        }),
    }
  })
}

const findBestRouteToPickupBookings = async (
  taxi: Taxi,
  bookings: Booking[]
) => {
  const vehicles = [Vroom.taxiToVehicle(taxi, 0)]
  const shipments = bookings.map(Vroom.bookingToShipment)

  const result = await Vroom.plan({ shipments, vehicles })

  if (!result || !result.routes || result.routes.length === 0) {
    error(`Unassigned bookings: ${result.unassigned}`)
    return null
  }

  return result.routes[0].steps
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

export { taxiDispatch, findBestRouteToPickupBookings }
