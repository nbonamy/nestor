
import portfinder from 'portfinder'
import * as mdns from 'mdns'
import app from './server'

// now start it
portfinder.getPort({ port: 3000 }, (err, port) => {

  if (err) {
    console.error('Error while finding port', err)
    process.exit(1)
  }
  
  app.listen(port, () => {
    
    console.log(`Nestor Hub is listening at http://localhost:${port}`)

    // subtype is not consistently supported so using txtRecord too
    const ad = mdns.createAdvertisement(mdns.tcp('nestor', 'hub'), port, {
      name: 'Nestor Hub',
      txtRecord: {
        type: 'hub',
      }
    })
    ad.start()

  })

})
