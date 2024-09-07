import Position from './models/position';

export interface FleetConstructorArgs {
  name: string;
  marketshare: number;
  percentageHomeDelivery: number;
  vehicles: Record<string, number>;
  hub: any;
  type: string;
  municipality: any;
}
