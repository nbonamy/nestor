 
 import { NestorClient } from './index'

 const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

 (async () => {

  const client = new NestorClient({ logger: null })
  await sleep(1000)

  // show hubs
  const status = await client.status()
  console.log(`Found ${status.hubs.length} hub(s)`)
  for (const hub of status.hubs) {
    console.log(`  - ${hub.name} @ ${hub.host}:${hub.port}`)
  }

  // now service list
  const list = await client.list()
  console.log(`\nServices:`)
  console.log(list.map((s) => { return { name: s.function.name, description: s.function.description } }))

  process.exit(0)

})()
