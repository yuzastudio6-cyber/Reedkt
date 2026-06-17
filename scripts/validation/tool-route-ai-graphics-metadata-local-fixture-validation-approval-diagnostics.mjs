import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-tool-route-ai-graphics-metadata-local-fixture-plan'
const expectedDecision = 'approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation'
const allowedDecisions = new Set([
  'approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation',
  'approved_for_tool_route_ai_graphics_metadata_local_fixture_validation',
  'blocked_pending_ai_graphics_fixture_validation_scope_fixes',
  'blocked_pending_scoped_manifest_validation_policy_fixes',
  'blocked_pending_artifact_scope_validation_policy_fixes',
  'blocked_pending_worker_handoff_review',
])

const requiredDocs = [
  'docs/tool-route-execution/ai-graphics-metadata-local-fixture-validation-approval.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-source-evidence-lockfile.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-scope.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-valid-case-validation-policy.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-invalid-case-validation-policy.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-blocked-case-validation-policy.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-scoped-manifest-validation-policy.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-private-artifact-validation-policy.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-fail-closed-assertion-policy.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-no-execution-proof-requirements.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-worker-handoff-validation-requirements.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-allowed-blocked-scope.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-approval-decision.md',
  'docs/tool-route-execution/ai-graphics-local-fixture-validation-next-lane-recommendation.md',
  'docs/prompt-tool-route-ai-graphics-metadata-local-fixture-validation-approval-results.md',
  'docs/implementation-prompts/prompt-tool-route-ai-graphics-metadata-local-fixture-validation-approval.md',
]

const sourceTemplateDocs = [
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
  'PR #458',
  '7dc6afdd4188f9d629910db88c1b3ed148876ed7',
  'approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan',
  'PR #457',
  'add9d8bb74afd697e281726d7434c1a200b58b48',
  'PR #456',
  '36efdcd678fc6bd69fe7569268af9bb4a81a6aa8',
  'PR #454',
  'PR #451',
  'PR #409',
  'PR #404',
  'PR #398',
  'PR #164',
  'approved plan snapshot',
  'scoped tool-call manifest',
  'private artifact',
  'checksum',
  'fail closed',
  'TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_EXECUTION',
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]

const requiredTrueBooleans = [
  'futureLocalFixtureValidationApproved',
  'futureValidCaseValidationApproved',
  'futureInvalidCaseValidationApproved',
  'futureBlockedCaseValidationApproved',
  'futureScopedManifestValidationApproved',
  'futurePrivateArtifactValidationApproved',
  'futureWorkerHandoffValidationApproved',
]

const requiredFalseBooleans = [
  'localFixtureValidationExecutionApprovedNow',
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
  ['dependency_install_claim', /\b(?:npm install|dependency install|new dependency addition)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['package_lock_mutation_claim', /\bpackage-lock (?:mutation|change)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['import_smoke_claim', /\bimport smoke\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['synthetic_fixture_claim', /\bsynthetic fixture\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['local_fixture_validation_execution_claim', /\blocal fixture validation execution\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
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

const forbiddenTrackedPathPatterns = [
  /\.local-artifacts\//,
  /(^|\/)(dist|dist-server)\//,
  /(^|\/)(media|render|browser|canvas|webgl|public-artifacts?)\//i,
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
for (const path of sourceTemplateDocs) read(path)

const allDocsText = requiredDocs.map(read).join('\n')
const decisionDoc = read('docs/tool-route-execution/ai-graphics-local-fixture-validation-approval-decision.md')
const scopeDoc = read('docs/tool-route-execution/ai-graphics-local-fixture-validation-scope.md')

const decisionMatch = allDocsText.match(/Decision:\s*`([^`]+)`/)
const decision = decisionMatch?.[1]
if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision ?? 'missing'}`)
if (decision !== expectedDecision) failures.push(`unexpected_decision:${decision ?? 'missing'}`)

for (const token of requiredTokens) {
  if (!allDocsText.includes(token)) failures.push(`missing_required_token:${token}`)
}

for (const tool of requiredTools) {
  const row = scopeDoc.split('\n').find((line) => line.includes(`| \`${tool}\``))
  if (!row) failures.push(`validation_scope_missing_tool:${tool}`)
  else {
    for (const required of ['valid_ai_graphics', 'invalid_ai_graphics', 'blocked_ai_graphics']) {
      if (!row.includes(required)) failures.push(`validation_scope_tool_missing_case:${tool}:${required}`)
    }
    for (const required of ['scoped manifest', 'private artifact', 'fail', 'No local fixture', 'Worker']) {
      if (!row.toLowerCase().includes(required.toLowerCase())) {
        failures.push(`validation_scope_tool_missing_requirement:${tool}:${required}`)
      }
    }
  }
}

for (const field of requiredTrueBooleans) {
  const tablePattern = new RegExp(`${field}\\s*\\|\\s*\`true\``)
  if (!tablePattern.test(decisionDoc) && !allDocsText.includes(`${field}: true`)) {
    failures.push(`required_true_boolean_missing:${field}`)
  }
}

for (const field of requiredFalseBooleans) {
  const tablePattern = new RegExp(`${field}\\s*\\|\\s*\`false\``)
  if (!tablePattern.test(decisionDoc) && !allDocsText.includes(`${field}: false`)) {
    failures.push(`required_false_boolean_missing:${field}`)
  }
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
        !/\bmust not\b/i.test(line) &&
        !/\bseparately gated\b/i.test(line) &&
        !/\bremains\b/i.test(line) &&
        !/\bnone\b/i.test(line) &&
        !/\bfuture\b/i.test(line) &&
        !/\bmay\b/i.test(line) &&
        !/\bplanned\b/i.test(line),
    )
  if (matches.length > 0) failures.push(`forbidden_claim:${name}:${matches.slice(0, 3).join(' | ')}`)
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['tool-route:ai-graphics-metadata-local-fixture-validation-approval:diagnostics'] !==
  'node scripts/validation/tool-route-ai-graphics-metadata-local-fixture-validation-approval-diagnostics.mjs'
) {
  failures.push('missing_package_script:tool-route:ai-graphics-metadata-local-fixture-validation-approval:diagnostics')
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
if (packageLockDiff.trim()) failures.push('package_lock_changed')

const changedFiles = git(['diff', '--name-only', `${baseRef}...HEAD`]).split('\n').filter(Boolean)
for (const path of changedFiles) {
  for (const pattern of forbiddenTrackedPathPatterns) {
    if (pattern.test(path)) failures.push(`forbidden_changed_output:${path}`)
  }
}

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
for (const path of stagedFiles) {
  for (const pattern of forbiddenTrackedPathPatterns) {
    if (pattern.test(path)) failures.push(`forbidden_staged_output:${path}`)
  }
}

if (failures.length > 0) {
  console.error('TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_APPROVAL diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_APPROVAL diagnostics passed')
console.log(`decision=${decision}`)
console.log(`validated_tools=${requiredTools.length}`)
console.log('local_fixture_validation_execution=false')
console.log('route_execution=false')
console.log('actual_tool_execution=false')
console.log('worker_execution=false')
console.log('supabase=no write/docs_only')
