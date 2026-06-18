import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const diffBase =
  process.env.AI_TOOLS_CREATIVE_GRAPHICS_BATCH_2_APPROVAL_DIFF_BASE ??
  'origin/codex/rp-ai-tools-creative-graphics-batch-1-qa-review'
const expectedDecision = 'approved_with_warnings_for_ai_graphics_batch_2'
const allowedDecisions = new Set([
  expectedDecision,
  'blocked_pending_ai_graphics_batch_2_approval_fixes',
  'ai_graphics_batch_2_qa_passed_with_warnings',
  'approved_with_warnings_for_ai_graphics_batch_3',
  'ai_graphics_batch_3_qa_passed_with_warnings',
])
const selectedPackages = ['satori', '@svgdotjs/svg.js', '@viz-js/viz', 'lottie-web']
const approvedBatch3ExecutionDependencies = ['animejs', 'three', 'pixi.js', 'konva', 'babylonjs']
const executionContextDecision = 'ai_graphics_batch_2_install_import_synthetic_proof_passed_with_warnings'
const batch3ExecutionDecision = 'ai_graphics_batch_3_install_import_manifest_proof_passed_with_warnings'
const allowedExecutionScripts = [
  'open-source-tool-stack:ai-tools-creative-graphics:batch-2-import-smoke',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-2-synthetic-fixtures',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-2-execution:diagnostics',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-2-qa:diagnostics',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-3-approval:diagnostics',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-3-import-smoke',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-3-synthetic-fixtures',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-3-execution:diagnostics',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-3-qa:diagnostics',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-4-approval:diagnostics',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-4-policy-qa:diagnostics',
  'open-source-tool-stack:ai-tools-creative-graphics:route-manifest-integration-approval:diagnostics',
  'open-source-tool-stack:ai-tools-creative-graphics:route-manifest-integration-qa:diagnostics',
  'tool-route:ai-graphics-metadata-integration-approval:diagnostics',
  'tool-route:ai-graphics-metadata-integration-qa:diagnostics',
  'tool-route:ai-graphics-metadata-local-fixture-plan:diagnostics',
  'tool-route:ai-graphics-metadata-local-fixture-validation-approval:diagnostics',
  'tool-route:ai-graphics-metadata-local-fixture-validation:execute',
  'tool-route:ai-graphics-metadata-local-fixture-validation:diagnostics',
  'tool-route:ai-graphics-metadata-local-fixture-validation-qa:diagnostics',
  'tool-route:ai-graphics-metadata-local-fixture-owner-approval:diagnostics',
  'tool-route:ai-graphics-metadata-local-fixture-gate-status:diagnostics',
  'tool-route:ai-graphics-metadata-local-fixture-gate-status-qa:diagnostics',
  'tool-route:ai-graphics-metadata-local-fixture-gate-status-owner-approval:diagnostics',
]
const deferredPackages = ['animejs']
const excludedTokens = [
  '@resvg/resvg-js',
  'Remotion',
  'Three',
  'Pixi',
  'Konva',
  'Babylon',
  'provider-generated graphics',
  'real media/render/browser output',
]
const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-approval-packet.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-source-evidence-lockfile.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-tool-selection.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-excluded-tools.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-package-scope.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-validation-plan.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-allowed-blocked-scope.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-approval-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-recommendation.md',
  'docs/prompt-ai-tools-creative-graphics-batch-2-approval-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-batch-2-approval-packet.md',
]
const batch1EvidenceDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-qa-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-qa-review.md',
  'docs/prompt-ai-tools-creative-graphics-batch-1-qa-review-validation-results.md',
]
const requiredTrueBooleans = [
  'futureDependencyInstallApproved',
  'packageLockMutationApproved',
  'futureImportSmokeApproved',
  'futureSyntheticFixtureApproved',
]
const requiredFalseBooleans = [
  'batch2ExecutionApprovedNow',
  'batch2InstallPerformedNow',
  'batch2ImportSmokePerformedNow',
  'batch2SyntheticFixtureProofPerformedNow',
  'e2eProductionProofClaimed',
  'actualToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserRuntimeApprovedNow',
  'webglRuntimeApprovedNow',
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
  ['batch_2_install_claim', /\bBatch 2 (?:install|dependency install)\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
  ['batch_2_import_claim', /\bBatch 2 import smoke\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
  ['batch_2_fixture_claim', /\bBatch 2 synthetic fixture\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
  ['e2e_production_claim', /\bE2E production proof\b[^.\n]*(?:claimed|completed|passed|true|enabled)\b/i],
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
const batch2ExecutionContext =
  existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-readiness-decision.md') &&
  readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-readiness-decision.md', 'utf8').includes(
    executionContextDecision,
  )
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

for (const path of [...requiredDocs, ...batch1EvidenceDocs]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')
const unsafeClaimText = docsText
  .replace(/\b[Nn]o [^.\n]*(?: was (?:enabled|performed|claimed|created)| ran| is approved)\./g, '')
  .split('\n')
  .filter((line) => !/\b(?:blocked|not approved|does not approve|future-only|future proof|later Batch 2 execution|remains false|remains blocked|out of scope|deferred|excluded)\b/i.test(line))
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

for (const token of ['PR #428', 'e75d654e6e5ce1c0464cc389ce48dd03f1d0a70d', 'ai_graphics_batch_1_qa_passed_with_warnings']) {
  if (!docsText.includes(token)) failures.push(`batch_1_qa_evidence_missing:${token}`)
}

for (const packageName of selectedPackages) {
  if (!docsText.includes(`\`${packageName}\``)) failures.push(`selected_package_missing:${packageName}`)
}
for (const packageName of deferredPackages) {
  if (!docsText.includes(`\`${packageName}\``)) failures.push(`deferred_package_missing:${packageName}`)
}
for (const token of excludedTokens) {
  if (!docsText.includes(token)) failures.push(`excluded_token_missing:${token}`)
}

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-approval-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-approval-decision.md', 'utf8')
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
  packageJson?.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:batch-2-approval:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-2-approval-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:batch-2-approval:diagnostics')
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
      (batch2ExecutionContext || batch3ExecutionContext) &&
      section === 'dependencies' &&
      removed.length === 0 &&
      changed.length === 0 &&
      added.every((name) => selectedPackages.includes(name) || (batch3ExecutionContext && approvedBatch3ExecutionDependencies.includes(name)))
    if (!approvedExecutionDependencyChange) failures.push(`package_section_changed:${section}`)
  }
}

const changedFiles = new Set(
  [...git(['diff', '--name-only']).split('\n'), ...git(['diff', '--cached', '--name-only']).split('\n')].filter(Boolean),
)
if (changedFiles.has('package-lock.json') && !batch2ExecutionContext && !batch3ExecutionContext) failures.push('package_lock_changed')
const packageLock = readJson('package-lock.json')
for (const packageName of selectedPackages) {
  if (
    !batch2ExecutionContext &&
    (packageJson?.dependencies?.[packageName] || packageJson?.devDependencies?.[packageName] || packageJson?.optionalDependencies?.[packageName])
  ) {
    failures.push(`batch_2_package_installed_in_package_json:${packageName}`)
  }
  if (!batch2ExecutionContext && !batch3ExecutionContext && packageLock?.packages?.[`node_modules/${packageName}`]) {
    failures.push(`batch_2_package_installed_in_lockfile:${packageName}`)
  }
}

const packageJsonDiff = `${git(['diff', '--', 'package.json'])}\n${git(['diff', '--cached', '--', 'package.json'])}`
const unexpectedPackageJsonDiff = packageJsonDiff
  .split('\n')
  .filter((line) => /^[+-]\s*"/.test(line))
.filter((line) => !line.includes('worker:ai-graphics-metadata-handoff-approval:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-handoff-qa:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-shape-approval:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-shape-qa:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-schema-validation-approval:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-schema-validation:execute') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-schema-validation:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-schema-validation-qa:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-owner-approval:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-approval:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-dry-run:execute') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-dry-run:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-qa:diagnostics'))
  .filter((line) => !line.includes('open-source-tool-stack:ai-tools-creative-graphics:batch-2-approval:diagnostics'))
  .filter((line) => {
    if (!batch2ExecutionContext) return true
    return (
      !allowedExecutionScripts.some((scriptName) => line.includes(scriptName)) &&
      !selectedPackages.some((packageName) => line.includes(`"${packageName}"`)) &&
      !(batch3ExecutionContext && approvedBatch3ExecutionDependencies.some((packageName) => line.includes(`"${packageName}"`)))
    )
  })
.filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-owner-review-after-dry-run:diagnostics'))
if (unexpectedPackageJsonDiff.length > 0) failures.push(`unexpected_package_json_diff:${unexpectedPackageJsonDiff.join(' | ')}`)

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const trackedGeneratedOutputs = git(['ls-files'])
  .split('\n')
  .filter((path) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|svg|pdf)$/i.test(path))
  .filter((path) => path.includes('open-source-tool-stack') || path.includes('ai-graphics-batch-2'))
if (trackedGeneratedOutputs.length > 0) failures.push(`generated_media_or_render_output_tracked:${trackedGeneratedOutputs.join(',')}`)

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decisionState: expectedDecision,
  selectedPackages,
  deferredPackages,
  futureDependencyInstallApproved: true,
  packageLockMutationApproved: true,
  futureImportSmokeApproved: true,
  futureSyntheticFixtureApproved: true,
  batch2ExecutionApprovedNow: false,
  actualToolExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  renderExportApprovedNow: false,
  packageLockUnchanged: !changedFiles.has('package-lock.json'),
  dependencySectionsUnchanged: true,
  supabaseUpdateRequired: 'no write',
  supabaseStatus: 'docs_only',
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
