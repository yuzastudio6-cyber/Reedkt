import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-tool-route-ai-graphics-metadata-local-fixture-owner-approval'
const expectedDecision = 'tool_route_ai_graphics_metadata_local_fixture_gate_status_ready_with_warnings'
const allowedDecisions = new Set([
  'tool_route_ai_graphics_metadata_local_fixture_gate_status_ready_with_warnings',
  'tool_route_ai_graphics_metadata_local_fixture_owner_approved_with_warnings',
  'tool_route_ai_graphics_metadata_local_fixture_validation_qa_passed_with_warnings',
  'tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings',
  'blocked_pending_ai_graphics_gate_status_fixes',
  'blocked_pending_ai_graphics_owner_approval_recheck',
  'blocked_pending_ai_graphics_gate_status_source_mismatch',
])

const requiredDocs = [
  'docs/tool-route-execution/ai-graphics-metadata-local-fixture-gate-status-packet.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-gate-status-source-lockfile.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-gate-status-matrix.md',
  'docs/tool-route-execution/ai-graphics-valid-case-gate-status.md',
  'docs/tool-route-execution/ai-graphics-invalid-case-gate-status.md',
  'docs/tool-route-execution/ai-graphics-blocked-case-gate-status.md',
  'docs/tool-route-execution/ai-graphics-scoped-manifest-gate-status.md',
  'docs/tool-route-execution/ai-graphics-private-artifact-gate-status.md',
  'docs/tool-route-execution/ai-graphics-fail-closed-gate-status.md',
  'docs/tool-route-execution/ai-graphics-no-execution-proof-gate-status.md',
  'docs/tool-route-execution/ai-graphics-worker-handoff-gate-status.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-gate-status-blocked-use-register.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-gate-status-decision.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-gate-status-next-lane-recommendation.md',
  'docs/prompt-tool-route-ai-graphics-metadata-local-fixture-gate-status-packet-results.md',
  'docs/implementation-prompts/prompt-tool-route-ai-graphics-metadata-local-fixture-gate-status-packet.md',
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

const requiredTrueBooleans = ['localFixtureGateStatusReady', 'localFixtureGateStatusReadyWithWarnings']

const requiredFalseBooleans = [
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
  'futureLocalFixtureGateExecutionApproved',
  'futureLocalFixtureValidationExecutionApproved',
  'futureLocalFixtureExecutionApproved',
  'futureRouteExecutionApproved',
  'futureActualToolExecutionApproved',
  'futureWorkerExecutionApproved',
  'futureProviderRuntimeApproved',
  'futureBrowserRuntimeApproved',
  'futureWebglRuntimeApproved',
  'futureCanvasRuntimeApproved',
  'futureResvgRasterizationApproved',
  'futureRemotionRenderExportApproved',
  'futureSupabaseMutationApproved',
  'futureGcsUploadApproved',
  'futurePublicArtifactsApproved',
  'futureSignedUrlsApproved',
  'futureRawPromptExecutionApproved',
  'futureInternalBetaApproved',
  'futureExternalBetaApproved',
  'futureProductionApproved',
]

const requiredTokens = [
  'PR #468',
  'a617420ae197ca983ceb97dc3cd352047ba78e50',
  'tool_route_ai_graphics_metadata_local_fixture_owner_approved_with_warnings',
  'PR #467',
  'abf3e1ae20f1670d2ca0f9c2ca4b5a8670c0018e',
  'tool_route_ai_graphics_metadata_local_fixture_validation_qa_passed_with_warnings',
  'PR #464',
  '8b6274f6a17027b5e52eeaf44e0af287d1986a55',
  'tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings',
  'ai-graphics-local-fixture-validation-local-static',
  'PR #462',
  'PR #458',
  'PR #457',
  'PR #456',
  'PR #454',
  'PR #414',
  'PR #409',
  'PR #404',
  'PR #398',
  'PR #164',
  'TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_GATE_STATUS_QA_REVIEW',
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]

const forbiddenPatterns = [
  ['snake_dry_run_pass_claim', /\bdry_run_passed\b/i],
  ['snake_generated_fixture_pass_claim', /\bgenerated_local_fixture_passed\b/i],
  ['local_fixture_validation_execution_claim', /\blocal fixture validation execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['local_fixture_execution_claim', /\b(?:actual )?local fixture execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['route_execution_claim', /\broute execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['tool_execution_claim', /\b(?:actual tool execution|tool execution)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['worker_execution_claim', /\bworker execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['provider_runtime_claim', /\bprovider\/?model (?:calls?|runtime|execution)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['browser_webgl_canvas_claim', /\b(?:browser|WebGL|canvas) runtime\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['resvg_claim', /\bresvg rasterization\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['remotion_claim', /\bRemotion render\/export\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['supabase_claim', /\bSupabase (?:mutation|write|SQL)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['gcs_claim', /\b(?:GCS upload|storage transfer)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['signed_url_claim', /\bsigned URLs?\b[^.\n|]*(?:created|enabled|approved now|approved with|true|passed)\b/i],
  ['public_artifact_claim', /\bpublic artifacts?\b[^.\n|]*(?:created|enabled|approved now|approved with|true|passed)\b/i],
  ['raw_prompt_claim', /\braw prompt\b[^.\n|]*(?:executed|enabled|approved now|approved with|true|passed)\b/i],
  ['beta_claim', /\b(?:internal beta|external beta)\b[^.\n|]*(?:unlocked|enabled|approved now|approved with|true|passed)\b/i],
  ['production_claim', /\bproduction\b[^.\n|]*(?:unlocked|enabled|approved now|approved with|true|passed)\b/i],
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
const decisionDoc = read('docs/tool-route-execution/ai-graphics-local-fixture-gate-status-decision.md')
const matrixDoc = read('docs/tool-route-execution/ai-graphics-local-fixture-gate-status-matrix.md')

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

for (const token of requiredTokens) {
  if (!docsText.includes(token)) failures.push(`required_token_missing:${token}`)
}

for (const tool of requiredTools) {
  const row = matrixDoc.split('\n').find((line) => line.includes(`\`${tool}\``))
  if (!row) failures.push(`gate_status_matrix_tool_missing:${tool}`)
  else {
    for (const requiredCell of [
      'ready_with_warnings',
      'accepted_with_warnings',
      '<APPROVED_PLAN_SNAPSHOT_FIXTURE>',
      '<SCOPED_TOOL_CALL_MANIFEST_REF>',
      '<PRIVATE_ARTIFACT_MANIFEST_REF>',
    ]) {
      if (!row.includes(requiredCell)) failures.push(`gate_status_matrix_cell_missing:${tool}:${requiredCell}`)
    }
  }
  if (!docsText.includes(`\`${tool}\``)) failures.push(`tool_missing_from_gate_status_docs:${tool}`)
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
      !/\b(?:No|no|not|blocked|unapproved|does not approve|do not approve|must not|remains|remain|stays|false|status-only|metadata-only|static|separately gated|without|warning|warnings|defer|deferred|none|placeholder|required|source evidence|source chain|context only|policy context|not source of truth|review remains|pending|later)\b/i.test(
        line,
      ),
  )
  .join('\n')

for (const [name, pattern] of forbiddenPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

if (/\bdry_run_passed\b/i.test(docsText)) failures.push('forbidden_claim:dry_run_passed_token')
if (/\bgenerated_local_fixture_passed\b/i.test(docsText)) failures.push('forbidden_claim:generated_local_fixture_passed_token')

const packageJson = readJson('package.json')
const expectedScript =
  'node scripts/validation/tool-route-ai-graphics-metadata-local-fixture-gate-status-diagnostics.mjs'
if (packageJson?.scripts?.['tool-route:ai-graphics-metadata-local-fixture-gate-status:diagnostics'] !== expectedScript) {
  failures.push('missing_package_script:tool-route:ai-graphics-metadata-local-fixture-gate-status:diagnostics')
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
  .filter((line) => !line.includes('tool-route:ai-graphics-metadata-local-fixture-gate-status:diagnostics'))
  .filter((line) => !line.includes('tool-route:ai-graphics-metadata-local-fixture-gate-status-qa:diagnostics'))
  .filter((line) => !line.includes('tool-route:ai-graphics-metadata-local-fixture-gate-status-owner-approval:diagnostics'))

  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-gate-status:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-gate-status-qa:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-gate-status-owner-approval:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-runtime-gate:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-runtime-gate-qa:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-controlled-noop-worker-gate-approval:diagnostics'))
if (unexpectedPackageJsonDiff.length > 0) failures.push(`unexpected_package_json_diff:${unexpectedPackageJsonDiff.join(' | ')}`)

if (git(['diff', '--name-only', `${baseRef}...HEAD`, '--', 'package-lock.json']).trim()) failures.push('package_lock_changed')
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

if (!docsText.includes('No local fixture validation execution, actual local fixture execution')) {
  failures.push('no_scope_statement_missing')
}

if (failures.length > 0) {
  console.error('TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_GATE_STATUS diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_GATE_STATUS diagnostics passed.')
