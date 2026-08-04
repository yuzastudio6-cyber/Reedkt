import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { motionStudioSpeechSegmentRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioSpeechSegmentRequestV1,
  MotionStudioVersionReference,
} from '../../../src/types/motion-studio'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechC3ReviewReconciliationRecord,
  readMotionStudioSpeechC3ReviewReconciliation,
  type MotionStudioSpeechC3ReviewReconciliationV1,
} from './review-reconciliation'

const SHA256 = /^[a-f0-9]{64}$/u
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const MAXIMUM_REVIEW_RECORD_BYTES = 2 * 1024 * 1024
const MINIMUM_SEGMENTS = 2
const MAXIMUM_SEGMENTS = 512

export const MOTION_STUDIO_SPEECH_PRODUCTION_CONTINUITY_GATES = Object.freeze([
  'voice_identity_and_timbre',
  'performance_direction',
  'pace_transition',
  'loudness_transition',
  'pronunciation_consistency',
] as const)

export type MotionStudioSpeechProductionContinuityGate =
  typeof MOTION_STUDIO_SPEECH_PRODUCTION_CONTINUITY_GATES[number]

export type MotionStudioSpeechProductionContinuityCandidateEvidenceClass =
  | 'contract_only_hypothetical_c3'
  | 'persisted_private_provider_c3_readback'

const trustedScopes = new WeakMap<object, string>()
const trustedCandidates = new WeakMap<object, string>()
const trustedReviews = new WeakMap<object, string>()
const trustedReconciliations = new WeakMap<object, string>()

export interface MotionStudioSpeechProductionContinuityScopeV1 {
  schemaVersion: 'motion-studio.speech-production-continuity-scope.v1'
  continuityScopeId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  preparedScriptArtifactVersion: MotionStudioVersionReference
  voiceBibleArtifactVersion: MotionStudioVersionReference
  voiceBibleContentDigest: string
  voiceBindingId: string
  voiceIdentityHash: string
  language: string
  timingAuthorityDigest: string
  expectedVoiceSegmentIds: readonly string[]
  expectedVoiceSegmentCoverageDigest: string
  createdAt: string
  immutable: true
  scopeDigest: string
}

export interface MotionStudioSpeechProductionContinuityCandidateEvidenceV1 {
  schemaVersion: 'motion-studio.speech-production-continuity-candidate.v1'
  evidenceClass: MotionStudioSpeechProductionContinuityCandidateEvidenceClass
  persistedPrivateC3ReadbackVerified: boolean
  continuityScopeDigest: string
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  preparedScriptArtifactVersion: MotionStudioVersionReference
  voiceBibleArtifactVersion: MotionStudioVersionReference
  voiceBibleContentDigest: string
  voiceBindingId: string
  voiceIdentityHash: string
  language: string
  timingAuthorityDigest: string
  candidateTakeId: string
  speechRequestId: string
  speechRequestDigest: string
  approvedWorkItemId: string
  jobId: string
  attemptId: string
  leaseId: string
  costBudgetId: string
  voiceSegmentId: string
  preparedScriptSegmentId: string
  chapterId: string
  sceneId: string
  segmentOrder: number
  startFrame: number
  endFrame: number
  normalizedAudioSha256: string
  alignmentDigest: string
  c3ReviewObjectIdentityHash: string
  c3ReviewReconciliationDigest: string
  individualHumanQaPassed: true
  individuallyEligibleForLaterSelectionReview: true
  selected: false
  finalAssetEligible: false
  timelineMutationPerformed: false
  createdAt: string
  immutable: true
  evidenceDigest: string
}

export interface MotionStudioSpeechProductionContinuityTransitionReviewV1 {
  transitionIndex: number
  fromCandidateTakeId: string
  toCandidateTakeId: string
  fromVoiceSegmentId: string
  toVoiceSegmentId: string
  fromCandidateEvidenceDigest: string
  toCandidateEvidenceDigest: string
  privatePlaybackEvidenceDigest: string
  completeTransitionPlaybackAttested: true
  results: readonly {
    gate: MotionStudioSpeechProductionContinuityGate
    result: 'passed' | 'failed'
    evidenceId: string
    note: string
  }[]
  transitionPassed: boolean
  transitionReviewDigest: string
}

export interface MotionStudioSpeechProductionContinuityReviewV1 {
  schemaVersion: 'motion-studio.speech-production-continuity-review.v1'
  candidateEvidenceClass: MotionStudioSpeechProductionContinuityCandidateEvidenceClass
  persistedPrivateC3ReadbackVerified: boolean
  providerC3BackingDigest: string | null
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  continuityReviewId: string
  continuityScopeDigest: string
  reviewerActorId: string
  decision: 'pass_production_continuity' | 'reject_production_continuity'
  candidateEvidenceDigests: readonly string[]
  transitions: readonly MotionStudioSpeechProductionContinuityTransitionReviewV1[]
  reviewerAttestationAccepted: true
  providerCallCount: 0
  mediaExecutionCount: 0
  selectionDecisionCreated: false
  timelineMutationPerformed: false
  persistence: {
    privateLocalOnly: true
    createOnly: true
    browserProjectionAllowed: false
    reviewObjectIdentityHash: string
    relativePath: string
  }
  reviewedAt: string
  immutable: true
  reviewDigest: string
}

export interface MotionStudioSpeechProductionContinuityProviderC3Backing {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  segments: readonly {
    c3ReviewObjectIdentityHash: string
    c3ReviewReconciliationDigest: string
    candidateTakeId: string
    speechRequestId: string
  }[]
}

export interface MotionStudioSpeechProductionContinuityReconciliationV1 {
  schemaVersion: 'motion-studio.speech-production-continuity-reconciliation.v1'
  evidenceClass: MotionStudioSpeechProductionContinuityCandidateEvidenceClass
  state:
    | 'production_continuity_passed_awaiting_ms012c_reconciliation_and_ms012e_selection'
    | 'contract_only_continuity_verified_actual_evidence_open'
    | 'production_continuity_rejected'
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  continuityScopeId: string
  continuityScopeDigest: string
  preparedScriptArtifactVersion: MotionStudioVersionReference
  voiceBibleArtifactVersion: MotionStudioVersionReference
  voiceBibleContentDigest: string
  voiceBindingId: string
  voiceIdentityHash: string
  language: string
  timingAuthorityDigest: string
  expectedVoiceSegmentCoverageDigest: string
  expectedVoiceSegmentIds: readonly string[]
  candidateCount: number
  segmentCoverage: readonly {
    segmentOrder: number
    voiceSegmentId: string
    preparedScriptSegmentId: string
    candidateTakeId: string
    speechRequestId: string
    speechRequestDigest: string
    candidateEvidenceDigest: string
    c3ReviewObjectIdentityHash: string
    c3ReviewReconciliationDigest: string
    startFrame: number
    endFrame: number
  }[]
  candidateEvidenceDigests: readonly string[]
  c3ReviewObjectIdentityHashes: readonly string[]
  c3ReviewReconciliationDigests: readonly string[]
  continuityReviewId: string
  continuityReviewDigest: string
  continuityReviewObjectIdentityHash: string
  transitionCount: number
  transitionReviewDigests: readonly string[]
  continuity: {
    everyExpectedVoiceSegmentCovered: true
    everyAdjacentTransitionReviewed: true
    singleCandidateCannotQualify: true
    allTransitionsPassed: boolean
    contractVerificationPassed: boolean
    persistedPrivateProviderEvidenceReviewed: boolean
    productionMultiTakeContinuityProven: boolean
  }
  cost: {
    incrementalProviderCallCount: 0
    incrementalMediaExecutionCount: 0
    incrementalInternalProductionCostMicros: 0
    customerPricingIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
    billingMutationPerformed: false
  }
  selection: {
    eligibleForExplicitSelection: false
    selectionDecisionCreated: false
    selected: false
    firstTakeAutoAccepted: false
    finalAssetEligible: false
    finalNarrationMutationPerformed: false
    timelineMutationPerformed: false
  }
  readiness: {
    productionContinuityReviewComplete: true
    contractVerificationOnly: boolean
    productionMultiTakeContinuityEvidenceComplete: boolean
    ms012cAccepted: false
    ms012eSelectionRequired: boolean
    productReady: false
    externalBetaReady: false
    productionReady: false
    finalDeliveryReady: false
  }
  persistence: {
    privateLocalOnly: true
    createOnly: true
    browserProjectionAllowed: false
    recordObjectIdentityHash: string
    relativePath: string
  }
  createdAt: string
  immutable: true
  recordDigest: string
}

export function createMotionStudioSpeechProductionContinuityScope(input: {
  continuityScopeId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  preparedScriptArtifactVersion: MotionStudioVersionReference
  voiceBibleArtifactVersion: MotionStudioVersionReference
  voiceBibleContentDigest: string
  voiceBindingId: string
  voiceIdentityHash: string
  language: string
  timingAuthorityDigest: string
  expectedVoiceSegmentIds: readonly string[]
  createdAt: string
}): MotionStudioSpeechProductionContinuityScopeV1 {
  for (const [value, label] of [
    [input.continuityScopeId, 'continuity scope ID'],
    [input.workspaceId, 'workspace ID'],
    [input.projectId, 'project ID'],
    [input.editSessionId, 'edit session ID'],
    [input.productionId, 'production ID'],
    [input.approvedSnapshotId, 'approved snapshot ID'],
    [input.voiceBindingId, 'voice binding ID'],
  ] as const) stableId(value, label)
  for (const digest of [
    input.approvedSnapshotDigest,
    input.voiceBibleContentDigest,
    input.voiceIdentityHash,
    input.timingAuthorityDigest,
  ]) validDigest(digest, 'continuity scope digest')
  const preparedScriptArtifactVersion = validateVersionReference(input.preparedScriptArtifactVersion)
  const voiceBibleArtifactVersion = validateVersionReference(input.voiceBibleArtifactVersion)
  const language = safeLanguage(input.language)
  if (
    input.expectedVoiceSegmentIds.length < MINIMUM_SEGMENTS ||
    input.expectedVoiceSegmentIds.length > MAXIMUM_SEGMENTS
  ) {
    blocked('Production continuity requires between two and five-hundred-twelve voice segments.')
  }
  const expectedVoiceSegmentIds = input.expectedVoiceSegmentIds.map((segmentId) =>
    stableId(segmentId, 'expected voice segment ID'))
  if (new Set(expectedVoiceSegmentIds).size !== expectedVoiceSegmentIds.length) {
    blocked('Production continuity scope contains duplicate voice segments.')
  }
  const expectedVoiceSegmentCoverageDigest = sha256CanonicalJson({
    preparedScriptArtifactVersion,
    voiceBibleArtifactVersion,
    voiceBibleContentDigest: input.voiceBibleContentDigest,
    expectedVoiceSegmentIds,
  })
  const base: Omit<MotionStudioSpeechProductionContinuityScopeV1, 'scopeDigest'> = {
    schemaVersion: 'motion-studio.speech-production-continuity-scope.v1',
    continuityScopeId: input.continuityScopeId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    productionId: input.productionId,
    approvedSnapshotId: input.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedSnapshotDigest,
    preparedScriptArtifactVersion,
    voiceBibleArtifactVersion,
    voiceBibleContentDigest: input.voiceBibleContentDigest,
    voiceBindingId: input.voiceBindingId,
    voiceIdentityHash: input.voiceIdentityHash,
    language,
    timingAuthorityDigest: input.timingAuthorityDigest,
    expectedVoiceSegmentIds,
    expectedVoiceSegmentCoverageDigest,
    createdAt: exactIso(input.createdAt, 'continuity scope creation time'),
    immutable: true,
  }
  const scope = deepFreeze({ ...base, scopeDigest: sha256CanonicalJson(base) })
  trustedScopes.set(scope, scope.scopeDigest)
  return scope
}

export async function createMotionStudioSpeechProductionContinuityCandidateEvidenceFromPrivateC3Readback(
  input: {
    localStorageRoot: string
    scope: MotionStudioSpeechProductionContinuityScopeV1
    request: MotionStudioSpeechSegmentRequestV1
    reviewObjectIdentityHash: string
  },
): Promise<MotionStudioSpeechProductionContinuityCandidateEvidenceV1> {
  const scope = assertTrustedScope(input.scope)
  validDigest(input.reviewObjectIdentityHash, 'Speech C3 private review identity')
  const c3Review = await readMotionStudioSpeechC3ReviewReconciliation({
    localStorageRoot: input.localStorageRoot,
    reviewObjectIdentityHash: input.reviewObjectIdentityHash,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    productionId: scope.productionId,
  })
  if (!c3Review) {
    blocked('Production continuity requires exact persisted private C3 review evidence.')
  }
  return compileMotionStudioSpeechProductionContinuityCandidateEvidenceInternal(
    {
      scope,
      request: input.request,
      c3Review,
    },
    'persisted_private_provider_c3_readback',
  )
}

/**
 * Deterministic contract-test compiler. Its output is always marked as
 * hypothetical and can never prove production continuity, even when the
 * supplied C3-shaped record is structurally valid. Production orchestration
 * must enter through the private-readback function above.
 */
export function compileMotionStudioSpeechProductionContinuityCandidateEvidence(input: {
  scope: MotionStudioSpeechProductionContinuityScopeV1
  request: MotionStudioSpeechSegmentRequestV1
  c3Review: MotionStudioSpeechC3ReviewReconciliationV1
}): MotionStudioSpeechProductionContinuityCandidateEvidenceV1 {
  return compileMotionStudioSpeechProductionContinuityCandidateEvidenceInternal(
    input,
    'contract_only_hypothetical_c3',
  )
}

function compileMotionStudioSpeechProductionContinuityCandidateEvidenceInternal(
  input: {
    scope: MotionStudioSpeechProductionContinuityScopeV1
    request: MotionStudioSpeechSegmentRequestV1
    c3Review: MotionStudioSpeechC3ReviewReconciliationV1
  },
  evidenceClass: MotionStudioSpeechProductionContinuityCandidateEvidenceClass,
): MotionStudioSpeechProductionContinuityCandidateEvidenceV1 {
  const scope = assertTrustedScope(input.scope)
  const request = motionStudioSpeechSegmentRequestV1Schema.parse(input.request)
  const review = assertEligibleC3Review(input.c3Review)
  const segmentOrder = scope.expectedVoiceSegmentIds.indexOf(request.voiceSegmentId)
  if (segmentOrder < 0) blocked('Continuity candidate is not an expected Voice Bible segment.')
  if (
    request.workspaceId !== scope.workspaceId || request.projectId !== scope.projectId ||
    request.editSessionId !== scope.editSessionId || request.productionId !== scope.productionId ||
    request.approvedSnapshotId !== scope.approvedSnapshotId ||
    request.approvedSnapshotDigest !== scope.approvedSnapshotDigest ||
    !sameVersionReference(
      request.preparedScriptArtifactVersion,
      scope.preparedScriptArtifactVersion,
    ) ||
    !sameVersionReference(request.voiceBibleArtifactVersion, scope.voiceBibleArtifactVersion) ||
    request.voiceBibleContentDigest !== scope.voiceBibleContentDigest ||
    request.voice.voiceBindingId !== scope.voiceBindingId ||
    request.voice.voiceIdentityHash !== scope.voiceIdentityHash ||
    request.language !== scope.language || request.timingAuthorityDigest !== scope.timingAuthorityDigest ||
    request.executionBoundary.protocolSimulatorOnly !== false ||
    request.voice.catalogBindingStatus !== 'verified_provider_catalog' ||
    request.voice.verifiedProviderCatalogVoice !== true ||
    review.workspaceId !== scope.workspaceId || review.projectId !== scope.projectId ||
    review.editSessionId !== scope.editSessionId || review.productionId !== scope.productionId ||
    review.speechRequestId !== request.speechRequestId ||
    review.attemptId !== request.attemptId || review.costBudgetId !== request.costBudgetId
  ) blocked('Continuity candidate does not bind the exact production, script, Voice Bible, voice, or request scope.')
  if (request.range.startFrame < 0 || request.range.endFrame <= request.range.startFrame) {
    blocked('Continuity candidate has an invalid frame range.')
  }
  const base: Omit<MotionStudioSpeechProductionContinuityCandidateEvidenceV1, 'evidenceDigest'> = {
    schemaVersion: 'motion-studio.speech-production-continuity-candidate.v1',
    evidenceClass,
    persistedPrivateC3ReadbackVerified:
      evidenceClass === 'persisted_private_provider_c3_readback',
    continuityScopeDigest: scope.scopeDigest,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    productionId: scope.productionId,
    approvedSnapshotId: scope.approvedSnapshotId,
    approvedSnapshotDigest: scope.approvedSnapshotDigest,
    preparedScriptArtifactVersion: scope.preparedScriptArtifactVersion,
    voiceBibleArtifactVersion: scope.voiceBibleArtifactVersion,
    voiceBibleContentDigest: scope.voiceBibleContentDigest,
    voiceBindingId: scope.voiceBindingId,
    voiceIdentityHash: scope.voiceIdentityHash,
    language: scope.language,
    timingAuthorityDigest: scope.timingAuthorityDigest,
    candidateTakeId: review.candidateTakeId,
    speechRequestId: request.speechRequestId,
    speechRequestDigest: sha256CanonicalJson(request),
    approvedWorkItemId: request.approvedWorkItemId,
    jobId: request.jobId,
    attemptId: request.attemptId,
    leaseId: request.leaseId,
    costBudgetId: request.costBudgetId,
    voiceSegmentId: request.voiceSegmentId,
    preparedScriptSegmentId: request.preparedScriptSegmentId,
    chapterId: request.chapterId,
    sceneId: request.sceneId,
    segmentOrder,
    startFrame: request.range.startFrame,
    endFrame: request.range.endFrame,
    normalizedAudioSha256: review.normalizedAudioSha256,
    alignmentDigest: review.alignmentDigest,
    c3ReviewObjectIdentityHash: review.persistence.reviewObjectIdentityHash,
    c3ReviewReconciliationDigest: review.recordDigest,
    individualHumanQaPassed: true,
    individuallyEligibleForLaterSelectionReview: true,
    selected: false,
    finalAssetEligible: false,
    timelineMutationPerformed: false,
    createdAt: review.createdAt,
    immutable: true,
  }
  const evidence = deepFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
  trustedCandidates.set(evidence, evidence.evidenceDigest)
  return evidence
}

export function createMotionStudioSpeechProductionContinuityReview(input: {
  scope: MotionStudioSpeechProductionContinuityScopeV1
  candidates: readonly MotionStudioSpeechProductionContinuityCandidateEvidenceV1[]
  continuityReviewId: string
  reviewerActorId: string
  decision: MotionStudioSpeechProductionContinuityReviewV1['decision']
  transitions: readonly Omit<
    MotionStudioSpeechProductionContinuityTransitionReviewV1,
    'transitionPassed' | 'transitionReviewDigest'
  >[]
  reviewedAt: string
}): MotionStudioSpeechProductionContinuityReviewV1 {
  const scope = assertTrustedScope(input.scope)
  stableId(input.continuityReviewId, 'continuity review ID')
  stableId(input.reviewerActorId, 'continuity reviewer actor ID')
  const candidates = assertCompleteCandidateSet(scope, input.candidates)
  if (input.transitions.length !== candidates.length - 1) {
    blocked('Production continuity requires one review for every adjacent candidate transition.')
  }
  const transitions = input.transitions.map((transition, index) => {
    const from = candidates[index]!
    const to = candidates[index + 1]!
    if (
      transition.transitionIndex !== index ||
      transition.fromCandidateTakeId !== from.candidateTakeId ||
      transition.toCandidateTakeId !== to.candidateTakeId ||
      transition.fromVoiceSegmentId !== from.voiceSegmentId ||
      transition.toVoiceSegmentId !== to.voiceSegmentId ||
      transition.fromCandidateEvidenceDigest !== from.evidenceDigest ||
      transition.toCandidateEvidenceDigest !== to.evidenceDigest ||
      transition.completeTransitionPlaybackAttested !== true ||
      !SHA256.test(transition.privatePlaybackEvidenceDigest)
    ) blocked('Continuity transition does not bind exact adjacent candidate playback evidence.')
    if (transition.results.length !== MOTION_STUDIO_SPEECH_PRODUCTION_CONTINUITY_GATES.length) {
      blocked('Continuity transition is missing required listening gates.')
    }
    const results = transition.results.map((result, resultIndex) => {
      if (
        result.gate !== MOTION_STUDIO_SPEECH_PRODUCTION_CONTINUITY_GATES[resultIndex] ||
        !['passed', 'failed'].includes(result.result)
      ) blocked('Continuity transition gates are invalid or out of order.')
      return {
        gate: result.gate,
        result: result.result,
        evidenceId: stableId(result.evidenceId, 'continuity gate evidence ID'),
        note: safeNote(result.note),
      }
    })
    const transitionPassed = results.every((result) => result.result === 'passed')
    const transitionBase = {
      transitionIndex: index,
      fromCandidateTakeId: from.candidateTakeId,
      toCandidateTakeId: to.candidateTakeId,
      fromVoiceSegmentId: from.voiceSegmentId,
      toVoiceSegmentId: to.voiceSegmentId,
      fromCandidateEvidenceDigest: from.evidenceDigest,
      toCandidateEvidenceDigest: to.evidenceDigest,
      privatePlaybackEvidenceDigest: transition.privatePlaybackEvidenceDigest,
      completeTransitionPlaybackAttested: true as const,
      results,
      transitionPassed,
    }
    return deepFreeze({
      ...transitionBase,
      transitionReviewDigest: sha256CanonicalJson(transitionBase),
    })
  })
  const allTransitionsPassed = transitions.every((transition) => transition.transitionPassed)
  if (
    (input.decision === 'pass_production_continuity') !== allTransitionsPassed ||
    !['pass_production_continuity', 'reject_production_continuity'].includes(input.decision)
  ) blocked('Production continuity decision does not match its transition gates.')
  const reviewObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion-studio-speech-production-continuity-review-v1',
    continuityScopeDigest: scope.scopeDigest,
    continuityReviewId: input.continuityReviewId,
  })
  const providerBacking = providerC3BackingFromCandidates(scope, candidates)
  const base: Omit<MotionStudioSpeechProductionContinuityReviewV1, 'reviewDigest'> = {
    schemaVersion: 'motion-studio.speech-production-continuity-review.v1',
    candidateEvidenceClass: candidates[0]!.evidenceClass,
    persistedPrivateC3ReadbackVerified: candidates.every((candidate) =>
      candidate.persistedPrivateC3ReadbackVerified),
    providerC3BackingDigest: providerBacking ? sha256CanonicalJson(providerBacking) : null,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    productionId: scope.productionId,
    approvedSnapshotId: scope.approvedSnapshotId,
    approvedSnapshotDigest: scope.approvedSnapshotDigest,
    continuityReviewId: input.continuityReviewId,
    continuityScopeDigest: scope.scopeDigest,
    reviewerActorId: input.reviewerActorId,
    decision: input.decision,
    candidateEvidenceDigests: candidates.map((candidate) => candidate.evidenceDigest),
    transitions,
    reviewerAttestationAccepted: true,
    providerCallCount: 0,
    mediaExecutionCount: 0,
    selectionDecisionCreated: false,
    timelineMutationPerformed: false,
    persistence: {
      privateLocalOnly: true,
      createOnly: true,
      browserProjectionAllowed: false,
      reviewObjectIdentityHash,
      relativePath: continuityReviewRelativePath(reviewObjectIdentityHash),
    },
    reviewedAt: exactIso(input.reviewedAt, 'production continuity review time'),
    immutable: true,
  }
  if (Date.parse(base.reviewedAt) < Math.max(...candidates.map((candidate) => Date.parse(candidate.createdAt)))) {
    blocked('Production continuity review cannot predate its newest candidate review.')
  }
  const review = deepFreeze({ ...base, reviewDigest: sha256CanonicalJson(base) })
  trustedReviews.set(review, review.reviewDigest)
  return review
}

export async function persistMotionStudioSpeechProductionContinuityReview(input: {
  localStorageRoot: string
  scope: MotionStudioSpeechProductionContinuityScopeV1
  candidates: readonly MotionStudioSpeechProductionContinuityCandidateEvidenceV1[]
  review: MotionStudioSpeechProductionContinuityReviewV1
}): Promise<MotionStudioSpeechProductionContinuityReviewV1> {
  const scope = assertTrustedScope(input.scope)
  const candidates = assertCompleteCandidateSet(scope, input.candidates)
  const review = assertTrustedReview(input.review, scope, candidates)
  const providerBacking = providerC3BackingFromCandidates(scope, candidates)
  const existing = await readMotionStudioSpeechProductionContinuityReview({
    localStorageRoot: input.localStorageRoot,
    reviewObjectIdentityHash: review.persistence.reviewObjectIdentityHash,
    reviewDigest: review.reviewDigest,
    continuityScopeDigest: review.continuityScopeDigest,
    workspaceId: review.workspaceId,
    projectId: review.projectId,
    editSessionId: review.editSessionId,
    productionId: review.productionId,
    approvedSnapshotId: review.approvedSnapshotId,
    approvedSnapshotDigest: review.approvedSnapshotDigest,
    ...(providerBacking ? { providerBacking } : {}),
  })
  if (existing) return existing
  const envelope = {
    recordVersion: 'motion-studio-speech-production-continuity-review-record-v1' as const,
    checksumSha256: review.reviewDigest,
    review,
  }
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: review.persistence.relativePath,
    content: Buffer.from(`${JSON.stringify(envelope)}\n`, 'utf8'),
  })
  const stored = await readMotionStudioSpeechProductionContinuityReview({
    localStorageRoot: input.localStorageRoot,
    reviewObjectIdentityHash: review.persistence.reviewObjectIdentityHash,
    reviewDigest: review.reviewDigest,
    continuityScopeDigest: review.continuityScopeDigest,
    workspaceId: review.workspaceId,
    projectId: review.projectId,
    editSessionId: review.editSessionId,
    productionId: review.productionId,
    approvedSnapshotId: review.approvedSnapshotId,
    approvedSnapshotDigest: review.approvedSnapshotDigest,
    ...(providerBacking ? { providerBacking } : {}),
  })
  if (!stored || stored.reviewDigest !== review.reviewDigest) {
    blocked('Production continuity review changed during create-only private persistence.')
  }
  return stored
}

export async function readMotionStudioSpeechProductionContinuityReview(input: {
  localStorageRoot: string
  reviewObjectIdentityHash: string
  reviewDigest: string
  continuityScopeDigest: string
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  providerBacking?: MotionStudioSpeechProductionContinuityProviderC3Backing
}): Promise<MotionStudioSpeechProductionContinuityReviewV1 | undefined> {
  validDigest(input.reviewObjectIdentityHash, 'production continuity review object identity')
  validDigest(input.reviewDigest, 'production continuity review digest')
  validDigest(input.continuityScopeDigest, 'production continuity review scope digest')
  for (const [value, label] of [
    [input.workspaceId, 'workspace ID'], [input.projectId, 'project ID'],
    [input.editSessionId, 'edit session ID'], [input.productionId, 'production ID'],
    [input.approvedSnapshotId, 'approved snapshot ID'],
  ] as const) stableId(value, `production continuity review ${label}`)
  validDigest(input.approvedSnapshotDigest, 'production continuity review approved snapshot digest')
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: continuityReviewRelativePath(input.reviewObjectIdentityHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 256 || bytes.byteLength > MAXIMUM_REVIEW_RECORD_BYTES) {
    blocked('Production continuity review is outside its private evidence byte bound.')
  }
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString('utf8')) as unknown } catch {
    blocked('Production continuity review is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    blocked('Production continuity review persistence envelope is invalid.')
  }
  const envelope = parsed as Record<string, unknown>
  assertExactKeys(
    envelope,
    ['checksumSha256', 'recordVersion', 'review'],
    'production continuity review envelope',
  )
  if (
    envelope.recordVersion !== 'motion-studio-speech-production-continuity-review-record-v1' ||
    envelope.checksumSha256 !== input.reviewDigest ||
    !envelope.review || typeof envelope.review !== 'object' || Array.isArray(envelope.review)
  ) blocked('Production continuity review persistence envelope fields are invalid.')
  const review = assertContinuityReviewRecord(
    envelope.review as MotionStudioSpeechProductionContinuityReviewV1,
  )
  if (
    review.reviewDigest !== input.reviewDigest ||
    review.continuityScopeDigest !== input.continuityScopeDigest ||
    review.workspaceId !== input.workspaceId || review.projectId !== input.projectId ||
    review.editSessionId !== input.editSessionId || review.productionId !== input.productionId ||
    review.approvedSnapshotId !== input.approvedSnapshotId ||
    review.approvedSnapshotDigest !== input.approvedSnapshotDigest ||
    review.persistence.reviewObjectIdentityHash !== input.reviewObjectIdentityHash
  ) blocked('Production continuity review belongs to a different tenant, scope, or immutable record.')
  if (review.candidateEvidenceClass === 'persisted_private_provider_c3_readback') {
    if (!input.providerBacking) {
      blocked('Provider-backed continuity review requires its exact private C3 evidence chain.')
    }
    if (input.providerBacking.segments.length !== review.candidateEvidenceDigests.length) {
      blocked('Provider-backed continuity review has incomplete private C3 segment coverage.')
    }
    const providerBacking = assertProviderC3BackingShape(input.providerBacking)
    if (
      providerBacking.workspaceId !== review.workspaceId ||
      providerBacking.projectId !== review.projectId ||
      providerBacking.editSessionId !== review.editSessionId ||
      providerBacking.productionId !== review.productionId ||
      sha256CanonicalJson(providerBacking) !== review.providerC3BackingDigest
    ) {
      blocked('Provider-backed continuity review does not match its immutable private C3 backing.')
    }
    await assertPersistedPrivateProviderC3SegmentsBacking({
      localStorageRoot: input.localStorageRoot,
      backing: providerBacking,
    })
  } else if (input.providerBacking) {
    blocked('Contract-only continuity review cannot receive provider C3 backing.')
  }
  trustedReviews.set(review, review.reviewDigest)
  return review
}

export function compileMotionStudioSpeechProductionContinuityReconciliation(input: {
  scope: MotionStudioSpeechProductionContinuityScopeV1
  candidates: readonly MotionStudioSpeechProductionContinuityCandidateEvidenceV1[]
  review: MotionStudioSpeechProductionContinuityReviewV1
}): MotionStudioSpeechProductionContinuityReconciliationV1 {
  const scope = assertTrustedScope(input.scope)
  const candidates = assertCompleteCandidateSet(scope, input.candidates)
  const review = assertTrustedReview(input.review, scope, candidates)
  const passed = review.decision === 'pass_production_continuity'
  const persistedPrivateProviderEvidence =
    review.candidateEvidenceClass === 'persisted_private_provider_c3_readback' &&
    review.persistedPrivateC3ReadbackVerified &&
    candidates.every((candidate) =>
      candidate.evidenceClass === 'persisted_private_provider_c3_readback' &&
      candidate.persistedPrivateC3ReadbackVerified)
  const productionMultiTakeContinuityProven = passed && persistedPrivateProviderEvidence
  const baseWithoutPersistence = {
    schemaVersion: 'motion-studio.speech-production-continuity-reconciliation.v1' as const,
    evidenceClass: review.candidateEvidenceClass,
    state: productionMultiTakeContinuityProven
      ? 'production_continuity_passed_awaiting_ms012c_reconciliation_and_ms012e_selection' as const
      : passed
        ? 'contract_only_continuity_verified_actual_evidence_open' as const
        : 'production_continuity_rejected' as const,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    productionId: scope.productionId,
    approvedSnapshotId: scope.approvedSnapshotId,
    approvedSnapshotDigest: scope.approvedSnapshotDigest,
    continuityScopeId: scope.continuityScopeId,
    continuityScopeDigest: scope.scopeDigest,
    preparedScriptArtifactVersion: scope.preparedScriptArtifactVersion,
    voiceBibleArtifactVersion: scope.voiceBibleArtifactVersion,
    voiceBibleContentDigest: scope.voiceBibleContentDigest,
    voiceBindingId: scope.voiceBindingId,
    voiceIdentityHash: scope.voiceIdentityHash,
    language: scope.language,
    timingAuthorityDigest: scope.timingAuthorityDigest,
    expectedVoiceSegmentCoverageDigest: scope.expectedVoiceSegmentCoverageDigest,
    expectedVoiceSegmentIds: scope.expectedVoiceSegmentIds,
    candidateCount: candidates.length,
    segmentCoverage: candidates.map((candidate) => ({
      segmentOrder: candidate.segmentOrder,
      voiceSegmentId: candidate.voiceSegmentId,
      preparedScriptSegmentId: candidate.preparedScriptSegmentId,
      candidateTakeId: candidate.candidateTakeId,
      speechRequestId: candidate.speechRequestId,
      speechRequestDigest: candidate.speechRequestDigest,
      candidateEvidenceDigest: candidate.evidenceDigest,
      c3ReviewObjectIdentityHash: candidate.c3ReviewObjectIdentityHash,
      c3ReviewReconciliationDigest: candidate.c3ReviewReconciliationDigest,
      startFrame: candidate.startFrame,
      endFrame: candidate.endFrame,
    })),
    candidateEvidenceDigests: candidates.map((candidate) => candidate.evidenceDigest),
    c3ReviewObjectIdentityHashes:
      candidates.map((candidate) => candidate.c3ReviewObjectIdentityHash),
    c3ReviewReconciliationDigests:
      candidates.map((candidate) => candidate.c3ReviewReconciliationDigest),
    continuityReviewId: review.continuityReviewId,
    continuityReviewDigest: review.reviewDigest,
    continuityReviewObjectIdentityHash: review.persistence.reviewObjectIdentityHash,
    transitionCount: review.transitions.length,
    transitionReviewDigests:
      review.transitions.map((transition) => transition.transitionReviewDigest),
    continuity: {
      everyExpectedVoiceSegmentCovered: true as const,
      everyAdjacentTransitionReviewed: true as const,
      singleCandidateCannotQualify: true as const,
      allTransitionsPassed: passed,
      contractVerificationPassed: passed,
      persistedPrivateProviderEvidenceReviewed: persistedPrivateProviderEvidence,
      productionMultiTakeContinuityProven,
    },
    cost: {
      incrementalProviderCallCount: 0 as const,
      incrementalMediaExecutionCount: 0 as const,
      incrementalInternalProductionCostMicros: 0 as const,
      customerPricingIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      billingMutationPerformed: false as const,
    },
    selection: {
      eligibleForExplicitSelection: false as const,
      selectionDecisionCreated: false as const,
      selected: false as const,
      firstTakeAutoAccepted: false as const,
      finalAssetEligible: false as const,
      finalNarrationMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
    },
    readiness: {
      productionContinuityReviewComplete: true as const,
      contractVerificationOnly: passed && !persistedPrivateProviderEvidence,
      productionMultiTakeContinuityEvidenceComplete: productionMultiTakeContinuityProven,
      ms012cAccepted: false as const,
      ms012eSelectionRequired: productionMultiTakeContinuityProven,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      finalDeliveryReady: false as const,
    },
    createdAt: review.reviewedAt,
    immutable: true as const,
  }
  const recordObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion-studio-speech-production-continuity-record-v1',
    continuityScopeDigest: scope.scopeDigest,
    continuityReviewDigest: review.reviewDigest,
  })
  const base: Omit<MotionStudioSpeechProductionContinuityReconciliationV1, 'recordDigest'> = {
    ...baseWithoutPersistence,
    persistence: {
      privateLocalOnly: true,
      createOnly: true,
      browserProjectionAllowed: false,
      recordObjectIdentityHash,
      relativePath: continuityRecordRelativePath(recordObjectIdentityHash),
    },
  }
  const record = deepFreeze({ ...base, recordDigest: sha256CanonicalJson(base) })
  trustedReconciliations.set(record, record.recordDigest)
  return record
}

export async function persistMotionStudioSpeechProductionContinuityReconciliation(input: {
  localStorageRoot: string
  record: MotionStudioSpeechProductionContinuityReconciliationV1
}): Promise<MotionStudioSpeechProductionContinuityReconciliationV1> {
  const record = assertTrustedReconciliation(input.record)
  await assertPersistedContinuityReviewBacking({
    localStorageRoot: input.localStorageRoot,
    record,
  })
  const existing = await readMotionStudioSpeechProductionContinuityReconciliation({
    localStorageRoot: input.localStorageRoot,
    recordObjectIdentityHash: record.persistence.recordObjectIdentityHash,
    recordDigest: record.recordDigest,
    workspaceId: record.workspaceId,
    projectId: record.projectId,
    editSessionId: record.editSessionId,
    productionId: record.productionId,
  })
  if (existing) return existing
  const envelope = {
    recordVersion: 'motion-studio-speech-production-continuity-record-v1' as const,
    checksumSha256: record.recordDigest,
    record,
  }
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: record.persistence.relativePath,
    content: Buffer.from(`${JSON.stringify(envelope)}\n`, 'utf8'),
  })
  const stored = await readMotionStudioSpeechProductionContinuityReconciliation({
    localStorageRoot: input.localStorageRoot,
    recordObjectIdentityHash: record.persistence.recordObjectIdentityHash,
    recordDigest: record.recordDigest,
    workspaceId: record.workspaceId,
    projectId: record.projectId,
    editSessionId: record.editSessionId,
    productionId: record.productionId,
  })
  if (!stored || stored.recordDigest !== record.recordDigest) {
    blocked('Production continuity record changed during create-only private persistence.')
  }
  return stored
}

export async function readMotionStudioSpeechProductionContinuityReconciliation(input: {
  localStorageRoot: string
  recordObjectIdentityHash: string
  recordDigest: string
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
}): Promise<MotionStudioSpeechProductionContinuityReconciliationV1 | undefined> {
  validDigest(input.recordObjectIdentityHash, 'production continuity object identity hash')
  validDigest(input.recordDigest, 'production continuity record digest')
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: continuityRecordRelativePath(input.recordObjectIdentityHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 256 || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    blocked('Production continuity record is outside its private evidence byte bound.')
  }
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString('utf8')) as unknown } catch {
    blocked('Production continuity record is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    blocked('Production continuity persistence envelope is invalid.')
  }
  const envelope = parsed as Record<string, unknown>
  assertExactKeys(envelope, ['checksumSha256', 'record', 'recordVersion'], 'continuity envelope')
  if (
    envelope.recordVersion !== 'motion-studio-speech-production-continuity-record-v1' ||
    envelope.checksumSha256 !== input.recordDigest ||
    !envelope.record || typeof envelope.record !== 'object' || Array.isArray(envelope.record)
  ) blocked('Production continuity persistence envelope fields are invalid.')
  const record = assertContinuityRecord(
    envelope.record as MotionStudioSpeechProductionContinuityReconciliationV1,
  )
  if (
    record.recordDigest !== input.recordDigest ||
    record.persistence.recordObjectIdentityHash !== input.recordObjectIdentityHash ||
    record.workspaceId !== input.workspaceId ||
    record.projectId !== input.projectId || record.editSessionId !== input.editSessionId ||
    record.productionId !== input.productionId
  ) blocked('Production continuity record belongs to a different tenant or production scope.')
  await assertPersistedContinuityReviewBacking({
    localStorageRoot: input.localStorageRoot,
    record,
  })
  trustedReconciliations.set(record, record.recordDigest)
  return record
}

async function assertPersistedContinuityReviewBacking(input: {
  localStorageRoot: string
  record: MotionStudioSpeechProductionContinuityReconciliationV1
}): Promise<void> {
  const review = await readMotionStudioSpeechProductionContinuityReview({
    localStorageRoot: input.localStorageRoot,
    reviewObjectIdentityHash: input.record.continuityReviewObjectIdentityHash,
    reviewDigest: input.record.continuityReviewDigest,
    continuityScopeDigest: input.record.continuityScopeDigest,
    workspaceId: input.record.workspaceId,
    projectId: input.record.projectId,
    editSessionId: input.record.editSessionId,
    productionId: input.record.productionId,
    approvedSnapshotId: input.record.approvedSnapshotId,
    approvedSnapshotDigest: input.record.approvedSnapshotDigest,
    ...(input.record.evidenceClass === 'persisted_private_provider_c3_readback'
      ? { providerBacking: providerC3BackingFromRecord(input.record) }
      : {}),
  })
  if (!review) {
    blocked('Production continuity lost its exact persisted private human review.')
  }
  const contractPassed = review.decision === 'pass_production_continuity'
  if (
    review.persistence.reviewObjectIdentityHash !==
      input.record.continuityReviewObjectIdentityHash ||
    review.candidateEvidenceClass !== input.record.evidenceClass ||
    review.persistedPrivateC3ReadbackVerified !==
      (input.record.evidenceClass === 'persisted_private_provider_c3_readback') ||
    review.candidateEvidenceDigests.length !== input.record.candidateEvidenceDigests.length ||
    review.candidateEvidenceDigests.some(
      (digest, index) => digest !== input.record.candidateEvidenceDigests[index],
    ) ||
    review.transitions.length !== input.record.transitionReviewDigests.length ||
    review.transitions.some(
      (transition, index) => {
        const from = input.record.segmentCoverage[index]
        const to = input.record.segmentCoverage[index + 1]
        return !from || !to ||
          transition.transitionReviewDigest !== input.record.transitionReviewDigests[index] ||
          transition.fromCandidateTakeId !== from.candidateTakeId ||
          transition.toCandidateTakeId !== to.candidateTakeId ||
          transition.fromVoiceSegmentId !== from.voiceSegmentId ||
          transition.toVoiceSegmentId !== to.voiceSegmentId ||
          transition.fromCandidateEvidenceDigest !== from.candidateEvidenceDigest ||
          transition.toCandidateEvidenceDigest !== to.candidateEvidenceDigest
      },
    ) ||
    contractPassed !== input.record.continuity.contractVerificationPassed
  ) blocked('Production continuity does not match its persisted private human review.')
}

function providerC3BackingFromCandidates(
  scope: MotionStudioSpeechProductionContinuityScopeV1,
  candidates: readonly MotionStudioSpeechProductionContinuityCandidateEvidenceV1[],
): MotionStudioSpeechProductionContinuityProviderC3Backing | undefined {
  if (candidates[0]?.evidenceClass !== 'persisted_private_provider_c3_readback') {
    return undefined
  }
  return {
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    productionId: scope.productionId,
    segments: candidates.map((candidate) => ({
      c3ReviewObjectIdentityHash: candidate.c3ReviewObjectIdentityHash,
      c3ReviewReconciliationDigest: candidate.c3ReviewReconciliationDigest,
      candidateTakeId: candidate.candidateTakeId,
      speechRequestId: candidate.speechRequestId,
    })),
  }
}

function providerC3BackingFromRecord(
  record: MotionStudioSpeechProductionContinuityReconciliationV1,
): MotionStudioSpeechProductionContinuityProviderC3Backing {
  return {
    workspaceId: record.workspaceId,
    projectId: record.projectId,
    editSessionId: record.editSessionId,
    productionId: record.productionId,
    segments: record.segmentCoverage.map((segment) => ({
      c3ReviewObjectIdentityHash: segment.c3ReviewObjectIdentityHash,
      c3ReviewReconciliationDigest: segment.c3ReviewReconciliationDigest,
      candidateTakeId: segment.candidateTakeId,
      speechRequestId: segment.speechRequestId,
    })),
  }
}

function assertProviderC3BackingShape(
  value: MotionStudioSpeechProductionContinuityProviderC3Backing,
): MotionStudioSpeechProductionContinuityProviderC3Backing {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked('Provider-backed continuity review C3 backing shape is invalid.')
  }
  assertExactKeys(value as unknown as Record<string, unknown>, [
    'editSessionId', 'productionId', 'projectId', 'segments', 'workspaceId',
  ], 'provider-backed continuity review C3 backing')
  if (
    !Array.isArray(value.segments) || value.segments.length < MINIMUM_SEGMENTS ||
    value.segments.length > MAXIMUM_SEGMENTS
  ) blocked('Provider-backed continuity review C3 segment coverage is invalid.')
  for (const [identity, label] of [
    [value.workspaceId, 'workspace ID'], [value.projectId, 'project ID'],
    [value.editSessionId, 'edit session ID'], [value.productionId, 'production ID'],
  ] as const) stableId(identity, `provider-backed continuity review ${label}`)
  const segments = value.segments.map((segment, index) => {
    if (!segment || typeof segment !== 'object' || Array.isArray(segment)) {
      blocked(`Provider-backed continuity review C3 segment ${index} shape is invalid.`)
    }
    assertExactKeys(segment as unknown as Record<string, unknown>, [
      'c3ReviewObjectIdentityHash', 'c3ReviewReconciliationDigest',
      'candidateTakeId', 'speechRequestId',
    ], `provider-backed continuity review C3 segment ${index}`)
    validDigest(segment.c3ReviewObjectIdentityHash, 'provider-backed C3 review object identity')
    validDigest(segment.c3ReviewReconciliationDigest, 'provider-backed C3 review digest')
    stableId(segment.candidateTakeId, 'provider-backed candidate take ID')
    stableId(segment.speechRequestId, 'provider-backed speech request ID')
    return { ...segment }
  })
  for (const field of [
    'c3ReviewObjectIdentityHash', 'c3ReviewReconciliationDigest',
    'candidateTakeId', 'speechRequestId',
  ] as const) {
    if (new Set(segments.map((segment) => segment[field])).size !== segments.length) {
      blocked(`Provider-backed continuity review C3 backing contains duplicate ${field}.`)
    }
  }
  return deepFreeze({
    workspaceId: value.workspaceId,
    projectId: value.projectId,
    editSessionId: value.editSessionId,
    productionId: value.productionId,
    segments,
  })
}

async function assertPersistedPrivateProviderC3SegmentsBacking(input: {
  localStorageRoot: string
  backing: MotionStudioSpeechProductionContinuityProviderC3Backing
}): Promise<void> {
  const backing = assertProviderC3BackingShape(input.backing)
  for (const segment of backing.segments) {
    const c3Review = await readMotionStudioSpeechC3ReviewReconciliation({
      localStorageRoot: input.localStorageRoot,
      reviewObjectIdentityHash: segment.c3ReviewObjectIdentityHash,
      workspaceId: backing.workspaceId,
      projectId: backing.projectId,
      editSessionId: backing.editSessionId,
      productionId: backing.productionId,
    })
    if (!c3Review) {
      blocked('Provider-backed production continuity lost its exact private C3 readback.')
    }
    const verified = assertEligibleC3Review(c3Review)
    if (
      verified.persistence.reviewObjectIdentityHash !== segment.c3ReviewObjectIdentityHash ||
      verified.recordDigest !== segment.c3ReviewReconciliationDigest ||
      verified.candidateTakeId !== segment.candidateTakeId ||
      verified.speechRequestId !== segment.speechRequestId
    ) {
      blocked('Provider-backed production continuity does not match its private C3 evidence.')
    }
  }
}

function assertEligibleC3Review(
  review: MotionStudioSpeechC3ReviewReconciliationV1,
): MotionStudioSpeechC3ReviewReconciliationV1 {
  const verified = assertMotionStudioSpeechC3ReviewReconciliationRecord(review)
  if (
    verified.evidenceClass !== 'provider_single_submission_private_evidence' ||
    verified.state !== 'provider_review_complete_awaiting_ms012e_selection' ||
    verified.review.reviewClass !== 'owner_private_provider_review' ||
    verified.review.ownerReviewRecorded !== true || verified.review.fixtureReviewRecorded !== false ||
    verified.review.decision !== 'pass_for_selection_review' ||
    verified.review.results.length !== 4 ||
    verified.review.results.some((result) => result.result !== 'passed') ||
    verified.selection.eligibleForExplicitSelection !== true ||
    verified.readiness.privateReviewEvidenceReady !== true ||
    verified.readiness.c3ProviderEvidenceComplete !== true ||
    verified.readiness.ms012eSelectionRequired !== true || !Object.isFrozen(verified)
  ) blocked('Production continuity candidate lacks exact eligible immutable C3 owner-review evidence.')
  for (const value of [
    verified.workspaceId, verified.projectId, verified.editSessionId, verified.productionId,
    verified.candidateTakeId, verified.speechRequestId,
  ]) stableId(value, 'C3 continuity reference')
  for (const digest of [
    verified.normalizedAudioSha256, verified.alignmentDigest, verified.postResponseEvidenceDigest,
  ]) validDigest(digest, 'C3 continuity digest')
  exactIso(verified.createdAt, 'C3 continuity review creation time')
  return verified
}

function assertCompleteCandidateSet(
  scope: MotionStudioSpeechProductionContinuityScopeV1,
  candidatesInput: readonly MotionStudioSpeechProductionContinuityCandidateEvidenceV1[],
): readonly MotionStudioSpeechProductionContinuityCandidateEvidenceV1[] {
  if (candidatesInput.length !== scope.expectedVoiceSegmentIds.length) {
    blocked('Production continuity candidate set does not cover every expected voice segment.')
  }
  const expectedEvidenceClass = candidatesInput[0]?.evidenceClass
  if (![
    'contract_only_hypothetical_c3',
    'persisted_private_provider_c3_readback',
  ].includes(expectedEvidenceClass ?? '')) {
    blocked('Production continuity candidate evidence provenance is invalid.')
  }
  const candidates = candidatesInput.map((candidate, index) => {
    if (trustedCandidates.get(candidate) !== candidate.evidenceDigest) {
      blocked('Production continuity requires exact trusted candidate evidence instances.')
    }
    const { evidenceDigest, ...base } = candidate
    if (
      sha256CanonicalJson(base) !== evidenceDigest || candidate.continuityScopeDigest !== scope.scopeDigest ||
      candidate.segmentOrder !== index || candidate.voiceSegmentId !== scope.expectedVoiceSegmentIds[index] ||
      candidate.evidenceClass !== expectedEvidenceClass ||
      candidate.persistedPrivateC3ReadbackVerified !==
        (candidate.evidenceClass === 'persisted_private_provider_c3_readback') ||
      candidate.startFrame < 0 || candidate.endFrame <= candidate.startFrame ||
      (index > 0 && candidate.startFrame < candidatesInput[index - 1]!.endFrame) ||
      candidate.selected !== false || candidate.finalAssetEligible !== false ||
      candidate.timelineMutationPerformed !== false || candidate.immutable !== true ||
      !Object.isFrozen(candidate)
    ) blocked('Production continuity candidate set is stale, reordered, overlapping, or mutable.')
    return candidate
  })
  if (
    new Set(candidates.map((candidate) => candidate.candidateTakeId)).size !== candidates.length ||
    new Set(candidates.map((candidate) => candidate.speechRequestId)).size !== candidates.length ||
    new Set(candidates.map((candidate) => candidate.approvedWorkItemId)).size !== candidates.length ||
    new Set(candidates.map((candidate) => candidate.jobId)).size !== candidates.length ||
    new Set(candidates.map((candidate) => candidate.attemptId)).size !== candidates.length ||
    new Set(candidates.map((candidate) => candidate.leaseId)).size !== candidates.length ||
    new Set(candidates.map((candidate) => candidate.voiceSegmentId)).size !== candidates.length ||
    new Set(candidates.map((candidate) => candidate.preparedScriptSegmentId)).size !== candidates.length ||
    new Set(candidates.map((candidate) => candidate.evidenceDigest)).size !== candidates.length
  ) blocked('Production continuity candidate set contains duplicate identities.')
  return candidates
}

function assertTrustedScope(
  scope: MotionStudioSpeechProductionContinuityScopeV1,
): MotionStudioSpeechProductionContinuityScopeV1 {
  if (trustedScopes.get(scope) !== scope.scopeDigest) {
    blocked('Production continuity requires the exact frozen in-process scope authority.')
  }
  const { scopeDigest, ...base } = scope
  if (sha256CanonicalJson(base) !== scopeDigest || !Object.isFrozen(scope)) {
    blocked('Production continuity scope changed after issuance.')
  }
  return scope
}

function assertTrustedReview(
  review: MotionStudioSpeechProductionContinuityReviewV1,
  scope: MotionStudioSpeechProductionContinuityScopeV1,
  candidates: readonly MotionStudioSpeechProductionContinuityCandidateEvidenceV1[],
): MotionStudioSpeechProductionContinuityReviewV1 {
  review = assertTrustedContinuityReview(review)
  const providerBacking = providerC3BackingFromCandidates(scope, candidates)
  if (
    review.continuityScopeDigest !== scope.scopeDigest ||
    review.workspaceId !== scope.workspaceId || review.projectId !== scope.projectId ||
    review.editSessionId !== scope.editSessionId || review.productionId !== scope.productionId ||
    review.approvedSnapshotId !== scope.approvedSnapshotId ||
    review.approvedSnapshotDigest !== scope.approvedSnapshotDigest ||
    review.candidateEvidenceClass !== candidates[0]!.evidenceClass ||
    review.persistedPrivateC3ReadbackVerified !== candidates.every((candidate) =>
      candidate.evidenceClass === 'persisted_private_provider_c3_readback' &&
      candidate.persistedPrivateC3ReadbackVerified) ||
    review.providerC3BackingDigest !==
      (providerBacking ? sha256CanonicalJson(providerBacking) : null) ||
    review.candidateEvidenceDigests.length !== candidates.length ||
    review.candidateEvidenceDigests.some((digest, index) => digest !== candidates[index]!.evidenceDigest) ||
    review.transitions.length !== candidates.length - 1 || review.providerCallCount !== 0 ||
    review.mediaExecutionCount !== 0 || review.selectionDecisionCreated !== false ||
    review.timelineMutationPerformed !== false || review.immutable !== true || !Object.isFrozen(review)
  ) blocked('Production continuity review changed or lost its exact candidate scope.')
  return review
}

function assertTrustedContinuityReview(
  review: MotionStudioSpeechProductionContinuityReviewV1,
): MotionStudioSpeechProductionContinuityReviewV1 {
  if (trustedReviews.get(review) !== review.reviewDigest) {
    blocked('Production continuity requires the exact frozen review instance.')
  }
  return assertContinuityReviewRecord(review)
}

function assertContinuityReviewRecord(
  review: MotionStudioSpeechProductionContinuityReviewV1,
): MotionStudioSpeechProductionContinuityReviewV1 {
  review = assertContinuityReviewShape(review)
  const { reviewDigest, ...base } = review
  const providerEvidence =
    review.candidateEvidenceClass === 'persisted_private_provider_c3_readback'
  if (
    review.schemaVersion !== 'motion-studio.speech-production-continuity-review.v1' ||
    !['contract_only_hypothetical_c3', 'persisted_private_provider_c3_readback']
      .includes(review.candidateEvidenceClass) ||
    review.persistedPrivateC3ReadbackVerified !== providerEvidence ||
    (providerEvidence
      ? typeof review.providerC3BackingDigest !== 'string' ||
        !SHA256.test(review.providerC3BackingDigest)
      : review.providerC3BackingDigest !== null) ||
    !SHA256.test(reviewDigest) || sha256CanonicalJson(base) !== reviewDigest ||
    review.candidateEvidenceDigests.length < MINIMUM_SEGMENTS ||
    review.candidateEvidenceDigests.length > MAXIMUM_SEGMENTS ||
    review.transitions.length !== review.candidateEvidenceDigests.length - 1 ||
    review.reviewerAttestationAccepted !== true || review.providerCallCount !== 0 ||
    review.mediaExecutionCount !== 0 || review.selectionDecisionCreated !== false ||
    review.timelineMutationPerformed !== false || review.immutable !== true ||
    review.persistence?.privateLocalOnly !== true || review.persistence.createOnly !== true ||
    review.persistence.browserProjectionAllowed !== false ||
    !SHA256.test(review.persistence.reviewObjectIdentityHash) ||
    review.persistence.reviewObjectIdentityHash !== sha256CanonicalJson({
      domain: 'motion-studio-speech-production-continuity-review-v1',
      continuityScopeDigest: review.continuityScopeDigest,
      continuityReviewId: review.continuityReviewId,
    }) ||
    review.persistence.relativePath !==
      continuityReviewRelativePath(review.persistence.reviewObjectIdentityHash)
  ) blocked('Production continuity review contains invalid authority or persistence state.')
  for (const [value, label] of [
    [review.workspaceId, 'workspace ID'], [review.projectId, 'project ID'],
    [review.editSessionId, 'edit session ID'], [review.productionId, 'production ID'],
    [review.approvedSnapshotId, 'approved snapshot ID'],
    [review.continuityReviewId, 'continuity review ID'],
    [review.reviewerActorId, 'continuity reviewer actor ID'],
  ] as const) stableId(value, `persisted continuity review ${label}`)
  validDigest(review.approvedSnapshotDigest, 'persisted continuity review approved snapshot digest')
  validDigest(review.continuityScopeDigest, 'persisted continuity scope digest')
  exactIso(review.reviewedAt, 'persisted continuity review time')
  review.candidateEvidenceDigests.forEach((digest) =>
    validDigest(digest, 'persisted continuity candidate evidence digest'))
  if (new Set(review.candidateEvidenceDigests).size !== review.candidateEvidenceDigests.length) {
    blocked('Production continuity review contains duplicate candidate evidence.')
  }
  review.transitions.forEach((transition, index) => {
    assertExactKeys(transition as unknown as Record<string, unknown>, [
      'completeTransitionPlaybackAttested', 'fromCandidateEvidenceDigest',
      'fromCandidateTakeId', 'fromVoiceSegmentId', 'privatePlaybackEvidenceDigest',
      'results', 'toCandidateEvidenceDigest', 'toCandidateTakeId', 'toVoiceSegmentId',
      'transitionIndex', 'transitionPassed', 'transitionReviewDigest',
    ], `production continuity transition review ${index}`)
    if (
      transition.transitionIndex !== index ||
      transition.fromCandidateEvidenceDigest !== review.candidateEvidenceDigests[index] ||
      transition.toCandidateEvidenceDigest !== review.candidateEvidenceDigests[index + 1] ||
      transition.completeTransitionPlaybackAttested !== true ||
      !SHA256.test(transition.privatePlaybackEvidenceDigest) ||
      !Array.isArray(transition.results) ||
      transition.results.length !== MOTION_STUDIO_SPEECH_PRODUCTION_CONTINUITY_GATES.length
    ) blocked('Persisted continuity transition lost its exact adjacent playback evidence.')
    for (const value of [
      transition.fromCandidateTakeId, transition.toCandidateTakeId,
      transition.fromVoiceSegmentId, transition.toVoiceSegmentId,
    ]) stableId(value, 'persisted continuity transition identity')
    const results = transition.results.map((result, resultIndex) => {
      assertExactKeys(result as unknown as Record<string, unknown>, [
        'evidenceId', 'gate', 'note', 'result',
      ], `production continuity transition result ${index}.${resultIndex}`)
      if (
        result.gate !== MOTION_STUDIO_SPEECH_PRODUCTION_CONTINUITY_GATES[resultIndex] ||
        !['passed', 'failed'].includes(result.result)
      ) blocked('Persisted continuity transition gates are invalid or out of order.')
      stableId(result.evidenceId, 'persisted continuity gate evidence ID')
      safeNote(result.note)
      return result
    })
    const transitionPassed = results.every((result) => result.result === 'passed')
    const { transitionReviewDigest, ...transitionBase } = transition
    if (
      transition.transitionPassed !== transitionPassed ||
      !SHA256.test(transitionReviewDigest) ||
      sha256CanonicalJson(transitionBase) !== transitionReviewDigest
    ) blocked('Persisted continuity transition digest or decision is invalid.')
  })
  const allTransitionsPassed = review.transitions.every((transition) => transition.transitionPassed)
  if (
    !['pass_production_continuity', 'reject_production_continuity'].includes(review.decision) ||
    (review.decision === 'pass_production_continuity') !== allTransitionsPassed
  ) blocked('Persisted continuity decision does not match every transition gate.')
  return deepFreeze(review)
}

function assertContinuityReviewShape(
  value: unknown,
): MotionStudioSpeechProductionContinuityReviewV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked('Production continuity review shape is invalid.')
  }
  const review = value as MotionStudioSpeechProductionContinuityReviewV1
  assertExactKeys(review as unknown as Record<string, unknown>, [
    'approvedSnapshotDigest', 'approvedSnapshotId', 'candidateEvidenceClass',
    'candidateEvidenceDigests', 'continuityReviewId', 'continuityScopeDigest', 'decision',
    'editSessionId', 'immutable', 'mediaExecutionCount', 'persistedPrivateC3ReadbackVerified',
    'persistence', 'productionId', 'projectId', 'providerC3BackingDigest', 'providerCallCount',
    'reviewDigest', 'reviewedAt', 'reviewerActorId', 'reviewerAttestationAccepted',
    'schemaVersion', 'selectionDecisionCreated', 'timelineMutationPerformed', 'transitions',
    'workspaceId',
  ], 'production continuity review')
  if (!review.persistence || typeof review.persistence !== 'object' ||
      Array.isArray(review.persistence)) {
    blocked('Production continuity review persistence shape is invalid.')
  }
  assertExactKeys(review.persistence as unknown as Record<string, unknown>, [
    'browserProjectionAllowed', 'createOnly', 'privateLocalOnly',
    'relativePath', 'reviewObjectIdentityHash',
  ], 'production continuity review persistence')
  if (!Array.isArray(review.candidateEvidenceDigests) || !Array.isArray(review.transitions)) {
    blocked('Production continuity review evidence collections are invalid.')
  }
  return review
}

function assertTrustedReconciliation(
  record: MotionStudioSpeechProductionContinuityReconciliationV1,
): MotionStudioSpeechProductionContinuityReconciliationV1 {
  if (trustedReconciliations.get(record) !== record.recordDigest) {
    blocked('Production continuity persistence requires the exact compiled record instance.')
  }
  return assertContinuityRecord(record)
}

function assertContinuityRecord(
  record: MotionStudioSpeechProductionContinuityReconciliationV1,
): MotionStudioSpeechProductionContinuityReconciliationV1 {
  record = assertContinuityRecordShape(record)
  const { recordDigest, ...base } = record
  const contractPassed = record.state ===
    'production_continuity_passed_awaiting_ms012c_reconciliation_and_ms012e_selection' ||
    record.state === 'contract_only_continuity_verified_actual_evidence_open'
  const persistedPrivateProviderEvidence =
    record.evidenceClass === 'persisted_private_provider_c3_readback'
  const productionMultiTakeContinuityProven =
    contractPassed && persistedPrivateProviderEvidence
  if (
    record.schemaVersion !== 'motion-studio.speech-production-continuity-reconciliation.v1' ||
    !['contract_only_hypothetical_c3', 'persisted_private_provider_c3_readback']
      .includes(record.evidenceClass) ||
    (!contractPassed && record.state !== 'production_continuity_rejected') ||
    (record.state ===
      'production_continuity_passed_awaiting_ms012c_reconciliation_and_ms012e_selection') !==
      productionMultiTakeContinuityProven ||
    (record.state === 'contract_only_continuity_verified_actual_evidence_open') !==
      (contractPassed && !persistedPrivateProviderEvidence) ||
    !SHA256.test(recordDigest) || sha256CanonicalJson(base) !== recordDigest ||
    record.candidateCount < MINIMUM_SEGMENTS || record.candidateCount > MAXIMUM_SEGMENTS ||
    record.expectedVoiceSegmentIds.length !== record.candidateCount ||
    record.segmentCoverage.length !== record.candidateCount ||
    record.candidateEvidenceDigests.length !== record.candidateCount ||
    record.c3ReviewObjectIdentityHashes.length !== record.candidateCount ||
    record.c3ReviewReconciliationDigests.length !== record.candidateCount ||
    record.transitionCount !== record.candidateCount - 1 ||
    record.transitionReviewDigests.length !== record.transitionCount ||
    record.continuityReviewObjectIdentityHash !== sha256CanonicalJson({
      domain: 'motion-studio-speech-production-continuity-review-v1',
      continuityScopeDigest: record.continuityScopeDigest,
      continuityReviewId: record.continuityReviewId,
    }) ||
    record.continuity?.everyExpectedVoiceSegmentCovered !== true ||
    record.continuity.everyAdjacentTransitionReviewed !== true ||
    record.continuity.singleCandidateCannotQualify !== true ||
    record.continuity.allTransitionsPassed !== contractPassed ||
    record.continuity.contractVerificationPassed !== contractPassed ||
    record.continuity.persistedPrivateProviderEvidenceReviewed !==
      persistedPrivateProviderEvidence ||
    record.continuity.productionMultiTakeContinuityProven !==
      productionMultiTakeContinuityProven ||
    record.cost?.incrementalProviderCallCount !== 0 ||
    record.cost.incrementalMediaExecutionCount !== 0 ||
    record.cost.incrementalInternalProductionCostMicros !== 0 ||
    record.cost.customerPricingIncluded !== false ||
    record.cost.customerCreditsIncluded !== false || record.cost.serviceFeeIncluded !== false ||
    record.cost.billingMutationPerformed !== false ||
    Object.values(record.selection ?? {}).some((value) => value !== false) ||
    record.readiness?.productionContinuityReviewComplete !== true ||
    record.readiness.contractVerificationOnly !==
      (contractPassed && !persistedPrivateProviderEvidence) ||
    record.readiness.productionMultiTakeContinuityEvidenceComplete !==
      productionMultiTakeContinuityProven ||
    record.readiness.ms012eSelectionRequired !== productionMultiTakeContinuityProven ||
    record.readiness.ms012cAccepted !== false ||
    record.readiness.productReady !== false || record.readiness.externalBetaReady !== false ||
    record.readiness.productionReady !== false || record.readiness.finalDeliveryReady !== false ||
    record.persistence?.privateLocalOnly !== true || record.persistence.createOnly !== true ||
    record.persistence.browserProjectionAllowed !== false ||
    !SHA256.test(record.persistence.recordObjectIdentityHash) ||
    record.persistence.recordObjectIdentityHash !== sha256CanonicalJson({
      domain: 'motion-studio-speech-production-continuity-record-v1',
      continuityScopeDigest: record.continuityScopeDigest,
      continuityReviewDigest: record.continuityReviewDigest,
    }) ||
    record.persistence.relativePath !==
      continuityRecordRelativePath(record.persistence.recordObjectIdentityHash) ||
    record.immutable !== true
  ) blocked('Production continuity record contains invalid authority, selection, or readiness state.')
  for (const [value, label] of [
    [record.workspaceId, 'workspace ID'], [record.projectId, 'project ID'],
    [record.editSessionId, 'edit session ID'], [record.productionId, 'production ID'],
    [record.approvedSnapshotId, 'approved snapshot ID'],
    [record.continuityScopeId, 'continuity scope ID'],
    [record.voiceBindingId, 'voice binding ID'],
    [record.continuityReviewId, 'continuity review ID'],
  ] as const) stableId(value, `persisted production continuity ${label}`)
  validateVersionReference(record.preparedScriptArtifactVersion)
  validateVersionReference(record.voiceBibleArtifactVersion)
  safeLanguage(record.language)
  if (
    record.expectedVoiceSegmentCoverageDigest !== sha256CanonicalJson({
      preparedScriptArtifactVersion: record.preparedScriptArtifactVersion,
      voiceBibleArtifactVersion: record.voiceBibleArtifactVersion,
      voiceBibleContentDigest: record.voiceBibleContentDigest,
      expectedVoiceSegmentIds: record.expectedVoiceSegmentIds,
    })
  ) blocked('Production continuity expected segment coverage digest is invalid.')
  record.segmentCoverage.forEach((segment, index) => {
    assertExactKeys(segment as unknown as Record<string, unknown>, [
      'c3ReviewObjectIdentityHash', 'c3ReviewReconciliationDigest', 'candidateEvidenceDigest',
      'candidateTakeId', 'endFrame',
      'preparedScriptSegmentId', 'segmentOrder', 'speechRequestDigest', 'speechRequestId',
      'startFrame', 'voiceSegmentId',
    ], `production continuity segment coverage ${index}`)
    if (
      segment.segmentOrder !== index ||
      segment.voiceSegmentId !== record.expectedVoiceSegmentIds[index] ||
      segment.candidateEvidenceDigest !== record.candidateEvidenceDigests[index] ||
      segment.c3ReviewObjectIdentityHash !== record.c3ReviewObjectIdentityHashes[index] ||
      segment.c3ReviewReconciliationDigest !== record.c3ReviewReconciliationDigests[index] ||
      segment.startFrame < 0 || segment.endFrame <= segment.startFrame ||
      (index > 0 && segment.startFrame < record.segmentCoverage[index - 1]!.endFrame)
    ) blocked('Production continuity persisted segment coverage is incomplete or out of order.')
    for (const value of [
      segment.voiceSegmentId, segment.preparedScriptSegmentId, segment.candidateTakeId,
      segment.speechRequestId,
    ]) stableId(value, 'production continuity segment identity')
    for (const digest of [
      segment.speechRequestDigest, segment.candidateEvidenceDigest,
      segment.c3ReviewObjectIdentityHash, segment.c3ReviewReconciliationDigest,
    ]) validDigest(digest, 'production continuity segment evidence digest')
  })
  for (const digest of [
    record.approvedSnapshotDigest, record.continuityScopeDigest, record.voiceBibleContentDigest,
    record.voiceIdentityHash, record.timingAuthorityDigest,
    record.expectedVoiceSegmentCoverageDigest, record.continuityReviewDigest,
    record.continuityReviewObjectIdentityHash,
    ...record.candidateEvidenceDigests, ...record.c3ReviewObjectIdentityHashes,
    ...record.c3ReviewReconciliationDigests,
    ...record.transitionReviewDigests,
  ]) validDigest(digest, 'production continuity record digest')
  if (
    new Set(record.expectedVoiceSegmentIds).size !== record.candidateCount ||
    new Set(record.segmentCoverage.map((segment) => segment.preparedScriptSegmentId)).size !==
      record.candidateCount ||
    new Set(record.segmentCoverage.map((segment) => segment.candidateTakeId)).size !==
      record.candidateCount ||
    new Set(record.segmentCoverage.map((segment) => segment.speechRequestId)).size !==
      record.candidateCount ||
    new Set(record.candidateEvidenceDigests).size !== record.candidateCount ||
    new Set(record.c3ReviewObjectIdentityHashes).size !== record.candidateCount ||
    new Set(record.c3ReviewReconciliationDigests).size !== record.candidateCount ||
    new Set(record.transitionReviewDigests).size !== record.transitionCount
  ) blocked('Production continuity record contains duplicate evidence identities.')
  exactIso(record.createdAt, 'production continuity record creation time')
  return deepFreeze(record)
}

function assertContinuityRecordShape(
  value: unknown,
): MotionStudioSpeechProductionContinuityReconciliationV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked('Production continuity record shape is invalid.')
  }
  const record = value as MotionStudioSpeechProductionContinuityReconciliationV1
  assertExactKeys(record as unknown as Record<string, unknown>, [
    'approvedSnapshotDigest', 'approvedSnapshotId', 'c3ReviewObjectIdentityHashes',
    'c3ReviewReconciliationDigests',
    'candidateCount', 'candidateEvidenceDigests', 'continuity', 'continuityReviewDigest',
    'continuityReviewId', 'continuityReviewObjectIdentityHash', 'continuityScopeDigest',
    'continuityScopeId', 'cost', 'createdAt',
    'editSessionId', 'evidenceClass', 'expectedVoiceSegmentCoverageDigest', 'immutable', 'language',
    'persistence', 'preparedScriptArtifactVersion', 'productionId', 'projectId', 'readiness',
    'recordDigest', 'schemaVersion', 'segmentCoverage', 'selection', 'state',
    'timingAuthorityDigest', 'transitionCount',
    'transitionReviewDigests', 'voiceBibleArtifactVersion', 'voiceBibleContentDigest',
    'voiceBindingId', 'voiceIdentityHash', 'workspaceId', 'expectedVoiceSegmentIds',
  ], 'production continuity record')
  for (const [label, nested, keys] of [
    ['continuity', record.continuity, [
      'allTransitionsPassed', 'everyAdjacentTransitionReviewed',
      'contractVerificationPassed', 'everyExpectedVoiceSegmentCovered',
      'persistedPrivateProviderEvidenceReviewed', 'productionMultiTakeContinuityProven',
      'singleCandidateCannotQualify',
    ]],
    ['cost', record.cost, [
      'billingMutationPerformed', 'customerCreditsIncluded', 'customerPricingIncluded',
      'incrementalInternalProductionCostMicros', 'incrementalMediaExecutionCount',
      'incrementalProviderCallCount', 'serviceFeeIncluded',
    ]],
    ['selection', record.selection, [
      'eligibleForExplicitSelection', 'finalAssetEligible', 'finalNarrationMutationPerformed',
      'firstTakeAutoAccepted', 'selected', 'selectionDecisionCreated', 'timelineMutationPerformed',
    ]],
    ['readiness', record.readiness, [
      'contractVerificationOnly', 'externalBetaReady', 'finalDeliveryReady', 'ms012cAccepted',
      'ms012eSelectionRequired', 'productReady', 'productionContinuityReviewComplete',
      'productionMultiTakeContinuityEvidenceComplete', 'productionReady',
    ]],
    ['persistence', record.persistence, [
      'browserProjectionAllowed', 'createOnly', 'privateLocalOnly',
      'recordObjectIdentityHash', 'relativePath',
    ]],
  ] as const) {
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
      blocked(`Production continuity ${label} shape is invalid.`)
    }
    assertExactKeys(
      nested as unknown as Record<string, unknown>,
      keys,
      `production continuity ${label}`,
    )
  }
  if (
    !Array.isArray(record.expectedVoiceSegmentIds) || !Array.isArray(record.segmentCoverage) ||
    !Array.isArray(record.candidateEvidenceDigests) ||
    !Array.isArray(record.c3ReviewObjectIdentityHashes) ||
    !Array.isArray(record.c3ReviewReconciliationDigests) ||
    !Array.isArray(record.transitionReviewDigests)
  ) blocked('Production continuity evidence collections are invalid.')
  return record
}

function continuityRecordRelativePath(recordObjectIdentityHash: string): string {
  validDigest(recordObjectIdentityHash, 'continuity persistence object identity')
  return `motion-studio-speech-continuity/private-v1/${recordObjectIdentityHash.slice(0, 2)}/${recordObjectIdentityHash}.json`
}

function continuityReviewRelativePath(reviewObjectIdentityHash: string): string {
  validDigest(reviewObjectIdentityHash, 'continuity review persistence object identity')
  return `motion-studio-speech-continuity-review/private-v1/${reviewObjectIdentityHash.slice(0, 2)}/${reviewObjectIdentityHash}.json`
}

function validateVersionReference(value: MotionStudioVersionReference): MotionStudioVersionReference {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalid('Continuity artifact version reference is invalid.')
  }
  assertExactKeys(
    value as unknown as Record<string, unknown>,
    ['artifactId', 'contentDigest', 'versionId', 'versionNumber'],
    'continuity artifact version reference',
  )
  stableId(value.artifactId, 'continuity artifact ID')
  stableId(value.versionId, 'continuity artifact version ID')
  if (!Number.isSafeInteger(value.versionNumber) || value.versionNumber < 1) {
    invalid('Continuity artifact version number is invalid.')
  }
  validDigest(value.contentDigest, 'continuity artifact version digest')
  return deepFreeze({ ...value })
}

function sameVersionReference(
  left: MotionStudioVersionReference,
  right: MotionStudioVersionReference,
): boolean {
  return left.artifactId === right.artifactId && left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber && left.contentDigest === right.contentDigest
}

function stableId(value: string, label: string): string {
  if (typeof value !== 'string' || !STABLE_ID.test(value)) invalid(`${label} is invalid.`)
  return value
}

function validDigest(value: string, label: string): string {
  if (typeof value !== 'string' || !SHA256.test(value)) invalid(`${label} is invalid.`)
  return value
}

function safeLanguage(value: string): string {
  if (typeof value !== 'string' || value.length < 2 || value.length > 64 || !/^[A-Za-z0-9-]+$/u.test(value)) {
    invalid('Production continuity language is invalid.')
  }
  return value
}

function safeNote(value: string): string {
  if (
    typeof value !== 'string' || value.length < 4 || value.length > 500 ||
    [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ||
    /(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/iu.test(value)
  ) invalid('Production continuity review note is unsafe or outside its bounded size.')
  return value
}

function exactIso(value: string, label: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    invalid(`${label} is invalid.`)
  }
  return value
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const required = [...expected].sort()
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    blocked(`${label} contains missing or unknown fields.`)
  }
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) value.forEach(deepFreeze)
  else Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  return Object.freeze(value)
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_speech_production_continuity_reconciliation',
  })
}
