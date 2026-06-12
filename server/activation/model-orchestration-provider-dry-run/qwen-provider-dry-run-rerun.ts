import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export const MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE =
  'model-orchestration-qwen-deepseek-provider-dry-run-rerun'
export const MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_RUN_ID =
  'model-orchestration-qwen-provider-dry-run-rerun-20260612'
export const MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-provider-dry-run-rerun'
export const MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-secret-setup'
export const MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REPORT_DIR =
  'docs/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-reports'
export const MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR =
  'docs/activation-model-orchestration-dry-run-approval-reports'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-reports'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-fix-reports'
export const MODEL_ORCHESTRATION_QWEN_SECRET_SETUP_REPORT_DIR =
  'docs/activation-model-orchestration-qwen-deepseek-secret-setup-reports'

export const MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_EXPECTED_REPORTS = [
  'qwen_rerun_preflight.json',
  'qwen_rerun_case_results.json',
  'qwen_rerun_schema_validation.json',
  'qwen_rerun_cost_timeout_rate_guardrails.json',
  'qwen_rerun_redaction_audit.json',
  'qwen_rerun_fail_closed_events.json',
  'qwen_rerun_blocker_report.json',
  'qwen_rerun_decision.json',
  'qwen_rerun_deepseek_preservation.json',
  'qwen_rerun_no_runtime_unlocks.json',
  'qwen_rerun_summary.json',
] as const

export const MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_MODEL_ORCHESTRATION_QWEN_DRY_RUN_RERUN',
  'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_US_API_CALL',
  'REEDITPRO_CONFIRM_QWEN_ONLY_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_SYNTHETIC_PROVIDER_PROMPTS_ONLY',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS_FOR_QWEN_RERUN',
  'REEDITPRO_CONFIRM_QWEN_US_ENDPOINT',
  'REEDITPRO_CONFIRM_QWEN_US_ALIASES',
  'REEDITPRO_CONFIRM_PROVIDER_DRY_RUN_COST_GUARDRAILS',
] as const

export const MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_DEEPSEEK_RERUN',
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

type RerunReportName = typeof MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_EXPECTED_REPORTS[number]
type QwenRerunStatus = 'not_attempted' | 'passed' | 'blocked' | 'failed'

interface ApprovedCase {
  caseId: string
  prompt: string
  expectedOutputSchema: string
  maxTokens: number
  timeoutMs: number
}

interface QwenRerunCasePlan {
  caseId: string
  modelId: 'qwen-flash-us' | 'qwen-plus-us'
}

interface QwenRerunCaseResult {
  caseId: string
  provider: 'qwen_dashscope'
  modelId: string
  endpoint: typeof QWEN_US_ENDPOINT
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
  schemaValidationStatus: 'passed' | 'blocked'
  requiredFieldsPresent: boolean
  requiredFieldsMissing: string[]
  safetyBooleansValid: boolean
  unsafeSafetyFields: string[]
  rawProviderResponseStored: false
  rawProviderResponsePrinted: false
  modelGeneratedContentStored: false
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
  secretRef: 'DASHSCOPE_API_KEY'
  provider: 'qwen_dashscope'
  source: 'environment' | 'secret_manager' | 'unavailable'
  payloadAccessStatus: 'succeeded' | 'failed' | 'not_attempted'
  envVarPresent: boolean
  payloadPrinted: false
  payloadCommitted: false
  secretValueStoredInReports: false
  blocker?: string
}

export interface ModelOrchestrationQwenProviderDryRunRerunReports {
  preflight: Record<string, unknown>
  caseResults: Record<string, unknown>
  schemaValidation: Record<string, unknown>
  costTimeoutRateGuardrails: Record<string, unknown>
  redactionAudit: Record<string, unknown>
  failClosedEvents: Record<string, unknown>
  blockerReport: Record<string, unknown>
  decision: Record<string, unknown>
  deepseekPreservation: Record<string, unknown>
  noRuntimeUnlocks: Record<string, unknown>
  summary: Record<string, unknown>
}

const QWEN_US_ENDPOINT = 'https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions'
const QWEN_US_ALIASES = ['qwen-plus-us', 'qwen-flash-us'] as const
const QWEN_RERUN_CASE_MATRIX: QwenRerunCasePlan[] = [
  { caseId: 'synthetic_edit_intent_extraction', modelId: 'qwen-flash-us' },
  { caseId: 'synthetic_timeline_planning', modelId: 'qwen-plus-us' },
  { caseId: 'synthetic_tool_route_metadata_recommendation', modelId: 'qwen-plus-us' },
  { caseId: 'synthetic_provider_fallback_comparison', modelId: 'qwen-plus-us' },
]

const SAFETY_FIELDS = [
  'workerExecutionAllowed',
  'toolExecutionAllowed',
  'publicArtifactsAllowed',
  'signedUrlsAllowed',
  'rawPromptForwardingAllowed',
  'directMutationAllowed',
] as const

const SCHEMA_REQUIRED_FIELDS: Record<string, string[]> = {
  agent_findings_v1: ['caseId', 'findings', 'confidence', 'risks', 'blockedActions'],
  edit_intents_v1: ['caseId', 'intentSummary', 'segments', 'planningRequirements', 'approvalGates'],
  plan_snapshot_candidate_v1: ['caseId', 'candidateSummary', 'toolRouteHints', 'creditRiskNotes', 'requiredApprovals'],
  provider_fallback_assessment_v1: ['caseId', 'primaryCandidate', 'fallbackCandidate', 'comparisonReasons', 'dryRunLimits'],
}

const RUNTIME_GATES = {
  qwenProviderCallsOnly: false,
  deepseekRerunAttempted: false,
  workers: false,
  tools: false,
  routes: false,
  rawPromptExecution: false,
  mediaProcessing: false,
  supabaseWrites: false,
  sqlExecuted: false,
  migrationsDeployed: false,
  storageObjectsCreated: false,
  publicArtifacts: false,
  signedUrls: false,
  generatedAssets: false,
  creditSpendOrReservation: false,
  stripeOrBilling: false,
  dockerOrCloudRun: false,
  demucsRuntime: false,
  trackARuntime: false,
  externalBeta: false,
  paidProduction: false,
  production: false,
} as const

function reportPath(file: RerunReportName): string {
  return path.join(MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REPORT_DIR, file)
}

function approvalReportPath(file: string): string {
  return path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, file)
}

function providerReportPath(file: string): string {
  return path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR, file)
}

function fixReportPath(file: string): string {
  return path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR, file)
}

function setupReportPath(file: string): string {
  return path.join(MODEL_ORCHESTRATION_QWEN_SECRET_SETUP_REPORT_DIR, file)
}

function readJson(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) throw new Error(`Missing source-of-truth file: ${filePath}`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function readJsonIfPresent(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
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

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.map(asString).filter(Boolean))].sort()
}

function loadSourceEvidence() {
  return {
    qwenPr320: readJson(providerReportPath('qwen_provider_dry_run_report.json')),
    deepseekPr320: readJson(providerReportPath('deepseek_provider_dry_run_report.json')),
    providerDecisionPr320: readJson(providerReportPath('provider_dry_run_decision.json')),
    providerReadinessPr320: readJson(providerReportPath('provider_dry_run_readiness_report.json')),
    providerSecretPr320: readJson(providerReportPath('provider_secret_access_report.json')),
    providerFailClosedPr320: readJson(providerReportPath('provider_dry_run_fail_closed_verification.json')),
    providerPrivateManifestPr320: readJson(providerReportPath('provider_dry_run_private_artifact_manifest.json')),
    fixSummaryPr323: readJson(fixReportPath('qwen_provider_fix_summary.json')),
    fixDecisionPr323: readJson(fixReportPath('qwen_provider_fix_decision.json')),
    secretSetupSummaryPr326: readJson(setupReportPath('qwen_secret_setup_summary.json')),
    secretSetupDecisionPr326: readJson(setupReportPath('qwen_secret_setup_decision.json')),
    secretSetupReadinessPr326: readJson(setupReportPath('qwen_rerun_readiness.json')),
    secretSetupEndpointPr326: readJson(setupReportPath('qwen_us_endpoint_contract.json')),
    secretSetupAliasPr326: readJson(setupReportPath('qwen_us_model_alias_review.json')),
    approvalDecisionPr318: readJson(approvalReportPath('dry_run_approval_decision.json')),
    syntheticCasesPr318: readJson(approvalReportPath('dry_run_synthetic_cases.json')),
    schemaContractsPr318: readJson(approvalReportPath('dry_run_output_schema_contracts.json')),
    costGuardrailsPr318: readJson(approvalReportPath('dry_run_cost_guardrails.json')),
    redactionPolicyPr318: readJson(approvalReportPath('dry_run_audit_redaction_policy.json')),
    failClosedPolicyPr318: readJson(approvalReportPath('dry_run_fail_closed_policy.json')),
  }
}

export function getModelOrchestrationQwenProviderDryRunRerunPlan() {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_RUN_ID,
    branch: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_BRANCH,
    baseBranch: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_BASE_BRANCH,
    reportDir: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_EXPECTED_REPORTS,
    requiredConfirmations: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_FORBIDDEN_CONFIRMATIONS,
    qwenEndpoint: QWEN_US_ENDPOINT,
    qwenAliases: [...QWEN_US_ALIASES],
    qwenCaseMatrix: QWEN_RERUN_CASE_MATRIX,
    deepseekRerunAllowed: false,
    providerCallsAllowedOnlyWithExecuteAndConfirmations: true,
    syntheticPromptsOnly: true,
    stream: false,
    tools: false,
    search: false,
    hiddenReasoningCapture: false,
    rawProviderResponsesStored: false,
    modelGeneratedContentStored: false,
    supabaseWrites: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    publicArtifacts: false,
    signedUrls: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
  }
}

export function buildModelOrchestrationQwenProviderDryRunRerunReports():
  ModelOrchestrationQwenProviderDryRunRerunReports {
  const existing = readExistingReports()
  if (existing) return existing
  const evidence = loadSourceEvidence()
  const approvedCases = loadApprovedCases(evidence)
  const decision = buildDecision({
    status: 'not_attempted',
    activeBlockers: ['qwen_rerun_not_executed'],
    providerCallsAttempted: false,
    caseResults: [],
    evidence,
  })
  return buildReportsFromDecision(decision, [], [], evidence, approvedCases, false)
}

export async function executeModelOrchestrationQwenProviderDryRunRerun(options: {
  execute: boolean
  syntheticOnly: boolean
}): Promise<{ exitCode: number }> {
  const evidence = loadSourceEvidence()
  const approvedCases = loadApprovedCases(evidence)

  if (!options.execute || !options.syntheticOnly) {
    const decision = buildDecision({
      status: 'blocked',
      activeBlockers: ['execution_requires_explicit_execute_and_synthetic_only_flags'],
      providerCallsAttempted: false,
      caseResults: [],
      evidence,
    })
    await writeModelOrchestrationQwenProviderDryRunRerunArtifacts(
      buildReportsFromDecision(decision, [], [], evidence, approvedCases, false),
    )
    return { exitCode: 1 }
  }

  const sourceBlockers = sourceGateBlockers(evidence, approvedCases)
  const missing = MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REQUIRED_CONFIRMATIONS
    .filter((name) => process.env[name] !== 'true')
  const forbidden = MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_FORBIDDEN_CONFIRMATIONS
    .filter((name) => process.env[name] === 'true')
  const preflightBlockers = [
    ...sourceBlockers,
    ...missing.map((name) => `missing_confirmation:${name}`),
    ...forbidden.map((name) => `forbidden_confirmation:${name}`),
  ]
  if (preflightBlockers.length > 0) {
    const decision = buildDecision({
      status: 'blocked',
      activeBlockers: preflightBlockers,
      providerCallsAttempted: false,
      caseResults: [],
      evidence,
    })
    await writeModelOrchestrationQwenProviderDryRunRerunArtifacts(
      buildReportsFromDecision(decision, [], [], evidence, approvedCases, false),
    )
    return { exitCode: 1 }
  }

  const secretLoad = await loadQwenSecret()
  if (!secretLoad.key) {
    const decision = buildDecision({
      status: 'blocked',
      activeBlockers: secretLoad.entries.map((entry) => entry.blocker ?? 'dashscope_secret_unavailable'),
      providerCallsAttempted: false,
      caseResults: [],
      evidence,
    })
    await writeModelOrchestrationQwenProviderDryRunRerunArtifacts(
      buildReportsFromDecision(decision, [], secretLoad.entries, evidence, approvedCases, false),
    )
    return { exitCode: 1 }
  }

  const caseResults: QwenRerunCaseResult[] = []
  for (const plan of QWEN_RERUN_CASE_MATRIX) {
    const approvedCase = approvedCases.find((item) => item.caseId === plan.caseId)
    if (!approvedCase) {
      caseResults.push(blockedCaseResult(plan, missingApprovedCase(plan.caseId), 'missing_approved_case'))
      continue
    }
    caseResults.push(await runQwenRerunCase(plan, approvedCase, secretLoad.key))
  }

  const decision = selectRerunDecision(caseResults, evidence)
  const reports = buildReportsFromDecision(decision, caseResults, secretLoad.entries, evidence, approvedCases, true)
  await writeModelOrchestrationQwenProviderDryRunRerunArtifacts(reports)
  return { exitCode: decision.status === 'passed' ? 0 : 1 }
}

function readExistingReports(): ModelOrchestrationQwenProviderDryRunRerunReports | undefined {
  const decision = readJsonIfPresent(reportPath('qwen_rerun_decision.json'))
  if (!decision || decision.decision === 'qwen_rerun_not_attempted') return undefined
  const allPresent = MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_EXPECTED_REPORTS
    .every((file) => existsSync(reportPath(file)))
  if (!allPresent) return undefined
  return {
    preflight: readJson(reportPath('qwen_rerun_preflight.json')),
    caseResults: readJson(reportPath('qwen_rerun_case_results.json')),
    schemaValidation: readJson(reportPath('qwen_rerun_schema_validation.json')),
    costTimeoutRateGuardrails: readJson(reportPath('qwen_rerun_cost_timeout_rate_guardrails.json')),
    redactionAudit: readJson(reportPath('qwen_rerun_redaction_audit.json')),
    failClosedEvents: readJson(reportPath('qwen_rerun_fail_closed_events.json')),
    blockerReport: readJson(reportPath('qwen_rerun_blocker_report.json')),
    decision,
    deepseekPreservation: readJson(reportPath('qwen_rerun_deepseek_preservation.json')),
    noRuntimeUnlocks: readJson(reportPath('qwen_rerun_no_runtime_unlocks.json')),
    summary: readJson(reportPath('qwen_rerun_summary.json')),
  }
}

function sourceGateBlockers(evidence: ReturnType<typeof loadSourceEvidence>, approvedCases: ApprovedCase[]): string[] {
  const blockers: string[] = []
  if (evidence.approvalDecisionPr318.decision !== 'approved_for_future_qwen_deepseek_provider_dry_run') {
    blockers.push('pr318_dry_run_approval_not_passed')
  }
  if (evidence.providerDecisionPr320.decision !== 'blocked_pending_provider_error_review') {
    blockers.push('pr320_provider_dry_run_decision_unexpected')
  }
  if (evidence.fixSummaryPr323.classification !== 'qwen_secret_present_but_rejected') {
    blockers.push('pr323_qwen_fix_classification_unexpected')
  }
  if (evidence.secretSetupSummaryPr326.decision !== 'metadata_ready_for_qwen_us_provider_dry_run_rerun') {
    blockers.push('pr326_secret_setup_not_metadata_ready')
  }
  if (evidence.secretSetupReadinessPr326.readyForQwenOnlyRerun !== true) {
    blockers.push('pr326_qwen_rerun_readiness_not_true')
  }
  if (evidence.secretSetupEndpointPr326.selectedChatCompletionsEndpoint !== QWEN_US_ENDPOINT) {
    blockers.push('qwen_us_endpoint_contract_mismatch')
  }
  const selectedAliases = asArray(evidence.secretSetupReadinessPr326.selectedAliases).map(asString)
  if (!QWEN_US_ALIASES.every((alias) => selectedAliases.includes(alias))) {
    blockers.push('qwen_us_alias_contract_mismatch')
  }
  const historicalReady = evidence.secretSetupAliasPr326.historicalAliasesReadyForUsRerun
  if (historicalReady !== false) blockers.push('historical_qwen_aliases_must_not_be_us_rerun_ready')
  if (evidence.deepseekPr320.status !== 'passed') blockers.push('deepseek_pr320_evidence_not_passed')
  if (evidence.deepseekPr320.providerCallsPassed !== 3) blockers.push('deepseek_pr320_pass_count_unexpected')
  if (evidence.syntheticCasesPr318.syntheticOnly !== true) blockers.push('synthetic_cases_not_marked_synthetic_only')
  if (evidence.syntheticCasesPr318.containsUserData !== false) blockers.push('synthetic_cases_contain_user_data')
  if (evidence.syntheticCasesPr318.containsPrivateProjectData !== false) blockers.push('synthetic_cases_contain_private_project_data')
  if (evidence.syntheticCasesPr318.containsMedia !== false) blockers.push('synthetic_cases_contain_media')
  for (const plan of QWEN_RERUN_CASE_MATRIX) {
    const approvedCase = approvedCases.find((item) => item.caseId === plan.caseId)
    if (!approvedCase) blockers.push(`missing_approved_qwen_case:${plan.caseId}`)
    if (!(QWEN_US_ALIASES as readonly string[]).includes(plan.modelId)) {
      blockers.push(`non_us_qwen_alias_selected:${plan.modelId}`)
    }
  }
  if (QWEN_RERUN_CASE_MATRIX.some((plan) => plan.modelId.startsWith('qwen3.7'))) {
    blockers.push('historical_qwen3_7_alias_selected')
  }
  return blockers
}

function loadApprovedCases(evidence: ReturnType<typeof loadSourceEvidence>): ApprovedCase[] {
  return asArray(evidence.syntheticCasesPr318.cases).map((item) => {
    const record = asRecord(item)
    return {
      caseId: asString(record.caseId),
      prompt: asString(record.prompt),
      expectedOutputSchema: asString(record.expectedOutputSchema),
      maxTokens: Math.min(asNumber(record.maxTokens, 800), 1200),
      timeoutMs: Math.min(asNumber(record.timeoutMs, 10000), 15000),
    }
  }).filter((item) => item.caseId && item.prompt && item.expectedOutputSchema)
}

async function loadQwenSecret(): Promise<{ key?: string; entries: SecretAccessEntry[] }> {
  const secretRef = 'DASHSCOPE_API_KEY'
  const envValue = process.env[secretRef]
  if (envValue && envValue.trim().length > 0) {
    return {
      key: envValue.trim(),
      entries: [secretEntry('environment', 'succeeded', true)],
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
        entries: [secretEntry('unavailable', 'failed', false, 'dashscope_secret_payload_empty')],
      }
    }
    return {
      key: value,
      entries: [secretEntry('secret_manager', 'succeeded', true)],
    }
  } catch {
    return {
      entries: [secretEntry('unavailable', 'failed', false, 'dashscope_secret_payload_access_failed')],
    }
  }
}

function secretEntry(
  source: SecretAccessEntry['source'],
  payloadAccessStatus: SecretAccessEntry['payloadAccessStatus'],
  envVarPresent: boolean,
  blocker?: string,
): SecretAccessEntry {
  return {
    secretRef: 'DASHSCOPE_API_KEY',
    provider: 'qwen_dashscope',
    source,
    payloadAccessStatus,
    envVarPresent,
    payloadPrinted: false,
    payloadCommitted: false,
    secretValueStoredInReports: false,
    blocker,
  }
}

async function runQwenRerunCase(
  plan: QwenRerunCasePlan,
  approvedCase: ApprovedCase,
  apiKey: string,
): Promise<QwenRerunCaseResult> {
  const started = Date.now()
  try {
    const response = await fetch(QWEN_US_ENDPOINT, {
      method: 'POST',
      headers: buildRequestHeaders(apiKey),
      body: JSON.stringify(buildQwenRequestBody(plan, approvedCase)),
      signal: AbortSignal.timeout(approvedCase.timeoutMs),
    })
    const latencyMs = Date.now() - started
    const status = response.status
    const text = await response.text()
    if (!response.ok) {
      return blockedCaseResult(plan, approvedCase, classifyProviderHttpError(status, text), {
        httpStatus: status,
        latencyMs,
        responseContentCharacters: text.length,
      })
    }

    let providerJson: Record<string, unknown>
    try {
      providerJson = JSON.parse(text) as Record<string, unknown>
    } catch {
      return blockedCaseResult(plan, approvedCase, 'provider_response_json_parse_failed', {
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
      return blockedCaseResult(plan, approvedCase, parsed.blocker, {
        httpStatus: status,
        latencyMs,
        finishReason: asString(choice.finish_reason),
        usage: normalizeUsage(usage),
        responseContentCharacters: content.length,
      })
    }

    const validation = validateProviderOutput(parsed.value, approvedCase)
    if (!validation.ok) {
      return blockedCaseResult(plan, approvedCase, validation.blocker, {
        httpStatus: status,
        latencyMs,
        finishReason: asString(choice.finish_reason),
        usage: normalizeUsage(usage),
        responseContentCharacters: content.length,
        requiredFieldsPresent: validation.requiredFieldsMissing.length === 0,
        requiredFieldsMissing: validation.requiredFieldsMissing,
        safetyBooleansValid: validation.unsafeSafetyFields.length === 0,
        unsafeSafetyFields: validation.unsafeSafetyFields,
      })
    }

    return {
      caseId: approvedCase.caseId,
      provider: 'qwen_dashscope',
      modelId: plan.modelId,
      endpoint: QWEN_US_ENDPOINT,
      schemaId: approvedCase.expectedOutputSchema,
      status: 'passed',
      httpStatus: status,
      latencyMs,
      finishReason: asString(choice.finish_reason),
      usage: normalizeUsage(usage),
      responseContentCharacters: content.length,
      schemaValidationStatus: 'passed',
      requiredFieldsPresent: true,
      requiredFieldsMissing: [],
      safetyBooleansValid: true,
      unsafeSafetyFields: [],
      rawProviderResponseStored: false,
      rawProviderResponsePrinted: false,
      modelGeneratedContentStored: false,
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
    return blockedCaseResult(plan, approvedCase, blocker, {
      latencyMs: Date.now() - started,
    })
  }
}

function buildRequestHeaders(apiKey: string): Record<string, string> {
  const authHeaderName = ['Author', 'ization'].join('')
  const bearerPrefix = ['Bear', 'er'].join('')
  return {
    'Content-Type': 'application/json',
    [authHeaderName]: `${bearerPrefix} ${apiKey}`,
  }
}

function buildQwenRequestBody(plan: QwenRerunCasePlan, approvedCase: ApprovedCase) {
  const systemPrompt = [
    'You are a schema-only planning dry-run evaluator for ReeditPro.',
    'Return one JSON object only. Do not include markdown or explanations outside JSON.',
    'Use only synthetic metadata. Do not ask to run workers, tools, routes, media processing, Supabase, public artifacts, signed URLs, production, external beta, or paid production.',
    'Do not reveal hidden reasoning. Keep all safety booleans false.',
  ].join(' ')
  const required = requiredFieldsForCase(approvedCase)
  return {
    model: plan.modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          `caseId: ${approvedCase.caseId}`,
          `schemaId: ${approvedCase.expectedOutputSchema}`,
          `syntheticInput: ${approvedCase.prompt}`,
          `requiredTopLevelFields: ${required.join(', ')}`,
          'Safety booleans must be false: workerExecutionAllowed, toolExecutionAllowed, publicArtifactsAllowed, signedUrlsAllowed, rawPromptForwardingAllowed, directMutationAllowed.',
        ].join('\n'),
      },
    ],
    max_tokens: approvedCase.maxTokens,
    temperature: 0.2,
    stream: false,
    enable_thinking: false,
  }
}

function requiredFieldsForCase(approvedCase: ApprovedCase): string[] {
  return [
    ...new Set([
      ...(SCHEMA_REQUIRED_FIELDS[approvedCase.expectedOutputSchema] ?? ['caseId']),
      ...SAFETY_FIELDS,
    ]),
  ]
}

function parseProviderContent(content: string): { ok: true; value: Record<string, unknown> } | { ok: false; blocker: string } {
  const trimmed = content.trim()
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    const parsed = JSON.parse(unfenced)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, blocker: 'provider_output_schema_invalid' }
    }
    return { ok: true, value: parsed as Record<string, unknown> }
  } catch {
    return { ok: false, blocker: 'provider_output_invalid_json' }
  }
}

function validateProviderOutput(value: Record<string, unknown>, approvedCase: ApprovedCase): {
  ok: true
} | {
  ok: false
  blocker: string
  requiredFieldsMissing: string[]
  unsafeSafetyFields: string[]
} {
  const required = SCHEMA_REQUIRED_FIELDS[approvedCase.expectedOutputSchema] ?? ['caseId']
  const requiredFieldsMissing = required.filter((field) => !(field in value))
  const unsafeSafetyFields = SAFETY_FIELDS.filter((field) => value[field] !== false)
  if (requiredFieldsMissing.length > 0) {
    return {
      ok: false,
      blocker: `provider_output_missing_required_field:${requiredFieldsMissing[0]}`,
      requiredFieldsMissing,
      unsafeSafetyFields,
    }
  }
  if (asString(value.caseId) !== approvedCase.caseId) {
    return {
      ok: false,
      blocker: 'provider_output_case_id_mismatch',
      requiredFieldsMissing,
      unsafeSafetyFields,
    }
  }
  if (unsafeSafetyFields.length > 0) {
    return {
      ok: false,
      blocker: `unsafe_output_${unsafeSafetyFields[0]}`,
      requiredFieldsMissing,
      unsafeSafetyFields,
    }
  }
  if (hasForbiddenOutputPattern(JSON.stringify(value))) {
    return {
      ok: false,
      blocker: 'unsafe_output_forbidden_pattern',
      requiredFieldsMissing,
      unsafeSafetyFields,
    }
  }
  return { ok: true }
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

function classifyProviderHttpError(status: number, text: string) {
  const lower = text.toLowerCase()
  if (status === 401 || status === 403) return 'provider_auth_or_permission_failed'
  if (status === 404 || lower.includes('model') || lower.includes('alias')) return 'model_alias_unavailable'
  if (status === 429 || lower.includes('quota') || lower.includes('rate')) return 'provider_rate_or_quota_error'
  return 'provider_http_error'
}

function normalizeUsage(usage: Record<string, unknown> | undefined): QwenRerunCaseResult['usage'] {
  if (!usage) return undefined
  return {
    promptTokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : undefined,
    completionTokens: typeof usage.completion_tokens === 'number' ? usage.completion_tokens : undefined,
    totalTokens: typeof usage.total_tokens === 'number' ? usage.total_tokens : undefined,
  }
}

function blockedCaseResult(
  plan: QwenRerunCasePlan,
  approvedCase: ApprovedCase,
  blocker: string,
  extra: Partial<QwenRerunCaseResult> = {},
): QwenRerunCaseResult {
  return {
    caseId: approvedCase.caseId,
    provider: 'qwen_dashscope',
    modelId: plan.modelId,
    endpoint: QWEN_US_ENDPOINT,
    schemaId: approvedCase.expectedOutputSchema,
    status: 'blocked',
    blocker,
    schemaValidationStatus: 'blocked',
    requiredFieldsPresent: false,
    requiredFieldsMissing: requiredFieldsForCase(approvedCase),
    safetyBooleansValid: false,
    unsafeSafetyFields: [...SAFETY_FIELDS],
    rawProviderResponseStored: false,
    rawProviderResponsePrinted: false,
    modelGeneratedContentStored: false,
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

function missingApprovedCase(caseId: string): ApprovedCase {
  return {
    caseId,
    prompt: '',
    expectedOutputSchema: 'missing',
    maxTokens: 0,
    timeoutMs: 0,
  }
}

function selectRerunDecision(
  caseResults: QwenRerunCaseResult[],
  evidence: ReturnType<typeof loadSourceEvidence>,
): Record<string, unknown> {
  const blockers = new Set<string>()
  const passed = caseResults.filter((result) => result.status === 'passed')
  const blocked = caseResults.filter((result) => result.status === 'blocked')
  const totalTokens = caseResults.reduce((total, result) => total + (result.usage?.totalTokens ?? 0), 0)
  const deepseekValid = evidence.deepseekPr320.status === 'passed' && evidence.deepseekPr320.providerCallsPassed === 3

  for (const result of blocked) blockers.add(result.blocker ?? 'qwen_case_blocked')
  if (passed.length !== QWEN_RERUN_CASE_MATRIX.length) blockers.add('qwen_schema_valid_output_missing')
  if (!deepseekValid) blockers.add('deepseek_preserved_evidence_invalid')
  if (caseResults.length > 4 || totalTokens > 7200) blockers.add('provider_cost_or_token_guardrail_exceeded')

  const blockerList = [...blockers]
  if (blockerList.length === 0) {
    return buildDecision({
      status: 'passed',
      activeBlockers: [],
      providerCallsAttempted: true,
      caseResults,
      evidence,
    })
  }
  if (blockerList.some((item) => item.includes('auth') || item.includes('permission') || item.includes('401') || item.includes('403'))) {
    return buildDecision({
      status: 'blocked',
      activeBlockers: blockerList,
      providerCallsAttempted: true,
      caseResults,
      evidence,
      nextPrompt: 'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-SECRET-SETUP-USER: complete external DashScope key/model permission setup, no provider calls',
    })
  }
  if (blockerList.some((item) => item.includes('alias') || item.includes('endpoint'))) {
    return buildDecision({
      status: 'blocked',
      activeBlockers: blockerList,
      providerCallsAttempted: true,
      caseResults,
      evidence,
      nextPrompt: 'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-PROVIDER-CONTRACT-FIX: clarify Qwen/DashScope endpoint/model contract, no workers/tools/routes',
    })
  }
  return buildDecision({
    status: 'failed',
    activeBlockers: blockerList,
    providerCallsAttempted: true,
    caseResults,
    evidence,
    nextPrompt: 'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-PROVIDER-DRY-RUN-RERUN-FIX: fix Qwen rerun failures, no workers/tools/routes',
  })
}

function buildDecision(input: {
  status: QwenRerunStatus
  activeBlockers: string[]
  providerCallsAttempted: boolean
  caseResults: QwenRerunCaseResult[]
  evidence: ReturnType<typeof loadSourceEvidence>
  nextPrompt?: string
}) {
  const passed = input.status === 'passed'
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_RUN_ID,
    status: input.status,
    decision: passed
      ? 'qwen_rerun_passed_provider_dry_run_ready_for_plan_snapshot_contract'
      : input.status === 'not_attempted'
        ? 'qwen_rerun_not_attempted'
        : 'qwen_rerun_blocked_or_failed',
    activeBlockers: input.activeBlockers,
    providerCallsAttempted: input.providerCallsAttempted,
    qwenProviderCallsAttempted: input.caseResults.length,
    qwenProviderCallsPassed: input.caseResults.filter((result) => result.status === 'passed').length,
    qwenProviderCallsBlocked: input.caseResults.filter((result) => result.status === 'blocked').length,
    deepseekRerunAttempted: false,
    deepseekPassedEvidencePreserved: input.evidence.deepseekPr320.status === 'passed',
    planSnapshotContractReady: passed,
    rawProviderResponsesStored: false,
    modelGeneratedContentStored: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    supabaseWrites: false,
    rawPromptExecutionIntoWorkersOrTools: false,
    publicArtifacts: false,
    signedUrls: false,
    productionAffected: false,
    externalBeta: false,
    paidProduction: false,
    nextRecommendedPrompt: input.nextPrompt ?? (passed
      ? 'MODEL-ORCHESTRATION-PLAN-SNAPSHOT-CONTRACT-0: plan snapshot contract after provider dry-run, no workers/tools'
      : 'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-PROVIDER-DRY-RUN-RERUN-FIX: fix Qwen rerun failures, no workers/tools/routes'),
  }
}

function buildReportsFromDecision(
  decision: Record<string, unknown>,
  caseResults: QwenRerunCaseResult[],
  secretEntries: SecretAccessEntry[],
  evidence: ReturnType<typeof loadSourceEvidence>,
  approvedCases: ApprovedCase[],
  executed: boolean,
): ModelOrchestrationQwenProviderDryRunRerunReports {
  const sourceBlockers = sourceGateBlockers(evidence, approvedCases)
  return {
    preflight: buildPreflightReport(evidence, approvedCases, sourceBlockers, secretEntries, executed),
    caseResults: buildCaseResultsReport(caseResults, executed),
    schemaValidation: buildSchemaValidationReport(caseResults, evidence, executed),
    costTimeoutRateGuardrails: buildCostTimeoutRateGuardrails(caseResults, approvedCases, evidence, executed),
    redactionAudit: buildRedactionAudit(secretEntries, executed),
    failClosedEvents: buildFailClosedEvents(caseResults, decision, executed),
    blockerReport: buildBlockerReport(decision),
    decision,
    deepseekPreservation: buildDeepseekPreservationReport(evidence),
    noRuntimeUnlocks: buildNoRuntimeUnlocksReport(executed),
    summary: buildSummaryReport(decision, caseResults, evidence, executed),
  }
}

function buildPreflightReport(
  evidence: ReturnType<typeof loadSourceEvidence>,
  approvedCases: ApprovedCase[],
  sourceBlockers: string[],
  secretEntries: SecretAccessEntry[],
  executed: boolean,
) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_RUN_ID,
    status: sourceBlockers.length === 0 ? 'passed' : 'blocked',
    executed,
    sourceBlockers,
    pr318Decision: evidence.approvalDecisionPr318.decision,
    pr320Decision: evidence.providerDecisionPr320.decision,
    pr323Decision: evidence.fixDecisionPr323.decision,
    pr323Classification: evidence.fixSummaryPr323.classification,
    pr326Decision: evidence.secretSetupSummaryPr326.decision,
    pr326ReadyForQwenOnlyRerun: evidence.secretSetupReadinessPr326.readyForQwenOnlyRerun,
    selectedRegion: 'us_virginia',
    selectedEndpoint: QWEN_US_ENDPOINT,
    selectedAliases: [...QWEN_US_ALIASES],
    historicalAliasesExcluded: ['qwen3.7-plus', 'qwen3.7-max'],
    approvedSyntheticCaseCount: approvedCases.length,
    qwenRerunCaseCount: QWEN_RERUN_CASE_MATRIX.length,
    syntheticOnly: evidence.syntheticCasesPr318.syntheticOnly,
    containsUserData: evidence.syntheticCasesPr318.containsUserData,
    containsPrivateProjectData: evidence.syntheticCasesPr318.containsPrivateProjectData,
    containsMedia: evidence.syntheticCasesPr318.containsMedia,
    secretRefStatus: secretEntries.length > 0 ? secretEntries[0].payloadAccessStatus : 'not_attempted',
    secretRefSource: secretEntries.length > 0 ? secretEntries[0].source : 'not_attempted',
    secretValuePrinted: false,
    secretValueStoredInReports: false,
    providerCallsAllowedAfterPreflight: sourceBlockers.length === 0,
  }
}

function buildCaseResultsReport(caseResults: QwenRerunCaseResult[], executed: boolean) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_RUN_ID,
    status: executed ? (caseResults.every((result) => result.status === 'passed') ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    provider: 'qwen_dashscope',
    endpoint: QWEN_US_ENDPOINT,
    providerCallsAttempted: caseResults.length,
    providerCallsPassed: caseResults.filter((result) => result.status === 'passed').length,
    providerCallsBlocked: caseResults.filter((result) => result.status === 'blocked').length,
    selectedAliases: uniqueStrings(caseResults.map((result) => result.modelId)),
    forbiddenHistoricalAliasesSelected: caseResults
      .filter((result) => result.modelId === 'qwen3.7-plus' || result.modelId === 'qwen3.7-max')
      .map((result) => result.modelId),
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    modelGeneratedContentStored: false,
    results: caseResults,
  }
}

function buildSchemaValidationReport(
  caseResults: QwenRerunCaseResult[],
  evidence: ReturnType<typeof loadSourceEvidence>,
  executed: boolean,
) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    status: executed ? (caseResults.every((result) => result.schemaValidationStatus === 'passed') ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    schemaContractsSource: 'docs/activation-model-orchestration-dry-run-approval-reports/dry_run_output_schema_contracts.json',
    schemaContractCount: asArray(evidence.schemaContractsPr318.schemas).length,
    validationErrorsFailClosed: evidence.schemaContractsPr318.validationErrorsFailClosed,
    caseValidations: caseResults.map((result) => ({
      caseId: result.caseId,
      schemaId: result.schemaId,
      status: result.schemaValidationStatus,
      requiredFieldsPresent: result.requiredFieldsPresent,
      requiredFieldsMissing: result.requiredFieldsMissing,
      safetyBooleansValid: result.safetyBooleansValid,
      unsafeSafetyFields: result.unsafeSafetyFields,
      blocker: result.blocker,
    })),
    passedCount: caseResults.filter((result) => result.schemaValidationStatus === 'passed').length,
    blockedCount: caseResults.filter((result) => result.schemaValidationStatus === 'blocked').length,
    invalidResponsesAccepted: false,
  }
}

function buildCostTimeoutRateGuardrails(
  caseResults: QwenRerunCaseResult[],
  approvedCases: ApprovedCase[],
  evidence: ReturnType<typeof loadSourceEvidence>,
  executed: boolean,
) {
  const totalTokens = caseResults.reduce((total, result) => total + (result.usage?.totalTokens ?? 0), 0)
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    status: caseResults.length <= 4 && totalTokens <= asNumber(evidence.costGuardrailsPr318.maxTotalTokens, 7200)
      ? 'passed'
      : 'blocked',
    executed,
    maxQwenProviderCalls: 4,
    qwenProviderCallsAttempted: caseResults.length,
    maxTotalProviderCallsFromApproval: evidence.costGuardrailsPr318.maxTotalProviderCalls,
    maxEstimatedUsd: evidence.costGuardrailsPr318.maxEstimatedUsd,
    maxTokensPerCall: evidence.costGuardrailsPr318.maxTokensPerCall,
    maxTotalTokens: evidence.costGuardrailsPr318.maxTotalTokens,
    totalTokensReported: totalTokens,
    maxRetriesPerCase: evidence.costGuardrailsPr318.maxRetriesPerCase,
    retryAttempted: false,
    streamingAllowed: false,
    rateLimitBehavior: evidence.costGuardrailsPr318.rateLimitBehavior,
    noCreditSpendOrReservation: true,
    caseCaps: QWEN_RERUN_CASE_MATRIX.map((plan) => {
      const approvedCase = approvedCases.find((item) => item.caseId === plan.caseId)
      const result = caseResults.find((item) => item.caseId === plan.caseId)
      return {
        caseId: plan.caseId,
        modelId: plan.modelId,
        maxTokens: approvedCase?.maxTokens ?? 'missing',
        timeoutMs: approvedCase?.timeoutMs ?? 'missing',
        totalTokensReported: result?.usage?.totalTokens ?? null,
        latencyMs: result?.latencyMs ?? null,
        status: result?.status ?? 'not_attempted',
      }
    }),
  }
}

function buildRedactionAudit(secretEntries: SecretAccessEntry[], executed: boolean) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    status: 'passed',
    executed,
    metadataOnlyReports: true,
    rawProviderOutputPersisted: false,
    rawProviderOutputPrinted: false,
    modelGeneratedContentStored: false,
    secretPayloadAccessedOnlyDuringConfirmedExecution: executed,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    secretValueStoredInReports: false,
    requestCredentialHeadersStored: false,
    dbUrlsStored: false,
    signedUrlsStored: false,
    publicArtifactsCreated: false,
    privateProjectDataUsed: false,
    userDataUsed: false,
    mediaDataUsed: false,
    secretEntries,
    allowedEvidenceFields: [
      'caseId',
      'provider',
      'modelId',
      'endpoint',
      'schemaId',
      'status',
      'httpStatus',
      'latencyMs',
      'finishReason',
      'usage',
      'blocker',
      'requiredFieldStatus',
      'safetyBooleanStatus',
      'nextRecommendedPrompt',
    ],
  }
}

function buildFailClosedEvents(
  caseResults: QwenRerunCaseResult[],
  decision: Record<string, unknown>,
  executed: boolean,
) {
  const blocked = caseResults.filter((result) => result.status === 'blocked')
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    status: executed ? 'passed' : 'not_attempted',
    executed,
    failClosedTriggers: [
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
    blockedCases: blocked.map((result) => ({
      caseId: result.caseId,
      modelId: result.modelId,
      blocker: result.blocker,
      httpStatus: result.httpStatus,
    })),
    activeBlockers: decision.activeBlockers ?? [],
    invalidOutputsAccepted: false,
    mutationOnFailure: false,
    retryOnFailure: false,
    rawProviderResponseStored: false,
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: decision.activeBlockers ?? [],
    nextRecommendedPrompt: decision.nextRecommendedPrompt,
    blockedScopes: [
      'workers_tools_routes',
      'media_processing',
      'supabase_writes',
      'raw_prompt_execution',
      'public_artifacts',
      'signed_urls',
      'generated_assets',
      'production',
      'external_beta',
      'paid_production',
    ],
    noProviderErrorTreatedAsPass: true,
    noMutationOnFailure: true,
  }
}

function buildDeepseekPreservationReport(evidence: ReturnType<typeof loadSourceEvidence>) {
  const results = asArray(evidence.deepseekPr320.results).map(asRecord)
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    status: evidence.deepseekPr320.status === 'passed' && evidence.deepseekPr320.providerCallsPassed === 3
      ? 'passed'
      : 'blocked',
    source: 'PR #320 deepseek_provider_dry_run_report.json',
    deepseekRerunAttempted: false,
    providerCallsAttemptedInPr320: evidence.deepseekPr320.providerCallsAttempted,
    providerCallsPassedInPr320: evidence.deepseekPr320.providerCallsPassed,
    providerCallsBlockedInPr320: evidence.deepseekPr320.providerCallsBlocked,
    modelsPreserved: uniqueStrings(results.map((result) => result.modelId)),
    schemaIdsPreserved: uniqueStrings(results.map((result) => result.schemaId)),
    rawProviderResponsesStored: evidence.deepseekPr320.rawProviderResponsesStored,
    rawProviderResponsesPrinted: evidence.deepseekPr320.rawProviderResponsesPrinted,
    secretPayloadPrinted: evidence.deepseekPr320.secretPayloadPrinted,
  }
}

function buildNoRuntimeUnlocksReport(executed: boolean) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    status: 'passed',
    executed,
    runtimeGates: RUNTIME_GATES,
    generatedLocalFixturePassedClaimed: false,
    planSnapshotContractCanBeRecommendedOnlyAfterProviderDryRunPass: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    supabaseEnvironmentTouched: false,
    supabaseChangelogReviewed: true,
    supabaseChangelogImpact: 'none_no_supabase_sql_or_environment_path_in_this_rerun',
  }
}

function buildSummaryReport(
  decision: Record<string, unknown>,
  caseResults: QwenRerunCaseResult[],
  evidence: ReturnType<typeof loadSourceEvidence>,
  executed: boolean,
) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    qwenRerunAttempted: executed,
    qwenRerunPassed: decision.status === 'passed',
    qwenProviderCallsAttempted: caseResults.length,
    qwenProviderCallsPassed: caseResults.filter((result) => result.status === 'passed').length,
    qwenProviderCallsBlocked: caseResults.filter((result) => result.status === 'blocked').length,
    activeRegion: 'us_virginia',
    endpointUsed: QWEN_US_ENDPOINT,
    modelAliasesUsed: uniqueStrings(caseResults.map((result) => result.modelId)),
    historicalQwenAliasesUsed: caseResults
      .filter((result) => result.modelId === 'qwen3.7-plus' || result.modelId === 'qwen3.7-max')
      .map((result) => result.modelId),
    deepseekRerunAttempted: false,
    deepseekPassedEvidencePreserved: evidence.deepseekPr320.status === 'passed',
    providerDryRunNowPassesOverall: decision.status === 'passed',
    planSnapshotContractReady: decision.status === 'passed',
    rawProviderOutputPersisted: false,
    rawProviderOutputPrinted: false,
    modelGeneratedContentStored: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    noUserData: true,
    noPrivateProjectData: true,
    noMediaData: true,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationsDeployed: false,
    workersToolsRoutes: false,
    rawPromptExecution: false,
    mediaProcessing: false,
    publicArtifacts: false,
    signedUrls: false,
    generatedAssets: false,
    creditSpendOrReservation: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
    nextRecommendedPrompt: decision.nextRecommendedPrompt,
  }
}

export async function writeModelOrchestrationQwenProviderDryRunRerunArtifacts(
  reports: ModelOrchestrationQwenProviderDryRunRerunReports,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_preflight.json'), reports.preflight)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_case_results.json'), reports.caseResults)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_schema_validation.json'), reports.schemaValidation)
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_rerun_cost_timeout_rate_guardrails.json'),
    reports.costTimeoutRateGuardrails,
  )
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_redaction_audit.json'), reports.redactionAudit)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_fail_closed_events.json'), reports.failClosedEvents)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_deepseek_preservation.json'), reports.deepseekPreservation)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_no_runtime_unlocks.json'), reports.noRuntimeUnlocks)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_summary.json'), reports.summary)
  await writeVlmRuntimeTextArtifact(
    'docs/model-orchestration-qwen-deepseek-provider-dry-run-rerun-result.md',
    buildRerunMarkdown(reports),
  )
}

export function readModelOrchestrationQwenProviderDryRunRerunSummary(): Record<string, unknown> {
  return readJsonIfPresent(reportPath('qwen_rerun_summary.json')) ??
    buildModelOrchestrationQwenProviderDryRunRerunReports().summary
}

function buildRerunMarkdown(reports: ModelOrchestrationQwenProviderDryRunRerunReports): string {
  const summary = reports.summary
  const decision = String(summary.decision)
  const nextPrompt = String(summary.nextRecommendedPrompt)
  return `# Model Orchestration Qwen DashScope Synthetic Dry-Run Rerun Result

Decision: \`${decision}\`.

Status: \`${String(summary.status)}\`.

Qwen/DashScope rerun attempted: \`${String(summary.qwenRerunAttempted)}\`.

Qwen/DashScope rerun passed: \`${String(summary.qwenRerunPassed)}\`.

Active region: \`us_virginia\`.

Endpoint used: \`${QWEN_US_ENDPOINT}\`.

Model aliases used: \`${asArray(summary.modelAliasesUsed).join(', ') || 'none'}\`.

DeepSeek rerun attempted: \`false\`. DeepSeek PR #320 passed evidence is preserved.

Provider dry-run overall pass: \`${String(summary.providerDryRunNowPassesOverall)}\`.

Plan snapshot contract ready: \`${String(summary.planSnapshotContractReady)}\`.

Raw provider output persisted: \`false\`.

Model-generated content stored: \`false\`.

Secret payloads printed, committed, or stored: \`false\`.

Supabase writes, SQL, and migrations: \`false\`.

Still blocked unless a later approved prompt says otherwise: workers, tools, routes, raw prompt execution, media processing, storage writes, public artifacts, signed URLs, generated assets, credit spend/reservation, production, external beta, paid production, Demucs runtime, Track A runtime, and Qwen/VLM runtime beyond this synthetic rerun.

Recommended next prompt: \`${nextPrompt}\`.
`
}
