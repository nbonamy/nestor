
import { startHub } from '../hub/src/server'
import { NestorService } from '../service/src/index'
import { NestorClient } from '../client/src/index'

// sleep
const sleep = ms => new Promise(res => setTimeout(res, ms));

// mock
const originalFetch = global.fetch
global.fetch = (url, options) => {
  
  if (url.endsWith(':3001/list')) {
    return { ok: true, json: () => { return { endpoints: [
      { name: 'endpoint1', description: 'endpoint 1', url: 'http://localhost:3001/endpoint1', parameters: [
        { name: 'name1', type: 'string', description: 'description11', required: true },
        { name: 'name2', type: 'string', description: 'description12', required: false }
      ]},
      { name: 'endpoint2', description: 'endpoint 2', url: 'http://localhost:3001/endpoint2', parameters: [

      ]}
    ] }} }
    
  }

  // default
  return originalFetch(url, options)
  
}

(async () => {

  // first start the service
  const service = new NestorService('Test Service', 3001, '/list')
  service.start()

  // now start the hub
  startHub('Test Hub', 3000)
  await sleep(2000)

  // now start the client
  const client = new NestorClient()
  await sleep(2000)

  // now list the tools
  const tools = await client.list()

  // check
  const expected = '[{"type":"function","function":{"name":"test_service-endpoint1","description":"endpoint 1","parameters":{"type":"object","properties":{"name1":{"type":"string","description":"description11"},"name2":{"type":"string","description":"description12"}},"required":["name1"]}}},{"type":"function","function":{"name":"test_service-endpoint2","description":"endpoint 2","parameters":{"type":"object","properties":{},"required":[]}}}]'
  if (JSON.stringify(tools) === expected) {
    console.log('Test passsed')
    process.exit(0)
  }

  // failed
  console.log('Test failed')
  console.log(`Expected: ${expected}`)
  console.log(`     Got: ${JSON.stringify(tools)}`)
  process.exit(1)

})()
