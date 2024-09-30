
import { Router } from 'express'

const router = Router()

router.get('/status', async (req, res) => {
  try {
    res.json(req.serviceDirectory.services)
  } catch (err: unknown) {
    if  (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: 'unknown error' })
    }
  }
})

export default router
