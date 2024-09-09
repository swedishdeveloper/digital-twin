import Municipality from '../../models/Municipality'
import Booking from '../../models/Booking'
import { virtualTime } from '../../models/VirtualTime'

import * as dispatch from '../../lib/dispatch/taxiDispatch'
import { from } from 'rxjs'

jest.mock('../../lib/dispatch/taxiDispatch')

describe('A municipality', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  const squares = from([])
  let fleets
  let municipality

  let testBooking = new Booking({
    id: 'b-123',
    passenger: null,
    type: 'taxi',
    pickup: { departureTime: new Date(), position: arjeplog },
    destination: ljusdal,
  })

  beforeEach(() => {
    virtualTime.setTimeMultiplier(Infinity)
    fleets = [
      { name: 'postnord', marketshare: 1, numberOfCars: 1, hub: arjeplog },
    ]
    jest.clearAllMocks()
  })

  afterEach(() => {
    // municipality.dispose()
  })

  it('should initialize correctly', function (done) {
    municipality = new Municipality({
      name: 'stockholm',
      squares,
      geometry: null,
      id: 'm-123',
      email: 'test@example.com',
      zip: '12345',
      center: null,
      co2: 0,
      telephone: '123456789',
      fleets,
    })
    expect(municipality.name).toBe('stockholm')
    done()
  })

  it('dispatches handled bookings', function () {
    municipality = new Municipality({
      id: '1',
      name: 'stockholm',
      squares,
      fleets,
    })
    municipality.handleBooking(testBooking)

    expect(dispatch.taxiDispatch.mock.calls.length).toBe(1)
  })

  it('handled bookings are dispatched', function (done) {
    dispatch.taxiDispatch((cars, bookings) =>
      bookings.pipe(
        map((booking) => ({
          booking,
          car: { id: 1 },
        }))
      )
    )

    municipality = new Municipality({ name: 'stockholm', squares, fleets })
    municipality.handleBooking(testBooking)

    municipality.dispatchedBookings.pipe(first()).subscribe(({ booking }) => {
      expect(booking.fleet.name).toBe('postnord')
      expect(booking.id).toBe(testBooking.id)
      done()
    })
  })
})
