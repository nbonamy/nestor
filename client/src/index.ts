
import * as mdns from 'mdns'

export type ToolsFormat = 'openai'

export interface Logger {
  log: CallableFunction
  error: CallableFunction
}

export interface Hub {
  name: string
  host: string
  port: number
  tools?: any[]
}

export interface NestorClientOptions {
  logger?: Logger|null
  format?: ToolsFormat|null
}

export class NestorClient {

  logger?: Logger|null
  format: ToolsFormat
  browser!: mdns.Browser
  hubs: Hub[] = []

  constructor(opts?: NestorClientOptions) {
    
    // logger
    this.logger = opts?.logger
    if (this.logger === undefined) {
      console.log 
    }

    // format with default
    this.format = opts?.format || 'openai'

    // now start the browser
    this.browser = mdns.createBrowser(mdns.tcp('nestor'))
    this.browser.on('serviceUp', service => {
      const txtRecord = service.txtRecord
      if (txtRecord && txtRecord.type === 'hub') {
        this.add(service)
      }
    });
    this.browser.on('serviceDown', service => {
      if (service.name) {
        this.remove(service.name)
      }
    });
    this.browser.start();

  }

  async list(): Promise<any[]> {
    const tools: any[] = []
    for (const hub of this.hubs) {
      if (hub.tools !== null && await this.ping(hub)) {
        tools.push(...hub.tools!)
      }
    }
    return tools
  }

  async call(name: string, parameters: { [key: string]: any }): Promise<any> {
    const hub = this.hubs.find(hub => hub.tools?.find(tool => tool.function.name === name))
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
    this.logger?.log(`Hub found at ${service.host}:${service.port}`)
    if (service.name) {
      this.remove(service.name)
      const hub = { name: service.name, host: service.host, port: service.port }
      this.hubs.push(hub)
      this.fetchTools(hub)
    }
  }

  private remove(name: string): void {
    this.logger?.log(`Hub ${name} removed`)
    this.hubs = this.hubs.filter(hub => hub.name !== name)
  }

  private async fetchTools(hub: Hub): Promise<void> {
    try {
      const url = `http://${hub.host}:${hub.port}/toolbox/${this.format}`
      const response = await fetch(url)
      if (response.ok) {
        const toolbox = await response.json()
        this.logger?.log(`Fetched toolbox at ${url}`)
        hub.tools = toolbox
      }
    } catch (err) {
      this.logger?.error(`Error while fetching tools from hub ${hub.name}`, err)
      this.remove(hub.name)
    }
  }

  private async ping(hub: Hub): Promise<boolean> {
    try {
      const url = `http://${hub.host}:${hub.port}/ping`
      const response = await fetch(url)
      return response.ok
    } catch (err) {
      this.logger?.error(`Error while pinging hub ${hub.name}`, err)
      return false
    }
  }

}
