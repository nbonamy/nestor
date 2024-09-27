
import * as mdns from 'mdns'

export class NestorService {

  name: string
  port: number
  path: string
  advertise: mdns.Advertisement

  constructor(name: string, port: number, path: string) {
    this.name = name
    this.port = port
    this.path = path
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

}
