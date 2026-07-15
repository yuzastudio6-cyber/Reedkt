import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from '../../src/lib/approved-edit-execution-package-client'
import { buildCanonicalPlanningDraft } from '../../src/lib/canonical-planning-draft'
import { createGuidedMockEditPlan } from '../../src/lib/mock-planner/guided'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import type { EditPlan, PlannerInput } from '../../src/types/reeditpro'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createCanonicalEditExecutionPackageService } from '../services/canonical-edit-execution-package-service'
import { createCanonicalPlanningHandoffService } from '../services/canonical-planning-handoff-service'
import { createCanonicalPrivateFinalArtifactDownloadService } from '../services/canonical-private-final-artifact-download-service'
import { normalizeCanonicalPrivateFinalMediaQa } from '../services/canonical-private-final-media-qa'
import { createCanonicalPrivateJobExecutionAdapterService } from '../services/canonical-private-job-execution-adapter-service'
import { readCanonicalPrivateMediaArtifact } from '../services/canonical-private-media-artifact-storage'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import { readPrivateCanonicalWorkerLeaseAggregate } from '../services/private-canonical-worker-lease-store'
import { readPrivateEditAuthorityAggregate } from '../services/private-edit-authority-store'
import { createPrivateArtifactQaAuthorityService } from '../services/private-artifact-qa-authority-service'
import { createUploadService } from '../services/upload-service'
import { activatePrivateOfflineLibassCaptionRuntime } from '../tool-execution/libass-caption-execution'
import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'
import type { ServiceContext } from '../types'
import {
  createCanonicalPlanningHandoffSchema,
  publishCanonicalEditPlanFromHandoffSchema,
} from '../validation/canonical-planning-handoff-schemas'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

// Reuse the canonical authority fixture only for its authenticated workspace and
// project. This smoke creates a new source, edit session, plan, snapshot,
// reservation, work graph, artifacts, and final composition of its own.
await import('./edit-planning-authority-smoke')

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const userId = 'user-authority-smoke'
const editSessionId = 'edit-session-canonical-professional-color'
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  SUPABASE_URL: 'https://canonical-professional-color-smoke.supabase.co',
  SUPABASE_ANON_KEY: 'canonical-professional-color-smoke-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'canonical-professional-color-smoke-service-role',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'rp-color-local-secret-9Yh4Wm7Qk2Xs8Nv5Bc3Lp6Td1Rf0Za',
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const context: ServiceContext = {
  env,
  clients: {
    admin: createMembershipAdminClient([{ workspaceId, userId, role: 'owner' }]),
    public: null,
  },
  requestId: 'canonical-private-color-execution-smoke',
  auth: {
    userId,
    accessToken: 'verified-canonical-professional-color-smoke-token',
    isMockUser: false,
  },
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
  idempotencyKey: 'initialize-canonical-professional-color-preferences',
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
  idempotencyKey: 'update-canonical-professional-color-preferences',
})
const planningPreference = await preferenceService.recordPlanningEvidence({
  workspaceId,
  projectId,
  editSessionId,
  expectedRevision: updatedPreference.preferenceRecord.recordRevision,
  sourcePreparation: {
    status: 'ready',
    evidenceHash: sha256Text('canonical-professional-color-source-ready'),
  },
  frameConfirmation: {
    status: 'confirmed',
    aspectRatio: '16:9',
    confirmationId: 'canonical-professional-color-frame-confirmation',
  },
  idempotencyKey: 'record-canonical-professional-color-planning-evidence',
})

const uploadedSource = await uploadProfessionalColorSource(projectId)
const sourceSequenceItemId = 'canonical-professional-color-source-1'
const uploadedClipId = 'canonical-professional-color-clip-1'
const plannerInput: PlannerInput = {
  projectName: 'Canonical professional color execution',
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
  customInstructions: 'Use only the source with restrained premium color and one readable caption.',
  userInstructionHistory: [
    'Use only the source with restrained premium color and one readable caption.',
  ],
  creditPreference: 'balanced',
  clips: [{
    id: uploadedClipId,
    uploadedOrder: 1,
    fileName: uploadedSource.mediaAsset.fileName,
    duration: '00:02',
    detectedType: 'Primary source',
    sourceRole: 'main_story',
  }],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: planningPreference.preferenceRecord.values.cleanupPreference,
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: planningPreference.preferenceRecord.baseline.preferenceSnapshotId,
  currentEditPreferenceRevision: planningPreference.preferenceRecord.preferenceRevision,
}
const sourceStorageProvider = uploadedSource.mediaAsset.storageProvider
if (!isClientSourceStorageProvider(sourceStorageProvider) || uploadedSource.mediaAsset.sizeBytes === undefined) {
  throw new Error('Finalized professional color source is missing durable private storage identity.')
}
const sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] = [{
  mediaAssetId: uploadedSource.mediaAsset.id,
  sourceSequenceItemId,
  uploadedClipId,
  uploadedOrder: 1,
  storageProvider: sourceStorageProvider,
  storageBucket: uploadedSource.mediaAsset.storageBucket,
  storagePath: uploadedSource.mediaAsset.storagePath,
  fileName: uploadedSource.mediaAsset.fileName,
  mimeType: uploadedSource.mediaAsset.mimeType,
  byteSize: uploadedSource.mediaAsset.sizeBytes,
  checksumSha256: uploadedSource.mediaAsset.checksumSha256,
  sourceMetadata: uploadedSource.mediaAsset.sourceMetadata,
  privateArtifact: true,
  publicUrl: null,
  signedUrl: null,
}]
const exactPlan = createExactProfessionalColorPlan(plannerInput)
const draft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput,
  sourceMediaAssets,
})
if (!draft.ok) {
  throw new Error(`Professional color plan did not compile: ${draft.errors.join(' | ')}`)
}
if (!draft.draft.publication) {
  throw new Error(
    `Professional color plan did not reach canonical publication: ${
      draft.draft.publicationBlockers.join(' | ')
    }`,
  )
}
assert.equal(draft.ok, true)
const canonicalPlan = draft.draft.publication.canonicalPlan
assert.deepEqual(canonicalPlan.workItems.map((item) => item.workItemKey), [
  'snapshot-validation',
  'source-trim-validation',
  'caption-overlay',
  'voice-delivery-1',
  'color-delivery-1',
  'final-export',
  'final-qa',
])
const colorWorkItemDraft = canonicalPlan.workItems.find((item) =>
  item.workItemKey === 'color-delivery-1')
const finalWorkItemDraft = canonicalPlan.workItems.find((item) =>
  item.workItemKey === 'final-export')
assert.ok(colorWorkItemDraft)
assert.ok(finalWorkItemDraft)
assert.equal(colorWorkItemDraft.workerClass, 'color_processing_worker')
assert.equal(colorWorkItemDraft.expectedOutputs[0]?.contentType, 'video/x-matroska')
assert.deepEqual(finalWorkItemDraft.dependencyKeys, [
  'source-trim-validation',
  'caption-overlay',
  'voice-delivery-1',
  'color-delivery-1',
])
assert.equal(
  asRecord(finalWorkItemDraft.executionInput.structuredPayload).sourceMediaPolicy,
  'approved_professional_color_intermediate_v1',
)
const exportCoverage = asRecord(
  asRecord(canonicalPlan.components.confirmedSettings).professionalExportCoverage,
)
assert.equal(exportCoverage.assumption, 'always_estimate_4k_uhd')
assert.equal(exportCoverage.costBasisProfileId, 'uhd_2160')
assert.deepEqual(exportCoverage.coveredProfileIds, ['hd_1080', 'qhd_1440', 'uhd_2160'])
assert.equal(exportCoverage.requiresSeparateExportEstimate, false)
assert.equal(exportCoverage.allowsAdditionalExportCharge, false)

const planningHandoffService = createCanonicalPlanningHandoffService(context)
const preparedHandoffBody = createCanonicalPlanningHandoffSchema.parse({
  workspaceId,
  purpose: 'prepare_canonical_planning_handoff',
  orderedSourceItems: draft.draft.orderedSourceItems,
  canonicalPlanComponents: draft.draft.components,
})
const handoff = await planningHandoffService.prepare({
  ...preparedHandoffBody,
  projectId,
  editSessionId,
})
assert.equal(handoff.readiness.readyForCanonicalPlanPublication, true)
assert.equal(handoff.noCreditReservation, true)
assert.equal(handoff.noToolExecution, true)
assert.equal(handoff.noRender, true)

const publicationBody = publishCanonicalEditPlanFromHandoffSchema.parse({
  workspaceId,
  planningRequestId: 'publish-canonical-professional-color-plan',
  expectedHandoffHash: handoff.handoffHash,
  canonicalPlan,
})
const published = await planningHandoffService.publishFromPersistedHandoff({
  ...publicationBody,
  projectId,
  editSessionId,
  handoffId: handoff.handoffId,
  idempotencyKey: 'publish-canonical-professional-color-plan',
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
  idempotencyKey: 'approve-canonical-professional-color-plan',
})
const approvedSnapshot = asRecord(asRecord(approved.authority).snapshot)
await createCanonicalEditExecutionPackageService(context).createPackage({
  workspaceId,
  approvedPlanSnapshotId: String(approvedSnapshot.snapshotId),
  expectedSnapshotHash: String(approvedSnapshot.snapshotHash),
  purpose: 'private_internal_execution_handoff',
  idempotencyKey: 'package-canonical-professional-color-plan',
})

const aggregate = await requireEditAuthority()
const snapshot = aggregate.snapshots.find((candidate) =>
  candidate.snapshotId === approvedSnapshot.snapshotId)
assert.ok(snapshot)
const approvedWorkItems = aggregate.approvedWorkItems.filter((candidate) =>
  candidate.snapshotId === snapshot.snapshotId)
const jobs = aggregate.jobs.filter((candidate) => candidate.snapshotId === snapshot.snapshotId)
assert.equal(approvedWorkItems.length, 7)
assert.equal(jobs.length, 7)
const jobByKey = new Map(approvedWorkItems.map((item) => {
  const job = jobs.find((candidate) => candidate.approvedWorkItemId === item.id)
  assert.ok(job)
  return [item.workItemKey, job] as const
}))
const executionAuthority = await planningService.loadApprovedExecutionAuthority(
  snapshot.snapshotId,
  workspaceId,
)
const assetByKey = new Map(approvedWorkItems.map((item) => {
  const asset = executionAuthority.assetManifest.entries.find((candidate) =>
    candidate.approvedWorkItemId === item.id)
  assert.ok(asset)
  return [item.workItemKey, asset] as const
}))
assert.deepEqual(
  jobByKey.get('final-export')!.dependencyJobIds,
  [
    jobByKey.get('source-trim-validation')!.id,
    jobByKey.get('caption-overlay')!.id,
    jobByKey.get('voice-delivery-1')!.id,
    jobByKey.get('color-delivery-1')!.id,
  ],
)

await activatePrivateOfflineMediaBinaryRuntime()
await activatePrivateOfflineLibassCaptionRuntime()
await prepareOfflineRemotionDockerRuntime()
await activatePrivateOfflineRemotionRenderRuntime()

const adapter = createCanonicalPrivateJobExecutionAdapterService(context)
const snapshotValidation = await executeJob('snapshot-validation')
assert.equal(snapshotValidation.identity.canonicalToolId, null)
assert.equal(snapshotValidation.result.contentType, 'application/json')
const sourceTrim = await executeJob('source-trim-validation')
assert.equal(sourceTrim.identity.canonicalToolId, null)
assert.equal(sourceTrim.result.contentType, 'application/json')
const caption = await executeJob('caption-overlay')
assert.equal(caption.identity.canonicalToolId, 'libass')
assert.equal(caption.result.contentType, 'image/png')
const voice = await executeJob('voice-delivery-1')
assert.equal(voice.identity.canonicalToolId, 'ffmpeg')
assert.equal(voice.result.contentType, 'audio/wav')
const color = await executeJob('color-delivery-1')
assert.equal(color.identity.canonicalToolId, 'ffmpeg')
assert.equal(color.identity.runnerClass, 'offline_media_binary_execution_v1')
assert.equal(color.result.contentType, 'video/x-matroska')
assert.equal(color.result.qaOutcome, 'passed')
assert.equal(color.result.privateTestDependencySatisfied, true)
assert.equal(color.result.liveRuntimeDependencySatisfied, false)
assert.equal(color.result.finalRenderAuthorized, false)
assert.equal(color.evidence.singleUseDispatchConsumed, true)
assert.equal(color.evidence.privateArtifactPersisted, true)
assert.equal(color.evidence.actualQaPassed, true)
assert.equal(color.evidence.reconciliationPassed, true)
assert.equal(color.readiness.productReady, false)

const colorReplay = await executeJob('color-delivery-1')
assert.equal(colorReplay.result.artifactId, color.result.artifactId)
assert.equal(colorReplay.result.sha256, color.result.sha256)
assert.equal(colorReplay.evidence.idempotentAdapterReplay, true)

const colorArtifactAuthority = await createPrivateArtifactQaAuthorityService(context)
  .readArtifactAuthority({
    workspaceId,
    projectId,
    editSessionId,
    snapshotId: snapshot.snapshotId,
    jobId: jobByKey.get('color-delivery-1')!.id,
    expectedAssetId: assetByKey.get('color-delivery-1')!.id,
    artifactId: color.result.artifactId,
    purpose: 'read_private_artifact_qa_authority',
  })
assert.equal(colorArtifactAuthority.artifact.content.contentType, 'video/x-matroska')
assert.equal(colorArtifactAuthority.qaEvaluation?.outcome, 'passed')
assert.equal(colorArtifactAuthority.reconciliation?.decision, 'test_merged_not_live_authorized')
const storedColor = await readCanonicalPrivateMediaArtifact({
  localStorageRoot,
  privateObjectIdentityHash:
    colorArtifactAuthority.artifact.storageIdentity.opaqueObjectIdentityHash,
})
assert.ok(storedColor)
assert.equal(storedColor.sha256, color.result.sha256)
assert.equal(storedColor.byteLength, color.result.byteLength)
assert.deepEqual([...storedColor.bytes.subarray(0, 4)], [0x1a, 0x45, 0xdf, 0xa3])

const finalComposition = await executeJob('final-export')
assert.equal(finalComposition.identity.canonicalToolId, 'remotion')
assert.equal(finalComposition.identity.runnerClass, 'offline_remotion_render_execution_v1')
assert.equal(finalComposition.result.contentType, 'video/mp4')
assert.equal(finalComposition.result.qaOutcome, 'passed')
assert.equal(finalComposition.result.privateTestDependencySatisfied, true)
assert.equal(finalComposition.result.liveRuntimeDependencySatisfied, false)
assert.equal(finalComposition.result.finalRenderAuthorized, false)
assert.equal(finalComposition.permissions.publicDelivery, false)
assert.equal(finalComposition.permissions.customerCreditMutation, false)
assert.equal(finalComposition.permissions.billing, false)
assert.equal(finalComposition.readiness.productReady, false)
const leaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId,
})
const completedFinalLease = leaseAggregate?.leases.find((lease) =>
  lease.jobId === jobByKey.get('final-export')!.id &&
  lease.executionFence.state === 'completed')
assert.ok(completedFinalLease)
assert.equal(completedFinalLease.dependencyAuthority.state, 'private_test_dependencies_verified')
assert.equal(completedFinalLease.dependencyAuthority.selectedArtifacts.length, 4)
assert.deepEqual(
  completedFinalLease.dependencyAuthority.selectedArtifacts
    .map((artifact) => artifact.artifactId)
    .sort(),
  [
    sourceTrim.result.artifactId,
    caption.result.artifactId,
    voice.result.artifactId,
    color.result.artifactId,
  ].sort(),
)
const finalCompositionReplay = await executeJob('final-export')
assert.equal(finalCompositionReplay.result.artifactId, finalComposition.result.artifactId)
assert.equal(finalCompositionReplay.result.sha256, finalComposition.result.sha256)
assert.equal(finalCompositionReplay.evidence.idempotentAdapterReplay, true)

const finalQa = await executeJob('final-qa')
assert.equal(finalQa.identity.canonicalToolId, 'ffprobe')
assert.equal(finalQa.result.contentType, 'application/json')
assert.equal(finalQa.result.qaOutcome, 'passed')
assert.equal(finalQa.evidence.dependencyArtifactInput, true)
assert.equal(finalQa.evidence.finalArtifactQaPassed, true)
assert.equal(finalQa.permissions.publicDelivery, false)
assert.equal(finalQa.readiness.productReady, false)
const finalQaReplay = await executeJob('final-qa')
assert.equal(finalQaReplay.result.artifactId, finalQa.result.artifactId)
assert.equal(finalQaReplay.result.sha256, finalQa.result.sha256)
assert.equal(finalQaReplay.evidence.idempotentAdapterReplay, true)

const privateDownload = await createCanonicalPrivateFinalArtifactDownloadService(context).read({
  workspaceId,
  projectId,
  editSessionId,
  snapshotId: snapshot.snapshotId,
  jobId: jobByKey.get('final-export')!.id,
  expectedAssetId: assetByKey.get('final-export')!.id,
  artifactId: finalComposition.result.artifactId,
  purpose: 'download_canonical_private_final_artifact',
})
assert.equal(privateDownload.mimeType, 'video/mp4')
assert.equal(privateDownload.sha256, finalComposition.result.sha256)
assert.equal(
  createHash('sha256').update(privateDownload.bytes).digest('hex'),
  finalComposition.result.sha256,
)
assert.equal(privateDownload.publicUrlCreated, false)
assert.equal(privateDownload.signedUrlCreated, false)
assert.equal(privateDownload.billingMutationPerformed, false)
assert.equal(privateDownload.settlementPerformed, false)

const sensitiveDiagnosticSentinel = 'must-never-appear-in-final-qa-diagnostics'
const overbroadExpectation = {
  width: 640,
  height: 360,
  fps: 24,
  durationFrames: 48,
  sourceBytesBase64: sensitiveDiagnosticSentinel,
  captionOverlayBytesBase64: sensitiveDiagnosticSentinel,
  voiceTracks: [{ bytesBase64: sensitiveDiagnosticSentinel }],
}
let sanitizedFinalQaError: ApiError | undefined
try {
  normalizeCanonicalPrivateFinalMediaQa({
    durationSeconds: 2,
    streams: [{
      codecType: 'video', codecName: 'h264', pixelFormat: 'yuv420p',
      colorSpace: 'bt709', width: 639, height: 360, fps: 24, readFrameCount: 48,
    }, {
      codecType: 'audio', codecName: 'aac', sampleRate: 48_000, channels: 2,
    }],
  }, overbroadExpectation)
} catch (error) {
  if (error instanceof ApiError) sanitizedFinalQaError = error
  else throw error
}
assert.ok(sanitizedFinalQaError)
assert.equal(sanitizedFinalQaError.code, 'TOOL_NOT_READY')
assert.deepEqual((sanitizedFinalQaError.details as { expected?: unknown }).expected, {
  width: 640,
  height: 360,
  fps: 24,
  durationFrames: 48,
})
assert.equal(JSON.stringify(sanitizedFinalQaError.details).includes(sensitiveDiagnosticSentinel), false)

console.log(JSON.stringify({
  smoke: 'canonical_private_professional_color_execution',
  status: 'passed',
  workItemCount: approvedWorkItems.length,
  colorArtifact: {
    contentType: color.result.contentType,
    sha256: color.result.sha256,
    byteLength: color.result.byteLength,
  },
  finalArtifact: {
    contentType: finalComposition.result.contentType,
    sha256: finalComposition.result.sha256,
    byteLength: finalComposition.result.byteLength,
  },
  proofs: [
    'exact_edit_preferences_source_and_confirmed_frame_bound_to_planning_handoff',
    'single_4k_uhd_estimate_covers_1080p_2k_and_4k_without_second_export_charge',
    'immutable_approved_snapshot_and_synthetic_private_reservation_verified',
    'exact_source_bound_professional_color_work_item_frozen_before_execution',
    'snapshot_validation_source_trim_caption_and_replacement_voice_dependencies_passed',
    'lease_and_single_use_ffmpeg_dispatch_verified',
    'actual_three_frame_color_analysis_bounded_processing_and_pixel_qa_passed',
    'lossless_vp9_matroska_bt709_yuv420p_artifact_privately_persisted',
    'color_artifact_qa_reconciliation_and_idempotent_replay_verified',
    'remotion_consumed_the_exact_selected_color_dependency_with_replacement_voice',
    'private_h264_final_composition_and_independent_ffprobe_final_qa_passed',
    'final_qa_failure_diagnostics_exclude_source_caption_and_voice_bytes',
    'private_download_replay_and_hash_integrity_verified',
    'provider_billing_public_delivery_and_product_beta_production_readiness_remain_false',
  ],
}))

async function executeJob(workItemKey: string) {
  const job = jobByKey.get(workItemKey)
  if (!job) throw new Error(`Missing canonical color job: ${workItemKey}`)
  return adapter.execute({
    workspaceId,
    projectId,
    editSessionId,
    jobId: job.id,
    purpose: 'execute_canonical_private_job',
    idempotencyKey: `execute-canonical-professional-color-${workItemKey}`,
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

async function uploadProfessionalColorSource(projectId: string) {
  const fixturePath = join('/tmp', `reeditpro-canonical-professional-color-${process.pid}.mp4`)
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=24:d=2',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2',
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709',
    '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '128k', '-threads', '1', '-y', fixturePath,
  ], { encoding: 'utf8' })
  if (generated.status !== 0) {
    throw new Error(`Unable to generate professional color source fixture: ${generated.stderr.slice(0, 500)}`)
  }
  const bytes = await readFile(fixturePath)
  await rm(fixturePath, { force: true })
  const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
  const uploadService = createUploadService(context)
  const created = await uploadService.createUploadIntent({
    workspaceId,
    projectId,
    uploadPurpose: 'source_media',
    originalFileName: 'canonical-professional-color-source.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: bytes.byteLength,
    checksumSha256,
    idempotencyKey: 'canonical-professional-color-source-upload-intent',
  })
  await uploadService.uploadLocalObject(
    created.uploadIntent.id,
    workspaceId,
    bytes,
    'video/mp4',
    bytes.byteLength,
  )
  return uploadService.finalizeUploadIntent({
    workspaceId,
    uploadIntentId: created.uploadIntent.id,
  })
}

function createExactProfessionalColorPlan(input: PlannerInput): EditPlan {
  const plan = createGuidedMockEditPlan(input)
  const fullPlan = createMockEditPlan(input)
  const timing = plan.masterTimingPlan!
  timing.timingBase = {
    ...timing.timingBase,
    fps: 24,
    totalDurationSeconds: 2,
    totalFrames: 48,
    sourceDurationSeconds: 2,
    finalDurationSeconds: 2,
  }
  timing.finalTimelineSegments = [{
    ...timing.finalTimelineSegments[0]!,
    segmentId: 'segment-1',
    finalRange: frameRange(0, 2, 0, 48),
  }]
  timing.captionTimingItems = [{
    ...timing.captionTimingItems[0]!,
    captionText: 'Approved professional color',
    timeRange: frameRange(0, 2, 0, 48),
  }]
  timing.visualTimingItems = []
  timing.transitionTimingItems = []
  timing.sfxTimingItems = []
  timing.musicDuckingTimingItems = []
  timing.providerClipTimingItems = []
  const cleanup = plan.sourceCleanupPlan!
  const decision = cleanup.decisions[0]! as unknown as Record<string, unknown>
  decision.selectedRange = frameRange(0, 2, 0, 48)
  decision.sourceRange = {
    clipId: input.clips[0]!.id,
    startSeconds: 0,
    endSeconds: 2,
    durationSeconds: 2,
    startFrame: 0,
    endFrame: 48,
    notes: [],
  }
  decision.decision = 'preserve'
  decision.riskLevel = 'low'
  synchronizeProfessionalExportCoverage(plan)
  plan.visualAssetPlan = []
  plan.providerPromptPlans = []
  plan.segmentEditPlans = []
  if (!fullPlan.colorPipelinePlan || !fullPlan.audioPipelinePlan) {
    throw new Error('Professional color fixture requires planned color and voice pipelines.')
  }
  plan.colorPipelinePlan = structuredClone(fullPlan.colorPipelinePlan)
  plan.audioPipelinePlan = structuredClone(fullPlan.audioPipelinePlan)
  return plan
}

function frameRange(startSeconds: number, endSeconds: number, startFrame: number, endFrame: number) {
  return {
    startSeconds,
    endSeconds,
    durationSeconds: endSeconds - startSeconds,
    startFrame,
    endFrame,
    durationFrames: endFrame - startFrame,
    fps: 24,
  }
}

function synchronizeProfessionalExportCoverage(plan: EditPlan): void {
  const coverage = buildProfessionalExportCreditCoverage({
    durationSeconds: 2,
    outputFps: 24,
    approvedAspectRatio: '16:9',
  })
  const exportLine = plan.creditEstimate.breakdown.find((item) =>
    item.label === '4K UHD render and export ceiling')
  if (!exportLine || !plan.creditEstimate.professionalExportCoverage) {
    throw new Error('Professional color fixture requires the mandatory 4K estimate line.')
  }
  plan.creditEstimate.total +=
    coverage.maximumInternalToolCostCredits - exportLine.credits
  exportLine.credits = coverage.maximumInternalToolCostCredits
  plan.creditEstimate.professionalExportCoverage = coverage
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

function isClientSourceStorageProvider(
  value: unknown,
): value is ApprovedEditExecutionUploadedMediaSourceAssetClientInput['storageProvider'] {
  return value === 'local_private' ||
    value === 'google_cloud_storage' ||
    value === 'supabase_storage'
}

function createMembershipAdminClient(
  memberships: Array<{ workspaceId: string; userId: string; role: string }>,
): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') {
        throw new Error(`Unexpected professional color smoke table: ${tableName}`)
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
