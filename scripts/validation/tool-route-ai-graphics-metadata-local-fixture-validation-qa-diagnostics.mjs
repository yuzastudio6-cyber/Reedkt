import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-tool-route-ai-graphics-metadata-local-fixture-validation-execution'
const expectedDecision = 'tool_route_ai_graphics_metadata_local_fixture_validation_qa_passed_with_warnings'
const allowedDecisions = new Set([
  'tool_route_ai_graphics_metadata_local_fixture_validation_qa_passed',
  expectedDecision,
  'blocked_pending_ai_graphics_validation_qa_fixes',
  'blocked_pending_ai_graphics_template_safety_review',
  'blocked_pending_scoped_manifest_qa_fixes',
  'blocked_pending_artifact_scope_qa_fixes',
])

const requiredDocs = [
  'docs/tool-route-execution/ai-graphics-metadata-local-fixture-validation-qa-review.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-qa-source-lockfile.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-qa-matrix.md',
  'docs/tool-route-execution/ai-graphics-valid-case-validation-qa.md',
  'docs/tool-route-execution/ai-graphics-invalid-case-validation-qa.md',
  'docs/tool-route-execution/ai-graphics-blocked-case-validation-qa.md',
  'docs/tool-route-execution/ai-graphics-scoped-manifest-validation-qa.md',
  'docs/tool-route-execution/ai-graphics-private-artifact-validation-qa.md',
  'docs/tool-route-execution/ai-graphics-fail-closed-validation-qa.md',
  'docs/tool-route-execution/ai-graphics-no-execution-proof-qa.md',
  'docs/tool-route-execution/ai-graphics-worker-handoff-validation-qa.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-warning-blocker-register.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-qa-decision.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-qa-next-lane-recommendation.md',
  'docs/prompt-tool-route-ai-graphics-metadata-local-fixture-validation-qa-review-results.md',
  'docs/implementation-prompts/prompt-tool-route-ai-graphics-metadata-local-fixture-validation-qa-review.md',
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
  'validationQaAccepted',
  'validationQaAcceptedWithWarnings',
  'readyForToolRouteOwnerApproval',
  'readyForWorkerHandoffReview',
  'localFixtureValidationExecutionAccepted',
  'localFixtureValidationPassed',
  'validCaseValidationAccepted',
  'invalidCaseValidationAccepted',
  'blockedCaseValidationAccepted',
  'scopedManifestValidationAccepted',
  'privateArtifactValidationAccepted',
  'failClosedValidationAccepted',
  'noExecutionProofAccepted',
  'workerHandoffValidationAccepted',
]

const requiredFalseBooleans = [
  'readyForRouteExecutionPlanning',
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
  'PR #464',
  '8b6274f6a17027b5e52eeaf44e0af287d1986a55',
  'tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings',
  'ai-graphics-local-fixture-validation-local-static',
  'PR #462',
  '333083ebe48e31b5ede94cf72e6810d2297e7d4b',
  'PR #458',
  '7dc6afdd4188f9d629910db88c1b3ed148876ed7',
  'PR #457',
  'PR #456',
  'PR #454',
  'PR #409',
  'PR #404',
  'PR #398',
  'PR #164',
  'TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_OWNER_APPROVAL',
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
  [
    'secret_material',
    /\b(sk-[A-Za-z0-9_-]{32,}|Bearer\s+[A-Za-z0-9._~+/-]{32,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|X-Goog-Signature=|X-Amz-Signature=)\b/i,
  ],
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

for (const path of requiredDocs) read(path)

const docsText = requiredDocs.map(read).join('\n')
const decisionDoc = read('docs/tool-route-execution/ai-graphics-local-fixture-validation-qa-decision.md')
const qaMatrix = read('docs/tool-route-execution/ai-graphics-local-fixture-validation-qa-matrix.md')

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

for (const token of requiredTokens) {
  if (!docsText.includes(token)) failures.push(`required_token_missing:${token}`)
}

for (const tool of requiredTools) {
  const row = qaMatrix.split('\n').find((line) => line.includes(`\`${tool}\``))
  if (!row) failures.push(`qa_matrix_tool_missing:${tool}`)
  else {
    for (const requiredStatus of [
      'passed_with_warnings',
      'accepted_with_warnings',
    ]) {
      if (!row.includes(requiredStatus)) failures.push(`qa_matrix_status_missing:${tool}:${requiredStatus}`)
    }
  }
  if (!docsText.includes(`\`${tool}\``)) failures.push(`tool_missing_from_qa_docs:${tool}`)
}

for (const field of requiredTrueBooleans) {
  const pattern = new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`true\`\\s*\\|`)
  if (!pattern.test(decisionDoc)) failures.push(`required_true_boolean_missing:${field}`)
}

for (const field of requiredFalseBooleans) {
  const pattern = new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`false\`\\s*\\|`)
  if (!pattern.test(decisionDoc)) failures.push(`required_false_boolean_missing:${field}`)
}

const unsafeClaimText = docsText
  .split('\n')
  .filter(
    (line) =>
      !/\b(?:No|no|not|blocked|unapproved|does not approve|do not approve|must not|remains|remain|stays|false|future|metadata-only|static|QA|review|policy context|context only|planning|handoff|separately gated|without|warning|warnings|defer|deferred|none|placeholder|accepted with warnings|accepted_with_warnings)\b/i.test(
        line,
      ),
  )
  .join('\n')

for (const [name, pattern] of forbiddenPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

const packageJson = readJson('package.json')
const expectedScript =
  'node scripts/validation/tool-route-ai-graphics-metadata-local-fixture-validation-qa-diagnostics.mjs'
if (packageJson?.scripts?.['tool-route:ai-graphics-metadata-local-fixture-validation-qa:diagnostics'] !== expectedScript) {
  failures.push('missing_package_script:tool-route:ai-graphics-metadata-local-fixture-validation-qa:diagnostics')
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

const packageJsonDiff = `${git(['diff', '--', 'package.json'])}\n${git(['diff', '--cached', '--', 'package.json'])}`
const unexpectedPackageJsonDiff = packageJsonDiff
  .split('\n')
  .filter((line) => /^[+-]\s*"/.test(line))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-handoff-approval:diagnostics'))
  .filter((line) => !line.includes('tool-route:ai-graphics-metadata-local-fixture-validation-qa:diagnostics'))
  .filter((line) => !line.includes('tool-route:ai-graphics-metadata-local-fixture-owner-approval:diagnostics'))
  .filter((line) => !line.includes('tool-route:ai-graphics-metadata-local-fixture-gate-status:diagnostics'))
  .filter((line) => !line.includes('tool-route:ai-graphics-metadata-local-fixture-gate-status-qa:diagnostics'))
  .filter((line) => !line.includes('tool-route:ai-graphics-metadata-local-fixture-gate-status-owner-approval:diagnostics'))
if (unexpectedPackageJsonDiff.length > 0) failures.push(`unexpected_package_json_diff:${unexpectedPackageJsonDiff.join(' | ')}`)

if (git(['diff', '--name-only', `${baseRef}...HEAD`, '--', 'package-lock.json']).trim()) {
  failures.push('package_lock_changed')
}

if (git(['ls-files', '.local-artifacts']).trim()) failures.push('local_artifacts_tracked')

const changedFiles = git(['diff', '--name-only', `${baseRef}...HEAD`]).split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (/\.local-artifacts\//.test(file)) failures.push(`local_artifact_changed:${file}`)
  if (/(^|\/)(dist|dist-server)\//.test(file)) failures.push(`build_output_changed:${file}`)
  if (/(^|\/)(media|render|browser|canvas|webgl|public-artifacts?|local-fixture-output)\//i.test(file)) {
    failures.push(`forbidden_output_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|pdf)$/i.test(file)) failures.push(`generated_binary_output_changed:${file}`)
}

if (!docsText.includes('No local fixture execution, route execution, actual tool execution')) {
  failures.push('no_scope_statement_missing')
}

if (failures.length > 0) {
  console.error('TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_QA_REVIEW diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_QA_REVIEW diagnostics passed')
console.log(`decision=${expectedDecision}`)
console.log(`tools=${requiredTools.length}`)
console.log('validationQaAccepted=true')
console.log('localFixtureValidationExecutionAccepted=true')
console.log('readyForToolRouteOwnerApproval=true')
console.log('readyForRouteExecutionPlanning=false')
console.log('localFixtureExecutionApprovedNow=false')
console.log('routeExecutionApprovedNow=false')
console.log('actualToolExecutionApprovedNow=false')
console.log('workerExecutionApprovedNow=false')
console.log('supabase=no write/docs_only')
