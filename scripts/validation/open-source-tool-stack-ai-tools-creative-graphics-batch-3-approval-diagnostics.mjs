import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const diffBase =
  process.env.AI_TOOLS_CREATIVE_GRAPHICS_BATCH_3_APPROVAL_DIFF_BASE ??
  'origin/codex/rp-ai-tools-creative-graphics-batch-2-qa-review'
const expectedDecision = 'approved_with_warnings_for_ai_graphics_batch_3'
const allowedDecisions = new Set([
  'approved_for_ai_graphics_batch_3_install_proof_execution',
  expectedDecision,
  'blocked_pending_ai_graphics_batch_3_scope_fixes',
  'blocked_pending_browser_runtime_boundary_review',
  'blocked_pending_license_or_runtime_review',
  'blocked_pending_package_risk_review',
  'ai_graphics_batch_3_qa_passed_with_warnings',
])
const selectedPackages = ['animejs', 'three', 'pixi.js', 'konva', 'babylonjs']
const batch3ExecutionDecision = 'ai_graphics_batch_3_install_import_manifest_proof_passed_with_warnings'
const excludedTokens = [
  '@resvg/resvg-js',
  'Remotion',
  'provider-generated graphics',
  'real media/render/browser output',
  'route/tool/worker/provider runtime',
]
const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-approval-packet.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-source-evidence-lockfile.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-tool-selection.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-excluded-tools.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-validation-plan.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-package-scope.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-runtime-boundary.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-allowed-blocked-scope.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-approval-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-recommendation.md',
  'docs/prompt-ai-tools-creative-graphics-batch-3-approval-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-batch-3-approval-packet.md',
]
const requiredEvidenceDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-qa-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-qa-review.md',
  'docs/prompt-ai-tools-creative-graphics-batch-2-qa-review-validation-results.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.json',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-batches.json',
]
const requiredTrueBooleans = [
  'futureDependencyInstallApproved',
  'packageLockMutationApproved',
  'futureImportSmokeApproved',
  'futureSyntheticFixtureApproved',
]
const requiredFalseBooleans = [
  'batch3ExecutionApprovedNow',
  'e2eProductionProofClaimed',
  'actualToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'renderExportApprovedNow',
  'mediaRuntimeApprovedNow',
  'browserRuntimeApprovedNow',
  'webglRuntimeApprovedNow',
  'canvasRuntimeApprovedNow',
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
  ['batch_3_install_claim', /\bBatch 3 (?:install|dependency install)\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
  ['batch_3_import_claim', /\bBatch 3 import smoke\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
  ['batch_3_fixture_claim', /\bBatch 3 synthetic fixture\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
  ['e2e_production_claim', /\bE2E production proof\b[^.\n]*(?:claimed|completed|passed|true|enabled)\b/i],
  ['runtime_ready_claim', /\bruntime[- ]route[- ]ready\b[^.\n]*(?:claimed|approved|enabled|true)\b/i],
  ['tool_execution_enabled', /\bactual tool execution\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['route_execution_enabled', /\broute execution\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['worker_execution_enabled', /\bworker execution\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['provider_enabled', /\bprovider\/?model (?:calls?|execution|runtime)\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['browser_runtime_enabled', /\b(?:browser|WebGL|canvas|DOM) runtime\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['render_enabled', /\b(?:render\/export|render export|Remotion render|resvg rasterization)\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['supabase_enabled', /\bSupabase (?:write|mutation|SQL)\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['gcs_enabled', /\b(?:GCS upload|storage transfer)\b[^.\n]*(?:enabled|approved now|allowed now|performed|executed|true)\b/i],
  ['public_artifact_enabled', /\bpublic artifacts?\b[^.\n]*(?:enabled|approved now|allowed now|created|true)\b/i],
  ['signed_url_enabled', /\bsigned URLs?\b[^.\n]*(?:enabled|approved now|allowed now|created|true)\b/i],
  ['beta_enabled', /\b(?:internal beta|external beta)\b[^.\n]*(?:enabled|approved now|allowed now|unlocked|true)\b/i],
  ['production_enabled', /\bproduction\b[^.\n]*(?:enabled|approved now|allowed now|unlocked|true)\b/i],
  [
    'secret_material',
    /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i,
  ],
]

const failures = []
const env = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const git = (args) => execFileSync('git', args, { env, encoding: 'utf8' }).trim()
const batch3ExecutionContext =
  existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-readiness-decision.md') &&
  readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-readiness-decision.md', 'utf8').includes(
    batch3ExecutionDecision,
  )
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return null
  }
}

for (const path of [...requiredDocs, ...requiredEvidenceDocs]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')
const unsafeClaimText = docsText
  .replace(/\b[Nn]o [^.\n]*(?: was (?:enabled|performed|claimed|created)| ran| is approved| happened)\./g, '')
  .split('\n')
  .filter((line) => !/\b(?:blocked|not claimed|not approved|does not approve|future-only|later Batch 3 execution|remains false|remains blocked|out of scope|deferred|excluded|has not happened|does not make)\b/i.test(line))
  .join('\n')

for (const [name, pattern] of forbiddenPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

for (const token of ['PR #437', '6a25d2d76702ec0ef015488a20db6048e5e8ba7a', 'ai_graphics_batch_2_qa_passed_with_warnings']) {
  if (!docsText.includes(token)) failures.push(`batch_2_qa_evidence_missing:${token}`)
}
for (const packageName of selectedPackages) {
  if (!docsText.includes(`\`${packageName}\``)) failures.push(`selected_package_missing:${packageName}`)
}
for (const token of excludedTokens) {
  if (!docsText.includes(token)) failures.push(`excluded_token_missing:${token}`)
}
for (const token of ['babylon_js', 'AI_TOOLS_CREATIVE_GRAPHICS']) {
  const inventoryText = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.json')
    ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.json', 'utf8')
    : ''
  if (!inventoryText.includes(token)) failures.push(`owner_inventory_token_missing:${token}`)
}

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-approval-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-approval-decision.md', 'utf8')
  : ''
for (const field of requiredTrueBooleans) {
  if (!new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`true\`\\s*\\|`).test(decisionDoc)) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (!new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`false\`\\s*\\|`).test(decisionDoc)) failures.push(`required_boolean_not_false:${field}`)
}
for (const token of ['no write', 'docs_only', 'environment touched: `none`', 'SQL executed: `none`', 'migration deployed: `no`', 'milestone sync: `not_performed`']) {
  if (!decisionDoc.includes(token)) failures.push(`supabase_field_missing:${token}`)
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:batch-3-approval:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-3-approval-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:batch-3-approval:diagnostics')
}

const basePackageJson = JSON.parse(git(['show', `${diffBase}:package.json`]))
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  const currentSection = packageJson?.[section] ?? {}
  const baseSection = basePackageJson?.[section] ?? {}
  if (JSON.stringify(currentSection) !== JSON.stringify(baseSection)) {
    const added = Object.keys(currentSection).filter((name) => !baseSection[name])
    const removed = Object.keys(baseSection).filter((name) => !currentSection[name])
    const changed = Object.keys(currentSection).filter((name) => baseSection[name] && baseSection[name] !== currentSection[name])
    const approvedExecutionDependencyChange =
      batch3ExecutionContext &&
      section === 'dependencies' &&
      removed.length === 0 &&
      changed.length === 0 &&
      added.every((name) => selectedPackages.includes(name))
    if (!approvedExecutionDependencyChange) failures.push(`package_section_changed:${section}`)
  }
}
const changedFiles = new Set(
  [...git(['diff', '--name-only']).split('\n'), ...git(['diff', '--cached', '--name-only']).split('\n')].filter(Boolean),
)
if (changedFiles.has('package-lock.json') && !batch3ExecutionContext) failures.push('package_lock_changed')

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const trackedGeneratedOutputs = git(['ls-files'])
  .split('\n')
  .filter((path) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|svg|pdf)$/i.test(path))
  .filter((path) => path.includes('open-source-tool-stack') || path.includes('ai-graphics-batch-3'))
if (trackedGeneratedOutputs.length > 0) failures.push(`generated_media_or_render_output_tracked:${trackedGeneratedOutputs.join(',')}`)

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decisionState: expectedDecision,
  selectedPackages,
  futureDependencyInstallApproved: true,
  packageLockMutationApproved: true,
  futureImportSmokeApproved: true,
  futureSyntheticFixtureApproved: true,
  batch3ExecutionApprovedNow: false,
  e2eProductionProofClaimed: false,
  actualToolExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  renderExportApprovedNow: false,
  browserRuntimeApprovedNow: false,
  webglRuntimeApprovedNow: false,
  canvasRuntimeApprovedNow: false,
  supabaseUpdateRequired: 'no write',
  supabaseStatus: 'docs_only',
  packageLockUnchanged: !changedFiles.has('package-lock.json'),
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
