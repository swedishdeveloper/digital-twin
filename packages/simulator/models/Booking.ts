import { Observable, ReplaySubject, merge, share } from 'rxjs'

import { BookingData } from '../../../types/BookingData'
import Position from './Position'
import Vehicle from './vehicles/Vehicle'

class Booking {
  id: string
  status: string
  co2: number
  passenger: any
  type: string
  cost: number
  distance: number
  weight: number
  position: Position
  pickup: { departureTime?: Date; position: Position }
  destination?: { arrivalTime?: Date; position: Position }
  queuedEvents: ReplaySubject<Booking>
  pickedUpEvents: ReplaySubject<Booking>
  assignedEvents: ReplaySubject<Booking>
  deliveredEvents: ReplaySubject<Booking>
  statusEvents: Observable<Booking>
  car?: Vehicle
  assigned?: Date

  queuedDateTime?: number // Date
  pickupDateTime?: number // Date
  pickupPosition?: Position
  deliveredDateTime?: number // Date
  deliveryTime?: number // seconds

  // REMOVE?
  deliveredPosition?: any

  constructor(booking: BookingData) {
    Object.assign(this, booking)
    this.id =
      `${
        booking.sender ? booking.sender.replace(/&/g, '').toLowerCase() : 'b'
      }-` + safeId()
    this.status = 'New'
    this.co2 = 0 //TODO: initialvärde?
    this.pickup = booking.pickup
    this.passenger = booking.passenger
    this.type = booking.type || 'parcel'
    this.cost = 0 // startkostnad?
    this.distance = 0 //TODO: räkna med sträcka innan?
    this.weight = Math.random() * 10 // kg TODO: find reference kg // TODO: passagerare väger mer..
    this.position = this.pickup?.position
    this.queuedEvents = new ReplaySubject<Booking>()
    this.pickedUpEvents = new ReplaySubject<Booking>()
    this.assignedEvents = new ReplaySubject<Booking>()
    this.deliveredEvents = new ReplaySubject<Booking>()
    this.statusEvents = merge(
      this.queuedEvents,
      this.assignedEvents,
      this.pickedUpEvents,
      this.deliveredEvents
    ).pipe(share())
  }

  async queued(car: any): Promise<void> {
    this.queuedDateTime = await virtualTime.getTimeInMillisecondsAsPromise()
    this.status = 'Queued'
    this.car = car
    this.queuedEvents.next(this)
  }

  async assign(car: any): Promise<void> {
    this.assigned =
      this.assigned || (await virtualTime.getTimeInMillisecondsAsPromise())
    this.car = car
    this.status = 'Assigned'
    this.assignedEvents.next(this)
  }

  async moved(
    position: any,
    metersMoved: number,
    co2: number,
    cost: number
  ): Promise<void> {
    this.position = position
    this.passenger?.moved(
      position,
      metersMoved,
      co2,
      cost,
      (await virtualTime.getTimeInMillisecondsAsPromise()) -
        (this.pickupDateTime || 0)
    )
    this.distance += metersMoved
    this.cost += cost
    this.co2 += co2
  }

  async pickedUp(
    position: any,
    date: Promise<number> = virtualTime.getTimeInMillisecondsAsPromise()
  ): Promise<void> {
    this.pickupDateTime = await date
    this.pickupPosition = position
    this.status = 'Picked up'
    this.pickedUpEvents.next(this)
  }

  async delivered(
    position: any,
    date: Promise<number> = virtualTime.getTimeInMillisecondsAsPromise()
  ): Promise<void> {
    this.deliveredDateTime = await date
    this.deliveredPosition = position
    this.deliveryTime =
      ((await date) - (this.assigned || this.queuedDateTime || 0)) / 1000
    this.status = 'Delivered'
    this.deliveredEvents.next(this)
  }

  toObject(): object {
    return {
      id: this.id,
      status: this.status,
      type: this.type,
      co2: this.co2,
      cost: this.cost,
      distance: this.distance,
      weight: this.weight,
      position: this.position?.toObject(),
      pickup: this.pickup,
      carId: this.car?.id,
      destination: this.destination,
      pickupPosition: this.pickupPosition?.toObject(),
      deliveredPosition: this.deliveredPosition?.toObject(),
      pickupDateTime: this.pickupDateTime,
      deliveryTime: this.deliveryTime,
      queued: this.queued,
      deliveredDateTime: this.deliveredDateTime,
      assigned: this.assigned,
    }
  }
}

export default Booking
