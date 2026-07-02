import { createServer } from 'node:http'
import { handleServerRequest } from './server-router'
import { getServerRuntimeConfig } from './server-runtime-config'

export function startReeditProServer(): ReturnType<typeof createServer> {
  const config = getServerRuntimeConfig()
  const server = createServer((request, response) => {
    void handleServerRequest(request, response)
  })

  server.listen(config.port, () => {
    console.log(`ReeditPro backend runtime listening on port ${config.port} in ${config.mode} mode.`)
  })

  return server
}

startReeditProServer()
