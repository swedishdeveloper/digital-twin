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

describe('VirtualTime', () => {
  let virtualTime

  beforeEach(() => {
    virtualTime = new VirtualTime(1)
  })

  it('can pass the time', (done) => {
    let start = virtualTime.time()

    setTimeout(() => {
      expect(virtualTime.time()).toBeCloseTo(start + 1000)
      done()
    }, 1000)
  })

  it('can pause and receive same time', (done) => {
    let start = virtualTime.time()
    virtualTime.pause()

    setTimeout(() => {
      expect(virtualTime.time()).toBeCloseTo(start)
      done()
    }, 1000)
  })

  it('can pause and receive same time after play', (done) => {
    let start = virtualTime.time()
    virtualTime.pause()

    setTimeout(() => {
      virtualTime.play()
      expect(virtualTime.time()).toBeCloseTo(start)
      done()
    }, 1000)
  })

  it('can pause and resume and receive same time plus extra time', (done) => {
    let start = virtualTime.time()
    console.log('start', start)
    virtualTime.pause()

    setTimeout(() => {
      expect(virtualTime.time()).toBeCloseTo(start)
      virtualTime.play()

      setTimeout(() => {
        expect(virtualTime.time()).toBeCloseTo(start + 1000)
        done()
      }, 1000)
    }, 1000)
  })
})
