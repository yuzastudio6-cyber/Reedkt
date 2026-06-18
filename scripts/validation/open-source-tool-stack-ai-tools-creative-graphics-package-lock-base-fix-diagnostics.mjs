import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const allowedDecisionStates = new Set([
  'package_lock_base_fix_passed_ready_for_ai_graphics_batch_1_execution_approval',
  'blocked_package_lock_fix_requires_owner_review',
  'blocked_package_lock_fix_failed',
  'blocked_package_lock_fix_unrelated_dependency_churn_detected',
])

const expectedDecisionState = 'package_lock_base_fix_passed_ready_for_ai_graphics_batch_1_execution_approval'

const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-package-lock-base-fix.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-package-lock-base-fix-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-package-lock-base-fix-decision.md',
  'docs/prompt-ai-tools-creative-graphics-package-lock-base-fix-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-package-lock-base-fix.md',
]

const requiredFalseBooleans = [
  'futureBatch1ExecutionApproved',
  'dependencyInstallProofApprovedNow',
  'importSmokeApprovedNow',
  'syntheticFixtureApprovedNow',
  'actualToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'renderExportApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const requiredLockEntries = [
  ['node_modules/@emnapi/core', '1.11.1'],
  ['node_modules/@emnapi/runtime', '1.11.1'],
  ['node_modules/@emnapi/wasi-threads', '1.2.2'],
  ['node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/core', '1.10.0'],
  ['node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/runtime', '1.10.0'],
  ['node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/wasi-threads', '1.2.1'],
]

const forbiddenDependencyNames = ['d3', 'echarts', 'vega', 'vega-lite']
const approvedBatch1ExecutionDependencyNames = ['d3', 'echarts', 'vega', 'vega-lite']
const approvedBatch2ExecutionDependencyNames = ['satori', '@svgdotjs/svg.js', '@viz-js/viz', 'lottie-web']
const approvedBatch3ExecutionDependencyNames = ['animejs', 'three', 'pixi.js', 'konva', 'babylonjs']
const batch2ExecutionDecision = 'ai_graphics_batch_2_install_import_synthetic_proof_passed_with_warnings'
const batch3ExecutionDecision = 'ai_graphics_batch_3_install_import_manifest_proof_passed_with_warnings'
const allowedFutureScriptDiffs = [
  'worker:ai-graphics-metadata-job-payload-shape-approval:diagnostics',
  'worker:ai-graphics-metadata-job-payload-shape-qa:diagnostics',
  'worker:ai-graphics-metadata-job-payload-schema-validation-approval:diagnostics',
  'worker:ai-graphics-metadata-job-payload-schema-validation:execute',
  'worker:ai-graphics-metadata-job-payload-schema-validation:diagnostics',
  'worker:ai-graphics-metadata-handoff-qa:diagnostics',
  'worker:ai-graphics-metadata-handoff-approval:diagnostics',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-2-approval:diagnostics',
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
const diffBase = process.env.AI_TOOLS_CREATIVE_GRAPHICS_PACKAGE_LOCK_BASE_FIX_DIFF_BASE ?? 'origin/codex/rp-ai-tools-creative-graphics-install-proof-approval-batch-1'

const forbiddenPatterns = [
  ['batch_1_execution_claim', /\bBatch 1 (?:execution|proof|fixture|import smoke)\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
  ['dependency_install_claim', /\b(?:dependency install|dependencies installed|npm install d3|npm install echarts|npm install vega|npm install vega-lite)\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|enabled|true)\b/i],
  ['import_smoke_claim', /\bimport smoke\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
  ['synthetic_fixture_claim', /\bsynthetic fixture\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
  ['e2e_proof_claim', /\bE2E proof\b[^.\n]*(?:completed|happened|ran|succeeded|was performed|approved now|enabled|true)\b/i],
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
const batch1ExecutionDecisionPath = 'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-readiness-decision.md'
const batch1ExecutionContext =
  existsSync(batch1ExecutionDecisionPath) &&
  readFileSync(batch1ExecutionDecisionPath, 'utf8').includes(
    'ai_graphics_batch_1_install_import_synthetic_proof_passed_with_warnings',
  )
const batch2ExecutionContext =
  existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-readiness-decision.md') &&
  readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-readiness-decision.md', 'utf8').includes(
    batch2ExecutionDecision,
  )
const batch3ExecutionContext =
  existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-readiness-decision.md') &&
  readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-readiness-decision.md', 'utf8').includes(
    batch3ExecutionDecision,
  )

const readGitDiff = (path) => {
  const env = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
  const workingDiff = execFileSync('git', ['diff', '--', path], { env, encoding: 'utf8' })
  if (workingDiff.trim()) return workingDiff
  const stagedDiff = execFileSync('git', ['diff', '--cached', '--', path], { env, encoding: 'utf8' })
  if (stagedDiff.trim()) return stagedDiff
  try {
    return execFileSync('git', ['diff', `${diffBase}...HEAD`, '--', path], { env, encoding: 'utf8' })
  } catch {
    return workingDiff
  }
}

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`json_invalid:${path}:${error.message}`)
    return null
  }
}

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')
const unsafeClaimText = docsText.replace(/\b[Nn]o [^.\n]*(?: was (?:enabled|performed)| ran)\./g, '')

for (const [name, pattern] of forbiddenPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (decisions.length === 0) failures.push('missing_decision')
for (const decision of decisions) {
  if (!allowedDecisionStates.has(decision)) failures.push(`invalid_decision:${decision}`)
}
if (!decisions.includes(expectedDecisionState)) failures.push(`expected_decision_missing:${expectedDecisionState}`)

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-package-lock-base-fix-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-package-lock-base-fix-decision.md', 'utf8')
  : ''

for (const [field, expected] of [
  ['packageLockMutationPerformed', 'true'],
  ['packageJsonMutationPerformed', 'true'],
  ['npmCiPassed', 'true'],
]) {
  const pattern = new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`${expected}\`\\s*\\|`)
  if (!pattern.test(decisionDoc)) failures.push(`required_boolean_not_${expected}:${field}`)
}

for (const field of requiredFalseBooleans) {
  const pattern = new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`false\`\\s*\\|`)
  if (!pattern.test(decisionDoc)) failures.push(`approval_boolean_not_false:${field}`)
}

for (const token of ['no write', 'docs_only', 'environment touched: `none`', 'SQL executed: `none`', 'migration deployed: `no`', 'milestone sync: `not_performed`']) {
  if (!decisionDoc.includes(token)) failures.push(`supabase_field_missing:${token}`)
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:package-lock-base-fix:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-package-lock-base-fix-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:package-lock-base-fix:diagnostics')
}

for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const dependencyName of forbiddenDependencyNames) {
    if (!batch1ExecutionContext && packageJson?.[section]?.[dependencyName]) {
      failures.push(`batch_1_dependency_added:${section}:${dependencyName}`)
    }
  }
}

const packageLock = readJson('package-lock.json')
const lockPackages = packageLock?.packages ?? {}
for (const [path, version] of requiredLockEntries) {
  if (lockPackages[path]?.version !== version) failures.push(`lock_entry_missing_or_wrong:${path}:${lockPackages[path]?.version}`)
}
for (const dependencyName of forbiddenDependencyNames) {
  if (!batch1ExecutionContext && lockPackages[`node_modules/${dependencyName}`]) {
    failures.push(`batch_1_lock_entry_added:${dependencyName}`)
  }
}

try {
  const packageJsonDiff = readGitDiff('package.json')
  const nonScriptPackageJsonDiff = packageJsonDiff
    .split('\n')
    .filter((line) => /^[+-]\s*"/.test(line))
    .filter((line) => !line.includes('open-source-tool-stack:ai-tools-creative-graphics:package-lock-base-fix:diagnostics'))
    .filter((line) => {
      if (!batch1ExecutionContext) return true
      return (
        !approvedBatch1ExecutionDependencyNames.some((dependencyName) => line.includes(`"${dependencyName}"`)) &&
        !line.includes('open-source-tool-stack:ai-tools-creative-graphics:batch-1-import-smoke') &&
        !line.includes('open-source-tool-stack:ai-tools-creative-graphics:batch-1-synthetic-fixtures') &&
        !line.includes('open-source-tool-stack:ai-tools-creative-graphics:batch-1-execution:diagnostics') &&
        !line.includes('open-source-tool-stack:ai-tools-creative-graphics:batch-1-qa:diagnostics') &&
        !allowedFutureScriptDiffs.some((scriptName) => line.includes(scriptName)) &&
        !(batch2ExecutionContext && approvedBatch2ExecutionDependencyNames.some((dependencyName) => line.includes(`"${dependencyName}"`))) &&
        !(batch3ExecutionContext && approvedBatch3ExecutionDependencyNames.some((dependencyName) => line.includes(`"${dependencyName}"`)))
      )
    })
  if (nonScriptPackageJsonDiff.length > 0) failures.push(`unexpected_package_json_diff:${nonScriptPackageJsonDiff.join(' | ')}`)
} catch (error) {
  failures.push(`package_json_diff_failed:${error.message}`)
}

try {
  const lockDiff = readGitDiff('package-lock.json')
  if (!batch1ExecutionContext) {
    const unrelatedAddRemove = lockDiff
      .split('\n')
      .filter((line) => /^[+-]\s{4}"/.test(line))
      .filter((line) => !line.includes('@emnapi/'))
      .filter((line) => !line.includes('"version"') && !line.includes('"resolved"') && !line.includes('"integrity"') && !line.includes('"dev"') && !line.includes('"license"') && !line.includes('"optional"') && !line.includes('"peer"') && !line.includes('"dependencies"') && !line.includes('"tslib"'))
    if (unrelatedAddRemove.length > 0) failures.push(`unexpected_lock_diff:${unrelatedAddRemove.slice(0, 8).join(' | ')}`)
  }
  if (!batch1ExecutionContext) {
    if (!lockDiff.includes('node_modules/@emnapi/core')) failures.push('lock_diff_missing_emnapi_core')
    if (!lockDiff.includes('node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/core')) failures.push('lock_diff_missing_nested_emnapi_core')
  }
} catch (error) {
  failures.push(`package_lock_diff_failed:${error.message}`)
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decisionState: expectedDecisionState,
  packageLockMutationPerformed: true,
  packageJsonMutationPerformed: true,
  packageJsonDependencyMetadataMutationPerformed: false,
  npmCiPassed: true,
  futureBatch1ExecutionApproved: false,
  dependencyInstallProofApprovedNow: false,
  importSmokeApprovedNow: false,
  syntheticFixtureApprovedNow: false,
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
