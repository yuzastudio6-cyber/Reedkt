import { createHash } from 'node:crypto'

import {
  CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS,
} from '../../../src/types/canonical-private-composition-capacity'
import { ApiError } from '../../errors/api-error'

export const OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL =
  'offline-remotion-render-execution-v1' as const
export const OFFLINE_REMOTION_RENDER_CONTAINER_PROTOCOL =
  'offline-remotion-render-execution-container-v1' as const
export const OFFLINE_REMOTION_RENDER_OPERATION =
  'tool.remotion.render_approved_composition.v1' as const
export const OFFLINE_REMOTION_RENDER_MAXIMUM_REQUEST_BYTES = 48 * 1024 * 1024

const OFFLINE_REMOTION_MAXIMUM_COMBINED_VOICE_TRACK_BYTES = 2 * 1024 * 1024

const SAFE_TEXT = /^(?!.*(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|(?:^|\s)\/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:\/|\b)|[A-Za-z]:[\\/]|\$\(|`|&&|\|\||#!))[\P{Cc}]+$/u
const COLORS = /^#[A-F0-9]{6}$/
const SHA256 = /^[a-f0-9]{64}$/
const PRIVATE_REVIEW_FRAMES = ['360x640', '640x360', '480x480', '480x600'] as const
const MOTION_STUDIO_PREVIEW_FRAMES = PRIVATE_REVIEW_FRAMES
const FOUR_K_MASTER_FRAMES = [
  '3840x2160',
  '2160x3840',
  '2160x2160',
  '2160x2700',
  '2880x2160',
] as const
const APPROVED_FRAMES = [...PRIVATE_REVIEW_FRAMES, ...FOUR_K_MASTER_FRAMES] as const
const DELIVERY_MASTER_AUTHORITY_KEYS = [
  'renderPurpose',
  'deliveryProfileId',
  'estimateCostBasisProfileId',
  'sourceQualityPolicy',
  'usesApprovedEditReservation',
  'requiresSeparateExportEstimate',
  'allowsAdditionalExportCharge',
] as const

export type OfflineRemotionSingleSourceMimeType = 'video/mp4' | 'video/x-matroska'

interface CommonCompositionPayload {
  width: 360 | 480 | 640 | 2160 | 2880 | 3840
  height: 360 | 480 | 600 | 640 | 2160 | 2700 | 3840
  fps: 24 | 30
  durationFrames: number
}

interface OfflineRemotionFourKDeliveryMasterAuthority {
  renderPurpose?: 'private_4k_delivery_master_v1'
  deliveryProfileId?: 'uhd_2160'
  estimateCostBasisProfileId?: 'uhd_2160'
  sourceQualityPolicy?: 'immutable_source_master_no_proxy_v1'
  usesApprovedEditReservation?: true
  requiresSeparateExportEstimate?: false
  allowsAdditionalExportCharge?: false
}

export interface OfflineRemotionPreviewPlanningPayload extends CommonCompositionPayload {
  frameTemplateId: 'approved_full_panel_v1' | 'approved_lower_panel_v1'
  panelBackground: string
  accentColor: string
  title: string
  subtitle: string
  caption: string
}

export interface OfflineRemotionMotionStudioScenePreviewPayload extends CommonCompositionPayload {
  compositionProfileId: 'motion_studio_scene_preview_v1'
  sceneId: string
  sceneStartFrame: number
  sceneEndFrame: number
  semanticPurpose: string
  productionMode: 'generative_first' | 'layered_first' | 'native_graphics_first' | 'footage_first' | 'hybrid_directed'
  layerType: 'image' | 'source_footage' | 'generated_video' | 'text' | 'caption' | 'map' | 'chart' | 'mask' | 'audio' | 'effect'
  panelBackground: string
  accentColor: string
}

export interface OfflineRemotionMotionStudioLayeredPlane {
  planeId: 'background-plane' | 'headline-plane' | 'subject-plane' | 'caption-plane'
  role: 'background' | 'headline' | 'subject' | 'caption'
  zIndex: 0 | 10 | 20 | 30
  sourceKind: 'remotion_native' | 'approved_cutout_slot'
  motionToken: 'ambient_drift' | 'headline_reveal' | 'subject_parallax' | 'caption_hold'
}

export interface OfflineRemotionMotionStudioLayeredPlanningPayload extends CommonCompositionPayload {
  compositionProfileId: 'motion_studio_native_layered_scene_v1'
  sceneId: string
  sceneStartFrame: number
  sceneEndFrame: number
  semanticPurpose: string
  headline: string
  caption: string
  layerManifestDigest: string
  depthModel: 'semantic_planes_v1'
  planes: readonly OfflineRemotionMotionStudioLayeredPlane[]
  panelBackground: '#0F172A'
  panelHighlight: '#16213E'
  headlineColor: '#E0F2FE'
  accentColor: '#FF4D8D'
  captionColor: '#F8FAFC'
  horizontalSafePercent: 8
  verticalSafePercent: 8
  captionBottomPercent: 9
  captionAboveMask: true
  contactObjectPresent: false
  maskRisk: 'low_fixture_only'
}

export interface OfflineRemotionMotionStudioLayeredPayload extends OfflineRemotionMotionStudioLayeredPlanningPayload {
  subjectMimeType: 'image/png'
  subjectByteLength: number
  subjectSha256: string
  subjectBytesBase64: string
}

export interface OfflineRemotionMotionStudioAnimaticScene {
  order: number
  sceneId: string
  startFrame: number
  endFrame: number
  title: string
  visualDescription: string
}

export interface OfflineRemotionMotionStudioAnimaticPlanningPayload extends CommonCompositionPayload {
  compositionProfileId: 'motion_studio_prepared_script_animatic_v1'
  scenes: readonly OfflineRemotionMotionStudioAnimaticScene[]
  panelBackground: string
  accentColor: string
}

export interface OfflineRemotionMotionStudioAnimaticPayload extends OfflineRemotionMotionStudioAnimaticPlanningPayload {
  narrationMimeType: 'audio/wav' | 'audio/mpeg' | 'audio/mp3'
  narrationByteLength: number
  narrationSha256: string
  narrationBytesBase64: string
}

export interface OfflineRemotionMotionStudioRouteDrawPlanningPayload {
  compositionProfileId: 'motion_studio_deterministic_route_draw_v1'
  width: 1280
  height: 720
  fps: 30
  durationFrames: 180
  sceneId: string
  sceneStartFrame: 0
  sceneEndFrame: 180
  semanticPurpose: string
  routePresetId: 'abstract_three_district_route_v1'
  routeRevealStartFrame: 18
  routeRevealEndFrame: 140
  waypointFrames: readonly [18, 82, 140]
  routeCoverColor: '#081426'
  routeColor: '#FFB23D'
  routeGlowColor: '#FF7A1A'
}

export interface OfflineRemotionMotionStudioRouteDrawPayload extends OfflineRemotionMotionStudioRouteDrawPlanningPayload {
  keyframeMimeType: 'image/png'
  keyframeByteLength: number
  keyframeSha256: string
  keyframeBytesBase64: string
}

export interface OfflineRemotionSingleSourceFinalCompositionPlanningPayload extends CommonCompositionPayload, OfflineRemotionFourKDeliveryMasterAuthority {
  compositionProfileId: 'approved_source_caption_final_v1'
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  sourceFit: 'contain'
  panelBackground: string
  audioPolicy: 'preserve_source' | 'replace_with_approved_voice_tracks'
  sourceMediaPolicy?: 'approved_professional_color_intermediate_v1'
  voiceTracks?: OfflineRemotionVoiceTrackPlanningPayload[]
  captionOverlayPolicy: 'approved_full_frame_rgba'
}

export interface OfflineRemotionCaptionOverlayCuePlanningPayload {
  outputKey: string
  startFrame: number
  endFrameExclusive: number
}

export interface OfflineRemotionVoiceTrackPlanningPayload {
  sourceSequenceItemId: string
  outputKey: string
  durationFrames: number
}

export interface OfflineRemotionSingleSourceCaptionTrackFinalCompositionPlanningPayload extends CommonCompositionPayload, OfflineRemotionFourKDeliveryMasterAuthority {
  compositionProfileId: 'approved_source_caption_track_final_v1'
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  sourceFit: 'contain'
  panelBackground: string
  audioPolicy: 'preserve_source' | 'replace_with_approved_voice_tracks'
  sourceMediaPolicy?: 'approved_professional_color_intermediate_v1'
  voiceTracks?: OfflineRemotionVoiceTrackPlanningPayload[]
  captionOverlayPolicy: 'approved_timed_full_frame_rgba_track'
  captionOverlayCues: OfflineRemotionCaptionOverlayCuePlanningPayload[]
}

export interface OfflineRemotionSourceSequenceSegmentPlanningPayload {
  sourceSequenceItemId: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  timelineStartFrame: number
  timelineEndFrameExclusive: number
}

export interface OfflineRemotionHardCutTransitionPlanningPayload {
  transitionTimingItemId: string
  refinedTransitionTimingItemId: string
  fromSegmentId: string
  toSegmentId: string
  fromSourceSequenceItemId: string
  toSourceSequenceItemId: string
  boundaryFrame: number
}

export interface OfflineRemotionSourceSequenceFinalCompositionPlanningPayload extends CommonCompositionPayload, OfflineRemotionFourKDeliveryMasterAuthority {
  compositionProfileId: 'approved_source_sequence_caption_final_v1'
  sourceSegments: OfflineRemotionSourceSequenceSegmentPlanningPayload[]
  transitionPolicy: 'approved_hard_cuts_only'
  hardCutTransitions: OfflineRemotionHardCutTransitionPlanningPayload[]
  sourceFit: 'contain'
  panelBackground: string
  audioPolicy: 'preserve_source_sequence' | 'replace_with_approved_voice_tracks'
  sourceMediaPolicy?: 'approved_professional_color_intermediate_v1'
  voiceTracks?: OfflineRemotionVoiceTrackPlanningPayload[]
  captionOverlayPolicy: 'approved_full_frame_rgba'
}

export interface OfflineRemotionSourceSequenceCaptionTrackFinalCompositionPlanningPayload extends CommonCompositionPayload, OfflineRemotionFourKDeliveryMasterAuthority {
  compositionProfileId: 'approved_source_sequence_caption_track_final_v1'
  sourceSegments: OfflineRemotionSourceSequenceSegmentPlanningPayload[]
  transitionPolicy: 'approved_hard_cuts_only'
  hardCutTransitions: OfflineRemotionHardCutTransitionPlanningPayload[]
  sourceFit: 'contain'
  panelBackground: string
  audioPolicy: 'preserve_source_sequence' | 'replace_with_approved_voice_tracks'
  sourceMediaPolicy?: 'approved_professional_color_intermediate_v1'
  voiceTracks?: OfflineRemotionVoiceTrackPlanningPayload[]
  captionOverlayPolicy: 'approved_timed_full_frame_rgba_track'
  captionOverlayCues: OfflineRemotionCaptionOverlayCuePlanningPayload[]
}

export type OfflineRemotionFinalCompositionPlanningPayload =
  | OfflineRemotionSingleSourceFinalCompositionPlanningPayload
  | OfflineRemotionSingleSourceCaptionTrackFinalCompositionPlanningPayload
  | OfflineRemotionSourceSequenceFinalCompositionPlanningPayload
  | OfflineRemotionSourceSequenceCaptionTrackFinalCompositionPlanningPayload

export interface OfflineRemotionSingleSourceFinalCompositionPayload extends Omit<
  OfflineRemotionSingleSourceFinalCompositionPlanningPayload,
  'voiceTracks'
> {
  sourceMimeType: OfflineRemotionSingleSourceMimeType
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
  captionOverlayMimeType: 'image/png'
  captionOverlayByteLength: number
  captionOverlaySha256: string
  captionOverlayBytesBase64: string
  voiceTracks?: OfflineRemotionCommittedVoiceTrack[]
}

export interface OfflineRemotionSourceSequenceCommittedSource {
  sourceSequenceItemId: string
  sourceMimeType: OfflineRemotionSingleSourceMimeType
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
}

export interface OfflineRemotionSourceSequenceFinalCompositionPayload extends Omit<
  OfflineRemotionSourceSequenceFinalCompositionPlanningPayload,
  'voiceTracks'
> {
  sources: OfflineRemotionSourceSequenceCommittedSource[]
  captionOverlayMimeType: 'image/png'
  captionOverlayByteLength: number
  captionOverlaySha256: string
  captionOverlayBytesBase64: string
  voiceTracks?: OfflineRemotionCommittedVoiceTrack[]
}

export interface OfflineRemotionCommittedCaptionOverlay {
  outputKey: string
  mimeType: 'image/png'
  byteLength: number
  sha256: string
  bytesBase64: string
}

export interface OfflineRemotionCommittedVoiceTrack {
  sourceSequenceItemId: string
  outputKey: string
  durationFrames: number
  mimeType: 'audio/wav'
  byteLength: number
  sha256: string
  bytesBase64: string
}

export interface OfflineRemotionSingleSourceCaptionTrackFinalCompositionPayload extends Omit<
  OfflineRemotionSingleSourceCaptionTrackFinalCompositionPlanningPayload,
  'voiceTracks'
> {
  sourceMimeType: OfflineRemotionSingleSourceMimeType
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
  captionOverlays: OfflineRemotionCommittedCaptionOverlay[]
  voiceTracks?: OfflineRemotionCommittedVoiceTrack[]
}

export interface OfflineRemotionSourceSequenceCaptionTrackFinalCompositionPayload extends Omit<
  OfflineRemotionSourceSequenceCaptionTrackFinalCompositionPlanningPayload,
  'voiceTracks'
> {
  sources: OfflineRemotionSourceSequenceCommittedSource[]
  captionOverlays: OfflineRemotionCommittedCaptionOverlay[]
  voiceTracks?: OfflineRemotionCommittedVoiceTrack[]
}

export type OfflineRemotionFinalCompositionPayload =
  | OfflineRemotionSingleSourceFinalCompositionPayload
  | OfflineRemotionSingleSourceCaptionTrackFinalCompositionPayload
  | OfflineRemotionSourceSequenceFinalCompositionPayload
  | OfflineRemotionSourceSequenceCaptionTrackFinalCompositionPayload

export type OfflineRemotionRenderRequest = {
  schemaVersion: typeof OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL
  toolId: 'remotion'
  operationId: typeof OFFLINE_REMOTION_RENDER_OPERATION
} & (
  { payload: OfflineRemotionPreviewPlanningPayload }
  | { payload: OfflineRemotionFinalCompositionPayload }
  | { payload: OfflineRemotionMotionStudioScenePreviewPayload }
  | { payload: OfflineRemotionMotionStudioLayeredPayload }
  | { payload: OfflineRemotionMotionStudioAnimaticPayload }
  | { payload: OfflineRemotionMotionStudioRouteDrawPayload }
)

export type OfflineRemotionRenderPlanningPayload = OfflineRemotionPreviewPlanningPayload

export function validateOfflineRemotionRenderPlanningPayload(value: unknown): OfflineRemotionPreviewPlanningPayload {
  const request = validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: value,
  })
  if (
    isFinalCompositionPayload(request.payload) ||
    isMotionStudioScenePreviewPayload(request.payload) ||
    isMotionStudioLayeredPayload(request.payload) ||
    isMotionStudioAnimaticPayload(request.payload) ||
    isMotionStudioRouteDrawPayload(request.payload)
  ) {
    throw validationFailure('Preview planning cannot contain final-composition source bytes.')
  }
  return request.payload
}

export function validateOfflineRemotionMotionStudioLayeredPlanningPayload(
  value: unknown,
): OfflineRemotionMotionStudioLayeredPlanningPayload {
  const payload = exactRecord(value, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sceneId', 'sceneStartFrame', 'sceneEndFrame', 'semanticPurpose',
    'headline', 'caption', 'layerManifestDigest', 'depthModel', 'planes',
    'panelBackground', 'panelHighlight', 'headlineColor', 'accentColor',
    'captionColor', 'horizontalSafePercent', 'verticalSafePercent',
    'captionBottomPercent', 'captionAboveMask', 'contactObjectPresent', 'maskRisk',
  ], 'Motion Studio layered planning payload')
  const common = commonPayload(payload, 24, 450)
  if (
    payload.compositionProfileId !== 'motion_studio_native_layered_scene_v1' ||
    !(MOTION_STUDIO_PREVIEW_FRAMES as readonly string[]).includes(`${common.width}x${common.height}`)
  ) throw validationFailure('Motion Studio layered profile or frame is unsupported.')
  const sceneStartFrame = integer(payload.sceneStartFrame, 0, 10_000_000, 'sceneStartFrame')
  const sceneEndFrame = integer(payload.sceneEndFrame, 1, 10_000_000, 'sceneEndFrame')
  if (sceneEndFrame - sceneStartFrame !== common.durationFrames) {
    throw validationFailure('Motion Studio layered scene range must exactly match durationFrames.')
  }
  if (!Array.isArray(payload.planes) || payload.planes.length !== 4) {
    throw validationFailure('Motion Studio layered profile requires four exact semantic planes.')
  }
  const expected = [
    ['background-plane', 'background', 0, 'remotion_native', 'ambient_drift'],
    ['headline-plane', 'headline', 10, 'remotion_native', 'headline_reveal'],
    ['subject-plane', 'subject', 20, 'approved_cutout_slot', 'subject_parallax'],
    ['caption-plane', 'caption', 30, 'remotion_native', 'caption_hold'],
  ] as const
  const planes = payload.planes.map((value, index) => {
    const plane = exactRecord(value, ['planeId', 'role', 'zIndex', 'sourceKind', 'motionToken'], 'Motion Studio layered plane')
    const identity = expected[index]!
    if (
      plane.planeId !== identity[0] || plane.role !== identity[1] || plane.zIndex !== identity[2] ||
      plane.sourceKind !== identity[3] || plane.motionToken !== identity[4]
    ) throw validationFailure('Motion Studio layered plane identity or depth order is unsupported.')
    return {
      planeId: identity[0], role: identity[1], zIndex: identity[2],
      sourceKind: identity[3], motionToken: identity[4],
    }
  })
  const semanticPurpose = safeText(payload.semanticPurpose, 120, 'semanticPurpose')
  const headline = safeText(payload.headline, 120, 'headline')
  const caption = safeText(payload.caption, 160, 'caption')
  if (headline !== semanticPurpose || caption !== `Review · ${semanticPurpose}`) {
    throw validationFailure('Motion Studio layered copy diverges from exact scene authority.')
  }
  if (
    payload.depthModel !== 'semantic_planes_v1' || payload.panelBackground !== '#0F172A' ||
    payload.panelHighlight !== '#16213E' || payload.headlineColor !== '#E0F2FE' ||
    payload.accentColor !== '#FF4D8D' || payload.captionColor !== '#F8FAFC' ||
    payload.horizontalSafePercent !== 8 || payload.verticalSafePercent !== 8 ||
    payload.captionBottomPercent !== 9 || payload.captionAboveMask !== true ||
    payload.contactObjectPresent !== false || payload.maskRisk !== 'low_fixture_only'
  ) throw validationFailure('Motion Studio layered design, safety, or mask policy is unsupported.')
  if (typeof payload.layerManifestDigest !== 'string' || !SHA256.test(payload.layerManifestDigest)) {
    throw validationFailure('Motion Studio layered manifest digest is invalid.')
  }
  return {
    ...common,
    compositionProfileId: 'motion_studio_native_layered_scene_v1',
    sceneId: stableId(payload.sceneId, 'sceneId'),
    sceneStartFrame,
    sceneEndFrame,
    semanticPurpose,
    headline,
    caption,
    layerManifestDigest: payload.layerManifestDigest,
    depthModel: 'semantic_planes_v1',
    planes,
    panelBackground: '#0F172A',
    panelHighlight: '#16213E',
    headlineColor: '#E0F2FE',
    accentColor: '#FF4D8D',
    captionColor: '#F8FAFC',
    horizontalSafePercent: 8,
    verticalSafePercent: 8,
    captionBottomPercent: 9,
    captionAboveMask: true,
    contactObjectPresent: false,
    maskRisk: 'low_fixture_only',
  }
}

export function buildOfflineRemotionMotionStudioLayeredRequest(input: {
  planningPayload: unknown
  subject: { mimeType: 'image/png'; bytes: Buffer; sha256: string }
}): OfflineRemotionRenderRequest & { payload: OfflineRemotionMotionStudioLayeredPayload } {
  const planning = validateOfflineRemotionMotionStudioLayeredPlanningPayload(input.planningPayload)
  const subject = committedBytes(input.subject, 'image/png', 100, 1024 * 1024, 'layered subject')
  if (
    subject.bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    subject.bytes.toString('ascii', 12, 16) !== 'IHDR' || subject.bytes.readUInt32BE(16) !== 128 ||
    subject.bytes.readUInt32BE(20) !== 128 || subject.bytes[24] !== 8 || subject.bytes[25] !== 6
  ) throw validationFailure('Motion Studio layered subject is not the approved 128x128 RGBA PNG class.')
  const request = validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      ...planning,
      subjectMimeType: 'image/png',
      subjectByteLength: subject.bytes.byteLength,
      subjectSha256: subject.sha256,
      subjectBytesBase64: subject.bytes.toString('base64'),
    },
  })
  if (!isMotionStudioLayeredPayload(request.payload)) {
    throw validationFailure('Motion Studio layered request did not retain its registered profile.')
  }
  return request as OfflineRemotionRenderRequest & { payload: OfflineRemotionMotionStudioLayeredPayload }
}

export function validateOfflineRemotionMotionStudioAnimaticPlanningPayload(
  value: unknown,
): OfflineRemotionMotionStudioAnimaticPlanningPayload {
  const payload = exactRecord(value, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'scenes', 'panelBackground', 'accentColor',
  ], 'Motion Studio animatic planning payload')
  const common = commonPayload(payload, 24, 900)
  if (
    payload.compositionProfileId !== 'motion_studio_prepared_script_animatic_v1' ||
    !(MOTION_STUDIO_PREVIEW_FRAMES as readonly string[]).includes(`${common.width}x${common.height}`)
  ) throw validationFailure('Motion Studio animatic profile or frame is unsupported.')
  if (!Array.isArray(payload.scenes) || payload.scenes.length < 1 || payload.scenes.length > 8) {
    throw validationFailure('Motion Studio animatic requires one to eight scenes.')
  }
  const scenes = payload.scenes.map((value, order) => {
    const scene = exactRecord(value, [
      'order', 'sceneId', 'startFrame', 'endFrame', 'title', 'visualDescription',
    ], 'Motion Studio animatic scene')
    const startFrame = integer(scene.startFrame, 0, 899, 'startFrame')
    const endFrame = integer(scene.endFrame, 1, 900, 'endFrame')
    if (scene.order !== order || startFrame !== (order === 0 ? 0 : scenesEnd(payload.scenes as unknown[], order - 1))) {
      throw validationFailure('Motion Studio animatic scene order and ranges must be exact and contiguous.')
    }
    if (endFrame <= startFrame || endFrame > common.durationFrames) {
      throw validationFailure('Motion Studio animatic scene range is invalid.')
    }
    return {
      order,
      sceneId: stableId(scene.sceneId, 'sceneId'),
      startFrame,
      endFrame,
      title: safeText(scene.title, 120, 'title'),
      visualDescription: safeText(scene.visualDescription, 240, 'visualDescription'),
    }
  })
  if (scenes.at(-1)?.endFrame !== common.durationFrames || new Set(scenes.map((scene) => scene.sceneId)).size !== scenes.length) {
    throw validationFailure('Motion Studio animatic scenes must uniquely cover the exact duration.')
  }
  return {
    ...common,
    compositionProfileId: 'motion_studio_prepared_script_animatic_v1',
    scenes,
    panelBackground: color(payload.panelBackground, 'panelBackground'),
    accentColor: color(payload.accentColor, 'accentColor'),
  }
}

export function buildOfflineRemotionMotionStudioAnimaticRequest(input: {
  planningPayload: unknown
  narration: {
    mimeType: 'audio/wav' | 'audio/mpeg' | 'audio/mp3'
    bytes: Buffer
    sha256: string
  }
}): OfflineRemotionRenderRequest & { payload: OfflineRemotionMotionStudioAnimaticPayload } {
  const planning = validateOfflineRemotionMotionStudioAnimaticPlanningPayload(input.planningPayload)
  const narration = committedBytes(input.narration, input.narration.mimeType, 44, 16 * 1024 * 1024, 'narration')
  assertAudioSignature(narration.bytes, input.narration.mimeType)
  const request = validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      ...planning,
      narrationMimeType: input.narration.mimeType,
      narrationByteLength: narration.bytes.byteLength,
      narrationSha256: narration.sha256,
      narrationBytesBase64: narration.bytes.toString('base64'),
    },
  })
  if (!isMotionStudioAnimaticPayload(request.payload)) {
    throw validationFailure('Motion Studio animatic request did not retain its registered profile.')
  }
  return request as OfflineRemotionRenderRequest & { payload: OfflineRemotionMotionStudioAnimaticPayload }
}

export function validateOfflineRemotionMotionStudioRouteDrawPlanningPayload(
  value: unknown,
): OfflineRemotionMotionStudioRouteDrawPlanningPayload {
  const payload = exactRecord(value, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sceneId', 'sceneStartFrame', 'sceneEndFrame', 'semanticPurpose',
    'routePresetId', 'routeRevealStartFrame', 'routeRevealEndFrame',
    'waypointFrames', 'routeCoverColor', 'routeColor', 'routeGlowColor',
  ], 'Motion Studio deterministic route-draw planning payload')
  if (
    payload.compositionProfileId !== 'motion_studio_deterministic_route_draw_v1' ||
    payload.width !== 1280 || payload.height !== 720 || payload.fps !== 30 ||
    payload.durationFrames !== 180 || payload.sceneStartFrame !== 0 ||
    payload.sceneEndFrame !== 180 ||
    payload.routePresetId !== 'abstract_three_district_route_v1' ||
    payload.routeRevealStartFrame !== 18 || payload.routeRevealEndFrame !== 140 ||
    payload.routeCoverColor !== '#081426' || payload.routeColor !== '#FFB23D' ||
    payload.routeGlowColor !== '#FF7A1A'
  ) throw validationFailure('Motion Studio deterministic route-draw profile is unsupported.')
  if (
    !Array.isArray(payload.waypointFrames) || payload.waypointFrames.length !== 3 ||
    payload.waypointFrames[0] !== 18 || payload.waypointFrames[1] !== 82 ||
    payload.waypointFrames[2] !== 140
  ) throw validationFailure('Motion Studio deterministic waypoint timing is unsupported.')
  return {
    compositionProfileId: 'motion_studio_deterministic_route_draw_v1',
    width: 1280,
    height: 720,
    fps: 30,
    durationFrames: 180,
    sceneId: stableId(payload.sceneId, 'sceneId'),
    sceneStartFrame: 0,
    sceneEndFrame: 180,
    semanticPurpose: safeText(payload.semanticPurpose, 180, 'semanticPurpose'),
    routePresetId: 'abstract_three_district_route_v1',
    routeRevealStartFrame: 18,
    routeRevealEndFrame: 140,
    waypointFrames: [18, 82, 140],
    routeCoverColor: '#081426',
    routeColor: '#FFB23D',
    routeGlowColor: '#FF7A1A',
  }
}

export function buildOfflineRemotionMotionStudioRouteDrawRequest(input: {
  planningPayload: unknown
  keyframe: { mimeType: 'image/png'; bytes: Buffer; sha256: string }
}): OfflineRemotionRenderRequest & { payload: OfflineRemotionMotionStudioRouteDrawPayload } {
  const planning = validateOfflineRemotionMotionStudioRouteDrawPlanningPayload(input.planningPayload)
  const keyframe = committedBytes(input.keyframe, 'image/png', 1_024, 8 * 1024 * 1024, 'route-draw keyframe')
  if (
    keyframe.bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    keyframe.bytes.toString('ascii', 12, 16) !== 'IHDR' ||
    keyframe.bytes.readUInt32BE(16) !== 1280 || keyframe.bytes.readUInt32BE(20) !== 720 ||
    keyframe.bytes[24] !== 8 || keyframe.bytes[25] !== 2
  ) throw validationFailure('Motion Studio route-draw keyframe is not an exact opaque 1280x720 PNG.')
  const request = validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      ...planning,
      keyframeMimeType: 'image/png',
      keyframeByteLength: keyframe.bytes.byteLength,
      keyframeSha256: keyframe.sha256,
      keyframeBytesBase64: keyframe.bytes.toString('base64'),
    },
  })
  if (!isMotionStudioRouteDrawPayload(request.payload)) {
    throw validationFailure('Motion Studio route-draw request did not retain its registered profile.')
  }
  return request as OfflineRemotionRenderRequest & { payload: OfflineRemotionMotionStudioRouteDrawPayload }
}

export function validateOfflineRemotionFinalCompositionPlanningPayload(
  value: unknown,
): OfflineRemotionFinalCompositionPlanningPayload {
  const profile = record(value, 'final composition planning payload').compositionProfileId
  if (isSourceSequenceCompositionProfile(profile)) {
    const captionTrack = profile === 'approved_source_sequence_caption_track_final_v1'
    const raw = record(value, 'source-sequence final composition planning payload')
    const replaceVoice = raw.audioPolicy === 'replace_with_approved_voice_tracks'
    const sourceMediaPolicyProvided = Object.hasOwn(raw, 'sourceMediaPolicy')
    const deliveryMasterAuthorityProvided = Object.hasOwn(raw, 'renderPurpose')
    const payload = exactRecord(value, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sourceSegments', 'transitionPolicy', 'hardCutTransitions',
      'sourceFit', 'panelBackground', 'audioPolicy',
      ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
      'captionOverlayPolicy', ...(captionTrack ? ['captionOverlayCues'] : []),
      ...(replaceVoice ? ['voiceTracks'] : []),
      ...(deliveryMasterAuthorityProvided ? DELIVERY_MASTER_AUTHORITY_KEYS : []),
    ], 'source-sequence final composition planning payload')
    const common = commonPayload(
      payload,
      CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
      CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
    )
    const deliveryMasterAuthority = fourKDeliveryMasterAuthority(
      payload,
      common,
      deliveryMasterAuthorityProvided,
    )
    const sourceSegments = sourceSequenceSegments(payload.sourceSegments, common.durationFrames)
    const hardCutTransitions = approvedHardCutTransitions(
      payload.hardCutTransitions,
      sourceSegments,
    )
    const approvedColorIntermediate =
      payload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
    if (
      payload.transitionPolicy !== 'approved_hard_cuts_only' ||
      payload.sourceFit !== 'contain' ||
      !['preserve_source_sequence', 'replace_with_approved_voice_tracks'].includes(
        String(payload.audioPolicy),
      ) ||
      payload.captionOverlayPolicy !== (
        captionTrack ? 'approved_timed_full_frame_rgba_track' : 'approved_full_frame_rgba'
      ) ||
      (sourceMediaPolicyProvided && !approvedColorIntermediate) ||
      (approvedColorIntermediate && (
        payload.audioPolicy !== 'replace_with_approved_voice_tracks' ||
        sourceSegments.some((segment) =>
          segment.sourceStartFrame !== 0 ||
          segment.sourceEndFrameExclusive !==
            segment.timelineEndFrameExclusive - segment.timelineStartFrame)
      ))
    ) throw validationFailure('Source-sequence final composition policy is unsupported.')
    const commonResult = {
      ...common,
      sourceSegments,
      transitionPolicy: 'approved_hard_cuts_only',
      hardCutTransitions,
      sourceFit: 'contain',
      panelBackground: color(payload.panelBackground, 'panelBackground'),
      audioPolicy: payload.audioPolicy as
        | 'preserve_source_sequence'
        | 'replace_with_approved_voice_tracks',
      ...(approvedColorIntermediate
        ? { sourceMediaPolicy: 'approved_professional_color_intermediate_v1' as const }
        : {}),
      ...(replaceVoice ? {
        voiceTracks: voiceTrackPlanningPayloads(
          payload.voiceTracks,
          sourceSegments.map((segment) => ({
            sourceSequenceItemId: segment.sourceSequenceItemId,
            durationFrames: segment.timelineEndFrameExclusive - segment.timelineStartFrame,
          })),
        ),
      } : {}),
      ...deliveryMasterAuthority,
    } as const
    return captionTrack ? {
      ...commonResult,
      compositionProfileId: 'approved_source_sequence_caption_track_final_v1',
      captionOverlayPolicy: 'approved_timed_full_frame_rgba_track',
      captionOverlayCues: captionOverlayCues(payload.captionOverlayCues, common.durationFrames),
    } : {
      ...commonResult,
      compositionProfileId: 'approved_source_sequence_caption_final_v1',
      captionOverlayPolicy: 'approved_full_frame_rgba',
    }
  }
  const captionTrack = profile === 'approved_source_caption_track_final_v1'
  const raw = record(value, 'final composition planning payload')
  const replaceVoice = raw.audioPolicy === 'replace_with_approved_voice_tracks'
  const sourceMediaPolicyProvided = Object.hasOwn(raw, 'sourceMediaPolicy')
  const deliveryMasterAuthorityProvided = Object.hasOwn(raw, 'renderPurpose')
  const payload = exactRecord(value, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit',
    'panelBackground', 'audioPolicy', 'captionOverlayPolicy',
    ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
    ...(captionTrack ? ['captionOverlayCues'] : []),
    ...(replaceVoice ? ['voiceTracks'] : []),
    ...(deliveryMasterAuthorityProvided ? DELIVERY_MASTER_AUTHORITY_KEYS : []),
  ], 'final composition planning payload')
  const common = commonPayload(
    payload,
    CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
    CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  )
  const deliveryMasterAuthority = fourKDeliveryMasterAuthority(
    payload,
    common,
    deliveryMasterAuthorityProvided,
  )
  const sourceStartFrame = integer(payload.sourceStartFrame, 0, 100_000_000, 'sourceStartFrame')
  const sourceEndFrameExclusive = integer(
    payload.sourceEndFrameExclusive,
    1,
    100_000_000,
    'sourceEndFrameExclusive',
  )
  const approvedColorIntermediate =
    payload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
  if (
    !['approved_source_caption_final_v1', 'approved_source_caption_track_final_v1'].includes(
      String(payload.compositionProfileId),
    ) ||
    payload.sourceFit !== 'contain' ||
    !['preserve_source', 'replace_with_approved_voice_tracks'].includes(String(payload.audioPolicy)) ||
    payload.captionOverlayPolicy !== (
      captionTrack ? 'approved_timed_full_frame_rgba_track' : 'approved_full_frame_rgba'
    ) ||
    sourceEndFrameExclusive - sourceStartFrame !== common.durationFrames
    || (sourceMediaPolicyProvided && !approvedColorIntermediate)
    || (approvedColorIntermediate && (
      payload.audioPolicy !== 'replace_with_approved_voice_tracks' ||
      sourceStartFrame !== 0 || sourceEndFrameExclusive !== common.durationFrames
    ))
  ) throw validationFailure('Final composition policy is unsupported.')
  const commonResult = {
    ...common,
    sourceStartFrame,
    sourceEndFrameExclusive,
    sourceFit: 'contain',
    panelBackground: color(payload.panelBackground, 'panelBackground'),
    audioPolicy: payload.audioPolicy as 'preserve_source' | 'replace_with_approved_voice_tracks',
    ...(approvedColorIntermediate
      ? { sourceMediaPolicy: 'approved_professional_color_intermediate_v1' as const }
      : {}),
    ...(replaceVoice ? {
      voiceTracks: voiceTrackPlanningPayloads(payload.voiceTracks, [{
        sourceSequenceItemId: undefined,
        durationFrames: common.durationFrames,
      }]),
    } : {}),
    ...deliveryMasterAuthority,
  } as const
  return captionTrack ? {
    ...commonResult,
    compositionProfileId: 'approved_source_caption_track_final_v1',
    captionOverlayPolicy: 'approved_timed_full_frame_rgba_track',
    captionOverlayCues: captionOverlayCues(payload.captionOverlayCues, common.durationFrames),
  } : {
    ...commonResult,
    compositionProfileId: 'approved_source_caption_final_v1',
    captionOverlayPolicy: 'approved_full_frame_rgba',
  }
}

export function buildOfflineRemotionFinalCompositionRequest(input: {
  planningPayload: unknown
  source?: { mimeType: OfflineRemotionSingleSourceMimeType; bytes: Buffer; sha256: string }
  sources?: Array<{
    sourceSequenceItemId: string
    mimeType: OfflineRemotionSingleSourceMimeType
    bytes: Buffer
    sha256: string
  }>
  captionOverlay?: { mimeType: 'image/png'; bytes: Buffer; sha256: string }
  captionOverlays?: Array<{
    outputKey: string
    mimeType: 'image/png'
    bytes: Buffer
    sha256: string
  }>
  voiceTracks?: Array<{
    sourceSequenceItemId: string
    outputKey: string
    mimeType: 'audio/wav'
    bytes: Buffer
    sha256: string
  }>
}): OfflineRemotionRenderRequest {
  const planning = validateOfflineRemotionFinalCompositionPlanningPayload(input.planningPayload)
  const replaceVoice = planning.audioPolicy === 'replace_with_approved_voice_tracks'
  const voiceTracks = replaceVoice
    ? committedVoiceTracks(input.voiceTracks, planning.voiceTracks ?? [], planning.fps)
    : undefined
  if (!replaceVoice && input.voiceTracks !== undefined) {
    throw validationFailure('Preserved-source audio cannot receive replacement voice tracks.')
  }
  const captionTrack = isCaptionTrackPlanningPayload(planning)
  const overlays = captionTrack
    ? committedCaptionOverlays(input.captionOverlays, planning.captionOverlayCues)
    : [committedCaptionOverlay(input.captionOverlay)]
  if (captionTrack ? input.captionOverlay !== undefined : input.captionOverlays !== undefined) {
    throw validationFailure('Final composition caption inputs do not match the approved profile.')
  }
  if (isSourceSequencePlanningPayload(planning)) {
    if (input.source !== undefined || !input.sources) {
      throw validationFailure('Source-sequence composition requires only the exact approved source list.')
    }
    if (
      input.sources.length !== planning.sourceSegments.length ||
      input.sources.some((source, index) =>
        source.sourceSequenceItemId !== planning.sourceSegments[index]?.sourceSequenceItemId)
    ) throw validationFailure('Source-sequence bytes do not match the approved segment order.')
    const sourceMimeType = planning.sourceMediaPolicy ===
      'approved_professional_color_intermediate_v1'
      ? 'video/x-matroska' as const
      : 'video/mp4' as const
    const sources = input.sources.map((candidate) => {
      const source = committedBytes(candidate, sourceMimeType, 64, 16 * 1024 * 1024, 'source')
      validateSequenceSourceSignature(source.bytes, sourceMimeType)
      return {
        sourceSequenceItemId: candidate.sourceSequenceItemId,
        sourceMimeType,
        sourceByteLength: source.bytes.byteLength,
        sourceSha256: source.sha256,
        sourceBytesBase64: source.bytes.toString('base64'),
      }
    })
    if (sources.reduce((total, source) => total + source.sourceByteLength, 0) > 20 * 1024 * 1024) {
      throw validationFailure('Source-sequence composition exceeds the bounded combined source ceiling.')
    }
    if (isCaptionTrackPlanningPayload(planning)) {
      return validateOfflineRemotionRenderRequest({
        schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
        toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
        payload: { ...planning, sources, captionOverlays: overlays, ...(voiceTracks ? { voiceTracks } : {}) },
      })
    }
    return validateOfflineRemotionRenderRequest({
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: {
        ...planning,
        sources,
        ...(voiceTracks ? { voiceTracks } : {}),
        captionOverlayMimeType: 'image/png',
        captionOverlayByteLength: overlays[0]!.byteLength,
        captionOverlaySha256: overlays[0]!.sha256,
        captionOverlayBytesBase64: overlays[0]!.bytesBase64,
      },
    })
  }
  if (!input.source || input.sources !== undefined) {
    throw validationFailure('Single-source composition requires one exact approved source.')
  }
  const sourceMimeType = planning.sourceMediaPolicy ===
    'approved_professional_color_intermediate_v1'
    ? 'video/x-matroska' as const
    : 'video/mp4' as const
  const source = committedBytes(input.source, sourceMimeType, 64, 16 * 1024 * 1024, 'source')
  validateSingleSourceCommitment(source.bytes, sourceMimeType, planning)
  if (isCaptionTrackPlanningPayload(planning)) {
    return validateOfflineRemotionRenderRequest({
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: {
        ...planning,
        sourceMimeType, sourceByteLength: source.bytes.byteLength,
        sourceSha256: source.sha256, sourceBytesBase64: source.bytes.toString('base64'),
        captionOverlays: overlays,
        ...(voiceTracks ? { voiceTracks } : {}),
      },
    })
  }
  return validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      ...planning,
      sourceMimeType, sourceByteLength: source.bytes.byteLength,
      sourceSha256: source.sha256, sourceBytesBase64: source.bytes.toString('base64'),
      captionOverlayMimeType: 'image/png',
      captionOverlayByteLength: overlays[0]!.byteLength,
      captionOverlaySha256: overlays[0]!.sha256,
      captionOverlayBytesBase64: overlays[0]!.bytesBase64,
      ...(voiceTracks ? { voiceTracks } : {}),
    },
  })
}

export function validateOfflineRemotionRenderRequest(value: unknown): OfflineRemotionRenderRequest {
  const request = exactRecord(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (
    request.schemaVersion !== OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL || request.toolId !== 'remotion' ||
    request.operationId !== OFFLINE_REMOTION_RENDER_OPERATION
  ) throw validationFailure('Remotion request identity is unsupported.')
  const payloadRecord = record(request.payload, 'payload')
  if (payloadRecord.compositionProfileId === 'motion_studio_deterministic_route_draw_v1') {
    const payload = exactRecord(payloadRecord, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sceneId', 'sceneStartFrame', 'sceneEndFrame', 'semanticPurpose',
      'routePresetId', 'routeRevealStartFrame', 'routeRevealEndFrame',
      'waypointFrames', 'routeCoverColor', 'routeColor', 'routeGlowColor',
      'keyframeMimeType', 'keyframeByteLength', 'keyframeSha256', 'keyframeBytesBase64',
    ], 'Motion Studio deterministic route-draw payload')
    const planning = validateOfflineRemotionMotionStudioRouteDrawPlanningPayload({
      compositionProfileId: payload.compositionProfileId,
      width: payload.width,
      height: payload.height,
      fps: payload.fps,
      durationFrames: payload.durationFrames,
      sceneId: payload.sceneId,
      sceneStartFrame: payload.sceneStartFrame,
      sceneEndFrame: payload.sceneEndFrame,
      semanticPurpose: payload.semanticPurpose,
      routePresetId: payload.routePresetId,
      routeRevealStartFrame: payload.routeRevealStartFrame,
      routeRevealEndFrame: payload.routeRevealEndFrame,
      waypointFrames: payload.waypointFrames,
      routeCoverColor: payload.routeCoverColor,
      routeColor: payload.routeColor,
      routeGlowColor: payload.routeGlowColor,
    })
    const keyframe = decodeCommittedBase64(payload, 'keyframe', 'image/png', 1_024, 8 * 1024 * 1024)
    if (
      keyframe.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
      keyframe.toString('ascii', 12, 16) !== 'IHDR' || keyframe.readUInt32BE(16) !== 1280 ||
      keyframe.readUInt32BE(20) !== 720 || keyframe[24] !== 8 || keyframe[25] !== 2
    ) throw validationFailure('Motion Studio route-draw keyframe signature is invalid.')
    return {
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion',
      operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: {
        ...planning,
        keyframeMimeType: 'image/png',
        keyframeByteLength: keyframe.byteLength,
        keyframeSha256: String(payload.keyframeSha256),
        keyframeBytesBase64: keyframe.toString('base64'),
      },
    }
  }
  if (payloadRecord.compositionProfileId === 'motion_studio_native_layered_scene_v1') {
    const payload = exactRecord(payloadRecord, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sceneId', 'sceneStartFrame', 'sceneEndFrame', 'semanticPurpose',
      'headline', 'caption', 'layerManifestDigest', 'depthModel', 'planes',
      'panelBackground', 'panelHighlight', 'headlineColor', 'accentColor',
      'captionColor', 'horizontalSafePercent', 'verticalSafePercent',
      'captionBottomPercent', 'captionAboveMask', 'contactObjectPresent', 'maskRisk',
      'subjectMimeType', 'subjectByteLength', 'subjectSha256', 'subjectBytesBase64',
    ], 'Motion Studio layered payload')
    const planning = validateOfflineRemotionMotionStudioLayeredPlanningPayload({
      compositionProfileId: payload.compositionProfileId,
      width: payload.width,
      height: payload.height,
      fps: payload.fps,
      durationFrames: payload.durationFrames,
      sceneId: payload.sceneId,
      sceneStartFrame: payload.sceneStartFrame,
      sceneEndFrame: payload.sceneEndFrame,
      semanticPurpose: payload.semanticPurpose,
      headline: payload.headline,
      caption: payload.caption,
      layerManifestDigest: payload.layerManifestDigest,
      depthModel: payload.depthModel,
      planes: payload.planes,
      panelBackground: payload.panelBackground,
      panelHighlight: payload.panelHighlight,
      headlineColor: payload.headlineColor,
      accentColor: payload.accentColor,
      captionColor: payload.captionColor,
      horizontalSafePercent: payload.horizontalSafePercent,
      verticalSafePercent: payload.verticalSafePercent,
      captionBottomPercent: payload.captionBottomPercent,
      captionAboveMask: payload.captionAboveMask,
      contactObjectPresent: payload.contactObjectPresent,
      maskRisk: payload.maskRisk,
    })
    const subject = decodeCommittedBase64(payload, 'subject', 'image/png', 100, 1024 * 1024)
    if (
      subject.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
      subject.toString('ascii', 12, 16) !== 'IHDR' || subject.readUInt32BE(16) !== 128 ||
      subject.readUInt32BE(20) !== 128 || subject[24] !== 8 || subject[25] !== 6
    ) throw validationFailure('Motion Studio layered subject signature or RGBA authority is invalid.')
    return {
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion',
      operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: {
        ...planning,
        subjectMimeType: 'image/png',
        subjectByteLength: subject.byteLength,
        subjectSha256: String(payload.subjectSha256),
        subjectBytesBase64: subject.toString('base64'),
      },
    }
  }
  if (payloadRecord.compositionProfileId === 'motion_studio_scene_preview_v1') {
    const payload = exactRecord(payloadRecord, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sceneId', 'sceneStartFrame', 'sceneEndFrame', 'semanticPurpose',
      'productionMode', 'layerType', 'panelBackground', 'accentColor',
    ], 'Motion Studio scene preview payload')
    const common = commonPayload(payload, 24, 450)
    if (!(MOTION_STUDIO_PREVIEW_FRAMES as readonly string[]).includes(`${common.width}x${common.height}`)) {
      throw validationFailure('Motion Studio preview frame is invalid; use an exact even-dimension profile.')
    }
    const sceneStartFrame = integer(payload.sceneStartFrame, 0, 10_000_000, 'sceneStartFrame')
    const sceneEndFrame = integer(payload.sceneEndFrame, 1, 10_000_000, 'sceneEndFrame')
    if (sceneEndFrame - sceneStartFrame !== common.durationFrames) {
      throw validationFailure('Motion Studio scene range must exactly match durationFrames.')
    }
    return {
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: {
        compositionProfileId: 'motion_studio_scene_preview_v1',
        width: common.width,
        height: common.height,
        fps: common.fps,
        durationFrames: common.durationFrames,
        sceneId: stableId(payload.sceneId, 'sceneId'),
        sceneStartFrame,
        sceneEndFrame,
        semanticPurpose: safeText(payload.semanticPurpose, 240, 'semanticPurpose'),
        productionMode: oneOf(payload.productionMode, [
          'generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed',
        ], 'productionMode'),
        layerType: oneOf(payload.layerType, [
          'image', 'source_footage', 'generated_video', 'text', 'caption', 'map', 'chart', 'mask', 'audio', 'effect',
        ], 'layerType'),
        panelBackground: color(payload.panelBackground, 'panelBackground'),
        accentColor: color(payload.accentColor, 'accentColor'),
      },
    }
  }
  if (payloadRecord.compositionProfileId === 'motion_studio_prepared_script_animatic_v1') {
    const payload = exactRecord(payloadRecord, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'scenes', 'panelBackground', 'accentColor', 'narrationMimeType',
      'narrationByteLength', 'narrationSha256', 'narrationBytesBase64',
    ], 'Motion Studio animatic payload')
    const planning = validateOfflineRemotionMotionStudioAnimaticPlanningPayload({
      compositionProfileId: payload.compositionProfileId,
      width: payload.width,
      height: payload.height,
      fps: payload.fps,
      durationFrames: payload.durationFrames,
      scenes: payload.scenes,
      panelBackground: payload.panelBackground,
      accentColor: payload.accentColor,
    })
    const narrationMimeType = oneOf(payload.narrationMimeType, ['audio/wav', 'audio/mpeg', 'audio/mp3'], 'narrationMimeType')
    const narration = decodeCommittedBase64(payload, 'narration', narrationMimeType, 44, 16 * 1024 * 1024)
    assertAudioSignature(narration, narrationMimeType)
    return {
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion',
      operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: {
        compositionProfileId: 'motion_studio_prepared_script_animatic_v1',
        width: planning.width,
        height: planning.height,
        fps: planning.fps,
        durationFrames: planning.durationFrames,
        scenes: planning.scenes,
        panelBackground: planning.panelBackground,
        accentColor: planning.accentColor,
        narrationMimeType,
        narrationByteLength: narration.byteLength,
        narrationSha256: String(payload.narrationSha256),
        narrationBytesBase64: narration.toString('base64'),
      },
    }
  }

  if (Object.hasOwn(payloadRecord, 'compositionProfileId')) {
    if (isSourceSequenceCompositionProfile(payloadRecord.compositionProfileId)) {
      const captionTrack = payloadRecord.compositionProfileId ===
        'approved_source_sequence_caption_track_final_v1'
      const replaceVoice = payloadRecord.audioPolicy === 'replace_with_approved_voice_tracks'
      const sourceMediaPolicyProvided = Object.hasOwn(payloadRecord, 'sourceMediaPolicy')
      const deliveryMasterAuthorityProvided = Object.hasOwn(payloadRecord, 'renderPurpose')
      const payload = exactRecord(payloadRecord, [
        'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
        'sourceSegments', 'transitionPolicy', 'hardCutTransitions',
        'sourceFit', 'panelBackground', 'audioPolicy',
        ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
        'captionOverlayPolicy', ...(captionTrack ? ['captionOverlayCues'] : []), 'sources',
        ...(captionTrack
          ? ['captionOverlays']
          : ['captionOverlayMimeType', 'captionOverlayByteLength', 'captionOverlaySha256', 'captionOverlayBytesBase64']),
        ...(replaceVoice ? ['voiceTracks'] : []),
        ...(deliveryMasterAuthorityProvided ? DELIVERY_MASTER_AUTHORITY_KEYS : []),
      ], 'source-sequence final composition payload')
      const planning = validateOfflineRemotionFinalCompositionPlanningPayload({
        compositionProfileId: payload.compositionProfileId, width: payload.width,
        height: payload.height, fps: payload.fps, durationFrames: payload.durationFrames,
        sourceSegments: payload.sourceSegments,
        transitionPolicy: payload.transitionPolicy,
        hardCutTransitions: payload.hardCutTransitions,
        sourceFit: payload.sourceFit,
        panelBackground: payload.panelBackground, audioPolicy: payload.audioPolicy,
        ...(sourceMediaPolicyProvided ? { sourceMediaPolicy: payload.sourceMediaPolicy } : {}),
        captionOverlayPolicy: payload.captionOverlayPolicy,
        ...(captionTrack ? { captionOverlayCues: payload.captionOverlayCues } : {}),
        ...(replaceVoice
          ? { voiceTracks: voiceTrackPlanningFromCommitments(payload.voiceTracks) }
          : {}),
        ...(deliveryMasterAuthorityProvided
          ? pickDeliveryMasterAuthority(payload)
          : {}),
      })
      if (!isSourceSequencePlanningPayload(planning)) {
        throw validationFailure('Source-sequence final composition profile changed during validation.')
      }
      if (!Array.isArray(payload.sources) || payload.sources.length !== planning.sourceSegments.length) {
        throw validationFailure('Source-sequence commitments are incomplete.')
      }
      const sourceMimeType = planning.sourceMediaPolicy ===
        'approved_professional_color_intermediate_v1'
        ? 'video/x-matroska' as const
        : 'video/mp4' as const
      let totalSourceBytes = 0
      const sources = payload.sources.map((value, index) => {
        const source = exactRecord(value, [
          'sourceSequenceItemId', 'sourceMimeType', 'sourceByteLength',
          'sourceSha256', 'sourceBytesBase64',
        ], `source sequence item ${index + 1}`)
        if (source.sourceSequenceItemId !== planning.sourceSegments[index]?.sourceSequenceItemId) {
          throw validationFailure('Source-sequence commitment order diverged from the approved timeline.')
        }
        const bytes = decodeCommittedRecord(
          source,
          'source',
          sourceMimeType,
          64,
          16 * 1024 * 1024,
        )
        validateSequenceSourceSignature(bytes, sourceMimeType)
        totalSourceBytes += bytes.byteLength
        return {
          sourceSequenceItemId: String(source.sourceSequenceItemId),
          sourceMimeType,
          sourceByteLength: bytes.byteLength,
          sourceSha256: String(source.sourceSha256),
          sourceBytesBase64: bytes.toString('base64'),
        }
      })
      if (totalSourceBytes > 20 * 1024 * 1024) {
        throw validationFailure('Source-sequence commitments exceed the combined byte ceiling.')
      }
      const voiceTracks = replaceVoice
        ? decodeVoiceTrackRecords(payload.voiceTracks, planning.voiceTracks ?? [], planning.fps)
        : undefined
      if (isCaptionTrackPlanningPayload(planning)) {
        return boundedRequest({
          schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
          toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
          payload: {
            ...withoutVoiceTrackPlanning(planning),
            sources,
            captionOverlays: decodeCaptionOverlayRecords(
              payload.captionOverlays,
              planning.captionOverlayCues,
            ),
            ...(voiceTracks ? { voiceTracks } : {}),
          },
        })
      }
      return boundedRequest({
        schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
        toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
        payload: {
          ...withoutVoiceTrackPlanning(planning),
          sources,
          ...legacyCaptionCommitment(payload, 'Source-sequence'),
          ...(voiceTracks ? { voiceTracks } : {}),
        },
      })
    }
    const captionTrack = payloadRecord.compositionProfileId === 'approved_source_caption_track_final_v1'
    const replaceVoice = payloadRecord.audioPolicy === 'replace_with_approved_voice_tracks'
    const sourceMediaPolicyProvided = Object.hasOwn(payloadRecord, 'sourceMediaPolicy')
    const deliveryMasterAuthorityProvided = Object.hasOwn(payloadRecord, 'renderPurpose')
    const payload = exactRecord(payloadRecord, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit',
      'panelBackground', 'audioPolicy', 'captionOverlayPolicy',
      ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
      'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
      ...(captionTrack
        ? ['captionOverlayCues', 'captionOverlays']
        : ['captionOverlayMimeType', 'captionOverlayByteLength', 'captionOverlaySha256', 'captionOverlayBytesBase64']),
      ...(replaceVoice ? ['voiceTracks'] : []),
      ...(deliveryMasterAuthorityProvided ? DELIVERY_MASTER_AUTHORITY_KEYS : []),
    ], 'final composition payload')
    const planning = validateOfflineRemotionFinalCompositionPlanningPayload({
      compositionProfileId: payload.compositionProfileId, width: payload.width, height: payload.height,
      fps: payload.fps, durationFrames: payload.durationFrames, sourceFit: payload.sourceFit,
      sourceStartFrame: payload.sourceStartFrame,
      sourceEndFrameExclusive: payload.sourceEndFrameExclusive,
      panelBackground: payload.panelBackground, audioPolicy: payload.audioPolicy,
      captionOverlayPolicy: payload.captionOverlayPolicy,
      ...(sourceMediaPolicyProvided ? { sourceMediaPolicy: payload.sourceMediaPolicy } : {}),
      ...(captionTrack ? { captionOverlayCues: payload.captionOverlayCues } : {}),
      ...(replaceVoice
        ? { voiceTracks: voiceTrackPlanningFromCommitments(payload.voiceTracks) }
        : {}),
      ...(deliveryMasterAuthorityProvided
        ? pickDeliveryMasterAuthority(payload)
        : {}),
    })
    if (isSourceSequencePlanningPayload(planning)) {
      throw validationFailure('Single-source final composition profile changed during validation.')
    }
    const sourceMimeType = planning.sourceMediaPolicy ===
      'approved_professional_color_intermediate_v1'
      ? 'video/x-matroska' as const
      : 'video/mp4' as const
    const source = decodeCommittedBase64(
      payload,
      'source',
      sourceMimeType,
      64,
      16 * 1024 * 1024,
    )
    validateSingleSourceCommitment(source, sourceMimeType, planning)
    const voiceTracks = replaceVoice
      ? decodeVoiceTrackRecords(payload.voiceTracks, planning.voiceTracks ?? [], planning.fps)
      : undefined
    if (isCaptionTrackPlanningPayload(planning)) {
      return boundedRequest({
        schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
        toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
        payload: {
          ...withoutVoiceTrackPlanning(planning),
          sourceMimeType, sourceByteLength: source.byteLength,
          sourceSha256: String(payload.sourceSha256), sourceBytesBase64: source.toString('base64'),
          captionOverlays: decodeCaptionOverlayRecords(
            payload.captionOverlays,
            planning.captionOverlayCues,
          ),
          ...(voiceTracks ? { voiceTracks } : {}),
        },
      })
    }
    return boundedRequest({
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: {
        ...withoutVoiceTrackPlanning(planning),
        sourceMimeType, sourceByteLength: source.byteLength,
        sourceSha256: String(payload.sourceSha256), sourceBytesBase64: source.toString('base64'),
        ...legacyCaptionCommitment(payload, 'Final composition'),
        ...(voiceTracks ? { voiceTracks } : {}),
      },
    })
  }
  const payload = exactRecord(payloadRecord, [
    'width', 'height', 'fps', 'durationFrames', 'frameTemplateId',
    'panelBackground', 'accentColor', 'title', 'subtitle', 'caption',
  ], 'preview payload')
  const common = commonPayload(payload, 24, 90)
  if (!(PRIVATE_REVIEW_FRAMES as readonly string[]).includes(`${common.width}x${common.height}`)) {
    throw validationFailure('Preview compositions cannot request a delivery-master frame.')
  }
  return boundedRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      ...common,
      frameTemplateId: oneOf(payload.frameTemplateId, ['approved_full_panel_v1', 'approved_lower_panel_v1'], 'frameTemplateId'),
      panelBackground: color(payload.panelBackground, 'panelBackground'),
      accentColor: color(payload.accentColor, 'accentColor'),
      title: safeText(payload.title, 120, 'title'), subtitle: safeText(payload.subtitle, 180, 'subtitle'),
      caption: safeText(payload.caption, 140, 'caption'),
    },
  })
}

export function isFinalCompositionPayload(
  payload: OfflineRemotionRenderRequest['payload'],
): payload is OfflineRemotionFinalCompositionPayload {
  return 'compositionProfileId' in payload && (
    payload.compositionProfileId === 'approved_source_caption_final_v1' ||
    payload.compositionProfileId === 'approved_source_caption_track_final_v1' ||
    payload.compositionProfileId === 'approved_source_sequence_caption_final_v1' ||
    payload.compositionProfileId === 'approved_source_sequence_caption_track_final_v1'
  )
}

export function isMotionStudioScenePreviewPayload(
  payload: OfflineRemotionRenderRequest['payload'],
): payload is OfflineRemotionMotionStudioScenePreviewPayload {
  return 'compositionProfileId' in payload && payload.compositionProfileId === 'motion_studio_scene_preview_v1'
}

export function isMotionStudioLayeredPayload(
  payload: OfflineRemotionRenderRequest['payload'],
): payload is OfflineRemotionMotionStudioLayeredPayload {
  return 'compositionProfileId' in payload && payload.compositionProfileId === 'motion_studio_native_layered_scene_v1'
}

export function isMotionStudioAnimaticPayload(
  payload: OfflineRemotionRenderRequest['payload'],
): payload is OfflineRemotionMotionStudioAnimaticPayload {
  return 'compositionProfileId' in payload && payload.compositionProfileId === 'motion_studio_prepared_script_animatic_v1'
}

export function isMotionStudioRouteDrawPayload(
  payload: OfflineRemotionRenderRequest['payload'],
): payload is OfflineRemotionMotionStudioRouteDrawPayload {
  return 'compositionProfileId' in payload && payload.compositionProfileId === 'motion_studio_deterministic_route_draw_v1'
}

export function offlineRemotionRequestSha256(request: OfflineRemotionRenderRequest): string {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex')
}

function boundedRequest(request: OfflineRemotionRenderRequest): OfflineRemotionRenderRequest {
  if (Buffer.byteLength(JSON.stringify(request)) > OFFLINE_REMOTION_RENDER_MAXIMUM_REQUEST_BYTES) {
    throw validationFailure('Remotion request exceeds the fixed serialized-request ceiling.')
  }
  return request
}

function commonPayload(value: Record<string, unknown>, minimumFrames: number, maximumFrames: number): CommonCompositionPayload {
  const width = integer(value.width, 360, 3840, 'width') as CommonCompositionPayload['width']
  const height = integer(value.height, 360, 3840, 'height') as CommonCompositionPayload['height']
  if (!(APPROVED_FRAMES as readonly string[]).includes(`${width}x${height}`)) {
    throw validationFailure('Remotion output frame is not approved.')
  }
  return {
    width, height, fps: oneOf(value.fps, [24, 30], 'fps'),
    durationFrames: integer(value.durationFrames, minimumFrames, maximumFrames, 'durationFrames'),
  }
}

function fourKDeliveryMasterAuthority(
  value: Record<string, unknown>,
  frame: Pick<CommonCompositionPayload, 'width' | 'height'>,
  provided: boolean,
): OfflineRemotionFourKDeliveryMasterAuthority {
  if (!provided) {
    if (!(PRIVATE_REVIEW_FRAMES as readonly string[]).includes(`${frame.width}x${frame.height}`)) {
      throw validationFailure('A 4K final frame requires exact delivery-master authority.')
    }
    return {}
  }
  if (
    !(FOUR_K_MASTER_FRAMES as readonly string[]).includes(`${frame.width}x${frame.height}`) ||
    value.renderPurpose !== 'private_4k_delivery_master_v1' ||
    value.deliveryProfileId !== 'uhd_2160' ||
    value.estimateCostBasisProfileId !== 'uhd_2160' ||
    value.sourceQualityPolicy !== 'immutable_source_master_no_proxy_v1' ||
    value.usesApprovedEditReservation !== true ||
    value.requiresSeparateExportEstimate !== false ||
    value.allowsAdditionalExportCharge !== false
  ) throw validationFailure('4K delivery-master authority is incomplete or inconsistent.')
  return {
    renderPurpose: 'private_4k_delivery_master_v1',
    deliveryProfileId: 'uhd_2160',
    estimateCostBasisProfileId: 'uhd_2160',
    sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
  }
}

function pickDeliveryMasterAuthority(
  value: Record<string, unknown>,
): OfflineRemotionFourKDeliveryMasterAuthority {
  return {
    renderPurpose: value.renderPurpose as 'private_4k_delivery_master_v1',
    deliveryProfileId: value.deliveryProfileId as 'uhd_2160',
    estimateCostBasisProfileId: value.estimateCostBasisProfileId as 'uhd_2160',
    sourceQualityPolicy: value.sourceQualityPolicy as 'immutable_source_master_no_proxy_v1',
    usesApprovedEditReservation: value.usesApprovedEditReservation as true,
    requiresSeparateExportEstimate: value.requiresSeparateExportEstimate as false,
    allowsAdditionalExportCharge: value.allowsAdditionalExportCharge as false,
  }
}

function validateSingleSourceCommitment(
  bytes: Buffer,
  mimeType: OfflineRemotionSingleSourceMimeType,
  planning: {
    sourceStartFrame: number
    sourceEndFrameExclusive: number
    durationFrames: number
    audioPolicy: 'preserve_source' | 'replace_with_approved_voice_tracks'
  },
): void {
  if (mimeType === 'video/mp4') {
    if (bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
      throw validationFailure('Final composition MP4 source has an invalid signature.')
    }
    return
  }
  if (
    bytes.byteLength < 4 || bytes[0] !== 0x1a || bytes[1] !== 0x45 ||
    bytes[2] !== 0xdf || bytes[3] !== 0xa3
  ) throw validationFailure('Final composition Matroska source has an invalid signature.')
  if (
    planning.audioPolicy !== 'replace_with_approved_voice_tracks' ||
    planning.sourceStartFrame !== 0 ||
    planning.sourceEndFrameExclusive !== planning.durationFrames
  ) {
    throw validationFailure(
      'A professional color intermediate requires normalized frames and approved replacement voice audio.',
    )
  }
}

function validateSequenceSourceSignature(
  bytes: Buffer,
  mimeType: OfflineRemotionSingleSourceMimeType,
): void {
  if (mimeType === 'video/mp4') {
    if (bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
      throw validationFailure('Source-sequence MP4 dependency has an invalid signature.')
    }
    return
  }
  if (
    bytes.byteLength < 4 || bytes[0] !== 0x1a || bytes[1] !== 0x45 ||
    bytes[2] !== 0xdf || bytes[3] !== 0xa3
  ) throw validationFailure('Source-sequence Matroska dependency has an invalid signature.')
}

function committedBytes<T extends
  'video/mp4' | 'video/x-matroska' | 'image/png' | 'audio/wav' | 'audio/mpeg' | 'audio/mp3'>(
  input: { mimeType: T; bytes: Buffer; sha256: string },
  expectedMimeType: T,
  minimumBytes: number,
  maximumBytes: number,
  label: string,
): { bytes: Buffer; sha256: string } {
  if (
    input.mimeType !== expectedMimeType || !Buffer.isBuffer(input.bytes) ||
    input.bytes.byteLength < minimumBytes || input.bytes.byteLength > maximumBytes ||
    !SHA256.test(input.sha256) || createHash('sha256').update(input.bytes).digest('hex') !== input.sha256
  ) throw validationFailure(`${label} bytes do not match their approved content commitment.`)
  return { bytes: input.bytes, sha256: input.sha256 }
}

function decodeCommittedBase64(
  payload: Record<string, unknown>,
  prefix: 'source' | 'captionOverlay' | 'subject' | 'keyframe' | 'narration',
  mimeType:
    'video/mp4' | 'video/x-matroska' | 'image/png' | 'audio/wav' | 'audio/mpeg' | 'audio/mp3',
  minimumBytes: number,
  maximumBytes: number,
): Buffer {
  const mimeKey = `${prefix}MimeType`
  const lengthKey = `${prefix}ByteLength`
  const shaKey = `${prefix}Sha256`
  const bytesKey = `${prefix}BytesBase64`
  if (
    payload[mimeKey] !== mimeType || !Number.isSafeInteger(payload[lengthKey]) ||
    typeof payload[shaKey] !== 'string' || !SHA256.test(payload[shaKey]) ||
    typeof payload[bytesKey] !== 'string'
  ) throw validationFailure(`${prefix} content commitment is invalid.`)
  const bytes = Buffer.from(payload[bytesKey], 'base64')
  if (
    bytes.byteLength !== payload[lengthKey] || bytes.byteLength < minimumBytes || bytes.byteLength > maximumBytes ||
    bytes.toString('base64') !== payload[bytesKey] || createHash('sha256').update(bytes).digest('hex') !== payload[shaKey]
  ) throw validationFailure(`${prefix} bytes do not match their approved content commitment.`)
  return bytes
}

function decodeCommittedRecord(
  payload: Record<string, unknown>,
  prefix: 'source',
  mimeType: OfflineRemotionSingleSourceMimeType,
  minimumBytes: number,
  maximumBytes: number,
): Buffer {
  return decodeCommittedBase64(payload, prefix, mimeType, minimumBytes, maximumBytes)
}

function isSourceSequenceCompositionProfile(value: unknown): value is
  | 'approved_source_sequence_caption_final_v1'
  | 'approved_source_sequence_caption_track_final_v1' {
  return value === 'approved_source_sequence_caption_final_v1' ||
    value === 'approved_source_sequence_caption_track_final_v1'
}

export function isCaptionTrackCompositionProfile(value: unknown): value is
  | 'approved_source_caption_track_final_v1'
  | 'approved_source_sequence_caption_track_final_v1' {
  return value === 'approved_source_caption_track_final_v1' ||
    value === 'approved_source_sequence_caption_track_final_v1'
}

function isSourceSequencePlanningPayload(
  value: OfflineRemotionFinalCompositionPlanningPayload,
): value is
  | OfflineRemotionSourceSequenceFinalCompositionPlanningPayload
  | OfflineRemotionSourceSequenceCaptionTrackFinalCompositionPlanningPayload {
  return isSourceSequenceCompositionProfile(value.compositionProfileId)
}

function isCaptionTrackPlanningPayload(
  value: OfflineRemotionFinalCompositionPlanningPayload,
): value is
  | OfflineRemotionSingleSourceCaptionTrackFinalCompositionPlanningPayload
  | OfflineRemotionSourceSequenceCaptionTrackFinalCompositionPlanningPayload {
  return isCaptionTrackCompositionProfile(value.compositionProfileId)
}

function withoutVoiceTrackPlanning<T extends OfflineRemotionFinalCompositionPlanningPayload>(
  value: T,
): Omit<T, 'voiceTracks'> {
  const { voiceTracks, ...withoutVoiceTracks } = value
  void voiceTracks
  return withoutVoiceTracks
}

function captionOverlayCues(
  value: unknown,
  durationFrames: number,
): OfflineRemotionCaptionOverlayCuePlanningPayload[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 7) {
    throw validationFailure('Caption-track composition requires one to seven approved cues.')
  }
  const seen = new Set<string>()
  let previousEndFrame = 0
  return value.map((candidate, index) => {
    const cue = exactRecord(
      candidate,
      ['outputKey', 'startFrame', 'endFrameExclusive'],
      `caption overlay cue ${index + 1}`,
    )
    const outputKey = safeIdentity(cue.outputKey, 'caption overlay outputKey')
    const startFrame = integer(cue.startFrame, 0, durationFrames - 1, 'caption overlay startFrame')
    const endFrameExclusive = integer(
      cue.endFrameExclusive,
      1,
      durationFrames,
      'caption overlay endFrameExclusive',
    )
    if (
      seen.has(outputKey) || startFrame < previousEndFrame ||
      endFrameExclusive <= startFrame
    ) throw validationFailure('Caption overlay cues must be unique, ordered, and non-overlapping.')
    seen.add(outputKey)
    previousEndFrame = endFrameExclusive
    return { outputKey, startFrame, endFrameExclusive }
  })
}

function committedCaptionOverlay(
  input: { mimeType: 'image/png'; bytes: Buffer; sha256: string } | undefined,
): OfflineRemotionCommittedCaptionOverlay {
  if (!input) throw validationFailure('Final composition requires one approved caption overlay.')
  const overlay = committedBytes(input, 'image/png', 1024, 8 * 1024 * 1024, 'caption overlay')
  if (overlay.bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw validationFailure('Final composition caption overlay is not an approved PNG.')
  }
  return {
    outputKey: 'legacy-caption-overlay',
    mimeType: 'image/png',
    byteLength: overlay.bytes.byteLength,
    sha256: overlay.sha256,
    bytesBase64: overlay.bytes.toString('base64'),
  }
}

function committedCaptionOverlays(
  input: Array<{ outputKey: string; mimeType: 'image/png'; bytes: Buffer; sha256: string }> | undefined,
  cues: OfflineRemotionCaptionOverlayCuePlanningPayload[],
): OfflineRemotionCommittedCaptionOverlay[] {
  if (!input || input.length !== cues.length) {
    throw validationFailure('Caption-track bytes do not match the approved cue count.')
  }
  let totalBytes = 0
  const overlays = input.map((candidate, index) => {
    const cue = cues[index]!
    if (candidate.outputKey !== cue.outputKey) {
      throw validationFailure('Caption-track bytes diverge from the approved cue order.')
    }
    const overlay = committedBytes(candidate, 'image/png', 1024, 8 * 1024 * 1024, `caption overlay ${index + 1}`)
    if (overlay.bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw validationFailure('Caption-track overlay is not an approved PNG.')
    }
    totalBytes += overlay.bytes.byteLength
    return {
      outputKey: cue.outputKey,
      mimeType: 'image/png' as const,
      byteLength: overlay.bytes.byteLength,
      sha256: overlay.sha256,
      bytesBase64: overlay.bytes.toString('base64'),
    }
  })
  if (totalBytes > 8 * 1024 * 1024) {
    throw validationFailure('Caption-track overlays exceed the combined byte ceiling.')
  }
  return overlays
}

function committedVoiceTracks(
  input: Array<{
    sourceSequenceItemId: string
    outputKey: string
    mimeType: 'audio/wav'
    bytes: Buffer
    sha256: string
  }> | undefined,
  approved: OfflineRemotionVoiceTrackPlanningPayload[],
  fps: number,
): OfflineRemotionCommittedVoiceTrack[] {
  if (!input || input.length !== approved.length || approved.length < 1) {
    throw validationFailure('Voice-track bytes do not match the approved source-bound track count.')
  }
  let totalBytes = 0
  const tracks = input.map((candidate, index) => {
    const authority = approved[index]!
    if (
      candidate.sourceSequenceItemId !== authority.sourceSequenceItemId ||
      candidate.outputKey !== authority.outputKey
    ) throw validationFailure('Voice-track bytes diverge from approved identity or order.')
    const committed = committedBytes(
      candidate,
      'audio/wav',
      44,
      OFFLINE_REMOTION_MAXIMUM_COMBINED_VOICE_TRACK_BYTES,
      `voice track ${index + 1}`,
    )
    validatePcmVoiceTrack(committed.bytes, authority.durationFrames, fps)
    totalBytes += committed.bytes.byteLength
    return {
      sourceSequenceItemId: authority.sourceSequenceItemId,
      outputKey: authority.outputKey,
      durationFrames: authority.durationFrames,
      mimeType: 'audio/wav' as const,
      byteLength: committed.bytes.byteLength,
      sha256: committed.sha256,
      bytesBase64: committed.bytes.toString('base64'),
    }
  })
  if (totalBytes > OFFLINE_REMOTION_MAXIMUM_COMBINED_VOICE_TRACK_BYTES) {
    throw validationFailure('Voice tracks exceed the bounded combined byte ceiling.')
  }
  return tracks
}

function voiceTrackPlanningFromCommitments(
  value: unknown,
): OfflineRemotionVoiceTrackPlanningPayload[] {
  if (!Array.isArray(value)) {
    throw validationFailure('Voice-track commitments must be an ordered array.')
  }
  return value.map((candidate, index) => {
    const track = record(candidate, `voice-track commitment ${index + 1}`)
    return {
      sourceSequenceItemId: String(track.sourceSequenceItemId ?? ''),
      outputKey: String(track.outputKey ?? ''),
      durationFrames: Number(track.durationFrames),
    }
  })
}

function decodeVoiceTrackRecords(
  value: unknown,
  approved: OfflineRemotionVoiceTrackPlanningPayload[],
  fps: number,
): OfflineRemotionCommittedVoiceTrack[] {
  if (!Array.isArray(value) || value.length !== approved.length || approved.length < 1) {
    throw validationFailure('Voice-track commitments do not match the approved track count.')
  }
  let totalBytes = 0
  const tracks = value.map((candidate, index) => {
    const track = exactRecord(
      candidate,
      [
        'sourceSequenceItemId', 'outputKey', 'durationFrames',
        'mimeType', 'byteLength', 'sha256', 'bytesBase64',
      ],
      `voice-track commitment ${index + 1}`,
    )
    const authority = approved[index]!
    if (
      track.sourceSequenceItemId !== authority.sourceSequenceItemId ||
      track.outputKey !== authority.outputKey ||
      track.durationFrames !== authority.durationFrames ||
      track.mimeType !== 'audio/wav' ||
      !Number.isSafeInteger(track.byteLength) ||
      typeof track.sha256 !== 'string' || !SHA256.test(track.sha256) ||
      typeof track.bytesBase64 !== 'string'
    ) throw validationFailure('Voice-track commitment identity or content metadata is invalid.')
    const bytes = Buffer.from(track.bytesBase64, 'base64')
    if (
      bytes.byteLength !== track.byteLength || bytes.byteLength < 44 ||
      bytes.byteLength > OFFLINE_REMOTION_MAXIMUM_COMBINED_VOICE_TRACK_BYTES ||
      bytes.toString('base64') !== track.bytesBase64 ||
      createHash('sha256').update(bytes).digest('hex') !== track.sha256
    ) throw validationFailure('Voice-track bytes do not match their approved content commitment.')
    validatePcmVoiceTrack(bytes, authority.durationFrames, fps)
    totalBytes += bytes.byteLength
    return {
      sourceSequenceItemId: authority.sourceSequenceItemId,
      outputKey: authority.outputKey,
      durationFrames: authority.durationFrames,
      mimeType: 'audio/wav' as const,
      byteLength: bytes.byteLength,
      sha256: String(track.sha256),
      bytesBase64: bytes.toString('base64'),
    }
  })
  if (totalBytes > OFFLINE_REMOTION_MAXIMUM_COMBINED_VOICE_TRACK_BYTES) {
    throw validationFailure('Voice-track commitments exceed the bounded combined byte ceiling.')
  }
  return tracks
}

function validatePcmVoiceTrack(bytes: Buffer, durationFrames: number, fps: number): void {
  if (
    bytes.byteLength < 44 || bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) throw validationFailure('Approved voice track is not a RIFF/WAVE artifact.')
  const formatOffset = bytes.indexOf(Buffer.from('fmt '))
  const dataOffset = bytes.indexOf(Buffer.from('data'))
  if (
    formatOffset < 12 || dataOffset <= formatOffset || formatOffset + 24 > bytes.byteLength ||
    dataOffset + 8 > bytes.byteLength || bytes.readUInt16LE(formatOffset + 8) !== 1
  ) throw validationFailure('Approved voice track is not linear PCM WAV.')
  const channels = bytes.readUInt16LE(formatOffset + 10)
  const sampleRate = bytes.readUInt32LE(formatOffset + 12)
  const blockAlign = bytes.readUInt16LE(formatOffset + 20)
  const bitsPerSample = bytes.readUInt16LE(formatOffset + 22)
  const dataByteLength = bytes.byteLength - (dataOffset + 8)
  const expectedSampleFrames = durationFrames * (48_000 / fps)
  const actualSampleFrames = dataByteLength / blockAlign
  if (
    channels !== 2 || sampleRate !== 48_000 || bitsPerSample !== 16 || blockAlign !== 4 ||
    dataByteLength <= 0 || dataByteLength % blockAlign !== 0 ||
    !Number.isInteger(expectedSampleFrames) || Math.abs(actualSampleFrames - expectedSampleFrames) > 2
  ) throw validationFailure('Approved voice track does not match the fixed 48 kHz stereo frame duration.')
}

function decodeCaptionOverlayRecords(
  value: unknown,
  cues: OfflineRemotionCaptionOverlayCuePlanningPayload[],
): OfflineRemotionCommittedCaptionOverlay[] {
  if (!Array.isArray(value) || value.length !== cues.length) {
    throw validationFailure('Caption-track commitments do not match the approved cue count.')
  }
  let totalBytes = 0
  const overlays = value.map((candidate, index) => {
    const recordValue = exactRecord(
      candidate,
      ['outputKey', 'mimeType', 'byteLength', 'sha256', 'bytesBase64'],
      `caption overlay commitment ${index + 1}`,
    )
    const cue = cues[index]!
    if (recordValue.outputKey !== cue.outputKey) {
      throw validationFailure('Caption-track commitment order diverged from the approved cues.')
    }
    const normalized = {
      captionOverlayMimeType: recordValue.mimeType,
      captionOverlayByteLength: recordValue.byteLength,
      captionOverlaySha256: recordValue.sha256,
      captionOverlayBytesBase64: recordValue.bytesBase64,
    }
    const bytes = decodeCommittedBase64(
      normalized,
      'captionOverlay',
      'image/png',
      1024,
      8 * 1024 * 1024,
    )
    if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw validationFailure('Caption-track commitment has an invalid PNG signature.')
    }
    totalBytes += bytes.byteLength
    return {
      outputKey: cue.outputKey,
      mimeType: 'image/png' as const,
      byteLength: bytes.byteLength,
      sha256: String(recordValue.sha256),
      bytesBase64: bytes.toString('base64'),
    }
  })
  if (totalBytes > 8 * 1024 * 1024) {
    throw validationFailure('Caption-track commitments exceed the combined byte ceiling.')
  }
  return overlays
}

function legacyCaptionCommitment(
  payload: Record<string, unknown>,
  label: string,
): {
  captionOverlayMimeType: 'image/png'
  captionOverlayByteLength: number
  captionOverlaySha256: string
  captionOverlayBytesBase64: string
} {
  const overlay = decodeCommittedBase64(
    payload,
    'captionOverlay',
    'image/png',
    1024,
    8 * 1024 * 1024,
  )
  if (overlay.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw validationFailure(`${label} caption overlay has an invalid PNG signature.`)
  }
  return {
    captionOverlayMimeType: 'image/png',
    captionOverlayByteLength: overlay.byteLength,
    captionOverlaySha256: String(payload.captionOverlaySha256),
    captionOverlayBytesBase64: overlay.toString('base64'),
  }
}

function voiceTrackPlanningPayloads(
  value: unknown,
  expected: Array<{ sourceSequenceItemId?: string; durationFrames: number }>,
): OfflineRemotionVoiceTrackPlanningPayload[] {
  if (!Array.isArray(value) || value.length !== expected.length || value.length < 1 || value.length > 8) {
    throw validationFailure('Approved voice tracks must match the exact source count.')
  }
  const outputKeys = new Set<string>()
  const sourceIds = new Set<string>()
  return value.map((candidate, index) => {
    const track = exactRecord(
      candidate,
      ['sourceSequenceItemId', 'outputKey', 'durationFrames'],
      `approved voice track ${index + 1}`,
    )
    const sourceSequenceItemId = safeIdentity(
      track.sourceSequenceItemId,
      'voice track sourceSequenceItemId',
    )
    const outputKey = safeIdentity(track.outputKey, 'voice track outputKey')
    const durationFrames = integer(
      track.durationFrames,
      1,
      CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
      'voice track durationFrames',
    )
    const expectedTrack = expected[index]!
    if (
      outputKeys.has(outputKey) || sourceIds.has(sourceSequenceItemId) ||
      (expectedTrack.sourceSequenceItemId !== undefined &&
        sourceSequenceItemId !== expectedTrack.sourceSequenceItemId) ||
      durationFrames !== expectedTrack.durationFrames
    ) throw validationFailure('Approved voice-track identity, order, or duration is invalid.')
    outputKeys.add(outputKey)
    sourceIds.add(sourceSequenceItemId)
    return { sourceSequenceItemId, outputKey, durationFrames }
  })
}

function sourceSequenceSegments(value: unknown, durationFrames: number): OfflineRemotionSourceSequenceSegmentPlanningPayload[] {
  if (
    !Array.isArray(value) || value.length < 2 ||
    value.length > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS
  ) {
    throw validationFailure('Source-sequence final composition requires two to eight ordered source segments.')
  }
  const seen = new Set<string>()
  let expectedTimelineStart = 0
  const segments = value.map((candidate, index) => {
    const segment = exactRecord(candidate, [
      'sourceSequenceItemId', 'sourceStartFrame', 'sourceEndFrameExclusive',
      'timelineStartFrame', 'timelineEndFrameExclusive',
    ], `source segment ${index + 1}`)
    const sourceSequenceItemId = safeIdentity(segment.sourceSequenceItemId, 'sourceSequenceItemId')
    const sourceStartFrame = integer(segment.sourceStartFrame, 0, 100_000_000, 'sourceStartFrame')
    const sourceEndFrameExclusive = integer(segment.sourceEndFrameExclusive, 1, 100_000_001, 'sourceEndFrameExclusive')
    const timelineStartFrame = integer(
      segment.timelineStartFrame,
      0,
      CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES - 1,
      'timelineStartFrame',
    )
    const timelineEndFrameExclusive = integer(
      segment.timelineEndFrameExclusive,
      1,
      CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
      'timelineEndFrameExclusive',
    )
    const sourceDurationFrames = sourceEndFrameExclusive - sourceStartFrame
    const timelineDurationFrames = timelineEndFrameExclusive - timelineStartFrame
    if (
      seen.has(sourceSequenceItemId) || timelineStartFrame !== expectedTimelineStart ||
      sourceEndFrameExclusive <= sourceStartFrame || timelineEndFrameExclusive <= timelineStartFrame ||
      sourceDurationFrames !== timelineDurationFrames ||
      timelineDurationFrames > CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES
    ) throw validationFailure('Source-sequence segments must be unique, contiguous, and frame-duration preserving.')
    seen.add(sourceSequenceItemId)
    expectedTimelineStart = timelineEndFrameExclusive
    return {
      sourceSequenceItemId, sourceStartFrame, sourceEndFrameExclusive,
      timelineStartFrame, timelineEndFrameExclusive,
    }
  })
  if (expectedTimelineStart !== durationFrames) {
    throw validationFailure('Source-sequence segments must cover the exact approved final duration.')
  }
  return segments
}

function approvedHardCutTransitions(
  value: unknown,
  sourceSegments: OfflineRemotionSourceSequenceSegmentPlanningPayload[],
): OfflineRemotionHardCutTransitionPlanningPayload[] {
  if (!Array.isArray(value) || value.length !== sourceSegments.length - 1) {
    throw validationFailure('Source-sequence composition requires one approved hard cut per source boundary.')
  }
  const timingIds = new Set<string>()
  const refinedIds = new Set<string>()
  return value.map((candidate, index) => {
    const transition = exactRecord(candidate, [
      'transitionTimingItemId', 'refinedTransitionTimingItemId',
      'fromSegmentId', 'toSegmentId',
      'fromSourceSequenceItemId', 'toSourceSequenceItemId', 'boundaryFrame',
    ], `hard-cut transition ${index + 1}`)
    const fromSource = sourceSegments[index]!
    const toSource = sourceSegments[index + 1]!
    const transitionTimingItemId = safeIdentity(
      transition.transitionTimingItemId,
      'transitionTimingItemId',
    )
    const refinedTransitionTimingItemId = safeIdentity(
      transition.refinedTransitionTimingItemId,
      'refinedTransitionTimingItemId',
    )
    const normalized = {
      transitionTimingItemId,
      refinedTransitionTimingItemId,
      fromSegmentId: safeIdentity(transition.fromSegmentId, 'fromSegmentId'),
      toSegmentId: safeIdentity(transition.toSegmentId, 'toSegmentId'),
      fromSourceSequenceItemId: safeIdentity(
        transition.fromSourceSequenceItemId,
        'fromSourceSequenceItemId',
      ),
      toSourceSequenceItemId: safeIdentity(
        transition.toSourceSequenceItemId,
        'toSourceSequenceItemId',
      ),
      boundaryFrame: integer(
        transition.boundaryFrame,
        1,
        CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES - 1,
        'boundaryFrame',
      ),
    }
    if (
      timingIds.has(transitionTimingItemId) || refinedIds.has(refinedTransitionTimingItemId) ||
      normalized.fromSourceSequenceItemId !== fromSource.sourceSequenceItemId ||
      normalized.toSourceSequenceItemId !== toSource.sourceSequenceItemId ||
      normalized.boundaryFrame !== fromSource.timelineEndFrameExclusive ||
      normalized.boundaryFrame !== toSource.timelineStartFrame
    ) {
      throw validationFailure('Approved hard cuts must uniquely match the exact ordered source boundary.')
    }
    timingIds.add(transitionTimingItemId)
    refinedIds.add(refinedTransitionTimingItemId)
    return normalized
  })
}

function safeIdentity(value: unknown, label: string): string {
  if (
    typeof value !== 'string' || value.length < 1 || value.length > 160 ||
    value !== value.trim() || value.includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  ) throw validationFailure(`${label} is invalid.`)
  return value
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw validationFailure(`${label} must be an object.`)
  return value as Record<string, unknown>
}
function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  const valueRecord = record(value, label)
  if (Object.keys(valueRecord).sort().join('|') !== [...keys].sort().join('|')) {
    throw validationFailure(`${label} contains unsupported fields.`)
  }
  return valueRecord
}
function integer(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max) {
    throw validationFailure(`${label} is outside its approved bounds.`)
  }
  return Number(value)
}
function oneOf<T extends string | number>(value: unknown, choices: readonly T[], label: string): T {
  if (!choices.includes(value as T)) throw validationFailure(`${label} is unsupported.`)
  return value as T
}
function color(value: unknown, label: string): string {
  if (typeof value !== 'string' || !COLORS.test(value.toUpperCase())) throw validationFailure(`${label} is invalid.`)
  return value.toUpperCase()
}
function safeText(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > max || value !== value.trim() || !SAFE_TEXT.test(value)) {
    throw validationFailure(`${label} is unsafe or outside bounds.`)
  }
  return value
}
function stableId(value: unknown, label: string): string {
  if (
    typeof value !== 'string' || value.length < 1 || value.length > 200 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) || value.includes('..')
  ) throw validationFailure(`${label} is invalid.`)
  return value
}

function scenesEnd(scenes: readonly unknown[], index: number): number {
  const scene = record(scenes[index], 'Motion Studio animatic scene')
  return integer(scene.endFrame, 1, 900, 'endFrame')
}

function assertAudioSignature(
  bytes: Buffer,
  mimeType: 'audio/wav' | 'audio/mpeg' | 'audio/mp3',
): void {
  if (mimeType === 'audio/wav') {
    if (
      bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
      bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
    ) throw validationFailure('Narration bytes are not an approved WAV stream.')
    return
  }
  const id3 = bytes.subarray(0, 3).toString('ascii') === 'ID3'
  const sync = bytes.byteLength >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0
  if (!id3 && !sync) throw validationFailure('Narration bytes are not an approved MPEG audio stream.')
}
function validationFailure(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
