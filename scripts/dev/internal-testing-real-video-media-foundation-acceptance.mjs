#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')
const fixturePath = path.resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || path.join(homedir(), 'Documents/test video/internal testing.MP4'))
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const cleanupRoots = [
  '.reeditpro-real-video-local-preview-execution-storage',
  '.reeditpro-real-video-media-foundation-acceptance-storage',
]

if (!existsSync(fixturePath)) {
  throw new Error(`Internal testing video is missing: ${fixturePath}`)
}

function run(label, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n[${label}] ${npmBin} ${args.join(' ')}`)
    const child = spawn(npmBin, args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH: fixturePath,
      },
      stdio: 'inherit',
    })

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${label} failed (${signal ?? code}).`))
    })
  })
}

console.log('Starting ReEditPro real-video media foundation acceptance.')
console.log(`Fixture: ${fixturePath}`)
console.log('Scope: real-video backend-local upload acceptance, mock-safe edit-plan approval, mock credit reservation, private local preview render smoke, ffprobe source readback, proxy/audio/frame foundation artifacts, and partial source analysis report. No provider calls, live Qwen calls, transcript model, public delivery, final export, Supabase writes, GCS writes, external beta, or production.')

await run('real-video-local-preview-execution', ['run', 'test:internal-testing:real-video-local-preview-execution'])
await run('real-video-media-foundation-acceptance-smoke', ['run', 'smoke:internal-testing-real-video-media-foundation-acceptance'])

for (const root of cleanupRoots) {
  await rm(path.join(repoRoot, root), { recursive: true, force: true })
}

console.log('Real-video media foundation acceptance passed.')
