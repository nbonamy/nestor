
export interface Parameter {
  name: string
  type: string
  description: string
  required: boolean
}

export interface Endpoint {
  id: string
  name: string
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

export interface ServiceDirectory {
  services: Service[]
  async add(name: string, host: string, port: number, path: string): Promise<void>
  remove(name: string): void
}

declare global {
  namespace Express {
    interface Request {
      serviceDirectory: ServiceDirectory
    }
  }
}
