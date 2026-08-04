import assert from 'node:assert/strict'

import {
  BROLL_CAPABILITY_MANIFEST,
  assertBrollVisualIntelligenceCandidateQa,
  createBrollMasterTimingPlan,
  createBrollPublicContextManifest,
  createBrollSourceInventory,
  createBrollVisualOwnershipManifest,
  createBrollVisualIntelligenceCandidateQa,
  createBrollAssignment,
  createBrollPlanningContext,
  type BrollPlanningContext,
  type BrollSourceCandidate,
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
} from '../edit-skills/internal-fixture-runtime'

const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const range = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
const scope = { ownerUserId: 'public-user', workspaceId: 'public-workspace', projectId: 'public-project' }

function brollContext(input: {
  assignmentId: string
  trackingRequired?: boolean
  generated?: boolean
}): BrollPlanningContext {
  return createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ...scope,
    assignmentId: input.assignmentId,
    baseFootageStrength: input.generated || input.trackingRequired ? 0.2 : 0.95,
    speakerEmotionImportance: input.generated || input.trackingRequired ? 0.1 : 0.98,
    meaningfulVisualNeed: input.generated || input.trackingRequired ? 0.95 : 0.2,
    userVisualPreference: input.generated ? 'balanced' : 'minimal',
    claimSensitivity: input.generated ? 'supporting' : 'none',
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

function reviseContext(
  context: BrollPlanningContext,
  overrides: Partial<Omit<BrollPlanningContext, 'contextHash'>>,
): BrollPlanningContext {
  const { contextHash: _contextHash, ...core } = context
  void _contextHash
  return createBrollPlanningContext({ ...core, ...overrides })
}

async function createPublicAssignment(input: {
  assignmentId: string
  trackingRequired?: boolean
  generated?: boolean
  tamper?:
    | 'wrong_edit_session'
    | 'wrong_assignment'
    | 'wrong_manifest'
    | 'stale_timing'
    | 'timing_outside_assignment'
    | 'source_absent_from_inventory'
    | 'ownership_conflict'
}) {
  const reason = input.generated
    ? 'Clarify the product workflow with one restrained illustrative cutaway.'
    : 'Preserve the speaker-led emotional line.'
  const benefit = input.generated
    ? 'Understand the workflow without treating generated media as proof.'
    : 'Keep the authentic speaker moment visible.'
  const absentSourceCandidate: BrollSourceCandidate = {
    sourceId: 'source-absent-from-inventory',
    sourceType: 'existing_project_clip',
    artifactRef: {
      artifactType: 'source_media_artifact_v1',
      sha256: hashSkillValue({ fixture: input.assignmentId, source: 'absent' }),
      byteLength: 100,
      ...scope,
    },
    sourceRange: { startFrameInclusive: 24, endFrameExclusive: 96, fps: 24 },
    semanticRelevance: 0.95,
    visualQuality: 0.9,
    temporalFit: 0.9,
    storyContinuity: 0.9,
    provenanceVerified: true,
    rightsApproved: true,
    privacyApproved: true,
    proofSafe: true,
    repetitionRisk: 0,
    cropFeasibility: 0.9,
    speakerActionProtection: 0.9,
    audioUsefulness: 0.5,
    costCredits: 1,
    approvedByUser: true,
  }
  const baseContext = brollContext(input)
  const context = input.tamper === 'source_absent_from_inventory'
    ? reviseContext(baseContext, { sourceCandidates: [absentSourceCandidate] })
    : input.tamper === 'ownership_conflict'
      ? reviseContext(baseContext, { primaryVisualOwner: 'graphic_design' })
      : baseContext
  const authorityManifestRef = input.tamper === 'wrong_manifest'
    ? { ...manifestRef, manifestHash: '0'.repeat(64) }
    : manifestRef
  const sourceInventory = createBrollSourceInventory({
    schemaVersion: 'source_inventory_v1',
    ...scope,
    editSessionId: input.tamper === 'wrong_edit_session' ? 'wrong-session' : 'public-session',
    assignmentId: input.tamper === 'wrong_assignment' ? 'wrong-assignment' : input.assignmentId,
    editPlanVersion: 1,
    manifestRef: authorityManifestRef,
    candidates: input.tamper === 'source_absent_from_inventory' ? [] : [...context.sourceCandidates],
  })
  const sourceInventoryRef = await editSkillArtifactStore.putJson({
    artifactType: 'source_inventory_v1',
    value: sourceInventory,
    ...scope,
  })
  const masterTiming = createBrollMasterTimingPlan({
    schemaVersion: 'master_timing_plan_v1',
    ...scope,
    editSessionId: 'public-session',
    assignmentId: input.assignmentId,
    editPlanVersion: 1,
    manifestRef,
    fps: range.fps,
    timelineRange: masterRange,
    assignmentRange: input.tamper === 'timing_outside_assignment'
      ? { startFrameInclusive: 0, endFrameExclusive: 72, fps: 24 }
      : range,
  })
  const masterTimingRef = await editSkillArtifactStore.putJson({
    artifactType: 'master_timing_plan_v1',
    value: masterTiming,
    ...scope,
  })
  const visualOwnership = createBrollVisualOwnershipManifest({
    schemaVersion: 'visual_ownership_manifest_v1',
    ...scope,
    editSessionId: 'public-session',
    assignmentId: input.assignmentId,
    editPlanVersion: 1,
    manifestRef,
    assignmentRange: range,
    requestedOwnership: 'primary',
    ownershipWindows: input.tamper === 'ownership_conflict' ? [{
      ownerSkillKey: 'graphic_design',
      ownership: 'primary',
      exclusive: true,
      frameRange: range,
      lockedEvidenceFootage: false,
      deliberateHeroVisual: true,
      captionSafeAreaReserved: false,
      transitionBoundaryOwned: false,
    }] : [],
  })
  const visualOwnershipRef = await editSkillArtifactStore.putJson({
    artifactType: 'visual_ownership_manifest_v1',
    value: visualOwnership,
    ...scope,
  })
  const brollAssignment: BrollSkillAssignment = createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: input.assignmentId,
    orchestrationRunId: `run-${input.assignmentId}`,
    ...scope,
    editSessionId: 'public-session',
    editPlanVersion: 1,
    masterTimingHash: input.tamper === 'stale_timing' ? 'f'.repeat(64) : masterTiming.timingHash,
    masterTimingRange: masterRange,
    segmentIds: ['segment-public'],
    sourceSequenceIds: [],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [sourceInventoryRef, masterTimingRef, visualOwnershipRef],
    },
    writeRangeAuthority: { authorizedRange: range, outsideAuthorizedRangeModified: false },
    reason,
    pointToProveClarifyCoverOrSupport: input.generated
      ? 'clarify the product workflow'
      : 'support the emotional story',
    expectedViewerBenefit: benefit,
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not replace the speaker with generated proof.'],
    permittedSourceRoutes: input.generated
      ? ['generate_with_gemini_omni', 'use_no_broll']
      : ['use_no_broll'],
    providerPermission: input.generated ? 'approved_within_ceiling' : 'forbidden',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: input.generated ? 600 : 120,
    maximumCredits: input.generated ? 100 : input.trackingRequired ? 10 : 0,
    requiredOutputTypes: ['b_roll_plan_v1'],
    manifestRef,
  })
  const assignmentRef = await editSkillArtifactStore.putJson({
    artifactType: 'b_roll_assignment_v1',
    value: brollAssignment,
    ...scope,
  })
  const contextManifest = createBrollPublicContextManifest({
    context,
    editSessionId: 'public-session',
    editPlanVersion: 1,
    manifestRef,
    assignmentRef,
    sourceInventoryRef,
    masterTimingRef,
    visualOwnershipRef,
  })
  const contextRef = await editSkillArtifactStore.putJson({
    artifactType: 'b_roll_context_manifest_v1',
    value: contextManifest,
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
    contextArtifactRefs: [
      assignmentRef,
      contextRef,
      sourceInventoryRef,
      masterTimingRef,
      visualOwnershipRef,
    ],
    dependencyArtifactRefs: [],
    requestedBySkill: 'orchestra',
  })
  return {
    assignment,
    assignmentRef,
    contextRef,
    sourceInventoryRef,
    masterTimingRef,
    visualOwnershipRef,
  }
}

function revisePublicAssignment(
  assignment: ReturnType<typeof createSkillAssignment>,
  contextArtifactRefs: ReturnType<typeof createSkillAssignment>['contextArtifactRefs'],
) {
  const { assignmentHash: _assignmentHash, ...core } = assignment
  void _assignmentHash
  return createSkillAssignment({
    ...core,
    contextArtifactRefs: [...contextArtifactRefs],
    dependencyArtifactRefs: [...assignment.dependencyArtifactRefs],
  })
}

const plugin = editSkillPluginRegistry.resolve(manifestRef)
assert.equal(plugin.manifest.skillKey, 'b_roll')
assert.equal(plugin.manifest.manifestHash, manifestRef.manifestHash)

const fixture = await createPublicAssignment({ assignmentId: 'public-no-action' })
const plan = await plugin.planAssignment({ assignment: fixture.assignment })
assert.equal(plan.envelope.disposition, 'use_no_action')
assert.equal(plan.dependencyRequests.length, 0)
assert.equal(plan.payloadRef.artifactType, 'b_roll_plan_v1')
assert.equal(plan.evidenceRefs.length, 6)
assert.equal(plan.evidenceRefs[0]?.artifactType, 'b_roll_planning_qa_report_v1')

let requiredInputAdversarialCases = 0
for (const artifactType of [
  'b_roll_assignment_v1',
  'b_roll_context_manifest_v1',
  'source_inventory_v1',
  'master_timing_plan_v1',
  'visual_ownership_manifest_v1',
]) {
  const missing = revisePublicAssignment(
    fixture.assignment,
    fixture.assignment.contextArtifactRefs.filter((reference) =>
      reference.artifactType !== artifactType),
  )
  await assert.rejects(
    () => plugin.planAssignment({ assignment: missing }),
    /requires 1-1/iu,
  )
  requiredInputAdversarialCases += 1
}

const duplicateContext = revisePublicAssignment(fixture.assignment, [
  ...fixture.assignment.contextArtifactRefs,
  fixture.contextRef,
])
await assert.rejects(
  () => plugin.planAssignment({ assignment: duplicateContext }),
  /duplicate context artifact/iu,
)
requiredInputAdversarialCases += 1

for (const [scopeKey, scopeValue] of [
  ['ownerUserId', 'foreign-user'],
  ['workspaceId', 'foreign-workspace'],
  ['projectId', 'foreign-project'],
] as const) {
  const foreignRef = { ...fixture.contextRef, [scopeKey]: scopeValue }
  const foreign = revisePublicAssignment(
    fixture.assignment,
    fixture.assignment.contextArtifactRefs.map((reference) =>
      reference.artifactType === 'b_roll_context_manifest_v1' ? foreignRef : reference),
  )
  await assert.rejects(
    () => plugin.planAssignment({ assignment: foreign }),
    /cross-workspace artifact/iu,
  )
  requiredInputAdversarialCases += 1
}

const staleTimingRef = { ...fixture.masterTimingRef, sha256: '0'.repeat(64) }
const staleContent = revisePublicAssignment(
  fixture.assignment,
  fixture.assignment.contextArtifactRefs.map((reference) =>
    reference.artifactType === 'master_timing_plan_v1' ? staleTimingRef : reference),
)
await assert.rejects(
  () => plugin.planAssignment({ assignment: staleContent }),
  /artifact was not found|integrity/iu,
)
requiredInputAdversarialCases += 1

await assert.rejects(
  () => editSkillArtifactStore.putJson({
    artifactType: 'master_timing_plan_v1',
    ...scope,
    value: { schemaVersion: 'master_timing_plan_v0' },
  }),
  /invalid input|schemaVersion|expected/iu,
)
requiredInputAdversarialCases += 1

for (const [tamper, message] of [
  ['wrong_edit_session', /edit-session/iu],
  ['wrong_assignment', /assignment/iu],
  ['wrong_manifest', /manifest/iu],
  ['stale_timing', /master timing/iu],
  ['timing_outside_assignment', /master timing/iu],
  ['source_absent_from_inventory', /source candidates differ/iu],
  ['ownership_conflict', /exclusive primary owner/iu],
] as const) {
  const invalid = await createPublicAssignment({
    assignmentId: `public-input-${tamper}`,
    tamper,
  })
  await assert.rejects(
    () => plugin.planAssignment({ assignment: invalid.assignment }),
    message,
  )
  requiredInputAdversarialCases += 1
}

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
  assignmentId: dependencyFixture.assignment.assignmentId,
  assignmentHash: dependencyFixture.assignment.assignmentHash,
  authorizedRange: range,
  authorizedRangeHash: hashSkillValue(range),
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
await assert.rejects(() => editSkillArtifactStore.putJson({
  artifactType: 'track_graph_v1',
  value: { ...trackGraph, trackingModel: 'sam2' },
  ...scope,
}))
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

const generatedFixture = await createPublicAssignment({
  assignmentId: 'public-generated-visual-intelligence',
  generated: true,
})
const generatedPlan = await plugin.planAssignment({ assignment: generatedFixture.assignment })
assert.equal(generatedPlan.envelope.disposition, 'use_skill')
assert.equal(generatedPlan.dependencyRequests.length, 1)
const visualIntelligenceRequest = generatedPlan.dependencyRequests[0]!
assert.equal(visualIntelligenceRequest.dependencySkillKey, 'visual_intelligence')
assert.equal(
  visualIntelligenceRequest.requiredArtifactType,
  'visual_intelligence_candidate_qa_v1',
)
assert.equal(visualIntelligenceRequest.requiredForPhase, 'skill_output_qa')
const generatedApproval = createEditSkillPlanApproval({
  schemaVersion: 'edit-skill-plan-approval-v1',
  assignmentId: generatedFixture.assignment.assignmentId,
  assignmentHash: generatedFixture.assignment.assignmentHash,
  planId: generatedPlan.envelope.planId,
  planHash: generatedPlan.envelope.planHash,
  manifestRef,
  authorizedRange: range,
  approved: true,
  approvedAt: '2026-08-03T12:05:00.000Z',
})
const generatedWorkGraph = await plugin.compileApprovedWorkGraph({
  assignment: generatedFixture.assignment,
  plan: generatedPlan,
  approval: generatedApproval,
})
const providerWorkItem = generatedWorkGraph.workItems.find((item) =>
  item.jobType === 'generate_b_roll_candidate')
assert.ok(providerWorkItem)
const candidateArtifactRef = await editSkillArtifactStore.putJson({
  artifactType: 'provider_b_roll_candidate_video_mp4',
  ...scope,
  value: {
    schemaVersion: 'provider_b_roll_candidate_video_mp4',
    ...scope,
    manifestRef,
    assignmentId: generatedFixture.assignment.assignmentId,
    payload: {
      candidateId: 'candidate-public-generated-v1',
      privateInternalOnly: true,
      providerRequestCount: 0,
    },
  },
})
const providerWorkResult = createEditSkillWorkResult({
  schemaVersion: 'edit-skill-work-result-v1',
  workItemKey: providerWorkItem.workItemKey,
  workItemHash: providerWorkItem.workItemHash,
  assignmentId: generatedFixture.assignment.assignmentId,
  assignmentHash: generatedFixture.assignment.assignmentHash,
  planId: generatedPlan.envelope.planId,
  planHash: generatedPlan.envelope.planHash,
  manifestRef,
  authorizedRange: range,
  operationId: providerWorkItem.operationId,
  workerClass: providerWorkItem.workerClass,
  status: 'succeeded',
  outputArtifactRefs: [candidateArtifactRef],
  qaLineageKeys: providerWorkItem.qaLineageKeys,
  qaEvidenceArtifactRefs: [generatedPlan.payloadRef],
  mutationRanges: [],
  callerSelectedExecutable: false,
  outsideAuthorizedRangeModified: false,
})
const dependencyReceipt = await plugin.finalizeSkillResult({
  assignment: generatedFixture.assignment,
  plan: generatedPlan,
  workGraph: generatedWorkGraph,
  dependencyAcceptances: [],
  workItemResults: [providerWorkResult],
})
assert.equal(dependencyReceipt.envelope.disposition, 'needs_other_skill')
assert.equal(dependencyReceipt.envelope.resultArtifactHash, candidateArtifactRef.sha256)

const findingEvidenceHash = hashSkillValue({
  candidateArtifactHash: candidateArtifactRef.sha256,
  evidence: 'public-visual-intelligence-fixture',
})
const passingFinding = {
  disposition: 'pass' as const,
  summary: 'Independent candidate evidence satisfies this semantic check.',
  confidenceMillionths: 950_000,
  evidenceArtifactHashes: [findingEvidenceHash],
}
function candidateQa(input: {
  candidateArtifact?: typeof candidateArtifactRef
  ownerUserId?: string
  workspaceId?: string
  projectId?: string
  assignmentId?: string
  assignmentHash?: string
  planHash?: string
  authorizedRange?: typeof range
  productionQualificationStatus?: 'planning_qualified' | 'internal_execution_qualified' | 'production_qualified'
  contentSafetyDisposition?: 'pass' | 'blocking'
} = {}) {
  const candidateArtifact = input.candidateArtifact ?? candidateArtifactRef
  const authorizedRange = input.authorizedRange ?? range
  const contentSafetyDisposition = input.contentSafetyDisposition ?? 'pass'
  return createBrollVisualIntelligenceCandidateQa({
    schemaVersion: 'visual_intelligence_candidate_qa_v1',
    candidateArtifact,
    candidateArtifactId: 'candidate-public-generated-v1',
    ownerUserId: input.ownerUserId ?? scope.ownerUserId,
    workspaceId: input.workspaceId ?? scope.workspaceId,
    projectId: input.projectId ?? scope.projectId,
    assignmentId: input.assignmentId ?? generatedFixture.assignment.assignmentId,
    assignmentHash: input.assignmentHash ?? generatedFixture.assignment.assignmentHash,
    planId: generatedPlan.envelope.planId,
    planHash: input.planHash ?? generatedPlan.envelope.planHash,
    authorizedRange,
    authorizedRangeHash: hashSkillValue(authorizedRange),
    semanticAlignment: passingFinding,
    subjectObjectConsistency: passingFinding,
    motionPlausibility: passingFinding,
    cameraIntentAlignment: passingFinding,
    cropSafety: passingFinding,
    contentSafety: {
      ...passingFinding,
      disposition: contentSafetyDisposition,
      summary: contentSafetyDisposition === 'blocking'
        ? 'Independent candidate evidence found a blocking content-safety issue.'
        : passingFinding.summary,
    },
    proofMisrepresentationCheck: passingFinding,
    visualDefectFindings: [],
    confidenceMillionths: 950_000,
    uncertainty: null,
    evidenceFrameTimeReferences: [{
      masterFrameIndex: authorizedRange.startFrameInclusive,
      timeMicroseconds: Math.round(authorizedRange.startFrameInclusive / authorizedRange.fps * 1_000_000),
      evidenceArtifactHash: findingEvidenceHash,
    }],
    producerIdentity: {
      producerKind: 'model_neutral_edit_skill_plugin',
      producerSkillKey: 'visual_intelligence',
      providerOrModelIdentityExposed: false,
    },
    producerSkillManifestRef: {
      schemaVersion: 'external-skill-manifest-reference-v1',
      skillKey: 'visual_intelligence',
      skillVersion: '1.0.0',
      contractVersion: 'visual-intelligence-candidate-qa-v1',
      manifestHash: hashSkillValue({ manifest: 'visual-intelligence-fixture-v1' }),
    },
    productionQualificationStatus:
      input.productionQualificationStatus ?? 'internal_execution_qualified',
    disposition: contentSafetyDisposition === 'blocking' ? 'blocked' : 'accepted',
    injectedTestOnly: false,
  })
}
async function putCandidateQa(value: ReturnType<typeof candidateQa>, artifactScope = scope) {
  return editSkillArtifactStore.putJson({
    artifactType: 'visual_intelligence_candidate_qa_v1',
    ...artifactScope,
    value,
  })
}

const validCandidateQaRef = await putCandidateQa(candidateQa())
assert.throws(() => assertBrollVisualIntelligenceCandidateQa({
  artifact: candidateQa(),
  assignment: generatedFixture.assignment,
  plan: generatedPlan,
  request: visualIntelligenceRequest,
  candidateArtifact: candidateArtifactRef,
  requireProduction: true,
}), /under-qualified/iu)
const visualIntelligenceAcceptance = await plugin.acceptDependencyArtifact({
  assignment: generatedFixture.assignment,
  plan: generatedPlan,
  request: visualIntelligenceRequest,
  artifactRef: validCandidateQaRef,
  workGraph: generatedWorkGraph,
  relatedWorkItemResult: providerWorkResult,
})
assert.equal(visualIntelligenceAcceptance.productionQualified, false)

const blockedCandidateQaRef = await putCandidateQa(candidateQa({
  contentSafetyDisposition: 'blocking',
}))
await assert.rejects(
  () => plugin.acceptDependencyArtifact({
    assignment: generatedFixture.assignment,
    plan: generatedPlan,
    request: visualIntelligenceRequest,
    artifactRef: blockedCandidateQaRef,
    workGraph: generatedWorkGraph,
    relatedWorkItemResult: providerWorkResult,
  }),
  /under-qualified|stale|candidate-mismatched/iu,
)

const mismatchedCandidateQaRef = await putCandidateQa(candidateQa({
  candidateArtifact: {
    ...candidateArtifactRef,
    sha256: hashSkillValue({ candidate: 'substituted' }),
  },
}))
await assert.rejects(
  () => plugin.acceptDependencyArtifact({
    assignment: generatedFixture.assignment,
    plan: generatedPlan,
    request: visualIntelligenceRequest,
    artifactRef: mismatchedCandidateQaRef,
    workGraph: generatedWorkGraph,
    relatedWorkItemResult: providerWorkResult,
  }),
  /candidate-mismatched/iu,
)
for (const invalidQa of [
  candidateQa({ assignmentHash: hashSkillValue({ assignment: 'wrong' }) }),
  candidateQa({ planHash: hashSkillValue({ plan: 'wrong' }) }),
  candidateQa({
    authorizedRange: { startFrameInclusive: 121, endFrameExclusive: 192, fps: 24 },
  }),
  candidateQa({ productionQualificationStatus: 'planning_qualified' }),
]) {
  const invalidQaRef = await putCandidateQa(invalidQa)
  await assert.rejects(
    () => plugin.acceptDependencyArtifact({
      assignment: generatedFixture.assignment,
      plan: generatedPlan,
      request: visualIntelligenceRequest,
      artifactRef: invalidQaRef,
      workGraph: generatedWorkGraph,
      relatedWorkItemResult: providerWorkResult,
    }),
    /under-qualified|stale|range|assignment|candidate-mismatched/iu,
  )
}

const foreignScope = { ...scope, workspaceId: 'foreign-visual-workspace' }
const foreignCandidateRef = { ...candidateArtifactRef, ...foreignScope }
const foreignQaRef = await putCandidateQa(candidateQa({
  candidateArtifact: foreignCandidateRef,
  workspaceId: foreignScope.workspaceId,
}), foreignScope)
await assert.rejects(
  () => plugin.acceptDependencyArtifact({
    assignment: generatedFixture.assignment,
    plan: generatedPlan,
    request: visualIntelligenceRequest,
    artifactRef: foreignQaRef,
    workGraph: generatedWorkGraph,
    relatedWorkItemResult: providerWorkResult,
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
  visualIntelligenceDependencyRequestHash: visualIntelligenceRequest.requestHash,
  visualIntelligenceDependencyAcceptanceHash: visualIntelligenceAcceptance.acceptanceHash,
  generatedDependencyReceiptHash: dependencyReceipt.receiptHash,
  requiredInputAdversarialCases,
  privateMiniSkillImports: 0,
}, null, 2))
