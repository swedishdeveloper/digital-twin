const { findBestRouteToPickupBookings } = require('../dispatch/truckDispatch')
const { info, warn, debug } = require('../log')
const { clusterPositions } = require('../../lib/kmeans')
const Vehicle = require('./vehicle')
const {
  firstValueFrom,
  merge,
  from,
  mergeMap,
  mergeAll,
  toArray,
} = require('rxjs')

class Truck extends Vehicle {
  constructor(args) {
    super(args)
    this.vehicleType = 'truck'
    this.isPrivateCar = false
    this.co2PerKmKg = 0.000065 // NOTE: From a quick google. Needs to be verified.
    this.parcelCapacity = args.parcelCapacity || 250
    this.plan = []

    this.position = args.position
    this.startPosition = args.startPosition || args.position
    this.recyclingTypes = args.recyclingTypes
  }

  async pickNextInstructionFromPlan() {
    this.instruction = this.plan.shift()
    this.booking = this.instruction?.booking
    this.status = this.instruction?.action || 'returning'
    this.statusEvents.next(this)
    switch (this.status) {
      case 'start':
        return this.navigateTo(this.startPosition)
      case 'pickup':
        this.status = 'toPickup'
        return this.navigateTo(this.booking.pickup.position)
      case 'delivery':
      case 'end':
      case 'ready':
      case 'returning':
        this.status = 'ready'
        return this.navigateTo(this.startPosition)
      default:
        warn('Unknown status', this.status, this.instruction)
        if (!this.plan.length) this.status = 'returning'
        return this.navigateTo(this.startPosition)
    }
  }

  stopped() {
    super.stopped()
    //If no more jobs, set position to start position
    if (!this.plan.length) {
      this.position = this.startPosition
      this.movedEvents.next(this)
    } else {
      this.pickNextInstructionFromPlan()
    }
  }

  async pickup() {
    // Wait 1 minute to simulate loading/unloading
    // this.simulate(false) // pause interpolation while we wait
    // await virtualTime.wait(60_000)
    if (!this.booking) return warn('No booking to pickup', this.id)
    if (this.cargo.indexOf(this.booking) > -1)
      return warn('Already picked up', this.id, this.booking.id)

    debug('Pickup cargo', this.id, this.booking.id)
    // this.cargo = [...this.cargo, this.booking?.passenger]
    this.cargo.push(this.booking)
    this.cargoEvents.next(this)
    this.booking.pickedUp(this.position)
  }

  async dropOff() {
    this.cargo = this.cargo.filter((p) => p !== this.booking)
    this.cargoEvents.next(this)
    this.booking.delivered(this.position)
  }

  canHandleBooking(booking) {
    return booking && this.queue.length < this.parcelCapacity
  }

  async handleBooking(booking) {
    if (this.queue.indexOf(booking) > -1) throw new Error('Already queued')
    this.queue.push(booking)
    booking.assign(this)
    booking.queued(this)

    clearTimeout(this._timeout)
    this._timeout = setTimeout(async () => {
      if (this.queue.length > 100) {
        const clusters = (
          await clusterPositions(this.queue, Math.ceil(this.queue.length / 70))
        ).sort(
          (a, b) =>
            this.position.distanceTo(a.center) -
            this.position.distanceTo(b.center)
        )

        this.plan = await firstValueFrom(
          from(clusters).pipe(
            mergeMap(
              async (cluster) =>
                await findBestRouteToPickupBookings(this, cluster.items, [
                  'pickup',
                ]),
              1
            ),
            mergeAll(), // flatten the arrays
            toArray()
          )
        )
        //console.log('Plan', this.plan)
      } else {
        this.plan = await findBestRouteToPickupBookings(this, this.queue)
      }
      if (!this.instruction) await this.pickNextInstructionFromPlan()
    }, 2000)

    return booking
  }

  async waitAtPickup() {
    return // NOTE: Trucks don't wait at pickup
  }
}

module.exports = Truck
