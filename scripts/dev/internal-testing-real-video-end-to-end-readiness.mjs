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
const pythonCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND?.trim() || (process.platform === 'win32' ? 'python' : 'python3')
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
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdout += text
      process.stdout.write(text)
    })
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      stderr += text
      process.stderr.write(text)
    })

    child.on('exit', (code, signal) => {
      const durationSeconds = Number(((Date.now() - started) / 1000).toFixed(1))
      if (code === 0) {
        resolve({ label, durationSeconds, stdout, stderr })
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

  const result = spawnSync(pythonCommand, ['-c', 'from faster_whisper import WhisperModel'], {
    encoding: 'utf8',
    timeout: 5000,
  })
  return !result.error && result.status === 0
}

const localModelPathExists = existsSync(localModelPath)
const fasterWhisperRuntimeReady = runtimeReady()
const transcriptReady = localModelPathExists && fasterWhisperRuntimeReady
const privateReviewArtifactRequested = process.env.REEDITPRO_CONFIRM_INTERNAL_TESTING_PRIVATE_REVIEW_ARTIFACT === 'true'
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
if (privateReviewArtifactRequested) {
  completed.push(await run('real-video-private-review-artifact', ['run', 'test:internal-testing:real-video-private-review-artifact']))
}

const handoffSummary = findJsonByField(
  completed.find((item) => item.label === 'real-video-speech-caption-handoff')?.stdout ?? '',
  'smoke',
  'internal-testing-real-video-speech-caption-handoff',
)
const smartCutSummary = findJsonByField(
  completed.find((item) => item.label === 'real-video-smart-cut-preview-execution')?.stdout ?? '',
  'smoke',
  'internal-testing-real-video-smart-cut-preview-execution',
)
const privateReviewSummary = findJsonByField(
  completed.find((item) => item.label === 'real-video-private-review-artifact')?.stdout ?? '',
  'smoke',
  'internal-testing-real-video-private-review-artifact',
)
const realTranscriptAccepted = handoffSummary?.realTranscriptAccepted === true
const captionReadabilityGate = handoffSummary?.qaGateStatuses?.find?.((gate) => gate.gateType === 'caption_readability')
const captionQaWarnings = Array.isArray(handoffSummary?.qaGateIssues)
  ? handoffSummary.qaGateIssues.filter((issue) => issue.severity === 'warning')
  : []
const finalDeliveryGate = smartCutSummary?.qaGateStatuses?.find?.((gate) => gate.gateType === 'final_delivery')
const privateReviewReady = privateReviewSummary?.status === 'ready_for_internal_tester_private_review' &&
  privateReviewSummary?.privateReviewArtifact?.hasVisibleCaptions === true
const privateReviewBlocked = typeof privateReviewSummary?.status === 'string' && privateReviewSummary.status.startsWith('blocked_by_')

console.log(JSON.stringify({
  ok: true,
  command: 'test:internal-testing:real-video-end-to-end-readiness',
  fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
  completed: completed.map(({ label, durationSeconds }) => ({ label, durationSeconds })),
  stagesVerified: [
    'backend_local_upload',
    'prompt_to_plan',
    'plan_credit_approval',
    'private_preview',
    'media_probe_proxy_audio_frames',
    'speech_caption_handoff',
    'smart_cut_private_preview',
    ...(privateReviewArtifactRequested ? ['captioned_private_review_artifact'] : []),
  ],
  transcriptReady,
  transcriptBlockers,
  realTranscriptAccepted,
  speechCaptionStatus: handoffSummary?.speechCaptionStatus ?? 'not_observed',
  captionSegmentCount: handoffSummary?.captionSegmentCount ?? 0,
  captionReadabilityStatus: captionReadabilityGate?.status ?? 'not_observed',
  captionQaWarnings,
  smartCutStatus: smartCutSummary?.smartCutStatus ?? 'not_observed',
  smartCutPreviewDurationSeconds: smartCutSummary?.previewDurationSeconds,
  privateReviewStatus: privateReviewSummary?.status ?? (privateReviewArtifactRequested ? 'not_observed' : 'not_requested'),
  privateReviewArtifact: privateReviewSummary?.privateReviewArtifact,
  finalDeliveryStatus: finalDeliveryGate?.status ?? 'not_observed',
  finalReadiness: deriveFinalReadiness({
    transcriptReady,
    realTranscriptAccepted,
    captionReadabilityStatus: captionReadabilityGate?.status,
    finalDeliveryStatus: finalDeliveryGate?.status,
    privateReviewReady,
    privateReviewBlocked,
    privateReviewStatus: privateReviewSummary?.status,
  }),
  nextRequiredAction: deriveNextRequiredAction({
    transcriptReady,
    realTranscriptAccepted,
    captionReadabilityStatus: captionReadabilityGate?.status,
    finalDeliveryStatus: finalDeliveryGate?.status,
    privateReviewReady,
    privateReviewBlocked,
    privateReviewStatus: privateReviewSummary?.status,
  }),
  internalTesterReady: privateReviewReady,
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

function deriveFinalReadiness(input) {
  if (!input.transcriptReady) return 'blocked_before_content_aware_final_edit'
  if (!input.realTranscriptAccepted) return 'ready_for_real_transcript_acceptance_rerun'
  if (input.captionReadabilityStatus === 'warning' || input.captionReadabilityStatus === 'blocked') {
    return 'blocked_by_caption_readability_before_final_export'
  }
  if (input.privateReviewReady) return 'ready_for_internal_tester_private_review_public_delivery_blocked'
  if (input.privateReviewBlocked) return input.privateReviewStatus
  if (input.finalDeliveryStatus === 'blocked') return 'blocked_by_final_delivery_gate_after_private_preview'
  return 'ready_for_internal_tester_private_review'
}

function deriveNextRequiredAction(input) {
  if (!input.transcriptReady) return 'provide_approved_local_faster_whisper_manifest_model_path_and_runtime_package_or_command'
  if (!input.realTranscriptAccepted) return 'rerun_real_video_speech_caption_handoff_to_accept_real_transcript_content'
  if (input.captionReadabilityStatus === 'warning' || input.captionReadabilityStatus === 'blocked') {
    return 'resolve_caption_readability_before_final_export_or_private_review_promotion'
  }
  if (input.privateReviewReady) return 'open_internal_tester_private_review_artifact'
  if (input.privateReviewBlocked) return 'run_private_review_caption_burnin_in_render_worker_or_libass_enabled_ffmpeg'
  if (input.finalDeliveryStatus === 'blocked') return 'run_later_final_delivery_private_review_gate'
  return 'open_internal_tester_private_review'
}

function findJsonByField(output, field, value) {
  return parseJsonObjects(stripAnsi(output)).find((item) => item?.[field] === value)
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
}

function parseJsonObjects(output) {
  const objects = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = 0; index < output.length; index += 1) {
    const char = output[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) start = index
      depth += 1
      continue
    }

    if (char === '}' && depth > 0) {
      depth -= 1
      if (depth === 0 && start >= 0) {
        const candidate = output.slice(start, index + 1)
        try {
          objects.push(JSON.parse(candidate))
        } catch {
          // Ignore non-JSON brace output from nested tools.
        }
        start = -1
      }
    }
  }

  return objects
}
