import assert from 'node:assert/strict'

import {
  editSkillArtifactStore,
  editSkillCapabilityRegistry,
  editSkillEstimatorRegistry,
  editSkillQaRegistry,
  editSkillQualificationRegistry,
} from '../edit-skills/internal-fixture-runtime'
import { EditSkillInvocationService } from '../edit-skills/core/edit-skill-invocation-service'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { createSkillAssignment } from '../edit-skills/core/skill-range-authority'
import {
  BROLL_CAPABILITY_MANIFEST,
  type BrollPlanningContext,
  type BrollSourceCandidate,
  type BrollSkillAssignment,
  createBrollAssignment,
  createBrollPlanningContext,
  compileBrollPlan,
} from '../edit-skills/b-roll/index'

const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const range = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }

function artifactRef(artifactType: string, suffix: string) {
  return {
    artifactType,
    sha256: hashSkillValue({ artifactType, suffix }),
    byteLength: 100,
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
  }
}

function sourceCandidate(overrides: Partial<BrollSourceCandidate> = {}): BrollSourceCandidate {
  return {
    sourceId: 'source-existing', sourceType: 'existing_project_clip', artifactRef: artifactRef('source_media_artifact_v1', 'source'),
    sourceRange: { startFrameInclusive: 24, endFrameExclusive: 96, fps: 24 }, semanticRelevance: 0.95,
    visualQuality: 0.9, temporalFit: 0.9, storyContinuity: 0.9, provenanceVerified: true,
    rightsApproved: true, privacyApproved: true, proofSafe: true, repetitionRisk: 0.05,
    cropFeasibility: 0.9, speakerActionProtection: 0.9, audioUsefulness: 0.5, costCredits: 1,
    approvedByUser: true, ...overrides,
  }
}

function assignment(overrides: Partial<Omit<BrollSkillAssignment, 'assignmentHash'>> = {}) {
  return createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1', assignmentId: 'assignment', orchestrationRunId: 'orchestration',
    ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project', editSessionId: 'session', editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange), masterTimingRange: masterRange, segmentIds: ['segment-1'],
    sourceSequenceIds: ['source-existing'], readContextAuthority: { wholeVideoReadOnly: true, adjacentScenesReadOnly: true, contextArtifactRefs: [] },
    writeRangeAuthority: { authorizedRange: range, outsideAuthorizedRangeModified: false },
    reason: 'Support the product feature.', pointToProveClarifyCoverOrSupport: 'clarify the product detail',
    expectedViewerBenefit: 'See the exact feature.', requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not fabricate customer proof.'],
    permittedSourceRoutes: ['use_existing_project_clip', 'use_uploaded_user_asset', 'generate_with_gemini_omni', 'edit_uploaded_video_with_gemini_omni', 'use_no_broll'],
    providerPermission: 'approved_within_ceiling', maximumInitialCandidates: 1, maximumRefinements: 1,
    maximumTimeSeconds: 600, maximumCredits: 100, requiredOutputTypes: ['b_roll_plan_v1'], manifestRef,
    ...overrides,
  })
}

function context(overrides: Partial<Omit<BrollPlanningContext, 'contextHash'>> = {}) {
  return createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1', ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project',
    assignmentId: 'assignment', baseFootageStrength: 0.4, speakerEmotionImportance: 0.2, meaningfulVisualNeed: 0.9,
    userVisualPreference: 'balanced', claimSensitivity: 'supporting', generatedMediaWouldMislead: false,
    captionReservedZoneCount: 1, trackingRequired: false, sourceCandidates: [sourceCandidate()], priorConceptKeys: [],
    confirmedAspectRatio: '16:9', uploadedVideoEditRegionEligible: true, referenceDnaDoNotCopyRules: ['Do not copy exact shots.'],
    ...overrides,
  })
}

function compile(assignmentValue = assignment(), contextValue = context()) {
  return compileBrollPlan({
    assignment: assignmentValue, context: contextValue, manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry, qa: editSkillQaRegistry,
  })
}

const noAction = compile(
  assignment({ reason: 'Preserve the emotional line.', pointToProveClarifyCoverOrSupport: 'support the emotional story' }),
  context({ speakerEmotionImportance: 0.95, baseFootageStrength: 0.9 }),
)
assert.equal(noAction.plan.decision, 'use_no_broll')
assert.equal(noAction.plan.providerRequestPlanned, false)

const existing = compile()
assert.equal(existing.plan.decision, 'use_existing_project_clip')
assert.equal(existing.plan.providerRequestPlanned, false)
assert.equal(existing.omniRequestPlan, undefined)
assert.equal(existing.plan.audioDisposition, 'retain_source_audio')
assert.equal(existing.plan.coordination.soundHandoffRequired, true)

const userAsset = compile(
  assignment({ sourceSequenceIds: [] }),
  context({ sourceCandidates: [sourceCandidate({ sourceId: 'user-asset', sourceType: 'approved_user_asset' })] }),
)
assert.equal(userAsset.plan.decision, 'use_uploaded_user_asset')

const generated = compile(assignment(), context({ sourceCandidates: [], confirmedAspectRatio: '4:5' }))
assert.equal(generated.plan.decision, 'generate_with_gemini_omni')
assert.equal(generated.plan.cropSafeProviderAspectRatio, '9:16')
assert.equal(generated.omniRequestPlan?.maximumInitialSubmissions, 1)
assert.equal(generated.plan.shotSpecification?.proofClassification, 'illustrative')

const generatedProof = compile(assignment(), context({ sourceCandidates: [], claimSensitivity: 'verified_proof_required' }))
assert.equal(generatedProof.plan.decision, 'needs_user_confirmation')
assert.equal(generatedProof.plan.providerRequestPlanned, false)

assert.throws(
  () => assignment({ writeRangeAuthority: { authorizedRange: { startFrameInclusive: 2_390, endFrameExclusive: 2_410, fps: 24 }, outsideAuthorizedRangeModified: false } }),
  /outside master timing/,
)
assert.equal(existing.plan.outsideAuthorizedRangeModified, false)

const primaryConflict = compile(assignment(), context({ primaryVisualOwner: 'graphic_design' }))
assert.equal(primaryConflict.plan.decision, 'blocked')

assert.match(existing.plan.captionSafeBehavior, /caption reserved zone/iu)

const trackRef = artifactRef('track_graph_v1', 'track')
const trackingPresent = compile(assignment(), context({ trackingRequired: true, trackGraphRef: trackRef }))
assert.equal(trackingPresent.plan.coordination.trackingDependency, 'satisfied')
const trackingMissing = compile(assignment(), context({ trackingRequired: true }))
assert.equal(trackingMissing.plan.decision, 'needs_other_skill')
assert.equal(trackingMissing.plan.coordination.trackingDependency, 'needs_other_skill')

const conceptKey = existing.plan.shotSpecification?.conceptKey
assert.ok(conceptKey)
const repeated = compile(assignment(), context({ priorConceptKeys: [conceptKey] }))
assert.equal(repeated.plan.decision, 'use_no_broll')

const regionBlocked = compile(
  assignment(),
  context({
    uploadedVideoEditRegionEligible: false,
    sourceCandidates: [sourceCandidate({ sourceType: 'uploaded_video_for_edit', semanticRelevance: 0.9 })],
  }),
)
assert.notEqual(regionBlocked.plan.decision, 'edit_uploaded_video_with_gemini_omni')

const contextArtifact = context()
const contextRef = await editSkillArtifactStore.putJson({
  artifactType: 'b_roll_context_manifest_v1', ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project', value: contextArtifact,
})
const brollAssignment = assignment({ readContextAuthority: { wholeVideoReadOnly: true, adjacentScenesReadOnly: true, contextArtifactRefs: [contextRef] } })
const assignmentRef = await editSkillArtifactStore.putJson({
  artifactType: 'b_roll_assignment_v1', ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project', value: brollAssignment,
})
const genericAssignment = createSkillAssignment({
  schemaVersion: 'edit-skill-assignment-v1', assignmentId: 'assignment', ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project',
  editSessionId: 'session', planningRequestId: 'request', manifestRef, authorizedRange: range,
  reason: 'Support the product feature.', intendedViewerBenefit: 'See the exact feature.', editorialContext: 'Manifest-gated B-roll planning.',
  visualOwnership: 'primary', contextArtifactRefs: [assignmentRef, contextRef], dependencyArtifactRefs: [], requestedBySkill: 'orchestra',
})
const invocationPlan = await new EditSkillInvocationService(editSkillCapabilityRegistry).plan(genericAssignment)
assert.equal(invocationPlan.disposition, 'use_skill')
assert.match(invocationPlan.payloadHash, /^[a-f0-9]{64}$/u)

if (process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING !== '1') {
  editSkillQualificationRegistry.assertClaim(manifestRef, 'planning_qualified')
  editSkillQualificationRegistry.assertClaim(manifestRef, 'internal_execution_qualified')
  assert.throws(() => editSkillQualificationRegistry.assertClaim(manifestRef, 'production_qualified'), /exceeds/)
}

console.log(JSON.stringify({
  status: 'ok',
  manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
  noActionDecision: noAction.plan.decision,
  existingSourceDecision: existing.plan.decision,
  providerRequestsForExistingSource: 0,
  generatedDecision: generated.plan.decision,
  trackingMissingDecision: trackingMissing.plan.decision,
  planningQualification: 'internal_execution_qualified',
}, null, 2))
