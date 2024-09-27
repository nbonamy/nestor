
import { vi, test, expect, beforeEach } from 'vitest'
import { NestorClient } from '../src/index'
import mdns from 'mdns'

global.fetch = vi.fn((req) => {
  if (req.includes('ping')) return { ok: true }
  if (req.includes('3000')) return { ok: true, json: () => [] }
  if (req.includes('3001')) return { ok: true, json: () => [ 1, 2, 3 ] }
  if (req.includes('3002')) throw new Error('not supposed to happen')
})

const logger = {
  log: vi.fn(),
  error: vi.fn()
}

class HubMock {
  ad: any
  start(port: number) {
    this.ad = mdns.createAdvertisement(mdns.tcp('nestor', 'hub'), port, {
      name: 'Nestor Hub',
      txtRecord: {
        type: 'hub',
      }
    })
    this.ad.start()
  }
  stop() {
    this.ad.stop()
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('No hub connected', async () => {
  const client = new NestorClient({ logger: null })
  expect(await client.list()).toStrictEqual([])
  expect(global.fetch).not.toHaveBeenCalled()
})

test('Empty hub', async () => {
  const client = new NestorClient({ logger: logger })
  const hub = new HubMock()
  hub.start(3000)
  await vi.waitUntil(() => client.hubs.length > 0, 5000)
  await vi.waitUntil(() => client.hubs[0].tools !== null, 5000)
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/3000\/toolbox\/openai/))
  expect(logger.log).toHaveBeenCalled()
  expect(client.hubs.length).toBe(1)
  const list = await client.list()
  expect(global.fetch).toHaveBeenLastCalledWith(expect.stringMatching(/3000\/ping/))
  expect(list).toStrictEqual([])
  hub.stop()
})

test('Hub and different format', async () => {
  const client = new NestorClient({ logger: null, format: 'anthropic' })
  const hub = new HubMock()
  hub.start(3001)
  await vi.waitUntil(() => client.hubs.length > 0, 5000)
  await vi.waitUntil(() => client.hubs[0].tools !== null, 5000)
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/3001\/toolbox\/anthropic/))
  expect(client.hubs.length).toBe(1)
  expect(client.hubs[0].tools).toStrictEqual([1, 2, 3])
  const list = await client.list()
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/3001\/ping/))
  expect(list).toStrictEqual([1, 2, 3])
  hub.stop()
})

test('Hub in error', async () => {
  const client = new NestorClient({ logger: logger })
  const hub = new HubMock()
  hub.start(3002)
  await vi.waitUntil(() => global.fetch.mock.calls.length, 5000)
  expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/3002\/toolbox/))
  expect(client.hubs.length).toBe(0)
  expect(logger.error).toHaveBeenCalled()
  hub.stop()
})
