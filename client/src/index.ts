
import Bonjour, { RemoteService } from 'bonjour'

export type ToolsFormat = 'openai'

export interface Logger {
  log: CallableFunction
  error: CallableFunction
}

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: { [key: string]: { type: string, description: string } }
      required: string[]
    }
  }
}

export interface Hub {
  name: string
  host: string
  port: number
  updatedAt?: number
  tools?: Tool[]
}

export interface NestorClientOptions {
  logger?: Logger|null
  format?: ToolsFormat|null
  autostart?: boolean
  cacheTtl?: number
}

export interface StatusResponse {
  hubs: {
    name: string
    host: string
    port: number
    tools: string[]
  }[]
}

export interface ToolboxResponse {
  tools: Tool[]
}

export type ListOpenAIResponse = Tool[]

export class NestorClient {

  private logger?: Logger|null
  private format: ToolsFormat
  private cacheTtl: number
  private browser?: Bonjour.Browser
  private hubs: Hub[] = []

  constructor(opts?: NestorClientOptions) {
    
    // logger
    this.logger = opts?.logger
    if (this.logger === undefined) {
      this.logger = console
    }

    // options with default
    this.cacheTtl = opts?.cacheTtl || 1000 * 60 * 5
    this.format = opts?.format || 'openai'

    // autostart
    if (opts?.autostart !== false) {
      this.start()
    }

  }

  start(): void {

    // we use bonjour and not mdns
    // as mdns has platform dependencies
    // which makes it painful to embed in electron
    // and it seems to be fine enough for a client
    // despite seeming to be not as good as mdns

    // now start the browser
    this.browser = Bonjour().find({ type: 'nestor' })
    this.browser.on('up', (service: RemoteService) => {
      if (service.subtypes.includes('hub') || service.txt.type === 'hub') {
        this.add(service)
      }
    })
    this.browser.on('down', (service: RemoteService) => {
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

  async status(): Promise<StatusResponse> {
    await this.list()
    return { hubs: this.hubs.map(hub => { return {
      name: hub.name,
      host: hub.host,
      port: hub.port,
      tools: hub.tools?.map(tool => tool.function.name) || []
    }})}
  }

  async list(): Promise<ListOpenAIResponse> {
    const tools: Tool[] = []
    for (const hub of this.hubs) {
      await this.fetchTools(hub)
      if (hub.tools !== undefined) {
        tools.push(...hub.tools)
      }
    }
    return tools
  }

  async call(name: string, parameters: { [key: string]: unknown }): Promise<unknown> {
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

  private add(service: RemoteService) {
    if (!service.name) return
    let hub = this.hubs.find(hub => hub.name === service.name)
    if (hub) {
      hub.host = service.host
      hub.port = service.port
      hub.updatedAt = undefined
    } else {
      this.logger?.log(`Hub found at ${service.host}:${service.port}`)
      hub = { name: service.name, host: service.host, port: service.port }
      this.hubs.push(hub)
    }
  }

  private remove(name: string): void {
    this.logger?.log(`Hub ${name} removed`)
    this.hubs = this.hubs.filter(hub => hub.name !== name)
  }

  private async fetchTools(hub: Hub): Promise<void> {

    // check if we need to fetch
    if (hub.updatedAt && Date.now() - hub.updatedAt < this.cacheTtl) {
      return
    }

    try {
      const url = `http://${hub.host}:${hub.port}/toolbox/${this.format}`
      const response = await fetch(url)
      if (response.ok) {
        const toolbox: ToolboxResponse = await response.json() as ToolboxResponse
        this.logger?.log(`Fetched toolbox at ${url}`)
        hub.tools = toolbox.tools
        hub.updatedAt = Date.now()
      }
    } catch (err) {
      this.logger?.error(`Error while fetching tools from hub ${hub.name}`, err)
      hub.tools = undefined
      hub.updatedAt = undefined
    }
  }

}
