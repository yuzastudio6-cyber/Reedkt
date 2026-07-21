import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import type { SupabaseClient } from '@supabase/supabase-js'

import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_BINDING_VERSION,
  CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_OPERATION,
  canonicalMotionStudioRemotionPreviewBindingSchema,
  canonicalMotionStudioTimingAuthorityDigest,
} from '../edit-architecture/canonical-motion-studio-remotion-preview-authority'
import {
  canonicalInternalAuthorityArtifactRelativePath,
} from '../services/canonical-internal-authority-artifact-verifier'
import { createCanonicalInternalAuthorityRunnerService } from '../services/canonical-internal-authority-runner-service'
import { createCanonicalEditExecutionPackageService } from '../services/canonical-edit-execution-package-service'
import { createCanonicalEditJourneyService } from '../services/canonical-edit-journey-service'
import {
  CANONICAL_PRIVATE_TOOL_DISPATCH_TTL_SECONDS,
  createCanonicalPrivateToolDispatchAuthorityService,
} from '../services/canonical-private-tool-dispatch-authority-service'
import { createCanonicalPrivateMediaBinaryExecutionService } from '../services/canonical-private-media-binary-execution-service'
import { createCanonicalPrivateDependencyArtifactReadService } from '../services/canonical-private-dependency-artifact-read-service'
import { createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService } from '../services/canonical-private-deepfilternet-voice-cleanup-execution-service'
import { createCanonicalPrivateRemotionExecutionService } from '../services/canonical-private-remotion-execution-service'
import { createCanonicalPrivateFinalArtifactDownloadService } from '../services/canonical-private-final-artifact-download-service'
import { createCanonicalPrivateEditPreparationCoordinatorService } from '../services/canonical-private-edit-preparation-coordinator-service'
import {
  canonicalPrivateJobCompletionRecoveryRelativePath,
  readCanonicalPrivateJobCompletionRecovery,
} from '../services/canonical-private-job-completion-recovery-service'
import { createCanonicalPrivateJobExecutionAdapterService } from '../services/canonical-private-job-execution-adapter-service'
import { createCanonicalPrivateReviewAssemblyService } from '../services/canonical-private-review-assembly-service'
import { createCanonicalPrivateReviewDecisionCoordinatorService } from '../services/canonical-private-review-decision-coordinator-service'
import { createCanonicalPrivateReviewDecisionService } from '../services/canonical-private-review-decision-service'
import { createCanonicalPrivateReviewHistoryService } from '../services/canonical-private-review-history-service'
import { createCanonicalPrivateReviewMediaService } from '../services/canonical-private-review-media-service'
import { createCanonicalPrivateStructuredToolExecutionService } from '../services/canonical-private-structured-tool-execution-service'
import { createCanonicalPlanningHandoffService } from '../services/canonical-planning-handoff-service'
import { createCanonicalRevisionPlanPresentationCoordinatorService } from '../services/canonical-revision-plan-presentation-coordinator-service'
import { createCanonicalPrivateWorkGraphOrchestratorService } from '../services/canonical-private-work-graph-orchestrator-service'
import { createCanonicalWorkerLeaseAuthorityService } from '../services/canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import {
  clearPrivateCanonicalToolDispatchProcessStateForSmoke,
  readPrivateCanonicalToolDispatchAggregate,
} from '../services/private-canonical-tool-dispatch-store'
import { readPrivateCanonicalWorkerLeaseAggregate } from '../services/private-canonical-worker-lease-store'
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
  readPersistedOfflineNodeStructuredRuntimeAuthority,
} from '../tool-execution/node-runner-execution/offline-node-structured-execution-service'
import {
  createPrivateOfflinePythonStructuredExecutionRuntime,
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT,
  OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
  readPersistedOfflinePythonStructuredRuntimeAuthority,
} from '../tool-execution/python-runner-execution'
import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  OFFLINE_REMOTION_RENDER_EXECUTION_STORAGE_ROOT,
  OFFLINE_REMOTION_RENDER_RUNTIME_AUTHORITY_RELATIVE_PATH,
  prepareOfflineRemotionDockerRuntime,
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
import { readPrivateInternalAttemptCostEvidence } from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import { readPrivateWorkerResourceUsageCostEvidence } from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import type { ServiceContext } from '../types'
import {
  PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
  type PublishCanonicalEditPlanBody,
} from '../validation/edit-planning-authority-schemas'
import { canonicalEditJourneyResponseSchema } from '../validation/canonical-edit-journey-schemas'
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
const atomicCompilationWorkspaceId = 'workspace-planning-binding-integration'
const userId = 'user-authority-smoke'
const editSessionId = 'edit-session-canonical-tool-dispatch'
const multiSourceSliceOnly =
  process.env.REEDITPRO_CANONICAL_MULTI_SOURCE_SLICE_ONLY === 'true'
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
      { workspaceId: atomicCompilationWorkspaceId, userId, role: 'owner' },
    ]),
    public: null,
  },
  requestId: 'canonical-private-tool-dispatch-authority-smoke',
  auth: { userId, accessToken: 'verified-dispatch-smoke-token', isMockUser: false },
}
const canonicalJourneyService = createCanonicalEditJourneyService(context)
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

const mediaFixture = await uploadCanonicalMediaFixture(
  seedSnapshot.projectId,
  'primary',
  '0x0000FF',
  'blue',
  440,
)
const mediaSourceItem = {
  sourceSequenceItemId: 'source-sequence-python-media',
  mediaAssetId: mediaFixture.mediaAsset.id,
  uploadedOrder: seedAuthority.components.sourceSequence.length + 1,
  checksumSha256: mediaFixture.checksumSha256,
  required: true as const,
}
const secondaryMediaFixture = await uploadCanonicalMediaFixture(
  seedSnapshot.projectId,
  'secondary',
  '0x0010F0',
  'yellow',
  660,
)
const secondaryMediaSourceItem = {
  sourceSequenceItemId: 'source-sequence-secondary-media',
  mediaAssetId: secondaryMediaFixture.mediaAsset.id,
  uploadedOrder: seedAuthority.components.sourceSequence.length + 2,
  checksumSha256: secondaryMediaFixture.checksumSha256,
  required: true as const,
}
const tertiaryMediaFixture = multiSourceSliceOnly
  ? await uploadCanonicalMediaFixture(
      seedSnapshot.projectId,
      'tertiary',
      '0x1020E0',
      '0xF0D010',
      880,
    )
  : undefined
const tertiaryMediaSourceItem = tertiaryMediaFixture
  ? {
      sourceSequenceItemId: 'source-sequence-tertiary-media',
      mediaAssetId: tertiaryMediaFixture.mediaAsset.id,
      uploadedOrder: seedAuthority.components.sourceSequence.length + 3,
      checksumSha256: tertiaryMediaFixture.checksumSha256,
      required: true as const,
    }
  : undefined

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
  })), mediaSourceItem, secondaryMediaSourceItem,
  ...(tertiaryMediaSourceItem ? [tertiaryMediaSourceItem] : [])],
})).sourceBindingManifestCandidate
const sourceMediaAuthority = {
  authorityRevision: sourceCandidate.authorityRevision,
  authorityChecksumSha256: sourceCandidate.authorityChecksumSha256,
  sourceSequenceHash: sourceCandidate.sourceSequenceHash,
  candidateHash: sourceCandidate.candidateHash,
}

const dispatchPlanInput = {
  seedAuthority,
  targetEditSessionId: editSessionId,
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
  secondaryMediaSourceItem,
  tertiaryMediaSourceItem,
  matrixOperationIds,
}
const planBody = createDispatchPlanBody(dispatchPlanInput)
const planningHandoffAuthorityBefore = sha256AuthorityValue(await requireEditAuthority(workspaceId))
const orderedPlanningHandoffSources = [...seedAuthority.components.sourceSequence.map((item) => ({
  sourceSequenceItemId: item.sourceSequenceItemId,
  mediaAssetId: item.mediaAssetId,
  uploadedOrder: item.uploadedOrder,
  checksumSha256: requireSha256(item.checksumSha256),
  required: item.required,
})), mediaSourceItem, secondaryMediaSourceItem,
...(tertiaryMediaSourceItem ? [tertiaryMediaSourceItem] : [])]
const planningHandoffService = createCanonicalPlanningHandoffService(context)
await expectApiError(
  () => planningHandoffService.prepare({
    workspaceId,
    projectId: seedSnapshot.projectId,
    editSessionId,
    purpose: 'prepare_canonical_planning_handoff',
    orderedSourceItems: orderedPlanningHandoffSources,
    canonicalPlanComponents: {
      ...planBody.canonicalPlan.components,
      sourceSequence: [...planBody.canonicalPlan.components.sourceSequence].reverse(),
    },
  }),
  'IDEMPOTENCY_CONFLICT',
)
const planningHandoff = await planningHandoffService.prepare({
  workspaceId,
  projectId: seedSnapshot.projectId,
  editSessionId,
  purpose: 'prepare_canonical_planning_handoff',
  orderedSourceItems: orderedPlanningHandoffSources,
  canonicalPlanComponents: planBody.canonicalPlan.components,
})
assert.equal(planningHandoff.readiness.finalizedSourceMediaVerified, true)
assert.equal(planningHandoff.readiness.exactEditPreferencesVerified, true)
assert.equal(planningHandoff.readiness.preferenceApplicationVerified, true)
assert.equal(planningHandoff.readiness.editBriefVerified, true)
assert.equal(planningHandoff.readiness.outputFrameAndCleanupVerified, true)
assert.equal(planningHandoff.readiness.readyForCanonicalPlanPublication, true)
assert.equal(planningHandoff.noPlanPublished, true)
assert.equal(planningHandoff.noSnapshotCreated, true)
assert.equal(planningHandoff.noCreditReservation, true)
assert.equal(planningHandoff.noToolExecution, true)
assert.equal(planningHandoff.noProviderCall, true)
assert.equal(planningHandoff.noRender, true)
const canonicalSourcePreparationEvidenceHash = sha256AuthorityValue({
  sourceCandidateHash: planningHandoff.sourceBindingManifestCandidate.candidateHash,
  sourceCleanupSummary: planBody.canonicalPlan.components.sourceCleanupSummary,
  sourceCleanupPlan: planBody.canonicalPlan.components.sourceCleanupPlan,
})
const canonicalFrameConfirmationId = `canonical-frame-${sha256AuthorityValue({
  workspaceId,
  projectId: seedSnapshot.projectId,
  editSessionId,
  aspectRatio: planBody.canonicalPlan.components.confirmedSettings.aspectRatio,
})}`
assert.deepEqual(planningHandoff.planningInputAuthority, {
  ...planningInputAuthority,
  exactEditPreference: {
    ...planningInputAuthority.exactEditPreference,
    recordRevision: planningInputAuthority.exactEditPreference.recordRevision + 1,
    sourcePreparationEvidenceHash: canonicalSourcePreparationEvidenceHash,
    frameConfirmationId: canonicalFrameConfirmationId,
  },
})
assert.equal(
  planningHandoff.resolvedPlanningInputAuthority.exactEditPreference
    .sourcePreparationEvidenceHash,
  canonicalSourcePreparationEvidenceHash,
)
assert.equal(
  planningHandoff.resolvedPlanningInputAuthority.exactEditPreference.frameConfirmationId,
  canonicalFrameConfirmationId,
)
assert.notEqual(
  canonicalSourcePreparationEvidenceHash,
  planningInputAuthority.exactEditPreference.sourcePreparationEvidenceHash,
)
assert.notEqual(
  canonicalFrameConfirmationId,
  planningInputAuthority.exactEditPreference.frameConfirmationId,
)
assert.deepEqual(planningHandoff.sourceMediaAuthority, sourceMediaAuthority)
assert.equal(
  sha256AuthorityValue(await requireEditAuthority(workspaceId)),
  planningHandoffAuthorityBefore,
)
const planningService = createEditPlanningAuthorityService(context)
const published = await planningHandoffService.publishFromPersistedHandoff({
  ...planningHandoffPublicationBody(planBody, planningHandoff.handoffHash),
  projectId: seedSnapshot.projectId,
  editSessionId,
  handoffId: planningHandoff.handoffId,
  idempotencyKey: 'publish-canonical-tool-dispatch-plan',
})
const publishedAuthority = asRecord(published.authority)
const publishedPlan = asRecord(publishedAuthority.plan)
const publishedEstimate = asRecord(publishedAuthority.estimate)
assert.equal(published.canonicalPlanningHandoff.handoffId, planningHandoff.handoffId)
assert.equal(published.canonicalPlanningHandoff.boundToPublishedPlan, true)
assert.equal(
  asRecord(publishedPlan.componentRefs).planningHandoffAuthority !== undefined,
  true,
)
assert.equal(
  asRecord(publishedPlan.componentRefs).canonicalToolExecutionAuthority !== undefined,
  true,
)
const approved = await planningService.approveAndFundCanonicalPlan({
  workspaceId,
  editPlanId: String(publishedPlan.id),
  expectedAuthorityRevision: Number(publishedAuthority.authorityRevision),
  expectedPlanHash: String(publishedPlan.planHash),
  expectedEstimateHash: String(publishedEstimate.estimateHash),
  idempotencyKey: 'approve-canonical-tool-dispatch-plan',
})
const approvedSnapshot = asRecord(asRecord(approved.authority).snapshot)
assert.deepEqual(
  asRecord(approvedSnapshot.componentRefs).planningHandoffAuthority,
  asRecord(publishedPlan.componentRefs).planningHandoffAuthority,
)
assert.deepEqual(
  asRecord(approvedSnapshot.componentRefs).canonicalToolExecutionAuthority,
  asRecord(publishedPlan.componentRefs).canonicalToolExecutionAuthority,
)
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
assert.equal(authority.toolExecutionAuthority.tools.length, 50)
assert.equal(authority.toolExecutionAuthority.summary.workGraphToolCount, 50)
assert.equal(authority.toolExecutionAuthority.summary.requiredWorkGraphToolCount, 50)
assert.equal(authority.toolExecutionAuthority.summary.privateEndToEndReadyToolCount, 50)
assert.equal(authority.toolExecutionAuthority.summary.privateJobAdapterReadyToolCount, 50)
assert.equal(authority.toolExecutionAuthority.summary.allRequiredToolsPrivateEndToEndReady, true)
assert.equal(authority.toolExecutionAuthority.summary.allRequiredToolsPrivateJobAdapterReady, true)
assert.ok(authority.toolExecutionAuthority.tools.every((tool) =>
  tool.verificationState === 'canonical_e2e_verified' &&
  tool.readiness.privateInternalEndToEndReady &&
  tool.readiness.privateInternalJobAdapterReady &&
  tool.stableToolIdentity === `reeditpro.tool.${tool.canonicalToolId}.v1` &&
  /^[a-f0-9]{64}$/.test(tool.identityHash) &&
  /^[a-f0-9]{64}$/.test(tool.proofHash)))
const toolBackedAuthorityWorkItems = authority.workItems.filter((workItem) =>
  workItem.approvedToolIds.length > 0)
assert.equal(
  authority.toolPayloadAuthority.summary.toolBackedWorkItemCount,
  toolBackedAuthorityWorkItems.length,
)
assert.equal(
  authority.toolPayloadAuthority.summary.validatedWorkItemCount,
  toolBackedAuthorityWorkItems.length,
)
assert.equal(authority.toolPayloadAuthority.summary.optionalUnprovenWorkItemCount, 0)
assert.equal(authority.toolPayloadAuthority.summary.allRequiredToolPayloadsValidated, true)
assert.equal(authority.toolPayloadAuthority.summary.validationRunsBeforeApproval, true)
assert.equal(new Set(authority.toolPayloadAuthority.validatedWorkItems.map((entry) =>
  entry.canonicalToolId)).size, 50)
assert.equal(new Set(authority.toolPayloadAuthority.validatedWorkItems.map((entry) =>
  entry.validatorFamily)).size, 20)
assert.ok(authority.toolPayloadAuthority.validatedWorkItems.every((entry) =>
  /^[a-f0-9]{64}$/.test(entry.structuredPayloadHash) &&
  /^[a-f0-9]{64}$/.test(entry.bindingHash) &&
  /^[a-f0-9]{64}$/.test(entry.validationHash)))
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

const motionStudioSceneWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'motion-studio-scene-preview-root')
const motionStudioSceneProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'motion-studio-scene-preview-proof')
assert.ok(motionStudioSceneWorkItem)
assert.ok(motionStudioSceneProofWorkItem)
const motionStudioSceneJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === motionStudioSceneWorkItem.id)
const motionStudioSceneProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === motionStudioSceneProofWorkItem.id)
const motionStudioSceneAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === motionStudioSceneWorkItem.id)
assert.ok(motionStudioSceneJob)
assert.ok(motionStudioSceneProofJob)
assert.ok(motionStudioSceneAsset)
assert.deepEqual(motionStudioSceneJob.dependencyJobIds, [])
assert.deepEqual(motionStudioSceneProofJob.dependencyJobIds, [motionStudioSceneJob.id])

const motionStudioLayeredWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'motion-studio-layered-preview-root')
const motionStudioLayeredProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'motion-studio-layered-preview-proof')
const motionStudioLayeredDependencyWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'matrix-rembg-root')
assert.ok(motionStudioLayeredWorkItem)
assert.ok(motionStudioLayeredProofWorkItem)
assert.ok(motionStudioLayeredDependencyWorkItem)
const motionStudioLayeredJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === motionStudioLayeredWorkItem.id)
const motionStudioLayeredProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === motionStudioLayeredProofWorkItem.id)
const motionStudioLayeredDependencyJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === motionStudioLayeredDependencyWorkItem.id)
const motionStudioLayeredAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === motionStudioLayeredWorkItem.id)
assert.ok(motionStudioLayeredJob)
assert.ok(motionStudioLayeredProofJob)
assert.ok(motionStudioLayeredDependencyJob)
assert.ok(motionStudioLayeredAsset)
assert.deepEqual(motionStudioLayeredJob.dependencyJobIds, [motionStudioLayeredDependencyJob.id])
assert.deepEqual(motionStudioLayeredProofJob.dependencyJobIds, [motionStudioLayeredJob.id])

const libassWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'libass-caption-overlay-root')
const libassProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'libass-caption-overlay-proof')
const secondLibassWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'libass-caption-overlay-second')
const secondLibassProofWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'libass-caption-overlay-second-proof')
assert.ok(libassWorkItem)
assert.ok(libassProofWorkItem)
assert.ok(secondLibassWorkItem)
assert.ok(secondLibassProofWorkItem)
const libassJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === libassWorkItem.id)
const libassProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === libassProofWorkItem.id)
const secondLibassJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === secondLibassWorkItem.id)
const secondLibassProofJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === secondLibassProofWorkItem.id)
const libassAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === libassWorkItem.id)
const secondLibassAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === secondLibassWorkItem.id)
assert.ok(libassJob)
assert.ok(libassProofJob)
assert.ok(libassAsset)
assert.ok(secondLibassJob)
assert.ok(secondLibassProofJob)
assert.ok(secondLibassAsset)
assert.deepEqual(libassJob.dependencyJobIds, [])
assert.deepEqual(libassProofJob.dependencyJobIds, [libassJob.id])
assert.deepEqual(secondLibassJob.dependencyJobIds, [])
assert.deepEqual(secondLibassProofJob.dependencyJobIds, [secondLibassJob.id])

const primaryVoiceWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'voice-delivery-primary')
const secondaryVoiceWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'voice-delivery-secondary')
const tertiaryVoiceWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'voice-delivery-tertiary')
assert.ok(primaryVoiceWorkItem)
assert.ok(secondaryVoiceWorkItem)
const primaryVoiceJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === primaryVoiceWorkItem.id)
const secondaryVoiceJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === secondaryVoiceWorkItem.id)
const tertiaryVoiceJob = tertiaryVoiceWorkItem
  ? aggregateBeforeDispatch.jobs.find((candidate) =>
      candidate.snapshotId === snapshot.snapshotId &&
      candidate.approvedWorkItemId === tertiaryVoiceWorkItem.id)
  : undefined
const primaryVoiceAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === primaryVoiceWorkItem.id)
const secondaryVoiceAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === secondaryVoiceWorkItem.id)
const tertiaryVoiceAsset = tertiaryVoiceWorkItem
  ? authority.assetManifest.entries.find((candidate) =>
      candidate.approvedWorkItemId === tertiaryVoiceWorkItem.id)
  : undefined
assert.ok(primaryVoiceJob)
assert.ok(secondaryVoiceJob)
assert.ok(primaryVoiceAsset)
assert.ok(secondaryVoiceAsset)
assert.deepEqual(primaryVoiceJob.dependencyJobIds, [])
assert.deepEqual(secondaryVoiceJob.dependencyJobIds, [])
if (tertiaryMediaSourceItem) {
  assert.ok(tertiaryVoiceWorkItem)
  assert.ok(tertiaryVoiceJob)
  assert.ok(tertiaryVoiceAsset)
  assert.deepEqual(tertiaryVoiceJob.dependencyJobIds, [])
} else {
  assert.equal(tertiaryVoiceWorkItem, undefined)
}

const primaryColorWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'color-delivery-primary')
const secondaryColorWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'color-delivery-secondary')
const tertiaryColorWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'color-delivery-tertiary')
assert.ok(primaryColorWorkItem)
assert.ok(secondaryColorWorkItem)
const primaryColorJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === primaryColorWorkItem.id)
const secondaryColorJob = aggregateBeforeDispatch.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.approvedWorkItemId === secondaryColorWorkItem.id)
const tertiaryColorJob = tertiaryColorWorkItem
  ? aggregateBeforeDispatch.jobs.find((candidate) =>
      candidate.snapshotId === snapshot.snapshotId &&
      candidate.approvedWorkItemId === tertiaryColorWorkItem.id)
  : undefined
const primaryColorAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === primaryColorWorkItem.id)
const secondaryColorAsset = authority.assetManifest.entries.find((candidate) =>
  candidate.approvedWorkItemId === secondaryColorWorkItem.id)
const tertiaryColorAsset = tertiaryColorWorkItem
  ? authority.assetManifest.entries.find((candidate) =>
      candidate.approvedWorkItemId === tertiaryColorWorkItem.id)
  : undefined
assert.ok(primaryColorJob)
assert.ok(secondaryColorJob)
assert.ok(primaryColorAsset)
assert.ok(secondaryColorAsset)
assert.deepEqual(primaryColorJob.dependencyJobIds, [])
assert.deepEqual(secondaryColorJob.dependencyJobIds, [primaryColorJob.id])
if (tertiaryMediaSourceItem) {
  assert.ok(tertiaryColorWorkItem)
  assert.ok(tertiaryColorJob)
  assert.ok(tertiaryColorAsset)
  assert.deepEqual(tertiaryColorJob.dependencyJobIds, [primaryColorJob.id])
} else {
  assert.equal(tertiaryColorWorkItem, undefined)
}

const finalCompositionWorkItem = aggregateBeforeDispatch.approvedWorkItems.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.workItemKey === 'remotion-source-caption-final')
assert.ok(finalCompositionWorkItem)
const finalCompositionExecutionWorkItem = authority.workItems.find((candidate) =>
  candidate.id === finalCompositionWorkItem.id)
assert.ok(finalCompositionExecutionWorkItem)
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
assert.deepEqual(finalCompositionJob.dependencyJobIds, [
  sourceTrimValidationJob.id,
  libassJob.id,
  secondLibassJob.id,
  primaryVoiceJob.id,
  secondaryVoiceJob.id,
  ...(tertiaryVoiceJob ? [tertiaryVoiceJob.id] : []),
  primaryColorJob.id,
  secondaryColorJob.id,
  ...(tertiaryColorJob ? [tertiaryColorJob.id] : []),
])
assert.deepEqual(finalArtifactQaJob.dependencyJobIds, [finalCompositionJob.id])

const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
const jobExecutionAdapter = createCanonicalPrivateJobExecutionAdapterService(context)
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

const startedIncompleteRecoveryExecution = await leaseService.beginInternalExecution({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dependentChartJob.id,
  leaseId: dependentChartClaim.lease.leaseId,
  leaseCredential: dependentChartClaim.leaseCredential,
  runnerClass: 'offline_node_structured_execution_v1',
})
assert.equal(startedIncompleteRecoveryExecution.executionFence.state, 'started')
await expectApiError(
  () => dispatchService.authorize({
    ...dependentDispatchInput,
    idempotencyKey: 'started-lease-cannot-get-fresh-dispatch-decision',
  }, dependentLeaseAuthority),
  'WORKER_LEASE_EXPIRED',
)
const completedIncompleteRecoveryExecution = await leaseService.completeInternalExecution({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dependentChartJob.id,
  leaseId: dependentChartClaim.lease.leaseId,
  leaseCredential: dependentChartClaim.leaseCredential,
  runnerClass: 'offline_node_structured_execution_v1',
  executionAttemptId: startedIncompleteRecoveryExecution.executionFence.executionAttemptId,
})
assert.equal(completedIncompleteRecoveryExecution.executionFence.state, 'completed')
await expectApiError(
  () => dispatchService.authorize({
    ...dependentDispatchInput,
    idempotencyKey: 'completed-lease-cannot-get-fresh-dispatch-decision',
  }, dependentLeaseAuthority),
  'WORKER_LEASE_EXPIRED',
)

await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dependentChartJob.id,
  leaseId: dependentChartClaim.lease.leaseId,
  leaseCredential: dependentChartClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-completed-incomplete-recovery-attempt',
})
await leaseService.release({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  leaseId: chartClaim.lease.leaseId,
  leaseCredential: chartClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-denied-chart-attempt-before-runtime',
})
const atomicCompilationAggregate = await requireEditAuthority(atomicCompilationWorkspaceId)
const atomicCompilationPlan = atomicCompilationAggregate.plans.find((candidate) =>
  candidate.editSessionId === 'edit-session-atomic-work-item-compilation' &&
  candidate.status === 'approved')
assert.ok(atomicCompilationPlan)
const atomicCompilationSnapshot = atomicCompilationAggregate.snapshots.find((candidate) =>
  candidate.planId === atomicCompilationPlan.id)
assert.ok(atomicCompilationSnapshot)
assert.ok(atomicCompilationSnapshot.componentRefs.canonicalWorkItemCompilation)
const atomicCompilationPackage = atomicCompilationAggregate.executionPackages.find((candidate) =>
  candidate.snapshotId === atomicCompilationSnapshot.snapshotId)
assert.ok(atomicCompilationPackage)
const atomicCompilationAuthority = await createEditPlanningAuthorityService(
  context,
).loadApprovedExecutionAuthority(
  atomicCompilationSnapshot.snapshotId,
  atomicCompilationWorkspaceId,
)
const atomicD3WorkItem = atomicCompilationAuthority.workItems.find((workItem) =>
  workItem.approvedToolIds.length === 1 && workItem.approvedToolIds[0] === 'd3')
const atomicEchartsWorkItem = atomicCompilationAuthority.workItems.find((workItem) =>
  workItem.approvedToolIds.length === 1 && workItem.approvedToolIds[0] === 'echarts')
assert.ok(atomicD3WorkItem)
assert.ok(atomicEchartsWorkItem)
const atomicD3Job = atomicCompilationAuthority.jobs.find((job) =>
  job.approvedWorkItemId === atomicD3WorkItem.id)
const atomicEchartsJob = atomicCompilationAuthority.jobs.find((job) =>
  job.approvedWorkItemId === atomicEchartsWorkItem.id)
assert.ok(atomicD3Job)
assert.ok(atomicEchartsJob)
assert.equal(atomicEchartsJob.dependencyJobIds.includes(atomicD3Job.id), true)
const atomicWorkGraphService = createCanonicalPrivateWorkGraphOrchestratorService(
  context,
)
const initialAtomicCompilationRun = await atomicWorkGraphService.run({
  workspaceId: atomicCompilationWorkspaceId,
  packageRecordId: atomicCompilationPackage.id,
  purpose: 'run_canonical_private_work_graph',
  idempotencyKey: 'run-atomic-work-item-compilation-graph-runtime-blocked',
})
assert.equal(initialAtomicCompilationRun.status, 'blocked_required_jobs')
const initiallyFailedAtomicD3 = initialAtomicCompilationRun.jobs.find((job) =>
  job.jobId === atomicD3Job.id)
const initiallyBlockedAtomicEcharts = initialAtomicCompilationRun.jobs.find((job) =>
  job.jobId === atomicEchartsJob.id)
assert.equal(initiallyFailedAtomicD3?.status, 'failed_retry_available')
assert.equal(initiallyFailedAtomicD3?.failureCategory, 'runtime_unavailable')
assert.equal(initiallyFailedAtomicD3?.retryDisposition, 'retry_same_approved_operation')
assert.equal(initiallyFailedAtomicD3?.attemptNumber, 1)
assert.equal(initiallyFailedAtomicD3?.approvedMaxAttempts, 2)
assert.equal(initiallyFailedAtomicD3?.remainingAttempts, 1)
assert.match(initiallyFailedAtomicD3?.failureRecordHash ?? '', /^[a-f0-9]{64}$/)
assert.equal(initiallyBlockedAtomicEcharts?.status, 'blocked_by_dependency')
assert.equal(
  initiallyBlockedAtomicEcharts?.blockedDependencyJobIds.includes(atomicD3Job.id),
  true,
)
assert.ok(initialAtomicCompilationRun.summary.completedJobCount > 0)
const initialAtomicReplay = await atomicWorkGraphService.run({
  workspaceId: atomicCompilationWorkspaceId,
  packageRecordId: atomicCompilationPackage.id,
  purpose: 'run_canonical_private_work_graph',
  idempotencyKey: 'run-atomic-work-item-compilation-graph-runtime-blocked',
})
assert.equal(initialAtomicReplay.evidence.idempotentRunReplay, true)
assert.deepEqual(
  initialAtomicReplay.jobs.find((job) => job.jobId === atomicD3Job.id),
  initiallyFailedAtomicD3,
)

await createPrivateOfflineNodeStructuredExecutionRuntime()
const incompleteRecoveryDispatchCount = (await requireDispatchAggregate()).grants.length
const incompleteRecoveryAdapterInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dependentChartJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-incomplete-postcommit-recovery',
}
const incompleteRecoveryError = await expectApiErrorResult(
  () => jobExecutionAdapter.execute(incompleteRecoveryAdapterInput),
  'JOB_DEPENDENCY_NOT_READY',
)
const incompleteRecoveryDetails = asRecord(incompleteRecoveryError.details)
const incompleteRecoveryEvidence = asRecord(incompleteRecoveryDetails.executionFailure)
assert.equal(
  incompleteRecoveryDetails.requiredGate,
  'canonical_completed_execution_reconciliation_recovery',
)
assert.equal(incompleteRecoveryEvidence.executionState, 'completed_requires_reconciliation')
assert.equal(incompleteRecoveryEvidence.retryDisposition, 'server_reconciliation_required')
assert.equal(
  (await requireDispatchAggregate()).grants.length,
  incompleteRecoveryDispatchCount,
)
const incompleteRecoveryReplay = await expectApiErrorResult(
  () => jobExecutionAdapter.execute(incompleteRecoveryAdapterInput),
  'JOB_DEPENDENCY_NOT_READY',
)
assert.deepEqual(incompleteRecoveryReplay.details, incompleteRecoveryError.details)
const atomicCompilationRun = await createCanonicalPrivateWorkGraphOrchestratorService(
  context,
).run({
  workspaceId: atomicCompilationWorkspaceId,
  packageRecordId: atomicCompilationPackage.id,
  purpose: 'run_canonical_private_work_graph',
  idempotencyKey: 'run-atomic-work-item-compilation-graph-retry-two',
})
assert.equal(atomicCompilationRun.status, 'blocked_required_jobs')
assert.equal(atomicCompilationRun.summary.totalJobCount, 7)
assert.equal(
  atomicCompilationRun.summary.completedJobCount,
  5,
  JSON.stringify(atomicCompilationRun.jobs),
)
assert.equal(atomicCompilationRun.summary.capabilityBlockedJobCount, 1)
assert.equal(atomicCompilationRun.summary.dependencyBlockedJobCount, 1)
assert.equal(atomicCompilationRun.summary.requiredBlockedJobCount, 2)
const atomicD3Outcome = atomicCompilationRun.jobs.find((job) => job.jobId === atomicD3Job.id)
const atomicEchartsOutcome = atomicCompilationRun.jobs.find((job) =>
  job.jobId === atomicEchartsJob.id)
assert.equal(atomicD3Outcome?.status, 'completed_private_test')
assert.equal(atomicD3Outcome?.contentType, 'image/svg+xml')
assert.equal(atomicEchartsOutcome?.status, 'completed_private_test')
assert.equal(atomicEchartsOutcome?.contentType, 'image/svg+xml')
assert.equal(
  atomicCompilationRun.jobs.some((job) =>
    [atomicD3Job.id, atomicEchartsJob.id].includes(job.jobId) &&
    job.requiredGate === 'canonical_multi_tool_job_execution_adapter'),
  false,
)
const atomicCompilationProgress = await createCanonicalPrivateWorkGraphOrchestratorService(
  context,
).findLatestProgress({
  workspaceId: atomicCompilationWorkspaceId,
  packageRecordId: atomicCompilationPackage.id,
})
assert.ok(atomicCompilationProgress)
assert.equal(atomicCompilationProgress.completedJobCount, 5)
assert.equal(atomicCompilationProgress.requiredIncompleteJobCount, 2)

const postCommitChartClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-chart-postcommit-recovery-attempt',
})).workerLeaseClaim
const postCommitChartLeaseAuthority = {
  leaseId: postCommitChartClaim.lease.leaseId,
  leaseCredential: postCommitChartClaim.leaseCredential,
}
const postCommitChartGrant = (await dispatchService.authorize({
  ...baseInput,
  idempotencyKey: 'authorize-chart-postcommit-recovery-attempt',
}, postCommitChartLeaseAuthority)).toolDispatchGrant
assert.equal(postCommitChartGrant.grant.status, 'authorized')
assert.ok(postCommitChartGrant.dispatchCredential)
const directPostCommitChartExecution = await createCanonicalPrivateStructuredToolExecutionService(
  context,
).execute({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  grantId: postCommitChartGrant.grant.grantId,
  purpose: 'execute_canonical_private_structured_tool',
  idempotencyKey: 'consume-chart-before-adapter-completion-recovery',
}, {
  ...postCommitChartLeaseAuthority,
  dispatchCredential: postCommitChartGrant.dispatchCredential,
})
assert.equal(directPostCommitChartExecution.result.qaOutcome, 'passed')
assert.equal(
  directPostCommitChartExecution.result.reconciliationDecision,
  'test_merged_not_live_authorized',
)
const postCommitDispatchCount = (await requireDispatchAggregate()).grants.length
const chartAdapterInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-d3-postcommit-recovery',
}
const coordinatedExecution = await jobExecutionAdapter.execute(chartAdapterInput)
assert.equal(coordinatedExecution.identity.canonicalToolId, 'd3')
assert.equal(coordinatedExecution.identity.operationId, d3OperationId)
assert.equal(coordinatedExecution.identity.expectedAssetId, primaryAsset.id)
assert.equal(coordinatedExecution.identity.runnerClass, 'offline_node_structured_execution_v1')
assert.equal(coordinatedExecution.result.contentType, 'image/svg+xml')
assert.equal(coordinatedExecution.result.qaOutcome, 'passed')
assert.equal(coordinatedExecution.result.privateTestDependencySatisfied, true)
assert.equal(coordinatedExecution.result.finalRenderAuthorized, false)
assert.equal(coordinatedExecution.evidence.serverDerivedCanonicalJob, true)
assert.equal(coordinatedExecution.evidence.serverDerivedToolAndOperation, true)
assert.equal(coordinatedExecution.evidence.singleUseDispatchConsumed, true)
assert.equal(coordinatedExecution.evidence.idempotentAdapterReplay, false)
assert.equal(coordinatedExecution.readiness.productReady, false)
assert.equal((await requireDispatchAggregate()).grants.length, postCommitDispatchCount)
const postCommitRecoveryRecord = await readCanonicalPrivateJobCompletionRecovery({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
})
assert.ok(postCommitRecoveryRecord)
assert.equal(postCommitRecoveryRecord.identity.leaseId, postCommitChartClaim.lease.leaseId)
assert.equal(
  postCommitRecoveryRecord.identity.executionAttemptId,
  directPostCommitChartExecution.lease.executionAttemptId,
)
assert.equal(postCommitRecoveryRecord.response.responseHash, coordinatedExecution.responseHash)
assert.equal(postCommitRecoveryRecord.recovery.runnerReexecuted, false)
assert.equal(postCommitRecoveryRecord.recovery.newLeaseClaimed, false)
assert.equal(postCommitRecoveryRecord.recovery.newDispatchConsumed, false)
assert.equal(postCommitRecoveryRecord.recovery.reconciliationWritten, false)
const postCommitRecoveryRelativePath = canonicalPrivateJobCompletionRecoveryRelativePath({
  ownerUserId: userId,
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
})
const postCommitRecoveryPath = join(localStorageRoot, postCommitRecoveryRelativePath)
const postCommitRecoveryBytes = await readFile(postCommitRecoveryPath)
const serializedPostCommitRecovery = postCommitRecoveryBytes.toString('utf8')
assert.equal(serializedPostCommitRecovery.includes(strongInternalSecret), false)
assert.equal(serializedPostCommitRecovery.includes(postCommitChartClaim.leaseCredential), false)
assert.equal(serializedPostCommitRecovery.includes(localStorageRoot), false)
try {
  await writeFile(
    postCommitRecoveryPath,
    Buffer.concat([postCommitRecoveryBytes, Buffer.from('tampered-postcommit-recovery')]),
  )
  await expectApiError(
    () => readCanonicalPrivateJobCompletionRecovery({
      localStorageRoot,
      ownerUserId: userId,
      workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      jobId: chartJob.id,
    }),
    'VALIDATION_FAILED',
  )
} finally {
  await writeFile(postCommitRecoveryPath, postCommitRecoveryBytes)
}
assert.equal(await readCanonicalPrivateJobCompletionRecovery({
  localStorageRoot,
  ownerUserId: 'other-user-postcommit-recovery',
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: chartJob.id,
}), undefined)
const coordinatedReplay = await jobExecutionAdapter.execute(chartAdapterInput)
assert.equal(coordinatedReplay.result.artifactId, coordinatedExecution.result.artifactId)
assert.equal(coordinatedReplay.result.sha256, coordinatedExecution.result.sha256)
assert.equal(coordinatedReplay.evidence.idempotentAdapterReplay, true)
const d3ConsumedGrant = (await requireDispatchAggregate()).grants.find((grant) =>
  grant.binding.jobId === chartJob.id && grant.status === 'consumed')
assert.ok(d3ConsumedGrant)

const sharpAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sharpJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-sharp-root',
}
const coordinatedSharp = await jobExecutionAdapter.execute(sharpAdapterInput)
assert.equal(coordinatedSharp.identity.canonicalToolId, 'sharp')
assert.equal(coordinatedSharp.identity.operationId, 'tool.sharp.prepare_approved_image_asset.v1')
assert.equal(coordinatedSharp.identity.expectedAssetId, sharpAsset.id)
assert.equal(coordinatedSharp.identity.runnerClass, 'offline_sharp_structured_execution_v1')
assert.equal(coordinatedSharp.result.contentType, 'image/png')
assert.equal(coordinatedSharp.result.qaOutcome, 'passed')
assert.equal(coordinatedSharp.evidence.dependencyArtifactInput, true)
assert.equal(coordinatedSharp.evidence.singleUseDispatchConsumed, true)
assert.equal(coordinatedSharp.readiness.productReady, false)
const coordinatedSharpReplay = await jobExecutionAdapter.execute(sharpAdapterInput)
assert.equal(coordinatedSharpReplay.result.artifactId, coordinatedSharp.result.artifactId)
assert.equal(coordinatedSharpReplay.result.sha256, coordinatedSharp.result.sha256)
assert.equal(coordinatedSharpReplay.evidence.idempotentAdapterReplay, true)
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
    dispatchGrantId: d3ConsumedGrant.id,
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
await createPrivateOfflinePythonStructuredExecutionRuntime()
const failedDataAdapterInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-duckdb-failed-attempt-one',
}
const failedDataStageKey = (stage: string) =>
  `job-adapter:${stage}:${sha256Text(
    `${failedDataAdapterInput.idempotencyKey}\u0000${dataJob.id}`,
  ).slice(0, 48)}`
const failedDataClaim = (await leaseService.claim({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: failedDataStageKey('claim'),
})).workerLeaseClaim
const failedDataLeaseAuthority = {
  leaseId: failedDataClaim.lease.leaseId,
  leaseCredential: failedDataClaim.leaseCredential,
}
const failedDataGrant = (await dispatchService.authorize({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  approvedWorkItemId: dataWorkItem.id,
  expectedAssetId: dataAsset.id,
  requestedToolName: 'duckdb',
  operationId: duckdbOperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: failedDataStageKey('authorize'),
}, failedDataLeaseAuthority)).toolDispatchGrant
assert.equal(failedDataGrant.grant.status, 'authorized')
assert.ok(failedDataGrant.dispatchCredential)
await dispatchService.consume({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  grantId: failedDataGrant.grant.grantId,
  purpose: 'private_internal_canonical_tool_dispatch_consume',
  idempotencyKey: failedDataStageKey('consume'),
}, {
  ...failedDataLeaseAuthority,
  dispatchCredential: failedDataGrant.dispatchCredential,
})
const begunFailedDataExecution = await leaseService.beginInternalExecution({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  leaseId: failedDataClaim.lease.leaseId,
  leaseCredential: failedDataClaim.leaseCredential,
  runnerClass: 'offline_python_structured_execution_v1',
})
const failedDataExecution = await leaseService.failInternalExecution({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  leaseId: failedDataClaim.lease.leaseId,
  leaseCredential: failedDataClaim.leaseCredential,
  runnerClass: 'offline_python_structured_execution_v1',
  failureCategory: 'runtime_unavailable',
  failureCode: 'TOOL_NOT_READY',
  recoveryPolicy: 'same_operation_retry_within_approved_max_attempts',
})
assert.equal(failedDataExecution.resolution, 'failed_before_commit')
assert.equal(failedDataExecution.replayed, false)
assert.equal(failedDataExecution.lease.status, 'released')
assert.equal(failedDataExecution.lease.executionFence.state, 'failed')
assert.equal(
  failedDataExecution.lease.executionFence.executionAttemptId,
  begunFailedDataExecution.executionFence.executionAttemptId,
)
assert.equal(failedDataExecution.lease.executionFence.commitAuthorizedAt, undefined)
assert.equal(failedDataExecution.lease.executionFence.completedAt, undefined)
assert.match(
  failedDataExecution.lease.executionFence.failureEvidenceHash ?? '',
  /^[a-f0-9]{64}$/,
)
const failedDataReplay = await expectApiErrorResult(
  () => jobExecutionAdapter.execute(failedDataAdapterInput),
  'JOB_DEPENDENCY_NOT_READY',
)
const failedDataReplayDetails = asRecord(failedDataReplay.details)
const failedDataReplayEvidence = asRecord(failedDataReplayDetails.executionFailure)
assert.equal(failedDataReplayDetails.requiredGate, 'canonical_retry_same_approved_operation')
assert.equal(failedDataReplayEvidence.executionState, 'failed_before_commit')
assert.equal(failedDataReplayEvidence.retryDisposition, 'retry_same_approved_operation')
assert.equal(failedDataReplayEvidence.attemptNumber, 1)
assert.equal(failedDataReplayEvidence.approvedMaxAttempts, 2)
assert.equal(failedDataReplayEvidence.remainingAttempts, 1)
const exactFailedDataReplay = await expectApiErrorResult(
  () => jobExecutionAdapter.execute(failedDataAdapterInput),
  'JOB_DEPENDENCY_NOT_READY',
)
assert.deepEqual(exactFailedDataReplay.details, failedDataReplay.details)
const dataAdapterInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dataJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-duckdb-retry-two',
}
const coordinatedData = await jobExecutionAdapter.execute(dataAdapterInput)
assert.equal(coordinatedData.identity.canonicalToolId, 'duckdb')
assert.equal(coordinatedData.identity.operationId, duckdbOperationId)
assert.equal(coordinatedData.identity.expectedAssetId, dataAsset.id)
assert.equal(coordinatedData.identity.runnerClass, 'offline_python_structured_execution_v1')
assert.equal(coordinatedData.result.contentType, 'application/json')
assert.equal(coordinatedData.result.qaOutcome, 'passed')
assert.equal(coordinatedData.evidence.serverDerivedCanonicalJob, true)
assert.equal(coordinatedData.evidence.serverDerivedToolAndOperation, true)
assert.equal(coordinatedData.evidence.singleUseDispatchConsumed, true)
assert.equal(coordinatedData.readiness.productReady, false)
const coordinatedDataReplay = await jobExecutionAdapter.execute(dataAdapterInput)
assert.equal(coordinatedDataReplay.result.artifactId, coordinatedData.result.artifactId)
assert.equal(coordinatedDataReplay.result.sha256, coordinatedData.result.sha256)
assert.equal(coordinatedDataReplay.evidence.idempotentAdapterReplay, true)
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
const mediaAdapterInput = {
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: mediaJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-pyav-source-root',
}
const coordinatedMedia = await jobExecutionAdapter.execute(mediaAdapterInput)
assert.equal(coordinatedMedia.identity.canonicalToolId, 'pyav')
assert.equal(coordinatedMedia.identity.operationId, pyavOperationId)
assert.equal(coordinatedMedia.identity.expectedAssetId, mediaAsset.id)
assert.equal(coordinatedMedia.identity.runnerClass, 'offline_python_structured_execution_v1')
assert.equal(coordinatedMedia.result.contentType, 'application/json')
assert.equal(coordinatedMedia.result.qaOutcome, 'passed')
assert.equal(coordinatedMedia.evidence.serverDerivedCanonicalJob, true)
assert.equal(coordinatedMedia.evidence.serverDerivedToolAndOperation, true)
assert.equal(coordinatedMedia.evidence.singleUseDispatchConsumed, true)
assert.equal(coordinatedMedia.permissions.providerCall, false)
const coordinatedMediaReplay = await jobExecutionAdapter.execute(mediaAdapterInput)
assert.equal(coordinatedMediaReplay.result.artifactId, coordinatedMedia.result.artifactId)
assert.equal(coordinatedMediaReplay.result.sha256, coordinatedMedia.result.sha256)
assert.equal(coordinatedMediaReplay.evidence.idempotentAdapterReplay, true)
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
const audioRuns = [
  {
    toolName: 'scipy', operationId: scipyOperationId,
    job: scipyJob, asset: scipyAsset, proofJob: scipyProofJob, expectedContentType: 'application/json',
  },
  {
    toolName: 'pyloudnorm', operationId: pyloudnormOperationId,
    job: loudnessJob, asset: loudnessAsset, proofJob: loudnessProofJob, expectedContentType: 'application/json',
  },
  {
    toolName: 'pydub', operationId: pydubOperationId,
    job: pydubJob, asset: pydubAsset, proofJob: pydubProofJob, expectedContentType: 'audio/wav',
  },
  {
    toolName: 'pydub_effects', operationId: pydubEffectsOperationId,
    job: pydubEffectsJob, asset: pydubEffectsAsset,
    proofJob: pydubEffectsProofJob, expectedContentType: 'audio/wav',
  },
  {
    toolName: 'ebu_r128_pyloudnorm', operationId: ebuR128OperationId,
    job: ebuR128Job, asset: ebuR128Asset, proofJob: ebuR128ProofJob,
    expectedContentType: 'application/json',
  },
  {
    toolName: 'audioread', operationId: audioreadOperationId,
    job: audioreadJob, asset: audioreadAsset, proofJob: audioreadProofJob,
    expectedContentType: 'application/json',
  },
  {
    toolName: 'resampy', operationId: resampyOperationId,
    job: resampyJob, asset: resampyAsset, proofJob: resampyProofJob,
    expectedContentType: 'audio/wav',
  },
  {
    toolName: 'pedalboard', operationId: pedalboardOperationId,
    job: pedalboardJob, asset: pedalboardAsset, proofJob: pedalboardProofJob,
    expectedContentType: 'audio/wav',
  },
  {
    toolName: 'mir_eval', operationId: mirEvalOperationId,
    job: mirEvalJob, asset: mirEvalAsset, proofJob: mirEvalProofJob,
    expectedContentType: 'application/json',
  },
  {
    toolName: 'mido', operationId: midoOperationId,
    job: midoJob, asset: midoAsset, proofJob: midoProofJob,
    expectedContentType: 'application/json',
  },
] as const
for (const audioRun of audioRuns) {
  const adapterInput = {
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: audioRun.job.id,
    purpose: 'execute_canonical_private_job' as const,
    idempotencyKey: `canonical-job-adapter-${audioRun.toolName}-audio-root`,
  }
  const coordinated = await jobExecutionAdapter.execute(adapterInput)
  assert.equal(coordinated.identity.canonicalToolId, audioRun.toolName)
  assert.equal(coordinated.identity.operationId, audioRun.operationId)
  assert.equal(coordinated.identity.expectedAssetId, audioRun.asset.id)
  assert.equal(coordinated.identity.runnerClass, 'offline_python_structured_execution_v1')
  assert.equal(coordinated.result.contentType, audioRun.expectedContentType)
  assert.equal(coordinated.result.qaOutcome, 'passed')
  assert.equal(coordinated.result.privateTestDependencySatisfied, true)
  assert.equal(coordinated.evidence.serverDerivedCanonicalJob, true)
  assert.equal(coordinated.evidence.serverDerivedToolAndOperation, true)
  assert.equal(coordinated.evidence.singleUseDispatchConsumed, true)
  assert.equal(coordinated.evidence.idempotentAdapterReplay, false)
  assert.equal(coordinated.readiness.productReady, false)
  const replay = await jobExecutionAdapter.execute(adapterInput)
  assert.equal(replay.result.artifactId, coordinated.result.artifactId)
  assert.equal(replay.result.sha256, coordinated.result.sha256)
  assert.equal(replay.evidence.idempotentAdapterReplay, true)
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
  if (
    matrixRun.runnerKind === 'node' ||
    matrixRun.runnerKind === 'browser' ||
    matrixRun.runnerKind === 'ai' ||
    matrixRun.runnerKind === 'native_image' ||
    matrixRun.runnerKind === 'native_audio' ||
    matrixRun.runnerKind === 'packaging' ||
    matrixRun.runnerKind === 'vapoursynth' ||
    matrixRun.runnerKind === 'audioflux' ||
    matrixRun.runnerKind === 'rembg' ||
    matrixRun.runnerKind === 'python' ||
    matrixRun.runnerKind === 'deepfilternet'
  ) {
    const adapterInput = {
      workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      jobId: matrixRun.job.id,
      purpose: 'execute_canonical_private_job' as const,
      idempotencyKey: `canonical-job-adapter-${matrixRun.toolId}-root`,
    }
    let postCommitRecoveryDispatchCountBeforeAdapter: number | undefined
    if (matrixRun.runnerKind === 'deepfilternet') {
      const claim = (await leaseService.claim({
        workspaceId,
        projectId: snapshot.projectId,
        editSessionId: snapshot.editSessionId,
        jobId: matrixRun.job.id,
        purpose: 'private_internal_canonical_lease_claim',
        idempotencyKey: 'claim-deepfilternet-postcommit-recovery-attempt',
      })).workerLeaseClaim
      const leaseAuthority = {
        leaseId: claim.lease.leaseId,
        leaseCredential: claim.leaseCredential,
      }
      const grant: Awaited<ReturnType<typeof dispatchService.authorize>>['toolDispatchGrant'] =
        (await dispatchService.authorize({
        workspaceId,
        projectId: snapshot.projectId,
        editSessionId: snapshot.editSessionId,
        jobId: matrixRun.job.id,
        approvedWorkItemId: matrixRun.workItem.id,
        expectedAssetId: matrixRun.asset.id,
        requestedToolName: matrixRun.toolId,
        operationId: matrixRun.operationId,
        purpose: 'private_internal_canonical_tool_dispatch_authorization',
        idempotencyKey: 'authorize-deepfilternet-postcommit-recovery-attempt',
        }, leaseAuthority)).toolDispatchGrant
      assert.equal(grant.grant.status, 'authorized')
      assert.ok(grant.dispatchCredential)
      const directExecution = await createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService(
        context,
      ).execute({
        workspaceId,
        projectId: snapshot.projectId,
        editSessionId: snapshot.editSessionId,
        jobId: matrixRun.job.id,
        grantId: grant.grant.grantId,
        purpose: 'execute_canonical_private_deepfilternet_voice_cleanup',
        idempotencyKey: 'consume-deepfilternet-before-adapter-completion-recovery',
      }, {
        ...leaseAuthority,
        dispatchCredential: grant.dispatchCredential,
      })
      assert.equal(directExecution.result.qaOutcome, 'passed')
      assert.equal(directExecution.attemptCost.evidence.outcome.status, 'completed')
      postCommitRecoveryDispatchCountBeforeAdapter = (await requireDispatchAggregate()).grants.length
    }
    const coordinated = await jobExecutionAdapter.execute(adapterInput)
    assert.equal(coordinated.identity.canonicalToolId, matrixRun.toolId)
    assert.equal(coordinated.identity.operationId, matrixRun.operationId)
    assert.equal(coordinated.identity.expectedAssetId, matrixRun.asset.id)
    assert.equal(
      coordinated.identity.runnerClass,
      matrixRun.runnerKind === 'node'
        ? 'offline_node_structured_execution_v1'
        : matrixRun.runnerKind === 'browser'
          ? 'offline_browser_graphics_execution_v1'
          : matrixRun.runnerKind === 'ai'
            ? 'offline_ai_capability_execution_v1'
            : matrixRun.runnerKind === 'native_image'
              ? 'offline_native_image_pipeline_execution_v1'
              : matrixRun.runnerKind === 'native_audio'
                ? 'offline_native_audio_processing_execution_v1'
                : matrixRun.runnerKind === 'packaging'
                  ? 'offline_container_packaging_validation_execution_v1'
                  : matrixRun.runnerKind === 'vapoursynth'
                    ? 'offline_vapoursynth_frame_pipeline_execution_v1'
                    : matrixRun.runnerKind === 'audioflux'
                      ? 'offline_audioflux_analysis_execution_v1'
                    : matrixRun.runnerKind === 'rembg'
                      ? 'offline_rembg_background_removal_execution_v1'
                      : matrixRun.runnerKind === 'deepfilternet'
                        ? 'offline_deepfilternet_voice_cleanup_execution_v1'
                        : 'offline_python_structured_execution_v1',
    )
    assert.equal(coordinated.result.contentType, matrixRun.expectedContentType)
    assert.equal(coordinated.result.qaOutcome, 'passed')
    assert.equal(coordinated.result.privateTestDependencySatisfied, true)
    assert.equal(coordinated.evidence.serverDerivedCanonicalJob, true)
    assert.equal(coordinated.evidence.serverDerivedToolAndOperation, true)
    assert.equal(coordinated.evidence.singleUseDispatchConsumed, true)
    assert.equal(coordinated.evidence.idempotentAdapterReplay, false)
    assert.equal(coordinated.readiness.privateInternalJobExecutionReady, true)
    assert.equal(coordinated.readiness.productReady, false)
    if (postCommitRecoveryDispatchCountBeforeAdapter !== undefined) {
      assert.equal(
        (await requireDispatchAggregate()).grants.length,
        postCommitRecoveryDispatchCountBeforeAdapter,
      )
    }
    const replay = await jobExecutionAdapter.execute(adapterInput)
    assert.equal(replay.result.artifactId, coordinated.result.artifactId)
    assert.equal(replay.result.sha256, coordinated.result.sha256)
    assert.equal(replay.evidence.idempotentAdapterReplay, true)
    if (matrixRun.runnerKind === 'deepfilternet') {
      assert.equal(coordinated.result.sha256, 'a359cf256f9f05294ee7f9701ec189385aed277020b2be5dfa83d229409e27a7')
      assert.equal(coordinated.result.byteLength, 384_214)
      assert.equal(coordinated.evidence.attemptCostEvidenceRecorded, true)
      const leaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate({
        localStorageRoot,
        ownerUserId: userId,
        workspaceId,
      })
      const deepFilterNetLeases = leaseAggregate?.leases.filter((lease) =>
        lease.jobId === matrixRun.job.id)
      assert.equal(deepFilterNetLeases?.length, 1)
      const completedLease = deepFilterNetLeases?.[0]
      assert.equal(completedLease?.executionFence.state, 'completed')
      assert.equal(completedLease?.executionFence.runnerClass, 'offline_deepfilternet_voice_cleanup_execution_v1')
      const executionAttemptId = completedLease?.executionFence.executionAttemptId
      assert.ok(executionAttemptId)
      const attemptCostEvidence = await readPrivateInternalAttemptCostEvidence({
        localStorageRoot,
        workspaceId,
        projectId: snapshot.projectId,
        executionAttemptId,
      })
      assert.ok(attemptCostEvidence)
      assert.equal(attemptCostEvidence.boundary, 'internal_production_cost_only')
      assert.equal(attemptCostEvidence.evidenceClassification, 'provisional_local_metered')
      assert.equal(attemptCostEvidence.rateCardVersion, 'rp-ratecard-01-mock-safe')
      assert.equal(attemptCostEvidence.sourceKind, 'infrastructure_runtime')
      assert.equal(attemptCostEvidence.identity.approvedPlanSnapshotId, snapshot.snapshotId)
      assert.equal(attemptCostEvidence.identity.approvedWorkItemId, matrixRun.workItem.id)
      assert.equal(attemptCostEvidence.identity.jobId, matrixRun.job.id)
      assert.equal(attemptCostEvidence.identity.executionAttemptId, executionAttemptId)
      assert.equal(attemptCostEvidence.identity.retryAttempt, 0)
      assert.equal(attemptCostEvidence.resourceUsage.vcpuCount, 4)
      assert.equal(attemptCostEvidence.resourceUsage.memoryGib, 4)
      assert.equal(attemptCostEvidence.resourceUsage.gpuCount, 0)
      assert.equal(attemptCostEvidence.resourceUsage.outputByteLength, 384_214)
      assert(Number.isSafeInteger(attemptCostEvidence.actualInternalCostMicros))
      assert(attemptCostEvidence.actualInternalCostMicros > 0)
      assert.equal(attemptCostEvidence.outcome.status, 'completed')
      assert.equal(attemptCostEvidence.outcome.failureCategory, 'none')
      assert.equal(attemptCostEvidence.persistence.privateLocalCreateOnly, true)
      assert.equal(attemptCostEvidence.persistence.databaseBacked, false)
      assert.equal(attemptCostEvidence.persistence.productionDurability, false)
      assert.equal(attemptCostEvidence.persistence.invoiceReconciled, false)
      assertNoCommercialCostKeys(attemptCostEvidence)
      const recoveryRecord = await readCanonicalPrivateJobCompletionRecovery({
        localStorageRoot,
        ownerUserId: userId,
        workspaceId,
        projectId: snapshot.projectId,
        editSessionId: snapshot.editSessionId,
        jobId: matrixRun.job.id,
      })
      assert.ok(recoveryRecord)
      assert.equal(
        recoveryRecord.evidence.internalAttemptCostEvidenceHash,
        attemptCostEvidence.evidenceHash,
      )
      assert.equal(recoveryRecord.recovery.runnerReexecuted, false)
      assert.equal(recoveryRecord.recovery.costEvidenceWritten, false)
    }
    const proofClaim: Awaited<ReturnType<typeof leaseService.claim>>['workerLeaseClaim'] =
      (await leaseService.claim({
        workspaceId,
        projectId: snapshot.projectId,
        editSessionId: snapshot.editSessionId,
        jobId: matrixRun.proofJob.id,
        purpose: 'private_internal_canonical_lease_claim',
        idempotencyKey: `claim-${matrixRun.toolId}-matrix-proof-after-job-adapter`,
      })).workerLeaseClaim
    assert.equal(proofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
    assert.equal(proofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
    assert.equal(
      proofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId,
      coordinated.result.artifactId,
    )
    await leaseService.release({
      workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      jobId: matrixRun.proofJob.id,
      leaseId: proofClaim.lease.leaseId,
      leaseCredential: proofClaim.leaseCredential,
      purpose: 'private_internal_canonical_lease_release',
      idempotencyKey: `release-${matrixRun.toolId}-matrix-proof-after-job-adapter`,
    })
    continue
  }
}

await activatePrivateOfflineMediaBinaryRuntime()
await prepareOfflineRemotionDockerRuntime()
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
assert.equal(
  coordinatedRemotion.resourceUsage.measurementAgentVersion,
  'embedded_remotion_cgroup_v2_observer_v1',
)
assert.equal(
  coordinatedRemotion.resourceUsage.measurementClass,
  'private_embedded_observed_resource_snapshots',
)
assert.ok(coordinatedRemotion.resourceUsage.observedCpuMicroseconds > 0)
assert.ok(coordinatedRemotion.resourceUsage.observedPeakMemoryBytes > 0)
assert.equal(coordinatedRemotion.resourceUsage.providerCostIncluded, false)
assert.equal(coordinatedRemotion.resourceUsage.customerPriceIncluded, false)
assert.equal(coordinatedRemotion.resourceUsage.customerCreditsIncluded, false)
assert.equal(coordinatedRemotion.resourceUsage.serviceFeeIncluded, false)
assert.equal(coordinatedRemotion.resourceUsage.productionReady, false)
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
assert.equal(
  coordinatedRemotionReplay.resourceUsage.evidenceHash,
  coordinatedRemotion.resourceUsage.evidenceHash,
)
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

const motionStudioSceneClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioSceneJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-motion-studio-scene-preview-root',
})).workerLeaseClaim
assert.equal(motionStudioSceneClaim.lease.dependencyAuthority.state, 'not_required_for_root_job')
assert.equal(motionStudioSceneClaim.lease.dependencyAuthority.selectedArtifacts.length, 0)
const motionStudioSceneLeaseAuthority = {
  leaseId: motionStudioSceneClaim.lease.leaseId,
  leaseCredential: motionStudioSceneClaim.leaseCredential,
}
const motionStudioSceneGrant = (await dispatchService.authorize({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioSceneJob.id, approvedWorkItemId: motionStudioSceneWorkItem.id,
  expectedAssetId: motionStudioSceneAsset.id, requestedToolName: 'remotion',
  operationId: remotionOperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: 'authorize-motion-studio-scene-preview-root',
}, motionStudioSceneLeaseAuthority)).toolDispatchGrant
assert.equal(motionStudioSceneGrant.grant.status, 'authorized')
assert.equal(motionStudioSceneGrant.grant.binding.leaseDependencyAuthority.selectedArtifactCount, 0)
assert.ok(motionStudioSceneGrant.dispatchCredential)
const motionStudioSceneExecutionInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioSceneJob.id, grantId: motionStudioSceneGrant.grant.grantId,
  purpose: 'execute_canonical_private_remotion_tool' as const,
  idempotencyKey: 'consume-motion-studio-scene-preview-root',
}
const motionStudioSceneExecutionAuthority = {
  ...motionStudioSceneLeaseAuthority,
  dispatchCredential: motionStudioSceneGrant.dispatchCredential,
}
const coordinatedMotionStudioScene = await createCanonicalPrivateRemotionExecutionService(context).execute(
  motionStudioSceneExecutionInput,
  motionStudioSceneExecutionAuthority,
)
assert.equal(
  coordinatedMotionStudioScene.tool.motionStudioCompositionProfileId,
  'motion_studio_scene_preview_v1',
)
assert.equal(coordinatedMotionStudioScene.tool.dependencyArtifactRead, false)
assert.equal(coordinatedMotionStudioScene.tool.dependencyReadEvidenceHash, undefined)
assert.equal(coordinatedMotionStudioScene.qa.motionStudioFrameGoldenCount, 3)
assert.match(coordinatedMotionStudioScene.qa.motionStudioFrameGoldenEvidenceHash ?? '', /^[a-f0-9]{64}$/)
assert.equal(coordinatedMotionStudioScene.result.contentType, 'video/mp4')
assert.equal(coordinatedMotionStudioScene.result.qaOutcome, 'passed')
assert.equal(coordinatedMotionStudioScene.result.finalRenderAuthorized, false)
const motionStudioSceneReplay = await createCanonicalPrivateRemotionExecutionService(context).execute(
  motionStudioSceneExecutionInput,
  motionStudioSceneExecutionAuthority,
)
assert.equal(motionStudioSceneReplay.result.artifactId, coordinatedMotionStudioScene.result.artifactId)
assert.equal(motionStudioSceneReplay.result.sha256, coordinatedMotionStudioScene.result.sha256)
assert.equal(motionStudioSceneReplay.replay.dispatchConsumptionReplayed, true)
const motionStudioSceneProofClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioSceneProofJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-motion-studio-scene-preview-proof',
})).workerLeaseClaim
assert.equal(motionStudioSceneProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(motionStudioSceneProofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(
  motionStudioSceneProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId,
  coordinatedMotionStudioScene.result.artifactId,
)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioSceneProofJob.id, leaseId: motionStudioSceneProofClaim.lease.leaseId,
  leaseCredential: motionStudioSceneProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-motion-studio-scene-preview-proof',
})
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioSceneJob.id, leaseId: motionStudioSceneClaim.lease.leaseId,
  leaseCredential: motionStudioSceneClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-motion-studio-scene-preview-root',
})

const motionStudioLayeredClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioLayeredJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-motion-studio-layered-preview-root',
})).workerLeaseClaim
assert.equal(motionStudioLayeredClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(motionStudioLayeredClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
const motionStudioLayeredSelectedArtifact =
  motionStudioLayeredClaim.lease.dependencyAuthority.selectedArtifacts[0]
assert.ok(motionStudioLayeredSelectedArtifact)
const motionStudioLayeredLeaseAuthority = {
  leaseId: motionStudioLayeredClaim.lease.leaseId,
  leaseCredential: motionStudioLayeredClaim.leaseCredential,
}
const motionStudioLayeredGrant = (await dispatchService.authorize({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioLayeredJob.id, approvedWorkItemId: motionStudioLayeredWorkItem.id,
  expectedAssetId: motionStudioLayeredAsset.id, requestedToolName: 'remotion',
  operationId: remotionOperationId,
  purpose: 'private_internal_canonical_tool_dispatch_authorization',
  idempotencyKey: 'authorize-motion-studio-layered-preview-root',
}, motionStudioLayeredLeaseAuthority)).toolDispatchGrant
assert.equal(motionStudioLayeredGrant.grant.status, 'authorized')
assert.equal(motionStudioLayeredGrant.grant.binding.leaseDependencyAuthority.selectedArtifactCount, 1)
assert.ok(motionStudioLayeredGrant.dispatchCredential)
const motionStudioLayeredExecutionInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioLayeredJob.id, grantId: motionStudioLayeredGrant.grant.grantId,
  purpose: 'execute_canonical_private_remotion_tool' as const,
  idempotencyKey: 'consume-motion-studio-layered-preview-root',
}
const motionStudioLayeredExecutionAuthority = {
  ...motionStudioLayeredLeaseAuthority,
  dispatchCredential: motionStudioLayeredGrant.dispatchCredential,
}
const coordinatedMotionStudioLayered = await createCanonicalPrivateRemotionExecutionService(context).execute(
  motionStudioLayeredExecutionInput,
  motionStudioLayeredExecutionAuthority,
)
assert.equal(
  coordinatedMotionStudioLayered.tool.motionStudioCompositionProfileId,
  'motion_studio_native_layered_scene_v1',
)
assert.equal(coordinatedMotionStudioLayered.tool.dependencyArtifactRead, true)
assert.equal(coordinatedMotionStudioLayered.tool.sourceArtifactContentType, 'image/png')
assert.equal(coordinatedMotionStudioLayered.tool.sourceArtifactId, motionStudioLayeredSelectedArtifact.artifactId)
assert.equal(
  coordinatedMotionStudioLayered.tool.sourceArtifactSha256,
  motionStudioLayeredSelectedArtifact.contentSha256,
)
assert.match(coordinatedMotionStudioLayered.tool.dependencyReadEvidenceHash ?? '', /^[a-f0-9]{64}$/)
assert.equal(coordinatedMotionStudioLayered.qa.motionStudioFrameGoldenCount, 3)
assert.match(coordinatedMotionStudioLayered.qa.motionStudioFrameGoldenEvidenceHash ?? '', /^[a-f0-9]{64}$/)
assert.equal(coordinatedMotionStudioLayered.result.contentType, 'video/mp4')
assert.equal(coordinatedMotionStudioLayered.result.qaOutcome, 'passed')
assert.equal(coordinatedMotionStudioLayered.result.finalRenderAuthorized, false)
const motionStudioLayeredReplay = await createCanonicalPrivateRemotionExecutionService(context).execute(
  motionStudioLayeredExecutionInput,
  motionStudioLayeredExecutionAuthority,
)
assert.equal(motionStudioLayeredReplay.result.artifactId, coordinatedMotionStudioLayered.result.artifactId)
assert.equal(motionStudioLayeredReplay.result.sha256, coordinatedMotionStudioLayered.result.sha256)
assert.equal(motionStudioLayeredReplay.replay.dispatchConsumptionReplayed, true)
const motionStudioLayeredProofClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioLayeredProofJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-motion-studio-layered-preview-proof',
})).workerLeaseClaim
assert.equal(motionStudioLayeredProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(motionStudioLayeredProofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(
  motionStudioLayeredProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId,
  coordinatedMotionStudioLayered.result.artifactId,
)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioLayeredProofJob.id, leaseId: motionStudioLayeredProofClaim.lease.leaseId,
  leaseCredential: motionStudioLayeredProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-motion-studio-layered-preview-proof',
})
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: motionStudioLayeredJob.id, leaseId: motionStudioLayeredClaim.lease.leaseId,
  leaseCredential: motionStudioLayeredClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-motion-studio-layered-preview-root',
})

await activatePrivateOfflineLibassCaptionRuntime()
const libassAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: libassJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-libass-caption-overlay-root',
}
const coordinatedLibass = await jobExecutionAdapter.execute(libassAdapterInput)
assert.equal(coordinatedLibass.identity.canonicalToolId, 'libass')
assert.equal(coordinatedLibass.identity.operationId, libassOperationId)
assert.equal(coordinatedLibass.identity.expectedAssetId, libassAsset.id)
assert.equal(coordinatedLibass.identity.runnerClass, 'offline_libass_caption_execution_v1')
assert.equal(coordinatedLibass.result.contentType, 'image/png')
assert.equal(coordinatedLibass.result.qaOutcome, 'passed')
assert.equal(coordinatedLibass.result.finalRenderAuthorized, false)
assert.equal(coordinatedLibass.evidence.serverDerivedCanonicalJob, true)
assert.equal(coordinatedLibass.evidence.serverDerivedToolAndOperation, true)
assert.equal(coordinatedLibass.evidence.singleUseDispatchConsumed, true)
assert.equal(coordinatedLibass.permissions.productionRender, false)
const coordinatedLibassReplay = await jobExecutionAdapter.execute(libassAdapterInput)
assert.equal(coordinatedLibassReplay.result.artifactId, coordinatedLibass.result.artifactId)
assert.equal(coordinatedLibassReplay.result.sha256, coordinatedLibass.result.sha256)
assert.equal(coordinatedLibassReplay.evidence.idempotentAdapterReplay, true)
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
const secondLibassAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: secondLibassJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-libass-caption-overlay-second',
}
const coordinatedSecondLibass = await jobExecutionAdapter.execute(secondLibassAdapterInput)
assert.equal(coordinatedSecondLibass.identity.canonicalToolId, 'libass')
assert.equal(coordinatedSecondLibass.identity.operationId, libassOperationId)
assert.equal(coordinatedSecondLibass.identity.expectedAssetId, secondLibassAsset.id)
assert.equal(coordinatedSecondLibass.identity.runnerClass, 'offline_libass_caption_execution_v1')
assert.equal(coordinatedSecondLibass.result.contentType, 'image/png')
assert.equal(coordinatedSecondLibass.result.qaOutcome, 'passed')
assert.notEqual(coordinatedSecondLibass.result.sha256, coordinatedLibass.result.sha256)
const coordinatedSecondLibassReplay = await jobExecutionAdapter.execute(secondLibassAdapterInput)
assert.equal(coordinatedSecondLibassReplay.result.artifactId, coordinatedSecondLibass.result.artifactId)
assert.equal(coordinatedSecondLibassReplay.result.sha256, coordinatedSecondLibass.result.sha256)
assert.equal(coordinatedSecondLibassReplay.evidence.idempotentAdapterReplay, true)
const secondLibassProofClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: secondLibassProofJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-libass-caption-overlay-second-proof',
})).workerLeaseClaim
assert.equal(secondLibassProofClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(secondLibassProofClaim.lease.dependencyAuthority.selectedArtifacts.length, 1)
assert.equal(
  secondLibassProofClaim.lease.dependencyAuthority.selectedArtifacts[0]?.artifactId,
  coordinatedSecondLibass.result.artifactId,
)
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: secondLibassProofJob.id, leaseId: secondLibassProofClaim.lease.leaseId,
  leaseCredential: secondLibassProofClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-libass-caption-overlay-second-proof',
})

await activatePrivateOfflineMediaBinaryRuntime()
const primaryVoiceAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: primaryVoiceJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-voice-delivery-primary',
}
const coordinatedPrimaryVoice = await jobExecutionAdapter.execute(primaryVoiceAdapterInput)
assert.equal(coordinatedPrimaryVoice.identity.canonicalToolId, 'ffmpeg')
assert.equal(coordinatedPrimaryVoice.identity.runnerClass, 'offline_media_binary_execution_v1')
assert.equal(coordinatedPrimaryVoice.identity.expectedAssetId, primaryVoiceAsset.id)
assert.equal(coordinatedPrimaryVoice.result.contentType, 'audio/wav')
assert.equal(coordinatedPrimaryVoice.result.qaOutcome, 'passed')
assert.equal(coordinatedPrimaryVoice.result.privateTestDependencySatisfied, true)
assert.equal(coordinatedPrimaryVoice.result.liveRuntimeDependencySatisfied, false)
assert.equal(coordinatedPrimaryVoice.evidence.mediaOutputStreamed, true)
const primaryVoiceReplay = await jobExecutionAdapter.execute(primaryVoiceAdapterInput)
assert.equal(primaryVoiceReplay.result.artifactId, coordinatedPrimaryVoice.result.artifactId)
assert.equal(primaryVoiceReplay.result.sha256, coordinatedPrimaryVoice.result.sha256)
assert.equal(primaryVoiceReplay.evidence.idempotentAdapterReplay, true)

const secondaryVoiceAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: secondaryVoiceJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-voice-delivery-secondary',
}
const coordinatedSecondaryVoice = await jobExecutionAdapter.execute(secondaryVoiceAdapterInput)
assert.equal(coordinatedSecondaryVoice.identity.canonicalToolId, 'ffmpeg')
assert.equal(coordinatedSecondaryVoice.identity.runnerClass, 'offline_media_binary_execution_v1')
assert.equal(coordinatedSecondaryVoice.identity.expectedAssetId, secondaryVoiceAsset.id)
assert.equal(coordinatedSecondaryVoice.result.contentType, 'audio/wav')
assert.equal(coordinatedSecondaryVoice.result.qaOutcome, 'passed')
assert.equal(coordinatedSecondaryVoice.result.privateTestDependencySatisfied, true)
assert.equal(coordinatedSecondaryVoice.result.liveRuntimeDependencySatisfied, false)
assert.equal(coordinatedSecondaryVoice.evidence.mediaOutputStreamed, true)
assert.notEqual(coordinatedSecondaryVoice.result.sha256, coordinatedPrimaryVoice.result.sha256)
const secondaryVoiceReplay = await jobExecutionAdapter.execute(secondaryVoiceAdapterInput)
assert.equal(secondaryVoiceReplay.result.artifactId, coordinatedSecondaryVoice.result.artifactId)
assert.equal(secondaryVoiceReplay.result.sha256, coordinatedSecondaryVoice.result.sha256)
assert.equal(secondaryVoiceReplay.evidence.idempotentAdapterReplay, true)
const coordinatedTertiaryVoice = tertiaryVoiceJob && tertiaryVoiceAsset
  ? await jobExecutionAdapter.execute({
      workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      jobId: tertiaryVoiceJob.id,
      purpose: 'execute_canonical_private_job' as const,
      idempotencyKey: 'canonical-job-adapter-voice-delivery-tertiary',
    })
  : undefined
if (tertiaryMediaSourceItem) {
  assert.ok(coordinatedTertiaryVoice)
  assert.equal(coordinatedTertiaryVoice.identity.canonicalToolId, 'ffmpeg')
  assert.equal(coordinatedTertiaryVoice.identity.expectedAssetId, tertiaryVoiceAsset!.id)
  assert.equal(coordinatedTertiaryVoice.result.contentType, 'audio/wav')
  assert.equal(coordinatedTertiaryVoice.result.qaOutcome, 'passed')
  assert.equal(coordinatedTertiaryVoice.evidence.mediaOutputStreamed, true)
  assert.notEqual(coordinatedTertiaryVoice.result.sha256, coordinatedPrimaryVoice.result.sha256)
  const tertiaryVoiceReplay = await jobExecutionAdapter.execute({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: tertiaryVoiceJob!.id,
    purpose: 'execute_canonical_private_job',
    idempotencyKey: 'canonical-job-adapter-voice-delivery-tertiary',
  })
  assert.equal(tertiaryVoiceReplay.result.artifactId, coordinatedTertiaryVoice.result.artifactId)
  assert.equal(tertiaryVoiceReplay.result.sha256, coordinatedTertiaryVoice.result.sha256)
  assert.equal(tertiaryVoiceReplay.evidence.idempotentAdapterReplay, true)
}

const primaryColorAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: primaryColorJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-color-delivery-primary',
}
const coordinatedPrimaryColor = await jobExecutionAdapter.execute(primaryColorAdapterInput)
assert.equal(coordinatedPrimaryColor.identity.canonicalToolId, 'ffmpeg')
assert.equal(coordinatedPrimaryColor.identity.runnerClass, 'offline_media_binary_execution_v1')
assert.equal(coordinatedPrimaryColor.identity.expectedAssetId, primaryColorAsset.id)
assert.equal(coordinatedPrimaryColor.result.contentType, 'video/x-matroska')
assert.equal(coordinatedPrimaryColor.result.qaOutcome, 'passed')
assert.equal(coordinatedPrimaryColor.result.privateTestDependencySatisfied, true)
assert.equal(coordinatedPrimaryColor.evidence.dependencyArtifactInput, false)
const primaryColorReplay = await jobExecutionAdapter.execute(primaryColorAdapterInput)
assert.equal(primaryColorReplay.result.artifactId, coordinatedPrimaryColor.result.artifactId)
assert.equal(primaryColorReplay.result.sha256, coordinatedPrimaryColor.result.sha256)
assert.equal(primaryColorReplay.evidence.idempotentAdapterReplay, true)

const secondaryColorAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: secondaryColorJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-color-delivery-secondary',
}
const coordinatedSecondaryColor = await jobExecutionAdapter.execute(secondaryColorAdapterInput)
assert.equal(coordinatedSecondaryColor.identity.canonicalToolId, 'ffmpeg')
assert.equal(coordinatedSecondaryColor.identity.runnerClass, 'offline_media_binary_execution_v1')
assert.equal(coordinatedSecondaryColor.identity.expectedAssetId, secondaryColorAsset.id)
assert.equal(coordinatedSecondaryColor.result.contentType, 'video/x-matroska')
assert.equal(coordinatedSecondaryColor.result.qaOutcome, 'passed')
assert.equal(coordinatedSecondaryColor.result.privateTestDependencySatisfied, true)
assert.equal(coordinatedSecondaryColor.evidence.dependencyArtifactInput, true)
assert.notEqual(coordinatedSecondaryColor.result.sha256, coordinatedPrimaryColor.result.sha256)
const secondaryColorReplay = await jobExecutionAdapter.execute(secondaryColorAdapterInput)
assert.equal(secondaryColorReplay.result.artifactId, coordinatedSecondaryColor.result.artifactId)
assert.equal(secondaryColorReplay.result.sha256, coordinatedSecondaryColor.result.sha256)
assert.equal(secondaryColorReplay.evidence.idempotentAdapterReplay, true)
const coordinatedTertiaryColor = tertiaryColorJob && tertiaryColorAsset
  ? await jobExecutionAdapter.execute({
      workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      jobId: tertiaryColorJob.id,
      purpose: 'execute_canonical_private_job' as const,
      idempotencyKey: 'canonical-job-adapter-color-delivery-tertiary',
    })
  : undefined
if (tertiaryMediaSourceItem) {
  assert.ok(coordinatedTertiaryColor)
  assert.equal(coordinatedTertiaryColor.identity.canonicalToolId, 'ffmpeg')
  assert.equal(coordinatedTertiaryColor.identity.expectedAssetId, tertiaryColorAsset!.id)
  assert.equal(coordinatedTertiaryColor.result.contentType, 'video/x-matroska')
  assert.equal(coordinatedTertiaryColor.result.qaOutcome, 'passed')
  assert.equal(coordinatedTertiaryColor.evidence.dependencyArtifactInput, true)
  assert.notEqual(coordinatedTertiaryColor.result.sha256, coordinatedPrimaryColor.result.sha256)
  const tertiaryColorReplay = await jobExecutionAdapter.execute({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: tertiaryColorJob!.id,
    purpose: 'execute_canonical_private_job',
    idempotencyKey: 'canonical-job-adapter-color-delivery-tertiary',
  })
  assert.equal(tertiaryColorReplay.result.artifactId, coordinatedTertiaryColor.result.artifactId)
  assert.equal(tertiaryColorReplay.result.sha256, coordinatedTertiaryColor.result.sha256)
  assert.equal(tertiaryColorReplay.evidence.idempotentAdapterReplay, true)
}

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
await leaseService.release({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: sourceTrimValidationJob.id, leaseId: sourceTrimValidationClaim.lease.leaseId,
  leaseCredential: sourceTrimValidationClaim.leaseCredential,
  purpose: 'private_internal_canonical_lease_release',
  idempotencyKey: 'release-source-trim-validation-for-final-composition',
})

const finalCompositionClaim = (await leaseService.claim({
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: finalCompositionJob.id, purpose: 'private_internal_canonical_lease_claim',
  idempotencyKey: 'claim-remotion-source-caption-final',
})).workerLeaseClaim
assert.equal(finalCompositionClaim.lease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(
  finalCompositionClaim.lease.dependencyAuthority.selectedArtifacts.length,
  tertiaryMediaSourceItem ? 9 : 7,
)
assert.deepEqual(
  finalCompositionClaim.lease.dependencyAuthority.selectedArtifacts.map((artifact) => artifact.artifactId),
  [
    sourceTrimValidationRun.result.artifactId,
    coordinatedLibass.result.artifactId,
    coordinatedSecondLibass.result.artifactId,
    coordinatedPrimaryVoice.result.artifactId,
    coordinatedSecondaryVoice.result.artifactId,
    ...(coordinatedTertiaryVoice ? [coordinatedTertiaryVoice.result.artifactId] : []),
    coordinatedPrimaryColor.result.artifactId,
    coordinatedSecondaryColor.result.artifactId,
    ...(coordinatedTertiaryColor ? [coordinatedTertiaryColor.result.artifactId] : []),
  ],
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
const approvedFinalCompositionPayload = asRecord(
  finalCompositionExecutionWorkItem.executionInput.structuredPayload,
)
assert.equal(
  approvedFinalCompositionPayload.compositionProfileId,
  'approved_source_sequence_caption_track_final_v1',
)
assert.deepEqual(approvedFinalCompositionPayload.captionOverlayCues, [{
  outputKey: 'libass-caption-overlay-png',
  startFrame: 0,
  endFrameExclusive: 24,
}, {
  outputKey: 'libass-caption-overlay-second-png',
  startFrame: 24,
  endFrameExclusive: 48,
}])
assert.equal(approvedFinalCompositionPayload.transitionPolicy, 'approved_hard_cuts_only')
assert.deepEqual(approvedFinalCompositionPayload.hardCutTransitions, [{
  transitionTimingItemId: 'master-approved-hard-cut-1',
  refinedTransitionTimingItemId: 'refined-approved-hard-cut-1',
  fromSegmentId: 'segment-1',
  toSegmentId: 'segment-2',
  fromSourceSequenceItemId: mediaSourceItem.sourceSequenceItemId,
  toSourceSequenceItemId: secondaryMediaSourceItem.sourceSequenceItemId,
  boundaryFrame: 24,
}, ...(tertiaryMediaSourceItem
  ? [{
      transitionTimingItemId: 'master-approved-hard-cut-2',
      refinedTransitionTimingItemId: 'refined-approved-hard-cut-2',
      fromSegmentId: 'segment-2',
      toSegmentId: 'segment-3',
      fromSourceSequenceItemId: secondaryMediaSourceItem.sourceSequenceItemId,
      toSourceSequenceItemId: tertiaryMediaSourceItem.sourceSequenceItemId,
      boundaryFrame: 48,
    }]
  : [])])
assert.equal(approvedFinalCompositionPayload.audioPolicy, 'replace_with_approved_voice_tracks')
assert.equal(
  approvedFinalCompositionPayload.sourceMediaPolicy,
  'approved_professional_color_intermediate_v1',
)
assert.deepEqual(approvedFinalCompositionPayload.voiceTracks, [{
  sourceSequenceItemId: mediaSourceItem.sourceSequenceItemId,
  outputKey: 'voice-delivery-primary-wav',
  durationFrames: 24,
}, {
  sourceSequenceItemId: secondaryMediaSourceItem.sourceSequenceItemId,
  outputKey: 'voice-delivery-secondary-wav',
  durationFrames: 24,
}, ...(tertiaryMediaSourceItem
  ? [{
      sourceSequenceItemId: tertiaryMediaSourceItem.sourceSequenceItemId,
      outputKey: 'voice-delivery-tertiary-wav',
      durationFrames: 24,
    }]
  : [])])
assert.deepEqual(finalCompositionExecutionWorkItem.sourceSequenceItemIds, [
  mediaSourceItem.sourceSequenceItemId,
  secondaryMediaSourceItem.sourceSequenceItemId,
  ...(tertiaryMediaSourceItem ? [tertiaryMediaSourceItem.sourceSequenceItemId] : []),
])
assert.deepEqual(finalCompositionExecutionWorkItem.sourceCleanupDecisionIds, [
  'cleanup-python-media-source',
  'cleanup-secondary-media-source',
  ...(tertiaryMediaSourceItem ? ['cleanup-tertiary-media-source'] : []),
])
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
assert.equal(coordinatedFinalComposition.evidence.dependencyStreamInputVerified, true)
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
const privateFinalDownloadBytes = await readExactPrivateStream(
  await privateFinalDownload.openStream(),
  privateFinalDownload.byteSize,
)
assert.equal(
  createHash('sha256').update(privateFinalDownloadBytes).digest('hex'),
  coordinatedFinalComposition.result.sha256,
)
const finalColorContinuity = analyzeRenderedColorContinuity(
  privateFinalDownloadBytes,
  tertiaryMediaSourceItem ? [12, 36, 60] : [12, 36],
)
assert.equal(finalColorContinuity.sampledFrameCount, tertiaryMediaSourceItem ? 3 : 2)
assert.ok(
  finalColorContinuity.chromaticityDelta <= 0.12,
  `Reference-matched final source boundary exceeded chromaticity tolerance: ${
    JSON.stringify(finalColorContinuity)
  }`,
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
if (multiSourceSliceOnly) {
  assert.ok(tertiaryMediaSourceItem)
  assert.equal(finalCompositionExecutionWorkItem.sourceSequenceItemIds.length, 3)
  console.log(JSON.stringify({
    smoke: 'canonical_multi_source_final_composition',
    status: 'passed',
    sourceSequenceItemIds: finalCompositionExecutionWorkItem.sourceSequenceItemIds,
    compositionProfileId: approvedFinalCompositionPayload.compositionProfileId,
    proofs: [
      'persisted_planning_handoff_and_immutable_approved_snapshot_verified',
      'synthetic_private_test_credit_reservation_verified_without_customer_charge',
      'three_source_trim_authority_and_dependency_readiness_verified',
      'two_exact_caption_artifacts_and_frame_ranges_verified',
      'three_source_bound_ffmpeg_voice_delivery_artifacts_qa_reconciliation_and_replay_verified',
      'one_reference_and_two_direct_dependency_bound_color_match_artifacts_verified',
      'three_color_intermediates_composed_in_source_order_with_objective_boundary_continuity_verified',
      'lease_and_single_use_dispatch_verified',
      'exact_ordered_source_sequence_and_timed_caption_track_rendered_with_approved_voice_replacement',
      'approved_hard_cut_snapshot_authority_and_exact_source_boundary_execution_verified',
      'private_artifact_persistence_and_independent_final_ffprobe_qa_verified',
      'artifact_reconciliation_idempotent_replay_and_private_download_verified',
      'provider_billing_public_delivery_and_production_readiness_remain_false',
    ],
  }))
  process.exit(0)
}
const terminalReviewEditSessionId = `${editSessionId}-terminal-review`
const terminalReviewPlanningInput = await prepareExactPlanningAuthority(
  seedSnapshot.projectId,
  terminalReviewEditSessionId,
)
const terminalReviewPlanBody = createDispatchPlanBody({
  ...dispatchPlanInput,
  targetEditSessionId: terminalReviewEditSessionId,
  planningInputAuthority: terminalReviewPlanningInput,
})
terminalReviewPlanBody.planningRequestId = 'planning-terminal-private-review'
const terminalReviewWorkItemKeys = new Set([
  'snapshot-validation-root',
  'source-trim-validation',
  'libass-caption-overlay-root',
  'libass-caption-overlay-second',
  'voice-delivery-primary',
  'voice-delivery-secondary',
  'color-delivery-primary',
  'color-delivery-secondary',
  'remotion-source-caption-final',
  'final-qa',
])
const terminalReviewRequiredJobCount = 10
assert.equal(terminalReviewWorkItemKeys.size, terminalReviewRequiredJobCount)
terminalReviewPlanBody.canonicalPlan.workItems = terminalReviewPlanBody.canonicalPlan.workItems.filter((workItem) =>
  terminalReviewWorkItemKeys.has(workItem.workItemKey))
const terminalReviewPlanningHandoff = await preparePersistedPlanningHandoff(
  planningHandoffService,
  terminalReviewPlanBody,
  seedSnapshot.projectId,
  terminalReviewEditSessionId,
)
const terminalReviewPublished = await planningHandoffService.publishFromPersistedHandoff({
  ...planningHandoffPublicationBody(
    terminalReviewPlanBody,
    terminalReviewPlanningHandoff.handoffHash,
  ),
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
  handoffId: terminalReviewPlanningHandoff.handoffId,
  idempotencyKey: 'publish-terminal-private-review-canonical-plan',
})
const terminalReviewPublishedAuthority = asRecord(terminalReviewPublished.authority)
const terminalReviewPublishedPlan = asRecord(terminalReviewPublishedAuthority.plan)
const terminalReviewPublishedEstimate = asRecord(terminalReviewPublishedAuthority.estimate)
assert.equal(
  asRecord(terminalReviewPublishedPlan.componentRefs).planningHandoffAuthority !== undefined,
  true,
)
const terminalReviewApproved = await planningService.approveAndFundCanonicalPlan({
  workspaceId,
  editPlanId: String(terminalReviewPublishedPlan.id),
  expectedAuthorityRevision: Number(terminalReviewPublishedAuthority.authorityRevision),
  expectedPlanHash: String(terminalReviewPublishedPlan.planHash),
  expectedEstimateHash: String(terminalReviewPublishedEstimate.estimateHash),
  idempotencyKey: 'approve-terminal-private-review-canonical-plan',
})
const terminalReviewApprovedSnapshot = asRecord(asRecord(terminalReviewApproved.authority).snapshot)
assert.deepEqual(
  asRecord(terminalReviewApprovedSnapshot.componentRefs).planningHandoffAuthority,
  asRecord(terminalReviewPublishedPlan.componentRefs).planningHandoffAuthority,
)
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
assert.equal(terminalWorkGraph.summary.totalJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalWorkGraph.summary.completedJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalWorkGraph.summary.requiredBlockedJobCount, 0)
assert.equal(terminalWorkGraph.summary.allRequiredJobsCompleted, true)
assert.equal(terminalWorkGraph.schemaVersion, 'canonical-private-work-graph-run-response-v3')
assert.ok(terminalWorkGraph.queue)
assert.equal(terminalWorkGraph.queue.totalJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalWorkGraph.queue.completedJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalWorkGraph.queue.queuedJobCount, 0)
assert.equal(terminalWorkGraph.queue.leasedJobCount, 0)
assert.equal(terminalWorkGraph.queue.recoveredCompletedJobCount, 0)
assert.equal(terminalWorkGraph.queue.claimedJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalWorkGraph.queue.claimCompletionCount, terminalReviewRequiredJobCount)
assert.equal(terminalWorkGraph.queue.claimReleaseCount, 0)
assert.equal(terminalWorkGraph.queue.hostRestartRecoveryAvailable, true)
assert.equal(terminalWorkGraph.queue.completedJobReplayWithoutExecution, true)
assert.equal(terminalWorkGraph.queue.plaintextClaimCredentialsPersisted, false)
assert.equal(terminalWorkGraph.queue.claimCredentialDigestsPersisted, true)
assert.equal(terminalWorkGraph.queue.browserClaimAllowed, false)
assert.equal(terminalWorkGraph.queue.crossProcessAtomicClaimProven, true)
assert.equal(terminalWorkGraph.queue.distributedTransactionProven, false)
assert.equal(terminalWorkGraph.queue.cloudServiceIdentityVerified, false)
assert.equal(terminalWorkGraph.queue.cloudDispatchAuthorized, false)
assert.equal(terminalWorkGraph.queue.productionAuthority, false)
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
assert.equal(terminalWorkGraphReplay.summary.completedJobCount, terminalReviewRequiredJobCount)
const terminalCompletionService = createCanonicalPrivateWorkGraphOrchestratorService({
  ...context,
  requestId: 'canonical-work-graph-completion-fresh-service',
})
const terminalWorkGraphCompletion = await terminalCompletionService.findRequiredCompletion({
  workspaceId,
  packageRecordId: terminalReviewPackageRecordId,
})
assert.ok(terminalWorkGraphCompletion)
assert.equal(terminalWorkGraphCompletion.responseHash, terminalWorkGraph.responseHash)
assert.equal(terminalWorkGraphCompletion.status, 'completed_private_test_work_graph')
assert.equal(terminalWorkGraphCompletion.completedJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalWorkGraphCompletion.requiredBlockedJobCount, 0)
assert.equal(terminalWorkGraphCompletion.allRequiredJobsCompleted, true)
const terminalWorkGraphProgress = await terminalCompletionService.findLatestProgress({
  workspaceId,
  packageRecordId: terminalReviewPackageRecordId,
})
assert.ok(terminalWorkGraphProgress)
assert.equal(terminalWorkGraphProgress.status, 'completed_private_test_work_graph')
assert.equal(terminalWorkGraphProgress.runFinished, true)
assert.equal(terminalWorkGraphProgress.totalJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalWorkGraphProgress.completedJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalWorkGraphProgress.pendingJobCount, 0)
assert.equal(terminalWorkGraphProgress.requiredIncompleteJobCount, 0)
assert.equal(
  terminalWorkGraphProgress.nextRequiredGate,
  'canonical_terminal_private_review_assembly',
)
const terminalWorkGraphSecondKey = await createCanonicalPrivateWorkGraphOrchestratorService(context).run({
  workspaceId,
  packageRecordId: terminalReviewPackageRecordId,
  purpose: 'run_canonical_private_work_graph',
  idempotencyKey: 'run-terminal-private-review-canonical-graph-second-key',
})
assert.equal(terminalWorkGraphSecondKey.summary.allRequiredJobsCompleted, true)
assert.equal(terminalWorkGraphSecondKey.summary.replayedJobCount, terminalReviewRequiredJobCount)
assert.ok(terminalWorkGraphSecondKey.queue)
assert.equal(
  terminalWorkGraphSecondKey.queue.definitionHash,
  terminalWorkGraph.queue.definitionHash,
)
assert.equal(
  terminalWorkGraphSecondKey.queue.aggregateHash,
  terminalWorkGraph.queue.aggregateHash,
)
assert.equal(
  terminalWorkGraphSecondKey.queue.recoveredCompletedJobCount,
  terminalReviewRequiredJobCount,
)
assert.equal(terminalWorkGraphSecondKey.queue.claimedJobCount, 0)
assert.equal(terminalWorkGraphSecondKey.queue.claimCompletionCount, 0)
assert.equal(terminalWorkGraphSecondKey.queue.claimReleaseCount, 0)
assert.equal(terminalWorkGraphSecondKey.scheduling?.actualExecutionCount, 0)
assert.notEqual(terminalWorkGraphSecondKey.responseHash, terminalWorkGraph.responseHash)
const terminalWorkGraphProgressAfterSecondKey = await terminalCompletionService.findLatestProgress({
  workspaceId,
  packageRecordId: terminalReviewPackageRecordId,
})
assert.ok(terminalWorkGraphProgressAfterSecondKey)
assert.equal(
  terminalWorkGraphProgressAfterSecondKey.checkpointHash,
  terminalWorkGraphProgress.checkpointHash,
)
assert.equal(
  terminalWorkGraphProgressAfterSecondKey.checkpointSequence,
  terminalWorkGraphProgress.checkpointSequence,
)
assert.equal(
  (await terminalCompletionService.findRequiredCompletion({
    workspaceId,
    packageRecordId: terminalReviewPackageRecordId,
  }))?.responseHash,
  terminalWorkGraph.responseHash,
)
const terminalCompletionPath = workGraphPackageCompletionPath(
  userId,
  workspaceId,
  terminalReviewPackageRecordId,
)
const originalTerminalCompletion = await readFile(terminalCompletionPath, 'utf8')
const tamperedTerminalCompletion = JSON.parse(originalTerminalCompletion) as {
  response: { responseHash: string }
}
tamperedTerminalCompletion.response.responseHash = '0'.repeat(64)
try {
  await writeFile(terminalCompletionPath, `${JSON.stringify(tamperedTerminalCompletion)}\n`)
  await expectApiError(
    () => terminalCompletionService.findRequiredCompletion({
      workspaceId,
      packageRecordId: terminalReviewPackageRecordId,
    }),
    'VALIDATION_FAILED',
  )
} finally {
  await writeFile(terminalCompletionPath, originalTerminalCompletion)
}
assert.equal(
  (await terminalCompletionService.findRequiredCompletion({
    workspaceId,
    packageRecordId: terminalReviewPackageRecordId,
  }))?.responseHash,
  terminalWorkGraph.responseHash,
)
const terminalAssemblyRequiredJourney = await createCanonicalEditJourneyService({
  ...context,
  requestId: 'canonical-journey-completion-fresh-service',
}).recover({
  workspaceId,
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
})
assert.equal(terminalAssemblyRequiredJourney.stage, 'private_review_assembly_required')
assert.equal(terminalAssemblyRequiredJourney.nextAction.code, 'prepare_private_edit_review')
assert.equal(
  terminalAssemblyRequiredJourney.nextAction.routeTemplate,
  `/v1/edit-executions/packages/${terminalReviewPackageRecordId}/canonical-private-edit-preparation`,
)
assert.equal(
  terminalAssemblyRequiredJourney.workGraph?.responseHash,
  terminalWorkGraph.responseHash,
)
assert.equal(terminalAssemblyRequiredJourney.workGraph?.totalJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalAssemblyRequiredJourney.workGraph?.allRequiredJobsCompleted, true)
assert.equal(terminalAssemblyRequiredJourney.workGraphProgress, undefined)
assert.equal(terminalAssemblyRequiredJourney.review, undefined)
assert.equal('jobs' in (terminalAssemblyRequiredJourney.workGraph ?? {}), false)
assert.equal(canonicalEditJourneyResponseSchema.safeParse({
  ...terminalAssemblyRequiredJourney,
  workGraph: {
    ...terminalAssemblyRequiredJourney.workGraph!,
    packageRecordId: 'foreign-package',
  },
}).success, false)

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
const terminalPreparation = await createCanonicalPrivateEditPreparationCoordinatorService(
  context,
).prepare({
  workspaceId,
  expectedProjectId: String(seedSnapshot.projectId),
  expectedEditSessionId: terminalReviewEditSessionId,
  expectedSnapshotId: String(terminalReviewApprovedSnapshot.snapshotId),
  expectedSnapshotHash: String(terminalReviewApprovedSnapshot.snapshotHash),
  expectedPackageHash:
    terminalReviewPackage.approvedEditExecutionPackage.packageHash,
  purpose: 'prepare_canonical_private_edit_review',
  packageRecordId: terminalReviewPackageRecordId,
  idempotencyKey: 'coordinate-terminal-private-review',
})
assert.equal(terminalPreparation.receipt.disposition, 'private_review_ready')
assert.equal(terminalPreparation.receipt.identity.packageRecordId, terminalReviewPackageRecordId)
assert.equal(
  terminalPreparation.receipt.authority.packageHash,
  terminalReviewPackage.approvedEditExecutionPackage.packageHash,
)
assert.equal(terminalPreparation.receipt.progress.totalJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalPreparation.receipt.progress.completedJobCount, terminalReviewRequiredJobCount)
assert.equal(terminalPreparation.receipt.progress.allRequiredJobsCompleted, true)
assert.ok(terminalPreparation.receipt.review)
assert.equal(terminalPreparation.receipt.review.readyForPrivateReview, true)
assert.equal(terminalPreparation.receipt.boundaries.browserSuppliedJobsAccepted, false)
assert.equal(terminalPreparation.receipt.boundaries.browserSuppliedToolsAccepted, false)
assert.equal(terminalPreparation.receipt.boundaries.jobOrToolDetailsReturned, false)
assert.equal(terminalPreparation.receipt.boundaries.filesystemPathReturned, false)
assert.equal(terminalPreparation.receipt.boundaries.credentialReturned, false)
assert.equal(terminalPreparation.receipt.boundaries.providerCallStarted, false)
assert.equal(terminalPreparation.receipt.boundaries.productionRenderStarted, false)
assert.equal(terminalPreparation.receipt.boundaries.customerCreditMutation, false)
assert.equal(terminalPreparation.receipt.boundaries.billingStarted, false)
await expectApiError(
  () => createCanonicalPrivateEditPreparationCoordinatorService(context).prepare({
    workspaceId,
    expectedProjectId: String(seedSnapshot.projectId),
    expectedEditSessionId: terminalReviewEditSessionId,
    expectedSnapshotId: String(terminalReviewApprovedSnapshot.snapshotId),
    expectedSnapshotHash: String(terminalReviewApprovedSnapshot.snapshotHash),
    expectedPackageHash: '0'.repeat(64),
    purpose: 'prepare_canonical_private_edit_review',
    packageRecordId: terminalReviewPackageRecordId,
    idempotencyKey: 'coordinate-terminal-private-review-wrong-package-hash',
  }),
  'IDEMPOTENCY_CONFLICT',
)
const terminalPrivateReviewInput = {
  workspaceId,
  packageRecordId: terminalReviewPackageRecordId,
  purpose: 'assemble_canonical_private_review' as const,
  idempotencyKey: 'assemble-terminal-private-review',
}
const terminalPrivateReview = await privateReviewService.assemble(terminalPrivateReviewInput)
assert.equal(terminalPrivateReview.status, 'ready_for_private_internal_review')
assert.equal(terminalPrivateReview.requiredExecution.requiredJobCount, terminalReviewRequiredJobCount)
assert.equal(
  terminalPrivateReview.requiredExecution.requiredExpectedAssetCount,
  terminalReviewRequiredJobCount,
)
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
const terminalPrivateReviewJourney = await canonicalJourneyService.recover({
  workspaceId,
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
})
assert.equal(terminalPrivateReviewJourney.stage, 'private_review_ready')
assert.equal(terminalPrivateReviewJourney.nextAction.code, 'record_private_review_decision')
assert.equal(
  terminalPrivateReviewJourney.execution?.packageRecordId,
  terminalReviewPackageRecordId,
)
assert.equal(
  terminalPrivateReviewJourney.review?.reviewAssemblyId,
  terminalPrivateReview.identity.reviewAssemblyId,
)
assert.equal(
  terminalPrivateReviewJourney.review?.manifestSha256,
  terminalPrivateReview.manifest.manifestSha256,
)
assert.equal(
  terminalPrivateReviewJourney.review?.finalArtifactSha256,
  terminalPrivateReview.finalArtifact.sha256,
)
const terminalPrivateReviewMedia = await createCanonicalPrivateReviewMediaService(
  context,
).read({
  workspaceId,
  expectedProjectId: String(seedSnapshot.projectId),
  expectedEditSessionId: terminalReviewEditSessionId,
  packageRecordId: terminalReviewPackageRecordId,
  expectedManifestSha256: terminalPrivateReview.manifest.manifestSha256,
  expectedFinalArtifactSha256: terminalPrivateReview.finalArtifact.sha256,
  purpose: 'read_canonical_private_review_media',
  reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
})
assert.equal(
  terminalPrivateReviewMedia.identity.reviewAssemblyId,
  terminalPrivateReview.identity.reviewAssemblyId,
)
assert.equal(terminalPrivateReviewMedia.mimeType, 'video/mp4')
assert.equal(
  terminalPrivateReviewMedia.finalArtifactSha256,
  terminalPrivateReview.finalArtifact.sha256,
)
assert.equal(
  createHash('sha256').update(await readExactPrivateStream(
    await terminalPrivateReviewMedia.openStream(),
    terminalPrivateReviewMedia.byteSize,
  )).digest('hex'),
  terminalPrivateReview.finalArtifact.sha256,
)
assert.equal(terminalPrivateReviewMedia.publicUrlCreated, false)
assert.equal(terminalPrivateReviewMedia.signedUrlCreated, false)
await expectApiError(
  () => createCanonicalPrivateReviewMediaService(context).read({
    workspaceId,
    expectedProjectId: String(seedSnapshot.projectId),
    expectedEditSessionId: terminalReviewEditSessionId,
    packageRecordId: terminalReviewPackageRecordId,
    expectedManifestSha256: '0'.repeat(64),
    expectedFinalArtifactSha256: terminalPrivateReview.finalArtifact.sha256,
    purpose: 'read_canonical_private_review_media',
    reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
  }),
  'IDEMPOTENCY_CONFLICT',
)
assert.equal(
  terminalPrivateReviewJourney.workGraph?.responseHash,
  terminalWorkGraph.responseHash,
)
assert.equal(terminalPrivateReviewJourney.review?.decision, undefined)
assert.equal(terminalPrivateReviewJourney.permissions.inspectionOnly, true)
assert.equal(terminalPrivateReviewJourney.permissions.toolExecution, false)
assert.equal(terminalPrivateReviewJourney.permissions.render, false)
assert.equal(canonicalEditJourneyResponseSchema.safeParse({
  ...terminalPrivateReviewJourney,
  review: {
    ...terminalPrivateReviewJourney.review!,
    decision: 'accept_private_internal_review',
    decisionStatus: 'private_internal_review_accepted',
  },
}).success, false)
const reviewDecisionAuthorityBefore = sha256AuthorityValue(
  snapshotAuthoritySlice(
    await requireEditAuthority(workspaceId),
    terminalPrivateReview.identity.approvedPlanSnapshotId,
  ),
)
const privateReviewDecisionService = createCanonicalPrivateReviewDecisionService(context)
const privateReviewDecisionCoordinatorService =
  createCanonicalPrivateReviewDecisionCoordinatorService(context)
await expectApiError(
  () => privateReviewDecisionCoordinatorService.record({
    workspaceId,
    expectedProjectId: 'project-foreign-private-review-decision',
    expectedEditSessionId: terminalReviewEditSessionId,
    packageRecordId: terminalReviewPackageRecordId,
    reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
    expectedManifestSha256: terminalPrivateReview.manifest.manifestSha256,
    expectedFinalArtifactSha256: terminalPrivateReview.finalArtifact.sha256,
    purpose: 'record_canonical_private_review_decision',
    decision: 'accept_private_internal_review',
    idempotencyKey: 'reject-foreign-project-before-private-review-decision',
  }),
  'IDEMPOTENCY_CONFLICT',
)
await expectApiError(
  () => privateReviewDecisionService.getCompleted({
    workspaceId,
    reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
  }),
  'JOB_DEPENDENCY_NOT_READY',
)
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
const terminalPrivateRevisionDecisionReceipt = await privateReviewDecisionCoordinatorService.record({
  workspaceId,
  expectedProjectId: String(seedSnapshot.projectId),
  expectedEditSessionId: terminalReviewEditSessionId,
  packageRecordId: terminalReviewPackageRecordId,
  reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
  expectedManifestSha256: terminalPrivateReview.manifest.manifestSha256,
  expectedFinalArtifactSha256: terminalPrivateReview.finalArtifact.sha256,
  purpose: 'record_canonical_private_review_decision',
  decision: 'request_revision',
  revisionIntent: terminalPrivateRevisionDecisionInput.revisionIntent,
  idempotencyKey: 'coordinate-terminal-private-review-revision-decision',
})
assert.equal(
  terminalPrivateRevisionDecisionReceipt.receipt.decision.value,
  'request_revision',
)
assert.equal(
  terminalPrivateRevisionDecisionReceipt.receipt.decision.requiresReplanning,
  true,
)
assert.equal(
  terminalPrivateRevisionDecisionReceipt.receipt.decision.requiresFreshEstimateAndApproval,
  true,
)
assert.equal(
  terminalPrivateRevisionDecisionReceipt.receipt.boundaries.rawDecisionAuthorityReturned,
  false,
)
assert.equal(
  terminalPrivateRevisionDecisionReceipt.receipt.boundaries.artifactIdentityReturned,
  false,
)
assert.equal(
  terminalPrivateRevisionDecisionReceipt.receipt.boundaries.customerCreditMutation,
  false,
)
assert.equal(
  JSON.stringify(terminalPrivateRevisionDecisionReceipt.receipt).includes('"artifactId":'),
  false,
)
const terminalRevisionJourney = await canonicalJourneyService.recover({
  workspaceId,
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
})
assert.equal(terminalRevisionJourney.stage, 'revision_requested')
assert.equal(terminalRevisionJourney.nextAction.code, 'prepare_replacement_plan')
assert.equal(terminalRevisionJourney.review?.decision, 'request_revision')
assert.equal(terminalRevisionJourney.review?.decisionStatus, 'canonical_revision_requested')
assert.equal(
  terminalRevisionJourney.review?.decisionManifestSha256,
  terminalPrivateRevisionDecision.manifest.manifestSha256,
)
const terminalRevisionHistoryDescriptor =
  terminalRevisionJourney.review?.privateHistoryDownload
assert.ok(terminalRevisionHistoryDescriptor)
assert.equal(terminalRevisionHistoryDescriptor.method, 'GET')
assert.equal(
  terminalRevisionHistoryDescriptor.routeTemplate,
  `/v1/edit-executions/private-review-history/${terminalPrivateReview.identity.reviewAssemblyId}/file`,
)
assert.equal(
  terminalRevisionHistoryDescriptor.query.expectedDecisionManifestSha256,
  terminalPrivateRevisionDecision.manifest.manifestSha256,
)
assert.equal(
  terminalRevisionHistoryDescriptor.query.expectedFinalArtifactSha256,
  terminalPrivateReview.finalArtifact.sha256,
)
assert.equal(terminalRevisionJourney.permissions.snapshotMutation, false)
assert.equal(terminalRevisionJourney.permissions.creditMutation, false)
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
const priorSnapshotSlice = snapshotAuthoritySlice(
  authorityBeforeReplacementPlan,
  terminalPrivateReview.identity.approvedPlanSnapshotId,
)
const priorSnapshotSliceHash = sha256AuthorityValue(priorSnapshotSlice)
const priorSnapshotManifestHash = sha256AuthorityValue(priorSnapshotSlice.snapshot)
const priorApprovedWorkItemsHash = sha256AuthorityValue(priorSnapshotSlice.approvedWorkItems)
const priorJobsHash = sha256AuthorityValue(priorSnapshotSlice.jobs)
const walletBeforeReplacementPlan = sha256AuthorityValue(authorityBeforeReplacementPlan.wallet)
const reservationCountBeforeReplacementPlan = authorityBeforeReplacementPlan.reservations.length
const jobsBeforeReplacementPlan = authorityBeforeReplacementPlan.jobs.length
const packagesBeforeReplacementPlan = authorityBeforeReplacementPlan.executionPackages.length
const replacementPlanBody = createDispatchPlanBody({
  ...dispatchPlanInput,
  targetEditSessionId: terminalReviewEditSessionId,
  planningInputAuthority: terminalReviewPlanningInput,
})
replacementPlanBody.planningRequestId = 'planning-terminal-private-review-revision-v2'
replacementPlanBody.canonicalPlan.workItems = replacementPlanBody.canonicalPlan.workItems.filter((workItem) =>
  terminalReviewWorkItemKeys.has(workItem.workItemKey))
const browserReplacementPlanCandidate = structuredClone(
  replacementPlanBody.canonicalPlan,
)
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
const lockedPreferenceBeforeReplacementHandoff = await createExactEditPreferenceService(context)
  .getCurrent(workspaceId, seedSnapshot.projectId, terminalReviewEditSessionId)
assert.ok(lockedPreferenceBeforeReplacementHandoff.preferenceRecord)
assert.equal(lockedPreferenceBeforeReplacementHandoff.preferenceRecord.lifecycle.locked, true)
const changedLockedEvidencePlanBody = structuredClone(replacementPlanBody)
changedLockedEvidencePlanBody.canonicalPlan.components.sourceCleanupPlan.decisions[0]!.reason =
  'Attempt to replace already verified source evidence while the approved lifecycle is locked.'
await expectApiError(
  () => preparePersistedPlanningHandoff(
    planningHandoffService,
    changedLockedEvidencePlanBody,
    seedSnapshot.projectId,
    terminalReviewEditSessionId,
  ),
  'PLAN_NOT_APPROVED',
)
const lockedPreferenceAfterRejectedEvidence = await createExactEditPreferenceService(context)
  .getCurrent(workspaceId, seedSnapshot.projectId, terminalReviewEditSessionId)
assert.equal(
  lockedPreferenceAfterRejectedEvidence.preferenceRecord?.recordRevision,
  lockedPreferenceBeforeReplacementHandoff.preferenceRecord.recordRevision,
)
const replacementPlanningHandoff = await preparePersistedPlanningHandoff(
  planningHandoffService,
  replacementPlanBody,
  seedSnapshot.projectId,
  terminalReviewEditSessionId,
)
assert.notEqual(replacementPlanningHandoff.handoffId, terminalReviewPlanningHandoff.handoffId)
const lockedPreferenceAfterReplacementHandoff = await createExactEditPreferenceService(context)
  .getCurrent(workspaceId, seedSnapshot.projectId, terminalReviewEditSessionId)
assert.equal(lockedPreferenceAfterReplacementHandoff.preferenceRecord?.lifecycle.locked, true)
assert.equal(
  lockedPreferenceAfterReplacementHandoff.preferenceRecord?.recordRevision,
  lockedPreferenceBeforeReplacementHandoff.preferenceRecord.recordRevision,
  'An exact Chat-led revision handoff must reuse locked preference evidence without mutating it.',
)
await expectApiError(
  () => planningHandoffService.publishFromPersistedHandoff({
    ...planningHandoffPublicationBody(
      replacementPlanBody,
      replacementPlanningHandoff.handoffHash,
    ),
    revisionAuthority: {
      ...replacementPlanBody.revisionAuthority!,
      decisionManifestSha256: '0'.repeat(64),
    },
    projectId: seedSnapshot.projectId,
    editSessionId: terminalReviewEditSessionId,
    handoffId: replacementPlanningHandoff.handoffId,
    idempotencyKey: 'reject-stale-terminal-revision-plan-authority',
  }),
  'IDEMPOTENCY_CONFLICT',
)
const replacementPlanPresentationService =
  createCanonicalRevisionPlanPresentationCoordinatorService(context)
const replacementPlanPresentationInput = {
  workspaceId,
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
  expectedPackageRecordId: terminalReviewPackageRecordId,
  expectedReviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
  expectedDecisionManifestSha256:
    terminalPrivateRevisionDecision.manifest.manifestSha256,
  expectedFinalArtifactSha256: terminalPrivateReview.finalArtifact.sha256,
  purpose: 'present_canonical_revision_plan',
  orderedSourceItems: browserReplacementPlanCandidate.components.sourceSequence.map(
    (item) => ({
      sourceSequenceItemId: item.sourceSequenceItemId,
      mediaAssetId: item.mediaAssetId,
      uploadedOrder: item.uploadedOrder,
      checksumSha256: requireSha256(item.checksumSha256),
      required: item.required,
    }),
  ),
  canonicalPlan: browserReplacementPlanCandidate,
  idempotencyKey: 'present-terminal-private-review-revision-v2',
} as const
await expectApiError(
  () => replacementPlanPresentationService.present({
    ...replacementPlanPresentationInput,
    canonicalPlan: replacementPlanBody.canonicalPlan,
    idempotencyKey: 'reject-browser-injected-revision-authority',
  }),
  'VALIDATION_FAILED',
)
const replacementPlanPresentation = await replacementPlanPresentationService.present(
  replacementPlanPresentationInput,
)
assert.equal(
  replacementPlanPresentation.receipt.replacementPlan.planVersion,
  2,
)
assert.equal(
  replacementPlanPresentation.receipt.replacementPlan.freshApprovalRequired,
  true,
)
assert.equal(
  replacementPlanPresentation.receipt.authority
    .lockedPreferenceEvidenceReusedWithoutMutation,
  true,
)
assert.equal(
  replacementPlanPresentation.receipt.rawRevisionAuthorityReturned,
  false,
)
assert.equal(replacementPlanPresentation.receipt.boundaries.snapshotCreated, false)
assert.equal(
  replacementPlanPresentation.receipt.boundaries.creditReservationMutated,
  false,
)
const replacementPlanPublished = await planningService.getCanonicalPlan(
  replacementPlanPresentation.receipt.replacementPlan.planId,
  workspaceId,
)
const replacementPlanAuthority = asRecord(replacementPlanPublished.authority)
const replacementPlan = asRecord(replacementPlanAuthority.plan)
const replacementEstimate = asRecord(replacementPlanAuthority.estimate)
assert.equal(replacementPlan.planVersion, 2)
assert.equal(replacementPlan.status, 'presented')
assert.equal(asRecord(replacementPlan.revisionAuthority).reviewDecisionId,
  terminalPrivateRevisionDecision.identity.reviewDecisionId)
assert.equal(asRecord(replacementPlan.componentRefs).revisionAuthority !== undefined, true)
assert.equal(asRecord(replacementPlan.componentRefs).planningHandoffAuthority !== undefined, true)
assert.notEqual(replacementPlan.id, terminalPrivateRevisionDecision.authority.approvedPlanId)
assert.equal(replacementEstimate.status, 'presented')
assert.notEqual(replacementEstimate.id, terminalReviewPublishedEstimate.id)
const replacementPlanReplay = await replacementPlanPresentationService.present({
  ...replacementPlanPresentationInput,
  idempotencyKey: 'present-terminal-private-review-revision-v2',
})
assert.equal(
  replacementPlanReplay.receipt.replacementPlan.planId,
  replacementPlan.id,
)
assert.equal(replacementPlanReplay.receipt.replayed, true)
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
const replacementApprovalInput = {
  workspaceId,
  editPlanId: String(replacementPlan.id),
  expectedAuthorityRevision: Number(replacementPlanAuthority.authorityRevision),
  expectedPlanHash: String(replacementPlan.planHash),
  expectedEstimateHash: String(replacementEstimate.estimateHash),
  idempotencyKey: 'approve-terminal-revision-plan-with-atomic-reconciliation',
}
const replacementApproved = await planningService.approveAndFundCanonicalPlan(replacementApprovalInput)
const replacementApprovalAuthority = asRecord(replacementApproved.authority)
const replacementSnapshot = asRecord(replacementApprovalAuthority.snapshot)
const replacementReservation = asRecord(replacementApprovalAuthority.reservation)
const replacementReconciliation = asRecord(replacementApprovalAuthority.revisionReconciliation)
assert.equal(replacementSnapshot.planVersion, 2)
assert.equal(replacementSnapshot.planId, replacementPlan.id)
assert.deepEqual(
  asRecord(replacementSnapshot.componentRefs).planningHandoffAuthority,
  asRecord(replacementPlan.componentRefs).planningHandoffAuthority,
)
const replacementExecutionAuthority = await planningService.loadApprovedExecutionAuthority(
  String(replacementSnapshot.snapshotId),
  workspaceId,
)
assert.equal(
  replacementExecutionAuthority.planningHandoffAuthority?.handoffId,
  replacementPlanningHandoff.handoffId,
)
assert.equal(
  replacementExecutionAuthority.planningHandoffAuthority?.handoffHash,
  replacementPlanningHandoff.handoffHash,
)
assert.equal(replacementReservation.status, 'reserved')
assert.equal(replacementReconciliation.priorSnapshotId,
  terminalPrivateReview.identity.approvedPlanSnapshotId)
assert.equal(replacementReconciliation.atomicSyntheticReconciliation, true)
assert.equal(replacementReconciliation.customerWalletMutation, false)
assert.equal(replacementReconciliation.billingExecuted, false)
assert.equal(replacementReconciliation.newSnapshotId, replacementSnapshot.snapshotId)
assert.equal(replacementReconciliation.newReservationId, replacementReservation.id)
assert.ok(Number(replacementReconciliation.releasedCredits) > 0)
assert.equal(
  replacementReconciliation.newlyReservedCredits,
  replacementEstimate.approvedMaximumCredits,
)
const authorityAfterReplacementApproval = await requireEditAuthority(workspaceId)
const priorSliceAfterApproval = snapshotAuthoritySlice(
  authorityAfterReplacementApproval,
  terminalPrivateReview.identity.approvedPlanSnapshotId,
)
assert.equal(sha256AuthorityValue(priorSliceAfterApproval.snapshot), priorSnapshotManifestHash)
assert.equal(sha256AuthorityValue(priorSliceAfterApproval.approvedWorkItems), priorApprovedWorkItemsHash)
assert.equal(sha256AuthorityValue(priorSliceAfterApproval.jobs), priorJobsHash)
assert.equal(priorSliceAfterApproval.plan?.status, 'superseded')
assert.equal(priorSliceAfterApproval.estimate?.status, 'superseded')
assert.equal(priorSliceAfterApproval.reservation?.status, 'released')
assert.equal(
  authorityAfterReplacementApproval.wallet.fundedCredits,
  authorityAfterReplacementApproval.wallet.availableCredits +
    authorityAfterReplacementApproval.wallet.reservedCredits +
    authorityAfterReplacementApproval.wallet.spentCredits,
)
assert.equal(authorityAfterReplacementApproval.reservations.length, reservationCountBeforeReplacementPlan + 1)
assert.equal(
  authorityAfterReplacementApproval.jobs.length,
  jobsBeforeReplacementPlan + replacementPlanBody.canonicalPlan.workItems.length,
)
assert.equal(authorityAfterReplacementApproval.executionPackages.length, packagesBeforeReplacementPlan)
const ledgerCountAfterReplacementApproval = authorityAfterReplacementApproval.ledgerEntries.length
const replacementApprovalReplay = await planningService.approveAndFundCanonicalPlan(replacementApprovalInput)
assert.equal(
  asRecord(asRecord(replacementApprovalReplay.authority).snapshot).snapshotId,
  replacementSnapshot.snapshotId,
)
assert.equal(
  (await requireEditAuthority(workspaceId)).ledgerEntries.length,
  ledgerCountAfterReplacementApproval,
)
const revisionExecutionPackage = await createCanonicalEditExecutionPackageService(context).createPackage({
  workspaceId,
  approvedPlanSnapshotId: String(replacementSnapshot.snapshotId),
  expectedSnapshotHash: String(replacementSnapshot.snapshotHash),
  purpose: 'private_internal_execution_handoff',
  idempotencyKey: 'package-terminal-private-review-revision-v2',
})
const revisionExecutionPackageId = revisionExecutionPackage.approvedEditExecutionPackage.packageRecordId
assert.notEqual(revisionExecutionPackageId, terminalReviewPackageRecordId)
assert.equal(
  revisionExecutionPackage.approvedEditExecutionPackage.jobs.length,
  terminalReviewRequiredJobCount,
)
const revisionWorkGraph = await createCanonicalPrivateWorkGraphOrchestratorService(context).run({
  workspaceId,
  packageRecordId: revisionExecutionPackageId,
  purpose: 'run_canonical_private_work_graph',
  idempotencyKey: 'run-terminal-private-review-revision-v2',
})
assert.equal(revisionWorkGraph.status, 'completed_private_test_work_graph')
assert.equal(revisionWorkGraph.summary.totalJobCount, terminalReviewRequiredJobCount)
assert.equal(revisionWorkGraph.summary.completedJobCount, terminalReviewRequiredJobCount)
assert.equal(revisionWorkGraph.summary.requiredBlockedJobCount, 0)
assert.equal(revisionWorkGraph.summary.allRequiredJobsCompleted, true)
assert.equal(revisionWorkGraph.readiness.nextRequiredGate, 'canonical_terminal_private_review_assembly')
const revisionWorkGraphReplay = await createCanonicalPrivateWorkGraphOrchestratorService(context).run({
  workspaceId,
  packageRecordId: revisionExecutionPackageId,
  purpose: 'run_canonical_private_work_graph',
  idempotencyKey: 'run-terminal-private-review-revision-v2',
})
assert.equal(revisionWorkGraphReplay.evidence.idempotentRunReplay, true)
const secondPrivateReview = await privateReviewService.assemble({
  workspaceId,
  packageRecordId: revisionExecutionPackageId,
  purpose: 'assemble_canonical_private_review',
  idempotencyKey: 'assemble-terminal-private-review-revision-v2',
})
assert.equal(secondPrivateReview.status, 'ready_for_private_internal_review')
assert.equal(
  secondPrivateReview.requiredExecution.requiredJobCount,
  terminalReviewRequiredJobCount,
)
assert.equal(secondPrivateReview.requiredExecution.allRequiredJobsCompleted, true)
assert.equal(secondPrivateReview.finalQaArtifact.finalQaGatesPassed, true)
assert.equal(secondPrivateReview.chain.finalQaInputBoundToFinalArtifact, true)
assert.notEqual(secondPrivateReview.identity.reviewAssemblyId,
  terminalPrivateReview.identity.reviewAssemblyId)
assert.notEqual(secondPrivateReview.finalArtifact.artifactId,
  terminalPrivateReview.finalArtifact.artifactId)
assert.notEqual(secondPrivateReview.finalQaArtifact.artifactId,
  terminalPrivateReview.finalQaArtifact.artifactId)
const secondPrivateReviewJourney = await canonicalJourneyService.recover({
  workspaceId,
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
})
assert.equal(secondPrivateReviewJourney.stage, 'private_review_ready')
assert.equal(secondPrivateReviewJourney.nextAction.code, 'record_private_review_decision')
assert.equal(secondPrivateReviewJourney.execution?.packageRecordId, revisionExecutionPackageId)
assert.equal(
  secondPrivateReviewJourney.workGraph?.packageRecordId,
  revisionExecutionPackageId,
)
assert.equal(
  secondPrivateReviewJourney.review?.reviewAssemblyId,
  secondPrivateReview.identity.reviewAssemblyId,
)
assert.equal(secondPrivateReviewJourney.review?.decision, undefined)
const secondPrivateReviewAcceptanceInput = {
  workspaceId,
  packageRecordId: revisionExecutionPackageId,
  reviewAssemblyId: secondPrivateReview.identity.reviewAssemblyId,
  purpose: 'record_canonical_private_review_decision' as const,
  expectedManifestSha256: secondPrivateReview.manifest.manifestSha256,
  expectedFinalArtifactSha256: secondPrivateReview.finalArtifact.sha256,
  decision: 'accept_private_internal_review' as const,
  idempotencyKey: 'accept-terminal-private-review-revision-v2',
}
const secondPrivateReviewAcceptance = await privateReviewDecisionService.record(
  secondPrivateReviewAcceptanceInput,
)
assert.equal(secondPrivateReviewAcceptance.status, 'private_internal_review_accepted')
assert.equal(secondPrivateReviewAcceptance.decision, 'accept_private_internal_review')
assert.equal(secondPrivateReviewAcceptance.revisionHandoff, null)
assert.equal(secondPrivateReviewAcceptance.readiness.revisionRequested, false)
assert.equal(
  secondPrivateReviewAcceptance.readiness.nextRequiredGate,
  'private_internal_acceptance_recorded_public_delivery_blocked',
)
assert.equal(secondPrivateReviewAcceptance.permissions.publicDelivery, false)
assert.equal(secondPrivateReviewAcceptance.permissions.billing, false)
const secondPrivateReviewAcceptanceReceipt = await
createCanonicalPrivateReviewDecisionCoordinatorService(context).record({
  workspaceId,
  expectedProjectId: String(seedSnapshot.projectId),
  expectedEditSessionId: terminalReviewEditSessionId,
  packageRecordId: revisionExecutionPackageId,
  reviewAssemblyId: secondPrivateReview.identity.reviewAssemblyId,
  expectedManifestSha256: secondPrivateReview.manifest.manifestSha256,
  expectedFinalArtifactSha256: secondPrivateReview.finalArtifact.sha256,
  purpose: 'record_canonical_private_review_decision',
  decision: 'accept_private_internal_review',
  idempotencyKey: 'coordinate-terminal-private-review-acceptance-v2',
})
assert.equal(
  secondPrivateReviewAcceptanceReceipt.receipt.decision.value,
  'accept_private_internal_review',
)
assert.equal(
  secondPrivateReviewAcceptanceReceipt.receipt.decision.revisionRequested,
  false,
)
assert.equal(
  secondPrivateReviewAcceptanceReceipt.receipt.readiness.nextRequiredGate,
  'private_internal_acceptance_recorded_public_delivery_blocked',
)
assert.equal(
  secondPrivateReviewAcceptanceReceipt.receipt.boundaries.publicDeliveryStarted,
  false,
)
const acceptedPrivateReviewJourney = await canonicalJourneyService.recover({
  workspaceId,
  projectId: seedSnapshot.projectId,
  editSessionId: terminalReviewEditSessionId,
})
assert.equal(acceptedPrivateReviewJourney.stage, 'private_review_accepted')
assert.equal(
  acceptedPrivateReviewJourney.nextAction.code,
  'await_public_delivery_authorization',
)
assert.equal(
  acceptedPrivateReviewJourney.review?.decision,
  'accept_private_internal_review',
)
assert.equal(
  acceptedPrivateReviewJourney.review?.decisionStatus,
  'private_internal_review_accepted',
)
assert.equal(
  acceptedPrivateReviewJourney.review?.decisionManifestSha256,
  secondPrivateReviewAcceptance.manifest.manifestSha256,
)
const acceptedReviewHistoryDescriptor =
  acceptedPrivateReviewJourney.review?.privateHistoryDownload
assert.ok(acceptedReviewHistoryDescriptor)
assert.equal(acceptedReviewHistoryDescriptor.method, 'GET')
assert.equal(
  acceptedReviewHistoryDescriptor.routeTemplate,
  `/v1/edit-executions/private-review-history/${secondPrivateReview.identity.reviewAssemblyId}/file`,
)
const serializedAcceptedHistoryDescriptor = JSON.stringify(acceptedReviewHistoryDescriptor)
for (const forbidden of [
  'authorization', 'credential', 'token', 'signedUrl', 'publicUrl', 'localFilePath', '/private/',
]) assert.equal(serializedAcceptedHistoryDescriptor.includes(forbidden), false)
assert.equal(acceptedPrivateReviewJourney.permissions.providerCall, false)
assert.equal(acceptedPrivateReviewJourney.permissions.render, false)
assert.equal(acceptedPrivateReviewJourney.testOnly, true)
assert.equal(canonicalEditJourneyResponseSchema.safeParse({
  ...acceptedPrivateReviewJourney,
  review: {
    ...acceptedPrivateReviewJourney.review!,
    decision: 'request_revision',
  },
}).success, false)
assert.equal(canonicalEditJourneyResponseSchema.safeParse({
  ...acceptedPrivateReviewJourney,
  review: {
    ...acceptedPrivateReviewJourney.review!,
    privateHistoryDownload: {
      ...acceptedReviewHistoryDescriptor,
      query: {
        ...acceptedReviewHistoryDescriptor.query,
        packageRecordId: 'foreign-package',
      },
    },
  },
}).success, false)
const secondPrivateReviewAcceptanceReplay = await privateReviewDecisionService.record(
  secondPrivateReviewAcceptanceInput,
)
assert.equal(secondPrivateReviewAcceptanceReplay.replay.idempotentReplay, true)
assert.equal(
  secondPrivateReviewAcceptanceReplay.identity.reviewDecisionId,
  secondPrivateReviewAcceptance.identity.reviewDecisionId,
)
await expectApiError(
  () => createCanonicalPrivateFinalArtifactDownloadService(context).read({
    workspaceId,
    projectId: terminalPrivateReview.identity.projectId,
    editSessionId: terminalPrivateReview.identity.editSessionId,
    snapshotId: terminalPrivateReview.identity.approvedPlanSnapshotId,
    jobId: terminalPrivateReview.finalArtifact.jobId,
    expectedAssetId: terminalPrivateReview.finalArtifact.expectedAssetId,
    artifactId: terminalPrivateReview.finalArtifact.artifactId,
    purpose: 'download_canonical_private_final_artifact',
  }),
  'APPROVED_SNAPSHOT_REQUIRED',
)
const freshHistoryContext: ServiceContext = {
  ...context,
  requestId: 'canonical-private-review-history-fresh-service-instance',
  auth: context.auth ? { ...context.auth } : undefined,
}
const historyService = createCanonicalPrivateReviewHistoryService(freshHistoryContext)
const supersededReviewHistoryInput = {
  ...terminalRevisionHistoryDescriptor.query,
  reviewAssemblyId: terminalPrivateReview.identity.reviewAssemblyId,
}
await expectApiError(
  () => historyService.read({
    ...supersededReviewHistoryInput,
    expectedDecisionManifestSha256: '0'.repeat(64),
  }),
  'IDEMPOTENCY_CONFLICT',
)
const supersededReviewHistory = await historyService.read(supersededReviewHistoryInput)
assert.equal(supersededReviewHistory.reviewState, 'superseded')
assert.equal(supersededReviewHistory.planStatus, 'superseded')
assert.equal(supersededReviewHistory.reservationStatus, 'released')
assert.equal(supersededReviewHistory.decision, 'request_revision')
assert.equal(supersededReviewHistory.sha256, terminalPrivateReview.finalArtifact.sha256)
assert.equal(supersededReviewHistory.archivedExecutionAuthorityRestored, false)
assert.equal(supersededReviewHistory.customerCreditMutationPerformed, false)
assert.equal(supersededReviewHistory.billingMutationPerformed, false)
const supersededReviewHistoryBytes = await readExactPrivateStream(
  await supersededReviewHistory.openStream(),
  supersededReviewHistory.byteSize,
)
assert.equal(
  createHash('sha256').update(supersededReviewHistoryBytes).digest('hex'),
  terminalPrivateReview.finalArtifact.sha256,
)
const currentReviewHistory = await historyService.read({
  ...acceptedReviewHistoryDescriptor.query,
  reviewAssemblyId: secondPrivateReview.identity.reviewAssemblyId,
})
assert.equal(currentReviewHistory.reviewState, 'current')
assert.equal(currentReviewHistory.planStatus, 'approved')
assert.equal(currentReviewHistory.reservationStatus, 'reserved')
assert.equal(currentReviewHistory.decision, 'accept_private_internal_review')
assert.equal(currentReviewHistory.sha256, secondPrivateReview.finalArtifact.sha256)
assert.notEqual(currentReviewHistory.identity.artifactId, supersededReviewHistory.identity.artifactId)
assert.notEqual(currentReviewHistory.historyEvidenceHash, supersededReviewHistory.historyEvidenceHash)
const supersededHistoryReopen = await createCanonicalPrivateReviewHistoryService({
  ...freshHistoryContext,
  requestId: 'canonical-private-review-history-second-fresh-service-instance',
}).read(supersededReviewHistoryInput)
assert.equal(supersededHistoryReopen.historyEvidenceHash, supersededReviewHistory.historyEvidenceHash)
assert.equal(supersededHistoryReopen.sha256, supersededReviewHistory.sha256)

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

const trimAdapterInput = {
  workspaceId, projectId: snapshot.projectId, editSessionId: snapshot.editSessionId,
  jobId: trimJob.id,
  purpose: 'execute_canonical_private_job' as const,
  idempotencyKey: 'canonical-job-adapter-ffmpeg-trim-root',
}
const coordinatedTrim = await jobExecutionAdapter.execute(trimAdapterInput)
assert.equal(coordinatedTrim.identity.canonicalToolId, 'ffmpeg')
assert.equal(coordinatedTrim.identity.operationId, ffmpegOperationId)
assert.equal(coordinatedTrim.identity.expectedAssetId, trimAsset.id)
assert.equal(coordinatedTrim.identity.runnerClass, 'offline_media_binary_execution_v1')
assert.equal(coordinatedTrim.result.contentType, 'video/x-nut')
assert.equal(coordinatedTrim.result.qaOutcome, 'passed')
assert.equal(coordinatedTrim.result.finalRenderAuthorized, false)
assert.equal(coordinatedTrim.evidence.serverDerivedCanonicalJob, true)
assert.equal(coordinatedTrim.evidence.serverDerivedToolAndOperation, true)
assert.equal(coordinatedTrim.evidence.singleUseDispatchConsumed, true)
assert.equal(coordinatedTrim.permissions.publicDelivery, false)
const coordinatedTrimReplay = await jobExecutionAdapter.execute(trimAdapterInput)
assert.equal(coordinatedTrimReplay.result.artifactId, coordinatedTrim.result.artifactId)
assert.equal(coordinatedTrimReplay.result.sha256, coordinatedTrim.result.sha256)
assert.equal(coordinatedTrimReplay.evidence.idempotentAdapterReplay, true)
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
const authorityAfterDispatch = await requireEditAuthority(workspaceId)
assert.equal(
  sha256AuthorityValue(snapshotAuthoritySlice(authorityAfterDispatch, snapshot.snapshotId)),
  sha256AuthorityValue(snapshotAuthoritySlice(aggregateBeforeDispatch, snapshot.snapshotId)),
)

const dispatchAggregateBeforeTamper = await requireDispatchAggregate()
const expectedDispatchGrantIds = dispatchAggregateBeforeTamper.grants.map((record) => record.id)
assert.equal(
  new Set(expectedDispatchGrantIds).size,
  expectedDispatchGrantIds.length,
  'Every accumulated dispatch decision must retain a unique grant identity.',
)
const expectedDispatchGrantsHash = sha256AuthorityValue(dispatchAggregateBeforeTamper.grants)
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
const restoredDispatchAggregate = await requireDispatchAggregate()
assert.deepEqual(
  restoredDispatchAggregate.grants.map((record) => record.id),
  expectedDispatchGrantIds,
)
assert.equal(
  sha256AuthorityValue(restoredDispatchAggregate.grants),
  expectedDispatchGrantsHash,
)

const nodeResourceRuntimeAuthority = await readPersistedOfflineNodeStructuredRuntimeAuthority()
const pythonResourceRuntimeAuthority = await readPersistedOfflinePythonStructuredRuntimeAuthority()
assert.ok(nodeResourceRuntimeAuthority)
assert.ok(pythonResourceRuntimeAuthority)
const expectedEmbeddedResourceOperationIds = new Set([
  ...nodeResourceRuntimeAuthority.supportedOperations
    .filter((operation) => operation.toolId !== 'sharp')
    .map((operation) => operation.operationId),
  ...pythonResourceRuntimeAuthority.supportedOperations
    .map((operation) => operation.operationId),
  ffprobeOperationId,
  ffmpegOperationId,
  remotionOperationId,
])
assert.equal(expectedEmbeddedResourceOperationIds.size, 31)
const resourceLeaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId,
})
assert.ok(resourceLeaseAggregate)
const embeddedResourceEvidenceByOperation = new Map<string, string>()
for (const lease of resourceLeaseAggregate.leases) {
  if (
    lease.executionFence.state !== 'completed'
    || ![
      'offline_node_structured_execution_v1',
      'offline_python_structured_execution_v1',
      'offline_media_binary_execution_v1',
      'offline_remotion_render_execution_v1',
    ].includes(lease.executionFence.runnerClass ?? '')
    || !lease.executionFence.executionAttemptId
  ) continue
  const mediaBinaryEvidence =
    lease.executionFence.runnerClass === 'offline_media_binary_execution_v1'
  const remotionEvidence =
    lease.executionFence.runnerClass === 'offline_remotion_render_execution_v1'
  if (
    mediaBinaryEvidence
    && ![probeJob.id, trimJob.id].includes(lease.jobId)
  ) continue
  const evidence = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId,
    projectId: snapshot.projectId,
    executionAttemptId: lease.executionFence.executionAttemptId,
  })
  if (!evidence) continue
  assert.equal(evidence.evidenceClass, 'private_embedded_observed_usage_test')
  assert.equal(evidence.identity.approvedPlanSnapshotId, snapshot.snapshotId)
  assert.equal(evidence.identity.jobId, lease.jobId)
  assert.equal(evidence.identity.executionAttemptId, lease.executionFence.executionAttemptId)
  assert.equal(evidence.identity.attemptOrdinal, lease.attemptNumber)
  assert.equal(evidence.identity.leaseId, lease.id)
  assert.equal(evidence.identity.leaseHash, lease.immutableLeaseHash)
  assert.equal(evidence.operation.kind, 'registered_tool_operation')
  assert.ok(expectedEmbeddedResourceOperationIds.has(evidence.operation.operationId))
  assert.equal(
    evidence.resourceUsage.measurementClass,
    'private_embedded_observed_resource_snapshots',
  )
  assert.ok(evidence.resourceUsage.wallTimeMilliseconds > 0)
  assert.equal(
    evidence.resourceUsage.allocatedVcpuCount,
    mediaBinaryEvidence || remotionEvidence ? 2 : 1,
  )
  assert.equal(
    evidence.resourceUsage.allocatedMemoryMib,
    mediaBinaryEvidence ? 2_048 : remotionEvidence ? 4_096 : 768,
  )
  assert.equal(evidence.resourceUsage.allocatedGpuCount, 0)
  assert.equal(evidence.resourceUsage.networkEgressBytes, 0)
  if (mediaBinaryEvidence) {
    assert.equal(
      evidence.runtime.measurementAgentVersion,
      'embedded_media_cgroup_v2_attempt_aggregate_v1',
    )
    assert.ok([ffprobeOperationId, ffmpegOperationId].includes(
      evidence.operation.operationId,
    ))
    assert.ok(evidence.resourceUsage.observedCpuMicroseconds > 0)
    assert.ok(evidence.resourceUsage.observedPeakMemoryBytes > 0)
    assert.ok(evidence.resourceUsage.observedPeakMemoryBytes <= 2_048 * 1024 * 1024)
  }
  if (remotionEvidence) {
    assert.equal(
      evidence.runtime.measurementAgentVersion,
      'embedded_remotion_cgroup_v2_observer_v1',
    )
    assert.equal(evidence.operation.operationId, remotionOperationId)
    assert.ok(evidence.resourceUsage.observedCpuMicroseconds > 0)
    assert.ok(evidence.resourceUsage.observedPeakMemoryBytes > 0)
    assert.ok(evidence.resourceUsage.observedPeakMemoryBytes <= 4_096 * 1024 * 1024)
  }
  assert.equal(evidence.runtime.cloudExecutionResourceDigest, null)
  assert.equal(evidence.input.artifacts.length >= 1, true)
  assert.equal(evidence.output.artifacts.length, 1)
  assert.equal(evidence.output.disposition, 'accepted')
  assert.equal(evidence.outcome.state, 'completed')
  assert.equal(evidence.outcome.failedOrUnknownAttemptCostRetained, true)
  assert.equal(evidence.infrastructureCost.providerCostIncluded, false)
  assert.equal(evidence.infrastructureCost.officialCloudRateApproved, false)
  assert.equal(evidence.infrastructureCost.invoiceReconciled, false)
  assert.equal(evidence.persistence.privateLocalCreateOnly, true)
  assert.equal(evidence.persistence.databaseBacked, false)
  assert.equal(evidence.persistence.productionDurability, false)
  assert.equal(evidence.readiness.observedUsageTransportQualified, false)
  assert.equal(evidence.readiness.productionRateAuthority, false)
  assert.equal(evidence.readiness.productionReady, false)
  assert.equal(evidence.commercialBoundary.customerPriceIncluded, false)
  assert.equal(evidence.commercialBoundary.customerCreditsIncluded, false)
  assert.equal(evidence.commercialBoundary.serviceFeeIncluded, false)
  assert.equal(evidence.commercialBoundary.walletMutationPerformed, false)
  assert.equal(evidence.commercialBoundary.billingMutationPerformed, false)
  const serializedEvidence = JSON.stringify(evidence)
  assert.equal(serializedEvidence.includes(strongInternalSecret), false)
  assert.equal(serializedEvidence.includes(localStorageRoot), false)
  const replayedEvidence = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId,
    projectId: snapshot.projectId,
    executionAttemptId: lease.executionFence.executionAttemptId,
  })
  assert.equal(replayedEvidence?.evidenceHash, evidence.evidenceHash)
  embeddedResourceEvidenceByOperation.set(
    evidence.operation.operationId,
    evidence.evidenceHash,
  )
}
assert.deepEqual(
  [...embeddedResourceEvidenceByOperation.keys()].sort(),
  [...expectedEmbeddedResourceOperationIds].sort(),
)
assert.equal(embeddedResourceEvidenceByOperation.size, 31)

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
    'pre_execution_runtime_failure_is_idempotent_and_retry_bounded_in_work_graph',
    'failed_job_isolated_while_independent_graph_branches_continue',
    'new_work_graph_run_retries_only_within_approved_max_attempts',
    'started_runner_failure_terminalizes_without_completion_or_commit_authority',
    'failed_attempt_exact_adapter_replay_prevents_same_key_reexecution',
    'new_adapter_key_executes_same_approved_operation_as_attempt_two',
    'completed_execution_missing_evidence_blocks_without_new_claim_or_dispatch',
    'completed_execution_recovers_adapter_completion_from_exact_private_evidence_without_rerun',
    'completed_execution_recovery_is_create_only_and_adapter_replay_safe',
    'completed_execution_recovery_is_checksum_protected_credential_free_and_tenant_scoped',
    'completed_deepfilternet_recovery_preserves_exact_attempt_cost_without_reexecution',
    'coordinator_consumes_dispatch_and_runs_actual_confined_d3_operation_under_lease_fence',
    'actual_svg_artifact_qa_and_reconciliation_authority_committed',
    'same_idempotent_coordinator_attempt_resumes_after_completed_execution_fence',
    'all_28_node_and_python_operations_persist_exact_embedded_cpu_memory_and_internal_cost_evidence',
    'canonical_ffmpeg_and_ffprobe_attempts_persist_exact_cgroup_v2_cpu_memory_and_internal_cost_evidence',
    'canonical_remotion_attempts_persist_exact_cgroup_v2_cpu_memory_and_internal_cost_evidence',
    'media_binary_resource_evidence_binds_job_attempt_lease_dispatch_input_output_and_replay',
    'embedded_usage_evidence_is_create_only_replay_safe_and_commercially_separate',
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
    'all_50_required_tool_identities_frozen_from_server_proof_catalog_before_approval',
    'all_50_tool_identity_operation_and_proof_hashes_revalidated_before_execution_packaging',
    'all_50_tool_payloads_validated_by_20_exact_runner_families_before_approval',
    'all_50_tool_payload_bindings_and_artifact_contracts_revalidated_before_execution_packaging',
    'grouped_planner_tool_node_compiles_and_executes_as_two_atomic_canonical_jobs',
    'atomic_compiled_jobs_preserve_dependency_progress_artifact_qa_and_reconciliation_lifecycle',
    'atomic_compiled_jobs_never_reach_the_legacy_multi_tool_runtime_blocker',
    'server_derived_job_adapter_executes_all_eight_structured_node_tool_identities',
    'server_derived_job_adapter_executes_all_five_browser_graphics_tool_identities',
    'server_derived_job_adapter_executes_bounded_ai_capability_tool_identities',
    'server_derived_job_adapter_executes_native_image_tool_identities',
    'server_derived_job_adapter_executes_native_audio_tool_identities',
    'server_derived_job_adapter_executes_container_packaging_tool_identities',
    'server_derived_job_adapter_executes_vapoursynth_frame_pipeline_identity',
    'server_derived_job_adapter_executes_audioflux_analysis_identity',
    'server_derived_job_adapter_executes_rembg_background_removal_identity',
    'server_derived_job_adapter_executes_all_seven_matrix_python_tool_identities',
    'server_derived_job_adapter_executes_all_ten_source_backed_audio_python_tool_identities',
    'server_derived_job_adapter_executes_d3_and_dependency_bound_sharp_identities',
    'server_derived_job_adapter_executes_duckdb_and_source_bound_pyav_identities',
    'server_derived_job_adapter_executes_deepfilternet_with_attempt_cost_evidence',
    'server_derived_job_adapter_executes_libass_and_source_bound_ffmpeg_identities',
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
    'eight_job_canonical_work_graph_completes_snapshot_trim_two_captions_two_voice_tracks_final_composition_and_final_qa',
    'durable_package_queue_completes_all_eight_jobs_with_zero_queued_or_leased_entries',
    'fresh_work_graph_service_recovers_all_eight_terminal_jobs_without_adapter_execution',
    'package_scoped_required_work_completion_is_create_only_restart_recoverable_and_authority_bound',
    'package_scoped_progress_checkpoint_is_restart_recoverable_and_terminally_complete',
    'different_work_graph_run_key_reuses_first_package_completion_certificate_without_replacement',
    'different_work_graph_run_key_cannot_regress_or_replace_terminal_progress',
    'work_graph_completion_checksum_tamper_fails_closed_and_restores_cleanly',
    'canonical_journey_recovery_advances_from_work_graph_completion_to_exact_review_assembly_action',
    'canonical_journey_work_graph_summary_exposes_no_jobs_artifacts_paths_or_execution_authority',
    'browser_safe_private_preparation_coordinator_revalidates_exact_package_and_assembles_review_without_raw_authority',
    'terminal_private_review_assembly_requires_every_required_artifact_qa_reconciliation_and_exact_final_qa_lease_binding',
    'credential_free_private_review_manifest_is_create_only_replay_safe_and_privately_downloadable',
    'canonical_journey_recovery_reports_exact_private_review_ready_authority_without_execution_grant',
    'canonical_journey_schema_rejects_a_decision_inside_review_ready_state',
    'private_review_decision_rejects_caller_artifact_and_stale_manifest_authority',
    'browser_decision_coordinator_rejects_foreign_project_before_persistence',
    'persisted_authenticated_upload_preference_edit_brief_handoff_publishes_exact_initial_plan_authority',
    'persisted_planning_handoff_rejects_source_order_drift_and_has_no_plan_credit_tool_or_render_side_effect',
    'persisted_planning_handoff_binding_survives_initial_and_terminal_review_snapshot_execution',
    'revision_request_creates_one_credential_free_immutable_snapshot_bound_handoff',
    'canonical_journey_recovery_reports_revision_request_without_mutating_snapshot_or_credit_authority',
    'revision_journey_exposes_hash_bound_credential_free_private_history_descriptor',
    'revision_decision_replays_without_authority_wallet_reservation_or_execution_mutation',
    'locked_exact_preference_evidence_change_rejected_without_mutation',
    'locked_exact_preference_evidence_reused_read_only_for_chat_led_revision',
    'replacement_plan_publication_requires_exact_unconsumed_revision_handoff_and_compiled_intent_hash',
    'replacement_plan_uses_fresh_persisted_component_bound_handoff_authority',
    'replacement_plan_creates_version_two_and_fresh_estimate_without_mutating_prior_snapshot',
    'revision_approval_atomically_releases_unused_prior_synthetic_reservation_and_reserves_fresh_maximum',
    'revision_approval_preserves_old_snapshot_work_items_jobs_and_wallet_conservation',
    'revision_approval_replay_creates_no_second_release_reservation_snapshot_or_jobs',
    'snapshot_v2_executes_the_bounded_eight_job_revision_graph_through_independent_final_qa',
    'revision_execution_assembles_new_private_artifacts_and_a_second_review_manifest',
    'canonical_journey_recovery_tracks_the_latest_replacement_review_assembly',
    'second_private_review_acceptance_is_create_only_replay_safe_and_public_delivery_blocked',
    'canonical_journey_recovery_reports_private_acceptance_while_public_delivery_remains_blocked',
    'accepted_journey_exposes_no_store_authenticated_private_history_descriptor_without_credentials_or_paths',
    'canonical_journey_schema_rejects_mismatched_acceptance_decision_lineage',
    'canonical_journey_schema_rejects_private_history_package_substitution',
    'active_execution_download_fails_closed_after_snapshot_is_superseded_and_reservation_released',
    'authenticated_history_reopens_superseded_review_without_restoring_execution_or_credit_authority',
    'journey_recovered_descriptors_reopen_current_and_superseded_private_review_bytes',
    'fresh_service_instances_reopen_current_and_superseded_review_bytes_with_stable_evidence',
    'authenticated_private_final_mp4_download_reopens_exact_qa_passed_bytes_without_public_or_signed_url',
    'dispatch_aggregate_tamper_restore_preserves_the_exact_dynamic_unique_grant_set',
    'checksum_protected_restart_safe_private_store',
    'dependency_authority_binding_tamper_rejected_by_immutable_record_validation',
    'no_lease_secret_path_execution_input_or_capability_leakage',
    'canonical_edit_authority_not_mutated_by_dispatch',
    'production_fail_closed',
  ],
}))

function workGraphPackageCompletionPath(
  ownerUserId: string,
  completionWorkspaceId: string,
  packageRecordId: string,
): string {
  const scopeHash = createHash('sha256')
    .update(`${ownerUserId}\u0000${completionWorkspaceId}`)
    .digest('hex')
  const packageHash = createHash('sha256')
    .update(`${scopeHash}\u0000${packageRecordId}`)
    .digest('hex')
  return join(
    localStorageRoot,
    'private-internal/canonical-work-graph-runs/v1',
    scopeHash.slice(0, 32),
    'packages',
    `${packageHash}.json`,
  )
}

function analyzeRenderedColorContinuity(bytes: Buffer, frames: number[]) {
  if (frames.length < 2) throw new Error('Color continuity needs at least two source samples.')
  const selected = frames.map((frame) => `eq(n\\,${frame})`).join('+')
  const analyzed = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', 'pipe:0',
    '-vf', `select=${selected},scale=64:64:flags=area,format=rgb24`,
    '-fps_mode', 'passthrough', '-frames:v', String(frames.length), '-threads', '1',
    '-f', 'rawvideo', 'pipe:1',
  ], { input: bytes, maxBuffer: 512 * 1024 })
  if (analyzed.status !== 0 || analyzed.stderr.byteLength > 0) {
    throw new Error(`Unable to analyze rendered color continuity: ${
      analyzed.stderr.toString('utf8').slice(0, 500)
    }`)
  }
  const frameByteLength = 64 * 64 * 3
  if (analyzed.stdout.byteLength !== frameByteLength * frames.length) {
    throw new Error('Rendered color continuity analysis returned the wrong frame count.')
  }
  const chromaticity = (frameBytes: Buffer) => {
    let red = 0
    let green = 0
    let blue = 0
    for (let offset = 0; offset < frameBytes.byteLength; offset += 3) {
      red += frameBytes[offset]!
      green += frameBytes[offset + 1]!
      blue += frameBytes[offset + 2]!
    }
    const total = Math.max(1, red + green + blue)
    return [red / total, green / total, blue / total]
  }
  const chromaticities = frames.map((_frame, index) => chromaticity(
    analyzed.stdout.subarray(index * frameByteLength, (index + 1) * frameByteLength),
  ))
  const boundaryDeltas = chromaticities.slice(1).map((current, index) =>
    Number(current.reduce((total, value, channel) =>
      total + Math.abs(value - chromaticities[index]![channel]!), 0).toFixed(6)))
  return {
    sampledFrameCount: frames.length,
    sampledFrames: frames,
    chromaticities: chromaticities.map((sample) =>
      sample.map((value) => Number(value.toFixed(6)))),
    boundaryDeltas,
    chromaticityDelta: Math.max(...boundaryDeltas),
  }
}

async function uploadCanonicalMediaFixture(
  projectId: string,
  fixtureId: 'primary' | 'secondary' | 'tertiary',
  firstColor: string,
  secondColor: string,
  frequency: number,
) {
  const fixturePath = join('/tmp', `reeditpro-canonical-media-${fixtureId}-${process.pid}.mp4`)
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', `color=c=${firstColor}:s=320x180:r=24:d=1`,
    '-f', 'lavfi', '-i', `color=c=${secondColor}:s=320x180:r=24:d=1`,
    '-f', 'lavfi', '-i', `sine=frequency=${frequency}:sample_rate=48000:duration=2`,
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
    originalFileName: `canonical-media-source-${fixtureId}.mp4`,
    mimeType: 'video/mp4',
    expectedSizeBytes: bytes.byteLength,
    checksumSha256,
    idempotencyKey: `canonical-media-source-${fixtureId}-upload-intent`,
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
      planningInputRevision: evidence.preferenceRecord.planning.planningInputRevision,
      preferenceFingerprintSha256: exactEditPreferenceFingerprint(evidence.preferenceRecord.values),
      sourcePreparationEvidenceHash: sha256Text(
        `dispatch-source-preparation:${workspaceId}:${projectId}:${targetEditSessionId}`,
      ),
      sourceCandidateHash: null,
      frameConfirmationId: `dispatch-frame-confirmation:${targetEditSessionId}`,
    },
    preferenceApplication: { status: 'not_selected' as const, applicationVersion: 0 as const },
    editBrief: { status: 'not_used' as const },
  }
}

async function preparePersistedPlanningHandoff(
  service: ReturnType<typeof createCanonicalPlanningHandoffService>,
  body: PublishCanonicalEditPlanBody,
  projectId: string,
  targetEditSessionId: string,
) {
  return service.prepare({
    workspaceId: body.workspaceId,
    projectId,
    editSessionId: targetEditSessionId,
    purpose: 'prepare_canonical_planning_handoff',
    orderedSourceItems: body.canonicalPlan.components.sourceSequence.map((item) => ({
      sourceSequenceItemId: item.sourceSequenceItemId,
      mediaAssetId: item.mediaAssetId,
      uploadedOrder: item.uploadedOrder,
      checksumSha256: requireSha256(item.checksumSha256),
      required: item.required,
    })),
    canonicalPlanComponents: body.canonicalPlan.components,
  })
}

function planningHandoffPublicationBody(
  body: PublishCanonicalEditPlanBody,
  expectedHandoffHash: string,
) {
  return {
    workspaceId: body.workspaceId,
    planningRequestId: body.planningRequestId,
    ...(body.revisionAuthority ? { revisionAuthority: body.revisionAuthority } : {}),
    canonicalPlan: body.canonicalPlan,
    expectedHandoffHash,
  }
}

function createDispatchPlanBody(input: {
  seedAuthority: Awaited<ReturnType<ReturnType<typeof createEditPlanningAuthorityService>['loadApprovedExecutionAuthority']>>
  targetEditSessionId: string
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
  secondaryMediaSourceItem: {
    sourceSequenceItemId: string
    mediaAssetId: string
    uploadedOrder: number
    checksumSha256: string
    required: true
  }
  tertiaryMediaSourceItem?: {
    sourceSequenceItemId: string
    mediaAssetId: string
    uploadedOrder: number
    checksumSha256: string
    required: true
  }
  matrixOperationIds: Record<MatrixToolId, string>
}): PublishCanonicalEditPlanBody {
  const components = structuredClone(input.seedAuthority.components)
  components.confirmedSettings.preferencePlanningInputRevision =
    input.planningInputAuthority.exactEditPreference.planningInputRevision
  components.confirmedSettings.preferenceFingerprintSha256 =
    input.planningInputAuthority.exactEditPreference.preferenceFingerprintSha256
  components.sourceSequence.push(
    input.mediaSourceItem,
    input.secondaryMediaSourceItem,
    ...(input.tertiaryMediaSourceItem ? [input.tertiaryMediaSourceItem] : []),
  )
  components.sourceCleanupPlan.decisions.push({
    decisionId: 'cleanup-python-media-source',
    sourceSequenceItemId: input.mediaSourceItem.sourceSequenceItemId,
    action: 'preserve',
    startFrame: 0,
    endFrameExclusive: 24,
    reason: 'Preserve the first approved synthetic media range in confirmed source order.',
    confidence: 1,
    meaningPreservationStatus: 'passed',
    userReviewStatus: 'not_required',
  }, {
    decisionId: 'cleanup-secondary-media-source',
    sourceSequenceItemId: input.secondaryMediaSourceItem.sourceSequenceItemId,
    action: 'preserve',
    startFrame: 0,
    endFrameExclusive: 24,
    reason: 'Preserve the second approved synthetic media range in confirmed source order.',
    confidence: 1,
    meaningPreservationStatus: 'passed',
    userReviewStatus: 'not_required',
  }, ...(input.tertiaryMediaSourceItem
    ? [{
        decisionId: 'cleanup-tertiary-media-source',
        sourceSequenceItemId: input.tertiaryMediaSourceItem.sourceSequenceItemId,
        action: 'preserve' as const,
        startFrame: 0,
        endFrameExclusive: 24,
        reason: 'Preserve the third approved synthetic media range in confirmed source order.',
        confidence: 1,
        meaningPreservationStatus: 'passed' as const,
        userReviewStatus: 'not_required' as const,
      }]
    : []))
  const firstSegment = components.segments[0]
  if (!firstSegment) throw new Error('Canonical dispatch smoke requires one seed timeline segment.')
  components.segments = [{
    ...firstSegment,
    segmentId: 'segment-1',
    startFrame: 0,
    endFrameExclusive: 24,
  }, {
    ...firstSegment,
    segmentId: 'segment-2',
    startFrame: 24,
    endFrameExclusive: 48,
  }, ...(input.tertiaryMediaSourceItem
    ? [{
        ...firstSegment,
        segmentId: 'segment-3',
        startFrame: 48,
        endFrameExclusive: 72,
      }]
    : [])]
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
  components.motionStudioStorytellingStyleAuthority =
    createMotionStudioStorytellingStyleAuthority({
      workspaceId,
      projectId: input.seedAuthority.snapshot.projectId,
      editSessionId: input.targetEditSessionId,
    })
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
            lineKey: 'motion-studio-private-preview-authority',
            label: 'Controlled Motion Studio scene and layered preview authorization',
            category: 'controlled_tool', estimatedCredits: 4, removable: false,
            metadata: {
              canonicalToolId: 'remotion',
              operationId: input.remotionOperationId,
              internalProductionCostIncluded: false,
            },
          },
          {
            lineKey: 'libass-caption-overlay-authority',
            label: 'Controlled libass private timed caption track authorization',
            category: 'controlled_tool', estimatedCredits: 3, removable: false,
            metadata: { canonicalToolId: 'libass', operationId: input.libassOperationId },
          },
          {
            lineKey: 'reference-bound-color-authority',
            label: 'Controlled reference-bound professional color authorization',
            category: 'controlled_tool', estimatedCredits: 4, removable: false,
            metadata: { canonicalToolId: 'ffmpeg', operationId: input.ffmpegOperationId },
          },
          ...(input.tertiaryMediaSourceItem
            ? [{
                lineKey: 'third-source-processing-authority',
                label: 'Controlled third-source voice and color processing authorization',
                category: 'controlled_tool' as const,
                estimatedCredits: 4,
                removable: false,
                metadata: {
                  canonicalToolId: 'ffmpeg',
                  operationId: input.ffmpegOperationId,
                  sourceCount: 3,
                },
              }]
            : []),
          {
            lineKey: '4k-export-ceiling',
            label: '4K UHD render and export ceiling',
            category: 'render',
            estimatedCredits: components.confirmedSettings.professionalExportCoverage.maximumInternalToolCostCredits,
            removable: false,
            metadata: { requiresSeparateExportEstimate: false, allowsAdditionalExportCharge: false },
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
          sourceSequenceItemIds: [
            input.mediaSourceItem.sourceSequenceItemId,
            input.secondaryMediaSourceItem.sourceSequenceItemId,
            ...(input.tertiaryMediaSourceItem
              ? [input.tertiaryMediaSourceItem.sourceSequenceItemId]
              : []),
          ],
          sourceCleanupDecisionIds: [
            'cleanup-python-media-source',
            'cleanup-secondary-media-source',
            ...(input.tertiaryMediaSourceItem ? ['cleanup-tertiary-media-source'] : []),
          ],
          expectedOutputs: [{
            outputKey: 'source-trim-validation-evidence',
            artifactType: 'source_trim_validation_evidence',
            assetRole: 'qa',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'application/json',
            segmentIds: components.segments.map((segment) => segment.segmentId),
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
          maximumCreditBudget: 1, required: true,
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
        ...createRemotionWorkItems(input, components),
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
          maximumCreditBudget: 1, required: true,
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
          workItemKey: 'voice-delivery-primary',
          workItemType: 'custom',
          workerClass: 'audio_processing_worker',
          executionInput: {
            operation: 'process_approved_source_voice_delivery',
            approvedToolOperationIds: [input.ffmpegOperationId],
            expectedOutputKeys: ['voice-delivery-primary-wav'],
            structuredPayload: {
              recipeProfileId: 'approved_voice_delivery_wav_v1',
              timestampPolicy: 'normalize_from_zero',
              overwriteExistingArtifact: false,
              allowUnreviewedCodec: false,
              trimStartFrame: 0,
              trimEndFrameExclusive: 24,
              frameRate: 24,
              sampleRate: 48_000,
              channelMode: 'stereo',
              targetLufs: -14,
              truePeakDbtp: -1,
              loudnessRangeLufs: 7,
              highpassHz: 70,
              compressorPreset: 'gentle_voice_v1',
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'voice-delivery-primary-wav',
            artifactType: 'controlled_ffmpeg_professional_voice_delivery_wav',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'audio/wav', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: ['voice-track-layer-1'],
          }],
          dependencyKeys: [], approvedToolIds: ['ffmpeg'],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 2, attemptTimeoutSeconds: 600, scheduledDelaySeconds: 0,
          maximumCreditBudget: 2, required: true,
        },
        {
          workItemKey: 'voice-delivery-secondary',
          workItemType: 'custom',
          workerClass: 'audio_processing_worker',
          executionInput: {
            operation: 'process_approved_source_voice_delivery',
            approvedToolOperationIds: [input.ffmpegOperationId],
            expectedOutputKeys: ['voice-delivery-secondary-wav'],
            structuredPayload: {
              recipeProfileId: 'approved_voice_delivery_wav_v1',
              timestampPolicy: 'normalize_from_zero',
              overwriteExistingArtifact: false,
              allowUnreviewedCodec: false,
              trimStartFrame: 0,
              trimEndFrameExclusive: 24,
              frameRate: 24,
              sampleRate: 48_000,
              channelMode: 'stereo',
              targetLufs: -14,
              truePeakDbtp: -1,
              loudnessRangeLufs: 7,
              highpassHz: 70,
              compressorPreset: 'gentle_voice_v1',
            },
          },
          sourceSequenceItemIds: [input.secondaryMediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-secondary-media-source'],
          expectedOutputs: [{
            outputKey: 'voice-delivery-secondary-wav',
            artifactType: 'controlled_ffmpeg_professional_voice_delivery_wav',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'audio/wav', segmentIds: ['segment-2'],
            timingIds: ['master-timing-plan'], rendererLayerIds: ['voice-track-layer-2'],
          }],
          dependencyKeys: [], approvedToolIds: ['ffmpeg'],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 2, attemptTimeoutSeconds: 600, scheduledDelaySeconds: 0,
          maximumCreditBudget: 2, required: true,
        },
        ...(input.tertiaryMediaSourceItem
          ? [{
              workItemKey: 'voice-delivery-tertiary',
              workItemType: 'custom' as const,
              workerClass: 'audio_processing_worker' as const,
              executionInput: {
                operation: 'process_approved_source_voice_delivery',
                approvedToolOperationIds: [input.ffmpegOperationId],
                expectedOutputKeys: ['voice-delivery-tertiary-wav'],
                structuredPayload: {
                  recipeProfileId: 'approved_voice_delivery_wav_v1',
                  timestampPolicy: 'normalize_from_zero',
                  overwriteExistingArtifact: false,
                  allowUnreviewedCodec: false,
                  trimStartFrame: 0,
                  trimEndFrameExclusive: 24,
                  frameRate: 24,
                  sampleRate: 48_000,
                  channelMode: 'stereo',
                  targetLufs: -14,
                  truePeakDbtp: -1,
                  loudnessRangeLufs: 7,
                  highpassHz: 70,
                  compressorPreset: 'gentle_voice_v1',
                },
              },
              sourceSequenceItemIds: [input.tertiaryMediaSourceItem.sourceSequenceItemId],
              sourceCleanupDecisionIds: ['cleanup-tertiary-media-source'],
              expectedOutputs: [{
                outputKey: 'voice-delivery-tertiary-wav',
                artifactType: 'controlled_ffmpeg_professional_voice_delivery_wav',
                assetRole: 'processed' as const,
                required: true,
                previewPlaceholderAllowed: false,
                contentType: 'audio/wav',
                segmentIds: ['segment-3'],
                timingIds: ['master-timing-plan'],
                rendererLayerIds: ['voice-track-layer-3'],
              }],
              dependencyKeys: [],
              approvedToolIds: ['ffmpeg'],
              providerExecutionMode: 'none' as const,
              fallbackPolicy: {},
              maxAttempts: 2,
              attemptTimeoutSeconds: 600,
              scheduledDelaySeconds: 0,
              maximumCreditBudget: 2,
              required: true,
            }]
          : []),
        {
          workItemKey: 'color-delivery-primary',
          workItemType: 'custom',
          workerClass: 'color_processing_worker',
          executionInput: {
            operation: 'process_approved_source_professional_color_delivery',
            approvedToolOperationIds: [input.ffmpegOperationId],
            expectedOutputKeys: ['color-delivery-primary-mkv'],
            structuredPayload: {
              recipeProfileId: 'approved_source_color_delivery_matroska_v1',
              timestampPolicy: 'normalize_from_zero',
              overwriteExistingArtifact: false,
              allowUnreviewedCodec: false,
              trimStartFrame: 0,
              trimEndFrameExclusive: 24,
              frameRate: 24,
              colorGradeStyle: 'premium_clean',
              intensity: 'balanced',
              approvedColorOperationIds: [
                'color-primary-clarity',
                'color-primary-contrast-curve',
                'color-primary-exposure-correction',
                'color-primary-highlight-recovery',
                'color-primary-look-transform',
                'color-primary-qa-histogram-check',
                'color-primary-white-balance',
              ],
              approvedColorOperationKinds: [
                'clarity',
                'contrast_curve',
                'exposure_correction',
                'highlight_recovery',
                'look_transform',
                'qa_histogram_check',
                'white_balance',
              ],
              analysisProfileId: 'approved_three_frame_rgb_stats_v1',
              correctionProfileId: 'bounded_professional_source_color_v1',
              outputColorSpace: 'bt709',
              outputPixelFormat: 'yuv420p',
              preserveAudio: false,
            },
          },
          sourceSequenceItemIds: [input.mediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-python-media-source'],
          expectedOutputs: [{
            outputKey: 'color-delivery-primary-mkv',
            artifactType: 'controlled_ffmpeg_professional_color_delivery_matroska',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'video/x-matroska', segmentIds: ['segment-1'],
            timingIds: ['master-timing-plan'], rendererLayerIds: ['color-source-layer-1'],
          }],
          dependencyKeys: [], approvedToolIds: ['ffmpeg'],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 2, attemptTimeoutSeconds: 900, scheduledDelaySeconds: 0,
          maximumCreditBudget: 2, required: true,
        },
        {
          workItemKey: 'color-delivery-secondary',
          workItemType: 'custom',
          workerClass: 'color_processing_worker',
          executionInput: {
            operation: 'process_approved_source_professional_color_delivery',
            approvedToolOperationIds: [input.ffmpegOperationId],
            expectedOutputKeys: ['color-delivery-secondary-mkv'],
            structuredPayload: {
              recipeProfileId: 'approved_source_color_match_delivery_matroska_v1',
              timestampPolicy: 'normalize_from_zero',
              overwriteExistingArtifact: false,
              allowUnreviewedCodec: false,
              trimStartFrame: 0,
              trimEndFrameExclusive: 24,
              frameRate: 24,
              colorGradeStyle: 'premium_clean',
              intensity: 'balanced',
              approvedColorOperationIds: [
                'color-secondary-clarity',
                'color-secondary-contrast-curve',
                'color-secondary-exposure-correction',
                'color-secondary-highlight-recovery',
                'color-secondary-look-transform',
                'color-secondary-qa-histogram-check',
                'color-secondary-shot-matching',
                'color-secondary-white-balance',
              ],
              approvedColorOperationKinds: [
                'clarity',
                'contrast_curve',
                'exposure_correction',
                'highlight_recovery',
                'look_transform',
                'qa_histogram_check',
                'shot_matching',
                'white_balance',
              ],
              analysisProfileId: 'approved_three_frame_rgb_stats_v1',
              correctionProfileId: 'bounded_reference_matched_professional_source_color_v1',
              shotMatchProfileId: 'approved_reference_three_frame_rgb_match_v1',
              referenceSourceSequenceItemId: input.mediaSourceItem.sourceSequenceItemId,
              referenceDurationFrames: 24,
              referenceOutputKey: 'color-delivery-primary-mkv',
              outputColorSpace: 'bt709',
              outputPixelFormat: 'yuv420p',
              preserveAudio: false,
            },
          },
          sourceSequenceItemIds: [input.secondaryMediaSourceItem.sourceSequenceItemId],
          sourceCleanupDecisionIds: ['cleanup-secondary-media-source'],
          expectedOutputs: [{
            outputKey: 'color-delivery-secondary-mkv',
            artifactType: 'controlled_ffmpeg_professional_color_delivery_matroska',
            assetRole: 'processed', required: true, previewPlaceholderAllowed: false,
            contentType: 'video/x-matroska', segmentIds: ['segment-2'],
            timingIds: ['master-timing-plan'], rendererLayerIds: ['color-source-layer-2'],
          }],
          dependencyKeys: ['color-delivery-primary'], approvedToolIds: ['ffmpeg'],
          providerExecutionMode: 'none', fallbackPolicy: {},
          maxAttempts: 2, attemptTimeoutSeconds: 900, scheduledDelaySeconds: 0,
          maximumCreditBudget: 2, required: true,
        },
        ...(input.tertiaryMediaSourceItem
          ? [{
              workItemKey: 'color-delivery-tertiary',
              workItemType: 'custom' as const,
              workerClass: 'color_processing_worker' as const,
              executionInput: {
                operation: 'process_approved_source_professional_color_delivery',
                approvedToolOperationIds: [input.ffmpegOperationId],
                expectedOutputKeys: ['color-delivery-tertiary-mkv'],
                structuredPayload: {
                  recipeProfileId: 'approved_source_color_match_delivery_matroska_v1',
                  timestampPolicy: 'normalize_from_zero',
                  overwriteExistingArtifact: false,
                  allowUnreviewedCodec: false,
                  trimStartFrame: 0,
                  trimEndFrameExclusive: 24,
                  frameRate: 24,
                  colorGradeStyle: 'premium_clean',
                  intensity: 'balanced',
                  approvedColorOperationIds: [
                    'color-tertiary-clarity',
                    'color-tertiary-contrast-curve',
                    'color-tertiary-exposure-correction',
                    'color-tertiary-highlight-recovery',
                    'color-tertiary-look-transform',
                    'color-tertiary-qa-histogram-check',
                    'color-tertiary-shot-matching',
                    'color-tertiary-white-balance',
                  ],
                  approvedColorOperationKinds: [
                    'clarity',
                    'contrast_curve',
                    'exposure_correction',
                    'highlight_recovery',
                    'look_transform',
                    'qa_histogram_check',
                    'shot_matching',
                    'white_balance',
                  ],
                  analysisProfileId: 'approved_three_frame_rgb_stats_v1',
                  correctionProfileId:
                    'bounded_reference_matched_professional_source_color_v1',
                  shotMatchProfileId: 'approved_reference_three_frame_rgb_match_v1',
                  referenceSourceSequenceItemId: input.mediaSourceItem.sourceSequenceItemId,
                  referenceDurationFrames: 24,
                  referenceOutputKey: 'color-delivery-primary-mkv',
                  outputColorSpace: 'bt709',
                  outputPixelFormat: 'yuv420p',
                  preserveAudio: false,
                },
              },
              sourceSequenceItemIds: [input.tertiaryMediaSourceItem.sourceSequenceItemId],
              sourceCleanupDecisionIds: ['cleanup-tertiary-media-source'],
              expectedOutputs: [{
                outputKey: 'color-delivery-tertiary-mkv',
                artifactType: 'controlled_ffmpeg_professional_color_delivery_matroska',
                assetRole: 'processed' as const,
                required: true,
                previewPlaceholderAllowed: false,
                contentType: 'video/x-matroska',
                segmentIds: ['segment-3'],
                timingIds: ['master-timing-plan'],
                rendererLayerIds: ['color-source-layer-3'],
              }],
              dependencyKeys: ['color-delivery-primary'],
              approvedToolIds: ['ffmpeg'],
              providerExecutionMode: 'none' as const,
              fallbackPolicy: {},
              maxAttempts: 2,
              attemptTimeoutSeconds: 900,
              scheduledDelaySeconds: 0,
              maximumCreditBudget: 2,
              required: true,
            }]
          : []),
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
            timingIds: [
              'master-timing-plan',
              'master-approved-hard-cut-1',
              'refined-approved-hard-cut-1',
              ...(input.tertiaryMediaSourceItem
                ? ['master-approved-hard-cut-2', 'refined-approved-hard-cut-2']
                : []),
            ],
            rendererLayerIds: [
              'source-video-layer',
              'approved-hard-cut-boundary-1',
              'voice-track-layer-1',
              'voice-track-layer-2',
              'color-source-layer-1',
              'color-source-layer-2',
              ...(input.tertiaryMediaSourceItem
                ? ['approved-hard-cut-boundary-2', 'voice-track-layer-3', 'color-source-layer-3']
                : []),
              'libass-caption-overlay-layer-1',
              'libass-caption-overlay-layer-2',
            ],
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
            operation: 'render_approved_source_sequence_caption_track_final',
            approvedToolOperationIds: [input.remotionOperationId],
            expectedOutputKeys: ['private-final-composition-mp4'],
            structuredPayload: {
              compositionProfileId: 'approved_source_sequence_caption_track_final_v1',
              width: 2160,
              height: 3840,
              fps: 24,
              durationFrames: input.tertiaryMediaSourceItem ? 72 : 48,
              sourceSegments: [{
                sourceSequenceItemId: input.mediaSourceItem.sourceSequenceItemId,
                sourceStartFrame: 0,
                sourceEndFrameExclusive: 24,
                timelineStartFrame: 0,
                timelineEndFrameExclusive: 24,
              }, {
                sourceSequenceItemId: input.secondaryMediaSourceItem.sourceSequenceItemId,
                sourceStartFrame: 0,
                sourceEndFrameExclusive: 24,
                timelineStartFrame: 24,
                timelineEndFrameExclusive: 48,
              }, ...(input.tertiaryMediaSourceItem
                ? [{
                    sourceSequenceItemId: input.tertiaryMediaSourceItem.sourceSequenceItemId,
                    sourceStartFrame: 0,
                    sourceEndFrameExclusive: 24,
                    timelineStartFrame: 48,
                    timelineEndFrameExclusive: 72,
                  }]
                : [])],
              transitionPolicy: 'approved_hard_cuts_only',
              hardCutTransitions: [{
                transitionTimingItemId: 'master-approved-hard-cut-1',
                refinedTransitionTimingItemId: 'refined-approved-hard-cut-1',
                fromSegmentId: 'segment-1',
                toSegmentId: 'segment-2',
                fromSourceSequenceItemId: input.mediaSourceItem.sourceSequenceItemId,
                toSourceSequenceItemId: input.secondaryMediaSourceItem.sourceSequenceItemId,
                boundaryFrame: 24,
              }, ...(input.tertiaryMediaSourceItem
                ? [{
                    transitionTimingItemId: 'master-approved-hard-cut-2',
                    refinedTransitionTimingItemId: 'refined-approved-hard-cut-2',
                    fromSegmentId: 'segment-2',
                    toSegmentId: 'segment-3',
                    fromSourceSequenceItemId:
                      input.secondaryMediaSourceItem.sourceSequenceItemId,
                    toSourceSequenceItemId:
                      input.tertiaryMediaSourceItem.sourceSequenceItemId,
                    boundaryFrame: 48,
                  }]
                : [])],
              sourceFit: 'contain', panelBackground: '#000000',
              audioPolicy: 'replace_with_approved_voice_tracks',
              renderPurpose: 'private_4k_delivery_master_v1',
              deliveryProfileId: 'uhd_2160',
              estimateCostBasisProfileId: 'uhd_2160',
              sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
              usesApprovedEditReservation: true,
              requiresSeparateExportEstimate: false,
              allowsAdditionalExportCharge: false,
              sourceMediaPolicy: 'approved_professional_color_intermediate_v1',
              voiceTracks: [{
                sourceSequenceItemId: input.mediaSourceItem.sourceSequenceItemId,
                outputKey: 'voice-delivery-primary-wav',
                durationFrames: 24,
              }, {
                sourceSequenceItemId: input.secondaryMediaSourceItem.sourceSequenceItemId,
                outputKey: 'voice-delivery-secondary-wav',
                durationFrames: 24,
              }, ...(input.tertiaryMediaSourceItem
                ? [{
                    sourceSequenceItemId: input.tertiaryMediaSourceItem.sourceSequenceItemId,
                    outputKey: 'voice-delivery-tertiary-wav',
                    durationFrames: 24,
                  }]
                : [])],
              captionOverlayPolicy: 'approved_timed_full_frame_rgba_track',
              captionOverlayCues: [{
                outputKey: 'libass-caption-overlay-png',
                startFrame: 0,
                endFrameExclusive: 24,
              }, {
                outputKey: 'libass-caption-overlay-second-png',
                startFrame: 24,
                endFrameExclusive: 48,
              }],
            },
          },
          sourceSequenceItemIds: [
            input.mediaSourceItem.sourceSequenceItemId,
            input.secondaryMediaSourceItem.sourceSequenceItemId,
            ...(input.tertiaryMediaSourceItem
              ? [input.tertiaryMediaSourceItem.sourceSequenceItemId]
              : []),
          ],
          sourceCleanupDecisionIds: [
            'cleanup-python-media-source',
            'cleanup-secondary-media-source',
            ...(input.tertiaryMediaSourceItem ? ['cleanup-tertiary-media-source'] : []),
          ],
          expectedOutputs: [{
            outputKey: 'private-final-composition-mp4',
            artifactType: 'private_source_sequence_caption_track_4k_delivery_master_v1',
            assetRole: 'final',
            required: true,
            previewPlaceholderAllowed: false,
            contentType: 'video/mp4',
            segmentIds: components.segments.map((segment) => segment.segmentId),
            timingIds: [
              'master-timing-plan',
              'master-approved-hard-cut-1',
              'refined-approved-hard-cut-1',
              ...(input.tertiaryMediaSourceItem
                ? ['master-approved-hard-cut-2', 'refined-approved-hard-cut-2']
                : []),
            ],
            rendererLayerIds: [
              'source-video-layer',
              'approved-hard-cut-boundary-1',
              'voice-track-layer-1',
              'voice-track-layer-2',
              'color-source-layer-1',
              'color-source-layer-2',
              ...(input.tertiaryMediaSourceItem
                ? ['approved-hard-cut-boundary-2', 'voice-track-layer-3', 'color-source-layer-3']
                : []),
              'libass-caption-overlay-layer-1',
              'libass-caption-overlay-layer-2',
            ],
          }],
          dependencyKeys: [
            'source-trim-validation',
            'libass-caption-overlay-root',
            'libass-caption-overlay-second',
            'voice-delivery-primary',
            'voice-delivery-secondary',
            ...(input.tertiaryMediaSourceItem ? ['voice-delivery-tertiary'] : []),
            'color-delivery-primary',
            'color-delivery-secondary',
            ...(input.tertiaryMediaSourceItem ? ['color-delivery-tertiary'] : []),
          ],
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
  components: PublishCanonicalEditPlanBody['canonicalPlan']['components'],
): CanonicalSmokeWorkItem[] {
  const style = components.motionStudioStorytellingStyleAuthority
  if (!style) throw new Error('Canonical Motion Studio smoke requires one style authority component.')
  const previewFrame = motionStudioPreviewFrame(components.confirmedSettings.outputFrame)
  const createMotionStudioBinding = (
    compositionProfileId: 'motion_studio_scene_preview_v1' | 'motion_studio_native_layered_scene_v1',
  ) => {
    const bindingWithoutHash = {
      schemaVersion: CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_BINDING_VERSION,
      sourceAuthority: 'motion_studio_storytelling_compiler' as const,
      evidenceClass: 'controlled_local_content_addressed_non_promotable' as const,
      workspaceId: style.workspaceId,
      projectId: style.projectId,
      editSessionId: style.editSessionId,
      productionId: style.productionId,
      compositionProfileId,
      canonicalStyleComponentDigest: sha256AuthorityValue(style),
      styleSelectionDigest: style.styleSelection.selectionDigest,
      motionDna: { ...style.styleSelection.motionDnaVersion },
      referenceContracts: style.styleSelection.referenceContractVersions.map((reference) => ({ ...reference })),
      sourceAuditDigests: [...style.styleSelection.sourceAuditDigests],
      calibrationPlan: {
        id: style.calibrationPlan.id,
        digest: style.calibrationPlan.planDigest,
      },
      internalCostEnvelope: {
        estimateId: style.internalCostEnvelope.estimateId,
        digest: style.internalCostEnvelope.estimateDigest,
      },
      preparedScript: {
        artifactId: 'prepared-script-storytelling-canonical',
        versionId: 'prepared-script-version-1',
        versionNumber: 1,
        contentDigest: '7'.repeat(64),
        state: 'approved' as const,
      },
      sceneDocuments: [{
        artifactId: 'scene-document-storytelling-canonical',
        versionId: 'scene-document-version-1',
        versionNumber: 1,
        contentDigest: '8'.repeat(64),
        state: 'locked' as const,
      }],
      timingAuthorityDigest: canonicalMotionStudioTimingAuthorityDigest(components),
      confirmedOutputFrame: { ...components.confirmedSettings.outputFrame },
      previewFrame,
      sourceRepositoryReverified: false as const,
      privateInternalControlledExecutionOnly: true as const,
      providerExecutionAuthorized: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      productionReady: false as const,
    }
    return canonicalMotionStudioRemotionPreviewBindingSchema.parse({
      ...bindingWithoutHash,
      bindingHash: sha256AuthorityValue(bindingWithoutHash),
    })
  }
  const motionStudioSceneBinding = createMotionStudioBinding('motion_studio_scene_preview_v1')
  const motionStudioLayeredBinding = createMotionStudioBinding('motion_studio_native_layered_scene_v1')
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
  }, {
    workItemKey: 'motion-studio-scene-preview-root',
    workItemType: 'render_remotion_preview',
    workerClass: 'render_worker',
    executionInput: {
      operation: CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_OPERATION,
      approvedToolOperationIds: [input.remotionOperationId],
      expectedOutputKeys: ['motion-studio-scene-preview-mp4'],
      motionStudioStorytellingAuthority: motionStudioSceneBinding,
      structuredPayload: {
        compositionProfileId: 'motion_studio_scene_preview_v1',
        ...previewFrame,
        durationFrames: 24,
        sceneId: 'scene-storytelling-canonical-1',
        sceneStartFrame: 0,
        sceneEndFrame: 24,
        semanticPurpose: 'Show the exact approved Storytelling scene as a private timing preview.',
        productionMode: 'native_graphics_first',
        layerType: 'text',
        panelBackground: '#0F172A',
        accentColor: '#FF4D8D',
      },
    },
    sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'motion-studio-scene-preview-mp4',
      artifactType: 'motion_studio_scene_private_preview_mp4',
      assetRole: 'preview', required: true, previewPlaceholderAllowed: false,
      contentType: 'video/mp4', segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'], rendererLayerIds: ['motion-studio-scene-preview-layer'],
    }],
    dependencyKeys: [], approvedToolIds: ['remotion'], providerExecutionMode: 'none',
    fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }, {
    workItemKey: 'motion-studio-scene-preview-proof',
    workItemType: 'run_asset_qa', workerClass: 'qa_worker',
    executionInput: { operation: 'validate_motion_studio_scene_preview_artifact' },
    sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'motion-studio-scene-preview-proof-report',
      artifactType: 'motion_studio_scene_preview_dependency_report',
      assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
      contentType: 'application/json', segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'], rendererLayerIds: [],
    }],
    dependencyKeys: ['motion-studio-scene-preview-root'], approvedToolIds: [],
    providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1,
    attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0,
    maximumCreditBudget: 1, required: true,
  }, {
    workItemKey: 'motion-studio-layered-preview-root',
    workItemType: 'render_remotion_preview',
    workerClass: 'render_worker',
    executionInput: {
      operation: CANONICAL_MOTION_STUDIO_REMOTION_PREVIEW_OPERATION,
      approvedToolOperationIds: [input.remotionOperationId],
      expectedOutputKeys: ['motion-studio-layered-preview-mp4'],
      motionStudioStorytellingAuthority: motionStudioLayeredBinding,
      structuredPayload: {
        compositionProfileId: 'motion_studio_native_layered_scene_v1',
        ...previewFrame,
        durationFrames: 120,
        sceneId: 'scene-storytelling-canonical-layered-1',
        sceneStartFrame: 0,
        sceneEndFrame: 120,
        semanticPurpose: 'Show approved layered Storytelling depth without changing the source authority.',
        headline: 'Show approved layered Storytelling depth without changing the source authority.',
        caption: 'Review · Show approved layered Storytelling depth without changing the source authority.',
        layerManifestDigest: '9'.repeat(64),
        depthModel: 'semantic_planes_v1',
        planes: [
          { planeId: 'background-plane', role: 'background', zIndex: 0, sourceKind: 'remotion_native', motionToken: 'ambient_drift' },
          { planeId: 'headline-plane', role: 'headline', zIndex: 10, sourceKind: 'remotion_native', motionToken: 'headline_reveal' },
          { planeId: 'subject-plane', role: 'subject', zIndex: 20, sourceKind: 'approved_cutout_slot', motionToken: 'subject_parallax' },
          { planeId: 'caption-plane', role: 'caption', zIndex: 30, sourceKind: 'remotion_native', motionToken: 'caption_hold' },
        ],
        panelBackground: '#0F172A',
        panelHighlight: '#16213E',
        headlineColor: '#E0F2FE',
        accentColor: '#FF4D8D',
        captionColor: '#F8FAFC',
        horizontalSafePercent: 8,
        verticalSafePercent: 8,
        captionBottomPercent: 9,
        captionAboveMask: true,
        contactObjectPresent: false,
        maskRisk: 'low_fixture_only',
      },
    },
    sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'motion-studio-layered-preview-mp4',
      artifactType: 'motion_studio_layered_private_preview_mp4',
      assetRole: 'preview', required: true, previewPlaceholderAllowed: false,
      contentType: 'video/mp4', segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'], rendererLayerIds: ['motion-studio-layered-preview-layer'],
    }],
    dependencyKeys: ['matrix-rembg-root'], approvedToolIds: ['remotion'], providerExecutionMode: 'none',
    fallbackPolicy: {}, maxAttempts: 2, attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0, maximumCreditBudget: 1, required: true,
  }, {
    workItemKey: 'motion-studio-layered-preview-proof',
    workItemType: 'run_asset_qa', workerClass: 'qa_worker',
    executionInput: { operation: 'validate_motion_studio_layered_preview_artifact' },
    sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'motion-studio-layered-preview-proof-report',
      artifactType: 'motion_studio_layered_preview_dependency_report',
      assetRole: 'qa', required: true, previewPlaceholderAllowed: false,
      contentType: 'application/json', segmentIds: ['segment-1'],
      timingIds: ['master-timing-plan'], rendererLayerIds: [],
    }],
    dependencyKeys: ['motion-studio-layered-preview-root'], approvedToolIds: [],
    providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1,
    attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0,
    maximumCreditBudget: 1, required: true,
  }]
}

function motionStudioPreviewFrame(
  frame: { width: number; height: number; fps: number },
): { width: 360 | 480 | 640; height: 360 | 480 | 600 | 640; fps: 24 | 30 } {
  const fps = frame.fps === 24 ? 24 : 30
  if (frame.width * 16 === frame.height * 9) return { width: 360, height: 640, fps }
  if (frame.width * 9 === frame.height * 16) return { width: 640, height: 360, fps }
  if (frame.width === frame.height) return { width: 480, height: 480, fps }
  if (frame.width * 5 === frame.height * 4) return { width: 480, height: 600, fps }
  throw new Error('Canonical Motion Studio smoke fixture needs a registered private-review aspect ratio.')
}

function createMotionStudioStorytellingStyleAuthority(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
}) {
  return {
    schemaVersion: 'canonical-storytelling-style-authority-v1' as const,
    sourceSchemaVersion: 'motion-studio.storytelling-style-plan-review-input.v1' as const,
    sourceAuthority: 'motion_studio_storytelling_style_planning_service' as const,
    evidenceClass: 'controlled_local_browser_relayed_server_prepared_content_addressed' as const,
    sourceRepositoryReverified: false as const,
    ...input,
    productionId: 'production-storytelling-canonical-dispatch',
    styleSelection: {
      schemaVersion: 'motion-studio.storytelling-style-selection.v1' as const,
      id: 'style-selection-storytelling-canonical',
      state: 'selected_for_plan' as const,
      selectionDigest: '1'.repeat(64),
      styleProfile: {
        styleProfileId: 'storytelling_style.editorial_collage' as const,
        styleProfileVersion: 'editorial-collage-v1',
        styleProfileDigest: '2'.repeat(64),
      },
      motionLanguage: {
        motionLanguageId: 'motion-language-editorial-collage',
        motionLanguageVersion: 'motion-language-v1',
        motionLanguageDigest: '3'.repeat(64),
      },
      motionDnaVersion: {
        artifactId: 'motion-dna-storytelling-canonical',
        versionId: 'motion-dna-version-1',
        versionNumber: 1,
        contentDigest: '4'.repeat(64),
      },
      referenceContractVersions: [{
        artifactId: 'reference-contract-storytelling-canonical',
        versionId: 'reference-contract-version-1',
        versionNumber: 1,
        contentDigest: '5'.repeat(64),
      }],
      sourceAuditDigests: ['6'.repeat(64)],
    },
    calibrationPlan: {
      schemaVersion: 'motion-studio.style-calibration-plan.v1' as const,
      id: 'style-calibration-storytelling-canonical',
      planDigest: '9'.repeat(64),
      styleSelectionDigest: '1'.repeat(64),
      routePolicyId: 'motion_studio_generation_route_policy_v2' as const,
      scenarioIds: [
        'calibration-style-led-motion',
        'calibration-character-continuity',
        'calibration-first-last-frame',
        'calibration-reference-heavy',
        'calibration-exact-text-data',
      ],
      scenarioKinds: [
        'style_led_motion',
        'character_continuity',
        'strict_first_last_frame',
        'reference_heavy',
        'exact_text_data',
      ] as Array<
        | 'style_led_motion'
        | 'character_continuity'
        | 'strict_first_last_frame'
        | 'reference_heavy'
        | 'exact_text_data'
      >,
      estimatedInternalCostRangeMicros: { minimum: 10_000, maximum: 50_000 },
      approvalState: 'planning_only' as const,
      automaticFallbackAllowed: false as const,
      fallbackRequiresNewApproval: true as const,
      bulkGenerationAllowed: false as const,
    },
    internalCostEnvelope: {
      schemaVersion: 'motion-studio-storytelling-style-internal-cost-envelope-v1' as const,
      estimateId: 'style-cost-envelope-storytelling-canonical',
      estimateDigest: 'a'.repeat(64),
      unit: 'usd_micros' as const,
      minimumEstimatedInternalProductionCostMicros: 10_000,
      maximumEstimatedInternalProductionCostMicros: 50_000,
      approvalState: 'estimate_only_pending_plan_approval' as const,
      internalProductionCostOnly: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    decisionAuthority: 'existing_plan_review' as const,
    planReviewIsSoleApprovalAuthority: true as const,
    changedStyleRequiresFreshPlanAndEstimate: true as const,
    historicalApprovedSnapshotRemainsImmutable: true as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
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
        width: 2160,
        height: 3840,
        timestampMs: 1000,
        fontSize: 97,
        marginV: 211,
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
      timingIds: ['master-timing-plan', 'caption-timing-1'],
      rendererLayerIds: ['libass-caption-overlay-layer-1'],
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
  }, {
    workItemKey: 'libass-caption-overlay-second',
    workItemType: 'custom',
    workerClass: 'render_worker',
    executionInput: {
      operation: 'render_approved_caption_overlay',
      approvedToolOperationIds: [input.libassOperationId],
      expectedOutputKeys: ['libass-caption-overlay-second-png'],
      structuredPayload: {
        captionProfileId: 'approved_ass_track_render_v1',
        fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
        collisionPolicy: 'fail_on_reserved_zone_collision',
        preserveSpeechTiming: true,
        width: 2160,
        height: 3840,
        timestampMs: 1000,
        fontSize: 97,
        marginV: 211,
        alignment: 2,
        caption: 'Approved second frame accurate caption',
      },
    },
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'libass-caption-overlay-second-png',
      artifactType: 'controlled_libass_caption_overlay_png',
      assetRole: 'processed',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'image/png',
      segmentIds: ['segment-2'],
      timingIds: ['master-timing-plan', 'caption-timing-2'],
      rendererLayerIds: ['libass-caption-overlay-layer-2'],
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
    workItemKey: 'libass-caption-overlay-second-proof',
    workItemType: 'run_asset_qa',
    workerClass: 'qa_worker',
    executionInput: { operation: 'validate_libass_caption_overlay_artifact' },
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [{
      outputKey: 'libass-caption-overlay-second-proof-report',
      artifactType: 'libass_caption_overlay_dependency_report',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: ['segment-2'],
      timingIds: ['master-timing-plan', 'caption-timing-2'],
      rendererLayerIds: [],
    }],
    dependencyKeys: ['libass-caption-overlay-second'],
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

async function expectApiErrorResult(
  action: () => Promise<unknown>,
  code: string,
): Promise<ApiError> {
  try {
    await action()
    assert.fail(`Expected ${code}.`)
  } catch (error) {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, code)
    return error
  }
  throw new Error(`Expected ${code}.`)
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function proveConsumptionReplayResponseSemantics(): void {
  const timestamp = new Date().toISOString()
  const hash = 'a'.repeat(64)
  const base = {
    schemaVersion: 'canonical-private-tool-dispatch-response-v2' as const,
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
    privateCompositionChunkAuthorized: false,
    creditSpendAuthorized: false as const,
    walletMutationAuthorized: false as const,
    settlementAuthorized: false as const,
    toolExecutionPerformedByConsume: false as const,
  }
}

async function readExactPrivateStream(stream: Readable, expectedByteLength: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (byteLength > expectedByteLength) {
      throw new Error('Private smoke stream exceeded its exact commitment.')
    }
    chunks.push(bytes)
  }
  if (byteLength !== expectedByteLength) {
    throw new Error('Private smoke stream ended before its exact commitment.')
  }
  return Buffer.concat(chunks, byteLength)
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
