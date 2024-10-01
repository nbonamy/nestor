
import { vi, test, expect, beforeEach } from 'vitest'
import { NestorClient } from '../src/index'
import { Bonjour } from 'bonjour-service'

global.fetch = vi.fn((req) => {
  if (req.includes('6000')) return { ok: true, json: () => { return { tools: [] } } }
  if (req.includes('6001')) {
    if (req.includes('toolbox')) {
      return { ok: true, json: () => { return { tools: [
        { function: { name: '1' } },
        { function: { name: '2' } },
        { function: { name: '3' } },
      ] } } }
    } else {
      return { ok: true, json: () => { return { result: 'ok' }}}
    }
  }
  if (req.includes('6002')) {
    throw new Error('not supposed to happen')
  }

  // assuming other ports are real hubs
  return { ok: true, json: () => { return { tools: [] } } }
})

const logger = {
  log: vi.fn(),
  error: vi.fn()
}

class HubMock {
  ad: any
  
  // subtype is not consistently supported so using txt.type too
  start(port: number) {
    const bonjour = new Bonjour()
    this.ad = bonjour.publish({
      name: 'hub-test-1',
      type: 'nestor',
      subtypes: [ 'hub' ],
      port: port,
      txt: {
        'type': 'hub',
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

const mockHub = (client: NestorClient) => {
  return client.hubs.find(hub => hub.name === 'hub-test-1')
}

const isConnected = async (client: NestorClient) => {
  await vi.waitUntil(() => mockHub(client), 5000)
}

const isDisconnected = async (client: NestorClient) => {
  await vi.waitUntil(() => !mockHub(client), 5000)
}

const fetchCallWith = (path: string) => {
  return global.fetch.mock.calls.find((c) => c[0].includes(path))
}

test('No hub connected', async () => {
  const client = new NestorClient()
  expect(await client.list()).toStrictEqual([])
  expect(await client.status()).toStrictEqual({ hubs: [] })
  expect(global.fetch).not.toHaveBeenCalled()
  expect(client.logger).toStrictEqual(console)
  client.stop()
  expect(client.browser).toBeUndefined()
})

test('Automatic connection', async() => {
  const client = new NestorClient({ logger: logger })
  const hub = new HubMock()
  hub.start(6000)
  await isConnected(client)
  hub.stop()
  await isDisconnected(client)
})

test('Manual connection', async() => {
  const client = new NestorClient({ logger: logger, autostart: false })
  const hub = new HubMock()
  hub.start(6000)
  expect(client.hubs.length).toBe(0)
  await client.connect('localhost', 6000)
  await vi.waitUntil(() => client.hubs.length > 0, 5000)
  await client.disconnect('localhost', 6000)
  await vi.waitUntil(() => client.hubs.length === 0, 5000)
  hub.stop()
})

test('Empty hub', async () => {
  const client = new NestorClient({ logger: logger })
  const hub = new HubMock()
  hub.start(6000)
  await isConnected(client)
  expect(fetchCallWith('6000/toolbox/openai')).toBeFalsy()
  expect(logger.log).toHaveBeenCalled()
  const list = await client.list()
  expect(fetchCallWith('6000/toolbox/openai')).toBeTruthy()
  expect(list).toStrictEqual([])
  expect((await client.status()).hubs.find((h) => h.name == 'hub-test-1')?.tools).toStrictEqual([])
  hub.stop()
})

test('Hub and different format', async () => {
  const client = new NestorClient({ logger: null, format: 'anthropic' })
  const hub = new HubMock()
  hub.start(6001)
  await isConnected(client)
  const list = await client.list()
  expect(fetchCallWith('6001/toolbox/anthropic')).toBeTruthy()
  expect(mockHub(client)!.tools).toStrictEqual([ { function: { name: '1' } }, { function: { name: '2' } }, { function: { name: '3' } } ])
  expect(list).toStrictEqual([ { function: { name: '1' } }, { function: { name: '2' } }, { function: { name: '3' } } ])
  expect((await client.status()).hubs.find((h) => h.name == 'hub-test-1')?.tools).toStrictEqual(['1', '2', '3'])
  hub.stop()
})

test('Hub in error', async () => {
  const client = new NestorClient({ logger: logger })
  const hub = new HubMock()
  hub.start(6002)
  await isConnected(client)
  await client.list()
  expect(fetchCallWith('6002/toolbox/openai')).toBeTruthy()
  expect(mockHub(client)!.tools).toBeUndefined()
  expect(logger.error).toHaveBeenCalled()
  hub.stop()
})

test('Caches tools', async () => {
  const client = new NestorClient({ logger: null })
  const hub = new HubMock()
  hub.start(6001)
  await isConnected(client)
  await client.list()
  const calls = global.fetch.mock.calls.length
  await client.list()
  expect(global.fetch).toHaveBeenCalledTimes(calls)
  await client.status()
  expect(global.fetch).toHaveBeenCalledTimes(calls)
  hub.stop()
})

test('Unkown tool', async () => {
  const client = new NestorClient({ logger: null })
  const hub = new HubMock()
  hub.start(6001)
  await isConnected(client)
  await client.list()
  await expect((async () => { await client.call('not found', {})})()).rejects.toThrowError(/not found/)
  hub.stop()
})

test('Calls tool', async () => {
  const client = new NestorClient({ logger: null })
  const hub = new HubMock()
  hub.start(6001)
  await isConnected(client)
  await client.list()
  const response = await client.call('1', { key: 'value' })
  expect(global.fetch).toHaveBeenLastCalledWith(expect.stringMatching(/6001\/tools\/1/), {
    body: '{"key":"value"}',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  expect(response).toStrictEqual({ result: 'ok' })
  hub.stop()
})
