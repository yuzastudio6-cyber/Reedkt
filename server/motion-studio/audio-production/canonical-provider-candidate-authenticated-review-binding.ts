import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioProviderCandidateAuthenticatedReviewVerifier,
  motionStudioProviderCandidateAuthenticatedReviewVerifierV1Schema,
  type MotionStudioProviderCandidateAuthenticatedReviewVerifierV1,
} from './canonical-provider-candidate-authenticated-review-verifier'
import {
  assertMotionStudioProviderCandidateReviewEvidence,
  motionStudioProviderCandidateReviewEvidenceV1Schema,
  type MotionStudioProviderCandidateReviewEvidenceV1,
} from './canonical-provider-candidate-review-evidence'

export const MOTION_STUDIO_PROVIDER_CANDIDATE_AUTHENTICATED_REVIEW_BINDING_SCHEMA_VERSION =
  'motion-studio.provider-candidate-authenticated-review-binding.v2' as const

export const MOTION_STUDIO_PROVIDER_CANDIDATE_AUTHENTICATED_REVIEW_BINDING_RUNTIME =
  Object.freeze({
    forwardOnlyConsumerBindingIntegrated: true,
    actualCanonicalAuthenticatedReviewEvidencePresent: false,
  })

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const evidenceClassSchema = z.enum([
  'contract_authenticated_review_binding_path_proof_only',
  'canonical_authenticated_review_binding',
])

export const motionStudioProviderCandidateAuthenticatedReviewBindingV2Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_PROVIDER_CANDIDATE_AUTHENTICATED_REVIEW_BINDING_SCHEMA_VERSION,
  ),
  bindingId: stableIdSchema,
  evidenceClass: evidenceClassSchema,
  state: z.enum([
    'contract_authenticated_review_binding_proven_non_promotable',
    'canonical_authenticated_review_bound_rejected',
    'canonical_authenticated_review_bound_cost_reconciliation_required',
  ]),
  createdAt: isoDateSchema,
  intent: z.enum(['generated_music_candidate', 'synchronized_foley_candidate']),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  sourceReviewEvidenceV1: z.object({
    reviewEvidenceId: stableIdSchema,
    reviewEvidenceDigest: digestSchema,
    evidenceClass: z.enum([
      'contract_shaped_server_path_proof_only',
      'canonical_backend_verified_runtime',
    ]),
    state: z.enum([
      'contract_path_review_validation_complete_non_promotable',
      'actual_candidate_reviewed_rejected',
      'actual_candidate_review_complete_cost_reconciliation_required',
    ]),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  sourceAuthenticatedVerifierV1: z.object({
    verificationId: stableIdSchema,
    verificationDigest: digestSchema,
    evidenceClass: z.enum([
      'contract_verifier_path_proof_only',
      'canonical_authenticated_runtime',
    ]),
    state: z.enum([
      'contract_verifier_path_proven_non_promotable',
      'canonical_authenticated_review_submission_verified_not_selected',
    ]),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  exactLineage: z.object({
    objectiveQaEvidenceDigest: digestSchema,
    reviewHandoffDigest: digestSchema,
    reviewContextDigest: digestSchema,
    freshnessDigest: digestSchema,
    requestAuthorityDigest: digestSchema,
    candidatePrivateObjectIdentityHash: digestSchema,
    candidateSha256: digestSchema,
    candidateByteLength: z.number().int().min(44).max(24 * 1024 * 1024),
    candidateDurationMilliseconds: z.number().int().positive().max(30_000),
    providerTerminalEvidenceDigest: digestSchema,
    exactReviewLineageBound: z.literal(true),
  }).strict(),
  authenticatedReview: z.object({
    reviewerActorId: stableIdSchema,
    gateCount: z.union([z.literal(5), z.literal(6)]),
    passedGateCount: z.number().int().min(0).max(6),
    failedGateCount: z.number().int().min(0).max(6),
    humanDecision: z.enum(['pass_for_selection_review', 'reject_candidate']),
    reviewSubmissionDigest: digestSchema,
    sourceEvidenceReceiptCount: z.number().int().min(10).max(48),
    sourceEvidenceReceiptSetDigest: digestSchema,
    playbackSessionId: stableIdSchema,
    playbackReceiptDigest: digestSchema,
    completePlaybackCoverageDigest: digestSchema,
    authenticatedDecisionBound: z.boolean(),
    selectionDecisionCreated: z.literal(false),
  }).strict(),
  consumerBinding: z.object({
    immutableV1HistoryPreserved: z.literal(true),
    reviewEvidenceDigestBound: z.literal(true),
    authenticatedVerifierDigestBound: z.literal(true),
    recomputedSubmissionDigestMatches: z.literal(true),
    exactEvidenceReceiptSetMatches: z.literal(true),
    exactPlaybackReceiptMatches: z.literal(true),
    oneReviewerActorMatches: z.literal(true),
    forwardOnlyRecord: z.literal(true),
  }).strict(),
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
    forwardOnlyConsumerBindingIntegrated: z.literal(true),
    contractConsumerPathProven: z.literal(true),
    actualPrivateProviderCandidatePresent: z.boolean(),
    runtimeReceiptReverified: z.boolean(),
    canonicalAuthenticatedReviewEvidenceVerified: z.boolean(),
    actualReviewEvidenceConsumerBound: z.boolean(),
    reviewPassed: z.boolean(),
    reviewRejected: z.boolean(),
    fullCandidateCostReconciliationRequired: z.literal(true),
    readyForSelectionDecision: z.literal(false),
    ms012dAccepted: z.literal(false),
    eligibleForMs012e: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    createOnly: z.literal(true),
    bindingPersisted: z.literal(true),
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
  bindingDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const actual = value.evidenceClass === 'canonical_authenticated_review_binding'
  const passed = value.authenticatedReview.failedGateCount === 0
  const expectedState = !actual
    ? 'contract_authenticated_review_binding_proven_non_promotable'
    : passed
      ? 'canonical_authenticated_review_bound_cost_reconciliation_required'
      : 'canonical_authenticated_review_bound_rejected'
  if (
    value.state !== expectedState ||
    value.sourceReviewEvidenceV1.evidenceClass !== (actual
      ? 'canonical_backend_verified_runtime'
      : 'contract_shaped_server_path_proof_only') ||
    value.sourceAuthenticatedVerifierV1.evidenceClass !== (actual
      ? 'canonical_authenticated_runtime'
      : 'contract_verifier_path_proof_only') ||
    value.authenticatedReview.authenticatedDecisionBound !== actual ||
    value.cost.providerAttemptCostEvidenceActual !== actual ||
    value.readiness.actualPrivateProviderCandidatePresent !== actual ||
    value.readiness.runtimeReceiptReverified !== actual ||
    value.readiness.canonicalAuthenticatedReviewEvidenceVerified !== actual ||
    value.readiness.actualReviewEvidenceConsumerBound !== actual ||
    value.readiness.reviewPassed !== (actual && passed) ||
    value.readiness.reviewRejected !== (actual && !passed)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['evidenceClass'],
      message: 'Authenticated review consumer binding provenance cannot be promoted or relabelled.',
    })
  }
  if (
    value.authenticatedReview.passedGateCount +
      value.authenticatedReview.failedGateCount !== value.authenticatedReview.gateCount ||
    value.authenticatedReview.humanDecision !== (passed
      ? 'pass_for_selection_review'
      : 'reject_candidate')
  ) {
    context.addIssue({
      code: 'custom',
      path: ['authenticatedReview'],
      message: 'Authenticated review consumer decision does not match the complete gate set.',
    })
  }
})

export type MotionStudioProviderCandidateAuthenticatedReviewBindingV2 =
  z.infer<typeof motionStudioProviderCandidateAuthenticatedReviewBindingV2Schema>

export async function bindMotionStudioProviderCandidateAuthenticatedReviewEvidence(input: {
  reviewEvidence: MotionStudioProviderCandidateReviewEvidenceV1
  authenticatedVerifier: MotionStudioProviderCandidateAuthenticatedReviewVerifierV1
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioProviderCandidateAuthenticatedReviewBindingV2> {
  assertMotionStudioProviderCandidateReviewEvidence(input.reviewEvidence)
  assertMotionStudioProviderCandidateAuthenticatedReviewVerifier(input.authenticatedVerifier)
  const reviewEvidence = motionStudioProviderCandidateReviewEvidenceV1Schema.parse(
    input.reviewEvidence,
  )
  const authenticatedVerifier =
    motionStudioProviderCandidateAuthenticatedReviewVerifierV1Schema.parse(
      input.authenticatedVerifier,
    )
  assertRoot(input.localStorageRoot)
  const evidenceClass = resolveEvidenceClass(reviewEvidence, authenticatedVerifier)
  validateImmutableSourceRecords(reviewEvidence, authenticatedVerifier)
  validateExactLineage(reviewEvidence, authenticatedVerifier)
  const projectedSubmission = projectReviewSubmission(reviewEvidence)
  const reviewSubmissionDigest = sha256CanonicalJson(projectedSubmission)
  if (reviewSubmissionDigest !== authenticatedVerifier.reviewSubmission.submissionDigest) {
    blocked('Authenticated review verifier does not bind the exact normalized review submission.')
  }
  validateEvidenceReceiptSet(reviewEvidence, authenticatedVerifier)
  validatePlaybackReceipt(reviewEvidence, authenticatedVerifier)
  await verifyPersistedSources(
    input.localStorageRoot,
    reviewEvidence,
    authenticatedVerifier,
  )
  const createdAt = exactIso(input.createdAt)
  if (
    Date.parse(createdAt) < Date.parse(reviewEvidence.createdAt) ||
    Date.parse(createdAt) < Date.parse(authenticatedVerifier.createdAt)
  ) invalid('Authenticated review consumer binding cannot predate either immutable source record.')

  const actual = evidenceClass === 'canonical_authenticated_review_binding'
  const passedGateCount = reviewEvidence.gateResults.filter(
    (result) => result.result === 'passed',
  ).length
  const failedGateCount = reviewEvidence.gateResults.length - passedGateCount
  const sourceEvidenceReceiptSetDigest = sha256CanonicalJson(
    authenticatedVerifier.sourceEvidenceReceipts,
  )
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_authenticated_review_binding_v2',
    evidenceClass,
    reviewEvidenceDigest: reviewEvidence.reviewEvidenceDigest,
    authenticatedVerifierDigest: authenticatedVerifier.verificationDigest,
    reviewSubmissionDigest,
    sourceEvidenceReceiptSetDigest,
    playbackReceiptDigest: authenticatedVerifier.playbackReceipt.receiptDigest,
  })
  const existing = await readMotionStudioProviderCandidateAuthenticatedReviewBinding({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash,
  })
  if (existing) return existing
  const base = {
    schemaVersion:
      MOTION_STUDIO_PROVIDER_CANDIDATE_AUTHENTICATED_REVIEW_BINDING_SCHEMA_VERSION,
    bindingId: `ms012d-authenticated-review-binding-${evidenceObjectIdentityHash.slice(0, 24)}`,
    evidenceClass,
    state: !actual
      ? 'contract_authenticated_review_binding_proven_non_promotable' as const
      : failedGateCount === 0
        ? 'canonical_authenticated_review_bound_cost_reconciliation_required' as const
        : 'canonical_authenticated_review_bound_rejected' as const,
    createdAt,
    intent: reviewEvidence.intent,
    workspaceId: reviewEvidence.workspaceId,
    projectId: reviewEvidence.projectId,
    editSessionId: reviewEvidence.editSessionId,
    productionId: reviewEvidence.productionId,
    approvedSnapshotId: reviewEvidence.approvedSnapshotId,
    approvedSnapshotDigest: reviewEvidence.approvedSnapshotDigest,
    sourceReviewEvidenceV1: {
      reviewEvidenceId: reviewEvidence.reviewEvidenceId,
      reviewEvidenceDigest: reviewEvidence.reviewEvidenceDigest,
      evidenceClass: reviewEvidence.evidenceClass,
      state: reviewEvidence.state,
      evidenceObjectIdentityHash: reviewEvidence.persistence.evidenceObjectIdentityHash,
    },
    sourceAuthenticatedVerifierV1: {
      verificationId: authenticatedVerifier.verificationId,
      verificationDigest: authenticatedVerifier.verificationDigest,
      evidenceClass: authenticatedVerifier.evidenceClass,
      state: authenticatedVerifier.state,
      evidenceObjectIdentityHash:
        authenticatedVerifier.persistence.evidenceObjectIdentityHash,
    },
    exactLineage: {
      objectiveQaEvidenceDigest: reviewEvidence.sourceObjectiveQa.evidenceDigest,
      reviewHandoffDigest: reviewEvidence.sourceReviewHandoff.handoffDigest,
      reviewContextDigest: reviewEvidence.sourceReviewContext.reviewContextDigest,
      freshnessDigest: reviewEvidence.sourceReviewContext.freshnessDigest,
      requestAuthorityDigest:
        reviewEvidence.sourceReviewContext.currentRequestAuthorityDigest,
      candidatePrivateObjectIdentityHash:
        reviewEvidence.candidate.privateObjectIdentityHash,
      candidateSha256: reviewEvidence.candidate.sha256,
      candidateByteLength: reviewEvidence.candidate.byteLength,
      candidateDurationMilliseconds: reviewEvidence.candidate.durationMilliseconds,
      providerTerminalEvidenceDigest:
        reviewEvidence.providerAttempt.terminalEvidenceDigest,
      exactReviewLineageBound: true as const,
    },
    authenticatedReview: {
      reviewerActorId: reviewEvidence.humanReview.reviewerActorId,
      gateCount: reviewEvidence.gateResults.length as 5 | 6,
      passedGateCount,
      failedGateCount,
      humanDecision: reviewEvidence.humanReview.decision,
      reviewSubmissionDigest,
      sourceEvidenceReceiptCount:
        authenticatedVerifier.sourceEvidenceReceipts.length,
      sourceEvidenceReceiptSetDigest,
      playbackSessionId: reviewEvidence.humanReview.playbackSessionId,
      playbackReceiptDigest: authenticatedVerifier.playbackReceipt.receiptDigest,
      completePlaybackCoverageDigest:
        authenticatedVerifier.playbackReceipt.playbackCoverageDigest,
      authenticatedDecisionBound: actual,
      selectionDecisionCreated: false as const,
    },
    consumerBinding: {
      immutableV1HistoryPreserved: true as const,
      reviewEvidenceDigestBound: true as const,
      authenticatedVerifierDigestBound: true as const,
      recomputedSubmissionDigestMatches: true as const,
      exactEvidenceReceiptSetMatches: true as const,
      exactPlaybackReceiptMatches: true as const,
      oneReviewerActorMatches: true as const,
      forwardOnlyRecord: true as const,
    },
    cost: {
      providerAttemptTotalInternalProductionCostMicros:
        reviewEvidence.cost.providerAttemptTotalInternalProductionCostMicros,
      providerAttemptCostEvidenceDigest:
        reviewEvidence.cost.providerAttemptCostEvidenceDigest,
      providerAttemptCostEvidenceActual: actual,
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
      forwardOnlyConsumerBindingIntegrated: true as const,
      contractConsumerPathProven: true as const,
      actualPrivateProviderCandidatePresent: actual,
      runtimeReceiptReverified: actual,
      canonicalAuthenticatedReviewEvidenceVerified: actual,
      actualReviewEvidenceConsumerBound: actual,
      reviewPassed: actual && failedGateCount === 0,
      reviewRejected: actual && failedGateCount > 0,
      fullCandidateCostReconciliationRequired: true as const,
      readyForSelectionDecision: false as const,
      ms012dAccepted: false as const,
      eligibleForMs012e: false as const,
      productReady: false as const,
    },
    persistence: {
      privateLocalOnly: true as const,
      createOnly: true as const,
      bindingPersisted: true as const,
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    sideEffects: {
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
    },
    immutable: true as const,
  }
  const record = deepFreeze(
    motionStudioProviderCandidateAuthenticatedReviewBindingV2Schema.parse({
      ...base,
      bindingDigest: sha256CanonicalJson(base),
    }),
  )
  await persistBinding(input.localStorageRoot, record)
  return record
}

export function assertMotionStudioProviderCandidateAuthenticatedReviewBinding(
  input: MotionStudioProviderCandidateAuthenticatedReviewBindingV2,
): void {
  const parsed = motionStudioProviderCandidateAuthenticatedReviewBindingV2Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.bindingDigest
  if (
    sha256CanonicalJson(base) !== parsed.bindingDigest ||
    parsed.readiness.readyForSelectionDecision || parsed.readiness.ms012dAccepted ||
    parsed.readiness.eligibleForMs012e || parsed.readiness.productReady ||
    parsed.authenticatedReview.selectionDecisionCreated ||
    parsed.sideEffects.providerSubmissionCount !== 0 ||
    parsed.sideEffects.secretPayloadReadCount !== 0 ||
    parsed.sideEffects.reviewEvidenceSubmissionCount !== 0 ||
    parsed.sideEffects.humanReviewDecisionCount !== 0 ||
    parsed.sideEffects.selectionCount !== 0 ||
    parsed.sideEffects.finalMixMutationCount !== 0 ||
    parsed.sideEffects.timelineMutationCount !== 0 || parsed.sideEffects.renderCount !== 0 ||
    parsed.sideEffects.exportCount !== 0 || parsed.sideEffects.remoteMutationCount !== 0
  ) blocked('Authenticated review consumer binding crossed its verification boundary.')
}

export async function readMotionStudioProviderCandidateAuthenticatedReviewBinding(input: {
  localStorageRoot: string
  evidenceObjectIdentityHash: string
}): Promise<MotionStudioProviderCandidateAuthenticatedReviewBindingV2 | null> {
  assertRoot(input.localStorageRoot)
  if (!/^[a-f0-9]{64}$/u.test(input.evidenceObjectIdentityHash)) {
    invalid('Authenticated review consumer binding identity is invalid.')
  }
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: bindingRelativePath(input.evidenceObjectIdentityHash),
  })
  if (!bytes) return null
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked('Persisted authenticated review consumer binding is not canonical JSON.')
  }
  const record = deepFreeze(
    motionStudioProviderCandidateAuthenticatedReviewBindingV2Schema.parse(decoded),
  )
  assertMotionStudioProviderCandidateAuthenticatedReviewBinding(record)
  const canonicalBytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  if (!bytes.equals(canonicalBytes)) {
    blocked('Persisted authenticated review consumer binding is not canonical serialization.')
  }
  return record
}

function resolveEvidenceClass(
  reviewEvidence: MotionStudioProviderCandidateReviewEvidenceV1,
  verifier: MotionStudioProviderCandidateAuthenticatedReviewVerifierV1,
): z.infer<typeof evidenceClassSchema> {
  if (
    reviewEvidence.evidenceClass === 'contract_shaped_server_path_proof_only' &&
    verifier.evidenceClass === 'contract_verifier_path_proof_only'
  ) return 'contract_authenticated_review_binding_path_proof_only'
  if (
    reviewEvidence.evidenceClass === 'canonical_backend_verified_runtime' &&
    verifier.evidenceClass === 'canonical_authenticated_runtime'
  ) return 'canonical_authenticated_review_binding'
  blocked('Authenticated review consumer cannot combine different evidence classes.')
}

function validateExactLineage(
  reviewEvidence: MotionStudioProviderCandidateReviewEvidenceV1,
  verifier: MotionStudioProviderCandidateAuthenticatedReviewVerifierV1,
): void {
  if (
    reviewEvidence.workspaceId !== verifier.workspaceId ||
    reviewEvidence.projectId !== verifier.projectId ||
    reviewEvidence.editSessionId !== verifier.editSessionId ||
    reviewEvidence.productionId !== verifier.productionId ||
    reviewEvidence.approvedSnapshotId !== verifier.approvedSnapshotId ||
    reviewEvidence.approvedSnapshotDigest !== verifier.approvedSnapshotDigest ||
    reviewEvidence.intent !== verifier.intent ||
    reviewEvidence.sourceObjectiveQa.evidenceDigest !==
      verifier.sourceAuthority.objectiveQaEvidenceDigest ||
    reviewEvidence.sourceReviewHandoff.handoffDigest !==
      verifier.sourceAuthority.reviewHandoffDigest ||
    reviewEvidence.sourceReviewContext.reviewContextDigest !==
      verifier.sourceAuthority.reviewContextDigest ||
    reviewEvidence.sourceReviewContext.freshnessDigest !==
      verifier.sourceAuthority.freshnessDigest ||
    reviewEvidence.sourceReviewContext.currentRequestAuthorityDigest !==
      verifier.sourceAuthority.requestAuthorityDigest ||
    reviewEvidence.candidate.privateObjectIdentityHash !==
      verifier.sourceAuthority.candidatePrivateObjectIdentityHash ||
    reviewEvidence.candidate.sha256 !== verifier.sourceAuthority.candidateSha256 ||
    reviewEvidence.candidate.byteLength !== verifier.sourceAuthority.candidateByteLength ||
    reviewEvidence.candidate.durationMilliseconds !==
      verifier.sourceAuthority.candidateDurationMilliseconds
  ) blocked('Authenticated review consumer requires exact review and verifier lineage.')
  const reviewerIds = new Set([
    ...reviewEvidence.gateResults.map((result) => result.reviewerActorId),
    reviewEvidence.humanReview.reviewerActorId,
    verifier.authenticatedActor.actorUserId,
    verifier.playbackReceipt.authenticatedReviewerActorId,
  ])
  if (reviewerIds.size !== 1) {
    blocked('Authenticated review consumer requires one exact reviewer actor.')
  }
}

function validateImmutableSourceRecords(
  reviewEvidence: MotionStudioProviderCandidateReviewEvidenceV1,
  verifier: MotionStudioProviderCandidateAuthenticatedReviewVerifierV1,
): void {
  for (const result of reviewEvidence.gateResults) {
    for (const item of result.evidenceItems) {
      const itemBase = {
        kind: item.kind,
        evidenceId: item.evidenceId,
        sourceRecordDigest: item.sourceRecordDigest,
        sourceClass: item.sourceClass,
        privateOnly: item.privateOnly,
        rawPayloadPersisted: item.rawPayloadPersisted,
        localPathProjected: item.localPathProjected,
      }
      if (item.itemDigest !== sha256CanonicalJson(itemBase)) {
        blocked('Authenticated review consumer found changed nested review evidence.')
      }
    }
    const resultBase = {
      gate: result.gate,
      requirementDigest: result.requirementDigest,
      result: result.result,
      reviewerActorId: result.reviewerActorId,
      note: result.note,
      reviewedAt: result.reviewedAt,
      evidenceItems: result.evidenceItems,
    }
    if (result.resultDigest !== sha256CanonicalJson(resultBase)) {
      blocked('Authenticated review consumer found a changed gate-result digest.')
    }
  }
  const playbackBase = {
    playbackSessionId: reviewEvidence.humanReview.playbackSessionId,
    playbackContext: reviewEvidence.humanReview.playbackContext,
    reviewerActorId: reviewEvidence.humanReview.reviewerActorId,
    candidateSha256: reviewEvidence.humanReview.candidateSha256,
    reviewContextDigest: reviewEvidence.humanReview.reviewContextDigest,
    startedAt: reviewEvidence.humanReview.startedAt,
    completedAt: reviewEvidence.humanReview.completedAt,
    completeCandidatePlaybackAttested:
      reviewEvidence.humanReview.completeCandidatePlaybackAttested,
    privateMediaChecksumVerifiedBeforePlayback:
      reviewEvidence.humanReview.privateMediaChecksumVerifiedBeforePlayback,
    explicitAttestationText: reviewEvidence.humanReview.explicitAttestationText,
    decision: reviewEvidence.humanReview.decision,
  }
  if (reviewEvidence.humanReview.playbackDigest !== sha256CanonicalJson(playbackBase)) {
    blocked('Authenticated review consumer found a changed human-playback digest.')
  }
  const reviewIdentity = sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_review_evidence_v1',
    evidenceClass: reviewEvidence.evidenceClass,
    objectiveQaEvidenceDigest: reviewEvidence.sourceObjectiveQa.evidenceDigest,
    reviewHandoffDigest: reviewEvidence.sourceReviewHandoff.handoffDigest,
    reviewContextDigest: reviewEvidence.sourceReviewContext.reviewContextDigest,
    freshnessDigest: reviewEvidence.sourceReviewContext.freshnessDigest,
    gateResultsDigest: sha256CanonicalJson(reviewEvidence.gateResults),
    playbackDigest: reviewEvidence.humanReview.playbackDigest,
  })
  if (
    reviewEvidence.persistence.evidenceObjectIdentityHash !== reviewIdentity ||
    reviewEvidence.reviewEvidenceId !== `ms012d-review-evidence-${reviewIdentity.slice(0, 24)}`
  ) blocked('Authenticated review consumer found an invalid V1 review-record identity.')

  for (const receipt of verifier.sourceEvidenceReceipts) {
    const receiptBase = {
      gate: receipt.gate,
      kind: receipt.kind,
      evidenceId: receipt.evidenceId,
      sourceClass: receipt.sourceClass,
      sourceRecordDigest: receipt.sourceRecordDigest,
      authorityReceiptDigest: receipt.authorityReceiptDigest,
      actualAuthorityReadbackVerified: receipt.actualAuthorityReadbackVerified,
      privateOnly: receipt.privateOnly,
      rawPayloadPersisted: receipt.rawPayloadPersisted,
      localPathProjected: receipt.localPathProjected,
    }
    if (receipt.receiptDigest !== sha256CanonicalJson(receiptBase)) {
      blocked('Authenticated review consumer found a changed source-authority receipt.')
    }
  }
  const verifierPlaybackBase = {
    playbackSessionId: verifier.playbackReceipt.playbackSessionId,
    authenticatedReviewerActorId:
      verifier.playbackReceipt.authenticatedReviewerActorId,
    candidateSha256: verifier.playbackReceipt.candidateSha256,
    reviewContextDigest: verifier.playbackReceipt.reviewContextDigest,
    privateMediaReadReceiptDigest:
      verifier.playbackReceipt.privateMediaReadReceiptDigest,
    playbackCoverageDigest: verifier.playbackReceipt.playbackCoverageDigest,
    candidateDurationMilliseconds:
      verifier.playbackReceipt.candidateDurationMilliseconds,
    coverageStartMilliseconds: verifier.playbackReceipt.coverageStartMilliseconds,
    coverageEndMilliseconds: verifier.playbackReceipt.coverageEndMilliseconds,
    unverifiedGapMilliseconds: verifier.playbackReceipt.unverifiedGapMilliseconds,
    privateMediaChecksumVerified:
      verifier.playbackReceipt.privateMediaChecksumVerified,
    completePlaybackAttested: verifier.playbackReceipt.completePlaybackAttested,
    actualAuthenticatedPrivatePlaybackVerified:
      verifier.playbackReceipt.actualAuthenticatedPrivatePlaybackVerified,
  }
  if (verifier.playbackReceipt.receiptDigest !== sha256CanonicalJson(verifierPlaybackBase)) {
    blocked('Authenticated review consumer found a changed private-playback receipt.')
  }
  const verifierIdentity = sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_authenticated_review_verifier_v1',
    evidenceClass: verifier.evidenceClass,
    submissionDigest: verifier.reviewSubmission.submissionDigest,
    actorUserId: verifier.authenticatedActor.actorUserId,
    sourceReceiptSetDigest: sha256CanonicalJson(verifier.sourceEvidenceReceipts),
    playbackReceiptDigest: verifier.playbackReceipt.receiptDigest,
  })
  if (
    verifier.persistence.evidenceObjectIdentityHash !== verifierIdentity ||
    verifier.verificationId !== `ms012d-authenticated-review-${verifierIdentity.slice(0, 24)}`
  ) blocked('Authenticated review consumer found an invalid verifier identity.')
}

function projectReviewSubmission(reviewEvidence: MotionStudioProviderCandidateReviewEvidenceV1) {
  return {
    objectiveQaEvidenceDigest: reviewEvidence.sourceObjectiveQa.evidenceDigest,
    reviewHandoffDigest: reviewEvidence.sourceReviewHandoff.handoffDigest,
    reviewContextDigest: reviewEvidence.sourceReviewContext.reviewContextDigest,
    freshnessDigest: reviewEvidence.sourceReviewContext.freshnessDigest,
    gateReviews: reviewEvidence.gateResults.map((result) => ({
      gate: result.gate,
      requirementDigest: result.requirementDigest,
      result: result.result,
      reviewerActorId: result.reviewerActorId,
      note: result.note,
      reviewedAt: result.reviewedAt,
      evidenceItems: result.evidenceItems.map((item) => ({
        kind: item.kind,
        evidenceId: item.evidenceId,
        sourceRecordDigest: item.sourceRecordDigest,
        sourceClass: item.sourceClass,
      })),
    })),
    humanPlayback: {
      playbackSessionId: reviewEvidence.humanReview.playbackSessionId,
      playbackContext: reviewEvidence.humanReview.playbackContext,
      reviewerActorId: reviewEvidence.humanReview.reviewerActorId,
      candidateSha256: reviewEvidence.humanReview.candidateSha256,
      reviewContextDigest: reviewEvidence.humanReview.reviewContextDigest,
      startedAt: reviewEvidence.humanReview.startedAt,
      completedAt: reviewEvidence.humanReview.completedAt,
      completeCandidatePlaybackAttested:
        reviewEvidence.humanReview.completeCandidatePlaybackAttested,
      privateMediaChecksumVerifiedBeforePlayback:
        reviewEvidence.humanReview.privateMediaChecksumVerifiedBeforePlayback,
      explicitAttestationText: reviewEvidence.humanReview.explicitAttestationText,
    },
  }
}

function validateEvidenceReceiptSet(
  reviewEvidence: MotionStudioProviderCandidateReviewEvidenceV1,
  verifier: MotionStudioProviderCandidateAuthenticatedReviewVerifierV1,
): void {
  const expected = reviewEvidence.gateResults.flatMap((result) =>
    result.evidenceItems.map((item) => ({
      gate: result.gate,
      kind: item.kind,
      evidenceId: item.evidenceId,
      sourceClass: item.sourceClass,
      sourceRecordDigest: item.sourceRecordDigest,
    })))
  if (expected.length !== verifier.sourceEvidenceReceipts.length) {
    blocked('Authenticated review consumer evidence receipt count changed.')
  }
  for (const [index, item] of expected.entries()) {
    const receipt = verifier.sourceEvidenceReceipts[index]
    if (
      !receipt || receipt.gate !== item.gate || receipt.kind !== item.kind ||
      receipt.evidenceId !== item.evidenceId || receipt.sourceClass !== item.sourceClass ||
      receipt.sourceRecordDigest !== item.sourceRecordDigest
    ) blocked('Authenticated review consumer evidence receipt set changed.')
  }
}

function validatePlaybackReceipt(
  reviewEvidence: MotionStudioProviderCandidateReviewEvidenceV1,
  verifier: MotionStudioProviderCandidateAuthenticatedReviewVerifierV1,
): void {
  const receipt = verifier.playbackReceipt
  if (
    receipt.playbackSessionId !== reviewEvidence.humanReview.playbackSessionId ||
    receipt.authenticatedReviewerActorId !== reviewEvidence.humanReview.reviewerActorId ||
    receipt.candidateSha256 !== reviewEvidence.candidate.sha256 ||
    receipt.reviewContextDigest !== reviewEvidence.sourceReviewContext.reviewContextDigest ||
    receipt.candidateDurationMilliseconds !== reviewEvidence.candidate.durationMilliseconds ||
    receipt.coverageStartMilliseconds !== 0 ||
    receipt.coverageEndMilliseconds !== reviewEvidence.candidate.durationMilliseconds ||
    receipt.unverifiedGapMilliseconds !== 0 || !receipt.privateMediaChecksumVerified ||
    !receipt.completePlaybackAttested
  ) blocked('Authenticated review consumer playback receipt changed exact complete coverage.')
}

async function verifyPersistedSources(
  root: string,
  reviewEvidence: MotionStudioProviderCandidateReviewEvidenceV1,
  verifier: MotionStudioProviderCandidateAuthenticatedReviewVerifierV1,
): Promise<void> {
  const [storedReviewEvidence, storedVerifier] = await Promise.all([
    readPrivateFileIfExistsWithinRoot({
      rootPath: root,
      relativePath: `motion-studio/provider-candidate-review-evidence/${reviewEvidence.persistence.evidenceObjectIdentityHash.slice(0, 2)}/${reviewEvidence.persistence.evidenceObjectIdentityHash}.json`,
    }),
    readPrivateFileIfExistsWithinRoot({
      rootPath: root,
      relativePath: `motion-studio/provider-candidate-authenticated-review-verifier/${verifier.persistence.evidenceObjectIdentityHash.slice(0, 2)}/${verifier.persistence.evidenceObjectIdentityHash}.json`,
    }),
  ])
  if (!storedReviewEvidence || !storedVerifier) {
    blocked('Authenticated review consumer requires both exact create-only source records.')
  }
  const expectedReviewBytes = Buffer.from(
    `${stableAuthorityStringify(reviewEvidence)}\n`,
    'utf8',
  )
  const expectedVerifierBytes = Buffer.from(
    `${stableAuthorityStringify(verifier)}\n`,
    'utf8',
  )
  if (
    !storedReviewEvidence.equals(expectedReviewBytes) ||
    !storedVerifier.equals(expectedVerifierBytes)
  ) blocked('Authenticated review consumer source readback changed canonical bytes.')
}

async function persistBinding(
  root: string,
  record: MotionStudioProviderCandidateAuthenticatedReviewBindingV2,
): Promise<void> {
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: root,
    relativePath: bindingRelativePath(record.persistence.evidenceObjectIdentityHash),
    content: bytes,
  })
  const stored = await readMotionStudioProviderCandidateAuthenticatedReviewBinding({
    localStorageRoot: root,
    evidenceObjectIdentityHash: record.persistence.evidenceObjectIdentityHash,
  })
  if (!stored || stored.bindingDigest !== record.bindingDigest) {
    blocked('Authenticated review consumer binding changed after create-only persistence.')
  }
}

function bindingRelativePath(identity: string): string {
  return `motion-studio/provider-candidate-authenticated-review-binding/${identity.slice(0, 2)}/${identity}.json`
}

function assertRoot(root: string): void {
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u.test(root)) {
    invalid('Authenticated review consumer requires the exact bounded private-ingest root.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Authenticated review consumer time must be canonical ISO-8601.')
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
    requiredGate: 'motion_studio_provider_candidate_authenticated_review_binding',
  })
}
