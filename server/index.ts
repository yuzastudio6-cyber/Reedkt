import { createReeditProApiApp } from './app'
import { assertRuntimeCanStart, loadRuntimeEnv } from './config/env'

const env = loadRuntimeEnv()
assertRuntimeCanStart(env)

const app = createReeditProApiApp(env)
const server = app.listen(env.apiPort, () => {
  console.log(JSON.stringify({
    event: 'api_server_listening',
    port: env.apiPort,
    runtimeMode: env.mode,
  }))
})

let shutdownStarted = false
const shutdown = (signal: NodeJS.Signals) => {
  if (shutdownStarted) return
  shutdownStarted = true

  console.log(JSON.stringify({ event: 'api_server_shutdown_started', signal }))
  const forcedExit = setTimeout(() => {
    console.error(JSON.stringify({ event: 'api_server_shutdown_timeout', signal }))
    process.exit(1)
  }, 10_000)
  forcedExit.unref()

  server.close((error) => {
    clearTimeout(forcedExit)
    if (error) {
      console.error(JSON.stringify({ event: 'api_server_shutdown_failed', signal }))
      process.exitCode = 1
      return
    }

    console.log(JSON.stringify({ event: 'api_server_shutdown_complete', signal }))
  })
}

process.once('SIGTERM', () => shutdown('SIGTERM'))
process.once('SIGINT', () => shutdown('SIGINT'))
