import { PositionType } from "./Position";

export interface Booking {
  count: number;
  id: any;
  toObject(): object;
  passenger?: {
    toObject(): object;
  };
  pickup: {
    position: PositionType;
  };
  destination: {
    position: PositionType;
  };
}
