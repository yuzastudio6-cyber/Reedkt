import assert from 'node:assert/strict'

import {
  consumeLivingFrameControlledImageSelectedScenePrivateConditioningLease,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-conditioning-binding'
import {
  createLivingFrameControlledImageSelectedScenePrivateConditioningBindingSmokeFixture,
} from './fixtures/living-frame-controlled-image-selected-scene-private-conditioning-binding-fixture'
import type {
  LivingFrameSelectedSceneConditioningStyleFixtureProfile,
} from './fixtures/living-frame-selected-scene-visual-continuity-pack-binding-fixture'

const cases = [
  {
    profile:
      'editorial_cutout_flat',
    assetTreatment: 'editorial_cutout',
    depthStyle: 'flat',
    motionPreparationClass: 'flat_layer_animation',
    supportsTwoPointFiveD: false,
    positiveRequired: [
      /premium editorial cutout/iu,
      /flat layer animation/iu,
      /do not stage parallax bands/iu,
    ],
    positiveForbidden: [
      /selective 2\.5D motion/iu,
      /deep multiplane parallax/iu,
      /dimensional composition/iu,
    ],
    negativeRequired: [
      /no fake 3D extrusion/iu,
      /no .*parallax staging/iu,
    ],
    metricKey: 'flatLayerAnimationUnitCount',
  },
  {
    profile:
      'paper_collage_shallow_2_5d',
    assetTreatment: 'paper_collage',
    depthStyle: 'shallow_2_5d',
    motionPreparationClass: 'shallow_2_5d_parallax',
    supportsTwoPointFiveD: true,
    positiveRequired: [
      /premium paper-collage illustration/iu,
      /restrained shallow-2\.5D layout/iu,
      /minimum readable near, subject, and background separation/iu,
    ],
    positiveForbidden: [
      /selective 2\.5D motion/iu,
      /deep multiplane parallax/iu,
      /dimensional composition/iu,
    ],
    negativeRequired: [
      /no exaggerated deep parallax/iu,
      /approved shallow graphic hierarchy/iu,
    ],
    metricKey: 'shallowTwoPointFiveDUnitCount',
  },
  {
    profile:
      'cinematic_anime_deep_multiplane',
    assetTreatment: 'cinematic_anime',
    depthStyle: 'deep_multiplane',
    motionPreparationClass: 'deep_multiplane_parallax',
    supportsTwoPointFiveD: true,
    positiveRequired: [
      /premium cinematic-anime silhouette/iu,
      /far-background, background, subject, in-front-of-subject, and foreground planes/iu,
      /deep multiplane parallax/iu,
    ],
    positiveForbidden: [
      /selective 2\.5D motion/iu,
      /intentionally flat/iu,
      /dimensional composition/iu,
    ],
    negativeRequired: [
      /no flattened plane stack/iu,
      /contradictory depth order/iu,
    ],
    metricKey: 'deepMultiplaneUnitCount',
  },
  {
    profile:
      'graphic_novel_dimensional',
    assetTreatment: 'graphic_novel',
    depthStyle: 'dimensional',
    motionPreparationClass:
      'dimensional_spatial_composition',
    supportsTwoPointFiveD: false,
    positiveRequired: [
      /premium graphic-novel language/iu,
      /coherent perspective, volume, overlap, occlusion/iu,
      /dimensional composition/iu,
    ],
    positiveForbidden: [
      /selective 2\.5D motion/iu,
      /shallow-2\.5D layout/iu,
      /deep multiplane parallax/iu,
    ],
    negativeRequired: [
      /no incoherent perspective/iu,
      /flattened pseudo-3D treatment/iu,
    ],
    metricKey: 'dimensionalSpatialUnitCount',
  },
] as const satisfies ReadonlyArray<{
  readonly profile:
    LivingFrameSelectedSceneConditioningStyleFixtureProfile
  readonly assetTreatment: string
  readonly depthStyle: string
  readonly motionPreparationClass: string
  readonly supportsTwoPointFiveD: boolean
  readonly positiveRequired: readonly RegExp[]
  readonly positiveForbidden: readonly RegExp[]
  readonly negativeRequired: readonly RegExp[]
  readonly metricKey:
    | 'flatLayerAnimationUnitCount'
    | 'shallowTwoPointFiveDUnitCount'
    | 'deepMultiplaneUnitCount'
    | 'dimensionalSpatialUnitCount'
}>

for (const testCase of cases) {
  const fixture =
    await createLivingFrameControlledImageSelectedScenePrivateConditioningBindingSmokeFixture({
      conditioningStyleProfile: testCase.profile,
    })
  const { receipt, privateConditioningBriefLeases } =
    fixture.result
  assert.equal(receipt.conditioningUnits.length, 3)
  assert.equal(
    receipt.metrics[testCase.metricKey],
    receipt.conditioningUnits.length,
  )
  const otherMetricKeys = [
    'flatLayerAnimationUnitCount',
    'shallowTwoPointFiveDUnitCount',
    'deepMultiplaneUnitCount',
    'dimensionalSpatialUnitCount',
  ] as const
  for (const key of otherMetricKeys) {
    if (key !== testCase.metricKey) {
      assert.equal(receipt.metrics[key], 0)
    }
  }
  assert.equal(
    receipt.metrics.twoPointFiveDDirectedUnitCount,
    testCase.supportsTwoPointFiveD
      ? receipt.conditioningUnits.length
      : 0,
  )
  for (const unit of receipt.conditioningUnits) {
    assert.equal(
      unit.styleDirection.assetTreatment,
      testCase.assetTreatment,
    )
    assert.equal(
      unit.styleDirection.depthStyle,
      testCase.depthStyle,
    )
    assert.equal(
      unit.styleDirection.motionPreparationClass,
      testCase.motionPreparationClass,
    )
    assert.equal(
      unit.styleDirection.depthStyleSupportsTwoPointFiveD,
      testCase.supportsTwoPointFiveD,
    )
  }
  const privateBrief =
    consumeLivingFrameControlledImageSelectedScenePrivateConditioningLease(
      privateConditioningBriefLeases[0]!,
    )
  for (const pattern of testCase.positiveRequired) {
    assert.match(
      privateBrief.positiveConditioningText,
      pattern,
      `${testCase.profile} must include ${String(pattern)}`,
    )
  }
  for (const pattern of testCase.positiveForbidden) {
    assert.doesNotMatch(
      privateBrief.positiveConditioningText,
      pattern,
      `${testCase.profile} must exclude ${String(pattern)}`,
    )
  }
  for (const pattern of testCase.negativeRequired) {
    assert.match(
      privateBrief.negativeConditioningText,
      pattern,
      `${testCase.profile} negative conditioning must include ${String(pattern)}`,
    )
  }
  assert.match(
    privateBrief.positiveConditioningText,
    /still illustration source/iu,
  )
  assert.match(
    privateBrief.positiveConditioningText,
    /downstream deterministic matting, rigging, camera, motion, sound, and final Remotion composition remain separate/iu,
  )
  assert.doesNotMatch(
    privateBrief.positiveConditioningText,
    /generate (?:an?|the) (?:animated|video) clip/iu,
  )
}

console.log(
  'Living Frame selected-scene adaptive style conditioning smoke passed.',
)
