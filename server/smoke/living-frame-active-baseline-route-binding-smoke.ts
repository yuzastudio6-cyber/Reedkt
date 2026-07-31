import assert from 'node:assert/strict'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_FALLBACK_STEPS,
} from '../../src/types/living-frame'
import type {
  LivingFrameActiveBaselineCaseRouteInput,
} from '../../src/types/living-frame-active-baseline-route-binding'
import {
  compileLivingFrameActiveBaselineRouteBinding,
  verifyLivingFrameActiveBaselineRouteBinding,
  type CompileLivingFrameActiveBaselineRouteBindingInput,
} from '../living-frame/living-frame-active-baseline-route-binding'
import {
  compileLivingFrameActiveNonIllustrationAggregate,
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_PACKET_VERSION,
} from '../living-frame/living-frame-active-non-illustration-aggregate'
import {
  compileLivingFrameNonIllustrationReadinessAudit,
} from '../living-frame/living-frame-non-illustration-readiness-audit'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

const cloneMutable = <T>(value: T): DeepMutable<T> =>
  structuredClone(value) as DeepMutable<T>

const ownerScopeAmendment =
  compileLivingFrameOwnerScopeAmendment()
const readinessAudit =
  compileLivingFrameNonIllustrationReadinessAudit({
    ownerScopeAmendment,
  })
const aggregateManifest =
  compileLivingFrameActiveNonIllustrationAggregate({
    ownerScopeAmendment,
    readinessAudit,
    evidencePackets:
      LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.map(
        (caseId) => ({
          packetId: `living-frame.active-scope.${caseId}.v1`,
          packetVersion:
            LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_PACKET_VERSION,
          packetDigestSha256: sha256AuthorityValue({
            caseId,
            sourceOnly: true,
          }),
          canonicalRereadRequired: true,
          runtimeEvidenceIncluded: false,
          pausedEvidenceIncluded: false,
        }),
      ),
  })

const routeInputs = aggregateManifest.cases.map((manifestCase) =>
  routeInput(manifestCase.caseId, manifestCase.caseDigestSha256))

const baseInput: CompileLivingFrameActiveBaselineRouteBindingInput = {
  ownerScopeAmendment,
  aggregateManifest,
  routeInputs,
}
const binding =
  compileLivingFrameActiveBaselineRouteBinding(baseInput)

assert.equal(
  verifyLivingFrameActiveBaselineRouteBinding(binding, baseInput),
  true,
)
assert.equal(
  binding.contractVersion,
  'living-frame-active-baseline-route-binding-v1',
)
assert.equal(binding.activeCaseCount, 12)
assert.equal(binding.primaryRouteCaseCount, 10)
assert.equal(binding.approvedFallbackCaseCount, 2)
assert.equal(binding.baselineInternalExecutionCandidate, true)
assert.equal(binding.advancedTemporalMaskRouteOpenCaseCount, 2)
assert.equal(binding.advancedTemporalMaskCompletionClaimed, false)
assert.equal(
  binding.approvedFallbackMayCountAsAdvancedTemporalMaskEvidence,
  false,
)
assert.equal(binding.safeSpaceFallbackPreserved, true)
assert.equal(binding.aiVideoMaySolveMaskFailure, false)
assert.equal(
  binding.fallbackMayChangeMeaningCostOrScopeWithoutReview,
  false,
)
assert.deepEqual(
  binding.routes.map((route) => route.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.deepEqual(
  binding.routes
    .filter((route) =>
      route.routeDisposition === 'approved_fallback_candidate')
    .map((route) => [route.caseId, route.selectedFallbackStep]),
  [
    ['living_a_roll_compositing_case', 'safe_space_overlay'],
    [
      'camera_depth_occlusion_and_masks_case',
      'simplified_depth_composition',
    ],
  ],
)
assert.equal(
  binding.routes.every((route) =>
    route.baselineInternalExecutionCandidate
    && !route.advancedCapabilityProvenByFallback
    && !route.fallbackMaySatisfyAdvancedRouteCompletion
    && !route.canonicalWorkAdmissionGranted),
  true,
)
assert.equal(binding.operationRegistered, false)
assert.equal(binding.dispatchGranted, false)
assert.equal(binding.runtimeExecuted, false)
assert.equal(binding.artifactCreated, false)
assert.equal(binding.canonicalQaApproved, false)
assert.equal(binding.privateReviewApproved, false)
assert.equal(binding.customerCharged, false)
assert.equal(binding.publicDeliveryReady, false)
assert.equal(binding.productionReady, false)

const mutationChecks: Array<[
  string,
  (value: DeepMutable<typeof binding>) => void,
]> = [
  [
    'advanced temporal completion cannot be claimed',
    (value) => { value.advancedTemporalMaskCompletionClaimed = true as false },
  ],
  [
    'AI video cannot replace a failed mask',
    (value) => { value.aiVideoMaySolveMaskFailure = true as false },
  ],
  [
    'fallback cannot satisfy advanced evidence',
    (value) => {
      value.routes[0]!.fallbackMaySatisfyAdvancedRouteCompletion = true as false
    },
  ],
  [
    'canonical reread cannot be removed',
    (value) => { value.canonicalRereadPending = false as true },
  ],
  [
    'runtime cannot be promoted',
    (value) => { value.runtimeExecuted = true as false },
  ],
]
for (const [name, mutate] of mutationChecks) {
  const candidate = cloneMutable(binding)
  mutate(candidate)
  assert.equal(
    verifyLivingFrameActiveBaselineRouteBinding(candidate, baseInput),
    false,
    name,
  )
}

assert.throws(() => {
  const candidate = cloneMutable(baseInput)
  candidate.routeInputs[0]!.selectedFallbackStep = 'lower_visual_stage'
  candidate.routeInputs[0]!.fallbackEvaluations[2]!.state =
    'ineligible_before_selection'
  candidate.routeInputs[0]!.fallbackEvaluations[3]!.state = 'selected'
  candidate.routeInputs[0]!.fallbackEvaluations[3]!.reasonCode =
    'selected_as_first_safe_approved_fallback'
  compileLivingFrameActiveBaselineRouteBinding(candidate)
}, /skipped an eligible earlier step|ambiguous/u)

assert.throws(() => {
  const candidate = cloneMutable(baseInput)
  candidate.routeInputs[1]!.routeDisposition =
    'approved_fallback_candidate'
  candidate.routeInputs[1]!.primaryFailureCode =
    'temporal_mask_runtime_not_released'
  candidate.routeInputs[1]!.selectedFallbackStep = 'safe_space_overlay'
  candidate.routeInputs[1]!.fallbackEvaluations =
    fallbackEvaluations('safe_space_overlay')
  compileLivingFrameActiveBaselineRouteBinding(candidate)
}, /fallback case set drift/u)

assert.throws(() => {
  const candidate = cloneMutable(baseInput)
  candidate.routeInputs[0]!.selectedScene.refId = '../private/source.mp4'
  compileLivingFrameActiveBaselineRouteBinding(candidate)
}, /active case route/u)

assert.throws(() => {
  const candidate = cloneMutable(baseInput)
  candidate.routeInputs[0]!.fallbackLadderDigestSha256 =
    sha256AuthorityValue(['full_living_frame', 'captions_only'])
  compileLivingFrameActiveBaselineRouteBinding(candidate)
}, /active case route/u)

assert.throws(() => {
  const candidate = cloneMutable(baseInput)
  candidate.aggregateManifest.aggregateDigestSha256 = '0'.repeat(64)
  compileLivingFrameActiveBaselineRouteBinding(candidate)
}, /aggregate identity/u)

console.log(JSON.stringify({
  smoke: 'living_frame_active_baseline_route_binding',
  status: 'passed_source_only',
  checks: 31,
  activeCaseCount: binding.activeCaseCount,
  primaryRouteCaseCount: binding.primaryRouteCaseCount,
  approvedFallbackCaseCount: binding.approvedFallbackCaseCount,
  advancedTemporalMaskRouteOpenCaseCount:
    binding.advancedTemporalMaskRouteOpenCaseCount,
  bindingDigestSha256: binding.bindingDigestSha256,
  runtimeExecuted: binding.runtimeExecuted,
  productionReady: binding.productionReady,
}, null, 2))

function routeInput(
  caseId: typeof LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[number],
  manifestCaseDigestSha256: string,
): LivingFrameActiveBaselineCaseRouteInput {
  const fallback = caseId === 'living_a_roll_compositing_case'
    || caseId === 'camera_depth_occlusion_and_masks_case'
  const selectedFallbackStep =
    caseId === 'living_a_roll_compositing_case'
      ? 'safe_space_overlay'
      : caseId === 'camera_depth_occlusion_and_masks_case'
        ? 'simplified_depth_composition'
        : null
  return {
    caseId,
    manifestCaseDigestSha256,
    selectedScene: digestRef(`scene.${caseId}.v1`, 'living-frame-scene-plan-v1'),
    primaryRoute: digestRef(
      `route.${caseId}.primary.v1`,
      caseId === 'living_a_roll_compositing_case'
        || caseId === 'camera_depth_occlusion_and_masks_case'
        ? 'living-frame-temporal-mask-selected-scene-work-admission-candidate-v1'
        : 'living-frame-selected-scene-binding-v1',
    ),
    routeDisposition: fallback
      ? 'approved_fallback_candidate'
      : 'primary_route_candidate',
    primaryFailureCode: fallback
      ? 'temporal_mask_runtime_not_released'
      : null,
    fallbackLadder: LIVING_FRAME_FALLBACK_STEPS,
    fallbackLadderDigestSha256:
      sha256AuthorityValue(LIVING_FRAME_FALLBACK_STEPS),
    fallbackEvaluations: selectedFallbackStep === null
      ? LIVING_FRAME_FALLBACK_STEPS.map((step, order) => ({
          order,
          step,
          state: 'not_evaluated_after_selection' as const,
          reasonCode: 'not_evaluated_primary_route_selected' as const,
        }))
      : fallbackEvaluations(selectedFallbackStep),
    selectedFallbackStep,
    approvedPlanState:
      'selected_route_is_present_in_approved_scene_canonical_reread_pending',
  }
}

function fallbackEvaluations(
  selectedStep: 'safe_space_overlay' | 'simplified_depth_composition',
) {
  const selectedOrder = LIVING_FRAME_FALLBACK_STEPS.indexOf(selectedStep)
  return LIVING_FRAME_FALLBACK_STEPS.map((step, order) => ({
    order,
    step,
    state: order < selectedOrder
      ? 'ineligible_before_selection' as const
      : order === selectedOrder
        ? 'selected' as const
        : 'not_evaluated_after_selection' as const,
    reasonCode: order < selectedOrder
      ? order === 0
        ? 'primary_route_requires_unreleased_temporal_mask_runtime' as const
        : 'source_not_qualified_for_simplified_depth' as const
      : order === selectedOrder
        ? 'selected_as_first_safe_approved_fallback' as const
        : 'not_reached_after_safe_selection' as const,
  }))
}

function digestRef(refId: string, refVersion: string) {
  return {
    refId,
    refVersion,
    digestSha256: sha256AuthorityValue({ refId, refVersion }),
    canonicalRereadRequired: true as const,
  }
}
