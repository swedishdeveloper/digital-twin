import { interval, firstValueFrom, Observable } from 'rxjs'
import {
  scan,
  shareReplay,
  map,
  filter,
  distinctUntilChanged,
} from 'rxjs/operators'
import { addMilliseconds, startOfDay, addHours, getUnixTime } from 'date-fns'

class VirtualTime {
  stop() {
    throw new Error('Method not implemented.')
  }
  private startHour: number
  public timeMultiplier: number
  private internalTimeScale: number
  private currentTime: Observable<Date>

  constructor(timeMultiplier: number = 1, startHour: number = 6.8) {
    this.startHour = startHour
    this.timeMultiplier = timeMultiplier
    this.startHour = startHour
    this.internalTimeScale = 1
    this.currentTime = this.reset()
  }

  reset(): Observable<Date> {
    const startDate = addHours(startOfDay(new Date()), this.startHour)
    const msUpdateFrequency = 100
    this.currentTime = interval(msUpdateFrequency).pipe(
      scan(
        (acc) =>
          addMilliseconds(
            acc,
            msUpdateFrequency * this.timeMultiplier * this.internalTimeScale
          ),
        startDate
      ),
      shareReplay(1)
    )
    return this.currentTime
  }

  getTimeStream() {
    return this.currentTime
  }

  getTimeInMilliseconds(): Observable<number> {
    return this.currentTime.pipe(
      map(getUnixTime),
      map((e: number) => e * 1000),
      distinctUntilChanged()
    )
  }

  getTimeInMillisecondsAsPromise(): Promise<number> {
    return firstValueFrom(this.getTimeInMilliseconds())
  }

  play(): void {
    this.internalTimeScale = 1
  }

  pause(): void {
    this.internalTimeScale = 0
  }

  async waitUntil(time: number): Promise<void> {
    if (this.timeMultiplier === 0) return // don't wait when time is stopped
    if (this.timeMultiplier === Infinity) return // return directly if time is set to infinity
    const waitUntil = time
    await firstValueFrom(
      this.currentTime.pipe(filter((e) => e.getTime() >= waitUntil))
    )
  }

  async wait(ms: number): Promise<void> {
    const now = await this.getTimeInMillisecondsAsPromise()
    await this.waitUntil(now + ms)
  }

  // Set the speed in which time should advance
  setTimeMultiplier(timeMultiplier: number): void {
    this.timeMultiplier = timeMultiplier
  }
}

export { VirtualTime }
