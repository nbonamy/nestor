
import type { Request } from 'express'
import { Endpoint } from './directory'

export const invoke = async (endpoint: Endpoint, req: Request) => {

  // build the url
  let url = endpoint.url
  if (req.body) {
    url += '?'
    for (const key in req.body) {
      url += `${key}=${req.body[key]}&`
    }
  }

  // now call
  //console.log('Calling tool at', url)
  const response = await fetch(url)
  const data = await response.json()
  return data

}
