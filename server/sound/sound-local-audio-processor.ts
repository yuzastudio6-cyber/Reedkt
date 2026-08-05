import { createHash, randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { lstat, readFile, realpath, rm } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import {
  ensurePrivateDirectoryWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { SoundArtifactRef } from './sound-contracts'
import {
  SOUND_SKILL_VERSION,
  soundSkillCapabilityManifest,
} from './sound-manifest'
import {
  evaluateSoundRouteBindingInvalidation,
  type SoundToolRouteBinding,
} from './sound-tool-route-manifest'
import {
  getToolOperationCapability,
  qualificationSupportsToolMode,
} from '../tool-registry'
import {
  decimalSecondsToFrames,
  timelineRatesEqual,
  type TimelineRate,
} from '../edit-skills/core/timeline-rate'

const execFileAsync = promisify(execFile)
const FFMPEG = 'ffmpeg'
const FFPROBE = 'ffprobe'
const MAX_OUTPUT_BYTES = 256 * 1024 * 1024

export type SoundLocalOperation =
  | 'analyze'
  | 'extract'
  | 'trim_fade_gain'
  | 'normalize'
  | 'resample_channels'
  | 'loop_crossfade'
  | 'stretch_pitch'
  | 'mix_stem'
  | 'sync_qa'
  | 'cleanup_gentle'

export interface SoundLocalSourceInput {
  artifact: SoundArtifactRef
  absolutePath: string
}

export interface SoundLocalExecutionBinding {
  soundSkillVersion: string
  soundManifestHash: string
  capabilityKey: string
  approvedPlanSnapshotId: string
  approvedPlanSnapshotHash: string
  approvedWorkItemId: string
  privateOutputScopeId: string
  idempotencyKey: string
  operationSpecHash: string
  timelineRate: TimelineRate
  creditReservationId?: string
  routeBinding: SoundToolRouteBinding
}

export interface SoundLocalOperationParameters {
  trimStartSeconds?: number
  durationSeconds?: number
  fadeInSeconds?: number
  fadeOutSeconds?: number
  gainDb?: number
  targetLoudnessLufs?: number
  maximumTruePeakDbtp?: number
  sampleRate?: 44_100 | 48_000
  channels?: 1 | 2
  loopCrossfadeSeconds?: number
  tempoRatio?: number
  pitchSemitones?: number
  inputGainDb?: number[]
  dialogueInputIndex?: number
  dialogueDuckingDb?: number
  duckAttackSeconds?: number
  duckReleaseSeconds?: number
  outputLimiterLinear?: number
  gainEnvelope?: Array<{ timeSeconds: number; gainDb: number }>
  protectedSpeechWindows?: Array<{ startSeconds: number; endSeconds: number }>
  pan?: number
  eqProfile?: 'neutral' | 'speech_safe' | 'distance_rolloff' | 'impact_control' | 'room_match'
  dynamicsProfile?: 'none' | 'gentle_compression' | 'peak_limiter'
  perspectiveProfile?: 'close' | 'medium' | 'distant'
  roomProfile?: 'dry' | 'source_room' | 'small_room' | 'large_room' | 'exterior'
  expectedHitSeconds?: number
  maximumSyncErrorSeconds?: number
  provenanceTag?: string
}

export interface SoundLocalAudioExecutionPackage {
  schemaVersion: 'sound-local-audio-execution-v1'
  executionId: string
  binding: SoundLocalExecutionBinding
  operation: SoundLocalOperation
  operationProfileKey: string
  sources: SoundLocalSourceInput[]
  approvedInputRoot: string
  privateOutputRoot: string
  outputRelativePath?: string
  outputArtifactId?: string
  outputArtifactType?: string
  outputContentType?: 'audio/wav' | 'audio/flac'
  parameters: SoundLocalOperationParameters
}

export interface SoundAudioStudyReport {
  durationSeconds: number
  sampleRate: number
  channels: number
  codecName: string
  integratedLoudnessLufs?: number
  truePeakDbtp?: number
  rmsDbfs: number
  peakDbfs: number
  silenceRangesSeconds: Array<{ startSeconds: number; endSeconds: number }>
  transientTimesSeconds: number[]
  clippingSampleCount: number
  decodedSampleCount: number
  zeroCrossingRate: number
  channelRmsDbfs: number[]
  edgeRmsDbfs: {
    leading: number
    center: number
    trailing: number
    windowMilliseconds: number
  }
}

export interface SoundMixOutputMeasurements {
  protectedRangeMeasurements: Array<{
    startSeconds: number
    endSeconds: number
    measuredRmsDbfs: number
    referenceRmsDbfs: number
    measuredDuckingDb: number
  }>
  expectedPanDirection: 'left' | 'center' | 'right'
  measuredChannelDeltaDb: number
  gainEnvelopeMeasurements: Array<{
    timeSeconds: number
    expectedGainDb: number
    measuredRmsDbfs: number
  }>
  fadeMeasurements: {
    leadingRmsDbfs: number
    centerRmsDbfs: number
    trailingRmsDbfs: number
  }
}

export interface SoundLocalAudioExecutionResult {
  schemaVersion: 'sound-local-audio-execution-result-v1'
  executionId: string
  operation: SoundLocalOperation
  operationProfileKey: string
  status: 'completed'
  idempotentReplay: boolean
  sourceChecksumsSha256: string[]
  sourceUnchanged: true
  outputArtifact?: SoundArtifactRef
  studyReport?: SoundAudioStudyReport
  toolEvidence: {
    ffmpegVersion: string
    ffprobeVersion: string
    nodeVersion: string
    commandProfile: string
    arbitraryArgumentsAccepted: false
  }
  runtimeEvidence: {
    elapsedMilliseconds: number
    localComputeCostUsd: number
    infrastructureCostEvidenceType: 'measured_elapsed_time_estimate'
  }
  qaEvidence: {
    inputMediaValidated: true
    outputMediaValidated: boolean
    checksumValidated: true
    sourceOverwritePrevented: true
    privateArtifactPolicyPassed: true
  }
}

const operationProfiles: Record<SoundLocalOperation, {
  profileKeys: readonly string[]
  outputRequired: boolean
  minimumSources: number
  maximumSources: number
}> = {
  analyze: { profileKeys: ['sound.analyze.v1', 'sound.analyze.reference.v1', 'sound.analyze.provider_candidate.v1', 'sound.analyze.model_candidate.v1', 'sound.analyze.final.v1', 'sound.analyze.output.v1'], outputRequired: false, minimumSources: 1, maximumSources: 1 },
  extract: { profileKeys: ['sound.extract.project_source.v1', 'sound.extract.provider_carrier.v1'], outputRequired: true, minimumSources: 1, maximumSources: 1 },
  trim_fade_gain: { profileKeys: ['sound.trim-fade-gain.edit.v1', 'sound.trim-fade-gain.music_technical.v1', 'sound.trim-fade-gain.video_candidate.v1', 'sound.trim-fade-gain.text_candidate.v1', 'sound.trim-fade-gain.model_candidate.v1'], outputRequired: true, minimumSources: 1, maximumSources: 1 },
  normalize: { profileKeys: ['sound.normalize.v1', 'sound.normalize.music_technical.v1'], outputRequired: true, minimumSources: 1, maximumSources: 1 },
  resample_channels: { profileKeys: ['sound.resample-channels.v1', 'sound.resample-channels.music_technical.v1'], outputRequired: true, minimumSources: 1, maximumSources: 1 },
  loop_crossfade: { profileKeys: ['sound.loop.edit.v1', 'sound.loop.ambience.v1', 'sound.loop.music_technical.v1'], outputRequired: true, minimumSources: 1, maximumSources: 1 },
  stretch_pitch: { profileKeys: ['sound.stretch-pitch.v1', 'sound.stretch-pitch.music_technical.v1'], outputRequired: true, minimumSources: 1, maximumSources: 1 },
  mix_stem: { profileKeys: ['sound.mix-stem.scene.v1', 'sound.mix-stem.provider_candidate.v1', 'sound.mix-stem.music_technical.v1'], outputRequired: true, minimumSources: 1, maximumSources: 16 },
  sync_qa: { profileKeys: ['sound.sync-qa.v1', 'sound.sync-qa.music_technical.v1'], outputRequired: false, minimumSources: 1, maximumSources: 1 },
  cleanup_gentle: { profileKeys: ['sound.cleanup.gentle.v1'], outputRequired: true, minimumSources: 1, maximumSources: 1 },
}

const toolOperationByLocalOperation: Record<SoundLocalOperation, string> = {
  analyze: 'analyze_audio_pcm',
  extract: 'extract_audio_pcm',
  trim_fade_gain: 'trim_fade_gain_audio',
  normalize: 'normalize_audio_loudness',
  resample_channels: 'resample_convert_channels',
  loop_crossfade: 'loop_audio_crossfade',
  stretch_pitch: 'stretch_pitch_audio',
  mix_stem: 'mix_scene_stem',
  sync_qa: 'sync_transient_qa',
  cleanup_gentle: 'cleanup_dialogue_gentle',
}

const packageKeys = new Set([
  'schemaVersion', 'executionId', 'binding', 'operation', 'operationProfileKey',
  'sources', 'approvedInputRoot', 'privateOutputRoot', 'outputRelativePath',
  'outputArtifactId', 'outputArtifactType', 'outputContentType', 'parameters',
])
const parameterKeys = new Set([
  'trimStartSeconds', 'durationSeconds', 'fadeInSeconds', 'fadeOutSeconds',
  'gainDb', 'targetLoudnessLufs', 'maximumTruePeakDbtp', 'sampleRate', 'channels',
  'loopCrossfadeSeconds', 'tempoRatio', 'pitchSemitones', 'inputGainDb',
  'dialogueInputIndex', 'dialogueDuckingDb', 'expectedHitSeconds',
  'duckAttackSeconds', 'duckReleaseSeconds', 'outputLimiterLinear',
  'gainEnvelope', 'protectedSpeechWindows', 'pan', 'eqProfile', 'dynamicsProfile',
  'perspectiveProfile', 'roomProfile',
  'maximumSyncErrorSeconds',
  'provenanceTag',
])

function assertKnownKeys(value: object, keys: Set<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !keys.has(key))
  if (unknown.length > 0) throw new Error(`${label} contains unsupported fields: ${unknown.join(',')}`)
}

function finiteInRange(
  value: number | undefined,
  minimum: number,
  maximum: number,
  label: string,
  required = false,
): number | undefined {
  if (value === undefined) {
    if (required) throw new Error(`${label} is required.`)
    return undefined
  }
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`)
  }
  return value
}

function validateParameters(operation: SoundLocalOperation, parameters: SoundLocalOperationParameters): void {
  assertKnownKeys(parameters, parameterKeys, 'Sound operation parameters')
  finiteInRange(parameters.trimStartSeconds, 0, 86_400, 'trimStartSeconds')
  finiteInRange(parameters.durationSeconds, 0.01, 86_400, 'durationSeconds', operation === 'trim_fade_gain' || operation === 'loop_crossfade')
  finiteInRange(parameters.fadeInSeconds, 0, 30, 'fadeInSeconds')
  finiteInRange(parameters.fadeOutSeconds, 0, 30, 'fadeOutSeconds')
  finiteInRange(parameters.gainDb, -48, 18, 'gainDb')
  finiteInRange(parameters.targetLoudnessLufs, -36, -8, 'targetLoudnessLufs')
  finiteInRange(parameters.maximumTruePeakDbtp, -12, -0.1, 'maximumTruePeakDbtp')
  finiteInRange(parameters.loopCrossfadeSeconds, 0.005, 5, 'loopCrossfadeSeconds')
  finiteInRange(parameters.tempoRatio, 0.5, 2, 'tempoRatio')
  finiteInRange(parameters.pitchSemitones, -12, 12, 'pitchSemitones')
  finiteInRange(parameters.dialogueDuckingDb, -36, 0, 'dialogueDuckingDb')
  finiteInRange(parameters.duckAttackSeconds, 0.001, 2, 'duckAttackSeconds')
  finiteInRange(parameters.duckReleaseSeconds, 0.001, 5, 'duckReleaseSeconds')
  finiteInRange(parameters.outputLimiterLinear, 0.1, 0.99, 'outputLimiterLinear')
  finiteInRange(parameters.pan, -1, 1, 'pan')
  finiteInRange(parameters.expectedHitSeconds, 0, 86_400, 'expectedHitSeconds')
  finiteInRange(parameters.maximumSyncErrorSeconds, 0.001, 2, 'maximumSyncErrorSeconds')
  if (parameters.sampleRate !== undefined && parameters.sampleRate !== 44_100 && parameters.sampleRate !== 48_000) {
    throw new Error('Only 44100 Hz and 48000 Hz operation profiles are approved.')
  }
  if (parameters.channels !== undefined && parameters.channels !== 1 && parameters.channels !== 2) {
    throw new Error('Only mono and stereo operation profiles are approved.')
  }
  if (parameters.inputGainDb) {
    parameters.inputGainDb.forEach((gain, index) => finiteInRange(gain, -48, 18, `inputGainDb[${index}]`, true))
  }
  if (parameters.dialogueInputIndex !== undefined && (!Number.isInteger(parameters.dialogueInputIndex) ||
    parameters.dialogueInputIndex < -1 || parameters.dialogueInputIndex >= 16)) {
    throw new Error('dialogueInputIndex must be -1 or a bounded source index.')
  }
  for (const [index, point] of (parameters.gainEnvelope ?? []).entries()) {
    finiteInRange(point.timeSeconds, 0, 86_400, `gainEnvelope[${index}].timeSeconds`, true)
    finiteInRange(point.gainDb, -96, 24, `gainEnvelope[${index}].gainDb`, true)
    if (index > 0 && point.timeSeconds < parameters.gainEnvelope![index - 1]!.timeSeconds) {
      throw new Error('gainEnvelope points must be ordered by time.')
    }
  }
  for (const [index, window] of (parameters.protectedSpeechWindows ?? []).entries()) {
    finiteInRange(window.startSeconds, 0, 86_400, `protectedSpeechWindows[${index}].startSeconds`, true)
    finiteInRange(window.endSeconds, 0, 86_400, `protectedSpeechWindows[${index}].endSeconds`, true)
    if (window.endSeconds <= window.startSeconds) throw new Error('Protected speech windows must have positive duration.')
  }
  if (parameters.provenanceTag !== undefined &&
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,179}$/.test(parameters.provenanceTag)) {
    throw new Error('provenanceTag must be a bounded server-owned identity.')
  }
}

function assertPathWithinRoot(rootPath: string, targetPath: string, label: string): void {
  const root = resolve(rootPath)
  const target = resolve(targetPath)
  const relativePath = relative(root, target)
  if (!relativePath || relativePath.startsWith(`..${sep}`) || relativePath === '..' || isAbsolute(relativePath)) {
    throw new Error(`${label} escapes its approved root.`)
  }
}

async function validateSource(source: SoundLocalSourceInput, rootPath: string): Promise<void> {
  assertPathWithinRoot(rootPath, source.absolutePath, 'Sound source')
  const [rootRealPath, sourceRealPath, sourceStat] = await Promise.all([
    realpath(rootPath),
    realpath(source.absolutePath),
    lstat(source.absolutePath),
  ])
  if (sourceStat.isSymbolicLink() || !sourceStat.isFile()) throw new Error('Sound source must be a regular non-symlink file.')
  assertPathWithinRoot(rootRealPath, sourceRealPath, 'Resolved Sound source')
  const checksum = await checksumFile(source.absolutePath)
  if (checksum !== source.artifact.checksumSha256) {
    throw new Error(`Sound source checksum mismatch for ${source.artifact.artifactId}.`)
  }
}

async function checksumFile(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function binaryVersion(binary: string): Promise<string> {
  const result = await execFileAsync(binary, ['-version'], {
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  })
  return String(result.stdout).split(/\r?\n/)[0]?.trim() ?? 'unknown'
}

interface ProbeResult {
  format: { duration?: string; format_name?: string }
  streams: Array<{
    codec_type?: string
    codec_name?: string
    sample_rate?: string
    channels?: number
  }>
}

async function probeAudio(path: string): Promise<{
  durationSeconds: number
  codecName: string
  sampleRate: number
  channels: number
  formatName: string
}> {
  const result = await execFileAsync(FFPROBE, [
    '-v', 'error', '-show_entries',
    'format=duration,format_name:stream=codec_type,codec_name,sample_rate,channels',
    '-of', 'json', path,
  ], { timeout: 30_000, maxBuffer: 4 * 1024 * 1024 })
  const parsed = JSON.parse(String(result.stdout)) as ProbeResult
  const stream = parsed.streams.find((item) => item.codec_type === 'audio')
  if (!stream) throw new Error('Approved Sound source contains no decodable audio stream.')
  const durationSeconds = Number(parsed.format.duration)
  const sampleRate = Number(stream.sample_rate)
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 ||
    !Number.isFinite(sampleRate) || sampleRate <= 0 || !stream.channels) {
    throw new Error('Approved Sound source has invalid media metadata.')
  }
  return {
    durationSeconds,
    codecName: stream.codec_name ?? 'unknown',
    sampleRate,
    channels: stream.channels,
    formatName: parsed.format.format_name ?? 'unknown',
  }
}

export async function validateSoundAudioFile(path: string) {
  return probeAudio(path)
}

function parseLoudnorm(stderr: string): { integratedLoudnessLufs?: number; truePeakDbtp?: number } {
  const blocks = stderr.match(/\{[\s\S]*?\}/g) ?? []
  for (const block of blocks.reverse()) {
    try {
      const parsed = JSON.parse(block) as Record<string, string>
      const integrated = Number(parsed.input_i)
      const peak = Number(parsed.input_tp)
      if (Number.isFinite(integrated) || Number.isFinite(peak)) {
        return {
          integratedLoudnessLufs: Number.isFinite(integrated) ? integrated : undefined,
          truePeakDbtp: Number.isFinite(peak) ? peak : undefined,
        }
      }
    } catch {
      // FFmpeg may print other braces; keep scanning.
    }
  }
  return {}
}

async function decodeStudy(path: string): Promise<{
  rmsDbfs: number
  peakDbfs: number
  silenceRangesSeconds: Array<{ startSeconds: number; endSeconds: number }>
  transientTimesSeconds: number[]
  clippingSampleCount: number
  decodedSampleCount: number
  zeroCrossingRate: number
  channelRmsDbfs: number[]
  edgeRmsDbfs: SoundAudioStudyReport['edgeRmsDbfs']
}> {
  const sampleRate = 8_000
  const result = await execFileAsync(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', path,
    // Decode both supported output channels independently. A mono downmix can sum
    // correlated stereo channels and manufacture sample peaks that are not present
    // in the artifact, producing false clipping failures.
    '-t', '600', '-vn', '-ac', '2', '-ar', String(sampleRate),
    '-f', 'f32le', 'pipe:1',
  ], {
    timeout: 120_000,
    maxBuffer: 32 * 1024 * 1024,
    encoding: 'buffer',
  } as Parameters<typeof execFileAsync>[2])
  const bytes = Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout)
  const channelCount = 2
  const sampleCount = Math.floor(bytes.length / 4)
  const frameCount = Math.floor(sampleCount / channelCount)
  let squareSum = 0
  let peak = 0
  let clipping = 0
  const previous = [0, 0]
  const transients: number[] = []
  const silenceRanges: Array<{ startSeconds: number; endSeconds: number }> = []
  let silenceStart: number | undefined
  const silenceThreshold = 10 ** (-45 / 20)
  // Provider candidates are deliberately gain-staged below dialogue. Detect their
  // bounded onset without requiring near-full-scale samples.
  const transientThreshold = 0.03
  const minimumSilenceSamples = Math.round(sampleRate * 0.2)
  const minimumTransientGap = Math.round(sampleRate * 0.04)
  let lastTransient = -minimumTransientGap
  let zeroCrossings = 0
  const channelSquareSums = [0, 0]
  const windowFrames = Math.max(1, Math.min(Math.round(sampleRate * 0.1), Math.floor(frameCount / 3)))
  const centerStart = Math.max(0, Math.floor((frameCount - windowFrames) / 2))
  const centerEnd = centerStart + windowFrames
  const edgeSquareSums = { leading: 0, center: 0, trailing: 0 }
  const edgeSampleCounts = { leading: 0, center: 0, trailing: 0 }

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    let framePeak = 0
    let frameTransient = false
    for (let channel = 0; channel < channelCount; channel += 1) {
      const index = frameIndex * channelCount + channel
      const value = bytes.readFloatLE(index * 4)
      const absolute = Math.abs(value)
      framePeak = Math.max(framePeak, absolute)
      peak = Math.max(peak, absolute)
      squareSum += value * value
      channelSquareSums[channel] = channelSquareSums[channel]! + value * value
      if (frameIndex < windowFrames) {
        edgeSquareSums.leading += value * value
        edgeSampleCounts.leading += 1
      }
      if (frameIndex >= centerStart && frameIndex < centerEnd) {
        edgeSquareSums.center += value * value
        edgeSampleCounts.center += 1
      }
      if (frameIndex >= frameCount - windowFrames) {
        edgeSquareSums.trailing += value * value
        edgeSampleCounts.trailing += 1
      }
      if (absolute >= 0.999) clipping += 1
      if (Math.abs(value - previous[channel]!) >= transientThreshold) frameTransient = true
      if (frameIndex > 0 && ((value >= 0 && previous[channel]! < 0) || (value < 0 && previous[channel]! >= 0))) {
        zeroCrossings += 1
      }
      previous[channel] = value
    }
    if (frameTransient && frameIndex - lastTransient >= minimumTransientGap) {
      transients.push(Number((frameIndex / sampleRate).toFixed(4)))
      lastTransient = frameIndex
    }
    if (framePeak < silenceThreshold) {
      silenceStart ??= frameIndex
    } else if (silenceStart !== undefined) {
      if (frameIndex - silenceStart >= minimumSilenceSamples) {
        silenceRanges.push({
          startSeconds: Number((silenceStart / sampleRate).toFixed(4)),
          endSeconds: Number((frameIndex / sampleRate).toFixed(4)),
        })
      }
      silenceStart = undefined
    }
  }
  if (silenceStart !== undefined && frameCount - silenceStart >= minimumSilenceSamples) {
    silenceRanges.push({
      startSeconds: Number((silenceStart / sampleRate).toFixed(4)),
      endSeconds: Number((frameCount / sampleRate).toFixed(4)),
    })
  }
  const rms = sampleCount > 0 ? Math.sqrt(squareSum / sampleCount) : 0
  const db = (value: number) => Number((20 * Math.log10(Math.max(value, 1e-9))).toFixed(3))
  return {
    rmsDbfs: db(rms),
    peakDbfs: db(peak),
    silenceRangesSeconds: silenceRanges,
    transientTimesSeconds: transients.slice(0, 10_000),
    clippingSampleCount: clipping,
    decodedSampleCount: sampleCount,
    zeroCrossingRate: Number((zeroCrossings / Math.max(1, sampleCount - channelCount)).toFixed(6)),
    channelRmsDbfs: channelSquareSums.map((sum) => db(Math.sqrt(sum / Math.max(1, frameCount)))),
    edgeRmsDbfs: {
      leading: db(Math.sqrt(edgeSquareSums.leading / Math.max(1, edgeSampleCounts.leading))),
      center: db(Math.sqrt(edgeSquareSums.center / Math.max(1, edgeSampleCounts.center))),
      trailing: db(Math.sqrt(edgeSquareSums.trailing / Math.max(1, edgeSampleCounts.trailing))),
      windowMilliseconds: Number((windowFrames / sampleRate * 1_000).toFixed(3)),
    },
  }
}

export async function measureSoundMixOutput(input: {
  absolutePath: string
  protectedSpeechWindows: Array<{ startSeconds: number; endSeconds: number }>
  gainEnvelope: Array<{ timeSeconds: number; gainDb: number }>
  pan: number
}): Promise<SoundMixOutputMeasurements> {
  const sampleRate = 8_000
  const decoded = await execFileAsync(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', input.absolutePath,
    '-t', '600', '-vn', '-ac', '2', '-ar', String(sampleRate), '-f', 'f32le', 'pipe:1',
  ], { timeout: 120_000, maxBuffer: 64 * 1024 * 1024, encoding: 'buffer' } as Parameters<typeof execFileAsync>[2])
  const bytes = Buffer.isBuffer(decoded.stdout) ? decoded.stdout : Buffer.from(decoded.stdout)
  const frameCount = Math.floor(bytes.length / 8)
  const db = (linear: number) => Number((20 * Math.log10(Math.max(linear, 1e-9))).toFixed(3))
  const rms = (startFrame: number, endFrame: number, channel?: 0 | 1): number => {
    const start = Math.max(0, Math.min(frameCount, startFrame))
    const end = Math.max(start + 1, Math.min(frameCount, endFrame))
    let squareSum = 0
    let samples = 0
    for (let frame = start; frame < end; frame += 1) {
      const channels = channel === undefined ? [0, 1] as const : [channel]
      for (const current of channels) {
        const value = bytes.readFloatLE((frame * 2 + current) * 4)
        squareSum += value * value
        samples += 1
      }
    }
    return db(Math.sqrt(squareSum / Math.max(1, samples)))
  }
  const protectedFrames = input.protectedSpeechWindows.map((window) => ({
    start: Math.round(window.startSeconds * sampleRate),
    end: Math.round(window.endSeconds * sampleRate),
  }))
  const unprotectedRms = (() => {
    let squareSum = 0
    let samples = 0
    for (let frame = 0; frame < frameCount; frame += 1) {
      if (protectedFrames.some((window) => frame >= window.start && frame < window.end)) continue
      for (const channel of [0, 1] as const) {
        const value = bytes.readFloatLE((frame * 2 + channel) * 4)
        squareSum += value * value
        samples += 1
      }
    }
    return db(Math.sqrt(squareSum / Math.max(1, samples)))
  })()
  const protectedRangeMeasurements = input.protectedSpeechWindows.map((window, index) => {
    const measuredRmsDbfs = rms(protectedFrames[index]!.start, protectedFrames[index]!.end)
    return {
      ...window,
      measuredRmsDbfs,
      referenceRmsDbfs: unprotectedRms,
      measuredDuckingDb: Number((measuredRmsDbfs - unprotectedRms).toFixed(3)),
    }
  })
  const gainEnvelopeMeasurements = input.gainEnvelope.map((point) => {
    const center = Math.round(point.timeSeconds * sampleRate)
    const radius = Math.max(1, Math.round(sampleRate * 0.025))
    return {
      timeSeconds: point.timeSeconds,
      expectedGainDb: point.gainDb,
      measuredRmsDbfs: rms(center - radius, center + radius),
    }
  })
  const edgeFrames = Math.max(1, Math.min(Math.round(sampleRate * 0.1), Math.floor(frameCount / 3)))
  const centerStart = Math.max(0, Math.floor((frameCount - edgeFrames) / 2))
  return {
    protectedRangeMeasurements,
    expectedPanDirection: input.pan < -0.05 ? 'left' : input.pan > 0.05 ? 'right' : 'center',
    measuredChannelDeltaDb: Number((rms(0, frameCount, 1) - rms(0, frameCount, 0)).toFixed(3)),
    gainEnvelopeMeasurements,
    fadeMeasurements: {
      leadingRmsDbfs: rms(0, edgeFrames),
      centerRmsDbfs: rms(centerStart, centerStart + edgeFrames),
      trailingRmsDbfs: rms(Math.max(0, frameCount - edgeFrames), frameCount),
    },
  }
}

async function studyAudio(path: string): Promise<SoundAudioStudyReport> {
  const [probe, decoded, loudness] = await Promise.all([
    probeAudio(path),
    decodeStudy(path),
    execFileAsync(FFMPEG, [
      '-hide_banner', '-nostdin', '-i', path,
      '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json',
      '-f', 'null', '-',
    ], { timeout: 120_000, maxBuffer: 8 * 1024 * 1024 }).then(
      (result) => parseLoudnorm(String(result.stderr)),
    ),
  ])
  return { ...probe, ...decoded, ...loudness }
}

function outputCodec(contentType: 'audio/wav' | 'audio/flac' | undefined): string[] {
  return contentType === 'audio/flac' ? ['-c:a', 'flac'] : ['-c:a', 'pcm_s24le']
}

function outputArguments(
  input: SoundLocalAudioExecutionPackage,
  temporaryPath: string,
  sourceDurationSeconds?: number,
): string[] {
  const source = input.sources[0]!.absolutePath
  const p = input.parameters
  const codec = outputCodec(input.outputContentType)
  const finish = [
    '-ar', String(p.sampleRate ?? 48_000),
    '-ac', String(p.channels ?? 2),
    ...(p.provenanceTag ? ['-metadata', `comment=${p.provenanceTag}`] : []),
    ...codec,
    temporaryPath,
  ]
  if (input.operation === 'extract') {
    return ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', source, '-map', '0:a:0', '-vn', ...finish]
  }
  if (input.operation === 'trim_fade_gain') {
    const duration = p.durationSeconds as number
    const fadeIn = Math.min(p.fadeInSeconds ?? 0.02, duration / 2)
    const fadeOut = Math.min(p.fadeOutSeconds ?? 0.04, duration / 2)
    const fadeOutStart = Math.max(0, duration - fadeOut)
    const filter = [
      `atrim=start=${p.trimStartSeconds ?? 0}:duration=${duration}`,
      'asetpts=PTS-STARTPTS',
      `volume=${p.gainDb ?? 0}dB`,
      `afade=t=in:st=0:d=${fadeIn}`,
      `afade=t=out:st=${fadeOutStart}:d=${fadeOut}`,
    ].join(',')
    return ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', source, '-af', filter, ...finish]
  }
  if (input.operation === 'normalize') {
    const maximumTruePeakDbtp = p.maximumTruePeakDbtp ?? -1
    const limiterLinear = Math.pow(10, maximumTruePeakDbtp / 20).toFixed(6)
    // One-pass loudnorm can overshoot on short transient-heavy cues. Retain two dB of
    // deterministic safety margin before the final hard ceiling; measured output QA
    // remains authoritative and will block any artifact that still exceeds policy.
    const filter = `loudnorm=I=${p.targetLoudnessLufs ?? -16}:TP=${maximumTruePeakDbtp}:LRA=11,volume=-2dB,alimiter=limit=${limiterLinear}:level=disabled`
    return ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', source, '-af', filter, ...finish]
  }
  if (input.operation === 'resample_channels') {
    return ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', source, ...finish]
  }
  if (input.operation === 'loop_crossfade') {
    const duration = p.durationSeconds as number
    if (!sourceDurationSeconds || sourceDurationSeconds <= 0) {
      throw new Error('Loop crossfade requires validated source duration evidence.')
    }
    const boundary = Math.min(
      p.loopCrossfadeSeconds ?? 0.08,
      duration / 3,
      sourceDurationSeconds / 3,
    )
    const repeatCount = Math.max(
      1,
      Math.ceil((duration - boundary) / Math.max(0.005, sourceDurationSeconds - boundary)),
    )
    if (repeatCount > 128) {
      throw new Error('Loop crossfade exceeds the bounded 128-segment local operation profile.')
    }
    const inputArguments = Array.from({ length: repeatCount }, () => ['-i', source]).flat()
    const filters = Array.from({ length: repeatCount }, (_, index) =>
      `[${index}:a]atrim=duration=${sourceDurationSeconds},asetpts=PTS-STARTPTS[a${index}]`)
    let finalLabel = 'a0'
    for (let index = 1; index < repeatCount; index += 1) {
      const nextLabel = `loop${index}`
      filters.push(`[${finalLabel}][a${index}]acrossfade=d=${boundary}:c1=tri:c2=tri[${nextLabel}]`)
      finalLabel = nextLabel
    }
    const edgeFade = Math.min(boundary, duration / 3)
    filters.push(
      `[${finalLabel}]atrim=duration=${duration},asetpts=PTS-STARTPTS,` +
      `afade=t=in:st=0:d=${edgeFade},` +
      `afade=t=out:st=${Math.max(0, duration - edgeFade)}:d=${edgeFade}[out]`,
    )
    return [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
      ...inputArguments,
      '-filter_complex', filters.join(';'), '-map', '[out]',
      '-ar', String(p.sampleRate ?? 48_000), '-ac', String(p.channels ?? 2),
      ...codec, temporaryPath,
    ]
  }
  if (input.operation === 'stretch_pitch') {
    const tempo = p.tempoRatio ?? 1
    const pitchFactor = 2 ** ((p.pitchSemitones ?? 0) / 12)
    const filters = pitchFactor === 1
      ? [`atempo=${tempo}`]
      : [
          `asetrate=${p.sampleRate ?? 48_000}*${pitchFactor}`,
          `aresample=${p.sampleRate ?? 48_000}`,
          `atempo=${Number((tempo / pitchFactor).toFixed(8))}`,
        ]
    return ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', source, '-af', filters.join(','), ...finish]
  }
  if (input.operation === 'cleanup_gentle') {
    const filter = 'highpass=f=70,lowpass=f=16500,afftdn=nf=-25:tn=1,alimiter=limit=0.891'
    return ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', source, '-af', filter, ...finish]
  }
  if (input.operation === 'mix_stem') return mixArguments(input, temporaryPath)
  throw new Error(`Operation ${input.operation} does not produce an output.`)
}

function mixArguments(input: SoundLocalAudioExecutionPackage, temporaryPath: string): string[] {
  const p = input.parameters
  const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y']
  for (const source of input.sources) args.push('-i', source.absolutePath)
  const dialogueIndex = p.dialogueInputIndex ?? -1
  if (!Number.isInteger(dialogueIndex) || dialogueIndex < -1 || dialogueIndex >= input.sources.length) {
    throw new Error('dialogueInputIndex is outside the approved source set.')
  }
  const gains = input.sources.map((_, index) => p.inputGainDb?.[index] ?? 0)
  // A filter output pad is single-use. Split dialogue explicitly so one bound copy
  // drives the compressor sidechain while the other remains available for the mix.
  const filters = gains.map((gain, index) => index === dialogueIndex
    ? `[${index}:a]volume=${gain}dB,asplit=2[g${index}_sidechain][g${index}_mix]`
    : `[${index}:a]volume=${gain}dB[g${index}]`)
  const soundLabels = input.sources.map((_, index) => index).filter((index) => index !== dialogueIndex)
  if (soundLabels.length === 0) throw new Error('Sound mix requires at least one Sound layer.')
  const mixedSoundLabel = soundLabels.length === 1 ? `g${soundLabels[0]}` : 'sfxmix'
  if (soundLabels.length > 1) {
    filters.push(`${soundLabels.map((index) => `[g${index}]`).join('')}amix=inputs=${soundLabels.length}:normalize=0[sfxmix]`)
  }
  let processedSoundLabel = mixedSoundLabel
  const soundFilters: string[] = []
  for (let index = 0; index < (p.gainEnvelope?.length ?? 0) - 1; index += 1) {
    const point = p.gainEnvelope![index]!
    const next = p.gainEnvelope![index + 1]!
    soundFilters.push(`volume=${point.gainDb}dB:enable='between(t,${point.timeSeconds},${next.timeSeconds})'`)
  }
  for (const window of p.protectedSpeechWindows ?? []) {
    soundFilters.push(`volume=${p.dialogueDuckingDb ?? -9}dB:enable='between(t,${window.startSeconds},${window.endSeconds})'`)
  }
  if ((p.pan ?? 0) !== 0) {
    const left = Number((1 - Math.max(0, p.pan ?? 0)).toFixed(6))
    const right = Number((1 + Math.min(0, p.pan ?? 0)).toFixed(6))
    soundFilters.push(`pan=stereo|c0=${left}*c0|c1=${right}*c1`)
  }
  if (p.eqProfile === 'speech_safe') soundFilters.push('equalizer=f=2500:t=q:w=1:g=-2')
  if (p.eqProfile === 'distance_rolloff') soundFilters.push('lowpass=f=6500')
  if (p.eqProfile === 'impact_control') soundFilters.push('highpass=f=45,equalizer=f=100:t=q:w=1:g=-2')
  if (p.eqProfile === 'room_match') soundFilters.push('equalizer=f=500:t=q:w=1:g=-1')
  if (p.perspectiveProfile === 'distant') soundFilters.push('lowpass=f=5000,volume=-3dB')
  if (p.perspectiveProfile === 'close') soundFilters.push('highpass=f=35')
  if (p.roomProfile === 'small_room') soundFilters.push('aecho=0.8:0.22:35:0.12')
  if (p.roomProfile === 'large_room') soundFilters.push('aecho=0.8:0.18:90:0.16')
  if (p.roomProfile === 'exterior') soundFilters.push('highpass=f=80')
  if (p.dynamicsProfile === 'gentle_compression') soundFilters.push('acompressor=threshold=0.15:ratio=2:attack=20:release=180')
  if (p.dynamicsProfile === 'peak_limiter') soundFilters.push(`alimiter=limit=${p.outputLimiterLinear ?? 0.891}:level=disabled`)
  if (soundFilters.length > 0) {
    filters.push(`[${mixedSoundLabel}]${soundFilters.join(',')}[processed_sfx]`)
    processedSoundLabel = 'processed_sfx'
  }
  const attackMs = Math.round((p.duckAttackSeconds ?? 0.02) * 1_000)
  const releaseMs = Math.round((p.duckReleaseSeconds ?? 0.25) * 1_000)
  const ratio = Math.min(20, Math.max(1, Math.abs(p.dialogueDuckingDb ?? -9) * 1.25))
  if (dialogueIndex >= 0) {
    filters.push(`[${processedSoundLabel}][g${dialogueIndex}_sidechain]sidechaincompress=threshold=0.02:ratio=${ratio}:attack=${attackMs}:release=${releaseMs}[ducked]`)
  }
  // FFmpeg's alimiter enables auto-level compensation by default, which raises the
  // post-limiter signal back toward full scale and defeats an approved true-peak
  // ceiling. Disable that compensation so `limit` remains the actual output cap.
  if (dialogueIndex >= 0) {
    filters.push(`[g${dialogueIndex}_mix][ducked]amix=inputs=2:normalize=0,alimiter=limit=${p.outputLimiterLinear ?? 0.891}:level=disabled[out]`)
  } else {
    filters.push(`[${processedSoundLabel}]alimiter=limit=${p.outputLimiterLinear ?? 0.891}:level=disabled[out]`)
  }
  args.push(
    '-filter_complex', filters.join(';'), '-map', '[out]',
    '-ar', String(p.sampleRate ?? 48_000), '-ac', String(p.channels ?? 2),
    ...(p.provenanceTag ? ['-metadata', `comment=${p.provenanceTag}`] : []),
    ...outputCodec(input.outputContentType), temporaryPath,
  )
  return args
}

async function executeOutput(
  input: SoundLocalAudioExecutionPackage,
): Promise<{ artifact: SoundArtifactRef; replay: boolean }> {
  const outputRelativePath = input.outputRelativePath as string
  const outputExtension = input.outputContentType === 'audio/flac' ? '.flac' : '.wav'
  const tempDirectory = await ensurePrivateDirectoryWithinRoot({
    rootPath: input.privateOutputRoot,
    relativePath: `.sound-temp/${input.executionId}-${randomUUID()}`,
  })
  const tempPath = resolve(tempDirectory, `output${outputExtension}`)
  try {
    const sourceDurationSeconds = input.operation === 'loop_crossfade'
      ? (await probeAudio(input.sources[0]!.absolutePath)).durationSeconds
      : undefined
    const args = outputArguments(input, tempPath, sourceDurationSeconds)
    await execFileAsync(FFMPEG, args, {
      timeout: 600_000,
      maxBuffer: 16 * 1024 * 1024,
    })
    await probeAudio(tempPath)
    const bytes = await readFile(tempPath)
    if (bytes.length <= 0 || bytes.length > MAX_OUTPUT_BYTES) {
      throw new Error('Sound output is empty or exceeds its private artifact byte ceiling.')
    }
    const committed = await writePrivateFileCreateOnlyWithinRoot({
      rootPath: input.privateOutputRoot,
      relativePath: outputRelativePath,
      content: bytes,
    })
    const generatedChecksumSha256 = createHash('sha256').update(bytes).digest('hex')
    const identityCore = {
      schemaVersion: 'sound-local-output-provenance-v1',
      outputRelativePath,
      outputArtifactId: input.outputArtifactId,
      outputArtifactType: input.outputArtifactType,
      outputContentType: input.outputContentType,
      operation: input.operation,
      operationProfileKey: input.operationProfileKey,
      operationSpecHash: input.binding.operationSpecHash,
      routeKey: input.binding.routeBinding.routeKey,
      routeVersion: input.binding.routeBinding.routeVersion,
      routeHash: input.binding.routeBinding.routeHash,
      timelineRate: input.binding.timelineRate,
      sourceArtifacts: input.sources.map((source) => ({
        artifactId: source.artifact.artifactId,
        version: source.artifact.version,
        checksumSha256: source.artifact.checksumSha256,
      })),
      parameters: input.parameters,
    }
    const identityHash = createHash('sha256').update(stableJson(identityCore)).digest('hex')
    const provenanceRecord = {
      ...identityCore,
      identityHash,
      outputChecksumSha256: generatedChecksumSha256,
    }
    const provenanceRelativePath = `${outputRelativePath}.provenance.json`
    if (committed.created) {
      const provenanceCommit = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.privateOutputRoot,
        relativePath: provenanceRelativePath,
        content: Buffer.from(stableJson(provenanceRecord)),
      })
      if (!provenanceCommit.created) {
        const existing = JSON.parse(String(await readFile(provenanceCommit.absolutePath))) as typeof provenanceRecord
        if (existing.identityHash !== identityHash || existing.outputChecksumSha256 !== generatedChecksumSha256) {
          throw new Error('Sound idempotency collision: output provenance already belongs to another operation specification.')
        }
      }
    } else {
      let existing: typeof provenanceRecord
      try {
        existing = JSON.parse(String(await readFile(resolve(input.privateOutputRoot, provenanceRelativePath)))) as typeof provenanceRecord
      } catch {
        throw new Error('Sound idempotency collision: committed output has no valid immutable provenance binding.')
      }
      if (existing.identityHash !== identityHash || existing.operationSpecHash !== input.binding.operationSpecHash) {
        throw new Error('Sound idempotency collision: replay operation specification does not match committed output.')
      }
    }
    const committedBytes = await readFile(committed.absolutePath)
    const checksumSha256 = createHash('sha256').update(committedBytes).digest('hex')
    if (checksumSha256 !== generatedChecksumSha256) {
      throw new Error('Sound idempotency collision: deterministic replay bytes differ from committed output.')
    }
    return {
      replay: !committed.created,
      artifact: {
        artifactId: input.outputArtifactId as string,
        artifactType: input.outputArtifactType as string,
        version: 1,
        checksumSha256,
        storageObjectId: outputRelativePath.replaceAll('/', ':'),
        private: true,
        contentType: input.outputContentType ?? 'audio/wav',
        durationFrames: decimalSecondsToFrames({
          seconds: (await probeAudio(committed.absolutePath)).durationSeconds,
          rate: input.binding.timelineRate,
          rounding: 'nearest_half_up',
        }),
        timelineRate: input.binding.timelineRate,
      },
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true }).catch(() => undefined)
  }
}

function validatePackage(input: SoundLocalAudioExecutionPackage): void {
  assertKnownKeys(input, packageKeys, 'Sound local execution package')
  if (input.schemaVersion !== 'sound-local-audio-execution-v1') throw new Error('Unknown Sound local execution schema version.')
  if (
    input.binding.soundSkillVersion !== SOUND_SKILL_VERSION ||
    input.binding.soundManifestHash !== soundSkillCapabilityManifest.manifestHash
  ) throw new Error('Sound local execution manifest binding mismatch.')
  if (input.sources.some((source) => source.artifact.timelineRate &&
    !timelineRatesEqual(source.artifact.timelineRate, input.binding.timelineRate))) {
    throw new Error('Sound local execution source timeline-rate binding mismatch.')
  }
  if (
    !input.binding.approvedPlanSnapshotId || !input.binding.approvedPlanSnapshotHash ||
    !input.binding.approvedWorkItemId || !input.binding.privateOutputScopeId ||
    !input.binding.idempotencyKey || !/^[a-f0-9]{64}$/.test(input.binding.operationSpecHash)
  ) throw new Error('Sound local execution requires approved snapshot, work item, output scope, and idempotency bindings.')
  const invalidation = evaluateSoundRouteBindingInvalidation({ binding: input.binding.routeBinding })
  if (invalidation.stale) {
    throw new Error(`Sound local execution route binding is stale: ${invalidation.reasons.join(',')}`)
  }
  const profile = operationProfiles[input.operation]
  if (!profile || !profile.profileKeys.includes(input.operationProfileKey)) throw new Error('Unapproved Sound operation profile.')
  const expectedOperationKey = toolOperationByLocalOperation[input.operation]
  const operationBinding = input.binding.routeBinding.toolOperations.find((binding) =>
    binding.toolKey === 'ffmpeg' &&
    binding.operationKey === expectedOperationKey &&
    binding.operationProfileKey === input.operationProfileKey)
  if (!operationBinding) {
    throw new Error('Sound local execution lacks the exact FFmpeg operation/profile binding.')
  }
  const currentOperation = getToolOperationCapability(
    operationBinding.toolKey,
    operationBinding.operationKey,
    operationBinding.toolVersion,
  )
  if (!currentOperation ||
    currentOperation.manifest.toolManifestHash !== operationBinding.toolManifestHash ||
    currentOperation.operation.operationVersion !== operationBinding.operationVersion ||
    !qualificationSupportsToolMode(currentOperation.operation.qualificationByMode.preview_execution, 'preview_execution')) {
    throw new Error('Sound local FFmpeg operation is not privately qualified under the bound manifest.')
  }
  if (currentOperation.operation.executionRequirements.licenseEvidenceRequired && !operationBinding.licenseEvidenceRef) {
    throw new Error('Sound local FFmpeg execution requires bound private license/build evidence.')
  }
  if (input.sources.length < profile.minimumSources || input.sources.length > profile.maximumSources) {
    throw new Error('Sound operation source count is outside its bounded profile.')
  }
  if (profile.outputRequired && (
    !input.outputRelativePath || !input.outputArtifactId || !input.outputArtifactType || !input.outputContentType
  )) throw new Error('Sound output operation requires a private output artifact declaration.')
  if (!profile.outputRequired && (
    input.outputRelativePath || input.outputArtifactId || input.outputArtifactType || input.outputContentType
  )) throw new Error('Sound analysis operation must not declare a mutation output.')
  if (input.outputRelativePath && (isAbsolute(input.outputRelativePath) || input.outputRelativePath.split(/[\\/]/).includes('..'))) {
    throw new Error('Sound output path must be a safe server-owned relative path.')
  }
  if (input.outputRelativePath) {
    const outputPath = resolve(input.privateOutputRoot, input.outputRelativePath)
    if (input.sources.some((source) => resolve(source.absolutePath) === outputPath)) {
      throw new Error('Sound processing must not overwrite an approved source artifact.')
    }
  }
  validateParameters(input.operation, input.parameters)
}

export async function runSoundLocalAudioExecution(
  input: SoundLocalAudioExecutionPackage,
): Promise<SoundLocalAudioExecutionResult> {
  const startedAt = performance.now()
  validatePackage(input)
  await Promise.all(input.sources.map((source) => validateSource(source, input.approvedInputRoot)))
  const sourceChecksums = await Promise.all(input.sources.map((source) => checksumFile(source.absolutePath)))
  await Promise.all(input.sources.map((source) => probeAudio(source.absolutePath)))
  const [ffmpegVersion, ffprobeVersion] = await Promise.all([
    binaryVersion(FFMPEG),
    binaryVersion(FFPROBE),
  ])
  let studyReport: SoundAudioStudyReport | undefined
  let output: Awaited<ReturnType<typeof executeOutput>> | undefined
  if (input.operation === 'analyze' || input.operation === 'sync_qa') {
    studyReport = await studyAudio(input.sources[0]!.absolutePath)
    if (input.operation === 'sync_qa' && input.parameters.expectedHitSeconds !== undefined) {
      const closest = studyReport.transientTimesSeconds
        .map((time) => ({ time, distance: Math.abs(time - (input.parameters.expectedHitSeconds as number)) }))
        .sort((left, right) => left.distance - right.distance)[0]
      if (!closest || closest.distance > (input.parameters.maximumSyncErrorSeconds ?? 0.05)) {
        throw new Error('Sound synchronization QA found no transient inside the approved tolerance.')
      }
    }
  } else {
    output = await executeOutput(input)
  }
  const afterChecksums = await Promise.all(input.sources.map((source) => checksumFile(source.absolutePath)))
  if (sourceChecksums.some((checksum, index) => checksum !== afterChecksums[index])) {
    throw new Error('Sound source bytes changed during processing.')
  }
  const elapsedMilliseconds = Math.round(performance.now() - startedAt)
  return {
    schemaVersion: 'sound-local-audio-execution-result-v1',
    executionId: input.executionId,
    operation: input.operation,
    operationProfileKey: input.operationProfileKey,
    status: 'completed',
    idempotentReplay: output?.replay ?? false,
    sourceChecksumsSha256: sourceChecksums,
    sourceUnchanged: true,
    outputArtifact: output?.artifact,
    studyReport,
    toolEvidence: {
      ffmpegVersion,
      ffprobeVersion,
      nodeVersion: process.version,
      commandProfile: input.operationProfileKey,
      arbitraryArgumentsAccepted: false,
    },
    runtimeEvidence: {
      elapsedMilliseconds,
      localComputeCostUsd: Number((elapsedMilliseconds / 3_600_000 * 0.12).toFixed(8)),
      infrastructureCostEvidenceType: 'measured_elapsed_time_estimate',
    },
    qaEvidence: {
      inputMediaValidated: true,
      outputMediaValidated: Boolean(output),
      checksumValidated: true,
      sourceOverwritePrevented: true,
      privateArtifactPolicyPassed: true,
    },
  }
}

export function getSoundLocalOperationProfiles() {
  return structuredClone(operationProfiles)
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`
  return JSON.stringify(value)
}
