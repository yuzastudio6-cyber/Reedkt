import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const diffBase =
  process.env.AI_TOOLS_CREATIVE_GRAPHICS_BATCH_2_EXECUTION_DIFF_BASE ??
  'origin/codex/rp-ai-tools-creative-graphics-batch-2-approval-packet'
const expectedDecision = 'ai_graphics_batch_2_install_import_synthetic_proof_passed_with_warnings'
const allowedDecisions = new Set([
  'ai_graphics_batch_2_install_import_synthetic_proof_passed',
  'ai_graphics_batch_2_install_import_synthetic_proof_passed_with_warnings',
  'blocked_batch_2_install_failed',
  'blocked_batch_2_import_smoke_failed',
  'blocked_batch_2_synthetic_fixture_failed',
  'blocked_batch_2_runtime_boundary_review',
  'blocked_batch_2_unrelated_dependency_churn_detected',
  'approved_with_warnings_for_ai_graphics_batch_3',
])
const approvedDependencies = ['satori', '@svgdotjs/svg.js', '@viz-js/viz', 'lottie-web']
const blockedDependencies = ['animejs', '@resvg/resvg-js', 'remotion', '@remotion/renderer', 'three', 'pixi.js', 'konva', 'babylonjs']
const allowedAddedLockEntries = new Set([
  'node_modules/@shuding/opentype.js',
  'node_modules/@svgdotjs/svg.js',
  'node_modules/@viz-js/viz',
  'node_modules/camelize',
  'node_modules/css-background-parser',
  'node_modules/css-box-shadow',
  'node_modules/css-color-keywords',
  'node_modules/css-gradient-parser',
  'node_modules/css-to-react-native',
  'node_modules/emoji-regex-xs',
  'node_modules/fflate',
  'node_modules/hex-rgb',
  'node_modules/linebreak',
  'node_modules/linebreak/node_modules/base64-js',
  'node_modules/lottie-web',
  'node_modules/parse-css-color',
  'node_modules/postcss-value-parser',
  'node_modules/satori',
  'node_modules/string.prototype.codepointat',
  'node_modules/tiny-inflate',
  'node_modules/unicode-trie',
  'node_modules/unicode-trie/node_modules/pako',
  'node_modules/yoga-layout',
])
const expectedScripts = {
  'open-source-tool-stack:ai-tools-creative-graphics:batch-2-import-smoke':
    'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-2-import-smoke.mjs',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-2-synthetic-fixtures':
    'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-2-synthetic-fixtures.mjs',
  'open-source-tool-stack:ai-tools-creative-graphics:batch-2-execution:diagnostics':
    'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-2-execution-diagnostics.mjs',
}
const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-execution.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-install-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-import-smoke-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-synthetic-fixture-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-qa-observability-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-cleanup-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-readiness-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-allowed-blocked-scope.md',
  'docs/prompt-ai-tools-creative-graphics-batch-2-execution-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-batch-2-install-proof-execution.md',
]
const requiredFixtures = [
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-2-satori-card-spec.json',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-2-svgjs-vector-spec.json',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-2-viz-graphviz-dot-spec.json',
  'docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-2-lottie-manifest-spec.json',
]
const requiredTrueBooleans = [
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'packageJsonMutationPerformed',
  'npmCiPassed',
  'importSmokePassed',
  'syntheticFixtureValidationPassed',
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
  'webglRuntimeApprovedNow',
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
  ['e2e_production_claim', /\bE2E production proof\b[^.\n]*(?:claimed|completed|passed|true|enabled)\b/i],
  ['runtime_ready_claim', /\bruntime[- ]ready\b[^.\n]*(?:route|tool|execution|approved|enabled|true)\b/i],
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
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return null
  }
}

for (const path of [...requiredDocs, ...requiredFixtures]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')
const unsafeClaimText = docsText
  .replace(/\b[Nn]o [^.\n]*(?: was (?:enabled|performed|claimed|created)| ran)\./g, '')
  .split('\n')
  .filter((line) => !/\b(?:blocked|not claimed|not approved|does not approve|remain blocked|remains blocked|still blocked|false|no E2E|no live|no public|no route|no worker|no provider|no Supabase)\b/i.test(line))
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

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-readiness-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-readiness-decision.md', 'utf8')
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

for (const token of [
  'satori: `import_api_shape_passed`',
  '@svgdotjs/svg.js: `import_api_shape_passed`',
  '@viz-js/viz: `node_only_dot_to_svg_in_memory_passed`',
  'lottie-web: `manifest_validation_only_import_metadata_present`',
]) {
  if (!docsText.includes(token)) failures.push(`tool_status_missing:${token}`)
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
for (const dependencyName of blockedDependencies) {
  if (packageJson?.dependencies?.[dependencyName] || packageJson?.devDependencies?.[dependencyName] || packageJson?.optionalDependencies?.[dependencyName]) {
    failures.push(`blocked_dependency_added:${dependencyName}`)
  }
  if (packageLock?.packages?.[`node_modules/${dependencyName}`]) failures.push(`blocked_lock_entry_added:${dependencyName}`)
}

const basePackageJson = JSON.parse(git(['show', `${diffBase}:package.json`]))
const currentDeps = packageJson?.dependencies ?? {}
const baseDeps = basePackageJson?.dependencies ?? {}
const addedDirectDependencies = Object.keys(currentDeps).filter((name) => !baseDeps[name])
for (const dependencyName of addedDirectDependencies) {
  if (!approvedDependencies.includes(dependencyName)) failures.push(`unapproved_direct_dependency:${dependencyName}`)
}
for (const section of ['devDependencies', 'optionalDependencies', 'peerDependencies']) {
  const currentSection = packageJson?.[section] ?? {}
  const baseSection = basePackageJson?.[section] ?? {}
  if (JSON.stringify(currentSection) !== JSON.stringify(baseSection)) failures.push(`unexpected_package_section_change:${section}`)
}

const basePackageLock = JSON.parse(git(['show', `${diffBase}:package-lock.json`]))
const currentPackages = packageLock?.packages ?? {}
const basePackages = basePackageLock?.packages ?? {}
const addedLockEntries = Object.keys(currentPackages).filter((path) => path && !basePackages[path])
const changedLockEntries = Object.keys(currentPackages).filter(
  (path) => basePackages[path] && JSON.stringify(currentPackages[path]) !== JSON.stringify(basePackages[path]),
)
for (const path of addedLockEntries) {
  if (!allowedAddedLockEntries.has(path)) failures.push(`unexpected_lock_entry_added:${path}`)
}
for (const path of changedLockEntries) {
  if (path !== '') failures.push(`unexpected_lock_entry_changed:${path}`)
}
for (const path of allowedAddedLockEntries) {
  if (!currentPackages[path]) failures.push(`allowed_lock_entry_missing:${path}`)
}

for (const path of requiredFixtures) {
  const fixture = existsSync(path) ? readJson(path) : null
  if (!fixture) continue
  if (fixture.dataClassification !== 'synthetic_only') failures.push(`fixture_not_synthetic_only:${path}`)
  if (Object.values(fixture.approvals ?? {}).some((value) => value !== false)) failures.push(`fixture_has_true_approval:${path}`)
  const fixtureText = JSON.stringify(fixture)
  if (/https?:\/\//i.test(fixtureText) || /X-Goog-Signature=|X-Amz-Signature=/i.test(fixtureText)) {
    failures.push(`fixture_contains_url_or_signature:${path}`)
  }
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const trackedGeneratedOutputs = git(['ls-files'])
  .split('\n')
  .filter((path) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|pdf)$/i.test(path))
  .filter((path) => path.includes('open-source-tool-stack') || path.includes('ai-graphics-batch-2'))
if (trackedGeneratedOutputs.length > 0) failures.push(`generated_media_or_render_output_tracked:${trackedGeneratedOutputs.join(',')}`)

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decisionState: expectedDecision,
  dependencies: Object.fromEntries(approvedDependencies.map((name) => [name, packageLock?.packages?.[`node_modules/${name}`]?.version ?? null])),
  addedLockEntryCount: addedLockEntries.length,
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
  browserRuntimeApprovedNow: false,
  webglRuntimeApprovedNow: false,
  supabaseUpdateRequired: 'no write',
  supabaseStatus: 'docs_only',
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
