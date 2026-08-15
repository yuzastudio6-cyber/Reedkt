import { readFileSync } from 'node:fs'

import {
  BROLL_CAPTION_OWNER_READ_RESULT_VERSION,
  BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT,
  assertBrollCaptionOwnerReadResultForRequest,
  brollCaptionOwnerReadRequestSchema,
  brollCaptionOwnerReadResultSchema,
  createBrollCaptionOwnerReadRequest,
} from '../edit-skills/b-roll/b-roll-caption-public-contract'
import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const hash = (character: string) => character.repeat(64)
const ref = (id: string, version: string, contentHash: string) => ({
  id,
  version,
  contentHash,
})

const canonicalScope = {
  ownerUserId: 'owner-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  planVersionId: 'plan-version-7',
  approvedSnapshotRef: ref('snapshot-1', 'approved-plan-snapshot-v1', hash('a')),
  outputId: 'output-1',
  outputFrameRef: ref('output-frame-1', 'confirmed-output-frame-v1', hash('b')),
  sceneId: 'scene-1',
  authorizedFrameRange: {
    startFrameInclusive: 120,
    endFrameExclusive: 240,
    fps: 30,
  },
  masterTimingRef: ref('master-timing-1', 'master_timing_plan_v1', hash('c')),
  masterTimingHash: hash('c'),
}

const request = createBrollCaptionOwnerReadRequest({
  requestId: 'caption-broll-request-1',
  requestingSkillKey: 'captions',
  ownerSkillKey: 'b_roll',
  requestedJobType: 'provide_caption_broll_composition_constraints',
  mediationMode: 'hq_mediated_owner_read',
  canonicalScope,
  planningConstraintRef: ref(
    'caption-planning-constraint-1',
    'caption-broll-planning-constraint-v1',
    hash('d'),
  ),
  requestedReferenceRoles: [
    'selectedMediaManifestRef',
    'layoutOccupancyRef',
    'cropTimingRef',
    'visibleTextEvidenceRef',
  ],
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
})

assert(
  brollCaptionOwnerReadRequestSchema.parse(request).requestDigestSha256 ===
    request.requestDigestSha256,
  'Request did not parse with its exact digest.',
)

const resultCore = {
  schemaVersion: BROLL_CAPTION_OWNER_READ_RESULT_VERSION,
  resultId: 'caption-broll-result-1',
  ownerSkillKey: 'b_roll' as const,
  requestingSkillKey: 'captions' as const,
  requestedJobType: 'provide_caption_broll_composition_constraints' as const,
  mediationMode: 'hq_mediated_owner_read' as const,
  brollManifestRef: skillManifestReference(BROLL_CAPABILITY_MANIFEST),
  canonicalScope,
  ownerRequestRef: ref(request.requestId, request.schemaVersion, request.requestDigestSha256),
  brollResultReceiptRef: ref('broll-result-1', 'b_roll_result_receipt_v1', hash('e')),
  selectedMediaManifestRef: ref(
    'selected-media-1',
    'b_roll_candidate_media_manifest_v1',
    hash('f'),
  ),
  layoutOccupancyRef: ref(
    'layout-occupancy-1',
    'b_roll_remotion_layer_manifest_v1',
    hash('1'),
  ),
  cropTimingRef: ref(
    'crop-timing-1',
    'b_roll_caption_crop_timing_projection_v1',
    hash('2'),
  ),
  visibleTextEvidenceRef: ref(
    'visible-text-1',
    'b_roll_caption_visible_text_evidence_v1',
    hash('3'),
  ),
  sourceContractVersions: {
    selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1' as const,
    layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1' as const,
    cropTimingRef: 'b_roll_caption_crop_timing_projection_v1' as const,
    visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1' as const,
  },
  authenticatedOwnerEvidenceRef: ref(
    'owner-evidence-1',
    'b_roll_authenticated_owner_read_evidence_v1',
    hash('4'),
  ),
  exactPrivateOwnerRereadVerified: true as const,
  exactCanonicalScopeVerified: true as const,
  exactApprovedSnapshotVerified: true as const,
  exactOutputFrameAndMasterTimingVerified: true as const,
  sourceSelectionPerformedByCaption: false as const,
  cropOrTimingPerformedByCaption: false as const,
  mediaBytesIncluded: false as const,
  mediaLocatorIncluded: false as const,
  rawChatIncluded: false as const,
  credentialsIncluded: false as const,
  sourceSelectionAuthorityGranted: false as const,
  cropOrTimingMutationAuthorityGranted: false as const,
  runtimeOrDispatchAuthorityGranted: false as const,
  assetMutationAuthorityGranted: false as const,
  finalQaApprovalGranted: false as const,
  billingAuthorityGranted: false as const,
  publicDeliveryGranted: false as const,
  productionAuthorityGranted: false as const,
}
const result = brollCaptionOwnerReadResultSchema.parse({
  ...resultCore,
  resultDigestSha256: hashSkillValue(resultCore),
})
assertBrollCaptionOwnerReadResultForRequest({ request, result })

const {
  receiptDigestSha256: publicReceiptDigest,
  ...publicReceiptCore
} = BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT
assert(
  publicReceiptDigest === hashSkillValue(publicReceiptCore),
  'Public contract receipt digest is stale.',
)
assert(
  BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT.sourceContracts.length === 4,
  'Receipt must map all four Caption opaque reference roles.',
)
assert(
  BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT.runtimeBindingDeclared === false &&
  BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT.runtimeExecutionAuthorized === false &&
  BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT.authenticatedPrivateEvidenceClaimed === false,
  'Type-only receipt overclaimed runtime or authenticated evidence.',
)

const forgedRequest = structuredClone(request)
forgedRequest.canonicalScope.workspaceId = 'workspace-forged'
assert(
  !brollCaptionOwnerReadRequestSchema.safeParse(forgedRequest).success,
  'Forged request scope was accepted.',
)
const crossWorkspaceResult = structuredClone(result)
crossWorkspaceResult.canonicalScope.workspaceId = 'workspace-other'
const crossWorkspaceCore: Record<string, unknown> = { ...crossWorkspaceResult }
delete crossWorkspaceCore.resultDigestSha256
crossWorkspaceResult.resultDigestSha256 = hashSkillValue(crossWorkspaceCore)
let crossWorkspaceRejected = false
try {
  assertBrollCaptionOwnerReadResultForRequest({ request, result: crossWorkspaceResult })
} catch {
  crossWorkspaceRejected = true
}
assert(crossWorkspaceRejected, 'Cross-workspace owner result was accepted.')
assert(
  !brollCaptionOwnerReadRequestSchema.safeParse({ ...request, mediaBytes: 'forbidden' }).success,
  'Request accepted media bytes.',
)
assert(
  !brollCaptionOwnerReadResultSchema.safeParse({ ...result, publicUrl: 'https://invalid' }).success,
  'Result accepted a public media locator.',
)

const source = readFileSync(
  new URL('../edit-skills/b-roll/b-roll-caption-public-contract.ts', import.meta.url),
  'utf8',
)
assert(!source.includes('captions-specialist'), 'B-roll contract imports Caption implementation.')
assert(!source.includes("../../src/types/caption"), 'B-roll contract imports Caption public types.')
assert(!source.includes('dispatch('), 'B-roll public type contract added peer dispatch.')

console.log(JSON.stringify({
  requestVersion: request.schemaVersion,
  requestContractDigest:
    BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT.requestContract.contractDigestSha256,
  resultVersion: result.schemaVersion,
  resultContractDigest:
    BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT.resultContract.contractDigestSha256,
  sourceContracts: BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT.sourceContracts.map((contract) => ({
    referenceField: contract.referenceField,
    sourceContractVersion: contract.sourceContractVersion,
    contractDigestSha256: contract.contractDigestSha256,
  })),
  receiptDigestSha256: BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT.receiptDigestSha256,
  runtimeBindingDeclared: false,
  runtimeExecutionAuthorized: false,
  authenticatedPrivateEvidenceClaimed: false,
  captionImplementationImported: false,
  peerDispatcherAdded: false,
}, null, 2))
