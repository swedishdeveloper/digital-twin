import { save } from './elastic';

interface Experiment {
  // Define the structure of the experiment object
}

interface Position {
  lon: number;
  lat: number;
}

interface Booking {
  toObject(): object;
  passenger?: {
    toObject(): object;
  };
  pickup: {
    position: Position;
  };
  destination: {
    position: Position;
  };
}

class Statistics {
  static collectExperimentMetadata(experiment: Experiment): Promise<any> {
    return save(experiment, 'experiments');
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
    );
  }
}

export default Statistics;
