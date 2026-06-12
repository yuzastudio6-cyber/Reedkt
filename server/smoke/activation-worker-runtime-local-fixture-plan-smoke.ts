import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_ALLOWED_DECISIONS,
  WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_EXPECTED_REPORTS,
  WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_REPORT_DIR,
  buildWorkerRuntimeLocalFixturePlanReports,
  getWorkerRuntimeLocalFixturePlanTextCorpus,
} from '../activation/worker-runtime-local-fixture-plan'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : []
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const entries: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return entries
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) entries.push(...readAllFiles(fullPath))
    else entries.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return entries
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:worker-runtime-local-fixture-plan:report',
  'activation:worker-runtime-local-fixture-plan:summary',
  'smoke:activation-worker-runtime-local-fixture-plan',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const source of [
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-reports/worker_runtime_fixture_hardening_decision.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_hardened_valid_fixtures.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_hardened_invalid_fixtures.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_fixture_manifest.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_fixture_checksums.json',
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_dry_run_contract_review_decision.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_execution_decision.json',
  'docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json',
  'docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
  'docs/activation-product-internal-testing-session-0-reports/session_0_decision.json',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json',
]) {
  assert(existsSync(source), `Missing source evidence: ${source}`)
}

for (const report of WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_EXPECTED_REPORTS) {
  assert(existsSync(path.join(WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_REPORT_DIR, report)), `Missing local fixture plan report: ${report}`)
}

for (const doc of [
  'docs/worker-runtime-unlock-4-local-fixture-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-unlock-5-local-fixture-validation.md',
]) {
  assert(existsSync(doc), `Missing local fixture plan doc: ${doc}`)
}

for (const { file, text } of readAllFiles('server/activation/worker-runtime-local-fixture-plan')) {
  assert(!text.includes("from 'node:child_process'"), `Local fixture plan must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Local fixture plan must not spawn processes: ${file}`)
  assert(!text.includes('spawnSync('), `Local fixture plan must not spawn processes: ${file}`)
  assert(!text.includes('execFile'), `Local fixture plan must not execute commands: ${file}`)
  assert(!text.includes('fetch('), `Local fixture plan must not make network calls: ${file}`)
  assert(!/from ['"].*server\/workers/i.test(text), `Local fixture plan must not import workers: ${file}`)
  assert(!/from ['"].*supabase/i.test(text), `Local fixture plan must not import Supabase clients: ${file}`)
  assert(!/from ['"].*provider/i.test(text), `Local fixture plan must not import providers: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Local fixture plan must not import Track A runtime: ${file}`)
}

const reports = buildWorkerRuntimeLocalFixturePlanReports()
const decision = reports.decision as Record<string, unknown>
const sourceAudit = reports.sourceAudit as Record<string, unknown>
const inputMatrix = reports.inputMatrix as Record<string, unknown>
const validationMatrix = reports.validationMatrix as Record<string, unknown>
const validPlan = reports.validFixturePlan as Record<string, unknown>
const invalidPlan = reports.invalidFixturePlan as Record<string, unknown>
const manifest = reports.manifestChecksumPlan as Record<string, unknown>
const payloadResult = reports.payloadResultPlan as Record<string, unknown>
const artifactRefs = reports.artifactSourceRefPlan as Record<string, unknown>
const supabase = reports.supabaseOwnerHandoffPlan as Record<string, unknown>
const cloud = reports.cloudrunDockerOwnerHandoffPlan as Record<string, unknown>
const toolProviderRoute = reports.toolProviderRouteOwnerHandoffPlan as Record<string, unknown>
const noExecution = reports.noExecutionPolicy as Record<string, unknown>

assert(WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_ALLOWED_DECISIONS.includes(String(decision.decision) as typeof WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_ALLOWED_DECISIONS[number]), 'Decision must be allowed.')
assert(decision.decision === 'worker_runtime_local_fixture_plan_ready', 'Expected ready decision for unchanged source state.')
assert(decision.localFixturePlanReady === true, 'Local fixture plan should be ready.')
assert(decision.readyForLocalFixtureValidation === true, 'Local fixture validation should be the next metadata-only phase.')
assert(decision.realWorkerExecutionReady === false, 'Real worker execution must remain blocked.')
assert(decision.workerDispatchReady === false, 'Worker dispatch must remain blocked.')
assert(decision.jobClaimReady === false, 'Job claim must remain blocked.')
assert(decision.jobLeaseReady === false, 'Job lease must remain blocked.')
assert(decision.supabasePersistenceReady === false, 'Supabase persistence must remain blocked.')
assert(decision.generatedLocalFixturePassedClaimed === false, 'generated_local_fixture_passed must not be claimed.')

assert(sourceAudit.status === 'passed', 'Source audit must pass.')
assert(sourceAudit.sourcePr353Merged === true, 'PR #353 must be recorded as merged source-of-truth.')
assert(sourceAudit.sourceOfTruthConflictsFound === false, 'Source conflicts must be absent.')
assert(inputMatrix.status === 'passed', 'Input matrix must pass.')
assert(inputMatrix.fixtureCount === 12, 'Input matrix must cover 12 fixtures.')
assert(inputMatrix.validFixtureCount === 4, 'Expected four valid hardened fixtures.')
assert(inputMatrix.invalidFailClosedFixtureCount === 8, 'Expected eight invalid fail-closed fixtures.')
assert(inputMatrix.sourceRefCount === 48, 'Expected 48 placeholder source refs.')
assert(inputMatrix.checksumInputScope === 'canonical_fixture_json_content_only', 'Checksums must use canonical fixture JSON only.')
assert(validationMatrix.status === 'passed', 'Validation matrix must pass.')
assert(recordArray(validationMatrix.validationRows).length === 10, 'Expected ten planned validation rows.')
assert(validPlan.status === 'passed', 'Valid fixture plan must pass.')
assert(invalidPlan.status === 'passed', 'Invalid fixture plan must pass.')
for (const reason of [
  'raw_prompt_worker_input',
  'public_artifact_output_request',
  'broad_media_processing_request',
  'production_write_request',
  'signed_url_source_of_truth',
  'unapproved_artifact_prefix',
  'service_role_key_like_field_name',
  'direct_tool_route_execution_field',
]) {
  assert(stringArray(invalidPlan.observedReasons).includes(reason), `Missing invalid fixture reason: ${reason}`)
}
assert(manifest.status === 'passed', 'Manifest/checksum plan must pass.')
assert(manifest.checksumInputScope === 'canonical_fixture_json_content_only', 'Manifest/checksum plan must use canonical fixture JSON only.')
assert(payloadResult.status === 'passed', 'Payload/result plan must pass.')
assert(artifactRefs.status === 'passed', 'Artifact/source ref plan must pass.')
assert(artifactRefs.sourceRefCount === 48, 'Artifact/source ref plan must cover 48 refs.')
assert(supabase.supabaseEnvironmentTouched === 'no', 'Supabase environment must not be touched.')
assert(supabase.sqlExecuted === false, 'SQL must not execute.')
assert(supabase.migrationDeployed === false, 'Migrations must not deploy.')
assert(cloud.dockerExecutionAllowed === false, 'Docker must stay blocked.')
assert(cloud.cloudRunExecutionAllowed === false, 'Cloud Run must stay blocked.')
assert(toolProviderRoute.toolExecutionAllowed === false, 'Tool execution must stay blocked.')
assert(toolProviderRoute.routeExecutionAllowed === false, 'Route execution must stay blocked.')
assert(toolProviderRoute.providerExecutionAllowed === false, 'Provider execution must stay blocked.')
assert(noExecution.status === 'passed', 'No-execution policy must pass.')
assert(String(decision.nextRecommendedPhase).includes('WORKER-RUNTIME-UNLOCK-5'), 'Next prompt must be UNLOCK-5 local fixture validation.')

const validFixtureReport = readJson('docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_hardened_valid_fixtures.json')
const invalidFixtureReport = readJson('docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_hardened_invalid_fixtures.json')
const checksumReport = readJson('docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_fixture_checksums.json')
const validFixtures = recordArray(validFixtureReport.fixtures)
const invalidFixtures = recordArray(invalidFixtureReport.fixtures)
const checksumRows = recordArray(checksumReport.fixtureChecksums)

assert(validFixtures.length === 4, 'Persisted valid fixture count must be four.')
assert(invalidFixtures.length === 8, 'Persisted invalid fixture count must be eight.')
assert(checksumRows.length === 12, 'Checksum report must cover all fixtures.')

for (const fixture of [...validFixtures, ...invalidFixtures]) {
  assert(fixture.approvedPlanSnapshotSchema === 'approved_plan_snapshot_v1', `Fixture schema mismatch: ${String(fixture.caseId)}`)
  assert(typeof fixture.approvedPlanSnapshotRef === 'string' && String(fixture.approvedPlanSnapshotRef).startsWith('supabase_row_ref:synthetic'), `Missing safe approvedPlanSnapshotRef: ${String(fixture.caseId)}`)
  assert(typeof fixture.approvedPlanSnapshotHash === 'string' && String(fixture.approvedPlanSnapshotHash).startsWith('checksum_ref:synthetic'), `Missing safe approvedPlanSnapshotHash: ${String(fixture.caseId)}`)
  assert(fixture.runtimeExecutionAllowed === false, `Runtime execution must be false: ${String(fixture.caseId)}`)
  assert(fixture.workerExecutionAllowed === false, `Worker execution must be false: ${String(fixture.caseId)}`)
  assert(fixture.toolExecutionAllowed === false, `Tool execution must be false: ${String(fixture.caseId)}`)
  assert(fixture.providerExecutionAllowed === false, `Provider execution must be false: ${String(fixture.caseId)}`)
  assert(fixture.publicArtifactsAllowed === false, `Public artifacts must be false: ${String(fixture.caseId)}`)
  assert(fixture.signedUrlsAsSourceOfTruthAllowed === false, `Signed URL source-of-truth must be false: ${String(fixture.caseId)}`)
  assert(fixture.rawPromptForwardingAllowed === false, `Raw prompt forwarding must be false: ${String(fixture.caseId)}`)
  assert(fixture.productionMutationAllowed === false, `Production mutation must be false: ${String(fixture.caseId)}`)
}

for (const fixture of invalidFixtures) {
  assert(fixture.expectedDecision === 'fail_closed', `Invalid fixture must fail closed: ${String(fixture.caseId)}`)
  assert(typeof fixture.intentionallyInvalidReason === 'string', `Invalid fixture needs reason: ${String(fixture.caseId)}`)
  assert(stringArray(fixture.blockedActions).length > 0, `Invalid fixture needs blocked actions: ${String(fixture.caseId)}`)
}

const corpus = [
  ...getWorkerRuntimeLocalFixturePlanTextCorpus(),
  ...readAllFiles('server/activation/worker-runtime-local-fixture-plan').map((entry) => ({ filePath: entry.file, text: entry.text })),
  { filePath: 'server/smoke/activation-worker-runtime-local-fixture-plan-smoke.ts', text: readFileSync('server/smoke/activation-worker-runtime-local-fixture-plan-smoke.ts', 'utf8') },
]

for (const { filePath, text } of corpus) {
  for (const forbidden of [
    /"workerExecution"\s*:\s*true/,
    /"workerRuntimeExecutionReady"\s*:\s*true/,
    /"workerExecutionReady"\s*:\s*true/,
    /"runtimeExecutionAllowed"\s*:\s*true/,
    /"workerExecutionAllowed"\s*:\s*true/,
    /"localFixturesExecuted"\s*:\s*true/,
    /"localFixtureValidationExecuted"\s*:\s*true/,
    /"jobDispatch"\s*:\s*true/,
    /"queueEnqueue"\s*:\s*true/,
    /"jobClaim"\s*:\s*true/,
    /"jobLease"\s*:\s*true/,
    /"claimMutation"\s*:\s*true/,
    /"leaseMutation"\s*:\s*true/,
    /"sidecarSpawn"\s*:\s*true/,
    /"subprocessSpawn"\s*:\s*true/,
    /"toolExecution"\s*:\s*true/,
    /"toolExecutionAllowed"\s*:\s*true/,
    /"routeExecution"\s*:\s*true/,
    /"routeExecutionAllowed"\s*:\s*true/,
    /"providerCalls"\s*:\s*true/,
    /"providerExecutionAllowed"\s*:\s*true/,
    /"dockerRun"\s*:\s*true/,
    /"cloudRunJob"\s*:\s*true/,
    /"cloudBuild"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"sqlExecuted"\s*:\s*true/,
    /"migrationDeployed"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"publicArtifactsAllowed"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"signedUrlsAsSourceOfTruthAllowed"\s*:\s*true/,
    /"rawPromptExecution"\s*:\s*true/,
    /"rawPromptForwardingAllowed"\s*:\s*true/,
    /"rawProviderOutputExecution"\s*:\s*true/,
    /"productionAffected"\s*:\s*true/,
    /"productionMutationAllowed"\s*:\s*true/,
    /"internalBeta"\s*:\s*true/,
    /"externalBeta"\s*:\s*true/,
    /"paidProduction"\s*:\s*true/,
    /"generatedLocalFixturePassedClaimed"\s*:\s*true/,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /supabase\.co/i,
    /authorization\s*:\s*bearer/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    new RegExp('BEGIN ' + 'PRIVATE KEY'),
    new RegExp('x-goog-' + 'signature=', 'i'),
    new RegExp('AKIA' + '[0-9A-Z]{16}'),
    new RegExp('sk-' + '[A-Za-z0-9]{20,}'),
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${filePath}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'worker-runtime-local-fixture-plan',
  decision: decision.decision,
  fixtureCount: inputMatrix.fixtureCount,
  validFixtureCount: inputMatrix.validFixtureCount,
  invalidFailClosedFixtureCount: inputMatrix.invalidFailClosedFixtureCount,
  readyForLocalFixtureValidation: decision.readyForLocalFixtureValidation,
  workerExecution: false,
  jobDispatch: false,
  supabaseWrites: false,
  productionAffected: false,
  generatedLocalFixturePassedClaimed: false,
}, null, 2))
