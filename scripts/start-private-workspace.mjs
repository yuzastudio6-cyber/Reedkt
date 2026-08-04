import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { chmod, mkdir } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_WEB_PORT = 5173
const DEFAULT_API_PORT = 8787
const INTERNAL_KIMI_SECRET_REFERENCE =
  'projects/reeditpro/secrets/reeditpro-prod-kimi-api-key/versions/2'
const INTERNAL_OPENAI_SECRET_REFERENCE =
  'projects/reeditpro/secrets/reeditpro-prod-openai-api-key/versions/2'
const PRIVATE_STORAGE_DIRECTORY = join('.reeditpro-local-storage', 'private-workspace')
const PASSTHROUGH_ENV_KEYS = [
  'PATH',
  'Path',
  'HOME',
  'USERPROFILE',
  'TMPDIR',
  'TEMP',
  'TMP',
  'SystemRoot',
  'SYSTEMROOT',
  'ComSpec',
  'COMSPEC',
  'PATHEXT',
  'SHELL',
  'TERM',
  'COLORTERM',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'NO_COLOR',
  'FORCE_COLOR',
  'CI',
]
const EXTERNAL_RUNTIME_ENV_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_REGION',
  'GOOGLE_CLOUD_SERVICE_ACCOUNT',
  'GCS_SOURCE_MEDIA_BUCKET',
  'GCS_GENERATED_ASSETS_BUCKET',
  'GCS_PROCESSED_MEDIA_BUCKET',
  'GCS_PREVIEWS_BUCKET',
  'GCS_EXPORTS_BUCKET',
  'GCS_THUMBNAILS_BUCKET',
  'GCS_QA_ARTIFACTS_BUCKET',
  'GCS_WORKER_TEMP_BUCKET',
  'OPENAI_API_KEY',
  'AI_PROVIDER_WAN_API_KEY',
  'AI_PROVIDER_HAILUO_API_KEY',
  'AI_PROVIDER_VEO_VERTEX_CONFIG',
  'AI_PROVIDER_KLING_API_KEY',
  'LYRIA_API_KEY',
  'MIRELO_API_KEY',
  'MMAUDIO_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'GOOGLE_SECRET_OPENAI_API_KEY_NAME',
  'GOOGLE_SECRET_KIMI_API_KEY_NAME',
  'GOOGLE_SECRET_WAN_API_KEY_NAME',
  'GOOGLE_SECRET_HAILUO_API_KEY_NAME',
  'GOOGLE_SECRET_VEO_VERTEX_CONFIG_NAME',
  'GOOGLE_SECRET_LYRIA_API_KEY_NAME',
  'GOOGLE_SECRET_MIRELO_API_KEY_NAME',
  'GOOGLE_SECRET_MMAUDIO_API_KEY_NAME',
  'REEDITPRO_KIMI_RUNTIME_MODE',
  'REEDITPRO_OPENAI_RUNTIME_MODE',
]

class StopRequestedError extends Error {}

export function isLoopbackHost(value) {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/^\[|\]$/g, '')
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1'
}

export function createPrivateWorkspaceConfig({
  args = [],
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  const unknownArgs = args.filter((arg) =>
    arg !== '--check' && arg !== '--private-review' && arg !== '--kimi')
  if (unknownArgs.length > 0) {
    throw new Error(`Unsupported private workspace argument: ${unknownArgs[0]}`)
  }

  if (String(env.NODE_ENV ?? '').trim().toLowerCase() === 'production') {
    throw new Error('The private workspace launcher is disabled when NODE_ENV=production.')
  }

  const host = String(env.REEDITPRO_PRIVATE_WORKSPACE_HOST ?? DEFAULT_HOST).trim()
  if (!isLoopbackHost(host)) {
    throw new Error('The private workspace host must be a loopback address.')
  }

  const webPort = parsePort(env.REEDITPRO_PRIVATE_WORKSPACE_WEB_PORT, DEFAULT_WEB_PORT, 'web')
  const apiPort = parsePort(env.REEDITPRO_PRIVATE_WORKSPACE_API_PORT, DEFAULT_API_PORT, 'API')
  if (webPort === apiPort) {
    throw new Error('The private workspace web and API ports must be different.')
  }

  const root = resolve(cwd)
  const storageRoot = resolve(root, PRIVATE_STORAGE_DIRECTORY)
  const viteEnvDir = join(storageRoot, 'vite-env')
  const urlHost = host === '::1' ? '[::1]' : host

  return {
    checkOnly: args.includes('--check'),
    privateReviewRuntime: args.includes('--private-review'),
    kimiRuntime: args.includes('--kimi'),
    root,
    host,
    webPort,
    apiPort,
    webOrigin: `http://${urlHost}:${webPort}`,
    apiOrigin: `http://${urlHost}:${apiPort}`,
    storageRoot,
    viteEnvDir,
  }
}

export function createPrivateWorkspaceChildEnvironments(config, sourceEnv = process.env) {
  const base = createMinimalChildEnvironment(sourceEnv)
  const disabledExternalRuntime = Object.fromEntries(
    EXTERNAL_RUNTIME_ENV_KEYS.map((key) => [key, '']),
  )

  const serverEnv = {
    ...base,
    ...disabledExternalRuntime,
    NODE_ENV: 'development',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'false',
    API_PORT: String(config.apiPort),
    API_ALLOWED_CORS_ORIGINS: config.webOrigin,
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: config.storageRoot,
    WORKER_RUNTIME_MODE: 'local',
    LYRIA_INTEGRATION_MODE: 'mock',
    SFX_PROVIDER_INTEGRATION_MODE: 'mock',
    REEDITPRO_DISABLE_DOTENV: 'true',
    REEDITPRO_PRIVATE_WORKSPACE_HOST: config.host,
    REEDITPRO_PRIVATE_WORKSPACE_ENABLE_PRIVATE_REVIEW_RUNTIME:
      config.privateReviewRuntime ? 'true' : '',
    REEDITPRO_KIMI_RUNTIME_MODE:
      config.kimiRuntime ? 'internal_test' : 'disabled',
    REEDITPRO_OPENAI_RUNTIME_MODE:
      config.kimiRuntime ? 'internal_test' : 'disabled',
    GOOGLE_SECRET_KIMI_API_KEY_NAME:
      config.kimiRuntime ? INTERNAL_KIMI_SECRET_REFERENCE : '',
    GOOGLE_SECRET_OPENAI_API_KEY_NAME:
      config.kimiRuntime ? INTERNAL_OPENAI_SECRET_REFERENCE : '',
    REEDITPRO_INTERNAL_SERVICE_TOKEN:
      config.privateReviewRuntime ? randomBytes(32).toString('base64url') : '',
  }
  const frontendEnv = {
    ...base,
    ...disabledExternalRuntime,
    NODE_ENV: 'development',
    REEDITPRO_VITE_ENV_DIR: config.viteEnvDir,
    REEDITPRO_PRIVATE_WORKSPACE_API_ORIGIN: config.apiOrigin,
    VITE_REEDITPRO_AUTH_MODE: 'local_test',
    VITE_REEDITPRO_API_MODE: 'frontend_safe',
    VITE_REEDITPRO_API_BASE_URL: config.webOrigin,
    VITE_REEDITPRO_LOCAL_PRIVATE_UPLOADS: 'true',
    VITE_REEDITPRO_LOCAL_TEST_BACKEND_USER_ID: 'mock-user-runtime',
    VITE_REEDITPRO_E2E: 'false',
    VITE_REEDITPRO_E2E_AUTH_TOKEN: '',
    VITE_REEDITPRO_E2E_AUTH_USER_ID: '',
    VITE_REEDITPRO_E2E_LOCAL_PRIVATE_UPLOADS: 'false',
  }

  return { serverEnv, frontendEnv }
}

export function createPrivateWorkspaceCheckSummary(config) {
  return {
    ok: true,
    mode: 'check',
    host: config.host,
    webPort: config.webPort,
    apiPort: config.apiPort,
    authMode: 'local_test',
    apiTransport: 'frontend_safe',
    apiBrowserTransport: 'same_origin_vite_proxy',
    localPrivateUploads: true,
    privateReviewRuntime: config.privateReviewRuntime,
    kimiRuntime: config.kimiRuntime,
    storageDirectory: relative(config.root, config.storageRoot),
    externalServices: config.kimiRuntime
      ? 'kimi_k3_with_gpt_5_6_terra_fallback'
      : 'disabled',
    startsProcesses: false,
  }
}

async function main() {
  const config = createPrivateWorkspaceConfig({ args: process.argv.slice(2) })
  const childEnvironments = createPrivateWorkspaceChildEnvironments(config)
  const runtimePaths = resolveRuntimePaths()
  assertPrivateWorkspaceEnvironment(config, childEnvironments)

  if (config.checkOnly) {
    console.log(JSON.stringify(createPrivateWorkspaceCheckSummary(config)))
    return
  }

  await startPrivateWorkspace(config, childEnvironments, runtimePaths)
}

async function startPrivateWorkspace(config, childEnvironments, runtimePaths) {
  await mkdir(config.viteEnvDir, { recursive: true, mode: 0o700 })
  await enforcePrivateDirectoryMode(config.storageRoot)
  await enforcePrivateDirectoryMode(config.viteEnvDir)
  await assertPortAvailable(config.host, config.apiPort, 'API')
  await assertPortAvailable(config.host, config.webPort, 'web')

  const children = []
  let stopping = false
  let resolveUnexpectedExit
  let resolveStopSignal
  const unexpectedExit = new Promise((resolveExit) => {
    resolveUnexpectedExit = resolveExit
  })
  const stopSignal = new Promise((resolveSignal) => {
    resolveStopSignal = resolveSignal
  })

  const onSignal = (signal) => resolveStopSignal({ signal })
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)

  const spawnService = (label, commandArgs, env) => {
    const child = spawn(process.execPath, commandArgs, {
      cwd: config.root,
      env,
      stdio: 'inherit',
      detached: false,
    })
    children.push({ child, label })
    child.once('error', (error) => {
      if (!stopping) resolveUnexpectedExit({ label, error })
    })
    child.once('exit', (code, signal) => {
      if (!stopping) resolveUnexpectedExit({ label, code, signal })
    })
    return child
  }

  const guardStartup = async (promise) => {
    const result = await Promise.race([
      promise.then(() => ({ kind: 'ready' })),
      unexpectedExit.then((exit) => ({ kind: 'exit', exit })),
      stopSignal.then((signal) => ({ kind: 'signal', signal })),
    ])
    if (result.kind === 'ready') return
    if (result.kind === 'signal') throw new StopRequestedError(result.signal.signal)
    throw createUnexpectedExitError(result.exit)
  }

  try {
    spawnService(
      'API',
      ['--import', runtimePaths.tsxLoader, join(config.root, 'server', 'private-workspace-index.ts')],
      childEnvironments.serverEnv,
    )
    await guardStartup(waitForHttp(
      `${config.apiOrigin}/health`,
      config.privateReviewRuntime ? 30 * 60_000 : 20_000,
    ))

    spawnService(
      'web',
      [
        runtimePaths.viteCli,
        '--host',
        config.host,
        '--port',
        String(config.webPort),
        '--strictPort',
      ],
      childEnvironments.frontendEnv,
    )
    await guardStartup(waitForHttp(`${config.webOrigin}/sign-in`, 30_000))

    console.log(`\nReeditPro private workspace is ready: ${config.webOrigin}/sign-in`)
    console.log('Select "Enter test workspace". Press Ctrl+C to stop both local services.')
    if (config.privateReviewRuntime) {
      console.log(
        'Private review mode is active: approved local work may use confined FFmpeg, libass, and Remotion.',
      )
    }
    if (config.kimiRuntime) {
      console.log(
        'Kimi K3 Chat is active with GPT-5.6 Terra fallback through pinned server-only Secret Manager references.',
      )
    }
    console.log(
      config.kimiRuntime
        ? 'All other external providers, Supabase, billing, and deployed services remain disabled.\n'
        : 'External providers, Supabase, billing, and deployed services remain disabled.\n',
    )

    const result = await Promise.race([
      unexpectedExit.then((exit) => ({ kind: 'exit', exit })),
      stopSignal.then((signal) => ({ kind: 'signal', signal })),
    ])
    if (result.kind === 'exit') throw createUnexpectedExitError(result.exit)
  } catch (error) {
    if (!(error instanceof StopRequestedError)) throw error
  } finally {
    stopping = true
    process.removeListener('SIGINT', onSignal)
    process.removeListener('SIGTERM', onSignal)
    await Promise.all(children.map(({ child }) => stopChildProcess(child)))
  }
}

function createMinimalChildEnvironment(sourceEnv) {
  const result = {}
  for (const key of PASSTHROUGH_ENV_KEYS) {
    const value = sourceEnv[key]
    if (typeof value === 'string') result[key] = value
  }
  return result
}

function assertPrivateWorkspaceEnvironment(config, { serverEnv, frontendEnv }) {
  if (!isLoopbackHost(config.host)) throw new Error('Private workspace host validation failed.')
  if (
    serverEnv.NODE_ENV === 'production'
    || serverEnv.E2E_RUNTIME_MODE !== 'local'
    || serverEnv.WORKER_RUNTIME_MODE !== 'local'
  ) {
    throw new Error('Private workspace server runtime must remain local and non-production.')
  }
  if (
    serverEnv.API_ALLOW_MOCK_WITHOUT_SUPABASE !== 'true'
    || serverEnv.STORAGE_MODE !== 'local'
    || serverEnv.LOCAL_STORAGE_ROOT !== config.storageRoot
  ) {
    throw new Error('Private workspace server safety configuration is incomplete.')
  }
  if (
    config.privateReviewRuntime &&
    (
      serverEnv.REEDITPRO_PRIVATE_WORKSPACE_ENABLE_PRIVATE_REVIEW_RUNTIME !== 'true' ||
      typeof serverEnv.REEDITPRO_INTERNAL_SERVICE_TOKEN !== 'string' ||
      Buffer.byteLength(serverEnv.REEDITPRO_INTERNAL_SERVICE_TOKEN, 'utf8') < 32
    )
  ) {
    throw new Error('Private workspace review runtime safety configuration is incomplete.')
  }
  if (
    config.kimiRuntime
    && (
      serverEnv.REEDITPRO_KIMI_RUNTIME_MODE !== 'internal_test'
      || serverEnv.REEDITPRO_OPENAI_RUNTIME_MODE !== 'internal_test'
      || serverEnv.GOOGLE_SECRET_KIMI_API_KEY_NAME
        !== INTERNAL_KIMI_SECRET_REFERENCE
      || serverEnv.GOOGLE_SECRET_OPENAI_API_KEY_NAME
        !== INTERNAL_OPENAI_SECRET_REFERENCE
      || frontendEnv.REEDITPRO_KIMI_RUNTIME_MODE
      || frontendEnv.REEDITPRO_OPENAI_RUNTIME_MODE
      || frontendEnv.GOOGLE_SECRET_KIMI_API_KEY_NAME
      || frontendEnv.GOOGLE_SECRET_OPENAI_API_KEY_NAME
    )
  ) {
    throw new Error(
      'Private workspace Kimi runtime safety configuration is incomplete.',
    )
  }
  if (
    frontendEnv.VITE_REEDITPRO_AUTH_MODE !== 'local_test'
    || frontendEnv.VITE_REEDITPRO_API_MODE !== 'frontend_safe'
    || frontendEnv.VITE_REEDITPRO_API_BASE_URL !== config.webOrigin
    || frontendEnv.REEDITPRO_PRIVATE_WORKSPACE_API_ORIGIN !== config.apiOrigin
    || frontendEnv.VITE_REEDITPRO_LOCAL_PRIVATE_UPLOADS !== 'true'
  ) {
    throw new Error('Private workspace frontend safety configuration is incomplete.')
  }
  for (const key of EXTERNAL_RUNTIME_ENV_KEYS) {
    if (
      config.kimiRuntime
      && (
        key === 'REEDITPRO_KIMI_RUNTIME_MODE'
        || key === 'REEDITPRO_OPENAI_RUNTIME_MODE'
        || key === 'GOOGLE_SECRET_KIMI_API_KEY_NAME'
        || key === 'GOOGLE_SECRET_OPENAI_API_KEY_NAME'
      )
    ) continue
    if (serverEnv[key] || frontendEnv[key]) {
      throw new Error('Private workspace external-service isolation failed.')
    }
  }
}

function resolveRuntimePaths() {
  const vitePackagePath = require.resolve('vite/package.json')
  return {
    tsxLoader: require.resolve('tsx'),
    viteCli: join(dirname(vitePackagePath), 'bin', 'vite.js'),
  }
}

function parsePort(value, fallback, label) {
  const raw = String(value ?? '').trim()
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`The private workspace ${label} port must be an integer from 1 to 65535.`)
  }
  return parsed
}

async function enforcePrivateDirectoryMode(directory) {
  if (process.platform === 'win32') return
  await chmod(directory, 0o700)
}

async function assertPortAvailable(host, port, label) {
  const available = await new Promise((resolveAvailability) => {
    const server = createServer()
    server.once('error', () => resolveAvailability(false))
    server.once('listening', () => server.close(() => resolveAvailability(true)))
    server.listen(port, host)
  })
  if (!available) {
    throw new Error(`The private workspace ${label} port ${port} is already in use on the loopback host.`)
  }
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(1_500) })
      if (response.status >= 200 && response.status < 500) return
    } catch {
      // The child process may still be starting.
    }
    await delay(150)
  }
  throw new Error(`Timed out waiting for the local service at ${new URL(url).origin}.`)
}

function createUnexpectedExitError(exit) {
  if (exit.error) return new Error(`${exit.label} service could not start: ${exit.error.message}`)
  const detail = exit.signal ? `signal ${exit.signal}` : `exit code ${exit.code ?? 'unknown'}`
  return new Error(`${exit.label} service stopped unexpectedly with ${detail}.`)
}

async function stopChildProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  signalChildProcess(child, 'SIGTERM')
  const exited = await Promise.race([
    new Promise((resolveExit) => child.once('exit', () => resolveExit(true))),
    delay(4_000).then(() => false),
  ])
  if (exited || child.exitCode !== null || child.signalCode !== null) return
  signalChildProcess(child, 'SIGKILL')
}

function signalChildProcess(child, signal) {
  try {
    child.kill(signal)
  } catch {
    // The service may have exited between the status check and signal.
  }
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}

function isDirectExecution() {
  return Boolean(process.argv[1])
    && pathToFileURL(resolve(process.argv[1])).href === import.meta.url
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error(`Private workspace failed: ${error instanceof Error ? error.message : 'Unknown error.'}`)
    process.exitCode = 1
  })
}
