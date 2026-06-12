import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/plan-snapshot/approved-plan-snapshot-contract.md',
  'docs/plan-snapshot/approved-plan-snapshot-schema.md',
  'docs/plan-snapshot/provider-findings-to-plan-snapshot-map.md',
  'docs/plan-snapshot/capability-routing-fields.md',
  'docs/plan-snapshot/tool-selection-scoring-policy.md',
  'docs/plan-snapshot/edit-intent-contract.md',
  'docs/plan-snapshot/artifact-scope-contract.md',
  'docs/plan-snapshot/worker-tool-route-gate-contract.md',
  'docs/plan-snapshot/model-dryrun-2a-evidence-reconciliation.md',
  'docs/plan-snapshot/internal-beta-plan-snapshot-gap-map.md',
  'docs/prompt-plan-snapshot-0-validation-results.md',
  'docs/implementation-prompts/prompt-plan-snapshot-0-approved-plan-snapshot-contract.md',
]

const summaryFile = 'docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2a_summary.json'

const requiredSchemaFields = [
  'planSnapshotId',
  'sourceRequestRef',
  'providerDryRunEvidenceRefs',
  'providerFindings',
  'requestedCapabilities',
  'candidateToolRefs',
  'selectedToolPlan',
  'toolReadinessRequirements',
  'editIntents',
  'artifactScopes',
  'privateArtifactManifestRefs',
  'checksumRequirements',
  'SupabaseRecordPlaceholders',
  'GcsPrivatePathPlaceholders',
  'workerExecutionGate',
  'toolRouteExecutionGate',
  'providerExecutionGate',
  'QARequirements',
  'observabilityRequirements',
  'cleanupRollbackRequirements',
  'blockedUses',
  'approvalState',
  'nextGate',
  'provenance',
]

const requiredApprovalStates = [
  'draft_plan_snapshot',
  'ready_for_owner_review',
  'approved_for_dry_run_only',
  'approved_for_controlled_private_sample',
  'blocked_pending_contract_fixes',
  'blocked_pending_workstream_gates',
]

const requiredFalseBooleans = [
  'workerExecutionApproved',
  'toolExecutionApproved',
  'routeExecutionApproved',
  'providerRuntimeApproved',
  'supabaseMutationApproved',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const requiredBaseGaps = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat/',
  'docs/runtime-unlock/',
  '.github/workflows/',
  'scripts/validation/run-foundation-validation.mjs',
]

const exactSourceOfTruth = 'Supabase row + private GCS path + manifest + checksum + approved plan snapshot'

const errors = []

function filePath(file) {
  return path.join(root, file)
}

function read(file) {
  return readFileSync(filePath(file), 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

for (const file of requiredDocs) {
  if (!existsSync(filePath(file))) errors.push(`missing_required_doc:${file}`)
}

if (!existsSync(filePath(summaryFile))) {
  errors.push(`missing_summary:${summaryFile}`)
}

const packageJson = existsSync(filePath('package.json')) ? readJson('package.json') : { scripts: {} }
if (packageJson.scripts?.['plan-snapshot:contract:diagnostics'] !== 'node scripts/validation/plan-snapshot-contract-diagnostics.mjs') {
  errors.push('missing_package_script:plan-snapshot:contract:diagnostics')
}

const summary = existsSync(filePath(summaryFile)) ? readJson(summaryFile) : {}

const expectedSummaryPairs = [
  ['phase', summary.phase, 'MODEL-DRYRUN-2A'],
  ['finalState', summary.finalState, 'provider_dry_run_passed'],
  ['status', summary.status, 'passed'],
  ['qwenDashscopeStatus', summary.retryEvidence?.qwenDashscopeStatus, 'passed'],
  ['deepseekStatus', summary.retryEvidence?.deepseekStatus, 'passed'],
  ['providerCallsAttempted', summary.retryEvidence?.providerCallsAttempted, 7],
  ['totalTokensReported', summary.retryEvidence?.totalTokensReported, 2871],
  ['maxTotalTokens', summary.retryEvidence?.maxTotalTokens, 7200],
  ['costGuardrailStatus', summary.retryEvidence?.costGuardrailStatus, 'passed_by_call_and_token_caps'],
  ['planSnapshotContractReady', summary.retryEvidence?.planSnapshotContractReady, true],
  ['qwenModel', summary.qwenTokenGuardrailControl?.modelId, 'qwen3.7-plus'],
  ['qwenMode', summary.qwenTokenGuardrailControl?.mode, 'non_streaming'],
  ['qwenTimeoutMs', summary.qwenTokenGuardrailControl?.timeoutMs, 45000],
  ['qwenMaxOutputTokens', summary.qwenTokenGuardrailControl?.maxOutputTokens, 650],
  ['qwenEnableThinking', summary.qwenTokenGuardrailControl?.enableThinking, false],
  ['supabaseUpdateRequired', summary.supabaseUpdateRequired, 'docs/status only'],
  ['supabaseUpdateStatus', summary.supabaseUpdateStatus, 'docs_only'],
  ['supabaseEnvironmentTouched', summary.supabaseEnvironmentTouched, 'none'],
  ['sqlExecuted', summary.sqlExecuted, 'none'],
  ['migrationDeployed', summary.migrationDeployed, 'no'],
  ['secretPayloadPrinted', summary.secretPayloadPrinted, false],
  ['secretPayloadCommitted', summary.secretPayloadCommitted, false],
  ['rawProviderResponseCommitted', summary.rawProviderResponseCommitted, false],
  ['rawProviderResponsesStored', summary.rawProviderResponsesStored, false],
  ['signedUrlsCreated', summary.signedUrlsCreated, false],
  ['publicArtifactsCreated', summary.publicArtifactsCreated, false],
  ['workerExecution', summary.workerExecution, false],
  ['toolExecution', summary.toolExecution, false],
  ['routeExecution', summary.routeExecution, false],
  ['productionBetaUnlock', summary.productionBetaUnlock, false],
]

for (const [label, actual, expected] of expectedSummaryPairs) {
  if (actual !== expected) errors.push(`summary_mismatch:${label}:${String(actual)}!=${String(expected)}`)
}

const combinedDocs = requiredDocs
  .filter((file) => existsSync(filePath(file)))
  .map((file) => `\n--- ${file} ---\n${read(file)}`)
  .join('\n')

for (const field of requiredSchemaFields) {
  if (!combinedDocs.includes(field)) errors.push(`missing_schema_field:${field}`)
}

for (const state of requiredApprovalStates) {
  if (!combinedDocs.includes(state)) errors.push(`missing_approval_state:${state}`)
}

for (const bool of requiredFalseBooleans) {
  if (!new RegExp(`"${bool}"\\s*:\\s*false|${bool}:\\s*false`).test(combinedDocs)) {
    errors.push(`missing_false_approval_boolean:${bool}`)
  }
  if (new RegExp(`"${bool}"\\s*:\\s*true|${bool}:\\s*true`).test(combinedDocs)) {
    errors.push(`approval_boolean_true:${bool}`)
  }
}

for (const token of [
  'PLAN-SNAPSHOT-0',
  'ready_for_owner_review',
  'provider_dry_run_passed',
  'qwen3.7-plus',
  'non_streaming',
  '45000ms',
  '650',
  'enable_thinking: false',
  '2871',
  '7200',
  'passed_by_call_and_token_caps',
  'planSnapshotContractReady',
  'privateArtifactUploadStatus: uploaded',
  exactSourceOfTruth,
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'PLAN-SNAPSHOT-1 - Approved Plan Snapshot Dry-Run Fixture Contract',
]) {
  if (!combinedDocs.includes(token)) errors.push(`missing_required_text:${token}`)
}

for (const gap of requiredBaseGaps) {
  if (!combinedDocs.includes(gap)) errors.push(`missing_base_gap:${gap}`)
}

const trackerFiles = ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md']
for (const file of trackerFiles) {
  if (!existsSync(filePath(file))) {
    errors.push(`missing_tracker:${file}`)
    continue
  }
  const body = read(file)
  if (!body.includes('PLAN-SNAPSHOT-0')) errors.push(`tracker_missing_plan_snapshot_0:${file}`)
  if (!body.includes('ready_for_owner_review')) errors.push(`tracker_missing_ready_for_owner_review:${file}`)
  if (!body.includes('blocked_pending_workstream_gates')) errors.push(`tracker_missing_internal_beta_blocker:${file}`)
}

const disallowedPatterns = [
  /workerExecutionApproved["`]?\s*[:=]\s*true/i,
  /toolExecutionApproved["`]?\s*[:=]\s*true/i,
  /routeExecutionApproved["`]?\s*[:=]\s*true/i,
  /providerRuntimeApproved["`]?\s*[:=]\s*true/i,
  /supabaseMutationApproved["`]?\s*[:=]\s*true/i,
  /publicArtifactsApproved["`]?\s*[:=]\s*true/i,
  /signedUrlsApproved["`]?\s*[:=]\s*true/i,
  /rawPromptExecutionApproved["`]?\s*[:=]\s*true/i,
  /internalBetaApproved["`]?\s*[:=]\s*true/i,
  /externalBetaApproved["`]?\s*[:=]\s*true/i,
  /productionApproved["`]?\s*[:=]\s*true/i,
  /sk-[A-Za-z0-9_-]{12,}/,
  /Bearer\s+[A-Za-z0-9._-]{12,}/i,
  /X-Goog-Signature=/i,
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]\s*['"][^'"]+/i,
  /raw provider response (committed|stored|printed):\s*(true|yes|enabled)/i,
  /signed url (created|generated|used as source of truth):\s*(true|yes|enabled)/i,
  /public artifact (created|uploaded|published):\s*(true|yes|enabled)/i,
  /storage transfer (completed|enabled|performed|executed):\s*(true|yes|enabled)/i,
  /supabase mutation (approved|enabled|executed|completed)/i,
  /\bSQL executed:\s*`?(?!none\b)[A-Za-z0-9_/-]+`?/i,
  /production (approved|unlock enabled|deployment completed)/i,
  /external beta (approved|unlock enabled)/i,
]

for (const file of requiredDocs.filter((item) => existsSync(filePath(item)))) {
  const body = read(file)
  for (const pattern of disallowedPatterns) {
    if (pattern.test(body)) errors.push(`unsafe_pattern:${file}:${pattern}`)
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ status: 'failed', errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  planSnapshotContractStatus: 'ready_for_owner_review',
  modelProviderDryrun2aStatus: summary.finalState,
  qwenDashscopeStatus: summary.retryEvidence?.qwenDashscopeStatus,
  deepseekStatus: summary.retryEvidence?.deepseekStatus,
  totalTokensReported: summary.retryEvidence?.totalTokensReported,
  maxTotalTokens: summary.retryEvidence?.maxTotalTokens,
  artifactSourceOfTruth: exactSourceOfTruth,
  supabaseUpdateRequired: summary.supabaseUpdateRequired,
  supabaseUpdateStatus: summary.supabaseUpdateStatus,
  supabaseEnvironmentTouched: summary.supabaseEnvironmentTouched,
  sqlExecuted: summary.sqlExecuted,
  migrationDeployed: summary.migrationDeployed,
  internalBetaState: 'blocked_pending_workstream_gates',
  nextRecommendedPrompt: 'PLAN-SNAPSHOT-1 - Approved Plan Snapshot Dry-Run Fixture Contract',
}, null, 2))
