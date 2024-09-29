
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import Bonjour from 'bonjour'
import cors from 'cors'

// load config
import dotenv from 'dotenv'
dotenv.config()

// local services
import logger from './services/logger'
import ServiceDirectory from './services/directory'
import DiscoveryService from './services/discovery'

// start discovery immediately
const serviceDirectory = new ServiceDirectory()
const discoveryService = new DiscoveryService()
discoveryService.start((service: Bonjour.RemoteService) => {
  if (service.name && (service.subtypes.includes('service') || service.txt.type === 'service')) {
    serviceDirectory.add(service.name, service.host, service.port, service.txt.path)
  }
}, (service: Bonjour.Service) => {
  if (service.name) {
    serviceDirectory.remove(service.name)
  }
})

// init
export const app: Express = express()

// logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: { write: (message: string) => logger.http(message.trim()), }
}))

// security
if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
}

// cors
app.use(cors({
  origin: '*'
}))

// body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// simple
app.get('/ping', (req, res) => {
  res.send('pong')
})

// add service directory as middleware
app.use((req, res, next) => {
  req.serviceDirectory = serviceDirectory
  next()
})

// routes
import toolsRouter from './routes/tools'
import toolboxRouter from './routes/toolbox'
import serviceRouter from './routes/service'
app.use('/service', serviceRouter)
app.use('/toolbox', toolboxRouter)
app.use('/tools', toolsRouter)

// not found middleware comes last
app.use(function(req, res) {
  res.status(404).send({url: `"${req.originalUrl}" not found`})
})


// shutdown
let advertise: Bonjour.Service|null = null
process.on('SIGINT', async () => {

  // log
  console.log('Shutting down Nestor hub')

  // first stop advertising
  const promise = new Promise<void>((resolve) => {
    advertise?.stop(() => resolve())
  })
  await promise
  
  // done
  process.exit(0)

})

// publish
const publish = (baseName: string, port: number, index: number) => {
  
  const name = index == 0 ? baseName : `${baseName} (${index})`

  advertise = Bonjour().publish({
    name: name,
    type: 'nestor',
    subtypes: [ 'hub' ],
    port: port,
    txt: {
      type: 'hub',
    }
    })

    advertise.on('error', (error) => {
    if (error.message === 'Service name is already in use on the network') {
      publish(baseName, port, index + 1)
    } else {
      throw error
    }
  })

  advertise.on('up', () => {
    console.log(`Hub published as "${name}" on network`)
  })

  advertise.start()

}

// help
export const startHub = (name: string, port: number) => {
  app.listen(port, () => {
    console.log(`Nestor Hub is listening at http://localhost:${port}`)
    publish(name, port, 0)
  })
}
