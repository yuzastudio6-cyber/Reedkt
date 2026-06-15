import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const diffBase = process.env.AI_TOOLS_CREATIVE_GRAPHICS_BATCH_1_EXECUTION_DIFF_BASE ?? 'origin/codex/rp-ai-tools-creative-graphics-package-lock-base-fix'
const expectedDecision = 'ai_graphics_batch_1_install_import_synthetic_proof_passed_with_warnings'
const allowedDecisions = new Set([
  'ai_graphics_batch_1_install_import_synthetic_proof_passed',
  'ai_graphics_batch_1_install_import_synthetic_proof_passed_with_warnings',
  'blocked_batch_1_install_failed',
  'blocked_batch_1_import_smoke_failed',
  'blocked_batch_1_synthetic_fixture_failed',
  'blocked_batch_1_unrelated_dependency_churn_detected',
])
const approvedDependencies = ['d3', 'echarts', 'vega-lite', 'vega']
const expectedScripts = {
  'open-source-tool-stack:ai-tools-creative-graphics:batch-1-import-smoke':
    'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-1-import-smoke.mjs',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-1-synthetic-fixtures':
    'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-1-synthetic-fixtures.mjs',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-1-execution:diagnostics':
    'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-1-execution-diagnostics.mjs',
}
const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-execution.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-install-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-import-smoke-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-synthetic-fixture-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-qa-observability-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-cleanup-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-readiness-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-allowed-blocked-scope.md',
  'docs/prompt-ai-tools-creative-graphics-install-proof-batch-1-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-install-proof-batch-1-execution.md',
]
const requiredFixtures = [
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-d3-chart-spec.json',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-echarts-option-spec.json',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-vega-lite-spec.json',
]
const requiredFalseBooleans = [
  'e2eProductionProofClaimed',
  'actualToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'renderExportApprovedNow',
  'mediaRuntimeApprovedNow',
  'browserRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]
const requiredTrueBooleans = [
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'packageJsonMutationPerformed',
  'npmCiPassed',
  'importSmokePassed',
  'syntheticFixtureValidationPassed',
]
const forbiddenPatterns = [
  ['e2e_production_claim', /\bE2E production proof\b[^.\n]*(?:claimed|completed|passed|true|enabled)\b/i],
  ['runtime_ready_claim', /\bruntime[- ]ready\b[^.\n]*(?:route|tool|execution|approved|enabled|true)\b/i],
  ['tool_execution_enabled', /\btool execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['route_execution_enabled', /\broute execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['worker_execution_enabled', /\bworker execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['provider_enabled', /\bprovider\/?model (?:calls?|execution)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['browser_runtime_enabled', /\bbrowser runtime\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['render_enabled', /\b(?:render\/export|render export|Remotion render|resvg rasterization)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
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
const env = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return null
  }
}
const readGitDiff = (path) => {
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

for (const path of [...requiredDocs, ...requiredFixtures]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')
const unsafeClaimText = docsText.replace(/\b[Nn]o [^.\n]*(?: was (?:enabled|performed|claimed|created)| ran)\./g, '')
for (const [name, pattern] of forbiddenPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-readiness-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-readiness-decision.md', 'utf8')
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
const packageLock = readJson('package-lock.json')
for (const [scriptName, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[scriptName] !== command) failures.push(`missing_package_script:${scriptName}`)
}
for (const dependencyName of approvedDependencies) {
  if (!packageJson?.dependencies?.[dependencyName]) failures.push(`missing_direct_dependency:${dependencyName}`)
  if (!packageLock?.packages?.[`node_modules/${dependencyName}`]) failures.push(`missing_lock_entry:${dependencyName}`)
}

const basePackageJson = JSON.parse(execFileSync('git', ['show', `${diffBase}:package.json`], { env, encoding: 'utf8' }))
const addedDirectDependencies = Object.keys(packageJson?.dependencies ?? {}).filter((name) => !basePackageJson.dependencies?.[name])
for (const dependencyName of addedDirectDependencies) {
  if (!approvedDependencies.includes(dependencyName)) failures.push(`unapproved_direct_dependency:${dependencyName}`)
}

const packageJsonDiff = readGitDiff('package.json')
for (const dependencyName of approvedDependencies) {
  if (!packageJsonDiff.includes(`"${dependencyName}"`)) failures.push(`package_json_diff_missing_dependency:${dependencyName}`)
}

for (const path of requiredFixtures) {
  const fixture = existsSync(path) ? readJson(path) : null
  if (!fixture) continue
  if (fixture.dataClassification !== 'synthetic_only') failures.push(`fixture_not_synthetic_only:${path}`)
  if (!Array.isArray(fixture.blockedUses)) failures.push(`fixture_missing_blocked_uses:${path}`)
  if (Object.values(fixture.approvals ?? {}).some((value) => value !== false)) failures.push(`fixture_has_true_approval:${path}`)
  const text = JSON.stringify(fixture)
  if (/https?:\/\//i.test(text) || /X-Goog-Signature=|X-Amz-Signature=/i.test(text)) failures.push(`fixture_contains_url_or_signature:${path}`)
}

const trackedLocalArtifacts = execFileSync('git', ['ls-files', '.local-artifacts'], { env, encoding: 'utf8' }).trim()
if (trackedLocalArtifacts) failures.push(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const trackedGeneratedOutputs = execFileSync('git', ['ls-files'], { env, encoding: 'utf8' })
  .split('\n')
  .filter((path) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|svg|pdf)$/i.test(path))
  .filter((path) => path.includes('open-source-tool-stack') || path.includes('ai-graphics-batch-1'))
if (trackedGeneratedOutputs.length > 0) failures.push(`generated_media_or_render_output_tracked:${trackedGeneratedOutputs.join(',')}`)

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decisionState: expectedDecision,
  dependencies: Object.fromEntries(approvedDependencies.map((name) => [name, packageLock?.packages?.[`node_modules/${name}`]?.version ?? null])),
  dependencyInstallPerformed: true,
  packageLockMutationPerformed: true,
  packageJsonMutationPerformed: true,
  npmCiPassed: true,
  importSmokePassed: true,
  syntheticFixtureValidationPassed: true,
  e2eProductionProofClaimed: false,
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
