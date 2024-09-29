
import slugify from '@sindresorhus/slugify'
import type { Endpoint, Service } from '../types'

export type EndpointResponse = {
  endpoints: Endpoint[]
}

export default class ServiceDirectory {

  services: Service[]

  constructor() {
    this.services = []
  }

  async add(name: string, host: string, port: number, path: string): Promise<void> {
    if (!path) return
    let service = this.services.find(s => s.name === name)
    if (service) {
      service.host = host
      service.port = port
      service.path = path
      //service.endpoints = []
    } else {
      service = { name, host, port, path, endpoints: [] }
      this.services.push(service)
    }
    await this.fetchEnpoints(service)
  }

  remove(name: string) {
    this.services = this.services.filter(s => s.name !== name)
    this.status()
  }

  private async fetchEnpoints(service: Service): Promise<void> {
    const url = `http://${service.host}:${service.port}${service.path}`
    try {
      const response = await fetch(url)
      const json: EndpointResponse = await response.json() as EndpointResponse
      const endpoints: Endpoint[] = json.endpoints as Endpoint[]
      service.endpoints = endpoints.map(e => {
        const id = slugify(`${service.name}-${e.name}`, { separator: '_', preserveCharacters: ['-'] })
        return { ...e, id }
      })
      this.status()
    } catch (err) {
      console.error(`Error while fetching endpoints at ${url}`, err)
      this.remove(service.name)
    }
  }

  private status() {
    const endpoints = this.services.reduce((acc, service) => {
      return acc + service.endpoints.length
    }, 0)
    console.log(`Status: ${this.services.length} services with ${endpoints} endpoints`)
  }
}
