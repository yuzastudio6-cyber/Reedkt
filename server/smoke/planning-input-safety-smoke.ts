import assert from 'node:assert/strict'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { compileEditingIntent } from '../../src/lib/intent-compiler'
import {
  appendOrderedUserInstruction,
  createPlanningInputFingerprint,
  findConfirmedMaterialPlanningConflicts,
  resolveMaterialPlanningInstruction,
} from '../../src/lib/planning-input-safety'
import { createGuidedMockEditPlan } from '../../src/lib/mock-planner/guided'
import { buildPlanningContext } from '../../src/lib/planning/build-planning-context'
import { parseEditBriefStateForHandoff } from '../../src/lib/edit-brief/edit-brief-persistence'
import type { EditBriefState } from '../../src/types'
import type { PlannerInput } from '../../src/types/reeditpro'

const baseInput: PlannerInput = {
  projectName: 'Planning input safety smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'youtube_side_panel',
  editingCategory: 'business_brand',
  workflowType: 'product_demo',
  editLevel: 'pro',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Use YouTube and keep the product explanation clear.',
  userInstructionHistory: ['Use YouTube and keep the product explanation clear.'],
  creditPreference: 'balanced',
  clips: [
    {
      id: 'planning-input-safety-clip-1',
      uploadedOrder: 1,
      fileName: 'planning-input-safety.mp4',
      duration: '00:12',
      detectedType: 'Product demo source',
      sourceRole: 'main_story',
    },
  ],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'local-edit-preferences-safety-smoke',
  preferenceSnapshotAppliedAt: '2026-07-09T12:00:00.000Z',
}

const instructionHistory = appendOrderedUserInstruction(
  appendOrderedUserInstruction([], 'Use YouTube and a clean edit.'),
  'Actually make it square and use no extra visuals.',
)
assert.deepEqual(instructionHistory, [
  'Use YouTube and a clean edit.',
  'Actually make it square and use no extra visuals.',
])

const compiledIntent = compileEditingIntent({
  currentInput: baseInput,
  sourceOrderConfirmed: true,
  userMessages: instructionHistory,
})
assert.equal(compiledIntent.resolvedSettings.aspectRatio, '1:1', 'Latest explicit frame instruction must win.')
assert.equal(compiledIntent.resolvedSettings.targetPlatform, 'custom', 'Square instruction must replace stale YouTube platform routing.')
assert.equal(compiledIntent.resolvedSettings.visualPreference, 'no_extra_visuals', 'Latest visual instruction must be compiled.')
assert.deepEqual(compiledIntent.instructionHistory, instructionHistory, 'Compiled intent must preserve ordered chat instructions.')

const resolution = resolveMaterialPlanningInstruction(
  'Actually make it square, use basic edit level, and no extra visuals.',
  baseInput,
)
assert.equal(resolution.invalidates.outputFrame, true)
assert.equal(resolution.invalidates.editLevel, true)
assert.equal(resolution.invalidates.visualPreference, true)
assert.equal(resolution.next.aspectRatio, '1:1')
assert.equal(resolution.next.editLevel, 'basic')
assert.equal(resolution.next.visualPreference, 'no_extra_visuals')

const staleCompiledIntent = compileEditingIntent({
  currentInput: baseInput,
  sourceOrderConfirmed: true,
  userMessages: [...instructionHistory, 'Use basic edit level.'],
})
const staleConflicts = findConfirmedMaterialPlanningConflicts(baseInput, staleCompiledIntent)
assert.ok(staleConflicts.some((conflict) => conflict.includes('aspect ratio')))
assert.ok(staleConflicts.some((conflict) => conflict.includes('edit level')))
assert.ok(staleConflicts.some((conflict) => conflict.includes('visual preference')))

const fingerprint = createPlanningInputFingerprint(baseInput)
assert.equal(fingerprint, createPlanningInputFingerprint({ ...baseInput }), 'Fingerprint must be deterministic.')
assert.notEqual(
  fingerprint,
  createPlanningInputFingerprint({
    ...baseInput,
    userInstructionHistory: [...baseInput.userInstructionHistory ?? [], 'Make it square.'],
  }),
  'Material instruction history changes must change the planning-input fingerprint.',
)

const approvedPlan = createGuidedMockEditPlan(baseInput)
const approvedSnapshot = createApprovedPlanSnapshot({
  approvedBy: 'planning-input-safety-smoke-user',
  editSessionId: 'planning-input-safety-smoke-session',
  plan: approvedPlan,
  projectId: 'planning-input-safety-smoke-project',
})
assert.equal(approvedSnapshot.planningInputTrace?.fingerprint, fingerprint)
assert.equal(approvedSnapshot.planningInputTrace?.preferenceApplication?.snapshotId, baseInput.preferenceSnapshotId)
assert.equal(approvedSnapshot.settingsSnapshot.planning_input_fingerprint, fingerprint)
assert.equal(approvedSnapshot.settingsSnapshot.preference_snapshot_id, baseInput.preferenceSnapshotId)
assert.equal(approvedSnapshot.settingsSnapshot.preference_defaults_applied, true)

const fullEditBriefState: EditBriefState = {
  projectId: 'planning-input-safety-smoke-project',
  workspaceId: 'planning-input-safety-smoke-workspace',
  userId: 'planning-input-safety-smoke-user',
  updatedAt: '2026-07-10T12:00:00.000Z',
  editBrief: {
    id: 'planning-input-safety-smoke-brief',
    projectId: 'planning-input-safety-smoke-project',
    workspaceId: 'planning-input-safety-smoke-workspace',
    userId: 'planning-input-safety-smoke-user',
    status: 'ready',
    goal: 'Create a concise product launch update.',
    audience: 'Existing customers',
    targetPlatforms: ['youtube', 'linkedin'],
    targetDurationMs: 45_000,
    styleKeywords: ['calm', 'premium'],
    pacingPreference: 'tight',
    captionPreference: 'premium_subtle',
    musicPreference: 'subtle',
    bRollPreference: 'Use product proof only when it supports the spoken point.',
    mustUseAssetIds: ['source-proof-1'],
    avoidAssetIds: ['source-shaky-2'],
    mustIncludeNotes: ['Keep the launch date and CTA.'],
    avoidNotes: ['Do not overstate the product claim.'],
    brandNotes: 'Use the approved dark product palette.',
    specialInstructions: 'Protect speech clarity and keep transitions restrained.',
    userProvidedReferenceUrls: ['https://example.com/approved-reference'],
    version: 2,
    createdAt: '2026-07-10T11:00:00.000Z',
    updatedAt: '2026-07-10T12:00:00.000Z',
  },
  operations: [
    {
      id: 'planning-input-safety-smoke-brief-operation-1',
      projectId: 'planning-input-safety-smoke-project',
      workspaceId: 'planning-input-safety-smoke-workspace',
      userId: 'planning-input-safety-smoke-user',
      editBriefId: 'planning-input-safety-smoke-brief',
      type: 'update_reference_urls',
      status: 'applied',
      createdBy: 'user',
      createdAt: '2026-07-10T12:00:00.000Z',
      patch: { userProvidedReferenceUrls: ['https://example.com/approved-reference'] },
    },
  ],
}
const restoredBriefState = parseEditBriefStateForHandoff(
  fullEditBriefState,
  fullEditBriefState.projectId,
  fullEditBriefState.workspaceId ?? '',
)
assert.equal(restoredBriefState?.editBrief.goal, fullEditBriefState.editBrief.goal)
assert.deepEqual(restoredBriefState?.editBrief.targetPlatforms, fullEditBriefState.editBrief.targetPlatforms)
assert.deepEqual(restoredBriefState?.editBrief.mustIncludeNotes, fullEditBriefState.editBrief.mustIncludeNotes)
assert.deepEqual(restoredBriefState?.editBrief.avoidNotes, fullEditBriefState.editBrief.avoidNotes)
assert.deepEqual(restoredBriefState?.editBrief.userProvidedReferenceUrls, fullEditBriefState.editBrief.userProvidedReferenceUrls)
assert.equal(restoredBriefState?.operations[0]?.type, 'update_reference_urls')

const planningContext = buildPlanningContext({
  projectId: fullEditBriefState.projectId,
  workspaceId: fullEditBriefState.workspaceId,
  userId: fullEditBriefState.userId,
  cleanAssembly: null,
  cleanAssemblySegments: [],
  sourceTimeMappings: [],
  editBriefState: fullEditBriefState,
})
assert.deepEqual(planningContext.editBrief?.mustIncludeNotes, fullEditBriefState.editBrief.mustIncludeNotes)
assert.deepEqual(planningContext.editBrief?.avoidNotes, fullEditBriefState.editBrief.avoidNotes)
assert.deepEqual(planningContext.editBrief?.userProvidedReferenceUrls, fullEditBriefState.editBrief.userProvidedReferenceUrls)

const briefBoundSnapshot = createApprovedPlanSnapshot({
  approvedBy: 'planning-input-safety-smoke-user',
  editBriefSnapshot: planningContext.editBrief,
  editSessionId: 'planning-input-safety-smoke-session',
  plan: approvedPlan,
  projectId: 'planning-input-safety-smoke-project',
})
planningContext.editBrief?.mustIncludeNotes.push('Later draft mutation')
assert.deepEqual(
  briefBoundSnapshot.editBriefSnapshot?.mustIncludeNotes,
  ['Keep the launch date and CTA.'],
  'Approved snapshots must freeze Edit Brief arrays instead of sharing mutable draft references.',
)

console.log(JSON.stringify({
  checks: [
    'ordered_chat_instructions_preserved',
    'latest_material_instruction_wins',
    'confirmed_setup_conflicts_detected',
    'planning_input_fingerprint_deterministic',
    'preference_application_bound_to_approved_snapshot',
    'full_edit_brief_handoff_round_trip',
    'full_edit_brief_planning_context_transfer',
    'full_edit_brief_frozen_in_approved_snapshot',
  ],
  fingerprint,
  status: 'passed',
}, null, 2))
