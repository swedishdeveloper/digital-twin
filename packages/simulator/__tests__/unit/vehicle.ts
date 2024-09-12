import Vehicle from '../../models/vehicles/Vehicle'
import Booking from '../../models/Booking'
import { VirtualTime } from '../../models/VirtualTime'
import Position from '../../models/Position'
import {
  filter,
  firstValueFrom,
  map,
  Observable,
  Subscription,
  take,
  tap,
  toArray,
} from 'rxjs'
import exp from 'constants'

const range = (length: number): number[] =>
  Array.from({ length }).map((_, i) => i)

describe('A vehicle', () => {
  const arjeplog = new Position({ lon: 17.886855, lat: 66.041054 })
  const ljusdal = new Position({ lon: 14.44681991219, lat: 61.59465992477 })

  const ljusdalToArjeplog = {
    pickup: {
      position: ljusdal,
    },
    destination: {
      position: arjeplog,
    },
  }

  const arjeplogToLjusdal = {
    pickup: {
      position: arjeplog,
    },
    destination: {
      position: ljusdal,
    },
  }

  let vehicle: Vehicle
  let subscriptions = [] as Subscription[]
  let virtualTime

  beforeEach(() => {
    virtualTime = new VirtualTime()
    virtualTime.setTimeMultiplier(Infinity)
  })

  afterEach(() => {
    subscriptions.forEach((sub) => sub.unsubscribe())
  })

  const on = async (stream: Observable<Booking | Vehicle>, event: string) => {
    return new Promise((resolve) => {
      stream
        .pipe(
          filter((vehicle) => vehicle.status === event),
          take(1)
        )
        .subscribe((vehicle) => {
          resolve(vehicle)
        })
    })
  }

  it('should initialize correctly', function () {
    vehicle = new Vehicle({
      virtualTime,
      position: new Position(arjeplog),
    })
    expect(vehicle.id).toHaveLength(11)
  })

  it('should have initial position', function () {
    vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })
    expect(vehicle.position).toEqual(arjeplog)
  })

  it('should be able to teleport', async function () {
    virtualTime.setTimeMultiplier(Infinity)
    vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })
    vehicle.navigateTo(new Position(ljusdal))
    await on(vehicle.statusEvents, 'stopped')
    expect(vehicle.position?.lon).toEqual(ljusdal.lon)
    expect(vehicle.position?.lat).toEqual(ljusdal.lat)
  })

  it('should be able to handle one booking and navigate to pickup', async function () {
    vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })
    await vehicle.handleBooking(
      new Booking({
        id: '1',
        virtualTime,
        pickup: {
          position: new Position(ljusdal),
        },
      })
    )
    await on(vehicle.statusEvents, 'atPickup')
    expect(vehicle.position?.lon).toEqual(ljusdal.lon)
    expect(vehicle.position?.lat).toEqual(ljusdal.lat)
  })
  it('should handle status events in the correct order', async function () {
    // Skapa ett fordon
    const vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })

    // Hantera bokning med pickup i Ljusdal och destination i Arjeplog
    await vehicle.handleBooking(
      new Booking({
        id: '1',
        virtualTime,
        pickup: {
          position: new Position(ljusdal),
        },
        destination: {
          position: new Position(arjeplog),
        },
      })
    )

    // Fånga de första fyra statusuppdateringarna från fordonet
    const log = await firstValueFrom(
      vehicle.statusEvents.pipe(
        map((vehicle) => vehicle.status),
        take(4),
        toArray()
      )
    )

    // Förväntat statusflöde: 'toPickup', 'atPickup', 'toDelivery', 'atDropoff'
    expect(log).toEqual(['toPickup', 'atPickup', 'toDelivery', 'atDropoff'])
  })

  it('should be able to handle one booking and navigate to pickup and continue to dropoff', async function () {
    vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })
    await vehicle.handleBooking(
      new Booking({
        id: '1',
        virtualTime,
        pickup: {
          position: new Position(ljusdal),
        },
        destination: {
          position: new Position(arjeplog),
        },
      })
    )
    await on(vehicle.statusEvents, 'atPickup')
    expect(vehicle.position?.lon).toEqual(ljusdal.lon)
    expect(vehicle.position?.lat).toEqual(ljusdal.lat)

    await on(vehicle.statusEvents, 'atDropoff')
    expect(vehicle.position?.lon).toEqual(arjeplog.lon)
    expect(vehicle.position?.lat).toEqual(arjeplog.lat)
  })

  it('should be able to pickup multiple bookings and queue the all except the first', async function () {
    vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })
    vehicle.handleBooking(
      new Booking({
        id: '1',
        virtualTime,
        pickup: {
          position: new Position(ljusdal),
        },
      })
    )
    await on(vehicle.statusEvents, 'atPickup')

    expect(vehicle.position?.lon).toEqual(ljusdal.lon)
    expect(vehicle.position?.lat).toEqual(ljusdal.lat)
  })

  it('should be able to handle one booking and emit correct events', async function () {
    vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })
    vehicle.handleBooking(
      new Booking({
        id: '1',
        virtualTime,
        pickup: {
          position: ljusdal,
        },
      })
    )
    await on(vehicle.statusEvents, 'atPickup')
  })

  it('should be able to handle one booking and emit correct events', async function () {
    vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })
    vehicle.handleBooking(
      new Booking({
        id: '1',
        virtualTime,
        pickup: {
          position: ljusdal,
        },
        destination: {
          position: arjeplog,
        },
      })
    )
    expect(vehicle.status).toEqual('toPickup')
    await on(vehicle.statusEvents, 'atPickup')
    expect(vehicle.position?.lon).toEqual(ljusdal.lon)
    expect(vehicle.position?.lat).toEqual(ljusdal.lat)
  })

  it('should be able to pickup a booking and deliver it to its destination', async function () {
    vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })
    vehicle.handleBooking(
      new Booking({
        id: '1',
        virtualTime,
        pickup: {
          position: ljusdal,
        },
        destination: {
          position: arjeplog,
        },
      })
    )
    await on(vehicle.statusEvents, 'atPickup')
    expect(vehicle.position?.lon).toEqual(ljusdal.lon)
    expect(vehicle.position?.lat).toEqual(ljusdal.lat)

    await on(vehicle.statusEvents, 'atDropoff')
    expect(vehicle.position?.lon).toEqual(arjeplog.lon)
    expect(vehicle.position?.lat).toEqual(arjeplog.lat)
  })

  it('should be able to pickup multiple bookings and queue the all except the first', function () {
    vehicle = new Vehicle({
      virtualTime,
      position: new Position(arjeplog),
    })
    vehicle.handleBooking(
      new Booking({
        virtualTime,
        pickup: {
          position: ljusdal,
        },
      })
    )
    vehicle.handleBooking(
      new Booking({
        virtualTime,
        pickup: {
          position: arjeplog,
        },
        destination: {
          position: ljusdal,
        },
      })
    )

    expect(vehicle.queue).toHaveLength(1)
  })

  it('should be able to handle the bookings from the same place in the queue', async function () {
    vehicle = new Vehicle({
      id: '1',
      virtualTime,
      position: new Position(arjeplog),
    })
    expect(vehicle.queue).toHaveLength(0)

    await vehicle.handleBooking(
      new Booking({
        id: '1',
        virtualTime,
        ...ljusdalToArjeplog,
      })
    )
    expect(vehicle.queue).toHaveLength(0)
    expect(vehicle.status).toEqual('toPickup')
    const backtrip = new Booking({
      id: '2',
      virtualTime,
      ...arjeplogToLjusdal,
    })
    vehicle.handleBooking(backtrip)

    range(10).map((id) =>
      vehicle.handleBooking(
        new Booking({ id: id.toString(), virtualTime, ...ljusdalToArjeplog })
      )
    )
    expect(vehicle.queue).toHaveLength(11)

    on(backtrip.statusEvents, 'delivered').then(() => {
      expect(vehicle.queue).toHaveLength(0)
    })
  })
})
