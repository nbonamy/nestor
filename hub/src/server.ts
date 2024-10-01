
import express, { Express } from 'express'
import { Service } from 'bonjour-service'
import bodyParser from 'body-parser'
import * as mdns from 'mdns'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import path from 'path'

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
discoveryService.start((service: Service) => {
  if (service.name && (service.subtypes?.includes('service') || service.txt.type === 'service')) {
    serviceDirectory.add(service.name, service.host, service.port, service.txt.path)
  }
}, (service: Service) => {
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
import adminRouter from './routes/admin'
import toolsRouter from './routes/tools'
import toolboxRouter from './routes/toolbox'
import serviceRouter from './routes/service'
app.use('/service', serviceRouter)
app.use('/toolbox', toolboxRouter)
app.use('/tools', toolsRouter)
app.use('/admin', adminRouter)

// static content
app.use(express.static(path.join('src', 'public')))

// shutdown
let ad: mdns.Advertisement|null = null
process.on('SIGINT', async () => {

  // log
  console.log('Shutting down Nestor hub')

  // first stop advertising
  ad?.stop()
  
  // done
  process.exit(0)

})

// publish
const publish = (name: string, port: number) => {

  // we use mdns instead of bonjour-service here 
  // https://github.com/onlxltd/bonjour-service/issues/46

  // subtype is not consistently supported so using txtRecord too
  ad = mdns.createAdvertisement(mdns.tcp('nestor', 'hub'), port, {
    name: name,
    txtRecord: {
      type: 'hub',
    }
  })
  ad.start()

}

// help
export const startHub = (name: string, port: number) => {
  app.listen(port, () => {
    console.log(`Nestor Hub is listening at http://localhost:${port}`)
    publish(name, port)
  })
}
