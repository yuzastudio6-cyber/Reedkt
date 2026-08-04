import { z } from 'zod'

import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_SOURCE_SPEECH_EVIDENCE_VERSION =
  'canonical-source-speech-evidence-package-v1' as const
export const CANONICAL_SOURCE_SPEECH_EVIDENCE_LOCATOR_VERSION =
  'canonical-source-speech-evidence-locator-v1' as const
export const CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_LOCATOR_VERSION =
  'canonical-source-speech-evidence-capture-locator-v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeLanguageSchema = z.string().trim().min(2).max(24)
  .regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/u)
const safeTextSchema = z.string().trim().min(1).max(1_200)
  .refine((value) => !containsDisallowedControlCharacter(value))
  .refine((value) => !/(?:https?:\/\/|file:\/\/|gs:\/\/|s3:\/\/)/iu.test(value))
  .refine((value) => !/(?:api[_-]?key|authorization:\s*bearer|private[_-]?key|secret[_-]?key)/iu.test(value))
const safeModelNameSchema = z.string().trim().min(1).max(240)
  .refine((value) => !containsDisallowedControlCharacter(value))
  .refine((value) => !/(?:https?:\/\/|file:\/\/|gs:\/\/|s3:\/\/)/iu.test(value))
  .refine((value) => !/(?:api[_-]?key|authorization:\s*bearer|private[_-]?key|secret[_-]?key)/iu.test(value))

const sourceAudioArtifactIdentitySchema = z.object({
  artifactId: safeIdentitySchema,
  contentSha256: digestSchema,
  contentType: z.enum(['audio/wav', 'audio/flac']),
  byteLength: z.number().int().positive().max(4 * 1024 * 1024 * 1024),
}).strict()

const jsonArtifactIdentitySchema = z.object({
  artifactId: safeIdentitySchema,
  contentSha256: digestSchema,
  contentType: z.literal('application/json'),
  byteLength: z.number().int().positive().max(256 * 1024 * 1024),
}).strict()

const transcriptSegmentDraftSchema = z.object({
  segmentId: safeIdentitySchema,
  order: z.number().int().positive().max(20_000),
  startMilliseconds: z.number().int().nonnegative().max(24 * 60 * 60 * 1_000),
  endMillisecondsExclusive: z.number().int().positive().max(24 * 60 * 60 * 1_000),
  text: safeTextSchema,
  confidenceBasisPoints: z.number().int().min(6_000).max(10_000),
}).strict()

const gpuTranscriptionRuntimeSchema = z.object({
  toolId: z.literal('faster_whisper'),
  modelWeightManifestId: safeIdentitySchema,
  modelName: safeModelNameSchema,
  modelRevisionSha256: digestSchema,
  executionPlacement: z.literal('google_cloud_run_gpu'),
  device: z.literal('cuda'),
  cpuFallbackUsed: z.literal(false),
  modelDownloadDuringRun: z.literal(false),
  customerCreditReservationUsed: z.literal(false),
  internalAnalysisBudgetAuthorityDigestSha256: digestSchema,
  executionEvidenceDigestSha256: digestSchema,
}).strict()

const transcriptQaSchema = z.object({
  status: z.literal('passed'),
  transcriptAlignmentPassed: z.literal(true),
  humanReviewRequired: z.literal(false),
  blockingIssueCount: z.literal(0),
  qaEvidenceDigestSha256: digestSchema,
}).strict()

const transcriptProjectionPolicySchema = z.object({
  projectionClass: z.literal(
    'bounded_redacted_untrusted_source_transcript',
  ),
  sourceInstructionAuthority: z.literal(false),
  rawTranscriptIncluded: z.literal(false),
  sensitiveValueRedactionApplied: z.literal(true),
  browserShareable: z.literal(false),
}).strict()

export const canonicalSourceSpeechEvidenceRecordDraftSchema = z.object({
  sourceSequenceItemId: safeIdentitySchema,
  mediaAssetId: safeIdentitySchema,
  uploadedOrder: z.number().int().positive().max(10_000),
  sourceChecksumSha256: digestSchema,
  evidenceStatus: z.enum(['verified_speech', 'verified_no_speech']),
  sourceAudioArtifact: sourceAudioArtifactIdentitySchema,
  sourceAudioExtractionEvidenceDigestSha256: digestSchema,
  transcriptArtifact: jsonArtifactIdentitySchema.nullable(),
  wordTimestampArtifact: jsonArtifactIdentitySchema.nullable(),
  transcriptionRuntime: gpuTranscriptionRuntimeSchema.nullable(),
  transcriptQa: transcriptQaSchema,
  transcriptProjectionPolicy: transcriptProjectionPolicySchema.nullable(),
  speechAbsenceEvidenceDigestSha256: digestSchema.nullable(),
  languageCode: safeLanguageSchema.nullable(),
  coverageStartMilliseconds: z.literal(0),
  coverageEndMillisecondsExclusive: z.number().int().positive().max(24 * 60 * 60 * 1_000),
  confidenceBasisPoints: z.number().int().min(6_000).max(10_000),
  segments: z.array(transcriptSegmentDraftSchema).max(20_000),
}).strict()

export const canonicalSourceSpeechEvidenceRecordSchema =
  canonicalSourceSpeechEvidenceRecordDraftSchema.extend({
    recordDigestSha256: digestSchema,
  }).strict()

export const CANONICAL_SOURCE_SPEECH_EVIDENCE_AUTHORITY_BOUNDARY =
  Object.freeze({
    sourceSpeechEvidenceOnly: true as const,
    privateTranscriptEvidence: true as const,
    browserPayloadAuthority: false as const,
    rawMediaAuthority: false as const,
    selectedSceneAuthority: false as const,
    planningAuthority: false as const,
    timingAuthority: false as const,
    soundAuthority: false as const,
    estimateAuthority: false as const,
    customerPriceAuthority: false as const,
    customerCreditAuthority: false as const,
    creditReservationAuthority: false as const,
    approvalAuthority: false as const,
    snapshotAuthority: false as const,
    workGraphAuthority: false as const,
    queueAuthority: false as const,
    providerAuthority: false as const,
    toolRouteAuthority: false as const,
    renderAuthority: false as const,
    runtimeAuthority: false as const,
    productionReady: false as const,
  })

const authorityBoundarySchema = z.object({
  sourceSpeechEvidenceOnly: z.literal(true),
  privateTranscriptEvidence: z.literal(true),
  browserPayloadAuthority: z.literal(false),
  rawMediaAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  planningAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  creditReservationAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRouteAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export const canonicalSourceSpeechEvidencePackageDraftSchema = z.object({
  contractVersion: z.literal(CANONICAL_SOURCE_SPEECH_EVIDENCE_VERSION),
  evidenceClass: z.literal('private_workflow_neutral_source_speech_evidence'),
  status: z.enum([
    'available_for_preapproval_reasoning',
    'not_applicable_idea_first',
  ]),
  sourceMode: z.enum(['uploaded_media', 'idea_first_no_uploaded_media']),
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  sourceSequenceDigestSha256: digestSchema,
  evidenceSnapshotId: safeIdentitySchema,
  evidenceRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  ideaFirstAuthorityDigestSha256: digestSchema.nullable(),
  evidenceRecords: z.array(canonicalSourceSpeechEvidenceRecordSchema).max(10_000),
  evidenceRecordCount: z.number().int().nonnegative().max(10_000),
  evidenceSetDigestSha256: digestSchema,
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const canonicalSourceSpeechEvidencePackageSchema =
  canonicalSourceSpeechEvidencePackageDraftSchema.extend({
    contractDigestSha256: digestSchema,
  }).strict()

export const canonicalSourceSpeechEvidenceLocatorSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SOURCE_SPEECH_EVIDENCE_LOCATOR_VERSION),
  serverOwnedLocatorId: safeIdentitySchema,
}).strict()

export const canonicalSourceSpeechEvidenceCaptureLocatorSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_LOCATOR_VERSION,
  ),
  serverOwnedLocatorId: safeIdentitySchema.nullable(),
}).strict()

export type CanonicalSourceSpeechEvidenceRecordDraft = z.infer<
  typeof canonicalSourceSpeechEvidenceRecordDraftSchema
>
export type CanonicalSourceSpeechEvidenceRecord = z.infer<
  typeof canonicalSourceSpeechEvidenceRecordSchema
>
export type CanonicalSourceSpeechEvidencePackage = z.infer<
  typeof canonicalSourceSpeechEvidencePackageSchema
>
export type CanonicalSourceSpeechEvidenceLocator = z.infer<
  typeof canonicalSourceSpeechEvidenceLocatorSchema
>
export type CanonicalSourceSpeechEvidenceCaptureLocator = z.infer<
  typeof canonicalSourceSpeechEvidenceCaptureLocatorSchema
>

export function createCanonicalSourceSpeechEvidencePackage(input: {
  readonly status:
    | 'available_for_preapproval_reasoning'
    | 'not_applicable_idea_first'
  readonly sourceMode: 'uploaded_media' | 'idea_first_no_uploaded_media'
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly sourceSequenceDigestSha256: string
  readonly evidenceSnapshotId: string
  readonly evidenceRevision: number
  readonly ideaFirstAuthorityDigestSha256: string | null
  readonly evidenceRecords:
    readonly CanonicalSourceSpeechEvidenceRecordDraft[]
}): CanonicalSourceSpeechEvidencePackage {
  const records = input.evidenceRecords.map((record) => {
    const parsed = canonicalSourceSpeechEvidenceRecordDraftSchema.parse(record)
    assertRecordSemantics(parsed)
    return canonicalSourceSpeechEvidenceRecordSchema.parse({
      ...parsed,
      recordDigestSha256: sha256AuthorityValue(parsed),
    })
  })
  const draft = canonicalSourceSpeechEvidencePackageDraftSchema.parse({
    contractVersion: CANONICAL_SOURCE_SPEECH_EVIDENCE_VERSION,
    evidenceClass: 'private_workflow_neutral_source_speech_evidence',
    status: input.status,
    sourceMode: input.sourceMode,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    sourceSequenceDigestSha256: input.sourceSequenceDigestSha256,
    evidenceSnapshotId: input.evidenceSnapshotId,
    evidenceRevision: input.evidenceRevision,
    ideaFirstAuthorityDigestSha256: input.ideaFirstAuthorityDigestSha256,
    evidenceRecords: records,
    evidenceRecordCount: records.length,
    evidenceSetDigestSha256: sha256AuthorityValue(records),
    authorityBoundary: CANONICAL_SOURCE_SPEECH_EVIDENCE_AUTHORITY_BOUNDARY,
  })
  assertPackageSemantics(draft)
  return canonicalSourceSpeechEvidencePackageSchema.parse({
    ...draft,
    contractDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyCanonicalSourceSpeechEvidencePackage(
  input: unknown,
): CanonicalSourceSpeechEvidencePackage {
  const parsed = canonicalSourceSpeechEvidencePackageSchema.parse(input)
  for (const record of parsed.evidenceRecords) {
    const { recordDigestSha256, ...draft } = record
    assertRecordSemantics(draft)
    if (recordDigestSha256 !== sha256AuthorityValue(draft)) {
      throw new Error('canonical_source_speech_evidence_record_digest_invalid')
    }
  }
  const { contractDigestSha256, ...draft } = parsed
  assertPackageSemantics(draft)
  if (
    draft.evidenceSetDigestSha256 !==
      sha256AuthorityValue(draft.evidenceRecords)
    || contractDigestSha256 !== sha256AuthorityValue(draft)
  ) {
    throw new Error('canonical_source_speech_evidence_package_digest_invalid')
  }
  return structuredClone(parsed)
}

function assertRecordSemantics(
  record: CanonicalSourceSpeechEvidenceRecordDraft,
): void {
  if (record.coverageEndMillisecondsExclusive <= 0) {
    throw new Error('canonical_source_speech_evidence_coverage_invalid')
  }
  let previousEnd = 0
  const ids = new Set<string>()
  for (const [index, segment] of record.segments.entries()) {
    if (
      segment.order !== index + 1
      || ids.has(segment.segmentId)
      || segment.startMilliseconds < previousEnd
      || segment.endMillisecondsExclusive <= segment.startMilliseconds
      || segment.endMillisecondsExclusive >
        record.coverageEndMillisecondsExclusive
    ) {
      throw new Error('canonical_source_speech_evidence_segment_invalid')
    }
    ids.add(segment.segmentId)
    previousEnd = segment.endMillisecondsExclusive
  }
  if (record.evidenceStatus === 'verified_speech') {
    if (
      record.segments.length === 0
      || !record.transcriptArtifact
      || !record.wordTimestampArtifact
      || !record.transcriptionRuntime
      || !record.transcriptProjectionPolicy
      || !record.languageCode
      || record.speechAbsenceEvidenceDigestSha256 !== null
    ) {
      throw new Error('canonical_source_speech_evidence_speech_lineage_invalid')
    }
    return
  }
  if (
    record.segments.length !== 0
    || record.transcriptArtifact !== null
    || record.wordTimestampArtifact !== null
    || record.transcriptionRuntime !== null
    || record.transcriptProjectionPolicy !== null
    || record.languageCode !== null
    || record.speechAbsenceEvidenceDigestSha256 === null
  ) {
    throw new Error('canonical_source_speech_evidence_no_speech_lineage_invalid')
  }
}

function assertPackageSemantics(
  value: z.infer<typeof canonicalSourceSpeechEvidencePackageDraftSchema>,
): void {
  if (value.evidenceRecordCount !== value.evidenceRecords.length) {
    throw new Error('canonical_source_speech_evidence_count_invalid')
  }
  const sourceIds = new Set<string>()
  const assetIds = new Set<string>()
  for (const [index, record] of value.evidenceRecords.entries()) {
    if (
      record.uploadedOrder !== index + 1
      || sourceIds.has(record.sourceSequenceItemId)
      || assetIds.has(record.mediaAssetId)
    ) {
      throw new Error('canonical_source_speech_evidence_source_order_invalid')
    }
    sourceIds.add(record.sourceSequenceItemId)
    assetIds.add(record.mediaAssetId)
  }
  if (value.sourceMode === 'idea_first_no_uploaded_media') {
    if (
      value.status !== 'not_applicable_idea_first'
      || value.ideaFirstAuthorityDigestSha256 === null
      || value.evidenceRecords.length !== 0
    ) {
      throw new Error('canonical_source_speech_evidence_idea_first_invalid')
    }
    return
  }
  if (
    value.status !== 'available_for_preapproval_reasoning'
    || value.ideaFirstAuthorityDigestSha256 !== null
    || value.evidenceRecords.length === 0
  ) {
    throw new Error('canonical_source_speech_evidence_uploaded_media_invalid')
  }
}

function containsDisallowedControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0)
    if (
      codePoint !== undefined
      && (
        codePoint <= 0x08
        || codePoint === 0x0b
        || codePoint === 0x0c
        || (codePoint >= 0x0e && codePoint <= 0x1f)
        || codePoint === 0x7f
      )
    ) return true
  }
  return false
}
