import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  BROLL_CAPABILITY_MANIFEST,
  assertBrollCanonicalWorkGraph,
  assertCanonicalBrollComponentRefPropagation,
  canonicalBrollSkillPlanComponentSchema,
  compileBrollCanonicalWorkGraph,
  compileBrollPlan,
  createBrollAssignment,
  createBrollPlanningContext,
  projectBrollCanonicalWorkItems,
  type BrollPlanningContext,
  type BrollSourceCandidate,
  type BrollSkillAssignment,
} from '../edit-skills/b-roll/index'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { loadBrollGeneratedQualificationReceiptForCurrentSource } from '../edit-skills/b-roll/b-roll-qualification-evidence'
import { editSkillEstimatorRegistry, editSkillQaRegistry } from '../edit-skills/internal-fixture-runtime'
import {
  persistCanonicalBrollPlanComponent,
  revalidateCanonicalBrollPlanAuthority,
} from '../services/canonical-broll-plan-component-service'

const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
const authorizedRange = { startFrameInclusive: 120, endFrameExclusive: 192, fps: 24 }
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

function sourceCandidate(): BrollSourceCandidate {
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
  }
}

function assignment(
  overrides: Partial<Omit<BrollSkillAssignment, 'assignmentHash'>> = {},
): BrollSkillAssignment {
  return createBrollAssignment({
    schemaVersion: 'b_roll_assignment_v1',
    assignmentId: 'assignment',
    orchestrationRunId: 'orchestration',
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
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
    writeRangeAuthority: {
      authorizedRange,
      outsideAuthorizedRangeModified: false,
    },
    reason: 'Support the product feature.',
    pointToProveClarifyCoverOrSupport: 'clarify the product detail',
    expectedViewerBenefit: 'See the exact feature.',
    requestedVisualOwnership: 'primary',
    forbiddenInterpretations: ['Do not fabricate customer proof.'],
    permittedSourceRoutes: [
      'use_existing_project_clip',
      'generate_with_gemini_omni',
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
    ownerUserId: 'user',
    workspaceId: 'workspace',
    projectId: 'project',
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

function compile(assignmentValue: BrollSkillAssignment, contextValue: BrollPlanningContext) {
  const compiled = compileBrollPlan({
    assignment: assignmentValue,
    context: contextValue,
    manifest: BROLL_CAPABILITY_MANIFEST,
    estimators: editSkillEstimatorRegistry,
    qa: editSkillQaRegistry,
  })
  const workGraph = compileBrollCanonicalWorkGraph({
    assignment: assignmentValue,
    plan: compiled.plan,
  })
  const canonicalWorkItems = projectBrollCanonicalWorkItems({
    assignment: assignmentValue,
    workGraph,
  })
  return { ...compiled, workGraph, canonicalWorkItems }
}

const existingAssignment = assignment()
const existingContext = context()
const existing = compile(existingAssignment, existingContext)
assert.equal(existing.workGraph.route, 'existing_source')
assert.equal(existing.canonicalWorkItems.some((item) => item.approvedProviderRoute), false)
assert.equal(existing.canonicalWorkItems.filter((item) => item.approvedToolIds.includes('ffprobe')).length, 1)
assert.equal(existing.canonicalWorkItems.filter((item) => item.approvedToolIds.includes('ffmpeg')).length, 2)
assert.equal(existing.canonicalWorkItems.filter((item) => item.approvedToolIds.includes('remotion')).length, 1)
assert.deepEqual(
  existing.canonicalWorkItems.find((item) => item.approvedToolIds.includes('remotion'))?.approvedToolIds,
  ['remotion'],
)

const generatedAssignment = assignment({ sourceSequenceIds: [] })
const generatedContext = context({ sourceCandidates: [] })
const generated = compile(generatedAssignment, generatedContext)
assert.equal(generated.workGraph.route, 'gemini_omni')
assert.equal(generated.workGraph.workItems.length, 12)
assert.equal(
  generated.canonicalWorkItems.filter((item) => item.approvedProviderRoute === 'gemini_omni_flash').length,
  1,
)
assert.equal(generated.canonicalWorkItems.every((item) =>
  (item.executionInput.bRollAtomicAuthority as Record<string, unknown>).manifestRef !== undefined), true)

const noActionAssignment = assignment({
  reason: 'Preserve the emotional line.',
  pointToProveClarifyCoverOrSupport: 'support the emotional story',
})
const noActionContext = context({ speakerEmotionImportance: 0.95, baseFootageStrength: 0.9 })
const noAction = compile(noActionAssignment, noActionContext)
assert.equal(noAction.workGraph.route, 'no_action')
assert.equal(noAction.workGraph.workItems.length, 3)
assert.equal(noAction.canonicalWorkItems.some((item) =>
  item.approvedToolIds.length > 0 || item.approvedProviderRoute !== undefined), false)

const confirmationRequired = compile(
  assignment({ sourceSequenceIds: [] }),
  context({
    sourceCandidates: [],
    claimSensitivity: 'verified_proof_required',
  }),
)
assert.equal(confirmationRequired.plan.decision, 'needs_user_confirmation')
assert.equal(confirmationRequired.workGraph.route, 'no_action')
assert.equal(confirmationRequired.canonicalWorkItems.some((item) =>
  item.approvedToolIds.length > 0 || item.approvedProviderRoute !== undefined), false)

const escapedItem = structuredClone(generated.workGraph.workItems[0]!)
escapedItem.authorizedRange = {
  startFrameInclusive: authorizedRange.startFrameInclusive,
  endFrameExclusive: authorizedRange.endFrameExclusive + 1,
  fps: authorizedRange.fps,
}
const escapedItemCore: Partial<typeof escapedItem> = structuredClone(escapedItem)
delete escapedItemCore.workItemHash
escapedItem.workItemHash = hashSkillValue(escapedItemCore)
const escapedGraph = structuredClone(generated.workGraph)
escapedGraph.workItems[0] = escapedItem
const escapedGraphCore: Partial<typeof escapedGraph> = structuredClone(escapedGraph)
delete escapedGraphCore.workGraphHash
escapedGraph.workGraphHash = hashSkillValue(escapedGraphCore)
assert.throws(() => assertBrollCanonicalWorkGraph(escapedGraph), /lost graph lineage/)

const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-broll-m4-'))
try {
  const qualificationReceipt = loadBrollGeneratedQualificationReceiptForCurrentSource(
    BROLL_CAPABILITY_MANIFEST,
  )
  const persisted = await persistCanonicalBrollPlanComponent({
    localStorageRoot,
    assignment: generatedAssignment,
    context: generatedContext,
    plan: generated.plan,
    planningQaReport: generated.planningQaReport,
    workGraph: generated.workGraph,
    qualificationReceipt,
  })
  canonicalBrollSkillPlanComponentSchema.parse(persisted.component)
  const revalidated = await revalidateCanonicalBrollPlanAuthority({
    localStorageRoot,
    component: persisted.component,
    canonicalWorkItems: generated.canonicalWorkItems,
  })
  assert.equal(revalidated.workGraph?.workGraphHash, generated.workGraph.workGraphHash)
  assert.equal(
    revalidated.planningQaReport?.reportHash,
    generated.planningQaReport.reportHash,
  )
  assert.equal(
    persisted.component.planningQaReportHash,
    generated.plan.planningQaReportHash,
  )

  const brollRef = persisted.componentRefs.bRollSkill
  assertCanonicalBrollComponentRefPropagation({
    planComponentRefs: { bRollSkill: brollRef },
    snapshotComponentRefs: { bRollSkill: brollRef },
    executionPackageComponentRefs: { bRollSkill: brollRef },
  })
  assert.throws(() => assertCanonicalBrollComponentRefPropagation({
    planComponentRefs: { bRollSkill: brollRef },
    snapshotComponentRefs: {},
  }), /dropped/)

  const changedWorkItems = structuredClone(generated.canonicalWorkItems)
  changedWorkItems[0]!.maximumCreditBudget += 1
  await assert.rejects(() => revalidateCanonicalBrollPlanAuthority({
    localStorageRoot,
    component: persisted.component,
    canonicalWorkItems: changedWorkItems,
  }), /no longer match/)
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}

console.log(JSON.stringify({
  status: 'ok',
  manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
  existingSourceWorkItems: existing.workGraph.workItems.length,
  generatedWorkItems: generated.workGraph.workItems.length,
  noActionWorkItems: noAction.workGraph.workItems.length,
  providerWorkItems: generated.canonicalWorkItems.filter((item) => item.approvedProviderRoute).length,
  sourceOnlyCompilerChanged: false,
  canonicalComponentPropagation: 'plan_to_snapshot_to_execution_package_exact',
}, null, 2))
