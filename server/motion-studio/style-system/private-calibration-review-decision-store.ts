import { createHash } from 'node:crypto'

import { z } from 'zod'

import { styleCalibrationCandidateEvidenceSchema } from '../../../src/lib/motion-studio/contracts'
import type {
  StyleCalibrationCandidateEvidence,
  StyleCalibrationCreativeDecision,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  createStyleCalibrationCandidateEvidence,
  verifyStyleCalibrationCandidateEvidenceDigest,
} from './calibration-evidence'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
  calibrationCandidateSourceVerificationSchema,
  type CalibrationCandidateSourceVerification,
  type CalibrationCandidateSourceVerifier,
} from './private-approved-calibration-evidence-store'
import type {
  CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'

export const MOTION_STUDIO_CALIBRATION_PRIVATE_REVIEW_VERIFICATION_VERSION =
  'motion-studio.calibration-private-review-verification.v1' as const
export const MOTION_STUDIO_PRIVATE_CALIBRATION_REVIEW_DECISION_RECORD_VERSION =
  'motion-studio.private-calibration-review-decision-record.v1' as const

const MAX_RECORD_BYTES = 1024 * 1024
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const safeTextSchema = z.string().trim().min(1).max(1_000)
  .refine((value) => Array.from(value).every((character) => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }))
const sourceEvidenceClassSchema = z.enum([
  'private_source_verifier_test_fixture',
  'canonical_backend_runtime_unreleased',
])
const reviewEvidenceClassSchema = z.enum([
  'private_authenticated_review_test_fixture',
  'canonical_authenticated_runtime_unreleased',
])

export type CalibrationPrivateReviewVerificationEvidenceClass = z.infer<
  typeof reviewEvidenceClassSchema
>

export const calibrationPrivateReviewVerificationSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CALIBRATION_PRIVATE_REVIEW_VERIFICATION_VERSION,
  ),
  evidenceClass: reviewEvidenceClassSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  candidateId: stableIdSchema,
  candidateDigest: digestSchema,
  outputContentDigest: digestSchema,
  privateObjectIdentityHash: digestSchema,
  checksumReadbackEvidenceDigest: digestSchema,
  outputTimingAuthorityDigest: digestSchema,
  candidateDurationFrames: z.number().int().positive().max(60 * 60 * 240),
  reviewSessionId: stableIdSchema,
  reviewerActorId: stableIdSchema,
  authenticationClass: z.enum([
    'local_contract_fixture_only',
    'verified_workspace_member',
  ]),
  workspaceRole: z.enum(['fixture_owner', 'owner', 'admin', 'editor']),
  reviewerAuthorizationDigest: digestSchema,
  privateMediaReadReceiptDigest: digestSchema,
  completePlaybackCoverageDigest: digestSchema,
  coverageStartFrame: z.literal(0),
  coverageEndFrame: z.number().int().positive().max(60 * 60 * 240),
  unverifiedFrameCount: z.literal(0),
  playbackStartedAt: isoDateSchema,
  playbackCompletedAt: isoDateSchema,
  workspaceReviewAuthorityReverified: z.literal(true),
  privateOutputReadbackReverified: z.literal(true),
  completePlaybackReverified: z.literal(true),
  canonicalAuthenticatedReviewEvidenceVerified: z.boolean(),
  accessTokenPersisted: z.literal(false),
  rawAuthenticationPayloadPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  promotionAuthorized: z.literal(false),
  productionReady: z.literal(false),
  verificationDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const canonical = value.evidenceClass ===
    'canonical_authenticated_runtime_unreleased'
  if (
    value.authenticationClass !== (canonical
      ? 'verified_workspace_member'
      : 'local_contract_fixture_only') ||
    (canonical
      ? value.workspaceRole === 'fixture_owner'
      : value.workspaceRole !== 'fixture_owner') ||
    value.canonicalAuthenticatedReviewEvidenceVerified !== canonical ||
    value.coverageEndFrame !== value.candidateDurationFrames ||
    Date.parse(value.playbackCompletedAt) < Date.parse(value.playbackStartedAt)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Calibration review authentication, playback, or provenance did not reconcile.',
    })
  }
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.verificationDigest
  if (sha256CanonicalJson(unsigned) !== value.verificationDigest) {
    context.addIssue({
      code: 'custom',
      path: ['verificationDigest'],
      message: 'Calibration private-review verification digest failed.',
    })
  }
})

export type CalibrationPrivateReviewVerification = z.infer<
  typeof calibrationPrivateReviewVerificationSchema
>

const reviewDecisionSchema = z.object({
  decision: z.enum(['accepted', 'rejected']),
  reviewedBy: stableIdSchema,
  reviewedAt: isoDateSchema,
  reviewSessionId: stableIdSchema,
  selectionReason: safeTextSchema,
}).strict()

const privateCalibrationReviewDecisionRecordSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_PRIVATE_CALIBRATION_REVIEW_DECISION_RECORD_VERSION,
  ),
  sourceAuthority: z.literal(
    'motion_studio_private_calibration_review_decision_store',
  ),
  sourceEvidenceClass: sourceEvidenceClassSchema,
  reviewEvidenceClass: reviewEvidenceClassSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  sourcePlanReviewInputDigest: digestSchema,
  canonicalProjectionDigest: digestSchema,
  approvedCalibrationPlanDigest: digestSchema,
  scenarioId: stableIdSchema,
  sourceCandidateId: stableIdSchema,
  sourceCandidateDigest: digestSchema,
  sourceCandidate: styleCalibrationCandidateEvidenceSchema,
  candidateSourceVerification: calibrationCandidateSourceVerificationSchema,
  privateReviewVerification: calibrationPrivateReviewVerificationSchema,
  decision: reviewDecisionSchema,
  reviewedCandidateDigest: digestSchema,
  reviewedCandidate: styleCalibrationCandidateEvidenceSchema,
  sourceRepositoryReverified: z.literal(true),
  candidateSourceReverified: z.literal(true),
  authenticatedCompletePlaybackReverified: z.literal(true),
  privateLocalOnly: z.literal(true),
  createOnly: z.literal(true),
  canonicalCompilationAllowed: z.boolean(),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  renderOrExportPerformed: z.literal(false),
  promotionAuthorized: z.literal(false),
  productionReady: z.literal(false),
  recordDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const canonical =
    value.sourceEvidenceClass === 'canonical_backend_runtime_unreleased' &&
    value.reviewEvidenceClass === 'canonical_authenticated_runtime_unreleased'
  if (
    value.canonicalCompilationAllowed !== canonical ||
    value.sourceCandidate.id !== value.sourceCandidateId ||
    value.sourceCandidate.candidateDigest !== value.sourceCandidateDigest ||
    value.sourceCandidate.creativeReview.decision !== 'pending' ||
    value.reviewedCandidate.id !== value.sourceCandidateId ||
    value.reviewedCandidate.candidateDigest !== value.reviewedCandidateDigest ||
    value.reviewedCandidate.creativeReview.decision !== value.decision.decision ||
    value.reviewedCandidate.creativeReview.reviewedBy !== value.decision.reviewedBy ||
    value.reviewedCandidate.creativeReview.reviewedAt !== value.decision.reviewedAt ||
    value.reviewedCandidate.creativeReview.selectionReason !==
      value.decision.selectionReason ||
    value.candidateSourceVerification.evidenceClass !== value.sourceEvidenceClass ||
    value.candidateSourceVerification.candidateId !== value.sourceCandidateId ||
    value.candidateSourceVerification.candidateDigest !== value.sourceCandidateDigest ||
    value.privateReviewVerification.evidenceClass !== value.reviewEvidenceClass ||
    value.privateReviewVerification.candidateId !== value.sourceCandidateId ||
    value.privateReviewVerification.candidateDigest !== value.sourceCandidateDigest ||
    value.privateReviewVerification.reviewerActorId !== value.decision.reviewedBy ||
    value.privateReviewVerification.playbackCompletedAt !== value.decision.reviewedAt ||
    value.privateReviewVerification.reviewSessionId !== value.decision.reviewSessionId
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Calibration review decision failed source, reviewer, or candidate reconciliation.',
    })
  }
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.recordDigest
  if (sha256CanonicalJson(unsigned) !== value.recordDigest) {
    context.addIssue({
      code: 'custom',
      path: ['recordDigest'],
      message: 'Calibration review decision record digest failed.',
    })
  }
})

export type PrivateCalibrationReviewDecisionRecord = z.infer<
  typeof privateCalibrationReviewDecisionRecordSchema
>

export interface CalibrationCandidateAuthenticatedReviewVerifier {
  readonly evidenceClass: CalibrationPrivateReviewVerificationEvidenceClass
  verify(input: {
    candidate: StyleCalibrationCandidateEvidence
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    reviewSessionId: string
  }): Promise<CalibrationPrivateReviewVerification>
}

export interface PrivateCalibrationReviewDecisionStore {
  persist(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    candidate: StyleCalibrationCandidateEvidence
    reviewSessionId: string
    decision: Exclude<StyleCalibrationCreativeDecision, 'pending'>
    selectionReason: string
  }): Promise<{ record: PrivateCalibrationReviewDecisionRecord; created: boolean }>
  read(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    candidate: StyleCalibrationCandidateEvidence
  }): Promise<PrivateCalibrationReviewDecisionRecord>
  readForCanonicalCompilation(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    candidate: StyleCalibrationCandidateEvidence
  }): Promise<PrivateCalibrationReviewDecisionRecord>
}

/**
 * Persists one immutable human decision for an exact, pending calibration
 * candidate. Both verifier ports are server-only and must reopen their own
 * authority on create and restart readback. This store never executes media,
 * approves a plan, mutates credits, or treats fixture evidence as canonical.
 */
export function createPrivateCalibrationReviewDecisionStore(input: {
  localStorageRoot: string
  candidateSourceVerifier: CalibrationCandidateSourceVerifier
  authenticatedReviewVerifier: CalibrationCandidateAuthenticatedReviewVerifier
}): PrivateCalibrationReviewDecisionStore {
  const store: PrivateCalibrationReviewDecisionStore = {
    async persist(value: {
      approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
      candidate: StyleCalibrationCandidateEvidence
      reviewSessionId: string
      decision: 'accepted' | 'rejected'
      selectionReason: string
    }) {
      const candidate = validatePendingCandidate({
        approvedPlanSource: value.approvedPlanSource,
        candidate: value.candidate,
        decision: value.decision,
      })
      const reviewSessionId = stableIdSchema.parse(value.reviewSessionId)
      const selectionReason = safeTextSchema.parse(value.selectionReason)
      const candidateSourceVerification = await verifyCandidateSource({
        verifier: input.candidateSourceVerifier,
        approvedPlanSource: value.approvedPlanSource,
        candidate,
      })
      const privateReviewVerification = await verifyPrivateReview({
        verifier: input.authenticatedReviewVerifier,
        approvedPlanSource: value.approvedPlanSource,
        candidate,
        reviewSessionId,
      })
      const reviewedCandidate = buildReviewedCandidate({
        approvedPlanSource: value.approvedPlanSource,
        candidate,
        privateReviewVerification,
        decision: value.decision,
        selectionReason,
      })
      const base = recordBase({
        approvedPlanSource: value.approvedPlanSource,
        candidate,
        candidateSourceVerification,
        privateReviewVerification,
        reviewedCandidate,
        selectionReason,
      })
      const record = parseRecord({
        ...base,
        recordDigest: sha256CanonicalJson(base),
      })
      const bytes = Buffer.from(`${JSON.stringify(record)}\n`, 'utf8')
      if (bytes.byteLength > MAX_RECORD_BYTES) {
        throw invalid('Calibration review decision exceeds its private byte ceiling.')
      }
      const relativePath = recordRelativePath(value.approvedPlanSource, candidate)
      const written = await withPrivateCooperativeFileLockWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: `${relativePath}.cooperative.lock`,
        operation: () => writePrivateFileCreateOnlyWithinRoot({
          rootPath: input.localStorageRoot,
          relativePath,
          content: bytes,
        }),
      })
      const readback = await readAndVerifyRecord({
        localStorageRoot: input.localStorageRoot,
        relativePath,
        approvedPlanSource: value.approvedPlanSource,
        candidate,
        candidateSourceVerifier: input.candidateSourceVerifier,
        authenticatedReviewVerifier: input.authenticatedReviewVerifier,
      })
      if (sha256CanonicalJson(readback) !== sha256CanonicalJson(record)) {
        throw conflict('Calibration review decision changed during create-only persistence.')
      }
      return { record, created: written.created }
    },

    async read(value: {
      approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
      candidate: StyleCalibrationCandidateEvidence
    }) {
      const candidate = validatePendingCandidate({
        approvedPlanSource: value.approvedPlanSource,
        candidate: value.candidate,
      })
      return readAndVerifyRecord({
        localStorageRoot: input.localStorageRoot,
        relativePath: recordRelativePath(value.approvedPlanSource, candidate),
        approvedPlanSource: value.approvedPlanSource,
        candidate,
        candidateSourceVerifier: input.candidateSourceVerifier,
        authenticatedReviewVerifier: input.authenticatedReviewVerifier,
      })
    },

    async readForCanonicalCompilation(value: {
      approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
      candidate: StyleCalibrationCandidateEvidence
    }) {
      const record: PrivateCalibrationReviewDecisionRecord = await store.read(value)
      if (!record.canonicalCompilationAllowed) {
        throw notReady(
          'Calibration review evidence is test-only and cannot enter canonical Storytelling compilation.',
        )
      }
      return record
    },
  }
  return store
}

export function createCalibrationPrivateReviewVerification(input: {
  evidenceClass: CalibrationPrivateReviewVerificationEvidenceClass
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  candidate: StyleCalibrationCandidateEvidence
  reviewSessionId: string
  reviewerActorId: string
  workspaceRole: 'fixture_owner' | 'owner' | 'admin' | 'editor'
  reviewerAuthorizationDigest: string
  privateMediaReadReceiptDigest: string
  completePlaybackCoverageDigest: string
  playbackStartedAt: string
  playbackCompletedAt: string
}): CalibrationPrivateReviewVerification {
  assertCanonicalApprovedStorytellingStylePlanSource(input.approvedPlanSource)
  const candidate = styleCalibrationCandidateEvidenceSchema.parse(input.candidate)
  if (!candidate.output) {
    throw invalid('Calibration private review requires one exact private output.')
  }
  const canonical = input.evidenceClass ===
    'canonical_authenticated_runtime_unreleased'
  const base = {
    schemaVersion: MOTION_STUDIO_CALIBRATION_PRIVATE_REVIEW_VERIFICATION_VERSION,
    evidenceClass: input.evidenceClass,
    workspaceId: candidate.workspaceId,
    projectId: candidate.projectId,
    editSessionId: candidate.editSessionId,
    productionId: candidate.productionId,
    approvedSnapshotId: input.approvedPlanSource.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedPlanSource.approvedSnapshotDigest,
    candidateId: candidate.id,
    candidateDigest: candidate.candidateDigest,
    outputContentDigest: candidate.output.contentDigest,
    privateObjectIdentityHash: candidate.output.privateObjectIdentityHash,
    checksumReadbackEvidenceDigest:
      candidate.output.checksumReadbackEvidenceDigest,
    outputTimingAuthorityDigest: candidate.output.timingAuthority.timingAuthorityDigest,
    candidateDurationFrames: candidate.output.timingAuthority.durationFrames,
    reviewSessionId: stableIdSchema.parse(input.reviewSessionId),
    reviewerActorId: stableIdSchema.parse(input.reviewerActorId),
    authenticationClass: canonical
      ? 'verified_workspace_member' as const
      : 'local_contract_fixture_only' as const,
    workspaceRole: input.workspaceRole,
    reviewerAuthorizationDigest: digestSchema.parse(
      input.reviewerAuthorizationDigest,
    ),
    privateMediaReadReceiptDigest: digestSchema.parse(
      input.privateMediaReadReceiptDigest,
    ),
    completePlaybackCoverageDigest: digestSchema.parse(
      input.completePlaybackCoverageDigest,
    ),
    coverageStartFrame: 0 as const,
    coverageEndFrame: candidate.output.timingAuthority.durationFrames,
    unverifiedFrameCount: 0 as const,
    playbackStartedAt: isoDateSchema.parse(input.playbackStartedAt),
    playbackCompletedAt: isoDateSchema.parse(input.playbackCompletedAt),
    workspaceReviewAuthorityReverified: true as const,
    privateOutputReadbackReverified: true as const,
    completePlaybackReverified: true as const,
    canonicalAuthenticatedReviewEvidenceVerified: canonical,
    accessTokenPersisted: false as const,
    rawAuthenticationPayloadPersisted: false as const,
    localPathProjected: false as const,
    promotionAuthorized: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  return deepFreeze(calibrationPrivateReviewVerificationSchema.parse({
    ...base,
    verificationDigest: sha256CanonicalJson(base),
  }))
}

function validatePendingCandidate(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  candidate: StyleCalibrationCandidateEvidence
  decision?: 'accepted' | 'rejected'
}): StyleCalibrationCandidateEvidence {
  assertCanonicalApprovedStorytellingStylePlanSource(input.approvedPlanSource)
  const candidate = styleCalibrationCandidateEvidenceSchema.parse(input.candidate)
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const scenario = plan.scenarios.find((entry) => entry.id === candidate.scenarioId)
  if (
    !verifyStyleCalibrationCandidateEvidenceDigest(candidate) ||
    !scenario ||
    scenario.kind !== candidate.scenarioKind ||
    scenario.productionMode !== candidate.productionMode ||
    candidate.workspaceId !== plan.workspaceId ||
    candidate.projectId !== plan.projectId ||
    candidate.editSessionId !== plan.editSessionId ||
    candidate.productionId !== plan.productionId ||
    candidate.calibrationPlanDigest !== plan.planDigest ||
    candidate.creativeReview.decision !== 'pending' ||
    candidate.attemptOutcome !== 'succeeded' ||
    !candidate.output ||
    candidate.technicalQa.status === 'not_run' ||
    !candidate.technicalQa.evidenceDigest ||
    !['canonical_tool_attempt', 'canonical_provider_attempt'].includes(
      candidate.sourceEvidence.kind,
    ) ||
    candidate.sourceEvidence.readiness !== 'canonical_private_routing_eligible' ||
    !candidate.sourceEvidence.sourceVerified ||
    !candidate.cost.reconciled
  ) {
    throw conflict(
      'Calibration review requires one exact pending, source-verified, cost-reconciled private candidate.',
    )
  }
  if (input.decision === 'accepted' && candidate.technicalQa.status !== 'passed') {
    throw conflict('A calibration candidate with failed technical QA cannot be accepted.')
  }
  return deepFreeze(candidate)
}

async function verifyCandidateSource(input: {
  verifier: CalibrationCandidateSourceVerifier
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  candidate: StyleCalibrationCandidateEvidence
}): Promise<CalibrationCandidateSourceVerification> {
  const verification = calibrationCandidateSourceVerificationSchema.parse(
    await input.verifier.verify({
      candidate: input.candidate,
      approvedPlanSource: input.approvedPlanSource,
    }),
  )
  const candidate = input.candidate
  if (
    verification.evidenceClass !== input.verifier.evidenceClass ||
    verification.candidateId !== candidate.id ||
    verification.candidateDigest !== candidate.candidateDigest ||
    verification.sourceAttemptId !== candidate.sourceEvidence.sourceAttemptId ||
    verification.sourceEvidenceDigest !== candidate.sourceEvidence.sourceEvidenceDigest ||
    verification.sourceVerifierId !== candidate.sourceEvidence.sourceVerifierId ||
    verification.outputContentDigest !== candidate.output?.contentDigest ||
    verification.storageEvidenceDigest !== candidate.output?.storageEvidenceDigest ||
    verification.checksumReadbackEvidenceDigest !==
      candidate.output?.checksumReadbackEvidenceDigest ||
    verification.technicalQaEvidenceDigest !== candidate.technicalQa.evidenceDigest ||
    verification.costEvidenceDigest !== candidate.cost.costEvidenceDigest ||
    !verification.privateOutputReadbackVerified ||
    !verification.technicalQaEvidenceReverified
  ) {
    throw conflict(
      'Calibration review source verification changed attempt, output, QA, or cost authority.',
    )
  }
  return deepFreeze(verification)
}

async function verifyPrivateReview(input: {
  verifier: CalibrationCandidateAuthenticatedReviewVerifier
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  candidate: StyleCalibrationCandidateEvidence
  reviewSessionId: string
}): Promise<CalibrationPrivateReviewVerification> {
  const verification = calibrationPrivateReviewVerificationSchema.parse(
    await input.verifier.verify({
      candidate: input.candidate,
      approvedPlanSource: input.approvedPlanSource,
      reviewSessionId: input.reviewSessionId,
    }),
  )
  const candidate = input.candidate
  const output = candidate.output
  if (
    !output ||
    verification.evidenceClass !== input.verifier.evidenceClass ||
    verification.workspaceId !== candidate.workspaceId ||
    verification.projectId !== candidate.projectId ||
    verification.editSessionId !== candidate.editSessionId ||
    verification.productionId !== candidate.productionId ||
    verification.approvedSnapshotId !== input.approvedPlanSource.approvedSnapshotId ||
    verification.approvedSnapshotDigest !== input.approvedPlanSource.approvedSnapshotDigest ||
    verification.candidateId !== candidate.id ||
    verification.candidateDigest !== candidate.candidateDigest ||
    verification.outputContentDigest !== output.contentDigest ||
    verification.privateObjectIdentityHash !== output.privateObjectIdentityHash ||
    verification.checksumReadbackEvidenceDigest !==
      output.checksumReadbackEvidenceDigest ||
    verification.outputTimingAuthorityDigest !==
      output.timingAuthority.timingAuthorityDigest ||
    verification.candidateDurationFrames !== output.timingAuthority.durationFrames ||
    verification.reviewSessionId !== input.reviewSessionId ||
    verification.coverageEndFrame !== output.timingAuthority.durationFrames
  ) {
    throw conflict(
      'Authenticated calibration review changed project, snapshot, candidate, or complete-playback authority.',
    )
  }
  return deepFreeze(verification)
}

function buildReviewedCandidate(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  candidate: StyleCalibrationCandidateEvidence
  privateReviewVerification: CalibrationPrivateReviewVerification
  decision: 'accepted' | 'rejected'
  selectionReason: string
}): StyleCalibrationCandidateEvidence {
  const scenario = input.approvedPlanSource.approvedCalibrationPlan.scenarios
    .find((entry) => entry.id === input.candidate.scenarioId)
  if (!scenario || !input.candidate.output) {
    throw conflict('Calibration review candidate lost its approved scenario or private output.')
  }
  return createStyleCalibrationCandidateEvidence({
    plan: input.approvedPlanSource.approvedCalibrationPlan,
    scenario,
    candidate: {
      workspaceId: input.candidate.workspaceId,
      projectId: input.candidate.projectId,
      editSessionId: input.candidate.editSessionId,
      id: input.candidate.id,
      productionId: input.candidate.productionId,
      routeCandidateId: input.candidate.routeCandidateId,
      sourceEvidence: input.candidate.sourceEvidence,
      attemptOutcome: input.candidate.attemptOutcome,
      output: input.candidate.output,
      technicalQa: input.candidate.technicalQa,
      creativeReview: {
        decision: input.decision,
        reviewedBy: input.privateReviewVerification.reviewerActorId,
        reviewedAt: input.privateReviewVerification.playbackCompletedAt,
        selectionReason: input.selectionReason,
      },
      knownFailureModes: input.candidate.knownFailureModes,
      measuredLatencyMilliseconds: input.candidate.measuredLatencyMilliseconds,
      cost: {
        providerCostMicros: input.candidate.cost.providerCostMicros,
        infrastructureCostMicros: input.candidate.cost.infrastructureCostMicros,
        costEvidenceDigest: input.candidate.cost.costEvidenceDigest,
      },
    },
  })
}

function recordBase(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  candidate: StyleCalibrationCandidateEvidence
  candidateSourceVerification: CalibrationCandidateSourceVerification
  privateReviewVerification: CalibrationPrivateReviewVerification
  reviewedCandidate: StyleCalibrationCandidateEvidence
  selectionReason: string
}) {
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const canonicalCompilationAllowed =
    input.candidateSourceVerification.evidenceClass ===
      'canonical_backend_runtime_unreleased' &&
    input.privateReviewVerification.evidenceClass ===
      'canonical_authenticated_runtime_unreleased'
  return {
    schemaVersion:
      MOTION_STUDIO_PRIVATE_CALIBRATION_REVIEW_DECISION_RECORD_VERSION,
    sourceAuthority:
      'motion_studio_private_calibration_review_decision_store' as const,
    sourceEvidenceClass: input.candidateSourceVerification.evidenceClass,
    reviewEvidenceClass: input.privateReviewVerification.evidenceClass,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    productionId: plan.productionId,
    approvedSnapshotId: input.approvedPlanSource.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedPlanSource.approvedSnapshotDigest,
    sourcePlanReviewInputDigest:
      input.approvedPlanSource.sourcePlanReviewInputDigest,
    canonicalProjectionDigest: input.approvedPlanSource.canonicalProjectionDigest,
    approvedCalibrationPlanDigest: plan.planDigest,
    scenarioId: input.candidate.scenarioId,
    sourceCandidateId: input.candidate.id,
    sourceCandidateDigest: input.candidate.candidateDigest,
    sourceCandidate: input.candidate,
    candidateSourceVerification: input.candidateSourceVerification,
    privateReviewVerification: input.privateReviewVerification,
    decision: {
      decision: input.reviewedCandidate.creativeReview.decision as
        'accepted' | 'rejected',
      reviewedBy: input.privateReviewVerification.reviewerActorId,
      reviewedAt: input.privateReviewVerification.playbackCompletedAt,
      reviewSessionId: input.privateReviewVerification.reviewSessionId,
      selectionReason: input.selectionReason,
    },
    reviewedCandidateDigest: input.reviewedCandidate.candidateDigest,
    reviewedCandidate: input.reviewedCandidate,
    sourceRepositoryReverified: true as const,
    candidateSourceReverified: true as const,
    authenticatedCompletePlaybackReverified: true as const,
    privateLocalOnly: true as const,
    createOnly: true as const,
    canonicalCompilationAllowed,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    timelineMutationPerformed: false as const,
    renderOrExportPerformed: false as const,
    promotionAuthorized: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
}

async function readAndVerifyRecord(input: {
  localStorageRoot: string
  relativePath: string
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  candidate: StyleCalibrationCandidateEvidence
  candidateSourceVerifier: CalibrationCandidateSourceVerifier
  authenticatedReviewVerifier: CalibrationCandidateAuthenticatedReviewVerifier
}): Promise<PrivateCalibrationReviewDecisionRecord> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: input.relativePath,
  })
  if (!bytes) {
    throw notReady('Calibration review decision is not available for this exact candidate.')
  }
  if (bytes.byteLength < 512 || bytes.byteLength > MAX_RECORD_BYTES) {
    throw invalid('Calibration review decision has an invalid private byte length.')
  }
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Calibration review decision is not valid JSON.')
  }
  const record = parseRecord(value)
  const candidate = validatePendingCandidate({
    approvedPlanSource: input.approvedPlanSource,
    candidate: input.candidate,
    decision: record.decision.decision,
  })
  if (
    record.workspaceId !== candidate.workspaceId ||
    record.projectId !== candidate.projectId ||
    record.editSessionId !== candidate.editSessionId ||
    record.productionId !== candidate.productionId ||
    record.approvedSnapshotId !== input.approvedPlanSource.approvedSnapshotId ||
    record.approvedSnapshotDigest !== input.approvedPlanSource.approvedSnapshotDigest ||
    record.sourcePlanReviewInputDigest !==
      input.approvedPlanSource.sourcePlanReviewInputDigest ||
    record.canonicalProjectionDigest !==
      input.approvedPlanSource.canonicalProjectionDigest ||
    record.approvedCalibrationPlanDigest !==
      input.approvedPlanSource.approvedCalibrationPlan.planDigest ||
    record.sourceCandidateDigest !== candidate.candidateDigest ||
    sha256CanonicalJson(record.sourceCandidate) !== sha256CanonicalJson(candidate)
  ) {
    throw conflict('Calibration review decision changed its exact candidate or approved snapshot identity.')
  }
  const candidateSourceVerification = await verifyCandidateSource({
    verifier: input.candidateSourceVerifier,
    approvedPlanSource: input.approvedPlanSource,
    candidate,
  })
  const privateReviewVerification = await verifyPrivateReview({
    verifier: input.authenticatedReviewVerifier,
    approvedPlanSource: input.approvedPlanSource,
    candidate,
    reviewSessionId: record.decision.reviewSessionId,
  })
  const reviewedCandidate = buildReviewedCandidate({
    approvedPlanSource: input.approvedPlanSource,
    candidate,
    privateReviewVerification,
    decision: record.decision.decision,
    selectionReason: record.decision.selectionReason,
  })
  if (
    sha256CanonicalJson(candidateSourceVerification) !==
      sha256CanonicalJson(record.candidateSourceVerification) ||
    sha256CanonicalJson(privateReviewVerification) !==
      sha256CanonicalJson(record.privateReviewVerification) ||
    sha256CanonicalJson(reviewedCandidate) !==
      sha256CanonicalJson(record.reviewedCandidate)
  ) {
    throw conflict('Calibration review authority changed during restart readback.')
  }
  return deepFreeze(record)
}

function parseRecord(value: unknown): PrivateCalibrationReviewDecisionRecord {
  const parsed = privateCalibrationReviewDecisionRecordSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('Calibration review decision failed schema or digest verification.', {
      validation: parsed.error.flatten(),
    })
  }
  return deepFreeze(parsed.data)
}

function recordRelativePath(
  source: CanonicalApprovedStorytellingStylePlanSource,
  candidate: StyleCalibrationCandidateEvidence,
): string {
  const plan = source.approvedCalibrationPlan
  const scopeHash = createHash('sha256').update(sha256CanonicalJson({
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    productionId: plan.productionId,
    approvedSnapshotId: source.approvedSnapshotId,
    candidateId: candidate.id,
  }), 'utf8').digest('hex')
  return [
    'motion-studio',
    'calibration-review-decisions',
    'private-v1',
    scopeHash.slice(0, 2),
    scopeHash,
    `${source.approvedSnapshotDigest}-${candidate.candidateDigest}.json`,
  ].join('/')
}

function invalid(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_storytelling_calibration_authenticated_review',
    productionReady: false,
  })
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
  }
  return value
}
