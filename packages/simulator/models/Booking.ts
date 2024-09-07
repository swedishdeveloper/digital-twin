import { virtualTime } from '../../lib/virtualTime'
import { safeId } from '../../lib/id'

import { ReplaySubject, merge } from 'rxjs'

import { BookingData } from '../../../types/BookingData'
import Position from './position'

class Booking {
  id: string
  status: string
  co2: number
  passenger: any
  type: string
  cost: number
  distance: number
  weight: number
  position: any
  pickup: { departureTime?: Date; position: Position }
  destination?: { arrivalTime?: Date; position: Position }
  queuedEvents: ReplaySubject<any>
  pickedUpEvents: ReplaySubject<any>
  assignedEvents: ReplaySubject<any>
  deliveredEvents: ReplaySubject<any>
  statusEvents: any
  queuedDateTime?: number
  car?: any
  assigned?: number
  pickupDateTime?: number
  pickupPosition?: any
  deliveredDateTime?: number
  deliveredPosition?: any
  deliveryTime?: number

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
    this.queuedEvents = new ReplaySubject()
    this.pickedUpEvents = new ReplaySubject()
    this.assignedEvents = new ReplaySubject()
    this.deliveredEvents = new ReplaySubject()
    this.statusEvents = merge(
      this.queuedEvents,
      this.assignedEvents,
      this.pickedUpEvents,
      this.deliveredEvents
    )
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
        this.pickedUpDateTime
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
    this.deliveryTime = ((await date) - (this.assigned || this.queued)) / 1000
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
      sender: this.sender,
      position: this.position?.toObject(),
      pickup: this.pickup,
      carId: this.car?.id,
      destination: this.destination,
      pickupPosition: this.pickupPosition?.toObject(),
      deliveredPosition: this.deliveredPosition?.toObject(),
      pickupDateTime: this.pickupDateTime,
      deliveredDateTime: this.deliveredDateTime,
      deliveryTime: this.deliveryTime,
      queued: this.queued,
      assigned: this.assigned,
    }
  }
}

export default Booking
