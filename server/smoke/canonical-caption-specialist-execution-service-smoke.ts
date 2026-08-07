import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import type { CanonicalCaptionSpecialistWorkItemInput } from
  '../../src/types/canonical-caption-specialist-execution'
import {
  CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
} from '../../src/types/canonical-caption-specialist-execution'
import { CANONICAL_CAPTION_SPECIALIST_JOB_ASSIGNMENT_VERSION } from
  '../../src/types/canonical-caption-specialist-planning'
import type {
  OrchestraSkillCall,
  OrchestraSkillJobResult,
  SkillArtifactRef,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import {
  SKILL_SUPPORT_REQUEST_VERSION_V2,
  type SkillSupportRequestV2,
} from '../../src/types/orchestra-skill-support-request-v2'
import { calculateSkillSupportRequestV2Digest } from
  '../orchestra/orchestra-skill-support-request-v2'
import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  executeCanonicalCaptionSpecialistWorkItem,
  createCanonicalCaptionIncomingSupportRequestReadPort,
  parseCanonicalCaptionSpecialistExecutionReceipt,
  parseCanonicalCaptionSpecialistWorkItemInput,
} from '../services/canonical-caption-specialist-execution-service'
import {
  assertCanonicalCaptionCompletedProducedArtifacts,
  canonicalCaptionProducedArtifactRefsDigest,
} from '../services/canonical-caption-specialist-produced-artifact-contract'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import type { CanonicalApprovedExecutionAuthority } from
  '../services/edit-planning-authority-service'
import {
  createCanonicalAuthenticatedSpecialistSupportArtifactProjection,
  createCanonicalSpecialistSupportResumeRepository,
  resumeCanonicalSpecialistWithAuthenticatedSupport,
} from '../services/canonical-specialist-support-resume-service'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import { parseSkillSupportRequestV2 } from
  '../orchestra/orchestra-skill-support-request-v2'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import {
  canonicalInternalAuthorityArtifactRelativePath,
  verifyCanonicalCaptionSpecialistPlanningArtifact,
} from '../services/canonical-internal-authority-artifact-verifier'
import type { PersistedArtifactResult } from
  '../validation/private-artifact-qa-authority-schemas'

let checks = 0
function check(value: unknown, message: string): void {
  assert.ok(value, message)
  checks += 1
}

function ref(
  id: string,
  artifactType: CanonicalCaptionSpecialistWorkItemInput[
    'initialArtifactRefs'][number]['artifactType'],
) {
  return {
    id,
    version: `${id}-v1`,
    contentHash: sha256AuthorityValue({ id }),
    artifactType,
    producerSkillKey: `${artifactType}.owner`,
    privateArtifact: true as const,
    byteFreeRef: true as const,
    sourceSupportRequestRef: null,
  }
}

const workInput: CanonicalCaptionSpecialistWorkItemInput = {
  schemaVersion: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  operation: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
  captionJobType: 'plan_caption_strategy',
  requestedMode: 'planning',
  scopeLevel: 'video',
  outputId: 'output-main',
  sceneId: null,
  boundaryId: null,
  authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 360 }],
  initialArtifactRefs: [
    ref('transcript-main', 'canonical_transcript'),
    ref('confirmed-frame-main', 'confirmed_output_frame'),
    ref('master-timing-main', 'master_timing_or_planning_timing'),
  ],
  rawChatIncluded: false,
  transcriptTextIncluded: false,
  mediaBytesIncluded: false,
  pathsUrlsOrCredentialsIncluded: false,
  directPeerDispatchRequested: false,
  providerCallRequested: false,
  timelineMutationRequested: false,
  assetMutationRequested: false,
  qaApprovalRequested: false,
  billingAuthorityRequested: false,
  publicDeliveryRequested: false,
  productionAuthorityRequested: false,
}

const executionInputRef = {
  sha256: sha256AuthorityValue(workInput),
  byteLength: Buffer.byteLength(JSON.stringify(workInput)),
}
const expectedOutput = {
  outputKey: 'caption-plan-receipt',
  artifactType: 'caption_specialist_job_receipt',
  assetRole: 'qa' as const,
  required: true,
  previewPlaceholderAllowed: false,
  contentType: 'application/json',
  segmentIds: [] as string[],
  timingIds: ['master-timing-main'],
  rendererLayerIds: [] as string[],
}
const workItem = {
  id: 'approved-caption-work-1',
  snapshotId: 'approved-caption-snapshot-1',
  sourceWorkItemId: 'caption-work-source-1',
  workItemKey: 'caption-plan-strategy',
  workItemType: 'custom',
  workerClass: CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  executionInputRef,
  sourceSequenceItemIds: ['source-1'],
  sourceCleanupDecisionIds: ['cleanup-1'],
  expectedOutputs: [expectedOutput],
  dependencyKeys: [],
  approvedToolIds: [],
  providerExecutionMode: 'none' as const,
  fallbackPolicyRef: {
    sha256: sha256AuthorityValue({ fallback: 'fail_closed' }),
    byteLength: 24,
  },
  maxAttempts: 1,
  attemptTimeoutSeconds: 60,
  scheduledDelaySeconds: 0,
  maximumCreditBudget: 1,
  required: true,
  executionInputHash: executionInputRef.sha256,
  createdAt: '2026-08-05T12:00:00.000Z',
  executionInput: workInput,
  fallbackPolicy: { fallback: 'fail_closed' },
}
const job = {
  id: 'caption-canonical-job-1',
  snapshotId: workItem.snapshotId,
  reservationId: 'caption-reservation-1',
  approvedWorkItemId: workItem.id,
  workItemKey: workItem.workItemKey,
  jobType: workItem.workItemType,
  workerClass: workItem.workerClass,
  executionInputRef,
  sourceSequenceItemIds: ['source-1'],
  sourceCleanupDecisionIds: ['cleanup-1'],
  expectedAssetIds: ['caption-manifest-entry-1'],
  dependencyJobIds: [],
  status: 'ready' as const,
  maxAttempts: 1,
  attemptTimeoutSeconds: 60,
  scheduledFor: '2026-08-05T12:00:00.000Z',
  createdAt: '2026-08-05T12:00:00.000Z',
}
const manifestEntry = {
  id: 'caption-manifest-entry-1',
  snapshotId: workItem.snapshotId,
  approvedWorkItemId: workItem.id,
  workItemKey: workItem.workItemKey,
  ...expectedOutput,
  status: 'planned' as const,
  version: 1 as const,
  createdAt: '2026-08-05T12:00:00.000Z',
}
const componentRefs = {
  masterTimingPlan: {
    sha256: sha256AuthorityValue({ timing: 'main' }),
    byteLength: 64,
  },
}
const snapshotWithoutHash = {
  schemaVersion: 'private-edit-authority-approved-snapshot-v3' as const,
  snapshotId: workItem.snapshotId,
  workspaceId: 'workspace-caption-1',
  projectId: 'project-caption-1',
  editSessionId: 'edit-caption-1',
  planId: 'plan-caption-1',
  planVersion: 1,
  estimateId: 'estimate-caption-1',
  approvalId: 'approval-caption-1',
  reservationId: job.reservationId,
  approvedByUserId: 'owner-caption-1',
  approvedAt: '2026-08-05T12:00:00.000Z',
  componentRefs,
  approvedWorkItemIds: [workItem.id],
  planHash: sha256AuthorityValue({ plan: 1 }),
  estimateHash: sha256AuthorityValue({ estimate: 1 }),
  workGraphHash: sha256AuthorityValue({ work: 1 }),
  sourceSequenceHash: sha256AuthorityValue({ source: 1 }),
  timingHash: sha256AuthorityValue({ timing: 1 }),
  approvedAssetManifestRef: {
    sha256: sha256AuthorityValue({ manifest: 1 }),
    byteLength: 512,
  },
  approvedAssetManifestHash: sha256AuthorityValue({ entries: 1 }),
  approvedSourceAssetManifestRef: {
    sha256: sha256AuthorityValue({ sourceManifest: 1 }),
    byteLength: 512,
  },
  approvedSourceAssetManifestHash:
    sha256AuthorityValue({ sourceEntries: 1 }),
}
const snapshot = {
  ...snapshotWithoutHash,
  snapshotHash: sha256AuthorityValue(snapshotWithoutHash),
}
const estimate = {
  id: snapshot.estimateId,
  planId: snapshot.planId,
  estimateVersion: 1,
  status: 'approved' as const,
  lineItems: [],
  estimatedCredits: 1,
  fallbackAllowanceCredits: 0,
  approvedMaximumCredits: 1,
  estimateHash: snapshot.estimateHash,
  validUntil: '2026-08-06T12:00:00.000Z',
  createdAt: snapshot.approvedAt,
  approvedAt: snapshot.approvedAt,
}
const reservation = {
  id: snapshot.reservationId,
  approvalId: snapshot.approvalId,
  snapshotId: snapshot.snapshotId,
  estimateId: snapshot.estimateId,
  planId: snapshot.planId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  status: 'reserved' as const,
  reservedCredits: 1,
  spentCredits: 0,
  releasedCredits: 0,
  refundedCredits: 0,
  reservedAt: snapshot.approvedAt,
  expiresAt: '2026-08-06T12:00:00.000Z',
  updatedAt: snapshot.approvedAt,
}
const authority = {
  authorityRevision: 7,
  snapshot,
  estimate,
  reservation,
  workItems: [workItem],
  jobs: [job],
  assetManifest: {
    schemaVersion: 'private-edit-asset-manifest-v1',
    snapshotId: snapshot.snapshotId,
    planId: snapshot.planId,
    planHash: snapshot.planHash,
    workGraphHash: snapshot.workGraphHash,
    entries: [manifestEntry],
    requiredAssetCount: 1,
    optionalAssetCount: 0,
    manifestHash: snapshot.approvedAssetManifestHash,
  },
} as unknown as CanonicalApprovedExecutionAuthority
const executionPackage = {
  schemaVersion: 'canonical-approved-edit-execution-package-v5',
  packageRecordId: 'caption-execution-package-1',
  packageHash: sha256AuthorityValue({ package: 1 }),
  workspaceId: snapshot.workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  approvedPlanSnapshotId: snapshot.snapshotId,
  snapshotHash: snapshot.snapshotHash,
  planHash: snapshot.planHash,
  estimateHash: snapshot.estimateHash,
  workGraphHash: snapshot.workGraphHash,
  timingHash: snapshot.timingHash,
  approvedAssetManifestHash: snapshot.approvedAssetManifestHash,
  componentRefs,
  approvedWorkItems: [{
    id: workItem.id,
    workItemKey: workItem.workItemKey,
    executionInputHash: workItem.executionInputHash,
  }],
  jobs: [{
    id: job.id,
    approvedWorkItemId: job.approvedWorkItemId,
    executionInputRef: job.executionInputRef,
    dispatchState: 'not_authorized',
  }],
} as unknown as CanonicalApprovedEditExecutionPackage

const records = new Map<string, Buffer>()
const repository = createCanonicalSpecialistSupportResumeRepository({
  objectPort: memoryObjectPort(records),
  prefix: 'private/smoke/canonical-caption-execution/v1',
})

const parsedInput = parseCanonicalCaptionSpecialistWorkItemInput(workInput)
check(parsedInput.captionJobType === 'plan_caption_strategy',
  'The approved Caption work input must parse exactly.')
check(parsedInput.initialArtifactRefs.length === 3,
  'Only the three canonical starting evidence roles are required here.')

const first = await executeCanonicalCaptionSpecialistWorkItem({
  authority,
  executionPackage,
  jobId: job.id,
  repository,
  now: () => new Date('2026-08-05T12:01:00.000Z'),
})
check(first.pair.result.disposition === 'completed',
  'A simple approved Caption planning job must complete from canonical inputs.')
check(first.pair.result.producedArtifactRefs.length === 1,
  'Caption must produce one byte-free job receipt ref.')
check(first.pair.result.supportRequests.length === 0,
  'A simple plan job must not invent peer support work.')
check(first.pair.call.canonicalScope.approvedSnapshotRef?.contentHash
  === snapshot.snapshotHash,
  'The backend must inject the exact postapproval snapshot identity.')
check(first.pair.call.manifestRef.id
  === 'captions.specialist.integration.manifest',
  'The canonical mount must use the current integration manifest.')
check(first.receipt.resultDisposition === 'completed',
  'The mount receipt must report the exact Caption result disposition.')
check(first.receipt.directPeerDispatchPerformed === false
  && first.receipt.providerCallPerformed === false
  && first.receipt.mediaRuntimePerformed === false,
  'The planning mount must keep peer, provider, and media authority closed.')
check(parseCanonicalCaptionSpecialistExecutionReceipt(first.receipt)
  .receiptDigestSha256 === first.receipt.receiptDigestSha256,
  'The closed execution receipt must verify its own digest.')
check(first.pair.pairDigestSha256
  === 'edb9c1dada0718cab269e3aed8660b83084ccf4fae4f9b783af1535a1d6b8a53'
  && first.receipt.receiptDigestSha256
    === '3e2e6416e37c7836f7d3e8c7a65dccd4f8fd3541568183618807c12638688c39',
'The additive incoming-support lane must not alter the frozen V1 call/result or receipt digests.')

const artifactRoot = await mkdtemp(join(tmpdir(), 'caption-artifact-reader-'))
const artifactIdentityHash = sha256AuthorityValue('caption-artifact-object')
const executionAttemptId = 'caption-execution-attempt-1'
const immutableLeaseHash = sha256AuthorityValue('caption-lease-1')
const jobAuthorityHash = sha256AuthorityValue(job)
const report = {
  schemaVersion: 'canonical-caption-specialist-planning-artifact-v1',
  source: 'immutable_canonical_edit_authority',
  identity: {
    workspaceId: snapshot.workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    snapshotId: snapshot.snapshotId,
    jobId: job.id,
    approvedWorkItemId: workItem.id,
    expectedAssetId: manifestEntry.id,
  },
  authorityRevision: authority.authorityRevision,
  executionFence: {
    leaseId: 'caption-lease-1',
    immutableLeaseHash,
    leaseAttemptNumber: 1,
    executionAttemptId,
    runnerClass: 'canonical_caption_specialist_planning_runner_v1',
  },
  authorityHashes: {
    snapshotHash: snapshot.snapshotHash,
    approvedAssetManifestHash: snapshot.approvedAssetManifestHash,
    jobAuthorityHash,
  },
  reservation: { reservationId: reservation.id, status: reservation.status },
  checks: [
    'approved_snapshot_manifest_integrity',
    'plan_estimate_work_graph_hash_integrity',
    'planning_preference_brief_binding_integrity',
    'source_media_manifest_integrity',
    'planned_asset_manifest_integrity',
    'execution_package_integrity',
    'funded_reservation_active',
    'exact_root_work_item_and_expected_output',
    'opaque_worker_execution_fence_started',
  ].map((checkId) => ({ checkId, status: 'passed' })),
  validationProfile: 'caption_specialist',
  sourceTrim: null,
  livingFrameLayer: null,
  captionSpecialist: {
    receipt: first.receipt,
    callResultPairRef: {
      id: first.pair.pairId,
      version: first.pair.schemaVersion,
      contentHash: first.pair.pairDigestSha256,
    },
    producedArtifactRefs: first.pair.result.producedArtifactRefs,
    supportRequestCount: 0,
    exactCreateOnlyRereadVerified: true,
    planningOnly: true,
    renderedMediaClaimed: false,
    finalQaClaimed: false,
  },
  captionPostrenderVisualQa: null,
  valid: true,
}
const reportBytes = Buffer.from(JSON.stringify(report), 'utf8')
const reportPath = join(artifactRoot,
  canonicalInternalAuthorityArtifactRelativePath(artifactIdentityHash))
await mkdir(dirname(reportPath), { recursive: true })
await writeFile(reportPath, reportBytes)
const persistedArtifact: PersistedArtifactResult = {
  artifactId: 'caption-planning-artifact-1',
  identity: {
    workspaceId: snapshot.workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    snapshotId: snapshot.snapshotId,
    jobId: job.id,
    expectedAssetId: manifestEntry.id,
  },
  lineage: {
    assetId: manifestEntry.id,
    outputKey: expectedOutput.outputKey,
    artifactType: expectedOutput.artifactType,
    assetRole: expectedOutput.assetRole,
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/json',
    segmentIds: [],
    timingIds: ['master-timing-main'],
    rendererLayerIds: [],
    approvedWorkItemId: workItem.id,
    workItemKey: workItem.workItemKey,
    jobType: job.jobType,
    jobAuthorityHash,
    snapshotHash: snapshot.snapshotHash,
    approvedAssetManifestHash: snapshot.approvedAssetManifestHash,
  },
  artifactVersion: 1,
  attemptKind: 'initial',
  content: {
    sha256: createHash('sha256').update(reportBytes).digest('hex'),
    byteLength: reportBytes.byteLength,
    contentType: 'application/json',
  },
  storageIdentity: {
    storageKind: 'private_local_test',
    opaqueObjectIdentityHash: artifactIdentityHash,
  },
  placeholder: { isPlaceholder: false, scope: 'none' },
  actualRunEvidence: {
    state: 'actual_run_evidence_placeholder',
    executionAttemptId,
    runnerClass: 'canonical_caption_specialist_planning_runner_v1',
    runnerEvidenceHash: sha256AuthorityValue('caption-runner-evidence'),
    startedAt: first.receipt.persistedAt,
    finishedAt: first.receipt.persistedAt,
    exitCode: 0,
    toolIds: [],
    actualRunVerified: false,
  },
  resultEvidenceRef: {
    sha256: sha256AuthorityValue('caption-result-evidence'),
    byteLength: 64,
  },
  resultEvidenceHash: sha256AuthorityValue('caption-result-evidence'),
  evidenceClass: 'private_internal_test_attested',
  liveRuntimeEligible: false,
  createdAt: first.receipt.persistedAt,
}
const verifiedArtifact =
  await verifyCanonicalCaptionSpecialistPlanningArtifact({
    localStorageRoot: artifactRoot,
    artifact: persistedArtifact,
  })
check(verifiedArtifact.receipt.receiptDigestSha256
  === first.receipt.receiptDigestSha256
  && verifiedArtifact.callResultPairRef.contentHash
    === first.pair.pairDigestSha256,
'The terminal reader must reopen the persisted Caption artifact and recover its exact completed receipt.')
await assert.rejects(() => verifyCanonicalCaptionSpecialistPlanningArtifact({
  localStorageRoot: artifactRoot,
  artifact: {
    ...persistedArtifact,
    lineage: { ...persistedArtifact.lineage, snapshotHash:
      sha256AuthorityValue('crossed-caption-snapshot') },
  },
}), /semantic lineage is inconsistent/u)
checks += 1

const replay = await executeCanonicalCaptionSpecialistWorkItem({
  authority,
  executionPackage,
  jobId: job.id,
  repository,
  now: () => new Date('2026-08-05T13:00:00.000Z'),
})
check(replay.pair.pairDigestSha256 === first.pair.pairDigestSha256,
  'An exact replay must reread the original create-only pair.')
check(replay.pair.persistedAt === first.pair.persistedAt,
  'An exact replay must not manufacture a later persistence time.')

await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority,
  executionPackage,
  jobId: job.id,
  repository,
  canonicalTranscriptAuthenticatedReadBindingRef: {
    id: 'transcript-binding-postapproval-1',
    version: 'caption-canonical-transcript-authenticated-read-binding-v1',
    contentHash: sha256AuthorityValue('postapproval-transcript-binding-1'),
  },
}), /authenticated transcript reader is unavailable/u)
checks += 1

await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority,
  executionPackage,
  jobId: job.id,
  repository,
  canonicalTranscriptAuthenticatedReadBindingRef: {
    id: 'transcript-binding-postapproval-1',
    version: 'caption-canonical-transcript-authenticated-read-binding-v1',
    contentHash: 'not-a-digest',
  },
}), /Invalid string|invalid_format/u)
checks += 1

const visualWorkInput: CanonicalCaptionSpecialistWorkItemInput = {
  ...workInput,
  captionJobType: 'plan_caption_blocking_preview',
  scopeLevel: 'scene',
  sceneId: 'scene-main',
}
const visualExecutionInputRef = {
  sha256: sha256AuthorityValue(visualWorkInput),
  byteLength: Buffer.byteLength(JSON.stringify(visualWorkInput)),
}
const visualWorkItem = {
  ...workItem,
  id: 'approved-caption-work-visual-1',
  sourceWorkItemId: 'caption-work-source-visual-1',
  workItemKey: 'caption-plan-blocking-preview',
  executionInputRef: visualExecutionInputRef,
  executionInputHash: visualExecutionInputRef.sha256,
  executionInput: visualWorkInput,
}
const visualJob = {
  ...job,
  id: 'caption-canonical-job-visual-1',
  approvedWorkItemId: visualWorkItem.id,
  workItemKey: visualWorkItem.workItemKey,
  executionInputRef: visualExecutionInputRef,
  expectedAssetIds: ['caption-manifest-entry-visual-1'],
}
const visualManifestEntry = {
  ...manifestEntry,
  id: 'caption-manifest-entry-visual-1',
  approvedWorkItemId: visualWorkItem.id,
  workItemKey: visualWorkItem.workItemKey,
}
const visualAuthority = {
  ...authority,
  workItems: [visualWorkItem],
  jobs: [visualJob],
  assetManifest: {
    ...authority.assetManifest,
    entries: [visualManifestEntry],
  },
} as unknown as CanonicalApprovedExecutionAuthority
const visualExecutionPackage = {
  ...executionPackage,
  approvedWorkItems: [{
    id: visualWorkItem.id,
    workItemKey: visualWorkItem.workItemKey,
    executionInputHash: visualWorkItem.executionInputHash,
  }],
  jobs: [{
    id: visualJob.id,
    approvedWorkItemId: visualJob.approvedWorkItemId,
    executionInputRef: visualJob.executionInputRef,
    dispatchState: 'not_authorized',
  }],
} as unknown as CanonicalApprovedEditExecutionPackage
const visual = await executeCanonicalCaptionSpecialistWorkItem({
  authority: visualAuthority,
  executionPackage: visualExecutionPackage,
  jobId: visualJob.id,
  repository,
  now: () => new Date('2026-08-05T12:02:00.000Z'),
})
check(visual.pair.result.disposition === 'needs_followup',
  'An approved advanced visual job must stop for authenticated owner evidence.')
check(visual.pair.result.supportRequests.length === 1,
  'The advanced visual job must create one deterministic owner request.')
check(visual.pair.result.supportRequests[0]?.targetSkillKey
  === 'visual_intelligence',
  'Visual Intelligence must remain the owner of spatial evidence.')
check(visual.pair.result.supportRequests[0]?.mediationPolicy
  .directPeerDispatchAllowed === false,
  'Caption must not dispatch Visual Intelligence directly.')
check(visual.pair.call.inputArtifactRefs.every((artifact) =>
  artifact.artifactType !== 'visual_intelligence_report'),
  'Owner evidence must not be smuggled into the initial Caption call.')

const visualSupportRequest = visual.pair.result.supportRequests[0]!
const visualSupportRequestRef = supportRequestRef(visualSupportRequest)
const visualProjection =
  createCanonicalAuthenticatedSpecialistSupportArtifactProjection({
    schemaVersion:
      'canonical-authenticated-specialist-support-artifact-projection-v1',
    projectionId: 'caption.execution.visual-owner.projection.1',
    originalCallRef: structuredClone(visualSupportRequest.originalCallRef),
    supportRequestRef: visualSupportRequestRef,
    ownerResultRef: skillRef('caption.execution.visual-owner.result.1'),
    ownerKey: visualSupportRequest.targetSkillKey,
    canonicalScope: structuredClone(visualSupportRequest.canonicalScope),
    artifactRefs: visualSupportRequest.requestedArtifactTypes.map(
      (artifactType) => skillArtifact(
        `caption.execution.visual-owner.${artifactType}`,
        artifactType,
        visualSupportRequest.targetSkillKey,
        visualSupportRequestRef,
      )),
    authenticatedPrincipalVerified: true,
    exactApprovedSnapshotReread: true,
    exactCanonicalScopeReread: true,
    exactOwnerResultReread: true,
    ownerResultPersistedBeforeProjection: true,
    browserLocalStateUsed: false,
    rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false,
    directPeerDispatchPerformed: false,
    timelineMutationPerformed: false,
    runtimeExecutionAuthorityGrantedToSpecialist: false,
    assetMutationAuthorityGrantedToSpecialist: false,
    costOrBillingAuthorityGrantedToSpecialist: false,
    finalQaApprovalGrantedToSpecialist: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
await repository.persistAuthenticatedOwnerProjectionCreateOnly({
  projection: visualProjection,
})
const projectionOnlyReplay = await executeCanonicalCaptionSpecialistWorkItem({
  authority: visualAuthority,
  executionPackage: visualExecutionPackage,
  jobId: visualJob.id,
  repository,
})
check(projectionOnlyReplay.pair.result.disposition === 'needs_followup',
  'An owner projection without its persisted resume record must stay pending.')
const visualResume = await resumeCanonicalSpecialistWithAuthenticatedSupport({
  priorCallRef: skillCallRef(visual.pair.call),
  selectedSupportRequestRef: visualSupportRequestRef,
  repository,
  specialistExecutionPort: {
    async execute({ call }) {
      return completedSpecialistResult(call)
    },
  },
  now: () => new Date('2026-08-05T12:03:00.000Z'),
})
check(visualResume.resumedResult.disposition === 'completed',
  'The admitted owner projection must support one persisted completed resume.')
const resumedVisualReplay = await executeCanonicalCaptionSpecialistWorkItem({
  authority: visualAuthority,
  executionPackage: visualExecutionPackage,
  jobId: visualJob.id,
  repository,
})
check(resumedVisualReplay.pair.result.resultDigestSha256
  === visualResume.resumedResult.resultDigestSha256,
  'Canonical Caption execution must reread the persisted resumed result head.')
check(resumedVisualReplay.receipt.resultDisposition === 'completed'
  && resumedVisualReplay.receipt.captionCallRef.contentHash
    === visualResume.resumedCall.callDigestSha256
  && resumedVisualReplay.receipt.captionResultRef.contentHash
    === visualResume.resumedResult.resultDigestSha256,
'The canonical work-item receipt must bind the exact resumed call and result.')

const sourceCallWithoutDigest: Omit<OrchestraSkillCall,
  'callDigestSha256'> = {
  ...structuredClone(first.pair.call),
  callId: 'living-frame.source.call.1',
  idempotencyKey: 'living-frame:source-call-1',
  assigneeSkillKey: 'living_frame',
  job: {
    jobId: 'living-frame.source.job.1',
    jobType: 'request_caption_typography_support',
    requestedMode: 'planning',
    scopeLevel: 'scene',
  },
  canonicalScope: {
    ...structuredClone(first.pair.call.canonicalScope),
    sceneId: 'scene-main',
    authorizedFrameRanges: structuredClone(workInput.authorizedFrameRanges),
  },
  manifestRef: skillRef('living-frame.source.manifest.1'),
  qualificationSnapshotRef:
    skillRef('living-frame.source.qualification.1'),
  inputArtifactRefs: [],
}
const sourceCall = parseOrchestraSkillCall({
  ...sourceCallWithoutDigest,
  callDigestSha256: calculateSkillContractDigest(
    sourceCallWithoutDigest as unknown as Record<string, unknown>,
    'callDigestSha256',
  ),
})

const incomingSupportRequestWithoutDigest: Omit<SkillSupportRequestV2,
  'requestDigestSha256'> = {
  schemaVersion: SKILL_SUPPORT_REQUEST_VERSION_V2,
  requestId: 'caption.incoming.support.request.1',
  originalCallRef: skillCallRef(sourceCall),
  requestingSkillKey: 'living_frame',
  targetSkillKey: 'captions',
  requestedJobType: 'provide_speech_derived_typography_spec',
  reasonCode: 'speech_typography_required_for_visual_handoff',
  requestedArtifactTypes: ['caption_speech_derived_typography_spec'],
  canonicalScope: {
    ownerUserId: snapshot.approvedByUserId,
    workspaceId: snapshot.workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    approvedSnapshotRef: {
      id: snapshot.snapshotId,
      version: snapshot.schemaVersion,
      contentHash: snapshot.snapshotHash,
    },
    outputId: workInput.outputId,
    sceneId: 'scene-main',
    boundaryId: null,
    authorizedFrameRanges: structuredClone(workInput.authorizedFrameRanges),
  },
  typedPayloadType: 'caption-speech-typography-support-context-v1',
  typedPayload: {
    schemaVersion: 'caption-speech-typography-support-context-v1',
    semanticConceptRef: skillRef('caption.incoming.semantic-concept.1'),
    informationOwner: 'captions',
    requesterMayDispatchCaptionDirectly: false,
  },
  mediationPolicy: {
    hqMediated: true,
    directPeerDispatchAllowed: false,
    assigneeMayOnlyResumeAfterInjection: true,
  },
  authorityBoundary: {
    scopeExpansionGranted: false,
    timelineMutationGranted: false,
    directPeerDispatchGranted: false,
    providerCallGranted: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    costAuthorityGranted: false,
    billingAuthorityGranted: false,
    qaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  },
}
const incomingSupportRequest: SkillSupportRequestV2 = {
  ...incomingSupportRequestWithoutDigest,
  requestDigestSha256: calculateSkillSupportRequestV2Digest(
    incomingSupportRequestWithoutDigest as unknown as Record<string, unknown>),
}
const incomingSupportRequestRef: SkillContractRef = {
  id: incomingSupportRequest.requestId,
  version: incomingSupportRequest.schemaVersion,
  contentHash: incomingSupportRequest.requestDigestSha256,
}
check(parseSkillSupportRequestV2(incomingSupportRequest)
  .targetSkillKey === 'captions',
'The additive V2 parser must admit an exact Caption-targeted support request.')

const attemptedV1CaptionTarget = {
  ...incomingSupportRequestWithoutDigest,
  schemaVersion: 'skill-support-request-v1',
  requestDigestSha256: '',
}
delete (attemptedV1CaptionTarget as { requestedJobType?: string })
  .requestedJobType
attemptedV1CaptionTarget.requestDigestSha256 = calculateSkillContractDigest(
  attemptedV1CaptionTarget as unknown as Record<string, unknown>,
  'requestDigestSha256',
)
assert.throws(() => parseSkillSupportRequest(attemptedV1CaptionTarget),
  /Invalid enum value|Invalid option/u)
checks += 1

const unsafeIncomingSupportRequest = {
  ...incomingSupportRequestWithoutDigest,
  typedPayload: { privatePath: '/Users/example/private-caption.json' },
  requestDigestSha256: '',
}
unsafeIncomingSupportRequest.requestDigestSha256 =
  calculateSkillSupportRequestV2Digest(
    unsafeIncomingSupportRequest as unknown as Record<string, unknown>)
assert.throws(() => parseSkillSupportRequestV2(unsafeIncomingSupportRequest),
  /contains unsafe text/u)
checks += 1

const unknownFieldIncomingSupportRequest = {
  ...incomingSupportRequestWithoutDigest,
  unknownAuthority: false,
  requestDigestSha256: '',
}
unknownFieldIncomingSupportRequest.requestDigestSha256 =
  calculateSkillSupportRequestV2Digest(
    unknownFieldIncomingSupportRequest as unknown as Record<string, unknown>)
assert.throws(() => parseSkillSupportRequestV2(
  unknownFieldIncomingSupportRequest), /Unrecognized key|unrecognized_keys/u)
checks += 1
const incomingSupportInput: CanonicalCaptionSpecialistWorkItemInput = {
  ...workInput,
  schemaVersion: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION,
  captionJobType: 'provide_speech_derived_typography_spec',
  scopeLevel: 'scene',
  sceneId: 'scene-main',
  initialArtifactRefs: [
    ...workInput.initialArtifactRefs,
    {
      ...incomingSupportRequestRef,
      artifactType: 'source_skill_support_request',
      producerSkillKey: 'head_of_orchestra',
      privateArtifact: true,
      byteFreeRef: true,
      sourceSupportRequestRef: null,
    },
  ],
  assignmentIntentRef: {
    id: 'caption.assignment.incoming.support.1',
    version: CANONICAL_CAPTION_SPECIALIST_JOB_ASSIGNMENT_VERSION,
    contentHash: sha256AuthorityValue('caption.assignment.incoming.support.1'),
  },
  assignmentTrigger: 'hq_mediated_support_request',
  sourceSupportRequestRef: incomingSupportRequestRef,
  selectionEvidenceRef: skillRef('caption.incoming.selection.1'),
}
check(parseCanonicalCaptionSpecialistWorkItemInput(incomingSupportInput)
  .initialArtifactRefs.some((artifact) =>
    artifact.artifactType === 'source_skill_support_request'
    && artifact.id === incomingSupportRequestRef.id),
'A canonical incoming-support assignment must carry its exact HQ request into the immutable call inputs.')
assert.throws(() => parseCanonicalCaptionSpecialistWorkItemInput({
  ...incomingSupportInput,
  initialArtifactRefs: workInput.initialArtifactRefs,
}), /assignment trigger or support lineage is invalid/u)
checks += 1

const incomingSupportExecutionInputRef = {
  sha256: sha256AuthorityValue(incomingSupportInput),
  byteLength: Buffer.byteLength(JSON.stringify(incomingSupportInput)),
}
const incomingSupportWorkItem = {
  ...workItem,
  id: 'approved-caption-work-incoming-support-1',
  sourceWorkItemId: 'caption-work-source-incoming-support-1',
  workItemKey: 'caption-provide-speech-derived-typography-spec',
  executionInputRef: incomingSupportExecutionInputRef,
  executionInputHash: incomingSupportExecutionInputRef.sha256,
  executionInput: incomingSupportInput,
}
const incomingSupportJob = {
  ...job,
  id: 'caption-canonical-job-incoming-support-1',
  approvedWorkItemId: incomingSupportWorkItem.id,
  workItemKey: incomingSupportWorkItem.workItemKey,
  executionInputRef: incomingSupportExecutionInputRef,
  expectedAssetIds: ['caption-manifest-entry-incoming-support-1'],
}
const incomingSupportManifestEntry = {
  ...manifestEntry,
  id: 'caption-manifest-entry-incoming-support-1',
  approvedWorkItemId: incomingSupportWorkItem.id,
  workItemKey: incomingSupportWorkItem.workItemKey,
}
const incomingSupportAuthority = {
  ...authority,
  workItems: [incomingSupportWorkItem],
  jobs: [incomingSupportJob],
  assetManifest: {
    ...authority.assetManifest,
    entries: [incomingSupportManifestEntry],
  },
} as unknown as CanonicalApprovedExecutionAuthority
const incomingSupportExecutionPackage = {
  ...executionPackage,
  approvedWorkItems: [{
    id: incomingSupportWorkItem.id,
    workItemKey: incomingSupportWorkItem.workItemKey,
    executionInputHash: incomingSupportWorkItem.executionInputHash,
  }],
  jobs: [{
    id: incomingSupportJob.id,
    approvedWorkItemId: incomingSupportJob.approvedWorkItemId,
    executionInputRef: incomingSupportJob.executionInputRef,
    dispatchState: 'not_authorized',
  }],
} as unknown as CanonicalApprovedEditExecutionPackage
const incomingSupportExecution =
  await executeCanonicalCaptionSpecialistWorkItem({
    authority: incomingSupportAuthority,
    executionPackage: incomingSupportExecutionPackage,
    jobId: incomingSupportJob.id,
    repository,
    incomingSupportRequestReadPort:
      createCanonicalCaptionIncomingSupportRequestReadPort(
        async ({ requestRef }) =>
          requestRef.id === incomingSupportRequestRef.id
            && requestRef.version === incomingSupportRequestRef.version
            && requestRef.contentHash === incomingSupportRequestRef.contentHash
            ? {
                request: structuredClone(incomingSupportRequest),
                originalCall: structuredClone(sourceCall),
              } : null,
      ),
    now: () => new Date('2026-08-05T12:04:00.000Z'),
  })
check(incomingSupportExecution.pair.result.disposition === 'completed',
  'The canonical incoming-support assignment must reach Caption execution.')
const incomingSupportCall = incomingSupportExecution.pair.call
check(incomingSupportCall.inputArtifactRefs.some((artifact) =>
    artifact.artifactType === 'source_skill_support_request'
    && artifact.id === incomingSupportRequestRef.id
    && artifact.version === incomingSupportRequestRef.version
    && artifact.contentHash === incomingSupportRequestRef.contentHash
    && artifact.producerSkillKey === 'head_of_orchestra'),
'The immutable Caption call must carry the exact HQ-mediated source request instead of inventing peer dispatch.')
check(incomingSupportCall.resumeOfSupportRequestRef === null
  && incomingSupportCall.resumeOriginCallRef === null,
'An incoming support assignment must not be mislabeled as Caption resuming one of its own dependency requests.')
check(incomingSupportExecution.pair.result.producedArtifactRefs.some(
  (artifact) =>
    artifact.artifactType === 'caption_speech_derived_typography_spec'
    && artifact.sourceSupportRequestRef?.id
      === incomingSupportRequestRef.id
    && artifact.sourceSupportRequestRef.contentHash
      === incomingSupportRequestRef.contentHash),
'Caption must return the requested byte-free support artifact bound to the exact incoming request.')
check(incomingSupportExecution.receipt.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION
  && incomingSupportExecution.receipt.producedArtifactCount === 2
  && incomingSupportExecution.receipt.producedArtifactRefsDigestSha256 ===
    canonicalCaptionProducedArtifactRefsDigest(
      incomingSupportExecution.pair.result.producedArtifactRefs)
  && incomingSupportExecution.receipt.crossSystemExecutionInputRef === null
  && incomingSupportExecution.receipt
    .crossSystemExecutionInputPersistedCreateOnlyAndReread === false,
'A multi-artifact incoming-support result must use V2 and bind its exact ordered artifacts without claiming cross-system input.')
const falseCrossSystemPersistenceClaim = structuredClone(
  incomingSupportExecution.receipt) as unknown as Record<string, unknown>
falseCrossSystemPersistenceClaim
  .crossSystemExecutionInputPersistedCreateOnlyAndReread = true
falseCrossSystemPersistenceClaim.receiptDigestSha256 =
  calculateSkillContractDigest(falseCrossSystemPersistenceClaim,
    'receiptDigestSha256')
assert.throws(() => parseCanonicalCaptionSpecialistExecutionReceipt(
  falseCrossSystemPersistenceClaim), /persistence claim/u)
checks += 1
assert.doesNotThrow(() => assertCanonicalCaptionCompletedProducedArtifacts({
  receipt: incomingSupportExecution.receipt,
  producedArtifactRefs:
    incomingSupportExecution.pair.result.producedArtifactRefs,
}))
checks += 1
const changedIncomingArtifactRefs = structuredClone(
  incomingSupportExecution.pair.result.producedArtifactRefs)
changedIncomingArtifactRefs[1]!.contentHash = sha256AuthorityValue(
  'changed-caption-support-artifact')
assert.throws(() => assertCanonicalCaptionCompletedProducedArtifacts({
  receipt: incomingSupportExecution.receipt,
  producedArtifactRefs: changedIncomingArtifactRefs,
}), /does not bind its exact artifacts/u)
checks += 1

const incomingArtifactIdentityHash = sha256AuthorityValue(
  'caption-incoming-support-artifact-object')
const incomingExecutionAttemptId = 'caption-incoming-support-attempt-1'
const incomingImmutableLeaseHash = sha256AuthorityValue(
  'caption-incoming-support-lease-1')
const incomingJobAuthorityHash = sha256AuthorityValue(incomingSupportJob)
const incomingReport = {
  ...structuredClone(report),
  identity: {
    workspaceId: snapshot.workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    snapshotId: snapshot.snapshotId,
    jobId: incomingSupportJob.id,
    approvedWorkItemId: incomingSupportWorkItem.id,
    expectedAssetId: incomingSupportManifestEntry.id,
  },
  executionFence: {
    leaseId: 'caption-incoming-support-lease-1',
    immutableLeaseHash: incomingImmutableLeaseHash,
    leaseAttemptNumber: 1,
    executionAttemptId: incomingExecutionAttemptId,
    runnerClass: 'canonical_caption_specialist_planning_runner_v1',
  },
  authorityHashes: {
    snapshotHash: snapshot.snapshotHash,
    approvedAssetManifestHash: snapshot.approvedAssetManifestHash,
    jobAuthorityHash: incomingJobAuthorityHash,
  },
  captionSpecialist: {
    receipt: incomingSupportExecution.receipt,
    callResultPairRef: {
      id: incomingSupportExecution.pair.pairId,
      version: incomingSupportExecution.pair.schemaVersion,
      contentHash: incomingSupportExecution.pair.pairDigestSha256,
    },
    producedArtifactRefs:
      incomingSupportExecution.pair.result.producedArtifactRefs,
    supportRequestCount: 0,
    exactCreateOnlyRereadVerified: true,
    planningOnly: true,
    renderedMediaClaimed: false,
    finalQaClaimed: false,
  },
}
const incomingReportBytes = Buffer.from(JSON.stringify(incomingReport), 'utf8')
const incomingReportPath = join(artifactRoot,
  canonicalInternalAuthorityArtifactRelativePath(
    incomingArtifactIdentityHash))
await mkdir(dirname(incomingReportPath), { recursive: true })
await writeFile(incomingReportPath, incomingReportBytes)
const incomingPersistedArtifact: PersistedArtifactResult = {
  ...structuredClone(persistedArtifact),
  artifactId: 'caption-incoming-support-planning-artifact-1',
  identity: {
    ...structuredClone(persistedArtifact.identity),
    jobId: incomingSupportJob.id,
    expectedAssetId: incomingSupportManifestEntry.id,
  },
  lineage: {
    ...structuredClone(persistedArtifact.lineage),
    assetId: incomingSupportManifestEntry.id,
    approvedWorkItemId: incomingSupportWorkItem.id,
    workItemKey: incomingSupportWorkItem.workItemKey,
    jobAuthorityHash: incomingJobAuthorityHash,
  },
  content: {
    sha256: createHash('sha256').update(incomingReportBytes).digest('hex'),
    byteLength: incomingReportBytes.byteLength,
    contentType: 'application/json',
  },
  storageIdentity: {
    storageKind: 'private_local_test',
    opaqueObjectIdentityHash: incomingArtifactIdentityHash,
  },
  actualRunEvidence: {
    ...structuredClone(persistedArtifact.actualRunEvidence),
    executionAttemptId: incomingExecutionAttemptId,
    runnerEvidenceHash: sha256AuthorityValue(
      'caption-incoming-support-runner-evidence'),
    startedAt: incomingSupportExecution.receipt.persistedAt,
    finishedAt: incomingSupportExecution.receipt.persistedAt,
  },
  createdAt: incomingSupportExecution.receipt.persistedAt,
}
const verifiedIncomingArtifact =
  await verifyCanonicalCaptionSpecialistPlanningArtifact({
    localStorageRoot: artifactRoot,
    artifact: incomingPersistedArtifact,
  })
check(verifiedIncomingArtifact.producedArtifactRefs.length === 2
  && verifiedIncomingArtifact.receipt.schemaVersion ===
    CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION,
'The private canonical artifact verifier must admit the exact two-artifact support result instead of enforcing the legacy one-artifact limit.')

await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: incomingSupportAuthority,
  executionPackage: incomingSupportExecutionPackage,
  jobId: incomingSupportJob.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/canonical-caption-execution/missing-request-v1',
  }),
}), /incoming-support request reader is unavailable/u)
checks += 1

let incomingRequestRereadCount = 0
const changedIncomingRequest = {
  ...incomingSupportRequestWithoutDigest,
  reasonCode: 'changed_between_canonical_rereads',
  requestDigestSha256: '',
}
changedIncomingRequest.requestDigestSha256 =
  calculateSkillSupportRequestV2Digest(
    changedIncomingRequest as unknown as Record<string, unknown>)
await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: incomingSupportAuthority,
  executionPackage: incomingSupportExecutionPackage,
  jobId: incomingSupportJob.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/canonical-caption-execution/changed-request-v1',
  }),
  incomingSupportRequestReadPort:
    createCanonicalCaptionIncomingSupportRequestReadPort(async () => {
      incomingRequestRereadCount += 1
      return {
        request: structuredClone(incomingRequestRereadCount === 1
          ? incomingSupportRequest : changedIncomingRequest),
        originalCall: structuredClone(sourceCall),
      }
    }),
}), /changed between rereads/u)
checks += 1

await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: incomingSupportAuthority,
  executionPackage: incomingSupportExecutionPackage,
  jobId: incomingSupportJob.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/canonical-caption-execution/crossed-request-v1',
  }),
  incomingSupportRequestReadPort:
    createCanonicalCaptionIncomingSupportRequestReadPort(
      async () => ({
        request: structuredClone(changedIncomingRequest),
        originalCall: structuredClone(sourceCall),
      }),
    ),
}), /crossed its assignment/u)
checks += 1

const crossedSourceCallWithoutDigest = {
  ...sourceCallWithoutDigest,
  assigneeSkillKey: 'transitions',
}
const crossedSourceCall = parseOrchestraSkillCall({
  ...crossedSourceCallWithoutDigest,
  callDigestSha256: calculateSkillContractDigest(
    crossedSourceCallWithoutDigest as unknown as Record<string, unknown>,
    'callDigestSha256',
  ),
})
await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: incomingSupportAuthority,
  executionPackage: incomingSupportExecutionPackage,
  jobId: incomingSupportJob.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/canonical-caption-execution/crossed-source-call-v1',
  }),
  incomingSupportRequestReadPort:
    createCanonicalCaptionIncomingSupportRequestReadPort(async () => ({
      request: structuredClone(incomingSupportRequest),
      originalCall: structuredClone(crossedSourceCall),
    })),
}), /crossed its assignment/u)
checks += 1

assert.throws(() => parseCanonicalCaptionSpecialistWorkItemInput({
  ...workInput,
  initialArtifactRefs: [
    ...workInput.initialArtifactRefs,
    {
      ...ref('visual-owner-result', 'canonical_transcript'),
      artifactType: 'visual_intelligence_report',
    },
  ],
}), /Invalid enum value|Invalid option/u)
checks += 1

assert.throws(() => parseCanonicalCaptionSpecialistWorkItemInput({
  ...workInput,
  initialArtifactRefs: [
    workInput.initialArtifactRefs[0],
    workInput.initialArtifactRefs[0],
    workInput.initialArtifactRefs[2],
  ],
}), /without duplicate roles/u)
checks += 1

await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority,
  executionPackage: {
    ...executionPackage,
    snapshotHash: sha256AuthorityValue({ crossed: true }),
  },
  jobId: job.id,
  repository,
}), /does not match approved authority/u)
checks += 1

await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: {
    ...authority,
    jobs: [{ ...job, status: 'blocked' }],
  },
  executionPackage,
  jobId: job.id,
  repository,
}), /work-item\/job authority is invalid/u)
checks += 1

const dependencyExecutionInput = {
  operation: 'internal.validate_snapshot_manifest.v1',
  source: 'canonical_edit_authority',
}
const dependencyExecutionInputRef = {
  sha256: sha256AuthorityValue(dependencyExecutionInput),
  byteLength: Buffer.byteLength(JSON.stringify(dependencyExecutionInput)),
}
const dependencyExpectedOutput = {
  outputKey: 'authority-validation-evidence',
  artifactType: 'authority_validation_evidence',
  assetRole: 'qa' as const,
  required: true,
  previewPlaceholderAllowed: false,
  contentType: 'application/json',
  segmentIds: [] as string[],
  timingIds: [] as string[],
  rendererLayerIds: [] as string[],
}
const dependencyWorkItem = {
  ...workItem,
  id: 'approved-caption-dependency-work-1',
  sourceWorkItemId: 'caption-dependency-work-source-1',
  workItemKey: 'caption-approved-dependency',
  workItemType: 'validate_approved_snapshot',
  workerClass: 'canonical_authority_validation_runner_v1',
  executionInputRef: dependencyExecutionInputRef,
  sourceSequenceItemIds: [] as string[],
  sourceCleanupDecisionIds: [] as string[],
  expectedOutputs: [dependencyExpectedOutput],
  dependencyKeys: [] as string[],
  executionInputHash: dependencyExecutionInputRef.sha256,
  executionInput: dependencyExecutionInput,
}
const dependencyJob = {
  ...job,
  id: 'caption-dependency-job-1',
  approvedWorkItemId: dependencyWorkItem.id,
  workItemKey: dependencyWorkItem.workItemKey,
  jobType: dependencyWorkItem.workItemType,
  workerClass: dependencyWorkItem.workerClass,
  executionInputRef: dependencyExecutionInputRef,
  sourceSequenceItemIds: [] as string[],
  sourceCleanupDecisionIds: [] as string[],
  expectedAssetIds: ['caption-dependency-manifest-entry-1'],
}
const dependencyManifestEntry = {
  ...manifestEntry,
  id: dependencyJob.expectedAssetIds[0],
  approvedWorkItemId: dependencyWorkItem.id,
  workItemKey: dependencyWorkItem.workItemKey,
  ...dependencyExpectedOutput,
}
const dependentWorkItem = {
  ...workItem,
  dependencyKeys: [dependencyWorkItem.workItemKey],
}
const dependentJob = {
  ...job,
  dependencyJobIds: [dependencyJob.id],
  status: 'blocked' as const,
}
const dependentAuthority = {
  ...authority,
  workItems: [dependencyWorkItem, dependentWorkItem],
  jobs: [dependencyJob, dependentJob],
  assetManifest: {
    ...authority.assetManifest,
    entries: [dependencyManifestEntry, manifestEntry],
    requiredAssetCount: 2,
  },
} as unknown as CanonicalApprovedExecutionAuthority
const dependentExecutionPackage = {
  ...executionPackage,
  approvedWorkItems: [
    {
      id: dependencyWorkItem.id,
      workItemKey: dependencyWorkItem.workItemKey,
      executionInputHash: dependencyWorkItem.executionInputHash,
    },
    executionPackage.approvedWorkItems[0]!,
  ],
  jobs: [
    {
      id: dependencyJob.id,
      approvedWorkItemId: dependencyJob.approvedWorkItemId,
      executionInputRef: dependencyJob.executionInputRef,
      dispatchState: 'not_authorized' as const,
    },
    executionPackage.jobs[0]!,
  ],
} as CanonicalApprovedEditExecutionPackage
const dependencyAuthorityWithoutHash = {
  state: 'private_test_dependencies_verified' as const,
  readinessHash: sha256AuthorityValue({
    jobId: dependentJob.id,
    dependencyJobId: dependencyJob.id,
  }),
  selectedArtifacts: [{
    dependencyJobId: dependencyJob.id,
    expectedAssetId: dependencyManifestEntry.id,
    artifactId: 'caption-dependency-artifact-1',
    artifactVersion: 1,
    contentSha256: sha256AuthorityValue({
      artifactId: 'caption-dependency-artifact-1',
    }),
    qaEvaluationId: 'caption-dependency-qa-1',
    reconciliationId: 'caption-dependency-reconciliation-1',
    executionAttemptId: 'caption-dependency-execution-attempt-1',
    sourceLeaseImmutableHash: sha256AuthorityValue({
      leaseId: 'caption-dependency-lease-1',
    }),
  }],
  liveRuntimeEligible: false as const,
}
const dependencyAuthority = {
  ...dependencyAuthorityWithoutHash,
  authorityHash: sha256AuthorityValue(dependencyAuthorityWithoutHash),
}
const dependentExecution = await executeCanonicalCaptionSpecialistWorkItem({
  authority: dependentAuthority,
  executionPackage: dependentExecutionPackage,
  jobId: dependentJob.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/canonical-caption-execution/dependent-v1',
  }),
  canonicalJobDependencyAuthority: dependencyAuthority,
})
check(dependentExecution.pair.result.disposition === 'completed',
  'A dependent Caption job must run only with exact verified dependency authority.')

await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: dependentAuthority,
  executionPackage: dependentExecutionPackage,
  jobId: dependentJob.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/canonical-caption-execution/dependent-missing-v1',
  }),
}), /lacks verified dependency authority/u)
checks += 1

const crossedDependencyAuthorityWithoutHash = {
  ...dependencyAuthorityWithoutHash,
  selectedArtifacts: [{
    ...dependencyAuthorityWithoutHash.selectedArtifacts[0]!,
    dependencyJobId: 'caption-crossed-dependency-job-1',
  }],
}
await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: dependentAuthority,
  executionPackage: dependentExecutionPackage,
  jobId: dependentJob.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/canonical-caption-execution/dependent-crossed-v1',
  }),
  canonicalJobDependencyAuthority: {
    ...crossedDependencyAuthorityWithoutHash,
    authorityHash: sha256AuthorityValue(crossedDependencyAuthorityWithoutHash),
  },
}), /crossed its approved graph/u)
checks += 1

await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: dependentAuthority,
  executionPackage: dependentExecutionPackage,
  jobId: dependentJob.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/canonical-caption-execution/dependent-tampered-v1',
  }),
  canonicalJobDependencyAuthority: {
    ...dependencyAuthority,
    readinessHash: sha256AuthorityValue({ tampered: true }),
  },
}), /dependency authority digest is invalid/u)
checks += 1

await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: {
    ...authority,
    workItems: [{
      ...workItem,
      executionInput: {
        ...workInput,
        providerCallRequested: true,
      },
    }],
  } as unknown as CanonicalApprovedExecutionAuthority,
  executionPackage,
  jobId: job.id,
  repository,
}), /changed after approval/u)
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-specialist-execution-service',
  status: 'passed',
  checks,
  resultDisposition: first.pair.result.disposition,
  pairDigestSha256: first.pair.pairDigestSha256,
  receiptDigestSha256: first.receipt.receiptDigestSha256,
  directPeerDispatchPerformed: false,
  providerCallPerformed: false,
  mediaRuntimePerformed: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function skillRef(id: string): SkillContractRef {
  return {
    id,
    version: `${id}.v1`,
    contentHash: sha256AuthorityValue(id),
  }
}

function skillCallRef(call: OrchestraSkillCall): SkillContractRef {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}

function supportRequestRef(request: SkillSupportRequest): SkillContractRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function skillArtifact(
  id: string,
  artifactType: string,
  producerSkillKey: string,
  sourceSupportRequestRef: SkillContractRef | null,
): SkillArtifactRef {
  return {
    ...skillRef(id),
    artifactType,
    producerSkillKey,
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef,
  }
}

function completedSpecialistResult(
  call: OrchestraSkillCall,
): OrchestraSkillJobResult {
  const withoutDigest: Omit<OrchestraSkillJobResult,
    'resultDigestSha256'> = {
    schemaVersion: 'orchestra-skill-job-result-v1',
    resultId: `caption.execution.resumed-result.${
      call.callDigestSha256.slice(0, 32)}`,
    disposition: 'completed',
    originalCallRef: skillCallRef(call),
    producerSkillKey: call.assigneeSkillKey,
    jobType: call.job.jobType,
    manifestRef: structuredClone(call.manifestRef),
    qualificationSnapshotRef:
      structuredClone(call.qualificationSnapshotRef),
    canonicalScope: structuredClone(call.canonicalScope),
    producedArtifactRefs: [skillArtifact(
      `caption.execution.resumed-artifact.${
        call.callDigestSha256.slice(0, 32)}`,
      'caption_resumed_specialist_job_result',
      'captions',
      null,
    )],
    supportRequests: [],
    reasonCodes: ['caption.authenticated-owner-evidence.accepted'],
    safeUserSummary:
      'Caption planning resumed from authenticated owner evidence.',
    replayBinding: {
      idempotencyKey: call.idempotencyKey,
      resumedFromSupportRequestRef:
        structuredClone(call.resumeOfSupportRequestRef),
      resumeOriginCallRef: structuredClone(call.resumeOriginCallRef),
    },
    authorityBoundary: {
      scopeExpansionGranted: false,
      timelineMutationGranted: false,
      directPeerDispatchGranted: false,
      providerCallGranted: false,
      runtimeExecutionGranted: false,
      assetCreationGranted: false,
      costAuthorityGranted: false,
      billingAuthorityGranted: false,
      qaApprovalGranted: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    },
  }
  return parseOrchestraSkillJobResult({
    ...withoutDigest,
    resultDigestSha256: calculateSkillContractDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'resultDigestSha256',
    ),
  })
}

function memoryObjectPort(
  objects: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const prior = objects.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      objects.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}
