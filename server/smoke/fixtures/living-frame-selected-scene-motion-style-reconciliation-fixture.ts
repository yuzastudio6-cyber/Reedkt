import {
  compileCanonicalLivingFrameMotionSpec,
} from '../../living-frame/canonical-living-frame-motion'
import {
  reconcileLivingFrameSelectedSceneMotionStyle,
} from '../../living-frame/living-frame-selected-scene-motion-style-reconciliation'
import {
  createLivingFrameControlledImageSelectedScenePrivateConditioningBindingSmokeFixture,
} from './living-frame-controlled-image-selected-scene-private-conditioning-binding-fixture'
import type {
  LivingFrameSelectedSceneConditioningStyleFixtureProfile,
} from './living-frame-selected-scene-visual-continuity-pack-binding-fixture'

let sequence = 0

export async function createLivingFrameSelectedSceneMotionStyleReconciliationSmokeFixture(
  profile:
    LivingFrameSelectedSceneConditioningStyleFixtureProfile,
) {
  sequence += 1
  const conditioning =
    await createLivingFrameControlledImageSelectedScenePrivateConditioningBindingSmokeFixture({
      conditioningStyleProfile: profile,
    })
  const requestInput =
    conditioning.input.selectedSceneRequestInput
  const canonicalMotionSpecs =
    conditioning.result.receipt.conditioningUnits.map(
      (unit) =>
        compileCanonicalLivingFrameMotionSpec({
          publication: requestInput.publication,
          timingBinding: requestInput.timingBinding,
          components: requestInput.components,
          sceneId: unit.sceneId,
          componentId: unit.componentId,
        }),
    )
  const input = {
    reconciliationId:
      `living-frame.motion-style-reconciliation.${String(sequence).padStart(3, '0')}`,
    privateConditioningBinding:
      conditioning.result.receipt,
    privateConditioningBindingInput:
      conditioning.input,
    canonicalMotionSpecs,
  } as const
  const reconciliation =
    await reconcileLivingFrameSelectedSceneMotionStyle(input)
  return {
    input,
    reconciliation,
  }
}
