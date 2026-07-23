import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  evaluateMotionStudioProviderAttemptReceipt,
  type MotionStudioCanonicalProviderAttemptPortV1,
  type MotionStudioProviderAttemptConsumptionExpectationV1,
} from './canonical-provider-attempt-port'
import {
  assertMotionStudioProviderCandidateObjectiveQa,
  motionStudioProviderCandidateObjectiveQaV2Schema,
  type MotionStudioProviderCandidateObjectiveQaV2,
} from './canonical-provider-candidate-objective-qa'
import {
  assertMotionStudioProviderCandidateReviewContext,
  assertMotionStudioProviderCandidateReviewContextFreshness,
  motionStudioProviderCandidateReviewContextFreshnessV1Schema,
  motionStudioProviderCandidateReviewContextV1Schema,
  type MotionStudioProviderCandidateReviewContextFreshnessV1,
  type MotionStudioProviderCandidateReviewContextV1,
} from './canonical-provider-candidate-review-context'
import {
  assertMotionStudioProviderCandidateReviewHandoff,
  MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_EVIDENCE_KINDS,
  MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_GATES,
  motionStudioProviderCandidateReviewHandoffV2Schema,
  type MotionStudioProviderCandidateReviewEvidenceKind,
  type MotionStudioProviderCandidateReviewGate,
  type MotionStudioProviderCandidateReviewHandoffV2,
} from './canonical-provider-candidate-review-handoff'

export const MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_EVIDENCE_SCHEMA_VERSION =
  'motion-studio.provider-candidate-review-evidence.v1' as const
export const MOTION_STUDIO_PROVIDER_CANDIDATE_ACTUAL_REVIEW_RUNTIME = Object.freeze({
  canonicalAuthenticatedReviewEvidenceVerifierIntegrated: false,
})

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const evidenceClassSchema = z.enum([
  'contract_shaped_server_path_proof_only',
  'canonical_backend_verified_runtime',
])
const gateSchema = z.enum(MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_GATES)
const evidenceKindSchema = z.enum(
  MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_EVIDENCE_KINDS,
)
const evidenceSourceClassSchema = z.enum([
  'canonical_project_authority',
  'private_media_readback',
  'canonical_provider_attempt',
  'deterministic_objective_qa',
  'reviewer_analysis',
  'rights_provenance_record',
  'complete_private_playback_attestation',
])

const reviewEvidenceItemSchema = z.object({
  kind: evidenceKindSchema,
  evidenceId: stableIdSchema,
  sourceRecordDigest: digestSchema,
  sourceClass: evidenceSourceClassSchema,
  privateOnly: z.literal(true),
  rawPayloadPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  itemDigest: digestSchema,
}).strict()

const gateResultSchema = z.object({
  gate: gateSchema,
  requirementDigest: digestSchema,
  result: z.enum(['passed', 'failed']),
  reviewerActorId: stableIdSchema,
  note: z.string().trim().min(1).max(500),
  reviewedAt: isoDateSchema,
  evidenceItems: z.array(reviewEvidenceItemSchema).min(2).max(8).readonly(),
  resultDigest: digestSchema,
}).strict()

const humanReviewSchema = z.object({
  playbackSessionId: stableIdSchema,
  playbackContext: z.enum([
    'private_picture_and_narration_context',
    'private_synchronized_picture_and_audio_context',
  ]),
  reviewerActorId: stableIdSchema,
  candidateSha256: digestSchema,
  reviewContextDigest: digestSchema,
  startedAt: isoDateSchema,
  completedAt: isoDateSchema,
  completeCandidatePlaybackAttested: z.literal(true),
  privateMediaChecksumVerifiedBeforePlayback: z.literal(true),
  explicitAttestationText: z.enum([
    'I REVIEWED THE COMPLETE PRIVATE MUSIC CANDIDATE IN PICTURE AND NARRATION CONTEXT',
    'I REVIEWED THE COMPLETE SYNCHRONIZED PRIVATE CANDIDATE',
  ]),
  decision: z.enum(['pass_for_selection_review', 'reject_candidate']),
  playbackDigest: digestSchema,
}).strict()

export const motionStudioProviderCandidateReviewEvidenceV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_EVIDENCE_SCHEMA_VERSION),
  reviewEvidenceId: stableIdSchema,
  evidenceClass: evidenceClassSchema,
  state: z.enum([
    'contract_path_review_validation_complete_non_promotable',
    'actual_candidate_reviewed_rejected',
    'actual_candidate_review_complete_cost_reconciliation_required',
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
    canonicalReceiptDigest: digestSchema,
    qaDigest: digestSchema,
  }).strict(),
  sourceReviewHandoff: z.object({
    reviewHandoffId: stableIdSchema,
    handoffDigest: digestSchema,
    requirementsDigest: digestSchema,
  }).strict(),
  sourceReviewContext: z.object({
    reviewContextId: stableIdSchema,
    reviewContextDigest: digestSchema,
    contextAuthorityDigest: digestSchema,
    freshnessDigest: digestSchema,
    currentRequestAuthorityDigest: digestSchema,
  }).strict(),
  providerAttempt: z.object({
    approvedPackageId: stableIdSchema,
    approvedPackageDigest: digestSchema,
    approvedWorkItemId: stableIdSchema,
    queueJobId: stableIdSchema,
    queueAttemptId: stableIdSchema,
    claimId: stableIdSchema,
    leaseId: stableIdSchema,
    idempotencyKeyHash: digestSchema,
    providerOperationId: stableIdSchema,
    providerRouteId: stableIdSchema,
    providerModelId: stableIdSchema,
    terminalEvidenceDigest: digestSchema,
  }).strict(),
  candidate: z.object({
    privateObjectIdentityHash: digestSchema,
    sha256: digestSchema,
    byteLength: z.number().int().min(44).max(24 * 1024 * 1024),
    durationMilliseconds: z.number().int().positive().max(30_000),
    mimeType: z.literal('audio/wav'),
    privateCreateOnlyReadbackVerified: z.literal(true),
  }).strict(),
  gateResults: z.array(gateResultSchema).min(5).max(6).readonly(),
  humanReview: humanReviewSchema,
  cost: z.object({
    providerAttemptTotalInternalProductionCostMicros: z.number().int().nonnegative(),
    providerAttemptCostEvidenceDigest: digestSchema,
    providerAttemptCostEvidenceActual: z.boolean(),
    normalizationInfrastructureCostMicros: z.null(),
    objectiveQaInfrastructureCostMicros: z.null(),
    reviewPreparationInfrastructureCostMicros: z.null(),
    fullCandidateCostReconciled: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  readiness: z.object({
    contractPathProofOnly: z.boolean(),
    actualPrivateProviderCandidatePresent: z.boolean(),
    runtimeReceiptReverified: z.boolean(),
    exactCurrentReviewContextVerified: z.literal(true),
    reviewContractValidationComplete: z.literal(true),
    actualReviewEvidenceComplete: z.boolean(),
    reviewPassed: z.boolean(),
    reviewRejected: z.boolean(),
    fullCandidateCostReconciliationRequired: z.literal(true),
    readyForSelectionDecision: z.literal(false),
    ms012dAccepted: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  selection: z.object({
    selectionDecisionCreated: z.literal(false),
    selected: z.literal(false),
    firstCandidateAutoAccepted: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineEligible: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    createOnly: z.literal(true),
    evidenceRecordPersisted: z.literal(true),
    localPathProjected: z.literal(false),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  sideEffects: z.object({
    contractGateValidationCount: z.number().int().min(0).max(6),
    actualReviewEvidenceSubmissionCount: z.number().int().min(0).max(6),
    contractHumanDecisionValidationCount: z.union([z.literal(0), z.literal(1)]),
    actualHumanReviewDecisionCount: z.union([z.literal(0), z.literal(1)]),
    providerSubmissionCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    selectionCount: z.literal(0),
    finalMixMutationCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  reviewEvidenceDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const actual = value.evidenceClass === 'canonical_backend_verified_runtime'
  const allPassed = value.gateResults.every((entry) => entry.result === 'passed')
  const expectedState = !actual
    ? 'contract_path_review_validation_complete_non_promotable'
    : allPassed
      ? 'actual_candidate_review_complete_cost_reconciliation_required'
      : 'actual_candidate_reviewed_rejected'
  if (
    value.state !== expectedState ||
    value.readiness.contractPathProofOnly !== !actual ||
    value.readiness.actualPrivateProviderCandidatePresent !== actual ||
    value.readiness.runtimeReceiptReverified !== actual ||
    value.readiness.actualReviewEvidenceComplete !== actual ||
    value.readiness.reviewPassed !== (actual && allPassed) ||
    value.readiness.reviewRejected !== (actual && !allPassed) ||
    value.cost.providerAttemptCostEvidenceActual !== actual ||
    value.sideEffects.contractGateValidationCount !== (actual ? 0 : value.gateResults.length) ||
    value.sideEffects.actualReviewEvidenceSubmissionCount !== (actual ? value.gateResults.length : 0) ||
    value.sideEffects.contractHumanDecisionValidationCount !== (actual ? 0 : 1) ||
    value.sideEffects.actualHumanReviewDecisionCount !== (actual ? 1 : 0)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['evidenceClass'],
      message: 'Provider candidate review evidence provenance cannot be promoted or relabelled.',
    })
  }
  if (
    value.humanReview.decision !== (allPassed ? 'pass_for_selection_review' : 'reject_candidate')
  ) {
    context.addIssue({
      code: 'custom',
      path: ['humanReview', 'decision'],
      message: 'Provider candidate human decision must match the complete ordered gate result set.',
    })
  }
})

export type MotionStudioProviderCandidateReviewEvidenceV1 =
  z.infer<typeof motionStudioProviderCandidateReviewEvidenceV1Schema>

export interface MotionStudioProviderCandidateReviewEvidenceItemInput {
  kind: MotionStudioProviderCandidateReviewEvidenceKind
  evidenceId: string
  sourceRecordDigest: string
  sourceClass: z.infer<typeof evidenceSourceClassSchema>
}

export interface MotionStudioProviderCandidateGateReviewInput {
  gate: MotionStudioProviderCandidateReviewGate
  requirementDigest: string
  result: 'passed' | 'failed'
  reviewerActorId: string
  note: string
  reviewedAt: string
  evidenceItems: readonly MotionStudioProviderCandidateReviewEvidenceItemInput[]
}

export interface MotionStudioProviderCandidateHumanPlaybackInput {
  playbackSessionId: string
  playbackContext: MotionStudioProviderCandidateReviewContextV1['humanReviewPolicy']['playbackContext']
  reviewerActorId: string
  candidateSha256: string
  reviewContextDigest: string
  startedAt: string
  completedAt: string
  completeCandidatePlaybackAttested: true
  privateMediaChecksumVerifiedBeforePlayback: true
  explicitAttestationText: MotionStudioProviderCandidateReviewContextV1['humanReviewPolicy']['explicitAttestationText']
}

interface SharedReviewInput {
  objectiveQa: MotionStudioProviderCandidateObjectiveQaV2
  reviewHandoff: MotionStudioProviderCandidateReviewHandoffV2
  reviewContext: MotionStudioProviderCandidateReviewContextV1
  freshness: MotionStudioProviderCandidateReviewContextFreshnessV1
  gateReviews: readonly MotionStudioProviderCandidateGateReviewInput[]
  humanPlayback: MotionStudioProviderCandidateHumanPlaybackInput
  localStorageRoot: string
  createdAt: string
}

export async function proveMotionStudioProviderCandidateContractReviewEvidence(
  input: SharedReviewInput,
): Promise<MotionStudioProviderCandidateReviewEvidenceV1> {
  const source = validateReviewSources(input)
  if (
    source.objectiveQa.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    source.reviewHandoff.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    source.reviewContext.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    source.freshness.state !== 'current_contract_path_non_promotable'
  ) blocked('Contract review proof requires the exact non-promotable contract-path lineage.')
  return compileAndPersistReviewEvidence({ ...input, ...source, actual: false })
}

export async function reconcileMotionStudioProviderCandidateActualReviewEvidence(
  input: SharedReviewInput & {
    expectation: MotionStudioProviderAttemptConsumptionExpectationV1
    receipt: MotionStudioCanonicalProviderAttemptPortV1
  },
): Promise<MotionStudioProviderCandidateReviewEvidenceV1> {
  const source = validateReviewSources(input)
  const admission = evaluateMotionStudioProviderAttemptReceipt({
    expectation: input.expectation,
    receipt: input.receipt,
  })
  if (!admission.readyForPrivateCandidateIngest) {
    blocked(`Actual candidate review requires canonical runtime receipt admission: ${admission.blockers.join(',')}.`)
  }
  if (!MOTION_STUDIO_PROVIDER_CANDIDATE_ACTUAL_REVIEW_RUNTIME
    .canonicalAuthenticatedReviewEvidenceVerifierIntegrated) {
    blocked('Actual candidate review requires the canonical authenticated review-evidence verifier.')
  }
  if (
    source.objectiveQa.evidenceClass !== 'canonical_backend_verified_runtime' ||
    source.reviewHandoff.evidenceClass !== 'canonical_backend_verified_runtime' ||
    source.reviewContext.evidenceClass !== 'canonical_backend_verified_runtime' ||
    source.freshness.state !== 'current_actual_candidate_runtime_reverification_required' ||
    admission.receiptDigest !== source.objectiveQa.canonicalReceiptDigest ||
    input.receipt.receiptDigest !== source.objectiveQa.canonicalReceiptDigest
  ) blocked('Actual candidate review requires exact admitted receipt and candidate lineage.')
  return compileAndPersistReviewEvidence({ ...input, ...source, actual: true })
}

export function assertMotionStudioProviderCandidateReviewEvidence(
  input: MotionStudioProviderCandidateReviewEvidenceV1,
): void {
  const parsed = motionStudioProviderCandidateReviewEvidenceV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.reviewEvidenceDigest
  if (
    sha256CanonicalJson(base) !== parsed.reviewEvidenceDigest ||
    parsed.readiness.readyForSelectionDecision || parsed.readiness.ms012dAccepted ||
    parsed.readiness.productReady || parsed.selection.selectionDecisionCreated ||
    parsed.selection.selected || parsed.selection.firstCandidateAutoAccepted ||
    parsed.selection.finalMixEligible || parsed.selection.timelineEligible ||
    parsed.sideEffects.providerSubmissionCount !== 0 ||
    parsed.sideEffects.secretPayloadReadCount !== 0 ||
    parsed.sideEffects.selectionCount !== 0 ||
    parsed.sideEffects.finalMixMutationCount !== 0 ||
    parsed.sideEffects.timelineMutationCount !== 0 || parsed.sideEffects.renderCount !== 0 ||
    parsed.sideEffects.exportCount !== 0 || parsed.sideEffects.remoteMutationCount !== 0
  ) blocked('Provider candidate review evidence crossed its review or selection boundary.')
}

export async function readMotionStudioProviderCandidateReviewEvidence(input: {
  localStorageRoot: string
  evidenceObjectIdentityHash: string
}): Promise<MotionStudioProviderCandidateReviewEvidenceV1 | null> {
  assertRoot(input.localStorageRoot)
  if (!/^[a-f0-9]{64}$/u.test(input.evidenceObjectIdentityHash)) {
    invalid('Provider candidate review evidence identity is invalid.')
  }
  const relativePath = reviewEvidenceRelativePath(input.evidenceObjectIdentityHash)
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!bytes) return null
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked('Persisted provider candidate review evidence is not canonical JSON.')
  }
  const record = deepFreeze(motionStudioProviderCandidateReviewEvidenceV1Schema.parse(decoded))
  assertMotionStudioProviderCandidateReviewEvidence(record)
  const canonicalBytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  if (!bytes.equals(canonicalBytes)) {
    blocked('Persisted provider candidate review evidence is not canonical serialization.')
  }
  return record
}

function validateReviewSources(input: SharedReviewInput) {
  assertMotionStudioProviderCandidateObjectiveQa(input.objectiveQa)
  assertMotionStudioProviderCandidateReviewHandoff(input.reviewHandoff)
  assertMotionStudioProviderCandidateReviewContext(input.reviewContext)
  assertMotionStudioProviderCandidateReviewContextFreshness(input.freshness)
  const objectiveQa = motionStudioProviderCandidateObjectiveQaV2Schema.parse(input.objectiveQa)
  const reviewHandoff = motionStudioProviderCandidateReviewHandoffV2Schema.parse(input.reviewHandoff)
  const reviewContext = motionStudioProviderCandidateReviewContextV1Schema.parse(input.reviewContext)
  const freshness = motionStudioProviderCandidateReviewContextFreshnessV1Schema.parse(input.freshness)
  if (
    objectiveQa.evidenceClass !== reviewHandoff.evidenceClass ||
    objectiveQa.evidenceClass !== reviewContext.evidenceClass ||
    objectiveQa.evidenceClass !== freshness.evidenceClass ||
    objectiveQa.intent !== reviewHandoff.intent || objectiveQa.intent !== reviewContext.intent ||
    objectiveQa.workspaceId !== reviewContext.workspaceId ||
    objectiveQa.projectId !== reviewContext.projectId ||
    objectiveQa.editSessionId !== reviewContext.editSessionId ||
    objectiveQa.productionId !== reviewContext.productionId ||
    objectiveQa.approvedSnapshotId !== reviewContext.approvedSnapshotId ||
    objectiveQa.approvedSnapshotDigest !== reviewContext.approvedSnapshotDigest ||
    objectiveQa.evidenceDigest !== reviewContext.sourceObjectiveQa.evidenceDigest ||
    objectiveQa.evidenceDigest !== reviewHandoff.sourceObjectiveQa.evidenceDigest ||
    reviewHandoff.handoffDigest !== reviewContext.sourceReviewHandoff.handoffDigest ||
    reviewContext.reviewContextId !== freshness.reviewContextId ||
    reviewContext.reviewContextDigest !== freshness.reviewContextDigest ||
    freshness.invalidationReasons.length !== 0 || !freshness.readiness.exactReviewContextCurrent
  ) blocked('Provider candidate review evidence requires exact current QA, handoff and context lineage.')
  return { objectiveQa, reviewHandoff, reviewContext, freshness }
}

async function compileAndPersistReviewEvidence(input: SharedReviewInput &
  ReturnType<typeof validateReviewSources> & { actual: boolean }) {
  assertRoot(input.localStorageRoot)
  const createdAt = exactIso(input.createdAt)
  if (
    Date.parse(createdAt) < Date.parse(input.reviewContext.createdAt) ||
    Date.parse(createdAt) < Date.parse(input.freshness.evaluatedAt)
  ) invalid('Provider candidate review evidence cannot predate its current review context.')
  const gateResults = validateGateReviews({
    inputs: input.gateReviews,
    handoff: input.reviewHandoff,
    contextCreatedAt: input.reviewContext.createdAt,
  })
  const allPassed = gateResults.every((entry) => entry.result === 'passed')
  const humanReview = validateHumanPlayback({
    input: input.humanPlayback,
    context: input.reviewContext,
    candidateSha256: input.objectiveQa.candidate.sha256,
    allPassed,
    latestGateReviewedAt: gateResults.reduce(
      (latest, entry) => Date.parse(entry.reviewedAt) > Date.parse(latest)
        ? entry.reviewedAt
        : latest,
      input.reviewContext.createdAt,
    ),
  })
  if (Date.parse(createdAt) < Date.parse(humanReview.completedAt)) {
    invalid('Provider candidate review evidence cannot predate completed private playback.')
  }
  const requirementsDigest = sha256CanonicalJson(input.reviewHandoff.reviewRequirements)
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_review_evidence_v1',
    evidenceClass: input.objectiveQa.evidenceClass,
    objectiveQaEvidenceDigest: input.objectiveQa.evidenceDigest,
    reviewHandoffDigest: input.reviewHandoff.handoffDigest,
    reviewContextDigest: input.reviewContext.reviewContextDigest,
    freshnessDigest: input.freshness.freshnessDigest,
    gateResultsDigest: sha256CanonicalJson(gateResults),
    playbackDigest: humanReview.playbackDigest,
  })
  const existing = await readMotionStudioProviderCandidateReviewEvidence({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash,
  })
  if (existing) return existing
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_EVIDENCE_SCHEMA_VERSION,
    reviewEvidenceId: `ms012d-review-evidence-${evidenceObjectIdentityHash.slice(0, 24)}`,
    evidenceClass: input.objectiveQa.evidenceClass,
    state: !input.actual
      ? 'contract_path_review_validation_complete_non_promotable' as const
      : allPassed
        ? 'actual_candidate_review_complete_cost_reconciliation_required' as const
        : 'actual_candidate_reviewed_rejected' as const,
    createdAt,
    intent: input.objectiveQa.intent,
    workspaceId: input.objectiveQa.workspaceId,
    projectId: input.objectiveQa.projectId,
    editSessionId: input.objectiveQa.editSessionId,
    productionId: input.objectiveQa.productionId,
    approvedSnapshotId: input.objectiveQa.approvedSnapshotId,
    approvedSnapshotDigest: input.objectiveQa.approvedSnapshotDigest,
    sourceObjectiveQa: {
      evidenceId: input.objectiveQa.evidenceId,
      evidenceDigest: input.objectiveQa.evidenceDigest,
      canonicalReceiptDigest: input.objectiveQa.canonicalReceiptDigest,
      qaDigest: input.objectiveQa.qa.qaDigest,
    },
    sourceReviewHandoff: {
      reviewHandoffId: input.reviewHandoff.reviewHandoffId,
      handoffDigest: input.reviewHandoff.handoffDigest,
      requirementsDigest,
    },
    sourceReviewContext: {
      reviewContextId: input.reviewContext.reviewContextId,
      reviewContextDigest: input.reviewContext.reviewContextDigest,
      contextAuthorityDigest: input.reviewContext.contextAuthorityDigest,
      freshnessDigest: input.freshness.freshnessDigest,
      currentRequestAuthorityDigest: input.freshness.currentRequestAuthorityDigest,
    },
    providerAttempt: input.reviewHandoff.providerAttempt,
    candidate: {
      privateObjectIdentityHash: input.objectiveQa.candidate.privateObjectIdentityHash,
      sha256: input.objectiveQa.candidate.sha256,
      byteLength: input.objectiveQa.candidate.byteLength,
      durationMilliseconds: input.objectiveQa.candidate.durationMilliseconds,
      mimeType: input.objectiveQa.candidate.mimeType,
      privateCreateOnlyReadbackVerified:
        input.objectiveQa.candidate.privateCreateOnlyReadbackVerified,
    },
    gateResults,
    humanReview,
    cost: {
      providerAttemptTotalInternalProductionCostMicros:
        input.objectiveQa.cost.providerAttemptTotalInternalProductionCostMicros,
      providerAttemptCostEvidenceDigest:
        input.objectiveQa.cost.providerAttemptCostEvidenceDigest,
      providerAttemptCostEvidenceActual: input.actual,
      normalizationInfrastructureCostMicros: null,
      objectiveQaInfrastructureCostMicros: null,
      reviewPreparationInfrastructureCostMicros: null,
      fullCandidateCostReconciled: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    readiness: {
      contractPathProofOnly: !input.actual,
      actualPrivateProviderCandidatePresent: input.actual,
      runtimeReceiptReverified: input.actual,
      exactCurrentReviewContextVerified: true as const,
      reviewContractValidationComplete: true as const,
      actualReviewEvidenceComplete: input.actual,
      reviewPassed: input.actual && allPassed,
      reviewRejected: input.actual && !allPassed,
      fullCandidateCostReconciliationRequired: true as const,
      readyForSelectionDecision: false as const,
      ms012dAccepted: false as const,
      productReady: false as const,
    },
    selection: {
      selectionDecisionCreated: false as const,
      selected: false as const,
      firstCandidateAutoAccepted: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
    },
    persistence: {
      privateLocalOnly: true as const,
      createOnly: true as const,
      evidenceRecordPersisted: true as const,
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    sideEffects: {
      contractGateValidationCount: input.actual ? 0 : gateResults.length,
      actualReviewEvidenceSubmissionCount: input.actual ? gateResults.length : 0,
      contractHumanDecisionValidationCount: input.actual ? 0 as const : 1 as const,
      actualHumanReviewDecisionCount: input.actual ? 1 as const : 0 as const,
      providerSubmissionCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      selectionCount: 0 as const,
      finalMixMutationCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  const record = deepFreeze(motionStudioProviderCandidateReviewEvidenceV1Schema.parse({
    ...base,
    reviewEvidenceDigest: sha256CanonicalJson(base),
  }))
  await persistReviewEvidence(input.localStorageRoot, record)
  return record
}

function validateGateReviews(input: {
  inputs: readonly MotionStudioProviderCandidateGateReviewInput[]
  handoff: MotionStudioProviderCandidateReviewHandoffV2
  contextCreatedAt: string
}): MotionStudioProviderCandidateReviewEvidenceV1['gateResults'] {
  if (input.inputs.length !== input.handoff.reviewRequirements.length) {
    invalid('Provider candidate review must submit every exact review gate once.')
  }
  return input.handoff.reviewRequirements.map((requirement, index) => {
    const source = input.inputs[index]
    if (!source || source.gate !== requirement.gate ||
      source.requirementDigest !== requirement.requirementDigest) {
      invalid('Provider candidate review gate order or requirement authority changed.')
    }
    const reviewerActorId = stableIdSchema.parse(source.reviewerActorId)
    const reviewedAt = exactIso(source.reviewedAt)
    if (Date.parse(reviewedAt) < Date.parse(input.contextCreatedAt)) {
      invalid('Provider candidate gate review cannot predate its review context.')
    }
    assertSafeNote(source.note)
    if (source.evidenceItems.length !== requirement.requiredEvidenceKinds.length) {
      invalid('Provider candidate gate review must supply every exact required evidence kind.')
    }
    const evidenceItems = requirement.requiredEvidenceKinds.map((kind, itemIndex) => {
      const item = source.evidenceItems[itemIndex]
      if (!item || item.kind !== kind || item.sourceClass !== sourceClassFor(kind)) {
        invalid('Provider candidate review evidence kind or source class changed.')
      }
      const itemBase = {
        kind,
        evidenceId: stableIdSchema.parse(item.evidenceId),
        sourceRecordDigest: digestSchema.parse(item.sourceRecordDigest),
        sourceClass: item.sourceClass,
        privateOnly: true as const,
        rawPayloadPersisted: false as const,
        localPathProjected: false as const,
      }
      return { ...itemBase, itemDigest: sha256CanonicalJson(itemBase) }
    })
    if (new Set(evidenceItems.map((item) => item.kind)).size !== evidenceItems.length) {
      invalid('Provider candidate gate review evidence kinds must be unique.')
    }
    const resultBase = {
      gate: requirement.gate,
      requirementDigest: requirement.requirementDigest,
      result: source.result,
      reviewerActorId,
      note: source.note.trim(),
      reviewedAt,
      evidenceItems,
    }
    return { ...resultBase, resultDigest: sha256CanonicalJson(resultBase) }
  })
}

function validateHumanPlayback(input: {
  input: MotionStudioProviderCandidateHumanPlaybackInput
  context: MotionStudioProviderCandidateReviewContextV1
  candidateSha256: string
  allPassed: boolean
  latestGateReviewedAt: string
}): MotionStudioProviderCandidateReviewEvidenceV1['humanReview'] {
  const startedAt = exactIso(input.input.startedAt)
  const completedAt = exactIso(input.input.completedAt)
  if (
    Date.parse(startedAt) < Date.parse(input.context.createdAt) ||
    Date.parse(completedAt) < Date.parse(startedAt) ||
    Date.parse(completedAt) < Date.parse(input.latestGateReviewedAt) ||
    input.input.playbackContext !== input.context.humanReviewPolicy.playbackContext ||
    input.input.candidateSha256 !== input.candidateSha256 ||
    input.input.reviewContextDigest !== input.context.reviewContextDigest ||
    input.input.explicitAttestationText !== input.context.humanReviewPolicy.explicitAttestationText ||
    input.input.completeCandidatePlaybackAttested !== true ||
    input.input.privateMediaChecksumVerifiedBeforePlayback !== true
  ) invalid('Provider candidate human playback does not match the exact private review context.')
  const playbackBase = {
    playbackSessionId: stableIdSchema.parse(input.input.playbackSessionId),
    playbackContext: input.input.playbackContext,
    reviewerActorId: stableIdSchema.parse(input.input.reviewerActorId),
    candidateSha256: digestSchema.parse(input.input.candidateSha256),
    reviewContextDigest: digestSchema.parse(input.input.reviewContextDigest),
    startedAt,
    completedAt,
    completeCandidatePlaybackAttested: true as const,
    privateMediaChecksumVerifiedBeforePlayback: true as const,
    explicitAttestationText: input.input.explicitAttestationText,
    decision: input.allPassed
      ? 'pass_for_selection_review' as const
      : 'reject_candidate' as const,
  }
  return { ...playbackBase, playbackDigest: sha256CanonicalJson(playbackBase) }
}

function sourceClassFor(
  kind: MotionStudioProviderCandidateReviewEvidenceKind,
): z.infer<typeof evidenceSourceClassSchema> {
  switch (kind) {
    case 'exact_music_bible_cue_picture_timing':
      return 'canonical_project_authority'
    case 'private_normalized_candidate_audio':
    case 'private_source_video':
      return 'private_media_readback'
    case 'canonical_provider_attempt_lineage':
      return 'canonical_provider_attempt'
    case 'actual_candidate_objective_qa':
      return 'deterministic_objective_qa'
    case 'rights_provenance_disclosure_retention':
      return 'rights_provenance_record'
    case 'complete_human_listening_attestation':
    case 'synchronized_human_playback_attestation':
      return 'complete_private_playback_attestation'
    default:
      return 'reviewer_analysis'
  }
}

function assertSafeNote(value: string): void {
  const note = value.trim()
  if (!note || note.length > 500 || /(?:https?:\/\/|file:\/\/|Bearer\s+|[?&](?:token|key|secret)=|\/[A-Za-z0-9._-]+\/)/iu.test(note)) {
    invalid('Provider candidate review note must be bounded and contain no URL, path or credential material.')
  }
}

async function persistReviewEvidence(
  root: string,
  record: MotionStudioProviderCandidateReviewEvidenceV1,
): Promise<void> {
  const relativePath = reviewEvidenceRelativePath(
    record.persistence.evidenceObjectIdentityHash,
  )
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: root, relativePath, content: bytes })
  const stored = await readMotionStudioProviderCandidateReviewEvidence({
    localStorageRoot: root,
    evidenceObjectIdentityHash: record.persistence.evidenceObjectIdentityHash,
  })
  if (!stored || stored.reviewEvidenceDigest !== record.reviewEvidenceDigest) {
    blocked('Provider candidate review evidence changed after create-only persistence.')
  }
}

function reviewEvidenceRelativePath(identity: string): string {
  return `motion-studio/provider-candidate-review-evidence/${identity.slice(0, 2)}/${identity}.json`
}

function assertRoot(root: string): void {
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u.test(root)) {
    invalid('Provider candidate review evidence requires the exact bounded private-ingest root.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Provider candidate review-evidence time must be canonical ISO-8601.')
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
    requiredGate: 'motion_studio_provider_candidate_review_evidence',
  })
}
