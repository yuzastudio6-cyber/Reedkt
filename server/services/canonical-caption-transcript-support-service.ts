import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_SOURCE_WORD_TIMING_EVIDENCE_VERSION,
  CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_READ_PORT_VERSION,
  CANONICAL_CAPTION_TRANSCRIPT_PLANNING_EXPECTATION_BINDING_VERSION,
  type CanonicalCaptionSourceWordTimingEvidence,
  type CanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
  type CanonicalCaptionTranscriptAuthenticatedReadPort,
  type CanonicalCaptionTranscriptPlanningExpectationBinding,
} from '../../src/types/canonical-caption-transcript-support'
import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
  type CaptionCanonicalTranscriptAuthenticatedReadBinding,
  type CaptionCanonicalTranscriptReadScope,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import {
  CAPTION_ALIGNMENT_QUALIFICATION_VERSION,
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
  type CaptionAlignmentQualification,
  type CaptionCanonicalTranscript,
} from '../../src/types/caption-transcript-lineage'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseCaptionCanonicalTranscriptAuthenticatedReadBinding,
} from '../captions-specialist/caption-canonical-transcript-authenticated-read'
import {
  parseCaptionAlignmentQualification,
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import { createCanonicalSourceLedSourceFrameAuthority } from
  './canonical-source-led-content-analysis-evidence'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
  type CanonicalSourceTranscriptOrchestraReadPort,
  type CanonicalSourceTranscriptOrchestraReadScope,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  verifyCanonicalVisualIntelligenceSourceTranscriptResult,
  type CanonicalVisualIntelligenceSourceTranscriptResult,
} from './canonical-source-visual-intelligence-analysis-contract'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_CAPTION_SOURCE_WORD_TIMING_READ_PORT_VERSION =
  'canonical-caption-source-word-timing-read-port-v1' as const
export const CANONICAL_CAPTION_APPROVED_SNAPSHOT_READ_PORT_VERSION =
  'canonical-caption-approved-snapshot-read-port-v1' as const
export const CANONICAL_CAPTION_TRANSCRIPT_SUPPORT_SERVICE_VERSION =
  'canonical-caption-transcript-support-service-v1' as const
export const CANONICAL_CAPTION_TRANSCRIPT_SUPPORT_SERVICE_V2_VERSION =
  'canonical-caption-transcript-support-service-v2' as const
export const CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_VERSION =
  'canonical-caption-transcript-evidence-repository-v1' as const
export const CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_CURRENT_VERSION =
  'canonical-caption-transcript-evidence-repository-v3' as const
export const CANONICAL_CAPTION_TRANSCRIPT_SCOPE_INDEX_VERSION =
  'canonical-caption-transcript-scope-index-v1' as const
export const CANONICAL_CAPTION_TRANSCRIPT_EXPECTATION_INDEX_VERSION =
  'canonical-caption-transcript-expectation-index-v1' as const

const DEFAULT_PREFIX = 'private/orchestra/v1/caption-transcript-support'
const MAX_RECORD_BYTES = 64 * 1024 * 1024
const unsafeTextPattern =
  /https?:\/\/|file:\/\/|gs:\/\/|s3:\/\/|\/(?:Users|Volumes|home|tmp)\/|\\\\|\.\.[/\\]|(?:authorization|password|credential|secret)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+/iu
const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeText = z.string().trim().min(1).max(4_000)
  .refine((value) => !hasUnsafeControlCharacter(value))
  .refine((value) => !unsafeTextPattern.test(value))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const domainRefSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: rawSha256,
}).strict()
const visualRefSchema = z.object({
  id: safeKey,
  version: z.number().int().positive().max(1_000_000),
  contentHash: prefixedSha256,
}).strict()
const readScopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: domainRefSchema,
}).strict()
const wordSchema = z.object({
  orderInSegment: z.number().int().positive().max(1_000_000),
  text: safeText,
  startMilliseconds: z.number().int().nonnegative()
    .max(24 * 60 * 60 * 1_000),
  endMillisecondsExclusive: z.number().int().positive()
    .max(24 * 60 * 60 * 1_000),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  speakerId: safeKey.nullable(),
}).strict()
const segmentSchema = z.object({
  sourceTranscriptSegmentId: safeKey,
  order: z.number().int().positive().max(20_000),
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
  startMilliseconds: z.number().int().nonnegative()
    .max(24 * 60 * 60 * 1_000),
  endMillisecondsExclusive: z.number().int().positive()
    .max(24 * 60 * 60 * 1_000),
  text: safeText,
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  words: z.array(wordSchema).min(1).max(100_000),
}).strict()
const wordEvidenceSchema:
z.ZodType<CanonicalCaptionSourceWordTimingEvidence> = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_SOURCE_WORD_TIMING_EVIDENCE_VERSION),
  evidenceId: safeKey,
  evidenceDigestSha256: rawSha256,
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  analysisRunId: safeKey,
  sourceSequenceItemId: safeKey,
  mediaAssetId: safeKey,
  uploadedOrder: z.number().int().positive().max(8),
  sourceChecksumSha256: rawSha256,
  durationFrames: z.number().int().positive(),
  fpsNumerator: z.number().int().positive(),
  fpsDenominator: z.number().int().positive(),
  sourceScopeDigestSha256: rawSha256,
  sourceTranscriptAuthorityRef: visualRefSchema,
  sourceTranscriptDigestSha256: rawSha256,
  languageCode: z.string().trim().min(2).max(24)
    .regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/u),
  wordTimingArtifactRef: domainRefSchema,
  diarizationArtifactRef: domainRefSchema.nullable(),
  speakerDiarizationState: z.enum(['not_present', 'complete']),
  segments: z.array(segmentSchema).min(1).max(20_000),
  exactPrivateArtifactRereadVerified: z.literal(true),
  exactSourceScopeVerified: z.literal(true),
  exactTranscriptDigestVerified: z.literal(true),
  exactWordTimestampCoverageVerified: z.literal(true),
  asrNativeWordTiming: z.literal(true),
  privateArtifact: z.literal(true),
  browserShareable: z.literal(false),
  rawAudioIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  transcriptMutationAuthorityGranted: z.literal(false),
  timingAuthorityGranted: z.literal(false),
  runtimeOrDispatchAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const recordEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  recordId: safeKey,
  recordDigestSha256: rawSha256,
  canonicalReadScope: readScopeSchema,
  sourceScopeDigestSha256: rawSha256,
  sourceSpeechEvidenceProjectionRef: domainRefSchema,
  sourceWordTimingEvidenceRefs: z.array(domainRefSchema).min(1).max(8),
  alignmentQualification: z.unknown(),
  canonicalTranscript: z.unknown(),
  authenticatedReadBinding: z.unknown(),
  createdAt: timestamp,
  canonicalSourceTranscriptOwnerRereadVerified: z.literal(true),
  exactPrivateWordTimingRereadVerified: z.literal(true),
  exactSourceOrderAndScopeVerified: z.literal(true),
  exactSegmentAndWordLineageVerified: z.literal(true),
  exactApprovedSnapshotRereadVerified: z.literal(true),
  createOnlyPersistedAndReread: z.literal(true),
  singleCanonicalTranscriptVerified: z.literal(true),
  privateArtifact: z.literal(true),
  browserShareable: z.literal(false),
  rawAudioIncluded: z.literal(false),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  providerCallPerformedByBridge: z.literal(false),
  transcriptRuntimePerformedByBridge: z.literal(false),
  transcriptMutationAuthorityGrantedToCaption: z.literal(false),
  timingAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const scopeIndexSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRANSCRIPT_SCOPE_INDEX_VERSION),
  canonicalReadScope: readScopeSchema,
  canonicalTranscriptRef: domainRefSchema,
  authenticatedReadBindingRef: domainRefSchema,
  recordDigestSha256: rawSha256,
  indexDigestSha256: rawSha256,
}).strict()

const expectationBindingWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TRANSCRIPT_PLANNING_EXPECTATION_BINDING_VERSION),
  bindingId: safeKey,
  canonicalReadScope: readScopeSchema,
  planningExpectationRef: domainRefSchema,
  canonicalTranscriptRef: domainRefSchema,
  authenticatedReadBindingRef: domainRefSchema,
  authenticatedTranscriptRecordDigestSha256: rawSha256,
  sourceScopeDigestSha256: rawSha256,
  exactApprovedSnapshotRereadVerified: z.literal(true),
  exactSourceScopeAndTranscriptLineageVerified: z.literal(true),
  authenticatedTranscriptPersistedAndReread: z.literal(true),
  createOnlyPersistedAndReread: z.literal(true),
  privateArtifact: z.literal(true),
  byteFreeBinding: z.literal(true),
  rawChatIncluded: z.literal(false),
  transcriptTextIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsUrlsOrCredentialsIncluded: z.literal(false),
  directPeerDispatchPerformed: z.literal(false),
  providerCallPerformedByBridge: z.literal(false),
  transcriptRuntimePerformedByBridge: z.literal(false),
  transcriptMutationAuthorityGrantedToCaption: z.literal(false),
  timingAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const expectationBindingSchema:
z.ZodType<CanonicalCaptionTranscriptPlanningExpectationBinding> =
  expectationBindingWithoutDigestSchema.extend({
    bindingDigestSha256: rawSha256,
  }).strict()

type CanonicalCaptionTranscriptScopeIndex = z.infer<typeof scopeIndexSchema>

export interface CanonicalCaptionSourceWordTimingReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_SOURCE_WORD_TIMING_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_quality_first_source_transcript_router'
  readonly evidenceClass:
    'process_bound_private_source_word_timing_reader'
  readonly callerSuppliedEvidenceAccepted: false
  readExact(input: {
    readonly scope: CanonicalSourceTranscriptOrchestraReadScope
    readonly transcriptAuthorityRef:
      CanonicalVisualIntelligenceSourceTranscriptResult[
        'transcriptAuthorityRef'
      ]
  }): Promise<unknown>
}

export interface CanonicalCaptionApprovedSnapshotReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_APPROVED_SNAPSHOT_READ_PORT_VERSION
  readonly sourceAuthority: 'canonical_approved_edit_snapshot_owner'
  readonly callerSuppliedSnapshotAccepted: false
  readExact(
    scope: CaptionCanonicalTranscriptReadScope,
  ): Promise<CaptionCanonicalTranscriptReadScope | null>
}

export interface CanonicalCaptionTranscriptEvidenceRepository
  extends CanonicalCaptionTranscriptAuthenticatedReadPort {
  readonly repositoryVersion:
    typeof CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_CURRENT_VERSION
  persistCreateOnly(input: {
    readonly record: CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
  }): Promise<'created' | 'identical_replay'>
  rereadRecord(input: {
    readonly canonicalReadScope: CaptionCanonicalTranscriptReadScope
    readonly canonicalTranscriptRef: CaptionDomainRef
    readonly authenticatedReadBindingRef: CaptionDomainRef
  }): Promise<CanonicalCaptionTranscriptAuthenticatedEvidenceRecord | null>
  findExactForExecution(input: {
    readonly canonicalReadScope: CaptionCanonicalTranscriptReadScope
    readonly canonicalTranscriptRef: CaptionDomainRef
  }): Promise<CanonicalCaptionTranscriptAuthenticatedEvidenceRecord | null>
  persistPlanningExpectationBindingCreateOnly(input: {
    readonly binding: CanonicalCaptionTranscriptPlanningExpectationBinding
  }): Promise<'created' | 'identical_replay'>
  findExactForPlanningExpectation(input: {
    readonly canonicalReadScope: CaptionCanonicalTranscriptReadScope
    readonly planningExpectationRef: CaptionDomainRef
  }): Promise<Readonly<{
    binding: CanonicalCaptionTranscriptPlanningExpectationBinding
    transcriptRecord: CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
  }> | null>
}

export interface CanonicalCaptionTranscriptSupportService {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TRANSCRIPT_SUPPORT_SERVICE_VERSION
  projectAuthenticatedTranscript(input: {
    readonly canonicalReadScope: CaptionCanonicalTranscriptReadScope
    readonly sourceScopes:
      readonly CanonicalSourceTranscriptOrchestraReadScope[]
  }): Promise<CanonicalCaptionTranscriptAuthenticatedEvidenceRecord>
}

export interface CanonicalCaptionTranscriptSupportServiceV2 {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_TRANSCRIPT_SUPPORT_SERVICE_V2_VERSION
  projectAuthenticatedTranscript(input: {
    readonly canonicalReadScope: CaptionCanonicalTranscriptReadScope
    readonly sourceScopes:
      readonly CanonicalSourceTranscriptOrchestraReadScope[]
  }): Promise<CanonicalCaptionTranscriptAuthenticatedEvidenceRecord>
  projectAuthenticatedTranscriptForPlanningExpectation(input: {
    readonly canonicalReadScope: CaptionCanonicalTranscriptReadScope
    readonly sourceScopes:
      readonly CanonicalSourceTranscriptOrchestraReadScope[]
    readonly planningExpectationRef: CaptionDomainRef
  }): Promise<Readonly<{
    transcriptRecord: CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
    expectationBinding:
      CanonicalCaptionTranscriptPlanningExpectationBinding
  }>>
}

const admittedWordReaders = new WeakSet<object>()
const admittedSnapshotReaders = new WeakSet<object>()
const admittedTranscriptRepositories = new WeakSet<object>()

export function createCanonicalCaptionSourceWordTimingReadPort(
  readExact:
    CanonicalCaptionSourceWordTimingReadPort['readExact'],
): CanonicalCaptionSourceWordTimingReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption word-timing reader is required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_CAPTION_SOURCE_WORD_TIMING_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_quality_first_source_transcript_router' as const,
    evidenceClass:
      'process_bound_private_source_word_timing_reader' as const,
    callerSuppliedEvidenceAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedWordReaders.add(port)
  return port
}

export function createCanonicalCaptionApprovedSnapshotReadPort(
  readExact: CanonicalCaptionApprovedSnapshotReadPort['readExact'],
): CanonicalCaptionApprovedSnapshotReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption approved-snapshot reader is required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_CAPTION_APPROVED_SNAPSHOT_READ_PORT_VERSION,
    sourceAuthority: 'canonical_approved_edit_snapshot_owner' as const,
    callerSuppliedSnapshotAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedSnapshotReaders.add(port)
  return port
}

export function assertCanonicalCaptionApprovedSnapshotReadPort(
  port: CanonicalCaptionApprovedSnapshotReadPort,
): void {
  if (!admittedSnapshotReaders.has(port)
    || port.schemaVersion !==
      CANONICAL_CAPTION_APPROVED_SNAPSHOT_READ_PORT_VERSION
    || typeof port.readExact !== 'function') {
    throw new Error('Canonical Caption approved-snapshot reader is not admitted.')
  }
}

export function assertCanonicalCaptionTranscriptEvidenceRepository(
  repository: CanonicalCaptionTranscriptEvidenceRepository,
): void {
  if (!admittedTranscriptRepositories.has(repository)
    || repository.schemaVersion !==
      CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_READ_PORT_VERSION
    || repository.repositoryVersion !==
      CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_CURRENT_VERSION
    || typeof repository.persistCreateOnly !== 'function'
    || typeof repository.rereadRecord !== 'function'
    || typeof repository.findExactForExecution !== 'function'
    || typeof repository.persistPlanningExpectationBindingCreateOnly !==
      'function'
    || typeof repository.findExactForPlanningExpectation !== 'function'
    || typeof repository.readExact !== 'function') {
    throw new Error(
      'Canonical Caption transcript evidence repository is not admitted.',
    )
  }
}

export function createCanonicalCaptionSourceWordTimingEvidence(input: Omit<
  CanonicalCaptionSourceWordTimingEvidence,
  'schemaVersion' | 'evidenceDigestSha256'
>): CanonicalCaptionSourceWordTimingEvidence {
  assertClosedContractTree(input, 'Canonical Caption word-timing evidence input')
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_SOURCE_WORD_TIMING_EVIDENCE_VERSION,
    ...input,
  }
  return parseCanonicalCaptionSourceWordTimingEvidence({
    ...withoutDigest,
    evidenceDigestSha256: contractDigest({
      ...withoutDigest,
      evidenceDigestSha256: '',
    }, 'evidenceDigestSha256'),
  })
}

export function parseCanonicalCaptionSourceWordTimingEvidence(
  value: unknown,
): CanonicalCaptionSourceWordTimingEvidence {
  assertClosedContractTree(value, 'Canonical Caption word-timing evidence')
  rejectUnsafeText(value, 'Canonical Caption word-timing evidence')
  const evidence = wordEvidenceSchema.parse(value)
  assertWordEvidenceSemantics(evidence)
  if (evidence.evidenceDigestSha256 !== contractDigest(
    evidence as unknown as Record<string, unknown>,
    'evidenceDigestSha256',
  )) throw new Error('Canonical Caption word-timing digest failed.')
  return freeze(evidence)
}

export function parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord(
  value: unknown,
): CanonicalCaptionTranscriptAuthenticatedEvidenceRecord {
  assertClosedContractTree(value, 'Canonical Caption transcript record')
  rejectUnsafeText(value, 'Canonical Caption transcript record')
  const envelope = recordEnvelopeSchema.parse(value)
  const alignmentQualification = parseCaptionAlignmentQualification(
    envelope.alignmentQualification)
  const canonicalTranscript = parseCaptionCanonicalTranscript(
    envelope.canonicalTranscript)
  const authenticatedReadBinding =
    parseCaptionCanonicalTranscriptAuthenticatedReadBinding(
      envelope.authenticatedReadBinding)
  const record = {
    ...envelope,
    alignmentQualification,
    canonicalTranscript,
    authenticatedReadBinding,
  } as CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
  const transcriptRef = domainTranscriptRef(canonicalTranscript)
  const bindingRef = domainBindingRef(authenticatedReadBinding)
  const expectedEvidenceKeys = record.sourceWordTimingEvidenceRefs
    .map(domainRefKey).sort()
  const transcriptEvidenceKeys = uniqueDomainRefs([
    ...canonicalTranscript.segments.map((segment) => segment.sourceRecordRef),
    ...canonicalTranscript.words.map((word) => word.timestampEvidenceRef),
  ]).map(domainRefKey).sort()
  const transcriptDiarizationKeys = uniqueDomainRefs(
    canonicalTranscript.words.flatMap((word) =>
      word.diarizationArtifactRef ? [word.diarizationArtifactRef] : []),
  ).map(domainRefKey)
  if (
    !sameDomainRef(authenticatedReadBinding.canonicalTranscriptRef,
      transcriptRef)
    || !sameDomainRef(authenticatedReadBinding.alignmentQualificationRef,
      qualificationRef(alignmentQualification))
    || !sameDomainRef(canonicalTranscript.alignmentQualificationRef,
      qualificationRef(alignmentQualification))
    || !sameDomainRef(canonicalTranscript.sourceSpeechEvidencePackageRef,
      record.sourceSpeechEvidenceProjectionRef)
    || authenticatedReadBinding.canonicalReadScope.ownerUserId !==
      record.canonicalReadScope.ownerUserId
    || stableAuthorityStringify(authenticatedReadBinding.canonicalReadScope)
      !== stableAuthorityStringify(record.canonicalReadScope)
    || new Set(record.sourceWordTimingEvidenceRefs.map(domainRefKey)).size !==
      record.sourceWordTimingEvidenceRefs.length
    || stableAuthorityStringify(expectedEvidenceKeys) !==
      stableAuthorityStringify(transcriptEvidenceKeys)
    || stableAuthorityStringify(transcriptDiarizationKeys) !==
      stableAuthorityStringify(authenticatedReadBinding
        .diarizationArtifactRefs.map(domainRefKey))
    || record.sourceSpeechEvidenceProjectionRef.contentHash !==
      sha256AuthorityValue({
        sourceScopeDigestSha256: record.sourceScopeDigestSha256,
        evidenceRefs: record.sourceWordTimingEvidenceRefs,
      })
    || record.recordId !== `caption.transcript.record.${
      record.canonicalTranscript.transcriptDigestSha256.slice(0, 32)}`
    || record.recordDigestSha256 !== contractDigest(
      record as unknown as Record<string, unknown>,
      'recordDigestSha256',
    )
    || transcriptRef.version !== CAPTION_CANONICAL_TRANSCRIPT_VERSION
    || bindingRef.version !==
      CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION
  ) throw new Error('Canonical Caption transcript record mismatch.')
  return freeze(record)
}

export function createCanonicalCaptionTranscriptPlanningExpectationBinding(
  input: Omit<CanonicalCaptionTranscriptPlanningExpectationBinding,
    'schemaVersion' | 'bindingDigestSha256'>,
): CanonicalCaptionTranscriptPlanningExpectationBinding {
  assertClosedContractTree(
    input, 'Canonical Caption transcript expectation binding input')
  const withoutDigest = expectationBindingWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_CAPTION_TRANSCRIPT_PLANNING_EXPECTATION_BINDING_VERSION,
    ...structuredClone(input),
  })
  return parseCanonicalCaptionTranscriptPlanningExpectationBinding({
    ...withoutDigest,
    bindingDigestSha256: contractDigest({
      ...withoutDigest,
      bindingDigestSha256: '',
    }, 'bindingDigestSha256'),
  })
}

export function parseCanonicalCaptionTranscriptPlanningExpectationBinding(
  value: unknown,
): CanonicalCaptionTranscriptPlanningExpectationBinding {
  assertClosedContractTree(
    value, 'Canonical Caption transcript expectation binding')
  rejectUnsafeText(value, 'Canonical Caption transcript expectation binding')
  const binding = expectationBindingSchema.parse(value)
  if (binding.bindingDigestSha256 !== contractDigest(
    binding as unknown as Record<string, unknown>,
    'bindingDigestSha256',
  ) || binding.bindingId !== planningExpectationBindingId({
    canonicalReadScope: binding.canonicalReadScope,
    planningExpectationRef: binding.planningExpectationRef,
  }) || sameDomainRef(
    binding.planningExpectationRef,
    binding.canonicalTranscriptRef,
  )) {
    throw new Error(
      'Canonical Caption transcript expectation binding is invalid.',
    )
  }
  return freeze(binding)
}

export function createCanonicalCaptionTranscriptEvidenceRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalCaptionTranscriptEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const readRecord = async (request: {
    canonicalReadScope: CaptionCanonicalTranscriptReadScope
    canonicalTranscriptRef: CaptionDomainRef
    authenticatedReadBindingRef: CaptionDomainRef
  }): Promise<CanonicalCaptionTranscriptAuthenticatedEvidenceRecord | null> => {
    const normalized = parseReadRequest(request)
    const body = await input.objectPort.readExact(recordPath(prefix, normalized))
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAX_RECORD_BYTES) {
      throw new Error('Canonical Caption transcript record bytes are invalid.')
    }
    const text = body.toString('utf8')
    let untrusted: unknown
    try {
      untrusted = JSON.parse(text)
    } catch {
      throw new Error('Canonical Caption transcript record JSON is invalid.')
    }
    const record = parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord(
      untrusted)
    if (text !== stableAuthorityStringify(record)
      || stableAuthorityStringify(record.canonicalReadScope)
        !== stableAuthorityStringify(normalized.canonicalReadScope)
      || !sameDomainRef(domainTranscriptRef(record.canonicalTranscript),
        normalized.canonicalTranscriptRef)
      || !sameDomainRef(domainBindingRef(record.authenticatedReadBinding),
        normalized.authenticatedReadBindingRef)) {
      throw new Error('Canonical Caption transcript reread crossed authority.')
    }
    return record
  }
  const findRecordForExecution = async (request: {
    canonicalReadScope: CaptionCanonicalTranscriptReadScope
    canonicalTranscriptRef: CaptionDomainRef
  }): Promise<CanonicalCaptionTranscriptAuthenticatedEvidenceRecord | null> => {
    const canonicalReadScope = readScopeSchema.parse(request.canonicalReadScope)
    const canonicalTranscriptRef = domainRefSchema.parse(
      request.canonicalTranscriptRef)
    const lookup = freeze({ canonicalReadScope, canonicalTranscriptRef })
    assertClosedContractTree(
      lookup, 'Canonical Caption transcript execution lookup')
    rejectUnsafeText(lookup, 'Canonical Caption transcript execution lookup')
    const body = await input.objectPort.readExact(scopeIndexPath(prefix, lookup))
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAX_RECORD_BYTES) {
      throw new Error('Canonical Caption transcript scope index bytes are invalid.')
    }
    const text = body.toString('utf8')
    let untrusted: unknown
    try {
      untrusted = JSON.parse(text)
    } catch {
      throw new Error('Canonical Caption transcript scope index JSON is invalid.')
    }
    assertClosedContractTree(
      untrusted, 'Canonical Caption transcript scope index')
    rejectUnsafeText(untrusted, 'Canonical Caption transcript scope index')
    const index = scopeIndexSchema.parse(untrusted)
    if (text !== stableAuthorityStringify(index)
      || index.indexDigestSha256 !== contractDigest(
        index as unknown as Record<string, unknown>, 'indexDigestSha256')
      || stableAuthorityStringify(index.canonicalReadScope)
        !== stableAuthorityStringify(canonicalReadScope)
      || !sameDomainRef(index.canonicalTranscriptRef, canonicalTranscriptRef)) {
      throw new Error('Canonical Caption transcript scope index is invalid.')
    }
    const record = await readRecord({
      canonicalReadScope,
      canonicalTranscriptRef,
      authenticatedReadBindingRef: index.authenticatedReadBindingRef,
    })
    if (!record || record.recordDigestSha256 !== index.recordDigestSha256) {
      throw new Error(
        'Canonical Caption transcript scope index did not resolve its exact record.',
      )
    }
    return record
  }
  const findRecordForPlanningExpectation = async (request: {
    canonicalReadScope: CaptionCanonicalTranscriptReadScope
    planningExpectationRef: CaptionDomainRef
  }) => {
    const canonicalReadScope = readScopeSchema.parse(request.canonicalReadScope)
    const planningExpectationRef = domainRefSchema.parse(
      request.planningExpectationRef)
    const lookup = freeze({ canonicalReadScope, planningExpectationRef })
    assertClosedContractTree(
      lookup, 'Canonical Caption transcript expectation lookup')
    rejectUnsafeText(lookup, 'Canonical Caption transcript expectation lookup')
    const body = await input.objectPort.readExact(
      expectationBindingPath(prefix, lookup))
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAX_RECORD_BYTES) {
      throw new Error(
        'Canonical Caption transcript expectation binding bytes are invalid.')
    }
    const text = body.toString('utf8')
    let untrusted: unknown
    try {
      untrusted = JSON.parse(text)
    } catch {
      throw new Error(
        'Canonical Caption transcript expectation binding JSON is invalid.')
    }
    const binding =
      parseCanonicalCaptionTranscriptPlanningExpectationBinding(untrusted)
    if (text !== stableAuthorityStringify(binding)
      || stableAuthorityStringify(binding.canonicalReadScope) !==
        stableAuthorityStringify(canonicalReadScope)
      || !sameDomainRef(
        binding.planningExpectationRef, planningExpectationRef)) {
      throw new Error(
        'Canonical Caption transcript expectation binding crossed authority.')
    }
    const transcriptRecord = await readRecord({
      canonicalReadScope,
      canonicalTranscriptRef: binding.canonicalTranscriptRef,
      authenticatedReadBindingRef: binding.authenticatedReadBindingRef,
    })
    if (!transcriptRecord
      || transcriptRecord.recordDigestSha256 !==
        binding.authenticatedTranscriptRecordDigestSha256
      || transcriptRecord.sourceScopeDigestSha256 !==
        binding.sourceScopeDigestSha256) {
      throw new Error(
        'Canonical Caption transcript expectation did not resolve its exact record.',
      )
    }
    return freeze({ binding, transcriptRecord })
  }
  const repository: CanonicalCaptionTranscriptEvidenceRepository = {
    schemaVersion:
      CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_READ_PORT_VERSION,
    repositoryVersion:
      CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_CURRENT_VERSION,
    async persistCreateOnly({ record: value }) {
      const record =
        parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord(value)
      const request = recordReadRequest(record)
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      if (body.byteLength > MAX_RECORD_BYTES) {
        throw new Error('Canonical Caption transcript record is too large.')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, request),
        body,
        contentSha256: rawBufferDigest(body),
      })
      const reread = await readRecord(request)
      if (!reread || reread.recordDigestSha256 !== record.recordDigestSha256) {
        throw new Error('Canonical Caption transcript create-only reread failed.')
      }
      const indexWithoutDigest: Omit<
        CanonicalCaptionTranscriptScopeIndex,
        'indexDigestSha256'
      > = {
        schemaVersion: CANONICAL_CAPTION_TRANSCRIPT_SCOPE_INDEX_VERSION,
        canonicalReadScope: record.canonicalReadScope,
        canonicalTranscriptRef: domainTranscriptRef(
          record.canonicalTranscript),
        authenticatedReadBindingRef: domainBindingRef(
          record.authenticatedReadBinding),
        recordDigestSha256: record.recordDigestSha256,
      }
      const index = scopeIndexSchema.parse({
        ...indexWithoutDigest,
        indexDigestSha256: contractDigest({
          ...indexWithoutDigest,
          indexDigestSha256: '',
        }, 'indexDigestSha256'),
      })
      const indexBody = Buffer.from(stableAuthorityStringify(index), 'utf8')
      await input.objectPort.createOnly({
        objectPath: scopeIndexPath(prefix, {
          canonicalReadScope: index.canonicalReadScope,
          canonicalTranscriptRef: index.canonicalTranscriptRef,
        }),
        body: indexBody,
        contentSha256: rawBufferDigest(indexBody),
      })
      const indexedRecord = await findRecordForExecution({
        canonicalReadScope: record.canonicalReadScope,
        canonicalTranscriptRef: domainTranscriptRef(
          record.canonicalTranscript),
      })
      if (!indexedRecord
        || indexedRecord.recordDigestSha256 !== record.recordDigestSha256) {
        throw new Error(
          'Canonical Caption transcript scope index create-only reread failed.',
        )
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    rereadRecord: readRecord,
    findExactForExecution: findRecordForExecution,
    async persistPlanningExpectationBindingCreateOnly({ binding: value }) {
      const binding =
        parseCanonicalCaptionTranscriptPlanningExpectationBinding(value)
      const transcriptRecord = await readRecord({
        canonicalReadScope: binding.canonicalReadScope,
        canonicalTranscriptRef: binding.canonicalTranscriptRef,
        authenticatedReadBindingRef: binding.authenticatedReadBindingRef,
      })
      if (!transcriptRecord
        || transcriptRecord.recordDigestSha256 !==
          binding.authenticatedTranscriptRecordDigestSha256
        || transcriptRecord.sourceScopeDigestSha256 !==
          binding.sourceScopeDigestSha256) {
        throw new Error(
          'Canonical Caption expectation cannot bind an unavailable transcript.',
        )
      }
      const body = Buffer.from(stableAuthorityStringify(binding), 'utf8')
      if (body.byteLength > MAX_RECORD_BYTES) {
        throw new Error(
          'Canonical Caption transcript expectation binding is too large.')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: expectationBindingPath(prefix, {
          canonicalReadScope: binding.canonicalReadScope,
          planningExpectationRef: binding.planningExpectationRef,
        }),
        body,
        contentSha256: rawBufferDigest(body),
      })
      const reread = await findRecordForPlanningExpectation({
        canonicalReadScope: binding.canonicalReadScope,
        planningExpectationRef: binding.planningExpectationRef,
      })
      if (!reread || reread.binding.bindingDigestSha256 !==
        binding.bindingDigestSha256) {
        throw new Error(
          'Canonical Caption transcript expectation create-only reread failed.')
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    findExactForPlanningExpectation: findRecordForPlanningExpectation,
    async readPlanningExpectationExact(request) {
      const result = await findRecordForPlanningExpectation(request)
      return result?.binding ?? null
    },
    async readExact(request) {
      const record = await readRecord(request)
      return record ? freeze({
        canonicalTranscript: record.canonicalTranscript,
        authenticatedReadBinding: record.authenticatedReadBinding,
      }) : null
    },
  }
  const frozenRepository = Object.freeze(repository)
  admittedTranscriptRepositories.add(frozenRepository)
  return frozenRepository
}

export function createCanonicalCaptionTranscriptSupportService(input: {
  readonly approvedSnapshotReadPort: CanonicalCaptionApprovedSnapshotReadPort
  readonly sourceTranscriptReadPort: CanonicalSourceTranscriptOrchestraReadPort
  readonly wordTimingReadPort: CanonicalCaptionSourceWordTimingReadPort
  readonly repository: CanonicalCaptionTranscriptEvidenceRepository
  readonly now?: () => Date
}): CanonicalCaptionTranscriptSupportService {
  assertPorts(input)
  const service: CanonicalCaptionTranscriptSupportService = {
    schemaVersion: CANONICAL_CAPTION_TRANSCRIPT_SUPPORT_SERVICE_VERSION,
    async projectAuthenticatedTranscript(request) {
      return (await projectAuthenticatedTranscriptRecord(input, request)).record
    },
  }
  return Object.freeze(service)
}

export function createCanonicalCaptionTranscriptSupportServiceV2(input: {
  readonly approvedSnapshotReadPort: CanonicalCaptionApprovedSnapshotReadPort
  readonly sourceTranscriptReadPort: CanonicalSourceTranscriptOrchestraReadPort
  readonly wordTimingReadPort: CanonicalCaptionSourceWordTimingReadPort
  readonly repository: CanonicalCaptionTranscriptEvidenceRepository
  readonly now?: () => Date
}): CanonicalCaptionTranscriptSupportServiceV2 {
  assertPorts(input)
  const service: CanonicalCaptionTranscriptSupportServiceV2 = {
    schemaVersion: CANONICAL_CAPTION_TRANSCRIPT_SUPPORT_SERVICE_V2_VERSION,
    async projectAuthenticatedTranscript(request) {
      return (await projectAuthenticatedTranscriptRecord(input, request)).record
    },
    async projectAuthenticatedTranscriptForPlanningExpectation(request) {
      assertClosedContractTree(
        request,
        'Canonical Caption transcript expectation projection request',
      )
      const planningExpectationRef = domainRefSchema.parse(
        request.planningExpectationRef,
      )
      const projected = await projectAuthenticatedTranscriptRecord(input, {
        canonicalReadScope: request.canonicalReadScope,
        sourceScopes: request.sourceScopes,
      })
      if (!sameDomainRef(
        planningExpectationRef,
        projected.planningExpectationRef,
      )) {
        throw new Error(
          'Canonical Caption transcript expectation crossed its exact source-analysis lineage.',
        )
      }
      const transcriptRecord = projected.record
      const canonicalTranscriptRef = domainTranscriptRef(
        transcriptRecord.canonicalTranscript,
      )
      const authenticatedReadBindingRef = domainBindingRef(
        transcriptRecord.authenticatedReadBinding,
      )
      const expectationBinding =
        createCanonicalCaptionTranscriptPlanningExpectationBinding({
          bindingId: planningExpectationBindingId({
            canonicalReadScope: transcriptRecord.canonicalReadScope,
            planningExpectationRef,
          }),
          canonicalReadScope: transcriptRecord.canonicalReadScope,
          planningExpectationRef,
          canonicalTranscriptRef,
          authenticatedReadBindingRef,
          authenticatedTranscriptRecordDigestSha256:
            transcriptRecord.recordDigestSha256,
          sourceScopeDigestSha256:
            transcriptRecord.sourceScopeDigestSha256,
          exactApprovedSnapshotRereadVerified: true,
          exactSourceScopeAndTranscriptLineageVerified: true,
          authenticatedTranscriptPersistedAndReread: true,
          createOnlyPersistedAndReread: true,
          privateArtifact: true,
          byteFreeBinding: true,
          rawChatIncluded: false,
          transcriptTextIncluded: false,
          mediaBytesIncluded: false,
          pathsUrlsOrCredentialsIncluded: false,
          directPeerDispatchPerformed: false,
          providerCallPerformedByBridge: false,
          transcriptRuntimePerformedByBridge: false,
          transcriptMutationAuthorityGrantedToCaption: false,
          timingAuthorityGrantedToCaption: false,
          assetMutationAuthorityGrantedToCaption: false,
          finalQaApprovalGrantedToCaption: false,
          billingAuthorityGrantedToCaption: false,
          publicDeliveryGranted: false,
          productionAuthorityGranted: false,
        })
      await input.repository.persistPlanningExpectationBindingCreateOnly({
        binding: expectationBinding,
      })
      const reread =
        await input.repository.findExactForPlanningExpectation({
          canonicalReadScope: transcriptRecord.canonicalReadScope,
          planningExpectationRef,
        })
      if (!reread
        || reread.binding.bindingDigestSha256 !==
          expectationBinding.bindingDigestSha256
        || reread.transcriptRecord.recordDigestSha256 !==
          transcriptRecord.recordDigestSha256) {
        throw new Error(
          'Canonical Caption transcript expectation binding did not reconcile.',
        )
      }
      return freeze({
        transcriptRecord: reread.transcriptRecord,
        expectationBinding: reread.binding,
      })
    },
  }
  return Object.freeze(service)
}

async function projectAuthenticatedTranscriptRecord(
  input: {
    readonly approvedSnapshotReadPort: CanonicalCaptionApprovedSnapshotReadPort
    readonly sourceTranscriptReadPort: CanonicalSourceTranscriptOrchestraReadPort
    readonly wordTimingReadPort: CanonicalCaptionSourceWordTimingReadPort
    readonly repository: CanonicalCaptionTranscriptEvidenceRepository
    readonly now?: () => Date
  },
  request: {
    readonly canonicalReadScope: CaptionCanonicalTranscriptReadScope
    readonly sourceScopes:
      readonly CanonicalSourceTranscriptOrchestraReadScope[]
  },
): Promise<Readonly<{
  record: CanonicalCaptionTranscriptAuthenticatedEvidenceRecord
  planningExpectationRef: CaptionDomainRef
}>> {
  assertClosedContractTree(
    request,
    'Canonical Caption transcript projection request',
  )
  const canonicalReadScope = readScopeSchema.parse(request.canonicalReadScope)
  const sourceScopes = request.sourceScopes.map(parseSourceScope)
  assertSourceScopes(sourceScopes, canonicalReadScope)
  await assertApprovedSnapshotReread(
    input.approvedSnapshotReadPort,
    canonicalReadScope,
  )
  const wordEvidence: CanonicalCaptionSourceWordTimingEvidence[] = []
  const transcriptProjection: Array<{
    sourceSequenceItemId: string
    transcriptDigestSha256: string
    transcriptCoverageDigestSha256: string
  }> = []
  for (const sourceScope of sourceScopes) {
    const firstResult = await input.sourceTranscriptReadPort.readCompleted(
      sourceScope,
    )
    const secondResult = await input.sourceTranscriptReadPort.readCompleted(
      sourceScope,
    )
    if (!firstResult || !secondResult
      || stableAuthorityStringify(firstResult) !==
        stableAuthorityStringify(secondResult)) {
      throw new Error('Canonical source transcript reread is unavailable.')
    }
    const result = verifyCanonicalVisualIntelligenceSourceTranscriptResult(
      sourceForVerification(sourceScope, firstResult),
      firstResult,
    )
    transcriptProjection.push({
      sourceSequenceItemId: sourceScope.sourceSequenceItemId,
      transcriptDigestSha256: result.transcript.transcriptDigestSha256,
      transcriptCoverageDigestSha256:
        result.transcript.coverage.coverageDigestSha256,
    })
    if (result.transcript.status === 'no_speech') continue
    const evidence = await readWordEvidenceTwice({
      port: input.wordTimingReadPort,
      scope: sourceScope,
      result,
    })
    assertWordEvidenceMatchesSource({ evidence, scope: sourceScope, result })
    wordEvidence.push(evidence)
  }
  if (wordEvidence.length === 0) {
    throw new Error('Caption cannot project a transcript without speech.')
  }
  if (new Set(wordEvidence.map((item) => item.languageCode)).size !== 1
    || new Set(wordEvidence.map((item) =>
      item.speakerDiarizationState)).size !== 1) {
    throw new Error(
      'Caption transcript sources require one language and one complete diarization disposition.',
    )
  }
  const createdAt = (input.now ?? (() => new Date()))().toISOString()
  const record = createAuthenticatedTranscriptRecord({
    canonicalReadScope,
    sourceScopes,
    wordEvidence,
    createdAt,
  })
  await input.repository.persistCreateOnly({ record })
  const reread = await input.repository.rereadRecord(recordReadRequest(record))
  if (!reread || reread.recordDigestSha256 !== record.recordDigestSha256) {
    throw new Error('Canonical Caption transcript record did not reconcile.')
  }
  const projectionDigestSha256 = sha256AuthorityValue(transcriptProjection)
  return freeze({
    record: reread,
    planningExpectationRef: {
      id: `caption-source-transcript.${projectionDigestSha256.slice(0, 48)}`,
      version: 'canonical-source-transcript-planning-evidence-v1',
      contentHash: projectionDigestSha256,
    },
  })
}

function createAuthenticatedTranscriptRecord(input: {
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  sourceScopes: CanonicalSourceTranscriptOrchestraReadScope[]
  wordEvidence: CanonicalCaptionSourceWordTimingEvidence[]
  createdAt: string
}): CanonicalCaptionTranscriptAuthenticatedEvidenceRecord {
  const sourceScopeDigestSha256 = sha256AuthorityValue(input.sourceScopes)
  const evidenceRefs = input.wordEvidence.map(wordEvidenceRef)
  const sourceSpeechEvidenceProjectionRef: CaptionDomainRef = {
    id: `caption.source.speech.${sourceScopeDigestSha256.slice(0, 32)}`,
    version: 'canonical-caption-source-speech-evidence-projection-v1',
    contentHash: sha256AuthorityValue({
      sourceScopeDigestSha256,
      evidenceRefs,
    }),
  }
  const qualification = createAlignmentQualification({
    evidence: input.wordEvidence,
    observedAt: input.createdAt,
  })
  const transcript = createTranscript({
    canonicalReadScope: input.canonicalReadScope,
    sourceSpeechEvidenceProjectionRef,
    qualification,
    evidence: input.wordEvidence,
  })
  const transcriptRef = domainTranscriptRef(transcript)
  const persistenceBasis = {
    canonicalReadScope: input.canonicalReadScope,
    sourceScopeDigestSha256,
    transcriptRef,
    evidenceRefs,
  }
  const persistenceReadReceiptRef: CaptionDomainRef = {
    id: `caption.transcript.persistence.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    version: 'canonical-transcript-authenticated-read-record-v1',
    contentHash: sha256AuthorityValue(persistenceBasis),
  }
  const authenticatedOwnerEvidenceRef: CaptionDomainRef = {
    id: `caption.transcript.owner.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    version: 'canonical-transcript-authenticated-owner-evidence-v1',
    contentHash: sha256AuthorityValue({
      ...persistenceBasis,
      owner: 'canonical_quality_first_source_transcript_router',
    }),
  }
  const diarizationArtifactRefs = uniqueDomainRefs(input.wordEvidence
    .flatMap((evidence) => evidence.diarizationArtifactRef
      ? [evidence.diarizationArtifactRef] : []))
  const bindingWithoutDigest: Omit<
    CaptionCanonicalTranscriptAuthenticatedReadBinding,
    'bindingDigestSha256'
  > = {
    schemaVersion:
      CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
    bindingId: `caption.transcript.binding.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    ownerKey: 'canonical_transcript',
    consumerSkillKey: 'captions',
    artifactType: 'canonical_transcript',
    canonicalReadScope: freeze(input.canonicalReadScope),
    canonicalTranscriptRef: transcriptRef,
    sourceSpeechEvidencePackageRef: sourceSpeechEvidenceProjectionRef,
    alignmentQualificationRef: qualificationRef(qualification),
    diarizationArtifactRefs,
    speakerDiarizationState: diarizationArtifactRefs.length === 0
      ? 'not_present' : 'complete',
    persistenceReadReceiptRef,
    authenticatedOwnerEvidenceRef,
    exactPrivateArtifactRereadVerified: true,
    exactTranscriptDigestRecomputed: true,
    exactTenantScopeVerified: true,
    exactApprovedSnapshotVerified: true,
    exactSourceAndAlignmentLineageVerified: true,
    exactDiarizationLineageVerified: true,
    immutableTranscriptVerified: true,
    singleCanonicalTranscriptVerified: true,
    privateArtifact: true,
    byteFreeBinding: true,
    canonicalTranscriptPayloadEmbedded: false,
    transcriptTextIncluded: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    rawChatIncluded: false,
    credentialsIncluded: false,
    browserLocalCompletionAccepted: false,
    transcriptMutationAuthorityGranted: false,
    timingAuthorityGranted: false,
    runtimeOrDispatchAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const binding =
    parseCaptionCanonicalTranscriptAuthenticatedReadBinding({
      ...bindingWithoutDigest,
      bindingDigestSha256: contractDigest({
        ...bindingWithoutDigest,
        bindingDigestSha256: '',
      }, 'bindingDigestSha256'),
    })
  const withoutDigest: Omit<
    CanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
    'recordDigestSha256'
  > = {
    schemaVersion:
      CANONICAL_CAPTION_TRANSCRIPT_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
    recordId: `caption.transcript.record.${
      transcript.transcriptDigestSha256.slice(0, 32)}`,
    canonicalReadScope: freeze(input.canonicalReadScope),
    sourceScopeDigestSha256,
    sourceSpeechEvidenceProjectionRef,
    sourceWordTimingEvidenceRefs: evidenceRefs,
    alignmentQualification: qualification,
    canonicalTranscript: transcript,
    authenticatedReadBinding: binding,
    createdAt: input.createdAt,
    canonicalSourceTranscriptOwnerRereadVerified: true,
    exactPrivateWordTimingRereadVerified: true,
    exactSourceOrderAndScopeVerified: true,
    exactSegmentAndWordLineageVerified: true,
    exactApprovedSnapshotRereadVerified: true,
    createOnlyPersistedAndReread: true,
    singleCanonicalTranscriptVerified: true,
    privateArtifact: true,
    browserShareable: false,
    rawAudioIncluded: false,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    pathsUrlsOrCredentialsIncluded: false,
    directPeerDispatchPerformed: false,
    providerCallPerformedByBridge: false,
    transcriptRuntimePerformedByBridge: false,
    transcriptMutationAuthorityGrantedToCaption: false,
    timingAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord({
    ...withoutDigest,
    recordDigestSha256: contractDigest({
      ...withoutDigest,
      recordDigestSha256: '',
    }, 'recordDigestSha256'),
  })
}

function createAlignmentQualification(input: {
  evidence: CanonicalCaptionSourceWordTimingEvidence[]
  observedAt: string
}): CaptionAlignmentQualification {
  const evidenceRefs = uniqueDomainRefs(input.evidence.flatMap((item) => [
    wordEvidenceRef(item),
    sourceTranscriptDomainRef(item),
  ]))
  const releaseRef: CaptionDomainRef = {
    id: `caption.faster-whisper.release.${sha256AuthorityValue(
      evidenceRefs).slice(0, 32)}`,
    version: 'canonical-caption-faster-whisper-release-aggregate-v1',
    contentHash: sha256AuthorityValue(evidenceRefs),
  }
  const diarizationComplete = input.evidence.every((item) =>
    item.speakerDiarizationState === 'complete')
  const withoutDigest: Omit<
    CaptionAlignmentQualification,
    'qualificationDigestSha256'
  > = {
    schemaVersion: CAPTION_ALIGNMENT_QUALIFICATION_VERSION,
    qualificationId: `caption.alignment.${
      releaseRef.contentHash.slice(0, 32)}`,
    routes: [{
      routeId: 'faster_whisper',
      status: 'qualified',
      qualifiedUses: ['segment_transcription', 'asr_native_word_timing'],
      releaseRef,
      evidenceRefs,
      blockerCodes: [],
      observedAt: input.observedAt,
    }, {
      routeId: 'whisperx',
      status: 'blocked',
      qualifiedUses: [],
      releaseRef: null,
      evidenceRefs: [],
      blockerCodes: ['no_canonical_whisperx_evidence'],
      observedAt: input.observedAt,
    }, {
      routeId: 'pyannote',
      status: diarizationComplete ? 'qualified' : 'blocked',
      qualifiedUses: diarizationComplete ? ['speaker_diarization'] : [],
      releaseRef: diarizationComplete ? {
        id: `caption.diarization.release.${
          releaseRef.contentHash.slice(0, 32)}`,
        version: 'canonical-caption-diarization-release-aggregate-v1',
        contentHash: sha256AuthorityValue(input.evidence.map((item) =>
          item.diarizationArtifactRef)),
      } : null,
      evidenceRefs: diarizationComplete
        ? uniqueDomainRefs(input.evidence.map((item) =>
          item.diarizationArtifactRef!)) : [],
      blockerCodes: diarizationComplete
        ? [] : ['no_canonical_diarization_evidence'],
      observedAt: input.observedAt,
    }],
    productionQualificationClaimed: false,
  }
  return parseCaptionAlignmentQualification({
    ...withoutDigest,
    qualificationDigestSha256: contractDigest({
      ...withoutDigest,
      qualificationDigestSha256: '',
    }, 'qualificationDigestSha256'),
  })
}

function createTranscript(input: {
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  sourceSpeechEvidenceProjectionRef: CaptionDomainRef
  qualification: CaptionAlignmentQualification
  evidence: CanonicalCaptionSourceWordTimingEvidence[]
}): CaptionCanonicalTranscript {
  const segments: CaptionCanonicalTranscript['segments'] = []
  const words: CaptionCanonicalTranscript['words'] = []
  for (const evidence of input.evidence) {
    const sourceKey = sha256AuthorityValue({
      sourceSequenceItemId: evidence.sourceSequenceItemId,
      wordTimingArtifactRef: evidence.wordTimingArtifactRef,
    }).slice(0, 20)
    for (const segment of evidence.segments) {
      const sourceSegmentId = `caption.segment.${sourceKey}.${segment.order}`
      const sourceRecordRef = wordEvidenceRef(evidence)
      const exactSourceWordIds: string[] = []
      for (const word of segment.words) {
        const sourceWordId = `caption.word.${sourceKey}.${segment.order}.${
          word.orderInSegment}`
        exactSourceWordIds.push(sourceWordId)
        words.push({
          sourceWordId,
          sourceSegmentId,
          sourceSequenceItemId: evidence.sourceSequenceItemId,
          orderInSegment: word.orderInSegment,
          text: word.text,
          startMilliseconds: word.startMilliseconds,
          endMillisecondsExclusive: word.endMillisecondsExclusive,
          confidenceBasisPoints: word.confidenceBasisPoints,
          timestampProvenance: 'asr_native',
          wordTimingArtifactRef: freeze(evidence.wordTimingArtifactRef),
          timestampEvidenceRef: sourceRecordRef,
          speakerId: word.speakerId,
          diarizationArtifactRef: evidence.diarizationArtifactRef,
        })
      }
      segments.push({
        sourceSegmentId,
        sourceSequenceItemId: evidence.sourceSequenceItemId,
        order: segments.length + 1,
        startMilliseconds: segment.startMilliseconds,
        endMillisecondsExclusive: segment.endMillisecondsExclusive,
        text: segment.text,
        confidenceBasisPoints: segment.confidenceBasisPoints,
        exactSourceWordIds,
        sourceRecordRef,
      })
    }
  }
  const transcriptIdentity = sha256AuthorityValue({
    canonicalReadScope: input.canonicalReadScope,
    sourceSpeechEvidenceProjectionRef: input.sourceSpeechEvidenceProjectionRef,
    segments,
    words,
  })
  const withoutDigest: Omit<
    CaptionCanonicalTranscript,
    'transcriptDigestSha256'
  > = {
    schemaVersion: CAPTION_CANONICAL_TRANSCRIPT_VERSION,
    transcriptId: `caption.transcript.${transcriptIdentity.slice(0, 32)}`,
    workspaceId: input.canonicalReadScope.workspaceId,
    projectId: input.canonicalReadScope.projectId,
    editSessionId: input.canonicalReadScope.editSessionId,
    languageCode: input.evidence[0]!.languageCode,
    sourceSpeechEvidencePackageRef:
      freeze(input.sourceSpeechEvidenceProjectionRef),
    alignmentQualificationRef: qualificationRef(input.qualification),
    segments,
    words,
    immutable: true,
    singleCanonicalTranscript: true,
    rawChatIncluded: false,
    browserShareable: false,
    privateArtifact: true,
    timingAuthorityClaimed: false,
  }
  return parseCaptionCanonicalTranscript({
    ...withoutDigest,
    transcriptDigestSha256: contractDigest({
      ...withoutDigest,
      transcriptDigestSha256: '',
    }, 'transcriptDigestSha256'),
  })
}

async function readWordEvidenceTwice(input: {
  port: CanonicalCaptionSourceWordTimingReadPort
  scope: CanonicalSourceTranscriptOrchestraReadScope
  result: CanonicalVisualIntelligenceSourceTranscriptResult
}): Promise<CanonicalCaptionSourceWordTimingEvidence> {
  const request = freeze({
    scope: input.scope,
    transcriptAuthorityRef: input.result.transcriptAuthorityRef,
  })
  const first = parseCanonicalCaptionSourceWordTimingEvidence(
    await input.port.readExact(request))
  const second = parseCanonicalCaptionSourceWordTimingEvidence(
    await input.port.readExact(request))
  if (stableAuthorityStringify(first) !== stableAuthorityStringify(second)) {
    throw new Error('Canonical Caption word-timing reread raced.')
  }
  return first
}

function assertWordEvidenceMatchesSource(input: {
  evidence: CanonicalCaptionSourceWordTimingEvidence
  scope: CanonicalSourceTranscriptOrchestraReadScope
  result: CanonicalVisualIntelligenceSourceTranscriptResult
}): void {
  const evidence = input.evidence
  const scope = input.scope
  const transcript = input.result.transcript
  if (
    evidence.ownerUserId !== scope.ownerUserId
    || evidence.workspaceId !== scope.workspaceId
    || evidence.projectId !== scope.projectId
    || evidence.editSessionId !== scope.editSessionId
    || evidence.analysisRunId !== scope.analysisRunId
    || evidence.sourceSequenceItemId !== scope.sourceSequenceItemId
    || evidence.mediaAssetId !== scope.mediaAssetId
    || evidence.uploadedOrder !== scope.uploadedOrder
    || evidence.sourceChecksumSha256 !== scope.checksumSha256
    || evidence.durationFrames !== scope.durationFrames
    || evidence.fpsNumerator !== scope.sourceFrameAuthority.fpsNumerator
    || evidence.fpsDenominator !== scope.sourceFrameAuthority.fpsDenominator
    || evidence.sourceScopeDigestSha256 !== sha256AuthorityValue(scope)
    || stableAuthorityStringify(evidence.sourceTranscriptAuthorityRef) !==
      stableAuthorityStringify(input.result.transcriptAuthorityRef)
    || evidence.sourceTranscriptDigestSha256 !==
      transcript.transcriptDigestSha256
    || transcript.status !== 'completed'
    || evidence.segments.length !== transcript.segments.length
  ) throw new Error('Canonical Caption word timing crossed source authority.')
  for (const [index, segment] of evidence.segments.entries()) {
    const expected = transcript.segments[index]
    if (!expected
      || segment.sourceTranscriptSegmentId !== expected.segmentId
      || segment.order !== index + 1
      || segment.startFrame !== expected.startFrame
      || segment.endFrameExclusive !== expected.endFrameExclusive
      || segment.text !== expected.text
      || segment.confidenceBasisPoints !== expected.confidenceBasisPoints
      || !expected.wordsVerified) {
      throw new Error('Canonical Caption segment lineage is inconsistent.')
    }
  }
}

function assertWordEvidenceSemantics(
  evidence: CanonicalCaptionSourceWordTimingEvidence,
): void {
  if (evidence.sourceScopeDigestSha256.length !== 64
    || evidence.segments.length === 0) {
    throw new Error('Canonical Caption word evidence scope is invalid.')
  }
  const segmentIds = new Set<string>()
  const diarizationComplete = evidence.speakerDiarizationState === 'complete'
  if (diarizationComplete !== (evidence.diarizationArtifactRef !== null)) {
    throw new Error('Canonical Caption diarization evidence is inconsistent.')
  }
  let priorSegmentEnd = 0
  for (const [index, segment] of evidence.segments.entries()) {
    if (segment.order !== index + 1
      || segmentIds.has(segment.sourceTranscriptSegmentId)
      || segment.startFrame < priorSegmentEnd
      || segment.endFrameExclusive <= segment.startFrame
      || segment.startMilliseconds !== frameStartMilliseconds(
        segment.startFrame,
        evidence.fpsNumerator,
        evidence.fpsDenominator)
      || segment.endMillisecondsExclusive !== frameEndMilliseconds(
        segment.endFrameExclusive,
        evidence.fpsNumerator,
        evidence.fpsDenominator)) {
      throw new Error('Canonical Caption word evidence segment is invalid.')
    }
    segmentIds.add(segment.sourceTranscriptSegmentId)
    priorSegmentEnd = segment.endFrameExclusive
    let priorWordEnd = segment.startMilliseconds
    for (const [wordIndex, word] of segment.words.entries()) {
      if (word.orderInSegment !== wordIndex + 1
        || word.startMilliseconds < priorWordEnd
        || word.endMillisecondsExclusive <= word.startMilliseconds
        || word.startMilliseconds < segment.startMilliseconds
        || word.endMillisecondsExclusive > segment.endMillisecondsExclusive
        || diarizationComplete !== (word.speakerId !== null)) {
        throw new Error('Canonical Caption word timing is invalid.')
      }
      priorWordEnd = word.endMillisecondsExclusive
    }
  }
  const language = evidence.languageCode.toLowerCase()
  if (!language) throw new Error('Canonical Caption transcript language missing.')
}

function assertSourceScopes(
  scopes: CanonicalSourceTranscriptOrchestraReadScope[],
  readScope: CaptionCanonicalTranscriptReadScope,
): void {
  if (scopes.length === 0 || scopes.length > 8) {
    throw new Error('Caption source transcript scope count is invalid.')
  }
  const sourceIds = new Set<string>()
  const assetIds = new Set<string>()
  for (const [index, scope] of scopes.entries()) {
    if (scope.uploadedOrder !== index + 1
      || scope.ownerUserId !== readScope.ownerUserId
      || scope.workspaceId !== readScope.workspaceId
      || scope.projectId !== readScope.projectId
      || scope.editSessionId !== readScope.editSessionId
      || sourceIds.has(scope.sourceSequenceItemId)
      || assetIds.has(scope.mediaAssetId)) {
      throw new Error('Caption source transcript scopes are stale or unordered.')
    }
    sourceIds.add(scope.sourceSequenceItemId)
    assetIds.add(scope.mediaAssetId)
  }
}

async function assertApprovedSnapshotReread(
  port: CanonicalCaptionApprovedSnapshotReadPort,
  scope: CaptionCanonicalTranscriptReadScope,
): Promise<void> {
  const first = await port.readExact(scope)
  const second = await port.readExact(scope)
  if (!first || !second
    || stableAuthorityStringify(first) !== stableAuthorityStringify(scope)
    || stableAuthorityStringify(second) !== stableAuthorityStringify(scope)) {
    throw new Error('Canonical Caption approved snapshot reread failed.')
  }
}

function assertPorts(input: {
  approvedSnapshotReadPort: CanonicalCaptionApprovedSnapshotReadPort
  sourceTranscriptReadPort: CanonicalSourceTranscriptOrchestraReadPort
  wordTimingReadPort: CanonicalCaptionSourceWordTimingReadPort
  repository: CanonicalCaptionTranscriptEvidenceRepository
}): void {
  assertCanonicalCaptionApprovedSnapshotReadPort(
    input.approvedSnapshotReadPort,
  )
  assertCanonicalCaptionTranscriptEvidenceRepository(input.repository)
  if (!admittedWordReaders.has(input.wordTimingReadPort)
    || input.wordTimingReadPort.schemaVersion !==
      CANONICAL_CAPTION_SOURCE_WORD_TIMING_READ_PORT_VERSION
    || input.sourceTranscriptReadPort?.schemaVersion !==
      CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION
    || typeof input.sourceTranscriptReadPort.readCompleted !== 'function'
  ) {
    throw new Error('Canonical Caption transcript support ports are invalid.')
  }
}

function parseSourceScope(
  value: CanonicalSourceTranscriptOrchestraReadScope,
): CanonicalSourceTranscriptOrchestraReadScope {
  assertClosedContractTree(value, 'Canonical Caption source transcript scope')
  rejectUnsafeText(value, 'Canonical Caption source transcript scope')
  if (!value || typeof value !== 'object'
    || !safeKey.safeParse(value.ownerUserId).success
    || !safeKey.safeParse(value.workspaceId).success
    || !safeKey.safeParse(value.projectId).success
    || !safeKey.safeParse(value.editSessionId).success
    || !safeKey.safeParse(value.analysisRunId).success
    || !safeKey.safeParse(value.sourceSequenceItemId).success
    || !safeKey.safeParse(value.mediaAssetId).success
    || !Number.isInteger(value.uploadedOrder) || value.uploadedOrder < 1
    || value.uploadedOrder > 8
    || !rawSha256.safeParse(value.checksumSha256).success
    || !Number.isSafeInteger(value.byteLength) || value.byteLength <= 0
    || !Number.isSafeInteger(value.durationFrames) || value.durationFrames <= 0
    || value.sourceFrameAuthority.frameCount !== value.durationFrames
    || stableAuthorityStringify(createCanonicalSourceLedSourceFrameAuthority({
      fpsNumerator: value.sourceFrameAuthority.fpsNumerator,
      fpsDenominator: value.sourceFrameAuthority.fpsDenominator,
      frameCount: value.sourceFrameAuthority.frameCount,
      timeBaseNumerator: value.sourceFrameAuthority.timeBaseNumerator,
      timeBaseDenominator: value.sourceFrameAuthority.timeBaseDenominator,
    })) !== stableAuthorityStringify(value.sourceFrameAuthority)
    || !visualRefSchema.safeParse(value.finalizedMediaAuthorityRef).success
    || !visualRefSchema.safeParse(value.sourceProbeAuthorityRef).success
    || stableAuthorityStringify(value.finalizedMediaAuthorityRef) ===
      stableAuthorityStringify(value.sourceProbeAuthorityRef)) {
    throw new Error('Canonical Caption source transcript scope is invalid.')
  }
  return freeze(value)
}

function sourceForVerification(
  scope: CanonicalSourceTranscriptOrchestraReadScope,
  result: CanonicalVisualIntelligenceSourceTranscriptResult,
) {
  return {
    sourceSequenceItemId: scope.sourceSequenceItemId,
    mediaAssetId: scope.mediaAssetId,
    uploadedOrder: scope.uploadedOrder,
    checksumSha256: scope.checksumSha256,
    byteLength: scope.byteLength,
    durationFrames: scope.durationFrames,
    managedApiAuthority: {
      ownerUserId: scope.ownerUserId,
      hasAudio: result.transcript.status === 'completed',
      fpsNumerator: scope.sourceFrameAuthority.fpsNumerator,
      fpsDenominator: scope.sourceFrameAuthority.fpsDenominator,
      frameCount: scope.sourceFrameAuthority.frameCount,
      sourceTimeBaseNumerator:
        scope.sourceFrameAuthority.timeBaseNumerator,
      sourceTimeBaseDenominator:
        scope.sourceFrameAuthority.timeBaseDenominator,
      finalizedMediaAuthorityRef: scope.finalizedMediaAuthorityRef,
      sourceProbeAuthorityRef: scope.sourceProbeAuthorityRef,
    },
  } as unknown as Parameters<
    typeof verifyCanonicalVisualIntelligenceSourceTranscriptResult
  >[0]
}

function parseReadRequest(input: {
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  canonicalTranscriptRef: CaptionDomainRef
  authenticatedReadBindingRef: CaptionDomainRef
}) {
  assertClosedContractTree(input, 'Canonical Caption transcript read request')
  rejectUnsafeText(input, 'Canonical Caption transcript read request')
  return freeze({
    canonicalReadScope: readScopeSchema.parse(input.canonicalReadScope),
    canonicalTranscriptRef: domainRefSchema.parse(input.canonicalTranscriptRef),
    authenticatedReadBindingRef:
      domainRefSchema.parse(input.authenticatedReadBindingRef),
  })
}

function recordReadRequest(
  record: CanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
) {
  return {
    canonicalReadScope: record.canonicalReadScope,
    canonicalTranscriptRef: domainTranscriptRef(record.canonicalTranscript),
    authenticatedReadBindingRef:
      domainBindingRef(record.authenticatedReadBinding),
  }
}

function recordPath(
  prefix: string,
  request: ReturnType<typeof parseReadRequest>,
): string {
  return `${prefix}/${sha256AuthorityValue(request)}.json`
}

function scopeIndexPath(
  prefix: string,
  lookup: {
    canonicalReadScope: CaptionCanonicalTranscriptReadScope
    canonicalTranscriptRef: CaptionDomainRef
  },
): string {
  return `${prefix}/by-scope/${sha256AuthorityValue(lookup)}.json`
}

function expectationBindingPath(
  prefix: string,
  lookup: {
    canonicalReadScope: CaptionCanonicalTranscriptReadScope
    planningExpectationRef: CaptionDomainRef
  },
): string {
  return `${prefix}/by-planning-expectation/${
    sha256AuthorityValue(lookup)}.json`
}

function planningExpectationBindingId(input: {
  canonicalReadScope: CaptionCanonicalTranscriptReadScope
  planningExpectationRef: CaptionDomainRef
}): string {
  return `caption.transcript.expectation.${
    sha256AuthorityValue(input).slice(0, 32)}`
}

function domainTranscriptRef(
  transcript: CaptionCanonicalTranscript,
): CaptionDomainRef {
  return {
    id: transcript.transcriptId,
    version: transcript.schemaVersion,
    contentHash: transcript.transcriptDigestSha256,
  }
}

function domainBindingRef(
  binding: CaptionCanonicalTranscriptAuthenticatedReadBinding,
): CaptionDomainRef {
  return {
    id: binding.bindingId,
    version: binding.schemaVersion,
    contentHash: binding.bindingDigestSha256,
  }
}

function qualificationRef(
  qualification: CaptionAlignmentQualification,
): CaptionDomainRef {
  return {
    id: qualification.qualificationId,
    version: qualification.schemaVersion,
    contentHash: qualification.qualificationDigestSha256,
  }
}

function wordEvidenceRef(
  evidence: CanonicalCaptionSourceWordTimingEvidence,
): CaptionDomainRef {
  return {
    id: evidence.evidenceId,
    version: evidence.schemaVersion,
    contentHash: evidence.evidenceDigestSha256,
  }
}

function sourceTranscriptDomainRef(
  evidence: CanonicalCaptionSourceWordTimingEvidence,
): CaptionDomainRef {
  return {
    id: evidence.sourceTranscriptAuthorityRef.id,
    version: 'canonical-source-transcript-authority-v1',
    contentHash: evidence.sourceTranscriptAuthorityRef.contentHash.slice(7),
  }
}

function uniqueDomainRefs(refs: CaptionDomainRef[]): CaptionDomainRef[] {
  return [...new Map(refs.map((ref) => [domainRefKey(ref), freeze(ref)]))
    .entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([, ref]) => ref)
}

function domainRefKey(ref: CaptionDomainRef): string {
  return `${ref.id}|${ref.version}|${ref.contentHash}`
}

function sameDomainRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return domainRefKey(left) === domainRefKey(right)
}

function frameStartMilliseconds(
  frame: number,
  numerator: number,
  denominator: number,
): number {
  return Math.floor(frame * 1_000 * denominator / numerator)
}

function frameEndMilliseconds(
  frameExclusive: number,
  numerator: number,
  denominator: number,
): number {
  return Math.ceil(frameExclusive * 1_000 * denominator / numerator)
}

function contractDigest(
  value: Record<string, unknown>,
  field: string,
): string {
  return calculateSkillContractDigest(value, field)
}

function rawBufferDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.length > 600
    || normalized.includes('..') || normalized.includes('\\')
    || normalized.includes('//')
    || normalized.split('/').some((part) =>
      !safeKey.safeParse(part).success)) {
    throw new Error('Canonical Caption transcript repository prefix is invalid.')
  }
  return normalized
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new Error('Canonical Caption transcript object port is invalid.')
  }
}

function rejectUnsafeText(value: unknown, label: string): void {
  const stack = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string' && unsafeTextPattern.test(current)) {
      throw new Error(`${label} contains path, URL, or credential-shaped text.`)
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}

function hasUnsafeControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 8 || codePoint === 11 || codePoint === 12
      || (codePoint >= 14 && codePoint <= 31) || codePoint === 127
  })
}

function freeze<T>(value: T): T {
  return Object.freeze(structuredClone(value))
}
