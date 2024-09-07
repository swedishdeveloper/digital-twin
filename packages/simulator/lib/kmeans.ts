import kmeans from 'node-kmeans';
import assert from 'assert';
import { write } from './log';
import { info } from 'console';

import { Position } from '../../../types/Position';

interface Input {
  pickup?: { position: Position };
  position?: Position;
}

interface Cluster {
  center: Position;
  items: Input[];
}

const clusterPositions = (input: Input[], nrOfClusters: number = 5): Promise<Cluster[]> => {
  const vectors = input.map(({ pickup, position }) => {
    const pos = position || (pickup && pickup.position);
    if (!pos) {
      throw new Error('Position is undefined');
    }
    return [pos.lon, pos.lat];
  });
  info('Clustering', vectors.length, 'positions into', nrOfClusters, 'clusters')
  assert(
    vectors.length < 301,
    'Too many positions to cluster:' + vectors.length
  )
  vectors.forEach((vector, index) => {
    assert(
      vector.length === 2,
      `Expected 2 coordinates at index ${index}, got: ${vector.length}`
    );
    assert(
      vector[0] > -180 && vector[0] < 180,
      `Longitude out of range at index ${index}: ${vector[0]}`
    );
    assert(
      vector[1] > -90 && vector[1] < 90,
      `Latitude out of range at index ${index}: ${vector[1]}`
    );
  });
  write('k..')
  return new Promise((resolve, reject) =>
    kmeans.clusterize(vectors, { k: nrOfClusters }, (err, res) => {
      write('.m')
      if (err) return reject(err)
      const clusters = res.map((cluster) => ({
        center: { lon: cluster.centroid[0], lat: cluster.centroid[1] },
        items: cluster.clusterInd.map((i) => input[i]),
      }))
      resolve(clusters)
    })
  )
}

export { clusterPositions };
/*
test:

const positions = [
  { position: { lon: -0.1388888888888889, lat: 51.5 } },
  { position: { lon: -0.5388888888888889, lat: 52.5 } },
  { position: { lon: -0.4388888888888889, lat: 53.5 } },
  { position: { lon: -0.3388888888888889, lat: 54.5 } },
  { position: { lon: -0.2388888888888889, lat: 55.5 } },
  { position: { lon: -0.2388888888888889, lat: 56.5 } },
]

const clusters = clusterPositions(positions, 3).then((res) => {
  console.log(res)
})
*/
