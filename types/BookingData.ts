import { Position } from './Position';

export interface BookingData {
  id?: string;
  sender?: string;
  passenger?: any;
  type?: string;
  pickup: { departureTime?: Date, position: Position, name?: string };
  destination?: any;
}
