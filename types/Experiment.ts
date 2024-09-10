import { Observable, Subscription } from "rxjs"
import Municipality from "../packages/simulator/models/Municipality"
import Vehicle from "../packages/simulator/models/vehicles/Vehicle"
import RecycleTruck from "../packages/simulator/models/vehicles/RecycleTruck"
import Citizen from "../packages/simulator/models/Citizen"
import Booking from "../packages/simulator/models/Booking"

export type ExperimentParameters = {
  id: string
  startDate: Date
  fleets: any
  municipalities: string[]
  emitters: string[]
}

export type Experiment = {
  logStream: Observable<any>;
  municipalities: Observable<Municipality>;
  virtualTime: any;
  dispatchedBookings: any;

  // Vehicless
  cars: Observable<Vehicle>;
  recycleTrucks: Observable<RecycleTruck>;
  parameters: ExperimentParameters;
  passengers: Observable<Citizen>;
  recycleCollectionPoints: Observable<Booking>;
  bookingUpdates: any;
  passengerUpdates: any;
  carUpdates: any;

  // Keep track on all subscriptions so we can unsubscribe when experiment is over
  subscriptions: Subscription[];
};
