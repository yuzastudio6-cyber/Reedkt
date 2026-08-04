import type {
  EditCueConflictState,
  EditCuesState,
  PlanningContext,
  ProfessionalIntegrationState,
  ProfessionalQaOperation,
  ProfessionalQaOperationType,
  ProfessionalQaReport,
  ProfessionalQaReportItem,
  ProfessionalQaState,
  SourceLibraryState,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { buildProfessionalQaState, summarizeProfessionalQa } from './professional-qa-builder'
import { qaStatusFromItems } from './professional-qa-rules'

type ProfessionalQaContext = {
  planningContext?: PlanningContext | null
  professionalIntegrationState?: ProfessionalIntegrationState | null
  sourceLibraryState?: SourceLibraryState | null
  editCuesState?: EditCuesState | null
  editCueConflictState?: EditCueConflictState | null
}

type ProfessionalQaOperationInput = {
  type: ProfessionalQaOperationType
  itemId?: string
  patch?: Record<string, unknown>
  explanation?: string
}

type RunProfessionalQaInput = ProfessionalQaContext & {
  currentState?: ProfessionalQaState | null
  projectId: string
  workspaceId?: string
  userId?: string
}

function operationId(projectId: string, nextIndex: number) {
  return `${projectId}-professional-qa-operation-${String(nextIndex).padStart(3, '0')}`
}

function createOperation(
  state: Pick<ProfessionalQaState, 'projectId' | 'workspaceId' | 'userId' | 'operations' | 'report'>,
  input: ProfessionalQaOperationInput,
): ProfessionalQaOperation {
  return {
    id: operationId(state.projectId, state.operations.length + 1),
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    userId: state.userId,
    reportId: state.report?.id,
    itemId: input.itemId,
    type: input.type,
    status: 'applied',
    createdBy: 'user',
    createdAt: MOCK_CREATED_AT,
    patch: input.patch,
    explanation: input.explanation,
  }
}

function emptySummary(): ProfessionalQaState['summary'] {
  return {
    status: 'not_run',
    totalItems: 0,
    blockingCount: 0,
    warningCount: 0,
    infoCount: 0,
    passedCount: 0,
    acceptedWarningCount: 0,
    categories: [],
    previewReadiness: 'not_run',
    nextRecommendedActions: ['Run QA'],
  }
}

export function createInitialProfessionalQaState(input: {
  projectId: string
  workspaceId?: string
  userId?: string
}): ProfessionalQaState {
  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    report: null,
    items: [],
    operations: [],
    summary: emptySummary(),
    updatedAt: MOCK_CREATED_AT,
  }
}

function updateReportFromItems(report: ProfessionalQaReport | null, items: ProfessionalQaReportItem[]) {
  if (!report) return null
  const status = qaStatusFromItems(items)
  const blockingCount = items.filter((item) => item.status === 'blocking').length
  const warningCount = items.filter((item) => item.status === 'warning').length
  const passedCount = items.filter((item) => item.status === 'passed').length
  const acceptedWarningCount = items.filter((item) => item.status === 'accepted_warning').length
  const summary = status === 'blocked'
    ? `QA found ${blockingCount} blocking issue${blockingCount === 1 ? '' : 's'} that should be resolved before preview/generation.`
    : status === 'needs_review'
      ? `QA found ${warningCount} warning${warningCount === 1 ? '' : 's'} to review before preview.`
      : status === 'accepted_with_warnings'
        ? 'QA warnings were accepted locally; preview planning can continue with caution.'
        : 'QA passed. The project is ready for preview planning.'

  return {
    ...report,
    status,
    itemIds: items.map((item) => item.id),
    summary,
    blockingCount,
    warningCount,
    passedCount,
    acceptedWarningCount,
    updatedAt: MOCK_CREATED_AT,
  }
}

function withItems(
  state: ProfessionalQaState,
  items: ProfessionalQaReportItem[],
  operation: ProfessionalQaOperation,
  reportPatch?: Partial<ProfessionalQaReport>,
): ProfessionalQaState {
  const report = updateReportFromItems(state.report, items)
  const patchedReport = report ? { ...report, ...reportPatch, updatedAt: MOCK_CREATED_AT } : null
  const operations = [...state.operations, operation]

  return {
    ...state,
    report: patchedReport,
    items,
    operations,
    summary: summarizeProfessionalQa(patchedReport, items),
    updatedAt: MOCK_CREATED_AT,
  }
}

export function runProfessionalQa(input: RunProfessionalQaInput): ProfessionalQaState {
  const builtState = buildProfessionalQaState({
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    planningContext: input.planningContext,
    professionalIntegrationState: input.professionalIntegrationState,
    sourceLibraryState: input.sourceLibraryState,
    editCuesState: input.editCuesState,
    editCueConflictState: input.editCueConflictState,
  })
  const operation = createOperation(
    input.currentState ?? builtState,
    { type: input.currentState?.report ? 'rerun_qa' : 'run_qa' },
  )

  return {
    ...builtState,
    operations: [...(input.currentState?.operations ?? []), operation],
    updatedAt: MOCK_CREATED_AT,
  }
}

export function applyProfessionalQaOperation(
  state: ProfessionalQaState,
  operationInput: ProfessionalQaOperationInput,
  context: ProfessionalQaContext = {},
): ProfessionalQaState {
  const operation = createOperation(state, operationInput)

  if (operationInput.type === 'run_qa' || operationInput.type === 'rerun_qa') {
    const builtState = buildProfessionalQaState({
      projectId: state.projectId,
      workspaceId: state.workspaceId,
      userId: state.userId,
      planningContext: context.planningContext,
      professionalIntegrationState: context.professionalIntegrationState,
      sourceLibraryState: context.sourceLibraryState,
      editCuesState: context.editCuesState,
      editCueConflictState: context.editCueConflictState,
    })

    return {
      ...builtState,
      operations: [...state.operations, operation],
      updatedAt: MOCK_CREATED_AT,
    }
  }

  if (operationInput.type === 'accept_warning' && operationInput.itemId) {
    const items = state.items.map((item) =>
      item.id === operationInput.itemId && item.status === 'warning'
        ? { ...item, status: 'accepted_warning' as const, acceptedAt: MOCK_CREATED_AT, updatedAt: MOCK_CREATED_AT }
        : item,
    )
    return withItems(state, items, operation)
  }

  if (operationInput.type === 'accept_all_warnings') {
    const items = state.items.map((item) =>
      item.status === 'warning'
        ? { ...item, status: 'accepted_warning' as const, acceptedAt: MOCK_CREATED_AT, updatedAt: MOCK_CREATED_AT }
        : item,
    )
    return withItems(state, items, operation)
  }

  if (operationInput.type === 'mark_reviewed') {
    return withItems(state, state.items, operation, { reviewedAt: MOCK_CREATED_AT })
  }

  if (operationInput.type === 'reset_qa') {
    return createInitialProfessionalQaState({
      projectId: state.projectId,
      workspaceId: state.workspaceId,
      userId: state.userId,
    })
  }

  return withItems(state, state.items, operation)
}

export function acceptQaWarning(state: ProfessionalQaState, itemId: string) {
  return applyProfessionalQaOperation(state, { type: 'accept_warning', itemId })
}

export function acceptAllQaWarnings(state: ProfessionalQaState) {
  return applyProfessionalQaOperation(state, { type: 'accept_all_warnings' })
}

export function markQaReviewed(state: ProfessionalQaState) {
  return applyProfessionalQaOperation(state, { type: 'mark_reviewed' })
}

export function resetProfessionalQa(state: ProfessionalQaState) {
  return applyProfessionalQaOperation(state, { type: 'reset_qa' })
}

export function rerunProfessionalQa(
  state: ProfessionalQaState,
  context: ProfessionalQaContext,
) {
  return applyProfessionalQaOperation(state, { type: 'rerun_qa' }, context)
}
