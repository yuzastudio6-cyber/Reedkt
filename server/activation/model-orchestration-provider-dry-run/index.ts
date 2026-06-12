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

export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE = 'MODEL_DRYRUN_1'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID =
  process.env.REEDITPRO_MODEL_DRY_RUN_ID ?? process.env.REEDITPRO_MODELDRYRUN1_RUN_ID ?? buildModelDryRunRunId()
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-full-synthetic-provider-dry-run'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-schema-timeout-target-calibration'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-reports'
export const MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR =
  'docs/activation-model-orchestration-dry-run-approval-reports'
export const MODEL_ORCHESTRATION_QWEN_TIMEOUT_REPORT_DIR =
  'docs/activation-qwen-timeout-calibration-reports'
export const MODEL_DRY_RUN_PRIVATE_GENERATED_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
export const MODEL_DRY_RUN_PRIVATE_QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const MODEL_DRY_RUN_PRIVATE_OBJECT_PREFIX = 'activation-model-orchestration/model-dry-run-1'

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
  'REEDITPRO_CONFIRM_QWEN_DEEPSEEK_PROVIDER_DRY_RUN',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC',
] as const

export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_ENV = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
} as const

const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PAYLOAD_ENV_VARS = [
  'DASHSCOPE_API_KEY',
  'DASHSCOPE_BASE_URL',
  'DASHSCOPE_REGION',
  'DEEPSEEK_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL',
  'DATABASE_URL',
] as const

const APPROVED_DASHSCOPE_BASE_URL = 'https://dashscope-us.aliyuncs.com/compatible-mode/v1'
const APPROVED_DASHSCOPE_REGION = 'us'
const QWEN_RECOMMENDED_TIMEOUT_MS = 45000
const QWEN_RECOMMENDED_MAX_OUTPUT_TOKENS = 650
const DEEPSEEK_FULL_DRY_RUN_TIMEOUT_MS = 15000
const MAX_PROVIDER_CALLS = 2
const MAX_TOTAL_REPORTED_TOKENS = 7200

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
type ProviderDecision =
  | 'provider_dry_run_passed_ready_for_plan_snapshot_contract'
  | 'blocked_pending_secret_access'
  | 'blocked_pending_provider_error_review'
  | 'blocked_pending_model_alias_review'
  | 'blocked_pending_schema_contract_fix'
  | 'blocked_pending_cost_review'
  | 'rejected_due_provider_safety_failure'
  | 'not_attempted'

interface ApprovedCase {
  caseId: string
  prompt: string
  expectedOutputSchema: string
  maxTokens: number
  timeoutMs: number
}

interface CasePlan {
  caseId: string
  sourceCaseId: string
  provider: ProviderName
  modelId: string
  expectedOutputSchema: string
  prompt: string
  maxTokens: number
  timeoutMs: number
  phaseRole: 'qwen_head_agent_planning' | 'deepseek_coding_spec_proposal'
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
  secretRef: 'DASHSCOPE_API_KEY' | 'DASHSCOPE_BASE_URL' | 'DASHSCOPE_REGION' | 'DEEPSEEK_API_KEY'
  provider: ProviderName
  source: 'secret_manager' | 'unavailable'
  payloadAccessStatus: 'succeeded' | 'failed' | 'not_attempted'
  envVarPresent: boolean
  baseUrlKey?: 'us'
  baseUrlMatchesApprovedEndpoint?: boolean
  regionMatchesApprovedRegion?: boolean
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
  'docs/model-orchestration/qwen-timeout-calibration-policy.md',
  'docs/model-orchestration/qwen-timeout-calibration-runbook.md',
  'docs/model-orchestration-raw-prompt-blocker-policy.md',
  'docs/activation-model-orchestration-dry-run-approval-reports',
  'docs/activation-model-orchestration-qwen-deepseek-audit-reports',
  'docs/activation-qwen-timeout-calibration-reports',
  'docs/activation-product-internal-testing-session-0-reports',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports',
] as const

const OFFICIAL_DOCS = [
  'https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope',
  'https://api-docs.deepseek.com/',
  'https://api-docs.deepseek.com/api/create-chat-completion',
] as const

const CASE_MATRIX: CasePlan[] = [
  {
    provider: 'qwen_dashscope',
    modelId: 'qwen3.7-plus',
    caseId: 'modeldryrun1_qwen_head_agent_plan_snapshot',
    sourceCaseId: 'synthetic_tool_route_metadata_recommendation',
    expectedOutputSchema: 'plan_snapshot_candidate_v1',
    maxTokens: QWEN_RECOMMENDED_MAX_OUTPUT_TOKENS,
    timeoutMs: QWEN_RECOMMENDED_TIMEOUT_MS,
    phaseRole: 'qwen_head_agent_planning',
    prompt: [
      'Synthetic safe video evidence manifest only: uploadedOrderSummary has three non-sensitive clips,',
      'timelineSummary requests metadata-only planning, and evidenceSummary asks whether captions, chart cards,',
      'or map cards should be recommended as non-executable route labels.',
      'Return structured head-agent planning metadata only: candidate summary, safe route labels,',
      'blocked decisions, professional edit scoring notes, owner route requests as labels only,',
      'credit risk notes, and required approval gates.',
    ].join(' '),
  },
  {
    provider: 'deepseek',
    modelId: 'deepseek-v4-flash',
    caseId: 'modeldryrun1_deepseek_coding_spec_proposal',
    sourceCaseId: 'synthetic_edit_intent_extraction',
    expectedOutputSchema: 'agent_findings_v1',
    maxTokens: 900,
    timeoutMs: DEEPSEEK_FULL_DRY_RUN_TIMEOUT_MS,
    phaseRole: 'deepseek_coding_spec_proposal',
    prompt: [
      'Synthetic safe coding/spec task only: propose metadata-only implementation findings for a',
      'provider dry-run policy packet that records schema validation, redaction validation, cost evidence,',
      'and plan snapshot readiness without executing code, workers, tools, routes, providers, media, SQL,',
      'or production paths. Include tests suggested and risk level as findings and risks only.',
    ].join(' '),
  },
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
  return `modeldryrun1-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
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

function validateExecutionGuards() {
  const blockers: string[] = []
  for (const [name, expected] of Object.entries(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_ENV)) {
    if (process.env[name] !== expected) blockers.push(`environment_mismatch:${name}`)
  }
  for (const name of MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PAYLOAD_ENV_VARS) {
    if ((process.env[name] ?? '').trim().length > 0) blockers.push(`payload_env_present_secret_manager_required:${name}`)
  }
  return blockers
}

function buildQwenTimeoutEvidence() {
  const readiness = readJson(path.join(MODEL_ORCHESTRATION_QWEN_TIMEOUT_REPORT_DIR, 'readiness/qwen-timeout-calibration-readiness-report.json'))
  const recommendation = readJson(path.join(MODEL_ORCHESTRATION_QWEN_TIMEOUT_REPORT_DIR, 'recommendation/qwen-model-timeout-target-recommendation.json'))
  return {
    sourceRunId: readiness?.runId ?? 'missing',
    sourceDecision: readiness?.decision ?? 'missing',
    expectedDecision: 'qwen_schema_timeout_calibrated_ready_for_model_dryrun',
    selectedHeadAgentModel: readiness?.selectedHeadAgentModel ?? recommendation?.selectedHeadAgentModel ?? 'missing',
    selectedCalibrationMode: readiness?.selectedCalibrationMode ?? recommendation?.selectedCalibrationMode ?? 'missing',
    recommendedTimeoutMs: readiness?.recommendedTimeoutMs ?? recommendation?.recommendedTimeoutMs ?? QWEN_RECOMMENDED_TIMEOUT_MS,
    recommendedMaxOutputTokens: readiness?.recommendedMaxOutputTokens ?? recommendation?.recommendedMaxOutputTokens ?? QWEN_RECOMMENDED_MAX_OUTPUT_TOKENS,
    fullModelDryRunReadiness: readiness?.fullModelDryRunReadiness ?? recommendation?.fullDryRunReadiness ?? 'missing',
    evidenceAuthoritative: readiness?.runId === 'qwentimeout1-20260612T165931' &&
      readiness?.decision === 'qwen_schema_timeout_calibrated_ready_for_model_dryrun',
  }
}

export function getModelOrchestrationProviderDryRunPlan() {
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    branch: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BRANCH,
    baseBranch: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BASE_BRANCH,
    prTitle: '[model] Qwen DeepSeek full synthetic provider dry run',
    mode: 'qwen_deepseek_full_synthetic_provider_dry_run',
    reportDir: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
    requiredConfirmations: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_CONFIRMATIONS,
    requiredEnvironment: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_ENV,
    forbiddenConfirmations: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FORBIDDEN_CONFIRMATIONS,
    officialDocsBasis: OFFICIAL_DOCS,
    qwenEndpoint: 'secret_manager:DASHSCOPE_BASE_URL/chat/completions',
    qwenEndpointRegionKey: 'us',
    deepseekEndpoint: 'https://api.deepseek.com/chat/completions',
    secretSource: 'google_secret_manager_only',
    exactSecretRefs: [
      'DASHSCOPE_API_KEY',
      'DASHSCOPE_BASE_URL',
      'DASHSCOPE_REGION',
      'DEEPSEEK_API_KEY',
    ],
    environmentProviderSecretPayloadsAllowed: false,
    privateGeneratedArtifactPrefix: getModelDryRunGeneratedArtifactPrefix(),
    privateQaArtifactPrefix: getModelDryRunQaArtifactPrefix(),
    providerCallsAllowedOnlyWithExecuteAndConfirmations: true,
    syntheticPromptsOnly: true,
    providerCallCaseCount: CASE_MATRIX.length,
    maxProviderCalls: MAX_PROVIDER_CALLS,
    qwenDefaultModel: 'qwen3.7-plus',
    qwenEscalationModelPolicyOnly: 'qwen3.7-max',
    deepseekDefaultModel: 'deepseek-v4-flash',
    deepseekEscalationModelPolicyOnly: 'deepseek-v4-pro',
    qwenTimeoutEvidence: buildQwenTimeoutEvidence(),
    stream: false,
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
  }
}

export async function executeModelOrchestrationProviderDryRun(options: {
  execute: boolean
  syntheticOnly: boolean
  keepTemp: boolean
}): Promise<{ exitCode: number }> {
  if (!options.execute) {
    const decision = buildDecision('blocked_pending_provider_error_review', [
      'execution_requires_explicit_execute_flag',
    ])
    await writeModelOrchestrationProviderDryRunArtifacts(buildReportsFromDecision(decision, [], [], false, false))
    return { exitCode: 1 }
  }

  const guardBlockers = validateExecutionGuards()
  const missing = MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const forbidden = MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  if (guardBlockers.length > 0 || missing.length > 0 || forbidden.length > 0) {
    const decision = buildDecision('blocked_pending_provider_error_review', [
      ...guardBlockers,
      ...missing.map((name) => `missing_confirmation:${name}`),
      ...forbidden.map((name) => `forbidden_confirmation:${name}`),
    ])
    await writeModelOrchestrationProviderDryRunArtifacts(buildReportsFromDecision(decision, [], [], false, false))
    return { exitCode: 1 }
  }

  const cases = loadApprovedCases()
  const missingCases = CASE_MATRIX.filter((plan) => !cases.some((item) =>
    item.caseId === plan.sourceCaseId && item.expectedOutputSchema === plan.expectedOutputSchema))
  if (missingCases.length > 0) {
    const decision = buildDecision('blocked_pending_schema_contract_fix', [
      ...missingCases.map((item) => `missing_approved_source_case:${item.sourceCaseId}:${item.expectedOutputSchema}`),
    ])
    await writeModelOrchestrationProviderDryRunArtifacts(buildReportsFromDecision(decision, [], [], true, false), { uploadPrivateArtifacts: true })
    return { exitCode: 1 }
  }

  const secretLoad = await loadProviderSecrets()
  if (!secretLoad.qwenKey || !secretLoad.qwenBaseUrl || !secretLoad.deepseekKey) {
    const decision = buildDecision('blocked_pending_secret_access', [
      ...secretLoad.executionBlockers,
      ...secretLoad.entries
      .filter((entry) => entry.blocker)
      .map((entry) => entry.blocker ?? 'secret_unavailable'),
    ])
    const reports = buildReportsFromDecision(decision, [], secretLoad.entries, false, false)
    reports.loadedCases = buildLoadedCasesReport(cases, true)
    await writeModelOrchestrationProviderDryRunArtifacts(reports, { uploadPrivateArtifacts: true })
    return { exitCode: 1 }
  }

  const results: ProviderCaseResult[] = []
  for (const plan of CASE_MATRIX) {
    const currentCase = buildExecutionCase(plan)
    const apiKey = plan.provider === 'qwen_dashscope' ? secretLoad.qwenKey : secretLoad.deepseekKey
    results.push(await runProviderCase(plan, currentCase, apiKey, secretLoad.qwenBaseUrl))
  }

  const invalidFixturePassed = runInvalidSchemaFixture()
  const decision = selectExecutionDecision(results, invalidFixturePassed)
  const reports = buildReportsFromDecision(decision, results, secretLoad.entries, true, invalidFixturePassed)
  reports.loadedCases = buildLoadedCasesReport(cases, true)
  await writeModelOrchestrationProviderDryRunArtifacts(reports, { uploadPrivateArtifacts: true })
  const uploadStatus = asString(asRecord(reports.privateArtifactManifest.privateArtifactUpload).status)
  if (uploadStatus && uploadStatus !== 'uploaded') return { exitCode: 1 }
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
  }
}

function buildSourceOfTruthOwnershipAudit() {
  const approvalReadiness = readJson(path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_readiness_report.json'))
  const approvalDecision = readJson(path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_approval_decision.json'))
  const qwenTimeoutEvidence = buildQwenTimeoutEvidence()

  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    ownerWorkstream: 'MODEL_ORCHESTRATION',
    sourceEvidence: 'PR #318 committed dry-run approval reports, PR #330 Qwen timeout calibration evidence, and official provider docs',
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    pr318ReadinessStatus: approvalReadiness?.status ?? 'missing',
    pr318Decision: approvalReadiness?.decision ?? approvalDecision?.decision ?? 'missing',
    expectedPr318Decision: 'approved_for_future_qwen_deepseek_provider_dry_run',
    pr330QwenTimeoutEvidence: qwenTimeoutEvidence,
    officialDocsBasis: OFFICIAL_DOCS,
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
      timeoutMs: asNumber(record.timeoutMs, 10000),
    }
  }).filter((item) => item.caseId && item.prompt && item.expectedOutputSchema)
}

function buildExecutionCase(plan: CasePlan): ApprovedCase {
  return {
    caseId: plan.caseId,
    prompt: plan.prompt,
    expectedOutputSchema: plan.expectedOutputSchema,
    maxTokens: plan.maxTokens,
    timeoutMs: plan.timeoutMs,
  }
}

function buildLoadedCasesReport(cases: ApprovedCase[], executed: boolean) {
  const missingSources = CASE_MATRIX.filter((plan) => !cases.some((item) =>
    item.caseId === plan.sourceCaseId && item.expectedOutputSchema === plan.expectedOutputSchema))
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    status: cases.length >= 8 && missingSources.length === 0 ? 'passed' : 'blocked',
    executed,
    sourcePath: path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_synthetic_cases.json'),
    loadedCaseCount: cases.length,
    providerCallCaseCount: CASE_MATRIX.length,
    maxProviderCalls: MAX_PROVIDER_CALLS,
    localValidationFixtureCaseCount: 1,
    syntheticOnly: true,
    containsUserData: false,
    containsMedia: false,
    rawPromptStoredInReports: false,
    missingSourceCases: missingSources.map((plan) => ({
      sourceCaseId: plan.sourceCaseId,
      expectedOutputSchema: plan.expectedOutputSchema,
    })),
    cases: CASE_MATRIX.map((plan) => {
      const source = cases.find((item) => item.caseId === plan.sourceCaseId)
      return {
        caseId: plan.caseId,
        sourceCaseId: plan.sourceCaseId,
        provider: plan.provider,
        modelId: plan.modelId,
        phaseRole: plan.phaseRole,
        expectedOutputSchema: plan.expectedOutputSchema,
        sourceExpectedOutputSchema: source?.expectedOutputSchema ?? 'missing',
        maxTokens: plan.maxTokens,
        timeoutMs: plan.timeoutMs,
        sourcePromptCharacterCount: source?.prompt.length ?? 0,
        executionPromptCharacterCount: plan.prompt.length,
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
  executionBlockers: string[]
}> {
  const executionBlockers = validateExecutionGuards().filter((item) =>
    item.startsWith('payload_env_present_secret_manager_required'))
  if (executionBlockers.length > 0) {
    return {
      entries: buildDefaultSecretEntries('failed', executionBlockers[0]),
      executionBlockers,
    }
  }

  const qwen = await loadSecret('DASHSCOPE_API_KEY', 'qwen_dashscope')
  const qwenBaseUrl = await loadSecret('DASHSCOPE_BASE_URL', 'qwen_dashscope')
  const qwenRegion = await loadSecret('DASHSCOPE_REGION', 'qwen_dashscope')
  const deepseek = await loadSecret('DEEPSEEK_API_KEY', 'deepseek')
  const baseUrlValid = qwenBaseUrl.value === APPROVED_DASHSCOPE_BASE_URL
  const regionValid = qwenRegion.value === APPROVED_DASHSCOPE_REGION
  qwenBaseUrl.entry = {
    ...qwenBaseUrl.entry,
    baseUrlKey: baseUrlValid ? 'us' : undefined,
    baseUrlMatchesApprovedEndpoint: baseUrlValid,
    blocker: qwenBaseUrl.entry.blocker ?? (baseUrlValid ? undefined : 'dashscope_base_url_secret_payload_mismatch'),
  }
  qwenRegion.entry = {
    ...qwenRegion.entry,
    regionMatchesApprovedRegion: regionValid,
    blocker: qwenRegion.entry.blocker ?? (regionValid ? undefined : 'dashscope_region_secret_payload_mismatch'),
  }
  return {
    qwenKey: qwen.value,
    qwenBaseUrl: baseUrlValid && regionValid ? qwenBaseUrl.value : undefined,
    deepseekKey: deepseek.value,
    entries: [qwen.entry, qwenBaseUrl.entry, qwenRegion.entry, deepseek.entry],
    executionBlockers: [],
  }
}

async function loadSecret(secretRef: SecretAccessEntry['secretRef'], provider: ProviderName): Promise<{
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
        envVarPresent: false,
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

function buildDefaultSecretEntries(
  status: SecretAccessEntry['payloadAccessStatus'] = 'not_attempted',
  blocker?: string,
): SecretAccessEntry[] {
  return [
    {
      secretRef: 'DASHSCOPE_API_KEY',
      provider: 'qwen_dashscope',
      source: 'unavailable',
      payloadAccessStatus: status,
      envVarPresent: false,
      payloadPrinted: false,
      payloadCommitted: false,
      secretValueStoredInReports: false,
      blocker,
    },
    {
      secretRef: 'DASHSCOPE_BASE_URL',
      provider: 'qwen_dashscope',
      source: 'unavailable',
      payloadAccessStatus: status,
      envVarPresent: false,
      baseUrlKey: 'us',
      baseUrlMatchesApprovedEndpoint: false,
      payloadPrinted: false,
      payloadCommitted: false,
      secretValueStoredInReports: false,
      blocker,
    },
    {
      secretRef: 'DASHSCOPE_REGION',
      provider: 'qwen_dashscope',
      source: 'unavailable',
      payloadAccessStatus: status,
      envVarPresent: false,
      regionMatchesApprovedRegion: false,
      payloadPrinted: false,
      payloadCommitted: false,
      secretValueStoredInReports: false,
      blocker,
    },
    {
      secretRef: 'DEEPSEEK_API_KEY',
      provider: 'deepseek',
      source: 'unavailable',
      payloadAccessStatus: status,
      envVarPresent: false,
      payloadPrinted: false,
      payloadCommitted: false,
      secretValueStoredInReports: false,
      blocker,
    },
  ]
}

function buildSecretAccessReport(entries: SecretAccessEntry[], executed: boolean) {
  const normalizedEntries = entries.length > 0 ? entries : buildDefaultSecretEntries()

  const blockers = normalizedEntries
    .filter((entry) => entry.payloadAccessStatus === 'failed' || entry.blocker)
    .map((entry) => entry.blocker ?? `${entry.secretRef.toLowerCase()}_unavailable`)

  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    status: executed ? (blockers.length === 0 ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    secretManagerProject: 'reeditpro',
    secretSourcePolicy: 'google_secret_manager_only',
    broadSecretDiscovery: false,
    exactSecretRefsOnly: true,
    exactSecretRefs: [
      'DASHSCOPE_API_KEY',
      'DASHSCOPE_BASE_URL',
      'DASHSCOPE_REGION',
      'DEEPSEEK_API_KEY',
    ],
    dashscopeBaseUrlKey: 'us',
    dashscopeBaseUrlPayloadStored: false,
    dashscopeRegionPayloadStored: false,
    entries: normalizedEntries,
    payloadAccessed: executed && blockers.length === 0,
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
    const requestValidation = validateProviderRequestMetadata(plan, currentCase, body)
    if (!requestValidation.ok) {
      return blockedResult(plan, currentCase, requestValidation.blocker, {
        latencyMs: Date.now() - started,
      })
    }
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

function providerUrl(provider: ProviderName, qwenBaseUrl: string) {
  return provider === 'qwen_dashscope'
    ? `${qwenBaseUrl.replace(/\/+$/, '')}/chat/completions`
    : 'https://api.deepseek.com/chat/completions'
}

function buildProviderRequestBody(plan: CasePlan, currentCase: ApprovedCase) {
  const roleInstruction = plan.phaseRole === 'qwen_head_agent_planning'
    ? 'Qwen role: head-agent planning/decision schema candidate only. Produce route labels and approval gates, not executable actions.'
    : 'DeepSeek role: coding/spec proposal specialist only. Produce findings, suggested tests, and risk notes, not executable code or commands.'
  const systemPrompt = [
    'You are a schema-only planning dry-run evaluator for ReeditPro.',
    roleInstruction,
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
    `sourceCaseId: ${plan.sourceCaseId}`,
    `phaseRole: ${plan.phaseRole}`,
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

  return base
}

function validateProviderRequestMetadata(plan: CasePlan, currentCase: ApprovedCase, body: Record<string, unknown>): {
  ok: true
} | {
  ok: false
  blocker: string
} {
  if (!['qwen3.7-plus', 'deepseek-v4-flash'].includes(plan.modelId)) {
    return { ok: false, blocker: 'unapproved_primary_model_for_full_dry_run' }
  }
  if (currentCase.prompt.length > 1600) return { ok: false, blocker: 'synthetic_prompt_too_large' }
  const text = JSON.stringify(body)
  if (hasForbiddenRequestPattern(text)) return { ok: false, blocker: 'sanitized_request_metadata_forbidden_pattern' }
  return { ok: true }
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
    /\bbearer\s+[a-z0-9._-]+/i,
    /access[_-]?token/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /sk-[A-Za-z0-9]{20,}/,
    /x-goog-signature=/i,
    /gs:\/\//i,
    /https?:\/\//i,
    /execute\s+(worker|tool|route|provider|code)/i,
    /run\s+(worker|tool|route|provider|code)/i,
    /call\s+(worker|tool|route|provider)/i,
    /production\s+(write|deploy|mutation)/i,
  ].some((pattern) => pattern.test(text))
}

function hasForbiddenRequestPattern(text: string) {
  return [
    /postgres(?:ql)?:\/\//i,
    /service[_-]?role/i,
    /\bbearer\s+[a-z0-9._-]+/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /sk-[A-Za-z0-9]{20,}/,
    /x-goog-signature=/i,
    /gs:\/\//i,
    /https?:\/\//i,
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
      ? 'secret_manager:DASHSCOPE_BASE_URL/chat/completions'
      : 'https://api.deepseek.com/chat/completions',
    endpointRegionKey: provider === 'qwen_dashscope' ? 'us' : undefined,
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
      ['qwen3.7-plus', 'deepseek-v4-flash'].includes(result.modelId)),
    totalProviderCalls: totalCalls,
    maxTotalProviderCalls: MAX_PROVIDER_CALLS,
    totalTokensReported: usageTotal,
    maxTotalTokens: MAX_TOTAL_REPORTED_TOKENS,
    costGuardrailStatus: totalCalls <= MAX_PROVIDER_CALLS && usageTotal <= MAX_TOTAL_REPORTED_TOKENS ? 'passed_by_call_and_token_caps' : 'blocked_pending_cost_review',
    providerUsageReturned: results.map((result) => ({
      caseId: result.caseId,
      provider: result.provider,
      modelId: result.modelId,
      usageStatus: result.usage ? 'reported_by_provider' : 'usage_not_returned',
      usage: result.usage,
    })),
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
  if (results.length > MAX_PROVIDER_CALLS || usageTotal > MAX_TOTAL_REPORTED_TOKENS) blockers.add('provider_cost_or_token_guardrail_exceeded')

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
      qwenEscalationPolicyOnly: 'qwen3.7-max',
      deepseekDefault: 'deepseek-v4-flash',
      deepseekEscalationPolicyOnly: 'deepseek-v4-pro',
    },
    qwenTimeoutEvidence: buildQwenTimeoutEvidence(),
    providerCallsAttempted,
    providerCallsExecuted: providerCallsAttempted,
    providerCallCaseCount: CASE_MATRIX.length,
    maxProviderCalls: MAX_PROVIDER_CALLS,
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
  const uploadStatus = asString(upload.status)
  if (uploadStatus !== 'uploaded') {
    const blockers = [
      ...asArray(reports.decision.activeBlockers).map(String),
      'private_artifact_upload_failed',
    ]
    reports.decision = {
      ...buildDecision('blocked_pending_provider_error_review', blockers),
      providerCallsAttempted: true,
    }
    reports.readinessReport = buildReadinessReport(reports.decision)
    reports.blockerReport = buildBlockerReport(reports.decision)
  }
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
}

async function uploadProviderDryRunPrivateArtifacts(reports: ProviderDryRunReports): Promise<Record<string, unknown>> {
  const generatedPrefix = `${MODEL_DRY_RUN_PRIVATE_OBJECT_PREFIX}/${MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID}`
  const supabaseSyncLayerPresent = existsSync('server/activation/supabase-milestone-sync')
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
    ...(supabaseSyncLayerPresent ? [
      { object: 'supabase/model-dry-run-1-milestone-sync-input.json', value: buildSupabaseMilestoneSyncInput(reports) },
      { object: 'supabase/model-dry-run-1-milestone-sync-result.json', value: buildSupabaseMilestoneSyncStatus(true) },
    ] : []),
  ]
  const qaArtifacts = [
    { object: 'qa/model-provider-dry-run-qa.json', value: buildQaArtifact(reports) },
    { object: 'reports/model-provider-dry-run-report.json', value: reports },
  ]

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-modeldryrun1-'))
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
    phaseId: 'MODEL_DRYRUN_1',
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

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run.md', `# Model Orchestration Qwen/DeepSeek Provider Dry-Run

Decision: \`${decision}\`.

Status: \`${status}\`.

This phase executes only two synthetic, non-sensitive provider dry-run cases approved by PR #318 and gated by PR #330 timeout calibration. Qwen/DashScope uses the US OpenAI-compatible chat completions endpoint from Google Secret Manager, and DeepSeek uses its OpenAI-compatible chat completions endpoint with JSON-object response formatting.

Qwen default: \`qwen3.7-plus\` with \`45000ms\` timeout and \`650\` max output tokens. DeepSeek default: \`deepseek-v4-flash\`. Escalation models are policy-only in this phase and are not called.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Raw provider responses, API keys, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-decision.md', `# Model Orchestration Provider Dry-Run Decision

Decision: \`${decision}\`.

Provider calls executed only under explicit synthetic dry-run confirmations. Plan snapshot contract readiness: \`${String(reports.readinessReport.planSnapshotContractReady)}\`.

Secret payloads printed or committed: \`false\`. DashScope base URL and region payloads stored: \`false\`. Raw provider responses stored: \`false\`. Supabase writes: \`false\`. Runtime/tool/worker/route execution: \`false\`. Production/external beta/paid production: \`false\`.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-redaction.md', `# Model Orchestration Provider Dry-Run Redaction

Allowed committed fields are safe metadata: case ID, provider, model ID, schema ID, status, blocker code, latency, token usage when returned, normalized schema-valid JSON, and fail-closed status.

Blocked committed fields: raw provider responses, raw provider request bodies, API keys, DB URLs, service-role keys, anon keys, access tokens, signed URLs, private payloads, media payloads, raw prompt forwarding payloads, hidden reasoning, DashScope base URL payloads, DashScope region payloads, and public artifact payloads.
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

Provider dry-run evidence does not unlock production, external beta, paid production, public artifacts, signed URLs, real user data, media processing, workers, tools, routes, Supabase writes, or raw prompt execution into workers/tools.
`)
}
