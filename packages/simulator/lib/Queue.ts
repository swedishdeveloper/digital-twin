import { Subject, mergeMap, catchError, from, Subscription } from 'rxjs'
import { debug, error } from './log'

interface QueueItem {
  fn: () => Promise<any>
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

class Queue {
  private queueSubject: Subject<QueueItem>
  private queueLength: number
  private subscription: Subscription

  constructor(private apiCallLimit: number = 10) {
    this.queueSubject = new Subject<QueueItem>()
    this.queueLength = 0
    this.subscription = this.queueSubject
      .pipe(
        mergeMap(
          ({ fn, resolve, reject }) =>
            from(fn()).pipe(
              mergeMap((result) => {
                this.queueLength--
                debug('queueLength', this.queueLength)
                resolve(result)
                return []
              }),
              catchError((err) => {
                this.queueLength--
                error('error queue', err, this.queueLength)
                reject(err)
                return []
              })
            ),
          this.apiCallLimit
        )
      )
      .subscribe()
  }

  public enqueue(fn: () => Promise<any>): Promise<any> {
    this.queueLength++
    return new Promise<any>((resolve, reject) => {
      this.queueSubject.next({
        fn,
        resolve,
        reject,
      })
    })
  }

  public getQueueLength(): number {
    return this.queueLength
  }

  public unsubscribe(): void {
    this.subscription.unsubscribe()
  }
}

export default Queue
