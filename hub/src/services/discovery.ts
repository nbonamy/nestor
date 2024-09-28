
import mdns from 'mdns'

export default class DiscoveryService{

  browser!: mdns.Browser

  start(onUp: CallableFunction, onDown: CallableFunction) {

    // getaddr fails: https://stackoverflow.com/questions/29589543/raspberry-pi-mdns-getaddrinfo-3008-error
    this.browser = mdns.createBrowser(mdns.tcp('nestor'), { resolverSequence: [
      mdns.rst.DNSServiceResolve(),
      'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
      mdns.rst.makeAddressesUnique()
    ]})
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
