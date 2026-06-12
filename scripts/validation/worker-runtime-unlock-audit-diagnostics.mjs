import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/worker-runtime/worker-runtime-unlock-repo-audit.md',
  'docs/worker-runtime/worker-runtime-source-inventory.md',
  'docs/worker-runtime/plan-snapshot-to-worker-contract.md',
  'docs/worker-runtime/worker-job-claim-lease-audit.md',
  'docs/worker-runtime/worker-runtime-service-role-boundary.md',
  'docs/worker-runtime/worker-artifact-write-boundary.md',
  'docs/worker-runtime/worker-tool-route-dispatch-boundary.md',
  'docs/worker-runtime/worker-observability-qa-boundary.md',
  'docs/worker-runtime/worker-unlock-readiness-matrix.md',
  'docs/worker-runtime/worker-1-allowed-blocked-scope.md',
  'docs/prompt-worker-0-validation-results.md',
  'docs/implementation-prompts/prompt-worker-0-worker-runtime-unlock-repo-audit.md',
]

const trackerFiles = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/activation-readiness-state.md',
]

const sourceInventoryPaths = [
  'server/cli/run-worker-job.ts',
  'server/routes/worker-routes.ts',
  'server/services/worker-claim-service.ts',
  'server/workers/worker-claim-runner.ts',
  'server/workers/worker-gates.ts',
  'server/workers/worker-runtime.ts',
  'server/workers/worker-job-loader.ts',
  'server/workers/worker-events.ts',
  'server/workers/worker-result.ts',
  'server/validation/worker-schemas.ts',
  'server/observability/worker-event-observability.ts',
  'server/workers/production/production-worker-router.ts',
  'server/workers/production/production-worker-gates.ts',
  'server/workers/production/production-worker-artifact-policy.ts',
  'server/workers/production/production-worker-runtime.ts',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-lease-manager.ts',
  'server/workers/production/production-worker-result-writer.ts',
  'server/workers/tool-readiness-runner.ts',
  'server/workers/tool-readiness-types.ts',
  'server/workers/README.md',
  'server/smoke/worker-claim-smoke.ts',
  'server/smoke/production-worker-orchestration-smoke.ts',
  'package.json',
  'docs/worker-dispatch-mock-runtime.md',
  'docs/worker-lease-runtime.md',
  'docs/worker-lease-runtime-audit.md',
  'docs/worker-heartbeat-stale-recovery.md',
  'docs/job-failure-retry-recovery.md',
  'docs/runtime-idempotency-plan.md',
  'docs/production-worker-architecture.md',
  'docs/production-worker-runtime-orchestration.md',
  'docs/production-worker-gates-policy.md',
  'docs/production-worker-idempotency-policy.md',
  'docs/production-worker-concurrency-policy.md',
  'docs/production-worker-event-log-policy.md',
  'database/migration-drafts/010_production_worker_runtime_orchestration.draft.sql',
  'database/test-sql/007_production_worker_runtime_orchestration_tests.sql',
  'docs/track-b-route-plan-snapshot-policy.md',
  'docs/track-b-route-consumer-policy.md',
  'docs/track-b-route-failure-policy.md',
  'docs/track-b-route-manifest-handoff.md',
  'docs/track-b-route-next-hybrid-compute-phases.md',
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
  'docs/execution-gates-contract.md',
  'docs/tool-call-foundation.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/worker-claim-execution-contract-hardening.md',
  'docs/provider-gateway-foundation.md',
  'docs/render-preview-export-foundation.md',
  'docs/media-readiness-probe-timing-foundation.md',
  'docs/qa-revision-fallback-foundation.md',
  'docs/observability-audit-abuse-cost-foundation.md',
  'docs/compliance-license-security-review-foundation.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
  'docs/implementation-prompts/README.md',
  '.github/workflows/',
  'scripts/validation/run-foundation-validation.mjs',
]

const exactSourceOfTruth = 'Supabase row + private GCS path + manifest + checksum + approved plan snapshot'
const exactNoScope = 'No provider call, worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.'

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

const packageJson = existsSync(filePath('package.json')) ? readJson('package.json') : { scripts: {} }
if (packageJson.scripts?.['worker:runtime-unlock:audit:diagnostics'] !== 'node scripts/validation/worker-runtime-unlock-audit-diagnostics.mjs') {
  errors.push('missing_package_script:worker:runtime-unlock:audit:diagnostics')
}

const combinedDocs = requiredDocs
  .filter((file) => existsSync(filePath(file)))
  .map((file) => `\n--- ${file} ---\n${read(file)}`)
  .join('\n')

for (const pathName of sourceInventoryPaths) {
  if (!combinedDocs.includes(pathName)) errors.push(`missing_source_inventory_path:${pathName}`)
}

for (const token of [
  'WORKER-0',
  'ready_with_warnings_for_worker_1',
  'ready_for_owner_review',
  'provider_dry_run_passed',
  'blocked_pending_workstream_gates',
  'WORKER-1 - Worker Runtime Contract Hardening / Dry-Run Plan',
  exactSourceOfTruth,
  exactNoScope,
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
]) {
  if (!combinedDocs.includes(token)) errors.push(`missing_required_text:${token}`)
}

for (const bool of requiredFalseBooleans) {
  const falsePattern = new RegExp(`"${bool}"\\s*:\\s*false|${bool}:\\s*false`)
  const truePattern = new RegExp(`"${bool}"\\s*:\\s*true|${bool}:\\s*true`)
  if (!falsePattern.test(combinedDocs)) errors.push(`missing_false_approval_boolean:${bool}`)
  if (truePattern.test(combinedDocs)) errors.push(`approval_boolean_true:${bool}`)
}

for (const gap of requiredBaseGaps) {
  if (!combinedDocs.includes(gap)) errors.push(`missing_base_gap:${gap}`)
}

if (existsSync(filePath('scripts/validation/run-foundation-validation.mjs'))) {
  errors.push('unexpected_foundation_runner_present_without_worker_0_wiring_review')
}

for (const file of trackerFiles) {
  if (!existsSync(filePath(file))) {
    errors.push(`missing_tracker:${file}`)
    continue
  }
  const body = read(file)
  if (!body.includes('WORKER-0')) errors.push(`tracker_missing_worker_0:${file}`)
  if (!body.includes('ready_with_warnings_for_worker_1')) errors.push(`tracker_missing_worker_0_status:${file}`)
  if (!body.includes('blocked_pending_workstream_gates')) errors.push(`tracker_missing_internal_beta_blocker:${file}`)
  if (!body.includes('docs/status only')) errors.push(`tracker_missing_supabase_docs_only:${file}`)
}

const unsafePatterns = [
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
  /worker execution approved now:\s*(true|yes|enabled)/i,
  /tool execution approved now:\s*(true|yes|enabled)/i,
  /route execution approved now:\s*(true|yes|enabled)/i,
  /provider runtime approved now:\s*(true|yes|enabled)/i,
  /supabase mutation approved now:\s*(true|yes|enabled)/i,
  /internal beta approved now:\s*(true|yes|enabled)/i,
  /external beta approved now:\s*(true|yes|enabled)/i,
  /production approved now:\s*(true|yes|enabled)/i,
  /ran\s+(npm run\s+)?worker:run/i,
  /ran\s+(npm run\s+)?worker:probe-media/i,
  /ran\s+supabase\s/i,
  /ran\s+psql\b/i,
  /ran\s+docker\b/i,
  new RegExp(`s${'k'}-[A-Za-z0-9_-]{12,}`),
  /Bearer\s+[A-Za-z0-9._-]{12,}/i,
  new RegExp(['X-Goog', 'Signature='].join('-'), 'i'),
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]\s*['"][^'"]+/i,
  /\bSQL executed:\s*`?(?!none\b)[A-Za-z0-9_/-]+`?/i,
]

for (const file of requiredDocs.filter((item) => existsSync(filePath(item)))) {
  const body = read(file)
  for (const pattern of unsafePatterns) {
    if (pattern.test(body)) errors.push(`unsafe_pattern:${file}:${pattern}`)
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ status: 'failed', errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  workerRuntimeUnlockAuditStatus: 'ready_with_warnings_for_worker_1',
  planSnapshotContractStatus: 'ready_for_owner_review',
  modelProviderDryrun2aStatus: 'provider_dry_run_passed',
  fullInternalBetaStatus: 'blocked_pending_workstream_gates',
  workerExecutionApproved: false,
  toolExecutionApproved: false,
  routeExecutionApproved: false,
  providerRuntimeApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextRecommendedPrompt: 'WORKER-1 - Worker Runtime Contract Hardening / Dry-Run Plan',
}, null, 2))
