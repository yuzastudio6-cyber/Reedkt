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

console.log('Starting ReEditPro real-video prompt-to-plan acceptance.')
console.log(`Fixture: ${fixturePath}`)
console.log('Scope: real-video backend-local upload acceptance, then mock-safe edit-plan and credit-estimate preview. No provider calls, live Qwen calls, worker execution, render/export, Supabase writes, GCS writes, public delivery, beta, or production.')

await run('real-video-upload-acceptance', ['run', 'test:internal-testing:real-video-upload-acceptance'])
await run('real-video-prompt-plan-smoke', ['run', 'smoke:internal-testing-real-video-prompt-plan-acceptance'])

console.log('Real-video prompt-to-plan acceptance passed.')
