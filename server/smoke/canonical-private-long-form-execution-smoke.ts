import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from '../../src/lib/approved-edit-execution-package-client'
import { buildCanonicalPlanningDraft } from '../../src/lib/canonical-planning-draft'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import { uploadFileToTemporaryObjectTarget } from '../../src/lib/temporary-object-upload-client'
import type { PlannerInput } from '../../src/types/reeditpro'
import { loadRuntimeEnv } from '../config/env'
import { createCanonicalEditExecutionPackageService } from '../services/canonical-edit-execution-package-service'
import { createCanonicalPlanningHandoffService } from '../services/canonical-planning-handoff-service'
import { createCanonicalPrivateFinalArtifactDownloadService } from '../services/canonical-private-final-artifact-download-service'
import { createCanonicalPrivateJobExecutionAdapterService } from '../services/canonical-private-job-execution-adapter-service'
import { createCanonicalPrivateWorkGraphOrchestratorService } from '../services/canonical-private-work-graph-orchestrator-service'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import { createLargeMediaFinalizationService } from '../services/large-media-finalization-service'
import { readPrivateCanonicalWorkerLeaseAggregate } from '../services/private-canonical-worker-lease-store'
import { readPrivateEditAuthorityAggregate } from '../services/private-edit-authority-store'
import { createPrivateArtifactQaAuthorityService } from '../services/private-artifact-qa-authority-service'
import { createUploadService } from '../services/upload-service'
import { activatePrivateOfflineLibassCaptionRuntime } from '../tool-execution/libass-caption-execution'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  activatePrivateOfflineMediaBinaryRuntime,
  validateOfflineFfprobeStreamingExecutionRequest,
} from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
  validateOfflineRemotionLongFormMergePlanningPayload,
} from '../tool-execution/remotion-render-execution'
import type { ServiceContext } from '../types'
import {
  createCanonicalPlanningHandoffSchema,
  publishCanonicalEditPlanFromHandoffSchema,
} from '../validation/canonical-planning-handoff-schemas'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'
import { LocalBackedResumableGcsTestAdapter } from './support/local-backed-resumable-gcs-adapter'

// Reuse only the signed-in workspace/project authority fixture. This scenario
// creates its own edit session, source uploads, plan, reservation, jobs, leases,
// artifacts, chunk renders, final merge, final QA, replay, and private download.
await import('./edit-planning-authority-smoke')

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const userId = 'user-authority-smoke'
const sourceSliceMode = process.env.REEDITPRO_SOURCE_SLICE_LONG_FORM_PROOF === '1'
const scenarioKey = sourceSliceMode ? 'source-slice-v2' : 'source-boundary-v1'
const editSessionId = sourceSliceMode
  ? 'edit-session-canonical-source-slice-long-form-execution'
  : 'edit-session-canonical-long-form-execution'
const sourceCount = sourceSliceMode ? 1 : 8
const sourceDurationSeconds = sourceSliceMode ? 22 : 3
const fps = 30
const totalFrames = sourceCount * sourceDurationSeconds * fps
const storage = new LocalBackedResumableGcsTestAdapter(
  join(localStorageRoot, `canonical-long-form-${scenarioKey}-fake-gcs`),
)
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  SUPABASE_URL: 'https://canonical-long-form-smoke.supabase.co',
  SUPABASE_ANON_KEY: 'canonical-long-form-smoke-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'canonical-long-form-smoke-service-role',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'rp-long-form-local-secret-7Fq3Zm8Wt5Ks2Nv9Bc6Lp4Rd',
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const context: ServiceContext = {
  env,
  clients: {
    admin: createMembershipAdminClient([{ workspaceId, userId, role: 'owner' }]),
    public: null,
  },
  requestId: `canonical-private-long-form-execution-smoke-${scenarioKey}`,
  auth: {
    userId,
    accessToken: 'verified-canonical-long-form-smoke-token',
    isMockUser: false,
  },
  storageAdapter: storage,
}

const seedAggregate = await requireEditAuthority()
const seedSnapshot = seedAggregate.snapshots.find((candidate) =>
  seedAggregate.executionPackages.some((executionPackage) =>
    executionPackage.snapshotId === candidate.snapshotId))
assert.ok(seedSnapshot)
const projectId = seedSnapshot.projectId

const preferenceService = createExactEditPreferenceService(context)
const initializedPreference = await preferenceService.initialize({
  workspaceId,
  projectId,
  editSessionId,
  idempotencyKey: `initialize-canonical-long-form-preferences-${scenarioKey}`,
})
const updatedPreference = await preferenceService.updateCurrent({
  workspaceId,
  projectId,
  editSessionId,
  expectedRevision: initializedPreference.preferenceRecord.recordRevision,
  patch: {
    editLevel: 'pro',
    targetPlatform: 'youtube',
    cleanupPreference: 'preserve_natural',
  },
  idempotencyKey: `update-canonical-long-form-preferences-${scenarioKey}`,
})
const planningPreference = await preferenceService.recordPlanningEvidence({
  workspaceId,
  projectId,
  editSessionId,
  expectedRevision: updatedPreference.preferenceRecord.recordRevision,
  sourcePreparation: {
    status: 'ready',
    evidenceHash: sha256Text(`canonical-long-form-source-ready-${scenarioKey}`),
  },
  frameConfirmation: {
    status: 'confirmed',
    aspectRatio: '16:9',
    confirmationId: `canonical-long-form-frame-confirmation-${scenarioKey}`,
  },
  idempotencyKey: `record-canonical-long-form-planning-evidence-${scenarioKey}`,
})

const sourceFixture = await createSourceFixture()
const uploadedSources = []
try {
  for (let index = 0; index < sourceCount; index += 1) {
    uploadedSources.push(await uploadSource(projectId, sourceFixture, index + 1))
  }
} finally {
  await rm(sourceFixture.path, { force: true })
}
assert.equal(uploadedSources.length, sourceCount)
assert.equal(uploadedSources.every((source) =>
  source.mediaAsset.sourceMetadata?.durationSeconds === sourceDurationSeconds &&
  source.mediaAsset.sourceMetadata.hasVideo === true &&
  source.mediaAsset.sourceMetadata.hasAudio === true), true)

const plannerInput: PlannerInput = {
  projectName: `Canonical long-form private execution ${scenarioKey}`,
  targetPlatform: planningPreference.preferenceRecord.values.targetPlatform,
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'youtube_side_panel',
  editingCategory: 'business_brand',
  workflowType: 'product_demo',
  editLevel: planningPreference.preferenceRecord.values.editLevel,
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions: sourceSliceMode
    ? 'Preserve the complete approved source and original audio continuously with exact captions. Do not add cuts, music, SFX, beat sync, or decorative transitions.'
    : 'Preserve all eight approved sources in order with exact captions. Use only hard cuts. Use clean voice only with no music, no SFX, no beat sync, and no decorative transitions.',
  userInstructionHistory: [
    sourceSliceMode
      ? 'Preserve the complete approved source and original audio continuously with exact captions. Do not add cuts, music, SFX, beat sync, or decorative transitions.'
      : 'Preserve all eight approved sources in order with exact captions. Use only hard cuts. Use clean voice only with no music, no SFX, no beat sync, and no decorative transitions.',
  ],
  creditPreference: 'balanced',
  clips: uploadedSources.map((source, index) => ({
    id: `canonical-long-form-${scenarioKey}-clip-${index + 1}`,
    uploadedOrder: index + 1,
    fileName: source.mediaAsset.fileName,
    duration: sourceSliceMode ? '00:22' : '00:03',
    detectedType: 'Primary source',
    sourceRole: index === 0 ? 'main_story' as const : 'context' as const,
    notes: sourceSliceMode
      ? 'The complete approved source is required and already has acceptable source audio/color.'
      : `Approved long-form source ${index + 1} is finalized in exact order.`,
  })),
  sourceSequenceMode: sourceSliceMode
    ? 'single_complete_video'
    : 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: planningPreference.preferenceRecord.values.cleanupPreference,
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: planningPreference.preferenceRecord.baseline.preferenceSnapshotId,
  currentEditPreferenceRevision: planningPreference.preferenceRecord.preferenceRevision,
}
const sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] =
  uploadedSources.map((source, index) => {
    const storageProvider = source.mediaAsset.storageProvider
    if (!isClientSourceStorageProvider(storageProvider) || source.mediaAsset.sizeBytes === undefined) {
      throw new Error('Finalized long-form source is missing durable private storage identity.')
    }
    return {
      mediaAssetId: source.mediaAsset.id,
      sourceSequenceItemId: `canonical-long-form-${scenarioKey}-source-${index + 1}`,
      uploadedClipId: plannerInput.clips[index]!.id,
      uploadedOrder: index + 1,
      storageProvider,
      storageBucket: source.mediaAsset.storageBucket,
      storagePath: source.mediaAsset.storagePath,
      fileName: source.mediaAsset.fileName,
      mimeType: source.mediaAsset.mimeType,
      byteSize: source.mediaAsset.sizeBytes,
      checksumSha256: source.mediaAsset.checksumSha256,
      sourceMetadata: source.mediaAsset.sourceMetadata,
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    }
  })

const plan = createMockEditPlan(plannerInput)
assert.equal(plan.masterTimingPlan?.timingBase.totalFrames, totalFrames)
if (sourceSliceMode) {
  assert.ok(plan.masterTimingPlan)
  assert.ok(plan.soundSyncTransitionTimingPlan)
  const originalCaption = plan.masterTimingPlan.captionTimingItems[0]
  assert.ok(originalCaption)
  plan.audioPipelinePlan = undefined
  plan.colorPipelinePlan = undefined
  plan.segmentEditPlans = []
  plan.masterTimingPlan.finalTimelineSegments = []
  plan.masterTimingPlan.transitionTimingItems = []
  plan.masterTimingPlan.visualTimingItems = []
  plan.masterTimingPlan.sfxTimingItems = []
  plan.masterTimingPlan.musicDuckingTimingItems = []
  plan.masterTimingPlan.providerClipTimingItems = []
  plan.masterTimingPlan.captionTimingItems = [{
    ...originalCaption,
    id: 'caption-timing-complete-approved-source',
    captionText: 'Preserve the complete approved source.',
    timeRange: {
      startSeconds: 0,
      endSeconds: sourceDurationSeconds,
      durationSeconds: sourceDurationSeconds,
      startFrame: 0,
      endFrame: totalFrames,
      durationFrames: totalFrames,
      fps,
    },
  }]
  plan.soundSyncTransitionTimingPlan.refinedTransitionTimings = []
  plan.soundSyncTransitionTimingPlan.refinedSfxTimings = []
  plan.soundSyncTransitionTimingPlan.refinedMusicDuckingTimings = []
}
const draft = buildCanonicalPlanningDraft({ plan, plannerInput, sourceMediaAssets })
if (!draft.ok || !draft.draft.publication) {
  throw new Error(
    `Long-form canonical plan did not publish: ${
      draft.ok ? draft.draft.publicationBlockers.join(' | ') : draft.errors.join(' | ')
    }`,
  )
}
const canonicalPlan = draft.draft.publication.canonicalPlan
const chunkDrafts = canonicalPlan.workItems.filter((workItem) =>
  workItem.executionInput.operation === 'render_approved_4k_composition_chunk')
const mergeDraft = canonicalPlan.workItems.find((workItem) =>
  workItem.executionInput.operation === 'merge_approved_4k_composition_chunks')
const expectedChunkCount = sourceSliceMode ? 3 : 2
const expectedChunkDurations = sourceSliceMode ? [220, 220, 220] : [450, 270]
assert.equal(chunkDrafts.length, expectedChunkCount)
assert.ok(mergeDraft)
const mergePayload = validateOfflineRemotionLongFormMergePlanningPayload(
  mergeDraft!.executionInput.structuredPayload,
)
assert.equal(mergePayload.durationFrames, totalFrames)
assert.deepEqual(
  mergePayload.chunks.map((chunk) => chunk.durationFrames),
  expectedChunkDurations,
)
if (sourceSliceMode) {
  assert.equal(
    mergePayload.longFormCapacityProfileId,
    'canonical_private_4k_source_slice_chunk_merge_3840_frames_v2',
  )
  assert.equal(mergePayload.chunkBoundaryTransitions.length, 0)
  assert.ok('chunkBoundaryContinuity' in mergePayload)
  assert.equal(mergePayload.chunkBoundaryContinuity.length, expectedChunkCount - 1)
  assert.deepEqual(mergePayload.chunks.map((chunk) => ({
    sourceSliceKey: chunk.sourceSliceKey,
    sourceStartFrame: chunk.sourceStartFrame,
    sourceEndFrameExclusive: chunk.sourceEndFrameExclusive,
  })), [{
    sourceSliceKey: 'source-slice-1-of-3',
    sourceStartFrame: 0,
    sourceEndFrameExclusive: 220,
  }, {
    sourceSliceKey: 'source-slice-2-of-3',
    sourceStartFrame: 220,
    sourceEndFrameExclusive: 440,
  }, {
    sourceSliceKey: 'source-slice-3-of-3',
    sourceStartFrame: 440,
    sourceEndFrameExclusive: 660,
  }])
}

const planningHandoffService = createCanonicalPlanningHandoffService(context)
const handoff = await planningHandoffService.prepare({
  ...createCanonicalPlanningHandoffSchema.parse({
    workspaceId,
    purpose: 'prepare_canonical_planning_handoff',
    orderedSourceItems: draft.draft.orderedSourceItems,
    canonicalPlanComponents: draft.draft.components,
  }),
  projectId,
  editSessionId,
})
const published = await planningHandoffService.publishFromPersistedHandoff({
  ...publishCanonicalEditPlanFromHandoffSchema.parse({
    workspaceId,
    planningRequestId: `publish-canonical-long-form-plan-${scenarioKey}`,
    expectedHandoffHash: handoff.handoffHash,
    canonicalPlan,
  }),
  projectId,
  editSessionId,
  handoffId: handoff.handoffId,
  idempotencyKey: `publish-canonical-long-form-plan-${scenarioKey}`,
})
const publishedAuthority = asRecord(published.authority)
const publishedPlan = asRecord(publishedAuthority.plan)
const publishedEstimate = asRecord(publishedAuthority.estimate)
const planningService = createEditPlanningAuthorityService(context)
const approved = await planningService.approveAndFundCanonicalPlan({
  workspaceId,
  editPlanId: String(publishedPlan.id),
  expectedAuthorityRevision: Number(publishedAuthority.authorityRevision),
  expectedPlanHash: String(publishedPlan.planHash),
  expectedEstimateHash: String(publishedEstimate.estimateHash),
  idempotencyKey: `approve-canonical-long-form-plan-${scenarioKey}`,
})
const approvedSnapshot = asRecord(asRecord(approved.authority).snapshot)
const packaged = await createCanonicalEditExecutionPackageService(context).createPackage({
  workspaceId,
  approvedPlanSnapshotId: String(approvedSnapshot.snapshotId),
  expectedSnapshotHash: String(approvedSnapshot.snapshotHash),
  purpose: 'private_internal_execution_handoff',
  idempotencyKey: `package-canonical-long-form-plan-${scenarioKey}`,
})

const aggregate = await requireEditAuthority()
const snapshot = aggregate.snapshots.find((candidate) =>
  candidate.snapshotId === approvedSnapshot.snapshotId)
assert.ok(snapshot)
const approvedWorkItems = aggregate.approvedWorkItems.filter((candidate) =>
  candidate.snapshotId === snapshot.snapshotId)
const jobs = aggregate.jobs.filter((candidate) => candidate.snapshotId === snapshot.snapshotId)
const expectedJobCount = sourceSliceMode ? 8 : 29
assert.equal(approvedWorkItems.length, expectedJobCount)
assert.equal(jobs.length, expectedJobCount)
const jobByKey = new Map(approvedWorkItems.map((workItem) => {
  const job = jobs.find((candidate) => candidate.approvedWorkItemId === workItem.id)
  assert.ok(job)
  return [workItem.workItemKey, job] as const
}))
const executionAuthority = await planningService.loadApprovedExecutionAuthority(
  snapshot.snapshotId,
  workspaceId,
)
const assetByKey = new Map(approvedWorkItems.map((workItem) => {
  const asset = executionAuthority.assetManifest.entries.find((candidate) =>
    candidate.approvedWorkItemId === workItem.id)
  assert.ok(asset)
  return [workItem.workItemKey, asset] as const
}))
assert.deepEqual(
  jobByKey.get('final-export')!.dependencyJobIds,
  chunkDrafts.map((chunk) => jobByKey.get(chunk.workItemKey)!.id),
)

const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
await activatePrivateOfflineLibassCaptionRuntime()
await prepareOfflineRemotionDockerRuntime()
await activatePrivateOfflineRemotionRenderRuntime()
const workGraphStartedAt = Date.now()
const workGraphService = createCanonicalPrivateWorkGraphOrchestratorService(context)
const workGraphAttempts: Array<Awaited<ReturnType<typeof workGraphService.run>>> = []
let workGraphRun: Awaited<ReturnType<typeof workGraphService.run>> | undefined
const maximumWorkGraphPasses = 1 + canonicalPlan.workItems.reduce(
  (total, workItem) => total + Math.max(0, workItem.maxAttempts - 1),
  0,
)
for (let attempt = 1; attempt <= maximumWorkGraphPasses; attempt += 1) {
  workGraphRun = await workGraphService.run({
    workspaceId,
    packageRecordId: packaged.approvedEditExecutionPackage.packageRecordId,
    purpose: 'run_canonical_private_work_graph',
    idempotencyKey:
      `run-canonical-long-form-resource-waves-${scenarioKey}-attempt-${attempt}`,
  })
  workGraphAttempts.push(workGraphRun)
  if (workGraphRun.status === 'completed_private_test_work_graph') break
  const retryAvailable = workGraphRun.jobs.some((job) =>
    job.status === 'failed_retry_available')
  if (!retryAvailable || attempt === maximumWorkGraphPasses) break
}
const workGraphElapsedMilliseconds = Date.now() - workGraphStartedAt
assert.ok(workGraphRun)
assert.equal(workGraphRun.status, 'completed_private_test_work_graph')
assert.equal(workGraphRun.summary.totalJobCount, expectedJobCount)
assert.equal(workGraphRun.summary.completedJobCount, expectedJobCount)
assert.equal(workGraphRun.summary.requiredBlockedJobCount, 0)
assert.equal(workGraphRun.summary.allRequiredJobsCompleted, true)
assert.equal(workGraphAttempts.every((attempt) => Boolean(attempt.scheduling)), true)
const schedulingAttempts = workGraphAttempts.map((attempt) => attempt.scheduling!)
const schedulerJobObservationCount = schedulingAttempts.reduce(
  (total, scheduling) => total + scheduling.actualExecutionCount,
  0,
)
assert.equal(workGraphRun.scheduling?.actualExecutionCount, expectedJobCount)
assert.equal(schedulingAttempts.every((scheduling) =>
  scheduling.actualExecutionCount >= 1 &&
  scheduling.actualExecutionCount <= expectedJobCount), true)
workGraphAttempts.slice(1).forEach((attempt, index) => {
  const previous = workGraphAttempts[index]!
  const retryKeys = previous.jobs.filter((job) =>
    job.status === 'failed_retry_available').map((job) => job.workItemKey)
  assert.ok(retryKeys.length >= 1)
  assert.equal(attempt.summary.replayedJobCount, previous.summary.completedJobCount)
  assert.ok(attempt.summary.completedJobCount >= previous.summary.completedJobCount)
  assert.equal(attempt.jobs.every((job) => {
    const previousJob = previous.jobs.find((candidate) =>
      candidate.workItemKey === job.workItemKey)
    return previousJob?.status !== 'completed_private_test' || (
      job.status === 'completed_private_test' && job.adapterReplayed
    )
  }), true)
})
assert.ok(schedulingAttempts.some((scheduling) => scheduling.waveCount > 1))
assert.ok(schedulingAttempts.some((scheduling) => scheduling.parallelWaveCount > 0))
assert.ok(schedulingAttempts.some((scheduling) => scheduling.maximumWaveWidth > 1))
assert.ok(schedulingAttempts.some((scheduling) => scheduling.observedPeakConcurrency > 1))
assert.ok(schedulingAttempts.every((scheduling) =>
  scheduling.observedPeakConcurrency <= 4 &&
  !scheduling.cloudDispatchAuthorized &&
  !scheduling.distributedExecutionProven &&
  !scheduling.physicalWorkerProcessConcurrencyProven &&
  !scheduling.cloudWorkerConcurrencyProven &&
  !scheduling.performanceSlaProven &&
  !scheduling.immutableSnapshotPlacementBindingProven))
const adapter = createCanonicalPrivateJobExecutionAdapterService(context)
const executed = new Map<string, Awaited<ReturnType<typeof adapter.execute>>>()
for (const workItem of canonicalPlan.workItems) {
  console.log(JSON.stringify({
    smoke: 'canonical_private_long_form_execution',
    phase: 'read_job_replay',
    workItemKey: workItem.workItemKey,
    operation: workItem.executionInput.operation,
  }))
  const response = await executeJob(workItem.workItemKey)
  executed.set(workItem.workItemKey, response)
  assert.equal(response.result.qaOutcome, 'passed')
  assert.equal(response.result.privateTestDependencySatisfied, true)
  assert.equal(response.result.liveRuntimeDependencySatisfied, false)
  assert.equal(response.result.finalRenderAuthorized, false)
  assert.equal(response.permissions.publicDelivery, false)
  assert.equal(response.permissions.customerCreditMutation, false)
  assert.equal(response.permissions.billing, false)
  assert.equal(response.readiness.productReady, false)
  assert.equal(response.evidence.idempotentAdapterReplay, true)
}

const chunks = chunkDrafts.map((chunk) => executed.get(chunk.workItemKey)!)
assert.equal(chunks.every((chunk) =>
  chunk.identity.canonicalToolId === 'remotion' &&
  chunk.result.contentType === 'video/mp4' &&
  chunk.evidence.sourceStreamInputVerified &&
  chunk.evidence.sourceStagingCleanupVerified), true)
for (const chunkDraft of chunkDrafts) {
  const chunk = executed.get(chunkDraft.workItemKey)!
  const artifactAuthority = await createPrivateArtifactQaAuthorityService(context)
    .readArtifactAuthority({
      workspaceId,
      projectId,
      editSessionId,
      snapshotId: snapshot.snapshotId,
      jobId: jobByKey.get(chunkDraft.workItemKey)!.id,
      expectedAssetId: assetByKey.get(chunkDraft.workItemKey)!.id,
      artifactId: chunk.result.artifactId,
      purpose: 'read_private_artifact_qa_authority',
    })
  assert.equal(artifactAuthority.artifact.lineage.assetRole, 'processed')
  assert.equal(artifactAuthority.qaEvaluation?.outcome, 'passed')
  assert.equal(
    artifactAuthority.reconciliation?.decision,
    'test_merged_not_live_authorized',
  )
}

const merge = executed.get('final-export')!
assert.equal(merge.identity.canonicalToolId, 'remotion')
assert.equal(merge.result.contentType, 'video/mp4')
assert.equal(merge.evidence.dependencyArtifactInput, true)
assert.equal(merge.evidence.dependencyStreamInputVerified, true)
assert.equal(merge.evidence.finalArtifactQaPassed, true)
const finalQa = executed.get('final-qa')!
assert.equal(finalQa.identity.canonicalToolId, 'ffprobe')
assert.equal(finalQa.evidence.dependencyArtifactInput, true)
assert.equal(finalQa.evidence.finalArtifactQaPassed, true)

const chunkReplay = await executeJob('composition-chunk-2')
assert.equal(chunkReplay.result.artifactId, chunks[1]!.result.artifactId)
assert.equal(chunkReplay.evidence.idempotentAdapterReplay, true)
const mergeReplay = await executeJob('final-export')
assert.equal(mergeReplay.result.artifactId, merge.result.artifactId)
assert.equal(mergeReplay.result.sha256, merge.result.sha256)
assert.equal(mergeReplay.evidence.idempotentAdapterReplay, true)

const leaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId,
})
const completedMergeLease = leaseAggregate?.leases.find((lease) =>
  lease.jobId === jobByKey.get('final-export')!.id &&
  lease.executionFence.state === 'completed')
assert.ok(completedMergeLease)
assert.equal(
  completedMergeLease.dependencyAuthority.selectedArtifacts.length,
  expectedChunkCount,
)
assert.deepEqual(
  completedMergeLease.dependencyAuthority.selectedArtifacts.map((artifact) => artifact.artifactId),
  chunks.map((chunk) => chunk.result.artifactId),
)

const privateDownload = await createCanonicalPrivateFinalArtifactDownloadService(context).read({
  workspaceId,
  projectId,
  editSessionId,
  snapshotId: snapshot.snapshotId,
  jobId: jobByKey.get('final-export')!.id,
  expectedAssetId: assetByKey.get('final-export')!.id,
  artifactId: merge.result.artifactId,
  purpose: 'download_canonical_private_final_artifact',
})
assert.equal(privateDownload.mimeType, 'video/mp4')
assert.equal(privateDownload.sha256, merge.result.sha256)
assert.equal(privateDownload.publicUrlCreated, false)
assert.equal(privateDownload.signedUrlCreated, false)
assert.equal(privateDownload.billingMutationPerformed, false)
assert.equal(privateDownload.settlementPerformed, false)
assert.equal(privateDownload.deliveryProfileId, 'uhd_2160')
assert.equal(privateDownload.width, 3840)
assert.equal(privateDownload.height, 2160)
assert.equal(privateDownload.originalApprovedEstimateReused, true)
assert.equal(privateDownload.originalApprovedReservationReused, true)
assert.equal(privateDownload.secondEstimateCreated, false)
assert.equal(privateDownload.secondReservationCreated, false)
assert.equal(privateDownload.exportCreditMutationPerformed, false)
const downloadCommitment = await hashExactPrivateStream(
  await privateDownload.openStream(),
  privateDownload.byteSize,
)
assert.equal(downloadCommitment.sha256, merge.result.sha256)
assert.equal(downloadCommitment.signature.subarray(4, 8).toString('ascii'), 'ftyp')

const deliveryProbe = await mediaRuntime.executeServerInjected(
  validateOfflineFfprobeStreamingExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
    toolId: 'ffprobe',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    payload: {
      inspectionProfileId: 'final_export_v1',
      countFrames: true,
      verifyDurationAndSync: true,
      emitMachineJsonOnly: true,
      mimeType: 'video/mp4',
      sourceByteLength: privateDownload.byteSize,
      sourceSha256: privateDownload.sha256,
      sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
    },
  }),
  {
    inputMode: 'private_verified_stream_v1',
    byteLength: privateDownload.byteSize,
    sha256: privateDownload.sha256,
    openStream: () => privateDownload.openStream(),
  },
)
assert.ok('resultJson' in deliveryProbe)
const streams = deliveryProbe.resultJson.document.streams as Array<Record<string, unknown>>
const video = streams.find((stream) => stream.codecType === 'video')
const audio = streams.find((stream) => stream.codecType === 'audio')
assert.deepEqual({
  codecName: video?.codecName,
  width: video?.width,
  height: video?.height,
  fps: video?.fps,
  frameCount: video?.readFrameCount,
  pixelFormat: video?.pixelFormat,
  colorSpace: video?.colorSpace,
}, {
  codecName: 'h264',
  width: 3840,
  height: 2160,
  fps,
  frameCount: totalFrames,
  pixelFormat: 'yuv420p',
  colorSpace: 'bt709',
})
assert.deepEqual({
  codecName: audio?.codecName,
  sampleRate: audio?.sampleRate,
  channels: audio?.channels,
}, {
  codecName: 'aac',
  sampleRate: 48_000,
  channels: 2,
})
const approvedSourceSliceBoundaryFrames = 'chunkBoundaryContinuity' in mergePayload
  ? mergePayload.chunkBoundaryContinuity.map((boundary) => boundary.boundaryFrame)
  : []
if (sourceSliceMode) assert.equal(approvedSourceSliceBoundaryFrames.length, 2)
const sourceSliceAudioContinuity = sourceSliceMode
  ? await inspectSourceSliceAudioContinuity(
      await privateDownload.openStream(),
      approvedSourceSliceBoundaryFrames,
    )
  : null

console.log(JSON.stringify({
  smoke: 'canonical_private_long_form_execution',
  status: 'passed',
  scenarioKey,
  signedInUserId: userId,
  sourceCount,
  sourceDurationSeconds,
  totalFrames,
  approvedWorkItemCount: approvedWorkItems.length,
  completedJobCount: executed.size,
  resourceScheduling: {
    attemptCount: schedulingAttempts.length,
    schedulerJobObservationCount,
    attempts: schedulingAttempts,
  },
  resourceWaveExecutionTiming: {
    elapsedMilliseconds: workGraphElapsedMilliseconds,
    elapsedMinutes: Number((workGraphElapsedMilliseconds / 60_000).toFixed(2)),
    includesLocalContainerStartup: true,
    benchmarkQualified: false,
    performanceSlaProven: false,
  },
  chunkArtifacts: chunks.map((chunk, index) => ({
    chunkIndex: index + 1,
    artifactId: chunk.result.artifactId,
    sha256: chunk.result.sha256,
    byteLength: chunk.result.byteLength,
  })),
  finalArtifact: {
    artifactId: merge.result.artifactId,
    sha256: merge.result.sha256,
    byteLength: merge.result.byteLength,
    width: video?.width,
    height: video?.height,
    fps: video?.fps,
    frameCount: video?.readFrameCount,
    sourceSliceAudioContinuity,
  },
  proofs: [
    'signed_in_workspace_scoped_canonical_authority',
    sourceSliceMode
      ? 'one_22_second_private_source_and_immutable_approved_snapshot'
      : 'eight_private_uploaded_sources_and_immutable_approved_snapshot',
    'original_4k_estimate_and_reservation_reused_without_export_recharge',
    `${expectedJobCount}_of_${expectedJobCount}_required_jobs_completed`,
    `${expectedJobCount}_jobs_executed_through_server_derived_resource_aware_dependency_waves`,
    'bounded_overlapping_orchestrator_execution_tasks_observed_on_one_private_host',
    `${expectedChunkCount}_private_4k_chunk_renders_each_independently_ffprobe_qa_reconciled`,
    sourceSliceMode
      ? 'exact_source_slice_ranges_and_continuity_records_preserved_without_invented_cuts'
      : 'approved_source_boundary_hard_cuts_preserved',
    'final_merge_reads_only_lease_selected_qa_passed_chunk_streams',
    `final_${totalFrames}_frame_4k_h264_aac_master_independently_ffprobe_qa_reconciled`,
    'chunk_and_final_adapter_replay_are_content_stable',
    'private_download_hash_and_ffprobe_match_recorded_final_artifact',
    'provider_billing_public_delivery_settlement_and_production_authority_remain_false',
  ],
}))

async function executeJob(workItemKey: string) {
  const job = jobByKey.get(workItemKey)
  if (!job) throw new Error(`Missing canonical long-form job: ${workItemKey}`)
  return adapter.execute({
    workspaceId,
    projectId,
    editSessionId,
    jobId: job.id,
    purpose: 'execute_canonical_private_job',
    idempotencyKey: `execute-canonical-long-form-${scenarioKey}-${workItemKey}`,
  })
}

async function requireEditAuthority() {
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId,
  })
  assert.ok(aggregate)
  return aggregate
}

async function createSourceFixture(): Promise<{ path: string; bytes: Buffer; sha256: string }> {
  const path = join(
    '/tmp',
    `reeditpro-canonical-long-form-${scenarioKey}-source-${process.pid}.mp4`,
  )
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    `testsrc2=size=640x360:rate=${fps}:duration=${sourceDurationSeconds}`,
    '-f', 'lavfi', '-i', `sine=frequency=440:sample_rate=48000:duration=${sourceDurationSeconds}`,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
    '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-colorspace', 'bt709', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '128k', '-threads', '1', '-y', path,
  ], { encoding: 'utf8' })
  if (generated.status !== 0) {
    throw new Error(`Unable to generate long-form source fixture: ${generated.stderr.slice(0, 500)}`)
  }
  const bytes = await readFile(path)
  return { path, bytes, sha256: createHash('sha256').update(bytes).digest('hex') }
}

async function uploadSource(
  projectId: string,
  fixture: { bytes: Buffer; sha256: string },
  index: number,
) {
  const uploadService = createUploadService(context)
  const created = await uploadService.createUploadIntent({
    workspaceId,
    projectId,
    uploadPurpose: 'source_media',
    originalFileName: `canonical-long-form-${scenarioKey}-source-${index}.mp4`,
    mimeType: 'video/mp4',
    expectedSizeBytes: fixture.bytes.byteLength,
    checksumSha256: fixture.sha256,
    idempotencyKey: `canonical-long-form-${scenarioKey}-source-${index}-upload-intent`,
  })
  const uploaded = await uploadFileToTemporaryObjectTarget({
    apiBaseUrl: 'https://api.reeditpro.invalid',
    authorization: 'Bearer canonical-long-form-browser-token-must-not-leak',
    fetchImpl: storage.fetch,
    file: new Blob([Uint8Array.from(fixture.bytes)], { type: 'video/mp4' }),
    mimeType: 'video/mp4',
    target: created.uploadTarget,
    retryDelayMs: 0,
  })
  assert.equal(uploaded.uploadedBytes, fixture.bytes.byteLength)
  const candidate = await uploadService.getUploadFinalizationCandidate(
    created.uploadIntent.id,
    workspaceId,
  )
  if (candidate.backgroundFinalizationRequired) {
    const finalizationService = createLargeMediaFinalizationService(context)
    const queued = await finalizationService.enqueue({
      workspaceId,
      uploadIntentId: created.uploadIntent.id,
      suppliedSizeBytes: fixture.bytes.byteLength,
      idempotencyKey:
        `canonical-long-form-${scenarioKey}-source-${index}-finalization-job`,
    })
    const completed = await finalizationService.run({ workspaceId, jobId: queued.job.jobId })
    assert.equal(completed.job.status, 'completed')
  }
  return uploadService.finalizeUploadIntent({
    workspaceId,
    uploadIntentId: created.uploadIntent.id,
  })
}

function createMembershipAdminClient(
  memberships: Array<{ workspaceId: string; userId: string; role: string }>,
): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') {
        throw new Error(`Unexpected long-form smoke table: ${tableName}`)
      }
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
            candidate.workspaceId === selectedWorkspaceId &&
            candidate.userId === selectedUserId)
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

function isClientSourceStorageProvider(
  value: unknown,
): value is ApprovedEditExecutionUploadedMediaSourceAssetClientInput['storageProvider'] {
  return value === 'local_private' ||
    value === 'google_cloud_storage' ||
    value === 'supabase_storage'
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a canonical authority object.')
  }
  return value as Record<string, unknown>
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function hashExactPrivateStream(
  stream: Readable,
  expectedByteLength: number,
): Promise<{ sha256: string; signature: Buffer }> {
  const checksum = createHash('sha256')
  const signatureChunks: Buffer[] = []
  let signatureByteLength = 0
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (byteLength > expectedByteLength) {
      throw new Error('Private long-form smoke stream exceeded its exact commitment.')
    }
    checksum.update(bytes)
    if (signatureByteLength < 8) {
      const part = bytes.subarray(0, Math.min(bytes.byteLength, 8 - signatureByteLength))
      signatureChunks.push(Buffer.from(part))
      signatureByteLength += part.byteLength
    }
  }
  if (byteLength !== expectedByteLength) {
    throw new Error('Private long-form smoke stream ended before its exact commitment.')
  }
  return {
    sha256: checksum.digest('hex'),
    signature: Buffer.concat(signatureChunks, signatureByteLength),
  }
}

async function inspectSourceSliceAudioContinuity(
  stream: Readable,
  boundaryFrames: number[],
): Promise<{
  sampleCount: number
  durationSeconds: number
  boundaries: Array<{
    frame: number
    sample: number
    adjacentDelta: number
    rmsBefore: number
    rmsAfter: number
  }>
}> {
  const child = spawn('ffmpeg', [
    '-v', 'error', '-i', 'pipe:0', '-map', '0:a:0',
    '-ac', '1', '-ar', '48000', '-f', 'f32le', 'pipe:1',
  ], { stdio: ['pipe', 'pipe', 'pipe'] })
  const stdout = readBoundedProcessStream(child.stdout, 8 * 1024 * 1024)
  const stderr = readBoundedProcessStream(child.stderr, 64 * 1024)
  const exited = new Promise<number | null>((resolve, reject) => {
    child.once('error', reject)
    child.once('close', resolve)
  })
  await pipeline(stream, child.stdin)
  const [exitCode, pcm, errorBytes] = await Promise.all([exited, stdout, stderr])
  if (exitCode !== 0 || errorBytes.length > 0 || pcm.length % 4 !== 0) {
    throw new Error(
      `Unable to decode final source-slice audio continuity: ${errorBytes.toString('utf8').slice(-500)}`,
    )
  }
  const sampleCount = pcm.length / 4
  const expectedSamples = Math.round(totalFrames / fps * 48_000)
  assert.ok(sampleCount >= expectedSamples)
  assert.ok(sampleCount <= expectedSamples + 4_096)
  const sample = (index: number) => pcm.readFloatLE(index * 4)
  const rms = (start: number, end: number) => {
    let squareSum = 0
    for (let index = start; index < end; index += 1) {
      squareSum += sample(index) ** 2
    }
    return Math.sqrt(squareSum / (end - start))
  }
  const boundaries = boundaryFrames.map((frame) => {
    const boundarySample = Math.round(frame / fps * 48_000)
    const evidence = {
      frame,
      sample: boundarySample,
      adjacentDelta: Math.abs(sample(boundarySample) - sample(boundarySample - 1)),
      rmsBefore: rms(boundarySample - 4_800, boundarySample),
      rmsAfter: rms(boundarySample, boundarySample + 4_800),
    }
    assert.ok(evidence.adjacentDelta < 0.02)
    assert.ok(evidence.rmsBefore > 0.03)
    assert.ok(evidence.rmsAfter > 0.03)
    return evidence
  })
  return {
    sampleCount,
    durationSeconds: sampleCount / 48_000,
    boundaries,
  }
}

async function readBoundedProcessStream(
  stream: Readable,
  maximumBytes: number,
): Promise<Buffer> {
  const chunks: Buffer[] = []
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.length
    if (byteLength > maximumBytes) {
      throw new Error('Process evidence stream exceeded its bounded memory ceiling.')
    }
    chunks.push(bytes)
  }
  return Buffer.concat(chunks, byteLength)
}
