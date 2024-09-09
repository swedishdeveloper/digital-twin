import { take, map, filter, mergeAll } from 'rxjs/operators'
import { randomNames } from './personNames'
import { from, zip, Observable } from 'rxjs'
import { getAddressesInArea } from './address'
import Citizen from '../models/Citizen'
import { Workplace } from '../../../types/Citizen'

const PERCENT_POPULATION = 1 / 100 // percentage of the population to sample

interface Square {
  position: any
  area: any
  population: number
}

export const getCitizensInSquare = (
  { position, area, population }: Square,
  workplaces: Observable<Workplace>,
  municipalityName: string
): Observable<Citizen> => {
  const nrOfCitizens = Math.floor(population * PERCENT_POPULATION) // sample x% of the population
  if (nrOfCitizens === 0) return from([])

  const addresses = from(getAddressesInArea(position, area, nrOfCitizens)).pipe(
    mergeAll()
  )
  const names = randomNames()

  return zip(
    addresses.pipe(take(nrOfCitizens)),
    names.pipe(take(nrOfCitizens)),
    workplaces.pipe(take(nrOfCitizens))
  ).pipe(
    map(([home, name, workplace]) => {
      return new Citizen({
        ...name,
        home,
        workplace,
        municipality: municipalityName,
        position: home.position,
      })
    }),
    take(nrOfCitizens)
  )
}
