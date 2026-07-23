import { z } from 'zod'

import type { MotionStudioGeneratedMusicCandidateRequestV1 } from '../../../src/types/motion-studio'
import { motionStudioGeneratedMusicCandidateRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioLyriaD3PreflightPlan,
  type MotionStudioLyriaD3PreflightPlanV1,
} from './lyria-d3-preflight'
import {
  assertMotionStudioLyriaD3PrivateIngestReadiness,
  motionStudioLyriaD3PrivateIngestReadinessV1Schema,
  type MotionStudioLyriaD3PrivateIngestReadinessV1,
} from './lyria-d3-private-ingest-readiness'

export const MOTION_STUDIO_LYRIA_D3_REVIEW_READINESS_SCHEMA_VERSION =
  'motion-studio.lyria-d3-review-readiness.v1' as const

const SHA256 = /^[a-f0-9]{64}$/u
const digestSchema = z.string().regex(SHA256)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })

const reviewGateSchema = z.enum([
  'creative_cue_and_picture_fit',
  'originality_and_no_copy',
  'musical_continuity',
  'speech_safety_and_loudness',
  'candidate_rights_and_provenance',
  'human_listening_review',
])

const evidenceKindSchema = z.enum([
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
])

export const MOTION_STUDIO_LYRIA_D3_REVIEW_REQUIREMENTS = deepFreeze([
  {
    gate: 'creative_cue_and_picture_fit',
    requiredEvidenceKinds: [
      'exact_music_bible_cue_picture_timing',
      'private_normalized_candidate_audio',
      'actual_candidate_objective_qa',
      'creative_cue_picture_analysis',
    ],
    reviewQuestion: 'Does the music serve the approved narrative purpose, emotional direction, picture, cue range, and ending behavior without changing story meaning?',
  },
  {
    gate: 'originality_and_no_copy',
    requiredEvidenceKinds: [
      'private_normalized_candidate_audio',
      'canonical_provider_attempt_lineage',
      'originality_no_copy_analysis',
    ],
    reviewQuestion: 'Is the instrumental candidate original and free of copied songs, melodies, artist imitation, vocals, lyrics, or reference-audio continuation?',
  },
  {
    gate: 'musical_continuity',
    requiredEvidenceKinds: [
      'exact_music_bible_cue_picture_timing',
      'private_normalized_candidate_audio',
      'music_continuity_review',
    ],
    reviewQuestion: 'Does the candidate maintain intentional musical development, stable instrumentation, usable transitions, and the approved ending across the complete cue?',
  },
  {
    gate: 'speech_safety_and_loudness',
    requiredEvidenceKinds: [
      'exact_music_bible_cue_picture_timing',
      'private_normalized_candidate_audio',
      'actual_candidate_objective_qa',
      'speech_safety_loudness_analysis',
    ],
    reviewQuestion: 'Can the candidate be mixed under narration without masking speech, clipping, unsafe true peak, or unapproved energy changes in protected speech ranges?',
  },
  {
    gate: 'candidate_rights_and_provenance',
    requiredEvidenceKinds: [
      'canonical_provider_attempt_lineage',
      'rights_provenance_disclosure_retention',
    ],
    reviewQuestion: 'Are exact provider lineage, usage, cost, rights, disclosure, retention, private-ingest, and immutable artifact evidence complete for this candidate?',
  },
  {
    gate: 'human_listening_review',
    requiredEvidenceKinds: [
      'exact_music_bible_cue_picture_timing',
      'private_normalized_candidate_audio',
      'complete_human_listening_attestation',
    ],
    reviewQuestion: 'After complete private playback in picture and narration context, is the candidate musically coherent, appropriate, speech-safe, and free of distracting artifacts?',
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

export const motionStudioLyriaD3ReviewReadinessV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_REVIEW_READINESS_SCHEMA_VERSION),
  reviewReadinessId: stableIdSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  sourceMusicRequestId: stableIdSchema,
  sourceMusicRequestDigest: digestSchema,
  sourceCueId: stableIdSchema,
  musicBibleArtifactVersionId: stableIdSchema,
  musicBibleContentDigest: digestSchema,
  pictureLockArtifactVersionId: stableIdSchema,
  pictureLockContentDigest: digestSchema,
  timingAuthorityDigest: digestSchema,
  sourcePreflightPlanId: stableIdSchema,
  sourcePreflightDigest: digestSchema,
  privateIngestReadinessEvidenceId: stableIdSchema,
  privateIngestReadinessEvidenceDigest: digestSchema,
  privateIngestQaDigest: digestSchema,
  state: z.literal('review_intake_contract_ready_actual_candidate_absent'),
  createdAt: isoDateSchema,
  candidateIntake: z.object({
    requiredEvidenceClass: z.literal('actual_authorized_private_provider_candidate'),
    sameMusicRequestRequired: z.literal(true),
    sameMusicBibleCueRequired: z.literal(true),
    samePictureLockRequired: z.literal(true),
    sameTimingAuthorityRequired: z.literal(true),
    canonicalProviderAttemptRequired: z.literal(true),
    canonicalSingleUseDispatchRequired: z.literal(true),
    privateNormalizedAudioRequired: z.literal(true),
    objectiveQaUsingFrozenProfileRequired: z.literal(true),
    exactProviderUsageAndCostRequired: z.literal(true),
    providerAndInfrastructureCostSeparated: z.literal(true),
    maximumProviderSubmissions: z.literal(1),
    maximumCandidates: z.literal(1),
    retryAllowed: z.literal(false),
    fallbackAllowed: z.literal(false),
    temporaryProviderUrlEligible: z.literal(false),
    syntheticFixtureEligible: z.literal(false),
  }).strict(),
  reviewRequirements: z.array(reviewRequirementSchema)
    .length(MOTION_STUDIO_LYRIA_D3_REVIEW_REQUIREMENTS.length).readonly(),
  humanReview: z.object({
    privatePictureAndNarrationContextPlaybackRequired: z.literal(true),
    completeCandidatePlaybackRequired: z.literal(true),
    humanAuthoredGateResultsRequired: z.literal(true),
    explicitAttestationText: z.literal(
      'I REVIEWED THE COMPLETE PRIVATE MUSIC CANDIDATE IN PICTURE AND NARRATION CONTEXT',
    ),
    automaticHumanReviewAllowed: z.literal(false),
    automaticApprovalAllowed: z.literal(false),
  }).strict(),
  readiness: z.object({
    normalizationAndObjectiveQaProfileReady: z.literal(true),
    actualProviderCandidatePresent: z.literal(false),
    actualCandidateObjectiveQaComplete: z.literal(false),
    creativeCuePictureEvidenceComplete: z.literal(false),
    originalityNoCopyEvidenceComplete: z.literal(false),
    musicalContinuityEvidenceComplete: z.literal(false),
    speechSafetyLoudnessEvidenceComplete: z.literal(false),
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
    finalMixMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  recordDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const gates = value.reviewRequirements.map((entry) => entry.gate)
  const expected = MOTION_STUDIO_LYRIA_D3_REVIEW_REQUIREMENTS.map((entry) => entry.gate)
  if (gates.join('|') !== expected.join('|') || new Set(gates).size !== expected.length) {
    context.addIssue({
      code: 'custom',
      path: ['reviewRequirements'],
      message: 'Lyria review readiness must preserve every required gate in canonical order.',
    })
  }
  for (const [index, requirement] of MOTION_STUDIO_LYRIA_D3_REVIEW_REQUIREMENTS.entries()) {
    const actual = value.reviewRequirements[index]
    if (
      !actual || actual.gate !== requirement.gate ||
      actual.requiredEvidenceKinds.join('|') !== requirement.requiredEvidenceKinds.join('|') ||
      actual.reviewQuestion !== requirement.reviewQuestion ||
      actual.evidenceDigest !== sha256CanonicalJson({
        sourceMusicRequestDigest: value.sourceMusicRequestDigest,
        privateIngestReadinessEvidenceDigest: value.privateIngestReadinessEvidenceDigest,
        gate: requirement.gate,
        requiredEvidenceKinds: requirement.requiredEvidenceKinds,
        reviewQuestion: requirement.reviewQuestion,
      })
    ) {
      context.addIssue({
        code: 'custom',
        path: ['reviewRequirements', index],
        message: 'Lyria review requirements must match the frozen evidence contract.',
      })
    }
  }
  const requirementsDigest = sha256CanonicalJson(value.reviewRequirements)
  const expectedEvidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_lyria_d3_review_readiness_v1',
    sourceMusicRequestDigest: value.sourceMusicRequestDigest,
    sourcePreflightDigest: value.sourcePreflightDigest,
    privateIngestReadinessEvidenceDigest: value.privateIngestReadinessEvidenceDigest,
    requirementsDigest,
  })
  if (
    value.persistence.evidenceObjectIdentityHash !== expectedEvidenceObjectIdentityHash ||
    value.reviewReadinessId !== `ms012d3-review-readiness-${expectedEvidenceObjectIdentityHash.slice(0, 32)}`
  ) {
    context.addIssue({
      code: 'custom',
      path: ['persistence', 'evidenceObjectIdentityHash'],
      message: 'Lyria review readiness identity must derive from the exact request, preflight, ingest, and review requirements.',
    })
  }
})

export type MotionStudioLyriaD3ReviewReadinessV1 =
  z.infer<typeof motionStudioLyriaD3ReviewReadinessV1Schema>

export async function proveMotionStudioLyriaD3ReviewReadiness(input: {
  request: MotionStudioGeneratedMusicCandidateRequestV1
  preflight: MotionStudioLyriaD3PreflightPlanV1
  privateIngestReadiness: MotionStudioLyriaD3PrivateIngestReadinessV1
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioLyriaD3ReviewReadinessV1> {
  const request = motionStudioGeneratedMusicCandidateRequestV1Schema.parse(input.request) as
    MotionStudioGeneratedMusicCandidateRequestV1
  assertMotionStudioLyriaD3PreflightPlan(input.preflight)
  assertMotionStudioLyriaD3PrivateIngestReadiness(input.privateIngestReadiness)
  const privateIngest = motionStudioLyriaD3PrivateIngestReadinessV1Schema.parse(
    input.privateIngestReadiness,
  )
  if (!/^\/tmp\/reeditpro-motion-studio-lyria-d3-private-ingest-[A-Za-z0-9._-]+$/u.test(input.localStorageRoot)) {
    invalid('Lyria review readiness requires the bounded private-ingest local root.')
  }
  const createdAt = exactIso(input.createdAt)
  if (Date.parse(createdAt) < Date.parse(privateIngest.createdAt)) {
    invalid('Lyria review readiness cannot predate private-ingest readiness.')
  }
  assertLineage(request, input.preflight, privateIngest)
  if (
    !privateIngest.qa.structuralQaPassed || privateIngest.qa.semanticAndListeningQaComplete ||
    privateIngest.qa.actualProviderCandidateQaComplete || privateIngest.privateCandidateCreated ||
    privateIngest.providerExecutionAllowed || privateIngest.finalMixAllowed
  ) blocked('Lyria review readiness requires the exact execution-blocked normalization and objective-QA profile evidence.')

  const reviewRequirements = MOTION_STUDIO_LYRIA_D3_REVIEW_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    state: 'actual_candidate_evidence_required' as const,
    blocking: true as const,
    evidenceDigest: sha256CanonicalJson({
      sourceMusicRequestDigest: input.preflight.sourceMusicRequestDigest,
      privateIngestReadinessEvidenceDigest: privateIngest.evidenceDigest,
      gate: requirement.gate,
      requiredEvidenceKinds: requirement.requiredEvidenceKinds,
      reviewQuestion: requirement.reviewQuestion,
    }),
  }))
  const requirementsDigest = sha256CanonicalJson(reviewRequirements)
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_lyria_d3_review_readiness_v1',
    sourceMusicRequestDigest: input.preflight.sourceMusicRequestDigest,
    sourcePreflightDigest: input.preflight.preflightDigest,
    privateIngestReadinessEvidenceDigest: privateIngest.evidenceDigest,
    requirementsDigest,
  })
  const base = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_REVIEW_READINESS_SCHEMA_VERSION,
    reviewReadinessId: `ms012d3-review-readiness-${evidenceObjectIdentityHash.slice(0, 32)}`,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
    sourceMusicRequestId: request.musicRequestId,
    sourceMusicRequestDigest: input.preflight.sourceMusicRequestDigest,
    sourceCueId: request.cue.cueId,
    musicBibleArtifactVersionId: request.musicBibleArtifactVersion.versionId,
    musicBibleContentDigest: request.musicBibleContentDigest,
    pictureLockArtifactVersionId: request.pictureLockArtifactVersion.versionId,
    pictureLockContentDigest: request.pictureLockContentDigest,
    timingAuthorityDigest: request.timingAuthorityDigest,
    sourcePreflightPlanId: input.preflight.preflightPlanId,
    sourcePreflightDigest: input.preflight.preflightDigest,
    privateIngestReadinessEvidenceId: privateIngest.evidenceId,
    privateIngestReadinessEvidenceDigest: privateIngest.evidenceDigest,
    privateIngestQaDigest: privateIngest.qa.qaDigest,
    state: 'review_intake_contract_ready_actual_candidate_absent' as const,
    createdAt,
    candidateIntake: {
      requiredEvidenceClass: 'actual_authorized_private_provider_candidate' as const,
      sameMusicRequestRequired: true as const,
      sameMusicBibleCueRequired: true as const,
      samePictureLockRequired: true as const,
      sameTimingAuthorityRequired: true as const,
      canonicalProviderAttemptRequired: true as const,
      canonicalSingleUseDispatchRequired: true as const,
      privateNormalizedAudioRequired: true as const,
      objectiveQaUsingFrozenProfileRequired: true as const,
      exactProviderUsageAndCostRequired: true as const,
      providerAndInfrastructureCostSeparated: true as const,
      maximumProviderSubmissions: 1 as const,
      maximumCandidates: 1 as const,
      retryAllowed: false as const,
      fallbackAllowed: false as const,
      temporaryProviderUrlEligible: false as const,
      syntheticFixtureEligible: false as const,
    },
    reviewRequirements,
    humanReview: {
      privatePictureAndNarrationContextPlaybackRequired: true as const,
      completeCandidatePlaybackRequired: true as const,
      humanAuthoredGateResultsRequired: true as const,
      explicitAttestationText:
        'I REVIEWED THE COMPLETE PRIVATE MUSIC CANDIDATE IN PICTURE AND NARRATION CONTEXT' as const,
      automaticHumanReviewAllowed: false as const,
      automaticApprovalAllowed: false as const,
    },
    readiness: {
      normalizationAndObjectiveQaProfileReady: true as const,
      actualProviderCandidatePresent: false as const,
      actualCandidateObjectiveQaComplete: false as const,
      creativeCuePictureEvidenceComplete: false as const,
      originalityNoCopyEvidenceComplete: false as const,
      musicalContinuityEvidenceComplete: false as const,
      speechSafetyLoudnessEvidenceComplete: false as const,
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
      finalMixMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    immutable: true as const,
  }
  const record = deepFreeze(motionStudioLyriaD3ReviewReadinessV1Schema.parse({
    ...base,
    recordDigest: sha256CanonicalJson(base),
  }))
  await persistReviewReadiness(input.localStorageRoot, record)
  return record
}

export function assertMotionStudioLyriaD3ReviewReadiness(
  input: MotionStudioLyriaD3ReviewReadinessV1,
): void {
  const parsed = motionStudioLyriaD3ReviewReadinessV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.recordDigest
  if (
    sha256CanonicalJson(base) !== parsed.recordDigest ||
    parsed.readiness.actualProviderCandidatePresent ||
    parsed.readiness.actualCandidateObjectiveQaComplete ||
    parsed.readiness.creativeCuePictureEvidenceComplete ||
    parsed.readiness.originalityNoCopyEvidenceComplete ||
    parsed.readiness.musicalContinuityEvidenceComplete ||
    parsed.readiness.speechSafetyLoudnessEvidenceComplete ||
    parsed.readiness.rightsProvenanceEvidenceComplete ||
    parsed.readiness.humanReviewComplete || parsed.readiness.readyForHumanReview ||
    parsed.readiness.readyForSelectionDecision || parsed.readiness.ms012dAccepted ||
    parsed.readiness.productReady || parsed.selection.selectionDecisionCreated ||
    parsed.selection.selected || parsed.selection.firstCandidateAutoAccepted ||
    parsed.selection.finalMixEligible || parsed.selection.timelineEligible ||
    parsed.sideEffects.externalRequestCount !== 0 || parsed.sideEffects.secretPayloadReadCount !== 0 ||
    parsed.sideEffects.providerSubmissionCount !== 0 || parsed.sideEffects.providerCandidateCreated ||
    parsed.sideEffects.reviewDecisionCreated || parsed.sideEffects.costMutationPerformed ||
    parsed.sideEffects.finalMixMutationPerformed || parsed.sideEffects.timelineMutationPerformed ||
    parsed.sideEffects.renderPerformed || parsed.sideEffects.exportPerformed ||
    parsed.sideEffects.remoteMutationPerformed
  ) blocked('Lyria review readiness crossed an immutable candidate, review, selection, or execution boundary.')
}

function assertLineage(
  request: MotionStudioGeneratedMusicCandidateRequestV1,
  preflight: MotionStudioLyriaD3PreflightPlanV1,
  privateIngest: MotionStudioLyriaD3PrivateIngestReadinessV1,
): void {
  const requestDigest = sha256CanonicalJson(request)
  if (
    preflight.sourceMusicRequestId !== request.musicRequestId ||
    preflight.sourceMusicRequestDigest !== requestDigest ||
    privateIngest.sourcePreflightPlanId !== preflight.preflightPlanId ||
    privateIngest.sourcePreflightDigest !== preflight.preflightDigest ||
    request.workspaceId !== preflight.workspaceId || request.projectId !== preflight.projectId ||
    request.editSessionId !== preflight.editSessionId || request.productionId !== preflight.productionId ||
    privateIngest.workspaceId !== request.workspaceId || privateIngest.projectId !== request.projectId ||
    privateIngest.editSessionId !== request.editSessionId || privateIngest.productionId !== request.productionId
  ) blocked('Lyria review readiness requires the exact music request, preflight, and private-ingest lineage.')
}

async function persistReviewReadiness(
  localStorageRoot: string,
  record: MotionStudioLyriaD3ReviewReadinessV1,
): Promise<void> {
  const identity = record.persistence.evidenceObjectIdentityHash
  const relativePath = `motion-studio/lyria-d3-review-readiness/${identity.slice(0, 2)}/${identity}.json`
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: localStorageRoot, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: localStorageRoot, relativePath })
  if (!stored || !stored.equals(bytes)) {
    blocked('Lyria review readiness changed after private create-only persistence.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Lyria review readiness time must be canonical ISO-8601.')
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
    requiredGate: 'motion_studio_lyria_d3_review_readiness',
  })
}
