import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'

import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  canonicalInternalAuthorityArtifactRelativePath,
} from '../services/canonical-internal-authority-artifact-verifier'
import { createCanonicalInternalAuthorityRunnerService } from '../services/canonical-internal-authority-runner-service'
import { createCanonicalEditExecutionPackageService } from '../services/canonical-edit-execution-package-service'
import {
  CANONICAL_PRIVATE_TOOL_DISPATCH_TTL_SECONDS,
  createCanonicalPrivateToolDispatchAuthorityService,
} from '../services/canonical-private-tool-dispatch-authority-service'
import { createCanonicalPrivateStructuredToolExecutionService } from '../services/canonical-private-structured-tool-execution-service'
import { createCanonicalPrivatePythonToolExecutionService } from '../services/canonical-private-python-tool-execution-service'
import { createCanonicalPrivateMediaBinaryExecutionService } from '../services/canonical-private-media-binary-execution-service'
import { createCanonicalPrivateDependencyArtifactReadService } from '../services/canonical-private-dependency-artifact-read-service'
import { createCanonicalPrivateSharpExecutionService } from '../services/canonical-private-sharp-execution-service'
import { createCanonicalPrivateRemotionExecutionService } from '../services/canonical-private-remotion-execution-service'
import { createCanonicalPrivateLibassExecutionService } from '../services/canonical-private-libass-execution-service'
import { createCanonicalPrivateFinalArtifactDownloadService } from '../services/canonical-private-final-artifact-download-service'
import { createCanonicalPrivateBrowserGraphicsExecutionService } from '../services/canonical-private-browser-graphics-execution-service'
import { createCanonicalPrivateAiCapabilityExecutionService } from '../services/canonical-private-ai-capability-execution-service'
import { createCanonicalPrivateNativeImagePipelineExecutionService } from '../services/canonical-private-native-image-pipeline-execution-service'
import { createCanonicalPrivateNativeAudioProcessingExecutionService } from '../services/canonical-private-native-audio-processing-execution-service'
import { createCanonicalPrivateContainerPackagingValidationExecutionService } from '../services/canonical-private-container-packaging-validation-execution-service'
import { createCanonicalPrivateVapourSynthFramePipelineExecutionService } from '../services/canonical-private-vapoursynth-frame-pipeline-execution-service'
import { createCanonicalPrivateAudioFluxAnalysisExecutionService } from '../services/canonical-private-audioflux-analysis-execution-service'
import { createCanonicalPrivateRembgBackgroundRemovalExecutionService } from '../services/canonical-private-rembg-background-removal-execution-service'
import { createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService } from '../services/canonical-private-deepfilternet-voice-cleanup-execution-service'
import { createCanonicalPrivateJobExecutionAdapterService } from '../services/canonical-private-job-execution-adapter-service'
import { createCanonicalPrivateReviewAssemblyService } from '../services/canonical-private-review-assembly-service'
import { createCanonicalPrivateReviewDecisionService } from '../services/canonical-private-review-decision-service'
import { createCanonicalPrivateWorkGraphOrchestratorService } from '../services/canonical-private-work-graph-orchestrator-service'
import { createCanonicalWorkerLeaseAuthorityService } from '../services/canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import {
  clearPrivateCanonicalToolDispatchProcessStateForSmoke,
  readPrivateCanonicalToolDispatchAggregate,
} from '../services/private-canonical-tool-dispatch-store'
import {
  exactEditPreferenceFingerprint,
} from '../services/private-exact-edit-preference-store'
import {
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { readPrivateUploadMediaAuthorityAggregate } from '../services/private-upload-media-authority-store'
import { createSourceMediaAuthorityService } from '../services/source-media-authority-service'
import { createUploadService } from '../services/upload-service'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import {
  createPrivateOfflineNodeStructuredExecutionRuntime,
  OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT,
  OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
} from '../tool-execution/node-runner-execution/offline-node-structured-execution-service'
import {
  createPrivateOfflinePythonStructuredExecutionRuntime,
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT,
  OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
} from '../tool-execution/python-runner-execution'
import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  OFFLINE_REMOTION_RENDER_EXECUTION_STORAGE_ROOT,
  OFFLINE_REMOTION_RENDER_RUNTIME_AUTHORITY_RELATIVE_PATH,
} from '../tool-execution/remotion-render-execution'
import { activatePrivateOfflineLibassCaptionRuntime } from '../tool-execution/libass-caption-execution'
import { activatePrivateOfflineBrowserGraphicsRuntime, prepareOfflineBrowserGraphicsDockerRuntime } from '../tool-execution/browser-graphics-execution'
import { activatePrivateOfflineAiCapabilityRuntime, prepareOfflineAiCapabilityDockerRuntime } from '../tool-execution/ai-capability-execution'
import { activatePrivateOfflineNativeImagePipelineRuntime, prepareOfflineNativeImagePipelineDockerRuntime } from '../tool-execution/native-image-pipeline-execution'
import { activatePrivateOfflineNativeAudioProcessingRuntime, prepareOfflineNativeAudioProcessingDockerRuntime } from '../tool-execution/native-audio-processing-execution'
import { activatePrivateOfflineContainerPackagingValidationRuntime, prepareOfflineContainerPackagingValidationDockerRuntime } from '../tool-execution/container-packaging-validation-execution'
import { activatePrivateOfflineVapourSynthFramePipelineRuntime, prepareOfflineVapourSynthFramePipelineDockerRuntime } from '../tool-execution/vapoursynth-frame-pipeline-execution'
import { activatePrivateOfflineAudioFluxAnalysisRuntime, prepareOfflineAudioFluxAnalysisDockerRuntime } from '../tool-execution/audioflux-analysis-execution'
import { activatePrivateOfflineRembgBackgroundRemovalRuntime, prepareOfflineRembgBackgroundRemovalDockerRuntime } from '../tool-execution/rembg-background-removal-execution'
import { activatePrivateOfflineDeepFilterNetVoiceCleanupRuntime, prepareOfflineDeepFilterNetVoiceCleanupDockerRuntime } from '../tool-execution/deepfilternet-voice-cleanup-execution'
import type { ServiceContext } from '../types'
import {
  PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
  type PublishCanonicalEditPlanBody,
} from '../validation/edit-planning-authority-schemas'
import { canonicalPrivateToolDispatchConsumptionResponseSchema } from '../validation/canonical-private-tool-dispatch-schemas'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

// Creates authenticated project/source/planning fixtures and a separate
// canonical authority chain. This smoke adds its own explicit revision plan so
// a controlled tool is a dependency-root job instead of abusing the zero-tool
// snapshot-validation job as execution authority.
await import('./canonical-execution-readiness-smoke')

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const routeWorkspaceId = 'workspace-authority-route-smoke'
const userId = 'user-authority-smoke'
const editSessionId = 'edit-session-canonical-tool-dispatch'
const strongInternalSecret = 'rp-dispatch-local-secret-9Yh4Wm7Qk2Xs8Nv5Bc3Lp6Td1Rf0Za'
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  SUPABASE_URL: 'https://canonical-tool-dispatch-smoke.supabase.co',
  SUPABASE_ANON_KEY: 'canonical-tool-dispatch-smoke-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'canonical-tool-dispatch-smoke-service-role',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: strongInternalSecret,
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const context: ServiceContext = {
  env,
  clients: {
    admin: createMembershipAdminClient([
      { workspaceId, userId, role: 'owner' },
      { workspaceId: routeWorkspaceId, userId, role: 'owner' },
    ]),
    public: null,
  },
  requestId: 'canonical-private-tool-dispatch-authority-smoke',
  auth: { userId, accessToken: 'verified-dispatch-smoke-token', isMockUser: false },
}
await rm(join(
  OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT,
  OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
), { force: true })
await rm(join(
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT,
  OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
), { force: true })
await rm(join(
  OFFLINE_REMOTION_RENDER_EXECUTION_STORAGE_ROOT,
  OFFLINE_REMOTION_RENDER_RUNTIME_AUTHORITY_RELATIVE_PATH,
), { force: true })

const seedAggregate = await requireEditAuthority(workspaceId)
const seedSnapshot = seedAggregate.snapshots.find((candidate) =>
  seedAggregate.executionPackages.some((executionPackage) =>
    executionPackage.snapshotId === candidate.snapshotId))
assert.ok(seedSnapshot)
const seedAuthority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
  seedSnapshot.snapshotId,
  workspaceId,
)
const d3Spec = resolveCompleteProfessionalToolOperationSpec('d3')
assert.ok(d3Spec)
assert.equal(d3Spec.disposition, 'edit_operation_candidate')
const d3OperationId = d3Spec.allowedOperationIds[0]
const ffmpegSpec = resolveCompleteProfessionalToolOperationSpec('ffmpeg')
assert.ok(ffmpegSpec)
const ffmpegOperationId = ffmpegSpec.allowedOperationIds[0]
const duckdbSpec = resolveCompleteProfessionalToolOperationSpec('duckdb')
assert.ok(duckdbSpec)
assert.equal(duckdbSpec.privateInternalExecutionReady, true)
const duckdbOperationId = duckdbSpec.allowedOperationIds[0]
const pyavSpec = resolveCompleteProfessionalToolOperationSpec('pyav')
assert.ok(pyavSpec)
assert.equal(pyavSpec.privateInternalExecutionReady, true)
const pyavOperationId = pyavSpec.allowedOperationIds[0]
const scipySpec = resolveCompleteProfessionalToolOperationSpec('scipy')
assert.ok(scipySpec)
assert.equal(scipySpec.privateInternalExecutionReady, true)
const scipyOperationId = scipySpec.allowedOperationIds[0]
const pyloudnormSpec = resolveCompleteProfessionalToolOperationSpec('pyloudnorm')
assert.ok(pyloudnormSpec)
assert.equal(pyloudnormSpec.privateInternalExecutionReady, true)
const pyloudnormOperationId = pyloudnormSpec.allowedOperationIds[0]
const pydubSpec = resolveCompleteProfessionalToolOperationSpec('pydub')
assert.ok(pydubSpec)
assert.equal(pydubSpec.privateInternalExecutionReady, true)
const pydubOperationId = pydubSpec.allowedOperationIds[0]
const pydubEffectsSpec = resolveCompleteProfessionalToolOperationSpec('pydub_effects')
assert.ok(pydubEffectsSpec)
assert.equal(pydubEffectsSpec.privateInternalExecutionReady, true)
const pydubEffectsOperationId = pydubEffectsSpec.allowedOperationIds[0]
const ebuR128Spec = resolveCompleteProfessionalToolOperationSpec('ebu_r128_pyloudnorm')
assert.ok(ebuR128Spec)
assert.equal(ebuR128Spec.privateInternalExecutionReady, true)
const ebuR128OperationId = ebuR128Spec.allowedOperationIds[0]
const audioreadSpec = resolveCompleteProfessionalToolOperationSpec('audioread')
assert.ok(audioreadSpec)
assert.equal(audioreadSpec.privateInternalExecutionReady, true)
const audioreadOperationId = audioreadSpec.allowedOperationIds[0]
const resampySpec = resolveCompleteProfessionalToolOperationSpec('resampy')
assert.ok(resampySpec)
assert.equal(resampySpec.privateInternalExecutionReady, true)
const resampyOperationId = resampySpec.allowedOperationIds[0]
const pedalboardSpec = resolveCompleteProfessionalToolOperationSpec('pedalboard')
assert.ok(pedalboardSpec)
assert.equal(pedalboardSpec.privateInternalExecutionReady, true)
const pedalboardOperationId = pedalboardSpec.allowedOperationIds[0]
const mirEvalSpec = resolveCompleteProfessionalToolOperationSpec('mir_eval')
assert.ok(mirEvalSpec)
assert.equal(mirEvalSpec.privateInternalExecutionReady, true)
const mirEvalOperationId = mirEvalSpec.allowedOperationIds[0]
const midoSpec = resolveCompleteProfessionalToolOperationSpec('mido')
assert.ok(midoSpec)
assert.equal(midoSpec.privateInternalExecutionReady, true)
const midoOperationId = midoSpec.allowedOperationIds[0]
const ffprobeSpec = resolveCompleteProfessionalToolOperationSpec('ffprobe')
assert.ok(ffprobeSpec)
assert.equal(ffprobeSpec.privateInternalExecutionReady, true)
const ffprobeOperationId = ffprobeSpec.allowedOperationIds[0]
const remotionSpec = resolveCompleteProfessionalToolOperationSpec('remotion')
assert.ok(remotionSpec)
assert.equal(remotionSpec.privateInternalExecutionReady, true)
const remotionOperationId = remotionSpec.allowedOperationIds[0]
const libassSpec = resolveCompleteProfessionalToolOperationSpec('libass')
assert.ok(libassSpec)
assert.equal(libassSpec.privateInternalExecutionReady, true)
const libassOperationId = libassSpec.allowedOperationIds[0]
const matrixToolIds = [
  'echarts', 'vega_lite', 'vega', 'satori', 'svg_js', 'viz_js', 'animejs', 'three_js',
  'pretty_midi', 'noisereduce', 'polars', 'opentimelineio', 'opencv', 'pyscenedetect',
  'librosa', 'lottie', 'pixijs', 'konva', 'babylon_js', 'playwright',
  'music21', 'kornia',
  'opencolorio', 'openimageio',
  'rnnoise', 'signalsmith_stretch',
  'mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation',
  'vapoursynth',
  'audioflux',
  'rembg',
  'deepfilternet',
] as const
type MatrixToolId = (typeof matrixToolIds)[number]
const matrixOperationIds = Object.fromEntries(matrixToolIds.map((toolId) => {
  const spec = resolveCompleteProfessionalToolOperationSpec(toolId)
  assert.ok(spec)
  assert.equal(spec.privateInternalExecutionReady, true)
  return [toolId, spec.allowedOperationIds[0]]
})) as Record<MatrixToolId, string>

const mediaFixture = await uploadCanonicalMediaFixture(seedSnapshot.projectId)
const mediaSourceItem = {
  sourceSequenceItemId: 'source-sequence-python-media',
  mediaAssetId: mediaFixture.mediaAsset.id,
  uploadedOrder: seedAuthority.components.sourceSequence.length + 1,
  checksumSha256: mediaFixture.checksumSha256,
  required: true as const,
}

const planningInputAuthority = await prepareExactPlanningAuthority(seedSnapshot.projectId)
const sourceCandidate = (await createSourceMediaAuthorityService(context).buildManifestCandidate({
  workspaceId,
  projectId: seedSnapshot.projectId,
  uploadPurpose: 'source_media',
  orderedItems: [...seedAuthority.components.sourceSequence.map((item) => ({
    sourceSequenceItemId: item.sourceSequenceItemId,
    mediaAssetId: item.mediaAssetId,
    uploadedOrder: item.uploadedOrder,
    checksumSha256: requireSha256(item.checksumSha256),
    required: item.required,
  })), mediaSourceItem],
})).sourceBindingManifestCandidate
const sourceMediaAuthority = {
  authorityRevision: sourceCandidate.authorityRevision,
  authorityChecksumSha256: sourceCandidate.authorityChecksumSha256,
  sourceSequenceHash: sourceCandidate.sourceSequenceHash,
  candidateHash: sourceCandidate.candidateHash,
}

const dispatchPlanInput = {
  seedAuthority,
  planningInputAuthority,
  sourceMediaAuthority,
  d3OperationId,
  duckdbOperationId,
  pyavOperationId,
  scipyOperationId,
  pyloudnormOperationId,
  pydubOperationId,
  pydubEffectsOperationId,
  ebuR128OperationId,
  audioreadOperationId,
  resampyOperationId,
  pedalboardOperationId,
  mirEvalOperationId,
  midoOperationId,
  ffprobeOperationId,
  ffmpegOperationId,
  remotionOperationId,
  libassOperationId,
  mediaSourceItem,
  matrixOperationIds,
}
const planBody = createDispatchPlanBody(dispatchPlanInput)
const planningService = createEditPlanningAuthorityService(context)
const published = await planningService.publishCanonicalPlan({
  ...planBody,
  projectId: seedSnapshot.projectId,
  editSessionId,
  idempotencyKey: 'publish-canonical-tool-dispatch-plan',
})
const publishedAuthority = asRecord(published.authority)
const publishedPlan = asRecord(publishedAuthority.plan)
const publishedEstimate = asRecord(publishedAuthority.estimate)
const approved = await planningService.approveAndFundCanonicalPlan({
  workspaceId,
  editPlanId: String(publishedPlan.id),
  expectedAuthorityRevision: Number(publishedAuthority.authorityRevision),
  expectedPlanHash: String(publishedPlan.planHash),
  expectedEstimateHash: String(publishedEstimate.estimateHash),
  idempotencyKey: 'approve-canonical-tool-dispatch-plan',
})
const approvedSnapshot = asRecord(asRecord(approved.authority).snapshot)
await createCanonicalEditExecutionPackageService(context).createPackage({
  workspaceId,
  approvedPlanSnapshotId: String(approvedSnapshot.snapshotId),
  expectedSnapshotHash: String(approvedSnapshot.snapshotHash),
  purpose: 'private_internal_execution_handoff',
  idempotencyKey: 'package-canonical-tool-dispatch-plan',
})

const aggregateBeforeDispatch = await requireEditAuthority(workspaceId)
const snapshot = aggregateBeforeDispatch.snapshots.find((candidate) =>
  candidate.snapshotId === approvedSnapshot.snapshotId)
assert.ok(snapshot)
const chartWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'chart-root')
const dependentChartWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'chart-dependent')
const sharpWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'sharp-root')
const sharpProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'sharp-proof-consumer')
const chartProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'chart-proof-consumer')
const dataWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'data-root')
const dataProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'data-proof-consumer')
const mediaWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'media-root')
const mediaProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'media-proof-consumer')
const scipyWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'scipy-audio-root')
const scipyProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'scipy-audio-proof-consumer')
const loudnessWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'loudness-root')
const loudnessProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'loudness-proof-consumer')
const pydubWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'pydub-audio-root')
const pydubProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'pydub-audio-proof-consumer')
const pydubEffectsWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'pydub-effects-root')
const pydubEffectsProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'pydub-effects-proof-consumer')
const ebuR128WorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'ebu-r128-root')
const ebuR128ProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'ebu-r128-proof-consumer')
const audioreadWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'audioread-root')
const audioreadProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'audioread-proof-consumer')
const resampyWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'resampy-root')
const resampyProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'resampy-proof-consumer')
const pedalboardWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'pedalboard-root')
const pedalboardProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'pedalboard-proof-consumer')
const mirEvalWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'mir-eval-root')
const mirEvalProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'mir-eval-proof-consumer')
const midoWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'mido-root')
const midoProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'mido-proof-consumer')
const probeWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'probe-root')
const probeProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'probe-proof-consumer')
const trimWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'trim-root')
const trimProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'trim-proof-consumer')
const validationWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'snapshot-validation-root')
const sourceTrimValidationWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'source-trim-validation')
assert.ok(chartWorkItem)
assert.ok(dependentChartWorkItem)
assert.ok(sharpWorkItem)
assert.ok(sharpProofWorkItem)
assert.ok(chartProofWorkItem)
assert.ok(dataWorkItem)
assert.ok(dataProofWorkItem)
assert.ok(mediaWorkItem)
assert.ok(mediaProofWorkItem)
assert.ok(scipyWorkItem)
assert.ok(scipyProofWorkItem)
assert.ok(loudnessWorkItem)
assert.ok(loudnessProofWorkItem)
assert.ok(pydubWorkItem)
assert.ok(pydubProofWorkItem)
assert.ok(pydubEffectsWorkItem)
assert.ok(pydubEffectsProofWorkItem)
assert.ok(ebuR128WorkItem)
assert.ok(ebuR128ProofWorkItem)
assert.ok(audioreadWorkItem)
assert.ok(audioreadProofWorkItem)
assert.ok(resampyWorkItem)
assert.ok(resampyProofWorkItem)
assert.ok(pedalboardWorkItem)
assert.ok(pedalboardProofWorkItem)
assert.ok(mirEvalWorkItem)
assert.ok(mirEvalProofWorkItem)
assert.ok(midoWorkItem)
assert.ok(midoProofWorkItem)
assert.ok(probeWorkItem)
assert.ok(probeProofWorkItem)
assert.ok(trimWorkItem)
assert.ok(trimProofWorkItem)
assert.ok(validationWorkItem)
assert.ok(sourceTrimValidationWorkItem)
const chartJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === chartWorkItem.id)
const validationJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === validationWorkItem.id)
const sourceTrimValidationJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === sourceTrimValidationWorkItem.id)
const dependentChartJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === dependentChartWorkItem.id)
const sharpJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === sharpWorkItem.id)
const sharpProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === sharpProofWorkItem.id)
const chartProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === chartProofWorkItem.id)
const dataJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === dataWorkItem.id)
const dataProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === dataProofWorkItem.id)
const mediaJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === mediaWorkItem.id)
const mediaProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === mediaProofWorkItem.id)
const scipyJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === scipyWorkItem.id)
const scipyProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === scipyProofWorkItem.id)
const loudnessJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === loudnessWorkItem.id)
const loudnessProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === loudnessProofWorkItem.id)
const pydubJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === pydubWorkItem.id)
const pydubProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === pydubProofWorkItem.id)
const pydubEffectsJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === pydubEffectsWorkItem.id)
const pydubEffectsProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === pydubEffectsProofWorkItem.id)
const ebuR128Job = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === ebuR128WorkItem.id)
const ebuR128ProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === ebuR128ProofWorkItem.id)
const audioreadJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === audioreadWorkItem.id)
const audioreadProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === audioreadProofWorkItem.id)
const resampyJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === resampyWorkItem.id)
const resampyProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === resampyProofWorkItem.id)
const pedalboardJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === pedalboardWorkItem.id)
const pedalboardProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === pedalboardProofWorkItem.id)
const mirEvalJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === mirEvalWorkItem.id)
const mirEvalProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === mirEvalProofWorkItem.id)
const midoJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === midoWorkItem.id)
const midoProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === midoProofWorkItem.id)
const probeJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === probeWorkItem.id)
const probeProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === probeProofWorkItem.id)
const trimJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === trimWorkItem.id)
const trimProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === trimProofWorkItem.id)
assert.ok(chartJob)
assert.ok(validationJob)
assert.ok(sourceTrimValidationJob)
assert.ok(dependentChartJob)
assert.ok(sharpJob)
assert.ok(sharpProofJob)
assert.ok(chartProofJob)
assert.ok(dataJob)
assert.ok(dataProofJob)
assert.ok(mediaJob)
assert.ok(mediaProofJob)
assert.ok(scipyJob)
assert.ok(scipyProofJob)
assert.ok(loudnessJob)
assert.ok(loudnessProofJob)
assert.ok(pydubJob)
assert.ok(pydubProofJob)
assert.ok(pydubEffectsJob)
assert.ok(pydubEffectsProofJob)
assert.ok(ebuR128Job)
assert.ok(ebuR128ProofJob)
assert.ok(audioreadJob)
assert.ok(audioreadProofJob)
assert.ok(resampyJob)
assert.ok(resampyProofJob)
assert.ok(pedalboardJob)
assert.ok(pedalboardProofJob)
assert.ok(mirEvalJob)
assert.ok(mirEvalProofJob)
assert.ok(midoJob)
assert.ok(midoProofJob)
assert.ok(probeJob)
assert.ok(probeProofJob)
assert.ok(trimJob)
assert.ok(trimProofJob)
assert.deepEqual(chartJob.dependencyJobIds, [])
assert.deepEqual(validationJob.dependencyJobIds, [])
assert.deepEqual(sourceTrimValidationJob.dependencyJobIds, [validationJob.id])
assert.deepEqual(dependentChartJob.dependencyJobIds, [validationJob.id])
assert.deepEqual(sharpJob.dependencyJobIds, [chartJob.id])
assert.deepEqual(sharpProofJob.dependencyJobIds, [sharpJob.id])
assert.deepEqual(chartProofJob.dependencyJobIds, [chartJob.id])
assert.deepEqual(dataJob.dependencyJobIds, [])
assert.deepEqual(dataProofJob.dependencyJobIds, [dataJob.id])
assert.deepEqual(mediaJob.dependencyJobIds, [])
assert.deepEqual(mediaProofJob.dependencyJobIds, [mediaJob.id])
assert.deepEqual(scipyJob.dependencyJobIds, [])
assert.deepEqual(scipyProofJob.dependencyJobIds, [scipyJob.id])
assert.deepEqual(loudnessJob.dependencyJobIds, [])
assert.deepEqual(loudnessProofJob.dependencyJobIds, [loudnessJob.id])
assert.deepEqual(pydubJob.dependencyJobIds, [])
assert.deepEqual(pydubProofJob.dependencyJobIds, [pydubJob.id])
assert.deepEqual(pydubEffectsJob.dependencyJobIds, [])
assert.deepEqual(pydubEffectsProofJob.dependencyJobIds, [pydubEffectsJob.id])
assert.deepEqual(ebuR128Job.dependencyJobIds, [])
assert.deepEqual(ebuR128ProofJob.dependencyJobIds, [ebuR128Job.id])
assert.deepEqual(audioreadJob.dependencyJobIds, [])
assert.deepEqual(audioreadProofJob.dependencyJobIds, [audioreadJob.id])
assert.deepEqual(resampyJob.dependencyJobIds, [])
assert.deepEqual(resampyProofJob.dependencyJobIds, [resampyJob.id])
assert.deepEqual(pedalboardJob.dependencyJobIds, [])
assert.deepEqual(pedalboardProofJob.dependencyJobIds, [pedalboardJob.id])
assert.deepEqual(mirEvalJob.dependencyJobIds, [])
assert.deepEqual(mirEvalProofJob.dependencyJobIds, [mirEvalJob.id])
assert.deepEqual(midoJob.dependencyJobIds, [])
assert.deepEqual(midoProofJob.dependencyJobIds, [midoJob.id])
assert.deepEqual(probeJob.dependencyJobIds, [])
assert.deepEqual(probeProofJob.dependencyJobIds, [probeJob.id])
assert.deepEqual(trimJob.dependencyJobIds, [])
assert.deepEqual(trimProofJob.dependencyJobIds, [trimJob.id])
const authority = await planningService.loadApprovedExecutionAuthority(snapshot.snapshotId, workspaceId)
const primaryAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === chartWorkItem.id && candidate.outputKey === 'chart-primary')
const aliasAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === chartWorkItem.id && candidate.outputKey === 'chart-alias')
const validationAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === validationWorkItem.id)
const sourceTrimValidationAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === sourceTrimValidationWorkItem.id)
const dependentChartAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === dependentChartWorkItem.id)
const sharpAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === sharpWorkItem.id)
const dataAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === dataWorkItem.id)
const mediaAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === mediaWorkItem.id)
const scipyAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === scipyWorkItem.id)
const loudnessAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === loudnessWorkItem.id)
const pydubAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === pydubWorkItem.id)
const pydubEffectsAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === pydubEffectsWorkItem.id)
const ebuR128Asset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === ebuR128WorkItem.id)
const audioreadAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === audioreadWorkItem.id)
const resampyAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === resampyWorkItem.id)
const pedalboardAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === pedalboardWorkItem.id)
const mirEvalAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === mirEvalWorkItem.id)
const midoAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === midoWorkItem.id)
const probeAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === probeWorkItem.id)
const trimAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === trimWorkItem.id)
assert.ok(primaryAsset)
assert.ok(aliasAsset)
assert.ok(validationAsset)
assert.ok(dependentChartAsset)
assert.ok(sharpAsset)
assert.ok(dataAsset)
assert.ok(mediaAsset)
assert.ok(scipyAsset)
assert.ok(loudnessAsset)
assert.ok(pydubAsset)
assert.ok(pydubEffectsAsset)
assert.ok(ebuR128Asset)
assert.ok(audioreadAsset)
assert.ok(resampyAsset)
assert.ok(pedalboardAsset)
assert.ok(mirEvalAsset)
assert.ok(midoAsset)
assert.ok(probeAsset)
assert.ok(trimAsset)

const matrixRuns = matrixToolIds.map((toolId) => {
  const workItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
    candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === `matrix-${toolId}-root`)
  const proofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
    candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === `matrix-${toolId}-proof`)
  assert.ok(workItem)
  assert.ok(proofWorkItem)
  const job = aggregateBeforeDispatch.jobs.find((candidate) =>
    candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === workItem.id)
  const proofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
    candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === proofWorkItem.id)
  const asset = authority.assetManifest.entries.find((candidate) =>
    candidate.approvedWorkItemId === workItem.id)
  assert.ok(job)
  assert.ok(proofJob)
  assert.ok(asset)
  assert.deepEqual(job.dependencyJobIds, [])
  assert.deepEqual(proofJob.dependencyJobIds, [job.id])
  return {
    toolId, operationId: matrixOperationIds[toolId], workItem, job, proofJob, asset,
    runnerKind: ['echarts', 'vega_lite', 'vega', 'satori', 'svg_js', 'viz_js', 'animejs', 'three_js'].includes(toolId)
      ? 'node' as const
      : ['lottie', 'pixijs', 'konva', 'babylon_js', 'playwright'].includes(toolId)
        ? 'browser' as const
        : ['torch_torchvision', 'transformers', 'music21', 'kornia'].includes(toolId)
          ? 'ai' as const
          : ['opencolorio', 'openimageio'].includes(toolId)
            ? 'native_image' as const
          : ['rnnoise', 'signalsmith_stretch'].includes(toolId)
            ? 'native_audio' as const
          : ['mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation'].includes(toolId)
            ? 'packaging' as const
          : toolId === 'vapoursynth'
            ? 'vapoursynth' as const
          : toolId === 'audioflux'
            ? 'audioflux' as const
          : toolId === 'rembg'
            ? 'rembg' as const
          : toolId === 'deepfilternet'
            ? 'deepfilternet' as const
        : 'python' as const,
    expectedContentType: ['echarts', 'vega_lite', 'vega', 'satori', 'svg_js', 'viz_js', 'animejs', 'three_js'].includes(toolId)
      ? 'image/svg+xml' as const
      : ['lottie', 'pixijs', 'konva', 'babylon_js', 'playwright'].includes(toolId)
        ? 'image/png' as const
      : toolId === 'kornia'
        ? 'image/png' as const
      : ['opencolorio', 'openimageio'].includes(toolId)
        ? 'image/png' as const
      : toolId === 'rembg'
        ? 'image/png' as const
      : toolId === 'deepfilternet'
        ? 'audio/wav' as const
      : ['rnnoise', 'signalsmith_stretch'].includes(toolId)
        ? 'audio/wav' as const
      : ['mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation'].includes(toolId)
        ? 'application/json' as const
      : toolId === 'noisereduce'
        ? 'audio/wav' as const
        : 'application/json' as const,
  }
})

const remotionWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'remotion-private-preview-root')
const remotionProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'remotion-private-preview-proof')
assert.ok(remotionWorkItem)
assert.ok(remotionProofWorkItem)
const remotionJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === remotionWorkItem.id)
const remotionProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === remotionProofWorkItem.id)
const remotionAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === remotionWorkItem.id)
assert.ok(remotionJob)
assert.ok(remotionProofJob)
assert.ok(remotionAsset)
assert.deepEqual(remotionJob.dependencyJobIds, [])
assert.deepEqual(remotionProofJob.dependencyJobIds, [remotionJob.id])

const libassWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'libass-caption-overlay-root')
const libassProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'libass-caption-overlay-proof')
assert.ok(libassWorkItem)
assert.ok(libassProofWorkItem)
const libassJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === libassWorkItem.id)
const libassProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === libassProofWorkItem.id)
const libassAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === libassWorkItem.id)
assert.ok(libassJob)
assert.ok(libassProofJob)
assert.ok(libassAsset)
assert.deepEqual(libassJob.dependencyJobIds, [])
assert.deepEqual(libassProofJob.dependencyJobIds, [libassJob.id])

const finalCompositionWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'remotion-source-caption-final')
assert.ok(finalCompositionWorkItem)
const finalCompositionJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === finalCompositionWorkItem.id)
const finalCompositionAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === finalCompositionWorkItem.id)
const finalArtifactQaWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'final-qa')
assert.ok(finalArtifactQaWorkItem)
const finalArtifactQaJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === finalArtifactQaWorkItem.id)
const finalArtifactQaAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === finalArtifactQaWorkItem.id)
assert.ok(finalCompositionJob)
assert.ok(finalCompositionAsset)
assert.ok(sourceTrimValidationAsset)
assert.ok(finalArtifactQaJob)
assert.ok(finalArtifactQaAsset)
assert.deepEqual(finalCompositionJob.dependencyJobIds, [sourceTrimValidationJob.id, libassJob.id])
assert.deepEqual(finalArtifactQaJob.dependencyJobIds, [finalCompositionJob.id])

const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
const chartClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-chart-root-for-dispatch',
})).workerLeaseClaim
const validationClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: validationJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-zero-tool-validation-root',
})).workerLeaseClaim
await expectApiError(
  () => leaseService.claim({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: dependentChartJob.id,
    purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: 'dependent-chart-before-artifact-must-fail',
  }),
  'JOB_DEPENDENCY_NOT_READY',
)

const dispatchService = createCanonicalPrivateToolDispatchAuthorityService(context)
const chartLeaseAuthority = {
  leaseId: chartClaim.lease.leaseId,
  leaseCredential: chartClaim.leaseCredential,
}
const baseInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  approvedWorkItemId: chartWorkItem.id,
  expectedAssetId: primaryAsset.id,
  requestedToolName: 'd3',
  operationId: d3OperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization' as const,
  idempotencyKey: 'authorize-chart-primary',
}

await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    path: '/tmp/caller-selected-output.svg',
  } as never, chartLeaseAuthority),
  'VALIDATION_FAILED',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    idempotencyKey: 'short',
  }, chartLeaseAuthority),
  'VALIDATION_FAILED',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    command: 'node arbitrary-runner.js',
  } as never, chartLeaseAuthority),
  'VALIDATION_FAILED',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    leaseCredential: chartClaim.leaseCredential,
  } as never, chartLeaseAuthority),
  'VALIDATION_FAILED',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    requestedToolName: 'not-a-registry-tool',
    idempotencyKey: 'unknown-tool',
  }, chartLeaseAuthority),
  'TOOL_NOT_READY',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    requestedToolName: 'deck.gl',
    idempotencyKey: 'policy-blocked-tool',
  }, chartLeaseAuthority),
  'TOOL_NOT_READY',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    requestedToolName: 'd3/../ffmpeg',
    idempotencyKey: 'path-alias-confusion',
  }, chartLeaseAuthority),
  'VALIDATION_FAILED',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    requestedToolName: 'echarts',
    idempotencyKey: 'unapproved-alias-confusion',
  }, chartLeaseAuthority),
  'TOOL_NOT_READY',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    operationId: 'tool.d3.not-the-approved-operation.v1',
    idempotencyKey: 'wrong-operation',
  }, chartLeaseAuthority),
  'TOOL_NOT_READY',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    approvedWorkItemId: validationWorkItem.id,
    idempotencyKey: 'wrong-work-item',
  }, chartLeaseAuthority),
  'JOB_DEPENDENCY_NOT_READY',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    expectedAssetId: validationAsset.id,
    idempotencyKey: 'wrong-output',
  }, chartLeaseAuthority),
  'JOB_DEPENDENCY_NOT_READY',
)
await expectApiError(
  () => dispatchService.authorize(baseInput, {
    ...chartLeaseAuthority,
    leaseCredential: `rpwl_v1_${'A'.repeat(43)}`,
  }),
  'WORKER_LEASE_EXPIRED',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    workspaceId: routeWorkspaceId,
    idempotencyKey: 'cross-tenant-dispatch',
  }, chartLeaseAuthority),
  'WORKER_LEASE_EXPIRED',
)
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    jobId: validationJob.id,
    approvedWorkItemId: validationWorkItem.id,
    expectedAssetId: validationAsset.id,
    idempotencyKey: 'zero-tool-authority-job',
  }, {
    leaseId: validationClaim.lease.leaseId,
    leaseCredential: validationClaim.leaseCredential,
  }),
  'TOOL_NOT_READY',
)

const sourcePath = await firstSourceObjectPath(snapshot.projectId)
const sourceBytes = await readFile(sourcePath)
try {
  await writeFile(sourcePath, Buffer.concat([sourceBytes, Buffer.from('tampered')]))
  await expectApiError(
    () => dispatchService.authorize({ ...baseInput, idempotencyKey: 'tampered-source-authority' }, chartLeaseAuthority),
    'UPLOAD_NOT_FINALIZED',
  )
} finally {
  await writeFile(sourcePath, sourceBytes)
}

const [primaryLeft, primaryRight] = await Promise.all([
  dispatchService.authorize(baseInput, chartLeaseAuthority),
  dispatchService.authorize(baseInput, chartLeaseAuthority),
])
assert.deepEqual(primaryLeft.toolDispatchGrant, primaryRight.toolDispatchGrant)
const primaryGrant = primaryLeft.toolDispatchGrant
assert.equal(primaryGrant.grant.status, 'denied')
assert.equal(primaryGrant.grant.binding.canonicalToolId, 'd3')
assert.equal(primaryGrant.grant.binding.operationId, d3OperationId)
assert.equal(primaryGrant.grant.binding.approvedWorkItemId, chartWorkItem.id)
assert.equal(primaryGrant.grant.binding.expectedAssetId, primaryAsset.id)
assert.equal(primaryGrant.grant.binding.leaseAttemptNumber, 1)
assert.equal(primaryGrant.grant.binding.leaseDependencyAuthority.state, 'not_required_for_root_job')
assert.equal(primaryGrant.grant.binding.leaseDependencyAuthority.selectedArtifactCount, 0)
assert.equal(
  primaryGrant.grant.binding.leaseDependencyAuthority.selectedArtifactsHash,
  sha256AuthorityValue([]),
)
assert.equal(
  primaryGrant.grant.binding.leaseDependencyAuthority.authorityHash,
  chartClaim.lease.dependencyAuthority.authorityHash,
)
assert.equal(primaryGrant.grant.binding.leaseExecutionFenceState, 'not_started')
assert.equal(primaryGrant.grant.singleUse, true)
assert.equal(primaryGrant.grant.consumptionRequiredBeforeExecution, true)
assert.equal(primaryGrant.grant.credentialIssued, false)
assert.equal(primaryGrant.dispatchCredential, undefined)
assert.equal(primaryGrant.evidence.specProductReady, false)
assert.equal(primaryGrant.evidence.runtimeProductReady, false)
assert.equal(primaryGrant.evidence.specPrivateInternalReady, true)
assert.equal(primaryGrant.evidence.runtimePrivateInternalReady, false)
assert.equal(primaryGrant.evidence.leaseDependencyAuthorityBinding, 'passed')
assert.equal(primaryGrant.evidence.leaseExecutionFenceNotStarted, 'passed')
assert.equal(primaryGrant.executionAuthority.dispatchAuthorized, false)
assert.equal(primaryGrant.executionAuthority.toolExecutionAuthorized, false)
assert.equal(primaryGrant.executionAuthority.providerCallAuthorized, false)
assert.equal(primaryGrant.executionAuthority.sourceObjectReadAuthorized, false)
assert.equal(primaryGrant.executionAuthority.artifactWriteAuthorized, false)
assert.equal(primaryGrant.executionAuthority.renderAuthorized, false)
assert.equal(primaryGrant.executionAuthority.creditSpendAuthorized, false)
assert.equal(primaryGrant.executionAuthority.walletMutationAuthorized, false)
assert.equal(primaryGrant.executionAuthority.settlementAuthorized, false)
assert.equal(primaryGrant.executionAuthority.noExecutionSideEffects, true)
assert.equal(
  (Date.parse(primaryGrant.grant.expiresAt) - Date.parse(primaryGrant.grant.issuedAt)) / 1_000,
  CANONICAL_PRIVATE_TOOL_DISPATCH_TTL_SECONDS,
)
assert.ok(primaryGrant.grant.blockers.includes('private_structured_runtime_authority_absent'))

const serializedGrant = JSON.stringify(primaryGrant)
assert.equal(serializedGrant.includes(chartClaim.leaseCredential), false)
assert.equal(serializedGrant.includes(strongInternalSecret), false)
assert.equal(serializedGrant.includes('bucketName'), false)
assert.equal(serializedGrant.includes('objectPath'), false)
assert.equal(serializedGrant.includes('executionInputRef'), false)
assert.equal(serializedGrant.includes('/tmp/'), false)
assert.equal(serializedGrant.includes('http://'), false)
assert.equal(serializedGrant.includes('https://'), false)

await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    idempotencyKey: 'different-key-same-live-binding',
  }, chartLeaseAuthority),
  'WORKER_CLAIM_CONFLICT',
)

const aliasGrant = (await dispatchService.authorize({
  ...baseInput,
  expectedAssetId: aliasAsset.id,
  requestedToolName: 'd3.js',
  idempotencyKey: 'authorize-chart-alias',
}, chartLeaseAuthority)).toolDispatchGrant
assert.equal(aliasGrant.grant.binding.requestedToolName, 'd3.js')
assert.equal(aliasGrant.grant.binding.canonicalToolId, 'd3')
assert.equal(aliasGrant.grant.status, 'denied')
assert.equal(aliasGrant.dispatchCredential, undefined)

const validationRun = await createCanonicalInternalAuthorityRunnerService(context).execute({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: validationJob.id,
  expectedAssetId: validationAsset.id,
  purpose: 'execute_canonical_internal_authority_validation',
}, {
  leaseId: validationClaim.lease.leaseId,
  leaseCredential: validationClaim.leaseCredential,
})
const dependentChartClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dependentChartJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-dependent-chart-after-artifact',
})).workerLeaseClaim
assert.equal(
  dependentChartClaim.lease.dependencyAuthority.state,
  'private_test_dependencies_verified',
)
assert.equal(dependentChartClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
const dependentLeaseAuthority = {
  leaseId: dependentChartClaim.lease.leaseId,
  leaseCredential: dependentChartClaim.leaseCredential,
}
const dependentDispatchInput = {
  ...baseInput,
  jobId: dependentChartJob.id,
  approvedWorkItemId: dependentChartWorkItem.id,
  expectedAssetId: dependentChartAsset.id,
  idempotencyKey: 'authorize-dependent-chart',
}
const dependencyArtifactPath = join(
  localStorageRoot,
  canonicalInternalAuthorityArtifactRelativePath(validationRun.result.privateObjectIdentityHash),
)
const dependencyArtifactBytes = await readFile(dependencyArtifactPath)
try {
  await writeFile(
    dependencyArtifactPath,
    Buffer.concat([dependencyArtifactBytes, Buffer.from('tampered-dependency-authority')]),
  )
  await expectApiError(
    () => dispatchService.authorize({
      ...dependentDispatchInput,
      idempotencyKey: 'tampered-dependent-chart-artifact',
    }, dependentLeaseAuthority),
    'JOB_DEPENDENCY_NOT_READY',
  )
} finally {
  await writeFile(dependencyArtifactPath, dependencyArtifactBytes)
}
const dependentGrant = (await dispatchService.authorize(
  dependentDispatchInput,
  dependentLeaseAuthority,
)).toolDispatchGrant
assert.equal(dependentGrant.grant.status, 'denied')
assert.equal(
  dependentGrant.grant.binding.leaseDependencyAuthority.state,
  'private_test_dependencies_verified',
)
assert.equal(dependentGrant.grant.binding.leaseDependencyAuthority.selectedArtifactCount, 1)
assert.equal(
  dependentGrant.grant.binding.leaseDependencyAuthority.selectedArtifactsHash,
  sha256AuthorityValue(dependentChartClaim.lease.dependencyAuthority.selectedArtifacts),
)
assert.equal(
  dependentGrant.grant.binding.leaseDependencyAuthority.authorityHash,
  dependentChartClaim.lease.dependencyAuthority.authorityHash,
)
assert.equal(dependentGrant.grant.binding.leaseExecutionFenceState, 'not_started')

const deniedConsumptionInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  grantId: primaryGrant.grant.grantId,
  purpose: 'private_internal_canonical_tool_dispatch_consume' as const,
  idempotencyKey: 'consume-denied-chart-grant',
}
const deniedConsumptionAttempts = await Promise.allSettled([
  dispatchService.consume(deniedConsumptionInput, {
    ...chartLeaseAuthority,
    dispatchCredential: `rpdt_v1_${'A'.repeat(43)}`,
  }),
  dispatchService.consume(deniedConsumptionInput, {
    ...chartLeaseAuthority,
    dispatchCredential: `rpdt_v1_${'A'.repeat(43)}`,
  }),
])
assert.ok(deniedConsumptionAttempts.every((result) =>
  result.status === 'rejected' &&
  result.reason instanceof ApiError &&
  result.reason.code === 'TOOL_NOT_READY'))
proveConsumptionReplayResponseSemantics()

let dispatchAggregate = await requireDispatchAggregate()
assert.equal(dispatchAggregate.grants.length, 3)
assert.equal(dispatchAggregate.idempotencyRecords.length, 3)
assert.equal(dispatchAggregate.auditEvents.length, 3)
assert.ok(dispatchAggregate.grants.every((record) =>
  record.status === 'denied' &&
  record.credentialHashSha256 === undefined &&
  record.blockers.length > 0))
const persistedPath = dispatchAggregatePath()
const persistedText = await readFile(persistedPath, 'utf8')
assert.equal(persistedText.includes(chartClaim.leaseCredential), false)
assert.equal(persistedText.includes(strongInternalSecret), false)
assert.equal(persistedText.includes(baseInput.idempotencyKey), false)

clearPrivateCanonicalToolDispatchProcessStateForSmoke()
dispatchAggregate = await requireDispatchAggregate()
assert.equal(dispatchAggregate.grants.length, 3)
const restartReplay = await dispatchService.authorize(baseInput, chartLeaseAuthority)
assert.deepEqual(restartReplay.toolDispatchGrant, primaryGrant)

const startedChartExecution = await leaseService.beginInternalExecution({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  leaseId: chartClaim.lease.leaseId,
  leaseCredential: chartClaim.leaseCredential,
  runnerClass: 'dispatch_fence_smoke_runner_v1',
})
assert.equal(startedChartExecution.executionFence.state, 'started')
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    idempotencyKey: 'started-lease-cannot-get-fresh-dispatch-decision',
  }, chartLeaseAuthority),
  'WORKER_LEASE_EXPIRED',
)
const completedChartExecution = await leaseService.completeInternalExecution({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  leaseId: chartClaim.lease.leaseId,
  leaseCredential: chartClaim.leaseCredential,
  runnerClass: 'dispatch_fence_smoke_runner_v1',
  executionAttemptId: startedChartExecution.executionFence.executionAttemptId,
})
assert.equal(completedChartExecution.executionFence.state, 'completed')
await expectApiError(
  () => dispatchService.authorize({
    ...baseInput,
    idempotencyKey: 'completed-lease-cannot-get-fresh-dispatch-decision',
  }, chartLeaseAuthority),
  'WORKER_LEASE_EXPIRED',
)

await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  leaseId: chartClaim.lease.leaseId,
  leaseCredential: chartClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-completed-chart-attempt-one',
})
const privateRuntime = await createPrivateOfflineNodeStructuredExecutionRuntime()
const authorizedChartClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-chart-root-for-authorized-dispatch-attempt-two',
})).workerLeaseClaim
assert.equal(authorizedChartClaim.lease.attemptNumber, 2)
const authorizedChartLeaseAuthority = {
  leaseId: authorizedChartClaim.lease.leaseId,
  leaseCredential: authorizedChartClaim.leaseCredential,
}
const authorizedGrant = (await dispatchService.authorize({
  ...baseInput,
  idempotencyKey: 'authorize-chart-primary-attempt-two',
}, authorizedChartLeaseAuthority)).toolDispatchGrant
assert.equal(authorizedGrant.grant.status, 'authorized')
assert.equal(authorizedGrant.grant.credentialIssued, true)
assert.equal(authorizedGrant.executionAuthority.dispatchAuthorized, true)
assert.equal(authorizedGrant.executionAuthority.toolExecutionAuthorized, false)
assert.equal(authorizedGrant.evidence.specPrivateInternalReady, true)
assert.equal(authorizedGrant.evidence.runtimePrivateInternalReady, true)
assert.equal(authorizedGrant.evidence.specProductReady, false)
assert.equal(authorizedGrant.evidence.runtimeProductReady, false)
assert.equal(
  authorizedGrant.evidence.privateRuntimeImageIdentityHash,
  privateRuntime.image.imageIdentityHash,
)
assert.match(authorizedGrant.dispatchCredential ?? '', /^rpdt_v1_[A-Za-z0-9_-]{43}$/)

const coordinatedExecution = await createCanonicalPrivateStructuredToolExecutionService(context).execute({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  grantId: authorizedGrant.grant.grantId,
  purpose: 'execute_canonical_private_structured_tool',
  idempotencyKey: 'consume-authorized-chart-primary-attempt-two',
}, {
  ...authorizedChartLeaseAuthority,
  dispatchCredential: authorizedGrant.dispatchCredential!,
})
assert.equal(coordinatedExecution.tool.canonicalToolId, 'd3')
assert.equal(coordinatedExecution.tool.operationId, d3OperationId)
assert.equal(coordinatedExecution.tool.actualLibraryOperationCompleted, true)
assert.equal(coordinatedExecution.runtime.imageIdentityHash, privateRuntime.image.imageIdentityHash)
assert.equal(coordinatedExecution.runtime.privateInternalOnly, true)
assert.equal(coordinatedExecution.runtime.productReady, false)
assert.equal(coordinatedExecution.runtime.externalBetaReady, false)
assert.equal(coordinatedExecution.runtime.productionReady, false)
assert.equal(coordinatedExecution.result.contentType, 'image/svg+xml')
assert.equal(coordinatedExecution.result.qaOutcome, 'passed')
assert.equal(coordinatedExecution.result.privateTestDependencySatisfied, true)
assert.equal(coordinatedExecution.result.finalRenderAuthorized, false)
assert.equal(coordinatedExecution.persistence.actualRunEvidenceVerified, true)
assert.equal(coordinatedExecution.persistence.actualQaEvidenceVerified, true)
assert.equal(coordinatedExecution.lease.executionAttemptId.length > 0, true)
const coordinatedReplay = await createCanonicalPrivateStructuredToolExecutionService(context).execute({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  grantId: authorizedGrant.grant.grantId,
  purpose: 'execute_canonical_private_structured_tool',
  idempotencyKey: 'consume-authorized-chart-primary-attempt-two',
}, {
  ...authorizedChartLeaseAuthority,
  dispatchCredential: authorizedGrant.dispatchCredential!,
})
assert.equal(coordinatedReplay.result.artifactId, coordinatedExecution.result.artifactId)
assert.equal(coordinatedReplay.result.sha256, coordinatedExecution.result.sha256)
assert.equal(coordinatedReplay.lease.executionAttemptId, coordinatedExecution.lease.executionAttemptId)
assert.equal(coordinatedReplay.replay.dispatchConsumptionReplayed, true)
assert.equal(coordinatedReplay.replay.executionFenceBeginReplayed, true)
assert.equal(coordinatedReplay.replay.executionFenceCompleteReplayed, true)
assert.equal(coordinatedReplay.replay.artifactRecordReplayed, true)
assert.equal(coordinatedReplay.replay.qaRecordReplayed, true)
assert.equal(coordinatedReplay.replay.reconciliationReplayed, true)
const sharpClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sharpJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-sharp-root-after-chart-svg',
})).workerLeaseClaim
assert.equal(sharpClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
const sharpLeaseAuthority = {
  leaseId: sharpClaim.lease.leaseId,
  leaseCredential: sharpClaim.leaseCredential,
}
const sharpGrant = (await dispatchService.authorize({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sharpJob.id, approvedWorkItemId: sharpWorkItem.id,
  expectedAssetId: sharpAsset.id, requestedToolName: 'sharp',
  operationId: 'tool.sharp.prepare_approved_image_asset.v1',
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: 'authorize-sharp-root-attempt-one',
}, sharpLeaseAuthority)).toolDispatchGrant
assert.equal(sharpGrant.grant.status, 'authorized')
assert.equal(sharpGrant.evidence.specPrivateInternalReady, true)
assert.equal(sharpGrant.evidence.runtimePrivateInternalReady, true)
assert.ok(sharpGrant.dispatchCredential)
const sharpExecutionInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sharpJob.id, grantId: sharpGrant.grant.grantId,
  purpose: 'execute_canonical_private_sharp_tool' as const,
  idempotencyKey: 'consume-authorized-sharp-root-attempt-one',
}
const sharpExecutionAuthority = {
  ...sharpLeaseAuthority,
  dispatchCredential: sharpGrant.dispatchCredential!,
}
const coordinatedSharp = await createCanonicalPrivateSharpExecutionService(context).execute(
  sharpExecutionInput,
  sharpExecutionAuthority,
)
assert.equal(coordinatedSharp.tool.canonicalToolId, 'sharp')
assert.equal(coordinatedSharp.tool.dependencyArtifactRead, true)
assert.equal(coordinatedSharp.tool.sourceArtifactId, coordinatedExecution.result.artifactId)
assert.equal(coordinatedSharp.result.contentType, 'image/png')
assert.equal(coordinatedSharp.result.qaOutcome, 'passed')
assert.equal(coordinatedSharp.runtime.productReady, false)
const coordinatedSharpReplay = await createCanonicalPrivateSharpExecutionService(context).execute(
  sharpExecutionInput,
  sharpExecutionAuthority,
)
assert.equal(coordinatedSharpReplay.result.artifactId, coordinatedSharp.result.artifactId)
assert.equal(coordinatedSharpReplay.result.sha256, coordinatedSharp.result.sha256)
assert.equal(coordinatedSharpReplay.replay.dispatchConsumptionReplayed, true)
assert.equal(coordinatedSharpReplay.replay.executionFenceBeginReplayed, true)
assert.equal(coordinatedSharpReplay.replay.executionFenceCompleteReplayed, true)
const sharpProofClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sharpProofJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-sharp-proof-after-image-reconciliation',
})).workerLeaseClaim
assert.equal(sharpProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(sharpProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId, coordinatedSharp.result.artifactId)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sharpProofJob.id, leaseId: sharpProofClaim.lease.leaseId,
  leaseCredential: sharpProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-sharp-proof-verification-lease',
})
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sharpJob.id, leaseId: sharpClaim.lease.leaseId,
  leaseCredential: sharpClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-completed-sharp-root-attempt-one',
})
const chartProofClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartProofJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-chart-proof-after-structured-svg-reconciliation',
})).workerLeaseClaim
assert.equal(chartProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(chartProofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(
  chartProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId,
  coordinatedExecution.result.artifactId,
)
assert.equal(
  chartProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.contentSha256,
  coordinatedExecution.result.sha256,
)
const dependencyReadBegin = await leaseService.beginInternalExecution({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartProofJob.id,
  leaseId: chartProofClaim.lease.leaseId,
  leaseCredential: chartProofClaim.leaseCredential,
  runnerClass: 'canonical_dependency_read_probe_v1',
})
const dependencyRead = await createCanonicalPrivateDependencyArtifactReadService(context)
  .readSingleSelectedArtifact({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    snapshotId: snapshot.snapshotId,
    currentJobId: chartProofJob.id,
    currentApprovedWorkItemId: chartProofWorkItem.id,
    leaseId: chartProofClaim.lease.leaseId,
    leaseCredential: chartProofClaim.leaseCredential,
    executionAttemptId: dependencyReadBegin.executionFence.executionAttemptId,
    dispatchGrantId: authorizedGrant.grant.grantId,
    dependencyAuthority: chartProofClaim.lease.dependencyAuthority,
    allowedContentTypes: ['image/svg+xml'],
    maximumBytes: 2 * 1024 * 1024,
  })
assert.equal(dependencyRead.contentType, 'image/svg+xml')
assert.equal(dependencyRead.artifactId, coordinatedExecution.result.artifactId)
assert.equal(dependencyRead.sha256, coordinatedExecution.result.sha256)
assert.ok(dependencyRead.bytes.toString('utf8').startsWith('<svg'))
assert.match(dependencyRead.dependencyReadEvidenceHash, /^[a-f0-9]{64}$/)
await leaseService.completeInternalExecution({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartProofJob.id,
  leaseId: chartProofClaim.lease.leaseId,
  leaseCredential: chartProofClaim.leaseCredential,
  runnerClass: 'canonical_dependency_read_probe_v1',
  executionAttemptId: dependencyReadBegin.executionFence.executionAttemptId,
})
await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartProofJob.id,
  leaseId: chartProofClaim.lease.leaseId,
  leaseCredential: chartProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-chart-proof-verification-lease',
})
await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  leaseId: authorizedChartClaim.lease.leaseId,
  leaseCredential: authorizedChartClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-completed-chart-attempt-two',
})

const privatePythonRuntime = await createPrivateOfflinePythonStructuredExecutionRuntime()
const dataClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-data-root-for-python-dispatch',
})).workerLeaseClaim
const dataLeaseAuthority = {
  leaseId: dataClaim.lease.leaseId,
  leaseCredential: dataClaim.leaseCredential,
}
const dataGrant = (await dispatchService.authorize({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  approvedWorkItemId: dataWorkItem.id,
  expectedAssetId: dataAsset.id,
  requestedToolName: 'duckdb',
  operationId: duckdbOperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: 'authorize-data-root-duckdb-attempt-one',
}, dataLeaseAuthority)).toolDispatchGrant
assert.equal(dataGrant.grant.status, 'authorized')
assert.equal(dataGrant.evidence.specPrivateInternalReady, true)
assert.equal(dataGrant.evidence.runtimePrivateInternalReady, true)
assert.equal(dataGrant.evidence.specProductReady, false)
assert.equal(dataGrant.evidence.runtimeProductReady, false)
assert.equal(
  dataGrant.evidence.privateRuntimeImageIdentityHash,
  privatePythonRuntime.image.imageIdentityHash,
)
assert.ok(dataGrant.dispatchCredential)
const dataExecutionInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  grantId: dataGrant.grant.grantId,
  purpose: 'execute_canonical_private_python_tool' as const,
  idempotencyKey: 'consume-authorized-data-root-duckdb-attempt-one',
}
const dataExecutionAuthority = {
  ...dataLeaseAuthority,
  dispatchCredential: dataGrant.dispatchCredential!,
}
const coordinatedData = await createCanonicalPrivatePythonToolExecutionService(context).execute(
  dataExecutionInput,
  dataExecutionAuthority,
)
assert.equal(coordinatedData.tool.canonicalToolId, 'duckdb')
assert.equal(coordinatedData.tool.operationId, duckdbOperationId)
assert.equal(coordinatedData.tool.actualLibraryOperationCompleted, true)
assert.equal(coordinatedData.runtime.imageIdentityHash, privatePythonRuntime.image.imageIdentityHash)
assert.equal(coordinatedData.runtime.productReady, false)
assert.equal(coordinatedData.result.contentType, 'application/json')
assert.equal(coordinatedData.result.qaOutcome, 'passed')
assert.equal(coordinatedData.persistence.actualRunEvidenceVerified, true)
assert.equal(coordinatedData.persistence.actualQaEvidenceVerified, true)
const coordinatedDataReplay = await createCanonicalPrivatePythonToolExecutionService(context).execute(
  dataExecutionInput,
  dataExecutionAuthority,
)
assert.equal(coordinatedDataReplay.result.artifactId, coordinatedData.result.artifactId)
assert.equal(coordinatedDataReplay.result.sha256, coordinatedData.result.sha256)
assert.equal(coordinatedDataReplay.replay.dispatchConsumptionReplayed, true)
assert.equal(coordinatedDataReplay.replay.executionFenceBeginReplayed, true)
assert.equal(coordinatedDataReplay.replay.executionFenceCompleteReplayed, true)
assert.equal(coordinatedDataReplay.replay.artifactRecordReplayed, true)
assert.equal(coordinatedDataReplay.replay.qaRecordReplayed, true)
assert.equal(coordinatedDataReplay.replay.reconciliationReplayed, true)
const dataProofClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataProofJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-data-proof-after-python-json-reconciliation',
})).workerLeaseClaim
assert.equal(dataProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(dataProofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(
  dataProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId,
  coordinatedData.result.artifactId,
)
await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataProofJob.id,
  leaseId: dataProofClaim.lease.leaseId,
  leaseCredential: dataProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-data-proof-verification-lease',
})
await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  leaseId: dataClaim.lease.leaseId,
  leaseCredential: dataClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-completed-data-root-attempt-one',
})

const mediaClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: mediaJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-media-root-for-python-dispatch',
})).workerLeaseClaim
const mediaLeaseAuthority = {
  leaseId: mediaClaim.lease.leaseId,
  leaseCredential: mediaClaim.leaseCredential,
}
const mediaGrant = (await dispatchService.authorize({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: mediaJob.id,
  approvedWorkItemId: mediaWorkItem.id,
  expectedAssetId: mediaAsset.id,
  requestedToolName: 'pyav',
  operationId: pyavOperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: 'authorize-media-root-pyav-attempt-one',
}, mediaLeaseAuthority)).toolDispatchGrant
assert.equal(mediaGrant.grant.status, 'authorized')
assert.equal(mediaGrant.evidence.specPrivateInternalReady, true)
assert.equal(mediaGrant.evidence.runtimePrivateInternalReady, true)
assert.ok(mediaGrant.dispatchCredential)
const mediaExecutionInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: mediaJob.id,
  grantId: mediaGrant.grant.grantId,
  purpose: 'execute_canonical_private_python_tool' as const,
  idempotencyKey: 'consume-authorized-media-root-pyav-attempt-one',
}
const mediaExecutionAuthority = {
  ...mediaLeaseAuthority,
  dispatchCredential: mediaGrant.dispatchCredential!,
}
const coordinatedMedia = await createCanonicalPrivatePythonToolExecutionService(context).execute(
  mediaExecutionInput,
  mediaExecutionAuthority,
)
assert.equal(coordinatedMedia.tool.canonicalToolId, 'pyav')
assert.equal(coordinatedMedia.tool.operationId, pyavOperationId)
assert.equal(coordinatedMedia.tool.sourceObjectRead, true)
assert.match(coordinatedMedia.tool.sourceReadEvidenceHash ?? '', /^[a-f0-9]{64}$/)
assert.equal(coordinatedMedia.tool.sourceSequenceItemId, mediaSourceItem.sourceSequenceItemId)
assert.match(coordinatedMedia.tool.sourceBindingHash ?? '', /^[a-f0-9]{64}$/)
assert.equal(coordinatedMedia.result.qaOutcome, 'passed')
assert.equal(coordinatedMedia.persistence.actualRunEvidenceVerified, true)
assert.equal(coordinatedMedia.permissions.sourceObjectRead, false)
const coordinatedMediaReplay = await createCanonicalPrivatePythonToolExecutionService(context).execute(
  mediaExecutionInput,
  mediaExecutionAuthority,
)
assert.equal(coordinatedMediaReplay.result.artifactId, coordinatedMedia.result.artifactId)
assert.equal(coordinatedMediaReplay.result.sha256, coordinatedMedia.result.sha256)
assert.equal(coordinatedMediaReplay.replay.dispatchConsumptionReplayed, true)
assert.equal(coordinatedMediaReplay.replay.executionFenceBeginReplayed, true)
assert.equal(coordinatedMediaReplay.replay.executionFenceCompleteReplayed, true)
const mediaProofClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: mediaProofJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-media-proof-after-python-reconciliation',
})).workerLeaseClaim
assert.equal(mediaProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(mediaProofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(
  mediaProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId,
  coordinatedMedia.result.artifactId,
)
await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: mediaProofJob.id,
  leaseId: mediaProofClaim.lease.leaseId,
  leaseCredential: mediaProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-media-proof-verification-lease',
})
await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: mediaJob.id,
  leaseId: mediaClaim.lease.leaseId,
  leaseCredential: mediaClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-completed-media-root-attempt-one',
})

const audioRuns = [
  {
    toolName: 'scipy', operationId: scipyOperationId, workItem: scipyWorkItem,
    job: scipyJob, asset: scipyAsset, proofJob: scipyProofJob, expectedContentType: 'application/json',
  },
  {
    toolName: 'pyloudnorm', operationId: pyloudnormOperationId, workItem: loudnessWorkItem,
    job: loudnessJob, asset: loudnessAsset, proofJob: loudnessProofJob, expectedContentType: 'application/json',
  },
  {
    toolName: 'pydub', operationId: pydubOperationId, workItem: pydubWorkItem,
    job: pydubJob, asset: pydubAsset, proofJob: pydubProofJob, expectedContentType: 'audio/wav',
  },
  {
    toolName: 'pydub_effects', operationId: pydubEffectsOperationId, workItem: pydubEffectsWorkItem,
    job: pydubEffectsJob, asset: pydubEffectsAsset,
    proofJob: pydubEffectsProofJob, expectedContentType: 'audio/wav',
  },
  {
    toolName: 'ebu_r128_pyloudnorm', operationId: ebuR128OperationId, workItem: ebuR128WorkItem,
    job: ebuR128Job, asset: ebuR128Asset, proofJob: ebuR128ProofJob,
    expectedContentType: 'application/json',
  },
  {
    toolName: 'audioread', operationId: audioreadOperationId, workItem: audioreadWorkItem,
    job: audioreadJob, asset: audioreadAsset, proofJob: audioreadProofJob,
    expectedContentType: 'application/json',
  },
  {
    toolName: 'resampy', operationId: resampyOperationId, workItem: resampyWorkItem,
    job: resampyJob, asset: resampyAsset, proofJob: resampyProofJob,
    expectedContentType: 'audio/wav',
  },
  {
    toolName: 'pedalboard', operationId: pedalboardOperationId, workItem: pedalboardWorkItem,
    job: pedalboardJob, asset: pedalboardAsset, proofJob: pedalboardProofJob,
    expectedContentType: 'audio/wav',
  },
  {
    toolName: 'mir_eval', operationId: mirEvalOperationId, workItem: mirEvalWorkItem,
    job: mirEvalJob, asset: mirEvalAsset, proofJob: mirEvalProofJob,
    expectedContentType: 'application/json',
  },
  {
    toolName: 'mido', operationId: midoOperationId, workItem: midoWorkItem,
    job: midoJob, asset: midoAsset, proofJob: midoProofJob,
    expectedContentType: 'application/json',
  },
] as const
for (const audioRun of audioRuns) {
  const claim = (await leaseService.claim({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: audioRun.job.id, purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: `claim-${audioRun.toolName}-audio-root`,
  })).workerLeaseClaim
  const leaseAuthority = { leaseId: claim.lease.leaseId, leaseCredential: claim.leaseCredential }
  const grant: Awaited<ReturnType<typeof dispatchService.authorize>>['toolDispatchGrant'] =
    (await dispatchService.authorize({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: audioRun.job.id, approvedWorkItemId: audioRun.workItem.id,
    expectedAssetId: audioRun.asset.id, requestedToolName: audioRun.toolName,
    operationId: audioRun.operationId,
    purpose: 'private_internal_canonical_tool_dispatch_authorization',
    idempotencyKey: `authorize-${audioRun.toolName}-audio-root`,
    }, leaseAuthority)).toolDispatchGrant
  assert.equal(grant.grant.status, 'authorized')
  assert.equal(grant.evidence.specPrivateInternalReady, true)
  assert.equal(grant.evidence.runtimePrivateInternalReady, true)
  assert.ok(grant.dispatchCredential)
  const executionInput = {
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: audioRun.job.id, grantId: grant.grant.grantId,
    purpose: 'execute_canonical_private_python_tool' as const,
    idempotencyKey: `consume-${audioRun.toolName}-audio-root`,
  }
  const executionAuthority = { ...leaseAuthority, dispatchCredential: grant.dispatchCredential }
  const coordinated = await createCanonicalPrivatePythonToolExecutionService(context).execute(
    executionInput, executionAuthority,
  )
  assert.equal(coordinated.tool.canonicalToolId, audioRun.toolName)
  assert.equal(coordinated.tool.operationId, audioRun.operationId)
  assert.equal(coordinated.tool.sourceObjectRead, true)
  assert.equal(coordinated.tool.sourceSequenceItemId, mediaSourceItem.sourceSequenceItemId)
  assert.equal(coordinated.result.contentType, audioRun.expectedContentType)
  assert.equal(coordinated.result.qaOutcome, 'passed')
  assert.equal(coordinated.result.privateTestDependencySatisfied, true)
  assert.equal(coordinated.persistence.actualRunEvidenceVerified, true)
  assert.equal(coordinated.persistence.actualQaEvidenceVerified, true)
  const replay = await createCanonicalPrivatePythonToolExecutionService(context).execute(
    executionInput, executionAuthority,
  )
  assert.equal(replay.result.artifactId, coordinated.result.artifactId)
  assert.equal(replay.result.sha256, coordinated.result.sha256)
  assert.equal(replay.replay.dispatchConsumptionReplayed, true)
  assert.equal(replay.replay.executionFenceBeginReplayed, true)
  assert.equal(replay.replay.executionFenceCompleteReplayed, true)
  assert.equal(replay.replay.artifactRecordReplayed, true)
  assert.equal(replay.replay.qaRecordReplayed, true)
  assert.equal(replay.replay.reconciliationReplayed, true)
  const proofClaim: Awaited<ReturnType<typeof leaseService.claim>>['workerLeaseClaim'] =
    (await leaseService.claim({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: audioRun.proofJob.id, purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: `claim-${audioRun.toolName}-proof-after-reconciliation`,
    })).workerLeaseClaim
  assert.equal(proofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
  assert.equal(proofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
  assert.equal(proofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId, coordinated.result.artifactId)
  await leaseService.release({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: audioRun.proofJob.id, leaseId: proofClaim.lease.leaseId,
    leaseCredential: proofClaim.leaseCredential, purpose: 'private_internal_canonical_lease_release',
    idempotencyKey: `release-${audioRun.toolName}-proof-verification-lease`,
  })
  await leaseService.release({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: audioRun.job.id, leaseId: claim.lease.leaseId,
    leaseCredential: claim.leaseCredential, purpose: 'private_internal_canonical_lease_release',
    idempotencyKey: `release-${audioRun.toolName}-completed-audio-root`,
  })
}

await prepareOfflineBrowserGraphicsDockerRuntime()
await activatePrivateOfflineBrowserGraphicsRuntime()
await prepareOfflineAiCapabilityDockerRuntime()
await activatePrivateOfflineAiCapabilityRuntime()
await prepareOfflineNativeImagePipelineDockerRuntime()
await activatePrivateOfflineNativeImagePipelineRuntime()
await prepareOfflineNativeAudioProcessingDockerRuntime()
await activatePrivateOfflineNativeAudioProcessingRuntime()
await prepareOfflineContainerPackagingValidationDockerRuntime()
await activatePrivateOfflineContainerPackagingValidationRuntime()
await prepareOfflineVapourSynthFramePipelineDockerRuntime()
await activatePrivateOfflineVapourSynthFramePipelineRuntime()
await prepareOfflineAudioFluxAnalysisDockerRuntime()
await activatePrivateOfflineAudioFluxAnalysisRuntime()
await prepareOfflineRembgBackgroundRemovalDockerRuntime()
await activatePrivateOfflineRembgBackgroundRemovalRuntime()
await prepareOfflineDeepFilterNetVoiceCleanupDockerRuntime()
await activatePrivateOfflineDeepFilterNetVoiceCleanupRuntime()

const adapterMatrixRun = matrixRuns[0]
assert.ok(adapterMatrixRun)
const jobExecutionAdapter = createCanonicalPrivateJobExecutionAdapterService(context)
await expectApiError(
  () => jobExecutionAdapter.execute({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: adapterMatrixRun.job.id,
    purpose: 'execute_canonical_private_job',
    idempotencyKey: 'canonical-job-adapter-rejects-caller-tool',
    requestedToolName: adapterMatrixRun.toolId,
  } as never),
  'VALIDATION_FAILED',
)
const adapterRequest = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: adapterMatrixRun.job.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-echarts-root',
}
const concurrentAdapterExecutions = await Promise.all([
  jobExecutionAdapter.execute(adapterRequest),
  jobExecutionAdapter.execute(adapterRequest),
])
const adapterExecution = concurrentAdapterExecutions.find((result) =>
  result.evidence.idempotentAdapterReplay === false)
const concurrentAdapterReplay = concurrentAdapterExecutions.find((result) =>
  result.evidence.idempotentAdapterReplay === true)
assert.ok(adapterExecution)
assert.ok(concurrentAdapterReplay)
assert.equal(concurrentAdapterReplay.result.artifactId, adapterExecution.result.artifactId)
assert.equal(adapterExecution.identity.canonicalToolId, adapterMatrixRun.toolId)
assert.equal(adapterExecution.identity.operationId, adapterMatrixRun.operationId)
assert.equal(adapterExecution.identity.expectedAssetId, adapterMatrixRun.asset.id)
assert.equal(adapterExecution.identity.runnerClass, 'offline_node_structured_execution_v1')
assert.equal(adapterExecution.result.contentType, adapterMatrixRun.expectedContentType)
assert.equal(adapterExecution.result.qaOutcome, 'passed')
assert.equal(adapterExecution.result.privateTestDependencySatisfied, true)
assert.equal(adapterExecution.evidence.serverDerivedCanonicalJob, true)
assert.equal(adapterExecution.evidence.serverDerivedToolAndOperation, true)
assert.equal(adapterExecution.evidence.singleUseDispatchConsumed, true)
assert.equal(adapterExecution.evidence.idempotentAdapterReplay, false)
assert.equal(adapterExecution.readiness.privateInternalJobExecutionReady, true)
assert.equal(adapterExecution.readiness.productReady, false)
const adapterReplay = await jobExecutionAdapter.execute(adapterRequest)
assert.equal(adapterReplay.result.artifactId, adapterExecution.result.artifactId)
assert.equal(adapterReplay.result.sha256, adapterExecution.result.sha256)
assert.equal(adapterReplay.evidence.idempotentAdapterReplay, true)
const alternateKeyAdapterReplay = await jobExecutionAdapter.execute({
  ...adapterRequest,
  idempotencyKey: 'canonical-job-adapter-echarts-alternate-key',
})
assert.equal(alternateKeyAdapterReplay.result.artifactId, adapterExecution.result.artifactId)
assert.equal(alternateKeyAdapterReplay.result.sha256, adapterExecution.result.sha256)
assert.equal(alternateKeyAdapterReplay.evidence.idempotentAdapterReplay, true)
await expectApiError(
  () => jobExecutionAdapter.execute({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: matrixRuns[1]!.job.id,
    purpose: 'execute_canonical_private_job',
    idempotencyKey: 'canonical-job-adapter-echarts-root',
  }),
  'IDEMPOTENCY_CONFLICT',
)
const adapterProofClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: adapterMatrixRun.proofJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-echarts-proof-after-job-adapter',
})).workerLeaseClaim
assert.equal(adapterProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(adapterProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId, adapterExecution.result.artifactId)
await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: adapterMatrixRun.proofJob.id,
  leaseId: adapterProofClaim.lease.leaseId,
  leaseCredential: adapterProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-echarts-proof-after-job-adapter',
})

for (const matrixRun of matrixRuns.slice(1)) {
  const claim = (await leaseService.claim({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: matrixRun.job.id, purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: `claim-${matrixRun.toolId}-matrix-root`,
  })).workerLeaseClaim
  const leaseAuthority = { leaseId: claim.lease.leaseId, leaseCredential: claim.leaseCredential }
  const grant: Awaited<ReturnType<typeof dispatchService.authorize>>['toolDispatchGrant'] =
    (await dispatchService.authorize({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: matrixRun.job.id, approvedWorkItemId: matrixRun.workItem.id,
    expectedAssetId: matrixRun.asset.id, requestedToolName: matrixRun.toolId,
    operationId: matrixRun.operationId,
    purpose: 'private_internal_canonical_tool_dispatch_authorization',
    idempotencyKey: `authorize-${matrixRun.toolId}-matrix-root`,
    }, leaseAuthority)).toolDispatchGrant
  assert.equal(grant.grant.status, 'authorized')
  assert.equal(grant.evidence.specPrivateInternalReady, true)
  assert.equal(grant.evidence.runtimePrivateInternalReady, true)
  assert.ok(grant.dispatchCredential)
  const executionAuthority = { ...leaseAuthority, dispatchCredential: grant.dispatchCredential }
  let coordinatedArtifactId: string
  let coordinatedSha256: string
  if (matrixRun.runnerKind === 'node') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_structured_tool' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateStructuredToolExecutionService(context).execute(
      executionInput, executionAuthority,
    )
    assert.equal(coordinated.tool.canonicalToolId, matrixRun.toolId)
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, matrixRun.expectedContentType)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    const replay = await createCanonicalPrivateStructuredToolExecutionService(context).execute(
      executionInput, executionAuthority,
    )
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else if (matrixRun.runnerKind === 'browser') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_browser_graphic' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateBrowserGraphicsExecutionService(context).execute(
      executionInput, executionAuthority,
    )
    assert.equal(coordinated.tool.canonicalToolId, matrixRun.toolId)
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, 'image/png')
    assert.equal(coordinated.result.width, 640)
    assert.equal(coordinated.result.height, 360)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    assert.equal(coordinated.runtime.zeroNetworkVerified, true)
    assert.equal(coordinated.runtime.decodedNonFlatPngVerified, true)
    const replay = await createCanonicalPrivateBrowserGraphicsExecutionService(context).execute(
      executionInput, executionAuthority,
    )
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    assert.equal(replay.replay.artifactRecordReplayed, true)
    assert.equal(replay.replay.qaRecordReplayed, true)
    assert.equal(replay.replay.reconciliationReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else if (matrixRun.runnerKind === 'ai') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_ai_capability' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateAiCapabilityExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(coordinated.tool.canonicalToolId, matrixRun.toolId)
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, matrixRun.expectedContentType)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    assert.equal(coordinated.tool.approvedServerOwnedFixtureOnly, true)
    assert.equal(coordinated.tool.modelWeightsLoaded, false)
    const replay = await createCanonicalPrivateAiCapabilityExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    assert.equal(replay.replay.artifactRecordReplayed, true)
    assert.equal(replay.replay.qaRecordReplayed, true)
    assert.equal(replay.replay.reconciliationReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else if (matrixRun.runnerKind === 'native_image') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_native_image_pipeline' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateNativeImagePipelineExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(coordinated.tool.canonicalToolId, matrixRun.toolId)
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, 'image/png')
    assert.equal(coordinated.result.width, 64)
    assert.equal(coordinated.result.height, 64)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    assert.equal(coordinated.tool.licenseReviewStillRequiredForProduction, true)
    const replay = await createCanonicalPrivateNativeImagePipelineExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    assert.equal(replay.replay.artifactRecordReplayed, true)
    assert.equal(replay.replay.qaRecordReplayed, true)
    assert.equal(replay.replay.reconciliationReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else if (matrixRun.runnerKind === 'native_audio') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_native_audio_processing' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateNativeAudioProcessingExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(coordinated.tool.canonicalToolId, matrixRun.toolId)
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, 'audio/wav')
    assert.equal(coordinated.result.sampleRate, 48000)
    assert.equal(coordinated.result.channelCount, 1)
    assert.equal(coordinated.result.frameCount, matrixRun.toolId === 'rnnoise' ? 47520 : 60000)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    assert.equal(coordinated.tool.licenseReviewStillRequiredForProduction, true)
    const replay = await createCanonicalPrivateNativeAudioProcessingExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    assert.equal(replay.replay.artifactRecordReplayed, true)
    assert.equal(replay.replay.qaRecordReplayed, true)
    assert.equal(replay.replay.reconciliationReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else if (matrixRun.runnerKind === 'packaging') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_container_packaging_validation' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateContainerPackagingValidationExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(coordinated.tool.canonicalToolId, matrixRun.toolId)
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, 'application/json')
    assert.equal(coordinated.result.container, matrixRun.toolId === 'mkvtoolnix_container_validation' ? 'mkv' : 'mp4')
    assert.equal(coordinated.result.trackCount, 3)
    assert.equal(coordinated.result.videoTrackVerified, true)
    assert.equal(coordinated.result.audioTrackVerified, true)
    assert.equal(coordinated.result.captionTrackVerified, true)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    assert.equal(coordinated.tool.licenseReviewStillRequiredForProduction, true)
    const replay = await createCanonicalPrivateContainerPackagingValidationExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    assert.equal(replay.replay.artifactRecordReplayed, true)
    assert.equal(replay.replay.qaRecordReplayed, true)
    assert.equal(replay.replay.reconciliationReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else if (matrixRun.runnerKind === 'vapoursynth') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_vapoursynth_frame_pipeline' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateVapourSynthFramePipelineExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(coordinated.tool.canonicalToolId, 'vapoursynth')
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, 'application/json')
    assert.equal(coordinated.result.frameCount, 24)
    assert.equal(coordinated.result.frameRate, 24)
    assert.equal(coordinated.result.width, 64)
    assert.equal(coordinated.result.height, 64)
    assert.equal(coordinated.result.firstAndLastFrameVerified, true)
    assert.equal(coordinated.result.callerScriptAllowed, false)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    const replay = await createCanonicalPrivateVapourSynthFramePipelineExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    assert.equal(replay.replay.artifactRecordReplayed, true)
    assert.equal(replay.replay.qaRecordReplayed, true)
    assert.equal(replay.replay.reconciliationReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else if (matrixRun.runnerKind === 'audioflux') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_audioflux_analysis' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateAudioFluxAnalysisExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(coordinated.tool.canonicalToolId, 'audioflux')
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, 'application/json')
    assert.equal(coordinated.result.sampleRate, 16_000)
    assert.equal(coordinated.result.frameCount, 247)
    assert.equal(coordinated.result.frequencyBins, 257)
    assert.equal(coordinated.result.bftExecuted, true)
    assert.equal(coordinated.result.spectralFluxExecuted, true)
    assert.equal(coordinated.result.spectralEnergyExecuted, true)
    assert.equal(coordinated.result.temporalEnergyExecuted, true)
    assert.equal(coordinated.result.sourceBuiltNativeLibrary, true)
    assert.equal(coordinated.result.callerMediaAllowed, false)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    const replay = await createCanonicalPrivateAudioFluxAnalysisExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    assert.equal(replay.replay.artifactRecordReplayed, true)
    assert.equal(replay.replay.qaRecordReplayed, true)
    assert.equal(replay.replay.reconciliationReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else if (matrixRun.runnerKind === 'rembg') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_rembg_background_removal' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateRembgBackgroundRemovalExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(coordinated.tool.canonicalToolId, 'rembg')
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, 'image/png')
    assert.equal(coordinated.result.width, 128)
    assert.equal(coordinated.result.height, 128)
    assert.equal(coordinated.result.alphaMinimum, 0)
    assert.equal(coordinated.result.alphaMaximum, 255)
    assert.equal(coordinated.result.alphaUniqueValueCount, 160)
    assert.equal(coordinated.result.foregroundAlphaMean, 226.802912)
    assert.equal(coordinated.result.backgroundAlphaMean, 2.492606)
    assert.equal(coordinated.result.foregroundSeparationVerified, true)
    assert.equal(coordinated.runtime.modelSha256, '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8')
    assert.equal(coordinated.result.qaOutcome, 'passed')
    const replay = await createCanonicalPrivateRembgBackgroundRemovalExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    assert.equal(replay.replay.artifactRecordReplayed, true)
    assert.equal(replay.replay.qaRecordReplayed, true)
    assert.equal(replay.replay.reconciliationReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else if (matrixRun.runnerKind === 'deepfilternet') {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_deepfilternet_voice_cleanup' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(coordinated.tool.canonicalToolId, 'deepfilternet')
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, 'audio/wav')
    assert.equal(coordinated.result.sha256, 'a359cf256f9f05294ee7f9701ec189385aed277020b2be5dfa83d229409e27a7')
    assert.equal(coordinated.result.byteLength, 384_214)
    assert.equal(coordinated.result.sampleRate, 48_000)
    assert.equal(coordinated.result.channelCount, 1)
    assert.equal(coordinated.result.frameCount, 192_085)
    assert.equal(coordinated.result.inputSnrDb, 3.217773)
    assert.equal(coordinated.result.outputSnrDb, 8.214627)
    assert(coordinated.result.outputSnrDb > coordinated.result.inputSnrDb)
    assert.equal(coordinated.result.meanAbsoluteDelta, 0.032997789)
    assert.equal(coordinated.attemptCost.idempotencyStatus, 'inserted')
    assert.equal(coordinated.attemptCost.evidence.boundary, 'internal_production_cost_only')
    assert.equal(coordinated.attemptCost.evidence.evidenceClassification, 'provisional_local_metered')
    assert.equal(coordinated.attemptCost.evidence.rateCardVersion, 'rp-ratecard-01-mock-safe')
    assert.equal(coordinated.attemptCost.evidence.sourceKind, 'infrastructure_runtime')
    assert.equal(coordinated.attemptCost.evidence.identity.executionAttemptId, coordinated.lease.executionAttemptId)
    assert.equal(coordinated.attemptCost.evidence.identity.retryAttempt, 0)
    assert.equal(coordinated.attemptCost.evidence.resourceUsage.vcpuCount, 4)
    assert.equal(coordinated.attemptCost.evidence.resourceUsage.memoryGib, 4)
    assert.equal(coordinated.attemptCost.evidence.resourceUsage.gpuCount, 0)
    assert.equal(coordinated.attemptCost.evidence.resourceUsage.outputByteLength, 384_214)
    assert(Number.isSafeInteger(coordinated.attemptCost.evidence.actualInternalCostMicros))
    assert(coordinated.attemptCost.evidence.actualInternalCostMicros > 0)
    assert.equal(coordinated.attemptCost.evidence.outcome.status, 'completed')
    assert.equal(coordinated.attemptCost.evidence.outcome.failureCategory, 'none')
    assert.equal(coordinated.attemptCost.evidence.persistence.privateLocalCreateOnly, true)
    assert.equal(coordinated.attemptCost.evidence.persistence.databaseBacked, false)
    assert.equal(coordinated.attemptCost.evidence.persistence.productionDurability, false)
    assert.equal(coordinated.attemptCost.evidence.persistence.invoiceReconciled, false)
    assertNoCommercialCostKeys(coordinated.attemptCost)
    assert.equal(coordinated.runtime.modelCheckpointSha256, '23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003')
    assert.equal(coordinated.tool.callerMediaAllowed, false)
    assert.equal(coordinated.tool.callerModelAllowed, false)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    assert.equal(coordinated.permissions.creditSpend, false)
    assert.equal(coordinated.permissions.walletMutation, false)
    assert.equal(coordinated.permissions.settlement, false)
    const replay = await createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService(context).execute(executionInput, executionAuthority)
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    assert.equal(replay.replay.artifactRecordReplayed, true)
    assert.equal(replay.replay.qaRecordReplayed, true)
    assert.equal(replay.replay.reconciliationReplayed, true)
    assert.equal(replay.replay.attemptCostEvidenceReplayed, true)
    assert.equal(replay.attemptCost.idempotencyStatus, 'duplicate_returned')
    assert.deepEqual(replay.attemptCost.evidence, coordinated.attemptCost.evidence)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  } else {
    const executionInput = {
      workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id, grantId: grant.grant.grantId,
      purpose: 'execute_canonical_private_python_tool' as const,
      idempotencyKey: `consume-${matrixRun.toolId}-matrix-root`,
    }
    const coordinated = await createCanonicalPrivatePythonToolExecutionService(context).execute(
      executionInput, executionAuthority,
    )
    assert.equal(coordinated.tool.canonicalToolId, matrixRun.toolId)
    assert.equal(coordinated.tool.operationId, matrixRun.operationId)
    assert.equal(coordinated.result.contentType, matrixRun.expectedContentType)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    const replay = await createCanonicalPrivatePythonToolExecutionService(context).execute(
      executionInput, executionAuthority,
    )
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.replay.dispatchConsumptionReplayed, true)
    assert.equal(replay.replay.executionFenceBeginReplayed, true)
    assert.equal(replay.replay.executionFenceCompleteReplayed, true)
    coordinatedArtifactId = coordinated.result.artifactId
    coordinatedSha256 = coordinated.result.sha256
  }
  assert.match(coordinatedSha256, /^[a-f0-9]{64}$/)
  const proofClaim: Awaited<ReturnType<typeof leaseService.claim>>['workerLeaseClaim'] =
    (await leaseService.claim({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: matrixRun.proofJob.id, purpose: 'private_internal_canonical_lease_claim',
    idempotencyKey: `claim-${matrixRun.toolId}-matrix-proof`,
    })).workerLeaseClaim
  assert.equal(proofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
  assert.equal(proofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
  assert.equal(proofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId, coordinatedArtifactId)
  await leaseService.release({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: matrixRun.proofJob.id, leaseId: proofClaim.lease.leaseId,
    leaseCredential: proofClaim.leaseCredential, purpose: 'private_internal_canonical_lease_release',
    idempotencyKey: `release-${matrixRun.toolId}-matrix-proof`,
  })
  await leaseService.release({
    workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
    jobId: matrixRun.job.id, leaseId: claim.lease.leaseId,
    leaseCredential: claim.leaseCredential, purpose: 'private_internal_canonical_lease_release',
    idempotencyKey: `release-${matrixRun.toolId}-matrix-root`,
  })
}

await activatePrivateOfflineMediaBinaryRuntime()
const remotionRuntime = await activatePrivateOfflineRemotionRenderRuntime()
const remotionClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: remotionJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-remotion-private-preview-root',
})).workerLeaseClaim
const remotionLeaseAuthority = {
  leaseId: remotionClaim.lease.leaseId,
  leaseCredential: remotionClaim.leaseCredential,
}
const remotionGrant = (await dispatchService.authorize({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: remotionJob.id, approvedWorkItemId: remotionWorkItem.id,
  expectedAssetId: remotionAsset.id, requestedToolName: 'remotion',
  operationId: remotionOperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: 'authorize-remotion-private-preview-root',
}, remotionLeaseAuthority)).toolDispatchGrant
assert.equal(remotionGrant.grant.status, 'authorized')
assert.equal(remotionGrant.evidence.specPrivateInternalReady, true)
assert.equal(remotionGrant.evidence.runtimePrivateInternalReady, true)
assert.equal(remotionGrant.evidence.privateRuntimeImageIdentityHash, remotionRuntime.image.imageIdentityHash)
assert.equal(remotionGrant.executionAuthority.privatePreviewRenderAuthorized, false)
assert.equal(remotionGrant.executionAuthority.renderAuthorized, false)
assert.ok(remotionGrant.dispatchCredential)
const remotionExecutionInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: remotionJob.id, grantId: remotionGrant.grant.grantId,
  purpose: 'execute_canonical_private_remotion_tool' as const,
  idempotencyKey: 'consume-remotion-private-preview-root',
}
const remotionExecutionAuthority = {
  ...remotionLeaseAuthority,
  dispatchCredential: remotionGrant.dispatchCredential,
}
const coordinatedRemotion = await createCanonicalPrivateRemotionExecutionService(context).execute(
  remotionExecutionInput, remotionExecutionAuthority,
)
assert.equal(coordinatedRemotion.tool.canonicalToolId, 'remotion')
assert.equal(coordinatedRemotion.tool.privatePreviewRenderExecuted, true)
assert.equal(coordinatedRemotion.tool.finalExportExecuted, false)
assert.equal(coordinatedRemotion.runtime.imageIdentityHash, remotionRuntime.image.imageIdentityHash)
assert.equal(coordinatedRemotion.runtime.finalExportReady, false)
assert.equal(coordinatedRemotion.qa.independentFfprobeExecuted, true)
assert.equal(coordinatedRemotion.qa.codecName, 'h264')
assert.equal(coordinatedRemotion.qa.pixelFormat, 'yuv420p')
assert.equal(coordinatedRemotion.qa.colorSpace, 'bt709')
assert.equal(coordinatedRemotion.qa.frameCount, 24)
assert.equal(coordinatedRemotion.result.contentType, 'video/mp4')
assert.equal(coordinatedRemotion.result.qaOutcome, 'passed')
assert.equal(coordinatedRemotion.result.finalRenderAuthorized, false)
assert.equal(coordinatedRemotion.result.finalExportAuthorized, false)
const coordinatedRemotionReplay = await createCanonicalPrivateRemotionExecutionService(context).execute(
  remotionExecutionInput, remotionExecutionAuthority,
)
assert.equal(coordinatedRemotionReplay.result.artifactId, coordinatedRemotion.result.artifactId)
assert.equal(coordinatedRemotionReplay.result.sha256, coordinatedRemotion.result.sha256)
assert.equal(coordinatedRemotionReplay.replay.dispatchConsumptionReplayed, true)
assert.equal(coordinatedRemotionReplay.replay.executionFenceBeginReplayed, true)
assert.equal(coordinatedRemotionReplay.replay.executionFenceCompleteReplayed, true)
assert.equal(coordinatedRemotionReplay.replay.artifactRecordReplayed, true)
assert.equal(coordinatedRemotionReplay.replay.qaRecordReplayed, true)
assert.equal(coordinatedRemotionReplay.replay.reconciliationReplayed, true)
const remotionProofClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: remotionProofJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-remotion-private-preview-proof',
})).workerLeaseClaim
assert.equal(remotionProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(remotionProofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(remotionProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId, coordinatedRemotion.result.artifactId)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: remotionProofJob.id, leaseId: remotionProofClaim.lease.leaseId,
  leaseCredential: remotionProofClaim.leaseCredential, purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-remotion-private-preview-proof',
})
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: remotionJob.id, leaseId: remotionClaim.lease.leaseId,
  leaseCredential: remotionClaim.leaseCredential, purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-remotion-private-preview-root',
})

const libassRuntime = await activatePrivateOfflineLibassCaptionRuntime()
const libassClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: libassJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-libass-caption-overlay-root',
})).workerLeaseClaim
const libassLeaseAuthority = {
  leaseId: libassClaim.lease.leaseId,
  leaseCredential: libassClaim.leaseCredential,
}
const libassGrant = (await dispatchService.authorize({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: libassJob.id, approvedWorkItemId: libassWorkItem.id,
  expectedAssetId: libassAsset.id, requestedToolName: 'libass',
  operationId: libassOperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: 'authorize-libass-caption-overlay-root',
}, libassLeaseAuthority)).toolDispatchGrant
assert.equal(libassGrant.grant.status, 'authorized')
assert.equal(libassGrant.evidence.specPrivateInternalReady, true)
assert.equal(libassGrant.evidence.runtimePrivateInternalReady, true)
assert.equal(libassGrant.evidence.privateRuntimeImageIdentityHash, libassRuntime.image.imageIdentityHash)
assert.equal(libassGrant.executionAuthority.privateCaptionRenderAuthorized, false)
assert.equal(libassGrant.executionAuthority.renderAuthorized, false)
assert.ok(libassGrant.dispatchCredential)
const libassExecutionInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: libassJob.id, grantId: libassGrant.grant.grantId,
  purpose: 'execute_canonical_private_libass_tool' as const,
  idempotencyKey: 'consume-libass-caption-overlay-root',
}
const libassExecutionAuthority = {
  ...libassLeaseAuthority,
  dispatchCredential: libassGrant.dispatchCredential,
}
const coordinatedLibass = await createCanonicalPrivateLibassExecutionService(context).execute(
  libassExecutionInput, libassExecutionAuthority,
)
assert.equal(coordinatedLibass.tool.canonicalToolId, 'libass')
assert.equal(coordinatedLibass.tool.actualAssReadMemoryCompleted, true)
assert.equal(coordinatedLibass.tool.actualAssRenderFrameCompleted, true)
assert.equal(coordinatedLibass.tool.privateCaptionOverlayRendered, true)
assert.equal(coordinatedLibass.tool.fullCaptionTrackRendered, false)
assert.equal(coordinatedLibass.tool.videoBurnInExecuted, false)
assert.equal(coordinatedLibass.tool.finalExportExecuted, false)
assert.equal(coordinatedLibass.runtime.imageIdentityHash, libassRuntime.image.imageIdentityHash)
assert.equal(coordinatedLibass.runtime.fullTrackOrVideoBurnInReady, false)
assert.equal(coordinatedLibass.qa.transparentRgbaOverlay, true)
assert.equal(coordinatedLibass.qa.approvedFontPackUsed, true)
assert.equal(coordinatedLibass.qa.safeZonePlacementPassed, true)
assert.ok(coordinatedLibass.qa.nonTransparentPixelCount > 100)
assert.equal(coordinatedLibass.result.contentType, 'image/png')
assert.equal(coordinatedLibass.result.qaOutcome, 'passed')
assert.equal(coordinatedLibass.result.finalRenderAuthorized, false)
assert.equal(coordinatedLibass.result.finalExportAuthorized, false)
const coordinatedLibassReplay = await createCanonicalPrivateLibassExecutionService(context).execute(
  libassExecutionInput, libassExecutionAuthority,
)
assert.equal(coordinatedLibassReplay.result.artifactId, coordinatedLibass.result.artifactId)
assert.equal(coordinatedLibassReplay.result.sha256, coordinatedLibass.result.sha256)
assert.equal(coordinatedLibassReplay.replay.dispatchConsumptionReplayed, true)
assert.equal(coordinatedLibassReplay.replay.executionFenceBeginReplayed, true)
assert.equal(coordinatedLibassReplay.replay.executionFenceCompleteReplayed, true)
assert.equal(coordinatedLibassReplay.replay.artifactRecordReplayed, true)
assert.equal(coordinatedLibassReplay.replay.qaRecordReplayed, true)
assert.equal(coordinatedLibassReplay.replay.reconciliationReplayed, true)
const libassProofClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: libassProofJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-libass-caption-overlay-proof',
})).workerLeaseClaim
assert.equal(libassProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(libassProofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(libassProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId, coordinatedLibass.result.artifactId)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: libassProofJob.id, leaseId: libassProofClaim.lease.leaseId,
  leaseCredential: libassProofClaim.leaseCredential, purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-libass-caption-overlay-proof',
})

const sourceTrimValidationClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sourceTrimValidationJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-source-trim-validation-for-final-composition',
})).workerLeaseClaim
assert.equal(sourceTrimValidationClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(sourceTrimValidationClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(
  sourceTrimValidationClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId,
  validationRun.result.artifactId,
)
const sourceTrimValidationRun = await createCanonicalInternalAuthorityRunnerService(context).execute({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sourceTrimValidationJob.id, expectedAssetId: sourceTrimValidationAsset.id,
  purpose: 'execute_canonical_internal_source_trim_validation',
}, {
  leaseId: sourceTrimValidationClaim.lease.leaseId,
  leaseCredential: sourceTrimValidationClaim.leaseCredential,
})
assert.equal(sourceTrimValidationRun.result.contentType, 'application/json')
assert.equal(sourceTrimValidationRun.result.qaOutcome, 'passed')

const finalCompositionClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: finalCompositionJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-remotion-source-caption-final',
})).workerLeaseClaim
assert.equal(finalCompositionClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(finalCompositionClaim.lease.dependencyAuthority.selectedArtifacts.length, 2)
assert.deepEqual(
  finalCompositionClaim.lease.dependencyAuthority.selectedArtifacts.map((artifact) => artifact.artifactId),
  [sourceTrimValidationRun.result.artifactId, coordinatedLibass.result.artifactId],
)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: finalCompositionJob.id, leaseId: finalCompositionClaim.lease.leaseId,
  leaseCredential: finalCompositionClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-final-composition-dependency-inspection-lease',
})
const finalCompositionAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: finalCompositionJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'adapter-remotion-source-trim-caption-final',
}
const coordinatedFinalComposition = await jobExecutionAdapter.execute(finalCompositionAdapterInput)
assert.equal(coordinatedFinalComposition.identity.canonicalToolId, 'remotion')
assert.equal(coordinatedFinalComposition.identity.runnerClass, 'offline_remotion_render_execution_v1')
assert.equal(coordinatedFinalComposition.result.contentType, 'video/mp4')
assert.equal(coordinatedFinalComposition.result.qaOutcome, 'passed')
assert.equal(coordinatedFinalComposition.result.privateTestDependencySatisfied, true)
assert.equal(coordinatedFinalComposition.result.liveRuntimeDependencySatisfied, false)
assert.equal(coordinatedFinalComposition.result.finalRenderAuthorized, false)
assert.equal(coordinatedFinalComposition.evidence.serverDerivedToolAndOperation, true)
assert.equal(coordinatedFinalComposition.evidence.singleUseDispatchConsumed, true)
assert.equal(coordinatedFinalComposition.readiness.productReady, false)
const finalArtifactQaAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: finalArtifactQaJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'adapter-ffprobe-private-final-artifact-qa',
}
const coordinatedFinalArtifactQa = await jobExecutionAdapter.execute(finalArtifactQaAdapterInput)
assert.equal(coordinatedFinalArtifactQa.identity.canonicalToolId, 'ffprobe')
assert.equal(coordinatedFinalArtifactQa.identity.runnerClass, 'offline_media_binary_execution_v1')
assert.equal(coordinatedFinalArtifactQa.result.contentType, 'application/json')
assert.equal(coordinatedFinalArtifactQa.result.qaOutcome, 'passed')
assert.equal(coordinatedFinalArtifactQa.result.privateTestDependencySatisfied, true)
assert.equal(coordinatedFinalArtifactQa.evidence.dependencyArtifactInput, true)
assert.equal(coordinatedFinalArtifactQa.evidence.finalArtifactQaPassed, true)
assert.equal(coordinatedFinalArtifactQa.permissions.publicDelivery, false)
assert.equal(coordinatedFinalArtifactQa.readiness.productReady, false)
const coordinatedFinalArtifactQaReplay = await jobExecutionAdapter.execute(finalArtifactQaAdapterInput)
assert.equal(coordinatedFinalArtifactQaReplay.result.artifactId, coordinatedFinalArtifactQa.result.artifactId)
assert.equal(coordinatedFinalArtifactQaReplay.result.sha256, coordinatedFinalArtifactQa.result.sha256)
assert.equal(coordinatedFinalArtifactQaReplay.evidence.idempotentAdapterReplay, true)
const privateFinalDownloadInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  snapshotId: snapshot.snapshotId, jobId: finalCompositionJob.id,
  expectedAssetId: finalCompositionAsset.id,
  artifactId: coordinatedFinalComposition.result.artifactId,
  purpose: 'download_canonical_private_final_artifact' as const,
}
const privateFinalDownload = await createCanonicalPrivateFinalArtifactDownloadService(context)
  .read(privateFinalDownloadInput)
assert.equal(privateFinalDownload.mimeType, 'video/mp4')
assert.equal(privateFinalDownload.byteSize, coordinatedFinalComposition.result.byteLength)
assert.equal(privateFinalDownload.sha256, coordinatedFinalComposition.result.sha256)
assert.equal(
  createHash('sha256').update(privateFinalDownload.bytes).digest('hex'),
  coordinatedFinalComposition.result.sha256,
)
assert.equal(privateFinalDownload.publicUrlCreated, false)
assert.equal(privateFinalDownload.signedUrlCreated, false)
assert.equal(privateFinalDownload.billingMutationPerformed, false)
assert.equal(privateFinalDownload.settlementPerformed, false)
await expectApiError(
  () => createCanonicalPrivateFinalArtifactDownloadService({
    ...context,
    auth: { userId: 'cross-tenant-final-download-attacker', accessToken: 'attacker-token', isMockUser: false },
  }).read(privateFinalDownloadInput),
  'WORKSPACE_ACCESS_DENIED',
)
const coordinatedFinalCompositionReplay = await jobExecutionAdapter.execute(finalCompositionAdapterInput)
assert.equal(coordinatedFinalCompositionReplay.result.artifactId, coordinatedFinalComposition.result.artifactId)
assert.equal(coordinatedFinalCompositionReplay.result.sha256, coordinatedFinalComposition.result.sha256)
assert.equal(coordinatedFinalCompositionReplay.evidence.idempotentAdapterReplay, true)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sourceTrimValidationJob.id, leaseId: sourceTrimValidationClaim.lease.leaseId,
  leaseCredential: sourceTrimValidationClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-source-trim-validation-for-final-composition',
})
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: libassJob.id, leaseId: libassClaim.lease.leaseId,
  leaseCredential: libassClaim.leaseCredential, purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-libass-caption-overlay-root',
})

const terminalReviewEditSessionId = `${editSessionId}-terminal-review`
const terminalReviewPlanningInput = await prepareExactPlanningAuthority(
  seedSnapshot.projectId,
  terminalReviewEditSessionId,
)
const terminalReviewPlanBody = createDispatchPlanBody({
  ...dispatchPlanInput,
  planningInputAuthority: terminalReviewPlanningInput,
})
terminalReviewPlanBody.planningRequestId = 'planning-terminal-private-review'
const terminalReviewWorkItemKeys = new Set([
  'snapshot-validation-root',
  'source-trim-validation',
  'libass-caption-overlay-root',
  'remotion-source-caption-final',
  'final-qa',
])
terminalReviewPlanBody.canonicalPlan.workItems = terminalReviewPlanBody.canonicalPlan.workItems.filter((workItem) =>
  terminalReviewWorkItemKeys.has(workItem.workItemKey))
const terminalReviewPublished = await planningService.publishCanonicalPlan({
  ...terminalReviewPlanBody,
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
  idempotencyKey: 'publish-terminal-private-review-canonical-plan',
})
const terminalReviewPublishedAuthority = asRecord(terminalReviewPublished.authority)
const terminalReviewPublishedPlan = asRecord(terminalReviewPublishedAuthority.plan)
const terminalReviewPublishedEstimate = asRecord(terminalReviewPublishedAuthority.estimate)
const terminalReviewApproved = await planningService.approveAndFundCanonicalPlan({
  workspaceId,
  editPlanId: String(terminalReviewPublishedPlan.id),
  expectedAuthorityRevision: Number(terminalReviewPublishedAuthority.authorityRevision),
  expectedPlanHash: String(terminalReviewPublishedPlan.planHash),
  expectedEstimateHash: String(terminalReviewPublishedEstimate.estimateHash),
  idempotencyKey: 'approve-terminal-private-review-canonical-plan',
})
const terminalReviewApprovedSnapshot = asRecord(asRecord(terminalReviewApproved.authority).snapshot)
const terminalReviewPackage = await createCanonicalEditExecutionPackageService(context).createPackage({
  workspaceId,
  approvedPlanSnapshotId: String(terminalReviewApprovedSnapshot.snapshotId),
  expectedSnapshotHash: String(terminalReviewApprovedSnapshot.snapshotHash),
  purpose: 'private_internal_execution_handoff',
  idempotencyKey: 'package-terminal-private-review-canonical-plan',
})
const terminalReviewPackageRecordId = terminalReviewPackage.approvedEditExecutionPackage.packageRecordId
const terminalWorkGraph = await createCanonicalPrivateWorkGraphOrchestratorService(context).run({
  workspaceId,
  packageRecordId: terminalReviewPackageRecordId,
  purpose: 'run_canonical_private_work_graph',
  idempotencyKey: 'run-terminal-private-review-canonical-graph',
})
assert.equal(terminalWorkGraph.status, 'completed_private_test_work_graph')
assert.equal(terminalWorkGraph.summary.totalJobCount, 5)
assert.equal(terminalWorkGraph.summary.completedJobCount, 5)
assert.equal(terminalWorkGraph.summary.requiredBlockedJobCount, 0)
assert.equal(terminalWorkGraph.summary.allRequiredJobsCompleted, true)
assert.equal(terminalWorkGraph.readiness.privateInternalWorkGraphCompleted, true)
assert.equal(terminalWorkGraph.readiness.privateReviewReady, false)
assert.equal(terminalWorkGraph.readiness.nextRequiredGate, 'canonical_terminal_private_review_assembly')
const terminalWorkGraphReplay = await createCanonicalPrivateWorkGraphOrchestratorService(context).run({
  workspaceId,
  packageRecordId: terminalReviewPackageRecordId,
  purpose: 'run_canonical_private_work_graph',
  idempotencyKey: 'run-terminal-private-review-canonical-graph',
})
assert.equal(terminalWorkGraphReplay.evidence.idempotentRunReplay, true)
assert.equal(terminalWorkGraphReplay.summary.completedJobCount, 5)

const privateReviewService = createCanonicalPrivateReviewAssemblyService(context)
await expectApiError(
  () => privateReviewService.assemble({
    workspaceId,
    packageRecordId: terminalReviewPackageRecordId,
    purpose: 'assemble_canonical_private_review',
    idempotencyKey: 'terminal-private-review-reject-caller-artifact',
    artifactId: coordinatedFinalComposition.result.artifactId,
  } as never),
  'VALIDATION_FAILED',
)
const terminalPrivateReviewInput = {
  workspaceId,
  packageRecordId: terminalReviewPackageRecordId,
  purpose: 'assemble_canonical_private_review' as const,
  idempotencyKey: 'assemble-terminal-private-review',
}
const terminalPrivateReview = await privateReviewService.assemble(terminalPrivateReviewInput)
assert.equal(terminalPrivateReview.status, 'ready_for_private_internal_review')
assert.equal(terminalPrivateReview.requiredExecution.requiredJobCount, 5)
assert.equal(terminalPrivateReview.requiredExecution.requiredExpectedAssetCount, 5)
assert.equal(terminalPrivateReview.requiredExecution.allRequiredJobsCompleted, true)
assert.equal(terminalPrivateReview.requiredExecution.allRequiredAssetsQaPassed, true)
assert.equal(terminalPrivateReview.requiredExecution.allRequiredAssetsReconciled, true)
assert.equal(terminalPrivateReview.finalArtifact.contentType, 'video/mp4')
assert.equal(terminalPrivateReview.finalArtifact.privateDownloadAvailable, true)
assert.equal(terminalPrivateReview.finalArtifact.publicUrlCreated, false)
assert.equal(terminalPrivateReview.finalQaArtifact.canonicalToolId, 'ffprobe')
assert.equal(terminalPrivateReview.finalQaArtifact.finalQaGatesPassed, true)
assert.equal(terminalPrivateReview.chain.finalQaInputBoundToFinalArtifact, true)
assert.equal(terminalPrivateReview.manifest.privateCreateOnlyPersistence, true)
assert.equal(terminalPrivateReview.manifest.credentialFree, true)
assert.equal(terminalPrivateReview.readiness.privateReviewReady, true)
assert.equal(terminalPrivateReview.readiness.publicExportReady, false)
assert.equal(terminalPrivateReview.readiness.productReady, false)
assert.equal(terminalPrivateReview.permissions.publicDelivery, false)
assert.equal(terminalPrivateReview.permissions.billing, false)
const terminalPrivateReviewReplay = await privateReviewService.assemble(terminalPrivateReviewInput)
assert.equal(terminalPrivateReviewReplay.identity.reviewAssemblyId, terminalPrivateReview.identity.reviewAssemblyId)
assert.equal(terminalPrivateReviewReplay.manifest.manifestSha256, terminalPrivateReview.manifest.manifestSha256)
assert.equal(terminalPrivateReviewReplay.replay.idempotentReplay, true)
const reviewDecisionAuthorityBefore = sha256AuthorityValue(
  snapshotAuthoritySlice(
    await requireEditAuthority(workspaceId),
    terminalPrivateReview.identity.approvedPlanSnapshotId,
  ),
)
const privateReviewDecisionService = createCanonicalPrivateReviewDecisionService(context)
await expectApiError(
  () => privateReviewDecisionService.record({
    workspaceId,
    packageRecordId: terminalReviewPackageRecordId,
    reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
    purpose: 'record_canonical_private_review_decision',
    expectedManifestSha256: terminalPrivateReview.manifest.manifestSha256,
    expectedFinalArtifactSha256: terminalPrivateReview.finalArtifact.sha256,
    decision: 'accept_private_internal_review',
    idempotencyKey: 'terminal-private-review-decision-reject-artifact-injection',
    artifactId: terminalPrivateReview.finalArtifact.artifactId,
  } as never),
  'VALIDATION_FAILED',
)
await expectApiError(
  () => privateReviewDecisionService.record({
    workspaceId,
    packageRecordId: terminalReviewPackageRecordId,
    reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
    purpose: 'record_canonical_private_review_decision',
    expectedManifestSha256: '0'.repeat(64),
    expectedFinalArtifactSha256: terminalPrivateReview.finalArtifact.sha256,
    decision: 'accept_private_internal_review',
    idempotencyKey: 'terminal-private-review-decision-reject-manifest-mismatch',
  }),
  'IDEMPOTENCY_CONFLICT',
)
const terminalPrivateRevisionDecisionInput: Parameters<
  typeof privateReviewDecisionService.record
>[0] = {
  workspaceId,
  packageRecordId: terminalReviewPackageRecordId,
  reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
  purpose: 'record_canonical_private_review_decision' as const,
  expectedManifestSha256: terminalPrivateReview.manifest.manifestSha256,
  expectedFinalArtifactSha256: terminalPrivateReview.finalArtifact.sha256,
  decision: 'request_revision' as const,
  revisionIntent: {
    summary: 'Tighten the opening pacing while preserving source meaning and the approved source order.',
    changeCategories: ['pacing'],
    mustPreserve: ['source_order', 'source_meaning', 'edit_preferences', 'edit_brief'],
    requiresReplanning: true as const,
    requiresFreshEstimateAndApproval: true as const,
  },
  idempotencyKey: 'record-terminal-private-review-revision-decision',
}
const terminalPrivateRevisionDecision = await privateReviewDecisionService.record(
  terminalPrivateRevisionDecisionInput,
)
assert.equal(terminalPrivateRevisionDecision.status, 'canonical_revision_requested')
assert.equal(terminalPrivateRevisionDecision.decision, 'request_revision')
assert.equal(terminalPrivateRevisionDecision.authority.approvedPlanVersion, 1)
assert.equal(terminalPrivateRevisionDecision.authority.immutableApprovedSnapshotPreserved, true)
assert.equal(terminalPrivateRevisionDecision.authority.immutableReviewManifestPreserved, true)
assert.equal(terminalPrivateRevisionDecision.revisionHandoff?.minimumNextPlanVersion, 2)
assert.equal(terminalPrivateRevisionDecision.revisionHandoff?.requiresReplanning, true)
assert.equal(terminalPrivateRevisionDecision.revisionHandoff?.requiresFreshEstimateAndApproval, true)
assert.equal(terminalPrivateRevisionDecision.revisionHandoff?.replacementPlanPublished, false)
assert.equal(terminalPrivateRevisionDecision.revisionHandoff?.revisionExecutionStarted, false)
assert.equal(terminalPrivateRevisionDecision.permissions.revisionExecution, false)
assert.equal(terminalPrivateRevisionDecision.permissions.replacementPlanPublication, false)
assert.equal(terminalPrivateRevisionDecision.permissions.reservationMutation, false)
assert.equal(
  terminalPrivateRevisionDecision.readiness.nextRequiredGate,
  'canonical_revision_plan_compilation_and_fresh_approval',
)
const terminalPrivateRevisionDecisionReplay = await privateReviewDecisionService.record(
  terminalPrivateRevisionDecisionInput,
)
assert.equal(
  terminalPrivateRevisionDecisionReplay.identity.reviewDecisionId,
  terminalPrivateRevisionDecision.identity.reviewDecisionId,
)
assert.equal(
  terminalPrivateRevisionDecisionReplay.manifest.manifestSha256,
  terminalPrivateRevisionDecision.manifest.manifestSha256,
)
assert.equal(terminalPrivateRevisionDecisionReplay.replay.idempotentReplay, true)
await expectApiError(
  () => privateReviewDecisionService.record({
    workspaceId,
    packageRecordId: terminalReviewPackageRecordId,
    reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
    purpose: 'record_canonical_private_review_decision',
    expectedManifestSha256: terminalPrivateReview.manifest.manifestSha256,
    expectedFinalArtifactSha256: terminalPrivateReview.finalArtifact.sha256,
    decision: 'accept_private_internal_review',
    idempotencyKey: 'reject-second-decision-for-terminal-private-review',
  }),
  'IDEMPOTENCY_CONFLICT',
)
assert.equal(
  sha256AuthorityValue(snapshotAuthoritySlice(
    await requireEditAuthority(workspaceId),
    terminalPrivateReview.identity.approvedPlanSnapshotId,
  )),
  reviewDecisionAuthorityBefore,
)
const revisionHandoff = terminalPrivateRevisionDecision.revisionHandoff
assert.ok(revisionHandoff)
const authorityBeforeReplacementPlan = await requireEditAuthority(workspaceId)
const priorSnapshotSliceHash = sha256AuthorityValue(snapshotAuthoritySlice(
  authorityBeforeReplacementPlan,
  terminalPrivateReview.identity.approvedPlanSnapshotId,
))
const walletBeforeReplacementPlan = sha256AuthorityValue(authorityBeforeReplacementPlan.wallet)
const reservationCountBeforeReplacementPlan = authorityBeforeReplacementPlan.reservations.length
const jobsBeforeReplacementPlan = authorityBeforeReplacementPlan.jobs.length
const packagesBeforeReplacementPlan = authorityBeforeReplacementPlan.executionPackages.length
const replacementPlanBody = createDispatchPlanBody({
  ...dispatchPlanInput,
  planningInputAuthority: terminalReviewPlanningInput,
})
replacementPlanBody.planningRequestId = 'planning-terminal-private-review-revision-v2'
replacementPlanBody.canonicalPlan.components.compiledIntent = {
  ...replacementPlanBody.canonicalPlan.components.compiledIntent,
  revisionIntentHash: revisionHandoff.revisionIntentHash,
  priorApprovedSnapshotId: terminalPrivateReview.identity.approvedPlanSnapshotId,
  reviewDecisionId: terminalPrivateRevisionDecision.identity.reviewDecisionId,
}
replacementPlanBody.revisionAuthority = {
  reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
  reviewDecisionId: terminalPrivateRevisionDecision.identity.reviewDecisionId,
  revisionRequestId: revisionHandoff.revisionRequestId,
  decisionManifestSha256: terminalPrivateRevisionDecision.manifest.manifestSha256,
  priorApprovedSnapshotId: terminalPrivateReview.identity.approvedPlanSnapshotId,
  priorApprovedPlanId: terminalPrivateRevisionDecision.authority.approvedPlanId,
  priorApprovedPlanVersion: terminalPrivateRevisionDecision.authority.approvedPlanVersion,
  revisionIntentHash: revisionHandoff.revisionIntentHash,
}
await expectApiError(
  () => planningService.publishCanonicalPlan({
    ...replacementPlanBody,
    revisionAuthority: {
      ...replacementPlanBody.revisionAuthority!,
      decisionManifestSha256: '0'.repeat(64),
    },
    projectId: seedSnapshot.projectId,
    editSessionId: terminalReviewEditSessionId,
    idempotencyKey: 'reject-stale-terminal-revision-plan-authority',
  }),
  'IDEMPOTENCY_CONFLICT',
)
const replacementPlanPublished = await planningService.publishCanonicalPlan({
  ...replacementPlanBody,
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
  idempotencyKey: 'publish-terminal-private-review-revision-v2',
})
const replacementPlanAuthority = asRecord(replacementPlanPublished.authority)
const replacementPlan = asRecord(replacementPlanAuthority.plan)
const replacementEstimate = asRecord(replacementPlanAuthority.estimate)
assert.equal(replacementPlan.planVersion, 2)
assert.equal(replacementPlan.status, 'presented')
assert.equal(asRecord(replacementPlan.revisionAuthority).reviewDecisionId,
  terminalPrivateRevisionDecision.identity.reviewDecisionId)
assert.equal(asRecord(replacementPlan.componentRefs).revisionAuthority !== undefined, true)
assert.notEqual(replacementPlan.id, terminalPrivateRevisionDecision.authority.approvedPlanId)
assert.equal(replacementEstimate.status, 'presented')
assert.notEqual(replacementEstimate.id, terminalReviewPublishedEstimate.id)
const replacementPlanReplay = await planningService.publishCanonicalPlan({
  ...replacementPlanBody,
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
  idempotencyKey: 'publish-terminal-private-review-revision-v2',
})
assert.equal(asRecord(asRecord(replacementPlanReplay.authority).plan).id, replacementPlan.id)
await expectApiError(
  () => planningService.approveAndFundCanonicalPlan({
    workspaceId,
    editPlanId: String(replacementPlan.id),
    expectedAuthorityRevision: Number(replacementPlanAuthority.authorityRevision),
    expectedPlanHash: String(replacementPlan.planHash),
    expectedEstimateHash: String(replacementEstimate.estimateHash),
    idempotencyKey: 'block-terminal-revision-plan-approval-before-reconciliation',
  }),
  'TOOL_NOT_READY',
)
const authorityAfterReplacementPlan = await requireEditAuthority(workspaceId)
assert.equal(
  sha256AuthorityValue(snapshotAuthoritySlice(
    authorityAfterReplacementPlan,
    terminalPrivateReview.identity.approvedPlanSnapshotId,
  )),
  priorSnapshotSliceHash,
)
assert.equal(sha256AuthorityValue(authorityAfterReplacementPlan.wallet), walletBeforeReplacementPlan)
assert.equal(authorityAfterReplacementPlan.reservations.length, reservationCountBeforeReplacementPlan)
assert.equal(authorityAfterReplacementPlan.jobs.length, jobsBeforeReplacementPlan)
assert.equal(authorityAfterReplacementPlan.executionPackages.length, packagesBeforeReplacementPlan)
const terminalPrivateReviewDownload = await createCanonicalPrivateFinalArtifactDownloadService(context).read({
  workspaceId,
  projectId: terminalPrivateReview.identity.projectId,
  editSessionId: terminalPrivateReview.identity.editSessionId,
  snapshotId: terminalPrivateReview.identity.approvedPlanSnapshotId,
  jobId: terminalPrivateReview.finalArtifact.jobId,
  expectedAssetId: terminalPrivateReview.finalArtifact.expectedAssetId,
  artifactId: terminalPrivateReview.finalArtifact.artifactId,
  purpose: 'download_canonical_private_final_artifact',
})
assert.equal(terminalPrivateReviewDownload.sha256, terminalPrivateReview.finalArtifact.sha256)
assert.equal(terminalPrivateReviewDownload.publicUrlCreated, false)
assert.equal(terminalPrivateReviewDownload.signedUrlCreated, false)

const binaryRuntime = await activatePrivateOfflineMediaBinaryRuntime()
const probeClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: probeJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-probe-root-for-binary-dispatch',
})).workerLeaseClaim
const probeLeaseAuthority = {
  leaseId: probeClaim.lease.leaseId,
  leaseCredential: probeClaim.leaseCredential,
}
const probeGrant = (await dispatchService.authorize({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: probeJob.id, approvedWorkItemId: probeWorkItem.id,
  expectedAssetId: probeAsset.id, requestedToolName: 'ffprobe',
  operationId: ffprobeOperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: 'authorize-probe-root-ffprobe-attempt-one',
}, probeLeaseAuthority)).toolDispatchGrant
assert.equal(probeGrant.grant.status, 'authorized')
assert.equal(probeGrant.evidence.specPrivateInternalReady, true)
assert.equal(probeGrant.evidence.runtimePrivateInternalReady, true)
assert.equal(probeGrant.evidence.privateRuntimeImageIdentityHash, binaryRuntime.image.imageIdentityHash)
assert.ok(probeGrant.dispatchCredential)
const probeExecutionInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: probeJob.id, grantId: probeGrant.grant.grantId,
  purpose: 'execute_canonical_private_media_binary_tool' as const,
  idempotencyKey: 'consume-authorized-probe-root-ffprobe-attempt-one',
}
const probeExecutionAuthority = {
  ...probeLeaseAuthority,
  dispatchCredential: probeGrant.dispatchCredential!,
}
const coordinatedProbe = await createCanonicalPrivateMediaBinaryExecutionService(context).execute(
  probeExecutionInput,
  probeExecutionAuthority,
)
assert.equal(coordinatedProbe.tool.canonicalToolId, 'ffprobe')
assert.equal(coordinatedProbe.tool.actualBinaryOperationCompleted, true)
assert.equal(coordinatedProbe.tool.sourceObjectRead, true)
assert.equal(coordinatedProbe.tool.sourceSequenceItemId, mediaSourceItem.sourceSequenceItemId)
assert.equal(coordinatedProbe.runtime.imageIdentityHash, binaryRuntime.image.imageIdentityHash)
assert.equal(coordinatedProbe.runtime.finalExportReady, false)
assert.equal(coordinatedProbe.result.qaOutcome, 'passed')
assert.equal(coordinatedProbe.result.finalRenderAuthorized, false)
const coordinatedProbeReplay = await createCanonicalPrivateMediaBinaryExecutionService(context).execute(
  probeExecutionInput,
  probeExecutionAuthority,
)
assert.equal(coordinatedProbeReplay.result.artifactId, coordinatedProbe.result.artifactId)
assert.equal(coordinatedProbeReplay.result.sha256, coordinatedProbe.result.sha256)
assert.equal(coordinatedProbeReplay.replay.dispatchConsumptionReplayed, true)
assert.equal(coordinatedProbeReplay.replay.executionFenceBeginReplayed, true)
assert.equal(coordinatedProbeReplay.replay.executionFenceCompleteReplayed, true)
const probeProofClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: probeProofJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-probe-proof-after-binary-reconciliation',
})).workerLeaseClaim
assert.equal(probeProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(probeProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId, coordinatedProbe.result.artifactId)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: probeProofJob.id, leaseId: probeProofClaim.lease.leaseId,
  leaseCredential: probeProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-probe-proof-verification-lease',
})
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: probeJob.id, leaseId: probeClaim.lease.leaseId,
  leaseCredential: probeClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-completed-probe-root-attempt-one',
})

const trimClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: trimJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-trim-root-for-ffmpeg-dispatch',
})).workerLeaseClaim
const trimLeaseAuthority = {
  leaseId: trimClaim.lease.leaseId,
  leaseCredential: trimClaim.leaseCredential,
}
const trimGrant = (await dispatchService.authorize({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: trimJob.id, approvedWorkItemId: trimWorkItem.id,
  expectedAssetId: trimAsset.id, requestedToolName: 'ffmpeg',
  operationId: ffmpegOperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: 'authorize-trim-root-ffmpeg-attempt-one',
}, trimLeaseAuthority)).toolDispatchGrant
assert.equal(trimGrant.grant.status, 'authorized')
assert.equal(trimGrant.evidence.specPrivateInternalReady, true)
assert.equal(trimGrant.evidence.runtimePrivateInternalReady, true)
assert.ok(trimGrant.dispatchCredential)
const trimExecutionInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: trimJob.id, grantId: trimGrant.grant.grantId,
  purpose: 'execute_canonical_private_media_binary_tool' as const,
  idempotencyKey: 'consume-authorized-trim-root-ffmpeg-attempt-one',
}
const trimExecutionAuthority = {
  ...trimLeaseAuthority,
  dispatchCredential: trimGrant.dispatchCredential!,
}
const coordinatedTrim = await createCanonicalPrivateMediaBinaryExecutionService(context).execute(
  trimExecutionInput,
  trimExecutionAuthority,
)
assert.equal(coordinatedTrim.tool.canonicalToolId, 'ffmpeg')
assert.equal(coordinatedTrim.tool.actualBinaryOperationCompleted, true)
assert.equal(coordinatedTrim.tool.sourceObjectRead, true)
assert.equal(coordinatedTrim.tool.finalExportExecuted, false)
assert.equal(coordinatedTrim.result.contentType, 'video/x-nut')
assert.equal(coordinatedTrim.result.qaOutcome, 'passed')
assert.equal(coordinatedTrim.result.finalRenderAuthorized, false)
const coordinatedTrimReplay = await createCanonicalPrivateMediaBinaryExecutionService(context).execute(
  trimExecutionInput,
  trimExecutionAuthority,
)
assert.equal(coordinatedTrimReplay.result.artifactId, coordinatedTrim.result.artifactId)
assert.equal(coordinatedTrimReplay.result.sha256, coordinatedTrim.result.sha256)
assert.equal(coordinatedTrimReplay.replay.dispatchConsumptionReplayed, true)
assert.equal(coordinatedTrimReplay.replay.executionFenceBeginReplayed, true)
assert.equal(coordinatedTrimReplay.replay.executionFenceCompleteReplayed, true)
const trimProofClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: trimProofJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-trim-proof-after-ffmpeg-reconciliation',
})).workerLeaseClaim
assert.equal(trimProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(trimProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId, coordinatedTrim.result.artifactId)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: trimProofJob.id, leaseId: trimProofClaim.lease.leaseId,
  leaseCredential: trimProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-trim-proof-verification-lease',
})
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: trimJob.id, leaseId: trimClaim.lease.leaseId,
  leaseCredential: trimClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-completed-trim-root-attempt-one',
})

const authorityAfterDispatch = await requireEditAuthority(workspaceId)
assert.equal(
  sha256AuthorityValue(snapshotAuthoritySlice(authorityAfterDispatch, snapshot.snapshotId)),
  sha256AuthorityValue(snapshotAuthoritySlice(aggregateBeforeDispatch, snapshot.snapshotId)),
)

const originalDispatchStoreText = await readFile(persistedPath, 'utf8')
const dependencyTamperedStore = JSON.parse(originalDispatchStoreText) as {
  aggregate: {
    grants: Array<{
      binding: { leaseDependencyAuthority: { authorityHash: string } }
    }>
  }
  checksumSha256: string
}
dependencyTamperedStore.aggregate.grants[0]!.binding.leaseDependencyAuthority.authorityHash = 'e'.repeat(64)
dependencyTamperedStore.checksumSha256 = sha256AuthorityValue(dependencyTamperedStore.aggregate)
await writeFile(persistedPath, `${JSON.stringify(dependencyTamperedStore)}\n`)
clearPrivateCanonicalToolDispatchProcessStateForSmoke()
await expectApiError(() => requireDispatchAggregate(), 'VALIDATION_FAILED')
await writeFile(persistedPath, originalDispatchStoreText)
clearPrivateCanonicalToolDispatchProcessStateForSmoke()

const tamperedStore = JSON.parse(originalDispatchStoreText) as { checksumSha256: string }
tamperedStore.checksumSha256 = 'f'.repeat(64)
await writeFile(persistedPath, `${JSON.stringify(tamperedStore)}\n`)
clearPrivateCanonicalToolDispatchProcessStateForSmoke()
await expectApiError(() => requireDispatchAggregate(), 'VALIDATION_FAILED')
await writeFile(persistedPath, originalDispatchStoreText)
clearPrivateCanonicalToolDispatchProcessStateForSmoke()
assert.equal((await requireDispatchAggregate()).grants.length, 58)

await expectApiError(
  () => createCanonicalPrivateToolDispatchAuthorityService({
    ...context,
    env: loadRuntimeEnv({
      NODE_ENV: 'production',
      E2E_RUNTIME_MODE: 'cloud_run',
      WORKER_RUNTIME_MODE: 'disabled',
      STORAGE_MODE: 'gcs_disabled',
      API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-placeholder',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
      REEDITPRO_INTERNAL_SERVICE_TOKEN: strongInternalSecret,
    }),
  }).authorize(baseInput, chartLeaseAuthority),
  'TOOL_NOT_READY',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'strict_identity_only_request_and_server_injected_lease',
    'active_opaque_lease_live_canonical_revalidation',
    'root_and_private_dependency_verified_lease_v2_dispatch_eligibility',
    'exact_dependency_artifact_selection_and_authority_hash_committed',
    'tampered_dependency_artifact_rejected_before_dispatch_decision',
    'started_and_completed_execution_fences_reject_fresh_dispatch',
    'exact_snapshot_job_work_item_output_tool_operation_binding',
    'active_funded_reservation_and_work_budget_bound',
    'zero_tool_authority_job_non_dispatchable',
    'unsupported_policy_blocked_and_unapproved_tool_rejection',
    'unique_alias_canonicalization_without_approval_bypass',
    'caller_path_url_command_secret_and_authority_field_rejection',
    'wrong_work_item_output_operation_tenant_and_lease_rejection',
    'tampered_source_authority_rejection',
    'concurrent_exact_idempotent_decision_once',
    'different_key_same_live_binding_conflict',
    'short_lived_one_use_contract_without_executable_credential',
    'server_injected_consume_boundary_denies_non_product_ready_grants_without_transition',
    'verified_private_runtime_authorizes_one_use_dispatch_without_product_promotion',
    'atomic_dispatch_consumption_authorizes_one_execution_start_only',
    'coordinator_consumes_dispatch_and_runs_actual_confined_d3_operation_under_lease_fence',
    'actual_svg_artifact_qa_and_reconciliation_authority_committed',
    'same_idempotent_coordinator_attempt_resumes_after_completed_execution_fence',
    'downstream_lease_reopens_and_verifies_actual_structured_svg_bytes',
    'active_started_lease_reads_exact_selected_dependency_bytes_without_paths_or_urls',
    'sharp_consumes_only_lease_selected_qa_passed_svg_dependency_bytes',
    'sharp_actual_png_artifact_qa_reconciliation_and_idempotent_replay',
    'downstream_lease_reopens_and_verifies_sharp_png_bytes',
    'duckdb_python_runtime_authorized_without_product_promotion',
    'python_coordinator_commits_actual_json_artifact_qa_and_reconciliation',
    'same_python_attempt_replays_without_second_dispatch_start',
    'downstream_lease_reopens_and_verifies_actual_structured_json_bytes',
    'pyav_reads_only_exact_approved_private_source_object_bytes',
    'media_source_read_identity_is_bound_to_lease_dispatch_and_execution_attempt',
    'media_json_artifact_qa_reconciliation_and_idempotent_replay',
    'downstream_lease_reopens_and_verifies_media_analysis_json_bytes',
    'scipy_approved_audio_signal_analysis_json_qa_reconciliation_replay_and_downstream_verification',
    'pyloudnorm_approved_audio_loudness_json_qa_reconciliation_replay_and_downstream_verification',
    'pydub_approved_audio_processing_wav_qa_reconciliation_replay_and_downstream_verification',
    'pydub_effects_approved_recipe_wav_qa_reconciliation_replay_and_downstream_verification',
    'explicit_ebu_r128_json_qa_reconciliation_replay_and_downstream_verification',
    'audioread_decode_json_qa_reconciliation_replay_and_downstream_verification',
    'resampy_private_wav_qa_reconciliation_replay_and_downstream_verification',
    'pedalboard_private_wav_qa_reconciliation_replay_and_downstream_verification',
    'mir_eval_timing_json_qa_reconciliation_replay_and_downstream_verification',
    'mido_timing_json_qa_reconciliation_replay_and_downstream_verification',
    'canonical_job_only_adapter_derives_tool_operation_output_lease_dispatch_qa_and_replay_server_side',
    'echarts_exact_svg_canonical_lifecycle_verified',
    'vega_lite_exact_svg_canonical_lifecycle_verified',
    'vega_exact_svg_canonical_lifecycle_verified',
    'satori_exact_svg_canonical_lifecycle_verified',
    'svg_js_exact_svg_canonical_lifecycle_verified',
    'viz_js_exact_svg_canonical_lifecycle_verified',
    'polars_exact_json_canonical_lifecycle_verified',
    'opentimelineio_exact_json_canonical_lifecycle_verified',
    'opencv_exact_json_canonical_lifecycle_verified',
    'pyscenedetect_exact_json_canonical_lifecycle_verified',
    'noisereduce_exact_wav_canonical_lifecycle_verified',
    'pretty_midi_exact_json_canonical_lifecycle_verified',
    'animejs_exact_svg_canonical_lifecycle_verified',
    'three_js_exact_svg_canonical_lifecycle_verified',
    'lottie_exact_png_canonical_lifecycle_verified',
    'pixijs_exact_png_canonical_lifecycle_verified',
    'konva_exact_png_canonical_lifecycle_verified',
    'babylon_js_exact_png_canonical_lifecycle_verified',
    'playwright_authorized_internal_capture_png_canonical_lifecycle_verified',
    'music21_exact_json_canonical_lifecycle_verified',
    'kornia_exact_png_canonical_lifecycle_verified',
    'opencolorio_exact_png_canonical_lifecycle_verified',
    'openimageio_exact_png_canonical_lifecycle_verified',
    'rnnoise_exact_wav_canonical_lifecycle_verified',
    'signalsmith_stretch_exact_wav_canonical_lifecycle_verified',
    'mkvtoolnix_container_validation_exact_json_canonical_lifecycle_verified',
    'gpac_mp4box_packaging_validation_exact_json_canonical_lifecycle_verified',
    'vapoursynth_exact_json_canonical_lifecycle_verified',
    'audioflux_exact_json_canonical_lifecycle_verified',
    'rembg_exact_png_canonical_lifecycle_verified',
    'deepfilternet_exact_wav_canonical_lifecycle_verified',
    'librosa_exact_json_canonical_lifecycle_verified',
    'remotion_private_preview_mp4_canonical_lifecycle_verified',
    'libass_caption_overlay_png_canonical_lifecycle_verified',
    'remotion_source_caption_private_final_mp4_canonical_lifecycle_verified',
    'remotion_approved_source_trim_caption_private_final_mp4_adapter_lifecycle_verified',
    'ffprobe_binary_runtime_authorized_without_product_or_export_promotion',
    'ffprobe_reads_only_exact_approved_private_source_object_bytes',
    'ffprobe_json_artifact_actual_qa_reconciliation_and_idempotent_replay',
    'downstream_lease_reopens_and_verifies_ffprobe_json_bytes',
    'ffmpeg_fixed_frame_trim_runs_in_pinned_lgpl_binary_runtime',
    'ffmpeg_output_is_reprobed_as_exact_ffv1_nut_frame_range',
    'ffmpeg_private_media_artifact_actual_qa_reconciliation_and_idempotent_replay',
    'downstream_lease_reopens_and_verifies_ffmpeg_intermediate_bytes',
    'consume_replay_can_resume_same_attempt_but_cannot_authorize_second_start',
    'private_preview_render_is_exact_remotion_only_while_final_render_provider_credit_wallet_settlement_remain_false',
    'caption_render_is_exact_libass_overlay_only_while_full_track_video_burnin_and_final_export_remain_false',
    'private_final_composition_consumes_exact_source_trim_authority_and_caption_with_h264_aac_final_qa_while_public_delivery_and_settlement_remain_false',
    'dependency_bound_final_ffprobe_reads_the_private_final_mp4_and_passes_exact_h264_aac_frame_duration_qa',
    'canonical_job_adapter_replays_final_artifact_qa_without_a_second_ffprobe_execution',
    'five_job_canonical_work_graph_completes_snapshot_trim_caption_final_composition_and_final_qa',
    'terminal_private_review_assembly_requires_every_required_artifact_qa_reconciliation_and_exact_final_qa_lease_binding',
    'credential_free_private_review_manifest_is_create_only_replay_safe_and_privately_downloadable',
    'private_review_decision_rejects_caller_artifact_and_stale_manifest_authority',
    'revision_request_creates_one_credential_free_immutable_snapshot_bound_handoff',
    'revision_decision_replays_without_authority_wallet_reservation_or_execution_mutation',
    'replacement_plan_publication_requires_exact_unconsumed_revision_handoff_and_compiled_intent_hash',
    'replacement_plan_creates_version_two_and_fresh_estimate_without_mutating_prior_snapshot',
    'replacement_plan_approval_reservation_jobs_and_execution_remain_blocked_pending_reconciliation',
    'authenticated_private_final_mp4_download_reopens_exact_qa_passed_bytes_without_public_or_signed_url',
    'checksum_protected_restart_safe_private_store',
    'dependency_authority_binding_tamper_rejected_by_immutable_record_validation',
    'no_lease_secret_path_execution_input_or_capability_leakage',
    'canonical_edit_authority_not_mutated_by_dispatch',
    'production_fail_closed',
  ],
}))

async function uploadCanonicalMediaFixture(projectId: string) {
  const fixturePath = join('/tmp', `reeditpro-canonical-media-${process.pid}.mp4`)
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=red:s=320x180:r=24:d=1',
    '-f', 'lavfi', '-i', 'color=c=blue:s=320x180:r=24:d=1',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2',
    '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v];[2:a]asetpts=PTS-STARTPTS[a]',
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '128k',
    '-threads', '1', '-y', fixturePath,
  ], { encoding: 'utf8' })
  if (generated.status !== 0) {
    throw new Error(`Unable to generate canonical media fixture: ${generated.stderr.slice(0, 500)}`)
  }
  const bytes = await readFile(fixturePath)
  await rm(fixturePath, { force: true })
  const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
  const uploadService = createUploadService(context)
  const created = await uploadService.createUploadIntent({
    workspaceId,
    projectId,
    uploadPurpose: 'source_media',
    originalFileName: 'canonical-media-source.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: bytes.byteLength,
    checksumSha256,
    idempotencyKey: 'canonical-media-source-upload-intent',
  })
  await uploadService.uploadLocalObject(
    created.uploadIntent.id,
    workspaceId,
    bytes,
    'video/mp4',
    bytes.byteLength,
  )
  const finalized = await uploadService.finalizeUploadIntent({
    workspaceId,
    uploadIntentId: created.uploadIntent.id,
  })
  return { ...finalized, checksumSha256 }
}

async function prepareExactPlanningAuthority(projectId: string, targetEditSessionId = editSessionId) {
  const exactService = createExactEditPreferenceService(context)
  const initialized = await exactService.initialize({
    workspaceId,
    projectId,
    editSessionId: targetEditSessionId,
    idempotencyKey: `initialize-tool-dispatch-exact-preferences:${targetEditSessionId}`,
  })
  const updated = await exactService.updateCurrent({
    workspaceId,
    projectId,
    editSessionId: targetEditSessionId,
    expectedRevision: initialized.preferenceRecord.recordRevision,
    patch: { editLevel: 'basic', targetPlatform: 'tiktok_reels_shorts' },
    idempotencyKey: `update-tool-dispatch-exact-preferences:${targetEditSessionId}`,
  })
  const evidence = await exactService.recordPlanningEvidence({
    workspaceId,
    projectId,
    editSessionId: targetEditSessionId,
    expectedRevision: updated.preferenceRecord.recordRevision,
    sourcePreparation: {
      status: 'ready',
      evidenceHash: sha256Text(`dispatch-source-preparation:${workspaceId}:${projectId}:${targetEditSessionId}`),
    },
    frameConfirmation: {
      status: 'confirmed',
      aspectRatio: '9:16',
      confirmationId: `dispatch-frame-confirmation:${targetEditSessionId}`,
    },
    idempotencyKey: `tool-dispatch-planning-evidence:${targetEditSessionId}`,
  })
  return {
    exactEditPreference: {
      recordRevision: evidence.preferenceRecord.recordRevision,
      preferenceRevision: evidence.preferenceRecord.preferenceRevision,
      preferenceFingerprintSha256: exactEditPreferenceFingerprint(evidence.preferenceRecord.values),
    },
    preferenceApplication: { status: 'not_selected' as const, applicationVersion: 0 as const },
    editBrief: { status: 'not_used' as const },
  }
}

function createDispatchPlanBody(input: {
  seedAuthority: Awaited<ReturnType<ReturnType<typeof createEditPlanningAuthorityService>['loadApprovedExecutionAuthority']>>
  planningInputAuthority: Awaited<ReturnType<typeof prepareExactPlanningAuthority>>
  sourceMediaAuthority: {
    authorityRevision: number
    authorityChecksumSha256: string
    sourceSequenceHash: string
    candidateHash: string
  }
  d3OperationId: string
  duckdbOperationId: string
  pyavOperationId: string
  scipyOperationId: string
  pyloudnormOperationId: string
  pydubOperationId: string
  pydubEffectsOperationId: string
  ebuR128OperationId: string
  audioreadOperationId: string
  resampyOperationId: string
  pedalboardOperationId: string
  mirEvalOperationId: string
  midoOperationId: string
  ffprobeOperationId: string
  ffmpegOperationId: string
  remotionOperationId: string
  libassOperationId: string
  mediaSourceItem: {
    sourceSequenceItemId: string
    mediaAssetId: string
    uploadedOrder: number
    checksumSha256: string
    required: true
  }
  matrixOperationIds: Record<MatrixToolId, string>
}): PublishCanonicalEditPlanBody {
  const components = structuredClone(input.seedAuthority.components)
  components.sourceSequence.push(input.mediaSourceItem)
  components.sourceCleanupPlan.decisions.push({
    decisionId: 'cleanup-python-media-source',
    sourceSequenceItemId: input.mediaSourceItem.sourceSequenceItemId,
    action: 'preserve',
    startFrame: 0,
    endFrameExclusive: 48,
    reason: 'Preserve the approved synthetic media fixture for bounded decode verification.',
    confidence: 1,
    meaningPreservationStatus: 'passed',
    userReviewStatus: 'not_required',
  })
  components.toolStrategyPlan = {
    toolIds: [
      'd3', 'duckdb', 'pyav', 'scipy', 'pyloudnorm', 'pydub', 'pydub_effects',
      'ebu_r128_pyloudnorm', 'ffprobe', 'ffmpeg', 'sharp',
      'audioread', 'resampy', 'pedalboard',
      'mir_eval', 'mido',
      'remotion',
      'libass',
      ...matrixToolIds,
    ],
    exactOperationIds: [
      input.d3OperationId,
      input.duckdbOperationId,
      input.pyavOperationId,
      input.scipyOperationId,
      input.pyloudnormOperationId,
      input.pydubOperationId,
      input.pydubEffectsOperationId,
      input.ebuR128OperationId,
      input.audioreadOperationId,
      input.resampyOperationId,
      input.pedalboardOperationId,
      input.mirEvalOperationId,
      input.midoOperationId,
      input.remotionOperationId,
      input.libassOperationId,
      ...matrixToolIds.map((toolId) => input.matrixOperationIds[toolId]),
      input.ffprobeOperationId,
      input.ffmpegOperationId,
      'tool.sharp.prepare_approved_image_asset.v1',
    ],
  }
  return {
    workspaceId,
    planningRequestId: 'planning-canonical-tool-dispatch',
    planningInputAuthority: input.planningInputAuthority,
    sourceMediaAuthority: input.sourceMediaAuthority,
    canonicalPlan: {
      schemaVersion: PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
      components,
      estimate: {
        lineItems: [
          {
            lineKey: 'dispatch-authority',
            label: 'Controlled chart tool authorization',
            category: 'controlled_tool',
            estimatedCredits: 10,
            removable: false,
            metadata: { canonicalToolId: 'd3', operationId: input.d3OperationId },
          },
          {
            lineKey: 'source-trim-validation-authority',
            label: 'Canonical source trim validation authority',
            category: 'internal_validation',
            estimatedCredits: 1,
            removable: false,
            metadata: { operationId: 'internal.validate_approved_source_trim_plan.v1' },
          },
          {
            lineKey: 'structured-data-authority',
            label: 'Controlled data query authorization',
            category: 'controlled_tool',
            estimatedCredits: 4,
            removable: false,
            metadata: { canonicalToolId: 'duckdb', operationId: input.duckdbOperationId },
          },
          {
            lineKey: 'source-media-analysis-authority',
            label: 'Controlled source media decode authorization',
            category: 'controlled_tool',
            estimatedCredits: 4,
            removable: false,
            metadata: { canonicalToolId: 'pyav', operationId: input.pyavOperationId },
          },
          {
            lineKey: 'source-media-probe-authority',
            label: 'Controlled source media inspection authorization',
            category: 'controlled_tool',
            estimatedCredits: 2,
            removable: false,
            metadata: { canonicalToolId: 'ffprobe', operationId: input.ffprobeOperationId },
          },
          {
            lineKey: 'scipy-audio-analysis-authority', label: 'Controlled signal analysis authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'scipy', operationId: input.scipyOperationId },
          },
          {
            lineKey: 'pyloudnorm-analysis-authority', label: 'Controlled loudness analysis authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'pyloudnorm', operationId: input.pyloudnormOperationId },
          },
          {
            lineKey: 'pydub-audio-process-authority', label: 'Controlled audio processing authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'pydub', operationId: input.pydubOperationId },
          },
          {
            lineKey: 'pydub-effects-authority', label: 'Controlled audio recipe authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'pydub_effects', operationId: input.pydubEffectsOperationId },
          },
          {
            lineKey: 'ebu-r128-authority', label: 'Controlled EBU R128 gate authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'ebu_r128_pyloudnorm', operationId: input.ebuR128OperationId },
          },
          {
            lineKey: 'audioread-authority', label: 'Controlled audio decode verification authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'audioread', operationId: input.audioreadOperationId },
          },
          {
            lineKey: 'resampy-authority', label: 'Controlled audio resampling authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'resampy', operationId: input.resampyOperationId },
          },
          {
            lineKey: 'pedalboard-authority', label: 'Controlled voice effect chain authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'pedalboard', operationId: input.pedalboardOperationId },
          },
          {
            lineKey: 'mir-eval-authority', label: 'Controlled music timing score authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'mir_eval', operationId: input.mirEvalOperationId },
          },
          {
            lineKey: 'mido-authority', label: 'Controlled MIDI timing validation authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'mido', operationId: input.midoOperationId },
          },
          ...matrixToolIds.map((toolId) => ({
            lineKey: `matrix-${toolId}-authority`,
            label: `Controlled ${toolId} exact lifecycle authorization`,
            category: 'controlled_tool' as const,
            estimatedCredits: 2,
            removable: false,
            metadata: { canonicalToolId: toolId, operationId: input.matrixOperationIds[toolId] },
          })),
          {
            lineKey: 'remotion-private-preview-authority',
            label: 'Controlled Remotion private preview authorization',
            category: 'controlled_tool', estimatedCredits: 2, removable: false,
            metadata: { canonicalToolId: 'remotion', operationId: input.remotionOperationId },
          },
          {
            lineKey: 'libass-caption-overlay-authority',
            label: 'Controlled libass private caption overlay authorization',
            category: 'controlled_tool', estimatedCredits: 1, removable: false,
            metadata: { canonicalToolId: 'libass', operationId: input.libassOperationId },
          },
        ],
        fallbackAllowanceCredits: 5,
        validForSeconds: 3_600,
      },
      workItems: [
        {
          workItemKey: 'snapshot-validation-root',
          workItemType: 'validate_approved_snapshot',
          workerClass: 'authority_worker',
          executionInput: { operation: 'validate_snapshot_manifest' },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'snapshot-validation-evidence',
            artifactType: 'authority_validation_evidence',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: [],
            timingIds: [],
            rendererLayerIds: [],
          }],
          dependencyKeys: [],
          approvedToolIds: [],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 1,
          attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 1,
          required: true,
        },
        {
          workItemKey: 'source-trim-validation',
          workItemType: 'prepare_source_trim',
          workerClass: 'authority_worker',
          executionInput: { operation: 'validate_approved_source_trim_plan' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'source-trim-validation-evidence',
            artifactType: 'source_trim_validation_evidence',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['source-video-layer'],
          }],
          dependencyKeys: ['snapshot-validation-root'],
          approvedToolIds: [],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 1,
          attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 1,
          required: true,
        },
        {
          workItemKey: 'chart-root',
          workItemType: 'render_chart_asset',
          workerClass: 'controlled_graphics_worker',
          executionInput: {
            operation: 'render_approved_chart',
            approvedToolOperationIds: [input.d3OperationId],
            expectedOutputKeys: ['chart-primary', 'chart-alias'],
            structuredPayload: {
              width: 720,
              height: 405,
              title: 'Approved quarterly evidence',
              xAxisLabel: 'Quarter',
              yAxisLabel: 'Revenue',
              theme: 'light',
              data: [
                { label: 'Q1', value: 14 },
                { label: 'Q2', value: 23 },
                { label: 'Q3', value: 31 },
              ],
            },
          },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [
            {
              outputKey: 'chart-primary',
              artifactType: 'controlled_chart_svg',
              assetRole: 'generated',
              required: true,
              previewPlaceholderAllowed: false,
              contentType: 'image/svg+xml',
              segmentIds: ['segment-1'],
              timingIds: ['master-timing-plan'],
              rendererLayerIds: ['chart-layer-primary'],
            },
            {
              outputKey: 'chart-alias',
              artifactType: 'controlled_chart_svg',
              assetRole: 'generated',
              required: false,
              previewPlaceholderAllowed: false,
              contentType: 'image/svg+xml',
              segmentIds: ['segment-1'],
              timingIds: ['master-timing-plan'],
              rendererLayerIds: ['chart-layer-alias'],
            },
          ],
          dependencyKeys: [],
          approvedToolIds: ['d3'],
          providerExecutionMode: 'none',
          fallbackPolicy: { allowedToolIds: ['echarts', 'remotion'] },
          maxAttempts: 2,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 2,
          required: true,
        },
        {
          workItemKey: 'chart-dependent',
          workItemType: 'render_chart_asset',
          workerClass: 'controlled_graphics_worker',
          executionInput: {
            operation: 'render_approved_chart',
            approvedToolOperationIds: [input.d3OperationId],
            expectedOutputKeys: ['chart-dependent'],
            structuredPayload: {
              width: 720,
              height: 405,
              title: 'Approved quarterly evidence',
              xAxisLabel: 'Quarter',
              yAxisLabel: 'Revenue',
              theme: 'light',
              data: [
                { label: 'Q1', value: 14 },
                { label: 'Q2', value: 23 },
                { label: 'Q3', value: 31 },
              ],
            },
          },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'chart-dependent',
            artifactType: 'controlled_chart_svg',
            assetRole: 'generated',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'image/svg+xml',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['chart-layer-dependent'],
          }],
          dependencyKeys: ['snapshot-validation-root'],
          approvedToolIds: ['d3'],
          providerExecutionMode: 'none',
          fallbackPolicy: { allowedToolIds: ['echarts', 'remotion'] },
          maxAttempts: 2,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 2,
          required: true,
        },
        {
          workItemKey: 'sharp-root',
          workItemType: 'process_image_asset',
          workerClass: 'image_processing_worker',
          executionInput: {
            operation: 'prepare_approved_image_asset',
            approvedToolOperationIds: ['tool.sharp.prepare_approved_image_asset.v1'],
            expectedOutputKeys: ['sharp-panel-png'],
            structuredPayload: {
              imageRecipeId: 'approved_panel_asset_v1',
              outputFormat: 'png',
              outputWidth: 640,
              outputHeight: 360,
              preserveMetadata: false,
              allowUpscale: false,
            },
          },
          sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'sharp-panel-png', artifactType: 'approved_sharp_panel_image',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'image/png', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: ['sharp-panel-layer'],
          }],
          dependencyKeys: ['chart-root'], approvedToolIds: ['sharp'],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0,
          maximumCreditBudget: 2, required: true,
        },
        {
          workItemKey: 'sharp-proof-consumer',
          workItemType: 'run_asset_qa', workerClass: 'qa_worker',
          executionInput: { operation: 'validate_sharp_image_artifact' },
          sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'sharp-proof-report', artifactType: 'sharp_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['sharp-root'], approvedToolIds: [],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0,
          maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'data-root',
          workItemType: 'custom',
          workerClass: 'qa_worker',
          executionInput: {
            operation: 'query_approved_artifact_tables',
            approvedToolOperationIds: [input.duckdbOperationId],
            expectedOutputKeys: ['data-report'],
            structuredPayload: {
              queryProfileId: 'approved_qa_aggregate_v1',
              maximumRows: 10,
              rows: [
                { rowId: 'row_one', category: 'captions', status: 'passed', startFrame: 0, endFrame: 30, value: 0.9 },
                { rowId: 'row_two', category: 'captions', status: 'warning', startFrame: 30, endFrame: 60, value: 0.7 },
              ],
            },
          },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'data-report',
            artifactType: 'controlled_data_qa_report',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: [],
          }],
          dependencyKeys: [],
          approvedToolIds: ['duckdb'],
          providerExecutionMode: 'none',
          fallbackPolicy: { allowedToolIds: ['polars'] },
          maxAttempts: 2,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 2,
          required: true,
        },
        {
          workItemKey: 'data-proof-consumer',
          workItemType: 'custom',
          workerClass: 'qa_worker',
          executionInput: { operation: 'validate_structured_data_artifact' },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'data-proof-report',
            artifactType: 'structured_data_dependency_report',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: [],
          }],
          dependencyKeys: ['data-root'],
          approvedToolIds: [],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 1,
          attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 1,
          required: true,
        },
        {
          workItemKey: 'media-root',
          workItemType: 'process_video_asset',
          workerClass: 'media_analysis_worker',
          executionInput: {
            operation: 'decode_approved_media',
            approvedToolOperationIds: [input.pyavOperationId],
            expectedOutputKeys: ['media-analysis-report'],
            structuredPayload: {
              decodeProfileId: 'timestamp_safe_sample_v1',
              frameStride: 5,
              maximumSamples: 10,
              preserveSourceTimestamps: true,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'media-analysis-report',
            artifactType: 'controlled_source_media_analysis',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: [],
          }],
          dependencyKeys: [],
          approvedToolIds: ['pyav'],
          providerExecutionMode: 'none',
          fallbackPolicy: { allowedToolIds: ['opencv'] },
          maxAttempts: 2,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 2,
          required: true,
        },
        {
          workItemKey: 'media-proof-consumer',
          workItemType: 'run_asset_qa',
          workerClass: 'qa_worker',
          executionInput: { operation: 'validate_source_media_analysis_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'media-proof-report',
            artifactType: 'source_media_dependency_report',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: [],
          }],
          dependencyKeys: ['media-root'],
          approvedToolIds: [],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 1,
          attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 1,
          required: true,
        },
        {
          workItemKey: 'scipy-audio-root', workItemType: 'run_audio_analysis',
          workerClass: 'audio_analysis_worker',
          executionInput: {
            operation: 'analyze_signal', approvedToolOperationIds: [input.scipyOperationId],
            expectedOutputKeys: ['scipy-audio-report'],
            structuredPayload: {
              sampleRate: 48_000, channelMode: 'mono',
              analysisProfileId: 'approved_spectral_summary_v1', confidenceThreshold: 0.8,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'scipy-audio-report', artifactType: 'controlled_scipy_audio_analysis',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['scipy'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'scipy-audio-proof-consumer', workItemType: 'run_asset_qa',
          workerClass: 'qa_worker', executionInput: { operation: 'validate_scipy_audio_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'scipy-audio-proof-report', artifactType: 'scipy_audio_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['scipy-audio-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'loudness-root', workItemType: 'run_audio_analysis',
          workerClass: 'audio_analysis_worker',
          executionInput: {
            operation: 'measure_loudness', approvedToolOperationIds: [input.pyloudnormOperationId],
            expectedOutputKeys: ['loudness-report'],
            structuredPayload: {
              targetLufs: -16, truePeakDbtp: -1, channelMode: 'mono',
              measurementProfileId: 'ebu_r128_integrated_v1',
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'loudness-report', artifactType: 'controlled_loudness_analysis',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['pyloudnorm'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'loudness-proof-consumer', workItemType: 'run_asset_qa',
          workerClass: 'qa_worker', executionInput: { operation: 'validate_loudness_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'loudness-proof-report', artifactType: 'loudness_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['loudness-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'pydub-audio-root', workItemType: 'custom',
          workerClass: 'audio_processing_worker',
          executionInput: {
            operation: 'process_audio_segments', approvedToolOperationIds: [input.pydubOperationId],
            expectedOutputKeys: ['pydub-processed-audio'],
            structuredPayload: {
              sampleRate: 48_000, channelMode: 'mono',
              processingProfileId: 'approved_voice_polish_v1', strength: 0.5, preserveVoice: true,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'pydub-processed-audio', artifactType: 'controlled_processed_audio_wav',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'audio/wav', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['pydub'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'pydub-audio-proof-consumer', workItemType: 'run_asset_qa',
          workerClass: 'qa_worker', executionInput: { operation: 'validate_pydub_audio_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'pydub-audio-proof-report', artifactType: 'pydub_audio_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['pydub-audio-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'pydub-effects-root', workItemType: 'custom', workerClass: 'audio_processing_worker',
          executionInput: {
            operation: 'apply_approved_audio_recipe',
            approvedToolOperationIds: [input.pydubEffectsOperationId],
            expectedOutputKeys: ['pydub-effects-audio'],
            structuredPayload: {
              sampleRate: 48_000, channelMode: 'mono',
              processingProfileId: 'approved_voice_polish_v1', strength: 0.5, preserveVoice: true,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'pydub-effects-audio', artifactType: 'controlled_effects_audio_wav',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'audio/wav', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['pydub_effects'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'pydub-effects-proof-consumer', workItemType: 'run_asset_qa', workerClass: 'qa_worker',
          executionInput: { operation: 'validate_pydub_effects_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'pydub-effects-proof-report', artifactType: 'pydub_effects_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['pydub-effects-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'ebu-r128-root', workItemType: 'run_audio_analysis', workerClass: 'audio_analysis_worker',
          executionInput: {
            operation: 'measure_ebu_r128_loudness', approvedToolOperationIds: [input.ebuR128OperationId],
            expectedOutputKeys: ['ebu-r128-report'],
            structuredPayload: {
              targetLufs: -16, truePeakDbtp: -1, channelMode: 'mono',
              measurementProfileId: 'ebu_r128_integrated_v1',
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'ebu-r128-report', artifactType: 'controlled_ebu_r128_analysis',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['ebu_r128_pyloudnorm'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'ebu-r128-proof-consumer', workItemType: 'run_asset_qa', workerClass: 'qa_worker',
          executionInput: { operation: 'validate_ebu_r128_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'ebu-r128-proof-report', artifactType: 'ebu_r128_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['ebu-r128-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'audioread-root', workItemType: 'run_audio_analysis', workerClass: 'audio_analysis_worker',
          executionInput: {
            operation: 'verify_audio_decode', approvedToolOperationIds: [input.audioreadOperationId],
            expectedOutputKeys: ['audioread-report'],
            structuredPayload: {
              decodeProfileId: 'approved_pcm_decode_v1', maximumChannels: 2, maximumSampleRate: 48_000,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'audioread-report', artifactType: 'controlled_audio_decode_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['audioread'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'audioread-proof-consumer', workItemType: 'run_asset_qa', workerClass: 'qa_worker',
          executionInput: { operation: 'validate_audioread_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'audioread-proof-report', artifactType: 'audioread_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['audioread-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'resampy-root', workItemType: 'custom', workerClass: 'audio_processing_worker',
          executionInput: {
            operation: 'resample_audio', approvedToolOperationIds: [input.resampyOperationId],
            expectedOutputKeys: ['resampy-audio'],
            structuredPayload: {
              sampleRate: 22_050, channelMode: 'mono', processingProfileId: 'approved_resample_v1',
              strength: 1, preserveVoice: true,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'resampy-audio', artifactType: 'controlled_resampled_audio_wav',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'audio/wav', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['resampy'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'resampy-proof-consumer', workItemType: 'run_asset_qa', workerClass: 'qa_worker',
          executionInput: { operation: 'validate_resampy_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'resampy-proof-report', artifactType: 'resampy_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['resampy-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'pedalboard-root', workItemType: 'custom', workerClass: 'audio_processing_worker',
          executionInput: {
            operation: 'apply_audio_effect_chain', approvedToolOperationIds: [input.pedalboardOperationId],
            expectedOutputKeys: ['pedalboard-audio'],
            structuredPayload: {
              sampleRate: 48_000, channelMode: 'mono',
              processingProfileId: 'approved_voice_effect_chain_v1', strength: 0.5, preserveVoice: true,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'pedalboard-audio', artifactType: 'controlled_pedalboard_audio_wav',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'audio/wav', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['pedalboard'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'pedalboard-proof-consumer', workItemType: 'run_asset_qa', workerClass: 'qa_worker',
          executionInput: { operation: 'validate_pedalboard_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'pedalboard-proof-report', artifactType: 'pedalboard_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['pedalboard-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'mir-eval-root', workItemType: 'run_audio_analysis', workerClass: 'audio_analysis_worker',
          executionInput: {
            operation: 'score_music_timing', approvedToolOperationIds: [input.mirEvalOperationId],
            expectedOutputKeys: ['mir-eval-report'],
            structuredPayload: {
              sampleRate: 48_000, channelMode: 'mono',
              analysisProfileId: 'approved_music_timing_score_v1', confidenceThreshold: 0.8,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'mir-eval-report', artifactType: 'controlled_music_timing_score',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['mir_eval'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'mir-eval-proof-consumer', workItemType: 'run_asset_qa', workerClass: 'qa_worker',
          executionInput: { operation: 'validate_mir_eval_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'mir-eval-proof-report', artifactType: 'mir_eval_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['mir-eval-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'mido-root', workItemType: 'run_audio_analysis', workerClass: 'audio_analysis_worker',
          executionInput: {
            operation: 'validate_midi_events', approvedToolOperationIds: [input.midoOperationId],
            expectedOutputKeys: ['mido-report'],
            structuredPayload: {
              timingResolutionPpq: 480, tempoPolicy: 'approved_map',
              timingProfileId: 'approved_midi_validation_v1',
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'mido-report', artifactType: 'controlled_midi_timing_validation',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [], approvedToolIds: ['mido'], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'mido-proof-consumer', workItemType: 'run_asset_qa', workerClass: 'qa_worker',
          executionInput: { operation: 'validate_mido_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'mido-proof-report', artifactType: 'mido_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['mido-root'], approvedToolIds: [], providerExecutionMode: 'none',
          fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
        },
        ...createMatrixWorkItems(input),
        ...createRemotionWorkItems(input),
        ...createLibassWorkItems(input),
        {
          workItemKey: 'probe-root',
          workItemType: 'run_asset_qa',
          workerClass: 'media_analysis_worker',
          executionInput: {
            operation: 'inspect_approved_media',
            approvedToolOperationIds: [input.ffprobeOperationId],
            expectedOutputKeys: ['probe-report'],
            structuredPayload: {
              inspectionProfileId: 'source_intake_v1',
              countFrames: true,
              verifyDurationAndSync: true,
              emitMachineJsonOnly: true,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'probe-report', artifactType: 'controlled_ffprobe_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: [],
          approvedToolIds: ['ffprobe'],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0,
          maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'probe-proof-consumer',
          workItemType: 'run_asset_qa',
          workerClass: 'qa_worker',
          executionInput: { operation: 'validate_ffprobe_artifact' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'probe-proof-report', artifactType: 'ffprobe_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['probe-root'], approvedToolIds: [],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0,
          maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'trim-root',
          workItemType: 'process_video_asset',
          workerClass: 'media_processing_worker',
          executionInput: {
            operation: 'execute_approved_media_recipe',
            approvedToolOperationIds: [input.ffmpegOperationId],
            expectedOutputKeys: ['trimmed-intermediate'],
            structuredPayload: {
              recipeProfileId: 'approved_trim_transcode_v1',
              timestampPolicy: 'normalize_from_zero',
              overwriteExistingArtifact: false,
              allowUnreviewedCodec: false,
              trimStartFrame: 0,
              trimEndFrameExclusive: 24,
              frameRate: 24,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'trimmed-intermediate', artifactType: 'approved_ffv1_nut_intermediate',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'video/x-nut', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: ['source-video-layer'],
          }],
          dependencyKeys: [], approvedToolIds: ['ffmpeg'],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0,
          maximumCreditBudget: 2, required: true,
        },
        {
          workItemKey: 'trim-proof-consumer',
          workItemType: 'run_asset_qa',
          workerClass: 'qa_worker',
          executionInput: { operation: 'validate_ffmpeg_intermediate' },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'trim-proof-report', artifactType: 'ffmpeg_intermediate_dependency_report',
            assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
            contentType: 'application/json', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: [],
          }],
          dependencyKeys: ['trim-root'], approvedToolIds: [],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0,
          maximumCreditBudget: 1, required: true,
        },
        {
          workItemKey: 'chart-proof-consumer',
          workItemType: 'custom',
          workerClass: 'qa_worker',
          executionInput: { operation: 'validate_structured_chart_artifact' },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'chart-proof-report',
            artifactType: 'structured_chart_qa_report',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'],
            rendererLayerIds: [],
          }],
          dependencyKeys: ['chart-root'],
          approvedToolIds: [],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 1,
          attemptTimeoutSeconds: 120,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 1,
          required: true,
        },
        {
          workItemKey: 'final-qa',
          workItemType: 'run_final_qa',
          workerClass: 'qa_worker',
          executionInput: {
            operation: 'inspect_final_artifact',
            approvedToolOperationIds: [input.ffprobeOperationId],
            expectedOutputKeys: ['final-qa-report'],
            structuredPayload: {
              inspectionProfileId: 'final_export_v1',
              countFrames: true,
              verifyDurationAndSync: true,
              emitMachineJsonOnly: true,
            },
          },
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
          expectedOutputs: [{
            outputKey: 'final-qa-report',
            artifactType: 'final_qa_report',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: components.segments.map((segment) => segment.segmentId),
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['source-video-layer', 'libass-caption-overlay-layer'],
          }],
          dependencyKeys: ['remotion-source-caption-final'],
          approvedToolIds: ['ffprobe'],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 2,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 1,
          required: true,
        },
        {
          workItemKey: 'remotion-source-caption-final',
          workItemType: 'render_final_export',
          workerClass: 'render_worker',
          executionInput: {
            operation: 'render_approved_source_caption_final',
            approvedToolOperationIds: [input.remotionOperationId],
            expectedOutputKeys: ['private-final-composition-mp4'],
            structuredPayload: {
              compositionProfileId: 'approved_source_caption_final_v1',
              width: 640, height: 360, fps: 24, durationFrames: 48,
              sourceStartFrame: 0, sourceEndFrameExclusive: 48,
              sourceFit: 'contain', panelBackground: '#000000',
              audioPolicy: 'preserve_source',
              captionOverlayPolicy: 'approved_full_frame_rgba',
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'private-final-composition-mp4',
            artifactType: 'private_source_caption_final_video_export',
            assetRole: 'final',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'video/mp4',
            segmentIds: components.segments.map((segment) => segment.segmentId),
            timingIds: ['master-timing-plan'],
            rendererLayerIds: ['source-video-layer', 'libass-caption-overlay-layer'],
          }],
          dependencyKeys: ['source-trim-validation', 'libass-caption-overlay-root'],
          approvedToolIds: ['remotion'],
          providerExecutionMode: 'none',
          fallbackPolicy: {},
          maxAttempts: 2,
          attemptTimeoutSeconds: 1_800,
          scheduledDelaySeconds: 0,
          maximumCreditBudget: 3,
          required: true,
        },
      ],
    },
  }
}

type CanonicalSmokeWorkItem = PublishCanonicalEditPlanBody['canonicalPlan']['workItems'][number]

function createRemotionWorkItems(
  input: Parameters<typeof createDispatchPlanBody>[0],
): CanonicalSmokeWorkItem[] {
  return [{
    workItemKey: 'remotion-private-preview-root',
    workItemType: 'render_remotion_preview',
    workerClass: 'render_worker',
    executionInput: {
      operation: 'render_approved_composition',
      approvedToolOperationIds: [input.remotionOperationId],
      expectedOutputKeys: ['remotion-private-preview-mp4'],
      structuredPayload: {
        width: 640, height: 360, fps: 24, durationFrames: 24,
        frameTemplateId: 'approved_full_panel_v1',
        panelBackground: '#F7F8FA', accentColor: '#4F46E5',
        title: 'Approved ReEditPro composition',
        subtitle: 'Canonical private preview evidence',
        caption: 'Frame-accurate Remotion proof',
      },
    },
    sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'remotion-private-preview-mp4',
      artifactType: 'controlled_remotion_private_preview_mp4',
      assetRole: 'preview', required: true, previewPlaceholderAllowed: false,
      contentType: 'video/mp4', segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'], rendererLayerIds: ['remotion-private-preview-layer'],
    }],
    dependencyKeys: [], approvedToolIds: ['remotion'], providerExecutionMode: 'none',
    fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }, {
    workItemKey: 'remotion-private-preview-proof',
    workItemType: 'run_asset_qa', workerClass: 'qa_worker',
    executionInput: { operation: 'validate_remotion_private_preview_artifact' },
    sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'remotion-private-preview-proof-report',
      artifactType: 'remotion_private_preview_dependency_report',
      assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
      contentType: 'application/json', segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'], rendererLayerIds: [],
    }],
    dependencyKeys: ['remotion-private-preview-root'], approvedToolIds: [], providerExecutionMode: 'none',
    fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
    scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }]
}

function createLibassWorkItems(
  input: Parameters<typeof createDispatchPlanBody>[0],
): CanonicalSmokeWorkItem[] {
  return [{
    workItemKey: 'libass-caption-overlay-root',
    workItemType: 'custom',
    workerClass: 'render_worker',
    executionInput: {
      operation: 'render_approved_caption_overlay',
      approvedToolOperationIds: [input.libassOperationId],
      expectedOutputKeys: ['libass-caption-overlay-png'],
      structuredPayload: {
        captionProfileId: 'approved_ass_track_render_v1',
        fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
        collisionPolicy: 'fail_on_reserved_zone_collision',
        preserveSpeechTiming: true,
        width: 640,
        height: 360,
        timestampMs: 1000,
        fontSize: 42,
        marginV: 48,
        alignment: 2,
        caption: 'Approved frame accurate caption',
      },
    },
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'libass-caption-overlay-png',
      artifactType: 'controlled_libass_caption_overlay_png',
      assetRole: 'processed',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'image/png',
      segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'],
      rendererLayerIds: ['libass-caption-overlay-layer'],
    }],
    dependencyKeys: [],
    approvedToolIds: ['libass'],
    providerExecutionMode: 'none',
    fallbackPolicy: {},
    maxAttempts: 2,
    attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 1,
    required: true,
  }, {
    workItemKey: 'libass-caption-overlay-proof',
    workItemType: 'run_asset_qa',
    workerClass: 'qa_worker',
    executionInput: { operation: 'validate_libass_caption_overlay_artifact' },
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'libass-caption-overlay-proof-report',
      artifactType: 'libass_caption_overlay_dependency_report',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'],
      rendererLayerIds: [],
    }],
    dependencyKeys: ['libass-caption-overlay-root'],
    approvedToolIds: [],
    providerExecutionMode: 'none',
    fallbackPolicy: {},
    maxAttempts: 1,
    attemptTimeoutSeconds: 120,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 1,
    required: true,
  }]
}

function createMatrixWorkItems(
  input: Parameters<typeof createDispatchPlanBody>[0],
): CanonicalSmokeWorkItem[] {
  const nodeToolIds = [
    'echarts', 'vega_lite', 'vega', 'satori', 'svg_js', 'viz_js', 'animejs', 'three_js',
  ] as const
  const nodeItems = nodeToolIds.flatMap((toolId): CanonicalSmokeWorkItem[] => {
    const rootKey = `matrix-${toolId}-root`
    const outputKey = `matrix-${toolId}-artifact`
    const structuredPayload = toolId === 'three_js'
      ? {
          width: 720, height: 405, fps: 30, durationFrames: 60,
          sceneProfileId: 'approved_product_cube_v1' as const,
          cameraProfileId: 'approved_perspective_v1' as const,
          lightingProfileId: 'approved_studio_v1' as const,
          title: 'Approved product scene',
        }
      : toolId === 'animejs'
      ? {
          width: 720, height: 405, fps: 30, durationFrames: 60,
          motionProfileId: 'approved_card_reveal_v1' as const,
          backgroundMode: 'opaque_panel' as const,
          title: 'Approved deterministic motion',
        }
      : toolId === 'satori' || toolId === 'svg_js'
      ? {
          width: 720, height: 405, theme: 'light' as const,
          eyebrow: 'Verified tool', title: `Approved ${toolId} card`,
          body: 'Exact canonical lifecycle evidence', callout: 'Passed',
        }
      : toolId === 'viz_js'
        ? {
            direction: 'left_to_right' as const, theme: 'light' as const,
            title: 'Approved dependency graph',
            nodes: [{ id: 'source', label: 'Source' }, { id: 'result', label: 'Result' }],
            edges: [{ from: 'source', to: 'result', label: 'produces' }],
          }
        : {
            width: 720, height: 405, title: `Approved ${toolId} evidence`,
            xAxisLabel: 'Quarter', yAxisLabel: 'Revenue', theme: 'light' as const,
            data: [{ label: 'Q1', value: 14 }, { label: 'Q2', value: 23 }, { label: 'Q3', value: 31 }],
          }
    return [{
      workItemKey: rootKey,
      workItemType: toolId === 'echarts' || toolId === 'vega_lite' || toolId === 'vega'
        ? 'render_chart_asset'
        : 'custom',
      workerClass: 'controlled_graphics_worker',
      executionInput: {
        operation: `execute_${toolId}_matrix_case`,
        approvedToolOperationIds: [input.matrixOperationIds[toolId]],
        expectedOutputKeys: [outputKey], structuredPayload,
      },
      sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{
        outputKey, artifactType: `controlled_${toolId}_svg`, assetRole: 'generated',
        required: true, previewPlaceholderAllowed: false, contentType: 'image/svg+xml',
        segmentIds: ['segment-1'], timingIds: ['master-timing-plan'],
        rendererLayerIds: [`matrix-${toolId}-layer`],
      }],
      dependencyKeys: [], approvedToolIds: [toolId], providerExecutionMode: 'none',
      fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
      scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }, {
      workItemKey: `matrix-${toolId}-proof`, workItemType: 'run_asset_qa', workerClass: 'qa_worker',
      executionInput: { operation: `validate_${toolId}_matrix_artifact` },
      sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{
        outputKey: `matrix-${toolId}-proof-report`, artifactType: `${toolId}_matrix_dependency_report`,
        assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
        contentType: 'application/json', segmentIds: ['segment-1'],
        timingIds: ['master-timing-plan'], rendererLayerIds: [],
      }],
      dependencyKeys: [rootKey], approvedToolIds: [], providerExecutionMode: 'none',
      fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
      scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }]
  })

  const browserToolIds = ['lottie', 'pixijs', 'konva', 'babylon_js', 'playwright'] as const
  const browserItems = browserToolIds.flatMap((toolId): CanonicalSmokeWorkItem[] => {
    const rootKey = `matrix-${toolId}-root`
    const outputKey = `matrix-${toolId}-artifact`
    const reviewedCopy = {
      eyebrow: toolId === 'playwright' ? 'AUTHORIZED CAPTURE' : 'EDIT PLAN',
      title: toolId === 'playwright' ? 'Private Review Card' : 'Approved Story Card',
      body: toolId === 'playwright'
        ? 'This server-owned template is approved for internal capture.'
        : 'Meaning first. Timing locked.',
      callout: toolId === 'playwright' ? 'No network. No public URL.' : 'Ready for private review',
    }
    const structuredPayload = toolId === 'lottie' || toolId === 'pixijs'
      ? {
          width: 640 as const, height: 360 as const, fps: 30 as const, durationFrames: 60 as const,
          motionProfileId: 'approved_motion_card_v1' as const, backgroundMode: 'opaque_panel' as const,
        }
      : toolId === 'konva'
        ? {
            width: 640 as const, height: 360 as const, themeProfileId: 'approved_light_card_v1' as const,
            fontProfileId: 'reeditpro_reviewed_fonts_v1' as const, maximumTextItems: 4 as const, reviewedCopy,
          }
        : toolId === 'babylon_js'
          ? {
              width: 640 as const, height: 360 as const, fps: 30 as const, durationFrames: 60 as const,
              sceneProfileId: 'approved_product_cube_v1' as const, cameraProfileId: 'approved_perspective_v1' as const,
              lightingProfileId: 'approved_studio_v1' as const,
            }
          : {
              captureSourceKind: 'approved_internal_html_v1' as const,
              captureTemplateId: 'reeditpro_private_capture_card_v1' as const,
              capturePolicyConfirmed: true as const, viewportWidth: 640 as const, viewportHeight: 360 as const,
              deviceScaleFactor: 1 as const, reviewedCopy,
            }
    return [{
      workItemKey: rootKey, workItemType: 'custom', workerClass: 'controlled_graphics_worker',
      executionInput: {
        operation: `execute_${toolId}_browser_graphics_case`,
        approvedToolOperationIds: [input.matrixOperationIds[toolId]], expectedOutputKeys: [outputKey], structuredPayload,
      },
      sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{
        outputKey, artifactType: `controlled_${toolId}_png`, assetRole: 'generated', required: true,
        previewPlaceholderAllowed: false, contentType: 'image/png', segmentIds: ['segment-1'],
        timingIds: ['master-timing-plan'], rendererLayerIds: [`matrix-${toolId}-layer`],
      }],
      dependencyKeys: [], approvedToolIds: [toolId], providerExecutionMode: 'none',
      fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
      scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }, {
      workItemKey: `matrix-${toolId}-proof`, workItemType: 'run_asset_qa', workerClass: 'qa_worker',
      executionInput: { operation: `validate_${toolId}_browser_graphics_artifact` },
      sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{
        outputKey: `matrix-${toolId}-proof-report`, artifactType: `${toolId}_browser_graphics_dependency_report`,
        assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json',
        segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [],
      }],
      dependencyKeys: [rootKey], approvedToolIds: [], providerExecutionMode: 'none',
      fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
      scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }]
  })

  const pythonToolIds = [
    'polars', 'opentimelineio', 'opencv', 'pyscenedetect', 'pretty_midi', 'noisereduce',
    'librosa',
  ] as const
  const pythonItems = pythonToolIds.flatMap((toolId): CanonicalSmokeWorkItem[] => {
    const rootKey = `matrix-${toolId}-root`
    const sourceBacked = [
      'opencv', 'pyscenedetect', 'pretty_midi', 'noisereduce',
      'librosa',
    ].includes(toolId)
    const structuredPayload = toolId === 'polars'
      ? {
          transformProfileId: 'approved_timing_table_v1', maximumRows: 10,
          deterministicOrdering: true as const,
          rows: [
            { rowId: 'row_two', category: 'captions', status: 'warning' as const, startFrame: 30, endFrame: 60, value: 0.7 },
            { rowId: 'row_one', category: 'captions', status: 'passed' as const, startFrame: 0, endFrame: 30, value: 0.9 },
          ],
        }
      : toolId === 'opentimelineio'
        ? {
            interchangeProfileId: 'approved_plan_to_otio_v1', frameRate: 30,
            strictRangeValidation: true as const, preserveApprovedSourceOrder: true as const,
            timelineName: 'Approved Matrix Timeline',
            clips: [{
              clipId: 'clip_one', name: 'Opening', mediaReferenceId: 'media_one',
              sourceStartFrame: 0, durationFrames: 30, timelineStartFrame: 0,
            }],
          }
        : toolId === 'pretty_midi'
          ? {
              timingResolutionPpq: 480, tempoPolicy: 'approved_map' as const,
              timingProfileId: 'approved_pretty_midi_timing_v1' as const,
            }
        : toolId === 'librosa'
          ? {
              sampleRate: 48_000, channelMode: 'mono' as const,
              analysisProfileId: 'approved_rhythm_timing_cues_v1' as const,
              confidenceThreshold: 0.6,
            }
        : toolId === 'opencv'
          ? {
              analysisProfileId: 'approved_blur_check_v1', frameStride: 5,
              maximumFrames: 10, emitDerivedPixels: false as const,
            }
          : toolId === 'pyscenedetect'
            ? {
              detectorProfileId: 'content_detector_v1', contentThreshold: 20,
              minimumSceneFrames: 2, downscaleFactor: 1,
            }
            : {
                sampleRate: 48_000, channelMode: 'mono' as const,
                processingProfileId: 'approved_noise_reduction_v1' as const,
                strength: 0.35, preserveVoice: true as const,
              }
    return [{
      workItemKey: rootKey,
      workItemType: toolId === 'pretty_midi' || toolId === 'librosa'
        ? 'run_audio_analysis'
        : toolId === 'noisereduce' ? 'custom' : sourceBacked ? 'process_video_asset' : 'custom',
      workerClass: toolId === 'noisereduce'
        ? 'audio_processing_worker'
        : toolId === 'pretty_midi' || toolId === 'librosa'
          ? 'audio_analysis_worker'
          : sourceBacked ? 'media_analysis_worker' : 'qa_worker',
      executionInput: {
        operation: `execute_${toolId}_matrix_case`,
        approvedToolOperationIds: [input.matrixOperationIds[toolId]],
        expectedOutputKeys: [`matrix-${toolId}-artifact`], structuredPayload,
      },
      sourceSequenceItemIds: sourceBacked ? [input.mediaSourceItem.sourceSequenceItemId] : [],
      sourceCleanupDecisionIds: sourceBacked ? ['cleanup-python-media-source'] : [],
      expectedOutputs: [{
        outputKey: `matrix-${toolId}-artifact`, artifactType: `controlled_${toolId}_${toolId === 'noisereduce' ? 'wav' : 'json'}`,
        assetRole: toolId === 'noisereduce' ? 'processed' : 'qa', required: true,
        previewPlaceholderAllowed: false,
        contentType: toolId === 'noisereduce' ? 'audio/wav' : 'application/json', segmentIds: ['segment-1'],
        timingIds: ['master-timing-plan'], rendererLayerIds: [],
      }],
      dependencyKeys: [], approvedToolIds: [toolId], providerExecutionMode: 'none',
      fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
      scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }, {
      workItemKey: `matrix-${toolId}-proof`, workItemType: 'run_asset_qa', workerClass: 'qa_worker',
      executionInput: { operation: `validate_${toolId}_matrix_artifact` },
      sourceSequenceItemIds: sourceBacked ? [input.mediaSourceItem.sourceSequenceItemId] : [],
      sourceCleanupDecisionIds: sourceBacked ? ['cleanup-python-media-source'] : [],
      expectedOutputs: [{
        outputKey: `matrix-${toolId}-proof-report`, artifactType: `${toolId}_matrix_dependency_report`,
        assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
        contentType: 'application/json', segmentIds: ['segment-1'],
        timingIds: ['master-timing-plan'], rendererLayerIds: [],
      }],
      dependencyKeys: [rootKey], approvedToolIds: [], providerExecutionMode: 'none',
      fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120,
      scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }]
  })
  const aiToolIds = ['music21', 'kornia'] as const
  const aiItems = aiToolIds.flatMap((toolId): CanonicalSmokeWorkItem[] => {
    const rootKey = `matrix-${toolId}-root`; const outputKey = `matrix-${toolId}-artifact`
    const structuredPayload = toolId === 'music21'
      ? { sampleRate: 48_000 as const, channelMode: 'mono' as const, analysisProfileId: 'approved_music_structure_v1' as const, confidenceThreshold: 0.6 as const, fixtureProfileId: 'approved_four_tone_fixture_v1' as const }
      : { confidenceThreshold: 0.5 as const, maximumSubjects: 1 as const, frameStride: 1 as const, edgeRefinementProfileId: 'approved_mask_close_v1' as const, preserveContactObjects: true as const, fixtureProfileId: 'approved_mask_fixture_v1' as const }
    const contentType = toolId === 'kornia' ? 'image/png' as const : 'application/json' as const
    return [{
      workItemKey: rootKey, workItemType: 'custom', workerClass: toolId === 'kornia' ? 'controlled_graphics_worker' : 'qa_worker',
      executionInput: { operation: `execute_${toolId}_ai_capability_case`, approvedToolOperationIds: [input.matrixOperationIds[toolId]], expectedOutputKeys: [outputKey], structuredPayload },
      sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{ outputKey, artifactType: `controlled_${toolId}_${toolId === 'kornia' ? 'png' : 'json'}`, assetRole: toolId === 'kornia' ? 'processed' : 'qa', required: true, previewPlaceholderAllowed: false, contentType, segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: toolId === 'kornia' ? ['matrix-kornia-mask-layer'] : [] }],
      dependencyKeys: [], approvedToolIds: [toolId], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }, {
      workItemKey: `matrix-${toolId}-proof`, workItemType: 'run_asset_qa', workerClass: 'qa_worker', executionInput: { operation: `validate_${toolId}_ai_capability_artifact` }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{ outputKey: `matrix-${toolId}-proof-report`, artifactType: `${toolId}_ai_capability_dependency_report`, assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
      dependencyKeys: [rootKey], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }]
  })
  const nativeImageToolIds = ['opencolorio', 'openimageio'] as const
  const nativeImageItems = nativeImageToolIds.flatMap((toolId): CanonicalSmokeWorkItem[] => {
    const rootKey = `matrix-${toolId}-root`; const outputKey = `matrix-${toolId}-artifact`
    const structuredPayload = toolId === 'opencolorio'
      ? { transformProfileId: 'approved_srgb_to_rec709_v1' as const, inputColorSpace: 'srgb' as const, outputColorSpace: 'rec709' as const, strength: 1 as const, preserveSkinTone: true as const, fixtureProfileId: 'approved_color_chart_v1' as const }
      : { transformProfileId: 'approved_sequence_resize_v1' as const, outputFormat: 'png' as const, outputWidth: 64 as const, outputHeight: 64 as const, preserveMetadata: false as const, fixtureProfileId: 'approved_two_frame_sequence_v1' as const }
    return [{
      workItemKey: rootKey, workItemType: 'custom', workerClass: 'controlled_graphics_worker',
      executionInput: { operation: `execute_${toolId}_native_image_case`, approvedToolOperationIds: [input.matrixOperationIds[toolId]], expectedOutputKeys: [outputKey], structuredPayload }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{ outputKey, artifactType: `controlled_${toolId}_png`, assetRole: 'processed', required: true, previewPlaceholderAllowed: false, contentType: 'image/png', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [`matrix-${toolId}-layer`] }],
      dependencyKeys: [], approvedToolIds: [toolId], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }, {
      workItemKey: `matrix-${toolId}-proof`, workItemType: 'run_asset_qa', workerClass: 'qa_worker', executionInput: { operation: `validate_${toolId}_native_image_artifact` }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{ outputKey: `matrix-${toolId}-proof-report`, artifactType: `${toolId}_native_image_dependency_report`, assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
      dependencyKeys: [rootKey], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }]
  })
  const nativeAudioToolIds = ['rnnoise', 'signalsmith_stretch'] as const
  const nativeAudioItems = nativeAudioToolIds.flatMap((toolId): CanonicalSmokeWorkItem[] => {
    const rootKey = `matrix-${toolId}-root`; const outputKey = `matrix-${toolId}-artifact`
    const structuredPayload = toolId === 'rnnoise'
      ? { sampleRate: 48000 as const, channelMode: 'mono' as const, processingProfileId: 'approved_voice_denoise_v1' as const, strength: 1 as const, preserveVoice: true as const, fixtureProfileId: 'approved_noisy_voice_fixture_v1' as const }
      : { stretchProfileId: 'approved_music_bed_fit_v1' as const, speedRatio: 1.25 as const, pitchSemitones: 0 as const, preserveVoice: false as const, fixtureProfileId: 'approved_music_tone_fixture_v1' as const }
    return [{
      workItemKey: rootKey, workItemType: 'custom', workerClass: 'audio_processing_worker',
      executionInput: { operation: `execute_${toolId}_native_audio_case`, approvedToolOperationIds: [input.matrixOperationIds[toolId]], expectedOutputKeys: [outputKey], structuredPayload }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{ outputKey, artifactType: `controlled_${toolId}_wav`, assetRole: 'processed', required: true, previewPlaceholderAllowed: false, contentType: 'audio/wav', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
      dependencyKeys: [], approvedToolIds: [toolId], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }, {
      workItemKey: `matrix-${toolId}-proof`, workItemType: 'run_asset_qa', workerClass: 'qa_worker', executionInput: { operation: `validate_${toolId}_native_audio_artifact` }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{ outputKey: `matrix-${toolId}-proof-report`, artifactType: `${toolId}_native_audio_dependency_report`, assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
      dependencyKeys: [rootKey], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }]
  })
  const packagingToolIds = ['mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation'] as const
  const packagingItems = packagingToolIds.flatMap((toolId): CanonicalSmokeWorkItem[] => {
    const rootKey = `matrix-${toolId}-root`; const outputKey = `matrix-${toolId}-artifact`
    const structuredPayload = { validationProfileId: 'approved_private_packaging_validation_v1' as const, expectedContainer: toolId === 'mkvtoolnix_container_validation' ? 'mkv' as const : 'mp4' as const, requireAudioVideoSync: true as const, requireCaptionIntegrity: true as const }
    return [{
      workItemKey: rootKey, workItemType: 'custom', workerClass: 'qa_worker',
      executionInput: { operation: `execute_${toolId}_packaging_case`, approvedToolOperationIds: [input.matrixOperationIds[toolId]], expectedOutputKeys: [outputKey], structuredPayload }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{ outputKey, artifactType: `controlled_${toolId}_json`, assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
      dependencyKeys: [], approvedToolIds: [toolId], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }, {
      workItemKey: `matrix-${toolId}-proof`, workItemType: 'run_asset_qa', workerClass: 'qa_worker', executionInput: { operation: `validate_${toolId}_packaging_artifact` }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
      expectedOutputs: [{ outputKey: `matrix-${toolId}-proof-report`, artifactType: `${toolId}_packaging_dependency_report`, assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
      dependencyKeys: [rootKey], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
    }]
  })
  const vapourSynthItems: CanonicalSmokeWorkItem[] = [{
    workItemKey: 'matrix-vapoursynth-root', workItemType: 'custom', workerClass: 'qa_worker',
    executionInput: { operation: 'execute_vapoursynth_frame_pipeline_case', approvedToolOperationIds: [input.matrixOperationIds.vapoursynth], expectedOutputKeys: ['matrix-vapoursynth-artifact'], structuredPayload: { pipelineProfileId: 'approved_frame_preprocess_v1', pluginPackProfileId: 'reviewed_builtin_plugins_v1', frameRate: 24, callerScriptAllowed: false } }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{ outputKey: 'matrix-vapoursynth-artifact', artifactType: 'controlled_vapoursynth_json', assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
    dependencyKeys: [], approvedToolIds: ['vapoursynth'], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }, {
    workItemKey: 'matrix-vapoursynth-proof', workItemType: 'run_asset_qa', workerClass: 'qa_worker', executionInput: { operation: 'validate_vapoursynth_frame_pipeline_artifact' }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{ outputKey: 'matrix-vapoursynth-proof-report', artifactType: 'vapoursynth_dependency_report', assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
    dependencyKeys: ['matrix-vapoursynth-root'], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }]
  const audioFluxItems: CanonicalSmokeWorkItem[] = [{
    workItemKey: 'matrix-audioflux-root', workItemType: 'run_audio_analysis', workerClass: 'audio_analysis_worker',
    executionInput: { operation: 'execute_audioflux_beat_energy_case', approvedToolOperationIds: [input.matrixOperationIds.audioflux], expectedOutputKeys: ['matrix-audioflux-artifact'], structuredPayload: { sampleRate: 16_000, channelMode: 'mono', analysisProfileId: 'approved_server_owned_beat_energy_fixture_v1', confidenceThreshold: 0.75 } }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{ outputKey: 'matrix-audioflux-artifact', artifactType: 'controlled_audioflux_json', assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
    dependencyKeys: [], approvedToolIds: ['audioflux'], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }, {
    workItemKey: 'matrix-audioflux-proof', workItemType: 'run_asset_qa', workerClass: 'qa_worker', executionInput: { operation: 'validate_audioflux_analysis_artifact' }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{ outputKey: 'matrix-audioflux-proof-report', artifactType: 'audioflux_dependency_report', assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
    dependencyKeys: ['matrix-audioflux-root'], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }]
  const rembgItems: CanonicalSmokeWorkItem[] = [{
    workItemKey: 'matrix-rembg-root', workItemType: 'custom', workerClass: 'controlled_graphics_worker',
    executionInput: { operation: 'execute_rembg_background_removal_case', approvedToolOperationIds: [input.matrixOperationIds.rembg], expectedOutputKeys: ['matrix-rembg-artifact'], structuredPayload: { confidenceThreshold: 0.5, alphaMatteMode: 'straight', edgeRefinementProfileId: 'approved_u2netp_default_v1', maximumSubjects: 1 } }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{ outputKey: 'matrix-rembg-artifact', artifactType: 'controlled_rembg_png', assetRole: 'processed', required: true, previewPlaceholderAllowed: false, contentType: 'image/png', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: ['matrix-rembg-layer'] }],
    dependencyKeys: [], approvedToolIds: ['rembg'], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }, {
    workItemKey: 'matrix-rembg-proof', workItemType: 'run_asset_qa', workerClass: 'qa_worker', executionInput: { operation: 'validate_rembg_background_removal_artifact' }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{ outputKey: 'matrix-rembg-proof-report', artifactType: 'rembg_dependency_report', assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
    dependencyKeys: ['matrix-rembg-root'], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }]
  const deepFilterNetItems: CanonicalSmokeWorkItem[] = [{
    workItemKey: 'matrix-deepfilternet-root', workItemType: 'custom', workerClass: 'audio_processing_worker',
    executionInput: { operation: 'execute_deepfilternet_voice_cleanup_case', approvedToolOperationIds: [input.matrixOperationIds.deepfilternet], expectedOutputKeys: ['matrix-deepfilternet-artifact'], structuredPayload: { attenuationLimitDb: 12, cleanupProfileId: 'approved_gentle_voice_cleanup_v1', preserveNaturalVoice: true, postFilterEnabled: false } }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{ outputKey: 'matrix-deepfilternet-artifact', artifactType: 'controlled_deepfilternet_wav', assetRole: 'processed', required: true, previewPlaceholderAllowed: false, contentType: 'audio/wav', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
    dependencyKeys: [], approvedToolIds: ['deepfilternet'], providerExecutionMode: 'none', fallbackPolicy: { onFailure: 'approved_rnnoise_or_ffmpeg_review_required' }, maxAttempts: 2, attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }, {
    workItemKey: 'matrix-deepfilternet-proof', workItemType: 'run_asset_qa', workerClass: 'qa_worker', executionInput: { operation: 'validate_deepfilternet_voice_cleanup_artifact' }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{ outputKey: 'matrix-deepfilternet-proof-report', artifactType: 'deepfilternet_dependency_report', assetRole: 'qa', required: true, previewPlaceholderAllowed: false, contentType: 'application/json', segmentIds: ['segment-1'], timingIds: ['master-timing-plan'], rendererLayerIds: [] }],
    dependencyKeys: ['matrix-deepfilternet-root'], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1, attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }]
  return [...nodeItems, ...browserItems, ...pythonItems, ...aiItems, ...nativeImageItems, ...nativeAudioItems, ...packagingItems, ...vapourSynthItems, ...audioFluxItems, ...rembgItems, ...deepFilterNetItems]
}

async function requireEditAuthority(targetWorkspaceId: string) {
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: targetWorkspaceId,
  })
  assert.ok(aggregate)
  return aggregate
}

function snapshotAuthoritySlice(
  aggregate: Awaited<ReturnType<typeof requireEditAuthority>>,
  snapshotId: string,
) {
  const snapshot = aggregate.snapshots.find((candidate) => candidate.snapshotId === snapshotId)
  assert.ok(snapshot)
  return {
    snapshot,
    plan: aggregate.plans.find((candidate) => candidate.id === snapshot.planId),
    estimate: aggregate.estimates.find((candidate) => candidate.id === snapshot.estimateId),
    reservation: aggregate.reservations.find((candidate) => candidate.id === snapshot.reservationId),
    approval: aggregate.approvals.find((candidate) => candidate.id === snapshot.approvalId),
    approvedWorkItems: aggregate.approvedWorkItems.filter((candidate) => candidate.snapshotId === snapshotId),
    jobs: aggregate.jobs.filter((candidate) => candidate.snapshotId === snapshotId),
    executionPackages: aggregate.executionPackages.filter((candidate) => candidate.snapshotId === snapshotId),
  }
}

async function requireDispatchAggregate() {
  const aggregate = await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId,
  })
  assert.ok(aggregate)
  return aggregate
}

async function firstSourceObjectPath(projectId: string): Promise<string> {
  const aggregate = await readPrivateUploadMediaAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId,
  })
  const storageObject = aggregate?.storageObjects.find((candidate) =>
    candidate.projectId === projectId && candidate.status === 'ready')
  assert.ok(storageObject)
  return join(localStorageRoot, storageObject.bucketName, storageObject.objectPath)
}

function dispatchAggregatePath(): string {
  return join(
    localStorageRoot,
    'canonical-tool-dispatch',
    'private-single-host-v1',
    sha256AuthorityValue({ ownerUserId: userId, workspaceId }),
    'aggregate.json',
  )
}

function assertNoCommercialCostKeys(value: unknown): void {
  const keys: string[] = []
  visitCostKeys(value, keys)
  const forbidden = keys.filter((key) => {
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
    return normalized.includes('customerprice') || normalized.includes('customercredit') ||
      normalized.includes('servicefee') || normalized.includes('markup') ||
      normalized.includes('margin') || normalized.includes('discount') ||
      normalized.includes('wallet') || normalized.includes('settlement') ||
      normalized.includes('billabletouser') || normalized.includes('toolcostcredit') ||
      normalized === 'credits' || normalized === 'tax' || normalized.startsWith('tax')
  })
  assert.deepEqual(forbidden, [])
}

function visitCostKeys(value: unknown, keys: string[]): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry) => visitCostKeys(entry, keys))
    return
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    keys.push(key)
    visitCostKeys(entry, keys)
  }
}

function requireSha256(value: string | undefined): string {
  assert.match(value ?? '', /^[a-f0-9]{64}$/)
  return value!
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

async function expectApiError(action: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await action()
    assert.fail(`Expected ${code}.`)
  } catch (error) {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, code)
  }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function proveConsumptionReplayResponseSemantics(): void {
  const timestamp = new Date().toISOString()
  const hash = 'a'.repeat(64)
  const base = {
    schemaVersion: 'canonical-private-tool-dispatch-response-v1' as const,
    source: 'canonical_private_tool_dispatch_authority' as const,
    purpose: 'private_internal_canonical_tool_dispatch_consume' as const,
    consumed: true as const,
    consumedAt: timestamp,
    executionAttemptId: 'tool_dispatch_attempt_fixture',
    grant: {
      grantId: 'tool_dispatch_attempt_fixture',
      status: 'consumed' as const,
      binding: {
        workspaceId: 'workspace-fixture',
        projectId: 'project-fixture',
        editSessionId: 'session-fixture',
        jobId: 'job-fixture',
        approvedPlanSnapshotId: 'snapshot-fixture',
        approvedWorkItemId: 'work-item-fixture',
        expectedAssetId: 'asset-fixture',
        requestedToolName: 'd3',
        canonicalToolId: 'd3',
        operationId: 'tool.d3.render_chart_or_diagram.v1',
        leaseId: 'lease-fixture',
        leaseAttemptNumber: 1,
        leaseImmutableHash: hash,
        leaseDependencyAuthority: {
          state: 'not_required_for_root_job' as const,
          readinessHash: hash,
          authorityHash: hash,
          selectedArtifactsHash: sha256AuthorityValue([]),
          selectedArtifactCount: 0,
          liveRuntimeEligible: false as const,
        },
        leaseExecutionFenceState: 'not_started' as const,
        reservationId: 'reservation-fixture',
        maximumCreditBudget: 1,
        remainingReservedCreditsAtDecision: 2,
        expectedOutput: {
          outputKey: 'chart-fixture',
          artifactType: 'controlled_chart_svg',
          assetRole: 'generated' as const,
          required: true,
          previewPlaceholderAllowed: false,
          contentType: 'image/svg+xml',
          segmentIds: [],
          timingIds: [],
          rendererLayerIds: [],
        },
      },
      issuedAt: timestamp,
      expiresAt: new Date(Date.parse(timestamp) + 30_000).toISOString(),
      immutableGrantHash: hash,
      singleUse: true as const,
      credentialReturned: false as const,
    },
    verificationEvidence: {
      tenantAndCanonicalAuthority: 'passed' as const,
      activeOpaqueLease: 'passed' as const,
      timingSafeDispatchCredentialMatch: 'passed' as const,
      immutableGrantHash: 'passed' as const,
      exactWorkItemOutputToolOperation: 'passed' as const,
      fundedReservationAndBudget: 'passed' as const,
      toolOperationSpecHash: 'passed' as const,
      runtimeEvidenceAuthorityHash: 'passed' as const,
      runtimeEvidenceRecordHash: 'passed' as const,
      privateRuntimeAuthorityHash: 'passed' as const,
      privateRuntimeImageIdentityHash: 'passed' as const,
      privateInternalReadiness: 'passed' as const,
      leaseDependencyAuthorityBinding: 'passed' as const,
      leaseExecutionFenceNotStarted: 'passed' as const,
      atomicSingleUseTransition: 'passed' as const,
      leaseCredentialReturned: false as const,
      dispatchCredentialReturned: false as const,
      credentialHashReturned: false as const,
    },
    responseHash: hash,
    testOnly: true as const,
  }
  const first = canonicalPrivateToolDispatchConsumptionResponseSchema.safeParse({
    ...base,
    consumptionReplayed: false,
    executionAuthority: consumptionExecutionAuthority(false),
  })
  const replay = canonicalPrivateToolDispatchConsumptionResponseSchema.safeParse({
    ...base,
    consumptionReplayed: true,
    executionAuthority: consumptionExecutionAuthority(true),
  })
  const unsafeReplay = canonicalPrivateToolDispatchConsumptionResponseSchema.safeParse({
    ...base,
    consumptionReplayed: true,
    executionAuthority: consumptionExecutionAuthority(false),
  })
  assert.equal(first.success, true)
  assert.equal(replay.success, true)
  assert.equal(unsafeReplay.success, false)
}

function consumptionExecutionAuthority(replayed: boolean) {
  return {
    dispatchGrantConsumed: true as const,
    newExecutionStartAuthorized: !replayed,
    resumeSameIdempotentAttemptOnly: replayed,
    toolExecutionAuthorized: !replayed,
    executionAttemptId: 'tool_dispatch_attempt_fixture',
    outputPromotionRequiresCreateOnlyAttemptId: true as const,
    costEventRequiresSameIdempotentAttemptId: true as const,
    providerCallAuthorized: false as const,
    sourceObjectReadAuthorized: false as const,
    artifactWriteAuthorized: false as const,
    renderAuthorized: false as const,
    privatePreviewRenderAuthorized: false,
    privateCaptionRenderAuthorized: false,
    privateFinalCompositionAuthorized: false,
    creditSpendAuthorized: false as const,
    walletMutationAuthorized: false as const,
    settlementAuthorized: false as const,
    toolExecutionPerformedByConsume: false as const,
  }
}

function createMembershipAdminClient(
  memberships: Array<{ workspaceId: string; userId: string; role: string }>,
): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') throw new Error(`Unexpected dispatch smoke table: ${tableName}`)
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() { return query },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const membership = memberships.find((candidate) =>
            candidate.workspaceId === selectedWorkspaceId && candidate.userId === selectedUserId)
          return {
            data: membership ? {
              workspace_id: membership.workspaceId,
              user_id: membership.userId,
              role: membership.role,
            } : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}
