import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  CanonicalSpecialistCallResultPair,
  CanonicalSpecialistSupportResumeRecord,
} from '../../src/types/canonical-specialist-support-resume'
import {
  CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION,
  CANONICAL_SPECIALIST_CALL_RESULT_PAIR_VERSION,
  CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION,
} from '../../src/types/canonical-specialist-support-resume'
import type {
  OrchestraSkillCall,
  SkillArtifactRef,
  SkillCanonicalScope,
  SkillContractRef,
  SkillSupportRequest,
  SkillSupportTarget,
} from '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  orchestraSkillCallSchema,
  orchestraSkillJobResultSchema,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
  skillSupportRequestSchema,
} from '../orchestra/orchestra-skill-contracts'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'

export const CANONICAL_SPECIALIST_SUPPORT_RESUME_REPOSITORY_VERSION =
  'canonical-specialist-support-resume-repository-v1' as const
export const CANONICAL_SPECIALIST_SUPPORT_RESUME_OWNER_VERSION =
  'canonical-specialist-support-resume-owner-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/specialist-support-resume'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..')
    && !value.includes('//')
    && !value.endsWith('/'))
const safeKey = z.string().min(1).max(180)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema: z.ZodType<SkillContractRef> = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().min(0),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical frame range must be non-empty.',
    })
  }
})
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
}).strict().superRefine((scope, context) => {
  let lastEnd = -1
  for (const range of scope.authorizedFrameRanges) {
    if (range.startFrame < lastEnd) {
      context.addIssue({
        code: 'custom',
        message: 'Canonical frame ranges must be ordered and non-overlapping.',
      })
      return
    }
    lastEnd = range.endFrameExclusive
  }
})
const supportTargetSchema: z.ZodType<SkillSupportTarget> = z.enum([
  'visual_intelligence',
  'track_all',
  'living_frame',
  'soundsync',
  'transitions',
  'broll_owner',
  'canonical_timing_owner',
  'canonical_layout_owner',
])
const artifactRefSchema: z.ZodType<SkillArtifactRef> = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
  artifactType: safeKey,
  producerSkillKey: safeKey,
  privateArtifact: z.literal(true),
  byteFreeRef: z.literal(true),
  sourceSupportRequestRef: refSchema.nullable(),
}).strict()

const projectionWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION,
  ),
  projectionId: safeKey,
  originalCallRef: refSchema,
  supportRequestRef: refSchema,
  ownerResultRef: refSchema,
  ownerKey: supportTargetSchema,
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
const projectionSchema = projectionWithoutDigestSchema.extend({
  projectionDigestSha256: rawSha256,
}).strict()

const pairWithoutDigestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SPECIALIST_CALL_RESULT_PAIR_VERSION),
  pairId: safeKey,
  call: orchestraSkillCallSchema,
  result: orchestraSkillJobResultSchema,
  persistedAt: timestamp,
  exactCallResultScopeManifestQualificationAndReplayBinding: z.literal(true),
  directPeerDispatchPerformed: z.literal(false),
  providerCallPerformedByRepository: z.literal(false),
  runtimeExecutionPerformedByRepository: z.literal(false),
  assetMutationPerformedByRepository: z.literal(false),
  costOrBillingMutationPerformedByRepository: z.literal(false),
  finalQaApprovalGrantedByRepository: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const pairSchema = pairWithoutDigestSchema.extend({
  pairDigestSha256: rawSha256,
}).strict()

const recordWithoutDigestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION),
  recordId: safeKey,
  stepOrdinal: z.number().int().min(1).max(32),
  priorCall: orchestraSkillCallSchema,
  priorResult: orchestraSkillJobResultSchema,
  selectedSupportRequest: skillSupportRequestSchema,
  authenticatedOwnerProjection: projectionSchema,
  resumedCall: orchestraSkillCallSchema,
  resumedResult: orchestraSkillJobResultSchema,
  promotedPriorSupportArtifactRefs: z.array(artifactRefSchema).max(512),
  persistedAt: timestamp,
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
const recordSchema = recordWithoutDigestSchema.extend({
  recordDigestSha256: rawSha256,
}).strict()

export interface CanonicalSpecialistSupportResumeRepository {
  readonly schemaVersion:
    typeof CANONICAL_SPECIALIST_SUPPORT_RESUME_REPOSITORY_VERSION
  persistCallResultPairCreateOnly(input: {
    readonly pair: CanonicalSpecialistCallResultPair
  }): Promise<'created' | 'identical_replay'>
  rereadCallResultPair(input: {
    readonly callRef: SkillContractRef
  }): Promise<CanonicalSpecialistCallResultPair | null>
  persistAuthenticatedOwnerProjectionCreateOnly(input: {
    readonly projection:
      CanonicalAuthenticatedSpecialistSupportArtifactProjection
  }): Promise<'created' | 'identical_replay'>
  rereadAuthenticatedOwnerProjection(input: {
    readonly supportRequestRef: SkillContractRef
  }): Promise<CanonicalAuthenticatedSpecialistSupportArtifactProjection | null>
  persistResumeRecordCreateOnly(input: {
    readonly record: CanonicalSpecialistSupportResumeRecord
  }): Promise<'created' | 'identical_replay'>
  rereadResumeRecordByResumedCall(input: {
    readonly resumedCallRef: SkillContractRef
  }): Promise<CanonicalSpecialistSupportResumeRecord | null>
}

export interface CanonicalSpecialistExecutionPort {
  execute(input: {
    readonly call: OrchestraSkillCall
    readonly resumeSupportRequest: SkillSupportRequest
  }): Promise<unknown>
}

export function createCanonicalAuthenticatedSpecialistSupportArtifactProjection(
  input: Omit<
    CanonicalAuthenticatedSpecialistSupportArtifactProjection,
    'projectionDigestSha256'
  >,
): CanonicalAuthenticatedSpecialistSupportArtifactProjection {
  assertClosedContractTree(input, 'Authenticated specialist support projection')
  const payload = projectionWithoutDigestSchema.parse(input)
  assertProjectionInternalConsistency(payload)
  return freeze(projectionSchema.parse({
    ...payload,
    projectionDigestSha256: contractDigest(
      payload,
      'projectionDigestSha256',
    ),
  }))
}

export function parseCanonicalAuthenticatedSpecialistSupportArtifactProjection(
  value: unknown,
): CanonicalAuthenticatedSpecialistSupportArtifactProjection {
  assertClosedContractTree(value, 'Authenticated specialist support projection')
  rejectUnsafeText(value, 'Authenticated specialist support projection')
  const parsed = projectionSchema.parse(value)
  if (parsed.projectionDigestSha256 !== contractDigest(
    parsed,
    'projectionDigestSha256',
  )) throw new Error('Authenticated specialist support projection digest failed.')
  assertProjectionInternalConsistency(parsed)
  return freeze(parsed)
}

export function createCanonicalSpecialistCallResultPair(input: {
  readonly call: unknown
  readonly result: unknown
  readonly persistedAt: string
}): CanonicalSpecialistCallResultPair {
  assertClosedContractTree(input, 'Specialist call/result pair input')
  const call = parseOrchestraSkillCall(input.call)
  const result = parseOrchestraSkillJobResult(input.result)
  assertCallResultPair(call, result)
  const callReference = callRef(call)
  const payload = pairWithoutDigestSchema.parse({
    schemaVersion: CANONICAL_SPECIALIST_CALL_RESULT_PAIR_VERSION,
    pairId: `specialist.call-result.${callReference.contentHash.slice(0, 32)}`,
    call,
    result,
    persistedAt: timestamp.parse(input.persistedAt),
    exactCallResultScopeManifestQualificationAndReplayBinding: true,
    directPeerDispatchPerformed: false,
    providerCallPerformedByRepository: false,
    runtimeExecutionPerformedByRepository: false,
    assetMutationPerformedByRepository: false,
    costOrBillingMutationPerformedByRepository: false,
    finalQaApprovalGrantedByRepository: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  return freeze(pairSchema.parse({
    ...payload,
    pairDigestSha256: contractDigest(payload, 'pairDigestSha256'),
  }))
}

export function parseCanonicalSpecialistCallResultPair(
  value: unknown,
): CanonicalSpecialistCallResultPair {
  assertClosedContractTree(value, 'Specialist call/result pair')
  rejectUnsafeText(value, 'Specialist call/result pair')
  const parsed = pairSchema.parse(value)
  if (parsed.pairDigestSha256 !== contractDigest(
    parsed,
    'pairDigestSha256',
  )) throw new Error('Specialist call/result pair digest failed.')
  assertCallResultPair(parsed.call, parsed.result)
  return freeze(parsed)
}

export function parseCanonicalSpecialistSupportResumeRecord(
  value: unknown,
): CanonicalSpecialistSupportResumeRecord {
  assertClosedContractTree(value, 'Specialist support resume record')
  rejectUnsafeText(value, 'Specialist support resume record')
  const parsed = recordSchema.parse(value)
  if (parsed.recordDigestSha256 !== contractDigest(
    parsed,
    'recordDigestSha256',
  )) throw new Error('Specialist support resume record digest failed.')
  assertResumeRecord(parsed)
  return freeze(parsed)
}

export function createCanonicalSpecialistSupportResumeRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSpecialistSupportResumeRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion: CANONICAL_SPECIALIST_SUPPORT_RESUME_REPOSITORY_VERSION,
    async persistCallResultPairCreateOnly(untrusted: unknown) {
      const pair = parseCanonicalSpecialistCallResultPair(
        closedUnknownRequest(untrusted, 'pair'),
      )
      return persistExact(input.objectPort, pairPath(prefix, callRef(pair.call)),
        pair, parseCanonicalSpecialistCallResultPair)
    },
    async rereadCallResultPair(untrusted: unknown) {
      const request = closedRefRequest(untrusted, 'callRef')
      return readExact(input.objectPort, pairPath(prefix, request),
        parseCanonicalSpecialistCallResultPair)
    },
    async persistAuthenticatedOwnerProjectionCreateOnly(untrusted: unknown) {
      const projection =
        parseCanonicalAuthenticatedSpecialistSupportArtifactProjection(
          closedUnknownRequest(untrusted, 'projection'),
        )
      return persistExact(
        input.objectPort,
        projectionPath(prefix, projection.supportRequestRef),
        projection,
        parseCanonicalAuthenticatedSpecialistSupportArtifactProjection,
      )
    },
    async rereadAuthenticatedOwnerProjection(untrusted: unknown) {
      const request = closedRefRequest(untrusted, 'supportRequestRef')
      return readExact(input.objectPort, projectionPath(prefix, request),
        parseCanonicalAuthenticatedSpecialistSupportArtifactProjection)
    },
    async persistResumeRecordCreateOnly(untrusted: unknown) {
      const record = parseCanonicalSpecialistSupportResumeRecord(
        closedUnknownRequest(untrusted, 'record'),
      )
      return persistExact(
        input.objectPort,
        resumePath(prefix, callRef(record.resumedCall)),
        record,
        parseCanonicalSpecialistSupportResumeRecord,
      )
    },
    async rereadResumeRecordByResumedCall(untrusted: unknown) {
      const request = closedRefRequest(untrusted, 'resumedCallRef')
      return readExact(input.objectPort, resumePath(prefix, request),
        parseCanonicalSpecialistSupportResumeRecord)
    },
  })
}

export async function resumeCanonicalSpecialistWithAuthenticatedSupport(input: {
  readonly priorCallRef: SkillContractRef
  readonly selectedSupportRequestRef: SkillContractRef
  readonly repository: CanonicalSpecialistSupportResumeRepository
  readonly specialistExecutionPort: CanonicalSpecialistExecutionPort
  readonly now?: () => Date
}): Promise<CanonicalSpecialistSupportResumeRecord> {
  assertPorts(input)
  const priorCallRef = refSchema.parse(input.priorCallRef)
  const selectedSupportRequestRef = refSchema.parse(
    input.selectedSupportRequestRef,
  )
  const pair = await input.repository.rereadCallResultPair({
    callRef: priorCallRef,
  })
  if (!pair || !sameRef(callRef(pair.call), priorCallRef)) {
    throw new Error('Prior specialist call/result is unavailable.')
  }
  const selectedSupportRequest = pair.result.supportRequests[0]
  if (!selectedSupportRequest
    || !sameRef(requestRef(selectedSupportRequest),
      selectedSupportRequestRef)) {
    throw new Error(
      'Selected support request is not the next deterministic result member.',
    )
  }
  const projection =
    await input.repository.rereadAuthenticatedOwnerProjection({
      supportRequestRef: selectedSupportRequestRef,
    })
  if (!projection) {
    throw new Error('Authenticated owner result projection is unavailable.')
  }
  assertProjectionAgainstRequest(projection, selectedSupportRequest)
  const previousRecord = await input.repository
    .rereadResumeRecordByResumedCall({ resumedCallRef: priorCallRef })
  const stepOrdinal = previousRecord
    ? previousRecord.stepOrdinal + 1
    : 1
  if ((pair.call.resumeOriginCallRef !== null) !== (previousRecord !== null)
    || stepOrdinal > 32) {
    throw new Error('Specialist sequential resume lineage is incomplete.')
  }
  const promotedPriorSupportArtifactRefs = pair.call
    .injectedSupportArtifactRefs.map((artifact) => ({
      ...structuredClone(artifact),
      sourceSupportRequestRef: null,
    }))
  const resumedCall = createResumedCall({
    priorCall: pair.call,
    selectedSupportRequest,
    projection,
    promotedPriorSupportArtifactRefs,
    stepOrdinal,
  })
  const resumedResult = parseOrchestraSkillJobResult(
    await input.specialistExecutionPort.execute({
      call: structuredClone(resumedCall),
      resumeSupportRequest: structuredClone(selectedSupportRequest),
    }),
  )
  assertCallResultPair(resumedCall, resumedResult)
  const persistedAt = timestamp.parse(
    (input.now ?? (() => new Date()))().toISOString(),
  )
  const resumedPair = createCanonicalSpecialistCallResultPair({
    call: resumedCall,
    result: resumedResult,
    persistedAt,
  })
  await input.repository.persistCallResultPairCreateOnly({ pair: resumedPair })
  const payload = recordWithoutDigestSchema.parse({
    schemaVersion: CANONICAL_SPECIALIST_SUPPORT_RESUME_RECORD_VERSION,
    recordId: `specialist.resume.${resumedCall.callDigestSha256.slice(0, 32)}`,
    stepOrdinal,
    priorCall: pair.call,
    priorResult: pair.result,
    selectedSupportRequest,
    authenticatedOwnerProjection: projection,
    resumedCall,
    resumedResult,
    promotedPriorSupportArtifactRefs,
    persistedAt,
    priorCallAndResultExactReread: true,
    selectedRequestExactResultMember: true,
    authenticatedOwnerProjectionExactReread: true,
    onlyCurrentOwnerResultInjected: true,
    priorOwnerResultsPromotedAsCanonicalInputs: true,
    exactImmediateCallAndRequestLineage: true,
    directPeerDispatchPerformed: false,
    timelineMutationPerformed: false,
    providerCallPerformedByResumeOwner: false,
    runtimeExecutionPerformedByResumeOwner: false,
    assetMutationPerformedByResumeOwner: false,
    costOrBillingMutationPerformedByResumeOwner: false,
    finalQaApprovalGrantedByResumeOwner: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  const record = parseCanonicalSpecialistSupportResumeRecord({
    ...payload,
    recordDigestSha256: contractDigest(payload, 'recordDigestSha256'),
  })
  await input.repository.persistResumeRecordCreateOnly({ record })
  const reread = await input.repository.rereadResumeRecordByResumedCall({
    resumedCallRef: callRef(resumedCall),
  })
  if (!reread || reread.recordDigestSha256 !== record.recordDigestSha256) {
    throw new Error('Specialist support resume record reread failed.')
  }
  return reread
}

function createResumedCall(input: {
  priorCall: OrchestraSkillCall
  selectedSupportRequest: SkillSupportRequest
  projection: CanonicalAuthenticatedSpecialistSupportArtifactProjection
  promotedPriorSupportArtifactRefs: SkillArtifactRef[]
  stepOrdinal: number
}): OrchestraSkillCall {
  const identity = contractDigest({
    priorCallRef: callRef(input.priorCall),
    supportRequestRef: requestRef(input.selectedSupportRequest),
    projectionDigestSha256: input.projection.projectionDigestSha256,
    stepOrdinal: input.stepOrdinal,
  }, 'unusedDigestField')
  const withoutDigest: Omit<OrchestraSkillCall, 'callDigestSha256'> = {
    ...structuredClone(input.priorCall),
    callId: `specialist.resume.${identity.slice(0, 32)}`,
    idempotencyKey: input.priorCall.idempotencyKey,
    job: {
      ...structuredClone(input.priorCall.job),
      jobId: `specialist.resume.job.${identity.slice(0, 32)}`,
    },
    inputArtifactRefs: uniqueArtifacts([
      ...structuredClone(input.priorCall.inputArtifactRefs),
      ...input.promotedPriorSupportArtifactRefs,
    ]),
    injectedSupportArtifactRefs: structuredClone(
      input.projection.artifactRefs,
    ),
    resumeOfSupportRequestRef: requestRef(input.selectedSupportRequest),
    resumeOriginCallRef: input.selectedSupportRequest.originalCallRef,
  }
  return parseOrchestraSkillCall({
    ...withoutDigest,
    callDigestSha256: contractDigest(withoutDigest, 'callDigestSha256'),
  })
}

function assertProjectionInternalConsistency(
  projection: z.infer<typeof projectionWithoutDigestSchema>
    | CanonicalAuthenticatedSpecialistSupportArtifactProjection,
): void {
  const requestKeys = new Set(projection.artifactRefs.map((artifact) =>
    artifact.artifactType))
  if (requestKeys.size !== projection.artifactRefs.length
    || projection.artifactRefs.some((artifact) =>
      artifact.producerSkillKey !== projection.ownerKey
      || artifact.sourceSupportRequestRef === null
      || !sameRef(artifact.sourceSupportRequestRef,
        projection.supportRequestRef))) {
    throw new Error('Authenticated specialist artifacts lost owner lineage.')
  }
}

function assertProjectionAgainstRequest(
  projection: CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  request: SkillSupportRequest,
): void {
  if (!sameRef(projection.originalCallRef, request.originalCallRef)
    || !sameRef(projection.supportRequestRef, requestRef(request))
    || projection.ownerKey !== request.targetSkillKey
    || !sameCanonical(projection.canonicalScope, request.canonicalScope)
    || projection.artifactRefs.length !== request.requestedArtifactTypes.length
    || projection.artifactRefs.some((artifact) =>
      !request.requestedArtifactTypes.includes(artifact.artifactType))) {
    throw new Error('Authenticated owner projection crossed support scope.')
  }
}

function assertCallResultPair(
  untrustedCall: unknown,
  untrustedResult: unknown,
): void {
  const call = parseOrchestraSkillCall(untrustedCall)
  const result = parseOrchestraSkillJobResult(untrustedResult)
  const callReference = callRef(call)
  if (!sameRef(result.originalCallRef, callReference)
    || result.producerSkillKey !== call.assigneeSkillKey
    || result.jobType !== call.job.jobType
    || !sameRef(result.manifestRef, call.manifestRef)
    || !sameRef(result.qualificationSnapshotRef,
      call.qualificationSnapshotRef)
    || !sameCanonical(result.canonicalScope, call.canonicalScope)
    || result.replayBinding.idempotencyKey !== call.idempotencyKey
    || !nullableRefEqual(result.replayBinding.resumedFromSupportRequestRef,
      call.resumeOfSupportRequestRef)
    || !nullableRefEqual(result.replayBinding.resumeOriginCallRef,
      call.resumeOriginCallRef)
    || result.supportRequests.some((request) =>
      request.requestingSkillKey !== call.assigneeSkillKey
      || !sameRef(request.originalCallRef, callReference)
      || !sameCanonical(request.canonicalScope, call.canonicalScope))) {
    throw new Error('Specialist call/result lineage mismatch.')
  }
}

function assertResumeRecord(
  record: CanonicalSpecialistSupportResumeRecord,
): void {
  assertCallResultPair(record.priorCall, record.priorResult)
  assertCallResultPair(record.resumedCall, record.resumedResult)
  assertProjectionAgainstRequest(
    record.authenticatedOwnerProjection,
    record.selectedSupportRequest,
  )
  const exactMember = record.priorResult.supportRequests.some((request) =>
    sameCanonical(request, record.selectedSupportRequest))
  if (!exactMember
    || !sameRef(record.resumedCall.resumeOfSupportRequestRef as SkillContractRef,
      requestRef(record.selectedSupportRequest))
    || !sameRef(record.resumedCall.resumeOriginCallRef as SkillContractRef,
      callRef(record.priorCall))
    || !sameCanonical(record.resumedCall.injectedSupportArtifactRefs,
      record.authenticatedOwnerProjection.artifactRefs)
    || !sameCanonical(record.promotedPriorSupportArtifactRefs,
      record.priorCall.injectedSupportArtifactRefs.map((artifact) => ({
        ...structuredClone(artifact),
        sourceSupportRequestRef: null,
      })))) {
    throw new Error('Specialist resume record lost exact sequential lineage.')
  }
}

function callRef(call: OrchestraSkillCall): SkillContractRef {
  return refSchema.parse({
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  })
}

function requestRef(request: SkillSupportRequest): SkillContractRef {
  return refSchema.parse({
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  })
}

function sameRef(left: SkillContractRef, right: SkillContractRef): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function nullableRefEqual(
  left: SkillContractRef | null,
  right: SkillContractRef | null,
): boolean {
  return left === null ? right === null : right !== null && sameRef(left, right)
}

function uniqueArtifacts(artifacts: SkillArtifactRef[]): SkillArtifactRef[] {
  const result: SkillArtifactRef[] = []
  const seen = new Set<string>()
  for (const artifact of artifacts) {
    const key = `${artifact.id}\u0000${artifact.version}\u0000${artifact.contentHash}`
    if (seen.has(key)) throw new Error('Specialist prior artifact replayed twice.')
    seen.add(key)
    result.push(structuredClone(artifact))
  }
  return result
}

function contractDigest(value: unknown, digestField: string): string {
  assertClosedContractTree(value, 'Specialist support digest input')
  return calculateSkillContractDigest(
    value as Record<string, unknown>,
    digestField,
  )
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return contractDigest({ value: left }, 'unusedDigestField')
    === contractDigest({ value: right }, 'unusedDigestField')
}

function rejectUnsafeText(value: unknown, label: string): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|\\|\.\.[/\\]|(?:authorization|password|credential|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+|x-goog/iu.test(current)) {
        throw new Error(`${label} contains unsafe serialized text.`)
      }
      continue
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}

function pairPath(prefix: string, callReference: SkillContractRef): string {
  return `${prefix}/pairs/${callReference.contentHash}.json`
}

function projectionPath(prefix: string, request: SkillContractRef): string {
  return `${prefix}/projections/${request.contentHash}.json`
}

function resumePath(prefix: string, resumedCall: SkillContractRef): string {
  return `${prefix}/resumes/${resumedCall.contentHash}.json`
}

function closedRefRequest(
  value: unknown,
  field: 'callRef' | 'supportRequestRef' | 'resumedCallRef',
): SkillContractRef {
  assertClosedContractTree(value, 'Specialist resume repository request')
  return z.object({ [field]: refSchema }).strict()
    .parse(value)[field]
}

function closedUnknownRequest(
  value: unknown,
  field: 'pair' | 'projection' | 'record',
): unknown {
  assertClosedContractTree(value, 'Specialist resume repository write')
  return z.object({ [field]: z.unknown() }).strict().parse(value)[field]
}

async function persistExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: T,
  parser: (value: unknown) => T,
): Promise<'created' | 'identical_replay'> {
  const body = serialize(value)
  const disposition = await port.createOnly({
    objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await readExact(port, objectPath, parser)
  if (!reread || !sameCanonical(reread, value)) {
    throw new Error('Specialist resume create-only reread failed.')
  }
  return disposition === 'created' ? 'created' : 'identical_replay'
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  parser: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Specialist resume record bytes are invalid.')
  }
  try {
    return parser(JSON.parse(body.toString('utf8')) as unknown)
  } catch (error) {
    if (error instanceof Error
      && error.message.includes('Specialist')) throw error
    throw new Error('Specialist resume record JSON is invalid.', {
      cause: error,
    })
  }
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('Specialist resume record size is invalid.')
  }
  return body
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Specialist resume repository is absent.')
  }
}

function assertPorts(input: {
  repository: CanonicalSpecialistSupportResumeRepository
  specialistExecutionPort: CanonicalSpecialistExecutionPort
}): void {
  if (!input.repository
    || typeof input.repository.rereadCallResultPair !== 'function'
    || typeof input.repository.rereadAuthenticatedOwnerProjection !== 'function'
    || typeof input.repository.persistCallResultPairCreateOnly !== 'function'
    || typeof input.repository.persistResumeRecordCreateOnly !== 'function'
    || typeof input.specialistExecutionPort?.execute !== 'function') {
    throw new Error('Specialist support resume owner is incomplete.')
  }
}

function freeze<T>(value: T): T {
  return Object.freeze(structuredClone(value))
}
