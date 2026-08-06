import { z } from 'zod'

export interface TimelineRate {
  numerator: number
  denominator: number
}

export type TimelineRoundingMode = 'floor' | 'ceil' | 'nearest_half_up'

export const timelineRateSchema = z.object({
  numerator: z.number().int().positive().max(1_000_000),
  denominator: z.number().int().positive().max(1_000_000),
}).strict().superRefine((rate, context) => {
  if (greatestCommonDivisor(rate.numerator, rate.denominator) !== 1) {
    context.addIssue({ code: 'custom', message: 'Timeline rate must be reduced to canonical terms.' })
  }
})

export interface RationalValue {
  numerator: bigint
  denominator: bigint
}

export function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) [a, b] = [b, a % b]
  return a || 1
}

export function normalizeTimelineRate(input: TimelineRate): TimelineRate {
  const numerator = Math.trunc(input.numerator)
  const denominator = Math.trunc(input.denominator)
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) ||
    numerator <= 0 || denominator <= 0) {
    throw new Error('Timeline rate requires positive safe integer numerator and denominator.')
  }
  const divisor = greatestCommonDivisor(numerator, denominator)
  return Object.freeze({ numerator: numerator / divisor, denominator: denominator / divisor })
}

export function assertCanonicalTimelineRate(input: TimelineRate): TimelineRate {
  return timelineRateSchema.parse(input)
}

export function timelineRatesEqual(left: TimelineRate, right: TimelineRate): boolean {
  return BigInt(left.numerator) * BigInt(right.denominator) ===
    BigInt(right.numerator) * BigInt(left.denominator)
}

export function timelineRateDisplayFps(rateInput: TimelineRate): number {
  const rate = assertCanonicalTimelineRate(rateInput)
  return rate.numerator / rate.denominator
}

export function framesToRationalSeconds(frames: number, rateInput: TimelineRate): RationalValue {
  if (!Number.isSafeInteger(frames) || frames < 0) throw new Error('Frame count must be a non-negative safe integer.')
  const rate = assertCanonicalTimelineRate(rateInput)
  return reduceRational(BigInt(frames) * BigInt(rate.denominator), BigInt(rate.numerator))
}

export function framesToSeconds(frames: number, rate: TimelineRate): number {
  const value = framesToRationalSeconds(frames, rate)
  return Number(value.numerator) / Number(value.denominator)
}

export function rationalSecondsToFrames(input: {
  secondsNumerator: number | bigint
  secondsDenominator: number | bigint
  rate: TimelineRate
  rounding: TimelineRoundingMode
}): number {
  const secondsNumerator = BigInt(input.secondsNumerator)
  const secondsDenominator = BigInt(input.secondsDenominator)
  if (secondsNumerator < 0n || secondsDenominator <= 0n) throw new Error('Seconds must be a non-negative rational value.')
  const rate = assertCanonicalTimelineRate(input.rate)
  return safeBigIntNumber(roundRational(
    secondsNumerator * BigInt(rate.numerator),
    secondsDenominator * BigInt(rate.denominator),
    input.rounding,
  ))
}

export function decimalSecondsToFrames(input: {
  seconds: number
  rate: TimelineRate
  rounding: TimelineRoundingMode
}): number {
  if (!Number.isFinite(input.seconds) || input.seconds < 0) throw new Error('Seconds must be finite and non-negative.')
  const scale = 1_000_000_000
  return rationalSecondsToFrames({
    secondsNumerator: Math.round(input.seconds * scale),
    secondsDenominator: scale,
    rate: input.rate,
    rounding: input.rounding,
  })
}

export function framesToSamples(input: {
  frames: number
  rate: TimelineRate
  sampleRate: number
  rounding: TimelineRoundingMode
}): number {
  assertNonNegativeSafeInteger(input.frames, 'Frame count')
  assertPositiveSafeInteger(input.sampleRate, 'Sample rate')
  const rate = assertCanonicalTimelineRate(input.rate)
  return safeBigIntNumber(roundRational(
    BigInt(input.frames) * BigInt(rate.denominator) * BigInt(input.sampleRate),
    BigInt(rate.numerator), input.rounding,
  ))
}

export function samplesToFrames(input: {
  samples: number
  rate: TimelineRate
  sampleRate: number
  rounding: TimelineRoundingMode
}): number {
  assertNonNegativeSafeInteger(input.samples, 'Sample count')
  assertPositiveSafeInteger(input.sampleRate, 'Sample rate')
  const rate = assertCanonicalTimelineRate(input.rate)
  return safeBigIntNumber(roundRational(
    BigInt(input.samples) * BigInt(rate.numerator),
    BigInt(input.sampleRate) * BigInt(rate.denominator), input.rounding,
  ))
}

function roundRational(numerator: bigint, denominator: bigint, mode: TimelineRoundingMode): bigint {
  if (denominator <= 0n) throw new Error('Rational denominator must be positive.')
  const quotient = numerator / denominator
  const remainder = numerator % denominator
  if (mode === 'floor' || remainder === 0n) return quotient
  if (mode === 'ceil') return quotient + 1n
  return remainder * 2n >= denominator ? quotient + 1n : quotient
}

function reduceRational(numerator: bigint, denominator: bigint): RationalValue {
  let a = numerator < 0n ? -numerator : numerator
  let b = denominator
  while (b !== 0n) [a, b] = [b, a % b]
  const divisor = a || 1n
  return { numerator: numerator / divisor, denominator: denominator / divisor }
}

function safeBigIntNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Exact timeline conversion exceeds JavaScript safe integer range.')
  return Number(value)
}

function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative safe integer.`)
}

function assertPositiveSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive safe integer.`)
}
