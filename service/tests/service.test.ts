
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
  const onServiceUp = vi.fn(() => { connected = true })
  const onServiceDown = vi.fn(() => { connected = false })
  browser.on('serviceUp', onServiceUp)
  browser.on('serviceDown', onServiceDown)
  browser.start()

  const nestorService = new NestorService('service', 3000, '/list')
  await vi.waitUntil(() => connected, 5000)
  const payloadUp = onServiceUp.mock.lastCall[0]
  expect(payloadUp.port).toBe(3000)
  expect(payloadUp.type.name).toBe('nestor')
  expect(payloadUp.txtRecord).toStrictEqual({ type: 'service', path: '/list' })

  nestorService.stop()
  await vi.waitUntil(() => !connected, 5000)
  const payloadDown = onServiceDown.mock.lastCall[0]
  expect(payloadDown.type.name).toBe('nestor')

})

test('Manual start', async () => {

  let connected = false
  const browser = mdns.createBrowser(mdns.tcp('nestor'))
  const onServiceUp = vi.fn(() => { connected = true })
  const onServiceDown = vi.fn(() => { connected = false })
  browser.on('serviceUp', onServiceUp)
  browser.on('serviceDown', onServiceDown)
  browser.start()

  const nestorService = new NestorService('service', 3000, '/list', { autostart: false })
  await vi.waitFor(() =>  {}, 5000)
  expect(connected).toBe(false)

  await nestorService.start()
  await vi.waitUntil(() => connected, 5000)

  nestorService.stop()
  await vi.waitUntil(() => !connected, 5000)

})

test('Manual connect', async () => {

  const nestorService = new NestorService('service', 3000, '/list', { autostart: false })
  await nestorService.register('localhost', 3000)
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/3000\/service\/register/), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'service', port: 3000, path: '/list' })
  })

  await nestorService.unregister('localhost', 3000)
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/3000\/service\/unregister/), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'service' })
  })

  await expect((async () => { await nestorService.register('localhost', 3001) })()).rejects.toThrowError(/failed/)
  await expect((async () => { await nestorService.unregister('localhost', 3001) })()).rejects.toThrowError(/failed/)
  
})
