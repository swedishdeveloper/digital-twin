import {
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} from '@jest/globals'
import Booking from '../../models/Booking'
import Fleet from '../../models/Fleet'
import Position from '../../models/Position'
import { first, from } from 'rxjs'
import { VirtualTime } from '../../models/VirtualTime'
import { dispatch } from '../../lib/dispatch/dispatchCentral'

jest.mock('../../lib/dispatch/dispatchCentral', () => ({
  dispatch: jest.fn(),
}))

describe('A fleet', () => {
  const arjeplog = {
    position: new Position({ lon: 17.886855, lat: 66.041054 }),
  }
  const ljusdal = {
    position: new Position({ lon: 14.44681991219, lat: 61.59465992477 }),
  }
  let fleet
  let virtualTime = new VirtualTime()

  let testBooking = new Booking({
    id: '0',
    virtualTime,
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
      vehicles: { taxi: 1 },
      marketshare: 1,
      hub: arjeplog,
    })
    expect(fleet.name).toBe('postnord')
    done()
  })

  it('dispatches handled bookings', function () {
    fleet = new Fleet({
      name: 'postnord',
      marketshare: 1,
      vehicles: { taxi: 1 },
      hub: arjeplog,
    })
    fleet.handleBooking(testBooking)

    expect(dispatch).toBeCalled()
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
      vehicles: {
        taxi: 1,
      },
      hub: arjeplog,
    })
    fleet.handleBooking(testBooking)

    fleet.dispatchedBookings.pipe(first()).subscribe(({ booking }) => {
      expect(booking.id).toBe(testBooking.id)
    })
  })
})
