
import { Router } from 'express'

const router = Router()

router.post('/register', async (req, res) => {

  try {
    const { name, port, path } = req.body
    req.serviceDirectory.add(name, req.hostname, port, path)
    res.sendStatus(200)
  } catch (err: unknown) {
    console.error(`Error while registerig service ${req.body.name}`, err)
    if  (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: 'unknown error' })
    }
  }
})

router.delete('/unregister', async (req, res) => {
  try {
    const { name } = req.body
    req.serviceDirectory.remove(name)
    res.sendStatus(200)
  } catch (err: unknown) {
    console.error(`Error while unregistering service ${req.body.name}`, err)
    if  (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: 'unknown error' })
    }
  }
})

export default router
