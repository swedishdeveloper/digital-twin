import { Position } from './Position';

export interface BookingData {
  sender?: string;
  passenger?: any;
  type?: string;
  pickup: { departureTime?: Date, position: Position };
  destination?: any;
}
