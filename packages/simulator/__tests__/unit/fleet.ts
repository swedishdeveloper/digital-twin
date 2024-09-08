import Fleet from '../../lib/fleet';
import { first, from } from 'rxjs';
import Booking from '../../lib/booking';
import { virtualTime } from '../../lib/virtualTime';
import dispatch from '../../lib/dispatchCentral';
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

jest.mock('../../lib/dispatchCentral');

describe('A fleet', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  let fleet

  let testBooking = new Booking({
    pickup: arjeplog,
    destination: ljusdal,
  })

  beforeEach(() => {
    virtualTime.setTimeMultiplier(Infinity)
    jest.clearAllMocks()
  })

  afterEach(() => {
    // fleet.dispose()
  })

  it('should initialize correctly', function (done) {
    fleet = new Fleet({
      name: 'postnord',
      marketshare: 1,
      numberOfCars: 1,
      hub: arjeplog,
    })
    expect(fleet.name).toHaveLength(8)
    done()
  })

  it('dispatches handled bookings', function () {
    fleet = new Fleet({
      name: 'postnord',
      marketshare: 1,
      numberOfCars: 1,
      hub: arjeplog,
    })
    fleet.handleBooking(testBooking)

    expect(dispatch.dispatch.mock.calls.length).toBe(1)
  })

  it('handled bookings are dispatched', function () {
    dispatch.dispatch.mockImplementation(() =>
      from([
        {
          booking: testBooking,
          car: { id: 1 },
        },
      ])
    )

    fleet = new Fleet({
      name: 'postnord',
      marketshare: 1,
      numberOfCars: 1,
      hub: arjeplog,
    })
    fleet.handleBooking(testBooking)

    fleet.dispatchedBookings.pipe(first()).subscribe(({ booking }) => {
      expect(booking.id).toBe(testBooking.id)
    })
  })
})
