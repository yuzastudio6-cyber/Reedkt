import {
  INTERNAL_BETA_API_ROUTES,
} from '../../src/backend/api/routes/internal-beta-api-routes'
import type {
  ApiMethod,
  ApiRouteSecurityLevel,
  ApiRouteStatus,
} from '../../src/backend/api/api-runtime-contracts'
import {
  createDisabledInternalBetaRuntimeScaffoldResult,
  type InternalBetaRuntimeScaffoldInput,
  type InternalBetaRuntimeScaffoldResult,
  type InternalBetaRuntimeScaffoldRouteId,
} from './internal-beta-service-role-runtime-scaffold'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaApiRouteRuntimeFacadeStatus =
  'blocked_pending_supabase_target_validation_and_runtime_enablement'

export interface InternalBetaApiRouteRuntimeFacadeInput extends InternalBetaRuntimeScaffoldInput {
  params?: Record<string, string>
  query?: Record<string, string>
}

export interface InternalBetaApiRouteRuntimeFacadeResponse {
  ok: false
  status: InternalBetaApiRouteRuntimeFacadeStatus
  routeId: InternalBetaRuntimeScaffoldRouteId
  method: ApiMethod
  path: string
  securityLevel: ApiRouteSecurityLevel
  contractStatus: ApiRouteStatus
  futureHandlerName: string
  createdAt: string
  httpStatusCode: 202
  serviceRoleRequired: boolean
  routeHandlerRegistered: false
  mockHandlerRegistered: false
  routeExecution: false
  serviceRoleRouteExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  migrationApply: false
  storageWrite: false
  storageRead: false
  signedUrlCreation: false
  publicArtifactCreation: false
  creditMutation: false
  stripePaymentProcessing: false
  workerDispatch: false
  workerExecution: false
  providerModelCall: false
  modelCall: false
  rawPromptExecution: false
  renderExportExecution: false
  mediaProcessing: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
  scaffoldResult: InternalBetaRuntimeScaffoldResult
  requiredBeforeEnablement: string[]
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export interface InternalBetaApiRouteRuntimeFacadeSafetySummary {
  routeHandlerRegistration: false
  mockHandlerRegistration: false
  routeExecution: false
  serviceRoleRouteExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  migrationApply: false
  storageWrite: false
  storageRead: false
  signedUrlCreation: false
  publicArtifactCreation: false
  creditMutation: false
  stripePaymentProcessing: false
  workerDispatch: false
  workerExecution: false
  providerModelCall: false
  modelCall: false
  rawPromptExecution: false
  renderExportExecution: false
  mediaProcessing: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
}

export interface InternalBetaApiRouteRuntimeFacadeReport {
  ok: false
  status: InternalBetaApiRouteRuntimeFacadeStatus
  createdAt: string
  routeCount: 8
  backendRequiredRouteCount: number
  disabledRouteCount: number
  facadeResponses: InternalBetaApiRouteRuntimeFacadeResponse[]
  routeStatuses: Record<InternalBetaRuntimeScaffoldRouteId, InternalBetaApiRouteRuntimeFacadeStatus>
  safety: InternalBetaApiRouteRuntimeFacadeSafetySummary
  internalBetaEndToEndReady: false
  productReadyEndToEndLocalOssTools: 0
  requiredBeforeEnablement: string[]
  nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN'
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export const INTERNAL_BETA_API_ROUTE_RUNTIME_FACADE_REQUIRED_BEFORE_ENABLEMENT = [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'guarded_worker_runtime_rpc_staging_sql_execution',
  'service_role_runtime_enablement',
  'service_role_route_handler_implementation',
  'transactional_audit_log_contract',
  'approved_snapshot_persistence_runtime',
  'credit_ledger_transaction_runtime',
  'job_queue_lease_event_runtime',
  'private_artifact_manifest_storage_runtime',
  'private_artifact_access_runtime',
  'remotion_private_preview_export_runtime',
  'provider_runtime_owner_approval_if_needed',
  'qa_cleanup_observability_rollback_gates',
  'negative_e2e_runtime_gate_regression',
] as const

const INTERNAL_BETA_ROUTE_IDS = INTERNAL_BETA_API_ROUTES.map((route) => route.id)

export function createInternalBetaApiRouteRuntimeFacadeResponse(
  routeId: InternalBetaRuntimeScaffoldRouteId,
  input: InternalBetaApiRouteRuntimeFacadeInput = {},
): InternalBetaApiRouteRuntimeFacadeResponse {
  const route = getInternalBetaRouteContract(routeId)
  const scaffoldResult = createDisabledInternalBetaRuntimeScaffoldResult(routeId, input)

  return {
    ok: false,
    status: 'blocked_pending_supabase_target_validation_and_runtime_enablement',
    routeId,
    method: route.method,
    path: route.path,
    securityLevel: route.securityLevel,
    contractStatus: route.status,
    futureHandlerName: route.futureHandlerName ?? scaffoldResult.futureHandlerName,
    createdAt: nowIso(),
    httpStatusCode: 202,
    serviceRoleRequired: route.requiresServiceRole,
    routeHandlerRegistered: false,
    mockHandlerRegistered: false,
    routeExecution: false,
    serviceRoleRouteExecution: false,
    remoteSupabaseMutation: false,
    sqlExecution: false,
    migrationApply: false,
    storageWrite: false,
    storageRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    stripePaymentProcessing: false,
    workerDispatch: false,
    workerExecution: false,
    providerModelCall: false,
    modelCall: false,
    rawPromptExecution: false,
    renderExportExecution: false,
    mediaProcessing: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
    scaffoldResult,
    requiredBeforeEnablement: mergeRequirements(scaffoldResult.requiredBeforeEnablement),
    inputSummary: summarizeFacadeInput(input),
    warnings: [
      'Internal beta API route runtime facade is fail-closed.',
      'No route handler, mock handler, service-role route, Supabase mutation, SQL execution, worker dispatch, provider/model call, render/export, signed URL, public artifact, credit mutation, Stripe/payment processing, beta unlock, or production unlock occurred.',
    ],
  }
}

export function createInternalBetaApiRouteRuntimeFacadeReport(
  input: InternalBetaApiRouteRuntimeFacadeInput = {},
): InternalBetaApiRouteRuntimeFacadeReport {
  assertInternalBetaRouteContractCoverage()

  const facadeResponses = INTERNAL_BETA_API_ROUTES.map((route) =>
    createInternalBetaApiRouteRuntimeFacadeResponse(route.id as InternalBetaRuntimeScaffoldRouteId, input),
  )
  const routeStatuses = Object.fromEntries(
    facadeResponses.map((response) => [response.routeId, response.status]),
  ) as Record<InternalBetaRuntimeScaffoldRouteId, InternalBetaApiRouteRuntimeFacadeStatus>

  return {
    ok: false,
    status: 'blocked_pending_supabase_target_validation_and_runtime_enablement',
    createdAt: nowIso(),
    routeCount: 8,
    backendRequiredRouteCount: INTERNAL_BETA_API_ROUTES.filter((route) => route.status === 'backend_required').length,
    disabledRouteCount: INTERNAL_BETA_API_ROUTES.filter((route) => route.status === 'disabled').length,
    facadeResponses,
    routeStatuses,
    safety: createFailClosedSafetySummary(),
    internalBetaEndToEndReady: false,
    productReadyEndToEndLocalOssTools: 0,
    requiredBeforeEnablement: mergeRequirements(),
    nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
    inputSummary: summarizeFacadeInput(input),
    warnings: [
      'Internal beta API route runtime facade binds route contracts to disabled scaffold results only.',
      'This report is metadata only and does not register or execute API routes.',
    ],
  }
}

export function assertInternalBetaApiRouteRuntimeFacadeFailClosed(
  report: InternalBetaApiRouteRuntimeFacadeReport,
): void {
  if (report.ok !== false) throw new Error('Internal beta API route facade must fail closed')
  if (report.internalBetaEndToEndReady !== false) throw new Error('Internal beta end-to-end readiness must stay false')
  if (report.productReadyEndToEndLocalOssTools !== 0) throw new Error('Product-ready tool count must stay 0')
  if (report.routeCount !== 8) throw new Error('Internal beta route facade must cover exactly 8 route contracts')
  if (report.facadeResponses.length !== 8) throw new Error('Internal beta route facade response count mismatch')

  for (const response of report.facadeResponses) {
    if (response.ok !== false) throw new Error(`Route ${response.routeId} must fail closed`)
    if (response.status !== 'blocked_pending_supabase_target_validation_and_runtime_enablement') {
      throw new Error(`Route ${response.routeId} status mismatch`)
    }
    if (response.routeExecution !== false) throw new Error(`Route ${response.routeId} executed unexpectedly`)
    if (response.serviceRoleRouteExecution !== false) {
      throw new Error(`Route ${response.routeId} service-role route execution occurred unexpectedly`)
    }
    if (response.remoteSupabaseMutation !== false) throw new Error(`Route ${response.routeId} mutated Supabase`)
    if (response.sqlExecution !== false) throw new Error(`Route ${response.routeId} executed SQL`)
    if (response.workerDispatch !== false) throw new Error(`Route ${response.routeId} dispatched workers`)
    if (response.providerModelCall !== false) throw new Error(`Route ${response.routeId} called a provider/model`)
    if (response.renderExportExecution !== false) throw new Error(`Route ${response.routeId} rendered/exported`)
    if (response.signedUrlCreation !== false) throw new Error(`Route ${response.routeId} created a signed URL`)
    if (response.publicArtifactCreation !== false) throw new Error(`Route ${response.routeId} created a public artifact`)
    if (response.creditMutation !== false) throw new Error(`Route ${response.routeId} mutated credits`)
    if (response.internalBetaUnlock !== false) throw new Error(`Route ${response.routeId} unlocked internal beta`)
  }

  for (const value of Object.values(report.safety)) {
    if (value !== false) throw new Error('Internal beta API route facade safety flag must remain false')
  }
}

function getInternalBetaRouteContract(routeId: InternalBetaRuntimeScaffoldRouteId) {
  const route = INTERNAL_BETA_API_ROUTES.find((candidate) => candidate.id === routeId)
  if (!route) {
    throw new Error(`Unknown internal beta API route contract: ${routeId}`)
  }
  return route
}

function assertInternalBetaRouteContractCoverage(): void {
  if (INTERNAL_BETA_API_ROUTES.length !== 8) {
    throw new Error(`Expected 8 internal beta API route contracts, found ${INTERNAL_BETA_API_ROUTES.length}`)
  }

  const uniqueRouteIds = new Set(INTERNAL_BETA_ROUTE_IDS)
  if (uniqueRouteIds.size !== INTERNAL_BETA_API_ROUTES.length) {
    throw new Error('Internal beta API route contracts must have unique route ids')
  }
}

function mergeRequirements(extra: string[] = []): string[] {
  return [...new Set([...INTERNAL_BETA_API_ROUTE_RUNTIME_FACADE_REQUIRED_BEFORE_ENABLEMENT, ...extra])]
}

function summarizeFacadeInput(input: InternalBetaApiRouteRuntimeFacadeInput): Record<string, unknown> {
  return sanitizeJson({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    requestId: input.requestId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    jobId: input.jobId,
    artifactManifestId: input.artifactManifestId,
    qaReportId: input.qaReportId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    params: input.params,
    queryKeys: input.query ? Object.keys(sanitizeJson(input.query)).sort() : [],
    payloadKeys: input.payload ? Object.keys(sanitizeJson(input.payload)).sort() : [],
  })
}

function createFailClosedSafetySummary(): InternalBetaApiRouteRuntimeFacadeSafetySummary {
  return {
    routeHandlerRegistration: false,
    mockHandlerRegistration: false,
    routeExecution: false,
    serviceRoleRouteExecution: false,
    remoteSupabaseMutation: false,
    sqlExecution: false,
    migrationApply: false,
    storageWrite: false,
    storageRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    stripePaymentProcessing: false,
    workerDispatch: false,
    workerExecution: false,
    providerModelCall: false,
    modelCall: false,
    rawPromptExecution: false,
    renderExportExecution: false,
    mediaProcessing: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
  }
}
