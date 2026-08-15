import assert from 'node:assert/strict'

import {
  createReEditProIntelligenceResponsibilityPlan,
  evaluateReEditProIntelligenceWorkflowTransition,
  listReEditProIntelligenceResponsibilityBindings,
  resolveReEditProIntelligenceInvalidation,
  resolveReEditProIntelligenceRoleForTask,
  validateReEditProIntelligenceResponsibilityArchitecture,
} from '../../src/lib/intelligence-orchestration-contract'
import { createProfessionalSkillPlan } from '../../src/lib/professional-skills'
import {
  REEDITPRO_INTELLIGENCE_WORKFLOW_STAGES,
  type ReEditProIntelligenceWorkflowEvidence,
} from '../../src/types/intelligence-orchestration'
import type { PlannerInput } from '../../src/types/reeditpro'

const architecture = validateReEditProIntelligenceResponsibilityArchitecture()
const bindings = listReEditProIntelligenceResponsibilityBindings()

assert.equal(architecture.valid, true)
assert.deepEqual(architecture.blockers, [])
assert.equal(architecture.checkedRoleCount, 5)
assert.equal(architecture.checkedTaskCount, 9)
assert.equal(architecture.noProviderCall, true)
assert.deepEqual(
  bindings.map((binding) => binding.roleId),
  [
    'visual_analyst',
    'creative_director',
    'operations_orchestrator',
    'engineering_specialist',
    'final_judge',
  ],
)

const visual = resolveReEditProIntelligenceRoleForTask('source_visual_analysis')
assert.equal(visual.roleId, 'visual_analyst')
assert.equal(visual.authorityId, 'visual_intelligence')
assert.deepEqual(visual.modelRoleIds, ['visual_intelligence_gemini_pro_high'])
assert.deepEqual(visual.allowedRequestedUses, ['visual_understanding'])
assert.equal(
  visual.forbiddenActions.some((action) => /final narrative|creative direction/i.test(action)),
  true,
)

const creative = resolveReEditProIntelligenceRoleForTask('creative_blueprint')
assert.equal(creative.roleId, 'creative_director')
assert.deepEqual(
  creative.modelRoleIds,
  [
    'kimi_k3_main_edit_agent',
    'gpt_5_6_terra_fallback_edit_agent',
    'deepseek_v4_tool_code_agent',
  ],
)
assert.equal(creative.invocationPolicy, 'ordered_single_active_reasoning_attempt')

const operations = resolveReEditProIntelligenceRoleForTask('tool_graph_compilation')
assert.equal(operations.roleId, 'operations_orchestrator')
assert.deepEqual(operations.modelRoleIds, [])
assert.equal(operations.authorityId, 'canonical_private_work_graph_orchestrator')
assert.equal(operations.invocationPolicy, 'no_model_call_deterministic_runtime')

const engineering = resolveReEditProIntelligenceRoleForTask(
  'engineering_failure_diagnosis',
)
assert.equal(engineering.roleId, 'engineering_specialist')
assert.deepEqual(engineering.modelRoleIds, [])
assert.equal(
  engineering.forbiddenActions.some((action) => /arbitrary.*shell/i.test(action)),
  true,
)

const finalJudge = resolveReEditProIntelligenceRoleForTask(
  'exceptional_quality_judgment',
)
assert.equal(finalJudge.roleId, 'final_judge')
assert.deepEqual(finalJudge.modelRoleIds, [])
assert.equal(finalJudge.invocationPolicy, 'recommendation_only_never_user_approval')

assert.equal(
  creative.modelRoleIds.includes('qwen_3_7_main_edit_agent'),
  false,
  'Qwen 3.7 must not re-enter the active head-reasoning route.',
)

const validPlan = createReEditProIntelligenceResponsibilityPlan({
  availableModelRoleIds: [
    'kimi_k3_main_edit_agent',
    'gpt_5_6_terra_fallback_edit_agent',
    'deepseek_v4_tool_code_agent',
    'visual_intelligence_gemini_pro_high',
  ],
  requestedTasks: [
    'source_visual_analysis',
    'creative_blueprint',
    'tool_graph_compilation',
  ],
})
assert.equal(validPlan.valid, true)
assert.deepEqual(validPlan.blockers, [])
assert.equal(validPlan.noEagerEnsemble, true)
assert.equal(validPlan.oneActiveReasoningAttemptAtATime, true)
assert.equal(validPlan.providerCallsStarted, false)
assert.equal(validPlan.toolExecutionStarted, false)
assert.equal(validPlan.renderStarted, false)
assert.equal(validPlan.customerChargeCreated, false)
assert.equal(
  validPlan.assignments.every(
    (assignment) => !assignment.eagerInvocationAllowed && assignment.invocationCount === 0,
  ),
  true,
)

const missingFallback = createReEditProIntelligenceResponsibilityPlan({
  availableModelRoleIds: [
    'kimi_k3_main_edit_agent',
    'gpt_5_6_terra_fallback_edit_agent',
  ],
  requestedTasks: ['creative_blueprint'],
})
assert.equal(missingFallback.valid, false)
assert.equal(
  missingFallback.blockers.some((blocker) => /deepseek_v4_tool_code_agent/i.test(blocker)),
  true,
)

const plannerInput: PlannerInput = {
  projectName: 'Role-routed professional edit',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'education_explainer',
  workflowType: 'education_explainer',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'premium',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions:
    'Build a clear professional story, keep the strongest source moments, and use restrained B-roll.',
  creditPreference: 'balanced',
  clips: [{
    id: 'clip-intelligence-smoke-1',
    uploadedOrder: 1,
    fileName: 'interview-source.mp4',
    duration: '2:00',
    detectedType: 'talking_head',
    sourceOrderLocked: true,
  }],
}
const professionalPlan = createProfessionalSkillPlan({ plannerInput })
assert.equal(professionalPlan.intelligenceResponsibilityPlan.valid, true)
assert.equal(professionalPlan.intelligenceResponsibilityPlan.noEagerEnsemble, true)
assert.equal(professionalPlan.intelligenceResponsibilityPlan.providerCallsStarted, false)
assert.equal(
  professionalPlan.intelligenceResponsibilityPlan.assignments.some(
    (assignment) =>
      assignment.roleId === 'creative_director'
      && assignment.status === 'planned'
      && assignment.selectedTasks.includes('creative_blueprint'),
  ),
  true,
)
assert.equal(
  professionalPlan.intelligenceResponsibilityPlan.assignments.some(
    (assignment) =>
      assignment.roleId === 'operations_orchestrator'
      && assignment.status === 'planned'
      && assignment.selectedTasks.includes('tool_graph_compilation'),
  ),
  true,
)

const incompleteEvidence: ReEditProIntelligenceWorkflowEvidence = {
  sourceAuthorityBound: true,
  sourceSequenceDisposition: 'confirmed',
  deterministicAnalysisComplete: true,
  visualEvidenceDisposition: 'verified',
  editBriefPreferenceAndFrameBound: true,
  creativeBlueprintReady: true,
  planPresented: true,
  estimatePresented: true,
  userApprovalRecorded: false,
  workGraphStarted: false,
  privateRoughCutReady: false,
  technicalQaPassed: false,
  creativeReviewPassed: false,
  correctionsResolved: false,
  finalQaPassed: false,
  privateFinalRenderReady: false,
  privateDeliveryReady: false,
}

const approvalBlocked = evaluateReEditProIntelligenceWorkflowTransition({
  currentStage: 'plan_and_estimate_presented',
  requestedStage: 'user_approval_recorded',
  evidence: incompleteEvidence,
})
assert.equal(approvalBlocked.allowed, false)
assert.equal(approvalBlocked.blockers.some((blocker) => /explicit user approval/i.test(blocker)), true)

const executionBlocked = evaluateReEditProIntelligenceWorkflowTransition({
  currentStage: 'execution_package_ready',
  requestedStage: 'work_graph_executing',
  evidence: incompleteEvidence,
})
assert.equal(executionBlocked.allowed, false)
assert.equal(executionBlocked.blockers.some((blocker) => /user approval/i.test(blocker)), true)
assert.equal(executionBlocked.blockers.some((blocker) => /approved snapshot/i.test(blocker)), true)
assert.equal(executionBlocked.blockers.some((blocker) => /credit reservation/i.test(blocker)), true)
assert.equal(executionBlocked.noToolExecution, true)

const completeEvidence: ReEditProIntelligenceWorkflowEvidence = {
  ...incompleteEvidence,
  userApprovalRecorded: true,
  approvedSnapshotId: 'approved-snapshot-intelligence-smoke',
  activeCreditReservationId: 'credit-reservation-intelligence-smoke',
  executionPackageId: 'execution-package-intelligence-smoke',
  workGraphStarted: true,
  privateRoughCutReady: true,
  technicalQaPassed: true,
  creativeReviewPassed: true,
  correctionsResolved: true,
  finalQaPassed: true,
  privateFinalRenderReady: true,
  privateDeliveryReady: true,
}

for (let index = 0; index < REEDITPRO_INTELLIGENCE_WORKFLOW_STAGES.length - 1; index += 1) {
  const transition = evaluateReEditProIntelligenceWorkflowTransition({
    currentStage: REEDITPRO_INTELLIGENCE_WORKFLOW_STAGES[index],
    requestedStage: REEDITPRO_INTELLIGENCE_WORKFLOW_STAGES[index + 1],
    evidence: completeEvidence,
  })
  assert.equal(
    transition.allowed,
    true,
    `${transition.currentStage} -> ${transition.requestedStage}: ${transition.blockers.join(', ')}`,
  )
  assert.equal(transition.noStateMutationPerformed, true)
}

const skippedStage = evaluateReEditProIntelligenceWorkflowTransition({
  currentStage: 'planning_inputs_bound',
  requestedStage: 'plan_and_estimate_presented',
  evidence: completeEvidence,
})
assert.equal(skippedStage.allowed, false)
assert.equal(skippedStage.blockers.some((blocker) => /persisted canonical sequence/i.test(blocker)), true)

const replay = evaluateReEditProIntelligenceWorkflowTransition({
  currentStage: 'technical_qa_complete',
  requestedStage: 'technical_qa_complete',
  evidence: incompleteEvidence,
})
assert.equal(replay.allowed, true)
assert.equal(replay.replay, true)

const frameInvalidation = resolveReEditProIntelligenceInvalidation('output_frame')
assert.equal(frameInvalidation.invalidateFromStage, 'planning_inputs_bound')
assert.equal(frameInvalidation.approvalResetRequired, true)
assert.equal(frameInvalidation.estimateResetRequired, true)
assert.equal(frameInvalidation.approvedSnapshotImmutable, true)
assert.equal(frameInvalidation.newSnapshotCycleRequired, true)

console.log(JSON.stringify({
  ok: true,
  contractVersion: validPlan.contractVersion,
  responsibilityRoleCount: architecture.checkedRoleCount,
  routedTaskCount: architecture.checkedTaskCount,
  workflowStageCount: REEDITPRO_INTELLIGENCE_WORKFLOW_STAGES.length,
  professionalPlanCarriesResponsibilityPlan: true,
  eagerEnsembleBlocked: true,
  userApprovalAndSnapshotGatePreserved: true,
  providerCallMade: false,
  toolExecutionStarted: false,
  customerChargeCreated: false,
}, null, 2))
