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
  '.reeditpro-real-video-speech-caption-handoff-storage',
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

console.log('Starting ReEditPro real-video speech/caption handoff acceptance.')
console.log(`Fixture: ${fixturePath}`)
console.log('Scope: real-video backend-local upload, mock-safe approval/reservation, media foundation source/audio extraction, and speech/caption handoff validation. Real transcription remains blocked unless an approved local model path is present. No model download, provider call, live Qwen call, public delivery, final export, Supabase write, GCS write, external beta, or production.')

await run('real-video-media-foundation-acceptance', ['run', 'test:internal-testing:real-video-media-foundation-acceptance'])
await run('real-video-speech-caption-handoff-smoke', ['run', 'smoke:internal-testing-real-video-speech-caption-handoff'])

for (const root of cleanupRoots) {
  await rm(path.join(repoRoot, root), { recursive: true, force: true })
}

console.log('Real-video speech/caption handoff acceptance passed.')
