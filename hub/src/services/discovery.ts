
import mdns from 'mdns'

export default class DiscoveryService{

  browser!: mdns.Browser

  start(onUp: CallableFunction, onDown: CallableFunction) {

    this.browser = mdns.createBrowser(mdns.tcp('nestor'))
    this.browser.on('serviceUp', service => {
      const txtRecord = service.txtRecord
      if (txtRecord && txtRecord.type === 'service') {
        onUp(service)
      }
    });
    this.browser.on('serviceDown', service => {
      onDown(service)
    });
    this.browser.start();

  }

}
