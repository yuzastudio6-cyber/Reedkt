import type {
  LivingFrameComponentPlan,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_CAPABILITY_KEYS,
  LIVING_FRAME_COMPONENT_ROLES,
  LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
} from '../../src/types/living-frame'
import type {
  LivingFrameComponentAssetBlockerCode,
  LivingFrameComponentAssetIntent,
  LivingFrameComponentAssetIntentAuthorityBoundary,
  LivingFrameComponentAssetIntentBundle,
  LivingFrameComponentAssetIntentBundleDraft,
  LivingFrameComponentAssetIntentMetrics,
  LivingFrameComponentAssetIntentState,
} from '../../src/types/living-frame-component-asset-intent'
import {
  LIVING_FRAME_COMPONENT_ASSET_BLOCKER_CODES,
  LIVING_FRAME_COMPONENT_ASSET_INTENT_CLASS,
  LIVING_FRAME_COMPONENT_ASSET_INTENT_STATES,
  LIVING_FRAME_COMPONENT_ASSET_INTENT_VERSION,
  LIVING_FRAME_COMPONENT_ASSET_KINDS,
  LIVING_FRAME_COMPONENT_ASSET_STAGES,
} from '../../src/types/living-frame-component-asset-intent'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import type {
  LivingFrameComponentSynthesisRoute,
  LivingFrameSynthesisRoutingPlan,
} from '../../src/types/living-frame-synthesis-routing'
import type {
  LivingFrameWorkAdmissionCatalog,
} from '../../src/types/living-frame-work-admission'
import type {
  EditWorkItemType,
} from '../../src/types/editing-agent-runtime'
import {
  verifyLivingFrameSemanticPlanProjection,
} from './living-frame-semantic-plan-projection'
import {
  verifyLivingFrameSynthesisRoutingDigest,
} from './living-frame-synthesis-routing'
import {
  verifyLivingFrameWorkAdmissionCatalog,
} from './living-frame-work-admission'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

type NamedWorkItemType = Exclude<EditWorkItemType, 'custom'>

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,199}$/
const MAX_INTENTS = 1_024

const BASE_BLOCKERS = [
  'canonical_selected_scene_required',
  'canonical_synthesis_route_revalidation_required',
  'canonical_work_item_projection_required',
  'canonical_asset_manifest_projection_required',
  'canonical_estimate_and_approval_required',
  'canonical_artifact_qa_required',
] as const satisfies readonly LivingFrameComponentAssetBlockerCode[]

const AUTHORITY_BOUNDARY:
  LivingFrameComponentAssetIntentAuthorityBoundary =
  Object.freeze({
    abstractAssetIntentPlanningOnly: true,
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

export interface CompileLivingFrameComponentAssetIntentInput {
  readonly semanticPlanProjection:
    LivingFrameSemanticPlanProjection
  readonly synthesisRouting: LivingFrameSynthesisRoutingPlan
  readonly workAdmissionCatalog: LivingFrameWorkAdmissionCatalog
}

export async function compileLivingFrameComponentAssetIntents(
  input: CompileLivingFrameComponentAssetIntentInput,
): Promise<LivingFrameComponentAssetIntentBundle> {
  await assertInput(input)
  const projection = input.semanticPlanProjection
  const components = new Map(
    projection.projectedComponent.scenePlans.flatMap((scene) =>
      scene.components.map((component) => [
        routeKey(scene.sceneId, component.componentId),
        component,
      ] as const)),
  )
  const workTypes = admittedWorkTypes(input.workAdmissionCatalog)
  const blockedComponentIds: string[] = []
  const assetIntents: LivingFrameComponentAssetIntent[] = []
  let order = 0
  for (const route of input.synthesisRouting.componentRoutes) {
    const component = components.get(
      routeKey(route.sceneId, route.componentId),
    )
    if (!component) {
      throw invalid(
        'Living Frame synthesis route has no projected component.',
      )
    }
    const compiled = compileComponentIntents({
      route,
      component,
      firstOrder: order,
    })
    if (compiled.blocked) {
      blockedComponentIds.push(route.componentId)
    }
    for (const intent of compiled.intents) {
      assertExpectedWorkTypes(intent, workTypes)
      assetIntents.push(intent)
    }
    order += compiled.intents.length
  }
  if (assetIntents.length > MAX_INTENTS) {
    throw invalid('Living Frame asset-intent count exceeds bounds.')
  }
  const deliberateNonUse =
    input.synthesisRouting.routingState === 'deliberate_non_use'
  const intentState: LivingFrameComponentAssetIntentState =
    deliberateNonUse
      ? 'deliberate_non_use'
      : blockedComponentIds.length > 0
        ? 'blocked_by_unsafe_or_unavailable_asset_route'
        : 'candidate_intents_compiled'
  const blockerCodes = deliberateNonUse
    ? []
    : deriveBlockers(
        assetIntents,
        input.synthesisRouting.componentRoutes,
        blockedComponentIds,
      )
  const draft: LivingFrameComponentAssetIntentBundleDraft = {
    contractVersion:
      LIVING_FRAME_COMPONENT_ASSET_INTENT_VERSION,
    intentClass: LIVING_FRAME_COMPONENT_ASSET_INTENT_CLASS,
    intentState,
    sourceBindings: {
      semanticPlanProjectionDigestSha256:
        projection.projectionDigestSha256,
      projectedComponentDigestSha256:
        projection.projectedComponent.contractDigestSha256,
      synthesisRoutingDigestSha256:
        input.synthesisRouting.routingDigestSha256,
      workAdmissionCatalogDigestSha256:
        input.workAdmissionCatalog.catalogDigestSha256,
    },
    assetIntents,
    blockedComponentIds: uniqueSorted(blockedComponentIds),
    blockerCodes,
    metrics: deriveMetrics(
      assetIntents,
      blockedComponentIds,
    ),
    authorityBoundary: AUTHORITY_BOUNDARY,
    existingAssetManifestRemainsAuthority: true,
    existingExecutionPlannerRemainsAuthority: true,
    customWorkItemAllowed: false,
    createsAssetManifestEntries: false,
    createsWorkItems: false,
    containsProviderModelToolOperationJobQueueCostOrCommercialRoute:
      false,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
      false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
    promotionAllowed: false,
  }
  return {
    ...draft,
    bundleDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameComponentAssetIntentBundle(
  value: unknown,
): value is LivingFrameComponentAssetIntentBundle {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'intentClass',
      'intentState',
      'sourceBindings',
      'assetIntents',
      'blockedComponentIds',
      'blockerCodes',
      'metrics',
      'authorityBoundary',
      'existingAssetManifestRemainsAuthority',
      'existingExecutionPlannerRemainsAuthority',
      'customWorkItemAllowed',
      'createsAssetManifestEntries',
      'createsWorkItems',
      'containsProviderModelToolOperationJobQueueCostOrCommercialRoute',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsExecutableCodeOrCommands',
      'subjectSpecificRouting',
      'promotionAllowed',
      'bundleDigestSha256',
    ])) return false
    const bundle =
      value as unknown as LivingFrameComponentAssetIntentBundle
    const { bundleDigestSha256, ...draft } = bundle
    if (
      !SHA256.test(bundleDigestSha256)
      || bundleDigestSha256 !== sha256AuthorityValue(draft)
      || bundle.contractVersion
        !== LIVING_FRAME_COMPONENT_ASSET_INTENT_VERSION
      || bundle.intentClass
        !== LIVING_FRAME_COMPONENT_ASSET_INTENT_CLASS
      || !LIVING_FRAME_COMPONENT_ASSET_INTENT_STATES.some(
        (state) => state === bundle.intentState,
      )
      || !validateSourceBindings(bundle.sourceBindings)
      || !validateIntents(bundle.assetIntents)
      || !validateStringSet(bundle.blockedComponentIds)
      || !validateBlockerSet(bundle.blockerCodes)
      || !validateAuthorityBoundary(bundle.authorityBoundary)
      || bundle.existingAssetManifestRemainsAuthority !== true
      || bundle.existingExecutionPlannerRemainsAuthority !== true
      || bundle.customWorkItemAllowed !== false
      || bundle.createsAssetManifestEntries !== false
      || bundle.createsWorkItems !== false
      || bundle
        .containsProviderModelToolOperationJobQueueCostOrCommercialRoute
        !== false
      || bundle
        .containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || bundle.containsExecutableCodeOrCommands !== false
      || bundle.subjectSpecificRouting !== false
      || bundle.promotionAllowed !== false
      || stableAuthorityStringify(bundle.metrics)
        !== stableAuthorityStringify(deriveMetrics(
          bundle.assetIntents,
          bundle.blockedComponentIds,
        ))
    ) return false
    if (bundle.intentState === 'deliberate_non_use') {
      return bundle.assetIntents.length === 0
        && bundle.blockedComponentIds.length === 0
        && bundle.blockerCodes.length === 0
    }
    return (
      bundle.assetIntents.length > 0
      || bundle.blockedComponentIds.length > 0
    )
      && BASE_BLOCKERS.every((code) =>
        bundle.blockerCodes.includes(code))
      && bundle.intentState === (
        bundle.blockedComponentIds.length > 0
          ? 'blocked_by_unsafe_or_unavailable_asset_route'
          : 'candidate_intents_compiled'
      )
  } catch {
    return false
  }
}

async function assertInput(
  input: CompileLivingFrameComponentAssetIntentInput,
): Promise<void> {
  if (!isRecord(input) || !hasExactKeys(input, [
    'semanticPlanProjection',
    'synthesisRouting',
    'workAdmissionCatalog',
  ])) throw invalid(
    'Living Frame component asset-intent input shape is invalid.',
  )
  if (!await verifyLivingFrameSemanticPlanProjection(
    input.semanticPlanProjection,
  )) throw invalid('Living Frame semantic projection is invalid.')
  if (!verifyLivingFrameSynthesisRoutingDigest(
    input.synthesisRouting,
  )) throw invalid('Living Frame synthesis routing is invalid.')
  if (!verifyLivingFrameWorkAdmissionCatalog(
    input.workAdmissionCatalog,
  )) throw invalid('Living Frame work-admission catalog is invalid.')
  if (
    input.synthesisRouting.sourceBindings
      .semanticPlanProjectionDigestSha256
      !== input.semanticPlanProjection.projectionDigestSha256
    || input.synthesisRouting.sourceBindings
      .projectedComponentDigestSha256
      !== input.semanticPlanProjection.projectedComponent
        .contractDigestSha256
    || (
      input.synthesisRouting.routingState === 'deliberate_non_use'
    ) !== (
      input.semanticPlanProjection.projectedComponent
        .decisionSummary.decision === 'non_use'
    )
  ) throw invalid(
    'Living Frame asset-intent source lineage is inconsistent.',
  )
  const componentKeys = new Set(
    input.semanticPlanProjection.projectedComponent.scenePlans
      .flatMap((scene) => scene.components.map((component) =>
        routeKey(scene.sceneId, component.componentId))),
  )
  const routeKeys = new Set(
    input.synthesisRouting.componentRoutes.map((route) =>
      routeKey(route.sceneId, route.componentId)),
  )
  if (
    stableAuthorityStringify([...componentKeys].sort())
    !== stableAuthorityStringify([...routeKeys].sort())
  ) throw invalid(
    'Living Frame synthesis routes do not cover projected components.',
  )
}

function compileComponentIntents(input: {
  route: LivingFrameComponentSynthesisRoute
  component: LivingFrameComponentPlan
  firstOrder: number
}): {
  intents: LivingFrameComponentAssetIntent[]
  blocked: boolean
} {
  const { route, component } = input
  if (
    route.primaryStrategy
      === 'simpler_visual_or_non_use_fallback'
  ) return { intents: [], blocked: true }
  if (
    route.primaryStrategy
      === 'bounded_generated_video_last_resort_candidate'
    && (
      component.transparencyExpectation
        === 'still_alpha_required'
      || component.transparencyExpectation
        === 'native_alpha_preferred'
    )
  ) return { intents: [], blocked: true }
  if (component.role === 'reconstructed_background_plate') {
    return {
      intents: [intent({
        route,
        component,
        order: input.firstOrder,
        stage: 'reconstructed_plate',
        assetKind: 'reconstructed_background_plate_png',
        dependencies: [],
        work: ['reconstruct_background_plate'],
      })],
      blocked: false,
    }
  }
  const intents: LivingFrameComponentAssetIntent[] = []
  const source = compilePrimaryIntent({
    route,
    component,
    order: input.firstOrder,
  })
  intents.push(source)
  const needsStillAlpha =
    component.transparencyExpectation === 'still_alpha_required'
    || component.transparencyExpectation === 'native_alpha_preferred'
  if (needsStillAlpha && !isDeterministicKind(source.assetKind)) {
    const mask = intent({
      route,
      component,
      order: input.firstOrder + intents.length,
      stage: 'alpha_or_mask_companion',
      assetKind: 'still_alpha_mask',
      dependencies: [source.assetIntentId],
      work: ['generate_mask_asset'],
    })
    intents.push(mask)
    intents.push(intent({
      route,
      component,
      order: input.firstOrder + intents.length,
      stage: 'processed_component',
      assetKind: 'processed_rgba_still_component',
      dependencies: [source.assetIntentId, mask.assetIntentId],
      work: ['process_image_asset'],
    }))
  } else if (
    component.transparencyExpectation === 'temporal_mask_required'
  ) {
    intents.push(intent({
      route,
      component,
      order: input.firstOrder + intents.length,
      stage: 'alpha_or_mask_companion',
      assetKind: 'temporal_subject_mask_sequence',
      dependencies: [source.assetIntentId],
      work: ['generate_mask_asset'],
    }))
  }
  return { intents, blocked: false }
}

function compilePrimaryIntent(input: {
  route: LivingFrameComponentSynthesisRoute
  component: LivingFrameComponentPlan
  order: number
}): LivingFrameComponentAssetIntent {
  const { route, component } = input
  if (route.primaryStrategy === 'reuse_approved_asset_candidate') {
    return intent({
      route,
      component,
      order: input.order,
      stage: 'source_or_generated_anchor',
      assetKind: 'approved_source_asset_reference',
      dependencies: [],
      work: [],
    })
  }
  if (
    route.primaryStrategy
      === 'deterministic_construction_candidate'
  ) {
    if (component.capabilityKeys.includes('exact_map_rendering')) {
      return intent({
        route,
        component,
        order: input.order,
        stage: 'deterministic_component',
        assetKind: 'exact_map_spec',
        dependencies: [],
        work: ['render_map_asset'],
      })
    }
    if (component.capabilityKeys.includes('exact_data_graphics')) {
      return intent({
        route,
        component,
        order: input.order,
        stage: 'deterministic_component',
        assetKind: 'exact_data_graphic_spec',
        dependencies: [],
        work: ['render_chart_asset'],
      })
    }
    return intent({
      route,
      component,
      order: input.order,
      stage: 'deterministic_component',
      assetKind: 'procedural_graphic_spec',
      dependencies: [],
      work: ['prepare_remotion_layer'],
    })
  }
  if (
    route.primaryStrategy
      === 'approved_still_generation_or_edit_candidate'
  ) return intent({
    route,
    component,
    order: input.order,
    stage: 'source_or_generated_anchor',
    assetKind: 'generated_opaque_still_source',
    dependencies: [],
    work: ['generate_image_asset'],
  })
  if (
    route.primaryStrategy
      === 'controlled_still_variation_candidate'
  ) return intent({
    route,
    component,
    order: input.order,
    stage: 'source_or_generated_anchor',
    assetKind: 'controlled_opaque_still_variation_source',
    dependencies: [],
    work: ['generate_image_asset'],
  })
  return intent({
    route,
    component,
    order: input.order,
    stage: 'source_or_generated_anchor',
    assetKind: 'bounded_generated_video_clip',
    dependencies: [],
    work: ['generate_ai_video_asset'],
  })
}

function intent(input: {
  route: LivingFrameComponentSynthesisRoute
  component: LivingFrameComponentPlan
  order: number
  stage: LivingFrameComponentAssetIntent['stage']
  assetKind: LivingFrameComponentAssetIntent['assetKind']
  dependencies: readonly string[]
  work: readonly NamedWorkItemType[]
}): LivingFrameComponentAssetIntent {
  return {
    assetIntentId: `asset-intent.${
      sha256AuthorityValue({
        sceneId: input.route.sceneId,
        componentId: input.component.componentId,
        stage: input.stage,
        assetKind: input.assetKind,
      }).slice(0, 40)
    }`,
    order: input.order,
    sceneId: input.route.sceneId,
    componentId: input.component.componentId,
    componentRole: input.component.role,
    stage: input.stage,
    assetKind: input.assetKind,
    dependencyAssetIntentIds: [...input.dependencies],
    capabilityKeys: uniqueSorted(input.component.capabilityKeys),
    expectedNamedWorkItemTypes: uniqueSorted(input.work),
    transparencyExpectation:
      input.component.transparencyExpectation,
    required: true,
    placeholderAllowedForPreviewOnly:
      input.assetKind !== 'approved_source_asset_reference',
    finalRenderMayUsePlaceholder: false,
    canonicalAssetIdAssigned: false,
    canonicalWorkItemIdAssigned: false,
  }
}

function deriveBlockers(
  intents: readonly LivingFrameComponentAssetIntent[],
  routes: readonly LivingFrameComponentSynthesisRoute[],
  blockedComponentIds: readonly string[],
): LivingFrameComponentAssetBlockerCode[] {
  const blockers: LivingFrameComponentAssetBlockerCode[] = [
    ...BASE_BLOCKERS,
  ]
  if (intents.some((entry) =>
    entry.expectedNamedWorkItemTypes.some((type) =>
      type === 'generate_image_asset'
      || type === 'generate_ai_video_asset'
      || type === 'generate_mask_asset'
      || type === 'process_image_asset'
      || type === 'reconstruct_background_plate'))) {
    blockers.push('canonical_tool_or_provider_route_required')
  }
  if (intents.some((entry) =>
    entry.assetKind === 'approved_source_asset_reference')) {
    blockers.push('source_asset_lineage_required')
  }
  if (routes.some((route) =>
    route.blockerCodes.includes(
      'current_visual_continuity_revalidation_required',
    ))) blockers.push('visual_continuity_revalidation_required')
  if (intents.some((entry) =>
    entry.assetKind === 'still_alpha_mask'
    || entry.assetKind === 'processed_rgba_still_component')) {
    blockers.push('still_alpha_generation_and_qa_required')
  }
  if (intents.some((entry) =>
    entry.assetKind === 'temporal_subject_mask_sequence')) {
    blockers.push('temporal_mask_generation_and_qa_required')
  }
  if (intents.some((entry) =>
    entry.assetKind === 'reconstructed_background_plate_png')) {
    blockers.push('reconstructed_plate_dependencies_required')
  }
  if (routes.some((route) =>
    route.primaryStrategy
      === 'bounded_generated_video_last_resort_candidate'
    && (
      route.transparencyExpectation === 'still_alpha_required'
      || route.transparencyExpectation === 'native_alpha_preferred'
    ))) {
    blockers.push('bounded_video_with_still_alpha_is_unsupported')
  }
  if (routes.some((route) =>
    route.blockerCodes.includes(
      'identity_conditioned_route_safety_blocked',
    )
    || route.blockerCodes.includes(
      'model_weight_or_adapter_qualification_required',
    ))) blockers.push('unsafe_identity_or_adapter_route_blocked')
  if (blockedComponentIds.length > 0) {
    blockers.push('no_safe_asset_intent')
  }
  return uniqueSorted(blockers)
}

function admittedWorkTypes(
  catalog: LivingFrameWorkAdmissionCatalog,
): Set<NamedWorkItemType> {
  return new Set(
    [...catalog.capabilityCoverage, ...catalog.miniSkillCoverage]
      .flatMap((entry) => entry.existingNamedWorkItemTypes),
  )
}

function assertExpectedWorkTypes(
  intentEntry: LivingFrameComponentAssetIntent,
  admitted: ReadonlySet<NamedWorkItemType>,
): void {
  if (intentEntry.expectedNamedWorkItemTypes.some((type) =>
    !admitted.has(type)
    || String(type) === 'custom')) {
    throw invalid(
      'Living Frame asset intent references an unadmitted work type.',
    )
  }
}

function validateIntents(
  intents: readonly LivingFrameComponentAssetIntent[],
): boolean {
  if (!Array.isArray(intents) || intents.length > MAX_INTENTS) {
    return false
  }
  const earlier = new Map<string, LivingFrameComponentAssetIntent>()
  for (const [index, intentEntry] of intents.entries()) {
    const raw: unknown = intentEntry
    if (!isRecord(raw) || !hasExactKeys(raw, [
      'assetIntentId',
      'order',
      'sceneId',
      'componentId',
      'componentRole',
      'stage',
      'assetKind',
      'dependencyAssetIntentIds',
      'capabilityKeys',
      'expectedNamedWorkItemTypes',
      'transparencyExpectation',
      'required',
      'placeholderAllowedForPreviewOnly',
      'finalRenderMayUsePlaceholder',
      'canonicalAssetIdAssigned',
      'canonicalWorkItemIdAssigned',
    ])) return false
    if (
      !SAFE_ID.test(intentEntry.assetIntentId)
      || !SAFE_ID.test(intentEntry.sceneId)
      || !SAFE_ID.test(intentEntry.componentId)
      || intentEntry.order !== index
      || !(LIVING_FRAME_COMPONENT_ROLES as readonly string[])
        .includes(intentEntry.componentRole)
      || !(LIVING_FRAME_COMPONENT_ASSET_STAGES as readonly string[])
        .includes(intentEntry.stage)
      || !(LIVING_FRAME_COMPONENT_ASSET_KINDS as readonly string[])
        .includes(intentEntry.assetKind)
      || !LIVING_FRAME_TRANSPARENCY_EXPECTATIONS.some(
        (expectation) =>
          expectation === intentEntry.transparencyExpectation,
      )
      || !validateClosedSet(
        intentEntry.capabilityKeys,
        LIVING_FRAME_CAPABILITY_KEYS,
      )
      || !validateWorkTypes(
        intentEntry.expectedNamedWorkItemTypes,
      )
      || !validateDependencyIds(
        intentEntry.dependencyAssetIntentIds,
        new Set(earlier.keys()),
      )
      || !validateIntentSemantics(intentEntry, earlier)
      || intentEntry.required !== true
      || typeof intentEntry.placeholderAllowedForPreviewOnly
        !== 'boolean'
      || intentEntry.finalRenderMayUsePlaceholder !== false
      || intentEntry.canonicalAssetIdAssigned !== false
      || intentEntry.canonicalWorkItemIdAssigned !== false
      || earlier.has(intentEntry.assetIntentId)
    ) return false
    earlier.set(intentEntry.assetIntentId, intentEntry)
  }
  return true
}

function validateIntentSemantics(
  intentEntry: LivingFrameComponentAssetIntent,
  earlier: ReadonlyMap<string, LivingFrameComponentAssetIntent>,
): boolean {
  const expected = expectedIntentSemantics(intentEntry.assetKind)
  if (
    intentEntry.stage !== expected.stage
    || stableAuthorityStringify(
      intentEntry.expectedNamedWorkItemTypes,
    ) !== stableAuthorityStringify(expected.work)
    || intentEntry.placeholderAllowedForPreviewOnly
      !== expected.placeholderAllowedForPreviewOnly
    || intentEntry.dependencyAssetIntentIds.length
      !== expected.dependencyCount
  ) return false
  const dependencies = intentEntry.dependencyAssetIntentIds
    .map((id) => earlier.get(id))
  if (dependencies.some((dependency) => !dependency)) return false
  if (
    intentEntry.assetKind === 'still_alpha_mask'
    || intentEntry.assetKind
      === 'temporal_subject_mask_sequence'
  ) {
    return dependencies[0]?.stage
      === 'source_or_generated_anchor'
  }
  if (
    intentEntry.assetKind
      === 'processed_rgba_still_component'
  ) {
    const dependencyKinds = uniqueSorted(
      dependencies.map((dependency) => dependency!.assetKind),
    )
    return stableAuthorityStringify(dependencyKinds)
      === stableAuthorityStringify([
        'approved_source_asset_reference',
        'still_alpha_mask',
      ])
      || stableAuthorityStringify(dependencyKinds)
        === stableAuthorityStringify([
          'generated_opaque_still_source',
          'still_alpha_mask',
        ])
      || stableAuthorityStringify(dependencyKinds)
        === stableAuthorityStringify([
          'controlled_opaque_still_variation_source',
          'still_alpha_mask',
        ])
  }
  return dependencies.length === 0
}

function expectedIntentSemantics(
  kind: LivingFrameComponentAssetIntent['assetKind'],
): {
  stage: LivingFrameComponentAssetIntent['stage']
  work: readonly NamedWorkItemType[]
  dependencyCount: number
  placeholderAllowedForPreviewOnly: boolean
} {
  switch (kind) {
    case 'approved_source_asset_reference':
      return {
        stage: 'source_or_generated_anchor',
        work: [],
        dependencyCount: 0,
        placeholderAllowedForPreviewOnly: false,
      }
    case 'generated_opaque_still_source':
    case 'controlled_opaque_still_variation_source':
      return {
        stage: 'source_or_generated_anchor',
        work: ['generate_image_asset'],
        dependencyCount: 0,
        placeholderAllowedForPreviewOnly: true,
      }
    case 'bounded_generated_video_clip':
      return {
        stage: 'source_or_generated_anchor',
        work: ['generate_ai_video_asset'],
        dependencyCount: 0,
        placeholderAllowedForPreviewOnly: true,
      }
    case 'still_alpha_mask':
    case 'temporal_subject_mask_sequence':
      return {
        stage: 'alpha_or_mask_companion',
        work: ['generate_mask_asset'],
        dependencyCount: 1,
        placeholderAllowedForPreviewOnly: true,
      }
    case 'processed_rgba_still_component':
      return {
        stage: 'processed_component',
        work: ['process_image_asset'],
        dependencyCount: 2,
        placeholderAllowedForPreviewOnly: true,
      }
    case 'procedural_graphic_spec':
      return {
        stage: 'deterministic_component',
        work: ['prepare_remotion_layer'],
        dependencyCount: 0,
        placeholderAllowedForPreviewOnly: true,
      }
    case 'exact_map_spec':
      return {
        stage: 'deterministic_component',
        work: ['render_map_asset'],
        dependencyCount: 0,
        placeholderAllowedForPreviewOnly: true,
      }
    case 'exact_data_graphic_spec':
      return {
        stage: 'deterministic_component',
        work: ['render_chart_asset'],
        dependencyCount: 0,
        placeholderAllowedForPreviewOnly: true,
      }
    case 'reconstructed_background_plate_png':
      return {
        stage: 'reconstructed_plate',
        work: ['reconstruct_background_plate'],
        dependencyCount: 0,
        placeholderAllowedForPreviewOnly: true,
      }
  }
}

function validateDependencyIds(
  dependencies: readonly string[],
  earlierIds: ReadonlySet<string>,
): boolean {
  return Array.isArray(dependencies)
    && dependencies.length <= 8
    && new Set(dependencies).size === dependencies.length
    && dependencies.every((id) =>
      SAFE_ID.test(id) && earlierIds.has(id))
}

function validateWorkTypes(
  values: readonly NamedWorkItemType[],
): boolean {
  return Array.isArray(values)
    && values.length <= 8
    && new Set(values).size === values.length
    && !(values as readonly string[]).includes('custom')
    && stableAuthorityStringify(values)
      === stableAuthorityStringify([...values].sort())
}

function validateSourceBindings(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, [
    'semanticPlanProjectionDigestSha256',
    'projectedComponentDigestSha256',
    'synthesisRoutingDigestSha256',
    'workAdmissionCatalogDigestSha256',
  ]) && Object.values(value).every((entry) =>
    typeof entry === 'string' && SHA256.test(entry))
}

function validateBlockerSet(value: unknown): boolean {
  return validateClosedSet(
    value,
    LIVING_FRAME_COMPONENT_ASSET_BLOCKER_CODES,
  )
}

function validateClosedSet<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T[] {
  return Array.isArray(value)
    && value.length <= allowed.length
    && new Set(value).size === value.length
    && value.every((entry) =>
      typeof entry === 'string' && allowed.includes(entry as T))
    && stableAuthorityStringify(value)
      === stableAuthorityStringify([...value].sort())
}

function validateStringSet(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= MAX_INTENTS
    && new Set(value).size === value.length
    && value.every((entry) =>
      typeof entry === 'string' && SAFE_ID.test(entry))
    && stableAuthorityStringify(value)
      === stableAuthorityStringify([...value].sort())
}

function validateAuthorityBoundary(value: unknown): boolean {
  return stableAuthorityStringify(value)
    === stableAuthorityStringify(AUTHORITY_BOUNDARY)
}

function deriveMetrics(
  intents: readonly LivingFrameComponentAssetIntent[],
  blockedComponentIds: readonly string[],
): LivingFrameComponentAssetIntentMetrics {
  return {
    sceneCount: new Set(intents.map((entry) => entry.sceneId)).size,
    componentCount:
      new Set(intents.map((entry) =>
        routeKey(entry.sceneId, entry.componentId))).size
      + blockedComponentIds.length,
    assetIntentCount: intents.length,
    reusedSourceIntentCount: countKind(
      intents,
      'approved_source_asset_reference',
    ),
    generatedStillSourceIntentCount:
      countKind(intents, 'generated_opaque_still_source')
      + countKind(
        intents,
        'controlled_opaque_still_variation_source',
      ),
    deterministicIntentCount:
      countKind(intents, 'procedural_graphic_spec')
      + countKind(intents, 'exact_map_spec')
      + countKind(intents, 'exact_data_graphic_spec'),
    alphaOrMaskIntentCount:
      countKind(intents, 'still_alpha_mask')
      + countKind(intents, 'temporal_subject_mask_sequence'),
    processedRgbaIntentCount:
      countKind(intents, 'processed_rgba_still_component'),
    boundedVideoIntentCount:
      countKind(intents, 'bounded_generated_video_clip'),
    reconstructedPlateIntentCount:
      countKind(
        intents,
        'reconstructed_background_plate_png',
      ),
    blockedComponentCount: blockedComponentIds.length,
  }
}

function countKind(
  intents: readonly LivingFrameComponentAssetIntent[],
  kind: LivingFrameComponentAssetIntent['assetKind'],
): number {
  return intents.filter((entry) => entry.assetKind === kind).length
}

function isDeterministicKind(
  kind: LivingFrameComponentAssetIntent['assetKind'],
): boolean {
  return kind === 'procedural_graphic_spec'
    || kind === 'exact_map_spec'
    || kind === 'exact_data_graphic_spec'
}

function routeKey(sceneId: string, componentId: string): string {
  return `${sceneId}\u0000${componentId}`
}

function uniqueSorted<T extends string>(
  values: readonly T[],
): T[] {
  return [...new Set(values)].sort()
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
