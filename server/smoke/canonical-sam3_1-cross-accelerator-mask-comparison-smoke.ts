import { createHash } from 'node:crypto'

import {
  assertCanonicalSam31CrossAcceleratorMaskComparison,
  compareCanonicalSam31CrossAcceleratorMaskSets,
  createCanonicalSam31CrossAcceleratorMaskComparisonRepository,
} from '../services/canonical-sam3_1-cross-accelerator-mask-comparison-service'

const hash = (value: string) => createHash('sha256')
  .update(value, 'utf8').digest('hex')
const ref = (id: string) => ({
  id,
  version: 1 as const,
  contentHash: `sha256:${hash(id)}` as const,
})
const a100Masks = Array.from({ length: 400 }, (_, index) => ({
  frameIndex: Math.floor(index / 2),
  objectId: index % 2,
  width: 40,
  height: 25,
  sha256: hash(`a100-${index}`),
  pixels: Buffer.alloc(1_000, 255),
}))
const l4Masks = a100Masks.map((mask, index) => ({
  ...mask,
  sha256: hash(`l4-${index}`),
  pixels: Buffer.from(mask.pixels),
}))
l4Masks[0]!.pixels[0] = 0
const geometryProjection = {
  width: 40,
  height: 25,
  firstFrameIndex: 0,
  lastFrameIndex: 199,
  frames: Array.from({ length: 200 }, (_, frameIndex) => ({
    frameIndex,
    objects: [0, 1].map((objectId) => ({
      objectId,
      normalizedBoxXywh: [0.1, 0.2, 0.3, 0.4] as const,
    })),
  })),
  masks: a100Masks.map(({ frameIndex, objectId, width, height }) => ({
    frameIndex, objectId, width, height,
  })),
}
const comparison = compareCanonicalSam31CrossAcceleratorMaskSets({
  comparisonId: 'sam31-cross-accelerator-mask-comparison-smoke-v1',
  a100ServingQualificationRef: ref('a100-serving-qualification'),
  a100ImmutableImageDigest: `sha256:${hash('a100-image')}`,
  l4ImmutableImageDigest: `sha256:${hash('l4-image')}`,
  a100: {
    invocationId: 'a100-invocation',
    manifestRef: ref('a100-manifest'),
    semanticMaskSetDigestSha256: hash('a100-mask-set'),
    geometryProjection,
    masks: a100Masks,
  },
  l4: {
    invocationId: 'l4-invocation',
    manifestRef: ref('l4-manifest'),
    semanticMaskSetDigestSha256: hash('l4-mask-set'),
    geometryProjection,
    masks: l4Masks,
  },
})
if (comparison.exactBinaryMaskCount !== 399
  || comparison.nonByteIdenticalMaskCount !== 1
  || comparison.changedPixelCount !== 1
  || comparison.minimumIoUPpm !== 999_000
  || !comparison.crossAcceleratorProbeCompatibilityPassed
  || comparison.qualityEqualToOrBetterThanA100BaselineClaimed) {
  throw new Error('Cross-accelerator comparison did not preserve truth.')
}
const objects = new Map<string, Buffer>()
const repository = createCanonicalSam31CrossAcceleratorMaskComparisonRepository({
  objectPort: {
    async createOnly({ objectPath, body }) {
      if (objects.has(objectPath)) return 'already_exists' as const
      objects.set(objectPath, Buffer.from(body))
      return 'created' as const
    },
    async readExact(objectPath) {
      const body = objects.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  },
})
await repository.persistCreateOnly({ comparison })
const reread = await repository.reread({ comparisonRef: {
  id: comparison.comparisonId,
  version: 1,
  contentHash: `sha256:${comparison.comparisonHash}`,
} })
if (reread?.comparisonHash !== comparison.comparisonHash) {
  throw new Error('Cross-accelerator comparison reread failed.')
}
let tamperRejected = false
try {
  assertCanonicalSam31CrossAcceleratorMaskComparison({
    ...comparison,
    qualityEqualToOrBetterThanA100BaselineClaimed: true,
  })
} catch { tamperRejected = true }
if (!tamperRejected) throw new Error('Cross-accelerator claim tamper passed.')
let regressionRejected = false
try {
  const degraded = l4Masks.map((mask) => ({
    ...mask,
    pixels: Buffer.from(mask.pixels),
  }))
  degraded[0]!.pixels.fill(0, 0, 100)
  compareCanonicalSam31CrossAcceleratorMaskSets({
    comparisonId: 'sam31-cross-accelerator-mask-regression-smoke-v1',
    a100ServingQualificationRef: ref('a100-serving-qualification'),
    a100ImmutableImageDigest: `sha256:${hash('a100-image')}`,
    l4ImmutableImageDigest: `sha256:${hash('l4-image')}`,
    a100: {
      invocationId: 'a100-invocation',
      manifestRef: ref('a100-manifest'),
      semanticMaskSetDigestSha256: hash('a100-mask-set'),
      geometryProjection,
      masks: a100Masks,
    },
    l4: {
      invocationId: 'l4-invocation',
      manifestRef: ref('l4-manifest'),
      semanticMaskSetDigestSha256: hash('l4-mask-set'),
      geometryProjection,
      masks: degraded,
    },
  })
} catch { regressionRejected = true }
if (!regressionRejected) throw new Error('Mask regression passed comparison.')

process.stdout.write(`${JSON.stringify({
  ok: true,
  checks: 18,
  comparisonHash: comparison.comparisonHash,
  meanIoUPpm: comparison.meanIoUPpm,
  minimumIoUPpm: comparison.minimumIoUPpm,
  byteIdentityClaimed: comparison.semanticMaskSetByteIdentityClaimed,
  independentTemporalQualityRequired:
    comparison.independentTemporalQualityRequired,
})}\n`)
