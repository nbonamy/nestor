
import { vi, test, expect } from 'vitest'
import { NestorService } from '../src/index'
import mdns from 'mdns'

global.fetch = vi.fn((req) => {
  if (req.includes('3000'))  return { ok: true }
  else throw new Error('connection failed')
})

test('Advertises itself', async () => {

  let connected = false
  const browser = mdns.createBrowser(mdns.tcp('nestor'))
  const onServiceUp = vi.fn((service) => {
    if (service.name === 'service-test-1') {
      connected = true
    }
  })
  const onServiceDown = vi.fn((service) => {
    if (service.name === 'service-test-1') {
      connected = false
    }
  })
  browser.on('serviceUp', onServiceUp)
  browser.on('serviceDown', onServiceDown)
  browser.start()

  const nestorService = new NestorService('service-test-1', 3000, '/list')
  await vi.waitUntil(() => connected, 5000)
  const payloadUp = onServiceUp.mock.calls.find((c: any) => c[0].name === 'service-test-1')
  expect(payloadUp).toBeDefined()
  if (payloadUp) {
    expect(payloadUp[0].port).toBe(3000)
    expect(payloadUp[0].txtRecord).toStrictEqual({ type: 'service', path: '/list' })
  }

  nestorService.stop()
  await vi.waitUntil(() => !connected, 5000)

})

test('Manual start', async () => {

  let connected = false
  const browser = mdns.createBrowser(mdns.tcp('nestor'))
  const onServiceUp = vi.fn((service) => {
    if (service.name === 'service-test-2') {
      connected = true
    }
  })
  const onServiceDown = vi.fn((service) => {
    if (service.name === 'service-test-2') {
      connected = false
    }
  })
  browser.on('serviceUp', onServiceUp)
  browser.on('serviceDown', onServiceDown)
  browser.start()

  const nestorService = new NestorService('service-test-2', 3000, '/list', { autostart: false })
  await vi.waitFor(() =>  {}, 5000)
  expect(connected).toBe(false)

  await nestorService.start()
  await vi.waitUntil(() => connected, 5000)

  nestorService.stop()
  await vi.waitUntil(() => !connected, 5000)

})

test('Manual connect', async () => {

  const nestorService = new NestorService('service-test-3', 3000, '/list', { autostart: false })
  await nestorService.register('localhost', 3000)
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/3000\/service\/register/), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'service-test-3', port: 3000, path: '/list' })
  })

  await nestorService.unregister('localhost', 3000)
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/3000\/service\/unregister/), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'service-test-3' })
  })

  await expect((async () => { await nestorService.register('localhost', 3001) })()).rejects.toThrowError(/failed/)
  await expect((async () => { await nestorService.unregister('localhost', 3001) })()).rejects.toThrowError(/failed/)
  
})
