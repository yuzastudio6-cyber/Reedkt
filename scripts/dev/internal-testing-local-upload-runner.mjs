#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')
const apiPort = Number.parseInt(process.env.REEDITPRO_LOCAL_UPLOAD_API_PORT ?? '9781', 10)
const appPort = Number.parseInt(process.env.REEDITPRO_LOCAL_UPLOAD_APP_PORT ?? '5179', 10)
const localStorageRoot = process.env.REEDITPRO_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-dev'
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'

if (!Number.isInteger(apiPort) || apiPort <= 0 || apiPort > 65535) {
  throw new Error('REEDITPRO_LOCAL_UPLOAD_API_PORT must be a valid TCP port.')
}

if (!Number.isInteger(appPort) || appPort <= 0 || appPort > 65535) {
  throw new Error('REEDITPRO_LOCAL_UPLOAD_APP_PORT must be a valid TCP port.')
}

const apiBaseUrl = `http://127.0.0.1:${apiPort}`
const appBaseUrl = `http://127.0.0.1:${appPort}`
const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'

const children = []

function spawnLogged(label, args, env) {
  const child = spawn(npmBin, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`)
  })
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`)
  })
  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    console.error(`[${label}] exited with ${signal ?? code}`)
    shutdown(code ?? 1)
  })

  children.push(child)
  return child
}

let shuttingDown = false

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(exitCode), 250)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

console.log('Starting ReEditPro internal local upload test stack.')
console.log(`API health: ${apiBaseUrl}/health`)
console.log(`Projects: ${appBaseUrl}/projects`)
console.log(`Sign in: ${appBaseUrl}/sign-in`)
console.log(`Edit Brief source-video test: ${appBaseUrl}${briefPath}`)
console.log(`Local storage root: ${path.resolve(repoRoot, localStorageRoot)}`)
console.log('Mode: browser-local mock sign-in + backend-local storage + gated preview review, QA, and private export smoke. No Supabase writes, GCS writes, provider calls, live Qwen calls, public delivery, external beta, or production.')

spawnLogged('api', ['run', 'dev:api'], {
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

spawnLogged('app', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(appPort), '--strictPort'], {
  VITE_REEDITPRO_API_BASE_URL: apiBaseUrl,
  VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD: 'true',
  VITE_REEDITPRO_LOCAL_EDIT_PREVIEW_SMOKE: 'true',
  VITE_REEDITPRO_INTERNAL_TEST_AUTH: 'true',
  VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID: 'mock-workspace',
  VITE_REEDITPRO_API_MODE: 'mock',
})
