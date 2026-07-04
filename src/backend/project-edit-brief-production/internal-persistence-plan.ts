import {
  PROJECT_EDIT_BRIEF_INTERNAL_TESTING_REQUIRED_INVARIANTS,
  type ProjectEditBriefInternalTestingOwnerAcceptanceResult,
} from './internal-testing-readiness'

export type ProjectEditBriefInternalPersistencePlanDecision =
  | 'project_edit_brief_internal_persistence_plan_passed_ready_for_internal_backend_skeleton'
  | 'project_edit_brief_internal_persistence_plan_blocked_missing_internal_testing_acceptance'

export type ProjectEditBriefDurableRootStatus =
  | 'existing_repository_mapping'
  | 'future_migration_review_required'
  | 'metadata_only_currently'

export interface ProjectEditBriefDurableRootPlan {
  tableName: string
  purpose: string
  status: ProjectEditBriefDurableRootStatus
  ownerScope: 'workspace_project_session'
  writeModeForInternalTesting: 'mock_or_disabled_supabase_only'
  productionReleaseGate: string
}

export interface ProjectEditBriefInternalPersistencePlan {
  id: string
  milestone: 'RP-EDITBRIEF-16'
  decision: ProjectEditBriefInternalPersistencePlanDecision | string
  status: string
  requiredPriorDecision: ProjectEditBriefInternalTestingOwnerAcceptanceResult['decision']
  productionShapedImplementationRequired: boolean
  durableRoots: ProjectEditBriefDurableRootPlan[]
  repositoryModes: {
    currentMockMode: 'mock_database'
    currentSupabaseMode: 'supabase_disabled'
    futureServerMode: 'supabase_server'
  }
  routePolicy: {
    browserUsesApiClient: boolean
    serviceRoleBackendOnly: boolean
    directFrontendSupabaseForbidden: boolean
    idempotencyRequiredForWrites: boolean
    auditEventsRequiredForFutureWrites: boolean
  }
  blockedScope: {
    migrationAdded: false
    sqlExecuted: false
    supabaseCliCommandRun: false
    liveSupabaseReadEnabled: false
    liveSupabaseWriteEnabled: false
    storageWriteEnabled: false
    signedUrlCreated: false
    productionRouteEnabled: false
    providerOrModelCall: false
    mediaProcessing: false
    workerDispatch: false
    renderOrExportJob: false
    creditReservationOrSpend: false
    externalBetaAllowed: false
    paidProductionAllowed: false
  }
  releaseDelta: string[]
  hardInvariants: string[]
  nextMilestone: string
}

export interface ProjectEditBriefInternalPersistencePlanEvaluation {
  decision: ProjectEditBriefInternalPersistencePlanDecision
  readyForInternalBackendSkeleton: boolean
  durableRootCount: number
  blockedReasons: string[]
  nextMilestone: string
  externalBetaAllowed: false
  paidProductionAllowed: false
  liveSupabaseWriteEnabled: false
}

export const PROJECT_EDIT_BRIEF_DURABLE_ROOTS: ProjectEditBriefDurableRootPlan[] = [
  {
    tableName: 'edit_briefs',
    purpose: 'Project/session-level Edit Brief summary and workspace-scoped status.',
    status: 'existing_repository_mapping',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'migration_rls_and_owner_schema_review',
  },
  {
    tableName: 'edit_cues',
    purpose: 'Marker/cue rows for time-scoped editing instructions.',
    status: 'existing_repository_mapping',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'migration_rls_and_owner_schema_review',
  },
  {
    tableName: 'edit_cue_assets',
    purpose: 'Metadata-only cue attachment references until media lifecycle is approved.',
    status: 'metadata_only_currently',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'media_lifecycle_storage_and_privacy_review',
  },
  {
    tableName: 'edit_cue_messages',
    purpose: 'Marker Chat messages used to compile marker-scoped intent.',
    status: 'existing_repository_mapping',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'auth_rls_and_raw_prompt_safety_review',
  },
  {
    tableName: 'edit_cue_intents',
    purpose: 'Structured marker-scoped intent records for planner hint packaging.',
    status: 'existing_repository_mapping',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'approved_snapshot_planner_integration_review',
  },
  {
    tableName: 'edit_cue_confirmations',
    purpose: 'User confirmation records for marker intent and cue application.',
    status: 'existing_repository_mapping',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'approval_audit_and_auth_review',
  },
  {
    tableName: 'edit_cue_conflicts',
    purpose: 'Deterministic QA conflict records for markers and plan hints.',
    status: 'existing_repository_mapping',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'qa_policy_and_audit_review',
  },
  {
    tableName: 'edit_cue_revisions',
    purpose: 'Revision history for marker updates and recovery decisions.',
    status: 'existing_repository_mapping',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'revision_policy_and_audit_review',
  },
  {
    tableName: 'edit_brief_application_logs',
    purpose: 'Append-style records for applied marker hints and planner package handoff.',
    status: 'existing_repository_mapping',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'append_only_audit_policy_review',
  },
  {
    tableName: 'edit_session_export_settings',
    purpose: 'Project/session export intent and delivery settings before render approval.',
    status: 'existing_repository_mapping',
    ownerScope: 'workspace_project_session',
    writeModeForInternalTesting: 'mock_or_disabled_supabase_only',
    productionReleaseGate: 'render_export_credit_and_approval_review',
  },
]

export const PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_RELEASE_DELTA = [
  'real_supabase_migration_and_generated_type_review',
  'workspace_project_session_rls_policy_tests',
  'explicit_data_api_grants_and_schema_exposure_review',
  'storage_policy_for_future_media_attachments',
  'backend_service_role_repository_factory',
  'route_idempotency_and_audit_event_records',
  'approved_snapshot_plan_handoff',
  'credit_estimate_reservation_ledger_persistence',
  'worker_provider_render_activation_gates',
] as const

export const PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_EXPECTED_DECISION =
  'project_edit_brief_internal_persistence_plan_passed_ready_for_internal_backend_skeleton'

export function createProjectEditBriefInternalPersistencePlan(input: {
  internalTestingDecision: ProjectEditBriefInternalTestingOwnerAcceptanceResult['decision']
}): ProjectEditBriefInternalPersistencePlan {
  return {
    id: 'project-edit-brief-production-shaped-internal-persistence-plan',
    milestone: 'RP-EDITBRIEF-16',
    decision: PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_EXPECTED_DECISION,
    status: 'passed_plan_only',
    requiredPriorDecision: input.internalTestingDecision,
    productionShapedImplementationRequired: true,
    durableRoots: PROJECT_EDIT_BRIEF_DURABLE_ROOTS,
    repositoryModes: {
      currentMockMode: 'mock_database',
      currentSupabaseMode: 'supabase_disabled',
      futureServerMode: 'supabase_server',
    },
    routePolicy: {
      browserUsesApiClient: true,
      serviceRoleBackendOnly: true,
      directFrontendSupabaseForbidden: true,
      idempotencyRequiredForWrites: true,
      auditEventsRequiredForFutureWrites: true,
    },
    blockedScope: {
      migrationAdded: false,
      sqlExecuted: false,
      supabaseCliCommandRun: false,
      liveSupabaseReadEnabled: false,
      liveSupabaseWriteEnabled: false,
      storageWriteEnabled: false,
      signedUrlCreated: false,
      productionRouteEnabled: false,
      providerOrModelCall: false,
      mediaProcessing: false,
      workerDispatch: false,
      renderOrExportJob: false,
      creditReservationOrSpend: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
    },
    releaseDelta: [...PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_RELEASE_DELTA],
    hardInvariants: [...PROJECT_EDIT_BRIEF_INTERNAL_TESTING_REQUIRED_INVARIANTS],
    nextMilestone: 'RP-EDITBRIEF-17 - Internal Persistence Backend Skeleton',
  }
}

export function evaluateProjectEditBriefInternalPersistencePlan(
  plan: ProjectEditBriefInternalPersistencePlan,
): ProjectEditBriefInternalPersistencePlanEvaluation {
  const blockedReasons: string[] = []

  if (plan.requiredPriorDecision !== 'project_edit_brief_internal_testing_owner_acceptance_passed_ready_for_production_shaped_internal_persistence_plan') {
    blockedReasons.push('RP-EDITBRIEF-15H internal testing owner acceptance must pass before RP-EDITBRIEF-16.')
  }
  if (plan.decision !== PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_EXPECTED_DECISION) {
    blockedReasons.push('Internal persistence plan decision does not match the canonical decision.')
  }
  if (!plan.productionShapedImplementationRequired) {
    blockedReasons.push('Internal persistence must require production-shaped implementation.')
  }
  if (plan.durableRoots.length !== PROJECT_EDIT_BRIEF_DURABLE_ROOTS.length) {
    blockedReasons.push('Internal persistence plan must include all Project Edit Brief durable roots.')
  }

  const plannedRoots = new Set(plan.durableRoots.map((root) => root.tableName))
  for (const root of PROJECT_EDIT_BRIEF_DURABLE_ROOTS) {
    if (!plannedRoots.has(root.tableName)) {
      blockedReasons.push(`Missing durable root ${root.tableName}.`)
    }
  }
  for (const root of plannedRoots) {
    if (root.startsWith('project_edit_')) {
      blockedReasons.push(`Parallel historical table family is not approved: ${root}.`)
    }
  }

  if (!plan.routePolicy.browserUsesApiClient) {
    blockedReasons.push('Browser must continue using the API client boundary.')
  }
  if (!plan.routePolicy.serviceRoleBackendOnly) {
    blockedReasons.push('Service-role access must stay backend-only.')
  }
  if (!plan.routePolicy.directFrontendSupabaseForbidden) {
    blockedReasons.push('Frontend direct Supabase access must remain forbidden.')
  }
  if (!plan.routePolicy.idempotencyRequiredForWrites) {
    blockedReasons.push('Future writes must require idempotency.')
  }
  if (!plan.routePolicy.auditEventsRequiredForFutureWrites) {
    blockedReasons.push('Future writes must require audit event planning.')
  }

  for (const [key, value] of Object.entries(plan.blockedScope)) {
    if (value !== false) {
      blockedReasons.push(`${key} must remain false in RP-EDITBRIEF-16.`)
    }
  }
  for (const invariant of PROJECT_EDIT_BRIEF_INTERNAL_TESTING_REQUIRED_INVARIANTS) {
    if (!plan.hardInvariants.includes(invariant)) {
      blockedReasons.push(`Missing hard invariant: ${invariant}.`)
    }
  }
  for (const releaseDelta of PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_RELEASE_DELTA) {
    if (!plan.releaseDelta.includes(releaseDelta)) {
      blockedReasons.push(`Missing release delta: ${releaseDelta}.`)
    }
  }

  const passed = blockedReasons.length === 0

  return {
    decision: passed
      ? PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_EXPECTED_DECISION
      : 'project_edit_brief_internal_persistence_plan_blocked_missing_internal_testing_acceptance',
    readyForInternalBackendSkeleton: passed,
    durableRootCount: plan.durableRoots.length,
    blockedReasons,
    nextMilestone: plan.nextMilestone,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    liveSupabaseWriteEnabled: false,
  }
}
