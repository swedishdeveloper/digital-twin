import { Observable, ReplaySubject, VirtualAction, merge, share } from 'rxjs'

import Position from './Position'
import Vehicle from './vehicles/Vehicle'
import { VirtualTime } from './VirtualTime'
import { safeId } from '../lib/id'

interface BookingParams {
  id?: string
  sender?: string
  passenger?: any
  type?: string
  pickup: { departureTime?: Date; position: Position; name?: string }
  destination?: any
  virtualTime: VirtualTime
}

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

  queuedDateTime?: Date
  pickupDateTime?: Date
  pickupPosition?: Position
  deliveredDateTime?: Date
  deliveryTime?: number // seconds

  virtualTime: VirtualTime

  // REMOVE?
  deliveredPosition?: any

  constructor(booking: BookingParams) {
    Object.assign(this, booking)
    this.id =
      `${
        booking.sender ? booking.sender.replace(/&/g, '').toLowerCase() : 'b'
      }-` + safeId()
    this.status = 'unhandled'
    this.co2 = 0 //TODO: initialvärde?
    this.pickup = booking.pickup
    this.passenger = booking.passenger
    this.type = booking.type || 'parcel'
    this.cost = 0 // startkostnad?
    this.distance = 0 //TODO: räkna med sträcka innan?
    this.weight = Math.random() * 10 // kg TODO: find reference kg // TODO: passagerare väger mer..
    this.position = this.pickup?.position
    this.virtualTime = booking.virtualTime
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
    this.queuedDateTime = new Date(
      await this.virtualTime.getTimeInMillisecondsAsPromise()
    )
    this.status = 'queued'
    this.car = car
    this.queuedEvents.next(this)
  }

  async assign(car: any): Promise<void> {
    this.assigned = new Date(
      this.assigned || (await this.virtualTime.getTimeInMillisecondsAsPromise())
    )
    this.car = car
    this.status = 'assigned'
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
      (await this.virtualTime.getTimeInMillisecondsAsPromise()) -
        (this.pickupDateTime?.getTime() || 0)
    )
    this.distance += metersMoved
    this.cost += cost
    this.co2 += co2
  }

  async pickedUp(
    position: any,
    date: Promise<number> = this.virtualTime.getTimeInMillisecondsAsPromise()
  ): Promise<void> {
    this.pickupDateTime = new Date(await date)
    this.pickupPosition = position
    this.status = 'pickedUp'
    this.pickedUpEvents.next(this)
  }

  async delivered(
    position: any,
    date: Promise<number> = this.virtualTime.getTimeInMillisecondsAsPromise()
  ): Promise<void> {
    this.deliveredDateTime = new Date(await date)
    this.deliveredPosition = position
    this.deliveryTime =
      ((await date) -
        (this.assigned?.getTime() || this.queuedDateTime?.getTime() || 0)) /
      1000
    this.status = 'delivered'
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
