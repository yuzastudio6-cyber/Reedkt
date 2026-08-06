import type { EditPlan, PlannerInput } from '../../types/reeditpro'
import type { ApprovalCoreResult, ApprovalGateContext } from './approval-core'

let approvalPlannerPromise: Promise<typeof import('./approval-core')> | null = null
let advancedDiagnosticsPromise: Promise<typeof import('./advanced-diagnostics')> | null = null

export function loadApprovalPlanner() {
  approvalPlannerPromise ??= import('./approval-core')

  return approvalPlannerPromise
}

export function loadAdvancedDiagnostics() {
  advancedDiagnosticsPromise ??= import('./advanced-diagnostics')

  return advancedDiagnosticsPromise
}

export async function loadApprovalMockPlan(
  input: PlannerInput,
  context: ApprovalGateContext,
): Promise<ApprovalCoreResult> {
  const module = await loadApprovalPlanner()

  return module.createApprovedMockPlan(input, context)
}

export async function loadFullMockEditPlan(input: PlannerInput): Promise<EditPlan> {
  const module = await loadAdvancedDiagnostics()

  return module.createMockEditPlan(input)
}

export const loadAdvancedMockEditPlan = loadFullMockEditPlan
