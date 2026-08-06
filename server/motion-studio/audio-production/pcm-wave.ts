import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const MOTION_STUDIO_AUDIO_MIX_PROFILE = Object.freeze({
  profileId: 'motion_studio_storytelling_speech_safe_mix_v1' as const,
  sampleRateHertz: 48_000 as const,
  outputChannelCount: 2 as const,
  bitsPerSample: 16 as const,
  targetIntegratedLufs: -16 as const,
  maximumPeakDb: -1 as const,
  maximumDurationSeconds: 120 as const,
  gains: Object.freeze({
    narration: 1,
    music: 10 ** (-18 / 20),
    foley: 10 ** (-20 / 20),
    exact_sfx: 10 ** (-16 / 20),
  }),
  maximumLinearPeak: 10 ** (-1 / 20),
})

export type MotionStudioMixStemRole = keyof typeof MOTION_STUDIO_AUDIO_MIX_PROFILE.gains

export interface MotionStudioPcmMixStem {
  role: MotionStudioMixStemRole
  startFrame: number
  endFrame: number
  cueReason: string
  sourceSha256: string
  bytes: Buffer
}

export interface ParsedPcmWave {
  sampleRateHertz: 48_000
  channelCount: 1 | 2
  bitsPerSample: 16
  sampleCountPerChannel: number
  durationMilliseconds: number
  interleavedSamples: Int16Array
}

export interface MotionStudioPcmMixResult {
  profileId: typeof MOTION_STUDIO_AUDIO_MIX_PROFILE.profileId
  bytes: Buffer
  sha256: string
  byteLength: number
  sampleRateHertz: 48_000
  channelCount: 2
  bitsPerSample: 16
  sampleCountPerChannel: number
  durationFrames: number
  fps: 24 | 30
  preHeadroomPeakLinear: number
  appliedHeadroomScale: number
  inputEvidence: readonly {
    role: MotionStudioMixStemRole
    sourceSha256: string
    startFrame: number
    endFrame: number
    sourceSampleCountPerChannel: number
    appliedGain: number
  }[]
}

const SHA256 = /^[a-f0-9]{64}$/
const MAXIMUM_INPUT_BYTES = 24 * 1024 * 1024

export function parseMotionStudioPcmWave(bytes: Buffer): ParsedPcmWave {
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < 44 || bytes.byteLength > MAXIMUM_INPUT_BYTES) {
    throw invalid('Audio input is outside the bounded PCM WAV size contract.')
  }
  if (
    bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) throw invalid('Audio input is not a RIFF WAVE file.')
  const declaredRiffBytes = bytes.readUInt32LE(4) + 8
  if (declaredRiffBytes !== bytes.byteLength) throw invalid('PCM WAV RIFF length is not exact.')

  let offset = 12
  let format: {
    audioFormat: number
    channelCount: number
    sampleRateHertz: number
    byteRate: number
    blockAlign: number
    bitsPerSample: number
  } | undefined
  let data: Buffer | undefined
  while (offset + 8 <= bytes.byteLength) {
    const chunkId = bytes.subarray(offset, offset + 4).toString('ascii')
    const chunkLength = bytes.readUInt32LE(offset + 4)
    const dataStart = offset + 8
    const dataEnd = dataStart + chunkLength
    if (dataEnd > bytes.byteLength) throw invalid('PCM WAV chunk exceeds the committed file length.')
    if (chunkId === 'fmt ') {
      if (format || chunkLength < 16) throw invalid('PCM WAV has an invalid or duplicate format chunk.')
      format = {
        audioFormat: bytes.readUInt16LE(dataStart),
        channelCount: bytes.readUInt16LE(dataStart + 2),
        sampleRateHertz: bytes.readUInt32LE(dataStart + 4),
        byteRate: bytes.readUInt32LE(dataStart + 8),
        blockAlign: bytes.readUInt16LE(dataStart + 12),
        bitsPerSample: bytes.readUInt16LE(dataStart + 14),
      }
    } else if (chunkId === 'data') {
      if (data) throw invalid('PCM WAV has more than one data chunk.')
      data = bytes.subarray(dataStart, dataEnd)
    }
    offset = dataEnd + (chunkLength % 2)
  }
  if (offset !== bytes.byteLength || !format || !data) throw invalid('PCM WAV is missing exact format or sample data.')
  const channelCount = format.channelCount
  const blockAlign = channelCount * 2
  if (
    format.audioFormat !== 1 || ![1, 2].includes(channelCount) ||
    format.sampleRateHertz !== MOTION_STUDIO_AUDIO_MIX_PROFILE.sampleRateHertz ||
    format.bitsPerSample !== MOTION_STUDIO_AUDIO_MIX_PROFILE.bitsPerSample ||
    format.blockAlign !== blockAlign || format.byteRate !== 48_000 * blockAlign ||
    data.byteLength === 0 || data.byteLength % blockAlign !== 0
  ) throw invalid('Mix input must be 48 kHz mono/stereo signed 16-bit PCM WAV.')

  const sampleCountPerChannel = data.byteLength / blockAlign
  if (sampleCountPerChannel > 48_000 * MOTION_STUDIO_AUDIO_MIX_PROFILE.maximumDurationSeconds) {
    throw invalid('PCM WAV exceeds the maximum Storytelling mix duration.')
  }
  const interleavedSamples = new Int16Array(sampleCountPerChannel * channelCount)
  for (let index = 0; index < interleavedSamples.length; index += 1) {
    interleavedSamples[index] = data.readInt16LE(index * 2)
  }
  return {
    sampleRateHertz: 48_000,
    channelCount: channelCount as 1 | 2,
    bitsPerSample: 16,
    sampleCountPerChannel,
    durationMilliseconds: Math.round((sampleCountPerChannel / 48_000) * 1_000),
    interleavedSamples,
  }
}

export function mixMotionStudioPcmWave(input: {
  fps: 24 | 30
  durationFrames: number
  stems: readonly MotionStudioPcmMixStem[]
}): MotionStudioPcmMixResult {
  if (!([24, 30] as const).includes(input.fps)) throw invalid('Storytelling audio mix requires a 24/1 or 30/1 timebase.')
  if (!Number.isSafeInteger(input.durationFrames) || input.durationFrames < input.fps || input.durationFrames > input.fps * 120) {
    throw invalid('Storytelling audio mix duration is outside the registered profile.')
  }
  if (input.stems.length !== 4) throw invalid('The registered Storytelling mix requires exactly four stem roles.')
  const requiredRoles: MotionStudioMixStemRole[] = ['narration', 'music', 'foley', 'exact_sfx']
  if ([...input.stems].map((stem) => stem.role).sort().join('|') !== requiredRoles.sort().join('|')) {
    throw invalid('The registered Storytelling mix requires one narration, music, Foley, and exact-SFX stem.')
  }
  const samplesPerFrame = 48_000 / input.fps
  if (!Number.isSafeInteger(samplesPerFrame)) throw invalid('Frame authority cannot map exactly to 48 kHz samples.')
  const outputSamplesPerChannel = input.durationFrames * samplesPerFrame
  const left = new Float64Array(outputSamplesPerChannel)
  const right = new Float64Array(outputSamplesPerChannel)
  const evidence: MotionStudioPcmMixResult['inputEvidence'][number][] = []

  for (const stem of input.stems) {
    if (
      !Number.isSafeInteger(stem.startFrame) || !Number.isSafeInteger(stem.endFrame) ||
      stem.startFrame < 0 || stem.endFrame <= stem.startFrame || stem.endFrame > input.durationFrames ||
      typeof stem.cueReason !== 'string' || stem.cueReason.trim().length < 8 || stem.cueReason.length > 360 ||
      hasControlCharacters(stem.cueReason) || !SHA256.test(stem.sourceSha256) ||
      sha256(stem.bytes) !== stem.sourceSha256
    ) throw invalid('A Storytelling mix stem has invalid timing, cue reason, or byte authority.')
    if (stem.role === 'narration' && (stem.startFrame !== 0 || stem.endFrame !== input.durationFrames)) {
      throw invalid('Narration must span the exact Storytelling mix timing authority.')
    }
    const source = parseMotionStudioPcmWave(stem.bytes)
    const rangeSamples = (stem.endFrame - stem.startFrame) * samplesPerFrame
    if (source.sampleCountPerChannel > rangeSamples) {
      throw invalid('A mix stem exceeds its exact approved frame range.')
    }
    if (stem.role === 'narration' && source.sampleCountPerChannel !== outputSamplesPerChannel) {
      throw invalid('Narration sample length must equal the exact mix timing authority.')
    }
    const gain = MOTION_STUDIO_AUDIO_MIX_PROFILE.gains[stem.role]
    const startSample = stem.startFrame * samplesPerFrame
    for (let sample = 0; sample < source.sampleCountPerChannel; sample += 1) {
      const outputIndex = startSample + sample
      const inputIndex = sample * source.channelCount
      const sourceLeft = source.interleavedSamples[inputIndex]! / 32_768
      const sourceRight = source.channelCount === 2
        ? source.interleavedSamples[inputIndex + 1]! / 32_768
        : sourceLeft
      left[outputIndex] += sourceLeft * gain
      right[outputIndex] += sourceRight * gain
    }
    evidence.push({
      role: stem.role,
      sourceSha256: stem.sourceSha256,
      startFrame: stem.startFrame,
      endFrame: stem.endFrame,
      sourceSampleCountPerChannel: source.sampleCountPerChannel,
      appliedGain: gain,
    })
  }

  let preHeadroomPeakLinear = 0
  for (let index = 0; index < outputSamplesPerChannel; index += 1) {
    preHeadroomPeakLinear = Math.max(preHeadroomPeakLinear, Math.abs(left[index]!), Math.abs(right[index]!))
  }
  if (preHeadroomPeakLinear === 0) throw invalid('Storytelling mix cannot produce a silent candidate.')
  const appliedHeadroomScale = preHeadroomPeakLinear > MOTION_STUDIO_AUDIO_MIX_PROFILE.maximumLinearPeak
    ? MOTION_STUDIO_AUDIO_MIX_PROFILE.maximumLinearPeak / preHeadroomPeakLinear
    : 1
  const interleaved = new Int16Array(outputSamplesPerChannel * 2)
  for (let index = 0; index < outputSamplesPerChannel; index += 1) {
    interleaved[index * 2] = floatToInt16(left[index]! * appliedHeadroomScale)
    interleaved[index * 2 + 1] = floatToInt16(right[index]! * appliedHeadroomScale)
  }
  const bytes = encodeMotionStudioPcmWave({ channelCount: 2, interleavedSamples: interleaved })
  return {
    profileId: MOTION_STUDIO_AUDIO_MIX_PROFILE.profileId,
    bytes,
    sha256: sha256(bytes),
    byteLength: bytes.byteLength,
    sampleRateHertz: 48_000,
    channelCount: 2,
    bitsPerSample: 16,
    sampleCountPerChannel: outputSamplesPerChannel,
    durationFrames: input.durationFrames,
    fps: input.fps,
    preHeadroomPeakLinear: rounded(preHeadroomPeakLinear),
    appliedHeadroomScale: rounded(appliedHeadroomScale),
    inputEvidence: evidence,
  }
}

export function encodeMotionStudioPcmWave(input: {
  channelCount: 1 | 2
  interleavedSamples: Int16Array
}): Buffer {
  if (input.interleavedSamples.length === 0 || input.interleavedSamples.length % input.channelCount !== 0) {
    throw invalid('PCM sample authority is not aligned to its channel count.')
  }
  const dataBytes = input.interleavedSamples.length * 2
  const output = Buffer.alloc(44 + dataBytes)
  output.write('RIFF', 0, 'ascii')
  output.writeUInt32LE(36 + dataBytes, 4)
  output.write('WAVE', 8, 'ascii')
  output.write('fmt ', 12, 'ascii')
  output.writeUInt32LE(16, 16)
  output.writeUInt16LE(1, 20)
  output.writeUInt16LE(input.channelCount, 22)
  output.writeUInt32LE(48_000, 24)
  output.writeUInt32LE(48_000 * input.channelCount * 2, 28)
  output.writeUInt16LE(input.channelCount * 2, 32)
  output.writeUInt16LE(16, 34)
  output.write('data', 36, 'ascii')
  output.writeUInt32LE(dataBytes, 40)
  for (let index = 0; index < input.interleavedSamples.length; index += 1) {
    output.writeInt16LE(input.interleavedSamples[index]!, 44 + index * 2)
  }
  return output
}

function floatToInt16(value: number): number {
  const bounded = Math.max(-1, Math.min(1, value))
  return bounded < 0 ? Math.round(bounded * 32_768) : Math.round(bounded * 32_767)
}

function rounded(value: number): number {
  return Number(value.toFixed(9))
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'motion_studio_storytelling_speech_safe_mix_v1',
  })
}
