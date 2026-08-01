import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  createLivingFrameContractFixtures,
} from '../../src/lib/living-frame/living-frame-fixtures'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import {
  compileLivingFrameComponentGeometry,
} from '../living-frame/living-frame-component-geometry'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'
import {
  inspectLivingFrameEnvironmentalParticleAdmission,
  LivingFrameEnvironmentalParticleAdmissionError,
  verifyLivingFrameEnvironmentalParticleAdmission,
  type InspectLivingFrameEnvironmentalParticleAdmissionInput,
} from '../living-frame/living-frame-selected-scene-environmental-particle-admission'
import {
  reconcileLivingFrameSelectedSceneSelectiveMotion,
} from '../living-frame/living-frame-selected-scene-selective-motion-reconciliation'
import {
  compileCanonicalLivingFrameMotionSpec,
} from '../living-frame/canonical-living-frame-motion'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'

const fixtures = await createLivingFrameContractFixtures()
const selectedComponent = fixtures.helicopterSelectiveMotion
const scene = selectedComponent.scenePlans[0]!
const componentId = 'helicopter.downwash'
const masterTimingPlan = {
  id: 'master-timing.environmental-particle',
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
      workspaceId: 'workspace.environmental-particle',
      projectId: 'project.environmental-particle',
      editSessionId: 'edit.environmental-particle',
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
const selectiveMotionReconciliation =
  await reconcileLivingFrameSelectedSceneSelectiveMotion({
    reconciliationId:
      'living-frame.environmental-particle.selective-motion',
    sceneId: scene.sceneId,
    publication,
    timingBinding,
    components,
    canonicalMotionSpecs,
  })

const motionBundle =
  compileLivingFrameDeterministicMotion({
    timingExpectation: {
      masterTimingPlanId:
        'master-timing.environmental-particle',
      masterTimingPlanDigestSha256:
        currentMasterTimingDigestSha256,
      outputFrameId:
        selectedComponent.inputBindings.outputFrame
          .expectationRefId,
      outputFrameDigestSha256:
        selectedComponent.inputBindings.outputFrame
          .expectedDigestSha256,
      sceneId: scene.sceneId,
      sceneStartFrame: 0,
      sceneEndFrame: 149,
      fpsNumerator: 30,
      fpsDenominator: 1,
      timingAuthorityRevalidationRequired: true,
    },
    tracks: [{
      trackId: 'track.environmental-particle.emission',
      order: 0,
      motionGroupId: 'motion.environmental-particle',
      componentId,
      property: 'particle_emission_normalized',
      role: 'ambient',
      restorationExpectation:
        'required_return_to_initial',
      keyframes: [
        {
          frame: 30,
          value: 0,
          easingToNext: 'ease_out_quad',
        },
        {
          frame: 45,
          value: 0.75,
          easingToNext: 'ease_in_out_cubic',
        },
        {
          frame: 105,
          value: 0.75,
          easingToNext: 'ease_in_out_cubic',
        },
        {
          frame: 135,
          value: 0,
          easingToNext: 'hold',
        },
      ],
    }],
  })

const componentGeometryBundle =
  compileLivingFrameComponentGeometry({
    outputFrameExpectation: {
      outputFrameId:
        selectedComponent.inputBindings.outputFrame
          .expectationRefId,
      outputFrameDigestSha256:
        selectedComponent.inputBindings.outputFrame
          .expectedDigestSha256,
      widthPixels: 1_920,
      heightPixels: 1_080,
      pixelAspectRatioNumerator: 1,
      pixelAspectRatioDenominator: 1,
      confirmedOutputFrameRevalidationRequired: true,
    },
    motionBundle,
    safeRegions: [],
    components: [
      {
        componentId: 'helicopter.background',
        order: 0,
        kind: 'visual_component',
        role: 'opaque_background_plate',
        focalRole: 'static_anchor',
        depthBand: 'background',
        rect: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
        pivot: { x: 0.5, y: 0.5 },
        parentComponentId: null,
        anchorComponentId: null,
        anchorPoint: { x: 0.5, y: 0.5 },
        collisionPolicy: 'base_layer_coverage',
        transparencyExpectation: 'opaque_plate',
        alphaSourceExpectation: 'opaque_plate',
        maskExpectation: 'opaque',
      },
      {
        componentId: 'helicopter.body',
        order: 1,
        kind: 'visual_component',
        role: 'primary_subject',
        focalRole: 'primary',
        depthBand: 'subject_plane',
        rect: {
          x: 0.2,
          y: 0.2,
          width: 0.6,
          height: 0.55,
        },
        pivot: { x: 0.5, y: 0.48 },
        parentComponentId: null,
        anchorComponentId: 'helicopter.background',
        anchorPoint: { x: 0.5, y: 0.48 },
        collisionPolicy:
          'avoid_all_protected_regions',
        transparencyExpectation:
          'still_alpha_required',
        alphaSourceExpectation:
          'postprocessed_still_mask_requires_qa',
        maskExpectation:
          'still_alpha_artifact_required',
      },
      {
        componentId,
        order: 2,
        kind: 'visual_component',
        role: 'environmental_effect',
        focalRole: 'secondary',
        depthBand: 'foreground',
        rect: {
          x: 0.18,
          y: 0.62,
          width: 0.64,
          height: 0.3,
        },
        pivot: { x: 0.5, y: 0.65 },
        parentComponentId: null,
        anchorComponentId: 'helicopter.body',
        anchorPoint: { x: 0.5, y: 0.65 },
        collisionPolicy:
          'avoid_all_protected_regions',
        transparencyExpectation:
          'procedural_alpha',
        alphaSourceExpectation:
          'procedural_alpha_requires_qa',
        maskExpectation:
          'procedural_alpha_artifact_required',
      },
    ],
    occlusionExpectations: [{
      relationId:
        'occlusion.environment-over-subject',
      order: 0,
      kind: 'in_front_of',
      foregroundComponentId: componentId,
      backgroundComponentId: 'helicopter.body',
      downstreamDepthTransitionCompilationRequired:
        false,
    }],
  })

const input:
  InspectLivingFrameEnvironmentalParticleAdmissionInput = {
    admissionCandidateId:
      'living-frame.environmental-particle.admission',
    sceneId: scene.sceneId,
    componentId,
    publication,
    timingBinding,
    componentGeometryBundle,
    selectiveMotionReconciliation,
  }

const admission =
  await inspectLivingFrameEnvironmentalParticleAdmission(
    input,
  )

assert.equal(
  await verifyLivingFrameEnvironmentalParticleAdmission(
    admission,
    input,
  ),
  true,
)
assert.equal(
  admission.admissionState,
  'blocked_by_typed_effect_profile_pixi_sequence_and_remotion_sequence_interfaces',
)
assert.equal(
  admission.selectedEnvironmentalIntent.componentRole,
  'environmental_effect',
)
assert.equal(
  admission.selectedEnvironmentalIntent
    .environmentalMotionActivationId,
  'activation.helicopter-environment',
)
assert.deepEqual(
  admission.selectedEnvironmentalIntent
    .linkedSemanticPhases,
  ['demonstrate', 'resolve'],
)
assert.equal(
  admission.exactFrameAndGeometryBinding.widthPixels,
  1_920,
)
assert.equal(
  admission.exactFrameAndGeometryBinding.heightPixels,
  1_080,
)
assert.equal(
  admission.exactFrameAndGeometryBinding.startFrame,
  30,
)
assert.equal(
  admission.exactFrameAndGeometryBinding
    .endFrameExclusive,
  135,
)
assert.equal(
  admission.requiredPrimitiveContract.motionProperty,
  'particle_emission_normalized',
)
assert.equal(
  admission.requiredPrimitiveContract.sceneArtifactKind,
  'procedural_alpha_primitive',
)
assert.equal(
  admission.toolOperationDisposition.existingToolId,
  'pixijs',
)
assert.equal(
  admission.toolOperationDisposition.existingOperationId,
  'tool.pixijs.render_pixi_scene.v1',
)
assert.equal(
  admission.toolOperationDisposition.candidateOperationId,
  'tool.pixijs.render_living_frame_environmental_particles.v1',
)
assert.equal(
  admission.toolOperationDisposition
    .separateToolIdentityRequired,
  false,
)
assert.equal(
  admission.toolOperationDisposition.mismatchCodes.length,
  6,
)
assert.equal(
  admission.currentSharedInterfaceConflictObserved,
  true,
)
assert.equal(admission.materializationAllowed, false)
assert.equal(admission.operationRegistered, false)
assert.equal(admission.dispatchGranted, false)
assert.equal(admission.runtimeExecuted, false)
assert.equal(admission.remotionAdapterMutated, false)
assert.equal(admission.productionReady, false)
assert.equal(
  Object.entries(admission.authorityBoundary)
    .filter(([key]) =>
      key !== 'readOnlyAdmissionCandidateAuthority')
    .every(([, value]) => value === false),
  true,
)

let adversarialAssertions = 0

await assert.rejects(
  inspectLivingFrameEnvironmentalParticleAdmission({
    ...input,
    componentId: 'helicopter.body',
  }),
  (error: unknown) =>
    hasIssue(error, 'scene_or_component_mismatch'),
)
adversarialAssertions += 1

await assert.rejects(
  inspectLivingFrameEnvironmentalParticleAdmission({
    ...input,
    unexpectedDimensions: {
      width: 1_024,
      height: 1_024,
    },
  } as unknown as
    InspectLivingFrameEnvironmentalParticleAdmissionInput),
  (error: unknown) =>
    hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

const opaqueGeometry = structuredClone(
  componentGeometryBundle,
)
const opaqueRoot = opaqueGeometry as unknown as {
  components: Array<{
    componentId: string
    transparencyExpectation: string
  }>
}
opaqueRoot.components.find(
  (component) => component.componentId === componentId,
)!.transparencyExpectation = 'opaque_plate'
await assert.rejects(
  inspectLivingFrameEnvironmentalParticleAdmission({
    ...input,
    componentGeometryBundle: opaqueGeometry,
  }),
  (error: unknown) =>
    hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

const forgedReconciliation = structuredClone(
  selectiveMotionReconciliation,
)
const forgedReconciliationRoot =
  forgedReconciliation as unknown as {
    units: Array<{
      componentId: string
      selectedMotionIntent: {
        environmentalMotionSelected: boolean
      }
    }>
  }
forgedReconciliationRoot.units.find(
  (unit) => unit.componentId === componentId,
)!.selectedMotionIntent.environmentalMotionSelected =
  false
await assert.rejects(
  inspectLivingFrameEnvironmentalParticleAdmission({
    ...input,
    selectiveMotionReconciliation:
      forgedReconciliation,
  }),
  (error: unknown) =>
    hasIssue(error, 'source_lineage_mismatch'),
)
adversarialAssertions += 1

const missingPhase = structuredClone(timingBinding)
const missingPhaseRoot = missingPhase as unknown as {
  scenes: Array<{
    semanticPhaseBindings: Array<{
      phase: string
    }>
  }>
}
missingPhaseRoot.scenes[0]!.semanticPhaseBindings =
  missingPhaseRoot.scenes[0]!.semanticPhaseBindings
    .filter((binding) => binding.phase !== 'resolve')
await assert.rejects(
  inspectLivingFrameEnvironmentalParticleAdmission({
    ...input,
    timingBinding: missingPhase,
  }),
  (error: unknown) =>
    hasIssue(error, 'timing_binding_missing'),
)
adversarialAssertions += 1

const forgedAdmission = structuredClone(admission)
const forgedAdmissionRoot =
  forgedAdmission as unknown as {
    materializationAllowed: boolean
  }
forgedAdmissionRoot.materializationAllowed = true
assert.equal(
  await verifyLivingFrameEnvironmentalParticleAdmission(
    forgedAdmission,
    input,
  ),
  false,
)
adversarialAssertions += 1

const callerSeed = {
  ...input,
  seed: 7,
} as unknown as
  InspectLivingFrameEnvironmentalParticleAdmissionInput
await assert.rejects(
  inspectLivingFrameEnvironmentalParticleAdmission(
    callerSeed,
  ),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)
adversarialAssertions += 1

const serverSource = readFileSync(
  fileURLToPath(new URL(
    '../living-frame/living-frame-selected-scene-environmental-particle-admission.ts',
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
    contractVersion: admission.contractVersion,
    componentRole:
      admission.selectedEnvironmentalIntent.componentRole,
    exactWidth:
      admission.exactFrameAndGeometryBinding.widthPixels,
    exactHeight:
      admission.exactFrameAndGeometryBinding.heightPixels,
    startFrame:
      admission.exactFrameAndGeometryBinding.startFrame,
    endFrameExclusive:
      admission.exactFrameAndGeometryBinding
        .endFrameExclusive,
    currentToolId:
      admission.toolOperationDisposition.existingToolId,
    currentOperationId:
      admission.toolOperationDisposition.existingOperationId,
    candidateOperationId:
      admission.toolOperationDisposition.candidateOperationId,
    mismatchCount:
      admission.toolOperationDisposition.mismatchCodes.length,
    materializationAllowed:
      admission.materializationAllowed,
    productionReady: admission.productionReady,
    adversarialAssertions,
  })}\n`,
)

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
      durationFrames:
        endFrameExclusive - startFrame,
    },
  }
}

function hasIssue(
  error: unknown,
  code: string,
): boolean {
  return error instanceof
      LivingFrameEnvironmentalParticleAdmissionError
    && error.issues.some((issue) =>
      issue.code === code)
}
