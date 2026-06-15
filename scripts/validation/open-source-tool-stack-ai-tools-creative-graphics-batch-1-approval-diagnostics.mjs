import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const allowedDecisionStates = new Set([
  'approved_for_ai_tools_creative_graphics_install_proof_batch_1',
  'approved_with_warnings_for_ai_tools_creative_graphics_batch_1',
  'blocked_pending_package_lock_base_fix',
  'blocked_pending_batch_1_scope_fixes',
  'blocked_pending_license_or_runtime_review',
])

const expectedBlockedDecision = 'blocked_pending_package_lock_base_fix'
const selectedTools = ['d3', 'echarts', 'vega_lite']
const excludedTools = [
  'torch_torchvision',
  'transformers',
  'kornia',
  'sam2',
  'birefnet',
  'real_esrgan',
  'pixijs',
  'three_js',
  'babylon_js',
  'konva',
  'lottie',
  'rembg',
  'transparent_background',
]
const legacyExcluded = ['Remotion', 'Revideo', 'Satori', 'resvg', 'Viz', 'Graphviz', 'SVG.js', 'Anime.js']

const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-proof-approval-batch-1.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-source-evidence-lockfile.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-tool-selection.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-validation-plan.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-package-lock-blocker-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-allowed-blocked-scope.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-approval-decision.md',
  'docs/prompt-ai-tools-creative-graphics-install-proof-approval-batch-1-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-install-proof-approval-batch-1.md',
]

const requiredFalseBooleans = [
  'futureDependencyInstallApproved',
  'packageLockMutationApproved',
  'futureImportSmokeApproved',
  'futureSyntheticFixtureApproved',
  'actualToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'renderExportApprovedNow',
  'mediaRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const forbiddenPatterns = [
  ['dependency_install_happened', /\b(?:dependency install|dependencies installed|npm install) (?:completed|happened|ran|succeeded|was performed)\b/i],
  ['package_lock_mutated', /\bpackage-lock(?:\.json)? (?:was )?(?:mutated|updated|changed|repaired)\b/i],
  ['e2e_proof_happened', /\bE2E proof (?:completed|happened|ran|succeeded|was performed)\b/i],
  ['tool_execution_enabled', /\btool execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['route_execution_enabled', /\broute execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['worker_execution_enabled', /\bworker execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['provider_enabled', /\bprovider\/?model (?:calls?|execution)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['supabase_enabled', /\bSupabase (?:write|mutation|SQL)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['gcs_enabled', /\b(?:GCS upload|storage transfer)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['public_artifact_enabled', /\bpublic artifacts?\b[^.\n]*(?:enabled|approved|allowed|created|true)\b/i],
  ['signed_url_enabled', /\bsigned URLs?\b[^.\n]*(?:enabled|approved|allowed|created|true)\b/i],
  ['beta_enabled', /\b(?:internal beta|external beta)\b[^.\n]*(?:enabled|approved|allowed|unlocked|true)\b/i],
  ['production_enabled', /\bproduction\b[^.\n]*(?:enabled|approved|allowed|unlocked|true)\b/i],
  [
    'secret_material',
    /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i,
  ],
]

const failures = []

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')
const unsafeClaimText = docsText.replace(/\bNo [^.\n]* was enabled\./g, '')

for (const [name, pattern] of forbiddenPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (decisions.length === 0) failures.push('missing_decision')
for (const decision of decisions) {
  if (!allowedDecisionStates.has(decision)) failures.push(`invalid_decision:${decision}`)
}
if (!decisions.includes(expectedBlockedDecision)) failures.push(`expected_blocked_decision_missing:${expectedBlockedDecision}`)

for (const id of selectedTools) {
  if (!docsText.includes(`\`${id}\``)) failures.push(`selected_tool_missing:${id}`)
}
for (const id of excludedTools) {
  if (!docsText.includes(`\`${id}\``)) failures.push(`excluded_tool_missing:${id}`)
}
for (const label of legacyExcluded) {
  if (!docsText.includes(label)) failures.push(`legacy_exclusion_missing:${label}`)
}

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-approval-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-approval-decision.md', 'utf8')
  : ''
for (const field of requiredFalseBooleans) {
  const pattern = new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`false\`\\s*\\|`)
  if (!pattern.test(decisionDoc)) failures.push(`approval_boolean_not_false:${field}`)
}

const packageLockReview = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-package-lock-blocker-review.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-package-lock-blocker-review.md', 'utf8')
  : ''
for (const token of ['@emnapi/runtime', '@emnapi/core', '@emnapi/wasi-threads']) {
  if (!packageLockReview.includes(token)) failures.push(`package_lock_blocker_missing:${token}`)
}
if (!packageLockReview.includes('This approval packet does not repair or mutate `package-lock.json`.')) {
  failures.push('package_lock_no_mutation_statement_missing')
}

for (const token of ['no write', 'docs_only', 'environment touched: `none`', 'SQL executed: `none`', 'migration deployed: `no`']) {
  if (!decisionDoc.includes(token)) failures.push(`supabase_field_missing:${token}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (
  packageJson.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:batch-1-approval:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-1-approval-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:batch-1-approval:diagnostics')
}

try {
  const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
  if (packageLockStatus) failures.push(`package_lock_changed:${packageLockStatus}`)
} catch (error) {
  failures.push(`package_lock_status_failed:${error.message}`)
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decisionState: expectedBlockedDecision,
  selectedTools,
  excludedTools: excludedTools.length + legacyExcluded.length,
  futureDependencyInstallApproved: false,
  packageLockMutationApproved: false,
  futureImportSmokeApproved: false,
  futureSyntheticFixtureApproved: false,
  actualToolExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  renderExportApprovedNow: false,
  supabaseUpdateRequired: 'no write',
  supabaseStatus: 'docs_only',
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
