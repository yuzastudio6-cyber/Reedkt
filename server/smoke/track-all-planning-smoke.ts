import assert from 'node:assert/strict'

import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  createTrackAllPlan,
  trackAllPlanSchema,
  trackAllPlanningQaReportSchema,
} from '../edit-skills/track-all'
import {
  estimateTrackAllPlan,
  planTrackAllMultiplexBudget,
  planTrackAllSessionLifecycle,
  planTrackAllShotAwareChunks,
  selectTrackAllInitializationFrame,
} from '../edit-skills/track-all/private/planning-mini-skills'
import {
  TRACK_ALL_FIXTURE_SCOPE,
  createTrackAllAuthorityFixture,
} from './track-all-fixtures'

process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING = '1'
const { createInternalFixtureEditSkillRuntime } = await import('../edit-skills/internal-fixture-runtime')
const runtime = createInternalFixtureEditSkillRuntime()
const plugin = runtime.pluginRegistry.resolve(skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST))

async function planFixture(input: Parameters<typeof createTrackAllAuthorityFixture>[0]) {
  const fixture = await createTrackAllAuthorityFixture(input)
  const publicPlan = await plugin.planAssignment({ assignment: fixture.assignment })
  const plan = trackAllPlanSchema.parse(await runtime.artifactStore.readJson({
    reference: publicPlan.payloadRef, ...TRACK_ALL_FIXTURE_SCOPE,
  }))
  const qaRef = publicPlan.evidenceRefs.find((ref) => ref.artifactType === 'track_all_planning_qa_report_v1')
  assert.ok(qaRef)
  const qa = trackAllPlanningQaReportSchema.parse(await runtime.artifactStore.readJson({
    reference: qaRef, ...TRACK_ALL_FIXTURE_SCOPE,
  }))
  assert.equal(plan.planningQaReportHash, qaRef.sha256)
  assert.equal(plan.planningQaPassed, qa.passed)
  return { fixture, publicPlan, plan, qa }
}

const noAction = await planFixture({ runtime, assignmentId: 'planning-no-action' })
assert.equal(noAction.plan.decision, 'use_no_tracking')
assert.equal(noAction.plan.routeDisposition, 'no_action')
assert.equal(noAction.plan.samWorkPlanned, false)
assert.equal(noAction.plan.visibleTreatmentPlanned, false)
assert.equal(noAction.plan.chunkPlan.chunks.length, 0)
assert.deepEqual(noAction.plan.timeEstimate, { minimumSeconds: 0, expectedSeconds: 0, maximumSeconds: 0 })
assert.deepEqual(noAction.plan.creditEstimate, { minimumCredits: 0, expectedCredits: 0, maximumCredits: 0, internalToolCostOnly: true })

const selected = await planFixture({
  runtime, assignmentId: 'planning-selected',
  requestedJobType: 'track_all.produce_selected_target_graph',
  intendedTreatment: 'geometry_only',
})
assert.equal(selected.publicPlan.envelope.disposition, 'use_skill')
assert.equal(selected.plan.decision, 'produce_track_graph')
assert.equal(selected.plan.samWorkPlanned, true)
assert.equal(selected.plan.visibleTreatmentPlanned, false)
assert.equal(selected.plan.propagationDirection, 'both')
assert.equal(selected.plan.initializationFrame, 24)
assert.equal(selected.plan.objectBudget.bucketCount, 1)
assert.equal(selected.plan.objectBudget.sessionCount, selected.plan.chunkPlan.chunks.length)
assert.equal(selected.qa.findings.length, 24)
assert.equal(new Set(selected.qa.findings.map((finding) => finding.qaKey)).size, 24)

const conceptDependency = await planFixture({
  runtime, assignmentId: 'planning-concept-dependency',
  requestedJobType: 'track_all.produce_concept_instance_graph',
  intendedTreatment: 'geometry_only', targetType: 'concept_group',
})
assert.equal(conceptDependency.publicPlan.envelope.disposition, 'needs_other_skill')
assert.equal(conceptDependency.plan.decision, 'needs_visual_intelligence')
assert.equal(conceptDependency.plan.dependencySkillKey, 'visual_intelligence')
assert.equal(conceptDependency.plan.requiredDependencyArtifactType, 'visual_intelligence_target_evidence_v1')
assert.equal(conceptDependency.plan.samWorkPlanned, false)
assert.equal(conceptDependency.plan.chunkPlan.chunks.length, 0)
assert.equal(conceptDependency.plan.creditEstimate.expectedCredits, 0)

const timeCeiling = await planFixture({
  runtime, assignmentId: 'planning-time-ceiling',
  requestedJobType: 'track_all.produce_selected_target_graph',
  intendedTreatment: 'geometry_only', maximumTimeSeconds: 1,
})
assert.equal(timeCeiling.plan.routeDisposition, 'time_ceiling')
assert.equal(timeCeiling.plan.decision, 'needs_user_confirmation')
assert.equal(timeCeiling.plan.samWorkPlanned, false)
assert.equal(timeCeiling.plan.chunkPlan.chunks.length, 0)
assert.equal(timeCeiling.plan.timeEstimate.expectedSeconds, 0)
assert.equal(timeCeiling.plan.creditEstimate.expectedCredits, 0)

const creditCeiling = await planFixture({
  runtime, assignmentId: 'planning-credit-ceiling',
  requestedJobType: 'track_all.produce_selected_target_graph',
  intendedTreatment: 'geometry_only', maximumCredits: 0,
})
assert.equal(creditCeiling.plan.routeDisposition, 'credit_ceiling')
assert.equal(creditCeiling.plan.decision, 'needs_user_confirmation')
assert.equal(creditCeiling.plan.objectBudget.sessionCount, 0)
assert.equal(creditCeiling.plan.creditEstimate.maximumCredits, 0)

const blockedTools = await planFixture({
  runtime, assignmentId: 'planning-tool-blocked',
  requestedJobType: 'track_all.produce_selected_target_graph',
  intendedTreatment: 'geometry_only', deterministicToolsAllowed: false,
})
assert.equal(blockedTools.plan.decision, 'blocked')
assert.equal(blockedTools.plan.samWorkPlanned, false)

const objectBudgetReview = await planFixture({
  runtime, assignmentId: 'planning-object-budget-review',
  requestedJobType: 'track_all.produce_selected_target_graph',
  intendedTreatment: 'geometry_only', expectedMaximumCount: 17,
  maximumObjects: 16,
})
assert.equal(objectBudgetReview.plan.decision, 'needs_user_confirmation')
assert.equal(objectBudgetReview.qa.findings.find((finding) =>
  finding.qaKey === 'track_all.qa.target_count')?.disposition, 'blocking')

const exclusionMismatch = await planFixture({
  runtime, assignmentId: 'planning-exclusion-mismatch',
  requestedJobType: 'track_all.produce_selected_target_graph',
  intendedTreatment: 'geometry_only',
  editorialExclusions: ['exclude presenter'], targetExcludeRules: [],
})
assert.equal(exclusionMismatch.plan.decision, 'blocked')
assert.equal(exclusionMismatch.qa.findings.find((finding) =>
  finding.qaKey === 'track_all.qa.concept_exclusion')?.disposition, 'blocking')

const planar = await planFixture({
  runtime, assignmentId: 'planning-planar',
  requestedJobType: 'track_all.track_planar_region',
  intendedTreatment: 'planar_geometry', targetType: 'planar_region',
})
assert.equal(planar.plan.decision, 'track_planar_region')
assert.equal(planar.plan.samWorkPlanned, false)
assert.equal(planar.plan.objectBudget.sessionCount, 0)
assert.ok(planar.plan.chunkPlan.chunks.length > 0)

const longChunks = planTrackAllShotAwareChunks({
  authorizedRange: { startFrameInclusive: 0, endFrameExclusive: 720, fps: 24 },
  shotBoundaries: [360], qualifiedMaximumFrames: 240, maximumChunks: 10,
  privacyRisk: 1, targetSpeed: 0.9, targetSizeRisk: 0.8,
  occlusionRisk: 0.9, cameraMotionRisk: 0.8, objectCount: 20,
})
assert.equal(longChunks.chunks.length, 4)
assert.ok(longChunks.dynamicOverlapFrames >= 24)
assert.equal(longChunks.chunks.every((chunk) => chunk.range.endFrameExclusive - chunk.range.startFrameInclusive <= 240), true)

const multiplex = planTrackAllMultiplexBudget({
  expectedObjects: 17, approvedMaximumObjects: 32, chunkCount: 4,
  bucketSize: 16, maximumBuckets: 8, samRequired: true,
})
assert.equal(multiplex.bucketCount, 2)
assert.equal(multiplex.sessionCount, 8)
assert.equal(multiplex.budgetClass, 'multi_bucket')

const initialization = selectTrackAllInitializationFrame({
  authorizedRange: { startFrameInclusive: 10, endFrameExclusive: 100, fps: 24 },
  candidates: [
    { frameIndex: 10, visibility: 0.5, targetSize: 0.4, sharpness: 0.2, motionBlur: 0.9, occlusion: 0.5, similarObjectAmbiguity: 0.5, edgeTruncation: 0.8, cameraStability: 0.2 },
    { frameIndex: 64, visibility: 1, targetSize: 0.9, sharpness: 1, motionBlur: 0, occlusion: 0, similarObjectAmbiguity: 0, edgeTruncation: 0, cameraStability: 1 },
  ],
})
assert.equal(initialization.frameIndex, 64)

const lifecycle = planTrackAllSessionLifecycle({
  samRequired: true, maximumAttempts: 2, chunkCount: 4, sessionCount: 8,
})
assert.equal(lifecycle.oneWriterPerSession, true)
assert.equal(lifecycle.mandatoryClose, true)
assert.equal(lifecycle.propagationDirection, 'both')
assert.equal(lifecycle.automaticUnknownOutcomeResubmission, false)

assert.deepEqual(estimateTrackAllPlan({
  frameCount: 0, fps: 24, chunkCount: 0, overlapFrames: 0,
  targetGroupCount: 0, objectCount: 0, bucketCount: 0, sessionCount: 0,
  bidirectionalPropagation: false, planarGeometry: false, ocr: false,
  landmarks: false, maskRefinement: false, privacyTreatment: false,
  previewRender: false, qaDepth: 'planning', repairAttempts: 0, noAction: true,
}).time, { minimumSeconds: 0, expectedSeconds: 0, maximumSeconds: 0 })

const { planHash: _planHash, ...selectedCore } = selected.plan
void _planHash
assert.throws(() => createTrackAllPlan({
  ...selectedCore,
  decision: 'use_no_tracking', routeDisposition: 'no_action',
}), /Non-executable Track All decision contains work/iu)
assert.throws(() => createTrackAllPlan({
  ...selectedCore,
  objectBudget: { ...selectedCore.objectBudget, bucketCount: 2 },
}), /multiplex bucket count is incoherent/iu)
assert.throws(() => trackAllPlanningQaReportSchema.parse({
  ...selected.qa,
  findings: selected.qa.findings.map((finding, index) => index === 0
    ? { ...finding, findingHash: hashSkillValue('forged') }
    : finding),
}), /stale or forged/iu)

const genericQaAttempt = runtime.qaRegistry.evaluate(
  'track_all.qa.range_authority',
  { derivedPassed: true, passed: true, evidence: [] },
)
assert.equal(genericQaAttempt.disposition, 'needs_review')
assert.equal(genericQaAttempt.observations.acceptedRawBoolean, false)

console.log(JSON.stringify({
  status: 'ok', planningScenarios: 9, planningQaFindings: selected.qa.findings.length,
  longRangeChunks: longChunks.chunks.length, multiplexBuckets: multiplex.bucketCount,
  timeCeilingFailClosed: true, creditCeilingFailClosed: true,
  rawBooleanCannotApproveQa: true,
}))
