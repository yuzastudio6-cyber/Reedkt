import assert from 'node:assert/strict'

import {
  mapCanonicalSourceFrameBoundaryToMasterFrame,
  mapCanonicalSourceFrameRangeToMasterTiming,
  sourceFrameSeconds,
} from '../services/canonical-rational-source-frame-mapping'

const source = {
  fpsNumerator: 30_000,
  fpsDenominator: 1_001,
  frameCount: 10_852,
  timeBaseNumerator: 1,
  timeBaseDenominator: 30_000,
  constantFrameRate: true as const,
}
const master = { fpsNumerator: 30, fpsDenominator: 1 }

const complete = mapCanonicalSourceFrameRangeToMasterTiming({
  sourceStartFrame: 0,
  sourceEndFrameExclusive: source.frameCount,
  source,
  master,
})
assert.equal(complete.sourceDurationFrames, 10_852)
assert.equal(complete.masterDurationFrames, 10_863)
assert.equal(complete.sourceFramesRelabeledAsMasterFrames, false)
assert.equal(complete.arbitrarySpeedChangeApplied, false)
assert.ok(Math.abs(complete.sourceDurationSeconds - 362.095067) < 0.000001)

const left = mapCanonicalSourceFrameRangeToMasterTiming({
  sourceStartFrame: 0,
  sourceEndFrameExclusive: 5_220,
  source,
  master,
})
const right = mapCanonicalSourceFrameRangeToMasterTiming({
  sourceStartFrame: 5_220,
  sourceEndFrameExclusive: 10_852,
  source,
  master,
})
assert.equal(left.masterBoundaryEndFrameExclusive, 5_225)
assert.equal(right.masterBoundaryStartFrame, 5_225)
assert.equal(left.masterDurationFrames + right.masterDurationFrames, 10_863)
assert.equal(
  mapCanonicalSourceFrameBoundaryToMasterFrame({
    sourceFrame: 5_220,
    source,
    master,
  }),
  5_225,
)
assert.equal(sourceFrameSeconds(5_220, source), 174.174)

assert.throws(() => mapCanonicalSourceFrameRangeToMasterTiming({
  sourceStartFrame: 5_220,
  sourceEndFrameExclusive: 5_220,
  source,
  master,
}))
assert.throws(() => mapCanonicalSourceFrameBoundaryToMasterFrame({
  sourceFrame: 10_853,
  source,
  master,
}))
assert.throws(() => mapCanonicalSourceFrameRangeToMasterTiming({
  sourceStartFrame: 0,
  sourceEndFrameExclusive: source.frameCount,
  source: { ...source, constantFrameRate: false as true },
  master,
}))

console.log(JSON.stringify({
  smoke: 'canonical-rational-source-frame-mapping',
  sourceRate: '30000/1001',
  masterRate: '30/1',
  sourceFrames: complete.sourceDurationFrames,
  masterFrames: complete.masterDurationFrames,
  exactSharedBoundary: 5_225,
  arbitrarySpeedChangeApplied: false,
  sourceFramesRelabeledAsMasterFrames: false,
  adversarialChecks: 3,
}))
