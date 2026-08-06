import assert from 'node:assert/strict'

import {
  planCanonicalPrivateSourceSliceLongFormChunks,
} from '../../src/lib/canonical-private-long-form-chunk-plan'
import {
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES,
} from '../../src/types/canonical-private-composition-capacity'

const sourceSequenceItemId = 'source-sequence-item-long-one'

const minimum = requirePlan(241, 31)
assert.equal(minimum.profileId, CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID)
assert.equal(minimum.chunkCount, 2)
assert.deepEqual(minimum.chunks.map((chunk) => chunk.durationFrames), [121, 120])
assert.deepEqual(minimum.chunks.map((chunk) => [
  chunk.sourceSegments[0]!.sourceStartFrame,
  chunk.sourceSegments[0]!.sourceEndFrameExclusive,
]), [[31, 152], [152, 272]])

const uneven = requirePlan(541, 73)
assert.equal(uneven.chunkCount, 3)
assert.deepEqual(uneven.chunks.map((chunk) => chunk.durationFrames), [181, 180, 180])
assert.deepEqual(uneven.chunks.map((chunk) => [
  chunk.globalStartFrame,
  chunk.globalEndFrameExclusive,
]), [[0, 181], [181, 361], [361, 541]])
assert.deepEqual(uneven.chunks.map((chunk) => [
  chunk.sourceSegments[0]!.sourceStartFrame,
  chunk.sourceSegments[0]!.sourceEndFrameExclusive,
]), [[73, 254], [254, 434], [434, 614]])
assert.deepEqual(uneven.chunks.map((chunk) =>
  chunk.sourceSegments[0]!.sourceSliceKey), [
  'source-slice-1-of-3',
  'source-slice-2-of-3',
  'source-slice-3-of-3',
])

const maximum = requirePlan(CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES, 0)
assert.equal(maximum.chunkCount, 16)
assert(maximum.chunks.every((chunk) => chunk.durationFrames === 240))
assert.equal(maximum.chunks.at(-1)!.globalEndFrameExclusive,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES)

for (const invalid of [
  planCanonicalPrivateSourceSliceLongFormChunks({
    totalFrames: 240,
    sourceSegments: [source(0, 240, 0)],
  }),
  planCanonicalPrivateSourceSliceLongFormChunks({
    totalFrames: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES + 1,
    sourceSegments: [source(
      0,
      CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES + 1,
      0,
    )],
  }),
  planCanonicalPrivateSourceSliceLongFormChunks({
    totalFrames: 541,
    sourceSegments: [source(73, 614, 1)],
  }),
  planCanonicalPrivateSourceSliceLongFormChunks({
    totalFrames: 541,
    sourceSegments: [source(73, 614, 0), source(0, 541, 0)],
  }),
]) assert.equal(invalid.ok, false)

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  profileId: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  provenPlanningCases: {
    minimumFrames: minimum.totalFrames,
    unevenFrames: uneven.totalFrames,
    maximumFrames: maximum.totalFrames,
    maximumChunkCount: maximum.chunkCount,
  },
  evidence: {
    exactSourceFrameConservation: true,
    exactGlobalTimelineConservation: true,
    balancedDeterministicSlices: true,
    approvedRangeReinterpreted: false,
    cloudExecutionAuthorized: false,
    professionalScaleProven: false,
  },
}, null, 2)}\n`)

function requirePlan(totalFrames: number, sourceStartFrame: number) {
  const result = planCanonicalPrivateSourceSliceLongFormChunks({
    totalFrames,
    sourceSegments: [source(
      sourceStartFrame,
      sourceStartFrame + totalFrames,
      0,
    )],
  })
  if (!result.ok) throw new Error(result.blocker)
  assert.equal(result.ok, true)
  return result.plan
}

function source(sourceStartFrame: number, sourceEndFrameExclusive: number, timelineStartFrame: number) {
  return {
    sourceSequenceItemId,
    sourceStartFrame,
    sourceEndFrameExclusive,
    timelineStartFrame,
    timelineEndFrameExclusive: timelineStartFrame +
      (sourceEndFrameExclusive - sourceStartFrame),
  }
}
