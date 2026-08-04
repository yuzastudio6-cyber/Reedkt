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
  LivingFrameRemotionProfile,
} from '../../src/types/living-frame-remotion-profile'
import type {
  LivingFrameRemotionCameraMotionSampleBinding,
  LivingFrameRemotionLayerMotionSampleBinding,
  LivingFrameRemotionMotionSampleBinding,
  LivingFrameRemotionMotionSampleBindingAuthorityBoundary,
  LivingFrameRemotionMotionSampleBindingBlocker,
  LivingFrameRemotionMotionSampleBindingDraft,
  LivingFrameRemotionMotionSampleBindingMetrics,
  LivingFrameRemotionMotionSampleBindingState,
} from '../../src/types/living-frame-remotion-motion-sample-binding'
import {
  LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_BLOCKERS,
  LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_CLASS,
  LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_STATES,
  LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_VERSION,
} from '../../src/types/living-frame-remotion-motion-sample-binding'
import {
  verifyLivingFrameDeterministicMotionBundleDigest,
} from './living-frame-deterministic-motion'
import {
  verifyLivingFrameRemotionProfileDigest,
} from './living-frame-remotion-profile'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,199}$/
const MAX_TRACKS = 4_096
const MAX_SAMPLES = 250_000
const BASE_BLOCKERS = [
  'current_remotion_profile_reread_required',
  'current_motion_bundle_reread_required',
  'canonical_master_timing_revalidation_required',
  'canonical_output_frame_revalidation_required',
  'canonical_artifact_commitment_required',
  'canonical_artifact_qa_required',
  'offline_remotion_protocol_profile_admission_required',
  'canonical_private_remotion_execution_binding_required',
  'canonical_private_remotion_review_required',
] as const satisfies readonly LivingFrameRemotionMotionSampleBindingBlocker[]

const AUTHORITY_BOUNDARY:
  LivingFrameRemotionMotionSampleBindingAuthorityBoundary =
  Object.freeze({
    deterministicSampleBindingOnly: true,
    selectedSceneAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    artifactCommitmentAuthority: false,
    artifactQaAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    assetManifestMutationAuthority: false,
    remotionProtocolAuthority: false,
    remotionExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameRemotionMotionSampleBindingInput {
  readonly remotionProfile: LivingFrameRemotionProfile
  readonly motionBundle: LivingFrameDeterministicMotionBundle
}

export function compileLivingFrameRemotionMotionSampleBinding(
  input: CompileLivingFrameRemotionMotionSampleBindingInput,
): LivingFrameRemotionMotionSampleBinding {
  assertInput(input)
  const tracksById = new Map(
    input.motionBundle.tracks.map((track) => [track.trackId, track]),
  )
  const layerBindings = input.remotionProfile.layers.map(
    (layer, order) => compileLayer({
      order,
      componentId: layer.componentId,
      rendererLayerId: layer.rendererLayerId,
      motionTrackIds: layer.motionTrackIds,
      sourceProfileMotionSampleCount: layer.motionSampleCount,
      tracksById,
    }),
  )
  const cameraBindings = input.remotionProfile.cameras.map(
    (camera, order) => compileCamera({
      order,
      componentId: camera.componentId,
      motionTrackIds: camera.motionTrackIds,
      sourceProfileMotionSampleCount: camera.motionSampleCount,
      tracksById,
    }),
  )
  const sourceBlocked =
    input.remotionProfile.profileState
      === 'blocked_by_renderer_choreography_or_lineage'
  const extraBlockers = [
    ...(sourceBlocked
      ? ['source_remotion_profile_blocked' as const]
      : []),
    ...layerBindings.flatMap((entry) => entry.blockerCodes),
    ...cameraBindings.flatMap((entry) => entry.blockerCodes),
  ]
  const bindingState:
    LivingFrameRemotionMotionSampleBindingState =
    extraBlockers.length === 0
      ? 'candidate_samples_bound_pending_protocol'
      : 'blocked_by_profile_or_track_lineage'
  const draft: LivingFrameRemotionMotionSampleBindingDraft = {
    contractVersion:
      LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_VERSION,
    bindingClass:
      LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_CLASS,
    sceneId: input.remotionProfile.sceneId,
    sourceBindings: {
      remotionProfileDigestSha256:
        input.remotionProfile.profileDigestSha256,
      deterministicMotionBundleDigestSha256:
        input.motionBundle.bundleDigestSha256,
    },
    outputFrame: {
      ...input.remotionProfile.outputFrame,
    },
    masterTiming: {
      masterTimingPlanId:
        input.motionBundle.timingExpectation.masterTimingPlanId,
      masterTimingPlanDigestSha256:
        input.motionBundle.timingExpectation
          .masterTimingPlanDigestSha256,
      sceneStartFrame:
        input.motionBundle.timingExpectation.sceneStartFrame,
      sceneEndFrame:
        input.motionBundle.timingExpectation.sceneEndFrame,
      fpsNumerator:
        input.motionBundle.timingExpectation.fpsNumerator,
      fpsDenominator:
        input.motionBundle.timingExpectation.fpsDenominator,
    },
    layerBindings,
    cameraBindings,
    bindingState,
    blockerCodes: uniqueSorted([
      ...BASE_BLOCKERS,
      ...extraBlockers,
    ]),
    metrics: deriveMetrics(layerBindings, cameraBindings),
    authorityBoundary: AUTHORITY_BOUNDARY,
    existingMasterTimingRemainsAuthority: true,
    existingRemotionProfileRemainsNonExecutable: true,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
      false,
    containsProviderModelToolOperationJobQueueCostOrCommercialRoute:
      false,
    containsExecutableCodeOrCommands: false,
    createsArtifactCommitments: false,
    createsWorkItemsOrAssetManifestEntries: false,
    subjectSpecificRouting: false,
    remotionExecutionStillForbidden: true,
  }
  return sign(draft)
}

export function verifyLivingFrameRemotionMotionSampleBinding(
  value: unknown,
): value is LivingFrameRemotionMotionSampleBinding {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'bindingClass',
      'sceneId',
      'sourceBindings',
      'outputFrame',
      'masterTiming',
      'layerBindings',
      'cameraBindings',
      'bindingState',
      'blockerCodes',
      'metrics',
      'authorityBoundary',
      'existingMasterTimingRemainsAuthority',
      'existingRemotionProfileRemainsNonExecutable',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsProviderModelToolOperationJobQueueCostOrCommercialRoute',
      'containsExecutableCodeOrCommands',
      'createsArtifactCommitments',
      'createsWorkItemsOrAssetManifestEntries',
      'subjectSpecificRouting',
      'remotionExecutionStillForbidden',
      'bindingDigestSha256',
    ])) return false
    const binding =
      value as unknown as LivingFrameRemotionMotionSampleBinding
    const { bindingDigestSha256, ...draft } = binding
    if (
      !SHA256.test(bindingDigestSha256)
      || bindingDigestSha256 !== sha256AuthorityValue(draft)
      || binding.contractVersion
        !== LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_VERSION
      || binding.bindingClass
        !== LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_CLASS
      || !SAFE_ID.test(binding.sceneId)
      || !validateSourceBindings(binding.sourceBindings)
      || !validateOutputFrame(binding.outputFrame)
      || !validateMasterTiming(binding.masterTiming)
      || !validateLayerBindings(binding.layerBindings)
      || !validateCameraBindings(binding.cameraBindings)
      || !LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_STATES
        .includes(binding.bindingState)
      || !validateClosedSet(
        binding.blockerCodes,
        LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_BLOCKERS,
      )
      || stableAuthorityStringify(binding.metrics)
        !== stableAuthorityStringify(
          deriveMetrics(
            binding.layerBindings,
            binding.cameraBindings,
          ),
        )
      || !validateAuthorityBoundary(binding.authorityBoundary)
      || binding.existingMasterTimingRemainsAuthority !== true
      || binding.existingRemotionProfileRemainsNonExecutable !== true
      || binding
        .containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
        !== false
      || binding
        .containsProviderModelToolOperationJobQueueCostOrCommercialRoute
        !== false
      || binding.containsExecutableCodeOrCommands !== false
      || binding.createsArtifactCommitments !== false
      || binding.createsWorkItemsOrAssetManifestEntries !== false
      || binding.subjectSpecificRouting !== false
      || binding.remotionExecutionStillForbidden !== true
    ) return false
    const extraBlockers = uniqueSorted([
      ...binding.layerBindings.flatMap((entry) => entry.blockerCodes),
      ...binding.cameraBindings.flatMap((entry) => entry.blockerCodes),
      ...(binding.blockerCodes.includes('source_remotion_profile_blocked')
        ? ['source_remotion_profile_blocked' as const]
        : []),
    ])
    const expectedBlockers = uniqueSorted([
      ...BASE_BLOCKERS,
      ...extraBlockers,
    ])
    return stableAuthorityStringify(binding.blockerCodes)
      === stableAuthorityStringify(expectedBlockers)
      && binding.bindingState === (
        extraBlockers.length === 0
          ? 'candidate_samples_bound_pending_protocol'
          : 'blocked_by_profile_or_track_lineage'
      )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRemotionMotionSampleBindingInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, ['remotionProfile', 'motionBundle'])
    || !verifyLivingFrameRemotionProfileDigest(
      input.remotionProfile,
    )
    || !verifyLivingFrameDeterministicMotionBundleDigest(
      input.motionBundle,
    )
  ) throw invalid(
    'Living Frame Remotion motion-sample input is invalid.',
  )
  const timing = input.motionBundle.timingExpectation
  if (
    input.remotionProfile.sceneId !== timing.sceneId
    || input.remotionProfile.masterTiming.masterTimingPlanId
      !== timing.masterTimingPlanId
    || input.remotionProfile.masterTiming
      .masterTimingPlanDigestSha256
      !== timing.masterTimingPlanDigestSha256
    || input.remotionProfile.outputFrame.outputFrameId
      !== timing.outputFrameId
    || input.remotionProfile.outputFrame.outputFrameDigestSha256
      !== timing.outputFrameDigestSha256
  ) throw invalid(
    'Living Frame Remotion profile and motion lineage are stale.',
  )
}

function compileLayer(input: {
  order: number
  componentId: string
  rendererLayerId: string
  motionTrackIds: readonly string[]
  sourceProfileMotionSampleCount: number
  tracksById: ReadonlyMap<string, LivingFrameCompiledMotionTrack>
}): LivingFrameRemotionLayerMotionSampleBinding {
  const result = resolveTracks(input)
  return {
    order: input.order,
    componentId: input.componentId,
    rendererLayerId: input.rendererLayerId,
    sourceProfileMotionTrackIds: [...input.motionTrackIds],
    motionTracks: result.tracks,
    sourceProfileMotionSampleCount:
      input.sourceProfileMotionSampleCount,
    compiledMotionSampleCount: result.sampleCount,
    blockerCodes: result.blockerCodes,
  }
}

function compileCamera(input: {
  order: number
  componentId: string
  motionTrackIds: readonly string[]
  sourceProfileMotionSampleCount: number
  tracksById: ReadonlyMap<string, LivingFrameCompiledMotionTrack>
}): LivingFrameRemotionCameraMotionSampleBinding {
  const result = resolveTracks(input)
  return {
    order: input.order,
    componentId: input.componentId,
    sourceProfileMotionTrackIds: [...input.motionTrackIds],
    motionTracks: result.tracks,
    sourceProfileMotionSampleCount:
      input.sourceProfileMotionSampleCount,
    compiledMotionSampleCount: result.sampleCount,
    blockerCodes: result.blockerCodes,
  }
}

function resolveTracks(input: {
  componentId: string
  motionTrackIds: readonly string[]
  sourceProfileMotionSampleCount: number
  tracksById: ReadonlyMap<string, LivingFrameCompiledMotionTrack>
}): {
  tracks: LivingFrameCompiledMotionTrack[]
  sampleCount: number
  blockerCodes: LivingFrameRemotionMotionSampleBindingBlocker[]
} {
  const blockers: LivingFrameRemotionMotionSampleBindingBlocker[] = []
  const tracks = input.motionTrackIds.flatMap((trackId) => {
    const track = input.tracksById.get(trackId)
    if (!track) {
      blockers.push('referenced_motion_track_missing')
      return []
    }
    if (track.componentId !== input.componentId) {
      blockers.push('motion_track_owner_component_mismatch')
    }
    return [cloneTrack(track)]
  })
  const sampleCount = tracks.reduce(
    (total, track) => total + track.samples.length,
    0,
  )
  if (sampleCount !== input.sourceProfileMotionSampleCount) {
    blockers.push('motion_sample_count_mismatch')
  }
  return {
    tracks,
    sampleCount,
    blockerCodes: uniqueSorted(blockers),
  }
}

function cloneTrack(
  track: LivingFrameCompiledMotionTrack,
): LivingFrameCompiledMotionTrack {
  return {
    ...track,
    sourceKeyframes: track.sourceKeyframes.map(
      (keyframe) => ({ ...keyframe }),
    ),
    samples: track.samples.map((sample) => ({ ...sample })),
  }
}

function deriveMetrics(
  layers: readonly LivingFrameRemotionLayerMotionSampleBinding[],
  cameras: readonly LivingFrameRemotionCameraMotionSampleBinding[],
): LivingFrameRemotionMotionSampleBindingMetrics {
  const all = [...layers, ...cameras]
  return {
    layerBindingCount: layers.length,
    cameraBindingCount: cameras.length,
    referencedTrackCount: new Set(
      all.flatMap((entry) =>
        entry.motionTracks.map((track) => track.trackId)),
    ).size,
    referencedSampleCount: all.reduce(
      (total, entry) =>
        total + entry.compiledMotionSampleCount,
      0,
    ),
    blockedLayerBindingCount: layers.filter(
      (entry) => entry.blockerCodes.length > 0,
    ).length,
    blockedCameraBindingCount: cameras.filter(
      (entry) => entry.blockerCodes.length > 0,
    ).length,
  }
}

function validateLayerBindings(
  values: readonly LivingFrameRemotionLayerMotionSampleBinding[],
): boolean {
  return validateBindings(values, true)
}

function validateCameraBindings(
  values: readonly LivingFrameRemotionCameraMotionSampleBinding[],
): boolean {
  return validateBindings(values, false)
}

function validateBindings(
  values: readonly (
    LivingFrameRemotionLayerMotionSampleBinding
    | LivingFrameRemotionCameraMotionSampleBinding
  )[],
  layers: boolean,
): boolean {
  if (!Array.isArray(values) || values.length > 128) return false
  for (const [index, binding] of values.entries()) {
    const raw: unknown = binding
    const keys = [
      'order',
      'componentId',
      ...(layers ? ['rendererLayerId'] : []),
      'sourceProfileMotionTrackIds',
      'motionTracks',
      'sourceProfileMotionSampleCount',
      'compiledMotionSampleCount',
      'blockerCodes',
    ]
    if (
      !isRecord(raw)
      || !hasExactKeys(raw, keys)
      || binding.order !== index
      || !SAFE_ID.test(binding.componentId)
      || (
        layers
        && (
          !('rendererLayerId' in binding)
          || !SAFE_ID.test(binding.rendererLayerId)
        )
      )
      || !validateOrderedIds(binding.sourceProfileMotionTrackIds)
      || !validateMotionTracks(binding.motionTracks)
      || !isBoundedInteger(
        binding.sourceProfileMotionSampleCount,
        0,
        MAX_SAMPLES,
      )
      || binding.compiledMotionSampleCount !==
        binding.motionTracks.reduce(
          (
            total: number,
            track: LivingFrameCompiledMotionTrack,
          ) => total + track.samples.length,
          0,
        )
      || !validateClosedSet(
        binding.blockerCodes,
        LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_BLOCKERS,
      )
      || !validateBindingBlockers(binding)
    ) return false
  }
  return true
}

function validateBindingBlockers(
  binding: LivingFrameRemotionLayerMotionSampleBinding
    | LivingFrameRemotionCameraMotionSampleBinding,
): boolean {
  const expected: LivingFrameRemotionMotionSampleBindingBlocker[] = []
  const resolvedIds = new Set(
    binding.motionTracks.map((track) => track.trackId),
  )
  if (binding.sourceProfileMotionTrackIds.some(
    (trackId) => !resolvedIds.has(trackId),
  )) expected.push('referenced_motion_track_missing')
  if (binding.motionTracks.some(
    (track) => track.componentId !== binding.componentId,
  )) expected.push('motion_track_owner_component_mismatch')
  if (
    binding.compiledMotionSampleCount
      !== binding.sourceProfileMotionSampleCount
  ) expected.push('motion_sample_count_mismatch')
  return stableAuthorityStringify(binding.blockerCodes)
    === stableAuthorityStringify(uniqueSorted(expected))
}

function validateMotionTracks(
  tracks: readonly LivingFrameCompiledMotionTrack[],
): boolean {
  if (!Array.isArray(tracks) || tracks.length > MAX_TRACKS) {
    return false
  }
  const ids = new Set<string>()
  let samples = 0
  for (const track of tracks) {
    const raw: unknown = track
    if (
      !isRecord(raw)
      || !hasExactKeys(raw, [
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
      || ids.has(track.trackId)
      || !isBoundedInteger(track.order, 0, MAX_TRACKS)
      || !SAFE_ID.test(track.motionGroupId)
      || !SAFE_ID.test(track.componentId)
      || !LIVING_FRAME_MOTION_PROPERTIES.includes(track.property)
      || !LIVING_FRAME_MOTION_TRACK_ROLES.includes(track.role)
      || !LIVING_FRAME_MOTION_RESTORATION_EXPECTATIONS
        .includes(track.restorationExpectation)
      || !isBoundedInteger(track.firstFrame, 0, 10_000_000)
      || !isBoundedInteger(track.lastFrame, track.firstFrame, 10_000_000)
      || !validateKeyframes(track)
      || !validateSamples(track)
    ) return false
    ids.add(track.trackId)
    samples += track.samples.length
    if (samples > MAX_SAMPLES) return false
  }
  return true
}

function validateKeyframes(
  track: LivingFrameCompiledMotionTrack,
): boolean {
  if (
    !Array.isArray(track.sourceKeyframes)
    || track.sourceKeyframes.length < 2
    || track.sourceKeyframes.length > 128
  ) return false
  return track.sourceKeyframes.every((keyframe, index) => {
    const raw: unknown = keyframe
    return isRecord(raw)
      && hasExactKeys(raw, ['frame', 'value', 'easingToNext'])
      && isBoundedInteger(
        keyframe.frame,
        track.firstFrame,
        track.lastFrame,
      )
      && Number.isFinite(keyframe.value)
      && LIVING_FRAME_MOTION_EASINGS.includes(
        keyframe.easingToNext,
      )
      && (
        index === 0
        || keyframe.frame > track.sourceKeyframes[index - 1]!.frame
      )
  }) && track.sourceKeyframes[0]!.frame === track.firstFrame
    && track.sourceKeyframes.at(-1)!.frame === track.lastFrame
}

function validateSamples(
  track: LivingFrameCompiledMotionTrack,
): boolean {
  if (
    !Array.isArray(track.samples)
    || track.samples.length
      !== track.lastFrame - track.firstFrame + 1
  ) return false
  return track.samples.every((sample, index) => {
    const raw: unknown = sample
    return isRecord(raw)
      && hasExactKeys(raw, ['frame', 'value'])
      && sample.frame === track.firstFrame + index
      && Number.isFinite(sample.value)
  })
}

function validateSourceBindings(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'remotionProfileDigestSha256',
      'deterministicMotionBundleDigestSha256',
    ])
    && Object.values(value).every(
      (entry) => typeof entry === 'string' && SHA256.test(entry),
    )
}

function validateOutputFrame(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'outputFrameId',
      'outputFrameDigestSha256',
    ])
    && SAFE_ID.test(value.outputFrameId as string)
    && SHA256.test(value.outputFrameDigestSha256 as string)
}

function validateMasterTiming(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'masterTimingPlanId',
      'masterTimingPlanDigestSha256',
      'sceneStartFrame',
      'sceneEndFrame',
      'fpsNumerator',
      'fpsDenominator',
    ])
    && SAFE_ID.test(value.masterTimingPlanId as string)
    && SHA256.test(
      value.masterTimingPlanDigestSha256 as string,
    )
    && isBoundedInteger(value.sceneStartFrame, 0, 10_000_000)
    && isBoundedInteger(
      value.sceneEndFrame,
      Number(value.sceneStartFrame),
      10_000_000,
    )
    && isBoundedInteger(value.fpsNumerator, 1, 240_000)
    && isBoundedInteger(value.fpsDenominator, 1, 10_000)
}

function validateAuthorityBoundary(value: unknown): boolean {
  return isRecord(value)
    && stableAuthorityStringify(value)
      === stableAuthorityStringify(AUTHORITY_BOUNDARY)
}

function validateClosedSet<T extends string>(
  values: readonly T[],
  allowed: readonly T[],
): boolean {
  return Array.isArray(values)
    && values.length === new Set(values).size
    && values.every((value) => allowed.includes(value))
    && stableAuthorityStringify(values)
      === stableAuthorityStringify([...values].sort())
}

function validateOrderedIds(values: readonly string[]): boolean {
  return Array.isArray(values)
    && values.length <= MAX_TRACKS
    && values.every((value) => SAFE_ID.test(value))
    && new Set(values).size === values.length
}

function isBoundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return Number.isInteger(value)
    && Number(value) >= minimum
    && Number(value) <= maximum
}

function uniqueSorted<T extends string>(
  values: readonly T[],
): T[] {
  return [...new Set(values)].sort()
}

function sign(
  draft: LivingFrameRemotionMotionSampleBindingDraft,
): LivingFrameRemotionMotionSampleBinding {
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
    && !Array.isArray(value)
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

function invalid(message: string): Error {
  return new Error(message)
}
