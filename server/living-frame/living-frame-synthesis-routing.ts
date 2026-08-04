import type {
  LivingFrameCapabilityKey,
  LivingFrameComponentPlan,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_CAPABILITY_KEYS,
  LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
} from '../../src/types/living-frame'
import type {
  LivingFrameComponentSynthesisRoute,
  LivingFrameSynthesisBlockerCode,
  LivingFrameSynthesisReasonCode,
  LivingFrameSynthesisRoutingAuthorityBoundary,
  LivingFrameSynthesisRoutingMetrics,
  LivingFrameSynthesisRoutingPlan,
  LivingFrameSynthesisRoutingPlanDraft,
  LivingFrameSynthesisState,
  LivingFrameSynthesisStrategy,
} from '../../src/types/living-frame-synthesis-routing'
import {
  LIVING_FRAME_SYNTHESIS_BLOCKER_CODES,
  LIVING_FRAME_SYNTHESIS_REASON_CODES,
  LIVING_FRAME_SYNTHESIS_ROUTING_CLASS,
  LIVING_FRAME_SYNTHESIS_ROUTING_VERSION,
  LIVING_FRAME_SYNTHESIS_STATES,
  LIVING_FRAME_SYNTHESIS_STRATEGIES,
} from '../../src/types/living-frame-synthesis-routing'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import {
  verifyLivingFrameSemanticPlanProjection,
} from './living-frame-semantic-plan-projection'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,159}$/
const MAX_ROUTES = 512

const SYNTHESIS_LADDER = [
  'reuse_approved_asset_candidate',
  'deterministic_construction_candidate',
  'approved_still_generation_or_edit_candidate',
  'controlled_still_variation_candidate',
  'bounded_generated_video_last_resort_candidate',
  'simpler_visual_or_non_use_fallback',
] as const satisfies readonly LivingFrameSynthesisStrategy[]

const BASE_BLOCKERS = [
  'canonical_selected_scene_required',
  'current_component_artifact_evidence_required',
  'canonical_tool_strategy_projection_required',
  'canonical_estimate_and_approval_required',
] as const satisfies readonly LivingFrameSynthesisBlockerCode[]

const AUTHORITY_BOUNDARY:
  LivingFrameSynthesisRoutingAuthorityBoundary = Object.freeze({
    abstractStrategyPlanningOnly: true,
    selectedSceneAuthority: false,
    sourceAssetAuthority: false,
    continuityQaAuthority: false,
    exactFrameAuthority: false,
    masterTimingAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    modelWeightAuthority: false,
    workItemCreationAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    assetManifestMutationAuthority: false,
    artifactQaAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameSynthesisRoutingInput {
  readonly semanticPlanProjection:
    LivingFrameSemanticPlanProjection
}

export async function compileLivingFrameSynthesisRouting(
  input: CompileLivingFrameSynthesisRoutingInput,
): Promise<LivingFrameSynthesisRoutingPlan> {
  if (!isRecord(input) || !hasExactKeys(input, [
    'semanticPlanProjection',
  ])) {
    throw invalid('Living Frame synthesis input shape is invalid.')
  }
  if (!await verifyLivingFrameSemanticPlanProjection(
    input.semanticPlanProjection,
  )) {
    throw invalid(
      'Living Frame synthesis requires a valid semantic plan projection.',
    )
  }
  const projection = input.semanticPlanProjection
  const component = projection.projectedComponent
  const deliberateNonUse =
    component.decisionSummary.decision === 'non_use'
  const componentRoutes = deliberateNonUse
    ? []
    : component.scenePlans.flatMap((scene) =>
        [...scene.components]
          .sort((left, right) => left.order - right.order)
          .map((entry) => compileRoute({
            sceneId: scene.sceneId,
            sceneOrder: scene.order,
            component: entry,
          })))
      .sort(compareRouteOrder)
  if (componentRoutes.length > MAX_ROUTES) {
    throw invalid('Living Frame synthesis route count exceeds bounds.')
  }
  const routingState: LivingFrameSynthesisState =
    deliberateNonUse
      ? 'deliberate_non_use'
      : componentRoutes.every((route) =>
          route.primaryStrategy
            === 'simpler_visual_or_non_use_fallback')
        ? 'blocked_no_safe_route'
        : 'candidate_routes_compiled'
  const planBlockerCodes = deliberateNonUse
    ? []
    : uniqueSorted([
        ...BASE_BLOCKERS,
        ...componentRoutes.flatMap((route) =>
          route.blockerCodes),
      ])
  const draft: LivingFrameSynthesisRoutingPlanDraft = {
    contractVersion: LIVING_FRAME_SYNTHESIS_ROUTING_VERSION,
    routingClass: LIVING_FRAME_SYNTHESIS_ROUTING_CLASS,
    routingState,
    sourceBindings: {
      semanticPlanProjectionDigestSha256:
        projection.projectionDigestSha256,
      projectedComponentDigestSha256:
        component.contractDigestSha256,
    },
    componentRoutes,
    planBlockerCodes,
    metrics: deriveMetrics(componentRoutes),
    authorityBoundary: AUTHORITY_BOUNDARY,
    synthesisLadderOrder: SYNTHESIS_LADDER,
    generatedVideoDefaultAllowed: false,
    containsProviderModelToolWorkQueueCostOrCommercialRoute: false,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
    promotionAllowed: false,
  }
  return {
    ...draft,
    routingDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameSynthesisRoutingDigest(
  value: unknown,
): value is LivingFrameSynthesisRoutingPlan {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'routingClass',
      'routingState',
      'sourceBindings',
      'componentRoutes',
      'planBlockerCodes',
      'metrics',
      'authorityBoundary',
      'synthesisLadderOrder',
      'generatedVideoDefaultAllowed',
      'containsProviderModelToolWorkQueueCostOrCommercialRoute',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsExecutableCodeOrCommands',
      'subjectSpecificRouting',
      'promotionAllowed',
      'routingDigestSha256',
    ])) return false
    const plan =
      value as unknown as LivingFrameSynthesisRoutingPlan
    const { routingDigestSha256, ...draft } = plan
    if (
      !SHA256.test(routingDigestSha256)
      || routingDigestSha256 !== sha256AuthorityValue(draft)
      || plan.contractVersion
        !== LIVING_FRAME_SYNTHESIS_ROUTING_VERSION
      || plan.routingClass
        !== LIVING_FRAME_SYNTHESIS_ROUTING_CLASS
      || !(LIVING_FRAME_SYNTHESIS_STATES as readonly string[])
        .includes(plan.routingState)
      || !validateSourceBindings(plan.sourceBindings)
      || !validateRoutes(plan.componentRoutes)
      || !validateBlockers(plan.planBlockerCodes)
      || !validateAuthorityBoundary(plan.authorityBoundary)
      || stableAuthorityStringify(plan.synthesisLadderOrder)
        !== stableAuthorityStringify(SYNTHESIS_LADDER)
      || plan.generatedVideoDefaultAllowed !== false
      || plan
        .containsProviderModelToolWorkQueueCostOrCommercialRoute
        !== false
      || plan
        .containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || plan.containsExecutableCodeOrCommands !== false
      || plan.subjectSpecificRouting !== false
      || plan.promotionAllowed !== false
      || stableAuthorityStringify(plan.metrics)
        !== stableAuthorityStringify(
          deriveMetrics(plan.componentRoutes),
        )
    ) return false
    if (plan.routingState === 'deliberate_non_use') {
      return plan.componentRoutes.length === 0
        && plan.planBlockerCodes.length === 0
    }
    if (
      plan.componentRoutes.length === 0
      || !BASE_BLOCKERS.every((code) =>
        plan.planBlockerCodes.includes(code))
    ) return false
    if (
      stableAuthorityStringify(plan.planBlockerCodes)
      !== stableAuthorityStringify(uniqueSorted([
        ...BASE_BLOCKERS,
        ...plan.componentRoutes.flatMap((route) =>
          route.blockerCodes),
      ]))
    ) return false
    return plan.routingState ===
      (plan.componentRoutes.every((route) =>
        route.primaryStrategy
          === 'simpler_visual_or_non_use_fallback')
        ? 'blocked_no_safe_route'
        : 'candidate_routes_compiled')
  } catch {
    return false
  }
}

function compileRoute(input: {
  sceneId: string
  sceneOrder: number
  component: LivingFrameComponentPlan
}): LivingFrameComponentSynthesisRoute {
  const { component } = input
  const capabilities =
    uniqueSorted(component.capabilityKeys)
  const exactDeterministic =
    component.provenanceExpectation
      === 'exact_map_data_expectation'
    || capabilities.includes('exact_map_rendering')
    || capabilities.includes('exact_data_graphics')
  const deterministic =
    exactDeterministic
    || component.provenanceExpectation
      === 'deterministic_draw_expectation'
    || capabilities.includes('deterministic_vector_drawing')
    || capabilities.includes('deterministic_particle_effects')
  const approvedReuse =
    component.provenanceExpectation
      === 'approved_source_asset_expectation'
    || component.provenanceExpectation
      === 'source_a_roll_expectation'
    || component.role === 'source_a_roll'
    || component.role === 'source_still'
    || component.role === 'opaque_background_plate'
  const generatedStill =
    component.provenanceExpectation
      === 'generated_illustration_expectation'
    || capabilities.includes('still_image_generation_or_edit')
  const controlledStill =
    capabilities.includes('reference_conditioned_illustration')
    || capabilities.includes('structure_conditioned_illustration')
  const identityConditioned =
    capabilities.includes('identity_conditioned_illustration')
  const adapterRequired =
    capabilities.includes('low_rank_adapter_training_or_loading')
  const boundedVideo =
    capabilities.includes('bounded_video_asset_generation')
  const fixtureOnly =
    component.provenanceExpectation === 'controlled_fixture_only'
  const primary = primaryStrategy({
    approvedReuse,
    deterministic,
    generatedStill,
    controlledStill,
    boundedVideo,
    identityConditioned,
    adapterRequired,
    fixtureOnly,
  })
  const blockerCodes = blockers({
    component,
    exactDeterministic,
    generatedStill,
    controlledStill,
    identityConditioned,
    adapterRequired,
    boundedVideo,
    primary,
  })
  return {
    sceneId: input.sceneId,
    sceneOrder: input.sceneOrder,
    componentId: component.componentId,
    componentOrder: component.order,
    primaryStrategy: primary,
    orderedFallbackStrategies: fallbacks({
      primary,
      approvedReuse,
      deterministic,
      generatedStill,
      controlledStill,
      boundedVideo: boundedVideo && !exactDeterministic,
      blocked: identityConditioned || adapterRequired || fixtureOnly,
    }),
    reasonCode: reasonCode(primary),
    capabilityKeys: capabilities,
    transparencyExpectation:
      component.transparencyExpectation,
    blockerCodes,
    generatedVideoIsLastResort: true,
    providerOrToolIdentitySelected: false,
  }
}

function primaryStrategy(input: {
  approvedReuse: boolean
  deterministic: boolean
  generatedStill: boolean
  controlledStill: boolean
  boundedVideo: boolean
  identityConditioned: boolean
  adapterRequired: boolean
  fixtureOnly: boolean
}): LivingFrameSynthesisStrategy {
  if (
    input.identityConditioned
    || input.adapterRequired
    || input.fixtureOnly
  ) return 'simpler_visual_or_non_use_fallback'
  if (input.approvedReuse) {
    return 'reuse_approved_asset_candidate'
  }
  if (input.deterministic) {
    return 'deterministic_construction_candidate'
  }
  if (input.generatedStill) {
    return 'approved_still_generation_or_edit_candidate'
  }
  if (input.controlledStill) {
    return 'controlled_still_variation_candidate'
  }
  if (input.boundedVideo) {
    return 'bounded_generated_video_last_resort_candidate'
  }
  return 'simpler_visual_or_non_use_fallback'
}

function fallbacks(input: {
  primary: LivingFrameSynthesisStrategy
  approvedReuse: boolean
  deterministic: boolean
  generatedStill: boolean
  controlledStill: boolean
  boundedVideo: boolean
  blocked: boolean
}): LivingFrameSynthesisStrategy[] {
  if (input.blocked) {
    return ['simpler_visual_or_non_use_fallback']
  }
  const available = [
    input.approvedReuse
      ? 'reuse_approved_asset_candidate'
      : null,
    input.deterministic
      ? 'deterministic_construction_candidate'
      : null,
    input.generatedStill
      ? 'approved_still_generation_or_edit_candidate'
      : null,
    input.controlledStill
      ? 'controlled_still_variation_candidate'
      : null,
    input.boundedVideo
      ? 'bounded_generated_video_last_resort_candidate'
      : null,
    'simpler_visual_or_non_use_fallback',
  ].filter((entry): entry is LivingFrameSynthesisStrategy =>
    entry !== null)
  return available.filter((entry) => entry !== input.primary)
}

function reasonCode(
  primary: LivingFrameSynthesisStrategy,
): LivingFrameSynthesisReasonCode {
  if (primary === 'reuse_approved_asset_candidate') {
    return 'approved_source_reuse_preferred'
  }
  if (primary === 'deterministic_construction_candidate') {
    return 'exact_deterministic_construction_required'
  }
  if (
    primary
      === 'approved_still_generation_or_edit_candidate'
  ) return 'generated_illustration_anchor_required'
  if (primary === 'controlled_still_variation_candidate') {
    return 'continuity_conditioned_still_candidate_required'
  }
  if (
    primary
      === 'bounded_generated_video_last_resort_candidate'
  ) {
    return 'organic_motion_not_reproducible_deterministically'
  }
  return 'unsafe_or_unqualified_route_requires_simpler_visual'
}

function blockers(input: {
  component: LivingFrameComponentPlan
  exactDeterministic: boolean
  generatedStill: boolean
  controlledStill: boolean
  identityConditioned: boolean
  adapterRequired: boolean
  boundedVideo: boolean
  primary: LivingFrameSynthesisStrategy
}): LivingFrameSynthesisBlockerCode[] {
  const result: LivingFrameSynthesisBlockerCode[] = []
  if (
    input.component.continuityRefIds.length > 0
    || input.controlledStill
  ) {
    result.push(
      'current_visual_continuity_revalidation_required',
    )
  }
  if (
    input.generatedStill
    || input.controlledStill
    || input.boundedVideo
  ) {
    result.push(
      'canonical_provider_route_qualification_required',
    )
  }
  if (
    input.component.transparencyExpectation
      === 'still_alpha_required'
    || input.component.transparencyExpectation
      === 'native_alpha_preferred'
  ) result.push('alpha_artifact_and_qa_required')
  if (
    input.component.transparencyExpectation
      === 'temporal_mask_required'
  ) result.push('temporal_mask_artifact_and_qa_required')
  if (input.identityConditioned) {
    result.push('identity_conditioned_route_safety_blocked')
  }
  if (input.adapterRequired) {
    result.push(
      'model_weight_or_adapter_qualification_required',
    )
  }
  if (input.boundedVideo) {
    result.push('bounded_video_justification_required')
  }
  if (input.exactDeterministic) {
    result.push('exact_map_or_data_must_remain_deterministic')
  }
  if (
    input.primary === 'simpler_visual_or_non_use_fallback'
  ) result.push('no_safe_synthesis_route')
  return uniqueSorted(result)
}

function validateRoutes(
  routes: readonly LivingFrameComponentSynthesisRoute[],
): boolean {
  if (!Array.isArray(routes) || routes.length > MAX_ROUTES) {
    return false
  }
  const ids = new Set<string>()
  let previous: LivingFrameComponentSynthesisRoute | undefined
  for (const route of routes) {
    const rawRoute: unknown = route
    if (!isRecord(rawRoute) || !hasExactKeys(rawRoute, [
      'sceneId',
      'sceneOrder',
      'componentId',
      'componentOrder',
      'primaryStrategy',
      'orderedFallbackStrategies',
      'reasonCode',
      'capabilityKeys',
      'transparencyExpectation',
      'blockerCodes',
      'generatedVideoIsLastResort',
      'providerOrToolIdentitySelected',
    ])) return false
    if (
      !SAFE_ID.test(route.sceneId)
      || !SAFE_ID.test(route.componentId)
      || !isOrder(route.sceneOrder)
      || !isOrder(route.componentOrder)
      || !(LIVING_FRAME_SYNTHESIS_STRATEGIES as readonly string[])
        .includes(route.primaryStrategy)
      || !(LIVING_FRAME_SYNTHESIS_REASON_CODES as readonly string[])
        .includes(route.reasonCode)
      || !(LIVING_FRAME_TRANSPARENCY_EXPECTATIONS as readonly string[])
        .includes(route.transparencyExpectation)
      || !validateCapabilities(route.capabilityKeys)
      || !validateBlockers(route.blockerCodes)
      || !validateFallbacks(route)
      || route.generatedVideoIsLastResort !== true
      || route.providerOrToolIdentitySelected !== false
    ) return false
    const key = `${route.sceneId}\u0000${route.componentId}`
    if (ids.has(key)) return false
    ids.add(key)
    if (previous && compareRouteOrder(previous, route) >= 0) {
      return false
    }
    previous = route
    if (
      route.capabilityKeys.includes('exact_map_rendering')
      || route.capabilityKeys.includes('exact_data_graphics')
    ) {
      if (
        route.primaryStrategy
          !== 'deterministic_construction_candidate'
        || route.orderedFallbackStrategies.includes(
          'bounded_generated_video_last_resort_candidate',
        )
        || !route.blockerCodes.includes(
          'exact_map_or_data_must_remain_deterministic',
        )
      ) return false
    }
    if (
      route.primaryStrategy
        === 'bounded_generated_video_last_resort_candidate'
      && !route.capabilityKeys.includes(
        'bounded_video_asset_generation',
      )
    ) return false
  }
  return true
}

function validateFallbacks(
  route: LivingFrameComponentSynthesisRoute,
): boolean {
  if (
    route.primaryStrategy
      === 'simpler_visual_or_non_use_fallback'
  ) {
    return stableAuthorityStringify(
      route.orderedFallbackStrategies,
    ) === stableAuthorityStringify([
      'simpler_visual_or_non_use_fallback',
    ])
  }
  if (
    !Array.isArray(route.orderedFallbackStrategies)
    || route.orderedFallbackStrategies.length < 1
    || route.orderedFallbackStrategies.length
      > SYNTHESIS_LADDER.length
    || new Set(route.orderedFallbackStrategies).size
      !== route.orderedFallbackStrategies.length
    || route.orderedFallbackStrategies.includes(
      route.primaryStrategy,
    )
    || route.orderedFallbackStrategies.at(-1)
      !== 'simpler_visual_or_non_use_fallback'
  ) return false
  let previousIndex = -1
  for (const strategy of route.orderedFallbackStrategies) {
    const index = SYNTHESIS_LADDER.indexOf(strategy)
    if (index < 0 || index <= previousIndex) return false
    previousIndex = index
  }
  const videoIndex = route.orderedFallbackStrategies.indexOf(
    'bounded_generated_video_last_resort_candidate',
  )
  if (
    videoIndex >= 0
    && videoIndex
      !== route.orderedFallbackStrategies.length - 2
  ) return false
  return true
}

function validateCapabilities(
  values: readonly LivingFrameCapabilityKey[],
): boolean {
  return Array.isArray(values)
    && values.length <= LIVING_FRAME_CAPABILITY_KEYS.length
    && new Set(values).size === values.length
    && values.every((value) =>
      (LIVING_FRAME_CAPABILITY_KEYS as readonly string[])
        .includes(value))
    && stableAuthorityStringify(values)
      === stableAuthorityStringify([...values].sort())
}

function validateBlockers(
  values: readonly LivingFrameSynthesisBlockerCode[],
): boolean {
  return Array.isArray(values)
    && values.length <= LIVING_FRAME_SYNTHESIS_BLOCKER_CODES.length
    && new Set(values).size === values.length
    && values.every((value) =>
      (LIVING_FRAME_SYNTHESIS_BLOCKER_CODES as readonly string[])
        .includes(value))
    && stableAuthorityStringify(values)
      === stableAuthorityStringify([...values].sort())
}

function validateSourceBindings(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, [
    'semanticPlanProjectionDigestSha256',
    'projectedComponentDigestSha256',
  ])
    && SHA256.test(
      String(value.semanticPlanProjectionDigestSha256),
    )
    && SHA256.test(
      String(value.projectedComponentDigestSha256),
    )
    && value.semanticPlanProjectionDigestSha256
      !== value.projectedComponentDigestSha256
}

function validateAuthorityBoundary(
  value: unknown,
): boolean {
  return stableAuthorityStringify(value)
    === stableAuthorityStringify(AUTHORITY_BOUNDARY)
}

function deriveMetrics(
  routes: readonly LivingFrameComponentSynthesisRoute[],
): LivingFrameSynthesisRoutingMetrics {
  const primaryCount = (strategy: LivingFrameSynthesisStrategy) =>
    routes.filter((route) =>
      route.primaryStrategy === strategy).length
  return {
    sceneCount: new Set(routes.map((route) => route.sceneId)).size,
    componentCount: routes.length,
    reuseCandidateCount:
      primaryCount('reuse_approved_asset_candidate'),
    deterministicCandidateCount:
      primaryCount('deterministic_construction_candidate'),
    stillGenerationCandidateCount:
      primaryCount(
        'approved_still_generation_or_edit_candidate',
      ),
    controlledStillVariationCandidateCount:
      primaryCount('controlled_still_variation_candidate'),
    boundedVideoLastResortCandidateCount:
      primaryCount(
        'bounded_generated_video_last_resort_candidate',
      ),
    simplerFallbackCount:
      primaryCount('simpler_visual_or_non_use_fallback'),
  }
}

function compareRouteOrder(
  left: LivingFrameComponentSynthesisRoute,
  right: LivingFrameComponentSynthesisRoute,
): number {
  return left.sceneOrder - right.sceneOrder
    || left.componentOrder - right.componentOrder
    || left.sceneId.localeCompare(right.sceneId)
    || left.componentId.localeCompare(right.componentId)
}

function uniqueSorted<T extends string>(
  values: readonly T[],
): T[] {
  return [...new Set(values)].sort()
}

function isOrder(value: unknown): value is number {
  return Number.isInteger(value)
    && Number(value) >= 0
    && Number(value) <= 10_000
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return stableAuthorityStringify(Object.keys(value).sort())
    === stableAuthorityStringify([...keys].sort())
}

function invalid(message: string): Error {
  return new Error(message)
}
