import { createReeditProApiApp } from './app'
import { assertRuntimeCanStart, loadRuntimeEnv } from './config/env'

const env = loadRuntimeEnv()
assertRuntimeCanStart(env)

const app = createReeditProApiApp(env)
app.listen(env.apiPort, () => {
  console.log(`ReeditPro E2E backend runtime listening on port ${env.apiPort} in ${env.mode} mode.`)
})
