import assert from 'node:assert/strict'

import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  buildLivingFrameBlenderFixedAdapterPrivateFixture,
} from '../living-frame/living-frame-blender-fixed-adapter-private-fixture'
import {
  compileLivingFrameRigActionPlan,
  verifyLivingFrameRigActionPlan,
} from '../living-frame/living-frame-rig-action'

const fixture = buildLivingFrameBlenderFixedAdapterPrivateFixture()
const plan = fixture.actionPlan
const riggingPlan = fixture.candidateRequest.riggingPlan

assert.equal(verifyLivingFrameRigActionPlan(plan, riggingPlan), true)
assert.deepEqual(
  compileLivingFrameRigActionPlan({
    riggingPlan,
    narrativeActionId: plan.narrativeActionId,
    narrativeActionSummary: plan.narrativeActionSummary,
    finalPosePolicy: plan.finalPosePolicy,
    tracks: plan.tracks,
  }),
  plan,
)
assert.equal(verifyLivingFrameRigActionPlan({
  ...plan,
  actionDigestSha256: sha256AuthorityValue('forged-action'),
}, riggingPlan), false)

const targetSubstitution = mutableAction(plan)
targetSubstitution.tracks[0]!.targetRefId = 'control.foreign'
assert.equal(
  verifyLivingFrameRigActionPlan(
    signAction(targetSubstitution),
    riggingPlan,
  ),
  false,
)

const timingSubstitution = mutableAction(plan)
timingSubstitution.sourceBindings.masterTimingPlanDigestSha256 =
  sha256AuthorityValue('foreign-master-timing')
assert.equal(
  verifyLivingFrameRigActionPlan(
    signAction(timingSubstitution),
    riggingPlan,
  ),
  false,
)

const restorationSubstitution = mutableAction(plan)
restorationSubstitution.tracks[0]!.keyframes.at(-1)!.pointValue = {
  x: 0.8,
  y: 0.2,
  z: 0,
}
assert.equal(
  verifyLivingFrameRigActionPlan(
    signAction(restorationSubstitution),
    riggingPlan,
  ),
  false,
)

const authorityPromotion = mutableAction(plan)
authorityPromotion.authorityBoundary.runtimeExecutionAuthority = true
authorityPromotion.authorityBoundary.finalCanvasAuthority = true
authorityPromotion.authorityBoundary.productionAuthority = true
assert.equal(
  verifyLivingFrameRigActionPlan(
    signAction(authorityPromotion),
    riggingPlan,
  ),
  false,
)

const extraExecutableField = mutableAction(plan) as Record<string, unknown>
extraExecutableField.pythonScript = 'import bpy'
assert.equal(
  verifyLivingFrameRigActionPlan(
    signUnknownAction(extraExecutableField),
    riggingPlan,
  ),
  false,
)

assert.throws(
  () => compileLivingFrameRigActionPlan({
    riggingPlan,
    narrativeActionId: 'action.no-primary',
    narrativeActionSummary:
      'Attempt an action without one approved primary motion track',
    finalPosePolicy: 'restore_initial',
    tracks: plan.tracks.map((track) => ({
      ...track,
      role: 'secondary',
    })),
  }),
  /one primary track/,
)

console.log(JSON.stringify({
  smoke: 'living_frame_rig_action',
  status: 'passed',
  contractVersion: plan.contractVersion,
  exactMasterTimingLineage: true,
  deterministicCompilation: true,
  onePrimaryActionAtATime: true,
  finalPosePolicy: plan.finalPosePolicy,
  adversarialAssertions: 7,
  runtimeExecutionAuthority: false,
  finalCanvasAuthority: false,
  productionAuthority: false,
}))

type Mutable<T> =
  T extends boolean ? boolean
    : T extends string ? string
      : T extends number ? number
        : T extends readonly (infer Item)[] ? Mutable<Item>[]
          : T extends object
            ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
            : T

function mutableAction(
  value: typeof plan,
): Mutable<Omit<typeof plan, 'actionDigestSha256'>> {
  const { actionDigestSha256: _ignored, ...draft } = structuredClone(value)
  void _ignored
  return draft as unknown as Mutable<Omit<
    typeof plan,
    'actionDigestSha256'
  >>
}

function signAction(
  draft: Mutable<Omit<typeof plan, 'actionDigestSha256'>>,
): unknown {
  return {
    ...draft,
    actionDigestSha256: sha256AuthorityValue(draft),
  }
}

function signUnknownAction(draft: Record<string, unknown>): unknown {
  return {
    ...draft,
    actionDigestSha256: sha256AuthorityValue(draft),
  }
}
