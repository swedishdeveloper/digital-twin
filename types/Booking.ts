export interface Booking {
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
