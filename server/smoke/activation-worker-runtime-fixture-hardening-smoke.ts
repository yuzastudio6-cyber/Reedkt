import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_FIXTURE_HARDENING_ALLOWED_DECISIONS,
  WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_FIXTURES,
  WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_REPORTS,
  WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR,
  WORKER_RUNTIME_FIXTURE_HARDENING_REPORT_DIR,
  buildWorkerRuntimeFixtureHardeningReports,
  getWorkerRuntimeFixtureHardeningTextCorpus,
} from '../activation/worker-runtime-fixture-hardening'

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
  'activation:worker-runtime-fixture-hardening:report',
  'activation:worker-runtime-fixture-hardening:summary',
  'smoke:activation-worker-runtime-fixture-hardening',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const source of [
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_dry_run_contract_review_decision.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_execution_decision.json',
  'docs/activation-worker-runtime-dry-run-approval-reports/approved_plan_snapshot_dry_run_fixtures.json',
  'docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json',
  'docs/activation-product-internal-testing-session-0-reports/session_0_decision.json',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json',
]) {
  assert(existsSync(source), `Missing source evidence: ${source}`)
}

for (const report of WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_REPORTS) {
  assert(existsSync(path.join(WORKER_RUNTIME_FIXTURE_HARDENING_REPORT_DIR, report)), `Missing fixture hardening report: ${report}`)
}

for (const fixture of WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_FIXTURES) {
  assert(existsSync(path.join(WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR, fixture)), `Missing hardened fixture artifact: ${fixture}`)
}

for (const doc of [
  'docs/worker-runtime-unlock-3-fixture-hardening.md',
  'docs/implementation-prompts/prompt-worker-runtime-unlock-4-local-fixture-plan.md',
]) {
  assert(existsSync(doc), `Missing fixture hardening doc: ${doc}`)
}

for (const { file, text } of readAllFiles('server/activation/worker-runtime-fixture-hardening')) {
  assert(!text.includes("from 'node:child_process'"), `Fixture hardening must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Fixture hardening must not spawn processes: ${file}`)
  assert(!text.includes('spawnSync('), `Fixture hardening must not spawn processes: ${file}`)
  assert(!text.includes('execFile'), `Fixture hardening must not execute commands: ${file}`)
  assert(!text.includes('fetch('), `Fixture hardening must not make network calls: ${file}`)
  assert(!/from ['"].*server\/workers/i.test(text), `Fixture hardening must not import workers: ${file}`)
  assert(!/from ['"].*supabase/i.test(text), `Fixture hardening must not import Supabase clients: ${file}`)
  assert(!/from ['"].*provider/i.test(text), `Fixture hardening must not import providers: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Fixture hardening must not import Track A runtime: ${file}`)
}

const reports = buildWorkerRuntimeFixtureHardeningReports()
const decision = reports.decision as Record<string, unknown>
const sourceAudit = reports.sourceAudit as Record<string, unknown>
const inventory = reports.fixtureInventory as Record<string, unknown>
const validHardening = reports.validFixtureHardening as Record<string, unknown>
const invalidHardening = reports.invalidFixtureHardening as Record<string, unknown>
const payload = reports.payloadFixtureHardening as Record<string, unknown>
const result = reports.resultFixtureHardening as Record<string, unknown>
const manifest = reports.manifestChecksumProvenanceHardening as Record<string, unknown>
const artifactRefs = reports.artifactSourceRefFixtureHardening as Record<string, unknown>
const supabase = reports.supabasePersistenceBlockerFixtureHardening as Record<string, unknown>
const noExecution = reports.noExecutionFixturePolicy as Record<string, unknown>

assert(WORKER_RUNTIME_FIXTURE_HARDENING_ALLOWED_DECISIONS.includes(String(decision.decision) as typeof WORKER_RUNTIME_FIXTURE_HARDENING_ALLOWED_DECISIONS[number]), 'Decision must be allowed.')
assert(decision.decision === 'worker_runtime_fixture_hardening_passed_ready_for_local_fixture_plan', 'Expected pass decision for unchanged source state.')
assert(decision.readyForLocalFixturePlan === true, 'Fixture hardening should be ready for local fixture plan.')
assert(decision.realWorkerExecutionReady === false, 'Real worker execution must remain blocked.')
assert(decision.workerDispatchReady === false, 'Worker dispatch must remain blocked.')
assert(decision.jobClaimReady === false, 'Job claim must remain blocked.')
assert(decision.jobLeaseReady === false, 'Job lease must remain blocked.')
assert(decision.supabasePersistenceReady === false, 'Supabase persistence must remain blocked.')
assert(decision.generatedLocalFixturePassedClaimed === false, 'generated_local_fixture_passed must not be claimed.')
assert(sourceAudit.status === 'passed', 'Source audit must pass.')
assert(sourceAudit.sourcePr351Merged === true, 'PR #351 must be recorded as merged source-of-truth.')
assert(inventory.status === 'passed', 'Fixture inventory must pass.')
assert(inventory.fixtureCount === 12, 'Fixture inventory must cover 12 hardened fixtures.')
assert(inventory.validFixtureCount === 4, 'Expected four hardened valid fixtures.')
assert(inventory.invalidFailClosedFixtureCount === 8, 'Expected eight hardened invalid fail-closed fixtures.')
assert(validHardening.status === 'passed', 'Valid fixture hardening must pass.')
assert(invalidHardening.status === 'passed', 'Invalid fixture hardening must pass.')
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
  assert(stringArray(invalidHardening.observedReasons).includes(reason), `Missing invalid fixture reason: ${reason}`)
}
assert(payload.status === 'passed', 'Payload fixture hardening must pass.')
assert(result.status === 'passed', 'Result fixture hardening must pass.')
assert(manifest.status === 'passed', 'Manifest/checksum/provenance hardening must pass.')
assert(manifest.checksumInputScope === 'canonical_fixture_json_content_only', 'Checksums must use canonical fixture JSON only.')
assert(artifactRefs.status === 'passed', 'Artifact/source ref hardening must pass.')
assert(artifactRefs.sourceRefCount === 48, 'Expected 48 source refs across 12 fixtures.')
assert(supabase.supabaseEnvironmentTouched === 'no', 'Supabase environment must not be touched.')
assert(supabase.sqlExecuted === false, 'SQL must not execute.')
assert(supabase.migrationDeployed === false, 'Migrations must not deploy.')
assert(noExecution.status === 'passed', 'No-execution policy must pass.')
assert(String(decision.nextRecommendedPhase).includes('WORKER-RUNTIME-UNLOCK-4'), 'Next prompt must be UNLOCK-4 local fixture plan.')

const validFixtureReport = readJson(path.join(WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR, 'worker_runtime_hardened_valid_fixtures.json'))
const invalidFixtureReport = readJson(path.join(WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR, 'worker_runtime_hardened_invalid_fixtures.json'))
const checksumReport = readJson(path.join(WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR, 'worker_runtime_fixture_checksums.json'))
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
  ...getWorkerRuntimeFixtureHardeningTextCorpus(),
  ...readAllFiles('server/activation/worker-runtime-fixture-hardening').map((entry) => ({ filePath: entry.file, text: entry.text })),
  { filePath: 'server/smoke/activation-worker-runtime-fixture-hardening-smoke.ts', text: readFileSync('server/smoke/activation-worker-runtime-fixture-hardening-smoke.ts', 'utf8') },
]

for (const { filePath, text } of corpus) {
  for (const forbidden of [
    /"workerExecution"\s*:\s*true/,
    /"workerRuntimeExecutionReady"\s*:\s*true/,
    /"workerExecutionReady"\s*:\s*true/,
    /"runtimeExecutionAllowed"\s*:\s*true/,
    /"workerExecutionAllowed"\s*:\s*true/,
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
  phase: 'worker-runtime-fixture-hardening',
  decision: decision.decision,
  fixtureCount: inventory.fixtureCount,
  validFixtureCount: inventory.validFixtureCount,
  invalidFailClosedFixtureCount: inventory.invalidFailClosedFixtureCount,
  readyForLocalFixturePlan: decision.readyForLocalFixturePlan,
  workerExecution: false,
  jobDispatch: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
