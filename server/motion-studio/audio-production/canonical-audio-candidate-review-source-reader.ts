import { z } from 'zod'

import {
  MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_SUMMARY_VERSION,
  type MotionStudioAudioCandidateReviewSummaryDto,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { readCanonicalPrivateAudioArtifact } from '../../services/canonical-private-audio-artifact-storage'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertCanonicalMotionStudioAudioCandidateReviewProjection,
  createCanonicalMotionStudioAudioCandidateReviewProjection,
  type CanonicalMotionStudioAudioCandidateReviewProjection,
  type CanonicalMotionStudioAudioCandidateReviewReaderPort,
  type CanonicalMotionStudioAudioCandidateReviewScope,
} from './canonical-audio-candidate-review-reader-port'
import {
  readMotionStudioProviderCandidateAuthenticatedReviewBinding,
} from './canonical-provider-candidate-authenticated-review-binding'
import {
  readMotionStudioProviderCandidateAuthenticatedReviewVerifier,
} from './canonical-provider-candidate-authenticated-review-verifier'
import {
  readMotionStudioProviderCandidateObjectiveQaEvidence,
  motionStudioProviderCandidateRequestAuthoritySchema,
  type MotionStudioProviderCandidateRequestAuthority,
} from './canonical-provider-candidate-objective-qa'
import {
  evaluateMotionStudioProviderCandidateReviewContextFreshness,
  readMotionStudioProviderCandidateReviewContext,
} from './canonical-provider-candidate-review-context'
import {
  readMotionStudioProviderCandidateReviewEvidence,
} from './canonical-provider-candidate-review-evidence'
import {
  readMotionStudioProviderCandidateReviewHandoff,
} from './canonical-provider-candidate-review-handoff'
import { parseMotionStudioPcmWave } from './pcm-wave'

export const CANONICAL_MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_LOCATOR_VERSION =
  'canonical-motion-studio-audio-candidate-review-locator-v1' as const

const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const scopeSchema = z.object({
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
}).strict()

export const canonicalMotionStudioAudioCandidateReviewLocatorSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_LOCATOR_VERSION,
  ),
  locatorId: stableId,
  candidateReference: stableId,
  scope: scopeSchema,
  sourceRecords: z.object({
    objectiveQaEvidenceObjectIdentityHash: digest,
    reviewHandoffEvidenceObjectIdentityHash: digest,
    reviewContextEvidenceObjectIdentityHash: digest,
    reviewEvidenceObjectIdentityHash: digest,
    authenticatedVerifierEvidenceObjectIdentityHash: digest,
    authenticatedBindingEvidenceObjectIdentityHash: digest,
  }).strict(),
  currentRequestAuthority: motionStudioProviderCandidateRequestAuthoritySchema,
  currentAuthorityRead: z.object({
    source: z.literal('canonical_storytelling_audio_request_authority_store'),
    receiptId: stableId,
    exactCurrentAuthorityReverified: z.literal(true),
    browserSuppliedAuthorityAccepted: z.literal(false),
    receiptDigest: digest,
  }).strict(),
  evaluatedAt: z.string().datetime({ offset: true }),
  locatorDigest: digest,
}).strict().superRefine((value, context) => {
  const expectedCandidateReference = candidateReferenceFor(
    value.sourceRecords.authenticatedBindingEvidenceObjectIdentityHash,
  )
  const authorityReceiptBase = currentAuthorityReceiptBase({
    scope: value.scope,
    currentRequestAuthority: value.currentRequestAuthority,
    receiptId: value.currentAuthorityRead.receiptId,
  })
  const locatorBase = locatorUnsigned(value)
  if (
    value.candidateReference !== expectedCandidateReference ||
    value.currentAuthorityRead.receiptDigest !== sha256CanonicalJson(authorityReceiptBase) ||
    value.locatorDigest !== sha256CanonicalJson(locatorBase)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical audio candidate locator failed immutable source verification.',
    })
  }
})

export type CanonicalMotionStudioAudioCandidateReviewLocator = z.infer<
  typeof canonicalMotionStudioAudioCandidateReviewLocatorSchema
>

/**
 * Server-only locator over the existing canonical current-request and review
 * stores. It locates immutable source identities; it is not a candidate,
 * review, selection, mix, or persistence authority.
 */
export interface CanonicalMotionStudioAudioCandidateReviewLocatorPort {
  listCurrentReviewLocators(
    scope: CanonicalMotionStudioAudioCandidateReviewScope,
  ): Promise<readonly CanonicalMotionStudioAudioCandidateReviewLocator[]>

  resolveCurrentReviewLocator(
    candidateReference: string,
  ): Promise<CanonicalMotionStudioAudioCandidateReviewLocator | undefined>
}

export function createCanonicalMotionStudioAudioCandidateReviewLocator(input: {
  scope: CanonicalMotionStudioAudioCandidateReviewScope
  sourceRecords: CanonicalMotionStudioAudioCandidateReviewLocator['sourceRecords']
  currentRequestAuthority: MotionStudioProviderCandidateRequestAuthority
  currentAuthorityReadReceiptId: string
  evaluatedAt: string
}): CanonicalMotionStudioAudioCandidateReviewLocator {
  const bindingIdentity = digest.parse(
    input.sourceRecords.authenticatedBindingEvidenceObjectIdentityHash,
  )
  const scope = scopeSchema.parse(input.scope)
  const currentRequestAuthority = motionStudioProviderCandidateRequestAuthoritySchema.parse(
    input.currentRequestAuthority,
  )
  const candidateReference = candidateReferenceFor(bindingIdentity)
  const currentAuthorityRead = {
    source: 'canonical_storytelling_audio_request_authority_store' as const,
    receiptId: stableId.parse(input.currentAuthorityReadReceiptId),
    exactCurrentAuthorityReverified: true as const,
    browserSuppliedAuthorityAccepted: false as const,
    receiptDigest: sha256CanonicalJson(currentAuthorityReceiptBase({
      scope,
      currentRequestAuthority,
      receiptId: input.currentAuthorityReadReceiptId,
    })),
  }
  const base = {
    schemaVersion: CANONICAL_MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_LOCATOR_VERSION,
    locatorId: `ms012e-audio-review-locator-${bindingIdentity.slice(0, 32)}`,
    candidateReference,
    scope,
    sourceRecords: input.sourceRecords,
    currentRequestAuthority,
    currentAuthorityRead,
    evaluatedAt: input.evaluatedAt,
  }
  return deepFreeze(canonicalMotionStudioAudioCandidateReviewLocatorSchema.parse({
    ...base,
    locatorDigest: sha256CanonicalJson(base),
  }))
}

export function createCanonicalMotionStudioAudioCandidateReviewSourceReader(input: {
  localStorageRoot: string
  locatorPort: CanonicalMotionStudioAudioCandidateReviewLocatorPort
}): CanonicalMotionStudioAudioCandidateReviewReaderPort {
  assertPrivateCandidateRoot(input.localStorageRoot)

  const project = async (
    locatorInput: CanonicalMotionStudioAudioCandidateReviewLocator,
  ): Promise<CanonicalMotionStudioAudioCandidateReviewProjection> => {
    const locator = canonicalMotionStudioAudioCandidateReviewLocatorSchema.parse(locatorInput)
    const sources = await readAndVerifySources({
      localStorageRoot: input.localStorageRoot,
      locator,
    })
    return createCanonicalMotionStudioAudioCandidateReviewProjection({
      summary: sources.summary,
      privateObjectIdentityHash:
        sources.binding.exactLineage.candidatePrivateObjectIdentityHash,
      sourceVerificationReceiptId: sources.releaseReceiptId,
      sourceVerificationReceiptDigest: sources.releaseReceiptDigest,
    })
  }

  return {
    async listCurrentCandidateReviews(scope) {
      const parsedScope = scopeSchema.parse(scope)
      const locators = await input.locatorPort.listCurrentReviewLocators(parsedScope)
      if (locators.length > 2) blocked('Canonical audio review locator returned excessive candidates.')
      const parsedLocators = locators.map((locator) =>
        canonicalMotionStudioAudioCandidateReviewLocatorSchema.parse(locator))
      for (const locator of parsedLocators) assertLocatorScope(parsedScope, locator)
      const projections = await Promise.all(parsedLocators.map(project))
      if (
        new Set(projections.map((entry) => entry.summary.candidateReference)).size !==
          projections.length ||
        new Set(projections.map((entry) => entry.summary.role)).size !== projections.length
      ) blocked('Canonical audio review locator returned duplicate current candidates.')
      for (const projection of projections) assertProjectionScope(parsedScope, projection)
      return deepFreeze(projections)
    },

    async resolveCurrentCandidateReview(candidateReference) {
      const reference = stableId.parse(candidateReference)
      const locator = await input.locatorPort.resolveCurrentReviewLocator(reference)
      if (!locator) return undefined
      const projection = await project(locator)
      if (projection.summary.candidateReference !== reference) {
        blocked('Canonical audio review locator changed the candidate reference.')
      }
      return projection
    },

    async readExactPrivateCandidate(readInput) {
      const scope = scopeSchema.parse({
        workspaceId: readInput.workspaceId,
        projectId: readInput.projectId,
        editSessionId: readInput.editSessionId,
        productionId: readInput.productionId,
      })
      const reference = stableId.parse(readInput.candidateReference)
      const locatorInput = await input.locatorPort.resolveCurrentReviewLocator(reference)
      if (!locatorInput) return undefined
      const locator = canonicalMotionStudioAudioCandidateReviewLocatorSchema.parse(locatorInput)
      assertLocatorScope(scope, locator)
      const projection = await project(locator)
      assertProjectionScope(scope, projection)
      if (
        projection.summary.candidateReference !== reference ||
        projection.projectionDigest !== digest.parse(readInput.projectionDigest)
      ) blocked('Canonical audio candidate changed between projection and private readback.')
      const candidate = projection.summary.candidate
      if (!candidate) blocked('Canonical audio candidate is not available for private playback.')
      const stored = await readCanonicalPrivateAudioArtifact({
        localStorageRoot: input.localStorageRoot,
        privateObjectIdentityHash: projection.privateObjectIdentityHash,
      })
      if (
        !stored || stored.sha256 !== candidate.sha256 ||
        stored.byteLength !== candidate.byteLength
      ) blocked('Canonical audio candidate private bytes changed after review projection.')
      assertExactWave(stored.bytes, candidate)
      return { projection, bytes: Buffer.from(stored.bytes) }
    },
  }
}

async function readAndVerifySources(input: {
  localStorageRoot: string
  locator: CanonicalMotionStudioAudioCandidateReviewLocator
}) {
  const { locator, localStorageRoot } = input
  const identities = locator.sourceRecords
  const [objectiveQa, reviewHandoff, reviewContext, reviewEvidence, verifier, binding] =
    await Promise.all([
      readMotionStudioProviderCandidateObjectiveQaEvidence({
        localStorageRoot,
        evidenceObjectIdentityHash: identities.objectiveQaEvidenceObjectIdentityHash,
      }),
      readMotionStudioProviderCandidateReviewHandoff({
        localStorageRoot,
        evidenceObjectIdentityHash: identities.reviewHandoffEvidenceObjectIdentityHash,
      }),
      readMotionStudioProviderCandidateReviewContext({
        localStorageRoot,
        evidenceObjectIdentityHash: identities.reviewContextEvidenceObjectIdentityHash,
      }),
      readMotionStudioProviderCandidateReviewEvidence({
        localStorageRoot,
        evidenceObjectIdentityHash: identities.reviewEvidenceObjectIdentityHash,
      }),
      readMotionStudioProviderCandidateAuthenticatedReviewVerifier({
        localStorageRoot,
        evidenceObjectIdentityHash:
          identities.authenticatedVerifierEvidenceObjectIdentityHash,
      }),
      readMotionStudioProviderCandidateAuthenticatedReviewBinding({
        localStorageRoot,
        evidenceObjectIdentityHash:
          identities.authenticatedBindingEvidenceObjectIdentityHash,
      }),
    ])
  if (!objectiveQa || !reviewHandoff || !reviewContext || !reviewEvidence || !verifier || !binding) {
    blocked('Canonical audio candidate review requires every exact persisted source record.')
  }
  const scope = locator.scope
  const records = [objectiveQa, reviewHandoff, reviewContext, reviewEvidence, verifier, binding]
  if (records.some((record) =>
    record.workspaceId !== scope.workspaceId || record.projectId !== scope.projectId ||
    record.editSessionId !== scope.editSessionId || record.productionId !== scope.productionId)) {
    blocked('Canonical audio candidate review source records changed exact named-edit scope.')
  }
  if (
    objectiveQa.evidenceClass !== 'canonical_backend_verified_runtime' ||
    reviewHandoff.evidenceClass !== 'canonical_backend_verified_runtime' ||
    reviewContext.evidenceClass !== 'canonical_backend_verified_runtime' ||
    reviewEvidence.evidenceClass !== 'canonical_backend_verified_runtime' ||
    verifier.evidenceClass !== 'canonical_authenticated_runtime' ||
    binding.evidenceClass !== 'canonical_authenticated_review_binding'
  ) blocked('Canonical audio candidate review rejects fixture or unreleased evidence.')

  const currentRequestAuthority = motionStudioProviderCandidateRequestAuthoritySchema.parse(
    locator.currentRequestAuthority,
  )
  const freshness = evaluateMotionStudioProviderCandidateReviewContextFreshness({
    reviewContext,
    currentRequestAuthority,
    evaluatedAt: locator.evaluatedAt,
  })
  if (
    freshness.invalidationReasons.length !== 0 ||
    !freshness.readiness.exactReviewContextCurrent ||
    freshness.currentRequestAuthorityDigest !== binding.exactLineage.requestAuthorityDigest
  ) blocked('Canonical audio candidate review context is stale and requires replanning.')

  verifyExactLineage({
    objectiveQa,
    reviewHandoff,
    reviewContext,
    reviewEvidence,
    verifier,
    binding,
  })
  const stored = await readCanonicalPrivateAudioArtifact({
    localStorageRoot,
    privateObjectIdentityHash: binding.exactLineage.candidatePrivateObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== binding.exactLineage.candidateSha256 ||
    stored.byteLength !== binding.exactLineage.candidateByteLength
  ) blocked('Canonical audio candidate review failed exact private candidate readback.')
  const wave = assertExactWave(stored.bytes, {
    sampleRateHertz: 48_000,
    channelCount: 2,
    durationMilliseconds: binding.exactLineage.candidateDurationMilliseconds,
  })
  const role = binding.intent === 'generated_music_candidate' ? 'music' : 'foley'
  const requiredReviewCheckCount = role === 'music' ? 6 : 5
  if (binding.authenticatedReview.gateCount !== requiredReviewCheckCount) {
    blocked('Canonical audio candidate review has the wrong role-specific gate set.')
  }
  const passed = binding.readiness.reviewPassed
  const rejected = binding.readiness.reviewRejected
  if (passed === rejected || (!passed && !rejected)) {
    blocked('Canonical audio candidate review binding has no exact human review outcome.')
  }
  const candidateReference = candidateReferenceFor(
    binding.persistence.evidenceObjectIdentityHash,
  )
  if (candidateReference !== locator.candidateReference) {
    blocked('Canonical audio candidate review locator changed immutable candidate identity.')
  }
  const summary: MotionStudioAudioCandidateReviewSummaryDto = {
    schemaVersion: MOTION_STUDIO_AUDIO_CANDIDATE_REVIEW_SUMMARY_VERSION,
    productionId: binding.productionId,
    projectId: binding.projectId,
    editSessionId: binding.editSessionId,
    sourceApprovedSnapshotId: binding.approvedSnapshotId,
    sourceApprovedSnapshotDigest: binding.approvedSnapshotDigest,
    timingAuthorityDigest: currentRequestAuthority.timingAuthorityDigest,
    candidateReference,
    role,
    state: passed ? 'reviewed_passed' : 'reviewed_rejected',
    reviewVersion: 1,
    requiredReviewCheckCount,
    completedReviewCheckCount: binding.authenticatedReview.gateCount,
    candidateDurationMilliseconds: wave.durationMilliseconds,
    candidate: {
      candidateReference,
      sha256: stored.sha256,
      byteLength: stored.byteLength,
      mimeType: 'audio/wav',
      codec: 'pcm_s16le',
      sampleRateHertz: 48_000,
      channelCount: 2,
      durationMilliseconds: wave.durationMilliseconds,
      contentPath: `/v1/motion-studio/audio-candidates/${candidateReference}/content`,
      privateReviewOnly: true,
    },
    review: {
      decision: passed ? 'passed' : 'rejected',
      note: passed
        ? 'Complete private review passed every required check.'
        : 'Complete private review found one or more blocking issues.',
      reviewedAt: reviewEvidence.humanReview.completedAt,
      immutable: true,
    },
    exactReviewContextCurrent: true,
    canonicalRuntimeEvidenceVerified: true,
    completePrivatePlaybackRequired: true,
    humanReviewRequired: true,
    automaticSelectionAllowed: false,
    selected: false,
    finalMixEligible: false,
    timelineReady: false,
    renderReady: false,
    exportReady: false,
    publicDeliveryReady: false,
    productReady: false,
  }
  const releaseBase = {
    domain: 'canonical_motion_studio_audio_candidate_private_review_release_v1',
    locatorDigest: locator.locatorDigest,
    currentAuthorityReadReceiptDigest: locator.currentAuthorityRead.receiptDigest,
    objectiveQaEvidenceDigest: objectiveQa.evidenceDigest,
    reviewHandoffDigest: reviewHandoff.handoffDigest,
    reviewContextDigest: reviewContext.reviewContextDigest,
    freshnessDigest: freshness.freshnessDigest,
    reviewEvidenceDigest: reviewEvidence.reviewEvidenceDigest,
    authenticatedVerifierDigest: verifier.verificationDigest,
    authenticatedBindingDigest: binding.bindingDigest,
    candidatePrivateObjectIdentityHash:
      binding.exactLineage.candidatePrivateObjectIdentityHash,
    candidateSha256: stored.sha256,
    candidateByteLength: stored.byteLength,
    privateReviewRelease: true,
    selectionAuthorized: false,
    productionPromotionAuthorized: false,
  }
  const releaseReceiptDigest = sha256CanonicalJson(releaseBase)
  return {
    binding,
    summary,
    releaseReceiptId: `ms012e-audio-review-release-${releaseReceiptDigest.slice(0, 32)}`,
    releaseReceiptDigest,
  }
}

function verifyExactLineage(input: {
  objectiveQa: NonNullable<Awaited<ReturnType<typeof readMotionStudioProviderCandidateObjectiveQaEvidence>>>
  reviewHandoff: NonNullable<Awaited<ReturnType<typeof readMotionStudioProviderCandidateReviewHandoff>>>
  reviewContext: NonNullable<Awaited<ReturnType<typeof readMotionStudioProviderCandidateReviewContext>>>
  reviewEvidence: NonNullable<Awaited<ReturnType<typeof readMotionStudioProviderCandidateReviewEvidence>>>
  verifier: NonNullable<Awaited<ReturnType<typeof readMotionStudioProviderCandidateAuthenticatedReviewVerifier>>>
  binding: NonNullable<Awaited<ReturnType<typeof readMotionStudioProviderCandidateAuthenticatedReviewBinding>>>
}): void {
  const { objectiveQa, reviewHandoff, reviewContext, reviewEvidence, verifier, binding } = input
  if (
    reviewHandoff.sourceObjectiveQa.evidenceDigest !== objectiveQa.evidenceDigest ||
    reviewContext.sourceObjectiveQa.evidenceDigest !== objectiveQa.evidenceDigest ||
    reviewContext.sourceReviewHandoff.handoffDigest !== reviewHandoff.handoffDigest ||
    reviewEvidence.sourceObjectiveQa.evidenceDigest !== objectiveQa.evidenceDigest ||
    reviewEvidence.sourceReviewHandoff.handoffDigest !== reviewHandoff.handoffDigest ||
    reviewEvidence.sourceReviewContext.reviewContextDigest !== reviewContext.reviewContextDigest ||
    verifier.sourceAuthority.objectiveQaEvidenceDigest !== objectiveQa.evidenceDigest ||
    verifier.sourceAuthority.reviewHandoffDigest !== reviewHandoff.handoffDigest ||
    verifier.sourceAuthority.reviewContextDigest !== reviewContext.reviewContextDigest ||
    binding.sourceReviewEvidenceV1.reviewEvidenceDigest !== reviewEvidence.reviewEvidenceDigest ||
    binding.sourceAuthenticatedVerifierV1.verificationDigest !== verifier.verificationDigest ||
    binding.exactLineage.objectiveQaEvidenceDigest !== objectiveQa.evidenceDigest ||
    binding.exactLineage.reviewHandoffDigest !== reviewHandoff.handoffDigest ||
    binding.exactLineage.reviewContextDigest !== reviewContext.reviewContextDigest ||
    binding.exactLineage.candidatePrivateObjectIdentityHash !==
      objectiveQa.candidate.privateObjectIdentityHash ||
    binding.exactLineage.candidateSha256 !== objectiveQa.candidate.sha256 ||
    binding.exactLineage.candidateByteLength !== objectiveQa.candidate.byteLength ||
    binding.exactLineage.candidateDurationMilliseconds !==
      objectiveQa.candidate.durationMilliseconds
  ) blocked('Canonical audio candidate review source lineage changed after persistence.')
}

function assertExactWave(
  bytes: Buffer,
  expected: {
    sampleRateHertz: number
    channelCount: number
    durationMilliseconds: number
  },
) {
  let wave: ReturnType<typeof parseMotionStudioPcmWave>
  try {
    wave = parseMotionStudioPcmWave(bytes)
  } catch {
    blocked('Canonical audio candidate is not an exact PCM review artifact.')
  }
  if (
    wave.sampleRateHertz !== expected.sampleRateHertz ||
    wave.channelCount !== expected.channelCount || wave.bitsPerSample !== 16 ||
    wave.durationMilliseconds !== expected.durationMilliseconds
  ) blocked('Canonical audio candidate PCM facts changed after private review.')
  return wave
}

function assertProjectionScope(
  scope: CanonicalMotionStudioAudioCandidateReviewScope,
  projectionInput: CanonicalMotionStudioAudioCandidateReviewProjection,
): void {
  const projection = assertCanonicalMotionStudioAudioCandidateReviewProjection(projectionInput)
  if (
    projection.summary.productionId !== scope.productionId ||
    projection.summary.projectId !== scope.projectId ||
    projection.summary.editSessionId !== scope.editSessionId
  ) blocked('Canonical audio candidate projection changed exact named-edit scope.')
}

function assertLocatorScope(
  scope: CanonicalMotionStudioAudioCandidateReviewScope,
  locator: CanonicalMotionStudioAudioCandidateReviewLocator,
): void {
  if (
    locator.scope.workspaceId !== scope.workspaceId ||
    locator.scope.projectId !== scope.projectId ||
    locator.scope.editSessionId !== scope.editSessionId ||
    locator.scope.productionId !== scope.productionId
  ) blocked('Canonical audio candidate locator changed exact tenant or named-edit scope.')
}

function currentAuthorityReceiptBase(input: {
  scope: CanonicalMotionStudioAudioCandidateReviewScope
  currentRequestAuthority: MotionStudioProviderCandidateRequestAuthority
  receiptId: string
}) {
  return {
    domain: 'canonical_storytelling_audio_request_authority_read_v1',
    source: 'canonical_storytelling_audio_request_authority_store',
    receiptId: input.receiptId,
    scope: input.scope,
    currentRequestAuthority: input.currentRequestAuthority,
    exactCurrentAuthorityReverified: true,
    browserSuppliedAuthorityAccepted: false,
  }
}

function locatorUnsigned(
  value: Omit<CanonicalMotionStudioAudioCandidateReviewLocator, 'locatorDigest'> |
    CanonicalMotionStudioAudioCandidateReviewLocator,
) {
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.locatorDigest
  return unsigned
}

function candidateReferenceFor(bindingIdentity: string): string {
  return `ms012e-audio-candidate-${digest.parse(bindingIdentity).slice(0, 40)}`
}

function assertPrivateCandidateRoot(root: string): void {
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u
    .test(root)) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical audio candidate reader requires the exact bounded private-ingest root.',
      400,
    )
  }
}

function blocked(message: string): never {
  throw new ApiError(
    'MOTION_STUDIO_APPROVAL_BLOCKED',
    message,
    409,
    { requiredGate: 'canonical_audio_candidate_private_review_release' },
  )
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
