interface Position {
  lat: number;
  lon: number;
}

interface Point {
  position: Position;
  meters: number;
  duration: number;
  passed?: number;
  distance?: number;
}

interface InterpolatedPosition {
  lat: number;
  lon: number;
  speed: number;
  instruction: Point;
  next: Point | null;
  remainingPoints: Point[];
  skippedPoints: Point[];
}

function interpolatePositionFromRoute(
  routeStarted: number,
  time: number,
  remainingPointsInRoute: Point[]
): InterpolatedPosition {
  const timeSinceRouteStarted = (time - routeStarted) / 1000

  if (routeStarted > time) {
    // route.started > time happens when a "reset" is triggered
    return {
      lat: remainingPointsInRoute[0].position.lat,
      lon: remainingPointsInRoute[0].position.lon,
      speed: 0,
      instruction: remainingPointsInRoute[0],
      next: remainingPointsInRoute[0],
      remainingPoints: [],
      skippedPoints: [],
    }
  } : {
      lat: lastPoint.position.lat,
      lon: lastPoint.position.lon,
      speed: 0,
      instruction: lastPoint,
      next: null,
      remainingPoints,
      skippedPoints: [],
    };

  const futurePoints: Point[] = remainingPointsInRoute.filter(
    (point) => (point.passed || 0) + point.duration > timeSinceRouteStarted
  )
  const nrOfPointsSkipped: number = remainingPointsInRoute.indexOf(futurePoints[0]) + 1;
  const skippedPoints: Point[] = remainingPointsInRoute.slice(0, nrOfPointsSkipped);
  const current: Point = futurePoints[0];
  const next: Point | undefined = futurePoints[1];
  const lastPoint: Point = remainingPointsInRoute[remainingPointsInRoute.length - 1];
  const remainingPoints: Point[] = futurePoints;

  // when we reach the end
  if (!current || !next) {
    return {
      lat: lastPoint.position.lat,
      lon: lastPoint.position.lon,
      speed: 0,
      instruction: lastPoint,
      next: null,
      remainingPoints,
      skippedPoints: [],
    }

  const progress: number = (timeSinceRouteStarted - (current.passed || 0)) / current.duration;
  // or
  // var progress = (timeSinceRouteStarted - start.passed) / (end.passed - start.passed)
  const speed: number = Math.round(current.meters / 1000 / (current.duration / 60 / 60));

  const interpolatedPosition: InterpolatedPosition = next ? {
    lat:
      current.position.lat +
      (next.position.lat - current.position.lat) * progress,
    lon:
      current.position.lon +
      (next.position.lon - current.position.lon) * progress,
    speed: speed,
    instruction: current,
    next: {
      lat: next.position.lat,
      lon: next.position.lon,
      instruction: next,
    },
    skippedPoints,
    remainingPoints,
  }
  return interpolatedPosition
}

const speedFactor = 1.4 // apply this to all speeds, TODO: Investigate ways to get buses to start position faster other ways. With speedFactor this high we greatly reduce the number of buses that get unassigned because it missed the first stop time due to too slowly navigating from bus depots to first stop. Might be improved by improving knowledge about the Swedish road network in OSRM/OSM (speeds might not be correct for roads in sweden)

interface Route {
  legs: { annotation: { duration: number[]; distance: number[] } }[];
  geometry: { coordinates: Position[] };
}

function extractPoints(route: Route): Point[] {
  const annotation = route.legs
    .map((leg) => leg.annotation)
    .reduce((a, b) => ({
      duration: a.duration.map((d) => d / speedFactor).concat(b.duration),
      distance: a.distance.concat(b.distance),
    }))
  // destination is the last step, will not have an annotation
  annotation.distance.push(0)
  annotation.duration.push(0)

  const points: Point[] = route.geometry.coordinates.map((pos, i) => ({
    position: pos,
    meters: annotation.distance[i],
    duration: annotation.duration[i],
  }))

  points.reduce((passed, point) => {
    point.passed = passed
    return point.passed + (point.duration || 0)
  }, 0)

  points.reduce((distance, point) => {
    point.distance = distance
    return point.distance + (point.meters || 0)
  }, 0)

  return points
}

export { interpolatePositionFromRoute as route, extractPoints as points };
