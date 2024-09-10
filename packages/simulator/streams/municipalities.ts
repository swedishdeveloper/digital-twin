/**
 * TODO: Describe the stream that this file exports and what its data means
 */
import { from, Observable, shareReplay } from 'rxjs'
import {
  map,
  filter,
  reduce,
  mergeMap,
  mergeAll,
  take,
  repeat,
  share,
} from 'rxjs/operators'
import data from '../data/municipalities.json'
import population from './population.js'
import inside from 'point-in-polygon'
import { searchOne } from '../lib/pelias'
import { getCitizensInSquare } from './citizens'
import { getAddressesInArea } from './address'
import { municipalities } from '../config/index.js'

import { info } from '../lib/log'

const activeMunicipalities = municipalities()

import telgeBookings from './orders/telge.js'
import Fleet from '../models/Fleet'
import Municipality from '../models/Municipality'
import Position from '../models/Position'
import { ExperimentParameters } from '../../../types/Experiment'

function getPopulationSquares({ geometry: { coordinates } }) {
  return population.pipe(
    filter(({ position: { lon, lat } }) =>
      coordinates.some((coordinates) => inside([lon, lat], coordinates))
    ),
    map(({ position, population, area }) => ({
      position,
      population,
      area: +area,
    })), // only keep the essentials to save memory
    shareReplay()
  )
}

async function getWorkplaces(position, nrOfWorkplaces = 100) {
  const area = 10000
  const adresses = await getAddressesInArea(position, area, nrOfWorkplaces)
  return adresses.map((a) => ({ ...a, position: new Position(a.position) }))
}

// function read() {
function createMunicipalities(
  parameters: ExperimentParameters,
  virtualTime
): Observable<Municipality> {
  return from(data).pipe(
    filter(({ namn }) =>
      activeMunicipalities.some((name) => namn.startsWith(name))
    ),
    map((municipality) => {
      const name = municipality.namn
      info('Processing municipality', name, parameters)
      return {
        ...municipality,
        fleets: parameters.municipalities[name].fleets,
      }
    }),
    mergeMap(
      async ({
        geometry,
        namn: name,
        epost,
        postnummer,
        telefon,
        address,
        kod,
        fleets,
      }) => {
        console.log('Processing municipality', name)
        const squares = getPopulationSquares({ geometry })

        const searchQuery = address || name.split(' ')[0]

        const searchResult = await searchOne(searchQuery)
        if (!searchQuery || !searchResult || !searchResult.position) {
          throw new Error(
            `No valid address or name found for municipality: ${name}. Please check parameters.json and add address or position for this municipality. ${searchQuery}`
          )
        }

        const { position: center } = searchResult
        const nearbyWorkplaces = from(getWorkplaces(center)).pipe(
          mergeAll(),
          take(100),
          repeat()
        )

        const citizens = squares.pipe(
          mergeMap(
            (square) => getCitizensInSquare(square, nearbyWorkplaces, name),
            5
          ),
          shareReplay()
        )

        const fleetsStream = from(fleets).pipe(
          mergeMap(async (fleet) => ({
            ...fleet,
            hub: fleet.hubAddress
              ? await searchOne(fleet.hubAddress)
                  .then((r) => r.position)
                  .catch((err) => error(err) || center)
              : center,
          })),
          map((fleet) => new Fleet({ ...fleet })),
          shareReplay()
        )

        const recyclingPoints = telgeBookings(virtualTime)

        const municipality = new Municipality({
          geometry,
          name,
          id: kod,
          email: epost,
          zip: postnummer,
          telephone: telefon,
          recycleCollectionPoints: recyclingPoints, // if södertälje..
          center,
          fleets: fleetsStream,
          squares,
          population: await squares
            .pipe(reduce((a, b) => a + b.population, 0))
            .toPromise(),
          citizens,
        })

        return municipality
      }
    ),
    share()
  )
}

export { createMunicipalities }
