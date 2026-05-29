import type { Server } from 'node:http'
import { createReeditProApiApp } from '../app'
import { assertRuntimeCanStart, createSafeRuntimeSummary, loadRuntimeEnv } from '../config/env'
import { normalizeUnknownError } from '../errors/api-error'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function main(): Promise<void> {
  const productionEnv = loadRuntimeEnv({
    NODE_ENV: 'production',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'local',
    FRONTEND_URL: 'https://app.reeditpro.example',
    BACKEND_URL: 'https://api.reeditpro.example',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'smoke-anon-key-placeholder',
    SUPABASE_SERVICE_ROLE_KEY: 'smoke-service-role-placeholder',
  })

  assertRuntimeCanStart(productionEnv)
  assert(productionEnv.frontendUrl === 'https://app.reeditpro.example', 'FRONTEND_URL should load into runtime env.')
  assert(productionEnv.backendUrl === 'https://api.reeditpro.example', 'BACKEND_URL should load into runtime env.')

  const missingUrlEnv = loadRuntimeEnv({
    NODE_ENV: 'production',
    E2E_RUNTIME_MODE: 'local',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'smoke-anon-key-placeholder',
    SUPABASE_SERVICE_ROLE_KEY: 'smoke-service-role-placeholder',
  })
  assertThrows(() => assertRuntimeCanStart(missingUrlEnv), ['FRONTEND_URL', 'BACKEND_URL'])

  const explicitMockEnv = loadRuntimeEnv({
    NODE_ENV: 'production',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  })
  assertRuntimeCanStart(explicitMockEnv)

  const safeSummaryText = JSON.stringify(createSafeRuntimeSummary(productionEnv))
  assert(!safeSummaryText.includes('smoke-service-role-placeholder'), 'Safe runtime summary must not expose service-role keys.')
  assert(!safeSummaryText.includes('smoke-anon-key-placeholder'), 'Safe runtime summary must not expose anon keys.')
  assert(!safeSummaryText.includes('https://app.reeditpro.example'), 'Safe runtime summary must not expose full deployment URLs.')

  const sanitizedError = normalizeUnknownError(new Error('secret-token-value'), {
    exposeUnexpectedErrorMessages: false,
  })
  assert(sanitizedError.message === 'Unexpected backend runtime error.', 'Production errors should hide unexpected messages.')

  const developmentError = normalizeUnknownError(new Error('development-only-message'), {
    exposeUnexpectedErrorMessages: true,
  })
  assert(developmentError.message === 'development-only-message', 'Development errors should preserve unexpected messages.')

  const app = createReeditProApiApp(productionEnv)
  const server = await listenOnRandomPort(app.listen(0))

  try {
    const baseUrl = `http://127.0.0.1:${server.port}`
    const healthResponse = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://app.reeditpro.example' },
    })
    assert(healthResponse.status === 200, 'Health check should return 200.')
    assert(
      healthResponse.headers.get('access-control-allow-origin') === 'https://app.reeditpro.example',
      'Production CORS should allow configured FRONTEND_URL.',
    )
    assert(healthResponse.headers.get('x-frame-options') === 'DENY', 'Security headers should include X-Frame-Options.')
    assert(healthResponse.headers.get('x-content-type-options') === 'nosniff', 'Security headers should include nosniff.')
    assert(
      healthResponse.headers.get('strict-transport-security')?.includes('max-age=15552000') === true,
      'Production security headers should include HSTS.',
    )

    const blockedCorsResponse = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://untrusted.example' },
    })
    assert(blockedCorsResponse.status === 200, 'Blocked browser origins should not break server-to-server health checks.')
    assert(
      blockedCorsResponse.headers.get('access-control-allow-origin') === null,
      'Production CORS should not echo untrusted origins.',
    )

    const protectedResponse = await fetch(`${baseUrl}/v1/projects/project-smoke`)
    assert(protectedResponse.status === 401, 'Protected API routes should reject unauthenticated requests.')
    const protectedPayload = await protectedResponse.json() as { error?: { code?: string } }
    assert(protectedPayload.error?.code === 'AUTH_REQUIRED', 'Protected API error should use AUTH_REQUIRED code.')
  } finally {
    await closeServer(server.server)
  }

  console.log(JSON.stringify({
    ok: true,
    mode: process.argv.includes('--e2e') ? 'mocked-e2e' : process.argv.includes('--integration') ? 'integration' : 'smoke',
    checks: [
      'production_env_url_validation',
      'explicit_mock_env_allowed',
      'safe_runtime_summary_redacts_values',
      'unexpected_error_sanitization',
      'health_check_online',
      'production_cors_allowlist',
      'security_headers_present',
      'protected_route_blocks_unauthenticated_access',
    ],
  }))
}

function assertThrows(action: () => void, expectedFragments: string[]): void {
  try {
    action()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    for (const fragment of expectedFragments) {
      assert(message.includes(fragment), `Expected error message to include ${fragment}.`)
    }
    return
  }

  throw new Error('Expected action to throw.')
}

function listenOnRandomPort(server: Server): Promise<{ server: Server, port: number }> {
  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.on('listening', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Expected server to listen on a TCP port.'))
        return
      }

      resolve({ server, port: address.port })
    })
  })
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
