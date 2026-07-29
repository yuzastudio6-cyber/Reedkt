import assert from 'node:assert/strict'

import {
  CANONICAL_LIVING_FRAME_DEPTH_STYLES,
} from '../../src/types/living-frame-canonical-motion'
import {
  LivingFrameSelectedSceneMotionStyleReconciliationError,
  reconcileLivingFrameSelectedSceneMotionStyle,
  verifyLivingFrameSelectedSceneMotionStyleReconciliation,
} from '../living-frame/living-frame-selected-scene-motion-style-reconciliation'
import {
  createLivingFrameSelectedSceneMotionStyleReconciliationSmokeFixture,
} from './fixtures/living-frame-selected-scene-motion-style-reconciliation-fixture'

const deep =
  await createLivingFrameSelectedSceneMotionStyleReconciliationSmokeFixture(
    'cinematic_anime_deep_multiplane',
  )
assert.equal(
  await verifyLivingFrameSelectedSceneMotionStyleReconciliation(
    deep.reconciliation,
    deep.input,
  ),
  true,
)
assert.equal(deep.reconciliation.metrics.unitCount, 3)
assert.equal(deep.reconciliation.metrics.exactMatchCount, 3)
assert.equal(deep.reconciliation.metrics.styleMismatchCount, 0)
assert.equal(
  deep.reconciliation.metrics.dimensionalUnsupportedCount,
  0,
)
assert.equal(deep.reconciliation.metrics.blockedCount, 0)
assert.equal(
  deep.reconciliation.allUnitsExactSupportedStyleMatch,
  true,
)
assert.equal(
  deep.reconciliation.canonicalMotionStyleConflictObserved,
  false,
)
assert.equal(
  deep.reconciliation.dimensionalRuntimeGapObserved,
  false,
)
assert.equal(
  deep.reconciliation.canonicalMotionCanProceedByThisReconciliation,
  false,
)
for (const unit of deep.reconciliation.units) {
  assert.equal(
    unit.reconciliationStatus,
    'exact_supported_style_match',
  )
  assert.equal(unit.exactDepthStyleMatch, true)
  assert.equal(
    unit.downstreamCanonicalMotionAdmissionBlocked,
    false,
  )
  assert.equal(unit.canonicalMotionSpecMutated, false)
  assert.equal(unit.approvedStyleMutated, false)
}

const flat =
  await createLivingFrameSelectedSceneMotionStyleReconciliationSmokeFixture(
    'editorial_cutout_flat',
  )
assert.equal(flat.reconciliation.metrics.exactMatchCount, 0)
assert.equal(flat.reconciliation.metrics.styleMismatchCount, 3)
assert.equal(flat.reconciliation.metrics.blockedCount, 3)
assert.equal(
  flat.reconciliation.canonicalMotionStyleConflictObserved,
  true,
)
for (const unit of flat.reconciliation.units) {
  assert.equal(unit.approvedStyle.depthStyle, 'flat')
  assert.equal(
    unit.approvedStyle.motionPreparationClass,
    'flat_layer_animation',
  )
  assert.equal(
    unit.canonicalMotionObservation.depthStyle,
    'deep_multiplane',
  )
  assert.equal(
    unit.reconciliationStatus,
    'blocked_canonical_motion_style_mismatch',
  )
  assert.equal(
    unit.downstreamCanonicalMotionAdmissionBlocked,
    true,
  )
}

const shallow =
  await createLivingFrameSelectedSceneMotionStyleReconciliationSmokeFixture(
    'paper_collage_shallow_2_5d',
  )
assert.equal(shallow.reconciliation.metrics.exactMatchCount, 0)
assert.equal(shallow.reconciliation.metrics.styleMismatchCount, 3)
for (const unit of shallow.reconciliation.units) {
  assert.equal(
    unit.approvedStyle.depthStyle,
    'shallow_2_5d',
  )
  assert.equal(
    unit.canonicalMotionObservation.depthStyle,
    'deep_multiplane',
  )
  assert.equal(
    unit.reconciliationStatus,
    'blocked_canonical_motion_style_mismatch',
  )
}

const dimensional =
  await createLivingFrameSelectedSceneMotionStyleReconciliationSmokeFixture(
    'graphic_novel_dimensional',
  )
assert.equal(
  CANONICAL_LIVING_FRAME_DEPTH_STYLES.includes(
    'dimensional' as never,
  ),
  false,
)
assert.equal(
  dimensional.reconciliation.metrics
    .dimensionalUnsupportedCount,
  3,
)
assert.equal(
  dimensional.reconciliation.metrics.blockedCount,
  3,
)
assert.equal(
  dimensional.reconciliation
    .dimensionalRuntimeGapObserved,
  true,
)
assert.equal(
  dimensional.reconciliation
    .canonicalMotionStyleConflictObserved,
  true,
)
for (const unit of dimensional.reconciliation.units) {
  assert.equal(
    unit.approvedStyle.depthStyle,
    'dimensional',
  )
  assert.equal(
    unit.approvedDepthStyleSupportedByCurrentCanonicalMotion,
    false,
  )
  assert.equal(
    unit.reconciliationStatus,
    'blocked_dimensional_motion_runtime_unsupported',
  )
  assert.equal(
    unit.downstreamCanonicalMotionAdmissionBlocked,
    true,
  )
}

await assert.rejects(
  reconcileLivingFrameSelectedSceneMotionStyle({
    ...deep.input,
    canonicalMotionSpecs: [
      ...deep.input.canonicalMotionSpecs,
      deep.input.canonicalMotionSpecs[0]!,
    ],
  }),
  (error: unknown) =>
    hasIssue(error, 'duplicate_motion_spec'),
)

const tamperedMotion = structuredClone(
  deep.input.canonicalMotionSpecs[0]!,
) as {
  depthStyle: string
}
tamperedMotion.depthStyle = 'flat'
await assert.rejects(
  reconcileLivingFrameSelectedSceneMotionStyle({
    ...deep.input,
    canonicalMotionSpecs: [
      tamperedMotion as never,
      ...deep.input.canonicalMotionSpecs.slice(1),
    ],
  }),
  (error: unknown) =>
    hasIssue(error, 'canonical_motion_spec_invalid'),
)

await assert.rejects(
  reconcileLivingFrameSelectedSceneMotionStyle({
    ...deep.input,
    privateConditioningBinding:
      flat.input.privateConditioningBinding,
    privateConditioningBindingInput:
      flat.input.privateConditioningBindingInput,
  }),
  (error: unknown) =>
    hasIssue(
      error,
      'scene_component_or_output_mismatch',
    ),
)

const forgedAuthority = structuredClone(
  deep.reconciliation,
) as {
  authorityBoundary: {
    motionSpecMutationAuthority: boolean
  }
}
forgedAuthority.authorityBoundary
  .motionSpecMutationAuthority = true
assert.equal(
  await verifyLivingFrameSelectedSceneMotionStyleReconciliation(
    forgedAuthority,
    deep.input,
  ),
  false,
)

console.log(
  'Living Frame selected-scene motion style reconciliation smoke passed.',
)

function hasIssue(
  error: unknown,
  code: string,
): boolean {
  return error instanceof
      LivingFrameSelectedSceneMotionStyleReconciliationError
    && error.issues.some((issue) => issue.code === code)
}
