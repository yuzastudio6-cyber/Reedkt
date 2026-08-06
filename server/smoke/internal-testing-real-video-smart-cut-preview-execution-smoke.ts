import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { loadRuntimeEnv } from '../config/env'
import { probeMediaFile } from '../media/ffprobe'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import { runSmartCutTimelineExecutionPipeline } from '../workers/smart-cut-timeline'
import type { SmartCutPlan, SegmentCandidate, SegmentKeepDecision, SegmentRemoveDecision } from '../workers/smart-cut'
import { runChatNativeEditPlanningFlow } from '../../src/backend/orchestrators/chat-native-editor-orchestrator'
import { createMockDatabase, resetMockIds } from '../../src/backend/mock/mock-database'
import { MOCK_USER_ID } from '../../src/backend/mock/mock-service-data'
import { approveCreditEstimate, createCreditWallet, grantWeeklyBonusCredits, reserveCredits } from '../../src/backend/services/credit-service'
import { approveEditPlan } from '../../src/backend/services/edit-plan-service'
import { unwrapServiceResult } from '../../src/backend/service-result'

const root = process.cwd()
const fixturePath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || join(homedir(), 'Documents/test video/internal testing.MP4'))
const localStorageRoot = process.env.REEDITPRO_INTERNAL_TESTING_SMART_CUT_STORAGE_ROOT?.trim() || '.reeditpro-real-video-smart-cut-preview-execution-storage'
const rawFixtureFileName = basename(fixturePath)
const uploadedFixtureFileName = rawFixtureFileName.replace(/[^a-zA-Z0-9._-]+/g, '-')
const prompt = 'Create a clean professional social edit from this source video. Keep the pacing tight, preserve the meaning, add readable captions, lightly polish the audio, avoid clutter, and prepare a private review plan before any final export.'

assert.equal(existsSync(fixturePath), true, `Real-video smart-cut fixture is missing: ${fixturePath}`)
const fixtureStat = await stat(fixturePath)
assert.equal(fixtureStat.isFile(), true, 'Real-video smart-cut fixture must be a file.')
assert.ok(fixtureStat.size > 0, 'Real-video smart-cut fixture must be non-empty.')
assert.equal(extname(fixturePath).toLowerCase(), '.mp4', 'Real-video smart-cut fixture must be an MP4.')

await rm(join(root, localStorageRoot), { force: true, recursive: true })
const outputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-real-video-smart-cut-preview-'))

try {
  const env = loadRuntimeEnv({
    ...process.env,
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    WORKER_RUNTIME_MODE: 'local',
    WORKER_INSTANCE_ID: 'real-video-smart-cut-preview-worker',
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
    requestId: 'internal-testing-real-video-smart-cut-preview-execution',
    auth: { userId: MOCK_USER_ID, isMockUser: true },
  }

  resetMockIds()
  const db = createMockDatabase()
  const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({
    workspaceId: 'mock-workspace',
    userId: MOCK_USER_ID,
    projectTitle: 'Internal testing real-video smart-cut preview execution',
    prompt,
    clips: [
      {
        fileName: uploadedFixtureFileName,
        mimeType: 'video/mp4',
        userNotes: 'Real internal testing source video used for private backend-local smart-cut proxy preview execution.',
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
  await uploadService.uploadLocalObject(createdUpload.uploadIntent.id, planningState.project.workspaceId, fixtureBytes, 'video/mp4')
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
  const sourceProbe = await probeMediaFile(sourceLocalPath, {
    ffprobeBin: env.ffprobeBin,
    timeoutMs: env.toolCheckTimeoutMs,
  })
  assert.ok((sourceProbe.durationSeconds ?? 0) > 12, 'Real-video smart-cut preview requires a source longer than 12 seconds.')
  assert.ok(sourceProbe.width && sourceProbe.height, 'Real-video smart-cut source probe must include dimensions.')

  const smartCutPlan = buildTechnicalSmartCutPlan({
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    sourceDurationSeconds: sourceProbe.durationSeconds ?? 0,
  })
  const result = await runSmartCutTimelineExecutionPipeline({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    toolExecutionPlanId: `tool-execution-${planningState.project.id}-smart-cut-preview`,
    idempotencyKey: 'real-video-smart-cut-preview-execution',
    editPlanId: approvedPlan.id,
    smartCutPlan,
    sourceVideoArtifactId: finalizedUpload.storageObjectRecord.id,
    sourceVideoLocalPath: sourceLocalPath,
    sourceStorageObjectPath: finalizedUpload.storageObjectRecord.objectPath,
    outputDirectory: outputRoot,
    enableProxyPreview: true,
    allowFinalExport: false,
    ffmpegBin: env.ffmpegBin,
    ffprobeBin: env.ffprobeBin,
    timeoutMs: 120_000,
    fps: 30,
    canvas: { width: sourceProbe.width ?? 1080, height: sourceProbe.height ?? 1920 },
    mediaDurationSeconds: sourceProbe.durationSeconds,
  })

  assert.equal(result.mode, 'local_dev')
  if (result.status !== 'partial') {
    throw new Error(`Smart-cut preview execution did not reach partial preview status: ${JSON.stringify({
      status: result.status,
      skippedReasons: result.skippedReasons,
      warnings: result.warnings,
      blocksPreview: result.blocksPreview,
      qaResults: result.qaResults.map((gate) => ({
        gateType: gate.gateType,
        status: gate.status,
        blocking: gate.blocking,
        issues: gate.issues,
      })),
    }, null, 2)}`)
  }
  assert.equal(result.blocksPreview, false)
  assert.equal(result.blocksFinalExport, true)
  assert.equal(result.skippedReasons.length, 0)
  assert.equal(result.executionPlan?.previewAllowed, true)
  assert.equal(result.executionPlan?.finalExportAllowed, false)
  assert.equal(result.ffmpegCommandPlan?.previewEnabled, true)
  assert.equal(result.ffmpegCommandPlan?.finalExportAllowed, false)
  assert.equal(result.ffmpegCommandPlan?.executes, false)
  assert.equal(result.ffmpegCommandPlan?.commands.length, smartCutPlan.keepSegments.length + 1)
  assert.equal(result.ffmpegCommandPlan?.commands.every((command) =>
    command.args.includes('0:v:0') &&
    command.args.includes('0:a?') &&
    command.args.includes('-dn') &&
    command.args.includes('-sn'),
  ), true, 'Smart-cut preview commands must exclude camera data/timecode streams.')
  assert.equal(result.previewArtifact?.artifactType, 'preview_video')
  assert.equal(result.previewArtifact?.storageBucketPurpose, 'previews')
  assert.equal(result.previewArtifact?.previewAllowed, true)
  assert.equal(result.previewArtifact?.sourceOfTruth, false)
  assert.equal(result.artifacts.some((artifact) => artifact.artifactType === 'timeline_manifest'), true)
  assert.equal(result.artifacts.some((artifact) => artifact.artifactType === 'opentimelineio_manifest'), true)
  assert.equal(result.artifacts.some((artifact) => artifact.artifactType === 'qa_report'), true)
  assert.equal(result.artifacts.every((artifact) => artifact.isPrivate), true)
  assert.equal(result.timelineManifest?.clips.length, smartCutPlan.keepSegments.length)
  assert.equal(result.timelineManifest?.durationSeconds, smartCutPlan.targetDurationSeconds)
  assert.equal(result.otioManifest?.OTIO_SCHEMA, 'Timeline.1')
  assert.equal(result.hyperframeBridge?.bridgeType, 'hyperframe_timeline_bridge')
  assert.equal(result.remotionManifest?.manifestType, 'remotion_composition_manifest')
  assert.equal(result.qaResults.some((gate) => gate.gateType === 'final_delivery' && gate.status !== 'passed'), true)
  assert.equal(result.qaResults.filter((gate) => gate.blocksPreview).length, 0)

  const previewPath = result.ffmpegCommandPlan?.expectedPreviewOutputPath
  assert.ok(previewPath, 'Smart-cut preview execution must expose expected private preview path to the smoke only.')
  assert.equal(existsSync(previewPath), true, 'Smart-cut preview execution must create a private local preview file.')
  const [previewStat, previewBytes, previewProbe] = await Promise.all([
    stat(previewPath),
    readFile(previewPath),
    probeMediaFile(previewPath, {
      ffprobeBin: env.ffprobeBin,
      timeoutMs: env.toolCheckTimeoutMs,
    }),
  ])
  const previewChecksumSha256 = createHash('sha256').update(previewBytes).digest('hex')
  assert.ok(previewStat.size > 0, 'Smart-cut private preview should have non-empty bytes.')
  assert.match(previewChecksumSha256, /^[a-f0-9]{64}$/)
  assert.ok((previewProbe.durationSeconds ?? 0) > 0, 'Smart-cut private preview probe should include duration.')
  assert.ok((previewProbe.durationSeconds ?? 0) <= (sourceProbe.durationSeconds ?? 0), 'Smart-cut private preview should not exceed source duration.')
  assert.ok((previewProbe.streamCount ?? 0) > 0, 'Smart-cut private preview should include media streams.')

  const sanitized = JSON.stringify({
    artifacts: result.artifacts,
    previewArtifact: result.previewArtifact,
    qaResults: result.qaResults,
    warnings: result.warnings,
  }).toLowerCase()
  assert.doesNotMatch(sanitized, /signed_url|supabase_service_role|api[_-]?key|secret|public_url/)
  assert.doesNotMatch(sanitized, /providerrequest|liveqwen|gcs:\/\//)
  assert.doesNotMatch(sanitized, /documents\/test video|internal testing\.mp4/)

  console.log(JSON.stringify({
    ok: true,
    smoke: 'internal-testing-real-video-smart-cut-preview-execution',
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
    sourceProbe,
    smartCutStatus: result.status,
    smartCutPreviewArtifactId: result.previewArtifact?.id,
    smartCutPreviewStoragePath: result.previewArtifact?.storageObjectPath,
    keepSegmentCount: smartCutPlan.keepSegments.length,
    removeSegmentCount: smartCutPlan.removeSegments.length,
    plannedTargetDurationSeconds: smartCutPlan.targetDurationSeconds,
    previewDurationSeconds: previewProbe.durationSeconds,
    previewSizeBytes: previewStat.size,
    previewChecksumSha256,
    qaGateStatuses: result.qaResults.map((gate) => ({
      gateType: gate.gateType,
      status: gate.status,
      blocksPreview: gate.blocksPreview,
      blocksFinalExport: gate.blocksFinalExport,
    })),
    productReady: false,
    acceptedAsFinalEdit: false,
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
} finally {
  await rm(outputRoot, { recursive: true, force: true })
  await rm(join(root, localStorageRoot), { recursive: true, force: true })
}

function buildTechnicalSmartCutPlan(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  sourceDurationSeconds: number
}): SmartCutPlan {
  const sourceDurationSeconds = round(input.sourceDurationSeconds)
  const keepRanges = buildKeepRanges(sourceDurationSeconds)
  const keepSegments = keepRanges.map((range, index): SegmentKeepDecision => ({
    decisionId: `keep-real-video-technical-sample-${index + 1}`,
    candidateId: `candidate-real-video-technical-sample-${index + 1}`,
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds,
    score: index === 0 ? 0.92 : 0.84,
    confidence: 0.72,
    reason: index === 0
      ? 'Private technical preview keeps the opening range as protected setup evidence.'
      : 'Private technical preview keeps a bounded source range to verify trim/concat execution; content acceptance is deferred to source-understanding QA.',
    protected: index === 0,
  }))
  const removeSegments = buildRemoveSegments(keepRanges, sourceDurationSeconds)
  const candidates = keepRanges.map((range, index): SegmentCandidate => ({
    candidateId: `candidate-real-video-technical-sample-${index + 1}`,
    candidateType: 'fallback',
    source: 'fallback',
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds,
    text: 'Technical private preview range.',
    transcriptSegmentIds: [],
    captionIds: [],
    wordCount: 0,
    evidence: {
      hasTranscript: false,
      hasWordTimestamps: false,
      hasSilence: false,
      hasSceneBoundary: false,
      hasCaption: false,
      fillerLabels: [],
      repeatedTakeCandidateIds: [],
    },
    risks: ['none'],
    protected: index === 0,
    reason: 'Fallback range is used only to verify backend-local smart-cut preview execution against the uploaded private source.',
  }))
  const targetDurationSeconds = round(keepSegments.reduce((sum, segment) => sum + (segment.endSeconds - segment.startSeconds), 0))

  return {
    id: `smart-cut-plan-${input.mediaAssetId}-real-video-preview`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    sourceDurationSeconds,
    targetDurationSeconds,
    intent: ['tighten_pacing', 'preserve_story'],
    aggressiveness: 'gentle',
    pacingProfile: {
      profileId: 'natural_clean',
      maxSilenceSeconds: 1.2,
      minSegmentDurationSeconds: 3,
      targetCutsPerMinuteMin: 2,
      targetCutsPerMinuteMax: 5,
      emotionalPausePolicy: 'protect',
      notes: [
        'Private technical preview only.',
        'Content-level trim acceptance is deferred until source-understanding and transcript evidence are available.',
      ],
    },
    segmentCandidates: candidates,
    segmentScores: [],
    keepSegments,
    removeSegments,
    cutBoundaries: removeSegments.flatMap((segment) => [
      {
        boundaryId: `boundary-${segment.decisionId}-start`,
        sourceTimeSeconds: segment.startSeconds,
        adjustedTimeSeconds: segment.startSeconds,
        paddingBeforeSeconds: 0,
        paddingAfterSeconds: 0,
        risks: ['none' as const],
        safe: true,
        reason: 'Technical private preview boundary; source-content meaning QA deferred.',
      },
      {
        boundaryId: `boundary-${segment.decisionId}-end`,
        sourceTimeSeconds: segment.endSeconds,
        adjustedTimeSeconds: segment.endSeconds,
        paddingBeforeSeconds: 0,
        paddingAfterSeconds: 0,
        risks: ['none' as const],
        safe: true,
        reason: 'Technical private preview boundary; source-content meaning QA deferred.',
      },
    ]),
    protectedSegments: keepSegments.filter((segment) => segment.protected),
    rejectedCandidates: [],
    meaningFindings: [{
      findingId: 'real-video-meaning-qa-deferred',
      severity: 'info',
      range: { startSeconds: 0, endSeconds: sourceDurationSeconds },
      code: 'source_understanding_required_before_final_edit_acceptance',
      message: 'This private preview verifies execution mechanics only; final professional trim acceptance requires source-understanding evidence.',
    }],
    warnings: ['Private smart-cut preview is not accepted as a final professional edit or public export.'],
    confidence: 0.72,
    qaChecks: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
    requiredQualityGates: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
  }
}

function buildKeepRanges(sourceDurationSeconds: number): Array<{ startSeconds: number; endSeconds: number }> {
  const firstEnd = Math.min(4, sourceDurationSeconds)
  if (sourceDurationSeconds <= 12) {
    return [{ startSeconds: 0, endSeconds: round(sourceDurationSeconds) }]
  }

  const middleStart = clamp(sourceDurationSeconds * 0.45, firstEnd + 2, sourceDurationSeconds - 8)
  const middleEnd = Math.min(middleStart + 4, sourceDurationSeconds - 4)
  const finalStart = Math.max(sourceDurationSeconds - 4, middleEnd + 0.5)
  const ranges = [
    { startSeconds: 0, endSeconds: firstEnd },
    { startSeconds: middleStart, endSeconds: middleEnd },
    { startSeconds: finalStart, endSeconds: sourceDurationSeconds },
  ]
    .map((range) => ({ startSeconds: round(range.startSeconds), endSeconds: round(range.endSeconds) }))
    .filter((range) => range.endSeconds - range.startSeconds >= 1)

  return ranges
}

function buildRemoveSegments(
  keepRanges: Array<{ startSeconds: number; endSeconds: number }>,
  sourceDurationSeconds: number,
): SegmentRemoveDecision[] {
  const sorted = [...keepRanges].sort((a, b) => a.startSeconds - b.startSeconds)
  const removals: SegmentRemoveDecision[] = []
  let cursor = 0
  for (const [index, range] of sorted.entries()) {
    if (range.startSeconds - cursor >= 0.5) {
      removals.push({
        decisionId: `remove-real-video-technical-gap-${index + 1}`,
        candidateId: `candidate-real-video-technical-gap-${index + 1}`,
        startSeconds: round(cursor),
        endSeconds: round(range.startSeconds),
        score: 0.7,
        confidence: 0.7,
        reason: 'Private technical preview gap for verifying trim/concat execution; not accepted as content-level cut approval.',
        risks: ['none'],
        futureOnly: true,
      })
    }
    cursor = Math.max(cursor, range.endSeconds)
  }
  if (sourceDurationSeconds - cursor >= 0.5) {
    removals.push({
      decisionId: `remove-real-video-technical-gap-${sorted.length + 1}`,
      candidateId: `candidate-real-video-technical-gap-${sorted.length + 1}`,
      startSeconds: round(cursor),
      endSeconds: round(sourceDurationSeconds),
      score: 0.7,
      confidence: 0.7,
      reason: 'Private technical preview tail gap for verifying trim/concat execution; not accepted as content-level cut approval.',
      risks: ['none'],
      futureOnly: true,
    })
  }
  return removals
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
