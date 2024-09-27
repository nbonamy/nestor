
import { Router } from 'express'
import ServiceDirectory from '../services/directory'
import { invoke } from '../services/invoke'
export const toolsRouter = (directory: ServiceDirectory) => {
  
  const router = Router()

  router.post('/:name', async (req, res) => {
    try {
      for (const service of directory.services) {
        if (!service.endpoints) continue
        for (const endpoint of service.endpoints) {
          //console.log(endpoint.id, req.params.name)
          if (endpoint.id === req.params.name) {
            res.json(await invoke(endpoint, req))
            return
          }
        }
      }
      res.sendStatus(404)
    } catch (err: unknown) {
      console.error(err)
      res.sendStatus(500)
    }
  })

  return router

}
