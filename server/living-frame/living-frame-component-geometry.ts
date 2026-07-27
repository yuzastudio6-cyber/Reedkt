import { createHash } from 'node:crypto'

import type {
  LivingFrameComponentRole,
  LivingFrameDepthBand,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS,
  LIVING_FRAME_COMPONENT_ROLES,
  LIVING_FRAME_DEPTH_BANDS,
  LIVING_FRAME_FOCAL_ROLES,
  LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
} from '../../src/types/living-frame'
import type {
  LivingFrameCompiledGeometryComponent,
  LivingFrameComponentGeometryAuthorityBoundary,
  LivingFrameComponentGeometryBundle,
  LivingFrameComponentGeometryBundleDraft,
  LivingFrameGeometryComponentDraft,
  LivingFrameGeometryMetrics,
  LivingFrameGeometryMotionBinding,
  LivingFrameGeometryOcclusionExpectation,
  LivingFrameGeometryOutputFrameExpectation,
  LivingFrameGeometrySafeRegion,
  LivingFrameNormalizedPoint,
  LivingFrameNormalizedRect,
} from '../../src/types/living-frame-component-geometry'
import {
  LIVING_FRAME_COMPONENT_GEOMETRY_CLASS,
  LIVING_FRAME_COMPONENT_GEOMETRY_PROFILE,
  LIVING_FRAME_COMPONENT_GEOMETRY_VERSION,
  LIVING_FRAME_GEOMETRY_COLLISION_POLICIES,
  LIVING_FRAME_GEOMETRY_COMPONENT_KINDS,
  LIVING_FRAME_GEOMETRY_MASK_EXPECTATIONS,
  LIVING_FRAME_GEOMETRY_OCCLUSION_KINDS,
  LIVING_FRAME_GEOMETRY_SAFE_REGION_KINDS,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameDeterministicMotionBundle,
} from '../../src/types/living-frame-deterministic-motion'
import {
  verifyLivingFrameDeterministicMotionBundleDigest,
} from './living-frame-deterministic-motion'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SAFE_VERSION = /^[a-z0-9][a-z0-9._:-]{0,63}$/
const MAX_COMPONENT_COUNT = 128
const MAX_SAFE_REGION_COUNT = 64
const MAX_OCCLUSION_COUNT = 128
const NORMALIZED_PRECISION = 1_000_000

const DEPTH_RANK: Record<LivingFrameDepthBand, number> = {
  far_background: 0,
  background: 1,
  behind_subject: 2,
  subject_plane: 3,
  in_front_of_subject: 4,
  foreground: 5,
}

const BASE_COVERAGE_ROLES = new Set<LivingFrameComponentRole>([
  'source_a_roll',
  'source_still',
  'opaque_background_plate',
  'reconstructed_background_plate',
])

const AUTHORITY_BOUNDARY:
  LivingFrameComponentGeometryAuthorityBoundary = Object.freeze({
    deterministicGeometryCompilationOnly: true,
    outputFrameAuthority: false,
    layoutPlanningAuthority: false,
    depthEvidenceAuthority: false,
    maskEvidenceAuthority: false,
    alphaQaAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    rendererAuthority: false,
    renderExecutionAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameComponentGeometryInput {
  readonly outputFrameExpectation: LivingFrameGeometryOutputFrameExpectation
  readonly motionBundle: LivingFrameDeterministicMotionBundle
  readonly safeRegions: readonly LivingFrameGeometrySafeRegion[]
  readonly components: readonly LivingFrameGeometryComponentDraft[]
  readonly occlusionExpectations:
    readonly LivingFrameGeometryOcclusionExpectation[]
}

export function compileLivingFrameComponentGeometry(
  input: CompileLivingFrameComponentGeometryInput,
): LivingFrameComponentGeometryBundle {
  assertInput(input)
  const safeRegions = [...input.safeRegions]
    .sort((left, right) => left.order - right.order)
    .map(cloneSafeRegion)
  const sourceComponents = [...input.components]
    .sort((left, right) => left.order - right.order)
  const motionTracksByComponent = groupMotionTracksByComponent(
    input.motionBundle,
  )
  const relativeDepthOrderComponentIds = deriveRelativeDepthOrder(
    sourceComponents,
  )
  const relativeDepthOrderByComponent = new Map(
    relativeDepthOrderComponentIds.map((componentId, index) => [
      componentId,
      index,
    ]),
  )
  const components = sourceComponents.map((component) =>
    compileComponent(
      component,
      safeRegions,
      motionTracksByComponent,
      relativeDepthOrderByComponent,
    ))
  const occlusionExpectations = [...input.occlusionExpectations]
    .sort((left, right) => left.order - right.order)
    .map((relation) => ({ ...relation }))
  const motionBinding = deriveMotionBinding(input.motionBundle)
  const metrics = deriveMetrics(
    components,
    safeRegions,
    occlusionExpectations,
  )
  const draft: LivingFrameComponentGeometryBundleDraft = {
    contractVersion: LIVING_FRAME_COMPONENT_GEOMETRY_VERSION,
    geometryProfile: LIVING_FRAME_COMPONENT_GEOMETRY_PROFILE,
    bundleClass: LIVING_FRAME_COMPONENT_GEOMETRY_CLASS,
    outputFrameExpectation: { ...input.outputFrameExpectation },
    motionBinding,
    safeRegions,
    components,
    occlusionExpectations,
    relativeDepthOrderComponentIds,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsMediaOrRawInstructions: false,
    containsProviderToolOrWorkRoute: false,
    currentSafeRegionEvidenceRevalidationStillRequired: true,
    currentAlphaAndMaskEvidenceStillRequired: true,
    canonicalRendererProjectionStillRequired: true,
  }
  return {
    ...draft,
    bundleDigestSha256: sha256(canonicalJsonStringify(draft)),
  }
}

export function verifyLivingFrameComponentGeometryBundleDigest(
  value: unknown,
): value is LivingFrameComponentGeometryBundle {
  if (!isBundleShape(value)) return false
  const { bundleDigestSha256, ...draft } = value
  return bundleDigestSha256 === sha256(canonicalJsonStringify(draft))
}

function assertInput(input: CompileLivingFrameComponentGeometryInput): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'outputFrameExpectation',
      'motionBundle',
      'safeRegions',
      'components',
      'occlusionExpectations',
    ])
  ) {
    throw new Error('Living Frame component geometry input shape is invalid.')
  }
  assertOutputFrameExpectation(input.outputFrameExpectation)
  if (!verifyLivingFrameDeterministicMotionBundleDigest(input.motionBundle)) {
    throw new Error(
      'Living Frame component geometry motion bundle is invalid.',
    )
  }
  if (
    input.motionBundle.timingExpectation.outputFrameId
      !== input.outputFrameExpectation.outputFrameId
    || input.motionBundle.timingExpectation.outputFrameDigestSha256
      !== input.outputFrameExpectation.outputFrameDigestSha256
  ) {
    throw new Error(
      'Living Frame component geometry output-frame lineage is inconsistent.',
    )
  }
  assertSafeRegions(input.safeRegions)
  assertComponents(input.components, input.safeRegions, input.motionBundle)
  assertOcclusionExpectations(
    input.occlusionExpectations,
    input.components,
  )
}

function assertOutputFrameExpectation(
  value: LivingFrameGeometryOutputFrameExpectation,
): void {
  if (
    !hasExactKeysUnknown(value, [
      'outputFrameId',
      'outputFrameDigestSha256',
      'widthPixels',
      'heightPixels',
      'pixelAspectRatioNumerator',
      'pixelAspectRatioDenominator',
      'confirmedOutputFrameRevalidationRequired',
    ])
    || !SAFE_ID.test(value.outputFrameId)
    || !SHA256.test(value.outputFrameDigestSha256)
    || !isIntegerBetween(value.widthPixels, 16, 16_384)
    || !isIntegerBetween(value.heightPixels, 16, 16_384)
    || !isIntegerBetween(value.pixelAspectRatioNumerator, 1, 10_000)
    || !isIntegerBetween(value.pixelAspectRatioDenominator, 1, 10_000)
    || value.confirmedOutputFrameRevalidationRequired !== true
  ) {
    throw new Error(
      'Living Frame component geometry output frame is invalid.',
    )
  }
}

function assertSafeRegions(
  regions: readonly LivingFrameGeometrySafeRegion[],
): void {
  if (
    !Array.isArray(regions)
    || regions.length > MAX_SAFE_REGION_COUNT
  ) {
    throw new Error(
      'Living Frame component geometry safe-region count is invalid.',
    )
  }
  const ids = new Set<string>()
  const orders = new Set<number>()
  for (const region of regions) {
    if (
      !hasExactKeysUnknown(region, [
        'regionId',
        'order',
        'kind',
        'rect',
        'evidenceRef',
      ])
      || !SAFE_ID.test(region.regionId)
      || !isIntegerBetween(region.order, 0, MAX_SAFE_REGION_COUNT - 1)
      || !includesString(LIVING_FRAME_GEOMETRY_SAFE_REGION_KINDS, region.kind)
    ) {
      throw new Error(
        'Living Frame component geometry safe region is invalid.',
      )
    }
    assertRect(region.rect, false)
    assertExpectationRef(region.evidenceRef)
    if (ids.has(region.regionId) || orders.has(region.order)) {
      throw new Error(
        'Living Frame component geometry safe regions must be unique.',
      )
    }
    ids.add(region.regionId)
    orders.add(region.order)
  }
  assertContiguousOrders(orders, 'safe-region')
}

function assertExpectationRef(
  value: LivingFrameGeometrySafeRegion['evidenceRef'],
): void {
  if (
    !hasExactKeysUnknown(value, [
      'refId',
      'version',
      'digestSha256',
      'currentAuthorityRevalidationRequired',
    ])
    || !SAFE_ID.test(value.refId)
    || !SAFE_VERSION.test(value.version)
    || !SHA256.test(value.digestSha256)
    || value.currentAuthorityRevalidationRequired !== true
  ) {
    throw new Error(
      'Living Frame component geometry expectation reference is invalid.',
    )
  }
}

function assertComponents(
  components: readonly LivingFrameGeometryComponentDraft[],
  safeRegions: readonly LivingFrameGeometrySafeRegion[],
  motionBundle: LivingFrameDeterministicMotionBundle,
): void {
  if (
    !Array.isArray(components)
    || components.length < 1
    || components.length > MAX_COMPONENT_COUNT
  ) {
    throw new Error(
      'Living Frame component geometry component count is invalid.',
    )
  }
  const ids = new Set<string>()
  const orders = new Set<number>()
  for (const component of components) {
    assertComponent(component)
    if (ids.has(component.componentId) || orders.has(component.order)) {
      throw new Error(
        'Living Frame component geometry components must be unique.',
      )
    }
    ids.add(component.componentId)
    orders.add(component.order)
  }
  assertContiguousOrders(orders, 'component')
  const primaryCount = components.filter(
    (component) =>
      component.kind === 'visual_component'
      && component.focalRole === 'primary',
  ).length
  if (primaryCount !== 1) {
    throw new Error(
      'Living Frame component geometry requires one focal primary.',
    )
  }
  for (const component of components) {
    if (
      component.parentComponentId != null
      && !ids.has(component.parentComponentId)
    ) {
      throw new Error(
        'Living Frame component geometry parent reference is dangling.',
      )
    }
    if (
      component.anchorComponentId != null
      && !ids.has(component.anchorComponentId)
    ) {
      throw new Error(
        'Living Frame component geometry anchor reference is dangling.',
      )
    }
    if (
      component.parentComponentId === component.componentId
      || component.anchorComponentId === component.componentId
    ) {
      throw new Error(
        'Living Frame component geometry self-reference is invalid.',
      )
    }
    assertProtectedRegionCollision(component, safeRegions)
  }
  assertAcyclicComponentGraph(components)
  for (const track of motionBundle.tracks) {
    if (!ids.has(track.componentId)) {
      throw new Error(
        'Living Frame component geometry motion component is dangling.',
      )
    }
  }
}

function assertComponent(
  component: LivingFrameGeometryComponentDraft,
): void {
  if (
    !hasExactKeysUnknown(component, [
      'componentId',
      'order',
      'kind',
      'role',
      'focalRole',
      'depthBand',
      'rect',
      'pivot',
      'parentComponentId',
      'anchorComponentId',
      'anchorPoint',
      'collisionPolicy',
      'transparencyExpectation',
      'alphaSourceExpectation',
      'maskExpectation',
    ])
    || !SAFE_ID.test(component.componentId)
    || !isIntegerBetween(component.order, 0, MAX_COMPONENT_COUNT - 1)
    || !includesString(LIVING_FRAME_GEOMETRY_COMPONENT_KINDS, component.kind)
    || !includesString(LIVING_FRAME_FOCAL_ROLES, component.focalRole)
    || !includesString(
      LIVING_FRAME_GEOMETRY_COLLISION_POLICIES,
      component.collisionPolicy,
    )
    || (
      component.parentComponentId != null
      && !SAFE_ID.test(component.parentComponentId)
    )
    || (
      component.anchorComponentId != null
      && !SAFE_ID.test(component.anchorComponentId)
    )
  ) {
    throw new Error(
      'Living Frame component geometry component shape is invalid.',
    )
  }

  if (component.kind === 'virtual_camera') {
    if (
      component.role !== 'virtual_camera'
      || component.focalRole !== 'none'
      || component.depthBand !== null
      || component.rect !== null
      || component.pivot !== null
      || component.parentComponentId !== null
      || component.anchorComponentId !== null
      || component.anchorPoint !== null
      || component.collisionPolicy !== 'no_surface'
      || component.transparencyExpectation !== null
      || component.alphaSourceExpectation !== null
      || component.maskExpectation !== null
    ) {
      throw new Error(
        'Living Frame virtual camera geometry is invalid.',
      )
    }
    return
  }

  if (
    !includesString(LIVING_FRAME_COMPONENT_ROLES, component.role)
    || component.depthBand == null
    || !includesString(LIVING_FRAME_DEPTH_BANDS, component.depthBand)
    || component.rect == null
    || component.pivot == null
    || component.anchorPoint == null
    || component.transparencyExpectation == null
    || !includesString(
      LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
      component.transparencyExpectation,
    )
    || component.alphaSourceExpectation == null
    || !includesString(
      LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS,
      component.alphaSourceExpectation,
    )
    || component.maskExpectation == null
    || !includesString(
      LIVING_FRAME_GEOMETRY_MASK_EXPECTATIONS,
      component.maskExpectation,
    )
  ) {
    throw new Error(
      'Living Frame visual component geometry is invalid.',
    )
  }
  assertRect(component.rect, false)
  assertPoint(component.pivot)
  assertPoint(component.anchorPoint)
  assertCollisionPolicyForRole(component)
  assertAlphaExpectationConsistency(component)
}

function assertCollisionPolicyForRole(
  component: LivingFrameGeometryComponentDraft,
): void {
  const role = component.role as LivingFrameComponentRole
  if (
    component.collisionPolicy === 'base_layer_coverage'
    && !BASE_COVERAGE_ROLES.has(role)
  ) {
    throw new Error(
      'Living Frame component geometry base coverage role is invalid.',
    )
  }
  if (
    BASE_COVERAGE_ROLES.has(role)
    && component.collisionPolicy !== 'base_layer_coverage'
  ) {
    throw new Error(
      'Living Frame component geometry base layer policy is invalid.',
    )
  }
  if (
    component.collisionPolicy === 'contact_region_overlap_only'
    && role !== 'foreground_occluder'
  ) {
    throw new Error(
      'Living Frame component geometry contact overlap role is invalid.',
    )
  }
  if (
    component.collisionPolicy === 'no_surface'
  ) {
    throw new Error(
      'Living Frame visual components require a surface collision policy.',
    )
  }
}

function assertAlphaExpectationConsistency(
  component: LivingFrameGeometryComponentDraft,
): void {
  const tuple = [
    component.transparencyExpectation,
    component.alphaSourceExpectation,
    component.maskExpectation,
  ].join('|')
  const permitted = new Set([
    'opaque_plate|opaque_plate|opaque',
    'native_alpha_preferred|native_alpha_claim_requires_qa|still_alpha_artifact_required',
    'still_alpha_required|postprocessed_still_mask_requires_qa|still_alpha_artifact_required',
    'temporal_mask_required|temporal_mask_sequence_requires_qa|temporal_mask_artifact_required',
    'procedural_alpha|procedural_alpha_requires_qa|procedural_alpha_artifact_required',
    'additive_effect|additive_blend_requires_qa|additive_effect_artifact_required',
  ])
  if (!permitted.has(tuple)) {
    throw new Error(
      'Living Frame component geometry alpha expectations are inconsistent.',
    )
  }
}

function assertProtectedRegionCollision(
  component: LivingFrameGeometryComponentDraft,
  safeRegions: readonly LivingFrameGeometrySafeRegion[],
): void {
  if (
    component.kind === 'virtual_camera'
    || component.collisionPolicy === 'base_layer_coverage'
  ) {
    return
  }
  const intersections = safeRegions.filter((region) =>
    rectsOverlap(component.rect!, region.rect))
  if (
    component.collisionPolicy === 'avoid_all_protected_regions'
    && intersections.length > 0
  ) {
    throw new Error(
      'Living Frame component geometry protected-region collision exists.',
    )
  }
  if (
    component.collisionPolicy === 'contact_region_overlap_only'
    && intersections.some((region) => region.kind !== 'contact_object')
  ) {
    throw new Error(
      'Living Frame component geometry contact object crosses another protected region.',
    )
  }
}

function assertAcyclicComponentGraph(
  components: readonly LivingFrameGeometryComponentDraft[],
): void {
  const edges = new Map<string, string[]>()
  for (const component of components) {
    const dependencies = [
      component.parentComponentId,
      component.anchorComponentId,
    ].filter((value): value is string => value != null)
    edges.set(component.componentId, [...new Set(dependencies)])
  }
  assertAcyclic(edges, 'component dependency')
}

function assertOcclusionExpectations(
  relations: readonly LivingFrameGeometryOcclusionExpectation[],
  components: readonly LivingFrameGeometryComponentDraft[],
): void {
  if (
    !Array.isArray(relations)
    || relations.length > MAX_OCCLUSION_COUNT
  ) {
    throw new Error(
      'Living Frame component geometry occlusion count is invalid.',
    )
  }
  const byId = new Map(
    components.map((component) => [component.componentId, component]),
  )
  const ids = new Set<string>()
  const orders = new Set<number>()
  const pairs = new Set<string>()
  const staticEdges = new Map<string, string[]>()
  for (const component of components) {
    staticEdges.set(component.componentId, [])
  }
  for (const relation of relations) {
    if (
      !hasExactKeysUnknown(relation, [
        'relationId',
        'order',
        'kind',
        'foregroundComponentId',
        'backgroundComponentId',
        'downstreamDepthTransitionCompilationRequired',
      ])
      || !SAFE_ID.test(relation.relationId)
      || !isIntegerBetween(relation.order, 0, MAX_OCCLUSION_COUNT - 1)
      || !includesString(
        LIVING_FRAME_GEOMETRY_OCCLUSION_KINDS,
        relation.kind,
      )
      || !SAFE_ID.test(relation.foregroundComponentId)
      || !SAFE_ID.test(relation.backgroundComponentId)
      || relation.foregroundComponentId === relation.backgroundComponentId
      || !byId.has(relation.foregroundComponentId)
      || !byId.has(relation.backgroundComponentId)
      || typeof relation.downstreamDepthTransitionCompilationRequired
        !== 'boolean'
    ) {
      throw new Error(
        'Living Frame component geometry occlusion expectation is invalid.',
      )
    }
    if (ids.has(relation.relationId) || orders.has(relation.order)) {
      throw new Error(
        'Living Frame component geometry occlusion expectations must be unique.',
      )
    }
    const pair = [
      relation.foregroundComponentId,
      relation.backgroundComponentId,
    ].sort().join('|')
    if (pairs.has(pair)) {
      throw new Error(
        'Living Frame component geometry occlusion pair is duplicated.',
      )
    }
    ids.add(relation.relationId)
    orders.add(relation.order)
    pairs.add(pair)
    const foreground = byId.get(relation.foregroundComponentId)!
    const background = byId.get(relation.backgroundComponentId)!
    if (
      foreground.kind === 'virtual_camera'
      || background.kind === 'virtual_camera'
    ) {
      throw new Error(
        'Living Frame virtual camera cannot form an occlusion relation.',
      )
    }
    if (relation.kind === 'depth_transition_required') {
      if (!relation.downstreamDepthTransitionCompilationRequired) {
        throw new Error(
          'Living Frame depth transition must retain its downstream gate.',
        )
      }
      continue
    }
    if (relation.downstreamDepthTransitionCompilationRequired) {
      throw new Error(
        'Living Frame static occlusion cannot claim a depth-transition gate.',
      )
    }
    if (
      DEPTH_RANK[foreground.depthBand!]
      <= DEPTH_RANK[background.depthBand!]
    ) {
      throw new Error(
        'Living Frame component geometry occlusion depth is inconsistent.',
      )
    }
    if (
      relation.kind === 'contact_preserves_foreground'
      && foreground.role !== 'foreground_occluder'
    ) {
      throw new Error(
        'Living Frame contact preservation requires a foreground occluder.',
      )
    }
    staticEdges.get(relation.foregroundComponentId)!
      .push(relation.backgroundComponentId)
  }
  assertContiguousOrders(orders, 'occlusion')
  assertAcyclic(staticEdges, 'occlusion')
}

function compileComponent(
  component: LivingFrameGeometryComponentDraft,
  safeRegions: readonly LivingFrameGeometrySafeRegion[],
  motionTracksByComponent: ReadonlyMap<string, readonly string[]>,
  relativeDepthOrderByComponent: ReadonlyMap<string, number>,
): LivingFrameCompiledGeometryComponent {
  const intersectingSafeRegionIds = component.rect == null
    ? []
    : safeRegions
        .filter((region) => rectsOverlap(component.rect!, region.rect))
        .map((region) => region.regionId)
        .sort()
  return {
    ...component,
    rect: component.rect == null ? null : cloneRect(component.rect),
    pivot: component.pivot == null ? null : { ...component.pivot },
    anchorPoint:
      component.anchorPoint == null ? null : { ...component.anchorPoint },
    depthRank:
      component.depthBand == null ? null : DEPTH_RANK[component.depthBand],
    relativeDepthOrder:
      relativeDepthOrderByComponent.get(component.componentId) ?? null,
    linkedMotionTrackIds: [
      ...(motionTracksByComponent.get(component.componentId) ?? []),
    ],
    intersectingSafeRegionIds,
  }
}

function deriveMotionBinding(
  bundle: LivingFrameDeterministicMotionBundle,
): LivingFrameGeometryMotionBinding {
  return {
    motionBundleDigestSha256: bundle.bundleDigestSha256,
    motionBundleClass: bundle.bundleClass,
    motionSceneId: bundle.timingExpectation.sceneId,
    motionComponentIds: [
      ...new Set(bundle.tracks.map((track) => track.componentId)),
    ].sort(),
    motionTracks: bundle.tracks
      .map((track) => ({
        trackId: track.trackId,
        componentId: track.componentId,
      }))
      .sort((left, right) =>
        left.trackId < right.trackId
          ? -1
          : left.trackId > right.trackId ? 1 : 0),
    canonicalTimingRevalidationRequired: true,
  }
}

function deriveRelativeDepthOrder(
  components: readonly LivingFrameGeometryComponentDraft[],
): string[] {
  return components
    .filter((component) => component.kind === 'visual_component')
    .sort((left, right) => {
      const depthDifference =
        DEPTH_RANK[left.depthBand!] - DEPTH_RANK[right.depthBand!]
      return depthDifference || left.order - right.order
    })
    .map((component) => component.componentId)
}

function deriveMetrics(
  components: readonly LivingFrameCompiledGeometryComponent[],
  safeRegions: readonly LivingFrameGeometrySafeRegion[],
  relations: readonly LivingFrameGeometryOcclusionExpectation[],
): LivingFrameGeometryMetrics {
  const visualComponents = components.filter(
    (component) => component.kind === 'visual_component',
  )
  const motionBound = components.filter(
    (component) => component.linkedMotionTrackIds.length > 0,
  )
  return {
    componentCount: components.length,
    visualComponentCount: visualComponents.length,
    motionBoundComponentCount: motionBound.length,
    staticComponentCount: components.length - motionBound.length,
    safeRegionCount: safeRegions.length,
    occlusionExpectationCount: relations.length,
    unresolvedDepthTransitionCount: relations.filter(
      (relation) => relation.kind === 'depth_transition_required',
    ).length,
    protectedCollisionCount: 0,
    focalPrimaryCount: 1,
  }
}

function groupMotionTracksByComponent(
  bundle: LivingFrameDeterministicMotionBundle,
): ReadonlyMap<string, readonly string[]> {
  const tracks = new Map<string, string[]>()
  for (const track of bundle.tracks) {
    const current = tracks.get(track.componentId) ?? []
    current.push(track.trackId)
    tracks.set(track.componentId, current)
  }
  for (const [componentId, trackIds] of tracks) {
    tracks.set(componentId, trackIds.sort())
  }
  return tracks
}

function isBundleShape(
  value: unknown,
): value is LivingFrameComponentGeometryBundle {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'contractVersion',
      'geometryProfile',
      'bundleClass',
      'outputFrameExpectation',
      'motionBinding',
      'safeRegions',
      'components',
      'occlusionExpectations',
      'relativeDepthOrderComponentIds',
      'metrics',
      'authorityBoundary',
      'containsMediaOrRawInstructions',
      'containsProviderToolOrWorkRoute',
      'currentSafeRegionEvidenceRevalidationStillRequired',
      'currentAlphaAndMaskEvidenceStillRequired',
      'canonicalRendererProjectionStillRequired',
      'bundleDigestSha256',
    ])
    || value.contractVersion !== LIVING_FRAME_COMPONENT_GEOMETRY_VERSION
    || value.geometryProfile !== LIVING_FRAME_COMPONENT_GEOMETRY_PROFILE
    || value.bundleClass !== LIVING_FRAME_COMPONENT_GEOMETRY_CLASS
    || !SHA256.test(value.bundleDigestSha256 as string)
    || !isRecord(value.authorityBoundary)
    || canonicalJsonStringify(value.authorityBoundary)
      !== canonicalJsonStringify(AUTHORITY_BOUNDARY)
    || value.containsMediaOrRawInstructions !== false
    || value.containsProviderToolOrWorkRoute !== false
    || value.currentSafeRegionEvidenceRevalidationStillRequired !== true
    || value.currentAlphaAndMaskEvidenceStillRequired !== true
    || value.canonicalRendererProjectionStillRequired !== true
  ) {
    return false
  }
  try {
    assertOutputFrameExpectation(
      value.outputFrameExpectation as LivingFrameGeometryOutputFrameExpectation,
    )
    assertMotionBinding(value.motionBinding)
    assertSafeRegions(value.safeRegions as LivingFrameGeometrySafeRegion[])
    assertCompiledComponents(
      value.components as LivingFrameCompiledGeometryComponent[],
      value.safeRegions as LivingFrameGeometrySafeRegion[],
      value.motionBinding as LivingFrameGeometryMotionBinding,
    )
    assertOcclusionExpectations(
      value.occlusionExpectations as LivingFrameGeometryOcclusionExpectation[],
      value.components as LivingFrameCompiledGeometryComponent[],
    )
    assertCompiledDerivedValues(value)
    return true
  } catch {
    return false
  }
}

function assertMotionBinding(value: unknown): void {
  if (!isRecord(value)) {
    throw new Error(
      'Living Frame component geometry motion binding is invalid.',
    )
  }
  const binding = value as unknown as LivingFrameGeometryMotionBinding
  if (
    !hasExactKeysUnknown(binding, [
      'motionBundleDigestSha256',
      'motionBundleClass',
      'motionSceneId',
      'motionComponentIds',
      'motionTracks',
      'canonicalTimingRevalidationRequired',
    ])
    || !SHA256.test(binding.motionBundleDigestSha256)
    || binding.motionBundleClass
      !== 'controlled_non_promotable_motion_sample_bundle'
    || !SAFE_ID.test(binding.motionSceneId)
    || !isSortedUniqueSafeIds(binding.motionComponentIds)
    || !isMotionTrackBindings(binding.motionTracks)
    || binding.canonicalTimingRevalidationRequired !== true
  ) {
    throw new Error(
      'Living Frame component geometry motion binding is invalid.',
    )
  }
}

function assertCompiledComponents(
  components: readonly LivingFrameCompiledGeometryComponent[],
  safeRegions: readonly LivingFrameGeometrySafeRegion[],
  motionBinding: LivingFrameGeometryMotionBinding,
): void {
  if (!Array.isArray(components)) {
    throw new Error('Living Frame compiled components are invalid.')
  }
  const drafts: LivingFrameGeometryComponentDraft[] = []
  for (const component of components) {
    if (
      !hasExactKeysUnknown(component, [
        'componentId',
        'order',
        'kind',
        'role',
        'focalRole',
        'depthBand',
        'rect',
        'pivot',
        'parentComponentId',
        'anchorComponentId',
        'anchorPoint',
        'collisionPolicy',
        'transparencyExpectation',
        'alphaSourceExpectation',
        'maskExpectation',
        'depthRank',
        'relativeDepthOrder',
        'linkedMotionTrackIds',
        'intersectingSafeRegionIds',
      ])
      || !isSortedUniqueSafeIds(component.linkedMotionTrackIds)
      || !isSortedUniqueSafeIds(component.intersectingSafeRegionIds)
    ) {
      throw new Error('Living Frame compiled component shape is invalid.')
    }
    const {
      depthRank,
      relativeDepthOrder,
      linkedMotionTrackIds: _linkedMotionTrackIds,
      intersectingSafeRegionIds: _intersectingSafeRegionIds,
      ...draft
    } = component
    void _linkedMotionTrackIds
    void _intersectingSafeRegionIds
    const draftComponent = draft as LivingFrameGeometryComponentDraft
    assertComponent(draftComponent)
    if (
      depthRank
        !== (
          draftComponent.depthBand == null
            ? null
            : DEPTH_RANK[draftComponent.depthBand]
        )
      || (
        relativeDepthOrder !== null
        && !isIntegerBetween(relativeDepthOrder, 0, MAX_COMPONENT_COUNT - 1)
      )
    ) {
      throw new Error('Living Frame compiled component depth is invalid.')
    }
    assertProtectedRegionCollision(draftComponent, safeRegions)
    drafts.push(draftComponent)
  }
  const fakeMotionBundle = {
    tracks: motionBinding.motionTracks,
  } as unknown as LivingFrameDeterministicMotionBundle
  assertComponents(drafts, safeRegions, fakeMotionBundle)
  const expectedTracksByComponent = new Map<string, string[]>()
  for (const binding of motionBinding.motionTracks) {
    const current = expectedTracksByComponent.get(binding.componentId) ?? []
    current.push(binding.trackId)
    expectedTracksByComponent.set(binding.componentId, current)
  }
  for (const component of components) {
    const expected = (
      expectedTracksByComponent.get(component.componentId) ?? []
    ).sort()
    if (
      canonicalJsonStringify(component.linkedMotionTrackIds)
      !== canonicalJsonStringify(expected)
    ) {
      throw new Error(
        'Living Frame compiled component motion links are invalid.',
      )
    }
  }
}

function assertCompiledDerivedValues(
  value: Record<string, unknown>,
): void {
  const components =
    value.components as LivingFrameCompiledGeometryComponent[]
  const safeRegions = value.safeRegions as LivingFrameGeometrySafeRegion[]
  const relations =
    value.occlusionExpectations as LivingFrameGeometryOcclusionExpectation[]
  const expectedDepthOrder = deriveRelativeDepthOrder(components)
  if (
    canonicalJsonStringify(value.relativeDepthOrderComponentIds)
    !== canonicalJsonStringify(expectedDepthOrder)
  ) {
    throw new Error('Living Frame compiled depth order is invalid.')
  }
  const expectedMetrics = deriveMetrics(components, safeRegions, relations)
  if (
    canonicalJsonStringify(value.metrics)
    !== canonicalJsonStringify(expectedMetrics)
  ) {
    throw new Error('Living Frame component geometry metrics are invalid.')
  }
  const expectedRelativeOrder = new Map(
    expectedDepthOrder.map((componentId, index) => [componentId, index]),
  )
  for (const component of components) {
    const expected = component.kind === 'virtual_camera'
      ? null
      : expectedRelativeOrder.get(component.componentId) ?? null
    if (component.relativeDepthOrder !== expected) {
      throw new Error(
        'Living Frame compiled component relative order is invalid.',
      )
    }
    const expectedIntersections = component.rect == null
      ? []
      : safeRegions
          .filter((region) => rectsOverlap(component.rect!, region.rect))
          .map((region) => region.regionId)
          .sort()
    if (
      canonicalJsonStringify(component.intersectingSafeRegionIds)
      !== canonicalJsonStringify(expectedIntersections)
    ) {
      throw new Error(
        'Living Frame compiled component safe-region links are invalid.',
      )
    }
  }
}

function assertRect(value: LivingFrameNormalizedRect, allowZero: boolean): void {
  if (
    !hasExactKeysUnknown(value, ['x', 'y', 'width', 'height'])
    || !isNormalized(value.x)
    || !isNormalized(value.y)
    || !(allowZero ? value.width >= 0 : value.width > 0)
    || !(allowZero ? value.height >= 0 : value.height > 0)
    || !isNormalized(value.width)
    || !isNormalized(value.height)
    || value.x + value.width > 1
    || value.y + value.height > 1
  ) {
    throw new Error('Living Frame normalized rectangle is invalid.')
  }
}

function assertPoint(value: LivingFrameNormalizedPoint): void {
  if (
    !hasExactKeysUnknown(value, ['x', 'y'])
    || !isNormalized(value.x)
    || !isNormalized(value.y)
  ) {
    throw new Error('Living Frame normalized point is invalid.')
  }
}

function rectsOverlap(
  left: LivingFrameNormalizedRect,
  right: LivingFrameNormalizedRect,
): boolean {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y
}

function cloneSafeRegion(
  region: LivingFrameGeometrySafeRegion,
): LivingFrameGeometrySafeRegion {
  return {
    ...region,
    rect: cloneRect(region.rect),
    evidenceRef: { ...region.evidenceRef },
  }
}

function cloneRect(rect: LivingFrameNormalizedRect): LivingFrameNormalizedRect {
  return { ...rect }
}

function assertAcyclic(
  edges: ReadonlyMap<string, readonly string[]>,
  label: string,
): void {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  function visit(node: string): void {
    if (visiting.has(node)) {
      throw new Error(`Living Frame ${label} graph must be acyclic.`)
    }
    if (visited.has(node)) return
    visiting.add(node)
    for (const next of edges.get(node) ?? []) visit(next)
    visiting.delete(node)
    visited.add(node)
  }
  for (const node of edges.keys()) visit(node)
}

function assertContiguousOrders(
  orders: ReadonlySet<number>,
  label: string,
): void {
  const sorted = [...orders].sort((left, right) => left - right)
  if (sorted.some((order, index) => order !== index)) {
    throw new Error(
      `Living Frame component geometry ${label} orders must be contiguous.`,
    )
  }
}

function isNormalized(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
    && Math.round(value * NORMALIZED_PRECISION) / NORMALIZED_PRECISION === value
}

function isIntegerBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return Number.isInteger(value)
    && (value as number) >= minimum
    && (value as number) <= maximum
}

function isSortedUniqueSafeIds(value: unknown): value is string[] {
  if (
    !Array.isArray(value)
    || !value.every((entry) => typeof entry === 'string' && SAFE_ID.test(entry))
  ) {
    return false
  }
  return value.every(
    (entry, index) => index === 0 || value[index - 1]! < entry,
  )
}

function isMotionTrackBindings(
  value: unknown,
): value is LivingFrameGeometryMotionBinding['motionTracks'] {
  if (!Array.isArray(value) || value.length < 1) return false
  let previousTrackId: string | null = null
  for (const candidate of value) {
    if (!isRecord(candidate)) return false
    const binding = candidate as {
      readonly trackId: string
      readonly componentId: string
    }
    if (
      !hasExactKeysUnknown(binding, ['trackId', 'componentId'])
      || !SAFE_ID.test(binding.trackId)
      || !SAFE_ID.test(binding.componentId)
      || (previousTrackId != null && previousTrackId >= binding.trackId)
    ) {
      return false
    }
    previousTrackId = binding.trackId
  }
  return true
}

function includesString<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && values.includes(value as T[number])
}

function hasExactKeysUnknown<T extends readonly string[]>(
  value: unknown,
  keys: T,
): boolean {
  return isRecord(value) && hasExactKeys(value, keys)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  )
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
