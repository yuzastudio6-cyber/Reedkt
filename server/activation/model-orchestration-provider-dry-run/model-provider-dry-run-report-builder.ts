import {
  MODEL_PROVIDER_DRY_RUN_BASE_BRANCH,
  MODEL_PROVIDER_DRY_RUN_BRANCH,
  MODEL_PROVIDER_DRY_RUN_DOC_RESULTS_PATH,
  MODEL_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
  MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX,
  MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX,
  MODEL_PROVIDER_DRY_RUN_PR_TITLE,
  MODEL_PROVIDER_DRY_RUN_REPORT_DIR,
  MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV,
  MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV_VALUES,
} from './model-provider-dry-run-policy'
import type { ModelProviderDryRunDecision, ModelProviderDryRunReports, ModelProviderDryRunStatus } from './model-provider-dry-run-types'

const BASE_GAPS = [
  'scripts/validation/run-foundation-validation.mjs',
  'docs/implementation-prompts/README.md',
]

const NO_SCOPE_STATEMENT =
  'No real user data, raw media, signed URLs, private URLs, provider chaining, tools, workers, routes, browser capture, map rendering, media processing, public artifacts, production, or external beta unlocks are allowed.'

export function buildReadinessReport(input: {
  runId: string
  execute: boolean
  status: ModelProviderDryRunStatus
  decision: ModelProviderDryRunDecision
  blockers: string[]
  warnings: string[]
}) {
  return {
    phase: 'MODEL_DRYRUN_1',
    runId: input.runId,
    status: input.status,
    decision: input.decision,
    executeMode: input.execute,
    productionCapabilityEnabled: input.execute
      ? 'none; Qwen/DeepSeek synthetic provider dry-run execution only'
      : 'none; Qwen/DeepSeek synthetic provider dry-run report only',
    qwenModel: 'qwen3.7-plus',
    deepseekModel: 'deepseek-v4-flash',
    escalationModelsUsed: false,
    syntheticOnly: true,
    userDataUsed: false,
    rawMediaUsed: false,
    providerChainingUsed: false,
    toolExecutionUsed: false,
    workerExecutionUsed: false,
    routeExecutionUsed: false,
    browserCaptureUsed: false,
    mapRenderingUsed: false,
    mediaProcessingUsed: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawProviderResponsesCommitted: false,
    secretPayloadsPrinted: false,
    secretPayloadsCommitted: false,
    supabaseUpdateRequired: input.execute ? 'optional approved milestone sync only' : 'docs/status only',
    supabaseUpdateStatus: input.decision === 'partial_supabase_milestone_sync_unavailable'
      ? 'approved_path_unavailable'
      : 'docs_only',
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    productionUnlocked: false,
    externalBetaUnlocked: false,
    blockers: input.blockers,
    warnings: input.warnings,
    nextRecommendedPrompt: input.status === 'passed' || input.status === 'partial'
      ? 'MODEL-DRYRUN-2 - Provider Response Integration Gate'
      : 'MODEL-DRYRUN-1A - Qwen/DeepSeek Dry-Run Gate Fixes',
  }
}

export function buildSupabaseMilestoneSyncReport(execute: boolean) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: execute ? 'skipped' : 'skipped',
    syncStatus: execute ? 'approved_path_unavailable' : 'report_only_not_attempted',
    approvedPathDiscovered: false,
    supabaseEnvironmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    unrelatedRowsTouched: false,
    blocker: execute
      ? 'approved_modeldryrun1_supabase_milestone_sync_path_not_found_on_base_branch'
      : 'report_only_supabase_sync_not_attempted',
  }
}

export function buildFailClosedReport(input: {
  sourceAuthorization: boolean
  envPassed: boolean
  requestRedactionPassed: boolean
  secretsPassed: boolean
  providerCallsPassed: boolean
  schemaPassed: boolean
  responseRedactionPassed: boolean
  artifactsPassed: boolean
  execute: boolean
  blockers: string[]
}) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: input.blockers.length === 0 ? 'passed' : 'blocked',
    executeMode: input.execute,
    failClosedTriggers: [
      'missing_live_synthetic_provider_authorization',
      'missing_confirmation_env',
      'secret_manager_access_failure',
      'provider_http_error',
      'provider_timeout',
      'invalid_json_response',
      'schema_mismatch',
      'redaction_violation',
      'cost_usage_missing',
      'private_artifact_upload_failure',
      'supabase_sync_path_unavailable_partial_only',
    ],
    gates: {
      sourceAuthorization: input.sourceAuthorization,
      envPassed: input.envPassed,
      requestRedactionPassed: input.requestRedactionPassed,
      secretsPassed: input.secretsPassed,
      providerCallsPassed: input.providerCallsPassed,
      schemaPassed: input.schemaPassed,
      responseRedactionPassed: input.responseRedactionPassed,
      artifactsPassed: input.artifactsPassed,
    },
    blockers: input.blockers,
  }
}

export function buildModelProviderDryRunDocs(reports: ModelProviderDryRunReports) {
  return {
    resultsDoc: buildResultsDoc(reports),
    runbookDoc: buildRunbookDoc(),
    policyDoc: buildPolicyDoc(),
    qaDoc: buildQaDoc(),
    implementationPromptDoc: buildImplementationPromptDoc(reports),
  }
}

export function buildSummaryText(reports: ModelProviderDryRunReports): string {
  const readiness = reports.readinessReport
  return [
    `status=${String(readiness.status)}`,
    `decision=${String(readiness.decision)}`,
    `qwenModel=${String(readiness.qwenModel)}`,
    `deepseekModel=${String(readiness.deepseekModel)}`,
    `supabaseUpdateStatus=${String(readiness.supabaseUpdateStatus)}`,
    `sqlExecuted=${String(readiness.sqlExecuted)}`,
    `migrationDeployed=${String(readiness.migrationDeployed)}`,
  ].join('\n')
}

function buildResultsDoc(reports: ModelProviderDryRunReports): string {
  const readiness = reports.readinessReport
  const blockers = Array.isArray(readiness.blockers) ? readiness.blockers as string[] : []
  const warnings = Array.isArray(readiness.warnings) ? readiness.warnings as string[] : []
  return `# MODEL-DRYRUN-1 Qwen/DeepSeek Synthetic Provider Dry-Run Results

Status: \`${String(readiness.status)}\`

Decision: \`${String(readiness.decision)}\`

Branch: \`${MODEL_PROVIDER_DRY_RUN_BRANCH}\`

Base branch: \`${MODEL_PROVIDER_DRY_RUN_BASE_BRANCH}\`

PR title: \`${MODEL_PROVIDER_DRY_RUN_PR_TITLE}\`

Production capability enabled: \`${String(readiness.productionCapabilityEnabled)}\`

## Scope

- Qwen model: \`qwen3.7-plus\`.
- DeepSeek model: \`deepseek-v4-flash\`.
- Escalation models used: \`false\`.
- Synthetic cases only: \`true\`.
- Secret payloads printed or committed: \`false\`.
- Raw provider responses committed: \`false\`.
- Private artifact prefixes, execute mode only: \`${MODEL_PROVIDER_DRY_RUN_GCS_GENERATED_PREFIX}\` and \`${MODEL_PROVIDER_DRY_RUN_GCS_QA_PREFIX}\`.

## Supabase Status

- Supabase update required: \`${String(readiness.supabaseUpdateRequired)}\`.
- Supabase update status: \`${String(readiness.supabaseUpdateStatus)}\`.
- Supabase environment touched: \`${String(readiness.supabaseEnvironmentTouched)}\`.
- SQL executed: \`${String(readiness.sqlExecuted)}\`.
- Migration deployed: \`${String(readiness.migrationDeployed)}\`.

## Blockers

${blockers.length > 0 ? blockers.map((item) => `- \`${item}\``).join('\n') : '- None recorded.'}

## Warnings

${warnings.length > 0 ? warnings.map((item) => `- \`${item}\``).join('\n') : '- None recorded.'}

## Reports

${MODEL_PROVIDER_DRY_RUN_EXPECTED_REPORTS.map((file) => `- \`${MODEL_PROVIDER_DRY_RUN_REPORT_DIR}/${file}\``).join('\n')}

## Base Gaps

${BASE_GAPS.map((file) => `- \`${file}\`: absent on this base branch; recorded as a base gap, not fabricated.`).join('\n')}

## No-Scope Statement

${NO_SCOPE_STATEMENT}
`
}

function buildRunbookDoc(): string {
  const envRows = MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV
    .map((name) => `- \`${name}\` must equal \`${MODEL_PROVIDER_DRY_RUN_REQUIRED_ENV_VALUES[name]}\`.`)
    .join('\n')
  return `# Qwen/DeepSeek Synthetic Provider Dry-Run Runbook

Default commands are static/report-only and must not access provider APIs or Secret Manager payloads.

## Static Commands

- \`npm run smoke:activation-model-provider-dry-run\`
- \`npm run activation:model-provider-dry-run:report\`
- \`npm run activation:model-provider-dry-run:iam-plan\`
- \`npm run activation:model-provider-dry-run:summary\`

## Execute Gate

Execution requires \`--execute\` plus every confirmation below:

${envRows}

The execute command is:

\`\`\`sh
GCP_PROJECT_ID=reeditpro \\
GCP_REGION=us-central1 \\
REEDITPRO_ENV=staging \\
REEDITPRO_CONFIRM_QWEN_DEEPSEEK_PROVIDER_DRY_RUN=true \\
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true \\
npm run activation:model-provider-dry-run -- --execute
\`\`\`

## Boundaries

${NO_SCOPE_STATEMENT}
`
}

function buildPolicyDoc(): string {
  return `# Qwen/DeepSeek Synthetic Provider Dry-Run Policy

MODEL-DRYRUN-1 is fail-closed by default.

- Provider calls require the PR #318 approval packet plus explicit execution confirmations.
- \`DASHSCOPE_API_KEY\` and \`DEEPSEEK_API_KEY\` are resolved only through Google Cloud Secret Manager in the server-side execution process.
- Secret payloads are never printed, committed, or included in JSON reports.
- Prompts and cases are synthetic and non-sensitive.
- Raw provider responses are process-local only; committed evidence stores schema status and normalized key summaries.
- Private artifact upload is allowed only to the approved staging GCS prefixes in execute mode.
- Supabase milestone sync may use only an existing approved path; no SQL, migrations, schema/RLS changes, or unrelated rows are allowed.
`
}

function buildQaDoc(): string {
  return `# Qwen/DeepSeek Synthetic Provider Dry-Run QA Policy

QA checks for MODEL-DRYRUN-1:

- Approval packet present and passed.
- Confirmation env values match the runbook exactly.
- Synthetic request redaction passes.
- Secret Manager payload access succeeds without logging payloads.
- Qwen and DeepSeek responses parse as JSON objects.
- Responses match the schema contracts for \`agent_findings_v1\` and \`coding_spec_proposal_v1\`.
- Safety booleans remain false.
- Redaction checks pass on normalized response summaries.
- Cost/usage metadata is normalized without production billing claims.
- Private artifact upload succeeds in execute mode.
- Supabase sync is either passed through an approved path or recorded as unavailable partial status.
`
}

function buildImplementationPromptDoc(reports: ModelProviderDryRunReports): string {
  const readiness = reports.readinessReport
  return `# Prompt MODEL-DRYRUN-1 - Qwen/DeepSeek Synthetic Provider Dry-Run

Implementation branch: \`${MODEL_PROVIDER_DRY_RUN_BRANCH}\`

Base branch: \`${MODEL_PROVIDER_DRY_RUN_BASE_BRANCH}\`

Status: \`${String(readiness.status)}\`

Decision: \`${String(readiness.decision)}\`

Files inspected included \`model-routing-policy.md\`, \`provider-prompt-architecture.md\`, PR #318 approval reports, Qwen/DeepSeek audit reports, package scripts, activation CLIs, and existing smoke/report conventions.

Created package:

- Server module: \`server/activation/model-orchestration-provider-dry-run/\`.
- Reports: \`${MODEL_PROVIDER_DRY_RUN_REPORT_DIR}/\`.
- Results doc: \`${MODEL_PROVIDER_DRY_RUN_DOC_RESULTS_PATH}\`.

Base gaps recorded:

${BASE_GAPS.map((file) => `- \`${file}\``).join('\n')}

No-scope statement: ${NO_SCOPE_STATEMENT}
`
}
