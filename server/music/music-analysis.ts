import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { decimalSecondsToFrames, type TimelineRate } from '../edit-skills/core/timeline-rate'
import type { MusicArtifactRef, MusicCandidateAnalysis } from './music-contracts'

const execFileAsync = promisify(execFile)

export interface ResolvedPrivateMusicArtifact {
  artifact: MusicArtifactRef
  absolutePath: string
  approvedRoot: string
}

export interface CanonicalMusicArtifactResolver {
  resolve(artifact: MusicArtifactRef): Promise<ResolvedPrivateMusicArtifact>
  privateOutputRoot(privateOutputScopeId: string): Promise<string>
}

function withinRoot(candidate: string, root: string): boolean {
  const normalizedCandidate = resolve(candidate)
  const normalizedRoot = resolve(root)
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}${sep}`)
}

export async function assertApprovedPrivateMusicArtifact(
  resolved: ResolvedPrivateMusicArtifact,
): Promise<{ bytes: Buffer; absolutePath: string }> {
  const [pathReal, rootReal, stat] = await Promise.all([
    realpath(resolved.absolutePath), realpath(resolved.approvedRoot), lstat(resolved.absolutePath),
  ])
  if (stat.isSymbolicLink()) throw new Error('Canonical Music rejects symlink artifact inputs.')
  if (!stat.isFile()) throw new Error('Canonical Music input must be a regular private file.')
  if (!withinRoot(pathReal, rootReal)) throw new Error('Canonical Music input escaped its approved private root.')
  const bytes = await readFile(pathReal)
  const checksum = createHash('sha256').update(bytes).digest('hex')
  if (checksum !== resolved.artifact.checksumSha256) throw new Error('Canonical Music input checksum mismatch.')
  if (resolved.artifact.byteSize !== undefined && resolved.artifact.byteSize !== bytes.byteLength) {
    throw new Error('Canonical Music input byte-size evidence is stale.')
  }
  return { bytes, absolutePath: pathReal }
}

interface ProbeResult {
  format?: { duration?: string; format_name?: string }
  streams?: Array<{ codec_type?: string; sample_rate?: string; channels?: number; codec_name?: string }>
}

async function probeAudio(path: string): Promise<{
  durationSeconds: number
  sampleRate: number
  channels: number
  codec: string
  format: string
}> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration,format_name:stream=codec_type,sample_rate,channels,codec_name',
    '-of', 'json', path,
  ], { timeout: 30_000, maxBuffer: 8 * 1024 * 1024 })
  const parsed = JSON.parse(stdout) as ProbeResult
  const stream = parsed.streams?.find((candidate) => candidate.codec_type === 'audio')
  const durationSeconds = Number(parsed.format?.duration)
  const sampleRate = Number(stream?.sample_rate)
  const channels = Number(stream?.channels)
  if (!stream || !Number.isFinite(durationSeconds) || durationSeconds <= 0 ||
    !Number.isSafeInteger(sampleRate) || sampleRate <= 0 || !Number.isSafeInteger(channels) || channels <= 0) {
    throw new Error('Canonical Music could not decode valid audio metadata.')
  }
  return {
    durationSeconds, sampleRate, channels,
    codec: stream.codec_name ?? 'unknown', format: parsed.format?.format_name ?? 'unknown',
  }
}

async function decodeMonoFloat(path: string, sampleRate = 8_000): Promise<Float32Array> {
  const { stdout } = await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', path,
    '-vn', '-ac', '1', '-ar', String(sampleRate), '-f', 'f32le', 'pipe:1',
  ], { encoding: 'buffer', timeout: 120_000, maxBuffer: 512 * 1024 * 1024 })
  const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout)
  const sampleCount = Math.floor(buffer.byteLength / 4)
  const samples = new Float32Array(sampleCount)
  for (let index = 0; index < sampleCount; index += 1) samples[index] = buffer.readFloatLE(index * 4)
  return samples
}

async function measureEbu(path: string): Promise<{ loudnessLufs: number | null; truePeakDbtp: number | null }> {
  try {
    const { stderr } = await execFileAsync('ffmpeg', [
      '-hide_banner', '-nostdin', '-i', path, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-',
    ], { timeout: 120_000, maxBuffer: 16 * 1024 * 1024 })
    const text = String(stderr)
    const loudnessMatches = [...text.matchAll(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/g)]
    const peakMatches = [...text.matchAll(/(?:True peak|Peak):\s*(-?\d+(?:\.\d+)?)\s*dBFS/g)]
    return {
      loudnessLufs: loudnessMatches.length > 0 ? Number(loudnessMatches.at(-1)?.[1]) : null,
      truePeakDbtp: peakMatches.length > 0 ? Number(peakMatches.at(-1)?.[1]) : null,
    }
  } catch {
    return { loudnessLufs: null, truePeakDbtp: null }
  }
}

function energyFrames(samples: Float32Array, frameSize: number): number[] {
  const values: number[] = []
  for (let start = 0; start < samples.length; start += frameSize) {
    let sum = 0
    const end = Math.min(samples.length, start + frameSize)
    for (let index = start; index < end; index += 1) sum += samples[index]! * samples[index]!
    values.push(Math.sqrt(sum / Math.max(1, end - start)))
  }
  return values
}

function estimateTempo(energy: readonly number[], framesPerSecond: number): number | null {
  if (energy.length < framesPerSecond * 2) return null
  const onset = energy.map((value, index) => Math.max(0, value - (energy[index - 1] ?? value)))
  let bestLag = 0
  let bestScore = 0
  const minimumLag = Math.max(1, Math.floor(framesPerSecond * 60 / 220))
  const maximumLag = Math.min(onset.length - 1, Math.ceil(framesPerSecond * 60 / 40))
  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    let score = 0
    for (let index = lag; index < onset.length; index += 1) score += onset[index]! * onset[index - lag]!
    if (score > bestScore) { bestScore = score; bestLag = lag }
  }
  return bestLag > 0 && bestScore > 1e-8 ? 60 * framesPerSecond / bestLag : null
}

function normalizeContour(energy: readonly number[], buckets = 20): number[] {
  if (energy.length === 0) return []
  const maximum = Math.max(...energy, 1e-9)
  return Array.from({ length: Math.min(buckets, energy.length) }, (_, bucket) => {
    const start = Math.floor(bucket * energy.length / Math.min(buckets, energy.length))
    const end = Math.max(start + 1, Math.floor((bucket + 1) * energy.length / Math.min(buckets, energy.length)))
    const average = energy.slice(start, end).reduce((sum, value) => sum + value, 0) / (end - start)
    return Number((average / maximum).toFixed(6))
  })
}

function frameGrid(input: {
  durationSeconds: number
  tempoBpm: number | null
  rate: TimelineRate
  beatsPerBoundary: number
}): number[] {
  if (!input.tempoBpm) return []
  const secondsPerBoundary = 60 / input.tempoBpm * input.beatsPerBoundary
  const result: number[] = []
  for (let seconds = 0; seconds < input.durationSeconds; seconds += secondsPerBoundary) {
    result.push(decimalSecondsToFrames({ seconds, rate: input.rate, rounding: 'nearest_half_up' }))
  }
  return result
}

export async function analyzePrivateMusicArtifact(input: {
  resolved: ResolvedPrivateMusicArtifact
  timelineRate: TimelineRate
}): Promise<MusicCandidateAnalysis & { mediaEvidence: { codec: string; format: string; checksumSha256: string } }> {
  const verified = await assertApprovedPrivateMusicArtifact(input.resolved)
  const [probe, samples, ebu] = await Promise.all([
    probeAudio(verified.absolutePath), decodeMonoFloat(verified.absolutePath), measureEbu(verified.absolutePath),
  ])
  let clippedSampleCount = 0
  let silentSampleCount = 0
  for (const sample of samples) {
    if (Math.abs(sample) >= 0.999) clippedSampleCount += 1
    if (Math.abs(sample) < 0.0001) silentSampleCount += 1
  }
  const sampleRate = 8_000
  const frameSize = 160
  const energy = energyFrames(samples, frameSize)
  const tempo = estimateTempo(energy, sampleRate / frameSize)
  const beats = frameGrid({ durationSeconds: probe.durationSeconds, tempoBpm: tempo, rate: input.timelineRate, beatsPerBoundary: 1 })
  const phrases = frameGrid({ durationSeconds: probe.durationSeconds, tempoBpm: tempo, rate: input.timelineRate, beatsPerBoundary: 16 })
  const sections = frameGrid({ durationSeconds: probe.durationSeconds, tempoBpm: tempo, rate: input.timelineRate, beatsPerBoundary: 32 })
  const window = Math.min(400, Math.floor(samples.length / 2))
  let loopDifference = 0
  let endingEnergy = 0
  for (let index = 0; index < window; index += 1) {
    loopDifference += Math.abs(samples[index]! - samples[samples.length - window + index]!)
    endingEnergy += Math.abs(samples[samples.length - window + index]!)
  }
  const loopScore = Math.max(0, Math.min(1, 1 - loopDifference / Math.max(1, window)))
  const endingScore = Math.max(0, Math.min(1, 1 - endingEnergy / Math.max(1, window)))
  return {
    candidateArtifact: input.resolved.artifact,
    decodeSucceeded: true,
    durationSeconds: probe.durationSeconds,
    sampleRate: probe.sampleRate,
    channels: probe.channels,
    integratedLoudnessLufs: ebu.loudnessLufs,
    truePeakDbtp: ebu.truePeakDbtp,
    clippedSampleCount,
    silenceRatio: samples.length === 0 ? 1 : silentSampleCount / samples.length,
    measuredTempoBpm: tempo ? Number(tempo.toFixed(3)) : null,
    beatFrames: beats,
    phraseBoundaryFrames: phrases,
    sectionBoundaryFrames: sections,
    chromaKeyEvidence: null,
    energyContour: normalizeContour(energy),
    measuredVocalEvidence: { present: null, confidence: 0, reviewRequired: true },
    loopQuality: { score: Number(loopScore.toFixed(6)), reviewRequired: true },
    endingQuality: { score: Number(endingScore.toFixed(6)), reviewRequired: true },
    generationArtifactFindings: clippedSampleCount > 0 ? ['clipping_detected'] : [],
    qualificationEvidence: [
      'actual_private_audio_bytes', 'ffprobe_decode', 'ffmpeg_ebur128',
      'pcm_sample_peak_and_silence', 'bounded_tempo_autocorrelation',
      'subjective_music_findings_not_automatically_qualified',
    ],
    mediaEvidence: {
      codec: probe.codec, format: probe.format,
      checksumSha256: createHash('sha256').update(verified.bytes).digest('hex'),
    },
  }
}

export interface MusicCandidateSelectionDecision {
  candidateIds: string[]
  candidateHashes: string[]
  measuredScores: Record<string, number>
  blockingFailures: Record<string, string[]>
  reviewRequiredFindings: Record<string, string[]>
  selectedCandidateId: string | null
  selectionPolicyVersion: 'music.candidate_selection.v3'
  evidenceHash: string
}

export function selectMusicCandidate(input: {
  analyses: readonly MusicCandidateAnalysis[]
  expectedDurationFrames: number
  timelineRate: TimelineRate
  speechProtected: boolean
}): MusicCandidateSelectionDecision {
  if (input.analyses.length === 0) throw new Error('Music candidate selection requires at least one independently analyzed candidate.')
  const targetSeconds = input.expectedDurationFrames * input.timelineRate.denominator / input.timelineRate.numerator
  const measuredScores: Record<string, number> = {}
  const blockingFailures: Record<string, string[]> = {}
  const reviewRequiredFindings: Record<string, string[]> = {}
  for (const analysis of input.analyses) {
    const id = analysis.candidateArtifact.artifactId
    const failures: string[] = []
    if (!analysis.decodeSucceeded) failures.push('decode_failed')
    if (analysis.clippedSampleCount > 0) failures.push('clipping_detected')
    // A longer approved Music source is editorially usable because MusicSync may
    // select a bounded phrase/section before Sound trims it. Only a source that
    // is materially too short is blocked at candidate-selection time.
    if (analysis.durationSeconds + Math.max(0.25, targetSeconds * 0.1) < targetSeconds &&
      analysis.loopQuality.score < 0.65) {
      failures.push('duration_too_short_for_cue_without_loop')
    }
    blockingFailures[id] = failures
    reviewRequiredFindings[id] = [
      ...(analysis.measuredVocalEvidence.reviewRequired && input.speechProtected ? ['vocal_presence_requires_review'] : []),
      ...(analysis.loopQuality.reviewRequired ? ['loop_quality_requires_review'] : []),
      ...(analysis.endingQuality.reviewRequired ? ['ending_quality_requires_review'] : []),
    ]
    const durationFit = Math.max(0, 1 - Math.abs(analysis.durationSeconds - targetSeconds) / Math.max(1, targetSeconds))
    const peakSafety = analysis.truePeakDbtp === null ? 0.4 : analysis.truePeakDbtp <= -1 ? 1 : 0.2
    const silenceQuality = Math.max(0, 1 - analysis.silenceRatio)
    measuredScores[id] = Number((durationFit * 0.45 + peakSafety * 0.25 + silenceQuality * 0.2 + analysis.endingQuality.score * 0.1).toFixed(6))
  }
  const selected = [...input.analyses]
    .filter((analysis) => blockingFailures[analysis.candidateArtifact.artifactId]!.length === 0)
    .sort((left, right) => measuredScores[right.candidateArtifact.artifactId]! - measuredScores[left.candidateArtifact.artifactId]! ||
      left.candidateArtifact.artifactId.localeCompare(right.candidateArtifact.artifactId))[0]
  const base = {
    candidateIds: input.analyses.map((analysis) => analysis.candidateArtifact.artifactId),
    candidateHashes: input.analyses.map((analysis) => analysis.candidateArtifact.checksumSha256),
    measuredScores, blockingFailures, reviewRequiredFindings,
    selectedCandidateId: selected?.candidateArtifact.artifactId ?? null,
    selectionPolicyVersion: 'music.candidate_selection.v3' as const,
  }
  return {
    ...base,
    evidenceHash: createHash('sha256').update(JSON.stringify(base)).digest('hex'),
  }
}
