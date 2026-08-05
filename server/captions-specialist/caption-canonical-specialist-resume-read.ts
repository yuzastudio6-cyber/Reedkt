import { z } from 'zod'

import {
  CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION,
  CANONICAL_SPECIALIST_CALL_RESULT_PAIR_VERSION,
  CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION,
  type CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  type CanonicalSpecialistSupportResumeRecord,
} from '../../src/types/canonical-specialist-support-resume'
import {
  CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_VERSION,
  CAPTION_CANONICAL_SPECIALIST_RESUME_SEQUENCE_VERSION,
  type CaptionCanonicalSpecialistResumeReadAdapterReceipt,
  type CaptionCanonicalSpecialistResumeSequence,
  type CaptionCanonicalSpecialistResumeSequenceInput,
} from '../../src/types/caption-canonical-specialist-resume-read'
import type {
  OrchestraSkillCall,
  OrchestraSkillJobResult,
  SkillArtifactRef,
  SkillCanonicalScope,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().min(1).max(180)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const gitSha = z.string().regex(/^[a-f0-9]{40}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
const scopeSchema: z.ZodType<SkillCanonicalScope> = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey.nullable(),
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).max(256),
}).strict()
const artifactRefSchema: z.ZodType<SkillArtifactRef> = refSchema.extend({
  artifactType: safeKey,
  producerSkillKey: safeKey,
  privateArtifact: z.literal(true),
  byteFreeRef: z.literal(true),
  sourceSupportRequestRef: refSchema.nullable(),
}).strict()
const ownerKeySchema = z.enum([
  'visual_intelligence', 'track_all', 'living_frame', 'soundsync',
  'transitions', 'broll_owner', 'canonical_timing_owner',
  'canonical_layout_owner',
])

const projectionSchema:
z.ZodType<CanonicalAuthenticatedSpecialistSupportArtifactProjection> =
z.object({
  schemaVersion: z.literal(
    CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION),
  projectionId: safeKey,
  projectionDigestSha256: sha256,
  originalCallRef: refSchema,
  supportRequestRef: refSchema,
  ownerResultRef: refSchema,
  ownerKey: ownerKeySchema,
  canonicalScope: scopeSchema,
  artifactRefs: z.array(artifactRefSchema).min(1).max(64),
  authenticatedPrincipalVerified: z.literal(true),
  exactApprovedSnapshotReread: z.literal(true),
  exactCanonicalScopeReread: z.literal(true),
  exactOwnerResultReread: z.literal(true),
  ownerResultPersistedBeforeProjection: z.literal(true),
  browserLocalStateUsed: z.literal(false),
  rawChatMediaBytesPathsUrlsOrCredentialsAccepted: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  runtimeExecutionAuthorityGrantedToSpecialist: z.literal(false),
  assetMutationAuthorityGrantedToSpecialist: z.literal(false),
  costOrBillingAuthorityGrantedToSpecialist: z.literal(false),
  finalQaApprovalGrantedToSpecialist: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const recordSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION),
  recordId: safeKey,
  recordDigestSha256: sha256,
  stepOrdinal: z.number().int().min(1).max(32),
  priorCall: z.unknown(),
  priorResult: z.unknown(),
  selectedSupportRequest: z.unknown(),
  authenticatedOwnerProjection: z.unknown(),
  resumedCall: z.unknown(),
  resumedResult: z.unknown(),
  promotedPriorSupportArtifactRefs: z.array(artifactRefSchema).max(512),
  persistedAt: z.string().datetime({ offset: true }),
  priorCallAndResultExactReread: z.literal(true),
  selectedRequestExactResultMember: z.literal(true),
  authenticatedOwnerProjectionExactReread: z.literal(true),
  onlyCurrentOwnerResultInjected: z.literal(true),
  priorOwnerResultsPromotedAsCanonicalInputs: z.literal(true),
  exactImmediateCallAndRequestLineage: z.literal(true),
  directPeerDispatchPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  providerCallPerformedByResumeOwner: z.literal(false),
  runtimeExecutionPerformedByResumeOwner: z.literal(false),
  assetMutationPerformedByResumeOwner: z.literal(false),
  costOrBillingMutationPerformedByResumeOwner: z.literal(false),
  finalQaApprovalGrantedByResumeOwner: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const sequenceSchema: z.ZodType<CaptionCanonicalSpecialistResumeSequence> =
z.object({
  schemaVersion: z.literal(CAPTION_CANONICAL_SPECIALIST_RESUME_SEQUENCE_VERSION),
  sequenceId: safeKey,
  sequenceDigestSha256: sha256,
  initialCallRef: refSchema,
  initialResultRef: refSchema,
  resumeRecordRefs: z.array(refSchema).min(1).max(32),
  finalCallRef: refSchema,
  finalResultRef: refSchema,
  ownerOrder: z.array(ownerKeySchema).min(1).max(32),
  stepCount: z.number().int().min(1).max(32),
  exactCreateOnlyPersistenceRereadVerified: z.literal(true),
  exactSequentialLineageVerified: z.literal(true),
  onlyCurrentOwnerResultInjectedPerStep: z.literal(true),
  priorOwnerResultsPromotedAsCanonicalInputs: z.literal(true),
  finalDisposition: z.enum([
    'completed', 'needs_followup', 'blocked', 'unsupported', 'failed',
  ]),
  directPeerDispatchPerformed: z.literal(false),
  providerCallPerformedByCaption: z.literal(false),
  runtimeExecutionPerformedByCaption: z.literal(false),
  assetMutationPerformedByCaption: z.literal(false),
  costOrBillingMutationPerformedByCaption: z.literal(false),
  finalQaApprovalGrantedByCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const receiptSchema:
z.ZodType<CaptionCanonicalSpecialistResumeReadAdapterReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_VERSION),
  adapterId: safeKey,
  adapterDigestSha256: sha256,
  backendSource: z.object({
    repository: z.literal('yuzastudio6-cyber/Reedkt'),
    branch: z.literal('codex/backend-workflow-pipeline-continuation'),
    sourceCommit: gitSha,
    sourceTree: gitSha,
    publicTypeFileSha256: sha256,
    orchestraPublicTypeFileSha256: sha256,
    orchestraParserFileSha256: sha256,
    skillManifestPublicTypeFileSha256: sha256,
    closedValidatorFileSha256: sha256,
  }).strict(),
  canonicalProjectionVersion: z.literal(
    CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION),
  canonicalResumeRecordVersion: z.literal(
    CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION),
  canonicalCallResultPairVersion: z.literal(
    CANONICAL_SPECIALIST_CALL_RESULT_PAIR_VERSION),
  captionSequenceVersion: z.literal(
    CAPTION_CANONICAL_SPECIALIST_RESUME_SEQUENCE_VERSION),
  captionParserEntrypointId: z.literal(
    'parseCaptionCanonicalSpecialistSupportResumeRecord'),
  captionSequenceEntrypointId: z.literal(
    'createCaptionCanonicalSpecialistResumeSequence'),
  sourcePublicTypeCopiedByteForByte: z.literal(true),
  backendImplementationImported: z.literal(false),
  canonicalPersistenceReaderMounted: z.literal(false),
  authenticatedOwnerAdaptersMounted: z.literal(false),
  actualCanonicalResumeRecordConsumed: z.literal(false),
  directPeerDispatchAdded: z.literal(false),
  providerCallAuthorityGranted: z.literal(false),
  runtimeExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  costOrBillingAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
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

function exactRef(left: SkillContractRef, right: SkillContractRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return calculateSkillContractDigest(
    { value: left, digest: '' }, 'digest')
    === calculateSkillContractDigest(
      { value: right, digest: '' }, 'digest')
}

function callRef(call: OrchestraSkillCall): SkillContractRef {
  return { id: call.callId, version: call.schemaVersion,
    contentHash: call.callDigestSha256 }
}

function resultRef(result: OrchestraSkillJobResult): SkillContractRef {
  return { id: result.resultId, version: result.schemaVersion,
    contentHash: result.resultDigestSha256 }
}

function requestRef(request: SkillSupportRequest): SkillContractRef {
  return { id: request.requestId, version: request.schemaVersion,
    contentHash: request.requestDigestSha256 }
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

function assertCallResultPair(
  call: OrchestraSkillCall,
  result: OrchestraSkillJobResult,
): void {
  const currentCallRef = callRef(call)
  if (!exactRef(result.originalCallRef, currentCallRef)
    || result.producerSkillKey !== call.assigneeSkillKey
    || result.jobType !== call.job.jobType
    || !exactRef(result.manifestRef, call.manifestRef)
    || !exactRef(result.qualificationSnapshotRef,
      call.qualificationSnapshotRef)
    || !sameCanonical(result.canonicalScope, call.canonicalScope)
    || result.replayBinding.idempotencyKey !== call.idempotencyKey
    || !sameCanonical(result.replayBinding.resumedFromSupportRequestRef,
      call.resumeOfSupportRequestRef)
    || !sameCanonical(result.replayBinding.resumeOriginCallRef,
      call.resumeOriginCallRef)
    || result.supportRequests.some((request) =>
      request.requestingSkillKey !== call.assigneeSkillKey
      || !exactRef(request.originalCallRef, currentCallRef)
      || !sameCanonical(request.canonicalScope, call.canonicalScope))) {
    throw new Error('Caption canonical specialist call/result lineage failed.')
  }
}

export function parseCaptionCanonicalAuthenticatedSpecialistProjection(
  value: unknown,
): CanonicalAuthenticatedSpecialistSupportArtifactProjection {
  assertClosedContractTree(
    value, 'Caption canonical authenticated specialist projection')
  assertNoUnsafeText(
    value, 'Caption canonical authenticated specialist projection')
  const projection = projectionSchema.parse(value)
  verifyDigest(projection as unknown as Record<string, unknown>,
    'projectionDigestSha256',
    'Caption canonical authenticated specialist projection')
  const artifactTypes = projection.artifactRefs.map((artifact) =>
    artifact.artifactType)
  if (new Set(artifactTypes).size !== artifactTypes.length
    || projection.artifactRefs.some((artifact) =>
      artifact.producerSkillKey !== projection.ownerKey
      || artifact.sourceSupportRequestRef === null
      || !exactRef(artifact.sourceSupportRequestRef,
        projection.supportRequestRef))) {
    throw new Error('Canonical owner projection lost exact artifact lineage.')
  }
  return structuredClone(projection)
}

export function parseCaptionCanonicalSpecialistSupportResumeRecord(
  value: unknown,
): CanonicalSpecialistSupportResumeRecord {
  assertClosedContractTree(value, 'Caption canonical specialist resume record')
  assertNoUnsafeText(value, 'Caption canonical specialist resume record')
  const raw = recordSchema.parse(value)
  const priorCall = parseOrchestraSkillCall(raw.priorCall)
  const priorResult = parseOrchestraSkillJobResult(raw.priorResult)
  const selectedSupportRequest = parseSkillSupportRequest(
    raw.selectedSupportRequest)
  const authenticatedOwnerProjection =
    parseCaptionCanonicalAuthenticatedSpecialistProjection(
      raw.authenticatedOwnerProjection)
  const resumedCall = parseOrchestraSkillCall(raw.resumedCall)
  const resumedResult = parseOrchestraSkillJobResult(raw.resumedResult)
  const record: CanonicalSpecialistSupportResumeRecord = {
    ...raw,
    priorCall,
    priorResult,
    selectedSupportRequest,
    authenticatedOwnerProjection,
    resumedCall,
    resumedResult,
  }
  verifyDigest(record as unknown as Record<string, unknown>,
    'recordDigestSha256', 'Caption canonical specialist resume record')
  assertCallResultPair(priorCall, priorResult)
  assertCallResultPair(resumedCall, resumedResult)
  const projection = authenticatedOwnerProjection
  const requestedTypes = selectedSupportRequest.requestedArtifactTypes
  const expectedPromotedPriorSupportArtifacts =
    priorCall.injectedSupportArtifactRefs.map((artifact) => ({
      ...structuredClone(artifact),
      sourceSupportRequestRef: null,
    }))
  const expectedResumedCanonicalInputs = [
    ...priorCall.inputArtifactRefs,
    ...expectedPromotedPriorSupportArtifacts,
  ]
  if (!sameCanonical(priorResult.supportRequests[0], selectedSupportRequest)
    || !exactRef(projection.originalCallRef,
      selectedSupportRequest.originalCallRef)
    || !exactRef(projection.supportRequestRef,
      requestRef(selectedSupportRequest))
    || projection.ownerKey !== selectedSupportRequest.targetSkillKey
    || !sameCanonical(projection.canonicalScope,
      selectedSupportRequest.canonicalScope)
    || projection.artifactRefs.length !== requestedTypes.length
    || projection.artifactRefs.some((artifact) =>
      !requestedTypes.includes(artifact.artifactType))
    || resumedCall.resumeOfSupportRequestRef === null
    || !exactRef(resumedCall.resumeOfSupportRequestRef,
      requestRef(selectedSupportRequest))
    || resumedCall.resumeOriginCallRef === null
    || !exactRef(resumedCall.resumeOriginCallRef, callRef(priorCall))
    || !sameCanonical(resumedCall.injectedSupportArtifactRefs,
      projection.artifactRefs)
    || !sameCanonical(record.promotedPriorSupportArtifactRefs,
      expectedPromotedPriorSupportArtifacts)
    || !sameCanonical(resumedCall.inputArtifactRefs,
      expectedResumedCanonicalInputs)) {
    throw new Error('Caption canonical specialist resume lineage is invalid.')
  }
  return structuredClone(record)
}

export function parseCaptionCanonicalSpecialistResumeSequence(
  value: unknown,
): CaptionCanonicalSpecialistResumeSequence {
  assertClosedContractTree(value, 'Caption canonical specialist resume sequence')
  assertNoUnsafeText(value, 'Caption canonical specialist resume sequence')
  const sequence = sequenceSchema.parse(value)
  verifyDigest(sequence as unknown as Record<string, unknown>,
    'sequenceDigestSha256', 'Caption canonical specialist resume sequence')
  if (sequence.stepCount !== sequence.resumeRecordRefs.length
    || sequence.stepCount !== sequence.ownerOrder.length
    || sequence.finalDisposition === 'needs_followup') {
    throw new Error('Caption canonical specialist resume sequence is incomplete.')
  }
  return structuredClone(sequence)
}

export function createCaptionCanonicalSpecialistResumeSequence(
  input: CaptionCanonicalSpecialistResumeSequenceInput,
): CaptionCanonicalSpecialistResumeSequence {
  assertClosedContractTree(input, 'Caption specialist resume sequence input')
  const initialCall = parseOrchestraSkillCall(input.initialCall)
  const initialResult = parseOrchestraSkillJobResult(input.initialResult)
  assertCallResultPair(initialCall, initialResult)
  const records = input.records.map((record) =>
    parseCaptionCanonicalSpecialistSupportResumeRecord(record))
  if (records.length === 0 || records.length > 32) {
    throw new Error('Caption specialist resume sequence requires 1-32 records.')
  }
  let expectedCall = initialCall
  let expectedResult = initialResult
  for (const [index, record] of records.entries()) {
    if (record.stepOrdinal !== index + 1
      || !sameCanonical(record.priorCall, expectedCall)
      || !sameCanonical(record.priorResult, expectedResult)) {
      throw new Error('Caption specialist resume sequence crossed its chain.')
    }
    expectedCall = record.resumedCall
    expectedResult = record.resumedResult
  }
  const finalRecord = records.at(-1)!
  const withoutDigest: Omit<CaptionCanonicalSpecialistResumeSequence,
    'sequenceDigestSha256'> = {
    schemaVersion: CAPTION_CANONICAL_SPECIALIST_RESUME_SEQUENCE_VERSION,
    sequenceId: safeKey.parse(input.sequenceId),
    initialCallRef: callRef(initialCall),
    initialResultRef: resultRef(initialResult),
    resumeRecordRefs: records.map((record) => ({
      id: record.recordId,
      version: record.schemaVersion,
      contentHash: record.recordDigestSha256,
    })),
    finalCallRef: callRef(finalRecord.resumedCall),
    finalResultRef: resultRef(finalRecord.resumedResult),
    ownerOrder: records.map((record) =>
      record.authenticatedOwnerProjection.ownerKey),
    stepCount: records.length,
    exactCreateOnlyPersistenceRereadVerified: true,
    exactSequentialLineageVerified: true,
    onlyCurrentOwnerResultInjectedPerStep: true,
    priorOwnerResultsPromotedAsCanonicalInputs: true,
    finalDisposition: finalRecord.resumedResult.disposition,
    directPeerDispatchPerformed: false,
    providerCallPerformedByCaption: false,
    runtimeExecutionPerformedByCaption: false,
    assetMutationPerformedByCaption: false,
    costOrBillingMutationPerformedByCaption: false,
    finalQaApprovalGrantedByCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionCanonicalSpecialistResumeSequence({
    ...withoutDigest,
    sequenceDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      sequenceDigestSha256: '',
    }, 'sequenceDigestSha256'),
  })
}

export function parseCaptionCanonicalSpecialistResumeReadAdapterReceipt(
  value: unknown,
): CaptionCanonicalSpecialistResumeReadAdapterReceipt {
  assertClosedContractTree(
    value, 'Caption canonical specialist resume-read adapter receipt')
  assertNoUnsafeText(
    value, 'Caption canonical specialist resume-read adapter receipt')
  const receipt = receiptSchema.parse(value)
  verifyDigest(receipt as unknown as Record<string, unknown>,
    'adapterDigestSha256',
    'Caption canonical specialist resume-read adapter receipt')
  return structuredClone(receipt)
}

const adapterReceiptWithoutDigest: Omit<
  CaptionCanonicalSpecialistResumeReadAdapterReceipt,
  'adapterDigestSha256'
> = {
  schemaVersion: CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_VERSION,
  adapterId: 'captions.canonical-specialist.resume-read.adapter',
  backendSource: {
    repository: 'yuzastudio6-cyber/Reedkt',
    branch: 'codex/backend-workflow-pipeline-continuation',
    sourceCommit: '832f56fc41c90413f6c99cc70d5cd658c8e44675',
    sourceTree: '14dd5359078c3abbf9a0e524fd6b1d037574d238',
    publicTypeFileSha256:
      'd2b6128e26bf0a12d66d017f3f6608fc4656fddfa818dbb9a7bfdec8a44137e5',
    orchestraPublicTypeFileSha256:
      'e67707d1ba3a54aabf14fd455ce9b7321926abff0ce0c0d6724c4a193baea576',
    orchestraParserFileSha256:
      '998edd7aa9fd6fd6736ea022d83e123991a3cafcfe0fa04b5d62bc3a8cd206bd',
    skillManifestPublicTypeFileSha256:
      'bd7da7d428c355dc1b133b5c67ff222cc828d8c880adb60dab9824a67e9d33db',
    closedValidatorFileSha256:
      '773ab2ac717012fbdce7bd35a687c0d86cb9eb7807d7669627f269febd0b0c6f',
  },
  canonicalProjectionVersion:
    CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION,
  canonicalResumeRecordVersion:
    CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION,
  canonicalCallResultPairVersion: CANONICAL_SPECIALIST_CALL_RESULT_PAIR_VERSION,
  captionSequenceVersion: CAPTION_CANONICAL_SPECIALIST_RESUME_SEQUENCE_VERSION,
  captionParserEntrypointId:
    'parseCaptionCanonicalSpecialistSupportResumeRecord',
  captionSequenceEntrypointId:
    'createCaptionCanonicalSpecialistResumeSequence',
  sourcePublicTypeCopiedByteForByte: true,
  backendImplementationImported: false,
  canonicalPersistenceReaderMounted: false,
  authenticatedOwnerAdaptersMounted: false,
  actualCanonicalResumeRecordConsumed: false,
  directPeerDispatchAdded: false,
  providerCallAuthorityGranted: false,
  runtimeExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  costOrBillingAuthorityGranted: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}

export const CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_RECEIPT =
parseCaptionCanonicalSpecialistResumeReadAdapterReceipt({
  ...adapterReceiptWithoutDigest,
  adapterDigestSha256: calculateSkillContractDigest({
    ...adapterReceiptWithoutDigest,
    adapterDigestSha256: '',
  }, 'adapterDigestSha256'),
})
