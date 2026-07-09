#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')
const apiPort = Number.parseInt(process.env.REEDITPRO_LOCAL_UPLOAD_API_PORT ?? '9781', 10)
const appPort = Number.parseInt(process.env.REEDITPRO_LOCAL_UPLOAD_APP_PORT ?? '5179', 10)
const localStorageRoot = process.env.REEDITPRO_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-playwright'
const realVideoFixturePath = process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim()
const fixtureRoot = path.join(repoRoot, 'test-results', 'project-source-video-real-local-api')
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const playwrightBin = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'playwright.cmd' : 'playwright')
const playwrightSpecs = [
  'tests/e2e/project-source-video-backend-upload-local-api.spec.ts',
  'tests/e2e/project-create-edit-upload-local-api.spec.ts',
]
const apiBaseUrl = `http://127.0.0.1:${apiPort}`
const appBaseUrl = `http://127.0.0.1:${appPort}`

const children = []
let shuttingDown = false
let serverFailure

function assertPort(name, value) {
  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(`${name} must be a valid TCP port.`)
  }
}

function assertExecutable(command, label) {
  const result = spawnSync(command, ['-version'], { stdio: 'ignore' })
  if (result.status !== 0) {
    throw new Error(`${label} is required for the local upload E2E verifier. Install it locally, then rerun this command.`)
  }
}

function assertLocalPlaywright() {
  if (!existsSync(playwrightBin)) {
    throw new Error('Local Playwright binary is missing. Run npm ci before npm run test:internal-testing:local-upload-e2e.')
  }
}

function spawnServer(label, args, env) {
  const child = spawn(npmBin, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => process.stdout.write(`[${label}] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[${label}] ${chunk}`))
  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    serverFailure = new Error(`${label} exited before verification completed (${signal ?? code}).`)
  })

  children.push(child)
  return child
}

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1_000)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function waitForHttp(url, label, timeoutMs = 60_000) {
  const startedAt = Date.now()
  let lastError

  while (Date.now() - startedAt < timeoutMs) {
    if (serverFailure) throw serverFailure

    try {
      const response = await fetchWithTimeout(url)
      if (response.ok) return
      lastError = new Error(`${label} returned HTTP ${response.status}.`)
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`${label} did not become ready at ${url}. ${lastError instanceof Error ? lastError.message : ''}`.trim())
}

function runPlaywright() {
  return new Promise((resolve, reject) => {
    const child = spawn(playwrightBin, [
      'test',
      ...playwrightSpecs,
      '--reporter=line',
    ], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: appBaseUrl,
        PLAYWRIGHT_INTERNAL_TEST_AUTH: 'true',
        PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API: 'true',
        PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL: apiBaseUrl,
        PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT: localStorageRoot,
        PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH: realVideoFixturePath,
      },
      stdio: 'inherit',
    })

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Playwright local upload E2E failed (${signal ?? code}).`))
    })
  })
}

async function cleanupRuntimeArtifacts() {
  await rm(path.join(repoRoot, localStorageRoot), { force: true, recursive: true })
  await rm(fixtureRoot, { force: true, recursive: true })
}

async function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  await new Promise((resolve) => setTimeout(resolve, 500))
  for (const child of children) {
    if (!child.killed) child.kill('SIGKILL')
  }
}

async function main() {
  assertPort('REEDITPRO_LOCAL_UPLOAD_API_PORT', apiPort)
  assertPort('REEDITPRO_LOCAL_UPLOAD_APP_PORT', appPort)
  assertLocalPlaywright()
  if (realVideoFixturePath) {
    if (!existsSync(realVideoFixturePath)) {
      throw new Error(`REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH does not exist: ${realVideoFixturePath}`)
    }
  } else {
    assertExecutable('ffmpeg', 'FFmpeg')
  }

  await cleanupRuntimeArtifacts()

  console.log('Starting ReEditPro local upload E2E verifier.')
  console.log(`API health: ${apiBaseUrl}/health`)
  console.log(`App sign-in: ${appBaseUrl}/sign-in`)
  console.log(`Storage root: ${path.resolve(repoRoot, localStorageRoot)}`)
  if (realVideoFixturePath) {
    console.log(`Real video fixture: ${realVideoFixturePath}`)
  }
  console.log(`Specs: ${playwrightSpecs.join(', ')}`)
  console.log('Mode: browser-local mock sign-in + backend-local upload + dynamic project/edit creation + gated preview review, QA, and private export smoke. No Supabase writes, GCS writes, provider calls, live Qwen calls, public delivery, external beta, or production.')

  spawnServer('api', ['run', 'dev:api'], {
    NODE_ENV: 'development',
    API_PORT: String(apiPort),
    PORT: String(apiPort),
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    WORKER_RUNTIME_MODE: 'mock',
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    GOOGLE_CLOUD_PROJECT_ID: '',
    GCS_SOURCE_MEDIA_BUCKET: '',
  })

  spawnServer('app', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort'], {
    VITE_REEDITPRO_API_BASE_URL: apiBaseUrl,
    VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD: 'true',
    VITE_REEDITPRO_LOCAL_EDIT_PREVIEW_SMOKE: 'true',
    VITE_REEDITPRO_INTERNAL_TEST_AUTH: 'true',
    VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID: 'mock-workspace',
    VITE_REEDITPRO_API_MODE: 'mock',
  })

  await waitForHttp(`${apiBaseUrl}/health`, 'API')
  await waitForHttp(`${appBaseUrl}/sign-in`, 'App')
  await runPlaywright()
  console.log('Local upload E2E verifier passed: sign-in, project creation, edit creation, Edit Brief upload, local preview review, QA, private export smoke, and Qwen 3.7 Max identity checks succeeded.')
}

try {
  await main()
} finally {
  await shutdown()
  await cleanupRuntimeArtifacts()
}
