
import { v4 as uuidv4 } from 'uuid'

export interface Parameter {
  name: string
  type: string
  description: string
  required: boolean
}

export interface Endpoint {
  id: string
  //name: string
  description: string
  url: string
  method: 'GET'|'POST'|'PUT'|'DELETE'
  parameters: Parameter[]
}

export interface Service {
  name: string
  host: string
  port: number
  path?: string
  endpoints: Endpoint[]
}

export default class ServiceDirectory {

  services: Service[]

  constructor() {
    this.services = []
    this.status()
  }

  async add(name: string, host: string, port: number, path: string): Promise<void> {
    let service = this.services.find(s => s.name === name)
    if (service) {
      service.host = host
      service.port = port
      service.path = path
      service.endpoints = []
    } else {
      service = { name, host, port, path, endpoints:[] }
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
      const endpoints: Endpoint[] = await response.json() as Endpoint[]
      service.endpoints = endpoints.map(e => { return { ...e, id: uuidv4() } })
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
