import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioProviderCandidateIngestEvidence,
  motionStudioProviderCandidateIngestEvidenceV2Schema,
  type MotionStudioProviderCandidateIngestEvidenceV2,
} from './canonical-provider-candidate-ingest'
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
  assertMotionStudioProviderCandidateReviewEvidence,
  motionStudioProviderCandidateReviewEvidenceV1Schema,
  type MotionStudioProviderCandidateReviewEvidenceV1,
} from './canonical-provider-candidate-review-evidence'

export const MOTION_STUDIO_PROVIDER_CANDIDATE_SET_RECONCILIATION_SCHEMA_VERSION =
  'motion-studio.provider-candidate-set-reconciliation.v1' as const

export const MOTION_STUDIO_PROVIDER_CANDIDATE_SET_BLOCKERS = [
  'admitted_provider_operations_and_transport_required',
  'canonical_runtime_receipts_required',
  'actual_private_provider_candidates_required',
  'canonical_authenticated_review_evidence_required',
  'actual_private_asset_versions_required',
  'canonical_attempt_and_unknown_outcome_reconciliation_required',
  'canonical_observed_infrastructure_cost_required',
  'frozen_ms012d_read_only_verdict_required',
] as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const blockerSchema = z.enum(MOTION_STUDIO_PROVIDER_CANDIDATE_SET_BLOCKERS)

const sourceArtifactSchema = z.object({
  outputId: stableIdSchema,
  assetId: stableIdSchema,
  assetVersionId: stableIdSchema,
  role: z.enum([
    'generated_instrumental_score_candidate',
    'provider_synchronized_audio_mp4',
  ]),
  mimeType: z.enum(['audio/wav', 'video/mp4']),
  privateObjectIdentityHash: digestSchema,
  contentSha256: digestSchema,
  byteLength: z.number().int().positive().max(128 * 1024 * 1024),
  checksumReadbackVerified: z.literal(true),
  createOnly: z.literal(true),
}).strict()

const normalizedArtifactSchema = z.object({
  privateObjectIdentityHash: digestSchema,
  sha256: digestSchema,
  byteLength: z.number().int().min(44).max(24 * 1024 * 1024),
  durationMilliseconds: z.number().int().positive().max(30_000),
  mimeType: z.literal('audio/wav'),
  codec: z.literal('pcm_s16le'),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(2),
  privateCreateOnlyReadbackVerified: z.literal(true),
}).strict()

const providerAttemptSchema = z.object({
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
  canonicalReceiptDigest: digestSchema,
  terminalEvidenceDigest: digestSchema,
}).strict()

const sourceRecordSchema = z.object({
  ingestEvidenceId: stableIdSchema,
  ingestEvidenceDigest: digestSchema,
  objectiveQaEvidenceId: stableIdSchema,
  objectiveQaEvidenceDigest: digestSchema,
  reviewContextId: stableIdSchema,
  reviewContextDigest: digestSchema,
  reviewContextFreshnessDigest: digestSchema,
  reviewEvidenceId: stableIdSchema,
  reviewEvidenceDigest: digestSchema,
}).strict()

const streamSchema = z.object({
  intent: z.enum(['generated_music_candidate', 'synchronized_foley_candidate']),
  canonicalRole: z.enum([
    'generated_instrumental_score_candidate',
    'synchronized_visible_action_or_environment_candidate',
  ]),
  sourceRecords: sourceRecordSchema,
  requestAuthorityDigest: digestSchema,
  sourcePurposeId: stableIdSchema,
  sourceArtifact: sourceArtifactSchema,
  normalizedArtifact: normalizedArtifactSchema,
  providerAttempt: providerAttemptSchema,
  reviewContract: z.object({
    requiredGateCount: z.union([z.literal(5), z.literal(6)]),
    contractGateValidationCount: z.union([z.literal(5), z.literal(6)]),
    contractPlaybackDecisionShapeValidated: z.literal(true),
    actualEvidenceSubmissionCount: z.literal(0),
    actualHumanDecisionCount: z.literal(0),
    actualReviewPassed: z.literal(false),
    readyForSelectionDecision: z.literal(false),
  }).strict(),
  cost: z.object({
    contractAttemptCostMicros: z.number().int().nonnegative(),
    providerAttemptCostEvidenceDigest: digestSchema,
    providerAttemptCostEvidenceActual: z.literal(false),
    normalizationInfrastructureCostMicros: z.null(),
    objectiveQaInfrastructureCostMicros: z.null(),
    reviewPreparationInfrastructureCostMicros: z.null(),
    fullCandidateCostReconciled: z.literal(false),
  }).strict(),
}).strict()

export const motionStudioProviderCandidateSetReconciliationV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_PROVIDER_CANDIDATE_SET_RECONCILIATION_SCHEMA_VERSION,
  ),
  reconciliationId: stableIdSchema,
  evidenceClass: z.literal('contract_shaped_server_path_proof_only'),
  state: z.literal('contract_candidate_set_reconciliation_proven_non_promotable'),
  createdAt: isoDateSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  music: streamSchema.extend({
    intent: z.literal('generated_music_candidate'),
    canonicalRole: z.literal('generated_instrumental_score_candidate'),
    sourceArtifact: sourceArtifactSchema.extend({
      role: z.literal('generated_instrumental_score_candidate'),
      mimeType: z.literal('audio/wav'),
    }).strict(),
    reviewContract: streamSchema.shape.reviewContract.extend({
      requiredGateCount: z.literal(6),
      contractGateValidationCount: z.literal(6),
    }).strict(),
  }).strict(),
  synchronizedFoley: streamSchema.extend({
    intent: z.literal('synchronized_foley_candidate'),
    canonicalRole: z.literal('synchronized_visible_action_or_environment_candidate'),
    sourceArtifact: sourceArtifactSchema.extend({
      role: z.literal('provider_synchronized_audio_mp4'),
      mimeType: z.literal('video/mp4'),
    }).strict(),
    reviewContract: streamSchema.shape.reviewContract.extend({
      requiredGateCount: z.literal(5),
      contractGateValidationCount: z.literal(5),
    }).strict(),
  }).strict(),
  sharedAuthority: z.object({
    pictureLockContentDigest: digestSchema,
    timingAuthorityDigest: digestSchema,
    exactApprovedSnapshotShared: z.literal(true),
    exactPictureLockShared: z.literal(true),
    exactTimingAuthorityShared: z.literal(true),
    sourceArtifactsDistinct: z.literal(true),
    normalizedArtifactsDistinct: z.literal(true),
    providerAttemptsDistinct: z.literal(true),
  }).strict(),
  roleBoundary: z.object({
    narrationRemainsSeparate: z.literal(true),
    musicCannotBecomeFoleyAmbienceDialogueOrNarration: z.literal(true),
    foleyCannotBecomeMusicDialogueNarrationOrExactSfx: z.literal(true),
    exactSfxRequiresLicensedOrUserOwnedAsset: z.literal(true),
    providerNativeAudioCannotBecomeMaster: z.literal(true),
    crossRoleSubstitutionAllowed: z.literal(false),
  }).strict(),
  blockers: z.array(blockerSchema).length(
    MOTION_STUDIO_PROVIDER_CANDIDATE_SET_BLOCKERS.length,
  ).readonly(),
  blockerSetDigest: digestSchema,
  cost: z.object({
    contractAttemptCostMicros: z.number().int().nonnegative(),
    actualInternalProductionCostMicros: z.null(),
    providerAttemptCostEvidenceActual: z.literal(false),
    observedInfrastructureCostComplete: z.literal(false),
    fullCandidateSetCostReconciled: z.literal(false),
    failedAndUnknownAttemptCostMustBeRetained: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  readiness: z.object({
    exactContractCandidateSetBound: z.literal(true),
    exactContractAssetVersionShapeBound: z.literal(true),
    contractReviewRecordSetValidated: z.literal(true),
    actualCanonicalRuntimeReceiptsPresent: z.literal(false),
    actualPrivateProviderCandidateSetComplete: z.literal(false),
    actualAuthenticatedReviewSetComplete: z.literal(false),
    actualPrivateAssetVersionSetComplete: z.literal(false),
    actualAttemptAndCostSetComplete: z.literal(false),
    unknownOutcomesReconciled: z.literal(false),
    readyForReadOnlyVerdict: z.literal(false),
    ms012dAccepted: z.literal(false),
    eligibleForMs012e: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  selectionBoundary: z.object({
    selectionAllowedInMs012d: z.literal(false),
    musicSelected: z.literal(false),
    synchronizedFoleySelected: z.literal(false),
    automaticSelectionAllowed: z.literal(false),
    firstOrOnlyCandidateAutoAccepted: z.literal(false),
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
    providerSubmissionCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    actualReviewEvidenceSubmissionCount: z.literal(0),
    actualHumanReviewDecisionCount: z.literal(0),
    selectionCount: z.literal(0),
    finalMixMutationCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  reconciliationDigest: digestSchema,
}).strict().superRefine((value, context) => {
  if (
    value.blockers.join('|') !== MOTION_STUDIO_PROVIDER_CANDIDATE_SET_BLOCKERS.join('|') ||
    value.blockerSetDigest !== sha256CanonicalJson(value.blockers)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['blockers'],
      message: 'Provider candidate-set reconciliation must preserve every blocker in order.',
    })
  }
  if (
    value.cost.contractAttemptCostMicros !==
      value.music.cost.contractAttemptCostMicros +
      value.synchronizedFoley.cost.contractAttemptCostMicros
  ) {
    context.addIssue({
      code: 'custom',
      path: ['cost', 'contractAttemptCostMicros'],
      message: 'Provider candidate-set contract cost must conserve both attempt records.',
    })
  }
  const expectedIdentity = candidateSetIdentity({
    musicIngestEvidenceDigest: value.music.sourceRecords.ingestEvidenceDigest,
    musicReviewEvidenceDigest: value.music.sourceRecords.reviewEvidenceDigest,
    foleyIngestEvidenceDigest: value.synchronizedFoley.sourceRecords.ingestEvidenceDigest,
    foleyReviewEvidenceDigest: value.synchronizedFoley.sourceRecords.reviewEvidenceDigest,
    sharedAuthority: value.sharedAuthority,
    blockerSetDigest: value.blockerSetDigest,
  })
  if (
    value.persistence.evidenceObjectIdentityHash !== expectedIdentity ||
    value.reconciliationId !== `ms012d-candidate-set-${expectedIdentity.slice(0, 24)}`
  ) {
    context.addIssue({
      code: 'custom',
      path: ['persistence', 'evidenceObjectIdentityHash'],
      message: 'Provider candidate-set reconciliation identity is invalid.',
    })
  }
})

export type MotionStudioProviderCandidateSetReconciliationV1 =
  z.infer<typeof motionStudioProviderCandidateSetReconciliationV1Schema>

export interface MotionStudioProviderCandidateSetStreamInput {
  ingestEvidence: MotionStudioProviderCandidateIngestEvidenceV2
  objectiveQa: MotionStudioProviderCandidateObjectiveQaV2
  reviewContext: MotionStudioProviderCandidateReviewContextV1
  freshness: MotionStudioProviderCandidateReviewContextFreshnessV1
  reviewEvidence: MotionStudioProviderCandidateReviewEvidenceV1
}

export async function proveMotionStudioProviderCandidateSetContractReconciliation(input: {
  music: MotionStudioProviderCandidateSetStreamInput
  synchronizedFoley: MotionStudioProviderCandidateSetStreamInput
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioProviderCandidateSetReconciliationV1> {
  assertRoot(input.localStorageRoot)
  const createdAt = exactIso(input.createdAt)
  const music = validateStream(input.music, 'generated_music_candidate')
  const foley = validateStream(input.synchronizedFoley, 'synchronized_foley_candidate')
  assertSharedAuthority(music, foley)
  if (
    Date.parse(createdAt) < Date.parse(music.reviewEvidence.createdAt) ||
    Date.parse(createdAt) < Date.parse(foley.reviewEvidence.createdAt)
  ) invalid('Provider candidate-set reconciliation cannot predate either review record.')

  const sharedAuthority = {
    pictureLockContentDigest: music.reviewContext.requestAuthority.pictureLockContentDigest,
    timingAuthorityDigest: music.reviewContext.requestAuthority.timingAuthorityDigest,
    exactApprovedSnapshotShared: true as const,
    exactPictureLockShared: true as const,
    exactTimingAuthorityShared: true as const,
    sourceArtifactsDistinct: true as const,
    normalizedArtifactsDistinct: true as const,
    providerAttemptsDistinct: true as const,
  }
  const blockers = [...MOTION_STUDIO_PROVIDER_CANDIDATE_SET_BLOCKERS]
  const blockerSetDigest = sha256CanonicalJson(blockers)
  const musicProjection = projectStream(music, 'generated_instrumental_score_candidate')
  const foleyProjection = projectStream(
    foley,
    'synchronized_visible_action_or_environment_candidate',
  )
  const evidenceObjectIdentityHash = candidateSetIdentity({
    musicIngestEvidenceDigest: musicProjection.sourceRecords.ingestEvidenceDigest,
    musicReviewEvidenceDigest: musicProjection.sourceRecords.reviewEvidenceDigest,
    foleyIngestEvidenceDigest: foleyProjection.sourceRecords.ingestEvidenceDigest,
    foleyReviewEvidenceDigest: foleyProjection.sourceRecords.reviewEvidenceDigest,
    sharedAuthority,
    blockerSetDigest,
  })
  const existing = await readMotionStudioProviderCandidateSetReconciliation({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash,
  })
  if (existing) return existing
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_CANDIDATE_SET_RECONCILIATION_SCHEMA_VERSION,
    reconciliationId: `ms012d-candidate-set-${evidenceObjectIdentityHash.slice(0, 24)}`,
    evidenceClass: 'contract_shaped_server_path_proof_only' as const,
    state: 'contract_candidate_set_reconciliation_proven_non_promotable' as const,
    createdAt,
    workspaceId: music.ingest.workspaceId,
    projectId: music.ingest.projectId,
    editSessionId: music.ingest.editSessionId,
    productionId: music.ingest.productionId,
    approvedSnapshotId: music.ingest.approvedSnapshotId,
    approvedSnapshotDigest: music.ingest.approvedSnapshotDigest,
    music: musicProjection,
    synchronizedFoley: foleyProjection,
    sharedAuthority,
    roleBoundary: {
      narrationRemainsSeparate: true as const,
      musicCannotBecomeFoleyAmbienceDialogueOrNarration: true as const,
      foleyCannotBecomeMusicDialogueNarrationOrExactSfx: true as const,
      exactSfxRequiresLicensedOrUserOwnedAsset: true as const,
      providerNativeAudioCannotBecomeMaster: true as const,
      crossRoleSubstitutionAllowed: false as const,
    },
    blockers,
    blockerSetDigest,
    cost: {
      contractAttemptCostMicros:
        musicProjection.cost.contractAttemptCostMicros +
        foleyProjection.cost.contractAttemptCostMicros,
      actualInternalProductionCostMicros: null,
      providerAttemptCostEvidenceActual: false as const,
      observedInfrastructureCostComplete: false as const,
      fullCandidateSetCostReconciled: false as const,
      failedAndUnknownAttemptCostMustBeRetained: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    readiness: {
      exactContractCandidateSetBound: true as const,
      exactContractAssetVersionShapeBound: true as const,
      contractReviewRecordSetValidated: true as const,
      actualCanonicalRuntimeReceiptsPresent: false as const,
      actualPrivateProviderCandidateSetComplete: false as const,
      actualAuthenticatedReviewSetComplete: false as const,
      actualPrivateAssetVersionSetComplete: false as const,
      actualAttemptAndCostSetComplete: false as const,
      unknownOutcomesReconciled: false as const,
      readyForReadOnlyVerdict: false as const,
      ms012dAccepted: false as const,
      eligibleForMs012e: false as const,
      productReady: false as const,
    },
    selectionBoundary: {
      selectionAllowedInMs012d: false as const,
      musicSelected: false as const,
      synchronizedFoleySelected: false as const,
      automaticSelectionAllowed: false as const,
      firstOrOnlyCandidateAutoAccepted: false as const,
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
      providerSubmissionCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      actualReviewEvidenceSubmissionCount: 0 as const,
      actualHumanReviewDecisionCount: 0 as const,
      selectionCount: 0 as const,
      finalMixMutationCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  const record = deepFreeze(motionStudioProviderCandidateSetReconciliationV1Schema.parse({
    ...base,
    reconciliationDigest: sha256CanonicalJson(base),
  }))
  await persistCandidateSetReconciliation(input.localStorageRoot, record)
  return record
}

export function assertMotionStudioProviderCandidateSetReconciliation(
  input: MotionStudioProviderCandidateSetReconciliationV1,
): void {
  const parsed = motionStudioProviderCandidateSetReconciliationV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.reconciliationDigest
  if (
    sha256CanonicalJson(base) !== parsed.reconciliationDigest ||
    parsed.readiness.actualCanonicalRuntimeReceiptsPresent ||
    parsed.readiness.actualPrivateProviderCandidateSetComplete ||
    parsed.readiness.actualAuthenticatedReviewSetComplete ||
    parsed.readiness.actualPrivateAssetVersionSetComplete ||
    parsed.readiness.actualAttemptAndCostSetComplete ||
    parsed.readiness.unknownOutcomesReconciled || parsed.readiness.readyForReadOnlyVerdict ||
    parsed.readiness.ms012dAccepted || parsed.readiness.eligibleForMs012e ||
    parsed.readiness.productReady || parsed.selectionBoundary.selectionAllowedInMs012d ||
    parsed.selectionBoundary.musicSelected ||
    parsed.selectionBoundary.synchronizedFoleySelected ||
    parsed.selectionBoundary.automaticSelectionAllowed ||
    parsed.selectionBoundary.firstOrOnlyCandidateAutoAccepted ||
    parsed.selectionBoundary.finalMixEligible || parsed.selectionBoundary.timelineEligible ||
    parsed.sideEffects.providerSubmissionCount !== 0 ||
    parsed.sideEffects.secretPayloadReadCount !== 0 ||
    parsed.sideEffects.actualReviewEvidenceSubmissionCount !== 0 ||
    parsed.sideEffects.actualHumanReviewDecisionCount !== 0 ||
    parsed.sideEffects.selectionCount !== 0 || parsed.sideEffects.finalMixMutationCount !== 0 ||
    parsed.sideEffects.timelineMutationCount !== 0 || parsed.sideEffects.renderCount !== 0 ||
    parsed.sideEffects.exportCount !== 0 || parsed.sideEffects.remoteMutationCount !== 0
  ) blocked('Provider candidate-set reconciliation crossed its evidence or selection boundary.')
}

export async function readMotionStudioProviderCandidateSetReconciliation(input: {
  localStorageRoot: string
  evidenceObjectIdentityHash: string
}): Promise<MotionStudioProviderCandidateSetReconciliationV1 | null> {
  assertRoot(input.localStorageRoot)
  if (!/^[a-f0-9]{64}$/u.test(input.evidenceObjectIdentityHash)) {
    invalid('Provider candidate-set reconciliation identity is invalid.')
  }
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: reconciliationRelativePath(input.evidenceObjectIdentityHash),
  })
  if (!bytes) return null
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked('Persisted provider candidate-set reconciliation is not canonical JSON.')
  }
  const record = deepFreeze(motionStudioProviderCandidateSetReconciliationV1Schema.parse(decoded))
  assertMotionStudioProviderCandidateSetReconciliation(record)
  const canonicalBytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  if (!bytes.equals(canonicalBytes)) {
    blocked('Persisted provider candidate-set reconciliation is not canonical serialization.')
  }
  return record
}

type ParsedStream = ReturnType<typeof validateStream>

function validateStream(
  input: MotionStudioProviderCandidateSetStreamInput,
  expectedIntent: 'generated_music_candidate' | 'synchronized_foley_candidate',
) {
  assertMotionStudioProviderCandidateIngestEvidence(input.ingestEvidence)
  assertMotionStudioProviderCandidateObjectiveQa(input.objectiveQa)
  assertMotionStudioProviderCandidateReviewContext(input.reviewContext)
  assertMotionStudioProviderCandidateReviewContextFreshness(input.freshness)
  assertMotionStudioProviderCandidateReviewEvidence(input.reviewEvidence)
  const ingest = motionStudioProviderCandidateIngestEvidenceV2Schema.parse(input.ingestEvidence)
  const objectiveQa = motionStudioProviderCandidateObjectiveQaV2Schema.parse(input.objectiveQa)
  const reviewContext = motionStudioProviderCandidateReviewContextV1Schema.parse(
    input.reviewContext,
  )
  const freshness = motionStudioProviderCandidateReviewContextFreshnessV1Schema.parse(
    input.freshness,
  )
  const reviewEvidence = motionStudioProviderCandidateReviewEvidenceV1Schema.parse(
    input.reviewEvidence,
  )
  if (
    ingest.intent !== expectedIntent || objectiveQa.intent !== expectedIntent ||
    reviewContext.intent !== expectedIntent || reviewEvidence.intent !== expectedIntent
  ) invalid('Provider candidate-set stream intent is invalid.')
  if (
    ingest.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    objectiveQa.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    reviewContext.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    freshness.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    reviewEvidence.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    freshness.state !== 'current_contract_path_non_promotable' ||
    freshness.invalidationReasons.length !== 0
  ) blocked('Provider candidate-set contract reconciliation requires exact current non-promotable evidence.')
  if (
    objectiveQa.sourceIngestEvidenceId !== ingest.evidenceId ||
    objectiveQa.sourceIngestEvidenceDigest !== ingest.evidenceDigest ||
    objectiveQa.canonicalReceiptDigest !== ingest.canonicalReceiptDigest ||
    reviewContext.sourceObjectiveQa.evidenceDigest !== objectiveQa.evidenceDigest ||
    reviewContext.reviewContextId !== freshness.reviewContextId ||
    reviewContext.reviewContextDigest !== freshness.reviewContextDigest ||
    reviewEvidence.sourceObjectiveQa.evidenceDigest !== objectiveQa.evidenceDigest ||
    reviewEvidence.sourceReviewContext.reviewContextDigest !== reviewContext.reviewContextDigest ||
    reviewEvidence.sourceReviewContext.freshnessDigest !== freshness.freshnessDigest ||
    reviewEvidence.sourceReviewContext.currentRequestAuthorityDigest !==
      freshness.currentRequestAuthorityDigest ||
    ingest.normalizedArtifact.privateObjectIdentityHash !==
      objectiveQa.candidate.privateObjectIdentityHash ||
    ingest.normalizedArtifact.sha256 !== objectiveQa.candidate.sha256 ||
    objectiveQa.candidate.sha256 !== reviewEvidence.candidate.sha256 ||
    objectiveQa.candidate.privateObjectIdentityHash !==
      reviewEvidence.candidate.privateObjectIdentityHash ||
    ingest.cost.providerAttemptCostEvidenceDigest !==
      objectiveQa.cost.providerAttemptCostEvidenceDigest ||
    objectiveQa.cost.providerAttemptCostEvidenceDigest !==
      reviewEvidence.cost.providerAttemptCostEvidenceDigest ||
    ingest.cost.providerAttemptTotalInternalProductionCostMicros !==
      objectiveQa.cost.providerAttemptTotalInternalProductionCostMicros ||
    objectiveQa.cost.providerAttemptTotalInternalProductionCostMicros !==
      reviewEvidence.cost.providerAttemptTotalInternalProductionCostMicros ||
    sha256CanonicalJson(providerAttemptCore(ingest.providerAttempt)) !==
      sha256CanonicalJson(providerAttemptCore(objectiveQa.providerAttempt)) ||
    sha256CanonicalJson(providerAttemptCore(ingest.providerAttempt)) !==
      sha256CanonicalJson(providerAttemptCore(reviewEvidence.providerAttempt))
  ) blocked('Provider candidate-set stream lineage is incomplete or changed.')
  const scope = [ingest, objectiveQa, reviewContext, reviewEvidence]
  for (const record of scope) {
    if (
      record.workspaceId !== ingest.workspaceId || record.projectId !== ingest.projectId ||
      record.editSessionId !== ingest.editSessionId ||
      record.productionId !== ingest.productionId ||
      record.approvedSnapshotId !== ingest.approvedSnapshotId ||
      record.approvedSnapshotDigest !== ingest.approvedSnapshotDigest
    ) blocked('Provider candidate-set stream scope or approved snapshot changed.')
  }
  if (
    reviewEvidence.readiness.actualReviewEvidenceComplete ||
    reviewEvidence.readiness.reviewPassed || reviewEvidence.readiness.reviewRejected ||
    reviewEvidence.readiness.readyForSelectionDecision ||
    reviewEvidence.sideEffects.actualReviewEvidenceSubmissionCount !== 0 ||
    reviewEvidence.sideEffects.actualHumanReviewDecisionCount !== 0
  ) blocked('Provider candidate-set contract reconciliation cannot consume actual review state.')
  return { ingest, objectiveQa, reviewContext, freshness, reviewEvidence }
}

function assertSharedAuthority(music: ParsedStream, foley: ParsedStream): void {
  if (
    music.ingest.workspaceId !== foley.ingest.workspaceId ||
    music.ingest.projectId !== foley.ingest.projectId ||
    music.ingest.editSessionId !== foley.ingest.editSessionId ||
    music.ingest.productionId !== foley.ingest.productionId ||
    music.ingest.approvedSnapshotId !== foley.ingest.approvedSnapshotId ||
    music.ingest.approvedSnapshotDigest !== foley.ingest.approvedSnapshotDigest
  ) blocked('Provider candidate-set reconciliation requires exact shared scope and snapshot.')
  if (
    music.reviewContext.requestAuthority.pictureLockContentDigest !==
      foley.reviewContext.requestAuthority.pictureLockContentDigest ||
    music.reviewContext.requestAuthority.timingAuthorityDigest !==
      foley.reviewContext.requestAuthority.timingAuthorityDigest
  ) blocked('Provider candidate-set reconciliation requires shared picture and timing authority.')
  if (
    music.ingest.sourceArtifact.outputId === foley.ingest.sourceArtifact.outputId ||
    music.ingest.sourceArtifact.assetId === foley.ingest.sourceArtifact.assetId ||
    music.ingest.sourceArtifact.assetVersionId === foley.ingest.sourceArtifact.assetVersionId ||
    music.ingest.normalizedArtifact.privateObjectIdentityHash ===
      foley.ingest.normalizedArtifact.privateObjectIdentityHash ||
    music.ingest.providerAttempt.queueAttemptId === foley.ingest.providerAttempt.queueAttemptId ||
    music.ingest.providerAttempt.leaseId === foley.ingest.providerAttempt.leaseId
  ) blocked('Provider candidate-set reconciliation requires distinct stream assets and attempts.')
}

function projectStream(
  stream: ParsedStream,
  canonicalRole:
    | 'generated_instrumental_score_candidate'
    | 'synchronized_visible_action_or_environment_candidate',
) {
  const requiredGateCount = stream.reviewEvidence.gateResults.length as 5 | 6
  return {
    intent: stream.ingest.intent,
    canonicalRole,
    sourceRecords: {
      ingestEvidenceId: stream.ingest.evidenceId,
      ingestEvidenceDigest: stream.ingest.evidenceDigest,
      objectiveQaEvidenceId: stream.objectiveQa.evidenceId,
      objectiveQaEvidenceDigest: stream.objectiveQa.evidenceDigest,
      reviewContextId: stream.reviewContext.reviewContextId,
      reviewContextDigest: stream.reviewContext.reviewContextDigest,
      reviewContextFreshnessDigest: stream.freshness.freshnessDigest,
      reviewEvidenceId: stream.reviewEvidence.reviewEvidenceId,
      reviewEvidenceDigest: stream.reviewEvidence.reviewEvidenceDigest,
    },
    requestAuthorityDigest: sha256CanonicalJson(stream.reviewContext.requestAuthority),
    sourcePurposeId: stream.reviewContext.requestAuthority.intent === 'generated_music_candidate'
      ? stream.reviewContext.requestAuthority.cueId
      : stream.reviewContext.requestAuthority.soundEventId,
    sourceArtifact: {
      outputId: stream.ingest.sourceArtifact.outputId,
      assetId: stream.ingest.sourceArtifact.assetId,
      assetVersionId: stream.ingest.sourceArtifact.assetVersionId,
      role: stream.ingest.sourceArtifact.role,
      mimeType: stream.ingest.sourceArtifact.mimeType,
      privateObjectIdentityHash: stream.ingest.sourceArtifact.privateObjectIdentityHash,
      contentSha256: stream.ingest.sourceArtifact.contentSha256,
      byteLength: stream.ingest.sourceArtifact.byteLength,
      checksumReadbackVerified: stream.ingest.sourceArtifact.checksumReadbackVerified,
      createOnly: stream.ingest.sourceArtifact.createOnly,
    },
    normalizedArtifact: {
      privateObjectIdentityHash: stream.ingest.normalizedArtifact.privateObjectIdentityHash,
      sha256: stream.ingest.normalizedArtifact.sha256,
      byteLength: stream.ingest.normalizedArtifact.byteLength,
      durationMilliseconds: stream.ingest.normalizedArtifact.durationMilliseconds,
      mimeType: stream.ingest.normalizedArtifact.mimeType,
      codec: stream.ingest.normalizedArtifact.codec,
      sampleRateHertz: stream.ingest.normalizedArtifact.sampleRateHertz,
      channelCount: stream.ingest.normalizedArtifact.channelCount,
      privateCreateOnlyReadbackVerified:
        stream.ingest.normalizedArtifact.privateCreateOnlyReadbackVerified,
    },
    providerAttempt: {
      approvedPackageId: stream.ingest.providerAttempt.approvedPackageId,
      approvedPackageDigest: stream.ingest.providerAttempt.approvedPackageDigest,
      approvedWorkItemId: stream.ingest.providerAttempt.approvedWorkItemId,
      queueJobId: stream.ingest.providerAttempt.queueJobId,
      queueAttemptId: stream.ingest.providerAttempt.queueAttemptId,
      claimId: stream.ingest.providerAttempt.claimId,
      leaseId: stream.ingest.providerAttempt.leaseId,
      idempotencyKeyHash: stream.ingest.providerAttempt.idempotencyKeyHash,
      providerOperationId: stream.ingest.providerAttempt.providerOperationId,
      providerRouteId: stream.ingest.providerAttempt.providerRouteId,
      providerModelId: stream.ingest.providerAttempt.providerModelId,
      canonicalReceiptDigest: stream.ingest.canonicalReceiptDigest,
      terminalEvidenceDigest: stream.ingest.providerAttempt.terminalEvidenceDigest,
    },
    reviewContract: {
      requiredGateCount,
      contractGateValidationCount: requiredGateCount,
      contractPlaybackDecisionShapeValidated: true as const,
      actualEvidenceSubmissionCount: 0 as const,
      actualHumanDecisionCount: 0 as const,
      actualReviewPassed: false as const,
      readyForSelectionDecision: false as const,
    },
    cost: {
      contractAttemptCostMicros:
        stream.reviewEvidence.cost.providerAttemptTotalInternalProductionCostMicros,
      providerAttemptCostEvidenceDigest:
        stream.reviewEvidence.cost.providerAttemptCostEvidenceDigest,
      providerAttemptCostEvidenceActual: false as const,
      normalizationInfrastructureCostMicros: null,
      objectiveQaInfrastructureCostMicros: null,
      reviewPreparationInfrastructureCostMicros: null,
      fullCandidateCostReconciled: false as const,
    },
  }
}

function candidateSetIdentity(input: {
  musicIngestEvidenceDigest: string
  musicReviewEvidenceDigest: string
  foleyIngestEvidenceDigest: string
  foleyReviewEvidenceDigest: string
  sharedAuthority: unknown
  blockerSetDigest: string
}): string {
  return sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_set_reconciliation_v1',
    ...input,
  })
}

function providerAttemptCore(input: {
  approvedPackageId: string
  approvedPackageDigest: string
  approvedWorkItemId: string
  queueJobId: string
  queueAttemptId: string
  claimId: string
  leaseId: string
  idempotencyKeyHash: string
  providerOperationId: string
  providerRouteId: string
  providerModelId: string
  terminalEvidenceDigest: string
}) {
  return {
    approvedPackageId: input.approvedPackageId,
    approvedPackageDigest: input.approvedPackageDigest,
    approvedWorkItemId: input.approvedWorkItemId,
    queueJobId: input.queueJobId,
    queueAttemptId: input.queueAttemptId,
    claimId: input.claimId,
    leaseId: input.leaseId,
    idempotencyKeyHash: input.idempotencyKeyHash,
    providerOperationId: input.providerOperationId,
    providerRouteId: input.providerRouteId,
    providerModelId: input.providerModelId,
    terminalEvidenceDigest: input.terminalEvidenceDigest,
  }
}

async function persistCandidateSetReconciliation(
  root: string,
  record: MotionStudioProviderCandidateSetReconciliationV1,
): Promise<void> {
  const relativePath = reconciliationRelativePath(
    record.persistence.evidenceObjectIdentityHash,
  )
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: root, relativePath, content: bytes })
  const stored = await readMotionStudioProviderCandidateSetReconciliation({
    localStorageRoot: root,
    evidenceObjectIdentityHash: record.persistence.evidenceObjectIdentityHash,
  })
  if (!stored || stored.reconciliationDigest !== record.reconciliationDigest) {
    blocked('Provider candidate-set reconciliation changed after create-only persistence.')
  }
}

function reconciliationRelativePath(identity: string): string {
  return `motion-studio/provider-candidate-set-reconciliation/${identity.slice(0, 2)}/${identity}.json`
}

function assertRoot(root: string): void {
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-set-[A-Za-z0-9._-]+$/u.test(root)) {
    invalid('Provider candidate-set reconciliation requires its bounded private root.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Provider candidate-set reconciliation time must be canonical ISO-8601.')
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
    requiredGate: 'motion_studio_provider_candidate_set_reconciliation',
  })
}
