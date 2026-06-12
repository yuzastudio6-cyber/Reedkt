import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR,
  buildModelOrchestrationProviderDryRunReports,
} from '../activation/model-orchestration-provider-dry-run'

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
  'activation:model-orchestration-provider-dry-run:plan',
  'activation:model-orchestration-provider-dry-run',
  'activation:model-orchestration-provider-dry-run:report',
  'activation:model-orchestration-provider-dry-run:iam-plan',
  'activation:model-orchestration-provider-dry-run:summary',
  'smoke:activation-model-orchestration-provider-dry-run',
  'activation:model-provider-dry-run',
  'activation:model-provider-dry-run:report',
  'activation:model-provider-dry-run:iam-plan',
  'activation:model-provider-dry-run:summary',
  'smoke:activation-model-provider-dry-run',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/model-orchestration-provider-dry-run/index.ts'), 'Provider dry-run module missing.')
assert(!existsSync('server/workers/model-orchestration-provider-dry-run'), 'Provider dry-run must not add a worker.')
assert(!existsSync('server/routes/model-orchestration-provider-dry-run.ts'), 'Provider dry-run must not add a route.')
assert(existsSync(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR), 'Provider dry-run report dir missing.')
for (const report of MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/model-orchestration-provider-dry-run.md',
  'docs/model-orchestration-provider-dry-run-decision.md',
  'docs/model-orchestration-provider-dry-run-redaction.md',
  'docs/model-orchestration-provider-dry-run-fail-closed.md',
  'docs/implementation-prompts/prompt-model-orchestration-plan-snapshot-contract.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildModelOrchestrationProviderDryRunReports()
const readiness = reports.readinessReport as Record<string, unknown>
assert(
  readiness.decision === 'not_attempted' ||
    readiness.decision === 'provider_dry_run_passed_ready_for_plan_snapshot_contract' ||
    String(readiness.decision).startsWith('blocked_') ||
    readiness.decision === 'rejected_due_provider_safety_failure',
  'Provider dry-run decision must be not_attempted, passed, blocked, or rejected.',
)
assert(readiness.secretPayloadPrinted === false, 'Secret payloads must not be printed.')
assert(readiness.secretPayloadCommitted === false, 'Secret payloads must not be committed.')
assert(readiness.rawProviderResponsesStored === false, 'Raw provider responses must not be stored.')

for (const [key, expected] of Object.entries({
  toolsWorkersRoutes: false,
  mediaProcessing: false,
  supabaseWrites: false,
  rawPromptExecutionIntoWorkersOrTools: false,
  publicArtifacts: false,
  signedUrls: false,
  production: false,
  externalBeta: false,
  paidProduction: false,
})) {
  assert(readiness[key] === expected, `${key} must remain ${expected}.`)
}

const loadedCases = reports.loadedCases as Record<string, unknown>
assert(loadedCases.syntheticOnly === true, 'Loaded cases must be synthetic only.')
assert(loadedCases.rawPromptStoredInReports === false, 'Raw prompts must not be stored in provider reports.')
assert(loadedCases.providerCallCaseCount === 2, 'Provider dry-run must include exactly two provider-call cases.')
assert(loadedCases.maxProviderCalls === 2, 'Provider dry-run must cap calls at two.')
assert(loadedCases.localValidationFixtureCaseCount === 1, 'Provider dry-run must include one local validation fixture.')

const secretAccess = reports.secretAccess as Record<string, unknown>
assert(secretAccess.broadSecretDiscovery === false, 'Broad Secret Manager discovery must remain blocked.')
assert(secretAccess.exactSecretRefsOnly === true, 'Secret access must use exact refs only.')
assert(secretAccess.secretSourcePolicy === 'google_secret_manager_only', 'Provider dry-run must use Secret Manager only.')
assert(secretAccess.dashscopeBaseUrlKey === 'us', 'DashScope report must record the US base URL key only.')
assert(secretAccess.dashscopeBaseUrlPayloadStored === false, 'DashScope base URL payload must not be stored.')
assert(secretAccess.dashscopeRegionPayloadStored === false, 'DashScope region payload must not be stored.')
assert(secretAccess.payloadPrinted === false, 'Secret payload printed must be false.')
assert(secretAccess.payloadCommitted === false, 'Secret payload committed must be false.')

const qwen = reports.qwenRun as Record<string, unknown>
const deepseek = reports.deepseekRun as Record<string, unknown>
for (const provider of [qwen, deepseek]) {
  assert(provider.stream === false, 'Streaming must remain disabled.')
  assert(provider.tools === false, 'Tools must remain disabled.')
  assert(provider.rawProviderResponsesStored === false, 'Raw provider responses must not be stored.')
  assert(provider.rawProviderResponsesPrinted === false, 'Raw provider responses must not be printed.')
}

const failClosed = reports.failClosed as Record<string, unknown>
assert(failClosed.invalidOutputsAccepted === false, 'Invalid outputs must not be accepted.')
assert(failClosed.mutationOnFailure === false, 'Failures must not mutate state.')
assert(failClosed.retryOnFailure === false, 'Failures must not retry.')

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REPORT_DIR),
  ...[
    'docs/model-orchestration-provider-dry-run.md',
    'docs/model-orchestration-provider-dry-run-decision.md',
    'docs/model-orchestration-provider-dry-run-redaction.md',
    'docs/model-orchestration-provider-dry-run-fail-closed.md',
    'docs/implementation-prompts/prompt-model-orchestration-plan-snapshot-contract.md',
  ].filter(existsSync).map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    /"toolsWorkersRoutes"\s*:\s*true/,
    /"mediaProcessing"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"rawPromptExecutionIntoWorkersOrTools"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"production"\s*:\s*true/,
    /"externalBeta"\s*:\s*true/,
    /"paidProduction"\s*:\s*true/,
    /"rawProviderResponseStored"\s*:\s*true/,
    /"rawProviderResponsesStored"\s*:\s*true/,
    /"payloadPrinted"\s*:\s*true/,
    /"payloadCommitted"\s*:\s*true/,
    /"secretValueStoredInReports"\s*:\s*true/,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    new RegExp(`BEGIN ${'PRIVATE KEY'}`),
    new RegExp(`x-goog-${'signature'}=`, 'i'),
    /AKIA[0-9A-Z]{16}/,
    /sk-[A-Za-z0-9]{20,}/,
  ]) {
    assert(!forbidden.test(text), `Forbidden pattern found in ${file}`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'MODEL_DRYRUN_1',
  decision: readiness.decision,
  rawProviderResponsesStored: false,
  secretPayloadPrinted: false,
  toolsWorkersRoutes: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
