 
 import { NestorClient } from './index'

 const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

 (async () => {

  const client = new NestorClient({ logger: null })
  await sleep(1000)

  // show hubs
  const status = await client.status()
  console.log(`Found ${status.hubs.length} hub(s)`)
  for (const hub of status.hubs) {
    console.log(`  * ${hub.name} @ ${hub.host}:${hub.port}`)
    for (const tool of hub.tools) {
      console.log(`    - ${tool}`)
    }
  }

  // done
  process.exit(0)

})()
