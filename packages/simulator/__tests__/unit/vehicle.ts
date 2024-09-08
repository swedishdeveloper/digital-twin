import Vehicle from '../../models/vehicles/Vehicle';
import Booking from '../../models/Booking';
import { virtualTime } from '../../models/VirtualTime';
import Position from '../../models/Position';

const range = (length: number): number[] =>
  Array.from({ length }).map((_, i) => i)

describe('A vehicle', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  let vehicle: Vehicle;

  beforeEach(() => {
    virtualTime.setTimeMultiplier(Infinity)
  })

  afterEach(() => {
    vehicle.dispose()
  })

  it('should initialize correctly', function (done: jest.DoneCallback) {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) });
    expect(vehicle.id).toHaveLength(9)
    done()
  })

  it('should have initial position', function (done: jest.DoneCallback) {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) });
    expect(vehicle.position).toEqual(arjeplog)
    done()
  })

  it('should be able to teleport', function (done: jest.DoneCallback) {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) });
    vehicle.navigateTo(new Position(ljusdal))
    vehicle.once('stopped', () => {
      expect(vehicle.position?.lon).toEqual(ljusdal.lon)
      expect(vehicle.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and navigate to pickup', function (done: jest.DoneCallback) {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) });
    vehicle.handleBooking(
      new Booking({
        id: '1',
        pickup: {
          position: new Position(ljusdal),
        },
        destination: {
          position: new Position(arjeplog),
        },
      })
    )
    vehicle.once('pickup', () => {
      expect(vehicle.position?.lon).toEqual(ljusdal.lon)
      expect(vehicle.position?.lat).toEqual(ljusdal.lat)
    })

    vehicle.once('dropoff', () => {
      expect(vehicle.position?.lon).toEqual(arjeplog.lon)
      expect(vehicle.position?.lat).toEqual(arjeplog.lat)
      done()
    })
  })

  it('should be able to pickup multiple bookings and queue the all except the first', function () {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) });
    vehicle.handleBooking(
      new Booking({
        id: '1',
        pickup: {
          position: new Position(ljusdal),
        },
      })
    )
    vehicle.once('pickup', () => {
      expect(vehicle.position?.lon).toEqual(ljusdal.lon)
      expect(vehicle.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and emit correct events', function (done: jest.DoneCallback) {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) });
    vehicle.handleBooking(
      new Booking({
        id: 1,
        pickup: {
          position: ljusdal,
        },
      })
    )
    vehicle.once('pickup', () => {
      expect(vehicle.position?.lon).toEqual(ljusdal.lon)
      expect(vehicle.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and emit correct events', function (done: jest.DoneCallback) {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) })
    vehicle.handleBooking(
      new Booking({
        id: 1,
        pickup: {
          position: ljusdal,
        },
        destination: {
          position: arjeplog,
        },
      })
    )
    expect(vehicle.status).toEqual('pickup')
    vehicle.on('pickup', () => {
      expect(vehicle.position?.lon).toEqual(ljusdal.lon)
      expect(vehicle.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to pickup a booking and deliver it to its destination', function (done: jest.DoneCallback) {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) })
    vehicle.handleBooking(
      new Booking({
        id: 1,
        pickup: {
          position: ljusdal,
        },
        destination: {
          position: arjeplog,
        },
      })
    )
    vehicle.once('pickup', () => {
      expect(vehicle.position?.lon).toEqual(ljusdal.lon)
      expect(vehicle.position?.lat).toEqual(ljusdal.lat)
    })

    vehicle.once('dropoff', () => {
      expect(vehicle.position?.lon).toEqual(arjeplog.lon)
      expect(vehicle.position?.lat).toEqual(arjeplog.lat)
      done()
    })
  })

  it('should be able to pickup multiple bookings and queue the all except the first', function () {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) });
    vehicle.handleBooking(
      new Booking({
        id: 1,
        pickup: {
          position: ljusdal,
        },
        destination: {
          position: arjeplog,
        },
      })
    )

    expect(vehicle.queue).toHaveLength(10)
  })

  it('should be able to handle the bookings from the same place in the queue', function (done: jest.DoneCallback) {
    vehicle = new Vehicle({ id: '1', position: new Position(arjeplog) });
    expect(vehicle.queue).toHaveLength(0)
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

    vehicle.handleBooking(
      new Booking({
        id: 1,
        ...ljusdalToArjeplog,
      })
    )

    const last = new Booking({
      id: 2,
      ...arjeplogToLjusdal,
    })
    vehicle.handleBooking(last)

    const bookings = range(10).map((id) =>
      vehicle.handleBooking(new Booking({ id: id.toString(), ...ljusdalToArjeplog }))
    )
      vehicle.handleBooking(new Booking({ id, ...ljusdalToArjeplog }))
    )

    const [firstBooking, secondBooking] = bookings

    firstBooking.then(() => {
      expect(vehicle.queue).toHaveLength(1)
    })

    secondBooking.then(() => {
      expect(vehicle.queue).toHaveLength(1)
    })

    last.once('delivered', () => {
      expect(vehicle.queue).toHaveLength(0)
      done()
    })

    expect(vehicle.queue).toHaveLength(11)
  })
})
