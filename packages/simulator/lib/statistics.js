import { save } from './elastic';

interface Experiment {
  // Define the structure of the experiment object
}

interface Booking {
  toObject(): object;
  passenger?: {
    toObject(): object;
  };
}

class Statistics {
  static collectExperimentMetadata(experiment: Experiment): Promise<any> {
    return save(experiment, 'experiments')
  }

  static collectBooking(booking: Booking, experimentSettings: any): Promise<any> {
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

export default Statistics;
