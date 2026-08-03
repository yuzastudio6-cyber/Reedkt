import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  VisualIntelligenceConfirmedOutputBinding,
} from '../../src/types/visual-intelligence'

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveSafeInteger = z.number().int().positive()
  .max(Number.MAX_SAFE_INTEGER)
const numericAspectRatio = z.custom<`${number}:${number}`>(
  (value) => typeof value === 'string'
    && /^[1-9][0-9]{0,4}:[1-9][0-9]{0,4}$/u.test(value),
)
const aspectRatioLabel = z.union([
  z.literal('original'),
  z.literal('custom'),
  numericAspectRatio,
])
const evidenceRef = z.object({
  id: identity,
  version: positiveSafeInteger,
  contentHash: prefixedSha256,
}).strict()

const confirmedOutputBindingCoreSchema = z.object({
  outputId: identity,
  aspectRatioLabel,
  aspectRatioNumerator: positiveSafeInteger.max(100_000),
  aspectRatioDenominator: positiveSafeInteger.max(100_000),
  width: positiveSafeInteger.min(11).max(16_384),
  height: positiveSafeInteger.min(11).max(16_384),
  fpsNumerator: positiveSafeInteger.max(240_000),
  fpsDenominator: positiveSafeInteger.max(1_001_000),
  confirmedOutputFrameRef: evidenceRef,
  confirmedOutputFrameBindingDigestSha256: prefixedSha256,
  confirmedByUser: z.literal(true),
  confirmationRecordId: identity,
}).strict()

export const canonicalConfirmedOutputBindingSchema =
  confirmedOutputBindingCoreSchema.superRefine((value, context) => {
    const labeledRatio = /:/.test(value.aspectRatioLabel)
      ? value.aspectRatioLabel.split(':').map(Number)
      : null
    if (
      value.width * value.aspectRatioDenominator !==
        value.height * value.aspectRatioNumerator
      || (labeledRatio !== null && (
        labeledRatio[0] !== value.aspectRatioNumerator
        || labeledRatio[1] !== value.aspectRatioDenominator
      ))
      || value.confirmedOutputFrameBindingDigestSha256 !==
        digestCanonicalConfirmedOutputBinding(value)
    ) context.addIssue({
      code: 'custom',
      message: 'Confirmed output-frame binding is inconsistent.',
    })
  })

export function createCanonicalConfirmedOutputBinding(
  input: Omit<VisualIntelligenceConfirmedOutputBinding,
    'confirmedOutputFrameBindingDigestSha256'>,
): VisualIntelligenceConfirmedOutputBinding {
  assertPlainAcyclicData(input)
  const provisional = {
    ...input,
    confirmedOutputFrameBindingDigestSha256: 'sha256:'.padEnd(71, '0'),
  }
  return canonicalConfirmedOutputBindingSchema.parse({
    ...provisional,
    confirmedOutputFrameBindingDigestSha256:
      digestCanonicalConfirmedOutputBinding(provisional),
  })
}

export function digestCanonicalConfirmedOutputBinding(
  binding: VisualIntelligenceConfirmedOutputBinding,
): string {
  return `sha256:${createHash('sha256').update(stableStringify({
    ...binding,
    confirmedOutputFrameBindingDigestSha256: null,
  })).digest('hex')}`
}

function assertPlainAcyclicData(value: unknown): void {
  const active = new WeakSet<object>()
  let visitedNodes = 0
  const visit = (item: unknown, depth: number): void => {
    if (
      item === null
      || typeof item === 'string'
      || typeof item === 'boolean'
      || typeof item === 'undefined'
    ) return
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) {
        throw new TypeError('Canonical data cannot contain non-finite numbers.')
      }
      return
    }
    if (typeof item !== 'object') {
      throw new TypeError('Canonical data contains an unsupported value.')
    }
    visitedNodes += 1
    if (depth > 64 || visitedNodes > 10_000) {
      throw new TypeError('Canonical data exceeds structural bounds.')
    }
    const object = item as object
    if (active.has(object)) throw new TypeError('Cyclic canonical data is invalid.')
    let prototype: object | null
    let keys: readonly PropertyKey[]
    try {
      prototype = Object.getPrototypeOf(object)
      keys = Reflect.ownKeys(object)
    } catch {
      throw new TypeError('Canonical data cannot be safely inspected.')
    }
    if (!Array.isArray(object)
      && prototype !== Object.prototype
      && prototype !== null) {
      throw new TypeError('Canonical data must use plain records and arrays.')
    }
    if (keys.some((key) => typeof key !== 'string')) {
      throw new TypeError('Canonical data cannot contain symbol keys.')
    }
    active.add(object)
    try {
      for (const key of keys as readonly string[]) {
        if (Array.isArray(object) && key === 'length') continue
        let descriptor: PropertyDescriptor | undefined
        try {
          descriptor = Object.getOwnPropertyDescriptor(object, key)
        } catch {
          throw new TypeError('Canonical data cannot be safely inspected.')
        }
        if (
          !descriptor
          || descriptor.get !== undefined
          || descriptor.set !== undefined
          || descriptor.enumerable !== true
          || !Object.hasOwn(descriptor, 'value')
        ) throw new TypeError(
          'Canonical data requires enumerable data properties only.',
        )
        visit(descriptor.value, depth + 1)
      }
    } finally {
      active.delete(object)
    }
  }
  visit(value, 0)
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value, new WeakSet<object>()))
}

function stableJsonValue(value: unknown, seen: WeakSet<object>): unknown {
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) throw new TypeError('Cyclic canonical JSON is invalid.')
  seen.add(value)
  try {
    if (Array.isArray(value)) {
      return value.map((item) => stableJsonValue(item, seen))
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([key, item]) => [key, stableJsonValue(item, seen)]),
    )
  } finally {
    seen.delete(value)
  }
}
