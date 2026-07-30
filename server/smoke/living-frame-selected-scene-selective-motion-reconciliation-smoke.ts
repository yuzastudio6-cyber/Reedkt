import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  createLivingFrameContractFixtures,
} from '../../src/lib/living-frame/living-frame-fixtures'
import type {
  CanonicalLivingFrameMotionSpec,
} from '../../src/types/living-frame-canonical-motion'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileCanonicalLivingFrameMotionSpec,
} from '../living-frame/canonical-living-frame-motion'
import {
  LivingFrameSelectedSceneSelectiveMotionReconciliationError,
  reconcileLivingFrameSelectedSceneSelectiveMotion,
  verifyLivingFrameSelectedSceneSelectiveMotionReconciliation,
  type ReconcileLivingFrameSelectedSceneSelectiveMotionInput,
} from '../living-frame/living-frame-selected-scene-selective-motion-reconciliation'

const fixtures = await createLivingFrameContractFixtures()
const selectedComponent = fixtures.helicopterSelectiveMotion
const scene = selectedComponent.scenePlans[0]!
const masterTimingPlan = {
  id: 'master-timing.selective-motion',
}
const outputFrame = {
  width: 1080,
  height: 1920,
  fps: 30,
}
const currentMasterTimingDigestSha256 =
  sha256AuthorityValue(masterTimingPlan)
const selectedSceneBindingDigestSha256 =
  sha256AuthorityValue({
    selectedComponent:
      selectedComponent.contractDigestSha256,
    sceneId: scene.sceneId,
  })
const publication = {
  binding: {
    identity: {
      workspaceId: 'workspace.selective-motion',
      projectId: 'project.selective-motion',
      editSessionId: 'edit.selective-motion',
    },
    sourceBindings: {
      confirmedOutputFrameDigestSha256:
        selectedComponent.inputBindings.outputFrame
          .expectedDigestSha256,
      currentMasterTimingDigestSha256,
    },
    selectedComponent,
    bindingDigestSha256:
      selectedSceneBindingDigestSha256,
  },
  admission: {},
  semanticPlanProjection: {},
} as unknown as CanonicalLivingFrameSelectedScenePublication

const timingBindingDraft = {
  sourceBindings: {
    selectedSceneBindingDigestSha256,
    currentMasterTimingDigestSha256,
    confirmedOutputFrameDigestSha256:
      sha256AuthorityValue(outputFrame),
  },
  fps: 30,
  scenes: [{
    sceneId: scene.sceneId,
    segmentFrameRange: {
      startFrame: 0,
      endFrameExclusive: 150,
      durationFrames: 150,
    },
    semanticPhaseBindings: [
      phase('prepare', 0, 15),
      phase('activate', 15, 30),
      phase('demonstrate', 30, 105),
      phase('resolve', 105, 135),
      phase('settle', 135, 150),
    ],
    visualTiming: {
      frameRange: {
        startFrame: 15,
        endFrameExclusive: 135,
        durationFrames: 120,
      },
      revealFrames: 15,
      holdFrames: 75,
      exitFrames: 30,
    },
  }],
}
const timingBinding = {
  ...timingBindingDraft,
  timingBindingDigestSha256:
    sha256AuthorityValue(timingBindingDraft),
} as unknown as CanonicalLivingFrameTimingBinding

const components = {
  masterTimingPlan,
  confirmedSettings: {
    aspectRatio: '9:16',
    outputFrame,
    outputFrameConfirmed: true,
    outputFramePurpose:
      'private_canonical_4k_master_review',
  },
} as unknown as CanonicalPlanComponentsInput

const canonicalMotionSpecs = scene.components.map(
  (component) =>
    compileCanonicalLivingFrameMotionSpec({
      publication,
      timingBinding,
      components,
      sceneId: scene.sceneId,
      componentId: component.componentId,
    }),
)
const canonicalMotionBefore =
  structuredClone(canonicalMotionSpecs)
const input:
  ReconcileLivingFrameSelectedSceneSelectiveMotionInput = {
    reconciliationId:
      'living-frame.selective-motion.helicopter',
    sceneId: scene.sceneId,
    publication,
    timingBinding,
    components,
    canonicalMotionSpecs,
  }
const reconciliation =
  await reconcileLivingFrameSelectedSceneSelectiveMotion(
    input,
  )

assert.equal(
  await verifyLivingFrameSelectedSceneSelectiveMotionReconciliation(
    reconciliation,
    input,
  ),
  true,
)
assert.deepEqual(canonicalMotionSpecs, canonicalMotionBefore)
assert.equal(reconciliation.metrics.unitCount, 5)
assert.equal(reconciliation.metrics.exactMatchCount, 2)
assert.equal(reconciliation.metrics.blockedCount, 3)
assert.equal(reconciliation.metrics.rotationTrackCount, 5)
assert.equal(
  reconciliation.metrics
    .expectedMechanicalRotationComponentCount,
  2,
)
assert.equal(
  reconciliation.metrics.unexpectedRotationComponentCount,
  3,
)
assert.equal(
  reconciliation.metrics
    .missingMechanicalRotationComponentCount,
  0,
)
assert.equal(
  reconciliation.metrics.environmentalRuntimeGapCount,
  1,
)
assert.equal(
  reconciliation.allUnitsRoleActivationMatched,
  false,
)
assert.equal(
  reconciliation
    .canonicalSceneVerbBroadcastConflictObserved,
  true,
)
assert.equal(
  reconciliation.staticAnchorRotationConflictObserved,
  true,
)
assert.equal(
  reconciliation.environmentalMotionRuntimeGapObserved,
  true,
)
assert.equal(
  reconciliation
    .canonicalSelectiveMotionCanProceedByThisReconciliation,
  false,
)
assert.equal(
  reconciliation
    .canonicalSelectedSceneOrMotionInterfaceMutated,
  false,
)
assert.equal(reconciliation.renderAuthorized, false)
assert.equal(reconciliation.productionReady, false)
assert.equal(
  reconciliation.authorityBoundary
    .readOnlySelectiveMotionReconciliationAuthority,
  true,
)
assert.equal(
  Object.entries(reconciliation.authorityBoundary)
    .filter(([key]) =>
      key !==
        'readOnlySelectiveMotionReconciliationAuthority')
    .every(([, value]) => value === false),
  true,
)

const background = unit('helicopter.background')
assert.equal(background.selectedMotionIntent.staticAnchor, true)
assert.equal(
  background.selectedMotionIntent
    .mechanicalPartMotionSelected,
  false,
)
assert.equal(
  background.reconciliationStatus,
  'blocked_unselected_component_rotation',
)
assert.equal(
  background.observationCodes.includes(
    'static_anchor_receives_mechanical_rotation',
  ),
  true,
)
assert.equal(
  background.requiredCanonicalCorrection
    .removeMechanicalRotation,
  true,
)
assert.equal(
  background.requiredCanonicalCorrection
    .keepStaticAnchorUnrotated,
  true,
)

const body = unit('helicopter.body')
assert.equal(body.role, 'primary_subject')
assert.equal(
  body.selectedMotionIntent.mechanicalRotationAllowed,
  false,
)
assert.equal(
  body.reconciliationStatus,
  'blocked_unselected_component_rotation',
)
assert.equal(
  body.requiredCanonicalCorrection.removeMechanicalRotation,
  true,
)

for (
  const componentId of [
    'helicopter.main-rotor',
    'helicopter.tail-rotor',
  ]
) {
  const rotor = unit(componentId)
  assert.equal(rotor.role, 'mechanical_component')
  assert.equal(
    rotor.selectedMotionIntent.mechanicalPartMotionSelected,
    true,
  )
  assert.equal(
    rotor.selectedMotionIntent.mechanicalRotationRequired,
    true,
  )
  assert.equal(
    rotor.canonicalMotionObservation
      .currentRotationTrackCount,
    1,
  )
  assert.equal(
    rotor.reconciliationStatus,
    'exact_role_activation_match',
  )
  assert.equal(
    rotor.requiredCanonicalCorrection
      .requireComponentRigPivotBeforeRotationRender,
    true,
  )
  assert.equal(
    rotor.downstreamCanonicalMotionAdmissionBlocked,
    false,
  )
}

const downwash = unit('helicopter.downwash')
assert.equal(downwash.role, 'environmental_effect')
assert.equal(
  downwash.selectedMotionIntent.environmentalMotionSelected,
  true,
)
assert.equal(
  downwash.selectedMotionIntent
    .environmentalParticleOrApprovedFallbackRequired,
  true,
)
assert.equal(
  downwash.reconciliationStatus,
  'blocked_environmental_component_receives_mechanical_rotation',
)
assert.equal(
  downwash.observationCodes.includes(
    'environmental_particle_motion_not_renderable',
  ),
  true,
)
assert.equal(
  downwash.requiredCanonicalCorrection
    .requireEnvironmentalPrimitiveOrApprovedFallback,
  true,
)

let adversarialAssertions = 0

await assert.rejects(
  reconcileLivingFrameSelectedSceneSelectiveMotion({
    ...input,
    canonicalMotionSpecs: [
      ...canonicalMotionSpecs,
      canonicalMotionSpecs[0]!,
    ],
  }),
  (error: unknown) =>
    hasIssue(error, 'duplicate_motion_spec'),
)
adversarialAssertions += 1

await assert.rejects(
  reconcileLivingFrameSelectedSceneSelectiveMotion({
    ...input,
    canonicalMotionSpecs:
      canonicalMotionSpecs.slice(1),
  }),
  (error: unknown) =>
    hasIssue(error, 'missing_motion_spec'),
)
adversarialAssertions += 1

const tamperedMotion = structuredClone(
  canonicalMotionSpecs[0]!,
) as unknown as {
  tracks: Array<{
    property: string
  }>
}
tamperedMotion.tracks[0]!.property = 'rotation_degrees'
await assert.rejects(
  reconcileLivingFrameSelectedSceneSelectiveMotion({
    ...input,
    canonicalMotionSpecs: [
      tamperedMotion as unknown as CanonicalLivingFrameMotionSpec,
      ...canonicalMotionSpecs.slice(1),
    ],
  }),
  (error: unknown) =>
    hasIssue(error, 'canonical_motion_spec_invalid'),
)
adversarialAssertions += 1

await assert.rejects(
  reconcileLivingFrameSelectedSceneSelectiveMotion({
    ...input,
    sceneId: 'scene.unrelated',
  }),
  (error: unknown) =>
    hasIssue(error, 'scene_or_component_mismatch'),
)
adversarialAssertions += 1

await assert.rejects(
  reconcileLivingFrameSelectedSceneSelectiveMotion({
    ...input,
    unexpectedAuthority: true,
  } as unknown as
    ReconcileLivingFrameSelectedSceneSelectiveMotionInput),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

const forgedAuthority = structuredClone(
  reconciliation,
) as {
  authorityBoundary: {
    motionSpecMutationAuthority: boolean
  }
}
forgedAuthority.authorityBoundary
  .motionSpecMutationAuthority = true
assert.equal(
  await verifyLivingFrameSelectedSceneSelectiveMotionReconciliation(
    forgedAuthority,
    input,
  ),
  false,
)
adversarialAssertions += 1

const forgedUnit = structuredClone(reconciliation)
const forgedUnitRoot = forgedUnit as unknown as {
  units: Array<{
    requiredCanonicalCorrection: {
      removeMechanicalRotation: boolean
    }
  }>
}
forgedUnitRoot.units[0]!.requiredCanonicalCorrection
  .removeMechanicalRotation = false
assert.equal(
  await verifyLivingFrameSelectedSceneSelectiveMotionReconciliation(
    forgedUnit,
    input,
  ),
  false,
)
adversarialAssertions += 1

const serverSource = readFileSync(
  fileURLToPath(new URL(
    '../living-frame/living-frame-selected-scene-selective-motion-reconciliation.ts',
    import.meta.url,
  )),
  'utf8',
)
for (const forbiddenSubjectTerm of [
  'helicopter',
  'musashi',
  'hormuz',
]) {
  assert.equal(
    serverSource.toLowerCase().includes(
      forbiddenSubjectTerm,
    ),
    false,
  )
}
adversarialAssertions += 1

assert.equal(adversarialAssertions, 8)

process.stdout.write(
  `${JSON.stringify({
    status: 'passed',
    contractVersion: reconciliation.contractVersion,
    unitCount: reconciliation.metrics.unitCount,
    exactMatchCount:
      reconciliation.metrics.exactMatchCount,
    blockedCount: reconciliation.metrics.blockedCount,
    currentRotationTrackCount:
      reconciliation.metrics.rotationTrackCount,
    expectedMechanicalRotationComponentCount:
      reconciliation.metrics
        .expectedMechanicalRotationComponentCount,
    unexpectedRotationComponentCount:
      reconciliation.metrics
        .unexpectedRotationComponentCount,
    environmentalRuntimeGapCount:
      reconciliation.metrics.environmentalRuntimeGapCount,
    canonicalMotionMutated:
      reconciliation
        .canonicalSelectedSceneOrMotionInterfaceMutated,
    productionReady: reconciliation.productionReady,
    adversarialAssertions,
  })}\n`,
)

function unit(componentId: string) {
  const match = reconciliation.units.find(
    (candidate) =>
      candidate.componentId === componentId,
  )
  assert(match)
  return match
}

function phase(
  phaseValue:
    'prepare'
    | 'activate'
    | 'demonstrate'
    | 'resolve'
    | 'settle',
  startFrame: number,
  endFrameExclusive: number,
) {
  const order = {
    prepare: 0,
    activate: 1,
    demonstrate: 2,
    resolve: 3,
    settle: 4,
  } as const
  return {
    order: order[phaseValue],
    phase: phaseValue,
    frameRange: {
      startFrame,
      endFrameExclusive,
      durationFrames: endFrameExclusive - startFrame,
    },
  }
}

function hasIssue(
  error: unknown,
  code: string,
): boolean {
  return error instanceof
      LivingFrameSelectedSceneSelectiveMotionReconciliationError
    && error.issues.some((issue) =>
      issue.code === code)
}
