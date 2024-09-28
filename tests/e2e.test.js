
import { startHub } from '../hub/src/server'
import { NestorService } from '../service/src/index'
import { NestorClient } from '../client/src/index'

// sleep
const sleep = ms => new Promise(res => setTimeout(res, ms));

// mock
const originalFetch = global.fetch
global.fetch = (url, options) => {
  
  // 1st service
  if (url.endsWith(':3001/list')) {
    return { ok: true, json: () => { return { endpoints: [
      { name: 'endpoint1', description: 'endpoint 1', url: 'http://localhost:3001/endpoint1', parameters: [
        { name: 'name1', type: 'string', description: 'description11', required: true },
        { name: 'name2', type: 'string', description: 'description12', required: false }
      ]}
    ] }} }
    
  }

  // 2nd service
  if (url.endsWith(':3002/list')) {
    return { ok: true, json: () => { return { endpoints: [
      { name: 'endpoint2', description: 'endpoint 2', url: 'http://localhost:3001/endpoint2', parameters: [ ] }
    ] }} }
    
  }

  // default
  return originalFetch(url, options)
  
}

let testsCount = 0

const expect = (received) => {
  testsCount += 1
  return {
    toBe: (expected) => {
      if (received !== expected) {
        if (testsCount > 1) {
          console.error(`${testsCount-1} tests passed`)
        }
        console.error(`Test #${testsCount} failed`)
        console.error(`Expected: ${expected}`)
        console.error(`     Got: ${received}`)
        process.exit(1)
      }
    }
  }
}

(async () => {

  // service that auto-registers
  const service1 = new NestorService('Service-Auto', 3001, '/list')

  // now start the hub
  startHub('Test Hub', 3000)
  await sleep(2000)

  // service that manually registers
  const service2 = new NestorService('Service-Manual', 3002, '/list', { autostart: false })
  await service2.register('localhost', 3000)

  // now start the client
  const client1 = new NestorClient()
  await sleep(2000)

  // now list the tools
  const tools1 = await client1.list()
  expect(JSON.stringify(tools1)).toBe('[{"type":"function","function":{"name":"service-auto-endpoint1","description":"endpoint 1","parameters":{"type":"object","properties":{"name1":{"type":"string","description":"description11"},"name2":{"type":"string","description":"description12"}},"required":["name1"]}}},{"type":"function","function":{"name":"service-manual-endpoint2","description":"endpoint 2","parameters":{"type":"object","properties":{},"required":[]}}}]')

  // unregister
  await service2.unregister('localhost', 3000)

  // now list the tools
  const tools2 = await client1.list()
  expect(JSON.stringify(tools2)).toBe('[{"type":"function","function":{"name":"service-auto-endpoint1","description":"endpoint 1","parameters":{"type":"object","properties":{"name1":{"type":"string","description":"description11"},"name2":{"type":"string","description":"description12"}},"required":["name1"]}}}]')

  // and now manual client
  const client2 = new NestorClient({ autostart: false })
  const tools3 = await client2.list()
  expect(JSON.stringify(tools3)).toBe('[]')
  
  // and connect it
  await client2.connect('localhost', 3000)
  const tools4 = await client2.list()
  expect(JSON.stringify(tools4)).toBe('[{"type":"function","function":{"name":"service-auto-endpoint1","description":"endpoint 1","parameters":{"type":"object","properties":{"name1":{"type":"string","description":"description11"},"name2":{"type":"string","description":"description12"}},"required":["name1"]}}}]')
  
  // all good
  console.log(`${testsCount} Test(s) passsed`)
  process.exit(0)

})()
