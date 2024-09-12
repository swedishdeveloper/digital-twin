import moment from 'moment'
import { debug, error, info } from './log'
import { getFromCache, updateCache } from './cache'
import Queue from './Queue'
import Booking from '../models/Booking'
import Taxi from '../models/vehicles/Taxi'
import Truck from '../models/vehicles/Truck'

const vroomUrl: string =
  process.env.VROOM_URL || 'https://vroom.telge.iteam.pub/'

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const queue = new Queue()

class Vroom {
  static bookingToShipment({ id, pickup, destination }: Booking, i: number) {
    if (!pickup || !destination)
      throw new Error('Missing pickup or destination')
    return {
      id: i,
      //description: id,
      amount: [1],
      pickup: {
        time_windows: pickup.departureTime
          ? [
              [
                moment(pickup.departureTime, 'hh:mm:ss').unix(),
                moment(pickup.departureTime, 'hh:mm:ss')
                  .add(5, 'minutes')
                  .unix(),
              ],
            ]
          : undefined,
        id: i,
        location: [pickup?.position.lon, pickup.position.lat],
      },
      delivery: {
        id: i,
        location: [destination.position.lon, destination.position.lat],
        time_windows: destination.arrivalTime
          ? [
              [
                moment(destination.arrivalTime, 'hh:mm:ss').unix(),
                moment(destination.arrivalTime, 'hh:mm:ss')
                  .add(5, 'minutes')
                  .unix(),
              ],
            ]
          : undefined,
      },
    }
  }
  static taxiToVehicle(
    { position, passengerCapacity, heading, passengers }: Taxi,
    i: number
  ) {
    return {
      id: i,
      //description: id,
      capacity: [Math.max(1, passengerCapacity - (passengers?.length || 0))], // HACK: sometimes we will arrive here with -1 or 0 in capacity - we should fix that
      start: [position.lon, position.lat],
      end: heading ? [heading.lon, heading.lat] : undefined,
    }
  }
  static truckToVehicle(
    { position, parcelCapacity, heading, cargo }: Truck,
    i: number
  ) {
    return {
      id: i,
      //description: id,
      time_window: [
        moment('05:00:00', 'hh:mm:ss').unix(),
        moment('18:00:00', 'hh:mm:ss').unix(),
      ],
      capacity: [parcelCapacity - cargo.length],
      start: [position.lon, position.lat],
      end: heading ? [heading.lon, heading.lat] : undefined,
    }
  }
  static async plan({
    jobs,
    shipments,
    vehicles,
  }: {
    jobs: any[]
    shipments: any[]
    vehicles: any[]
  }): Promise<any> {
    if (shipments.length > 200) throw new Error('Too many shipments to plan')
    if (vehicles.length > 200) throw new Error('Too many vehicles to plan')
    if (vehicles.length < 2) throw new Error('Need at least 2 vehicles to plan')

    const result = await getFromCache({ jobs, shipments, vehicles })
    if (result) {
      debug('Vroom cache hit')
      return result
    }
    debug('Vroom cache miss')

    const before = Date.now()

    return await queue.enqueue(() =>
      fetch(vroomUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobs,
          shipments,
          vehicles,
          options: {
            plan: true,
          },
        }),
      })
        .then(async (res) =>
          !res.ok ? Promise.reject('Vroom error:' + (await res.text())) : res
        )
        .then((res) => res.json())
        .then((json) =>
          Date.now() - before > 10_000
            ? updateCache({ jobs, shipments, vehicles }, json) // cache when it takes more than 10 seconds
            : json
        )
        .catch((vroomError) => {
          error(`Vroom error: ${vroomError} (enable debug logging for details)`)
          info('Jobs', jobs?.length)
          info('Shipments', shipments?.length)
          info('Vehicles', vehicles?.length)
          return delay(2000).then(() =>
            Vroom.plan({ jobs, shipments, vehicles })
          )
        })
    )
  }
}

export default Vroom
