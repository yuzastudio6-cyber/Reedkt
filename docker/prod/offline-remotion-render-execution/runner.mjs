import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'

import { renderMedia, selectComposition } from '@remotion/renderer'

const require = createRequire(import.meta.url)
const remotionVersion = require('remotion/package.json').version
const rendererVersion = require('@remotion/renderer/package.json').version
const PROTOCOL = 'offline-remotion-render-execution-v1'
const OPERATION = 'tool.remotion.render_approved_composition.v1'
const MAXIMUM_REQUEST_BYTES = 48 * 1024 * 1024
const MAXIMUM_OUTPUT_BYTES = 16 * 1024 * 1024
const MAXIMUM_COMBINED_VOICE_TRACK_BYTES = 2 * 1024 * 1024
const FORBIDDEN_TEXT = /(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|[A-Za-z]:[\\/]|(?:^|\s)\/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:\/|\b)|\$\(|`|&&|\|\||#!)/i

const canonical = (value) => JSON.stringify(value, Object.keys(value).sort())
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

function exactObject(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  const actual = Object.keys(value).sort().join('|')
  const expected = [...keys].sort().join('|')
  if (actual !== expected) throw new Error(`${label} contains unsupported fields`)
  return value
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

function validateSourceSegments(value, durationFrames) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 8) {
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
    const timelineStartFrame = integer(segment.timelineStartFrame, 0, 240, 'timelineStartFrame')
    const timelineEndFrameExclusive = integer(segment.timelineEndFrameExclusive, 1, 240, 'timelineEndFrameExclusive')
    if (
      seen.has(sourceSequenceItemId) || timelineStartFrame !== expectedTimelineStart ||
      sourceEndFrameExclusive <= sourceStartFrame || timelineEndFrameExclusive <= timelineStartFrame ||
      sourceEndFrameExclusive - sourceStartFrame !== timelineEndFrameExclusive - timelineStartFrame
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
      boundaryFrame: integer(transition.boundaryFrame, 1, 239, 'boundaryFrame'),
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

function isSourceSequenceProfile(value) {
  return value === 'approved_source_sequence_caption_final_v1' ||
    value === 'approved_source_sequence_caption_track_final_v1'
}

function isCaptionTrackProfile(value) {
  return value === 'approved_source_caption_track_final_v1' ||
    value === 'approved_source_sequence_caption_track_final_v1'
}

function validateCaptionOverlayCues(value, durationFrames) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 7) {
    throw new Error('caption track requires two to seven cues')
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
    const track = exactObject(candidate, [
      'sourceSequenceItemId', 'outputKey', 'durationFrames',
      'mimeType', 'byteLength', 'sha256', 'bytesBase64',
    ], `voice-track commitment ${index + 1}`)
    const sourceSequenceItemId = safeIdentity(
      track.sourceSequenceItemId,
      'voice-track sourceSequenceItemId',
    )
    const outputKey = safeIdentity(track.outputKey, 'voice-track outputKey')
    const durationFrames = integer(track.durationFrames, 1, 240, 'voice-track durationFrames')
    if (
      sourceIds.has(sourceSequenceItemId) || outputKeys.has(outputKey) ||
      (expected[index].sourceSequenceItemId !== undefined &&
        sourceSequenceItemId !== expected[index].sourceSequenceItemId) ||
      durationFrames !== expected[index].durationFrames || track.mimeType !== 'audio/wav' ||
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

function validatePcmVoiceTrack(bytes, durationFrames, fps) {
  if (
    bytes.byteLength < 44 || bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) throw new Error('voice track is not RIFF/WAVE')
  const formatOffset = bytes.indexOf(Buffer.from('fmt '))
  const dataOffset = bytes.indexOf(Buffer.from('data'))
  if (
    formatOffset < 12 || dataOffset <= formatOffset || formatOffset + 24 > bytes.byteLength ||
    dataOffset + 8 > bytes.byteLength || bytes.readUInt16LE(formatOffset + 8) !== 1
  ) throw new Error('voice track is not linear PCM WAV')
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
  ) throw new Error('voice track does not match fixed 48 kHz stereo frame duration')
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

function validateRequest(value) {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== PROTOCOL || request.toolId !== 'remotion' || request.operationId !== OPERATION) {
    throw new Error('request identity is unsupported')
  }
  const rawPayload = request.payload
  if (rawPayload && typeof rawPayload === 'object' && isSourceSequenceProfile(rawPayload.compositionProfileId)) {
    const captionTrack = rawPayload.compositionProfileId === 'approved_source_sequence_caption_track_final_v1'
    const replaceVoice = rawPayload.audioPolicy === 'replace_with_approved_voice_tracks'
    const sourceMediaPolicyProvided = Object.hasOwn(rawPayload, 'sourceMediaPolicy')
    const payload = exactObject(rawPayload, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sourceSegments', 'transitionPolicy', 'hardCutTransitions',
      'sourceFit', 'panelBackground', 'audioPolicy',
      ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
      'captionOverlayPolicy', ...(captionTrack ? ['captionOverlayCues'] : []), 'sources',
      ...(captionTrack
        ? ['captionOverlays']
        : ['captionOverlayMimeType', 'captionOverlayByteLength', 'captionOverlaySha256', 'captionOverlayBytesBase64']),
      ...(replaceVoice ? ['voiceTracks'] : []),
    ], 'source-sequence final composition payload')
    const dimensions = `${payload.width}x${payload.height}`
    oneOf(dimensions, ['360x640', '640x360', '480x480', '480x600'], 'approved frame')
    const durationFrames = integer(payload.durationFrames, 24, 240, 'durationFrames')
    const fps = oneOf(payload.fps, [24, 30], 'fps')
    const sourceSegments = validateSourceSegments(payload.sourceSegments, durationFrames)
    const approvedColorIntermediate =
      payload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
    if (
      (sourceMediaPolicyProvided && !approvedColorIntermediate) ||
      (approvedColorIntermediate && (
        payload.audioPolicy !== 'replace_with_approved_voice_tracks' ||
        sourceSegments.some((segment) =>
          segment.sourceStartFrame !== 0 ||
          segment.sourceEndFrameExclusive !==
            segment.timelineEndFrameExclusive - segment.timelineStartFrame)
      ))
    ) throw new Error('source-sequence color intermediate policy is unsupported')
    const hardCutTransitions = validateApprovedHardCuts(
      payload.hardCutTransitions,
      sourceSegments,
    )
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
      payload.transitionPolicy !== 'approved_hard_cuts_only' ||
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
        width: integer(payload.width, 360, 720, 'width'), height: integer(payload.height, 360, 720, 'height'),
        fps, durationFrames, sourceSegments,
        transitionPolicy: 'approved_hard_cuts_only', hardCutTransitions, sources,
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
    const payload = exactObject(rawPayload, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit',
      'panelBackground', 'audioPolicy', 'captionOverlayPolicy',
      ...(sourceMediaPolicyProvided ? ['sourceMediaPolicy'] : []),
      'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
      ...(captionTrack
        ? ['captionOverlayCues', 'captionOverlays']
        : ['captionOverlayMimeType', 'captionOverlayByteLength', 'captionOverlaySha256', 'captionOverlayBytesBase64']),
      ...(replaceVoice ? ['voiceTracks'] : []),
    ], 'final composition payload')
    const dimensions = `${payload.width}x${payload.height}`
    oneOf(dimensions, ['360x640', '640x360', '480x480', '480x600'], 'approved frame')
    const approvedColorIntermediate =
      payload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
    if (sourceMediaPolicyProvided && !approvedColorIntermediate) {
      throw new Error('source media policy is unsupported')
    }
    const sourceMimeType = approvedColorIntermediate ? 'video/x-matroska' : 'video/mp4'
    const source = committedBase64(
      payload,
      'source',
      sourceMimeType,
      64,
      16 * 1024 * 1024,
    )
    const durationFrames = integer(payload.durationFrames, 24, 240, 'durationFrames')
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
        payload.audioPolicy !== 'replace_with_approved_voice_tracks' ||
        sourceStartFrame !== 0 || sourceEndFrameExclusive !== durationFrames
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
        width: integer(payload.width, 360, 720, 'width'), height: integer(payload.height, 360, 720, 'height'),
        fps, durationFrames,
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
  oneOf(dimensions, ['360x640', '640x360', '480x480', '480x600'], 'approved frame')
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

async function execute(request) {
  if (remotionVersion !== '4.0.487' || rendererVersion !== '4.0.487') throw new Error('Remotion package identity mismatch')
  const requestJson = JSON.stringify(request)
  const outputPath = `/tmp/reeditpro-remotion-${sha256(requestJson).slice(0, 24)}.mp4`
  const browserExecutable = (await readFile('/app/browser-path.txt', 'utf8')).trim()
  if (!browserExecutable.startsWith('/app/node_modules/.remotion/chrome-headless-shell/')) {
    throw new Error('Prepared Remotion browser identity is invalid')
  }
  const finalComposition = [
    'approved_source_caption_final_v1',
    'approved_source_sequence_caption_final_v1',
    'approved_source_caption_track_final_v1',
    'approved_source_sequence_caption_track_final_v1',
  ].includes(request.payload.compositionProfileId)
  const captionTrack = isCaptionTrackProfile(request.payload.compositionProfileId)
  const replaceVoice = finalComposition &&
    request.payload.audioPolicy === 'replace_with_approved_voice_tracks'
  const mediaServer = finalComposition
    ? await openPrivateLoopbackMediaServer(
        isSourceSequenceProfile(request.payload.compositionProfileId)
          ? request.payload.sources.map((source) => ({
              sourceSequenceItemId: source.sourceSequenceItemId,
              mimeType: source.sourceMimeType,
              bytes: Buffer.from(source.sourceBytesBase64, 'base64'),
            }))
          : [{
              sourceSequenceItemId: 'single-approved-source',
              mimeType: request.payload.sourceMimeType,
              bytes: Buffer.from(request.payload.sourceBytesBase64, 'base64'),
            }],
        captionTrack
          ? request.payload.captionOverlays.map((overlay) => ({
              outputKey: overlay.outputKey,
              bytes: Buffer.from(overlay.bytesBase64, 'base64'),
            }))
          : [{
              outputKey: 'legacy-caption-overlay',
              bytes: Buffer.from(request.payload.captionOverlayBytesBase64, 'base64'),
            }],
        replaceVoice
          ? request.payload.voiceTracks.map((track) => ({
              sourceSequenceItemId: track.sourceSequenceItemId,
              outputKey: track.outputKey,
              bytes: Buffer.from(track.bytesBase64, 'base64'),
            }))
          : [],
      )
    : null
  const captionRenderPayload = captionTrack
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
  const voiceRenderPayload = replaceVoice
    ? {
        voiceTrackInternalUrls: request.payload.voiceTracks.map((track, index) => ({
          sourceSequenceItemId: track.sourceSequenceItemId,
          outputKey: track.outputKey,
          voiceTrackInternalUrl: `${mediaServer.origin}/voice/${index}.wav`,
        })),
      }
    : {}
  const renderPayload = isSourceSequenceProfile(request.payload.compositionProfileId)
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        width: request.payload.width, height: request.payload.height,
        fps: request.payload.fps, durationFrames: request.payload.durationFrames,
        sourceSegments: request.payload.sourceSegments,
        transitionPolicy: request.payload.transitionPolicy,
        hardCutTransitions: request.payload.hardCutTransitions,
        sourceFit: request.payload.sourceFit, panelBackground: request.payload.panelBackground,
        audioPolicy: request.payload.audioPolicy, captionOverlayPolicy: request.payload.captionOverlayPolicy,
        sourceInternalUrls: request.payload.sources.map((source, index) => ({
          sourceSequenceItemId: source.sourceSequenceItemId,
          sourceInternalUrl: `${mediaServer.origin}/source/${index}.${sourceExtension(source.sourceMimeType)}`,
        })),
        ...captionRenderPayload,
        ...voiceRenderPayload,
      }
    : finalComposition
    ? {
        compositionProfileId: request.payload.compositionProfileId,
        width: request.payload.width, height: request.payload.height,
        fps: request.payload.fps, durationFrames: request.payload.durationFrames,
        sourceStartFrame: request.payload.sourceStartFrame,
        sourceEndFrameExclusive: request.payload.sourceEndFrameExclusive,
        sourceFit: request.payload.sourceFit, panelBackground: request.payload.panelBackground,
        audioPolicy: request.payload.audioPolicy, captionOverlayPolicy: request.payload.captionOverlayPolicy,
        sourceInternalUrl: `${mediaServer.origin}/source/0.${sourceExtension(request.payload.sourceMimeType)}`,
        ...captionRenderPayload,
        ...voiceRenderPayload,
      }
    : request.payload
  try {
    const composition = await selectComposition({
      serveUrl: '/opt/remotion-bundle',
      id: 'ReeditProApprovedComposition',
      inputProps: renderPayload,
      browserExecutable,
      chromeMode: 'headless-shell',
      logLevel: 'error',
      timeoutInMilliseconds: 30_000,
      mediaCacheSizeInBytes: 32 * 1024 * 1024,
      offthreadVideoCacheSizeInBytes: 32 * 1024 * 1024,
      offthreadVideoThreads: 1,
    })
    if (
      composition.width !== request.payload.width || composition.height !== request.payload.height ||
      composition.fps !== request.payload.fps || composition.durationInFrames !== request.payload.durationFrames
    ) throw new Error('Selected composition metadata diverged from approved frame timing')
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
      jpegQuality: 80,
      crf: 24,
      x264Preset: 'veryfast',
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      muted: !finalComposition,
      concurrency: 1,
      disallowParallelEncoding: true,
      overwrite: false,
      logLevel: 'error',
      timeoutInMilliseconds: 30_000,
      mediaCacheSizeInBytes: 32 * 1024 * 1024,
      offthreadVideoCacheSizeInBytes: 32 * 1024 * 1024,
      offthreadVideoThreads: 1,
    })
    const bytes = await readFile(outputPath)
    if (bytes.byteLength < 1_024 || bytes.byteLength > MAXIMUM_OUTPUT_BYTES || bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
      throw new Error('Rendered MP4 artifact is invalid or outside bounds')
    }
    return {
      mimeType: 'video/mp4',
      bytesBase64: bytes.toString('base64'),
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      durationFrames: composition.durationInFrames,
      durationSeconds: Number((composition.durationInFrames / composition.fps).toFixed(6)),
    }
  } finally {
    await rm(outputPath, { force: true }).catch(() => undefined)
    await mediaServer?.close()
  }
}

async function openPrivateLoopbackMediaServer(sources, overlays, voiceTracks) {
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
      serveCommittedBytes(request, response, source.bytes, source.mimeType)
      return
    }
    const captionMatch = /^\/caption\/(\d+)\.png$/.exec(request.url)
    if (captionMatch) {
      const overlay = overlays[Number(captionMatch[1])]
      if (!overlay) {
        response.writeHead(404).end()
        return
      }
      serveCommittedBytes(request, response, overlay.bytes, 'image/png')
      return
    }
    const voiceMatch = /^\/voice\/(\d+)\.wav$/.exec(request.url)
    if (voiceMatch) {
      const voiceTrack = voiceTracks[Number(voiceMatch[1])]
      if (!voiceTrack) {
        response.writeHead(404).end()
        return
      }
      serveCommittedBytes(request, response, voiceTrack.bytes, 'audio/wav')
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

const chunks = []
let byteLength = 0
for await (const chunk of process.stdin) {
  byteLength += chunk.byteLength
  if (byteLength > MAXIMUM_REQUEST_BYTES) process.exit(2)
  chunks.push(chunk)
}

try {
  const request = validateRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')))
  const artifact = await execute(request)
  process.stdout.write(JSON.stringify({
    schemaVersion: 'offline-remotion-render-execution-container-v1',
    ok: true,
    toolId: 'remotion',
    operationId: OPERATION,
    status: 'actual_remotion_media_render_completed',
    packageIdentity: { packageName: 'remotion+@remotion/renderer', version: remotionVersion },
    requestEnvelopeSha256: sha256(JSON.stringify(request)),
    artifact,
    semanticEvidence: {
      remotionSelectCompositionExecuted: true,
      remotionRenderMediaExecuted: true,
      approvedFrameAndTimingPreserved: true,
      actualMp4ArtifactProduced: true,
      callerPathsUrlsCodeAndCommandsRejected: true,
      ...(['approved_source_caption_final_v1', 'approved_source_caption_track_final_v1']
        .includes(request.payload.compositionProfileId)
        ? {
            approvedSourceBytesVerified: true,
            approvedCaptionOverlayBytesVerified: true,
            approvedSourceTrimFramesApplied: true,
            finalCompositionProfileExecuted: true,
            ...(request.payload.audioPolicy === 'replace_with_approved_voice_tracks'
              ? {
                  approvedVoiceTrackBytesVerified: true,
                  approvedVoiceTrackReplacementRequested: true,
                  approvedVoiceTrackTimelineApplied: true,
                }
              : { sourceAudioPreservationRequested: true }),
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
              approvedHardCutTransitionAuthorityRead: true,
              approvedHardCutTransitionsApplied: true,
              finalCompositionProfileExecuted: true,
              ...(request.payload.audioPolicy === 'replace_with_approved_voice_tracks'
                ? {
                    approvedVoiceTrackBytesVerified: true,
                    approvedVoiceTrackReplacementRequested: true,
                    approvedVoiceTrackTimelineApplied: true,
                  }
                : { sourceAudioPreservationRequested: true }),
              ...(isCaptionTrackProfile(request.payload.compositionProfileId)
                ? { approvedCaptionTrackTimingApplied: true }
                : {}),
            }
        : { boundedPreviewCompositionProfileExecuted: true }),
    },
    readiness: { privateInternalOnly: true, productReady: false, externalBetaReady: false, productionReady: false, privateInternalFinalCompositionReady: true },
  }))
} catch (error) {
  void error
  process.stderr.write('Private Remotion execution failed.\n')
  process.stdout.write(JSON.stringify({ ok: false, code: 'EXECUTION_FAILED' }))
  process.exit(3)
}
