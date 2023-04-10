const moment = require('moment')
const { info, warn } = require('../log')
const { plan } = require('../vroom')

const correctTime = (time) => {
  const regex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/
  const [, year, month, day, hour, minute, second] = time.match(regex)

  // month is 0-indexed
  // hours can be above 24 therefore we use the internal Date constructor
  // which handles this and shifts the date accordingly- ie 2023-04-01 25:00:00 -> 2023-04-02 01:00:00
  return new Date(year, month - 1, day, hour, minute, second)
}

const unix = (str) => moment(correctTime(str), 'HH:mm:ss').unix()

const MAX_SHIPMENTS = 500

const tripToShipment = ({ tripId, firstStop, lastStop }, i) => ({
  id: i,
  description: tripId,
  amount: [1],
  pickup: {
    time_windows: [
      [unix(firstStop.arrivalTime), unix(firstStop.departureTime) + 1],
    ],
    id: i,
    location: [firstStop.position.lon, firstStop.position.lat],
  },
  delivery: {
    id: i,
    location: [lastStop.position.lon, lastStop.position.lat],
    time_windows: [
      [unix(lastStop.arrivalTime), unix(lastStop.departureTime) + 1],
    ],
  },
})

const busToVehicle = ({ id, position, passengerCapacity, heading }, i) => ({
  id: i,
  description: id,
  capacity: [passengerCapacity],
  start: [position.lon, position.lat],
  speed_factor: 1.2,
  end: heading ? [heading.lon, heading.lat] : undefined,
})

/**
 * Take two streams- buses and trips
 * Pass them to VROOM and get back assignments:
 *   Array of:
 *     bus: Object(Bus)
 *     trips: Array of trips including each stop
 * @param {*} buses
 * @param {*} trips
 * @returns { assigned, unassigned}
 */

const busDispatch = async (buses, trips) => {
  // if we have more than 2000 trips, split the problem in two - recursively
  if (trips.length > MAX_SHIPMENTS)
    return Promise.all([
      busDispatch(
        buses.slice(0, buses.length / 2),
        trips.slice(0, trips.length / 2)
      ),
      busDispatch(
        buses.slice(buses.length / 2),
        trips.slice(trips.length / 2)
      ).then((a, b) => a.concat(b)),
    ])
  const shipments = trips.map(tripToShipment)
  const vehicles = buses.map(busToVehicle)

  const kommunName = trips[0].kommun
  info(
    `Calling vroom for ${kommunName} with ${vehicles.length} buses and ${shipments.length} trips`
  )

  const result = await plan({
    shipments: shipments,
    vehicles: vehicles,
  })

  const unassigned = result.unassigned
    .filter((s) => s.type === 'pickup')
    .map((step) => trips[step.id].tripId)
  if (unassigned.length)
    warn(`Unassigned in ${kommunName}: ${unassigned.length}`)
  return result.routes.map((route) => {
    const toFirstStop = stepToBookingEntity(route.steps[0])
    const toHub = stepToBookingEntity(route.steps[route.steps.length - 1])

    return {
      bus: buses[route.vehicle],
      stops: [toFirstStop].concat(
        route.steps
          .filter((s) => s.type === 'pickup')
          .flatMap((step) => trips[step.id].stops),
        [toHub]
      ),
    }
  })
}

const stepToBookingEntity = ({
  waiting_time,
  arrival: departureTime,
  location: [lon, lat],
}) => ({
  // TODO: decide if we want to use departureTime or timeWindows
  departureTime: moment((departureTime + waiting_time) * 1000).format(
    'HH:mm:ss'
  ),
  arrivalTime: moment((departureTime + waiting_time) * 1000).format('HH:mm:ss'),
  position: { lat, lon },
})

module.exports = {
  busDispatch,
}
