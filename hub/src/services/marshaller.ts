
import { ServiceDirectory } from '../types'

export default class Marshaller {

  toOpenAI(directory: ServiceDirectory) {

    const endpoints = []

    for (const service of directory.services) {
      if (!service.endpoints) continue
      for (const endpoint of service.endpoints) {
        if (endpoint.description && endpoint.url) {
          
          // build properties first
          const properties: { [key: string]: { type: string, description: string } } = {}
          for (const param of endpoint.parameters) {
            properties[param.name] = {
              type: param.type,
              description: param.description
            }
          }
          
          // now build the parameters
          const parameters = {
            type: 'object',
            properties: properties,
            required: endpoint.parameters.filter(p => p.required).map(p => p.name)
          }
          
          // done
          endpoints.push({
            type: 'function',
            function: {
              name: endpoint.id,
              description: endpoint.description,
              parameters: parameters,
            }
          })
        }
      }
    }

    return endpoints
  
  }

}