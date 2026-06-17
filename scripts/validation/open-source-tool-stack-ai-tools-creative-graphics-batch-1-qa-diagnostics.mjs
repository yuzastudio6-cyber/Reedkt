import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const expectedDecision = 'ai_graphics_batch_1_qa_passed_with_warnings'
const allowedDecisions = new Set([
  'ai_graphics_batch_1_qa_passed',
  'ai_graphics_batch_1_qa_passed_with_warnings',
  'blocked_pending_ai_graphics_batch_1_qa_fixes',
  'blocked_pending_package_diff_review',
  'blocked_pending_validation_rerun',
])
const tools = ['d3', 'echarts', 'vega-lite', 'vega']
const approvedBatch2Dependencies = ['satori', '@svgdotjs/svg.js', '@viz-js/viz', 'lottie-web']
const approvedBatch3Dependencies = ['animejs', 'three', 'pixi.js', 'konva', 'babylonjs']
const batch2ExecutionDecision = 'ai_graphics_batch_2_install_import_synthetic_proof_passed_with_warnings'
const batch3ExecutionDecision = 'ai_graphics_batch_3_install_import_manifest_proof_passed_with_warnings'
const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-qa-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-acceptance-matrix.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-warning-blocker-register.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-package-diff-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-proof-status-update.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-recommendation.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-qa-decision.md',
  'docs/prompt-ai-tools-creative-graphics-batch-1-qa-review-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-batch-1-qa-review.md',
]
const requiredEvidenceDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-readiness-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-install-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-import-smoke-evidence.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-synthetic-fixture-evidence.md',
]
const allowedFutureScriptDiffs = [
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
const requiredTrueBooleans = [
  'batch1Accepted',
  'batch1AcceptedWithWarnings',
  'readyForBatch2Approval',
  'dependencyInstallAlreadyPerformedInBatch1',
  'importSmokeAlreadyPassedInBatch1',
  'syntheticFixtureAlreadyPassedInBatch1',
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
const forbiddenPatterns = [
  ['e2e_production_claim', /\bE2E production proof\b[^.\n]*(?:claimed|completed|passed|true|enabled)\b/i],
  ['runtime_ready_claim', /\bruntime[- ]ready\b[^.\n]*(?:route|tool|execution|approved|enabled|true)\b/i],
  ['tool_execution_enabled', /\btool execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['route_execution_enabled', /\broute execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['worker_execution_enabled', /\bworker execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['provider_enabled', /\bprovider\/?model (?:calls?|execution|runtime)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['browser_runtime_enabled', /\b(?:browser|WebGL|canvas|DOM) runtime\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['chart_init_enabled', /\b(?:ECharts chart initialization|chart initialization)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
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
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return null
  }
}
const git = (args) => execFileSync('git', args, { env, encoding: 'utf8' }).trim()

for (const path of [...requiredDocs, ...requiredEvidenceDocs]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')
const unsafeClaimText = docsText
  .replace(/\b[Nn]o [^.\n]*(?: was (?:enabled|performed|claimed|created)| ran)\./g, '')
  .split('\n')
  .filter((line) => !/\b(?:blocked|not claimed|not approved|does not approve|remain blocked|remains blocked|still blocked)\b/i.test(line))
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

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-qa-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-qa-decision.md', 'utf8')
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

for (const tool of tools) {
  if (!docsText.includes(`\`${tool}\``)) failures.push(`tool_missing_from_docs:${tool}`)
}
const acceptanceMatrix = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-acceptance-matrix.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-acceptance-matrix.md', 'utf8')
  : ''
for (const tool of tools) {
  const toolRow = acceptanceMatrix.split('\n').find((line) => line.includes(`\`${tool}\``))
  if (!toolRow) failures.push(`acceptance_row_missing:${tool}`)
  else if (!toolRow.includes('`accepted_with_warnings`')) failures.push(`acceptance_not_with_warnings:${tool}`)
}
for (const token of ['Satori', 'SVG.js', 'Viz.js', 'Graphviz', 'lottie', 'Remotion', 'resvg', 'Three.js', 'PixiJS', 'Konva']) {
  if (!docsText.includes(token)) failures.push(`batch_2_recommendation_token_missing:${token}`)
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:batch-1-qa:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-1-qa-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:batch-1-qa:diagnostics')
}
for (const tool of tools) {
  if (!packageJson?.dependencies?.[tool]) failures.push(`missing_package_dependency:${tool}`)
}
const packageLock = readJson('package-lock.json')
for (const tool of tools) {
  if (!packageLock?.packages?.[`node_modules/${tool}`]) failures.push(`missing_lock_dependency:${tool}`)
}

const changedFiles = new Set(
  [...git(['diff', '--name-only']).split('\n'), ...git(['diff', '--cached', '--name-only']).split('\n')].filter(Boolean),
)
if (changedFiles.has('package-lock.json') && !batch2ExecutionContext && !batch3ExecutionContext) failures.push('package_lock_mutated_in_qa_branch')
const packageJsonDiff = git(['diff', '--', 'package.json']) || git(['diff', '--cached', '--', 'package.json'])
const unexpectedPackageJsonDiff = packageJsonDiff
  .split('\n')
  .filter((line) => /^[+-]\s*"/.test(line))
  .filter((line) => !line.includes('open-source-tool-stack:ai-tools-creative-graphics:batch-1-qa:diagnostics'))
  .filter((line) => !allowedFutureScriptDiffs.some((scriptName) => line.includes(scriptName)))
  .filter((line) => {
    if (!batch2ExecutionContext) return true
    return (
      !approvedBatch2Dependencies.some((dependencyName) => line.includes(`"${dependencyName}"`)) &&
      !(batch3ExecutionContext && approvedBatch3Dependencies.some((dependencyName) => line.includes(`"${dependencyName}"`)))
    )
  })
if (unexpectedPackageJsonDiff.length > 0) failures.push(`unexpected_package_json_diff:${unexpectedPackageJsonDiff.join(' | ')}`)

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const trackedGeneratedOutputs = git(['ls-files'])
  .split('\n')
  .filter((path) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|svg|pdf)$/i.test(path))
  .filter((path) => path.includes('open-source-tool-stack') || path.includes('ai-graphics-batch-1'))
if (trackedGeneratedOutputs.length > 0) failures.push(`generated_media_or_render_output_tracked:${trackedGeneratedOutputs.join(',')}`)

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decisionState: expectedDecision,
  batch1Accepted: true,
  batch1AcceptedWithWarnings: true,
  readyForBatch2Approval: true,
  toolsReviewed: tools,
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
