import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CAPTION_SOUND_CUE_REQUEST_VERSION,
  CAPTION_SOUND_SUPPORT_RESULT_ARTIFACT_TYPE,
  type CaptionSoundCueRequest,
  type CaptionSoundSupportBundle,
  type CaptionSoundSupportResult,
} from '../../src/types/caption-sound-support'
import {
  CANONICAL_CAPTION_SOUNDSYNC_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  CANONICAL_CAPTION_SOUNDSYNC_CONTEXT_READ_PORT_VERSION,
  CANONICAL_CAPTION_SOUNDSYNC_OWNER_READ_PORT_VERSION,
  type CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord,
  type CanonicalCaptionSoundSyncContext,
  type CanonicalCaptionSoundSyncContextReadPort,
  type CanonicalCaptionSoundSyncContextReadRequest,
  type CanonicalCaptionSoundSyncOwnerReadPort,
  type CanonicalCaptionSoundSyncSupportOutcome,
} from '../../src/types/canonical-caption-soundsync-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
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
  createCaptionSoundAdmission,
  parseCaptionSoundAdmission,
  parseCaptionSoundContext,
  parseCaptionSoundCueRequest,
  parseCaptionSoundSupportResult,
} from '../captions-specialist/caption-sound-support'
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

export const CANONICAL_CAPTION_SOUNDSYNC_SUPPORT_SERVICE_VERSION =
  'canonical-caption-soundsync-support-service-v1' as const
export const CANONICAL_CAPTION_SOUNDSYNC_EVIDENCE_REPOSITORY_VERSION =
  'canonical-caption-soundsync-evidence-repository-v1' as const

const DEFAULT_PREFIX = 'private/orchestra/v1/caption-soundsync-support'
const MAX_RECORD_BYTES = 32 * 1024 * 1024
const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const refSchema: z.ZodType<SkillContractRef> = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const domainRefSchema: z.ZodType<CaptionDomainRef> = refSchema
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: 'custom', message: 'Frame range is empty.' })
  }
})
const domainScopeSchema: z.ZodType<CaptionDomainCanonicalScope> = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: domainRefSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).min(1).max(512),
}).strict()
const soundRequestEnvelopeSchema = z.object({
  schemaVersion: z.literal(CAPTION_SOUND_CUE_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: rawSha256,
  idempotencyKey: safeKey,
  canonicalScope: domainScopeSchema,
  sceneGraphRef: domainRefSchema,
  motionPlanRef: domainRefSchema,
  motionLockRef: domainRefSchema,
  storyTimingResolutionRef: domainRefSchema,
  masterTimingRef: domainRefSchema,
  approvedCaptionEnvelopeRef: domainRefSchema,
}).passthrough()
const recordEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SOUNDSYNC_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  recordId: safeKey,
  recordDigestSha256: rawSha256,
  priorCallRef: refSchema,
  supportRequestRef: refSchema,
  supportRequest: z.unknown(),
  captionSoundRequest: z.unknown(),
  canonicalContext: z.unknown(),
  soundSyncResult: z.unknown(),
  captionAdmission: z.unknown(),
  authenticatedOwnerProjection: z.unknown(),
  createdAt: timestamp,
  authenticatedOwnerUserVerified: z.literal(true),
  exactPriorCallAndSupportRequestReread: z.literal(true),
  exactApprovedSnapshotMasterTimingStoryTimingContextReread: z.literal(true),
  exactSoundSyncResultReread: z.literal(true),
  soundSyncResultPersistedCreateOnlyAndReread: z.literal(true),
  dialogueProtectedFinalMixRereadAndQaVerified: z.literal(true),
  storyTimingRemainsFrameOwner: z.literal(true),
  soundSyncRemainsCueAssetTrimMixOwner: z.literal(true),
  browserLocalStateUsed: z.literal(false),
  rawAudioBytesIncluded: z.literal(false),
  mediaPathsOrUrlsIncluded: z.literal(false),
  providerPayloadOrCredentialsIncluded: z.literal(false),
  cueAssetOrMixChosenByCaption: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  runtimeExecutionPerformedByBridge: z.literal(false),
  assetMutationPerformedByBridge: z.literal(false),
  costOrBillingMutationPerformedByBridge: z.literal(false),
  finalQaApprovalGrantedByBridge: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export interface CanonicalCaptionSoundSyncEvidenceRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_SOUNDSYNC_EVIDENCE_REPOSITORY_VERSION
  persistOwnerResultCreateOnly(input: {
    readonly supportRequestRef: SkillContractRef
    readonly bundle: CaptionSoundSupportBundle
    readonly context: CanonicalCaptionSoundSyncContext
    readonly soundSyncResult: CaptionSoundSupportResult
  }): Promise<'created' | 'identical_replay'>
  rereadOwnerResult(input: {
    readonly supportRequestRef: SkillContractRef
    readonly bundle: CaptionSoundSupportBundle
    readonly context: CanonicalCaptionSoundSyncContext
  }): Promise<CaptionSoundSupportResult | null>
  persistEvidenceRecordCreateOnly(input: {
    readonly record: CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord
  }): Promise<'created' | 'identical_replay'>
  rereadEvidenceRecord(input: {
    readonly supportRequestRef: SkillContractRef
  }): Promise<CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord | null>
}

export interface CanonicalCaptionSoundSyncSupportService {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_SOUNDSYNC_SUPPORT_SERVICE_VERSION
  projectAndResumeAuthenticatedEvidence(input: {
    readonly authenticatedOwnerUserId: string
    readonly priorCallRef: SkillContractRef
    readonly selectedSupportRequestRef: SkillContractRef
  }): Promise<CanonicalCaptionSoundSyncSupportOutcome>
}

const admittedContextReaders = new WeakSet<object>()
const admittedOwnerReaders = new WeakSet<object>()

export function createCanonicalCaptionSoundSyncContextReadPort(
  readExact: CanonicalCaptionSoundSyncContextReadPort['readExact'],
): CanonicalCaptionSoundSyncContextReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption SoundSync context reader is required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_CAPTION_SOUNDSYNC_CONTEXT_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_approved_snapshot_master_timing_story_timing_owner' as const,
    callerSuppliedContextAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedContextReaders.add(port)
  return port
}

export function createCanonicalCaptionSoundSyncOwnerReadPort(
  readExact: CanonicalCaptionSoundSyncOwnerReadPort['readExact'],
): CanonicalCaptionSoundSyncOwnerReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical SoundSync owner reader is required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_CAPTION_SOUNDSYNC_OWNER_READ_PORT_VERSION,
    sourceAuthority: 'canonical_soundsync_owner' as const,
    callerSuppliedSoundResultAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedOwnerReaders.add(port)
  return port
}

export function createCanonicalCaptionSoundSyncEvidenceRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalCaptionSoundSyncEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_SOUNDSYNC_EVIDENCE_REPOSITORY_VERSION,
    async persistOwnerResultCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted, 'Caption SoundSync owner-result write')
      const write = z.object({
        supportRequestRef: refSchema,
        bundle: z.unknown(),
        context: z.unknown(),
        soundSyncResult: z.unknown(),
      }).strict().parse(untrusted)
      const context = parseCaptionSoundContext(write.context)
      const bundle = parseBundle(write.bundle, context)
      const result = parseCaptionSoundSupportResult(
        write.soundSyncResult, bundle, context)
      return persistExact(input.objectPort,
        ownerResultPath(prefix, write.supportRequestRef), result,
        (value) => parseCaptionSoundSupportResult(value, bundle, context))
    },
    async rereadOwnerResult(untrusted: unknown) {
      assertClosedContractTree(untrusted, 'Caption SoundSync owner-result read')
      const read = z.object({
        supportRequestRef: refSchema,
        bundle: z.unknown(),
        context: z.unknown(),
      }).strict().parse(untrusted)
      const context = parseCaptionSoundContext(read.context)
      const bundle = parseBundle(read.bundle, context)
      return readExact(input.objectPort,
        ownerResultPath(prefix, read.supportRequestRef),
        (value) => parseCaptionSoundSupportResult(value, bundle, context))
    },
    async persistEvidenceRecordCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted, 'Caption SoundSync evidence write')
      const write = z.object({ record: z.unknown() }).strict().parse(untrusted)
      const record =
        parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord(write.record)
      return persistExact(input.objectPort,
        evidencePath(prefix, record.supportRequestRef), record,
        parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord)
    },
    async rereadEvidenceRecord(untrusted: unknown) {
      const ref = readRequest(untrusted)
      return readExact(input.objectPort, evidencePath(prefix, ref),
        parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord)
    },
  })
}

export function createCanonicalCaptionSoundSyncSupportService(input: {
  readonly supportResumeRepository: CanonicalSpecialistSupportResumeRepository
  readonly contextReadPort: CanonicalCaptionSoundSyncContextReadPort
  readonly ownerReadPort: CanonicalCaptionSoundSyncOwnerReadPort
  readonly evidenceRepository: CanonicalCaptionSoundSyncEvidenceRepository
  readonly crossSystemExecutionInputReadPort?:
    CanonicalCaptionCrossSystemExecutionInputReadPort
  readonly incomingSupportRequestReadPort?:
    CanonicalCaptionIncomingSupportRequestReadPort
  readonly now?: () => Date
}): CanonicalCaptionSoundSyncSupportService {
  assertPorts(input)
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_SOUNDSYNC_SUPPORT_SERVICE_VERSION,
    async projectAndResumeAuthenticatedEvidence(untrusted: unknown) {
      assertClosedContractTree(untrusted, 'Caption SoundSync bridge input')
      const request = z.object({
        authenticatedOwnerUserId: safeKey,
        priorCallRef: refSchema,
        selectedSupportRequestRef: refSchema,
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
        throw new Error('Caption SoundSync request is not current.')
      }
      const support = parseSkillSupportRequest(selected)
      const envelope = soundRequestEnvelopeSchema.parse(support.typedPayload)
      const contextRequest = contextReadRequest(
        support, envelope as unknown as CaptionSoundCueRequest)
      const canonicalContext = await rereadContext(
        input.contextReadPort, contextRequest)
      const captionSoundRequest = parseCaptionSoundCueRequest(
        support.typedPayload, canonicalContext)
      const supportRequest = parseCaptionSoundSupportRequest(
        support, captionSoundRequest, canonicalContext)
      assertSoundRequestMatchesCall(pair.call, captionSoundRequest)
      if (request.authenticatedOwnerUserId
        !== captionSoundRequest.canonicalScope.ownerUserId) {
        throw new Error('Caption SoundSync authenticated owner mismatch.')
      }
      const bundle = { payload: captionSoundRequest, supportRequest }
      const soundSyncResult = await rereadSoundSyncResult(
        input.ownerReadPort, bundle, canonicalContext)
      if (soundSyncResult.evidenceMode !== 'authenticated_private_runtime') {
        throw new Error('Caption SoundSync result is not authenticated.')
      }
      await input.evidenceRepository.persistOwnerResultCreateOnly({
        supportRequestRef: request.selectedSupportRequestRef,
        bundle,
        context: canonicalContext,
        soundSyncResult,
      })
      const persistedResult = await input.evidenceRepository
        .rereadOwnerResult({
          supportRequestRef: request.selectedSupportRequestRef,
          bundle,
          context: canonicalContext,
        })
      if (!persistedResult || !sameCanonical(
        persistedResult, soundSyncResult)) {
        throw new Error('Caption SoundSync result persistence failed.')
      }
      const admission = createCaptionSoundAdmission({
        admissionId:
          `caption.soundsync.admission.${persistedResult.resultDigestSha256.slice(0, 32)}`,
        bundle,
        context: canonicalContext,
        supportResult: persistedResult,
      })
      if (admission.disposition !== 'authenticated_private_ready'
        || !admission.dialogueProtectedFinalMixVerified) {
        throw new Error('Caption SoundSync dialogue protection is not ready.')
      }
      const projection =
        createCanonicalAuthenticatedSpecialistSupportArtifactProjection({
          schemaVersion:
            'canonical-authenticated-specialist-support-artifact-projection-v1',
          projectionId:
            `caption.soundsync.projection.${persistedResult.resultDigestSha256.slice(0, 32)}`,
          originalCallRef: supportRequest.originalCallRef,
          supportRequestRef: request.selectedSupportRequestRef,
          ownerResultRef: soundResultRef(persistedResult),
          ownerKey: 'soundsync',
          canonicalScope: supportRequest.canonicalScope,
          artifactRefs: [soundResultArtifactRef(
            persistedResult, request.selectedSupportRequestRef)],
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
        throw new Error('Caption SoundSync projection reread failed.')
      }
      const evidenceRecord = createRecord({
        priorCallRef: request.priorCallRef,
        supportRequestRef: request.selectedSupportRequestRef,
        supportRequest,
        captionSoundRequest,
        canonicalContext,
        soundSyncResult: persistedResult,
        captionAdmission: admission,
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
        throw new Error('Caption SoundSync evidence record reread failed.')
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
                throw new Error('Caption SoundSync resume evidence is unavailable.')
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
                soundSupportContext: exactRecord.canonicalContext,
                soundSupportPayload: exactRecord.captionSoundRequest,
                soundSupportResult: exactRecord.soundSyncResult,
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

export function parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord(
  value: unknown,
): CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord {
  assertClosedContractTree(value, 'Canonical Caption SoundSync evidence record')
  rejectUnsafeText(value, 'Canonical Caption SoundSync evidence record')
  const envelope = recordEnvelopeSchema.parse(value)
  const canonicalContext = parseCaptionSoundContext(envelope.canonicalContext)
  const captionSoundRequest = parseCaptionSoundCueRequest(
    envelope.captionSoundRequest, canonicalContext)
  const supportRequest = parseCaptionSoundSupportRequest(
    envelope.supportRequest, captionSoundRequest, canonicalContext)
  const bundle = { payload: captionSoundRequest, supportRequest }
  const soundSyncResult = parseCaptionSoundSupportResult(
    envelope.soundSyncResult, bundle, canonicalContext)
  const captionAdmission = parseCaptionSoundAdmission(
    envelope.captionAdmission, bundle, canonicalContext, soundSyncResult)
  const authenticatedOwnerProjection =
    parseCanonicalAuthenticatedSpecialistSupportArtifactProjection(
      envelope.authenticatedOwnerProjection)
  const parsed: CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord = {
    ...envelope,
    supportRequest,
    captionSoundRequest,
    canonicalContext,
    soundSyncResult,
    captionAdmission,
    authenticatedOwnerProjection,
  }
  if (parsed.recordDigestSha256 !== contractDigest(
    parsed, 'recordDigestSha256')) {
    throw new Error('Canonical Caption SoundSync evidence digest failed.')
  }
  assertRecordLineage(parsed)
  return freeze(parsed)
}

function createRecord(input: Omit<
  CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord,
  | 'schemaVersion'
  | 'recordId'
  | 'recordDigestSha256'
  | 'authenticatedOwnerUserVerified'
  | 'exactPriorCallAndSupportRequestReread'
  | 'exactApprovedSnapshotMasterTimingStoryTimingContextReread'
  | 'exactSoundSyncResultReread'
  | 'soundSyncResultPersistedCreateOnlyAndReread'
  | 'dialogueProtectedFinalMixRereadAndQaVerified'
  | 'storyTimingRemainsFrameOwner'
  | 'soundSyncRemainsCueAssetTrimMixOwner'
  | 'browserLocalStateUsed'
  | 'rawAudioBytesIncluded'
  | 'mediaPathsOrUrlsIncluded'
  | 'providerPayloadOrCredentialsIncluded'
  | 'cueAssetOrMixChosenByCaption'
  | 'directPeerDispatchPerformed'
  | 'runtimeExecutionPerformedByBridge'
  | 'assetMutationPerformedByBridge'
  | 'costOrBillingMutationPerformedByBridge'
  | 'finalQaApprovalGrantedByBridge'
  | 'publicDeliveryGranted'
  | 'productionAuthorityGranted'
>): CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord {
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_SOUNDSYNC_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
    recordId:
      `caption.soundsync.evidence.${input.supportRequestRef.contentHash.slice(0, 32)}`,
    ...input,
    createdAt: timestamp.parse(input.createdAt),
    authenticatedOwnerUserVerified: true as const,
    exactPriorCallAndSupportRequestReread: true as const,
    exactApprovedSnapshotMasterTimingStoryTimingContextReread: true as const,
    exactSoundSyncResultReread: true as const,
    soundSyncResultPersistedCreateOnlyAndReread: true as const,
    dialogueProtectedFinalMixRereadAndQaVerified: true as const,
    storyTimingRemainsFrameOwner: true as const,
    soundSyncRemainsCueAssetTrimMixOwner: true as const,
    browserLocalStateUsed: false as const,
    rawAudioBytesIncluded: false as const,
    mediaPathsOrUrlsIncluded: false as const,
    providerPayloadOrCredentialsIncluded: false as const,
    cueAssetOrMixChosenByCaption: false as const,
    directPeerDispatchPerformed: false as const,
    runtimeExecutionPerformedByBridge: false as const,
    assetMutationPerformedByBridge: false as const,
    costOrBillingMutationPerformedByBridge: false as const,
    finalQaApprovalGrantedByBridge: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord({
    ...withoutDigest,
    recordDigestSha256: contractDigest(withoutDigest, 'recordDigestSha256'),
  })
}

function parseBundle(
  value: unknown,
  context: CanonicalCaptionSoundSyncContext,
): CaptionSoundSupportBundle {
  assertClosedContractTree(value, 'Caption SoundSync support bundle')
  const parsed = z.object({
    payload: z.unknown(),
    supportRequest: z.unknown(),
  }).strict().parse(value)
  const payload = parseCaptionSoundCueRequest(parsed.payload, context)
  const supportRequest = parseCaptionSoundSupportRequest(
    parsed.supportRequest, payload, context)
  return { payload, supportRequest }
}

function parseCaptionSoundSupportRequest(
  value: unknown,
  payload: CaptionSoundCueRequest,
  context: CanonicalCaptionSoundSyncContext,
): SkillSupportRequest {
  const request = parseSkillSupportRequest(value)
  const embedded = parseCaptionSoundCueRequest(request.typedPayload, context)
  if (request.requestingSkillKey !== 'captions'
    || request.targetSkillKey !== 'soundsync'
    || request.reasonCode !== 'caption_semantic_sound_support_requested'
    || request.requestedArtifactTypes.length !== 1
    || request.requestedArtifactTypes[0]
      !== CAPTION_SOUND_SUPPORT_RESULT_ARTIFACT_TYPE
    || request.typedPayloadType !== CAPTION_SOUND_CUE_REQUEST_VERSION
    || embedded.requestDigestSha256 !== payload.requestDigestSha256
    || !sameSkillAndDomainScope(request.canonicalScope,
      payload.canonicalScope)) {
    throw new Error('Caption SoundSync support request is invalid.')
  }
  return freeze(request)
}

function contextReadRequest(
  supportRequest: SkillSupportRequest,
  request: CaptionSoundCueRequest,
): CanonicalCaptionSoundSyncContextReadRequest {
  return {
    supportRequestRef: supportRequestRef(supportRequest),
    captionSoundRequestRef: captionSoundRequestRef(request),
    canonicalScope: structuredClone(request.canonicalScope),
    sceneGraphRef: structuredClone(request.sceneGraphRef),
    motionPlanRef: structuredClone(request.motionPlanRef),
    motionLockRef: structuredClone(request.motionLockRef),
    storyTimingResolutionRef: structuredClone(request.storyTimingResolutionRef),
    masterTimingRef: structuredClone(request.masterTimingRef),
    approvedCaptionEnvelopeRef: structuredClone(
      request.approvedCaptionEnvelopeRef),
  }
}

async function rereadContext(
  port: CanonicalCaptionSoundSyncContextReadPort,
  request: CanonicalCaptionSoundSyncContextReadRequest,
): Promise<CanonicalCaptionSoundSyncContext> {
  const first = parseCaptionSoundContext(await port.readExact(
    structuredClone(request)))
  const second = parseCaptionSoundContext(await port.readExact(
    structuredClone(request)))
  if (!sameCanonical(first, second)) {
    throw new Error('Canonical Caption SoundSync context changed on reread.')
  }
  return freeze(first)
}

async function rereadSoundSyncResult(
  port: CanonicalCaptionSoundSyncOwnerReadPort,
  bundle: CaptionSoundSupportBundle,
  context: CanonicalCaptionSoundSyncContext,
): Promise<CaptionSoundSupportResult> {
  const readInput = {
    supportRequest: structuredClone(bundle.supportRequest),
    captionSoundRequest: structuredClone(bundle.payload),
  }
  const first = parseCaptionSoundSupportResult(
    await port.readExact(readInput), bundle, context)
  const second = parseCaptionSoundSupportResult(
    await port.readExact(readInput), bundle, context)
  if (!sameCanonical(first, second)) {
    throw new Error('Canonical SoundSync result changed on reread.')
  }
  return first
}

function assertSoundRequestMatchesCall(
  call: Parameters<typeof callRef>[0],
  request: CaptionSoundCueRequest,
): void {
  const scope = request.canonicalScope
  const boundaryMatches = call.job.scopeLevel === 'scene'
    ? call.canonicalScope.boundaryId === null
    : call.job.scopeLevel === 'boundary'
      && call.canonicalScope.boundaryId !== null
  if (![
    'provide_typographic_transition_support',
    'prepare_caption_boundary_timing_requirements',
    'provide_typographic_transition_component',
  ].includes(call.job.jobType)
    || !boundaryMatches
    || call.idempotencyKey !== request.idempotencyKey
    || !sameSkillAndDomainScope(call.canonicalScope, scope)
    || !exactSingleInputArtifactRef(
      call.inputArtifactRefs, 'master_timing_or_planning_timing',
      request.masterTimingRef)) {
    throw new Error('SoundSync request crossed Caption call authority.')
  }
}

function assertRecordLineage(
  record: CanonicalCaptionSoundSyncAuthenticatedEvidenceRecord,
): void {
  const expectedAdmission = createCaptionSoundAdmission({
    admissionId:
      `caption.soundsync.admission.${record.soundSyncResult.resultDigestSha256.slice(0, 32)}`,
    bundle: {
      payload: record.captionSoundRequest,
      supportRequest: record.supportRequest,
    },
    context: record.canonicalContext,
    supportResult: record.soundSyncResult,
  })
  const projection = record.authenticatedOwnerProjection
  if (!sameRef(record.priorCallRef, record.supportRequest.originalCallRef)
    || !sameRef(record.supportRequestRef,
      supportRequestRef(record.supportRequest))
    || !sameRef(record.priorCallRef, projection.originalCallRef)
    || !sameRef(record.supportRequestRef, projection.supportRequestRef)
    || !sameRef(soundResultRef(record.soundSyncResult),
      projection.ownerResultRef)
    || projection.ownerKey !== 'soundsync'
    || !sameCanonical(projection.canonicalScope,
      record.supportRequest.canonicalScope)
    || !sameCanonical(record.captionAdmission, expectedAdmission)
    || record.captionAdmission.disposition !== 'authenticated_private_ready'
    || !record.captionAdmission.dialogueProtectedFinalMixVerified
    || projection.artifactRefs.length !== 1
    || !sameCanonical(projection.artifactRefs[0], soundResultArtifactRef(
      record.soundSyncResult, record.supportRequestRef))) {
    throw new Error('Canonical Caption SoundSync evidence lineage mismatch.')
  }
}

function captionSoundRequestRef(
  request: CaptionSoundCueRequest,
): CaptionDomainRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function soundResultRef(result: CaptionSoundSupportResult): SkillContractRef {
  return refSchema.parse({
    id: result.resultId,
    version: result.schemaVersion,
    contentHash: result.resultDigestSha256,
  })
}

function soundResultArtifactRef(
  result: CaptionSoundSupportResult,
  requestRef: SkillContractRef,
): SkillArtifactRef {
  return {
    ...soundResultRef(result),
    artifactType: CAPTION_SOUND_SUPPORT_RESULT_ARTIFACT_TYPE,
    producerSkillKey: 'soundsync',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: structuredClone(requestRef),
  }
}

function callRef(
  call: import('../../src/types/orchestra-skill-contracts').OrchestraSkillCall,
): SkillContractRef {
  return refSchema.parse({
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  })
}

function supportRequestRef(request: SkillSupportRequest): SkillContractRef {
  return refSchema.parse({
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
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

function sameSkillAndDomainScope(
  skill: SkillCanonicalScope,
  domain: CaptionDomainCanonicalScope,
): boolean {
  return skill.ownerUserId === domain.ownerUserId
    && skill.workspaceId === domain.workspaceId
    && skill.projectId === domain.projectId
    && skill.editSessionId === domain.editSessionId
    && nullableRefEqual(skill.approvedSnapshotRef, domain.approvedSnapshotRef)
    && skill.outputId === domain.outputId
    && skill.sceneId === domain.sceneId
    && sameCanonical(skill.authorizedFrameRanges,
      domain.authorizedFrameRanges)
}

function readRequest(value: unknown): SkillContractRef {
  assertClosedContractTree(value, 'Caption SoundSync evidence read request')
  return z.object({ supportRequestRef: refSchema }).strict()
    .parse(value).supportRequestRef
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function nullableRefEqual(
  left: SkillContractRef | null,
  right: CaptionDomainRef | null,
): boolean {
  return left === null ? right === null : right !== null && sameRef(left, right)
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return contractDigest({ value: left }, 'unusedDigestField')
    === contractDigest({ value: right }, 'unusedDigestField')
}

function contractDigest(value: unknown, digestField: string): string {
  assertClosedContractTree(value, 'Caption SoundSync digest input')
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
    throw new Error('Caption SoundSync create-only reread failed.')
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
    throw new Error('Caption SoundSync evidence bytes are invalid.')
  }
  try {
    return parser(JSON.parse(body.toString('utf8')) as unknown)
  } catch (error) {
    if (error instanceof Error
      && error.message.includes('Caption SoundSync')) throw error
    throw new Error('Caption SoundSync evidence JSON is invalid.', {
      cause: error,
    })
  }
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Caption SoundSync evidence size is invalid.')
  }
  return body
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Caption SoundSync object port is incomplete.')
  }
}

function assertPorts(input: {
  supportResumeRepository: CanonicalSpecialistSupportResumeRepository
  contextReadPort: CanonicalCaptionSoundSyncContextReadPort
  ownerReadPort: CanonicalCaptionSoundSyncOwnerReadPort
  evidenceRepository: CanonicalCaptionSoundSyncEvidenceRepository
}): void {
  if (!admittedContextReaders.has(input.contextReadPort)
    || !admittedOwnerReaders.has(input.ownerReadPort)
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
    throw new Error('Caption SoundSync bridge ports are incomplete.')
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
