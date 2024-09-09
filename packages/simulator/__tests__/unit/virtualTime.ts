import { expect, describe, beforeEach, it } from '@jest/globals'
import { VirtualTime } from '../../models/VirtualTime'

expect.extend({
  toBeCloseTo(x, y) {
    return {
      pass: Math.round(x / 100) === Math.round(y / 100),
      message: () =>
        `Not close enough: expected: ${x}, received: ${y} Diff: ${x - y}`,
    }
  },
})

const timeout = (fn, ms: number) =>
  new Promise((resolve) => setTimeout(() => resolve(ms), ms))

describe('VirtualTime', () => {
  let virtualTime

  beforeEach(() => {
    virtualTime = new VirtualTime(1)
  })

  it('can pass the time', async () => {
    let start = await virtualTime.getTimeInMillisecondsAsPromise()

    setTimeout(async () => {
      expect(await virtualTime.getTimeInMillisecondsAsPromise()).toBeCloseTo(
        start + 1000
      )
    }, 1000)
  })

  it('can pause and receive same time', async () => {
    let start = await virtualTime.getTimeInMillisecondsAsPromise()
    virtualTime.pause()

    await timeout(async () => {
      expect(await virtualTime.getTimeInMillisecondsAsPromise()).toBeCloseTo(
        start
      )
    }, 1000)
  })

  it('can pause and receive same time after play', (done) => {
    let start = await virtualTime.getTimeInMillisecondsAsPromise()
    virtualTime.pause()

    setTimeout(() => {
      virtualTime.play()
      expect(await virtualTime.getTimeInMillisecondsAsPromise()).toBeCloseTo(
        start
      )
      done()
    }, 1000)
  })

  it('can pause and resume and receive same time plus extra time', (done) => {
    let start = await virtualTime.getTimeInMillisecondsAsPromise()
    console.log('start', start)
    virtualTime.pause()

    setTimeout(() => {
      expect(await virtualTime.getTimeInMillisecondsAsPromise()).toBeCloseTo(
        start
      )
      virtualTime.play()

      setTimeout(() => {
        expect(await virtualTime.getTimeInMillisecondsAsPromise()).toBeCloseTo(
          start + 1000
        )
        done()
      }, 1000)
    }, 1000)
  })
})
