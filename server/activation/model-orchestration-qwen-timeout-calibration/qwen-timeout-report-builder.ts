import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  QWEN_TIMEOUT_BLOCKED_SCOPES,
  QWEN_TIMEOUT_CALIBRATION_BASE_BRANCH,
  QWEN_TIMEOUT_CALIBRATION_BRANCH,
  QWEN_TIMEOUT_CALIBRATION_PHASE,
  QWEN_TIMEOUT_CALIBRATION_PR_TITLE,
  QWEN_TIMEOUT_CALIBRATION_REPORT_DIR,
  QWEN_TIMEOUT_CALIBRATION_RUN_ID,
  QWEN_TIMEOUT_ESCALATION_MODEL,
  QWEN_TIMEOUT_EXPECTED_ARTIFACTS,
  QWEN_TIMEOUT_FAILURES,
  QWEN_TIMEOUT_FORBIDDEN_CONFIRMATIONS,
  QWEN_TIMEOUT_KNOWN_UNAVAILABLE_MODEL,
  QWEN_TIMEOUT_PRIMARY_MODEL,
  QWEN_TIMEOUT_REQUIRED_CONFIRMATIONS,
  QWEN_TIMEOUT_REQUIRED_ENVIRONMENT,
  QWEN_TIMEOUT_SECRET_REFS,
  getQwenTimeoutGeneratedArtifactPrefix,
  getQwenTimeoutQaArtifactPrefix,
} from './qwen-timeout-calibration-policy'
import type {
  ApprovedQwenSourceCase,
  PrivateArtifactUpload,
  QwenTimeoutCalibrationCase,
  QwenTimeoutCalibrationReports,
  QwenTimeoutCalibrationResult,
  QwenTimeoutDecision,
  QwenTimeoutRecommendation,
  QwenTimeoutStatus,
  SecretAccessEntry,
} from './qwen-timeout-calibration-types'
import { loadApprovedQwenTimeoutSourceCases } from './qwen-schema-case-minimizer'
import { buildQwenTimeoutQa } from './qwen-timeout-result-analyzer'
import { buildQwenTimeoutSourceAudit } from './qwen-timeout-source-audit'

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

export function buildQwenTimeoutCalibrationReports(input?: {
  executed?: boolean
  sourceCases?: ApprovedQwenSourceCase[]
  calibrationCases?: QwenTimeoutCalibrationCase[]
  results?: QwenTimeoutCalibrationResult[]
  secretEntries?: SecretAccessEntry[]
  status?: QwenTimeoutStatus
  decision?: QwenTimeoutDecision
  activeBlockers?: string[]
  analysis?: Record<string, unknown>
  recommendation?: QwenTimeoutRecommendation
  privateArtifactUpload?: PrivateArtifactUpload
}): QwenTimeoutCalibrationReports {
  const existing = !input ? readExistingReports() : undefined
  if (existing) return existing

  const sourceCases = input?.sourceCases ?? loadApprovedQwenTimeoutSourceCases()
  const calibrationCases = input?.calibrationCases ?? []
  const results = input?.results ?? []
  const status = input?.status ?? 'not_attempted'
  const decision = input?.decision ?? 'not_attempted'
  const activeBlockers = input?.activeBlockers ?? ['qwen_timeout_calibration_not_executed']
  const recommendation = input?.recommendation ?? {
    selectedHeadAgentModel: null,
    selectedCalibrationMode: 'blocked',
    recommendedTimeoutMs: null,
    recommendedMaxOutputTokens: null,
    fullDryRunReadiness: 'blocked',
    reason: 'Calibration has not been executed.',
  }
  const analysis = input?.analysis ?? {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    status,
    activeBlockers,
    providerCallsAttempted: 0,
    rawProviderResponsesStored: false,
    secretPayloadPrinted: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(),
  }
  const secretAccess = buildSecretAccessReport(input?.secretEntries ?? defaultSecretEntries('not_attempted'), Boolean(input?.executed))
  const decisionReport = buildDecisionReport(status, decision, activeBlockers, results)
  const manifest = buildManifest(Boolean(input?.executed), input?.privateArtifactUpload)
  const qa = buildQwenTimeoutQa({
    status,
    decision,
    results,
    secretAccess,
    privateArtifactUploadStatus: input?.privateArtifactUpload?.status,
  })
  const report = {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    status,
    decision,
    activeBlockers,
    sourceAudit: buildQwenTimeoutSourceAudit(),
    policy: buildPolicyReport(),
    secretAccess,
    cases: buildCasesReport(sourceCases, calibrationCases),
    results: buildResultsReport(results),
    analysis,
    recommendation,
    qa,
    manifest,
    privateArtifactUpload: input?.privateArtifactUpload ?? {
      status: 'not_attempted',
      generatedPrefix: getQwenTimeoutGeneratedArtifactPrefix(),
      qaPrefix: getQwenTimeoutQaArtifactPrefix(),
      artifacts: [],
      publicArtifacts: false,
      signedUrls: false,
      rawProviderResponsesStored: false,
    },
    deepseekCalls: false,
    fullQwenDeepSeekProviderDryRun: false,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationDeployed: false,
    productionExternalBetaBroadMedia: 'blocked',
  }

  return {
    sourceAudit: buildQwenTimeoutSourceAudit(),
    policy: buildPolicyReport(),
    secretAccess,
    cases: buildCasesReport(sourceCases, calibrationCases),
    results: buildResultsReport(results),
    analysis,
    recommendation,
    decision: decisionReport,
    blockerReport: buildBlockerReport(status, decision, activeBlockers),
    readinessReport: buildReadinessReport(status, decision, activeBlockers, recommendation, input?.privateArtifactUpload),
    manifest,
    qa,
    report,
  }
}

export async function writeQwenTimeoutCalibrationArtifacts(reports: QwenTimeoutCalibrationReports): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'audit/repo-ownership-audit.json'), reports.sourceAudit)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'policy/qwen-timeout-calibration-policy.json'), reports.policy)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'secrets/qwen-timeout-secret-access.json'), reports.secretAccess)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'cases/qwen-timeout-calibration-cases.json'), reports.cases)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'results/qwen-timeout-calibration-results.json'), reports.results)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'analysis/qwen-timeout-result-analysis.json'), reports.analysis)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'recommendation/qwen-model-timeout-target-recommendation.json'), reports.recommendation)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'decision/qwen-timeout-calibration-decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'blockers/qwen-timeout-calibration-blocker-report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'readiness/qwen-timeout-calibration-readiness-report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'manifest/qwen-timeout-calibration-manifest.json'), reports.manifest)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'qa/qwen-timeout-calibration-qa.json'), reports.qa)
  await writeVlmRuntimeJsonArtifact(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'reports/qwen-timeout-calibration-report.json'), reports.report)
  await writeDocs(reports)
}

export function readQwenTimeoutCalibrationSummary() {
  return readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'readiness/qwen-timeout-calibration-readiness-report.json')) ??
    buildQwenTimeoutCalibrationReports().readinessReport
}

export function buildPolicyReport() {
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    branch: QWEN_TIMEOUT_CALIBRATION_BRANCH,
    baseBranch: QWEN_TIMEOUT_CALIBRATION_BASE_BRANCH,
    prTitle: QWEN_TIMEOUT_CALIBRATION_PR_TITLE,
    patchType: 'Qwen schema-case timeout/model target calibration for synthetic provider dry-run',
    requiredEnvironment: QWEN_TIMEOUT_REQUIRED_ENVIRONMENT,
    requiredConfirmations: QWEN_TIMEOUT_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: QWEN_TIMEOUT_FORBIDDEN_CONFIRMATIONS,
    exactSecretRefsOnly: QWEN_TIMEOUT_SECRET_REFS,
    secretSourcePolicy: 'google_secret_manager_only',
    approvedBaseUrlKey: 'us',
    approvedDashScopeRegion: 'us',
    primaryModel: QWEN_TIMEOUT_PRIMARY_MODEL,
    escalationModel: QWEN_TIMEOUT_ESCALATION_MODEL,
    knownUnavailableModel: QWEN_TIMEOUT_KNOWN_UNAVAILABLE_MODEL,
    qwenMaxRetested: false,
    failureClasses: QWEN_TIMEOUT_FAILURES,
    blockedScopes: QWEN_TIMEOUT_BLOCKED_SCOPES,
    deepseekCalls: false,
    fullProviderDryRun: false,
    syntheticPromptsOnly: true,
    rawProviderResponsesStored: false,
    secretPayloadsPrintedOrCommitted: false,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationDeployed: false,
    publicArtifacts: false,
    signedUrls: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
  }
}

export function buildSecretAccessReport(entries: SecretAccessEntry[], executed: boolean) {
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    status: executed ? (entries.every((entry) => entry.payloadAccessStatus === 'succeeded' && !entry.envVarPresent) ? 'passed' : 'blocked') : 'not_attempted',
    executed,
    secretSourcePolicy: 'google_secret_manager_only',
    exactSecretRefsOnly: true,
    exactSecretRefs: QWEN_TIMEOUT_SECRET_REFS,
    secretVersionSelector: 'latest',
    approvedDashScopeBaseUrlKey: 'us',
    approvedDashScopeRegion: 'us',
    broadSecretDiscovery: false,
    secretPayloadValuesStoredInReport: false,
    payloadPrinted: false,
    payloadCommitted: false,
    deepseekSecretAccessed: false,
    entries,
    baseUrlPayloadMatchedApprovedUsEndpoint: entries.some((entry) =>
      entry.secretRef === 'DASHSCOPE_BASE_URL' && entry.payloadMatchedApprovedValue === true),
    regionPayloadMatchedUs: entries.some((entry) =>
      entry.secretRef === 'DASHSCOPE_REGION' && entry.payloadMatchedApprovedValue === true),
  }
}

function buildCasesReport(sourceCases: ApprovedQwenSourceCase[], calibrationCases: QwenTimeoutCalibrationCase[]) {
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    sourceCaseCount: sourceCases.length,
    sourceCases,
    calibrationCaseCount: calibrationCases.length,
    calibrationCases: calibrationCases.map((item) => ({
      ...item,
      prompt: item.prompt.length > 320 ? `${item.prompt.slice(0, 320)}...` : item.prompt,
      syntheticOnly: true,
      rawPromptExecutionAllowed: false,
    })),
    qwenMaxRetested: false,
    deepseekCases: 0,
  }
}

function buildResultsReport(results: QwenTimeoutCalibrationResult[]) {
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    provider: 'qwen_dashscope',
    providerCallsAttempted: results.length,
    providerCallsPassed: results.filter((item) => item.status === 'passed').length,
    providerCallsBlocked: results.filter((item) => item.status === 'blocked').length,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    secretPayloadPrinted: false,
    deepseekCalls: false,
    fullProviderDryRun: false,
    results,
  }
}

function buildDecisionReport(
  status: QwenTimeoutStatus,
  decision: QwenTimeoutDecision,
  activeBlockers: string[],
  results: QwenTimeoutCalibrationResult[],
) {
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    status,
    decision,
    activeBlockers,
    providerCallsAttempted: results.length,
    qwenApiCallsAllowedOnlyForTimeoutCalibration: true,
    deepseekApiCallsAllowedInThisPhase: false,
    fullProviderDryRunAllowedInThisPhase: false,
    rawProviderResponsesStored: false,
    secretPayloadPrinted: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    supabaseWrites: false,
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(),
    publicArtifacts: false,
    signedUrls: false,
    productionAffected: false,
    externalBeta: false,
    paidProduction: false,
  }
}

function buildBlockerReport(status: QwenTimeoutStatus, decision: QwenTimeoutDecision, activeBlockers: string[]) {
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    status,
    decision,
    activeBlockers,
    blockedScopes: QWEN_TIMEOUT_BLOCKED_SCOPES,
    deepseekCalls: false,
    fullProviderDryRun: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationDeployed: false,
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

function buildReadinessReport(
  status: QwenTimeoutStatus,
  decision: QwenTimeoutDecision,
  activeBlockers: string[],
  recommendation: QwenTimeoutRecommendation,
  privateArtifactUpload?: PrivateArtifactUpload,
) {
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    status,
    decision,
    activeBlockers,
    selectedHeadAgentModel: recommendation.selectedHeadAgentModel,
    selectedCalibrationMode: recommendation.selectedCalibrationMode,
    recommendedTimeoutMs: recommendation.recommendedTimeoutMs,
    recommendedMaxOutputTokens: recommendation.recommendedMaxOutputTokens,
    fullModelDryRunReadiness: recommendation.fullDryRunReadiness,
    fullModelDryRunReadinessReason: recommendation.reason,
    qwenAuthEvidenceRunId: 'modeldryrun1-20260612T162802',
    qwenAuthRepairEvidenceAuthoritative: true,
    primaryModel: QWEN_TIMEOUT_PRIMARY_MODEL,
    escalationModel: QWEN_TIMEOUT_ESCALATION_MODEL,
    knownUnavailableModel: QWEN_TIMEOUT_KNOWN_UNAVAILABLE_MODEL,
    qwenMaxRetested: false,
    privateArtifactUploadStatus: privateArtifactUpload?.status ?? 'not_attempted',
    privateGeneratedArtifactPrefix: getQwenTimeoutGeneratedArtifactPrefix(),
    privateQaArtifactPrefix: getQwenTimeoutQaArtifactPrefix(),
    supabaseMilestoneSync: buildSupabaseMilestoneSyncStatus(),
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
    rawProviderResponsesStored: false,
    rawProviderResponsesPrinted: false,
    deepseekCalls: false,
    fullProviderDryRun: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationDeployed: false,
    rawPromptExecutionIntoWorkersOrTools: false,
    publicArtifacts: false,
    signedUrls: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
  }
}

function buildManifest(executed: boolean, upload?: PrivateArtifactUpload) {
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    reportDir: QWEN_TIMEOUT_CALIBRATION_REPORT_DIR,
    expectedArtifacts: QWEN_TIMEOUT_EXPECTED_ARTIFACTS,
    generatedArtifactPrefix: getQwenTimeoutGeneratedArtifactPrefix(),
    qaArtifactPrefix: getQwenTimeoutQaArtifactPrefix(),
    privateArtifactUpload: upload ?? {
      status: 'not_attempted',
      generatedPrefix: getQwenTimeoutGeneratedArtifactPrefix(),
      qaPrefix: getQwenTimeoutQaArtifactPrefix(),
      artifacts: [],
      publicArtifacts: false,
      signedUrls: false,
      rawProviderResponsesStored: false,
    },
    committedArtifactClasses: ['safe_json_reports', 'safe_markdown_docs', 'server_only_qwen_timeout_calibration_code'],
    excludedArtifactClasses: [
      'api_keys',
      'db_urls',
      'service_role_keys',
      'anon_keys',
      'access_tokens',
      'secret_payloads',
      'signed_urls',
      'raw_provider_responses',
      'raw_prompts',
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
    sqlExecuted: false,
    migrationDeployed: false,
  }
}

function defaultSecretEntries(status: SecretAccessEntry['payloadAccessStatus']): SecretAccessEntry[] {
  return QWEN_TIMEOUT_SECRET_REFS.map((secretRef) => ({
    secretRef,
    source: 'unavailable',
    payloadAccessStatus: status,
    secretVersionSelector: 'latest',
    envVarPresent: false,
    payloadPrinted: false,
    payloadCommitted: false,
    secretValueStoredInReports: false,
  }))
}

function buildSupabaseMilestoneSyncStatus() {
  const syncLayerPresent = existsSync('server/activation/supabase-milestone-sync')
  return {
    requested: process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC === 'true',
    status: syncLayerPresent ? 'available_not_invoked_by_qwen_timeout_calibration' : 'not_attempted_current_branch_missing_sync_layer',
    syncLayerPresent,
    sqlExecuted: false,
    migrationDeployed: false,
    unrelatedRowsWritten: false,
  }
}

function readExistingReports(): QwenTimeoutCalibrationReports | undefined {
  const report = readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'reports/qwen-timeout-calibration-report.json'))
  if (!report) return undefined
  return {
    sourceAudit: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'audit/repo-ownership-audit.json')) ?? {},
    policy: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'policy/qwen-timeout-calibration-policy.json')) ?? {},
    secretAccess: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'secrets/qwen-timeout-secret-access.json')) ?? {},
    cases: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'cases/qwen-timeout-calibration-cases.json')) ?? {},
    results: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'results/qwen-timeout-calibration-results.json')) ?? {},
    analysis: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'analysis/qwen-timeout-result-analysis.json')) ?? {},
    recommendation: (readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'recommendation/qwen-model-timeout-target-recommendation.json')) ?? {
      selectedHeadAgentModel: null,
      selectedCalibrationMode: 'blocked',
      recommendedTimeoutMs: null,
      recommendedMaxOutputTokens: null,
      fullDryRunReadiness: 'blocked',
      reason: 'Calibration report is missing a recommendation artifact.',
    }) as unknown as QwenTimeoutRecommendation,
    decision: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'decision/qwen-timeout-calibration-decision.json')) ?? {},
    blockerReport: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'blockers/qwen-timeout-calibration-blocker-report.json')) ?? {},
    readinessReport: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'readiness/qwen-timeout-calibration-readiness-report.json')) ?? {},
    manifest: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'manifest/qwen-timeout-calibration-manifest.json')) ?? {},
    qa: readJson(path.join(QWEN_TIMEOUT_CALIBRATION_REPORT_DIR, 'qa/qwen-timeout-calibration-qa.json')) ?? {},
    report,
  }
}

async function writeDocs(reports: QwenTimeoutCalibrationReports) {
  const readiness = reports.readinessReport
  const decision = String(readiness.decision)
  const status = String(readiness.status)
  const selected = String(readiness.selectedHeadAgentModel ?? 'none')
  const mode = String(readiness.selectedCalibrationMode ?? 'blocked')
  const fullReadiness = String(readiness.fullModelDryRunReadiness ?? 'blocked')

  await writeVlmRuntimeTextArtifact('docs/model-orchestration/qwen-timeout-calibration-runbook.md', `# Qwen Timeout Calibration Runbook

Decision: \`${decision}\`.

Run \`activation:qwen-timeout-calibration -- --execute\` only with \`GCP_PROJECT_ID=reeditpro\`, \`GCP_REGION=us-central1\`, \`REEDITPRO_ENV=staging\`, and \`REEDITPRO_CONFIRM_QWEN_SCHEMA_TIMEOUT_CALIBRATION=true\`.

Secret source is Google Secret Manager only for \`DASHSCOPE_API_KEY\`, \`DASHSCOPE_BASE_URL\`, and \`DASHSCOPE_REGION\`. Do not provide DashScope payload env vars.

The calibration is Qwen-only and synthetic-only. DeepSeek, the full Qwen/DeepSeek dry-run, tools, workers, routes, Supabase writes, SQL, migrations, media, public artifacts, signed URLs, production, external beta, and paid production remain blocked.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration/qwen-timeout-calibration-policy.md', `# Qwen Timeout Calibration Policy

Primary target: \`${QWEN_TIMEOUT_PRIMARY_MODEL}\`.

Escalation target: \`${QWEN_TIMEOUT_ESCALATION_MODEL}\`, evidence-only unless a later target decision approves replacement.

Known unavailable alias: \`${QWEN_TIMEOUT_KNOWN_UNAVAILABLE_MODEL}\`; it is not retested by this phase.

Streaming is allowed only as a calibration mode for synthetic schema evidence. Raw provider responses, secret payloads, raw prompts, public artifacts, and signed URLs are not stored.
`)

  await writeVlmRuntimeTextArtifact('docs/activation-phase-qwen-timeout-calibration-results.md', `# MODEL-TIMEOUT-1 Qwen Schema Timeout Calibration Results

Status: \`${status}\`

Run ID: \`${QWEN_TIMEOUT_CALIBRATION_RUN_ID}\`

Branch: \`${QWEN_TIMEOUT_CALIBRATION_BRANCH}\`

Base: \`${QWEN_TIMEOUT_CALIBRATION_BASE_BRANCH}\`

Decision: \`${decision}\`

Selected model target: \`${selected}\`

Selected calibration mode: \`${mode}\`

Recommended timeout: \`${String(readiness.recommendedTimeoutMs ?? 'none')}\`

Recommended max output tokens: \`${String(readiness.recommendedMaxOutputTokens ?? 'none')}\`

Full MODEL-DRYRUN-1 readiness: \`${fullReadiness}\`

Qwen auth evidence: \`modeldryrun1-20260612T162802\`

DeepSeek calls: \`not run\`

Full Qwen/DeepSeek dry-run: \`not run\`

Supabase milestone sync: \`${String((readiness.supabaseMilestoneSync as Record<string, unknown> | undefined)?.status ?? 'not_attempted_current_branch_missing_sync_layer')}\`

SQL executed: \`none\`

Migration deployed: \`no\`

Private generated artifacts: \`${String(readiness.privateGeneratedArtifactPrefix)}\`

Private QA artifacts: \`${String(readiness.privateQaArtifactPrefix)}\`

Production, external beta, broad media, tools, workers, routes, runtime execution, public artifacts, signed URLs, raw prompt execution, SQL, migrations, and schema/RLS changes remain blocked.
`)
}
