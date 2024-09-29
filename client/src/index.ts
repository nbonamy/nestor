
import Bonjour from 'bonjour'

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
  autostart?: boolean
}

export interface ToolboxResponse {
  tools: any[]
}

export class NestorClient {

  logger?: Logger|null
  format: ToolsFormat
  browser?: Bonjour.Browser
  hubs: Hub[] = []

  constructor(opts?: NestorClientOptions) {
    
    // logger
    this.logger = opts?.logger
    if (this.logger === undefined) {
      this.logger = console
    }

    // format with default
    this.format = opts?.format || 'openai'

    // autostart
    if (opts?.autostart !== false) {
      this.start()
    }

  }

  start(): void {
    
    // now start the browser
    this.browser = Bonjour().find({ type: 'nestor' })
    this.browser.on('up', (service) => {
      if (service.subtypes.includes('hub') || service.txt.type === 'hub') {
        this.add(service)
      }
    })
    this.browser.on('down', (service) => {
      if (service.name) {
        this.remove(service.name)
      }
    })
    this.browser.start()

  }

  stop(): void {
    this.browser?.stop()
    this.browser = undefined
  }

  connect(host: string, port: number): void {
    const hub = { name: `${host}:${port}`, host: host, port: port, tools: undefined }
    this.hubs.push(hub)
  }

  disconnect(host: string, port: number): void {
    this.hubs = this.hubs.filter(hub => hub.host !== host || hub.port !== port)
  }

  async list(): Promise<any[]> {
    const tools: any[] = []
    for (const hub of this.hubs) {
      await this.fetchTools(hub)
      if (hub.tools !== undefined) {
        tools.push(...hub.tools)
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

  private add(service: Bonjour.RemoteService) {
    this.logger?.log(`Hub found at ${service.host}:${service.port}`)
    if (service.name) {
      this.remove(service.name)
      const hub = { name: service.name, host: service.host, port: service.port }
      this.hubs.push(hub)
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
        const toolbox: ToolboxResponse = await response.json() as ToolboxResponse
        this.logger?.log(`Fetched toolbox at ${url}`)
        hub.tools = toolbox.tools
      }
    } catch (err) {
      this.logger?.error(`Error while fetching tools from hub ${hub.name}`, err)
      hub.tools = undefined
    }
  }

}
