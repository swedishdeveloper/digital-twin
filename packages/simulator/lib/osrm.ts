import fetch from 'node-fetch'
import polyline from 'polyline'
const osrmUrl =
  // eslint-disable-next-line no-undef
  process.env.OSRM_URL ||
  'https://osrm.telge.iteam.pub' ||
  'http://localhost:5000'
import { warn, write } from './log'

const decodePolyline = function (geometry: string): Position[] {
  return polyline.decode(geometry).map((point) => ({
    lat: point[0],
    lon: point[1],
  }))
}

const encodePolyline = function (geometry: Position[]): string {
  return polyline.encode(geometry.map(({ lat, lon }) => [lat, lon]))
}

import { Position } from '../../../types/Position';

interface Route {
  geometry: { coordinates: Position[] }
  duration: number
}

export const osrm = {
  route(from: Position, to: Position): Promise<Route | Record<string, never>> {
    // http://{server}/route/v1/{profile}/{coordinates}?alternatives={true|false}&steps={true|false}&geometries={polyline|geojson}&overview={full|simplified|false}&annotations={true|false}
    const coordinates = [
      [from.lon, from.lat],
      [to.lon, to.lat],
    ].join(';')
    return (
      fetch(
        `${osrmUrl}/route/v1/driving/${coordinates}?steps=true&alternatives=false&overview=full&annotations=true`
      )
        .then(
          (res) =>
            (res.ok && res.json()) ||
            res.text().then((text) => Promise.reject(text)) // sometimes we get a text error message, instead of trying to parse it as json we just return a rejected promise
        )

        // fastest route
        .then(
          (result) =>
            result.routes &&
            result.routes.sort((a, b) => a.duration < b.duration)[0]
        )
        .then((route) => {
          if (!route) return {}

          route.geometry = { coordinates: decodePolyline(route.geometry) }
          return route
        })
    )
  },
  nearest(position: Position): Promise<any> {
    const coordinates = [position.lon, position.lat].join(',')
    const url = `${osrmUrl}/nearest/v1/driving/${coordinates}`
    write('n')
    const promise = fetch(url).then(
      (response) => {
        return response.json()
      },
      (err) => {
        warn('OSRM fetch err', err.message, url)
      }
    )

    return promise
  },
  match(positions: { position: Position; date: Date }[]): Promise<any> {
    const coordinates = positions
      .map((pos) => [pos.position.lon, pos.position.lat].join(','))
      .join(';')
    const timestamps = positions
      .map((pos) => Math.round(+pos.date / 1000))
      .join(';')
    write('m')

    return fetch(
      `${osrmUrl}/match/v1/driving/${coordinates}?timestamps=${timestamps}&geometries=geojson&annotations=true&overview=full`
    ) // Add annotations and steps to get each node speed
      .then((response) => response.json())
      .then((route) => {
        return route
      })
  },
  decodePolyline,
  encodePolyline,
}
