#!/usr/bin/env node
import { spawn } from 'node:child_process'
import http from 'node:http'

const port = Number(process.env.PLAYWRIGHT_PORT || process.env.INTERNAL_TESTING_QA_PORT || 4341)
const host = '127.0.0.1'
const baseUrl = `http://${host}:${port}`

const forbiddenTruthyEnv = [
  'REEDITPRO_ENABLE_LIVE_SUPABASE',
  'REEDITPRO_ENABLE_SUPABASE_WRITES',
  'REEDITPRO_ENABLE_PROVIDER_CALLS',
  'REEDITPRO_ENABLE_WORKER_DISPATCH',
  'REEDITPRO_ENABLE_MEDIA_PROCESSING',
  'REEDITPRO_ENABLE_RENDER_EXPORT',
  'REEDITPRO_ENABLE_CREDIT_SPEND',
  'REEDITPRO_ENABLE_EXTERNAL_BETA',
  'REEDITPRO_ENABLE_PAID_PRODUCTION',
]

const smokeCommands = [
  ['npm', ['run', 'smoke:preference-video-mock-limits-internal-testing-closeout']],
  ['npm', ['run', 'smoke:edit-preferences-route-entrypoint']],
  ['npm', ['run', 'smoke:project-edit-brief-internal-testing-entrypoint']],
  ['npm', ['run', 'smoke:project-edit-brief-e2e']],
  ['npm', ['run', 'smoke:project-edit-brief-internal-testing-completion-audit']],
  ['npm', ['run', 'smoke:internal-testing-approval-credit-gates']],
  ['npm', ['run', 'smoke:internal-testing-credit-lifecycle-readiness']],
  ['npm', ['run', 'smoke:internal-testing-repeated-local-operator-harness']],
  ['npm', ['run', 'smoke:internal-testing-auth-project-access-readiness']],
  ['npm', ['run', 'smoke:internal-testing-browser-auth-bootstrap-readiness']],
  ['npm', ['run', 'smoke:internal-testing-auth-project-session-membership-policy']],
  ['npm', ['run', 'smoke:internal-testing-durable-auth-project-session-backend-persistence-plan']],
  ['npm', ['run', 'smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton']],
  ['npm', ['run', 'smoke:internal-testing-durable-project-session-backend-route-integration']],
  ['npm', ['run', 'smoke:internal-testing-durable-project-session-backend-readback-qa']],
  ['npm', ['run', 'smoke:internal-testing-durable-project-session-supabase-route-contract-plan']],
  ['npm', ['run', 'smoke:internal-testing-durable-project-session-supabase-schema-rls-draft']],
  ['npm', ['run', 'smoke:internal-testing-durable-project-session-supabase-migration-sql-draft']],
  ['npm', ['run', 'smoke:internal-testing-durable-project-session-supabase-migration-review']],
  ['npm', ['run', 'smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan']],
  ['npm', ['run', 'smoke:beta-readiness']],
]

const playwrightSpecs = [
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
  'tests/e2e/edit-preferences-route-entrypoint.spec.ts',
]

function envValueIsTruthy(value) {
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(String(value ?? '').trim().toLowerCase())
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...options.env },
      stdio: options.stdio ?? 'inherit',
      cwd: process.cwd(),
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve({ code, signal })
        return
      }

      reject(new Error(`${command} ${args.join(' ')} failed with ${signal ?? `exit ${code}`}`))
    })
  })
}

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now()

  return new Promise((resolve, reject) => {
    function poll() {
      const request = http.get(url, (response) => {
        response.resume()
        if (response.statusCode && response.statusCode < 500) {
          resolve()
          return
        }
        retry()
      })

      request.on('error', retry)
      request.setTimeout(1500, () => {
        request.destroy()
        retry()
      })
    }

    function retry() {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`))
        return
      }
      setTimeout(poll, 300)
    }

    poll()
  })
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return

  child.kill('SIGTERM')

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL')
      resolve()
    }, 3000)

    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

async function main() {
  const enabledForbidden = forbiddenTruthyEnv.filter((key) => envValueIsTruthy(process.env[key]))
  if (enabledForbidden.length > 0) {
    throw new Error(`Refusing internal testing QA with live/runtime flags enabled: ${enabledForbidden.join(', ')}`)
  }

  const completed = []

  for (const [command, args] of smokeCommands) {
    await run(command, args)
    completed.push(`${command} ${args.join(' ')}`)
  }

  const server = spawn('npm', ['run', 'dev', '--', '--host', host, '--port', String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PLAYWRIGHT_PORT: String(port),
      PLAYWRIGHT_BASE_URL: baseUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  server.stdout.on('data', (chunk) => process.stdout.write(chunk))
  server.stderr.on('data', (chunk) => process.stderr.write(chunk))

  try {
    await waitForServer(baseUrl)
    await run('npx', ['playwright', 'test', ...playwrightSpecs], {
      env: {
        PLAYWRIGHT_PORT: String(port),
        PLAYWRIGHT_BASE_URL: baseUrl,
      },
    })
    completed.push(`npx playwright test ${playwrightSpecs.join(' ')}`)
  } finally {
    await stopServer(server)
  }

  console.log(JSON.stringify({
    ok: true,
    command: 'qa:internal-testing',
    baseUrl,
    completed,
    blockedScope: {
      liveSupabase: false,
      providerCalls: false,
      workerDispatch: false,
      mediaProcessing: false,
      renderExport: false,
      creditSpend: false,
      externalBeta: false,
      paidProduction: false,
    },
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
