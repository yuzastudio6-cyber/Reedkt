#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')
const fixturePath = path.resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || path.join(homedir(), 'Documents/test video/internal testing.MP4'))
const localModelPath = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH?.trim() || '/private/tmp/reeditpro-approved-local-models/faster-whisper-model'
const fasterWhisperCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_COMMAND?.trim()
const pythonCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND?.trim() || 'python'
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'

if (!existsSync(fixturePath)) {
  throw new Error(`Internal testing video is missing: ${fixturePath}`)
}

function run(label, args) {
  return new Promise((resolve, reject) => {
    const started = Date.now()
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
      const durationSeconds = Number(((Date.now() - started) / 1000).toFixed(1))
      if (code === 0) {
        resolve({ label, durationSeconds })
        return
      }
      reject(new Error(`${label} failed (${signal ?? code}) after ${durationSeconds}s.`))
    })
  })
}

function runtimeReady() {
  if (fasterWhisperCommand) {
    const result = spawnSync(fasterWhisperCommand, ['--help'], {
      encoding: 'utf8',
      timeout: 5000,
    })
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.toLowerCase()
    return !result.error && (result.status === 0 || output.includes('usage') || output.includes('help'))
  }

  const result = spawnSync(pythonCommand, ['-m', 'faster_whisper', '--help'], {
    encoding: 'utf8',
    timeout: 5000,
  })
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.toLowerCase()
  return !result.error && (result.status === 0 || output.includes('usage') || output.includes('help'))
}

const localModelPathExists = existsSync(localModelPath)
const fasterWhisperRuntimeReady = runtimeReady()
const transcriptReady = localModelPathExists && fasterWhisperRuntimeReady
const transcriptBlockers = [
  ...(!process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_MANIFEST_PATH?.trim() ? ['manifest_path_missing'] : []),
  ...(!localModelPathExists ? ['local_model_missing'] : []),
  ...(!fasterWhisperRuntimeReady ? ['faster_whisper_runtime_missing'] : []),
]

console.log('Starting ReEditPro real-video end-to-end readiness acceptance.')
console.log(`Fixture: ${fixturePath}`)
console.log('Scope: one repeatable operator command for real-video upload, plan, approval, private preview, media foundation, speech/caption handoff, and smart-cut preview readiness. No model download, package install, provider call, live Qwen call, Supabase/GCS write, public delivery, final export, external beta, paid production, or product-ready claim.')

const completed = []
completed.push(await run('real-video-transcription-prerequisite-manifest', ['run', 'test:internal-testing:real-video-transcription-prerequisite-manifest']))
completed.push(await run('real-video-transcription-readiness', ['run', 'test:internal-testing:real-video-transcription-readiness']))
completed.push(await run('real-video-speech-caption-handoff', ['run', 'test:internal-testing:real-video-speech-caption-handoff']))
completed.push(await run('real-video-smart-cut-preview-execution', ['run', 'test:internal-testing:real-video-smart-cut-preview-execution']))

console.log(JSON.stringify({
  ok: true,
  command: 'test:internal-testing:real-video-end-to-end-readiness',
  fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
  completed,
  stagesVerified: [
    'backend_local_upload',
    'prompt_to_plan',
    'plan_credit_approval',
    'private_preview',
    'media_probe_proxy_audio_frames',
    'speech_caption_handoff',
    'smart_cut_private_preview',
  ],
  transcriptReady,
  transcriptBlockers,
  finalReadiness: transcriptReady
    ? 'ready_for_real_transcript_acceptance_rerun'
    : 'blocked_before_content_aware_final_edit',
  nextRequiredAction: transcriptReady
    ? 'rerun_real_video_speech_caption_handoff_to_accept_real_transcript_content'
    : 'provide_approved_local_faster_whisper_model_path_and_runtime_command',
  productReady: false,
  acceptedAsFinalEditedVideo: false,
  blockedScope: {
    modelDownload: false,
    packageInstall: false,
    providerCalls: false,
    liveQwenCalls: false,
    finalExport: false,
    publicDelivery: false,
    supabaseWrites: false,
    gcsWrites: false,
    externalBeta: false,
    paidProduction: false,
  },
}, null, 2))
