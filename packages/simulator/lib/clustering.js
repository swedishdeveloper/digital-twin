// lib/clustering.js

const { from, pipe, of } = require('rxjs')
const { map, mergeMap, groupBy, toArray, tap } = require('rxjs/operators')
const { reverseSearch } = require('./pelias')
const { plan, bookingToShipment, truckToVehicle } = require('./vroom')
const { info } = require('./log')

function addPostalCode(booking) {
  return from(
    (async () => {
      const { lat, lon } = booking.pickup.position
      const postalCode = await reverseSearch(lat, lon)
      booking.pickup.postalcode = postalCode
      return booking
    })()
  )
}

function groupBookingsByPostalCode(bookings) {
  return bookings.pipe(
    groupBy((booking) => booking.pickup.postalcode),
    mergeMap((group$) =>
      group$.pipe(
        toArray(),
        map((bookings) => ({ postalCode: group$.key, bookings }))
      )
    ),
    toArray()
  )
}

// Calculate the center of each cluster of bookings
function calculateCenters(groups) {
  return from(groups).pipe(
    // För varje grupp av bokningar
    map(({ postalCode, bookings }) => {
      const total = bookings.length
      // Beräkna medelvärdet för latitud och longitud
      const sumPosition = bookings.reduce(
        (acc, booking) => {
          acc.lat += booking.pickup?.position?.lat || 0
          acc.lon += booking.pickup?.position?.lon || 0
          return acc
        },
        { lat: 0, lon: 0 }
      )
      const center = {
        lat: sumPosition.lat / total,
        lon: sumPosition.lon / total,
      }
      return { postalCode, center, bookings }
    }),
    toArray()
  )
}

function convertToVroomCompatibleFormat() {
  return pipe(
    mergeMap(async ([bookings, cars]) => {
      info(`Fleet ${this.name} received ${bookings.length} bookings`)
      const shipments = bookings.map((booking, i) =>
        bookingToShipment(booking, i)
      )
      const vehicles = cars.map((truck, i) => truckToVehicle(truck, i))
      return { bookings, cars, shipments, vehicles }
    })
  )
}

function planWithVroom() {
  return pipe(
    mergeMap(async ({ bookings, cars, shipments, vehicles }) => {
      const vroomResponse = await plan({ shipments, vehicles })
      return { vroomResponse, cars, bookings }
    })
  )
}

function convertBackToBookings() {
  return pipe(
    mergeMap(({ vroomResponse, cars, bookings }) =>
      from(vroomResponse.routes).pipe(
        map((route) => {
          const car = cars[route.vehicle]
          const pickups = route.steps
            .filter(({ type }) => type === 'pickup')
            .map(({ id }) => bookings[id])
          return { car, bookings: pickups }
        }),
        map(({ car, bookings }) => ({
          car,
          bookings: bookings.flatMap(
            (booking) => booking?.groupedBookings || [booking]
          ),
        })),
        mergeMap(({ car, bookings }) =>
          from(bookings.map((booking) => ({ car, booking })))
        )
      )
    )
  )
}

function clusterByPostalCode(maxClusters = 200) {
  return pipe(
    mergeMap(({ bookings, cars }) => {
      if (bookings.length < maxClusters) return of({ bookings, cars })

      // only cluster when needed
      return from(bookings).pipe(
        groupBy((booking) => booking.pickup?.postalcode),
        mergeMap((group) =>
          group.pipe(
            toArray(),
            map((bookings) => ({ postalcode: group.key, bookings })),
            tap(({ postalcode, bookings }) =>
              info(
                `Cluster ${postalcode} with ${bookings.length} bookings created`
              )
            )
          )
        ),
        map(({ bookings }) => ({
          ...bookings[0], // pick the first booking in the cluster
          groupedBookings: bookings, // add the rest as grouped bookings so we can handle them later
        })),
        toArray(),
        mergeMap((clusters) => {
          const totalBookings = clusters.reduce(
            (sum, cluster) => sum + cluster.bookings.length,
            0
          )
          return from(clusters).pipe(
            mergeMap((cluster) => {
              const proportion = cluster.bookings.length / totalBookings
              const carsForCluster = Math.ceil(proportion * cars.length)
              const assignedCars = cars.splice(0, carsForCluster)
              return of({ bookings: cluster.bookings, cars: assignedCars })
            })
          )
        })
      )
    })
  )
}

module.exports = {
  addPostalCode,
  planWithVroom,
  groupBookingsByPostalCode,
  convertToVroomCompatibleFormat,
  convertBackToBookings,
  calculateCenters,
  clusterByPostalCode,
}
