
import { vi, test, expect } from 'vitest'
import supertest from 'supertest'
import app from '../../src/server'

global.fetch = vi.fn((req) => {
  const path = req.split('?')[0]
  if (path.endsWith('url1')) return { json: () => { return { result: [ 0, 1, req.split('?')[1] ] } } }
  if (path === '/error') throw new Error('error')
})

vi.mock('../../src/services/directory', () => {
  const ServiceDirectory = vi.fn()
  ServiceDirectory.prototype.services = [
    {
      endpoints: [
        {
          id: 'id1',
          description: 'description1',
          url: 'url1',
          parameters:[
            { name: 'name1', type: 'string', description: 'description11', required: true },
            { name: 'name2', type: 'string', description: 'description12', required: false }
          ]
        },
        {
          id: 'id2',
          description: 'description2',
          url: 'url2',
          parameters: []
        }
      ]
    }
  ]
  return { default: ServiceDirectory }
})

test('invoke', async () => {
  const res = await supertest(app).post('/tools/id1').send({ q: 'hello' })
  expect(fetch).toBeCalledWith('url1?q=hello')
  expect(res.status).toBe(200)
  expect(res.body).toEqual({ result: [ 0, 1, 'q=hello' ]})
})

test('handles errors', async () => {
  const res = await supertest(app).post('/tools/id2').send({ q: 'hello' })
  expect(fetch).toBeCalledWith('url2?q=hello')
  expect(res.status).toBe(500)
  expect(res.body.error).toMatch(/undefined/)
})
