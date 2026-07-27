import { createHash } from 'node:crypto'

import type {
  LivingFrameTemporalMaskAggregateMeasurement,
  LivingFrameTemporalMaskFindingCode,
  LivingFrameTemporalMaskFrameMeasurement,
  LivingFrameTemporalMaskMeasurementAuthorityBoundary,
  LivingFrameTemporalMaskMeasurementReport,
  LivingFrameTemporalMaskMeasurementReportDraft,
  LivingFrameTemporalMaskPairMeasurement,
} from '../../src/types/living-frame-temporal-mask-measurement'
import {
  LIVING_FRAME_TEMPORAL_MASK_EVIDENCE_CLASS,
  LIVING_FRAME_TEMPORAL_MASK_FINDING_CODES,
  LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_PROFILE,
  LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_VERSION,
} from '../../src/types/living-frame-temporal-mask-measurement'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const MAX_DIMENSION = 8192
const MAX_FRAME_COUNT = 240
const MAX_TOTAL_MASK_BYTES = 268_435_456
const BINARY_ALPHA_THRESHOLD = 128
const CHANGED_ALPHA_THRESHOLD = 24

const COVERAGE_JUMP_THRESHOLD = 0.12
const CENTROID_JITTER_THRESHOLD = 0.03
const LOW_IOU_THRESHOLD = 0.82
const BOUNDARY_CRAWL_THRESHOLD = 0.35
const ALPHA_FLICKER_THRESHOLD = 0.04

const AUTHORITY_BOUNDARY: LivingFrameTemporalMaskMeasurementAuthorityBoundary =
  Object.freeze({
    measurementOnly: true,
    planningAuthority: false,
    qaAuthority: false,
    fallbackAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    renderAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameServerMaskFrame {
  readonly frameIndex: number
  readonly artifactId: string
  readonly artifactDigestSha256: string
  readonly alphaBytes: Uint8Array
}

export interface LivingFrameServerTemporalMaskSequence {
  readonly sequenceId: string
  readonly width: number
  readonly height: number
  readonly frames: readonly LivingFrameServerMaskFrame[]
}

interface InternalFrameMeasurement {
  readonly publicMeasurement: LivingFrameTemporalMaskFrameMeasurement
  readonly weightedArea: number
  readonly binaryArea: number
  readonly binaryMask: Uint8Array
  readonly boundaryMask: Uint8Array
}

export function measureLivingFrameTemporalMaskSequence(
  input: LivingFrameServerTemporalMaskSequence,
): LivingFrameTemporalMaskMeasurementReport {
  assertInput(input)

  const frameMeasurements = input.frames.map((frame) =>
    measureFrame(input.width, input.height, frame))
  const pairs: LivingFrameTemporalMaskPairMeasurement[] = []
  for (let index = 1; index < input.frames.length; index += 1) {
    pairs.push(measurePair({
      width: input.width,
      height: input.height,
      fromFrame: input.frames[index - 1]!,
      toFrame: input.frames[index]!,
      fromMeasurement: frameMeasurements[index - 1]!,
      toMeasurement: frameMeasurements[index]!,
    }))
  }

  const frames = frameMeasurements.map(
    (measurement) => measurement.publicMeasurement,
  )
  const aggregate = aggregatePairs(pairs)
  const findingCodes = deriveFindingCodes(frames, pairs, aggregate)
  const frameArtifacts = input.frames.map((frame) => ({
    frameIndex: frame.frameIndex,
    artifactId: frame.artifactId,
    artifactDigestSha256: frame.artifactDigestSha256,
    measuredAlphaDigestSha256: sha256Bytes(frame.alphaBytes),
  }))
  const frameSetDigestSha256 = sha256(canonicalJsonStringify(frameArtifacts))

  const draft: LivingFrameTemporalMaskMeasurementReportDraft = {
    contractVersion: LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_VERSION,
    measurementProfile: LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_PROFILE,
    evidenceClass: LIVING_FRAME_TEMPORAL_MASK_EVIDENCE_CLASS,
    sequenceIdentity: {
      sequenceId: input.sequenceId,
      width: input.width,
      height: input.height,
      firstFrameIndex: input.frames[0]!.frameIndex,
      lastFrameIndex: input.frames[input.frames.length - 1]!.frameIndex,
      frameCount: input.frames.length,
      frameSetDigestSha256,
    },
    frameArtifacts,
    frames,
    pairs,
    aggregate,
    findingCodes,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsRawMaskBytes: false,
    containsPathOrUrl: false,
    containsCredentials: false,
  }
  return {
    ...draft,
    reportDigestSha256: sha256(canonicalJsonStringify(draft)),
  }
}

export function verifyLivingFrameTemporalMaskMeasurementReportDigest(
  value: unknown,
): value is LivingFrameTemporalMaskMeasurementReport {
  if (!isReportShape(value)) return false
  const { reportDigestSha256, ...draft } = value
  return SHA256.test(reportDigestSha256)
    && reportDigestSha256 === sha256(canonicalJsonStringify(draft))
}

function assertInput(input: LivingFrameServerTemporalMaskSequence): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, ['sequenceId', 'width', 'height', 'frames'])
  ) {
    throw new Error('Living Frame temporal mask sequence shape is invalid.')
  }
  if (!SAFE_ID.test(input.sequenceId)) {
    throw new Error('Living Frame temporal mask sequence identity is invalid.')
  }
  if (
    !Number.isInteger(input.width)
    || !Number.isInteger(input.height)
    || input.width < 1
    || input.height < 1
    || input.width > MAX_DIMENSION
    || input.height > MAX_DIMENSION
  ) {
    throw new Error('Living Frame temporal mask dimensions are invalid.')
  }
  if (
    !Array.isArray(input.frames)
    || input.frames.length < 1
    || input.frames.length > MAX_FRAME_COUNT
    || input.width * input.height * input.frames.length > MAX_TOTAL_MASK_BYTES
  ) {
    throw new Error('Living Frame temporal mask frame count is invalid.')
  }

  const artifactIds = new Set<string>()
  for (let index = 0; index < input.frames.length; index += 1) {
    const frame = input.frames[index]!
    if (
      !hasExactKeysUnknown(frame, [
        'frameIndex',
        'artifactId',
        'artifactDigestSha256',
        'alphaBytes',
      ])
    ) {
      throw new Error('Living Frame temporal mask frame shape is invalid.')
    }
    if (
      !Number.isInteger(frame.frameIndex)
      || frame.frameIndex < 0
      || frame.frameIndex > 10_000_000
      || (index > 0
        && frame.frameIndex !== input.frames[index - 1]!.frameIndex + 1)
    ) {
      throw new Error(
        'Living Frame temporal mask frames must be unique, ordered, and contiguous.',
      )
    }
    if (!SAFE_ID.test(frame.artifactId) || !SHA256.test(
      frame.artifactDigestSha256,
    )) {
      throw new Error('Living Frame temporal mask artifact identity is invalid.')
    }
    if (artifactIds.has(frame.artifactId)) {
      throw new Error(
        'Living Frame temporal mask artifact identities must be unique.',
      )
    }
    artifactIds.add(frame.artifactId)
    if (
      !(frame.alphaBytes instanceof Uint8Array)
      || frame.alphaBytes.length !== input.width * input.height
      || isSharedBuffer(frame.alphaBytes.buffer)
    ) {
      throw new Error('Living Frame temporal mask alpha bytes are invalid.')
    }
  }
}

function measureFrame(
  width: number,
  height: number,
  frame: LivingFrameServerMaskFrame,
): InternalFrameMeasurement {
  const pixelCount = width * height
  const binaryMask = new Uint8Array(pixelCount)
  let alphaSum = 0
  let binaryArea = 0
  let weightedX = 0
  let weightedY = 0
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x
      const alpha = frame.alphaBytes[pixelIndex]!
      alphaSum += alpha
      weightedX += x * alpha
      weightedY += y * alpha
      if (alpha >= BINARY_ALPHA_THRESHOLD) {
        binaryMask[pixelIndex] = 1
        binaryArea += 1
      }
      if (alpha > 0) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  const weightedArea = alphaSum / 255
  const emptyMask = alphaSum === 0
  const fullFrameMask = frame.alphaBytes.every((alpha) => alpha === 255)
  const touchesAllEdges = !emptyMask
    && minX === 0
    && minY === 0
    && maxX === width - 1
    && maxY === height - 1
  return {
    publicMeasurement: {
      frameIndex: frame.frameIndex,
      weightedCoverageRatio: rounded(weightedArea / pixelCount),
      binaryCoverageRatio: rounded(binaryArea / pixelCount),
      weightedCentroidX: emptyMask
        ? null
        : rounded((weightedX / alphaSum) / Math.max(1, width - 1)),
      weightedCentroidY: emptyMask
        ? null
        : rounded((weightedY / alphaSum) / Math.max(1, height - 1)),
      emptyMask,
      fullFrameMask,
      touchesAllEdges,
    },
    weightedArea,
    binaryArea,
    binaryMask,
    boundaryMask: deriveBoundaryMask(binaryMask, width, height),
  }
}

function deriveBoundaryMask(
  binaryMask: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const boundary = new Uint8Array(binaryMask.length)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      if (binaryMask[index] === 0) continue
      if (
        x === 0
        || y === 0
        || x === width - 1
        || y === height - 1
        || binaryMask[index - 1] === 0
        || binaryMask[index + 1] === 0
        || binaryMask[index - width] === 0
        || binaryMask[index + width] === 0
      ) boundary[index] = 1
    }
  }
  return boundary
}

function measurePair(input: {
  readonly width: number
  readonly height: number
  readonly fromFrame: LivingFrameServerMaskFrame
  readonly toFrame: LivingFrameServerMaskFrame
  readonly fromMeasurement: InternalFrameMeasurement
  readonly toMeasurement: InternalFrameMeasurement
}): LivingFrameTemporalMaskPairMeasurement {
  const pixelCount = input.width * input.height
  let intersection = 0
  let union = 0
  let changedPixelCount = 0
  let absoluteAlphaDelta = 0
  for (let index = 0; index < pixelCount; index += 1) {
    const fromBinary = input.fromMeasurement.binaryMask[index]!
    const toBinary = input.toMeasurement.binaryMask[index]!
    if (fromBinary === 1 && toBinary === 1) intersection += 1
    if (fromBinary === 1 || toBinary === 1) union += 1
    const delta = Math.abs(
      input.fromFrame.alphaBytes[index]! - input.toFrame.alphaBytes[index]!,
    )
    absoluteAlphaDelta += delta
    if (delta >= CHANGED_ALPHA_THRESHOLD) changedPixelCount += 1
  }

  const fromCentroid = input.fromMeasurement.publicMeasurement
  const toCentroid = input.toMeasurement.publicMeasurement
  const normalizedCentroidShift =
    fromCentroid.weightedCentroidX == null
    || fromCentroid.weightedCentroidY == null
    || toCentroid.weightedCentroidX == null
    || toCentroid.weightedCentroidY == null
      ? null
      : rounded(Math.sqrt(
          (fromCentroid.weightedCentroidX - toCentroid.weightedCentroidX) ** 2
          + (fromCentroid.weightedCentroidY - toCentroid.weightedCentroidY) ** 2,
        ) / Math.sqrt(2))

  return {
    fromFrameIndex: input.fromFrame.frameIndex,
    toFrameIndex: input.toFrame.frameIndex,
    weightedCoverageChangeRatio: rounded(
      Math.abs(
        input.fromMeasurement.weightedArea - input.toMeasurement.weightedArea,
      ) / Math.max(
        1,
        input.fromMeasurement.weightedArea,
        input.toMeasurement.weightedArea,
      ),
    ),
    normalizedCentroidShift,
    binaryIntersectionOverUnion: union === 0
      ? null
      : rounded(intersection / union),
    changedPixelRatio: rounded(changedPixelCount / pixelCount),
    meanAbsoluteAlphaDelta: rounded(
      absoluteAlphaDelta / (pixelCount * 255),
    ),
    boundaryDisagreementRatio: measureBoundaryDisagreement(
      input.fromMeasurement.boundaryMask,
      input.toMeasurement.boundaryMask,
      input.width,
      input.height,
    ),
  }
}

function measureBoundaryDisagreement(
  fromBoundary: Uint8Array,
  toBoundary: Uint8Array,
  width: number,
  height: number,
): number | null {
  let fromCount = 0
  let toCount = 0
  let unmatched = 0
  for (let index = 0; index < fromBoundary.length; index += 1) {
    if (fromBoundary[index] === 1) {
      fromCount += 1
      if (!hasBoundaryNeighbor(toBoundary, index, width, height)) unmatched += 1
    }
    if (toBoundary[index] === 1) {
      toCount += 1
      if (!hasBoundaryNeighbor(fromBoundary, index, width, height)) unmatched += 1
    }
  }
  return fromCount + toCount === 0
    ? null
    : rounded(unmatched / (fromCount + toCount))
}

function hasBoundaryNeighbor(
  boundary: Uint8Array,
  index: number,
  width: number,
  height: number,
): boolean {
  const x = index % width
  const y = Math.floor(index / width)
  for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
    for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
      const candidateX = x + xOffset
      const candidateY = y + yOffset
      if (
        candidateX >= 0
        && candidateX < width
        && candidateY >= 0
        && candidateY < height
        && boundary[candidateY * width + candidateX] === 1
      ) return true
    }
  }
  return false
}

function aggregatePairs(
  pairs: readonly LivingFrameTemporalMaskPairMeasurement[],
): LivingFrameTemporalMaskAggregateMeasurement {
  const coverage = pairs.map((pair) => pair.weightedCoverageChangeRatio)
  const centroids = pairs.flatMap((pair) =>
    pair.normalizedCentroidShift == null ? [] : [pair.normalizedCentroidShift])
  const overlaps = pairs.flatMap((pair) =>
    pair.binaryIntersectionOverUnion == null
      ? []
      : [pair.binaryIntersectionOverUnion])
  const changed = pairs.map((pair) => pair.changedPixelRatio)
  const alphaDelta = pairs.map((pair) => pair.meanAbsoluteAlphaDelta)
  const boundary = pairs.flatMap((pair) =>
    pair.boundaryDisagreementRatio == null
      ? []
      : [pair.boundaryDisagreementRatio])

  return {
    pairCount: pairs.length,
    maximumCoverageChangeRatio: maximum(coverage),
    p95CoverageChangeRatio: percentile(coverage, 0.95),
    maximumNormalizedCentroidShift: nullableMaximum(centroids),
    p95NormalizedCentroidShift: nullablePercentile(centroids, 0.95),
    minimumBinaryIntersectionOverUnion: nullableMinimum(overlaps),
    p05BinaryIntersectionOverUnion: nullablePercentile(overlaps, 0.05),
    maximumChangedPixelRatio: maximum(changed),
    p95MeanAbsoluteAlphaDelta: percentile(alphaDelta, 0.95),
    maximumBoundaryDisagreementRatio: nullableMaximum(boundary),
    p95BoundaryDisagreementRatio: nullablePercentile(boundary, 0.95),
  }
}

function deriveFindingCodes(
  frames: readonly LivingFrameTemporalMaskFrameMeasurement[],
  pairs: readonly LivingFrameTemporalMaskPairMeasurement[],
  aggregate: LivingFrameTemporalMaskAggregateMeasurement,
): LivingFrameTemporalMaskFindingCode[] {
  const findings = new Set<LivingFrameTemporalMaskFindingCode>()
  if (frames.length < 2) findings.add('frame_count_insufficient')
  if (frames.some((frame) => frame.emptyMask)) {
    findings.add('empty_mask_frame_present')
  }
  if (frames.some((frame) => frame.fullFrameMask)) {
    findings.add('full_frame_mask_present')
  }
  if (frames.some((frame) => frame.touchesAllEdges)) {
    findings.add('mask_touches_all_edges')
  }
  if (aggregate.maximumCoverageChangeRatio >= COVERAGE_JUMP_THRESHOLD) {
    findings.add('coverage_jump_high')
  }
  if (
    aggregate.maximumNormalizedCentroidShift != null
    && aggregate.maximumNormalizedCentroidShift >= CENTROID_JITTER_THRESHOLD
  ) findings.add('centroid_jitter_high')
  if (pairs.some((pair) =>
    pair.binaryIntersectionOverUnion != null
    && pair.binaryIntersectionOverUnion < LOW_IOU_THRESHOLD)) {
    findings.add('mask_overlap_low')
  }
  if (
    aggregate.maximumBoundaryDisagreementRatio != null
    && aggregate.maximumBoundaryDisagreementRatio >= BOUNDARY_CRAWL_THRESHOLD
  ) findings.add('boundary_crawl_high')
  if (aggregate.p95MeanAbsoluteAlphaDelta >= ALPHA_FLICKER_THRESHOLD) {
    findings.add('alpha_flicker_high')
  }
  return [...findings].sort()
}

function maximum(values: readonly number[]): number {
  return values.length === 0 ? 0 : rounded(Math.max(...values))
}

function nullableMaximum(values: readonly number[]): number | null {
  return values.length === 0 ? null : maximum(values)
}

function nullableMinimum(values: readonly number[]): number | null {
  return values.length === 0 ? null : rounded(Math.min(...values))
}

function nullablePercentile(
  values: readonly number[],
  percentileValue: number,
): number | null {
  return values.length === 0 ? null : percentile(values, percentileValue)
}

function percentile(
  values: readonly number[],
  percentileValue: number,
): number {
  if (values.length === 0) return 0
  const ordered = [...values].sort((left, right) => left - right)
  const index = Math.min(
    ordered.length - 1,
    Math.max(0, Math.ceil(percentileValue * ordered.length) - 1),
  )
  return rounded(ordered[index]!)
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function sha256Bytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
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
    const object = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(object)
        .sort()
        .map((key) => [key, canonicalize(object[key])]),
    )
  }
  throw new Error('Living Frame temporal mask report is not canonical JSON.')
}

function isReportShape(
  value: unknown,
): value is LivingFrameTemporalMaskMeasurementReport {
  if (!isRecord(value) || !hasExactKeys(value, [
    'contractVersion',
    'measurementProfile',
    'evidenceClass',
    'sequenceIdentity',
    'frameArtifacts',
    'frames',
    'pairs',
    'aggregate',
    'findingCodes',
    'authorityBoundary',
    'containsRawMaskBytes',
    'containsPathOrUrl',
    'containsCredentials',
    'reportDigestSha256',
  ])) return false
  if (
    value.contractVersion !== LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_VERSION
    || value.measurementProfile !== LIVING_FRAME_TEMPORAL_MASK_MEASUREMENT_PROFILE
    || value.evidenceClass !== LIVING_FRAME_TEMPORAL_MASK_EVIDENCE_CLASS
    || value.containsRawMaskBytes !== false
    || value.containsPathOrUrl !== false
    || value.containsCredentials !== false
    || typeof value.reportDigestSha256 !== 'string'
    || !SHA256.test(value.reportDigestSha256)
  ) return false
  if (!isSequenceIdentity(value.sequenceIdentity)) return false
  if (
    !Array.isArray(value.frameArtifacts)
    || value.frameArtifacts.length !== value.sequenceIdentity.frameCount
    || !value.frameArtifacts.every(isFrameArtifact)
  ) return false
  if (
    new Set(value.frameArtifacts.map((artifact) => artifact.artifactId)).size
      !== value.frameArtifacts.length
  ) return false
  if (
    sha256(canonicalJsonStringify(value.frameArtifacts))
    !== value.sequenceIdentity.frameSetDigestSha256
  ) return false
  if (
    !Array.isArray(value.frames)
    || value.frames.length !== value.sequenceIdentity.frameCount
    || !value.frames.every(isFrameMeasurement)
  ) return false
  for (let index = 0; index < value.sequenceIdentity.frameCount; index += 1) {
    const expectedFrameIndex = value.sequenceIdentity.firstFrameIndex + index
    if (
      value.frameArtifacts[index]!.frameIndex !== expectedFrameIndex
      || value.frames[index]!.frameIndex !== expectedFrameIndex
    ) return false
  }
  if (
    !Array.isArray(value.pairs)
    || value.pairs.length !== Math.max(0, value.frames.length - 1)
    || !value.pairs.every(isPairMeasurement)
  ) return false
  for (let index = 0; index < value.pairs.length; index += 1) {
    if (
      value.pairs[index]!.fromFrameIndex !== value.frames[index]!.frameIndex
      || value.pairs[index]!.toFrameIndex !== value.frames[index + 1]!.frameIndex
    ) return false
  }
  if (!isAggregateMeasurement(value.aggregate, value.pairs.length)) {
    return false
  }
  if (
    canonicalJsonStringify(value.aggregate)
      !== canonicalJsonStringify(aggregatePairs(value.pairs))
  ) return false
  if (
    !Array.isArray(value.findingCodes)
    || !value.findingCodes.every((code) =>
      includesString(LIVING_FRAME_TEMPORAL_MASK_FINDING_CODES, code))
  ) return false
  const findingCodes = value.findingCodes as LivingFrameTemporalMaskFindingCode[]
  if (
    new Set(findingCodes).size !== findingCodes.length
    || [...findingCodes].sort().some(
      (code, index) => code !== findingCodes[index],
    )
  ) return false
  if (!isAuthorityBoundary(value.authorityBoundary)) return false
  const expectedFindings = deriveFindingCodes(
    value.frames,
    value.pairs,
    value.aggregate,
  )
  return expectedFindings.length === findingCodes.length
    && expectedFindings.every(
      (finding, index) => finding === findingCodes[index],
    )
}

function isSequenceIdentity(value: unknown): value is {
  readonly sequenceId: string
  readonly width: number
  readonly height: number
  readonly firstFrameIndex: number
  readonly lastFrameIndex: number
  readonly frameCount: number
  readonly frameSetDigestSha256: string
} {
  return isRecord(value)
    && hasExactKeys(value, [
      'sequenceId',
      'width',
      'height',
      'firstFrameIndex',
      'lastFrameIndex',
      'frameCount',
      'frameSetDigestSha256',
    ])
    && typeof value.sequenceId === 'string'
    && SAFE_ID.test(value.sequenceId)
    && isIntegerBetween(value.width, 1, MAX_DIMENSION)
    && isIntegerBetween(value.height, 1, MAX_DIMENSION)
    && isIntegerBetween(value.firstFrameIndex, 0, 10_000_000)
    && isIntegerBetween(value.lastFrameIndex, 0, 10_000_000)
    && isIntegerBetween(value.frameCount, 1, MAX_FRAME_COUNT)
    && value.lastFrameIndex === value.firstFrameIndex + value.frameCount - 1
    && typeof value.frameSetDigestSha256 === 'string'
    && SHA256.test(value.frameSetDigestSha256)
}

function isFrameArtifact(
  value: unknown,
): value is LivingFrameTemporalMaskMeasurementReport['frameArtifacts'][number] {
  return isRecord(value)
    && hasExactKeys(value, [
      'frameIndex',
      'artifactId',
      'artifactDigestSha256',
      'measuredAlphaDigestSha256',
    ])
    && isIntegerBetween(value.frameIndex, 0, 10_000_000)
    && typeof value.artifactId === 'string'
    && SAFE_ID.test(value.artifactId)
    && typeof value.artifactDigestSha256 === 'string'
    && SHA256.test(value.artifactDigestSha256)
    && typeof value.measuredAlphaDigestSha256 === 'string'
    && SHA256.test(value.measuredAlphaDigestSha256)
}

function isFrameMeasurement(
  value: unknown,
): value is LivingFrameTemporalMaskFrameMeasurement {
  return isRecord(value)
    && hasExactKeys(value, [
      'frameIndex',
      'weightedCoverageRatio',
      'binaryCoverageRatio',
      'weightedCentroidX',
      'weightedCentroidY',
      'emptyMask',
      'fullFrameMask',
      'touchesAllEdges',
    ])
    && isIntegerBetween(value.frameIndex, 0, 10_000_000)
    && isRatio(value.weightedCoverageRatio)
    && isRatio(value.binaryCoverageRatio)
    && (value.weightedCentroidX === null || isRatio(value.weightedCentroidX))
    && (value.weightedCentroidY === null || isRatio(value.weightedCentroidY))
    && typeof value.emptyMask === 'boolean'
    && typeof value.fullFrameMask === 'boolean'
    && typeof value.touchesAllEdges === 'boolean'
}

function isPairMeasurement(
  value: unknown,
): value is LivingFrameTemporalMaskPairMeasurement {
  return isRecord(value)
    && hasExactKeys(value, [
      'fromFrameIndex',
      'toFrameIndex',
      'weightedCoverageChangeRatio',
      'normalizedCentroidShift',
      'binaryIntersectionOverUnion',
      'changedPixelRatio',
      'meanAbsoluteAlphaDelta',
      'boundaryDisagreementRatio',
    ])
    && isIntegerBetween(value.fromFrameIndex, 0, 10_000_000)
    && value.toFrameIndex === value.fromFrameIndex + 1
    && isRatio(value.weightedCoverageChangeRatio)
    && (value.normalizedCentroidShift === null
      || isRatio(value.normalizedCentroidShift))
    && (value.binaryIntersectionOverUnion === null
      || isRatio(value.binaryIntersectionOverUnion))
    && isRatio(value.changedPixelRatio)
    && isRatio(value.meanAbsoluteAlphaDelta)
    && (value.boundaryDisagreementRatio === null
      || isRatio(value.boundaryDisagreementRatio))
}

function isAggregateMeasurement(
  value: unknown,
  pairCount: number,
): value is LivingFrameTemporalMaskAggregateMeasurement {
  if (!isRecord(value) || !hasExactKeys(value, [
    'pairCount',
    'maximumCoverageChangeRatio',
    'p95CoverageChangeRatio',
    'maximumNormalizedCentroidShift',
    'p95NormalizedCentroidShift',
    'minimumBinaryIntersectionOverUnion',
    'p05BinaryIntersectionOverUnion',
    'maximumChangedPixelRatio',
    'p95MeanAbsoluteAlphaDelta',
    'maximumBoundaryDisagreementRatio',
    'p95BoundaryDisagreementRatio',
  ])) return false
  return value.pairCount === pairCount
    && isRatio(value.maximumCoverageChangeRatio)
    && isRatio(value.p95CoverageChangeRatio)
    && nullableRatio(value.maximumNormalizedCentroidShift)
    && nullableRatio(value.p95NormalizedCentroidShift)
    && nullableRatio(value.minimumBinaryIntersectionOverUnion)
    && nullableRatio(value.p05BinaryIntersectionOverUnion)
    && isRatio(value.maximumChangedPixelRatio)
    && isRatio(value.p95MeanAbsoluteAlphaDelta)
    && nullableRatio(value.maximumBoundaryDisagreementRatio)
    && nullableRatio(value.p95BoundaryDisagreementRatio)
}

function isAuthorityBoundary(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'measurementOnly',
    'planningAuthority',
    'qaAuthority',
    'fallbackAuthority',
    'approvalAuthority',
    'snapshotAuthority',
    'timingAuthority',
    'soundAuthority',
    'estimateAuthority',
    'costAuthority',
    'providerAuthority',
    'toolRouteAuthority',
    'workGraphAuthority',
    'queueAuthority',
    'renderAuthority',
    'runtimePromotionAuthority',
    'productionAuthority',
  ])) return false
  return value.measurementOnly === true
    && Object.entries(value)
      .filter(([key]) => key !== 'measurementOnly')
      .every(([, authority]) => authority === false)
}

function nullableRatio(value: unknown): boolean {
  return value === null || isRatio(value)
}

function isRatio(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
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

function includesString<const Values extends readonly string[]>(
  values: Values,
  value: unknown,
): value is Values[number] {
  return typeof value === 'string' && values.includes(value)
}

function isSharedBuffer(buffer: ArrayBufferLike): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
    && buffer instanceof SharedArrayBuffer
}
