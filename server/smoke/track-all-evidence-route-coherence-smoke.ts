import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  createEditSkillPlanApproval,
  hashSkillValue,
  skillManifestReference,
  type EditSkillArtifactReference,
} from '../edit-skills/core'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  createPrivacyPolicySnapshot,
  trackAllPlanSchema,
  trackAllPreflightObservationSchema,
  trackAllSam31RuntimeProfileV2Schema,
  trackAllWorkGraphArtifactSchema,
} from '../edit-skills/track-all'
import {
  TRACK_ALL_FIXTURE_SCOPE,
  createTrackAllAuthorityFixture,
  createTrackAllCaptionZonesFixture,
  createTrackAllPriorGraphFixture,
  createTrackAllPriorRepairEvidenceFixture,
  reviseTrackAllPublicAssignment,
} from './track-all-fixtures'

process.env.REEDITPRO_TRACK_ALL_QUALIFICATION_GENERATING = '1'
process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING = '1'
const { createInternalFixtureEditSkillRuntime } = await import(
  '../edit-skills/internal-fixture-runtime'
)
const runtime = createInternalFixtureEditSkillRuntime()
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const plugin = runtime.pluginRegistry.resolve(manifestRef)
const scope = TRACK_ALL_FIXTURE_SCOPE

async function plan(input: Parameters<typeof createTrackAllAuthorityFixture>[0]) {
  const fixture = await createTrackAllAuthorityFixture(input)
  const publicPlan = await plugin.planAssignment({ assignment: fixture.assignment })
  const value = trackAllPlanSchema.parse(await runtime.artifactStore.readJson({
    reference: publicPlan.payloadRef,
    ...scope,
  }))
  return { fixture, publicPlan, plan: value }
}

const missing = await plan({
  runtime,
  assignmentId: 'route-coherence-missing-preflight',
  requestedJobType: 'track_all.track_planar_region',
  intendedTreatment: 'planar_geometry',
  targetType: 'planar_region',
  includePreflightObservation: false,
})
assert.equal(missing.plan.decision, 'needs_preflight_observation')
assert.equal(missing.publicPlan.envelope.disposition, 'needs_other_skill')
assert.equal(missing.publicPlan.dependencyRequests[0]?.requiredArtifactType,
  'track_all_preflight_observation_v1')
assert.equal(missing.plan.samWorkPlanned, false)
assert.equal(missing.plan.creditEstimate.expectedCredits, 0)

const lowRisk = await plan({
  runtime,
  assignmentId: 'route-coherence-low-risk',
  requestedJobType: 'track_all.track_planar_region',
  intendedTreatment: 'planar_geometry',
  targetType: 'planar_region',
  authorizedRange: { startFrameInclusive: 0, endFrameExclusive: 960, fps: 24 },
  analysisContextRange: { startFrameInclusive: 0, endFrameExclusive: 960, fps: 24 },
  preflightRisk: 0.1,
})
const highRisk = await plan({
  runtime,
  assignmentId: 'route-coherence-high-risk',
  requestedJobType: 'track_all.track_planar_region',
  intendedTreatment: 'planar_geometry',
  targetType: 'planar_region',
  authorizedRange: { startFrameInclusive: 0, endFrameExclusive: 960, fps: 24 },
  analysisContextRange: { startFrameInclusive: 0, endFrameExclusive: 960, fps: 24 },
  preflightRisk: 0.9,
})
assert.ok(lowRisk.plan.preflightDerivedRisks)
assert.ok(highRisk.plan.preflightDerivedRisks)
assert.ok(highRisk.plan.preflightDerivedRisks.expectedRepairRisk >
  lowRisk.plan.preflightDerivedRisks.expectedRepairRisk)
assert.ok(highRisk.plan.preflightDerivedRisks.expectedRepairCredits >
  lowRisk.plan.preflightDerivedRisks.expectedRepairCredits)
assert.ok(highRisk.plan.chunkPlan.chunks[0]!.overlapFramesAfter >
  lowRisk.plan.chunkPlan.chunks[0]!.overlapFramesAfter)

const preflightRef = highRisk.fixture.refs.preflight!
const preflight = trackAllPreflightObservationSchema.parse(
  await runtime.artifactStore.readJson({ reference: preflightRef, ...scope }),
)
assert.throws(() => trackAllPreflightObservationSchema.parse({
  ...preflight,
  candidateFrames: preflight.candidateFrames.map((candidate, index) =>
    index === 0 ? { ...candidate, targetMotion: 0 } : candidate),
}), /stale or forged/iu)

const profileRef = highRisk.publicPlan.evidenceRefs.find((reference) =>
  reference.artifactType === 'track_all_sam3_1_runtime_profile_v2')!
const profile = trackAllSam31RuntimeProfileV2Schema.parse(
  await runtime.artifactStore.readJson({ reference: profileRef, ...scope }),
)
assert.equal(profile.maximumFramesPerSession,
  highRisk.plan.chunkPlan.maximumFramesPerChunk)
assert.equal(profile.maximumObjectsPerBucket,
  highRisk.plan.objectBudget.bucketSize)
assert.equal(profile.qualification.status, 'blocked')
assert.equal(profile.qualification.internalExecutionAuthorized, false)
assert.throws(() => trackAllSam31RuntimeProfileV2Schema.parse({
  ...profile,
  maximumFramesPerSession: profile.maximumFramesPerSession + 1,
}), /stale or forged/iu)

const blockedSam = await compile({
  assignmentId: 'route-coherence-blocked-sam',
  requestedJobType: 'track_all.produce_selected_target_graph',
  intendedTreatment: 'geometry_only',
})
assert.equal(blockedSam.plan.decision, 'blocked_external_sam_prerequisites')
assert.equal(blockedSam.plan.blockedRouteReceiptHash,
  blockedSam.plan.routeQualificationReceiptHash)
assert.ok(blockedSam.plan.missingRouteGateKeys.length > 0)

const noAction = await compile({ assignmentId: 'route-coherence-no-action' })
const planar = await compile({
  assignmentId: 'route-coherence-planar',
  requestedJobType: 'track_all.track_planar_region',
  intendedTreatment: 'planar_geometry',
  targetType: 'planar_region',
})
const privacy = await compileExistingTreatment('privacy_redaction')
const focus = await compileExistingTreatment('tracked_focus')
const reframe = await compileExistingTreatment('tracked_reframe')
const repair = await compileRepair()
for (const scenario of [blockedSam, noAction, planar, privacy, focus, reframe, repair]) {
  assert.equal(scenario.graph.atomicWorkItems.some((item) =>
    item.createsGpuWork || item.operationId === 'tool.sam3_1.track_masklets.v2'), false)
  const projections = scenario.graph.atomicWorkItems.filter((item) =>
    item.stageId === 'project_track_all_result')
  assert.equal(projections.length, 1)
  assert.equal(projections[0]!.parentJobType, 'track_all.project_result')
}
const projectionIndex = planar.graph.atomicWorkItems.findIndex((item) =>
  item.stageId === 'project_track_all_result')
const projection = planar.graph.atomicWorkItems[projectionIndex]!
const { workItemHash: _projectionHash, ...projectionCore } = projection
void _projectionHash
const forgedProjectionCore = {
  ...projectionCore,
  parentJobType: 'track_all.no_action',
}
const forgedProjection = {
  ...forgedProjectionCore,
  workItemHash: hashSkillValue(forgedProjectionCore),
}
const { artifactHash: _graphHash, ...graphCore } = planar.graph
void _graphHash
const forgedItems = graphCore.atomicWorkItems.map((item, index) =>
  index === projectionIndex ? forgedProjection : item)
const forgedGraphCore = {
  ...graphCore,
  atomicWorkItems: forgedItems,
  workItemHashes: forgedItems.map((item) => item.workItemHash),
}
assert.throws(() => trackAllWorkGraphArtifactSchema.parse({
  ...forgedGraphCore,
  artifactHash: hashSkillValue(forgedGraphCore),
}), /result projection uses the wrong public parent|no-action parent/iu)
assert.equal(privacy.plan.samWorkPlanned, false)
assert.equal(focus.plan.samWorkPlanned, false)
assert.equal(reframe.plan.samWorkPlanned, false)
assert.equal(repair.plan.samWorkPlanned, false)
assert.equal(planar.plan.samWorkPlanned, false)

const compilerSource = await readFile(
  new URL('../edit-skills/track-all/track-all-plan-compiler.ts', import.meta.url),
  'utf8',
)
assert.doesNotMatch(compilerSource, /qualifiedMaximumFrames:\s*240/u)
assert.doesNotMatch(compilerSource, /bucketSize:\s*16/u)
assert.doesNotMatch(compilerSource, /targetSpeed:\s*0\.5/u)
assert.doesNotMatch(compilerSource, /cameraMotionRisk:\s*0\.5/u)

console.log(JSON.stringify({
  status: 'ok',
  preflightDependencyTyped: true,
  measuredRiskChangesOverlapAndRepairCost: true,
  forgedPreflightRejected: true,
  forgedProfileRejected: true,
  samProfileHash: profile.profileHash,
  blockedSamReceiptHash: blockedSam.plan.blockedRouteReceiptHash,
  blockedSamMissingGateCount: blockedSam.plan.missingRouteGateKeys.length,
  routeCoherentGraphCount: 7,
  samOrGpuWorkItemsAcrossBlockedAndDeterministicRoutes: 0,
  resultProjectionUsesDedicatedJob: true,
  hardcodedDynamicPlanningValues: 0,
}))

async function compile(
  input: Omit<Parameters<typeof createTrackAllAuthorityFixture>[0], 'runtime'>,
  extraContextRefs: readonly EditSkillArtifactReference[] = [],
) {
  const fixture = await createTrackAllAuthorityFixture({ runtime, ...input })
  const assignment = extraContextRefs.length === 0
    ? fixture.assignment
    : reviseTrackAllPublicAssignment(fixture.assignment, [
      ...fixture.assignment.contextArtifactRefs,
      ...extraContextRefs,
    ])
  return compileFixture(fixture, assignment)
}

async function compileFixture(
  fixture: Awaited<ReturnType<typeof createTrackAllAuthorityFixture>>,
  assignment: typeof fixture.assignment,
) {
  const publicPlan = await plugin.planAssignment({ assignment })
  const planValue = trackAllPlanSchema.parse(await runtime.artifactStore.readJson({
    reference: publicPlan.payloadRef,
    ...scope,
  }))
  const approval = createEditSkillPlanApproval({
    schemaVersion: 'edit-skill-plan-approval-v1',
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    planId: publicPlan.envelope.planId,
    planHash: publicPlan.envelope.planHash,
    manifestRef,
    authorizedRange: assignment.authorizedRange,
    approved: true,
    approvedAt: '2026-08-04T00:00:00.000Z',
  })
  const approved = await plugin.compileApprovedWorkGraph({
    assignment,
    plan: publicPlan,
    approval,
  })
  const graph = trackAllWorkGraphArtifactSchema.parse(
    await runtime.artifactStore.readJson({
      reference: approved.pluginWorkGraphRef!,
      ...scope,
    }),
  )
  return { fixture, assignment, publicPlan, plan: planValue, graph }
}

async function compileExistingTreatment(
  treatment: 'privacy_redaction' | 'tracked_focus' | 'tracked_reframe',
) {
  const assignmentId = `route-coherence-${treatment}`
  const graphRef = await createTrackAllPriorGraphFixture({
    runtime,
    nextAssignmentId: assignmentId,
  })
  const fixture = await createTrackAllAuthorityFixture({
    runtime,
    assignmentId,
    requestedJobType: `track_all.${treatment === 'tracked_focus'
      ? 'apply_tracked_focus'
      : treatment === 'tracked_reframe'
        ? 'prepare_tracked_reframe'
        : 'apply_privacy_redaction'}`,
    intendedTreatment: treatment,
    priorTrackGraphRefs: [graphRef],
    ...(treatment === 'privacy_redaction' ? {
      privacyClassification: 'high_assurance' as const,
      targetCriticality: 'privacy_critical' as const,
      privacyCriticality: 'high' as const,
    } : {}),
  })
  const extras: EditSkillArtifactReference[] = [graphRef]
  if (treatment === 'privacy_redaction') {
    const policy = createPrivacyPolicySnapshot({
      schemaVersion: 'privacy_policy_snapshot_v1',
      ...scope,
      policyVersion: 1,
      failClosed: true,
      allowedTreatments: [
        'gaussian_blur', 'pixelate', 'mosaic', 'solid_fill',
        'conservative_region_cover', 'tracked_crop_exclusion',
      ],
    })
    extras.push(await runtime.artifactStore.putJson({
      artifactType: 'privacy_policy_snapshot_v1', value: policy, ...scope,
    }))
  }
  if (treatment === 'tracked_reframe') extras.push(
    await createTrackAllCaptionZonesFixture({
      runtime,
      assignment: fixture.assignment,
      specializedAssignmentHash: fixture.specializedAssignment.assignmentHash,
    }),
  )
  const assignment = reviseTrackAllPublicAssignment(fixture.assignment, [
    ...fixture.assignment.contextArtifactRefs,
    ...extras,
  ])
  return compileFixture(fixture, assignment)
}

async function compileRepair() {
  const assignmentId = 'route-coherence-repair'
  const graphRef = await createTrackAllPriorGraphFixture({
    runtime,
    nextAssignmentId: assignmentId,
  })
  const fixture = await createTrackAllAuthorityFixture({
    runtime,
    assignmentId,
    requestedJobType: 'track_all.repair_track',
    intendedTreatment: 'repair',
    targetType: 'existing_track',
    groundingKind: 'existing_track_reference',
    groundingArtifactRef: graphRef,
    priorTrackGraphRefs: [graphRef],
  })
  const repairRef = await createTrackAllPriorRepairEvidenceFixture({
    runtime, fixture, trackGraphRef: graphRef,
  })
  const assignment = reviseTrackAllPublicAssignment(fixture.assignment, [
    ...fixture.assignment.contextArtifactRefs,
    graphRef,
    repairRef,
  ])
  return compileFixture(fixture, assignment)
}
