import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { readCanonicalPrivateAudioArtifact } from '../../services/canonical-private-audio-artifact-storage'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import {
  MOTION_STUDIO_SYNCHRONIZED_FOLEY_REVIEW_REQUIREMENTS,
} from '../foley-production/synchronized-foley-review-readiness'
import {
  MOTION_STUDIO_LYRIA_D3_REVIEW_REQUIREMENTS,
} from '../music-production/lyria-d3-review-readiness'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { MOTION_STUDIO_PROVIDER_CANDIDATE_EVIDENCE_CLASSES } from './canonical-provider-candidate-ingest'
import {
  assertMotionStudioProviderCandidateObjectiveQa,
  motionStudioProviderCandidateObjectiveQaV2Schema,
  type MotionStudioProviderCandidateObjectiveQaV2,
} from './canonical-provider-candidate-objective-qa'

export const MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_HANDOFF_SCHEMA_VERSION =
  'motion-studio.provider-candidate-review-handoff.v2' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const evidenceClassSchema = z.enum(MOTION_STUDIO_PROVIDER_CANDIDATE_EVIDENCE_CLASSES)
export const MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_GATES = [
  'creative_cue_and_picture_fit',
  'originality_and_no_copy',
  'musical_continuity',
  'speech_safety_and_loudness',
  'candidate_rights_and_provenance',
  'human_listening_review',
  'visible_event_semantics',
  'forbidden_content_semantics',
  'room_and_style_fit',
] as const
export const MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_EVIDENCE_KINDS = [
  'exact_music_bible_cue_picture_timing',
  'private_normalized_candidate_audio',
  'canonical_provider_attempt_lineage',
  'actual_candidate_objective_qa',
  'creative_cue_picture_analysis',
  'originality_no_copy_analysis',
  'music_continuity_review',
  'speech_safety_loudness_analysis',
  'rights_provenance_disclosure_retention',
  'complete_human_listening_attestation',
  'private_source_video',
  'visual_event_grounding_analysis',
  'forbidden_content_analysis',
  'room_and_style_review',
  'synchronized_human_playback_attestation',
] as const

const gateSchema = z.enum(MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_GATES)
const evidenceKindSchema = z.enum(
  MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_EVIDENCE_KINDS,
)

export type MotionStudioProviderCandidateReviewGate =
  typeof MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_GATES[number]
export type MotionStudioProviderCandidateReviewEvidenceKind =
  typeof MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_EVIDENCE_KINDS[number]

const requirementSchema = z.object({
  gate: gateSchema,
  state: z.literal('exact_candidate_evidence_required'),
  blocking: z.literal(true),
  requiredEvidenceKinds: z.array(evidenceKindSchema).min(2).max(8).readonly(),
  reviewQuestion: z.string().trim().min(20).max(500),
  sourceRequirementDigest: digestSchema,
  evidenceSubmissionCount: z.literal(0),
  humanDecisionCount: z.literal(0),
  requirementDigest: digestSchema,
}).strict()

export const motionStudioProviderCandidateReviewHandoffV2Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_HANDOFF_SCHEMA_VERSION),
  reviewHandoffId: stableIdSchema,
  evidenceClass: evidenceClassSchema,
  state: z.enum([
    'contract_path_review_handoff_proven_non_promotable',
    'actual_private_candidate_objective_qa_complete_review_evidence_required',
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
    analysisDigest: digestSchema,
    qaDigest: digestSchema,
    objectiveQaComplete: z.boolean(),
    actualProviderCandidateQaComplete: z.boolean(),
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
    mimeType: z.literal('audio/wav'),
    codec: z.literal('pcm_s16le'),
    sampleRateHertz: z.literal(48_000),
    channelCount: z.literal(2),
    bitsPerSample: z.literal(16),
    sampleCountPerChannel: z.number().int().positive().max(1_440_000),
    durationMilliseconds: z.number().int().positive().max(30_000),
    byteLength: z.number().int().min(44).max(24 * 1024 * 1024),
    sha256: digestSchema,
    privateCreateOnlyReadbackVerified: z.literal(true),
  }).strict(),
  reviewRequirements: z.array(requirementSchema).min(5).max(6).readonly(),
  humanReviewPolicy: z.object({
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
  }).strict(),
  cost: z.object({
    providerAttemptTotalInternalProductionCostMicros: z.number().int().nonnegative(),
    providerAttemptCostEvidenceDigest: digestSchema,
    providerAttemptCostEvidenceActual: z.boolean(),
    normalizationInfrastructureCostMicros: z.null(),
    objectiveQaInfrastructureCostMicros: z.null(),
    reviewPreparationInfrastructureCostState:
      z.literal('canonical_observed_resource_evidence_required'),
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
    deterministicObjectiveQaPathProven: z.literal(true),
    objectiveQaComplete: z.boolean(),
    reviewRequirementsBound: z.literal(true),
    readyForEvidenceCollection: z.boolean(),
    semanticCreativeEvidenceComplete: z.literal(false),
    rightsProvenanceEvidenceComplete: z.literal(false),
    privateReviewPlaybackReady: z.literal(false),
    humanReviewComplete: z.literal(false),
    readyForHumanReview: z.literal(false),
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
    providerUrlPersisted: z.literal(false),
    localPathProjected: z.literal(false),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  sideEffects: z.object({
    privateArtifactReadCount: z.literal(1),
    providerSubmissionCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    reviewEvidenceSubmissionCount: z.literal(0),
    reviewDecisionCount: z.literal(0),
    selectionCount: z.literal(0),
    finalMixMutationCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  handoffDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const actual = value.evidenceClass === 'canonical_backend_verified_runtime'
  const expectedState = actual
    ? 'actual_private_candidate_objective_qa_complete_review_evidence_required'
    : 'contract_path_review_handoff_proven_non_promotable'
  if (
    value.state !== expectedState ||
    value.sourceObjectiveQa.objectiveQaComplete !== actual ||
    value.sourceObjectiveQa.actualProviderCandidateQaComplete !== actual ||
    value.readiness.contractPathProofOnly !== !actual ||
    value.readiness.actualPrivateProviderCandidatePresent !== actual ||
    value.readiness.objectiveQaComplete !== actual ||
    value.readiness.readyForEvidenceCollection !== actual ||
    value.cost.providerAttemptCostEvidenceActual !== actual
  ) {
    context.addIssue({
      code: 'custom',
      path: ['evidenceClass'],
      message: 'Candidate review-handoff provenance cannot be promoted or relabelled.',
    })
  }
  const canonical = requirementsFor(value.intent)
  if (value.reviewRequirements.length !== canonical.length) {
    context.addIssue({ code: 'custom', path: ['reviewRequirements'], message: 'Review handoff must preserve every exact intent gate.' })
    return
  }
  for (const [index, source] of canonical.entries()) {
    const actual = value.reviewRequirements[index]
    const sourceRequirementDigest = sha256CanonicalJson(source)
    const expectedRequirementDigest = sha256CanonicalJson({
      sourceObjectiveQaEvidenceDigest: value.sourceObjectiveQa.evidenceDigest,
      candidateSha256: value.candidate.sha256,
      sourceRequirementDigest,
      gate: source.gate,
      requiredEvidenceKinds: source.requiredEvidenceKinds,
      reviewQuestion: source.reviewQuestion,
      state: 'exact_candidate_evidence_required',
    })
    if (
      !actual || actual.gate !== source.gate ||
      actual.requiredEvidenceKinds.join('|') !== source.requiredEvidenceKinds.join('|') ||
      actual.reviewQuestion !== source.reviewQuestion ||
      actual.sourceRequirementDigest !== sourceRequirementDigest ||
      actual.requirementDigest !== expectedRequirementDigest
    ) {
      context.addIssue({ code: 'custom', path: ['reviewRequirements', index], message: 'Review handoff requirement drifted from the canonical review authority.' })
    }
  }
  const expectedHumanPolicy = humanPolicyFor(value.intent)
  if (
    value.humanReviewPolicy.playbackContext !== expectedHumanPolicy.playbackContext ||
    value.humanReviewPolicy.explicitAttestationText !== expectedHumanPolicy.explicitAttestationText
  ) {
    context.addIssue({ code: 'custom', path: ['humanReviewPolicy'], message: 'Review handoff changed the exact intent-specific human review policy.' })
  }
})

export type MotionStudioProviderCandidateReviewHandoffV2 =
  z.infer<typeof motionStudioProviderCandidateReviewHandoffV2Schema>

/** @deprecated Use the provenance-hardened V2 schema and type. */
export const motionStudioProviderCandidateReviewHandoffV1Schema =
  motionStudioProviderCandidateReviewHandoffV2Schema
/** @deprecated Use MotionStudioProviderCandidateReviewHandoffV2. */
export type MotionStudioProviderCandidateReviewHandoffV1 =
  MotionStudioProviderCandidateReviewHandoffV2

export async function createMotionStudioProviderCandidateReviewHandoff(input: {
  objectiveQa: MotionStudioProviderCandidateObjectiveQaV2
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioProviderCandidateReviewHandoffV2> {
  assertMotionStudioProviderCandidateObjectiveQa(input.objectiveQa)
  const objectiveQa = motionStudioProviderCandidateObjectiveQaV2Schema.parse(input.objectiveQa)
  const createdAt = exactIso(input.createdAt)
  if (Date.parse(createdAt) < Date.parse(objectiveQa.createdAt)) {
    invalid('Provider candidate review handoff cannot predate objective QA.')
  }
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u
    .test(input.localStorageRoot)) {
    invalid('Provider candidate review handoff requires the exact bounded private-ingest root.')
  }
  if (
    !objectiveQa.qa.objectiveQaPassed ||
    !objectiveQa.readiness.deterministicObjectiveQaPathProven ||
    objectiveQa.qa.semanticAndCreativeEvidenceComplete ||
    objectiveQa.qa.rightsAndProvenanceReviewComplete || objectiveQa.qa.humanReviewComplete ||
    objectiveQa.qa.selectionEligible || objectiveQa.qa.finalMixEligible ||
    objectiveQa.qa.timelineEligible || objectiveQa.readiness.ms012dAccepted ||
    objectiveQa.readiness.productReady
  ) blocked('Provider candidate review handoff requires exact objective-only candidate evidence.')

  const stored = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: objectiveQa.candidate.privateObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== objectiveQa.candidate.sha256 ||
    stored.byteLength !== objectiveQa.candidate.byteLength
  ) blocked('Provider candidate review handoff failed exact private artifact readback.')

  const canonicalRequirements = requirementsFor(objectiveQa.intent)
  const reviewRequirements = canonicalRequirements.map((source) => {
    const sourceRequirementDigest = sha256CanonicalJson(source)
    const requirementBase = {
      gate: source.gate,
      state: 'exact_candidate_evidence_required' as const,
      blocking: true as const,
      requiredEvidenceKinds: source.requiredEvidenceKinds,
      reviewQuestion: source.reviewQuestion,
      sourceRequirementDigest,
      evidenceSubmissionCount: 0 as const,
      humanDecisionCount: 0 as const,
    }
    return {
      ...requirementBase,
      requirementDigest: sha256CanonicalJson({
        sourceObjectiveQaEvidenceDigest: objectiveQa.evidenceDigest,
        candidateSha256: objectiveQa.candidate.sha256,
        sourceRequirementDigest,
        gate: source.gate,
        requiredEvidenceKinds: source.requiredEvidenceKinds,
        reviewQuestion: source.reviewQuestion,
        state: 'exact_candidate_evidence_required',
      }),
    }
  })
  const requirementsDigest = sha256CanonicalJson(reviewRequirements)
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_review_handoff_v2',
    evidenceClass: objectiveQa.evidenceClass,
    sourceObjectiveQaEvidenceDigest: objectiveQa.evidenceDigest,
    candidateSha256: objectiveQa.candidate.sha256,
    requirementsDigest,
  })
  const persisted = await readMotionStudioProviderCandidateReviewHandoff({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash,
  })
  if (persisted) {
    if (
      persisted.sourceObjectiveQa.evidenceDigest !== objectiveQa.evidenceDigest ||
      persisted.evidenceClass !== objectiveQa.evidenceClass ||
      persisted.candidate.sha256 !== objectiveQa.candidate.sha256
    ) blocked('Persisted provider candidate review handoff changed replay authority.')
    return persisted
  }

  const actualProviderEvidence = objectiveQa.evidenceClass === 'canonical_backend_verified_runtime'
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_CANDIDATE_REVIEW_HANDOFF_SCHEMA_VERSION,
    reviewHandoffId: `ms012d-review-handoff-${evidenceObjectIdentityHash.slice(0, 24)}`,
    evidenceClass: objectiveQa.evidenceClass,
    state: actualProviderEvidence
      ? 'actual_private_candidate_objective_qa_complete_review_evidence_required' as const
      : 'contract_path_review_handoff_proven_non_promotable' as const,
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
      analysisDigest: objectiveQa.analysis.analysisDigest,
      qaDigest: objectiveQa.qa.qaDigest,
      objectiveQaComplete: actualProviderEvidence,
      actualProviderCandidateQaComplete: actualProviderEvidence,
    },
    providerAttempt: {
      approvedPackageId: objectiveQa.providerAttempt.approvedPackageId,
      approvedPackageDigest: objectiveQa.providerAttempt.approvedPackageDigest,
      approvedWorkItemId: objectiveQa.providerAttempt.approvedWorkItemId,
      queueJobId: objectiveQa.providerAttempt.queueJobId,
      queueAttemptId: objectiveQa.providerAttempt.queueAttemptId,
      claimId: objectiveQa.providerAttempt.claimId,
      leaseId: objectiveQa.providerAttempt.leaseId,
      idempotencyKeyHash: objectiveQa.providerAttempt.idempotencyKeyHash,
      providerOperationId: objectiveQa.providerAttempt.providerOperationId,
      providerRouteId: objectiveQa.providerAttempt.providerRouteId,
      providerModelId: objectiveQa.providerAttempt.providerModelId,
      terminalEvidenceDigest: objectiveQa.providerAttempt.terminalEvidenceDigest,
    },
    candidate: objectiveQa.candidate,
    reviewRequirements,
    humanReviewPolicy: {
      ...humanPolicyFor(objectiveQa.intent),
      completeCandidatePlaybackRequired: true as const,
      humanAuthoredGateResultsRequired: true as const,
      automaticHumanReviewAllowed: false as const,
      automaticApprovalAllowed: false as const,
    },
    cost: {
      providerAttemptTotalInternalProductionCostMicros:
        objectiveQa.cost.providerAttemptTotalInternalProductionCostMicros,
      providerAttemptCostEvidenceDigest: objectiveQa.cost.providerAttemptCostEvidenceDigest,
      providerAttemptCostEvidenceActual: actualProviderEvidence,
      normalizationInfrastructureCostMicros: null,
      objectiveQaInfrastructureCostMicros: null,
      reviewPreparationInfrastructureCostState:
        'canonical_observed_resource_evidence_required' as const,
      reviewPreparationInfrastructureCostMicros: null,
      fullCandidateCostReconciled: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    readiness: {
      contractPathProofOnly: !actualProviderEvidence,
      actualPrivateProviderCandidatePresent: actualProviderEvidence,
      deterministicObjectiveQaPathProven: true as const,
      objectiveQaComplete: actualProviderEvidence,
      reviewRequirementsBound: true as const,
      readyForEvidenceCollection: actualProviderEvidence,
      semanticCreativeEvidenceComplete: false as const,
      rightsProvenanceEvidenceComplete: false as const,
      privateReviewPlaybackReady: false as const,
      humanReviewComplete: false as const,
      readyForHumanReview: false as const,
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
      providerUrlPersisted: false as const,
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    sideEffects: {
      privateArtifactReadCount: 1 as const,
      providerSubmissionCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      reviewEvidenceSubmissionCount: 0 as const,
      reviewDecisionCount: 0 as const,
      selectionCount: 0 as const,
      finalMixMutationCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  const record = deepFreeze(motionStudioProviderCandidateReviewHandoffV2Schema.parse({
    ...base,
    handoffDigest: sha256CanonicalJson(base),
  }))
  await persistHandoff(input.localStorageRoot, record)
  return record
}

export function assertMotionStudioProviderCandidateReviewHandoff(
  input: MotionStudioProviderCandidateReviewHandoffV2,
): void {
  const parsed = motionStudioProviderCandidateReviewHandoffV2Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.handoffDigest
  if (
    sha256CanonicalJson(base) !== parsed.handoffDigest ||
    !parsed.readiness.deterministicObjectiveQaPathProven ||
    !parsed.readiness.reviewRequirementsBound ||
    parsed.readiness.semanticCreativeEvidenceComplete ||
    parsed.readiness.rightsProvenanceEvidenceComplete ||
    parsed.readiness.privateReviewPlaybackReady || parsed.readiness.humanReviewComplete ||
    parsed.readiness.readyForHumanReview || parsed.readiness.readyForSelectionDecision ||
    parsed.readiness.ms012dAccepted || parsed.readiness.productReady ||
    parsed.selection.selectionDecisionCreated || parsed.selection.selected ||
    parsed.selection.firstCandidateAutoAccepted || parsed.selection.finalMixEligible ||
    parsed.selection.timelineEligible || parsed.sideEffects.reviewEvidenceSubmissionCount !== 0 ||
    parsed.sideEffects.reviewDecisionCount !== 0 || parsed.sideEffects.selectionCount !== 0 ||
    parsed.sideEffects.finalMixMutationCount !== 0 || parsed.sideEffects.timelineMutationCount !== 0 ||
    parsed.sideEffects.renderCount !== 0 || parsed.sideEffects.exportCount !== 0 ||
    parsed.sideEffects.remoteMutationCount !== 0
  ) blocked('Provider candidate review handoff crossed its evidence, review or selection boundary.')
}

function requirementsFor(intent: MotionStudioProviderCandidateObjectiveQaV2['intent']) {
  return intent === 'generated_music_candidate'
    ? MOTION_STUDIO_LYRIA_D3_REVIEW_REQUIREMENTS
    : MOTION_STUDIO_SYNCHRONIZED_FOLEY_REVIEW_REQUIREMENTS
}

function humanPolicyFor(intent: MotionStudioProviderCandidateObjectiveQaV2['intent']) {
  return intent === 'generated_music_candidate'
    ? {
        playbackContext: 'private_picture_and_narration_context' as const,
        explicitAttestationText:
          'I REVIEWED THE COMPLETE PRIVATE MUSIC CANDIDATE IN PICTURE AND NARRATION CONTEXT' as const,
      }
    : {
        playbackContext: 'private_synchronized_picture_and_audio_context' as const,
        explicitAttestationText:
          'I REVIEWED THE COMPLETE SYNCHRONIZED PRIVATE CANDIDATE' as const,
      }
}

async function persistHandoff(
  root: string,
  record: MotionStudioProviderCandidateReviewHandoffV2,
): Promise<void> {
  const identity = record.persistence.evidenceObjectIdentityHash
  const relativePath = `motion-studio/provider-candidate-review-handoff/${identity.slice(0, 2)}/${identity}.json`
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: root, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: root, relativePath })
  if (!stored || !stored.equals(bytes)) {
    blocked('Provider candidate review handoff changed after create-only persistence.')
  }
}

export async function readMotionStudioProviderCandidateReviewHandoff(
  input: {
    localStorageRoot: string
    evidenceObjectIdentityHash: string
  },
): Promise<MotionStudioProviderCandidateReviewHandoffV2 | null> {
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u
    .test(input.localStorageRoot)) {
    invalid('Provider candidate review handoff requires the exact bounded private-ingest root.')
  }
  if (!/^[a-f0-9]{64}$/u.test(input.evidenceObjectIdentityHash)) {
    invalid('Provider candidate review handoff identity is invalid.')
  }
  const identity = input.evidenceObjectIdentityHash
  const relativePath = `motion-studio/provider-candidate-review-handoff/${identity.slice(0, 2)}/${identity}.json`
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!bytes) return null
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked('Persisted provider candidate review handoff is not canonical JSON.')
  }
  const record = deepFreeze(motionStudioProviderCandidateReviewHandoffV2Schema.parse(decoded))
  assertMotionStudioProviderCandidateReviewHandoff(record)
  const canonicalBytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  if (!bytes.equals(canonicalBytes)) {
    blocked('Persisted provider candidate review handoff is not canonical serialization.')
  }
  return record
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Provider candidate review handoff time must be canonical ISO-8601.')
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
    requiredGate: 'motion_studio_provider_candidate_review_handoff',
  })
}
