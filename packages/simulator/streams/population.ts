import { from, shareReplay, filter } from 'rxjs';
import { map } from 'rxjs/operators';
import { readCsv } from '../adapters/csv';
import coords from 'swe-coords';
import { convertPosition } from '../lib/distance';

// read the SWEREF99 x,y combined string for a square km and return a WGS84 lat lon object
// TODO: understand if the coordinate is the center of the square or the top left corner (if so, maybe add an offset to the position to get the center)
function parseRuta(ruta: string): { lon: number; lat: number } {
  return convertPosition(coords.toLatLng(ruta.slice(6), ruta.slice(0, 6)))
}

function read(): any {
  return from(readCsv(process.cwd() + '/data/5arsklasser_1km.csv')).pipe(
    map(({ id, rutstorl: area, ruta, beftotalt: population, ...ages }) => ({
      id,
      area,
      ruta,
      position: parseRuta(ruta),
      ages: Object.values(ages).map((nr) => parseFloat(nr, 10)),
      population: parseFloat(population, 10),
    })),
    filter((p) => p.population > 0), // only keep squares with people living there.
    shareReplay()
  )
}

export default read();
