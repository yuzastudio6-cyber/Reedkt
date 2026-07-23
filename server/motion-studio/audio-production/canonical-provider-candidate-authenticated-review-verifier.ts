import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { authorizeWorkspaceAccess } from '../../services/workspace-access-service'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
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
  type MotionStudioProviderCandidateGateReviewInput,
  type MotionStudioProviderCandidateHumanPlaybackInput,
  type MotionStudioProviderCandidateReviewEvidenceItemInput,
} from './canonical-provider-candidate-review-evidence'
import {
  assertMotionStudioProviderCandidateReviewHandoff,
  motionStudioProviderCandidateReviewHandoffV2Schema,
  type MotionStudioProviderCandidateReviewEvidenceKind,
  type MotionStudioProviderCandidateReviewHandoffV2,
} from './canonical-provider-candidate-review-handoff'

export const MOTION_STUDIO_PROVIDER_CANDIDATE_AUTHENTICATED_REVIEW_VERIFIER_SCHEMA_VERSION =
  'motion-studio.provider-candidate-authenticated-review-verifier.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const evidenceClassSchema = z.enum([
  'contract_verifier_path_proof_only',
  'canonical_authenticated_runtime',
])
const sourceClassSchema = z.enum([
  'canonical_project_authority',
  'private_media_readback',
  'canonical_provider_attempt',
  'deterministic_objective_qa',
  'reviewer_analysis',
  'rights_provenance_record',
  'complete_private_playback_attestation',
])

const sourceAuthorityReceiptSchema = z.object({
  gate: stableIdSchema,
  kind: stableIdSchema,
  evidenceId: stableIdSchema,
  sourceClass: sourceClassSchema,
  sourceRecordDigest: digestSchema,
  authorityReceiptDigest: digestSchema,
  actualAuthorityReadbackVerified: z.boolean(),
  privateOnly: z.literal(true),
  rawPayloadPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  receiptDigest: digestSchema,
}).strict()

const playbackAuthorityReceiptSchema = z.object({
  playbackSessionId: stableIdSchema,
  authenticatedReviewerActorId: stableIdSchema,
  candidateSha256: digestSchema,
  reviewContextDigest: digestSchema,
  privateMediaReadReceiptDigest: digestSchema,
  playbackCoverageDigest: digestSchema,
  candidateDurationMilliseconds: z.number().int().positive().max(30_000),
  coverageStartMilliseconds: z.literal(0),
  coverageEndMilliseconds: z.number().int().positive().max(30_000),
  unverifiedGapMilliseconds: z.literal(0),
  privateMediaChecksumVerified: z.literal(true),
  completePlaybackAttested: z.literal(true),
  actualAuthenticatedPrivatePlaybackVerified: z.boolean(),
  receiptDigest: digestSchema,
}).strict().superRefine((value, context) => {
  if (value.coverageEndMilliseconds !== value.candidateDurationMilliseconds) {
    context.addIssue({
      code: 'custom',
      path: ['coverageEndMilliseconds'],
      message: 'Authenticated review playback coverage must span the exact candidate duration.',
    })
  }
})

export const motionStudioProviderCandidateAuthenticatedReviewVerifierV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_PROVIDER_CANDIDATE_AUTHENTICATED_REVIEW_VERIFIER_SCHEMA_VERSION,
  ),
  verificationId: stableIdSchema,
  evidenceClass: evidenceClassSchema,
  state: z.enum([
    'contract_verifier_path_proven_non_promotable',
    'canonical_authenticated_review_submission_verified_not_selected',
  ]),
  createdAt: isoDateSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  intent: z.enum(['generated_music_candidate', 'synchronized_foley_candidate']),
  sourceAuthority: z.object({
    objectiveQaEvidenceDigest: digestSchema,
    reviewHandoffDigest: digestSchema,
    reviewContextDigest: digestSchema,
    freshnessDigest: digestSchema,
    requestAuthorityDigest: digestSchema,
    candidatePrivateObjectIdentityHash: digestSchema,
    candidateSha256: digestSchema,
    candidateByteLength: z.number().int().min(44).max(24 * 1024 * 1024),
    candidateDurationMilliseconds: z.number().int().positive().max(30_000),
  }).strict(),
  authenticatedActor: z.object({
    actorUserId: stableIdSchema,
    authenticationClass: z.enum([
      'local_contract_fixture_only',
      'verified_bearer_workspace_member',
    ]),
    workspaceRole: z.enum(['fixture_owner', 'owner', 'admin', 'editor']),
    requestIdHash: digestSchema,
    authenticatedWorkspaceAccessVerified: z.boolean(),
    accessTokenPersisted: z.literal(false),
    rawAuthenticationPayloadPersisted: z.literal(false),
  }).strict(),
  reviewSubmission: z.object({
    gateCount: z.union([z.literal(5), z.literal(6)]),
    sourceEvidenceReceiptCount: z.number().int().min(10).max(48),
    allReviewerActorIdsMatchAuthenticatedActor: z.literal(true),
    submissionDigest: digestSchema,
  }).strict(),
  sourceEvidenceReceipts: z.array(sourceAuthorityReceiptSchema).min(10).max(48).readonly(),
  playbackReceipt: playbackAuthorityReceiptSchema,
  readiness: z.object({
    verifierContractPathProven: z.literal(true),
    exactReviewLineageVerified: z.literal(true),
    sourceEvidenceAuthorityVerified: z.boolean(),
    completePrivatePlaybackVerified: z.boolean(),
    canonicalAuthenticatedReviewEvidenceVerified: z.boolean(),
    reviewDecisionAccepted: z.literal(false),
    selectionDecisionCreated: z.literal(false),
    ms012dAccepted: z.literal(false),
    eligibleForMs012e: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    createOnly: z.literal(true),
    verificationPersisted: z.literal(true),
    localPathProjected: z.literal(false),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  sideEffects: z.object({
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
  verificationDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const actual = value.evidenceClass === 'canonical_authenticated_runtime'
  if (
    value.state !== (actual
      ? 'canonical_authenticated_review_submission_verified_not_selected'
      : 'contract_verifier_path_proven_non_promotable') ||
    value.authenticatedActor.authenticationClass !== (actual
      ? 'verified_bearer_workspace_member'
      : 'local_contract_fixture_only') ||
    value.authenticatedActor.authenticatedWorkspaceAccessVerified !== actual ||
    value.sourceEvidenceReceipts.some((receipt) =>
      receipt.actualAuthorityReadbackVerified !== actual) ||
    value.playbackReceipt.actualAuthenticatedPrivatePlaybackVerified !== actual ||
    value.readiness.sourceEvidenceAuthorityVerified !== actual ||
    value.readiness.completePrivatePlaybackVerified !== actual ||
    value.readiness.canonicalAuthenticatedReviewEvidenceVerified !== actual
  ) {
    context.addIssue({
      code: 'custom',
      path: ['evidenceClass'],
      message: 'Authenticated review verification provenance cannot be promoted or relabelled.',
    })
  }
})

export type MotionStudioProviderCandidateAuthenticatedReviewVerifierV1 =
  z.infer<typeof motionStudioProviderCandidateAuthenticatedReviewVerifierV1Schema>

interface SharedVerifierInput {
  objectiveQa: MotionStudioProviderCandidateObjectiveQaV2
  reviewHandoff: MotionStudioProviderCandidateReviewHandoffV2
  reviewContext: MotionStudioProviderCandidateReviewContextV1
  freshness: MotionStudioProviderCandidateReviewContextFreshnessV1
  gateReviews: readonly MotionStudioProviderCandidateGateReviewInput[]
  humanPlayback: MotionStudioProviderCandidateHumanPlaybackInput
  localStorageRoot: string
  createdAt: string
}

export interface MotionStudioProviderCandidateAuthenticatedReviewVerifierAdapters {
  verifySourceEvidence(input: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    approvedSnapshotId: string
    actorUserId: string
    gate: string
    kind: MotionStudioProviderCandidateReviewEvidenceKind
    evidenceId: string
    sourceClass: MotionStudioProviderCandidateReviewEvidenceItemInput['sourceClass']
    sourceRecordDigest: string
  }): Promise<{
    evidenceId: string
    sourceClass: MotionStudioProviderCandidateReviewEvidenceItemInput['sourceClass']
    sourceRecordDigest: string
    authorityReceiptDigest: string
    actualAuthorityReadbackVerified: true
  }>
  verifyCompletePrivatePlayback(input: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    actorUserId: string
    playbackSessionId: string
    candidatePrivateObjectIdentityHash: string
    candidateSha256: string
    candidateByteLength: number
    candidateDurationMilliseconds: number
    reviewContextDigest: string
  }): Promise<{
    playbackSessionId: string
    authenticatedReviewerActorId: string
    candidateSha256: string
    reviewContextDigest: string
    privateMediaReadReceiptDigest: string
    playbackCoverageDigest: string
    candidateDurationMilliseconds: number
    coverageStartMilliseconds: 0
    coverageEndMilliseconds: number
    unverifiedGapMilliseconds: 0
    privateMediaChecksumVerified: true
    completePlaybackAttested: true
    actualAuthenticatedPrivatePlaybackVerified: true
  }>
}

export async function proveMotionStudioProviderCandidateAuthenticatedReviewVerifierContract(
  input: SharedVerifierInput,
): Promise<MotionStudioProviderCandidateAuthenticatedReviewVerifierV1> {
  const source = validateSourcesAndSubmission(input)
  if (
    source.objectiveQa.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    source.reviewHandoff.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    source.reviewContext.evidenceClass !== 'contract_shaped_server_path_proof_only' ||
    source.freshness.state !== 'current_contract_path_non_promotable'
  ) blocked('Contract authenticated-review verifier proof requires exact non-promotable lineage.')
  const sourceEvidenceReceipts = source.evidenceItems.map((item) =>
    projectSourceReceipt(item, false, sha256CanonicalJson({
      domain: 'motion_studio_authenticated_review_contract_source_receipt_v1',
      ...item,
    })))
  const playbackReceipt = projectPlaybackReceipt({
    input: source.humanPlayback,
    source,
    actual: false,
    privateMediaReadReceiptDigest: sha256CanonicalJson({
      domain: 'motion_studio_authenticated_review_contract_playback_read_v1',
      candidateSha256: source.objectiveQa.candidate.sha256,
      playbackSessionId: source.humanPlayback.playbackSessionId,
    }),
    playbackCoverageDigest: sha256CanonicalJson({
      startMilliseconds: 0,
      endMilliseconds: source.objectiveQa.candidate.durationMilliseconds,
      unverifiedGapMilliseconds: 0,
    }),
  })
  return compileAndPersistVerifier({
    ...input,
    ...source,
    evidenceClass: 'contract_verifier_path_proof_only',
    actorUserId: source.reviewerActorId,
    authenticationClass: 'local_contract_fixture_only',
    workspaceRole: 'fixture_owner',
    requestIdHash: sha256CanonicalJson({
      domain: 'motion_studio_authenticated_review_contract_request_v1',
      submissionDigest: source.submissionDigest,
    }),
    sourceEvidenceReceipts,
    playbackReceipt,
  })
}

export async function verifyMotionStudioProviderCandidateAuthenticatedReviewEvidence(
  input: SharedVerifierInput & {
    context: ServiceContext
    adapters: MotionStudioProviderCandidateAuthenticatedReviewVerifierAdapters
  },
): Promise<MotionStudioProviderCandidateAuthenticatedReviewVerifierV1> {
  const source = validateSourcesAndSubmission(input)
  if (
    source.objectiveQa.evidenceClass !== 'canonical_backend_verified_runtime' ||
    source.reviewHandoff.evidenceClass !== 'canonical_backend_verified_runtime' ||
    source.reviewContext.evidenceClass !== 'canonical_backend_verified_runtime' ||
    source.freshness.state !== 'current_actual_candidate_runtime_reverification_required'
  ) blocked('Canonical authenticated review requires exact actual-candidate runtime lineage.')
  if (input.context.auth?.isMockUser || !input.context.auth?.accessToken) {
    blocked('Canonical authenticated review requires a verified bearer-authenticated user.')
  }
  const access = await authorizeWorkspaceAccess(
    input.context,
    source.objectiveQa.workspaceId,
    'write',
  )
  if (access.userId !== source.reviewerActorId) {
    blocked('Authenticated workspace actor does not match every review submission actor.')
  }
  if (!['owner', 'admin', 'editor'].includes(access.role)) {
    blocked('Authenticated review requires workspace editor authority.')
  }
  const sourceEvidenceReceipts = await Promise.all(source.evidenceItems.map(async (item) => {
    const verified = await input.adapters.verifySourceEvidence({
      workspaceId: source.objectiveQa.workspaceId,
      projectId: source.objectiveQa.projectId,
      editSessionId: source.objectiveQa.editSessionId,
      productionId: source.objectiveQa.productionId,
      approvedSnapshotId: source.objectiveQa.approvedSnapshotId,
      actorUserId: access.userId,
      ...item,
    })
    if (
      verified.evidenceId !== item.evidenceId ||
      verified.sourceClass !== item.sourceClass ||
      verified.sourceRecordDigest !== item.sourceRecordDigest ||
      verified.actualAuthorityReadbackVerified !== true
    ) blocked('Authenticated review source evidence failed exact authority readback.')
    return projectSourceReceipt(item, true, digestSchema.parse(
      verified.authorityReceiptDigest,
    ))
  }))
  const verifiedPlayback = await input.adapters.verifyCompletePrivatePlayback({
    workspaceId: source.objectiveQa.workspaceId,
    projectId: source.objectiveQa.projectId,
    editSessionId: source.objectiveQa.editSessionId,
    productionId: source.objectiveQa.productionId,
    actorUserId: access.userId,
    playbackSessionId: source.humanPlayback.playbackSessionId,
    candidatePrivateObjectIdentityHash:
      source.objectiveQa.candidate.privateObjectIdentityHash,
    candidateSha256: source.objectiveQa.candidate.sha256,
    candidateByteLength: source.objectiveQa.candidate.byteLength,
    candidateDurationMilliseconds: source.objectiveQa.candidate.durationMilliseconds,
    reviewContextDigest: source.reviewContext.reviewContextDigest,
  })
  if (
    verifiedPlayback.playbackSessionId !== source.humanPlayback.playbackSessionId ||
    verifiedPlayback.authenticatedReviewerActorId !== access.userId ||
    verifiedPlayback.candidateSha256 !== source.objectiveQa.candidate.sha256 ||
    verifiedPlayback.reviewContextDigest !== source.reviewContext.reviewContextDigest ||
    verifiedPlayback.candidateDurationMilliseconds !==
      source.objectiveQa.candidate.durationMilliseconds ||
    verifiedPlayback.coverageStartMilliseconds !== 0 ||
    verifiedPlayback.coverageEndMilliseconds !==
      source.objectiveQa.candidate.durationMilliseconds ||
    verifiedPlayback.unverifiedGapMilliseconds !== 0 ||
    !verifiedPlayback.privateMediaChecksumVerified ||
    !verifiedPlayback.completePlaybackAttested ||
    !verifiedPlayback.actualAuthenticatedPrivatePlaybackVerified
  ) blocked('Authenticated review private playback did not prove exact complete coverage.')
  const playbackReceipt = projectPlaybackReceipt({
    input: source.humanPlayback,
    source,
    actual: true,
    privateMediaReadReceiptDigest: digestSchema.parse(
      verifiedPlayback.privateMediaReadReceiptDigest,
    ),
    playbackCoverageDigest: digestSchema.parse(verifiedPlayback.playbackCoverageDigest),
  })
  return compileAndPersistVerifier({
    ...input,
    ...source,
    evidenceClass: 'canonical_authenticated_runtime',
    actorUserId: access.userId,
    authenticationClass: 'verified_bearer_workspace_member',
    workspaceRole: access.role as 'owner' | 'admin' | 'editor',
    requestIdHash: sha256CanonicalJson({
      requestId: stableIdSchema.parse(input.context.requestId),
      submissionDigest: source.submissionDigest,
    }),
    sourceEvidenceReceipts,
    playbackReceipt,
  })
}

export function assertMotionStudioProviderCandidateAuthenticatedReviewVerifier(
  input: MotionStudioProviderCandidateAuthenticatedReviewVerifierV1,
): void {
  const parsed = motionStudioProviderCandidateAuthenticatedReviewVerifierV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.verificationDigest
  if (
    sha256CanonicalJson(base) !== parsed.verificationDigest ||
    parsed.readiness.reviewDecisionAccepted ||
    parsed.readiness.selectionDecisionCreated || parsed.readiness.ms012dAccepted ||
    parsed.readiness.eligibleForMs012e || parsed.readiness.productReady ||
    parsed.sideEffects.providerSubmissionCount !== 0 ||
    parsed.sideEffects.secretPayloadReadCount !== 0 ||
    parsed.sideEffects.selectionCount !== 0 || parsed.sideEffects.finalMixMutationCount !== 0 ||
    parsed.sideEffects.timelineMutationCount !== 0 || parsed.sideEffects.renderCount !== 0 ||
    parsed.sideEffects.exportCount !== 0 || parsed.sideEffects.remoteMutationCount !== 0
  ) blocked('Authenticated review verifier crossed its verification-only boundary.')
}

export async function readMotionStudioProviderCandidateAuthenticatedReviewVerifier(input: {
  localStorageRoot: string
  evidenceObjectIdentityHash: string
}): Promise<MotionStudioProviderCandidateAuthenticatedReviewVerifierV1 | null> {
  assertRoot(input.localStorageRoot)
  if (!/^[a-f0-9]{64}$/u.test(input.evidenceObjectIdentityHash)) {
    invalid('Authenticated review verifier identity is invalid.')
  }
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: verifierRelativePath(input.evidenceObjectIdentityHash),
  })
  if (!bytes) return null
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked('Persisted authenticated review verification is not canonical JSON.')
  }
  const record = deepFreeze(
    motionStudioProviderCandidateAuthenticatedReviewVerifierV1Schema.parse(decoded),
  )
  assertMotionStudioProviderCandidateAuthenticatedReviewVerifier(record)
  const canonicalBytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  if (!bytes.equals(canonicalBytes)) {
    blocked('Persisted authenticated review verification is not canonical serialization.')
  }
  return record
}

function validateSourcesAndSubmission(input: SharedVerifierInput) {
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
    objectiveQa.workspaceId !== reviewContext.workspaceId ||
    objectiveQa.projectId !== reviewContext.projectId ||
    objectiveQa.editSessionId !== reviewContext.editSessionId ||
    objectiveQa.productionId !== reviewContext.productionId ||
    objectiveQa.approvedSnapshotId !== reviewContext.approvedSnapshotId ||
    objectiveQa.approvedSnapshotDigest !== reviewContext.approvedSnapshotDigest ||
    objectiveQa.evidenceDigest !== reviewHandoff.sourceObjectiveQa.evidenceDigest ||
    objectiveQa.evidenceDigest !== reviewContext.sourceObjectiveQa.evidenceDigest ||
    reviewHandoff.handoffDigest !== reviewContext.sourceReviewHandoff.handoffDigest ||
    reviewContext.reviewContextId !== freshness.reviewContextId ||
    reviewContext.reviewContextDigest !== freshness.reviewContextDigest ||
    freshness.invalidationReasons.length !== 0 || !freshness.readiness.exactReviewContextCurrent
  ) blocked('Authenticated review verifier requires exact current candidate review lineage.')
  if (input.gateReviews.length !== reviewHandoff.reviewRequirements.length) {
    invalid('Authenticated review verifier requires every exact review gate once.')
  }
  const evidenceItems: Array<{
    gate: string
    kind: MotionStudioProviderCandidateReviewEvidenceKind
    evidenceId: string
    sourceClass: MotionStudioProviderCandidateReviewEvidenceItemInput['sourceClass']
    sourceRecordDigest: string
  }> = []
  let reviewerActorId: string | null = null
  for (const [index, requirement] of reviewHandoff.reviewRequirements.entries()) {
    const review = input.gateReviews[index]
    if (
      !review || review.gate !== requirement.gate ||
      review.requirementDigest !== requirement.requirementDigest ||
      review.evidenceItems.length !== requirement.requiredEvidenceKinds.length
    ) invalid('Authenticated review gate order or requirement authority changed.')
    const actorId = stableIdSchema.parse(review.reviewerActorId)
    reviewerActorId ??= actorId
    if (reviewerActorId !== actorId) {
      blocked('Authenticated review requires one exact human actor for every gate.')
    }
    for (const [itemIndex, kind] of requirement.requiredEvidenceKinds.entries()) {
      const item = review.evidenceItems[itemIndex]
      if (!item || item.kind !== kind || item.sourceClass !== sourceClassFor(kind)) {
        invalid('Authenticated review evidence kind or source class changed.')
      }
      evidenceItems.push({
        gate: requirement.gate,
        kind,
        evidenceId: stableIdSchema.parse(item.evidenceId),
        sourceClass: item.sourceClass,
        sourceRecordDigest: digestSchema.parse(item.sourceRecordDigest),
      })
    }
  }
  if (!reviewerActorId || input.humanPlayback.reviewerActorId !== reviewerActorId) {
    blocked('Authenticated review playback actor must match every gate reviewer.')
  }
  if (
    input.humanPlayback.candidateSha256 !== objectiveQa.candidate.sha256 ||
    input.humanPlayback.reviewContextDigest !== reviewContext.reviewContextDigest ||
    input.humanPlayback.playbackContext !== reviewContext.humanReviewPolicy.playbackContext ||
    input.humanPlayback.explicitAttestationText !==
      reviewContext.humanReviewPolicy.explicitAttestationText ||
    !input.humanPlayback.completeCandidatePlaybackAttested ||
    !input.humanPlayback.privateMediaChecksumVerifiedBeforePlayback
  ) blocked('Authenticated review playback submission changed exact candidate authority.')
  if (new Set(evidenceItems.map((item) => item.evidenceId)).size !== evidenceItems.length) {
    invalid('Authenticated review evidence IDs must be unique within the submission.')
  }
  const humanPlayback = input.humanPlayback
  const submissionDigest = sha256CanonicalJson({
    objectiveQaEvidenceDigest: objectiveQa.evidenceDigest,
    reviewHandoffDigest: reviewHandoff.handoffDigest,
    reviewContextDigest: reviewContext.reviewContextDigest,
    freshnessDigest: freshness.freshnessDigest,
    gateReviews: input.gateReviews,
    humanPlayback,
  })
  return {
    objectiveQa,
    reviewHandoff,
    reviewContext,
    freshness,
    evidenceItems,
    humanPlayback,
    reviewerActorId,
    submissionDigest,
  }
}

function projectSourceReceipt(
  item: {
    gate: string
    kind: MotionStudioProviderCandidateReviewEvidenceKind
    evidenceId: string
    sourceClass: MotionStudioProviderCandidateReviewEvidenceItemInput['sourceClass']
    sourceRecordDigest: string
  },
  actual: boolean,
  authorityReceiptDigest: string,
) {
  const base = {
    ...item,
    authorityReceiptDigest,
    actualAuthorityReadbackVerified: actual,
    privateOnly: true as const,
    rawPayloadPersisted: false as const,
    localPathProjected: false as const,
  }
  return { ...base, receiptDigest: sha256CanonicalJson(base) }
}

function projectPlaybackReceipt(input: {
  input: MotionStudioProviderCandidateHumanPlaybackInput
  source: ReturnType<typeof validateSourcesAndSubmission>
  actual: boolean
  privateMediaReadReceiptDigest: string
  playbackCoverageDigest: string
}) {
  const base = {
    playbackSessionId: input.input.playbackSessionId,
    authenticatedReviewerActorId: input.source.reviewerActorId,
    candidateSha256: input.source.objectiveQa.candidate.sha256,
    reviewContextDigest: input.source.reviewContext.reviewContextDigest,
    privateMediaReadReceiptDigest: input.privateMediaReadReceiptDigest,
    playbackCoverageDigest: input.playbackCoverageDigest,
    candidateDurationMilliseconds:
      input.source.objectiveQa.candidate.durationMilliseconds,
    coverageStartMilliseconds: 0 as const,
    coverageEndMilliseconds: input.source.objectiveQa.candidate.durationMilliseconds,
    unverifiedGapMilliseconds: 0 as const,
    privateMediaChecksumVerified: true as const,
    completePlaybackAttested: true as const,
    actualAuthenticatedPrivatePlaybackVerified: input.actual,
  }
  return { ...base, receiptDigest: sha256CanonicalJson(base) }
}

async function compileAndPersistVerifier(input: SharedVerifierInput &
  ReturnType<typeof validateSourcesAndSubmission> & {
    evidenceClass: 'contract_verifier_path_proof_only' | 'canonical_authenticated_runtime'
    actorUserId: string
    authenticationClass: 'local_contract_fixture_only' | 'verified_bearer_workspace_member'
    workspaceRole: 'fixture_owner' | 'owner' | 'admin' | 'editor'
    requestIdHash: string
    sourceEvidenceReceipts: ReturnType<typeof projectSourceReceipt>[]
    playbackReceipt: ReturnType<typeof projectPlaybackReceipt>
  }) {
  assertRoot(input.localStorageRoot)
  const createdAt = exactIso(input.createdAt)
  const actual = input.evidenceClass === 'canonical_authenticated_runtime'
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_authenticated_review_verifier_v1',
    evidenceClass: input.evidenceClass,
    submissionDigest: input.submissionDigest,
    actorUserId: input.actorUserId,
    sourceReceiptSetDigest: sha256CanonicalJson(input.sourceEvidenceReceipts),
    playbackReceiptDigest: input.playbackReceipt.receiptDigest,
  })
  const existing = await readMotionStudioProviderCandidateAuthenticatedReviewVerifier({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash,
  })
  if (existing) return existing
  const base = {
    schemaVersion:
      MOTION_STUDIO_PROVIDER_CANDIDATE_AUTHENTICATED_REVIEW_VERIFIER_SCHEMA_VERSION,
    verificationId: `ms012d-authenticated-review-${evidenceObjectIdentityHash.slice(0, 24)}`,
    evidenceClass: input.evidenceClass,
    state: actual
      ? 'canonical_authenticated_review_submission_verified_not_selected' as const
      : 'contract_verifier_path_proven_non_promotable' as const,
    createdAt,
    workspaceId: input.objectiveQa.workspaceId,
    projectId: input.objectiveQa.projectId,
    editSessionId: input.objectiveQa.editSessionId,
    productionId: input.objectiveQa.productionId,
    approvedSnapshotId: input.objectiveQa.approvedSnapshotId,
    approvedSnapshotDigest: input.objectiveQa.approvedSnapshotDigest,
    intent: input.objectiveQa.intent,
    sourceAuthority: {
      objectiveQaEvidenceDigest: input.objectiveQa.evidenceDigest,
      reviewHandoffDigest: input.reviewHandoff.handoffDigest,
      reviewContextDigest: input.reviewContext.reviewContextDigest,
      freshnessDigest: input.freshness.freshnessDigest,
      requestAuthorityDigest: sha256CanonicalJson(input.reviewContext.requestAuthority),
      candidatePrivateObjectIdentityHash:
        input.objectiveQa.candidate.privateObjectIdentityHash,
      candidateSha256: input.objectiveQa.candidate.sha256,
      candidateByteLength: input.objectiveQa.candidate.byteLength,
      candidateDurationMilliseconds: input.objectiveQa.candidate.durationMilliseconds,
    },
    authenticatedActor: {
      actorUserId: input.actorUserId,
      authenticationClass: input.authenticationClass,
      workspaceRole: input.workspaceRole,
      requestIdHash: input.requestIdHash,
      authenticatedWorkspaceAccessVerified: actual,
      accessTokenPersisted: false as const,
      rawAuthenticationPayloadPersisted: false as const,
    },
    reviewSubmission: {
      gateCount: input.gateReviews.length as 5 | 6,
      sourceEvidenceReceiptCount: input.sourceEvidenceReceipts.length,
      allReviewerActorIdsMatchAuthenticatedActor: true as const,
      submissionDigest: input.submissionDigest,
    },
    sourceEvidenceReceipts: input.sourceEvidenceReceipts,
    playbackReceipt: input.playbackReceipt,
    readiness: {
      verifierContractPathProven: true as const,
      exactReviewLineageVerified: true as const,
      sourceEvidenceAuthorityVerified: actual,
      completePrivatePlaybackVerified: actual,
      canonicalAuthenticatedReviewEvidenceVerified: actual,
      reviewDecisionAccepted: false as const,
      selectionDecisionCreated: false as const,
      ms012dAccepted: false as const,
      eligibleForMs012e: false as const,
      productReady: false as const,
    },
    persistence: {
      privateLocalOnly: true as const,
      createOnly: true as const,
      verificationPersisted: true as const,
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    sideEffects: {
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
  const record = deepFreeze(
    motionStudioProviderCandidateAuthenticatedReviewVerifierV1Schema.parse({
      ...base,
      verificationDigest: sha256CanonicalJson(base),
    }),
  )
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: verifierRelativePath(evidenceObjectIdentityHash),
    content: bytes,
  })
  const stored = await readMotionStudioProviderCandidateAuthenticatedReviewVerifier({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash,
  })
  if (!stored || stored.verificationDigest !== record.verificationDigest) {
    blocked('Authenticated review verification changed after create-only persistence.')
  }
  return record
}

function sourceClassFor(
  kind: MotionStudioProviderCandidateReviewEvidenceKind,
): MotionStudioProviderCandidateReviewEvidenceItemInput['sourceClass'] {
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

function verifierRelativePath(identity: string): string {
  return `motion-studio/provider-candidate-authenticated-review-verifier/${identity.slice(0, 2)}/${identity}.json`
}

function assertRoot(root: string): void {
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u.test(root)) {
    invalid('Authenticated review verifier requires the exact bounded private-ingest root.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Authenticated review verification time must be canonical ISO-8601.')
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
    requiredGate: 'motion_studio_provider_candidate_authenticated_review_verifier',
  })
}
