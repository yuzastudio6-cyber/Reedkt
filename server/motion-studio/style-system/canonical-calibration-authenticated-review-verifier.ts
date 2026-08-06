import { z } from 'zod'

import { styleCalibrationCandidateEvidenceSchema } from '../../../src/lib/motion-studio/contracts'
import type { StyleCalibrationCandidateEvidence } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { authorizeWorkspaceAccess } from '../../services/workspace-access-service'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { verifyStyleCalibrationCandidateEvidenceDigest } from './calibration-evidence'
import {
  createCalibrationPrivateReviewVerification,
  type CalibrationCandidateAuthenticatedReviewVerifier,
} from './private-calibration-review-decision-store'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
} from './private-approved-calibration-evidence-store'
import {
  type CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'

export const MOTION_STUDIO_CANONICAL_CALIBRATION_AUTHENTICATED_REVIEW_RECEIPT_VERSION =
  'motion-studio.canonical-calibration-authenticated-review-source-receipt.v1' as const
export const MOTION_STUDIO_CANONICAL_CALIBRATION_AUTHENTICATED_REVIEW_READER_PORT_VERSION =
  'motion-studio.canonical-calibration-authenticated-review-reader-port.v1' as const

export const MOTION_STUDIO_CANONICAL_CALIBRATION_AUTHENTICATED_REVIEW_RUNTIME =
  Object.freeze({
    controlledAdapterVerified: true,
    canonicalReviewStoreAdapterIntegrated: false,
    canonicalSourceReceiptReaderIntegrated: false,
    actualAuthenticatedReviewEvidencePresent: false,
    finalizationAuthorized: false,
    productionReady: false,
  })

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })

export const canonicalCalibrationAuthenticatedReviewSourceReceiptSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_CALIBRATION_AUTHENTICATED_REVIEW_RECEIPT_VERSION,
  ),
  sourceAuthority: z.enum([
    'controlled_test_authenticated_calibration_review_reader',
    'canonical_backend_authenticated_calibration_review_source_reader',
  ]),
  evidenceClass: z.enum([
    'controlled_test_non_promotable',
    'canonical_authenticated_runtime_unreleased',
  ]),
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
  workspaceRole: z.enum(['owner', 'admin', 'editor']),
  authenticatedRequestDigest: digestSchema,
  reviewerAuthorizationDigest: digestSchema,
  privateMediaReadReceiptDigest: digestSchema,
  completePlaybackCoverageDigest: digestSchema,
  sourceAuthorityReadbackDigest: digestSchema,
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
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  renderOrExportPerformed: z.literal(false),
  promotionAuthorized: z.literal(false),
  productionReady: z.literal(false),
  receiptDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const canonical = value.evidenceClass ===
    'canonical_authenticated_runtime_unreleased'
  if (
    value.sourceAuthority !== (canonical
      ? 'canonical_backend_authenticated_calibration_review_source_reader'
      : 'controlled_test_authenticated_calibration_review_reader') ||
    value.canonicalAuthenticatedReviewEvidenceVerified !== canonical ||
    value.coverageEndFrame !== value.candidateDurationFrames ||
    Date.parse(value.playbackCompletedAt) < Date.parse(value.playbackStartedAt)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical calibration review receipt does not cover the exact private candidate.',
    })
  }
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.receiptDigest
  if (sha256CanonicalJson(unsigned) !== value.receiptDigest) {
    context.addIssue({
      code: 'custom',
      path: ['receiptDigest'],
      message: 'Canonical calibration review receipt digest failed.',
    })
  }
})

export type CanonicalCalibrationAuthenticatedReviewSourceReceipt = z.infer<
  typeof canonicalCalibrationAuthenticatedReviewSourceReceiptSchema
>

export interface CanonicalCalibrationAuthenticatedReviewReceiptReaderPort {
  readonly portVersion:
    typeof MOTION_STUDIO_CANONICAL_CALIBRATION_AUTHENTICATED_REVIEW_READER_PORT_VERSION
  readVerifiedReceipt(input: {
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    approvedSnapshotId: string
    approvedSnapshotDigest: string
    candidateId: string
    candidateDigest: string
    outputContentDigest: string
    privateObjectIdentityHash: string
    reviewSessionId: string
    authenticatedReviewerActorId: string
  }): Promise<CanonicalCalibrationAuthenticatedReviewSourceReceipt | null>
}

/**
 * Exercises the future server adapter contract with controlled,
 * non-promotable evidence. It is test-environment-only and deliberately emits
 * the existing fixture evidence class, so it cannot enter canonical
 * finalization. No browser assertion, credential, decision, routing, or
 * execution authority is created here.
 */
export function createControlledTestCalibrationCandidateAuthenticatedReviewVerifier(input: {
  context: ServiceContext
  receiptReader: CanonicalCalibrationAuthenticatedReviewReceiptReaderPort
}): CalibrationCandidateAuthenticatedReviewVerifier {
  if (
    input.context.env.nodeEnv !== 'test' ||
    (input.context.env.mode !== 'local' && input.context.env.mode !== 'mock')
  ) {
    throw notReady(
      'Injected calibration authenticated-review readers are limited to controlled tests.',
    )
  }
  if (
    input.receiptReader.portVersion !==
      MOTION_STUDIO_CANONICAL_CALIBRATION_AUTHENTICATED_REVIEW_READER_PORT_VERSION
  ) {
    throw notReady('Canonical calibration authenticated-review reader is not compatible.')
  }

  return {
    evidenceClass: 'private_authenticated_review_test_fixture',
    async verify(value) {
      const source = assertReviewInput(value.approvedPlanSource, value.candidate)
      if (input.context.auth?.isMockUser || !input.context.auth?.accessToken) {
        throw new ApiError(
          'AUTH_INVALID',
          'Canonical calibration review requires a verified bearer-authenticated user.',
          401,
        )
      }
      const access = await authorizeWorkspaceAccess(
        input.context,
        source.candidate.workspaceId,
        'write',
      )
      if (!['owner', 'admin', 'editor'].includes(access.role)) {
        throw new ApiError(
          'WORKSPACE_ACCESS_DENIED',
          'Canonical calibration review requires workspace editor authority.',
          403,
        )
      }
      const reviewSessionId = stableIdSchema.parse(value.reviewSessionId)
      const receiptValue = await input.receiptReader.readVerifiedReceipt({
        workspaceId: source.candidate.workspaceId,
        projectId: source.candidate.projectId,
        editSessionId: source.candidate.editSessionId,
        productionId: source.candidate.productionId,
        approvedSnapshotId: value.approvedPlanSource.approvedSnapshotId,
        approvedSnapshotDigest: value.approvedPlanSource.approvedSnapshotDigest,
        candidateId: source.candidate.id,
        candidateDigest: source.candidate.candidateDigest,
        outputContentDigest: source.output.contentDigest,
        privateObjectIdentityHash: source.output.privateObjectIdentityHash,
        reviewSessionId,
        authenticatedReviewerActorId: access.userId,
      })
      if (!receiptValue) {
        throw notReady(
          'Canonical authenticated playback evidence is not available for this exact calibration candidate.',
        )
      }
      const parsed = canonicalCalibrationAuthenticatedReviewSourceReceiptSchema
        .safeParse(receiptValue)
      if (!parsed.success) {
        throw invalid('Canonical calibration review receipt failed schema verification.', {
          validation: parsed.error.flatten(),
        })
      }
      const receipt = parsed.data
      if (
        receipt.evidenceClass !== 'controlled_test_non_promotable' ||
        receipt.sourceAuthority !==
          'controlled_test_authenticated_calibration_review_reader' ||
        receipt.workspaceId !== source.candidate.workspaceId ||
        receipt.projectId !== source.candidate.projectId ||
        receipt.editSessionId !== source.candidate.editSessionId ||
        receipt.productionId !== source.candidate.productionId ||
        receipt.approvedSnapshotId !== value.approvedPlanSource.approvedSnapshotId ||
        receipt.approvedSnapshotDigest !==
          value.approvedPlanSource.approvedSnapshotDigest ||
        receipt.candidateId !== source.candidate.id ||
        receipt.candidateDigest !== source.candidate.candidateDigest ||
        receipt.outputContentDigest !== source.output.contentDigest ||
        receipt.privateObjectIdentityHash !== source.output.privateObjectIdentityHash ||
        receipt.checksumReadbackEvidenceDigest !==
          source.output.checksumReadbackEvidenceDigest ||
        receipt.outputTimingAuthorityDigest !==
          source.output.timingAuthority.timingAuthorityDigest ||
        receipt.candidateDurationFrames !== source.output.timingAuthority.durationFrames ||
        receipt.reviewSessionId !== reviewSessionId ||
        receipt.reviewerActorId !== access.userId ||
        receipt.workspaceRole !== access.role
      ) {
        throw conflict(
          'Canonical authenticated review changed project, snapshot, candidate, actor, or playback authority.',
        )
      }
      return createCalibrationPrivateReviewVerification({
        evidenceClass: 'private_authenticated_review_test_fixture',
        approvedPlanSource: value.approvedPlanSource,
        candidate: source.candidate,
        reviewSessionId,
        reviewerActorId: receipt.reviewerActorId,
        workspaceRole: 'fixture_owner',
        reviewerAuthorizationDigest: sourceReceiptAuthorizationDigest(receipt),
        privateMediaReadReceiptDigest: receipt.privateMediaReadReceiptDigest,
        completePlaybackCoverageDigest: receipt.completePlaybackCoverageDigest,
        playbackStartedAt: receipt.playbackStartedAt,
        playbackCompletedAt: receipt.playbackCompletedAt,
      })
    },
  }
}

function assertReviewInput(
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource,
  candidateInput: StyleCalibrationCandidateEvidence,
) {
  assertCanonicalApprovedStorytellingStylePlanSource(approvedPlanSource)
  const candidate = styleCalibrationCandidateEvidenceSchema.parse(candidateInput)
  const output = candidate.output
  const plan = approvedPlanSource.approvedCalibrationPlan
  if (
    !verifyStyleCalibrationCandidateEvidenceDigest(candidate) ||
    !output ||
    candidate.creativeReview.decision !== 'pending' ||
    candidate.workspaceId !== plan.workspaceId ||
    candidate.projectId !== plan.projectId ||
    candidate.editSessionId !== plan.editSessionId ||
    candidate.productionId !== plan.productionId ||
    candidate.calibrationPlanDigest !== plan.planDigest ||
    !plan.scenarios.some((scenario) =>
      scenario.id === candidate.scenarioId &&
      scenario.kind === candidate.scenarioKind)
  ) {
    throw conflict(
      'Canonical calibration review requires one exact pending candidate from the approved snapshot.',
    )
  }
  return { candidate, output }
}

function sourceReceiptAuthorizationDigest(
  receipt: CanonicalCalibrationAuthenticatedReviewSourceReceipt,
): string {
  return sha256CanonicalJson({
    domain: 'motion_studio_canonical_calibration_review_source_authorization_v1',
    reviewerAuthorizationDigest: receipt.reviewerAuthorizationDigest,
    authenticatedRequestDigest: receipt.authenticatedRequestDigest,
    sourceAuthorityReadbackDigest: receipt.sourceAuthorityReadbackDigest,
    receiptDigest: receipt.receiptDigest,
  })
}

function invalid(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_storytelling_calibration_authenticated_review_reader',
    productionReady: false,
  })
}
