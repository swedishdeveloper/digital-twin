import { toArray } from 'rxjs'
import { Experiment } from '../../../../types/Experiment'
import { Socket } from 'socket.io'

const register = (experiment: Experiment, socket: Socket) => {
  return [
    experiment.recycleCollectionPoints
      .pipe(toArray())
      .subscribe((recyclePoints) => {
        socket.emit('recycleCollectionPoints', recyclePoints)
      }),
  ]
}

module.exports = {
  register,
}
