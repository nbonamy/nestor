
import { vi, test, expect } from 'vitest'
import supertest from 'supertest'
import app from '../../src/server'
import Marshaller from '../../src/services/marshaller'

vi.mock('../../src/services/marshaller', () => {
  const Marshaller = vi.fn()
  Marshaller.prototype.toOpenAI = vi.fn()
  return { default: Marshaller }
})

test('toolbox', async () => {
  const res = await supertest(app).get('/toolbox')
  expect(res.status).toBe(200)
  expect(Marshaller.prototype.toOpenAI).toHaveBeenCalled()
})
