import { expect, describe, beforeEach, it } from '@jest/globals'
import { VirtualTime } from '../../models/VirtualTime'

const timeout = (fn, ms: number) =>
  new Promise((resolve) => timeout(() => resolve(fn()), ms))

describe('VirtualTime', () => {
  let virtualTime

  beforeEach(() => {
    virtualTime = new VirtualTime(1)
  })

  it('can pass the time', async () => {
    let start = await virtualTime.getTimeInMillisecondsAsPromise()

    timeout(async () => {
      expect(await virtualTime.getTimeInMillisecondsAsPromise()).toBeCloseTo(
        start + 1000
      )
    }, 1000)
  })

  it('can pause and receive same time', async () => {
    let start = await virtualTime.getTimeInMillisecondsAsPromise()
    virtualTime.pause()

    await timeout(async () => {
      const time = await virtualTime.getTimeInMillisecondsAsPromise()
      expect(time).toBeCloseTo(start)
    }, 1000)
  })

  it('can pause and receive same time after play', async () => {
    let start = await virtualTime.getTimeInMillisecondsAsPromise()
    virtualTime.pause()

    timeout(async () => {
      virtualTime.play()
      const time = await virtualTime.getTimeInMillisecondsAsPromise()
      expect(time.toBeCloseTo(start))
    }, 1000)
  })

  it('can pause and resume and receive same time plus extra time', async () => {
    let start = await virtualTime.getTimeInMillisecondsAsPromise()
    console.log('start', start)
    virtualTime.pause()

    timeout(async () => {
      expect(await virtualTime.getTimeInMillisecondsAsPromise()).toBeCloseTo(
        start
      )
      virtualTime.play()

      timeout(async () => {
        const time = await virtualTime.getTimeInMillisecondsAsPromise()
        expect(time.toBeCloseTo(start + 1000))
      }, 1000)
    }, 1000)
  })
})
