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
  expectedHitSeconds?: number
  maximumSyncErrorSeconds?: number
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
  profileKey: string
  outputRequired: boolean
  minimumSources: number
  maximumSources: number
}> = {
  analyze: { profileKey: 'sound.analyze.v1', outputRequired: false, minimumSources: 1, maximumSources: 1 },
  extract: { profileKey: 'sound.extract.pcm.v1', outputRequired: true, minimumSources: 1, maximumSources: 1 },
  trim_fade_gain: { profileKey: 'sound.trim-fade-gain.v1', outputRequired: true, minimumSources: 1, maximumSources: 1 },
  normalize: { profileKey: 'sound.normalize.v1', outputRequired: true, minimumSources: 1, maximumSources: 1 },
  resample_channels: { profileKey: 'sound.resample-channels.v1', outputRequired: true, minimumSources: 1, maximumSources: 1 },
  loop_crossfade: { profileKey: 'sound.loop.v1', outputRequired: true, minimumSources: 1, maximumSources: 1 },
  stretch_pitch: { profileKey: 'sound.stretch-pitch.v1', outputRequired: true, minimumSources: 1, maximumSources: 1 },
  mix_stem: { profileKey: 'sound.mix-stem.v1', outputRequired: true, minimumSources: 2, maximumSources: 16 },
  sync_qa: { profileKey: 'sound.sync-qa.v1', outputRequired: false, minimumSources: 1, maximumSources: 1 },
  cleanup_gentle: { profileKey: 'sound.cleanup.gentle.v1', outputRequired: true, minimumSources: 1, maximumSources: 1 },
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
  'maximumSyncErrorSeconds',
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
}> {
  const sampleRate = 8_000
  const result = await execFileAsync(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', path,
    '-t', '600', '-vn', '-ac', '1', '-ar', String(sampleRate),
    '-f', 'f32le', 'pipe:1',
  ], {
    timeout: 120_000,
    maxBuffer: 32 * 1024 * 1024,
    encoding: 'buffer',
  } as Parameters<typeof execFileAsync>[2])
  const bytes = Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout)
  const sampleCount = Math.floor(bytes.length / 4)
  let squareSum = 0
  let peak = 0
  let clipping = 0
  let previous = 0
  const transients: number[] = []
  const silenceRanges: Array<{ startSeconds: number; endSeconds: number }> = []
  let silenceStart: number | undefined
  const silenceThreshold = 10 ** (-45 / 20)
  const transientThreshold = 0.35
  const minimumSilenceSamples = Math.round(sampleRate * 0.2)
  const minimumTransientGap = Math.round(sampleRate * 0.04)
  let lastTransient = -minimumTransientGap
  let zeroCrossings = 0

  for (let index = 0; index < sampleCount; index += 1) {
    const value = bytes.readFloatLE(index * 4)
    const absolute = Math.abs(value)
    peak = Math.max(peak, absolute)
    squareSum += value * value
    if (absolute >= 0.999) clipping += 1
    if (Math.abs(value - previous) >= transientThreshold && index - lastTransient >= minimumTransientGap) {
      transients.push(Number((index / sampleRate).toFixed(4)))
      lastTransient = index
    }
    if (index > 0 && ((value >= 0 && previous < 0) || (value < 0 && previous >= 0))) {
      zeroCrossings += 1
    }
    if (absolute < silenceThreshold) {
      silenceStart ??= index
    } else if (silenceStart !== undefined) {
      if (index - silenceStart >= minimumSilenceSamples) {
        silenceRanges.push({
          startSeconds: Number((silenceStart / sampleRate).toFixed(4)),
          endSeconds: Number((index / sampleRate).toFixed(4)),
        })
      }
      silenceStart = undefined
    }
    previous = value
  }
  if (silenceStart !== undefined && sampleCount - silenceStart >= minimumSilenceSamples) {
    silenceRanges.push({
      startSeconds: Number((silenceStart / sampleRate).toFixed(4)),
      endSeconds: Number((sampleCount / sampleRate).toFixed(4)),
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
    zeroCrossingRate: Number((zeroCrossings / Math.max(1, sampleCount - 1)).toFixed(6)),
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
    const filter = `loudnorm=I=${p.targetLoudnessLufs ?? -16}:TP=${p.maximumTruePeakDbtp ?? -1}:LRA=11`
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
  const dialogueIndex = p.dialogueInputIndex ?? 0
  if (!Number.isInteger(dialogueIndex) || dialogueIndex < 0 || dialogueIndex >= input.sources.length) {
    throw new Error('dialogueInputIndex is outside the approved source set.')
  }
  const gains = input.sources.map((_, index) => p.inputGainDb?.[index] ?? 0)
  const filters = gains.map((gain, index) => `[${index}:a]volume=${gain}dB[g${index}]`)
  const soundLabels = input.sources.map((_, index) => index).filter((index) => index !== dialogueIndex)
  if (soundLabels.length === 0) throw new Error('Sound mix requires at least one non-dialogue layer.')
  if (soundLabels.length === 1) {
    filters.push(`[g${soundLabels[0]}][g${dialogueIndex}]sidechaincompress=threshold=0.02:ratio=10:attack=20:release=250[ducked]`)
  } else {
    filters.push(`${soundLabels.map((index) => `[g${index}]`).join('')}amix=inputs=${soundLabels.length}:normalize=0[sfxmix]`)
    filters.push(`[sfxmix][g${dialogueIndex}]sidechaincompress=threshold=0.02:ratio=10:attack=20:release=250[ducked]`)
  }
  filters.push(`[g${dialogueIndex}][ducked]amix=inputs=2:normalize=0,alimiter=limit=0.891[out]`)
  args.push(
    '-filter_complex', filters.join(';'), '-map', '[out]',
    '-ar', String(p.sampleRate ?? 48_000), '-ac', String(p.channels ?? 2),
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
    const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
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
        durationFrames: Math.round((await probeAudio(committed.absolutePath)).durationSeconds * 30),
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
  if (
    !input.binding.approvedPlanSnapshotId || !input.binding.approvedPlanSnapshotHash ||
    !input.binding.approvedWorkItemId || !input.binding.privateOutputScopeId ||
    !input.binding.idempotencyKey
  ) throw new Error('Sound local execution requires approved snapshot, work item, output scope, and idempotency bindings.')
  const invalidation = evaluateSoundRouteBindingInvalidation({ binding: input.binding.routeBinding })
  if (invalidation.stale) {
    throw new Error(`Sound local execution route binding is stale: ${invalidation.reasons.join(',')}`)
  }
  const profile = operationProfiles[input.operation]
  if (!profile || profile.profileKey !== input.operationProfileKey) throw new Error('Unapproved Sound operation profile.')
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
