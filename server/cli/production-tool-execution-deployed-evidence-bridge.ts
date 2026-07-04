import { readFileSync } from 'node:fs'
import type { BetaPlatformDeployedEvidenceVerificationReport } from '../beta-readiness'
import {
  evaluateProductionToolExecutionReadinessGate,
  type ProductionToolExecutionReadinessGateInput,
} from '../beta-readiness/production-tool-execution-readiness-gate'
import { alertRuleCatalog, productionMetricsCatalog } from '../observability'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface ProductionToolExecutionDeployedEvidenceBridgeEnv {
  REEDITPRO_PRODUCTION_DEPLOYED_EVIDENCE_REPORT_JSON?: string
  REEDITPRO_PRODUCTION_DEPLOYED_EVIDENCE_REPORT_PATH?: string
}

export interface ProductionToolExecutionDeployedEvidenceBridgeResult {
  ok: boolean
  version: 'production-tool-execution-deployed-evidence-bridge-v1'
  mode: 'dry_run'
  sourceReportId: string
  sourceEnvironment: 'staging' | 'production'
  sourceId: string
  sourceSha?: string
  workspaceId: string
  projectId: string
  mappedFieldCount: number
  missingFieldCount: number
  mappedFields: string[]
  missingFields: string[]
  productionGateStatus: 'ready_for_paid_production' | 'blocked'
  productionToolExecutionAllowed: boolean
  paidProductionAllowed: boolean
  productionGateBlockerCount: number
  productionGateNextActions: string[]
  productionEvidenceDraft: ProductionToolExecutionReadinessGateInput
  warnings: string[]
}

type ProbeStatusMap = Record<string, boolean>

export function buildProductionToolExecutionDeployedEvidenceBridge(
  report: BetaPlatformDeployedEvidenceVerificationReport,
): ProductionToolExecutionDeployedEvidenceBridgeResult {
  assertNoSecretLikeReport(report)

  const checks = Object.fromEntries(report.checks.map((check) => [check.id, check.status === 'passed'])) as ProbeStatusMap
  const createdAt = report.createdAt
  const reviewedBy = 'production-deployed-evidence-bridge'
  const notes = [
    `Mapped from deployed platform evidence report ${report.reportId}.`,
    'This bridge maps only deployed probe facts and keeps owner-only or unproven production fields blocked.',
  ]
  const evidenceArtifactId = (suffix: string) => `${report.reportId}:${suffix}`

  const productionEvidenceDraft: ProductionToolExecutionReadinessGateInput = {
    sourceId: `production-deployed-evidence-bridge:${report.sourceId}`,
    sourceSha: report.sourceSha,
    workspaceId: report.workspaceId,
    projectId: report.projectId ?? 'project-id-required-for-production-bridge',
    supabasePersistence: {
      evidenceArtifactId: evidenceArtifactId('supabase'),
      reviewedBy,
      reviewedAt: createdAt,
      notes,
      environment: report.environment,
      toolCostEventsMigrationDeployed: passed(checks, 'tool_cost_events_migration_deployed'),
      betaReadinessEvidenceMigrationDeployed: passed(checks, 'beta_readiness_evidence_migration_deployed'),
      walletSettlementStateMigrationDeployed: passed(checks, 'wallet_settlement_verified'),
      productionReadinessEvidenceMigrationDeployed: passed(checks, 'production_readiness_evidence_migration_deployed'),
      workerRuntimeArtifactManifestMigrationDeployed: false,
      workerRuntimeArtifactManifestServiceRoleOnlyVerified: false,
      workerRuntimeArtifactManifestReadbackVerified: false,
      serviceRoleWritePathVerified: passed(checks, 'service_role_write_path_verified'),
      rlsMemberReadPathVerified: passed(checks, 'authenticated_rls_member_readback_verified'),
      explicitDataApiGrantsVerified: false,
      betaEvidenceBackendOnlyAccessVerified: false,
      productionEvidenceBackendOnlyAccessVerified: false,
      backupPitrApproved: false,
      securityAdvisorReviewed: false,
      performanceAdvisorReviewed: false,
      storagePoliciesVerified: false,
    },
    toolCostLedger: {
      evidenceArtifactId: evidenceArtifactId('tool-cost-ledger'),
      reviewedBy,
      reviewedAt: createdAt,
      notes,
      toolCostEventWriteVerified: passed(checks, 'staging_billing_qa_verified'),
      ledgerAppendOnlyVerified: false,
      idempotentReplayVerified: passed(checks, 'idempotent_replay_verified') && passed(checks, 'staging_billing_qa_verified'),
      projectSummaryReadbackVerified: passed(checks, 'staging_billing_qa_verified'),
    },
    walletSettlement: {
      evidenceArtifactId: evidenceArtifactId('wallet'),
      reviewedBy,
      reviewedAt: createdAt,
      notes,
      reservationVerified: false,
      spendVerified: passed(checks, 'wallet_settlement_verified'),
      releaseVerified: false,
      refundVerified: false,
      walletBalanceBeforeAfterReadbackVerified: false,
      settlementRpcVerified: passed(checks, 'wallet_settlement_verified'),
      settlementRpcServiceRoleOnlyVerified: false,
      idempotentSettlementReplayVerified: false,
      noSilentChargeVerified: false,
    },
    stripeBoundary: {
      evidenceArtifactId: evidenceArtifactId('stripe'),
      reviewedBy,
      reviewedAt: createdAt,
      notes,
      billingOwnerApproved: passed(checks, 'stripe_boundary_owner_verified'),
      noStripeFromToolCostSurface: false,
      serviceFeeExcludedFromToolEvents: false,
      stripeWebhookSeparatedFromToolLedger: false,
    },
    observability: {
      evidenceArtifactId: evidenceArtifactId('observability'),
      reviewedBy,
      reviewedAt: createdAt,
      notes,
      dashboardsDeployed: passed(checks, 'monitoring_deployment_verified'),
      alertsDeployed: passed(checks, 'monitoring_deployment_verified') && alertRuleCatalog.length > 0,
      alertRoutingVerified: passed(checks, 'monitoring_deployment_verified'),
      billingQaMonitoringVerified: passed(checks, 'monitoring_deployment_verified') &&
        alertRuleCatalog.some((rule) => rule.alertId.includes('tool_cost') || rule.alertId.includes('billing_qa') || rule.alertId.includes('stripe')) &&
        productionMetricsCatalog.length > 0,
    },
    operationsControls: {
      evidenceArtifactId: evidenceArtifactId('operations'),
      reviewedBy,
      reviewedAt: createdAt,
      notes,
      rollbackPlanApproved: false,
      killSwitchesVerified: false,
      killSwitchBlockVerified: false,
      rateLimitsVerified: false,
      rateLimitBlockVerified: false,
      concurrencyLimitsVerified: false,
      concurrencyLimitBlockVerified: false,
      opsAdmissionRpcDeployed: false,
      opsAdmissionRpcServiceRoleOnlyVerified: false,
      opsAdmissionRpcReadbackVerified: false,
      incidentRunbookApproved: false,
    },
    toolEvidence: {
      evidenceArtifactId: evidenceArtifactId('tools'),
      reviewedBy,
      reviewedAt: createdAt,
      notes,
      sourceId: 'production-deployed-evidence-bridge:tools',
      sourceSha: report.sourceSha,
      allProductionToolsAccepted: false,
      modelWeightLicenseReviewApproved: false,
    },
    hardSafety: {
      evidenceArtifactId: evidenceArtifactId('hard-safety'),
      reviewedBy,
      reviewedAt: createdAt,
      notes,
      approvedPlanSnapshotRequired: false,
      creditEstimateAndReservationRequired: false,
      idempotencyRequired: false,
      rawPromptsRejected: false,
      secretsRejected: false,
      temporaryAccessLinksRejectedAsSourceTruth: false,
      frontendHeavyExecutionBlocked: false,
      licenseAndModelWeightReviewRequired: false,
      silentBillingBlocked: false,
    },
    finalOwnerSignoff: {
      evidenceArtifactId: evidenceArtifactId('owner-signoff'),
      reviewedBy,
      reviewedAt: createdAt,
      notes,
      deploymentOwnerApproved: ownerApprovalPassed(report, 'deploymentApproved'),
      securityOwnerApproved: ownerApprovalPassed(report, 'securityApproved'),
      storagePrivacyOwnerApproved: ownerApprovalPassed(report, 'storageApproved'),
      legalOwnerApproved: ownerApprovalPassed(report, 'legalApproved'),
      supportOwnerApproved: ownerApprovalPassed(report, 'supportApproved'),
      billingOwnerApproved: passed(checks, 'stripe_boundary_owner_verified'),
      operationsOwnerApproved: false,
      realUserMediaBetaApproved: false,
      privateMediaApproval: false,
      artifactPrivacyEvidenceReady: false,
      paidProductionApproved: false,
      finalDeliveryShareApproved: false,
    },
  }

  const mappedFields = mappedProductionFields(productionEvidenceDraft)
  const missingFields = missingProductionFields(productionEvidenceDraft)
  const gate = evaluateProductionToolExecutionReadinessGate(productionEvidenceDraft)

  return {
    ok: true,
    version: 'production-tool-execution-deployed-evidence-bridge-v1',
    mode: 'dry_run',
    sourceReportId: report.reportId,
    sourceEnvironment: report.environment,
    sourceId: report.sourceId,
    sourceSha: report.sourceSha,
    workspaceId: report.workspaceId,
    projectId: productionEvidenceDraft.projectId,
    mappedFieldCount: mappedFields.length,
    missingFieldCount: missingFields.length,
    mappedFields,
    missingFields,
    productionGateStatus: gate.status,
    productionToolExecutionAllowed: gate.productionToolExecutionAllowed,
    paidProductionAllowed: gate.paidProductionAllowed,
    productionGateBlockerCount: gate.blockers.length,
    productionGateNextActions: gate.nextActions,
    productionEvidenceDraft,
    warnings: [
      'Dry-run bridge only; no backend route, Supabase write, Stripe call, tool execution, worker dispatch, media processing, beta, or production activation occurred.',
      'Mapped fields are limited to facts proven by the supplied deployed platform evidence report.',
      'Owner-only, deployment-ops negative controls, hard-safety, model/license, wallet release/refund/reservation, and all-up signoff fields remain blocked until supplied as explicit evidence.',
    ],
  }
}

export function runProductionToolExecutionDeployedEvidenceBridgeFromEnv(
  env: ProductionToolExecutionDeployedEvidenceBridgeEnv,
): ProductionToolExecutionDeployedEvidenceBridgeResult {
  const raw = env.REEDITPRO_PRODUCTION_DEPLOYED_EVIDENCE_REPORT_JSON ??
    (env.REEDITPRO_PRODUCTION_DEPLOYED_EVIDENCE_REPORT_PATH
      ? readFileSync(env.REEDITPRO_PRODUCTION_DEPLOYED_EVIDENCE_REPORT_PATH, 'utf8')
      : undefined)

  if (!raw) {
    throw new Error('Provide REEDITPRO_PRODUCTION_DEPLOYED_EVIDENCE_REPORT_JSON or REEDITPRO_PRODUCTION_DEPLOYED_EVIDENCE_REPORT_PATH.')
  }

  const parsed = JSON.parse(raw) as unknown
  const report = unwrapReport(parsed)
  return buildProductionToolExecutionDeployedEvidenceBridge(report)
}

function unwrapReport(value: unknown): BetaPlatformDeployedEvidenceVerificationReport {
  if (isRecord(value) && isRecord(value.data) && isRecord(value.data.report)) {
    return value.data.report as unknown as BetaPlatformDeployedEvidenceVerificationReport
  }
  if (isRecord(value) && isRecord(value.report)) {
    return value.report as unknown as BetaPlatformDeployedEvidenceVerificationReport
  }
  return value as BetaPlatformDeployedEvidenceVerificationReport
}

function passed(checks: ProbeStatusMap, id: string): boolean {
  return checks[id] === true
}

function ownerApprovalPassed(
  report: BetaPlatformDeployedEvidenceVerificationReport,
  key: 'deploymentApproved' | 'securityApproved' | 'storageApproved' | 'legalApproved' | 'supportApproved',
): boolean {
  const approvals = report.evidencePacket?.approvals as Record<string, unknown> | undefined
  return approvals?.[key] === true
}

function mappedProductionFields(input: ProductionToolExecutionReadinessGateInput): string[] {
  return productionBooleanFields(input)
    .filter((field) => field.value === true)
    .map((field) => field.path)
}

function missingProductionFields(input: ProductionToolExecutionReadinessGateInput): string[] {
  return productionBooleanFields(input)
    .filter((field) => field.value !== true)
    .map((field) => field.path)
}

function productionBooleanFields(input: ProductionToolExecutionReadinessGateInput): Array<{ path: string; value: boolean | undefined }> {
  return [
    ...sectionBooleanFields('supabasePersistence', input.supabasePersistence),
    ...sectionBooleanFields('toolCostLedger', input.toolCostLedger),
    ...sectionBooleanFields('walletSettlement', input.walletSettlement),
    ...sectionBooleanFields('stripeBoundary', input.stripeBoundary),
    ...sectionBooleanFields('observability', input.observability),
    ...sectionBooleanFields('operationsControls', input.operationsControls),
    ...sectionBooleanFields('toolEvidence', input.toolEvidence),
    ...sectionBooleanFields('hardSafety', input.hardSafety),
    ...sectionBooleanFields('finalOwnerSignoff', input.finalOwnerSignoff),
  ]
}

function sectionBooleanFields(sectionName: string, value: unknown): Array<{ path: string; value: boolean | undefined }> {
  if (!isRecord(value)) return []
  return Object.entries(value)
    .filter(([, nested]) => typeof nested === 'boolean')
    .map(([key, nested]) => ({ path: `${sectionName}.${key}`, value: nested as boolean }))
}

function assertNoSecretLikeReport(report: BetaPlatformDeployedEvidenceVerificationReport): void {
  const reportValues = [
    report.reportId,
    report.sourceId,
    report.sourceSha,
    report.workspaceId,
    report.projectId,
    ...stringArray((report as unknown as { notes?: unknown }).notes),
    ...stringArray(report.missingEvidence),
    ...stringArray(report.ownerApprovalGaps),
    ...arrayValue(report.checks).flatMap((check) => [
      check.id,
      check.nextAction,
      ...check.evidence,
    ]),
    ...(report.evidencePacket?.platformEvidence?.notes ?? []),
  ]
  const secretLikePaths = collectSecretLikePaths(reportValues, 'productionDeployedEvidenceBridge.reportValues')
  if (secretLikePaths.length > 0) {
    throw new Error(`Deployed evidence report contains secret-like fields: ${secretLikePaths.join('; ')}`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function arrayValue<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : []
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = runProductionToolExecutionDeployedEvidenceBridgeFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
