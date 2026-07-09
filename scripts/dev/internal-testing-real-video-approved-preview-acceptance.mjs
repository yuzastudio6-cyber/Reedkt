#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')
const fixturePath = path.resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || path.join(homedir(), 'Documents/test video/internal testing.MP4'))
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'

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

console.log('Starting ReEditPro real-video approved-preview acceptance.')
console.log(`Fixture: ${fixturePath}`)
console.log('Scope: real-video backend-local upload acceptance, mock-safe edit-plan preview, mock credit approval/reservation, mock work graph, and private preview QA only. No real provider calls, live Qwen calls, real tool execution, real media processing, real rendering/export, Supabase writes, GCS writes, public delivery, external beta, or production.')

await run('real-video-prompt-plan-acceptance', ['run', 'test:internal-testing:real-video-prompt-plan-acceptance'])
await run('real-video-approved-preview-smoke', ['run', 'smoke:internal-testing-real-video-approved-preview-acceptance'])

console.log('Real-video approved-preview acceptance passed.')
