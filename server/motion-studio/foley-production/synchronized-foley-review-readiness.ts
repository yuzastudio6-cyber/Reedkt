import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSynchronizedFoleyObjectiveQaReadiness,
  motionStudioSynchronizedFoleyObjectiveQaReadinessV1Schema,
  type MotionStudioSynchronizedFoleyObjectiveQaReadinessV1,
} from './synchronized-foley-objective-qa-readiness'

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_REVIEW_READINESS_SCHEMA_VERSION =
  'motion-studio.synchronized-foley-review-readiness.v1' as const

const SHA256 = /^[a-f0-9]{64}$/u
const digestSchema = z.string().regex(SHA256)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })

const reviewGateSchema = z.enum([
  'visible_event_semantics',
  'forbidden_content_semantics',
  'room_and_style_fit',
  'candidate_rights_and_provenance',
  'human_listening_review',
])

const evidenceKindSchema = z.enum([
  'private_source_video',
  'private_normalized_candidate_audio',
  'canonical_provider_attempt_lineage',
  'actual_candidate_objective_qa',
  'visual_event_grounding_analysis',
  'forbidden_content_analysis',
  'room_and_style_review',
  'rights_provenance_disclosure_retention',
  'synchronized_human_playback_attestation',
])

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_REVIEW_REQUIREMENTS = deepFreeze([
  {
    gate: 'visible_event_semantics',
    requiredEvidenceKinds: [
      'private_source_video',
      'private_normalized_candidate_audio',
      'actual_candidate_objective_qa',
      'visual_event_grounding_analysis',
    ],
    reviewQuestion: 'Does every audible event correspond to the approved visible action or story environment at the correct moment?',
  },
  {
    gate: 'forbidden_content_semantics',
    requiredEvidenceKinds: [
      'private_normalized_candidate_audio',
      'forbidden_content_analysis',
    ],
    reviewQuestion: 'Is the candidate free of dialogue, narration, music, exact named sounds, unseen actions, and invented facts?',
  },
  {
    gate: 'room_and_style_fit',
    requiredEvidenceKinds: [
      'private_source_video',
      'private_normalized_candidate_audio',
      'room_and_style_review',
    ],
    reviewQuestion: 'Does the material, room, environment, texture, intensity, and tail feel natural for the approved scene?',
  },
  {
    gate: 'candidate_rights_and_provenance',
    requiredEvidenceKinds: [
      'canonical_provider_attempt_lineage',
      'rights_provenance_disclosure_retention',
    ],
    reviewQuestion: 'Are provider lineage, rights, disclosure, retention, and private-ingest evidence complete for this exact candidate?',
  },
  {
    gate: 'human_listening_review',
    requiredEvidenceKinds: [
      'private_source_video',
      'private_normalized_candidate_audio',
      'synchronized_human_playback_attestation',
    ],
    reviewQuestion: 'After complete synchronized private playback, is the candidate realistic, intelligible in context, speech-safe, and free of distracting artifacts?',
  },
] as const)

const reviewRequirementSchema = z.object({
  gate: reviewGateSchema,
  state: z.literal('actual_candidate_evidence_required'),
  blocking: z.literal(true),
  requiredEvidenceKinds: z.array(evidenceKindSchema).min(2).max(8).readonly(),
  reviewQuestion: z.string().trim().min(20).max(500),
  evidenceDigest: digestSchema,
}).strict()

export const motionStudioSynchronizedFoleyReviewReadinessV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_REVIEW_READINESS_SCHEMA_VERSION),
  reviewReadinessId: stableIdSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  sourceRequestId: stableIdSchema,
  sourceRequestDigest: digestSchema,
  sourceSoundEventId: stableIdSchema,
  sourceVideoAssetVersionId: stableIdSchema,
  sourceVideoContentDigest: digestSchema,
  pictureLockContentDigest: digestSchema,
  timingAuthorityDigest: digestSchema,
  objectiveQaReadinessEvidenceDigest: digestSchema,
  objectiveQaAnalysisDigest: digestSchema,
  state: z.literal('review_intake_contract_ready_actual_candidate_absent'),
  createdAt: isoDateSchema,
  candidateIntake: z.object({
    requiredEvidenceClass: z.literal('actual_authorized_private_provider_candidate'),
    sameRequestDigestRequired: z.literal(true),
    sameSourceVideoVersionRequired: z.literal(true),
    samePictureLockRequired: z.literal(true),
    sameTimingAuthorityRequired: z.literal(true),
    canonicalProviderAttemptRequired: z.literal(true),
    canonicalSingleUseDispatchRequired: z.literal(true),
    privateNormalizedAudioRequired: z.literal(true),
    objectiveQaUsingFrozenProfileRequired: z.literal(true),
    exactProviderUsageAndCostRequired: z.literal(true),
    maximumProviderSubmissions: z.literal(1),
    maximumCandidates: z.literal(1),
    retryAllowed: z.literal(false),
    fallbackAllowed: z.literal(false),
    temporaryProviderUrlEligible: z.literal(false),
  }).strict(),
  reviewRequirements: z.array(reviewRequirementSchema).length(5).readonly(),
  humanReview: z.object({
    synchronizedPrivatePictureAndAudioPlaybackRequired: z.literal(true),
    completeCandidatePlaybackRequired: z.literal(true),
    humanAuthoredGateResultsRequired: z.literal(true),
    explicitAttestationText: z.literal('I REVIEWED THE COMPLETE SYNCHRONIZED PRIVATE CANDIDATE'),
    automaticHumanReviewAllowed: z.literal(false),
    automaticApprovalAllowed: z.literal(false),
  }).strict(),
  readiness: z.object({
    objectiveQaProfileReady: z.literal(true),
    actualProviderCandidatePresent: z.literal(false),
    actualCandidateObjectiveQaComplete: z.literal(false),
    visualSemanticEvidenceComplete: z.literal(false),
    forbiddenContentEvidenceComplete: z.literal(false),
    roomStyleEvidenceComplete: z.literal(false),
    rightsProvenanceEvidenceComplete: z.literal(false),
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
    localPathProjected: z.literal(false),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  sideEffects: z.object({
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    providerCandidateCreated: z.literal(false),
    reviewDecisionCreated: z.literal(false),
    costMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  recordDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const gates = value.reviewRequirements.map((entry) => entry.gate)
  const expected = MOTION_STUDIO_SYNCHRONIZED_FOLEY_REVIEW_REQUIREMENTS.map((entry) => entry.gate)
  if (gates.join('|') !== expected.join('|') || new Set(gates).size !== expected.length) {
    context.addIssue({
      code: 'custom',
      path: ['reviewRequirements'],
      message: 'Synchronized-Foley review readiness must preserve every required gate in canonical order.',
    })
  }
  for (const [index, requirement] of MOTION_STUDIO_SYNCHRONIZED_FOLEY_REVIEW_REQUIREMENTS.entries()) {
    const actual = value.reviewRequirements[index]
    if (
      !actual ||
      actual.gate !== requirement.gate ||
      actual.requiredEvidenceKinds.join('|') !== requirement.requiredEvidenceKinds.join('|') ||
      actual.reviewQuestion !== requirement.reviewQuestion ||
      actual.evidenceDigest !== sha256CanonicalJson({
        objectiveQaReadinessEvidenceDigest: value.objectiveQaReadinessEvidenceDigest,
        gate: requirement.gate,
        requiredEvidenceKinds: requirement.requiredEvidenceKinds,
        reviewQuestion: requirement.reviewQuestion,
      })
    ) {
      context.addIssue({
        code: 'custom',
        path: ['reviewRequirements', index],
        message: 'Synchronized-Foley review requirements must match the frozen evidence contract.',
      })
    }
  }
  const requirementsDigest = sha256CanonicalJson(value.reviewRequirements)
  const expectedEvidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_synchronized_foley_review_readiness_v1',
    objectiveQaReadinessEvidenceDigest: value.objectiveQaReadinessEvidenceDigest,
    requirementsDigest,
  })
  if (
    value.persistence.evidenceObjectIdentityHash !== expectedEvidenceObjectIdentityHash ||
    value.reviewReadinessId !== `ms012d4-review-readiness-${expectedEvidenceObjectIdentityHash.slice(0, 32)}`
  ) {
    context.addIssue({
      code: 'custom',
      path: ['persistence', 'evidenceObjectIdentityHash'],
      message: 'Synchronized-Foley review readiness identity must derive from the exact objective and review requirements.',
    })
  }
})

export type MotionStudioSynchronizedFoleyReviewReadinessV1 =
  z.infer<typeof motionStudioSynchronizedFoleyReviewReadinessV1Schema>

export async function proveMotionStudioSynchronizedFoleyReviewReadiness(input: {
  objectiveQaReadiness: MotionStudioSynchronizedFoleyObjectiveQaReadinessV1
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioSynchronizedFoleyReviewReadinessV1> {
  assertMotionStudioSynchronizedFoleyObjectiveQaReadiness(input.objectiveQaReadiness)
  const objectiveQa = motionStudioSynchronizedFoleyObjectiveQaReadinessV1Schema.parse(
    input.objectiveQaReadiness,
  )
  if (!/^\/tmp\/reeditpro-motion-studio-foley-objective-qa-[A-Za-z0-9._-]+$/u.test(input.localStorageRoot)) {
    invalid('Synchronized-Foley review readiness requires the bounded objective-QA local root.')
  }
  const createdAt = exactIso(input.createdAt)
  if (Date.parse(createdAt) < Date.parse(objectiveQa.createdAt)) {
    invalid('Synchronized-Foley review readiness cannot predate objective-QA readiness.')
  }
  if (
    !objectiveQa.qa.objectiveQaPassed || objectiveQa.qa.semanticQaComplete ||
    objectiveQa.qa.humanListeningComplete || objectiveQa.privateProviderCandidateCreated ||
    objectiveQa.synchronizedFoleyRouteOpen
  ) blocked('Synchronized-Foley review readiness requires the exact route-closed objective-QA profile evidence.')

  const reviewRequirements = MOTION_STUDIO_SYNCHRONIZED_FOLEY_REVIEW_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    state: 'actual_candidate_evidence_required' as const,
    blocking: true as const,
    evidenceDigest: sha256CanonicalJson({
      objectiveQaReadinessEvidenceDigest: objectiveQa.evidenceDigest,
      gate: requirement.gate,
      requiredEvidenceKinds: requirement.requiredEvidenceKinds,
      reviewQuestion: requirement.reviewQuestion,
    }),
  }))
  const requirementsDigest = sha256CanonicalJson(reviewRequirements)
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_synchronized_foley_review_readiness_v1',
    objectiveQaReadinessEvidenceDigest: objectiveQa.evidenceDigest,
    requirementsDigest,
  })
  const base = {
    schemaVersion: MOTION_STUDIO_SYNCHRONIZED_FOLEY_REVIEW_READINESS_SCHEMA_VERSION,
    reviewReadinessId: `ms012d4-review-readiness-${evidenceObjectIdentityHash.slice(0, 32)}`,
    workspaceId: objectiveQa.workspaceId,
    projectId: objectiveQa.projectId,
    editSessionId: objectiveQa.editSessionId,
    productionId: objectiveQa.productionId,
    sourceRequestId: objectiveQa.sourceRequestId,
    sourceRequestDigest: objectiveQa.sourceRequestDigest,
    sourceSoundEventId: objectiveQa.sourceSoundEventId,
    sourceVideoAssetVersionId: objectiveQa.sourceVideoAssetVersionId,
    sourceVideoContentDigest: objectiveQa.sourceVideoContentDigest,
    pictureLockContentDigest: objectiveQa.pictureLockContentDigest,
    timingAuthorityDigest: objectiveQa.timingAuthorityDigest,
    objectiveQaReadinessEvidenceDigest: objectiveQa.evidenceDigest,
    objectiveQaAnalysisDigest: objectiveQa.measurements.analysisDigest,
    state: 'review_intake_contract_ready_actual_candidate_absent' as const,
    createdAt,
    candidateIntake: {
      requiredEvidenceClass: 'actual_authorized_private_provider_candidate' as const,
      sameRequestDigestRequired: true as const,
      sameSourceVideoVersionRequired: true as const,
      samePictureLockRequired: true as const,
      sameTimingAuthorityRequired: true as const,
      canonicalProviderAttemptRequired: true as const,
      canonicalSingleUseDispatchRequired: true as const,
      privateNormalizedAudioRequired: true as const,
      objectiveQaUsingFrozenProfileRequired: true as const,
      exactProviderUsageAndCostRequired: true as const,
      maximumProviderSubmissions: 1 as const,
      maximumCandidates: 1 as const,
      retryAllowed: false as const,
      fallbackAllowed: false as const,
      temporaryProviderUrlEligible: false as const,
    },
    reviewRequirements,
    humanReview: {
      synchronizedPrivatePictureAndAudioPlaybackRequired: true as const,
      completeCandidatePlaybackRequired: true as const,
      humanAuthoredGateResultsRequired: true as const,
      explicitAttestationText: 'I REVIEWED THE COMPLETE SYNCHRONIZED PRIVATE CANDIDATE' as const,
      automaticHumanReviewAllowed: false as const,
      automaticApprovalAllowed: false as const,
    },
    readiness: {
      objectiveQaProfileReady: true as const,
      actualProviderCandidatePresent: false as const,
      actualCandidateObjectiveQaComplete: false as const,
      visualSemanticEvidenceComplete: false as const,
      forbiddenContentEvidenceComplete: false as const,
      roomStyleEvidenceComplete: false as const,
      rightsProvenanceEvidenceComplete: false as const,
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
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      providerCandidateCreated: false as const,
      reviewDecisionCreated: false as const,
      costMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    immutable: true as const,
  }
  const record = deepFreeze(motionStudioSynchronizedFoleyReviewReadinessV1Schema.parse({
    ...base,
    recordDigest: sha256CanonicalJson(base),
  }))
  await persistReviewReadiness(input.localStorageRoot, record)
  return record
}

export function assertMotionStudioSynchronizedFoleyReviewReadiness(
  input: MotionStudioSynchronizedFoleyReviewReadinessV1,
): void {
  const parsed = motionStudioSynchronizedFoleyReviewReadinessV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.recordDigest
  if (
    sha256CanonicalJson(base) !== parsed.recordDigest ||
    parsed.readiness.actualProviderCandidatePresent || parsed.readiness.readyForHumanReview ||
    parsed.readiness.actualCandidateObjectiveQaComplete ||
    parsed.readiness.visualSemanticEvidenceComplete ||
    parsed.readiness.forbiddenContentEvidenceComplete ||
    parsed.readiness.roomStyleEvidenceComplete ||
    parsed.readiness.rightsProvenanceEvidenceComplete ||
    parsed.readiness.humanReviewComplete ||
    parsed.readiness.readyForSelectionDecision || parsed.readiness.ms012dAccepted ||
    parsed.readiness.productReady || parsed.selection.selectionDecisionCreated ||
    parsed.selection.selected || parsed.selection.firstCandidateAutoAccepted ||
    parsed.selection.finalMixEligible || parsed.selection.timelineEligible ||
    parsed.sideEffects.externalRequestCount !== 0 || parsed.sideEffects.secretPayloadReadCount !== 0 ||
    parsed.sideEffects.providerSubmissionCount !== 0 || parsed.sideEffects.providerCandidateCreated ||
    parsed.sideEffects.reviewDecisionCreated || parsed.sideEffects.costMutationPerformed ||
    parsed.sideEffects.timelineMutationPerformed || parsed.sideEffects.renderPerformed ||
    parsed.sideEffects.exportPerformed || parsed.sideEffects.remoteMutationPerformed
  ) blocked('Synchronized-Foley review readiness crossed an immutable closed candidate or selection boundary.')
}

async function persistReviewReadiness(
  localStorageRoot: string,
  record: MotionStudioSynchronizedFoleyReviewReadinessV1,
): Promise<void> {
  const identity = record.persistence.evidenceObjectIdentityHash
  const relativePath = `motion-studio/synchronized-foley-review-readiness/${identity.slice(0, 2)}/${identity}.json`
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: localStorageRoot, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: localStorageRoot, relativePath })
  if (!stored || !stored.equals(bytes)) {
    blocked('Synchronized-Foley review readiness changed after private create-only persistence.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Synchronized-Foley review readiness time must be canonical ISO-8601.')
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
    requiredGate: 'motion_studio_synchronized_foley_review_readiness',
  })
}
