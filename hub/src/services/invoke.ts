
import type { Request } from 'express'
import type { Endpoint } from '../types'

export const invoke = async (endpoint: Endpoint, req: Request) => {

  // method
  const method = endpoint.method || 'GET'

  // init the url
  let url = endpoint.url

  // for GET add parameters here
  if (method === 'GET' && req.body) {
    const query = []
    for (const key in req.body) {
      query.push(`${key}=${encodeURIComponent(req.body[key])}`)
    }
    url += '?' + query.join('&')
  }

  // options
  let options: RequestInit | undefined

  // for POST/PUT/DELETE add parameters here
  if (method !== 'GET' && req.body) {
    options = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    }
  }

  // now call
  //console.log('Calling tool at', url)
  const response = options ? await fetch(url, options) : await fetch(url)
  const data = await response.json()
  return data

}
