import {
  runProductionToolExecutionReadinessEvidenceCollectorFromEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorEnv,
  type ProductionToolExecutionReadinessEvidenceCollectorFetch,
} from './production-tool-execution-readiness-evidence-collector'
import { buildProductionToolExecutionReadinessGateInput } from './production-tool-execution-readiness-evidence-preflight'
import { buildCostControlSummary } from '../cost-controls'
import { alertRuleCatalog, productionMetricsCatalog } from '../observability'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface ProductionOpsObservabilityEvidenceCollectorEnv
  extends ProductionToolExecutionReadinessEvidenceCollectorEnv {
  REEDITPRO_PRODUCTION_OPS_OBSERVABILITY_CONFIRM_RECORD_EVIDENCE?: string
}

export interface ProductionOpsObservabilityEvidenceCollectorRunResult {
  ok: boolean
  mode: 'dry_run' | 'recorded'
  readyForOpsObservabilityEvidence: boolean
  recordConfirmationRequired: boolean
  catalogCoverage: {
    metricCount: number
    alertRuleCount: number
    billingAlertRuleCount: number
    costControlBlockers: string[]
  }
  evidence: {
    observability: ProductionEvidenceSliceStatus
    operationsControls: ProductionEvidenceSliceStatus
  }
  record?: Awaited<ReturnType<typeof runProductionToolExecutionReadinessEvidenceCollectorFromEnv>>
  warnings: string[]
}

export interface ProductionEvidenceSliceStatus {
  ready: boolean
  evidenceArtifactIdPresent: boolean
  reviewedByPresent: boolean
  reviewedAtValid: boolean
  notesPresent: boolean
  checks: Record<string, boolean>
  blockers: string[]
}

export async function runProductionOpsObservabilityEvidenceCollectorFromEnv(
  env: ProductionOpsObservabilityEvidenceCollectorEnv,
  fetchImpl: ProductionToolExecutionReadinessEvidenceCollectorFetch = fetch as ProductionToolExecutionReadinessEvidenceCollectorFetch,
): Promise<ProductionOpsObservabilityEvidenceCollectorRunResult> {
  const input = buildProductionToolExecutionReadinessGateInput(env)
  const secretLikeInputPaths = collectSecretLikePaths({
    sourceId: env.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID,
    sourceSha: env.REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA,
    workspaceId: env.REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID,
    projectId: env.REEDITPRO_PRODUCTION_READINESS_PROJECT_ID,
    reviewedBy: env.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY,
    reviewedAt: env.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT,
    observabilityArtifactId: env.REEDITPRO_PRODUCTION_OBSERVABILITY_EVIDENCE_ARTIFACT_ID,
    observabilityNotes: env.REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES,
    operationsArtifactId: env.REEDITPRO_PRODUCTION_OPERATIONS_EVIDENCE_ARTIFACT_ID,
    operationsNotes: env.REEDITPRO_PRODUCTION_OPERATIONS_NOTES,
    idempotencyKey: env.REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY,
  }, 'productionOpsObservabilityEvidenceCollector')
  if (secretLikeInputPaths.length > 0) {
    throw new Error(`Production ops/observability evidence collector inputs contain secret-like values: ${secretLikeInputPaths.join('; ')}`)
  }

  const catalogCoverage = buildCatalogCoverage()
  const observability = sliceStatus({
    evidenceArtifactId: input.observability?.evidenceArtifactId,
    reviewedBy: input.observability?.reviewedBy,
    reviewedAt: input.observability?.reviewedAt,
    notes: input.observability?.notes,
    checks: {
      dashboardsDeployed: Boolean(input.observability?.dashboardsDeployed),
      alertsDeployed: Boolean(input.observability?.alertsDeployed),
      alertRoutingVerified: Boolean(input.observability?.alertRoutingVerified),
      billingQaMonitoringVerified: Boolean(input.observability?.billingQaMonitoringVerified),
      metricsCatalogPresent: productionMetricsCatalog.length > 0,
      alertCatalogPresent: alertRuleCatalog.length > 0,
      billingAlertCatalogPresent: catalogCoverage.billingAlertRuleCount > 0,
    },
  })
  const operationsControls = sliceStatus({
    evidenceArtifactId: input.operationsControls?.evidenceArtifactId,
    reviewedBy: input.operationsControls?.reviewedBy,
    reviewedAt: input.operationsControls?.reviewedAt,
    notes: input.operationsControls?.notes,
    checks: {
      rollbackPlanApproved: Boolean(input.operationsControls?.rollbackPlanApproved),
      killSwitchesVerified: Boolean(input.operationsControls?.killSwitchesVerified),
      rateLimitsVerified: Boolean(input.operationsControls?.rateLimitsVerified),
      concurrencyLimitsVerified: Boolean(input.operationsControls?.concurrencyLimitsVerified),
      opsAdmissionRpcDeployed: Boolean(input.operationsControls?.opsAdmissionRpcDeployed),
      opsAdmissionRpcServiceRoleOnlyVerified: Boolean(input.operationsControls?.opsAdmissionRpcServiceRoleOnlyVerified),
      opsAdmissionRpcReadbackVerified: Boolean(input.operationsControls?.opsAdmissionRpcReadbackVerified),
      incidentRunbookApproved: Boolean(input.operationsControls?.incidentRunbookApproved),
      staticCostControlPoliciesPresent: catalogCoverage.costControlBlockers.length === 0,
    },
  })
  const readyForOpsObservabilityEvidence = observability.ready && operationsControls.ready
  const confirmRecordEvidence = parseBoolean(env.REEDITPRO_PRODUCTION_OPS_OBSERVABILITY_CONFIRM_RECORD_EVIDENCE)

  if (!readyForOpsObservabilityEvidence) {
    return {
      ok: false,
      mode: 'dry_run',
      readyForOpsObservabilityEvidence,
      recordConfirmationRequired: true,
      catalogCoverage,
      evidence: { observability, operationsControls },
      warnings: [
        'Ops/observability evidence is incomplete; no backend record call was attempted.',
        'This collector does not deploy dashboards, alerts, runbooks, kill switches, tools, workers, media processing, Supabase writes, Stripe, beta, or production.',
      ],
    }
  }

  if (!confirmRecordEvidence) {
    return {
      ok: true,
      mode: 'dry_run',
      readyForOpsObservabilityEvidence,
      recordConfirmationRequired: true,
      catalogCoverage,
      evidence: { observability, operationsControls },
      warnings: [
        'Dry-run only: REEDITPRO_PRODUCTION_OPS_OBSERVABILITY_CONFIRM_RECORD_EVIDENCE=true is required before reusing the backend production readiness evidence route.',
        'The all-up production readiness packet still requires Supabase, billing, wallet, Stripe, tools, hard-safety, and final owner evidence before recording can pass.',
      ],
    }
  }

  const record = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv({
    ...env,
    REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE: 'true',
  }, fetchImpl)
  if (!record.ok || record.mode !== 'recorded') {
    throw new Error('Production ops/observability evidence could not be recorded because the all-up production readiness evidence collector did not record a passing packet.')
  }

  return {
    ok: true,
    mode: 'recorded',
    readyForOpsObservabilityEvidence,
    recordConfirmationRequired: false,
    catalogCoverage,
    evidence: { observability, operationsControls },
    record,
    warnings: [
      ...record.warnings,
      'Ops/observability evidence was recorded only as part of the authenticated all-up production readiness evidence packet.',
      'This collector did not deploy dashboards, alerts, runbooks, kill switches, tools, workers, media processing, Supabase directly, Stripe, beta, or production.',
    ],
  }
}

function buildCatalogCoverage(): ProductionOpsObservabilityEvidenceCollectorRunResult['catalogCoverage'] {
  const billingAlertRuleCount = alertRuleCatalog.filter((alert) =>
    alert.alertId.includes('tool_cost') ||
    alert.alertId.includes('billing_qa') ||
    alert.alertId.includes('stripe'),
  ).length
  return {
    metricCount: productionMetricsCatalog.length,
    alertRuleCount: alertRuleCatalog.length,
    billingAlertRuleCount,
    costControlBlockers: costControlPolicyBlockers(),
  }
}

function sliceStatus(input: {
  evidenceArtifactId?: string
  reviewedBy?: string
  reviewedAt?: string
  notes?: string[]
  checks: Record<string, boolean>
}): ProductionEvidenceSliceStatus {
  const evidenceArtifactIdPresent = Boolean(input.evidenceArtifactId?.trim())
  const reviewedByPresent = Boolean(input.reviewedBy?.trim())
  const reviewedAtValid = Boolean(input.reviewedAt && isValidIsoDate(input.reviewedAt))
  const notesPresent = Boolean(input.notes?.length && input.notes.every((note) => note.trim().length > 0))
  const blockers = [
    evidenceArtifactIdPresent ? undefined : 'evidence artifact ID is missing.',
    reviewedByPresent ? undefined : 'reviewer reference is missing.',
    reviewedAtValid ? undefined : 'review timestamp is missing or invalid.',
    notesPresent ? undefined : 'evidence notes are missing.',
    ...Object.entries(input.checks).map(([name, ok]) => ok ? undefined : `${name} is not verified.`),
  ].filter((item): item is string => Boolean(item))

  return {
    ready: blockers.length === 0,
    evidenceArtifactIdPresent,
    reviewedByPresent,
    reviewedAtValid,
    notesPresent,
    checks: input.checks,
    blockers,
  }
}

function costControlPolicyBlockers(): string[] {
  const summary = buildCostControlSummary()
  const blockers: string[] = []
  if (!summary.killSwitchPolicy.globalGenerationKillSwitch) blockers.push('global generation kill switch is missing.')
  if (!summary.killSwitchPolicy.providerKillSwitch) blockers.push('provider kill switch is missing.')
  if (!summary.killSwitchPolicy.renderWorkerKillSwitch) blockers.push('render worker kill switch is missing.')
  if (summary.rateLimitPolicy.perWorkspaceJobCreationPerHour <= 0) blockers.push('workspace job creation rate limit is missing.')
  if (summary.rateLimitPolicy.perProjectConcurrentJobs <= 0) blockers.push('project concurrent job limit is missing.')
  if (summary.concurrencyPolicy.maxConcurrentJobsByWorkerType.render_worker <= 0) blockers.push('render worker concurrency limit is missing.')
  if (summary.timeoutPolicy.renderWorkerTimeoutMs <= 0) blockers.push('render worker timeout is missing.')
  return blockers
}

function isValidIsoDate(value: string): boolean {
  const time = Date.parse(value)
  return Number.isFinite(time) && new Date(time).toISOString() === value
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runProductionOpsObservabilityEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
