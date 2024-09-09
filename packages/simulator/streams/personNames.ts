import {
  from,
  repeat,
  map,
  zip,
  filter,
  toArray,
  pipe,
  mergeAll,
  Observable,
} from 'rxjs'
import fornamnData from '../data/svenska_tilltalsnamn_2021.json'
import efternamnData from '../data/svenska_efternamn_2021.json'
import { Name } from '../../../types/Citizen'

const fornamn: string[] = fornamnData.data
const efternamn: string[] = efternamnData.data

const shuffle = (): any =>
  pipe(
    toArray(),
    map((names) => names.sort(() => Math.random() - 0.5)), // shuffle the names
    mergeAll()
  )

const zipfDistribution = () =>
  pipe(
    map((name: string, i: number) => ({
      name,
      frequency: 1 / (i + 1), // Zipf distribution
    }))
  )
/**
 * Takes a distribution of names with frequency of use
 * and returns a stream of names according to the distribution
 * - meaning that the first name is more likely to be used than the second
 *
 * @returns stream of names
 */
const weightedRandom = (): any =>
  pipe(
    filter(({ name, frequency }) => frequency > Math.random()),
    map(({ name }: { name: string }) => name)
  )

const toToTitleCase = (str: string): string =>
  str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join(' ')

const randomFirstName = (): Observable<string> =>
  from(fornamn).pipe(zipfDistribution(), shuffle(), weightedRandom())

const randomLastName = (): Observable<string> =>
  from(efternamn).pipe(
    zipfDistribution(),
    shuffle(),
    weightedRandom(),
    map((name: string) => toToTitleCase(name))
  )

const name = (firstName: string, lastName: string): Name => ({
  firstName,
  lastName,
  name: `${firstName} ${lastName}`,
})

function randomNames() {
  return zip(randomFirstName(), randomLastName()).pipe(
    map(([firstName, lastName]) => name(firstName, lastName)),
    repeat()
  )
}

export { randomNames }
