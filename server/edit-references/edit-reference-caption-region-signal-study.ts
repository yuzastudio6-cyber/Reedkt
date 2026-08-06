import { execFile } from 'node:child_process'
import type {
  PreferenceTechnicalCaptionRegionCandidate,
  PreferenceTechnicalCaptionRegionFrameObservation,
  PreferenceTechnicalCaptionRegionSignalEvidence,
} from '../../src/types/edit-reference'
import {
  assertExistingLocalFile,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

const TECHNICAL_CAPTION_REGION_SIGNAL_SCHEMA_VERSION = 'edit-reference-technical-caption-region-signal-v1' as const

interface GrayscaleFrame {
  width: number
  height: number
  pixels: Buffer
}

interface PixelComponent {
  minX: number
  minY: number
  maxX: number
  maxY: number
  pixelCount: number
}

interface TextLineCandidate extends PixelComponent {
  componentCount: number
}

interface TextRegionCandidate extends TextLineCandidate {
  lineCount: number
}

/**
 * Measures bounded high-contrast, text-like region geometry in sampled private
 * frames. This is intentionally not OCR: it recognizes no characters, stores
 * no text, and cannot decide whether a candidate is a caption, title, label,
 * UI element, texture, or another high-contrast visual detail.
 */
export async function runEditReferenceCaptionRegionSignalStudy(input: {
  sourceLocalPath: string
  ffmpegBin: string
  timeoutMs: number
  durationSeconds: number
  maxSampleCount?: number
  maxRegionCountPerFrame?: number
  maxScanDurationSeconds?: number
  outputMaxDimension?: number
  brightnessThreshold8Bit?: number
  localContrastThreshold8Bit?: number
}): Promise<PreferenceTechnicalCaptionRegionSignalEvidence> {
  const maxSampleCount = Math.round(boundedNumber(input.maxSampleCount, 24, 2, 24))
  const maxRegionCountPerFrame = Math.round(boundedNumber(input.maxRegionCountPerFrame, 4, 1, 8))
  const maxScanDurationSeconds = boundedNumber(input.maxScanDurationSeconds, 120, 0.25, 600)
  const outputMaxDimension = Math.round(boundedNumber(input.outputMaxDimension, 320, 96, 480))
  const brightnessThreshold8Bit = Math.round(boundedNumber(input.brightnessThreshold8Bit, 220, 128, 255))
  const localContrastThreshold8Bit = Math.round(boundedNumber(input.localContrastThreshold8Bit, 96, 24, 255))
  const sourceDurationSeconds = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0
    ? input.durationSeconds
    : 0
  const scannedDurationSeconds = rounded(Math.min(sourceDurationSeconds, maxScanDurationSeconds))

  if (scannedDurationSeconds <= 0) {
    return createBlockedEditReferenceCaptionRegionSignalResult({
      maxSampleCount,
      maxRegionCountPerFrame,
      outputMaxDimension,
      brightnessThreshold8Bit,
      localContrastThreshold8Bit,
      blockerCode: 'caption_region_signal_duration_unavailable',
      blockerMessage: 'A bounded caption-region signal check needs a verified positive media duration.',
    })
  }

  const coverage: PreferenceTechnicalCaptionRegionSignalEvidence['coverage'] = sourceDurationSeconds <= maxScanDurationSeconds + 0.001
    ? 'full'
    : 'partial'
  const sampleIntervalSeconds = Math.max(scannedDurationSeconds / maxSampleCount, 0.04)

  try {
    assertExistingLocalFile(input.sourceLocalPath)
    const filter = [
      'setpts=PTS-STARTPTS',
      `fps=fps=1/${formatFilterNumber(sampleIntervalSeconds)}:round=down`,
      `scale=w=${outputMaxDimension}:h=${outputMaxDimension}:force_original_aspect_ratio=decrease:flags=area`,
      'format=gray',
    ].join(',')
    const args = [
      '-hide_banner',
      '-nostdin',
      '-loglevel',
      'error',
      '-i',
      input.sourceLocalPath,
      '-t',
      String(scannedDurationSeconds),
      '-map',
      '0:v:0',
      '-vf',
      filter,
      '-frames:v',
      String(maxSampleCount),
      '-an',
      '-c:v',
      'pgm',
      '-f',
      'image2pipe',
      'pipe:1',
    ]
    for (const arg of args) assertNoSignedUrlOrRawUrl(arg, 'editReferenceCaptionRegionSignalArg')

    const stdout = await runFFmpegFramePipe({
      ffmpegBin: input.ffmpegBin,
      args,
      timeoutMs: input.timeoutMs,
      maxBufferBytes: Math.max(4 * 1024 * 1024, maxSampleCount * outputMaxDimension * outputMaxDimension * 2),
    })
    const frames = parsePgmFrames(stdout, maxSampleCount, outputMaxDimension)
    if (frames.length === 0) {
      return createBlockedEditReferenceCaptionRegionSignalResult({
        maxSampleCount,
        maxRegionCountPerFrame,
        outputMaxDimension,
        brightnessThreshold8Bit,
        localContrastThreshold8Bit,
        scannedDurationSeconds,
        coverage,
        blockerCode: 'caption_region_signal_samples_unavailable',
        blockerMessage: 'The bounded caption-region signal check returned no valid technical samples.',
      })
    }

    const observations = frames.map((frame, frameIndex) => analyzeFrame({
      frame,
      frameIndex,
      sampleTimeSeconds: rounded(Math.min(frameIndex * sampleIntervalSeconds, scannedDurationSeconds)),
      maxRegionCountPerFrame,
      brightnessThreshold8Bit,
      localContrastThreshold8Bit,
    }))
    const regions = observations.flatMap((observation) => observation.candidateRegions)
    const framesWithCandidates = observations.filter((observation) => observation.candidateRegions.length > 0).length
    const lowerRegionCandidateCount = regions.filter((region) => region.lowerFrameRegion).length
    const singleLineCandidateCount = regions.filter((region) => region.lineCount === 1).length

    return {
      schemaVersion: TECHNICAL_CAPTION_REGION_SIGNAL_SCHEMA_VERSION,
      status: 'verified_local_bounded',
      maxSampleCount,
      maxRegionCountPerFrame,
      outputMaxDimension,
      brightnessThreshold8Bit,
      localContrastThreshold8Bit,
      sampleCount: observations.length,
      sampleTimesSeconds: observations.map((observation) => observation.sampleTimeSeconds),
      sampleIntervalSeconds: rounded(sampleIntervalSeconds),
      scannedDurationSeconds,
      coverage,
      observations,
      framesWithCandidates,
      candidateFrameRatio: ratio(framesWithCandidates, observations.length),
      totalCandidateRegionCount: regions.length,
      lowerRegionCandidateCount,
      lowerRegionCandidateRatio: ratio(lowerRegionCandidateCount, regions.length),
      singleLineCandidateCount,
      multiLineCandidateCount: regions.length - singleLineCandidateCount,
      technicalTextRegionCandidateAnalysisRan: true,
      ocrEngineExecuted: false,
      exactTextRecognitionRan: false,
      transcriptAlignmentRan: false,
      semanticCaptionDesignAnalysisRan: false,
      fontInferenceRan: false,
      captionAnimationInferenceRan: false,
      rawFramePixelsPersisted: false,
      rawRecognizedTextPersisted: false,
      rawProcessOutputPersisted: false,
    }
  } catch {
    return createBlockedEditReferenceCaptionRegionSignalResult({
      maxSampleCount,
      maxRegionCountPerFrame,
      outputMaxDimension,
      brightnessThreshold8Bit,
      localContrastThreshold8Bit,
      scannedDurationSeconds,
      coverage,
      blockerCode: 'ffmpeg_caption_region_signal_scan_failed',
      blockerMessage: 'The bounded caption-region signal check did not complete. No frame pixels, text, or raw process output were persisted.',
    })
  }
}

export function createNotRunEditReferenceCaptionRegionSignalResult(): PreferenceTechnicalCaptionRegionSignalEvidence {
  return baseUnresolvedResult({ status: 'not_run' })
}

export function createBlockedEditReferenceCaptionRegionSignalResult(input: {
  maxSampleCount?: number
  maxRegionCountPerFrame?: number
  outputMaxDimension?: number
  brightnessThreshold8Bit?: number
  localContrastThreshold8Bit?: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalCaptionRegionSignalEvidence['coverage']
  blockerCode: string
  blockerMessage: string
}): PreferenceTechnicalCaptionRegionSignalEvidence {
  return {
    ...baseUnresolvedResult({
      status: 'blocked',
      maxSampleCount: input.maxSampleCount,
      maxRegionCountPerFrame: input.maxRegionCountPerFrame,
      outputMaxDimension: input.outputMaxDimension,
      brightnessThreshold8Bit: input.brightnessThreshold8Bit,
      localContrastThreshold8Bit: input.localContrastThreshold8Bit,
      scannedDurationSeconds: input.scannedDurationSeconds,
      coverage: input.coverage,
    }),
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
  }
}

function baseUnresolvedResult(input: {
  status: 'blocked' | 'not_run'
  maxSampleCount?: number
  maxRegionCountPerFrame?: number
  outputMaxDimension?: number
  brightnessThreshold8Bit?: number
  localContrastThreshold8Bit?: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalCaptionRegionSignalEvidence['coverage']
}): PreferenceTechnicalCaptionRegionSignalEvidence {
  return {
    schemaVersion: TECHNICAL_CAPTION_REGION_SIGNAL_SCHEMA_VERSION,
    status: input.status,
    maxSampleCount: input.maxSampleCount ?? 24,
    maxRegionCountPerFrame: input.maxRegionCountPerFrame ?? 4,
    outputMaxDimension: input.outputMaxDimension ?? 320,
    brightnessThreshold8Bit: input.brightnessThreshold8Bit ?? 220,
    localContrastThreshold8Bit: input.localContrastThreshold8Bit ?? 96,
    sampleCount: 0,
    sampleTimesSeconds: [],
    scannedDurationSeconds: input.scannedDurationSeconds ?? 0,
    coverage: input.coverage ?? 'not_run',
    observations: [],
    framesWithCandidates: 0,
    candidateFrameRatio: 0,
    totalCandidateRegionCount: 0,
    lowerRegionCandidateCount: 0,
    lowerRegionCandidateRatio: 0,
    singleLineCandidateCount: 0,
    multiLineCandidateCount: 0,
    technicalTextRegionCandidateAnalysisRan: false,
    ocrEngineExecuted: false,
    exactTextRecognitionRan: false,
    transcriptAlignmentRan: false,
    semanticCaptionDesignAnalysisRan: false,
    fontInferenceRan: false,
    captionAnimationInferenceRan: false,
    rawFramePixelsPersisted: false,
    rawRecognizedTextPersisted: false,
    rawProcessOutputPersisted: false,
  }
}

function runFFmpegFramePipe(input: {
  ffmpegBin: string
  args: string[]
  timeoutMs: number
  maxBufferBytes: number
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(input.ffmpegBin, input.args, {
      timeout: input.timeoutMs,
      windowsHide: true,
      maxBuffer: input.maxBufferBytes,
      encoding: 'buffer',
    }, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      resolve(Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout))
    })
  })
}

function parsePgmFrames(buffer: Buffer, maxFrameCount: number, outputMaxDimension: number): GrayscaleFrame[] {
  const frames: GrayscaleFrame[] = []
  let offset = 0
  while (offset < buffer.length && frames.length < maxFrameCount) {
    offset = skipAsciiWhitespace(buffer, offset)
    if (offset >= buffer.length) break
    const magic = readAsciiToken(buffer, offset)
    if (magic.value !== 'P5') throw new Error('Caption-region frame stream is not binary PGM.')
    const widthToken = readAsciiToken(buffer, magic.nextOffset)
    const heightToken = readAsciiToken(buffer, widthToken.nextOffset)
    const maxValueToken = readAsciiToken(buffer, heightToken.nextOffset)
    const width = Number(widthToken.value)
    const height = Number(heightToken.value)
    const maxValue = Number(maxValueToken.value)
    if (
      !Number.isInteger(width)
      || !Number.isInteger(height)
      || width < 1
      || height < 1
      || width > outputMaxDimension
      || height > outputMaxDimension
      || maxValue !== 255
    ) {
      throw new Error('Caption-region PGM dimensions or range are invalid.')
    }
    offset = consumePgmHeaderSeparator(buffer, maxValueToken.nextOffset)
    const byteLength = width * height
    if (offset + byteLength > buffer.length) throw new Error('Caption-region PGM frame is truncated.')
    frames.push({ width, height, pixels: buffer.subarray(offset, offset + byteLength) })
    offset += byteLength
  }
  if (skipAsciiWhitespace(buffer, offset) < buffer.length && frames.length < maxFrameCount) {
    throw new Error('Caption-region PGM stream contains unsupported trailing bytes.')
  }
  return frames
}

function readAsciiToken(buffer: Buffer, initialOffset: number): { value: string; nextOffset: number } {
  let offset = skipAsciiWhitespaceAndComments(buffer, initialOffset)
  const start = offset
  while (offset < buffer.length && !isAsciiWhitespace(buffer[offset])) offset += 1
  if (offset === start) throw new Error('Caption-region PGM token is missing.')
  return { value: buffer.toString('ascii', start, offset), nextOffset: offset }
}

function skipAsciiWhitespaceAndComments(buffer: Buffer, initialOffset: number): number {
  let offset = initialOffset
  while (offset < buffer.length) {
    offset = skipAsciiWhitespace(buffer, offset)
    if (buffer[offset] !== 35) return offset
    while (offset < buffer.length && buffer[offset] !== 10 && buffer[offset] !== 13) offset += 1
  }
  return offset
}

function skipAsciiWhitespace(buffer: Buffer, initialOffset: number): number {
  let offset = initialOffset
  while (offset < buffer.length && isAsciiWhitespace(buffer[offset])) offset += 1
  return offset
}

function consumePgmHeaderSeparator(buffer: Buffer, initialOffset: number): number {
  if (!isAsciiWhitespace(buffer[initialOffset])) throw new Error('Caption-region PGM header separator is missing.')
  if (buffer[initialOffset] === 13 && buffer[initialOffset + 1] === 10) return initialOffset + 2
  return initialOffset + 1
}

function isAsciiWhitespace(value: number | undefined): boolean {
  return value === 9 || value === 10 || value === 11 || value === 12 || value === 13 || value === 32
}

function analyzeFrame(input: {
  frame: GrayscaleFrame
  frameIndex: number
  sampleTimeSeconds: number
  maxRegionCountPerFrame: number
  brightnessThreshold8Bit: number
  localContrastThreshold8Bit: number
}): PreferenceTechnicalCaptionRegionFrameObservation {
  const components = findTextLikeComponents(
    input.frame,
    input.brightnessThreshold8Bit,
    input.localContrastThreshold8Bit,
  )
  const regions = buildTextRegionCandidates(components, input.frame.width, input.frame.height)
    .sort((a, b) => regionScore(b, input.frame.width, input.frame.height) - regionScore(a, input.frame.width, input.frame.height))
    .slice(0, input.maxRegionCountPerFrame)
    .sort((a, b) => a.minY - b.minY || a.minX - b.minX)
    .map((region, regionIndex) => serializeRegion(region, input.frameIndex, regionIndex, input.frame.width, input.frame.height))

  return {
    sampleTimeSeconds: input.sampleTimeSeconds,
    frameWidth: input.frame.width,
    frameHeight: input.frame.height,
    candidateRegions: regions,
  }
}

function findTextLikeComponents(
  frame: GrayscaleFrame,
  brightnessThreshold8Bit: number,
  localContrastThreshold8Bit: number,
): PixelComponent[] {
  const candidate = new Uint8Array(frame.width * frame.height)
  const radius = 2
  for (let y = radius; y < frame.height - radius; y += 1) {
    for (let x = radius; x < frame.width - radius; x += 1) {
      const index = (y * frame.width) + x
      const value = frame.pixels[index]
      if (value < brightnessThreshold8Bit) continue
      let contrastingNeighbor = false
      for (let dy = -radius; dy <= radius && !contrastingNeighbor; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (dx === 0 && dy === 0) continue
          const neighbor = frame.pixels[((y + dy) * frame.width) + x + dx]
          if (value - neighbor >= localContrastThreshold8Bit) {
            contrastingNeighbor = true
            break
          }
        }
      }
      if (contrastingNeighbor) candidate[index] = 1
    }
  }

  const visited = new Uint8Array(candidate.length)
  const components: PixelComponent[] = []
  const maxComponentWidth = Math.max(12, Math.floor(frame.width * 0.12))
  const maxComponentHeight = Math.max(12, Math.floor(frame.height * 0.15))
  for (let start = 0; start < candidate.length; start += 1) {
    if (candidate[start] !== 1 || visited[start] === 1) continue
    const queue = [start]
    visited[start] = 1
    let cursor = 0
    let minX = frame.width
    let minY = frame.height
    let maxX = 0
    let maxY = 0
    let pixelCount = 0
    while (cursor < queue.length) {
      const index = queue[cursor]
      cursor += 1
      const x = index % frame.width
      const y = Math.floor(index / frame.width)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      pixelCount += 1
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue
          const neighborX = x + dx
          const neighborY = y + dy
          if (neighborX < 0 || neighborX >= frame.width || neighborY < 0 || neighborY >= frame.height) continue
          const neighborIndex = (neighborY * frame.width) + neighborX
          if (candidate[neighborIndex] !== 1 || visited[neighborIndex] === 1) continue
          visited[neighborIndex] = 1
          queue.push(neighborIndex)
        }
      }
    }
    const componentWidth = maxX - minX + 1
    const componentHeight = maxY - minY + 1
    if (
      pixelCount >= 2
      && componentWidth <= maxComponentWidth
      && componentHeight <= maxComponentHeight
      && componentWidth / Math.max(1, componentHeight) <= 8
      && componentHeight / Math.max(1, componentWidth) <= 8
    ) {
      components.push({ minX, minY, maxX, maxY, pixelCount })
    }
  }
  return components
}

function buildTextRegionCandidates(components: PixelComponent[], frameWidth: number, frameHeight: number): TextRegionCandidate[] {
  const lineTolerance = Math.max(3, Math.round(frameHeight * 0.035))
  const lines: TextLineCandidate[] = []
  for (const component of [...components].sort((a, b) => centerY(a) - centerY(b) || a.minX - b.minX)) {
    const line = lines.find((candidate) => Math.abs(centerY(candidate) - centerY(component)) <= lineTolerance)
    if (!line) {
      lines.push({ ...component, componentCount: 1 })
      continue
    }
    mergeBounds(line, component)
    line.pixelCount += component.pixelCount
    line.componentCount += 1
  }

  const viableLines = lines.filter((line) => {
    const lineWidth = line.maxX - line.minX + 1
    const lineHeight = line.maxY - line.minY + 1
    return line.componentCount >= 3
      && lineWidth >= Math.max(10, frameWidth * 0.05)
      && lineWidth <= frameWidth * 0.96
      && lineHeight <= frameHeight * 0.18
  })
  const regions: TextRegionCandidate[] = []
  const mergeGap = Math.max(4, Math.round(frameHeight * 0.08))
  for (const line of viableLines.sort((a, b) => a.minY - b.minY || a.minX - b.minX)) {
    const region = regions.find((candidate) => {
      const verticalGap = Math.max(0, line.minY - candidate.maxY - 1, candidate.minY - line.maxY - 1)
      return verticalGap <= mergeGap && horizontalOverlapRatio(candidate, line) >= 0.15
    })
    if (!region) {
      regions.push({ ...line, lineCount: 1 })
      continue
    }
    mergeBounds(region, line)
    region.pixelCount += line.pixelCount
    region.componentCount += line.componentCount
    region.lineCount += 1
  }
  return regions.filter((region) => {
    const regionWidth = region.maxX - region.minX + 1
    const regionHeight = region.maxY - region.minY + 1
    return region.lineCount <= 3 && regionWidth <= frameWidth * 0.98 && regionHeight <= frameHeight * 0.32
  })
}

function serializeRegion(
  region: TextRegionCandidate,
  frameIndex: number,
  regionIndex: number,
  frameWidth: number,
  frameHeight: number,
): PreferenceTechnicalCaptionRegionCandidate {
  const padding = 2
  const minX = Math.max(0, region.minX - padding)
  const minY = Math.max(0, region.minY - padding)
  const maxX = Math.min(frameWidth - 1, region.maxX + padding)
  const maxY = Math.min(frameHeight - 1, region.maxY + padding)
  const width = maxX - minX + 1
  const height = maxY - minY + 1
  const boxArea = Math.max(1, width * height)
  const widthRatio = width / frameWidth
  const candidatePixelRatio = ratio(region.pixelCount, boxArea)
  const technicalTextLikelihood = clamp(
    0.2
      + Math.min(0.3, region.componentCount / 30)
      + Math.min(0.25, widthRatio * 0.4)
      + Math.min(0.2, candidatePixelRatio * 1.5),
    0,
    1,
  )
  const normalizedYCenter = (minY + (height / 2)) / frameHeight
  return {
    regionId: `caption-region-${String(frameIndex + 1).padStart(3, '0')}-${String(regionIndex + 1).padStart(2, '0')}`,
    bounds: {
      x: ratio(minX, frameWidth),
      y: ratio(minY, frameHeight),
      width: ratio(width, frameWidth),
      height: ratio(height, frameHeight),
    },
    lineCount: region.lineCount,
    textLikeComponentCount: region.componentCount,
    candidatePixelRatio,
    technicalTextLikelihood: rounded(technicalTextLikelihood),
    lowerFrameRegion: normalizedYCenter >= 0.6,
  }
}

function mergeBounds(target: PixelComponent, source: PixelComponent): void {
  target.minX = Math.min(target.minX, source.minX)
  target.minY = Math.min(target.minY, source.minY)
  target.maxX = Math.max(target.maxX, source.maxX)
  target.maxY = Math.max(target.maxY, source.maxY)
}

function centerY(value: PixelComponent): number {
  return (value.minY + value.maxY) / 2
}

function horizontalOverlapRatio(left: PixelComponent, right: PixelComponent): number {
  const overlap = Math.max(0, Math.min(left.maxX, right.maxX) - Math.max(left.minX, right.minX) + 1)
  const smallerWidth = Math.max(1, Math.min(left.maxX - left.minX + 1, right.maxX - right.minX + 1))
  return overlap / smallerWidth
}

function regionScore(region: TextRegionCandidate, frameWidth: number, frameHeight: number): number {
  const widthRatio = (region.maxX - region.minX + 1) / frameWidth
  const centerRatio = centerY(region) / frameHeight
  return region.componentCount + (widthRatio * 10) + (centerRatio >= 0.6 ? 2 : 0)
}

function boundedNumber(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (value === undefined) return fallback
  if (!Number.isFinite(value)) return fallback
  return Math.min(maximum, Math.max(minimum, value))
}

function formatFilterNumber(value: number): string {
  return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

function ratio(numerator: number, denominator: number): number {
  return denominator <= 0 ? 0 : rounded(numerator / denominator)
}

function rounded(value: number): number {
  return Number(value.toFixed(6))
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
