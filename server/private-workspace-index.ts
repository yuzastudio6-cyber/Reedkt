import process from 'node:process'

process.env.REEDITPRO_DISABLE_DOTENV = 'true'

const host = normalizeLoopbackHost(process.env.REEDITPRO_PRIVATE_WORKSPACE_HOST)
if (process.env.NODE_ENV === 'production') {
  throw new Error('The private workspace API cannot start in production.')
}
if (!host) {
  throw new Error('The private workspace API must bind to an explicit loopback host.')
}

const [{ createReeditProApiApp }, { assertRuntimeCanStart, loadRuntimeEnv }] = await Promise.all([
  import('./app'),
  import('./config/env'),
])

const env = loadRuntimeEnv()
assertRuntimeCanStart(env)

if (
  env.mode !== 'local'
  || !env.allowMockWithoutSupabase
  || !env.mockOnly
  || env.storageMode !== 'local'
  || env.hasSupabaseAdmin
) {
  throw new Error('The private workspace API safety boundary is not satisfied.')
}

const app = createReeditProApiApp(env)
app.listen(env.apiPort, host, () => {
  console.log(`ReeditPro private API listening on http://${formatHost(host)}:${env.apiPort}.`)
})

function normalizeLoopbackHost(value: string | undefined): '127.0.0.1' | 'localhost' | '::1' | undefined {
  const normalized = value?.trim().toLowerCase().replace(/^\[|\]$/g, '')
  if (normalized === '127.0.0.1' || normalized === 'localhost' || normalized === '::1') {
    return normalized
  }
  return undefined
}

function formatHost(value: string): string {
  return value === '::1' ? '[::1]' : value
}
