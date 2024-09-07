const { save } = require('./elastic')

class Statistics {
  static collectExperimentMetadata(experiment) {
    return save(experiment, 'experiments')
  }

  static collectBooking(booking, experimentSettings) {
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

module.exports = Statistics
