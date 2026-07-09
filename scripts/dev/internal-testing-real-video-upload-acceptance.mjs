#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')
const fixturePath = path.resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || path.join(homedir(), 'Documents/test video/internal testing.MP4'))
const storageRoot = process.env.REEDITPRO_LOCAL_UPLOAD_STORAGE_ROOT ?? '.reeditpro-local-upload-storage-real-video'

if (!existsSync(fixturePath)) {
  throw new Error(`Internal testing video is missing: ${fixturePath}`)
}

console.log('Starting ReEditPro real-video backend-local upload acceptance.')
console.log(`Fixture: ${fixturePath}`)
console.log(`Storage root: ${path.resolve(repoRoot, storageRoot)}`)
console.log('Scope: backend-local upload, local preview smoke, and safety readback only. No provider calls, live Qwen calls, Supabase writes, GCS writes, public delivery, beta, or production.')

const child = spawn(process.execPath, [
  path.join(repoRoot, 'scripts/dev/internal-testing-local-upload-e2e.mjs'),
], {
  cwd: repoRoot,
  env: {
    ...process.env,
    REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH: fixturePath,
    REEDITPRO_LOCAL_UPLOAD_STORAGE_ROOT: storageRoot,
  },
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (code === 0) {
    console.log('Real-video backend-local upload acceptance passed.')
    process.exit(0)
  }
  console.error(`Real-video backend-local upload acceptance failed (${signal ?? code}).`)
  process.exit(code ?? 1)
})
