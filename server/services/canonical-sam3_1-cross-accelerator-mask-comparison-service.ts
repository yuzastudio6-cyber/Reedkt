import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import type {
  CanonicalSam31DecodedSemanticMaskSet,
} from '../workers/masks/canonical-sam3_1-gcs-serving-semantic-manifest-reader'

export const CANONICAL_SAM3_1_CROSS_ACCELERATOR_MASK_COMPARISON_VERSION =
  'canonical-sam3_1-cross-accelerator-mask-comparison-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/l4-runtime-qualification/v3/cross-accelerator-comparisons'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const nonnegativeInteger = z.number().int().nonnegative().safe()
const positiveInteger = z.number().int().positive().safe()
const ppm = z.number().int().min(0).max(1_000_000)
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const comparisonWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_CROSS_ACCELERATOR_MASK_COMPARISON_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_cross_accelerator_mask_comparison_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_exact_mask_pixel_reread_and_comparison',
  ),
  status: z.literal(
    'compatible_for_l4_repeatability_and_independent_temporal_quality',
  ),
  comparisonId: safeId,
  a100ServingQualificationRef: refSchema,
  a100SemanticManifestRef: refSchema,
  l4SemanticManifestRef: refSchema,
  a100ImmutableImageDigest: prefixedSha256,
  l4ImmutableImageDigest: prefixedSha256,
  a100SemanticMaskSetDigestSha256: sha256,
  l4SemanticMaskSetDigestSha256: sha256,
  evaluatedMaskCount: z.literal(400),
  evaluatedPixelCount: positiveInteger,
  exactBinaryMaskCount: nonnegativeInteger,
  nonByteIdenticalMaskCount: nonnegativeInteger,
  changedPixelCount: nonnegativeInteger,
  maximumChangedPixelsInOneMask: nonnegativeInteger,
  meanIoUPpm: ppm,
  minimumIoUPpm: ppm,
  changedPixelFractionPpm: ppm,
  maximumPerMaskFramePixelDifferencePpm: ppm,
  minimumAcceptedMeanIoUPpm: z.literal(999_000),
  minimumAcceptedMinimumIoUPpm: z.literal(980_000),
  maximumAcceptedChangedPixelFractionPpm: z.literal(100),
  maximumAcceptedPerMaskFramePixelDifferencePpm: z.literal(1_000),
  exactFrameObjectBoxAndMaskGeometryMatch: z.literal(true),
  everyMaskPairByteRereadDecodedAndCompared: z.literal(true),
  crossAcceleratorProbeCompatibilityPassed: z.literal(true),
  semanticMaskSetByteIdentityClaimed: z.literal(false),
  qualityEqualToOrBetterThanA100BaselineClaimed: z.literal(false),
  independentTemporalQualityRequired: z.literal(true),
  callerMetricsOrQualityClaimsAccepted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const compatible = value.exactBinaryMaskCount
      + value.nonByteIdenticalMaskCount === value.evaluatedMaskCount
    && value.a100SemanticMaskSetDigestSha256 !==
      value.l4SemanticMaskSetDigestSha256
    && value.meanIoUPpm >= value.minimumAcceptedMeanIoUPpm
    && value.minimumIoUPpm >= value.minimumAcceptedMinimumIoUPpm
    && value.changedPixelFractionPpm <=
      value.maximumAcceptedChangedPixelFractionPpm
    && value.maximumPerMaskFramePixelDifferencePpm <=
      value.maximumAcceptedPerMaskFramePixelDifferencePpm
  if (!compatible) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 cross-accelerator compatibility thresholds failed.',
  })
})

export const canonicalSam31CrossAcceleratorMaskComparisonSchema =
  comparisonWithoutHashSchema.extend({ comparisonHash: sha256 }).strict()
export type CanonicalSam31CrossAcceleratorMaskComparison = z.infer<
  typeof canonicalSam31CrossAcceleratorMaskComparisonSchema
>

export function compareCanonicalSam31CrossAcceleratorMaskSets(input: {
  readonly comparisonId: string
  readonly a100ServingQualificationRef: z.infer<typeof refSchema>
  readonly a100ImmutableImageDigest: `sha256:${string}`
  readonly l4ImmutableImageDigest: `sha256:${string}`
  readonly a100: CanonicalSam31DecodedSemanticMaskSet
  readonly l4: CanonicalSam31DecodedSemanticMaskSet
}): CanonicalSam31CrossAcceleratorMaskComparison {
  const comparisonId = safeId.parse(input.comparisonId)
  if (stableAuthorityStringify(input.a100.geometryProjection) !==
    stableAuthorityStringify(input.l4.geometryProjection)
    || input.a100.masks.length !== 400 || input.l4.masks.length !== 400) {
    throw new Error('SAM 3.1 cross-accelerator mask geometry changed.')
  }
  let evaluatedPixelCount = 0
  let exactBinaryMaskCount = 0
  let changedPixelCount = 0
  let maximumChangedPixelsInOneMask = 0
  let minimumIoUPpm = 1_000_000
  let sumIoUPpm = 0
  let maximumPerMaskFramePixelDifferencePpm = 0
  for (let index = 0; index < input.a100.masks.length; index += 1) {
    const a100 = input.a100.masks[index]!
    const l4 = input.l4.masks[index]!
    if (a100.frameIndex !== l4.frameIndex || a100.objectId !== l4.objectId
      || a100.width !== l4.width || a100.height !== l4.height
      || a100.pixels.byteLength !== l4.pixels.byteLength) {
      throw new Error('SAM 3.1 cross-accelerator mask identity changed.')
    }
    let intersection = 0
    let union = 0
    let changed = 0
    for (let pixel = 0; pixel < a100.pixels.byteLength; pixel += 1) {
      const a = a100.pixels[pixel] !== 0
      const b = l4.pixels[pixel] !== 0
      if (a && b) intersection += 1
      if (a || b) union += 1
      if (a !== b) changed += 1
    }
    const maskPixels = a100.pixels.byteLength
    const iouPpm = union === 0
      ? 1_000_000 : Math.floor(intersection * 1_000_000 / union)
    const frameDifferencePpm = Math.floor(
      changed * 1_000_000 / maskPixels,
    )
    if (changed === 0) exactBinaryMaskCount += 1
    evaluatedPixelCount += maskPixels
    changedPixelCount += changed
    maximumChangedPixelsInOneMask = Math.max(
      maximumChangedPixelsInOneMask,
      changed,
    )
    minimumIoUPpm = Math.min(minimumIoUPpm, iouPpm)
    sumIoUPpm += iouPpm
    maximumPerMaskFramePixelDifferencePpm = Math.max(
      maximumPerMaskFramePixelDifferencePpm,
      frameDifferencePpm,
    )
  }
  const payload = comparisonWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_CROSS_ACCELERATOR_MASK_COMPARISON_VERSION,
    source:
      'canonical_server_sam3_1_cross_accelerator_mask_comparison_owner',
    evidenceClass: 'canonical_private_exact_mask_pixel_reread_and_comparison',
    status:
      'compatible_for_l4_repeatability_and_independent_temporal_quality',
    comparisonId,
    a100ServingQualificationRef: input.a100ServingQualificationRef,
    a100SemanticManifestRef: input.a100.manifestRef,
    l4SemanticManifestRef: input.l4.manifestRef,
    a100ImmutableImageDigest: input.a100ImmutableImageDigest,
    l4ImmutableImageDigest: input.l4ImmutableImageDigest,
    a100SemanticMaskSetDigestSha256:
      input.a100.semanticMaskSetDigestSha256,
    l4SemanticMaskSetDigestSha256: input.l4.semanticMaskSetDigestSha256,
    evaluatedMaskCount: 400,
    evaluatedPixelCount,
    exactBinaryMaskCount,
    nonByteIdenticalMaskCount: 400 - exactBinaryMaskCount,
    changedPixelCount,
    maximumChangedPixelsInOneMask,
    meanIoUPpm: Math.floor(sumIoUPpm / 400),
    minimumIoUPpm,
    changedPixelFractionPpm: Math.floor(
      changedPixelCount * 1_000_000 / evaluatedPixelCount,
    ),
    maximumPerMaskFramePixelDifferencePpm,
    minimumAcceptedMeanIoUPpm: 999_000,
    minimumAcceptedMinimumIoUPpm: 980_000,
    maximumAcceptedChangedPixelFractionPpm: 100,
    maximumAcceptedPerMaskFramePixelDifferencePpm: 1_000,
    exactFrameObjectBoxAndMaskGeometryMatch: true,
    everyMaskPairByteRereadDecodedAndCompared: true,
    crossAcceleratorProbeCompatibilityPassed: true,
    semanticMaskSetByteIdentityClaimed: false,
    qualityEqualToOrBetterThanA100BaselineClaimed: false,
    independentTemporalQualityRequired: true,
    callerMetricsOrQualityClaimsAccepted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
  return assertCanonicalSam31CrossAcceleratorMaskComparison({
    ...payload,
    comparisonHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31CrossAcceleratorMaskComparison(
  value: unknown,
): CanonicalSam31CrossAcceleratorMaskComparison {
  assertPlainSerializedData(value, 'sam31_cross_accelerator_mask_comparison')
  const comparison = canonicalSam31CrossAcceleratorMaskComparisonSchema.parse(
    value,
  )
  const { comparisonHash, ...payload } = comparison
  if (comparisonHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 cross-accelerator comparison hash changed.')
  }
  return comparison
}

export function createCanonicalSam31CrossAcceleratorMaskComparisonRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
) {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    async persistCreateOnly({ comparison }: {
      comparison: CanonicalSam31CrossAcceleratorMaskComparison
    }) {
      const accepted = assertCanonicalSam31CrossAcceleratorMaskComparison(
        comparison,
      )
      const body = Buffer.from(stableAuthorityStringify(accepted), 'utf8')
      await input.objectPort.createOnly({
        objectPath: `${prefix}/${accepted.comparisonHash}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await this.reread({ comparisonRef: {
        id: accepted.comparisonId,
        version: 1,
        contentHash: `sha256:${accepted.comparisonHash}`,
      } })
      if (!reread || reread.comparisonHash !== accepted.comparisonHash) {
        throw new Error('SAM 3.1 comparison exact reread changed.')
      }
      return reread
    },
    async reread({ comparisonRef: untrustedRef }: {
      comparisonRef: z.infer<typeof refSchema>
    }) {
      const comparisonRef = refSchema.parse(untrustedRef)
      const hash = comparisonRef.contentHash.slice(7)
      const body = await input.objectPort.readExact(
        `${prefix}/${hash}.json`,
      )
      if (!body) return null
      const comparison = assertCanonicalSam31CrossAcceleratorMaskComparison(
        JSON.parse(body.toString('utf8')) as unknown,
      )
      if (comparison.comparisonId !== comparisonRef.id
        || comparison.comparisonHash !== hash
        || stableAuthorityStringify(comparison) !== body.toString('utf8')) {
        throw new Error('SAM 3.1 comparison repository binding changed.')
      }
      return structuredClone(comparison)
    },
  })
}
