import { from, shareReplay, filter, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { readCsv } from '../adapters/csv'
import coords from 'swe-coords'
import Position from '../models/Position'

interface CsvData {
  id: any
  rutstorl: any
  ruta: string
  beftotalt: any
  [key: string]: any
}

interface PopulationSquare {
  id: any
  area: any
  ruta: string
  position: { lon: number; lat: number }
  ages: number[]
  population: number
}

// read the SWEREF99 x,y combined string for a square km and return a WGS84 lat lon object
// TODO: understand if the coordinate is the center of the square or the top left corner (if so, maybe add an offset to the position to get the center)
function parseRuta(ruta: string): { lon: number; lat: number } {
  return Position.convertPosition(
    coords.toLatLng(ruta.slice(6), ruta.slice(0, 6))
  )
}

function read(): Observable<PopulationSquare> {
  return from(readCsv(process.cwd() + '/data/5arsklasser_1km.csv')).pipe(
    map(
      ({
        id,
        rutstorl: area,
        ruta,
        beftotalt: population,
        ...ages
      }: CsvData) => ({
        id,
        area,
        ruta,
        position: parseRuta(ruta),
        ages: Object.values(ages).map((nr) => parseFloat(nr)),
        population: parseFloat(population),
      })
    ),
    filter((p) => p.population > 0), // only keep squares with people living there.
    shareReplay()
  )
}

export default read()
