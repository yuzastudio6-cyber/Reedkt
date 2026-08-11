import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { once } from 'node:events'
import { constants, createReadStream } from 'node:fs'
import { createServer } from 'node:http'
import { open, readFile, rename, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'

import { renderMedia, renderStill, selectComposition } from '@remotion/renderer'

const require = createRequire(import.meta.url)
const { RenderInternals } = require('@remotion/renderer')
const remotionVersion = require('remotion/package.json').version
const rendererVersion = require('@remotion/renderer/package.json').version
const PROTOCOL = 'offline-remotion-render-execution-v1'
const STREAMING_PROTOCOL = 'offline-remotion-render-stream-execution-v2'
const STREAMING_CONTAINER_PROTOCOL = 'offline-remotion-render-stream-execution-container-v2'
const STREAMING_INPUT_MODE = 'server_injected_private_stream_v1'
const LONG_FORM_MERGE_STREAMING_PROTOCOL = 'offline-remotion-long-form-merge-stream-execution-v1'
const LONG_FORM_MERGE_STREAMING_CONTAINER_PROTOCOL = 'offline-remotion-long-form-merge-stream-execution-container-v1'
const LONG_FORM_MERGE_COMPOSITION_PROFILE = 'approved_4k_composition_chunk_merge_final_v1'
const LONG_FORM_CAPACITY_PROFILE = 'canonical_private_4k_chunk_merge_1920_frames_v1'
const SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE =
  'canonical_private_4k_source_slice_chunk_merge_3840_frames_v2'
const DELIVERY_H264_CHUNK_STREAMING_PROTOCOL =
  'offline-remotion-delivery-h264-chunk-stream-execution-v1'
const DELIVERY_H264_CHUNK_STREAMING_CONTAINER_PROTOCOL =
  'offline-remotion-delivery-h264-chunk-stream-execution-container-v1'
const DELIVERY_H264_CHUNK_RECIPE =
  'approved_long_form_delivery_h264_video_chunk_v1'
const DELIVERY_H264_CHUNK_COMPOSITION_PROFILE =
  'approved_long_form_delivery_h264_video_chunk_v1'
const PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE =
  'canonical_professional_4k_object_chunk_graph_6h_v1'
const OPERATION = 'tool.remotion.render_approved_composition.v1'
const MAXIMUM_REQUEST_BYTES = 48 * 1024 * 1024
const MAXIMUM_OUTPUT_BYTES = 16 * 1024 * 1024
const MAXIMUM_STREAMING_MANIFEST_BYTES = 256 * 1024
const MAXIMUM_DELIVERY_H264_CHUNK_MANIFEST_BYTES = 64 * 1024
const MAXIMUM_STREAMING_SOURCE_BYTES = 192 * 1024 * 1024
const MAXIMUM_STREAMING_COMBINED_SOURCE_BYTES = 192 * 1024 * 1024
const MAXIMUM_STREAMING_CAPTION_BYTES = 8 * 1024 * 1024
const MAXIMUM_STREAMING_LIVING_FRAME_OVERLAY_BYTES = 32 * 1024 * 1024
const MAXIMUM_STREAMING_COMBINED_LIVING_FRAME_OVERLAY_BYTES = 128 * 1024 * 1024
const MAXIMUM_STREAMING_CONTROLLED_VISUAL_OVERLAY_BYTES = 2 * 1024 * 1024
const MAXIMUM_STREAMING_COMBINED_CONTROLLED_VISUAL_OVERLAY_BYTES =
  8 * 1024 * 1024
const MAXIMUM_STREAMING_SUPPLEMENTAL_AUDIO_BYTES = 16 * 1024 * 1024
const MAXIMUM_STREAMING_COMBINED_SUPPLEMENTAL_AUDIO_BYTES = 64 * 1024 * 1024
const MAXIMUM_STREAMING_COMBINED_INPUT_BYTES = 464 * 1024 * 1024
const MAXIMUM_STREAMING_OUTPUT_BYTES = 256 * 1024 * 1024
const MAXIMUM_DELIVERY_H264_CHUNK_SOURCE_BYTES = 512 * 1024 * 1024
const MAXIMUM_DELIVERY_H264_CHUNK_OUTPUT_BYTES = 3 * 1024 * 1024 * 1024
const MAXIMUM_LONG_FORM_CHUNK_BYTES = 256 * 1024 * 1024
const MAXIMUM_LONG_FORM_COMBINED_CHUNK_BYTES = 640 * 1024 * 1024
const MAXIMUM_COMBINED_VOICE_TRACK_BYTES = 2 * 1024 * 1024
const MAXIMUM_STREAMING_COMBINED_VOICE_TRACK_BYTES = 64 * 1024 * 1024
const MAXIMUM_PCM_WAVE_HEADER_BYTES = 64 * 1024
const MINIMUM_COMPOSITION_FRAMES = 24
const MAXIMUM_SOURCE_SEGMENT_FRAMES = 240
const MAXIMUM_SOURCE_SEQUENCE_FRAMES = 480
const MAXIMUM_SOURCE_SEQUENCE_ITEMS = 8
const MINIMUM_LONG_FORM_FRAMES = MAXIMUM_SOURCE_SEQUENCE_FRAMES + 1
const MAXIMUM_LONG_FORM_FRAMES = MAXIMUM_SOURCE_SEGMENT_FRAMES * MAXIMUM_SOURCE_SEQUENCE_ITEMS
const MAXIMUM_SOURCE_SLICE_LONG_FORM_CHUNKS = 16
const MAXIMUM_SOURCE_SLICE_LONG_FORM_FRAMES =
  MAXIMUM_SOURCE_SEGMENT_FRAMES * MAXIMUM_SOURCE_SLICE_LONG_FORM_CHUNKS
const SINGLE_STREAMING_CAPTION_OUTPUT_KEY = 'approved-full-frame-caption-overlay'
const FORBIDDEN_TEXT = /(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|[A-Za-z]:[\\/]|(?:^|\s)\/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:\/|\b)|\$\(|`|&&|\|\||#!)/i
const PRIVATE_REVIEW_FRAMES = ['360x640', '640x360', '480x480', '480x600']
const FOUR_K_MASTER_FRAMES = [
  '3840x2160',
  '2160x3840',
  '2160x2160',
  '2160x2700',
  '2880x2160',
]
const DELIVERY_MASTER_AUTHORITY_KEYS = [
  'renderPurpose',
  'deliveryProfileId',
  'estimateCostBasisProfileId',
  'sourceQualityPolicy',
  'usesApprovedEditReservation',
  'requiresSeparateExportEstimate',
  'allowsAdditionalExportCharge',
]
const FIXED_BT709_X264_VUI_PARAMETERS =
  'colorprim=bt709:transfer=bt709:colormatrix=bt709:fullrange=off'
const execFileAsync = promisify(execFile)

function executionFailureDiagnostic(error, stage) {
  const message = error instanceof Error ? error.message : 'unknown execution failure'
  const family = /(?:out of memory|enomem|heap|allocation failed)/i.test(message)
    ? 'memory_pressure'
    : /(?:timed out|timeout|delayrender)/i.test(message)
      ? 'render_timeout'
      : /(?:decode|demux|codec|ffmpeg|video|audio|media)/i.test(message)
        ? 'media_decode_or_encode'
        : /(?:browser|chromium|chrome|page|puppeteer)/i.test(message)
          ? 'browser_runtime'
          : /(?:frame|render)/i.test(message)
            ? 'frame_render'
            : /(?:manifest|request|commitment|identity|authority|unsupported|invalid)/i
                .test(message)
              ? 'request_or_authority_validation'
              : 'unclassified'
  return {
    diagnosticStage: stage,
    diagnosticFamily: family,
    diagnosticMessageSha256: sha256(message),
  }
}

const canonical = (value) => JSON.stringify(value, Object.keys(value).sort())
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

function exactObject(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  const actual = Object.keys(value).sort().join('|')
  const expected = [...keys].sort().join('|')
  if (actual !== expected) throw new Error(`${label} contains unsupported fields`)
  return value
}

function brollPreviewLayer(value) {
  const layer = exactObject(value, [
    'displayTreatment', 'position', 'crop', 'xPercent', 'yPercent',
    'widthPercent', 'heightPercent', 'scale', 'opacity', 'layerOrder',
  ], 'B-roll preview layer')
  const fixed = {
    full_frame_takeover: [0, 0, 100, 100, 1, 10],
    full_frame_cutaway: [0, 0, 100, 100, 1, 10],
    inset: [60, 8, 34, 34, 1, 10],
    picture_in_picture: [65, 6, 30, 30, 1, 10],
    split_screen: [50, 0, 50, 100, 1, 10],
    partial_overlay: [55, 45, 40, 45, 1, 10],
    background_layer: [0, 0, 100, 100, 0.45, 0],
  }
  const expected = fixed[layer.displayTreatment]
  if (
    !expected || layer.position !== 'absolute' || layer.crop !== 'contain' ||
    layer.xPercent !== expected[0] || layer.yPercent !== expected[1] ||
    layer.widthPercent !== expected[2] || layer.heightPercent !== expected[3] ||
    layer.scale !== 1 || layer.opacity !== expected[4] ||
    layer.layerOrder !== expected[5]
  ) throw new Error('B-roll preview layer geometry is unsupported')
  return {
    displayTreatment: layer.displayTreatment,
    position: 'absolute', crop: 'contain',
    xPercent: expected[0], yPercent: expected[1],
    widthPercent: expected[2], heightPercent: expected[3],
    scale: 1, opacity: expected[4], layerOrder: expected[5],
  }
}

function safeText(value, maximum, label) {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum || value !== value.trim()) {
    throw new Error(`${label} is invalid`)
  }
  if ([...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || FORBIDDEN_TEXT.test(value)) {
    throw new Error(`${label} is unsafe`)
  }
  return value
}

function oneOf(value, choices, label) {
  if (!choices.includes(value)) throw new Error(`${label} is unsupported`)
  return value
}

function enforceFixedBt709H264Vui({ type, args }) {
  if (!['pre-stitcher', 'stitcher'].includes(type) || !Array.isArray(args)) {
    throw new Error('Remotion FFmpeg override input is invalid')
  }
  const encoderIndex = args.findIndex((argument, index) =>
    argument === '-c:v' && args[index + 1] === 'libx264')
  if (encoderIndex === -1) return args
  if (
    args.includes('-x264-params') || args.length < 2 ||
    typeof args[args.length - 1] !== 'string' || args[args.length - 1].startsWith('-')
  ) throw new Error('Remotion H.264 encoder arguments are outside the fixed color policy')
  return [
    ...args.slice(0, -1),
    '-x264-params', FIXED_BT709_X264_VUI_PARAMETERS,
    args[args.length - 1],
  ]
}

function integer(value, minimum, maximum, label) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`${label} is outside bounds`)
  return value
}

function safeIdentity(value, label) {
  if (
    typeof value !== 'string' || value.length < 1 || value.length > 160 ||
    value !== value.trim() || value.includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  ) throw new Error(`${label} is invalid`)
  return value
}

function validateDeliveryMasterAuthority(payload, dimensions, provided) {
  if (!provided) {
    if (!PRIVATE_REVIEW_FRAMES.includes(dimensions)) {
      throw new Error('a 4K final frame requires exact delivery-master authority')
    }
    return
  }
  if (
    !FOUR_K_MASTER_FRAMES.includes(dimensions) ||
    payload.renderPurpose !== 'private_4k_delivery_master_v1' ||
    payload.deliveryProfileId !== 'uhd_2160' ||
    payload.estimateCostBasisProfileId !== 'uhd_2160' ||
    payload.sourceQualityPolicy !== 'immutable_source_master_no_proxy_v1' ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw new Error('4K delivery-master authority is incomplete or inconsistent')
}

function validateSourceSegments(value, durationFrames) {
  if (!Array.isArray(value) || value.length < 2 || value.length > MAXIMUM_SOURCE_SEQUENCE_ITEMS) {
    throw new Error('source sequence requires two to eight segments')
  }
  const seen = new Set()
  let expectedTimelineStart = 0
  const segments = value.map((candidate, index) => {
    const segment = exactObject(candidate, [
      'sourceSequenceItemId', 'sourceStartFrame', 'sourceEndFrameExclusive',
      'timelineStartFrame', 'timelineEndFrameExclusive',
    ], `source segment ${index + 1}`)
    const sourceSequenceItemId = safeIdentity(segment.sourceSequenceItemId, 'sourceSequenceItemId')
    const sourceStartFrame = integer(segment.sourceStartFrame, 0, 100_000_000, 'sourceStartFrame')
    const sourceEndFrameExclusive = integer(segment.sourceEndFrameExclusive, 1, 100_000_001, 'sourceEndFrameExclusive')
    const timelineStartFrame = integer(
      segment.timelineStartFrame,
      0,
      MAXIMUM_SOURCE_SEQUENCE_FRAMES - 1,
      'timelineStartFrame',
    )
    const timelineEndFrameExclusive = integer(
      segment.timelineEndFrameExclusive,
      1,
      MAXIMUM_SOURCE_SEQUENCE_FRAMES,
      'timelineEndFrameExclusive',
    )
    const sourceDurationFrames = sourceEndFrameExclusive - sourceStartFrame
    const timelineDurationFrames = timelineEndFrameExclusive - timelineStartFrame
    if (
      seen.has(sourceSequenceItemId) || timelineStartFrame !== expectedTimelineStart ||
      sourceEndFrameExclusive <= sourceStartFrame || timelineEndFrameExclusive <= timelineStartFrame ||
      sourceDurationFrames !== timelineDurationFrames ||
      timelineDurationFrames > MAXIMUM_SOURCE_SEGMENT_FRAMES
    ) throw new Error('source segments must be unique, contiguous, and duration preserving')
    seen.add(sourceSequenceItemId)
    expectedTimelineStart = timelineEndFrameExclusive
    return {
      sourceSequenceItemId, sourceStartFrame, sourceEndFrameExclusive,
      timelineStartFrame, timelineEndFrameExclusive,
    }
  })
  if (expectedTimelineStart !== durationFrames) throw new Error('source sequence does not cover approved duration')
  return segments
}

function validateApprovedHardCuts(value, sourceSegments) {
  if (!Array.isArray(value) || value.length !== sourceSegments.length - 1) {
    throw new Error('source sequence requires one approved hard cut per source boundary')
  }
  const timingIds = new Set()
  const refinedIds = new Set()
  return value.map((candidate, index) => {
    const transition = exactObject(candidate, [
      'transitionTimingItemId', 'refinedTransitionTimingItemId',
      'fromSegmentId', 'toSegmentId',
      'fromSourceSequenceItemId', 'toSourceSequenceItemId', 'boundaryFrame',
    ], `hard-cut transition ${index + 1}`)
    const fromSource = sourceSegments[index]
    const toSource = sourceSegments[index + 1]
    const normalized = {
      transitionTimingItemId: safeIdentity(
        transition.transitionTimingItemId,
        'transitionTimingItemId',
      ),
      refinedTransitionTimingItemId: safeIdentity(
        transition.refinedTransitionTimingItemId,
        'refinedTransitionTimingItemId',
      ),
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
        MAXIMUM_SOURCE_SEQUENCE_FRAMES - 1,
        'boundaryFrame',
      ),
    }
    if (
      timingIds.has(normalized.transitionTimingItemId) ||
      refinedIds.has(normalized.refinedTransitionTimingItemId) ||
      normalized.fromSourceSequenceItemId !== fromSource.sourceSequenceItemId ||
      normalized.toSourceSequenceItemId !== toSource.sourceSequenceItemId ||
      normalized.boundaryFrame !== fromSource.timelineEndFrameExclusive ||
      normalized.boundaryFrame !== toSource.timelineStartFrame
    ) throw new Error('approved hard cuts must uniquely match the exact ordered source boundary')
    timingIds.add(normalized.transitionTimingItemId)
    refinedIds.add(normalized.refinedTransitionTimingItemId)
    return normalized
  })
}

function validateApprovedBoundedSourceTransitions(value, sourceSegments, fps) {
  if (!Array.isArray(value) || value.length !== sourceSegments.length - 1) {
    throw new Error('source sequence requires one approved bounded transition per source boundary')
  }
  const timingIds = new Set()
  const refinedIds = new Set()
  let previousEndFrameExclusive = 0
  const transitions = value.map((candidate, index) => {
    const transition = exactObject(candidate, [
      'transitionTimingItemId', 'refinedTransitionTimingItemId',
      'fromSegmentId', 'toSegmentId',
      'fromSourceSequenceItemId', 'toSourceSequenceItemId', 'boundaryFrame',
      'transitionType', 'startFrame', 'endFrameExclusive', 'durationFrames',
      'visualCurve', 'audioPolicy',
    ], `bounded source transition ${index + 1}`)
    const fromSource = sourceSegments[index]
    const toSource = sourceSegments[index + 1]
    const normalized = {
      transitionTimingItemId: safeIdentity(
        transition.transitionTimingItemId,
        'transitionTimingItemId',
      ),
      refinedTransitionTimingItemId: safeIdentity(
        transition.refinedTransitionTimingItemId,
        'refinedTransitionTimingItemId',
      ),
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
        MAXIMUM_SOURCE_SEQUENCE_FRAMES - 1,
        'boundaryFrame',
      ),
      transitionType: oneOf(
        transition.transitionType,
        ['hard_cut', 'smooth_panel_dip'],
        'transitionType',
      ),
      startFrame: integer(
        transition.startFrame,
        0,
        MAXIMUM_SOURCE_SEQUENCE_FRAMES - 1,
        'transition startFrame',
      ),
      endFrameExclusive: integer(
        transition.endFrameExclusive,
        0,
        MAXIMUM_SOURCE_SEQUENCE_FRAMES,
        'transition endFrameExclusive',
      ),
      durationFrames: integer(
        transition.durationFrames,
        0,
        MAXIMUM_SOURCE_SEQUENCE_FRAMES,
        'transition durationFrames',
      ),
      visualCurve: oneOf(
        transition.visualCurve,
        ['none', 'linear_dip_to_panel'],
        'transition visualCurve',
      ),
      audioPolicy: oneOf(
        transition.audioPolicy,
        ['hard_cut_at_boundary'],
        'transition audioPolicy',
      ),
    }
    const panelDurationFrames = Math.round(fps * 0.4)
    const panelStartFrame =
      normalized.boundaryFrame - Math.floor(panelDurationFrames / 2)
    const hardCutValid =
      normalized.transitionType === 'hard_cut' &&
      normalized.startFrame === normalized.boundaryFrame &&
      normalized.endFrameExclusive === normalized.boundaryFrame &&
      normalized.durationFrames === 0 &&
      normalized.visualCurve === 'none'
    const panelDipValid =
      normalized.transitionType === 'smooth_panel_dip' &&
      normalized.startFrame === panelStartFrame &&
      normalized.endFrameExclusive === panelStartFrame + panelDurationFrames &&
      normalized.durationFrames === panelDurationFrames &&
      normalized.visualCurve === 'linear_dip_to_panel' &&
      normalized.startFrame >= fromSource.timelineStartFrame &&
      normalized.endFrameExclusive <= toSource.timelineEndFrameExclusive
    if (
      timingIds.has(normalized.transitionTimingItemId) ||
      refinedIds.has(normalized.refinedTransitionTimingItemId) ||
      normalized.fromSourceSequenceItemId !== fromSource.sourceSequenceItemId ||
      normalized.toSourceSequenceItemId !== toSource.sourceSequenceItemId ||
      normalized.boundaryFrame !== fromSource.timelineEndFrameExclusive ||
      normalized.boundaryFrame !== toSource.timelineStartFrame ||
      (!hardCutValid && !panelDipValid) ||
      normalized.startFrame < previousEndFrameExclusive
    ) throw new Error(
      'approved bounded transitions must uniquely match non-overlapping exact source boundaries',
    )
    timingIds.add(normalized.transitionTimingItemId)
    refinedIds.add(normalized.refinedTransitionTimingItemId)
    previousEndFrameExclusive = normalized.endFrameExclusive
    return normalized
  })
  if (!transitions.some((transition) =>
    transition.transitionType === 'smooth_panel_dip')) {
    throw new Error('bounded source-transition authority requires at least one approved panel dip')
  }
  return transitions
}

function isSourceSequenceProfile(value) {
  return value === 'approved_source_sequence_caption_final_v1' ||
    value === 'approved_source_sequence_caption_track_final_v1'
}

function isCaptionTrackProfile(value) {
  return value === 'approved_source_caption_track_final_v1' ||
    value === 'approved_source_sequence_caption_track_final_v1'
}

function validateCaptionOverlayCues(value, durationFrames) {
  if (!Array.isArray(value) || value.length > 7) {
    throw new Error('caption track supports zero to seven cues')
  }
  const seen = new Set()
  let previousEndFrame = 0
  return value.map((candidate, index) => {
    const cue = exactObject(
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
    if (seen.has(outputKey) || startFrame < previousEndFrame || endFrameExclusive <= startFrame) {
      throw new Error('caption overlay cues must be unique, ordered, and non-overlapping')
    }
    seen.add(outputKey)
    previousEndFrame = endFrameExclusive
    return { outputKey, startFrame, endFrameExclusive }
  })
}

function validateCaptionOverlayCommitments(value, cues) {
  if (!Array.isArray(value) || value.length !== cues.length) {
    throw new Error('caption overlay commitments do not match approved cues')
  }
  let totalBytes = 0
  const overlays = value.map((candidate, index) => {
    const overlay = exactObject(
      candidate,
      ['outputKey', 'mimeType', 'byteLength', 'sha256', 'bytesBase64'],
      `caption overlay commitment ${index + 1}`,
    )
    if (overlay.outputKey !== cues[index].outputKey) {
      throw new Error('caption overlay commitment order diverges from approved cues')
    }
    const normalized = {
      captionOverlayMimeType: overlay.mimeType,
      captionOverlayByteLength: overlay.byteLength,
      captionOverlaySha256: overlay.sha256,
      captionOverlayBytesBase64: overlay.bytesBase64,
    }
    const bytes = committedBase64(normalized, 'captionOverlay', 'image/png', 1024, 8 * 1024 * 1024)
    if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw new Error('caption overlay signature is invalid')
    }
    totalBytes += bytes.byteLength
    return {
      outputKey: cues[index].outputKey,
      mimeType: 'image/png',
      byteLength: bytes.byteLength,
      sha256: overlay.sha256,
      bytesBase64: bytes.toString('base64'),
    }
  })
  if (totalBytes > 8 * 1024 * 1024) throw new Error('caption overlays exceed combined byte ceiling')
  return overlays
}

function validateVoiceTrackCommitments(value, expected, fps) {
  if (!Array.isArray(value) || value.length !== expected.length || expected.length < 1) {
    throw new Error('voice-track commitments do not match approved sources')
  }
  const sourceIds = new Set()
  const outputKeys = new Set()
  let totalBytes = 0
  const tracks = value.map((candidate, index) => {
    const sourceSliceProvided =
      candidate && typeof candidate === 'object' &&
      (
        Object.hasOwn(candidate, 'sourceStartFrame') ||
        Object.hasOwn(candidate, 'sourceEndFrameExclusive')
      )
    const track = exactObject(candidate, [
      'sourceSequenceItemId', 'outputKey', 'durationFrames',
      ...(sourceSliceProvided
        ? ['sourceStartFrame', 'sourceEndFrameExclusive']
        : []),
      'mimeType', 'byteLength', 'sha256', 'bytesBase64',
    ], `voice-track commitment ${index + 1}`)
    const sourceSequenceItemId = safeIdentity(
      track.sourceSequenceItemId,
      'voice-track sourceSequenceItemId',
    )
    const outputKey = safeIdentity(track.outputKey, 'voice-track outputKey')
    const durationFrames = integer(
      track.durationFrames,
      1,
      sourceSliceProvided
        ? MAXIMUM_SOURCE_SLICE_LONG_FORM_FRAMES
        : MAXIMUM_SOURCE_SEGMENT_FRAMES,
      'voice-track durationFrames',
    )
    const sourceStartFrame = sourceSliceProvided
      ? integer(
          track.sourceStartFrame,
          0,
          MAXIMUM_SOURCE_SLICE_LONG_FORM_FRAMES - 1,
          'voice-track sourceStartFrame',
        )
      : undefined
    const sourceEndFrameExclusive = sourceSliceProvided
      ? integer(
          track.sourceEndFrameExclusive,
          1,
          MAXIMUM_SOURCE_SLICE_LONG_FORM_FRAMES,
          'voice-track sourceEndFrameExclusive',
        )
      : undefined
    if (
      sourceIds.has(sourceSequenceItemId) || outputKeys.has(outputKey) ||
      (expected[index].sourceSequenceItemId !== undefined &&
        sourceSequenceItemId !== expected[index].sourceSequenceItemId) ||
      (
        sourceSliceProvided
          ? (
              sourceEndFrameExclusive <= sourceStartFrame ||
              sourceEndFrameExclusive > durationFrames ||
              sourceEndFrameExclusive - sourceStartFrame !==
                expected[index].durationFrames
            )
          : durationFrames !== expected[index].durationFrames
      ) ||
      track.mimeType !== 'audio/wav' ||
      !Number.isSafeInteger(track.byteLength) || typeof track.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(track.sha256) || typeof track.bytesBase64 !== 'string'
    ) throw new Error('voice-track identity, order, or content commitment is invalid')
    const bytes = Buffer.from(track.bytesBase64, 'base64')
    if (
      bytes.byteLength !== track.byteLength || bytes.byteLength < 44 ||
      bytes.byteLength > MAXIMUM_COMBINED_VOICE_TRACK_BYTES ||
      bytes.toString('base64') !== track.bytesBase64 || sha256(bytes) !== track.sha256
    ) throw new Error('voice-track bytes do not match commitment')
    validatePcmVoiceTrack(bytes, durationFrames, fps)
    sourceIds.add(sourceSequenceItemId)
    outputKeys.add(outputKey)
    totalBytes += bytes.byteLength
    return {
      sourceSequenceItemId,
      outputKey,
      durationFrames,
      ...(sourceSliceProvided
        ? { sourceStartFrame, sourceEndFrameExclusive }
        : {}),
      mimeType: 'audio/wav',
      byteLength: bytes.byteLength,
      sha256: track.sha256,
      bytesBase64: bytes.toString('base64'),
    }
  })
  if (totalBytes > MAXIMUM_COMBINED_VOICE_TRACK_BYTES) {
    throw new Error('voice tracks exceed combined byte ceiling')
  }
  return tracks
}

function validatePcmVoiceTrack(bytes, durationFrames, fps, totalByteLength = bytes.byteLength) {
  const details = pcmWaveDetailsFromPrefix(
    bytes.subarray(0, MAXIMUM_PCM_WAVE_HEADER_BYTES),
    totalByteLength,
  )
  if (!details) throw new Error('voice track is not linear PCM WAV')
  const expectedSampleFrames = durationFrames * (48_000 / fps)
  if (
    details.channels !== 2 || details.sampleRate !== 48_000 ||
    details.bitsPerSample !== 16 || details.blockAlign !== 4 ||
    !Number.isInteger(expectedSampleFrames) ||
    Math.abs(details.sampleFrameCount - expectedSampleFrames) > 2
  ) throw new Error('voice track does not match fixed 48 kHz stereo frame duration')
}

async function validatePcmVoiceTrackFile(path, byteLength, durationFrames, fps) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size !== byteLength) {
      throw new Error('streaming voice file changed before PCM validation')
    }
    const prefix = Buffer.alloc(Math.min(byteLength, MAXIMUM_PCM_WAVE_HEADER_BYTES))
    let offset = 0
    while (offset < prefix.byteLength) {
      const result = await handle.read(prefix, offset, prefix.byteLength - offset, offset)
      if (result.bytesRead < 1) break
      offset += result.bytesRead
    }
    validatePcmVoiceTrack(prefix.subarray(0, offset), durationFrames, fps, byteLength)
  } finally {
    await handle.close()
  }
}

async function validatePcmSupplementalAudioFile(path, byteLength) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size !== byteLength) {
      throw new Error('streaming supplemental audio changed before PCM validation')
    }
    const prefix = Buffer.alloc(Math.min(byteLength, MAXIMUM_PCM_WAVE_HEADER_BYTES))
    let offset = 0
    while (offset < prefix.byteLength) {
      const result = await handle.read(prefix, offset, prefix.byteLength - offset, offset)
      if (result.bytesRead < 1) break
      offset += result.bytesRead
    }
    const details = pcmWaveDetailsFromPrefix(prefix.subarray(0, offset), byteLength)
    if (
      !details ||
      details.channels !== 2 ||
      details.sampleRate !== 48_000 ||
      details.bitsPerSample !== 16 ||
      details.blockAlign !== 4 ||
      details.sampleFrameCount < 1
    ) {
      throw new Error(
        'supplemental audio does not match the fixed 48 kHz stereo PCM policy',
      )
    }
  } finally {
    await handle.close()
  }
}

function pcmWaveDetailsFromPrefix(prefix, totalByteLength) {
  if (
    !Number.isSafeInteger(totalByteLength) || totalByteLength < 44 ||
    prefix.byteLength < 12 || prefix.byteLength > MAXIMUM_PCM_WAVE_HEADER_BYTES ||
    prefix.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    prefix.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) return undefined
  const riffSize = prefix.readUInt32LE(4)
  if (riffSize !== 0xffffffff && riffSize + 8 !== totalByteLength) return undefined
  let offset = 12
  let format
  while (offset + 8 <= prefix.byteLength) {
    const id = prefix.subarray(offset, offset + 4).toString('ascii')
    const size = prefix.readUInt32LE(offset + 4)
    const dataOffset = offset + 8
    if (id === 'fmt ') {
      if (size < 16 || size === 0xffffffff || dataOffset + 16 > prefix.byteLength) return undefined
      const audioFormat = prefix.readUInt16LE(dataOffset)
      const channels = prefix.readUInt16LE(dataOffset + 2)
      const sampleRate = prefix.readUInt32LE(dataOffset + 4)
      const byteRate = prefix.readUInt32LE(dataOffset + 8)
      const blockAlign = prefix.readUInt16LE(dataOffset + 12)
      const bitsPerSample = prefix.readUInt16LE(dataOffset + 14)
      if (
        audioFormat !== 1 || channels < 1 || channels > 8 ||
        sampleRate < 8_000 || sampleRate > 384_000 ||
        ![8, 16, 24, 32].includes(bitsPerSample) ||
        blockAlign !== channels * (bitsPerSample / 8) ||
        byteRate !== sampleRate * blockAlign
      ) return undefined
      format = { channels, sampleRate, blockAlign, bitsPerSample }
    } else if (id === 'data') {
      if (!format) return undefined
      const dataByteLength = totalByteLength - dataOffset
      if (
        dataByteLength <= 0 || dataByteLength % format.blockAlign !== 0 ||
        (size !== 0xffffffff && size !== dataByteLength)
      ) return undefined
      return {
        ...format,
        sampleFrameCount: dataByteLength / format.blockAlign,
      }
    }
    if (size === 0xffffffff) return undefined
    offset = dataOffset + size + (size % 2)
  }
  return undefined
}

function committedBase64(payload, prefix, mimeType, minimumBytes, maximumBytes) {
  const mimeKey = `${prefix}MimeType`
  const lengthKey = `${prefix}ByteLength`
  const shaKey = `${prefix}Sha256`
  const bytesKey = `${prefix}BytesBase64`
  if (
    payload[mimeKey] !== mimeType || !Number.isSafeInteger(payload[lengthKey]) ||
    typeof payload[shaKey] !== 'string' || !/^[a-f0-9]{64}$/.test(payload[shaKey]) ||
    typeof payload[bytesKey] !== 'string'
  ) throw new Error(`${prefix} commitment is invalid`)
  const bytes = Buffer.from(payload[bytesKey], 'base64')
  if (
    bytes.byteLength !== payload[lengthKey] || bytes.byteLength < minimumBytes || bytes.byteLength > maximumBytes ||
    bytes.toString('base64') !== payload[bytesKey] || sha256(bytes) !== payload[shaKey]
  ) throw new Error(`${prefix} bytes do not match commitment`)
  return bytes
}

function validateAudioSignature(bytes, mimeType) {
  if (mimeType === 'audio/wav') {
    if (
      bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
      bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
    ) throw new Error('narration WAV signature is invalid')
    return
  }
  const id3 = bytes.subarray(0, 3).toString('ascii') === 'ID3'
  const sync = bytes.byteLength >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0
  if (!id3 && !sync) throw new Error('narration MPEG signature is invalid')
}

function validateCaptionCreativeSceneGroupPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)
    || rawPayload.compositionProfileId !== 'caption_direction_creative_scene_group_v1') {
    return undefined
  }
  const payload = exactObject(rawPayload, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sceneGroupId', 'sceneGroupDigestSha256', 'motionLockDigestSha256',
    'storyTimingResolutionDigestSha256', 'confirmedOutputWidth',
    'confirmedOutputHeight', 'confirmedAspectRatioNumerator',
    'confirmedAspectRatioDenominator', 'privateReviewScaleNumerator',
    'privateReviewScaleDenominator', 'reducedMotion', 'subjectMaskFixturePolicy',
    'backgroundStyle', 'layers',
  ], 'Caption creative scene-group payload')
  const durationFrames = integer(payload.durationFrames, 24, 36_000, 'durationFrames')
  if (
    payload.width !== 640 || payload.height !== 360 || payload.fps !== 30 ||
    payload.confirmedOutputWidth !== 1920 || payload.confirmedOutputHeight !== 1080 ||
    payload.confirmedAspectRatioNumerator !== 16 ||
    payload.confirmedAspectRatioDenominator !== 9 ||
    payload.privateReviewScaleNumerator !== 1 ||
    payload.privateReviewScaleDenominator !== 3 ||
    typeof payload.reducedMotion !== 'boolean' ||
    !['none', 'deterministic_private_fixture_only_not_track_all_evidence']
      .includes(payload.subjectMaskFixturePolicy) ||
    payload.backgroundStyle !== 'editorial_night_sky_v1'
  ) throw new Error('Caption creative scene-group frame or fixture policy is unsupported')
  for (const digest of [
    payload.sceneGroupDigestSha256, payload.motionLockDigestSha256,
    payload.storyTimingResolutionDigestSha256,
  ]) {
    if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) {
      throw new Error('Caption creative scene-group lineage digest is invalid')
    }
  }
  if (!Array.isArray(payload.layers) || payload.layers.length < 2 || payload.layers.length > 128) {
    throw new Error('Caption creative scene group requires two to 128 layers')
  }
  const parseRange = (value, label) => {
    const range = exactObject(value, ['startFrame', 'endFrameExclusive'], label)
    const startFrame = integer(range.startFrame, 0, durationFrames - 1, `${label} startFrame`)
    const endFrameExclusive = integer(range.endFrameExclusive, 1, durationFrames, `${label} endFrameExclusive`)
    if (endFrameExclusive <= startFrame) throw new Error(`${label} is empty`)
    return { startFrame, endFrameExclusive }
  }
  const nullableRef = (value, label) => {
    if (value === null) return null
    const ref = exactObject(value, ['id', 'version', 'contentHash'], label)
    if (typeof ref.contentHash !== 'string' || !/^[a-f0-9]{64}$/.test(ref.contentHash)) {
      throw new Error(`${label} digest is invalid`)
    }
    return {
      id: safeIdentity(ref.id, `${label} id`),
      version: safeIdentity(ref.version, `${label} version`),
      contentHash: ref.contentHash,
    }
  }
  const seenLayerIds = new Set()
  const seenNodeIds = new Set()
  let previousStartFrame = -1
  let previousZIndex = -1
  let previousLayerId = ''
  const layers = payload.layers.map((candidate, index) => {
    const layer = exactObject(candidate, [
      'layerId', 'nodeId', 'trackId', 'phraseId', 'trackRole',
      'presentationKind', 'text', 'exactSourceWordIds', 'frameRange',
      'stableReadRange', 'depthPlane', 'zIndex', 'layoutBasisPoints',
      'typography', 'motion', 'reducedMotion', 'accessibilityCounterpartNodeId',
      'maskSequenceRef', 'objectAnchorRef', 'trackManifestRef',
      'dependencyDisposition',
    ], `Caption creative layer ${index + 1}`)
    const layerId = safeIdentity(layer.layerId, 'Caption creative layerId')
    const nodeId = safeIdentity(layer.nodeId, 'Caption creative nodeId')
    const trackId = safeIdentity(layer.trackId, 'Caption creative trackId')
    const phraseId = safeIdentity(layer.phraseId, 'Caption creative phraseId')
    const trackRole = oneOf(layer.trackRole, [
      'verbatim_speech', 'semantic_phrase', 'active_word', 'hero_typography',
      'persistent_topic_list', 'quote', 'speaker_attribution', 'caption_to_visual',
      'accessible_sidecar', 'localized_accessible',
    ], 'Caption creative trackRole')
    const presentationKind = oneOf(layer.presentationKind, [
      'stable_accessible_caption', 'semantic_phrase_card', 'hero_typography',
      'persistent_topic_list', 'environmental_label', 'object_anchor_label',
      'caption_to_visual_bridge',
    ], 'Caption creative presentationKind')
    if (!Array.isArray(layer.exactSourceWordIds)
      || layer.exactSourceWordIds.length < 1 || layer.exactSourceWordIds.length > 256) {
      throw new Error('Caption creative exact source-word lineage is invalid')
    }
    const exactSourceWordIds = layer.exactSourceWordIds.map((wordId) =>
      safeIdentity(wordId, 'Caption creative sourceWordId'))
    if (new Set(exactSourceWordIds).size !== exactSourceWordIds.length) {
      throw new Error('Caption creative source-word lineage contains duplicates')
    }
    const frameRange = parseRange(layer.frameRange, 'Caption creative frameRange')
    const stableReadRange = parseRange(layer.stableReadRange, 'Caption creative stableReadRange')
    if (stableReadRange.startFrame < frameRange.startFrame
      || stableReadRange.endFrameExclusive > frameRange.endFrameExclusive) {
      throw new Error('Caption creative stable-read range exceeds cue range')
    }
    const depthPlane = oneOf(layer.depthPlane, [
      'far_background', 'environmental_background', 'behind_subject',
      'speaker_adjacent', 'object_attached', 'in_front_of_subject',
      'foreground_hero', 'full_screen', 'safe_accessible',
    ], 'Caption creative depthPlane')
    const zIndex = integer(layer.zIndex, 0, 2_000, 'Caption creative zIndex')
    const layout = exactObject(layer.layoutBasisPoints,
      ['x', 'y', 'width', 'height'], 'Caption creative layout')
    const layoutBasisPoints = {
      x: integer(layout.x, 0, 9_999, 'Caption creative layout x'),
      y: integer(layout.y, 0, 9_999, 'Caption creative layout y'),
      width: integer(layout.width, 1, 10_000, 'Caption creative layout width'),
      height: integer(layout.height, 1, 10_000, 'Caption creative layout height'),
    }
    if (layoutBasisPoints.x + layoutBasisPoints.width > 10_000
      || layoutBasisPoints.y + layoutBasisPoints.height > 10_000) {
      throw new Error('Caption creative layout exceeds the confirmed frame')
    }
    const type = exactObject(layer.typography, [
      'fontFamilyToken', 'fontWeight', 'fontSizeBasisPointsOfFrameHeight',
      'lineHeightMilli', 'textColor', 'accentColor', 'plateStyle', 'textAlign',
    ], 'Caption creative typography')
    const typography = {
      fontFamilyToken: oneOf(type.fontFamilyToken,
        ['approved_caption_sans_fixture_v1'], 'Caption font token'),
      fontWeight: oneOf(type.fontWeight, [600, 700, 800], 'Caption font weight'),
      fontSizeBasisPointsOfFrameHeight: integer(type.fontSizeBasisPointsOfFrameHeight,
        400, 2_000, 'Caption font size'),
      lineHeightMilli: integer(type.lineHeightMilli, 900, 1_600, 'Caption line height'),
      textColor: oneOf(normalizedColor(type.textColor, 'Caption text color'),
        ['#F8FAFC', '#DFF7FF', '#09111F'], 'Caption text color'),
      accentColor: oneOf(normalizedColor(type.accentColor, 'Caption accent color'),
        ['#6EE7F9', '#A78BFA', '#FBBF24'], 'Caption accent color'),
      plateStyle: oneOf(type.plateStyle,
        ['none', 'soft_dark', 'soft_light', 'outline_dark'], 'Caption plate style'),
      textAlign: oneOf(type.textAlign, ['left', 'center'], 'Caption text alignment'),
    }
    const motionValue = exactObject(layer.motion, [
      'primitive', 'easing', 'travelBasisPoints', 'startScaleBasisPoints',
      'endScaleBasisPoints', 'startOpacityBasisPoints', 'endOpacityBasisPoints',
      'overshootBasisPoints', 'staggerFrames',
    ], 'Caption creative motion')
    const travel = exactObject(motionValue.travelBasisPoints,
      ['x', 'y'], 'Caption creative travel')
    const motion = {
      primitive: oneOf(motionValue.primitive, [
        'reveal', 'fade', 'scale', 'slide', 'wipe', 'tracked_move',
        'depth_transition', 'emphasis_pulse', 'brush_reveal', 'list_append',
        'hero_expansion', 'handoff_morph', 'stable_hold', 'cut',
      ], 'Caption motion primitive'),
      easing: oneOf(motionValue.easing,
        ['linear', 'ease_in', 'ease_out', 'ease_in_out', 'spring_restrained'],
        'Caption motion easing'),
      travelBasisPoints: {
        x: integer(travel.x, -2_000, 2_000, 'Caption travel x'),
        y: integer(travel.y, -2_000, 2_000, 'Caption travel y'),
      },
      startScaleBasisPoints: integer(motionValue.startScaleBasisPoints,
        5_000, 15_000, 'Caption start scale'),
      endScaleBasisPoints: integer(motionValue.endScaleBasisPoints,
        5_000, 15_000, 'Caption end scale'),
      startOpacityBasisPoints: integer(motionValue.startOpacityBasisPoints,
        0, 10_000, 'Caption start opacity'),
      endOpacityBasisPoints: integer(motionValue.endOpacityBasisPoints,
        0, 10_000, 'Caption end opacity'),
      overshootBasisPoints: integer(motionValue.overshootBasisPoints,
        0, 2_000, 'Caption overshoot'),
      staggerFrames: integer(motionValue.staggerFrames, 0, 120, 'Caption stagger'),
    }
    const reducedValue = exactObject(layer.reducedMotion,
      ['primitive', 'frameRange'], 'Caption reduced motion')
    const reducedFrameRange = parseRange(reducedValue.frameRange,
      'Caption reduced-motion frameRange')
    if (reducedFrameRange.startFrame !== frameRange.startFrame
      || reducedFrameRange.endFrameExclusive !== frameRange.endFrameExclusive) {
      throw new Error('Caption reduced-motion range diverges from StoryTiming')
    }
    const maskSequenceRef = nullableRef(layer.maskSequenceRef, 'Caption mask ref')
    const objectAnchorRef = nullableRef(layer.objectAnchorRef, 'Caption anchor ref')
    const trackManifestRef = nullableRef(layer.trackManifestRef, 'Caption track ref')
    const dependencyDisposition = oneOf(layer.dependencyDisposition, [
      'not_applicable', 'admitted_exact_private_evidence', 'declared_safe_fallback',
    ], 'Caption dependency disposition')
    if (dependencyDisposition === 'admitted_exact_private_evidence'
      && !(maskSequenceRef || objectAnchorRef || trackManifestRef)) {
      throw new Error('Caption admitted dependency lacks exact evidence')
    }
    if (presentationKind === 'stable_accessible_caption' && zIndex !== 1_000) {
      throw new Error('Stable Caption layer must remain above all visual layers')
    }
    if (seenLayerIds.has(layerId) || seenNodeIds.has(nodeId)
      || frameRange.startFrame < previousStartFrame
      || (frameRange.startFrame === previousStartFrame && zIndex < previousZIndex)
      || (frameRange.startFrame === previousStartFrame && zIndex === previousZIndex
        && layerId.localeCompare(previousLayerId) <= 0)) {
      throw new Error('Caption creative layers are duplicated or not deterministically ordered')
    }
    seenLayerIds.add(layerId)
    seenNodeIds.add(nodeId)
    previousStartFrame = frameRange.startFrame
    previousZIndex = zIndex
    previousLayerId = layerId
    return {
      layerId, nodeId, trackId, phraseId, trackRole, presentationKind,
      text: safeText(layer.text, 320, 'Caption creative text'),
      exactSourceWordIds, frameRange, stableReadRange, depthPlane, zIndex,
      layoutBasisPoints, typography, motion,
      reducedMotion: {
        primitive: oneOf(reducedValue.primitive,
          ['fade', 'stable_hold', 'cut'], 'Caption reduced-motion primitive'),
        frameRange: reducedFrameRange,
      },
      accessibilityCounterpartNodeId: layer.accessibilityCounterpartNodeId === null
        ? null : safeIdentity(layer.accessibilityCounterpartNodeId,
          'Caption accessibility counterpart'),
      maskSequenceRef, objectAnchorRef, trackManifestRef, dependencyDisposition,
    }
  })
  const events = layers.flatMap((layer) => [
    { frame: layer.frameRange.startFrame, delta: 1 },
    { frame: layer.frameRange.endFrameExclusive, delta: -1 },
  ]).sort((left, right) => left.frame - right.frame || left.delta - right.delta)
  let active = 0
  let maximum = 0
  for (const event of events) {
    active += event.delta
    maximum = Math.max(maximum, active)
  }
  if (maximum < 2 || maximum > 4
    || !layers.some((layer) => layer.presentationKind === 'stable_accessible_caption')
    || !layers.some((layer) => layer.presentationKind !== 'stable_accessible_caption')) {
    throw new Error('Caption creative scene group violates bounded multi-track policy')
  }
  return {
    compositionProfileId: 'caption_direction_creative_scene_group_v1',
    width: 640,
    height: 360,
    fps: 30,
    durationFrames,
    sceneGroupId: safeIdentity(payload.sceneGroupId, 'Caption sceneGroupId'),
    sceneGroupDigestSha256: payload.sceneGroupDigestSha256,
    motionLockDigestSha256: payload.motionLockDigestSha256,
    storyTimingResolutionDigestSha256: payload.storyTimingResolutionDigestSha256,
    confirmedOutputWidth: 1920,
    confirmedOutputHeight: 1080,
    confirmedAspectRatioNumerator: 16,
    confirmedAspectRatioDenominator: 9,
    privateReviewScaleNumerator: 1,
    privateReviewScaleDenominator: 3,
    reducedMotion: payload.reducedMotion,
    subjectMaskFixturePolicy: payload.subjectMaskFixturePolicy,
    backgroundStyle: 'editorial_night_sky_v1',
    layers,
  }
}

function validateCaptionRealSourceSceneGroupPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)
    || rawPayload.compositionProfileId !== 'caption_direction_real_source_scene_group_v2') {
    return undefined
  }
  const payload = exactObject(rawPayload, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sceneGroupId', 'sceneGroupDigestSha256', 'motionLockDigestSha256',
    'storyTimingResolutionDigestSha256', 'confirmedOutputWidth',
    'confirmedOutputHeight', 'confirmedAspectRatioNumerator',
    'confirmedAspectRatioDenominator', 'privateReviewScaleNumerator',
    'privateReviewScaleDenominator', 'reducedMotion', 'subjectMaskFixturePolicy',
    'backgroundStyle', 'safePlacementPolicy', 'sourceMediaPolicy',
    'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
    'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit', 'audioPolicy',
    'originalSourceSha256', 'originalSourceStartMilliseconds',
    'originalSourceEndMilliseconds', 'captionWordingReviewDigestSha256',
    'captionWordingReviewPolicy', 'wordLockedMotionUsed',
    'canonicalTranscriptQualificationClaimed', 'inspectionFrameNumbers', 'layers',
  ], 'Caption real-source scene-group payload')
  const durationFrames = integer(payload.durationFrames, 24, 900, 'durationFrames')
  if (
    payload.width !== 360 || payload.height !== 640 || payload.fps !== 30 ||
    payload.confirmedOutputWidth !== 1080 || payload.confirmedOutputHeight !== 1920 ||
    payload.confirmedAspectRatioNumerator !== 9 ||
    payload.confirmedAspectRatioDenominator !== 16 ||
    payload.privateReviewScaleNumerator !== 1 ||
    payload.privateReviewScaleDenominator !== 3 ||
    typeof payload.reducedMotion !== 'boolean' ||
    payload.subjectMaskFixturePolicy !== 'none' ||
    payload.backgroundStyle !== 'real_source_video_v1' ||
    payload.safePlacementPolicy !== 'speaker_face_and_gesture_avoidance_top_plane_v1' ||
    payload.sourceMediaPolicy !== 'approved_caption_private_review_proxy_v1' ||
    payload.sourceMimeType !== 'video/mp4' || payload.sourceStartFrame !== 0 ||
    payload.sourceEndFrameExclusive !== durationFrames ||
    payload.sourceFit !== 'contain' || payload.audioPolicy !== 'preserve_source' ||
    payload.captionWordingReviewPolicy !==
      'fixture_specific_human_review_phrase_level_only_v1' ||
    payload.wordLockedMotionUsed !== false ||
    payload.canonicalTranscriptQualificationClaimed !== false
  ) throw new Error('Caption real-source frame, source, or review policy is unsupported')
  const originalSourceStartMilliseconds = integer(
    payload.originalSourceStartMilliseconds, 0, 3_600_000,
    'Caption original source start milliseconds',
  )
  const originalSourceEndMilliseconds = integer(
    payload.originalSourceEndMilliseconds, 1, 3_600_000,
    'Caption original source end milliseconds',
  )
  if (originalSourceEndMilliseconds <= originalSourceStartMilliseconds) {
    throw new Error('Caption original source range is empty')
  }
  for (const digest of [
    payload.originalSourceSha256, payload.captionWordingReviewDigestSha256,
  ]) {
    if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) {
      throw new Error('Caption real-source evidence digest is invalid')
    }
  }
  const source = committedBase64(
    payload, 'source', 'video/mp4', 1024, 16 * 1024 * 1024,
  )
  if (source.subarray(4, 8).toString('ascii') !== 'ftyp') {
    throw new Error('Caption real-source proxy MP4 signature is invalid')
  }
  const creativePayload = validateCaptionCreativeSceneGroupPayload({
    compositionProfileId: 'caption_direction_creative_scene_group_v1',
    width: 640,
    height: 360,
    fps: 30,
    durationFrames,
    sceneGroupId: payload.sceneGroupId,
    sceneGroupDigestSha256: payload.sceneGroupDigestSha256,
    motionLockDigestSha256: payload.motionLockDigestSha256,
    storyTimingResolutionDigestSha256: payload.storyTimingResolutionDigestSha256,
    confirmedOutputWidth: 1920,
    confirmedOutputHeight: 1080,
    confirmedAspectRatioNumerator: 16,
    confirmedAspectRatioDenominator: 9,
    privateReviewScaleNumerator: 1,
    privateReviewScaleDenominator: 3,
    reducedMotion: payload.reducedMotion,
    subjectMaskFixturePolicy: 'none',
    backgroundStyle: 'editorial_night_sky_v1',
    layers: payload.layers,
  })
  if (!creativePayload) throw new Error('Caption real-source layers lost their closed contract')
  if (!Array.isArray(payload.inspectionFrameNumbers)
    || payload.inspectionFrameNumbers.length < 4
    || payload.inspectionFrameNumbers.length > 16) {
    throw new Error('Caption real-source inspection frames are incomplete')
  }
  const inspectionFrameNumbers = payload.inspectionFrameNumbers.map((frame) =>
    integer(frame, 0, durationFrames - 1, 'Caption inspection frame'))
  const requiredInspectionFrames = new Set([
    0,
    ...creativePayload.layers.map((layer) => Math.floor(
      (layer.frameRange.startFrame + layer.frameRange.endFrameExclusive - 1) / 2,
    )),
    durationFrames - 1,
  ])
  if (
    new Set(inspectionFrameNumbers).size !== inspectionFrameNumbers.length ||
    inspectionFrameNumbers.some((frame, index) =>
      index > 0 && frame <= inspectionFrameNumbers[index - 1]) ||
    [...requiredInspectionFrames].some((frame) =>
      !inspectionFrameNumbers.includes(frame))
  ) throw new Error('Caption real-source inspection frames do not cover cue timing')
  return {
    compositionProfileId: 'caption_direction_real_source_scene_group_v2',
    width: 360,
    height: 640,
    fps: 30,
    durationFrames,
    sceneGroupId: creativePayload.sceneGroupId,
    sceneGroupDigestSha256: creativePayload.sceneGroupDigestSha256,
    motionLockDigestSha256: creativePayload.motionLockDigestSha256,
    storyTimingResolutionDigestSha256:
      creativePayload.storyTimingResolutionDigestSha256,
    confirmedOutputWidth: 1080,
    confirmedOutputHeight: 1920,
    confirmedAspectRatioNumerator: 9,
    confirmedAspectRatioDenominator: 16,
    privateReviewScaleNumerator: 1,
    privateReviewScaleDenominator: 3,
    reducedMotion: creativePayload.reducedMotion,
    subjectMaskFixturePolicy: 'none',
    backgroundStyle: 'real_source_video_v1',
    safePlacementPolicy: 'speaker_face_and_gesture_avoidance_top_plane_v1',
    sourceMediaPolicy: 'approved_caption_private_review_proxy_v1',
    sourceMimeType: 'video/mp4',
    sourceByteLength: source.byteLength,
    sourceSha256: payload.sourceSha256,
    sourceBytesBase64: source.toString('base64'),
    sourceStartFrame: 0,
    sourceEndFrameExclusive: durationFrames,
    sourceFit: 'contain',
    audioPolicy: 'preserve_source',
    originalSourceSha256: payload.originalSourceSha256,
    originalSourceStartMilliseconds,
    originalSourceEndMilliseconds,
    captionWordingReviewDigestSha256: payload.captionWordingReviewDigestSha256,
    captionWordingReviewPolicy:
      'fixture_specific_human_review_phrase_level_only_v1',
    wordLockedMotionUsed: false,
    canonicalTranscriptQualificationClaimed: false,
    inspectionFrameNumbers,
    layers: creativePayload.layers,
  }
}

function validateCaptionRealSourceMultiOutputSceneGroupPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)
    || rawPayload.compositionProfileId !==
      'caption_direction_real_source_multi_output_scene_group_v3') {
    return undefined
  }
  const payload = exactObject(rawPayload, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sceneGroupId', 'sceneGroupDigestSha256', 'motionLockDigestSha256',
    'storyTimingResolutionDigestSha256', 'confirmedOutputWidth',
    'confirmedOutputHeight', 'confirmedAspectRatioNumerator',
    'confirmedAspectRatioDenominator', 'privateReviewScaleNumerator',
    'privateReviewScaleDenominator', 'outputFormat', 'reducedMotion',
    'subjectMaskFixturePolicy', 'backgroundStyle', 'sourcePresentation',
    'safePlacementPolicy', 'sourceMediaPolicy', 'sourceMimeType',
    'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
    'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit', 'audioPolicy',
    'originalSourceSha256', 'originalSourceStartMilliseconds',
    'originalSourceEndMilliseconds', 'captionWordingReviewDigestSha256',
    'captionWordingReviewPolicy', 'wordLockedMotionUsed',
    'canonicalTranscriptQualificationClaimed',
    'syntheticEngineeringFixtureAcceptedAsProfessionalAppearance',
    'realSourcePixelsRequiredForProfessionalAppearance',
    'inspectionFrameNumbers', 'layers',
  ], 'Caption real-source multi-output scene-group payload')
  const durationFrames = integer(payload.durationFrames, 24, 900,
    'durationFrames')
  const wide = payload.outputFormat === 'widescreen_16_9'
  const square = payload.outputFormat === 'square_1_1'
  const frameMatches = wide
    ? payload.width === 640 && payload.height === 360
      && payload.confirmedOutputWidth === 1920
      && payload.confirmedOutputHeight === 1080
      && payload.confirmedAspectRatioNumerator === 16
      && payload.confirmedAspectRatioDenominator === 9
    : square && payload.width === 480 && payload.height === 480
      && payload.confirmedOutputWidth === 1440
      && payload.confirmedOutputHeight === 1440
      && payload.confirmedAspectRatioNumerator === 1
      && payload.confirmedAspectRatioDenominator === 1
  if (
    !frameMatches || payload.fps !== 30
    || payload.privateReviewScaleNumerator !== 1
    || payload.privateReviewScaleDenominator !== 3
    || typeof payload.reducedMotion !== 'boolean'
    || payload.subjectMaskFixturePolicy !== 'none'
    || payload.backgroundStyle !== 'real_source_editorial_split_v1'
    || payload.sourcePresentation !== 'editorial_split_right_v1'
    || payload.safePlacementPolicy !==
      'speaker_face_and_gesture_avoidance_editorial_sidecar_v1'
    || payload.sourceMediaPolicy !==
      'approved_caption_private_review_proxy_v1'
    || payload.sourceMimeType !== 'video/mp4'
    || payload.sourceStartFrame !== 0
    || payload.sourceEndFrameExclusive !== durationFrames
    || payload.sourceFit !== 'contain'
    || payload.audioPolicy !== 'preserve_source'
    || payload.captionWordingReviewPolicy !==
      'fixture_specific_human_review_phrase_level_only_v1'
    || payload.wordLockedMotionUsed !== false
    || payload.canonicalTranscriptQualificationClaimed !== false
    || payload.syntheticEngineeringFixtureAcceptedAsProfessionalAppearance
      !== false
    || payload.realSourcePixelsRequiredForProfessionalAppearance !== true
  ) {
    throw new Error(
      'Caption real-source multi-output frame or review policy is unsupported')
  }
  const originalSourceStartMilliseconds = integer(
    payload.originalSourceStartMilliseconds, 0, 3_600_000,
    'Caption original source start milliseconds',
  )
  const originalSourceEndMilliseconds = integer(
    payload.originalSourceEndMilliseconds, 1, 3_600_000,
    'Caption original source end milliseconds',
  )
  if (originalSourceEndMilliseconds <= originalSourceStartMilliseconds) {
    throw new Error('Caption original source range is empty')
  }
  for (const digest of [
    payload.originalSourceSha256, payload.captionWordingReviewDigestSha256,
  ]) {
    if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) {
      throw new Error(
        'Caption real-source multi-output evidence digest is invalid')
    }
  }
  const source = committedBase64(
    payload, 'source', 'video/mp4', 1024, 16 * 1024 * 1024,
  )
  if (source.subarray(4, 8).toString('ascii') !== 'ftyp') {
    throw new Error(
      'Caption real-source multi-output proxy MP4 signature is invalid')
  }
  const creativePayload = validateCaptionCreativeSceneGroupPayload({
    compositionProfileId: 'caption_direction_creative_scene_group_v1',
    width: 640,
    height: 360,
    fps: 30,
    durationFrames,
    sceneGroupId: payload.sceneGroupId,
    sceneGroupDigestSha256: payload.sceneGroupDigestSha256,
    motionLockDigestSha256: payload.motionLockDigestSha256,
    storyTimingResolutionDigestSha256:
      payload.storyTimingResolutionDigestSha256,
    confirmedOutputWidth: 1920,
    confirmedOutputHeight: 1080,
    confirmedAspectRatioNumerator: 16,
    confirmedAspectRatioDenominator: 9,
    privateReviewScaleNumerator: 1,
    privateReviewScaleDenominator: 3,
    reducedMotion: payload.reducedMotion,
    subjectMaskFixturePolicy: 'none',
    backgroundStyle: 'editorial_night_sky_v1',
    layers: payload.layers,
  })
  if (!creativePayload) {
    throw new Error(
      'Caption real-source multi-output layers lost their closed contract')
  }
  if (!Array.isArray(payload.inspectionFrameNumbers)
    || payload.inspectionFrameNumbers.length < 4
    || payload.inspectionFrameNumbers.length > 16) {
    throw new Error(
      'Caption real-source multi-output inspection frames are incomplete')
  }
  const inspectionFrameNumbers = payload.inspectionFrameNumbers.map((frame) =>
    integer(frame, 0, durationFrames - 1, 'Caption inspection frame'))
  const requiredInspectionFrames = new Set([
    0,
    ...creativePayload.layers.map((layer) => Math.floor(
      (layer.frameRange.startFrame + layer.frameRange.endFrameExclusive - 1)
      / 2,
    )),
    durationFrames - 1,
  ])
  if (
    new Set(inspectionFrameNumbers).size !== inspectionFrameNumbers.length
    || inspectionFrameNumbers.some((frame, index) =>
      index > 0 && frame <= inspectionFrameNumbers[index - 1])
    || [...requiredInspectionFrames].some((frame) =>
      !inspectionFrameNumbers.includes(frame))
  ) {
    throw new Error(
      'Caption real-source multi-output inspection frames miss cue timing')
  }
  return {
    compositionProfileId:
      'caption_direction_real_source_multi_output_scene_group_v3',
    width: wide ? 640 : 480,
    height: wide ? 360 : 480,
    fps: 30,
    durationFrames,
    sceneGroupId: creativePayload.sceneGroupId,
    sceneGroupDigestSha256: creativePayload.sceneGroupDigestSha256,
    motionLockDigestSha256: creativePayload.motionLockDigestSha256,
    storyTimingResolutionDigestSha256:
      creativePayload.storyTimingResolutionDigestSha256,
    confirmedOutputWidth: wide ? 1920 : 1440,
    confirmedOutputHeight: wide ? 1080 : 1440,
    confirmedAspectRatioNumerator: wide ? 16 : 1,
    confirmedAspectRatioDenominator: wide ? 9 : 1,
    privateReviewScaleNumerator: 1,
    privateReviewScaleDenominator: 3,
    outputFormat: wide ? 'widescreen_16_9' : 'square_1_1',
    reducedMotion: creativePayload.reducedMotion,
    subjectMaskFixturePolicy: 'none',
    backgroundStyle: 'real_source_editorial_split_v1',
    sourcePresentation: 'editorial_split_right_v1',
    safePlacementPolicy:
      'speaker_face_and_gesture_avoidance_editorial_sidecar_v1',
    sourceMediaPolicy: 'approved_caption_private_review_proxy_v1',
    sourceMimeType: 'video/mp4',
    sourceByteLength: source.byteLength,
    sourceSha256: payload.sourceSha256,
    sourceBytesBase64: source.toString('base64'),
    sourceStartFrame: 0,
    sourceEndFrameExclusive: durationFrames,
    sourceFit: 'contain',
    audioPolicy: 'preserve_source',
    originalSourceSha256: payload.originalSourceSha256,
    originalSourceStartMilliseconds,
    originalSourceEndMilliseconds,
    captionWordingReviewDigestSha256:
      payload.captionWordingReviewDigestSha256,
    captionWordingReviewPolicy:
      'fixture_specific_human_review_phrase_level_only_v1',
    wordLockedMotionUsed: false,
    canonicalTranscriptQualificationClaimed: false,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    realSourcePixelsRequiredForProfessionalAppearance: true,
    inspectionFrameNumbers,
    layers: creativePayload.layers,
  }
}

function validateCaptionBrollOwnerRealSourceSceneGroupPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)
    || ![
      'caption_direction_broll_owner_real_source_scene_group_v4',
      'caption_direction_broll_owner_approved_run_scene_group_v5',
      'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6',
    ].includes(rawPayload.compositionProfileId)) {
    return undefined
  }
  const exactFrame = rawPayload.compositionProfileId ===
    'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6'
  const approvedRun = exactFrame || rawPayload.compositionProfileId ===
    'caption_direction_broll_owner_approved_run_scene_group_v5'
  const payload = exactObject(rawPayload, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sceneGroupId', 'sceneGroupDigestSha256', 'motionLockDigestSha256',
    'storyTimingResolutionDigestSha256', 'masterTimingDigestSha256',
    'confirmedOutputWidth',
    'confirmedOutputHeight', 'confirmedAspectRatioNumerator',
    'confirmedAspectRatioDenominator', 'privateReviewScaleNumerator',
    'privateReviewScaleDenominator', 'reducedMotion',
    'subjectMaskFixturePolicy', 'backgroundStyle', 'sourcePresentation',
    'safePlacementPolicy', 'sourceMediaPolicy', 'sourceMimeType',
    'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
    'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit',
    'audioPolicy', 'masterTimelineStartFrame',
    'masterTimelineEndFrameExclusive', 'ownerRequestDigestSha256',
    'ownerResultDigestSha256', 'brollResultReceiptDigestSha256',
    'selectedMediaManifestDigestSha256', 'layoutOccupancyDigestSha256',
    'cropTimingDigestSha256', 'visibleTextEvidenceDigestSha256',
    'authenticatedOwnerEvidenceDigestSha256',
    'ownerCanonicalScopeDigestSha256',
    'selectedNormalizedSourceSha256',
    'selectedNormalizedSourceByteLength',
    'selectedNormalizedSourceFrameCount', 'selectedNormalizedSourceFps',
    'remotionProxyProfileId', 'remotionProxyDerivedFromSelectedArtifact',
    'exactOwnerResultRereadVerified', 'sourceSelectionPerformedByCaption',
    'cropOrTimingPerformedByCaption',
    'captionWordingReviewDigestSha256', 'captionWordingReviewPolicy',
    'wordLockedMotionUsed', 'canonicalTranscriptQualificationClaimed',
    'syntheticEngineeringFixtureAcceptedAsProfessionalAppearance',
    'realSourcePixelsRequiredForProfessionalAppearance',
    'inspectionFrameNumbers', 'layers',
    ...(approvedRun ? [
      'approvedSnapshotDigestSha256', 'executionPackageDigestSha256',
      'captionPlanningProjectionDigestSha256',
      'captionPlanningBindingDigestSha256',
      'captionRenderedMediaWorkBindingDigestSha256',
      'exactImmutableApprovedRunRereadVerified',
      'creativeReviewSupplementsCanonicalFinalCanvas',
      'creativeReviewReplacesCanonicalFinalCanvas',
      'canonicalTranscriptDigestSha256',
      'canonicalTranscriptEvidenceDigestSha256',
      'exactSourceWordLineageBound', 'completeTimeInspectionRequired',
    ] : []),
  ], 'Caption B-roll-owner real-source scene-group payload')
  const durationFrames = integer(payload.durationFrames, 24, 900,
    'durationFrames')
  const masterTimelineStartFrame = integer(
    payload.masterTimelineStartFrame, 0, 100_000_000,
    'Caption B-roll master timeline start frame',
  )
  const masterTimelineEndFrameExclusive = integer(
    payload.masterTimelineEndFrameExclusive, 1, 100_000_001,
    'Caption B-roll master timeline end frame',
  )
  const selectedNormalizedSourceByteLength = integer(
    payload.selectedNormalizedSourceByteLength, 1024, 16 * 1024 * 1024,
    'Caption B-roll selected normalized source byte length',
  )
  const selectedNormalizedSourceFrameCount = integer(
    payload.selectedNormalizedSourceFrameCount, 24, 900,
    'Caption B-roll selected normalized source frame count',
  )
  const expectedFps = approvedRun ? 30 : 24
  const expectedOutputWidth = approvedRun ? 3840 : 1920
  const expectedOutputHeight = approvedRun ? 2160 : 1080
  const expectedScaleDenominator = exactFrame ? 1 : approvedRun ? 6 : 3
  const expectedRenderWidth = exactFrame ? 3840 : 640
  const expectedRenderHeight = exactFrame ? 2160 : 360
  const expectedWordingPolicy = approvedRun
    ? 'canonical_approved_run_phrase_lineage_review_v1'
    : 'fixture_specific_human_review_phrase_level_only_v1'
  if (
    payload.width !== expectedRenderWidth
    || payload.height !== expectedRenderHeight
    || payload.fps !== expectedFps
    || payload.confirmedOutputWidth !== expectedOutputWidth
    || payload.confirmedOutputHeight !== expectedOutputHeight
    || payload.confirmedAspectRatioNumerator !== 16
    || payload.confirmedAspectRatioDenominator !== 9
    || payload.privateReviewScaleNumerator !== 1
    || payload.privateReviewScaleDenominator !== expectedScaleDenominator
    || typeof payload.reducedMotion !== 'boolean'
    || payload.subjectMaskFixturePolicy !== 'none'
    || payload.backgroundStyle !== 'broll_owner_real_source_full_frame_v1'
    || payload.sourcePresentation !== 'full_frame_cutaway_v1'
    || payload.safePlacementPolicy !==
      'broll_center_safe_caption_lower_band_v1'
    || payload.sourceMediaPolicy !==
      'approved_b_roll_qa_normalized_preview_proxy_v1'
    || payload.sourceMimeType !== 'video/x-matroska'
    || payload.sourceStartFrame !== 0
    || payload.sourceEndFrameExclusive !== durationFrames
    || payload.sourceFit !== 'contain'
    || payload.audioPolicy !== 'source_audio_absent_owner_normalized'
    || masterTimelineEndFrameExclusive - masterTimelineStartFrame
      !== durationFrames
    || selectedNormalizedSourceFrameCount !== durationFrames
    || payload.selectedNormalizedSourceFps !== expectedFps
    || payload.remotionProxyProfileId !==
      'approved_b_roll_remotion_preview_proxy_matroska_v1'
    || payload.remotionProxyDerivedFromSelectedArtifact !== true
    || payload.exactOwnerResultRereadVerified !== true
    || payload.sourceSelectionPerformedByCaption !== false
    || payload.cropOrTimingPerformedByCaption !== false
    || payload.captionWordingReviewPolicy !== expectedWordingPolicy
    || payload.wordLockedMotionUsed !== false
    || payload.canonicalTranscriptQualificationClaimed !== false
    || payload.syntheticEngineeringFixtureAcceptedAsProfessionalAppearance
      !== false
    || payload.realSourcePixelsRequiredForProfessionalAppearance !== true
    || (approvedRun && (
      payload.exactImmutableApprovedRunRereadVerified !== true
      || payload.creativeReviewSupplementsCanonicalFinalCanvas !== true
      || payload.creativeReviewReplacesCanonicalFinalCanvas !== false
      || payload.exactSourceWordLineageBound !== true
      || payload.completeTimeInspectionRequired !== true
    ))
  ) {
    throw new Error(
      'Caption B-roll-owner frame, source, timing, or authority policy is unsupported')
  }
  for (const digest of [
    payload.sceneGroupDigestSha256,
    payload.motionLockDigestSha256,
    payload.storyTimingResolutionDigestSha256,
    payload.masterTimingDigestSha256,
    payload.ownerRequestDigestSha256,
    payload.ownerResultDigestSha256,
    payload.brollResultReceiptDigestSha256,
    payload.selectedMediaManifestDigestSha256,
    payload.layoutOccupancyDigestSha256,
    payload.cropTimingDigestSha256,
    payload.visibleTextEvidenceDigestSha256,
    payload.authenticatedOwnerEvidenceDigestSha256,
    payload.ownerCanonicalScopeDigestSha256,
    payload.selectedNormalizedSourceSha256,
    payload.captionWordingReviewDigestSha256,
    ...(approvedRun ? [
      payload.approvedSnapshotDigestSha256,
      payload.executionPackageDigestSha256,
      payload.captionPlanningProjectionDigestSha256,
      payload.captionPlanningBindingDigestSha256,
      payload.captionRenderedMediaWorkBindingDigestSha256,
      payload.canonicalTranscriptDigestSha256,
      payload.canonicalTranscriptEvidenceDigestSha256,
    ] : []),
  ]) {
    if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) {
      throw new Error('Caption B-roll-owner evidence digest is invalid')
    }
  }
  const source = committedBase64(
    payload, 'source', 'video/x-matroska', 1024, 16 * 1024 * 1024,
  )
  if (!approvedSourceSignature(source, 'video/x-matroska')) {
    throw new Error('Caption B-roll-owner proxy Matroska signature is invalid')
  }
  const creativePayload = validateCaptionCreativeSceneGroupPayload({
    compositionProfileId: 'caption_direction_creative_scene_group_v1',
    width: 640,
    height: 360,
    fps: 30,
    durationFrames,
    sceneGroupId: payload.sceneGroupId,
    sceneGroupDigestSha256: payload.sceneGroupDigestSha256,
    motionLockDigestSha256: payload.motionLockDigestSha256,
    storyTimingResolutionDigestSha256:
      payload.storyTimingResolutionDigestSha256,
    confirmedOutputWidth: 1920,
    confirmedOutputHeight: 1080,
    confirmedAspectRatioNumerator: 16,
    confirmedAspectRatioDenominator: 9,
    privateReviewScaleNumerator: 1,
    privateReviewScaleDenominator: 3,
    reducedMotion: payload.reducedMotion,
    subjectMaskFixturePolicy: 'none',
    backgroundStyle: 'editorial_night_sky_v1',
    layers: payload.layers,
  })
  if (!creativePayload || creativePayload.layers.length !== 4
    || creativePayload.layers.some((layer) =>
      layer.layoutBasisPoints.y < 5400
      || layer.layoutBasisPoints.y + layer.layoutBasisPoints.height > 9300)) {
    throw new Error('Caption B-roll-owner layers leave the approved lower safe band')
  }
  if (!Array.isArray(payload.inspectionFrameNumbers)
    || payload.inspectionFrameNumbers.length < 4
    || payload.inspectionFrameNumbers.length > 16) {
    throw new Error('Caption B-roll-owner inspection frames are incomplete')
  }
  const inspectionFrameNumbers = payload.inspectionFrameNumbers.map((frame) =>
    integer(frame, 0, durationFrames - 1,
      'Caption B-roll-owner inspection frame'))
  const requiredInspectionFrames = new Set([
    0,
    ...creativePayload.layers.map((layer) => Math.floor(
      (layer.frameRange.startFrame + layer.frameRange.endFrameExclusive - 1)
      / 2,
    )),
    durationFrames - 1,
  ])
  if (
    new Set(inspectionFrameNumbers).size !== inspectionFrameNumbers.length
    || inspectionFrameNumbers.some((frame, index) =>
      index > 0 && frame <= inspectionFrameNumbers[index - 1])
    || [...requiredInspectionFrames].some((frame) =>
      !inspectionFrameNumbers.includes(frame))
  ) {
    throw new Error('Caption B-roll-owner inspection misses exact cue timing')
  }
  return {
    compositionProfileId: exactFrame
      ? 'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6'
      : approvedRun
        ? 'caption_direction_broll_owner_approved_run_scene_group_v5'
        : 'caption_direction_broll_owner_real_source_scene_group_v4',
    width: expectedRenderWidth,
    height: expectedRenderHeight,
    fps: expectedFps,
    durationFrames,
    sceneGroupId: creativePayload.sceneGroupId,
    sceneGroupDigestSha256: creativePayload.sceneGroupDigestSha256,
    motionLockDigestSha256: creativePayload.motionLockDigestSha256,
    storyTimingResolutionDigestSha256:
      creativePayload.storyTimingResolutionDigestSha256,
    masterTimingDigestSha256: payload.masterTimingDigestSha256,
    confirmedOutputWidth: expectedOutputWidth,
    confirmedOutputHeight: expectedOutputHeight,
    confirmedAspectRatioNumerator: 16,
    confirmedAspectRatioDenominator: 9,
    privateReviewScaleNumerator: 1,
    privateReviewScaleDenominator: expectedScaleDenominator,
    reducedMotion: creativePayload.reducedMotion,
    subjectMaskFixturePolicy: 'none',
    backgroundStyle: 'broll_owner_real_source_full_frame_v1',
    sourcePresentation: 'full_frame_cutaway_v1',
    safePlacementPolicy: 'broll_center_safe_caption_lower_band_v1',
    sourceMediaPolicy: 'approved_b_roll_qa_normalized_preview_proxy_v1',
    sourceMimeType: 'video/x-matroska',
    sourceByteLength: source.byteLength,
    sourceSha256: payload.sourceSha256,
    sourceBytesBase64: source.toString('base64'),
    sourceStartFrame: 0,
    sourceEndFrameExclusive: durationFrames,
    sourceFit: 'contain',
    audioPolicy: 'source_audio_absent_owner_normalized',
    masterTimelineStartFrame,
    masterTimelineEndFrameExclusive,
    ...(approvedRun ? {
      approvedSnapshotDigestSha256:
        payload.approvedSnapshotDigestSha256,
      executionPackageDigestSha256:
        payload.executionPackageDigestSha256,
      captionPlanningProjectionDigestSha256:
        payload.captionPlanningProjectionDigestSha256,
      captionPlanningBindingDigestSha256:
        payload.captionPlanningBindingDigestSha256,
      captionRenderedMediaWorkBindingDigestSha256:
        payload.captionRenderedMediaWorkBindingDigestSha256,
    } : {}),
    ownerRequestDigestSha256: payload.ownerRequestDigestSha256,
    ownerResultDigestSha256: payload.ownerResultDigestSha256,
    brollResultReceiptDigestSha256:
      payload.brollResultReceiptDigestSha256,
    selectedMediaManifestDigestSha256:
      payload.selectedMediaManifestDigestSha256,
    layoutOccupancyDigestSha256: payload.layoutOccupancyDigestSha256,
    cropTimingDigestSha256: payload.cropTimingDigestSha256,
    visibleTextEvidenceDigestSha256: payload.visibleTextEvidenceDigestSha256,
    authenticatedOwnerEvidenceDigestSha256:
      payload.authenticatedOwnerEvidenceDigestSha256,
    ownerCanonicalScopeDigestSha256:
      payload.ownerCanonicalScopeDigestSha256,
    selectedNormalizedSourceSha256: payload.selectedNormalizedSourceSha256,
    selectedNormalizedSourceByteLength,
    selectedNormalizedSourceFrameCount,
    selectedNormalizedSourceFps: expectedFps,
    remotionProxyProfileId:
      'approved_b_roll_remotion_preview_proxy_matroska_v1',
    remotionProxyDerivedFromSelectedArtifact: true,
    exactOwnerResultRereadVerified: true,
    ...(approvedRun ? {
      exactImmutableApprovedRunRereadVerified: true,
      creativeReviewSupplementsCanonicalFinalCanvas: true,
      creativeReviewReplacesCanonicalFinalCanvas: false,
    } : {}),
    sourceSelectionPerformedByCaption: false,
    cropOrTimingPerformedByCaption: false,
    captionWordingReviewDigestSha256:
      payload.captionWordingReviewDigestSha256,
    captionWordingReviewPolicy: expectedWordingPolicy,
    ...(approvedRun ? {
      canonicalTranscriptDigestSha256:
        payload.canonicalTranscriptDigestSha256,
      canonicalTranscriptEvidenceDigestSha256:
        payload.canonicalTranscriptEvidenceDigestSha256,
      exactSourceWordLineageBound: true,
    } : {}),
    wordLockedMotionUsed: false,
    canonicalTranscriptQualificationClaimed: false,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    realSourcePixelsRequiredForProfessionalAppearance: true,
    ...(approvedRun ? { completeTimeInspectionRequired: true } : {}),
    inspectionFrameNumbers,
    layers: creativePayload.layers,
  }
}

function validateMotionStudioPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) return undefined

  if (rawPayload.compositionProfileId === 'motion_studio_deterministic_route_draw_v1') {
    const payload = exactObject(rawPayload, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sceneId', 'sceneStartFrame', 'sceneEndFrame', 'semanticPurpose',
      'routePresetId', 'routeRevealStartFrame', 'routeRevealEndFrame',
      'waypointFrames', 'routeCoverColor', 'routeColor', 'routeGlowColor',
      'keyframeMimeType', 'keyframeByteLength', 'keyframeSha256', 'keyframeBytesBase64',
    ], 'Motion Studio deterministic route-draw payload')
    if (
      payload.width !== 1280 || payload.height !== 720 || payload.fps !== 30 ||
      payload.durationFrames !== 180 || payload.sceneStartFrame !== 0 ||
      payload.sceneEndFrame !== 180 ||
      payload.routePresetId !== 'abstract_three_district_route_v1' ||
      payload.routeRevealStartFrame !== 18 || payload.routeRevealEndFrame !== 140 ||
      JSON.stringify(payload.waypointFrames) !== JSON.stringify([18, 82, 140]) ||
      payload.routeCoverColor !== '#081426' || payload.routeColor !== '#FFB23D' ||
      payload.routeGlowColor !== '#FF7A1A'
    ) throw new Error('Motion Studio deterministic route-draw profile is unsupported')
    const keyframe = committedBase64(
      payload,
      'keyframe',
      'image/png',
      1_024,
      8 * 1024 * 1024,
    )
    if (
      keyframe.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
      keyframe.toString('ascii', 12, 16) !== 'IHDR' ||
      keyframe.readUInt32BE(16) !== 1280 || keyframe.readUInt32BE(20) !== 720 ||
      keyframe[24] !== 8 || keyframe[25] !== 2
    ) throw new Error('Motion Studio route-draw keyframe signature is invalid')
    return {
      compositionProfileId: 'motion_studio_deterministic_route_draw_v1',
      width: 1280,
      height: 720,
      fps: 30,
      durationFrames: 180,
      sceneId: safeIdentity(payload.sceneId, 'sceneId'),
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
      keyframeMimeType: 'image/png',
      keyframeByteLength: keyframe.byteLength,
      keyframeSha256: payload.keyframeSha256,
      keyframeBytesBase64: keyframe.toString('base64'),
    }
  }

  if (rawPayload.compositionProfileId === 'motion_studio_native_layered_scene_v1') {
    const payload = exactObject(rawPayload, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sceneId', 'sceneStartFrame', 'sceneEndFrame', 'semanticPurpose',
      'headline', 'caption', 'layerManifestDigest', 'depthModel', 'planes',
      'panelBackground', 'panelHighlight', 'headlineColor', 'accentColor',
      'captionColor', 'horizontalSafePercent', 'verticalSafePercent',
      'captionBottomPercent', 'captionAboveMask', 'contactObjectPresent', 'maskRisk',
      'subjectMimeType', 'subjectByteLength', 'subjectSha256', 'subjectBytesBase64',
    ], 'Motion Studio layered payload')
    const dimensions = `${payload.width}x${payload.height}`
    oneOf(dimensions, PRIVATE_REVIEW_FRAMES, 'approved layered frame')
    const durationFrames = integer(payload.durationFrames, 24, 450, 'durationFrames')
    const sceneStartFrame = integer(payload.sceneStartFrame, 0, 10_000_000, 'sceneStartFrame')
    const sceneEndFrame = integer(payload.sceneEndFrame, 1, 10_000_000, 'sceneEndFrame')
    if (sceneEndFrame - sceneStartFrame !== durationFrames) {
      throw new Error('Motion Studio layered scene range must exactly match durationFrames')
    }
    const semanticPurpose = safeText(payload.semanticPurpose, 120, 'semanticPurpose')
    const headline = safeText(payload.headline, 120, 'headline')
    const caption = safeText(payload.caption, 160, 'caption')
    if (headline !== semanticPurpose || caption !== `Review · ${semanticPurpose}`) {
      throw new Error('Motion Studio layered copy diverges from scene authority')
    }
    if (
      typeof payload.layerManifestDigest !== 'string' ||
      !/^[a-f0-9]{64}$/.test(payload.layerManifestDigest)
    ) throw new Error('Motion Studio layered manifest digest is invalid')
    const expectedPlanes = [
      ['background-plane', 'background', 0, 'remotion_native', 'ambient_drift'],
      ['headline-plane', 'headline', 10, 'remotion_native', 'headline_reveal'],
      ['subject-plane', 'subject', 20, 'approved_cutout_slot', 'subject_parallax'],
      ['caption-plane', 'caption', 30, 'remotion_native', 'caption_hold'],
    ]
    if (!Array.isArray(payload.planes) || payload.planes.length !== expectedPlanes.length) {
      throw new Error('Motion Studio layered profile requires four exact semantic planes')
    }
    const planes = payload.planes.map((rawPlane, index) => {
      const plane = exactObject(
        rawPlane,
        ['planeId', 'role', 'zIndex', 'sourceKind', 'motionToken'],
        'Motion Studio layered plane',
      )
      const expected = expectedPlanes[index]
      if (
        plane.planeId !== expected[0] || plane.role !== expected[1] ||
        plane.zIndex !== expected[2] || plane.sourceKind !== expected[3] ||
        plane.motionToken !== expected[4]
      ) throw new Error('Motion Studio layered plane identity or z order is unsupported')
      return {
        planeId: expected[0],
        role: expected[1],
        zIndex: expected[2],
        sourceKind: expected[3],
        motionToken: expected[4],
      }
    })
    if (
      payload.depthModel !== 'semantic_planes_v1' || payload.panelBackground !== '#0F172A' ||
      payload.panelHighlight !== '#16213E' || payload.headlineColor !== '#E0F2FE' ||
      payload.accentColor !== '#FF4D8D' || payload.captionColor !== '#F8FAFC' ||
      payload.horizontalSafePercent !== 8 || payload.verticalSafePercent !== 8 ||
      payload.captionBottomPercent !== 9 || payload.captionAboveMask !== true ||
      payload.contactObjectPresent !== false || payload.maskRisk !== 'low_fixture_only'
    ) throw new Error('Motion Studio layered design, safety, or mask policy is unsupported')
    const subject = committedBase64(payload, 'subject', 'image/png', 100, 1024 * 1024)
    if (
      subject.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
      subject.toString('ascii', 12, 16) !== 'IHDR' ||
      subject.readUInt32BE(16) !== 128 || subject.readUInt32BE(20) !== 128 ||
      subject[24] !== 8 || subject[25] !== 6
    ) throw new Error('Motion Studio layered subject is not the approved 128x128 RGBA PNG class')
    return {
      width: integer(payload.width, 360, 640, 'width'),
      height: integer(payload.height, 360, 640, 'height'),
      fps: oneOf(payload.fps, [24, 30], 'fps'),
      durationFrames,
      compositionProfileId: 'motion_studio_native_layered_scene_v1',
      sceneId: safeIdentity(payload.sceneId, 'sceneId'),
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
      subjectMimeType: 'image/png',
      subjectByteLength: subject.byteLength,
      subjectSha256: payload.subjectSha256,
      subjectBytesBase64: subject.toString('base64'),
    }
  }

  if (rawPayload.compositionProfileId === 'motion_studio_scene_preview_v1') {
    const payload = exactObject(rawPayload, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sceneId', 'sceneStartFrame', 'sceneEndFrame', 'semanticPurpose',
      'productionMode', 'layerType', 'panelBackground', 'accentColor',
    ], 'Motion Studio scene preview payload')
    const dimensions = `${payload.width}x${payload.height}`
    oneOf(dimensions, [...PRIVATE_REVIEW_FRAMES, '720x405', '405x720'], 'approved frame')
    const durationFrames = integer(payload.durationFrames, 24, 450, 'durationFrames')
    const sceneStartFrame = integer(payload.sceneStartFrame, 0, 10_000_000, 'sceneStartFrame')
    const sceneEndFrame = integer(payload.sceneEndFrame, 1, 10_000_000, 'sceneEndFrame')
    if (sceneEndFrame - sceneStartFrame !== durationFrames) {
      throw new Error('Motion Studio scene range must exactly match durationFrames')
    }
    return {
      compositionProfileId: 'motion_studio_scene_preview_v1',
      width: integer(payload.width, 360, 720, 'width'),
      height: integer(payload.height, 360, 720, 'height'),
      fps: oneOf(payload.fps, [24, 30], 'fps'),
      durationFrames,
      sceneId: safeIdentity(payload.sceneId, 'sceneId'),
      sceneStartFrame,
      sceneEndFrame,
      semanticPurpose: safeText(payload.semanticPurpose, 240, 'semanticPurpose'),
      productionMode: oneOf(
        payload.productionMode,
        ['generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed'],
        'productionMode',
      ),
      layerType: oneOf(
        payload.layerType,
        ['image', 'source_footage', 'generated_video', 'text', 'caption', 'map', 'chart', 'mask', 'audio', 'effect'],
        'layerType',
      ),
      panelBackground: normalizedColor(payload.panelBackground, 'panelBackground'),
      accentColor: normalizedColor(payload.accentColor, 'accentColor'),
    }
  }

  if (rawPayload.compositionProfileId === 'motion_studio_prepared_script_animatic_v1') {
    const payload = exactObject(rawPayload, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'scenes', 'panelBackground', 'accentColor', 'narrationMimeType',
      'narrationByteLength', 'narrationSha256', 'narrationBytesBase64',
    ], 'Motion Studio animatic payload')
    const dimensions = `${payload.width}x${payload.height}`
    oneOf(dimensions, PRIVATE_REVIEW_FRAMES, 'approved animatic frame')
    const durationFrames = integer(payload.durationFrames, 24, 900, 'durationFrames')
    if (!Array.isArray(payload.scenes) || payload.scenes.length < 1 || payload.scenes.length > 8) {
      throw new Error('Motion Studio animatic requires one to eight scenes')
    }
    let nextFrame = 0
    const seenSceneIds = new Set()
    const scenes = payload.scenes.map((rawScene, order) => {
      const scene = exactObject(
        rawScene,
        ['order', 'sceneId', 'startFrame', 'endFrame', 'title', 'visualDescription'],
        'Motion Studio animatic scene',
      )
      const sceneId = safeIdentity(scene.sceneId, 'sceneId')
      const startFrame = integer(scene.startFrame, 0, 899, 'startFrame')
      const endFrame = integer(scene.endFrame, 1, 900, 'endFrame')
      if (
        scene.order !== order || startFrame !== nextFrame || endFrame <= startFrame ||
        endFrame > durationFrames || seenSceneIds.has(sceneId)
      ) throw new Error('Motion Studio animatic scene order and coverage are invalid')
      nextFrame = endFrame
      seenSceneIds.add(sceneId)
      return {
        order,
        sceneId,
        startFrame,
        endFrame,
        title: safeText(scene.title, 120, 'title'),
        visualDescription: safeText(scene.visualDescription, 240, 'visualDescription'),
      }
    })
    if (nextFrame !== durationFrames) {
      throw new Error('Motion Studio animatic scenes must cover the exact duration')
    }
    const narrationMimeType = oneOf(
      payload.narrationMimeType,
      ['audio/wav', 'audio/mpeg', 'audio/mp3'],
      'narrationMimeType',
    )
    const narration = committedBase64(
      payload,
      'narration',
      narrationMimeType,
      44,
      16 * 1024 * 1024,
    )
    validateAudioSignature(narration, narrationMimeType)
    return {
      compositionProfileId: 'motion_studio_prepared_script_animatic_v1',
      width: integer(payload.width, 360, 640, 'width'),
      height: integer(payload.height, 360, 640, 'height'),
      fps: oneOf(payload.fps, [24, 30], 'fps'),
      durationFrames,
      scenes,
      panelBackground: normalizedColor(payload.panelBackground, 'panelBackground'),
      accentColor: normalizedColor(payload.accentColor, 'accentColor'),
      narrationMimeType,
      narrationByteLength: narration.byteLength,
      narrationSha256: payload.narrationSha256,
      narrationBytesBase64: narration.toString('base64'),
    }
  }

  return undefined
}

function validateRequest(value) {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== PROTOCOL || request.toolId !== 'remotion' || request.operationId !== OPERATION) {
    throw new Error('request identity is unsupported')
  }
  const rawPayload = request.payload
  const captionBrollOwnerPayload =
    validateCaptionBrollOwnerRealSourceSceneGroupPayload(rawPayload)
  if (captionBrollOwnerPayload) {
    return {
      schemaVersion: PROTOCOL,
      toolId: 'remotion',
      operationId: OPERATION,
      payload: captionBrollOwnerPayload,
    }
  }
  const captionRealSourceMultiOutputPayload =
    validateCaptionRealSourceMultiOutputSceneGroupPayload(rawPayload)
  if (captionRealSourceMultiOutputPayload) {
    return {
      schemaVersion: PROTOCOL,
      toolId: 'remotion',
      operationId: OPERATION,
      payload: captionRealSourceMultiOutputPayload,
    }
  }
  const captionRealSourcePayload = validateCaptionRealSourceSceneGroupPayload(rawPayload)
  if (captionRealSourcePayload) {
    return {
      schemaVersion: PROTOCOL,
      toolId: 'remotion',
      operationId: OPERATION,
      payload: captionRealSourcePayload,
    }
  }
  const captionCreativePayload = validateCaptionCreativeSceneGroupPayload(rawPayload)
  if (captionCreativePayload) {
    return {
      schemaVersion: PROTOCOL,
      toolId: 'remotion',
      operationId: OPERATION,
      payload: captionCreativePayload,
    }
  }
  const motionStudioPayload = validateMotionStudioPayload(rawPayload)
  if (motionStudioPayload) {
    return {
      schemaVersion: PROTOCOL,
      toolId: 'remotion',
      operationId: OPERATION,
      payload: motionStudioPayload,
    }
  }
  if (rawPayload && typeof rawPayload === 'object' && isSourceSequenceProfile(rawPayload.compositionProfileId)) {
    const captionTrack = rawPayload.compositionProfileId === 'approved_source_sequence_caption_track_final_v1'
    const replaceVoice = rawPayload.audioPolicy === 'replace_with_approved_voice_tracks'
    const sourceMediaPolicyProvided = Object.hasOwn(rawPayload, 'sourceMediaPolicy')
    const deliveryMasterAuthorityProvided = Object.hasOwn(rawPayload, 'renderPurpose')
    const boundedSourceTransitions =
      rawPayload.transitionPolicy === 'approved_bounded_source_transitions_v1'
    const payload = exactObject(rawPayload, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sourceSegments', 'transitionPolicy',
      boundedSourceTransitions ? 'sourceTransitions' : 'hardCutTransitions',
      'sourceFit', 'panelBackground', 'audioPolicy',
      ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
      'captionOverlayPolicy', ...(captionTrack ? ['captionOverlayCues'] : []), 'sources',
      ...(captionTrack
        ? ['captionOverlays']
        : ['captionOverlayMimeType', 'captionOverlayByteLength', 'captionOverlaySha256', 'captionOverlayBytesBase64']),
      ...(replaceVoice ? ['voiceTracks'] : []),
      ...(deliveryMasterAuthorityProvided ? DELIVERY_MASTER_AUTHORITY_KEYS : []),
    ], 'source-sequence final composition payload')
    const dimensions = `${payload.width}x${payload.height}`
    oneOf(dimensions, [...PRIVATE_REVIEW_FRAMES, ...FOUR_K_MASTER_FRAMES], 'approved frame')
    validateDeliveryMasterAuthority(payload, dimensions, deliveryMasterAuthorityProvided)
    const durationFrames = integer(
      payload.durationFrames,
      MINIMUM_COMPOSITION_FRAMES,
      MAXIMUM_SOURCE_SEQUENCE_FRAMES,
      'durationFrames',
    )
    const fps = oneOf(payload.fps, [24, 30], 'fps')
    const sourceSegments = validateSourceSegments(payload.sourceSegments, durationFrames)
    const approvedColorIntermediate =
      payload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
    if (
      (sourceMediaPolicyProvided && !approvedColorIntermediate) ||
      (approvedColorIntermediate && (
        payload.audioPolicy !== 'replace_with_approved_voice_tracks'
      ))
    ) throw new Error('source-sequence color intermediate policy is unsupported')
    const transitionAuthority = boundedSourceTransitions
      ? {
          transitionPolicy: 'approved_bounded_source_transitions_v1',
          sourceTransitions: validateApprovedBoundedSourceTransitions(
            payload.sourceTransitions,
            sourceSegments,
            fps,
          ),
        }
      : {
          transitionPolicy: 'approved_hard_cuts_only',
          hardCutTransitions: validateApprovedHardCuts(
            payload.hardCutTransitions,
            sourceSegments,
          ),
        }
    if (!Array.isArray(payload.sources) || payload.sources.length !== sourceSegments.length) {
      throw new Error('source-sequence commitments are incomplete')
    }
    let totalSourceBytes = 0
    const sourceMimeType = approvedColorIntermediate ? 'video/x-matroska' : 'video/mp4'
    const sources = payload.sources.map((candidate, index) => {
      const source = exactObject(candidate, [
        'sourceSequenceItemId', 'sourceMimeType', 'sourceByteLength',
        'sourceSha256', 'sourceBytesBase64',
      ], `source commitment ${index + 1}`)
      if (source.sourceSequenceItemId !== sourceSegments[index].sourceSequenceItemId) {
        throw new Error('source commitment order diverges from approved source segments')
      }
      const bytes = committedBase64(source, 'source', sourceMimeType, 64, 16 * 1024 * 1024)
      if (!approvedSourceSignature(bytes, sourceMimeType)) {
        throw new Error('source-sequence dependency signature is invalid')
      }
      totalSourceBytes += bytes.byteLength
      return { ...source, sourceBytesBase64: bytes.toString('base64') }
    })
    if (totalSourceBytes > 20 * 1024 * 1024) throw new Error('source sequence exceeds combined byte ceiling')
    const captionOverlayCues = captionTrack
      ? validateCaptionOverlayCues(payload.captionOverlayCues, durationFrames)
      : undefined
    const captionOverlays = captionTrack
      ? validateCaptionOverlayCommitments(payload.captionOverlays, captionOverlayCues)
      : undefined
    const overlay = captionTrack
      ? undefined
      : committedBase64(payload, 'captionOverlay', 'image/png', 1024, 8 * 1024 * 1024)
    if (overlay && overlay.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw new Error('source-sequence caption overlay signature is invalid')
    }
    const voiceTracks = replaceVoice
      ? validateVoiceTrackCommitments(
          payload.voiceTracks,
          sourceSegments.map((segment) => ({
            sourceSequenceItemId: segment.sourceSequenceItemId,
            durationFrames: segment.timelineEndFrameExclusive - segment.timelineStartFrame,
          })),
          fps,
        )
      : undefined
    if (
      ![
        'approved_hard_cuts_only',
        'approved_bounded_source_transitions_v1',
      ].includes(payload.transitionPolicy) ||
      payload.sourceFit !== 'contain' ||
      !['preserve_source_sequence', 'replace_with_approved_voice_tracks'].includes(payload.audioPolicy) ||
      payload.captionOverlayPolicy !== (
        captionTrack ? 'approved_timed_full_frame_rgba_track' : 'approved_full_frame_rgba'
      )
    ) throw new Error('source-sequence composition policy is unsupported')
    const color = (value, label) => {
      if (typeof value !== 'string' || !/^#[A-Fa-f0-9]{6}$/.test(value)) throw new Error(`${label} is invalid`)
      return value.toUpperCase()
    }
    return {
      schemaVersion: PROTOCOL, toolId: 'remotion', operationId: OPERATION,
      payload: {
        ...payload,
        width: integer(payload.width, 360, 3840, 'width'), height: integer(payload.height, 360, 3840, 'height'),
        fps, durationFrames, sourceSegments,
        ...transitionAuthority,
        sources,
        ...(approvedColorIntermediate
          ? { sourceMediaPolicy: 'approved_professional_color_intermediate_v1' }
          : {}),
        panelBackground: color(payload.panelBackground, 'panelBackground'),
        ...(captionTrack
          ? { captionOverlayCues, captionOverlays }
          : { captionOverlayBytesBase64: overlay.toString('base64') }),
        ...(voiceTracks ? { voiceTracks } : {}),
      },
    }
  }
  if (
    rawPayload && typeof rawPayload === 'object' &&
    ['approved_source_caption_final_v1', 'approved_source_caption_track_final_v1']
      .includes(rawPayload.compositionProfileId)
  ) {
    const captionTrack = rawPayload.compositionProfileId === 'approved_source_caption_track_final_v1'
    const replaceVoice = rawPayload.audioPolicy === 'replace_with_approved_voice_tracks'
    const sourceMediaPolicyProvided = Object.hasOwn(rawPayload, 'sourceMediaPolicy')
    const brollPreviewLayerProvided = Object.hasOwn(rawPayload, 'brollPreviewLayer')
    const deliveryMasterAuthorityProvided = Object.hasOwn(rawPayload, 'renderPurpose')
    const payload = exactObject(rawPayload, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit',
      'panelBackground', 'audioPolicy', 'captionOverlayPolicy',
      ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
      ...(brollPreviewLayerProvided ? ['brollPreviewLayer'] : []),
      'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
      ...(captionTrack
        ? ['captionOverlayCues', 'captionOverlays']
        : ['captionOverlayMimeType', 'captionOverlayByteLength', 'captionOverlaySha256', 'captionOverlayBytesBase64']),
      ...(replaceVoice ? ['voiceTracks'] : []),
      ...(deliveryMasterAuthorityProvided ? DELIVERY_MASTER_AUTHORITY_KEYS : []),
    ], 'final composition payload')
    const dimensions = `${payload.width}x${payload.height}`
    oneOf(dimensions, [...PRIVATE_REVIEW_FRAMES, ...FOUR_K_MASTER_FRAMES], 'approved frame')
    validateDeliveryMasterAuthority(payload, dimensions, deliveryMasterAuthorityProvided)
    const approvedColorIntermediate =
      payload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
    const approvedBrollPreviewProxy =
      payload.sourceMediaPolicy === 'approved_b_roll_qa_normalized_preview_proxy_v1'
    const approvedMatroskaIntermediate =
      approvedColorIntermediate || approvedBrollPreviewProxy
    const approvedBrollPreviewLayer = approvedBrollPreviewProxy
      ? brollPreviewLayer(payload.brollPreviewLayer)
      : undefined
    if (
      (sourceMediaPolicyProvided && !approvedMatroskaIntermediate) ||
      brollPreviewLayerProvided !== approvedBrollPreviewProxy
    ) {
      throw new Error('source media policy is unsupported')
    }
    const sourceMimeType = approvedMatroskaIntermediate ? 'video/x-matroska' : 'video/mp4'
    const source = committedBase64(
      payload,
      'source',
      sourceMimeType,
      64,
      16 * 1024 * 1024,
    )
    const durationFrames = integer(
      payload.durationFrames,
      MINIMUM_COMPOSITION_FRAMES,
      MAXIMUM_SOURCE_SEGMENT_FRAMES,
      'durationFrames',
    )
    const fps = oneOf(payload.fps, [24, 30], 'fps')
    const captionOverlayCues = captionTrack
      ? validateCaptionOverlayCues(payload.captionOverlayCues, durationFrames)
      : undefined
    const captionOverlays = captionTrack
      ? validateCaptionOverlayCommitments(payload.captionOverlays, captionOverlayCues)
      : undefined
    const overlay = captionTrack
      ? undefined
      : committedBase64(payload, 'captionOverlay', 'image/png', 1024, 8 * 1024 * 1024)
    if (
      !approvedSourceSignature(source, sourceMimeType) ||
      (overlay && overlay.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
    ) throw new Error('final composition dependency signature is invalid')
    const voiceTracks = replaceVoice
      ? validateVoiceTrackCommitments(payload.voiceTracks, [{
          sourceSequenceItemId: undefined,
          durationFrames,
        }], fps)
      : undefined
    if (
      payload.sourceFit !== 'contain' ||
      !['preserve_source', 'replace_with_approved_voice_tracks'].includes(payload.audioPolicy) ||
      payload.captionOverlayPolicy !== (
        captionTrack ? 'approved_timed_full_frame_rgba_track' : 'approved_full_frame_rgba'
      )
    ) throw new Error('final composition policy is unsupported')
    const sourceStartFrame = integer(payload.sourceStartFrame, 0, 100_000_000, 'sourceStartFrame')
    const sourceEndFrameExclusive = integer(
      payload.sourceEndFrameExclusive,
      1,
      100_000_000,
      'sourceEndFrameExclusive',
    )
    if (sourceEndFrameExclusive - sourceStartFrame !== durationFrames) {
      throw new Error('final composition source trim does not match approved duration')
    }
    if (
      approvedColorIntermediate &&
      (
        payload.audioPolicy !== 'replace_with_approved_voice_tracks'
      )
    ) throw new Error('professional color intermediate policy is invalid')
    const color = (value, label) => {
      if (typeof value !== 'string' || !/^#[A-Fa-f0-9]{6}$/.test(value)) throw new Error(`${label} is invalid`)
      return value.toUpperCase()
    }
    return {
      schemaVersion: PROTOCOL, toolId: 'remotion', operationId: OPERATION,
      payload: {
        ...payload,
        width: integer(payload.width, 360, 3840, 'width'), height: integer(payload.height, 360, 3840, 'height'),
        fps, durationFrames,
        ...(approvedBrollPreviewLayer
          ? { brollPreviewLayer: approvedBrollPreviewLayer }
          : {}),
        sourceStartFrame, sourceEndFrameExclusive,
        panelBackground: color(payload.panelBackground, 'panelBackground'),
        sourceBytesBase64: source.toString('base64'),
        ...(captionTrack
          ? { captionOverlayCues, captionOverlays }
          : { captionOverlayBytesBase64: overlay.toString('base64') }),
        ...(voiceTracks ? { voiceTracks } : {}),
      },
    }
  }
  const payload = exactObject(rawPayload, [
    'width', 'height', 'fps', 'durationFrames', 'frameTemplateId',
    'panelBackground', 'accentColor', 'title', 'subtitle', 'caption',
  ], 'preview payload')
  const dimensions = `${payload.width}x${payload.height}`
  oneOf(dimensions, PRIVATE_REVIEW_FRAMES, 'approved frame')
  const color = (value, label) => {
    if (typeof value !== 'string' || !/^#[A-Fa-f0-9]{6}$/.test(value)) throw new Error(`${label} is invalid`)
    return value.toUpperCase()
  }
  return {
    schemaVersion: PROTOCOL,
    toolId: 'remotion',
    operationId: OPERATION,
    payload: {
      width: integer(payload.width, 360, 640, 'width'),
      height: integer(payload.height, 360, 640, 'height'),
      fps: oneOf(payload.fps, [24, 30], 'fps'),
      durationFrames: integer(payload.durationFrames, 24, 90, 'durationFrames'),
      frameTemplateId: oneOf(payload.frameTemplateId, ['approved_full_panel_v1', 'approved_lower_panel_v1'], 'frameTemplateId'),
      panelBackground: color(payload.panelBackground, 'panelBackground'),
      accentColor: color(payload.accentColor, 'accentColor'),
      title: safeText(payload.title, 120, 'title'),
      subtitle: safeText(payload.subtitle, 180, 'subtitle'),
      caption: safeText(payload.caption, 140, 'caption'),
    },
  }
}

function validateStreamingVoicePlans(value, expected, fps) {
  if (!Array.isArray(value) || value.length !== expected.length || expected.length < 1) {
    throw new Error('streaming voice plans do not match approved sources')
  }
  const sourceIds = new Set()
  const outputKeys = new Set()
  return value.map((candidate, index) => {
    const sourceSliceProvided =
      candidate && typeof candidate === 'object' &&
      (
        Object.hasOwn(candidate, 'sourceStartFrame') ||
        Object.hasOwn(candidate, 'sourceEndFrameExclusive')
      )
    const track = exactObject(candidate, [
      'sourceSequenceItemId', 'outputKey', 'durationFrames',
      ...(sourceSliceProvided
        ? ['sourceStartFrame', 'sourceEndFrameExclusive']
        : []),
    ], `streaming voice plan ${index + 1}`)
    const sourceSequenceItemId = safeIdentity(
      track.sourceSequenceItemId,
      'streaming voice sourceSequenceItemId',
    )
    const outputKey = safeIdentity(track.outputKey, 'streaming voice outputKey')
    const durationFrames = integer(
      track.durationFrames,
      1,
      sourceSliceProvided
        ? MAXIMUM_SOURCE_SLICE_LONG_FORM_FRAMES
        : MAXIMUM_SOURCE_SEGMENT_FRAMES,
      'streaming voice durationFrames',
    )
    const sourceStartFrame = sourceSliceProvided
      ? integer(
          track.sourceStartFrame,
          0,
          MAXIMUM_SOURCE_SLICE_LONG_FORM_FRAMES - 1,
          'streaming voice sourceStartFrame',
        )
      : undefined
    const sourceEndFrameExclusive = sourceSliceProvided
      ? integer(
          track.sourceEndFrameExclusive,
          1,
          MAXIMUM_SOURCE_SLICE_LONG_FORM_FRAMES,
          'streaming voice sourceEndFrameExclusive',
        )
      : undefined
    if (
      sourceIds.has(sourceSequenceItemId) || outputKeys.has(outputKey) ||
      (expected[index].sourceSequenceItemId !== undefined &&
        sourceSequenceItemId !== expected[index].sourceSequenceItemId) ||
      (
        sourceSliceProvided
          ? (
              sourceEndFrameExclusive <= sourceStartFrame ||
              sourceEndFrameExclusive > durationFrames ||
              sourceEndFrameExclusive - sourceStartFrame !==
                expected[index].durationFrames
            )
          : durationFrames !== expected[index].durationFrames
      ) ||
      !Number.isInteger(durationFrames * (48_000 / fps))
    ) throw new Error('streaming voice plan identity, order, or duration is invalid')
    sourceIds.add(sourceSequenceItemId)
    outputKeys.add(outputKey)
    return {
      sourceSequenceItemId,
      outputKey,
      durationFrames,
      ...(sourceSliceProvided
        ? { sourceStartFrame, sourceEndFrameExclusive }
        : {}),
    }
  })
}

function validateStreamingSupplementalAudioPlans(value, durationFrames) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16) {
    throw new Error('streaming supplemental audio requires one to sixteen tracks')
  }
  const outputKeys = new Set()
  const attachmentIds = new Set()
  const markerIds = new Set()
  let previousStartFrame = -1
  let previousMarkerId = ''
  let previousAttachmentId = ''
  return value.map((candidate, index) => {
    const track = exactObject(candidate, [
      'outputKey', 'attachmentId', 'markerId', 'markerType',
      'startFrame', 'endFrameExclusive', 'fillPolicy', 'mixProfileId',
    ], `streaming supplemental audio plan ${index + 1}`)
    const outputKey = safeIdentity(track.outputKey, 'supplemental audio outputKey')
    const attachmentId = safeIdentity(
      track.attachmentId,
      'supplemental audio attachmentId',
    )
    const markerId = safeIdentity(track.markerId, 'supplemental audio markerId')
    const startFrame = integer(
      track.startFrame,
      0,
      durationFrames - 1,
      'supplemental audio startFrame',
    )
    const endFrameExclusive = integer(
      track.endFrameExclusive,
      1,
      durationFrames,
      'supplemental audio endFrameExclusive',
    )
    const musicPolicy = track.markerType === 'music' &&
      track.fillPolicy === 'loop_or_trim_to_window' &&
      track.mixProfileId === 'speech_safe_uploaded_music_bed_v1'
    const sfxPolicy = track.markerType === 'sfx' &&
      track.fillPolicy === 'trim_without_loop' &&
      track.mixProfileId === 'narration_protected_uploaded_sfx_v1'
    if (
      endFrameExclusive <= startFrame ||
      (!musicPolicy && !sfxPolicy) ||
      outputKeys.has(outputKey) ||
      attachmentIds.has(attachmentId) ||
      markerIds.has(markerId) ||
      startFrame < previousStartFrame ||
      (
        startFrame === previousStartFrame &&
        (
          markerId.localeCompare(previousMarkerId) < 0 ||
          (
            markerId === previousMarkerId &&
            attachmentId.localeCompare(previousAttachmentId) <= 0
          )
        )
      )
    ) {
      throw new Error(
        'streaming supplemental audio identity, order, placement, or mix policy is invalid',
      )
    }
    outputKeys.add(outputKey)
    attachmentIds.add(attachmentId)
    markerIds.add(markerId)
    previousStartFrame = startFrame
    previousMarkerId = markerId
    previousAttachmentId = attachmentId
    return {
      outputKey,
      attachmentId,
      markerId,
      markerType: track.markerType,
      startFrame,
      endFrameExclusive,
      fillPolicy: track.fillPolicy,
      mixProfileId: track.mixProfileId,
    }
  })
}

function validateStreamingLivingFrameOverlayPlans(policy, value, durationFrames) {
  if (
    policy !== 'approved_rgba_over_source_below_captions_v1' ||
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 16
  ) {
    throw new Error('streaming Living Frame overlays are unsupported')
  }
  const sceneIds = new Set()
  const layerIds = new Set()
  const manifestOutputKeys = new Set()
  const componentOutputKeys = new Set()
  let previousStartFrame = -1
  let previousLayerId = ''
  return value.map((candidate, index) => {
    const layer = exactObject(candidate, [
      'sceneId', 'layerId', 'manifestOutputKey', 'componentOutputKey',
      'startFrame', 'endFrameExclusive', 'fit', 'opacity',
    ], `streaming Living Frame overlay ${index + 1}`)
    const sceneId = safeIdentity(layer.sceneId, 'Living Frame sceneId')
    const layerId = safeIdentity(layer.layerId, 'Living Frame layerId')
    const manifestOutputKey = safeIdentity(
      layer.manifestOutputKey,
      'Living Frame manifestOutputKey',
    )
    const componentOutputKey = safeIdentity(
      layer.componentOutputKey,
      'Living Frame componentOutputKey',
    )
    const startFrame = integer(
      layer.startFrame,
      0,
      durationFrames - 1,
      'Living Frame startFrame',
    )
    const endFrameExclusive = integer(
      layer.endFrameExclusive,
      1,
      durationFrames,
      'Living Frame endFrameExclusive',
    )
    if (
      endFrameExclusive <= startFrame ||
      layer.fit !== 'fill' ||
      layer.opacity !== 1 ||
      sceneIds.has(sceneId) ||
      layerIds.has(layerId) ||
      manifestOutputKeys.has(manifestOutputKey) ||
      componentOutputKeys.has(componentOutputKey) ||
      startFrame < previousStartFrame ||
      (
        startFrame === previousStartFrame &&
        layerId.localeCompare(previousLayerId) <= 0
      )
    ) {
      throw new Error(
        'streaming Living Frame overlays must be exact, unique, and canonically ordered',
      )
    }
    sceneIds.add(sceneId)
    layerIds.add(layerId)
    manifestOutputKeys.add(manifestOutputKey)
    componentOutputKeys.add(componentOutputKey)
    previousStartFrame = startFrame
    previousLayerId = layerId
    return {
      sceneId,
      layerId,
      manifestOutputKey,
      componentOutputKey,
      startFrame,
      endFrameExclusive,
      fit: 'fill',
      opacity: 1,
    }
  })
}

function validateStreamingControlledVisualOverlayPlans(
  policy,
  value,
  width,
  height,
  durationFrames,
) {
  if (
    policy !== 'approved_structured_svg_below_captions_v1' ||
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 4
  ) throw new Error('streaming controlled visual overlays are unsupported')
  const outputKeys = new Set()
  const rendererLayerIds = new Set()
  let previousStartFrame = -1
  let previousRendererLayerId = ''
  return value.map((candidate, index) => {
    const layer = exactObject(candidate, [
      'outputKey', 'rendererLayerId', 'toolId', 'startFrame',
      'endFrameExclusive', 'x', 'y', 'width', 'height', 'fit', 'opacity',
      'sourceConfidence', 'safeWording',
    ], `streaming controlled visual overlay ${index + 1}`)
    const outputKey = safeIdentity(
      layer.outputKey,
      'controlled visual outputKey',
    )
    const rendererLayerId = safeIdentity(
      layer.rendererLayerId,
      'controlled visual rendererLayerId',
    )
    const toolId = oneOf(
      layer.toolId,
      ['d3', 'echarts'],
      'controlled visual toolId',
    )
    const startFrame = integer(
      layer.startFrame,
      0,
      durationFrames - 1,
      'controlled visual startFrame',
    )
    const endFrameExclusive = integer(
      layer.endFrameExclusive,
      1,
      durationFrames,
      'controlled visual endFrameExclusive',
    )
    const x = integer(layer.x, 0, width - 1, 'controlled visual x')
    const y = integer(layer.y, 0, height - 1, 'controlled visual y')
    const overlayWidth = integer(
      layer.width,
      1,
      width,
      'controlled visual width',
    )
    const overlayHeight = integer(
      layer.height,
      1,
      height,
      'controlled visual height',
    )
    const sourceConfidence = oneOf(
      layer.sourceConfidence,
      ['verified', 'mock', 'fictional'],
      'controlled visual sourceConfidence',
    )
    const safeWording = oneOf(
      layer.safeWording,
      ['verified data', 'mock demo data', 'fictional story data'],
      'controlled visual safeWording',
    )
    const expectedSafeWording = sourceConfidence === 'verified'
      ? 'verified data'
      : sourceConfidence === 'mock'
        ? 'mock demo data'
        : 'fictional story data'
    if (
      endFrameExclusive <= startFrame ||
      x + overlayWidth > width ||
      y + overlayHeight > height ||
      layer.fit !== 'contain' ||
      layer.opacity !== 1 ||
      safeWording !== expectedSafeWording ||
      outputKeys.has(outputKey) ||
      rendererLayerIds.has(rendererLayerId) ||
      startFrame < previousStartFrame ||
      (
        startFrame === previousStartFrame &&
        rendererLayerId.localeCompare(previousRendererLayerId) <= 0
      )
    ) {
      throw new Error(
        'streaming controlled visual overlays must be exact, safe, and canonically ordered',
      )
    }
    outputKeys.add(outputKey)
    rendererLayerIds.add(rendererLayerId)
    previousStartFrame = startFrame
    previousRendererLayerId = rendererLayerId
    return {
      outputKey,
      rendererLayerId,
      toolId,
      startFrame,
      endFrameExclusive,
      x,
      y,
      width: overlayWidth,
      height: overlayHeight,
      fit: 'contain',
      opacity: 1,
      sourceConfidence,
      safeWording,
    }
  })
}

function validateStreamingPlanningPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('streaming planning payload must be an object')
  }
  const sourceSequence = isSourceSequenceProfile(value.compositionProfileId)
  const captionTrack = isCaptionTrackProfile(value.compositionProfileId)
  const replaceVoice = value.audioPolicy === 'replace_with_approved_voice_tracks'
  const sourceMediaPolicyProvided = Object.hasOwn(value, 'sourceMediaPolicy')
  const brollPreviewLayerProvided = Object.hasOwn(value, 'brollPreviewLayer')
  const supplementalAudioProvided =
    Object.hasOwn(value, 'supplementalAudioPolicy') ||
    Object.hasOwn(value, 'supplementalAudioTracks')
  const livingFrameOverlaysProvided =
    Object.hasOwn(value, 'livingFrameOverlayPolicy') ||
    Object.hasOwn(value, 'livingFrameOverlayLayers')
  const controlledVisualOverlaysProvided =
    Object.hasOwn(value, 'controlledVisualOverlayPolicy') ||
    Object.hasOwn(value, 'controlledVisualOverlayLayers')
  if (
    Object.hasOwn(value, 'supplementalAudioPolicy') !==
    Object.hasOwn(value, 'supplementalAudioTracks')
  ) {
    throw new Error('streaming supplemental audio policy and tracks must be paired')
  }
  if (
    Object.hasOwn(value, 'livingFrameOverlayPolicy') !==
    Object.hasOwn(value, 'livingFrameOverlayLayers')
  ) {
    throw new Error('streaming Living Frame overlay policy and layers must be paired')
  }
  if (
    Object.hasOwn(value, 'controlledVisualOverlayPolicy') !==
    Object.hasOwn(value, 'controlledVisualOverlayLayers')
  ) {
    throw new Error(
      'streaming controlled visual overlay policy and layers must be paired',
    )
  }
  const deliveryMasterAuthorityProvided = Object.hasOwn(value, 'renderPurpose')
  if (sourceSequence) {
    const boundedSourceTransitions =
      value.transitionPolicy === 'approved_bounded_source_transitions_v1'
    const payload = exactObject(value, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sourceSegments', 'transitionPolicy',
      boundedSourceTransitions ? 'sourceTransitions' : 'hardCutTransitions',
      'sourceFit', 'panelBackground', 'audioPolicy',
      ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
      'captionOverlayPolicy', ...(captionTrack ? ['captionOverlayCues'] : []),
      ...(replaceVoice ? ['voiceTracks'] : []),
      ...(supplementalAudioProvided
        ? ['supplementalAudioPolicy', 'supplementalAudioTracks']
        : []),
      ...(livingFrameOverlaysProvided
        ? ['livingFrameOverlayPolicy', 'livingFrameOverlayLayers']
        : []),
      ...(controlledVisualOverlaysProvided
        ? ['controlledVisualOverlayPolicy', 'controlledVisualOverlayLayers']
        : []),
      ...(deliveryMasterAuthorityProvided ? DELIVERY_MASTER_AUTHORITY_KEYS : []),
    ], 'streaming source-sequence planning payload')
    const dimensions = `${payload.width}x${payload.height}`
    oneOf(dimensions, [...PRIVATE_REVIEW_FRAMES, ...FOUR_K_MASTER_FRAMES], 'approved frame')
    validateDeliveryMasterAuthority(payload, dimensions, deliveryMasterAuthorityProvided)
    const durationFrames = integer(
      payload.durationFrames,
      MINIMUM_COMPOSITION_FRAMES,
      MAXIMUM_SOURCE_SEQUENCE_FRAMES,
      'durationFrames',
    )
    const fps = oneOf(payload.fps, [24, 30], 'fps')
    const sourceSegments = validateSourceSegments(payload.sourceSegments, durationFrames)
    const transitionAuthority = boundedSourceTransitions
      ? {
          transitionPolicy: 'approved_bounded_source_transitions_v1',
          sourceTransitions: validateApprovedBoundedSourceTransitions(
            payload.sourceTransitions,
            sourceSegments,
            fps,
          ),
        }
      : {
          transitionPolicy: 'approved_hard_cuts_only',
          hardCutTransitions: validateApprovedHardCuts(
            payload.hardCutTransitions,
            sourceSegments,
          ),
        }
    const approvedColorIntermediate =
      payload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
    if (
      (sourceMediaPolicyProvided && !approvedColorIntermediate) ||
      (approvedColorIntermediate && (
        payload.audioPolicy !== 'replace_with_approved_voice_tracks'
      )) ||
      ![
        'approved_hard_cuts_only',
        'approved_bounded_source_transitions_v1',
      ].includes(payload.transitionPolicy) ||
      payload.sourceFit !== 'contain' ||
      !['preserve_source_sequence', 'replace_with_approved_voice_tracks'].includes(payload.audioPolicy) ||
      payload.captionOverlayPolicy !== (
        captionTrack ? 'approved_timed_full_frame_rgba_track' : 'approved_full_frame_rgba'
      )
    ) throw new Error('streaming source-sequence composition policy is unsupported')
    const voiceTracks = replaceVoice
      ? validateStreamingVoicePlans(
          payload.voiceTracks,
          sourceSegments.map((segment) => ({
            sourceSequenceItemId: segment.sourceSequenceItemId,
            durationFrames: segment.timelineEndFrameExclusive - segment.timelineStartFrame,
          })),
          fps,
        )
      : undefined
    const supplementalAudioTracks = supplementalAudioProvided
      ? validateStreamingSupplementalAudioPlans(
          payload.supplementalAudioTracks,
          durationFrames,
        )
      : undefined
    const livingFrameOverlayLayers = livingFrameOverlaysProvided
      ? validateStreamingLivingFrameOverlayPlans(
          payload.livingFrameOverlayPolicy,
          payload.livingFrameOverlayLayers,
          durationFrames,
        )
      : undefined
    const controlledVisualOverlayLayers = controlledVisualOverlaysProvided
      ? validateStreamingControlledVisualOverlayPlans(
          payload.controlledVisualOverlayPolicy,
          payload.controlledVisualOverlayLayers,
          payload.width,
          payload.height,
          durationFrames,
        )
      : undefined
    if (
      supplementalAudioProvided &&
      payload.supplementalAudioPolicy !== 'approved_edit_brief_audio_tracks_v1'
    ) {
      throw new Error('streaming supplemental audio policy is unsupported')
    }
    return {
      ...payload,
      width: integer(payload.width, 360, 3840, 'width'),
      height: integer(payload.height, 360, 3840, 'height'),
      fps,
      durationFrames,
      sourceSegments,
      ...transitionAuthority,
      panelBackground: normalizedColor(payload.panelBackground, 'panelBackground'),
      ...(captionTrack
        ? { captionOverlayCues: validateCaptionOverlayCues(payload.captionOverlayCues, durationFrames) }
        : {}),
      ...(voiceTracks ? { voiceTracks } : {}),
      ...(supplementalAudioTracks
        ? {
            supplementalAudioPolicy: 'approved_edit_brief_audio_tracks_v1',
            supplementalAudioTracks,
          }
        : {}),
      ...(livingFrameOverlayLayers
        ? {
            livingFrameOverlayPolicy:
              'approved_rgba_over_source_below_captions_v1',
            livingFrameOverlayLayers,
          }
        : {}),
      ...(controlledVisualOverlayLayers
        ? {
            controlledVisualOverlayPolicy:
              'approved_structured_svg_below_captions_v1',
            controlledVisualOverlayLayers,
          }
        : {}),
    }
  }

  const payload = exactObject(value, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit',
    'panelBackground', 'audioPolicy', 'captionOverlayPolicy',
    ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
    ...(brollPreviewLayerProvided ? ['brollPreviewLayer'] : []),
    ...(captionTrack ? ['captionOverlayCues'] : []),
    ...(replaceVoice ? ['voiceTracks'] : []),
    ...(supplementalAudioProvided
      ? ['supplementalAudioPolicy', 'supplementalAudioTracks']
      : []),
    ...(livingFrameOverlaysProvided
      ? ['livingFrameOverlayPolicy', 'livingFrameOverlayLayers']
      : []),
    ...(controlledVisualOverlaysProvided
      ? ['controlledVisualOverlayPolicy', 'controlledVisualOverlayLayers']
      : []),
    ...(deliveryMasterAuthorityProvided ? DELIVERY_MASTER_AUTHORITY_KEYS : []),
  ], 'streaming single-source planning payload')
  if (!['approved_source_caption_final_v1', 'approved_source_caption_track_final_v1']
    .includes(payload.compositionProfileId)) {
    throw new Error('streaming final composition profile is unsupported')
  }
  const dimensions = `${payload.width}x${payload.height}`
  oneOf(dimensions, [...PRIVATE_REVIEW_FRAMES, ...FOUR_K_MASTER_FRAMES], 'approved frame')
  validateDeliveryMasterAuthority(payload, dimensions, deliveryMasterAuthorityProvided)
  const durationFrames = integer(
    payload.durationFrames,
    MINIMUM_COMPOSITION_FRAMES,
    MAXIMUM_SOURCE_SEGMENT_FRAMES,
    'durationFrames',
  )
  const fps = oneOf(payload.fps, [24, 30], 'fps')
  const sourceStartFrame = integer(payload.sourceStartFrame, 0, 100_000_000, 'sourceStartFrame')
  const sourceEndFrameExclusive = integer(
    payload.sourceEndFrameExclusive,
    1,
    100_000_000,
    'sourceEndFrameExclusive',
  )
  const approvedColorIntermediate =
    payload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
  const approvedBrollPreviewProxy =
    payload.sourceMediaPolicy === 'approved_b_roll_qa_normalized_preview_proxy_v1'
  const approvedMatroskaIntermediate =
    approvedColorIntermediate || approvedBrollPreviewProxy
  const approvedBrollPreviewLayer = approvedBrollPreviewProxy
    ? brollPreviewLayer(payload.brollPreviewLayer)
    : undefined
  if (
    sourceEndFrameExclusive - sourceStartFrame !== durationFrames ||
    payload.sourceFit !== 'contain' ||
    !['preserve_source', 'replace_with_approved_voice_tracks'].includes(payload.audioPolicy) ||
    payload.captionOverlayPolicy !== (
      captionTrack ? 'approved_timed_full_frame_rgba_track' : 'approved_full_frame_rgba'
    ) ||
    (sourceMediaPolicyProvided && !approvedMatroskaIntermediate) ||
    brollPreviewLayerProvided !== approvedBrollPreviewProxy ||
    (approvedColorIntermediate && (
      payload.audioPolicy !== 'replace_with_approved_voice_tracks'
    ))
  ) throw new Error('streaming single-source composition policy is unsupported')
  const voiceTracks = replaceVoice
    ? validateStreamingVoicePlans(payload.voiceTracks, [{
        sourceSequenceItemId: undefined,
        durationFrames,
      }], fps)
    : undefined
  const supplementalAudioTracks = supplementalAudioProvided
    ? validateStreamingSupplementalAudioPlans(
        payload.supplementalAudioTracks,
        durationFrames,
      )
    : undefined
  const livingFrameOverlayLayers = livingFrameOverlaysProvided
    ? validateStreamingLivingFrameOverlayPlans(
        payload.livingFrameOverlayPolicy,
        payload.livingFrameOverlayLayers,
        durationFrames,
      )
    : undefined
  const controlledVisualOverlayLayers = controlledVisualOverlaysProvided
    ? validateStreamingControlledVisualOverlayPlans(
        payload.controlledVisualOverlayPolicy,
        payload.controlledVisualOverlayLayers,
        payload.width,
        payload.height,
        durationFrames,
      )
    : undefined
  if (
    supplementalAudioProvided &&
    payload.supplementalAudioPolicy !== 'approved_edit_brief_audio_tracks_v1'
  ) {
    throw new Error('streaming supplemental audio policy is unsupported')
  }
  return {
    ...payload,
    width: integer(payload.width, 360, 3840, 'width'),
    height: integer(payload.height, 360, 3840, 'height'),
    fps,
    durationFrames,
    sourceStartFrame,
    sourceEndFrameExclusive,
    ...(approvedBrollPreviewLayer
      ? { brollPreviewLayer: approvedBrollPreviewLayer }
      : {}),
    panelBackground: normalizedColor(payload.panelBackground, 'panelBackground'),
    ...(captionTrack
      ? { captionOverlayCues: validateCaptionOverlayCues(payload.captionOverlayCues, durationFrames) }
      : {}),
    ...(voiceTracks ? { voiceTracks } : {}),
    ...(supplementalAudioTracks
      ? {
          supplementalAudioPolicy: 'approved_edit_brief_audio_tracks_v1',
          supplementalAudioTracks,
        }
      : {}),
    ...(livingFrameOverlayLayers
      ? {
          livingFrameOverlayPolicy:
            'approved_rgba_over_source_below_captions_v1',
          livingFrameOverlayLayers,
        }
      : {}),
    ...(controlledVisualOverlayLayers
      ? {
          controlledVisualOverlayPolicy:
            'approved_structured_svg_below_captions_v1',
          controlledVisualOverlayLayers,
        }
      : {}),
  }
}

function normalizedColor(value, label) {
  if (typeof value !== 'string' || !/^#[A-Fa-f0-9]{6}$/.test(value)) {
    throw new Error(`${label} is invalid`)
  }
  return value.toUpperCase()
}

function validateStreamingInputCommitment(value, keys, mimeType, minimumBytes, maximumBytes, label) {
  const commitment = exactObject(value, keys, label)
  const inputId = safeIdentity(commitment.inputId, `${label} inputId`)
  const byteLength = integer(commitment.byteLength, minimumBytes, maximumBytes, `${label} byteLength`)
  if (commitment.mimeType !== mimeType || typeof commitment.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(commitment.sha256)) {
    throw new Error(`${label} commitment is invalid`)
  }
  return { inputId, mimeType, byteLength, sha256: commitment.sha256 }
}

function validateStreamingManifest(value) {
  const request = exactObject(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'streaming request')
  if (
    request.schemaVersion !== STREAMING_PROTOCOL || request.toolId !== 'remotion' ||
    request.operationId !== OPERATION || request.inputMode !== STREAMING_INPUT_MODE
  ) throw new Error('streaming request identity is unsupported')
  const planning = validateStreamingPlanningPayload(request.payload)
  const sourceSequence = isSourceSequenceProfile(planning.compositionProfileId)
  const captionTrack = isCaptionTrackProfile(planning.compositionProfileId)
  const replaceVoice = planning.audioPolicy === 'replace_with_approved_voice_tracks'
  const inputs = exactObject(request.inputs, [
    'sources', 'livingFrameOverlays', 'controlledVisualOverlays',
    'captionOverlays', 'voiceTracks', 'supplementalAudioTracks',
  ], 'streaming inputs')
  if (!Array.isArray(inputs.sources) ||
      !Array.isArray(inputs.livingFrameOverlays) ||
      !Array.isArray(inputs.controlledVisualOverlays) ||
      !Array.isArray(inputs.captionOverlays) ||
      !Array.isArray(inputs.voiceTracks) ||
      !Array.isArray(inputs.supplementalAudioTracks)) {
    throw new Error('streaming input commitments must be arrays')
  }
  const expectedSourceCount = sourceSequence ? planning.sourceSegments.length : 1
  if (inputs.sources.length !== expectedSourceCount) {
    throw new Error('streaming source count does not match approved planning')
  }
  const sourceMimeType = (
    sourceSequence
      ? planning.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
      : planning.sourceMediaPolicy !== undefined
  )
    ? 'video/x-matroska'
    : 'video/mp4'
  const sources = inputs.sources.map((candidate, index) => {
    const source = validateStreamingInputCommitment(
      candidate,
      sourceSequence
        ? ['inputId', 'sourceSequenceItemId', 'mimeType', 'byteLength', 'sha256']
        : ['inputId', 'mimeType', 'byteLength', 'sha256'],
      sourceMimeType,
      64,
      MAXIMUM_STREAMING_SOURCE_BYTES,
      `streaming source ${index + 1}`,
    )
    const sourceSequenceItemId = sourceSequence
      ? safeIdentity(candidate.sourceSequenceItemId, `streaming source ${index + 1} sequence identity`)
      : undefined
    if (sourceSequence && sourceSequenceItemId !== planning.sourceSegments[index].sourceSequenceItemId) {
      throw new Error('streaming source order diverges from approved planning')
    }
    return { ...source, ...(sourceSequence ? { sourceSequenceItemId } : {}) }
  })
  const combinedSourceBytes = sources.reduce((total, source) => total + source.byteLength, 0)
  if (!Number.isSafeInteger(combinedSourceBytes) ||
      combinedSourceBytes > MAXIMUM_STREAMING_COMBINED_SOURCE_BYTES) {
    throw new Error('streaming sources exceed confined capacity')
  }

  const expectedLivingFrameOverlays = planning.livingFrameOverlayLayers ?? []
  if (inputs.livingFrameOverlays.length !== expectedLivingFrameOverlays.length) {
    throw new Error('streaming Living Frame count does not match approved planning')
  }
  const livingFrameOverlays = inputs.livingFrameOverlays.map((candidate, index) => {
    const overlay = validateStreamingInputCommitment(
      candidate,
      ['inputId', 'outputKey', 'mimeType', 'byteLength', 'sha256'],
      'image/png',
      67,
      MAXIMUM_STREAMING_LIVING_FRAME_OVERLAY_BYTES,
      `streaming Living Frame overlay ${index + 1}`,
    )
    const outputKey = safeIdentity(
      candidate.outputKey,
      `streaming Living Frame overlay ${index + 1} outputKey`,
    )
    if (outputKey !== expectedLivingFrameOverlays[index]?.componentOutputKey) {
      throw new Error('streaming Living Frame order diverges from approved planning')
    }
    return { ...overlay, outputKey }
  })
  const combinedLivingFrameOverlayBytes = livingFrameOverlays.reduce(
    (total, overlay) => total + overlay.byteLength,
    0,
  )
  if (
    !Number.isSafeInteger(combinedLivingFrameOverlayBytes) ||
    combinedLivingFrameOverlayBytes >
      MAXIMUM_STREAMING_COMBINED_LIVING_FRAME_OVERLAY_BYTES
  ) {
    throw new Error('streaming Living Frame overlays exceed their combined ceiling')
  }

  const expectedControlledVisualOverlays =
    planning.controlledVisualOverlayLayers ?? []
  if (
    inputs.controlledVisualOverlays.length !==
    expectedControlledVisualOverlays.length
  ) {
    throw new Error(
      'streaming controlled visual count does not match approved planning',
    )
  }
  const controlledVisualOverlays = inputs.controlledVisualOverlays.map(
    (candidate, index) => {
      const overlay = validateStreamingInputCommitment(
        candidate,
        ['inputId', 'outputKey', 'mimeType', 'byteLength', 'sha256'],
        'image/svg+xml',
        64,
        MAXIMUM_STREAMING_CONTROLLED_VISUAL_OVERLAY_BYTES,
        `streaming controlled visual overlay ${index + 1}`,
      )
      const outputKey = safeIdentity(
        candidate.outputKey,
        `streaming controlled visual overlay ${index + 1} outputKey`,
      )
      if (outputKey !== expectedControlledVisualOverlays[index]?.outputKey) {
        throw new Error(
          'streaming controlled visual order diverges from approved planning',
        )
      }
      return { ...overlay, outputKey }
    },
  )
  const combinedControlledVisualOverlayBytes =
    controlledVisualOverlays.reduce(
      (total, overlay) => total + overlay.byteLength,
      0,
    )
  if (
    !Number.isSafeInteger(combinedControlledVisualOverlayBytes) ||
    combinedControlledVisualOverlayBytes >
      MAXIMUM_STREAMING_COMBINED_CONTROLLED_VISUAL_OVERLAY_BYTES
  ) {
    throw new Error(
      'streaming controlled visual overlays exceed their combined ceiling',
    )
  }

  const expectedCaptionCount = captionTrack ? planning.captionOverlayCues.length : 1
  if (inputs.captionOverlays.length !== expectedCaptionCount) {
    throw new Error('streaming caption count does not match approved planning')
  }
  const captionOverlays = inputs.captionOverlays.map((candidate, index) => {
    const caption = validateStreamingInputCommitment(
      candidate,
      ['inputId', 'outputKey', 'mimeType', 'byteLength', 'sha256'],
      'image/png',
      1_024,
      MAXIMUM_STREAMING_CAPTION_BYTES,
      `streaming caption ${index + 1}`,
    )
    const outputKey = safeIdentity(candidate.outputKey, `streaming caption ${index + 1} outputKey`)
    const expectedOutputKey = captionTrack
      ? planning.captionOverlayCues[index].outputKey
      : SINGLE_STREAMING_CAPTION_OUTPUT_KEY
    if (outputKey !== expectedOutputKey) {
      throw new Error('streaming caption order diverges from approved planning')
    }
    return { ...caption, outputKey }
  })
  const combinedCaptionBytes = captionOverlays.reduce((total, caption) => total + caption.byteLength, 0)
  if (!Number.isSafeInteger(combinedCaptionBytes) ||
      combinedCaptionBytes > MAXIMUM_STREAMING_CAPTION_BYTES) {
    throw new Error('streaming captions exceed their combined ceiling')
  }

  const expectedVoiceTracks = replaceVoice ? planning.voiceTracks : []
  if (inputs.voiceTracks.length !== expectedVoiceTracks.length) {
    throw new Error('streaming voice count does not match approved planning')
  }
  const voiceTracks = inputs.voiceTracks.map((candidate, index) => {
    const expected = expectedVoiceTracks[index]
    const sourceSliceProvided = expected?.sourceStartFrame !== undefined
    const voice = validateStreamingInputCommitment(
      candidate,
      [
        'inputId', 'sourceSequenceItemId', 'outputKey', 'durationFrames',
        ...(sourceSliceProvided
          ? ['sourceStartFrame', 'sourceEndFrameExclusive']
          : []),
        'mimeType', 'byteLength', 'sha256',
      ],
      'audio/wav',
      44,
      MAXIMUM_STREAMING_COMBINED_VOICE_TRACK_BYTES,
      `streaming voice ${index + 1}`,
    )
    const sourceSequenceItemId = safeIdentity(
      candidate.sourceSequenceItemId,
      `streaming voice ${index + 1} sourceSequenceItemId`,
    )
    const outputKey = safeIdentity(candidate.outputKey, `streaming voice ${index + 1} outputKey`)
    const durationFrames = integer(
      candidate.durationFrames,
      1,
      sourceSliceProvided
        ? MAXIMUM_SOURCE_SLICE_LONG_FORM_FRAMES
        : MAXIMUM_SOURCE_SEGMENT_FRAMES,
      `streaming voice ${index + 1} durationFrames`,
    )
    if (!expected || sourceSequenceItemId !== expected.sourceSequenceItemId ||
        outputKey !== expected.outputKey ||
        durationFrames !== expected.durationFrames ||
        (sourceSliceProvided && (
          candidate.sourceStartFrame !== expected.sourceStartFrame ||
          candidate.sourceEndFrameExclusive !== expected.sourceEndFrameExclusive
        ))) {
      throw new Error('streaming voice order diverges from approved planning')
    }
    return {
      ...voice,
      sourceSequenceItemId,
      outputKey,
      durationFrames,
      ...(sourceSliceProvided
        ? {
            sourceStartFrame: expected.sourceStartFrame,
            sourceEndFrameExclusive: expected.sourceEndFrameExclusive,
          }
        : {}),
    }
  })
  const combinedVoiceBytes = voiceTracks.reduce((total, voice) => total + voice.byteLength, 0)
  if (!Number.isSafeInteger(combinedVoiceBytes) ||
      combinedVoiceBytes > MAXIMUM_STREAMING_COMBINED_VOICE_TRACK_BYTES) {
    throw new Error('streaming voice tracks exceed their combined ceiling')
  }

  const expectedSupplementalAudioTracks = planning.supplementalAudioTracks ?? []
  if (inputs.supplementalAudioTracks.length !== expectedSupplementalAudioTracks.length) {
    throw new Error('streaming supplemental audio count does not match approved planning')
  }
  const supplementalAudioTracks = inputs.supplementalAudioTracks.map(
    (candidate, index) => {
      const track = validateStreamingInputCommitment(
        candidate,
        [
          'inputId', 'outputKey', 'attachmentId', 'markerId', 'markerType',
          'startFrame', 'endFrameExclusive', 'fillPolicy', 'mixProfileId',
          'mimeType', 'byteLength', 'sha256',
        ],
        'audio/wav',
        44,
        MAXIMUM_STREAMING_SUPPLEMENTAL_AUDIO_BYTES,
        `streaming supplemental audio ${index + 1}`,
      )
      const expected = expectedSupplementalAudioTracks[index]
      if (
        !expected ||
        candidate.outputKey !== expected.outputKey ||
        candidate.attachmentId !== expected.attachmentId ||
        candidate.markerId !== expected.markerId ||
        candidate.markerType !== expected.markerType ||
        candidate.startFrame !== expected.startFrame ||
        candidate.endFrameExclusive !== expected.endFrameExclusive ||
        candidate.fillPolicy !== expected.fillPolicy ||
        candidate.mixProfileId !== expected.mixProfileId
      ) {
        throw new Error(
          'streaming supplemental audio order diverges from approved planning',
        )
      }
      return { ...track, ...expected }
    },
  )
  const combinedSupplementalAudioBytes = supplementalAudioTracks.reduce(
    (total, track) => total + track.byteLength,
    0,
  )
  if (
    !Number.isSafeInteger(combinedSupplementalAudioBytes) ||
    combinedSupplementalAudioBytes >
      MAXIMUM_STREAMING_COMBINED_SUPPLEMENTAL_AUDIO_BYTES
  ) {
    throw new Error('streaming supplemental audio exceeds its combined ceiling')
  }
  const commitments = [
    ...sources,
    ...livingFrameOverlays,
    ...controlledVisualOverlays,
    ...captionOverlays,
    ...voiceTracks,
    ...supplementalAudioTracks,
  ]
  const combinedInputBytes = commitments.reduce((total, input) => total + input.byteLength, 0)
  if (new Set(commitments.map((input) => input.inputId)).size !== commitments.length ||
      !Number.isSafeInteger(combinedInputBytes) ||
      combinedInputBytes > MAXIMUM_STREAMING_COMBINED_INPUT_BYTES) {
    throw new Error('streaming input identity or combined capacity is invalid')
  }
  return {
    schemaVersion: STREAMING_PROTOCOL,
    toolId: 'remotion',
    operationId: OPERATION,
    inputMode: STREAMING_INPUT_MODE,
    payload: planning,
    inputs: {
      sources,
      livingFrameOverlays,
      controlledVisualOverlays,
      captionOverlays,
      voiceTracks,
      supplementalAudioTracks,
    },
    commitments,
  }
}

function validateLongFormMergeManifest(value) {
  const request = exactObject(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'long-form merge streaming request')
  if (
    request.schemaVersion !== LONG_FORM_MERGE_STREAMING_PROTOCOL ||
    request.toolId !== 'remotion' || request.operationId !== OPERATION ||
    request.inputMode !== STREAMING_INPUT_MODE
  ) throw new Error('long-form merge streaming identity is unsupported')
  const rawPayload = request.payload && typeof request.payload === 'object' &&
    !Array.isArray(request.payload)
    ? request.payload
    : {}
  const sourceSliceProfile = rawPayload.longFormCapacityProfileId ===
    SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE
  const payload = exactObject(request.payload, [
    'compositionProfileId', 'longFormCapacityProfileId',
    'width', 'height', 'fps', 'durationFrames', 'chunks',
    'mergePolicy', 'transitionPolicy', 'chunkBoundaryTransitions',
    ...(sourceSliceProfile ? ['chunkBoundaryContinuity'] : []),
    'audioPolicy', 'frameContinuityPolicy',
    'renderPurpose', 'deliveryProfileId', 'estimateCostBasisProfileId',
    'sourceQualityPolicy', 'usesApprovedEditReservation',
    'requiresSeparateExportEstimate', 'allowsAdditionalExportCharge',
  ], 'long-form merge planning payload')
  const dimensions = `${payload.width}x${payload.height}`
  const maximumFrames = sourceSliceProfile
    ? MAXIMUM_SOURCE_SLICE_LONG_FORM_FRAMES
    : MAXIMUM_LONG_FORM_FRAMES
  const minimumFrames = sourceSliceProfile
    ? MAXIMUM_SOURCE_SEGMENT_FRAMES + 1
    : MINIMUM_LONG_FORM_FRAMES
  const maximumChunks = sourceSliceProfile
    ? MAXIMUM_SOURCE_SLICE_LONG_FORM_CHUNKS
    : MAXIMUM_SOURCE_SEQUENCE_ITEMS
  const validProfilePolicy = sourceSliceProfile
    ? payload.mergePolicy === 'approved_contiguous_source_slice_4k_chunks_v2' &&
      payload.transitionPolicy === 'continuous_approved_source_slices_only' &&
      payload.frameContinuityPolicy ===
        'exact_integer_frame_and_source_slice_boundaries_v2'
    : payload.longFormCapacityProfileId === LONG_FORM_CAPACITY_PROFILE &&
      payload.mergePolicy === 'approved_contiguous_4k_chunks_v1' &&
      payload.transitionPolicy === 'approved_hard_cuts_only' &&
      payload.frameContinuityPolicy === 'exact_integer_frame_boundaries_v1'
  if (
    payload.compositionProfileId !== LONG_FORM_MERGE_COMPOSITION_PROFILE ||
    !validProfilePolicy ||
    !FOUR_K_MASTER_FRAMES.includes(dimensions) ||
    ![24, 30].includes(payload.fps) ||
    !Number.isSafeInteger(payload.durationFrames) ||
    payload.durationFrames < minimumFrames ||
    payload.durationFrames > maximumFrames ||
    payload.audioPolicy !== 'preserve_approved_chunk_audio' ||
    payload.renderPurpose !== 'private_4k_delivery_master_v1' ||
    payload.deliveryProfileId !== 'uhd_2160' ||
    payload.estimateCostBasisProfileId !== 'uhd_2160' ||
    payload.sourceQualityPolicy !== 'immutable_source_master_no_proxy_v1' ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw new Error('long-form merge planning authority is unsupported')
  if (!Array.isArray(payload.chunks) || payload.chunks.length < 2 ||
      payload.chunks.length > maximumChunks) {
    throw new Error(`long-form merge requires two through ${maximumChunks} chunks`)
  }
  let expectedStart = 0
  const outputKeys = new Set()
  const sourceIds = new Set()
  const cleanupIds = new Set()
  const chunks = payload.chunks.map((candidate, index) => {
    const chunk = exactObject(candidate, [
      'outputKey', 'chunkIndex', 'chunkCount',
      'globalStartFrame', 'globalEndFrameExclusive', 'durationFrames',
      'sourceSequenceItemIds', 'sourceCleanupDecisionIds',
      ...(sourceSliceProfile
        ? ['sourceSliceKey', 'sourceStartFrame', 'sourceEndFrameExclusive']
        : []),
    ], `long-form merge chunk ${index + 1}`)
    if (!Array.isArray(chunk.sourceSequenceItemIds) ||
        !Array.isArray(chunk.sourceCleanupDecisionIds) ||
        chunk.sourceSequenceItemIds.length < 1 ||
        chunk.sourceSequenceItemIds.length > MAXIMUM_SOURCE_SEQUENCE_ITEMS ||
        chunk.sourceSequenceItemIds.length !== chunk.sourceCleanupDecisionIds.length) {
      throw new Error('long-form merge chunk lineage is incomplete')
    }
    const normalized = {
      outputKey: safeIdentity(chunk.outputKey, 'chunk outputKey'),
      chunkIndex: integer(chunk.chunkIndex, 1, payload.chunks.length, 'chunkIndex'),
      chunkCount: integer(chunk.chunkCount, payload.chunks.length, payload.chunks.length, 'chunkCount'),
      globalStartFrame: integer(chunk.globalStartFrame, 0, payload.durationFrames - 1, 'globalStartFrame'),
      globalEndFrameExclusive: integer(chunk.globalEndFrameExclusive, 1, payload.durationFrames, 'globalEndFrameExclusive'),
      durationFrames: integer(
        chunk.durationFrames,
        MINIMUM_COMPOSITION_FRAMES,
        sourceSliceProfile
          ? MAXIMUM_SOURCE_SEGMENT_FRAMES
          : MAXIMUM_SOURCE_SEQUENCE_FRAMES,
        'chunk durationFrames',
      ),
      sourceSequenceItemIds: chunk.sourceSequenceItemIds.map((id) =>
        safeIdentity(id, 'chunk sourceSequenceItemId')),
      sourceCleanupDecisionIds: chunk.sourceCleanupDecisionIds.map((id) =>
        safeIdentity(id, 'chunk sourceCleanupDecisionId')),
      ...(sourceSliceProfile
        ? {
            sourceSliceKey: safeIdentity(chunk.sourceSliceKey, 'chunk sourceSliceKey'),
            sourceStartFrame: integer(
              chunk.sourceStartFrame,
              0,
              Number.MAX_SAFE_INTEGER - 1,
              'chunk sourceStartFrame',
            ),
            sourceEndFrameExclusive: integer(
              chunk.sourceEndFrameExclusive,
              1,
              Number.MAX_SAFE_INTEGER,
              'chunk sourceEndFrameExclusive',
            ),
          }
        : {}),
    }
    const repeatedSourceBoundaryLineage = !sourceSliceProfile && (
      normalized.sourceSequenceItemIds.some((id) => sourceIds.has(id)) ||
      normalized.sourceCleanupDecisionIds.some((id) => cleanupIds.has(id))
    )
    const invalidSourceSliceLineage = sourceSliceProfile && (
      normalized.sourceEndFrameExclusive - normalized.sourceStartFrame !==
        normalized.durationFrames ||
      normalized.sourceSliceKey !==
        `source-slice-${index + 1}-of-${payload.chunks.length}`
    )
    if (
      normalized.chunkIndex !== index + 1 ||
      normalized.globalStartFrame !== expectedStart ||
      normalized.globalEndFrameExclusive <= normalized.globalStartFrame ||
      normalized.durationFrames !==
        normalized.globalEndFrameExclusive - normalized.globalStartFrame ||
      outputKeys.has(normalized.outputKey) ||
      new Set(normalized.sourceSequenceItemIds).size !== normalized.sourceSequenceItemIds.length ||
      new Set(normalized.sourceCleanupDecisionIds).size !== normalized.sourceCleanupDecisionIds.length ||
      repeatedSourceBoundaryLineage ||
      invalidSourceSliceLineage
    ) throw new Error('long-form chunks are not unique, contiguous, and duration preserving')
    outputKeys.add(normalized.outputKey)
    normalized.sourceSequenceItemIds.forEach((id) => sourceIds.add(id))
    normalized.sourceCleanupDecisionIds.forEach((id) => cleanupIds.add(id))
    expectedStart = normalized.globalEndFrameExclusive
    return normalized
  })
  if (expectedStart !== payload.durationFrames) {
    throw new Error('long-form chunks do not cover the approved duration')
  }
  if (sourceSliceProfile && chunks.some((chunk, index) => index > 0 &&
    chunk.sourceStartFrame !== chunks[index - 1].sourceEndFrameExclusive)) {
    throw new Error('source-slice chunks do not preserve exact approved source-frame continuity')
  }
  const validSourceLineage = sourceSliceProfile
    ? sourceIds.size === 1 && cleanupIds.size === 1 && chunks.every((chunk) =>
      chunk.sourceSequenceItemIds.length === 1 &&
      chunk.sourceCleanupDecisionIds.length === 1 &&
      chunk.sourceSequenceItemIds[0] === chunks[0].sourceSequenceItemIds[0] &&
      chunk.sourceCleanupDecisionIds[0] === chunks[0].sourceCleanupDecisionIds[0])
    : sourceIds.size >= 2 && sourceIds.size <= MAXIMUM_SOURCE_SEQUENCE_ITEMS &&
      cleanupIds.size === sourceIds.size
  if (!validSourceLineage) {
    throw new Error(sourceSliceProfile
      ? 'source-slice merge requires one exact approved source across every chunk'
      : 'long-form merge requires two through eight ordered approved sources')
  }
  if (!Array.isArray(payload.chunkBoundaryTransitions) ||
      payload.chunkBoundaryTransitions.length !== (sourceSliceProfile ? 0 : chunks.length - 1)) {
    throw new Error(sourceSliceProfile
      ? 'source-slice merge cannot invent hard cuts at technical chunk boundaries'
      : 'long-form merge requires one hard cut per chunk boundary')
  }
  const timingIds = new Set()
  const refinedIds = new Set()
  const chunkBoundaryTransitions = payload.chunkBoundaryTransitions.map((candidate, index) => {
    const transition = exactObject(candidate, [
      'transitionTimingItemId', 'refinedTransitionTimingItemId',
      'fromSourceSequenceItemId', 'toSourceSequenceItemId', 'boundaryFrame',
    ], `long-form boundary transition ${index + 1}`)
    const normalized = {
      transitionTimingItemId: safeIdentity(transition.transitionTimingItemId, 'transitionTimingItemId'),
      refinedTransitionTimingItemId: safeIdentity(
        transition.refinedTransitionTimingItemId,
        'refinedTransitionTimingItemId',
      ),
      fromSourceSequenceItemId: safeIdentity(
        transition.fromSourceSequenceItemId,
        'fromSourceSequenceItemId',
      ),
      toSourceSequenceItemId: safeIdentity(
        transition.toSourceSequenceItemId,
        'toSourceSequenceItemId',
      ),
      boundaryFrame: integer(transition.boundaryFrame, 1, payload.durationFrames - 1, 'boundaryFrame'),
    }
    const fromChunk = chunks[index]
    const toChunk = chunks[index + 1]
    if (
      timingIds.has(normalized.transitionTimingItemId) ||
      refinedIds.has(normalized.refinedTransitionTimingItemId) ||
      normalized.boundaryFrame !== fromChunk.globalEndFrameExclusive ||
      normalized.boundaryFrame !== toChunk.globalStartFrame ||
      normalized.fromSourceSequenceItemId !== fromChunk.sourceSequenceItemIds.at(-1) ||
      normalized.toSourceSequenceItemId !== toChunk.sourceSequenceItemIds[0]
    ) throw new Error('long-form hard-cut authority diverges from a chunk boundary')
    timingIds.add(normalized.transitionTimingItemId)
    refinedIds.add(normalized.refinedTransitionTimingItemId)
    return normalized
  })
  if (sourceSliceProfile && (
    !Array.isArray(payload.chunkBoundaryContinuity) ||
    payload.chunkBoundaryContinuity.length !== chunks.length - 1
  )) throw new Error('source-slice merge requires one continuity record per chunk boundary')
  let expectedFromSliceKey
  const chunkBoundaryContinuity = sourceSliceProfile
    ? payload.chunkBoundaryContinuity.map((candidate, index) => {
        const continuity = exactObject(candidate, [
          'sourceSequenceItemId', 'sourceCleanupDecisionId', 'boundaryFrame',
          'previousSourceEndFrameExclusive', 'nextSourceStartFrame',
          'fromSourceSliceKey', 'toSourceSliceKey',
        ], `long-form source-slice continuity ${index + 1}`)
        const fromChunk = chunks[index]
        const toChunk = chunks[index + 1]
        const normalized = {
          sourceSequenceItemId: safeIdentity(
            continuity.sourceSequenceItemId,
            'sourceSequenceItemId',
          ),
          sourceCleanupDecisionId: safeIdentity(
            continuity.sourceCleanupDecisionId,
            'sourceCleanupDecisionId',
          ),
          boundaryFrame: integer(
            continuity.boundaryFrame,
            1,
            payload.durationFrames - 1,
            'boundaryFrame',
          ),
          previousSourceEndFrameExclusive: integer(
            continuity.previousSourceEndFrameExclusive,
            1,
            Number.MAX_SAFE_INTEGER,
            'previousSourceEndFrameExclusive',
          ),
          nextSourceStartFrame: integer(
            continuity.nextSourceStartFrame,
            0,
            Number.MAX_SAFE_INTEGER - 1,
            'nextSourceStartFrame',
          ),
          fromSourceSliceKey: safeIdentity(
            continuity.fromSourceSliceKey,
            'fromSourceSliceKey',
          ),
          toSourceSliceKey: safeIdentity(
            continuity.toSourceSliceKey,
            'toSourceSliceKey',
          ),
        }
        if (
          normalized.boundaryFrame !== fromChunk.globalEndFrameExclusive ||
          normalized.boundaryFrame !== toChunk.globalStartFrame ||
          normalized.sourceSequenceItemId !== fromChunk.sourceSequenceItemIds[0] ||
          normalized.sourceSequenceItemId !== toChunk.sourceSequenceItemIds[0] ||
          normalized.sourceCleanupDecisionId !== fromChunk.sourceCleanupDecisionIds[0] ||
          normalized.sourceCleanupDecisionId !== toChunk.sourceCleanupDecisionIds[0] ||
          normalized.previousSourceEndFrameExclusive !== fromChunk.sourceEndFrameExclusive ||
          normalized.nextSourceStartFrame !== toChunk.sourceStartFrame ||
          normalized.fromSourceSliceKey !== fromChunk.sourceSliceKey ||
          normalized.toSourceSliceKey !== toChunk.sourceSliceKey ||
          normalized.previousSourceEndFrameExclusive !== normalized.nextSourceStartFrame ||
          normalized.fromSourceSliceKey === normalized.toSourceSliceKey ||
          (expectedFromSliceKey !== undefined &&
            normalized.fromSourceSliceKey !== expectedFromSliceKey)
        ) throw new Error('long-form source-slice continuity diverges from a chunk boundary')
        expectedFromSliceKey = normalized.toSourceSliceKey
        return normalized
      })
    : []
  const inputs = exactObject(request.inputs, ['chunks'], 'long-form merge inputs')
  if (!Array.isArray(inputs.chunks) || inputs.chunks.length !== chunks.length) {
    throw new Error('long-form chunk commitments are incomplete')
  }
  const inputIds = new Set()
  let combinedBytes = 0
  const commitments = inputs.chunks.map((candidate, index) => {
    const commitment = validateStreamingInputCommitment(
      candidate,
      ['inputId', 'outputKey', 'chunkIndex', 'mimeType', 'byteLength', 'sha256'],
      'video/mp4',
      1_024,
      MAXIMUM_LONG_FORM_CHUNK_BYTES,
      `long-form chunk commitment ${index + 1}`,
    )
    const outputKey = safeIdentity(candidate.outputKey, 'chunk commitment outputKey')
    const chunkIndex = integer(candidate.chunkIndex, 1, chunks.length, 'chunk commitment index')
    if (
      inputIds.has(commitment.inputId) ||
      outputKey !== chunks[index].outputKey || chunkIndex !== chunks[index].chunkIndex
    ) throw new Error('long-form chunk commitment diverges from approved order')
    inputIds.add(commitment.inputId)
    combinedBytes += commitment.byteLength
    return { ...commitment, outputKey, chunkIndex }
  })
  if (!Number.isSafeInteger(combinedBytes) ||
      combinedBytes > MAXIMUM_LONG_FORM_COMBINED_CHUNK_BYTES) {
    throw new Error('long-form chunk commitments exceed combined capacity')
  }
  return {
    schemaVersion: LONG_FORM_MERGE_STREAMING_PROTOCOL,
    toolId: 'remotion', operationId: OPERATION, inputMode: STREAMING_INPUT_MODE,
    payload: {
      ...payload,
      width: integer(payload.width, 2160, 3840, 'width'),
      height: integer(payload.height, 2160, 3840, 'height'),
      fps: payload.fps,
      durationFrames: payload.durationFrames,
      chunks,
      chunkBoundaryTransitions,
      ...(sourceSliceProfile ? { chunkBoundaryContinuity } : {}),
    },
    inputs: { chunks: commitments },
    commitments,
  }
}

function validateDeliveryH264ChunkManifest(value) {
  const request = exactObject(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'delivery H.264 chunk streaming request')
  if (
    request.schemaVersion !== DELIVERY_H264_CHUNK_STREAMING_PROTOCOL ||
    request.toolId !== 'remotion' || request.operationId !== OPERATION ||
    request.inputMode !== STREAMING_INPUT_MODE
  ) throw new Error('delivery H.264 chunk streaming identity is unsupported')
  const payload = exactObject(request.payload, [
    'recipeProfileId', 'compositionProfileId', 'longFormCapacityProfileId',
    'chunkId', 'chunkAuthorityHash', 'sourceVp9ObjectIdentity',
    'expectedOutputIdentity', 'chunkIndex', 'chunkCount', 'width', 'height',
    'fps', 'durationFrames', 'globalStartFrame', 'globalEndFrameExclusive',
    'sourceVideoPolicy', 'transcodePolicy', 'outputContainer',
    'outputVideoCodec', 'outputVideoProfile', 'outputCrf', 'outputPreset',
    'outputPixelFormat', 'outputColorRange', 'outputColorSpace',
    'outputColorTransfer', 'outputColorPrimaries', 'outputAudioPolicy',
    'renderPurpose', 'deliveryProfileId', 'estimateCostBasisProfileId',
    'sourceQualityPolicy', 'usesApprovedEditReservation',
    'requiresSeparateExportEstimate', 'allowsAdditionalExportCharge',
  ], 'delivery H.264 chunk planning payload')
  const chunkId = safeIdentity(payload.chunkId, 'delivery chunkId')
  const chunkAuthorityHash = sha256Identity(
    payload.chunkAuthorityHash,
    'delivery chunkAuthorityHash',
  )
  const sourceVp9ObjectIdentity = sha256Identity(
    payload.sourceVp9ObjectIdentity,
    'delivery sourceVp9ObjectIdentity',
  )
  const expectedOutputIdentity = sha256Identity(
    payload.expectedOutputIdentity,
    'delivery expectedOutputIdentity',
  )
  const chunkIndex = integer(payload.chunkIndex, 1, 124, 'delivery chunkIndex')
  const chunkCount = integer(payload.chunkCount, 2, 124, 'delivery chunkCount')
  const width = integer(payload.width, 2160, 3840, 'delivery width')
  const height = integer(payload.height, 2160, 3840, 'delivery height')
  const durationFrames = integer(
    payload.durationFrames,
    1_350,
    5_400,
    'delivery durationFrames',
  )
  const globalStartFrame = integer(
    payload.globalStartFrame,
    0,
    647_999,
    'delivery globalStartFrame',
  )
  const globalEndFrameExclusive = integer(
    payload.globalEndFrameExclusive,
    1,
    648_000,
    'delivery globalEndFrameExclusive',
  )
  const dimensions = `${width}x${height}`
  if (
    payload.recipeProfileId !== DELIVERY_H264_CHUNK_RECIPE ||
    payload.compositionProfileId !==
      DELIVERY_H264_CHUNK_COMPOSITION_PROFILE ||
    payload.longFormCapacityProfileId !==
      PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE ||
    chunkIndex > chunkCount || !FOUR_K_MASTER_FRAMES.includes(dimensions) ||
    payload.fps !== 30 ||
    globalEndFrameExclusive - globalStartFrame !== durationFrames ||
    payload.sourceVideoPolicy !== 'exact_passed_vp9_object_chunk_v2' ||
    payload.transcodePolicy !==
      'h264_high_crf18_medium_frame_preserving_v1' ||
    payload.outputContainer !== 'mp4' ||
    payload.outputVideoCodec !== 'h264' ||
    payload.outputVideoProfile !== 'high' || payload.outputCrf !== 18 ||
    payload.outputPreset !== 'medium' ||
    payload.outputPixelFormat !== 'yuv420p' ||
    payload.outputColorRange !== 'tv' ||
    payload.outputColorSpace !== 'bt709' ||
    payload.outputColorTransfer !== 'bt709' ||
    payload.outputColorPrimaries !== 'bt709' ||
    payload.outputAudioPolicy !== 'video_only_no_audio' ||
    payload.renderPurpose !==
      'private_4k_customer_delivery_video_chunk_v1' ||
    payload.deliveryProfileId !== 'uhd_2160' ||
    payload.estimateCostBasisProfileId !== 'uhd_2160' ||
    payload.sourceQualityPolicy !== 'immutable_source_master_no_proxy_v1' ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw new Error('delivery H.264 chunk policy is unsupported')
  const inputs = exactObject(request.inputs, ['source'],
    'delivery H.264 chunk inputs')
  const source = validateStreamingInputCommitment(
    inputs.source,
    ['inputId', 'mimeType', 'byteLength', 'sha256'],
    'video/x-matroska',
    64,
    MAXIMUM_DELIVERY_H264_CHUNK_SOURCE_BYTES,
    'delivery H.264 chunk source',
  )
  return {
    schemaVersion: DELIVERY_H264_CHUNK_STREAMING_PROTOCOL,
    toolId: 'remotion',
    operationId: OPERATION,
    inputMode: STREAMING_INPUT_MODE,
    payload: {
      recipeProfileId: DELIVERY_H264_CHUNK_RECIPE,
      compositionProfileId: DELIVERY_H264_CHUNK_COMPOSITION_PROFILE,
      longFormCapacityProfileId:
        PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE,
      chunkId,
      chunkAuthorityHash,
      sourceVp9ObjectIdentity,
      expectedOutputIdentity,
      chunkIndex,
      chunkCount,
      width,
      height,
      fps: 30,
      durationFrames,
      globalStartFrame,
      globalEndFrameExclusive,
      sourceVideoPolicy: 'exact_passed_vp9_object_chunk_v2',
      transcodePolicy: 'h264_high_crf18_medium_frame_preserving_v1',
      outputContainer: 'mp4',
      outputVideoCodec: 'h264',
      outputVideoProfile: 'high',
      outputCrf: 18,
      outputPreset: 'medium',
      outputPixelFormat: 'yuv420p',
      outputColorRange: 'tv',
      outputColorSpace: 'bt709',
      outputColorTransfer: 'bt709',
      outputColorPrimaries: 'bt709',
      outputAudioPolicy: 'video_only_no_audio',
      renderPurpose: 'private_4k_customer_delivery_video_chunk_v1',
      deliveryProfileId: 'uhd_2160',
      estimateCostBasisProfileId: 'uhd_2160',
      sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
    },
    inputs: { source },
    commitments: [source],
  }
}

function sha256Identity(value, label) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label} is invalid`)
  }
  return value
}

async function materializeDeliveryH264ChunkRequest(
  manifest,
  reader,
  requestHash,
) {
  const source = manifest.inputs.source
  const path = `/tmp/reeditpro-stream-input-delivery-h264-${process.pid}-${requestHash.slice(0, 12)}.mkv`
  try {
    const file = await reader.readExactFile(path, source.byteLength)
    if (
      file.sha256 !== source.sha256 ||
      !approvedStreamingInputSignature(file.firstBytes, 'video/x-matroska')
    ) throw new Error(
      'delivery H.264 source failed exact checksum or Matroska signature verification',
    )
    await reader.assertEnd()
    return {
      request: {
        schemaVersion: DELIVERY_H264_CHUNK_STREAMING_PROTOCOL,
        toolId: 'remotion',
        operationId: OPERATION,
        inputMode: STREAMING_INPUT_MODE,
        payload: {
          ...manifest.payload,
          sourceMimeType: 'video/x-matroska',
          sourceByteLength: source.byteLength,
          sourceSha256: source.sha256,
          sourceInternalFilePath: path,
        },
      },
      materialized: [{ ...source, path }],
    }
  } catch (error) {
    await rm(path, { force: true }).catch(() => undefined)
    throw error
  }
}

async function materializeLongFormMergeRequest(manifest, reader, requestHash) {
  const materialized = []
  try {
    for (const [index, commitment] of manifest.commitments.entries()) {
      const path = `/tmp/reeditpro-stream-input-long-form-chunk-${process.pid}-${index}-${requestHash.slice(0, 12)}.mp4`
      const file = await reader.readExactFile(path, commitment.byteLength)
      if (file.sha256 !== commitment.sha256 ||
          !approvedStreamingInputSignature(file.firstBytes, 'video/mp4')) {
        throw new Error('long-form chunk failed exact checksum or MP4 signature verification')
      }
      materialized.push({ ...commitment, path })
    }
    await reader.assertEnd()
    const byInputId = new Map(materialized.map((input) => [input.inputId, input]))
    return {
      request: {
        schemaVersion: LONG_FORM_MERGE_STREAMING_PROTOCOL,
        toolId: 'remotion', operationId: OPERATION, inputMode: STREAMING_INPUT_MODE,
        payload: {
          ...manifest.payload,
          chunks: manifest.payload.chunks.map((chunk, index) => ({
            ...chunk,
            chunkMimeType: 'video/mp4',
            chunkByteLength: manifest.inputs.chunks[index].byteLength,
            chunkSha256: manifest.inputs.chunks[index].sha256,
            chunkInternalFilePath: byInputId.get(manifest.inputs.chunks[index].inputId).path,
          })),
        },
      },
      materialized,
    }
  } catch (error) {
    await Promise.all(materialized.map((input) => rm(input.path, { force: true })))
    throw error
  }
}

async function materializeStreamingRequest(manifest, reader, requestHash) {
  const materialized = []
  try {
    for (const [index, commitment] of manifest.commitments.entries()) {
      const extension = sourceExtension(commitment.mimeType)
      const path = `/tmp/reeditpro-stream-input-${process.pid}-${index}-${requestHash.slice(0, 12)}.${extension}`
      const file = await reader.readExactFile(path, commitment.byteLength)
      if (file.sha256 !== commitment.sha256 ||
          !approvedStreamingInputSignature(file.firstBytes, commitment.mimeType)) {
        throw new Error('streaming input failed exact checksum or signature verification')
      }
      if (commitment.mimeType === 'audio/wav') {
        const voicePlan = manifest.inputs.voiceTracks.find((candidate) =>
          candidate.inputId === commitment.inputId)
        const supplementalPlan = manifest.inputs.supplementalAudioTracks.find(
          (candidate) => candidate.inputId === commitment.inputId,
        )
        if (voicePlan) {
          await validatePcmVoiceTrackFile(
            path,
            commitment.byteLength,
            voicePlan.durationFrames,
            manifest.payload.fps,
          )
        } else if (supplementalPlan) {
          await validatePcmSupplementalAudioFile(path, commitment.byteLength)
        } else {
          throw new Error('streaming audio commitment lost its approved plan')
        }
      }
      if (commitment.mimeType === 'image/svg+xml') {
        await validateControlledVisualSvgFile(path, commitment.byteLength)
      }
      materialized.push({ ...commitment, path })
    }
    await reader.assertEnd()
    const byInputId = new Map(materialized.map((input) => [input.inputId, input]))
    const sources = manifest.inputs.sources.map((source) => ({
      ...source,
      sourceMimeType: source.mimeType,
      sourceByteLength: source.byteLength,
      sourceSha256: source.sha256,
      sourceInternalFilePath: byInputId.get(source.inputId).path,
    }))
    const livingFrameOverlays = manifest.inputs.livingFrameOverlays.map((overlay) => ({
      ...overlay,
      livingFrameOverlayMimeType: 'image/png',
      livingFrameOverlayByteLength: overlay.byteLength,
      livingFrameOverlaySha256: overlay.sha256,
      livingFrameOverlayInternalFilePath: byInputId.get(overlay.inputId).path,
    }))
    const controlledVisualOverlays =
      manifest.inputs.controlledVisualOverlays.map((overlay) => ({
        ...overlay,
        controlledVisualOverlayMimeType: 'image/svg+xml',
        controlledVisualOverlayByteLength: overlay.byteLength,
        controlledVisualOverlaySha256: overlay.sha256,
        controlledVisualOverlayInternalFilePath:
          byInputId.get(overlay.inputId).path,
      }))
    const captionOverlays = manifest.inputs.captionOverlays.map((caption) => ({
      ...caption,
      captionOverlayMimeType: 'image/png',
      captionOverlayByteLength: caption.byteLength,
      captionOverlaySha256: caption.sha256,
      captionOverlayInternalFilePath: byInputId.get(caption.inputId).path,
    }))
    const voiceTracks = manifest.inputs.voiceTracks.map((voice) => ({
      ...voice,
      voiceTrackInternalFilePath: byInputId.get(voice.inputId).path,
    }))
    const supplementalAudioTracks = manifest.inputs.supplementalAudioTracks.map(
      (track) => ({
        ...track,
        supplementalAudioInternalFilePath: byInputId.get(track.inputId).path,
      }),
    )
    const sourceSequence = isSourceSequenceProfile(manifest.payload.compositionProfileId)
    const captionTrack = isCaptionTrackProfile(manifest.payload.compositionProfileId)
    const replaceVoice = manifest.payload.audioPolicy === 'replace_with_approved_voice_tracks'
    return {
      request: {
        schemaVersion: STREAMING_PROTOCOL,
        toolId: 'remotion',
        operationId: OPERATION,
        inputMode: STREAMING_INPUT_MODE,
        payload: sourceSequence
          ? {
              ...manifest.payload,
              sources,
              ...(livingFrameOverlays.length > 0
                ? { livingFrameOverlays }
                : {}),
              ...(controlledVisualOverlays.length > 0
                ? { controlledVisualOverlays }
                : {}),
              ...(captionTrack
                ? { captionOverlays }
                : {
                    captionOverlayMimeType: 'image/png',
                    captionOverlayByteLength: captionOverlays[0].byteLength,
                    captionOverlaySha256: captionOverlays[0].sha256,
                    captionOverlayInternalFilePath: captionOverlays[0].captionOverlayInternalFilePath,
                  }),
              ...(replaceVoice ? { voiceTracks } : {}),
              ...(supplementalAudioTracks.length > 0
                ? { supplementalAudioTracks }
                : {}),
            }
          : {
              ...manifest.payload,
              sourceMimeType: sources[0].sourceMimeType,
              sourceByteLength: sources[0].sourceByteLength,
              sourceSha256: sources[0].sourceSha256,
              sourceInternalFilePath: sources[0].sourceInternalFilePath,
              ...(livingFrameOverlays.length > 0
                ? { livingFrameOverlays }
                : {}),
              ...(controlledVisualOverlays.length > 0
                ? { controlledVisualOverlays }
                : {}),
              ...(captionTrack
                ? { captionOverlays }
                : {
                    captionOverlayMimeType: 'image/png',
                    captionOverlayByteLength: captionOverlays[0].byteLength,
                    captionOverlaySha256: captionOverlays[0].sha256,
                    captionOverlayInternalFilePath: captionOverlays[0].captionOverlayInternalFilePath,
                  }),
              ...(replaceVoice ? { voiceTracks } : {}),
              ...(supplementalAudioTracks.length > 0
                ? { supplementalAudioTracks }
                : {}),
            },
      },
      materialized,
    }
  } catch (error) {
    await Promise.all(materialized.map((input) => rm(input.path, { force: true })))
    throw error
  }
}

function approvedStreamingInputSignature(bytes, mimeType) {
  if (mimeType === 'video/mp4') return bytes.subarray(4, 8).toString('ascii') === 'ftyp'
  if (mimeType === 'video/x-matroska') {
    return bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 &&
      bytes[2] === 0xdf && bytes[3] === 0xa3
  }
  if (mimeType === 'image/png') return bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
  if (mimeType === 'image/svg+xml') {
    const prefix = bytes.subarray(0, Math.min(bytes.length, 64))
      .toString('utf8')
      .trimStart()
      .toLowerCase()
    return prefix.startsWith('<svg')
  }
  if (mimeType === 'audio/wav') {
    return bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WAVE'
  }
  return false
}

async function validateControlledVisualSvgFile(path, byteLength) {
  const bytes = await readFile(path)
  if (bytes.byteLength !== byteLength) {
    throw new Error('controlled visual SVG changed before validation')
  }
  const text = bytes.toString('utf8')
  if (Buffer.from(text, 'utf8').byteLength !== bytes.byteLength) {
    throw new Error('controlled visual SVG is not canonical UTF-8')
  }
  const normalized = text.trim()
  const lower = normalized.toLowerCase()
  const canonicalNamespacePattern =
    /\sxmlns=(["'])http:\/\/www\.w3\.org\/2000\/svg\1/gi
  const canonicalNamespaceMatches =
    normalized.match(canonicalNamespacePattern) ?? []
  const canonicalXlinkNamespacePattern =
    /\sxmlns:xlink=(["'])http:\/\/www\.w3\.org\/1999\/xlink\1/gi
  const canonicalXlinkNamespaceMatches =
    normalized.match(canonicalXlinkNamespacePattern) ?? []
  const activeContentScan = normalized
    .replace(canonicalNamespacePattern, '')
    .replace(canonicalXlinkNamespacePattern, '')
  if (
    !/^<svg(?:\s|>)/.test(lower) ||
    !lower.endsWith('</svg>') ||
    canonicalNamespaceMatches.length !== 1 ||
    canonicalXlinkNamespaceMatches.length > 1 ||
    /<\s*(?:script|foreignobject|iframe|object|embed|audio|video|image)\b/i
      .test(normalized) ||
    /<!doctype|<!entity|<\?xml-stylesheet/i.test(normalized) ||
    /\b(?:href|xlink:href|src)\s*=/i.test(normalized) ||
    /\bon[a-z]+\s*=/i.test(normalized) ||
    /(?:https?:|ftp:|file:|javascript:|data:|url\s*\(|@import)/i
      .test(activeContentScan)
  ) {
    throw new Error('controlled visual SVG contains unsupported active content')
  }
}

async function execute(request, options = {}) {
  if (remotionVersion !== '4.0.487' || rendererVersion !== '4.0.487') throw new Error('Remotion package identity mismatch')
  const requestJson = JSON.stringify(request)
  const outputPath = `/tmp/reeditpro-remotion-${sha256(requestJson).slice(0, 24)}.mp4`
  const durationConstrainedOutputPath = `${outputPath}.duration-constrained.mp4`
  const scenePreview = request.payload.compositionProfileId === 'motion_studio_scene_preview_v1'
  const layered = request.payload.compositionProfileId === 'motion_studio_native_layered_scene_v1'
  const animatic = request.payload.compositionProfileId === 'motion_studio_prepared_script_animatic_v1'
  const routeDraw = request.payload.compositionProfileId === 'motion_studio_deterministic_route_draw_v1'
  const captionCreative = request.payload.compositionProfileId ===
    'caption_direction_creative_scene_group_v1'
  const captionRealSource = request.payload.compositionProfileId ===
    'caption_direction_real_source_scene_group_v2' ||
    request.payload.compositionProfileId ===
      'caption_direction_real_source_multi_output_scene_group_v3' ||
    request.payload.compositionProfileId ===
      'caption_direction_broll_owner_real_source_scene_group_v4' ||
    request.payload.compositionProfileId ===
      'caption_direction_broll_owner_approved_run_scene_group_v5'
    || request.payload.compositionProfileId ===
      'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6'
  const motionStudioComposition = scenePreview || layered || animatic || routeDraw
  const visualEvidenceComposition =
    motionStudioComposition || captionCreative || captionRealSource
  const goldenFrames = captionRealSource
    ? request.payload.inspectionFrameNumbers
    : captionCreative
    ? [...new Set([
        0,
        ...request.payload.layers.map((layer) => Math.floor(
          (layer.frameRange.startFrame + layer.frameRange.endFrameExclusive - 1) / 2,
        )),
        request.payload.durationFrames - 1,
      ])].sort((left, right) => left - right)
    : routeDraw
    ? [0, 45, 90, 135, 179]
    : motionStudioComposition
      ? [...new Set([
          0,
          Math.floor((request.payload.durationFrames - 1) / 2),
          request.payload.durationFrames - 1,
        ])]
      : []
  const goldenPaths = goldenFrames.map((frame) => ({
    frame,
    path: `/tmp/reeditpro-remotion-${sha256(requestJson).slice(0, 24)}-frame-${frame}.png`,
  }))
  const goldenFrameScale = request.payload.compositionProfileId ===
    'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6'
    ? 1 / 6
    : 1
  const browserExecutable = (await readFile('/app/browser-path.txt', 'utf8')).trim()
  if (!browserExecutable.startsWith('/app/node_modules/.remotion/chrome-headless-shell/')) {
    throw new Error('Prepared Remotion browser identity is invalid')
  }
  const longFormMerge =
    request.payload.compositionProfileId === LONG_FORM_MERGE_COMPOSITION_PROFILE
  const deliveryH264Chunk = request.payload.compositionProfileId ===
    DELIVERY_H264_CHUNK_COMPOSITION_PROFILE
  const finalComposition = [
    'approved_source_caption_final_v1',
    'approved_source_sequence_caption_final_v1',
    'approved_source_caption_track_final_v1',
    'approved_source_sequence_caption_track_final_v1',
    'caption_direction_real_source_scene_group_v2',
    'caption_direction_real_source_multi_output_scene_group_v3',
    'caption_direction_broll_owner_real_source_scene_group_v4',
    'caption_direction_broll_owner_approved_run_scene_group_v5',
    'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6',
    LONG_FORM_MERGE_COMPOSITION_PROFILE,
    DELIVERY_H264_CHUNK_COMPOSITION_PROFILE,
  ].includes(request.payload.compositionProfileId)
  const captionTrack = isCaptionTrackProfile(request.payload.compositionProfileId)
  const replaceVoice = finalComposition &&
    request.payload.audioPolicy === 'replace_with_approved_voice_tracks'
  const fourKDeliveryMaster = finalComposition && [
    'private_4k_delivery_master_v1',
    'private_4k_customer_delivery_video_chunk_v1',
  ].includes(request.payload.renderPurpose)
  const mediaServer = finalComposition
    ? await openPrivateLoopbackMediaServer(
        longFormMerge
          ? request.payload.chunks.map((chunk) => ({
              sourceSequenceItemId: chunk.outputKey,
              mimeType: 'video/mp4',
              path: chunk.chunkInternalFilePath,
              byteLength: chunk.chunkByteLength,
            }))
          : isSourceSequenceProfile(request.payload.compositionProfileId)
          ? request.payload.sources.map((source) => ({
              sourceSequenceItemId: source.sourceSequenceItemId,
              mimeType: source.sourceMimeType,
              ...committedMediaLocation(
                source,
                'sourceBytesBase64',
                'sourceInternalFilePath',
                source.sourceByteLength,
              ),
            }))
          : [{
              sourceSequenceItemId: 'single-approved-source',
              mimeType: request.payload.sourceMimeType,
              ...committedMediaLocation(
                request.payload,
                'sourceBytesBase64',
                'sourceInternalFilePath',
                request.payload.sourceByteLength,
              ),
            }],
        longFormMerge || deliveryH264Chunk || captionRealSource
          ? []
          : captionTrack
          ? request.payload.captionOverlays.map((overlay) => ({
              outputKey: overlay.outputKey,
              ...committedMediaLocation(
                overlay,
                'bytesBase64',
                'captionOverlayInternalFilePath',
                overlay.byteLength,
              ),
            }))
          : [{
              outputKey: 'legacy-caption-overlay',
              ...committedMediaLocation(
                request.payload,
                'captionOverlayBytesBase64',
                'captionOverlayInternalFilePath',
                request.payload.captionOverlayByteLength,
              ),
            }],
        !longFormMerge && replaceVoice
          ? request.payload.voiceTracks.map((track) => ({
              sourceSequenceItemId: track.sourceSequenceItemId,
              outputKey: track.outputKey,
              ...committedMediaLocation(
                track,
                'bytesBase64',
                'voiceTrackInternalFilePath',
                track.byteLength,
              ),
            }))
	          : [],
        {
          livingFrameOverlays:
            !longFormMerge && !deliveryH264Chunk &&
            Array.isArray(request.payload.livingFrameOverlays)
              ? request.payload.livingFrameOverlays.map((overlay) => ({
                  outputKey: overlay.outputKey,
                  ...committedMediaLocation(
                    overlay,
                    'bytesBase64',
                    'livingFrameOverlayInternalFilePath',
                    overlay.livingFrameOverlayByteLength,
                  ),
                }))
              : [],
          controlledVisualOverlays:
            !longFormMerge && !deliveryH264Chunk &&
            Array.isArray(request.payload.controlledVisualOverlays)
              ? request.payload.controlledVisualOverlays.map((overlay) => ({
                  outputKey: overlay.outputKey,
                  ...committedMediaLocation(
                    overlay,
                    'bytesBase64',
                    'controlledVisualOverlayInternalFilePath',
                    overlay.controlledVisualOverlayByteLength,
                  ),
                }))
              : [],
          supplementalAudioTracks:
            !longFormMerge && !deliveryH264Chunk &&
            Array.isArray(request.payload.supplementalAudioTracks)
              ? request.payload.supplementalAudioTracks.map((track) => ({
                  outputKey: track.outputKey,
                  attachmentId: track.attachmentId,
                  markerId: track.markerId,
                  ...committedMediaLocation(
                    track,
                    'bytesBase64',
                    'supplementalAudioInternalFilePath',
                    track.byteLength,
                  ),
                }))
              : [],
        },
      )
    : layered || animatic || routeDraw
      ? await openPrivateLoopbackMediaServer([], [], [], {
          ...(layered
            ? {
                subject: {
                  bytes: Buffer.from(request.payload.subjectBytesBase64, 'base64'),
                  byteLength: request.payload.subjectByteLength,
                  contentType: 'image/png',
                },
              }
            : {}),
          ...(animatic
            ? {
                narration: {
                  bytes: Buffer.from(request.payload.narrationBytesBase64, 'base64'),
                  byteLength: request.payload.narrationByteLength,
                  contentType: request.payload.narrationMimeType,
                },
              }
            : {}),
          ...(routeDraw
            ? {
                keyframe: {
                  bytes: Buffer.from(request.payload.keyframeBytesBase64, 'base64'),
                  byteLength: request.payload.keyframeByteLength,
                  contentType: 'image/png',
                },
              }
            : {}),
        })
    : null
  const captionRenderPayload = deliveryH264Chunk || captionRealSource
    ? {}
    : captionTrack
    ? {
        captionOverlayCues: request.payload.captionOverlayCues,
        captionOverlayInternalUrls: request.payload.captionOverlays.map((overlay, index) => ({
          outputKey: overlay.outputKey,
          captionOverlayInternalUrl: `${mediaServer.origin}/caption/${index}.png`,
        })),
      }
    : finalComposition
      ? { captionOverlayInternalUrl: `${mediaServer.origin}/caption/0.png` }
      : {}
  const livingFrameOverlayRenderPayload =
    Array.isArray(request.payload.livingFrameOverlayLayers) &&
    Array.isArray(request.payload.livingFrameOverlays) &&
    request.payload.livingFrameOverlayLayers.length > 0
      ? {
          livingFrameOverlayPolicy:
            'approved_rgba_over_source_below_captions_v1',
          livingFrameOverlays: request.payload.livingFrameOverlayLayers.map(
            (layer, index) => ({
              ...layer,
              livingFrameOverlayInternalUrl:
                `${mediaServer.origin}/living-frame/${index}.png`,
            }),
          ),
        }
      : {}
  const controlledVisualOverlayRenderPayload =
    Array.isArray(request.payload.controlledVisualOverlayLayers) &&
    Array.isArray(request.payload.controlledVisualOverlays) &&
    request.payload.controlledVisualOverlayLayers.length > 0
      ? {
          controlledVisualOverlayPolicy:
            'approved_structured_svg_below_captions_v1',
          controlledVisualOverlays:
            request.payload.controlledVisualOverlayLayers.map(
              (layer, index) => ({
                ...layer,
                controlledVisualOverlayInternalUrl:
                  `${mediaServer.origin}/controlled-visual/${index}.svg`,
              }),
            ),
        }
      : {}
  const voiceRenderPayload = replaceVoice
    ? {
        voiceTrackInternalUrls: request.payload.voiceTracks.map((track, index) => ({
          sourceSequenceItemId: track.sourceSequenceItemId,
          outputKey: track.outputKey,
          durationFrames: track.durationFrames,
          ...(track.sourceStartFrame === undefined
            ? {}
            : {
                sourceStartFrame: track.sourceStartFrame,
                sourceEndFrameExclusive: track.sourceEndFrameExclusive,
              }),
          voiceTrackInternalUrl: `${mediaServer.origin}/voice/${index}.wav`,
        })),
      }
    : {}
  const supplementalAudioRenderPayload =
    Array.isArray(request.payload.supplementalAudioTracks) &&
    request.payload.supplementalAudioTracks.length > 0
      ? {
          supplementalAudioTracks: request.payload.supplementalAudioTracks.map(
            (track, index) => ({
              outputKey: track.outputKey,
              attachmentId: track.attachmentId,
              markerId: track.markerId,
              markerType: track.markerType,
              startFrame: track.startFrame,
              endFrameExclusive: track.endFrameExclusive,
              fillPolicy: track.fillPolicy,
              mixProfileId: track.mixProfileId,
              supplementalAudioInternalUrl:
                `${mediaServer.origin}/supplemental/${index}.wav`,
            }),
          ),
        }
      : {}
  const renderPayload = captionRealSource
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        width: request.payload.width,
        height: request.payload.height,
        fps: request.payload.fps,
        durationFrames: request.payload.durationFrames,
        sceneGroupId: request.payload.sceneGroupId,
        sceneGroupDigestSha256: request.payload.sceneGroupDigestSha256,
        motionLockDigestSha256: request.payload.motionLockDigestSha256,
        storyTimingResolutionDigestSha256:
          request.payload.storyTimingResolutionDigestSha256,
        confirmedOutputWidth: request.payload.confirmedOutputWidth,
        confirmedOutputHeight: request.payload.confirmedOutputHeight,
        confirmedAspectRatioNumerator:
          request.payload.confirmedAspectRatioNumerator,
        confirmedAspectRatioDenominator:
          request.payload.confirmedAspectRatioDenominator,
        privateReviewScaleNumerator: request.payload.privateReviewScaleNumerator,
        privateReviewScaleDenominator: request.payload.privateReviewScaleDenominator,
        reducedMotion: request.payload.reducedMotion,
        subjectMaskFixturePolicy: request.payload.subjectMaskFixturePolicy,
        backgroundStyle: request.payload.backgroundStyle,
        sourceStartFrame: request.payload.sourceStartFrame,
        sourceEndFrameExclusive: request.payload.sourceEndFrameExclusive,
        sourceFit: request.payload.sourceFit,
        audioPolicy: request.payload.audioPolicy,
        sourceInternalUrl:
          `${mediaServer.origin}/source/0.${sourceExtension(request.payload.sourceMimeType)}`,
        captionCreativeLayers: request.payload.layers,
      }
    : captionCreative
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        width: request.payload.width,
        height: request.payload.height,
        fps: request.payload.fps,
        durationFrames: request.payload.durationFrames,
        sceneGroupId: request.payload.sceneGroupId,
        sceneGroupDigestSha256: request.payload.sceneGroupDigestSha256,
        motionLockDigestSha256: request.payload.motionLockDigestSha256,
        storyTimingResolutionDigestSha256:
          request.payload.storyTimingResolutionDigestSha256,
        confirmedOutputWidth: request.payload.confirmedOutputWidth,
        confirmedOutputHeight: request.payload.confirmedOutputHeight,
        confirmedAspectRatioNumerator:
          request.payload.confirmedAspectRatioNumerator,
        confirmedAspectRatioDenominator:
          request.payload.confirmedAspectRatioDenominator,
        privateReviewScaleNumerator: request.payload.privateReviewScaleNumerator,
        privateReviewScaleDenominator: request.payload.privateReviewScaleDenominator,
        reducedMotion: request.payload.reducedMotion,
        subjectMaskFixturePolicy: request.payload.subjectMaskFixturePolicy,
        backgroundStyle: request.payload.backgroundStyle,
        captionCreativeLayers: request.payload.layers,
      }
    : scenePreview
    ? request.payload
    : layered
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        width: request.payload.width,
        height: request.payload.height,
        fps: request.payload.fps,
        durationFrames: request.payload.durationFrames,
        sceneId: request.payload.sceneId,
        sceneStartFrame: request.payload.sceneStartFrame,
        sceneEndFrame: request.payload.sceneEndFrame,
        semanticPurpose: request.payload.semanticPurpose,
        headline: request.payload.headline,
        caption: request.payload.caption,
        layerManifestDigest: request.payload.layerManifestDigest,
        depthModel: request.payload.depthModel,
        planes: request.payload.planes,
        panelBackground: request.payload.panelBackground,
        panelHighlight: request.payload.panelHighlight,
        headlineColor: request.payload.headlineColor,
        accentColor: request.payload.accentColor,
        captionColor: request.payload.captionColor,
        horizontalSafePercent: request.payload.horizontalSafePercent,
        verticalSafePercent: request.payload.verticalSafePercent,
        captionBottomPercent: request.payload.captionBottomPercent,
        captionAboveMask: request.payload.captionAboveMask,
        contactObjectPresent: request.payload.contactObjectPresent,
        maskRisk: request.payload.maskRisk,
        subjectSha256: request.payload.subjectSha256,
        subjectInternalUrl: `${mediaServer.origin}/motion/subject.png`,
      }
    : animatic
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        width: request.payload.width,
        height: request.payload.height,
        fps: request.payload.fps,
        durationFrames: request.payload.durationFrames,
        scenes: request.payload.scenes,
        panelBackground: request.payload.panelBackground,
        accentColor: request.payload.accentColor,
        narrationInternalUrl: `${mediaServer.origin}/motion/narration`,
      }
    : routeDraw
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        width: request.payload.width,
        height: request.payload.height,
        fps: request.payload.fps,
        durationFrames: request.payload.durationFrames,
        sceneId: request.payload.sceneId,
        sceneStartFrame: request.payload.sceneStartFrame,
        sceneEndFrame: request.payload.sceneEndFrame,
        semanticPurpose: request.payload.semanticPurpose,
        routePresetId: request.payload.routePresetId,
        routeRevealStartFrame: request.payload.routeRevealStartFrame,
        routeRevealEndFrame: request.payload.routeRevealEndFrame,
        waypointFrames: request.payload.waypointFrames,
        routeCoverColor: request.payload.routeCoverColor,
        routeColor: request.payload.routeColor,
        routeGlowColor: request.payload.routeGlowColor,
        keyframeSha256: request.payload.keyframeSha256,
        keyframeInternalUrl: `${mediaServer.origin}/motion/keyframe.png`,
      }
    : deliveryH264Chunk
    ? {
        compositionProfileId: DELIVERY_H264_CHUNK_COMPOSITION_PROFILE,
        deliveryProfileId: 'uhd_2160',
        width: request.payload.width,
        height: request.payload.height,
        fps: request.payload.fps,
        durationFrames: request.payload.durationFrames,
        sourceInternalUrl: `${mediaServer.origin}/source/0.mkv`,
      }
    : longFormMerge
    ? {
        compositionProfileId: LONG_FORM_MERGE_COMPOSITION_PROFILE,
        deliveryProfileId: 'uhd_2160',
        width: request.payload.width, height: request.payload.height,
        fps: request.payload.fps, durationFrames: request.payload.durationFrames,
        chunkSegments: request.payload.chunks.map((chunk) => ({
          outputKey: chunk.outputKey,
          chunkIndex: chunk.chunkIndex,
          globalStartFrame: chunk.globalStartFrame,
          globalEndFrameExclusive: chunk.globalEndFrameExclusive,
          durationFrames: chunk.durationFrames,
        })),
        chunkInternalUrls: request.payload.chunks.map((chunk, index) => ({
          outputKey: chunk.outputKey,
          chunkIndex: chunk.chunkIndex,
          chunkInternalUrl: `${mediaServer.origin}/source/${index}.mp4`,
        })),
      }
    : isSourceSequenceProfile(request.payload.compositionProfileId)
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        ...(fourKDeliveryMaster ? { deliveryProfileId: 'uhd_2160' } : {}),
        width: request.payload.width, height: request.payload.height,
        fps: request.payload.fps, durationFrames: request.payload.durationFrames,
        sourceSegments: request.payload.sourceSegments,
        transitionPolicy: request.payload.transitionPolicy,
        ...(request.payload.transitionPolicy === 'approved_hard_cuts_only'
          ? { hardCutTransitions: request.payload.hardCutTransitions }
          : { sourceTransitions: request.payload.sourceTransitions }),
        sourceFit: request.payload.sourceFit, panelBackground: request.payload.panelBackground,
        audioPolicy: request.payload.audioPolicy, captionOverlayPolicy: request.payload.captionOverlayPolicy,
        sourceInternalUrls: request.payload.sources.map((source, index) => ({
          sourceSequenceItemId: source.sourceSequenceItemId,
          sourceInternalUrl: `${mediaServer.origin}/source/${index}.${sourceExtension(source.sourceMimeType)}`,
        })),
        ...livingFrameOverlayRenderPayload,
        ...controlledVisualOverlayRenderPayload,
        ...captionRenderPayload,
        ...voiceRenderPayload,
        ...supplementalAudioRenderPayload,
      }
    : finalComposition
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        ...(fourKDeliveryMaster ? { deliveryProfileId: 'uhd_2160' } : {}),
        width: request.payload.width, height: request.payload.height,
        fps: request.payload.fps, durationFrames: request.payload.durationFrames,
        sourceStartFrame: request.payload.sourceStartFrame,
        sourceEndFrameExclusive: request.payload.sourceEndFrameExclusive,
        sourceFit: request.payload.sourceFit, panelBackground: request.payload.panelBackground,
        audioPolicy: request.payload.audioPolicy, captionOverlayPolicy: request.payload.captionOverlayPolicy,
        ...(request.payload.sourceMediaPolicy === undefined
          ? {}
          : { sourceMediaPolicy: request.payload.sourceMediaPolicy }),
        ...(request.payload.brollPreviewLayer === undefined
          ? {}
          : { brollPreviewLayer: request.payload.brollPreviewLayer }),
        sourceInternalUrl: `${mediaServer.origin}/source/0.${sourceExtension(request.payload.sourceMimeType)}`,
        ...livingFrameOverlayRenderPayload,
        ...controlledVisualOverlayRenderPayload,
        ...captionRenderPayload,
        ...voiceRenderPayload,
        ...supplementalAudioRenderPayload,
      }
    : request.payload
  let retainStreamingOutput = false
  try {
    const composition = await selectComposition({
      serveUrl: '/opt/remotion-bundle',
      id: 'ReeditProApprovedComposition',
      inputProps: renderPayload,
      browserExecutable,
      chromeMode: 'headless-shell',
      logLevel: 'error',
      timeoutInMilliseconds: fourKDeliveryMaster ? 180_000 : 30_000,
      mediaCacheSizeInBytes: fourKDeliveryMaster ? 128 * 1024 * 1024 : 32 * 1024 * 1024,
      offthreadVideoCacheSizeInBytes: fourKDeliveryMaster ? 256 * 1024 * 1024 : 32 * 1024 * 1024,
      offthreadVideoThreads: 1,
    })
    if (
      composition.width !== request.payload.width || composition.height !== request.payload.height ||
      composition.fps !== request.payload.fps || composition.durationInFrames !== request.payload.durationFrames
    ) throw new Error('Selected composition metadata diverged from approved frame timing')
    const exactDurationSeconds = (composition.durationInFrames / composition.fps).toFixed(6)
    await renderMedia({
      serveUrl: '/opt/remotion-bundle',
      composition,
      inputProps: renderPayload,
      codec: 'h264',
      outputLocation: outputPath,
      browserExecutable,
      chromeMode: 'headless-shell',
      chromiumOptions: { enableMultiProcessOnLinux: true },
      imageFormat: 'jpeg',
      jpegQuality: fourKDeliveryMaster ? 95 : 80,
      crf: fourKDeliveryMaster ? 18 : 24,
      x264Preset: fourKDeliveryMaster ? 'medium' : 'veryfast',
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      ffmpegOverride: enforceFixedBt709H264Vui,
      muted: deliveryH264Chunk || !(finalComposition || animatic),
      ...(animatic ? { audioCodec: 'aac', sampleRate: 48_000 } : {}),
      concurrency: 1,
      disallowParallelEncoding: true,
      overwrite: false,
      logLevel: 'error',
      timeoutInMilliseconds: fourKDeliveryMaster ? 180_000 : 30_000,
      mediaCacheSizeInBytes: fourKDeliveryMaster ? 128 * 1024 * 1024 : 32 * 1024 * 1024,
      offthreadVideoCacheSizeInBytes: fourKDeliveryMaster ? 256 * 1024 * 1024 : 32 * 1024 * 1024,
      offthreadVideoThreads: 1,
    })
    if (animatic) {
      await constrainAnimaticDuration(
        outputPath,
        durationConstrainedOutputPath,
        exactDurationSeconds,
      )
    }
    for (const golden of goldenPaths) {
      await renderStill({
        serveUrl: '/opt/remotion-bundle',
        composition,
        inputProps: renderPayload,
        frame: golden.frame,
        output: golden.path,
        imageFormat: 'png',
        scale: goldenFrameScale,
        browserExecutable,
        chromeMode: 'headless-shell',
        chromiumOptions: { enableMultiProcessOnLinux: true },
        overwrite: false,
        logLevel: 'error',
        timeoutInMilliseconds: 30_000,
      })
    }
    if (options.streamingOutput === true) {
      const commitment = await inspectRenderedOutput(
        outputPath,
        options.maximumOutputBytes ?? MAXIMUM_STREAMING_OUTPUT_BYTES,
      )
      retainStreamingOutput = true
      return {
        artifact: {
          mimeType: 'video/mp4',
          byteLength: commitment.byteLength,
          sha256: commitment.sha256,
          width: composition.width,
          height: composition.height,
          fps: composition.fps,
          durationFrames: composition.durationInFrames,
          durationSeconds: Number((composition.durationInFrames / composition.fps).toFixed(6)),
        },
        outputPath,
      }
    }
    const bytes = await readFile(outputPath)
    if (bytes.byteLength < 1_024 || bytes.byteLength > MAXIMUM_OUTPUT_BYTES || bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
      throw new Error('Rendered MP4 artifact is invalid or outside bounds')
    }
    const frameArtifacts = []
    for (const golden of goldenPaths) {
      const imageBytes = await readFile(golden.path)
      if (
        imageBytes.byteLength < 1_024 || imageBytes.byteLength > 8 * 1024 * 1024 ||
        imageBytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
      ) throw new Error('Rendered frame-golden PNG is invalid or outside bounds')
      frameArtifacts.push({
        frame: golden.frame,
        mimeType: 'image/png',
        bytesBase64: imageBytes.toString('base64'),
        byteLength: imageBytes.byteLength,
        sha256: sha256(imageBytes),
      })
    }
    return {
      mimeType: 'video/mp4', bytesBase64: bytes.toString('base64'),
      byteLength: bytes.byteLength, sha256: sha256(bytes),
      width: composition.width, height: composition.height,
      fps: composition.fps, durationFrames: composition.durationInFrames,
      durationSeconds: Number((composition.durationInFrames / composition.fps).toFixed(6)),
      ...(visualEvidenceComposition ? { frameArtifacts } : {}),
    }
  } finally {
    if (!retainStreamingOutput) await rm(outputPath, { force: true }).catch(() => undefined)
    await rm(durationConstrainedOutputPath, { force: true }).catch(() => undefined)
    await Promise.all(
      goldenPaths.map((golden) => rm(golden.path, { force: true }).catch(() => undefined)),
    )
    await mediaServer?.close()
  }
}

async function constrainAnimaticDuration(inputPath, outputPath, exactDurationSeconds) {
  const ffmpeg = RenderInternals.getExecutablePath({
    type: 'ffmpeg',
    indent: false,
    logLevel: 'error',
    binariesDirectory: null,
  })
  await rm(outputPath, { force: true })
  await execFileAsync(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-i', inputPath,
    '-map', '0:v:0', '-map', '0:a:0', '-t', exactDurationSeconds,
    '-c', 'copy', '-map_metadata', '-1', '-movflags', 'faststart', '-y', outputPath,
  ], { timeout: 30_000, maxBuffer: 1024 * 1024 })
  await rm(inputPath, { force: true })
  await rename(outputPath, inputPath)
}

function committedMediaLocation(value, base64Key, pathKey, expectedByteLength) {
  if (typeof value[pathKey] === 'string') {
    return { path: value[pathKey], byteLength: expectedByteLength }
  }
  if (typeof value[base64Key] === 'string') {
    return { bytes: Buffer.from(value[base64Key], 'base64'), byteLength: expectedByteLength }
  }
  throw new Error('approved media location is unavailable')
}

async function inspectRenderedOutput(path, maximumBytes) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  let byteLength
  let signature
  try {
    const fileStat = await handle.stat()
    if (!fileStat.isFile() || fileStat.size < 1_024 || fileStat.size > maximumBytes) {
      throw new Error('rendered MP4 artifact is outside streaming bounds')
    }
    byteLength = fileStat.size
    signature = Buffer.alloc(8)
    const read = await handle.read(signature, 0, signature.length, 0)
    if (read.bytesRead !== signature.length || signature.subarray(4, 8).toString('ascii') !== 'ftyp') {
      throw new Error('rendered MP4 artifact signature is invalid')
    }
  } finally {
    await handle.close()
  }
  const checksum = createHash('sha256')
  let observedBytes = 0
  for await (const chunk of createReadStream(path)) {
    observedBytes += chunk.byteLength
    if (observedBytes > byteLength) throw new Error('rendered MP4 changed during hashing')
    checksum.update(chunk)
  }
  if (observedBytes !== byteLength) throw new Error('rendered MP4 changed during hashing')
  return { byteLength, sha256: checksum.digest('hex') }
}

async function openPrivateLoopbackMediaServer(sources, overlays, voiceTracks, motionAssets = {}) {
  const server = createServer((request, response) => {
    if (!request.url || !['GET', 'HEAD'].includes(request.method ?? '')) {
      response.writeHead(405).end()
      return
    }
    const sourceMatch = /^\/source\/(\d+)\.(mp4|mkv)$/.exec(request.url)
    if (sourceMatch) {
      const source = sources[Number(sourceMatch[1])]
      const expectedExtension = source ? sourceExtension(source.mimeType) : undefined
      if (!source || sourceMatch[2] !== expectedExtension) {
        response.writeHead(404).end()
        return
      }
      serveCommittedMedia(request, response, source, source.mimeType)
      return
    }
    const captionMatch = /^\/caption\/(\d+)\.png$/.exec(request.url)
    if (captionMatch) {
      const overlay = overlays[Number(captionMatch[1])]
      if (!overlay) {
        response.writeHead(404).end()
        return
      }
      serveCommittedMedia(request, response, overlay, 'image/png')
      return
    }
    const voiceMatch = /^\/voice\/(\d+)\.wav$/.exec(request.url)
    if (voiceMatch) {
      const voiceTrack = voiceTracks[Number(voiceMatch[1])]
      if (!voiceTrack) {
        response.writeHead(404).end()
        return
      }
      serveCommittedMedia(request, response, voiceTrack, 'audio/wav')
      return
    }
    const supplementalAudioMatch =
      /^\/supplemental\/(\d+)\.wav$/.exec(request.url)
    if (supplementalAudioMatch) {
      const track = motionAssets.supplementalAudioTracks?.[
        Number(supplementalAudioMatch[1])
      ]
      if (!track) {
        response.writeHead(404).end()
        return
      }
      serveCommittedMedia(request, response, track, 'audio/wav')
      return
    }
    const livingFrameOverlayMatch =
      /^\/living-frame\/(\d+)\.png$/.exec(request.url)
    if (livingFrameOverlayMatch) {
      const overlay = motionAssets.livingFrameOverlays?.[
        Number(livingFrameOverlayMatch[1])
      ]
      if (!overlay) {
        response.writeHead(404).end()
        return
      }
      serveCommittedMedia(request, response, overlay, 'image/png')
      return
    }
    const controlledVisualOverlayMatch =
      /^\/controlled-visual\/(\d+)\.svg$/.exec(request.url)
    if (controlledVisualOverlayMatch) {
      const overlay = motionAssets.controlledVisualOverlays?.[
        Number(controlledVisualOverlayMatch[1])
      ]
      if (!overlay) {
        response.writeHead(404).end()
        return
      }
      serveCommittedMedia(request, response, overlay, 'image/svg+xml')
      return
    }
    if (request.url === '/motion/subject.png' && motionAssets.subject) {
      serveCommittedMedia(
        request,
        response,
        motionAssets.subject,
        motionAssets.subject.contentType,
      )
      return
    }
    if (request.url === '/motion/narration' && motionAssets.narration) {
      serveCommittedMedia(
        request,
        response,
        motionAssets.narration,
        motionAssets.narration.contentType,
      )
      return
    }
    if (request.url === '/motion/keyframe.png' && motionAssets.keyframe) {
      serveCommittedMedia(
        request,
        response,
        motionAssets.keyframe,
        motionAssets.keyframe.contentType,
      )
      return
    }
    response.writeHead(404).end()
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string' || !Number.isSafeInteger(address.port)) {
    server.close()
    throw new Error('private loopback media server identity is invalid')
  }
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}

function sourceExtension(mimeType) {
  if (mimeType === 'video/mp4') return 'mp4'
  if (mimeType === 'video/x-matroska') return 'mkv'
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/svg+xml') return 'svg'
  if (mimeType === 'audio/wav') return 'wav'
  throw new Error('source MIME type is unsupported')
}

function approvedSourceSignature(bytes, mimeType) {
  return mimeType === 'video/mp4'
    ? bytes.subarray(4, 8).toString('ascii') === 'ftyp'
    : mimeType === 'video/x-matroska' && bytes.byteLength >= 4 &&
      bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
}

function serveCommittedBytes(request, response, bytes, contentType) {
  response.setHeader('Accept-Ranges', 'bytes')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Type', contentType)
  const range = request.headers.range
  if (typeof range === 'string') {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range)
    if (!match) {
      response.writeHead(416, { 'Content-Range': `bytes */${bytes.byteLength}` }).end()
      return
    }
    const start = Number(match[1])
    const end = match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= bytes.byteLength) {
      response.writeHead(416, { 'Content-Range': `bytes */${bytes.byteLength}` }).end()
      return
    }
    response.writeHead(206, {
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${bytes.byteLength}`,
    })
    if (request.method === 'HEAD') response.end()
    else response.end(bytes.subarray(start, end + 1))
    return
  }
  response.writeHead(200, { 'Content-Length': bytes.byteLength })
  if (request.method === 'HEAD') response.end()
  else response.end(bytes)
}

function serveCommittedMedia(request, response, media, contentType) {
  if (Buffer.isBuffer(media.bytes)) {
    serveCommittedBytes(request, response, media.bytes, contentType)
    return
  }
  if (typeof media.path !== 'string' || !media.path.startsWith('/tmp/reeditpro-stream-input-') ||
      !Number.isSafeInteger(media.byteLength) || media.byteLength < 1) {
    response.writeHead(404).end()
    return
  }
  response.setHeader('Accept-Ranges', 'bytes')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Type', contentType)
  const range = request.headers.range
  let start = 0
  let end = media.byteLength - 1
  if (typeof range === 'string') {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range)
    if (!match) {
      response.writeHead(416, { 'Content-Range': `bytes */${media.byteLength}` }).end()
      return
    }
    start = Number(match[1])
    end = match[2] ? Math.min(Number(match[2]), media.byteLength - 1) : media.byteLength - 1
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
        start < 0 || start > end || start >= media.byteLength) {
      response.writeHead(416, { 'Content-Range': `bytes */${media.byteLength}` }).end()
      return
    }
    response.writeHead(206, {
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${media.byteLength}`,
    })
  } else {
    response.writeHead(200, { 'Content-Length': media.byteLength })
  }
  if (request.method === 'HEAD') {
    response.end()
    return
  }
  const stream = createReadStream(media.path, { start, end })
  stream.once('error', () => response.destroy())
  stream.pipe(response)
}

class FramedStdinReader {
  constructor(stream) {
    this.iterator = stream[Symbol.asyncIterator]()
    this.buffer = Buffer.alloc(0)
    this.ended = false
  }

  async readLine(maximumBytes) {
    while (true) {
      const newlineIndex = this.buffer.indexOf(10)
      if (newlineIndex >= 0) {
        if (newlineIndex > maximumBytes) throw new Error('request header exceeded its byte ceiling')
        const line = this.buffer.subarray(0, newlineIndex)
        this.buffer = this.buffer.subarray(newlineIndex + 1)
        return line
      }
      if (this.buffer.byteLength > maximumBytes) {
        throw new Error('request header exceeded its byte ceiling')
      }
      const next = await this.iterator.next()
      if (next.done) {
        this.ended = true
        if (this.buffer.byteLength < 1 || this.buffer.byteLength > maximumBytes) {
          throw new Error('request header is incomplete')
        }
        const line = this.buffer
        this.buffer = Buffer.alloc(0)
        return line
      }
      const bytes = Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value)
      this.buffer = this.buffer.byteLength
        ? Buffer.concat([this.buffer, bytes])
        : bytes
    }
  }

  async readExactFile(path, expectedByteLength) {
    const handle = await open(
      path,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o600,
    )
    const checksum = createHash('sha256')
    const firstChunks = []
    let firstByteLength = 0
    let written = 0
    try {
      while (written < expectedByteLength) {
        if (this.buffer.byteLength === 0) {
          if (this.ended) throw new Error('streaming input ended before its exact byte commitment')
          const next = await this.iterator.next()
          if (next.done) {
            this.ended = true
            throw new Error('streaming input ended before its exact byte commitment')
          }
          this.buffer = Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value)
        }
        const take = Math.min(expectedByteLength - written, this.buffer.byteLength)
        const bytes = this.buffer.subarray(0, take)
        this.buffer = this.buffer.subarray(take)
        let offset = 0
        while (offset < bytes.byteLength) {
          const result = await handle.write(bytes, offset, bytes.byteLength - offset)
          if (result.bytesWritten < 1) throw new Error('streaming input file write stalled')
          offset += result.bytesWritten
        }
        checksum.update(bytes)
        if (firstByteLength < 64) {
          const first = bytes.subarray(0, Math.min(bytes.byteLength, 64 - firstByteLength))
          firstChunks.push(Buffer.from(first))
          firstByteLength += first.byteLength
        }
        written += bytes.byteLength
      }
      await handle.sync()
      return {
        byteLength: written,
        sha256: checksum.digest('hex'),
        firstBytes: Buffer.concat(firstChunks, firstByteLength),
      }
    } catch (error) {
      await rm(path, { force: true }).catch(() => undefined)
      throw error
    } finally {
      await handle.close().catch(() => undefined)
    }
  }

  async assertEnd() {
    if (this.buffer.byteLength > 0) throw new Error('request contains trailing bytes')
    while (!this.ended) {
      const next = await this.iterator.next()
      if (next.done) {
        this.ended = true
        return
      }
      const bytes = Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value)
      if (bytes.byteLength > 0) throw new Error('request contains trailing bytes')
    }
  }
}

function semanticEvidence(request, streaming) {
  return {
    remotionSelectCompositionExecuted: true,
    remotionRenderMediaExecuted: true,
    approvedFrameAndTimingPreserved: true,
    actualMp4ArtifactProduced: true,
    fixedBt709H264VuiParametersApplied: true,
    callerPathsUrlsCodeAndCommandsRejected: true,
    ...(streaming ? {
      serverInjectedInputStreamsMaterializedAndReverified: true,
      serverInjectedOutputStreamEmitted: true,
      base64MediaTransportAvoided: true,
      ...(request.payload.audioPolicy === 'replace_with_approved_voice_tracks'
        ? { approvedVoiceTrackInputStreamedWithoutWholeBuffer: true }
        : {}),
      ...(Array.isArray(request.payload.supplementalAudioTracks) &&
        request.payload.supplementalAudioTracks.length > 0
        ? { approvedSupplementalAudioInputStreamedWithoutWholeBuffer: true }
        : {}),
      ...(Array.isArray(request.payload.livingFrameOverlayLayers) &&
        request.payload.livingFrameOverlayLayers.length > 0
        ? { approvedLivingFrameOverlayInputServerInjectedWithoutBase64: true }
        : {}),
      ...(Array.isArray(request.payload.controlledVisualOverlayLayers) &&
        request.payload.controlledVisualOverlayLayers.length > 0
        ? {
            approvedControlledVisualOverlayInputServerInjectedWithoutBase64:
              true,
          }
        : {}),
    } : {}),
    ...(request.payload.renderPurpose === 'private_4k_delivery_master_v1'
      ? {
          approved4kDeliveryMasterAuthorityVerified: true,
          immutableSourceMasterNoProxyPolicyVerified: true,
          approvedReservationReuseOnly: true,
          secondEstimateOrExportChargeForbidden: true,
          professionalHighQualityEncodeApplied: true,
        }
      : {}),
    ...(request.payload.compositionProfileId ===
      DELIVERY_H264_CHUNK_COMPOSITION_PROFILE
      ? {
          approvedDeliveryH264ChunkProfileExecuted: true,
          exactPassedVp9ObjectChunkBytesVerified: true,
          sourceFrameCountPreserved: true,
          videoOnlyH264HighCrf18MediumApplied: true,
          fixedBt709LimitedRangePolicyApplied: true,
          approvedReservationReuseOnly: true,
          secondEstimateOrExportChargeForbidden: true,
        }
      : request.payload.compositionProfileId ===
        LONG_FORM_MERGE_COMPOSITION_PROFILE
      ? {
          approvedCompositionChunkBytesVerified: true,
          approvedCompositionChunkOrderApplied: true,
          approvedCompositionChunkFrameContinuityApplied: true,
          approvedCompositionChunkAudioPreserved: true,
          approvedCompositionChunkBoundaryAuthorityRead: true,
          ...(request.payload.longFormCapacityProfileId ===
            SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE
            ? { approvedCompositionSourceSliceContinuityApplied: true }
            : { approvedCompositionChunkHardCutsApplied: true }),
          approvedLongFormCapacityProfileVerified: true,
          finalCompositionProfileExecuted: true,
        }
      : ['approved_source_caption_final_v1', 'approved_source_caption_track_final_v1']
      .includes(request.payload.compositionProfileId)
      ? {
          approvedSourceBytesVerified: true,
          approvedCaptionOverlayBytesVerified: true,
          approvedSourceTrimFramesApplied: true,
          finalCompositionProfileExecuted: true,
          ...(request.payload.sourceMediaPolicy ===
            'approved_b_roll_qa_normalized_preview_proxy_v1'
            ? {
                approvedBrollQaNormalizedPreviewProxyVerified: true,
                approvedBrollTreatmentGeometryApplied: true,
                approvedBrollLayerOrderApplied: true,
                approvedBrollAudioRemovedUpstream: true,
              }
            : {}),
          ...(request.payload.audioPolicy === 'replace_with_approved_voice_tracks'
            ? {
                approvedVoiceTrackBytesVerified: true,
                approvedVoiceTrackReplacementRequested: true,
                approvedVoiceTrackTimelineApplied: true,
              }
            : { sourceAudioPreservationRequested: true }),
          ...(Array.isArray(request.payload.supplementalAudioTracks) &&
            request.payload.supplementalAudioTracks.length > 0
            ? {
                approvedSupplementalAudioBytesVerified: true,
                approvedSupplementalAudioTimelineApplied: true,
                approvedSupplementalAudioSpeechSafeMixApplied: true,
              }
            : {}),
          ...(Array.isArray(request.payload.livingFrameOverlayLayers) &&
            request.payload.livingFrameOverlayLayers.length > 0
            ? {
                approvedLivingFrameOverlayBytesVerified: true,
                approvedLivingFrameOverlayTimelineApplied: true,
                approvedLivingFrameOverlayBelowCaptionsApplied: true,
              }
            : {}),
          ...(Array.isArray(request.payload.controlledVisualOverlayLayers) &&
            request.payload.controlledVisualOverlayLayers.length > 0
            ? {
                approvedControlledVisualOverlayBytesVerified: true,
                approvedControlledVisualOverlayTimelineApplied: true,
                approvedControlledVisualOverlayBelowCaptionsApplied: true,
              }
            : {}),
          ...(isCaptionTrackProfile(request.payload.compositionProfileId)
            ? { approvedCaptionTrackTimingApplied: true }
            : {}),
        }
      : isSourceSequenceProfile(request.payload.compositionProfileId)
        ? {
            approvedSourceBytesVerified: true,
            approvedSourceSequenceBytesVerified: true,
            approvedCaptionOverlayBytesVerified: true,
            approvedSourceTrimFramesApplied: true,
            approvedSourceSequenceTimelineApplied: true,
            ...(request.payload.transitionPolicy === 'approved_hard_cuts_only'
              ? {
                  approvedHardCutTransitionAuthorityRead: true,
                  approvedHardCutTransitionsApplied: true,
                }
              : {
                  approvedBoundedSourceTransitionAuthorityRead: true,
                  approvedSmoothPanelDipsApplied: true,
                }),
            approvedTransitionAudioHardCutsPreserved: true,
            finalCompositionProfileExecuted: true,
            ...(request.payload.audioPolicy === 'replace_with_approved_voice_tracks'
              ? {
                  approvedVoiceTrackBytesVerified: true,
                  approvedVoiceTrackReplacementRequested: true,
                  approvedVoiceTrackTimelineApplied: true,
                }
              : { sourceAudioPreservationRequested: true }),
            ...(Array.isArray(request.payload.supplementalAudioTracks) &&
              request.payload.supplementalAudioTracks.length > 0
              ? {
                  approvedSupplementalAudioBytesVerified: true,
                  approvedSupplementalAudioTimelineApplied: true,
                  approvedSupplementalAudioSpeechSafeMixApplied: true,
                }
              : {}),
            ...(Array.isArray(request.payload.livingFrameOverlayLayers) &&
              request.payload.livingFrameOverlayLayers.length > 0
              ? {
                  approvedLivingFrameOverlayBytesVerified: true,
                  approvedLivingFrameOverlayTimelineApplied: true,
                  approvedLivingFrameOverlayBelowCaptionsApplied: true,
                }
              : {}),
            ...(Array.isArray(request.payload.controlledVisualOverlayLayers) &&
              request.payload.controlledVisualOverlayLayers.length > 0
              ? {
                  approvedControlledVisualOverlayBytesVerified: true,
                  approvedControlledVisualOverlayTimelineApplied: true,
                  approvedControlledVisualOverlayBelowCaptionsApplied: true,
                }
              : {}),
            ...(isCaptionTrackProfile(request.payload.compositionProfileId)
              ? { approvedCaptionTrackTimingApplied: true }
              : {}),
          }
        : [
            'caption_direction_real_source_scene_group_v2',
            'caption_direction_real_source_multi_output_scene_group_v3',
            'caption_direction_broll_owner_real_source_scene_group_v4',
            'caption_direction_broll_owner_approved_run_scene_group_v5',
            'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6',
          ].includes(request.payload.compositionProfileId)
          ? {
              captionRealSourceSceneGroupCompositionExecuted: true,
              approvedCaptionPrivateReviewProxyBytesVerified: true,
              ...(request.payload.compositionProfileId ===
                'caption_direction_broll_owner_real_source_scene_group_v4' ||
                request.payload.compositionProfileId ===
                  'caption_direction_broll_owner_approved_run_scene_group_v5' ||
                request.payload.compositionProfileId ===
                  'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6'
                ? {}
                : { exactOriginalSourceRangeAndDigestConsumed: true }),
              fixtureSpecificHumanReviewedWordingConsumed: true,
              phraseLevelOnlyWithoutWordLockedMotionPreserved: true,
              canonicalTranscriptQualificationNotClaimed: true,
              exactSceneGroupDigestConsumed: true,
              exactMotionLockDigestConsumed: true,
              exactStoryTimingResolutionDigestConsumed: true,
              confirmedOutputFrameAndReviewProxyRatioPreserved: true,
              boundedMultiTrackLayerOrderPreserved: true,
              stableAccessibleCaptionAboveVisualLayersPreserved: true,
              ...(request.payload.compositionProfileId ===
                'caption_direction_real_source_multi_output_scene_group_v3'
                ? {
                    editorialSidecarFaceAndGestureAvoidanceApplied: true,
                    realSourceEditorialSplitCompositionApplied: true,
                    realSourcePixelsRequiredForProfessionalAppearancePreserved:
                      true,
                    syntheticEngineeringFixtureProfessionalAppearanceRejected:
                      true,
                  }
                : request.payload.compositionProfileId ===
                  'caption_direction_broll_owner_real_source_scene_group_v4' ||
                  request.payload.compositionProfileId ===
                    'caption_direction_broll_owner_approved_run_scene_group_v5' ||
                  request.payload.compositionProfileId ===
                    'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6'
                  ? {
                      brollOwnerSelectedMediaLineageConsumed: true,
                      brollOwnerLayoutOccupancyLineageConsumed: true,
                      brollOwnerCropTimingLineageConsumed: true,
                      brollOwnerVisibleTextEvidenceLineageConsumed: true,
                      exactBrollMasterTimelineRangeConsumed: true,
                      approvedBrollNormalizedPreviewProxyBytesVerified: true,
                      brollSourceSelectionRemainedExternalToCaption: true,
                      brollCropAndTimingRemainedExternalToCaption: true,
                      brollFullFrameCutawayCompositionApplied: true,
                      brollLowerSafeCaptionBandApplied: true,
                      realSourcePixelsRequiredForProfessionalAppearancePreserved:
                        true,
                      syntheticEngineeringFixtureProfessionalAppearanceRejected:
                        true,
                      sourceAudioAbsenceFromOwnerNormalizationPreserved: true,
                      ...(request.payload.compositionProfileId ===
                        'caption_direction_broll_owner_approved_run_scene_group_v5' ||
                      request.payload.compositionProfileId ===
                        'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6'
                        ? {
                            exactImmutableApprovedRunLineageConsumed: true,
                            exactCanonicalTranscriptLineageConsumed: true,
                            completeTimeInspectionRequirementPreserved: true,
                            creativeReviewDidNotReplaceCanonicalFinalCanvas: true,
                            ...(request.payload.compositionProfileId ===
                              'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6'
                              ? {
                                  exactConfirmedOutputFrameRendered: true,
                                  sourceProxyUpscaleDisclosed: true,
                                  sourceProxyFinalPictureQualityNotClaimed: true,
                                }
                              : {}),
                          }
                        : {}),
                    }
                : { safeTopPlaneFaceAndGestureAvoidanceApplied: true }),
              requestedMotionVariantApplied: true,
              ...(request.payload.compositionProfileId ===
                'caption_direction_broll_owner_real_source_scene_group_v4' ||
                request.payload.compositionProfileId ===
                  'caption_direction_broll_owner_approved_run_scene_group_v5' ||
                request.payload.compositionProfileId ===
                  'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6'
                ? { sourceAudioPreservationNotRequested: true }
                : { sourceAudioPreservationRequested: true }),
              trackAllRuntimeEvidenceNotClaimed: true,
              frameGoldenArtifactsProduced: true,
            }
        : request.payload.compositionProfileId ===
          'caption_direction_creative_scene_group_v1'
          ? {
              captionCreativeSceneGroupCompositionExecuted: true,
              exactSceneGroupDigestConsumed: true,
              exactMotionLockDigestConsumed: true,
              exactStoryTimingResolutionDigestConsumed: true,
              confirmedOutputFrameAndReviewProxyRatioPreserved: true,
              boundedMultiTrackLayerOrderPreserved: true,
              stableAccessibleCaptionAboveVisualLayersPreserved: true,
              requestedMotionVariantApplied: true,
              trackAllRuntimeEvidenceNotClaimed: true,
              deterministicFixtureSubjectMaskDisclosed: true,
              legacyFullFrameRgbaFallbackPreserved: true,
              remotionRenderStillExecuted: true,
              frameGoldenArtifactsProduced: true,
            }
        : request.payload.compositionProfileId === 'motion_studio_scene_preview_v1'
          ? {
              motionStudioScenePreviewCompositionExecuted: true,
              remotionRenderStillExecuted: true,
              frameGoldenArtifactsProduced: true,
            }
        : request.payload.compositionProfileId === 'motion_studio_native_layered_scene_v1'
          ? {
              motionStudioNativeLayeredCompositionExecuted: true,
              approvedSubjectCutoutBytesVerified: true,
              semanticFourPlaneDepthOrderPreserved: true,
              nativeBackgroundAndHeadlineRendered: true,
              subjectParallaxRendered: true,
              captionAboveMaskRendered: true,
              contactObjectPolicyPreserved: true,
              remotionRenderStillExecuted: true,
              frameGoldenArtifactsProduced: true,
            }
        : request.payload.compositionProfileId === 'motion_studio_deterministic_route_draw_v1'
          ? {
              motionStudioDeterministicRouteDrawCompositionExecuted: true,
              approvedKeyframeBytesVerified: true,
              exactRoutePresetPreserved: true,
              exactRouteRevealTimingPreserved: true,
              deterministicWaypointTimingPreserved: true,
              routeDrawOwnedByRemotion: true,
              providerVideoNotRequired: true,
              remotionRenderStillExecuted: true,
              frameGoldenArtifactsProduced: true,
            }
        : request.payload.compositionProfileId === 'motion_studio_prepared_script_animatic_v1'
          ? {
              motionStudioPreparedAnimaticCompositionExecuted: true,
              approvedNarrationBytesVerified: true,
              narrationAudioCompositionRequested: true,
              oneFrameDurationTailConstrained: true,
              deterministicSceneCoveragePreserved: true,
              reviewOnlyPlaceholderDisclosureRendered: true,
              remotionRenderStillExecuted: true,
              frameGoldenArtifactsProduced: true,
            }
        : { boundedPreviewCompositionProfileExecuted: true }),
  }
}

function responseEnvelope(schemaVersion, requestEnvelopeSha256, artifact, request, streaming) {
  return {
    schemaVersion,
    ok: true,
    toolId: 'remotion',
    operationId: OPERATION,
    status: 'actual_remotion_media_render_completed',
    packageIdentity: { packageName: 'remotion+@remotion/renderer', version: remotionVersion },
    requestEnvelopeSha256,
    artifact,
    semanticEvidence: semanticEvidence(request, streaming),
    readiness: {
      privateInternalOnly: true,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      privateInternalFinalCompositionReady: true,
      ...(request.payload.compositionProfileId === LONG_FORM_MERGE_COMPOSITION_PROFILE
        ? { privateInternalLongFormMergeReady: true }
        : {}),
      ...(request.payload.compositionProfileId ===
        DELIVERY_H264_CHUNK_COMPOSITION_PROFILE
        ? { privateInternalDeliveryH264ChunkReady: true }
        : {}),
    },
  }
}

async function writeFileToStdout(path) {
  for await (const chunk of createReadStream(path)) {
    if (!process.stdout.write(chunk)) await once(process.stdout, 'drain')
  }
}

const reader = new FramedStdinReader(process.stdin)
let streamingHeaderWritten = false
let streamingFiles = []
let streamingOutputPath
let executionStage = 'read_request'
try {
  const rawHeader = await reader.readLine(MAXIMUM_REQUEST_BYTES)
  const parsed = JSON.parse(rawHeader.toString('utf8'))
  if (parsed?.schemaVersion === DELIVERY_H264_CHUNK_STREAMING_PROTOCOL) {
    executionStage = 'validate_request'
    if (rawHeader.byteLength > MAXIMUM_DELIVERY_H264_CHUNK_MANIFEST_BYTES) {
      throw new Error('delivery H.264 chunk manifest exceeded its metadata ceiling')
    }
    const manifest = validateDeliveryH264ChunkManifest(parsed)
    executionStage = 'materialize_private_inputs'
    const materialized = await materializeDeliveryH264ChunkRequest(
      manifest,
      reader,
      sha256(rawHeader),
    )
    streamingFiles = materialized.materialized
    executionStage = 'render_media'
    const execution = await execute(materialized.request, {
      streamingOutput: true,
      maximumOutputBytes: MAXIMUM_DELIVERY_H264_CHUNK_OUTPUT_BYTES,
    })
    streamingOutputPath = execution.outputPath
    const response = responseEnvelope(
      DELIVERY_H264_CHUNK_STREAMING_CONTAINER_PROTOCOL,
      sha256(rawHeader),
      execution.artifact,
      materialized.request,
      true,
    )
    executionStage = 'commit_output'
    process.stdout.write(`${JSON.stringify(response)}\n`)
    streamingHeaderWritten = true
    await writeFileToStdout(execution.outputPath)
  } else if (parsed?.schemaVersion === LONG_FORM_MERGE_STREAMING_PROTOCOL) {
    executionStage = 'validate_request'
    if (rawHeader.byteLength > MAXIMUM_STREAMING_MANIFEST_BYTES) {
      throw new Error('long-form merge manifest exceeded its metadata ceiling')
    }
    const manifest = validateLongFormMergeManifest(parsed)
    executionStage = 'materialize_private_inputs'
    const materialized = await materializeLongFormMergeRequest(
      manifest,
      reader,
      sha256(rawHeader),
    )
    streamingFiles = materialized.materialized
    executionStage = 'render_media'
    const execution = await execute(materialized.request, { streamingOutput: true })
    streamingOutputPath = execution.outputPath
    const response = responseEnvelope(
      LONG_FORM_MERGE_STREAMING_CONTAINER_PROTOCOL,
      sha256(rawHeader),
      execution.artifact,
      materialized.request,
      true,
    )
    executionStage = 'commit_output'
    process.stdout.write(`${JSON.stringify(response)}\n`)
    streamingHeaderWritten = true
    await writeFileToStdout(execution.outputPath)
  } else if (parsed?.schemaVersion === STREAMING_PROTOCOL) {
    executionStage = 'validate_request'
    if (rawHeader.byteLength > MAXIMUM_STREAMING_MANIFEST_BYTES) {
      throw new Error('streaming manifest exceeded its metadata ceiling')
    }
    const manifest = validateStreamingManifest(parsed)
    executionStage = 'materialize_private_inputs'
    const materialized = await materializeStreamingRequest(
      manifest,
      reader,
      sha256(rawHeader),
    )
    streamingFiles = materialized.materialized
    executionStage = 'render_media'
    const execution = await execute(materialized.request, { streamingOutput: true })
    streamingOutputPath = execution.outputPath
    const response = responseEnvelope(
      STREAMING_CONTAINER_PROTOCOL,
      sha256(rawHeader),
      execution.artifact,
      materialized.request,
      true,
    )
    executionStage = 'commit_output'
    process.stdout.write(`${JSON.stringify(response)}\n`)
    streamingHeaderWritten = true
    await writeFileToStdout(execution.outputPath)
  } else {
    executionStage = 'validate_request'
    await reader.assertEnd()
    const request = validateRequest(parsed)
    executionStage = 'render_media'
    const artifact = await execute(request)
    executionStage = 'commit_output'
    process.stdout.write(JSON.stringify(responseEnvelope(
      'offline-remotion-render-execution-container-v1',
      sha256(JSON.stringify(request)),
      artifact,
      request,
      false,
    )))
  }
} catch (error) {
  const diagnostic = executionFailureDiagnostic(error, executionStage)
  process.stderr.write('Private Remotion execution failed.\n')
  if (!streamingHeaderWritten) {
    process.stdout.write(`${JSON.stringify({
      ok: false,
      code: 'EXECUTION_FAILED',
      ...diagnostic,
    })}\n`)
  }
  process.exitCode = 3
} finally {
  if (streamingOutputPath) await rm(streamingOutputPath, { force: true }).catch(() => undefined)
  await Promise.all(streamingFiles.map((input) => rm(input.path, { force: true })))
}
