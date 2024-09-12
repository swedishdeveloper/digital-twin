import { from, Observable } from 'rxjs'
import { map, filter, shareReplay } from 'rxjs/operators'
import { readXlsx } from '../adapters/xlsx'

interface Ombud {
  position: {
    lon: number
    lat: number
  }
  operator: string
  frequency: string
  id: string
  type: string
  municipality: string
}

function execute(): Observable<Ombud> {
  return from(
    readXlsx(
      `${process.cwd()}/data/${process.env.postombud_file || 'ombud.xlsx'}`,
      `${process.env.postombud_sheet || 'Sammanställning korr'}`
    )
  ).pipe(
    map(
      ({
        X_WGS84,
        Y_WGS84,
        Omb_TYP,
        LevFrekv,
        OPERATÖR,
        DB_ID,
        KOMMUNNAMN,
      }) => ({
        position: {
          lon: parseFloat(X_WGS84),
          lat: parseFloat(Y_WGS84),
        },
        operator: OPERATÖR,
        frequency: LevFrekv,
        id: DB_ID,
        type: Omb_TYP,
        municipality: KOMMUNNAMN,
      })
    ),
    filter((ombud) => ombud.type === 'Postombud'),
    shareReplay()
  )
}

export default execute()
