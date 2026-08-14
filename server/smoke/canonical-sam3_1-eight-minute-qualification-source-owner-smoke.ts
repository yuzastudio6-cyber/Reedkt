import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  buildCanonicalSam31EightMinuteQualificationSourcePlan,
  buildCanonicalSam31EightMinuteQualificationSourcePreparation,
  createCanonicalSam31EightMinuteQualificationSourceRepository,
  parseCanonicalSam31EightMinuteQualificationSourcePlan,
  parseCanonicalSam31EightMinuteQualificationSourcePreparation,
  sealCanonicalSam31EightMinuteQualificationSourcePreparation,
} from '../services/canonical-sam3_1-eight-minute-qualification-source-owner'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'

const exactSourceObjectRef = ref(
  'sam31-private-real-source-object-generation-1779933335766660',
  'c13eda5816aba31ed60f5dce838d178ed8307f825972eec7aacf9fb29d8c47cb',
)
const plan = buildCanonicalSam31EightMinuteQualificationSourcePlan({
  qualificationSourceId: 'sam31-eight-minute-performance-source-v1',
  exactSourceObjectRef,
  exactSourceReadAuthorityRef: ref(
    'sam31-private-real-source-exact-reread-authority',
    digest('sam31-private-real-source-exact-reread-authority'),
  ),
  plannedAt: '2026-08-13T16:00:00.000Z',
})

assert.equal(plan.sourceDurationMilliseconds, 480_000)
assert.equal(plan.sourceFrameCount, 11_520)
assert.equal(plan.sourceWidth, 3_840)
assert.equal(plan.sourceHeight, 2_160)
assert.equal(plan.sourceObjectFpsNumerator, 77_200)
assert.equal(plan.sourceObjectFpsDenominator, 3_217)
assert.equal(plan.fpsNumerator, 24)
assert.equal(plan.fpsDenominator, 1)
assert.equal(plan.repeatedSequenceCount, 30)
assert.equal(plan.sequence.length, 30)
assert.equal(plan.sequence[0]?.canonicalStartFrameInclusive, 0)
assert.equal(plan.sequence[0]?.canonicalEndFrameInclusive, 383)
assert.equal(plan.sequence[29]?.canonicalStartFrameInclusive, 11_136)
assert.equal(plan.sequence[29]?.canonicalEndFrameInclusive, 11_519)
assert.equal(plan.exactChunkCount, 49)
assert.equal(plan.preparationRouteId, 'l4_standard_primary')
assert.equal(plan.preparationAccelerator, 'nvidia_l4')
assert.equal(plan.substantiveCpuMediaProcessingAllowed, false)
assert.equal(plan.sourceResolutionReductionAllowed, false)
assert.equal(plan.sourcePixelExactnessClaimAllowed, false)
assert.equal(plan.losslessEncodingClaimAllowed, false)
assert.equal(plan.fullSourceResolutionPreserved, true)
assert.equal(plan.sourceAudioRemovedForSamPreparation, true)
assert.equal(plan.exactSourceCoordinate.generation, '1779933335766660')
assert.equal(plan.privatePerformanceQualificationOnly, true)
assert.equal(plan.representativeContentDiversityClaimAllowed, false)
assert.equal(plan.temporalQualityQualificationClaimAllowed, false)
assert.equal(plan.customerFootageClaimAllowed, false)
assert.deepEqual(parseCanonicalSam31EightMinuteQualificationSourcePlan(plan),
  plan)

const planned = buildCanonicalSam31EightMinuteQualificationSourcePreparation({
  preparationId: 'sam31-eight-minute-source-preparation-v1',
  plan,
  disposition: 'planned',
  preparedChunks: [],
  preparedAt: '2026-08-13T16:01:00.000Z',
})
assert.equal(planned.disposition, 'planned')

const chunks = Array.from({ length: 49 }, (_, index) => {
  const start = index * 239
  const end = Math.min(11_519, start + 239)
  const sha = digest(`sam31-eight-minute-chunk-${index + 1}`)
  return {
    chunkOrdinal: index + 1,
    canonicalStartFrameInclusive: start,
    canonicalEndFrameInclusive: end,
    overlapWithPreviousFrames: index === 0 ? 0 as const : 1 as const,
    preparedChunkArtifactRef: ref(
      `sam31-eight-minute-chunk-${index + 1}`,
      sha,
    ),
    exactSourceRangeMappingRef: ref(
      `sam31-eight-minute-chunk-map-${index + 1}`,
      digest(`sam31-eight-minute-chunk-map-${index + 1}`),
    ),
    ffprobeEvidenceRef: ref(
      `sam31-eight-minute-chunk-ffprobe-${index + 1}`,
      digest(`sam31-eight-minute-chunk-ffprobe-${index + 1}`),
    ),
    gpuPreparationEvidenceRef: ref(
      `sam31-eight-minute-chunk-l4-gpu-${index + 1}`,
      digest(`sam31-eight-minute-chunk-l4-gpu-${index + 1}`),
    ),
    privateCoordinate: {
      bucketName: 'reeditpro-production-reeditpro-masks' as const,
      objectName:
        `private/canonical-professional-gpu/sam3_1/v1/qualification-source/chunk-${String(index + 1).padStart(3, '0')}.mp4`,
      generation: String(1_800_000_000_000_001 + index),
      etagSha256: digest(`sam31-eight-minute-chunk-etag-${index + 1}`),
    },
    byteLength: 1_000_000 + index,
    sha256: sha,
    decodedFrameCount: end - start + 1,
  }
})
const ready = buildCanonicalSam31EightMinuteQualificationSourcePreparation({
  preparationId: 'sam31-eight-minute-source-preparation-v1',
  plan,
  disposition: 'ready',
  preparedChunks: chunks,
  preparedAt: '2026-08-13T16:02:00.000Z',
})
assert.equal(ready.disposition, 'ready')
assert.equal(ready.sourcePixelExactnessClaimed, false)
assert.equal(ready.losslessEncodingClaimed, false)
assert.equal(ready.privateStorageCoordinatesExposedToCaller, false)
assert.equal(ready.preparedChunks[48]?.decodedFrameCount, 48)
assert.deepEqual(
  parseCanonicalSam31EightMinuteQualificationSourcePreparation(ready),
  ready,
)

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    const existing = objects.get(input.objectPath)
    if (existing) {
      assert.equal(digestBuffer(existing), input.contentSha256)
      return 'already_exists'
    }
    assert.equal(digestBuffer(input.body), input.contentSha256)
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(objectPath) {
    const value = objects.get(objectPath)
    return value ? Buffer.from(value) : null
  },
}
const repository = createCanonicalSam31EightMinuteQualificationSourceRepository({
  objectPort,
  prefix: 'private/weeditpro/sam3_1-eight-minute-source-test',
})
assert.equal(await repository.persistPlanCreateOnly({ plan }), 'created')
assert.equal(await repository.persistPlanCreateOnly({ plan }),
  'identical_replay')
assert.deepEqual(await repository.rereadPlan({
  qualificationSourceId: plan.qualificationSourceId,
}), plan)
assert.equal(await repository.persistPreparationCreateOnly({
  preparation: ready,
}), 'created')
assert.equal(await repository.persistPreparationCreateOnly({
  preparation: ready,
}), 'identical_replay')
assert.deepEqual(await repository.rereadPreparation({
  preparationId: ready.preparationId,
}), ready)
assert.equal(await repository.rereadPreparation({
  preparationId: 'sam31-eight-minute-preparation-not-found',
}), null)

assert.throws(() =>
  buildCanonicalSam31EightMinuteQualificationSourcePlan({
    qualificationSourceId: 'sam31-eight-minute-wrong-source',
    exactSourceObjectRef: ref(
      'sam31-private-wrong-source-object',
      digest('wrong-source'),
    ),
    exactSourceReadAuthorityRef: ref(
      'sam31-private-source-read',
      digest('sam31-private-source-read'),
    ),
    plannedAt: '2026-08-13T16:00:00.000Z',
  }))
assert.throws(() =>
  parseCanonicalSam31EightMinuteQualificationSourcePlan({
    ...plan,
    planHash: digest('tampered-plan'),
  }))
assert.throws(() =>
  buildCanonicalSam31EightMinuteQualificationSourcePreparation({
    preparationId: 'sam31-eight-minute-source-preparation-v1',
    plan,
    disposition: 'ready',
    preparedChunks: ready.preparedChunks.slice(0, -1),
    preparedAt: '2026-08-13T16:02:00.000Z',
  }))
const { preparationHash: _plannedHash, ...plannedPayload } = planned
void _plannedHash
assert.throws(() =>
  sealCanonicalSam31EightMinuteQualificationSourcePreparation({
    ...plannedPayload,
    temporalQualityQualificationClaimAllowed: true,
  }))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-eight-minute-qualification-source-owner',
  checks: 56,
  exactDurationMilliseconds: plan.sourceDurationMilliseconds,
  exactFrameCount: plan.sourceFrameCount,
  exactChunkCount: ready.exactChunkCount,
  sourceResolution: `${plan.sourceWidth}x${plan.sourceHeight}`,
  l4GpuPreparationRequired: true,
  repetitiveSourceUsedForTemporalQualityClaim: false,
  liveGpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function digestBuffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function ref(id: string, hash: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${hash}` as const,
  }
}
