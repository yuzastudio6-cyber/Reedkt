import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { clearApprovedEditExecutionPrivateDownloadMemoryForSmoke } from '../services/approved-edit-execution-package-service'
import type { ProfessionalEditDecisionManifestClientModel } from '../../src/lib/approved-edit-execution-package-client'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import type {
  ApprovedToolOperationEvidence,
  ApprovedToolWorkManifestRef,
} from '../edit-architecture/approved-tool-work-manifest'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { PlannerInput } from '../../src/types/reeditpro'
import type {
  MediaAssetSmoke,
  PrivateInternalTestRunJsonResponse,
} from './private-internal-test-run-smoke-types'

type AudioToneSample = {
  targetFrequencyHz: number
  targetPower: number
  strongestControlFrequencyHz: number
  strongestControlPower: number
  targetToControlRatio: number
  rms: number
  sampleCount: number
  durationSeconds: number
}

type ApprovedPlanSnapshotRecord = ReturnType<typeof createApprovedPlanSnapshot>

type DecisionManifestToolWorkEvidence = {
  approvedToolWorkManifest?: ApprovedToolWorkManifestRef & {
    status: string
    executableOperationCount: number
    degradedOperationCount: number
    blockedOperationCount: number
  }
  toolOperationEvidence?: ApprovedToolOperationEvidence[]
}

type FinalDeliveryToolWorkEvidence = {
  toolWorkManifestRef?: ApprovedToolWorkManifestRef
  toolOperationEvidence?: ApprovedToolOperationEvidence[]
}

const execFileAsync = promisify(execFile)
const privateUploadRenderableAdapterCount = 2
const audioAdapterToolNames = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
] as const

const localStorageRoot = '/tmp/reeditpro-private-internal-edit-upload-e2e-smoke'
await rm(localStorageRoot, { force: true, recursive: true })

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const sourceFixture = await createSyntheticMp4Fixture({
  localStorageRoot,
  outputPath: join(localStorageRoot, 'fixtures', 'uploaded-source.mp4'),
  durationSeconds: 1,
  width: 160,
  height: 90,
})
assert.equal(sourceFixture.available, true, `Synthetic source upload fixture should be available: ${sourceFixture.warnings.join('; ')}`)
assert.ok(sourceFixture.outputPath, 'Synthetic source upload fixture should expose its local file path.')
assert.ok(sourceFixture.sizeBytes && sourceFixture.sizeBytes > 0, 'Synthetic source upload fixture should contain bytes.')

const sourceAudioFixture = await createSyntheticMp4Fixture({
  localStorageRoot,
  outputPath: join(localStorageRoot, 'fixtures', 'uploaded-source-with-audio.mp4'),
  durationSeconds: 1,
  width: 160,
  height: 90,
  includeAudio: true,
})
assert.equal(sourceAudioFixture.available, true, `Synthetic source upload fixture with audio should be available: ${sourceAudioFixture.warnings.join('; ')}`)
assert.ok(sourceAudioFixture.outputPath, 'Synthetic source upload fixture with audio should expose its local file path.')
assert.ok(sourceAudioFixture.sizeBytes && sourceAudioFixture.sizeBytes > 0, 'Synthetic source upload fixture with audio should contain bytes.')
assert.equal(sourceAudioFixture.hasAudio, true, 'Synthetic source upload fixture with audio should record an audio stream.')

const plannerInput: PlannerInput = {
  projectName: 'Private internal upload e2e edit',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'storytelling',
  workflowType: 'custom_let_ai_decide',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'clean',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Create a clean internal review edit from the uploaded source clip.',
  creditPreference: 'balanced',
  clips: [
    {
      id: 'uploaded-source-clip',
      fileName: 'uploaded-source.mp4',
      duration: '1s',
      detectedType: 'Talking head source',
      notes: 'Uploaded through backend local private storage for e2e smoke.',
      previewLabel: 'Uploaded source clip',
      thumbnailHint: 'Synthetic local private source',
      sourceRole: 'main_story',
      uploadedOrder: 1,
    },
  ],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
}

const plan = createMockEditPlan(plannerInput)

const multiSourcePlannerInput: PlannerInput = {
  ...plannerInput,
  projectName: 'Private internal multi-source upload e2e edit',
  customInstructions: 'Create a clean internal review edit from the two uploaded source clips in the approved source order.',
  clips: [
    {
      id: 'uploaded-source-clip-a',
      fileName: 'uploaded-source-a.mp4',
      duration: '1s',
      detectedType: 'Opening source',
      notes: 'First uploaded private source clip with no audio stream.',
      previewLabel: 'Uploaded source clip A',
      thumbnailHint: 'Synthetic local private source A',
      sourceRole: 'hook_candidate',
      uploadedOrder: 1,
    },
    {
      id: 'uploaded-source-clip-b',
      fileName: 'uploaded-source-b-with-audio.mp4',
      duration: '1s',
      detectedType: 'Main story source with audio',
      notes: 'Second uploaded private source clip with AAC audio for preservation proof.',
      previewLabel: 'Uploaded source clip B',
      thumbnailHint: 'Synthetic local private source B with audio',
      sourceRole: 'main_story',
      uploadedOrder: 2,
    },
  ],
  sourceSequenceMode: 'multi_clip_story_order',
}
const multiSourcePlan = createMockEditPlan(multiSourcePlannerInput)

const app = createReeditProApiApp(env)
const server = await listen(createServer(app))

try {
  const baseUrl = `http://127.0.0.1:${addressPort(server)}`
  const project = await createBackendProject({
    baseUrl,
    workspaceId: 'workspace-private-upload-e2e',
    name: plannerInput.projectName,
    idempotencyKey: 'private-upload-e2e-project',
  })
  const snapshot = createApprovedPlanSnapshot({
    approvedBy: 'mock-user',
    editSessionId: 'edit-session-private-upload-e2e',
    projectId: project.id,
    plan,
  })
  const multiSourceProject = await createBackendProject({
    baseUrl,
    workspaceId: 'workspace-private-upload-e2e-multi-source',
    name: multiSourcePlannerInput.projectName,
    idempotencyKey: 'private-upload-e2e-multi-source-project',
  })
  const multiSourceSnapshot = createApprovedPlanSnapshot({
    approvedBy: 'mock-user',
    editSessionId: 'edit-session-private-upload-e2e-multi-source',
    projectId: multiSourceProject.id,
    plan: multiSourcePlan,
  })
  const sourceBytes = await readFile(sourceFixture.outputPath)
  const sourceAudioBytes = await readFile(sourceAudioFixture.outputPath)
  const sourceAudioMeanVolumeDb = await probeAudioMeanVolume(sourceAudioFixture.outputPath)
  assert.ok(sourceAudioMeanVolumeDb > -70, `Synthetic source audio fixture should be audible, got ${sourceAudioMeanVolumeDb} dB.`)
  const sourceAudioTone = await probeAudioTone(sourceAudioFixture.outputPath)
  assertSourceAudioTone(sourceAudioTone, 'Synthetic source audio fixture')

  const missingProjectUploadIntentResponse = await postJson(
    `${baseUrl}/v1/projects/project-missing-private-upload-e2e/upload-intents`,
    {
      workspaceId: 'workspace-private-upload-e2e',
      uploadPurpose: 'source_media',
      originalFileName: 'missing-project-source.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: sourceBytes.byteLength,
    },
    'private-upload-e2e-missing-project-upload-intent',
  )
  assert.equal(missingProjectUploadIntentResponse.status, 404, 'Upload intent creation should require an owned backend project record.')

  const uploadIntentResponse = await postJson(
    `${baseUrl}/v1/projects/${snapshot.projectId}/upload-intents`,
    {
      workspaceId: 'workspace-private-upload-e2e',
      uploadPurpose: 'source_media',
      originalFileName: 'uploaded-source.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: sourceBytes.byteLength,
    },
    'private-upload-e2e-upload-intent',
  )
  assert.equal(uploadIntentResponse.status, 201, `Upload intent should be created: ${JSON.stringify(uploadIntentResponse.json)}`)
  const uploadIntent = uploadIntentResponse.json.data?.uploadIntent
  const uploadTarget = uploadIntentResponse.json.data?.uploadTarget
  assert.ok(uploadIntent?.id, 'Upload intent response should include an ID.')
  assert.ok(uploadTarget, 'Upload intent response should include an upload target.')
  assert.equal(uploadTarget?.uploadUrl?.includes('/local-object'), true, 'Local backend upload target should use local-object route.')

  const uploaded = await putBinary(resolveBackendUrl(baseUrl, uploadTarget.uploadUrl), sourceBytes, 'video/mp4')
  assert.equal(uploaded.status, 201, `Local object upload should succeed: ${JSON.stringify(uploaded.json)}`)

  const finalizedResponse = await postJson(
    `${baseUrl}/v1/upload-intents/${uploadIntent.id}/finalize`,
    {
      workspaceId: 'workspace-private-upload-e2e',
      sizeBytes: sourceBytes.byteLength,
    },
    'private-upload-e2e-finalize',
  )
  assert.equal(finalizedResponse.status, 201, `Upload finalize should succeed: ${JSON.stringify(finalizedResponse.json)}`)
  const mediaAsset = finalizedResponse.json.data?.mediaAsset
  assert.ok(mediaAsset?.id, 'Finalized upload should include a media asset.')
  assert.equal(mediaAsset.storageProvider, 'local_private', 'Local backend upload should preserve local_private provider metadata.')
  assert.equal(mediaAsset.sourceMetadata?.probeStatus, 'probed', 'Finalized local source upload should include FFprobe metadata.')
  assert.equal(mediaAsset.sourceMetadata?.hasVideo, true, 'Finalized source metadata should confirm a video stream.')
  assert.equal(mediaAsset.sourceMetadata?.hasAudio, false, 'Finalized source metadata should honestly report that this synthetic fixture has no source audio stream.')
  assert.equal(mediaAsset.sourceMetadata?.width, 160, 'Finalized source metadata should include video width.')
  assert.equal(mediaAsset.sourceMetadata?.height, 90, 'Finalized source metadata should include video height.')
  assert.ok((mediaAsset.sourceMetadata?.durationSeconds ?? 0) > 0, 'Finalized source metadata should include positive duration.')
  assert.match(mediaAsset.checksumSha256 ?? '', /^[a-f0-9]{64}$/i, 'Finalized upload should include checksum evidence.')
  assert.equal(
    await countRegularFiles(join(localStorageRoot, 'upload-probes')),
    0,
    'Upload-time local probe staging must remove every staged source byte after FFprobe.',
  )

  const compactSnapshot = {
    id: snapshot.id,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    editPlanVersionId: snapshot.editPlanVersionId,
    creditEstimateId: snapshot.creditEstimateId,
    approvedAt: snapshot.approvedAt,
    approvedBy: snapshot.approvedBy,
    compiledIntent: snapshot.compiledIntent,
    sourceSequence: snapshot.sourceSequence,
    segments: snapshot.segments,
    operations: snapshot.operations,
    rendererLayers: snapshot.rendererLayers,
    masterTimingPlan: snapshot.masterTimingPlan,
    captionVisualCueTimingPlan: snapshot.captionVisualCueTimingPlan,
    sourceCleanupPlan: snapshot.sourceCleanupPlan,
    sourcePlan: {
      goalSummary: snapshot.sourcePlan.goalSummary,
    },
    creditEstimate: snapshot.creditEstimate,
    colorPipelinePlan: snapshot.colorPipelinePlan,
    editingAgentExecutionPlan: snapshot.editingAgentExecutionPlan,
    asyncAssetReconciliationPlan: snapshot.asyncAssetReconciliationPlan,
    agentQAFallbackPlan: snapshot.agentQAFallbackPlan,
    qaPlan: snapshot.qaPlan,
    toolStrategyPlan: snapshot.toolStrategyPlan,
  }

  const privateInternalTestRunResponse = await postJson(
    `${baseUrl}/v1/edit-executions/private-internal-test-runs`,
    {
      workspaceId: 'workspace-private-upload-e2e',
      projectId: snapshot.projectId,
      approvedPlanSnapshotId: snapshot.id,
      approvedSnapshot: compactSnapshot,
      creditReservationId: 'credit-reservation-private-upload-e2e',
      requestedAdapterToolNames: ['d3', 'three', 'sam2'],
      packageReadyToolIds: ['d3', 'three', 'sam2'],
      modelWeightApprovedToolIds: ['sam2'],
      internalTestRunOnly: true,
      sourceMediaAssets: [
        {
          mediaAssetId: mediaAsset.id,
          sourceSequenceItemId: snapshot.sourceSequence[0]?.id,
          uploadedClipId: 'uploaded-source-clip',
          uploadedOrder: 1,
          storageProvider: 'local_private',
          storagePath: mediaAsset.storagePath,
          fileName: mediaAsset.fileName,
          mimeType: mediaAsset.mimeType,
          byteSize: mediaAsset.sizeBytes,
          checksumSha256: mediaAsset.checksumSha256,
          privateArtifact: true,
          publicUrl: null,
          signedUrl: null,
        },
      ],
      processingMode: 'private_internal_review_render',
      maxDurationSeconds: 30,
      targetWidth: 540,
      targetHeight: 960,
      fps: 24,
      reviewerNote: 'Integrated e2e smoke approves the private internal review render for final-render readiness.',
    },
    'private-upload-e2e-private-internal-test-run',
  )
  assert.equal(
    privateInternalTestRunResponse.status,
    503,
    `Legacy caller-authored local execution must stay disabled after upload finalization: ${JSON.stringify(privateInternalTestRunResponse.json)}`,
  )
  if (privateInternalTestRunResponse.status === 503) {
    assert.equal(privateInternalTestRunResponse.json.error?.code, 'TOOL_NOT_READY')
    const details = privateInternalTestRunResponse.json.error?.details
    assert.ok(details && typeof details === 'object')
    assert.equal(
      (details as Record<string, unknown>).requiredGate,
      'canonical_browser_consumption_of_planning_handoff',
    )
    console.log(JSON.stringify({
      ok: true,
      status: 'blocked_by_canonical_browser_consumption_of_planning_handoff',
      checks: [
        'upload_intent_requires_owned_backend_project_record',
        'source_video_uploaded_through_backend_local_upload_intent',
        'finalized_upload_preserves_local_private_storage_provider',
        'finalized_upload_includes_local_ffprobe_source_metadata',
        'local_upload_probe_staging_removed_all_source_bytes',
        'legacy_private_internal_execution_route_fails_closed',
        'no_provider_render_delivery_billing_or_wallet_side_effect',
      ],
      skippedLegacyAssertions: true,
      skippedReason: 'The legacy private internal execution route is intentionally disabled. The authenticated backend canonical planning handoff now verifies finalized uploads and current planning inputs; the browser must consume that handoff without reviving caller-authored execution authority.',
      nextRequiredGate: 'canonical_browser_consumption_of_planning_handoff',
    }))
  } else {
  assert.equal(privateInternalTestRunResponse.status, 201, `Private internal test run should succeed: ${JSON.stringify(privateInternalTestRunResponse.json)}`)
  const internalTestRun = privateInternalTestRunResponse.json.data?.internalTestRun
  assert.ok(internalTestRun, 'Private internal upload run should return an internal test run.')
  assert.equal(internalTestRun?.status, 'private_internal_test_run_completed_ready_for_download')
  const internalTestRunToolWork = internalTestRun as typeof internalTestRun & {
    finalDeliveryQaReview: FinalDeliveryToolWorkEvidence
  }
  const decisionManifestToolWork = internalTestRun.finalRenderArtifact.editDecisionManifest as
    typeof internalTestRun.finalRenderArtifact.editDecisionManifest & DecisionManifestToolWorkEvidence
  const finalDeliveryToolWork = internalTestRunToolWork.finalDeliveryQaReview
  const privateDownloadToolWork = internalTestRun.privateInternalDownloadDelivery as
    typeof internalTestRun.privateInternalDownloadDelivery & FinalDeliveryToolWorkEvidence
  assert.equal(decisionManifestToolWork.approvedToolWorkManifest?.status, 'ready_for_private_internal_preview_with_degraded_plans')
  assert.equal(decisionManifestToolWork.approvedToolWorkManifest?.executableOperationCount, 4)
  assert.ok((decisionManifestToolWork.approvedToolWorkManifest?.degradedOperationCount ?? 0) > 0)
  assert.equal(decisionManifestToolWork.approvedToolWorkManifest?.blockedOperationCount, 0)
  assert.match(decisionManifestToolWork.approvedToolWorkManifest?.manifestId ?? '', /^approved-tool-work-manifest:/)
  assert.equal(finalDeliveryToolWork.toolWorkManifestRef?.manifestId, decisionManifestToolWork.approvedToolWorkManifest?.manifestId)
  assert.equal(privateDownloadToolWork.toolWorkManifestRef?.manifestId, decisionManifestToolWork.approvedToolWorkManifest?.manifestId)
  assertApprovedPrivateToolOperationEvidence(
    decisionManifestToolWork.toolOperationEvidence ?? [],
    ['source_media_private_process', 'processed_media_private_qa_probe', 'final_private_render'],
  )
  assertApprovedPrivateToolOperationEvidence(
    finalDeliveryToolWork.toolOperationEvidence ?? [],
    ['source_media_private_process', 'processed_media_private_qa_probe', 'final_private_render', 'final_delivery_private_qa_probe'],
  )
  assert.deepEqual(privateDownloadToolWork.toolOperationEvidence, finalDeliveryToolWork.toolOperationEvidence)
  assert.equal(internalTestRun?.sourceMediaAssetCount, 1)
  assert.equal(internalTestRun?.privateInternalDownloadDelivery?.privateInternalDownloadReady, true)
  assert.equal(internalTestRun?.privateInternalDownloadDelivery?.professionalEditQaSummary?.privateInternalQaReady, true)
  assert.equal(internalTestRun?.privateInternalDownloadDelivery?.professionalEditQaSummary?.visualPolishApplied, true)
  assert.equal(internalTestRun?.privateInternalDownloadDelivery?.professionalEditQaSummary?.audioPolishApplied, true)
  assert.equal(internalTestRun?.privateInternalDownloadDelivery?.professionalEditQaSummary?.fullColorPipelineExecuted, false)
  assert.equal(internalTestRun?.privateInternalDownloadDelivery?.professionalEditQaSummary?.editDecisionManifestReady, true)
  assert.equal(internalTestRun?.privateInternalDownloadDelivery?.professionalEditQaSummary?.editDecisionManifestArtifactReady, true)
  assert.equal(internalTestRun?.publicDeliveryReady, false)
  assert.equal(internalTestRun?.externalBetaReady, false)
  assert.equal(internalTestRun?.productionReady, false)
  assert.equal(
    internalTestRun?.adapterGateSummary?.privateRenderIntegrationStatus,
    'backend_adapter_worker_artifacts_integrated_for_private_render',
    JSON.stringify(internalTestRun?.adapterGateSummary, null, 2),
  )
  assert.equal(internalTestRun?.adapterGateSummary?.privateRenderIntegrationReady, true)
  assert.equal(internalTestRun?.adapterGateSummary?.privateRenderIntegratedActivityCount, privateUploadRenderableAdapterCount)
  assert.equal(internalTestRun?.adapterGateSummary?.backendIntegrationCandidateCount, privateUploadRenderableAdapterCount)
  assert.equal(
    internalTestRun?.adapterGateSummary?.backendIntegrationPendingActivityCount,
    (internalTestRun?.adapterGateSummary?.resolvedActivityCount ?? 0) - privateUploadRenderableAdapterCount,
  )
  assert.ok(
    (internalTestRun?.adapterGateSummary?.backendIntegrationPendingActivityCount ?? 0) > 0,
    'Non-integrated advanced/model-backed adapters should remain pending until their backend evidence is supplied.',
  )
  assert.equal(internalTestRun?.adapterGateSummary?.backendIntegrationBlockedActivityCount, 0)
  assert.deepEqual(internalTestRun?.adapterGateSummary?.backendIntegrationBlockers ?? [], [])
  assert.match(internalTestRun?.stageIds?.adapterIntegrationPackageRecordId ?? '', /^approved_edit_execution_package_/, 'Private upload run should create a scoped adapter integration package.')
  assert.match(internalTestRun?.stageIds?.adapterSourceTruthReviewId ?? '', /^professional-tool-adapter-source-truth-review-/, 'Private upload run should record adapter source-truth review evidence.')
  assert.match(internalTestRun?.stageIds?.adapterBoundedExecutionRunId ?? '', /^bounded-adapter-execution-run-/, 'Private upload run should create a scoped bounded adapter handoff.')
  assert.match(internalTestRun?.stageIds?.adapterRegisteredRunnerRunId ?? '', /^registered-runner-run-/, 'Private upload run should record visual adapter import-probe readiness.')
  assert.match(internalTestRun?.stageIds?.adapterPrivateMediaRunnerRunId ?? '', /^private-media-runner-run-/, 'Private upload run should create private adapter runner manifests for visual tools.')
  assert.match(internalTestRun?.stageIds?.adapterPrivateMediaRunnerQaReviewId ?? '', /^registered_adapter_private_runner_qa_review_/, 'Private upload run should QA private adapter runner manifests.')
  assert.match(internalTestRun?.stageIds?.adapterWorkerArtifactIntegrationId ?? '', /^adapter_worker_artifact_integration_/, 'Private upload run should attach private adapter QA evidence into render preview.')
  assert.equal(internalTestRun?.finalRenderArtifact.commandSummary.mode, 'overlay_then_concat_with_audio_polish')
  assert.ok((internalTestRun?.finalRenderArtifact.commandSummary.reviewOverlayCount ?? 0) > 0, 'Private final render should include approved review overlays.')
  assert.ok((internalTestRun?.finalRenderArtifact.commandSummary.approvedCaptionOverlayCount ?? 0) > 0, 'Private final render should include approved caption timing overlays.')
  assert.ok((internalTestRun?.finalRenderArtifact.commandSummary.approvedTransitionPolishCount ?? 0) > 0, 'Private final render should include approved transition polish.')
  assert.ok((internalTestRun?.finalRenderArtifact.commandSummary.approvedVisualPolishCount ?? 0) > 0, 'Private final render should include approved visual polish.')
  assert.equal(internalTestRun?.finalRenderArtifact.commandSummary.visualPolish?.applied, true)
  assert.equal(internalTestRun?.finalRenderArtifact.commandSummary.visualPolish?.source, 'approved_color_pipeline_private_render')
  assert.equal(internalTestRun?.finalRenderArtifact.commandSummary.visualPolish?.toolId, 'ffmpeg')
  assert.equal(internalTestRun?.finalRenderArtifact.commandSummary.visualPolish?.fullColorPipelineExecuted, false)
  assert.ok(internalTestRun?.finalRenderArtifact.commandSummary.visualPolish?.filterChain.some((filter: string) => /eq=contrast=/.test(filter)), 'Private final render should apply bounded approved visual polish filters.')
  assert.ok((internalTestRun?.finalRenderArtifact.commandSummary.approvedFinalTimingCount ?? 0) > 0, 'Private final render should include approved final timeline timing.')
  assert.ok((internalTestRun?.finalRenderArtifact.commandSummary.approvedFinalTimelineDurationSeconds ?? 0) > 0, 'Private final render should record approved final timeline duration.')
  assert.equal(internalTestRun?.finalRenderArtifact.commandSummary.privateCaptionArtifactCount, 3)
  assert.deepEqual(new Set(internalTestRun?.finalRenderArtifact.commandSummary.privateCaptionFormats), new Set(['srt', 'webvtt', 'ass']))
  assert.equal(internalTestRun?.finalRenderArtifact.commandSummary.privateCaptionSource, 'approved_caption_timing_private_caption_files')
  assert.equal(internalTestRun?.finalRenderArtifact.commandSummary.audioPolish?.applied, true)
  assert.equal(internalTestRun?.finalRenderArtifact.commandSummary.audioPolish?.source, 'private_final_render_voice_first_loudness')
  assert.ok(internalTestRun?.finalRenderArtifact.commandSummary.audioPolish?.filterChain.some((filter: string) => /loudnorm=I=-16:TP=-1\.5:LRA=11/.test(filter)), 'Private final render should include voice-first loudness normalization.')
  assert.ok(internalTestRun?.finalRenderArtifact.commandSummary.audioPolish?.filterChain.some((filter: string) => /alimiter=limit=0\.95/.test(filter)), 'Private final render should include final limiting.')
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.manifestVersion, 'private-internal-edit-decision-manifest-v1')
  assert.equal(
    internalTestRun?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration?.adapterWorkerArtifactIntegrationId,
    internalTestRun?.stageIds?.adapterWorkerArtifactIntegrationId,
  )
  assert.equal(
    internalTestRun?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration?.privateMediaRunnerQaReviewId,
    internalTestRun?.stageIds?.adapterPrivateMediaRunnerQaReviewId,
  )
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration?.artifactCount, privateUploadRenderableAdapterCount)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration?.mediaProcessingExecuted, false)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration?.productRuntimeExecuted, false)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.source, 'approved_plan_snapshot')
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.projectId, snapshot.projectId)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.editSessionId, snapshot.editSessionId)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.goalSummary, snapshot.compiledIntent?.goalSummary)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.aspectRatioConfirmed, true)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.sourceOrderConfirmed, true)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.cleanupPreferenceConfirmed, true)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.timingBaseConfirmed, true)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.professionalBaseline, true)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext?.creditEstimateTotalCredits, snapshot.creditEstimate.total_credits)
  assert.equal(/https?:\/\/|\/tmp\/|localFilePath|api[_-]?key|service[_-]?role|token|secret|password/i.test(JSON.stringify(internalTestRun?.finalRenderArtifact.editDecisionManifest?.approvedEditContext)), false)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.clipDecisionCount, internalTestRun?.finalRenderArtifact.commandSummary.inputCount)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.privateCaptionPackage.artifactCount, 3)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.audioQaIntegration?.attached, true)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.audioQaIntegration?.source, 'private_uploaded_audio_execution')
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.audioQaIntegration?.reviewCount, internalTestRun?.finalRenderArtifact.editDecisionManifest?.clipDecisionCount)
  assert.ok((internalTestRun?.finalRenderArtifact.editDecisionManifest?.audioQaIntegration?.qaGateCount ?? 0) >= 1)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.audioQaIntegration?.finalMuxAllowed, false)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.audioQaIntegration?.productRuntimeExecuted, false)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.audioQaIntegration?.publicArtifact, false)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.audioQaIntegration?.signedUrl, null)
  const uploadedSourceOrderTrace = internalTestRun?.finalRenderArtifact.editDecisionManifest?.uploadedSourceOrderTrace
  assert.equal(uploadedSourceOrderTrace?.source, 'uploaded_media_source_order')
  assert.equal(uploadedSourceOrderTrace?.sourceOrderPreserved, true)
  assert.equal(uploadedSourceOrderTrace?.sourceMediaCoverageComplete, true)
  assert.equal(uploadedSourceOrderTrace?.uploadedOrderMonotonic, true)
  assert.equal(uploadedSourceOrderTrace?.sourceMediaAssetIds.length, internalTestRun?.finalRenderArtifact.editDecisionManifest?.clipDecisionCount)
  assert.equal(uploadedSourceOrderTrace?.uploadedOrders.length, internalTestRun?.finalRenderArtifact.editDecisionManifest?.clipDecisionCount)
  assert.ok(uploadedSourceOrderTrace?.sourceMediaAssetIds.every((sourceMediaAssetId: string) => sourceMediaAssetId === mediaAsset.id))
  assert.ok(uploadedSourceOrderTrace?.uploadedOrders.every((uploadedOrder: number) => uploadedOrder === 1))
  assert.equal(uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId?.[mediaAsset.id], mediaAsset.checksumSha256)
  assert.ok(internalTestRun.finalRenderArtifact.editDecisionManifest.decisions.every((decision) => decision.sourceChecksumSha256 === mediaAsset.checksumSha256))
  assert.ok(internalTestRun.finalRenderArtifact.editDecisionManifest.decisions.every((decision) =>
    decision.processedArtifact?.storageProvider === 'local_private' &&
    decision.processedArtifact?.processingMode === 'private_internal_review_render' &&
    decision.processedArtifact?.mimeType === 'video/mp4' &&
    /^[a-f0-9]{64}$/i.test(decision.processedArtifact?.sha256 ?? '') &&
    decision.processedArtifact?.byteSize > 0 &&
    decision.processedArtifact?.durationSeconds > 0 &&
    decision.processedArtifact?.privateArtifact === true &&
    decision.processedArtifact?.publicArtifact === false &&
    decision.processedArtifact?.signedUrl === null
  ), 'Private internal run manifest should prove each processed private artifact.')
  assert.ok(internalTestRun.finalRenderArtifact.editDecisionManifest.decisions.every((decision) =>
    decision.audioExecutionReview?.attached === true &&
    decision.audioExecutionReview?.finalMuxAllowed === false &&
    decision.audioExecutionReview?.productRuntimeExecuted === false &&
    decision.audioExecutionReview?.publicArtifact === false &&
    decision.audioExecutionReview?.signedUrl === null
  ), 'Private internal run manifest should attach private audio QA evidence without final mux/product claims.')
  assert.equal(uploadedSourceOrderTrace?.uniqueSourceMediaAssetCount, 1)
  assert.equal(uploadedSourceOrderTrace?.uniqueUploadedOrderCount, 1)
  assert.deepEqual(uploadedSourceOrderTrace?.firstAppearanceSourceMediaAssetIds, [mediaAsset.id])
  assert.deepEqual(uploadedSourceOrderTrace?.firstAppearanceUploadedOrders, [1])
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.blockedRuntimeScopes.publicArtifactCreated, false)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifest?.blockedRuntimeScopes.signedUrlCreated, false)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifestArtifact?.manifestVersion, 'private-internal-edit-decision-manifest-v1')
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifestArtifact?.privateArtifact, true)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifestArtifact?.publicArtifact, false)
  assert.equal(internalTestRun?.finalRenderArtifact.editDecisionManifestArtifact?.signedUrl, null)

  clearApprovedEditExecutionPrivateDownloadMemoryForSmoke()
  const privateDownload = await fetchBinary(`${baseUrl}${internalTestRun.privateInternalDownloadPath}`)
  assert.equal(privateDownload.status, 200, 'Private internal download should stream after memory is cleared by reloading the private delivery registry.')
  assert.match(privateDownload.headers.get('content-type') ?? '', /^video\/mp4\b/i)
  assert.equal(privateDownload.bytes.byteLength, internalTestRun.finalRenderArtifact.byteSize)
  assert.ok(privateDownload.bytes.byteLength > 0, 'Private internal download should contain bytes.')
  const privateManifest = await fetchBinary(`${baseUrl}${internalTestRun.privateInternalManifestPath}`)
  assert.equal(privateManifest.status, 200, 'Private internal edit decision manifest should stream after memory is cleared by reloading the private delivery registry.')
  assert.match(privateManifest.headers.get('content-type') ?? '', /^application\/json\b/i)
  assert.equal(privateManifest.bytes.byteLength, internalTestRun.finalRenderArtifact.editDecisionManifestArtifact.byteSize)
  assert.equal(createHash('sha256').update(privateManifest.bytes).digest('hex'), internalTestRun.finalRenderArtifact.editDecisionManifestArtifact.sha256)
  const downloadedManifest = JSON.parse(
    Buffer.from(privateManifest.bytes).toString('utf8'),
  ) as ProfessionalEditDecisionManifestClientModel
  assert.equal(downloadedManifest.manifestVersion, 'private-internal-edit-decision-manifest-v1')
  assert.equal(downloadedManifest.finalRenderArtifactId, internalTestRun.finalRenderArtifact.artifactId)
  assert.equal(downloadedManifest.adapterQaIntegration?.adapterWorkerArtifactIntegrationId, internalTestRun.stageIds.adapterWorkerArtifactIntegrationId)
  assert.equal(downloadedManifest.adapterQaIntegration?.privateMediaRunnerQaReviewId, internalTestRun.stageIds.adapterPrivateMediaRunnerQaReviewId)
  assert.equal(downloadedManifest.adapterQaIntegration?.artifactCount, privateUploadRenderableAdapterCount)
  assert.equal(downloadedManifest.adapterQaIntegration?.mediaProcessingExecuted, false)
  assert.equal(downloadedManifest.adapterQaIntegration?.productRuntimeExecuted, false)
  assert.deepEqual(downloadedManifest.audioQaIntegration, internalTestRun.finalRenderArtifact.editDecisionManifest.audioQaIntegration)
  assert.deepEqual(downloadedManifest.approvedEditContext, internalTestRun.finalRenderArtifact.editDecisionManifest.approvedEditContext)
  assert.equal(downloadedManifest.uploadedSourceOrderTrace?.source, 'uploaded_media_source_order')
  assert.equal(downloadedManifest.uploadedSourceOrderTrace?.sourceOrderPreserved, true)
  assert.equal(downloadedManifest.uploadedSourceOrderTrace?.sourceMediaCoverageComplete, true)
  assert.equal(downloadedManifest.uploadedSourceOrderTrace?.uploadedOrderMonotonic, true)
  assert.equal(downloadedManifest.uploadedSourceOrderTrace?.sourceMediaAssetIds.length, downloadedManifest.clipDecisionCount)
  assert.equal(downloadedManifest.uploadedSourceOrderTrace?.uploadedOrders.length, downloadedManifest.clipDecisionCount)
  assert.ok(downloadedManifest.uploadedSourceOrderTrace?.sourceMediaAssetIds.every((sourceMediaAssetId: string) => sourceMediaAssetId === mediaAsset.id))
  assert.ok(downloadedManifest.uploadedSourceOrderTrace?.uploadedOrders.every((uploadedOrder: number) => uploadedOrder === 1))
  assert.equal(downloadedManifest.uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId?.[mediaAsset.id], mediaAsset.checksumSha256)
  assert.ok(downloadedManifest.decisions.every((decision) => decision.sourceChecksumSha256 === mediaAsset.checksumSha256))
  assert.ok(downloadedManifest.decisions.every((decision) =>
    decision.processedArtifact?.storageProvider === 'local_private' &&
    decision.processedArtifact?.processingMode === 'private_internal_review_render' &&
    decision.processedArtifact?.mimeType === 'video/mp4' &&
    /^[a-f0-9]{64}$/i.test(decision.processedArtifact?.sha256 ?? '') &&
    decision.processedArtifact?.byteSize > 0 &&
    decision.processedArtifact?.durationSeconds > 0 &&
    decision.processedArtifact?.privateArtifact === true &&
    decision.processedArtifact?.publicArtifact === false &&
    decision.processedArtifact?.signedUrl === null
  ), 'Downloaded private manifest should preserve processed private artifact proof.')
  assert.ok(downloadedManifest.decisions.every((decision) =>
    decision.audioExecutionReview?.attached === true &&
    decision.audioExecutionReview?.finalMuxAllowed === false &&
    decision.audioExecutionReview?.productRuntimeExecuted === false
  ), 'Downloaded private manifest should preserve private audio QA evidence.')
  assert.deepEqual(downloadedManifest.uploadedSourceOrderTrace?.firstAppearanceSourceMediaAssetIds, [mediaAsset.id])
  assert.deepEqual(downloadedManifest.uploadedSourceOrderTrace?.firstAppearanceUploadedOrders, [1])
  const finalRenderProbe = await probeMedia(internalTestRun.finalRenderArtifact.localFilePath)
  assert.equal(finalRenderProbe.video?.width, 540, 'Private final render should use the requested target width.')
  assert.equal(finalRenderProbe.video?.height, 960, 'Private final render should use the requested target height.')
  assert.equal(finalRenderProbe.hasAudio, true, 'Private final render should include a normalized audio stream, using silence when source media has no audio.')
  assert.ok(
    Math.abs((finalRenderProbe.video?.durationSeconds ?? 0) - internalTestRun.finalRenderArtifact.commandSummary.approvedFinalTimelineDurationSeconds) < 1,
    'Private final render duration should track the approved final timeline duration.',
  )

  let mixedMultiSourcePrivateDownloadByteCount = 0
  let mixedMultiSourcePrivateManifestByteCount = 0
  let mixedMultiSourcePrivateFinalMeanVolumeDb = Number.NEGATIVE_INFINITY
  let mixedMultiSourcePrivateFinalAudioTone: AudioToneSample | null = null
  const multiSourceMediaAssetA = await uploadLocalSourceMedia({
    baseUrl,
    projectId: multiSourceSnapshot.projectId,
    workspaceId: 'workspace-private-upload-e2e-multi-source',
    originalFileName: 'uploaded-source-a.mp4',
    bytes: sourceBytes,
    idempotencyPrefix: 'private-upload-e2e-multi-source-a',
  })
  const multiSourceMediaAssetB = await uploadLocalSourceMedia({
    baseUrl,
    projectId: multiSourceSnapshot.projectId,
    workspaceId: 'workspace-private-upload-e2e-multi-source',
    originalFileName: 'uploaded-source-b-with-audio.mp4',
    bytes: sourceAudioBytes,
    idempotencyPrefix: 'private-upload-e2e-multi-source-b',
  })
  assert.equal(multiSourceMediaAssetA.sourceMetadata?.hasVideo, true, 'Multi-source first finalized source should include video metadata.')
  assert.equal(multiSourceMediaAssetA.sourceMetadata?.hasAudio, false, 'Multi-source first finalized source should honestly record no audio stream.')
  assert.equal(multiSourceMediaAssetB.sourceMetadata?.hasVideo, true, 'Multi-source second finalized source should include video metadata.')
  assert.equal(multiSourceMediaAssetB.sourceMetadata?.hasAudio, true, 'Multi-source second finalized source should include audio metadata.')
  assert.equal(multiSourceMediaAssetB.sourceMetadata?.audioCodec, 'aac', 'Multi-source second finalized source should preserve AAC source audio evidence.')

  const compactMultiSourceSnapshot = createCompactSnapshot(multiSourceSnapshot)
  const multiSourcePrivateInternalResponse = await postJson(
    `${baseUrl}/v1/edit-executions/private-internal-test-runs`,
    {
      workspaceId: 'workspace-private-upload-e2e-multi-source',
      projectId: multiSourceSnapshot.projectId,
      approvedPlanSnapshotId: multiSourceSnapshot.id,
      approvedSnapshot: compactMultiSourceSnapshot,
      creditReservationId: 'credit-reservation-private-upload-e2e-multi-source',
      requestedAdapterToolNames: ['d3', 'three'],
      packageReadyToolIds: ['d3', 'three'],
      modelWeightApprovedToolIds: [],
      internalTestRunOnly: true,
      sourceMediaAssets: [
        {
          mediaAssetId: multiSourceMediaAssetA.id,
          sourceSequenceItemId: multiSourceSnapshot.sourceSequence[0]?.id,
          uploadedClipId: 'uploaded-source-clip-a',
          uploadedOrder: 1,
          storageProvider: 'local_private',
          storagePath: multiSourceMediaAssetA.storagePath,
          fileName: multiSourceMediaAssetA.fileName,
          mimeType: multiSourceMediaAssetA.mimeType,
          byteSize: multiSourceMediaAssetA.sizeBytes,
          checksumSha256: multiSourceMediaAssetA.checksumSha256,
          privateArtifact: true,
          publicUrl: null,
          signedUrl: null,
        },
        {
          mediaAssetId: multiSourceMediaAssetB.id,
          sourceSequenceItemId: multiSourceSnapshot.sourceSequence[1]?.id,
          uploadedClipId: 'uploaded-source-clip-b',
          uploadedOrder: 2,
          storageProvider: 'local_private',
          storagePath: multiSourceMediaAssetB.storagePath,
          fileName: multiSourceMediaAssetB.fileName,
          mimeType: multiSourceMediaAssetB.mimeType,
          byteSize: multiSourceMediaAssetB.sizeBytes,
          checksumSha256: multiSourceMediaAssetB.checksumSha256,
          privateArtifact: true,
          publicUrl: null,
          signedUrl: null,
        },
      ],
      processingMode: 'private_internal_review_render',
      maxDurationSeconds: 30,
      targetWidth: 540,
      targetHeight: 960,
      fps: 24,
      reviewerNote: 'Integrated e2e smoke approves the ordered multi-source private internal review render for final-render readiness.',
    },
    'private-upload-e2e-multi-source-private-internal-test-run',
  )
  assert.equal(multiSourcePrivateInternalResponse.status, 201, `Multi-source private internal test run should succeed: ${JSON.stringify(multiSourcePrivateInternalResponse.json)}`)
  const multiSourceInternalTestRun = multiSourcePrivateInternalResponse.json.data?.internalTestRun
  assert.ok(multiSourceInternalTestRun, 'Multi-source private run should return an internal test run.')
  assert.equal(multiSourceInternalTestRun?.status, 'private_internal_test_run_completed_ready_for_download')
  assert.equal(multiSourceInternalTestRun?.sourceMediaAssetCount, 2)
  assert.equal(multiSourceInternalTestRun?.adapterGateSummary?.privateRenderIntegrationStatus, 'backend_adapter_worker_artifacts_integrated_for_private_render')
  assert.equal(multiSourceInternalTestRun?.adapterGateSummary?.privateRenderIntegratedActivityCount, 2)
  assert.equal(multiSourceInternalTestRun?.adapterGateSummary?.backendIntegrationCandidateCount, 2)
  assert.equal(multiSourceInternalTestRun?.adapterGateSummary?.backendIntegrationBlockedActivityCount, 0)
  assert.deepEqual(multiSourceInternalTestRun?.adapterGateSummary?.backendIntegrationBlockers ?? [], [])
  assert.equal(multiSourceInternalTestRun?.publicDeliveryReady, false)
  assert.equal(multiSourceInternalTestRun?.externalBetaReady, false)
  assert.equal(multiSourceInternalTestRun?.productionReady, false)
  assert.equal(multiSourceInternalTestRun?.nextRequiredGate, 'external_beta_or_production_release_gates')
  const multiSourceTrace = multiSourceInternalTestRun?.finalRenderArtifact.editDecisionManifest?.uploadedSourceOrderTrace
  assert.equal(multiSourceTrace?.source, 'uploaded_media_source_order')
  assert.equal(multiSourceTrace?.sourceOrderPreserved, true)
  assert.equal(multiSourceTrace?.sourceMediaCoverageComplete, true)
  assert.equal(
    multiSourceTrace?.uploadedOrderMonotonic,
    false,
    'Approved multi-source story edits may reuse earlier sources after first appearance; first-appearance order is the preservation contract.',
  )
  assert.equal(multiSourceTrace?.uniqueSourceMediaAssetCount, 2)
  assert.equal(multiSourceTrace?.uniqueUploadedOrderCount, 2)
  assert.deepEqual(multiSourceTrace?.firstAppearanceSourceMediaAssetIds, [multiSourceMediaAssetA.id, multiSourceMediaAssetB.id])
  assert.deepEqual(multiSourceTrace?.firstAppearanceUploadedOrders, [1, 2])
  assert.equal(multiSourceTrace?.sourceChecksumSha256ByMediaAssetId?.[multiSourceMediaAssetA.id], multiSourceMediaAssetA.checksumSha256)
  assert.equal(multiSourceTrace?.sourceChecksumSha256ByMediaAssetId?.[multiSourceMediaAssetB.id], multiSourceMediaAssetB.checksumSha256)
  assert.ok(
    multiSourceInternalTestRun.finalRenderArtifact.editDecisionManifest.decisions.some((decision) =>
      decision.sourceMediaAssetId === multiSourceMediaAssetA.id &&
      decision.sourceChecksumSha256 === multiSourceMediaAssetA.checksumSha256),
    'Multi-source manifest should include a private render decision for the first uploaded source.',
  )
  assert.ok(
    multiSourceInternalTestRun.finalRenderArtifact.editDecisionManifest.decisions.some((decision) =>
      decision.sourceMediaAssetId === multiSourceMediaAssetB.id &&
      decision.sourceChecksumSha256 === multiSourceMediaAssetB.checksumSha256),
    'Multi-source manifest should include a private render decision for the second uploaded source.',
  )
  assert.equal(multiSourceInternalTestRun?.finalRenderArtifact.editDecisionManifest?.blockedRuntimeScopes.publicArtifactCreated, false)
  assert.equal(multiSourceInternalTestRun?.finalRenderArtifact.editDecisionManifest?.blockedRuntimeScopes.signedUrlCreated, false)
  mixedMultiSourcePrivateFinalMeanVolumeDb = await probeAudioMeanVolume(multiSourceInternalTestRun.finalRenderArtifact.localFilePath)
  assert.ok(
    mixedMultiSourcePrivateFinalMeanVolumeDb > -70,
    `Multi-source private final render should preserve audible source audio from the ordered audio clip, got ${mixedMultiSourcePrivateFinalMeanVolumeDb} dB.`,
  )
  mixedMultiSourcePrivateFinalAudioTone = await probeAudioTone(multiSourceInternalTestRun.finalRenderArtifact.localFilePath)
  assertSourceAudioTone(mixedMultiSourcePrivateFinalAudioTone, 'Multi-source private final render')

  clearApprovedEditExecutionPrivateDownloadMemoryForSmoke()
  const mixedMultiSourcePrivateDownload = await fetchBinary(`${baseUrl}${multiSourceInternalTestRun.privateInternalDownloadPath}`)
  assert.equal(mixedMultiSourcePrivateDownload.status, 200, 'Multi-source private internal download should stream after registry reload.')
  assert.match(mixedMultiSourcePrivateDownload.headers.get('content-type') ?? '', /^video\/mp4\b/i)
  assert.equal(mixedMultiSourcePrivateDownload.bytes.byteLength, multiSourceInternalTestRun.finalRenderArtifact.byteSize)
  mixedMultiSourcePrivateDownloadByteCount = mixedMultiSourcePrivateDownload.bytes.byteLength

  const mixedMultiSourcePrivateManifest = await fetchBinary(`${baseUrl}${multiSourceInternalTestRun.privateInternalManifestPath}`)
  assert.equal(mixedMultiSourcePrivateManifest.status, 200, 'Multi-source private manifest should stream after registry reload.')
  assert.match(mixedMultiSourcePrivateManifest.headers.get('content-type') ?? '', /^application\/json\b/i)
  assert.equal(createHash('sha256').update(mixedMultiSourcePrivateManifest.bytes).digest('hex'), multiSourceInternalTestRun.finalRenderArtifact.editDecisionManifestArtifact.sha256)
  mixedMultiSourcePrivateManifestByteCount = mixedMultiSourcePrivateManifest.bytes.byteLength
  const mixedMultiSourceDownloadedManifest = JSON.parse(Buffer.from(mixedMultiSourcePrivateManifest.bytes).toString('utf8'))
  assert.equal(mixedMultiSourceDownloadedManifest.uploadedSourceOrderTrace?.source, 'uploaded_media_source_order')
  assert.equal(mixedMultiSourceDownloadedManifest.uploadedSourceOrderTrace?.sourceOrderPreserved, true)
  assert.equal(mixedMultiSourceDownloadedManifest.uploadedSourceOrderTrace?.sourceMediaCoverageComplete, true)
  assert.equal(mixedMultiSourceDownloadedManifest.uploadedSourceOrderTrace?.uploadedOrderMonotonic, false)
  assert.deepEqual(mixedMultiSourceDownloadedManifest.uploadedSourceOrderTrace?.firstAppearanceSourceMediaAssetIds, [multiSourceMediaAssetA.id, multiSourceMediaAssetB.id])
  assert.deepEqual(mixedMultiSourceDownloadedManifest.uploadedSourceOrderTrace?.firstAppearanceUploadedOrders, [1, 2])
  assert.equal(mixedMultiSourceDownloadedManifest.uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId?.[multiSourceMediaAssetA.id], multiSourceMediaAssetA.checksumSha256)
  assert.equal(mixedMultiSourceDownloadedManifest.uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId?.[multiSourceMediaAssetB.id], multiSourceMediaAssetB.checksumSha256)

  let hydratedAudioPrivateDownloadByteCount = 0
  let hydratedAudioPrivateManifestByteCount = 0
  let hydratedAudioPrivateFinalMeanVolumeDb = Number.NEGATIVE_INFINITY
  let hydratedAudioPrivateFinalAudioTone: AudioToneSample | null = null
  const hydratedPythonRuntime = await createStubHydratedPythonRuntime([
    'librosa',
    'audioread',
    'pydub',
    'scipy',
    'resampy',
    'pyloudnorm',
    'audioflux',
    'music21',
    'pretty_midi',
    'mido',
    'noisereduce',
    'pedalboard',
    'mir_eval',
  ])
  const hydratedAudioLocalStorageRoot = '/tmp/reeditpro-private-internal-edit-upload-e2e-audio-adapter-smoke'
  await rm(hydratedAudioLocalStorageRoot, { force: true, recursive: true })

  try {
    const hydratedAudioEnv = loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      API_PORT: '8788',
      STORAGE_MODE: 'local',
      LOCAL_STORAGE_ROOT: hydratedAudioLocalStorageRoot,
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      TOOL_ADAPTER_PYTHON_BIN: hydratedPythonRuntime.wrapperPath,
    })
    const hydratedAudioApp = createReeditProApiApp(hydratedAudioEnv)
    const hydratedAudioServer = await listen(createServer(hydratedAudioApp))

    try {
      const hydratedAudioBaseUrl = `http://127.0.0.1:${addressPort(hydratedAudioServer)}`
      const hydratedAudioProject = await createBackendProject({
        baseUrl: hydratedAudioBaseUrl,
        workspaceId: 'workspace-private-upload-e2e-hydrated-audio',
        name: 'Private internal hydrated audio adapter upload e2e edit',
        idempotencyKey: 'private-upload-e2e-hydrated-audio-project',
      })
      const hydratedAudioSnapshot = createApprovedPlanSnapshot({
        approvedBy: 'mock-user',
        editSessionId: 'edit-session-private-upload-e2e-hydrated-audio',
        projectId: hydratedAudioProject.id,
        plan,
      })
      const compactHydratedAudioSnapshot = createCompactSnapshot(hydratedAudioSnapshot)
      const hydratedAudioUploadIntentResponse = await postJson(
        `${hydratedAudioBaseUrl}/v1/projects/${hydratedAudioSnapshot.projectId}/upload-intents`,
        {
          workspaceId: 'workspace-private-upload-e2e-hydrated-audio',
          uploadPurpose: 'source_media',
          originalFileName: 'uploaded-source-audio-adapter.mp4',
          mimeType: 'video/mp4',
          expectedSizeBytes: sourceAudioBytes.byteLength,
        },
        'private-upload-e2e-hydrated-audio-upload-intent',
      )
      assert.equal(hydratedAudioUploadIntentResponse.status, 201, `Hydrated audio upload intent should be created: ${JSON.stringify(hydratedAudioUploadIntentResponse.json)}`)
      const hydratedAudioUploadIntent = hydratedAudioUploadIntentResponse.json.data?.uploadIntent
      const hydratedAudioUploadTarget = hydratedAudioUploadIntentResponse.json.data?.uploadTarget
      assert.ok(hydratedAudioUploadIntent?.id, 'Hydrated audio upload intent response should include an ID.')
      assert.ok(hydratedAudioUploadTarget, 'Hydrated audio upload intent should include an upload target.')
      assert.equal(hydratedAudioUploadTarget?.uploadUrl?.includes('/local-object'), true, 'Hydrated audio local upload target should use local-object route.')

      const hydratedAudioUploaded = await putBinary(resolveBackendUrl(hydratedAudioBaseUrl, hydratedAudioUploadTarget.uploadUrl), sourceAudioBytes, 'video/mp4')
      assert.equal(hydratedAudioUploaded.status, 201, `Hydrated audio local object upload should succeed: ${JSON.stringify(hydratedAudioUploaded.json)}`)

      const hydratedAudioFinalizedResponse = await postJson(
        `${hydratedAudioBaseUrl}/v1/upload-intents/${hydratedAudioUploadIntent.id}/finalize`,
        {
          workspaceId: 'workspace-private-upload-e2e-hydrated-audio',
          sizeBytes: sourceAudioBytes.byteLength,
        },
        'private-upload-e2e-hydrated-audio-finalize',
      )
      assert.equal(hydratedAudioFinalizedResponse.status, 201, `Hydrated audio upload finalize should succeed: ${JSON.stringify(hydratedAudioFinalizedResponse.json)}`)
      const hydratedAudioMediaAsset = hydratedAudioFinalizedResponse.json.data?.mediaAsset
      assert.ok(hydratedAudioMediaAsset?.id, 'Hydrated audio finalized upload should include a media asset.')
      assert.equal(hydratedAudioMediaAsset.storageProvider, 'local_private')
      assert.equal(hydratedAudioMediaAsset.sourceMetadata?.probeStatus, 'probed', 'Hydrated audio finalized source should include FFprobe metadata.')
      assert.equal(hydratedAudioMediaAsset.sourceMetadata?.hasVideo, true, 'Hydrated audio finalized source metadata should confirm video.')
      assert.equal(hydratedAudioMediaAsset.sourceMetadata?.hasAudio, true, 'Hydrated audio finalized source metadata should confirm source audio.')
      assert.equal(hydratedAudioMediaAsset.sourceMetadata?.audioCodec, 'aac', 'Hydrated audio finalized source metadata should preserve AAC test audio evidence.')
      assert.match(hydratedAudioMediaAsset.checksumSha256 ?? '', /^[a-f0-9]{64}$/i, 'Hydrated audio finalized upload should include checksum evidence.')

      const hydratedAudioPrivateInternalResponse = await postJson(
        `${hydratedAudioBaseUrl}/v1/edit-executions/private-internal-test-runs`,
        {
          workspaceId: 'workspace-private-upload-e2e-hydrated-audio',
          projectId: hydratedAudioSnapshot.projectId,
          approvedPlanSnapshotId: hydratedAudioSnapshot.id,
          approvedSnapshot: compactHydratedAudioSnapshot,
          creditReservationId: 'credit-reservation-private-upload-e2e-hydrated-audio',
          requestedAdapterToolNames: [...audioAdapterToolNames],
          packageReadyToolIds: [...audioAdapterToolNames],
          modelWeightApprovedToolIds: [],
          internalTestRunOnly: true,
          sourceMediaAssets: [
            {
              mediaAssetId: hydratedAudioMediaAsset.id,
              sourceSequenceItemId: hydratedAudioSnapshot.sourceSequence[0]?.id,
              uploadedClipId: 'uploaded-source-clip',
              uploadedOrder: 1,
              storageProvider: 'local_private',
              storagePath: hydratedAudioMediaAsset.storagePath,
              fileName: hydratedAudioMediaAsset.fileName,
              mimeType: hydratedAudioMediaAsset.mimeType,
              byteSize: hydratedAudioMediaAsset.sizeBytes,
              checksumSha256: hydratedAudioMediaAsset.checksumSha256,
              privateArtifact: true,
              publicUrl: null,
              signedUrl: null,
            },
          ],
          processingMode: 'private_internal_review_render',
          maxDurationSeconds: 30,
          targetWidth: 540,
          targetHeight: 960,
          fps: 24,
          reviewerNote: 'Integrated e2e smoke approves hydrated audio adapter private internal review only.',
        },
        'private-upload-e2e-hydrated-audio-private-internal-test-run',
      )
      assert.equal(hydratedAudioPrivateInternalResponse.status, 201, `Hydrated audio private internal test run should succeed: ${JSON.stringify(hydratedAudioPrivateInternalResponse.json)}`)
      const hydratedAudioInternalTestRun = hydratedAudioPrivateInternalResponse.json.data?.internalTestRun
      assert.ok(hydratedAudioInternalTestRun, 'Hydrated audio run should return an internal test run.')
      assert.equal(hydratedAudioInternalTestRun?.status, 'private_internal_test_run_completed_ready_for_download')
      assert.equal(hydratedAudioInternalTestRun?.adapterGateSummary?.privateRenderIntegrationStatus, 'backend_adapter_worker_artifacts_integrated_for_private_render')
      assert.equal(hydratedAudioInternalTestRun?.adapterGateSummary?.privateRenderIntegratedActivityCount, audioAdapterToolNames.length)
      assert.equal(hydratedAudioInternalTestRun?.adapterGateSummary?.backendIntegrationCandidateCount, audioAdapterToolNames.length)
      assert.equal(
        hydratedAudioInternalTestRun?.adapterGateSummary?.backendIntegrationPendingActivityCount,
        (hydratedAudioInternalTestRun?.adapterGateSummary?.resolvedActivityCount ?? 0) - audioAdapterToolNames.length,
      )
      assert.ok(
        (hydratedAudioInternalTestRun?.adapterGateSummary?.backendIntegrationPendingActivityCount ?? 0) > 0,
        'Hydrated audio evidence should not imply unrelated visual/model adapter evidence is integrated.',
      )
      assert.equal(hydratedAudioInternalTestRun?.adapterGateSummary?.backendIntegrationBlockedActivityCount, 0)
      assert.deepEqual(hydratedAudioInternalTestRun?.adapterGateSummary?.backendIntegrationBlockers ?? [], [])
      assert.equal(hydratedAudioInternalTestRun?.adapterGateSummary?.toolsExecutedCount, audioAdapterToolNames.length)
      assert.equal(hydratedAudioInternalTestRun?.adapterGateSummary?.frontendExecutionAllowed, false)
      assert.equal(hydratedAudioInternalTestRun?.adapterGateSummary?.productReady, false)
      assert.equal(hydratedAudioInternalTestRun?.nextRequiredGate, 'external_beta_or_production_release_gates')
      assert.equal(hydratedAudioInternalTestRun?.publicDeliveryReady, false)
      assert.equal(hydratedAudioInternalTestRun?.externalBetaReady, false)
      assert.equal(hydratedAudioInternalTestRun?.productionReady, false)
      assert.equal(hydratedAudioInternalTestRun?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration?.artifactCount, audioAdapterToolNames.length)
      assert.equal(hydratedAudioInternalTestRun?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration?.mediaProcessingExecuted, false)
      assert.equal(hydratedAudioInternalTestRun?.finalRenderArtifact.editDecisionManifest?.adapterQaIntegration?.productRuntimeExecuted, false)
      assert.equal(hydratedAudioInternalTestRun?.finalRenderArtifact.editDecisionManifest?.uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId?.[hydratedAudioMediaAsset.id], hydratedAudioMediaAsset.checksumSha256)
      hydratedAudioPrivateFinalMeanVolumeDb = await probeAudioMeanVolume(hydratedAudioInternalTestRun.finalRenderArtifact.localFilePath)
      assert.ok(
        hydratedAudioPrivateFinalMeanVolumeDb > -70,
        `Hydrated audio private final render should preserve audible source audio after loudness polish, got ${hydratedAudioPrivateFinalMeanVolumeDb} dB.`,
      )
      hydratedAudioPrivateFinalAudioTone = await probeAudioTone(hydratedAudioInternalTestRun.finalRenderArtifact.localFilePath)
      assertSourceAudioTone(hydratedAudioPrivateFinalAudioTone, 'Hydrated audio private final render')

      clearApprovedEditExecutionPrivateDownloadMemoryForSmoke()
      const hydratedAudioPrivateDownload = await fetchBinary(`${hydratedAudioBaseUrl}${hydratedAudioInternalTestRun.privateInternalDownloadPath}`)
      assert.equal(hydratedAudioPrivateDownload.status, 200, 'Hydrated audio private internal download should stream after registry reload.')
      assert.match(hydratedAudioPrivateDownload.headers.get('content-type') ?? '', /^video\/mp4\b/i)
      assert.equal(hydratedAudioPrivateDownload.bytes.byteLength, hydratedAudioInternalTestRun.finalRenderArtifact.byteSize)
      hydratedAudioPrivateDownloadByteCount = hydratedAudioPrivateDownload.bytes.byteLength

      const hydratedAudioPrivateManifest = await fetchBinary(`${hydratedAudioBaseUrl}${hydratedAudioInternalTestRun.privateInternalManifestPath}`)
      assert.equal(hydratedAudioPrivateManifest.status, 200, 'Hydrated audio private manifest should stream after registry reload.')
      assert.match(hydratedAudioPrivateManifest.headers.get('content-type') ?? '', /^application\/json\b/i)
      assert.equal(createHash('sha256').update(hydratedAudioPrivateManifest.bytes).digest('hex'), hydratedAudioInternalTestRun.finalRenderArtifact.editDecisionManifestArtifact.sha256)
      hydratedAudioPrivateManifestByteCount = hydratedAudioPrivateManifest.bytes.byteLength
      const hydratedAudioDownloadedManifest = JSON.parse(Buffer.from(hydratedAudioPrivateManifest.bytes).toString('utf8'))
      assert.equal(hydratedAudioDownloadedManifest.adapterQaIntegration?.artifactCount, audioAdapterToolNames.length)
      assert.equal(hydratedAudioDownloadedManifest.adapterQaIntegration?.mediaProcessingExecuted, false)
      assert.equal(hydratedAudioDownloadedManifest.adapterQaIntegration?.productRuntimeExecuted, false)
      assert.equal(hydratedAudioDownloadedManifest.uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId?.[hydratedAudioMediaAsset.id], hydratedAudioMediaAsset.checksumSha256)
    } finally {
      await close(hydratedAudioServer)
    }
  } finally {
    await hydratedPythonRuntime.cleanup()
    await rm(hydratedAudioLocalStorageRoot, { force: true, recursive: true })
  }

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'upload_intent_requires_owned_backend_project_record',
      'source_video_uploaded_through_backend_local_upload_intent',
      'finalized_upload_preserves_local_private_storage_provider',
      'finalized_upload_includes_local_ffprobe_source_metadata',
      'finalized_upload_private_source_object_route_is_no_store_and_checksum_verified',
      'approved_private_internal_test_run_consumes_uploaded_source_media',
      'approved_private_internal_test_run_integrates_visual_adapter_private_qa_evidence',
      'bounded_local_media_processing_created_private_review_output',
      'private_final_render_attaches_professional_edit_decision_manifest',
      'private_final_render_persists_professional_edit_decision_manifest_artifact',
      'private_final_render_preserves_uploaded_source_order_trace',
      'private_final_render_preserves_uploaded_source_checksum_trace',
      'approved_segment_metadata_review_overlays_burned_into_private_render',
      'approved_caption_timing_overlays_burned_into_private_render',
      'approved_caption_timing_private_files_attached_to_render_handoff',
      'approved_transition_timing_polish_applied_to_private_render',
      'approved_color_pipeline_visual_polish_applied_to_private_render',
      'approved_master_timing_final_ranges_applied_to_private_render',
      'voice_first_audio_loudness_polish_applied_to_private_render',
      'final_delivery_qa_professional_edit_summary_ready',
      'private_final_render_has_requested_frame_and_audio_stream',
      'private_internal_download_streams_mp4_bytes',
      'private_internal_download_streams_edit_decision_manifest',
      'private_internal_download_delivery_registry_survives_cleared_in_memory_delivery_maps',
      'downloaded_manifest_preserves_uploaded_source_order_trace',
      'downloaded_manifest_preserves_uploaded_source_checksum_trace',
      'mixed_multi_source_private_internal_upload_run_completed',
      'mixed_multi_source_first_appearance_order_preserved_with_approved_segment_reuse',
      'mixed_multi_source_manifest_preserves_source_checksums',
      'mixed_multi_source_private_render_preserves_audible_source_audio',
      'mixed_multi_source_private_render_preserves_uploaded_source_audio_tone',
      'mixed_multi_source_private_download_and_manifest_streamed',
      'hydrated_audio_adapter_private_internal_upload_run_completed',
      'hydrated_audio_adapter_private_render_preserves_uploaded_source_audio_tone',
      'hydrated_audio_adapter_private_internal_download_streamed',
      'hydrated_audio_adapter_private_manifest_preserved_trace',
      'public_beta_production_and_billing_remain_blocked',
    ],
    uploadedByteCount: sourceBytes.byteLength,
    privateDownloadByteCount: privateDownload.bytes.byteLength,
    privateManifestByteCount: privateManifest.bytes.byteLength,
    mixedMultiSourceUploadedByteCount: sourceBytes.byteLength + sourceAudioBytes.byteLength,
    mixedMultiSourcePrivateFinalMeanVolumeDb,
    mixedMultiSourcePrivateDownloadByteCount,
    mixedMultiSourcePrivateManifestByteCount,
    hydratedAudioAdapterCount: audioAdapterToolNames.length,
    uploadedAudioByteCount: sourceAudioBytes.byteLength,
    sourceAudioMeanVolumeDb,
    sourceAudioTone: formatAudioToneSample(sourceAudioTone),
    mixedMultiSourcePrivateFinalAudioTone: formatAudioToneSample(mixedMultiSourcePrivateFinalAudioTone),
    hydratedAudioPrivateFinalMeanVolumeDb,
    hydratedAudioPrivateFinalAudioTone: formatAudioToneSample(hydratedAudioPrivateFinalAudioTone),
    hydratedAudioPrivateDownloadByteCount,
    hydratedAudioPrivateManifestByteCount,
    nextRequiredGate: internalTestRun.nextRequiredGate,
  }))
  }
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await rm(localStorageRoot, { force: true, recursive: true })
}

function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

function addressPort(server: Server): number {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected server to listen on a TCP port.')
  return address.port
}

async function probeMedia(localFilePath: string): Promise<{
  video?: { width: number; height: number; durationSeconds?: number }
  hasAudio: boolean
}> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_streams',
    localFilePath,
  ], {
    timeout: 15_000,
    windowsHide: true,
    maxBuffer: 512 * 1024,
  })
  const parsed = JSON.parse(stdout) as {
    streams?: Array<{ codec_type?: string; width?: number; height?: number; duration?: string | number }>
  }
  const video = parsed.streams?.find((stream) => stream.codec_type === 'video')
  const durationSeconds = Number(video?.duration)
  return {
    video: video && typeof video.width === 'number' && typeof video.height === 'number'
      ? {
          width: video.width,
          height: video.height,
          durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : undefined,
        }
      : undefined,
    hasAudio: Boolean(parsed.streams?.some((stream) => stream.codec_type === 'audio')),
  }
}

async function probeAudioMeanVolume(localFilePath: string): Promise<number> {
  const { stderr } = await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i',
    localFilePath,
    '-vn',
    '-af',
    'volumedetect',
    '-f',
    'null',
    '-',
  ], {
    timeout: 15_000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  })
  const match = /mean_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/i.exec(stderr)
  if (!match) throw new Error(`Unable to parse audio mean volume for ${localFilePath}`)
  return match[1]?.toLowerCase() === '-inf' ? Number.NEGATIVE_INFINITY : Number(match[1])
}

async function probeAudioTone(localFilePath: string): Promise<AudioToneSample> {
  const sampleRate = 48_000
  const { stdout } = await execFileAsync('ffmpeg', [
    '-v',
    'error',
    '-i',
    localFilePath,
    '-vn',
    '-ac',
    '1',
    '-ar',
    String(sampleRate),
    '-t',
    '20',
    '-f',
    'f32le',
    'pipe:1',
  ], {
    timeout: 20_000,
    windowsHide: true,
    encoding: 'buffer',
    maxBuffer: 8 * 1024 * 1024,
  }) as { stdout: Buffer | string }
  const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout, 'binary')
  assert.ok(buffer.byteLength >= 4, `Unable to decode audio PCM for ${localFilePath}.`)

  const sampleCount = Math.floor(buffer.byteLength / 4)
  const samples = new Float64Array(sampleCount)
  let energy = 0
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = buffer.readFloatLE(index * 4)
    samples[index] = sample
    energy += sample * sample
  }

  const targetFrequencyHz = 440
  const controlFrequencies = [220, 330, 660, 880, 1320]
  const targetPower = goertzelPower(samples, sampleRate, targetFrequencyHz)
  const controlPowers = controlFrequencies.map((frequencyHz) => ({
    frequencyHz,
    power: goertzelPower(samples, sampleRate, frequencyHz),
  }))
  const strongestControl = controlPowers.reduce((strongest, candidate) =>
    candidate.power > strongest.power ? candidate : strongest, controlPowers[0])
  const strongestControlPower = strongestControl?.power ?? 0

  return {
    targetFrequencyHz,
    targetPower,
    strongestControlFrequencyHz: strongestControl?.frequencyHz ?? 0,
    strongestControlPower,
    targetToControlRatio: targetPower / Math.max(strongestControlPower, 1e-12),
    rms: Math.sqrt(energy / Math.max(sampleCount, 1)),
    sampleCount,
    durationSeconds: sampleCount / sampleRate,
  }
}

function assertSourceAudioTone(sample: AudioToneSample, label: string) {
  assert.ok(sample.sampleCount >= 4_800, `${label} should expose enough decoded source-audio samples, got ${formatAudioToneSample(sample)}.`)
  assert.ok(sample.rms > 0.0005, `${label} should preserve audible source-audio energy, got ${formatAudioToneSample(sample)}.`)
  assert.ok(sample.targetPower > 1e-5, `${label} should preserve measurable 440Hz source-audio power, got ${formatAudioToneSample(sample)}.`)
  assert.ok(
    sample.targetToControlRatio >= 3,
    `${label} should preserve the uploaded 440Hz source-audio identity, got ${formatAudioToneSample(sample)}.`,
  )
}

function goertzelPower(samples: Float64Array, sampleRate: number, frequencyHz: number): number {
  const normalizedFrequency = frequencyHz / sampleRate
  const coefficient = 2 * Math.cos(2 * Math.PI * normalizedFrequency)
  let previous = 0
  let previous2 = 0
  for (let index = 0; index < samples.length; index += 1) {
    const current = samples[index] + coefficient * previous - previous2
    previous2 = previous
    previous = current
  }
  return (previous2 * previous2 + previous * previous - coefficient * previous * previous2) / Math.max(samples.length * samples.length, 1)
}

function formatAudioToneSample(sample: AudioToneSample | null): string | null {
  if (!sample) return null
  return `${sample.durationSeconds.toFixed(3)}s samples=${sample.sampleCount} rms=${sample.rms.toFixed(5)} ${sample.targetFrequencyHz}HzPower=${sample.targetPower.toExponential(4)} control=${sample.strongestControlFrequencyHz}Hz:${sample.strongestControlPower.toExponential(4)} ratio=${sample.targetToControlRatio.toFixed(2)}`
}

function createCompactSnapshot(snapshotRecord: ApprovedPlanSnapshotRecord) {
  return {
    id: snapshotRecord.id,
    projectId: snapshotRecord.projectId,
    editSessionId: snapshotRecord.editSessionId,
    editPlanVersionId: snapshotRecord.editPlanVersionId,
    creditEstimateId: snapshotRecord.creditEstimateId,
    approvedAt: snapshotRecord.approvedAt,
    approvedBy: snapshotRecord.approvedBy,
    compiledIntent: snapshotRecord.compiledIntent,
    sourceSequence: snapshotRecord.sourceSequence,
    segments: snapshotRecord.segments,
    operations: snapshotRecord.operations,
    rendererLayers: snapshotRecord.rendererLayers,
    masterTimingPlan: snapshotRecord.masterTimingPlan,
    captionVisualCueTimingPlan: snapshotRecord.captionVisualCueTimingPlan,
    sourceCleanupPlan: snapshotRecord.sourceCleanupPlan,
    sourcePlan: {
      goalSummary: snapshotRecord.sourcePlan.goalSummary,
    },
    creditEstimate: snapshotRecord.creditEstimate,
    colorPipelinePlan: snapshotRecord.colorPipelinePlan,
    editingAgentExecutionPlan: snapshotRecord.editingAgentExecutionPlan,
    asyncAssetReconciliationPlan: snapshotRecord.asyncAssetReconciliationPlan,
    agentQAFallbackPlan: snapshotRecord.agentQAFallbackPlan,
    qaPlan: snapshotRecord.qaPlan,
    toolStrategyPlan: snapshotRecord.toolStrategyPlan,
  }
}

async function uploadLocalSourceMedia(input: {
  baseUrl: string
  projectId: string
  workspaceId: string
  originalFileName: string
  bytes: Buffer
  idempotencyPrefix: string
}): Promise<MediaAssetSmoke> {
  const uploadIntentResponse = await postJson(
    `${input.baseUrl}/v1/projects/${input.projectId}/upload-intents`,
    {
      workspaceId: input.workspaceId,
      uploadPurpose: 'source_media',
      originalFileName: input.originalFileName,
      mimeType: 'video/mp4',
      expectedSizeBytes: input.bytes.byteLength,
    },
    `${input.idempotencyPrefix}-upload-intent`,
  )
  assert.equal(uploadIntentResponse.status, 201, `Upload intent should be created for ${input.originalFileName}: ${JSON.stringify(uploadIntentResponse.json)}`)
  const uploadIntent = uploadIntentResponse.json.data?.uploadIntent
  const uploadTarget = uploadIntentResponse.json.data?.uploadTarget
  assert.ok(uploadIntent?.id, `Upload intent response should include an ID for ${input.originalFileName}.`)
  assert.ok(uploadTarget, `Upload intent response should include an upload target for ${input.originalFileName}.`)
  assert.equal(uploadTarget?.uploadUrl?.includes('/local-object'), true, `Local upload target should use local-object route for ${input.originalFileName}.`)

  const uploaded = await putBinary(resolveBackendUrl(input.baseUrl, uploadTarget.uploadUrl), input.bytes, 'video/mp4')
  assert.equal(uploaded.status, 201, `Local object upload should succeed for ${input.originalFileName}: ${JSON.stringify(uploaded.json)}`)

  const finalizedResponse = await postJson(
    `${input.baseUrl}/v1/upload-intents/${uploadIntent.id}/finalize`,
    {
      workspaceId: input.workspaceId,
      sizeBytes: input.bytes.byteLength,
    },
    `${input.idempotencyPrefix}-finalize`,
  )
  assert.equal(finalizedResponse.status, 201, `Upload finalize should succeed for ${input.originalFileName}: ${JSON.stringify(finalizedResponse.json)}`)
  const mediaAsset = finalizedResponse.json.data?.mediaAsset
  const storageObjectRecord = finalizedResponse.json.data?.storageObjectRecord
  assert.ok(mediaAsset?.id, `Finalized upload should include a media asset for ${input.originalFileName}.`)
  assert.ok(storageObjectRecord?.id, `Finalized upload should include a storage object record for ${input.originalFileName}.`)
  assert.equal(mediaAsset.storageProvider, 'local_private', `Finalized upload should preserve local_private storage for ${input.originalFileName}.`)
  assert.equal(mediaAsset.sourceMetadata?.probeStatus, 'probed', `Finalized upload should include FFprobe source metadata for ${input.originalFileName}.`)
  assert.match(mediaAsset.checksumSha256 ?? '', /^[a-f0-9]{64}$/i, `Finalized upload should include checksum evidence for ${input.originalFileName}.`)
  const privateSourceObjectRoute = `/v1/storage-objects/${storageObjectRecord.id}/local-object?workspaceId=${encodeURIComponent(input.workspaceId)}`
  const privateSourceObjectResponse = await fetchBinary(resolveBackendUrl(input.baseUrl, privateSourceObjectRoute))
  assert.equal(privateSourceObjectResponse.status, 200, `Private source object route should stream ${input.originalFileName}.`)
  assert.equal(privateSourceObjectResponse.headers.get('cache-control'), 'no-store', `Private source object route should disable caching for ${input.originalFileName}.`)
  assert.match(privateSourceObjectResponse.headers.get('content-disposition') ?? '', /^attachment\b/i, `Private source object route should use attachment disposition for ${input.originalFileName}.`)
  assert.equal(privateSourceObjectResponse.headers.get('x-content-type-options'), 'nosniff', `Private source object route should disable MIME sniffing for ${input.originalFileName}.`)
  assert.match(privateSourceObjectResponse.headers.get('content-type') ?? '', /^video\/mp4\b/i, `Private source object route should preserve MP4 content type for ${input.originalFileName}.`)
  assert.equal(Number(privateSourceObjectResponse.headers.get('content-length')), input.bytes.byteLength, `Private source object route should return content length for ${input.originalFileName}.`)
  assert.equal(privateSourceObjectResponse.bytes.byteLength, input.bytes.byteLength, `Private source object route should stream the uploaded bytes for ${input.originalFileName}.`)
  assert.equal(createHash('sha256').update(privateSourceObjectResponse.bytes).digest('hex'), mediaAsset.checksumSha256, `Private source object stream should match finalized checksum for ${input.originalFileName}.`)
  return mediaAsset
}

async function createBackendProject(input: {
  baseUrl: string
  workspaceId: string
  name: string
  idempotencyKey: string
}): Promise<{ id: string; workspaceId: string; name: string }> {
  const response = await postJson(
    `${input.baseUrl}/v1/projects`,
    {
      workspaceId: input.workspaceId,
      name: input.name,
    },
    input.idempotencyKey,
  )
  assert.equal(response.status, 201, `Backend project should be created before source upload: ${JSON.stringify(response.json)}`)
  const project = response.json.data?.project
  assert.ok(project, 'Backend project creation should return the created project.')
  assert.match(project?.id ?? '', /^project_[0-9a-f-]+$/, 'Backend project should include a generated project id.')
  assert.equal(project?.workspaceId, input.workspaceId, 'Backend project should preserve the upload workspace.')
  assert.equal(project?.name, input.name, 'Backend project should preserve the upload project name.')
  return project
}

async function postJson(
  url: string,
  body: unknown,
  idempotencyKey: string,
): Promise<{ status: number; json: PrivateInternalTestRunJsonResponse }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })
  return {
    status: response.status,
    json: await response.json() as PrivateInternalTestRunJsonResponse,
  }
}

async function putBinary(url: string, body: Buffer, contentType: string): Promise<{ status: number; json: PrivateInternalTestRunJsonResponse }> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': contentType,
    },
    body: body as unknown as BodyInit,
  })
  return { status: response.status, json: await response.json() as PrivateInternalTestRunJsonResponse }
}

async function fetchBinary(url: string): Promise<{ status: number; bytes: Uint8Array; headers: Headers }> {
  const response = await fetch(url)
  return {
    status: response.status,
    bytes: new Uint8Array(await response.arrayBuffer()),
    headers: response.headers,
  }
}

function assertApprovedPrivateToolOperationEvidence(
  evidence: ApprovedToolOperationEvidence[],
  requiredOperationKinds: string[],
): void {
  assert.ok(
    evidence.length >= requiredOperationKinds.length,
    `Expected at least ${requiredOperationKinds.length} approved private tool-operation evidence records.`,
  )

  for (const operationKind of requiredOperationKinds) {
    assert.ok(
      evidence.some((record) => record.operationId.endsWith(`:${operationKind}`)),
      `Expected approved private tool-operation evidence for ${operationKind}.`,
    )
  }

  assert.ok(
    evidence.every((record) => record.toolId === 'ffmpeg' || record.toolId === 'ffprobe'),
    'Only FFmpeg and ffprobe may claim actual private media-operation evidence in this vertical slice.',
  )
  assert.ok(
    evidence.every((record) => (
      record.costEvidence.billableToUser === false
      && record.costEvidence.serviceFeeIncluded === false
      && record.costEvidence.walletMutationExecuted === false
      && record.costEvidence.settlementExecuted === false
      && record.costEvidence.nonBillableReason === 'private_internal_test_execution_no_wallet_settlement'
    )),
    'Private internal tool-operation evidence must stay nonbillable and settlement-free.',
  )
  assert.ok(
    evidence.filter((record) => record.toolId === 'ffmpeg').every((record) => record.mediaProcessingExecuted),
    'FFmpeg evidence must represent actual private media processing.',
  )
  assert.ok(
    evidence.filter((record) => record.toolId === 'ffprobe').every((record) => !record.mediaProcessingExecuted),
    'ffprobe evidence must represent inspection/QA, not media processing.',
  )
}

function resolveBackendUrl(apiBaseUrl: string, routeOrUrl: string): string {
  if (/^https?:\/\//i.test(routeOrUrl)) return routeOrUrl
  return new URL(routeOrUrl, apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`).toString()
}

async function countRegularFiles(rootPath: string): Promise<number> {
  const entries = await readdir(rootPath, { recursive: true, withFileTypes: true }).catch((error) => {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return []
    throw error
  })
  return entries.filter((entry) => entry.isFile()).length
}

async function createStubHydratedPythonRuntime(packageNames: string[]) {
  const root = await mkdtemp(join(tmpdir(), 'reeditpro-upload-e2e-adapter-python-runtime-'))
  const packageRoot = join(root, 'packages')
  await mkdir(packageRoot, { recursive: true })

  for (const packageName of packageNames) {
    const packagePath = join(packageRoot, packageName)
    await mkdir(packagePath, { recursive: true })
    await writeFile(join(packagePath, '__init__.py'), [
      `__version__ = "0.0.0-upload-e2e-smoke-${packageName}"`,
      'def api_shape_probe():',
      `    return "${packageName}"`,
      '',
    ].join('\n'), 'utf8')
  }

  await writeFile(join(packageRoot, 'pydub', 'effects.py'), [
    '__version__ = "0.0.0-upload-e2e-smoke-pydub-effects"',
    'def normalize(*args, **kwargs):',
    '    return {"status": "stubbed"}',
    '',
  ].join('\n'), 'utf8')

  const wrapperPath = join(root, 'python-wrapper.sh')
  await writeFile(wrapperPath, [
    '#!/bin/sh',
    `PYTHONPATH="${packageRoot}:$PYTHONPATH" exec python3 "$@"`,
    '',
  ].join('\n'), 'utf8')
  await chmod(wrapperPath, 0o755)

  return {
    root,
    wrapperPath,
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}
