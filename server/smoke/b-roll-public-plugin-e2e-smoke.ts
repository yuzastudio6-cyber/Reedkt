import assert from 'node:assert/strict'

import {
  BROLL_CAPABILITY_MANIFEST,
  createBrollAssignment,
  createBrollPlanningContext,
  type BrollPlanningContext,
  type BrollSkillAssignment,
} from '../edit-skills/b-roll'
import {
  createEditSkillPlanApproval,
  createEditSkillWorkResult,
  type EditSkillWorkResult,
} from '../edit-skills/core'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { createSkillAssignment } from '../edit-skills/core/skill-range-authority'
import {
  editSkillArtifactStore,
  editSkillPluginRegistry,
} from '../edit-skills/registry'

const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const range = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
const scope = { ownerUserId: 'public-user', workspaceId: 'public-workspace', projectId: 'public-project' }

function brollContext(input: {
  assignmentId: string
  trackingRequired?: boolean
}): BrollPlanningContext {
  return createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ...scope,
    assignmentId: input.assignmentId,
    baseFootageStrength: input.trackingRequired ? 0.2 : 0.95,
    speakerEmotionImportance: input.trackingRequired ? 0.1 : 0.98,
    meaningfulVisualNeed: input.trackingRequired ? 0.95 : 0.2,
    userVisualPreference: 'minimal',
    claimSensitivity: 'none',
    generatedMediaWouldMislead: false,
    captionReservedZoneCount: 1,
    trackingRequired: input.trackingRequired ?? false,
    sourceCandidates: [],
    priorConceptKeys: [],
    confirmedAspectRatio: '16:9',
    uploadedVideoEditRegionEligible: true,
    referenceDnaDoNotCopyRules: ['Do not copy exact shots.'],
  })
}

async function createPublicAssignment(input: {
  assignmentId: string
  trackingRequired?: boolean
}) {
  const reason = 'Preserve the speaker-led emotional line.'
  const benefit = 'Keep the authentic speaker moment visible.'
  const context = brollContext(input)
  const contextRef = await editSkillArtifactStore.putJson({
    artifactType: 'b_roll_context_manifest_v1',
    value: context,
    ...scope,
  })
  const brollAssignment: BrollSkillAssignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: input.assignmentId,
    orchestrationRunId: `run-${input.assignmentId}`,
    ...scope,
    editSessionId: 'public-session',
    editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange),
    masterTimingRange: masterRange,
    segmentIds: ['segment-public'],
    sourceSequenceIds: [],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [contextRef],
    },
    writeRangeAuthority: { authorizedRange: range, outsideAuthorizedRangeModified: false },
    reason,
    pointToProveClarifyCoverOrSupport: 'support the emotional story',
    expectedViewerBenefit: benefit,
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not replace the speaker with generated proof.'],
    permittedSourceRoutes: ['use_no_broll'],
    providerPermission: 'forbidden',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: 120,
    maximumCredits: input.trackingRequired ? 10 : 0,
    requiredOutputTypes: ['b_roll_plan_v1'],
    manifestRef,
  })
  const assignmentRef = await editSkillArtifactStore.putJson({
    artifactType: 'b_roll_assignment_v1',
    value: brollAssignment,
    ...scope,
  })
  const assignment = createSkillAssignment({
    schemaVersion: 'edit-skill-assignment-v1',
    assignmentId: input.assignmentId,
    ...scope,
    editSessionId: 'public-session',
    planningRequestId: `request-${input.assignmentId}`,
    manifestRef,
    authorizedRange: range,
    reason,
    intendedViewerBenefit: benefit,
    editorialContext: 'Public B-roll plugin lifecycle qualification fixture.',
    visualOwnership: 'primary',
    contextArtifactRefs: [assignmentRef, contextRef],
    dependencyArtifactRefs: [],
    requestedBySkill: 'orchestra',
  })
  return { assignment, assignmentRef }
}

const plugin = editSkillPluginRegistry.resolve(manifestRef)
assert.equal(plugin.manifest.skillKey, 'b_roll')
assert.equal(plugin.manifest.manifestHash, manifestRef.manifestHash)

const fixture = await createPublicAssignment({ assignmentId: 'public-no-action' })
const plan = await plugin.planAssignment({ assignment: fixture.assignment })
assert.equal(plan.envelope.disposition, 'use_no_action')
assert.equal(plan.dependencyRequests.length, 0)
assert.equal(plan.payloadRef.artifactType, 'b_roll_plan_v1')
assert.equal(plan.evidenceRefs.length, 1)
assert.equal(plan.evidenceRefs[0]?.artifactType, 'b_roll_planning_qa_report_v1')

const approval = createEditSkillPlanApproval({
  schemaVersion: 'edit-skill-plan-approval-v1',
  assignmentId: fixture.assignment.assignmentId,
  assignmentHash: fixture.assignment.assignmentHash,
  planId: plan.envelope.planId,
  planHash: plan.envelope.planHash,
  manifestRef,
  authorizedRange: range,
  approved: true,
  approvedAt: '2026-08-03T12:00:00.000Z',
})
const workGraph = await plugin.compileApprovedWorkGraph({
  assignment: fixture.assignment,
  plan,
  approval,
})
assert.equal(workGraph.workItems.length, 3)
assert.deepEqual(
  workGraph.workItems.map((item) => item.jobType),
  ['validate_b_roll_assignment', 'validate_b_roll_range_authority', 'project_b_roll_result_receipt'],
)
assert.equal(workGraph.workItems.some((item) => item.workerClass === 'provider_worker'), false)

const projectedReceiptRef = await editSkillArtifactStore.putJson({
  artifactType: 'b_roll_result_receipt_v1',
  ...scope,
  value: {
    schemaVersion: 'b_roll_result_receipt_v1',
    ...scope,
    manifestRef,
    assignmentId: fixture.assignment.assignmentId,
    payload: {
      disposition: 'use_no_action',
      planHash: plan.envelope.planHash,
      approvedWorkGraphHash: workGraph.approvedWorkGraphHash,
    },
  },
})

const outputFor = (expectedOutputType: string) => {
  if (expectedOutputType === 'b_roll_assignment_v1') return fixture.assignmentRef
  if (expectedOutputType === 'b_roll_plan_v1') return plan.payloadRef
  return projectedReceiptRef
}
const workResults: EditSkillWorkResult[] = []
for (const item of workGraph.workItems) {
  const result = createEditSkillWorkResult({
    schemaVersion: 'edit-skill-work-result-v1',
    workItemKey: item.workItemKey,
    workItemHash: item.workItemHash,
    assignmentId: fixture.assignment.assignmentId,
    assignmentHash: fixture.assignment.assignmentHash,
    planId: plan.envelope.planId,
    planHash: plan.envelope.planHash,
    manifestRef,
    authorizedRange: range,
    operationId: item.operationId,
    workerClass: item.workerClass,
    status: 'succeeded',
    outputArtifactRefs: [outputFor(item.expectedOutputType)],
    qaLineageKeys: item.qaLineageKeys,
    qaEvidenceArtifactRefs: [plan.payloadRef],
    mutationRanges: [],
    callerSelectedExecutable: false,
    outsideAuthorizedRangeModified: false,
  })
  workResults.push(await plugin.validateWorkItemResult({
    assignment: fixture.assignment,
    plan,
    workGraph,
    result,
  }))
}

await assert.rejects(
  () => plugin.finalizeSkillResult({
    assignment: fixture.assignment,
    plan,
    workGraph,
    dependencyAcceptances: [],
    workItemResults: workResults.slice(0, -1),
  }),
  /one result for every exact approved work item/iu,
)

const validWorkResult = workResults[0]
const outOfRange = createEditSkillWorkResult({
  schemaVersion: validWorkResult.schemaVersion,
  workItemKey: validWorkResult.workItemKey,
  workItemHash: validWorkResult.workItemHash,
  assignmentId: validWorkResult.assignmentId,
  assignmentHash: validWorkResult.assignmentHash,
  planId: validWorkResult.planId,
  planHash: validWorkResult.planHash,
  manifestRef: validWorkResult.manifestRef,
  authorizedRange: validWorkResult.authorizedRange,
  operationId: validWorkResult.operationId,
  workerClass: validWorkResult.workerClass,
  status: validWorkResult.status,
  outputArtifactRefs: validWorkResult.outputArtifactRefs,
  qaLineageKeys: validWorkResult.qaLineageKeys,
  qaEvidenceArtifactRefs: validWorkResult.qaEvidenceArtifactRefs,
  mutationRanges: [{ startFrameInclusive: 0, endFrameExclusive: 10, fps: 24 }],
  callerSelectedExecutable: false,
  outsideAuthorizedRangeModified: false,
})
await assert.rejects(
  () => plugin.validateWorkItemResult({
    assignment: fixture.assignment,
    plan,
    workGraph,
    result: outOfRange,
  }),
  /outside the orchestra-authorized range/iu,
)

const receipt = await plugin.finalizeSkillResult({
  assignment: fixture.assignment,
  plan,
  workGraph,
  dependencyAcceptances: [],
  workItemResults: workResults,
})
assert.equal(receipt.envelope.disposition, 'use_no_action')
assert.equal(receipt.envelope.resultArtifactHash, projectedReceiptRef.sha256)
assert.equal(receipt.workItemResultHashes.length, workGraph.workItems.length)
assert.equal(receipt.dependencyAcceptanceHashes.length, 0)

const dependencyFixture = await createPublicAssignment({
  assignmentId: 'public-track-dependency',
  trackingRequired: true,
})
const dependencyPlan = await plugin.planAssignment({ assignment: dependencyFixture.assignment })
assert.equal(dependencyPlan.envelope.disposition, 'needs_other_skill')
assert.equal(dependencyPlan.dependencyRequests[0]?.dependencySkillKey, 'track_all')
assert.equal(dependencyPlan.dependencyRequests[0]?.requiredArtifactType, 'track_graph_v1')

const trackGraph = {
  schemaVersion: 'track_graph_v1' as const,
  modelNeutral: true as const,
  ...scope,
  sourceSha256: hashSkillValue({ source: 'public-track-fixture' }),
  fps: 24,
  tracks: [{
    trackId: 'track-public',
    startFrameInclusive: range.startFrameInclusive,
    endFrameExclusive: range.endFrameExclusive,
    samplesArtifactHash: hashSkillValue({ samples: 'public-track-fixture' }),
  }],
}
const trackGraphRef = await editSkillArtifactStore.putJson({
  artifactType: 'track_graph_v1',
  value: trackGraph,
  ...scope,
})
const dependencyAcceptance = await plugin.acceptDependencyArtifact({
  assignment: dependencyFixture.assignment,
  plan: dependencyPlan,
  request: dependencyPlan.dependencyRequests[0]!,
  artifactRef: trackGraphRef,
})
assert.equal(dependencyAcceptance.validatedArtifactHash, trackGraphRef.sha256)
assert.equal(dependencyAcceptance.productionQualified, false)

const foreignTrackGraphRef = await editSkillArtifactStore.putJson({
  artifactType: 'track_graph_v1',
  ownerUserId: scope.ownerUserId,
  workspaceId: 'foreign-workspace',
  projectId: scope.projectId,
  value: {
    ...trackGraph,
    workspaceId: 'foreign-workspace',
  },
})
await assert.rejects(
  () => plugin.acceptDependencyArtifact({
    assignment: dependencyFixture.assignment,
    plan: dependencyPlan,
    request: dependencyPlan.dependencyRequests[0]!,
    artifactRef: foreignTrackGraphRef,
  }),
  /cross-workspace/iu,
)

const staleAssignment = createSkillAssignment({
  schemaVersion: 'edit-skill-assignment-v1',
  assignmentId: 'stale-public-assignment',
  ...scope,
  editSessionId: 'public-session',
  planningRequestId: 'stale-public-request',
  manifestRef: { ...manifestRef, manifestHash: hashSkillValue({ stale: true }) },
  authorizedRange: range,
  reason: 'Stale assignment fixture.',
  intendedViewerBenefit: 'Prove stale manifest rejection.',
  editorialContext: 'Stale manifest fixture.',
  visualOwnership: 'primary',
  contextArtifactRefs: [],
  dependencyArtifactRefs: [],
  requestedBySkill: 'orchestra',
})
await assert.rejects(
  () => plugin.planAssignment({ assignment: staleAssignment }),
  /stale manifest reference/iu,
)

console.log(JSON.stringify({
  status: 'ok',
  skillKey: plugin.manifest.skillKey,
  manifestHash: plugin.manifest.manifestHash,
  publicPlanHash: plan.publicPlanHash,
  approvedWorkGraphHash: workGraph.approvedWorkGraphHash,
  resultReceiptHash: receipt.receiptHash,
  trackDependencyAcceptanceHash: dependencyAcceptance.acceptanceHash,
  privateMiniSkillImports: 0,
}, null, 2))
