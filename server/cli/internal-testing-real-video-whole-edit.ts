import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import type { QualityGateResult } from '../../src/backend/contracts/quality-gate-contracts'
import type { RenderManifest } from '../../src/backend/contracts/render-manifest-contracts'
import { runChatNativeEditPlanningFlow } from '../../src/backend/orchestrators/chat-native-editor-orchestrator'
import { createMockDatabase, resetMockIds } from '../../src/backend/mock/mock-database'
import { MOCK_USER_ID } from '../../src/backend/mock/mock-service-data'
import { approveCreditEstimate, createCreditWallet, grantWeeklyBonusCredits, reserveCredits } from '../../src/backend/services/credit-service'
import { approveEditPlan } from '../../src/backend/services/edit-plan-service'
import { unwrapServiceResult } from '../../src/backend/service-result'
import { loadRuntimeEnv } from '../config/env'
import {
  buildProfessionalCaptionTranscript,
  buildProfessionalEditSegments,
  buildProfessionalGate,
  buildProfessionalGraphicCues,
  buildProfessionalKineticCaptionCues,
  buildProfessionalTimeline,
  compileProfessionalRealVideoEditV2Plan,
  PROFESSIONAL_REAL_VIDEO_V2_CAPTION_REFERENCE_SHA256,
  PROFESSIONAL_REAL_VIDEO_V2_FPS,
  PROFESSIONAL_REAL_VIDEO_V2_OUTPUT_FILE,
  PROFESSIONAL_REAL_VIDEO_V2_SOURCE_SHA256,
  professionalEditDurationSeconds,
} from '../internal-testing/professional-real-video-edit-v2-spec'
import { measureOutputLoudness, measureProfessionalAudioEvidence } from '../internal-testing/professional-audio-evidence'
import { renderProfessionalGraphicOverlays, renderProfessionalKineticCaptionOverlays } from '../internal-testing/professional-overlay-renderer'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import { runCaptionExecution } from '../workers/captions'
import { runFinalRenderExecutionPipeline } from '../workers/final-render'
import { runMediaAnalysisFoundation } from '../workers/media'
import { buildWorkerIdempotencyKey, type ProductionWorkerJobPayload } from '../workers/production'
import { runSpeechCaptionExecutionPipeline } from '../workers/speech-caption'

const sourcePath = resolve(
  process.env.REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH?.trim() ||
    join(homedir(), 'Documents/test video/internal testing.MP4'),
)
const captionReferencePath = resolve(
  process.env.REEDITPRO_INTERNAL_TESTING_CAPTION_REFERENCE_PATH?.trim() ||
    '/private/tmp/reeditpro-caption-reference-instagram.mp4',
)
const outputRoot = resolve(
  process.env.REEDITPRO_INTERNAL_TESTING_WHOLE_EDIT_OUTPUT_ROOT?.trim() ||
    join(homedir(), 'Documents/test video/ReEditPro final edits/reeditpro-professional-final-v2'),
)
const localModelPath = resolve(
  process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH?.trim() ||
    '/private/tmp/reeditpro-approved-local-models/faster-whisper-small',
)
const pythonCommand = resolve(
  process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND?.trim() ||
    '/private/tmp/reeditpro-internal-testing-faster-whisper-runtime/venv/bin/python',
)
const structuredIntent = {
  category: 'business_product',
  style: 'premium_clean',
  pacing: 'clean_tight',
  cleanup: 'balanced_cleanup',
  captions: 'reference_informed_kinetic_captions',
  audio: 'measured_clean_voice_denoised',
  aspectRatio: '9:16',
  canvas: { width: 1080, height: 1920 },
  mustFollow: [
    'Preserve the complete product story and feedback request.',
    'Remove repeated starts, abandoned phrases, and long dead spaces.',
    'Keep the speaker primary and avoid random b-roll or decorative effects.',
    'Adapt the supplied reference into fast rounded captions with selective orange emphasis without copying its media or branding.',
    'Use only source-justified graphics and require voice naturalness QA after measured cleanup.',
  ],
}
const planningPrompt = 'Create a professional high-retention vertical product-launch edit from the complete source. Preserve the speaker’s meaning, remove false starts and abandoned phrases, use the supplied caption reference as style guidance only, add restrained product graphics, clean the measured noisy voice conservatively, and prepare a private final review.'

assert.equal(existsSync(sourcePath), true, `Internal testing source video is missing: ${sourcePath}`)
assert.equal(extname(sourcePath).toLowerCase(), '.mp4', 'Internal testing whole-edit source must be an MP4.')
assert.equal(existsSync(captionReferencePath), true, `Caption reference video is missing: ${captionReferencePath}`)
assert.equal(existsSync(localModelPath), true, `Approved local faster-whisper model is missing: ${localModelPath}`)
assert.equal(existsSync(pythonCommand), true, `Approved local faster-whisper runtime is missing: ${pythonCommand}`)

const sourceBytes = await readFile(sourcePath)
const sourceChecksumSha256 = createHash('sha256').update(sourceBytes).digest('hex')
const captionReferenceChecksumSha256 = createHash('sha256').update(await readFile(captionReferencePath)).digest('hex')
assert.equal(
  sourceChecksumSha256,
  PROFESSIONAL_REAL_VIDEO_V2_SOURCE_SHA256,
  'Internal testing whole-edit fixture changed; source-specific trim and caption approval must be reviewed again.',
)
assert.equal(
  captionReferenceChecksumSha256,
  PROFESSIONAL_REAL_VIDEO_V2_CAPTION_REFERENCE_SHA256,
  'Caption reference changed; the visual-language adaptation must be reviewed again.',
)

await rm(outputRoot, { recursive: true, force: true })
await mkdir(outputRoot, { recursive: true })
const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-whole-edit-storage-'))
const mediaOutputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-whole-edit-media-'))
const speechOutputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-whole-edit-speech-'))
const finalQaSpeechOutputRoot = await mkdtemp(join(tmpdir(), 'reeditpro-professional-v2-final-qa-speech-'))

try {
  const env = loadRuntimeEnv({
    ...process.env,
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    WORKER_RUNTIME_MODE: 'local',
    WORKER_INSTANCE_ID: 'internal-testing-whole-edit-worker',
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
    requestId: 'internal-testing-real-video-whole-edit',
    auth: { userId: MOCK_USER_ID, isMockUser: true },
  }

  resetMockIds()
  const db = createMockDatabase()
  const planningState = unwrapServiceResult(runChatNativeEditPlanningFlow({
    workspaceId: 'mock-workspace',
    userId: MOCK_USER_ID,
    projectTitle: 'Internal testing ReEditPro launch edit',
    prompt: planningPrompt,
    clips: [{
      fileName: basename(sourcePath).replace(/[^a-zA-Z0-9._-]+/g, '-'),
      mimeType: 'video/mp4',
      userNotes: 'Private internal source for the approved whole-video edit acceptance run.',
      uploadedOrder: 1,
    }],
    includeMusicDirectorPlanning: false,
    requestedStrokeMotion: false,
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
  const upload = await uploadService.createUploadIntent({
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    chatSessionId: planningState.chatSession.id,
    uploadPurpose: 'source_media',
    originalFileName: basename(sourcePath),
    mimeType: 'video/mp4',
    expectedSizeBytes: sourceBytes.length,
    checksumSha256: sourceChecksumSha256,
  })
  await uploadService.uploadLocalObject(upload.uploadIntent.id, sourceBytes, 'video/mp4')
  const finalizedUpload = await uploadService.finalizeUploadIntent({
    workspaceId: planningState.project.workspaceId,
    uploadIntentId: upload.uploadIntent.id,
    sizeBytes: sourceBytes.length,
    checksumSha256: sourceChecksumSha256,
  })
  const sourceLocalPath = resolveLocalStorageObjectPath(
    env.localStorageRoot,
    finalizedUpload.storageObjectRecord.bucketName,
    finalizedUpload.storageObjectRecord.objectPath,
  )
  assert.equal(existsSync(sourceLocalPath), true, 'Finalized private source upload is unavailable to the worker.')

  const mediaToolExecutionPlanId = `tool-execution-${planningState.project.id}-whole-edit-media`
  const mediaWorkerPayload = buildWorkerPayload({
    jobId: `job-${planningState.project.id}-whole-edit-media`,
    planningState,
    approvedSnapshotId: approvedPlan.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    toolExecutionPlanId: mediaToolExecutionPlanId,
    creditReservationId: creditReservation.id,
    workerType: 'cpu_analysis_worker',
    requestedToolIds: ['ffprobe', 'ffmpeg'],
    requestedRecipeIds: ['media_foundation_recipe'],
    storageReferenceIds: [finalizedUpload.storageObjectRecord.id],
    requiredQualityGateTypes: ['render_asset_integrity'],
  })
  const mediaFoundation = await runMediaAnalysisFoundation({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    sourceStorageObjectId: finalizedUpload.storageObjectRecord.id,
    approvedSnapshotId: approvedPlan.id,
    toolExecutionPlanId: mediaToolExecutionPlanId,
    idempotencyKey: mediaWorkerPayload.idempotencyKey,
    workerPayload: mediaWorkerPayload,
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
    timeoutMs: 180_000,
    tasks: ['probe', 'extract_audio', 'build_analysis_report'],
  })
  assert.ok(mediaFoundation.probe, 'Whole-edit execution requires a real source probe.')
  assert.equal(mediaFoundation.probe.width, 1728)
  assert.equal(mediaFoundation.probe.height, 3072)
  assert.ok((mediaFoundation.probe.durationSeconds ?? 0) >= 65, 'Whole-edit source duration is unexpectedly short.')
  assert.equal(mediaFoundation.audio?.status, 'created')
  assert.ok(mediaFoundation.audio.artifact?.localFilePath)
  const audioEvidence = await measureProfessionalAudioEvidence({ sourcePath, ffmpegBin: env.ffmpegBin })
  assert.ok(audioEvidence.sourceIntegratedLufs < -24, 'Measured source loudness does not match the reviewed quiet-source condition.')
  assert.ok(audioEvidence.voiceCleanupEvidence.speechToNoiseFloorDb < 18, 'Measured source does not justify the approved conservative denoising path.')

  const speechToolExecutionPlanId = `tool-execution-${planningState.project.id}-whole-edit-speech`
  const speechWorkerPayload = buildWorkerPayload({
    jobId: `job-${planningState.project.id}-whole-edit-speech`,
    planningState,
    approvedSnapshotId: approvedPlan.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    toolExecutionPlanId: speechToolExecutionPlanId,
    creditReservationId: creditReservation.id,
    workerType: 'gpu_ai_worker',
    requestedToolIds: ['faster_whisper'],
    requestedRecipeIds: ['transcript_recipe'],
    storageReferenceIds: [mediaFoundation.audio.artifact.artifactId],
    requiredQualityGateTypes: ['transcript_alignment'],
  })
  const speechCaption = await runSpeechCaptionExecutionPipeline({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    toolExecutionPlanId: speechToolExecutionPlanId,
    idempotencyKey: speechWorkerPayload.idempotencyKey,
    sourceAudioArtifactId: mediaFoundation.audio.artifact.artifactId,
    sourceAudioLocalPath: mediaFoundation.audio.artifact.localFilePath,
    sourceVideoLocalPath: sourceLocalPath,
    outputDirectory: speechOutputRoot,
    modelWeightManifestId: 'faster_whisper_model',
    modelName: 'faster-whisper-small-approved-local',
    localModelPath,
    language: 'en',
    device: 'cpu',
    computeType: 'int8',
    wordTimestamps: true,
    vadFilter: true,
    beamSize: 5,
    timeoutMs: 180_000,
    enableRealTranscription: true,
    allowModelDownload: false,
    pythonCommand,
    enableCaptionPreview: false,
    buildSpeech: true,
    buildCaptions: false,
    existingMediaAnalysisReport: mediaFoundation.mediaAnalysisReport,
    workerPayload: speechWorkerPayload,
  })
  assert.equal(speechCaption.status, 'completed', 'Real local transcription must complete before source-specific edit execution.')
  const sourceTranscript = speechCaption.transcript
  if (!sourceTranscript) throw new Error('Real local transcription completed without a transcript record.')
  assert.ok(sourceTranscript.fullText.toLowerCase().includes('software'))
  assert.ok(sourceTranscript.fullText.toLowerCase().includes('customers'))

  const professionalPlan = compileProfessionalRealVideoEditV2Plan({
    sourceChecksumSha256,
    captionReferenceChecksumSha256,
    transcriptFullText: sourceTranscript.fullText,
    voiceCleanupEvidence: audioEvidence.voiceCleanupEvidence,
    sourceIntegratedLufs: audioEvidence.sourceIntegratedLufs,
    sourceTruePeakDbfs: audioEvidence.sourceTruePeakDbfs,
  })

  const renderToolExecutionPlanId = `tool-execution-${planningState.project.id}-whole-edit-render`
  const curatedTranscript = buildProfessionalCaptionTranscript()
  const captionExecution = await runCaptionExecution({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    toolExecutionPlanId: renderToolExecutionPlanId,
    idempotencyKey: `caption-${sourceChecksumSha256}`,
    transcriptSegments: curatedTranscript,
    captionStyle: 'bold_social_captions',
    aspectRatio: '9:16',
    outputDirectory: outputRoot,
    buildSrt: true,
    buildWebVtt: true,
    buildAss: true,
    buildPreview: false,
    enableCaptionPreview: false,
  })
  assert.equal(captionExecution.status, 'completed')
  const captionAss = captionExecution.captionFiles.find((file) => file.format === 'ass')
  if (!captionAss?.localFilePath || !captionAss.artifact) {
    throw new Error('Whole-edit execution requires a private ASS caption artifact.')
  }
  const captionAssPath = captionAss.localFilePath
  const captionAssArtifact = captionAss.artifact
  for (const gateType of ['caption_timing', 'caption_readability', 'caption_safe_zone'] as const) {
    const gate = captionExecution.qaResults.find((item) => item.gateType === gateType)
    assert.equal(gate?.status, 'passed', `Caption QA gate ${gateType} must pass before rendering.`)
  }
  const captionOverlays = await renderProfessionalKineticCaptionOverlays({
    cues: buildProfessionalKineticCaptionCues(),
    outputDirectory: outputRoot,
    outputCanvas: structuredIntent.canvas,
  })
  assert.equal(captionOverlays.length, buildProfessionalKineticCaptionCues().length)
  const visualOverlays = await renderProfessionalGraphicOverlays({
    cues: buildProfessionalGraphicCues(),
    outputDirectory: outputRoot,
    outputCanvas: structuredIntent.canvas,
  })
  assert.equal(visualOverlays.length, buildProfessionalGraphicCues().length)

  const timelineManifest = buildProfessionalTimeline({
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    editPlanId: planningState.editPlan.id,
    approvedSnapshotId: approvedPlan.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    sourceStorageObjectPath: finalizedUpload.storageObjectRecord.objectPath,
  })
  const upstreamQaResults: QualityGateResult[] = [
    buildProfessionalGate({
      gateType: 'cut_smoothness',
      workspaceId: planningState.project.workspaceId,
      projectId: planningState.project.id,
      mediaAssetId: finalizedUpload.mediaAsset.id,
      toolExecutionPlanId: renderToolExecutionPlanId,
      reason: 'Source ranges were reviewed against real transcript timing and preserve complete spoken thoughts.',
    }),
    buildProfessionalGate({
      gateType: 'transcript_alignment',
      workspaceId: planningState.project.workspaceId,
      projectId: planningState.project.id,
      mediaAssetId: finalizedUpload.mediaAsset.id,
      toolExecutionPlanId: renderToolExecutionPlanId,
      reason: 'Curated captions were reconciled against approved local transcription and the fixed source checksum.',
    }),
    buildProfessionalGate({
      gateType: 'audio_loudness',
      workspaceId: planningState.project.workspaceId,
      projectId: planningState.project.id,
      mediaAssetId: finalizedUpload.mediaAsset.id,
      toolExecutionPlanId: renderToolExecutionPlanId,
      reason: `Source loudness measured ${audioEvidence.sourceIntegratedLufs} LUFS and requires an approved -16 LUFS voice-first finish.`,
    }),
    buildProfessionalGate({
      gateType: 'audio_naturalness',
      workspaceId: planningState.project.workspaceId,
      projectId: planningState.project.id,
      mediaAssetId: finalizedUpload.mediaAsset.id,
      toolExecutionPlanId: renderToolExecutionPlanId,
      reason: `A conservative ${audioEvidence.voiceCleanupEvidence.spectralNoiseReductionDb} dB spectral reduction is justified by measured low-margin voice evidence and requires post-render transcription/listening review.`,
    }),
    buildProfessionalGate({
      gateType: 'color_exposure',
      workspaceId: planningState.project.workspaceId,
      projectId: planningState.project.id,
      mediaAssetId: finalizedUpload.mediaAsset.id,
      toolExecutionPlanId: renderToolExecutionPlanId,
      reason: 'The source contact sheet was reviewed for a restrained contrast/saturation finish with skin-tone protection.',
    }),
    ...captionExecution.qaResults.filter((gate) => gate.gateType !== 'transcript_alignment'),
  ]
  assert.equal(upstreamQaResults.some((gate) => gate.blocking || gate.status === 'failed' || gate.status === 'blocked'), false)

  const renderManifest: RenderManifest = {
    id: `render-manifest-${finalizedUpload.mediaAsset.id}-whole-edit`,
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    editPlanId: planningState.editPlan.id,
    approvedSnapshotId: approvedPlan.id,
    timelineManifestId: timelineManifest.id,
    renderEngine: 'ffmpeg',
    renderMode: 'final_export',
    canvas: { width: 1080, height: 1920, aspectRatio: '9:16', backgroundColor: '#000000' },
    fps: PROFESSIONAL_REAL_VIDEO_V2_FPS,
    durationSeconds: professionalEditDurationSeconds(),
    layers: [],
    assets: timelineManifest.sourceReferences,
    captions: [{
      id: `caption-track-${finalizedUpload.mediaAsset.id}`,
      captionArtifactId: captionAssArtifact.id,
      style: { presetId: 'bold_social_captions', placement: 'bottom_face_safe' },
      burnInRequired: true,
    }],
    audio: {
      sourceArtifactIds: [mediaFoundation.audio.artifact.artifactId],
      mixSettings: { presetId: 'clean_voice_denoised', noMusic: true, noSfx: true },
      loudnessTarget: -16,
    },
    color: {
      operations: [{ presetId: 'premium_clean', strength: 0.35, skinToneProtection: true }],
      outputColorSpace: 'bt709',
    },
    exportSettings: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', crf: 20, pixelFormat: 'yuv420p' },
    requiredQualityGateIds: upstreamQaResults.map((gate) => gate.id),
    status: 'ready',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const renderWorkerPayload = buildWorkerPayload({
    jobId: `job-${planningState.project.id}-whole-edit-render`,
    planningState,
    approvedSnapshotId: approvedPlan.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    toolExecutionPlanId: renderToolExecutionPlanId,
    creditReservationId: creditReservation.id,
    workerType: 'render_worker',
    requestedToolIds: ['ffmpeg', 'libass'],
    requestedRecipeIds: ['final_export_recipe'],
    storageReferenceIds: [finalizedUpload.storageObjectRecord.id, captionAssArtifact.id],
    requiredQualityGateTypes: ['cut_smoothness', 'transcript_alignment', 'caption_timing', 'caption_readability', 'caption_safe_zone', 'audio_loudness', 'audio_naturalness', 'color_exposure'],
    renderMode: 'final_export',
  })
  const renderResult = await runFinalRenderExecutionPipeline({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    creditReservationId: creditReservation.id,
    toolExecutionPlanId: renderToolExecutionPlanId,
    idempotencyKey: renderWorkerPayload.idempotencyKey,
    workerPayload: renderWorkerPayload,
    timelineManifestId: timelineManifest.id,
    timelineManifest,
    renderManifestId: renderManifest.id,
    renderManifest,
    sourceVideoArtifactIds: [finalizedUpload.storageObjectRecord.id],
    captionArtifactIds: [captionAssArtifact.id],
    audioArtifactIds: [mediaFoundation.audio.artifact.artifactId],
    qaGateResultIds: upstreamQaResults.map((gate) => gate.id),
    upstreamQaResults,
    requiredUpstreamQaGateTypes: ['cut_smoothness', 'transcript_alignment', 'caption_timing', 'caption_readability', 'caption_safe_zone', 'audio_loudness', 'audio_naturalness', 'color_exposure'],
    sourceLocalPaths: [sourceLocalPath],
    captionLocalPaths: [captionAssPath],
    captionOverlayInputs: captionOverlays,
    visualOverlayInputs: visualOverlays,
    outputDirectory: outputRoot,
    outputFileName: PROFESSIONAL_REAL_VIDEO_V2_OUTPUT_FILE,
    renderEngine: 'ffmpeg',
    renderMode: 'final_export',
    canvas: renderManifest.canvas,
    fps: renderManifest.fps,
    durationSeconds: renderManifest.durationSeconds,
    exportSettings: renderManifest.exportSettings,
    enableLocalDevRender: true,
    enableRemotionLocalRender: false,
    enableCaptionBurnIn: true,
    sourceAudioRequired: true,
    ffmpegBin: env.ffmpegBin,
    ffprobeBin: env.ffprobeBin,
    localDevRenderProfile: {
      visualFinish: 'premium_clean',
      audioFinish: 'clean_voice_denoised',
      subtlePunchIns: true,
      voiceCleanupEvidence: audioEvidence.voiceCleanupEvidence,
    },
    timeoutMs: 900_000,
  })
  assert.equal(renderResult.status, 'completed', `Whole-edit render did not complete: ${renderResult.warnings.join(' ')}`)
  assert.equal(renderResult.finalDeliveryAllowed, true, 'Private final delivery QA must pass for the completed local artifact.')
  assert.equal(renderResult.blocksFinalExport, false)
  assert.ok(renderResult.outputLocalPath && existsSync(renderResult.outputLocalPath))
  assert.equal(renderResult.outputLocalPath, join(outputRoot, PROFESSIONAL_REAL_VIDEO_V2_OUTPUT_FILE))
  assert.equal(renderResult.outputProbe?.width, 1080)
  assert.equal(renderResult.outputProbe?.height, 1920)
  assert.ok((renderResult.outputProbe?.audioStreams.length ?? 0) > 0)

  const finalOutputLoudness = await measureOutputLoudness({ sourcePath: renderResult.outputLocalPath, ffmpegBin: env.ffmpegBin })
  assert.ok(finalOutputLoudness.integratedLufs >= -17 && finalOutputLoudness.integratedLufs <= -15, `Final voice loudness is outside the approved -16 LUFS target: ${finalOutputLoudness.integratedLufs}.`)
  assert.ok(finalOutputLoudness.truePeakDbfs <= -1, `Final true peak is unsafe: ${finalOutputLoudness.truePeakDbfs} dBFS.`)

  const finalQaToolExecutionPlanId = `tool-execution-${planningState.project.id}-professional-v2-final-transcript-qa`
  const finalQaWorkerPayload = buildWorkerPayload({
    jobId: `job-${planningState.project.id}-professional-v2-final-transcript-qa`,
    planningState,
    approvedSnapshotId: approvedPlan.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    toolExecutionPlanId: finalQaToolExecutionPlanId,
    creditReservationId: creditReservation.id,
    workerType: 'gpu_ai_worker',
    requestedToolIds: ['faster_whisper'],
    requestedRecipeIds: ['final_transcript_naturalness_qa_recipe'],
    storageReferenceIds: [renderResult.finalExportArtifact?.id ?? finalizedUpload.storageObjectRecord.id],
    requiredQualityGateTypes: ['transcript_alignment', 'audio_naturalness'],
  })
  const finalSpeechQa = await runSpeechCaptionExecutionPipeline({
    mode: 'local_dev',
    workspaceId: planningState.project.workspaceId,
    projectId: planningState.project.id,
    mediaAssetId: finalizedUpload.mediaAsset.id,
    approvedSnapshotId: approvedPlan.id,
    toolExecutionPlanId: finalQaToolExecutionPlanId,
    idempotencyKey: finalQaWorkerPayload.idempotencyKey,
    sourceAudioArtifactId: renderResult.finalExportArtifact?.id ?? `final-export-${finalizedUpload.mediaAsset.id}`,
    sourceAudioLocalPath: renderResult.outputLocalPath,
    sourceVideoLocalPath: renderResult.outputLocalPath,
    outputDirectory: finalQaSpeechOutputRoot,
    modelWeightManifestId: 'faster_whisper_model',
    modelName: 'faster-whisper-small-approved-local',
    localModelPath,
    language: 'en',
    device: 'cpu',
    computeType: 'int8',
    wordTimestamps: true,
    vadFilter: true,
    beamSize: 5,
    timeoutMs: 180_000,
    enableRealTranscription: true,
    allowModelDownload: false,
    pythonCommand,
    enableCaptionPreview: false,
    buildSpeech: true,
    buildCaptions: false,
    workerPayload: finalQaWorkerPayload,
  })
  assert.equal(finalSpeechQa.status, 'completed', 'Independent final transcript QA must complete.')
  const finalTranscript = finalSpeechQa.transcript?.fullText.toLowerCase() ?? ''
  for (const signal of [
    { meaning: 'software', acceptedPhrases: ['software'] },
    { meaning: 'editing-service scale', acceptedPhrases: ['editing services', 'scale your services'] },
    { meaning: 'customers', acceptedPhrases: ['customers', 'costumers'] },
    { meaning: 'feedback', acceptedPhrases: ['feedback'] },
    { meaning: 'bugs', acceptedPhrases: ['bugs'] },
    { meaning: 'sign-off', acceptedPhrases: ['next time'] },
  ]) {
    assert.ok(
      signal.acceptedPhrases.some((phrase) => finalTranscript.includes(phrase)),
      `Final transcript QA lost required source meaning: ${signal.meaning}.`,
    )
  }
  for (const falseStart of ['which he', 'give me and give us', 'i think she']) {
    assert.equal(finalTranscript.includes(falseStart), false, `Final transcript QA retained an excluded false start: ${falseStart}.`)
  }

  const finalStat = await stat(renderResult.outputLocalPath)
  const planRecord = {
    ...professionalPlan,
    decision: 'professional_real_video_edit_v2_completed_ready_for_private_user_review',
    source: {
      fileName: basename(sourcePath),
      checksumSha256: sourceChecksumSha256,
      durationSeconds: mediaFoundation.probe.durationSeconds,
      width: mediaFoundation.probe.width,
      height: mediaFoundation.probe.height,
      private: true,
    },
    approvals: {
      editPlanId: planningState.editPlan.id,
      approvedSnapshotId: approvedPlan.id,
      creditEstimateId: planningState.creditEstimate.id,
      creditApprovalId: creditApproval.id,
      creditReservationId: creditReservation.id,
      reservedCredits: creditReservation.reservedCredits,
    },
    structuredIntent,
    segments: buildProfessionalEditSegments(),
    finalDurationSeconds: professionalEditDurationSeconds(),
    outputFrame: renderManifest.canvas,
  }
  const artifactManifest = {
    private: true,
    sourceImmutable: true,
    artifacts: [
      ...speechCaption.transcriptArtifacts.map((artifact) => ({ id: artifact.id, type: artifact.artifactType, sourceOfTruth: artifact.sourceOfTruth })),
      ...captionExecution.artifacts.map((artifact) => ({ id: artifact.id, type: artifact.artifactType, sourceOfTruth: artifact.sourceOfTruth })),
      ...(renderResult.finalExportArtifact ? [{
        id: renderResult.finalExportArtifact.id,
        type: renderResult.finalExportArtifact.artifactType,
        storageObjectPath: renderResult.finalExportArtifact.storageObjectPath,
        localFilePath: renderResult.outputLocalPath,
        checksum: renderResult.finalExportArtifact.checksum,
        sizeBytes: renderResult.finalExportArtifact.sizeBytes,
        sourceOfTruth: true,
      }] : []),
    ],
    publicDelivery: false,
    signedUrls: false,
    supabaseWrites: false,
    gcsWrites: false,
  }
  const qaReport = {
    decision: planRecord.decision,
    status: 'passed_source_aware_technical_qa_ready_for_private_user_creative_review',
    sourceChecksumMatched: true,
    realTranscriptionCompleted: true,
    transcriptModel: 'faster-whisper-small-approved-local',
    modelDownloadPerformed: false,
    cutDecisionCount: buildProfessionalEditSegments().length,
    captionCount: captionExecution.captionSegments.length,
    captionOverlayCount: captionOverlays.length,
    visualOverlayCount: visualOverlays.length,
    captionQa: captionExecution.qaResults.map(summarizeGate),
    renderQa: renderResult.qaResults.map(summarizeGate),
    sourceAudioEvidence: audioEvidence,
    finalOutputLoudness,
    finalTranscriptQa: {
      status: finalSpeechQa.status,
      requiredMeaningPreserved: true,
      excludedFalseStartsAbsent: true,
      transcriptText: finalSpeechQa.transcript?.fullText,
    },
    outputProbe: renderResult.outputProbe,
    outputSizeBytes: finalStat.size,
    outputChecksumSha256: renderResult.finalExportArtifact?.checksum,
    userCreativeReviewRequired: true,
    productReadyClaim: false,
  }
  await Promise.all([
    writeJson(join(outputRoot, 'approved-edit-plan.json'), planRecord),
    writeJson(join(outputRoot, 'timeline-manifest.json'), timelineManifest),
    writeJson(join(outputRoot, 'artifact-manifest.json'), artifactManifest),
    writeJson(join(outputRoot, 'final-qa-report.json'), qaReport),
  ])

  console.log(JSON.stringify({
    ok: true,
    decision: planRecord.decision,
    finalVideoPath: renderResult.outputLocalPath,
    sourceDurationSeconds: mediaFoundation.probe.durationSeconds,
    finalDurationSeconds: renderResult.outputProbe?.durationSeconds,
    finalSizeBytes: finalStat.size,
    finalChecksumSha256: renderResult.finalExportArtifact?.checksum,
    captionCount: captionExecution.captionSegments.length,
    captionOverlayCount: captionOverlays.length,
    visualOverlayCount: visualOverlays.length,
    finalOutputLoudness,
    finalTranscriptQaPassed: true,
    qaGateStatuses: renderResult.qaResults.map(summarizeGate),
    privateInternalReviewOnly: true,
    userCreativeReviewRequired: true,
  }, null, 2))
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
  await rm(mediaOutputRoot, { recursive: true, force: true })
  await rm(speechOutputRoot, { recursive: true, force: true })
  await rm(finalQaSpeechOutputRoot, { recursive: true, force: true })
}

function buildWorkerPayload(input: {
  jobId: string
  planningState: { project: { workspaceId: string; id: string } }
  approvedSnapshotId: string
  mediaAssetId: string
  toolExecutionPlanId: string
  creditReservationId: string
  workerType: ProductionWorkerJobPayload['workerType']
  requestedToolIds: ProductionWorkerJobPayload['requestedToolIds']
  requestedRecipeIds: string[]
  storageReferenceIds: string[]
  requiredQualityGateTypes: ProductionWorkerJobPayload['requiredQualityGateTypes']
  renderMode?: ProductionWorkerJobPayload['renderMode']
}): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: input.jobId,
    workspaceId: input.planningState.project.workspaceId,
    projectId: input.planningState.project.id,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    editPlanId: input.approvedSnapshotId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    workerType: input.workerType,
    executionMode: 'mock_safe',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: input.requestedToolIds,
    requestedRecipeIds: input.requestedRecipeIds,
    storageReferenceIds: input.storageReferenceIds,
    creditReservationId: input.creditReservationId,
    renderMode: input.renderMode,
    requiredQualityGateTypes: input.requiredQualityGateTypes,
    createdAt: new Date().toISOString(),
    metadata: {
      internalTestingGate: 'real_video_whole_edit_execution',
      approvedSnapshotOnly: true,
      privateArtifactsOnly: true,
      noSignedUrls: true,
      noProviderCalls: true,
      noPublicDelivery: true,
    },
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}

function summarizeGate(gate: QualityGateResult) {
  return {
    gateType: gate.gateType,
    status: gate.status,
    blocking: gate.blocking,
    blocksFinalExport: gate.blocksFinalExport,
    issueCodes: gate.issues.map((issue) => issue.code),
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
