
import { vi, test, expect } from 'vitest'
import ServiceDiscovery from '../../src/services/discovery'
import mdns from 'mdns'

vi.mock('mdns', () => {
  const browser = {
    start : vi.fn(),
    on: vi.fn()
  }
  return { default: {
    tcp: vi.fn(),
    createBrowser: vi.fn(() => browser)
  }}
})

test('creates browser', async () => {
  const discovery = new ServiceDiscovery()
  expect(mdns.createBrowser).not.toHaveBeenCalled()
  discovery.start(() => {}, () => {})
  expect(mdns.createBrowser).toHaveBeenCalled()
})

test('calls callbacks', async () => {
  const onUp = vi.fn(() => {})
  const onDown = vi.fn(() => {})
  const discovery = new ServiceDiscovery()
  discovery.start(onUp, onDown)
  expect(onUp).not.toHaveBeenCalled()
  expect(onDown).not.toHaveBeenCalled()
  //TODO
})
