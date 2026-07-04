import type { MockDatabase } from '../mock/mock-database'
import { createMockDatabase } from '../mock/mock-database'
import {
  MockProjectEditBriefRepository,
} from '../repositories/mock-project-edit-brief-repository'
import type { ProjectEditBriefRepository } from '../repositories/project-edit-brief-repository'
import { createSupabaseDisabledProjectEditBriefRepository } from '../repositories/supabase-project-edit-brief-repository'
import type { ProjectEditBriefRepositoryOperation } from '../../types/project-edit-brief-repository'
import {
  PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_EXPECTED_DECISION,
  createProjectEditBriefInternalPersistencePlan,
  evaluateProjectEditBriefInternalPersistencePlan,
  type ProjectEditBriefInternalPersistencePlanDecision,
} from './internal-persistence-plan'

export type ProjectEditBriefInternalPersistenceBackendMode =
  | 'mock_internal'
  | 'supabase_disabled_internal'

export interface ProjectEditBriefInternalPersistenceBackendInput {
  mode?: ProjectEditBriefInternalPersistenceBackendMode
  db?: MockDatabase
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  briefId?: string
  userId?: string
}

export interface ProjectEditBriefInternalPersistenceWriteEnvelope {
  idempotencyKey?: string
  auditEventType?: string
  approvedPlanSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
}

export interface ProjectEditBriefInternalPersistenceWriteEnvelopeValidation {
  operation: ProjectEditBriefRepositoryOperation
  mutating: boolean
  allowed: boolean
  blockedReasons: string[]
}

export interface ProjectEditBriefInternalPersistenceBackend {
  decision: 'project_edit_brief_internal_persistence_backend_skeleton_passed_ready_for_internal_route_integration'
    | 'project_edit_brief_internal_persistence_backend_skeleton_blocked'
  mode: ProjectEditBriefInternalPersistenceBackendMode
  repository: ProjectEditBriefRepository
  db?: MockDatabase
  readyForInternalRouteIntegration: boolean
  supabaseLiveEnabled: false
  productionRouteEnabled: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  writePolicy: {
    idempotencyRequiredForMutations: true
    auditEventRequiredForMutations: true
    approvedSnapshotRequiredBeforeExpensiveWork: true
    creditReservationRequiredBeforeExpensiveWork: true
  }
  requiredPriorDecision: ProjectEditBriefInternalPersistencePlanDecision
  nextMilestone: string
}

export const PROJECT_EDIT_BRIEF_INTERNAL_MUTATING_OPERATIONS: ProjectEditBriefRepositoryOperation[] = [
  'create_brief',
  'update_brief',
  'archive_brief',
  'create_marker',
  'update_marker',
  'delete_marker',
  'confirm_marker',
  'archive_marker',
  'add_marker_attachment',
  'remove_marker_attachment',
  'append_marker_message',
  'save_marker_intent',
  'update_marker_intent',
  'save_marker_confirmation',
  'save_marker_conflict',
  'save_marker_revision',
  'append_application_log',
  'recommend_export_settings',
  'update_export_settings',
]

const mutatingOperations = new Set<ProjectEditBriefRepositoryOperation>(PROJECT_EDIT_BRIEF_INTERNAL_MUTATING_OPERATIONS)

function hasText(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateProjectEditBriefInternalPersistenceWriteEnvelope(
  operation: ProjectEditBriefRepositoryOperation,
  envelope: ProjectEditBriefInternalPersistenceWriteEnvelope = {},
): ProjectEditBriefInternalPersistenceWriteEnvelopeValidation {
  const mutating = mutatingOperations.has(operation)
  const blockedReasons: string[] = []

  if (mutating && !hasText(envelope.idempotencyKey)) {
    blockedReasons.push(`${operation} requires an idempotency key.`)
  }
  if (mutating && !hasText(envelope.auditEventType)) {
    blockedReasons.push(`${operation} requires an audit event type.`)
  }

  const expensiveWorkFields = [
    envelope.approvedPlanSnapshotId,
    envelope.creditEstimateId,
    envelope.creditReservationId,
  ].filter(hasText)
  if (expensiveWorkFields.length > 0 && expensiveWorkFields.length !== 3) {
    blockedReasons.push(`${operation} supplied partial expensive-work approval fields.`)
  }

  return {
    operation,
    mutating,
    allowed: blockedReasons.length === 0,
    blockedReasons,
  }
}

export function createProjectEditBriefInternalPersistenceBackend(
  input: ProjectEditBriefInternalPersistenceBackendInput = {},
): ProjectEditBriefInternalPersistenceBackend {
  const mode = input.mode ?? 'mock_internal'
  const priorPlan = createProjectEditBriefInternalPersistencePlan({
    internalTestingDecision: 'project_edit_brief_internal_testing_owner_acceptance_passed_ready_for_production_shaped_internal_persistence_plan',
  })
  const priorEvaluation = evaluateProjectEditBriefInternalPersistencePlan(priorPlan)
  const readyForInternalRouteIntegration =
    priorEvaluation.decision === PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_EXPECTED_DECISION

  if (mode === 'supabase_disabled_internal') {
    return {
      decision: readyForInternalRouteIntegration
        ? 'project_edit_brief_internal_persistence_backend_skeleton_passed_ready_for_internal_route_integration'
        : 'project_edit_brief_internal_persistence_backend_skeleton_blocked',
      mode,
      repository: createSupabaseDisabledProjectEditBriefRepository(input),
      readyForInternalRouteIntegration,
      supabaseLiveEnabled: false,
      productionRouteEnabled: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      writePolicy: {
        idempotencyRequiredForMutations: true,
        auditEventRequiredForMutations: true,
        approvedSnapshotRequiredBeforeExpensiveWork: true,
        creditReservationRequiredBeforeExpensiveWork: true,
      },
      requiredPriorDecision: priorEvaluation.decision,
      nextMilestone: 'RP-EDITBRIEF-18 - Internal Route Integration',
    }
  }

  const db = input.db ?? createMockDatabase()
  return {
    decision: readyForInternalRouteIntegration
      ? 'project_edit_brief_internal_persistence_backend_skeleton_passed_ready_for_internal_route_integration'
      : 'project_edit_brief_internal_persistence_backend_skeleton_blocked',
    mode,
    repository: new MockProjectEditBriefRepository(db, input),
    db,
    readyForInternalRouteIntegration,
    supabaseLiveEnabled: false,
    productionRouteEnabled: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    writePolicy: {
      idempotencyRequiredForMutations: true,
      auditEventRequiredForMutations: true,
      approvedSnapshotRequiredBeforeExpensiveWork: true,
      creditReservationRequiredBeforeExpensiveWork: true,
    },
    requiredPriorDecision: priorEvaluation.decision,
    nextMilestone: 'RP-EDITBRIEF-18 - Internal Route Integration',
  }
}
