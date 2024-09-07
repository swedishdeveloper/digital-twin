import {
  map,
  bufferTime,
  filter,
  last,
  mergeMap,
  groupBy,
  windowTime,
  Observable,
  pipe,
} from 'rxjs'
import { Socket } from 'socket.io'
import { Experiment } from '../../../../types/Experiment'
import Vehicle from '../../models/vehicles/Vehicle'

function EmitOneVehiclePer(ms) {
  return pipe(
    windowTime<Vehicle>(ms),
    mergeMap((win: Observable<Vehicle>) =>
      win.pipe(
        groupBy((car) => car.id),
        mergeMap((cars) => cars.pipe(last()))
      )
    )
  )
}

const filterCars =
  ({
    emitBusUpdates,
    emitTaxiUpdates,
    emitCars,
  }: {
    emitBusUpdates: boolean
    emitTaxiUpdates: boolean
    emitCars: boolean
  }) =>
  (car: Vehicle) => {
    if (!car) return false
    if (car.vehicleType === 'bus' && !emitBusUpdates) return false
    if (car.vehicleType === 'taxi' && !emitTaxiUpdates) return false
    if (car.vehicleType === 'car' && !emitCars) return false
    return true
  }

const toJsonWithExperimentId = (experiment) => (vehicle: Vehicle) => ({
  experimentId: experiment.parameters.id,
  ...vehicle.toJson(),
})

function emitCars(socket: Socket) {
  return (cars: any[]) => {
    if (!cars.length) return
    socket.volatile.emit('cars', cars)
  }
}

export const register = (experiment: Experiment, socket: Socket): any[] => {
  return [
    experiment.cars
      .pipe(map((vehicle: Vehicle) => vehicle.toJson()))
      .subscribe((car) => {
        socket.emit('cars', [car])
      }),
    experiment.carUpdates
      .pipe(
        EmitOneVehiclePer(100),
        filter(filterCars(socket.data)),
        map(toJsonWithExperimentId(experiment)),
        bufferTime(100, null, 100)
      )
      .subscribe(emitCars(socket)),
    experiment.buses
      .pipe(
        map((vehicle: Vehicle) => vehicle.toJson()),
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
