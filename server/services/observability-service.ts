import type { ApiErrorCode } from '../errors/error-codes'
import { createSafeRuntimeSummary } from '../config/env'
import {
  createApiRouteMapSummary,
  getRouteProductionReadiness,
  REEDITPRO_API_ROUTES,
} from '../../src/backend/api/api-route-registry'
import type { ApiRouteDefinition } from '../../src/backend/api/api-runtime-contracts'
import type { ServiceContext } from '../types'
import type {
  AbuseCheckBoundaryInput,
  AbusePolicyPreviewInput,
  AbuseReadinessInput,
  AuditEventCreateBoundaryInput,
  AuditEventListForProjectInput,
  AuditEventListForWorkspaceInput,
  AuditEventPreviewInput,
  AuditSummaryInput,
  CostControlExecutionBlockedInput,
  CostControlPolicyPreviewInput,
  CostControlReadinessInput,
  CostControlUsageSummaryPreviewInput,
  ObservabilityReadinessInput,
  ObservabilityRequestTraceInput,
  ObservabilityRouteRiskSummaryInput,
  ObservabilityRuntimeStatusInput,
  OperationalAlertPreviewInput,
  OperationalAlertReadinessInput,
  RateLimitCheckBoundaryInput,
  RateLimitPolicyPreviewInput,
  RateLimitReadinessInput,
} from '../validation/observability-schemas'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId, nowIso, sanitizeJson } from './service-helpers'

type ObservabilityStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'

interface ObservabilityBlocker {
  gate: string
  code: ApiErrorCode
  message: string
}

interface RequiredRecord {
  table: string
  id?: string
  status: 'present' | 'missing' | 'backend_required' | 'blocked' | 'not_applicable'
  note: string
}

export interface ObservabilityResult {
  status: ObservabilityStatus
  canProceed: boolean
  canCreateAuditEvent: boolean
  canEnforceRateLimit: boolean
  canBlockAbuse: boolean
  canApplyCostControl: boolean
  canSendExternalTelemetry: boolean
  blockers: ObservabilityBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  requestTrace?: Record<string, unknown>
  runtime?: Record<string, unknown>
  routeRisk?: Record<string, unknown>
  audit?: Record<string, unknown>
  rateLimit?: Record<string, unknown>
  abuse?: Record<string, unknown>
  cost?: Record<string, unknown>
  usage?: Record<string, unknown>
  operationalAlert?: Record<string, unknown>
}

function baseResult(warnings: string[] = []): ObservabilityResult {
  return {
    status: 'backend_required',
    canProceed: false,
    canCreateAuditEvent: false,
    canEnforceRateLimit: false,
    canBlockAbuse: false,
    canApplyCostControl: false,
    canSendExternalTelemetry: false,
    blockers: [],
    warnings: [
      'Prompt 17 observability boundaries are local/static summaries only.',
      'External telemetry, production persistence, billing, execution, and production unlocks remain disabled.',
      ...warnings,
    ],
    requiredRecords: [],
    nextAction: 'Add reviewed persistence, retention policy, and operational runtime before enabling production observability controls.',
  }
}

function addBlocker(result: ObservabilityResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
}

function addRequiredRecord(result: ObservabilityResult, table: string, id: string | undefined, note: string, status: RequiredRecord['status'] = id ? 'present' : 'missing'): void {
  result.requiredRecords.push({ table, id, status, note })
}

function finalize(result: ObservabilityResult, readOnlyReady = false): ObservabilityResult {
  result.canCreateAuditEvent = false
  result.canEnforceRateLimit = false
  result.canBlockAbuse = false
  result.canApplyCostControl = false
  result.canSendExternalTelemetry = false

  if (result.blockers.length === 0 && readOnlyReady) {
    result.status = 'ready'
    result.canProceed = true
    result.nextAction = 'Static observability summary is available. Production persistence and enforcement remain blocked.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.canProceed = false
  return result
}

function addOperationalPersistenceBlockers(result: ObservabilityResult): void {
  addBlocker(result, 'AuditEventPersistenceGate', 'BACKEND_REQUIRED', 'Audit events require future append-only backend persistence before creation is enabled.')
  addBlocker(result, 'RateLimitPersistenceGate', 'BACKEND_REQUIRED', 'Rate-limit enforcement requires future backend/runtime persistence and policy review.')
  addBlocker(result, 'AbusePreventionPersistenceGate', 'BACKEND_REQUIRED', 'Abuse-prevention decisions require reviewed persistence and escalation policy.')
  addBlocker(result, 'CostControlPersistenceGate', 'BACKEND_REQUIRED', 'Cost-control enforcement requires reviewed usage/cost persistence and billing isolation.')
  addBlocker(result, 'ExternalTelemetryGate', 'BACKEND_REQUIRED', 'External monitoring and alert transport are not enabled by Prompt 17.')
  addBlocker(result, 'ProductionUnlockGate', 'BACKEND_REQUIRED', 'Observability signals cannot unlock production, beta, or broad-media execution.')
}

function sanitizedAuditPreview(action: string, context: ServiceContext, details: Record<string, unknown>): Record<string, unknown> {
  return sanitizeJson({
    eventType: action,
    requestId: context.requestId,
    userId: context.auth?.userId,
    redactionApplied: true,
    noSecretsConfirmed: true,
    details,
    createdAt: nowIso(),
  })
}

function classifyRouteRisk(route: ApiRouteDefinition): string {
  if (route.requiresProviderSecret || route.requiresStripeSecret || route.securityLevel === 'backend_service_role') return 'critical'
  if (route.requiresServiceRole || route.status === 'disabled') return 'high'
  if (route.status === 'backend_required' || route.runtimeMode === 'backend_required') return 'medium'
  if (route.method !== 'GET') return 'medium'
  return 'low'
}

function routeRiskItem(route: ApiRouteDefinition): Record<string, unknown> {
  return {
    routeId: route.id,
    domain: route.domain,
    routeGroup: route.routeGroup,
    method: route.method,
    path: route.path,
    status: route.status,
    runtimeMode: route.runtimeMode,
    productionReadiness: getRouteProductionReadiness(route),
    riskLevel: classifyRouteRisk(route),
    idempotencyRequired: route.idempotencyRequired ?? route.method !== 'GET',
    forbiddenSideEffects: route.forbiddenSideEffects ?? [],
  }
}

async function addProjectAccessBoundary(context: ServiceContext, result: ObservabilityResult, projectId: string | undefined): Promise<void> {
  if (!projectId) return
  const access = await createProjectService(context).checkProjectAccess(projectId)
  result.warnings.push(...access.warnings)
  result.runtime = {
    ...(result.runtime ?? {}),
    projectAccess: {
      status: access.status,
      hasAccess: access.hasAccess,
      project: access.project,
      membership: access.membership,
    },
  }
  if (access.status !== 'ready') {
    addBlocker(result, 'ProjectAccessGate', 'BACKEND_REQUIRED', 'Project access can only be fully verified when backend project access runtime is available.')
  }
}

function riskPolicySummary(input: RateLimitReadinessInput | AbuseReadinessInput | CostControlReadinessInput): Record<string, unknown> {
  return {
    routeId: input.routeId,
    routeGroup: input.routeGroup,
    actorType: input.actorType,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    requestCountWindow: input.requestCountWindow,
    mutationCountWindow: input.mutationCountWindow,
    expensiveOperationCountWindow: input.expensiveOperationCountWindow,
    estimatedCredits: input.estimatedCredits,
    estimatedStorageBytes: input.estimatedStorageBytes,
    estimatedProviderCost: input.estimatedProviderCost,
    estimatedRenderCost: input.estimatedRenderCost,
    abuseRiskSignals: input.abuseRiskSignals,
    manualReviewRequired: input.manualReviewRequired,
    productionEnforcementEnabled: false,
  }
}

export function createObservabilityService(context: ServiceContext) {
  function requireUser(): string {
    return getRequiredAuthUserId(context)
  }

  return {
    async checkReadiness(input: ObservabilityReadinessInput, idempotencyKey: string): Promise<ObservabilityResult> {
      const userId = requireUser()
      const result = baseResult()
      addRequiredRecord(result, 'audit_events', undefined, 'Append-only audit event persistence is a future backend boundary.', 'backend_required')
      addRequiredRecord(result, 'rate_limit_events', undefined, 'Rate-limit events are future backend-owned records.', 'backend_required')
      addRequiredRecord(result, 'abuse_prevention_events', undefined, 'Abuse-prevention events are future backend-owned records.', 'backend_required')
      addRequiredRecord(result, 'usage_metering_records', undefined, 'Usage metering records are future backend-owned records.', 'backend_required')
      addRequiredRecord(result, 'cost_control_records', undefined, 'Cost-control records are future backend-owned records.', 'backend_required')
      addOperationalPersistenceBlockers(result)
      await addProjectAccessBoundary(context, result, input.projectId)
      result.audit = sanitizedAuditPreview('observability.readiness_checked', context, {
        userId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        readinessContext: input.readinessContext,
        idempotencyKey,
      })
      return finalize(result)
    },

    runtimeStatus(input: ObservabilityRuntimeStatusInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      result.runtime = {
        requestId: context.requestId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        runtime: createSafeRuntimeSummary(context.env),
        routeSummary: createApiRouteMapSummary(),
        externalTelemetryEnabled: false,
        auditPersistenceEnabled: false,
        rateLimitPersistenceEnabled: false,
        costControlPersistenceEnabled: false,
        productionUnlockEnabled: false,
      }
      return finalize(result, true)
    },

    requestTrace(input: ObservabilityRequestTraceInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      result.requestTrace = {
        requestedRequestId: input.requestId,
        currentRequestId: context.requestId,
        traceStoreAvailable: false,
        currentRequestOnly: input.requestId === context.requestId,
        redactionApplied: true,
      }
      if (input.requestId !== context.requestId) {
        addBlocker(result, 'RequestTracePersistenceGate', 'BACKEND_REQUIRED', 'Historical request trace lookup requires future trace persistence.')
      }
      return finalize(result, input.requestId === context.requestId)
    },

    routeRiskSummary(input: ObservabilityRouteRiskSummaryInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      const routes = REEDITPRO_API_ROUTES
        .filter((route) => input.includeBlocked || getRouteProductionReadiness(route) !== 'blocked')
        .filter((route) => !input.routeGroup || route.routeGroup === input.routeGroup || route.domain === input.routeGroup)
        .map(routeRiskItem)
      result.routeRisk = {
        routeCount: routes.length,
        routes,
        countsByRisk: routes.reduce<Record<string, number>>((summary, route) => {
          const riskLevel = String(route.riskLevel)
          summary[riskLevel] = (summary[riskLevel] ?? 0) + 1
          return summary
        }, {}),
      }
      return finalize(result, true)
    },

    async auditEventPreview(input: AuditEventPreviewInput, idempotencyKey: string): Promise<ObservabilityResult> {
      const userId = requireUser()
      const result = baseResult()
      await addProjectAccessBoundary(context, result, input.projectId)
      result.audit = {
        eventType: input.eventType,
        eventCategory: input.eventCategory,
        actorType: input.actorType,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        userId: input.userId ?? userId,
        sourceRouteId: input.sourceRouteId,
        requestId: input.requestId ?? context.requestId,
        idempotencyKey,
        sourceRecordType: input.sourceRecordType,
        sourceRecordId: input.sourceRecordId,
        targetRecordType: input.targetRecordType,
        targetRecordId: input.targetRecordId,
        severity: input.severity,
        visibility: input.visibility,
        sanitizedMetadata: sanitizeJson(input.sanitizedMetadata),
        redactionApplied: true,
        noSecretsConfirmed: true,
        retentionClass: input.retentionClass,
        auditHash: 'future_backend_generated',
        createdAt: nowIso(),
        appendOnlyPersistenceEnabled: false,
      }
      return finalize(result, result.blockers.length === 0)
    },

    async auditEventCreateBoundary(input: AuditEventCreateBoundaryInput, idempotencyKey: string): Promise<ObservabilityResult> {
      const result = await this.auditEventPreview(input, idempotencyKey)
      addBlocker(result, 'AuditEventCreateGate', 'BACKEND_REQUIRED', 'Audit event creation is fail-closed until append-only persistence is reviewed.')
      addRequiredRecord(result, 'audit_events', undefined, 'Future append-only audit event row.', 'backend_required')
      return finalize(result)
    },

    async listAuditEventsForProject(input: AuditEventListForProjectInput): Promise<ObservabilityResult> {
      requireUser()
      const result = baseResult()
      await addProjectAccessBoundary(context, result, input.projectId)
      addBlocker(result, 'AuditEventReadPersistenceGate', 'BACKEND_REQUIRED', 'Project audit event listing requires future RLS-reviewed audit persistence.')
      addRequiredRecord(result, 'audit_events', undefined, 'Future project-scoped audit event rows.', 'backend_required')
      result.audit = { scope: 'project', workspaceId: input.workspaceId, projectId: input.projectId, recordsReturned: 0 }
      return finalize(result)
    },

    listAuditEventsForWorkspace(input: AuditEventListForWorkspaceInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      addBlocker(result, 'AuditEventReadPersistenceGate', 'BACKEND_REQUIRED', 'Workspace audit event listing requires future RLS-reviewed audit persistence.')
      addRequiredRecord(result, 'audit_events', undefined, 'Future workspace-scoped audit event rows.', 'backend_required')
      result.audit = { scope: 'workspace', workspaceId: input.workspaceId, recordsReturned: 0 }
      return finalize(result)
    },

    auditSummary(input: AuditSummaryInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      addBlocker(result, 'AuditSummaryPersistenceGate', 'BACKEND_REQUIRED', 'Audit summaries require future aggregate persistence or reviewed backend queries.')
      result.audit = { workspaceId: input.workspaceId, projectId: input.projectId, summaryAvailable: false }
      return finalize(result)
    },

    rateLimitReadiness(input: RateLimitReadinessInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      addBlocker(result, 'RateLimitPersistenceGate', 'BACKEND_REQUIRED', 'Rate-limit persistence is unavailable in Prompt 17.')
      result.rateLimit = riskPolicySummary(input)
      return finalize(result)
    },

    rateLimitPolicyPreview(input: RateLimitPolicyPreviewInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      result.rateLimit = {
        ...riskPolicySummary(input),
        requestCountLimit: input.requestCountLimit,
        mutationCountLimit: input.mutationCountLimit,
        retryAfterSeconds: input.retryAfterSeconds,
        enforcementEnabled: false,
      }
      return finalize(result, true)
    },

    rateLimitCheckBoundary(input: RateLimitCheckBoundaryInput, idempotencyKey: string): ObservabilityResult {
      const result = this.rateLimitPolicyPreview(input)
      addBlocker(result, 'RateLimitEnforcementGate', 'BACKEND_REQUIRED', 'Rate-limit checks cannot enforce or persist decisions in Prompt 17.')
      result.rateLimit = { ...(result.rateLimit ?? {}), idempotencyKey, wouldBlock: false, retryAfterSeconds: input.retryAfterSeconds }
      return finalize(result)
    },

    abuseReadiness(input: AbuseReadinessInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      addBlocker(result, 'AbusePreventionPersistenceGate', 'BACKEND_REQUIRED', 'Abuse-prevention persistence is unavailable in Prompt 17.')
      result.abuse = riskPolicySummary(input)
      return finalize(result)
    },

    abusePolicyPreview(input: AbusePolicyPreviewInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      result.abuse = {
        ...riskPolicySummary(input),
        riskLevel: input.riskLevel,
        escalationPolicy: input.escalationPolicy ?? 'Future human review policy required for high-risk abuse signals.',
        enforcementEnabled: false,
      }
      return finalize(result, true)
    },

    abuseCheckBoundary(input: AbuseCheckBoundaryInput, idempotencyKey: string): ObservabilityResult {
      const result = this.abusePolicyPreview(input)
      addBlocker(result, 'AbuseCheckGate', 'BACKEND_REQUIRED', 'Abuse checks cannot persist or enforce decisions in Prompt 17.')
      result.abuse = { ...(result.abuse ?? {}), idempotencyKey, wouldBlock: false }
      return finalize(result)
    },

    costControlReadiness(input: CostControlReadinessInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      addBlocker(result, 'CostControlPersistenceGate', 'BACKEND_REQUIRED', 'Cost-control persistence is unavailable in Prompt 17.')
      result.cost = riskPolicySummary(input)
      return finalize(result)
    },

    costControlPolicyPreview(input: CostControlPolicyPreviewInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      result.cost = {
        ...riskPolicySummary(input),
        creditCeiling: input.creditCeiling,
        storageCeilingBytes: input.storageCeilingBytes,
        providerCostCeiling: input.providerCostCeiling,
        renderCostCeiling: input.renderCostCeiling,
        billingEnabled: false,
        enforcementEnabled: false,
      }
      return finalize(result, true)
    },

    costControlUsageSummaryPreview(input: CostControlUsageSummaryPreviewInput): ObservabilityResult {
      const result = this.costControlPolicyPreview(input)
      result.usage = {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        estimatedCredits: input.estimatedCredits,
        estimatedStorageBytes: input.estimatedStorageBytes,
        estimatedProviderCost: input.estimatedProviderCost,
        estimatedRenderCost: input.estimatedRenderCost,
        source: 'request_metadata_only',
        productionUsagePersistenceEnabled: false,
      }
      return finalize(result, true)
    },

    costControlExecutionBlocked(input: CostControlExecutionBlockedInput, idempotencyKey: string): ObservabilityResult {
      const result = this.costControlPolicyPreview(input)
      addBlocker(result, 'CostControlExecutionGate', 'BACKEND_REQUIRED', input.blockReason)
      result.cost = { ...(result.cost ?? {}), idempotencyKey, executionBlocked: true }
      return finalize(result)
    },

    operationalAlertReadiness(input: OperationalAlertReadinessInput): ObservabilityResult {
      requireUser()
      const result = baseResult()
      addBlocker(result, 'OperationalAlertTransportGate', 'BACKEND_REQUIRED', 'Alert persistence and external alert transport are unavailable in Prompt 17.')
      result.operationalAlert = {
        alertType: input.alertType,
        severity: input.severity,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        transportEnabled: false,
      }
      return finalize(result)
    },

    operationalAlertPreview(input: OperationalAlertPreviewInput, idempotencyKey: string): ObservabilityResult {
      requireUser()
      const result = baseResult()
      result.operationalAlert = {
        alertType: input.alertType,
        severity: input.severity,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        userMessage: input.userMessage,
        escalationPolicy: input.escalationPolicy ?? 'Future incident policy review required.',
        idempotencyKey,
        transportEnabled: false,
        persistenceEnabled: false,
      }
      return finalize(result, true)
    },
  }
}
