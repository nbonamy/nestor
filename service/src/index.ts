
import Bonjour from 'bonjour'

export interface NestorServiceOptions {
  autostart?: boolean
}

interface Registration {
  host: string
  port: number
}

export class NestorService {

  private name: string
  private port: number
  private path: string
  private registrations: Registration[]
  private advertise?: Bonjour.Service

  constructor(name: string, port: number, path: string, opts?: NestorServiceOptions) {

    // init
    this.registrations = []

    // save
    this.name = name
    this.port = port
    this.path = path

    // autostart
    if (opts?.autostart !== false) {
      this.start()
    }

    // proper shutdown
    process.on('SIGINT', async () => {
      await this.shutdown()
      process.exit(0)
    })

  }

  start(): void {

    // subtype is not consistently supported so using txt.type too
    this.advertise = Bonjour().publish({
      name: this.name,
      type: 'nestor',
      subtypes: [ 'service' ],
      port: this.port,
      txt: {
        type: 'service',
        path: this.path,
      }
    })
    this.advertise.start()

  }

  stop(): void {
    this.advertise?.stop()
  }

  async register(host: string, port: number): Promise<void> {

    const url = `http://${host}:${port}/service/register`
    const body = { name: this.name, port: this.port, path: this.path }
    try {
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      this.registrations.push({ host, port })
    } catch (err) {
      console.error(`Error while registering service at ${url}`, err)
      throw err
    }
  
  }

  async unregister(host: string, port: number): Promise<void> {

    const url = `http://${host}:${port}/service/unregister`
    const body = { name: this.name }
    try {
      await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      this.registrations = this.registrations.filter(r => r.host !== host || r.port !== port)
    } catch (err) {
      console.error(`Error while unregistering service at ${url}`, err)
      throw err
    }
  
  }

  async shutdown() {

    // log
    console.log('Shutting down Nestor service')

    // first stop advertising
    const promise = new Promise<void>((resolve) => {
      this.advertise?.stop(() => resolve())
    })
    await promise

    // then unregister
    this.registrations.forEach(async r => await this.unregister(r.host, r.port))
  }

}
