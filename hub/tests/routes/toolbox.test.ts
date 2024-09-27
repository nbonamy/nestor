
import { vi, test, expect } from 'vitest'
import supertest from 'supertest'
import app from '../../src/server'
import Marshaller from '../../src/services/marshaller'

const spyOpenAI = vi.spyOn(Marshaller.prototype, 'toOpenAI')

test('Default format', async () => {
  const res = await supertest(app).get('/toolbox')
  expect(res.status).toBe(200)
  expect(spyOpenAI).toHaveBeenCalled()
})

test('Unknown format', async () => {
  const res = await supertest(app).get('/toolbox/doesnotexist')
  expect(res.status).toBe(400)
})

