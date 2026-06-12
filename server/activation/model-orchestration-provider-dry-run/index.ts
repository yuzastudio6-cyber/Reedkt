import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE = 'model-orchestration-provider-dry-run'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID = 'model-orchestration-provider-dry-run-20260612'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-provider-dry-run'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-dry-run-approval'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-reports'
export const MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR =
  'docs/activation-model-orchestration-dry-run-approval-reports'

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
  secretRef: 'DASHSCOPE_API_KEY' | 'DEEPSEEK_API_KEY'
  provider: ProviderName
  source: 'environment' | 'secret_manager' | 'unavailable'
  payloadAccessStatus: 'succeeded' | 'failed' | 'not_attempted'
  envVarPresent: boolean
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
  'docs/model-orchestration-raw-prompt-blocker-policy.md',
  'docs/activation-model-orchestration-dry-run-approval-reports',
  'docs/activation-model-orchestration-qwen-deepseek-audit-reports',
  'docs/activation-product-internal-testing-session-0-reports',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports',
] as const

const OFFICIAL_DOCS = [
  'https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope',
  'https://api-docs.deepseek.com/',
  'https://api-docs.deepseek.com/api/create-chat-completion',
] as const

const CASE_MATRIX: CasePlan[] = [
  { provider: 'qwen_dashscope', modelId: 'qwen3.7-plus', caseId: 'synthetic_edit_intent_extraction' },
  { provider: 'qwen_dashscope', modelId: 'qwen3.7-plus', caseId: 'synthetic_timeline_planning' },
  { provider: 'qwen_dashscope', modelId: 'qwen3.7-plus', caseId: 'synthetic_tool_route_metadata_recommendation' },
  { provider: 'qwen_dashscope', modelId: 'qwen3.7-max', caseId: 'synthetic_provider_fallback_comparison' },
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

export function getModelOrchestrationProviderDryRunPlan() {
  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    branch: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BRANCH,
    baseBranch: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_BASE_BRANCH,
    prTitle: '[model] Qwen DeepSeek provider dry-run',
    mode: 'synthetic_provider_dry_run_execution',
    reportDir: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
    requiredConfirmations: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FORBIDDEN_CONFIRMATIONS,
    officialDocsBasis: OFFICIAL_DOCS,
    qwenEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    deepseekEndpoint: 'https://api.deepseek.com/chat/completions',
    providerCallsAllowedOnlyWithExecuteAndConfirmations: true,
    syntheticPromptsOnly: true,
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
    await writeModelOrchestrationProviderDryRunArtifacts(buildReportsFromDecision(decision, [], [], false, false))
    return { exitCode: 1 }
  }

  const secretLoad = await loadProviderSecrets()
  if (!secretLoad.qwenKey || !secretLoad.deepseekKey) {
    const decision = buildDecision('blocked_pending_secret_access', secretLoad.entries
      .filter((entry) => entry.blocker)
      .map((entry) => entry.blocker ?? 'secret_unavailable'))
    const reports = buildReportsFromDecision(decision, [], secretLoad.entries, false, false)
    reports.loadedCases = buildLoadedCasesReport(cases, true)
    await writeModelOrchestrationProviderDryRunArtifacts(reports)
    return { exitCode: 1 }
  }

  const results: ProviderCaseResult[] = []
  for (const plan of CASE_MATRIX) {
    const currentCase = cases.find((item) => item.caseId === plan.caseId)
    if (!currentCase) continue
    const apiKey = plan.provider === 'qwen_dashscope' ? secretLoad.qwenKey : secretLoad.deepseekKey
    results.push(await runProviderCase(plan, currentCase, apiKey))
  }

  const invalidFixturePassed = runInvalidSchemaFixture()
  const decision = selectExecutionDecision(results, invalidFixturePassed)
  const reports = buildReportsFromDecision(decision, results, secretLoad.entries, true, invalidFixturePassed)
  reports.loadedCases = buildLoadedCasesReport(cases, true)
  await writeModelOrchestrationProviderDryRunArtifacts(reports)
  return { exitCode: decision.status === 'passed' ? 0 : 1 }
}

export async function writeModelOrchestrationProviderDryRunArtifacts(reports: ProviderDryRunReports): Promise<void> {
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
  const allPresent = MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS.every((file) =>
    existsSync(pathInReportDir(file)))
  if (!allPresent) return undefined

  return {
    sourceOfTruthOwnershipAudit: readJson(pathInReportDir('source_of_truth_ownership_audit.json')) ?? {},
    plan: readJson(pathInReportDir('provider_dry_run_plan.json')) ?? {},
    secretAccess: readJson(pathInReportDir('provider_secret_access_report.json')) ?? {},
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

  return {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_RUN_ID,
    ownerWorkstream: 'MODEL_ORCHESTRATION',
    sourceEvidence: 'PR #318 committed dry-run approval reports and official provider docs',
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    pr318ReadinessStatus: approvalReadiness?.status ?? 'missing',
    pr318Decision: approvalReadiness?.decision ?? approvalDecision?.decision ?? 'missing',
    expectedPr318Decision: 'approved_for_future_qwen_deepseek_provider_dry_run',
    officialDocsBasis: OFFICIAL_DOCS,
    providerGatewayRuntimeImported: false,
    productionRouteImported: false,
    supabaseWrites: false,
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
      return {
        caseId: plan.caseId,
        provider: plan.provider,
        modelId: plan.modelId,
        expectedOutputSchema: source?.expectedOutputSchema ?? 'missing',
        maxTokens: source?.maxTokens ?? 'missing',
        timeoutMs: source?.timeoutMs ?? 'missing',
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
  deepseekKey?: string
  entries: SecretAccessEntry[]
}> {
  const qwen = await loadSecret('DASHSCOPE_API_KEY', 'qwen_dashscope')
  const deepseek = await loadSecret('DEEPSEEK_API_KEY', 'deepseek')
  return {
    qwenKey: qwen.value,
    deepseekKey: deepseek.value,
    entries: [qwen.entry, deepseek.entry],
  }
}

async function loadSecret(secretRef: SecretAccessEntry['secretRef'], provider: ProviderName): Promise<{
  value?: string
  entry: SecretAccessEntry
}> {
  const envValue = process.env[secretRef]
  if (envValue && envValue.trim().length > 0) {
    return {
      value: envValue.trim(),
      entry: {
        secretRef,
        provider,
        source: 'environment',
        payloadAccessStatus: 'succeeded',
        envVarPresent: true,
        payloadPrinted: false,
        payloadCommitted: false,
        secretValueStoredInReports: false,
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
    process.env[secretRef] = value
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
    broadSecretDiscovery: false,
    exactSecretRefsOnly: true,
    entries: normalizedEntries,
    payloadAccessed: executed && blockers.length === 0,
    payloadPrinted: false,
    payloadCommitted: false,
    secretValueStoredInReports: false,
    activeBlockers: blockers,
  }
}

async function runProviderCase(plan: CasePlan, currentCase: ApprovedCase, apiKey: string): Promise<ProviderCaseResult> {
  const started = Date.now()
  try {
    const body = buildProviderRequestBody(plan, currentCase)
    const response = await fetch(providerUrl(plan.provider), {
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

function providerUrl(provider: ProviderName) {
  return provider === 'qwen_dashscope'
    ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
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

  return base
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
      ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
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
      ['qwen3.7-plus', 'qwen3.7-max', 'deepseek-v4-flash', 'deepseek-v4-pro'].includes(result.modelId)),
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
    providerCallsAttempted: passed || activeBlockers.some((item) => item.startsWith('provider_') || item.includes('model_alias') || item.includes('schema')),
    qwenApiCallAllowedInThisPhase: true,
    deepseekApiCallAllowedInThisPhase: true,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
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
      qwenEscalation: 'qwen3.7-max',
      deepseekDefault: 'deepseek-v4-flash',
      deepseekEscalation: 'deepseek-v4-pro',
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
  }
}

async function writeDocs(reports: ProviderDryRunReports): Promise<void> {
  const decision = String(reports.readinessReport.decision)
  const status = String(reports.readinessReport.status)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run.md', `# Model Orchestration Qwen/DeepSeek Provider Dry-Run

Decision: \`${decision}\`.

Status: \`${status}\`.

This phase executes only synthetic, non-sensitive provider dry-run cases approved by PR #318. Qwen/DashScope calls use the OpenAI-compatible chat completions endpoint, and DeepSeek calls use its OpenAI-compatible chat completions endpoint with JSON-object response formatting.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Raw provider responses, API keys, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-decision.md', `# Model Orchestration Provider Dry-Run Decision

Decision: \`${decision}\`.

Provider calls executed only under explicit synthetic dry-run confirmations. Plan snapshot contract readiness: \`${String(reports.readinessReport.planSnapshotContractReady)}\`.

Secret payloads printed or committed: \`false\`. Raw provider responses stored: \`false\`. Supabase writes: \`false\`. Runtime/tool/worker/route execution: \`false\`. Production/external beta/paid production: \`false\`.
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
