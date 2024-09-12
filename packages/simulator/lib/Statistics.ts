import { save } from './elastic'

import { Experiment } from '../../../types/Experiment';
import { Position } from '../../../types/Position';
import { Booking } from '../../../types/Booking';

class Statistics {
  static collectExperimentMetadata(experiment: Experiment): Promise<any> {
    return save(experiment, 'experiments')
  }

  static collectBooking(
    booking: Booking,
    experimentSettings: any
  ): Promise<any> {
    return save(
      {
        ...booking.toObject(),
        timestamp: new Date(),
        experimentSettings,
        passenger: booking.passenger?.toObject(),
      },
      'bookings'
    )
  }
}

export default Statistics
