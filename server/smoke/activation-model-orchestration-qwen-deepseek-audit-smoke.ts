import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_AUDIT_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_AUDIT_REPORT_DIR,
  buildModelOrchestrationAuditReports,
} from '../activation/model-orchestration-qwen-deepseek-audit'

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
  'activation:model-orchestration-qwen-deepseek-audit:plan',
  'activation:model-orchestration-qwen-deepseek-audit',
  'activation:model-orchestration-qwen-deepseek-audit:report',
  'activation:model-orchestration-qwen-deepseek-audit:summary',
  'smoke:activation-model-orchestration-qwen-deepseek-audit',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/model-orchestration-qwen-deepseek-audit/index.ts'), 'Audit module missing.')
assert(!existsSync('server/workers/model-orchestration-qwen-deepseek-audit'), 'Audit phase must not add a worker.')
assert(existsSync(MODEL_ORCHESTRATION_AUDIT_REPORT_DIR), 'Audit report dir missing.')
for (const report of MODEL_ORCHESTRATION_AUDIT_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_AUDIT_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/model-orchestration-qwen-deepseek-audit.md',
  'docs/model-orchestration-qwen-deepseek-agent-brain.md',
  'docs/model-orchestration-raw-prompt-blocker-policy.md',
  'docs/model-orchestration-provider-secret-reference-policy.md',
  'docs/implementation-prompts/prompt-model-orchestration-qwen-deepseek-dry-run-approval.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildModelOrchestrationAuditReports()
const readiness = reports.readinessReport as Record<string, unknown>
assert(readiness.status === 'passed', 'Audit readiness must pass.')
assert(readiness.decision === 'repo_audit_passed_ready_for_dry_run_approval', 'Audit decision must be ready for dry-run approval.')
for (const [key, expected] of Object.entries({
  providerCalls: false,
  secretPayloadAccess: false,
  runtimeToolsWorkersRoutes: false,
  publicArtifacts: false,
  production: false,
  externalBeta: false,
  paidProduction: false,
  sqlExecuted: false,
  migrationDeployed: false,
})) {
  assert(readiness[key] === expected, `${key} must remain ${expected}.`)
}
assert(readiness.supabaseEnvironmentTouched === 'none', 'Supabase environment must not be touched.')

const providerEvidence = reports.providerOfficialEvidenceInventory as {
  status?: string
  qwen?: { qwen37OfficiallyVerified?: boolean; officialModelCandidatesCaptured?: unknown[] }
  deepseek?: { officialModelCandidatesCaptured?: unknown[]; openAiCompatibleBaseUrl?: string }
  noProviderCalls?: boolean
}
assert(providerEvidence.status === 'passed', 'Provider official evidence inventory must pass.')
assert(providerEvidence.qwen?.qwen37OfficiallyVerified === true, 'Qwen 3.7 official evidence must be captured.')
assert(Array.isArray(providerEvidence.qwen?.officialModelCandidatesCaptured), 'Qwen model candidates missing.')
assert(Array.isArray(providerEvidence.deepseek?.officialModelCandidatesCaptured), 'DeepSeek model candidates missing.')
assert(providerEvidence.deepseek?.openAiCompatibleBaseUrl === 'https://api.deepseek.com', 'DeepSeek base URL evidence missing.')
assert(providerEvidence.noProviderCalls === true, 'Provider evidence must not call providers.')

const secrets = reports.secretReferenceInventory as { secretRefs?: Array<Record<string, unknown>>; secretManagerPayloadAccessAttempted?: boolean }
assert(Array.isArray(secrets.secretRefs) && secrets.secretRefs.length >= 4, 'Secret references missing.')
for (const ref of secrets.secretRefs ?? []) {
  assert(ref.payloadAccessed === false, 'Secret payload must not be accessed.')
  assert(ref.payloadPrinted === false, 'Secret payload must not be printed.')
  assert(ref.payloadCommitted === false, 'Secret payload must not be committed.')
}
assert(secrets.secretManagerPayloadAccessAttempted === false, 'Secret Manager payload access must not be attempted.')

const contracts = reports.providerContractInventory as Record<string, unknown>
assert(contracts.status === 'passed', 'Provider contract inventory must pass.')
assert(contracts.approvedPlanSnapshotRequired === true, 'Approved snapshot gate missing.')
assert(contracts.providerCallsDisabledByDefault === true, 'Provider calls must be disabled by default.')
assert(contracts.workerRawPromptGatePresent === true, 'Worker raw-prompt gate missing.')

const blockerPolicy = reports.rawPromptWorkerExecutionBlockerPolicy as Record<string, unknown>
assert(blockerPolicy.status === 'passed', 'Raw prompt blocker policy must pass.')
for (const [key, expected] of Object.entries({
  providerCallsAllowed: false,
  runtimeExecutionAllowed: false,
  publicArtifactsAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  supabaseWritesAllowed: false,
})) {
  assert(blockerPolicy[key] === expected, `${key} must remain ${expected}.`)
}

const corpus = [
  ...readAllFiles('server/activation/model-orchestration-qwen-deepseek-audit'),
  ...readAllFiles(MODEL_ORCHESTRATION_AUDIT_REPORT_DIR),
  ...[
    'docs/model-orchestration-qwen-deepseek-audit.md',
    'docs/model-orchestration-qwen-deepseek-agent-brain.md',
    'docs/model-orchestration-raw-prompt-blocker-policy.md',
    'docs/model-orchestration-provider-secret-reference-policy.md',
    'docs/implementation-prompts/prompt-model-orchestration-qwen-deepseek-dry-run-approval.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    'REEDITPRO_CONFIRM_PROVIDER_CALLS=true',
    'REEDITPRO_CONFIRM_QWEN_API_CALL=true',
    'REEDITPRO_CONFIRM_DEEPSEEK_API_CALL=true',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION=true',
    'REEDITPRO_CONFIRM_WORKER_EXECUTION=true',
    'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION=true',
    'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS=true',
    'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY=true',
    'REEDITPRO_CONFIRM_PRODUCTION_WRITE=true',
    'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK=true',
    'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK=true',
    'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT=true',
    'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE=true',
    'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL=true',
    'payloadAccessed": true',
    'payloadPrinted": true',
    'payloadCommitted": true',
    'providerCalls": true',
    'qwenApiCall": true',
    'deepseekApiCall": true',
    'runtimeToolsWorkersRoutes": true',
    'rawPromptExecution": true',
    'publicArtifacts": true',
    'signedUrls": true',
    'supabaseWrites": true',
    'productionAffected": true',
  ]) {
    assert(!text.includes(forbidden), `${file} contains forbidden marker: ${forbidden}`)
  }

  for (const secretPattern of [
    /postgres(?:ql)?:\/\/[^\s"`]+/i,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /BEGIN PRIVATE KEY/,
    /x-goog-signature=/i,
    /sk-[A-Za-z0-9]{20,}/,
  ]) {
    assert(!secretPattern.test(text), `${file} contains a secret-like value.`)
  }
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'model-orchestration-qwen-deepseek-audit',
  decision: readiness.decision,
  qwenEvidence: 'captured',
  deepSeekEvidence: 'captured',
  providerCalls: false,
  secretPayloadAccess: false,
  runtimeExecution: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
