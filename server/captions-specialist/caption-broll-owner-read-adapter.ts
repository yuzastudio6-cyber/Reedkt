import { z } from 'zod'

import {
  BROLL_CAPTION_OWNER_READ_REQUEST_VERSION,
  BROLL_CAPTION_OWNER_READ_RESULT_VERSION,
  BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT_VERSION,
  CAPTION_BROLL_OWNER_READ_ADAPTER_VERSION,
  type BrollCaptionCanonicalScope,
  type BrollCaptionOwnerReadRequest,
  type BrollCaptionOwnerReadResult,
  type CaptionBrollOwnerReadAdapterReceipt,
  type CaptionBrollOwnerReadProjectionAuthority,
} from '../../src/types/caption-broll-owner-read-adapter'
import {
  CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
  type CaptionBrollOwnerReadBinding,
} from '../../src/types/caption-multi-track-scene-graph'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { parseCaptionBrollOwnerReadBinding } from
  './caption-multi-track-scene-graph'

export const BROLL_CAPTION_OWNER_MANIFEST_HASH =
  '40219ecc4319bc5639de87f16695ba9f87119ec7efce60acbd95fc60b1d4dec0' as const
export const BROLL_CAPTION_REQUEST_CONTRACT_DIGEST =
  '41a8ff19a61ccba5ea99c6c0839939b237388285f7672b1ec2279cd28d835788' as const
export const BROLL_CAPTION_RESULT_CONTRACT_DIGEST =
  '5821d74644e3e7284696bc5db4bac4597c49c64de48680cb166c041249443a32' as const
export const BROLL_CAPTION_PUBLIC_RECEIPT_DIGEST =
  '255f13e74429107954ea4d1b75d42fbe4002d2f5e7d3b40ab0f5e14ce4287038' as const

const safeIdentity = z.string().trim().min(1).max(240)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const gitSha = z.string().regex(/^[a-f0-9]{40}$/u)
const opaqueRefSchema = z.object({
  id: safeIdentity,
  version: safeIdentity,
  contentHash: sha256,
}).strict()
const manifestRefSchema = z.object({
  schemaVersion: z.literal('edit-skill-manifest-reference-v1'),
  skillKey: z.literal('b_roll'),
  skillVersion: z.literal('1.0.0'),
  contractVersion: z.literal('b_roll.skill_contract.v1'),
  manifestHash: z.literal(BROLL_CAPTION_OWNER_MANIFEST_HASH),
}).strict()
const frameRangeSchema = z.object({
  startFrameInclusive: z.number().int().nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
  endFrameExclusive: z.number().int().positive()
    .max(Number.MAX_SAFE_INTEGER),
  fps: z.number().int().min(1).max(120),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrameInclusive) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'B-roll Caption scope requires a positive frame range.',
    })
  }
})
const canonicalScopeSchema: z.ZodType<BrollCaptionCanonicalScope> = z.object({
  ownerUserId: safeIdentity,
  workspaceId: safeIdentity,
  projectId: safeIdentity,
  editSessionId: safeIdentity,
  planVersionId: safeIdentity,
  approvedSnapshotRef: opaqueRefSchema,
  outputId: safeIdentity,
  outputFrameRef: opaqueRefSchema,
  sceneId: safeIdentity,
  authorizedFrameRange: frameRangeSchema,
  masterTimingRef: opaqueRefSchema,
  masterTimingHash: sha256,
}).strict().superRefine((scope, context) => {
  if (scope.masterTimingRef.contentHash !== scope.masterTimingHash) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'B-roll Caption MasterTiming reference and hash differ.',
    })
  }
})
const authorityDenialShape = {
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  credentialsIncluded: z.literal(false),
  sourceSelectionAuthorityGranted: z.literal(false),
  cropOrTimingMutationAuthorityGranted: z.literal(false),
  runtimeOrDispatchAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
} as const

const requestSchema: z.ZodType<BrollCaptionOwnerReadRequest> = z.object({
  schemaVersion: z.literal(BROLL_CAPTION_OWNER_READ_REQUEST_VERSION),
  requestId: safeIdentity,
  requestDigestSha256: sha256,
  requestingSkillKey: z.literal('captions'),
  ownerSkillKey: z.literal('b_roll'),
  requestedJobType:
    z.literal('provide_caption_broll_composition_constraints'),
  mediationMode: z.literal('hq_mediated_owner_read'),
  brollManifestRef: manifestRefSchema,
  canonicalScope: canonicalScopeSchema,
  planningConstraintRef: opaqueRefSchema,
  requestedReferenceRoles: z.tuple([
    z.literal('selectedMediaManifestRef'),
    z.literal('layoutOccupancyRef'),
    z.literal('cropTimingRef'),
    z.literal('visibleTextEvidenceRef'),
  ]),
  ...authorityDenialShape,
}).strict()

const resultSchema: z.ZodType<BrollCaptionOwnerReadResult> = z.object({
  schemaVersion: z.literal(BROLL_CAPTION_OWNER_READ_RESULT_VERSION),
  resultId: safeIdentity,
  resultDigestSha256: sha256,
  ownerSkillKey: z.literal('b_roll'),
  requestingSkillKey: z.literal('captions'),
  requestedJobType:
    z.literal('provide_caption_broll_composition_constraints'),
  mediationMode: z.literal('hq_mediated_owner_read'),
  brollManifestRef: manifestRefSchema,
  canonicalScope: canonicalScopeSchema,
  ownerRequestRef: opaqueRefSchema,
  brollResultReceiptRef: opaqueRefSchema,
  selectedMediaManifestRef: opaqueRefSchema,
  layoutOccupancyRef: opaqueRefSchema,
  cropTimingRef: opaqueRefSchema,
  visibleTextEvidenceRef: opaqueRefSchema,
  sourceContractVersions: z.object({
    selectedMediaManifestRef:
      z.literal('b_roll_candidate_media_manifest_v1'),
    layoutOccupancyRef: z.literal('b_roll_remotion_layer_manifest_v1'),
    cropTimingRef: z.literal('b_roll_caption_crop_timing_projection_v1'),
    visibleTextEvidenceRef:
      z.literal('b_roll_caption_visible_text_evidence_v1'),
  }).strict(),
  authenticatedOwnerEvidenceRef: opaqueRefSchema,
  exactPrivateOwnerRereadVerified: z.literal(true),
  exactCanonicalScopeVerified: z.literal(true),
  exactApprovedSnapshotVerified: z.literal(true),
  exactOutputFrameAndMasterTimingVerified: z.literal(true),
  sourceSelectionPerformedByCaption: z.literal(false),
  cropOrTimingPerformedByCaption: z.literal(false),
  ...authorityDenialShape,
}).strict()

const receiptSchema: z.ZodType<CaptionBrollOwnerReadAdapterReceipt> = z.object({
  schemaVersion: z.literal(CAPTION_BROLL_OWNER_READ_ADAPTER_VERSION),
  adapterId: safeIdentity,
  adapterDigestSha256: sha256,
  sourcePublicContract: z.object({
    repository: z.literal('yuzastudio6-cyber/Reedkt'),
    branch: z.literal('codex/reeditpro-b-roll-skill-end-to-end'),
    sourceCommit: gitSha,
    evidenceCommit: gitSha,
    requestVersion: z.literal(BROLL_CAPTION_OWNER_READ_REQUEST_VERSION),
    requestContractDigestSha256:
      z.literal(BROLL_CAPTION_REQUEST_CONTRACT_DIGEST),
    resultVersion: z.literal(BROLL_CAPTION_OWNER_READ_RESULT_VERSION),
    resultContractDigestSha256:
      z.literal(BROLL_CAPTION_RESULT_CONTRACT_DIGEST),
    receiptVersion:
      z.literal(BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT_VERSION),
    receiptDigestSha256: z.literal(BROLL_CAPTION_PUBLIC_RECEIPT_DIGEST),
    ownerManifestDigestSha256:
      z.literal(BROLL_CAPTION_OWNER_MANIFEST_HASH),
  }).strict(),
  sourceReferenceContractDigests: z.object({
    selectedMediaManifestRef: z.literal(
      '3e3056bde5f206762fef63d46cfd3bf361ae3b3469617ecd1d5f3717a3e84998'),
    layoutOccupancyRef: z.literal(
      '798219ffe1117b4edc4938baf77af3a29bd621b0b1a213eb1ffa068cb06581d5'),
    cropTimingRef: z.literal(
      '39d7dd822c3f5fcbc9f92f7ce62397b168b52ac0c4e63814a1bcf6c4c2f1664d'),
    visibleTextEvidenceRef: z.literal(
      'c1c5fcf64562131948c5d41402f6a78663ff4af8115c4b72c92b2c70e5ccc7a6'),
  }).strict(),
  captionBindingTargetVersion:
    z.literal(CAPTION_BROLL_OWNER_READ_BINDING_VERSION),
  mediationMode: z.literal('hq_mediated_owner_read'),
  exactRequestResultScopeBindingRequired: z.literal(true),
  exactCaptionScopeFrameTimingRereadRequired: z.literal(true),
  opaqueReferencesOnly: z.literal(true),
  runtimeBindingDeclared: z.literal(false),
  ownerResultPersistenceDeclared: z.literal(false),
  authenticatedOwnerResultIntegrated: z.literal(false),
  captionMayConstructOwnerResult: z.literal(false),
  captionMaySelectSource: z.literal(false),
  captionMayMutateCropOrTiming: z.literal(false),
  directPeerDispatchAdded: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const unsafeTextPattern =
  /https?:\/\/|file:\/\/|\/(?:Users|Volumes|home|tmp)\/|\\\\|\.\.[/\\]|(?:authorization|password|credential|secret)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+/iu

function assertNoUnsafeText(value: unknown, label: string): void {
  const stack = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string' && unsafeTextPattern.test(current)) {
      throw new Error(`${label} contains URL, path, or credential-shaped text.`)
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}

function exactRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function exactScope(
  left: BrollCaptionCanonicalScope,
  right: BrollCaptionCanonicalScope,
): boolean {
  return calculateSkillContractDigest(
    { scope: left, digest: '' }, 'digest')
    === calculateSkillContractDigest({ scope: right, digest: '' }, 'digest')
}

function verifyDigest(
  value: Record<string, unknown>,
  field: string,
  label: string,
): void {
  if (value[field] !== calculateSkillContractDigest(value, field)) {
    throw new Error(`${label} digest verification failed.`)
  }
}

export function parseBrollCaptionOwnerReadRequest(
  value: unknown,
): BrollCaptionOwnerReadRequest {
  assertClosedContractTree(value, 'B-roll Caption owner-read request')
  assertNoUnsafeText(value, 'B-roll Caption owner-read request')
  const request = requestSchema.parse(value)
  verifyDigest(request as unknown as Record<string, unknown>,
    'requestDigestSha256', 'B-roll Caption owner-read request')
  return structuredClone(request)
}

export function createCaptionBrollOwnerReadRequest(input: {
  requestId: string
  canonicalScope: BrollCaptionCanonicalScope
  planningConstraintRef: BrollCaptionOwnerReadRequest['planningConstraintRef']
}): BrollCaptionOwnerReadRequest {
  const withoutDigest: Omit<BrollCaptionOwnerReadRequest,
    'requestDigestSha256'> = {
    schemaVersion: BROLL_CAPTION_OWNER_READ_REQUEST_VERSION,
    requestId: input.requestId,
    requestingSkillKey: 'captions',
    ownerSkillKey: 'b_roll',
    requestedJobType: 'provide_caption_broll_composition_constraints',
    mediationMode: 'hq_mediated_owner_read',
    brollManifestRef: {
      schemaVersion: 'edit-skill-manifest-reference-v1',
      skillKey: 'b_roll',
      skillVersion: '1.0.0',
      contractVersion: 'b_roll.skill_contract.v1',
      manifestHash: BROLL_CAPTION_OWNER_MANIFEST_HASH,
    },
    canonicalScope: structuredClone(input.canonicalScope),
    planningConstraintRef: structuredClone(input.planningConstraintRef),
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
  }
  return parseBrollCaptionOwnerReadRequest({
    ...withoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, requestDigestSha256: '' },
      'requestDigestSha256'),
  })
}

export function parseBrollCaptionOwnerReadResult(
  value: unknown,
): BrollCaptionOwnerReadResult {
  assertClosedContractTree(value, 'B-roll Caption owner-read result')
  assertNoUnsafeText(value, 'B-roll Caption owner-read result')
  const result = resultSchema.parse(value)
  verifyDigest(result as unknown as Record<string, unknown>,
    'resultDigestSha256', 'B-roll Caption owner-read result')
  if (result.ownerRequestRef.version
      !== BROLL_CAPTION_OWNER_READ_REQUEST_VERSION
    || result.brollResultReceiptRef.version !== 'b_roll_result_receipt_v1'
    || result.selectedMediaManifestRef.version
      !== result.sourceContractVersions.selectedMediaManifestRef
    || result.layoutOccupancyRef.version
      !== result.sourceContractVersions.layoutOccupancyRef
    || result.cropTimingRef.version
      !== result.sourceContractVersions.cropTimingRef
    || result.visibleTextEvidenceRef.version
      !== result.sourceContractVersions.visibleTextEvidenceRef
    || result.authenticatedOwnerEvidenceRef.version
      !== 'b_roll_authenticated_owner_read_evidence_v1') {
    throw new Error('B-roll Caption result reference role is mismatched.')
  }
  return structuredClone(result)
}

export function assertBrollCaptionOwnerReadResultForRequest(input: {
  request: unknown
  result: unknown
}): BrollCaptionOwnerReadResult {
  const request = parseBrollCaptionOwnerReadRequest(input.request)
  const result = parseBrollCaptionOwnerReadResult(input.result)
  const expectedRequestRef = {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
  if (!exactScope(request.canonicalScope, result.canonicalScope)
    || !exactRef(expectedRequestRef, result.ownerRequestRef)) {
    throw new Error('B-roll result does not bind the exact Caption request.')
  }
  return result
}

function assertProjectionAuthority(
  request: BrollCaptionOwnerReadRequest,
  expected: CaptionBrollOwnerReadProjectionAuthority,
): void {
  const scope = request.canonicalScope
  const captionScope = expected.canonicalScope
  if (captionScope.approvedSnapshotRef === null
    || captionScope.sceneId === null
    || captionScope.authorizedFrameRanges.length !== 1
    || scope.ownerUserId !== captionScope.ownerUserId
    || scope.workspaceId !== captionScope.workspaceId
    || scope.projectId !== captionScope.projectId
    || scope.editSessionId !== captionScope.editSessionId
    || scope.planVersionId !== captionScope.planVersionId
    || !exactRef(scope.approvedSnapshotRef, captionScope.approvedSnapshotRef)
    || scope.outputId !== captionScope.outputId
    || scope.sceneId !== captionScope.sceneId
    || scope.authorizedFrameRange.startFrameInclusive
      !== captionScope.authorizedFrameRanges[0].startFrame
    || scope.authorizedFrameRange.endFrameExclusive
      !== captionScope.authorizedFrameRanges[0].endFrameExclusive
    || scope.authorizedFrameRange.fps !== expected.authorizedFps
    || !exactRef(scope.outputFrameRef, expected.confirmedOutputFrameRef)
    || !exactRef(scope.masterTimingRef, expected.masterTimingRef)
    || scope.masterTimingHash !== expected.masterTimingHash
    || expected.masterTimingRef.contentHash !== expected.masterTimingHash
    || !exactRef(request.planningConstraintRef,
      expected.planningConstraintRef)) {
    throw new Error(
      'B-roll owner-read request is stale against Caption authority.',
    )
  }
}

export function adaptBrollOwnerReadResultToCaptionBinding(input: {
  request: unknown
  result: unknown
  expected: CaptionBrollOwnerReadProjectionAuthority
}): CaptionBrollOwnerReadBinding {
  const request = parseBrollCaptionOwnerReadRequest(input.request)
  const result = assertBrollCaptionOwnerReadResultForRequest({
    request,
    result: input.result,
  })
  assertProjectionAuthority(request, input.expected)
  const withoutDigest: Omit<CaptionBrollOwnerReadBinding,
    'bindingDigestSha256'> = {
    schemaVersion: CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
    bindingId: `${result.resultId}.caption-binding`,
    canonicalScope: structuredClone(input.expected.canonicalScope),
    requestedSceneId: request.canonicalScope.sceneId,
    planningConstraintRef: structuredClone(request.planningConstraintRef),
    ownerRequestRef: {
      id: request.requestId,
      version: request.schemaVersion,
      contentHash: request.requestDigestSha256,
    },
    ownerResultRef: {
      id: result.resultId,
      version: result.schemaVersion,
      contentHash: result.resultDigestSha256,
    },
    selectedMediaManifestRef: structuredClone(result.selectedMediaManifestRef),
    layoutOccupancyRef: structuredClone(result.layoutOccupancyRef),
    cropTimingRef: structuredClone(result.cropTimingRef),
    visibleTextEvidenceRef: structuredClone(result.visibleTextEvidenceRef),
    bindingState: 'authenticated_owner_ready',
    evidenceMode: 'authenticated_private_runtime',
    exactOwnerResultRereadVerified: true,
    exactScopeFrameAndTimingVerified: true,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    sourceSelectionPerformedByCaption: false,
    cropOrTimingPerformedByCaption: false,
    runtimeOrDispatchAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionBrollOwnerReadBinding({
    ...withoutDigest,
    bindingDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, bindingDigestSha256: '' },
      'bindingDigestSha256'),
  })
}

export function parseCaptionBrollOwnerReadAdapterReceipt(
  value: unknown,
): CaptionBrollOwnerReadAdapterReceipt {
  assertClosedContractTree(value, 'Caption B-roll owner-read adapter receipt')
  assertNoUnsafeText(value, 'Caption B-roll owner-read adapter receipt')
  const receipt = receiptSchema.parse(value)
  verifyDigest(receipt as unknown as Record<string, unknown>,
    'adapterDigestSha256', 'Caption B-roll owner-read adapter receipt')
  return structuredClone(receipt)
}

const adapterReceiptWithoutDigest: Omit<CaptionBrollOwnerReadAdapterReceipt,
  'adapterDigestSha256'> = {
  schemaVersion: CAPTION_BROLL_OWNER_READ_ADAPTER_VERSION,
  adapterId: 'captions.broll.owner-read.adapter',
  sourcePublicContract: {
    repository: 'yuzastudio6-cyber/Reedkt',
    branch: 'codex/reeditpro-b-roll-skill-end-to-end',
    sourceCommit: '86b624a5a61cd45dfefaf4ae680be455859cc0e6',
    evidenceCommit: '59acac49dd41b78d9f274635fa1b5cfdd9de5b25',
    requestVersion: BROLL_CAPTION_OWNER_READ_REQUEST_VERSION,
    requestContractDigestSha256: BROLL_CAPTION_REQUEST_CONTRACT_DIGEST,
    resultVersion: BROLL_CAPTION_OWNER_READ_RESULT_VERSION,
    resultContractDigestSha256: BROLL_CAPTION_RESULT_CONTRACT_DIGEST,
    receiptVersion: BROLL_CAPTION_PUBLIC_CONTRACT_RECEIPT_VERSION,
    receiptDigestSha256: BROLL_CAPTION_PUBLIC_RECEIPT_DIGEST,
    ownerManifestDigestSha256: BROLL_CAPTION_OWNER_MANIFEST_HASH,
  },
  sourceReferenceContractDigests: {
    selectedMediaManifestRef:
      '3e3056bde5f206762fef63d46cfd3bf361ae3b3469617ecd1d5f3717a3e84998',
    layoutOccupancyRef:
      '798219ffe1117b4edc4938baf77af3a29bd621b0b1a213eb1ffa068cb06581d5',
    cropTimingRef:
      '39d7dd822c3f5fcbc9f92f7ce62397b168b52ac0c4e63814a1bcf6c4c2f1664d',
    visibleTextEvidenceRef:
      'c1c5fcf64562131948c5d41402f6a78663ff4af8115c4b72c92b2c70e5ccc7a6',
  },
  captionBindingTargetVersion: CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
  mediationMode: 'hq_mediated_owner_read',
  exactRequestResultScopeBindingRequired: true,
  exactCaptionScopeFrameTimingRereadRequired: true,
  opaqueReferencesOnly: true,
  runtimeBindingDeclared: false,
  ownerResultPersistenceDeclared: false,
  authenticatedOwnerResultIntegrated: false,
  captionMayConstructOwnerResult: false,
  captionMaySelectSource: false,
  captionMayMutateCropOrTiming: false,
  directPeerDispatchAdded: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT =
parseCaptionBrollOwnerReadAdapterReceipt({
  ...adapterReceiptWithoutDigest,
  adapterDigestSha256: calculateSkillContractDigest(
    { ...adapterReceiptWithoutDigest, adapterDigestSha256: '' },
    'adapterDigestSha256'),
})
