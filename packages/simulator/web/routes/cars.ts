import {
  map,
  bufferTime,
  filter,
  last,
  mergeMap,
  groupBy,
  windowTime,
  Observable,
} from 'rxjs'
import { Socket } from 'socket.io'
import { Experiment } from '../../../../types/Experiment'
import Vehicle from '../../models/vehicles/Vehicle'

const register = (experiment: Experiment, socket: Socket): any[] => {
  return [
    experiment.cars
      .pipe(map((vehicle: Vehicle) => vehicle.toJson()))
      .subscribe((car) => {
        socket.emit('cars', [car])
      }),
    experiment.carUpdates
      .pipe(
        windowTime<Vehicle>(100), // start a window every x ms
        mergeMap((win: Observable<Vehicle>) =>
          win.pipe(
            groupBy((car) => car.id), // create a stream for each car in this window
            mergeMap((cars) => cars.pipe(last())) // take the last update in this window
          )
        ),
        filter((car: Vehicle) => {
          if (!car) return false
          if (car.vehicleType === 'bus' && !socket.data.emitBusUpdates)
            return false
          if (car.vehicleType === 'taxi' && !socket.data.emitTaxiUpdates)
            return false
          if (car.vehicleType === 'car' && !socket.data.emitCars) return false
          return true
        }),
        map((vehicle: Vehicle) => vehicle.toJson()),
        map((vehicle: Vehicle) => ({
          experimentId: experiment.parameters.id,
          ...vehicle,
        })),
        bufferTime(100, null, 100)
      )
      .subscribe((cars) => {
        if (!cars.length) return
        socket.volatile.emit('cars', cars)
      }),
    experiment.buses
      .pipe(
        map(cleanCars),
        map((vehicle: Vehicle) => ({
          experimentId: experiment.parameters.id,
          ...vehicle,
        }))
      )
      .subscribe((car) => {
        socket.volatile.emit('cars', [car])
      }),
  ]
}

export { register }
