import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

import {
  createCaptionRemotionRenderSpec,
  createCaptionRemotionSceneGroup,
  parseCaptionRemotionRenderSpec,
  parseCaptionRemotionSceneGroup,
} from '../captions-specialist/caption-remotion-scene-group'
import {
  isCaptionCreativeSceneGroupPayload,
  OFFLINE_REMOTION_RENDER_OPERATION,
  OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
  validateOfflineRemotionRenderRequest,
  type OfflineRemotionCaptionCreativeSceneGroupPayload,
  type OfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import {
  CAP_11_SCENE_GRAPH_FIXTURE,
  CAP_11_SEMANTIC_STYLE_PLAN_FIXTURE,
} from './captions-specialist-cap-11-smoke'
import {
  CAP_12_MOTION_LOCK_FIXTURE,
  CAP_12_MOTION_PLAN_FIXTURE,
  CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
} from './captions-specialist-cap-12-smoke'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
export const CAP_14_SCENE_GROUP_FIXTURE = createCaptionRemotionSceneGroup({
  sceneGroupId: 'caption.remotion.scene-group.cap14.fixture',
  sceneGraph: CAP_11_SCENE_GRAPH_FIXTURE,
  semanticStylePlan: CAP_11_SEMANTIC_STYLE_PLAN_FIXTURE,
  motionPlan: CAP_12_MOTION_PLAN_FIXTURE,
  motionLock: CAP_12_MOTION_LOCK_FIXTURE,
  storyTimingResolution: CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
})

export const CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE = createCaptionRemotionRenderSpec({
  renderSpecId: 'caption.remotion.render-spec.cap14.full',
  sceneGroup: CAP_14_SCENE_GROUP_FIXTURE,
  motionLock: CAP_12_MOTION_LOCK_FIXTURE,
  storyTimingResolution: CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
  reducedMotion: false,
})

export const CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE = createCaptionRemotionRenderSpec({
  renderSpecId: 'caption.remotion.render-spec.cap14.reduced',
  sceneGroup: CAP_14_SCENE_GROUP_FIXTURE,
  motionLock: CAP_12_MOTION_LOCK_FIXTURE,
  storyTimingResolution: CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
  reducedMotion: true,
})

function requestFor(spec: typeof CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE):
OfflineRemotionRenderRequest & {
  payload: OfflineRemotionCaptionCreativeSceneGroupPayload
} {
  const request = validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: spec.rendererPayload,
  })
  if (!isCaptionCreativeSceneGroupPayload(request.payload)) {
    throw new Error('CAP-14 renderer request lost its Caption scene-group profile.')
  }
  return request as OfflineRemotionRenderRequest & {
    payload: OfflineRemotionCaptionCreativeSceneGroupPayload
  }
}

export const CAP_14_FULL_MOTION_REMOTION_REQUEST_FIXTURE = requestFor(
  CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE,
)
export const CAP_14_REDUCED_MOTION_REMOTION_REQUEST_FIXTURE = requestFor(
  CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE,
)

export function runCap14Smoke(): void {
  const group = CAP_14_SCENE_GROUP_FIXTURE
  const full = CAP_14_FULL_MOTION_RENDER_SPEC_FIXTURE
  const reduced = CAP_14_REDUCED_MOTION_RENDER_SPEC_FIXTURE
  const fullRequest = CAP_14_FULL_MOTION_REMOTION_REQUEST_FIXTURE
  const reducedRequest = CAP_14_REDUCED_MOTION_REMOTION_REQUEST_FIXTURE

  check(group.layers.length === CAP_11_SCENE_GRAPH_FIXTURE.nodes.length,
    'Every resolved Caption node must become one typed Remotion layer.')
  check(group.maximumConcurrentLayerCount === 2,
    'The fixture must prove two simultaneous tracks without visual overload.')
  check(group.layers.some((layer) =>
    layer.presentationKind === 'stable_accessible_caption'),
  'The scene group must preserve the complete stable accessibility track.')
  check(group.layers.some((layer) =>
    layer.presentationKind === 'hero_typography'),
  'The scene group must preserve bounded hero typography.')
  check(group.layers.some((layer) =>
    layer.presentationKind === 'persistent_topic_list'),
  'The scene group must preserve its persistent-list presentation.')
  check(group.layers.some((layer) =>
    layer.dependencyDisposition === 'declared_safe_fallback'),
  'Unqualified mask, anchor, and B-roll dependencies must remain explicit fallbacks.')
  check(group.trackAllEvidenceClaimed === false,
    'The deterministic subject fixture must not be relabeled as Track All evidence.')
  check(group.fallbackProfileId === 'approved_timed_full_frame_rgba_track',
    'The stable full-frame RGBA track must remain the exact legacy fallback.')
  check(group.confirmedOutputFrame.width === 1_920
    && group.confirmedOutputFrame.height === 1_080,
  'The Caption scene group must retain the exact confirmed customer frame.')
  check(full.reviewFrame.width === 640 && full.reviewFrame.height === 360
    && full.reviewFrame.privateReviewProxyOnly
    && full.reviewFrame.finalCustomerCanvasClaimed === false,
  'The bounded renderer fixture must disclose that it is not the final customer canvas.')
  check(full.goldenFrameNumbers.join('|') === '0|29|89|149|209|269|329|359',
    'Golden frames must cover every exact phrase interval plus both boundaries.')
  check(full.reducedMotion === false && reduced.reducedMotion === true,
    'Full and reduced-motion specs must be distinct.')
  check(JSON.stringify(full.rendererPayload.layers)
    === JSON.stringify(reduced.rendererPayload.layers),
  'Reduced motion must preserve text, layout, depth, and StoryTiming semantics.')
  check(full.rendererPayload.storyTimingResolutionDigestSha256
    === CAP_12_STORYTIMING_RESOLUTION_FIXTURE.resolutionDigestSha256,
  'The renderer payload must bind exact StoryTiming lineage.')
  check(full.rendererPayload.motionLockDigestSha256
    === CAP_12_MOTION_LOCK_FIXTURE.lockDigestSha256,
  'The renderer payload must bind the exact Caption motion lock.')
  check(full.canonicalOperationId === 'tool.remotion.render_approved_composition.v1',
    'CAP-14 must reuse the canonical Remotion operation identity.')
  check(isCaptionCreativeSceneGroupPayload(fullRequest.payload)
    && isCaptionCreativeSceneGroupPayload(reducedRequest.payload),
  'Both motion variants must pass the shared renderer boundary.')
  check(fullRequest.payload.compositionProfileId
    === 'caption_direction_creative_scene_group_v1',
  'The additive Caption profile must not replace a legacy composition identity.')
  check(full.finalCustomerCanvasClaimed === false
    && full.runtimeExecutionGranted === false
    && full.productionAuthorityGranted === false,
  'A source render spec must not claim execution, customer canvas, or production.')

  const staleGroup = structuredClone(group)
  staleGroup.layers[0]!.text = 'Stale text'
  expectThrow(() => parseCaptionRemotionSceneGroup(staleGroup))

  const duplicateLayer = structuredClone(group)
  duplicateLayer.layers[1]!.layerId = duplicateLayer.layers[0]!.layerId
  duplicateLayer.sceneGroupDigestSha256 = calculateSkillContractDigest(
    duplicateLayer as unknown as Record<string, unknown>, 'sceneGroupDigestSha256')
  expectThrow(() => parseCaptionRemotionSceneGroup(duplicateLayer))

  const counterfeitCounterpart = structuredClone(group)
  counterfeitCounterpart.layers[0]!.accessibilityCounterpartNodeId =
    counterfeitCounterpart.layers[3]!.nodeId
  counterfeitCounterpart.sceneGroupDigestSha256 = calculateSkillContractDigest(
    counterfeitCounterpart as unknown as Record<string, unknown>,
    'sceneGroupDigestSha256')
  expectThrow(() => parseCaptionRemotionSceneGroup(counterfeitCounterpart))

  const reorderedGroup = structuredClone(group)
  const firstLayer = reorderedGroup.layers[0]!
  reorderedGroup.layers[0] = reorderedGroup.layers[1]!
  reorderedGroup.layers[1] = firstLayer
  reorderedGroup.sceneGroupDigestSha256 = calculateSkillContractDigest(
    reorderedGroup as unknown as Record<string, unknown>, 'sceneGroupDigestSha256')
  expectThrow(() => parseCaptionRemotionSceneGroup(reorderedGroup))

  const excessiveConcurrency = structuredClone(group)
  for (const layer of excessiveConcurrency.layers.slice(0, 6)) {
    layer.frameRange = { startFrame: 0, endFrameExclusive: 60 }
    layer.stableReadRange = { startFrame: 8, endFrameExclusive: 52 }
    layer.reducedMotion.frameRange = { startFrame: 0, endFrameExclusive: 60 }
  }
  excessiveConcurrency.layers.sort((left, right) =>
    left.frameRange.startFrame - right.frameRange.startFrame
      || left.zIndex - right.zIndex || left.layerId.localeCompare(right.layerId))
  excessiveConcurrency.maximumConcurrentLayerCount = 6
  excessiveConcurrency.sceneGroupDigestSha256 = calculateSkillContractDigest(
    excessiveConcurrency as unknown as Record<string, unknown>,
    'sceneGroupDigestSha256')
  expectThrow(() => parseCaptionRemotionSceneGroup(excessiveConcurrency))

  const parallelClock = structuredClone(group)
  parallelClock.captionProducedParallelClock = true as false
  parallelClock.sceneGroupDigestSha256 = calculateSkillContractDigest(
    parallelClock as unknown as Record<string, unknown>, 'sceneGroupDigestSha256')
  expectThrow(() => parseCaptionRemotionSceneGroup(parallelClock))

  const wrongRatio = structuredClone(group)
  wrongRatio.confirmedOutputFrame.aspectRatioNumerator = 4
  wrongRatio.confirmedOutputFrame.aspectRatioDenominator = 3
  wrongRatio.sceneGroupDigestSha256 = calculateSkillContractDigest(
    wrongRatio as unknown as Record<string, unknown>, 'sceneGroupDigestSha256')
  expectThrow(() => parseCaptionRemotionSceneGroup(wrongRatio))

  const inherited = Object.create(group) as typeof group
  expectThrow(() => parseCaptionRemotionSceneGroup(inherited))

  const extraCss = structuredClone(full)
  ;(extraCss.rendererPayload.layers[0] as unknown as Record<string, unknown>).css = {
    position: 'fixed',
  }
  extraCss.renderSpecDigestSha256 = calculateSkillContractDigest(
    extraCss as unknown as Record<string, unknown>, 'renderSpecDigestSha256')
  expectThrow(() => parseCaptionRemotionRenderSpec(extraCss, group))

  const substitutedLayer = structuredClone(full)
  substitutedLayer.rendererPayload.layers[0]!.text = 'Digest-valid substituted text'
  substitutedLayer.renderSpecDigestSha256 = calculateSkillContractDigest(
    substitutedLayer as unknown as Record<string, unknown>, 'renderSpecDigestSha256')
  expectThrow(() => parseCaptionRemotionRenderSpec(substitutedLayer, group))

  const incompleteGoldenCoverage = structuredClone(full)
  incompleteGoldenCoverage.goldenFrameNumbers.splice(1, 1)
  incompleteGoldenCoverage.renderSpecDigestSha256 = calculateSkillContractDigest(
    incompleteGoldenCoverage as unknown as Record<string, unknown>,
    'renderSpecDigestSha256')
  expectThrow(() => parseCaptionRemotionRenderSpec(incompleteGoldenCoverage, group))

  const finalCanvasOverclaim = structuredClone(full)
  finalCanvasOverclaim.finalCustomerCanvasClaimed = true as false
  finalCanvasOverclaim.renderSpecDigestSha256 = calculateSkillContractDigest(
    finalCanvasOverclaim as unknown as Record<string, unknown>, 'renderSpecDigestSha256')
  expectThrow(() => parseCaptionRemotionRenderSpec(finalCanvasOverclaim, group))

  const wrongScale = structuredClone(fullRequest)
  wrongScale.payload.privateReviewScaleDenominator = 2 as 3
  expectThrow(() => validateOfflineRemotionRenderRequest(wrongScale))

  const reordered = structuredClone(fullRequest)
  const first = reordered.payload.layers[0]!
  reordered.payload.layers[0] = reordered.payload.layers[1]!
  reordered.payload.layers[1] = first
  expectThrow(() => validateOfflineRemotionRenderRequest(reordered))

  const accessibleBelowVisuals = structuredClone(fullRequest)
  const accessible = accessibleBelowVisuals.payload.layers.find((layer) =>
    layer.presentationKind === 'stable_accessible_caption')!
  accessible.zIndex = 700
  expectThrow(() => validateOfflineRemotionRenderRequest(accessibleBelowVisuals))

  const missingAdmittedEvidence = structuredClone(fullRequest)
  missingAdmittedEvidence.payload.layers[0]!.dependencyDisposition =
    'admitted_exact_private_evidence'
  expectThrow(() => validateOfflineRemotionRenderRequest(missingAdmittedEvidence))

  const reducedTimingDrift = structuredClone(reducedRequest)
  reducedTimingDrift.payload.layers[0]!.reducedMotion.frameRange.startFrame += 1
  expectThrow(() => validateOfflineRemotionRenderRequest(reducedTimingDrift))

  const unsafeText = structuredClone(fullRequest)
  unsafeText.payload.layers[0]!.text = 'file:///tmp/private-caption.txt'
  expectThrow(() => validateOfflineRemotionRenderRequest(unsafeText))

  const unknownProfile = structuredClone(fullRequest)
  unknownProfile.payload.compositionProfileId = 'caption_direction_unknown_v1' as
    'caption_direction_creative_scene_group_v1'
  expectThrow(() => validateOfflineRemotionRenderRequest(unknownProfile))

  const productionOverclaim = structuredClone(full)
  productionOverclaim.productionAuthorityGranted = true as false
  productionOverclaim.renderSpecDigestSha256 = calculateSkillContractDigest(
    productionOverclaim as unknown as Record<string, unknown>, 'renderSpecDigestSha256')
  expectThrow(() => parseCaptionRemotionRenderSpec(productionOverclaim, group))

  const unclosed = structuredClone(full) as unknown as Record<string, unknown>
  unclosed.cycle = unclosed
  expectThrow(() => parseCaptionRemotionRenderSpec(unclosed, group))

  check(parseCaptionRemotionRenderSpec(full, group).renderSpecDigestSha256
    === full.renderSpecDigestSha256,
  'The closed full-motion render spec must round-trip.')
  check(parseCaptionRemotionRenderSpec(reduced, group).renderSpecDigestSha256
    === reduced.renderSpecDigestSha256,
  'The closed reduced-motion render spec must round-trip.')
  check(full.rendererPayload.layers.every((layer) =>
    layer.frameRange.startFrame === layer.reducedMotion.frameRange.startFrame
      && layer.frameRange.endFrameExclusive
        === layer.reducedMotion.frameRange.endFrameExclusive),
  'Reduced-motion counterparts must preserve exact StoryTiming ranges.')
  check(full.rendererPayload.layers.every((layer) =>
    layer.text.length > 0 && layer.exactSourceWordIds.length > 0),
  'Every rendered layer must carry text and exact source-word lineage.')
  check(full.rendererPayload.layers.filter((layer) =>
    layer.presentationKind === 'stable_accessible_caption')
    .every((layer) => layer.zIndex === 1_000),
  'Every stable accessibility layer must stay above visual layers.')
  check(full.legacyFallbackProfileId === 'approved_timed_full_frame_rgba_track',
    'CAP-14 must keep the existing timed full-frame overlay as fallback.')

  console.log(JSON.stringify({
    status: 'passed_with_runtime_and_direct_raster_inspection_pending',
    milestone: 'CAP-14',
    assertions,
    sceneGroupVersion: group.schemaVersion,
    renderSpecVersion: full.schemaVersion,
    compositionProfileId: full.compositionProfileId,
    canonicalOperationId: full.canonicalOperationId,
    layerCount: group.layers.length,
    maximumConcurrentLayerCount: group.maximumConcurrentLayerCount,
    goldenFrameNumbers: full.goldenFrameNumbers,
    confirmedOutputFrame: `${group.confirmedOutputFrame.width}x${group.confirmedOutputFrame.height}`,
    reviewProxyFrame: `${full.reviewFrame.width}x${full.reviewFrame.height}`,
    reducedMotionParityPlanned: true,
    legacyOverlayFallbackPreserved: true,
    trackAllRuntimeEvidenceClaimed: false,
    actualRemotionRenderExecuted: false,
    directRasterInspectionCompleted: false,
    productionAuthorityPromoted: false,
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCap14Smoke()
}
