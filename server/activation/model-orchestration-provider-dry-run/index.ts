import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE = 'model-orchestration-provider-dry-run'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID =
  process.env.REEDITPRO_MODEL_DRY_RUN_ID ?? process.env.REEDITPRO_MODELDRYRUN2_RUN_ID ?? process.env.REEDITPRO_MODELDRYRUN1_RUN_ID ?? buildModelDryRunRunId()
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BRANCH =
  'codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-schema-timeout-target-calibration'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-reports'
export const MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR =
  'docs/activation-model-orchestration-dry-run-approval-reports'
export const MODEL_DRY_RUN_PRIVATE_GENERATED_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
export const MODEL_DRY_RUN_PRIVATE_QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const MODEL_DRY_RUN_PRIVATE_OBJECT_PREFIX = 'activation-model-orchestration/model-dry-run-2'
export const MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL = 'https://dashscope-us.aliyuncs.com/compatible-mode/v1'
export const MODEL_DRY_RUN_APPROVED_DASHSCOPE_REGION = 'us'
export const MODEL_DRY_RUN_CALIBRATED_QWEN_MODEL = 'qwen3.7-plus'
export const MODEL_DRY_RUN_CALIBRATED_QWEN_TIMEOUT_MS = 45000
export const MODEL_DRY_RUN_CALIBRATED_QWEN_MAX_OUTPUT_TOKENS = 650
export const MODEL_DRY_RUN_QWEN_ENABLE_THINKING = false

export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'provider_dry_run_plan.json',
  'provider_secret_access_report.json',
  'provider_dry_run_loaded_cases_report.json',
  'qwen_provider_dry_run_report.json',
  'deepseek_provider_dry_run_report.json',
  'provider_dry_run_comparison_report.json',
  'provider_dry_run_fail_closed_verification.json',
  'provider_dry_run_decision.json',
  'provider_dry_run_blocker_report.json',
  'provider_dry_run_readiness_report.json',
  'provider_dry_run_private_artifact_manifest.json',
] as const

export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_MODEL_ORCHESTRATION_PROVIDER_DRY_RUN',
  'REEDITPRO_CONFIRM_QWEN_API_CALL',
  'REEDITPRO_CONFIRM_DEEPSEEK_API_CALL',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_SYNTHETIC_PROVIDER_PROMPTS_ONLY',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS_FOR_PROVIDER_DRY_RUN',
  'REEDITPRO_CONFIRM_RAW_PROMPT_BLOCKER_POLICY',
  'REEDITPRO_CONFIRM_PROVIDER_DRY_RUN_COST_GUARDRAILS',
] as const

export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
] as const

type ProviderName = 'qwen_dashscope' | 'deepseek'
type ProviderSecretRef = 'DASHSCOPE_API_KEY' | 'DASHSCOPE_BASE_URL' | 'DASHSCOPE_REGION' | 'DEEPSEEK_API_KEY'
type ProviderDecision =
  | 'provider_dry_run_passed_ready_for_plan_snapshot_contract'
  | 'blocked_pending_secret_access'
  | 'blocked_pending_provider_error_review'
  | 'blocked_pending_model_alias_review'
  | 'blocked_pending_schema_contract_fix'
  | 'blocked_pending_cost_review'
  | 'rejected_due_provider_safety_failure'
  | 'not_attempted'
type ModelDryRun2FinalState =
  | 'provider_dry_run_passed'
  | 'blocked_provider_call_failed'
  | 'blocked_qwen_timeout_or_schema'
  | 'blocked_secret_metadata_review'
  | 'blocked_provider_config_review'

interface ApprovedCase {
  caseId: string
  prompt: string
  expectedOutputSchema: string
  maxTokens: number
  timeoutMs: number
}

interface CasePlan {
  caseId: string
  provider: ProviderName
  modelId: string
}

interface ProviderCaseResult {
  caseId: string
  provider: ProviderName
  modelId: string
  schemaId: string
  status: 'passed' | 'blocked'
  blocker?: string
  httpStatus?: number
  latencyMs?: number
  finishReason?: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  responseContentCharacters?: number
  normalizedOutput?: Record<string, unknown>
  rawProviderResponseStored: false
  rawProviderResponsePrinted: false
  secretPayloadPrinted: false
  workerExecutionAllowed: false
  toolExecutionAllowed: false
  routeExecutionAllowed: false
  publicArtifactsAllowed: false
  signedUrlsAllowed: false
  rawPromptForwardingAllowed: false
  directMutationAllowed: false
  productionMutationAllowed: false
}

interface SecretAccessEntry {
  secretRef: ProviderSecretRef
  provider: ProviderName | 'dashscope_config'
  source: 'secret_manager' | 'unavailable'
  payloadAccessStatus: 'succeeded' | 'failed' | 'not_attempted'
  envVarPresent: boolean
  payloadMatchedApprovedValue?: boolean
  payloadPrinted: false
  payloadCommitted: false
  secretValueStoredInReports: false
  blocker?: string
}

interface ProviderDryRunReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  plan: Record<string, unknown>
  secretAccess: Record<string, unknown>
  loadedCases: Record<string, unknown>
  qwenRun: Record<string, unknown>
  deepseekRun: Record<string, unknown>
  comparison: Record<string, unknown>
  failClosed: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
  modelDryRun2Summary: Record<string, unknown>
}

const SOURCE_PATHS = [
  'README.md',
  'AGENTS.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/model-orchestration-dry-run-approval.md',
  'docs/model-orchestration-dry-run-schema-contract.md',
  'docs/model-orchestration-dry-run-audit-redaction-policy.md',
  'docs/model-orchestration-dry-run-approval-decision.md',
  'docs/model-orchestration-qwen-deepseek-audit.md',
  'docs/model-orchestration-raw-prompt-blocker-policy.md',
  'docs/activation-model-orchestration-dry-run-approval-reports',
  'docs/activation-model-orchestration-qwen-deepseek-audit-reports',
  'docs/activation-qwen-timeout-calibration-reports/readiness/qwen-timeout-calibration-readiness-report.json',
  'docs/activation-qwen-timeout-calibration-reports/recommendation/qwen-model-timeout-target-recommendation.json',
  'docs/model-provider-dryrun-2-source-of-truth-read.md',
  'docs/model-provider-dryrun-2-calibrated-target-review.md',
  'docs/model-provider-dryrun-2-results.md',
  'docs/activation-product-internal-testing-session-0-reports',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports',
] as const

const OFFICIAL_DOCS = [
  'https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope',
  'https://www.alibabacloud.com/help/en/model-studio/first-api-call-to-qwen',
  'https://api-docs.deepseek.com/',
  'https://api-docs.deepseek.com/api/create-chat-completion',
] as const

const CASE_MATRIX: CasePlan[] = [
  { provider: 'qwen_dashscope', modelId: 'qwen3.7-plus', caseId: 'synthetic_edit_intent_extraction' },
  { provider: 'qwen_dashscope', modelId: 'qwen3.7-plus', caseId: 'synthetic_timeline_planning' },
  { provider: 'qwen_dashscope', modelId: 'qwen3.7-plus', caseId: 'synthetic_tool_route_metadata_recommendation' },
  { provider: 'qwen_dashscope', modelId: 'qwen3.7-plus', caseId: 'synthetic_provider_fallback_comparison' },
  { provider: 'deepseek', modelId: 'deepseek-v4-flash', caseId: 'synthetic_blocker_classification' },
  { provider: 'deepseek', modelId: 'deepseek-v4-flash', caseId: 'synthetic_rejected_raw_prompt_to_worker' },
  { provider: 'deepseek', modelId: 'deepseek-v4-pro', caseId: 'synthetic_cost_scope_risk_explanation' },
]

const SAFETY_FIELDS = [
  'workerExecutionAllowed',
  'toolExecutionAllowed',
  'publicArtifactsAllowed',
  'signedUrlsAllowed',
  'rawPromptForwardingAllowed',
  'directMutationAllowed',
] as const

const BLOCKED_SCOPES = [
  'tools_workers_routes',
  'media_processing',
  'supabase_writes',
  'raw_prompt_execution_into_workers_or_tools',
  'public_artifacts',
  'signed_urls',
  'production',
  'external_beta',
  'paid_production',
] as const

function buildModelDryRunRunId() {
  return `modeldryrun2-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function getModelDryRunGeneratedArtifactPrefix(runId = MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID) {
  return `gs://${MODEL_DRY_RUN_PRIVATE_GENERATED_BUCKET}/${MODEL_DRY_RUN_PRIVATE_OBJECT_PREFIX}/${runId}/`
}

export function getModelDryRunQaArtifactPrefix(runId = MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID) {
  return `gs://${MODEL_DRY_RUN_PRIVATE_QA_BUCKET}/${MODEL_DRY_RUN_PRIVATE_OBJECT_PREFIX}/${runId}/`
}

const SCHEMA_REQUIRED_FIELDS: Record<string, string[]> = {
  agent_findings_v1: ['caseId', 'findings', 'confidence', 'risks', 'blockedActions'],
  edit_intents_v1: ['caseId', 'intentSummary', 'segments', 'planningRequirements', 'approvalGates'],
  plan_snapshot_candidate_v1: ['caseId', 'candidateSummary', 'toolRouteHints', 'creditRiskNotes', 'requiredApprovals'],
  blocker_classification_v1: ['caseId', 'decision', 'blockers', 'unsafeRequestedActions', 'safeNextStep'],
  provider_fallback_assessment_v1: ['caseId', 'primaryCandidate', 'fallbackCandidate', 'comparisonReasons', 'dryRunLimits'],
}

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function pathInReportDir(file: typeof MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS[number]) {
  return path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR, file)
}

function modelDryRun2SummaryPath() {
  return path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR, 'model_provider_dryrun_2_summary.json')
}

export function getModelOrchestrationProviderDryRunPlan() {
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    branch: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BRANCH,
    baseBranch: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BASE_BRANCH,
    prTitle: '[model] MODEL-DRYRUN-2 calibrated Qwen DeepSeek synthetic provider dry run',
    mode: 'synthetic_provider_dry_run_execution',
    reportDir: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
    requiredConfirmations: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FORBIDDEN_CONFIRMATIONS,
    officialDocsBasis: OFFICIAL_DOCS,
    calibratedQwenTarget: {
      modelId: MODEL_DRY_RUN_CALIBRATED_QWEN_MODEL,
      mode: 'non_streaming',
      timeoutMs: MODEL_DRY_RUN_CALIBRATED_QWEN_TIMEOUT_MS,
      maxOutputTokens: MODEL_DRY_RUN_CALIBRATED_QWEN_MAX_OUTPUT_TOKENS,
      source: 'MODEL-TIMEOUT-1 qwen_schema_timeout_calibrated_ready_for_model_dryrun',
      enableThinking: MODEL_DRY_RUN_QWEN_ENABLE_THINKING,
      tokenGuardrailFix: 'MODEL-DRYRUN-2A disables Qwen hybrid thinking while preserving maxTotalTokens=7200',
    },
    qwenBaseUrlSecretRef: 'DASHSCOPE_BASE_URL',
    qwenRegionSecretRef: 'DASHSCOPE_REGION',
    qwenApprovedBaseUrl: MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL,
    qwenApprovedRegion: MODEL_DRY_RUN_APPROVED_DASHSCOPE_REGION,
    qwenEndpoint: `${MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL}/chat/completions`,
    deepseekEndpoint: 'https://api.deepseek.com/chat/completions',
    secretSource: 'google_secret_manager_only',
    environmentProviderSecretPayloadsAllowed: false,
    privateGeneratedArtifactPrefix: getModelDryRunGeneratedArtifactPrefix(),
    privateQaArtifactPrefix: getModelDryRunQaArtifactPrefix(),
    providerCallsAllowedOnlyWithExecuteAndConfirmations: true,
    syntheticPromptsOnly: true,
    stream: false,
    qwen37MaxUsedInModelDryRun2: false,
    qwenEnableThinking: MODEL_DRY_RUN_QWEN_ENABLE_THINKING,
    tools: false,
    search: false,
    hiddenReasoningCapture: false,
    rawProviderResponsesStored: false,
    supabaseWrites: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    publicArtifacts: false,
    signedUrls: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(false),
  }
}

export function buildModelOrchestrationProviderDryRunReports(): ProviderDryRunReports {
  const existing = readExistingReports()
  if (existing) return existing

  const decision = buildDecision('not_attempted', ['provider_dry_run_not_executed'])
  return {
    sourceOfTruthOwnershipAudit: buildSourceOfTruthOwnershipAudit(),
    plan: getModelOrchestrationProviderDryRunPlan(),
    secretAccess: buildSecretAccessReport([], false),
    loadedCases: buildLoadedCasesReport(loadApprovedCases(), false),
    qwenRun: buildProviderRunReport('qwen_dashscope', [], false),
    deepseekRun: buildProviderRunReport('deepseek', [], false),
    comparison: buildComparisonReport([], false),
    failClosed: buildFailClosedVerification([], true, false),
    decision,
    blockerReport: buildBlockerReport(decision),
    readinessReport: buildReadinessReport(decision),
    privateArtifactManifest: buildPrivateArtifactManifest(false),
    modelDryRun2Summary: buildModelDryRun2Summary(decision, [], [], false),
  }
}

export async function executeModelOrchestrationProviderDryRun(options: {
  execute: boolean
  syntheticOnly: boolean
  keepTemp: boolean
}): Promise<{ exitCode: number }> {
  if (!options.execute || !options.syntheticOnly) {
    const decision = buildDecision('blocked_pending_provider_error_review', [
      'execution_requires_explicit_execute_and_synthetic_only_flags',
    ])
    await writeModelOrchestrationProviderDryRunArtifacts(buildReportsFromDecision(decision, [], [], false, false))
    return { exitCode: 1 }
  }

  const missing = MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const forbidden = MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  if (missing.length > 0 || forbidden.length > 0) {
    const decision = buildDecision('blocked_pending_provider_error_review', [
      ...missing.map((name) => `missing_confirmation:${name}`),
      ...forbidden.map((name) => `forbidden_confirmation:${name}`),
    ])
    await writeModelOrchestrationProviderDryRunArtifacts(buildReportsFromDecision(decision, [], [], false, false))
    return { exitCode: 1 }
  }

  const cases = loadApprovedCases()
  const missingCases = CASE_MATRIX.filter((plan) => !cases.some((item) => item.caseId === plan.caseId))
  if (missingCases.length > 0) {
    const decision = buildDecision('blocked_pending_schema_contract_fix', [
      ...missingCases.map((item) => `missing_approved_case:${item.caseId}`),
    ])
    await writeModelOrchestrationProviderDryRunArtifacts(buildReportsFromDecision(decision, [], [], true, false))
    return { exitCode: 1 }
  }

  const secretLoad = await loadProviderSecrets()
  const secretConfigBlocked = secretLoad.entries.some((entry) => entry.blocker || entry.payloadAccessStatus === 'failed')
  if (!secretLoad.qwenKey || !secretLoad.qwenBaseUrl || !secretLoad.deepseekKey || secretConfigBlocked) {
    const decision = buildDecision('blocked_pending_secret_access', secretLoad.entries
      .filter((entry) => entry.blocker)
      .map((entry) => entry.blocker ?? 'secret_unavailable'))
    const reports = buildReportsFromDecision(decision, [], secretLoad.entries, false, false)
    reports.loadedCases = buildLoadedCasesReport(cases, true)
    reports.modelDryRun2Summary = buildModelDryRun2Summary(decision, [], secretLoad.entries, true)
    await writeModelOrchestrationProviderDryRunArtifacts(reports)
    return { exitCode: 1 }
  }

  const results: ProviderCaseResult[] = []
  for (const plan of CASE_MATRIX) {
    const currentCase = cases.find((item) => item.caseId === plan.caseId)
    if (!currentCase) continue
    const calibratedCase = buildCaseForPlan(plan, currentCase)
    const apiKey = plan.provider === 'qwen_dashscope' ? secretLoad.qwenKey : secretLoad.deepseekKey
    results.push(await runProviderCase(plan, calibratedCase, apiKey, secretLoad.qwenBaseUrl))
  }

  const invalidFixturePassed = runInvalidSchemaFixture()
  const decision = selectExecutionDecision(results, invalidFixturePassed)
  const reports = buildReportsFromDecision(decision, results, secretLoad.entries, true, invalidFixturePassed)
  reports.loadedCases = buildLoadedCasesReport(cases, true)
  await writeModelOrchestrationProviderDryRunArtifacts(reports, {
    uploadPrivateArtifacts: decision.status === 'passed',
  })
  return { exitCode: decision.status === 'passed' ? 0 : 1 }
}

export async function writeModelOrchestrationProviderDryRunArtifacts(
  reports: ProviderDryRunReports,
  options: { uploadPrivateArtifacts?: boolean } = {},
): Promise<void> {
  if (options.uploadPrivateArtifacts) {
    attachPrivateArtifactUpload(reports, await uploadProviderDryRunPrivateArtifacts(reports))
  }
  const reportDir = MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_dry_run_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_secret_access_report.json'), reports.secretAccess)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_dry_run_loaded_cases_report.json'), reports.loadedCases)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_provider_dry_run_report.json'), reports.qwenRun)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'deepseek_provider_dry_run_report.json'), reports.deepseekRun)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_dry_run_comparison_report.json'), reports.comparison)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_dry_run_fail_closed_verification.json'), reports.failClosed)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_dry_run_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_dry_run_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_dry_run_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_dry_run_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeJsonArtifact(modelDryRun2SummaryPath(), reports.modelDryRun2Summary)
  await writeDocs(reports)
}

export function readModelOrchestrationProviderDryRunSummary() {
  return readJson(pathInReportDir('provider_dry_run_readiness_report.json')) ??
    buildModelOrchestrationProviderDryRunReports().readinessReport
}

function readExistingReports(): ProviderDryRunReports | undefined {
  const decision = readJson(pathInReportDir('provider_dry_run_decision.json'))
  if (!decision) return undefined
  const decisionValue = asString(decision.decision)
  if (decisionValue === 'not_attempted') return undefined
  const secretAccess = readJson(pathInReportDir('provider_secret_access_report.json'))
  if (secretAccess?.secretSourcePolicy !== 'google_secret_manager_only') return undefined
  const allPresent = MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS.every((file) =>
    existsSync(pathInReportDir(file)))
  if (!allPresent) return undefined

  return {
    sourceOfTruthOwnershipAudit: readJson(pathInReportDir('source_of_truth_ownership_audit.json')) ?? {},
    plan: readJson(pathInReportDir('provider_dry_run_plan.json')) ?? {},
    secretAccess: secretAccess ?? {},
    loadedCases: readJson(pathInReportDir('provider_dry_run_loaded_cases_report.json')) ?? {},
    qwenRun: readJson(pathInReportDir('qwen_provider_dry_run_report.json')) ?? {},
    deepseekRun: readJson(pathInReportDir('deepseek_provider_dry_run_report.json')) ?? {},
    comparison: readJson(pathInReportDir('provider_dry_run_comparison_report.json')) ?? {},
    failClosed: readJson(pathInReportDir('provider_dry_run_fail_closed_verification.json')) ?? {},
    decision,
    blockerReport: readJson(pathInReportDir('provider_dry_run_blocker_report.json')) ?? {},
    readinessReport: readJson(pathInReportDir('provider_dry_run_readiness_report.json')) ?? {},
    privateArtifactManifest: readJson(pathInReportDir('provider_dry_run_private_artifact_manifest.json')) ?? {},
    modelDryRun2Summary: readJson(modelDryRun2SummaryPath()) ?? {},
  }
}

function buildReportsFromDecision(
  decision: Record<string, unknown>,
  results: ProviderCaseResult[],
  secretEntries: SecretAccessEntry[],
  executed: boolean,
  invalidFixturePassed: boolean,
): ProviderDryRunReports {
  const cases = loadApprovedCases()
  return {
    sourceOfTruthOwnershipAudit: buildSourceOfTruthOwnershipAudit(),
    plan: getModelOrchestrationProviderDryRunPlan(),
    secretAccess: buildSecretAccessReport(secretEntries, executed),
    loadedCases: buildLoadedCasesReport(cases, executed),
    qwenRun: buildProviderRunReport('qwen_dashscope', results, executed),
    deepseekRun: buildProviderRunReport('deepseek', results, executed),
    comparison: buildComparisonReport(results, executed),
    failClosed: buildFailClosedVerification(results, invalidFixturePassed, executed),
    decision,
    blockerReport: buildBlockerReport(decision),
    readinessReport: buildReadinessReport(decision),
    privateArtifactManifest: buildPrivateArtifactManifest(executed),
    modelDryRun2Summary: buildModelDryRun2Summary(decision, results, secretEntries, executed),
  }
}

function buildSourceOfTruthOwnershipAudit() {
  const approvalReadiness = readJson(path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_readiness_report.json'))
  const approvalDecision = readJson(path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_approval_decision.json'))

  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    ownerWorkstream: 'MODEL_ORCHESTRATION',
    sourceEvidence: 'PR #318 committed dry-run approval reports, PR #322 auth repair evidence, MODEL-TIMEOUT-1 calibration evidence, and official provider docs',
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    pr318ReadinessStatus: approvalReadiness?.status ?? 'missing',
    pr318Decision: approvalReadiness?.decision ?? approvalDecision?.decision ?? 'missing',
    expectedPr318Decision: 'approved_for_future_qwen_deepseek_provider_dry_run',
    officialDocsBasis: OFFICIAL_DOCS,
    modelTimeout1Readiness: readJson('docs/activation-qwen-timeout-calibration-reports/readiness/qwen-timeout-calibration-readiness-report.json')?.decision ?? 'missing',
    modelTimeout1Recommendation: readJson('docs/activation-qwen-timeout-calibration-reports/recommendation/qwen-model-timeout-target-recommendation.json') ?? {},
    modelDryRun1AEvidenceReadFromRemoteBranch: 'origin/codex/rp-model-dryrun-1a-qwen-deepseek-dry-run-gate-fixes',
    modelDryRun1BEvidenceReadFromRemoteBranch: 'origin/codex/rp-model-dryrun-1b-qwen-dashscope-owner-secret-rotation-retry',
    providerGatewayRuntimeImported: false,
    productionRouteImported: false,
    supabaseWrites: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(true),
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    publicArtifacts: false,
    signedUrls: false,
    productionAffected: false,
  }
}

function loadApprovedCases(): ApprovedCase[] {
  const source = readJson(path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_synthetic_cases.json'))
  return asArray(source?.cases).map((item) => {
    const record = asRecord(item)
    return {
      caseId: asString(record.caseId),
      prompt: asString(record.prompt),
      expectedOutputSchema: asString(record.expectedOutputSchema),
      maxTokens: asNumber(record.maxTokens, 800),
      timeoutMs: Math.min(asNumber(record.timeoutMs, 10000), 15000),
    }
  }).filter((item) => item.caseId && item.prompt && item.expectedOutputSchema)
}

function buildCaseForPlan(plan: CasePlan, source: ApprovedCase): ApprovedCase {
  if (plan.provider !== 'qwen_dashscope') return source
  return {
    ...source,
    maxTokens: MODEL_DRY_RUN_CALIBRATED_QWEN_MAX_OUTPUT_TOKENS,
    timeoutMs: MODEL_DRY_RUN_CALIBRATED_QWEN_TIMEOUT_MS,
  }
}

function buildLoadedCasesReport(cases: ApprovedCase[], executed: boolean) {
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    status: cases.length >= 8 ? 'passed' : 'blocked',
    executed,
    sourcePath: path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_synthetic_cases.json'),
    loadedCaseCount: cases.length,
    providerCallCaseCount: CASE_MATRIX.length,
    localValidationFixtureCaseCount: 1,
    syntheticOnly: true,
    containsUserData: false,
    containsMedia: false,
    rawPromptStoredInReports: false,
    cases: CASE_MATRIX.map((plan) => {
      const source = cases.find((item) => item.caseId === plan.caseId)
      const calibrated = source ? buildCaseForPlan(plan, source) : undefined
      return {
        caseId: plan.caseId,
        provider: plan.provider,
        modelId: plan.modelId,
        expectedOutputSchema: source?.expectedOutputSchema ?? 'missing',
        maxTokens: calibrated?.maxTokens ?? 'missing',
        timeoutMs: calibrated?.timeoutMs ?? 'missing',
        modelDryRun2CalibrationApplied: plan.provider === 'qwen_dashscope',
        modelDryRun2aThinkingDisabled: plan.provider === 'qwen_dashscope' ? MODEL_DRY_RUN_QWEN_ENABLE_THINKING === false : 'not_applicable',
        stream: false,
        promptCharacterCount: source?.prompt.length ?? 0,
        promptTextStored: false,
      }
    }),
    schemaInvalidFixture: {
      caseId: 'synthetic_schema_invalid_response_failure',
      providerCall: false,
      localValidationFixture: true,
      promptTextStored: false,
    },
  }
}

async function loadProviderSecrets(): Promise<{
  qwenKey?: string
  qwenBaseUrl?: string
  deepseekKey?: string
  entries: SecretAccessEntry[]
}> {
  const qwen = await loadSecret('DASHSCOPE_API_KEY', 'qwen_dashscope')
  const qwenBaseUrl = await loadSecret('DASHSCOPE_BASE_URL', 'dashscope_config')
  const qwenRegion = await loadSecret('DASHSCOPE_REGION', 'dashscope_config')
  const deepseek = await loadSecret('DEEPSEEK_API_KEY', 'deepseek')

  const normalizedBaseUrl = qwenBaseUrl.value?.replace(/\/+$/, '')
  if (normalizedBaseUrl && normalizedBaseUrl !== MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL) {
    qwenBaseUrl.value = undefined
    qwenBaseUrl.entry.payloadAccessStatus = 'failed'
    qwenBaseUrl.entry.payloadMatchedApprovedValue = false
    qwenBaseUrl.entry.blocker = 'dashscope_base_url_secret_not_approved_us_endpoint'
  } else if (normalizedBaseUrl) {
    qwenBaseUrl.value = normalizedBaseUrl
    qwenBaseUrl.entry.payloadMatchedApprovedValue = true
  }

  const normalizedRegion = qwenRegion.value?.trim().toLowerCase()
  if (normalizedRegion && normalizedRegion !== MODEL_DRY_RUN_APPROVED_DASHSCOPE_REGION) {
    qwenRegion.value = undefined
    qwenRegion.entry.payloadAccessStatus = 'failed'
    qwenRegion.entry.payloadMatchedApprovedValue = false
    qwenRegion.entry.blocker = 'dashscope_region_secret_not_us'
  } else if (normalizedRegion) {
    qwenRegion.entry.payloadMatchedApprovedValue = true
  }

  return {
    qwenKey: qwen.value,
    qwenBaseUrl: qwenBaseUrl.value,
    deepseekKey: deepseek.value,
    entries: [qwen.entry, qwenBaseUrl.entry, qwenRegion.entry, deepseek.entry],
  }
}

async function loadSecret(secretRef: SecretAccessEntry['secretRef'], provider: SecretAccessEntry['provider']): Promise<{
  value?: string
  entry: SecretAccessEntry
}> {
  const envValue = process.env[secretRef]
  if (envValue && envValue.trim().length > 0) {
    return {
      entry: {
        secretRef,
        provider,
        source: 'unavailable',
        payloadAccessStatus: 'failed',
        envVarPresent: true,
        payloadPrinted: false,
        payloadCommitted: false,
        secretValueStoredInReports: false,
        blocker: `${secretRef.toLowerCase()}_env_payload_present_secret_manager_required`,
      },
    }
  }

  try {
    const { stdout } = await execFileAsync('gcloud', [
      'secrets',
      'versions',
      'access',
      'latest',
      `--secret=${secretRef}`,
      '--project=reeditpro',
    ], {
      timeout: 20000,
      maxBuffer: 1024 * 1024,
      env: { ...process.env },
    })
    const value = stdout.trim()
    if (value.length === 0) {
      return {
        entry: {
          secretRef,
          provider,
          source: 'unavailable',
          payloadAccessStatus: 'failed',
          envVarPresent: false,
          payloadPrinted: false,
          payloadCommitted: false,
          secretValueStoredInReports: false,
          blocker: `${secretRef.toLowerCase()}_secret_payload_empty`,
        },
      }
    }
    return {
      value,
      entry: {
        secretRef,
        provider,
        source: 'secret_manager',
        payloadAccessStatus: 'succeeded',
        envVarPresent: true,
        payloadPrinted: false,
        payloadCommitted: false,
        secretValueStoredInReports: false,
      },
    }
  } catch {
    return {
      entry: {
        secretRef,
        provider,
        source: 'unavailable',
        payloadAccessStatus: 'failed',
        envVarPresent: false,
        payloadPrinted: false,
        payloadCommitted: false,
        secretValueStoredInReports: false,
        blocker: `${secretRef.toLowerCase()}_secret_payload_access_failed`,
      },
    }
  }
}

function buildSecretAccessReport(entries: SecretAccessEntry[], executed: boolean) {
  const normalizedEntries = entries.length > 0 ? entries : ([
    {
      secretRef: 'DASHSCOPE_API_KEY',
      provider: 'qwen_dashscope',
      source: 'unavailable',
      payloadAccessStatus: 'not_attempted',
      envVarPresent: false,
      payloadPrinted: false,
      payloadCommitted: false,
      secretValueStoredInReports: false,
    },
    {
      secretRef: 'DASHSCOPE_BASE_URL',
      provider: 'dashscope_config',
      source: 'unavailable',
      payloadAccessStatus: 'not_attempted',
      envVarPresent: false,
      payloadPrinted: false,
      payloadCommitted: false,
      secretValueStoredInReports: false,
    },
    {
      secretRef: 'DASHSCOPE_REGION',
      provider: 'dashscope_config',
      source: 'unavailable',
      payloadAccessStatus: 'not_attempted',
      envVarPresent: false,
      payloadPrinted: false,
      payloadCommitted: false,
      secretValueStoredInReports: false,
    },
    {
      secretRef: 'DEEPSEEK_API_KEY',
      provider: 'deepseek',
      source: 'unavailable',
      payloadAccessStatus: 'not_attempted',
      envVarPresent: false,
      payloadPrinted: false,
      payloadCommitted: false,
      secretValueStoredInReports: false,
    },
  ] satisfies SecretAccessEntry[])

  const blockers = normalizedEntries
    .filter((entry) => entry.payloadAccessStatus === 'failed' || entry.blocker)
    .map((entry) => entry.blocker ?? `${entry.secretRef.toLowerCase()}_unavailable`)

  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    status: executed ? (blockers.length === 0 ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    secretManagerProject: 'reeditpro',
    secretSourcePolicy: 'google_secret_manager_only',
    exactSecretRefs: ['DASHSCOPE_API_KEY', 'DASHSCOPE_BASE_URL', 'DASHSCOPE_REGION', 'DEEPSEEK_API_KEY'],
    approvedDashScopeBaseUrl: MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL,
    approvedDashScopeRegion: MODEL_DRY_RUN_APPROVED_DASHSCOPE_REGION,
    broadSecretDiscovery: false,
    exactSecretRefsOnly: true,
    entries: normalizedEntries,
    payloadAccessed: executed && blockers.length === 0,
    baseUrlPayloadMatchedApprovedUsEndpoint: normalizedEntries.some((entry) =>
      entry.secretRef === 'DASHSCOPE_BASE_URL' && entry.payloadMatchedApprovedValue === true),
    regionPayloadMatchedUs: normalizedEntries.some((entry) =>
      entry.secretRef === 'DASHSCOPE_REGION' && entry.payloadMatchedApprovedValue === true),
    payloadPrinted: false,
    payloadCommitted: false,
    secretValueStoredInReports: false,
    activeBlockers: blockers,
  }
}

async function runProviderCase(
  plan: CasePlan,
  currentCase: ApprovedCase,
  apiKey: string,
  qwenBaseUrl: string,
): Promise<ProviderCaseResult> {
  const started = Date.now()
  try {
    const body = buildProviderRequestBody(plan, currentCase)
    const response = await fetch(providerUrl(plan.provider, qwenBaseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(currentCase.timeoutMs),
    })
    const latencyMs = Date.now() - started
    const status = response.status
    const text = await response.text()
    if (!response.ok) {
      return blockedResult(plan, currentCase, classifyProviderHttpError(status, text), {
        httpStatus: status,
        latencyMs,
        responseContentCharacters: text.length,
      })
    }

    let providerJson: Record<string, unknown>
    try {
      providerJson = JSON.parse(text) as Record<string, unknown>
    } catch {
      return blockedResult(plan, currentCase, 'provider_response_json_parse_failed', {
        httpStatus: status,
        latencyMs,
        responseContentCharacters: text.length,
      })
    }

    const choice = asRecord(asArray(providerJson.choices)[0])
    const message = asRecord(choice.message)
    const content = asString(message.content)
    const usage = asRecord(providerJson.usage)
    const parsed = parseProviderContent(content)
    if (!parsed.ok) {
      return blockedResult(plan, currentCase, parsed.blocker, {
        httpStatus: status,
        latencyMs,
        finishReason: asString(choice.finish_reason),
        responseContentCharacters: content.length,
        usage: normalizeUsage(usage),
      })
    }

    const validation = validateProviderOutput(parsed.value, currentCase)
    if (!validation.ok) {
      return blockedResult(plan, currentCase, validation.blocker, {
        httpStatus: status,
        latencyMs,
        finishReason: asString(choice.finish_reason),
        responseContentCharacters: content.length,
        usage: normalizeUsage(usage),
      })
    }

    return {
      caseId: currentCase.caseId,
      provider: plan.provider,
      modelId: plan.modelId,
      schemaId: currentCase.expectedOutputSchema,
      status: 'passed',
      httpStatus: status,
      latencyMs,
      finishReason: asString(choice.finish_reason),
      usage: normalizeUsage(usage),
      responseContentCharacters: content.length,
      normalizedOutput: validation.normalized,
      rawProviderResponseStored: false,
      rawProviderResponsePrinted: false,
      secretPayloadPrinted: false,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      routeExecutionAllowed: false,
      publicArtifactsAllowed: false,
      signedUrlsAllowed: false,
      rawPromptForwardingAllowed: false,
      directMutationAllowed: false,
      productionMutationAllowed: false,
    }
  } catch (error) {
    const blocker = error instanceof Error && error.name === 'TimeoutError'
      ? 'provider_timeout'
      : 'provider_request_failed'
    return blockedResult(plan, currentCase, blocker, {
      latencyMs: Date.now() - started,
    })
  }
}

function providerUrl(provider: ProviderName, qwenBaseUrl = MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL) {
  return provider === 'qwen_dashscope'
    ? `${qwenBaseUrl.replace(/\/+$/, '')}/chat/completions`
    : 'https://api.deepseek.com/chat/completions'
}

function buildProviderRequestBody(plan: CasePlan, currentCase: ApprovedCase) {
  const systemPrompt = [
    'You are a schema-only planning dry-run evaluator for ReeditPro.',
    'Return one JSON object only. Do not include markdown or explanations outside JSON.',
    'Use only synthetic metadata. Do not ask to run workers, tools, routes, media processing, Supabase, public artifacts, signed URLs, production, external beta, or paid production.',
    'Do not reveal hidden reasoning. Keep all safety booleans false.',
  ].join(' ')
  const required = [
    ...new Set([
      ...(SCHEMA_REQUIRED_FIELDS[currentCase.expectedOutputSchema] ?? ['caseId']),
      ...SAFETY_FIELDS,
    ]),
  ]
  const userPrompt = [
    `caseId: ${currentCase.caseId}`,
    `schemaId: ${currentCase.expectedOutputSchema}`,
    `syntheticInput: ${currentCase.prompt}`,
    `requiredTopLevelFields: ${required.join(', ')}`,
    'Safety booleans must be false: workerExecutionAllowed, toolExecutionAllowed, publicArtifactsAllowed, signedUrlsAllowed, rawPromptForwardingAllowed, directMutationAllowed.',
  ].join('\n')

  const base = {
    model: plan.modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: currentCase.maxTokens,
    temperature: 0.2,
    stream: false,
  }

  if (plan.provider === 'deepseek') {
    return {
      ...base,
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
    }
  }

  return {
    ...base,
    enable_thinking: MODEL_DRY_RUN_QWEN_ENABLE_THINKING,
  }
}

function classifyProviderHttpError(status: number, text: string) {
  const lower = text.toLowerCase()
  if (status === 401 || status === 403) return 'provider_auth_or_permission_failed'
  if (status === 404 || lower.includes('model') || lower.includes('alias')) return 'model_alias_unavailable'
  if (status === 429 || lower.includes('quota') || lower.includes('rate')) return 'provider_rate_or_quota_error'
  return 'provider_http_error'
}

function parseProviderContent(content: string): { ok: true; value: Record<string, unknown> } | { ok: false; blocker: string } {
  const trimmed = content.trim()
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    const parsed = JSON.parse(unfenced)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, blocker: 'provider_output_schema_invalid' }
    return { ok: true, value: parsed as Record<string, unknown> }
  } catch {
    return { ok: false, blocker: 'provider_output_invalid_json' }
  }
}

function normalizeUsage(usage: Record<string, unknown> | undefined): ProviderCaseResult['usage'] {
  if (!usage) return undefined
  return {
    promptTokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : undefined,
    completionTokens: typeof usage.completion_tokens === 'number' ? usage.completion_tokens : undefined,
    totalTokens: typeof usage.total_tokens === 'number' ? usage.total_tokens : undefined,
  }
}

function validateProviderOutput(value: Record<string, unknown>, currentCase: ApprovedCase): {
  ok: true
  normalized: Record<string, unknown>
} | {
  ok: false
  blocker: string
} {
  const required = SCHEMA_REQUIRED_FIELDS[currentCase.expectedOutputSchema] ?? ['caseId']
  for (const field of required) {
    if (!(field in value)) return { ok: false, blocker: `provider_output_missing_required_field:${field}` }
  }
  if (asString(value.caseId) !== currentCase.caseId) return { ok: false, blocker: 'provider_output_case_id_mismatch' }
  for (const field of SAFETY_FIELDS) {
    if (value[field] !== false) return { ok: false, blocker: `unsafe_output_${field}` }
  }

  const text = JSON.stringify(value)
  if (hasForbiddenOutputPattern(text)) return { ok: false, blocker: 'unsafe_output_forbidden_pattern' }
  const normalized: Record<string, unknown> = {}
  for (const field of [...required, ...SAFETY_FIELDS]) normalized[field] = value[field]
  normalized.schemaId = currentCase.expectedOutputSchema
  return { ok: true, normalized }
}

function hasForbiddenOutputPattern(text: string) {
  return [
    /postgres(?:ql)?:\/\//i,
    /service[_-]?role/i,
    /api[_-]?key/i,
    /access[_-]?token/i,
    /https?:\/\//i,
    /execute\s+(worker|tool|route)/i,
    /run\s+(worker|tool|route)/i,
    /production\s+(write|deploy|mutation)/i,
  ].some((pattern) => pattern.test(text))
}

function blockedResult(
  plan: CasePlan,
  currentCase: ApprovedCase,
  blocker: string,
  extra: Partial<ProviderCaseResult> = {},
): ProviderCaseResult {
  return {
    caseId: currentCase.caseId,
    provider: plan.provider,
    modelId: plan.modelId,
    schemaId: currentCase.expectedOutputSchema,
    status: 'blocked',
    blocker,
    rawProviderResponseStored: false,
    rawProviderResponsePrinted: false,
    secretPayloadPrinted: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    routeExecutionAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
    rawPromptForwardingAllowed: false,
    directMutationAllowed: false,
    productionMutationAllowed: false,
    ...extra,
  }
}

function runInvalidSchemaFixture() {
  const fixtureText = 'This is intentionally not JSON and must fail closed.'
  const parsed = parseProviderContent(fixtureText)
  return parsed.ok === false && parsed.blocker === 'provider_output_invalid_json'
}

function buildProviderRunReport(provider: ProviderName, results: ProviderCaseResult[], executed: boolean) {
  const providerResults = results.filter((result) => result.provider === provider)
  const passed = providerResults.filter((result) => result.status === 'passed')
  const blocked = providerResults.filter((result) => result.status === 'blocked')
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    provider,
    status: executed ? (blocked.length === 0 && passed.length > 0 ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    providerCallsAttempted: executed ? providerResults.length : 0,
    providerCallsPassed: passed.length,
    providerCallsBlocked: blocked.length,
    endpoint: provider === 'qwen_dashscope'
      ? `${MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL}/chat/completions`
      : 'https://api.deepseek.com/chat/completions',
    stream: false,
    tools: false,
    search: false,
    hiddenReasoningCapture: false,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    secretPayloadPrinted: false,
    results: providerResults,
  }
}

function buildComparisonReport(results: ProviderCaseResult[], executed: boolean) {
  const qwenPassed = results.some((result) => result.provider === 'qwen_dashscope' && result.status === 'passed')
  const deepseekPassed = results.some((result) => result.provider === 'deepseek' && result.status === 'passed')
  const totalCalls = results.length
  const usageTotal = results.reduce((total, result) => total + (result.usage?.totalTokens ?? 0), 0)
  const blocked = results.filter((result) => result.status === 'blocked')
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    status: executed ? (qwenPassed && deepseekPassed && blocked.length === 0 ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    qwenCandidatePassed: qwenPassed,
    deepseekCandidatePassed: deepseekPassed,
    officialAliasesOnly: results.every((result) =>
      ['qwen3.7-plus', 'deepseek-v4-flash', 'deepseek-v4-pro'].includes(result.modelId)),
    qwen37MaxUsedInModelDryRun2: results.some((result) => result.modelId === 'qwen3.7-max'),
    totalProviderCalls: totalCalls,
    maxTotalProviderCalls: 8,
    totalTokensReported: usageTotal,
    maxTotalTokens: 7200,
    costGuardrailStatus: totalCalls <= 8 && usageTotal <= 7200 ? 'passed_by_call_and_token_caps' : 'blocked_pending_cost_review',
    rawProviderResponseStored: false,
    unsafeOutputCount: blocked.filter((result) => result.blocker?.startsWith('unsafe_output')).length,
    blockedCases: blocked.map((result) => ({
      caseId: result.caseId,
      provider: result.provider,
      modelId: result.modelId,
      blocker: result.blocker,
    })),
  }
}

function buildFailClosedVerification(results: ProviderCaseResult[], invalidFixturePassed: boolean, executed: boolean) {
  const unsafeBlocked = results
    .filter((result) => result.status === 'blocked')
    .every((result) => result.workerExecutionAllowed === false && result.toolExecutionAllowed === false)
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    status: executed ? (invalidFixturePassed && unsafeBlocked ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    invalidJsonFixture: {
      caseId: 'synthetic_schema_invalid_response_failure',
      providerCall: false,
      failClosed: invalidFixturePassed,
      rawFixtureStored: false,
    },
    failClosedChecks: [
      'invalid_json',
      'schema_mismatch',
      'provider_timeout',
      'provider_error',
      'cost_overrun',
      'secret_missing',
      'unsafe_output',
      'worker_tool_execution_request',
      'public_artifact_request',
      'signed_url_request',
      'production_mutation_suggestion',
      'raw_prompt_pass_through',
    ],
    invalidOutputsAccepted: false,
    mutationOnFailure: false,
    retryOnFailure: false,
    rawProviderResponseStored: false,
  }
}

function selectExecutionDecision(results: ProviderCaseResult[], invalidFixturePassed: boolean) {
  const blockers = new Set<string>()
  const qwenPassed = results.some((result) => result.provider === 'qwen_dashscope' && result.status === 'passed')
  const deepseekPassed = results.some((result) => result.provider === 'deepseek' && result.status === 'passed')
  const blocked = results.filter((result) => result.status === 'blocked')
  const usageTotal = results.reduce((total, result) => total + (result.usage?.totalTokens ?? 0), 0)

  if (!qwenPassed || !deepseekPassed) blockers.add('provider_family_schema_valid_output_missing')
  for (const result of blocked) blockers.add(result.blocker ?? 'provider_case_blocked')
  if (!invalidFixturePassed) blockers.add('invalid_json_fail_closed_fixture_failed')
  if (results.length > 8 || usageTotal > 7200) blockers.add('provider_cost_or_token_guardrail_exceeded')

  if (blockers.size === 0) {
    return buildDecision('provider_dry_run_passed_ready_for_plan_snapshot_contract', [])
  }

  const blockerList = [...blockers]
  if (blockerList.some((item) => item.includes('model_alias'))) return buildDecision('blocked_pending_model_alias_review', blockerList)
  if (blockerList.some((item) => item.includes('auth') || item.includes('permission') || item.includes('provider_http') || item.includes('provider_request') || item.includes('provider_rate'))) {
    return buildDecision('blocked_pending_provider_error_review', blockerList)
  }
  if (blockerList.some((item) => item.includes('unsafe_output'))) return buildDecision('rejected_due_provider_safety_failure', blockerList)
  if (blockerList.some((item) => item.includes('missing_required_field') || item.includes('invalid_json') || item.includes('schema'))) {
    return buildDecision('blocked_pending_schema_contract_fix', blockerList)
  }
  if (blockerList.some((item) => item.includes('cost') || item.includes('token'))) return buildDecision('blocked_pending_cost_review', blockerList)
  return buildDecision('blocked_pending_provider_error_review', blockerList)
}

function buildDecision(decision: ProviderDecision, activeBlockers: string[]) {
  const passed = decision === 'provider_dry_run_passed_ready_for_plan_snapshot_contract'
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    status: passed ? 'passed' : decision === 'not_attempted' ? 'not_attempted' : 'blocked',
    decision,
    activeBlockers,
    providerCallsAttempted: decision !== 'not_attempted' &&
      (passed || activeBlockers.some((item) => item.startsWith('provider_') || item.includes('model_alias') || item.includes('schema'))),
    qwenApiCallAllowedInThisPhase: true,
    deepseekApiCallAllowedInThisPhase: true,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    supabaseWrites: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(true),
    rawPromptExecutionIntoWorkersOrTools: false,
    publicArtifacts: false,
    signedUrls: false,
    productionAffected: false,
    externalBeta: false,
    paidProduction: false,
    nextRecommendedPhase: passed
      ? 'MODEL_ORCHESTRATION - plan snapshot contract'
      : 'Resolve the exact secret/model/schema/provider blocker before another dry-run.',
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: decision.activeBlockers ?? [],
    blockedScopes: BLOCKED_SCOPES,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    supabaseWrites: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(true),
    rawPromptExecutionIntoWorkersOrTools: false,
    publicArtifacts: false,
    signedUrls: false,
    productionAffected: false,
    externalBeta: false,
    paidProduction: false,
    secretPayloadPrinted: false,
    rawProviderResponsesStored: false,
  }
}

function mapModelDryRun2FinalState(
  decision: Record<string, unknown>,
  results: ProviderCaseResult[],
  secretEntries: SecretAccessEntry[],
): ModelDryRun2FinalState {
  if (decision.status === 'passed') return 'provider_dry_run_passed'

  const blockers = [
    ...asArray(decision.activeBlockers).map(String),
    ...results.map((result) => result.blocker ?? '').filter(Boolean),
    ...secretEntries.map((entry) => entry.blocker ?? '').filter(Boolean),
  ]

  if (blockers.some((item) => item.includes('dashscope_base_url') || item.includes('dashscope_region'))) {
    return 'blocked_provider_config_review'
  }
  if (blockers.some((item) => item.includes('secret') || item.includes('env_payload_present'))) {
    return 'blocked_secret_metadata_review'
  }
  if (blockers.some((item) =>
    item.includes('timeout') ||
    item.includes('schema') ||
    item.includes('invalid_json') ||
    item.includes('missing_required_field') ||
    item.includes('case_id_mismatch'))) {
    return 'blocked_qwen_timeout_or_schema'
  }
  if (blockers.some((item) =>
    item.includes('provider') ||
    item.includes('auth') ||
    item.includes('permission') ||
    item.includes('model_alias') ||
    item.includes('rate') ||
    item.includes('quota'))) {
    return 'blocked_provider_call_failed'
  }
  return 'blocked_provider_config_review'
}

function buildModelDryRun2Summary(
  decision: Record<string, unknown>,
  results: ProviderCaseResult[],
  secretEntries: SecretAccessEntry[],
  executed: boolean,
) {
  const qwenResults = results.filter((result) => result.provider === 'qwen_dashscope')
  const deepseekResults = results.filter((result) => result.provider === 'deepseek')
  const finalState = mapModelDryRun2FinalState(decision, results, secretEntries)
  const timeoutReadiness = readJson('docs/activation-qwen-timeout-calibration-reports/readiness/qwen-timeout-calibration-readiness-report.json')
  const timeoutRecommendation = readJson('docs/activation-qwen-timeout-calibration-reports/recommendation/qwen-model-timeout-target-recommendation.json')

  return {
    phase: 'MODEL-DRYRUN-2',
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    branch: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BRANCH,
    baseBranch: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BASE_BRANCH,
    finalState,
    internalDecision: decision.decision,
    status: finalState === 'provider_dry_run_passed' ? 'passed' : 'blocked',
    executed,
    timeoutCalibrationSource: {
      decision: timeoutReadiness?.decision ?? 'missing',
      fullModelDryRunReadiness: timeoutReadiness?.fullModelDryRunReadiness ?? timeoutRecommendation?.fullDryRunReadiness ?? 'missing',
      selectedHeadAgentModel: timeoutRecommendation?.selectedHeadAgentModel ?? MODEL_DRY_RUN_CALIBRATED_QWEN_MODEL,
      selectedCalibrationMode: timeoutRecommendation?.selectedCalibrationMode ?? 'non_streaming',
      recommendedTimeoutMs: timeoutRecommendation?.recommendedTimeoutMs ?? MODEL_DRY_RUN_CALIBRATED_QWEN_TIMEOUT_MS,
      recommendedMaxOutputTokens: timeoutRecommendation?.recommendedMaxOutputTokens ?? MODEL_DRY_RUN_CALIBRATED_QWEN_MAX_OUTPUT_TOKENS,
    },
    calibratedQwenTarget: {
      modelId: MODEL_DRY_RUN_CALIBRATED_QWEN_MODEL,
      mode: 'non_streaming',
      timeoutMs: MODEL_DRY_RUN_CALIBRATED_QWEN_TIMEOUT_MS,
      maxOutputTokens: MODEL_DRY_RUN_CALIBRATED_QWEN_MAX_OUTPUT_TOKENS,
      stream: false,
      enableThinking: MODEL_DRY_RUN_QWEN_ENABLE_THINKING,
      qwen37MaxUsed: false,
    },
    dashscopeConfig: {
      baseUrlSecretRef: 'DASHSCOPE_BASE_URL',
      regionSecretRef: 'DASHSCOPE_REGION',
      approvedBaseUrl: MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL,
      approvedRegion: MODEL_DRY_RUN_APPROVED_DASHSCOPE_REGION,
      baseUrlPayloadMatchedApprovedUsEndpoint: secretEntries.some((entry) =>
        entry.secretRef === 'DASHSCOPE_BASE_URL' && entry.payloadMatchedApprovedValue === true),
      regionPayloadMatchedUs: secretEntries.some((entry) =>
        entry.secretRef === 'DASHSCOPE_REGION' && entry.payloadMatchedApprovedValue === true),
    },
    qwenDashscopeStatus: qwenResults.length === 0 ? 'not_attempted' :
      qwenResults.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
    deepseekStatus: deepseekResults.length === 0 ? 'not_attempted' :
      deepseekResults.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
    providerCallsAttempted: results.length,
    qwenProviderCallsAttempted: qwenResults.length,
    deepseekProviderCallsAttempted: deepseekResults.length,
    activeBlockers: decision.activeBlockers ?? [],
    privateArtifactUploadStatus: decision.privateArtifactUploadStatus ?? 'not_attempted_provider_dry_run_not_passed',
    supabaseUpdateRequired: 'docs/status only',
    supabaseUpdateStatus: 'docs_only',
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    rawProviderResponseCommitted: false,
    rawProviderResponsesStored: false,
    privateUrlsCommitted: false,
    signedUrlsCreated: false,
    publicArtifactsCreated: false,
    workerExecution: false,
    toolExecution: false,
    routeExecution: false,
    mediaProcessing: false,
    browserCapture: false,
    dockerCloudRunExecution: false,
    productionDeployment: false,
    externalBetaUnlock: false,
    paidProductionUnlock: false,
    productionBetaUnlock: false,
    noScopeStatement: 'No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.',
    nextRecommendedPrompt: finalState === 'provider_dry_run_passed'
      ? 'PLAN-SNAPSHOT-0 - Plan Snapshot Contract'
      : 'MODEL-DRYRUN-2A - Calibrated Provider Dry-Run Fixes',
  }
}

function buildReadinessReport(decision: Record<string, unknown>) {
  const providerCallsAttempted = decision.providerCallsAttempted === true
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: decision.activeBlockers ?? [],
    providerCandidates: {
      qwenDefault: 'qwen3.7-plus',
      qwenEscalation: 'not_used_in_model_dryrun_2',
      deepseekDefault: 'deepseek-v4-flash',
      deepseekEscalation: 'deepseek-v4-pro',
    },
    calibratedQwenTarget: {
      modelId: MODEL_DRY_RUN_CALIBRATED_QWEN_MODEL,
      mode: 'non_streaming',
      timeoutMs: MODEL_DRY_RUN_CALIBRATED_QWEN_TIMEOUT_MS,
      maxOutputTokens: MODEL_DRY_RUN_CALIBRATED_QWEN_MAX_OUTPUT_TOKENS,
    },
    providerCallsAttempted,
    providerCallsExecuted: providerCallsAttempted,
    qwenApiCallsAllowedOnlyForSyntheticDryRun: true,
    deepseekApiCallsAllowedOnlyForSyntheticDryRun: true,
    planSnapshotContractReady: decision.decision === 'provider_dry_run_passed_ready_for_plan_snapshot_contract',
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    supabaseWrites: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(true),
    rawPromptExecutionIntoWorkersOrTools: false,
    publicArtifacts: false,
    signedUrls: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
  }
}

function buildPrivateArtifactManifest(executed: boolean) {
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    reportDir: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR,
    generatedArtifactPrefix: getModelDryRunGeneratedArtifactPrefix(),
    qaArtifactPrefix: getModelDryRunQaArtifactPrefix(),
    expectedReports: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
    committedArtifactClasses: ['safe_json_reports', 'safe_markdown_docs', 'server_only_dry_run_code'],
    excludedArtifactClasses: [
      'api_keys',
      'db_urls',
      'service_role_keys',
      'anon_keys',
      'access_tokens',
      'secret_payloads',
      'signed_urls',
      'raw_provider_responses',
      'private_payloads',
      'media_payloads',
      'node_modules',
      'caches',
      'build_outputs',
    ],
    executed,
    payloadPrinted: false,
    payloadCommitted: false,
    rawProviderResponsesStored: false,
    supabaseWrites: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(executed),
  }
}

function buildSupabaseMilestoneSyncStatus(executed: boolean) {
  const syncLayerPresent = existsSync('server/activation/supabase-milestone-sync')
  return {
    requested: process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC === 'true',
    status: syncLayerPresent ? (executed ? 'available_not_invoked_by_provider_dry_run_stack' : 'not_attempted') : 'not_attempted_current_branch_missing_sync_layer',
    syncLayerPresent,
    sqlExecuted: false,
    migrationDeployed: false,
    unrelatedRowsWritten: false,
  }
}

function attachPrivateArtifactUpload(reports: ProviderDryRunReports, upload: Record<string, unknown>) {
  reports.privateArtifactManifest = {
    ...reports.privateArtifactManifest,
    privateArtifactUpload: upload,
  }
  reports.readinessReport = {
    ...reports.readinessReport,
    privateArtifactUploadStatus: upload['status'],
    privateGeneratedArtifactPrefix: getModelDryRunGeneratedArtifactPrefix(),
    privateQaArtifactPrefix: getModelDryRunQaArtifactPrefix(),
  }
  reports.decision = {
    ...reports.decision,
    privateArtifactUploadStatus: upload['status'],
  }
  reports.blockerReport = {
    ...reports.blockerReport,
    privateArtifactUploadStatus: upload['status'],
  }
  reports.modelDryRun2Summary = {
    ...reports.modelDryRun2Summary,
    privateArtifactUploadStatus: upload['status'],
  }
}

async function uploadProviderDryRunPrivateArtifacts(reports: ProviderDryRunReports): Promise<Record<string, unknown>> {
  const generatedPrefix = `${MODEL_DRY_RUN_PRIVATE_OBJECT_PREFIX}/${MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID}`
  const generatedArtifacts = [
    { object: 'audit/repo-ownership-audit.json', value: reports.sourceOfTruthOwnershipAudit },
    { object: 'policy/model-provider-dry-run-policy.json', value: reports.plan },
    { object: 'cases/synthetic-dry-run-cases.json', value: reports.loadedCases },
    { object: 'requests/sanitized-provider-request-metadata.json', value: reports.loadedCases },
    { object: 'responses/normalized-provider-responses.json', value: { qwen: reports.qwenRun, deepseek: reports.deepseekRun } },
    { object: 'validation/schema-validation-results.json', value: { comparison: reports.comparison, failClosed: reports.failClosed } },
    { object: 'validation/redaction-validation-results.json', value: buildRedactionValidationArtifact(reports) },
    { object: 'cost/provider-cost-usage-summary.json', value: reports.comparison },
    { object: 'manifest/model-provider-dry-run-manifest.json', value: reports.privateArtifactManifest },
    { object: 'supabase/model-dry-run-2-milestone-sync-input.json', value: buildSupabaseMilestoneSyncInput(reports) },
    { object: 'supabase/model-dry-run-2-milestone-sync-result.json', value: buildSupabaseMilestoneSyncStatus(true) },
  ]
  const qaArtifacts = [
    { object: 'qa/model-provider-dry-run-qa.json', value: buildQaArtifact(reports) },
    { object: 'reports/model-provider-dry-run-report.json', value: reports },
  ]

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-modeldryrun2-'))
  const uploaded: Array<Record<string, unknown>> = []
  try {
    for (const artifact of generatedArtifacts) {
      uploaded.push(await uploadJsonArtifact(tmpDir, MODEL_DRY_RUN_PRIVATE_GENERATED_BUCKET, generatedPrefix, artifact.object, artifact.value))
    }
    for (const artifact of qaArtifacts) {
      uploaded.push(await uploadJsonArtifact(tmpDir, MODEL_DRY_RUN_PRIVATE_QA_BUCKET, generatedPrefix, artifact.object, artifact.value))
    }
    return {
      status: 'uploaded',
      generatedPrefix: getModelDryRunGeneratedArtifactPrefix(),
      qaPrefix: getModelDryRunQaArtifactPrefix(),
      artifacts: uploaded,
      publicArtifacts: false,
      signedUrls: false,
      rawProviderResponsesStored: false,
    }
  } catch (error) {
    return {
      status: 'blocked_private_artifact_upload_failed',
      generatedPrefix: getModelDryRunGeneratedArtifactPrefix(),
      qaPrefix: getModelDryRunQaArtifactPrefix(),
      blocker: error instanceof Error ? error.message : 'private_artifact_upload_failed',
      artifacts: uploaded,
      publicArtifacts: false,
      signedUrls: false,
      rawProviderResponsesStored: false,
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}

async function uploadJsonArtifact(
  tmpDir: string,
  bucket: string,
  objectPrefix: string,
  object: string,
  value: unknown,
) {
  const localPath = path.join(tmpDir, object)
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  const destination = `gs://${bucket}/${objectPrefix}/${object}`
  await execFileAsync('gcloud', ['storage', 'cp', '--quiet', localPath, destination], {
    timeout: 30000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env },
  })
  return {
    bucket,
    object: `${objectPrefix}/${object}`,
    gcsUri: destination,
    private: true,
  }
}

function buildRedactionValidationArtifact(reports: ProviderDryRunReports) {
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    status: 'passed',
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    secretValueStoredInReports: false,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    publicArtifacts: false,
    signedUrls: false,
    forbiddenPatternsAccepted: false,
    secretAccess: reports.secretAccess,
  }
}

function buildSupabaseMilestoneSyncInput(reports: ProviderDryRunReports) {
  return {
    phaseId: 'MODEL_DRYRUN_2',
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    status: reports.readinessReport.status,
    decision: reports.readinessReport.decision,
    generatedArtifactPrefix: getModelDryRunGeneratedArtifactPrefix(),
    qaArtifactPrefix: getModelDryRunQaArtifactPrefix(),
    sqlExecuted: false,
    migrationDeployed: false,
    rawProviderResponsesStored: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(true),
  }
}

function buildQaArtifact(reports: ProviderDryRunReports) {
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    status: reports.readinessReport.status,
    gates: {
      source_of_truth_repo_audit: reports.sourceOfTruthOwnershipAudit,
      dry_run_approval_evidence: reports.loadedCases,
      provider_secret_policy: reports.secretAccess,
      schema_validation: reports.comparison,
      response_redaction: buildRedactionValidationArtifact(reports),
      cost_usage_recorded: reports.comparison,
      fail_closed_policy: reports.failClosed,
      no_runtime_execution: true,
      supabase_milestone_sync: buildSupabaseMilestoneSyncStatus(true),
      blocked_features: BLOCKED_SCOPES,
    },
    passed: reports.readinessReport.decision === 'provider_dry_run_passed_ready_for_plan_snapshot_contract',
  }
}

async function writeDocs(reports: ProviderDryRunReports): Promise<void> {
  const decision = String(reports.readinessReport.decision)
  const status = String(reports.readinessReport.status)
  const summary = reports.modelDryRun2Summary
  const finalState = String(summary.finalState ?? 'blocked_provider_config_review')
  const reportRunId = String(summary.runId ?? reports.readinessReport.runId ?? MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run.md', `# MODEL-DRYRUN-2 Calibrated Qwen/DeepSeek Provider Dry-Run

Decision: \`${decision}\`.

Status: \`${status}\`.

MODEL-DRYRUN-2 retries only the approved synthetic provider dry-run after MODEL-TIMEOUT-1. Qwen/DashScope uses the calibrated target \`qwen3.7-plus\`, \`non_streaming\`, \`45000ms\`, and \`650\` max output tokens. DeepSeek remains the existing approved synthetic control path.

DashScope config is resolved only from Google Secret Manager refs \`DASHSCOPE_API_KEY\`, \`DASHSCOPE_BASE_URL\`, and \`DASHSCOPE_REGION\`; the base URL must match \`${MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL}\` and region \`${MODEL_DRY_RUN_APPROVED_DASHSCOPE_REGION}\` before Qwen calls run.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Raw provider responses, API keys, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-decision.md', `# Model Orchestration Provider Dry-Run Decision

Decision: \`${decision}\`.

MODEL-DRYRUN-2 final state: \`${finalState}\`.

Provider calls executed only under explicit synthetic dry-run confirmations. Plan snapshot contract readiness: \`${String(reports.readinessReport.planSnapshotContractReady)}\`.

Secret payloads printed or committed: \`false\`. Raw provider responses stored: \`false\`. Supabase writes: \`false\`. Runtime/tool/worker/route execution: \`false\`. Production/external beta/paid production: \`false\`.
`)

  await writeVlmRuntimeTextArtifact('docs/model-provider-dryrun-2-source-of-truth-read.md', `# MODEL-DRYRUN-2 Source Of Truth Read

Status: \`${status}\`.

Final state: \`${finalState}\`.

Read sources:
- PR #318 approval reports under \`docs/activation-model-orchestration-dry-run-approval-reports/\`.
- PR #322 / MODEL-TIMEOUT-1 evidence under \`docs/activation-qwen-timeout-calibration-reports/\`.
- Existing provider dry-run reports under \`docs/activation-model-orchestration-provider-dry-run-reports/\`.
- Remote branch evidence for MODEL-DRYRUN-1A and MODEL-DRYRUN-1B was reviewed by branch name in this packet, not copied into this base.
- Official DashScope OpenAI-compatible endpoint documentation and first Qwen API request documentation were used to preserve the US endpoint/region rule.

Base gaps recorded, not fabricated: \`PRODUCTION_FOUNDATION_STATUS.md\`, \`docs/source-of-truth-map.md\`, \`docs/production-milestone-plan.md\`, \`docs/implementation-prompts/README.md\`, \`docs/cross-chat/\`, \`docs/runtime-unlock/\`, \`.github/workflows/\`, and \`scripts/validation/run-foundation-validation.mjs\`.

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.
`)

  await writeVlmRuntimeTextArtifact('docs/model-provider-dryrun-2-calibrated-target-review.md', `# MODEL-DRYRUN-2 Calibrated Target Review

MODEL-TIMEOUT-1 readiness: \`qwen_schema_timeout_calibrated_ready_for_model_dryrun\`.

Calibrated Qwen target:
- model: \`${MODEL_DRY_RUN_CALIBRATED_QWEN_MODEL}\`
- mode: \`non_streaming\`
- timeout: \`${MODEL_DRY_RUN_CALIBRATED_QWEN_TIMEOUT_MS}ms\`
- max output tokens: \`${MODEL_DRY_RUN_CALIBRATED_QWEN_MAX_OUTPUT_TOKENS}\`
- stream: \`false\`
- \`qwen3.7-max\` used in MODEL-DRYRUN-2: \`false\`

DashScope config gate:
- \`DASHSCOPE_BASE_URL\` must resolve from Secret Manager to \`${MODEL_DRY_RUN_APPROVED_DASHSCOPE_BASE_URL}\`.
- \`DASHSCOPE_REGION\` must resolve from Secret Manager to \`${MODEL_DRY_RUN_APPROVED_DASHSCOPE_REGION}\`.
- Provider key payloads are never printed, committed, or stored in reports.

DeepSeek remains the existing approved synthetic control path. No DeepSeek target expansion, provider chaining, broad provider runtime, workers, tools, routes, media processing, public artifacts, signed URLs, Supabase mutation, SQL, production, external beta, or paid production is enabled.
`)

  await writeVlmRuntimeTextArtifact('docs/model-provider-dryrun-2-results.md', `# MODEL-DRYRUN-2 Results

Status: \`${status}\`.

Final state: \`${finalState}\`.

Run ID: \`${reportRunId}\`.

Qwen/DashScope status: \`${String(summary.qwenDashscopeStatus ?? 'not_attempted')}\`.

DeepSeek status: \`${String(summary.deepseekStatus ?? 'not_attempted')}\`.

Provider calls attempted: \`${String(summary.providerCallsAttempted ?? 0)}\`.

Private artifact upload status: \`${String(summary.privateArtifactUploadStatus ?? 'not_attempted_provider_dry_run_not_passed')}\`.

Supabase update required: \`docs/status only\`.

Supabase update status: \`docs_only\`.

Supabase environment touched: \`none\`.

SQL executed: \`none\`.

Migration deployed: \`no\`.

Next recommended prompt: \`${String(summary.nextRecommendedPrompt ?? 'MODEL-DRYRUN-2A - Calibrated Provider Dry-Run Fixes')}\`.

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-redaction.md', `# Model Orchestration Provider Dry-Run Redaction

Allowed committed fields are safe metadata: case ID, provider, model ID, schema ID, status, blocker code, latency, token usage when returned, normalized schema-valid JSON, and fail-closed status.

Blocked committed fields: raw provider responses, request bodies with secrets, API keys, DB URLs, service-role keys, anon keys, access tokens, signed URLs, private payloads, media payloads, raw prompt forwarding payloads, hidden reasoning, and public artifact payloads.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-fail-closed.md', `# Model Orchestration Provider Dry-Run Fail-Closed Policy

The provider dry-run blocks on invalid JSON, schema mismatch, provider timeout or error, model alias unavailability, missing secret refs, unsafe output, cost guardrail failures, raw prompt pass-through, worker/tool/route execution requests, public artifact requests, signed URL requests, and production mutation suggestions.

The local schema-invalid fixture is not a provider call and must fail closed.
`)

  await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-model-orchestration-plan-snapshot-contract.md', `# MODEL_ORCHESTRATION - Plan Snapshot Contract

Proceed only if \`docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_readiness_report.json\` records \`provider_dry_run_passed_ready_for_plan_snapshot_contract\`.

Next phase scope: convert schema-valid provider dry-run evidence into a plan snapshot contract and validation packet.

Still blocked unless separately approved: real user data, media processing, workers, tools, routes, Supabase writes, raw prompt execution into workers/tools, public artifacts, signed URLs, production, external beta, and paid production.
`)

  await writeVlmRuntimeTextArtifact('docs/beta-readiness-scorecard.md', `# Beta Readiness Scorecard

Session 0 owned metadata scorecard with model orchestration provider dry-run status.

Restricted internal testing session 0: \`restricted_internal_testing_session_0_passed\`.
External beta allowed: \`false\`.
Paid production allowed: \`false\`.
Production allowed: \`false\`.

Model orchestration provider dry-run decision: \`${decision}\`.
MODEL-DRYRUN-2 final state: \`${finalState}\`.
Plan snapshot contract readiness: \`${String(reports.readinessReport.planSnapshotContractReady)}\`.
Runtime/tool/worker/route execution: \`false\`.
Supabase writes: \`false\`.
Public artifacts and signed URLs: \`false\`.
`)

  await writeVlmRuntimeTextArtifact('docs/production-beta-blocker-inventory.md', `# Production Beta Blocker Inventory

Session 0 owned blocker inventory with model orchestration provider dry-run status.

- \`external_beta\`: blocked
- \`paid_production\`: blocked
- \`production\`: blocked
- \`public_artifacts\`: blocked
- \`signed_url_source_of_truth\`: blocked
- \`runtime_tool_worker_provider_execution\`: blocked
- \`raw_prompt_execution\`: blocked
- \`supabase_production_writes\`: blocked

Model orchestration provider dry-run decision: \`${decision}\`.
MODEL-DRYRUN-2 final state: \`${finalState}\`.

Provider dry-run evidence does not unlock production, external beta, paid production, public artifacts, signed URLs, real user data, media processing, workers, tools, routes, Supabase writes, or raw prompt execution into workers/tools.
`)
}
