
import * as mdns from 'mdns'

export interface Hub {
  name: string
  host: string
  port: number
  tools: any[]
}

export interface NestorClientOptions {
  logger?: CallableFunction|null
}

export class NestorClient {

  logger?: CallableFunction|null
  browser!: mdns.Browser
  hubs: Hub[] = []

  constructor(opts?: NestorClientOptions) {
    
    this.logger = opts?.logger
    if (this.logger === undefined) {
      console.log 
    }

    this.browser = mdns.createBrowser(mdns.tcp('nestor'))
    this.browser.on('serviceUp', service => {
      const txtRecord = service.txtRecord
      if (txtRecord && txtRecord.type === 'hub') {
        this.add(service)
      }
    });
    this.browser.on('serviceDown', service => {
      this.remove(service)
    });
    this.browser.start();

  }

  async list(): Promise<any[]> {
    const tools: any[] = []
    for (const hub of this.hubs) {
      if (await this.ping(hub)) {
        tools.push(...hub.tools)
      }
    }
    return tools
  }

  async call(name: string, parameters: { [key: string]: any }): Promise<any> {
    const hub = this.hubs.find(hub => hub.tools.find(tool => tool.function.name === name))
    if (!hub) throw new Error(`Tool ${name} not found`)
    const url = `http://${hub.host}:${hub.port}/tools/${name}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parameters)
    })
    return await response.json()
  }

  private add(service: mdns.Service) {
    this.logger?.(`Hub found at ${service.host}:${service.port}`)
    if (service.name) {
      this.remove(service)
      const hub = { name: service.name, host: service.host, port: service.port, tools: [] }
      this.hubs.push(hub)
      this.fetchTools(hub)
    }
  }


  private remove(service: mdns.Service): void {
    this.logger?.(`Hub removed at ${service.host}:${service.port}`)
    this.hubs = this.hubs.filter(hub => hub.name !== service.name)
  }

  private async fetchTools(hub: Hub): Promise<void> {
    const url = `http://${hub.host}:${hub.port}/toolbox`
    const response = await fetch(url)
    if (response.ok) {
      const toolbox = await response.json()
      this.logger?.(`Fetched toolbox at ${url}`)
      hub.tools = toolbox
    }
  }

  private async ping(hub: Hub): Promise<boolean> {
    try {
      const url = `http://${hub.host}:${hub.port}/ping`
      const response = await fetch(url)
      return response.ok
    } catch (err) {
      console.error(`Error while pinging hub ${hub.name}`, err)
      return false
    }
  }

}
