import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  projectVideoRoutingProfileSchema,
  styleCalibrationCandidateEvidenceSchema,
  styleCalibrationReelSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  ProjectVideoRoutingProfile,
  StyleCalibrationCandidateEvidence,
  StyleCalibrationReel,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  verifyStorytellingStyleAuthorityDigest,
} from './authority'
import { verifyStyleCalibrationReelDigest } from './calibration-evidence'
import type {
  CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'

export const MOTION_STUDIO_APPROVED_CALIBRATION_EVIDENCE_RECORD_VERSION =
  'motion-studio.approved-calibration-evidence-record.v1' as const
export const MOTION_STUDIO_CALIBRATION_CANDIDATE_SOURCE_VERIFICATION_VERSION =
  'motion-studio.calibration-candidate-source-verification.v1' as const

const MAX_RECORD_BYTES = 2 * 1024 * 1024
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sourceVerificationEvidenceClassSchema = z.enum([
  'private_source_verifier_test_fixture',
  'canonical_backend_runtime_unreleased',
])

export type CalibrationCandidateSourceVerificationEvidenceClass = z.infer<
  typeof sourceVerificationEvidenceClassSchema
>

export const calibrationCandidateSourceVerificationSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CALIBRATION_CANDIDATE_SOURCE_VERIFICATION_VERSION,
  ),
  evidenceClass: sourceVerificationEvidenceClassSchema,
  candidateId: stableIdSchema,
  candidateDigest: digestSchema,
  sourceAttemptId: stableIdSchema,
  sourceEvidenceDigest: digestSchema,
  sourceVerifierId: stableIdSchema,
  sourceAuthorityReadbackDigest: digestSchema,
  outputContentDigest: digestSchema.optional(),
  storageEvidenceDigest: digestSchema.optional(),
  checksumReadbackEvidenceDigest: digestSchema.optional(),
  technicalQaEvidenceDigest: digestSchema.optional(),
  costEvidenceDigest: digestSchema,
  sourceAuthorityReverified: z.literal(true),
  privateOutputReadbackVerified: z.boolean(),
  technicalQaEvidenceReverified: z.boolean(),
  attemptCostEvidenceReverified: z.literal(true),
  promotionAuthorized: z.literal(false),
  productionReady: z.literal(false),
  verificationDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.verificationDigest
  if (sha256CanonicalJson(unsigned) !== value.verificationDigest) {
    context.addIssue({
      code: 'custom',
      path: ['verificationDigest'],
      message: 'Calibration candidate source verification digest failed.',
    })
  }
})

export type CalibrationCandidateSourceVerification = z.infer<
  typeof calibrationCandidateSourceVerificationSchema
>

const approvedCalibrationEvidenceRecordSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_APPROVED_CALIBRATION_EVIDENCE_RECORD_VERSION,
  ),
  sourceAuthority: z.literal(
    'motion_studio_private_approved_calibration_evidence_store',
  ),
  evidenceClass: sourceVerificationEvidenceClassSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  sourcePlanReviewInputDigest: digestSchema,
  canonicalProjectionDigest: digestSchema,
  approvedCalibrationPlanDigest: digestSchema,
  reelDigest: digestSchema,
  routingProfileDigest: digestSchema,
  candidateSourceVerifications: z.array(calibrationCandidateSourceVerificationSchema)
    .min(5).max(64).readonly(),
  candidateSourceVerificationSetDigest: digestSchema,
  reel: styleCalibrationReelSchema,
  routingProfile: projectVideoRoutingProfileSchema,
  sourceRepositoryReverified: z.literal(true),
  candidateSourcesReverified: z.literal(true),
  privateLocalOnly: z.literal(true),
  createOnly: z.literal(true),
  canonicalReviewProjectionAllowed: z.boolean(),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  promotionAuthorized: z.literal(false),
  productionReady: z.literal(false),
  recordDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const sourceVerificationIds = value.candidateSourceVerifications.map(
    (verification) => verification.candidateId,
  )
  if (
    new Set(sourceVerificationIds).size !== sourceVerificationIds.length ||
    value.candidateSourceVerifications.some(
      (verification) => verification.evidenceClass !== value.evidenceClass,
    ) ||
    sha256CanonicalJson(value.candidateSourceVerifications) !==
      value.candidateSourceVerificationSetDigest ||
    value.reel.reelDigest !== value.reelDigest ||
    value.routingProfile.profileDigest !== value.routingProfileDigest ||
    value.routingProfile.calibrationReelDigest !== value.reelDigest ||
    sha256CanonicalJson(value.routingProfile.decisions) !==
      sha256CanonicalJson(value.reel.decisions) ||
    value.canonicalReviewProjectionAllowed !==
      (value.evidenceClass === 'canonical_backend_runtime_unreleased')
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Approved calibration evidence record failed source, Reel, or routing reconciliation.',
    })
  }
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.recordDigest
  if (sha256CanonicalJson(unsigned) !== value.recordDigest) {
    context.addIssue({
      code: 'custom',
      path: ['recordDigest'],
      message: 'Approved calibration evidence record digest failed.',
    })
  }
})

export type ApprovedCalibrationEvidenceRecord = z.infer<
  typeof approvedCalibrationEvidenceRecordSchema
>

export interface CalibrationCandidateSourceVerifier {
  readonly evidenceClass: CalibrationCandidateSourceVerificationEvidenceClass
  verify(input: {
    candidate: StyleCalibrationCandidateEvidence
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  }): Promise<CalibrationCandidateSourceVerification>
}

export interface PrivateApprovedCalibrationEvidenceStore {
  persist(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    reel: StyleCalibrationReel
    routingProfile: ProjectVideoRoutingProfile
  }): Promise<{ record: ApprovedCalibrationEvidenceRecord; created: boolean }>
  read(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  }): Promise<ApprovedCalibrationEvidenceRecord>
  readForCanonicalReview(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  }): Promise<ApprovedCalibrationEvidenceRecord>
}

/**
 * Persists one immutable, private Reel + routing result per canonical approved
 * snapshot. It does not execute work or trust candidate sourceVerified flags:
 * the supplied server-only verifier must reopen every attempt, output, QA, and
 * cost source on both write and readback.
 */
export function createPrivateApprovedCalibrationEvidenceStore(input: {
  localStorageRoot: string
  candidateSourceVerifier: CalibrationCandidateSourceVerifier
}): PrivateApprovedCalibrationEvidenceStore {
  const store: PrivateApprovedCalibrationEvidenceStore = {
    async persist(value: {
      approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
      reel: StyleCalibrationReel
      routingProfile: ProjectVideoRoutingProfile
    }) {
      const { approvedPlanSource, reel, routingProfile } = validateBundle(value)
      const candidateSourceVerifications = await verifyCandidateSources({
        verifier: input.candidateSourceVerifier,
        approvedPlanSource,
        reel,
      })
      const base = recordBase({
        approvedPlanSource,
        reel,
        routingProfile,
        evidenceClass: input.candidateSourceVerifier.evidenceClass,
        candidateSourceVerifications,
      })
      const record = parseRecord({
        ...base,
        recordDigest: sha256CanonicalJson(base),
      })
      const bytes = Buffer.from(`${JSON.stringify(record)}\n`, 'utf8')
      if (bytes.byteLength > MAX_RECORD_BYTES) {
        throw invalid('Approved calibration evidence exceeds its private byte ceiling.')
      }
      const relativePath = recordRelativePath(approvedPlanSource)
      const written = await withPrivateCooperativeFileLockWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: lockRelativePath(approvedPlanSource),
        operation: () => writePrivateFileCreateOnlyWithinRoot({
          rootPath: input.localStorageRoot,
          relativePath,
          content: bytes,
        }),
      })
      const readback = await readAndVerifyRecord({
        localStorageRoot: input.localStorageRoot,
        relativePath,
        approvedPlanSource,
        verifier: input.candidateSourceVerifier,
      })
      if (sha256CanonicalJson(readback) !== sha256CanonicalJson(record)) {
        throw conflict('Approved calibration evidence changed during create-only persistence.')
      }
      return { record, created: written.created }
    },

    async read(value: {
      approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    }) {
      assertCanonicalApprovedStorytellingStylePlanSource(value.approvedPlanSource)
      return readAndVerifyRecord({
        localStorageRoot: input.localStorageRoot,
        relativePath: recordRelativePath(value.approvedPlanSource),
        approvedPlanSource: value.approvedPlanSource,
        verifier: input.candidateSourceVerifier,
      })
    },

    async readForCanonicalReview(value: {
      approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    }) {
      const record: ApprovedCalibrationEvidenceRecord = await store.read(value)
      throw notReady(
        record.canonicalReviewProjectionAllowed
          ? 'Legacy canonical-shaped calibration evidence cannot enter Storytelling review until the released finalization verifier reopens its history and authenticated reviews.'
          : 'Approved calibration evidence is test-only and cannot enter canonical Storytelling review.',
      )
    },
  }
  return store
}

export function createCalibrationCandidateSourceVerification(input: {
  evidenceClass: CalibrationCandidateSourceVerificationEvidenceClass
  candidate: StyleCalibrationCandidateEvidence
  sourceAuthorityReadbackDigest: string
}): CalibrationCandidateSourceVerification {
  const candidate = styleCalibrationCandidateEvidenceSchema.parse(input.candidate)
  const base = {
    schemaVersion:
      MOTION_STUDIO_CALIBRATION_CANDIDATE_SOURCE_VERIFICATION_VERSION,
    evidenceClass: input.evidenceClass,
    candidateId: candidate.id,
    candidateDigest: candidate.candidateDigest,
    sourceAttemptId: candidate.sourceEvidence.sourceAttemptId,
    sourceEvidenceDigest: candidate.sourceEvidence.sourceEvidenceDigest,
    sourceVerifierId: candidate.sourceEvidence.sourceVerifierId,
    sourceAuthorityReadbackDigest: digestSchema.parse(
      input.sourceAuthorityReadbackDigest,
    ),
    ...(candidate.output ? {
      outputContentDigest: candidate.output.contentDigest,
      storageEvidenceDigest: candidate.output.storageEvidenceDigest,
      checksumReadbackEvidenceDigest:
        candidate.output.checksumReadbackEvidenceDigest,
    } : {}),
    ...(candidate.technicalQa.evidenceDigest
      ? { technicalQaEvidenceDigest: candidate.technicalQa.evidenceDigest }
      : {}),
    costEvidenceDigest: candidate.cost.costEvidenceDigest,
    sourceAuthorityReverified: true as const,
    privateOutputReadbackVerified: candidate.output !== undefined,
    technicalQaEvidenceReverified:
      candidate.technicalQa.evidenceDigest !== undefined,
    attemptCostEvidenceReverified: true as const,
    promotionAuthorized: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  return deepFreeze(calibrationCandidateSourceVerificationSchema.parse({
    ...base,
    verificationDigest: sha256CanonicalJson(base),
  }))
}

function validateBundle(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  reel: StyleCalibrationReel
  routingProfile: ProjectVideoRoutingProfile
}) {
  const approvedPlanSource = input.approvedPlanSource
  assertCanonicalApprovedStorytellingStylePlanSource(approvedPlanSource)
  const reel = styleCalibrationReelSchema.parse(input.reel)
  const routingProfile = projectVideoRoutingProfileSchema.parse(
    input.routingProfile,
  )
  const plan = approvedPlanSource.approvedCalibrationPlan
  if (!verifyStyleCalibrationReelDigest(reel) ||
      !verifyStorytellingStyleAuthorityDigest(routingProfile)) {
    throw invalid('Approved calibration Reel or routing profile failed immutable digest verification.')
  }
  if (
    reel.state !== 'approved' ||
    routingProfile.state !== 'approved' ||
    !reel.productionScaleRoutingApproved ||
    !routingProfile.bulkGenerationAllowed ||
    !reel.costWithinAuthority ||
    reel.unreconciledCostCandidateCount !== 0 ||
    reel.unknownCandidateCount !== 0 ||
    reel.workspaceId !== plan.workspaceId ||
    reel.projectId !== plan.projectId ||
    reel.editSessionId !== plan.editSessionId ||
    reel.productionId !== plan.productionId ||
    reel.calibrationPlanDigest !== plan.planDigest ||
    reel.approvedPlanSnapshotId !== approvedPlanSource.approvedSnapshotId ||
    reel.approvedPlanSnapshotDigest !== approvedPlanSource.approvedSnapshotDigest ||
    reel.maximumAuthorizedInternalCostMicros !==
      plan.approvalAuthority.maximumAuthorizedInternalCostMicros ||
    routingProfile.workspaceId !== plan.workspaceId ||
    routingProfile.projectId !== plan.projectId ||
    routingProfile.editSessionId !== plan.editSessionId ||
    routingProfile.productionId !== plan.productionId ||
    routingProfile.calibrationPlanDigest !== plan.planDigest ||
    routingProfile.approvedPlanSnapshotId !== approvedPlanSource.approvedSnapshotId ||
    routingProfile.approvedPlanSnapshotDigest !== approvedPlanSource.approvedSnapshotDigest ||
    routingProfile.calibrationReelDigest !== reel.reelDigest ||
    routingProfile.styleProfile.styleProfileId !== plan.styleProfile.styleProfileId ||
    routingProfile.motionDnaVersion.versionId !== plan.motionDnaVersion.versionId ||
    routingProfile.motionDnaVersion.contentDigest !== plan.motionDnaVersion.contentDigest ||
    routingProfile.routePolicyId !== plan.routePolicy.policyId ||
    routingProfile.routePolicyDigest !== sha256CanonicalJson(plan.routePolicy) ||
    sha256CanonicalJson(routingProfile.decisions) !==
      sha256CanonicalJson(reel.decisions)
  ) {
    throw conflict(
      'Approved calibration Reel and routing profile do not match the exact source-verified approved plan.',
    )
  }
  return { approvedPlanSource, reel, routingProfile }
}

export function assertCanonicalApprovedStorytellingStylePlanSource(
  source: CanonicalApprovedStorytellingStylePlanSource,
): void {
  const plan = source.approvedCalibrationPlan
  const selection = source.approvedStyleSelection
  if (
    source.sourceRepositoryReverified !== true ||
    source.runtimeExecutionAuthorized !== false ||
    source.providerExecutionAuthorized !== false ||
    source.customerCommercialAuthorityGranted !== false ||
    !verifyStorytellingStyleAuthorityDigest(selection) ||
    !verifyStorytellingStyleAuthorityDigest(plan) ||
    selection.state !== 'approved_snapshot_bound' ||
    plan.approvalAuthority.state !== 'approved_bounded_execution' ||
    selection.approvedPlanSnapshotId !== source.approvedSnapshotId ||
    selection.approvedPlanSnapshotDigest !== source.approvedSnapshotDigest ||
    plan.approvalAuthority.approvedPlanSnapshotId !== source.approvedSnapshotId ||
    plan.approvalAuthority.approvedPlanSnapshotDigest !== source.approvedSnapshotDigest
  ) {
    throw conflict('Approved calibration evidence requires one exact source-reverified post-approval plan.')
  }
}

async function verifyCandidateSources(input: {
  verifier: CalibrationCandidateSourceVerifier
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  reel: StyleCalibrationReel
}): Promise<readonly CalibrationCandidateSourceVerification[]> {
  const verifications: CalibrationCandidateSourceVerification[] = []
  for (const candidate of input.reel.candidates) {
    if (
      !['canonical_tool_attempt', 'canonical_provider_attempt'].includes(
        candidate.sourceEvidence.kind,
      ) ||
      candidate.sourceEvidence.readiness !==
        'canonical_private_routing_eligible' ||
      !candidate.sourceEvidence.sourceVerified
    ) {
      throw conflict(
        'Approved calibration evidence requires one reopened canonical source for every candidate attempt.',
      )
    }
    const verification = calibrationCandidateSourceVerificationSchema.parse(
      await input.verifier.verify({
        candidate,
        approvedPlanSource: input.approvedPlanSource,
      }),
    )
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
      verification.technicalQaEvidenceDigest !==
        candidate.technicalQa.evidenceDigest ||
      verification.costEvidenceDigest !== candidate.cost.costEvidenceDigest ||
      verification.privateOutputReadbackVerified !==
        (candidate.output !== undefined) ||
      verification.technicalQaEvidenceReverified !==
        (candidate.technicalQa.evidenceDigest !== undefined)
    ) {
      throw conflict(
        'Canonical calibration candidate source verification changed attempt, output, QA, or cost authority.',
      )
    }
    verifications.push(verification)
  }
  return deepFreeze(verifications)
}

function recordBase(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  reel: StyleCalibrationReel
  routingProfile: ProjectVideoRoutingProfile
  evidenceClass: CalibrationCandidateSourceVerificationEvidenceClass
  candidateSourceVerifications: readonly CalibrationCandidateSourceVerification[]
}) {
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  return {
    schemaVersion: MOTION_STUDIO_APPROVED_CALIBRATION_EVIDENCE_RECORD_VERSION,
    sourceAuthority:
      'motion_studio_private_approved_calibration_evidence_store' as const,
    evidenceClass: input.evidenceClass,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    productionId: plan.productionId,
    approvedSnapshotId: input.approvedPlanSource.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedPlanSource.approvedSnapshotDigest,
    sourcePlanReviewInputDigest:
      input.approvedPlanSource.sourcePlanReviewInputDigest,
    canonicalProjectionDigest:
      input.approvedPlanSource.canonicalProjectionDigest,
    approvedCalibrationPlanDigest: plan.planDigest,
    reelDigest: input.reel.reelDigest,
    routingProfileDigest: input.routingProfile.profileDigest,
    candidateSourceVerifications: input.candidateSourceVerifications,
    candidateSourceVerificationSetDigest: sha256CanonicalJson(
      input.candidateSourceVerifications,
    ),
    reel: input.reel,
    routingProfile: input.routingProfile,
    sourceRepositoryReverified: true as const,
    candidateSourcesReverified: true as const,
    privateLocalOnly: true as const,
    createOnly: true as const,
    canonicalReviewProjectionAllowed:
      input.evidenceClass === 'canonical_backend_runtime_unreleased',
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    promotionAuthorized: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
}

async function readAndVerifyRecord(input: {
  localStorageRoot: string
  relativePath: string
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  verifier: CalibrationCandidateSourceVerifier
}): Promise<ApprovedCalibrationEvidenceRecord> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: input.relativePath,
  })
  if (!bytes) throw notReady('Approved calibration evidence is not available for this exact snapshot.')
  if (bytes.byteLength < 512 || bytes.byteLength > MAX_RECORD_BYTES) {
    throw invalid('Approved calibration evidence has an invalid private byte length.')
  }
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Approved calibration evidence is not valid JSON.')
  }
  const record = parseRecord(value)
  const { reel, routingProfile } = validateBundle({
    approvedPlanSource: input.approvedPlanSource,
    reel: record.reel,
    routingProfile: record.routingProfile,
  })
  if (
    record.evidenceClass !== input.verifier.evidenceClass ||
    record.workspaceId !== reel.workspaceId ||
    record.projectId !== reel.projectId ||
    record.editSessionId !== reel.editSessionId ||
    record.productionId !== reel.productionId ||
    record.approvedSnapshotId !== input.approvedPlanSource.approvedSnapshotId ||
    record.approvedSnapshotDigest !== input.approvedPlanSource.approvedSnapshotDigest ||
    record.sourcePlanReviewInputDigest !==
      input.approvedPlanSource.sourcePlanReviewInputDigest ||
    record.canonicalProjectionDigest !==
      input.approvedPlanSource.canonicalProjectionDigest ||
    record.approvedCalibrationPlanDigest !==
      input.approvedPlanSource.approvedCalibrationPlan.planDigest
  ) {
    throw conflict('Approved calibration evidence changed its exact snapshot or source-plan identity.')
  }
  const reverified = await verifyCandidateSources({
    verifier: input.verifier,
    approvedPlanSource: input.approvedPlanSource,
    reel,
  })
  if (
    sha256CanonicalJson(reverified) !==
      record.candidateSourceVerificationSetDigest ||
    sha256CanonicalJson(reverified) !==
      sha256CanonicalJson(record.candidateSourceVerifications)
  ) {
    throw conflict('Approved calibration candidate source evidence changed during restart readback.')
  }
  return deepFreeze({ ...record, reel, routingProfile })
}

function parseRecord(value: unknown): ApprovedCalibrationEvidenceRecord {
  const parsed = approvedCalibrationEvidenceRecordSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('Approved calibration evidence failed schema or digest verification.', {
      validation: parsed.error.flatten(),
    })
  }
  return deepFreeze(parsed.data)
}

function recordRelativePath(
  source: CanonicalApprovedStorytellingStylePlanSource,
): string {
  const plan = source.approvedCalibrationPlan
  const scopeHash = createHash('sha256').update(sha256CanonicalJson({
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    productionId: plan.productionId,
    approvedSnapshotId: source.approvedSnapshotId,
  }), 'utf8').digest('hex')
  return [
    'motion-studio',
    'approved-calibration-evidence',
    'private-v1',
    scopeHash.slice(0, 2),
    scopeHash,
    `${source.approvedSnapshotDigest}.json`,
  ].join('/')
}

function lockRelativePath(
  source: CanonicalApprovedStorytellingStylePlanSource,
): string {
  return `${recordRelativePath(source)}.cooperative.lock`
}

function invalid(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_storytelling_calibration_candidate_source_receipts',
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
