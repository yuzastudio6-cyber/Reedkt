import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR,
  buildModelOrchestrationDryRunApprovalReports,
} from '../activation/model-orchestration-dry-run-approval'

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
  'activation:model-orchestration-dry-run-approval:plan',
  'activation:model-orchestration-dry-run-approval',
  'activation:model-orchestration-dry-run-approval:report',
  'activation:model-orchestration-dry-run-approval:summary',
  'smoke:activation-model-orchestration-dry-run-approval',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/model-orchestration-dry-run-approval/index.ts'), 'Dry-run approval module missing.')
assert(!existsSync('server/workers/model-orchestration-dry-run-approval'), 'Dry-run approval must not add a worker.')
assert(existsSync(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR), 'Dry-run approval report dir missing.')
for (const report of MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/model-orchestration-dry-run-approval.md',
  'docs/model-orchestration-dry-run-schema-contract.md',
  'docs/model-orchestration-dry-run-audit-redaction-policy.md',
  'docs/model-orchestration-dry-run-approval-decision.md',
  'docs/implementation-prompts/prompt-model-orchestration-qwen-deepseek-provider-dry-run.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildModelOrchestrationDryRunApprovalReports()
const readiness = reports.readinessReport as Record<string, unknown>
assert(readiness.status === 'passed', 'Dry-run approval readiness must pass.')
assert(
  readiness.decision === 'approved_for_future_qwen_deepseek_provider_dry_run',
  'Dry-run approval decision must approve the future synthetic provider dry-run.',
)
for (const [key, expected] of Object.entries({
  providerCalls: false,
  secretPayloadAccess: false,
  runtimeToolsWorkersRoutes: false,
  rawPromptExecution: false,
  publicArtifacts: false,
  signedUrls: false,
  production: false,
  externalBeta: false,
  paidProduction: false,
  sqlExecuted: false,
  migrationDeployed: false,
})) {
  assert(readiness[key] === expected, `${key} must remain ${expected}.`)
}

const providerReview = reports.providerCandidateReview as Record<string, unknown>
assert(providerReview.status === 'passed', 'Provider candidate review must pass.')
assert(providerReview.modelAliasDeterministic === true, 'Provider aliases must be deterministic.')
assert(providerReview.providerCalls === false, 'Provider calls must remain false.')
assert(providerReview.secretPayloadAccess === false, 'Secret payload access must remain false.')

const cases = reports.syntheticCases as { status?: string; caseCount?: number; syntheticOnly?: boolean; cases?: unknown[] }
assert(cases.status === 'passed', 'Synthetic case report must pass.')
assert(cases.caseCount === 8, 'Synthetic case report must include eight cases.')
assert(cases.syntheticOnly === true, 'Dry-run cases must be synthetic only.')
assert(Array.isArray(cases.cases), 'Dry-run cases missing.')
for (const item of cases.cases ?? []) {
  const record = item as Record<string, unknown>
  assert(typeof record.caseId === 'string', 'Dry-run case missing caseId.')
  assert(typeof record.prompt === 'string', 'Dry-run case missing synthetic prompt.')
  assert(Array.isArray(record.allowedProviderCandidates), 'Dry-run case missing provider candidates.')
  assert(record.maxTokens, 'Dry-run case missing token cap.')
  assert(record.timeoutMs, 'Dry-run case missing timeout.')
  assert(record.costGuard, 'Dry-run case missing cost guard.')
}

const schemas = reports.outputSchemaContracts as { status?: string; schemas?: unknown[]; validationErrorsFailClosed?: boolean }
assert(schemas.status === 'passed', 'Schema contract report must pass.')
assert(Array.isArray(schemas.schemas) && schemas.schemas.length === 5, 'Expected five schema contracts.')
assert(schemas.validationErrorsFailClosed === true, 'Schema validation errors must fail closed.')

const cost = reports.costGuardrails as Record<string, unknown>
assert(cost.status === 'passed', 'Cost guardrails must pass.')
assert(cost.streamingAllowed === false, 'Streaming must remain blocked.')
assert(cost.providerCallsInThisPhase === false, 'Provider calls must not run in approval phase.')

const redaction = reports.auditRedactionPolicy as Record<string, unknown>
assert(redaction.status === 'passed', 'Audit redaction policy must pass.')
assert(redaction.rawProviderResponseStorageAllowed === false, 'Raw provider response storage must remain blocked.')
assert(redaction.secretPayloadAccess === false, 'Secret payload access must remain false.')

const failClosed = reports.failClosedPolicy as { status?: string; failClosedTriggers?: string[] }
assert(failClosed.status === 'passed', 'Fail-closed policy must pass.')
for (const trigger of ['invalid_json', 'schema_mismatch', 'provider_timeout', 'cost_overrun', 'raw_prompt_pass_through']) {
  assert(failClosed.failClosedTriggers?.includes(trigger), `Missing fail-closed trigger: ${trigger}`)
}

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REPORT_DIR),
  ...[
    'docs/model-orchestration-dry-run-approval.md',
    'docs/model-orchestration-dry-run-schema-contract.md',
    'docs/model-orchestration-dry-run-audit-redaction-policy.md',
    'docs/model-orchestration-dry-run-approval-decision.md',
    'docs/implementation-prompts/prompt-model-orchestration-qwen-deepseek-provider-dry-run.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    /"providerCalls"\s*:\s*true/,
    /"secretPayloadAccess"\s*:\s*true/,
    /"runtimeToolsWorkersRoutes"\s*:\s*true/,
    /"rawPromptExecution"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"production"\s*:\s*true/,
    /"externalBeta"\s*:\s*true/,
    /"paidProduction"\s*:\s*true/,
    /postgres(?:ql)?:\/\/[^\\s"'`]+/i,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /BEGIN PRIVATE KEY/,
    /x-goog-signature=/i,
    /AKIA[0-9A-Z]{16}/,
    /sk-[A-Za-z0-9]{20,}/,
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-dry-run-approval',
  decision: readiness.decision,
  syntheticCases: cases.caseCount,
  schemaContracts: schemas.schemas?.length,
  providerCalls: false,
  secretPayloadAccess: false,
  runtimeExecution: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
