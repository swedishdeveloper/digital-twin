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
    experiment.carUpdates.pipe(
      windowTime<Vehicle>(100),
      mergeMap(processWindow),
      filter(filterCars),
      map(toJsonWithExperimentId),
      bufferTime(100, null, 100)
    ).subscribe(emitCars(socket)),
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
function processWindow(win: Observable<Vehicle>): Observable<Vehicle> {
  return win.pipe(
    groupBy((car) => car.id),
    mergeMap((cars) => cars.pipe(last()))
  );
}

function filterCars(car: Vehicle): boolean {
  if (!car) return false;
  if (car.vehicleType === 'bus' && !socket.data.emitBusUpdates) return false;
  if (car.vehicleType === 'taxi' && !socket.data.emitTaxiUpdates) return false;
  if (car.vehicleType === 'car' && !socket.data.emitCars) return false;
  return true;
}

function toJsonWithExperimentId(vehicle: Vehicle): any {
  return {
    experimentId: experiment.parameters.id,
    ...vehicle.toJson(),
  };
}

function emitCars(socket: Socket) {
  return (cars: any[]) => {
    if (!cars.length) return;
    socket.volatile.emit('cars', cars);
  };
}
