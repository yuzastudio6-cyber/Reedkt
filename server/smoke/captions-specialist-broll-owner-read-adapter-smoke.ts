import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  BrollCaptionOwnerReadResult,
  CaptionBrollOwnerReadProjectionAuthority,
} from '../../src/types/caption-broll-owner-read-adapter'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  BROLL_CAPTION_REQUEST_CONTRACT_DIGEST,
  BROLL_CAPTION_RESULT_CONTRACT_DIGEST,
  CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT,
  adaptBrollOwnerReadResultToCaptionBinding,
  assertBrollCaptionOwnerReadResultForRequest,
  createCaptionBrollOwnerReadRequest,
  parseBrollCaptionOwnerReadRequest,
  parseBrollCaptionOwnerReadResult,
  parseCaptionBrollOwnerReadAdapterReceipt,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import { parseCaptionBrollOwnerReadBinding } from
  '../captions-specialist/caption-multi-track-scene-graph'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { parseOrchestraSkillCall } from
  '../orchestra/orchestra-skill-contracts'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import {
  createCaptionsHarnessCall,
  resumeCaptionsHarnessCall,
} from '../internal-testing/captions-specialist-harness'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
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

const approvedSnapshotRef = ref(
  'snapshot.broll.caption.1', 'approved-plan-snapshot-v1')
const confirmedOutputFrameRef = ref(
  'frame.broll.caption.1', 'confirmed-output-frame-v1')
const masterTimingRef = ref(
  'timing.broll.caption.1', 'master_timing_plan_v1')
const planningConstraintRef = ref(
  'constraint.broll.caption.1', 'caption-broll-planning-constraint-v1')
const captionScope = {
  ownerUserId: 'owner.broll.caption.1',
  workspaceId: 'workspace.broll.caption.1',
  projectId: 'project.broll.caption.1',
  editSessionId: 'edit.broll.caption.1',
  planVersionId: 'plan.broll.caption.1',
  approvedSnapshotRef,
  outputId: 'output.broll.caption.1',
  sceneId: 'scene.broll.caption.1',
  authorizedFrameRanges: [{ startFrame: 120, endFrameExclusive: 240 }],
}
const request = createCaptionBrollOwnerReadRequest({
  requestId: 'request.broll.caption.1',
  canonicalScope: {
    ownerUserId: captionScope.ownerUserId,
    workspaceId: captionScope.workspaceId,
    projectId: captionScope.projectId,
    editSessionId: captionScope.editSessionId,
    planVersionId: captionScope.planVersionId,
    approvedSnapshotRef,
    outputId: captionScope.outputId,
    outputFrameRef: confirmedOutputFrameRef,
    sceneId: captionScope.sceneId,
    authorizedFrameRange: {
      startFrameInclusive: 120,
      endFrameExclusive: 240,
      fps: 30,
    },
    masterTimingRef,
    masterTimingHash: masterTimingRef.contentHash,
  },
  planningConstraintRef,
})

check(parseBrollCaptionOwnerReadRequest(request).requestDigestSha256
  === request.requestDigestSha256,
'Caption creates the exact frozen B-roll owner-read V1 request.')
check(request.requestedReferenceRoles.join('|')
  === 'selectedMediaManifestRef|layoutOccupancyRef|cropTimingRef|visibleTextEvidenceRef',
'The request asks for all four opaque B-roll reference roles in frozen order.')
check(!request.mediaBytesIncluded && !request.mediaLocatorIncluded
  && !request.rawChatIncluded && !request.credentialsIncluded
  && !request.sourceSelectionAuthorityGranted
  && !request.cropOrTimingMutationAuthorityGranted
  && !request.runtimeOrDispatchAuthorityGranted,
'The outbound request remains byte-free and grants no owner authority.')

const resultWithoutDigest: Omit<BrollCaptionOwnerReadResult,
  'resultDigestSha256'> = {
  schemaVersion: 'b_roll_caption_owner_read_result_v1',
  resultId: 'result.broll.caption.1',
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
    'receipt.broll.result.1', 'b_roll_result_receipt_v1'),
  selectedMediaManifestRef: ref(
    'manifest.broll.media.1', 'b_roll_candidate_media_manifest_v1'),
  layoutOccupancyRef: ref(
    'manifest.broll.layout.1', 'b_roll_remotion_layer_manifest_v1'),
  cropTimingRef: ref(
    'projection.broll.crop.1', 'b_roll_caption_crop_timing_projection_v1'),
  visibleTextEvidenceRef: ref(
    'evidence.broll.text.1', 'b_roll_caption_visible_text_evidence_v1'),
  sourceContractVersions: {
    selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1',
    layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1',
    cropTimingRef: 'b_roll_caption_crop_timing_projection_v1',
    visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1',
  },
  authenticatedOwnerEvidenceRef: ref(
    'evidence.broll.owner.1',
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
const result: BrollCaptionOwnerReadResult = {
  ...resultWithoutDigest,
  resultDigestSha256: calculateSkillContractDigest(
    { ...resultWithoutDigest, resultDigestSha256: '' },
    'resultDigestSha256'),
}
check(parseBrollCaptionOwnerReadResult(result).resultDigestSha256
  === result.resultDigestSha256,
'The exact authenticated B-roll result V1 parses with its frozen role refs.')
check(assertBrollCaptionOwnerReadResultForRequest({ request, result }).resultId
  === result.resultId,
'The result binds the exact request reference and complete canonical scope.')

const expected: CaptionBrollOwnerReadProjectionAuthority = {
  canonicalScope: captionScope,
  confirmedOutputFrameRef,
  masterTimingRef,
  masterTimingHash: masterTimingRef.contentHash,
  authorizedFps: 30,
  planningConstraintRef,
}
const binding = adaptBrollOwnerReadResultToCaptionBinding({
  request,
  result,
  expected,
})
check(binding.bindingState === 'authenticated_owner_ready'
  && binding.evidenceMode === 'authenticated_private_runtime'
  && binding.exactOwnerResultRereadVerified
  && binding.exactScopeFrameAndTimingVerified,
'The adapter admits readiness only after exact private owner and scope rereads.')
check(binding.ownerRequestRef?.contentHash === request.requestDigestSha256
  && binding.ownerResultRef?.contentHash === result.resultDigestSha256
  && binding.selectedMediaManifestRef?.version
    === 'b_roll_candidate_media_manifest_v1'
  && binding.layoutOccupancyRef?.version
    === 'b_roll_remotion_layer_manifest_v1'
  && binding.cropTimingRef?.version
    === 'b_roll_caption_crop_timing_projection_v1'
  && binding.visibleTextEvidenceRef?.version
    === 'b_roll_caption_visible_text_evidence_v1',
'Caption projects only the exact request/result and four opaque source refs.')
check(parseCaptionBrollOwnerReadBinding(binding).bindingDigestSha256
  === binding.bindingDigestSha256,
'The projected binding survives the existing closed Caption parser.')
check(!binding.sourceSelectionPerformedByCaption
  && !binding.cropOrTimingPerformedByCaption
  && !binding.runtimeOrDispatchAuthorityGranted
  && !binding.assetMutationAuthorityGranted
  && !binding.finalQaApprovalGranted
  && !binding.publicDeliveryGranted
  && !binding.productionAuthorityGranted,
'Projection grants Caption no B-roll selection, timing, runtime, or QA authority.')

const receipt = parseCaptionBrollOwnerReadAdapterReceipt(
  CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT)
check(receipt.sourcePublicContract.requestContractDigestSha256
  === BROLL_CAPTION_REQUEST_CONTRACT_DIGEST
  && receipt.sourcePublicContract.resultContractDigestSha256
    === BROLL_CAPTION_RESULT_CONTRACT_DIGEST
  && receipt.captionBindingTargetVersion
    === 'caption-broll-owner-read-binding-v1',
'The additive receipt freezes the published B-roll contract and Caption target.')
check(!receipt.runtimeBindingDeclared
  && !receipt.ownerResultPersistenceDeclared
  && !receipt.authenticatedOwnerResultIntegrated
  && !receipt.directPeerDispatchAdded
  && !receipt.productionAuthorityGranted,
'A source adapter receipt does not overclaim mounted owner runtime.')

const runtimeSnapshotRef = ref(
  'snapshot.broll.runtime.1', 'approved-plan-snapshot-v1')
const runtimeCall = createCaptionsHarnessCall({
  callId: 'caption.broll.runtime.1',
  jobType: 'provide_caption_broll_composition_constraints',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
  approvedSnapshotRef: runtimeSnapshotRef,
  outputId: 'output.broll.runtime.1',
  sceneId: 'scene.broll.runtime.1',
})
const runtimeOutputFrameRef = runtimeCall.inputArtifactRefs.find(
  (artifact) => artifact.artifactType === 'confirmed_output_frame')
const runtimeMasterTimingRef = runtimeCall.inputArtifactRefs.find(
  (artifact) => artifact.artifactType
    === 'master_timing_or_planning_timing')
assert.ok(runtimeOutputFrameRef && runtimeMasterTimingRef)
const runtimeOutputFrameContractRef = {
  id: runtimeOutputFrameRef.id,
  version: runtimeOutputFrameRef.version,
  contentHash: runtimeOutputFrameRef.contentHash,
}
const runtimeMasterTimingContractRef = {
  id: runtimeMasterTimingRef.id,
  version: runtimeMasterTimingRef.version,
  contentHash: runtimeMasterTimingRef.contentHash,
}
const runtimeRequest = createCaptionBrollOwnerReadRequest({
  requestId: 'request.broll.runtime.1',
  canonicalScope: {
    ownerUserId: runtimeCall.canonicalScope.ownerUserId,
    workspaceId: runtimeCall.canonicalScope.workspaceId,
    projectId: runtimeCall.canonicalScope.projectId,
    editSessionId: runtimeCall.canonicalScope.editSessionId,
    planVersionId: 'plan.broll.runtime.1',
    approvedSnapshotRef: runtimeSnapshotRef,
    outputId: 'output.broll.runtime.1',
    outputFrameRef: runtimeOutputFrameContractRef,
    sceneId: 'scene.broll.runtime.1',
    authorizedFrameRange: {
      startFrameInclusive: 120,
      endFrameExclusive: 240,
      fps: 30,
    },
    masterTimingRef: runtimeMasterTimingContractRef,
    masterTimingHash: runtimeMasterTimingRef.contentHash,
  },
  planningConstraintRef: ref(
    'constraint.broll.runtime.1', 'caption-broll-planning-constraint-v1'),
})
const runtimeInitial = runCaptionsSpecialistJob({
  call: runtimeCall,
  brollOwnerReadRequest: runtimeRequest,
})
check(runtimeInitial.disposition === 'needs_followup'
  && runtimeInitial.supportRequests.length === 1
  && runtimeInitial.supportRequests[0].targetSkillKey === 'broll_owner'
  && runtimeInitial.supportRequests[0].requestedArtifactTypes.join('|')
    === 'b_roll_caption_owner_read_result',
'Runtime requests the B-roll-owned result rather than fabricating a Caption binding.')
check(runtimeInitial.supportRequests[0].typedPayloadType
  === runtimeRequest.schemaVersion
  && (runtimeInitial.supportRequests[0].typedPayload as
    Record<string, unknown>).requestDigestSha256
      === runtimeRequest.requestDigestSha256,
'Runtime embeds the exact byte-free owner request in the mediated support envelope.')

const runtimeResultCandidate = structuredClone(result)
runtimeResultCandidate.resultId = 'result.broll.runtime.1'
runtimeResultCandidate.brollManifestRef = structuredClone(
  runtimeRequest.brollManifestRef)
runtimeResultCandidate.canonicalScope = structuredClone(
  runtimeRequest.canonicalScope)
runtimeResultCandidate.ownerRequestRef = {
  id: runtimeRequest.requestId,
  version: runtimeRequest.schemaVersion,
  contentHash: runtimeRequest.requestDigestSha256,
}
const runtimeResult = parseBrollCaptionOwnerReadResult(redigest(
  runtimeResultCandidate as unknown as Record<string, unknown>,
  'resultDigestSha256'))
const runtimeSupportRequest = runtimeInitial.supportRequests[0]
const runtimeResumedCandidate = resumeCaptionsHarnessCall(
  runtimeCall, runtimeSupportRequest)
runtimeResumedCandidate.injectedSupportArtifactRefs[0] = {
  ...runtimeResumedCandidate.injectedSupportArtifactRefs[0],
  id: runtimeResult.resultId,
  version: runtimeResult.schemaVersion,
  contentHash: runtimeResult.resultDigestSha256,
  artifactType: 'b_roll_caption_owner_read_result',
  producerSkillKey: 'broll_owner',
}
const runtimeResumedCall = parseOrchestraSkillCall(redigest(
  runtimeResumedCandidate as unknown as Record<string, unknown>,
  'callDigestSha256'))
const runtimeCompleted = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeSupportRequest,
  brollOwnerReadRequest: runtimeRequest,
  brollOwnerReadResult: runtimeResult,
})
check(runtimeCompleted.disposition === 'completed'
  && runtimeCompleted.reasonCodes.includes(
    'broll_owner.contract_admission.accepted'),
'Exact request, owner result, injected artifact, and Caption projection admit the runtime.')

const missingRuntimeResult = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeSupportRequest,
  brollOwnerReadRequest: runtimeRequest,
})
check(missingRuntimeResult.disposition === 'blocked'
  && missingRuntimeResult.reasonCodes.join('|')
    === 'input.broll_owner.result.admission.failed',
'Typed B-roll resume fails closed without the exact owner result.')

const referenceOnlyInitial = runCaptionsSpecialistJob({ call: runtimeCall })
const referenceOnlyRequest = referenceOnlyInitial.supportRequests[0]
const referenceOnlyCall = resumeCaptionsHarnessCall(
  runtimeCall, referenceOnlyRequest)
const referenceOnlyResult = runCaptionsSpecialistJob({
  call: referenceOnlyCall,
  resumeSupportRequest: referenceOnlyRequest,
})
check(referenceOnlyResult.disposition === 'blocked'
  && referenceOnlyResult.reasonCodes.join('|')
    === 'input.broll_owner.request.missing',
'A receipt reference alone cannot satisfy the exact B-roll owner-read request.')

const crossedRuntimeResult = structuredClone(runtimeResult)
crossedRuntimeResult.canonicalScope.sceneId = 'scene.broll.crossed'
const crossedRuntimeAdmission = runCaptionsSpecialistJob({
  call: runtimeResumedCall,
  resumeSupportRequest: runtimeSupportRequest,
  brollOwnerReadRequest: runtimeRequest,
  brollOwnerReadResult: redigest(
    crossedRuntimeResult as unknown as Record<string, unknown>,
    'resultDigestSha256'),
})
check(crossedRuntimeAdmission.disposition === 'blocked'
  && crossedRuntimeAdmission.reasonCodes.join('|')
    === 'input.broll_owner.result.admission.failed',
'A digest-valid cross-scene B-roll owner result is rejected semantically.')

const staleRequest = structuredClone(request)
staleRequest.canonicalScope.workspaceId = 'workspace.forged'
expectThrow(() => parseBrollCaptionOwnerReadRequest(staleRequest))
const unsafeRequest = structuredClone(request)
unsafeRequest.requestId = '/tmp/broll-request'
expectThrow(() => parseBrollCaptionOwnerReadRequest(redigest(
  unsafeRequest as unknown as Record<string, unknown>,
  'requestDigestSha256')))
expectThrow(() => parseBrollCaptionOwnerReadRequest({
  ...request,
  mediaBytes: 'forbidden',
}))

const crossWorkspaceResult = structuredClone(result)
crossWorkspaceResult.canonicalScope.workspaceId = 'workspace.other'
expectThrow(() => assertBrollCaptionOwnerReadResultForRequest({
  request,
  result: redigest(crossWorkspaceResult as unknown as Record<string, unknown>,
    'resultDigestSha256'),
}))
const crossedRequestResult = structuredClone(result)
crossedRequestResult.ownerRequestRef.id = 'request.other'
expectThrow(() => assertBrollCaptionOwnerReadResultForRequest({
  request,
  result: redigest(crossedRequestResult as unknown as Record<string, unknown>,
    'resultDigestSha256'),
}))
const wrongRoleResult = structuredClone(result)
wrongRoleResult.cropTimingRef.version = 'b_roll_crop_unknown_v1'
expectThrow(() => parseBrollCaptionOwnerReadResult(redigest(
  wrongRoleResult as unknown as Record<string, unknown>,
  'resultDigestSha256')))
const authorityOverclaim = structuredClone(result) as unknown as
  Record<string, unknown>
authorityOverclaim.runtimeOrDispatchAuthorityGranted = true
expectThrow(() => parseBrollCaptionOwnerReadResult(redigest(
  authorityOverclaim, 'resultDigestSha256')))
expectThrow(() => parseBrollCaptionOwnerReadResult({
  ...result,
  publicUrl: 'https://invalid.example/media.mp4',
}))

expectThrow(() => adaptBrollOwnerReadResultToCaptionBinding({
  request,
  result,
  expected: {
    ...expected,
    authorizedFps: 24,
  },
}))
expectThrow(() => adaptBrollOwnerReadResultToCaptionBinding({
  request,
  result,
  expected: {
    ...expected,
    confirmedOutputFrameRef: ref(
      'frame.other', 'confirmed-output-frame-v1'),
  },
}))
expectThrow(() => adaptBrollOwnerReadResultToCaptionBinding({
  request,
  result,
  expected: {
    ...expected,
    canonicalScope: {
      ...captionScope,
      approvedSnapshotRef: ref(
        'snapshot.other', 'approved-plan-snapshot-v1'),
    },
  },
}))
expectThrow(() => adaptBrollOwnerReadResultToCaptionBinding({
  request,
  result,
  expected: {
    ...expected,
    masterTimingHash: hash('timing.other'),
  },
}))
expectThrow(() => adaptBrollOwnerReadResultToCaptionBinding({
  request,
  result,
  expected: {
    ...expected,
    planningConstraintRef: ref(
      'constraint.other', 'caption-broll-planning-constraint-v1'),
  },
}))

const inherited = Object.create({ runtimeOrDispatchAuthorityGranted: true })
Object.assign(inherited, structuredClone(request))
expectThrow(() => parseBrollCaptionOwnerReadRequest(inherited))
const cyclic = structuredClone(request) as unknown as Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() => parseBrollCaptionOwnerReadRequest(cyclic))

console.log(JSON.stringify({
  smoke: 'captions_specialist_broll_owner_read_adapter',
  assertions,
  requestVersion: request.schemaVersion,
  resultVersion: result.schemaVersion,
  adapterVersion: receipt.schemaVersion,
  adapterDigestSha256: receipt.adapterDigestSha256,
  captionBindingDigestSha256: binding.bindingDigestSha256,
  authenticatedOwnerResultIntegrated: false,
  runtimeOrDispatchAuthorityGranted: false,
  productionAuthorityGranted: false,
  result: 'passed',
}, null, 2))
