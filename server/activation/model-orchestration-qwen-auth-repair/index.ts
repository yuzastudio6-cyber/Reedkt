import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export const MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE = 'model-orchestration-qwen-auth-repair'
export const MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_RUN_ID =
  process.env.REEDITPRO_MODEL_DRY_RUN_ID ?? process.env.REEDITPRO_MODELDRYRUN1_RUN_ID ?? buildModelDryRunRunId()
export const MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_BRANCH =
  'codex/rp-model-orchestration-qwen-dashscope-auth-repair'
export const MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-provider-dry-run'
export const MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REPORT_DIR =
  'docs/activation-model-orchestration-qwen-auth-repair-reports'
const PROVIDER_DRY_RUN_REPORT_DIR = 'docs/activation-model-orchestration-provider-dry-run-reports'
const DRY_RUN_APPROVAL_REPORT_DIR = 'docs/activation-model-orchestration-dry-run-approval-reports'

export const MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'qwen_auth_repair_plan.json',
  'qwen_official_alias_baseurl_review.json',
  'qwen_secret_access_report.json',
  'qwen_auth_baseurl_probe_report.json',
  'qwen_repaired_provider_dry_run_report.json',
  'qwen_green_evidence_canonicalization_report.json',
  'qwen_auth_repair_decision.json',
  'qwen_auth_repair_blocker_report.json',
  'qwen_auth_repair_readiness_report.json',
  'qwen_auth_repair_private_artifact_manifest.json',
] as const

export const MODEL_ORCHESTRATION_QWEN_GREEN_EVIDENCE_CANONICALIZATION_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_AUTH_REPAIR',
  'REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION',
  'REEDITPRO_CONFIRM_SYNTHETIC_PROVIDER_PROMPTS_ONLY',
  'REEDITPRO_CONFIRM_RAW_PROMPT_BLOCKER_POLICY',
  'REEDITPRO_CONFIRM_PROVIDER_DRY_RUN_COST_GUARDRAILS',
] as const

export const MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_AUTH_REPAIR',
  'REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION',
  'REEDITPRO_CONFIRM_QWEN_API_CALL',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_SYNTHETIC_PROVIDER_PROMPTS_ONLY',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS_FOR_PROVIDER_DRY_RUN',
  'REEDITPRO_CONFIRM_RAW_PROMPT_BLOCKER_POLICY',
  'REEDITPRO_CONFIRM_PROVIDER_DRY_RUN_COST_GUARDRAILS',
  'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED',
] as const

export const MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_DEEPSEEK_API_CALL',
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
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
] as const

type QwenRepairDecision =
  | 'qwen_alias_repaired_ready_for_plan_snapshot_contract'
  | 'qwen_auth_repaired_ready_for_provider_dry_run_update'
  | 'blocked_pending_dashscope_key_replacement'
  | 'blocked_pending_dashscope_service_activation'
  | 'blocked_pending_qwen_approved_target_alias'
  | 'blocked_pending_qwen_model_access'
  | 'blocked_pending_dashscope_region_review'
  | 'blocked_pending_workspace_id_review'
  | 'rejected_due_qwen_provider_auth_risk'
  | 'not_attempted'

type DashScopeSecretRef = 'DASHSCOPE_API_KEY'
type DashScopeBaseUrlKey = 'virginia'

interface ApprovedCase {
  caseId: string
  prompt: string
  expectedOutputSchema: string
  maxTokens: number
  timeoutMs: number
}

interface ProbeResult {
  modelId: string
  baseUrlKey: DashScopeBaseUrlKey
  aliasRole: 'official_alias_probe'
  status: 'passed' | 'blocked'
  blocker?: string
  httpStatus?: number
  latencyMs?: number
  responseContentCharacters?: number
  finishReason?: string
  usage?: TokenUsage
  sanitizedEvidence: {
    authKeywordDetected: boolean
    permissionKeywordDetected: boolean
    serviceActivationKeywordDetected: boolean
    modelUnavailableKeywordDetected: boolean
    regionKeywordDetected: boolean
    quotaKeywordDetected: boolean
  }
  rawProviderResponseStored: false
  rawProviderResponsePrinted: false
  secretPayloadPrinted: false
}

interface QwenCaseResult {
  caseId: string
  modelId: string
  schemaId: string
  status: 'passed' | 'blocked'
  blocker?: string
  httpStatus?: number
  latencyMs?: number
  finishReason?: string
  usage?: TokenUsage
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

interface TokenUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

interface SecretAccessEntry {
  secretRef: DashScopeSecretRef
  source: 'secret_manager' | 'unavailable'
  payloadAccessStatus: 'succeeded' | 'failed' | 'not_attempted'
  secretVersionSelector: 'latest'
  operatorReportedReplacementVersion: '3' | '1'
  keyReplacementAsserted: boolean
  envVarPresent: boolean
  payloadMatchedApprovedValue?: boolean
  payloadPrinted: false
  payloadCommitted: false
  secretValueStoredInReports: false
  blocker?: string
}

interface QwenAuthRepairReports {
  sourceAudit: Record<string, unknown>
  plan: Record<string, unknown>
  aliasBaseUrlReview: Record<string, unknown>
  secretAccess: Record<string, unknown>
  authProbe: Record<string, unknown>
  repairedDryRun: Record<string, unknown>
  greenEvidenceCanonicalization: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}

const OFFICIAL_DOCS = [
  'https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope',
  'https://www.alibabacloud.com/help/en/model-studio/models',
  'https://help.aliyun.com/zh/model-studio/text-generation-model/',
] as const

const QWEN_OFFICIAL_ALIAS_ORDER = ['qwen-plus', 'qwen3-max', 'qwen-max'] as const
const QWEN_CANONICAL_SELECTED_ALIAS = 'qwen-plus'

const BASE_URLS = {
  virginia: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
  beijing: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  singaporeTemplate: 'https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1',
} as const

function buildModelDryRunRunId() {
  return `modeldryrun1-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

const QWEN_CASE_MATRIX = [
  { modelRole: 'first_candidate', caseId: 'synthetic_edit_intent_extraction' },
  { modelRole: 'first_candidate', caseId: 'synthetic_timeline_planning' },
  { modelRole: 'first_candidate', caseId: 'synthetic_tool_route_metadata_recommendation' },
  { modelRole: 'selected_official_alias', caseId: 'synthetic_provider_fallback_comparison' },
] as const

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

const SOURCE_PATHS = [
  'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_decision.json',
  'docs/activation-model-orchestration-provider-dry-run-reports/qwen_provider_dry_run_report.json',
  'docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json',
  'docs/activation-model-orchestration-provider-dry-run-reports/provider_secret_access_report.json',
  'docs/activation-model-orchestration-dry-run-approval-reports/dry_run_synthetic_cases.json',
  'docs/activation-model-orchestration-dry-run-approval-reports/dry_run_readiness_report.json',
  'docs/activation-model-orchestration-qwen-deepseek-audit-reports/provider_official_evidence_inventory.json',
  'docs/model-orchestration-provider-dry-run.md',
  'docs/model-orchestration-provider-dry-run-decision.md',
  'docs/model-orchestration-dry-run-approval.md',
  'docs/model-orchestration-qwen-deepseek-audit.md',
] as const

function pathInReportDir(file: typeof MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_EXPECTED_REPORTS[number]) {
  return path.join(MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REPORT_DIR, file)
}

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

export function getModelOrchestrationQwenAuthRepairPlan() {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_RUN_ID,
    branch: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_BRANCH,
    baseBranch: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_BASE_BRANCH,
    prTitle: '[model] Qwen DashScope auth repair',
    mode: 'qwen_dashscope_green_evidence_canonicalization_and_qwen_only_synthetic_rerun',
    reportDir: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_EXPECTED_REPORTS,
    canonicalizationRequiredConfirmations: MODEL_ORCHESTRATION_QWEN_GREEN_EVIDENCE_CANONICALIZATION_REQUIRED_CONFIRMATIONS,
    requiredConfirmations: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_FORBIDDEN_CONFIRMATIONS,
    officialDocsBasis: OFFICIAL_DOCS,
    officialAliasesInProbeOrder: QWEN_OFFICIAL_ALIAS_ORDER,
    canonicalSelectedAlias: QWEN_CANONICAL_SELECTED_ALIAS,
    approvedTargetAliasApprovalSource: 'PR #318 dry-run approval plus PR #322 canonicalization requirements',
    defaultBaseUrlKey: 'virginia',
    approvedDashScopeBaseUrlClassification: 'virginia_dashscope_base_url',
    secretSource: 'google_secret_manager_only',
    exactSecretRefsOnly: ['DASHSCOPE_API_KEY'],
    secretVersionSelector: 'latest',
    operatorReportedReplacementVersion: '3',
    keyReplacementConfirmation: 'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED',
    greenEvidenceCanonicalizationConfirmation: 'REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION',
    environmentProviderSecretPayloadsAllowed: false,
    recordedAlternateBaseUrls: {
      virginia: 'default_working_base_url',
      beijing: 'recorded_not_selected_for_canonical_green_evidence',
      singaporeTemplate: BASE_URLS.singaporeTemplate,
    },
    qwenOnly: true,
    deepseekRerun: false,
    syntheticPromptsOnly: true,
    stream: false,
    tools: false,
    search: false,
    rawProviderResponsesStored: false,
    secretPayloadsPrintedOrCommitted: false,
    supabaseWrites: false,
    runtimeToolsWorkersRoutes: false,
    mediaProcessing: false,
    publicArtifacts: false,
    signedUrls: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
  }
}

export function buildModelOrchestrationQwenAuthRepairReports(): QwenAuthRepairReports {
  const existing = readExistingReports()
  if (existing) return existing
  const decision = buildDecision('not_attempted', ['qwen_auth_repair_not_executed'], false)
  return buildReportsFromExecution({
    decision,
    secretEntries: defaultSecretEntries('not_attempted'),
    probeResults: [],
    caseResults: [],
    selectedAlias: undefined,
    selectedBaseUrlKey: 'virginia',
    executed: false,
  })
}

export async function executeModelOrchestrationQwenAuthRepair(options: {
  execute: boolean
  syntheticOnly: boolean
  keepTemp: boolean
  canonicalizeGreenEvidence?: boolean
}): Promise<{ exitCode: number }> {
  if (options.execute && options.canonicalizeGreenEvidence) {
    return canonicalizeExistingQwenGreenEvidence()
  }

  if (!options.execute || !options.syntheticOnly) {
    const decision = buildDecision('blocked_pending_dashscope_key_replacement', [
      'execution_requires_explicit_execute_and_synthetic_only_flags',
    ], false)
    await writeModelOrchestrationQwenAuthRepairArtifacts(buildReportsFromExecution({
      decision,
      secretEntries: defaultSecretEntries('not_attempted'),
      probeResults: [],
      caseResults: [],
      selectedAlias: undefined,
      selectedBaseUrlKey: 'virginia',
      executed: false,
    }))
    return { exitCode: 1 }
  }

  const missing = MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const forbidden = MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  if (missing.length > 0 || forbidden.length > 0) {
    const decision = buildDecision('blocked_pending_dashscope_key_replacement', [
      ...missing.map((name) => `missing_confirmation:${name}`),
      ...forbidden.map((name) => `forbidden_confirmation:${name}`),
    ], false)
    await writeModelOrchestrationQwenAuthRepairArtifacts(buildReportsFromExecution({
      decision,
      secretEntries: defaultSecretEntries('not_attempted'),
      probeResults: [],
      caseResults: [],
      selectedAlias: undefined,
      selectedBaseUrlKey: 'virginia',
      executed: true,
    }))
    return { exitCode: 1 }
  }

  const dashScopeConfig = await loadDashScopeConfig()
  if (!dashScopeConfig.apiKey || !dashScopeConfig.baseUrl) {
    const decision = buildDecision(dashScopeConfig.blockerDecision, dashScopeConfig.blockers, false)
    await writeModelOrchestrationQwenAuthRepairArtifacts(buildReportsFromExecution({
      decision,
      secretEntries: dashScopeConfig.entries,
      probeResults: [],
      caseResults: [],
      selectedAlias: undefined,
      selectedBaseUrlKey: 'virginia',
      executed: true,
    }))
    return { exitCode: 1 }
  }

  const probeResults: ProbeResult[] = []
  for (const alias of QWEN_OFFICIAL_ALIAS_ORDER) {
    probeResults.push(await runQwenAuthProbe(alias, dashScopeConfig.baseUrl, 'official_alias_probe', dashScopeConfig.apiKey))
  }

  const selectedProbe = probeResults.find((item) => item.status === 'passed' && item.modelId === QWEN_CANONICAL_SELECTED_ALIAS) ??
    probeResults.find((item) => item.status === 'passed')
  if (!selectedProbe) {
    const decision = selectProbeBlockedDecision(probeResults)
    await writeModelOrchestrationQwenAuthRepairArtifacts(buildReportsFromExecution({
      decision,
      secretEntries: dashScopeConfig.entries,
      probeResults,
      caseResults: [],
      selectedAlias: undefined,
      selectedBaseUrlKey: 'virginia',
      executed: true,
    }))
    return { exitCode: 1 }
  }

  const cases = loadApprovedCases()
  const missingCases = QWEN_CASE_MATRIX
    .filter((plan) => !cases.some((item) => item.caseId === plan.caseId))
    .map((item) => `missing_approved_case:${item.caseId}`)
  if (missingCases.length > 0) {
    const decision = buildDecision('qwen_auth_repaired_ready_for_provider_dry_run_update', missingCases, true)
    await writeModelOrchestrationQwenAuthRepairArtifacts(buildReportsFromExecution({
      decision,
      secretEntries: dashScopeConfig.entries,
      probeResults,
      caseResults: [],
      selectedAlias: selectedProbe.modelId,
      selectedBaseUrlKey: 'virginia',
      executed: true,
    }))
    return { exitCode: 1 }
  }

  const caseResults: QwenCaseResult[] = []
  for (const plan of QWEN_CASE_MATRIX) {
    const currentCase = cases.find((item) => item.caseId === plan.caseId)
    if (!currentCase) continue
    caseResults.push(await runQwenSchemaCase(currentCase, selectedProbe.modelId, dashScopeConfig.baseUrl, dashScopeConfig.apiKey))
  }

  const decision = selectSchemaDecision(caseResults)
  await writeModelOrchestrationQwenAuthRepairArtifacts(buildReportsFromExecution({
    decision,
    secretEntries: dashScopeConfig.entries,
    probeResults,
    caseResults,
    selectedAlias: selectedProbe.modelId,
    selectedBaseUrlKey: 'virginia',
    executed: true,
  }))
  return { exitCode: decision.status === 'passed' ? 0 : 1 }
}

async function canonicalizeExistingQwenGreenEvidence(): Promise<{ exitCode: number }> {
  const missing = MODEL_ORCHESTRATION_QWEN_GREEN_EVIDENCE_CANONICALIZATION_REQUIRED_CONFIRMATIONS
    .filter((name) => process.env[name] !== 'true')
  const forbidden = MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const existingReports = readStoredReportsWithoutCanonicalization()
  const validationBlockers = validateCanonicalGreenEvidence(existingReports ?? {})
  const blockers = [
    ...missing.map((name) => `missing_confirmation:${name}`),
    ...forbidden.map((name) => `forbidden_confirmation:${name}`),
    ...validationBlockers,
  ]
  const selectedAlias = existingReports
    ? asString(existingReports.readinessReport.selectedQwenAlias) || asString(existingReports.repairedDryRun.selectedAlias)
    : undefined
  const decision = blockers.length === 0
    ? buildDecision('qwen_alias_repaired_ready_for_plan_snapshot_contract', [], true)
    : buildDecision('qwen_auth_repaired_ready_for_provider_dry_run_update', blockers, false)
  const reports = existingReports
    ? {
      ...existingReports,
      greenEvidenceCanonicalization: {
        phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
        runId: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_RUN_ID,
        status: blockers.length === 0 ? 'passed' : 'blocked',
        canonicalizationMode: 'structured_existing_green_evidence',
        canonicalizationConfirmation: 'REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION',
        confirmationPresent: process.env.REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION === 'true',
        promptProseAcceptedAsEvidence: false,
        prCommentsAcceptedAsEvidence: false,
        structuredReportEvidenceRequired: true,
        selectedAlias: selectedAlias ?? null,
        requiredSelectedAlias: QWEN_CANONICAL_SELECTED_ALIAS,
        selectedBaseUrlClassification: 'virginia_dashscope_base_url',
        officialAliasOrder: QWEN_OFFICIAL_ALIAS_ORDER,
        providerTimeoutPresent: validationBlockers.includes('provider_timeout_present_in_qwen_green_evidence'),
        qwenSchemaCasesExpected: QWEN_CASE_MATRIX.map((item) => item.caseId),
        qwenSchemaCasesPassed: asNumber(existingReports.repairedDryRun.providerCallsPassed, 0),
        qwenSchemaCasesBlocked: asNumber(existingReports.repairedDryRun.providerCallsBlocked, 0),
        decision: decision.decision,
        activeBlockers: blockers,
        deepseekRerun: false,
        rawProviderResponsesStored: false,
        rawProviderResponsesPrinted: false,
        secretPayloadPrinted: false,
        secretPayloadCommitted: false,
        toolsWorkersRoutes: false,
        mediaProcessing: false,
        supabaseWrites: false,
        publicArtifacts: false,
        signedUrls: false,
        productionAffected: false,
        externalBeta: false,
        paidProduction: false,
      },
      decision,
      blockerReport: buildBlockerReport(decision),
      readinessReport: buildReadinessReport(decision, selectedAlias),
      privateArtifactManifest: buildPrivateArtifactManifest(false),
    }
    : buildReportsFromExecution({
      decision,
      secretEntries: defaultSecretEntries('not_attempted'),
      probeResults: [],
      caseResults: [],
      selectedAlias: undefined,
      selectedBaseUrlKey: 'virginia',
      executed: false,
    })

  await writeModelOrchestrationQwenAuthRepairArtifacts(reports)
  return { exitCode: blockers.length === 0 ? 0 : 1 }
}

function readStoredReportsWithoutCanonicalization(): Omit<QwenAuthRepairReports, 'greenEvidenceCanonicalization'> | undefined {
  const decision = readJson(pathInReportDir('qwen_auth_repair_decision.json'))
  const readinessReport = readJson(pathInReportDir('qwen_auth_repair_readiness_report.json'))
  const repairedDryRun = readJson(pathInReportDir('qwen_repaired_provider_dry_run_report.json'))
  const authProbe = readJson(pathInReportDir('qwen_auth_baseurl_probe_report.json'))
  if (!decision || !readinessReport || !repairedDryRun || !authProbe) return undefined
  return {
    sourceAudit: readJson(pathInReportDir('source_of_truth_ownership_audit.json')) ?? {},
    plan: readJson(pathInReportDir('qwen_auth_repair_plan.json')) ?? {},
    aliasBaseUrlReview: readJson(pathInReportDir('qwen_official_alias_baseurl_review.json')) ?? {},
    secretAccess: readJson(pathInReportDir('qwen_secret_access_report.json')) ?? {},
    authProbe,
    repairedDryRun,
    decision,
    blockerReport: readJson(pathInReportDir('qwen_auth_repair_blocker_report.json')) ?? {},
    readinessReport,
    privateArtifactManifest: readJson(pathInReportDir('qwen_auth_repair_private_artifact_manifest.json')) ?? {},
  }
}

export async function writeModelOrchestrationQwenAuthRepairArtifacts(reports: QwenAuthRepairReports): Promise<void> {
  const reportDir = MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_auth_repair_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_official_alias_baseurl_review.json'), reports.aliasBaseUrlReview)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_secret_access_report.json'), reports.secretAccess)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_auth_baseurl_probe_report.json'), reports.authProbe)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_repaired_provider_dry_run_report.json'), reports.repairedDryRun)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_green_evidence_canonicalization_report.json'), reports.greenEvidenceCanonicalization)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_auth_repair_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_auth_repair_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_auth_repair_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'qwen_auth_repair_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeDocs(reports)
}

export function readModelOrchestrationQwenAuthRepairSummary() {
  return readJson(pathInReportDir('qwen_auth_repair_readiness_report.json')) ??
    buildModelOrchestrationQwenAuthRepairReports().readinessReport
}

function readExistingReports(): QwenAuthRepairReports | undefined {
  const decision = readJson(pathInReportDir('qwen_auth_repair_decision.json'))
  if (!decision) return undefined
  const decisionValue = asString(decision.decision)
  if (decisionValue === 'not_attempted') return undefined
  const secretAccess = readJson(pathInReportDir('qwen_secret_access_report.json'))
  if (secretAccess?.secretSourcePolicy !== 'google_secret_manager_only') return undefined
  if (secretAccess?.operatorReportedReplacementVersion !== '3') return undefined
  if (secretAccess?.keyReplacementConfirmation !== 'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED') return undefined
  const entries = asArray(secretAccess.entries)
  if (!['DASHSCOPE_API_KEY'].every((ref) =>
    entries.some((entry) => asRecord(entry).secretRef === ref))) return undefined
  const authProbe = readJson(pathInReportDir('qwen_auth_baseurl_probe_report.json'))
  if (JSON.stringify(authProbe?.probeAliasOrder) !== JSON.stringify(QWEN_OFFICIAL_ALIAS_ORDER)) return undefined
  const allPresent = MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_EXPECTED_REPORTS.every((file) =>
    existsSync(pathInReportDir(file)))
  if (!allPresent) return undefined
  return {
    sourceAudit: readJson(pathInReportDir('source_of_truth_ownership_audit.json')) ?? {},
    plan: readJson(pathInReportDir('qwen_auth_repair_plan.json')) ?? {},
    aliasBaseUrlReview: readJson(pathInReportDir('qwen_official_alias_baseurl_review.json')) ?? {},
    secretAccess: secretAccess ?? {},
    authProbe: authProbe ?? {},
    repairedDryRun: readJson(pathInReportDir('qwen_repaired_provider_dry_run_report.json')) ?? {},
    greenEvidenceCanonicalization: readJson(pathInReportDir('qwen_green_evidence_canonicalization_report.json')) ?? {},
    decision,
    blockerReport: readJson(pathInReportDir('qwen_auth_repair_blocker_report.json')) ?? {},
    readinessReport: readJson(pathInReportDir('qwen_auth_repair_readiness_report.json')) ?? {},
    privateArtifactManifest: readJson(pathInReportDir('qwen_auth_repair_private_artifact_manifest.json')) ?? {},
  }
}

function buildReportsFromExecution(input: {
  decision: Record<string, unknown>
  secretEntries: SecretAccessEntry[]
  probeResults: ProbeResult[]
  caseResults: QwenCaseResult[]
  selectedAlias?: string
  selectedBaseUrlKey: DashScopeBaseUrlKey
  executed: boolean
}): QwenAuthRepairReports {
  return {
    sourceAudit: buildSourceAudit(),
    plan: getModelOrchestrationQwenAuthRepairPlan(),
    aliasBaseUrlReview: buildAliasBaseUrlReview(input.selectedBaseUrlKey, input.selectedAlias),
    secretAccess: buildSecretAccessReport(input.secretEntries, input.executed),
    authProbe: buildAuthProbeReport(input.probeResults, input.selectedBaseUrlKey, input.executed),
    repairedDryRun: buildRepairedDryRunReport(input.caseResults, input.selectedAlias, input.executed),
    greenEvidenceCanonicalization: buildGreenEvidenceCanonicalizationReport(input, false),
    decision: input.decision,
    blockerReport: buildBlockerReport(input.decision),
    readinessReport: buildReadinessReport(input.decision, input.selectedAlias),
    privateArtifactManifest: buildPrivateArtifactManifest(input.executed),
  }
}

function buildSourceAudit() {
  const providerDecision = readJson(path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'provider_dry_run_decision.json'))
  const qwenReport = readJson(path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'qwen_provider_dry_run_report.json'))
  const deepseekReport = readJson(path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'deepseek_provider_dry_run_report.json'))
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_RUN_ID,
    ownerWorkstream: 'MODEL_ORCHESTRATION',
    sourceEvidence: 'PR #320 provider dry-run reports plus current official DashScope and Alibaba Model Studio docs',
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    pr320Decision: providerDecision?.decision ?? 'missing',
    pr320QwenStatus: qwenReport?.status ?? 'missing',
    pr320QwenBlockedCaseCount: asArray(qwenReport?.results).filter((item) => asRecord(item).status === 'blocked').length,
    pr320QwenObservedHttpStatuses: [...new Set(asArray(qwenReport?.results).map((item) => asRecord(item).httpStatus).filter(Boolean))],
    pr320DeepSeekEvidenceReusedAsMetadataOnly: true,
    pr320DeepSeekStatus: deepseekReport?.status ?? 'missing',
    deepseekRerun: false,
    operatorReportedDashScopeKeyReplacement: {
      exactSecretRefs: ['DASHSCOPE_API_KEY'],
      apiKeyReplacementVersion: '3',
      approvedBaseUrlKey: 'virginia',
      approvedRegion: 'us-virginia',
      selectedVersionForRerun: 'latest',
      confirmationRequired: 'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED',
      canonicalizationConfirmationRequired: 'REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION',
      payloadPrinted: false,
      payloadCommitted: false,
    },
    officialDocsBasis: OFFICIAL_DOCS,
    qwenProviderCallsAllowedOnlyUnderRepairConfirmations: true,
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

function buildAliasBaseUrlReview(selectedBaseUrlKey: string, selectedAlias?: string) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    status: 'passed',
    officialDocsBasis: OFFICIAL_DOCS,
    officialAliases: QWEN_OFFICIAL_ALIAS_ORDER,
    canonicalSelectedAlias: QWEN_CANONICAL_SELECTED_ALIAS,
    approvedTargetAliasApprovalSource: 'PR #318 dry-run approval plus PR #320 provider dry-run target aliases',
    officialProbeAliasOrder: QWEN_OFFICIAL_ALIAS_ORDER,
    selectedAlias: selectedAlias ?? null,
    selectedBaseUrlKey,
    defaultBaseUrlKey: 'virginia',
    keyReplacementEvidence: {
      exactSecretRefs: ['DASHSCOPE_API_KEY'],
      operatorReportedReplacementVersion: '3',
      secretVersionSelector: 'latest',
      confirmationRequired: 'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED',
      canonicalizationConfirmation: 'REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION',
      qwenProviderRerunAfterReplacement: true,
      payloadPrinted: false,
      payloadCommitted: false,
    },
    baseUrls: {
      virginia: {
        key: 'virginia',
        source: 'approved_canonical_qwen_repair_base_url',
        payloadMatchedApprovedVirginiaEndpoint: selectedBaseUrlKey === 'virginia',
        probedByDefault: true,
      },
      beijing: {
        key: 'beijing',
        probed: false,
        reason: 'US DashScope key repair selected by Secret Manager region metadata',
      },
      singapore: {
        key: 'singapore',
        probed: false,
        blockerWithoutSafeWorkspaceId: 'blocked_pending_workspace_id_review',
      },
    },
    secretPayloadValuesStoredInReport: false,
    qwenOnly: true,
    deepseekRerun: false,
    rawProviderResponsesStored: false,
    secretPayloadPrinted: false,
  }
}

async function loadDashScopeConfig(): Promise<{
  apiKey?: string
  baseUrl?: string
  entries: SecretAccessEntry[]
  blockers: string[]
  blockerDecision: QwenRepairDecision
}> {
  const exactSecretRefs = ['DASHSCOPE_API_KEY'] as const
  const envEntries = exactSecretRefs
    .filter((secretRef) => (process.env[secretRef]?.trim().length ?? 0) > 0)
    .map((secretRef) => ({
      ...defaultSecretEntry(secretRef, 'failed'),
      envVarPresent: true,
      blocker: `${secretRef.toLowerCase()}_env_payload_present_secret_manager_required`,
    }))
  if (envEntries.length > 0) {
    return {
      entries: [
        ...envEntries,
        ...exactSecretRefs
          .filter((secretRef) => !envEntries.some((entry) => entry.secretRef === secretRef))
          .map((secretRef) => defaultSecretEntry(secretRef, 'not_attempted')),
      ],
      blockers: envEntries.map((entry) => entry.blocker ?? 'dashscope_env_payload_present_secret_manager_required'),
      blockerDecision: 'blocked_pending_dashscope_key_replacement',
    }
  }

  const apiKey = await loadSecretManagerPayload('DASHSCOPE_API_KEY')
  const entries: SecretAccessEntry[] = [
    buildLoadedSecretEntry('DASHSCOPE_API_KEY', apiKey),
  ]
  const blockers = entries.map((entry) => entry.blocker).filter((blocker): blocker is string => Boolean(blocker))

  if (apiKey.status !== 'succeeded') blockers.push(apiKey.blocker ?? 'dashscope_api_key_secret_payload_access_failed')

  const uniqueBlockers = [...new Set(blockers)]
  if (uniqueBlockers.length > 0) {
    return {
      entries,
      blockers: uniqueBlockers,
      blockerDecision: 'blocked_pending_dashscope_key_replacement',
    }
  }

  return {
    apiKey: apiKey.value,
    baseUrl: BASE_URLS.virginia,
    entries,
    blockers: [],
    blockerDecision: 'not_attempted',
  }
}

async function loadSecretManagerPayload(secretRef: DashScopeSecretRef): Promise<{
  status: SecretAccessEntry['payloadAccessStatus']
  value?: string
  blocker?: string
}> {
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
    if (value.length === 0) return { status: 'failed', blocker: `${secretRef.toLowerCase()}_secret_payload_empty` }
    return { status: 'succeeded', value }
  } catch {
    return { status: 'failed', blocker: `${secretRef.toLowerCase()}_secret_payload_access_failed` }
  }
}

function buildLoadedSecretEntry(
  secretRef: DashScopeSecretRef,
  result: { status: SecretAccessEntry['payloadAccessStatus']; blocker?: string },
  payloadMatchedApprovedValue?: boolean,
): SecretAccessEntry {
  return {
    ...defaultSecretEntry(secretRef, result.status),
    source: result.status === 'succeeded' ? 'secret_manager' : 'unavailable',
    payloadMatchedApprovedValue,
    blocker: result.blocker,
  }
}

function defaultSecretEntries(status: SecretAccessEntry['payloadAccessStatus']): SecretAccessEntry[] {
  return (['DASHSCOPE_API_KEY'] as const)
    .map((secretRef) => defaultSecretEntry(secretRef, status))
}

function defaultSecretEntry(secretRef: DashScopeSecretRef, status: SecretAccessEntry['payloadAccessStatus']): SecretAccessEntry {
  return {
    secretRef,
    source: status === 'not_attempted' ? 'unavailable' : 'unavailable',
    payloadAccessStatus: status,
    secretVersionSelector: 'latest',
    operatorReportedReplacementVersion: secretRef === 'DASHSCOPE_API_KEY' ? '3' : '1',
    keyReplacementAsserted: process.env.REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED === 'true',
    envVarPresent: false,
    payloadPrinted: false,
    payloadCommitted: false,
    secretValueStoredInReports: false,
  }
}

function buildSecretAccessReport(entries: SecretAccessEntry[], executed: boolean) {
  const blockers = entries.map((entry) => entry.blocker).filter((blocker): blocker is string => Boolean(blocker))
  const payloadAccessed = executed && entries.length === 1 && entries.every((entry) => entry.payloadAccessStatus === 'succeeded')
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    status: executed ? (blockers.length === 0 && payloadAccessed ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    secretManagerProject: 'reeditpro',
    secretSourcePolicy: 'google_secret_manager_only',
    approvedDashScopeBaseUrlKey: 'virginia',
    approvedDashScopeRegion: 'us-virginia',
    secretVersionSelector: 'latest',
    operatorReportedReplacementVersion: '3',
    secretVersionMetadataOnly: false,
    secretPayloadValuesStoredInReport: false,
    keyReplacementConfirmation: 'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED',
    keyReplacementAsserted: process.env.REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED === 'true',
    broadSecretDiscovery: false,
    exactSecretRefsOnly: true,
    exactSecretRefs: ['DASHSCOPE_API_KEY'],
    entries,
    deepseekSecretAccessed: false,
    payloadAccessed,
    baseUrlSelectedFromApprovedCanonicalMetadata: true,
    baseUrlPayloadAccessed: false,
    regionPayloadAccessed: false,
    payloadPrinted: false,
    payloadCommitted: false,
    secretValueStoredInReports: false,
    activeBlockers: blockers,
  }
}

async function runQwenAuthProbe(
  modelId: string,
  baseUrl: string,
  aliasRole: ProbeResult['aliasRole'],
  apiKey: string,
): Promise<ProbeResult> {
  const started = Date.now()
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'Return one small JSON object only. This is a synthetic metadata-only auth repair probe. Do not request tools, workers, routes, media, Supabase, public artifacts, signed URLs, production, external beta, or paid production.',
          },
          {
            role: 'user',
            content: 'Return {"caseId":"qwen_auth_probe","workerExecutionAllowed":false,"toolExecutionAllowed":false,"directMutationAllowed":false}.',
          },
        ],
        max_tokens: 120,
        temperature: 0,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    })
    const latencyMs = Date.now() - started
    const text = await response.text()
    const evidence = sanitizedProviderEvidence(text)
    if (!response.ok) {
      return {
        modelId,
        baseUrlKey: 'virginia',
        aliasRole,
        status: 'blocked',
        blocker: classifyQwenHttpError(response.status, evidence),
        httpStatus: response.status,
        latencyMs,
        responseContentCharacters: text.length,
        sanitizedEvidence: evidence,
        rawProviderResponseStored: false,
        rawProviderResponsePrinted: false,
        secretPayloadPrinted: false,
      }
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text) as Record<string, unknown>
    } catch {
      return {
        modelId,
        baseUrlKey: 'virginia',
        aliasRole,
        status: 'blocked',
        blocker: 'provider_response_json_parse_failed',
        httpStatus: response.status,
        latencyMs,
        responseContentCharacters: text.length,
        sanitizedEvidence: evidence,
        rawProviderResponseStored: false,
        rawProviderResponsePrinted: false,
        secretPayloadPrinted: false,
      }
    }
    const choice = asRecord(asArray(parsed.choices)[0])
    return {
      modelId,
      baseUrlKey: 'virginia',
      aliasRole,
      status: 'passed',
      httpStatus: response.status,
      latencyMs,
      finishReason: asString(choice.finish_reason),
      usage: normalizeUsage(asRecord(parsed.usage)),
      responseContentCharacters: asString(asRecord(choice.message).content).length,
      sanitizedEvidence: evidence,
      rawProviderResponseStored: false,
      rawProviderResponsePrinted: false,
      secretPayloadPrinted: false,
    }
  } catch (error) {
    return {
      modelId,
      baseUrlKey: 'virginia',
      aliasRole,
      status: 'blocked',
      blocker: error instanceof Error && error.name === 'TimeoutError'
        ? 'provider_timeout'
        : 'provider_request_failed',
      latencyMs: Date.now() - started,
      sanitizedEvidence: sanitizedProviderEvidence(''),
      rawProviderResponseStored: false,
      rawProviderResponsePrinted: false,
      secretPayloadPrinted: false,
    }
  }
}

async function runQwenSchemaCase(
  currentCase: ApprovedCase,
  modelId: string,
  baseUrl: string,
  apiKey: string,
): Promise<QwenCaseResult> {
  const started = Date.now()
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildQwenSchemaRequestBody(currentCase, modelId)),
      signal: AbortSignal.timeout(currentCase.timeoutMs),
    })
    const latencyMs = Date.now() - started
    const text = await response.text()
    if (!response.ok) {
      return blockedCaseResult(currentCase, modelId, classifyQwenHttpError(response.status, sanitizedProviderEvidence(text)), {
        httpStatus: response.status,
        latencyMs,
        responseContentCharacters: text.length,
      })
    }

    let providerJson: Record<string, unknown>
    try {
      providerJson = JSON.parse(text) as Record<string, unknown>
    } catch {
      return blockedCaseResult(currentCase, modelId, 'provider_response_json_parse_failed', {
        httpStatus: response.status,
        latencyMs,
        responseContentCharacters: text.length,
      })
    }

    const choice = asRecord(asArray(providerJson.choices)[0])
    const message = asRecord(choice.message)
    const content = asString(message.content)
    const parsed = parseProviderContent(content)
    if (!parsed.ok) {
      return blockedCaseResult(currentCase, modelId, parsed.blocker, {
        httpStatus: response.status,
        latencyMs,
        finishReason: asString(choice.finish_reason),
        responseContentCharacters: content.length,
        usage: normalizeUsage(asRecord(providerJson.usage)),
      })
    }

    const validation = validateProviderOutput(parsed.value, currentCase)
    if (!validation.ok) {
      return blockedCaseResult(currentCase, modelId, validation.blocker, {
        httpStatus: response.status,
        latencyMs,
        finishReason: asString(choice.finish_reason),
        responseContentCharacters: content.length,
        usage: normalizeUsage(asRecord(providerJson.usage)),
      })
    }

    return {
      caseId: currentCase.caseId,
      modelId,
      schemaId: currentCase.expectedOutputSchema,
      status: 'passed',
      httpStatus: response.status,
      latencyMs,
      finishReason: asString(choice.finish_reason),
      usage: normalizeUsage(asRecord(providerJson.usage)),
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
    return blockedCaseResult(currentCase, modelId, error instanceof Error && error.name === 'TimeoutError'
      ? 'provider_timeout'
      : 'provider_request_failed', {
      latencyMs: Date.now() - started,
    })
  }
}

function buildQwenSchemaRequestBody(currentCase: ApprovedCase, modelId: string) {
  const required = [
    ...new Set([
      ...(SCHEMA_REQUIRED_FIELDS[currentCase.expectedOutputSchema] ?? ['caseId']),
      ...SAFETY_FIELDS,
    ]),
  ]
  return {
    model: modelId,
    messages: [
      {
        role: 'system',
        content: [
          'You are a schema-only planning dry-run evaluator for ReeditPro.',
          'Return one JSON object only. Do not include markdown or explanations outside JSON.',
          'Use only synthetic metadata. Do not ask to run workers, tools, routes, media processing, Supabase, public artifacts, signed URLs, production, external beta, or paid production.',
          'Do not reveal hidden reasoning. Keep all safety booleans false.',
        ].join(' '),
      },
      {
        role: 'user',
        content: [
          `caseId: ${currentCase.caseId}`,
          `schemaId: ${currentCase.expectedOutputSchema}`,
          `syntheticInput: ${currentCase.prompt}`,
          `requiredTopLevelFields: ${required.join(', ')}`,
          'Safety booleans must be false: workerExecutionAllowed, toolExecutionAllowed, publicArtifactsAllowed, signedUrlsAllowed, rawPromptForwardingAllowed, directMutationAllowed.',
        ].join('\n'),
      },
    ],
    max_tokens: currentCase.maxTokens,
    temperature: 0.2,
    stream: false,
  }
}

function sanitizedProviderEvidence(text: string): ProbeResult['sanitizedEvidence'] {
  const lower = text.toLowerCase()
  return {
    authKeywordDetected: lower.includes('auth') || lower.includes('api key') || lower.includes('apikey'),
    permissionKeywordDetected: lower.includes('permission') || lower.includes('forbidden') || lower.includes('unauthorized'),
    serviceActivationKeywordDetected: lower.includes('activate') || lower.includes('service') || lower.includes('bailian'),
    modelUnavailableKeywordDetected: lower.includes('model') || lower.includes('not found') || lower.includes('not exist') || lower.includes('alias'),
    regionKeywordDetected: lower.includes('region') || lower.includes('endpoint') || lower.includes('workspace'),
    quotaKeywordDetected: lower.includes('quota') || lower.includes('rate limit') || lower.includes('billing'),
  }
}

function classifyQwenHttpError(status: number, evidence: ProbeResult['sanitizedEvidence']) {
  if (status === 401) return 'provider_auth_or_permission_failed'
  if (status === 403) {
    if (evidence.serviceActivationKeywordDetected) return 'dashscope_service_activation_or_forbidden'
    return 'provider_auth_or_permission_failed'
  }
  if (status === 404 || evidence.modelUnavailableKeywordDetected) return 'qwen_model_alias_unavailable'
  if (status === 429 || evidence.quotaKeywordDetected) return 'provider_rate_or_quota_error'
  if (evidence.regionKeywordDetected) return 'dashscope_region_or_workspace_mismatch'
  return 'provider_http_error'
}

function selectProbeBlockedDecision(probeResults: ProbeResult[]) {
  const blockers = [...new Set(probeResults.map((item) => item.blocker ?? 'qwen_auth_probe_blocked'))]
  const authFailures = probeResults.every((item) => item.blocker === 'provider_auth_or_permission_failed')
  const serviceBlocked = probeResults.some((item) => item.blocker === 'dashscope_service_activation_or_forbidden')
  const modelUnavailable = probeResults.every((item) => item.blocker === 'qwen_model_alias_unavailable')
  const regionBlocked = probeResults.some((item) => item.blocker === 'dashscope_region_or_workspace_mismatch')
  if (serviceBlocked) return buildDecision('blocked_pending_dashscope_service_activation', blockers, false)
  if (regionBlocked) return buildDecision('blocked_pending_dashscope_region_review', blockers, false)
  if (modelUnavailable) return buildDecision('blocked_pending_qwen_model_access', blockers, false)
  if (authFailures) return buildDecision('blocked_pending_dashscope_key_replacement', blockers, false)
  return buildDecision('blocked_pending_dashscope_key_replacement', blockers, false)
}

function selectSchemaDecision(caseResults: QwenCaseResult[]) {
  const blockers = [...new Set(caseResults.filter((item) => item.status === 'blocked').map((item) => item.blocker ?? 'qwen_case_blocked'))]
  const usageTotal = caseResults.reduce((total, result) => total + (result.usage?.totalTokens ?? 0), 0)
  if (caseResults.length > 4 || usageTotal > 4600) blockers.push('qwen_cost_or_token_guardrail_exceeded')
  if (caseResults.some((result) => result.blocker?.startsWith('unsafe_output'))) {
    return buildDecision('rejected_due_qwen_provider_auth_risk', blockers, true)
  }
  if (blockers.length === 0 && caseResults.length === 4) {
    return buildDecision('qwen_alias_repaired_ready_for_plan_snapshot_contract', [], true)
  }
  return buildDecision('qwen_auth_repaired_ready_for_provider_dry_run_update', blockers, true)
}

function buildDecision(decision: QwenRepairDecision, activeBlockers: string[], authRepaired: boolean) {
  const passed = decision === 'qwen_alias_repaired_ready_for_plan_snapshot_contract'
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_RUN_ID,
    status: passed ? 'passed' : decision === 'not_attempted' ? 'not_attempted' : 'blocked',
    decision,
    activeBlockers,
    qwenAuthRepaired: authRepaired,
    qwenOnlyProviderCallsAllowedInThisPhase: true,
    deepseekRerun: false,
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
      : 'Resolve the exact DashScope key, service, model, region, or schema blocker before another Qwen dry-run.',
  }
}

function loadApprovedCases(): ApprovedCase[] {
  const source = readJson(path.join(DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_synthetic_cases.json'))
  return asArray(source?.cases).map((item) => {
    const record = asRecord(item)
    return {
      caseId: asString(record.caseId),
      prompt: asString(record.prompt),
      expectedOutputSchema: asString(record.expectedOutputSchema),
      maxTokens: Math.min(asNumber(record.maxTokens, 900), 1100),
      timeoutMs: Math.min(Math.max(asNumber(record.timeoutMs, 20000), 20000), 60000),
    }
  }).filter((item) => item.caseId && item.prompt && item.expectedOutputSchema)
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

function normalizeUsage(usage: Record<string, unknown> | undefined): TokenUsage | undefined {
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

function blockedCaseResult(
  currentCase: ApprovedCase,
  modelId: string,
  blocker: string,
  extra: Partial<QwenCaseResult> = {},
): QwenCaseResult {
  return {
    caseId: currentCase.caseId,
    modelId,
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

function buildAuthProbeReport(probeResults: ProbeResult[], selectedBaseUrlKey: string, executed: boolean) {
  const passed = probeResults.filter((item) => item.status === 'passed')
  const blocked = probeResults.filter((item) => item.status === 'blocked')
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    status: executed ? (passed.length > 0 ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    provider: 'qwen_dashscope',
    selectedBaseUrlKey,
    selectedBaseUrlClassification: 'virginia_dashscope_base_url',
    endpointPath: '/chat/completions',
    probeAliasOrder: QWEN_OFFICIAL_ALIAS_ORDER,
    officialAliases: QWEN_OFFICIAL_ALIAS_ORDER,
    canonicalSelectedAlias: QWEN_CANONICAL_SELECTED_ALIAS,
    approvedTargetAliasApprovalSource: 'PR #318 dry-run approval plus PR #322 canonicalization requirements',
    officialAliasCallsAttempted: probeResults.length,
    officialAliasCallsPassed: passed.length,
    staleQwen37AliasesUsed: false,
    providerCallsAttempted: executed ? probeResults.length : 0,
    providerCallsPassed: passed.length,
    providerCallsBlocked: blocked.length,
    stream: false,
    tools: false,
    search: false,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    secretPayloadPrinted: false,
    results: probeResults,
  }
}

function buildRepairedDryRunReport(caseResults: QwenCaseResult[], selectedAlias: string | undefined, executed: boolean) {
  const passed = caseResults.filter((item) => item.status === 'passed')
  const blocked = caseResults.filter((item) => item.status === 'blocked')
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    provider: 'qwen_dashscope',
    status: executed ? (caseResults.length === 4 && blocked.length === 0 ? 'passed' : selectedAlias ? 'blocked' : 'not_attempted') : 'not_attempted',
    executed,
    selectedAlias: selectedAlias ?? null,
    schemaCasesRunOnlyForApprovedTargetAlias: true,
    qwenOnlySyntheticCases: QWEN_CASE_MATRIX.map((item) => item.caseId),
    providerCallsAttempted: executed && selectedAlias ? caseResults.length : 0,
    providerCallsPassed: passed.length,
    providerCallsBlocked: blocked.length,
    deepseekRerun: false,
    stream: false,
    tools: false,
    search: false,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    secretPayloadPrinted: false,
    results: caseResults,
  }
}

function buildGreenEvidenceCanonicalizationReport(input: {
  decision: Record<string, unknown>
  secretEntries: SecretAccessEntry[]
  probeResults: ProbeResult[]
  caseResults: QwenCaseResult[]
  selectedAlias?: string
  selectedBaseUrlKey: DashScopeBaseUrlKey
  executed: boolean
}, canonicalizedFromExistingEvidence: boolean) {
  const caseResults = input.caseResults
  const passedCases = caseResults.filter((item) => item.status === 'passed')
  const blockedCases = caseResults.filter((item) => item.status === 'blocked')
  const blockers = validateCanonicalGreenEvidence({
    decision: input.decision,
    readinessReport: buildReadinessReport(input.decision, input.selectedAlias),
    repairedDryRun: buildRepairedDryRunReport(input.caseResults, input.selectedAlias, input.executed),
    authProbe: buildAuthProbeReport(input.probeResults, input.selectedBaseUrlKey, input.executed),
  })
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_RUN_ID,
    status: blockers.length === 0 ? 'passed' : input.executed ? 'blocked' : 'not_attempted',
    canonicalizationMode: canonicalizedFromExistingEvidence ? 'structured_existing_green_evidence' : 'execution_result',
    canonicalizationConfirmation: 'REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION',
    confirmationPresent: process.env.REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION === 'true',
    promptProseAcceptedAsEvidence: false,
    prCommentsAcceptedAsEvidence: false,
    structuredReportEvidenceRequired: true,
    selectedAlias: input.selectedAlias ?? null,
    requiredSelectedAlias: QWEN_CANONICAL_SELECTED_ALIAS,
    selectedBaseUrlKey: input.selectedBaseUrlKey,
    selectedBaseUrlClassification: 'virginia_dashscope_base_url',
    officialAliasOrder: QWEN_OFFICIAL_ALIAS_ORDER,
    staleQwen37AliasesUsed: false,
    providerTimeoutPresent: blockers.includes('provider_timeout_present_in_qwen_green_evidence'),
    qwenSchemaCasesExpected: QWEN_CASE_MATRIX.map((item) => item.caseId),
    qwenSchemaCasesAttempted: caseResults.length,
    qwenSchemaCasesPassed: passedCases.length,
    qwenSchemaCasesBlocked: blockedCases.length,
    decision: input.decision.decision,
    activeBlockers: blockers,
    deepseekRerun: false,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    supabaseWrites: false,
    publicArtifacts: false,
    signedUrls: false,
    productionAffected: false,
    externalBeta: false,
    paidProduction: false,
  }
}

function validateCanonicalGreenEvidence(reports: {
  decision?: Record<string, unknown>
  readinessReport?: Record<string, unknown>
  repairedDryRun?: Record<string, unknown>
  authProbe?: Record<string, unknown>
}) {
  const blockers: string[] = []
  const decision = reports.decision ?? {}
  const readiness = reports.readinessReport ?? {}
  const repairedDryRun = reports.repairedDryRun ?? {}
  const authProbe = reports.authProbe ?? {}
  const selectedAliases = [
    asString(readiness.selectedQwenAlias),
    asString(repairedDryRun.selectedAlias),
  ].filter(Boolean)
  const reportText = JSON.stringify({ decision, readiness, repairedDryRun, authProbe })

  if (decision.decision !== 'qwen_alias_repaired_ready_for_plan_snapshot_contract') {
    blockers.push('qwen_pass_decision_missing')
  }
  if (asArray(decision.activeBlockers).length > 0 || asArray(readiness.activeBlockers).length > 0) {
    blockers.push('qwen_active_blockers_present')
  }
  if (selectedAliases.length === 0 || selectedAliases.some((alias) => alias !== QWEN_CANONICAL_SELECTED_ALIAS)) {
    blockers.push('qwen_selected_alias_not_canonical_qwen_plus')
  }
  if (/qwen3\.7-(?:plus|max)/.test(reportText)) {
    blockers.push('stale_qwen37_alias_present_in_structured_reports')
  }
  if (/provider_timeout/.test(reportText)) {
    blockers.push('provider_timeout_present_in_qwen_green_evidence')
  }
  const selectedBaseUrlKey = asString(readiness.selectedBaseUrlKey) || asString(authProbe.selectedBaseUrlKey)
  const selectedBaseUrlClassification = asString(readiness.selectedBaseUrlClassification) ||
    asString(authProbe.selectedBaseUrlClassification)
  if (!['virginia', 'us'].includes(selectedBaseUrlKey) &&
    selectedBaseUrlClassification !== 'virginia_dashscope_base_url') {
    blockers.push('qwen_virginia_dashscope_base_url_evidence_missing')
  }
  if (repairedDryRun.status !== 'passed') blockers.push('qwen_schema_rerun_not_passed')
  if (asNumber(repairedDryRun.providerCallsPassed, 0) !== 4) blockers.push('qwen_schema_cases_did_not_pass')
  if (asNumber(repairedDryRun.providerCallsBlocked, 0) !== 0) blockers.push('qwen_schema_cases_blocked')
  for (const key of [
    'deepseekRerun',
    'rawProviderResponsesStored',
    'rawProviderResponsesPrinted',
    'secretPayloadPrinted',
    'secretPayloadCommitted',
    'toolsWorkersRoutes',
    'mediaProcessing',
    'supabaseWrites',
    'publicArtifacts',
    'signedUrls',
    'productionAffected',
    'externalBeta',
    'paidProduction',
  ]) {
    if (decision[key] === true || readiness[key] === true || repairedDryRun[key] === true || authProbe[key] === true) {
      blockers.push(`forbidden_green_evidence_flag:${key}`)
    }
  }
  return [...new Set(blockers)]
}

function buildBlockerReport(decision: Record<string, unknown>) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: decision.activeBlockers ?? [],
    blockedScopes: [
      'deepseek_rerun',
      'tools_workers_routes',
      'media_processing',
      'supabase_writes',
      'raw_prompt_execution_into_workers_or_tools',
      'public_artifacts',
      'signed_urls',
      'production',
      'external_beta',
      'paid_production',
    ],
    deepseekRerun: false,
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

function buildReadinessReport(decision: Record<string, unknown>, selectedAlias?: string) {
  return {
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: decision.activeBlockers ?? [],
    selectedQwenAlias: selectedAlias ?? null,
    selectedQwenAliasRole: selectedAlias ? 'official_alias_probe' : null,
    officialQwenAliases: QWEN_OFFICIAL_ALIAS_ORDER,
    canonicalSelectedAlias: QWEN_CANONICAL_SELECTED_ALIAS,
    officialQwenAliasOrder: QWEN_OFFICIAL_ALIAS_ORDER,
    approvedTargetAliasesUsedOnlyAfterUsProbe: true,
    staleQwen37AliasesUsed: false,
    approvedQwen37AliasesAllowedForTargetProbe: false,
    selectedBaseUrlKey: 'virginia',
    selectedBaseUrlClassification: 'virginia_dashscope_base_url',
    approvedDashScopeRegion: 'us-virginia',
    operatorReportedReplacementVersion: '3',
    secretVersionSelector: 'latest',
    exactSecretRefs: ['DASHSCOPE_API_KEY'],
    keyReplacementConfirmation: 'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED',
    greenEvidenceCanonicalizationConfirmation: 'REEDITPRO_CONFIRM_QWEN_GREEN_EVIDENCE_CANONICALIZATION',
    keyReplacementAsserted: process.env.REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED === 'true',
    qwenProviderCallsExecutedOnlyWhenConfirmed: true,
    deepseekRerun: false,
    deepseekEvidenceReusedAsMetadataOnly: true,
    planSnapshotContractReady: decision.decision === 'qwen_alias_repaired_ready_for_plan_snapshot_contract',
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
    phase: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_RUN_ID,
    reportDir: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_EXPECTED_REPORTS,
    committedArtifactClasses: ['safe_json_reports', 'safe_markdown_docs', 'server_only_qwen_repair_code'],
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

async function writeDocs(reports: QwenAuthRepairReports): Promise<void> {
  const readiness = reports.readinessReport
  const decision = String(readiness.decision)
  const status = String(readiness.status)
  const selectedAlias = String(readiness.selectedQwenAlias ?? 'none')
  const planReady = String(readiness.planSnapshotContractReady)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-qwen-auth-repair.md', `# Model Orchestration Qwen DashScope Auth Repair

Decision: \`${decision}\`.

Status: \`${status}\`.

This server-only packet repairs the Qwen/DashScope side of PR #320 by probing only official Qwen aliases in this order: \`qwen-plus\`, \`qwen3-max\`, and \`qwen-max\`. Canonical green evidence for PR #327 requires selected alias \`qwen-plus\`.

Operator key replacement evidence: \`DASHSCOPE_API_KEY\` version \`3\` is reported as the correct-region replacement. The approved base URL classification is \`virginia_dashscope_base_url\`. Payload printed or committed: \`false\`.

Default endpoint key: \`virginia\`. Beijing is recorded as alternate official documentation evidence but is not selected for canonical green evidence. Singapore remains blocked without a safe WorkspaceId approval.

Selected alias: \`${selectedAlias}\`.

DeepSeek is not rerun in this phase. PR #320 DeepSeek evidence is reused as metadata only.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Secret payloads, raw provider responses, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-qwen-auth-repair-decision.md', `# Model Orchestration Qwen Auth Repair Decision

Decision: \`${decision}\`.

Plan snapshot contract readiness: \`${planReady}\`.

DashScope key replacement asserted during execution: \`${String(readiness.keyReplacementAsserted)}\`. Operator-reported API key version: \`3\`. Secret version selector: \`latest\`. Base URL classification: \`virginia_dashscope_base_url\`.

Qwen-only provider calls may occur only under the explicit repair confirmations. DeepSeek rerun: \`false\`. Supabase writes: \`false\`. Runtime/tool/worker/route execution: \`false\`. Production/external beta/paid production: \`false\`.

Secret payloads printed or committed: \`false\`. Raw provider responses stored: \`false\`.
`)

  if (decision === 'qwen_alias_repaired_ready_for_plan_snapshot_contract') {
    await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-model-orchestration-plan-snapshot-contract.md', `# MODEL_ORCHESTRATION - Plan Snapshot Contract

Proceed only after PR #322 committed reports record \`qwen_alias_repaired_ready_for_plan_snapshot_contract\`, selected alias \`qwen-plus\`, Virginia DashScope base URL classification, and \`4/4\` Qwen synthetic schema cases passed.

Next phase scope: rerun PR #327 provider-evidence reconciliation so the plan snapshot contract consumes committed PR #322 Qwen-pass reports plus PR #320 DeepSeek metadata.

Still blocked unless separately approved: real user data, media processing, workers, tools, routes, Supabase writes, raw prompt execution into workers/tools, public artifacts, signed URLs, production, external beta, and paid production.
`)
  } else {
    await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-qwen-dashscope-key-service-operator-fix.md', `# Qwen DashScope Key Or Service Operator Fix

Proceed only from \`docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_auth_repair_readiness_report.json\`.

Current decision: \`${decision}\`.

Operator remediation must keep secrets out of the repo and may address only the exact blocker: DashScope key replacement, Model Studio/Bailian service activation, Qwen model access, region/base URL selection, or Singapore WorkspaceId review.

Do not run DeepSeek, workers, tools, routes, media processing, Supabase writes, public artifacts, signed URLs, production, external beta, or paid production in the remediation packet.
`)
  }

  await writeVlmRuntimeTextArtifact('docs/beta-readiness-scorecard.md', `# Beta Readiness Scorecard

Session 0 owned metadata scorecard with Qwen DashScope auth repair status.

Restricted internal testing session 0: \`restricted_internal_testing_session_0_passed\`.
External beta allowed: \`false\`.
Paid production allowed: \`false\`.
Production allowed: \`false\`.

Qwen DashScope auth repair decision: \`${decision}\`.
Selected official Qwen alias: \`${selectedAlias}\`.
Plan snapshot contract readiness: \`${planReady}\`.
DeepSeek rerun in repair phase: \`false\`.
Runtime/tool/worker/route execution: \`false\`.
Supabase writes: \`false\`.
Public artifacts and signed URLs: \`false\`.
`)

  await writeVlmRuntimeTextArtifact('docs/production-beta-blocker-inventory.md', `# Production Beta Blocker Inventory

Session 0 owned blocker inventory with Qwen DashScope auth repair status.

- \`external_beta\`: blocked
- \`paid_production\`: blocked
- \`production\`: blocked
- \`public_artifacts\`: blocked
- \`signed_url_source_of_truth\`: blocked
- \`runtime_tool_worker_provider_execution\`: blocked
- \`raw_prompt_execution\`: blocked
- \`supabase_production_writes\`: blocked

Qwen DashScope auth repair decision: \`${decision}\`.

This repair packet does not unlock production, external beta, paid production, public artifacts, signed URLs, real user data, media processing, workers, tools, routes, Supabase writes, DeepSeek reruns, or raw prompt execution into workers/tools.
`)
}
