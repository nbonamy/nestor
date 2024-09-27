
import { Router } from 'express'
import ServiceDirectory from '../services/directory'
import { invoke } from '../services/invoke'

export const toolsRouter = (directory: ServiceDirectory) => {
  
  const router = Router()

  router.post('/:name', async (req, res) => {
    try {

      // browse services
      for (const service of directory.services) {
        
        // find endpoint
        const endpoint = service.endpoints?.find((e) => e.id === req.params.name)
        if (endpoint) {
          res.json(await invoke(endpoint, req))
          return
        }
      
      }

      // unknown tool
      res.sendStatus(400)

    } catch (err: unknown) {
      console.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  return router

}
