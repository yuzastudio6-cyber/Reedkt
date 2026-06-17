import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-tools-creative-graphics-route-manifest-integration-qa-review'
const expectedDecision = 'approved_with_warnings_for_tool_route_ai_graphics_metadata_integration'
const allowedDecisions = new Set([
  expectedDecision,
  'approved_for_tool_route_ai_graphics_metadata_integration',
  'blocked_pending_ai_graphics_metadata_scope_fixes',
  'blocked_pending_tool_route_owner_review',
  'blocked_pending_worker_handoff_review',
  'blocked_pending_tracka_handoff_review',
])

const requiredDocs = [
  'docs/tool-route-execution/ai-graphics-metadata-integration-approval.md',
  'docs/tool-route-execution/ai-graphics-source-evidence-lockfile.md',
  'docs/tool-route-execution/ai-graphics-route-registry-plan.md',
  'docs/tool-route-execution/ai-graphics-route-eligibility-intake-matrix.md',
  'docs/tool-route-execution/ai-graphics-scoped-tool-call-manifest-intake.md',
  'docs/tool-route-execution/ai-graphics-artifact-scope-mapping.md',
  'docs/tool-route-execution/ai-graphics-fail-closed-route-selection-policy.md',
  'docs/tool-route-execution/ai-graphics-worker-handoff-requirements.md',
  'docs/tool-route-execution/ai-graphics-blocked-use-register.md',
  'docs/tool-route-execution/ai-graphics-validation-plan.md',
  'docs/tool-route-execution/ai-graphics-allowed-blocked-scope.md',
  'docs/tool-route-execution/ai-graphics-metadata-integration-approval-decision.md',
  'docs/tool-route-execution/ai-graphics-next-lane-recommendation.md',
  'docs/prompt-tool-route-ai-graphics-metadata-integration-approval-validation-results.md',
  'docs/implementation-prompts/prompt-tool-route-ai-graphics-metadata-integration-approval.md',
]

const sourceDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-integration-qa-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-qa-acceptance-matrix.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-qa-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-integration-approval.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-approval-decision.md',
  'docs/tool-route-metadata-resolution-policy.md',
  'docs/tool-route-fail-closed-policy.md',
  'docs/tool-route-artifact-source-of-truth-guardrails.md',
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
  'PR #454',
  '03ad9b668e22f69c347cb0874d754453f44b9404',
  'PR #451',
  'f497302fc5f80bf891cc3d17336627ffcb0132b0',
  'PR #404',
  'PR #398',
  'PR #164',
  '1553d50118919bf013d35bbc23a534af9d86c8ae',
  'approved plan snapshot',
  'scoped tool-call manifest',
  'private artifact',
  'fail',
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]

const requiredTrueBooleans = [
  'futureToolRouteMetadataIntegrationApproved',
  'futureScopedToolCallManifestIntakeApproved',
  'futureWorkerHandoffApproved',
]

const requiredFalseBooleans = [
  'dependencyInstallApprovedNow',
  'packageLockMutationApprovedNow',
  'importSmokeExecutionApprovedNow',
  'syntheticFixtureExecutionApprovedNow',
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
  ['dependency_install_claim', /\b(?:dependency install|npm install)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['package_lock_mutation_claim', /\bpackage-lock (?:mutation|change)\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['import_smoke_claim', /\bimport smoke\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
  ['synthetic_fixture_claim', /\bsynthetic fixture\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
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

for (const path of [...requiredDocs, ...sourceDocs]) read(path)

const allDocsText = requiredDocs.map(read).join('\n')
const decisionDoc = read('docs/tool-route-execution/ai-graphics-metadata-integration-approval-decision.md')
const matrixDoc = read('docs/tool-route-execution/ai-graphics-route-eligibility-intake-matrix.md')
const sourceDoc = read('docs/tool-route-execution/ai-graphics-source-evidence-lockfile.md')

const decisionMatch = allDocsText.match(/Decision:\s*`([^`]+)`/)
const decision = decisionMatch?.[1]
if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision ?? 'missing'}`)
if (decision !== expectedDecision) failures.push(`unexpected_decision:${decision ?? 'missing'}`)

for (const token of requiredTokens) {
  if (!allDocsText.includes(token) && !sourceDoc.includes(token)) failures.push(`missing_required_token:${token}`)
}

for (const tool of requiredTools) {
  const row = matrixDoc.split('\n').find((line) => line.includes(`| \`${tool}\``))
  if (!row) failures.push(`matrix_missing_tool:${tool}`)
  else {
    if (!row.includes('`accepted_with_warnings`')) failures.push(`matrix_tool_not_accepted_with_warnings:${tool}`)
    if (!/metadata|manifest/i.test(row)) failures.push(`matrix_tool_missing_metadata_manifest_scope:${tool}`)
    if (!/blocked|runtime|execution|output|render/i.test(row)) failures.push(`matrix_tool_missing_blocked_runtime:${tool}`)
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
        !/\bfuture-only\b/i.test(line) &&
        !/\bnot\b/i.test(line) &&
        !/\bdoes not\b/i.test(line) &&
        !/\bseparately gated\b/i.test(line) &&
        !/\bremains\b/i.test(line) &&
        !/\bnone\b/i.test(line) &&
        !/\bBatch [123]\b/i.test(line),
    )
  if (matches.length > 0) failures.push(`forbidden_claim:${name}:${matches.slice(0, 3).join(' | ')}`)
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['tool-route:ai-graphics-metadata-integration-approval:diagnostics'] !==
  'node scripts/validation/tool-route-ai-graphics-metadata-integration-approval-diagnostics.mjs'
) {
  failures.push('missing_package_script:tool-route:ai-graphics-metadata-integration-approval:diagnostics')
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
  sourcePr: '#454',
  sourceHead: '03ad9b668e22f69c347cb0874d754453f44b9404',
  aiGraphicsApprovalPr: '#451',
  trackBContextPr: '#164',
  toolCount: requiredTools.length,
  futureToolRouteMetadataIntegrationApproved: true,
  futureScopedToolCallManifestIntakeApproved: true,
  futureWorkerHandoffApproved: true,
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
