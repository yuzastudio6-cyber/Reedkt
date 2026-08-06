import type {
  LivingFrameComponentRigAuthorityBoundary,
  LivingFrameComponentRigMetrics,
  LivingFrameComponentRigSpec,
  LivingFrameComponentRigSpecDraft,
  LivingFrameRigMotionTrackBinding,
  LivingFrameRigNode,
  LivingFrameRigOcclusionRelation,
  LivingFrameRigSourceBindings,
} from '../../src/types/living-frame-component-rig'
import {
  LIVING_FRAME_COMPONENT_RIG_CLASS,
  LIVING_FRAME_COMPONENT_RIG_PROFILE,
  LIVING_FRAME_COMPONENT_RIG_VERSION,
  LIVING_FRAME_RIG_NODE_KINDS,
} from '../../src/types/living-frame-component-rig'
import type {
  LivingFrameCompiledGeometryComponent,
  LivingFrameComponentGeometryBundle,
} from '../../src/types/living-frame-component-geometry'
import {
  LIVING_FRAME_GEOMETRY_COMPONENT_KINDS,
  LIVING_FRAME_GEOMETRY_MASK_EXPECTATIONS,
  LIVING_FRAME_GEOMETRY_OCCLUSION_KINDS,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameCompiledMotionTrack,
  LivingFrameDeterministicMotionBundle,
} from '../../src/types/living-frame-deterministic-motion'
import {
  LIVING_FRAME_MOTION_PROPERTIES,
  LIVING_FRAME_MOTION_TRACK_ROLES,
} from '../../src/types/living-frame-deterministic-motion'
import {
  LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS,
  LIVING_FRAME_COMPONENT_ROLES,
  LIVING_FRAME_DEPTH_BANDS,
  LIVING_FRAME_FOCAL_ROLES,
  LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
} from '../../src/types/living-frame'
import {
  verifyLivingFrameComponentGeometryBundleDigest,
} from './living-frame-component-geometry'
import {
  verifyLivingFrameDeterministicMotionBundleDigest,
} from './living-frame-deterministic-motion'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_NODE_COUNT = 128

const AUTHORITY_BOUNDARY:
  LivingFrameComponentRigAuthorityBoundary = Object.freeze({
    deterministicRigCompilationOnly: true,
    selectedSceneAuthority: false,
    outputFrameAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workItemCreationAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    assetManifestMutationAuthority: false,
    qaApprovalAuthority: false,
    rendererAuthority: false,
    renderExecutionAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

const ARTIFACT_EXPECTATION = Object.freeze({
  workItemTypeExpectation: 'build_component_rig',
  artifactTypeExpectation: 'living_frame_component_rig_spec_json',
  assetRoleExpectation: 'processed',
  contentTypeExpectation: 'application/json',
  canonicalWorkItemCreationStillRequired: true,
  canonicalAssetManifestEntryStillRequired: true,
  canonicalArtifactQaStillRequired: true,
} as const)

export interface CompileLivingFrameComponentRigInput {
  readonly geometryBundle: LivingFrameComponentGeometryBundle
  readonly motionBundle: LivingFrameDeterministicMotionBundle
}

export function compileLivingFrameComponentRig(
  input: CompileLivingFrameComponentRigInput,
): LivingFrameComponentRigSpec {
  assertInput(input)
  const motionByComponent = groupMotionByComponent(input.motionBundle.tracks)
  const nodes = input.geometryBundle.components.map((component) =>
    compileNode(component, motionByComponent.get(component.componentId) ?? []))
  const topologicalNodeIds = topologicalSort(nodes)
  const rootNodeIds = nodes
    .filter((node) => node.dependencyNodeIds.length === 0)
    .map((node) => node.componentId)
  const occlusionRelations =
    input.geometryBundle.occlusionExpectations.map((relation) => ({
      order: relation.order,
      relationId: relation.relationId,
      kind: relation.kind,
      foregroundNodeId: relation.foregroundComponentId,
      backgroundNodeId: relation.backgroundComponentId,
      downstreamDepthTransitionCompilationRequired:
        relation.downstreamDepthTransitionCompilationRequired,
    }))
  const sourceBindings = compileSourceBindings(
    input.geometryBundle,
    input.motionBundle,
  )
  const metrics = compileMetrics(
    nodes,
    rootNodeIds,
    occlusionRelations,
  )
  const draft: LivingFrameComponentRigSpecDraft = {
    contractVersion: LIVING_FRAME_COMPONENT_RIG_VERSION,
    rigProfile: LIVING_FRAME_COMPONENT_RIG_PROFILE,
    rigClass: LIVING_FRAME_COMPONENT_RIG_CLASS,
    sourceBindings,
    nodes,
    rootNodeIds,
    topologicalNodeIds,
    occlusionRelations,
    artifactExpectation: ARTIFACT_EXPECTATION,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsExecutableCodeOrCommands: false,
    containsProviderToolOrDispatchRoute: false,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    currentSourceLineageRevalidationStillRequired: true,
    canonicalWorkAndAssetAdmissionStillRequired: true,
  }
  return {
    ...draft,
    rigDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameComponentRigSpecDigest(
  value: unknown,
): value is LivingFrameComponentRigSpec {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'rigProfile',
      'rigClass',
      'sourceBindings',
      'nodes',
      'rootNodeIds',
      'topologicalNodeIds',
      'occlusionRelations',
      'artifactExpectation',
      'metrics',
      'authorityBoundary',
      'containsExecutableCodeOrCommands',
      'containsProviderToolOrDispatchRoute',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'currentSourceLineageRevalidationStillRequired',
      'canonicalWorkAndAssetAdmissionStillRequired',
      'rigDigestSha256',
    ])) return false
    const rig = value as unknown as LivingFrameComponentRigSpec
    const { rigDigestSha256, ...draft } = rig
    if (
      !SHA256.test(rigDigestSha256)
      || rigDigestSha256 !== sha256AuthorityValue(draft)
      || rig.contractVersion !== LIVING_FRAME_COMPONENT_RIG_VERSION
      || rig.rigProfile !== LIVING_FRAME_COMPONENT_RIG_PROFILE
      || rig.rigClass !== LIVING_FRAME_COMPONENT_RIG_CLASS
      || !validateSourceBindings(rig.sourceBindings)
      || !validateNodes(rig.nodes)
      || !validateOcclusionRelations(rig.occlusionRelations, rig.nodes)
      || !validateArtifactExpectation(rig.artifactExpectation)
      || !validateAuthorityBoundary(rig.authorityBoundary)
      || rig.containsExecutableCodeOrCommands !== false
      || rig.containsProviderToolOrDispatchRoute !== false
      || rig.containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || rig.currentSourceLineageRevalidationStillRequired !== true
      || rig.canonicalWorkAndAssetAdmissionStillRequired !== true
    ) return false
    const expectedTopologicalOrder = topologicalSort(rig.nodes)
    const expectedRoots = rig.nodes
      .filter((node) => node.dependencyNodeIds.length === 0)
      .map((node) => node.componentId)
    const expectedMetrics = compileMetrics(
      rig.nodes,
      expectedRoots,
      rig.occlusionRelations,
    )
    return stableAuthorityStringify(rig.topologicalNodeIds)
        === stableAuthorityStringify(expectedTopologicalOrder)
      && stableAuthorityStringify(rig.rootNodeIds)
        === stableAuthorityStringify(expectedRoots)
      && stableAuthorityStringify(rig.metrics)
        === stableAuthorityStringify(expectedMetrics)
  } catch {
    return false
  }
}

function assertInput(input: CompileLivingFrameComponentRigInput): void {
  if (!isRecord(input) || !hasExactKeys(input, [
    'geometryBundle',
    'motionBundle',
  ])) {
    throw new Error('Living Frame component-rig input shape is invalid.')
  }
  if (!verifyLivingFrameComponentGeometryBundleDigest(input.geometryBundle)) {
    throw new Error('Living Frame component-rig geometry bundle is invalid.')
  }
  if (!verifyLivingFrameDeterministicMotionBundleDigest(input.motionBundle)) {
    throw new Error('Living Frame component-rig motion bundle is invalid.')
  }
  const geometryBinding = input.geometryBundle.motionBinding
  const timing = input.motionBundle.timingExpectation
  if (
    geometryBinding.motionBundleDigestSha256
      !== input.motionBundle.bundleDigestSha256
    || geometryBinding.motionSceneId !== timing.sceneId
    || input.geometryBundle.outputFrameExpectation.outputFrameId
      !== timing.outputFrameId
    || input.geometryBundle.outputFrameExpectation.outputFrameDigestSha256
      !== timing.outputFrameDigestSha256
  ) {
    throw new Error(
      'Living Frame component-rig source lineage is inconsistent.',
    )
  }
  assertMotionCrossReference(input.geometryBundle, input.motionBundle)
}

function assertMotionCrossReference(
  geometry: LivingFrameComponentGeometryBundle,
  motion: LivingFrameDeterministicMotionBundle,
): void {
  const expectedTrackRefs = motion.tracks
    .map((track) => ({
      trackId: track.trackId,
      componentId: track.componentId,
    }))
    .sort((left, right) => left.trackId.localeCompare(right.trackId))
  const geometryTrackRefs = [...geometry.motionBinding.motionTracks]
    .sort((left, right) => left.trackId.localeCompare(right.trackId))
  const expectedMotionComponentIds = [...new Set(
    motion.tracks.map((track) => track.componentId),
  )].sort()
  if (
    stableAuthorityStringify(geometryTrackRefs)
      !== stableAuthorityStringify(expectedTrackRefs)
    || stableAuthorityStringify(
      [...geometry.motionBinding.motionComponentIds].sort(),
    ) !== stableAuthorityStringify(expectedMotionComponentIds)
  ) {
    throw new Error(
      'Living Frame component-rig motion references are inconsistent.',
    )
  }
  for (const component of geometry.components) {
    const expectedTrackIds = motion.tracks
      .filter((track) => track.componentId === component.componentId)
      .map((track) => track.trackId)
      .sort()
    if (
      stableAuthorityStringify(
        [...component.linkedMotionTrackIds].sort(),
      ) !== stableAuthorityStringify(expectedTrackIds)
    ) {
      throw new Error(
        'Living Frame component-rig component motion binding is inconsistent.',
      )
    }
  }
}

function compileNode(
  component: LivingFrameCompiledGeometryComponent,
  tracks: readonly LivingFrameCompiledMotionTrack[],
): LivingFrameRigNode {
  const dependencyNodeIds = [...new Set([
    component.parentComponentId,
    component.anchorComponentId,
  ].filter((value): value is string => Boolean(value)))].sort()
  const motionTracks = tracks
    .map((track) => compileMotionBinding(track))
    .sort((left, right) => left.order - right.order)
  return {
    order: component.order,
    componentId: component.componentId,
    nodeKind: component.kind === 'virtual_camera'
      ? 'virtual_camera'
      : motionTracks.length > 0
        ? 'animated_visual'
        : 'static_visual',
    geometryKind: component.kind,
    role: component.role,
    focalRole: component.focalRole,
    depthBand: component.depthBand,
    depthRank: component.depthRank,
    relativeDepthOrder: component.relativeDepthOrder,
    rect: component.rect ? { ...component.rect } : null,
    pivot: component.pivot ? { ...component.pivot } : null,
    parentNodeId: component.parentComponentId,
    anchorNodeId: component.anchorComponentId,
    anchorPoint: component.anchorPoint
      ? { ...component.anchorPoint }
      : null,
    dependencyNodeIds,
    transparencyExpectation: component.transparencyExpectation,
    alphaSourceExpectation: component.alphaSourceExpectation,
    maskExpectation: component.maskExpectation,
    motionTracks,
  }
}

function compileMotionBinding(
  track: LivingFrameCompiledMotionTrack,
): LivingFrameRigMotionTrackBinding {
  return {
    order: track.order,
    trackId: track.trackId,
    property: track.property,
    role: track.role,
    firstFrame: track.firstFrame,
    lastFrame: track.lastFrame,
  }
}

function compileSourceBindings(
  geometry: LivingFrameComponentGeometryBundle,
  motion: LivingFrameDeterministicMotionBundle,
): LivingFrameRigSourceBindings {
  return {
    sceneId: motion.timingExpectation.sceneId,
    outputFrameId: motion.timingExpectation.outputFrameId,
    outputFrameDigestSha256:
      motion.timingExpectation.outputFrameDigestSha256,
    masterTimingPlanId: motion.timingExpectation.masterTimingPlanId,
    masterTimingPlanDigestSha256:
      motion.timingExpectation.masterTimingPlanDigestSha256,
    geometryBundleDigestSha256: geometry.bundleDigestSha256,
    motionBundleDigestSha256: motion.bundleDigestSha256,
  }
}

function groupMotionByComponent(
  tracks: readonly LivingFrameCompiledMotionTrack[],
): Map<string, LivingFrameCompiledMotionTrack[]> {
  const grouped = new Map<string, LivingFrameCompiledMotionTrack[]>()
  for (const track of tracks) {
    const current = grouped.get(track.componentId) ?? []
    current.push(track)
    grouped.set(track.componentId, current)
  }
  return grouped
}

function topologicalSort(nodes: readonly LivingFrameRigNode[]): string[] {
  const nodeById = new Map(nodes.map((node) => [node.componentId, node]))
  const permanent = new Set<string>()
  const temporary = new Set<string>()
  const result: string[] = []
  const visit = (componentId: string): void => {
    if (permanent.has(componentId)) return
    if (temporary.has(componentId)) {
      throw new Error('Living Frame component-rig hierarchy is cyclic.')
    }
    const node = nodeById.get(componentId)
    if (!node) {
      throw new Error(
        'Living Frame component-rig dependency node is missing.',
      )
    }
    temporary.add(componentId)
    for (const dependencyId of node.dependencyNodeIds) {
      visit(dependencyId)
    }
    temporary.delete(componentId)
    permanent.add(componentId)
    result.push(componentId)
  }
  for (const node of [...nodes].sort((left, right) =>
    left.order - right.order)) {
    visit(node.componentId)
  }
  return result
}

function compileMetrics(
  nodes: readonly LivingFrameRigNode[],
  rootNodeIds: readonly string[],
  occlusionRelations: readonly LivingFrameRigOcclusionRelation[],
): LivingFrameComponentRigMetrics {
  return {
    nodeCount: nodes.length,
    rootNodeCount: rootNodeIds.length,
    staticVisualNodeCount: nodes.filter((node) =>
      node.nodeKind === 'static_visual').length,
    animatedVisualNodeCount: nodes.filter((node) =>
      node.nodeKind === 'animated_visual').length,
    virtualCameraNodeCount: nodes.filter((node) =>
      node.nodeKind === 'virtual_camera').length,
    motionTrackBindingCount: nodes.reduce(
      (total, node) => total + node.motionTracks.length,
      0,
    ),
    occlusionRelationCount: occlusionRelations.length,
    focalPrimaryCount: 1,
  }
}

function validateSourceBindings(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'sceneId',
    'outputFrameId',
    'outputFrameDigestSha256',
    'masterTimingPlanId',
    'masterTimingPlanDigestSha256',
    'geometryBundleDigestSha256',
    'motionBundleDigestSha256',
  ])) return false
  return SAFE_ID.test(String(value.sceneId))
    && SAFE_ID.test(String(value.outputFrameId))
    && SAFE_ID.test(String(value.masterTimingPlanId))
    && [
      value.outputFrameDigestSha256,
      value.masterTimingPlanDigestSha256,
      value.geometryBundleDigestSha256,
      value.motionBundleDigestSha256,
    ].every((digest) => SHA256.test(String(digest)))
}

function validateNodes(
  value: unknown,
): value is readonly LivingFrameRigNode[] {
  if (
    !Array.isArray(value)
    || value.length < 1
    || value.length > MAX_NODE_COUNT
  ) return false
  const nodes = value as LivingFrameRigNode[]
  const ids = new Set<string>()
  const orders = new Set<number>()
  const trackIds = new Set<string>()
  for (const node of nodes) {
    if (
      !isRecord(node)
      || !hasExactKeys(node, [
        'order',
        'componentId',
        'nodeKind',
        'geometryKind',
        'role',
        'focalRole',
        'depthBand',
        'depthRank',
        'relativeDepthOrder',
        'rect',
        'pivot',
        'parentNodeId',
        'anchorNodeId',
        'anchorPoint',
        'dependencyNodeIds',
        'transparencyExpectation',
        'alphaSourceExpectation',
        'maskExpectation',
        'motionTracks',
      ])
      || !Number.isInteger(node.order)
      || Number(node.order) < 0
      || !SAFE_ID.test(String(node.componentId))
      || !includes(LIVING_FRAME_RIG_NODE_KINDS, node.nodeKind)
      || !includes(
        LIVING_FRAME_GEOMETRY_COMPONENT_KINDS,
        node.geometryKind,
      )
      || !includes(
        [...LIVING_FRAME_COMPONENT_ROLES, 'virtual_camera'],
        node.role,
      )
      || !includes(LIVING_FRAME_FOCAL_ROLES, node.focalRole)
      || !validateNullableEnum(LIVING_FRAME_DEPTH_BANDS, node.depthBand)
      || !validateNullableInteger(node.depthRank)
      || !validateNullableInteger(node.relativeDepthOrder)
      || !validateNullableRect(node.rect)
      || !validateNullablePoint(node.pivot)
      || !validateNullableId(node.parentNodeId)
      || !validateNullableId(node.anchorNodeId)
      || !validateNullablePoint(node.anchorPoint)
      || !Array.isArray(node.dependencyNodeIds)
      || !node.dependencyNodeIds.every((id) => SAFE_ID.test(String(id)))
      || new Set(node.dependencyNodeIds).size
        !== node.dependencyNodeIds.length
      || !validateNullableEnum(
        LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
        node.transparencyExpectation,
      )
      || !validateNullableEnum(
        LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS,
        node.alphaSourceExpectation,
      )
      || !validateNullableEnum(
        LIVING_FRAME_GEOMETRY_MASK_EXPECTATIONS,
        node.maskExpectation,
      )
      || !Array.isArray(node.motionTracks)
      || !node.motionTracks.every(validateMotionBinding)
      || node.motionTracks.some((track) => {
        if (trackIds.has(track.trackId)) return true
        trackIds.add(track.trackId)
        return false
      })
      || node.motionTracks.some((track, index, tracks) =>
        index > 0 && tracks[index - 1]!.order >= track.order)
      || ids.has(String(node.componentId))
      || orders.has(Number(node.order))
    ) return false
    ids.add(String(node.componentId))
    orders.add(Number(node.order))
  }
  if ([...orders].sort((a, b) => a - b).some((order, index) =>
    order !== index)) return false
  const nodeById = new Set(ids)
  for (const node of nodes) {
    const expectedDependencies = [...new Set([
      node.parentNodeId,
      node.anchorNodeId,
    ].filter((id): id is string => typeof id === 'string'))].sort()
    if (
      stableAuthorityStringify(node.dependencyNodeIds)
        !== stableAuthorityStringify(expectedDependencies)
      || node.dependencyNodeIds.some((id) => !nodeById.has(id))
      || (
        node.nodeKind === 'virtual_camera'
        && (
          node.geometryKind !== 'virtual_camera'
          || node.role !== 'virtual_camera'
          || node.depthBand !== null
          || node.depthRank !== null
          || node.relativeDepthOrder !== null
          || node.rect !== null
          || node.pivot !== null
          || node.parentNodeId !== null
          || node.anchorNodeId !== null
          || node.anchorPoint !== null
          || node.transparencyExpectation !== null
          || node.alphaSourceExpectation !== null
          || node.maskExpectation !== null
        )
      )
      || (
        node.nodeKind !== 'virtual_camera'
        && (
          node.geometryKind !== 'visual_component'
          || node.role === 'virtual_camera'
          || node.depthBand === null
          || node.depthRank === null
          || node.relativeDepthOrder === null
          || node.rect === null
          || node.pivot === null
          || node.anchorPoint === null
          || node.transparencyExpectation === null
          || node.alphaSourceExpectation === null
          || node.maskExpectation === null
        )
      )
      || (
        node.nodeKind === 'animated_visual'
        && node.motionTracks.length === 0
      )
      || (
        node.nodeKind === 'static_visual'
        && node.motionTracks.length !== 0
      )
      || node.motionTracks.some((track) =>
        !Number.isInteger(track.order)
        || track.firstFrame > track.lastFrame)
    ) return false
  }
  return nodes.filter((node) => node.focalRole === 'primary').length === 1
}

function validateMotionBinding(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'order',
      'trackId',
      'property',
      'role',
      'firstFrame',
      'lastFrame',
    ])
    && Number.isInteger(value.order)
    && SAFE_ID.test(String(value.trackId))
    && includes(LIVING_FRAME_MOTION_PROPERTIES, value.property)
    && includes(LIVING_FRAME_MOTION_TRACK_ROLES, value.role)
    && Number.isInteger(value.firstFrame)
    && Number.isInteger(value.lastFrame)
}

function validateOcclusionRelations(
  value: unknown,
  nodes: readonly LivingFrameRigNode[],
): value is readonly LivingFrameRigOcclusionRelation[] {
  if (!Array.isArray(value) || value.length > MAX_NODE_COUNT) return false
  const nodeIds = new Set(nodes.map((node) => node.componentId))
  const relationIds = new Set<string>()
  return value.every((relation, index) => {
    if (
      !isRecord(relation)
      || !hasExactKeys(relation, [
        'order',
        'relationId',
        'kind',
        'foregroundNodeId',
        'backgroundNodeId',
        'downstreamDepthTransitionCompilationRequired',
      ])
      || relation.order !== index
      || !SAFE_ID.test(String(relation.relationId))
      || relationIds.has(String(relation.relationId))
      || !nodeIds.has(String(relation.foregroundNodeId))
      || !nodeIds.has(String(relation.backgroundNodeId))
      || relation.foregroundNodeId === relation.backgroundNodeId
      || !includes(
        LIVING_FRAME_GEOMETRY_OCCLUSION_KINDS,
        relation.kind,
      )
      || typeof relation.downstreamDepthTransitionCompilationRequired
        !== 'boolean'
    ) return false
    relationIds.add(String(relation.relationId))
    return true
  })
}

function validateArtifactExpectation(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'workItemTypeExpectation',
      'artifactTypeExpectation',
      'assetRoleExpectation',
      'contentTypeExpectation',
      'canonicalWorkItemCreationStillRequired',
      'canonicalAssetManifestEntryStillRequired',
      'canonicalArtifactQaStillRequired',
    ])
    && stableAuthorityStringify(value)
      === stableAuthorityStringify(ARTIFACT_EXPECTATION)
}

function validateAuthorityBoundary(value: unknown): boolean {
  return isRecord(value)
    && stableAuthorityStringify(value)
      === stableAuthorityStringify(AUTHORITY_BOUNDARY)
}

function includes(
  values: readonly string[],
  value: unknown,
): boolean {
  return typeof value === 'string' && values.includes(value)
}

function validateNullableEnum(
  values: readonly string[],
  value: unknown,
): boolean {
  return value === null || includes(values, value)
}

function validateNullableId(value: unknown): boolean {
  return value === null || (
    typeof value === 'string' && SAFE_ID.test(value)
  )
}

function validateNullableInteger(value: unknown): boolean {
  return value === null || (
    Number.isInteger(value) && Number(value) >= 0
  )
}

function validateNullablePoint(value: unknown): boolean {
  return value === null || (
    isRecord(value)
    && hasExactKeys(value, ['x', 'y'])
    && isNormalizedNumber(value.x)
    && isNormalizedNumber(value.y)
  )
}

function validateNullableRect(value: unknown): boolean {
  return value === null || (
    isRecord(value)
    && hasExactKeys(value, ['x', 'y', 'width', 'height'])
    && isNormalizedNumber(value.x)
    && isNormalizedNumber(value.y)
    && isNormalizedNumber(value.width)
    && isNormalizedNumber(value.height)
    && Number(value.width) > 0
    && Number(value.height) > 0
  )
}

function isNormalizedNumber(value: unknown): boolean {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return stableAuthorityStringify(actual)
    === stableAuthorityStringify(expected)
}
