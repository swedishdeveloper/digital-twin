import { Subject, mergeMap, catchError, from } from 'rxjs'
import { debug, error } from './log'

const API_CALL_LIMIT = 10

interface QueueItem {
  fn: () => Promise<any>
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

const queueSubject = new Subject<QueueItem>()

let queueLength = 0

function queue(fn: () => Promise<any>): Promise<any> {
  queueLength++
  return new Promise<any>((resolve, reject) => {
    queueSubject.next({
      fn,
      resolve,
      reject,
    })
  })
}
// Hantera köade anrop med RxJS
queueSubject
  .pipe(
    // Begränsa antalet samtidiga anrop med mergeMap
    mergeMap(
      ({ fn, resolve, reject }) =>
        from(fn()).pipe(
          // Hantera lyckade anrop och fel
          mergeMap((result) => {
            queueLength--
            debug('queueLength', queueLength)
            resolve(result)
            return []
          }),
          catchError((err) => {
            queueLength--
            error('error queue', err, queueLength)
            reject(err)
            return []
          })
        ),
      API_CALL_LIMIT
    )
  )
  .subscribe()

export default queue
import { Subject, mergeMap, catchError, from } from 'rxjs'
import { debug, error } from './log'

const API_CALL_LIMIT = 10

interface QueueItem {
  fn: () => Promise<any>
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

const queueSubject = new Subject<QueueItem>()

let queueLength = 0

function queue(fn: () => Promise<any>): Promise<any> {
  queueLength++
  return new Promise<any>((resolve, reject) => {
    queueSubject.next({
      fn,
      resolve,
      reject,
    })
  })
}
// Hantera köade anrop med RxJS
queueSubject
  .pipe(
    // Begränsa antalet samtidiga anrop med mergeMap
    mergeMap(
      ({ fn, resolve, reject }) =>
        from(fn()).pipe(
          // Hantera lyckade anrop och fel
          mergeMap((result) => {
            queueLength--
            debug('queueLength', queueLength)
            resolve(result)
            return []
          }),
          catchError((err) => {
            queueLength--
            error('error queue', err, queueLength)
            reject(err)
            return []
          })
        ),
      API_CALL_LIMIT
    )
  )
  .subscribe()

export default queue
