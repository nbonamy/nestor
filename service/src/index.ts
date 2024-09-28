
import * as mdns from 'mdns'

export interface NestorServiceOptions {
  autostart?: boolean
}

export class NestorService {

  name: string
  port: number
  path: string
  advertise: mdns.Advertisement

  constructor(name: string, port: number, path: string, opts?: NestorServiceOptions) {

    // save
    this.name = name
    this.port = port
    this.path = path

    // autostart
    if (opts?.autostart !== false) {
      this.start()
    }
  }

  start(): void {
    // subtype is not consistently supported so using txtRecord too
    this.advertise = mdns.createAdvertisement(mdns.tcp('nestor', 'service'), this.port, {
      name: this.name,
      txtRecord: {
        type: 'service',
        path: this.path,
      }
    })
    this.advertise.start()
  }

  stop(): void {
    this.advertise.stop()
  }

  async register(host: string, port: number): Promise<void> {

    const url = `http://${host}:${port}/service/register`
    const body = { name: this.name, port: this.port, path: this.path }
    try {
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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
    } catch (err) {
      console.error(`Error while unregistering service at ${url}`, err)
      throw err
    }
  
  }

}
