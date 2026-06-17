import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-tool-route-ai-graphics-metadata-local-fixture-validation-approval'
const expectedDecision = 'tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings'
const allowedDecisions = new Set([
  'tool_route_ai_graphics_metadata_local_fixture_validation_passed',
  expectedDecision,
  'blocked_pending_ai_graphics_fixture_validation_failures',
  'blocked_pending_ai_graphics_template_safety_fixes',
  'blocked_pending_scoped_manifest_validation_fixes',
  'blocked_pending_artifact_scope_validation_fixes',
])

const requiredDocs = [
  'docs/tool-route-execution/ai-graphics-metadata-local-fixture-validation-execution.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-execution-source-lockfile.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-run-results.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-valid-case-validation-evidence.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-invalid-case-validation-evidence.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-blocked-case-validation-evidence.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-scoped-manifest-validation-evidence.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-private-artifact-validation-evidence.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-fail-closed-validation-evidence.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-no-execution-proof-evidence.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-worker-handoff-validation-evidence.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-cleanup-evidence.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-readiness-decision.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-next-lane-recommendation.md',
  'docs/prompt-tool-route-ai-graphics-metadata-local-fixture-validation-execution-results.md',
  'docs/implementation-prompts/prompt-tool-route-ai-graphics-metadata-local-fixture-validation-execution.md',
]

const requiredScripts = [
  'scripts/validation/tool-route-ai-graphics-metadata-local-fixture-validation-execution.mjs',
  'scripts/validation/tool-route-ai-graphics-metadata-local-fixture-validation-execution-diagnostics.mjs',
]

const requiredTools = [
  'd3',
  'echarts',
  'vega-lite',
  'vega',
  'satori',
  '@svgdotjs/svg.js',
  '@viz-js/viz',
  'lottie-web',
  'animejs',
  'three',
  'pixi.js',
  'konva',
  'babylonjs',
]

const requiredTrueBooleans = [
  'localFixtureValidationExecuted',
  'localFixtureValidationPassed',
  'validCaseValidationPassed',
  'invalidCaseValidationPassed',
  'blockedCaseValidationPassed',
  'scopedManifestValidationPassed',
  'privateArtifactValidationPassed',
  'failClosedValidationPassed',
  'noExecutionProofPassed',
  'workerHandoffValidationPassed',
]

const requiredFalseBooleans = [
  'localFixtureExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'actualToolExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserRuntimeApprovedNow',
  'webglRuntimeApprovedNow',
  'canvasRuntimeApprovedNow',
  'resvgRasterizationApprovedNow',
  'remotionRenderExportApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const requiredTokens = [
  'PR #462',
  '333083ebe48e31b5ede94cf72e6810d2297e7d4b',
  'approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation',
  'PR #458',
  '7dc6afdd4188f9d629910db88c1b3ed148876ed7',
  'PR #457',
  'PR #456',
  'PR #454',
  'PR #409',
  'PR #404',
  'PR #398',
  'PR #164',
  'ai-graphics-local-fixture-validation-local-static',
  'TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_QA_REVIEW',
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]

const forbiddenPatterns = [
  ['local_fixture_execution_claim', /\blocal fixture execution\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['route_execution_claim', /\broute execution\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['tool_execution_claim', /\b(?:actual tool execution|tool execution)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['worker_execution_claim', /\bworker execution\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['provider_runtime_claim', /\bprovider\/?model (?:calls?|runtime|execution)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['browser_runtime_claim', /\bbrowser runtime\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['webgl_runtime_claim', /\bWebGL runtime\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['canvas_runtime_claim', /\bcanvas runtime\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['resvg_rasterization_claim', /\bresvg rasterization\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['remotion_render_claim', /\bRemotion render\/export\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['supabase_claim', /\bSupabase (?:mutation|write|SQL)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['gcs_claim', /\b(?:GCS upload|storage transfer)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['signed_url_claim', /\bsigned URLs?\b[^.\n]*(?:created|enabled|approved now|true|passed)\b/i],
  ['public_artifact_claim', /\bpublic artifacts?\b[^.\n]*(?:created|enabled|approved now|true|passed)\b/i],
  ['raw_prompt_claim', /\braw prompt\b[^.\n]*(?:executed|enabled|approved now|true|passed)\b/i],
  ['beta_claim', /\b(?:internal beta|external beta)\b[^.\n]*(?:unlocked|enabled|approved now|true|passed)\b/i],
  ['production_claim', /\bproduction\b[^.\n]*(?:unlocked|enabled|approved now|true|passed)\b/i],
  ['broad_service_role_claim', /\bbroad service-role handler\b[^.\n]*(?:enabled|approved|true|passed)\b/i],
]

const env = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const failures = []

function git(args) {
  try {
    return execFileSync('git', args, { env, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function read(path) {
  if (!existsSync(path)) {
    failures.push(`missing_file:${path}`)
    return ''
  }
  return readFileSync(path, 'utf8')
}

function readJson(path) {
  try {
    return JSON.parse(read(path))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return null
  }
}

for (const path of [...requiredDocs, ...requiredScripts]) read(path)

const docsText = requiredDocs.map(read).join('\n')
const decisionDoc = read('docs/tool-route-execution/ai-graphics-local-fixture-validation-readiness-decision.md')
const executionScriptText = read('scripts/validation/tool-route-ai-graphics-metadata-local-fixture-validation-execution.mjs')
const diagnosticScriptText = read('scripts/validation/tool-route-ai-graphics-metadata-local-fixture-validation-execution-diagnostics.mjs')

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

for (const token of requiredTokens) {
  if (!docsText.includes(token)) failures.push(`required_token_missing:${token}`)
}

for (const tool of requiredTools) {
  if (!docsText.includes(`\`${tool}\``)) failures.push(`tool_missing_from_evidence:${tool}`)
}

for (const field of requiredTrueBooleans) {
  const tablePattern = new RegExp(`${field}\\s*\\|\\s*\`true\``)
  if (!tablePattern.test(decisionDoc)) failures.push(`required_true_boolean_missing:${field}`)
}

for (const field of requiredFalseBooleans) {
  const tablePattern = new RegExp(`${field}\\s*\\|\\s*\`false\``)
  if (!tablePattern.test(decisionDoc)) failures.push(`required_false_boolean_missing:${field}`)
}

for (const [name, pattern] of forbiddenPatterns) {
  const matches = docsText
    .split('\n')
    .filter((line) => pattern.test(line))
    .filter(
      (line) =>
        !/\bNo\b/i.test(line) &&
        !/\bblocked\b/i.test(line) &&
        !/\bfalse\b/i.test(line) &&
        !/\bnot\b/i.test(line) &&
        !/\bdoes not\b/i.test(line) &&
        !/\bmust not\b/i.test(line) &&
        !/\bseparately gated\b/i.test(line) &&
        !/\bremains\b/i.test(line) &&
        !/\bnone\b/i.test(line) &&
        !/\bfuture\b/i.test(line) &&
        !/\bmay\b/i.test(line) &&
        !/\bstatic validation\b/i.test(line),
    )
  if (matches.length > 0) failures.push(`forbidden_claim:${name}:${matches.slice(0, 3).join(' | ')}`)
}

for (const forbiddenImport of [
  'server/routes',
  'server/workers',
  'tool-registry',
  'supabase',
  'playwright',
  'puppeteer',
  'remotion',
  'three',
  'pixi',
  'konva',
  'babylon',
  'satori',
  'echarts',
  'vega',
  'd3',
]) {
  const importPattern = new RegExp(`from ['"][^'"]*${forbiddenImport}|import\\(['"][^'"]*${forbiddenImport}`, 'i')
  if (importPattern.test(executionScriptText)) failures.push(`forbidden_execution_import:${forbiddenImport}`)
}
if (!/from 'node:fs'/.test(executionScriptText)) failures.push('execution_script_missing_node_fs_import')
if (!/from 'node:path'/.test(executionScriptText)) failures.push('execution_script_missing_node_path_import')
if (!/from 'node:crypto'/.test(executionScriptText)) failures.push('execution_script_missing_node_crypto_import')

const packageJson = readJson('package.json')
const expectedScripts = {
  'tool-route:ai-graphics-metadata-local-fixture-validation:execute':
    'node scripts/validation/tool-route-ai-graphics-metadata-local-fixture-validation-execution.mjs',
  'tool-route:ai-graphics-metadata-local-fixture-validation:diagnostics':
    'node scripts/validation/tool-route-ai-graphics-metadata-local-fixture-validation-execution-diagnostics.mjs',
}
for (const [script, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[script] !== command) failures.push(`missing_package_script:${script}`)
}

const basePackageJson = (() => {
  try {
    return JSON.parse(execFileSync('git', ['show', `${baseRef}:package.json`], { env, encoding: 'utf8' }))
  } catch (error) {
    failures.push(`base_package_json_unavailable:${error.message}`)
    return null
  }
})()
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'overrides']) {
  const current = JSON.stringify(packageJson?.[section] ?? {})
  const base = JSON.stringify(basePackageJson?.[section] ?? {})
  if (current !== base) failures.push(`package_dependency_section_changed:${section}`)
}
if (git(['diff', '--name-only', `${baseRef}...HEAD`, '--', 'package-lock.json']).trim()) {
  failures.push('package_lock_changed')
}
if (git(['ls-files', '.local-artifacts']).trim()) failures.push('local_artifacts_tracked')

const changedFiles = git(['diff', '--name-only', `${baseRef}...HEAD`]).split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (/\.local-artifacts\//.test(file)) failures.push(`local_artifact_changed:${file}`)
  if (/(^|\/)(dist|dist-server)\//.test(file)) failures.push(`build_output_changed:${file}`)
  if (/(^|\/)(media|render|browser|canvas|webgl|public-artifacts?)\//i.test(file)) {
    failures.push(`forbidden_output_changed:${file}`)
  }
}

if (!diagnosticScriptText.includes('tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings')) {
  failures.push('diagnostic_missing_expected_decision')
}

if (failures.length > 0) {
  console.error('TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_EXECUTION diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_EXECUTION diagnostics passed')
console.log(`decision=${expectedDecision}`)
console.log(`tools=${requiredTools.length}`)
console.log('local_fixture_validation_executed=true')
console.log('local_fixture_execution=false')
console.log('route_execution=false')
console.log('actual_tool_execution=false')
console.log('worker_execution=false')
console.log('supabase=no write/docs_only')
