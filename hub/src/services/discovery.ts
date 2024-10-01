
import mdns from 'mdns'

export default class DiscoveryService {

  browser!: mdns.Browser

  start(onUp: CallableFunction, onDown: CallableFunction) {
    
    // getaddr fails: https://stackoverflow.com/questions/29589543/raspberry-pi-mdns-getaddrinfo-3008-error
    this.browser = mdns.createBrowser(mdns.tcp('nestor'), { resolverSequence: [
      mdns.rst.DNSServiceResolve(),
      'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
      mdns.rst.makeAddressesUnique()
    ]})
    this.browser.on('serviceUp', (service: mdns.Service) => {
      onUp(service)
    })
    this.browser.on('serviceDown', (service: mdns.Service) => {
      onDown(service)
    });
    this.browser.start();

  }

  stop() {
    this.browser?.stop()
  }

}
