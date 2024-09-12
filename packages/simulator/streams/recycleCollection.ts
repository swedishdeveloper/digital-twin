import { from, Observable } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'
import { promises as fs } from 'fs'

interface RecycleData {
  turId: string
  date: string
  vehicle: string
  customerNumber: string
  houseNumber: string
  jobNumber: string
  decision: string
  sequenceNumber: string
  wasteType: string
  serviceType: string
  frequency: string
  scheduled: string
  position: { lat: number; lon: number }
}

function execute(): Observable<RecycleData> {
  // Adjust the file path as necessary
  const filePath = `${process.cwd()}/packages/simulator/data/telge/ruttdata 2024-09-03.txt`

  return from(fs.readFile(filePath, 'utf8')).pipe(
    mergeMap((fileContent) => {
      // Parse the JSON data from the file
      const data: {
        Lat: number
        Lng: number
        Turid: string
        Datum: string
        Bil: string
        Kundnr: string
        Hsnr: string
        Tjnr: string
        Dec: string
        Turordningsnr: string
        Avftyp: string
        Tjtyp: string
        Frekvens: string
        Schemalagd: string
      }[] = JSON.parse(fileContent)
      return from(data)
    }),
    map(
      ({
        Lat,
        Lng,
        Turid,
        Datum,
        Bil,
        Kundnr,
        Hsnr,
        Tjnr,
        Dec,
        Turordningsnr,
        Avftyp,
        Tjtyp,
        Frekvens,
        Schemalagd,
      }) => ({
        turId: Turid,
        date: Datum,
        vehicle: Bil,
        customerNumber: Kundnr,
        houseNumber: Hsnr,
        jobNumber: Tjnr,
        decision: Dec,
        sequenceNumber: Turordningsnr,
        wasteType: Avftyp,
        serviceType: Tjtyp,
        frequency: Frekvens,
        scheduled: Schemalagd,
        position: { lat: Lat, lon: Lng },
      })
    )
    // You can use shareReplay if you need the data to be multicasted to multiple subscribers
  )
}

export default execute()
