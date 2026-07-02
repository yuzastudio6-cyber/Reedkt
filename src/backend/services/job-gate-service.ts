import type { JobBlockReason, JobGateCheckResult } from '../../types/job-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { findMockRecord } from '../mock/mock-database'

export interface JobRuntimeGateCheckInput {
  workspaceId?: string
  projectId?: string
  editPlanId?: string
  creditEstimateId?: string
  creditReservationId?: string
  generationRequestId?: string
  providerId?: string
  renderTimingManifestId?: string
  requiredAssetIds?: string[]
  requiresEditPlanApproval?: boolean
  requiresCreditEstimateApproval?: boolean
  requiresCreditReservation?: boolean
  requiresGenerationRequest?: boolean
  requiresProvider?: boolean
  requiresProviderSecret?: boolean
  providerRuntimeMode?: 'mock' | 'backend_required' | 'disabled'
  requiresRequiredAssets?: boolean
  requiresTimingReadiness?: boolean
  requiresBackendRuntime?: boolean
  mockSafe?: boolean
}

export function checkJobRuntimeGates(
  db: MockDatabase,
  input: JobRuntimeGateCheckInput,
): JobGateCheckResult {
  const checks = [
    checkWorkspacePermissionGateMock(input),
    checkEditPlanApprovalGate(db, input),
    checkCreditReservationGate(db, input),
    checkGenerationRequestGate(db, input),
    checkProviderRuntimeGate(db, input),
    checkRequiredAssetsGate(db, input),
    checkTimingReadinessGate(db, input),
  ]

  const blockReasons = uniqueReasons(checks.flatMap((check) => check.blockReasons))
  const warnings = checks.flatMap((check) => check.warnings)

  if (input.requiresBackendRuntime && !input.mockSafe) {
    blockReasons.push('backend_runtime_missing')
    warnings.push('Real worker dispatch is backend-required; mock runtime cannot start cloud/provider work.')
  }

  if (blockReasons.length > 0) {
    return {
      ok: false,
      gateStatus: 'blocked',
      blockReasons: uniqueReasons(blockReasons),
      message: `Job gate blocked: ${uniqueReasons(blockReasons).join(', ')}.`,
      warnings,
      mockOnly: true,
    }
  }

  const hasWarnings = warnings.length > 0
  return {
    ok: true,
    gateStatus: hasWarnings ? 'warning' : 'passed',
    blockReasons: [],
    message: hasWarnings ? 'Job gate passed with mock-runtime warnings.' : 'Job gate passed.',
    warnings,
    mockOnly: true,
  }
}

export function checkEditPlanApprovalGate(
  db: MockDatabase,
  input: JobRuntimeGateCheckInput,
): JobGateCheckResult {
  if (!input.requiresEditPlanApproval) return notRequired('Edit plan approval is not required for this mock job.')

  const editPlan = input.editPlanId ? findMockRecord(db, 'editPlans', input.editPlanId) : undefined
  if (!editPlan || editPlan.status !== 'approved' || editPlan.approvalStatus !== 'approved') {
    return blocked('edit_plan_not_approved', `Edit plan status is ${editPlan?.status ?? 'missing'}.`)
  }

  return passed('Edit plan approval gate passed.')
}

export function checkCreditReservationGate(
  db: MockDatabase,
  input: JobRuntimeGateCheckInput,
): JobGateCheckResult {
  if (!input.requiresCreditEstimateApproval && !input.requiresCreditReservation) {
    return notRequired('Credit gate is not required for this mock job.')
  }

  const estimate = input.creditEstimateId ? findMockRecord(db, 'creditEstimates', input.creditEstimateId) : undefined
  if (input.requiresCreditEstimateApproval && (!estimate || estimate.status !== 'approved')) {
    return blocked('credit_estimate_not_approved', `Credit estimate status is ${estimate?.status ?? 'missing'}.`)
  }

  if (!input.requiresCreditReservation) return passed('Credit estimate approval gate passed.')

  const reservation = input.creditReservationId ? findMockRecord(db, 'creditReservations', input.creditReservationId) : undefined
  if (!reservation || reservation.status !== 'reserved') {
    return blocked('credit_reservation_missing', `Credit reservation status is ${reservation?.status ?? 'missing'}.`)
  }

  if (
    reservation.workspaceId !== input.workspaceId ||
    reservation.projectId !== input.projectId ||
    (input.creditEstimateId && reservation.creditEstimateId !== input.creditEstimateId)
  ) {
    return blocked('credit_reservation_missing', 'Credit reservation does not match the job workspace, project, or estimate.')
  }

  return passed('Credit reservation gate passed.')
}

export function checkGenerationRequestGate(
  db: MockDatabase,
  input: JobRuntimeGateCheckInput,
): JobGateCheckResult {
  if (!input.requiresGenerationRequest) return notRequired('Generation request is not required for this mock job.')

  const request = input.generationRequestId ? findMockRecord(db, 'generationRequests', input.generationRequestId) : undefined
  if (!request || !['approved', 'queued', 'running'].includes(request.status)) {
    return blocked('generation_request_missing', `Generation request status is ${request?.status ?? 'missing'}.`)
  }

  return passed('Generation request gate passed.')
}

export function checkProviderRuntimeGate(
  db: MockDatabase,
  input: JobRuntimeGateCheckInput,
): JobGateCheckResult {
  if (!input.requiresProvider) return notRequired('Provider gate is not required for this mock job.')

  if (input.providerRuntimeMode === 'disabled') {
    return blocked('provider_disabled', 'Provider runtime is disabled for this job.')
  }

  if (input.requiresProviderSecret && input.providerRuntimeMode !== 'mock') {
    return blocked('provider_secret_missing', 'Provider secret is backend-only and unavailable in mock runtime.')
  }

  const provider = input.providerId ? findMockRecord(db, 'generationProviders', input.providerId) : undefined
  if (input.providerId && (!provider || !provider.active)) {
    return blocked('provider_disabled', `Provider is ${provider?.active === false ? 'inactive' : 'missing'}.`)
  }

  if (input.providerRuntimeMode === 'backend_required') {
    return blocked('backend_runtime_missing', 'Real provider dispatch requires backend runtime.')
  }

  return passed('Provider runtime gate passed in mock mode.')
}

export function checkRequiredAssetsGate(
  db: MockDatabase,
  input: JobRuntimeGateCheckInput,
): JobGateCheckResult {
  if (!input.requiresRequiredAssets) return notRequired('Required asset gate is not required for this mock job.')

  const missing = (input.requiredAssetIds ?? []).filter((assetId) =>
    !db.generatedAssets.some((asset) => asset.id === assetId) &&
    !db.mediaAssets.some((asset) => asset.id === assetId) &&
    !db.sfxGeneratedAssets.some((asset) => asset.id === assetId),
  )

  if (missing.length > 0) {
    return blocked('required_asset_missing', `Missing required asset(s): ${missing.join(', ')}.`)
  }

  return passed('Required asset gate passed.')
}

export function checkTimingReadinessGate(
  db: MockDatabase,
  input: JobRuntimeGateCheckInput,
): JobGateCheckResult {
  if (!input.requiresTimingReadiness) return notRequired('Timing readiness gate is not required for this mock job.')

  const manifest = input.renderTimingManifestId
    ? findMockRecord(db, 'renderTimingManifests', input.renderTimingManifestId)
    : undefined

  if (!manifest) {
    return blocked('render_manifest_not_ready', 'Render timing manifest is missing.')
  }

  if (manifest.status !== 'ready_for_worker' || !manifest.readyForRender) {
    return blocked('timing_not_ready', `Render timing manifest status is ${manifest.status}.`)
  }

  return passed('Timing readiness gate passed.')
}

export function checkWorkspacePermissionGateMock(input: JobRuntimeGateCheckInput): JobGateCheckResult {
  if (!input.workspaceId || !input.projectId) {
    return blocked('workspace_permission_missing', 'Workspace and project scope are required for mock job runtime.')
  }

  return passed('Mock workspace permission gate passed.')
}

export function createJobGateSummary(result: JobGateCheckResult): string {
  if (result.ok) return result.message
  return `Blocked by ${result.blockReasons.join(', ')}. ${result.message}`
}

function passed(message: string): JobGateCheckResult {
  return { ok: true, gateStatus: 'passed', blockReasons: [], message, warnings: [], mockOnly: true }
}

function notRequired(message: string): JobGateCheckResult {
  return { ok: true, gateStatus: 'not_required', blockReasons: [], message, warnings: [], mockOnly: true }
}

function blocked(reason: JobBlockReason, message: string): JobGateCheckResult {
  return { ok: false, gateStatus: 'blocked', blockReasons: [reason], message, warnings: [], mockOnly: true }
}

function uniqueReasons(reasons: JobBlockReason[]): JobBlockReason[] {
  return Array.from(new Set(reasons))
}
