import {
  evaluateProductionToolExecutionReadinessGate,
  type ProductionToolExecutionReadinessGateInput,
} from '../beta-readiness'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface ProductionToolExecutionReadinessEvidencePreflightEnv {
  REEDITPRO_PRODUCTION_READINESS_SOURCE_ID?: string
  REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA?: string
  REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID?: string
  REEDITPRO_PRODUCTION_READINESS_PROJECT_ID?: string
  REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW?: string
  REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY?: string
  REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT?: string
  REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT?: string
  REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID?: string
  REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED?: string
  REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_MIGRATION_DEPLOYED?: string
  REEDITPRO_PRODUCTION_SUPABASE_WALLET_SETTLEMENT_STATE_MIGRATION_DEPLOYED?: string
  REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_MIGRATION_DEPLOYED?: string
  REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_MIGRATION_DEPLOYED?: string
  REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_SERVICE_ROLE_ONLY_VERIFIED?: string
  REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_READBACK_VERIFIED?: string
  REEDITPRO_PRODUCTION_SUPABASE_SERVICE_ROLE_WRITE_VERIFIED?: string
  REEDITPRO_PRODUCTION_SUPABASE_RLS_READBACK_VERIFIED?: string
  REEDITPRO_PRODUCTION_SUPABASE_DATA_API_GRANTS_VERIFIED?: string
  REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_BACKEND_ONLY_VERIFIED?: string
  REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_BACKEND_ONLY_VERIFIED?: string
  REEDITPRO_PRODUCTION_SUPABASE_BACKUP_PITR_APPROVED?: string
  REEDITPRO_PRODUCTION_SUPABASE_SECURITY_ADVISOR_REVIEWED?: string
  REEDITPRO_PRODUCTION_SUPABASE_PERFORMANCE_ADVISOR_REVIEWED?: string
  REEDITPRO_PRODUCTION_SUPABASE_STORAGE_POLICIES_VERIFIED?: string
  REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES?: string
  REEDITPRO_PRODUCTION_TOOL_COST_EVIDENCE_ARTIFACT_ID?: string
  REEDITPRO_PRODUCTION_TOOL_COST_EVENT_WRITE_VERIFIED?: string
  REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_APPEND_ONLY_VERIFIED?: string
  REEDITPRO_PRODUCTION_TOOL_COST_IDEMPOTENT_REPLAY_VERIFIED?: string
  REEDITPRO_PRODUCTION_TOOL_COST_SUMMARY_READBACK_VERIFIED?: string
  REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_NOTES?: string
  REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID?: string
  REEDITPRO_PRODUCTION_WALLET_RESERVATION_VERIFIED?: string
  REEDITPRO_PRODUCTION_WALLET_SPEND_VERIFIED?: string
  REEDITPRO_PRODUCTION_WALLET_RELEASE_VERIFIED?: string
  REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED?: string
  REEDITPRO_PRODUCTION_WALLET_BALANCE_BEFORE_AFTER_READBACK_VERIFIED?: string
  REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_VERIFIED?: string
  REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_SERVICE_ROLE_ONLY_VERIFIED?: string
  REEDITPRO_PRODUCTION_WALLET_IDEMPOTENT_REPLAY_VERIFIED?: string
  REEDITPRO_PRODUCTION_WALLET_NO_SILENT_CHARGE_VERIFIED?: string
  REEDITPRO_PRODUCTION_WALLET_NOTES?: string
  REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID?: string
  REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_BILLING_OWNER_APPROVED?: string
  REEDITPRO_PRODUCTION_STRIPE_NO_TOOL_COST_SURFACE_CALLS?: string
  REEDITPRO_PRODUCTION_STRIPE_SERVICE_FEE_EXCLUDED?: string
  REEDITPRO_PRODUCTION_STRIPE_WEBHOOK_SEPARATED?: string
  REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES?: string
  REEDITPRO_PRODUCTION_OBSERVABILITY_EVIDENCE_ARTIFACT_ID?: string
  REEDITPRO_PRODUCTION_OBSERVABILITY_DASHBOARDS_DEPLOYED?: string
  REEDITPRO_PRODUCTION_OBSERVABILITY_ALERTS_DEPLOYED?: string
  REEDITPRO_PRODUCTION_OBSERVABILITY_ALERT_ROUTING_VERIFIED?: string
  REEDITPRO_PRODUCTION_OBSERVABILITY_BILLING_QA_MONITORING_VERIFIED?: string
  REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES?: string
  REEDITPRO_PRODUCTION_OPERATIONS_EVIDENCE_ARTIFACT_ID?: string
  REEDITPRO_PRODUCTION_OPERATIONS_ROLLBACK_APPROVED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCHES_VERIFIED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCH_BLOCK_VERIFIED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMITS_VERIFIED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMIT_BLOCK_VERIFIED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMITS_VERIFIED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMIT_BLOCK_VERIFIED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_DEPLOYED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_SERVICE_ROLE_ONLY_VERIFIED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_READBACK_VERIFIED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_INCIDENT_RUNBOOK_APPROVED?: string
  REEDITPRO_PRODUCTION_OPERATIONS_NOTES?: string
  REEDITPRO_PRODUCTION_TOOLS_EVIDENCE_ARTIFACT_ID?: string
  REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID?: string
  REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA?: string
  REEDITPRO_PRODUCTION_TOOLS_ALL_ACCEPTED?: string
  REEDITPRO_PRODUCTION_TOOLS_MODEL_LICENSE_APPROVED?: string
  REEDITPRO_PRODUCTION_TOOLS_NOTES?: string
  REEDITPRO_PRODUCTION_HARD_EVIDENCE_ARTIFACT_ID?: string
  REEDITPRO_PRODUCTION_HARD_APPROVED_SNAPSHOT_REQUIRED?: string
  REEDITPRO_PRODUCTION_HARD_CREDIT_ESTIMATE_RESERVATION_REQUIRED?: string
  REEDITPRO_PRODUCTION_HARD_IDEMPOTENCY_REQUIRED?: string
  REEDITPRO_PRODUCTION_HARD_RAW_PROMPTS_REJECTED?: string
  REEDITPRO_PRODUCTION_HARD_SECRETS_REJECTED?: string
  REEDITPRO_PRODUCTION_HARD_TEMP_ACCESS_LINKS_REJECTED?: string
  REEDITPRO_PRODUCTION_HARD_FRONTEND_HEAVY_EXECUTION_BLOCKED?: string
  REEDITPRO_PRODUCTION_HARD_LICENSE_MODEL_REVIEW_REQUIRED?: string
  REEDITPRO_PRODUCTION_HARD_SILENT_BILLING_BLOCKED?: string
  REEDITPRO_PRODUCTION_HARD_NOTES?: string
  REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID?: string
  REEDITPRO_PRODUCTION_OWNER_DEPLOYMENT_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_SECURITY_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_STORAGE_PRIVACY_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_LEGAL_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_SUPPORT_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_BILLING_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_OPERATIONS_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_REAL_USER_MEDIA_BETA_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_PRIVATE_MEDIA_APPROVAL?: string
  REEDITPRO_PRODUCTION_OWNER_ARTIFACT_PRIVACY_READY?: string
  REEDITPRO_PRODUCTION_OWNER_PAID_PRODUCTION_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_FINAL_DELIVERY_SHARE_APPROVED?: string
  REEDITPRO_PRODUCTION_OWNER_NOTES?: string
}

export interface ProductionToolExecutionReadinessEvidencePreflightReport {
  ok: boolean
  readyToEvaluateGate: boolean
  readyForPaidProduction: boolean
  gateStatus: string
  sourceId: string
  sourceShaPresent: boolean
  workspaceIdPresent: boolean
  projectIdPresent: boolean
  confirmEvidenceReview: boolean
  command: 'npm run prod:readiness:tool-execution-gate'
  missingConfiguration: string[]
  missingEvidence: string[]
  secretLikeInputPaths: string[]
  requiredEnvironmentVariables: Array<{
    name: keyof ProductionToolExecutionReadinessEvidencePreflightEnv
    requiredFor: 'gate_identity' | 'production_evidence'
  }>
  warnings: string[]
}

export function buildProductionToolExecutionReadinessEvidencePreflight(
  env: ProductionToolExecutionReadinessEvidencePreflightEnv,
): ProductionToolExecutionReadinessEvidencePreflightReport {
  const input = buildProductionToolExecutionReadinessGateInput(env)
  const secretLikeInputPaths = collectSecretLikePaths(evidenceValues(env), 'productionToolExecutionReadinessEvidencePreflight')
  const missingConfiguration = [
    missingEnv(env, 'REEDITPRO_PRODUCTION_READINESS_SOURCE_ID'),
    missingEnv(env, 'REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_PRODUCTION_READINESS_PROJECT_ID'),
    parseBoolean(env.REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW)
      ? undefined
      : 'REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW=true is required before evaluating paid-production readiness evidence.',
  ].filter((item): item is string => Boolean(item))

  let missingEvidence: string[] = []
  let gateStatus = 'blocked'
  let readyForPaidProduction = false
  if (secretLikeInputPaths.length === 0) {
    const gate = evaluateProductionToolExecutionReadinessGate(input)
    missingEvidence = gate.blockers
    gateStatus = gate.status
    readyForPaidProduction = gate.productionToolExecutionAllowed
  }
  const readyToEvaluateGate = missingConfiguration.length === 0 &&
    secretLikeInputPaths.length === 0 &&
    missingEvidence.length === 0 &&
    readyForPaidProduction

  return {
    ok: readyToEvaluateGate,
    readyToEvaluateGate,
    readyForPaidProduction,
    gateStatus,
    sourceId: input.sourceId,
    sourceShaPresent: Boolean(input.sourceSha),
    workspaceIdPresent: Boolean(input.workspaceId),
    projectIdPresent: Boolean(input.projectId),
    confirmEvidenceReview: parseBoolean(env.REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW),
    command: 'npm run prod:readiness:tool-execution-gate',
    missingConfiguration,
    missingEvidence,
    secretLikeInputPaths,
    requiredEnvironmentVariables: requiredEnvironmentVariables(),
    warnings: [
      'This preflight does not call Supabase, Stripe, workers, tools, media processors, deployments, or production routes.',
      'readyForPaidProduction=true means the supplied non-secret evidence satisfies the local policy gate; operators still need to retain the authoritative production evidence packet.',
      'Secret-like values in notes/source fields fail closed and are not printed.',
    ],
  }
}

export function buildProductionToolExecutionReadinessGateInput(env: ProductionToolExecutionReadinessEvidencePreflightEnv): ProductionToolExecutionReadinessGateInput {
  return {
    sourceId: clean(env.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID) ?? 'production-tool-execution-readiness-evidence-preflight',
    sourceSha: clean(env.REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA),
    workspaceId: clean(env.REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID) ?? '',
    projectId: clean(env.REEDITPRO_PRODUCTION_READINESS_PROJECT_ID) ?? '',
    supabasePersistence: {
      ...evidenceReview(env, 'REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID'),
      environment: clean(env.REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT) === 'production' ? 'production' : 'staging',
      toolCostEventsMigrationDeployed: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED),
      betaReadinessEvidenceMigrationDeployed: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_MIGRATION_DEPLOYED),
      walletSettlementStateMigrationDeployed: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_WALLET_SETTLEMENT_STATE_MIGRATION_DEPLOYED),
      productionReadinessEvidenceMigrationDeployed: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_MIGRATION_DEPLOYED),
      workerRuntimeArtifactManifestMigrationDeployed: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_MIGRATION_DEPLOYED),
      workerRuntimeArtifactManifestServiceRoleOnlyVerified: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_SERVICE_ROLE_ONLY_VERIFIED),
      workerRuntimeArtifactManifestReadbackVerified: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_READBACK_VERIFIED),
      serviceRoleWritePathVerified: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_SERVICE_ROLE_WRITE_VERIFIED),
      rlsMemberReadPathVerified: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_RLS_READBACK_VERIFIED),
      explicitDataApiGrantsVerified: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_DATA_API_GRANTS_VERIFIED),
      betaEvidenceBackendOnlyAccessVerified: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_BACKEND_ONLY_VERIFIED),
      productionEvidenceBackendOnlyAccessVerified: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_BACKEND_ONLY_VERIFIED),
      backupPitrApproved: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_BACKUP_PITR_APPROVED),
      securityAdvisorReviewed: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_SECURITY_ADVISOR_REVIEWED),
      performanceAdvisorReviewed: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_PERFORMANCE_ADVISOR_REVIEWED),
      storagePoliciesVerified: parseBoolean(env.REEDITPRO_PRODUCTION_SUPABASE_STORAGE_POLICIES_VERIFIED),
      notes: noteList(env.REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES),
    },
    toolCostLedger: {
      ...evidenceReview(env, 'REEDITPRO_PRODUCTION_TOOL_COST_EVIDENCE_ARTIFACT_ID'),
      toolCostEventWriteVerified: parseBoolean(env.REEDITPRO_PRODUCTION_TOOL_COST_EVENT_WRITE_VERIFIED),
      ledgerAppendOnlyVerified: parseBoolean(env.REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_APPEND_ONLY_VERIFIED),
      idempotentReplayVerified: parseBoolean(env.REEDITPRO_PRODUCTION_TOOL_COST_IDEMPOTENT_REPLAY_VERIFIED),
      projectSummaryReadbackVerified: parseBoolean(env.REEDITPRO_PRODUCTION_TOOL_COST_SUMMARY_READBACK_VERIFIED),
      notes: noteList(env.REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_NOTES),
    },
    walletSettlement: {
      ...evidenceReview(env, 'REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID'),
      reservationVerified: parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_RESERVATION_VERIFIED),
      spendVerified: parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_SPEND_VERIFIED),
      releaseVerified: parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_RELEASE_VERIFIED),
      refundVerified: parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED),
      walletBalanceBeforeAfterReadbackVerified: parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_BALANCE_BEFORE_AFTER_READBACK_VERIFIED),
      settlementRpcVerified: parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_VERIFIED),
      settlementRpcServiceRoleOnlyVerified: parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_SERVICE_ROLE_ONLY_VERIFIED),
      idempotentSettlementReplayVerified: parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_IDEMPOTENT_REPLAY_VERIFIED),
      noSilentChargeVerified: parseBoolean(env.REEDITPRO_PRODUCTION_WALLET_NO_SILENT_CHARGE_VERIFIED),
      notes: noteList(env.REEDITPRO_PRODUCTION_WALLET_NOTES),
    },
    stripeBoundary: {
      ...evidenceReview(env, 'REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID'),
      billingOwnerApproved: parseBoolean(env.REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_BILLING_OWNER_APPROVED),
      noStripeFromToolCostSurface: parseBoolean(env.REEDITPRO_PRODUCTION_STRIPE_NO_TOOL_COST_SURFACE_CALLS),
      serviceFeeExcludedFromToolEvents: parseBoolean(env.REEDITPRO_PRODUCTION_STRIPE_SERVICE_FEE_EXCLUDED),
      stripeWebhookSeparatedFromToolLedger: parseBoolean(env.REEDITPRO_PRODUCTION_STRIPE_WEBHOOK_SEPARATED),
      notes: noteList(env.REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES),
    },
    observability: {
      ...evidenceReview(env, 'REEDITPRO_PRODUCTION_OBSERVABILITY_EVIDENCE_ARTIFACT_ID'),
      dashboardsDeployed: parseBoolean(env.REEDITPRO_PRODUCTION_OBSERVABILITY_DASHBOARDS_DEPLOYED),
      alertsDeployed: parseBoolean(env.REEDITPRO_PRODUCTION_OBSERVABILITY_ALERTS_DEPLOYED),
      alertRoutingVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OBSERVABILITY_ALERT_ROUTING_VERIFIED),
      billingQaMonitoringVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OBSERVABILITY_BILLING_QA_MONITORING_VERIFIED),
      notes: noteList(env.REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES),
    },
    operationsControls: {
      ...evidenceReview(env, 'REEDITPRO_PRODUCTION_OPERATIONS_EVIDENCE_ARTIFACT_ID'),
      rollbackPlanApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_ROLLBACK_APPROVED),
      killSwitchesVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCHES_VERIFIED),
      killSwitchBlockVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCH_BLOCK_VERIFIED),
      rateLimitsVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMITS_VERIFIED),
      rateLimitBlockVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMIT_BLOCK_VERIFIED),
      concurrencyLimitsVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMITS_VERIFIED),
      concurrencyLimitBlockVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMIT_BLOCK_VERIFIED),
      opsAdmissionRpcDeployed: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_DEPLOYED),
      opsAdmissionRpcServiceRoleOnlyVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_SERVICE_ROLE_ONLY_VERIFIED),
      opsAdmissionRpcReadbackVerified: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_READBACK_VERIFIED),
      incidentRunbookApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OPERATIONS_INCIDENT_RUNBOOK_APPROVED),
      notes: noteList(env.REEDITPRO_PRODUCTION_OPERATIONS_NOTES),
    },
    toolEvidence: {
      ...evidenceReview(env, 'REEDITPRO_PRODUCTION_TOOLS_EVIDENCE_ARTIFACT_ID'),
      sourceId: clean(env.REEDITPRO_PRODUCTION_TOOLS_SOURCE_ID) ?? 'production-tool-execution-readiness-evidence-preflight:tools',
      sourceSha: clean(env.REEDITPRO_PRODUCTION_TOOLS_SOURCE_SHA),
      allProductionToolsAccepted: parseBoolean(env.REEDITPRO_PRODUCTION_TOOLS_ALL_ACCEPTED),
      modelWeightLicenseReviewApproved: parseBoolean(env.REEDITPRO_PRODUCTION_TOOLS_MODEL_LICENSE_APPROVED),
      notes: noteList(env.REEDITPRO_PRODUCTION_TOOLS_NOTES),
    },
    hardSafety: {
      ...evidenceReview(env, 'REEDITPRO_PRODUCTION_HARD_EVIDENCE_ARTIFACT_ID'),
      approvedPlanSnapshotRequired: parseBoolean(env.REEDITPRO_PRODUCTION_HARD_APPROVED_SNAPSHOT_REQUIRED),
      creditEstimateAndReservationRequired: parseBoolean(env.REEDITPRO_PRODUCTION_HARD_CREDIT_ESTIMATE_RESERVATION_REQUIRED),
      idempotencyRequired: parseBoolean(env.REEDITPRO_PRODUCTION_HARD_IDEMPOTENCY_REQUIRED),
      rawPromptsRejected: parseBoolean(env.REEDITPRO_PRODUCTION_HARD_RAW_PROMPTS_REJECTED),
      secretsRejected: parseBoolean(env.REEDITPRO_PRODUCTION_HARD_SECRETS_REJECTED),
      temporaryAccessLinksRejectedAsSourceTruth: parseBoolean(env.REEDITPRO_PRODUCTION_HARD_TEMP_ACCESS_LINKS_REJECTED),
      frontendHeavyExecutionBlocked: parseBoolean(env.REEDITPRO_PRODUCTION_HARD_FRONTEND_HEAVY_EXECUTION_BLOCKED),
      licenseAndModelWeightReviewRequired: parseBoolean(env.REEDITPRO_PRODUCTION_HARD_LICENSE_MODEL_REVIEW_REQUIRED),
      silentBillingBlocked: parseBoolean(env.REEDITPRO_PRODUCTION_HARD_SILENT_BILLING_BLOCKED),
      notes: noteList(env.REEDITPRO_PRODUCTION_HARD_NOTES),
    },
    finalOwnerSignoff: {
      ...evidenceReview(env, 'REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID'),
      deploymentOwnerApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_DEPLOYMENT_APPROVED),
      securityOwnerApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_SECURITY_APPROVED),
      storagePrivacyOwnerApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_STORAGE_PRIVACY_APPROVED),
      legalOwnerApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_LEGAL_APPROVED),
      supportOwnerApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_SUPPORT_APPROVED),
      billingOwnerApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_BILLING_APPROVED),
      operationsOwnerApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_OPERATIONS_APPROVED),
      realUserMediaBetaApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_REAL_USER_MEDIA_BETA_APPROVED),
      privateMediaApproval: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_PRIVATE_MEDIA_APPROVAL),
      artifactPrivacyEvidenceReady: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_ARTIFACT_PRIVACY_READY),
      paidProductionApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_PAID_PRODUCTION_APPROVED),
      finalDeliveryShareApproved: parseBoolean(env.REEDITPRO_PRODUCTION_OWNER_FINAL_DELIVERY_SHARE_APPROVED),
      notes: noteList(env.REEDITPRO_PRODUCTION_OWNER_NOTES),
    },
  }
}

function evidenceValues(env: ProductionToolExecutionReadinessEvidencePreflightEnv): unknown {
  return {
    sourceId: env.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID,
    sourceSha: env.REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA,
    workspaceId: env.REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID,
    projectId: env.REEDITPRO_PRODUCTION_READINESS_PROJECT_ID,
    reviewedBy: env.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY,
    reviewedAt: env.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT,
    artifactIds: [
      env.REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID,
      env.REEDITPRO_PRODUCTION_TOOL_COST_EVIDENCE_ARTIFACT_ID,
      env.REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID,
      env.REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID,
      env.REEDITPRO_PRODUCTION_OBSERVABILITY_EVIDENCE_ARTIFACT_ID,
      env.REEDITPRO_PRODUCTION_OPERATIONS_EVIDENCE_ARTIFACT_ID,
      env.REEDITPRO_PRODUCTION_TOOLS_EVIDENCE_ARTIFACT_ID,
      env.REEDITPRO_PRODUCTION_HARD_EVIDENCE_ARTIFACT_ID,
      env.REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID,
    ],
    notes: [
      env.REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES,
      env.REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_NOTES,
      env.REEDITPRO_PRODUCTION_WALLET_NOTES,
      env.REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES,
      env.REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES,
      env.REEDITPRO_PRODUCTION_OPERATIONS_NOTES,
      env.REEDITPRO_PRODUCTION_TOOLS_NOTES,
      env.REEDITPRO_PRODUCTION_HARD_NOTES,
      env.REEDITPRO_PRODUCTION_OWNER_NOTES,
    ],
  }
}

function requiredEnvironmentVariables(): ProductionToolExecutionReadinessEvidencePreflightReport['requiredEnvironmentVariables'] {
  return [
    { name: 'REEDITPRO_PRODUCTION_READINESS_SOURCE_ID', requiredFor: 'gate_identity' },
    { name: 'REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA', requiredFor: 'gate_identity' },
    { name: 'REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID', requiredFor: 'gate_identity' },
    { name: 'REEDITPRO_PRODUCTION_READINESS_PROJECT_ID', requiredFor: 'gate_identity' },
    { name: 'REEDITPRO_PRODUCTION_READINESS_CONFIRM_EVIDENCE_REVIEW', requiredFor: 'gate_identity' },
    { name: 'REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_ENVIRONMENT', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_ARTIFACT_ID', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_TOOL_COST_EVENTS_MIGRATION_DEPLOYED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_MIGRATION_DEPLOYED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_WALLET_SETTLEMENT_STATE_MIGRATION_DEPLOYED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_MIGRATION_DEPLOYED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_MIGRATION_DEPLOYED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_SERVICE_ROLE_ONLY_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_WORKER_ARTIFACT_MANIFEST_READBACK_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_SERVICE_ROLE_WRITE_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_RLS_READBACK_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_DATA_API_GRANTS_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_BETA_EVIDENCE_BACKEND_ONLY_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_PRODUCTION_EVIDENCE_BACKEND_ONLY_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_BACKUP_PITR_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_SECURITY_ADVISOR_REVIEWED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_PERFORMANCE_ADVISOR_REVIEWED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_STORAGE_POLICIES_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_SUPABASE_EVIDENCE_NOTES', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOL_COST_EVIDENCE_ARTIFACT_ID', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOL_COST_EVENT_WRITE_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_APPEND_ONLY_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOL_COST_IDEMPOTENT_REPLAY_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOL_COST_SUMMARY_READBACK_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOL_COST_LEDGER_NOTES', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_EVIDENCE_ARTIFACT_ID', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_RESERVATION_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_SPEND_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_RELEASE_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_REFUND_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_BALANCE_BEFORE_AFTER_READBACK_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_SETTLEMENT_RPC_SERVICE_ROLE_ONLY_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_IDEMPOTENT_REPLAY_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_NO_SILENT_CHARGE_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_WALLET_NOTES', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_STRIPE_EVIDENCE_ARTIFACT_ID', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_BILLING_OWNER_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_STRIPE_NO_TOOL_COST_SURFACE_CALLS', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_STRIPE_SERVICE_FEE_EXCLUDED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_STRIPE_WEBHOOK_SEPARATED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_STRIPE_BOUNDARY_NOTES', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OBSERVABILITY_EVIDENCE_ARTIFACT_ID', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OBSERVABILITY_DASHBOARDS_DEPLOYED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OBSERVABILITY_ALERTS_DEPLOYED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OBSERVABILITY_ALERT_ROUTING_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OBSERVABILITY_BILLING_QA_MONITORING_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OBSERVABILITY_NOTES', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_EVIDENCE_ARTIFACT_ID', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_ROLLBACK_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCHES_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_KILL_SWITCH_BLOCK_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMITS_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_RATE_LIMIT_BLOCK_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMITS_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_CONCURRENCY_LIMIT_BLOCK_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_DEPLOYED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_SERVICE_ROLE_ONLY_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_ADMISSION_RPC_READBACK_VERIFIED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_INCIDENT_RUNBOOK_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OPERATIONS_NOTES', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOLS_EVIDENCE_ARTIFACT_ID', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOLS_ALL_ACCEPTED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOLS_MODEL_LICENSE_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_TOOLS_NOTES', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_EVIDENCE_ARTIFACT_ID', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_APPROVED_SNAPSHOT_REQUIRED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_CREDIT_ESTIMATE_RESERVATION_REQUIRED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_IDEMPOTENCY_REQUIRED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_RAW_PROMPTS_REJECTED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_SECRETS_REJECTED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_TEMP_ACCESS_LINKS_REJECTED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_FRONTEND_HEAVY_EXECUTION_BLOCKED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_LICENSE_MODEL_REVIEW_REQUIRED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_SILENT_BILLING_BLOCKED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_HARD_NOTES', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_EVIDENCE_ARTIFACT_ID', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_DEPLOYMENT_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_SECURITY_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_STORAGE_PRIVACY_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_LEGAL_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_SUPPORT_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_BILLING_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_OPERATIONS_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_REAL_USER_MEDIA_BETA_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_PRIVATE_MEDIA_APPROVAL', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_ARTIFACT_PRIVACY_READY', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_PAID_PRODUCTION_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_FINAL_DELIVERY_SHARE_APPROVED', requiredFor: 'production_evidence' },
    { name: 'REEDITPRO_PRODUCTION_OWNER_NOTES', requiredFor: 'production_evidence' },
  ]
}

function missingEnv(env: ProductionToolExecutionReadinessEvidencePreflightEnv, name: keyof ProductionToolExecutionReadinessEvidencePreflightEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function noteList(value: string | undefined): string[] {
  return clean(value) ? [clean(value)!] : []
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function evidenceReview(
  env: ProductionToolExecutionReadinessEvidencePreflightEnv,
  artifactEnvName: keyof ProductionToolExecutionReadinessEvidencePreflightEnv,
): { evidenceArtifactId: string; reviewedBy: string; reviewedAt: string } {
  return {
    evidenceArtifactId: clean(env[artifactEnvName]) ?? '',
    reviewedBy: clean(env.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_BY) ?? '',
    reviewedAt: clean(env.REEDITPRO_PRODUCTION_EVIDENCE_REVIEWED_AT) ?? '',
  }
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildProductionToolExecutionReadinessEvidencePreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exitCode = 1
}
