import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR,
  buildProviderOutputPlanSnapshotContractBundle,
} from '../activation/provider-output-plan-snapshot-contract'

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
  'activation:provider-output-plan-snapshot-contract',
  'activation:provider-output-plan-snapshot-contract:report',
  'activation:provider-output-plan-snapshot-contract:summary',
  'smoke:activation-provider-output-plan-snapshot-contract',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/provider-output-plan-snapshot-contract/index.ts',
  'server/activation/provider-output-plan-snapshot-contract/provider-output-plan-snapshot-types.ts',
  'server/activation/provider-output-plan-snapshot-contract/provider-output-evidence-resolver.ts',
  'server/activation/provider-output-plan-snapshot-contract/approved-plan-snapshot-contract-builder.ts',
  'server/activation/provider-output-plan-snapshot-contract/approved-plan-snapshot-contract-validator.ts',
  'docs/model-orchestration/provider-output-plan-snapshot-contract-runbook.md',
  'docs/model-orchestration/provider-output-plan-snapshot-contract-policy.md',
  'docs/activation-phase-provider-output-plan-snapshot-contract-results.md',
]) {
  assert(existsSync(file), `Missing PLAN-SNAPSHOT-1 file: ${file}`)
}

assert(!existsSync('server/workers/provider-output-plan-snapshot-contract'), 'PLAN-SNAPSHOT-1 must not add a worker.')
assert(!existsSync('server/routes/provider-output-plan-snapshot-contract.ts'), 'PLAN-SNAPSHOT-1 must not add a route.')
assert(!existsSync('server/activation/supabase-milestone-sync'), 'This base should not import or add Supabase milestone sync.')

const bundle = buildProviderOutputPlanSnapshotContractBundle({ runId: 'plansnapshot1-smoke' })
assert(bundle.evidenceContext.sourceProviderRunId === 'modeldryrun1-20260612T174538', 'PR #331 evidence run ID must be loaded.')
assert(bundle.evidenceContext.sourceDecision === 'provider_dry_run_passed_ready_for_plan_snapshot_contract', 'PR #331 evidence decision must be loaded.')
assert(bundle.evidenceContext.qwen?.schemaId === 'plan_snapshot_candidate_v1', 'Qwen schema evidence must be loaded.')
assert(bundle.evidenceContext.deepseek?.schemaId === 'agent_findings_v1', 'DeepSeek schema evidence must be loaded.')
assert(bundle.candidateSnapshot.executionStatus === 'candidate_only', 'Snapshot must be candidate only.')
assert(bundle.candidateSnapshot.approvedForRuntime === false, 'Snapshot must not be approved for runtime.')
assert(bundle.candidateSnapshot.workerExecutionAllowed === false, 'Worker execution must be false.')
assert(bundle.candidateSnapshot.toolExecutionAllowed === false, 'Tool execution must be false.')
assert(bundle.candidateSnapshot.routeExecutionAllowed === false, 'Route execution must be false.')
assert(bundle.candidateSnapshot.providerExecutionAllowed === false, 'Provider execution must be false.')
assert(bundle.candidateSnapshot.publicArtifactAllowed === false, 'Public artifacts must be false.')
assert(bundle.candidateSnapshot.signedUrlSourceOfTruthAllowed === false, 'Signed URL source of truth must be false.')
assert(bundle.candidateSnapshot.productionReadyAllowed === false, 'Production readiness must be false.')
assert(bundle.candidateSnapshot.externalBetaAllowed === false, 'External beta must be false.')
assert(bundle.candidateSnapshot.broadMediaAllowed === false, 'Broad media must be false.')
assert(bundle.candidateSnapshot.ownerRoutes.length >= 15, 'Owner routes must be present.')
assert(bundle.workerRuntimeHandoff.nextOwner === 'WORKER_RUNTIME_JOBS', 'Worker Runtime handoff must be present.')
assert(bundle.workerRuntimeHandoff.runtimeReady === false, 'Worker Runtime handoff must not claim runtime readiness.')
assert(bundle.candidateSnapshot.supabaseMilestoneSyncPolicy.status === 'not_attempted_current_branch_missing_sync_layer', 'Supabase sync must be recorded as missing current branch layer.')
assert(bundle.qa.passed === true, 'QA bundle must pass in smoke context.')

const corpus = readAllFiles(PROVIDER_OUTPUT_PLAN_SNAPSHOT_REPORT_DIR)
  .concat([
    'docs/model-orchestration/provider-output-plan-snapshot-contract-runbook.md',
    'docs/model-orchestration/provider-output-plan-snapshot-contract-policy.md',
    'docs/activation-phase-provider-output-plan-snapshot-contract-results.md',
  ].filter(existsSync).map((file) => ({ file, text: readFileSync(file, 'utf8') })))

for (const { file, text } of corpus) {
  for (const forbidden of [
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /bearer\s+[A-Za-z0-9._-]{20,}/i,
    new RegExp(`BEGIN ${'PRIVATE KEY'}`),
    new RegExp(`x-goog-${'signature'}=`, 'i'),
    /AKIA[0-9A-Z]{16}/,
    /sk-[A-Za-z0-9]{20,}/,
    /"approvedForRuntime"\s*:\s*true/,
    /"workerExecutionAllowed"\s*:\s*true/,
    /"toolExecutionAllowed"\s*:\s*true/,
    /"routeExecutionAllowed"\s*:\s*true/,
    /"providerExecutionAllowed"\s*:\s*true/,
    /"publicArtifactAllowed"\s*:\s*true/,
    /"signedUrlSourceOfTruthAllowed"\s*:\s*true/,
    /"productionReadyAllowed"\s*:\s*true/,
    /"externalBetaAllowed"\s*:\s*true/,
    /"rawProviderResponseStored"\s*:\s*true/,
    /"rawProviderResponsesStored"\s*:\s*true/,
    /"rawPromptPayloadsStored"\s*:\s*true/,
    /"secretPayloadsStored"\s*:\s*true/,
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'PLAN_SNAPSHOT_1',
  sourceProviderRunId: bundle.evidenceContext.sourceProviderRunId,
  decision: bundle.summary.decision,
  executionStatus: bundle.candidateSnapshot.executionStatus,
  approvedForRuntime: false,
  providerCallsExecuted: false,
  toolsWorkersRoutesExecuted: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
