
import { Router } from 'express'
import { invoke } from '../services/invoke'

const router = Router()

router.post('/:name', async (req, res) => {

  try {

    // browse services
    for (const service of req.serviceDirectory.services) {
      
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
    console.error(`Error while invoking tool ${req.params.name}`, err)
    if  (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: 'unknown error' })
    }
  }
})

export default router
