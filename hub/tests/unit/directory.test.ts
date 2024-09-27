
import { vi, test, expect } from 'vitest'
import ServiceDirectory from '../../src/services/directory'

global.fetch = vi.fn((req) => {
  if (req.endsWith('/none')) return { json: () => [] }
  if (req.endsWith('/single')) return { json: () => [{}]}
  if (req.endsWith('/dual')) return { json: () => [{}, {}]}
  if (req === '/error') throw new Error('error')
})

test('adds services', async () => {
  const directory = new ServiceDirectory()
  await directory.add('name', 'host', 123, '/none')
  expect(directory.services.length).toBe(1)
  expect(directory.services[0].name).toBe('name')
  expect(directory.services[0].host).toBe('host')
  expect(directory.services[0].port).toBe(123)
  expect(directory.services[0].path).toBe('/none')
  expect(directory.services[0].endpoints.length).toBe(0)
  await directory.add('name2', 'hots', 321, '/none')
  expect(directory.services.length).toBe(2)
  expect(directory.services[1].name).toBe('name2')
  expect(directory.services[1].host).toBe('hots')
  expect(directory.services[1].port).toBe(321)
  expect(directory.services[1].path).toBe('/none')
  expect(directory.services[1].endpoints.length).toBe(0)
})

test('updates service', async () => {
  const directory = new ServiceDirectory()
  await directory.add('name', 'host', 123, '/none')
  await directory.add('name', 'host2', 456, '2/none')
  expect(directory.services.length).toBe(1)
  expect(directory.services[0].name).toBe('name')
  expect(directory.services[0].host).toBe('host2')
  expect(directory.services[0].port).toBe(456)
  expect(directory.services[0].path).toBe('2/none')
  expect(directory.services[0].endpoints.length).toBe(0)
})

test('removes service', async () => {
  const directory = new ServiceDirectory()
  directory.add('name', 'host', 123, '/none')
  directory.remove('name')
  expect(directory.services.length).toBe(0)
})

test('fetches endpoints', async () => {
  const directory = new ServiceDirectory()
  await directory.add('name', 'host', 123, '/single')
  expect(directory.services[0].endpoints.length).toBe(1)
  await directory.add('name', 'host', 123, '/dual')
  expect(directory.services[0].endpoints.length).toBe(2)
})

test('handles errors', async () => {
  const directory = new ServiceDirectory()
  await directory.add('name', 'host', 123, '/error')
  expect(directory.services).toHaveLength(0)
})
