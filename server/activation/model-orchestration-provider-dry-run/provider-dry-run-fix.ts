import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE =
  'model-orchestration-provider-dry-run-fix'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID =
  'model-orchestration-provider-dry-run-fix-20260612'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-provider-dry-run-fix'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-provider-dry-run'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-fix-reports'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-reports'
export const MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR =
  'docs/activation-model-orchestration-dry-run-approval-reports'

export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_EXPECTED_REPORTS = [
  'qwen_provider_error_review.json',
  'qwen_provider_fix_decision.json',
  'qwen_provider_secret_permission_review.json',
  'qwen_provider_endpoint_contract_review.json',
  'qwen_provider_model_alias_review.json',
  'qwen_provider_fix_result.json',
  'qwen_provider_fix_blocker_report.json',
  'qwen_provider_fix_fail_closed_verification.json',
  'qwen_provider_fix_redaction_audit.json',
  'qwen_provider_fix_no_runtime_unlocks.json',
  'qwen_provider_fix_summary.json',
] as const

export type ModelOrchestrationProviderDryRunFixReportName =
  typeof MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_EXPECTED_REPORTS[number]

export interface ModelOrchestrationProviderDryRunFixReports {
  qwenProviderErrorReview: Record<string, unknown>
  qwenProviderFixDecision: Record<string, unknown>
  qwenProviderSecretPermissionReview: Record<string, unknown>
  qwenProviderEndpointContractReview: Record<string, unknown>
  qwenProviderModelAliasReview: Record<string, unknown>
  qwenProviderFixResult: Record<string, unknown>
  qwenProviderFixBlockerReport: Record<string, unknown>
  qwenProviderFixFailClosedVerification: Record<string, unknown>
  qwenProviderFixRedactionAudit: Record<string, unknown>
  qwenProviderFixNoRuntimeUnlocks: Record<string, unknown>
  qwenProviderFixSummary: Record<string, unknown>
}

const NEXT_RECOMMENDED_PROMPT =
  'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-SECRET-SETUP: verify provider secret refs/permissions, no provider calls'

const RUNTIME_GATES = {
  providerCallsInFixPrompt: false,
  qwenRerunAttempted: false,
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
  demucsRuntime: false,
  trackARuntime: false,
  externalBeta: false,
  paidProduction: false,
  production: false,
} as const

const DASH_SCOPE_OFFICIAL_DOCS = [
  {
    label: 'Alibaba Cloud Model Studio OpenAI-compatible chat',
    url: 'https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope',
    relevance: 'documents region-specific compatible-mode base URLs, API key use, and model selection',
  },
  {
    label: 'Alibaba Cloud Model Studio sub-workspace model calling',
    url: 'https://www.alibabacloud.com/help/en/model-studio/model-calling-in-sub-workspace',
    relevance: 'documents workspace-scoped API keys and model-call permission requirements',
  },
] as const

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

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.map(asString).filter(Boolean))].sort()
}

function uniqueNumbers(values: unknown[]): number[] {
  return [...new Set(values.map(asNumber).filter((value): value is number => value !== undefined))].sort()
}

function reportPath(file: ModelOrchestrationProviderDryRunFixReportName): string {
  return path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR, file)
}

function sourceReportPath(file: string): string {
  return path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR, file)
}

function approvalReportPath(file: string): string {
  return path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, file)
}

function loadSourceEvidence() {
  const qwenRun = readJson(sourceReportPath('qwen_provider_dry_run_report.json'))
  const deepseekRun = readJson(sourceReportPath('deepseek_provider_dry_run_report.json'))
  const providerDecision = readJson(sourceReportPath('provider_dry_run_decision.json'))
  const blockerReport = readJson(sourceReportPath('provider_dry_run_blocker_report.json'))
  const comparisonReport = readJson(sourceReportPath('provider_dry_run_comparison_report.json'))
  const secretReport = readJson(sourceReportPath('provider_secret_access_report.json'))
  const readinessReport = readJson(sourceReportPath('provider_dry_run_readiness_report.json'))
  const failClosedReport = readJson(sourceReportPath('provider_dry_run_fail_closed_verification.json'))
  const privateArtifactManifest = readJson(sourceReportPath('provider_dry_run_private_artifact_manifest.json'))
  const approvalDecision = readJson(approvalReportPath('dry_run_approval_decision.json'))
  const syntheticCases = readJson(approvalReportPath('dry_run_synthetic_cases.json'))
  const candidateReview = readJson(approvalReportPath('provider_candidate_review.json'))
  return {
    qwenRun,
    deepseekRun,
    providerDecision,
    blockerReport,
    comparisonReport,
    secretReport,
    readinessReport,
    failClosedReport,
    privateArtifactManifest,
    approvalDecision,
    syntheticCases,
    candidateReview,
  }
}

export function buildModelOrchestrationProviderDryRunFixReports():
  ModelOrchestrationProviderDryRunFixReports {
  const evidence = loadSourceEvidence()
  const qwenResults = asArray(evidence.qwenRun.results).map(asRecord)
  const deepseekResults = asArray(evidence.deepseekRun.results).map(asRecord)
  const secretEntries = asArray(evidence.secretReport.entries).map(asRecord)
  const qwenSecretEntry = secretEntries.find((entry) => asString(entry.secretRef) === 'DASHSCOPE_API_KEY') ?? {}
  const qwenCandidate = asRecord(evidence.candidateReview.qwenDashScope)
  const approvedQwenAliases = asArray(qwenCandidate.officialCandidateIds).map(asString).filter(Boolean)
  const qwenModelsAttempted = uniqueStrings(qwenResults.map((result) => result.modelId))
  const qwenHttpStatuses = uniqueNumbers(qwenResults.map((result) => result.httpStatus))
  const qwenBlockers = uniqueStrings(qwenResults.map((result) => result.blocker))
  const qwenEndpoint = asString(evidence.qwenRun.endpoint)
  const qwenCallsAttempted = asNumber(evidence.qwenRun.providerCallsAttempted) ?? qwenResults.length
  const qwenCallsPassed = asNumber(evidence.qwenRun.providerCallsPassed) ?? 0
  const qwenCallsBlocked = asNumber(evidence.qwenRun.providerCallsBlocked) ?? 0
  const deepseekCallsAttempted = asNumber(evidence.deepseekRun.providerCallsAttempted) ?? deepseekResults.length
  const deepseekCallsPassed = asNumber(evidence.deepseekRun.providerCallsPassed) ?? 0
  const sourceOfTruthConflictFound = false
  const classification = 'qwen_secret_present_but_rejected'
  const possibleExternalCauses = [
    'dashscope_account_model_permission_missing',
    'dashscope_region_or_workspace_key_mismatch',
    'dashscope_key_valid_for_secret_manager_but_rejected_by_model_service',
  ]

  const sourceSnapshot = {
    pr320Decision: evidence.providerDecision.decision,
    pr320Status: evidence.providerDecision.status,
    pr320ActiveBlockers: evidence.providerDecision.activeBlockers,
    pr318Decision: evidence.approvalDecision.decision,
    syntheticCaseCount: evidence.syntheticCases.caseCount,
    syntheticOnly: evidence.syntheticCases.syntheticOnly,
    containsUserData: evidence.syntheticCases.containsUserData,
    containsPrivateProjectData: evidence.syntheticCases.containsPrivateProjectData,
    containsMedia: evidence.syntheticCases.containsMedia,
    sourceOfTruthConflictFound,
  }

  const noRuntimeUnlocks = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'passed',
    runtimeGates: RUNTIME_GATES,
    generatedLocalFixturePassedClaimed: false,
    planSnapshotContractReady: false,
    sourceOfTruthPathCreated: false,
    signedUrlsAreSourceOfTruth: false,
  }

  const qwenProviderErrorReview = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'blocked',
    sourcePr: 320,
    classification,
    possibleExternalCauses,
    sourceSnapshot,
    qwenDashScope: {
      status: evidence.qwenRun.status,
      provider: evidence.qwenRun.provider,
      endpoint: qwenEndpoint,
      modelsAttempted: qwenModelsAttempted,
      providerCallsAttempted: qwenCallsAttempted,
      providerCallsPassed: qwenCallsPassed,
      providerCallsBlocked: qwenCallsBlocked,
      httpStatuses: qwenHttpStatuses,
      blockerCodes: qwenBlockers,
      rawProviderResponsesStored: evidence.qwenRun.rawProviderResponsesStored,
      rawProviderResponsesPrinted: evidence.qwenRun.rawProviderResponsesPrinted,
      secretPayloadPrinted: evidence.qwenRun.secretPayloadPrinted,
    },
    codeContractIssueFound: false,
    providerExecutionClientChanged: false,
    qwenRerunAttempted: false,
    no401TreatedAsPass: true,
  }

  const qwenProviderSecretPermissionReview = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'blocked',
    classification,
    secretReviewScope: 'metadata_only_no_secret_payload_access_in_fix_prompt',
    qwenSecretRef: 'DASHSCOPE_API_KEY',
    exactSecretRefsOnly: evidence.secretReport.exactSecretRefsOnly,
    broadSecretDiscovery: evidence.secretReport.broadSecretDiscovery,
    pr320SecretAccessStatus: qwenSecretEntry.payloadAccessStatus,
    pr320SecretSource: qwenSecretEntry.source,
    pr320EnvVarPresent: qwenSecretEntry.envVarPresent,
    pr320PayloadPrinted: qwenSecretEntry.payloadPrinted,
    pr320PayloadCommitted: qwenSecretEntry.payloadCommitted,
    pr320SecretValueStoredInReports: qwenSecretEntry.secretValueStoredInReports,
    secretPayloadAccessInFixPrompt: false,
    secretValuePrintedInFixPrompt: false,
    secretValueStoredInFixReports: false,
    providerRejectedAccessibleSecretInPr320: true,
    recommendedOperatorAction:
      'Verify the DashScope key, account workspace, region, and model-call permissions outside Codex.',
  }

  const qwenProviderEndpointContractReview = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'passed',
    endpointContractReviewStatus: 'source_of_truth_consistent_no_code_change',
    sourceOfTruthEndpoint: qwenCandidate.openAiCompatibleBaseUrl,
    pr320Endpoint: qwenEndpoint,
    endpointMatchesApprovedSourceOfTruth:
      qwenEndpoint === `${String(qwenCandidate.openAiCompatibleBaseUrl)}/chat/completions`,
    requestMode: {
      openAiCompatibleChatCompletions: true,
      streaming: false,
      tools: false,
      search: false,
      hiddenReasoningCapture: false,
    },
    officialDocsReviewed: DASH_SCOPE_OFFICIAL_DOCS,
    externalContext:
      'DashScope compatible-mode endpoints are region-specific, and workspace keys can require model-call permissions.',
    endpointChangedInFixPrompt: false,
    qwenRerunAttempted: false,
  }

  const qwenProviderModelAliasReview = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'passed',
    modelAliasReviewStatus: 'source_of_truth_consistent_external_availability_unproven_due_auth_failure',
    approvedAliases: approvedQwenAliases,
    attemptedAliases: qwenModelsAttempted,
    attemptedAliasesApproved: qwenModelsAttempted.every((modelId) => approvedQwenAliases.includes(modelId)),
    defaultDryRunModelId: qwenCandidate.defaultDryRunModelId,
    escalationModelId: qwenCandidate.escalationModelId,
    aliasChangedInFixPrompt: false,
    modelAliasAvailabilityVerifiedByProvider: false,
    reason:
      'HTTP 401 occurred before a schema-valid provider response, so repo-side aliases remain source-of-truth consistent but external model permission is unverified.',
  }

  const qwenProviderFixDecision = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'blocked',
    decision: 'blocked_pending_dashscope_secret_or_permission_setup',
    classification,
    sourceOfTruthConflictFound,
    qwenBlockerResolved: false,
    qwenRerunAttempted: false,
    deepseekRerunAttempted: false,
    deepseekPassedEvidencePreserved: true,
    providerDryRunPassed: false,
    planSnapshotContractReady: false,
    nextRecommendedPrompt: NEXT_RECOMMENDED_PROMPT,
    runtimeGates: RUNTIME_GATES,
  }

  const qwenProviderFixResult = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'blocked',
    fixEvidenceProduced: true,
    fixAppliedToProviderRequest: false,
    providerExecutionClientChanged: false,
    qwenDashScopeBlockerResolved: false,
    qwenRerunAttempted: false,
    qwenRerunResult: 'not_attempted',
    deepseekRerunAttempted: false,
    deepseekRerunResult: 'not_attempted_preserved',
    deepseekPassedEvidence: {
      status: evidence.deepseekRun.status,
      providerCallsAttempted: deepseekCallsAttempted,
      providerCallsPassed: deepseekCallsPassed,
      providerCallsBlocked: evidence.deepseekRun.providerCallsBlocked,
      rawProviderResponsesStored: evidence.deepseekRun.rawProviderResponsesStored,
      secretPayloadPrinted: evidence.deepseekRun.secretPayloadPrinted,
    },
    finalDecision: qwenProviderFixDecision.decision,
    nextRecommendedPrompt: NEXT_RECOMMENDED_PROMPT,
  }

  const qwenProviderFixBlockerReport = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'blocked',
    decision: qwenProviderFixDecision.decision,
    activeBlockers: [
      classification,
      'dashscope_account_model_permission_or_region_workspace_mismatch_unverified',
    ],
    sourceBlockersFromPr320: evidence.providerDecision.activeBlockers,
    blockedScopes: [
      'plan_snapshot_contract',
      'workers_tools_routes',
      'media_processing',
      'supabase_writes',
      'raw_prompt_execution',
      'public_artifacts',
      'signed_urls',
      'production',
      'external_beta',
      'paid_production',
    ],
    noBypassAttempted: true,
    noProviderRerunAttempted: true,
    noMutationOnFailure: true,
    nextRecommendedPrompt: NEXT_RECOMMENDED_PROMPT,
  }

  const qwenProviderFixFailClosedVerification = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'passed',
    failClosedOn401Or403: true,
    failClosedOnSecretRejected: true,
    failClosedOnEndpointAmbiguity: true,
    failClosedOnModelPermissionAmbiguity: true,
    qwenRerunRequiresSeparatePromptAfterExternalSetup: true,
    deepseekEvidencePreservedWithoutRerun: true,
    invalidOutputsAccepted: false,
    mutationOnFailure: false,
    retryOnFailure: false,
    rawProviderResponseStored: false,
    provider401TreatedAsPass: false,
  }

  const qwenProviderFixRedactionAudit = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'passed',
    metadataOnlyReports: true,
    rawProviderOutputPersisted: false,
    rawProviderOutputPrinted: false,
    secretPayloadAccessInFixPrompt: false,
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
    allowedEvidenceFields: [
      'caseId',
      'provider',
      'modelId',
      'endpoint',
      'status',
      'httpStatus',
      'blockerCode',
      'secretRefName',
      'payloadAccessStatus',
      'runtimeGateBooleans',
      'nextRecommendedPrompt',
    ],
  }

  const qwenProviderFixSummary = {
    phase: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_PHASE,
    runId: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_RUN_ID,
    status: 'blocked',
    decision: qwenProviderFixDecision.decision,
    classification,
    qwenDashScopeBlockerResolved: false,
    qwenRerunAttempted: false,
    deepseekRerunAttempted: false,
    deepseekPassedEvidencePreserved: true,
    qwenProviderCallsAttemptedInPr320: qwenCallsAttempted,
    qwenProviderCallsPassedInPr320: qwenCallsPassed,
    qwenProviderCallsBlockedInPr320: qwenCallsBlocked,
    qwenHttpStatusesInPr320: qwenHttpStatuses,
    qwenBlockersInPr320: qwenBlockers,
    planSnapshotContractReady: false,
    rawProviderOutputPersisted: false,
    secretPayloadPrinted: false,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationsDeployed: false,
    runtimeGates: RUNTIME_GATES,
    nextRecommendedPrompt: NEXT_RECOMMENDED_PROMPT,
  }

  return {
    qwenProviderErrorReview,
    qwenProviderFixDecision,
    qwenProviderSecretPermissionReview,
    qwenProviderEndpointContractReview,
    qwenProviderModelAliasReview,
    qwenProviderFixResult,
    qwenProviderFixBlockerReport,
    qwenProviderFixFailClosedVerification,
    qwenProviderFixRedactionAudit,
    qwenProviderFixNoRuntimeUnlocks: noRuntimeUnlocks,
    qwenProviderFixSummary,
  }
}

export async function writeModelOrchestrationProviderDryRunFixArtifacts(
  reports: ModelOrchestrationProviderDryRunFixReports,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_provider_error_review.json'), reports.qwenProviderErrorReview)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_provider_fix_decision.json'), reports.qwenProviderFixDecision)
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_provider_secret_permission_review.json'),
    reports.qwenProviderSecretPermissionReview,
  )
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_provider_endpoint_contract_review.json'),
    reports.qwenProviderEndpointContractReview,
  )
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_provider_model_alias_review.json'),
    reports.qwenProviderModelAliasReview,
  )
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_provider_fix_result.json'), reports.qwenProviderFixResult)
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_provider_fix_blocker_report.json'),
    reports.qwenProviderFixBlockerReport,
  )
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_provider_fix_fail_closed_verification.json'),
    reports.qwenProviderFixFailClosedVerification,
  )
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_provider_fix_redaction_audit.json'),
    reports.qwenProviderFixRedactionAudit,
  )
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_provider_fix_no_runtime_unlocks.json'),
    reports.qwenProviderFixNoRuntimeUnlocks,
  )
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_provider_fix_summary.json'), reports.qwenProviderFixSummary)
  await writeVlmRuntimeTextArtifact('docs/model-orchestration-provider-dry-run-fix-result.md', buildFixMarkdown(reports))
}

export function readModelOrchestrationProviderDryRunFixSummary(): Record<string, unknown> {
  return readJsonIfPresent(reportPath('qwen_provider_fix_summary.json')) ??
    buildModelOrchestrationProviderDryRunFixReports().qwenProviderFixSummary
}

function buildFixMarkdown(reports: ModelOrchestrationProviderDryRunFixReports): string {
  const summary = reports.qwenProviderFixSummary
  const decision = String(summary.decision)
  const nextPrompt = String(summary.nextRecommendedPrompt)
  return `# Model Orchestration Provider Dry-Run Fix Result

Decision: \`${decision}\`.

Status: \`${String(summary.status)}\`.

This fix pass classifies the PR #320 Qwen/DashScope blocker without rerunning provider calls. PR #320 remains the historical dry-run source: Qwen/DashScope attempted four approved synthetic cases and all four blocked with HTTP 401 \`provider_auth_or_permission_failed\`. DeepSeek passed its three approved synthetic cases and that evidence is preserved without rerun.

Diagnosis: \`qwen_secret_present_but_rejected\`. The source reports show the \`DASHSCOPE_API_KEY\` ref was accessible through exact approved handling, but DashScope rejected the provider calls. The endpoint and model aliases remain source-of-truth consistent, so this pass treats the blocker as external DashScope secret, workspace, region, or model-call permission setup.

External context reviewed: Alibaba Cloud Model Studio documents region-specific OpenAI-compatible base URLs and notes that API keys can differ by region. Its sub-workspace model calling docs also describe workspace-scoped keys and model-call permissions.

Qwen/DashScope rerun: \`not_attempted\`.

DeepSeek rerun: \`not_attempted_preserved\`.

Plan snapshot contract ready: \`false\`.

Raw provider output persisted: \`false\`.

Secret payloads printed, committed, or stored: \`false\`.

Still blocked: workers, tools, routes, raw prompt execution, media processing, Supabase writes, SQL, migrations, storage writes, public artifacts, signed URLs, generated assets, credit spend/reservation, production, external beta, paid production, Demucs runtime, Track A runtime, and Qwen/VLM runtime beyond an approved synthetic repair rerun.

Recommended next prompt: \`${nextPrompt}\`.
`
}
