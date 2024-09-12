export interface PositionType {
  lon: number;
  lat: number;
  isValid?: () => boolean;
  distanceTo?: (position: PositionType) => number;
  toObject?: () => { lon: number; lat: number };
  toString?: () => string;
}
