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
      .pipe(map((vehicle) => (vehicle as Vehicle).toJson()))
      .subscribe((car) => {
        socket.emit('cars', [car])
      }),
    experiment.carUpdates
      .pipe(
        EmitOneVehiclePer(100),
        map((vehicle) =>
          toJsonWithExperimentId(experiment)(vehicle as Vehicle)
        ),
        bufferTime(100, null, 100)
      )
      .subscribe(emitCars(socket)),
  ]
}
