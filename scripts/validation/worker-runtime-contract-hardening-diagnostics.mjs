import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/worker-runtime/worker-runtime-contract-hardening-plan.md',
  'docs/worker-runtime/worker-job-payload-schema.md',
  'docs/worker-runtime/worker-plan-snapshot-mapping.md',
  'docs/worker-runtime/worker-claim-lease-contract.md',
  'docs/worker-runtime/worker-failure-retry-idempotency-contract.md',
  'docs/worker-runtime/worker-service-role-hardening-contract.md',
  'docs/worker-runtime/worker-artifact-write-hardening-contract.md',
  'docs/worker-runtime/worker-tool-route-dispatch-gate.md',
  'docs/worker-runtime/worker-observability-qa-evidence-contract.md',
  'docs/worker-runtime/worker-dry-run-fixture-plan.md',
  'docs/worker-runtime/worker-runtime-hardening-readiness-matrix.md',
  'docs/worker-runtime/worker-2-allowed-blocked-scope.md',
  'docs/prompt-worker-1-validation-results.md',
  'docs/implementation-prompts/prompt-worker-1-worker-runtime-contract-hardening-dry-run-plan.md',
]

const trackerFiles = [
  'docs/activation-readiness-state.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
]

const requiredFields = [
  'jobId',
  'planSnapshotId',
  'approvalState',
  'workspaceRef',
  'projectRef',
  'userRef',
  'scopedToolCallManifestRef',
  'editIntentRefs',
  'artifactScopeRefs',
  'idempotencyKey',
  'attemptNumber',
  'maxAttempts',
  'timeoutMs',
  'correlationId',
  'qaHooks',
  'observabilityHooks',
  'cleanupRollbackHooks',
  'blockedUses',
  'sourceOfTruthPolicy',
  'providerFindings',
  'requestedCapabilities',
  'selectedToolPlan',
  'editIntents',
  'artifactScopes',
  'QARequirements',
  'observabilityRequirements',
  'cleanupRollbackRequirements',
  'nextGate',
]

const requiredFalseBooleans = [
  'rawPromptExecutionApproved',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
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
  'docs/internal-beta/',
  'docs/cross-chat/',
  'docs/runtime-unlock/',
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
if (packageJson.scripts?.['worker:runtime-contract-hardening:diagnostics'] !== 'node scripts/validation/worker-runtime-contract-hardening-diagnostics.mjs') {
  errors.push('missing_package_script:worker:runtime-contract-hardening:diagnostics')
}

const combinedDocs = requiredDocs
  .filter((file) => existsSync(filePath(file)))
  .map((file) => `\n--- ${file} ---\n${read(file)}`)
  .join('\n')

for (const field of requiredFields) {
  if (!combinedDocs.includes(field)) errors.push(`missing_required_field:${field}`)
}

for (const token of [
  'WORKER-1',
  'ready_for_worker_2_dry_run_fixture_plan',
  'ready_with_warnings_for_worker_1',
  'ready_for_owner_review',
  'provider_dry_run_passed',
  'blocked_pending_workstream_gates',
  'WORKER-2 - Worker Runtime Dry-Run Fixture Plan / Contract Tests',
  'TOOL-ROUTE-0',
  'PROVIDER-GATEWAY-0',
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
  errors.push('foundation_runner_present_requires_worker_1_wiring_review')
}

for (const file of trackerFiles) {
  if (!existsSync(filePath(file))) {
    errors.push(`missing_tracker:${file}`)
    continue
  }
  const body = read(file)
  if (!body.includes('WORKER-1')) errors.push(`tracker_missing_worker_1:${file}`)
  if (!body.includes('ready_for_worker_2_dry_run_fixture_plan')) errors.push(`tracker_missing_worker_1_status:${file}`)
  if (!body.includes('blocked_pending_workstream_gates')) errors.push(`tracker_missing_internal_beta_blocker:${file}`)
  if (!body.includes('docs/status only')) errors.push(`tracker_missing_supabase_docs_only:${file}`)
}

const unsafePatterns = [
  /rawPromptExecutionApproved["`]?\s*[:=]\s*true/i,
  /workerExecutionApproved(?:Now)?["`]?\s*[:=]\s*true/i,
  /toolExecutionApproved(?:Now)?["`]?\s*[:=]\s*true/i,
  /routeExecutionApproved(?:Now)?["`]?\s*[:=]\s*true/i,
  /providerRuntimeApproved(?:Now)?["`]?\s*[:=]\s*true/i,
  /supabaseMutationApproved(?:Now)?["`]?\s*[:=]\s*true/i,
  /publicArtifactsApproved["`]?\s*[:=]\s*true/i,
  /signedUrlsApproved["`]?\s*[:=]\s*true/i,
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
  /job claim executed/i,
  /queue execution completed/i,
  /route execution completed/i,
  /tool execution completed/i,
  /provider call completed/i,
  /media processing completed/i,
  /browser capture completed/i,
  /storage transfer completed/i,
  /signed URL created/i,
  /public artifact created/i,
  /dependency mutation completed/i,
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
  workerRuntimeContractHardeningStatus: 'ready_for_worker_2_dry_run_fixture_plan',
  workerExecutionApproved: false,
  toolExecutionApproved: false,
  routeExecutionApproved: false,
  providerRuntimeApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextRecommendedPrompt: 'WORKER-2 - Worker Runtime Dry-Run Fixture Plan / Contract Tests',
}, null, 2))
