import { Socket } from 'socket.io'
import { Experiment } from '../../../../types/Experiment'

const register = (experiment: Experiment, socket: Socket) => {
  return [experiment.logStream.subscribe((item) => socket.emit('log', item))]
}

module.exports = {
  register,
}
