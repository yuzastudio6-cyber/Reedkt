import assert from 'node:assert/strict'

import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { createSkillAssignment } from '../edit-skills/core/skill-range-authority'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  createTrackAllAssignment,
  createTrackAllSceneContext,
  trackAllTargetSpecificationSchema,
} from '../edit-skills/track-all'
import {
  TRACK_ALL_FIXTURE_SCOPE,
  createTrackAllAuthorityFixture,
  reviseTrackAllPublicAssignment,
} from './track-all-fixtures'

process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING = '1'
const { createInternalFixtureEditSkillRuntime } = await import('../edit-skills/internal-fixture-runtime')
const runtime = createInternalFixtureEditSkillRuntime()
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const plugin = runtime.pluginRegistry.resolve(manifestRef)

const baseline = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'track-all-authority-baseline',
})
const baselinePlan = await plugin.planAssignment({ assignment: baseline.assignment })
assert.equal(baselinePlan.envelope.disposition, 'use_no_action')

let adversarialCases = 0
for (const artifactType of [
  'track_all_assignment_v1', 'track_all_target_specification_v1',
  'source_inventory_v1', 'master_timing_plan_v1', 'source_frame_authority_v1',
  'visual_ownership_manifest_v1', 'track_all_scene_context_v1',
]) {
  const missing = reviseTrackAllPublicAssignment(
    baseline.assignment,
    baseline.assignment.contextArtifactRefs.filter((ref) => ref.artifactType !== artifactType),
  )
  await assert.rejects(() => plugin.planAssignment({ assignment: missing }), /requires 1-1/iu)
  adversarialCases += 1
}

const duplicate = reviseTrackAllPublicAssignment(baseline.assignment, [
  ...baseline.assignment.contextArtifactRefs,
  baseline.refs.sceneContext,
])
await assert.rejects(() => plugin.planAssignment({ assignment: duplicate }), /duplicate context artifact/iu)
adversarialCases += 1

const foreignRef = { ...baseline.refs.sceneContext, workspaceId: 'foreign-workspace' }
const crossWorkspace = reviseTrackAllPublicAssignment(
  baseline.assignment,
  baseline.assignment.contextArtifactRefs.map((ref) =>
    ref.artifactType === foreignRef.artifactType ? foreignRef : ref),
)
await assert.rejects(() => plugin.planAssignment({ assignment: crossWorkspace }), /belongs to another workspace|cross-workspace/iu)
adversarialCases += 1

const forgedRef = { ...baseline.refs.masterTiming, sha256: '0'.repeat(64) }
const forgedArtifact = reviseTrackAllPublicAssignment(
  baseline.assignment,
  baseline.assignment.contextArtifactRefs.map((ref) =>
    ref.artifactType === forgedRef.artifactType ? forgedRef : ref),
)
await assert.rejects(() => plugin.planAssignment({ assignment: forgedArtifact }), /artifact was not found|integrity/iu)
adversarialCases += 1

const wrongSource = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'track-all-wrong-source',
  sourceFrameChecksum: hashSkillValue('wrong-source'),
})
await assert.rejects(() => plugin.planAssignment({ assignment: wrongSource.assignment }), /absent from the checksum-bound inventory/iu)
adversarialCases += 1

const wrongTargetAssignment = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'track-all-wrong-target-assignment',
  targetAssignmentId: 'another-assignment',
})
await assert.rejects(() => plugin.planAssignment({ assignment: wrongTargetAssignment.assignment }), /target specification differs/iu)
adversarialCases += 1

const wrongTargetSession = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'track-all-wrong-target-session',
  targetEditSessionId: 'another-session',
})
await assert.rejects(() => plugin.planAssignment({ assignment: wrongTargetSession.assignment }), /target specification differs/iu)
adversarialCases += 1

const staleTiming = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'track-all-stale-timing',
  masterAssignmentRange: { startFrameInclusive: 24, endFrameExclusive: 120, fps: 24 },
})
await assert.rejects(() => plugin.planAssignment({ assignment: staleTiming.assignment }), /master timing does not exactly bind/iu)
adversarialCases += 1

const outsideTarget = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'track-all-outside-target', groundingFrame: 12,
  requestedJobType: 'track_all.produce_selected_target_graph',
  intendedTreatment: 'geometry_only',
})
const outsidePlan = await plugin.planAssignment({ assignment: outsideTarget.assignment })
assert.equal(outsidePlan.envelope.disposition, 'needs_user_review')
const outsidePayload = await runtime.artifactStore.readJson({
  reference: outsidePlan.payloadRef, ...TRACK_ALL_FIXTURE_SCOPE,
}) as { decision: string; samWorkPlanned: boolean; visibleTreatmentPlanned: boolean }
assert.equal(outsidePayload.decision, 'needs_range_expansion')
assert.equal(outsidePayload.samWorkPlanned, false)
assert.equal(outsidePayload.visibleTreatmentPlanned, false)
adversarialCases += 1

const ownershipConflict = await createTrackAllAuthorityFixture({
  runtime, assignmentId: 'track-all-ownership-conflict',
  requestedJobType: 'track_all.apply_tracked_focus', intendedTreatment: 'tracked_focus',
  ownershipWindows: [{
    ownerSkillKey: 'graphic_design', ownership: 'primary', exclusive: true,
    frameRange: { startFrameInclusive: 24, endFrameExclusive: 144, fps: 24 },
    lockedEvidenceFootage: false, deliberateHeroVisual: true,
    captionSafeAreaReserved: false, transitionBoundaryOwned: false,
  }],
})
assert.equal((await plugin.planAssignment({ assignment: ownershipConflict.assignment })).envelope.disposition, 'blocked')
adversarialCases += 1

assert.throws(() => createTrackAllSceneContext({
  schemaVersion: 'track_all_scene_context_v1', assignmentId: 'range-escalation',
  analysisContextRange: { startFrameInclusive: 24, endFrameExclusive: 120, fps: 24 },
  authorizedWriteRange: { startFrameInclusive: 0, endFrameExclusive: 144, fps: 24 },
  wholeVideoEvidenceReadOnly: true, sceneIds: ['scene'], shotBoundaries: [60],
}), /does not contain the write range/iu)
adversarialCases += 1

assert.throws(() => trackAllTargetSpecificationSchema.parse({
  ...baseline.target, targetHash: 'f'.repeat(64),
}), /stale or forged/iu)
adversarialCases += 1

assert.throws(() => trackAllTargetSpecificationSchema.parse({
  ...baseline.target, rawChat: 'track the named person in every video',
}), /unrecognized key|invalid input/iu)
adversarialCases += 1

const { assignmentHash: _assignmentHash, ...publicCore } = baseline.assignment
void _assignmentHash
const staleManifestAssignment = createSkillAssignment({
  ...publicCore,
  manifestRef: { ...publicCore.manifestRef, manifestHash: 'e'.repeat(64) },
  contextArtifactRefs: [...publicCore.contextArtifactRefs],
  dependencyArtifactRefs: [...publicCore.dependencyArtifactRefs],
})
await assert.rejects(() => plugin.planAssignment({ assignment: staleManifestAssignment }), /stale or foreign assignment/iu)
adversarialCases += 1

const { assignmentHash: _specializedHash, ...specializedCore } = baseline.specializedAssignment
void _specializedHash
assert.throws(() => createTrackAllAssignment({
  ...specializedCore,
  authorizedWriteRange: { startFrameInclusive: 0, endFrameExclusive: 144, fps: 24 },
}), /write authority hash is stale or forged/iu)
adversarialCases += 1

assert.equal(runtime.pluginRegistry.resolve(manifestRef).manifest.manifestHash, manifestRef.manifestHash)
assert.equal(adversarialCases, 21)
console.log(JSON.stringify({
  status: 'ok', adversarialCases,
  baselineDisposition: baselinePlan.envelope.disposition,
  rangeExpansionDisposition: outsidePayload.decision,
  rawChatRejected: true,
  outsideAuthorizedRangeModified: false,
}))
