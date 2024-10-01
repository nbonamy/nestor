
import { Bonjour, Browser, Service } from 'bonjour-service'

export default class DiscoveryService {

  bonjour!: Bonjour
  browser?: Browser

  start(onUp: CallableFunction, onDown: CallableFunction) {
    this.bonjour = new Bonjour()
    this.browser = this.bonjour.find({ type: 'nestor' })
    this.browser.on('up', (service: Service) => {
      onUp(service)
    })
    this.browser.on('down', (service: Service) => {
      onDown(service)
    })
    this.browser.start()

  }

  stop() {
    this.browser?.stop()
  }

}
