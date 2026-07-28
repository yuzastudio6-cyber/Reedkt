#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
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
const sharedSyntheticFixtureRoot = path.join(repoRoot, 'test-results', 'internal-testing-local-upload-e2e')
const sharedSyntheticFixturePath = path.join(sharedSyntheticFixtureRoot, 'internal-testing-local-upload-e2e.mp4')
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

function runPlaywright(fixturePath) {
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
        PLAYWRIGHT_REUSE_SERVER: 'true',
        PLAYWRIGHT_INTERNAL_TEST_AUTH: 'true',
        PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API: 'true',
        PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL: apiBaseUrl,
        PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT: localStorageRoot,
        PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH: fixturePath,
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
  await rm(sharedSyntheticFixtureRoot, { force: true, recursive: true })
}

async function preparePlaywrightFixture() {
  if (realVideoFixturePath) return realVideoFixturePath

  await mkdir(sharedSyntheticFixtureRoot, { recursive: true })
  const result = spawnSync('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc=size=320x180:rate=30',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:sample_rate=48000',
    '-t',
    '1',
    '-shortest',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    sharedSyntheticFixturePath,
  ], { stdio: 'pipe' })
  if (result.status !== 0) {
    throw new Error(`FFmpeg failed to create the shared local-upload E2E fixture: ${result.stderr?.toString().trim() ?? 'unknown error'}`)
  }
  const fixtureStat = await stat(sharedSyntheticFixturePath)
  if (!fixtureStat.isFile() || fixtureStat.size <= 0) {
    throw new Error('FFmpeg did not create a non-empty shared local-upload E2E fixture.')
  }
  return sharedSyntheticFixturePath
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
  const playwrightFixturePath = await preparePlaywrightFixture()

  console.log('Starting ReEditPro local upload E2E verifier.')
  console.log(`API health: ${apiBaseUrl}/health`)
  console.log(`App sign-in: ${appBaseUrl}/sign-in`)
  console.log(`Storage root: ${path.resolve(repoRoot, localStorageRoot)}`)
  if (realVideoFixturePath) {
    console.log(`Real video fixture: ${playwrightFixturePath}`)
  } else {
    console.log(`Synthetic video fixture: ${playwrightFixturePath}`)
  }
  console.log(`Specs: ${playwrightSpecs.join(', ')}`)
  console.log('Mode: browser-local test sign-in + active named-edit route + reviewed frontend-safe API transport + backend-local source upload + canonical plan/approval gates. No Supabase writes, GCS writes, provider calls, live Qwen calls, public delivery, external beta, or production.')

  spawnServer('api', ['run', 'dev:private-workspace:api'], {
    NODE_ENV: 'development',
    API_PORT: String(apiPort),
    PORT: String(apiPort),
    API_ALLOWED_CORS_ORIGINS: appBaseUrl,
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: path.resolve(repoRoot, localStorageRoot),
    WORKER_RUNTIME_MODE: 'mock',
    REEDITPRO_DISABLE_DOTENV: 'true',
    REEDITPRO_PRIVATE_WORKSPACE_HOST: '127.0.0.1',
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
    VITE_REEDITPRO_AUTH_MODE: 'local_test',
    VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID: 'workspace-internal-testing',
    VITE_REEDITPRO_LOCAL_PRIVATE_UPLOADS: 'true',
    VITE_REEDITPRO_LOCAL_TEST_BACKEND_USER_ID: 'mock-user-runtime',
    VITE_REEDITPRO_API_MODE: 'frontend_safe',
  })

  await waitForHttp(`${apiBaseUrl}/health`, 'API')
  await waitForHttp(`${appBaseUrl}/sign-in`, 'App')
  await runPlaywright(playwrightFixturePath)
  console.log('Local upload E2E verifier passed: sign-in, project creation, named-edit creation, backend-local source finalization, private source readback, inline Edit Brief, plan creation, approval, and reload checks succeeded.')
}

try {
  await main()
} finally {
  await shutdown()
  await cleanupRuntimeArtifacts()
}
