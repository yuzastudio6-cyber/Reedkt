import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS,
  LIVING_FRAME_COMPONENT_ROLES,
  LIVING_FRAME_DEPTH_BANDS,
  LIVING_FRAME_FOCAL_ROLES,
  LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
} from '../../src/types/living-frame'
import type {
  LivingFrameComponentGeometryBundle,
  LivingFrameCompiledGeometryComponent,
  LivingFrameGeometryOcclusionExpectation,
  LivingFrameGeometrySafeRegion,
  LivingFrameNormalizedPoint,
  LivingFrameNormalizedRect,
} from '../../src/types/living-frame-component-geometry'
import {
  LIVING_FRAME_GEOMETRY_COLLISION_POLICIES,
  LIVING_FRAME_GEOMETRY_MASK_EXPECTATIONS,
  LIVING_FRAME_GEOMETRY_OCCLUSION_KINDS,
  LIVING_FRAME_GEOMETRY_SAFE_REGION_KINDS,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameCompiledMotionTrack,
  LivingFrameDeterministicMotionBundle,
} from '../../src/types/living-frame-deterministic-motion'
import {
  LIVING_FRAME_MOTION_EASINGS,
  LIVING_FRAME_MOTION_PROPERTIES,
  LIVING_FRAME_MOTION_RESTORATION_EXPECTATIONS,
  LIVING_FRAME_MOTION_TRACK_ROLES,
} from '../../src/types/living-frame-deterministic-motion'
import type {
  LivingFrameProjectedCamera,
  LivingFrameProjectedLayer,
  LivingFrameRenderProjection,
  LivingFrameRenderProjectionAuthorityBoundary,
  LivingFrameRenderProjectionDraft,
  LivingFrameRenderProjectionMetrics,
  LivingFrameRenderProjectionOpenGate,
  LivingFrameRenderProjectionState,
} from '../../src/types/living-frame-render-projection'
import {
  LIVING_FRAME_PROJECTED_LAYER_PRIMITIVES,
  LIVING_FRAME_RENDER_PROJECTION_CLASS,
  LIVING_FRAME_RENDER_PROJECTION_OPEN_GATES,
  LIVING_FRAME_RENDER_PROJECTION_PROFILE,
  LIVING_FRAME_RENDER_PROJECTION_STATES,
  LIVING_FRAME_RENDER_PROJECTION_VERSION,
} from '../../src/types/living-frame-render-projection'
import type {
  LivingFrameSceneComponentEvidenceBinding,
  LivingFrameSceneEvidencePackage,
} from '../../src/types/living-frame-scene-evidence-package'
import {
  LIVING_FRAME_SCENE_CONTINUITY_EXPECTATIONS,
} from '../../src/types/living-frame-scene-evidence-package'
import {
  verifyLivingFrameComponentGeometryBundleDigest,
} from './living-frame-component-geometry'
import {
  verifyLivingFrameDeterministicMotionBundleDigest,
} from './living-frame-deterministic-motion'
import {
  verifyLivingFrameSceneEvidencePackageDigest,
} from './living-frame-scene-evidence-package'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SAFE_VERSION = /^[a-z0-9][a-z0-9._:-]{0,63}$/
const MAX_COMPONENT_COUNT = 128
const MAX_TRACK_COUNT = 64
const MAX_SAMPLE_COUNT = 250_000

const DEPTH_RANK = {
  far_background: 0,
  background: 1,
  behind_subject: 2,
  subject_plane: 3,
  in_front_of_subject: 4,
  foreground: 5,
} as const

const BASE_OPEN_GATES: readonly LivingFrameRenderProjectionOpenGate[] = [
  'current_evidence_reread_required',
  'canonical_master_timing_revalidation_required',
  'canonical_output_frame_revalidation_required',
  'canonical_artifact_qa_required',
  'canonical_snapshot_projection_required',
  'canonical_asset_manifest_linkage_required',
  'canonical_renderer_plan_projection_required',
  'canonical_caption_layering_required',
  'canonical_private_remotion_review_required',
]

const AUTHORITY_BOUNDARY:
  LivingFrameRenderProjectionAuthorityBoundary = Object.freeze({
    projectionCandidateOnly: true,
    rendererPlanAuthority: false,
    rendererLayerIdAuthority: false,
    assetManifestAuthority: false,
    artifactQaAuthority: false,
    captionAuthority: false,
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
    remotionExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameRenderProjectionInput {
  readonly motionBundle: LivingFrameDeterministicMotionBundle
  readonly componentGeometryBundle: LivingFrameComponentGeometryBundle
  readonly sceneEvidencePackage: LivingFrameSceneEvidencePackage
}

export function compileLivingFrameRenderProjection(
  input: CompileLivingFrameRenderProjectionInput,
): LivingFrameRenderProjection {
  assertInput(input)
  const evidenceByComponent = new Map(
    input.sceneEvidencePackage.componentEvidenceBindings.map((binding) => [
      binding.componentId,
      binding,
    ]),
  )
  const tracksByComponent = groupTracksByComponent(input.motionBundle.tracks)
  const visualComponents = input.componentGeometryBundle.components
    .filter((component) => component.kind === 'visual_component')
    .sort(
      (left, right) =>
        left.relativeDepthOrder! - right.relativeDepthOrder!,
    )
  const projectedLayers = visualComponents.map((component, index) =>
    projectLayer({
      component,
      evidence: evidenceByComponent.get(component.componentId)!,
      motionTracks: tracksByComponent.get(component.componentId) ?? [],
      projectionOrder: index,
    }))
  const cameraComponents = input.componentGeometryBundle.components.filter(
    (component) => component.kind === 'virtual_camera',
  )
  if (cameraComponents.length > 1) {
    throw new Error(
      'Living Frame render projection supports one virtual camera.',
    )
  }
  const projectedCameras = cameraComponents.map((component) =>
    projectCamera(
      component.componentId,
      tracksByComponent.get(component.componentId) ?? [],
    ))
  assertMotionRolePlacement(projectedLayers, projectedCameras)
  const openGateCodes = deriveOpenGates(input.sceneEvidencePackage)
  const projectionState = deriveProjectionState(input.sceneEvidencePackage)
  const metrics = deriveMetrics(
    projectedLayers,
    projectedCameras,
    input.componentGeometryBundle.metrics.unresolvedDepthTransitionCount,
  )
  const draft: LivingFrameRenderProjectionDraft = {
    contractVersion: LIVING_FRAME_RENDER_PROJECTION_VERSION,
    projectionProfile: LIVING_FRAME_RENDER_PROJECTION_PROFILE,
    projectionClass: LIVING_FRAME_RENDER_PROJECTION_CLASS,
    sceneId: input.motionBundle.timingExpectation.sceneId,
    sceneStartFrame: input.motionBundle.timingExpectation.sceneStartFrame,
    sceneEndFrame: input.motionBundle.timingExpectation.sceneEndFrame,
    fpsNumerator: input.motionBundle.timingExpectation.fpsNumerator,
    fpsDenominator: input.motionBundle.timingExpectation.fpsDenominator,
    outputFrame: {
      outputFrameId:
        input.componentGeometryBundle.outputFrameExpectation.outputFrameId,
      outputFrameDigestSha256:
        input.componentGeometryBundle.outputFrameExpectation
          .outputFrameDigestSha256,
      widthPixels:
        input.componentGeometryBundle.outputFrameExpectation.widthPixels,
      heightPixels:
        input.componentGeometryBundle.outputFrameExpectation.heightPixels,
      pixelAspectRatioNumerator:
        input.componentGeometryBundle.outputFrameExpectation
          .pixelAspectRatioNumerator,
      pixelAspectRatioDenominator:
        input.componentGeometryBundle.outputFrameExpectation
          .pixelAspectRatioDenominator,
    },
    sourceBindings: {
      motionBundleDigestSha256: input.motionBundle.bundleDigestSha256,
      componentGeometryBundleDigestSha256:
        input.componentGeometryBundle.bundleDigestSha256,
      sceneEvidencePackageDigestSha256:
        input.sceneEvidencePackage.packageDigestSha256,
    },
    projectedLayers,
    projectedCameras,
    safeRegions: input.componentGeometryBundle.safeRegions.map(
      cloneSafeRegion,
    ),
    occlusionExpectations:
      input.componentGeometryBundle.occlusionExpectations.map(
        (expectation) => ({ ...expectation }),
      ),
    captionLayerRequirement: {
      canonicalCaptionLayerMustRemainAboveProjectedComponents: true,
      canonicalCaptionSafeRegionsMustBeRevalidated: true,
    },
    projectionState,
    openGateCodes,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsExecutableCodeOrCommands: false,
    containsMediaBytesPathsUrlsOrCredentials: false,
    containsProviderToolWorkQueueOrAssetManifestRoute: false,
    canonicalRendererAdapterStillRequired: true,
    remotionExecutionStillForbidden: true,
  }
  return {
    ...draft,
    projectionDigestSha256: sha256(canonicalJsonStringify(draft)),
  }
}

export function verifyLivingFrameRenderProjectionDigest(
  value: unknown,
): value is LivingFrameRenderProjection {
  if (!isProjectionShape(value)) return false
  const { projectionDigestSha256, ...draft } = value
  return projectionDigestSha256 === sha256(canonicalJsonStringify(draft))
}

function assertInput(input: CompileLivingFrameRenderProjectionInput): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'motionBundle',
      'componentGeometryBundle',
      'sceneEvidencePackage',
    ])
    || !verifyLivingFrameDeterministicMotionBundleDigest(input.motionBundle)
    || !verifyLivingFrameComponentGeometryBundleDigest(
      input.componentGeometryBundle,
    )
    || !verifyLivingFrameSceneEvidencePackageDigest(
      input.sceneEvidencePackage,
    )
  ) {
    throw new Error('Living Frame render projection input is invalid.')
  }
  if (
    input.sceneEvidencePackage.packageState
      === 'blocked_by_measurement_findings'
  ) {
    throw new Error(
      'Living Frame render projection rejects measurement-blocked evidence.',
    )
  }
  if (
    input.componentGeometryBundle.motionBinding.motionBundleDigestSha256
      !== input.motionBundle.bundleDigestSha256
    || input.sceneEvidencePackage.motionBundleDigestSha256
      !== input.motionBundle.bundleDigestSha256
    || input.sceneEvidencePackage.componentGeometryBundleDigestSha256
      !== input.componentGeometryBundle.bundleDigestSha256
    || input.sceneEvidencePackage.sceneId
      !== input.motionBundle.timingExpectation.sceneId
    || input.sceneEvidencePackage.outputFrameId
      !== input.motionBundle.timingExpectation.outputFrameId
    || input.sceneEvidencePackage.outputFrameDigestSha256
      !== input.motionBundle.timingExpectation.outputFrameDigestSha256
  ) {
    throw new Error(
      'Living Frame render projection source lineage is inconsistent.',
    )
  }
  const visualIds = input.componentGeometryBundle.components
    .filter((component) => component.kind === 'visual_component')
    .map((component) => component.componentId)
    .sort()
  const evidenceIds = input.sceneEvidencePackage.componentEvidenceBindings
    .map((binding) => binding.componentId)
    .sort()
  if (
    canonicalJsonStringify(visualIds)
    !== canonicalJsonStringify(evidenceIds)
  ) {
    throw new Error(
      'Living Frame render projection evidence coverage is inconsistent.',
    )
  }
}

function projectLayer(input: {
  readonly component: LivingFrameCompiledGeometryComponent
  readonly evidence: LivingFrameSceneComponentEvidenceBinding
  readonly motionTracks: readonly LivingFrameCompiledMotionTrack[]
  readonly projectionOrder: number
}): LivingFrameProjectedLayer {
  const { component, evidence } = input
  if (
    component.kind !== 'visual_component'
    || component.depthBand == null
    || component.depthRank == null
    || component.relativeDepthOrder == null
    || component.rect == null
    || component.pivot == null
    || component.anchorPoint == null
    || component.role === 'virtual_camera'
    || component.transparencyExpectation == null
    || component.alphaSourceExpectation == null
    || component.maskExpectation == null
  ) {
    throw new Error(
      'Living Frame render projection visual component is incomplete.',
    )
  }
  const primitive = projectedPrimitive(evidence)
  assertPrimitiveMatchesGeometry(component, primitive)
  return {
    componentId: component.componentId,
    projectionOrder: input.projectionOrder,
    role: component.role,
    focalRole: component.focalRole,
    primitive,
    artifact: { ...evidence.artifact },
    maskArtifact:
      evidence.maskArtifact == null ? null : { ...evidence.maskArtifact },
    continuityExpectation: evidence.continuityExpectation,
    depthBand: component.depthBand,
    depthRank: component.depthRank,
    relativeDepthOrder: component.relativeDepthOrder,
    rect: { ...component.rect },
    pivot: { ...component.pivot },
    parentComponentId: component.parentComponentId,
    anchorComponentId: component.anchorComponentId,
    anchorPoint: { ...component.anchorPoint },
    collisionPolicy: component.collisionPolicy,
    transparencyExpectation: component.transparencyExpectation,
    alphaSourceExpectation: component.alphaSourceExpectation,
    maskExpectation: component.maskExpectation,
    motionTracks: input.motionTracks.map(cloneMotionTrack),
    intersectingSafeRegionIds: [
      ...component.intersectingSafeRegionIds,
    ],
  }
}

function projectCamera(
  componentId: string,
  motionTracks: readonly LivingFrameCompiledMotionTrack[],
): LivingFrameProjectedCamera {
  return {
    componentId,
    motionTracks: motionTracks.map(cloneMotionTrack),
  }
}

function projectedPrimitive(
  evidence: LivingFrameSceneComponentEvidenceBinding,
): LivingFrameProjectedLayer['primitive'] {
  if (evidence.artifactKind === 'opaque_raster') {
    return 'opaque_raster_layer'
  }
  if (evidence.artifactKind === 'still_rgba') {
    return evidence.maskArtifact == null
      ? 'rgba_raster_layer'
      : 'temporally_masked_raster_layer'
  }
  if (evidence.artifactKind === 'source_a_roll') {
    return 'temporally_masked_source_layer'
  }
  if (evidence.artifactKind === 'procedural_alpha_primitive') {
    return 'procedural_alpha_layer'
  }
  return 'additive_effect_layer'
}

function assertPrimitiveMatchesGeometry(
  component: LivingFrameCompiledGeometryComponent,
  primitive: LivingFrameProjectedLayer['primitive'],
): void {
  const expectedByMask = {
    opaque: ['opaque_raster_layer'],
    still_alpha_artifact_required: ['rgba_raster_layer'],
    temporal_mask_artifact_required: [
      'temporally_masked_raster_layer',
      'temporally_masked_source_layer',
    ],
    procedural_alpha_artifact_required: ['procedural_alpha_layer'],
    additive_effect_artifact_required: ['additive_effect_layer'],
  } as const
  if (
    component.maskExpectation == null
    || !expectedByMask[component.maskExpectation].includes(
      primitive as never,
    )
  ) {
    throw new Error(
      'Living Frame render projection primitive is inconsistent.',
    )
  }
}

function assertMotionRolePlacement(
  layers: readonly LivingFrameProjectedLayer[],
  cameras: readonly LivingFrameProjectedCamera[],
): void {
  if (
    layers.some((layer) =>
      layer.motionTracks.some((track) => track.role === 'camera'))
    || cameras.some((camera) =>
      camera.motionTracks.some((track) => track.role !== 'camera'))
  ) {
    throw new Error(
      'Living Frame render projection motion role placement is invalid.',
    )
  }
}

function deriveOpenGates(
  scenePackage: LivingFrameSceneEvidencePackage,
): LivingFrameRenderProjectionOpenGate[] {
  const gates = new Set<LivingFrameRenderProjectionOpenGate>(BASE_OPEN_GATES)
  if (
    scenePackage.packageBlockerCodes.includes(
      'procedural_alpha_qa_required',
    )
  ) gates.add('procedural_primitive_qa_required')
  if (
    scenePackage.packageBlockerCodes.includes('additive_effect_qa_required')
  ) gates.add('additive_effect_qa_required')
  if (
    scenePackage.packageBlockerCodes.includes(
      'depth_transition_compilation_required',
    )
  ) gates.add('depth_transition_compilation_required')
  return [...gates].sort()
}

function deriveProjectionState(
  scenePackage: LivingFrameSceneEvidencePackage,
): LivingFrameRenderProjectionState {
  return scenePackage.packageState
    === 'blocked_by_unresolved_primitive_qa'
    ? 'blocked_on_primitive_or_depth_qa'
    : 'candidate_pending_canonical_renderer_adapter'
}

function deriveMetrics(
  layers: readonly LivingFrameProjectedLayer[],
  cameras: readonly LivingFrameProjectedCamera[],
  unresolvedDepthTransitionCount: number,
): LivingFrameRenderProjectionMetrics {
  const tracks = [
    ...layers.flatMap((layer) => layer.motionTracks),
    ...cameras.flatMap((camera) => camera.motionTracks),
  ]
  return {
    projectedLayerCount: layers.length,
    projectedCameraCount: cameras.length,
    projectedMotionTrackCount: tracks.length,
    projectedMotionSampleCount: tracks.reduce(
      (sum, track) => sum + track.samples.length,
      0,
    ),
    maskedLayerCount: layers.filter((layer) =>
      [
        'temporally_masked_raster_layer',
        'temporally_masked_source_layer',
      ].includes(layer.primitive)).length,
    alphaLayerCount: layers.filter((layer) =>
      layer.primitive === 'rgba_raster_layer').length,
    proceduralLayerCount: layers.filter((layer) =>
      layer.primitive === 'procedural_alpha_layer').length,
    additiveLayerCount: layers.filter((layer) =>
      layer.primitive === 'additive_effect_layer').length,
    unresolvedDepthTransitionCount,
  }
}

function groupTracksByComponent(
  tracks: readonly LivingFrameCompiledMotionTrack[],
): ReadonlyMap<string, readonly LivingFrameCompiledMotionTrack[]> {
  const grouped = new Map<string, LivingFrameCompiledMotionTrack[]>()
  for (const track of tracks) {
    const current = grouped.get(track.componentId) ?? []
    current.push(track)
    grouped.set(track.componentId, current)
  }
  for (const [componentId, componentTracks] of grouped) {
    grouped.set(
      componentId,
      componentTracks.sort((left, right) => left.order - right.order),
    )
  }
  return grouped
}

function cloneMotionTrack(
  track: LivingFrameCompiledMotionTrack,
): LivingFrameCompiledMotionTrack {
  return {
    ...track,
    sourceKeyframes: track.sourceKeyframes.map((keyframe) => ({
      ...keyframe,
    })),
    samples: track.samples.map((sample) => ({ ...sample })),
  }
}

function cloneSafeRegion(
  region: LivingFrameGeometrySafeRegion,
): LivingFrameGeometrySafeRegion {
  return {
    ...region,
    rect: { ...region.rect },
    evidenceRef: { ...region.evidenceRef },
  }
}

function isProjectionShape(
  value: unknown,
): value is LivingFrameRenderProjection {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'contractVersion',
      'projectionProfile',
      'projectionClass',
      'sceneId',
      'sceneStartFrame',
      'sceneEndFrame',
      'fpsNumerator',
      'fpsDenominator',
      'outputFrame',
      'sourceBindings',
      'projectedLayers',
      'projectedCameras',
      'safeRegions',
      'occlusionExpectations',
      'captionLayerRequirement',
      'projectionState',
      'openGateCodes',
      'metrics',
      'authorityBoundary',
      'containsExecutableCodeOrCommands',
      'containsMediaBytesPathsUrlsOrCredentials',
      'containsProviderToolWorkQueueOrAssetManifestRoute',
      'canonicalRendererAdapterStillRequired',
      'remotionExecutionStillForbidden',
      'projectionDigestSha256',
    ])
    || value.contractVersion !== LIVING_FRAME_RENDER_PROJECTION_VERSION
    || value.projectionProfile !== LIVING_FRAME_RENDER_PROJECTION_PROFILE
    || value.projectionClass !== LIVING_FRAME_RENDER_PROJECTION_CLASS
    || !SAFE_ID.test(value.sceneId as string)
    || !isIntegerBetween(value.sceneStartFrame, 0, 100_000_000)
    || !isIntegerBetween(value.sceneEndFrame, 0, 100_000_000)
    || (value.sceneEndFrame as number) < (value.sceneStartFrame as number)
    || !isIntegerBetween(value.fpsNumerator, 1, 240_000)
    || !isIntegerBetween(value.fpsDenominator, 1, 1_001)
    || !SHA256.test(value.projectionDigestSha256 as string)
    || !includesString(
      LIVING_FRAME_RENDER_PROJECTION_STATES,
      value.projectionState,
    )
    || !isOpenGateArray(value.openGateCodes)
    || !isRecord(value.authorityBoundary)
    || canonicalJsonStringify(value.authorityBoundary)
      !== canonicalJsonStringify(AUTHORITY_BOUNDARY)
    || value.containsExecutableCodeOrCommands !== false
    || value.containsMediaBytesPathsUrlsOrCredentials !== false
    || value.containsProviderToolWorkQueueOrAssetManifestRoute !== false
    || value.canonicalRendererAdapterStillRequired !== true
    || value.remotionExecutionStillForbidden !== true
  ) return false
  try {
    assertOutputFrame(value.outputFrame)
    assertSourceBindings(value.sourceBindings)
    assertCaptionRequirement(value.captionLayerRequirement)
    const globalTrackIds = new Set<string>()
    const projectedLayerIds = assertProjectedLayers(
      value.projectedLayers,
      globalTrackIds,
    )
    const projectedCameraIds = assertProjectedCameras(
      value.projectedCameras,
      globalTrackIds,
    )
    assertSafeRegions(value.safeRegions)
    assertOcclusionExpectations(value.occlusionExpectations)
    assertProjectionReferences({
      layers: value.projectedLayers as LivingFrameProjectedLayer[],
      cameras: value.projectedCameras as LivingFrameProjectedCamera[],
      layerIds: projectedLayerIds,
      cameraIds: projectedCameraIds,
      safeRegions: value.safeRegions as LivingFrameGeometrySafeRegion[],
      occlusionExpectations: (
        value.occlusionExpectations as
          LivingFrameGeometryOcclusionExpectation[]
      ),
    })
    assertMotionRolePlacement(
      value.projectedLayers as LivingFrameProjectedLayer[],
      value.projectedCameras as LivingFrameProjectedCamera[],
    )
    const metrics = value.metrics as LivingFrameRenderProjectionMetrics
    assertMetrics(metrics)
    const expectedMetrics = deriveMetrics(
      value.projectedLayers as LivingFrameProjectedLayer[],
      value.projectedCameras as LivingFrameProjectedCamera[],
      metrics.unresolvedDepthTransitionCount,
    )
    if (
      canonicalJsonStringify(metrics)
      !== canonicalJsonStringify(expectedMetrics)
    ) return false
    const expectedGates = deriveGatesFromProjection(value)
    if (
      canonicalJsonStringify(value.openGateCodes)
      !== canonicalJsonStringify(expectedGates)
      || value.projectionState
        !== deriveStateFromProjection(value, expectedGates)
    ) return false
    return true
  } catch {
    return false
  }
}

function assertOutputFrame(value: unknown): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'outputFrameId',
      'outputFrameDigestSha256',
      'widthPixels',
      'heightPixels',
      'pixelAspectRatioNumerator',
      'pixelAspectRatioDenominator',
    ])
    || !SAFE_ID.test(value.outputFrameId as string)
    || !SHA256.test(value.outputFrameDigestSha256 as string)
    || !isIntegerBetween(value.widthPixels, 16, 16_384)
    || !isIntegerBetween(value.heightPixels, 16, 16_384)
    || !isIntegerBetween(value.pixelAspectRatioNumerator, 1, 10_000)
    || !isIntegerBetween(value.pixelAspectRatioDenominator, 1, 10_000)
  ) throw new Error('Living Frame projected output frame is invalid.')
}

function assertSourceBindings(value: unknown): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'motionBundleDigestSha256',
      'componentGeometryBundleDigestSha256',
      'sceneEvidencePackageDigestSha256',
    ])
    || Object.values(value).some(
      (digest) => typeof digest !== 'string' || !SHA256.test(digest),
    )
  ) throw new Error('Living Frame projection source bindings are invalid.')
}

function assertCaptionRequirement(value: unknown): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'canonicalCaptionLayerMustRemainAboveProjectedComponents',
      'canonicalCaptionSafeRegionsMustBeRevalidated',
    ])
    || value.canonicalCaptionLayerMustRemainAboveProjectedComponents !== true
    || value.canonicalCaptionSafeRegionsMustBeRevalidated !== true
  ) throw new Error('Living Frame caption projection gate is invalid.')
}

function assertProjectedLayers(
  value: unknown,
  globalTrackIds: Set<string>,
): Set<string> {
  if (
    !Array.isArray(value)
    || value.length < 1
    || value.length > MAX_COMPONENT_COUNT
  ) throw new Error('Living Frame projected layer count is invalid.')
  const ids = new Set<string>()
  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate)) {
      throw new Error('Living Frame projected layer is invalid.')
    }
    const layer = candidate as unknown as LivingFrameProjectedLayer
    if (
      !hasExactKeys(candidate, [
        'componentId',
        'projectionOrder',
        'role',
        'focalRole',
        'primitive',
        'artifact',
        'maskArtifact',
        'continuityExpectation',
        'depthBand',
        'depthRank',
        'relativeDepthOrder',
        'rect',
        'pivot',
        'parentComponentId',
        'anchorComponentId',
        'anchorPoint',
        'collisionPolicy',
        'transparencyExpectation',
        'alphaSourceExpectation',
        'maskExpectation',
        'motionTracks',
        'intersectingSafeRegionIds',
      ])
      || !SAFE_ID.test(layer.componentId)
      || ids.has(layer.componentId)
      || layer.projectionOrder !== index
      || !includesString(LIVING_FRAME_COMPONENT_ROLES, layer.role)
      || !includesString(LIVING_FRAME_FOCAL_ROLES, layer.focalRole)
      || !includesString(
        LIVING_FRAME_PROJECTED_LAYER_PRIMITIVES,
        layer.primitive,
      )
      || !includesString(
        LIVING_FRAME_SCENE_CONTINUITY_EXPECTATIONS,
        layer.continuityExpectation,
      )
      || !includesString(LIVING_FRAME_DEPTH_BANDS, layer.depthBand)
      || layer.depthRank !== DEPTH_RANK[layer.depthBand]
      || layer.relativeDepthOrder !== index
      || !includesString(
        LIVING_FRAME_GEOMETRY_COLLISION_POLICIES,
        layer.collisionPolicy,
      )
      || !includesString(
        LIVING_FRAME_TRANSPARENCY_EXPECTATIONS,
        layer.transparencyExpectation,
      )
      || !includesString(
        LIVING_FRAME_ALPHA_SOURCE_EXPECTATIONS,
        layer.alphaSourceExpectation,
      )
      || !includesString(
        LIVING_FRAME_GEOMETRY_MASK_EXPECTATIONS,
        layer.maskExpectation,
      )
      || !isSortedUniqueSafeIds(layer.intersectingSafeRegionIds)
    ) throw new Error('Living Frame projected layer shape is invalid.')
    assertArtifactRef(layer.artifact)
    if (layer.maskArtifact != null) assertArtifactRef(layer.maskArtifact)
    assertRect(layer.rect)
    assertPoint(layer.pivot)
    assertPoint(layer.anchorPoint)
    assertNullableId(layer.parentComponentId)
    assertNullableId(layer.anchorComponentId)
    assertProjectedTracks(
      layer.motionTracks,
      globalTrackIds,
      layer.componentId,
    )
    assertProjectedPrimitiveTuple(layer)
    ids.add(layer.componentId)
  }
  return ids
}

function assertProjectedCameras(
  value: unknown,
  globalTrackIds: Set<string>,
): Set<string> {
  if (!Array.isArray(value) || value.length > 1) {
    throw new Error('Living Frame projected camera count is invalid.')
  }
  const ids = new Set<string>()
  for (const candidate of value) {
    if (
      !isRecord(candidate)
      || !hasExactKeys(candidate, ['componentId', 'motionTracks'])
      || !SAFE_ID.test(candidate.componentId as string)
      || ids.has(candidate.componentId as string)
    ) throw new Error('Living Frame projected camera is invalid.')
    assertProjectedTracks(
      candidate.motionTracks,
      globalTrackIds,
      candidate.componentId as string,
    )
    ids.add(candidate.componentId as string)
  }
  return ids
}

function assertProjectedTracks(
  value: unknown,
  globalIds: Set<string>,
  expectedComponentId: string,
): void {
  if (!Array.isArray(value) || value.length > MAX_TRACK_COUNT) {
    throw new Error('Living Frame projected motion tracks are invalid.')
  }
  let previousOrder = -1
  for (const candidate of value) {
    if (!isRecord(candidate)) {
      throw new Error('Living Frame projected motion track is invalid.')
    }
    const track = candidate as unknown as LivingFrameCompiledMotionTrack
    if (
      !hasExactKeys(candidate, [
        'trackId',
        'order',
        'motionGroupId',
        'componentId',
        'property',
        'role',
        'restorationExpectation',
        'firstFrame',
        'lastFrame',
        'sourceKeyframes',
        'samples',
      ])
      || !SAFE_ID.test(track.trackId)
      || globalIds.has(track.trackId)
      || !SAFE_ID.test(track.motionGroupId)
      || track.componentId !== expectedComponentId
      || !includesString(LIVING_FRAME_MOTION_PROPERTIES, track.property)
      || !includesString(LIVING_FRAME_MOTION_TRACK_ROLES, track.role)
      || !includesString(
        LIVING_FRAME_MOTION_RESTORATION_EXPECTATIONS,
        track.restorationExpectation,
      )
      || !Number.isInteger(track.order)
      || track.order <= previousOrder
      || !Number.isInteger(track.firstFrame)
      || !Number.isInteger(track.lastFrame)
      || track.lastFrame < track.firstFrame
      || !Array.isArray(track.sourceKeyframes)
      || track.sourceKeyframes.length < 2
      || !Array.isArray(track.samples)
      || track.samples.length
        !== track.lastFrame - track.firstFrame + 1
      || track.samples.length > MAX_SAMPLE_COUNT
    ) throw new Error('Living Frame projected motion track shape is invalid.')
    let previousKeyframe = -1
    for (const candidateKeyframe of track.sourceKeyframes) {
      if (!isRecord(candidateKeyframe)) {
        throw new Error('Living Frame projected keyframe is invalid.')
      }
      const keyframe = candidateKeyframe as {
        readonly frame: number
        readonly value: number
        readonly easingToNext: string
      }
      if (
        !hasExactKeys(candidateKeyframe, ['frame', 'value', 'easingToNext'])
        || !Number.isInteger(keyframe.frame)
        || keyframe.frame <= previousKeyframe
        || typeof keyframe.value !== 'number'
        || !Number.isFinite(keyframe.value)
        || !includesString(
          LIVING_FRAME_MOTION_EASINGS,
          keyframe.easingToNext,
        )
      ) throw new Error('Living Frame projected keyframe is invalid.')
      previousKeyframe = keyframe.frame
    }
    for (const [sampleIndex, sample] of track.samples.entries()) {
      if (
        !isRecord(sample)
        || !hasExactKeys(sample, ['frame', 'value'])
        || sample.frame !== track.firstFrame + sampleIndex
        || typeof sample.value !== 'number'
        || !Number.isFinite(sample.value)
      ) throw new Error('Living Frame projected motion sample is invalid.')
    }
    previousOrder = track.order
    globalIds.add(track.trackId)
  }
}

function assertProjectionReferences(input: {
  readonly layers: readonly LivingFrameProjectedLayer[]
  readonly cameras: readonly LivingFrameProjectedCamera[]
  readonly layerIds: ReadonlySet<string>
  readonly cameraIds: ReadonlySet<string>
  readonly safeRegions: readonly LivingFrameGeometrySafeRegion[]
  readonly occlusionExpectations:
    readonly LivingFrameGeometryOcclusionExpectation[]
}): void {
  for (const cameraId of input.cameraIds) {
    if (input.layerIds.has(cameraId)) {
      throw new Error('Living Frame projected component IDs must be unique.')
    }
  }
  const safeRegionIds = new Set(
    input.safeRegions.map((region) => region.regionId),
  )
  for (const layer of input.layers) {
    if (
      (
        layer.parentComponentId != null
        && !input.layerIds.has(layer.parentComponentId)
      )
      || (
        layer.anchorComponentId != null
        && !input.layerIds.has(layer.anchorComponentId)
      )
      || layer.intersectingSafeRegionIds.some(
        (regionId) => !safeRegionIds.has(regionId),
      )
    ) {
      throw new Error(
        'Living Frame projected component references are invalid.',
      )
    }
  }
  for (const relation of input.occlusionExpectations) {
    if (
      !input.layerIds.has(relation.foregroundComponentId)
      || !input.layerIds.has(relation.backgroundComponentId)
    ) {
      throw new Error(
        'Living Frame projected occlusion references are invalid.',
      )
    }
  }
}

function assertProjectedPrimitiveTuple(
  layer: LivingFrameProjectedLayer,
): void {
  const expectedByMask = {
    opaque: ['opaque_raster_layer'],
    still_alpha_artifact_required: ['rgba_raster_layer'],
    temporal_mask_artifact_required: [
      'temporally_masked_raster_layer',
      'temporally_masked_source_layer',
    ],
    procedural_alpha_artifact_required: ['procedural_alpha_layer'],
    additive_effect_artifact_required: ['additive_effect_layer'],
  } as const
  if (!expectedByMask[layer.maskExpectation].includes(layer.primitive as never)) {
    throw new Error('Living Frame projected primitive tuple is invalid.')
  }
  const needsMask = [
    'temporally_masked_raster_layer',
    'temporally_masked_source_layer',
  ].includes(layer.primitive)
  if (needsMask !== (layer.maskArtifact != null)) {
    throw new Error('Living Frame projected mask tuple is invalid.')
  }
}

function assertSafeRegions(value: unknown): void {
  if (!Array.isArray(value) || value.length > 64) {
    throw new Error('Living Frame projected safe regions are invalid.')
  }
  const ids = new Set<string>()
  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate)) {
      throw new Error('Living Frame projected safe region is invalid.')
    }
    const region = candidate as unknown as LivingFrameGeometrySafeRegion
    if (
      !hasExactKeys(candidate, [
        'regionId',
        'order',
        'kind',
        'rect',
        'evidenceRef',
      ])
      || !SAFE_ID.test(region.regionId)
      || ids.has(region.regionId)
      || region.order !== index
      || !includesString(
        LIVING_FRAME_GEOMETRY_SAFE_REGION_KINDS,
        region.kind,
      )
    ) throw new Error('Living Frame projected safe region shape is invalid.')
    assertRect(region.rect)
    if (
      !isRecord(region.evidenceRef)
      || !hasExactKeys(region.evidenceRef, [
        'refId',
        'version',
        'digestSha256',
        'currentAuthorityRevalidationRequired',
      ])
      || !SAFE_ID.test(region.evidenceRef.refId)
      || !SAFE_VERSION.test(region.evidenceRef.version)
      || !SHA256.test(region.evidenceRef.digestSha256)
      || region.evidenceRef.currentAuthorityRevalidationRequired !== true
    ) throw new Error('Living Frame safe-region evidence is invalid.')
    ids.add(region.regionId)
  }
}

function assertOcclusionExpectations(value: unknown): void {
  if (!Array.isArray(value) || value.length > 128) {
    throw new Error('Living Frame projected occlusions are invalid.')
  }
  const ids = new Set<string>()
  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate)) {
      throw new Error('Living Frame projected occlusion is invalid.')
    }
    const relation =
      candidate as unknown as LivingFrameGeometryOcclusionExpectation
    if (
      !hasExactKeys(candidate, [
        'relationId',
        'order',
        'kind',
        'foregroundComponentId',
        'backgroundComponentId',
        'downstreamDepthTransitionCompilationRequired',
      ])
      || !SAFE_ID.test(relation.relationId)
      || ids.has(relation.relationId)
      || relation.order !== index
      || !includesString(
        LIVING_FRAME_GEOMETRY_OCCLUSION_KINDS,
        relation.kind,
      )
      || !SAFE_ID.test(relation.foregroundComponentId)
      || !SAFE_ID.test(relation.backgroundComponentId)
      || relation.foregroundComponentId === relation.backgroundComponentId
      || typeof relation.downstreamDepthTransitionCompilationRequired
        !== 'boolean'
    ) throw new Error('Living Frame projected occlusion shape is invalid.')
    ids.add(relation.relationId)
  }
}

function assertMetrics(value: LivingFrameRenderProjectionMetrics): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'projectedLayerCount',
      'projectedCameraCount',
      'projectedMotionTrackCount',
      'projectedMotionSampleCount',
      'maskedLayerCount',
      'alphaLayerCount',
      'proceduralLayerCount',
      'additiveLayerCount',
      'unresolvedDepthTransitionCount',
    ])
    || Object.values(value).some(
      (entry) =>
        typeof entry !== 'number'
        || !Number.isInteger(entry)
        || entry < 0
        || entry > MAX_SAMPLE_COUNT,
    )
  ) throw new Error('Living Frame projection metrics are invalid.')
}

function deriveGatesFromProjection(
  value: Record<string, unknown>,
): LivingFrameRenderProjectionOpenGate[] {
  const gates = new Set<LivingFrameRenderProjectionOpenGate>(BASE_OPEN_GATES)
  const metrics = value.metrics as LivingFrameRenderProjectionMetrics
  if (metrics.proceduralLayerCount > 0) {
    gates.add('procedural_primitive_qa_required')
  }
  if (metrics.additiveLayerCount > 0) {
    gates.add('additive_effect_qa_required')
  }
  if (metrics.unresolvedDepthTransitionCount > 0) {
    gates.add('depth_transition_compilation_required')
  }
  return [...gates].sort()
}

function deriveStateFromProjection(
  value: Record<string, unknown>,
  gates: readonly LivingFrameRenderProjectionOpenGate[],
): LivingFrameRenderProjectionState {
  void value
  return gates.some((gate) => [
    'procedural_primitive_qa_required',
    'additive_effect_qa_required',
    'depth_transition_compilation_required',
  ].includes(gate))
    ? 'blocked_on_primitive_or_depth_qa'
    : 'candidate_pending_canonical_renderer_adapter'
}

function assertArtifactRef(value: unknown): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, ['artifactId', 'artifactDigestSha256'])
    || !SAFE_ID.test(value.artifactId as string)
    || !SHA256.test(value.artifactDigestSha256 as string)
  ) throw new Error('Living Frame projected artifact reference is invalid.')
}

function assertRect(value: LivingFrameNormalizedRect): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, ['x', 'y', 'width', 'height'])
    || !isNormalized(value.x)
    || !isNormalized(value.y)
    || !isNormalized(value.width)
    || !isNormalized(value.height)
    || value.width <= 0
    || value.height <= 0
    || value.x + value.width > 1
    || value.y + value.height > 1
  ) throw new Error('Living Frame projected rectangle is invalid.')
}

function assertPoint(value: LivingFrameNormalizedPoint): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, ['x', 'y'])
    || !isNormalized(value.x)
    || !isNormalized(value.y)
  ) throw new Error('Living Frame projected point is invalid.')
}

function assertNullableId(value: unknown): void {
  if (value !== null && (typeof value !== 'string' || !SAFE_ID.test(value))) {
    throw new Error('Living Frame projected component reference is invalid.')
  }
}

function isOpenGateArray(
  value: unknown,
): value is LivingFrameRenderProjectionOpenGate[] {
  return Array.isArray(value)
    && value.every((entry) =>
      includesString(LIVING_FRAME_RENDER_PROJECTION_OPEN_GATES, entry))
    && isSortedUniqueStrings(value)
}

function isSortedUniqueSafeIds(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every((entry) => typeof entry === 'string' && SAFE_ID.test(entry))
    && isSortedUniqueStrings(value)
}

function isSortedUniqueStrings(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every((entry) => typeof entry === 'string')
    && value.every(
      (entry, index) => index === 0 || value[index - 1]! < entry,
    )
}

function isNormalized(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
    && Math.round(value * 1_000_000) / 1_000_000 === value
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

function includesString<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && values.includes(value as T[number])
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
