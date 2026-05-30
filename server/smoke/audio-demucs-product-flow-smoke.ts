import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getApiRouteById } from '../../src/backend/api'
import { handleMockApiRequest, createMockApiRuntimeContext } from '../../src/backend/api/mock-api-router'
import {
  createMockAudioSeparationJob,
  DEEPFILTERNET_VOICE_CLEANUP_ACTIONS,
  DEMUCS_AUDIO_SEPARATION_ACTIONS,
  getAudioSeparationRightsNotice,
  RNNOISE_ACTIVE_ACTIONS,
  requestMockAudioSeparationRemux,
} from '../../src/backend/audio-separation'
import { getProductionToolProfile } from '../tool-registry'
import {
  DEMUCS_APPROVAL_REQUIRED_MESSAGE,
  DEMUCS_RUNTIME_DOWNLOADS_BLOCKED_MESSAGE,
  validateDemucsModelApproval,
} from '../workers/audio/demucs-model-approval'
import {
  buildDemucsCommand,
  buildDemucsSkipReason,
  buildExpectedStemPaths,
} from '../workers/audio/demucs-adapter'

const demucsProfile = getProductionToolProfile('demucs')
const deepFilterNetProfile = getProductionToolProfile('deepfilternet')
const rnnoiseProfile = getProductionToolProfile('rnnoise')

assert.ok(deepFilterNetProfile)
assert.ok(demucsProfile)
assert.ok(rnnoiseProfile)

for (const action of DEEPFILTERNET_VOICE_CLEANUP_ACTIONS) {
  assert.ok(deepFilterNetProfile.bestFor.includes(action), `${action} must map to DeepFilterNet`)
  assert.ok(demucsProfile.notBestFor.includes(action), `${action} must not map to Demucs`)
}

for (const action of DEMUCS_AUDIO_SEPARATION_ACTIONS) {
  assert.ok(demucsProfile.bestFor.includes(action) || demucsProfile.supportedActions.some((item) => normalized(item) === normalized(action)), `${action} must map to Demucs`)
  assert.ok(deepFilterNetProfile.notBestFor.includes(action) || deepFilterNetProfile.notBestFor.includes('Music separation'), `${action} must not map to DeepFilterNet`)
}

assert.equal(rnnoiseProfile.productionStatus, 'blocked')
assert.deepEqual(RNNOISE_ACTIVE_ACTIONS, [])
assert.equal(rnnoiseProfile.supportedActions.includes('inactive_reference_only'), true)
assert.equal(JSON.stringify(getApiRouteById('audio.separation.job.create')).includes('rnnoise'), false)

assert.equal(getApiRouteById('audio.separation.job.create')?.path, '/api/audio/separation/jobs')
assert.equal(getApiRouteById('audio.separation.job.get')?.path, '/api/audio/separation/jobs/:jobId')
assert.equal(getApiRouteById('audio.separation.stems.list')?.path, '/api/audio/separation/jobs/:jobId/stems')
assert.equal(getApiRouteById('audio.separation.remux.create')?.path, '/api/audio/separation/jobs/:jobId/remux')

const job = createMockAudioSeparationJob({
  engine: 'demucs',
  mode: 'stems-4',
  workspaceId: 'workspace-audio',
  projectId: 'project-audio',
  mediaAssetId: 'media-audio',
})
assert.equal(job.engine, 'demucs')
assert.equal(job.workerKind, 'audio_separation')
assert.equal(job.modelApproval.required, true)
assert.equal(job.modelApproval.runtimeDownloadsAllowed, false)
assert.equal(job.modelApproval.enforcedForRuntime, true)
assert.equal(job.modelApproval.mockBypass, true)
assert.equal(job.stems.length, 4)
assert.ok(job.stems.every((stem) => stem.isPrivate))
assert.ok(job.stems.every((stem) => !/^https?:\/\//i.test(stem.storageObjectPath)))
assert.ok(job.actions.includes('Split Stems'))
assert.ok(job.blockedUses.includes('Clean Voice'))

const vocalsJob = createMockAudioSeparationJob({ engine: 'demucs', mode: 'vocals' })
assert.deepEqual(vocalsJob.stems.map((stem) => stem.kind), ['vocals', 'no_vocals'])
const instrumentalJob = createMockAudioSeparationJob({ engine: 'demucs', mode: 'instrumental' })
assert.deepEqual(instrumentalJob.stems.map((stem) => stem.kind), ['instrumental'])

assert.throws(
  () => createMockAudioSeparationJob({ engine: 'demucs', mode: 'bad-mode' as never }),
  /vocals, stems-4, or instrumental/,
)
assert.ok(getAudioSeparationRightsNotice().includes('Only upload, separate, export, or share audio that you own'))

const remux = requestMockAudioSeparationRemux(job.jobId)
assert.equal(remux.status, 'blocked')
assert.ok(remux.message.includes('not enabled'))

const routeResponse = await handleMockApiRequest({
  routeId: 'audio.separation.job.create',
  context: createMockApiRuntimeContext(),
  body: {
    engine: 'demucs',
    mode: 'vocals',
    workspaceId: 'workspace-audio',
    projectId: 'project-audio',
    mediaAssetId: 'media-route',
  },
})
assert.equal(routeResponse.ok, true)
assert.equal((routeResponse.data as typeof job).engine, 'demucs')

const missingApproval = validateDemucsModelApproval({
  enabled: 'true',
  modelId: 'htdemucs-or-company-model',
  modelPath: '/tmp/missing-model.th',
  approvalPath: '/tmp/missing-approval.json',
  allowRuntimeDownloads: 'false',
})
assert.equal(missingApproval.valid, false)
assert.ok(missingApproval.blockers.includes(DEMUCS_APPROVAL_REQUIRED_MESSAGE))

const runtimeDownloads = validateDemucsModelApproval({
  enabled: 'true',
  modelId: 'htdemucs-or-company-model',
  modelPath: '/tmp/missing-model.th',
  approvalPath: '/tmp/missing-approval.json',
  allowRuntimeDownloads: 'true',
})
assert.ok(runtimeDownloads.blockers.includes(DEMUCS_RUNTIME_DOWNLOADS_BLOCKED_MESSAGE))

const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'demucs-approval-smoke-'))
try {
  const modelPath = path.join(tempRoot, 'model.th')
  const approvalPath = path.join(tempRoot, 'approval.json')
  writeFileSync(modelPath, 'approved-demucs-model-placeholder')
  const sha256 = createHash('sha256').update(readFileSync(modelPath)).digest('hex')
  writeFileSync(approvalPath, JSON.stringify({
    schemaVersion: 1,
    tool: 'demucs',
    model_id: 'htdemucs-or-company-model',
    model_file: 'model.th',
    model_source: 'company-controlled-artifact',
    model_license: 'approved-model-license',
    commercial_use_approved: true,
    redistribution_approved: false,
    license_status: 'approved',
    approved_by: 'model-review',
    approved_at: '2026-05-30T00:00:00Z',
    sha256,
    intended_uses: [...DEMUCS_AUDIO_SEPARATION_ACTIONS],
    blocked_uses: [...DEEPFILTERNET_VOICE_CLEANUP_ACTIONS],
  }, null, 2))

  const approved = validateDemucsModelApproval({
    enabled: 'true',
    modelId: 'htdemucs-or-company-model',
    modelPath,
    approvalPath,
    allowRuntimeDownloads: 'false',
  })
  assert.equal(approved.valid, true)
  assert.equal(approved.manifest?.commercial_use_approved, true)

  const command = buildDemucsCommand({
    sourceAudioLocalPath: modelPath,
    outputDirectory: tempRoot,
    timeoutMs: 30_000,
    runMode: 'local_dev',
    localDevToolExecution: true,
    separationMode: 'vocals',
    allowModelDownload: false,
    modelApproval: {
      enabled: 'true',
      modelId: 'htdemucs-or-company-model',
      modelPath,
      approvalPath,
      allowRuntimeDownloads: 'false',
    },
  })
  assert.deepEqual(command.args.slice(0, 2), ['--two-stems', 'vocals'])
  assert.ok(command.args.includes('--repo'))
  assert.ok(command.args.includes('htdemucs-or-company-model'))
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}

assert.deepEqual(buildExpectedStemPaths('/tmp/out', 'stems-4').map((item) => path.basename(item)), ['vocals.wav', 'drums.wav', 'bass.wav', 'other.wav'])
assert.equal(buildDemucsSkipReason({ timeoutMs: 1, runMode: 'dry_run', localDevToolExecution: false })?.code, 'demucs_not_enabled')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'deepfilternet_voice_cleanup_mapping',
    'demucs_separation_mapping',
    'rnnoise_not_active',
    'audio_separation_api_routes',
    'mock_job_stems_and_remux',
    'demucs_model_approval_manifest_required',
    'runtime_downloads_blocked',
    'rights_notice',
  ],
}))

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}
