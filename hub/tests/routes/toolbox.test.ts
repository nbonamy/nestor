
import { vi, test, expect } from 'vitest'
import supertest from 'supertest'
import app from '../../src/server'

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

test('toolbox', async () => {
  const res = await supertest(app).get('/toolbox')
  expect(res.status).toBe(200)
  expect(res.body).toEqual([
    { type: 'function',
      function: {
        name: 'id1',
        description: 'description1',
        parameters: {
          type: 'object',
          properties: {
            name1: {
              type: 'string',
              description: 'description11',
            },
            name2: {
              type: 'string',
              description: 'description12',
            }
          },
          required: [ 'name1' ]
        },
      },
    },
    { type: 'function',
      function: {
        name: 'id2',
        description: 'description2',
        parameters: {
          type: 'object',
          properties: { },
          required: [ ]
        },
      },
    }    
  ])
})
