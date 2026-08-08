import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  BrollCaptionOwnerReadResult,
} from '../../src/types/caption-broll-owner-read-adapter'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  SKILL_SUPPORT_REQUEST_VERSION_V2,
  type SkillSupportRequestV2,
} from '../../src/types/orchestra-skill-support-request-v2'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCaptionBrollOwnerReadRequest,
  parseBrollCaptionOwnerReadResult,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import { BROLL_CAPTION_OWNER_MANIFEST_REF } from
  '../edit-skills/b-roll/b-roll-caption-public-contract'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import { createCaptionsHarnessCall } from
  '../internal-testing/captions-specialist-harness'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import { parseSkillSupportRequestV2 } from
  '../orchestra/orchestra-skill-support-request-v2'
import {
  createCanonicalCaptionBrollApprovedSnapshotReadPort,
  createCanonicalCaptionBrollEvidenceRepository,
  createCanonicalCaptionBrollOwnerReadPort,
  createCanonicalCaptionBrollSupportService,
  parseCanonicalCaptionBrollAuthenticatedEvidenceRecord,
} from '../services/canonical-caption-broll-support-service'
import {
  createCanonicalCaptionCrossSystemExecutionInputPrivateComposition,
  createCanonicalCaptionCrossSystemSourceReadPort,
  resolveCanonicalCaptionCrossSystemExecutionInput,
} from
  '../services/canonical-caption-cross-system-execution-input-service'
import { createCanonicalCaptionIncomingSupportRequestReadPort } from
  '../services/canonical-caption-incoming-support-request-service'
import {
  createCanonicalSpecialistCallResultPair,
  createCanonicalSpecialistSupportResumeRepository,
} from '../services/canonical-specialist-support-resume-service'
import { createCanonicalCaptionBrollCrossSystemSourceFixture } from
  './canonical-caption-cross-system-source-fixture'

let checks = 0
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message)
  checks += 1
}
async function reject(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  checks += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version = `${id}.v1`): CaptionDomainRef {
  return { id, version, contentHash: hash(id) }
}
function redigest<T extends Record<string, unknown>>(
  value: T,
  digestField: string,
): T {
  const clone = structuredClone(value)
  clone[digestField as keyof T] = calculateSkillContractDigest(
    clone, digestField) as T[keyof T]
  return clone
}

const objectValues = new Map<string, Buffer>()
const objectPort = memoryObjectPort(objectValues)
const supportResumeRepository =
  createCanonicalSpecialistSupportResumeRepository({
    objectPort,
    prefix: 'private/smoke/caption-broll/resume/v1',
  })
const evidenceRepository = createCanonicalCaptionBrollEvidenceRepository({
  objectPort,
  prefix: 'private/smoke/caption-broll/evidence/v1',
})
const approvedSnapshotRef = ref(
  'snapshot.broll.bridge.1', 'approved-plan-snapshot-v1')
const baseCall = createCaptionsHarnessCall({
  callId: 'caption.broll.bridge.1',
  jobType: 'provide_caption_broll_composition_constraints',
  scopeLevel: 'scene',
  runtimeProfile: 'cross_system_integration',
  approvedSnapshotRef,
  outputId: 'output.broll.bridge.1',
  sceneId: 'scene.broll.bridge.1',
})
const sourceCallCandidate = structuredClone(baseCall)
sourceCallCandidate.callId = 'broll.caption-constraints.source-call.1'
sourceCallCandidate.idempotencyKey =
  'broll:caption-constraints:source-call:1'
sourceCallCandidate.caller = {
  callerKind: 'head_of_orchestra',
  callerId: 'canonical-approved-edit-workflow',
}
sourceCallCandidate.assigneeSkillKey = 'b_roll'
sourceCallCandidate.job = {
  jobId: 'broll.caption-constraints.source-job.1',
  jobType: 'request_caption_broll_composition_constraints',
  requestedMode: 'planning',
  scopeLevel: 'scene',
}
sourceCallCandidate.manifestRef = ref(
  'broll.caption-constraints.source-manifest.1',
  'broll-caption-support-manifest-v1')
sourceCallCandidate.qualificationSnapshotRef = ref(
  'broll.caption-constraints.source-qualification.1',
  'broll-caption-support-qualification-v1')
sourceCallCandidate.inputArtifactRefs = []
sourceCallCandidate.callDigestSha256 = calculateSkillContractDigest(
  sourceCallCandidate as unknown as Record<string, unknown>,
  'callDigestSha256',
)
const sourceCall = parseOrchestraSkillCall(sourceCallCandidate)
const incomingRequestWithoutDigest: Omit<SkillSupportRequestV2,
  'requestDigestSha256'> = {
  schemaVersion: SKILL_SUPPORT_REQUEST_VERSION_V2,
  requestId: 'broll.caption-constraints.incoming-request.1',
  originalCallRef: contractRef(callRefLike(sourceCall)),
  requestingSkillKey: 'b_roll',
  targetSkillKey: 'captions',
  requestedJobType: 'provide_caption_broll_composition_constraints',
  reasonCode: 'broll.caption_constraints.required',
  requestedArtifactTypes: ['caption_broll_composition_constraints'],
  canonicalScope: structuredClone(baseCall.canonicalScope),
  typedPayloadType: 'broll-caption-constraints-request-v1',
  typedPayload: {
    requestedConstraintRole: 'caption_safe_selected_media_layout',
    byteFreeRequest: true,
    brollSelectionAuthorityRequested: false,
  },
  mediationPolicy: {
    hqMediated: true,
    directPeerDispatchAllowed: false,
    assigneeMayOnlyResumeAfterInjection: true,
  },
  authorityBoundary: structuredClone(baseCall.authorityBoundary),
}
const incomingRequest = parseSkillSupportRequestV2(redigest({
  ...incomingRequestWithoutDigest,
  requestDigestSha256: '',
}, 'requestDigestSha256'))
const incomingRequestRef = {
  id: incomingRequest.requestId,
  version: incomingRequest.schemaVersion,
  contentHash: incomingRequest.requestDigestSha256,
}
const callCandidate = structuredClone(baseCall)
callCandidate.inputArtifactRefs.push({
  ...incomingRequestRef,
  artifactType: 'source_skill_support_request',
  producerSkillKey: 'head_of_orchestra',
  privateArtifact: true,
  byteFreeRef: true,
  sourceSupportRequestRef: null,
})
callCandidate.callDigestSha256 = calculateSkillContractDigest(
  callCandidate as unknown as Record<string, unknown>,
  'callDigestSha256',
)
const call = parseOrchestraSkillCall(callCandidate)
const incomingSupportRequestReadPort =
  createCanonicalCaptionIncomingSupportRequestReadPort(
    async ({ requestRef }) => requestRef.id === incomingRequestRef.id
      && requestRef.version === incomingRequestRef.version
      && requestRef.contentHash === incomingRequestRef.contentHash
      ? {
          request: structuredClone(incomingRequest),
          originalCall: structuredClone(sourceCall),
        }
      : null,
  )
let crossSystemSourceReads = 0
const crossSystemComposition =
  createCanonicalCaptionCrossSystemExecutionInputPrivateComposition({
    objectPort,
    sourceReadPort: createCanonicalCaptionCrossSystemSourceReadPort(
      async ({ call: sourceCall }) => {
        crossSystemSourceReads += 1
        return createCanonicalCaptionBrollCrossSystemSourceFixture(
          sourceCall, 'plan.broll.bridge.1')
      },
    ),
    prefix: 'private/smoke/caption-broll/cross-system/v1',
  })
const persistedCrossSystemInput =
  await resolveCanonicalCaptionCrossSystemExecutionInput({
    call,
    readPort: crossSystemComposition.readPort,
    authorityBindings: {
      executionPackageRef: ref(
        'package.broll.bridge.1',
        'canonical-approved-edit-execution-package-v5'),
      approvedSnapshotRef,
      approvedWorkItemRef: ref(
        'work.broll.bridge.1',
        'private-edit-authority-approved-work-item-v1'),
      canonicalJobRef: ref(
        'job.broll.bridge.1',
        'private-edit-authority-derived-job-v1'),
      plannedManifestEntryRef: ref(
        'manifest-entry.broll.bridge.1',
        'private-edit-asset-manifest-entry-v1'),
      estimateRef: ref(
        'estimate.broll.bridge.1',
        'private-edit-authority-credit-estimate-v1'),
      reservationRef: ref(
        'reservation.broll.bridge.1',
        'private-edit-authority-credit-reservation-v1'),
    },
  })
check(persistedCrossSystemInput?.sourceInput.mode
  === 'single_outbound_handoff'
  && crossSystemSourceReads === 2,
'The V3 B-roll support call must persist its exact Caption handoff before waiting on the owner.')
const outputFrameArtifact = call.inputArtifactRefs.find((artifact) =>
  artifact.artifactType === 'confirmed_output_frame')
const masterTimingArtifact = call.inputArtifactRefs.find((artifact) =>
  artifact.artifactType === 'master_timing_or_planning_timing')
assert.ok(outputFrameArtifact && masterTimingArtifact)
const planningConstraintRef = ref(
  'constraint.broll.bridge.1', 'caption-broll-planning-constraint-v1')
const ownerRequest = createCaptionBrollOwnerReadRequest({
  requestId: 'request.broll.bridge.1',
  brollManifestRef: structuredClone(
    BROLL_CAPTION_OWNER_MANIFEST_REF),
  canonicalScope: {
    ownerUserId: call.canonicalScope.ownerUserId,
    workspaceId: call.canonicalScope.workspaceId,
    projectId: call.canonicalScope.projectId,
    editSessionId: call.canonicalScope.editSessionId,
    planVersionId: 'plan.broll.bridge.1',
    approvedSnapshotRef,
    outputId: call.canonicalScope.outputId!,
    outputFrameRef: contractRef(outputFrameArtifact),
    sceneId: call.canonicalScope.sceneId!,
    authorizedFrameRange: {
      startFrameInclusive:
        call.canonicalScope.authorizedFrameRanges[0]!.startFrame,
      endFrameExclusive:
        call.canonicalScope.authorizedFrameRanges[0]!.endFrameExclusive,
      fps: 30,
    },
    masterTimingRef: contractRef(masterTimingArtifact),
    masterTimingHash: masterTimingArtifact.contentHash,
  },
  planningConstraintRef,
})
const initialResult = runCaptionsSpecialistJob({
  call,
  incomingSupportRequest: incomingRequest,
  brollOwnerReadRequest: ownerRequest,
})
check(initialResult.disposition === 'needs_followup'
  && initialResult.supportRequests.length === 1
  && initialResult.supportRequests[0]!.targetSkillKey === 'broll_owner',
'Caption must stop at the mediated B-roll owner-read request.')
const selectedSupportRequest = initialResult.supportRequests[0]!
const pair = createCanonicalSpecialistCallResultPair({
  call,
  result: initialResult,
  persistedAt: '2026-08-05T17:00:00.000Z',
})
await supportResumeRepository.persistCallResultPairCreateOnly({ pair })

const ownerResult = ownerResultFixture(ownerRequest)
let ownerReads = 0
const ownerReadPort = createCanonicalCaptionBrollOwnerReadPort(
  async ({ request }) => {
    ownerReads += 1
    assert.equal(request.requestDigestSha256,
      ownerRequest.requestDigestSha256)
    return structuredClone(ownerResult)
  })
let snapshotReads = 0
const snapshotAuthority = {
  canonicalScope: structuredClone(ownerRequest.canonicalScope),
  planningConstraintRef: structuredClone(planningConstraintRef),
}
const approvedSnapshotReadPort =
  createCanonicalCaptionBrollApprovedSnapshotReadPort(async ({
    approvedSnapshotRef: requestedSnapshot,
  }) => {
    snapshotReads += 1
    assert.deepEqual(requestedSnapshot, approvedSnapshotRef)
    return structuredClone(snapshotAuthority)
  })
const service = createCanonicalCaptionBrollSupportService({
  supportResumeRepository,
  approvedSnapshotReadPort,
  ownerReadPort,
  evidenceRepository,
  crossSystemExecutionInputReadPort: crossSystemComposition.readPort,
  incomingSupportRequestReadPort,
  now: () => new Date('2026-08-05T17:01:00.000Z'),
})
const bridgeInput = {
  authenticatedOwnerUserId: call.canonicalScope.ownerUserId,
  priorCallRef: contractRef(callRefLike(call)),
  selectedSupportRequestRef: contractRef(requestRefLike(selectedSupportRequest)),
}
const outcome = await service.projectAndResumeAuthenticatedEvidence(bridgeInput)
check(ownerReads === 2 && snapshotReads === 2,
  'Both canonical owners must be reread twice before admission.')
check(outcome.evidenceRecord.ownerResult.resultDigestSha256
  === ownerResult.resultDigestSha256
  && outcome.evidenceRecord.captionBinding.bindingState
    === 'authenticated_owner_ready',
'The bridge must persist the exact owner result and derive the Caption binding.')
check(outcome.evidenceRecord.authenticatedOwnerProjection.ownerKey
  === 'broll_owner'
  && outcome.evidenceRecord.authenticatedOwnerProjection.artifactRefs[0]!
    .artifactType === 'b_roll_caption_owner_read_result',
'The generic resume ledger must carry one exact B-roll-owned artifact.')
check(outcome.resumeRecord.resumedResult.disposition === 'completed'
  && outcome.resumeRecord.resumedResult.reasonCodes.includes(
    'broll_owner.contract_admission.accepted')
  && outcome.resumeRecord.resumedResult.reasonCodes.includes(
    'cross_system_coordination.caption_artifacts.accepted')
  && outcome.resumeRecord.resumedResult.producedArtifactRefs.some(
    (artifact) => artifact.artifactType ===
      'caption_cross_system_outbound_payload')
  && outcome.resumeRecord.resumedResult.producedArtifactRefs.some(
    (artifact) => artifact.artifactType === 'caption_cross_system_handoff')
  && crossSystemSourceReads === 2,
'The same Caption job must resume with authenticated evidence and its original persisted handoff package.')
check(outcome.resumeRecord.directPeerDispatchPerformed === false
  && outcome.evidenceRecord.sourceSelectionPerformedByCaption === false
  && outcome.evidenceRecord.cropOrTimingPerformedByCaption === false
  && outcome.evidenceRecord.runtimeExecutionPerformedByBridge === false
  && outcome.evidenceRecord.finalQaApprovalGrantedByBridge === false,
'The bridge must grant no selection, timing, runtime, or QA authority.')
check(parseCanonicalCaptionBrollAuthenticatedEvidenceRecord(
  outcome.evidenceRecord).recordDigestSha256
  === outcome.evidenceRecord.recordDigestSha256,
'The create-only evidence record must survive its closed parser.')
const persistedOwnerResult = await evidenceRepository.rereadOwnerResult({
  supportRequestRef: bridgeInput.selectedSupportRequestRef,
})
check(persistedOwnerResult?.resultDigestSha256
  === ownerResult.resultDigestSha256,
'The owner result must be independently persisted before projection.')
const replay = await service.projectAndResumeAuthenticatedEvidence(bridgeInput)
check(replay.evidenceRecord.recordDigestSha256
  === outcome.evidenceRecord.recordDigestSha256
  && replay.resumeRecord.recordDigestSha256
    === outcome.resumeRecord.recordDigestSha256,
'Exact replay must reconcile to identical evidence and resume records.')

await reject(() => service.projectAndResumeAuthenticatedEvidence({
  ...bridgeInput,
  authenticatedOwnerUserId: 'owner.crossed',
}))
await reject(() => service.projectAndResumeAuthenticatedEvidence({
  ...bridgeInput,
  selectedSupportRequestRef: {
    ...bridgeInput.selectedSupportRequestRef,
    id: 'request.crossed',
  },
}))
await reject(() => service.projectAndResumeAuthenticatedEvidence({
  ...bridgeInput,
  ownerResult,
} as never))

const staleSnapshotService = createCanonicalCaptionBrollSupportService({
  supportResumeRepository,
  ownerReadPort,
  evidenceRepository,
  approvedSnapshotReadPort:
    createCanonicalCaptionBrollApprovedSnapshotReadPort(async () => ({
      ...structuredClone(snapshotAuthority),
      canonicalScope: {
        ...structuredClone(snapshotAuthority.canonicalScope),
        sceneId: 'scene.crossed',
      },
    })),
})
await reject(() => staleSnapshotService.projectAndResumeAuthenticatedEvidence(
  bridgeInput))

let driftRead = 0
const driftService = createCanonicalCaptionBrollSupportService({
  supportResumeRepository,
  approvedSnapshotReadPort,
  evidenceRepository,
  ownerReadPort: createCanonicalCaptionBrollOwnerReadPort(async () => {
    driftRead += 1
    if (driftRead === 1) return structuredClone(ownerResult)
    const changed = structuredClone(ownerResult)
    changed.selectedMediaManifestRef.id = 'manifest.broll.changed'
    return redigest(changed as unknown as Record<string, unknown>,
      'resultDigestSha256')
  }),
})
await reject(() => driftService.projectAndResumeAuthenticatedEvidence(
  bridgeInput))

const tamperedRecord = structuredClone(outcome.evidenceRecord)
tamperedRecord.ownerResult.layoutOccupancyRef.id = 'layout.tampered'
assert.throws(() => parseCanonicalCaptionBrollAuthenticatedEvidenceRecord(
  tamperedRecord))
checks += 1

assert.throws(() => createCanonicalCaptionBrollSupportService({
  supportResumeRepository,
  approvedSnapshotReadPort,
  evidenceRepository,
  ownerReadPort: {
    schemaVersion: 'canonical-caption-broll-owner-read-port-v1',
    sourceAuthority: 'canonical_b_roll_owner',
    callerSuppliedOwnerResultAccepted: false,
    async readExact() { return ownerResult },
  },
}))
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-broll-support-service',
  status: 'passed',
  checks,
  ownerReads,
  snapshotReads,
  evidenceRecordDigestSha256:
    outcome.evidenceRecord.recordDigestSha256,
  resumeRecordDigestSha256: outcome.resumeRecord.recordDigestSha256,
  sourceSelectionPerformedByCaption: false,
  cropOrTimingPerformedByCaption: false,
  runtimeExecutionPerformedByBridge: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function ownerResultFixture(
  request: typeof ownerRequest,
): BrollCaptionOwnerReadResult {
  const withoutDigest: Omit<BrollCaptionOwnerReadResult,
    'resultDigestSha256'> = {
    schemaVersion: 'b_roll_caption_owner_read_result_v1',
    resultId: 'result.broll.bridge.1',
    ownerSkillKey: 'b_roll',
    requestingSkillKey: 'captions',
    requestedJobType: 'provide_caption_broll_composition_constraints',
    mediationMode: 'hq_mediated_owner_read',
    brollManifestRef: structuredClone(request.brollManifestRef),
    canonicalScope: structuredClone(request.canonicalScope),
    ownerRequestRef: {
      id: request.requestId,
      version: request.schemaVersion,
      contentHash: request.requestDigestSha256,
    },
    brollResultReceiptRef: ref(
      'receipt.broll.bridge.1', 'b_roll_result_receipt_v1'),
    selectedMediaManifestRef: ref(
      'manifest.broll.bridge.1', 'b_roll_candidate_media_manifest_v1'),
    layoutOccupancyRef: ref(
      'layout.broll.bridge.1', 'b_roll_remotion_layer_manifest_v1'),
    cropTimingRef: ref(
      'crop.broll.bridge.1', 'b_roll_caption_crop_timing_projection_v1'),
    visibleTextEvidenceRef: ref(
      'text.broll.bridge.1', 'b_roll_caption_visible_text_evidence_v1'),
    sourceContractVersions: {
      selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1',
      layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1',
      cropTimingRef: 'b_roll_caption_crop_timing_projection_v1',
      visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1',
    },
    authenticatedOwnerEvidenceRef: ref(
      'evidence.broll.bridge.1',
      'b_roll_authenticated_owner_read_evidence_v1'),
    exactPrivateOwnerRereadVerified: true,
    exactCanonicalScopeVerified: true,
    exactApprovedSnapshotVerified: true,
    exactOutputFrameAndMasterTimingVerified: true,
    sourceSelectionPerformedByCaption: false,
    cropOrTimingPerformedByCaption: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    rawChatIncluded: false,
    credentialsIncluded: false,
    sourceSelectionAuthorityGranted: false,
    cropOrTimingMutationAuthorityGranted: false,
    runtimeOrDispatchAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseBrollCaptionOwnerReadResult({
    ...withoutDigest,
    resultDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, resultDigestSha256: '' },
      'resultDigestSha256'),
  })
}

function contractRef(value: {
  id: string
  version: string
  contentHash: string
}): CaptionDomainRef {
  return {
    id: value.id,
    version: value.version,
    contentHash: value.contentHash,
  }
}

function callRefLike(value: typeof call) {
  return {
    id: value.callId,
    version: value.schemaVersion,
    contentHash: value.callDigestSha256,
  }
}

function requestRefLike(value: typeof selectedSupportRequest) {
  return {
    id: value.requestId,
    version: value.schemaVersion,
    contentHash: value.requestDigestSha256,
  }
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}
