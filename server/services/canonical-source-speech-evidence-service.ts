import { z } from 'zod'

import type { CanonicalPlanComponentsInput } from '../validation/edit-planning-authority-schemas'
import { canonicalPlanComponentsSchema } from '../validation/edit-planning-authority-schemas'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalSourceSpeechEvidenceCaptureLocatorSchema,
  canonicalSourceSpeechEvidenceLocatorSchema,
  canonicalSourceSpeechEvidenceRecordDraftSchema,
  createCanonicalSourceSpeechEvidencePackage,
  type CanonicalSourceSpeechEvidencePackage,
  type CanonicalSourceSpeechEvidenceRecordDraft,
  verifyCanonicalSourceSpeechEvidencePackage,
} from '../source-speech-evidence/canonical-source-speech-evidence-contract'
import {
  PrivateCanonicalSourceSpeechEvidenceRepository,
  type CanonicalSourceSpeechEvidencePersistenceResult,
  type CanonicalSourceSpeechEvidenceRepositoryScope,
} from '../source-speech-evidence/private-canonical-source-speech-evidence-repository'
import {
  revalidateCanonicalMotionStudioStorytellingProductionAuthority,
} from './canonical-motion-studio-storytelling-production-authority-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

const recordArraySchema = z.array(
  canonicalSourceSpeechEvidenceRecordDraftSchema,
).max(10_000)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)

export const CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_READER_VERSION =
  'canonical-source-speech-evidence-capture-reader-v1' as const
export const CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_RESULT_VERSION =
  'canonical-source-speech-evidence-capture-result-v1' as const

const captureReaderResultDraftSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_RESULT_VERSION,
  ),
  sourceAuthority: z.literal(
    'canonical_private_source_speech_worker_evidence_repository',
  ),
  evidenceClass: z.literal(
    'controlled_private_source_speech_worker_evidence',
  ),
  productionReady: z.literal(false),
  callerSuppliedEvidenceAccepted: z.literal(false),
  serverOwnedLocatorId: safeIdentitySchema,
  captureSnapshotId: safeIdentitySchema,
  captureRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  identity: z.object({
    workspaceId: safeIdentitySchema,
    projectId: safeIdentitySchema,
    editSessionId: safeIdentitySchema,
    sourceSequenceDigestSha256: digestSchema,
  }).strict(),
  evidenceRecords: recordArraySchema,
  evidenceRecordCount: z.number().int().nonnegative().max(10_000),
}).strict()

const captureReaderResultSchema = captureReaderResultDraftSchema.extend({
  readerResultDigestSha256: digestSchema,
}).strict()

export type CanonicalSourceSpeechEvidenceCaptureReaderResult = z.infer<
  typeof captureReaderResultSchema
>

export interface CanonicalSourceSpeechEvidenceCaptureReaderPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_READER_VERSION
  readonly sourceAuthority:
    'canonical_private_source_speech_worker_evidence_repository'
  readonly evidenceClass:
    'process_bound_private_source_speech_evidence_reader'
  readonly productionReady: false
  readonly callerSuppliedEvidenceAccepted: false
  readCurrentByServerOwnedLocator(input: {
    readonly serverOwnedLocatorId: string
    readonly expectedScope: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }
    readonly expectedSourceSequenceDigestSha256: string
  }): Promise<unknown>
}

const admittedCaptureReaders = new WeakSet<object>()

export function createCanonicalSourceSpeechEvidenceCaptureReader(
  readCurrentByServerOwnedLocator:
    CanonicalSourceSpeechEvidenceCaptureReaderPort[
      'readCurrentByServerOwnedLocator'
    ],
): CanonicalSourceSpeechEvidenceCaptureReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== 'function') {
    throw blocked(
      'canonical_source_speech_evidence_capture_reader_capability_required',
    )
  }
  const reader = Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_READER_VERSION,
    sourceAuthority:
      'canonical_private_source_speech_worker_evidence_repository' as const,
    evidenceClass:
      'process_bound_private_source_speech_evidence_reader' as const,
    productionReady: false as const,
    callerSuppliedEvidenceAccepted: false as const,
    readCurrentByServerOwnedLocator:
      readCurrentByServerOwnedLocator.bind(undefined),
  })
  admittedCaptureReaders.add(reader)
  return reader
}

export function createCanonicalSourceSpeechEvidenceCaptureReaderResult(input: {
  readonly serverOwnedLocatorId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly sourceSequenceDigestSha256: string
  readonly captureSnapshotId: string
  readonly captureRevision: number
  readonly evidenceRecords:
    readonly CanonicalSourceSpeechEvidenceRecordDraft[]
}): CanonicalSourceSpeechEvidenceCaptureReaderResult {
  const draft = captureReaderResultDraftSchema.parse({
    schemaVersion: CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_RESULT_VERSION,
    sourceAuthority:
      'canonical_private_source_speech_worker_evidence_repository',
    evidenceClass: 'controlled_private_source_speech_worker_evidence',
    productionReady: false,
    callerSuppliedEvidenceAccepted: false,
    serverOwnedLocatorId: input.serverOwnedLocatorId,
    captureSnapshotId: input.captureSnapshotId,
    captureRevision: input.captureRevision,
    identity: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      sourceSequenceDigestSha256: input.sourceSequenceDigestSha256,
    },
    evidenceRecords: input.evidenceRecords,
    evidenceRecordCount: input.evidenceRecords.length,
  })
  return captureReaderResultSchema.parse({
    ...draft,
    readerResultDigestSha256: sha256AuthorityValue(draft),
  })
}

export interface CanonicalSourceSpeechEvidenceContext {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly components: CanonicalPlanComponentsInput
}

export async function persistCanonicalSourceSpeechEvidence(input: {
  readonly context: ServiceContext | null
  readonly repositoryScope: CanonicalSourceSpeechEvidenceRepositoryScope
  readonly canonicalContext: CanonicalSourceSpeechEvidenceContext
  readonly sourceEvidenceLocator: unknown
  readonly reader:
    | CanonicalSourceSpeechEvidenceCaptureReaderPort
    | null
    | undefined
  readonly repository?: PrivateCanonicalSourceSpeechEvidenceRepository
}): Promise<CanonicalSourceSpeechEvidencePersistenceResult> {
  const components = parseCanonicalContext(input.canonicalContext)
  const repository = input.repository
    ?? new PrivateCanonicalSourceSpeechEvidenceRepository()
  const captureLocator = canonicalSourceSpeechEvidenceCaptureLocatorSchema
    .safeParse(input.sourceEvidenceLocator)
  if (!captureLocator.success) {
    throw validation('canonical_source_speech_evidence_capture_locator_invalid')
  }
  const sourceSequenceDigestSha256 = sha256AuthorityValue(
    components.sourceSequence,
  )
  let evidence: CanonicalSourceSpeechEvidencePackage
  if (components.sourceSequence.length === 0) {
    const ideaFirstAuthority = await requireIdeaFirstAuthority({
      context: input.context,
      canonicalContext: input.canonicalContext,
      components,
    })
    if (
      captureLocator.data.serverOwnedLocatorId !== null
      || (
        input.reader !== null
        && input.reader !== undefined
      )
    ) {
      throw conflict('canonical_source_speech_evidence_idea_first_has_reader')
    }
    evidence = createCanonicalSourceSpeechEvidencePackage({
      status: 'not_applicable_idea_first',
      sourceMode: 'idea_first_no_uploaded_media',
      workspaceId: input.canonicalContext.workspaceId,
      projectId: input.canonicalContext.projectId,
      editSessionId: input.canonicalContext.editSessionId,
      sourceSequenceDigestSha256,
      evidenceSnapshotId:
        ideaFirstAuthority.sourceArtifactApprovalSnapshotId,
      evidenceRevision:
        ideaFirstAuthority.sourceVerification.sourceRepositoryRevision,
      ideaFirstAuthorityDigestSha256: ideaFirstAuthority.authorityHash,
      evidenceRecords: [],
    })
  } else {
    if (components.motionStudioStorytellingProductionAuthority) {
      throw conflict('canonical_source_speech_evidence_mixed_source_mode')
    }
    if (captureLocator.data.serverOwnedLocatorId === null) {
      throw blocked('canonical_source_speech_evidence_capture_locator_required')
    }
    const capture = await readCurrentCapturedEvidence({
      reader: input.reader,
      serverOwnedLocatorId: captureLocator.data.serverOwnedLocatorId,
      canonicalContext: input.canonicalContext,
      sourceSequenceDigestSha256,
    })
    assertRecordsMatchSourceSequence(components, capture.evidenceRecords)
    evidence = createCanonicalSourceSpeechEvidencePackage({
      status: 'available_for_preapproval_reasoning',
      sourceMode: 'uploaded_media',
      workspaceId: input.canonicalContext.workspaceId,
      projectId: input.canonicalContext.projectId,
      editSessionId: input.canonicalContext.editSessionId,
      sourceSequenceDigestSha256,
      evidenceSnapshotId: capture.captureSnapshotId,
      evidenceRevision: capture.captureRevision,
      ideaFirstAuthorityDigestSha256: null,
      evidenceRecords: capture.evidenceRecords,
    })
  }

  const persisted = await repository.save({
    scope: input.repositoryScope,
    package: evidence,
  })
  const reread = await repository.readByServerOwnedLocator({
    scope: input.repositoryScope,
    locator: persisted.locator,
  })
  if (
    reread.contractDigestSha256 !== evidence.contractDigestSha256
    || sha256AuthorityValue(reread) !== sha256AuthorityValue(evidence)
  ) {
    throw conflict('canonical_source_speech_evidence_persisted_readback_mismatch')
  }
  return persisted
}

export async function readCurrentCanonicalSourceSpeechEvidence(input: {
  readonly repositoryScope: CanonicalSourceSpeechEvidenceRepositoryScope
  readonly canonicalContext: CanonicalSourceSpeechEvidenceContext
  readonly locator: unknown
  readonly repository?: PrivateCanonicalSourceSpeechEvidenceRepository
}): Promise<CanonicalSourceSpeechEvidencePackage> {
  const components = parseCanonicalContext(input.canonicalContext)
  const locator = canonicalSourceSpeechEvidenceLocatorSchema.safeParse(
    input.locator,
  )
  if (!locator.success) {
    throw validation('canonical_source_speech_evidence_locator_invalid')
  }
  const repository = input.repository
    ?? new PrivateCanonicalSourceSpeechEvidenceRepository()
  const first = verifyCanonicalSourceSpeechEvidencePackage(
    await repository.readByServerOwnedLocator({
      scope: input.repositoryScope,
      locator: locator.data,
    }),
  )
  assertPackageMatchesCurrentComponents({
    evidence: first,
    canonicalContext: input.canonicalContext,
    components,
  })
  const second = verifyCanonicalSourceSpeechEvidencePackage(
    await repository.readByServerOwnedLocator({
      scope: input.repositoryScope,
      locator: locator.data,
    }),
  )
  assertPackageMatchesCurrentComponents({
    evidence: second,
    canonicalContext: input.canonicalContext,
    components,
  })
  if (sha256AuthorityValue(first) !== sha256AuthorityValue(second)) {
    throw conflict('canonical_source_speech_evidence_reread_race')
  }
  return first
}

async function readCurrentCapturedEvidence(input: {
  reader:
    | CanonicalSourceSpeechEvidenceCaptureReaderPort
    | null
    | undefined
  serverOwnedLocatorId: string
  canonicalContext: CanonicalSourceSpeechEvidenceContext
  sourceSequenceDigestSha256: string
}): Promise<CanonicalSourceSpeechEvidenceCaptureReaderResult> {
  assertCaptureReader(input.reader)
  const request = Object.freeze({
    serverOwnedLocatorId: input.serverOwnedLocatorId,
    expectedScope: Object.freeze({
      workspaceId: input.canonicalContext.workspaceId,
      projectId: input.canonicalContext.projectId,
      editSessionId: input.canonicalContext.editSessionId,
    }),
    expectedSourceSequenceDigestSha256:
      input.sourceSequenceDigestSha256,
  })
  const first = parseCaptureReaderResult(
    await input.reader.readCurrentByServerOwnedLocator(request),
  )
  assertCaptureReaderResult({
    result: first,
    request,
  })
  const second = parseCaptureReaderResult(
    await input.reader.readCurrentByServerOwnedLocator(request),
  )
  assertCaptureReaderResult({
    result: second,
    request,
  })
  if (sha256AuthorityValue(first) !== sha256AuthorityValue(second)) {
    throw conflict('canonical_source_speech_evidence_capture_reread_race')
  }
  return first
}

function parseCaptureReaderResult(
  value: unknown,
): CanonicalSourceSpeechEvidenceCaptureReaderResult {
  const parsed = captureReaderResultSchema.safeParse(value)
  if (!parsed.success) {
    throw conflict('canonical_source_speech_evidence_capture_result_invalid')
  }
  const { readerResultDigestSha256, ...draft } = parsed.data
  if (
    draft.evidenceRecordCount !== draft.evidenceRecords.length
    || readerResultDigestSha256 !== sha256AuthorityValue(draft)
  ) {
    throw conflict('canonical_source_speech_evidence_capture_digest_invalid')
  }
  return parsed.data
}

function assertCaptureReaderResult(input: {
  result: CanonicalSourceSpeechEvidenceCaptureReaderResult
  request: {
    readonly serverOwnedLocatorId: string
    readonly expectedScope: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }
    readonly expectedSourceSequenceDigestSha256: string
  }
}): void {
  if (
    input.result.serverOwnedLocatorId !== input.request.serverOwnedLocatorId
    || input.result.identity.workspaceId !==
      input.request.expectedScope.workspaceId
    || input.result.identity.projectId !==
      input.request.expectedScope.projectId
    || input.result.identity.editSessionId !==
      input.request.expectedScope.editSessionId
    || input.result.identity.sourceSequenceDigestSha256 !==
      input.request.expectedSourceSequenceDigestSha256
  ) {
    throw conflict('canonical_source_speech_evidence_capture_scope_stale')
  }
}

function assertCaptureReader(
  reader:
    | CanonicalSourceSpeechEvidenceCaptureReaderPort
    | null
    | undefined,
): asserts reader is CanonicalSourceSpeechEvidenceCaptureReaderPort {
  if (
    !reader
    || !admittedCaptureReaders.has(reader)
    || reader.schemaVersion !==
      CANONICAL_SOURCE_SPEECH_EVIDENCE_CAPTURE_READER_VERSION
    || reader.sourceAuthority !==
      'canonical_private_source_speech_worker_evidence_repository'
    || reader.evidenceClass !==
      'process_bound_private_source_speech_evidence_reader'
    || reader.productionReady !== false
    || reader.callerSuppliedEvidenceAccepted !== false
    || typeof reader.readCurrentByServerOwnedLocator !== 'function'
  ) {
    throw blocked('canonical_source_speech_evidence_capture_reader_required')
  }
}

function parseCanonicalContext(
  input: CanonicalSourceSpeechEvidenceContext,
): CanonicalPlanComponentsInput {
  const components = canonicalPlanComponentsSchema.safeParse(input.components)
  if (
    !components.success
    || !safeIdentity(input.workspaceId)
    || !safeIdentity(input.projectId)
    || !safeIdentity(input.editSessionId)
  ) throw validation('canonical_source_speech_evidence_context_invalid')
  return components.data
}

function assertRecordsMatchSourceSequence(
  components: CanonicalPlanComponentsInput,
  records: readonly CanonicalSourceSpeechEvidenceRecordDraft[],
): void {
  if (records.length !== components.sourceSequence.length) {
    throw conflict('canonical_source_speech_evidence_source_count_mismatch')
  }
  for (const [index, source] of components.sourceSequence.entries()) {
    const record = records[index]
    if (
      !record
      || source.uploadedOrder !== index + 1
      || record.uploadedOrder !== source.uploadedOrder
      || record.sourceSequenceItemId !== source.sourceSequenceItemId
      || record.mediaAssetId !== source.mediaAssetId
      || record.sourceChecksumSha256 !== source.checksumSha256
    ) throw conflict('canonical_source_speech_evidence_source_identity_mismatch')
  }
}

function assertPackageMatchesCurrentComponents(input: {
  evidence: CanonicalSourceSpeechEvidencePackage
  canonicalContext: CanonicalSourceSpeechEvidenceContext
  components: CanonicalPlanComponentsInput
}): void {
  if (
    input.evidence.workspaceId !== input.canonicalContext.workspaceId
    || input.evidence.projectId !== input.canonicalContext.projectId
    || input.evidence.editSessionId !== input.canonicalContext.editSessionId
    || input.evidence.sourceSequenceDigestSha256 !==
      sha256AuthorityValue(input.components.sourceSequence)
  ) throw conflict('canonical_source_speech_evidence_scope_or_sequence_stale')

  if (input.evidence.sourceMode === 'uploaded_media') {
    if (
      input.components.sourceSequence.length === 0
      || input.components.motionStudioStorytellingProductionAuthority
    ) throw conflict('canonical_source_speech_evidence_source_mode_stale')
    assertRecordsMatchSourceSequence(
      input.components,
      input.evidence.evidenceRecords,
    )
    return
  }
  const ideaFirstAuthority =
    input.components.motionStudioStorytellingProductionAuthority
  if (
    input.components.sourceSequence.length !== 0
    || !ideaFirstAuthority
    || input.evidence.ideaFirstAuthorityDigestSha256 !==
      ideaFirstAuthority.authorityHash
    || input.evidence.evidenceSnapshotId !==
      ideaFirstAuthority.sourceArtifactApprovalSnapshotId
    || input.evidence.evidenceRevision !==
      ideaFirstAuthority.sourceVerification.sourceRepositoryRevision
  ) throw conflict('canonical_source_speech_evidence_idea_first_stale')
}

async function requireIdeaFirstAuthority(input: {
  context: ServiceContext | null
  canonicalContext: CanonicalSourceSpeechEvidenceContext
  components: CanonicalPlanComponentsInput
}) {
  if (!input.context) {
    throw blocked('canonical_source_speech_evidence_idea_first_reader_required')
  }
  const authority =
    await revalidateCanonicalMotionStudioStorytellingProductionAuthority({
      context: input.context,
      authority:
        input.components.motionStudioStorytellingProductionAuthority,
      expectedScope: {
        workspaceId: input.canonicalContext.workspaceId,
        projectId: input.canonicalContext.projectId,
        editSessionId: input.canonicalContext.editSessionId,
      },
    })
  if (
    !authority
    || authority.sourceMode !== 'idea_first_no_uploaded_media'
    || !authority.noUploadedSourceExpected
    || authority.fabricatedUploadRecordCount !== 0
    || input.components.sourceCleanupSummary.status !== 'not_applicable'
    || input.components.sourceCleanupPlan.status !== 'not_applicable'
    || input.components.sourceCleanupPlan.decisions.length !== 0
  ) throw conflict('canonical_source_speech_evidence_idea_first_invalid')
  return authority
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)
}

function validation(reason: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Canonical source speech evidence input is invalid.',
    400,
    { reason },
  )
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source speech evidence is stale or inconsistent.',
    409,
    { reason },
  )
}

function blocked(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical source speech evidence is not ready.',
    503,
    { reason },
  )
}
