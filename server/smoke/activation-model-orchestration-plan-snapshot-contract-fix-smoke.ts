import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_REPORT_DIR,
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_RESULT_DOC,
  buildModelOrchestrationPlanSnapshotContractFixReports,
} from '../activation/model-orchestration-plan-snapshot-contract/contract-fix'

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
for (const script of [
  'activation:model-orchestration-plan-snapshot-contract:plan',
  'activation:model-orchestration-plan-snapshot-contract:report',
  'activation:model-orchestration-plan-snapshot-contract:summary',
  'smoke:activation-model-orchestration-plan-snapshot-contract',
  'activation:model-orchestration-plan-snapshot-contract-ready:report',
  'activation:model-orchestration-plan-snapshot-contract-ready:summary',
  'smoke:activation-model-orchestration-plan-snapshot-contract-ready',
  'activation:model-orchestration-plan-snapshot-contract-fix:report',
  'activation:model-orchestration-plan-snapshot-contract-fix:summary',
  'smoke:activation-model-orchestration-plan-snapshot-contract-fix',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_REPORT_DIR), 'Fix report dir missing.')
for (const report of MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_REPORT_DIR, report)), `Missing report: ${report}`)
}
assert(existsSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_RESULT_DOC), 'Fix result doc missing.')

const reports = buildModelOrchestrationPlanSnapshotContractFixReports()
const summary = reports.summary
const lineage = reports.sourceLineageFix
const integratedFiles = reports.integratedFiles
const providerEvidence = reports.providerEvidenceAfterFix
const decision = reports.decisionAfterFix
const schemaReadiness = reports.schemaReadinessAfterFix
const failClosed = reports.failClosedReadinessAfterFix
const approvalGate = reports.approvalGateReadinessAfterFix
const workerHandoff = reports.workerHandoffReadinessAfterFix
const supabaseBlocker = reports.supabasePersistenceBlockerAfterFix
const noRuntime = reports.noRuntimeAfterFix
const qwenSummary = readJson('docs/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-reports/qwen_rerun_summary.json')
const deepseek = readJson('docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json')
const pr332Summary = readJson('docs/activation-model-orchestration-plan-snapshot-contract-ready-reports/plan_snapshot_contract_ready_summary.json')

assert(pr332Summary.pr332SourceMismatchReviewed === true, 'PR #332 source mismatch evidence must be preserved.')
assert(lineage.fullPr327CherryPickPerformed === false, 'Full PR #327 cherry-pick must not be performed.')
assert(lineage.selectivePacketIntegrationPerformed === true, 'PR #327 packet must be selectively integrated.')
assert(lineage.disallowedFilesUntouched === true, 'Disallowed files must be untouched.')
assert(asArray(lineage.disallowedChangedFiles).length === 0, 'Disallowed files must not be changed.')
assert(integratedFiles.status === 'passed', 'Integrated file report must pass.')
assert(asArray(integratedFiles.missingIntegratedFiles).length === 0, 'No integrated packet files may be missing.')
assert(qwenSummary.qwenProviderCallsPassed === 4, 'PR #329 Qwen must have four passed calls.')
assert(deepseek.providerCallsPassed === 3, 'PR #320 DeepSeek must have three passed calls.')
assert(providerEvidence.providerEvidenceBlockerResolved === true, 'Provider evidence blocker must be resolved.')
assert(decision.decision === 'ready_for_plan_snapshot_contract_handoff', 'Decision must be ready for handoff.')
assert(summary.contractReadyForHandoff === true, 'Summary must be ready for handoff.')
assert(summary.nextRecommendedPrompt === 'WORKER-RUNTIME-UNLOCK-0: worker runtime unlock repo audit, no execution', 'Unexpected next prompt.')

assert(asRecord(schemaReadiness.requiredSchemas).agent_findings_v1 === true, 'agent_findings_v1 schema must be ready.')
assert(asRecord(schemaReadiness.requiredSchemas).edit_intents_v1 === true, 'edit_intents_v1 schema must be ready.')
assert(asRecord(schemaReadiness.requiredSchemas).plan_snapshot_candidate_v1 === true, 'plan_snapshot_candidate_v1 schema must be ready.')
assert(asRecord(schemaReadiness.requiredSchemas).approved_plan_snapshot_v1 === true, 'approved_plan_snapshot_v1 schema must be ready.')
assert(failClosed.status === 'passed', 'Fail-closed fixtures must pass.')
assert(approvalGate.status === 'passed', 'Approval gate readiness must pass.')
assert(workerHandoff.status === 'passed', 'Worker handoff readiness must pass.')
assert(supabaseBlocker.supabasePersistenceReady === false, 'Supabase persistence must remain blocked.')

const runtimeGates = asRecord(noRuntime.runtimeGates)
for (const [key, value] of Object.entries(runtimeGates)) {
  assert(value === false, `Runtime gate ${key} must remain false.`)
}

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_REPORT_DIR),
  {
    file: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_RESULT_DOC,
    text: readFileSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_RESULT_DOC, 'utf8'),
  },
  {
    file: 'server/activation/model-orchestration-plan-snapshot-contract/contract-fix.ts',
    text: readFileSync('server/activation/model-orchestration-plan-snapshot-contract/contract-fix.ts', 'utf8'),
  },
]
for (const { file, text } of corpus) assertNoForbiddenText(text, file)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-plan-snapshot-contract-fix',
  decision: summary.decision,
  sourceMismatchResolved: summary.sourceMismatchResolved,
  contractReadyForHandoff: summary.contractReadyForHandoff,
  disallowedFilesUntouched: summary.disallowedFilesUntouched,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
