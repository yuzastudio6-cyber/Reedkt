import {
  LIVING_FRAME_ACTIVE_BASELINE_ROUTE_BINDING_CLASS,
  LIVING_FRAME_ACTIVE_BASELINE_ROUTE_BINDING_VERSION,
  type LivingFrameActiveBaselineCaseRoute,
  type LivingFrameActiveBaselineCaseRouteInput,
  type LivingFrameActiveBaselineFallbackEvaluation,
  type LivingFrameActiveBaselineRouteBinding,
  type LivingFrameActiveBaselineRouteBindingDraft,
} from '../../src/types/living-frame-active-baseline-route-binding'
import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
  type LivingFrameActiveNonIllustrationAggregate,
  type LivingFrameActiveNonIllustrationCaseId,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import {
  LIVING_FRAME_FALLBACK_STEPS,
  type LivingFrameFallbackStep,
} from '../../src/types/living-frame'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

const BASELINE_FALLBACK_CASE_IDS = [
  'living_a_roll_compositing_case',
  'camera_depth_occlusion_and_masks_case',
] as const satisfies readonly LivingFrameActiveNonIllustrationCaseId[]

const TEMPORAL_MASK_ROUTE_VERSION =
  'living-frame-temporal-mask-selected-scene-work-admission-candidate-v1'
const PRIMARY_SELECTED_SCENE_ROUTE_VERSION =
  'living-frame-selected-scene-binding-v1'

const PERMITTED_FALLBACKS = {
  living_a_roll_compositing_case: [
    'safe_space_overlay',
    'lower_visual_stage',
    'side_by_side',
    'static_card',
    'captions_only',
    'no_extra_visual',
  ],
  camera_depth_occlusion_and_masks_case: [
    'simplified_depth_composition',
    'safe_space_overlay',
    'lower_visual_stage',
    'side_by_side',
    'full_illustrated_scene',
    'static_card',
    'captions_only',
    'no_extra_visual',
  ],
} as const satisfies Record<
  typeof BASELINE_FALLBACK_CASE_IDS[number],
  readonly LivingFrameFallbackStep[]
>

export interface CompileLivingFrameActiveBaselineRouteBindingInput {
  readonly ownerScopeAmendment: LivingFrameOwnerScopeAmendment
  readonly aggregateManifest: LivingFrameActiveNonIllustrationAggregate
  readonly routeInputs: readonly LivingFrameActiveBaselineCaseRouteInput[]
}

export function compileLivingFrameActiveBaselineRouteBinding(
  input: CompileLivingFrameActiveBaselineRouteBindingInput,
): LivingFrameActiveBaselineRouteBinding {
  assertInput(input)
  const routes = input.routeInputs.map((routeInput, order) =>
    compileRoute(routeInput, order))
  const draft: LivingFrameActiveBaselineRouteBindingDraft = {
    contractVersion: LIVING_FRAME_ACTIVE_BASELINE_ROUTE_BINDING_VERSION,
    bindingClass: LIVING_FRAME_ACTIVE_BASELINE_ROUTE_BINDING_CLASS,
    bindingState:
      'twelve_case_baseline_candidate_complete_advanced_temporal_mask_gate_preserved',
    ownerScopeAmendmentVersion:
      input.ownerScopeAmendment.contractVersion,
    ownerScopeAmendmentDigestSha256:
      input.ownerScopeAmendment.amendmentDigestSha256,
    aggregateManifestVersion: input.aggregateManifest.contractVersion,
    aggregateManifestDigestSha256:
      input.aggregateManifest.aggregateDigestSha256,
    routes,
    activeCaseCount: 12,
    primaryRouteCaseCount: 10,
    approvedFallbackCaseCount: 2,
    baselineInternalExecutionCandidate: true,
    advancedTemporalMaskRouteOpenCaseCount: 2,
    advancedTemporalMaskCompletionClaimed: false,
    approvedFallbackMayCountAsAdvancedTemporalMaskEvidence: false,
    safeSpaceFallbackPreserved: true,
    aiVideoMaySolveMaskFailure: false,
    fallbackMayChangeMeaningCostOrScopeWithoutReview: false,
    canonicalRereadPending: true,
    createsPlannerWorkAssetTimingRendererQaOrReviewOwner: false,
    containsRawChatTranscriptCaptionAudioMediaBytesPathsUrlsPromptsCredentialsCommandsOrEnvironment:
      false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    artifactCreated: false,
    canonicalQaApproved: false,
    privateReviewApproved: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    routeSetDigestSha256: sha256AuthorityValue(
      routes.map((route) => route.routeDigestSha256),
    ),
    bindingDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameActiveBaselineRouteBinding(
  value: unknown,
  input: CompileLivingFrameActiveBaselineRouteBindingInput,
): value is LivingFrameActiveBaselineRouteBinding {
  if (
    !isRecord(value)
    || typeof value.bindingDigestSha256 !== 'string'
    || !SHA256.test(value.bindingDigestSha256)
  ) return false
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameActiveBaselineRouteBinding(input),
      )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameActiveBaselineRouteBindingInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'ownerScopeAmendment',
      'aggregateManifest',
      'routeInputs',
    ])
    || !verifyLivingFrameOwnerScopeAmendment(input.ownerScopeAmendment)
  ) {
    throw new Error('Invalid Living Frame active baseline route input.')
  }
  assertAggregateIdentity(input)
  if (
    !Array.isArray(input.routeInputs)
    || input.routeInputs.length !==
      LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.length
    || !sameStrings(
      input.routeInputs.map((route) => route.caseId),
      LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
    )
    || !sameStrings(
      input.aggregateManifest.cases.map((entry) => entry.caseId),
      LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
    )
  ) throw new Error('Invalid Living Frame active baseline route input.')
  const fallbackIds = input.routeInputs
    .filter((route) => route.routeDisposition === 'approved_fallback_candidate')
    .map((route) => route.caseId)
  if (!sameStrings(fallbackIds, BASELINE_FALLBACK_CASE_IDS)) {
    throw new Error('Living Frame baseline fallback case set drift.')
  }
  input.routeInputs.forEach((route, order) => {
    const manifestCase = input.aggregateManifest.cases[order]!
    if (route.manifestCaseDigestSha256 !== manifestCase.caseDigestSha256) {
      throw new Error('Living Frame baseline manifest-case lineage mismatch.')
    }
    assertRouteInput(route)
  })
}

function assertAggregateIdentity(
  input: CompileLivingFrameActiveBaselineRouteBindingInput,
): void {
  const {
    aggregateDigestSha256,
    ...aggregateDraft
  } = input.aggregateManifest
  if (
    !isRecord(input.aggregateManifest)
    || input.aggregateManifest.contractVersion !==
      'living-frame-active-non-illustration-aggregate-v1'
    || input.aggregateManifest.ownerScopeAmendmentDigestSha256 !==
      input.ownerScopeAmendment.amendmentDigestSha256
    || input.aggregateManifest.activeCaseCount !== 12
    || input.aggregateManifest.runtimeExecuted !== false
    || input.aggregateManifest.activePrivateInternalReady !== false
    || !SHA256.test(aggregateDigestSha256)
    || aggregateDigestSha256 !== sha256AuthorityValue(aggregateDraft)
  ) throw new Error('Invalid Living Frame active aggregate identity.')
}

function assertRouteInput(
  route: LivingFrameActiveBaselineCaseRouteInput,
): void {
  if (
    !isRecord(route)
    || !hasExactKeys(route, [
      'caseId',
      'manifestCaseDigestSha256',
      'selectedScene',
      'primaryRoute',
      'routeDisposition',
      'primaryFailureCode',
      'fallbackLadder',
      'fallbackLadderDigestSha256',
      'fallbackEvaluations',
      'selectedFallbackStep',
      'approvedPlanState',
    ])
    || !LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.includes(route.caseId)
    || !SHA256.test(route.manifestCaseDigestSha256)
    || !validRef(route.selectedScene)
    || !validRef(route.primaryRoute)
    || route.selectedScene.refVersion !== 'living-frame-scene-plan-v1'
    || route.primaryRoute.refVersion !== (
      isBaselineFallbackCaseId(route.caseId)
        ? TEMPORAL_MASK_ROUTE_VERSION
        : PRIMARY_SELECTED_SCENE_ROUTE_VERSION
    )
    || route.approvedPlanState !==
      'selected_route_is_present_in_approved_scene_canonical_reread_pending'
    || !Array.isArray(route.fallbackLadder)
    || route.fallbackLadder.length < 2
    || new Set(route.fallbackLadder).size !== route.fallbackLadder.length
    || route.fallbackLadder[0] !== 'full_living_frame'
    || route.fallbackLadder.some((step) =>
      !LIVING_FRAME_FALLBACK_STEPS.includes(step))
    || !SHA256.test(route.fallbackLadderDigestSha256)
    || route.fallbackLadderDigestSha256 !==
      sha256AuthorityValue(route.fallbackLadder)
    || !Array.isArray(route.fallbackEvaluations)
    || route.fallbackEvaluations.length !== route.fallbackLadder.length
  ) throw new Error('Invalid Living Frame active case route.')
  route.fallbackEvaluations.forEach((entry, order) =>
    assertEvaluation(entry, route.fallbackLadder[order]!, order))
  if (route.routeDisposition === 'primary_route_candidate') {
    if (
      route.primaryFailureCode !== null
      || route.selectedFallbackStep !== null
      || route.fallbackEvaluations.some((entry) =>
        entry.state !== 'not_evaluated_after_selection'
        || entry.reasonCode !== 'not_evaluated_primary_route_selected')
    ) throw new Error('Invalid Living Frame primary route candidate.')
    return
  }
  if (
    !isBaselineFallbackCaseId(route.caseId)
    || route.primaryFailureCode === null
    || route.selectedFallbackStep === null
    || !PERMITTED_FALLBACKS[route.caseId]
      .includes(route.selectedFallbackStep as never)
  ) throw new Error('Invalid Living Frame approved fallback candidate.')
  const selected = route.fallbackEvaluations.filter((entry) =>
    entry.state === 'selected')
  if (
    selected.length !== 1
    || selected[0]!.step !== route.selectedFallbackStep
    || selected[0]!.reasonCode !==
      'selected_as_first_safe_approved_fallback'
  ) throw new Error('Living Frame fallback selection is ambiguous.')
  const selectedOrder = selected[0]!.order
  route.fallbackEvaluations.forEach((entry) => {
    if (
      entry.order < selectedOrder
      && (
        entry.state !== 'ineligible_before_selection'
        || ![
          'primary_route_requires_unreleased_temporal_mask_runtime',
          'source_not_qualified_for_simplified_depth',
        ].includes(entry.reasonCode)
      )
    ) throw new Error('Living Frame fallback skipped an eligible earlier step.')
    if (
      entry.order > selectedOrder
      && (
        entry.state !== 'not_evaluated_after_selection'
        || entry.reasonCode !== 'not_reached_after_safe_selection'
      )
    ) throw new Error('Living Frame fallback continued after safe selection.')
  })
}

function compileRoute(
  input: LivingFrameActiveBaselineCaseRouteInput,
  order: number,
): LivingFrameActiveBaselineCaseRoute {
  const draft = {
    ...structuredClone(input),
    order,
    baselineInternalExecutionCandidate: true as const,
    advancedCapabilityProvenByFallback: false as const,
    fallbackMaySatisfyAdvancedRouteCompletion: false as const,
    canonicalWorkAdmissionGranted: false as const,
  }
  return deepFreeze({
    ...draft,
    routeDigestSha256: sha256AuthorityValue(draft),
  })
}

function assertEvaluation(
  value: LivingFrameActiveBaselineFallbackEvaluation,
  expectedStep: LivingFrameFallbackStep,
  order: number,
): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, ['order', 'step', 'state', 'reasonCode'])
    || value.order !== order
    || value.step !== expectedStep
    || ![
      'ineligible_before_selection',
      'selected',
      'not_evaluated_after_selection',
    ].includes(value.state)
    || ![
      'primary_route_requires_unreleased_temporal_mask_runtime',
      'source_not_qualified_for_simplified_depth',
      'selected_as_first_safe_approved_fallback',
      'not_evaluated_primary_route_selected',
      'not_reached_after_safe_selection',
    ].includes(value.reasonCode)
  ) throw new Error('Invalid Living Frame fallback evaluation.')
}

function isBaselineFallbackCaseId(
  value: LivingFrameActiveNonIllustrationCaseId,
): value is typeof BASELINE_FALLBACK_CASE_IDS[number] {
  return BASELINE_FALLBACK_CASE_IDS.includes(value as never)
}

function validRef(value: unknown): value is {
  refId: string
  refVersion: string
  digestSha256: string
  canonicalRereadRequired: true
} {
  return isRecord(value)
    && hasExactKeys(value, [
      'refId',
      'refVersion',
      'digestSha256',
      'canonicalRereadRequired',
    ])
    && typeof value.refId === 'string'
    && SAFE_ID.test(value.refId)
    && typeof value.refVersion === 'string'
    && SAFE_ID.test(value.refVersion)
    && typeof value.digestSha256 === 'string'
    && SHA256.test(value.digestSha256)
    && value.canonicalRereadRequired === true
}

function sameStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index])
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return sameStrings(actual, expected)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value as Record<string, unknown>).forEach((entry) =>
      deepFreeze(entry))
  }
  return value
}
