
import { vi, test, expect } from 'vitest'
import ServiceDiscovery from '../../src/services/discovery'
import mdns from 'mdns'

const spyCreateBrowser = vi.spyOn(mdns, 'createBrowser')

class ServiceMock {
  ad: any

  // subtype is not consistently supported so using txt.type too
  start(port: number) {
    this.ad = mdns.createAdvertisement(mdns.tcp('nestor', 'service'), port, {
      name: 'service-test-1',
      txtRecord: {
        type: 'service',
      }
    })
    this.ad.start()
  }
  stop() {
    this.ad.stop()
  }
}

test('creates browser', async () => {
  const discovery = new ServiceDiscovery()
  discovery.start(() => {}, () => {})
  expect(spyCreateBrowser).toHaveBeenCalled()
})

test('calls callbacks', async () => {
  let count = 0
  const onUp = vi.fn((service) => {
    if (service.name === 'service-test-1') {
      count = count + 1
    }
  })
  const onDown = vi.fn((service) => {
    if (service.name === 'service-test-1') {
      count = count - 1
    }
  })
  const discovery = new ServiceDiscovery()
  discovery.start(onUp, onDown)
  const serviceMock = new ServiceMock()
  serviceMock.start(3000)
  await vi.waitUntil(() => count > 0, 5000)
  expect(onUp).toHaveBeenCalled()
  expect(onDown).not.toHaveBeenCalled()
  serviceMock.stop()
  await vi.waitUntil(() => count == 0, 5000)
  expect(onDown).toHaveBeenCalled()
})
