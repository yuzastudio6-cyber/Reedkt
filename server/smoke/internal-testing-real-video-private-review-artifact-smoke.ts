import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { loadRuntimeEnv } from '../config/env'
import { probeMediaFile } from '../media/ffprobe'
import { assertOutputPathInsideRoot } from '../workers/media/media-path-safety'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import { runMediaAnalysisFoundation } from '../workers/media'
import { buildAssCaptionText } from '../workers/captions/ass-caption-builder'
import { getCaptionStylePreset } from '../workers/captions/caption-style-policy'
import type { CaptionSegment } from '../workers/captions'
import { runSpeechCaptionExecutionPipeline } from '../workers/speech-caption'
import { resolveFasterWhisperRuntimeReadiness, type TranscriptWord } from '../workers/speech'
import { buildWorkerIdempotencyKey, type ProductionWorkerJobPayload } from '../workers/production'
import { runSmartCutTimelineExecutionPipeline } from '../workers/smart-cut-timeline'
import type { SegmentCandidate, SegmentKeepDecision, SegmentRemoveDecision, SmartCutPlan } from '../workers/smart-cut'
import { runChatNativeEditPlanningFlow } from '../../src/backend/orchestrators/chat-native-editor-orchestrator'
import { createMockDatabase, resetMockIds } from '../../src/backend/mock/mock-database'
import { MOCK_USER_ID } from '../../src/backend/mock/mock-service-data'
import { approveCreditEstimate, createCreditWallet, grantWeeklyBonusCredits, reserveCredits } from '../../src/backend/services/credit-service'
import { approveEditPlan } from '../../src/backend/services/edit-plan-service'
import { unwrapServiceResult } from '../../src/backend/service-result'

const execFileAsync = promisify(execFile)
const root = process.cwd()
const fixturePath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() || join(homedir(), 'Documents/test video/internal testing.MP4'))
const localStorageRoot = process.env.REEDITPRO_INTERNAL_TESTING_PRIVATE_REVIEW_STORAGE_ROOT?.trim() || '.reeditpro-real-video-private-review-artifact-storage'
const privateReviewRoot = resolve(process.env.REEDITPRO_INTERNAL_TESTING_PRIVATE_REVIEW_OUTPUT_ROOT?.trim() || '/private/tmp/reeditpro-internal-testing-private-review')
const localModelPath = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH?.trim() || '/private/tmp/reeditpro-approved-local-models/faster-whisper-model'
const fasterWhisperCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_COMMAND?.trim() || undefined
const pythonCommand = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND?.trim() || undefined
const captionBurnInContainerImage = process.env.REEDITPRO_INTERNAL_TESTING_CAPTION_BURNIN_CONTAINER_IMAGE?.trim() || 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001'
const dockerBin = process.env.REEDITPRO_INTERNAL_TESTING_DOCKER_BIN?.trim() || 'docker'
const rawFixtureFileName = basename(fixturePath)
const uploadedFixtureFileName = rawFixtureFileName.replace(/[^a-zA-Z0-9._-]+/g, '-')
const prompt = 'Create a clean professional social edit from this source video. Keep the pacing tight, preserve the meaning, add readable captions, lightly polish the audio, avoid clutter, and prepare a private review plan before any final export.'

assert.equal(process.env.REEDITPRO_CONFIRM_INTERNAL_TESTING_PRIVATE_REVIEW_ARTIFACT, 'true', 'Private review artifact creation requires REEDITPRO_CONFIRM_INTERNAL_TESTING_PRIVATE_REVIEW_ARTIFACT=true.')
assert.equal(privateReviewRoot.startsWith(root), false, 'Private review artifact output root must be outside the repository.')
assert.equal(existsSync(fixturePath), true, `Real-video private review fixture is missing: ${fixturePath}`)
assert.equal(existsSync(localModelPath), true, `Approved local faster-whisper model is missing: ${localModelPath}`)
const runtimeReadiness = resolveFasterWhisperRuntimeReadiness({ fasterWhisperCommand, pythonCommand })
assert.equal(runtimeReadiness.status, 'ready', `Faster-whisper runtime must be ready for private review artifact creation: ${runtimeReadiness.blockers.map((item) => item.code).join(', ')}`)

const fixtureStat = await stat(fixturePath)
assert.equal(fixtureStat.isFile(), true, 'Real-video private review fixture must be a file.')
assert.ok(fixtureStat.size > 0, 'Real-video private review fixture must be non-empty.')
assert.equal(extname(fixturePath).toLowerCase(), '.mp4', 'Real-video private review fixture must be an MP4.')

await rm(join(root, localStorageRoot), { force: true, recursive: true })
const mediaOutputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-real-video-private-review-media-'))
const speechOutputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-real-video-private-review-speech-'))
const smartCutOutputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-real-video-private-review-smart-cut-'))
const runId = `real-video-private-review-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`
const runOutputRoot = resolve(privateReviewRoot, runId)
const captionFilePath = assertOutputPathInsideRoot(join(speechOutputRoot, 'retimed-private-review-captions.ass'), speechOutputRoot)
const privateReviewSourcePreviewPath = resolve(runOutputRoot, 'internal-testing-private-review-source-smart-cut.mp4')
const privateReviewVideoPath = resolve(runOutputRoot, 'internal-testing-private-review-captioned.mp4')
const privateReviewCaptionSidecarPath = resolve(runOutputRoot, 'internal-testing-private-review-captions.ass')
const privateReviewManifestPath = resolve(runOutputRoot, 'internal-testing-private-review-manifest.json')

try {
  const env = loadRuntimeEnv({
    ...process.env,
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    WORKER_RUNTIME_MODE: 'local',
    WORKER_INSTANCE_ID: 'real-video-private-review-worker',
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
    requestId: 'internal-testing-real-video-private-review-artifact',
    auth: { userId: MOCK_USER_ID, isMockUser: true },
  }

  resetMockIds()
  const db = createMockDatabase()
  const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({
    workspaceId: 'mock-workspace',
    userId: MOCK_USER_ID,
    projectTitle: 'Internal testing real-video private review artifact',
    prompt,
    clips: [{
      fileName: uploadedFixtureFileName,
      mimeType: 'video/mp4',
      userNotes: 'Real internal testing source video used for an approved private review artifact.',
      uploadedOrder: 1,
    }],
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
  const sourceChecksumSha256 = createHash('sha256').update(fixtureBytes).digest('hex')
  const createdUpload = await uploadService.createUploadIntent({
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    chatSessionId: planningState.chatSession.id,
    uploadPurpose: 'source_media',
    originalFileName: rawFixtureFileName,
    mimeType: 'video/mp4',
    expectedSizeBytes: fixtureBytes.length,
    checksumSha256: sourceChecksumSha256,
  })
  await uploadService.uploadLocalObject(createdUpload.uploadIntent.id, planningState.project.workspaceId, fixtureBytes, 'video/mp4')
  const finalizedUpload = await uploadService.finalizeUploadIntent({
    workspaceId: planningState.project.workspaceId,
    uploadIntentId: createdUpload.uploadIntent.id,
    sizeBytes: fixtureBytes.length,
    checksumSha256: sourceChecksumSha256,
  })
  const sourceLocalPath = resolveLocalStorageObjectPath(env.localStorageRoot, finalizedUpload.storageObjectRecord.bucketName, finalizedUpload.storageObjectRecord.objectPath)
  assert.equal(existsSync(sourceLocalPath), true, 'Finalized private source video must exist in backend-local storage.')

  const sourceProbe = await probeMediaFile(sourceLocalPath, { ffprobeBin: env.ffprobeBin, timeoutMs: env.toolCheckTimeoutMs })
  assert.ok((sourceProbe.durationSeconds ?? 0) > 12, 'Private review source must be long enough for a smart-cut preview.')

  const mediaToolExecutionPlanId = `tool-execution-${planningState.project.id}-private-review-media-foundation`
  const mediaPayload = buildPayload({
    planningState,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    creditReservationId: creditReservation.id,
    toolExecutionPlanId: mediaToolExecutionPlanId,
    jobId: `job-${planningState.project.id}-private-review-media-foundation`,
    requestedToolIds: ['ffprobe', 'ffmpeg'],
    requestedRecipeIds: ['private_review_media_foundation'],
    storageReferenceId: finalizedUpload.storageObjectRecord.id,
    metadata: { internalTestingGate: 'private_review_media_foundation', finalExportAllowed: false, publicDeliveryAllowed: false },
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
  assert.equal(mediaFoundation.audio?.status, 'created')
  assert.ok(mediaFoundation.audio?.artifact?.localFilePath && existsSync(mediaFoundation.audio.artifact.localFilePath))

  const speechToolExecutionPlanId = `tool-execution-${planningState.project.id}-private-review-speech-caption`
  const speechPayload = buildPayload({
    planningState,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    creditReservationId: creditReservation.id,
    toolExecutionPlanId: speechToolExecutionPlanId,
    jobId: `job-${planningState.project.id}-private-review-speech-caption`,
    requestedToolIds: ['faster_whisper', 'ffmpeg'],
    requestedRecipeIds: ['private_review_real_transcript_captions'],
    storageReferenceId: mediaFoundation.audio.artifact.artifactId,
    metadata: { internalTestingGate: 'private_review_speech_caption', allowModelDownload: false, finalExportAllowed: false, publicDeliveryAllowed: false },
  })
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
    modelName: 'faster-whisper-approved-local-small',
    localModelPath,
    language: 'en',
    device: 'cpu',
    wordTimestamps: true,
    vadFilter: true,
    timeoutMs: 120_000,
    enableRealTranscription: true,
    allowModelDownload: false,
    fasterWhisperCommand,
    pythonCommand,
    enableCaptionPreview: false,
    buildSpeech: true,
    buildCaptions: true,
    captionFormats: ['srt', 'webvtt', 'ass'],
    captionStyle: 'bold_social_captions',
    existingMediaAnalysisReport: mediaFoundation.mediaAnalysisReport,
    workerPayload: speechPayload,
  })
  assert.equal(speechCaption.status, 'completed')
  assert.equal(speechCaption.skippedReasons.length, 0)
  assert.equal(speechCaption.captionSegments.length > 0, true)
  assert.equal(speechCaption.qaResults.some((gate) => gate.status === 'blocked' || gate.status === 'failed'), false)

  const smartCutPlan = buildTechnicalSmartCutPlan({
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    sourceDurationSeconds: sourceProbe.durationSeconds ?? 0,
  })
  const smartCut = await runSmartCutTimelineExecutionPipeline({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    toolExecutionPlanId: `tool-execution-${planningState.project.id}-private-review-smart-cut`,
    idempotencyKey: 'real-video-private-review-smart-cut',
    editPlanId: approvedPlan.id,
    smartCutPlan,
    sourceVideoArtifactId: finalizedUpload.storageObjectRecord.id,
    sourceVideoLocalPath: sourceLocalPath,
    sourceStorageObjectPath: finalizedUpload.storageObjectRecord.objectPath,
    outputDirectory: smartCutOutputRoot,
    enableProxyPreview: true,
    allowFinalExport: false,
    ffmpegBin: env.ffmpegBin,
    ffprobeBin: env.ffprobeBin,
    timeoutMs: 120_000,
    fps: 30,
    canvas: { width: sourceProbe.width ?? 1080, height: sourceProbe.height ?? 1920 },
    mediaDurationSeconds: sourceProbe.durationSeconds,
    captionArtifactIds: speechCaption.captionArtifacts.map((artifact) => artifact.id),
  })
  assert.equal(smartCut.status, 'partial')
  assert.equal(smartCut.blocksPreview, false)
  assert.ok(smartCut.ffmpegCommandPlan?.expectedPreviewOutputPath)
  assert.equal(existsSync(smartCut.ffmpegCommandPlan.expectedPreviewOutputPath), true)

  const retimedCaptions = retimeCaptionsForKeepSegments(speechCaption.captionSegments, smartCutPlan.keepSegments)
  assert.ok(retimedCaptions.length > 0, 'Private review artifact must have at least one retimed caption.')
  await writeFile(captionFilePath, buildAssCaptionText(retimedCaptions, getCaptionStylePreset('bold_social_captions')), 'utf8')

  await mkdir(runOutputRoot, { recursive: true })
  await copyFile(smartCut.ffmpegCommandPlan.expectedPreviewOutputPath, privateReviewSourcePreviewPath)
  await copyFile(captionFilePath, privateReviewCaptionSidecarPath)
  const captionBurnIn = await burnCaptionsIntoPrivateReview({
    ffmpegBin: env.ffmpegBin,
    sourceVideoPath: privateReviewSourcePreviewPath,
    assCaptionPath: privateReviewCaptionSidecarPath,
    outputPath: privateReviewVideoPath,
    workDirectory: runOutputRoot,
    dockerBin,
    containerImage: captionBurnInContainerImage,
    timeoutMs: 300_000,
  })
  if (captionBurnIn.status === 'blocked') {
    await copyFile(privateReviewSourcePreviewPath, privateReviewVideoPath)
  }
  const [privateReviewStat, privateReviewBytes, privateReviewProbe] = await Promise.all([
    stat(privateReviewVideoPath),
    readFile(privateReviewVideoPath),
    probeMediaFile(privateReviewVideoPath, { ffprobeBin: env.ffprobeBin, timeoutMs: env.toolCheckTimeoutMs }),
  ])
  const privateReviewChecksumSha256 = createHash('sha256').update(privateReviewBytes).digest('hex')
  assert.ok(privateReviewStat.size > 0)
  assert.match(privateReviewChecksumSha256, /^[a-f0-9]{64}$/)
  assert.ok((privateReviewProbe.durationSeconds ?? 0) > 0)
  assert.ok((privateReviewProbe.streamCount ?? 0) > 0)

  const manifest = {
    artifactType: 'internal_testing_private_review_video',
    status: captionBurnIn.status === 'created'
      ? 'ready_for_internal_tester_private_review'
      : 'blocked_by_caption_burnin_filter_missing',
    runId,
    fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
    promptSummary: 'Clean professional social edit with tight pacing, preserved meaning, readable captions, light audio polish, and private review before final export.',
    sourceSizeBytes: fixtureStat.size,
    sourceChecksumSha256,
    privateReviewVideoPath,
    privateReviewCaptionSidecarPath,
    privateReviewSizeBytes: privateReviewStat.size,
    privateReviewChecksumSha256,
    privateReviewDurationSeconds: privateReviewProbe.durationSeconds,
    smartCutPreviewDurationSeconds: privateReviewProbe.durationSeconds,
    captionSegmentCount: retimedCaptions.length,
    captionBurnInStatus: captionBurnIn.status,
    captionBurnInRuntime: captionBurnIn.status === 'created' ? captionBurnIn.runtime : undefined,
    captionBurnInBlocker: captionBurnIn.status === 'blocked' ? captionBurnIn.blocker : undefined,
    realTranscriptAccepted: true,
    publicDeliveryAllowed: false,
    finalExportAllowed: false,
    productReady: false,
    supabaseWrites: false,
    gcsWrites: false,
    externalBeta: false,
    paidProduction: false,
  }
  await writeFile(privateReviewManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  const sanitized = JSON.stringify({
    ...manifest,
    fixtureDisplayPath: '[display-only-fixture-path-redacted]',
  }).toLowerCase()
  assert.doesNotMatch(sanitized, /signed_url|supabase_service_role|api[_-]?key|secret|public_url|gcs:\/\//)
  assert.doesNotMatch(sanitized, /documents\/test video|internal testing\.mp4/)

  console.log(JSON.stringify({
    ok: true,
    smoke: 'internal-testing-real-video-private-review-artifact',
    status: manifest.status,
    fixtureDisplayPath: 'Documents/test video/internal testing.MP4',
    promptSummary: manifest.promptSummary,
    sourceClipCount: planningState.sourceAssets.length,
    editPlanStatus: approvedPlan.status,
    creditEstimateStatus: 'approved',
    reservedCredits: creditReservation.reservedCredits,
    mediaFoundationStatus: mediaFoundation.status,
    speechCaptionStatus: speechCaption.status,
    realTranscriptAccepted: true,
    captionSegmentCount: retimedCaptions.length,
    smartCutStatus: smartCut.status,
    privateReviewArtifact: {
      localPath: privateReviewVideoPath,
      captionSidecarPath: privateReviewCaptionSidecarPath,
      manifestPath: privateReviewManifestPath,
      sizeBytes: privateReviewStat.size,
      checksumSha256: privateReviewChecksumSha256,
      durationSeconds: privateReviewProbe.durationSeconds,
      streamCount: privateReviewProbe.streamCount,
      hasVisibleCaptions: captionBurnIn.status === 'created',
      captionBurnInStatus: captionBurnIn.status,
      captionBurnInRuntime: captionBurnIn.status === 'created' ? captionBurnIn.runtime : undefined,
      captionBurnInBlocker: captionBurnIn.status === 'blocked' ? captionBurnIn.blocker : undefined,
    },
    productReady: false,
    acceptedAsFinalEdit: false,
    blockedScope: {
      providerCalls: false,
      liveQwenCalls: false,
      modelDownload: false,
      packageInstall: false,
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
  await rm(smartCutOutputRoot, { recursive: true, force: true })
  await rm(join(root, localStorageRoot), { recursive: true, force: true })
}

async function burnCaptionsIntoPrivateReview(input: {
  ffmpegBin: string
  sourceVideoPath: string
  assCaptionPath: string
  outputPath: string
  workDirectory: string
  dockerBin: string
  containerImage: string
  timeoutMs: number
}): Promise<{ status: 'created'; runtime: 'host_ffmpeg' | 'container_ffmpeg_libass' } | { status: 'blocked'; blocker: string }> {
  assert.equal(existsSync(input.sourceVideoPath), true)
  assert.equal(existsSync(input.assCaptionPath), true)
  try {
    await execFileAsync(input.ffmpegBin, [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      input.sourceVideoPath,
      '-map',
      '0:v:0',
      '-map',
      '0:a?',
      '-dn',
      '-sn',
      '-vf',
      `scale=720:-2,ass=filename='${escapeFfmpegFilterPath(input.assCaptionPath)}'`,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'copy',
      input.outputPath,
    ], {
      timeout: input.timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    })
    return { status: 'created', runtime: 'host_ffmpeg' }
  } catch (error) {
    const stderr = typeof error === 'object' && error && 'stderr' in error ? String((error as { stderr?: unknown }).stderr ?? '') : ''
    if (/No such filter:\s*'ass'|Filter not found|No such filter:\s*'subtitles'|No such filter:\s*'drawtext'/i.test(stderr)) {
      return burnCaptionsWithContainer(input)
    }
    throw error
  }
}

async function burnCaptionsWithContainer(input: {
  workDirectory: string
  dockerBin: string
  containerImage: string
  timeoutMs: number
}): Promise<{ status: 'created'; runtime: 'container_ffmpeg_libass' } | { status: 'blocked'; blocker: string }> {
  try {
    await execFileAsync(input.dockerBin, [
      'run',
      '--rm',
      '--network',
      'none',
      '-v',
      `${input.workDirectory}:/work:rw`,
      input.containerImage,
      'ffmpeg',
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      '/work/internal-testing-private-review-source-smart-cut.mp4',
      '-map',
      '0:v:0',
      '-map',
      '0:a?',
      '-dn',
      '-sn',
      '-vf',
      "scale=720:-2,ass=filename='/work/internal-testing-private-review-captions.ass'",
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'copy',
      '/work/internal-testing-private-review-captioned.mp4',
    ], {
      timeout: input.timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    })
    return { status: 'created', runtime: 'container_ffmpeg_libass' }
  } catch (error) {
    const stderr = typeof error === 'object' && error && 'stderr' in error ? String((error as { stderr?: unknown }).stderr ?? '') : ''
    if (/Unable to find image|pull access denied|No such image|Cannot connect to the Docker daemon|not found/i.test(stderr)) {
      return { status: 'blocked', blocker: 'caption_burnin_container_unavailable' }
    }
    return { status: 'blocked', blocker: 'caption_burnin_container_failed' }
  }
}

function escapeFfmpegFilterPath(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
}

function retimeCaptionsForKeepSegments(captions: CaptionSegment[], keepSegments: SegmentKeepDecision[]): CaptionSegment[] {
  const sortedKeep = [...keepSegments].sort((a, b) => a.startSeconds - b.startSeconds)
  const retimed: CaptionSegment[] = []
  let outputOffset = 0

  for (const keep of sortedKeep) {
    const keepDuration = keep.endSeconds - keep.startSeconds
    const overlappingCaptions = captions.filter((caption) => caption.endSeconds > keep.startSeconds && caption.startSeconds < keep.endSeconds)
    for (const caption of overlappingCaptions) {
      const start = Math.max(caption.startSeconds, keep.startSeconds)
      const end = Math.min(caption.endSeconds, keep.endSeconds)
      if (end - start < 0.3) continue
      const words = caption.words
        .filter((word) => word.endSeconds > start && word.startSeconds < end)
        .map((word): TranscriptWord => ({
          ...word,
          startSeconds: Math.max(0, outputOffset + Math.max(word.startSeconds, start) - keep.startSeconds),
          endSeconds: Math.max(0.1, outputOffset + Math.min(word.endSeconds, end) - keep.startSeconds),
          segmentId: `${word.segmentId}-private-review`,
        }))
      const text = normalizeCaptionText(words.length > 0 ? words.map((word) => word.word).join(' ') : caption.text)
      if (!text) continue
      retimed.push({
        ...caption,
        captionId: `${caption.captionId}-private-review-${retimed.length + 1}`,
        startSeconds: round(outputOffset + start - keep.startSeconds),
        endSeconds: round(outputOffset + end - keep.startSeconds),
        text,
        lines: wrapCaptionText(text),
        words,
      })
    }
    outputOffset += keepDuration
  }

  return mergeCloseCaptions(retimed)
}

function mergeCloseCaptions(captions: CaptionSegment[]): CaptionSegment[] {
  const merged: CaptionSegment[] = []
  for (const caption of captions.sort((a, b) => a.startSeconds - b.startSeconds)) {
    const previous = merged.at(-1)
    if (!previous || caption.startSeconds - previous.endSeconds > 0.08 || previous.text.length + caption.text.length > 56) {
      merged.push(caption)
      continue
    }
    const text = normalizeCaptionText(`${previous.text} ${caption.text}`)
    merged[merged.length - 1] = {
      ...previous,
      endSeconds: caption.endSeconds,
      text,
      lines: wrapCaptionText(text),
      words: [...previous.words, ...caption.words],
    }
  }
  return merged
}

function wrapCaptionText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > 28 && current) {
      lines.push(current)
      current = word
      continue
    }
    current = next
  }
  if (current) lines.push(current)
  return lines.slice(0, 2)
}

function normalizeCaptionText(text: string): string {
  return text
    .replace(/[{}]/g, '')
    .replace(/\\[A-Za-z]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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

function buildTechnicalSmartCutPlan(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  sourceDurationSeconds: number
}): SmartCutPlan {
  const sourceDurationSeconds = round(input.sourceDurationSeconds)
  const keepRanges = buildKeepRanges(sourceDurationSeconds)
  const keepSegments = keepRanges.map((range, index): SegmentKeepDecision => ({
    decisionId: `keep-real-video-private-review-${index + 1}`,
    candidateId: `candidate-real-video-private-review-${index + 1}`,
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds,
    score: index === 0 ? 0.92 : 0.84,
    confidence: 0.72,
    reason: index === 0
      ? 'Private review keeps the opening range as protected setup evidence.'
      : 'Private review keeps bounded source ranges to verify edit playback and caption retiming.',
    protected: index === 0,
  }))
  const removeSegments = buildRemoveSegments(keepRanges, sourceDurationSeconds)
  const candidates = keepRanges.map((range, index): SegmentCandidate => ({
    candidateId: `candidate-real-video-private-review-${index + 1}`,
    candidateType: 'fallback',
    source: 'fallback',
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds,
    text: 'Private review technical range.',
    transcriptSegmentIds: [],
    captionIds: [],
    wordCount: 0,
    evidence: {
      hasTranscript: true,
      hasWordTimestamps: true,
      hasSilence: false,
      hasSceneBoundary: false,
      hasCaption: true,
      fillerLabels: [],
      repeatedTakeCandidateIds: [],
    },
    risks: ['none'],
    protected: index === 0,
    reason: 'Range is used to verify backend-local private review artifact creation against the uploaded private source.',
  }))
  const targetDurationSeconds = round(keepSegments.reduce((sum, segment) => sum + (segment.endSeconds - segment.startSeconds), 0))

  return {
    id: `smart-cut-plan-${input.mediaAssetId}-private-review`,
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
      notes: ['Private internal review artifact only.', 'Public delivery and product-ready acceptance remain blocked.'],
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
        reason: 'Private review boundary; final professional trim acceptance remains a later source-understanding QA gate.',
      },
      {
        boundaryId: `boundary-${segment.decisionId}-end`,
        sourceTimeSeconds: segment.endSeconds,
        adjustedTimeSeconds: segment.endSeconds,
        paddingBeforeSeconds: 0,
        paddingAfterSeconds: 0,
        risks: ['none' as const],
        safe: true,
        reason: 'Private review boundary; final professional trim acceptance remains a later source-understanding QA gate.',
      },
    ]),
    protectedSegments: keepSegments.filter((segment) => segment.protected),
    rejectedCandidates: [],
    meaningFindings: [{
      findingId: 'real-video-private-review-meaning-qa-deferred',
      severity: 'info',
      range: { startSeconds: 0, endSeconds: sourceDurationSeconds },
      code: 'private_review_not_public_final_delivery',
      message: 'Private review verifies internal playback and captioned edit artifact generation; public final delivery remains blocked.',
    }],
    warnings: ['Private review artifact is not accepted as public delivery or product-ready export.'],
    confidence: 0.72,
    qaChecks: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
    requiredQualityGates: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
  }
}

function buildKeepRanges(sourceDurationSeconds: number): Array<{ startSeconds: number; endSeconds: number }> {
  const firstEnd = Math.min(4, sourceDurationSeconds)
  if (sourceDurationSeconds <= 12) return [{ startSeconds: 0, endSeconds: round(sourceDurationSeconds) }]
  const middleStart = clamp(sourceDurationSeconds * 0.45, firstEnd + 2, sourceDurationSeconds - 8)
  const middleEnd = Math.min(middleStart + 4, sourceDurationSeconds - 4)
  const finalStart = Math.max(sourceDurationSeconds - 4, middleEnd + 0.5)
  return [
    { startSeconds: 0, endSeconds: firstEnd },
    { startSeconds: middleStart, endSeconds: middleEnd },
    { startSeconds: finalStart, endSeconds: sourceDurationSeconds },
  ]
    .map((range) => ({ startSeconds: round(range.startSeconds), endSeconds: round(range.endSeconds) }))
    .filter((range) => range.endSeconds - range.startSeconds >= 1)
}

function buildRemoveSegments(keepRanges: Array<{ startSeconds: number; endSeconds: number }>, sourceDurationSeconds: number): SegmentRemoveDecision[] {
  const sorted = [...keepRanges].sort((a, b) => a.startSeconds - b.startSeconds)
  const removals: SegmentRemoveDecision[] = []
  let cursor = 0
  for (const [index, range] of sorted.entries()) {
    if (range.startSeconds - cursor >= 0.5) {
      removals.push({
        decisionId: `remove-real-video-private-review-gap-${index + 1}`,
        candidateId: `candidate-real-video-private-review-gap-${index + 1}`,
        startSeconds: round(cursor),
        endSeconds: round(range.startSeconds),
        score: 0.7,
        confidence: 0.7,
        reason: 'Private review gap for verifying internal trim/concat execution.',
        risks: ['none'],
        futureOnly: true,
      })
    }
    cursor = Math.max(cursor, range.endSeconds)
  }
  if (sourceDurationSeconds - cursor >= 0.5) {
    removals.push({
      decisionId: `remove-real-video-private-review-gap-${sorted.length + 1}`,
      candidateId: `candidate-real-video-private-review-gap-${sorted.length + 1}`,
      startSeconds: round(cursor),
      endSeconds: round(sourceDurationSeconds),
      score: 0.7,
      confidence: 0.7,
      reason: 'Private review tail gap for verifying internal trim/concat execution.',
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
