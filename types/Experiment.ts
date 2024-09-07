export type ExperimentParameters = {
  id: string;
  startDate: Date;
  fixedRoute: number;
  emitters: any;
  fleets: any;
};

export type Experiment = {
  logStream: any;
  busStops: any;
  lineShapes: any;
  postombud: any;
  municipalities: any;
  subscriptions: any[];
  virtualTime: any;
  dispatchedBookings: any;
  cars: any;
  buses: any;
  taxis: any;
  recycleTrucks: any;
  parameters: ExperimentParameters;
  passengers: any;
  recycleCollectionPoints: any;
  bookingUpdates: any;
  passengerUpdates: any;
  carUpdates: any;
};
