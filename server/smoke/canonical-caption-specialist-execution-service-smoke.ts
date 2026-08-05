import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CanonicalCaptionSpecialistWorkItemInput } from
  '../../src/types/canonical-caption-specialist-execution'
import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
} from '../../src/types/canonical-caption-specialist-execution'
import type {
  OrchestraSkillCall,
  OrchestraSkillJobResult,
  SkillArtifactRef,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  executeCanonicalCaptionSpecialistWorkItem,
  parseCanonicalCaptionSpecialistExecutionReceipt,
  parseCanonicalCaptionSpecialistWorkItemInput,
} from '../services/canonical-caption-specialist-execution-service'
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
  parseOrchestraSkillJobResult,
} from '../orchestra/orchestra-skill-contracts'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

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
