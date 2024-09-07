import Position from '../models/Position'
import { info, error, write } from './log'
const peliasUrl = process.env.PELIAS_URL || 'https://pelias.telge.iteam.pub'

info('Pelias URL', peliasUrl)

const nearest = (
  position: Position,
  layers: string = 'address,venue'
): Promise<any> => {
  const { lon, lat } = position

  const url = `${peliasUrl}/v1/reverse?point.lat=${lat}&point.lon=${lon}&size=1&layers=${layers}`
  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) Promise.reject(new Error('Error in pelias nearest'))
      return response.json()
    })
    .then((p) =>
      p.features[0]?.geometry?.coordinates?.length
        ? p
        : Promise.reject('No coordinates found' + position.toString())
    )
    .then(
      ({
        features: [
          {
            geometry,
            properties: { name, street, houseNumber, localadmin, label },
          } = {},
        ] = [],
      }) => ({
        name,
        street,
        houseNumber,
        label,
        localadmin,
        position: new Position({
          lon: geometry.coordinates[0],
          lat: geometry.coordinates[1],
        }),
      })
    )
    .catch((e: any) => {
      const peliasError = new Error().stack
      error(`Error in pelias nearest\n${peliasError}\n${e}\n\n`)
    })

  return promise
}
const search = (
  name: string,
  near: Position | null = null,
  layers: string = 'address,venue',
  size: number = 1000
): Promise<any[]> => {
  const encodedName = encodeURIComponent(name)
  const focus = near
    ? `&focus.point.lat=${near.lat}&focus.point.lon=${near.lon}&layers=${layers}`
    : ''
  const url = `${peliasUrl}/v1/search?text=${encodedName}${focus}&size=${size}`
  write('p')
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('pelias error: ' + response.statusText)
      return response.json()
    })
    .then((results) =>
      results.features
        .map(({ geometry, properties } = {}) => ({
          ...properties,
          position: new Position({
            lon: geometry.coordinates[0],
            lat: geometry.coordinates[1],
          }),
        }))
        .filter((p) => p.position.isValid())
    )
    .catch((e: any) => {
      const peliasError = new Error().stack
      error(`Error in pelias search\n${url}\n${peliasError}\n${e}\n\n`)
      return Promise.reject(new Error('Error in pelias'))
    })
}

const cache = new Map()

const searchOne = async (
  name: string,
  near: Position | null = null,
  layers: string = 'address,venue'
): Promise<any> => {
  const cacheKey = !near ? name + layers : null
  if (cacheKey && cache.has(cacheKey)) return cache.get(cacheKey)
  const results = await search(name, near, layers, 1).catch((e) => {
    error(`Error in pelias searchOne\n${e}\n\n`)
    return []
  })
  if (cacheKey && results.length > 0) cache.set(cacheKey, results[0])
  return results[0]
}

module.exports = {
  nearest,
  search,
  searchOne,
}
