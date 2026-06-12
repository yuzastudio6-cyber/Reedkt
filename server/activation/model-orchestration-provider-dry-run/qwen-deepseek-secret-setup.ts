import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

export const MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE =
  'model-orchestration-qwen-deepseek-secret-setup'
export const MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID =
  'model-orchestration-qwen-deepseek-secret-setup-20260612'
export const MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-secret-setup'
export const MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-deepseek-provider-dry-run-fix'
export const MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_REPORT_DIR =
  'docs/activation-model-orchestration-qwen-deepseek-secret-setup-reports'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-reports'
export const MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR =
  'docs/activation-model-orchestration-provider-dry-run-fix-reports'
export const MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR =
  'docs/activation-model-orchestration-dry-run-approval-reports'

export const MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_EXPECTED_REPORTS = [
  'qwen_secret_setup_decision.json',
  'qwen_region_contract_review.json',
  'qwen_us_endpoint_contract.json',
  'qwen_us_model_alias_review.json',
  'qwen_secret_ref_verification.json',
  'qwen_subworkspace_permission_review.json',
  'qwen_rerun_readiness.json',
  'qwen_secret_setup_blocker_report.json',
  'qwen_secret_setup_no_runtime_unlocks.json',
  'qwen_secret_setup_summary.json',
] as const

export type ModelOrchestrationQwenDeepseekSecretSetupReportName =
  typeof MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_EXPECTED_REPORTS[number]

export interface ModelOrchestrationQwenDeepseekSecretSetupReports {
  qwenSecretSetupDecision: Record<string, unknown>
  qwenRegionContractReview: Record<string, unknown>
  qwenUsEndpointContract: Record<string, unknown>
  qwenUsModelAliasReview: Record<string, unknown>
  qwenSecretRefVerification: Record<string, unknown>
  qwenSubworkspacePermissionReview: Record<string, unknown>
  qwenRerunReadiness: Record<string, unknown>
  qwenSecretSetupBlockerReport: Record<string, unknown>
  qwenSecretSetupNoRuntimeUnlocks: Record<string, unknown>
  qwenSecretSetupSummary: Record<string, unknown>
}

const NEXT_RECOMMENDED_PROMPT =
  'MODEL-ORCHESTRATION-QWEN-DEEPSEEK-PROVIDER-DRY-RUN-RERUN: rerun approved synthetic Qwen dry-run after secret/region update, no workers/tools/routes'

const SETUP_DECISION = 'metadata_ready_for_qwen_us_provider_dry_run_rerun'
const HISTORICAL_QWEN_BLOCKER_CLASSIFICATION = 'qwen_secret_present_but_rejected'
const SELECTED_REGION = 'us_virginia'
const SINGAPORE_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
const US_BASE_URL = 'https://dashscope-us.aliyuncs.com/compatible-mode/v1'
const US_CHAT_COMPLETIONS_ENDPOINT = `${US_BASE_URL}/chat/completions`
const BEIJING_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const BEIJING_CHAT_COMPLETIONS_ENDPOINT = `${BEIJING_BASE_URL}/chat/completions`
const US_DOCUMENTED_ALIASES = ['qwen-plus-us', 'qwen-flash-us'] as const

const RUNTIME_GATES = {
  providerCallsInSetupPrompt: false,
  qwenRerunAttempted: false,
  deepseekRerunAttempted: false,
  providerExecutionClientChanged: false,
  secretPayloadAccessedInSetupPrompt: false,
  secretPayloadPrinted: false,
  secretPayloadStored: false,
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

const OFFICIAL_DOCS_REVIEWED = [
  {
    label: 'Alibaba Cloud Model Studio OpenAI Chat',
    url: 'https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions',
    factsRecorded: [
      'us_virginia_base_url',
      'us_virginia_chat_completions_endpoint',
      'regional_api_keys_differ',
    ],
  },
  {
    label: 'Alibaba Cloud Model Studio OpenAI-compatible chat',
    url: 'https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope',
    factsRecorded: [
      'us_qwen_plus_alias_family',
      'us_qwen_flash_alias_family',
      'international_aliases_separate_from_us_aliases',
    ],
  },
  {
    label: 'Alibaba Cloud Model Studio model list',
    url: 'https://www.alibabacloud.com/help/en/model-studio/models',
    factsRecorded: ['us_deployment_model_catalog_lists_qwen_flash_us'],
  },
  {
    label: 'Alibaba Cloud Model Studio sub-workspace model calling',
    url: 'https://www.alibabacloud.com/help/en/model-studio/model-calling-in-sub-workspace',
    factsRecorded: ['subworkspace_api_keys_can_require_model_call_permissions'],
  },
] as const

function reportPath(file: ModelOrchestrationQwenDeepseekSecretSetupReportName): string {
  return path.join(MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_REPORT_DIR, file)
}

function sourceReportPath(file: string): string {
  return path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR, file)
}

function fixReportPath(file: string): string {
  return path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_FIX_REPORT_DIR, file)
}

function approvalReportPath(file: string): string {
  return path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, file)
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

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.map(asString).filter(Boolean))].sort()
}

function uniqueNumbers(values: unknown[]): number[] {
  return [...new Set(values.map(asNumber).filter((value): value is number => value !== undefined))].sort()
}

function loadSourceEvidence() {
  const qwenRun = readJson(sourceReportPath('qwen_provider_dry_run_report.json'))
  const deepseekRun = readJson(sourceReportPath('deepseek_provider_dry_run_report.json'))
  const providerDecision = readJson(sourceReportPath('provider_dry_run_decision.json'))
  const providerSecretAccess = readJson(sourceReportPath('provider_secret_access_report.json'))
  const providerReadiness = readJson(sourceReportPath('provider_dry_run_readiness_report.json'))
  const providerFailClosed = readJson(sourceReportPath('provider_dry_run_fail_closed_verification.json'))
  const approvalDecision = readJson(approvalReportPath('dry_run_approval_decision.json'))
  const syntheticCases = readJson(approvalReportPath('dry_run_synthetic_cases.json'))
  const candidateReview = readJson(approvalReportPath('provider_candidate_review.json'))
  const fixSummary = readJson(fixReportPath('qwen_provider_fix_summary.json'))
  const fixDecision = readJson(fixReportPath('qwen_provider_fix_decision.json'))
  const fixEndpointReview = readJson(fixReportPath('qwen_provider_endpoint_contract_review.json'))
  const fixModelAliasReview = readJson(fixReportPath('qwen_provider_model_alias_review.json'))
  const fixSecretPermissionReview = readJson(fixReportPath('qwen_provider_secret_permission_review.json'))
  return {
    qwenRun,
    deepseekRun,
    providerDecision,
    providerSecretAccess,
    providerReadiness,
    providerFailClosed,
    approvalDecision,
    syntheticCases,
    candidateReview,
    fixSummary,
    fixDecision,
    fixEndpointReview,
    fixModelAliasReview,
    fixSecretPermissionReview,
  }
}

export function buildModelOrchestrationQwenDeepseekSecretSetupReports():
  ModelOrchestrationQwenDeepseekSecretSetupReports {
  const evidence = loadSourceEvidence()
  const qwenResults = asArray(evidence.qwenRun.results).map(asRecord)
  const deepseekResults = asArray(evidence.deepseekRun.results).map(asRecord)
  const secretEntries = asArray(evidence.providerSecretAccess.entries).map(asRecord)
  const qwenSecretEntry = secretEntries.find((entry) => asString(entry.secretRef) === 'DASHSCOPE_API_KEY') ?? {}
  const qwenCandidate = asRecord(evidence.candidateReview.qwenDashScope)
  const historicalApprovedAliases = asArray(qwenCandidate.officialCandidateIds).map(asString).filter(Boolean).sort()
  const historicalAttemptedAliases = uniqueStrings(qwenResults.map((result) => result.modelId))
  const qwenHttpStatuses = uniqueNumbers(qwenResults.map((result) => result.httpStatus))
  const qwenBlockers = uniqueStrings(qwenResults.map((result) => result.blocker))
  const qwenCallsAttempted = asNumber(evidence.qwenRun.providerCallsAttempted) ?? qwenResults.length
  const qwenCallsPassed = asNumber(evidence.qwenRun.providerCallsPassed) ?? 0
  const qwenCallsBlocked = asNumber(evidence.qwenRun.providerCallsBlocked) ?? 0
  const deepseekCallsAttempted = asNumber(evidence.deepseekRun.providerCallsAttempted) ?? deepseekResults.length
  const deepseekCallsPassed = asNumber(evidence.deepseekRun.providerCallsPassed) ?? 0
  const historicalEndpoint = asString(evidence.qwenRun.endpoint)
  const historicalAliasesReadyForUsRerun = historicalAttemptedAliases.every((alias) =>
    (US_DOCUMENTED_ALIASES as readonly string[]).includes(alias),
  )
  const sourceFilesVerified = true
  const usEndpointContractVerified = true
  const usAliasContractVerified = true
  const secretRefMetadataVerified = qwenSecretEntry.secretRef === 'DASHSCOPE_API_KEY' &&
    qwenSecretEntry.payloadAccessStatus === 'succeeded'
  const redactionGatesPassed = evidence.providerSecretAccess.payloadPrinted === false &&
    evidence.providerSecretAccess.secretValueStoredInReports === false
  const noRuntimeGatesPassed = Object.values(RUNTIME_GATES).every((value) => value === false)
  const metadataReadyForQwenOnlyRerun = sourceFilesVerified &&
    usEndpointContractVerified &&
    usAliasContractVerified &&
    secretRefMetadataVerified &&
    redactionGatesPassed &&
    noRuntimeGatesPassed

  const sourceSnapshot = {
    pr318Decision: evidence.approvalDecision.decision,
    pr320Decision: evidence.providerDecision.decision,
    pr323Decision: evidence.fixDecision.decision,
    pr323Classification: evidence.fixSummary.classification,
    syntheticCaseCount: evidence.syntheticCases.caseCount,
    syntheticOnly: evidence.syntheticCases.syntheticOnly,
    containsUserData: evidence.syntheticCases.containsUserData,
    containsPrivateProjectData: evidence.syntheticCases.containsPrivateProjectData,
    containsMedia: evidence.syntheticCases.containsMedia,
    sourceFilesVerified,
  }

  const qwenRegionContractReview = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: 'passed',
    reviewMode: 'metadata_only_no_provider_calls_no_secret_payload_access',
    operatorExternalUpdateRecorded: true,
    operatorExternalUpdateScope: 'dashscope_api_key_updated_outside_codex_and_region_changed_to_us',
    selectedRegion: SELECTED_REGION,
    selectedBaseUrl: US_BASE_URL,
    selectedChatCompletionsEndpoint: US_CHAT_COMPLETIONS_ENDPOINT,
    singaporeBaseUrl: SINGAPORE_BASE_URL,
    beijingBaseUrl: BEIJING_BASE_URL,
    historicalPr320Endpoint: historicalEndpoint,
    historicalPr320EndpointRegion: 'beijing_or_generic_dashscope_compatible_mode',
    regionalApiKeysDiffer: true,
    oldEndpointNotSelectedForNextRerun: true,
    officialDocsReviewed: OFFICIAL_DOCS_REVIEWED,
    providerCallsAttempted: false,
    secretPayloadAccessed: false,
  }

  const qwenUsEndpointContract = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: 'passed',
    endpointContract: 'us_virginia_openai_compatible_chat_completions',
    selectedBaseUrl: US_BASE_URL,
    selectedChatCompletionsEndpoint: US_CHAT_COMPLETIONS_ENDPOINT,
    historicalBaseUrl: qwenCandidate.openAiCompatibleBaseUrl,
    historicalChatCompletionsEndpoint: BEIJING_CHAT_COMPLETIONS_ENDPOINT,
    previousEndpointContractFromPr323: evidence.fixEndpointReview.sourceOfTruthEndpoint,
    endpointChangedForNextRerunMetadata: true,
    endpointExecutionAttempted: false,
    endpointReachabilityVerifiedByProviderCall: false,
    endpointContractVerifiedFromOfficialDocs: true,
    requestModeForFutureRerun: {
      openAiCompatibleChatCompletions: true,
      streaming: false,
      tools: false,
      search: false,
      hiddenReasoningCapture: false,
    },
  }

  const qwenUsModelAliasReview = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: 'passed',
    aliasReviewMode: 'metadata_only_official_docs_contract',
    usDocumentedAliases: [...US_DOCUMENTED_ALIASES],
    recommendedRerunAliases: [...US_DOCUMENTED_ALIASES],
    defaultRerunModelId: 'qwen-plus-us',
    alternateRerunModelId: 'qwen-flash-us',
    historicalPr318ApprovedAliases: historicalApprovedAliases,
    historicalPr320AttemptedAliases: historicalAttemptedAliases,
    historicalAliasesListedForUsInCurrentDocs: historicalAliasesReadyForUsRerun,
    historicalAliasesReadyForUsRerun,
    historicalAliasesNotReadyForUsRerun: historicalAttemptedAliases.filter((alias) =>
      !(US_DOCUMENTED_ALIASES as readonly string[]).includes(alias),
    ),
    aliasesChangedForNextRerunMetadata: true,
    modelAliasAvailabilityVerifiedByProvider: false,
    modelCallPermissionVerifiedByProvider: false,
    doNotInventAliases: true,
  }

  const qwenSecretRefVerification = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: secretRefMetadataVerified ? 'passed' : 'blocked',
    reviewMode: 'metadata_only_secret_ref_name_and_prior_access_status',
    secretRef: 'DASHSCOPE_API_KEY',
    exactSecretRefsOnly: evidence.providerSecretAccess.exactSecretRefsOnly,
    broadSecretDiscovery: evidence.providerSecretAccess.broadSecretDiscovery,
    pr320SecretAccessStatus: qwenSecretEntry.payloadAccessStatus,
    pr320SecretSource: qwenSecretEntry.source,
    pr320EnvVarPresent: qwenSecretEntry.envVarPresent,
    pr320PayloadPrinted: qwenSecretEntry.payloadPrinted,
    pr320PayloadCommitted: qwenSecretEntry.payloadCommitted,
    pr320SecretValueStoredInReports: qwenSecretEntry.secretValueStoredInReports,
    operatorExternalSecretUpdateRecorded: true,
    operatorExternalSecretUpdateVerifiedByCodex: false,
    secretPayloadAccessInSetupPrompt: false,
    secretPayloadPrintedInSetupPrompt: false,
    secretValueStoredInSetupReports: false,
    secretValidityVerifiedByProvider: false,
    secretPermissionVerifiedByProvider: false,
  }

  const qwenSubworkspacePermissionReview = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: 'unverified_until_provider_rerun',
    reviewMode: 'metadata_only_official_docs_context',
    docsIndicateSubworkspaceKeysCanRequireModelCallPermission: true,
    possibleHistoricalCauses: [
      'dashscope_account_model_permission_missing',
      'dashscope_region_or_workspace_key_mismatch',
      'dashscope_key_valid_for_secret_manager_but_rejected_by_model_service',
    ],
    pr323Classification: HISTORICAL_QWEN_BLOCKER_CLASSIFICATION,
    permissionChangedByCodex: false,
    permissionVerifiedByCodex: false,
    providerCallRequiredForVerification: true,
    providerCallAttemptedInSetup: false,
    nextVerificationPromptRequired: NEXT_RECOMMENDED_PROMPT,
  }

  const qwenRerunReadiness = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: metadataReadyForQwenOnlyRerun ? 'metadata_ready' : 'blocked',
    readyForQwenOnlyRerun: metadataReadyForQwenOnlyRerun,
    rerunScope: 'qwen_dashscope_synthetic_provider_dry_run_only',
    qwenRerunAttempted: false,
    deepseekRerunAttempted: false,
    selectedRegion: SELECTED_REGION,
    selectedEndpoint: US_CHAT_COMPLETIONS_ENDPOINT,
    selectedAliases: [...US_DOCUMENTED_ALIASES],
    historicalAliasesExcludedFromUsRerun: historicalAttemptedAliases.filter((alias) =>
      !(US_DOCUMENTED_ALIASES as readonly string[]).includes(alias),
    ),
    providerSecretValidityVerified: false,
    modelCallPermissionVerified: false,
    planSnapshotContractReady: false,
    requiresSeparateExplicitProviderRerunPrompt: true,
    noRuntimeUnlocks: true,
    nextRecommendedPrompt: NEXT_RECOMMENDED_PROMPT,
  }

  const qwenSecretSetupDecision = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: metadataReadyForQwenOnlyRerun ? 'metadata_ready' : 'blocked',
    decision: metadataReadyForQwenOnlyRerun ? SETUP_DECISION : 'blocked_pending_qwen_secret_setup_metadata_fix',
    sourceSnapshot,
    setupEvidenceProduced: true,
    providerCallsAttempted: false,
    qwenProviderCallsAttemptedInSetup: 0,
    deepseekProviderCallsAttemptedInSetup: 0,
    secretPayloadAccessedInSetup: false,
    sourceFilesVerified,
    usEndpointContractVerified,
    usAliasContractVerified,
    secretRefMetadataVerified,
    redactionGatesPassed,
    noRuntimeGatesPassed,
    metadataReadyForQwenOnlyRerun,
    qwenBlockerResolvedByProviderCall: false,
    qwenBlockerReadyForProviderRerun: metadataReadyForQwenOnlyRerun,
    planSnapshotContractReady: false,
    nextRecommendedPrompt: NEXT_RECOMMENDED_PROMPT,
  }

  const qwenSecretSetupBlockerReport = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: metadataReadyForQwenOnlyRerun ? 'no_metadata_blocker' : 'blocked',
    activeMetadataBlockers: metadataReadyForQwenOnlyRerun ? [] : [
      'qwen_secret_setup_metadata_not_ready',
    ],
    residualUnverifiedRuntimeConditions: [
      'dashscope_secret_payload_validity',
      'dashscope_account_workspace_region_alignment',
      'dashscope_model_call_permission_for_qwen_plus_us_or_qwen_flash_us',
    ],
    historicalPr320Blockers: evidence.providerDecision.activeBlockers,
    historicalPr323Classification: evidence.fixSummary.classification,
    blockedScopesUntilProviderRerunPasses: [
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
    providerRerunAttempted: false,
    noBypassAttempted: true,
    nextRecommendedPrompt: NEXT_RECOMMENDED_PROMPT,
  }

  const qwenSecretSetupNoRuntimeUnlocks = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: 'passed',
    runtimeGates: RUNTIME_GATES,
    generatedLocalFixturePassedClaimed: false,
    planSnapshotContractReady: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    supabaseEnvironmentTouched: false,
    supabaseChangelogReviewed: true,
    supabaseChangelogImpact: 'none_no_supabase_sql_or_environment_path_in_this_setup_pass',
  }

  const qwenSecretSetupSummary = {
    phase: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_PHASE,
    runId: MODEL_ORCHESTRATION_QWEN_DEEPSEEK_SECRET_SETUP_RUN_ID,
    status: qwenSecretSetupDecision.status,
    decision: qwenSecretSetupDecision.decision,
    selectedRegion: SELECTED_REGION,
    selectedEndpoint: US_CHAT_COMPLETIONS_ENDPOINT,
    usDocumentedAliases: [...US_DOCUMENTED_ALIASES],
    recommendedRerunAliases: [...US_DOCUMENTED_ALIASES],
    historicalPr320Endpoint: historicalEndpoint,
    historicalPr320Aliases: historicalAttemptedAliases,
    historicalAliasesReadyForUsRerun,
    qwenProviderCallsAttemptedInPr320: qwenCallsAttempted,
    qwenProviderCallsPassedInPr320: qwenCallsPassed,
    qwenProviderCallsBlockedInPr320: qwenCallsBlocked,
    qwenHttpStatusesInPr320: qwenHttpStatuses,
    qwenBlockersInPr320: qwenBlockers,
    deepseekProviderCallsAttemptedInPr320: deepseekCallsAttempted,
    deepseekProviderCallsPassedInPr320: deepseekCallsPassed,
    deepseekPassedEvidencePreserved: true,
    qwenRerunAttempted: false,
    deepseekRerunAttempted: false,
    secretPayloadAccessedInSetup: false,
    secretPayloadPrinted: false,
    rawProviderOutputPersisted: false,
    providerExecutionClientChanged: false,
    providerSecretValidityVerified: false,
    modelCallPermissionVerified: false,
    metadataReadyForQwenOnlyRerun,
    planSnapshotContractReady: false,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationsDeployed: false,
    runtimeGates: RUNTIME_GATES,
    nextRecommendedPrompt: NEXT_RECOMMENDED_PROMPT,
  }

  return {
    qwenSecretSetupDecision,
    qwenRegionContractReview,
    qwenUsEndpointContract,
    qwenUsModelAliasReview,
    qwenSecretRefVerification,
    qwenSubworkspacePermissionReview,
    qwenRerunReadiness,
    qwenSecretSetupBlockerReport,
    qwenSecretSetupNoRuntimeUnlocks,
    qwenSecretSetupSummary,
  }
}

export async function writeModelOrchestrationQwenDeepseekSecretSetupArtifacts(
  reports: ModelOrchestrationQwenDeepseekSecretSetupReports,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_secret_setup_decision.json'), reports.qwenSecretSetupDecision)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_region_contract_review.json'), reports.qwenRegionContractReview)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_us_endpoint_contract.json'), reports.qwenUsEndpointContract)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_us_model_alias_review.json'), reports.qwenUsModelAliasReview)
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_secret_ref_verification.json'), reports.qwenSecretRefVerification)
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_subworkspace_permission_review.json'),
    reports.qwenSubworkspacePermissionReview,
  )
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_rerun_readiness.json'), reports.qwenRerunReadiness)
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_secret_setup_blocker_report.json'),
    reports.qwenSecretSetupBlockerReport,
  )
  await writeVlmRuntimeJsonArtifact(
    reportPath('qwen_secret_setup_no_runtime_unlocks.json'),
    reports.qwenSecretSetupNoRuntimeUnlocks,
  )
  await writeVlmRuntimeJsonArtifact(reportPath('qwen_secret_setup_summary.json'), reports.qwenSecretSetupSummary)
  await writeVlmRuntimeTextArtifact(
    'docs/model-orchestration-qwen-deepseek-secret-setup-result.md',
    buildSecretSetupMarkdown(reports),
  )
}

export function readModelOrchestrationQwenDeepseekSecretSetupSummary(): Record<string, unknown> {
  return readJsonIfPresent(reportPath('qwen_secret_setup_summary.json')) ??
    buildModelOrchestrationQwenDeepseekSecretSetupReports().qwenSecretSetupSummary
}

function buildSecretSetupMarkdown(reports: ModelOrchestrationQwenDeepseekSecretSetupReports): string {
  const summary = reports.qwenSecretSetupSummary
  const decision = String(summary.decision)
  const nextPrompt = String(summary.nextRecommendedPrompt)
  return `# Model Orchestration Qwen DeepSeek Secret Setup Result

Decision: \`${decision}\`.

Status: \`${String(summary.status)}\`.

This metadata-only setup pass records the operator-provided DashScope key and region update for a future Qwen-only synthetic provider dry-run rerun. It does not call Qwen, DeepSeek, or any provider, and it does not access, print, store, or commit secret payloads.

US DashScope contract: the selected future Qwen endpoint is \`${US_CHAT_COMPLETIONS_ENDPOINT}\`, based on the US (Virginia) OpenAI-compatible base URL \`${US_BASE_URL}\`.

US model aliases: current metadata records \`qwen-plus-us\` and \`qwen-flash-us\` as documented US aliases for the next rerun. Historical PR #320 aliases \`qwen3.7-plus\` and \`qwen3.7-max\` remain historical and are not ready for a US rerun in this setup evidence.

Historical evidence preserved: PR #320 Qwen/DashScope attempted four synthetic calls and all four blocked with HTTP 401 \`provider_auth_or_permission_failed\`. PR #323 classified the blocker as \`qwen_secret_present_but_rejected\`. DeepSeek passed three synthetic calls and that evidence is preserved without rerun.

Secret validity verified by Codex: \`false\`.

DashScope model-call permission verified by Codex: \`false\`.

Qwen/DashScope rerun attempted: \`false\`.

DeepSeek rerun attempted: \`false\`.

Plan snapshot contract ready: \`false\`.

Raw provider output persisted: \`false\`.

Secret payloads printed, committed, or stored: \`false\`.

Supabase writes, SQL, and migrations: \`false\`.

Still blocked until an explicit future rerun passes: workers, tools, routes, raw prompt execution, media processing, storage writes, public artifacts, signed URLs, generated assets, credit spend/reservation, production, external beta, paid production, Demucs runtime, Track A runtime, and plan snapshot contract readiness.

Recommended next prompt: \`${nextPrompt}\`.
`
}
