import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { resolveFasterWhisperRuntimeReadiness } from '../workers/speech'

const fixturePath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || join(homedir(), 'Documents/test video/internal testing.MP4'))
const configuredLocalModelPath = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH?.trim() || '/private/tmp/reeditpro-approved-local-models/faster-whisper-model'
const configuredFasterWhisperCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_COMMAND?.trim() || undefined
const configuredPythonCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND?.trim() || undefined

assert.equal(existsSync(fixturePath), true, `Internal testing video is missing: ${fixturePath}`)
const fixtureStat = await stat(fixturePath)
assert.equal(fixtureStat.isFile(), true, 'Internal testing video must be a file.')
assert.ok(fixtureStat.size > 0, 'Internal testing video must be non-empty.')
assert.equal(extname(fixturePath).toLowerCase(), '.mp4', 'Internal testing video must be an MP4.')

const modelPathExists = existsSync(configuredLocalModelPath)
const runtimeReadiness = resolveFasterWhisperRuntimeReadiness({
  fasterWhisperCommand: configuredFasterWhisperCommand,
  pythonCommand: configuredPythonCommand,
})
const blockers = [
  ...(!modelPathExists ? [{
    code: 'local_model_missing',
    message: 'Approved local faster-whisper model path is missing. No model download was attempted.',
    tool: 'faster_whisper',
  }] : []),
  ...runtimeReadiness.blockers,
]
const status = blockers.length === 0 ? 'ready_for_real_transcription' : 'blocked_missing_local_transcription_prerequisites'
const sanitized = JSON.stringify({ status, blockers }).toLowerCase()

assert.doesNotMatch(sanitized, /signed_url|supabase_service_role|api[_-]?key|secret|public_url/)
assert.doesNotMatch(sanitized, /providerrequest|liveqwen|gcs:\/\//)
assert.doesNotMatch(sanitized, /documents\/test video|internal testing\.mp4/)
assert.equal(process.env.REEDITPRO_INTERNAL_TESTING_ALLOW_MODEL_DOWNLOAD === 'true', false, 'Model downloads must stay disabled for transcription readiness.')

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-real-video-transcription-readiness',
  fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
  sourceSizeBytes: fixtureStat.size,
  status,
  readyForRealTranscript: blockers.length === 0,
  localModelPathConfigured: true,
  localModelPathExists: modelPathExists,
  fasterWhisperRuntimeStatus: runtimeReadiness.status,
  fasterWhisperRuntimeKind: runtimeReadiness.runtimeKind,
  blockerCodes: blockers.map((blocker) => blocker.code),
  blockedScope: {
    modelDownload: false,
    providerCalls: false,
    liveQwenCalls: false,
    mediaProcessing: false,
    finalExport: false,
    publicDelivery: false,
    supabaseWrites: false,
    gcsWrites: false,
    externalBeta: false,
    paidProduction: false,
  },
}, null, 2))
