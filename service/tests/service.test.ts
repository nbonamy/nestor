
import { vi, test, expect } from 'vitest'
import { NestorService } from '../src/index'
import mdns from 'mdns'

test('Advertises itself', async () => {

  let connected = false
  const browser = mdns.createBrowser(mdns.tcp('nestor'))
  const onServiceUp = vi.fn(() => { connected = true })
  const onServiceDown = vi.fn(() => { connected = false })
  browser.on('serviceUp', onServiceUp)
  browser.on('serviceDown', onServiceDown)
  browser.start()

  const nestorService = new NestorService('service', 3000, '/list')

  nestorService.start()
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