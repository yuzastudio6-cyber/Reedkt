import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR,
  buildModelOrchestrationPlanSnapshotContractReports,
} from '../activation/model-orchestration-plan-snapshot-contract'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) files.push(...readAllFiles(fullPath))
    else files.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return files
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:model-orchestration-plan-snapshot-contract:plan',
  'activation:model-orchestration-plan-snapshot-contract',
  'activation:model-orchestration-plan-snapshot-contract:report',
  'activation:model-orchestration-plan-snapshot-contract:summary',
  'smoke:activation-model-orchestration-plan-snapshot-contract',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/model-orchestration-plan-snapshot-contract/index.ts'), 'Plan snapshot contract module missing.')
assert(!existsSync('server/workers/model-orchestration-plan-snapshot-contract'), 'Plan snapshot contract must not add a worker.')
assert(!existsSync('server/routes/model-orchestration-plan-snapshot-contract.ts'), 'Plan snapshot contract must not add a route.')
assert(existsSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR), 'Plan snapshot contract report dir missing.')
for (const report of MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/model-orchestration-plan-snapshot-contract.md',
  'docs/model-orchestration-agent-findings-schema.md',
  'docs/model-orchestration-edit-intents-schema.md',
  'docs/model-orchestration-plan-snapshot-candidate-schema.md',
  'docs/model-orchestration-approved-plan-snapshot-schema.md',
  'docs/model-orchestration-approval-gate-worker-handoff-policy.md',
  'docs/model-orchestration-plan-snapshot-contract-decision.md',
  'docs/implementation-prompts/prompt-model-orchestration-plan-snapshot-dry-run-validation.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildModelOrchestrationPlanSnapshotContractReports()
const readiness = reports.readinessReport as Record<string, unknown>
assert(readiness.status === 'passed', 'Plan snapshot contract should pass after reconciled PR #322 and PR #320 provider evidence.')
assert(
  readiness.decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
  'Current contract decision must approve the plan snapshot dry-run validation handoff.',
)
assert(readiness.planSnapshotContractReady === true, 'Plan snapshot contract should be ready after green provider evidence reconciliation.')

const evidence = reports.evidenceInventory as Record<string, unknown>
assert(evidence.providerEvidencePassed === true, 'Provider evidence should pass after PR #322 Qwen and PR #320 DeepSeek reconciliation.')
assert(
  Array.isArray(evidence.providerEvidenceBlockers) &&
  evidence.providerEvidenceBlockers.length === 0,
  'Provider evidence blockers must be empty after reconciliation.',
)
assert(
  Array.isArray(evidence.providerEvidenceBlockers) &&
  !evidence.providerEvidenceBlockers.includes('pr320_deepseek_provider_dry_run_not_passed'),
  'Remote PR #320 DeepSeek evidence should reconcile as passed.',
)

const reconciliation = reports.providerEvidenceReconciliation as Record<string, unknown>
assert(reconciliation.status === 'passed', 'Reconciliation should pass after Qwen and DeepSeek evidence are green.')
assert(reconciliation.finalReconciledQwenStatus === 'passed', 'Qwen should pass from committed PR #322 evidence.')
assert(reconciliation.finalReconciledDeepSeekStatus === 'passed_remote_pr320', 'DeepSeek should pass from remote PR #320 evidence.')
assert((reconciliation.qwenEvidence as Record<string, unknown>).selectedAlias === 'qwen-plus', 'Qwen selected alias must remain qwen-plus.')
assert(
  (reconciliation.qwenEvidence as Record<string, unknown>).workingBaseUrlClassification === 'virginia_dashscope_base_url',
  'Qwen working base URL must be classified as Virginia DashScope.',
)
assert((reconciliation.qwenEvidence as Record<string, unknown>).allSchemaCasesPassed === true, 'All Qwen schema cases must pass.')
assert((reconciliation.qwenEvidence as Record<string, unknown>).providerTimeoutPresent === false, 'Qwen provider timeout must be absent.')
assert((reconciliation.deepseekEvidence as Record<string, unknown>).deepseekEvidencePassed === true, 'DeepSeek evidence must pass.')
assert(reconciliation.proseOnlyProviderPassClaimsAccepted === false, 'Prose-only provider pass claims must not be accepted.')

const validation = reports.validationReport as Record<string, unknown>
assert(validation.status === 'passed', 'Schema fixture validation should pass.')
assert(validation.validFixturesPassed === true, 'Valid fixtures must pass.')
assert(validation.invalidFixturesFailedClosed === true, 'Invalid fixtures must fail closed.')
assert(validation.executionFlagsBlocked === true, 'Execution flags must remain blocked.')

for (const schemaReport of [
  reports.agentFindingsSchema,
  reports.editIntentsSchema,
  reports.planSnapshotCandidateSchema,
  reports.approvedPlanSnapshotSchema,
] as Record<string, unknown>[]) {
  assert(schemaReport.failClosedOnValidationError === true, 'Schemas must fail closed on validation error.')
  assert(schemaReport.runtimeExecutionAllowedInThisPhase === false, 'Schemas must not allow runtime execution.')
}

const policy = reports.approvalHandoffPolicy as Record<string, unknown>
assert(policy.providerOutputCanExecute === false, 'Provider output must not execute.')
assert(policy.agentFindingsCanExecute === false, 'Agent findings must not execute.')
assert(policy.editIntentsCanExecute === false, 'Edit intents must not execute.')
assert(policy.planSnapshotCandidateCanExecute === false, 'Plan snapshot candidates must not execute.')
assert(policy.futureWorkerExecutionRequiresSeparateApproval === true, 'Worker handoff must require separate approval.')
assert((policy.sourceOfTruthPolicy as Record<string, unknown>).signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source of truth.')

for (const [key, expected] of Object.entries({
  providerCalls: false,
  secretPayloadAccess: false,
  supabaseWrites: false,
  workerExecution: false,
  toolExecution: false,
  routeExecution: false,
  rawPromptExecution: false,
  mediaProcessing: false,
  publicArtifacts: false,
  signedUrls: false,
  productionAffected: false,
  externalBeta: false,
  paidProduction: false,
})) {
  assert(readiness[key] === expected, `${key} must remain ${expected}.`)
}

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR),
  ...[
    'docs/model-orchestration-plan-snapshot-contract.md',
    'docs/model-orchestration-agent-findings-schema.md',
    'docs/model-orchestration-edit-intents-schema.md',
    'docs/model-orchestration-plan-snapshot-candidate-schema.md',
    'docs/model-orchestration-approved-plan-snapshot-schema.md',
    'docs/model-orchestration-approval-gate-worker-handoff-policy.md',
    'docs/model-orchestration-plan-snapshot-contract-decision.md',
    'docs/implementation-prompts/prompt-model-orchestration-plan-snapshot-dry-run-validation.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    /"providerCalls"\s*:\s*true/,
    /"secretPayloadAccess"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"workerExecution"\s*:\s*true/,
    /"toolExecution"\s*:\s*true/,
    /"routeExecution"\s*:\s*true/,
    /"rawPromptExecution"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"productionAffected"\s*:\s*true/,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    new RegExp('BEGIN ' + 'PRIVATE KEY'),
    new RegExp('x-goog-' + 'signature=', 'i'),
    new RegExp('AKIA' + '[0-9A-Z]{16}'),
    new RegExp('sk-' + '[A-Za-z0-9]{20,}'),
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-plan-snapshot-contract',
  decision: readiness.decision,
  evidenceGate: evidence.status,
  schemaValidation: validation.status,
  providerCalls: false,
  secretPayloadAccess: false,
  runtimeExecution: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
