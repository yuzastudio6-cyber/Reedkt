import type {
  ReEditProIntelligenceInvalidationDomain,
  ReEditProIntelligenceInvalidationResult,
  ReEditProIntelligenceResponsibilityAssignment,
  ReEditProIntelligenceResponsibilityBinding,
  ReEditProIntelligenceResponsibilityPlan,
  ReEditProIntelligenceResponsibilityRoleId,
  ReEditProIntelligenceTaskType,
  ReEditProIntelligenceWorkflowEvidence,
  ReEditProIntelligenceWorkflowStage,
  ReEditProIntelligenceWorkflowTransitionResult,
} from '../types/intelligence-orchestration'
import {
  REEDITPRO_INTELLIGENCE_WORKFLOW_STAGES,
} from '../types/intelligence-orchestration'
import type { ReEditProModelRoleId } from '../types/model-role-routing'
import {
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
  validateReEditProReasoningModelRouteChain,
} from './reasoning-model-routing-contract'

export const REEDITPRO_INTELLIGENCE_RESPONSIBILITY_CONTRACT_VERSION =
  'reeditpro-intelligence-responsibility-v1'

const canonicalReasoningRouteModelRoles: ReEditProModelRoleId[] = [
  'kimi_k3_main_edit_agent',
  'qwen_3_7_main_edit_agent',
  'deepseek_v4_tool_code_agent',
]

export const REEDITPRO_INTELLIGENCE_RESPONSIBILITY_BINDINGS:
  readonly ReEditProIntelligenceResponsibilityBinding[] = [
    {
      roleId: 'visual_analyst',
      displayName: 'Visual evidence analyst',
      authorityKind: 'canonical_visual_specialist',
      authorityId: 'qwen2_5_vl_visual_understanding',
      modelRoleIds: ['qwen2_5_vl_visual_understanding'],
      allowedRequestedUses: ['visual_understanding'],
      taskTypes: ['source_visual_analysis', 'technical_visual_qa'],
      activationMode: 'only_when_visual_evidence_is_required',
      invocationPolicy: 'one_specialist_attempt_per_approved_task',
      allowedOutputs: [
        'source-bound timestamped visual evidence',
        'scene and clip catalog evidence',
        'technical visual QA findings with uncertainty',
      ],
      forbiddenActions: [
        'choose final narrative or creative direction',
        'create or approve an edit plan',
        'execute media tools or render work',
      ],
      costBoundary:
        'Visual analysis is a separately authorized specialist attempt; proxy/sample scope and internal cost evidence are required.',
    },
    {
      roleId: 'creative_director',
      displayName: 'Creative direction and review',
      authorityKind: 'ordered_reasoning_route',
      authorityId: REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
      modelRoleIds: [...canonicalReasoningRouteModelRoles],
      allowedRequestedUses: [
        'user_reasoning',
        'edit_planning',
        'creative_edit_strategy',
        'edit_qa_reasoning',
      ],
      taskTypes: [
        'creative_blueprint',
        'rough_cut_creative_review',
        'creative_correction_request',
      ],
      activationMode: 'meaningful_creative_checkpoints_only',
      invocationPolicy: 'ordered_single_active_reasoning_attempt',
      allowedOutputs: [
        'structured creative blueprint',
        'timestamped rough-cut review',
        'bounded creative correction request',
      ],
      forbiddenActions: [
        'invoke every fallback route eagerly',
        'claim direct visual inspection without specialist evidence',
        'run tools, workers, renderers, storage, billing, or delivery',
      ],
      costBoundary:
        'Kimi is primary; Qwen 3.7 and DeepSeek V4 Pro are ordered fallback candidates, never an eager ensemble.',
    },
    {
      roleId: 'operations_orchestrator',
      displayName: 'Deterministic edit operations orchestrator',
      authorityKind: 'deterministic_backend_authority',
      authorityId: 'canonical_private_work_graph_orchestrator',
      modelRoleIds: [],
      allowedRequestedUses: [],
      taskTypes: [
        'tool_graph_compilation',
        'routine_execution_reconciliation',
      ],
      activationMode: 'deterministic_after_approved_snapshot',
      invocationPolicy: 'no_model_call_deterministic_runtime',
      allowedOutputs: [
        'approved-snapshot-bound work graph',
        'bounded tool selection and dependency plan',
        'idempotent job, checkback, retry, and reconciliation decisions',
      ],
      forbiddenActions: [
        'silently change the approved creative blueprint',
        'start expensive work before approval, estimate, snapshot, and reservation',
        'invent a parallel queue, lease, artifact, or cost authority',
      ],
      costBoundary:
        'Server-owned queue, lease, tool, artifact, and attempt-cost authorities remain canonical; no model fee is implied.',
    },
    {
      roleId: 'engineering_specialist',
      displayName: 'Operator-reviewed engineering escalation',
      authorityKind: 'operator_reviewed_engineering_boundary',
      authorityId: 'reviewed_engineering_change_boundary',
      modelRoleIds: [],
      allowedRequestedUses: [],
      taskTypes: ['engineering_failure_diagnosis'],
      activationMode: 'repeated_or_cross_service_failure_only',
      invocationPolicy: 'no_automatic_customer_job_model_call',
      allowedOutputs: [
        'sanitized engineering diagnosis',
        'minimal patch and focused test proposal',
        'reviewable tool-adapter change request',
      ],
      forbiddenActions: [
        'change creative direction',
        'execute arbitrary model-generated shell commands',
        'patch production during an unreviewed customer edit job',
      ],
      costBoundary:
        'Engineering escalation is outside ordinary customer edit execution and requires operator review, sandboxing, allowlists, and audit.',
    },
    {
      roleId: 'final_judge',
      displayName: 'Exceptional quality and risk review',
      authorityKind: 'user_and_policy_review_boundary',
      authorityId: 'canonical_user_approval_and_exception_review',
      modelRoleIds: [],
      allowedRequestedUses: [],
      taskTypes: ['exceptional_quality_judgment'],
      activationMode: 'exceptional_dispute_or_risk_only',
      invocationPolicy: 'recommendation_only_never_user_approval',
      allowedOutputs: [
        'approve existing recommendation',
        'request a targeted revision',
        'require human review',
      ],
      forbiddenActions: [
        'replace the user approval or credit-estimate gate',
        'regenerate an entire edit for one disputed decision',
        'mutate an immutable approved snapshot',
      ],
      costBoundary:
        'No final-judge model is active by default; the user and canonical policy gates remain authoritative.',
    },
  ]

export function listReEditProIntelligenceResponsibilityBindings():
  ReEditProIntelligenceResponsibilityBinding[] {
  return REEDITPRO_INTELLIGENCE_RESPONSIBILITY_BINDINGS.map((binding) => ({
    ...binding,
    modelRoleIds: [...binding.modelRoleIds],
    allowedRequestedUses: [...binding.allowedRequestedUses],
    taskTypes: [...binding.taskTypes],
    allowedOutputs: [...binding.allowedOutputs],
    forbiddenActions: [...binding.forbiddenActions],
  }))
}

export function getReEditProIntelligenceResponsibilityBinding(
  roleId: ReEditProIntelligenceResponsibilityRoleId,
): ReEditProIntelligenceResponsibilityBinding {
  const binding = REEDITPRO_INTELLIGENCE_RESPONSIBILITY_BINDINGS.find(
    (candidate) => candidate.roleId === roleId,
  )
  if (!binding) throw new Error(`Missing ReEditPro intelligence role: ${roleId}`)
  return listReEditProIntelligenceResponsibilityBindings()
    .find((candidate) => candidate.roleId === roleId)!
}

export function resolveReEditProIntelligenceRoleForTask(
  taskType: ReEditProIntelligenceTaskType,
): ReEditProIntelligenceResponsibilityBinding {
  const matches = REEDITPRO_INTELLIGENCE_RESPONSIBILITY_BINDINGS.filter(
    (binding) => binding.taskTypes.includes(taskType),
  )
  if (matches.length !== 1) {
    throw new Error(
      `Intelligence task ${taskType} must resolve to exactly one responsibility role.`,
    )
  }
  return getReEditProIntelligenceResponsibilityBinding(matches[0].roleId)
}

export function validateReEditProIntelligenceResponsibilityArchitecture(): {
  valid: boolean
  blockers: string[]
  checkedRoleCount: number
  checkedTaskCount: number
  noProviderCall: true
} {
  const blockers: string[] = []
  const roleIds = new Set<ReEditProIntelligenceResponsibilityRoleId>()
  const taskOwners = new Map<ReEditProIntelligenceTaskType, string[]>()

  for (const binding of REEDITPRO_INTELLIGENCE_RESPONSIBILITY_BINDINGS) {
    if (roleIds.has(binding.roleId)) blockers.push(`Duplicate intelligence role ${binding.roleId}.`)
    roleIds.add(binding.roleId)
    for (const task of binding.taskTypes) {
      taskOwners.set(task, [...(taskOwners.get(task) ?? []), binding.roleId])
    }
  }

  for (const [task, owners] of taskOwners) {
    if (owners.length !== 1) blockers.push(`${task} has ${owners.length} responsibility owners.`)
  }

  const visual = getReEditProIntelligenceResponsibilityBinding('visual_analyst')
  if (
    visual.modelRoleIds.join(',') !== 'qwen2_5_vl_visual_understanding'
    || visual.allowedRequestedUses.join(',') !== 'visual_understanding'
  ) blockers.push('Visual Analyst must remain bound only to the Qwen visual specialist role.')

  const creative = getReEditProIntelligenceResponsibilityBinding('creative_director')
  if (
    creative.modelRoleIds.join(',') !== canonicalReasoningRouteModelRoles.join(',')
    || creative.invocationPolicy !== 'ordered_single_active_reasoning_attempt'
  ) blockers.push('Creative Director must use the exact ordered Kimi/Qwen/DeepSeek route.')

  const operations = getReEditProIntelligenceResponsibilityBinding(
    'operations_orchestrator',
  )
  if (
    operations.modelRoleIds.length > 0
    || operations.authorityKind !== 'deterministic_backend_authority'
    || operations.invocationPolicy !== 'no_model_call_deterministic_runtime'
  ) blockers.push('Operations Orchestrator must remain the deterministic canonical work graph.')

  const engineering = getReEditProIntelligenceResponsibilityBinding(
    'engineering_specialist',
  )
  if (
    engineering.modelRoleIds.length > 0
    || !engineering.forbiddenActions.some((item) => /arbitrary.*shell/i.test(item))
  ) blockers.push('Engineering escalation must remain operator-reviewed and shell-safe.')

  const judge = getReEditProIntelligenceResponsibilityBinding('final_judge')
  if (
    judge.modelRoleIds.length > 0
    || judge.invocationPolicy !== 'recommendation_only_never_user_approval'
  ) blockers.push('Final Judge must remain exceptional and cannot replace user approval.')

  const reasoningRoute = validateReEditProReasoningModelRouteChain()
  blockers.push(...reasoningRoute.errors)

  return {
    valid: blockers.length === 0,
    blockers: unique(blockers),
    checkedRoleCount: REEDITPRO_INTELLIGENCE_RESPONSIBILITY_BINDINGS.length,
    checkedTaskCount: taskOwners.size,
    noProviderCall: true,
  }
}

export function createReEditProIntelligenceResponsibilityPlan(input: {
  availableModelRoleIds: readonly ReEditProModelRoleId[]
  requestedTasks: readonly ReEditProIntelligenceTaskType[]
}): ReEditProIntelligenceResponsibilityPlan {
  const architecture = validateReEditProIntelligenceResponsibilityArchitecture()
  const requestedTasks = unique(input.requestedTasks)
  const availableModelRoles = new Set(input.availableModelRoleIds)
  const blockers = [...architecture.blockers]
  const assignments: ReEditProIntelligenceResponsibilityAssignment[] =
    REEDITPRO_INTELLIGENCE_RESPONSIBILITY_BINDINGS.map((binding) => {
      const selectedTasks = binding.taskTypes.filter((task) => requestedTasks.includes(task))
      const missingModelRoles = binding.modelRoleIds.filter(
        (roleId) => !availableModelRoles.has(roleId),
      )
      if (selectedTasks.length > 0 && missingModelRoles.length > 0) {
        blockers.push(
          `${binding.roleId} is missing configured model role(s): ${missingModelRoles.join(', ')}.`,
        )
      }
      const status: ReEditProIntelligenceResponsibilityAssignment['status'] =
        selectedTasks.length > 0
          ? 'planned'
          : binding.roleId === 'visual_analyst'
              || binding.roleId === 'operations_orchestrator'
            ? 'conditional'
            : 'dormant'
      return {
        roleId: binding.roleId,
        status,
        selectedTasks,
        reason: selectedTasks.length > 0
          ? `Selected only for ${selectedTasks.join(', ')}.`
          : `${binding.displayName} is not invoked for this planning pass.`,
        candidateModelRoleIds: [...binding.modelRoleIds],
        eagerInvocationAllowed: false,
        invocationCount: 0,
      }
    })

  for (const task of requestedTasks) {
    resolveReEditProIntelligenceRoleForTask(task)
  }

  const uniqueBlockers = unique(blockers)
  return {
    source: 'reeditpro_intelligence_responsibility_contract',
    contractVersion: REEDITPRO_INTELLIGENCE_RESPONSIBILITY_CONTRACT_VERSION,
    routingPolicy: 'least_expensive_qualified_role_for_exact_task',
    assignments,
    noEagerEnsemble: true,
    oneActiveReasoningAttemptAtATime: true,
    deterministicToolsPerformMediaOperations: true,
    approvedSnapshotRequiredBeforeExpensiveExecution: true,
    userApprovalRemainsCanonical: true,
    providerCallsStarted: false,
    toolExecutionStarted: false,
    renderStarted: false,
    customerChargeCreated: false,
    valid: uniqueBlockers.length === 0,
    blockers: uniqueBlockers,
  }
}

export function evaluateReEditProIntelligenceWorkflowTransition(input: {
  currentStage: ReEditProIntelligenceWorkflowStage
  requestedStage: ReEditProIntelligenceWorkflowStage
  evidence: ReEditProIntelligenceWorkflowEvidence
}): ReEditProIntelligenceWorkflowTransitionResult {
  const currentIndex = workflowStageIndex(input.currentStage)
  const requestedIndex = workflowStageIndex(input.requestedStage)
  const replay = currentIndex === requestedIndex
  const blockers: string[] = []

  if (requestedIndex < currentIndex) {
    blockers.push('Workflow stages are immutable; invalidation starts a new plan cycle.')
  }
  if (requestedIndex > currentIndex + 1) {
    blockers.push('Workflow stages must advance through the persisted canonical sequence.')
  }
  if (!replay) blockers.push(...stageEvidenceBlockers(input.requestedStage, input.evidence))

  return {
    allowed: blockers.length === 0,
    currentStage: input.currentStage,
    requestedStage: input.requestedStage,
    blockers: unique(blockers),
    replay,
    nextRoleIds: roleIdsForStage(input.requestedStage),
    noStateMutationPerformed: true,
    noProviderCall: true,
    noToolExecution: true,
    noRender: true,
    noCustomerCharge: true,
  }
}

export function resolveReEditProIntelligenceInvalidation(
  changedDomain: ReEditProIntelligenceInvalidationDomain,
): ReEditProIntelligenceInvalidationResult {
  const invalidateFromStage: Record<
    ReEditProIntelligenceInvalidationDomain,
    ReEditProIntelligenceWorkflowStage
  > = {
    source_authority: 'source_authority_ready',
    source_sequence: 'source_sequence_confirmed',
    edit_brief: 'planning_inputs_bound',
    edit_preferences: 'planning_inputs_bound',
    output_frame: 'planning_inputs_bound',
    creative_blueprint: 'creative_blueprint_ready',
    approved_plan: 'plan_and_estimate_presented',
    quality_evidence: 'technical_qa_complete',
  }
  const stage = invalidateFromStage[changedDomain]
  const stageIndex = workflowStageIndex(stage)
  const approvalIndex = workflowStageIndex('user_approval_recorded')
  return {
    changedDomain,
    invalidateFromStage: stage,
    approvalResetRequired: stageIndex <= approvalIndex,
    estimateResetRequired: stageIndex <= workflowStageIndex('plan_and_estimate_presented'),
    approvedSnapshotImmutable: true,
    newSnapshotCycleRequired: stageIndex <= workflowStageIndex(
      'approved_snapshot_and_reservation_ready',
    ),
  }
}

function stageEvidenceBlockers(
  stage: ReEditProIntelligenceWorkflowStage,
  evidence: ReEditProIntelligenceWorkflowEvidence,
): string[] {
  const blockers: string[] = []
  const require = (condition: boolean, message: string) => {
    if (!condition) blockers.push(message)
  }
  const approvedExecutionAuthority = () => {
    require(evidence.userApprovalRecorded, 'User approval is required.')
    require(Boolean(evidence.approvedSnapshotId?.trim()), 'Approved snapshot is required.')
    require(
      Boolean(evidence.activeCreditReservationId?.trim()),
      'Active credit reservation is required.',
    )
  }

  switch (stage) {
    case 'project_created':
      break
    case 'source_authority_ready':
      require(evidence.sourceAuthorityBound, 'Server-verified source authority is required.')
      break
    case 'source_sequence_confirmed':
      require(
        evidence.sourceSequenceDisposition === 'confirmed'
          || evidence.sourceSequenceDisposition === 'not_applicable_verified_idea_first',
        'Source sequence confirmation or exact verified idea-first authority is required.',
      )
      break
    case 'deterministic_analysis_ready':
      require(
        evidence.deterministicAnalysisComplete,
        'Deterministic source analysis must complete first.',
      )
      break
    case 'visual_evidence_ready':
      require(
        evidence.visualEvidenceDisposition === 'verified'
          || evidence.visualEvidenceDisposition === 'not_applicable_verified_idea_first',
        'Verified visual evidence or exact idea-first not-applicable authority is required.',
      )
      break
    case 'planning_inputs_bound':
      require(
        evidence.editBriefPreferenceAndFrameBound,
        'Edit Brief, preferences, source, and confirmed output frame must be bound.',
      )
      break
    case 'creative_blueprint_ready':
      require(evidence.creativeBlueprintReady, 'Structured creative blueprint is required.')
      break
    case 'plan_and_estimate_presented':
      require(evidence.planPresented, 'Canonical edit plan must be presented.')
      require(evidence.estimatePresented, 'Credit estimate must be presented.')
      break
    case 'user_approval_recorded':
      require(evidence.userApprovalRecorded, 'Explicit user approval is required.')
      break
    case 'approved_snapshot_and_reservation_ready':
      approvedExecutionAuthority()
      break
    case 'execution_package_ready':
      approvedExecutionAuthority()
      require(Boolean(evidence.executionPackageId?.trim()), 'Execution package is required.')
      break
    case 'work_graph_executing':
      approvedExecutionAuthority()
      require(evidence.workGraphStarted, 'Canonical work graph must be started.')
      break
    case 'private_rough_cut_ready':
      approvedExecutionAuthority()
      require(evidence.privateRoughCutReady, 'Private rough cut is required.')
      break
    case 'technical_qa_complete':
      approvedExecutionAuthority()
      require(evidence.technicalQaPassed, 'Technical QA must pass.')
      break
    case 'creative_review_complete':
      approvedExecutionAuthority()
      require(evidence.creativeReviewPassed, 'Creative review must pass.')
      break
    case 'corrections_complete':
      approvedExecutionAuthority()
      require(evidence.correctionsResolved, 'Approved corrections must be resolved.')
      break
    case 'final_qa_complete':
      approvedExecutionAuthority()
      require(evidence.finalQaPassed, 'Final QA must pass.')
      break
    case 'private_final_render_ready':
      approvedExecutionAuthority()
      require(evidence.privateFinalRenderReady, 'Private final render must be ready.')
      break
    case 'private_delivery_ready':
      approvedExecutionAuthority()
      require(evidence.privateDeliveryReady, 'Private delivery authority must be ready.')
      break
  }
  return blockers
}

function roleIdsForStage(
  stage: ReEditProIntelligenceWorkflowStage,
): ReEditProIntelligenceResponsibilityRoleId[] {
  switch (stage) {
    case 'visual_evidence_ready':
    case 'technical_qa_complete':
      return ['visual_analyst', 'operations_orchestrator']
    case 'creative_blueprint_ready':
    case 'creative_review_complete':
      return ['creative_director']
    case 'plan_and_estimate_presented':
      return ['creative_director', 'operations_orchestrator']
    case 'project_created':
    case 'source_authority_ready':
    case 'source_sequence_confirmed':
    case 'deterministic_analysis_ready':
    case 'planning_inputs_bound':
    case 'approved_snapshot_and_reservation_ready':
    case 'execution_package_ready':
    case 'work_graph_executing':
    case 'private_rough_cut_ready':
    case 'corrections_complete':
    case 'final_qa_complete':
    case 'private_final_render_ready':
    case 'private_delivery_ready':
      return ['operations_orchestrator']
    case 'user_approval_recorded':
      return []
  }
}

function workflowStageIndex(stage: ReEditProIntelligenceWorkflowStage): number {
  return REEDITPRO_INTELLIGENCE_WORKFLOW_STAGES.indexOf(stage)
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values))
}
