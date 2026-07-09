import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import { runMediaAnalysisFoundation } from '../workers/media'
import { buildWorkerIdempotencyKey, type ProductionWorkerJobPayload } from '../workers/production'
import { runChatNativeEditPlanningFlow } from '../../src/backend/orchestrators/chat-native-editor-orchestrator'
import { createMockDatabase, resetMockIds } from '../../src/backend/mock/mock-database'
import { MOCK_USER_ID } from '../../src/backend/mock/mock-service-data'
import { approveCreditEstimate, createCreditWallet, grantWeeklyBonusCredits, reserveCredits } from '../../src/backend/services/credit-service'
import { approveEditPlan } from '../../src/backend/services/edit-plan-service'
import { unwrapServiceResult } from '../../src/backend/service-result'

const root = process.cwd()
const fixturePath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || join(homedir(), 'Documents/test video/internal testing.MP4'))
const localStorageRoot = process.env.REEDITPRO_INTERNAL_TESTING_MEDIA_FOUNDATION_STORAGE_ROOT?.trim() || '.reeditpro-real-video-media-foundation-acceptance-storage'
const rawFixtureFileName = basename(fixturePath)
const uploadedFixtureFileName = rawFixtureFileName.replace(/[^a-zA-Z0-9._-]+/g, '-')
const prompt = 'Create a clean professional social edit from this source video. Keep the pacing tight, preserve the meaning, add readable captions, lightly polish the audio, avoid clutter, and prepare a private review plan before any final export.'

assert.equal(existsSync(fixturePath), true, `Real-video media foundation fixture is missing: ${fixturePath}`)
const fixtureStat = await stat(fixturePath)
assert.equal(fixtureStat.isFile(), true, 'Real-video media foundation fixture must be a file.')
assert.ok(fixtureStat.size > 0, 'Real-video media foundation fixture must be non-empty.')
assert.equal(extname(fixturePath).toLowerCase(), '.mp4', 'Real-video media foundation fixture must be an MP4.')

await rm(join(root, localStorageRoot), { force: true, recursive: true })
const outputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-real-video-media-foundation-'))

try {
  const env = loadRuntimeEnv({
    ...process.env,
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    WORKER_RUNTIME_MODE: 'local',
    WORKER_INSTANCE_ID: 'real-video-media-foundation-worker',
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
    requestId: 'internal-testing-real-video-media-foundation-acceptance',
    auth: { userId: MOCK_USER_ID, isMockUser: true },
  }

  resetMockIds()
  const db = createMockDatabase()
  const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({
    workspaceId: 'mock-workspace',
    userId: MOCK_USER_ID,
    projectTitle: 'Internal testing real-video media foundation acceptance',
    prompt,
    clips: [
      {
        fileName: uploadedFixtureFileName,
        mimeType: 'video/mp4',
        userNotes: 'Real internal testing source video used for source media foundation readback and private analysis artifacts.',
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
  assert.equal(finalizedUpload.mediaAsset.status, 'uploaded')
  const sourceLocalPath = resolveLocalStorageObjectPath(
    env.localStorageRoot,
    finalizedUpload.storageObjectRecord.bucketName,
    finalizedUpload.storageObjectRecord.objectPath,
  )
  assert.equal(existsSync(sourceLocalPath), true, 'Finalized upload must be readable from backend-local storage.')

  const toolExecutionPlanId = `tool-execution-${planningState.project.id}-media-foundation`
  const workerPayload: ProductionWorkerJobPayload = {
    jobId: `job-${planningState.project.id}-media-foundation`,
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    editPlanId: approvedPlan.id,
    toolExecutionPlanId,
    workerType: 'cpu_analysis_worker',
    executionMode: 'mock_safe',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: ['ffprobe', 'ffmpeg'],
    requestedRecipeIds: ['media_foundation_source_readback'],
    storageReferenceIds: [finalizedUpload.storageObjectRecord.id],
    creditReservationId: creditReservation.id,
    requiredQualityGateTypes: ['render_asset_integrity'],
    createdAt: new Date().toISOString(),
    metadata: {
      internalTestingGate: 'real_video_media_foundation_acceptance',
      approvedSnapshotOnly: true,
      privateSourceReferenceOnly: true,
      noSignedUrls: true,
      finalExportAllowed: false,
    },
  }
  workerPayload.idempotencyKey = buildWorkerIdempotencyKey(workerPayload)

  const mediaFoundation = await runMediaAnalysisFoundation({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    sourceStorageObjectId: finalizedUpload.storageObjectRecord.id,
    approvedSnapshotId: approvedPlan.id,
    toolExecutionPlanId,
    idempotencyKey: workerPayload.idempotencyKey,
    workerPayload,
    source: {
      sourceStorageObjectId: finalizedUpload.storageObjectRecord.id,
      storageBucketPurpose: 'source_media',
      storageObjectPath: finalizedUpload.storageObjectRecord.objectPath,
      localFilePath: sourceLocalPath,
      contentType: finalizedUpload.storageObjectRecord.mimeType,
      sizeBytes: finalizedUpload.storageObjectRecord.sizeBytes,
      isPrivate: true,
      sourceOfTruth: true,
    },
    localStorageRoot,
    outputRoot,
    ffprobeBin: env.ffprobeBin,
    ffmpegBin: env.ffmpegBin,
    timeoutMs: 120_000,
    maxKeyframeCount: 3,
    maxRepresentativeFrameCount: 3,
  })

  assert.equal(mediaFoundation.mode, 'local_dev')
  assert.equal(mediaFoundation.status, 'partial')
  assert.equal(mediaFoundation.expectedActions.includes('probe'), true)
  assert.equal(mediaFoundation.expectedActions.includes('create_proxy'), true)
  assert.equal(mediaFoundation.expectedActions.includes('extract_audio'), true)
  assert.equal(mediaFoundation.expectedActions.includes('extract_keyframes'), true)
  assert.equal(mediaFoundation.expectedActions.includes('extract_representative_frames'), true)
  assert.equal(mediaFoundation.expectedActions.includes('build_analysis_report'), true)
  assert.ok((mediaFoundation.probe?.durationSeconds ?? 0) > 12, 'Media foundation should read real source duration.')
  assert.equal(mediaFoundation.probe?.formatName.includes('mp4'), true)
  assert.ok(mediaFoundation.probe?.width && mediaFoundation.probe.height, 'Media foundation should read source dimensions.')
  assert.equal(mediaFoundation.proxy?.status, 'created')
  assert.equal(mediaFoundation.audio?.status, 'created')
  assert.ok((mediaFoundation.keyframes?.artifacts.length ?? 0) > 0, 'Media foundation should create keyframe artifacts.')
  assert.ok((mediaFoundation.representativeFrames?.artifacts.length ?? 0) > 0, 'Media foundation should create representative frame artifacts.')
  assert.equal(mediaFoundation.mediaAnalysisReport?.status, 'partial')
  assert.equal(mediaFoundation.mediaAnalysisReport?.speechAnalysis.transcriptArtifactId, undefined)
  assert.equal(mediaFoundation.mediaAnalysisReport?.speechAnalysis.speechDetected, false)
  assert.equal(mediaFoundation.mediaAnalysisReport?.proxy.status, 'created')
  assert.equal(mediaFoundation.artifactRecords.every((artifact) => artifact.isPrivate), true)
  assert.equal(mediaFoundation.artifactRecords.every((artifact) => artifact.sourceOfTruth), true)
  assert.equal(mediaFoundation.artifactRecords.every((artifact) => artifact.storageObjectPath.startsWith(`workspaces/${planningState.project.workspaceId}/projects/${planningState.project.id}/media/${finalizedUpload.mediaAsset.id}/`)), true)
  assert.equal(mediaFoundation.artifactRecords.some((artifact) => artifact.artifactType === 'proxy_video'), true)
  assert.equal(mediaFoundation.artifactRecords.some((artifact) => artifact.artifactType === 'extracted_audio'), true)
  assert.equal(mediaFoundation.artifactRecords.some((artifact) => artifact.artifactType === 'keyframe_image'), true)
  assert.equal(mediaFoundation.artifactRecords.some((artifact) => artifact.artifactType === 'representative_frame'), true)

  const sanitized = JSON.stringify({
    artifactRecords: mediaFoundation.artifactRecords,
    mediaAnalysisReport: mediaFoundation.mediaAnalysisReport,
    warnings: mediaFoundation.warnings,
    skipReasons: mediaFoundation.skipReasons,
  }).toLowerCase()
  assert.doesNotMatch(sanitized, /signed_url|supabase_service_role|api[_-]?key|secret|public_url/)
  assert.doesNotMatch(sanitized, /providerrequest|liveqwen|gcs:\/\//)
  assert.doesNotMatch(sanitized, /documents\/test video|internal testing\.mp4/)

  console.log(JSON.stringify({
    ok: true,
    smoke: 'internal-testing-real-video-media-foundation-acceptance',
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
    mediaFoundationStatus: mediaFoundation.status,
    sourceProbe: mediaFoundation.probe,
    proxyStatus: mediaFoundation.proxy?.status,
    audioStatus: mediaFoundation.audio?.status,
    keyframeCount: mediaFoundation.keyframes?.artifacts.length ?? 0,
    representativeFrameCount: mediaFoundation.representativeFrames?.artifacts.length ?? 0,
    artifactRecordCount: mediaFoundation.artifactRecords.length,
    analysisReportStatus: mediaFoundation.mediaAnalysisReport?.status,
    transcriptStatus: 'not_run',
    productReady: false,
    acceptedAsFinalEdit: false,
    blockedScope: {
      providerCalls: false,
      liveQwenCalls: false,
      transcriptModel: false,
      publicDelivery: false,
      finalExport: false,
      supabaseWrites: false,
      gcsWrites: false,
      externalBeta: false,
      paidProduction: false,
    },
  }, null, 2))
} finally {
  await rm(outputRoot, { recursive: true, force: true })
  await rm(join(root, localStorageRoot), { recursive: true, force: true })
}
