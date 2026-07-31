import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createLivingFrameContractFixtures,
} from '../../src/lib/living-frame/living-frame-fixtures'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import type {
  LivingFrameBlenderSelectedSceneApprovedSnapshotBinding,
  LivingFrameBlenderSelectedScenePlannedWorkBinding,
} from '../../src/types/living-frame-blender-selected-scene-admission'
import {
  compileLivingFrameBlenderFixedAdapterInternalRequest,
  runLivingFrameBlenderFixedAdapterInternalWithOutputLease,
} from '../living-frame/living-frame-blender-fixed-adapter-internal-test'
import {
  buildLivingFrameBlenderFixedAdapterPrivateFixture,
} from '../living-frame/living-frame-blender-fixed-adapter-private-fixture'
import {
  consumeLivingFrameBlenderRigPrivatePersistedArtifactSetLease,
  executeLivingFrameBlenderRigPrivatePersistenceInternalTestWithArtifactSetLease,
} from '../living-frame/living-frame-blender-rig-private-persistence-internal-test'
import {
  inspectLivingFrameBlenderSelectedSceneAdmission,
  verifyLivingFrameBlenderSelectedSceneAdmission,
  type InspectLivingFrameBlenderSelectedSceneAdmissionInput,
} from '../living-frame/living-frame-blender-selected-scene-admission'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const fixtures = await createLivingFrameContractFixtures()
const selectedComponent = fixtures.musashiDecisiveStrike
const scene = selectedComponent.scenePlans[0]!
const componentId = 'musashi.body'
const masterTimingPlanId =
  selectedComponent.inputBindings.masterTiming
    .expectationRefId
const currentMasterTimingDigestSha256 =
  selectedComponent.inputBindings.masterTiming
    .expectedDigestSha256
const confirmedOutputFrameDigestSha256 =
  selectedComponent.inputBindings.outputFrame
    .expectedDigestSha256
const selectedSceneBindingDigestSha256 =
  sha256AuthorityValue({
    selectedComponentDigestSha256:
      selectedComponent.contractDigestSha256,
    sceneId: scene.sceneId,
    selectedTreatment: 'use_full',
  })
const publication = {
  binding: {
    identity: {
      workspaceId: 'workspace.musashi',
      projectId: 'project.musashi',
      editSessionId: 'edit.musashi',
    },
    sourceBindings: {
      confirmedOutputFrameDigestSha256,
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
    confirmedOutputFrameDigestSha256,
  },
  fps: 30,
  scenes: [{
    sceneId: scene.sceneId,
    segmentFrameRange: range(0, 150),
    semanticPhaseBindings: [
      phase('prepare', 0, 12),
      phase('activate', 12, 20),
      phase('demonstrate', 20, 64),
      phase('resolve', 64, 72),
      phase('settle', 72, 150),
    ],
    visualTiming: {
      frameRange: range(12, 72),
      revealFrames: 8,
      holdFrames: 44,
      exitFrames: 8,
    },
  }],
}
const timingBinding = {
  ...timingBindingDraft,
  timingBindingDigestSha256:
    sha256AuthorityValue(timingBindingDraft),
} as unknown as CanonicalLivingFrameTimingBinding

const approvedSnapshotBinding:
  LivingFrameBlenderSelectedSceneApprovedSnapshotBinding = {
    approvedSnapshotId:
      'approved-snapshot.musashi.blender-rig',
    approvedSnapshotDigestSha256:
      sha256AuthorityValue(
        'approved-snapshot.musashi.blender-rig.v1',
      ),
    immutableApprovedSnapshot: true,
    confirmedFrameIncluded: true,
    masterTimingIncluded: true,
    exactRiggingPlanIncluded: true,
    exactRigActionPlanIncluded: true,
    exactCreditEstimateIncluded: true,
    exactWorkGraphIncluded: true,
  }
const provisionalFixture =
  buildLivingFrameBlenderFixedAdapterPrivateFixture({
    sceneId: scene.sceneId,
    backgroundComponentId: 'musashi.background',
    primaryComponentId: componentId,
    virtualCameraComponentId:
      'musashi.virtual-camera',
    outputFrameId:
      selectedComponent.inputBindings.outputFrame
        .expectationRefId,
    outputFrameDigestSha256:
      confirmedOutputFrameDigestSha256,
    masterTimingPlanId,
    masterTimingPlanDigestSha256:
      currentMasterTimingDigestSha256,
    approvedSnapshotRef: {
      refId:
        approvedSnapshotBinding.approvedSnapshotId,
      digestSha256:
        approvedSnapshotBinding
          .approvedSnapshotDigestSha256,
    },
    selectedSceneRef: {
      refId: scene.sceneId,
      digestSha256:
        selectedSceneBindingDigestSha256,
    },
  })
const workDraft = {
  workItemKey:
    'work.living-frame.musashi.blender-rig.v1',
  workItemType: 'build_component_rig' as const,
  sceneId: scene.sceneId,
  componentId,
  toolId: 'blender' as const,
  operationId:
    'tool.blender.render_living_frame_component_rig.v1' as const,
  approvedSnapshotDigestSha256:
    approvedSnapshotBinding
      .approvedSnapshotDigestSha256,
  selectedSceneBindingDigestSha256,
  riggingPlanDigestSha256:
    provisionalFixture.candidateRequest
      .riggingPlan.planDigestSha256,
  actionPlanDigestSha256:
    provisionalFixture.actionPlan.actionDigestSha256,
  confirmedOutputFrameDigestSha256,
  currentMasterTimingDigestSha256,
  oneComponentSequencePerAttempt: true as const,
  maxAttempts: 1 as const,
  cpuFallbackAllowed: true as const,
  approvedWorkItem: false as const,
  executablePayloadPresent: false as const,
}
const plannedWorkBinding:
  LivingFrameBlenderSelectedScenePlannedWorkBinding = {
    ...workDraft,
    workItemDigestSha256:
      sha256AuthorityValue(workDraft),
  }
const fixture =
  buildLivingFrameBlenderFixedAdapterPrivateFixture({
    sceneId: scene.sceneId,
    backgroundComponentId: 'musashi.background',
    primaryComponentId: componentId,
    virtualCameraComponentId:
      'musashi.virtual-camera',
    outputFrameId:
      selectedComponent.inputBindings.outputFrame
        .expectationRefId,
    outputFrameDigestSha256:
      confirmedOutputFrameDigestSha256,
    masterTimingPlanId,
    masterTimingPlanDigestSha256:
      currentMasterTimingDigestSha256,
    approvedSnapshotRef: {
      refId:
        approvedSnapshotBinding.approvedSnapshotId,
      digestSha256:
        approvedSnapshotBinding
          .approvedSnapshotDigestSha256,
    },
    selectedSceneRef: {
      refId: scene.sceneId,
      digestSha256:
        selectedSceneBindingDigestSha256,
    },
    plannedWorkItemRef: {
      refId: plannedWorkBinding.workItemKey,
      digestSha256:
        plannedWorkBinding.workItemDigestSha256,
    },
  })
assert.equal(
  fixture.candidateRequest.riggingPlan
    .planDigestSha256,
  provisionalFixture.candidateRequest.riggingPlan
    .planDigestSha256,
)
assert.equal(
  fixture.actionPlan.actionDigestSha256,
  provisionalFixture.actionPlan.actionDigestSha256,
)

const admissionInput:
  InspectLivingFrameBlenderSelectedSceneAdmissionInput = {
    admissionCandidateId:
      'admission.musashi.blender-rig.private-internal-v1',
    sceneId: scene.sceneId,
    componentId,
    publication,
    timingBinding,
    componentGeometryBundle:
      fixture.componentGeometryBundle,
    candidateRequest: fixture.candidateRequest,
    actionPlan: fixture.actionPlan,
    approvedSnapshotBinding,
    plannedWorkBinding,
  }
const admission =
  await inspectLivingFrameBlenderSelectedSceneAdmission(
    admissionInput,
  )
assert.equal(
  await verifyLivingFrameBlenderSelectedSceneAdmission(
    admission,
    admissionInput,
  ),
  true,
)
assert.equal(admission.operationRegistered, false)
assert.equal(admission.canonicalWorkAdmitted, false)
assert.equal(admission.dispatchGranted, false)
assert.equal(admission.runtimeAuthorityGranted, false)
assert.equal(admission.productionReady, false)
assert.equal(
  admission.exactFrameBinding.durationFrames,
  60,
)
assert.equal(
  admission.operationCandidate.remotionRemainsFinalCanvas,
  true,
)
await assert.rejects(
  () =>
    inspectLivingFrameBlenderSelectedSceneAdmission({
      ...admissionInput,
      approvedSnapshotBinding: {
        ...approvedSnapshotBinding,
        rawPath: '/tmp/forbidden',
      } as unknown as
        LivingFrameBlenderSelectedSceneApprovedSnapshotBinding,
    }),
  /inspection failed/,
)
const leakedWorkDraft = {
  ...workDraft,
  rawPrompt: 'forbidden caller prompt',
}
await assert.rejects(
  () =>
    inspectLivingFrameBlenderSelectedSceneAdmission({
      ...admissionInput,
      plannedWorkBinding: {
        ...leakedWorkDraft,
        workItemDigestSha256:
          sha256AuthorityValue(leakedWorkDraft),
      } as unknown as
        LivingFrameBlenderSelectedScenePlannedWorkBinding,
    }),
  /inspection failed/,
)

const compiled =
  compileLivingFrameBlenderFixedAdapterInternalRequest({
    candidateRequest: fixture.candidateRequest,
    actionPlan: fixture.actionPlan,
    componentId,
    mesh: fixture.mesh,
    material: {
      baseColorRgba: [0.18, 0.16, 0.13, 1],
      roughness: 0.7,
    },
    fps: 30,
    renderProfile: 'full',
  })
const adapterRun =
  runLivingFrameBlenderFixedAdapterInternalWithOutputLease(
    compiled,
  )
await assert.rejects(
  () =>
    executeLivingFrameBlenderRigPrivatePersistenceInternalTestWithArtifactSetLease({
      qualificationId:
        'qualification.musashi.blender-rig.broad-root-v1',
      localStorageRoot: '/',
      admission,
      admissionInput,
      adapterRun,
    }),
  /owned bounded internal-test directory/,
)
const storageRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-lf-blender-persistence-'),
)
let persistedLease:
  Awaited<ReturnType<
    typeof executeLivingFrameBlenderRigPrivatePersistenceInternalTestWithArtifactSetLease
  >>['persistedArtifactSetLease'] | undefined
try {
  const execution =
    await executeLivingFrameBlenderRigPrivatePersistenceInternalTestWithArtifactSetLease({
      qualificationId:
        'qualification.musashi.blender-rig.private-persistence-v1',
      localStorageRoot: storageRoot,
      admission,
      admissionInput,
      adapterRun,
    })
  persistedLease =
    execution.persistedArtifactSetLease
  const { report } = execution
  assert.equal(
    report.persistedArtifactSet.fileCount,
    180,
  )
  assert.equal(
    report.persistedArtifactSet.rgbaFileCount,
    60,
  )
  assert.equal(
    report.persistedArtifactSet.maskFileCount,
    60,
  )
  assert.equal(
    report.persistedArtifactSet.depthFileCount,
    60,
  )
  assert.equal(
    report.persistedArtifactSet
      .everyFileCreatedExactlyOnce,
    true,
  )
  assert.equal(
    report.persistedArtifactSet
      .exactReadbackVerified,
    true,
  )
  assert.equal(
    report.resourceObservation
      .actualRuntimeObserved,
    true,
  )
  assert.equal(
    report.resourceObservation
      .canonicalActualCostCreated,
    false,
  )
  assert.equal(
    report.authorityBoundary
      .assetManifestAuthority,
    false,
  )
  assert.equal(
    report.authorityBoundary
      .privateReviewAuthority,
    false,
  )
  assert.equal(
    report.remotionRemainsFinalCanvas,
    true,
  )
  const persisted =
    await consumeLivingFrameBlenderRigPrivatePersistedArtifactSetLease(
      persistedLease,
    )
  assert.equal(persisted.files.length, 180)
  const first = persisted.files[0]!
  assert.equal(
    await digestStream(await first.openStream()),
    first.commitment.sha256,
  )
  await assert.rejects(
    () => first.openStream(),
    /stream is already consumed/,
  )
  await assert.rejects(
    () =>
      consumeLivingFrameBlenderRigPrivatePersistedArtifactSetLease(
        persistedLease!,
      ),
    /invalid, unknown, or already consumed/,
  )
  assert.throws(
    () =>
      runLivingFrameBlenderFixedAdapterInternalWithOutputLease(
        {
          ...compiled,
          payload: {
            ...compiled.payload,
            output: {
              ...compiled.payload.output,
              widthPixels: 1_024,
              heightPixels: 1_024,
            },
          },
        },
      ),
    /compiled request integrity is invalid/,
  )
  assert.equal(
    await verifyLivingFrameBlenderSelectedSceneAdmission(
      {
        ...admission,
        admissionDigestSha256:
          '0'.repeat(64),
      },
      admissionInput,
    ),
    false,
  )
  await assert.rejects(
    () =>
      inspectLivingFrameBlenderSelectedSceneAdmission({
        ...admissionInput,
        sceneId: 'scene.cross-scene',
      }),
    /inspection failed/,
  )
  await assert.rejects(
    () =>
      inspectLivingFrameBlenderSelectedSceneAdmission({
        ...admissionInput,
        plannedWorkBinding: {
          ...plannedWorkBinding,
          workItemDigestSha256:
            '1'.repeat(64),
        },
      }),
    /inspection failed/,
  )
  await assert.rejects(
    () =>
      executeLivingFrameBlenderRigPrivatePersistenceInternalTestWithArtifactSetLease({
        qualificationId:
          'qualification.musashi.blender-rig.replay-v1',
        localStorageRoot: storageRoot,
        admission,
        admissionInput,
        adapterRun,
      }),
    /invalid, unknown, or already consumed/,
  )

  console.log(JSON.stringify({
    smoke:
      'living_frame_blender_selected_scene_private_persistence_internal_test',
    status:
      'passed_private_internal_selected_scene_full_sequence_persistence',
    sceneId: scene.sceneId,
    componentId,
    rigMode:
      admission.selectedRigIntent.rigMode,
    frameRange: admission.exactFrameBinding,
    fileCount:
      report.persistedArtifactSet.fileCount,
    totalArtifactByteLength:
      report.persistedArtifactSet
        .totalArtifactByteLength,
    totalDurationMs:
      report.resourceObservation.totalDurationMs,
    maximumResidentBytes:
      report.resourceObservation
        .maximumResidentBytes,
    adversarialAssertions: 10,
    selectedSceneAdmissionRevalidated: true,
    createOnlyPersistenceAndReadbackVerified: true,
    outputLeaseConsumedExactlyOnce: true,
    persistedArtifactSetLeaseConsumedExactlyOnce: true,
    canonicalAssetManifestMutated: false,
    canonicalQaApproved: false,
    privateReviewApproved: false,
    actualCostCreated: false,
    customerCharged: false,
    remotionRemainsFinalCanvas: true,
    publicDeliveryReady: false,
    productionReady: false,
  }))
} finally {
  await rm(storageRoot, {
    recursive: true,
    force: true,
  })
}

function range(
  startFrame: number,
  endFrameExclusive: number,
) {
  return {
    startFrame,
    endFrameExclusive,
    durationFrames:
      endFrameExclusive - startFrame,
  }
}

function phase(
  phaseName:
    | 'prepare'
    | 'activate'
    | 'demonstrate'
    | 'resolve'
    | 'settle',
  startFrame: number,
  endFrameExclusive: number,
) {
  return {
    phase: phaseName,
    frameRange:
      range(startFrame, endFrameExclusive),
  }
}

async function digestStream(
  stream: NodeJS.ReadableStream,
): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of stream) {
    hash.update(
      typeof chunk === 'string'
        ? Buffer.from(chunk)
        : chunk,
    )
  }
  return hash.digest('hex')
}
