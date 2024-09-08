import Car from '../../models/vehicles/Car';
import Vehicle from '../../models/vehicles/Vehicle';
import Booking from '../../models/Booking';
import { virtualTime } from '../../models/VirtualTime';
import Position from '../../models/Position';
import { jest } from '@jest/globals';

const range = (length: number): number[] =>
  Array.from({ length }).map((_, i) => i)

describe('A car', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  let car: Car;

  beforeEach(() => {
    virtualTime.setTimeMultiplier(Infinity)
  })

  afterEach(() => {
    car.dispose()
  })

  it('should initialize correctly', function (done: jest.DoneCallback) {
    car = new Car({ id: '1', position: new Position(arjeplog) });
    expect(car.id).toHaveLength(9)
    done()
  })

  it('should have initial position', function (done: jest.DoneCallback) {
    car = new Car({ id: '1', position: new Position(arjeplog) });
    expect(car.position).toEqual(arjeplog)
    done()
  })

  it('should be able to teleport', function (done: jest.DoneCallback) {
    car = new Car({ id: '1', position: new Position(arjeplog) });
    car.navigateTo(new Position(ljusdal))
    car.once('stopped', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and navigate to pickup', function (done: jest.DoneCallback) {
    car = new Car({ id: '1', position: new Position(arjeplog) });
    car.handleBooking(
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
    car.once('pickup', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
    })

    car.once('dropoff', () => {
      expect(car.position?.lon).toEqual(arjeplog.lon)
      expect(car.position?.lat).toEqual(arjeplog.lat)
      done()
    })
  })

  it('should be able to pickup multiple bookings and queue the all except the first', function () {
    car = new Car({ id: '1', position: new Position(arjeplog) })
      new Booking({
        id: '1',
        pickup: {
          position: new Position(ljusdal),
        },
      })
    )
    car.once('pickup', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and emit correct events', function (done: jest.DoneCallback) {
    car = new Car({ id: '1', position: new Position(arjeplog) })
      new Booking({
        id: 1,
        pickup: {
          position: ljusdal,
        },
      })
    )
    car.once('pickup', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and emit correct events', function (done: jest.DoneCallback) {
    car = new Car({ id: '1', position: new Position(arjeplog) })
    car.handleBooking(
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
    expect(car.status).toEqual('pickup')
    car.on('pickup', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to pickup a booking and deliver it to its destination', function (done: jest.DoneCallback) {
    car = new Car({ id: '1', position: new Position(arjeplog) })
    car.handleBooking(
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
    car.once('pickup', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
    })

    car.once('dropoff', () => {
      expect(car.position?.lon).toEqual(arjeplog.lon)
      expect(car.position?.lat).toEqual(arjeplog.lat)
      done()
    })
  })

  it('should be able to pickup multiple bookings and queue the all except the first', function () {
    car = new Car({ id: '1', position: new Position(arjeplog) });
    car.handleBooking(
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

    expect(car.queue).toHaveLength(10)
  })

  it('should be able to handle the bookings from the same place in the queue', function (done: jest.DoneCallback) {
    car = new Car({ id: '1', position: new Position(arjeplog) });
    expect(car.queue).toHaveLength(0)
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

    car.handleBooking(
      new Booking({
        id: 1,
        ...ljusdalToArjeplog,
      })
    )

    const last = new Booking({
      id: 2,
      ...arjeplogToLjusdal,
    })
    car.handleBooking(last)

    const bookings = range(10).map((id) =>
      car.handleBooking(new Booking({ id: id.toString(), ...ljusdalToArjeplog }))
    )
      car.handleBooking(new Booking({ id, ...ljusdalToArjeplog }))
    )

    const [firstBooking, secondBooking] = bookings

    firstBooking.then(() => {
      expect(car.queue).toHaveLength(1)
    })

    secondBooking.then(() => {
      expect(car.queue).toHaveLength(1)
    })

    last.once('delivered', () => {
      expect(car.queue).toHaveLength(0)
      done()
    })

    expect(car.queue).toHaveLength(11)
  })
})
