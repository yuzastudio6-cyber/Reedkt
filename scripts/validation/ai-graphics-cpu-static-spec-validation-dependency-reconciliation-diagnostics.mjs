import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-cpu-static-spec-validation-execution'
const expectedDecision = 'ai_graphics_cpu_static_dependency_reconciliation_ready_for_refreshed_execution'
const approvedTools = ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js']
const approvedPackages = {
  d3: 'd3',
  vega_lite: 'vega-lite',
  vega: 'vega',
  satori: 'satori',
  svgdotjs_svg_js: '@svgdotjs/svg.js',
  viz_js: '@viz-js/viz',
}
const excludedTools = ['echarts', 'lottie_web', 'animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs']
const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-dependency-reconciliation.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-dependency-reconciliation-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-dependency-reconciliation-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-package-json-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-package-lock-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-merged-pr-dependency-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-rebase-or-reconcile-decision.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-dependency-blocked-use-register.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-dependency-next-lane.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-dependency-reconciliation-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-dependency-reconciliation-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-rebase-or-reconcile-decision.json',
  'docs/prompt-ai-graphics-cpu-static-spec-validation-dependency-reconciliation-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-cpu-static-spec-validation-dependency-reconciliation.md',
]
const statusDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-next-proof-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.json',
  'docs/production-beta-readiness-scorecard.md',
]
const requiredSources = ['PR #612', 'PR #607', 'PR #604', 'PR #589', 'PR #425', 'PR #433', 'PR #441']
const mergeShas = [
  'a055ef045db2a6ce127a044bee6219d5933532c3',
  'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0',
  'd174de59471eacf05bed5a5511d661f2e5ba9f0f',
]
const requiredTrueBooleans = [
  'dependencyReconciliationCompleted',
  'pr612BlockedStateAccepted',
  'packageJsonReviewed',
  'packageLockReviewed',
  'mergedPrDependencyStateReviewed',
  'all6CpuStaticPackagesReviewed',
  'canProceedFromFreshBase',
]
const requiredFalseBooleans = [
  'dependencyApprovalRequired',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'cpuStaticExecutionPerformed',
  'importSmokeExecutedNow',
  'syntheticFixtureExecutedNow',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'productionReadyNow',
]
const forbiddenPatterns = [
  ['dependency_install_true', /\bdependencyInstallPerformed\b\s*[:=|]\s*`?true`?/i],
  ['package_lock_mutation_true', /\bpackageLockMutationPerformed\b\s*[:=|]\s*`?true`?/i],
  ['cpu_static_execution_true', /\bcpuStaticExecutionPerformed\b\s*[:=|]\s*`?true`?/i],
  ['tool_execution_true', /\btoolExecutionPerformed\b\s*[:=|]\s*`?true`?/i],
  ['runtime_ready_true', /\bruntimeReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['internal_beta_true', /\binternalBetaReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['production_true', /\bproductionReadyNow\b\s*[:=|]\s*`?true`?/i],
]
const generatedPathPattern =
  /(^|\/)(\.local-artifacts|dist|build|coverage|screenshots?|renders?|render-output|browser-output|canvas-output|webgl-output|public-artifacts?)(\/|$)|\.(png|jpg|jpeg|gif|webp|mp4|mov|webm|svg)$/i
const failures = []

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function packageDeclares(packageJson, packageName) {
  return Boolean(
    packageJson.dependencies?.[packageName] ||
      packageJson.devDependencies?.[packageName] ||
      packageJson.optionalDependencies?.[packageName] ||
      packageJson.peerDependencies?.[packageName],
  )
}

function lockfileDeclares(packageLock, packageName) {
  return Boolean(packageLock.packages?.[`node_modules/${packageName}`] || packageLock.dependencies?.[packageName])
}

for (const path of [...requiredDocs, ...statusDocs]) {
  if (!existsSync(path)) failures.push(`missing_required_doc:${path}`)
}

const docsText = [...requiredDocs, ...statusDocs]
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

if (!docsText.includes(expectedDecision)) failures.push('missing_expected_decision')
for (const source of requiredSources) {
  if (!docsText.includes(source)) failures.push(`missing_source:${source}`)
}
for (const sha of mergeShas) {
  if (!docsText.includes(sha)) failures.push(`missing_merge_sha:${sha}`)
}
for (const text of ['origin/codex/rp-ai-tools-creative-graphics-batch-2-approval-packet', 'origin/codex/rp-ai-tools-creative-graphics-batch-3-approval-packet', 'blocked_pending_cpu_static_dependency_install_from_lock']) {
  if (!docsText.includes(text)) failures.push(`missing_required_text:${text}`)
}
for (const tool of [...approvedTools, ...excludedTools]) {
  if (!docsText.includes(tool)) failures.push(`missing_tool:${tool}`)
}

let matrix = {}
let sourceLockfile = {}
let decision = {}
let ledger = {}
try {
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-dependency-reconciliation-matrix.json')
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-dependency-reconciliation-source-lockfile.json')
  decision = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-rebase-or-reconcile-decision.json')
  ledger = readJson('docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

for (const [name, data] of Object.entries({ matrix, sourceLockfile, decision })) {
  if (data.decision !== expectedDecision) failures.push(`${name}_decision_unexpected:${data.decision}`)
}

const rows = matrix.tools ?? []
if (rows.length !== approvedTools.length) failures.push(`unexpected_matrix_count:${rows.length}`)
for (const toolId of approvedTools) {
  const row = rows.find((candidate) => candidate.toolId === toolId)
  if (!row) {
    failures.push(`missing_matrix_tool:${toolId}`)
    continue
  }
  if (row.packageName !== approvedPackages[toolId]) failures.push(`package_name_mismatch:${toolId}`)
  if (row.presentInCurrentPackageJson !== false) failures.push(`current_package_json_not_false:${toolId}`)
  if (row.presentInCurrentPackageLock !== false) failures.push(`current_package_lock_not_false:${toolId}`)
  if (row.presentInMergedPackageProofLineage !== true) failures.push(`merged_lineage_not_true:${toolId}`)
  if (row.requiresDependencyMutation !== false) failures.push(`requires_dependency_mutation_not_false:${toolId}`)
  if (row.canProceedFromFreshBase !== true) failures.push(`can_proceed_not_true:${toolId}`)
  if (row.nextAction !== 'rerun_cpu_static_execution_from_dependency_bearing_base') failures.push(`next_action_unexpected:${toolId}`)
}
if (JSON.stringify(matrix.excludedRuntimePackages ?? []) !== JSON.stringify(excludedTools)) failures.push('excluded_runtime_packages_mismatch')
for (const field of requiredTrueBooleans) {
  if (matrix.booleans?.[field] !== true || decision.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (matrix.booleans?.[field] !== false || decision.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
}
if (decision.recommendedNextPrompt !== 'AI_GRAPHICS_DRAFT_PACKAGE_PROOF_CPU_STATIC_SPEC_VALIDATION_REFRESHED_EXECUTION') failures.push('next_prompt_unexpected')
if (sourceLockfile.sources?.pr612?.head !== '5f870b9e493170cb9c02a03d33a719f1801560c8') failures.push('pr612_head_unexpected')
if (sourceLockfile.sources?.pr607?.head !== '12cfc4f29e55db7a5b105ecfc3aba21480396435') failures.push('pr607_head_unexpected')

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const batch2PackageJson = JSON.parse(git(['show', 'origin/codex/rp-ai-tools-creative-graphics-batch-2-approval-packet:package.json']))
const batch2PackageLock = JSON.parse(git(['show', 'origin/codex/rp-ai-tools-creative-graphics-batch-2-approval-packet:package-lock.json']))
for (const [toolId, packageName] of Object.entries(approvedPackages)) {
  if (packageDeclares(packageJson, packageName)) failures.push(`current_branch_unexpected_package:${toolId}`)
  if (lockfileDeclares(packageLock, packageName)) failures.push(`current_branch_unexpected_lock:${toolId}`)
  if (!packageDeclares(batch2PackageJson, packageName)) failures.push(`batch2_missing_package:${toolId}`)
  if (!lockfileDeclares(batch2PackageLock, packageName)) failures.push(`batch2_missing_lock:${toolId}`)
}

const ledgerEntry = ledger.latestCpuStaticSpecValidationDependencyReconciliation ?? {}
if (ledgerEntry.decision !== expectedDecision) failures.push('ledger_decision_unexpected')
if (ledgerEntry.canProceedFromFreshBase !== true) failures.push('ledger_can_proceed_not_true')
if (ledgerEntry.dependencyApprovalRequired !== false) failures.push('ledger_dependency_approval_not_false')

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

try {
  const packageBefore = JSON.parse(git(['show', `${baseRef}:package.json`]))
  const packageAfter = packageJson
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(packageBefore[section] ?? {}) !== JSON.stringify(packageAfter[section] ?? {})) {
      failures.push(`package_dependency_section_changed:${section}`)
    }
  }
  if (packageAfter.scripts?.['ai-graphics:cpu-static-spec-validation-dependency-reconciliation:diagnostics'] !== 'node scripts/validation/ai-graphics-cpu-static-spec-validation-dependency-reconciliation-diagnostics.mjs') failures.push('missing_reconciliation_script')
  const scriptsBefore = { ...(packageBefore.scripts ?? {}) }
  const scriptsAfter = { ...(packageAfter.scripts ?? {}) }
  delete scriptsAfter['ai-graphics:cpu-static-spec-validation-dependency-reconciliation:diagnostics']
  if (JSON.stringify(scriptsBefore) !== JSON.stringify(scriptsAfter)) failures.push('unexpected_package_script_drift')
} catch (error) {
  failures.push(`package_json_compare_failed:${error.message}`)
}

try {
  if (git(['show', `${baseRef}:package-lock.json`]) !== readFileSync('package-lock.json', 'utf8').trim()) failures.push('package_lock_changed')
} catch (error) {
  failures.push(`package_lock_compare_failed:${error.message}`)
}

const changedFiles = new Set([
  ...git(['diff', '--name-only', baseRef, '--']).split('\n').filter(Boolean),
  ...git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
])
for (const file of changedFiles) {
  if (file.includes('.local-artifacts')) failures.push(`local_artifact_tracked:${file}`)
  if (generatedPathPattern.test(file)) failures.push(`generated_output_tracked:${file}`)
}

if (failures.length > 0) {
  console.error('AI graphics CPU static dependency reconciliation diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics CPU static dependency reconciliation diagnostics passed.')
