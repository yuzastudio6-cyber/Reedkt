import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  BROLL_CAPTION_OWNER_READ_RESULT_ARTIFACT_TYPE,
  BROLL_CAPTION_OWNER_READ_REQUEST_VERSION,
  type BrollCaptionCanonicalScope,
  type BrollCaptionOwnerReadRequest,
  type BrollCaptionOwnerReadResult,
  type CaptionBrollOwnerReadProjectionAuthority,
} from '../../src/types/caption-broll-owner-read-adapter'
import {
  CANONICAL_CAPTION_BROLL_APPROVED_SNAPSHOT_READ_PORT_VERSION,
  CANONICAL_CAPTION_BROLL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  CANONICAL_CAPTION_BROLL_OWNER_READ_PORT_VERSION,
  type CanonicalCaptionBrollApprovedSnapshotAuthority,
  type CanonicalCaptionBrollApprovedSnapshotReadPort,
  type CanonicalCaptionBrollAuthenticatedEvidenceRecord,
  type CanonicalCaptionBrollOwnerReadPort,
  type CanonicalCaptionBrollSupportOutcome,
} from '../../src/types/canonical-caption-broll-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type { CaptionBrollOwnerReadBinding } from
  '../../src/types/caption-multi-track-scene-graph'
import type {
  SkillArtifactRef,
  SkillCanonicalScope,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import type { CanonicalCaptionCrossSystemExecutionInputReadPort } from
  '../../src/types/canonical-caption-cross-system-execution-input'
import type { CanonicalCaptionIncomingSupportRequestReadPort } from
  '../../src/types/canonical-caption-specialist-execution'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  adaptBrollOwnerReadResultToCaptionBinding,
  assertBrollCaptionOwnerReadResultForRequest,
  parseBrollCaptionOwnerReadRequest,
  parseBrollCaptionOwnerReadResult,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import { parseCaptionBrollOwnerReadBinding } from
  '../captions-specialist/caption-multi-track-scene-graph'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import {
  calculateSkillContractDigest,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalAuthenticatedSpecialistSupportArtifactProjection,
  parseCanonicalAuthenticatedSpecialistSupportArtifactProjection,
  resumeCanonicalSpecialistWithAuthenticatedSupport,
  type CanonicalSpecialistSupportResumeRepository,
} from './canonical-specialist-support-resume-service'
import {
  canonicalCaptionCrossSystemRuntimeInput,
  resolveCanonicalCaptionCrossSystemExecutionInput,
} from './canonical-caption-cross-system-execution-input-service'
import { resolveCanonicalCaptionIncomingSupportRequestForCall } from
  './canonical-caption-incoming-support-request-service'

export const CANONICAL_CAPTION_BROLL_SUPPORT_SERVICE_VERSION =
  'canonical-caption-broll-support-service-v1' as const
export const CANONICAL_CAPTION_BROLL_EVIDENCE_REPOSITORY_VERSION =
  'canonical-caption-broll-evidence-repository-v1' as const

const DEFAULT_PREFIX = 'private/orchestra/v1/caption-broll-support'
const MAX_RECORD_BYTES = 16 * 1024 * 1024
const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeIdentity = z.string().trim().min(1).max(240)
  .refine((value) => !hasUnsafeControlCharacter(value))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const domainRefSchema: z.ZodType<CaptionDomainRef> = z.object({
  id: safeIdentity,
  version: safeIdentity,
  contentHash: rawSha256,
}).strict()
const skillRefSchema: z.ZodType<SkillContractRef> = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: 'custom', message: 'Frame range is empty.' })
  }
})
const skillScopeSchema: z.ZodType<SkillCanonicalScope> = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  approvedSnapshotRef: skillRefSchema.nullable(),
  outputId: safeKey.nullable(),
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).max(256),
}).strict()
const captionScopeSchema: z.ZodType<CaptionDomainCanonicalScope> = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: domainRefSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).min(1).max(256),
}).strict()
const brollFrameRangeSchema = z.object({
  startFrameInclusive: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
  fps: z.number().int().min(1).max(120),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrameInclusive) {
    context.addIssue({ code: 'custom', message: 'B-roll frame range is empty.' })
  }
})
const brollScopeSchema: z.ZodType<BrollCaptionCanonicalScope> = z.object({
  ownerUserId: safeIdentity,
  workspaceId: safeIdentity,
  projectId: safeIdentity,
  editSessionId: safeIdentity,
  planVersionId: safeIdentity,
  approvedSnapshotRef: domainRefSchema,
  outputId: safeIdentity,
  outputFrameRef: domainRefSchema,
  sceneId: safeIdentity,
  authorizedFrameRange: brollFrameRangeSchema,
  masterTimingRef: domainRefSchema,
  masterTimingHash: rawSha256,
}).strict()
const snapshotAuthoritySchema:
z.ZodType<CanonicalCaptionBrollApprovedSnapshotAuthority> = z.object({
  canonicalScope: brollScopeSchema,
  planningConstraintRef: domainRefSchema,
}).strict()
const recordEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_BROLL_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  recordId: safeKey,
  recordDigestSha256: rawSha256,
  priorCallRef: skillRefSchema,
  supportRequestRef: skillRefSchema,
  ownerRequest: z.unknown(),
  ownerResult: z.unknown(),
  captionBinding: z.unknown(),
  authenticatedOwnerProjection: z.unknown(),
  createdAt: timestamp,
  authenticatedOwnerUserVerified: z.literal(true),
  exactPriorCallAndSupportRequestReread: z.literal(true),
  exactApprovedSnapshotReread: z.literal(true),
  exactOwnerResultReread: z.literal(true),
  exactScopeFrameTimingAndRequestLineageVerified: z.literal(true),
  ownerResultPersistedCreateOnlyAndReread: z.literal(true),
  captionBindingProjectedFromOpaqueOwnerRefs: z.literal(true),
  browserLocalStateUsed: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  mediaLocatorIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  credentialsIncluded: z.literal(false),
  sourceSelectionPerformedByCaption: z.literal(false),
  cropOrTimingPerformedByCaption: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  runtimeExecutionPerformedByBridge: z.literal(false),
  assetMutationPerformedByBridge: z.literal(false),
  costOrBillingMutationPerformedByBridge: z.literal(false),
  finalQaApprovalGrantedByBridge: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export interface CanonicalCaptionBrollEvidenceRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_EVIDENCE_REPOSITORY_VERSION
  persistOwnerResultCreateOnly(input: {
    readonly supportRequestRef: SkillContractRef
    readonly ownerResult: BrollCaptionOwnerReadResult
  }): Promise<'created' | 'identical_replay'>
  rereadOwnerResult(input: {
    readonly supportRequestRef: SkillContractRef
  }): Promise<BrollCaptionOwnerReadResult | null>
  persistEvidenceRecordCreateOnly(input: {
    readonly record: CanonicalCaptionBrollAuthenticatedEvidenceRecord
  }): Promise<'created' | 'identical_replay'>
  rereadEvidenceRecord(input: {
    readonly supportRequestRef: SkillContractRef
  }): Promise<CanonicalCaptionBrollAuthenticatedEvidenceRecord | null>
}

export interface CanonicalCaptionBrollSupportService {
  readonly schemaVersion: typeof CANONICAL_CAPTION_BROLL_SUPPORT_SERVICE_VERSION
  projectAndResumeAuthenticatedEvidence(input: {
    readonly authenticatedOwnerUserId: string
    readonly priorCallRef: SkillContractRef
    readonly selectedSupportRequestRef: SkillContractRef
  }): Promise<CanonicalCaptionBrollSupportOutcome>
}

const admittedOwnerReaders = new WeakSet<object>()
const admittedSnapshotReaders = new WeakSet<object>()

export function createCanonicalCaptionBrollOwnerReadPort(
  readExact: CanonicalCaptionBrollOwnerReadPort['readExact'],
): CanonicalCaptionBrollOwnerReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical B-roll owner reader is required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_CAPTION_BROLL_OWNER_READ_PORT_VERSION,
    sourceAuthority: 'canonical_b_roll_owner' as const,
    callerSuppliedOwnerResultAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedOwnerReaders.add(port)
  return port
}

export function createCanonicalCaptionBrollApprovedSnapshotReadPort(
  readExact: CanonicalCaptionBrollApprovedSnapshotReadPort['readExact'],
): CanonicalCaptionBrollApprovedSnapshotReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical approved-snapshot reader is required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_BROLL_APPROVED_SNAPSHOT_READ_PORT_VERSION,
    sourceAuthority: 'canonical_approved_edit_snapshot_owner' as const,
    callerSuppliedSnapshotAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedSnapshotReaders.add(port)
  return port
}

export function createCanonicalCaptionBrollEvidenceRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalCaptionBrollEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_BROLL_EVIDENCE_REPOSITORY_VERSION,
    async persistOwnerResultCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted, 'Caption B-roll owner-result write')
      const write = z.object({
        supportRequestRef: skillRefSchema,
        ownerResult: z.unknown(),
      }).strict().parse(untrusted)
      const result = parseBrollCaptionOwnerReadResult(write.ownerResult)
      return persistExact(input.objectPort,
        ownerResultPath(prefix, write.supportRequestRef), result,
        parseBrollCaptionOwnerReadResult)
    },
    async rereadOwnerResult(untrusted: unknown) {
      const ref = readRequest(untrusted)
      return readExact(input.objectPort, ownerResultPath(prefix, ref),
        parseBrollCaptionOwnerReadResult)
    },
    async persistEvidenceRecordCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted, 'Caption B-roll evidence write')
      const write = z.object({ record: z.unknown() }).strict().parse(untrusted)
      const record = parseCanonicalCaptionBrollAuthenticatedEvidenceRecord(
        write.record)
      return persistExact(input.objectPort,
        evidencePath(prefix, record.supportRequestRef), record,
        parseCanonicalCaptionBrollAuthenticatedEvidenceRecord)
    },
    async rereadEvidenceRecord(untrusted: unknown) {
      const ref = readRequest(untrusted)
      return readExact(input.objectPort, evidencePath(prefix, ref),
        parseCanonicalCaptionBrollAuthenticatedEvidenceRecord)
    },
  })
}

export function createCanonicalCaptionBrollSupportService(input: {
  readonly supportResumeRepository: CanonicalSpecialistSupportResumeRepository
  readonly approvedSnapshotReadPort:
    CanonicalCaptionBrollApprovedSnapshotReadPort
  readonly ownerReadPort: CanonicalCaptionBrollOwnerReadPort
  readonly evidenceRepository: CanonicalCaptionBrollEvidenceRepository
  readonly crossSystemExecutionInputReadPort?:
    CanonicalCaptionCrossSystemExecutionInputReadPort
  readonly incomingSupportRequestReadPort?:
    CanonicalCaptionIncomingSupportRequestReadPort
  readonly now?: () => Date
}): CanonicalCaptionBrollSupportService {
  assertPorts(input)
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_BROLL_SUPPORT_SERVICE_VERSION,
    async projectAndResumeAuthenticatedEvidence(untrusted: unknown) {
      assertClosedContractTree(untrusted, 'Caption B-roll bridge input')
      const request = z.object({
        authenticatedOwnerUserId: safeKey,
        priorCallRef: skillRefSchema,
        selectedSupportRequestRef: skillRefSchema,
      }).strict().parse(untrusted)
      const pair = await input.supportResumeRepository.rereadCallResultPair({
        callRef: request.priorCallRef,
      })
      if (!pair || !sameRef(callRef(pair.call), request.priorCallRef)) {
        throw new Error('Caption prior call/result pair is unavailable.')
      }
      const selected = pair.result.supportRequests[0]
      if (!selected || !sameRef(supportRequestRef(selected),
        request.selectedSupportRequestRef)) {
        throw new Error('Caption B-roll request is not current.')
      }
      const supportRequest = parseCaptionBrollSupportRequest(selected)
      const ownerRequest = parseBrollCaptionOwnerReadRequest(
        supportRequest.typedPayload)
      assertOwnerRequestMatchesCall(pair.call, ownerRequest)
      if (request.authenticatedOwnerUserId
        !== ownerRequest.canonicalScope.ownerUserId) {
        throw new Error('Caption B-roll authenticated owner mismatch.')
      }
      const snapshotAuthority = await rereadApprovedSnapshot(
        input.approvedSnapshotReadPort,
        ownerRequest,
      )
      assertSnapshotMatchesRequest(snapshotAuthority, ownerRequest)
      const ownerResult = await rereadOwnerResult(
        input.ownerReadPort,
        ownerRequest,
      )
      await input.evidenceRepository.persistOwnerResultCreateOnly({
        supportRequestRef: request.selectedSupportRequestRef,
        ownerResult,
      })
      const persistedOwnerResult = await input.evidenceRepository
        .rereadOwnerResult({
          supportRequestRef: request.selectedSupportRequestRef,
        })
      if (!persistedOwnerResult || !sameCanonical(
        persistedOwnerResult, ownerResult)) {
        throw new Error('Caption B-roll owner result persistence failed.')
      }
      const captionBinding = adaptBrollOwnerReadResultToCaptionBinding({
        request: ownerRequest,
        result: persistedOwnerResult,
        expected: projectionAuthority(ownerRequest),
      })
      const projection =
        createCanonicalAuthenticatedSpecialistSupportArtifactProjection({
          schemaVersion:
            'canonical-authenticated-specialist-support-artifact-projection-v1',
          projectionId:
            `caption.broll.projection.${ownerResult.resultDigestSha256.slice(0, 32)}`,
          originalCallRef: supportRequest.originalCallRef,
          supportRequestRef: request.selectedSupportRequestRef,
          ownerResultRef: ownerResultRef(ownerResult),
          ownerKey: 'broll_owner',
          canonicalScope: supportRequest.canonicalScope,
          artifactRefs: [ownerResultArtifactRef(
            ownerResult, request.selectedSupportRequestRef)],
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
      await input.supportResumeRepository
        .persistAuthenticatedOwnerProjectionCreateOnly({ projection })
      const projectionReread = await input.supportResumeRepository
        .rereadAuthenticatedOwnerProjection({
          supportRequestRef: request.selectedSupportRequestRef,
        })
      if (!projectionReread || projectionReread.projectionDigestSha256
        !== projection.projectionDigestSha256) {
        throw new Error('Caption B-roll owner projection reread failed.')
      }
      const evidenceRecord = createRecord({
        priorCallRef: request.priorCallRef,
        supportRequestRef: request.selectedSupportRequestRef,
        ownerRequest,
        ownerResult: persistedOwnerResult,
        captionBinding,
        authenticatedOwnerProjection: projectionReread,
        createdAt: pair.persistedAt,
      })
      await input.evidenceRepository.persistEvidenceRecordCreateOnly({
        record: evidenceRecord,
      })
      const recordReread = await input.evidenceRepository
        .rereadEvidenceRecord({
          supportRequestRef: request.selectedSupportRequestRef,
        })
      if (!recordReread || recordReread.recordDigestSha256
        !== evidenceRecord.recordDigestSha256) {
        throw new Error('Caption B-roll evidence record reread failed.')
      }
      const resumeRecord =
        await resumeCanonicalSpecialistWithAuthenticatedSupport({
          priorCallRef: request.priorCallRef,
          selectedSupportRequestRef: request.selectedSupportRequestRef,
          repository: input.supportResumeRepository,
          specialistExecutionPort: {
            execute: async ({ call, resumeSupportRequest }) => {
              const exactRecord = await input.evidenceRepository
                .rereadEvidenceRecord({
                  supportRequestRef: supportRequestRef(resumeSupportRequest),
                })
              if (!exactRecord || !sameRef(exactRecord.supportRequestRef,
                request.selectedSupportRequestRef)) {
                throw new Error('Caption B-roll resume evidence is unavailable.')
              }
              const crossSystemExecutionInput =
                await resolveCanonicalCaptionCrossSystemExecutionInput({
                  call,
                  readPort: input.crossSystemExecutionInputReadPort,
                })
              const incomingSupportRequest =
                await resolveCanonicalCaptionIncomingSupportRequestForCall({
                  call,
                  readPort: input.incomingSupportRequestReadPort,
                })
              return runCaptionsSpecialistJob({
                call,
                resumeSupportRequest,
                brollOwnerReadRequest: exactRecord.ownerRequest,
                brollOwnerReadResult: exactRecord.ownerResult,
                ...(incomingSupportRequest === null ? {} : {
                  incomingSupportRequest,
                }),
                ...canonicalCaptionCrossSystemRuntimeInput(
                  crossSystemExecutionInput),
              })
            },
          },
          now: input.now,
        })
      return freeze({ evidenceRecord: recordReread, resumeRecord })
    },
  })
}

export function parseCanonicalCaptionBrollAuthenticatedEvidenceRecord(
  value: unknown,
): CanonicalCaptionBrollAuthenticatedEvidenceRecord {
  assertClosedContractTree(value, 'Canonical Caption B-roll evidence record')
  rejectUnsafeText(value, 'Canonical Caption B-roll evidence record')
  const envelope = recordEnvelopeSchema.parse(value)
  const ownerRequest = parseBrollCaptionOwnerReadRequest(envelope.ownerRequest)
  const ownerResult = assertBrollCaptionOwnerReadResultForRequest({
    request: ownerRequest,
    result: envelope.ownerResult,
  })
  const captionBinding = parseCaptionBrollOwnerReadBinding(
    envelope.captionBinding)
  const projection =
    parseCanonicalAuthenticatedSpecialistSupportArtifactProjection(
      envelope.authenticatedOwnerProjection)
  const parsed: CanonicalCaptionBrollAuthenticatedEvidenceRecord = {
    ...envelope,
    ownerRequest,
    ownerResult,
    captionBinding,
    authenticatedOwnerProjection: projection,
  }
  if (parsed.recordDigestSha256 !== contractDigest(
    parsed, 'recordDigestSha256')) {
    throw new Error('Canonical Caption B-roll evidence digest failed.')
  }
  assertRecordLineage(parsed)
  return freeze(parsed)
}

function createRecord(input: {
  priorCallRef: SkillContractRef
  supportRequestRef: SkillContractRef
  ownerRequest: BrollCaptionOwnerReadRequest
  ownerResult: BrollCaptionOwnerReadResult
  captionBinding: CaptionBrollOwnerReadBinding
  authenticatedOwnerProjection:
    CanonicalCaptionBrollAuthenticatedEvidenceRecord[
      'authenticatedOwnerProjection'
    ]
  createdAt: string
}): CanonicalCaptionBrollAuthenticatedEvidenceRecord {
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_BROLL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
    recordId:
      `caption.broll.evidence.${input.supportRequestRef.contentHash.slice(0, 32)}`,
    priorCallRef: input.priorCallRef,
    supportRequestRef: input.supportRequestRef,
    ownerRequest: input.ownerRequest,
    ownerResult: input.ownerResult,
    captionBinding: input.captionBinding,
    authenticatedOwnerProjection: input.authenticatedOwnerProjection,
    createdAt: timestamp.parse(input.createdAt),
    authenticatedOwnerUserVerified: true as const,
    exactPriorCallAndSupportRequestReread: true as const,
    exactApprovedSnapshotReread: true as const,
    exactOwnerResultReread: true as const,
    exactScopeFrameTimingAndRequestLineageVerified: true as const,
    ownerResultPersistedCreateOnlyAndReread: true as const,
    captionBindingProjectedFromOpaqueOwnerRefs: true as const,
    browserLocalStateUsed: false as const,
    mediaBytesIncluded: false as const,
    mediaLocatorIncluded: false as const,
    rawChatIncluded: false as const,
    credentialsIncluded: false as const,
    sourceSelectionPerformedByCaption: false as const,
    cropOrTimingPerformedByCaption: false as const,
    directPeerDispatchPerformed: false as const,
    runtimeExecutionPerformedByBridge: false as const,
    assetMutationPerformedByBridge: false as const,
    costOrBillingMutationPerformedByBridge: false as const,
    finalQaApprovalGrantedByBridge: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseCanonicalCaptionBrollAuthenticatedEvidenceRecord({
    ...withoutDigest,
    recordDigestSha256: contractDigest(withoutDigest, 'recordDigestSha256'),
  })
}

function parseCaptionBrollSupportRequest(value: unknown): SkillSupportRequest {
  const request = parseSkillSupportRequest(value)
  const ownerRequest = parseBrollCaptionOwnerReadRequest(request.typedPayload)
  if (request.requestingSkillKey !== 'captions'
    || request.targetSkillKey !== 'broll_owner'
    || request.reasonCode !== 'missing.caption_broll_owner_read_binding'
    || request.requestedArtifactTypes.length !== 1
    || request.requestedArtifactTypes[0]
      !== BROLL_CAPTION_OWNER_READ_RESULT_ARTIFACT_TYPE
    || request.typedPayloadType !== BROLL_CAPTION_OWNER_READ_REQUEST_VERSION
    || ownerRequest.requestDigestSha256 !==
      (request.typedPayload as BrollCaptionOwnerReadRequest)
        .requestDigestSha256) {
    throw new Error('Caption B-roll support request is invalid.')
  }
  return freeze(request)
}

function assertOwnerRequestMatchesCall(
  call: Parameters<typeof callRef>[0],
  request: BrollCaptionOwnerReadRequest,
): void {
  const scope = request.canonicalScope
  const callSnapshot = call.canonicalScope.approvedSnapshotRef
  if (call.job.jobType !== 'provide_caption_broll_composition_constraints'
    || call.job.scopeLevel !== 'scene'
    || call.canonicalScope.boundaryId !== null
    || callSnapshot === null
    || !sameRef(callRef(call), {
      id: call.callId,
      version: call.schemaVersion,
      contentHash: call.callDigestSha256,
    })
    || call.canonicalScope.ownerUserId !== scope.ownerUserId
    || call.canonicalScope.workspaceId !== scope.workspaceId
    || call.canonicalScope.projectId !== scope.projectId
    || call.canonicalScope.editSessionId !== scope.editSessionId
    || !sameRef(callSnapshot, scope.approvedSnapshotRef)
    || call.canonicalScope.outputId !== scope.outputId
    || call.canonicalScope.sceneId !== scope.sceneId
    || call.canonicalScope.authorizedFrameRanges.length !== 1
    || call.canonicalScope.authorizedFrameRanges[0]?.startFrame
      !== scope.authorizedFrameRange.startFrameInclusive
    || call.canonicalScope.authorizedFrameRanges[0]?.endFrameExclusive
      !== scope.authorizedFrameRange.endFrameExclusive
    || !exactSingleInputArtifactRef(
      call.inputArtifactRefs, 'confirmed_output_frame', scope.outputFrameRef)
    || !exactSingleInputArtifactRef(
      call.inputArtifactRefs, 'master_timing_or_planning_timing',
      scope.masterTimingRef)) {
    throw new Error('B-roll owner request crossed Caption call authority.')
  }
}

async function rereadApprovedSnapshot(
  port: CanonicalCaptionBrollApprovedSnapshotReadPort,
  request: BrollCaptionOwnerReadRequest,
): Promise<CanonicalCaptionBrollApprovedSnapshotAuthority> {
  const readInput = {
    approvedSnapshotRef: structuredClone(
      request.canonicalScope.approvedSnapshotRef),
  }
  const first = parseSnapshotAuthority(await port.readExact(readInput))
  const second = parseSnapshotAuthority(await port.readExact(readInput))
  if (!sameCanonical(first, second)) {
    throw new Error('Canonical approved snapshot changed during reread.')
  }
  return first
}

async function rereadOwnerResult(
  port: CanonicalCaptionBrollOwnerReadPort,
  request: BrollCaptionOwnerReadRequest,
): Promise<BrollCaptionOwnerReadResult> {
  const first = assertBrollCaptionOwnerReadResultForRequest({
    request,
    result: await port.readExact({ request: structuredClone(request) }),
  })
  const second = assertBrollCaptionOwnerReadResultForRequest({
    request,
    result: await port.readExact({ request: structuredClone(request) }),
  })
  if (!sameCanonical(first, second)) {
    throw new Error('Canonical B-roll owner result changed during reread.')
  }
  return first
}

function parseSnapshotAuthority(
  value: unknown,
): CanonicalCaptionBrollApprovedSnapshotAuthority {
  assertClosedContractTree(value, 'Canonical Caption B-roll snapshot authority')
  rejectUnsafeText(value, 'Canonical Caption B-roll snapshot authority')
  return freeze(snapshotAuthoritySchema.parse(value))
}

function assertSnapshotMatchesRequest(
  authority: CanonicalCaptionBrollApprovedSnapshotAuthority,
  request: BrollCaptionOwnerReadRequest,
): void {
  if (!sameCanonical(authority.canonicalScope, request.canonicalScope)
    || !sameDomainRef(authority.planningConstraintRef,
      request.planningConstraintRef)) {
    throw new Error('B-roll request is stale against approved snapshot.')
  }
}

function projectionAuthority(
  request: BrollCaptionOwnerReadRequest,
): CaptionBrollOwnerReadProjectionAuthority {
  const scope = request.canonicalScope
  return {
    canonicalScope: captionScopeFromBroll(scope),
    confirmedOutputFrameRef: structuredClone(scope.outputFrameRef),
    masterTimingRef: structuredClone(scope.masterTimingRef),
    masterTimingHash: scope.masterTimingHash,
    authorizedFps: scope.authorizedFrameRange.fps,
    planningConstraintRef: structuredClone(request.planningConstraintRef),
  }
}

function captionScopeFromBroll(
  scope: BrollCaptionCanonicalScope,
): CaptionDomainCanonicalScope {
  return captionScopeSchema.parse({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    planVersionId: scope.planVersionId,
    approvedSnapshotRef: scope.approvedSnapshotRef,
    outputId: scope.outputId,
    sceneId: scope.sceneId,
    authorizedFrameRanges: [{
      startFrame: scope.authorizedFrameRange.startFrameInclusive,
      endFrameExclusive: scope.authorizedFrameRange.endFrameExclusive,
    }],
  })
}

function ownerResultRef(result: BrollCaptionOwnerReadResult): SkillContractRef {
  return skillRefSchema.parse({
    id: result.resultId,
    version: result.schemaVersion,
    contentHash: result.resultDigestSha256,
  })
}

function ownerResultArtifactRef(
  result: BrollCaptionOwnerReadResult,
  requestRef: SkillContractRef,
): SkillArtifactRef {
  return {
    ...ownerResultRef(result),
    artifactType: BROLL_CAPTION_OWNER_READ_RESULT_ARTIFACT_TYPE,
    producerSkillKey: 'broll_owner',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: structuredClone(requestRef),
  }
}

function assertRecordLineage(
  record: CanonicalCaptionBrollAuthenticatedEvidenceRecord,
): void {
  const expectedBinding = adaptBrollOwnerReadResultToCaptionBinding({
    request: record.ownerRequest,
    result: record.ownerResult,
    expected: projectionAuthority(record.ownerRequest),
  })
  const projection = record.authenticatedOwnerProjection
  if (!sameRef(record.supportRequestRef, projection.supportRequestRef)
    || !sameRef(record.priorCallRef, projection.originalCallRef)
    || !sameRef(ownerResultRef(record.ownerResult), projection.ownerResultRef)
    || projection.ownerKey !== 'broll_owner'
    || !sameCanonical(record.captionBinding, expectedBinding)
    || !sameCanonical(projection.canonicalScope,
      skillScopeFromBroll(record.ownerRequest.canonicalScope))
    || projection.artifactRefs.length !== 1
    || !sameCanonical(projection.artifactRefs[0], ownerResultArtifactRef(
      record.ownerResult, record.supportRequestRef))) {
    throw new Error('Canonical Caption B-roll evidence lineage mismatch.')
  }
}

function skillScopeFromBroll(
  scope: BrollCaptionCanonicalScope,
): SkillCanonicalScope {
  return skillScopeSchema.parse({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedSnapshotRef: scope.approvedSnapshotRef,
    outputId: scope.outputId,
    sceneId: scope.sceneId,
    boundaryId: null,
    authorizedFrameRanges: [{
      startFrame: scope.authorizedFrameRange.startFrameInclusive,
      endFrameExclusive: scope.authorizedFrameRange.endFrameExclusive,
    }],
  })
}

function exactSingleInputArtifactRef(
  artifacts: readonly SkillArtifactRef[],
  artifactType: string,
  expected: CaptionDomainRef,
): boolean {
  const matches = artifacts.filter((artifact) =>
    artifact.artifactType === artifactType)
  return matches.length === 1 && sameRef(matches[0]!, expected)
}

function callRef(
  call: import('../../src/types/orchestra-skill-contracts').OrchestraSkillCall,
): SkillContractRef {
  return skillRefSchema.parse({
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  })
}

function supportRequestRef(request: SkillSupportRequest): SkillContractRef {
  return skillRefSchema.parse({
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  })
}

function readRequest(value: unknown): SkillContractRef {
  assertClosedContractTree(value, 'Caption B-roll evidence read request')
  return z.object({ supportRequestRef: skillRefSchema }).strict()
    .parse(value).supportRequestRef
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameDomainRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return sameRef(left, right)
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return contractDigest({ value: left }, 'unusedDigestField')
    === contractDigest({ value: right }, 'unusedDigestField')
}

function contractDigest(value: unknown, digestField: string): string {
  assertClosedContractTree(value, 'Caption B-roll digest input')
  return calculateSkillContractDigest(
    value as Record<string, unknown>, digestField)
}

function ownerResultPath(prefix: string, ref: SkillContractRef): string {
  return `${prefix}/owner-results/${ref.contentHash}.json`
}

function evidencePath(prefix: string, ref: SkillContractRef): string {
  return `${prefix}/evidence/${ref.contentHash}.json`
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
    throw new Error('Caption B-roll create-only reread failed.')
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
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Caption B-roll evidence bytes are invalid.')
  }
  try {
    return parser(JSON.parse(body.toString('utf8')) as unknown)
  } catch (error) {
    if (error instanceof Error
      && error.message.includes('Caption B-roll')) throw error
    throw new Error('Caption B-roll evidence JSON is invalid.', {
      cause: error,
    })
  }
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Caption B-roll evidence size is invalid.')
  }
  return body
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Caption B-roll object port is incomplete.')
  }
}

function assertPorts(input: {
  supportResumeRepository: CanonicalSpecialistSupportResumeRepository
  approvedSnapshotReadPort: CanonicalCaptionBrollApprovedSnapshotReadPort
  ownerReadPort: CanonicalCaptionBrollOwnerReadPort
  evidenceRepository: CanonicalCaptionBrollEvidenceRepository
}): void {
  if (!admittedOwnerReaders.has(input.ownerReadPort)
    || !admittedSnapshotReaders.has(input.approvedSnapshotReadPort)
    || typeof input.supportResumeRepository?.rereadCallResultPair !== 'function'
    || typeof input.supportResumeRepository
      ?.persistAuthenticatedOwnerProjectionCreateOnly !== 'function'
    || typeof input.supportResumeRepository
      ?.rereadAuthenticatedOwnerProjection !== 'function'
    || typeof input.supportResumeRepository
      ?.persistCallResultPairCreateOnly !== 'function'
    || typeof input.supportResumeRepository
      ?.persistResumeRecordCreateOnly !== 'function'
    || typeof input.supportResumeRepository
      ?.rereadResumeRecordByResumedCall !== 'function'
    || typeof input.evidenceRepository?.persistOwnerResultCreateOnly
      !== 'function'
    || typeof input.evidenceRepository?.rereadOwnerResult !== 'function'
    || typeof input.evidenceRepository?.persistEvidenceRecordCreateOnly
      !== 'function'
    || typeof input.evidenceRepository?.rereadEvidenceRecord !== 'function') {
    throw new Error('Caption B-roll bridge ports are incomplete.')
  }
}

function rejectUnsafeText(value: unknown, label: string): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|\\|\.\.[/\\]|(?:authorization|password|credential|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+|x-goog/iu.test(current)) {
        throw new Error(`${label} contains unsafe serialized text.`)
      }
    } else if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}

function hasUnsafeControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 32 || code === 127) return true
  }
  return false
}

function freeze<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) freeze(item)
    return Object.freeze(value)
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      freeze(item)
    }
    return Object.freeze(value)
  }
  return value
}
