
import { Router } from 'express'
import Marshaller from '../services/marshaller'
import ServiceDirectory from '../services/directory'

export const toolboxRouter = (directory: ServiceDirectory) => {
  
  const router = Router()

  router.get(['/', '/:format'], (req, res) => {

    const marshaller = new Marshaller()
    if (req.params.format === undefined || req.params.format === 'openai') {
      res.json(marshaller.toOpenAI(directory))
    } else {
      res.status(400).send({ error: 'invalid format' })
    }

  })

  return router

}
