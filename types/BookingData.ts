import { Position } from './Position';

export interface BookingData {
  sender?: string;
  passenger?: any;
  type?: string;
  pickup?: { position: Position };
  destination?: any;
}
