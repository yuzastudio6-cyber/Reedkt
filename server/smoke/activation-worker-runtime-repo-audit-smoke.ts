import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_REPO_AUDIT_EXPECTED_REPORTS,
  WORKER_RUNTIME_REPO_AUDIT_REPORT_DIR,
  buildWorkerRuntimeRepoAuditReports,
} from '../activation/worker-runtime-repo-audit'

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
  'activation:worker-runtime-repo-audit:plan',
  'activation:worker-runtime-repo-audit',
  'activation:worker-runtime-repo-audit:report',
  'activation:worker-runtime-repo-audit:summary',
  'smoke:activation-worker-runtime-repo-audit',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/worker-runtime-repo-audit/index.ts'), 'Worker runtime repo audit module missing.')
assert(!existsSync('server/workers/worker-runtime-repo-audit'), 'Repo audit must not add a worker implementation.')
assert(!existsSync('server/routes/worker-runtime-repo-audit.ts'), 'Repo audit must not add a runtime route.')
assert(existsSync(WORKER_RUNTIME_REPO_AUDIT_REPORT_DIR), 'Worker runtime repo audit report dir missing.')
for (const report of WORKER_RUNTIME_REPO_AUDIT_EXPECTED_REPORTS) {
  assert(existsSync(path.join(WORKER_RUNTIME_REPO_AUDIT_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/worker-runtime-repo-audit.md',
  'docs/worker-runtime-approved-plan-snapshot-intake.md',
  'docs/worker-runtime-artifact-scope-source-of-truth.md',
  'docs/worker-runtime-execution-blocker-policy.md',
  'docs/worker-runtime-repo-audit-decision.md',
  'docs/implementation-prompts/prompt-worker-runtime-dry-run-approval-after-repo-audit.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildWorkerRuntimeRepoAuditReports()
const decision = reports.decision as Record<string, unknown>
const readiness = reports.readinessReport as Record<string, unknown>
const inventory = reports.workerJobQueueInventory as Record<string, unknown>
const intake = reports.approvedPlanSnapshotIntakeReview as Record<string, unknown>
const artifact = reports.artifactScopeSourceOfTruthReview as Record<string, unknown>
const blockerPolicy = reports.workerExecutionBlockerPolicy as Record<string, unknown>
const secrets = reports.workerSecretReferenceInventory as Record<string, unknown>
const observability = reports.workerObservabilityCostFailureReview as Record<string, unknown>

assert(decision.decision === 'repo_audit_passed_ready_for_worker_dry_run_approval', 'Worker runtime repo audit decision should pass.')
assert(readiness.workerDryRunApprovalReady === true, 'Worker dry-run approval should be ready after audit pass.')
assert(inventory.status === 'passed', 'Worker/job/queue inventory must pass.')
assert(intake.status === 'passed', 'Approved plan snapshot intake review must pass.')
assert(artifact.status === 'passed', 'Artifact scope source-of-truth review must pass.')
assert(blockerPolicy.status === 'passed', 'Worker execution blocker policy must pass.')
assert(secrets.status === 'passed', 'Secret reference inventory must pass.')
assert(observability.status === 'passed', 'Observability/cost/failure review must pass.')

for (const [key, expected] of Object.entries({
  workerExecution: false,
  toolExecution: false,
  routeExecution: false,
  providerCalls: false,
  dockerRun: false,
  cloudRunJob: false,
  cloudBuild: false,
  mediaProcessing: false,
  supabaseWrites: false,
  publicArtifacts: false,
  signedUrls: false,
  rawPromptExecution: false,
  productionAffected: false,
  externalBeta: false,
  paidProduction: false,
  secretPayloadPrinted: false,
})) {
  assert(readiness[key] === expected, `${key} must remain ${expected}.`)
}

const corpus = [
  ...readAllFiles(WORKER_RUNTIME_REPO_AUDIT_REPORT_DIR),
  ...[
    'docs/worker-runtime-repo-audit.md',
    'docs/worker-runtime-approved-plan-snapshot-intake.md',
    'docs/worker-runtime-artifact-scope-source-of-truth.md',
    'docs/worker-runtime-execution-blocker-policy.md',
    'docs/worker-runtime-repo-audit-decision.md',
    'docs/implementation-prompts/prompt-worker-runtime-dry-run-approval-after-repo-audit.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    /"workerExecution"\s*:\s*true/,
    /"toolExecution"\s*:\s*true/,
    /"routeExecution"\s*:\s*true/,
    /"providerCalls"\s*:\s*true/,
    /"dockerRun"\s*:\s*true/,
    /"cloudRunJob"\s*:\s*true/,
    /"cloudBuild"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"rawPromptExecution"\s*:\s*true/,
    /"productionAffected"\s*:\s*true/,
    /docker\s+run/i,
    /gcloud\s+run/i,
    /gcloud\s+builds/i,
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
  phase: 'worker-runtime-repo-audit-after-plan-snapshot',
  decision: decision.decision,
  workerDryRunApprovalReady: readiness.workerDryRunApprovalReady,
  workerExecution: false,
  toolExecution: false,
  providerCalls: false,
  dockerRun: false,
  cloudRunJob: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
