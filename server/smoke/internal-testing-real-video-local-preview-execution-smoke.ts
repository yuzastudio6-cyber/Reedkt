import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, rm, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'
import type { BasicRenderSmokeResponse } from '../workers/jobs/basic-render-smoke-types'
import { runChatNativeEditPlanningFlow } from '../../src/backend/orchestrators/chat-native-editor-orchestrator'
import { createMockDatabase, resetMockIds } from '../../src/backend/mock/mock-database'
import { MOCK_USER_ID } from '../../src/backend/mock/mock-service-data'
import { approveCreditEstimate, createCreditWallet, grantWeeklyBonusCredits, reserveCredits } from '../../src/backend/services/credit-service'
import { approveEditPlan } from '../../src/backend/services/edit-plan-service'
import { unwrapServiceResult } from '../../src/backend/service-result'

const root = process.cwd()
const fixturePath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || join(homedir(), 'Documents/test video/internal testing.MP4'))
const localStorageRoot = process.env.REEDITPRO_INTERNAL_TESTING_LOCAL_PREVIEW_STORAGE_ROOT?.trim() || '.reeditpro-real-video-local-preview-execution-storage'
const rawFixtureFileName = basename(fixturePath)
const uploadedFixtureFileName = rawFixtureFileName.replace(/[^a-zA-Z0-9._-]+/g, '-')
const prompt = 'Create a clean professional social edit from this source video. Keep the pacing tight, preserve the meaning, add readable captions, lightly polish the audio, avoid clutter, and prepare a private review plan before any final export.'

assert.equal(existsSync(fixturePath), true, `Real-video local preview fixture is missing: ${fixturePath}`)
const fixtureStat = await stat(fixturePath)
assert.equal(fixtureStat.isFile(), true, 'Real-video local preview fixture must be a file.')
assert.ok(fixtureStat.size > 0, 'Real-video local preview fixture must be non-empty.')
assert.equal(extname(fixturePath).toLowerCase(), '.mp4', 'Real-video local preview fixture must be an MP4.')

await rm(join(root, localStorageRoot), { force: true, recursive: true })

const env = loadRuntimeEnv({
  ...process.env,
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  WORKER_RUNTIME_MODE: 'local',
  WORKER_INSTANCE_ID: 'real-video-local-preview-worker',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  GOOGLE_CLOUD_PROJECT_ID: '',
  GCS_SOURCE_MEDIA_BUCKET: '',
  GCS_PREVIEWS_BUCKET: '',
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'internal-testing-real-video-local-preview-execution',
  auth: { userId: MOCK_USER_ID, isMockUser: true },
}

resetMockIds()
const db = createMockDatabase()
const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({
  workspaceId: 'mock-workspace',
  userId: MOCK_USER_ID,
  projectTitle: 'Internal testing real-video local preview execution',
  prompt,
  clips: [
    {
      fileName: uploadedFixtureFileName,
      mimeType: 'video/mp4',
      userNotes: 'Real internal testing source video used for private backend-local preview execution.',
      uploadedOrder: 1,
    },
  ],
  includeMusicDirectorPlanning: true,
  requestedStrokeMotion: true,
}, db))

assert.equal(planningState.sourceAssets.length, 1)
assert.equal(planningState.sourceAssets[0]?.fileName, uploadedFixtureFileName)
assert.equal(planningState.editPlan.status, 'awaiting_approval')
assert.equal(planningState.creditEstimate.status, 'shown_to_user')

const approvedPlan = unwrapServiceResult(approveEditPlan(db, planningState.editPlan.id, MOCK_USER_ID))
const wallet = unwrapServiceResult(createCreditWallet(db, planningState.project.workspaceId, MOCK_USER_ID))
unwrapServiceResult(grantWeeklyBonusCredits(db, wallet.id, 100))
const creditApproval = unwrapServiceResult(approveCreditEstimate(db, {
  workspaceId: planningState.project.workspaceId,
  projectId: planningState.project.id,
  creditEstimateId: planningState.creditEstimate.id,
  approvedByUserId: MOCK_USER_ID,
}))
const creditReservation = unwrapServiceResult(reserveCredits(db, {
  workspaceId: planningState.project.workspaceId,
  projectId: planningState.project.id,
  creditWalletId: wallet.id,
  creditEstimateId: planningState.creditEstimate.id,
  creditApprovalId: creditApproval.id,
}))

assert.equal(approvedPlan.status, 'approved')
assert.equal(approvedPlan.approvalStatus, 'approved')
assert.equal(creditReservation.status, 'reserved')
assert.equal(creditReservation.reservedCredits, planningState.creditEstimate.totalEstimatedCredits)

const uploadService = createUploadService(context)
const fixtureBytes = await readFile(fixturePath)
const checksumSha256 = createHash('sha256').update(fixtureBytes).digest('hex')
const createdUpload = await uploadService.createUploadIntent({
  workspaceId: planningState.project.workspaceId,
  projectId: planningState.project.id,
  chatSessionId: planningState.chatSession.id,
  uploadPurpose: 'source_media',
  originalFileName: rawFixtureFileName,
  mimeType: 'video/mp4',
  expectedSizeBytes: fixtureBytes.length,
  checksumSha256,
})
await uploadService.uploadLocalObject(createdUpload.uploadIntent.id, fixtureBytes, 'video/mp4')
const finalizedUpload = await uploadService.finalizeUploadIntent({
  workspaceId: planningState.project.workspaceId,
  uploadIntentId: createdUpload.uploadIntent.id,
  sizeBytes: fixtureBytes.length,
  checksumSha256,
})

assert.equal(finalizedUpload.storageObjectRecord.bucketName, createdUpload.uploadIntent.targetBucket)
assert.equal(finalizedUpload.storageObjectRecord.objectPath, createdUpload.uploadIntent.targetPath)
assert.equal(finalizedUpload.storageObjectRecord.sizeBytes, fixtureBytes.length)
assert.equal(finalizedUpload.storageObjectRecord.checksumSha256, checksumSha256)
assert.equal(finalizedUpload.mediaAsset.fileName, rawFixtureFileName)
assert.equal(finalizedUpload.mediaAsset.status, 'uploaded')

const renderJobId = `render-job-${planningState.project.id}-real-video-local-preview`
const workerResult = await runWorkerClaimRunner(context, {
  jobId: renderJobId,
  workspaceId: planningState.project.workspaceId,
  projectId: planningState.project.id,
  jobType: 'basic_render_smoke',
  workerType: 'basic_render_smoke_worker',
  workerInstanceId: 'real-video-local-preview-worker',
  idempotencyKey: 'real-video-local-preview-execution',
  approvedPlanSnapshotId: approvedPlan.id,
  creditReservationId: creditReservation.id,
  storageObjectRecordId: finalizedUpload.storageObjectRecord.id,
  payloadJson: {
    sourceStorageObjectId: finalizedUpload.storageObjectRecord.id,
    storageObjectRecordId: finalizedUpload.storageObjectRecord.id,
    sourceStorageObject: {
      id: finalizedUpload.storageObjectRecord.id,
      mediaAssetId: finalizedUpload.mediaAsset.id,
      bucketName: finalizedUpload.storageObjectRecord.bucketName,
      objectPath: finalizedUpload.storageObjectRecord.objectPath,
      mimeType: finalizedUpload.storageObjectRecord.mimeType,
      sizeBytes: finalizedUpload.storageObjectRecord.sizeBytes,
      checksumSha256: finalizedUpload.storageObjectRecord.checksumSha256,
    },
  },
})
const renderSmoke = workerResult.output as BasicRenderSmokeResponse | undefined

assert.equal(workerResult.status, 'completed')
assert.equal(renderSmoke?.ok, true)
assert.equal(renderSmoke?.status, 'preview_ready')
assert.equal(renderSmoke?.renderJobId, renderJobId)
assert.equal(renderSmoke?.sourceStorageObjectId, finalizedUpload.storageObjectRecord.id)
assert.equal(renderSmoke?.durationSeconds, 3)
assert.ok((renderSmoke?.sizeBytes ?? 0) > 0, 'Private local preview should have non-empty bytes.')
assert.match(renderSmoke?.checksumSha256 ?? '', /^[a-f0-9]{64}$/)
assert.equal(renderSmoke?.outputBucketName, 'previews')
assert.match(renderSmoke?.outputObjectPath ?? '', new RegExp(`^workspaces/${planningState.project.workspaceId}/projects/${planningState.project.id}/previews/`))
assert.equal(renderSmoke?.previewRender?.commandSummary.tool, 'ffmpeg')
assert.equal(renderSmoke?.previewRender?.commandSummary.maxDurationSeconds, 3)
assert.equal(renderSmoke?.previewRender?.commandSummary.audioMode, 'muted')
const mediaProbe = renderSmoke?.mediaProbe
assert.ok(mediaProbe, 'Private local preview execution should probe the source media.')
const mediaProbeFormatName = mediaProbe.formatName
assert.ok(typeof mediaProbeFormatName === 'string', 'Private local preview source probe should include a format name.')
assert.equal(mediaProbeFormatName.includes('mp4'), true)
assert.equal(workerResult.events.some((event) => event.eventName === 'worker_completed'), true)
assert.equal(workerResult.gateChecks.every((gate) => !gate.required || gate.passed), true)
assert.equal(workerResult.toolChecks.every((check) => check.status === 'passed'), true)

const serialized = JSON.stringify({ workerResult, renderSmoke }).toLowerCase()
assert.doesNotMatch(serialized, /signed_url|supabase_service_role|api[_-]?key|secret|public_url/)
assert.doesNotMatch(serialized, /providerrequest|liveqwen|gcs:\/\//)
assert.ok(!Object.hasOwn(renderSmoke?.previewRender ?? {}, 'outputPath'), 'Preview render summary must not expose absolute output path.')

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-real-video-local-preview-execution',
  fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
  sourceSizeBytes: fixtureStat.size,
  uploadedFixtureFileName,
  prompt,
  sourceClipCount: planningState.sourceAssets.length,
  editPlanStatus: approvedPlan.status,
  creditEstimateStatus: 'approved',
  reservedCredits: creditReservation.reservedCredits,
  sourceStorageObjectId: finalizedUpload.storageObjectRecord.id,
  sourceObjectPath: finalizedUpload.storageObjectRecord.objectPath,
  workerStatus: workerResult.status,
  previewStatus: renderSmoke?.status,
  previewDurationSeconds: renderSmoke?.durationSeconds,
  previewSizeBytes: renderSmoke?.sizeBytes,
  previewChecksumSha256: renderSmoke?.checksumSha256,
  outputBucketName: renderSmoke?.outputBucketName,
  outputObjectPath: renderSmoke?.outputObjectPath,
  mediaProbe: renderSmoke?.mediaProbe,
  productReady: false,
  blockedScope: {
    providerCalls: false,
    liveQwenCalls: false,
    publicDelivery: false,
    finalExport: false,
    supabaseWrites: false,
    gcsWrites: false,
    externalBeta: false,
    paidProduction: false,
  },
}, null, 2))
