
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import * as mdns from 'mdns'
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
discoveryService.start((service: mdns.Service) => {
  if (service.name) {
    serviceDirectory.add(service.name, service.host, service.port, service.txtRecord.path)
  }
}, (service: mdns.Service) => {
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
app.use('/toolbox', toolboxRouter)
app.use('/tools', toolsRouter)

// not found middleware comes last
app.use(function(req, res) {
  res.status(404).send({url: `"${req.originalUrl}" not found`})
})

// help
export const startHub = (name: string, port: number) => {

  app.listen(port, () => {
    
    console.log(`Nestor Hub is listening at http://localhost:${port}`)

    // subtype is not consistently supported so using txtRecord too
    const ad = mdns.createAdvertisement(mdns.tcp('nestor', 'hub'), port, {
      name: name,
      txtRecord: {
        type: 'hub',
      }
    })
    ad.start()

  })

}
