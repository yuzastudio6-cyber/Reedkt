import type {
  ReEditProModelRoleId,
  ReEditProRequestedModelUse,
} from './model-role-routing'

export const REEDITPRO_INTELLIGENCE_RESPONSIBILITY_ROLE_IDS = [
  'visual_analyst',
  'creative_director',
  'operations_orchestrator',
  'engineering_specialist',
  'final_judge',
] as const

export type ReEditProIntelligenceResponsibilityRoleId =
  (typeof REEDITPRO_INTELLIGENCE_RESPONSIBILITY_ROLE_IDS)[number]

export const REEDITPRO_INTELLIGENCE_TASK_TYPES = [
  'source_visual_analysis',
  'technical_visual_qa',
  'creative_blueprint',
  'rough_cut_creative_review',
  'creative_correction_request',
  'tool_graph_compilation',
  'routine_execution_reconciliation',
  'engineering_failure_diagnosis',
  'exceptional_quality_judgment',
] as const

export type ReEditProIntelligenceTaskType =
  (typeof REEDITPRO_INTELLIGENCE_TASK_TYPES)[number]

export type ReEditProIntelligenceAuthorityKind =
  | 'canonical_visual_specialist'
  | 'ordered_reasoning_route'
  | 'deterministic_backend_authority'
  | 'operator_reviewed_engineering_boundary'
  | 'user_and_policy_review_boundary'

export type ReEditProIntelligenceActivationMode =
  | 'only_when_visual_evidence_is_required'
  | 'meaningful_creative_checkpoints_only'
  | 'deterministic_after_approved_snapshot'
  | 'repeated_or_cross_service_failure_only'
  | 'exceptional_dispute_or_risk_only'

export type ReEditProIntelligenceInvocationPolicy =
  | 'one_specialist_attempt_per_approved_task'
  | 'ordered_single_active_reasoning_attempt'
  | 'no_model_call_deterministic_runtime'
  | 'no_automatic_customer_job_model_call'
  | 'recommendation_only_never_user_approval'

export interface ReEditProIntelligenceResponsibilityBinding {
  roleId: ReEditProIntelligenceResponsibilityRoleId
  displayName: string
  authorityKind: ReEditProIntelligenceAuthorityKind
  authorityId: string
  modelRoleIds: ReEditProModelRoleId[]
  allowedRequestedUses: ReEditProRequestedModelUse[]
  taskTypes: ReEditProIntelligenceTaskType[]
  activationMode: ReEditProIntelligenceActivationMode
  invocationPolicy: ReEditProIntelligenceInvocationPolicy
  allowedOutputs: string[]
  forbiddenActions: string[]
  costBoundary: string
}

export type ReEditProIntelligenceAssignmentStatus =
  | 'planned'
  | 'conditional'
  | 'dormant'

export interface ReEditProIntelligenceResponsibilityAssignment {
  roleId: ReEditProIntelligenceResponsibilityRoleId
  status: ReEditProIntelligenceAssignmentStatus
  selectedTasks: ReEditProIntelligenceTaskType[]
  reason: string
  candidateModelRoleIds: ReEditProModelRoleId[]
  eagerInvocationAllowed: false
  invocationCount: 0
}

export interface ReEditProIntelligenceResponsibilityPlan {
  source: 'reeditpro_intelligence_responsibility_contract'
  contractVersion: string
  routingPolicy: 'least_expensive_qualified_role_for_exact_task'
  assignments: ReEditProIntelligenceResponsibilityAssignment[]
  noEagerEnsemble: true
  oneActiveReasoningAttemptAtATime: true
  deterministicToolsPerformMediaOperations: true
  approvedSnapshotRequiredBeforeExpensiveExecution: true
  userApprovalRemainsCanonical: true
  providerCallsStarted: false
  toolExecutionStarted: false
  renderStarted: false
  customerChargeCreated: false
  valid: boolean
  blockers: string[]
}

export const REEDITPRO_INTELLIGENCE_WORKFLOW_STAGES = [
  'project_created',
  'source_authority_ready',
  'source_sequence_confirmed',
  'deterministic_analysis_ready',
  'visual_evidence_ready',
  'planning_inputs_bound',
  'creative_blueprint_ready',
  'plan_and_estimate_presented',
  'user_approval_recorded',
  'approved_snapshot_and_reservation_ready',
  'execution_package_ready',
  'work_graph_executing',
  'private_rough_cut_ready',
  'technical_qa_complete',
  'creative_review_complete',
  'corrections_complete',
  'final_qa_complete',
  'private_final_render_ready',
  'private_delivery_ready',
] as const

export type ReEditProIntelligenceWorkflowStage =
  (typeof REEDITPRO_INTELLIGENCE_WORKFLOW_STAGES)[number]

export interface ReEditProIntelligenceWorkflowEvidence {
  sourceAuthorityBound: boolean
  sourceSequenceDisposition:
    | 'missing'
    | 'confirmed'
    | 'not_applicable_verified_idea_first'
  deterministicAnalysisComplete: boolean
  visualEvidenceDisposition:
    | 'missing'
    | 'verified'
    | 'not_applicable_verified_idea_first'
  editBriefPreferenceAndFrameBound: boolean
  creativeBlueprintReady: boolean
  planPresented: boolean
  estimatePresented: boolean
  userApprovalRecorded: boolean
  approvedSnapshotId?: string
  activeCreditReservationId?: string
  executionPackageId?: string
  workGraphStarted: boolean
  privateRoughCutReady: boolean
  technicalQaPassed: boolean
  creativeReviewPassed: boolean
  correctionsResolved: boolean
  finalQaPassed: boolean
  privateFinalRenderReady: boolean
  privateDeliveryReady: boolean
}

export interface ReEditProIntelligenceWorkflowTransitionResult {
  allowed: boolean
  currentStage: ReEditProIntelligenceWorkflowStage
  requestedStage: ReEditProIntelligenceWorkflowStage
  blockers: string[]
  replay: boolean
  nextRoleIds: ReEditProIntelligenceResponsibilityRoleId[]
  noStateMutationPerformed: true
  noProviderCall: true
  noToolExecution: true
  noRender: true
  noCustomerCharge: true
}

export const REEDITPRO_INTELLIGENCE_INVALIDATION_DOMAINS = [
  'source_authority',
  'source_sequence',
  'edit_brief',
  'edit_preferences',
  'output_frame',
  'creative_blueprint',
  'approved_plan',
  'quality_evidence',
] as const

export type ReEditProIntelligenceInvalidationDomain =
  (typeof REEDITPRO_INTELLIGENCE_INVALIDATION_DOMAINS)[number]

export interface ReEditProIntelligenceInvalidationResult {
  changedDomain: ReEditProIntelligenceInvalidationDomain
  invalidateFromStage: ReEditProIntelligenceWorkflowStage
  approvalResetRequired: boolean
  estimateResetRequired: boolean
  approvedSnapshotImmutable: true
  newSnapshotCycleRequired: boolean
}
