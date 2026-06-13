import { existsSync, readFileSync } from 'node:fs'

const REQUIRED_DOCS = [
  'docs/tool-route-execution/tool-route-3-offline-dry-run-approval-packet.md',
  'docs/tool-route-execution/tool-route-3-source-evidence-lockfile.md',
  'docs/tool-route-execution/tool-route-3-approval-decision-record.md',
  'docs/tool-route-execution/tool-route-3-future-command-template.md',
  'docs/tool-route-execution/tool-route-3-qa-observability-requirements.md',
  'docs/tool-route-execution/tool-route-3-cleanup-rollback-plan.md',
  'docs/tool-route-execution/tool-route-4-allowed-blocked-scope.md',
  'docs/prompt-tool-route-3-validation-results.md',
  'docs/implementation-prompts/prompt-tool-route-3-offline-dry-run-approval-packet.md',
]

const REQUIRED_SOURCE_TERMS = [
  'PR #360',
  'PR #371',
  'PR #366',
  'PR #368',
  'PR #372',
  'PR #370',
  'PR #378',
  '0699ae921af3b8980b93221bec094d842d61ddba',
  'f6283e63742d6999910d3887482dc3112da1e570',
  'CONFLICTING / DIRTY',
  'MERGEABLE / CLEAN',
]

const REQUIRED_TERMS = [
  'approved_with_warnings_for_tool_route_4',
  'futureOfflineDryRunExecutionApproved: `true`',
  'liveRouteExecutionApprovedNow: `false`',
  'liveToolExecutionApprovedNow: `false`',
  'workerExecutionApprovedNow: `false`',
  'providerRuntimeApprovedNow: `false`',
  'mediaRuntimeApprovedNow: `false`',
  'audioRuntimeApprovedNow: `false`',
  'supabaseMutationApprovedNow: `false`',
  'publicArtifactsApproved: `false`',
  'signedUrlsApproved: `false`',
  'rawPromptExecutionApproved: `false`',
  'internalBetaApproved: `false`',
  'externalBetaApproved: `false`',
  'productionApproved: `false`',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'none; offline tool-route dry-run approval packet only',
  'DO NOT RUN UNTIL TOOL-ROUTE-4 EXECUTION APPROVAL EXISTS.',
  '<TOOL_ROUTE_4_RUN_ID>',
  '<FIXTURE_DIR>',
  '<SCOPED_TOOL_CALL_MANIFEST_DIR>',
  '<OFFLINE_OUTPUT_DIR>',
  '<APPROVED_PLAN_SNAPSHOT_FIXTURE>',
  'No Supabase mutation, SQL execution',
]

const ALLOWED_DECISION_STATES = [
  'approved_for_tool_route_4_offline_dry_run_execution',
  'approved_with_warnings_for_tool_route_4',
  'blocked_pending_tool_route_approval_fixes',
]

const REQUIRED_SCRIPTS = {
  'tool-route:offline-dry-run-approval:diagnostics': 'node scripts/validation/tool-route-offline-dry-run-approval-diagnostics.mjs',
  'tool-route:2a-refresh-conflict:diagnostics': 'node scripts/validation/tool-route-2a-refresh-conflict-resolution-diagnostics.mjs',
  'tool-route:offline-contract-tests': 'node scripts/validation/tool-route-offline-contract-tests.mjs',
  'tool-route:offline-contract-test:diagnostics': 'node scripts/validation/tool-route-offline-contract-test-diagnostics.mjs',
  'tool-route:1a-sound-refresh:diagnostics': 'node scripts/validation/tool-route-1a-sound-study-refresh-diagnostics.mjs',
  'tool-route:dry-run-fixtures:diagnostics': 'node scripts/validation/tool-route-dry-run-fixtures-diagnostics.mjs',
  'tool-route:execution-unlock:audit:diagnostics': 'node scripts/validation/tool-route-execution-unlock-audit-diagnostics.mjs',
  'tool-study-pending-owners-0:diagnostics': 'node scripts/validation/tool-study-pending-owners-0-diagnostics.mjs',
}

const FORBIDDEN_PATTERNS = [
  [/liveRouteExecutionApprovedNow`?:\s*`?true/i, 'live route execution approval'],
  [/liveToolExecutionApprovedNow`?:\s*`?true/i, 'live tool execution approval'],
  [/workerExecutionApprovedNow`?:\s*`?true/i, 'worker execution approval'],
  [/providerRuntimeApprovedNow`?:\s*`?true/i, 'provider runtime approval'],
  [/mediaRuntimeApprovedNow`?:\s*`?true/i, 'media runtime approval'],
  [/audioRuntimeApprovedNow`?:\s*`?true/i, 'audio runtime approval'],
  [/supabaseMutationApprovedNow`?:\s*`?true/i, 'Supabase mutation approval'],
  [/publicArtifactsApproved`?:\s*`?true/i, 'public artifact approval'],
  [/signedUrlsApproved`?:\s*`?true/i, 'signed URL approval'],
  [/rawPromptExecutionApproved`?:\s*`?true/i, 'raw prompt approval'],
  [/internalBetaApproved`?:\s*`?true/i, 'internal beta approval'],
  [/externalBetaApproved`?:\s*`?true/i, 'external beta approval'],
  [/productionApproved`?:\s*`?true/i, 'production approval'],
  [/SQL executed:\s*`?(yes|true|executed|applied)/i, 'SQL execution claim'],
  [/Migration deployed:\s*`?(yes|true|deployed|applied)/i, 'migration deployed claim'],
  [/Supabase environment touched:\s*`?(staging|production|remote|local)/i, 'Supabase environment touched claim'],
  [/route handler import:\s*`?(yes|true|performed|enabled)/i, 'route handler import claim'],
  [/tool runtime import:\s*`?(yes|true|performed|enabled)/i, 'tool runtime import claim'],
  [/public artifact creation:\s*`?(yes|true|approved)/i, 'public artifact creation claim'],
  [/signed URL creation:\s*`?(yes|true|approved)/i, 'signed URL creation claim'],
  [/gs:\/\//i, 'real GCS path in TOOL-ROUTE-3 docs'],
  [/supabase\.co/i, 'Supabase URL in TOOL-ROUTE-3 docs'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker'],
  [/BEGIN PRIVATE KEY/i, 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-like token'],
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(filePath) {
  assert(existsSync(filePath), `Missing required file: ${filePath}`)
  return readFileSync(filePath, 'utf8')
}

function readJson(filePath) {
  return JSON.parse(read(filePath))
}

const packageJson = readJson('package.json')
for (const [scriptName, command] of Object.entries(REQUIRED_SCRIPTS)) {
  assert(packageJson.scripts?.[scriptName] === command, `Missing or changed package script ${scriptName}.`)
}

const combinedDocs = REQUIRED_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')

for (const term of [...REQUIRED_SOURCE_TERMS, ...REQUIRED_TERMS]) {
  assert(combinedDocs.includes(term), `Missing required term: ${term}`)
}

assert(
  ALLOWED_DECISION_STATES.some((state) => combinedDocs.includes(`Decision state: \`${state}\``) || combinedDocs.includes(`Approval decision: \`${state}\``)),
  'Missing allowed TOOL-ROUTE-3 decision state.',
)

for (const [pattern, label] of FORBIDDEN_PATTERNS) {
  assert(!pattern.test(combinedDocs), `Forbidden ${label} found in TOOL-ROUTE-3 docs.`)
}

const commandTemplate = read('docs/tool-route-execution/tool-route-3-future-command-template.md')
const forbiddenCommandTemplatePatterns = [
  [/https?:\/\//i, 'real URL in future command template'],
  [/gs:\/\//i, 'real GCS path in future command template'],
  [/supabase\.co/i, 'Supabase URL in future command template'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker in future command template'],
]
for (const [pattern, label] of forbiddenCommandTemplatePatterns) {
  assert(!pattern.test(commandTemplate), `Forbidden ${label} found.`)
}

const codeBlocks = [...commandTemplate.matchAll(/```[\s\S]*?```/g)].map((match) => match[0])
assert(codeBlocks.length > 0, 'Future command template must contain at least one command block.')
for (const block of codeBlocks) {
  assert(
    block.includes('DO NOT RUN UNTIL TOOL-ROUTE-4 EXECUTION APPROVAL EXISTS.'),
    'Every command block must contain the required warning text.',
  )
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TOOL-ROUTE-3',
  decisionState: 'approved_with_warnings_for_tool_route_4',
  futureOfflineDryRunExecutionApproved: true,
  docsChecked: REQUIRED_DOCS.length,
  packageScriptsChecked: Object.keys(REQUIRED_SCRIPTS).length,
  sourcePrRefsChecked: REQUIRED_SOURCE_TERMS.length,
  commandBlocksChecked: codeBlocks.length,
  liveRouteExecutionApprovedNow: false,
  liveToolExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  mediaRuntimeApprovedNow: false,
  audioRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  publicArtifactsApproved: false,
  signedUrlsApproved: false,
  rawPromptExecutionApproved: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; offline tool-route dry-run approval packet only',
  nextRecommendedPrompt: 'TOOL-ROUTE-4 - Offline Tool Route Dry-Run Execution',
}, null, 2))
