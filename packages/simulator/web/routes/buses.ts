import { toArray } from 'rxjs'
import { Socket } from 'socket.io'
import { Experiment } from '../../../../types/Experiment'

const register = (experiment: Experiment, socket: Socket): void => {
  return [
    experiment.busStops
      .pipe(toArray())
      .subscribe((busStops) => socket.emit('busStops', busStops)),

    experiment.lineShapes
      .pipe(toArray())
      .subscribe((lineShapes) => socket.emit('lineShapes', lineShapes)),
  ]
}

export { register }
