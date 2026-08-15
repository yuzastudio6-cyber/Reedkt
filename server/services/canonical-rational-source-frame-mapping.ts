export const CANONICAL_RATIONAL_SOURCE_FRAME_MAPPING_VERSION =
  'canonical-rational-source-frame-mapping-v1' as const

export const CANONICAL_RATIONAL_SOURCE_FRAME_MAPPING_POLICY =
  'duration_preserving_boundary_round_half_up_v1' as const

export interface CanonicalRationalSourceFrameAuthority {
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly frameCount: number
  readonly timeBaseNumerator: number
  readonly timeBaseDenominator: number
  readonly constantFrameRate: true
}

export interface CanonicalMasterTimingRate {
  readonly fpsNumerator: number
  readonly fpsDenominator: number
}

export interface CanonicalMappedSourceFrameRange {
  readonly schemaVersion:
    typeof CANONICAL_RATIONAL_SOURCE_FRAME_MAPPING_VERSION
  readonly mappingPolicy:
    typeof CANONICAL_RATIONAL_SOURCE_FRAME_MAPPING_POLICY
  readonly sourceStartFrame: number
  readonly sourceEndFrameExclusive: number
  readonly sourceDurationFrames: number
  readonly sourceStartSeconds: number
  readonly sourceEndSeconds: number
  readonly sourceDurationSeconds: number
  readonly masterBoundaryStartFrame: number
  readonly masterBoundaryEndFrameExclusive: number
  readonly masterDurationFrames: number
  readonly exactRationalSourceRateUsed: true
  readonly arbitrarySpeedChangeApplied: false
  readonly sourceFramesRelabeledAsMasterFrames: false
}

/**
 * Maps an exact CFR source-frame boundary into the destination MasterTiming
 * frame domain. Rounding is applied to boundaries, never independently to a
 * duration, so adjacent source ranges share one deterministic destination
 * boundary and cannot create a gap or overlap.
 */
export function mapCanonicalSourceFrameBoundaryToMasterFrame(input: {
  readonly sourceFrame: number
  readonly source: CanonicalRationalSourceFrameAuthority
  readonly master: CanonicalMasterTimingRate
}): number {
  assertSourceAuthority(input.source)
  assertMasterRate(input.master)
  if (
    !Number.isSafeInteger(input.sourceFrame)
    || input.sourceFrame < 0
    || input.sourceFrame > input.source.frameCount
  ) {
    throw new Error(
      'Canonical source-frame mapping requires an exact in-range source boundary.',
    )
  }
  const numerator = BigInt(input.sourceFrame)
    * BigInt(input.source.fpsDenominator)
    * BigInt(input.master.fpsNumerator)
  const denominator = BigInt(input.source.fpsNumerator)
    * BigInt(input.master.fpsDenominator)
  const mapped = divideRoundHalfUp(numerator, denominator)
  if (mapped > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Canonical source-frame mapping exceeds safe integer bounds.')
  }
  return Number(mapped)
}

export function mapCanonicalSourceFrameRangeToMasterTiming(input: {
  readonly sourceStartFrame: number
  readonly sourceEndFrameExclusive: number
  readonly source: CanonicalRationalSourceFrameAuthority
  readonly master: CanonicalMasterTimingRate
}): CanonicalMappedSourceFrameRange {
  assertSourceAuthority(input.source)
  assertMasterRate(input.master)
  if (
    !Number.isSafeInteger(input.sourceStartFrame)
    || !Number.isSafeInteger(input.sourceEndFrameExclusive)
    || input.sourceStartFrame < 0
    || input.sourceEndFrameExclusive <= input.sourceStartFrame
    || input.sourceEndFrameExclusive > input.source.frameCount
  ) {
    throw new Error(
      'Canonical source-frame range mapping requires one positive exact source range.',
    )
  }
  const masterBoundaryStartFrame =
    mapCanonicalSourceFrameBoundaryToMasterFrame({
      sourceFrame: input.sourceStartFrame,
      source: input.source,
      master: input.master,
    })
  const masterBoundaryEndFrameExclusive =
    mapCanonicalSourceFrameBoundaryToMasterFrame({
      sourceFrame: input.sourceEndFrameExclusive,
      source: input.source,
      master: input.master,
    })
  if (masterBoundaryEndFrameExclusive <= masterBoundaryStartFrame) {
    throw new Error(
      'Canonical source-frame range collapsed in the MasterTiming frame domain.',
    )
  }
  const sourceStartSeconds = sourceFrameSeconds(
    input.sourceStartFrame,
    input.source,
  )
  const sourceEndSeconds = sourceFrameSeconds(
    input.sourceEndFrameExclusive,
    input.source,
  )
  return Object.freeze({
    schemaVersion: CANONICAL_RATIONAL_SOURCE_FRAME_MAPPING_VERSION,
    mappingPolicy: CANONICAL_RATIONAL_SOURCE_FRAME_MAPPING_POLICY,
    sourceStartFrame: input.sourceStartFrame,
    sourceEndFrameExclusive: input.sourceEndFrameExclusive,
    sourceDurationFrames:
      input.sourceEndFrameExclusive - input.sourceStartFrame,
    sourceStartSeconds,
    sourceEndSeconds,
    sourceDurationSeconds: sourceEndSeconds - sourceStartSeconds,
    masterBoundaryStartFrame,
    masterBoundaryEndFrameExclusive,
    masterDurationFrames:
      masterBoundaryEndFrameExclusive - masterBoundaryStartFrame,
    exactRationalSourceRateUsed: true,
    arbitrarySpeedChangeApplied: false,
    sourceFramesRelabeledAsMasterFrames: false,
  })
}

export function sourceFrameSeconds(
  sourceFrame: number,
  source: CanonicalRationalSourceFrameAuthority,
): number {
  assertSourceAuthority(source)
  if (
    !Number.isSafeInteger(sourceFrame)
    || sourceFrame < 0
    || sourceFrame > source.frameCount
  ) {
    throw new Error('Source seconds require one exact in-range source frame.')
  }
  return sourceFrame * source.fpsDenominator / source.fpsNumerator
}

export function assertSourceAuthority(
  value: CanonicalRationalSourceFrameAuthority,
): void {
  if (
    !Number.isSafeInteger(value.fpsNumerator)
    || value.fpsNumerator < 1
    || !Number.isSafeInteger(value.fpsDenominator)
    || value.fpsDenominator < 1
    || !Number.isSafeInteger(value.frameCount)
    || value.frameCount < 1
    || !Number.isSafeInteger(value.timeBaseNumerator)
    || value.timeBaseNumerator < 1
    || !Number.isSafeInteger(value.timeBaseDenominator)
    || value.timeBaseDenominator < 1
    || value.constantFrameRate !== true
  ) {
    throw new Error(
      'Canonical source timing requires exact positive rational CFR and time-base authority.',
    )
  }
}

function assertMasterRate(value: CanonicalMasterTimingRate): void {
  if (
    !Number.isSafeInteger(value.fpsNumerator)
    || value.fpsNumerator < 1
    || !Number.isSafeInteger(value.fpsDenominator)
    || value.fpsDenominator < 1
  ) {
    throw new Error('MasterTiming mapping requires one exact rational frame rate.')
  }
}

function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (numerator < 0n || denominator <= 0n) {
    throw new Error('Canonical frame mapping supports positive timeline values only.')
  }
  return (numerator * 2n + denominator) / (denominator * 2n)
}
