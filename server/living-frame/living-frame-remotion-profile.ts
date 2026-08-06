import type {
  LivingFrameApprovedLayerLineage,
  LivingFrameApprovedLineageBinding,
} from '../../src/types/living-frame-approved-lineage-binding'
import type {
  LivingFrameChoreographyBinding,
} from '../../src/types/living-frame-choreography-binding'
import type {
  LivingFrameRemotionCameraProfile,
  LivingFrameRemotionLayerProfile,
  LivingFrameRemotionProfile,
  LivingFrameRemotionProfileAuthorityBoundary,
  LivingFrameRemotionProfileDraft,
  LivingFrameRemotionProfileMetrics,
  LivingFrameRemotionProfileOpenGate,
  LivingFrameRemotionProfileState,
} from '../../src/types/living-frame-remotion-profile'
import {
  LIVING_FRAME_PROJECTED_LAYER_PRIMITIVES,
} from '../../src/types/living-frame-render-projection'
import {
  LIVING_FRAME_REMOTION_PROFILE_CLASS,
  LIVING_FRAME_REMOTION_PROFILE_ID,
  LIVING_FRAME_REMOTION_PROFILE_OPEN_GATES,
  LIVING_FRAME_REMOTION_PROFILE_VERSION,
} from '../../src/types/living-frame-remotion-profile'
import type {
  LivingFrameRendererLayerBinding,
  LivingFrameRendererPlanBinding,
} from '../../src/types/living-frame-renderer-plan-binding'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameApprovedLineageBindingDigest,
} from './living-frame-approved-lineage-binding'
import {
  verifyLivingFrameChoreographyBindingDigest,
} from './living-frame-choreography-binding'
import {
  verifyLivingFrameRendererPlanBindingDigest,
} from './living-frame-renderer-plan-binding'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_LAYER_COUNT = 128
const MAX_TRACK_COUNT = 4_096
const MAX_SAMPLE_COUNT = 250_000

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
] as const

const FIT_MODES = [
  'cover',
  'contain',
  'fill',
  'safe_contain',
  'panel_contain',
] as const

const BASE_OPEN_GATES: readonly LivingFrameRemotionProfileOpenGate[] = [
  'canonical_selected_living_frame_scene_component_ref_required',
  'canonical_living_frame_renderer_binding_component_ref_required',
  'canonical_living_frame_choreography_binding_component_ref_required',
  'canonical_renderer_layer_extension_required',
  'canonical_motion_track_sample_projection_required',
  'canonical_artifact_commitment_required',
  'canonical_artifact_qa_required',
  'offline_remotion_protocol_profile_admission_required',
  'canonical_private_remotion_execution_binding_required',
  'canonical_private_remotion_review_required',
]

const AUTHORITY_BOUNDARY:
  LivingFrameRemotionProfileAuthorityBoundary = Object.freeze({
    profileCandidateOnly: true,
    selectedSceneAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    assetManifestMutationAuthority: false,
    artifactQaAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    remotionProtocolAuthority: false,
    remotionExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameRemotionProfileInput {
  readonly rendererPlanBinding: LivingFrameRendererPlanBinding
  readonly choreographyBinding: LivingFrameChoreographyBinding
  readonly approvedLineageBinding: LivingFrameApprovedLineageBinding
}

export function compileLivingFrameRemotionProfile(
  input: CompileLivingFrameRemotionProfileInput,
): LivingFrameRemotionProfile {
  assertInput(input)
  const lineageByLayer = new Map(
    input.approvedLineageBinding.rendererLayerLineage.map((entry) => [
      entry.rendererLayerId,
      entry,
    ]),
  )
  const layers = input.rendererPlanBinding.layerBindings.map(
    (layer) => compileLayer(layer, lineageByLayer.get(layer.rendererLayerId)),
  )
  const cameras = input.rendererPlanBinding.cameraBindings.map((camera) => ({
    componentId: camera.projectedComponentId,
    motionTrackIds: [...camera.motionTrackIds],
    motionSampleCount: camera.motionSampleCount,
  }))
  const semanticProfile = {
    attentionEventIds: input.choreographyBinding.attentionBindings
      .map((entry) => entry.attentionEventId),
    semanticScaleRequestIds:
      input.choreographyBinding.semanticScaleBindings
        .map((entry) => entry.semanticScaleRequestId)
        .sort(),
    soundRequestIds: input.choreographyBinding.soundRequestProjections
      .map((entry) => entry.soundRequestId),
    exactFramesStillOwnedByMasterTiming: true,
    exactSoundCuesAndMixStillOwnedBySoundSync: true,
  } as const
  const openGateCodes = compileOpenGates(input)
  const profileState = stateFor(input)
  const metrics = compileMetrics({
    layers,
    cameras,
    captionLayerCount:
      input.rendererPlanBinding.captionLayerIds.length,
    attentionEventCount: semanticProfile.attentionEventIds.length,
    semanticScaleRequestCount:
      semanticProfile.semanticScaleRequestIds.length,
    soundRequestCount: semanticProfile.soundRequestIds.length,
  })
  const draft: LivingFrameRemotionProfileDraft = {
    contractVersion: LIVING_FRAME_REMOTION_PROFILE_VERSION,
    compositionProfileId: LIVING_FRAME_REMOTION_PROFILE_ID,
    profileClass: LIVING_FRAME_REMOTION_PROFILE_CLASS,
    sceneId: input.rendererPlanBinding.sceneId,
    canonicalScope: {
      ...input.approvedLineageBinding.canonicalScope,
    },
    outputFrame: {
      outputFrameId:
        input.rendererPlanBinding.sourceBindings.outputFrameId,
      outputFrameDigestSha256:
        input.rendererPlanBinding.sourceBindings.outputFrameDigestSha256,
    },
    masterTiming: {
      masterTimingPlanId:
        input.rendererPlanBinding.sourceBindings.masterTimingPlanId,
      masterTimingPlanDigestSha256:
        input.rendererPlanBinding.sourceBindings
          .masterTimingPlanDigestSha256,
    },
    sourceBindings: {
      rendererPlanBindingDigestSha256:
        input.rendererPlanBinding.bindingDigestSha256,
      choreographyBindingDigestSha256:
        input.choreographyBinding.bindingDigestSha256,
      approvedLineageBindingDigestSha256:
        input.approvedLineageBinding.bindingDigestSha256,
      approvedSnapshotId:
        input.approvedLineageBinding.sourceBindings.approvedSnapshotId,
      approvedSnapshotHashSha256:
        input.approvedLineageBinding.sourceBindings
          .approvedSnapshotHashSha256,
      approvedPlanId:
        input.approvedLineageBinding.sourceBindings.approvedPlanId,
      approvedPlanVersion:
        input.approvedLineageBinding.sourceBindings.approvedPlanVersion,
      approvedPlanHashSha256:
        input.approvedLineageBinding.sourceBindings
          .approvedPlanHashSha256,
      approvedWorkGraphHashSha256:
        input.approvedLineageBinding.sourceBindings
          .approvedWorkGraphHashSha256,
      approvedTimingHashSha256:
        input.approvedLineageBinding.sourceBindings
          .approvedTimingHashSha256,
      approvedAssetManifestHashSha256:
        input.approvedLineageBinding.sourceBindings
          .approvedAssetManifestHashSha256,
      canonicalRendererPlanRefSha256:
        input.approvedLineageBinding.sourceBindings
          .canonicalRendererPlanRefSha256,
      canonicalRendererPlanDigestSha256:
        input.approvedLineageBinding.sourceBindings
          .canonicalRendererPlanDigestSha256,
    },
    layers,
    cameras,
    captionLayerIds: [
      ...input.rendererPlanBinding.captionLayerIds,
    ].sort(),
    semanticProfile,
    profileState,
    openGateCodes,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    existingRendererCompositionPlanRemainsAuthority: true,
    existingMasterTimingAndSoundSyncRemainAuthority: true,
    existingApprovedSnapshotWorkGraphAndAssetManifestRemainAuthority: true,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsProviderToolJobQueueCostOrCommercialRoute: false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
    remotionExecutionStillForbidden: true,
  }
  return {
    ...draft,
    profileDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameRemotionProfileDigest(
  value: unknown,
): value is LivingFrameRemotionProfile {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'compositionProfileId',
      'profileClass',
      'sceneId',
      'canonicalScope',
      'outputFrame',
      'masterTiming',
      'sourceBindings',
      'layers',
      'cameras',
      'captionLayerIds',
      'semanticProfile',
      'profileState',
      'openGateCodes',
      'metrics',
      'authorityBoundary',
      'existingRendererCompositionPlanRemainsAuthority',
      'existingMasterTimingAndSoundSyncRemainAuthority',
      'existingApprovedSnapshotWorkGraphAndAssetManifestRemainAuthority',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsProviderToolJobQueueCostOrCommercialRoute',
      'containsExecutableCodeOrCommands',
      'subjectSpecificRouting',
      'remotionExecutionStillForbidden',
      'profileDigestSha256',
    ])) return false
    const profile = value as unknown as LivingFrameRemotionProfile
    const { profileDigestSha256, ...draft } = profile
    if (
      profileDigestSha256 !== sha256AuthorityValue(draft)
      || profile.contractVersion !== LIVING_FRAME_REMOTION_PROFILE_VERSION
      || profile.compositionProfileId !== LIVING_FRAME_REMOTION_PROFILE_ID
      || profile.profileClass !== LIVING_FRAME_REMOTION_PROFILE_CLASS
      || !SAFE_ID.test(profile.sceneId)
      || !validateScope(profile.canonicalScope)
      || !validateOutputFrame(profile.outputFrame)
      || !validateMasterTiming(profile.masterTiming)
      || !validateSourceBindings(profile.sourceBindings)
      || !validateLayers(profile.layers)
      || !validateCameras(profile.cameras)
      || !validateStringArray(profile.captionLayerIds, true)
      || !validateSemanticProfile(profile.semanticProfile)
      || !validateMetrics(profile.metrics)
      || !validateBoundary(profile.authorityBoundary)
      || profile.existingRendererCompositionPlanRemainsAuthority !== true
      || profile.existingMasterTimingAndSoundSyncRemainAuthority !== true
      || profile.existingApprovedSnapshotWorkGraphAndAssetManifestRemainAuthority
        !== true
      || profile.containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || profile.containsProviderToolJobQueueCostOrCommercialRoute !== false
      || profile.containsExecutableCodeOrCommands !== false
      || profile.subjectSpecificRouting !== false
      || profile.remotionExecutionStillForbidden !== true
    ) return false
    const expectedMetrics = compileMetrics({
      layers: profile.layers,
      cameras: profile.cameras,
      captionLayerCount: profile.captionLayerIds.length,
      attentionEventCount:
        profile.semanticProfile.attentionEventIds.length,
      semanticScaleRequestCount:
        profile.semanticProfile.semanticScaleRequestIds.length,
      soundRequestCount: profile.semanticProfile.soundRequestIds.length,
    })
    return stableAuthorityStringify(profile.metrics)
        === stableAuthorityStringify(expectedMetrics)
      && validateGateSet(profile.openGateCodes)
      && stateMatchesGates(profile)
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRemotionProfileInput,
): void {
  const { rendererPlanBinding, choreographyBinding, approvedLineageBinding } =
    input
  if (
    !verifyLivingFrameRendererPlanBindingDigest(rendererPlanBinding)
    || !verifyLivingFrameChoreographyBindingDigest(choreographyBinding)
    || !verifyLivingFrameApprovedLineageBindingDigest(
      approvedLineageBinding,
    )
  ) throw invalid('Living Frame Remotion profile input is invalid.')
  if (
    rendererPlanBinding.sceneId !== choreographyBinding.sceneId
    || rendererPlanBinding.sceneId !== approvedLineageBinding.sceneId
    || approvedLineageBinding.sourceBindings
      .rendererPlanBindingDigestSha256
      !== rendererPlanBinding.bindingDigestSha256
    || approvedLineageBinding.sourceBindings
      .choreographyBindingDigestSha256
      !== choreographyBinding.bindingDigestSha256
    || rendererPlanBinding.sourceBindings
      .deterministicMotionBundleDigestSha256
      !== choreographyBinding.sourceBindings
        .deterministicMotionBundleDigestSha256
    || rendererPlanBinding.sourceBindings.masterTimingPlanId
      !== choreographyBinding.sourceBindings.masterTimingPlanId
    || rendererPlanBinding.sourceBindings.masterTimingPlanDigestSha256
      !== choreographyBinding.sourceBindings
        .masterTimingPlanDigestSha256
    || rendererPlanBinding.sourceBindings.outputFrameId
      !== choreographyBinding.sourceBindings.outputFrameId
    || rendererPlanBinding.sourceBindings.outputFrameDigestSha256
      !== choreographyBinding.sourceBindings.outputFrameDigestSha256
  ) throw invalid(
    'Living Frame renderer, choreography, or approved lineage is stale.',
  )
  if (
    rendererPlanBinding.layerBindings.length < 1
    || rendererPlanBinding.layerBindings.length > MAX_LAYER_COUNT
    || rendererPlanBinding.layerBindings.length
      !== approvedLineageBinding.rendererLayerLineage.length
  ) throw invalid('Living Frame Remotion layer lineage is incomplete.')
  const rendererTrackIds = new Set(
    rendererPlanBinding.layerBindings.flatMap((entry) =>
      entry.motionTrackIds)
      .concat(rendererPlanBinding.cameraBindings.flatMap((entry) =>
        entry.motionTrackIds)),
  )
  const choreographyTrackIds = new Set(
    choreographyBinding.boundMotionTracks.map((entry) => entry.trackId),
  )
  if (
    rendererTrackIds.size > MAX_TRACK_COUNT
    || [...choreographyTrackIds].some((trackId) =>
      !rendererTrackIds.has(trackId))
  ) throw invalid(
    'Living Frame choreography references motion outside the renderer profile.',
  )
}

function compileLayer(
  layer: LivingFrameRendererLayerBinding,
  lineage: LivingFrameApprovedLayerLineage | undefined,
): LivingFrameRemotionLayerProfile {
  if (
    !lineage
    || lineage.projectedComponentId !== layer.projectedComponentId
    || lineage.lineageState
      !== 'covered_by_exact_approved_work_output_and_planned_asset'
    || lineage.approvedWorkItemId === null
    || lineage.approvedWorkItemKey === null
    || lineage.outputKey === null
    || lineage.plannedAssetManifestEntryId === null
  ) throw invalid(
    'Living Frame layer lacks exact approved work and asset lineage.',
  )
  return {
    order: layer.order,
    componentId: layer.projectedComponentId,
    rendererLayerId: layer.rendererLayerId,
    rendererLayerType: layer.rendererLayerType,
    fitMode: layer.fitMode,
    zIndex: layer.zIndex,
    primitive: layer.primitive,
    artifact: { ...layer.artifact },
    maskArtifact: layer.maskArtifact
      ? { ...layer.maskArtifact }
      : null,
    zonePixels: { ...layer.zonePixels },
    motionTrackIds: [...layer.motionTrackIds],
    motionSampleCount: layer.motionSampleCount,
    approvedWorkItemId: lineage.approvedWorkItemId,
    approvedWorkItemKey: lineage.approvedWorkItemKey,
    approvedOutputKey: lineage.outputKey,
    plannedAssetManifestEntryId:
      lineage.plannedAssetManifestEntryId,
  }
}

function compileOpenGates(
  input: CompileLivingFrameRemotionProfileInput,
): LivingFrameRemotionProfileOpenGate[] {
  const gates = new Set(BASE_OPEN_GATES)
  if (
    input.approvedLineageBinding.openGateCodes.includes(
      'approved_work_output_lineage_incomplete',
    )
  ) gates.add('approved_work_output_lineage_incomplete')
  if (
    input.approvedLineageBinding.openGateCodes.includes(
      'approved_asset_manifest_lineage_incomplete',
    )
  ) gates.add('approved_asset_manifest_lineage_incomplete')
  if (
    input.rendererPlanBinding.bindingState
      !== 'candidate_pending_canonical_snapshot_projection'
  ) gates.add('renderer_projection_blocked')
  if (
    input.choreographyBinding.bindingState
      !== 'candidate_pending_canonical_timing_soundsync_and_snapshot'
  ) gates.add('choreography_projection_blocked')
  return [...gates].sort()
}

function stateFor(
  input: CompileLivingFrameRemotionProfileInput,
): LivingFrameRemotionProfileState {
  return input.approvedLineageBinding.bindingState
      === 'blocked_by_canonical_living_frame_component_admission'
    && input.rendererPlanBinding.bindingState
      === 'candidate_pending_canonical_snapshot_projection'
    && input.choreographyBinding.bindingState
      === 'candidate_pending_canonical_timing_soundsync_and_snapshot'
    ? 'blocked_by_canonical_component_admission'
    : 'blocked_by_renderer_choreography_or_lineage'
}

function compileMetrics(input: {
  readonly layers: readonly LivingFrameRemotionLayerProfile[]
  readonly cameras: readonly LivingFrameRemotionCameraProfile[]
  readonly captionLayerCount: number
  readonly attentionEventCount: number
  readonly semanticScaleRequestCount: number
  readonly soundRequestCount: number
}): LivingFrameRemotionProfileMetrics {
  const motionTrackIds = new Set([
    ...input.layers.flatMap((entry) => entry.motionTrackIds),
    ...input.cameras.flatMap((entry) => entry.motionTrackIds),
  ])
  return {
    layerCount: input.layers.length,
    cameraCount: input.cameras.length,
    motionTrackCount: motionTrackIds.size,
    motionSampleCount: input.layers.reduce(
      (total, entry) => total + entry.motionSampleCount,
      0,
    ) + input.cameras.reduce(
      (total, entry) => total + entry.motionSampleCount,
      0,
    ),
    captionLayerCount: input.captionLayerCount,
    attentionEventCount: input.attentionEventCount,
    semanticScaleRequestCount: input.semanticScaleRequestCount,
    soundRequestCount: input.soundRequestCount,
  }
}

function validateScope(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['workspaceId', 'projectId', 'editSessionId'])
    && [value.workspaceId, value.projectId, value.editSessionId]
      .every((item) => typeof item === 'string' && SAFE_ID.test(item))
}

function validateOutputFrame(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'outputFrameId',
      'outputFrameDigestSha256',
    ])
    && typeof value.outputFrameId === 'string'
    && SAFE_ID.test(value.outputFrameId)
    && typeof value.outputFrameDigestSha256 === 'string'
    && SHA256.test(value.outputFrameDigestSha256)
}

function validateMasterTiming(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'masterTimingPlanId',
      'masterTimingPlanDigestSha256',
    ])
    && typeof value.masterTimingPlanId === 'string'
    && SAFE_ID.test(value.masterTimingPlanId)
    && typeof value.masterTimingPlanDigestSha256 === 'string'
    && SHA256.test(value.masterTimingPlanDigestSha256)
}

function validateSourceBindings(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'rendererPlanBindingDigestSha256',
    'choreographyBindingDigestSha256',
    'approvedLineageBindingDigestSha256',
    'approvedSnapshotId',
    'approvedSnapshotHashSha256',
    'approvedPlanId',
    'approvedPlanVersion',
    'approvedPlanHashSha256',
    'approvedWorkGraphHashSha256',
    'approvedTimingHashSha256',
    'approvedAssetManifestHashSha256',
    'canonicalRendererPlanRefSha256',
    'canonicalRendererPlanDigestSha256',
  ])) return false
  return [
    value.rendererPlanBindingDigestSha256,
    value.choreographyBindingDigestSha256,
    value.approvedLineageBindingDigestSha256,
    value.approvedSnapshotHashSha256,
    value.approvedPlanHashSha256,
    value.approvedWorkGraphHashSha256,
    value.approvedTimingHashSha256,
    value.approvedAssetManifestHashSha256,
    value.canonicalRendererPlanRefSha256,
    value.canonicalRendererPlanDigestSha256,
  ].every((item) => typeof item === 'string' && SHA256.test(item))
    && [value.approvedSnapshotId, value.approvedPlanId]
      .every((item) => typeof item === 'string' && SAFE_ID.test(item))
    && Number.isSafeInteger(value.approvedPlanVersion)
    && Number(value.approvedPlanVersion) >= 1
}

function validateLayers(
  value: readonly LivingFrameRemotionLayerProfile[],
): boolean {
  if (
    !Array.isArray(value)
    || value.length < 1
    || value.length > MAX_LAYER_COUNT
  ) return false
  const ids = new Set<string>()
  let expectedOrder = 0
  let totalSamples = 0
  for (const layer of value) {
    if (
      !isRecord(layer)
      || !hasExactKeys(layer, [
        'order',
        'componentId',
        'rendererLayerId',
        'rendererLayerType',
        'fitMode',
        'zIndex',
        'primitive',
        'artifact',
        'maskArtifact',
        'zonePixels',
        'motionTrackIds',
        'motionSampleCount',
        'approvedWorkItemId',
        'approvedWorkItemKey',
        'approvedOutputKey',
        'plannedAssetManifestEntryId',
      ])
      || layer.order !== expectedOrder
      || typeof layer.componentId !== 'string'
      || !SAFE_ID.test(layer.componentId)
      || typeof layer.rendererLayerId !== 'string'
      || !SAFE_ID.test(layer.rendererLayerId)
      || ids.has(layer.rendererLayerId)
      || !(RENDERER_LAYER_TYPES as readonly unknown[])
        .includes(layer.rendererLayerType)
      || !(FIT_MODES as readonly unknown[]).includes(layer.fitMode)
      || !Number.isSafeInteger(layer.zIndex)
      || !(LIVING_FRAME_PROJECTED_LAYER_PRIMITIVES as readonly unknown[])
        .includes(layer.primitive)
      || !validateArtifactRef(layer.artifact)
      || !(layer.maskArtifact === null
        || validateArtifactRef(layer.maskArtifact))
      || !validateZone(layer.zonePixels)
      || !validateStringArray(layer.motionTrackIds, false)
      || !Number.isSafeInteger(layer.motionSampleCount)
      || Number(layer.motionSampleCount) < 0
      || [
        layer.approvedWorkItemId,
        layer.approvedWorkItemKey,
        layer.approvedOutputKey,
        layer.plannedAssetManifestEntryId,
      ].some((item) => typeof item !== 'string' || !SAFE_ID.test(item))
    ) return false
    ids.add(layer.rendererLayerId)
    totalSamples += Number(layer.motionSampleCount)
    expectedOrder += 1
  }
  return totalSamples <= MAX_SAMPLE_COUNT
}

function validateCameras(
  value: unknown,
): value is LivingFrameRemotionCameraProfile[] {
  if (!Array.isArray(value) || value.length > 16) return false
  const componentIds = new Set<string>()
  const trackIds = new Set<string>()
  return value.every((camera) => {
    if (
      !isRecord(camera)
      || !hasExactKeys(camera, [
        'componentId',
        'motionTrackIds',
        'motionSampleCount',
      ])
      || typeof camera.componentId !== 'string'
      || !SAFE_ID.test(camera.componentId)
      || componentIds.has(camera.componentId)
      || !validateStringArray(camera.motionTrackIds, false)
      || camera.motionTrackIds.some((trackId) => trackIds.has(trackId))
      || !Number.isSafeInteger(camera.motionSampleCount)
      || Number(camera.motionSampleCount) < 0
    ) return false
    componentIds.add(camera.componentId)
    camera.motionTrackIds.forEach((trackId) => trackIds.add(trackId))
    return true
  })
}

function validateSemanticProfile(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'attentionEventIds',
      'semanticScaleRequestIds',
      'soundRequestIds',
      'exactFramesStillOwnedByMasterTiming',
      'exactSoundCuesAndMixStillOwnedBySoundSync',
    ])
    && validateStringArray(value.attentionEventIds, false)
    && validateStringArray(value.semanticScaleRequestIds, true)
    && validateStringArray(value.soundRequestIds, false)
    && value.exactFramesStillOwnedByMasterTiming === true
    && value.exactSoundCuesAndMixStillOwnedBySoundSync === true
}

function validateMetrics(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'layerCount',
      'cameraCount',
      'motionTrackCount',
      'motionSampleCount',
      'captionLayerCount',
      'attentionEventCount',
      'semanticScaleRequestCount',
      'soundRequestCount',
    ])
    && Object.values(value).every((item) =>
      Number.isSafeInteger(item) && Number(item) >= 0)
}

function validateBoundary(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'profileCandidateOnly',
      'selectedSceneAuthority',
      'masterTimingAuthority',
      'exactFrameAuthority',
      'soundSyncAuthority',
      'estimateAuthority',
      'costAuthority',
      'approvalAuthority',
      'snapshotAuthority',
      'assetManifestMutationAuthority',
      'artifactQaAuthority',
      'providerAuthority',
      'toolRouteAuthority',
      'workGraphMutationAuthority',
      'queueAuthority',
      'remotionProtocolAuthority',
      'remotionExecutionAuthority',
      'privateReviewAuthority',
      'runtimePromotionAuthority',
      'productionAuthority',
    ])
    && value.profileCandidateOnly === true
    && Object.entries(value).every(([key, item]) =>
      key === 'profileCandidateOnly' ? item === true : item === false)
}

function validateGateSet(value: unknown): boolean {
  return Array.isArray(value)
    && value.length >= BASE_OPEN_GATES.length
    && new Set(value).size === value.length
    && [...value].every((gate) =>
      typeof gate === 'string'
      && (LIVING_FRAME_REMOTION_PROFILE_OPEN_GATES as readonly string[])
        .includes(gate))
    && [...value].every((gate, index, all) =>
      index === 0 || String(all[index - 1]) < String(gate))
    && BASE_OPEN_GATES.every((gate) => value.includes(gate))
}

function stateMatchesGates(profile: LivingFrameRemotionProfile): boolean {
  const degraded = [
    'approved_work_output_lineage_incomplete',
    'approved_asset_manifest_lineage_incomplete',
    'renderer_projection_blocked',
    'choreography_projection_blocked',
  ].some((gate) => profile.openGateCodes.includes(
    gate as LivingFrameRemotionProfileOpenGate,
  ))
  return profile.profileState === (
    degraded
      ? 'blocked_by_renderer_choreography_or_lineage'
      : 'blocked_by_canonical_component_admission'
  )
}

function validateStringArray(
  value: unknown,
  sorted: boolean,
): value is string[] {
  if (
    !Array.isArray(value)
    || new Set(value).size !== value.length
    || value.some((item) =>
      typeof item !== 'string' || !SAFE_ID.test(item))
  ) return false
  return !sorted || value.every((item, index) =>
    index === 0 || String(value[index - 1]) < item)
}

function validateArtifactRef(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['artifactId', 'artifactDigestSha256'])
    && typeof value.artifactId === 'string'
    && SAFE_ID.test(value.artifactId)
    && typeof value.artifactDigestSha256 === 'string'
    && SHA256.test(value.artifactDigestSha256)
}

function validateZone(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['x', 'y', 'width', 'height'])
    && [value.x, value.y, value.width, value.height]
      .every((item) => Number.isSafeInteger(item) && Number(item) >= 0)
    && Number(value.width) > 0
    && Number(value.height) > 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|')
    === [...keys].sort().join('|')
}

function invalid(message: string): Error {
  return new Error(message)
}
