import assert from 'node:assert/strict'

import {
  BROLL_CAPABILITY_MANIFEST,
  assertBrollPlanRuntimeInvariants,
  brollPlanArtifactSchema,
  compileBrollCanonicalWorkGraph,
  compileBrollPlan,
  createBrollAssignment,
  createBrollPlanningContext,
  type BrollPlanArtifact,
  type BrollPlanningContext,
  type BrollSourceCandidate,
  type BrollSkillAssignment,
} from '../edit-skills/b-roll'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/internal-fixture-runtime'

const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const range = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
const scope = { ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project' }
const sha = (value: string) => hashSkillValue({ value })

function artifactRef(artifactType: string, suffix: string) {
  return {
    artifactType,
    sha256: hashSkillValue({ artifactType, suffix }),
    byteLength: 100,
    ...scope,
  }
}

function sourceCandidate(overrides: Partial<BrollSourceCandidate> = {}): BrollSourceCandidate {
  return {
    sourceId: 'source-existing',
    sourceType: 'existing_project_clip',
    artifactRef: artifactRef('source_media_artifact_v1', 'source'),
    sourceRange: { startFrameInclusive: 24, endFrameExclusive: 96, fps: 24 },
    semanticRelevance: 0.95,
    visualQuality: 0.9,
    temporalFit: 0.9,
    storyContinuity: 0.9,
    provenanceVerified: true,
    rightsApproved: true,
    privacyApproved: true,
    proofSafe: true,
    repetitionRisk: 0.05,
    cropFeasibility: 0.9,
    speakerActionProtection: 0.9,
    audioUsefulness: 0.5,
    costCredits: 1,
    approvedByUser: true,
    ...overrides,
  }
}

function assignment(overrides: Partial<Omit<BrollSkillAssignment, 'assignmentHash'>> = {}) {
  return createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment',
    orchestrationRunId: 'orchestration',
    ...scope,
    editSessionId: 'session',
    editPlanVersion: 1,
    masterTimingHash: hashSkillValue(masterRange),
    masterTimingRange: masterRange,
    segmentIds: ['segment-1'],
    sourceSequenceIds: ['source-existing'],
    readContextAuthority: {
      wholeVideoReadOnly: true,
      adjacentScenesReadOnly: true,
      contextArtifactRefs: [],
    },
    writeRangeAuthority: { authorizedRange: range, outsideAuthorizedRangeModified: false },
    reason: 'Support the product feature.',
    pointToProveClarifyCoverOrSupport: 'clarify the product detail',
    expectedViewerBenefit: 'See the exact feature.',
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not fabricate customer proof.'],
    permittedSourceRoutes: [
      'use_existing_project_clip',
      'use_uploaded_user_asset',
      'generate_with_gemini_omni',
      'edit_uploaded_video_with_gemini_omni',
      'refine_generated_omni_candidate',
      'use_no_broll',
    ],
    providerPermission: 'approved_within_ceiling',
    maximumInitialCandidates: 1,
    maximumRefinements: 1,
    maximumTimeSeconds: 600,
    maximumCredits: 100,
    requiredOutputTypes: ['b_roll_plan_v1'],
    manifestRef,
    ...overrides,
  })
}

function context(overrides: Partial<Omit<BrollPlanningContext, 'contextHash'>> = {}) {
  return createBrollPlanningContext({
    schemaVersion: 'b_roll_context_manifest_v1',
    ...scope,
    assignmentId: 'assignment',
    baseFootageStrength: 0.4,
    speakerEmotionImportance: 0.2,
    meaningfulVisualNeed: 0.9,
    userVisualPreference: 'balanced',
    claimSensitivity: 'supporting',
    generatedMediaWouldMislead: false,
    captionReservedZoneCount: 1,
    trackingRequired: false,
    sourceCandidates: [sourceCandidate()],
    priorConceptKeys: [],
    confirmedAspectRatio: '16:9',
    uploadedVideoEditRegionEligible: true,
    referenceDnaDoNotCopyRules: ['Do not copy exact shots.'],
    ...overrides,
  })
}

function compile(
  assignmentValue = assignment(),
  contextValue = context(),
) {
  return compileBrollPlan({
    assignment: assignmentValue,
    context: contextValue,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
}

function graphCreatesMedia(plan: BrollPlanArtifact, assignmentValue: BrollSkillAssignment) {
  const graph = compileBrollCanonicalWorkGraph({ assignment: assignmentValue, plan })
  return {
    graph,
    mediaJobs: graph.workItems.filter((item) => [
      'prepare_b_roll_source',
      'generate_b_roll_candidate',
      'normalize_b_roll_candidate_with_ffmpeg',
      'render_b_roll_preview',
    ].includes(item.jobType)),
    providerJobs: graph.workItems.filter((item) => item.workerClass === 'provider_worker'),
  }
}

function forgedPlan(
  plan: BrollPlanArtifact,
  mutate: (draft: Record<string, unknown>) => void,
): unknown {
  const draft = structuredClone(plan) as unknown as Record<string, unknown>
  delete draft.planHash
  mutate(draft)
  return { ...draft, planHash: hashSkillValue(draft) }
}

const directNoAction = compile(
  assignment({ reason: 'Preserve the emotional line.' }),
  context({ speakerEmotionImportance: 0.95, baseFootageStrength: 0.9 }),
)
assert.equal(directNoAction.plan.decision, 'use_no_broll')
assert.equal(directNoAction.omniRequestPlan, undefined)
assert.equal(directNoAction.plan.providerRequestPlanned, false)
assert.equal(directNoAction.plan.providerRequestPackageHash, undefined)
assert.equal(directNoAction.plan.providerCreditEstimate, 0)
assert.equal(directNoAction.plan.creditEstimate, 0)
assert.equal(directNoAction.plan.timeEstimateSeconds, 0)
assert.equal(directNoAction.plan.displayTreatment, 'no_display')
assert.equal(directNoAction.plan.sourceArtifactRef, undefined)
assert.equal(directNoAction.plan.shotSpecification, undefined)
assert.equal(directNoAction.plan.cropSafeProviderAspectRatio, undefined)
assert.equal(graphCreatesMedia(directNoAction.plan, assignment({ reason: 'Preserve the emotional line.' })).mediaJobs.length, 0)

const timeCeilingAssignment = assignment({ maximumTimeSeconds: 30 })
const timeFallback = compile(timeCeilingAssignment, context({ sourceCandidates: [] }))
assert.equal(timeFallback.plan.decision, 'use_no_broll')
assert.equal(timeFallback.omniRequestPlan, undefined)
assert.equal(timeFallback.plan.timeEstimateSeconds, 0)
assert.equal(timeFallback.plan.creditEstimate, 0)
assert.equal(graphCreatesMedia(timeFallback.plan, timeCeilingAssignment).mediaJobs.length, 0)

const creditCeilingAssignment = assignment({ maximumCredits: 10 })
const creditFallback = compile(creditCeilingAssignment, context({ sourceCandidates: [] }))
assert.equal(creditFallback.plan.decision, 'use_no_broll')
assert.equal(creditFallback.omniRequestPlan, undefined)
assert.equal(creditFallback.plan.providerCreditEstimate, 0)
assert.equal(creditFallback.plan.creditEstimate, 0)
assert.equal(graphCreatesMedia(creditFallback.plan, creditCeilingAssignment).providerJobs.length, 0)

const existingAssignment = assignment()
const existing = compile(existingAssignment, context())
const existingGraph = graphCreatesMedia(existing.plan, existingAssignment)
assert.equal(existing.plan.decision, 'use_existing_project_clip')
assert.equal(existing.plan.sourceCandidateId, 'source-existing')
assert.equal(existing.plan.sourceArtifactRef?.sha256, sourceCandidate().artifactRef.sha256)
assert.equal(existing.plan.providerRequestPlanned, false)
assert.equal(existing.plan.providerCreditEstimate, 0)
assert.equal(existingGraph.providerJobs.length, 0)

const userAssetAssignment = assignment({ sourceSequenceIds: [] })
const userAsset = compile(userAssetAssignment, context({
  sourceCandidates: [sourceCandidate({ sourceId: 'user-asset', sourceType: 'approved_user_asset' })],
}))
assert.equal(userAsset.plan.decision, 'use_uploaded_user_asset')
assert.equal(userAsset.plan.sourceCandidateId, 'user-asset')
assert.equal(graphCreatesMedia(userAsset.plan, userAssetAssignment).providerJobs.length, 0)

const providerAssignment = assignment()
const generated = compile(providerAssignment, context({ sourceCandidates: [] }))
const generatedGraph = graphCreatesMedia(generated.plan, providerAssignment)
assert.equal(generated.plan.decision, 'generate_with_gemini_omni')
assert.equal(generated.plan.providerRequestPlanned, true)
assert.equal(generated.plan.providerCreditEstimate > 0, true)
assert.ok(generated.plan.shotSpecification)
assert.ok(generated.plan.cropSafeProviderAspectRatio)
assert.ok(generated.omniRequestPlan)
assert.equal(generated.plan.providerRequestPackageHash, hashSkillValue(generated.omniRequestPlan))
assert.equal(generatedGraph.providerJobs.length, 1)
assert.equal(generatedGraph.providerJobs[0]?.operationId, 'provider.google.generate_b_roll_candidate.v1')

const forbiddenProviderAssignment = assignment({ providerPermission: 'forbidden' })
const forbiddenProvider = compile(forbiddenProviderAssignment, context({ sourceCandidates: [] }))
assert.equal(forbiddenProvider.plan.decision, 'use_no_broll')
assert.equal(forbiddenProvider.plan.providerRequestPlanned, false)

const dependencyAssignment = assignment()
const needsDependency = compile(dependencyAssignment, context({
  sourceCandidates: [],
  trackingRequired: true,
}))
const dependencyGraph = graphCreatesMedia(needsDependency.plan, dependencyAssignment)
assert.equal(needsDependency.plan.decision, 'needs_other_skill')
assert.equal(needsDependency.plan.dependencySkillKey, 'track_all')
assert.equal(needsDependency.plan.requiredDependencyArtifactType, 'track_graph_v1')
assert.equal(needsDependency.plan.requiredForPhase, 'skill_execution')
assert.equal(needsDependency.plan.providerRequestPlanned, false)
assert.equal(dependencyGraph.mediaJobs.length, 0)

const blockedAssignment = assignment()
const blocked = compile(blockedAssignment, context({ primaryVisualOwner: 'graphic_design' }))
assert.equal(blocked.plan.decision, 'blocked')
assert.equal(graphCreatesMedia(blocked.plan, blockedAssignment).mediaJobs.length, 0)

const confirmationAssignment = assignment()
const confirmation = compile(confirmationAssignment, context({
  sourceCandidates: [],
  claimSensitivity: 'verified_proof_required',
}))
assert.equal(confirmation.plan.decision, 'needs_user_confirmation')
assert.equal(graphCreatesMedia(confirmation.plan, confirmationAssignment).mediaJobs.length, 0)

assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(directNoAction.plan, (draft) => {
    draft.providerRequestPlanned = true
  })),
  /provider request authority|provider decisions/iu,
)
assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(directNoAction.plan, (draft) => {
    draft.sourceCandidateId = 'forged-source'
    draft.sourceArtifactRef = artifactRef('source_media_artifact_v1', 'forged')
    draft.sourceScore = 90
  })),
  /coherent zero-cost no-display/iu,
)
assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(existing.plan, (draft) => {
    draft.providerRequestPlanned = true
  })),
  /provider request authority|source decisions/iu,
)
assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(needsDependency.plan, (draft) => {
    draft.requiredDependencyArtifactType = 'sam2_tracks_v1'
  })),
  /model-neutral Track All/iu,
)
assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(blocked.plan, (draft) => {
    draft.displayTreatment = 'full_frame_cutaway'
  })),
  /coherent zero-cost no-display/iu,
)
assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(confirmation.plan, (draft) => {
    draft.providerCreditEstimate = 20
  })),
  /provider credit estimate|coherent zero-cost/iu,
)
assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(generated.plan, (draft) => {
    delete draft.providerRequestPackageHash
  })),
  /exact request package/iu,
)

const forbiddenAuthority = assignment({ providerPermission: 'forbidden' })
const forgedProviderForForbiddenAuthority = brollPlanArtifactSchema.parse(
  forgedPlan(generated.plan, (draft) => {
    draft.assignmentHash = forbiddenAuthority.assignmentHash
  }),
)
assert.throws(
  () => assertBrollPlanRuntimeInvariants({
    assignment: forbiddenAuthority,
    plan: forgedProviderForForbiddenAuthority,
    omniRequestPlan: generated.omniRequestPlan,
    requireExactProviderRequestPackage: true,
  }),
  /provider authority/iu,
)

assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(generated.plan, (draft) => {
    draft.decision = 'refine_generated_omni_candidate'
  })),
  /refinement requires exact prior candidate/iu,
)
const refinementPlan = brollPlanArtifactSchema.parse(forgedPlan(generated.plan, (draft) => {
  draft.decision = 'refine_generated_omni_candidate'
  draft.refinementAuthority = {
    previousCandidateVersionId: sha('candidate-v1-id'),
    previousCandidateVersionHash: sha('candidate-v1'),
    priorQaReportHash: sha('candidate-v1-qa'),
    requestedCandidateVersion: 2,
    refinementCount: 1,
    maximumRefinements: 1,
  }
}))
assert.equal(refinementPlan.refinementAuthority?.requestedCandidateVersion, 2)
assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(refinementPlan, (draft) => {
    const authority = draft.refinementAuthority as Record<string, unknown>
    authority.refinementCount = 2
  })),
)
assert.throws(
  () => brollPlanArtifactSchema.parse(forgedPlan(refinementPlan, (draft) => {
    const authority = draft.refinementAuthority as Record<string, unknown>
    authority.requestedCandidateVersion = 3
  })),
)

console.log(JSON.stringify({
  status: 'ok',
  timeCeilingFallback: timeFallback.plan.decision,
  creditCeilingFallback: creditFallback.plan.decision,
  noActionProviderCredits: directNoAction.plan.providerCreditEstimate,
  noActionMediaJobs: 0,
  sourceProviderJobs: existingGraph.providerJobs.length,
  providerJobs: generatedGraph.providerJobs.length,
  dependencyDecision: needsDependency.plan.decision,
  refinementMaximumVersion: refinementPlan.refinementAuthority?.requestedCandidateVersion,
  contradictoryPlansRejected: 11,
}, null, 2))
