
import { Router } from 'express'
import Marshaller from '../services/marshaller'

const router = Router()

router.get(['/', '/:format'], (req, res) => {

  try {

    const marshaller = new Marshaller()
    if (req.params.format === undefined || req.params.format === 'openai') {
      res.json({ tools: marshaller.toOpenAI(req.serviceDirectory) })
    } else {
      res.status(400).send({ error: 'invalid format' })
    }

  } catch (err: unknown) {
    console.error('Error while marshalling toolbox', err)
    if  (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: 'unknown error' })
    }
  }

})

export default router
