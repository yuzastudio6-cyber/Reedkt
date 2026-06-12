import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_EXPECTED_REPORTS,
  MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REPORT_DIR,
  buildModelOrchestrationQwenAuthRepairReports,
} from '../activation/model-orchestration-qwen-auth-repair'

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
  'activation:model-orchestration-qwen-auth-repair:plan',
  'activation:model-orchestration-qwen-auth-repair',
  'activation:model-orchestration-qwen-auth-repair:report',
  'activation:model-orchestration-qwen-auth-repair:summary',
  'smoke:activation-model-orchestration-qwen-auth-repair',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/model-orchestration-qwen-auth-repair/index.ts'), 'Qwen auth repair module missing.')
assert(!existsSync('server/workers/model-orchestration-qwen-auth-repair'), 'Qwen auth repair must not add a worker.')
assert(!existsSync('server/routes/model-orchestration-qwen-auth-repair.ts'), 'Qwen auth repair must not add a route.')
assert(existsSync(MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REPORT_DIR), 'Qwen auth repair report dir missing.')
for (const report of MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_EXPECTED_REPORTS) {
  assert(existsSync(path.join(MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/model-orchestration-qwen-auth-repair.md',
  'docs/model-orchestration-qwen-auth-repair-decision.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildModelOrchestrationQwenAuthRepairReports()
const readiness = reports.readinessReport as Record<string, unknown>
assert(
  readiness.decision === 'not_attempted' ||
    readiness.decision === 'qwen_alias_repaired_ready_for_plan_snapshot_contract' ||
    readiness.decision === 'qwen_auth_repaired_ready_for_provider_dry_run_update' ||
    String(readiness.decision).startsWith('blocked_') ||
    readiness.decision === 'rejected_due_qwen_provider_auth_risk',
  'Qwen auth repair decision must be not_attempted, repaired, blocked, or rejected.',
)
assert(readiness.secretPayloadPrinted === false, 'Secret payloads must not be printed.')
assert(readiness.secretPayloadCommitted === false, 'Secret payloads must not be committed.')
assert(readiness.rawProviderResponsesStored === false, 'Raw provider responses must not be stored.')
assert(readiness.deepseekRerun === false, 'DeepSeek must not be rerun by the Qwen auth repair packet.')
assert(readiness.approvedTargetAliasesUsedOnlyAfterUsProbe === true, 'Official target aliases must remain gated by the repair flow.')
assert(readiness.approvedQwen37AliasesAllowedForTargetProbe === false, 'Qwen 3.7 aliases must not be accepted as canonical target probes.')
assert(readiness.selectedBaseUrlKey === 'virginia', 'Qwen auth repair must use the Virginia DashScope base URL key.')
assert(readiness.selectedBaseUrlClassification === 'virginia_dashscope_base_url', 'Qwen auth repair must record the Virginia base URL classification.')
assert(readiness.approvedDashScopeRegion === 'us-virginia', 'Qwen auth repair must record the Virginia region.')
assert(readiness.operatorReportedReplacementVersion === '3', 'Operator-reported DashScope key replacement version must be recorded.')
assert(readiness.secretVersionSelector === 'latest', 'DashScope secret version selector must remain latest.')
assert(
  readiness.keyReplacementConfirmation === 'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED',
  'DashScope key replacement confirmation must be recorded.',
)

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

const plan = reports.plan as Record<string, unknown>
assert(plan.qwenOnly === true, 'Qwen auth repair must be Qwen-only.')
assert(plan.deepseekRerun === false, 'DeepSeek rerun must remain false.')
assert(Array.isArray(plan.officialAliasesInProbeOrder), 'Official Qwen alias order missing.')
assert(
  JSON.stringify(plan.officialAliasesInProbeOrder) === JSON.stringify(['qwen-plus', 'qwen3-max', 'qwen-max']),
  'Unexpected Qwen alias order.',
)
assert(plan.canonicalSelectedAlias === 'qwen-plus', 'Canonical selected alias must be qwen-plus.')
assert(plan.defaultBaseUrlKey === 'virginia', 'Default base URL key must be Virginia.')

const secretAccess = reports.secretAccess as Record<string, unknown>
assert(secretAccess.broadSecretDiscovery === false, 'Broad Secret Manager discovery must remain blocked.')
assert(secretAccess.exactSecretRefsOnly === true, 'Secret access must use exact refs only.')
assert(
  JSON.stringify(secretAccess.exactSecretRefs) === JSON.stringify(['DASHSCOPE_API_KEY']),
  'Secret access must use only the exact DashScope API key ref.',
)
assert(secretAccess.secretSourcePolicy === 'google_secret_manager_only', 'Qwen auth repair must use Secret Manager only.')
assert(secretAccess.secretVersionSelector === 'latest', 'Secret report must record latest selector.')
assert(secretAccess.operatorReportedReplacementVersion === '3', 'Secret report must record operator version 3.')
assert(secretAccess.secretPayloadValuesStoredInReport === false, 'Secret payload values must not be stored in reports.')
assert(secretAccess.keyReplacementConfirmation === 'REEDITPRO_CONFIRM_QWEN_DASHSCOPE_KEY_REPLACED', 'Secret report must record key replacement confirmation.')
assert(secretAccess.payloadPrinted === false, 'Secret payload printed must be false.')
assert(secretAccess.payloadCommitted === false, 'Secret payload committed must be false.')
assert(secretAccess.deepseekSecretAccessed === false, 'DeepSeek secret must not be accessed in Qwen repair.')

const authProbe = reports.authProbe as Record<string, unknown>
assert(authProbe.stream === false, 'Streaming must remain disabled.')
assert(authProbe.tools === false, 'Tools must remain disabled.')
assert(
  JSON.stringify(authProbe.probeAliasOrder) === JSON.stringify(['qwen-plus', 'qwen3-max', 'qwen-max']),
  'Auth probe alias order must use official canonical aliases only.',
)
assert(authProbe.selectedBaseUrlClassification === 'virginia_dashscope_base_url', 'Auth probe must record Virginia base URL classification.')
assert(authProbe.rawProviderResponsesStored === false, 'Raw provider responses must not be stored.')
assert(authProbe.rawProviderResponsesPrinted === false, 'Raw provider responses must not be printed.')

const repairedRun = reports.repairedDryRun as Record<string, unknown>
assert(repairedRun.deepseekRerun === false, 'Repaired dry-run must not run DeepSeek.')
assert(repairedRun.schemaCasesRunOnlyForApprovedTargetAlias === true, 'Schema cases must run only for an approved target alias.')
assert(repairedRun.stream === false, 'Qwen repaired dry-run streaming must remain disabled.')
assert(repairedRun.tools === false, 'Qwen repaired dry-run tools must remain disabled.')
assert(repairedRun.rawProviderResponsesStored === false, 'Qwen repaired dry-run raw responses must not be stored.')

const canonicalization = reports.greenEvidenceCanonicalization as Record<string, unknown>
assert(canonicalization.promptProseAcceptedAsEvidence === false, 'Prompt prose must not be accepted as green evidence.')
assert(canonicalization.prCommentsAcceptedAsEvidence === false, 'PR comments must not be accepted as green evidence.')
assert(canonicalization.structuredReportEvidenceRequired === true, 'Structured report evidence must be required.')
assert(canonicalization.requiredSelectedAlias === 'qwen-plus', 'Canonicalization must require qwen-plus.')
assert(canonicalization.selectedBaseUrlClassification === 'virginia_dashscope_base_url', 'Canonicalization must require Virginia base URL classification.')
assert(canonicalization.deepseekRerun === false, 'Canonicalization must not rerun DeepSeek.')

const corpus = [
  ...readAllFiles(MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REPORT_DIR),
  ...[
    'docs/model-orchestration-qwen-auth-repair.md',
    'docs/model-orchestration-qwen-auth-repair-decision.md',
    'docs/implementation-prompts/prompt-qwen-dashscope-key-service-operator-fix.md',
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
    /"deepseekRerun"\s*:\s*true/,
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
  phase: 'model-orchestration-qwen-auth-repair',
  decision: readiness.decision,
  selectedQwenAlias: readiness.selectedQwenAlias,
  deepseekRerun: false,
  rawProviderResponsesStored: false,
  secretPayloadPrinted: false,
  toolsWorkersRoutes: false,
  supabaseWrites: false,
  productionAffected: false,
}, null, 2))
