import { createHash } from 'node:crypto'

import type {
  LivingFrameDeterministicMotionBundle,
} from '../../src/types/living-frame-deterministic-motion'
import type {
  LivingFrameProjectedLayer,
  LivingFrameRenderProjection,
} from '../../src/types/living-frame-render-projection'
import {
  LIVING_FRAME_PROJECTED_LAYER_PRIMITIVES,
  LIVING_FRAME_RENDER_PROJECTION_STATES,
} from '../../src/types/living-frame-render-projection'
import type {
  LivingFrameRendererLayerBinding,
  LivingFrameRendererLayerBindingDraft,
  LivingFrameRendererPlanBinding,
  LivingFrameRendererPlanBindingAuthorityBoundary,
  LivingFrameRendererPlanBindingDraft,
  LivingFrameRendererPlanBindingMetrics,
  LivingFrameRendererPlanBindingOpenGate,
  LivingFrameRendererPlanBindingState,
} from '../../src/types/living-frame-renderer-plan-binding'
import {
  LIVING_FRAME_RENDERER_PLAN_BINDING_CLASS,
  LIVING_FRAME_RENDERER_PLAN_BINDING_OPEN_GATES,
  LIVING_FRAME_RENDERER_PLAN_BINDING_STATES,
  LIVING_FRAME_RENDERER_PLAN_BINDING_VERSION,
} from '../../src/types/living-frame-renderer-plan-binding'
import type {
  FrameLayoutPlan,
  LayerFitMode,
  RectZone,
  RendererCompositionPlan,
  RendererLayerPlan,
  RendererLayerType,
} from '../../src/types/reeditpro'
import {
  verifyLivingFrameDeterministicMotionBundleDigest,
} from './living-frame-deterministic-motion'
import {
  verifyLivingFrameRenderProjectionDigest,
} from './living-frame-render-projection'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const MAX_LAYER_COUNT = 128
const MAX_TRACK_COUNT = 4_096
const MAX_SAMPLE_COUNT = 250_000
const MAX_TEXT_LENGTH = 512

const RENDERER_LAYER_TYPES = [
  'source_video',
  'speaker_video',
  'ai_video_panel',
  'still_image',
  'fact_card',
  'name_card',
  'character_card',
  'list_card',
  'timeline_card',
  'graphic_design',
  'motion_design',
  'foreground_mask',
  'caption',
  'sound_sync_marker',
  'transition',
  'background_panel',
] as const satisfies readonly RendererLayerType[]

const FIT_MODES = [
  'cover',
  'contain',
  'fill',
  'safe_contain',
  'panel_contain',
] as const satisfies readonly LayerFitMode[]

const ASPECT_RATIOS = [
  '9:16',
  '16:9',
  '1:1',
  '4:5',
  '4:3',
  'let_ai_decide',
] as const

const FRAME_TEMPLATE_TYPES = [
  'vertical_story_frame',
  'horizontal_wide_frame',
  'square_social_frame',
  'browser_card',
  'evidence_board',
  'product_callout',
  'custom_frame',
  'vertical_talking_head_lower_panel',
  'vertical_full_panel',
  'youtube_side_panel',
  'youtube_lower_panel',
  'square_center_panel',
  'portrait_feed_lower_panel',
  'classic_documentary_center_panel',
  'let_ai_decide',
] as const

const COMPATIBLE_LAYER_TYPES: Readonly<
  Record<
    LivingFrameProjectedLayer['primitive'],
    readonly RendererLayerType[]
  >
> = {
  opaque_raster_layer: [
    'source_video',
    'still_image',
    'background_panel',
  ],
  rgba_raster_layer: [
    'still_image',
    'graphic_design',
    'motion_design',
  ],
  temporally_masked_raster_layer: [
    'still_image',
    'foreground_mask',
  ],
  temporally_masked_source_layer: [
    'source_video',
    'speaker_video',
  ],
  procedural_alpha_layer: [
    'graphic_design',
    'motion_design',
  ],
  additive_effect_layer: [
    'graphic_design',
    'motion_design',
  ],
}

const BASE_OPEN_GATES: readonly LivingFrameRendererPlanBindingOpenGate[] = [
  'current_renderer_plan_reread_required',
  'current_living_frame_projection_reread_required',
  'canonical_master_timing_revalidation_required',
  'canonical_output_frame_revalidation_required',
  'canonical_renderer_layer_id_admission_required',
  'canonical_renderer_layer_extension_required',
  'canonical_caption_layering_revalidation_required',
  'canonical_snapshot_projection_required',
  'canonical_asset_manifest_linkage_required',
  'canonical_work_graph_projection_required',
  'canonical_artifact_qa_required',
  'canonical_private_remotion_review_required',
]

const AUTHORITY_BOUNDARY:
  LivingFrameRendererPlanBindingAuthorityBoundary = Object.freeze({
    bindingCandidateOnly: true,
    rendererPlanAuthority: false,
    rendererLayerIdAuthority: false,
    rendererLayerMutationAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    assetManifestAuthority: false,
    artifactQaAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    remotionExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameRendererPlanBindingInput {
  readonly renderProjection: LivingFrameRenderProjection
  readonly motionBundle: LivingFrameDeterministicMotionBundle
  readonly rendererCompositionPlan: RendererCompositionPlan
  readonly layerBindings: readonly LivingFrameRendererLayerBindingDraft[]
}

export function compileLivingFrameRendererPlanBinding(
  input: CompileLivingFrameRendererPlanBindingInput,
): LivingFrameRendererPlanBinding {
  assertInput(input)
  const rendererLayers = new Map(
    input.rendererCompositionPlan.layers.map((layer) => [layer.id, layer]),
  )
  const projectedLayers = new Map(
    input.renderProjection.projectedLayers.map((layer) => [
      layer.componentId,
      layer,
    ]),
  )
  const layerBindings = compileLayerBindings({
    drafts: input.layerBindings,
    projectedLayers,
    rendererLayers,
    outputWidth: input.renderProjection.outputFrame.widthPixels,
    outputHeight: input.renderProjection.outputFrame.heightPixels,
    sceneStartSeconds: frameToSeconds(
      input.renderProjection.sceneStartFrame,
      input.renderProjection.fpsNumerator,
      input.renderProjection.fpsDenominator,
    ),
    sceneEndSeconds: frameToSeconds(
      input.renderProjection.sceneEndFrame + 1,
      input.renderProjection.fpsNumerator,
      input.renderProjection.fpsDenominator,
    ),
  })
  const cameraBindings = input.renderProjection.projectedCameras.map(
    (camera) => ({
      projectedComponentId: camera.componentId,
      motionTrackIds: camera.motionTracks.map((track) => track.trackId),
      motionSampleCount: camera.motionTracks.reduce(
        (total, track) => total + track.samples.length,
        0,
      ),
    }),
  )
  const captionLayerIds = input.rendererCompositionPlan.layers
    .filter((layer) => layer.layerType === 'caption')
    .map((layer) => layer.id)
    .sort()
  assertCaptionLayering(
    layerBindings,
    input.rendererCompositionPlan.layers,
  )
  const bindingState = stateForProjection(input.renderProjection)
  const openGateCodes = gatesForState(bindingState)
  const metrics = metricsFor({
    layerBindings,
    cameraBindings,
    captionLayerIds,
    unresolvedProjectionGateCount:
      input.renderProjection.openGateCodes.length,
  })
  const draft: LivingFrameRendererPlanBindingDraft = {
    contractVersion: LIVING_FRAME_RENDERER_PLAN_BINDING_VERSION,
    bindingClass: LIVING_FRAME_RENDERER_PLAN_BINDING_CLASS,
    sceneId: input.renderProjection.sceneId,
    sourceBindings: {
      livingFrameProjectionDigestSha256:
        input.renderProjection.projectionDigestSha256,
      deterministicMotionBundleDigestSha256:
        input.motionBundle.bundleDigestSha256,
      rendererCompositionPlanId: input.rendererCompositionPlan.id,
      rendererCompositionPlanDigestSha256: sha256(
        canonicalJsonStringify(input.rendererCompositionPlan),
      ),
      masterTimingPlanId:
        input.motionBundle.timingExpectation.masterTimingPlanId,
      masterTimingPlanDigestSha256:
        input.motionBundle.timingExpectation.masterTimingPlanDigestSha256,
      outputFrameId:
        input.motionBundle.timingExpectation.outputFrameId,
      outputFrameDigestSha256:
        input.motionBundle.timingExpectation.outputFrameDigestSha256,
    },
    projectionState: input.renderProjection.projectionState,
    layerBindings,
    cameraBindings,
    captionLayerIds,
    bindingState,
    openGateCodes,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsProviderToolWorkQueueOrCostRoute: false,
    containsExecutableCodeOrCommands: false,
    existingRendererCompositionPlanRemainsAuthority: true,
    canonicalSnapshotAdapterStillRequired: true,
    remotionExecutionStillForbidden: true,
  }
  return {
    ...draft,
    bindingDigestSha256: sha256(canonicalJsonStringify(draft)),
  }
}

export function verifyLivingFrameRendererPlanBindingDigest(
  value: unknown,
): value is LivingFrameRendererPlanBinding {
  if (!isBindingShape(value)) return false
  const { bindingDigestSha256, ...draft } = value
  return bindingDigestSha256 === sha256(canonicalJsonStringify(draft))
}

function assertInput(
  input: CompileLivingFrameRendererPlanBindingInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'renderProjection',
      'motionBundle',
      'rendererCompositionPlan',
      'layerBindings',
    ])
    || !verifyLivingFrameRenderProjectionDigest(input.renderProjection)
    || !verifyLivingFrameDeterministicMotionBundleDigest(
      input.motionBundle,
    )
  ) throw invalid('Living Frame renderer binding input is invalid.')
  assertRendererCompositionPlan(input.rendererCompositionPlan)
  if (
    input.renderProjection.sourceBindings.motionBundleDigestSha256
      !== input.motionBundle.bundleDigestSha256
    || input.renderProjection.sceneId
      !== input.motionBundle.timingExpectation.sceneId
    || input.renderProjection.outputFrame.outputFrameId
      !== input.motionBundle.timingExpectation.outputFrameId
    || input.renderProjection.outputFrame.outputFrameDigestSha256
      !== input.motionBundle.timingExpectation.outputFrameDigestSha256
    || input.rendererCompositionPlan.masterTimingPlanId
      !== input.motionBundle.timingExpectation.masterTimingPlanId
    || input.rendererCompositionPlan.frameTemplate.canvasWidth
      !== input.renderProjection.outputFrame.widthPixels
    || input.rendererCompositionPlan.frameTemplate.canvasHeight
      !== input.renderProjection.outputFrame.heightPixels
    || !sameFps(
      input.rendererCompositionPlan.fps,
      input.renderProjection.fpsNumerator,
      input.renderProjection.fpsDenominator,
    )
    || input.rendererCompositionPlan.durationSeconds + 1e-9
      < frameToSeconds(
        input.renderProjection.sceneEndFrame + 1,
        input.renderProjection.fpsNumerator,
        input.renderProjection.fpsDenominator,
      )
    || input.rendererCompositionPlan.engine !== 'remotion'
    || input.rendererCompositionPlan.approvalRequired !== true
    || input.rendererCompositionPlan.renderReady !== false
  ) throw invalid('Living Frame renderer binding lineage is inconsistent.')
}

function compileLayerBindings(input: {
  readonly drafts: readonly LivingFrameRendererLayerBindingDraft[]
  readonly projectedLayers: ReadonlyMap<string, LivingFrameProjectedLayer>
  readonly rendererLayers: ReadonlyMap<string, RendererLayerPlan>
  readonly outputWidth: number
  readonly outputHeight: number
  readonly sceneStartSeconds: number
  readonly sceneEndSeconds: number
}): LivingFrameRendererLayerBinding[] {
  if (
    !Array.isArray(input.drafts)
    || input.drafts.length !== input.projectedLayers.size
    || input.drafts.length > MAX_LAYER_COUNT
  ) throw invalid('Living Frame renderer layer coverage is invalid.')
  const componentIds = new Set<string>()
  const rendererLayerIds = new Set<string>()
  const compiled: LivingFrameRendererLayerBinding[] = []
  let previousZIndex = Number.NEGATIVE_INFINITY
  for (const [index, draft] of input.drafts.entries()) {
    if (
      !isRecord(draft)
      || !hasExactKeys(draft, [
        'order',
        'projectedComponentId',
        'rendererLayerId',
      ])
    ) throw invalid('Living Frame renderer layer binding is invalid.')
    const candidate =
      draft as unknown as LivingFrameRendererLayerBindingDraft
    if (
      candidate.order !== index
      || !SAFE_ID.test(candidate.projectedComponentId)
      || !SAFE_ID.test(candidate.rendererLayerId)
      || componentIds.has(candidate.projectedComponentId)
      || rendererLayerIds.has(candidate.rendererLayerId)
    ) throw invalid('Living Frame renderer layer binding is invalid.')
    const projected = input.projectedLayers.get(
      candidate.projectedComponentId,
    )
    const rendererLayer = input.rendererLayers.get(
      candidate.rendererLayerId,
    )
    if (
      !projected
      || !rendererLayer
      || projected.projectionOrder !== index
      || rendererLayer.layerType === 'caption'
      || !COMPATIBLE_LAYER_TYPES[projected.primitive].includes(
        rendererLayer.layerType,
      )
      || rendererLayer.zIndex <= previousZIndex
      || rendererLayer.startTimeSeconds > input.sceneStartSeconds + 1e-9
      || rendererLayer.endTimeSeconds + 1e-9 < input.sceneEndSeconds
    ) throw invalid('Living Frame renderer layer mapping is incompatible.')
    const expectedZone = normalizedRectToPixels(
      projected.rect,
      input.outputWidth,
      input.outputHeight,
    )
    if (!sameZone(rendererLayer.zone, expectedZone)) {
      throw invalid('Living Frame renderer layer zone is inconsistent.')
    }
    compiled.push({
      order: index,
      projectedComponentId: projected.componentId,
      rendererLayerId: rendererLayer.id,
      rendererLayerType: rendererLayer.layerType,
      fitMode: rendererLayer.fitMode,
      zIndex: rendererLayer.zIndex,
      primitive: projected.primitive,
      artifact: { ...projected.artifact },
      maskArtifact:
        projected.maskArtifact == null
          ? null
          : { ...projected.maskArtifact },
      motionTrackIds: projected.motionTracks.map((track) => track.trackId),
      motionSampleCount: projected.motionTracks.reduce(
        (total, track) => total + track.samples.length,
        0,
      ),
      zonePixels: expectedZone,
    })
    componentIds.add(candidate.projectedComponentId)
    rendererLayerIds.add(candidate.rendererLayerId)
    previousZIndex = rendererLayer.zIndex
  }
  if (
    componentIds.size !== input.projectedLayers.size
    || [...input.projectedLayers.keys()].some(
      (componentId) => !componentIds.has(componentId),
    )
  ) throw invalid('Living Frame renderer layer coverage is incomplete.')
  return compiled
}

function assertCaptionLayering(
  bindings: readonly LivingFrameRendererLayerBinding[],
  rendererLayers: readonly RendererLayerPlan[],
): void {
  const maximumLivingFrameZ = Math.max(
    ...bindings.map((binding) => binding.zIndex),
  )
  const captions = rendererLayers.filter(
    (layer) => layer.layerType === 'caption',
  )
  if (
    captions.some((caption) => caption.zIndex <= maximumLivingFrameZ)
  ) throw invalid('Living Frame renderer layers would cover captions.')
}

function stateForProjection(
  projection: LivingFrameRenderProjection,
): LivingFrameRendererPlanBindingState {
  return projection.projectionState
    === 'candidate_pending_canonical_renderer_adapter'
    ? 'candidate_pending_canonical_snapshot_projection'
    : 'blocked_by_living_frame_projection_gates'
}

function gatesForState(
  state: LivingFrameRendererPlanBindingState,
): LivingFrameRendererPlanBindingOpenGate[] {
  const gates = new Set(BASE_OPEN_GATES)
  if (state === 'blocked_by_living_frame_projection_gates') {
    gates.add('living_frame_projection_blockers_must_resolve')
  }
  return [...gates].sort()
}

function metricsFor(input: {
  readonly layerBindings:
    readonly LivingFrameRendererLayerBinding[]
  readonly cameraBindings: readonly {
    readonly motionTrackIds: readonly string[]
    readonly motionSampleCount: number
  }[]
  readonly captionLayerIds: readonly string[]
  readonly unresolvedProjectionGateCount: number
}): LivingFrameRendererPlanBindingMetrics {
  const motionTrackCount = [
    ...input.layerBindings.map((binding) => binding.motionTrackIds.length),
    ...input.cameraBindings.map((binding) => binding.motionTrackIds.length),
  ].reduce((total, count) => total + count, 0)
  const motionSampleCount = [
    ...input.layerBindings.map((binding) => binding.motionSampleCount),
    ...input.cameraBindings.map((binding) => binding.motionSampleCount),
  ].reduce((total, count) => total + count, 0)
  return {
    projectedLayerBindingCount: input.layerBindings.length,
    projectedCameraBindingCount: input.cameraBindings.length,
    projectedMotionTrackCount: motionTrackCount,
    projectedMotionSampleCount: motionSampleCount,
    captionLayerCount: input.captionLayerIds.length,
    unresolvedProjectionGateCount:
      input.unresolvedProjectionGateCount,
  }
}

function isBindingShape(
  value: unknown,
): value is LivingFrameRendererPlanBinding {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'contractVersion',
      'bindingClass',
      'sceneId',
      'sourceBindings',
      'projectionState',
      'layerBindings',
      'cameraBindings',
      'captionLayerIds',
      'bindingState',
      'openGateCodes',
      'metrics',
      'authorityBoundary',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsProviderToolWorkQueueOrCostRoute',
      'containsExecutableCodeOrCommands',
      'existingRendererCompositionPlanRemainsAuthority',
      'canonicalSnapshotAdapterStillRequired',
      'remotionExecutionStillForbidden',
      'bindingDigestSha256',
    ])
    || value.contractVersion !==
      LIVING_FRAME_RENDERER_PLAN_BINDING_VERSION
    || value.bindingClass !== LIVING_FRAME_RENDERER_PLAN_BINDING_CLASS
    || !SAFE_ID.test(value.sceneId as string)
    || !includesString(
      LIVING_FRAME_RENDER_PROJECTION_STATES,
      value.projectionState,
    )
    || !includesString(
      LIVING_FRAME_RENDERER_PLAN_BINDING_STATES,
      value.bindingState,
    )
    || !isOpenGateArray(value.openGateCodes)
    || !isSortedUniqueSafeIds(value.captionLayerIds)
    || !isRecord(value.authorityBoundary)
    || canonicalJsonStringify(value.authorityBoundary)
      !== canonicalJsonStringify(AUTHORITY_BOUNDARY)
    || value
      .containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials !== false
    || value.containsProviderToolWorkQueueOrCostRoute !== false
    || value.containsExecutableCodeOrCommands !== false
    || value.existingRendererCompositionPlanRemainsAuthority !== true
    || value.canonicalSnapshotAdapterStillRequired !== true
    || value.remotionExecutionStillForbidden !== true
    || !SHA256.test(value.bindingDigestSha256 as string)
  ) return false
  try {
    assertBindingSource(value.sourceBindings)
    const layerBindings = assertLayerBindingOutput(value.layerBindings)
    const cameraBindings = assertCameraBindingOutput(value.cameraBindings)
    assertOutputCrossReferences({
      layerBindings,
      cameraBindings,
      captionLayerIds: value.captionLayerIds as string[],
    })
    const metrics = value.metrics as LivingFrameRendererPlanBindingMetrics
    assertMetrics(metrics)
    const expectedMetrics = metricsFor({
      layerBindings,
      cameraBindings,
      captionLayerIds: value.captionLayerIds as string[],
      unresolvedProjectionGateCount:
        metrics.unresolvedProjectionGateCount,
    })
    if (
      canonicalJsonStringify(metrics)
      !== canonicalJsonStringify(expectedMetrics)
    ) return false
    const expectedState = value.projectionState
      === 'candidate_pending_canonical_renderer_adapter'
      ? 'candidate_pending_canonical_snapshot_projection'
      : 'blocked_by_living_frame_projection_gates'
    if (
      value.bindingState !== expectedState
      || canonicalJsonStringify(value.openGateCodes)
        !== canonicalJsonStringify(gatesForState(expectedState))
    ) return false
    return true
  } catch {
    return false
  }
}

function assertBindingSource(value: unknown): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'livingFrameProjectionDigestSha256',
      'deterministicMotionBundleDigestSha256',
      'rendererCompositionPlanId',
      'rendererCompositionPlanDigestSha256',
      'masterTimingPlanId',
      'masterTimingPlanDigestSha256',
      'outputFrameId',
      'outputFrameDigestSha256',
    ])
    || !SAFE_ID.test(value.rendererCompositionPlanId as string)
    || !SAFE_ID.test(value.masterTimingPlanId as string)
    || !SAFE_ID.test(value.outputFrameId as string)
    || [
      value.livingFrameProjectionDigestSha256,
      value.deterministicMotionBundleDigestSha256,
      value.rendererCompositionPlanDigestSha256,
      value.masterTimingPlanDigestSha256,
      value.outputFrameDigestSha256,
    ].some((digest) => typeof digest !== 'string' || !SHA256.test(digest))
  ) throw invalid('Living Frame renderer binding source is invalid.')
}

function assertLayerBindingOutput(
  value: unknown,
): LivingFrameRendererLayerBinding[] {
  if (
    !Array.isArray(value)
    || value.length < 1
    || value.length > MAX_LAYER_COUNT
  ) throw invalid('Living Frame renderer layer bindings are invalid.')
  const componentIds = new Set<string>()
  const rendererLayerIds = new Set<string>()
  const trackIds = new Set<string>()
  let previousZ = Number.NEGATIVE_INFINITY
  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate)) {
      throw invalid('Living Frame renderer layer binding is invalid.')
    }
    const binding =
      candidate as unknown as LivingFrameRendererLayerBinding
    if (
      !hasExactKeys(candidate, [
        'order',
        'projectedComponentId',
        'rendererLayerId',
        'rendererLayerType',
        'fitMode',
        'zIndex',
        'primitive',
        'artifact',
        'maskArtifact',
        'motionTrackIds',
        'motionSampleCount',
        'zonePixels',
      ])
      || binding.order !== index
      || !SAFE_ID.test(binding.projectedComponentId)
      || !SAFE_ID.test(binding.rendererLayerId)
      || componentIds.has(binding.projectedComponentId)
      || rendererLayerIds.has(binding.rendererLayerId)
      || !includesString(RENDERER_LAYER_TYPES, binding.rendererLayerType)
      || !includesString(FIT_MODES, binding.fitMode)
      || !Number.isInteger(binding.zIndex)
      || binding.zIndex <= previousZ
      || !includesString(
        LIVING_FRAME_PROJECTED_LAYER_PRIMITIVES,
        binding.primitive,
      )
      || !COMPATIBLE_LAYER_TYPES[binding.primitive].includes(
        binding.rendererLayerType,
      )
      || !isOrderedUniqueSafeIds(binding.motionTrackIds)
      || binding.motionTrackIds.some((trackId) => trackIds.has(trackId))
      || !isIntegerBetween(
        binding.motionSampleCount,
        0,
        MAX_SAMPLE_COUNT,
      )
      || (
        binding.motionTrackIds.length === 0
          ? binding.motionSampleCount !== 0
          : binding.motionSampleCount < binding.motionTrackIds.length
      )
    ) throw invalid('Living Frame renderer layer binding shape is invalid.')
    assertArtifact(binding.artifact)
    if (binding.maskArtifact != null) assertArtifact(binding.maskArtifact)
    assertPixelZone(binding.zonePixels)
    binding.motionTrackIds.forEach((trackId) => trackIds.add(trackId))
    componentIds.add(binding.projectedComponentId)
    rendererLayerIds.add(binding.rendererLayerId)
    previousZ = binding.zIndex
  }
  return value as LivingFrameRendererLayerBinding[]
}

function assertCameraBindingOutput(value: unknown): Array<{
  readonly projectedComponentId: string
  readonly motionTrackIds: readonly string[]
  readonly motionSampleCount: number
}> {
  if (!Array.isArray(value) || value.length > 1) {
    throw invalid('Living Frame renderer camera binding is invalid.')
  }
  for (const candidate of value) {
    if (
      !isRecord(candidate)
      || !hasExactKeys(candidate, [
        'projectedComponentId',
        'motionTrackIds',
        'motionSampleCount',
      ])
      || !SAFE_ID.test(candidate.projectedComponentId as string)
      || !isOrderedUniqueSafeIds(candidate.motionTrackIds)
      || !isIntegerBetween(
        candidate.motionSampleCount,
        0,
        MAX_SAMPLE_COUNT,
      )
      || (
        (candidate.motionTrackIds as unknown[]).length === 0
          ? candidate.motionSampleCount !== 0
          : (candidate.motionSampleCount as number)
            < (candidate.motionTrackIds as unknown[]).length
      )
    ) throw invalid('Living Frame renderer camera binding is invalid.')
  }
  return value as Array<{
    readonly projectedComponentId: string
    readonly motionTrackIds: readonly string[]
    readonly motionSampleCount: number
  }>
}

function assertOutputCrossReferences(input: {
  readonly layerBindings:
    readonly LivingFrameRendererLayerBinding[]
  readonly cameraBindings: readonly {
    readonly projectedComponentId: string
    readonly motionTrackIds: readonly string[]
  }[]
  readonly captionLayerIds: readonly string[]
}): void {
  const projectedComponentIds = new Set(
    input.layerBindings.map((binding) => binding.projectedComponentId),
  )
  const rendererLayerIds = new Set(
    input.layerBindings.map((binding) => binding.rendererLayerId),
  )
  const globalTrackIds = new Set(
    input.layerBindings.flatMap((binding) => binding.motionTrackIds),
  )
  for (const camera of input.cameraBindings) {
    if (projectedComponentIds.has(camera.projectedComponentId)) {
      throw invalid('Living Frame camera component collides with a layer.')
    }
    for (const trackId of camera.motionTrackIds) {
      if (globalTrackIds.has(trackId)) {
        throw invalid('Living Frame projected motion track is duplicated.')
      }
      globalTrackIds.add(trackId)
    }
  }
  if (
    input.captionLayerIds.some((layerId) => rendererLayerIds.has(layerId))
  ) throw invalid('Living Frame caption and visual layers collide.')
}

function assertMetrics(
  value: LivingFrameRendererPlanBindingMetrics,
): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'projectedLayerBindingCount',
      'projectedCameraBindingCount',
      'projectedMotionTrackCount',
      'projectedMotionSampleCount',
      'captionLayerCount',
      'unresolvedProjectionGateCount',
    ])
    || Object.values(value).some(
      (entry) => !isIntegerBetween(entry, 0, MAX_SAMPLE_COUNT),
    )
  ) throw invalid('Living Frame renderer binding metrics are invalid.')
}

function assertRendererCompositionPlan(
  plan: RendererCompositionPlan,
): void {
  if (
    !isRecord(plan)
    || !hasExactKeys(plan, [
      'id',
      'engine',
      'frameTemplate',
      'durationSeconds',
      'fps',
      'masterTimingPlanId',
      'layers',
      'captionSafeZone',
      'panelBackgroundColor',
      'rendererNotes',
      'approvalRequired',
      'renderReady',
    ])
    || !SAFE_ID.test(plan.id)
    || plan.engine !== 'remotion'
    || !isFiniteBetween(plan.durationSeconds, 0.01, 86_400)
    || !isFiniteBetween(plan.fps, 1, 240)
    || !SAFE_ID.test(plan.masterTimingPlanId ?? '')
    || !isSafeText(plan.panelBackgroundColor, 64)
    || !isBoundedTextArray(plan.rendererNotes, 128)
    || plan.approvalRequired !== true
    || plan.renderReady !== false
  ) throw invalid('Renderer composition plan is invalid.')
  assertFrameTemplate(plan.frameTemplate)
  if (plan.captionSafeZone != null) assertZone(plan.captionSafeZone)
  if (
    !Array.isArray(plan.layers)
    || plan.layers.length < 1
    || plan.layers.length > MAX_LAYER_COUNT
  ) throw invalid('Renderer composition layers are invalid.')
  const ids = new Set<string>()
  for (const layer of plan.layers) {
    assertRendererLayer(layer)
    if (ids.has(layer.id)) {
      throw invalid('Renderer composition layer IDs are not unique.')
    }
    ids.add(layer.id)
  }
}

function assertRendererLayer(layer: RendererLayerPlan): void {
  if (
    !isRecord(layer)
    || !hasOnlyAndRequiredKeys(
      layer,
      [
        'id',
        'layerType',
        'label',
        'startTimeSeconds',
        'endTimeSeconds',
        'zIndex',
        'zone',
        'fitMode',
        'notes',
      ],
      [
        'assetPlanItemId',
        'backgroundColor',
        'opacity',
        'motionPreset',
      ],
    )
    || !SAFE_ID.test(layer.id)
    || (
      layer.assetPlanItemId != null
      && !SAFE_ID.test(layer.assetPlanItemId)
    )
    || !includesString(RENDERER_LAYER_TYPES, layer.layerType)
    || !isSafeText(layer.label, 128)
    || !isFiniteBetween(layer.startTimeSeconds, 0, 86_400)
    || !isFiniteBetween(layer.endTimeSeconds, 0, 86_400)
    || layer.endTimeSeconds <= layer.startTimeSeconds
    || !Number.isInteger(layer.zIndex)
    || !includesString(FIT_MODES, layer.fitMode)
    || (
      layer.backgroundColor != null
      && !isSafeText(layer.backgroundColor, 64)
    )
    || (
      layer.opacity != null
      && !isFiniteBetween(layer.opacity, 0, 1)
    )
    || (
      layer.motionPreset != null
      && !isSafeText(layer.motionPreset, 128)
    )
    || !isBoundedTextArray(layer.notes, 128)
  ) throw invalid('Renderer layer is invalid.')
  assertZone(layer.zone)
}

function assertFrameTemplate(frame: FrameLayoutPlan): void {
  if (
    !isRecord(frame)
    || !hasOnlyAndRequiredKeys(
      frame,
      [
        'templateType',
        'aspectRatio',
        'canvasWidth',
        'canvasHeight',
        'animationZone',
        'safeMargin',
        'panelBackgroundColor',
        'notes',
      ],
      ['speakerZone', 'captionSafeZone'],
    )
    || !includesString(FRAME_TEMPLATE_TYPES, frame.templateType)
    || !includesString(ASPECT_RATIOS, frame.aspectRatio)
    || !isIntegerBetween(frame.canvasWidth, 16, 16_384)
    || !isIntegerBetween(frame.canvasHeight, 16, 16_384)
    || !isIntegerBetween(frame.safeMargin, 0, 4_096)
    || !isSafeText(frame.panelBackgroundColor, 64)
    || !isBoundedTextArray(frame.notes, 128)
  ) throw invalid('Renderer frame template is invalid.')
  assertZone(frame.animationZone)
  if (frame.speakerZone != null) assertZone(frame.speakerZone)
  if (frame.captionSafeZone != null) assertZone(frame.captionSafeZone)
}

function assertZone(zone: RectZone): void {
  if (
    !isRecord(zone)
    || !hasOnlyAndRequiredKeys(
      zone,
      ['x', 'y', 'width', 'height'],
      ['label', 'notes'],
    )
    || !isFiniteBetween(zone.x, 0, 16_384)
    || !isFiniteBetween(zone.y, 0, 16_384)
    || !isFiniteBetween(zone.width, 1, 16_384)
    || !isFiniteBetween(zone.height, 1, 16_384)
    || (
      zone.label != null
      && !isSafeText(zone.label, 128)
    )
    || (
      zone.notes != null
      && !isSafeText(zone.notes, MAX_TEXT_LENGTH)
    )
  ) throw invalid('Renderer zone is invalid.')
}

function normalizedRectToPixels(
  rect: LivingFrameProjectedLayer['rect'],
  width: number,
  height: number,
) {
  return {
    x: Math.round(rect.x * width),
    y: Math.round(rect.y * height),
    width: Math.round(rect.width * width),
    height: Math.round(rect.height * height),
  }
}

function sameZone(left: RectZone, right: RectZone): boolean {
  return left.x === right.x
    && left.y === right.y
    && left.width === right.width
    && left.height === right.height
}

function assertPixelZone(value: unknown): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, ['x', 'y', 'width', 'height'])
    || !isIntegerBetween(value.x, 0, 16_384)
    || !isIntegerBetween(value.y, 0, 16_384)
    || !isIntegerBetween(value.width, 1, 16_384)
    || !isIntegerBetween(value.height, 1, 16_384)
  ) throw invalid('Living Frame renderer pixel zone is invalid.')
}

function assertArtifact(value: unknown): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, ['artifactId', 'artifactDigestSha256'])
    || !SAFE_ID.test(value.artifactId as string)
    || !SHA256.test(value.artifactDigestSha256 as string)
  ) throw invalid('Living Frame renderer artifact reference is invalid.')
}

function frameToSeconds(
  frame: number,
  fpsNumerator: number,
  fpsDenominator: number,
): number {
  return frame * fpsDenominator / fpsNumerator
}

function sameFps(
  fps: number,
  numerator: number,
  denominator: number,
): boolean {
  return Math.abs(fps - numerator / denominator) <= 1e-9
}

function isOpenGateArray(
  value: unknown,
): value is LivingFrameRendererPlanBindingOpenGate[] {
  return Array.isArray(value)
    && value.every((entry) => includesString(
      LIVING_FRAME_RENDERER_PLAN_BINDING_OPEN_GATES,
      entry,
    ))
    && isSortedUniqueStrings(value)
}

function isOrderedUniqueSafeIds(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= MAX_TRACK_COUNT
    && value.every(
      (entry) => typeof entry === 'string' && SAFE_ID.test(entry),
    )
    && new Set(value).size === value.length
}

function isSortedUniqueSafeIds(value: unknown): value is string[] {
  return isOrderedUniqueSafeIds(value) && isSortedUniqueStrings(value)
}

function isSortedUniqueStrings(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every((entry) => typeof entry === 'string')
    && value.every(
      (entry, index) => index === 0 || value[index - 1]! < entry,
    )
}

function isBoundedTextArray(
  value: unknown,
  maximumCount: number,
): value is string[] {
  return Array.isArray(value)
    && value.length <= maximumCount
    && value.every((entry) => isSafeText(entry, MAX_TEXT_LENGTH))
}

function isSafeText(value: unknown, maximumLength: number): value is string {
  return typeof value === 'string'
    && value.length <= maximumLength
    && [...value].every((character) => {
      const code = character.charCodeAt(0)
      return code >= 32 && code !== 127
    })
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

function isFiniteBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= minimum
    && value <= maximum
}

function includesString(
  values: readonly string[],
  value: unknown,
): value is string {
  return typeof value === 'string' && values.includes(value)
}

function hasExactKeys(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function hasOnlyAndRequiredKeys(
  value: Readonly<Record<string, unknown>>,
  required: readonly string[],
  optional: readonly string[],
): boolean {
  const actual = Object.keys(value)
  const allowed = new Set([...required, ...optional])
  return required.every((key) => Object.hasOwn(value, key))
    && actual.every((key) => allowed.has(key))
    && actual.every((key) => value[key] !== undefined)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value, new Set()))
}

function canonicalize(
  value: unknown,
  seen: Set<object>,
): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw invalid('Non-finite number rejected.')
    return value
  }
  if (
    value === undefined
    || typeof value === 'function'
    || typeof value === 'symbol'
    || typeof value === 'bigint'
  ) throw invalid('Non-JSON value rejected.')
  if (typeof value !== 'object') throw invalid('Unsupported value rejected.')
  if (seen.has(value)) throw invalid('Cyclic value rejected.')
  seen.add(value)
  try {
    if (Array.isArray(value)) {
      return value.map((entry) => canonicalize(entry, seen))
    }
    if (!isRecord(value)) throw invalid('Non-plain object rejected.')
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value).sort()) {
      const entry = value[key]
      if (entry === undefined) throw invalid('Undefined property rejected.')
      result[key] = canonicalize(entry, seen)
    }
    return result
  } finally {
    seen.delete(value)
  }
}

function invalid(message: string): Error {
  return new Error(message)
}
