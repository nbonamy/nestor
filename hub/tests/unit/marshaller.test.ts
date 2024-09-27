
import { vi, test, expect } from 'vitest'
import Marshaller from '../../src/services/marshaller'
import ServiceDirectory from '../../src/services/directory'

global.fetch = vi.fn((req) => {
  if (req === 'http://host1:123/list') return { json: () => { return [{
      description: 'description1',
      url: 'url1',
      parameters: [
        { name: 'name1', type: 'string', description: 'description11', required: true },
        { name: 'name2', type: 'string', description: 'description12', required: false }
      ]
    }]
  }}
  if (req === 'http://host2:123/list') return { json: () => { return [{
      description: 'description2',
      url: 'url2',
      parameters: []
    }]
  }}
})

test('toOpenAI/empty', async () => {
  const serviceDirectory = new ServiceDirectory()
  const marshaller = new Marshaller()
  const result = marshaller.toOpenAI(serviceDirectory)
  expect(result).toStrictEqual([])

})

test('toOpenAI/full', async () => {
  const serviceDirectory = new ServiceDirectory()
  await serviceDirectory.add('id1', 'host1', 123, '/list')
  await serviceDirectory.add('id2', 'host2', 123, '/list')
  const marshaller = new Marshaller()
  const result = marshaller.toOpenAI(serviceDirectory)
  expect(result).toStrictEqual([
    { type: 'function',
      function: {
        name: expect.any(String),
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
        name: expect.any(String),
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
