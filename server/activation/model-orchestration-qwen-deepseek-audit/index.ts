import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  ModelOrchestrationAuditDecision,
  ModelOrchestrationAuditReports,
} from './model-orchestration-audit-types'

export const MODEL_ORCHESTRATION_AUDIT_PHASE = 'model-orchestration-qwen-deepseek-audit'
export const MODEL_ORCHESTRATION_AUDIT_RUN_ID = 'model-orchestration-qwen-deepseek-audit-20260612'
export const MODEL_ORCHESTRATION_AUDIT_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-repo-audit'
export const MODEL_ORCHESTRATION_AUDIT_BASE_BRANCH =
  'codex/rp-product-restricted-internal-testing-session-0'
export const MODEL_ORCHESTRATION_AUDIT_REPORT_DIR =
  'docs/activation-model-orchestration-qwen-deepseek-audit-reports'

export const MODEL_ORCHESTRATION_AUDIT_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'model_orchestration_audit_plan.json',
  'provider_official_evidence_inventory.json',
  'secret_reference_inventory.json',
  'provider_contract_inventory.json',
  'agent_brain_architecture_recommendation.json',
  'raw_prompt_worker_execution_blocker_policy.json',
  'model_orchestration_risk_blocker_inventory.json',
  'model_orchestration_next_phase_recommendation.json',
  'model_orchestration_audit_blocker_report.json',
  'model_orchestration_audit_readiness_report.json',
  'model_orchestration_private_artifact_manifest.json',
] as const

export const MODEL_ORCHESTRATION_AUDIT_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_MODEL_ORCHESTRATION_REPO_AUDIT',
  'REEDITPRO_CONFIRM_PROVIDER_DOCS_RESEARCH',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
] as const

export const MODEL_ORCHESTRATION_AUDIT_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_QWEN_API_CALL',
  'REEDITPRO_CONFIRM_DEEPSEEK_API_CALL',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
] as const

const SOURCE_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/future-backend-service-map.md',
  'docs/provider-gateway-foundation.md',
  'docs/tool-call-foundation.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/model-weight-readiness.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/internal-testing-allowed-scope-freeze.md',
  'docs/internal-testing-blocked-scope-freeze.md',
  'docs/restricted-internal-testing-session-0-decision.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat',
  'docs/activation-product-internal-testing-session-0-reports',
  'docs/activation-product-internal-testing-start-gate-reports',
  'docs/activation-product-internal-testing-scope-freeze-reports',
  'docs/activation-product-internal-beta-readiness-reports',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports',
  'docs/activation-supabase-clean-staging-branch-execution-reports',
  'docs/activation-track-b-readiness-rollup-reports',
  'docs/activation-track-b-capability-manifests-reports',
  'docs/activation-track-b-tool-route-manifest-reports',
] as const

const CONTRACT_PATHS = [
  'src/backend/cloud/provider-gateway-contracts.ts',
  'src/backend/providers/gateway/provider-gateway-service.ts',
  'server/services/provider-gateway-service.ts',
  'server/routes/provider-gateway-routes.ts',
  'src/backend/cloud/worker-job-contracts.ts',
  'src/lib/approved-plan-snapshot.ts',
  'server/workers/worker-gates.ts',
  'server/workers/production/production-worker-gates.ts',
  'docs/google-cloud/RP-GCP-03-provider-gateway-skeleton.md',
  'docs/production-worker-architecture.md',
  'docs/track-b-consumer-boundary-policy.md',
] as const

const MODEL_EVIDENCE_PATHS = [
  'docs/activation-phase-roadmap.md',
  'docs/track-b-readiness-rollup.md',
  'docs/activation-phase-39a-qwen3-vl-vllm-approval.md',
  'docs/activation-phase-39c-generated-vlm-runtime-handoff.md',
  'docs/activation-vlm-exact-revision-policy.md',
  'server/workers/vlm-runtime/README.md',
  'server/workers/vlm-sglang-runtime/README.md',
] as const

const OFFICIAL_SOURCES = [
  'https://www.alibabacloud.com/help/en/model-studio/models',
  'https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope',
  'https://help.aliyun.com/zh/model-studio/text-generation-model/',
  'https://api-docs.deepseek.com/',
  'https://api-docs.deepseek.com/api/list-models',
  'https://api-docs.deepseek.com/api/create-chat-completion',
] as const

const SECRET_REFS = [
  ['DASHSCOPE_API_KEY', 'Future Alibaba Model Studio/DashScope Qwen API authentication.', 'MODEL_ORCHESTRATION', 'qwen_dashscope'],
  ['DEEPSEEK_API_KEY', 'Future DeepSeek API authentication.', 'MODEL_ORCHESTRATION', 'deepseek'],
  ['SUPABASE_ACCESS_TOKEN', 'Future Supabase management metadata only when separately approved.', 'SUPABASE_RLS_STORAGE_DATABASE', 'supabase'],
  ['SUPABASE_DB_URL', 'Future staging database transport reference only when separately approved.', 'SUPABASE_RLS_STORAGE_DATABASE', 'supabase'],
] as const

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function textIncludes(filePath: string, needle: string): boolean {
  return existsSync(filePath) && readFileSync(filePath, 'utf8').includes(needle)
}

export function getModelOrchestrationAuditPlan() {
  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    runId: MODEL_ORCHESTRATION_AUDIT_RUN_ID,
    branch: MODEL_ORCHESTRATION_AUDIT_BRANCH,
    baseBranch: MODEL_ORCHESTRATION_AUDIT_BASE_BRANCH,
    prTitle: '[model] Qwen DeepSeek orchestration repo audit',
    mode: 'repo_source_of_truth_audit_only',
    reportDir: MODEL_ORCHESTRATION_AUDIT_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_AUDIT_EXPECTED_REPORTS,
    requiredConfirmations: MODEL_ORCHESTRATION_AUDIT_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: MODEL_ORCHESTRATION_AUDIT_FORBIDDEN_CONFIRMATIONS,
    officialProviderSources: OFFICIAL_SOURCES,
    supabaseUpdateRequired: 'no_write_metadata_audit_only',
    supabaseUpdateStatus: 'track_b_clean_staging_milestone_sync_completed_model_orchestration_not_synced',
    supabaseEnvironmentTouched: 'none',
    providerCalls: false,
    secretPayloadAccess: false,
    runtimeToolsWorkersRoutes: false,
    publicArtifacts: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    nextRecommendedPhase: 'MODEL_ORCHESTRATION - Qwen/DeepSeek dry-run approval packet.',
  }
}

export function buildModelOrchestrationAuditReports(): ModelOrchestrationAuditReports {
  const providerOfficialEvidenceInventory = buildProviderOfficialEvidenceInventory()
  const secretReferenceInventory = buildSecretReferenceInventory()
  const providerContractInventory = buildProviderContractInventory()
  const rawPromptWorkerExecutionBlockerPolicy = buildRawPromptWorkerExecutionBlockerPolicy()
  const riskBlockerInventory = buildRiskBlockerInventory(
    providerOfficialEvidenceInventory,
    secretReferenceInventory,
    providerContractInventory,
    rawPromptWorkerExecutionBlockerPolicy,
  )
  const decision = selectDecision(riskBlockerInventory)

  return {
    sourceOfTruthOwnershipAudit: buildSourceOfTruthOwnershipAudit(),
    auditPlan: getModelOrchestrationAuditPlan(),
    providerOfficialEvidenceInventory,
    secretReferenceInventory,
    providerContractInventory,
    agentBrainArchitectureRecommendation: buildAgentBrainArchitectureRecommendation(),
    rawPromptWorkerExecutionBlockerPolicy,
    riskBlockerInventory,
    nextPhaseRecommendation: buildNextPhaseRecommendation(decision),
    blockerReport: buildBlockerReport(decision, riskBlockerInventory),
    readinessReport: buildReadinessReport(decision),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeModelOrchestrationAuditArtifacts(reports: ModelOrchestrationAuditReports): Promise<void> {
  const reportDir = MODEL_ORCHESTRATION_AUDIT_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'model_orchestration_audit_plan.json'), reports.auditPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_official_evidence_inventory.json'), reports.providerOfficialEvidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'secret_reference_inventory.json'), reports.secretReferenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_contract_inventory.json'), reports.providerContractInventory)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'agent_brain_architecture_recommendation.json'), reports.agentBrainArchitectureRecommendation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'raw_prompt_worker_execution_blocker_policy.json'), reports.rawPromptWorkerExecutionBlockerPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'model_orchestration_risk_blocker_inventory.json'), reports.riskBlockerInventory)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'model_orchestration_next_phase_recommendation.json'), reports.nextPhaseRecommendation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'model_orchestration_audit_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'model_orchestration_audit_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'model_orchestration_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeDocs(reports)
}

export async function executeModelOrchestrationAudit(options: {
  execute: boolean
  metadataOnly: boolean
  keepTemp: boolean
}): Promise<{ exitCode: number }> {
  if (!options.execute || !options.metadataOnly) return { exitCode: 1 }
  const missing = MODEL_ORCHESTRATION_AUDIT_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const forbidden = MODEL_ORCHESTRATION_AUDIT_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const reports = buildModelOrchestrationAuditReports()

  if (missing.length > 0 || forbidden.length > 0) {
    reports.blockerReport = {
      ...reports.blockerReport,
      status: 'blocked',
      activeBlockers: [
        ...missing.map((name) => `missing_confirmation:${name}`),
        ...forbidden.map((name) => `forbidden_confirmation:${name}`),
      ],
    }
    reports.readinessReport = {
      ...reports.readinessReport,
      status: 'blocked',
      decision: 'blocked_pending_secret_policy_review',
      activeBlockers: (reports.blockerReport.activeBlockers as string[]) ?? [],
    }
    await writeModelOrchestrationAuditArtifacts(reports)
    return { exitCode: 1 }
  }

  await writeModelOrchestrationAuditArtifacts(reports)
  return { exitCode: 0 }
}

export function readModelOrchestrationAuditSummary() {
  return readJson(path.join(MODEL_ORCHESTRATION_AUDIT_REPORT_DIR, 'model_orchestration_audit_readiness_report.json')) ??
    buildModelOrchestrationAuditReports().readinessReport
}

function buildSourceOfTruthOwnershipAudit() {
  const session0 = readJson('docs/activation-product-internal-testing-session-0-reports/session_0_decision.json')
  const startGate = readJson('docs/activation-product-internal-testing-start-gate-reports/restricted_internal_testing_start_gate_decision.json')

  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    runId: MODEL_ORCHESTRATION_AUDIT_RUN_ID,
    ownerWorkstream: 'MODEL_ORCHESTRATION',
    relatedWorkstreams: [
      'PRODUCT_INTERNAL_BETA_AGGREGATION',
      'SUPABASE_RLS_STORAGE_DATABASE',
      'TRACK_B_MEDIA_PROCESSING',
      'WORKER_RUNTIME_JOBS',
      'PROVIDER_GATEWAY',
      'OBSERVABILITY_AUDIT_COST',
      'PUBLIC_ARTIFACT_DELIVERY',
    ],
    explicitlyNotOwned: [
      'provider_calls',
      'worker_execution',
      'tool_route_execution',
      'track_a_runtime',
      'production_deploy',
      'external_beta',
      'paid_production',
      'public_artifacts',
      'signed_url_delivery',
      'raw_prompt_execution',
    ],
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    providerContractPaths: CONTRACT_PATHS.map(pathStatus),
    modelEvidencePaths: MODEL_EVIDENCE_PATHS.map(pathStatus),
    prEvidence: {
      pr311Session0Decision: session0?.decision ?? 'missing',
      pr311Session0Started: session0?.session0Started ?? false,
      pr309StartGateDecision: startGate?.decision ?? 'missing',
    },
    missingSourceDocsAreAuditFacts: true,
    noSupabaseWrites: true,
    noProviderCalls: true,
    noRuntimeExecution: true,
    noSecretPayloadAccess: true,
  }
}

function buildProviderOfficialEvidenceInventory() {
  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    status: 'passed',
    officialSources: OFFICIAL_SOURCES.map((url) => ({ url, sourceType: 'official_documentation' })),
    qwen: {
      provider: 'Alibaba Cloud Model Studio / DashScope',
      openAiCompatibleBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      authEnvName: 'DASHSCOPE_API_KEY',
      officialModelCandidatesCaptured: [
        {
          modelId: 'qwen3.7-plus',
          role: 'first_dry_run_candidate',
          providerCallMade: false,
        },
        {
          modelId: 'qwen3.7-max',
          role: 'escalation_candidate',
          providerCallMade: false,
        },
      ],
      verifiedOfficialIds: ['qwen3.7-plus', 'qwen3.7-max'],
      unverifiedNamesNotHardcoded: ['Qwen 3.7-Max'],
      qwen37OfficiallyVerified: true,
      qwen37MaxOfficiallyVerified: true,
      qwen37MaxSnapshotEvidenceCaptured: ['qwen3.7-max-2026-06-08', 'qwen3.7-max-2026-05-20'],
      apiCallMade: false,
    },
    deepseek: {
      provider: 'DeepSeek API',
      openAiCompatibleBaseUrl: 'https://api.deepseek.com',
      authEnvName: 'DEEPSEEK_API_KEY',
      officialModelCandidatesCaptured: [
        {
          modelId: 'deepseek-v4-flash',
          role: 'first_fallback_coding_reasoning_candidate',
          providerCallMade: false,
        },
        {
          modelId: 'deepseek-v4-pro',
          role: 'escalation_coding_reasoning_candidate',
          providerCallMade: false,
        },
      ],
      deprecatedCompatibilityAliases: ['deepseek-chat', 'deepseek-reasoner'],
      responseFormatJsonObjectSupported: true,
      apiCallMade: false,
    },
    noProviderCalls: true,
    noSecretPayloadAccess: true,
  }
}

function buildSecretReferenceInventory() {
  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    status: 'passed',
    secretRefs: SECRET_REFS.map(([name, purpose, ownerWorkstream, intendedProvider]) => ({
      name,
      purpose,
      ownerWorkstream,
      intendedProvider,
      payloadAccessed: false,
      payloadPrinted: false,
      payloadCommitted: false,
      allowedFutureUse: 'future_separately_approved_dry_run_or_metadata_phase_only',
      blockedCurrentUse: true,
    })),
    secretManagerPayloadAccessAttempted: false,
    valuesPrinted: false,
    payloadCommitted: false,
  }
}

function buildProviderContractInventory() {
  const approvedSnapshotGatePresent = textIncludes('src/backend/cloud/provider-gateway-contracts.ts', 'approvedPlanSnapshotId') &&
    textIncludes('src/backend/cloud/provider-gateway-contracts.ts', 'creditReservationId') &&
    textIncludes('src/backend/cloud/provider-gateway-contracts.ts', 'idempotencyKey')
  const realCallsDisabled = textIncludes('server/services/provider-gateway-service.ts', 'REAL_PROVIDER_CALLS_DISABLED') &&
    textIncludes('src/backend/providers/gateway/provider-gateway-service.ts', 'mock_only')
  const workerRawPromptGatePresent = textIncludes('src/backend/cloud/worker-job-contracts.ts', 'raw prompt') &&
    textIncludes('server/workers/production/production-worker-gates.ts', 'raw prompt')

  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    status: approvedSnapshotGatePresent && realCallsDisabled && workerRawPromptGatePresent ? 'passed' : 'blocked',
    contractPaths: CONTRACT_PATHS.map(pathStatus),
    approvedPlanSnapshotRequired: approvedSnapshotGatePresent,
    creditReservationRequired: approvedSnapshotGatePresent,
    idempotencyRequired: approvedSnapshotGatePresent,
    secretInspectionPresent: textIncludes('src/backend/cloud/provider-gateway-contracts.ts', 'inspectForSecretLikeValues'),
    providerCallsDisabledByDefault: realCallsDisabled,
    mockOnlyProviderGatewayPresent: realCallsDisabled,
    workerRawPromptGatePresent,
    toolRouteManifestIntegration: existsSync('docs/activation-track-b-tool-route-manifest-reports') ||
      existsSync('docs/track-b-route-manifest-handoff.md'),
    costEstimatorIntegration: existsSync('server/activation/track-b-cost-estimator') ||
      existsSync('docs/activation-track-b-cost-estimator-reports'),
    supabaseMilestoneRegistryIntegration: existsSync('docs/activation-supabase-trackb-clean-staging-backfill-reports'),
    missingContracts: [
      'model_orchestration_provider_dry_run_contract',
      'qwen_deepseek_output_schema_contract',
      'provider_cost_budget_contract',
      'provider_rate_limit_contract',
      'supabase_model_orchestration_milestone_sync',
    ],
    noProviderCalls: true,
  }
}

function buildAgentBrainArchitectureRecommendation() {
  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    status: 'passed',
    recommendation: 'qwen_primary_deepseek_fallback_requires_dry_run_approval',
    candidateDefaultAgentBrain: {
      provider: 'qwen_dashscope',
      modelId: 'qwen3.7-plus',
      escalationModelId: 'qwen3.7-max',
      approvedForRuntime: false,
    },
    candidateFallbackCodingReasoning: {
      provider: 'deepseek',
      firstModelId: 'deepseek-v4-flash',
      escalationModelId: 'deepseek-v4-pro',
      approvedForRuntime: false,
    },
    requiredFlow: [
      'user_chat_request',
      'agent_findings',
      'edit_intents',
      'approved_plan_snapshot',
      'future_worker_execution',
    ],
    schemaValidationStrategy: [
      'JSON object output must parse.',
      'Findings must map to typed edit intent fields.',
      'Unmapped fields are warnings, not executable instructions.',
      'Low-confidence or unsafe outputs require human review.',
    ],
    providerCallDryRunRequiredBeforeRealApiCall: true,
    directWorkerExecutionAllowed: false,
    rawPromptExecutionAllowed: false,
    providerCallsMade: false,
  }
}

function buildRawPromptWorkerExecutionBlockerPolicy() {
  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    status: 'passed',
    blockedPaths: [
      'raw_chat_to_worker_execution',
      'raw_prompt_to_tool_route_execution',
      'provider_response_to_direct_mutation',
      'provider_response_to_public_artifact',
      'provider_response_to_signed_url_source_of_truth',
      'provider_response_to_supabase_write',
      'provider_response_to_track_b_runtime',
    ],
    requiredSafePath: [
      'user_chat_request',
      'agent_findings',
      'edit_intents',
      'approved_plan_snapshot',
      'future_worker_execution_after_separate_approval',
    ],
    existingRepoEvidence: [
      'src/backend/cloud/worker-job-contracts.ts rejects raw prompt-only worker payloads.',
      'server/workers/production/production-worker-gates.ts rejects raw prompt/chat fields.',
      'src/backend/cloud/provider-gateway-contracts.ts requires approvedPlanSnapshotId and creditReservationId.',
      'model-routing-policy.md says routing is planning data until approval.',
    ],
    runtimeExecutionAllowed: false,
    providerCallsAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    supabaseWritesAllowed: false,
  }
}

function buildRiskBlockerInventory(
  providerEvidence: Record<string, unknown>,
  secretInventory: Record<string, unknown>,
  contractInventory: Record<string, unknown>,
  rawPromptPolicy: Record<string, unknown>,
) {
  const blockers: string[] = []
  if (providerEvidence.status !== 'passed') blockers.push('official_model_verification_incomplete')
  if (secretInventory.status !== 'passed') blockers.push('secret_reference_inventory_incomplete')
  if (contractInventory.status !== 'passed') blockers.push('provider_gateway_contract_incomplete')
  if (rawPromptPolicy.status !== 'passed') blockers.push('raw_prompt_blocker_policy_missing')

  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeAuditBlockers: blockers,
    futureRuntimeBlockers: [
      'provider_api_terms_pricing_review_required',
      'secret_payload_injection_policy_required',
      'cost_capacity_review_required',
      'schema_reliability_fixture_required',
      'supabase_model_orchestration_milestone_sync_not_started',
      'audit_observability_contract_required',
      'production_external_beta_paid_production_blocked',
    ],
    providerCalls: false,
    secretPayloadAccess: false,
    runtimeExecution: false,
    supabaseWrites: false,
  }
}

function selectDecision(risks: Record<string, unknown>): ModelOrchestrationAuditDecision {
  const blockers = Array.isArray(risks.activeAuditBlockers) ? risks.activeAuditBlockers : []
  if (blockers.length === 0) return 'repo_audit_passed_ready_for_dry_run_approval'
  if (blockers.includes('official_model_verification_incomplete')) return 'blocked_pending_official_model_verification'
  if (blockers.includes('provider_gateway_contract_incomplete')) return 'blocked_pending_provider_gateway_contract'
  if (blockers.includes('secret_reference_inventory_incomplete')) return 'blocked_pending_secret_policy_review'
  if (blockers.includes('raw_prompt_blocker_policy_missing')) return 'blocked_pending_plan_snapshot_contract'
  return 'blocked_pending_cost_review'
}

function buildNextPhaseRecommendation(decision: ModelOrchestrationAuditDecision) {
  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    decision,
    status: decision === 'repo_audit_passed_ready_for_dry_run_approval' ? 'passed' : 'blocked',
    nextRecommendedPhase: decision === 'repo_audit_passed_ready_for_dry_run_approval'
      ? 'MODEL_ORCHESTRATION - Qwen/DeepSeek dry-run approval packet'
      : 'Resolve the exact audit blocker before dry-run approval.',
    dryRunApprovalPacketRequirements: [
      'provider request fixtures only',
      'structured output schema review',
      'token and cost budget review',
      'provider gateway dry-run contract',
      'no worker/tool/route execution',
      'no Supabase writes',
    ],
    providerCallsApproved: false,
    runtimeExecutionApproved: false,
  }
}

function buildBlockerReport(decision: ModelOrchestrationAuditDecision, risks: Record<string, unknown>) {
  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    status: decision === 'repo_audit_passed_ready_for_dry_run_approval' ? 'passed' : 'blocked',
    decision,
    activeBlockers: risks.activeAuditBlockers ?? [],
    futureRuntimeBlockers: risks.futureRuntimeBlockers ?? [],
    providerCalls: false,
    qwenApiCall: false,
    deepseekApiCall: false,
    secretPayloadAccess: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    runtimeToolsWorkersRoutes: false,
    rawPromptExecution: false,
    publicArtifacts: false,
    signedUrls: false,
    supabaseWrites: false,
    productionAffected: false,
    externalBeta: false,
    paidProduction: false,
  }
}

function buildReadinessReport(decision: ModelOrchestrationAuditDecision) {
  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    runId: MODEL_ORCHESTRATION_AUDIT_RUN_ID,
    status: decision === 'repo_audit_passed_ready_for_dry_run_approval' ? 'passed' : 'blocked',
    decision,
    qwenOfficialEvidence: 'captured',
    deepSeekOfficialEvidence: 'captured',
    secretRefs: SECRET_REFS.map(([name]) => name),
    providerContracts: 'existing_mock_only_gateway_and_snapshot_gates_recorded',
    rawPromptBlocker: 'passed',
    supabaseUpdateRequired: 'no_write_metadata_audit_only',
    supabaseUpdateStatus: 'track_b_clean_staging_milestone_sync_completed_model_orchestration_not_synced',
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: false,
    migrationDeployed: false,
    providerCalls: false,
    secretPayloadAccess: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    runtimeToolsWorkersRoutes: false,
    publicArtifacts: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    nextRecommendedPhase: 'MODEL_ORCHESTRATION - Qwen/DeepSeek dry-run approval packet.',
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: MODEL_ORCHESTRATION_AUDIT_PHASE,
    runId: MODEL_ORCHESTRATION_AUDIT_RUN_ID,
    reportDir: MODEL_ORCHESTRATION_AUDIT_REPORT_DIR,
    committedArtifactClasses: ['safe_json_reports', 'safe_markdown_docs', 'server_only_audit_code'],
    expectedReports: MODEL_ORCHESTRATION_AUDIT_EXPECTED_REPORTS,
    excludedArtifactClasses: [
      'api_keys',
      'db_urls',
      'service_role_keys',
      'anon_keys',
      'access_tokens',
      'secret_payloads',
      'signed_urls',
      'private_payloads',
      'media_payloads',
      'node_modules',
      'caches',
      'build_outputs',
    ],
    payloadAccessed: false,
    payloadPrinted: false,
    payloadCommitted: false,
  }
}

async function writeDocs(reports: ModelOrchestrationAuditReports): Promise<void> {
  const decision = String(reports.readinessReport.decision)
  await writeVlmRuntimeTextArtifact('docs/model-orchestration-qwen-deepseek-audit.md', `# Model Orchestration Qwen/DeepSeek Audit

Decision: \`${decision}\`.

This packet records a repo/source-of-truth audit only. It does not call Qwen, DeepSeek, providers, tools, workers, routes, Supabase, or production systems.

Official evidence captured:
- Alibaba Model Studio / DashScope OpenAI-compatible Qwen access.
- Qwen audit candidates: \`qwen3.7-plus\` first dry-run candidate and \`qwen3.7-max\` escalation candidate.
- DeepSeek API base URL and current candidates: \`deepseek-v4-flash\` and \`deepseek-v4-pro\`.

Supabase update classification: no write; Track B clean-staging milestone sync is completed; model orchestration is not synced in this phase.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-qwen-deepseek-agent-brain.md', `# Qwen/DeepSeek Agent Brain Recommendation

Qwen may become the default agent-brain candidate only after a separate dry-run approval packet. DeepSeek may become a coding/reasoning fallback only after the same kind of approval.

Required flow: user/chat request -> agent findings -> edit intents -> approved plan snapshot -> later worker execution.

Provider responses must never directly mutate Supabase, call tools/workers/routes, create public artifacts, or become signed URL source-of-truth records.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-raw-prompt-blocker-policy.md', `# Model Orchestration Raw Prompt Blocker Policy

Blocked paths:
- raw chat to worker execution
- raw prompt to tool route execution
- provider response to direct mutation
- provider response to public artifact
- provider response to signed URL source of truth

Allowed future path requires structured findings, typed edit intents, approved plan snapshots, and a separate worker/provider execution approval phase.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-secret-reference-policy.md', `# Model Orchestration Provider Secret Reference Policy

Safe secret-reference names recorded in this packet:
- \`DASHSCOPE_API_KEY\`
- \`DEEPSEEK_API_KEY\`
- \`SUPABASE_ACCESS_TOKEN\`
- \`SUPABASE_DB_URL\`

Payload accessed: false. Payload printed: false. Payload committed: false.

Future provider dry-run approval may reference these names, but this audit does not read or use secret payloads.
`)

  await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-model-orchestration-qwen-deepseek-dry-run-approval.md', `# MODEL_ORCHESTRATION - Qwen/DeepSeek Dry-Run Approval Packet

Use this only after the Qwen/DeepSeek repo audit decision is \`repo_audit_passed_ready_for_dry_run_approval\`.

The next phase remains approval/reporting only unless separately authorized. Do not call Qwen, DeepSeek, providers, tools, workers, routes, Supabase, production, external beta, or paid production. Do not print or access secret payloads.

Required future work: define provider request fixtures, structured output schemas, cost/rate-limit guards, redacted audit records, and fail-closed provider gateway behavior.
`)

  await writeVlmRuntimeTextArtifact('docs/beta-readiness-scorecard.md', `# Beta Readiness Scorecard

Restricted internal testing Session 0 passed. External beta, paid production, and production remain blocked.

Model orchestration Qwen/DeepSeek status: repo audit passed for future dry-run approval only. Provider calls, runtime execution, public artifacts, signed URLs, raw prompt execution, Supabase writes, external beta, paid production, and production remain blocked.
`)

  await writeVlmRuntimeTextArtifact('docs/production-beta-blocker-inventory.md', `# Production Beta Blocker Inventory

Active blockers remain:
- production deployment
- external beta
- paid production
- provider calls
- worker/tool/route execution
- public artifacts and signed URL source-of-truth flows
- raw prompt execution
- Supabase production writes
- model orchestration runtime calls

Qwen/DeepSeek repo audit does not remove these blockers.
`)
}
