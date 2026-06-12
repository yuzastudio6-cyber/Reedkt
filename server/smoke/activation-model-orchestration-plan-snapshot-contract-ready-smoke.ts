import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_REPORT_DIR,
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_RESULT_DOC,
  buildModelOrchestrationPlanSnapshotContractReadyReports,
} from '../activation/model-orchestration-plan-snapshot-contract/contract-ready'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
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

function assertNoForbiddenText(source: string, label: string): void {
  for (const forbidden of [
    /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /supabase\.co/i,
    new RegExp(`x-goog-${'signature'}|x-amz-${'signature'}|${'signature'}=|x-goog-${'credential'}|x-amz-${'credential'}`, 'i'),
    /authorization\s*[:=]\s*bearer/i,
    new RegExp(`${'raw_provider'}_${'response_body'}|${'rawProvider'}${'ResponseBody'}|${'provider_response'}_${'payload'}|${'providerResponse'}${'Payload'}`, 'i'),
    /"rawProviderResponses?Stored"\s*:\s*true/i,
    /"rawProviderOutputPersisted"\s*:\s*true/i,
    /"rawProviderOutputPrinted"\s*:\s*true/i,
    /"modelGeneratedContentStored"\s*:\s*true/i,
    /"secretPayloadPrinted"\s*:\s*true/i,
    /"secretPayloadCommitted"\s*:\s*true/i,
    /"secretValueStoredInReports"\s*:\s*true/i,
    /"providerCallsInThisPrompt"\s*:\s*true/i,
    /"providerSecretPayloadAccess"\s*:\s*true/i,
    /"supabaseWrites"\s*:\s*true/i,
    /"sqlExecuted"\s*:\s*true/i,
    /"migrationsDeployed"\s*:\s*true/i,
    /"workerExecution"\s*:\s*true/i,
    /"toolExecution"\s*:\s*true/i,
    /"routeExecution"\s*:\s*true/i,
    /"rawPromptExecution"\s*:\s*true/i,
    /"mediaProcessing"\s*:\s*true/i,
    /"publicArtifacts"\s*:\s*true/i,
    /"signedUrls"\s*:\s*true/i,
    /"generatedAssets"\s*:\s*true/i,
    /"production"\s*:\s*true/i,
    /"externalBeta"\s*:\s*true/i,
    /"paidProduction"\s*:\s*true/i,
  ]) {
    assert(!forbidden.test(source), `Forbidden pattern found in ${label}`)
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
assert(
  packageJson.scripts?.['activation:model-orchestration-plan-snapshot-contract-ready:report'] ===
    'tsx server/cli/activation-model-orchestration-plan-snapshot-contract-ready-report.ts',
  'Missing plan snapshot contract ready report script.',
)
assert(
  packageJson.scripts?.['activation:model-orchestration-plan-snapshot-contract-ready:summary'] ===
    'tsx server/cli/activation-model-orchestration-plan-snapshot-contract-ready-summary.ts',
  'Missing plan snapshot contract ready summary script.',
)
assert(
  packageJson.scripts?.['smoke:activation-model-orchestration-plan-snapshot-contract-ready'] ===
    'tsx server/smoke/activation-model-orchestration-plan-snapshot-contract-ready-smoke.ts',
  'Missing plan snapshot contract ready smoke script.',
)

assert(existsSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_REPORT_DIR), 'Ready report dir missing.')
for (const report of MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_REPORT_DIR, report)), `Missing report: ${report}`)
}
assert(existsSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_RESULT_DOC), 'Ready result doc missing.')

const reports = buildModelOrchestrationPlanSnapshotContractReadyReports()
const summary = reports.summary
const providerEvidence = reports.providerEvidenceReconciliation
const schemaReadiness = reports.schemaReadiness
const failClosedReadiness = reports.failClosedReadiness
const approvalGateReadiness = reports.approvalGateReadiness
const workerHandoffReadiness = reports.workerHandoffReadiness
const supabaseBlocker = reports.supabasePersistenceBlocker
const noRuntime = reports.noRuntimeUnlocks

const qwenSummary = readJson('docs/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-reports/qwen_rerun_summary.json')
const deepseekPr320 = readJson('docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json')
const approvalSchemas = readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_output_schema_contracts.json')
const schemaIds = asArray(approvalSchemas.schemas).map(asRecord).map((schema) => String(schema.schemaId))

assert(qwenSummary.qwenProviderCallsPassed === 4, 'PR #329 Qwen must have four passed calls.')
assert(qwenSummary.qwenProviderCallsBlocked === 0, 'PR #329 Qwen must have no blocked calls.')
assert(deepseekPr320.providerCallsPassed === 3, 'PR #320 DeepSeek must have three passed calls.')
assert(schemaIds.includes('agent_findings_v1'), 'agent_findings_v1 schema must be present.')
assert(schemaIds.includes('edit_intents_v1'), 'edit_intents_v1 schema must be present.')
assert(schemaIds.includes('plan_snapshot_candidate_v1'), 'plan_snapshot_candidate_v1 schema must be present.')

assert(providerEvidence.providerEvidenceBlockerResolved === true, 'Provider evidence blocker must be resolved.')
assert(summary.qwenEvidenceAccepted === true, 'Qwen evidence must be accepted.')
assert(summary.deepseekEvidenceAccepted === true, 'DeepSeek evidence must be accepted.')
assert(summary.decision === 'ready_for_plan_snapshot_contract_handoff', 'Current branch must record ready handoff decision.')
assert(summary.contractReadyForHandoff === true, 'Contract must be ready after selective packet integration.')
assert(summary.pr327ContractPacketPresentOnCurrentBranch === true, 'PR #327 packet must be reported present on current branch.')
assert(summary.sourceMismatchResolvedBySelectiveIntegration === true, 'Source mismatch must be resolved by selective integration.')
assert(summary.fullCherryPickPerformedInFixPrompt === false, 'Full PR #327 cherry-pick must remain false.')
assert(summary.disallowedReadinessFilesTouched === false, 'Disallowed readiness files must remain untouched.')
assert(summary.cherryPickAbortedDueDisallowedConflicts === true, 'Cherry-pick abort must be recorded.')
assert(asArray(summary.disallowedCherryPickConflictFiles).includes('docs/beta-readiness-scorecard.md'), 'Readiness scorecard conflict must be recorded.')
assert(asArray(summary.disallowedCherryPickConflictFiles).includes('docs/production-beta-blocker-inventory.md'), 'Production blocker conflict must be recorded.')

assert(schemaReadiness.status === 'passed', 'Schema readiness must pass after PR #327 packet lineage is integrated.')
assert(asRecord(schemaReadiness.requiredSchemas).agent_findings_v1 === true, 'agent_findings_v1 readiness should be true.')
assert(asRecord(schemaReadiness.requiredSchemas).edit_intents_v1 === true, 'edit_intents_v1 readiness should be true.')
assert(asRecord(schemaReadiness.requiredSchemas).plan_snapshot_candidate_v1 === true, 'plan_snapshot_candidate_v1 readiness should be true.')
assert(asRecord(schemaReadiness.requiredSchemas).approved_plan_snapshot_v1 === true, 'approved_plan_snapshot_v1 must be present.')
assert(failClosedReadiness.status === 'passed', 'Fail-closed fixture readiness must pass with PR #327 fixtures.')
assert(approvalGateReadiness.status === 'passed', 'Approval gate readiness must pass.')
assert(workerHandoffReadiness.status === 'passed', 'Worker handoff readiness must pass.')
assert(approvalGateReadiness.approvedPlanSnapshotPersistenceReady === false, 'Approved snapshot persistence must not be ready.')
assert(workerHandoffReadiness.workerExecutionReady === false, 'Worker execution must not be ready.')
assert(supabaseBlocker.supabasePersistenceReady === false, 'Supabase persistence must remain blocked.')

const runtimeGates = asRecord(noRuntime.runtimeGates)
for (const [key, value] of Object.entries(runtimeGates)) {
  assert(value === false, `Runtime gate ${key} must remain false.`)
}

assert(
  summary.nextRecommendedPrompt ===
    'WORKER-RUNTIME-UNLOCK-0: worker runtime unlock repo audit, no execution',
  'Ready handoff must recommend the worker runtime audit prompt.',
)

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_REPORT_DIR),
  {
    file: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_RESULT_DOC,
    text: readFileSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_RESULT_DOC, 'utf8'),
  },
  {
    file: 'server/activation/model-orchestration-plan-snapshot-contract/contract-ready.ts',
    text: readFileSync('server/activation/model-orchestration-plan-snapshot-contract/contract-ready.ts', 'utf8'),
  },
]
for (const { file, text } of corpus) assertNoForbiddenText(text, file)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-plan-snapshot-contract-ready',
  decision: summary.decision,
  providerEvidenceBlockerResolved: summary.providerEvidenceBlockerResolved,
  contractReadyForHandoff: summary.contractReadyForHandoff,
  sourceLineageStatus: summary.sourceLineageStatus,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
