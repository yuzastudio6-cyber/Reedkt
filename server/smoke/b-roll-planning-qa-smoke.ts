import assert from 'node:assert/strict'

import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_PLANNING_QA_KEYS,
  assertBrollPlanningQaReport,
  brollPlanningQaReportSchema,
  compileBrollPlan,
  createBrollAssignment,
  createBrollPlanningContext,
  createBrollPlanningQaPlanEvidence,
  validateBrollCaptionSpace,
  validateBrollCreditCeiling,
  validateBrollDependencyCompleteness,
  validateBrollGeneratedClassification,
  validateBrollOwnership,
  validateBrollPrivacy,
  validateBrollProofSafety,
  validateBrollProviderEligibility,
  validateBrollProvenanceRights,
  validateBrollRangeAuthority,
  validateBrollRegionEligibility,
  type BrollPlanningContext,
  type BrollPlanningQaPlanEvidence,
  type BrollPlanningQaPlanEvidenceInput,
  type BrollSourceCandidate,
  type BrollSkillAssignment,
} from '../edit-skills/b-roll'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/registry'

const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const range = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
const masterRange = { startFrameInclusive: 0, endFrameExclusive: 2_400, fps: 24 }
const scope = { ownerUserId: 'user', workspaceId: 'workspace', projectId: 'project' }

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

function assignment(
  overrides: Partial<Omit<BrollSkillAssignment, 'assignmentHash'>> = {},
): BrollSkillAssignment {
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

function context(
  overrides: Partial<Omit<BrollPlanningContext, 'contextHash'>> = {},
): BrollPlanningContext {
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
  assignmentValue: BrollSkillAssignment,
  contextValue: BrollPlanningContext,
) {
  return compileBrollPlan({
    assignment: assignmentValue,
    context: contextValue,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
}

function rehashedEvidence(
  evidence: BrollPlanningQaPlanEvidence,
  mutate: (draft: Record<string, unknown>) => void,
): BrollPlanningQaPlanEvidence {
  const draft = structuredClone(evidence) as unknown as Record<string, unknown>
  delete draft.planEvidenceHash
  mutate(draft)
  return createBrollPlanningQaPlanEvidence(
    draft as unknown as BrollPlanningQaPlanEvidenceInput,
  )
}

const existingAssignment = assignment()
const existingContext = context()
const existing = compile(existingAssignment, existingContext)
assert.equal(existing.planningQaReport.findings.length, BROLL_PLANNING_QA_KEYS.length)
assert.deepEqual(
  existing.planningQaReport.findings.map((finding) => finding.qaKey),
  [...BROLL_PLANNING_QA_KEYS],
)
assert.equal(existing.planningQaReport.planningQaPassed, true)
assert.equal(existing.planningQaReport.blockingFindingKeys.length, 0)
assert.equal(existing.planningQaReport.findings.every((finding) =>
  finding.disposition === 'pass' && finding.validatorVersion === `${finding.qaKey}.v1`), true)
assert.equal(
  new Set(existing.planningQaReport.findings.map((finding) => finding.findingHash)).size,
  BROLL_PLANNING_QA_KEYS.length,
)
assert.equal(existing.planningQaEvidenceHash, hashSkillValue(existing.planningQaReport))
assert.equal(existing.plan.planningQaReportHash, existing.planningQaEvidenceHash)
assert.equal(existing.plan.planningQaPlanEvidenceHash, existing.planningQaPlanEvidence.planEvidenceHash)
assertBrollPlanningQaReport({
  report: existing.planningQaReport,
  assignment: existingAssignment,
  contextHash: existingContext.contextHash,
  planEvidenceHash: existing.planningQaPlanEvidence.planEvidenceHash,
})

assert.throws(
  () => editSkillQaRegistry.evaluate('b_roll.planning.range_authority', {
    'b_roll.planning.range_authority': true,
    evidenceHashes: [existingAssignment.assignmentHash],
  }),
  /required|invalid_type|assignment/iu,
)

const rangeOverreach = rehashedEvidence(existing.planningQaPlanEvidence, (draft) => {
  draft.authorizedRange = {
    startFrameInclusive: range.startFrameInclusive,
    endFrameExclusive: range.endFrameExclusive + 1,
    fps: range.fps,
  }
})
assert.equal(validateBrollRangeAuthority({
  assignment: existingAssignment,
  context: existingContext,
  planEvidence: rangeOverreach,
}).disposition, 'critical')

const generatedAssignment = assignment({ sourceSequenceIds: [] })
const generatedContext = context({ sourceCandidates: [] })
const generated = compile(generatedAssignment, generatedContext)
const proofForgery = rehashedEvidence(generated.planningQaPlanEvidence, (draft) => {
  const shot = draft.shotSpecification as Record<string, unknown>
  shot.proofClassification = 'source_verified'
})
assert.equal(validateBrollProofSafety({
  assignment: generatedAssignment,
  context: generatedContext,
  planEvidence: proofForgery,
}).disposition, 'critical')
assert.equal(validateBrollGeneratedClassification({
  assignment: generatedAssignment,
  context: generatedContext,
  planEvidence: proofForgery,
}).disposition, 'critical')

const unsafeRightsContext = context({
  sourceCandidates: [sourceCandidate({ provenanceVerified: false, rightsApproved: false })],
})
assert.equal(validateBrollProvenanceRights({
  assignment: existingAssignment,
  context: unsafeRightsContext,
  planEvidence: existing.planningQaPlanEvidence,
}).disposition, 'blocking')

const unsafePrivacyContext = context({
  sourceCandidates: [sourceCandidate({ privacyApproved: false })],
})
assert.equal(validateBrollPrivacy({
  assignment: existingAssignment,
  context: unsafePrivacyContext,
  planEvidence: existing.planningQaPlanEvidence,
}).disposition, 'blocking')

const ownershipConflictContext = context({ primaryVisualOwner: 'graphic_design' })
assert.equal(validateBrollOwnership({
  assignment: existingAssignment,
  context: ownershipConflictContext,
  planEvidence: existing.planningQaPlanEvidence,
}).disposition, 'critical')

const captionCollision = rehashedEvidence(existing.planningQaPlanEvidence, (draft) => {
  draft.captionSafeBehavior = 'Use the available picture area.'
  draft.coordination = {
    ...(draft.coordination as Record<string, unknown>),
    captionHandoffRequired: false,
  }
})
assert.equal(validateBrollCaptionSpace({
  assignment: existingAssignment,
  context: existingContext,
  planEvidence: captionCollision,
}).disposition, 'blocking')

const missingDependencyContext = context({ trackingRequired: true })
assert.equal(validateBrollDependencyCompleteness({
  assignment: existingAssignment,
  context: missingDependencyContext,
  planEvidence: existing.planningQaPlanEvidence,
}).disposition, 'blocking')

const creditOverrun = rehashedEvidence(generated.planningQaPlanEvidence, (draft) => {
  draft.creditEstimate = generatedAssignment.maximumCredits + 1
  draft.providerCreditEstimate = generatedAssignment.maximumCredits + 1
})
assert.equal(validateBrollCreditCeiling({
  assignment: generatedAssignment,
  context: generatedContext,
  planEvidence: creditOverrun,
}).disposition, 'blocking')

const forbiddenProviderAssignment = assignment({
  sourceSequenceIds: [],
  providerPermission: 'forbidden',
})
assert.equal(validateBrollProviderEligibility({
  assignment: forbiddenProviderAssignment,
  context: generatedContext,
  planEvidence: generated.planningQaPlanEvidence,
}).disposition, 'critical')

const regionBlockedContext = context({
  sourceCandidates: [],
  uploadedVideoEditRegionEligible: false,
})
const uploadedEditEvidence = rehashedEvidence(generated.planningQaPlanEvidence, (draft) => {
  draft.decision = 'edit_uploaded_video_with_gemini_omni'
})
assert.equal(validateBrollRegionEligibility({
  assignment: generatedAssignment,
  context: regionBlockedContext,
  planEvidence: uploadedEditEvidence,
}).disposition, 'critical')

const forgedFindingReport = structuredClone(existing.planningQaReport)
forgedFindingReport.findings[0]!.summary = 'Caller says this passed.'
assert.throws(
  () => brollPlanningQaReportSchema.parse(forgedFindingReport),
  /stale or forged/iu,
)

assert.throws(() => assertBrollPlanningQaReport({
  report: existing.planningQaReport,
  assignment: existingAssignment,
  contextHash: hashSkillValue({ stale: 'context' }),
  planEvidenceHash: existing.planningQaPlanEvidence.planEvidenceHash,
}), /stale/iu)

const forgedPlanEvidence = structuredClone(existing.planningQaPlanEvidence)
forgedPlanEvidence.reason = 'Changed without rehashing.'
assert.throws(() => validateBrollRangeAuthority({
  assignment: existingAssignment,
  context: existingContext,
  planEvidence: forgedPlanEvidence,
}), /stale or forged/iu)

console.log(JSON.stringify({
  status: 'ok',
  validatorCount: BROLL_PLANNING_QA_KEYS.length,
  planningQaReportHash: existing.planningQaReport.reportHash,
  planningQaArtifactHash: existing.planningQaEvidenceHash,
  rawBooleanRejected: true,
  derivedRangeDisposition: validateBrollRangeAuthority({
    assignment: existingAssignment,
    context: existingContext,
    planEvidence: rangeOverreach,
  }).disposition,
  derivedProofDisposition: validateBrollProofSafety({
    assignment: generatedAssignment,
    context: generatedContext,
    planEvidence: proofForgery,
  }).disposition,
  forgedFindingRejected: true,
  staleReportRejected: true,
}, null, 2))
