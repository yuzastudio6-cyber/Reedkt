import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { access } from 'node:fs/promises'
import { createServer } from 'node:net'
import { resolve } from 'node:path'

const repoRoot = process.cwd()
const serverArtifactPath = resolve(repoRoot, 'dist-server/server.js')
const allowedOrigin = 'https://app.reeditpro.test'
const internalToken = 'production-artifact-smoke-internal-token'

await access(serverArtifactPath)

const apiPort = await findAvailablePort()
const apiEnv = createProductionEnv(apiPort)
const apiProcess = spawnArtifact(apiEnv)
const apiOutput = captureOutput(apiProcess)
const baseUrl = `http://127.0.0.1:${apiPort}`

try {
  await waitForHealthyArtifact(apiProcess, baseUrl, apiOutput)

  const health = await fetch(`${baseUrl}/health`, {
    headers: {
      origin: allowedOrigin,
      'x-request-id': 'unsafe request id with spaces',
    },
  })
  assert.equal(health.status, 200)
  assert.equal(health.headers.get('access-control-allow-origin'), allowedOrigin)
  assert.equal(health.headers.get('access-control-allow-credentials'), null)
  assert.equal(health.headers.get('x-powered-by'), null)
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(health.headers.get('x-frame-options'), 'DENY')
  assert.equal(health.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(health.headers.get('permissions-policy'), 'camera=(), geolocation=(), microphone=()')
  assert.equal(health.headers.get('cross-origin-resource-policy'), 'same-site')
  assert.equal(health.headers.get('cache-control'), 'no-store')
  assert.equal(health.headers.get('strict-transport-security'), 'max-age=31536000; includeSubDomains')
  assert.notEqual(health.headers.get('x-request-id'), 'unsafe request id with spaces')

  const healthBody = await health.json() as {
    data?: { service?: string; status?: string; runtime?: unknown }
  }
  assert.equal(healthBody.data?.service, 'reeditpro-api')
  assert.equal(healthBody.data?.status, 'ok')
  assert.equal(healthBody.data?.runtime, undefined)

  const disallowedCorsHealth = await fetch(`${baseUrl}/health`, {
    headers: { origin: 'https://untrusted.example.test' },
  })
  assert.equal(disallowedCorsHealth.status, 200)
  assert.equal(disallowedCorsHealth.headers.get('access-control-allow-origin'), null)
  assert.equal(disallowedCorsHealth.headers.get('access-control-allow-credentials'), null)

  const readinessWithoutInternalAuth = await fetch(`${baseUrl}/health/readiness`)
  assert.equal(readinessWithoutInternalAuth.status, 401)

  const readinessWithInternalAuth = await fetch(`${baseUrl}/health/readiness`, {
    headers: { 'x-reeditpro-internal-token': internalToken },
  })
  assert.equal(readinessWithInternalAuth.status, 200)
  const readinessText = await readinessWithInternalAuth.text()
  assert.equal(readinessText.includes(apiEnv.SUPABASE_SERVICE_ROLE_KEY ?? ''), false)
  assert.equal(readinessText.includes(apiEnv.SUPABASE_ANON_KEY ?? ''), false)
  assert.equal(readinessText.includes(internalToken), false)

  const projectsRoute = await fetch(`${baseUrl}/v1/projects`)
  assert.equal(projectsRoute.status, 401, 'The hardened project route must be mounted and authenticated.')

  const preferenceRoute = await fetch(
    `${baseUrl}/v1/workspaces/workspace-artifact-smoke/edit-preferences/current`,
  )
  assert.equal(preferenceRoute.status, 401, 'The hardened edit-preference route must be mounted and authenticated.')

  const legacyRuntimeStatus = await fetch(`${baseUrl}/api/runtime/status`)
  assert.equal(legacyRuntimeStatus.status, 404, 'The legacy mock runtime-status route must not ship.')

  const legacyMockRoute = await fetch(`${baseUrl}/api/mock`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  assert.equal(legacyMockRoute.status, 404, 'The legacy mock execution route must not ship.')
} finally {
  await stopChild(apiProcess)
}

const missingInternalTokenEnv = createProductionEnv(await findAvailablePort())
delete missingInternalTokenEnv.REEDITPRO_INTERNAL_SERVICE_TOKEN
await assertArtifactStartupRejected(
  missingInternalTokenEnv,
  /REEDITPRO_INTERNAL_SERVICE_TOKEN is required/i,
)

const missingSupabaseAdminEnv = createProductionEnv(await findAvailablePort())
delete missingSupabaseAdminEnv.SUPABASE_SERVICE_ROLE_KEY
await assertArtifactStartupRejected(
  missingSupabaseAdminEnv,
  /SUPABASE_SERVICE_ROLE_KEY is missing/i,
)

const missingSupabaseAnonEnv = createProductionEnv(await findAvailablePort())
delete missingSupabaseAnonEnv.SUPABASE_ANON_KEY
await assertArtifactStartupRejected(
  missingSupabaseAnonEnv,
  /SUPABASE_ANON_KEY is required/i,
)

const missingCorsEnv = createProductionEnv(await findAvailablePort())
delete missingCorsEnv.API_ALLOWED_CORS_ORIGINS
await assertArtifactStartupRejected(
  missingCorsEnv,
  /API_ALLOWED_CORS_ORIGINS must contain at least one exact browser origin/i,
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'production_artifact_uses_cloud_run_port',
    'hardened_public_health_contract',
    'production_security_headers',
    'exact_noncredentialed_cors_allowlist',
    'internal_readiness_auth_gate',
    'readiness_secret_confidentiality',
    'authenticated_project_route_mounted',
    'authenticated_edit_preference_route_mounted',
    'legacy_runtime_status_not_shipped',
    'legacy_mock_execution_not_shipped',
    'missing_internal_service_auth_fails_startup',
    'missing_supabase_admin_fails_startup',
    'missing_supabase_public_auth_fails_startup',
    'missing_production_cors_allowlist_fails_startup',
  ],
}))

function createProductionEnv(port: number): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    PORT: String(port),
    E2E_RUNTIME_MODE: 'cloud_run',
    STORAGE_MODE: 'gcs_disabled',
    WORKER_RUNTIME_MODE: 'disabled',
    API_ALLOWED_CORS_ORIGINS: allowedOrigin,
    SUPABASE_URL: 'https://artifact-smoke.supabase.co',
    SUPABASE_ANON_KEY: 'artifact-smoke-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'artifact-smoke-service-role-key',
    REEDITPRO_INTERNAL_SERVICE_TOKEN: internalToken,
    REEDITPRO_DISABLE_DOTENV: 'true',
    TZ: 'UTC',
  }

  for (const name of ['HOME', 'PATH', 'TMPDIR'] as const) {
    if (process.env[name]) env[name] = process.env[name]
  }

  return env
}

function spawnArtifact(env: NodeJS.ProcessEnv): ChildProcess {
  return spawn(process.execPath, [serverArtifactPath], {
    cwd: repoRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function captureOutput(child: ChildProcess): () => string {
  let output = ''
  const append = (chunk: Buffer | string) => {
    output = `${output}${String(chunk)}`.slice(-16_384)
  }
  child.stdout?.on('data', append)
  child.stderr?.on('data', append)
  return () => output
}

async function waitForHealthyArtifact(
  child: ChildProcess,
  baseUrl: string,
  output: () => string,
): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Production artifact exited before becoming healthy.\n${output()}`)
    }

    try {
      const response = await fetch(`${baseUrl}/health`)
      if (response.status === 200) return
    } catch {
      // The process can take a moment to load its route graph.
    }

    await delay(100)
  }

  throw new Error(`Production artifact did not become healthy.\n${output()}`)
}

async function assertArtifactStartupRejected(
  env: NodeJS.ProcessEnv,
  expectedError: RegExp,
): Promise<void> {
  const child = spawnArtifact(env)
  const output = captureOutput(child)
  const closed = waitForClose(child)
  const result = await Promise.race([
    closed,
    delay(5_000).then(() => null),
  ])

  if (!result) {
    await stopChild(child)
    throw new Error(`Misconfigured production artifact did not fail startup.\n${output()}`)
  }

  assert.notEqual(result.code, 0)
  assert.match(output(), expectedError)
}

async function stopChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return

  const closed = waitForClose(child)
  child.kill('SIGTERM')
  const gracefulResult = await Promise.race([
    closed,
    delay(3_000).then(() => null),
  ])
  if (gracefulResult) return

  child.kill('SIGKILL')
  await closed
}

function waitForClose(child: ChildProcess): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolveClose, rejectClose) => {
    child.once('error', rejectClose)
    child.once('close', (code, signal) => resolveClose({ code, signal }))
  })
}

function findAvailablePort(): Promise<number> {
  return new Promise((resolvePort, rejectPort) => {
    const probe = createServer()
    probe.once('error', rejectPort)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      if (!address || typeof address === 'string') {
        probe.close()
        rejectPort(new Error('Could not allocate a loopback port for the production artifact smoke.'))
        return
      }
      const port = address.port
      probe.close((error) => error ? rejectPort(error) : resolvePort(port))
    })
  })
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}
