import { take, map, filter, mergeAll } from 'rxjs/operators'
import { randomNames } from './personNames'
import { from, zip } from 'rxjs'
import { getAddressesInArea } from './address'
import Citizen from '../models/Citizen'

interface Square {
  position: any
  area: any
  population: number
}

export const getCitizensInSquare = (
  { position, area, population }: Square,
  workplaces: any,
  municipalityName: string
): any => {
  const nrOfCitizens = Math.floor(population * 0.01) // sample x% of the population
  if (nrOfCitizens === 0) return from([])
  const addresses = from(getAddressesInArea(position, area, nrOfCitizens)).pipe(
    mergeAll()
  )
  return zip([
    addresses.pipe(take(nrOfCitizens)),
    randomNames.pipe(take(nrOfCitizens)),
    workplaces.pipe(take(nrOfCitizens)),
  ]).pipe(
    map(([home, name, workplace]) => {
      return (
        home &&
        new Citizen({
          ...name,
          home,
          // age: ages[Math.floor(Math.random() * ages.length)],
          workplace,
          municipality: municipalityName,
          position: home.position,
        })
      )
    }),
    filter((citizen) => citizen),
    take(nrOfCitizens)
  )
}
