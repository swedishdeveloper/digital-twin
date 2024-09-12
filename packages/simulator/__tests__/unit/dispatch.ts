import { from, Subject, ReplaySubject, Subscription } from 'rxjs'
import { toArray, shareReplay } from 'rxjs/operators'
import { beforeEach, describe, it, expect, jest } from '@jest/globals'
import Booking from '../../models/Booking'
import Vehicle from '../../models/vehicles/Vehicle'
import Taxi from '../../models/vehicles/Taxi'
import { dispatch } from '../../lib/dispatch/dispatchCentral'
import Position from '../../models/Position'
import { VirtualTime } from '../../models/VirtualTime'

describe('dispatch', () => {
  const arjeplog = new Position({ lon: 17.886855, lat: 66.041054 })
  const ljusdal = new Position({ lon: 14.44681991219, lat: 61.59465992477 })
  const stockholm = new Position({ lon: 18.06324, lat: 59.334591 })
  let cars
  let bookings
  let virtualTime
  const subscriptions = [] as Subscription[]

  beforeEach(() => {
    virtualTime = new VirtualTime()
    virtualTime.setTimeMultiplier(Infinity)
    cars = from([
      new Vehicle({ id: '1', virtualTime, position: ljusdal }),
      new Vehicle({ id: '2', virtualTime, position: arjeplog }),
    ]).pipe(shareReplay())
    bookings = from([
      new Booking({
        id: '0',
        virtualTime,
        pickup: { position: ljusdal },
        destination: { position: arjeplog },
      }),
    ])
  })

  afterEach(() => {
    subscriptions.forEach((sub) => sub.unsubscribe())
  })

  it('should dispatch a booking to nearest car', function (done) {
    dispatch(cars, bookings).subscribe(({ car }) => {
      expect(car?.position).toEqual(ljusdal)
      done()
    })
  })

  it('should dispatch two booking to each nearest car', function (done) {
    bookings = from([
      new Booking({
        id: '1337',
        pickup: { position: arjeplog },
        virtualTime,
        destination: { position: ljusdal },
      }),
      new Booking({
        id: '1338',
        pickup: { position: ljusdal },
        virtualTime,
        destination: { position: arjeplog },
      }),
    ])
    dispatch(cars, bookings)
      .pipe(toArray())
      .subscribe(([booking1, booking2]) => {
        expect(booking1.car?.position).toEqual(arjeplog)
        expect(booking1.car?.id).toEqual(2)
        expect(booking2.car?.position).toEqual(ljusdal)
        expect(booking2.car?.id).toEqual(1)
        done()
      })
  })

  it('should dispatch two bookings even when they arrive async', function (done) {
    const bookingStream = new Subject<Booking>()
    subscriptions.push(
      dispatch(cars, bookingStream).subscribe((booking) => {
        if (booking.id === '1') {
          expect(booking.car?.position).toEqual(ljusdal)
          bookingStream.next(
            new Booking({
              id: '2',
              pickup: { position: arjeplog },
              virtualTime,
              destination: { position: ljusdal },
            })
          )
        } else {
          expect(booking.id).toEqual('2')
          done()
        }
      })
    )

    bookingStream.next(
      new Booking({
        id: '1',
        pickup: { position: ljusdal },
        virtualTime,
        destination: { position: arjeplog },
      })
    )
  })

  it('should have cars available even the second time', function (done) {
    const bookingStream = new Subject<Booking>()
    const cars = new ReplaySubject<Vehicle>()
    cars.next(new Vehicle({ position: ljusdal, virtualTime }))
    cars.next(new Vehicle({ position: arjeplog, virtualTime }))

    subscriptions.push(
      dispatch(cars, bookingStream).subscribe(({ id, car }) => {
        if (id === '1') {
          expect(car?.position).toEqual(ljusdal)
          bookingStream.next(
            new Booking({
              id: '2',
              pickup: { position: arjeplog },
              virtualTime,
              destination: { position: ljusdal },
            })
          )
        } else {
          expect(car?.position).toEqual(arjeplog)
          expect(id).toEqual('2')
          done()
        }
      })
    )

    bookingStream.next(
      new Booking({
        id: '1',
        pickup: { position: ljusdal },
        virtualTime,
        destination: { position: arjeplog },
      })
    )
  })

  it('should dispatch two bookings to one car', function (done) {
    cars = from([new Vehicle({ id: '1', position: ljusdal, virtualTime })])
    bookings = from([
      new Booking({
        id: '1337',
        pickup: { position: ljusdal, name: 'pickup 1' },
        virtualTime,
        destination: { position: arjeplog, name: 'dropoff 1' },
      }),
      new Booking({
        id: '1338',
        pickup: { position: arjeplog, name: 'pickup 2' },
        virtualTime,
        destination: { position: ljusdal, name: 'dropoff 2' },
      }),
    ])
    subscriptions.push(
      dispatch(cars, bookings)
        .pipe(toArray())
        .subscribe(([booking1, booking2]) => {
          jest.setTimeout(10000)

          expect(booking1.car?.id).toEqual(1)
          expect(booking1.id).toEqual(1337)
          expect(booking2.car?.id).toEqual(1)
          expect(booking2.id).toEqual(1338)
          booking1.deliveredEvents.subscribe((booking) => {
            expect(booking.id).toEqual(1337)
          })
          booking2.deliveredEvents.subscribe((booking) => {
            expect(booking.id).toEqual(1338)
            done()
          })
        })
    )
  })

  it('should dispatch three bookings to one car with only capacity for one and still deliver them all', function (done) {
    cars = from([
      new Taxi({
        id: '1',
        position: ljusdal,
        virtualTime,
        passengerCapacity: 1,
      }),
    ])
    bookings = from([
      new Booking({
        id: '1337',
        pickup: { position: ljusdal, name: 'pickup 1' },
        virtualTime,
        destination: { position: arjeplog, name: 'dropoff 1' },
      }),
      new Booking({
        id: '1338',
        pickup: { position: arjeplog, name: 'pickup 2' },
        virtualTime,
        destination: { position: stockholm, name: 'dropoff 2' },
      }),
      new Booking({
        id: '1339',
        pickup: { position: stockholm, name: 'pickup 3' },
        virtualTime,
        destination: { position: arjeplog, name: 'dropoff 3' },
      }),
    ])
    subscriptions.push(
      dispatch(cars, bookings)
        .pipe(toArray())
        .subscribe(([booking1, booking2, booking3]) => {
          expect(booking1.car?.id).toEqual(1)
          expect(booking1.id).toEqual(1337)
          expect(booking2.car?.id).toEqual(1)
          expect(booking2.id).toEqual(1338)
          expect(booking3.car?.id).toEqual(1)
          expect(booking3.id).toEqual(1339)

          booking1.deliveredEvents.subscribe((booking) => {
            expect(booking.id).toEqual(1337)
          })

          booking2.deliveredEvents.subscribe((booking) => {
            expect(booking.id).toEqual(1338)
          })

          booking3.deliveredEvents.subscribe((booking) => {
            expect(booking.id).toEqual(1339)
            done()
          })
        })
    )
  })
})
