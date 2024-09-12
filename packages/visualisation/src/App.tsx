import React, { useState } from 'react'
import 'jsoneditor-react/es/editor.min.css'

import Map from './Map'
import Loading from './components/Loading'
import PlaybackOptions from './components/PlaybackOptions'
import ResetExperiment from './components/ResetExperiment'
import EditExperimentModal from './components/EditExperimentModal'
import Logo from './components/Logo'
import ExperimentDoneModal from './components/ExperimentDoneModal/index'
import { Snackbar, SnackbarContent } from '@mui/material'
import { useSocket, useSocketEvent } from 'socket.io-react-hook'
import type { Booking } from '../../../types/Booking'
import type { CitizenType } from '../../../types/Citizen'
import type { VehicleType } from '../../../types/Vehicle'
import type { ExperimentParameters } from '../../../types/Experiment'

import Slide, { SlideProps } from '@mui/material/Slide'

const App = () => {
  const [activeCar, setActiveCar] = useState<VehicleType | null>(null)
  const [reset, setReset] = useState(false)
  const [speed, setSpeed] = useState(60)
  const [time, setTime] = useState(-3600000) // 00:00
  const [carLayer, setCarLayer] = useState(true)
  const [busLayer, setBusLayer] = useState(true)
  const [taxiLayer, setTaxiLayer] = useState(true)
  const [busStopLayer, setBusStopLayer] = useState(true)
  const [passengerLayer, setPassengerLayer] = useState(true)
  const [postombudLayer, setPostombudLayer] = useState(false)
  const [recycleCollectionLayer, setRecycleCollectionLayer] = useState(false)
  const [busLineLayer, setBusLineLayer] = useState(true)
  const [municipalityLayer, setMunicipalityLayer] = useState(true)
  const [experimentParameters, setExperimentParameters] =
    useState<ExperimentParameters>()
  const [currentParameters, setCurrentParameters] =
    useState<ExperimentParameters>()
  const [fleets, setFleets] = useState<Record<string, any>>({})
  const [latestLogMessage, setLatestLogMessage] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [showEditExperimentModal, setShowEditExperimentModal] = useState(false)
  const [showExperimentDoneModal, setShowExperimentDoneModal] = useState(false)
  const [previousExperimentId, setPreviousExperimentId] = useState<
    string | null
  >(null)

  const [connected, setConnected] = useState(false)

  const simulatorUrl =
    import.meta.env.VITE_SIMULATOR_URL || `ws://localhost:4000`

  const { socket } = useSocket(simulatorUrl)
  const activeLayers = {
    carLayer,
    setCarLayer,
    busLayer,
    setBusLayer,
    postombudLayer,
    setPostombudLayer,
    recycleCollectionLayer,
    setRecycleCollectionLayer,
    taxiLayer,
    setTaxiLayer,
    passengerLayer,
    setPassengerLayer,
    busStopLayer,
    setBusStopLayer,
    municipalityLayer,
    setMunicipalityLayer,
    busLineLayer,
    setBusLineLayer,
  }

  const restartSimulation = () => {
    setShowEditExperimentModal(false)
    socket.emit('experimentParameters', experimentParameters)
  }

  socket.on('init', () => {
    console.log('Init experiment')
    setBookings([])
    setPassengers([])
    setCars([])
    setmunicipalities([])
    setRecycleCollection([])
    setBusStops([])
    setLineShapes([])
    setLatestLogMessage('')
    socket.emit('speed', speed) // reset speed on server
  })

  socket.on('reset', () => {
    console.log('Reset experiment')
    setPreviousExperimentId(experimentParameters?.id || null)
    setShowExperimentDoneModal(true)
  })

  function upsert(array, object, idProperty = 'id', deep = false) {
    const currentIndex = array.findIndex(
      (k) => k[idProperty] === object[idProperty]
    )
    let new_arr = [...array]

    if (currentIndex >= 0) {
      if (deep) {
        new_arr[currentIndex] = { ...new_arr[currentIndex], ...object }
      } else {
        new_arr[currentIndex] = object
      }
    } else {
      new_arr.push(object)
    }
    return new_arr
  }

  const [cars, setCars] = React.useState<VehicleType[]>([])
  socket.on('cars', (newCars: VehicleType[]) => {
    setReset(false)
    setCars((cars) => [
      ...cars.filter((car) => !newCars.some((nc) => nc.id === car.id)),
      ...newCars,
    ])
  })

  socket.on('time', (time: number) => {
    setTime(time)
  })

  socket.on('log', (message: string) => {
    setLatestLogMessage(message)
    setSnackbarOpen(true)
  })

  const [bookings, setBookings] = React.useState<Booking[]>([])
  socket.on('bookings', (newBookings: any[]) => {
    setReset(false)
    setBookings((bookings) => [
      ...bookings.filter(
        (booking) => !newBookings.some((nb) => nb.id === booking.id)
      ),
      ...newBookings.map(({ pickup, destination, ...rest }) => ({
        pickup: [pickup.lon, pickup.lat],
        destination: [destination.lon, destination.lat],
        ...rest,
      })),
    ])
  })

  const [recycleCollectionPoints, setRecycleCollection] = React.useState<
    Booking[]
  >([])
  socket.on('recycleCollection', (newRecycleCollectionPoints: any[]) => {
    setReset(false)
    setRecycleCollection((current) => [
      ...current,
      ...newRecycleCollectionPoints.map(({ position, ...rest }) => ({
        position: [position.lon, position.lat],
        ...rest,
      })),
    ])
  })

  socket.on('recycleCollectionUpdates', (recycleCollectionUpdates: any[]) => {
    setRecycleCollection((current) =>
      current.map((recycleCollectionPoint) => {
        const recycleCollectionIds = recycleCollectionUpdates.map(
          ({ recycleCollectionId }) => recycleCollectionId
        )
        if (recycleCollectionIds.includes(recycleCollectionPoint.id)) {
          return {
            ...recycleCollectionPoint,
            count: recycleCollectionPoint.count + 1,
          }
        }
        return recycleCollectionPoint
      })
    )
  })

  const [busStops, setBusStops] = React.useState<any[]>([])
  socket.on('busStops', (busStops: any[]) => {
    setReset(false)
    setBusStops(
      busStops.map(({ position, ...rest }) => ({
        position: [position.lon, position.lat].map((s) => parseFloat(s)),
        ...rest,
      }))
    )
  })

  const [lineShapes, setLineShapes] = React.useState<any[]>([])
  socket.on('lineShapes', (lineShapes: any[]) => {
    setLineShapes(lineShapes)
  })

  const [municipalities, setmunicipalities] = React.useState<any[]>([])
  socket.on('municipality', (municipality: any) => {
    setReset(false)
    setmunicipalities((current) => {
      console.log('Received municipality data:', municipality)
      return upsert(current, municipality, 'id', true)
    })
  })

  socket.on('parameters', (currentParameters: ExperimentParameters) => {
    console.log('ExperimentId', currentParameters.id)

    if (!previousExperimentId) {
      setPreviousExperimentId(currentParameters.id)
    }

    setCurrentParameters(currentParameters)
    const layerSetFunctions = {
      buses: setBusLayer,
      cars: setCarLayer,
      busStops: setBusStopLayer,
      busLines: setBusLineLayer,
      passengers: setPassengerLayer,
      postombud: setPostombudLayer,
      municipalities: setMunicipalityLayer,
    }

    Object.entries(layerSetFunctions).forEach(
      ([emitterName, setStateFunction]) => {
        if (currentParameters.emitters.includes(emitterName)) {
          setStateFunction(true)
        } else {
          setStateFunction(false)
        }
      }
    )

    setFleets(currentParameters.fleets)
    setExperimentParameters(currentParameters)

    console.log('Received parameters:', currentParameters)
  })
  const [passengers, setPassengers] = React.useState<CitizenType[]>([])
  socket.on('passengers', (passengers: any[]) => {
    setPassengers((currentPassengers) => [
      ...currentPassengers.filter(
        (cp) => !passengers.some((p) => p.id === cp.id)
      ),
      ...passengers.map(({ position, ...p }) => ({
        ...p,
        position: [position.lon, position.lat].map((s) => parseFloat(s)),
      })),
    ])
  })

  const onPause = () => {
    socket.emit('pause')
    console.log('pause stream')
  }

  const onPlay = () => {
    setReset(false)
    socket.emit('play')
    console.log('play stream')
  }

  const onSpeedChange = (value: number) => {
    socket.emit('speed', value)
    setSpeed(value)
  }

  const resetSimulation = () => {
    setReset(true)
    socket.emit('reset')
    setBookings([])
    setPassengers([])
    setCars([])
    setActiveCar(null)
  }

  socket.on('disconnect', () => {
    setConnected(false)
  })

  socket.on('connect', () => {
    setConnected(true)
  })

  /**
   * Update the fleets part of the parameters.
   */
  const saveFleets = (updatedJson: Record<string, any>) => {
    setExperimentParameters((prev) =>
      prev ? { ...prev, fleets: updatedJson } : undefined
    )
  }

  return (
    <>
      <Logo />

      {/* Loader. */}
      {(!connected || reset || !cars.length || !bookings.length) && (
        <Loading
          connected={connected}
          passengers={passengers.length}
          cars={cars.length}
          bookings={bookings.length}
          busStops={busStops.length}
          municipalities={municipalities.length}
          parameters={currentParameters}
        />
      )}

      {/* Playback controls. */}
      <PlaybackOptions
        onPause={onPause}
        onPlay={onPlay}
        onSpeedChange={onSpeedChange}
      />

      {/* Reset experiment button. */}
      <ResetExperiment resetSimulation={resetSimulation} />

      {/* Edit experiment modal. */}
      <EditExperimentModal
        fleets={fleets}
        show={showEditExperimentModal}
        setShow={setShowEditExperimentModal}
        restartSimulation={restartSimulation}
        saveFleets={saveFleets}
      />

      {/* Experiment done modal. */}
      <ExperimentDoneModal
        experimentId={previousExperimentId}
        show={showExperimentDoneModal}
        setShow={setShowExperimentDoneModal}
      />

      {/* Map. */}
      {currentParameters?.initMapState && (
        <Map
          activeLayers={activeLayers}
          passengers={passengers}
          cars={cars}
          bookings={bookings}
          busStops={busStops}
          municipalities={municipalities}
          activeCar={activeCar}
          time={time}
          setActiveCar={setActiveCar}
          lineShapes={lineShapes}
          showEditExperimentModal={showEditExperimentModal}
          setShowEditExperimentModal={setShowEditExperimentModal}
          experimentId={currentParameters.id}
          initMapState={currentParameters.initMapState}
        />
      )}

      <Snackbar
        sx={{ opacity: 0.8 }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={snackbarOpen}
        autoHideDuration={3000}
        TransitionComponent={TransitionDown}
        onClose={() => setSnackbarOpen(false)}
      >
        <SnackbarContent
          sx={{ backgroundColor: 'black', color: 'white' }}
          message={latestLogMessage}
        />
      </Snackbar>
    </>
  )
}

function TransitionDown(props: SlideProps) {
  return <Slide {...props} direction="down" />
}
export default App
