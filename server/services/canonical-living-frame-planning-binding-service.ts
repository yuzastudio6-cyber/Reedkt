import type { CanonicalPlanComponentsInput } from '../validation/edit-planning-authority-schemas'
import type { LivingFrameProfessionalSkillComponent } from '../../src/types/living-frame'
import {
  canonicalLivingFramePlanningBindingSchema,
} from '../validation/canonical-living-frame-planning-binding-schemas'
import { ApiError } from '../errors/api-error'
import {
  livingFrameFutureAdaptiveStrategyExpectation,
  livingFrameFutureVideoUnderstandingExpectation,
  livingFrameOutputFrameDigestProjection,
  validateLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export async function revalidateCanonicalLivingFramePlanningBinding(input: {
  readonly components: CanonicalPlanComponentsInput
}): Promise<LivingFrameProfessionalSkillComponent | undefined> {
  const livingFrame = input.components.livingFrame
  if (livingFrame === undefined) return undefined

  const parsed = canonicalLivingFramePlanningBindingSchema.safeParse(livingFrame)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical Living Frame planning binding is invalid.',
      409,
      parsed.error.flatten(),
    )
  }
  const contractValidation =
    await validateLivingFrameProfessionalSkillComponent(parsed.data)
  if (!contractValidation.ok) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical Living Frame contract digest is invalid.',
      409,
      {
        issues: contractValidation.issues.map((issue) => ({
          code: issue.code,
          path: issue.path,
        })),
      },
    )
  }

  const component = contractValidation.component
  const bindings = component.inputBindings
  const expectedSegmentBindings = input.components.segments.map(
    (segment, order) => ({
      segmentExpectationId: `living-frame.segment.${order + 1}`,
      order,
      sourceSegmentRef: {
        expectationRefId: `canonical.segment.${order + 1}`,
        expectedDigestSha256: sha256AuthorityValue(segment),
        evidenceClass: 'controlled_unverified_evidence' as const,
      },
      outputFrameExpectationRefId: 'canonical.output-frame',
      masterTimingExpectationRefId: 'canonical.master-timing',
    }),
  )
  const frame = input.components.confirmedSettings.outputFrame
  const [aspectRatioNumerator, aspectRatioDenominator] = reduceRatio(
    frame.width,
    frame.height,
  )
  const expectedBindings = {
    compiledIntent: {
      expectationRefId: 'canonical.compiled-intent',
      expectedDigestSha256: sha256AuthorityValue(
        input.components.compiledIntent,
      ),
      evidenceClass: 'controlled_unverified_evidence' as const,
    },
    sourceSequence: {
      expectationRefId: 'canonical.source-sequence',
      expectedDigestSha256: sha256AuthorityValue(
        input.components.sourceSequence,
      ),
      evidenceClass: 'controlled_unverified_evidence' as const,
    },
    videoUnderstanding: {
      expectationRefId: 'canonical.video-understanding.future',
      expectedDigestSha256: sha256AuthorityValue(
        livingFrameFutureVideoUnderstandingExpectation(),
      ),
      evidenceClass: 'future_worker_evidence_required' as const,
    },
    adaptiveStrategy: {
      expectationRefId: 'canonical.adaptive-strategy.future',
      expectedDigestSha256: sha256AuthorityValue(
        livingFrameFutureAdaptiveStrategyExpectation(),
      ),
      evidenceClass: 'future_worker_evidence_required' as const,
    },
    outputFrame: {
      expectationRefId: 'canonical.output-frame',
      expectedDigestSha256: sha256AuthorityValue(
        livingFrameOutputFrameDigestProjection(input.components),
      ),
      evidenceClass: 'controlled_unverified_evidence' as const,
      confirmationStatus: 'expected_confirmed' as const,
      expectedWidth: frame.width,
      expectedHeight: frame.height,
      expectedAspectRatioNumerator: aspectRatioNumerator,
      expectedAspectRatioDenominator: aspectRatioDenominator,
      liveAuthorityVerified: false as const,
    },
    masterTiming: {
      expectationRefId: 'canonical.master-timing',
      expectedDigestSha256: sha256AuthorityValue(
        input.components.masterTimingPlan,
      ),
      evidenceClass: 'controlled_unverified_evidence' as const,
      bindingStatus: 'expected_current' as const,
      exactFrameAuthorityProvided: false as const,
      liveAuthorityVerified: false as const,
    },
    safeZoneRefs: [],
    faceProtectionRefs: [],
    gestureProtectionRefs: [],
    factSafetyRefs: [],
    characterSafetyRefs: [],
    segmentExpectations: expectedSegmentBindings,
  }
  if (
    stableAuthorityStringify(bindings) !==
      stableAuthorityStringify(expectedBindings)
    || component.authorityBoundary.planningOnly !== true
    || component.authorityBoundary.executable !== false
    || component.authorityBoundary.timingAuthority !== false
    || component.authorityBoundary.soundAuthority !== false
    || component.authorityBoundary.estimateAuthority !== false
    || component.authorityBoundary.approvalAuthority !== false
    || component.authorityBoundary.runtimeAuthority !== false
    || component.authorityBoundary.queueAuthority !== false
    || component.authorityBoundary.providerAuthority !== false
    || component.authorityBoundary.toolRouteAuthority !== false
    || component.authorityBoundary.costAuthority !== false
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical Living Frame source or authority expectations are stale.',
      409,
      { requiredGate: 'canonical_living_frame_source_revalidation' },
    )
  }
  return component
}

function reduceRatio(numerator: number, denominator: number): [number, number] {
  let left = numerator
  let right = denominator
  while (right !== 0) {
    const remainder = left % right
    left = right
    right = remainder
  }
  return [numerator / left, denominator / left]
}
