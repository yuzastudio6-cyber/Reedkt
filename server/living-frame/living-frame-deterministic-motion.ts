import { createHash } from 'node:crypto'

import type {
  LivingFrameCompiledMotionTrack,
  LivingFrameDeterministicMotionAuthorityBoundary,
  LivingFrameDeterministicMotionBundle,
  LivingFrameDeterministicMotionBundleDraft,
  LivingFrameDeterministicMotionMetrics,
  LivingFrameMotionEasing,
  LivingFrameMotionKeyframe,
  LivingFrameMotionProperty,
  LivingFrameMotionSample,
  LivingFrameMotionTimingExpectation,
  LivingFrameMotionTrackDraft,
} from '../../src/types/living-frame-deterministic-motion'
import {
  LIVING_FRAME_DETERMINISTIC_MOTION_CLASS,
  LIVING_FRAME_DETERMINISTIC_MOTION_PROFILE,
  LIVING_FRAME_DETERMINISTIC_MOTION_VERSION,
  LIVING_FRAME_MOTION_EASINGS,
  LIVING_FRAME_MOTION_PROPERTIES,
  LIVING_FRAME_MOTION_RESTORATION_EXPECTATIONS,
  LIVING_FRAME_MOTION_TRACK_ROLES,
} from '../../src/types/living-frame-deterministic-motion'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const MAX_SCENE_FRAME_COUNT = 18_000
const MAX_TRACK_COUNT = 64
const MAX_KEYFRAME_COUNT = 32
const MAX_TOTAL_SAMPLE_COUNT = 250_000

const PROPERTY_RANGES: Record<
  LivingFrameMotionProperty,
  readonly [number, number]
> = {
  position_x_normalized: [-2, 2],
  position_y_normalized: [-2, 2],
  rotation_degrees: [-100_000, 100_000],
  scale_uniform: [0.01, 20],
  opacity: [0, 1],
  blur_pixels: [0, 100],
  focus_depth_normalized: [0, 1],
  path_reveal: [0, 1],
  particle_emission_normalized: [0, 1],
  light_intensity: [0, 4],
  shadow_opacity: [0, 1],
}

const AUTHORITY_BOUNDARY:
  LivingFrameDeterministicMotionAuthorityBoundary = Object.freeze({
    deterministicSamplingOnly: true,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    planningAuthority: false,
    soundSyncAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
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

export interface CompileLivingFrameDeterministicMotionInput {
  readonly timingExpectation: LivingFrameMotionTimingExpectation
  readonly tracks: readonly LivingFrameMotionTrackDraft[]
}

export function compileLivingFrameDeterministicMotion(
  input: CompileLivingFrameDeterministicMotionInput,
): LivingFrameDeterministicMotionBundle {
  assertInput(input)
  const tracks = [...input.tracks]
    .sort((left, right) => left.order - right.order)
    .map(compileTrack)
  const metrics = deriveMetrics(tracks)
  const draft: LivingFrameDeterministicMotionBundleDraft = {
    contractVersion: LIVING_FRAME_DETERMINISTIC_MOTION_VERSION,
    samplingProfile: LIVING_FRAME_DETERMINISTIC_MOTION_PROFILE,
    bundleClass: LIVING_FRAME_DETERMINISTIC_MOTION_CLASS,
    timingExpectation: { ...input.timingExpectation },
    tracks,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsExecutableCode: false,
    containsProviderOrToolRoute: false,
    containsRawInstructions: false,
    canonicalTimingRevalidationStillRequired: true,
    remotionCompilationStillRequired: true,
  }
  return {
    ...draft,
    bundleDigestSha256: sha256(canonicalJsonStringify(draft)),
  }
}

export function verifyLivingFrameDeterministicMotionBundleDigest(
  value: unknown,
): value is LivingFrameDeterministicMotionBundle {
  if (!isBundleShape(value)) return false
  const { bundleDigestSha256, ...draft } = value
  return bundleDigestSha256 === sha256(canonicalJsonStringify(draft))
}

function assertInput(input: CompileLivingFrameDeterministicMotionInput): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, ['timingExpectation', 'tracks'])
  ) {
    throw new Error('Living Frame deterministic motion input shape is invalid.')
  }
  assertTimingExpectation(input.timingExpectation)
  if (
    !Array.isArray(input.tracks)
    || input.tracks.length < 1
    || input.tracks.length > MAX_TRACK_COUNT
  ) {
    throw new Error('Living Frame deterministic motion track count is invalid.')
  }

  const trackIds = new Set<string>()
  const trackOrders = new Set<number>()
  for (const track of input.tracks) {
    assertTrack(track, input.timingExpectation)
    if (trackIds.has(track.trackId)) {
      throw new Error('Living Frame deterministic motion track IDs must be unique.')
    }
    if (trackOrders.has(track.order)) {
      throw new Error(
        'Living Frame deterministic motion track orders must be unique.',
      )
    }
    trackIds.add(track.trackId)
    trackOrders.add(track.order)
  }
  const orders = [...trackOrders].sort((left, right) => left - right)
  if (orders.some((order, index) => order !== index)) {
    throw new Error(
      'Living Frame deterministic motion track orders must be contiguous.',
    )
  }
  assertNoPropertyConflicts(input.tracks)
  assertOnePrimaryMotionGroupAtATime(input.tracks)
  const totalSamples = input.tracks.reduce(
    (sum, track) =>
      sum + track.keyframes[track.keyframes.length - 1]!.frame
        - track.keyframes[0]!.frame + 1,
    0,
  )
  if (totalSamples > MAX_TOTAL_SAMPLE_COUNT) {
    throw new Error(
      'Living Frame deterministic motion sample budget is invalid.',
    )
  }
}

function assertTimingExpectation(
  value: LivingFrameMotionTimingExpectation,
): void {
  if (
    !hasExactKeysUnknown(value, [
      'masterTimingPlanId',
      'masterTimingPlanDigestSha256',
      'outputFrameId',
      'outputFrameDigestSha256',
      'sceneId',
      'sceneStartFrame',
      'sceneEndFrame',
      'fpsNumerator',
      'fpsDenominator',
      'timingAuthorityRevalidationRequired',
    ])
    || !SAFE_ID.test(value.masterTimingPlanId)
    || !SHA256.test(value.masterTimingPlanDigestSha256)
    || !SAFE_ID.test(value.outputFrameId)
    || !SHA256.test(value.outputFrameDigestSha256)
    || !SAFE_ID.test(value.sceneId)
    || !isIntegerBetween(value.sceneStartFrame, 0, 100_000_000)
    || !isIntegerBetween(value.sceneEndFrame, 0, 100_000_000)
    || value.sceneEndFrame < value.sceneStartFrame
    || value.sceneEndFrame - value.sceneStartFrame + 1 > MAX_SCENE_FRAME_COUNT
    || !isIntegerBetween(value.fpsNumerator, 1, 240_000)
    || !isIntegerBetween(value.fpsDenominator, 1, 1_001)
    || value.timingAuthorityRevalidationRequired !== true
  ) {
    throw new Error(
      'Living Frame deterministic motion timing expectation is invalid.',
    )
  }
}

function assertTrack(
  track: LivingFrameMotionTrackDraft,
  timing: LivingFrameMotionTimingExpectation,
): void {
  if (
    !hasExactKeysUnknown(track, [
      'trackId',
      'order',
      'motionGroupId',
      'componentId',
      'property',
      'role',
      'restorationExpectation',
      'keyframes',
    ])
    || !SAFE_ID.test(track.trackId)
    || !isIntegerBetween(track.order, 0, MAX_TRACK_COUNT - 1)
    || !SAFE_ID.test(track.motionGroupId)
    || !SAFE_ID.test(track.componentId)
    || !includesString(LIVING_FRAME_MOTION_PROPERTIES, track.property)
    || !includesString(LIVING_FRAME_MOTION_TRACK_ROLES, track.role)
    || !includesString(
      LIVING_FRAME_MOTION_RESTORATION_EXPECTATIONS,
      track.restorationExpectation,
    )
    || !Array.isArray(track.keyframes)
    || track.keyframes.length < 2
    || track.keyframes.length > MAX_KEYFRAME_COUNT
  ) {
    throw new Error('Living Frame deterministic motion track shape is invalid.')
  }
  let previousFrame: number | null = null
  for (const keyframe of track.keyframes) {
    if (
      !hasExactKeysUnknown(keyframe, ['frame', 'value', 'easingToNext'])
      || !Number.isInteger(keyframe.frame)
      || keyframe.frame < timing.sceneStartFrame
      || keyframe.frame > timing.sceneEndFrame
      || (previousFrame != null && keyframe.frame <= previousFrame)
      || !isPropertyValue(track.property, keyframe.value)
      || !includesString(LIVING_FRAME_MOTION_EASINGS, keyframe.easingToNext)
    ) {
      throw new Error(
        'Living Frame deterministic motion keyframe is invalid.',
      )
    }
    previousFrame = keyframe.frame
  }
  if (track.keyframes[track.keyframes.length - 1]!.easingToNext !== 'hold') {
    throw new Error(
      'Living Frame deterministic motion final keyframe must hold.',
    )
  }
  if (
    track.restorationExpectation === 'required_return_to_initial'
    && track.keyframes[0]!.value
      !== track.keyframes[track.keyframes.length - 1]!.value
  ) {
    throw new Error(
      'Living Frame deterministic motion restoration is incomplete.',
    )
  }
}

function assertNoPropertyConflicts(
  tracks: readonly LivingFrameMotionTrackDraft[],
): void {
  for (let leftIndex = 0; leftIndex < tracks.length; leftIndex += 1) {
    const left = tracks[leftIndex]!
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < tracks.length;
      rightIndex += 1
    ) {
      const right = tracks[rightIndex]!
      if (
        left.componentId === right.componentId
        && left.property === right.property
        && rangesOverlap(trackRange(left), trackRange(right))
      ) {
        throw new Error(
          'Living Frame deterministic motion property tracks conflict.',
        )
      }
    }
  }
}

function assertOnePrimaryMotionGroupAtATime(
  tracks: readonly LivingFrameMotionTrackDraft[],
): void {
  const primary = tracks.filter((track) => track.role === 'primary')
  for (let leftIndex = 0; leftIndex < primary.length; leftIndex += 1) {
    const left = primary[leftIndex]!
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < primary.length;
      rightIndex += 1
    ) {
      const right = primary[rightIndex]!
      if (
        left.motionGroupId !== right.motionGroupId
        && rangesOverlap(trackRange(left), trackRange(right))
      ) {
        throw new Error(
          'Living Frame deterministic motion has competing primary groups.',
        )
      }
    }
  }
}

function compileTrack(
  track: LivingFrameMotionTrackDraft,
): LivingFrameCompiledMotionTrack {
  const sourceKeyframes = track.keyframes.map((keyframe) => ({ ...keyframe }))
  const firstFrame = sourceKeyframes[0]!.frame
  const lastFrame = sourceKeyframes[sourceKeyframes.length - 1]!.frame
  const samples: LivingFrameMotionSample[] = []
  for (let frame = firstFrame; frame <= lastFrame; frame += 1) {
    samples.push({
      frame,
      value: sampleTrackAtFrame(sourceKeyframes, frame),
    })
  }
  return {
    trackId: track.trackId,
    order: track.order,
    motionGroupId: track.motionGroupId,
    componentId: track.componentId,
    property: track.property,
    role: track.role,
    restorationExpectation: track.restorationExpectation,
    firstFrame,
    lastFrame,
    sourceKeyframes,
    samples,
  }
}

function sampleTrackAtFrame(
  keyframes: readonly LivingFrameMotionKeyframe[],
  frame: number,
): number {
  const final = keyframes[keyframes.length - 1]!
  if (frame >= final.frame) return rounded(final.value)
  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const from = keyframes[index]!
    const to = keyframes[index + 1]!
    if (frame < from.frame || frame > to.frame) continue
    const progress = (frame - from.frame) / (to.frame - from.frame)
    const eased = applyEasing(from.easingToNext, progress)
    return rounded(from.value + (to.value - from.value) * eased)
  }
  return rounded(keyframes[0]!.value)
}

function applyEasing(easing: LivingFrameMotionEasing, progress: number): number {
  switch (easing) {
    case 'linear':
      return progress
    case 'hold':
      return progress < 1 ? 0 : 1
    case 'ease_in_quad':
    case 'mechanical_accelerate':
      return progress ** 2
    case 'ease_out_quad':
      return 1 - (1 - progress) ** 2
    case 'ease_in_out_cubic':
      return progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2
    case 'strike_accelerate':
      return progress ** 5
    case 'settle_out':
      return 1 - (1 - progress) ** 3
  }
}

function deriveMetrics(
  tracks: readonly LivingFrameCompiledMotionTrack[],
): LivingFrameDeterministicMotionMetrics {
  const motionGroups = new Set(tracks.map((track) => track.motionGroupId))
  const primaryGroups = new Set(
    tracks
      .filter((track) => track.role === 'primary')
      .map((track) => track.motionGroupId),
  )
  const firstFrame = Math.min(...tracks.map((track) => track.firstFrame))
  const lastFrame = Math.max(...tracks.map((track) => track.lastFrame))
  let maximumConcurrentTrackCount = 0
  for (let frame = firstFrame; frame <= lastFrame; frame += 1) {
    maximumConcurrentTrackCount = Math.max(
      maximumConcurrentTrackCount,
      tracks.filter(
        (track) => frame >= track.firstFrame && frame <= track.lastFrame,
      ).length,
    )
  }
  return {
    trackCount: tracks.length,
    motionGroupCount: motionGroups.size,
    primaryMotionGroupCount: primaryGroups.size,
    cameraTrackCount: tracks.filter((track) => track.role === 'camera').length,
    restorationTrackCount: tracks.filter(
      (track) =>
        track.restorationExpectation === 'required_return_to_initial',
    ).length,
    sampleCount: tracks.reduce(
      (sum, track) => sum + track.samples.length,
      0,
    ),
    maximumConcurrentTrackCount,
  }
}

function trackRange(
  track: LivingFrameMotionTrackDraft,
): readonly [number, number] {
  return [
    track.keyframes[0]!.frame,
    track.keyframes[track.keyframes.length - 1]!.frame,
  ]
}

function rangesOverlap(
  left: readonly [number, number],
  right: readonly [number, number],
): boolean {
  return left[0] <= right[1] && right[0] <= left[1]
}

function isPropertyValue(
  property: LivingFrameMotionProperty,
  value: unknown,
): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  const [minimum, maximum] = PROPERTY_RANGES[property]
  return value >= minimum && value <= maximum
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map((item) => canonicalize(item))
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    )
  }
  throw new Error('Living Frame deterministic motion is not canonical JSON.')
}

function isBundleShape(
  value: unknown,
): value is LivingFrameDeterministicMotionBundle {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'contractVersion',
      'samplingProfile',
      'bundleClass',
      'timingExpectation',
      'tracks',
      'metrics',
      'authorityBoundary',
      'containsExecutableCode',
      'containsProviderOrToolRoute',
      'containsRawInstructions',
      'canonicalTimingRevalidationStillRequired',
      'remotionCompilationStillRequired',
      'bundleDigestSha256',
    ])
  ) return false
  if (
    value.contractVersion !== LIVING_FRAME_DETERMINISTIC_MOTION_VERSION
    || value.samplingProfile !== LIVING_FRAME_DETERMINISTIC_MOTION_PROFILE
    || value.bundleClass !== LIVING_FRAME_DETERMINISTIC_MOTION_CLASS
    || value.containsExecutableCode !== false
    || value.containsProviderOrToolRoute !== false
    || value.containsRawInstructions !== false
    || value.canonicalTimingRevalidationStillRequired !== true
    || value.remotionCompilationStillRequired !== true
    || typeof value.bundleDigestSha256 !== 'string'
    || !SHA256.test(value.bundleDigestSha256)
  ) return false
  if (!isTimingExpectation(value.timingExpectation)) return false
  const timingExpectation = value.timingExpectation
  if (
    !Array.isArray(value.tracks)
    || value.tracks.length < 1
    || value.tracks.length > MAX_TRACK_COUNT
    || !value.tracks.every((track) =>
      isCompiledTrack(track, timingExpectation))
  ) return false
  const tracks = value.tracks as LivingFrameCompiledMotionTrack[]
  if (
    tracks.some((track, index) => track.order !== index)
    || new Set(tracks.map((track) => track.trackId)).size !== tracks.length
  ) return false
  const trackDrafts: LivingFrameMotionTrackDraft[] = tracks.map((track) => ({
    trackId: track.trackId,
    order: track.order,
    motionGroupId: track.motionGroupId,
    componentId: track.componentId,
    property: track.property,
    role: track.role,
    restorationExpectation: track.restorationExpectation,
    keyframes: track.sourceKeyframes,
  }))
  try {
    assertNoPropertyConflicts(trackDrafts)
    assertOnePrimaryMotionGroupAtATime(trackDrafts)
  } catch {
    return false
  }
  if (!isMetrics(value.metrics)) return false
  if (
    canonicalJsonStringify(value.metrics)
      !== canonicalJsonStringify(deriveMetrics(tracks))
  ) return false
  return isAuthorityBoundary(value.authorityBoundary)
}

function isTimingExpectation(
  value: unknown,
): value is LivingFrameMotionTimingExpectation {
  if (!isRecord(value)) return false
  try {
    assertTimingExpectation(value as unknown as LivingFrameMotionTimingExpectation)
    return true
  } catch {
    return false
  }
}

function isCompiledTrack(
  value: unknown,
  timing: LivingFrameMotionTimingExpectation,
): value is LivingFrameCompiledMotionTrack {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
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
    || !SAFE_ID.test(value.trackId as string)
    || !isIntegerBetween(value.order, 0, MAX_TRACK_COUNT - 1)
    || !SAFE_ID.test(value.motionGroupId as string)
    || !SAFE_ID.test(value.componentId as string)
    || !includesString(LIVING_FRAME_MOTION_PROPERTIES, value.property)
    || !includesString(LIVING_FRAME_MOTION_TRACK_ROLES, value.role)
    || !includesString(
      LIVING_FRAME_MOTION_RESTORATION_EXPECTATIONS,
      value.restorationExpectation,
    )
    || !isIntegerBetween(
      value.firstFrame,
      timing.sceneStartFrame,
      timing.sceneEndFrame,
    )
    || !isIntegerBetween(
      value.lastFrame,
      value.firstFrame,
      timing.sceneEndFrame,
    )
    || !Array.isArray(value.sourceKeyframes)
    || value.sourceKeyframes.length < 2
    || value.sourceKeyframes.length > MAX_KEYFRAME_COUNT
    || !Array.isArray(value.samples)
    || value.samples.length !== value.lastFrame - value.firstFrame + 1
  ) return false
  const property = value.property
  const sourceKeyframes = value.sourceKeyframes
  for (let index = 0; index < sourceKeyframes.length; index += 1) {
    const keyframe = sourceKeyframes[index]
    if (
      !isRecord(keyframe)
      || !hasExactKeys(keyframe, ['frame', 'value', 'easingToNext'])
      || !isIntegerBetween(
        keyframe.frame,
        value.firstFrame,
        value.lastFrame,
      )
      || (index > 0
        && keyframe.frame <= sourceKeyframes[index - 1]!.frame)
      || !isPropertyValue(property, keyframe.value)
      || !includesString(LIVING_FRAME_MOTION_EASINGS, keyframe.easingToNext)
    ) return false
  }
  if (
    sourceKeyframes[0]!.frame !== value.firstFrame
    || sourceKeyframes[sourceKeyframes.length - 1]!.frame !== value.lastFrame
    || sourceKeyframes[sourceKeyframes.length - 1]!.easingToNext !== 'hold'
    || (value.restorationExpectation === 'required_return_to_initial'
      && sourceKeyframes[0]!.value
        !== sourceKeyframes[sourceKeyframes.length - 1]!.value)
  ) return false
  for (let index = 0; index < value.samples.length; index += 1) {
    const sample = value.samples[index]
    if (
      !isRecord(sample)
      || !hasExactKeys(sample, ['frame', 'value'])
      || sample.frame !== value.firstFrame + index
      || !isPropertyValue(property, sample.value)
      || sample.value !== sampleTrackAtFrame(
        sourceKeyframes as LivingFrameMotionKeyframe[],
        sample.frame,
      )
    ) return false
  }
  return true
}

function isMetrics(
  value: unknown,
): value is LivingFrameDeterministicMotionMetrics {
  return isRecord(value)
    && hasExactKeys(value, [
      'trackCount',
      'motionGroupCount',
      'primaryMotionGroupCount',
      'cameraTrackCount',
      'restorationTrackCount',
      'sampleCount',
      'maximumConcurrentTrackCount',
    ])
    && isIntegerBetween(value.trackCount, 1, MAX_TRACK_COUNT)
    && isIntegerBetween(value.motionGroupCount, 1, value.trackCount)
    && isIntegerBetween(
      value.primaryMotionGroupCount,
      0,
      value.motionGroupCount,
    )
    && isIntegerBetween(value.cameraTrackCount, 0, value.trackCount)
    && isIntegerBetween(value.restorationTrackCount, 0, value.trackCount)
    && isIntegerBetween(value.sampleCount, 1, MAX_TOTAL_SAMPLE_COUNT)
    && isIntegerBetween(
      value.maximumConcurrentTrackCount,
      1,
      value.trackCount,
    )
}

function isAuthorityBoundary(value: unknown): boolean {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'deterministicSamplingOnly',
      'masterTimingAuthority',
      'exactFrameAuthority',
      'planningAuthority',
      'soundSyncAuthority',
      'approvalAuthority',
      'snapshotAuthority',
      'estimateAuthority',
      'costAuthority',
      'providerAuthority',
      'toolRouteAuthority',
      'workGraphAuthority',
      'queueAuthority',
      'assetManifestAuthority',
      'rendererAuthority',
      'renderExecutionAuthority',
      'runtimePromotionAuthority',
      'productionAuthority',
    ])
  ) return false
  return value.deterministicSamplingOnly === true
    && Object.entries(value)
      .filter(([key]) => key !== 'deterministicSamplingOnly')
      .every(([, authority]) => authority === false)
}

function isIntegerBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= minimum
    && value <= maximum
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const keys = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  return keys.length === expected.length
    && keys.every((key, index) => key === expected[index])
}

function hasExactKeysUnknown(
  value: unknown,
  expectedKeys: readonly string[],
): boolean {
  return isRecord(value) && hasExactKeys(value, expectedKeys)
}

function includesString<const Values extends readonly string[]>(
  values: Values,
  value: unknown,
): value is Values[number] {
  return typeof value === 'string' && values.includes(value)
}
