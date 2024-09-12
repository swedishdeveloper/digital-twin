import Municipality from '../../models/Municipality'
import Booking from '../../models/Booking'
import { VirtualTime } from '../../models/VirtualTime'

import { dispatch } from '../../lib/dispatch/dispatchCentral'
import { from, take } from 'rxjs'
import Position from '../../models/Position'

jest.mock('../../lib/dispatch/dispatch', () => ({
  dispatch: jest.fn(),
}))

describe('A municipality', () => {
  const arjeplog = new Position({ lon: 17.886855, lat: 66.041054 })
  const ljusdal = new Position({ lon: 14.44681991219, lat: 61.59465992477 })
  const squares = from([])
  let fleets
  let municipality
  let virtualTime = new VirtualTime()

  let testBooking = new Booking({
    id: 'b-123',
    passenger: null,
    type: 'taxi',
    virtualTime,
    pickup: { departureTime: new Date(), position: arjeplog },
    destination: ljusdal,
  })

  beforeEach(() => {
    virtualTime = new VirtualTime()
    virtualTime.setTimeMultiplier(Infinity)
    fleets = [
      { name: 'postnord', marketshare: 1, numberOfCars: 1, hub: arjeplog },
    ]
    jest.clearAllMocks()
  })

  afterEach(() => {
    // municipality.dispose()
  })

  it('should initialize correctly', function () {
    municipality = new Municipality({
      name: 'stockholm',
      squares,
      geometry: null,
      id: 'm-123',
      email: 'test@example.com',
      zip: '12345',
      center: null,
      telephone: '123456789',
      fleets,
    })
    expect(municipality.name).toBe('stockholm')
  })

  it('dispatches handled bookings', function () {
    municipality = new Municipality({
      id: '1',
      name: 'stockholm',
      squares,
      fleets,
    })
    municipality.handleBooking(testBooking)

    expect(dispatch).toHaveBeenCalled()
  })

  it('handled bookings are dispatched', function (done) {
    municipality = new Municipality({
      id: '1',
      name: 'stockholm',
      squares,
      fleets,
    })
    municipality.handleBooking(testBooking)

    municipality.dispatchedBookings.pipe(take(1)).subscribe(({ booking }) => {
      expect(booking.fleet.name).toBe('postnord')
      expect(booking.id).toBe(testBooking.id)
      done()
    })
  })
})
