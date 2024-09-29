 
 import { NestorClient } from './index'

 const sleep = ms => new Promise(res => setTimeout(res, ms));

 (async () => {

  const client = new NestorClient({ logger: null })
  await sleep(1000)

  // show hubs
  console.log(`Found ${client.hubs.length} hub(s)`)
  for (const hub of client.hubs) {
    console.log(`  - ${hub.name} @ ${hub.host}:${hub.port}`)
  }

  // now service list
  const list = await client.list()
  console.log(`\nServices:`)
  console.log(list.map((s) => { return { name: s.function.name, description: s.function.description } }))

  process.exit(0)

})()
