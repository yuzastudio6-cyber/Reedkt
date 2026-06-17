import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-tool-route-ai-graphics-metadata-integration-qa-review'
const expectedDecision = 'approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan'
const allowedDecisions = new Set([
  'approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan',
  'approved_for_tool_route_ai_graphics_metadata_local_fixture_plan',
  'blocked_pending_ai_graphics_local_fixture_scope_fixes',
  'blocked_pending_scoped_manifest_template_fixes',
  'blocked_pending_worker_handoff_review',
  'blocked_pending_artifact_scope_review',
])

const requiredDocs = [
  'docs/tool-route-execution/ai-graphics-metadata-local-fixture-plan.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-source-evidence-lockfile.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-case-inventory.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-valid-case-plan.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-invalid-case-plan.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-scoped-manifest-template.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-private-artifact-template.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-fail-closed-validation-plan.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-no-execution-proof-plan.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-worker-handoff-expectations.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-blocked-use-cases.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-allowed-blocked-scope.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-plan-decision.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-next-lane-recommendation.md',
  'docs/prompt-tool-route-ai-graphics-metadata-local-fixture-plan-validation-results.md',
  'docs/implementation-prompts/prompt-tool-route-ai-graphics-metadata-local-fixture-plan.md',
]

const optionalJsonTemplates = [
  'docs/tool-route-execution/fixtures/ai-graphics-metadata-local-fixture-valid-template.json',
  'docs/tool-route-execution/fixtures/ai-graphics-metadata-local-fixture-invalid-template.json',
  'docs/tool-route-execution/fixtures/ai-graphics-metadata-local-fixture-blocked-template.json',
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

const requiredTokens = [
  'PR #457',
  'add9d8bb74afd697e281726d7434c1a200b58b48',
  'PR #456',
  '36efdcd678fc6bd69fe7569268af9bb4a81a6aa8',
  'PR #454',
  'PR #451',
  'PR #404',
  'PR #398',
  'PR #164',
  'approved plan snapshot',
  'scoped tool-call manifest',
  'private artifact',
  'checksum',
  'fail closed',
  'TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_APPROVAL',
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]

const requiredTrueBooleans = [
  'futureLocalFixturePlanningAccepted',
  'futureLocalFixtureValidationApproved',
  'futureScopedManifestFixtureApproved',
  'futureWorkerHandoffReviewApproved',
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

const forbiddenPatterns = [
  ['npm_install_claim', /\b(?:npm install|new dependency addition|dependency install)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['package_lock_mutation_claim', /\bpackage-lock (?:mutation|change)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['import_smoke_claim', /\bimport smoke\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['synthetic_fixture_claim', /\bsynthetic fixture\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['local_fixture_execution_claim', /\blocal fixture execution\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['resvg_rasterization_claim', /\bresvg rasterization\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['remotion_render_claim', /\bRemotion render\/export\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['browser_runtime_claim', /\bbrowser runtime\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['webgl_runtime_claim', /\bWebGL runtime\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['canvas_runtime_claim', /\bcanvas runtime\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['tool_execution_claim', /\b(?:actual tool execution|tool execution)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['route_execution_claim', /\broute execution\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['worker_execution_claim', /\bworker execution\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['provider_runtime_claim', /\bprovider\/?model (?:calls?|runtime|execution)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['supabase_claim', /\bSupabase (?:mutation|write|SQL)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['gcs_claim', /\b(?:GCS upload|storage transfer)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['signed_url_claim', /\bsigned URLs?\b[^.\n]*(?:created|enabled|approved now|true|passed)\b/i],
  ['public_artifact_claim', /\bpublic artifacts?\b[^.\n]*(?:created|enabled|approved now|true|passed)\b/i],
  ['raw_prompt_claim', /\braw prompt\b[^.\n]*(?:executed|enabled|approved now|true|passed)\b/i],
  ['beta_claim', /\b(?:internal beta|external beta)\b[^.\n]*(?:unlocked|enabled|approved now|true|passed)\b/i],
  ['production_claim', /\bproduction\b[^.\n]*(?:unlocked|enabled|approved now|true|passed)\b/i],
  ['broad_service_role_claim', /\bbroad service-role handler\b[^.\n]*(?:enabled|approved|true|passed)\b/i],
]

const unsafeJsonPatterns = [
  ['url', /https?:\/\//i],
  ['signed_url', /signed[_ -]?url/i],
  ['public_artifact', /public[_ -]?artifact/i],
  ['raw_prompt', /raw[_ -]?prompt/i],
  ['secret', /\b(secret|api[_-]?key|token|password|credential)\b/i],
  ['provider_output', /provider[_ -]?(raw[_ -]?)?output/i],
  ['user_data', /real[_ -]?user|user[_ -]?media/i],
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

const allDocsText = requiredDocs.map(read).join('\n')
const decisionDoc = read('docs/tool-route-execution/ai-graphics-local-fixture-plan-decision.md')
const inventoryDoc = read('docs/tool-route-execution/ai-graphics-local-fixture-case-inventory.md')

const decisionMatch = allDocsText.match(/Decision:\s*`([^`]+)`/)
const decision = decisionMatch?.[1]
if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision ?? 'missing'}`)
if (decision !== expectedDecision) failures.push(`unexpected_decision:${decision ?? 'missing'}`)

for (const token of requiredTokens) {
  if (!allDocsText.includes(token)) failures.push(`missing_required_token:${token}`)
}

for (const tool of requiredTools) {
  const row = inventoryDoc.split('\n').find((line) => line.includes(`| \`${tool}\``))
  if (!row) failures.push(`inventory_missing_tool:${tool}`)
  else {
    for (const expected of ['valid_ai_graphics', 'invalid_ai_graphics', 'blocked_ai_graphics']) {
      if (!row.includes(expected)) failures.push(`inventory_tool_missing_case:${tool}:${expected}`)
    }
    if (!/metadata|manifest/i.test(row)) failures.push(`inventory_tool_missing_metadata_manifest_scope:${tool}`)
    if (!/blocked|runtime|execution|output|render/i.test(row)) failures.push(`inventory_tool_missing_blocked_runtime:${tool}`)
    if (!/private/i.test(row)) failures.push(`inventory_tool_missing_private_artifact_scope:${tool}`)
    if (!/checksum/i.test(row)) failures.push(`inventory_tool_missing_checksum:${tool}`)
    if (!/Worker/i.test(row)) failures.push(`inventory_tool_missing_worker_handoff:${tool}`)
  }
}

for (const field of requiredTrueBooleans) {
  const pattern = new RegExp(`${field}\\s*\\|\\s*\`true\``)
  if (!pattern.test(decisionDoc) && !allDocsText.includes(`${field}: true`)) failures.push(`required_true_boolean_missing:${field}`)
}

for (const field of requiredFalseBooleans) {
  const pattern = new RegExp(`${field}\\s*\\|\\s*\`false\``)
  if (!pattern.test(decisionDoc) && !allDocsText.includes(`${field}: false`)) failures.push(`required_false_boolean_missing:${field}`)
}

for (const [name, pattern] of forbiddenPatterns) {
  const matches = allDocsText
    .split('\n')
    .filter((line) => pattern.test(line))
    .filter(
      (line) =>
        !/\bNo\b/i.test(line) &&
        !/\bblocked\b/i.test(line) &&
        !/\bfalse\b/i.test(line) &&
        !/\bnot\b/i.test(line) &&
        !/\bdoes not\b/i.test(line) &&
        !/\bseparately gated\b/i.test(line) &&
        !/\bremains\b/i.test(line) &&
        !/\bnone\b/i.test(line) &&
        !/\bfuture\b/i.test(line) &&
        !/\bplanned\b/i.test(line),
    )
  if (matches.length > 0) failures.push(`forbidden_claim:${name}:${matches.slice(0, 3).join(' | ')}`)
}

for (const path of optionalJsonTemplates) {
  if (!existsSync(path)) continue
  const json = readJson(path)
  const text = read(path)
  if (json?.executionApproved !== false) failures.push(`fixture_template_execution_not_false:${path}`)
  for (const [name, pattern] of unsafeJsonPatterns) {
    if (pattern.test(text)) failures.push(`fixture_template_unsafe_token:${path}:${name}`)
  }
  if (!text.includes('<') || !text.includes('>')) failures.push(`fixture_template_missing_placeholders:${path}`)
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['tool-route:ai-graphics-metadata-local-fixture-plan:diagnostics'] !==
  'node scripts/validation/tool-route-ai-graphics-metadata-local-fixture-plan-diagnostics.mjs'
) {
  failures.push('missing_package_script:tool-route:ai-graphics-metadata-local-fixture-plan:diagnostics')
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

const packageLockDiff = git(['diff', '--name-only', `${baseRef}...HEAD`, '--', 'package-lock.json'])
if (packageLockDiff) failures.push(`package_lock_changed:${packageLockDiff}`)

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const changedGeneratedOutputs = git(['diff', '--name-only', `${baseRef}...HEAD`])
  .split('\n')
  .filter(Boolean)
  .filter((path) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|svg|pdf)$/i.test(path))
if (changedGeneratedOutputs.length > 0) failures.push(`generated_media_or_render_output_changed:${changedGeneratedOutputs.join(',')}`)

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decisionState: expectedDecision,
  sourcePr: '#457',
  sourceHead: 'add9d8bb74afd697e281726d7434c1a200b58b48',
  toolCount: requiredTools.length,
  futureLocalFixturePlanningAccepted: true,
  futureLocalFixtureValidationApproved: true,
  futureScopedManifestFixtureApproved: true,
  futureWorkerHandoffReviewApproved: true,
  localFixtureExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  actualToolExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  supabase: {
    updateRequired: 'no write',
    updateStatus: 'docs_only',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    milestoneSync: 'not_performed',
  },
  packageLockUnchanged: !packageLockDiff,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
