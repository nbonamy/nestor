
import Bonjour from 'bonjour'

export default class DiscoveryService {

  browser?: Bonjour.Browser

  start(onUp: CallableFunction, onDown: CallableFunction) {

    this.browser = Bonjour().find({ type: 'nestor' })
    this.browser.on('up', (service: any) => {
      onUp(service)
    })
    this.browser.on('down', (service: any) => {
      onDown(service)
    })
    this.browser.start()

  }

  stop() {
    this.browser?.stop
  }

}
