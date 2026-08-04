import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioProviderCandidateObjectiveQa,
  motionStudioProviderCandidateObjectiveQaV2Schema,
  motionStudioProviderCandidateRequestAuthoritySchema,
  type MotionStudioProviderCandidateObjectiveQaV2,
  type MotionStudioProviderCandidateRequestAuthority,
} from './canonical-provider-candidate-objective-qa'
import {
  assertMotionStudioProviderCandidateReviewHandoff,
  motionStudioProviderCandidateReviewHandoffV2Schema,
  type MotionStudioProviderCandidateReviewHandoffV2,
} from './canonical-provider-candidate-review-handoff'
import { MOTION_STUDIO_PROVIDER_CANDIDATE_EVIDENCE_CLASSES } from
  './canonical-provider-candidate-ingest'

export const MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_CONTEXT_SCHEMA_VERSION =
  'motion-studio.provider-candidate-review-context.v1' as const
export const MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_CONTEXT_FRESHNESS_SCHEMA_VERSION =
  'motion-studio.provider-candidate-review-context-freshness.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const evidenceClassSchema = z.enum(MOTION_STUDIO_PROVIDER_CANDIDATE_EVIDENCE_CLASSES)

export const MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_INVALIDATION_REASONS = [
  'intent_changed',
  'approved_snapshot_changed',
  'approved_work_item_changed',
  'source_request_changed',
  'idempotency_authority_changed',
  'frame_range_or_rate_changed',
  'music_bible_version_changed',
  'music_bible_content_changed',
  'music_cue_changed',
  'source_video_version_changed',
  'source_video_content_changed',
  'sound_event_changed',
  'picture_lock_version_changed',
  'picture_lock_content_changed',
  'timing_authority_changed',
  'expected_hit_timing_changed',
  'speech_protection_ranges_changed',
] as const

const invalidationReasonSchema = z.enum(
  MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_INVALIDATION_REASONS,
)

const humanPolicySchema = z.object({
  playbackContext: z.enum([
    'private_picture_and_narration_context',
    'private_synchronized_picture_and_audio_context',
  ]),
  completeCandidatePlaybackRequired: z.literal(true),
  humanAuthoredGateResultsRequired: z.literal(true),
  explicitAttestationText: z.enum([
    'I REVIEWED THE COMPLETE PRIVATE MUSIC CANDIDATE IN PICTURE AND NARRATION CONTEXT',
    'I REVIEWED THE COMPLETE SYNCHRONIZED PRIVATE CANDIDATE',
  ]),
  automaticHumanReviewAllowed: z.literal(false),
  automaticApprovalAllowed: z.literal(false),
}).strict()

export const motionStudioProviderCandidateReviewContextV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_CONTEXT_SCHEMA_VERSION),
  reviewContextId: stableIdSchema,
  evidenceClass: evidenceClassSchema,
  state: z.enum([
    'contract_path_review_context_bound_non_promotable',
    'actual_candidate_review_context_bound_runtime_reverification_required',
  ]),
  createdAt: isoDateSchema,
  intent: z.enum(['generated_music_candidate', 'synchronized_foley_candidate']),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  sourceObjectiveQa: z.object({
    evidenceId: stableIdSchema,
    evidenceDigest: digestSchema,
    requestDigest: digestSchema,
    candidateSha256: digestSchema,
  }).strict(),
  sourceReviewHandoff: z.object({
    reviewHandoffId: stableIdSchema,
    handoffDigest: digestSchema,
    requirementsDigest: digestSchema,
    humanReviewPolicyDigest: digestSchema,
  }).strict(),
  requestAuthority: motionStudioProviderCandidateRequestAuthoritySchema,
  humanReviewPolicy: humanPolicySchema,
  contextAuthorityDigest: digestSchema,
  readiness: z.object({
    exactReviewContextBound: z.literal(true),
    contractPathProofOnly: z.boolean(),
    actualPrivateProviderCandidatePresent: z.boolean(),
    runtimeReceiptReverificationRequired: z.literal(true),
    runtimeReceiptReverified: z.literal(false),
    readyForEvidenceCollection: z.literal(false),
    readyForHumanReview: z.literal(false),
    readyForSelectionDecision: z.literal(false),
    ms012dAccepted: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    createOnly: z.literal(true),
    evidenceRecordPersisted: z.literal(true),
    localPathProjected: z.literal(false),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  sideEffects: z.object({
    providerSubmissionCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    reviewEvidenceSubmissionCount: z.literal(0),
    humanReviewDecisionCount: z.literal(0),
    selectionCount: z.literal(0),
    finalMixMutationCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  reviewContextDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const actual = value.evidenceClass === 'canonical_backend_verified_runtime'
  const expectedState = actual
    ? 'actual_candidate_review_context_bound_runtime_reverification_required'
    : 'contract_path_review_context_bound_non_promotable'
  if (
    value.state !== expectedState ||
    value.readiness.contractPathProofOnly !== !actual ||
    value.readiness.actualPrivateProviderCandidatePresent !== actual
  ) {
    context.addIssue({
      code: 'custom',
      path: ['evidenceClass'],
      message: 'Provider candidate review context provenance cannot be promoted or relabelled.',
    })
  }
  if (
    value.intent !== value.requestAuthority.intent ||
    value.approvedSnapshotId !== value.requestAuthority.approvedSnapshotId ||
    value.approvedSnapshotDigest !== value.requestAuthority.approvedSnapshotDigest ||
    value.sourceObjectiveQa.requestDigest !== value.requestAuthority.requestDigest
  ) {
    context.addIssue({
      code: 'custom',
      path: ['requestAuthority'],
      message: 'Provider candidate review context must preserve exact request and snapshot authority.',
    })
  }
  const expectedAuthorityDigest = sha256CanonicalJson({
    requestAuthority: value.requestAuthority,
    humanReviewPolicy: value.humanReviewPolicy,
    requirementsDigest: value.sourceReviewHandoff.requirementsDigest,
  })
  if (value.contextAuthorityDigest !== expectedAuthorityDigest) {
    context.addIssue({
      code: 'custom',
      path: ['contextAuthorityDigest'],
      message: 'Provider candidate review context authority digest is invalid.',
    })
  }
  const expectedIdentity = reviewContextIdentity({
    evidenceClass: value.evidenceClass,
    objectiveQaEvidenceDigest: value.sourceObjectiveQa.evidenceDigest,
    reviewHandoffDigest: value.sourceReviewHandoff.handoffDigest,
    candidateSha256: value.sourceObjectiveQa.candidateSha256,
    contextAuthorityDigest: value.contextAuthorityDigest,
  })
  if (
    value.persistence.evidenceObjectIdentityHash !== expectedIdentity ||
    value.reviewContextId !== `ms012d-review-context-${expectedIdentity.slice(0, 24)}`
  ) {
    context.addIssue({
      code: 'custom',
      path: ['persistence', 'evidenceObjectIdentityHash'],
      message: 'Provider candidate review context identity is invalid.',
    })
  }
})

export type MotionStudioProviderCandidateReviewContextV1 =
  z.infer<typeof motionStudioProviderCandidateReviewContextV1Schema>

export const motionStudioProviderCandidateReviewContextFreshnessV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_CONTEXT_FRESHNESS_SCHEMA_VERSION,
  ),
  reviewContextId: stableIdSchema,
  reviewContextDigest: digestSchema,
  evidenceClass: evidenceClassSchema,
  evaluatedAt: isoDateSchema,
  state: z.enum([
    'current_contract_path_non_promotable',
    'current_actual_candidate_runtime_reverification_required',
    'stale_upstream_authority_requires_replanning',
  ]),
  currentRequestAuthorityDigest: digestSchema,
  invalidationReasons: z.array(invalidationReasonSchema)
    .max(MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_INVALIDATION_REASONS.length)
    .readonly(),
  readiness: z.object({
    exactReviewContextCurrent: z.boolean(),
    contractPathProofOnly: z.boolean(),
    actualPrivateProviderCandidatePresent: z.boolean(),
    runtimeReceiptReverificationRequired: z.literal(true),
    runtimeReceiptReverified: z.literal(false),
    replanningRequired: z.boolean(),
    readyForEvidenceCollection: z.literal(false),
    readyForHumanReview: z.literal(false),
    readyForSelectionDecision: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineEligible: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    providerSubmissionCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    reviewEvidenceSubmissionCount: z.literal(0),
    humanReviewDecisionCount: z.literal(0),
    selectionCount: z.literal(0),
    finalMixMutationCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  freshnessDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const current = value.invalidationReasons.length === 0
  const actual = value.evidenceClass === 'canonical_backend_verified_runtime'
  const expectedState = !current
    ? 'stale_upstream_authority_requires_replanning'
    : actual
      ? 'current_actual_candidate_runtime_reverification_required'
      : 'current_contract_path_non_promotable'
  if (
    value.state !== expectedState ||
    value.readiness.exactReviewContextCurrent !== current ||
    value.readiness.replanningRequired !== !current ||
    value.readiness.contractPathProofOnly !== !actual ||
    value.readiness.actualPrivateProviderCandidatePresent !== actual ||
    new Set(value.invalidationReasons).size !== value.invalidationReasons.length
  ) {
    context.addIssue({
      code: 'custom',
      path: ['state'],
      message: 'Provider candidate review-context freshness state is inconsistent.',
    })
  }
})

export type MotionStudioProviderCandidateReviewContextFreshnessV1 =
  z.infer<typeof motionStudioProviderCandidateReviewContextFreshnessV1Schema>

export async function createMotionStudioProviderCandidateReviewContext(input: {
  objectiveQa: MotionStudioProviderCandidateObjectiveQaV2
  reviewHandoff: MotionStudioProviderCandidateReviewHandoffV2
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioProviderCandidateReviewContextV1> {
  assertMotionStudioProviderCandidateObjectiveQa(input.objectiveQa)
  assertMotionStudioProviderCandidateReviewHandoff(input.reviewHandoff)
  const objectiveQa = motionStudioProviderCandidateObjectiveQaV2Schema.parse(input.objectiveQa)
  const handoff = motionStudioProviderCandidateReviewHandoffV2Schema.parse(input.reviewHandoff)
  const createdAt = exactIso(input.createdAt)
  assertRoot(input.localStorageRoot)
  if (
    Date.parse(createdAt) < Date.parse(objectiveQa.createdAt) ||
    Date.parse(createdAt) < Date.parse(handoff.createdAt)
  ) invalid('Provider candidate review context cannot predate its source evidence.')
  assertSourceLineage(objectiveQa, handoff)

  const requirementsDigest = sha256CanonicalJson(handoff.reviewRequirements)
  const humanReviewPolicyDigest = sha256CanonicalJson(handoff.humanReviewPolicy)
  const contextAuthorityDigest = sha256CanonicalJson({
    requestAuthority: objectiveQa.requestAuthority,
    humanReviewPolicy: handoff.humanReviewPolicy,
    requirementsDigest,
  })
  const evidenceObjectIdentityHash = reviewContextIdentity({
    evidenceClass: objectiveQa.evidenceClass,
    objectiveQaEvidenceDigest: objectiveQa.evidenceDigest,
    reviewHandoffDigest: handoff.handoffDigest,
    candidateSha256: objectiveQa.candidate.sha256,
    contextAuthorityDigest,
  })
  const persisted = await readMotionStudioProviderCandidateReviewContext({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash,
  })
  if (persisted) {
    if (
      persisted.sourceObjectiveQa.evidenceDigest !== objectiveQa.evidenceDigest ||
      persisted.sourceReviewHandoff.handoffDigest !== handoff.handoffDigest ||
      persisted.evidenceClass !== objectiveQa.evidenceClass
    ) blocked('Persisted provider candidate review context changed replay authority.')
    return persisted
  }

  const actual = objectiveQa.evidenceClass === 'canonical_backend_verified_runtime'
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_CONTEXT_SCHEMA_VERSION,
    reviewContextId: `ms012d-review-context-${evidenceObjectIdentityHash.slice(0, 24)}`,
    evidenceClass: objectiveQa.evidenceClass,
    state: actual
      ? 'actual_candidate_review_context_bound_runtime_reverification_required' as const
      : 'contract_path_review_context_bound_non_promotable' as const,
    createdAt,
    intent: objectiveQa.intent,
    workspaceId: objectiveQa.workspaceId,
    projectId: objectiveQa.projectId,
    editSessionId: objectiveQa.editSessionId,
    productionId: objectiveQa.productionId,
    approvedSnapshotId: objectiveQa.approvedSnapshotId,
    approvedSnapshotDigest: objectiveQa.approvedSnapshotDigest,
    sourceObjectiveQa: {
      evidenceId: objectiveQa.evidenceId,
      evidenceDigest: objectiveQa.evidenceDigest,
      requestDigest: objectiveQa.requestAuthority.requestDigest,
      candidateSha256: objectiveQa.candidate.sha256,
    },
    sourceReviewHandoff: {
      reviewHandoffId: handoff.reviewHandoffId,
      handoffDigest: handoff.handoffDigest,
      requirementsDigest,
      humanReviewPolicyDigest,
    },
    requestAuthority: objectiveQa.requestAuthority,
    humanReviewPolicy: handoff.humanReviewPolicy,
    contextAuthorityDigest,
    readiness: {
      exactReviewContextBound: true as const,
      contractPathProofOnly: !actual,
      actualPrivateProviderCandidatePresent: actual,
      runtimeReceiptReverificationRequired: true as const,
      runtimeReceiptReverified: false as const,
      readyForEvidenceCollection: false as const,
      readyForHumanReview: false as const,
      readyForSelectionDecision: false as const,
      ms012dAccepted: false as const,
      productReady: false as const,
    },
    persistence: {
      privateLocalOnly: true as const,
      createOnly: true as const,
      evidenceRecordPersisted: true as const,
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    sideEffects: zeroSideEffects(),
    immutable: true as const,
  }
  const record = deepFreeze(motionStudioProviderCandidateReviewContextV1Schema.parse({
    ...base,
    reviewContextDigest: sha256CanonicalJson(base),
  }))
  await persistReviewContext(input.localStorageRoot, record)
  return record
}

export function evaluateMotionStudioProviderCandidateReviewContextFreshness(input: {
  reviewContext: MotionStudioProviderCandidateReviewContextV1
  currentRequestAuthority: MotionStudioProviderCandidateRequestAuthority
  evaluatedAt: string
}): MotionStudioProviderCandidateReviewContextFreshnessV1 {
  assertMotionStudioProviderCandidateReviewContext(input.reviewContext)
  const context = motionStudioProviderCandidateReviewContextV1Schema.parse(input.reviewContext)
  const current = motionStudioProviderCandidateRequestAuthoritySchema.parse(
    input.currentRequestAuthority,
  )
  const evaluatedAt = exactIso(input.evaluatedAt)
  if (Date.parse(evaluatedAt) < Date.parse(context.createdAt)) {
    invalid('Provider candidate review-context freshness cannot predate the context.')
  }
  const invalidationReasons = compareRequestAuthorities(context.requestAuthority, current)
  const currentRequestAuthorityDigest = sha256CanonicalJson(current)
  const isCurrent = invalidationReasons.length === 0
  const actual = context.evidenceClass === 'canonical_backend_verified_runtime'
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_CONTEXT_FRESHNESS_SCHEMA_VERSION,
    reviewContextId: context.reviewContextId,
    reviewContextDigest: context.reviewContextDigest,
    evidenceClass: context.evidenceClass,
    evaluatedAt,
    state: !isCurrent
      ? 'stale_upstream_authority_requires_replanning' as const
      : actual
        ? 'current_actual_candidate_runtime_reverification_required' as const
        : 'current_contract_path_non_promotable' as const,
    currentRequestAuthorityDigest,
    invalidationReasons,
    readiness: {
      exactReviewContextCurrent: isCurrent,
      contractPathProofOnly: !actual,
      actualPrivateProviderCandidatePresent: actual,
      runtimeReceiptReverificationRequired: true as const,
      runtimeReceiptReverified: false as const,
      replanningRequired: !isCurrent,
      readyForEvidenceCollection: false as const,
      readyForHumanReview: false as const,
      readyForSelectionDecision: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
      productReady: false as const,
    },
    sideEffects: zeroSideEffects(),
    immutable: true as const,
  }
  return deepFreeze(motionStudioProviderCandidateReviewContextFreshnessV1Schema.parse({
    ...base,
    freshnessDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioProviderCandidateReviewContext(
  input: MotionStudioProviderCandidateReviewContextV1,
): void {
  const parsed = motionStudioProviderCandidateReviewContextV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.reviewContextDigest
  if (
    sha256CanonicalJson(base) !== parsed.reviewContextDigest ||
    parsed.readiness.runtimeReceiptReverified || parsed.readiness.readyForEvidenceCollection ||
    parsed.readiness.readyForHumanReview || parsed.readiness.readyForSelectionDecision ||
    parsed.readiness.ms012dAccepted || parsed.readiness.productReady ||
    Object.values(parsed.sideEffects).some((count) => count !== 0)
  ) blocked('Provider candidate review context crossed its evidence or promotion boundary.')
}

export function assertMotionStudioProviderCandidateReviewContextFreshness(
  input: MotionStudioProviderCandidateReviewContextFreshnessV1,
): void {
  const parsed = motionStudioProviderCandidateReviewContextFreshnessV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.freshnessDigest
  if (
    sha256CanonicalJson(base) !== parsed.freshnessDigest ||
    parsed.readiness.runtimeReceiptReverified || parsed.readiness.readyForEvidenceCollection ||
    parsed.readiness.readyForHumanReview || parsed.readiness.readyForSelectionDecision ||
    parsed.readiness.finalMixEligible || parsed.readiness.timelineEligible ||
    parsed.readiness.productReady ||
    Object.values(parsed.sideEffects).some((count) => count !== 0)
  ) blocked('Provider candidate review-context freshness crossed its closed boundary.')
}

function assertSourceLineage(
  objectiveQa: MotionStudioProviderCandidateObjectiveQaV2,
  handoff: MotionStudioProviderCandidateReviewHandoffV2,
): void {
  if (
    handoff.evidenceClass !== objectiveQa.evidenceClass ||
    handoff.intent !== objectiveQa.intent ||
    handoff.workspaceId !== objectiveQa.workspaceId ||
    handoff.projectId !== objectiveQa.projectId ||
    handoff.editSessionId !== objectiveQa.editSessionId ||
    handoff.productionId !== objectiveQa.productionId ||
    handoff.approvedSnapshotId !== objectiveQa.approvedSnapshotId ||
    handoff.approvedSnapshotDigest !== objectiveQa.approvedSnapshotDigest ||
    handoff.sourceObjectiveQa.evidenceId !== objectiveQa.evidenceId ||
    handoff.sourceObjectiveQa.evidenceDigest !== objectiveQa.evidenceDigest ||
    handoff.sourceObjectiveQa.requestDigest !== objectiveQa.requestAuthority.requestDigest ||
    handoff.sourceObjectiveQa.analysisDigest !== objectiveQa.analysis.analysisDigest ||
    handoff.sourceObjectiveQa.qaDigest !== objectiveQa.qa.qaDigest ||
    handoff.candidate.sha256 !== objectiveQa.candidate.sha256
  ) blocked('Provider candidate review context requires exact QA and review-handoff lineage.')
}

function compareRequestAuthorities(
  previous: MotionStudioProviderCandidateRequestAuthority,
  current: MotionStudioProviderCandidateRequestAuthority,
): MotionStudioProviderCandidateReviewContextFreshnessV1['invalidationReasons'] {
  const reasons: (typeof MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_INVALIDATION_REASONS)[number][] = []
  if (previous.intent !== current.intent) return ['intent_changed']
  if (
    previous.approvedSnapshotId !== current.approvedSnapshotId ||
    previous.approvedSnapshotDigest !== current.approvedSnapshotDigest
  ) reasons.push('approved_snapshot_changed')
  if (previous.approvedWorkItemId !== current.approvedWorkItemId) {
    reasons.push('approved_work_item_changed')
  }
  if (previous.requestId !== current.requestId || previous.requestDigest !== current.requestDigest) {
    reasons.push('source_request_changed')
  }
  if (previous.idempotencyKeyHash !== current.idempotencyKeyHash) {
    reasons.push('idempotency_authority_changed')
  }
  if (
    previous.range.startFrame !== current.range.startFrame ||
    previous.range.endFrame !== current.range.endFrame ||
    previous.fps !== current.fps || previous.durationFrames !== current.durationFrames
  ) reasons.push('frame_range_or_rate_changed')
  if (previous.pictureLockArtifactVersionId !== current.pictureLockArtifactVersionId) {
    reasons.push('picture_lock_version_changed')
  }
  if (previous.pictureLockContentDigest !== current.pictureLockContentDigest) {
    reasons.push('picture_lock_content_changed')
  }
  if (previous.timingAuthorityDigest !== current.timingAuthorityDigest) {
    reasons.push('timing_authority_changed')
  }
  if (previous.intent === 'generated_music_candidate' && current.intent === previous.intent) {
    if (previous.musicBibleArtifactVersionId !== current.musicBibleArtifactVersionId) {
      reasons.push('music_bible_version_changed')
    }
    if (previous.musicBibleContentDigest !== current.musicBibleContentDigest) {
      reasons.push('music_bible_content_changed')
    }
    if (previous.cueId !== current.cueId) reasons.push('music_cue_changed')
  }
  if (previous.intent === 'synchronized_foley_candidate' && current.intent === previous.intent) {
    if (previous.sourceVideoAssetVersionId !== current.sourceVideoAssetVersionId) {
      reasons.push('source_video_version_changed')
    }
    if (previous.sourceVideoContentDigest !== current.sourceVideoContentDigest) {
      reasons.push('source_video_content_changed')
    }
    if (previous.soundEventId !== current.soundEventId) reasons.push('sound_event_changed')
    if (previous.expectedHitFrames.join('|') !== current.expectedHitFrames.join('|')) {
      reasons.push('expected_hit_timing_changed')
    }
    if (sha256CanonicalJson(previous.speechFrameRanges) !== sha256CanonicalJson(current.speechFrameRanges)) {
      reasons.push('speech_protection_ranges_changed')
    }
  }
  return reasons
}

function reviewContextIdentity(input: {
  evidenceClass: string
  objectiveQaEvidenceDigest: string
  reviewHandoffDigest: string
  candidateSha256: string
  contextAuthorityDigest: string
}): string {
  return sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_review_context_v1',
    ...input,
  })
}

function zeroSideEffects() {
  return {
    providerSubmissionCount: 0 as const,
    secretPayloadReadCount: 0 as const,
    reviewEvidenceSubmissionCount: 0 as const,
    humanReviewDecisionCount: 0 as const,
    selectionCount: 0 as const,
    finalMixMutationCount: 0 as const,
    timelineMutationCount: 0 as const,
    renderCount: 0 as const,
    exportCount: 0 as const,
    remoteMutationCount: 0 as const,
  }
}

async function persistReviewContext(
  root: string,
  record: MotionStudioProviderCandidateReviewContextV1,
): Promise<void> {
  const identity = record.persistence.evidenceObjectIdentityHash
  const relativePath = `motion-studio/provider-candidate-review-context/${identity.slice(0, 2)}/${identity}.json`
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: root, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: root, relativePath })
  if (!stored || !stored.equals(bytes)) {
    blocked('Provider candidate review context changed after create-only persistence.')
  }
}

export async function readMotionStudioProviderCandidateReviewContext(
  input: {
    localStorageRoot: string
    evidenceObjectIdentityHash: string
  },
): Promise<MotionStudioProviderCandidateReviewContextV1 | null> {
  assertRoot(input.localStorageRoot)
  if (!/^[a-f0-9]{64}$/u.test(input.evidenceObjectIdentityHash)) {
    invalid('Provider candidate review context identity is invalid.')
  }
  const identity = input.evidenceObjectIdentityHash
  const relativePath = `motion-studio/provider-candidate-review-context/${identity.slice(0, 2)}/${identity}.json`
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!bytes) return null
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked('Persisted provider candidate review context is not canonical JSON.')
  }
  const record = deepFreeze(motionStudioProviderCandidateReviewContextV1Schema.parse(decoded))
  assertMotionStudioProviderCandidateReviewContext(record)
  const canonicalBytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  if (!bytes.equals(canonicalBytes)) {
    blocked('Persisted provider candidate review context is not canonical serialization.')
  }
  return record
}

function assertRoot(root: string): void {
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u.test(root)) {
    invalid('Provider candidate review context requires the exact bounded private-ingest root.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Provider candidate review-context time must be canonical ISO-8601.')
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_provider_candidate_review_context',
  })
}
