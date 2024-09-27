
import { vi, test, expect } from 'vitest'
import { invoke } from '../../src/services/invoke'

global.fetch = vi.fn((req) => {
  const path = req.split('?')[0]
  if (path.endsWith('/none')) return { json: () => [] }
  if (path.endsWith('/single')) return { json: () => [{}]}
  if (path.endsWith('/dual')) return { json: () => [{}, {}]}
  if (path === '/error') throw new Error('error')
})

test('invokes endpoint', async () => {
  const res = await invoke({ url: 'http://host:123/none', }, { body: { q: 'hello' } })
  expect(fetch).toBeCalledWith('http://host:123/none?q=hello')
  expect(res).toEqual([])
})

test('encodes uri components', async () => {
  const res = await invoke({ url: 'http://host:123/single', }, { body: { q: 'h ll%' } })
  expect(fetch).toBeCalledWith('http://host:123/single?q=h%20ll%25')
  expect(res).toEqual([{}])
})

test('handles errors', async () => {
  await expect((async () => { await invoke({ url: 'http://host:123/error', }, { body: { q: 'h ll%' } }) })()).rejects.toThrowError(/undefined/)
  expect(fetch).toBeCalledWith('http://host:123/error?q=h%20ll%25')
})
