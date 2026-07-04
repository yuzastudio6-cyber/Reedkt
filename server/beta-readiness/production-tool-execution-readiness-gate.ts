import { betaReadinessChecklist } from './beta-readiness-checklist'
import { buildBetaReadinessReport } from './beta-readiness-report-builder'
import type {
  BetaReadinessReport,
  ToolBetaAcceptedExecutionEvidence,
  ToolBetaPlatformReadinessEvidence,
} from './beta-readiness-types'
import { buildCostControlSummary } from '../cost-controls'
import { alertRuleCatalog, productionMetricsCatalog } from '../observability'
import { PRODUCTION_TOOL_IDS, getToolsWithModelWeights, type ProductionToolId } from '../tool-registry'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export type ProductionToolExecutionReadinessStatus = 'ready_for_paid_production' | 'blocked'

export interface ProductionToolExecutionEvidenceNotes {
  evidenceArtifactId: string
  reviewedBy: string
  reviewedAt: string
  notes: string[]
}

export interface ProductionSupabasePersistenceEvidence extends ProductionToolExecutionEvidenceNotes {
  environment: 'staging' | 'production'
  toolCostEventsMigrationDeployed: boolean
  betaReadinessEvidenceMigrationDeployed: boolean
  walletSettlementStateMigrationDeployed: boolean
  productionReadinessEvidenceMigrationDeployed: boolean
  workerRuntimeArtifactManifestMigrationDeployed: boolean
  workerRuntimeArtifactManifestServiceRoleOnlyVerified: boolean
  workerRuntimeArtifactManifestReadbackVerified: boolean
  serviceRoleWritePathVerified: boolean
  rlsMemberReadPathVerified: boolean
  explicitDataApiGrantsVerified: boolean
  betaEvidenceBackendOnlyAccessVerified: boolean
  productionEvidenceBackendOnlyAccessVerified: boolean
  backupPitrApproved: boolean
  securityAdvisorReviewed: boolean
  performanceAdvisorReviewed: boolean
  storagePoliciesVerified: boolean
}

export interface ProductionToolCostLedgerEvidence extends ProductionToolExecutionEvidenceNotes {
  toolCostEventWriteVerified: boolean
  ledgerAppendOnlyVerified: boolean
  idempotentReplayVerified: boolean
  projectSummaryReadbackVerified: boolean
}

export interface ProductionWalletSettlementEvidence extends ProductionToolExecutionEvidenceNotes {
  reservationVerified: boolean
  spendVerified: boolean
  releaseVerified: boolean
  refundVerified: boolean
  settlementRpcVerified: boolean
  settlementRpcServiceRoleOnlyVerified: boolean
  idempotentSettlementReplayVerified: boolean
  noSilentChargeVerified: boolean
}

export interface ProductionStripeBoundaryEvidence extends ProductionToolExecutionEvidenceNotes {
  billingOwnerApproved: boolean
  noStripeFromToolCostSurface: boolean
  serviceFeeExcludedFromToolEvents: boolean
  stripeWebhookSeparatedFromToolLedger: boolean
}

export interface ProductionObservabilityEvidence extends ProductionToolExecutionEvidenceNotes {
  dashboardsDeployed: boolean
  alertsDeployed: boolean
  alertRoutingVerified: boolean
  billingQaMonitoringVerified: boolean
}

export interface ProductionOperationsControlEvidence extends ProductionToolExecutionEvidenceNotes {
  rollbackPlanApproved: boolean
  killSwitchesVerified: boolean
  rateLimitsVerified: boolean
  concurrencyLimitsVerified: boolean
  opsAdmissionRpcDeployed: boolean
  opsAdmissionRpcServiceRoleOnlyVerified: boolean
  opsAdmissionRpcReadbackVerified: boolean
  incidentRunbookApproved: boolean
}

export interface ProductionToolEvidence extends ProductionToolExecutionEvidenceNotes {
  sourceId: string
  sourceSha?: string
  allProductionToolsAccepted: boolean
  modelWeightLicenseReviewApproved: boolean
}

export interface ProductionHardSafetyEvidence extends ProductionToolExecutionEvidenceNotes {
  approvedPlanSnapshotRequired: boolean
  creditEstimateAndReservationRequired: boolean
  idempotencyRequired: boolean
  rawPromptsRejected: boolean
  secretsRejected: boolean
  temporaryAccessLinksRejectedAsSourceTruth: boolean
  frontendHeavyExecutionBlocked: boolean
  licenseAndModelWeightReviewRequired: boolean
  silentBillingBlocked: boolean
}

export interface ProductionFinalOwnerSignoffEvidence extends ProductionToolExecutionEvidenceNotes {
  deploymentOwnerApproved: boolean
  securityOwnerApproved: boolean
  storagePrivacyOwnerApproved: boolean
  legalOwnerApproved: boolean
  supportOwnerApproved: boolean
  billingOwnerApproved: boolean
  operationsOwnerApproved: boolean
  realUserMediaBetaApproved: boolean
  privateMediaApproval: boolean
  artifactPrivacyEvidenceReady: boolean
  paidProductionApproved: boolean
  finalDeliveryShareApproved: boolean
}

export interface ProductionToolExecutionReadinessGateInput {
  sourceId: string
  sourceSha?: string
  workspaceId: string
  projectId: string
  supabasePersistence?: ProductionSupabasePersistenceEvidence
  toolCostLedger?: ProductionToolCostLedgerEvidence
  walletSettlement?: ProductionWalletSettlementEvidence
  stripeBoundary?: ProductionStripeBoundaryEvidence
  observability?: ProductionObservabilityEvidence
  operationsControls?: ProductionOperationsControlEvidence
  toolEvidence?: ProductionToolEvidence
  hardSafety?: ProductionHardSafetyEvidence
  finalOwnerSignoff?: ProductionFinalOwnerSignoffEvidence
}

export interface ProductionToolExecutionReadinessCheck {
  id: string
  label: string
  status: 'passed' | 'blocked'
  evidence: string[]
  blockers: string[]
}

export interface ProductionToolExecutionReadinessGateReport {
  reportId: string
  createdAt: string
  sourceId: string
  sourceSha?: string
  workspaceId: string
  projectId: string
  status: ProductionToolExecutionReadinessStatus
  productionToolExecutionAllowed: boolean
  paidProductionAllowed: boolean
  supabaseProductionPersistenceReady: boolean
  toolCostLedgerWritesReady: boolean
  walletReserveSpendReleaseRefundReady: boolean
  stripeBoundaryConfirmed: boolean
  observabilityAlertsReady: boolean
  rollbackKillSwitchesReady: boolean
  rateConcurrencyLimitsReady: boolean
  finalOwnerSignoffReady: boolean
  productionToolCount: number
  acceptedProductionToolCount: number
  modelWeightToolCount: number
  productReadyLocalOssCount: number
  checks: ProductionToolExecutionReadinessCheck[]
  betaReadiness: BetaReadinessReport
  blockers: string[]
  warnings: string[]
  nextActions: string[]
}

export function evaluateProductionToolExecutionReadinessGate(
  input: ProductionToolExecutionReadinessGateInput,
): ProductionToolExecutionReadinessGateReport {
  assertNoSecretLikeProductionEvidence(input)

  const checks = buildChecks(input)
  const preBetaBlockers = checks.flatMap((checkItem) => checkItem.blockers)
  const acceptedToolEvidence = buildAcceptedToolEvidence(input.toolEvidence)
  const platformEvidence = buildPlatformEvidence(input)
  const signoff = input.finalOwnerSignoff
  const betaReadiness = buildBetaReadinessReport({
    e2eDryRunPassed: true,
    safetyDocsExist: true,
    costDocsExist: true,
    boundedToolExecutionReady: preBetaBlockers.length === 0,
    productionReadinessBlocked: preBetaBlockers.length > 0,
    checklistEvidence: buildChecklistEvidence(input, preBetaBlockers.length === 0),
    acceptedToolEvidence,
    platformEvidence,
    deploymentApproved: signoff?.deploymentOwnerApproved,
    securityApproved: signoff?.securityOwnerApproved,
    storageApproved: signoff?.storagePrivacyOwnerApproved,
    modelLicensesApproved: input.toolEvidence?.modelWeightLicenseReviewApproved,
    legalApproved: signoff?.legalOwnerApproved,
    monitoringApproved: input.observability?.dashboardsDeployed && input.observability?.alertsDeployed,
    supportApproved: signoff?.supportOwnerApproved,
    realUserMediaBetaApproved: signoff?.realUserMediaBetaApproved,
    privateMediaApproval: signoff?.privateMediaApproval,
    artifactPrivacyEvidenceReady: signoff?.artifactPrivacyEvidenceReady,
    paidProductionApproved: signoff?.paidProductionApproved,
    productionDeploymentApproved: signoff?.deploymentOwnerApproved,
    billingLedgerPersistenceApproved: isToolCostLedgerReady(input) && isWalletSettlementReady(input),
    costControlsApproved: isOperationsControlReady(input),
    observabilityApproved: isObservabilityReady(input),
    incidentRunbookApproved: input.operationsControls?.incidentRunbookApproved,
    finalDeliveryShareApproved: signoff?.finalDeliveryShareApproved,
    hardLaunchBlockersPresent: preBetaBlockers.length > 0,
  })
  const blockers = uniqueStrings([
    ...preBetaBlockers,
    ...betaReadiness.goNoGo.launchStageDecisions.paid_production.blockers,
  ])
  const productionToolExecutionAllowed = blockers.length === 0 && betaReadiness.goNoGo.paidProductionAllowed

  return {
    reportId: `production-tool-execution-readiness-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    status: productionToolExecutionAllowed ? 'ready_for_paid_production' : 'blocked',
    productionToolExecutionAllowed,
    paidProductionAllowed: betaReadiness.goNoGo.paidProductionAllowed,
    supabaseProductionPersistenceReady: isSupabasePersistenceReady(input),
    toolCostLedgerWritesReady: isToolCostLedgerReady(input),
    walletReserveSpendReleaseRefundReady: isWalletSettlementReady(input),
    stripeBoundaryConfirmed: isStripeBoundaryReady(input),
    observabilityAlertsReady: isObservabilityReady(input),
    rollbackKillSwitchesReady: Boolean(input.operationsControls?.rollbackPlanApproved && input.operationsControls.killSwitchesVerified),
    rateConcurrencyLimitsReady: Boolean(
      input.operationsControls?.rateLimitsVerified &&
      input.operationsControls.concurrencyLimitsVerified &&
      input.operationsControls.opsAdmissionRpcDeployed &&
      input.operationsControls.opsAdmissionRpcServiceRoleOnlyVerified &&
      input.operationsControls.opsAdmissionRpcReadbackVerified,
    ),
    finalOwnerSignoffReady: isFinalOwnerSignoffReady(input),
    productionToolCount: PRODUCTION_TOOL_IDS.length,
    acceptedProductionToolCount: acceptedToolEvidence.length,
    modelWeightToolCount: getToolsWithModelWeights().length,
    productReadyLocalOssCount: betaReadiness.toolExecutionReadiness.productReadyLocalOssCount,
    checks,
    betaReadiness,
    blockers,
    warnings: [
      'This gate does not deploy, call Supabase, call Stripe, run workers, process media, or mutate wallets.',
      productionToolExecutionAllowed
        ? 'Paid production is allowed only for the exact scope represented by the supplied evidence packet.'
        : 'Paid production remains blocked until every named production evidence and owner approval gate passes.',
    ],
    nextActions: productionToolExecutionAllowed
      ? ['Proceed only through an approved deployment/runbook step that uses the recorded evidence packet and keeps audit/rollback controls active.']
      : nextActionsForBlockers(blockers),
  }
}

function buildChecklistEvidence(
  input: ProductionToolExecutionReadinessGateInput,
  evidenceReady: boolean,
): Array<{ itemId: string; sourceId: string; sourceSha?: string; status: 'passed'; notes: string[] }> {
  if (!evidenceReady) return []
  return betaReadinessChecklist.map((item) => ({
    itemId: item.id,
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    status: 'passed',
    notes: [`Production tool execution readiness gate accepted ${item.label}.`],
  }))
}

function buildChecks(input: ProductionToolExecutionReadinessGateInput): ProductionToolExecutionReadinessCheck[] {
  return [
    check('supabase_production_persistence', 'Supabase production persistence', [
      requireEvidence(input.supabasePersistence, 'Supabase production persistence evidence is missing.'),
      ...requireEvidenceProvenance(input.supabasePersistence, 'Supabase production persistence'),
      requireBoolean(input.supabasePersistence?.environment === 'production', 'Evidence environment is not production.'),
      requireBoolean(input.supabasePersistence?.toolCostEventsMigrationDeployed, 'tool_cost_events migration deployment is unverified.'),
      requireBoolean(input.supabasePersistence?.betaReadinessEvidenceMigrationDeployed, 'beta_readiness_evidence migration deployment is unverified.'),
      requireBoolean(input.supabasePersistence?.walletSettlementStateMigrationDeployed, 'wallet settlement state-update migration deployment is unverified.'),
      requireBoolean(input.supabasePersistence?.productionReadinessEvidenceMigrationDeployed, 'production_tool_execution_readiness_evidence_packets migration deployment is unverified.'),
      requireBoolean(input.supabasePersistence?.workerRuntimeArtifactManifestMigrationDeployed, 'production_worker_runtime artifact manifest migration deployment is unverified.'),
      requireBoolean(input.supabasePersistence?.workerRuntimeArtifactManifestServiceRoleOnlyVerified, 'production worker artifact manifest service-role-only access is unverified.'),
      requireBoolean(input.supabasePersistence?.workerRuntimeArtifactManifestReadbackVerified, 'production worker artifact manifest readback is unverified.'),
      requireBoolean(input.supabasePersistence?.serviceRoleWritePathVerified, 'service-role write path is unverified.'),
      requireBoolean(input.supabasePersistence?.rlsMemberReadPathVerified, 'authenticated RLS member readback is unverified.'),
      requireBoolean(input.supabasePersistence?.explicitDataApiGrantsVerified, 'explicit Supabase Data API grants are unverified.'),
      requireBoolean(input.supabasePersistence?.betaEvidenceBackendOnlyAccessVerified, 'backend-only beta evidence access is unverified.'),
      requireBoolean(input.supabasePersistence?.productionEvidenceBackendOnlyAccessVerified, 'backend-only production readiness evidence access is unverified.'),
      requireBoolean(input.supabasePersistence?.backupPitrApproved, 'backup/PITR approval is missing.'),
      requireBoolean(input.supabasePersistence?.securityAdvisorReviewed, 'Supabase Security Advisor review is missing.'),
      requireBoolean(input.supabasePersistence?.performanceAdvisorReviewed, 'Supabase Performance Advisor review is missing.'),
      requireBoolean(input.supabasePersistence?.storagePoliciesVerified, 'private storage policy verification is missing.'),
      requireNotes(input.supabasePersistence?.notes, 'Supabase persistence evidence notes are missing.'),
    ], input.supabasePersistence?.notes),
    check('tool_cost_ledger_writes', 'Tool cost ledger writes', [
      requireEvidence(input.toolCostLedger, 'Tool cost ledger evidence is missing.'),
      ...requireEvidenceProvenance(input.toolCostLedger, 'Tool cost ledger'),
      requireBoolean(input.toolCostLedger?.toolCostEventWriteVerified, 'tool cost event write is unverified.'),
      requireBoolean(input.toolCostLedger?.ledgerAppendOnlyVerified, 'append-only ledger behavior is unverified.'),
      requireBoolean(input.toolCostLedger?.idempotentReplayVerified, 'idempotent replay is unverified.'),
      requireBoolean(input.toolCostLedger?.projectSummaryReadbackVerified, 'project summary readback is unverified.'),
      requireNotes(input.toolCostLedger?.notes, 'Tool cost ledger evidence notes are missing.'),
    ], input.toolCostLedger?.notes),
    check('wallet_settlement', 'Wallet reserve/spend/release/refund', [
      requireEvidence(input.walletSettlement, 'Wallet settlement evidence is missing.'),
      ...requireEvidenceProvenance(input.walletSettlement, 'Wallet settlement'),
      requireBoolean(input.walletSettlement?.reservationVerified, 'credit reservation verification is missing.'),
      requireBoolean(input.walletSettlement?.spendVerified, 'wallet spend verification is missing.'),
      requireBoolean(input.walletSettlement?.releaseVerified, 'wallet release verification is missing.'),
      requireBoolean(input.walletSettlement?.refundVerified, 'wallet refund verification is missing.'),
      requireBoolean(input.walletSettlement?.settlementRpcVerified, 'settlement RPC verification is missing.'),
      requireBoolean(input.walletSettlement?.settlementRpcServiceRoleOnlyVerified, 'settlement RPC service-role-only execution is unverified.'),
      requireBoolean(input.walletSettlement?.idempotentSettlementReplayVerified, 'idempotent settlement replay is missing.'),
      requireBoolean(input.walletSettlement?.noSilentChargeVerified, 'no-silent-charge verification is missing.'),
      requireNotes(input.walletSettlement?.notes, 'Wallet settlement evidence notes are missing.'),
    ], input.walletSettlement?.notes),
    check('stripe_boundary', 'Stripe boundary confirmation', [
      requireEvidence(input.stripeBoundary, 'Stripe boundary evidence is missing.'),
      ...requireEvidenceProvenance(input.stripeBoundary, 'Stripe boundary'),
      requireBoolean(input.stripeBoundary?.billingOwnerApproved, 'billing-owner Stripe boundary approval is missing.'),
      requireBoolean(input.stripeBoundary?.noStripeFromToolCostSurface, 'tool cost surfaces are not proven Stripe-free.'),
      requireBoolean(input.stripeBoundary?.serviceFeeExcludedFromToolEvents, 'service fee exclusion is unverified.'),
      requireBoolean(input.stripeBoundary?.stripeWebhookSeparatedFromToolLedger, 'Stripe webhook separation is unverified.'),
      requireNotes(input.stripeBoundary?.notes, 'Stripe boundary evidence notes are missing.'),
    ], input.stripeBoundary?.notes),
    check('observability_alerts', 'Observability and alerts', [
      requireEvidence(input.observability, 'Observability evidence is missing.'),
      ...requireEvidenceProvenance(input.observability, 'Observability'),
      requireBoolean(input.observability?.dashboardsDeployed, 'monitoring dashboards are not deployed.'),
      requireBoolean(input.observability?.alertsDeployed, 'alerts are not deployed.'),
      requireBoolean(input.observability?.alertRoutingVerified, 'alert routing is unverified.'),
      requireBoolean(input.observability?.billingQaMonitoringVerified, 'billing QA monitoring is unverified.'),
      requireBoolean(productionMetricsCatalog.length > 0, 'production metrics catalog is missing.'),
      requireBoolean(alertRuleCatalog.length > 0, 'alert rule catalog is missing.'),
      requireNotes(input.observability?.notes, 'Observability evidence notes are missing.'),
    ], input.observability?.notes),
    check('operations_controls', 'Rollback, kill switches, rate limits, and concurrency limits', [
      requireEvidence(input.operationsControls, 'Operations control evidence is missing.'),
      ...requireEvidenceProvenance(input.operationsControls, 'Operations controls'),
      requireBoolean(input.operationsControls?.rollbackPlanApproved, 'rollback plan approval is missing.'),
      requireBoolean(input.operationsControls?.killSwitchesVerified, 'kill switches are unverified.'),
      requireBoolean(input.operationsControls?.rateLimitsVerified, 'rate limits are unverified.'),
      requireBoolean(input.operationsControls?.concurrencyLimitsVerified, 'concurrency limits are unverified.'),
      requireBoolean(input.operationsControls?.opsAdmissionRpcDeployed, 'claim_production_gateway_worker_lease RPC deployment is unverified.'),
      requireBoolean(input.operationsControls?.opsAdmissionRpcServiceRoleOnlyVerified, 'claim_production_gateway_worker_lease service-role-only execution is unverified.'),
      requireBoolean(input.operationsControls?.opsAdmissionRpcReadbackVerified, 'claim_production_gateway_worker_lease deployed readback is unverified.'),
      requireBoolean(input.operationsControls?.incidentRunbookApproved, 'incident runbook approval is missing.'),
      ...costControlPolicyBlockers(),
      requireNotes(input.operationsControls?.notes, 'Operations control evidence notes are missing.'),
    ], input.operationsControls?.notes),
    check('tool_execution_evidence', 'Production tool execution evidence', [
      requireEvidence(input.toolEvidence, 'Production tool evidence is missing.'),
      ...requireEvidenceProvenance(input.toolEvidence, 'Production tool evidence'),
      requireBoolean(Boolean(input.toolEvidence?.sourceId.trim()), 'production tool evidence sourceId is missing.'),
      requireBoolean(input.toolEvidence?.allProductionToolsAccepted, 'not every production tool is accepted for production execution.'),
      requireBoolean(input.toolEvidence?.modelWeightLicenseReviewApproved, 'model/license review is missing.'),
      requireNotes(input.toolEvidence?.notes, 'Production tool evidence notes are missing.'),
    ], input.toolEvidence?.notes),
    check('hard_safety_invariants', 'Hard safety invariants', [
      requireEvidence(input.hardSafety, 'Hard safety evidence is missing.'),
      ...requireEvidenceProvenance(input.hardSafety, 'Hard safety evidence'),
      requireBoolean(input.hardSafety?.approvedPlanSnapshotRequired, 'approved plan snapshot requirement is not enforced.'),
      requireBoolean(input.hardSafety?.creditEstimateAndReservationRequired, 'credit estimate/reservation requirement is not enforced.'),
      requireBoolean(input.hardSafety?.idempotencyRequired, 'idempotency requirement is not enforced.'),
      requireBoolean(input.hardSafety?.rawPromptsRejected, 'raw prompt rejection is not enforced.'),
      requireBoolean(input.hardSafety?.secretsRejected, 'secret rejection is not enforced.'),
      requireBoolean(input.hardSafety?.temporaryAccessLinksRejectedAsSourceTruth, 'signed URL source-truth rejection is not enforced.'),
      requireBoolean(input.hardSafety?.frontendHeavyExecutionBlocked, 'frontend heavy execution block is not enforced.'),
      requireBoolean(input.hardSafety?.licenseAndModelWeightReviewRequired, 'license/model-weight review requirement is not enforced.'),
      requireBoolean(input.hardSafety?.silentBillingBlocked, 'silent billing block is not enforced.'),
      requireNotes(input.hardSafety?.notes, 'Hard safety evidence notes are missing.'),
    ], input.hardSafety?.notes),
    check('final_owner_signoff', 'Final owner signoff', [
      requireEvidence(input.finalOwnerSignoff, 'Final owner signoff is missing.'),
      ...requireEvidenceProvenance(input.finalOwnerSignoff, 'Final owner signoff'),
      requireBoolean(input.finalOwnerSignoff?.deploymentOwnerApproved, 'deployment owner approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.securityOwnerApproved, 'security owner approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.storagePrivacyOwnerApproved, 'storage/privacy owner approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.legalOwnerApproved, 'legal owner approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.supportOwnerApproved, 'support owner approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.billingOwnerApproved, 'billing owner approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.operationsOwnerApproved, 'operations owner approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.realUserMediaBetaApproved, 'real-user-media beta approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.privateMediaApproval, 'private media approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.artifactPrivacyEvidenceReady, 'artifact privacy evidence is missing.'),
      requireBoolean(input.finalOwnerSignoff?.paidProductionApproved, 'paid production approval is missing.'),
      requireBoolean(input.finalOwnerSignoff?.finalDeliveryShareApproved, 'final delivery/share approval is missing.'),
      requireNotes(input.finalOwnerSignoff?.notes, 'Final owner signoff notes are missing.'),
    ], input.finalOwnerSignoff?.notes),
  ]
}

function buildPlatformEvidence(input: ProductionToolExecutionReadinessGateInput): ToolBetaPlatformReadinessEvidence | undefined {
  if (!isSupabasePersistenceReady(input) || !isToolCostLedgerReady(input) || !isWalletSettlementReady(input) ||
    !isStripeBoundaryReady(input) || !isObservabilityReady(input) || !isFinalOwnerSignoffReady(input)) {
    return undefined
  }

  return {
    sourceId: input.sourceId,
    sourceSha: input.sourceSha,
    environment: 'production',
    toolCostEventsMigrationDeployed: true,
    productionReadinessEvidenceMigrationDeployed: true,
    serviceRoleWritePathVerified: true,
    rlsMemberReadPathVerified: true,
    idempotentReplayVerified: true,
    walletSettlementVerified: true,
    stripeBoundaryVerified: true,
    monitoringVerified: true,
    billingQaVerified: true,
    deploymentApproved: true,
    securityApproved: true,
    storageApproved: true,
    legalApproved: true,
    supportApproved: true,
    notes: [
      ...(input.supabasePersistence?.notes ?? []),
      ...(input.toolCostLedger?.notes ?? []),
      ...(input.walletSettlement?.notes ?? []),
      ...(input.stripeBoundary?.notes ?? []),
      ...(input.observability?.notes ?? []),
      ...(input.finalOwnerSignoff?.notes ?? []),
    ],
  }
}

function buildAcceptedToolEvidence(toolEvidence?: ProductionToolEvidence): ToolBetaAcceptedExecutionEvidence[] {
  if (!toolEvidence?.allProductionToolsAccepted || !toolEvidence.modelWeightLicenseReviewApproved) return []

  const modelWeightToolIds = new Set(getToolsWithModelWeights().map((profile) => profile.toolId))
  return PRODUCTION_TOOL_IDS.map((toolId: ProductionToolId) => ({
    toolId,
    sourceId: toolEvidence.sourceId,
    sourceSha: toolEvidence.sourceSha,
    readinessStatus: 'passed',
    realExecutionVerified: true,
    productionReadinessAccepted: true,
    productReadyLocalOss: true,
    modelWeightsApproved: modelWeightToolIds.has(toolId) ? true : undefined,
    notes: toolEvidence.notes,
  }))
}

function isSupabasePersistenceReady(input: ProductionToolExecutionReadinessGateInput): boolean {
  const evidence = input.supabasePersistence
  return Boolean(evidence && hasEvidenceProvenance(evidence) &&
    evidence.environment === 'production' &&
    evidence.toolCostEventsMigrationDeployed &&
    evidence.betaReadinessEvidenceMigrationDeployed &&
    evidence.walletSettlementStateMigrationDeployed &&
    evidence.productionReadinessEvidenceMigrationDeployed &&
    evidence.workerRuntimeArtifactManifestMigrationDeployed &&
    evidence.workerRuntimeArtifactManifestServiceRoleOnlyVerified &&
    evidence.workerRuntimeArtifactManifestReadbackVerified &&
    evidence.serviceRoleWritePathVerified &&
    evidence.rlsMemberReadPathVerified &&
    evidence.explicitDataApiGrantsVerified &&
    evidence.betaEvidenceBackendOnlyAccessVerified &&
    evidence.productionEvidenceBackendOnlyAccessVerified &&
    evidence.backupPitrApproved &&
    evidence.securityAdvisorReviewed &&
    evidence.performanceAdvisorReviewed &&
    evidence.storagePoliciesVerified &&
    evidence.notes.length > 0)
}

function isToolCostLedgerReady(input: ProductionToolExecutionReadinessGateInput): boolean {
  const evidence = input.toolCostLedger
  return Boolean(evidence && hasEvidenceProvenance(evidence) &&
    evidence.toolCostEventWriteVerified &&
    evidence.ledgerAppendOnlyVerified &&
    evidence.idempotentReplayVerified &&
    evidence.projectSummaryReadbackVerified &&
    evidence.notes.length > 0)
}

function isWalletSettlementReady(input: ProductionToolExecutionReadinessGateInput): boolean {
  const evidence = input.walletSettlement
  return Boolean(evidence && hasEvidenceProvenance(evidence) &&
    evidence.reservationVerified &&
    evidence.spendVerified &&
    evidence.releaseVerified &&
    evidence.refundVerified &&
    evidence.settlementRpcVerified &&
    evidence.settlementRpcServiceRoleOnlyVerified &&
    evidence.idempotentSettlementReplayVerified &&
    evidence.noSilentChargeVerified &&
    evidence.notes.length > 0)
}

function isStripeBoundaryReady(input: ProductionToolExecutionReadinessGateInput): boolean {
  const evidence = input.stripeBoundary
  return Boolean(evidence && hasEvidenceProvenance(evidence) &&
    evidence.billingOwnerApproved &&
    evidence.noStripeFromToolCostSurface &&
    evidence.serviceFeeExcludedFromToolEvents &&
    evidence.stripeWebhookSeparatedFromToolLedger &&
    evidence.notes.length > 0)
}

function isObservabilityReady(input: ProductionToolExecutionReadinessGateInput): boolean {
  const evidence = input.observability
  return Boolean(evidence && hasEvidenceProvenance(evidence) &&
    evidence.dashboardsDeployed &&
    evidence.alertsDeployed &&
    evidence.alertRoutingVerified &&
    evidence.billingQaMonitoringVerified &&
    evidence.notes.length > 0 &&
    productionMetricsCatalog.length > 0 &&
    alertRuleCatalog.length > 0)
}

function isOperationsControlReady(input: ProductionToolExecutionReadinessGateInput): boolean {
  const evidence = input.operationsControls
  return Boolean(evidence && hasEvidenceProvenance(evidence) &&
    evidence.rollbackPlanApproved &&
    evidence.killSwitchesVerified &&
    evidence.rateLimitsVerified &&
    evidence.concurrencyLimitsVerified &&
    evidence.opsAdmissionRpcDeployed &&
    evidence.opsAdmissionRpcServiceRoleOnlyVerified &&
    evidence.opsAdmissionRpcReadbackVerified &&
    evidence.incidentRunbookApproved &&
    evidence.notes.length > 0 &&
    costControlPolicyBlockers().length === 0)
}

function isFinalOwnerSignoffReady(input: ProductionToolExecutionReadinessGateInput): boolean {
  const signoff = input.finalOwnerSignoff
  return Boolean(signoff && hasEvidenceProvenance(signoff) &&
    signoff.deploymentOwnerApproved &&
    signoff.securityOwnerApproved &&
    signoff.storagePrivacyOwnerApproved &&
    signoff.legalOwnerApproved &&
    signoff.supportOwnerApproved &&
    signoff.billingOwnerApproved &&
    signoff.operationsOwnerApproved &&
    signoff.realUserMediaBetaApproved &&
    signoff.privateMediaApproval &&
    signoff.artifactPrivacyEvidenceReady &&
    signoff.paidProductionApproved &&
    signoff.finalDeliveryShareApproved &&
    signoff.notes.length > 0)
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

function check(
  id: string,
  label: string,
  blockerCandidates: Array<string | null>,
  evidenceNotes: string[] = [],
): ProductionToolExecutionReadinessCheck {
  const blockers = blockerCandidates.filter((item): item is string => Boolean(item))
  return {
    id,
    label,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    evidence: blockers.length === 0 ? evidenceNotes : [],
    blockers,
  }
}

function requireEvidence(value: unknown, blocker: string): string | null {
  return value ? null : blocker
}

function requireBoolean(value: unknown, blocker: string): string | null {
  return value === true ? null : blocker
}

function requireNotes(notes: string[] | undefined, blocker: string): string | null {
  return notes && notes.length > 0 && notes.every((note) => note.trim().length > 0) ? null : blocker
}

function requireEvidenceProvenance(evidence: ProductionToolExecutionEvidenceNotes | undefined, label: string): string[] {
  if (!evidence) return []
  return [
    requireString(evidence.evidenceArtifactId, `${label} evidence artifact ID is missing.`),
    requireString(evidence.reviewedBy, `${label} reviewer reference is missing.`),
    requireIsoDate(evidence.reviewedAt, `${label} review timestamp is missing or invalid.`),
  ].filter((item): item is string => Boolean(item))
}

function hasEvidenceProvenance(evidence: ProductionToolExecutionEvidenceNotes): boolean {
  return Boolean(
    evidence.evidenceArtifactId.trim() &&
    evidence.reviewedBy.trim() &&
    isValidIsoDate(evidence.reviewedAt),
  )
}

function requireString(value: string | undefined, blocker: string): string | null {
  return value?.trim() ? null : blocker
}

function requireIsoDate(value: string | undefined, blocker: string): string | null {
  return value && isValidIsoDate(value) ? null : blocker
}

function isValidIsoDate(value: string): boolean {
  const time = Date.parse(value)
  return Number.isFinite(time) && new Date(time).toISOString() === value
}

function assertNoSecretLikeProductionEvidence(input: ProductionToolExecutionReadinessGateInput): void {
  const evidenceValues = [
    input.sourceId,
    input.sourceSha,
    input.workspaceId,
    input.projectId,
    input.supabasePersistence?.evidenceArtifactId,
    input.supabasePersistence?.reviewedBy,
    input.supabasePersistence?.reviewedAt,
    input.toolCostLedger?.evidenceArtifactId,
    input.toolCostLedger?.reviewedBy,
    input.toolCostLedger?.reviewedAt,
    input.walletSettlement?.evidenceArtifactId,
    input.walletSettlement?.reviewedBy,
    input.walletSettlement?.reviewedAt,
    input.stripeBoundary?.evidenceArtifactId,
    input.stripeBoundary?.reviewedBy,
    input.stripeBoundary?.reviewedAt,
    input.observability?.evidenceArtifactId,
    input.observability?.reviewedBy,
    input.observability?.reviewedAt,
    input.operationsControls?.evidenceArtifactId,
    input.operationsControls?.reviewedBy,
    input.operationsControls?.reviewedAt,
    input.toolEvidence?.evidenceArtifactId,
    input.toolEvidence?.reviewedBy,
    input.toolEvidence?.reviewedAt,
    input.hardSafety?.evidenceArtifactId,
    input.hardSafety?.reviewedBy,
    input.hardSafety?.reviewedAt,
    input.finalOwnerSignoff?.evidenceArtifactId,
    input.finalOwnerSignoff?.reviewedBy,
    input.finalOwnerSignoff?.reviewedAt,
    ...(input.supabasePersistence?.notes ?? []),
    ...(input.toolCostLedger?.notes ?? []),
    ...(input.walletSettlement?.notes ?? []),
    ...(input.stripeBoundary?.notes ?? []),
    ...(input.observability?.notes ?? []),
    ...(input.operationsControls?.notes ?? []),
    ...(input.toolEvidence?.notes ?? []),
    ...(input.hardSafety?.notes ?? []),
    ...(input.finalOwnerSignoff?.notes ?? []),
  ]
  const secretPaths = collectSecretLikePaths(evidenceValues, 'productionToolExecutionReadinessGate.evidenceValues')
  if (secretPaths.length > 0) {
    throw new Error(`Production tool execution readiness evidence contains secret-like fields: ${secretPaths.join(', ')}`)
  }
}

function nextActionsForBlockers(blockers: string[]): string[] {
  if (blockers.length === 0) return []
  return [
    'Run the production evidence preflight with non-secret operator inputs.',
    'Deploy and verify Supabase migrations, RLS readback, service-role write, wallet settlement, and monitoring in production.',
    'Record named owner approvals for billing, deployment, security, storage/privacy, legal, support, operations, and final paid production.',
    `Resolve blockers: ${blockers.slice(0, 8).join(' | ')}${blockers.length > 8 ? ' | ...' : ''}`,
  ]
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}
