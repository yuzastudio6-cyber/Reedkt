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
import { runSpeechCaptionExecutionPipeline } from '../workers/speech-caption'
import { resolveFasterWhisperRuntimeReadiness } from '../workers/speech'
import { buildWorkerIdempotencyKey, type ProductionWorkerJobPayload } from '../workers/production'
import type { TranscriptSegment } from '../workers/speech'
import { runChatNativeEditPlanningFlow } from '../../src/backend/orchestrators/chat-native-editor-orchestrator'
import { createMockDatabase, resetMockIds } from '../../src/backend/mock/mock-database'
import { MOCK_USER_ID } from '../../src/backend/mock/mock-service-data'
import { approveCreditEstimate, createCreditWallet, grantWeeklyBonusCredits, reserveCredits } from '../../src/backend/services/credit-service'
import { approveEditPlan } from '../../src/backend/services/edit-plan-service'
import { unwrapServiceResult } from '../../src/backend/service-result'

const root = process.cwd()
const fixturePath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || join(homedir(), 'Documents/test video/internal testing.MP4'))
const localStorageRoot = process.env.REEDITPRO_INTERNAL_TESTING_SPEECH_CAPTION_STORAGE_ROOT?.trim() || '.reeditpro-real-video-speech-caption-handoff-storage'
const configuredLocalModelPath = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH?.trim() || '/private/tmp/reeditpro-approved-local-models/faster-whisper-model'
const configuredFasterWhisperCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_COMMAND?.trim() || undefined
const configuredPythonCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND?.trim() || undefined
const rawFixtureFileName = basename(fixturePath)
const uploadedFixtureFileName = rawFixtureFileName.replace(/[^a-zA-Z0-9._-]+/g, '-')
const prompt = 'Create a clean professional social edit from this source video. Keep the pacing tight, preserve the meaning, add readable captions, lightly polish the audio, avoid clutter, and prepare a private review plan before any final export.'
const localModelPathExists = existsSync(configuredLocalModelPath)
const runtimeReadiness = resolveFasterWhisperRuntimeReadiness({
  fasterWhisperCommand: configuredFasterWhisperCommand,
  pythonCommand: configuredPythonCommand,
})
const realTranscriptionReady = localModelPathExists && runtimeReadiness.status === 'ready'
const expectedRealTranscriptBlocker = localModelPathExists
  ? runtimeReadiness.blockers[0]?.code ?? 'none'
  : 'local_model_missing'

assert.equal(existsSync(fixturePath), true, `Real-video speech/caption handoff fixture is missing: ${fixturePath}`)
const fixtureStat = await stat(fixturePath)
assert.equal(fixtureStat.isFile(), true, 'Real-video speech/caption fixture must be a file.')
assert.ok(fixtureStat.size > 0, 'Real-video speech/caption fixture must be non-empty.')
assert.equal(extname(fixturePath).toLowerCase(), '.mp4', 'Real-video speech/caption fixture must be an MP4.')

await rm(join(root, localStorageRoot), { force: true, recursive: true })
const mediaOutputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-real-video-speech-caption-media-'))
const speechOutputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-real-video-speech-caption-output-'))

try {
  const env = loadRuntimeEnv({
    ...process.env,
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    WORKER_RUNTIME_MODE: 'local',
    WORKER_INSTANCE_ID: 'real-video-speech-caption-worker',
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
    requestId: 'internal-testing-real-video-speech-caption-handoff',
    auth: { userId: MOCK_USER_ID, isMockUser: true },
  }

  resetMockIds()
  const db = createMockDatabase()
  const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({
    workspaceId: 'mock-workspace',
    userId: MOCK_USER_ID,
    projectTitle: 'Internal testing real-video speech caption handoff',
    prompt,
    clips: [
      {
        fileName: uploadedFixtureFileName,
        mimeType: 'video/mp4',
        userNotes: 'Real internal testing source video used for speech/caption handoff validation after private media foundation.',
        uploadedOrder: 1,
      },
    ],
    includeMusicDirectorPlanning: true,
    requestedStrokeMotion: true,
  }, db))

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
  await uploadService.uploadLocalObject(createdUpload.uploadIntent.id, planningState.project.workspaceId, fixtureBytes, 'video/mp4')
  const finalizedUpload = await uploadService.finalizeUploadIntent({
    workspaceId: planningState.project.workspaceId,
    uploadIntentId: createdUpload.uploadIntent.id,
    sizeBytes: fixtureBytes.length,
    checksumSha256,
  })

  const sourceLocalPath = resolveLocalStorageObjectPath(
    env.localStorageRoot,
    finalizedUpload.storageObjectRecord.bucketName,
    finalizedUpload.storageObjectRecord.objectPath,
  )
  assert.equal(existsSync(sourceLocalPath), true, 'Finalized upload must be readable from backend-local storage.')

  const mediaToolExecutionPlanId = `tool-execution-${planningState.project.id}-speech-caption-media-foundation`
  const mediaPayload = buildPayload({
    planningState,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    creditReservationId: creditReservation.id,
    toolExecutionPlanId: mediaToolExecutionPlanId,
    jobId: `job-${planningState.project.id}-speech-caption-media-foundation`,
    requestedToolIds: ['ffprobe', 'ffmpeg'],
    requestedRecipeIds: ['media_foundation_audio_source_for_speech_caption'],
    storageReferenceId: finalizedUpload.storageObjectRecord.id,
    metadata: {
      internalTestingGate: 'real_video_speech_caption_handoff_media_foundation',
      noSignedUrls: true,
      finalExportAllowed: false,
    },
  })

  const mediaFoundation = await runMediaAnalysisFoundation({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    sourceStorageObjectId: finalizedUpload.storageObjectRecord.id,
    approvedSnapshotId: approvedPlan.id,
    toolExecutionPlanId: mediaToolExecutionPlanId,
    idempotencyKey: mediaPayload.idempotencyKey,
    workerPayload: mediaPayload,
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
    outputRoot: mediaOutputRoot,
    ffprobeBin: env.ffprobeBin,
    ffmpegBin: env.ffmpegBin,
    timeoutMs: 120_000,
    maxKeyframeCount: 1,
    maxRepresentativeFrameCount: 1,
  })

  assert.equal(mediaFoundation.status, 'partial')
  assert.equal(mediaFoundation.audio?.status, 'created')
  assert.ok(mediaFoundation.audio?.artifact?.localFilePath, 'Speech/caption handoff requires extracted local audio.')
  assert.equal(existsSync(mediaFoundation.audio.artifact.localFilePath), true, 'Extracted local audio must exist during handoff.')

  const speechToolExecutionPlanId = `tool-execution-${planningState.project.id}-speech-caption-handoff`
  const speechPayload = buildPayload({
    planningState,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    creditReservationId: creditReservation.id,
    toolExecutionPlanId: speechToolExecutionPlanId,
    jobId: `job-${planningState.project.id}-speech-caption-handoff`,
    requestedToolIds: ['faster_whisper', 'ffmpeg'],
    requestedRecipeIds: ['speech_caption_handoff_requires_local_model'],
    storageReferenceId: mediaFoundation.audio.artifact.artifactId,
    metadata: {
      internalTestingGate: 'real_video_speech_caption_handoff',
      realTranscriptionRequiresLocalModel: true,
      allowModelDownload: false,
      placeholderTranscriptNotAcceptedAsSourceTruth: true,
      finalExportAllowed: false,
    },
  })
  const placeholderSegments = buildPlaceholderSegments(mediaFoundation.probe?.durationSeconds ?? 0)
  const speechCaption = await runSpeechCaptionExecutionPipeline({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    toolExecutionPlanId: speechToolExecutionPlanId,
    idempotencyKey: speechPayload.idempotencyKey,
    sourceAudioArtifactId: mediaFoundation.audio.artifact.artifactId,
    sourceAudioLocalPath: mediaFoundation.audio.artifact.localFilePath,
    sourceVideoLocalPath: sourceLocalPath,
    outputDirectory: speechOutputRoot,
    modelName: 'faster-whisper-local-model-required',
    localModelPath: configuredLocalModelPath,
    language: 'en',
    device: 'cpu',
    wordTimestamps: true,
    vadFilter: true,
    timeoutMs: 120_000,
    enableRealTranscription: true,
    allowModelDownload: false,
    fasterWhisperCommand: configuredFasterWhisperCommand,
    pythonCommand: configuredPythonCommand,
    enableCaptionPreview: false,
    buildSpeech: true,
    buildCaptions: true,
    captionFormats: ['srt', 'webvtt', 'ass'],
    captionStyle: 'bold_social_captions',
    existingMediaAnalysisReport: mediaFoundation.mediaAnalysisReport,
    workerPayload: speechPayload,
    mockSegments: placeholderSegments,
  })

  assert.equal(speechCaption.mode, 'local_dev')
  if (realTranscriptionReady) {
    assert.equal(speechCaption.status, 'completed', 'Speech/caption handoff should complete when approved local model/runtime evidence is present.')
    assert.equal(speechCaption.skippedReasons.length, 0, 'Real transcript-ready handoff should not report skip reasons.')
    assert.equal(speechCaption.transcript?.segments.some((segment) => segment.text.includes('placeholder')), false)
  } else {
    assert.equal(speechCaption.status, 'skipped', 'Speech/caption handoff should report skipped while real model/runtime evidence is missing.')
    assert.equal(speechCaption.skippedReasons.some((reason) => reason.code === expectedRealTranscriptBlocker), true)
    assert.equal(speechCaption.transcript?.segments[0]?.text.includes('placeholder'), true)
  }
  assert.equal(speechCaption.modelWeightStatus, 'missing')
  assert.equal(speechCaption.blocksFinalExport, true)
  assert.equal(speechCaption.blocksPreview, false)
  assert.ok(speechCaption.transcriptArtifacts.some((artifact) => artifact.artifactType === 'transcript_json'))
  assert.ok(speechCaption.transcriptArtifacts.some((artifact) => artifact.artifactType === 'word_timestamps_json'))
  assert.ok(speechCaption.captionArtifacts.some((artifact) => artifact.artifactType === 'caption_segments_json'))
  assert.ok(speechCaption.captionArtifacts.some((artifact) => artifact.artifactType === 'qa_report'))
  assert.equal(speechCaption.captionFiles.length, 3)
  assert.ok(speechCaption.captionFiles.every((file) => file.localFilePath && existsSync(file.localFilePath)))
  assert.ok(speechCaption.captionSegments.length > 0)
  assert.ok(speechCaption.qaResults.some((gate) => gate.gateType === 'transcript_alignment'))
  assert.ok(speechCaption.updatedMediaAnalysisReport?.speechAnalysis.transcriptArtifactId)
  assert.equal(speechCaption.updatedMediaAnalysisReport?.status, 'partial')
  if (!realTranscriptionReady && expectedRealTranscriptBlocker === 'local_model_missing') {
    assert.equal(speechCaption.warnings.some((warning) => warning.includes('model path is unavailable')), true)
  }

  const sanitized = JSON.stringify({
    transcriptArtifacts: speechCaption.transcriptArtifacts,
    captionArtifacts: speechCaption.captionArtifacts,
    qaResults: speechCaption.qaResults,
    skippedReasons: speechCaption.skippedReasons,
    warnings: speechCaption.warnings,
  }).toLowerCase()
  assert.doesNotMatch(sanitized, /signed_url|supabase_service_role|api[_-]?key|secret|public_url/)
  assert.doesNotMatch(sanitized, /providerrequest|liveqwen|gcs:\/\//)
  assert.doesNotMatch(sanitized, /documents\/test video|internal testing\.mp4/)

  console.log(JSON.stringify({
    ok: true,
    smoke: 'internal-testing-real-video-speech-caption-handoff',
    fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
    sourceSizeBytes: fixtureStat.size,
    uploadedFixtureFileName,
    prompt,
    sourceClipCount: planningState.sourceAssets.length,
    editPlanStatus: approvedPlan.status,
    creditEstimateStatus: 'approved',
    reservedCredits: creditReservation.reservedCredits,
    sourceStorageObjectId: finalizedUpload.storageObjectRecord.id,
    mediaFoundationStatus: mediaFoundation.status,
    sourceProbe: mediaFoundation.probe,
    extractedAudioStatus: mediaFoundation.audio.status,
    speechCaptionStatus: speechCaption.status,
    transcriptArtifactCount: speechCaption.transcriptArtifacts.length,
    captionArtifactCount: speechCaption.captionArtifacts.length,
    captionFileFormats: speechCaption.captionFiles.map((file) => file.format),
    captionSegmentCount: speechCaption.captionSegments.length,
    qaGateStatuses: speechCaption.qaResults.map((gate) => ({
      gateType: gate.gateType,
      status: gate.status,
      blocksPreview: gate.blocksPreview,
      blocksFinalExport: gate.blocksFinalExport,
    })),
    qaGateIssues: speechCaption.qaResults.flatMap((gate) => gate.issues.map((issue) => ({
      gateType: gate.gateType,
      status: gate.status,
      code: issue.code,
      severity: issue.severity,
      blocksFinalExport: gate.blocksFinalExport,
    }))),
    localModelPathConfigured: true,
    localModelPathExists,
    fasterWhisperRuntimeStatus: runtimeReadiness.status,
    fasterWhisperRuntimeKind: runtimeReadiness.runtimeKind,
    realTranscriptAccepted: realTranscriptionReady,
    realTranscriptBlocker: realTranscriptionReady ? 'none' : expectedRealTranscriptBlocker,
    placeholderCaptionWiringOnly: !realTranscriptionReady,
    productReady: false,
    acceptedAsFinalEdit: false,
    blockedScope: {
      providerCalls: false,
      liveQwenCalls: false,
      modelDownload: false,
      realTranscriptContent: false,
      publicDelivery: false,
      finalExport: false,
      supabaseWrites: false,
      gcsWrites: false,
      externalBeta: false,
      paidProduction: false,
    },
  }, null, 2))
} finally {
  await rm(mediaOutputRoot, { recursive: true, force: true })
  await rm(speechOutputRoot, { recursive: true, force: true })
  await rm(join(root, localStorageRoot), { recursive: true, force: true })
}

interface PlanningStateForPayload {
  project: {
    workspaceId: string
    id: string
  }
}

function buildPayload(input: {
  planningState: PlanningStateForPayload
  mediaAssetId: string
  approvedSnapshotId: string
  creditReservationId: string
  toolExecutionPlanId: string
  jobId: string
  requestedToolIds: ProductionWorkerJobPayload['requestedToolIds']
  requestedRecipeIds: string[]
  storageReferenceId: string
  metadata: Record<string, unknown>
}): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: input.jobId,
    workspaceId: input.planningState.project.workspaceId,
    projectId: input.planningState.project.id,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    editPlanId: input.approvedSnapshotId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    workerType: 'cpu_analysis_worker',
    executionMode: 'mock_safe',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: input.requestedToolIds,
    requestedRecipeIds: input.requestedRecipeIds,
    storageReferenceIds: [input.storageReferenceId],
    creditReservationId: input.creditReservationId,
    requiredQualityGateTypes: ['transcript_alignment', 'caption_timing', 'caption_readability'],
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}

function buildPlaceholderSegments(sourceDurationSeconds: number): TranscriptSegment[] {
  const endSeconds = Math.max(2.4, Math.min(5.6, sourceDurationSeconds > 0 ? sourceDurationSeconds : 5.6))
  return [{
    segmentId: 'real-video-transcript-placeholder-1',
    startSeconds: 0,
    endSeconds,
    text: 'Transcript placeholder only; approved local speech model evidence is required before content captions are accepted.',
    confidence: 0.5,
    words: [
      { word: 'Transcript', startSeconds: 0, endSeconds: 0.45, confidence: 0.5, segmentId: 'real-video-transcript-placeholder-1' },
      { word: 'placeholder', startSeconds: 0.45, endSeconds: 1.05, confidence: 0.5, segmentId: 'real-video-transcript-placeholder-1' },
      { word: 'only;', startSeconds: 1.05, endSeconds: 1.35, confidence: 0.5, segmentId: 'real-video-transcript-placeholder-1' },
      { word: 'local', startSeconds: 1.35, endSeconds: 1.7, confidence: 0.5, segmentId: 'real-video-transcript-placeholder-1' },
      { word: 'speech', startSeconds: 1.7, endSeconds: 2.1, confidence: 0.5, segmentId: 'real-video-transcript-placeholder-1' },
      { word: 'model', startSeconds: 2.1, endSeconds: 2.45, confidence: 0.5, segmentId: 'real-video-transcript-placeholder-1' },
      { word: 'required.', startSeconds: 2.45, endSeconds, confidence: 0.5, segmentId: 'real-video-transcript-placeholder-1' },
    ],
  }]
}
