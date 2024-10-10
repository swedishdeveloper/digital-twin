import React, { useState, useEffect, useCallback, useRef } from 'react'
import { StaticMap } from 'react-map-gl'
import DeckGL, {
  PolygonLayer,
  ScatterplotLayer,
  ArcLayer,
  LinearInterpolator,
  IconLayer,
} from 'deck.gl'
import inside from 'point-in-polygon'
import { ParagraphLarge } from './components/Typography'
import MunicipalityStatisticsBox from './components/MunicipalityStatisticsBox'
import TimeProgressBar from './components/TimeProgressBar'
import LayersMenu from './components/LayersMenu/index.jsx'
import HoverInfoBox from './components/HoverInfoBox'

const transitionInterpolator = new LinearInterpolator(['bearing'])

const Map = ({
  activeLayers,
  cars,
  bookings,
  municipalities,
  activeCar,
  setActiveCar,
  time,
  setShowEditExperimentModal,
  experimentId,
  initMapState,
}) => {
  const [mapState, setMapState] = useState({
    bearing: 0,
    pitch: 40,
    ...initMapState,
  })

  const rotateCamera = useCallback(() => {
    setMapState((mapState) => ({
      ...mapState,
      bearing: mapState.bearing + 1,
      transitionDuration: 1000,
      transitionInterpolator,
      onTransitionEnd: rotateCamera,
    }))
  }, [])

  const [hoverInfo, setHoverInfo] = useState(null)
  const hoverInfoRef = useRef(null)
  const [municipalityInfo, setMunicipalityInfo] = useState(null)

  const municipalityLayer = new PolygonLayer({
    id: 'municipality-layer',
    data: municipalities,
    stroked: true,
    // we need the fill layer for our hover function
    filled: true,
    extruded: false,
    wireframe: false,
    lineWidthUtils: 'pixels',
    lineWidthMinPixels: 1,
    getLineWidth: 50,
    lineJointRounded: true,
    getElevation: 0,
    opacity: 0.3,
    polygonOffset: 1,
    getPolygon: (k) => k.geometry.coordinates,
    getLineColor: [0, 255, 128, 100],
    getFillColor: [0, 0, 0, 0], // this isn't actually opaque, it just ends up not rendering any color
    pickable: true,
    onHover: (info, event) => {
      const { object } = info
      setMunicipalityInfo((current) => {
        if (!!object) return object
        // Seems to happen if you leave the viewport at the same time you leave a polygon
        if (!Array.isArray(info.coordinate)) return null

        // If mouse is inside our polygon we keep ourselves open
        if (
          current.geometry.coordinates.some((polygon) =>
            inside(info.coordinate, polygon)
          )
        ) {
          return current
        }
        return null
      })
    },
  })

  const getColorBasedOnStatus = ({ status }) => {
    const opacity = Math.round((4 / 5) * 255)
    switch (status) {
      case 'ready':
        return [0, 200, 0, opacity]
      default:
        return [254, 254, 254, opacity]
    }
  }

  const getColorBasedOnType = ({ id }) => {
    const [carrier, type, car, order] = id.split('-')
    const types = ['HEM', 'KRA', '2FA', 'SOP', 'ORD', 'MAT', 'BLB']

    const opacity = Math.round((4 / 5) * 255)
    const colors = [
      [205, 127, 50, opacity],
      [99, 20, 145, opacity],
      [189, 197, 129, opacity],
      [249, 202, 36, opacity],
      [57, 123, 184, opacity],
      [235, 77, 75, opacity],
      [232, 67, 147, opacity],
      [119, 155, 172, opacity],
      [34, 166, 179, opacity],
      [255, 255, 0, opacity],
      [254, 254, 254, opacity],
    ]
    return colors[types.indexOf(type.slice(0, 3)) % colors.length]
  }

  const getColorBasedOnCar = ({ id }) => {
    const [carrier, type, car, order] = id.split('-')
    const opacity = Math.round((4 / 5) * 255)
    const colors = [
      [205, 127, 50, opacity],
      [99, 20, 145, opacity],
      [189, 197, 129, opacity],
      [249, 202, 36, opacity],
      [57, 123, 184, opacity],
      [235, 77, 75, opacity],
      [232, 67, 147, opacity],
      [119, 155, 172, opacity],
      [34, 166, 179, opacity],
      [255, 255, 0, opacity],
      [254, 254, 254, opacity],
    ]
    return colors[parseInt(car) % colors.length]
  }

  const ICON_MAPPING = {
    hemsortering: {x: 0, y: 0, width: 640, height: 640, mask: true},
    hushållsavfall: {x: 0, y: 0, width: 640, height: 640, mask: true},
    matavfall: {x: 0, y: 0, width: 640, height: 640, mask: true},
    skåpbil: {x: 0, y: 0, width: 640, height: 640, mask: true},
    frontlastare: {x: 0, y: 0, width: 640, height: 640, mask: true},
    baklastare: {x: 0, y: 0, width: 640, height: 640, mask: true},
  };

  const carIconLayer = new IconLayer({
    id: 'car-icon-layer',
    data: cars,
    pickable: true,
    iconAtlas: '/delivery-truck-svgrepo-com.png',
    iconMapping: ICON_MAPPING,
    getIcon: d => d.fleet.toLowerCase(),
    sizeScale: 7,
    getPosition: d => d.position,
    getSize: d => 5,
    getColor: getColorBasedOnStatus,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        id: object.id,
        type: 'car',
        x,
        y,
        viewport,
      })
    },
    onClick: ({ object }) => {
      setMapState({
        ...mapState,
        zoom: 14,
        longitude: object.position[0],
        latitude: object.position[1],
      })
      setActiveCar(object)
    },
  });

  const carLayer = new ScatterplotLayer({
    id: 'car-layer',
    data: cars,
    //opacity: 0.7,
    stroked: false,
    filled: true,
    radiusScale: 6,
    radiusUnits: 'pixels',
    getPosition: (c) => {
      return c.position
    },
    //getRadius: (c) => (c.fleet === 'Privat' ? 4 : 8),
    getFillColor: getColorBasedOnStatus,
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        id: object.id,
        type: 'car',
        x,
        y,
        viewport,
      })
    },
    onClick: ({ object }) => {
      setMapState({
        ...mapState,
        zoom: 14,
        longitude: object.position[0],
        latitude: object.position[1],
      })
      setActiveCar(object)
    },
  })

  const bookingLayer = new ScatterplotLayer({
    id: 'booking-layer',
    data: bookings.filter((b) => b.type === 'recycle'), //.filter((b) => !b.assigned), // TODO: revert change
    opacity: 1,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusUnits: 'pixels',
    getPosition: (c) => {
      return c.pickup
    },
    getRadius: () => 4,
    // #fab
    getFillColor: (
      { id, status } // TODO: Different colors for IKEA & HM
    ) =>
      status === 'Delivered'
        ? [170, 187, 255, 55]
        : status === 'Picked up'
        ? [170, 255, 187, 128] // Set opacity to around 50 for delivered items
        : getColorBasedOnType({ id }),
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        id: object.id,
        type: 'booking',
        x,
        y,
        viewport,
      })
    },
  })

  const destinationLayer = new ScatterplotLayer({
    id: 'destination-layer',
    data: [bookings.find((b) => b.destination)].filter(Boolean),
    opacity: 1,
    stroked: false,
    filled: true,
    radiusScale: 3,
    radiusUnits: 'pixels',
    getPosition: (b) => b.destination,
    getRadius: () => 4,
    getFillColor: [255, 140, 0, 200],
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        id: object.id,
        type: 'dropoff',
        x,
        y,
        viewport,
      })
    },
  })

  const [showAssignedBookings, setShowAssignedBookings] = useState(false)
  const [showActiveDeliveries, setShowActiveDeliveries] = useState(false)

  const routesData =
    (showActiveDeliveries || showAssignedBookings) &&
    bookings
      .map((booking) => {
        if (!cars) return null
        const car = cars.find((car) => car.id === booking.carId)
        if (car === undefined) return null

        switch (booking.status) {
          case 'Picked up':
            return (
              showActiveDeliveries && {
                inbound: [169, 178, 237, 55],
                outbound: getColorBasedOnCar(booking),
                from: car.position,
                to: booking.destination,
              }
            )
          case 'Assigned':
            return (
              showAssignedBookings && {
                inbound: getColorBasedOnCar(booking),
                outbound: getColorBasedOnCar(booking),
                from: car.position,
                to: booking.pickup,
              }
            )
          case 'Queued':
            return (
              showAssignedBookings && {
                inbound: getColorBasedOnCar(booking),
                outbound: getColorBasedOnCar(booking),
                from: car.position,
                to: booking.pickup,
              }
            )
          case 'Delivered':
            return null

          default:
            return {
              inbound: [255, 255, 255, 200],
              outbound: [255, 255, 255, 100],
              from: booking.pickup,
              to: booking.destination,
            }
        }
      })
      .filter((b) => b) // remove null values

  const arcData = cars
    .map((car) => {
      return {
        inbound: [167, 55, 255],
        outbound: [167, 55, 255],
        from: car.position,
        to: car.destination,
      }
    })
    .filter(({ from, to }) => from && to)
  const [showArcLayer, setShowArcLayer] = useState(false)

  const arcLayer = new ArcLayer({
    id: 'arc-layer',
    data: showArcLayer && arcData,
    pickable: true,
    getWidth: 1,
    getSourcePosition: (d) => d.from,
    getTargetPosition: (d) => d.to,
    getSourceColor: (d) => d.inbound,
    getTargetColor: (d) => d.outbound,
  })

  const routesLayer = new ArcLayer({
    id: 'routesLayer',
    data: routesData,
    pickable: true,
    getWidth: 0.5,
    getSourcePosition: (d) => d.from,
    getTargetPosition: (d) => d.to,
    getSourceColor: (d) => d.inbound,
    getTargetColor: (d) => d.outbound,
  })

  useEffect(() => {
    if (!cars.length) return
    if (!activeCar) return
    const car = cars.filter(({ id }) => id === activeCar.id)[0]
    if (!car) return
    setMapState((state) => ({
      ...state,
      zoom: 14,
      longitude: car.position[0],
      latitude: car.position[1],
    }))
  }, [activeCar, cars])

  const map = useRef()

  return (
    <DeckGL
      //mapLib={maplibregl}
      mapboxApiAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      // initialViewState={mapState.viewport}
      viewState={mapState}
      ref={map}
      // onLoad={rotateCamera}
      onViewStateChange={({ viewState }) => {
        setMapState(viewState)
        if (activeCar) {
          setActiveCar(null)
        }
      }}
      onClick={(event) => {
        if (!event.layer) setActiveCar(null)
      }}
      controller={true}
      layers={[
        // The order of these layers matter, roughly equal to increasing z-index by 1
        activeLayers.municipalityLayer && municipalityLayer, // TODO: This hides some items behind it, sort of
        bookingLayer,
        destinationLayer,
        showArcLayer && arcLayer,
        (showAssignedBookings || showActiveDeliveries) && routesLayer,
        activeLayers.carLayer && (activeLayers.useIcons ? carIconLayer : carLayer),
      ]}
    >
      <div
        style={{
          bottom: '40px',
          right: '20px',
          position: 'absolute',
        }}
      >
        <LayersMenu
          activeLayers={activeLayers}
          showArcLayer={showArcLayer}
          setShowArcLayer={setShowArcLayer}
          showActiveDeliveries={showActiveDeliveries}
          setShowActiveDeliveries={setShowActiveDeliveries}
          showAssignedBookings={showAssignedBookings}
          setShowAssignedBookings={setShowAssignedBookings}
          setShowEditExperimentModal={setShowEditExperimentModal}
          experimentId={experimentId}
        />
      </div>
      <StaticMap
        reuseMaps
        preventStyleDiffing={true}
        //mapLib={maplibregl}
        //mapStyle="https://maptiler.iteam.services/styles/basic-preview/style.json"
        mapStyle="mapbox://styles/mapbox/dark-v10"
        mapboxApiAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      />
      {hoverInfo && mapState.zoom > 6 && (
        <div>
          <HoverInfoBox data={hoverInfo} cars={cars} bookings={bookings} />
        </div>
      )}

      {/* Time progress bar. */}
      <TimeProgressBar time={time} />

      {/* Experiment clock. */}
      <div
        style={{
          right: '3rem',
          top: '30px',
          position: 'absolute',
          textAlign: 'right',
        }}
      >
        <ParagraphLarge white>
          Just nu är klockan{' '}
          <b>
            {new Date(time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </b>{' '}
          <br />i simuleringen
        </ParagraphLarge>
      </div>

      {/* Municipality stats. */}
      {municipalityInfo && <MunicipalityStatisticsBox {...municipalityInfo} />}
    </DeckGL>
  )
}

export default Map