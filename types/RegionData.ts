import { Observable } from 'rxjs';
import Municipality from '../packages/simulator/models/Municipality';

export interface RegionData {
  id: string;
  name: string;
  geometry: any;
  stops: Observable<any>;
  municipalities: Observable<Municipality>;
}
