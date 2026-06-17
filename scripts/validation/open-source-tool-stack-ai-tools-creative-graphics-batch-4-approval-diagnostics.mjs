import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-tools-creative-graphics-batch-3-qa-review'
const expectedDecision = 'approved_with_warnings_for_ai_graphics_batch_4_policy_and_handoff_review'
const allowedDecisions = new Set([
  expectedDecision,
  'approved_for_ai_graphics_batch_4_resvg_linux_import_proof_only',
  'blocked_pending_resvg_runtime_policy_review',
  'blocked_pending_tracka_handoff_review',
  'blocked_pending_tool_route_manifest_readiness_review',
  'blocked_pending_ai_graphics_batch_4_scope_fixes',
])
const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-approval-packet.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-source-evidence-lockfile.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-tool-selection.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-resvg-policy.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-svg-raster-fallback-policy.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-remotion-tracka-handoff-policy.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-route-manifest-readiness-plan.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-excluded-tools.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-validation-plan.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-allowed-blocked-scope.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-approval-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-5-recommendation.md',
  'docs/prompt-ai-tools-creative-graphics-batch-4-approval-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-batch-4-approval-packet.md',
]
const requiredSourceDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-qa-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-runtime-boundary-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-recommendation.md',
]
const batchTools = [
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
const requiredFalseBooleans = [
  'futureDependencyInstallApproved',
  'packageLockMutationApproved',
  'futureImportSmokeApproved',
  'futureSyntheticFixtureApproved',
  'futureResvgLinuxImportProofApproved',
  'futureResvgRasterizationApproved',
  'remotionRenderExportApprovedNow',
  'batch4ExecutionApprovedNow',
  'actualToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'renderExportApprovedNow',
  'browserRuntimeApprovedNow',
  'webglRuntimeApprovedNow',
  'canvasRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]
const requiredTrueBooleans = ['futureRemotionHandoffApproved']
const requiredTokens = [
  'PR #445',
  '87af29d7e058d4cdcba1198ef13c9d99297d1926',
  'ai_graphics_batch_3_qa_passed_with_warnings',
  '@resvg/resvg-js',
  'SVG raster fallback',
  'Remotion / Track A',
  'route-manifest readiness',
  'futureRemotionHandoffApproved',
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]
const forbiddenPatterns = [
  ['batch4_install_claim', /\bBatch 4 (?:dependency install|package install|npm install)\b[^.\n]*(?:passed|performed|executed|enabled|approved now|true)\b/i],
  ['package_lock_mutation', /\bpackage-lock mutation\b[^.\n]*(?:passed|performed|executed|enabled|approved now|true)\b/i],
  ['batch4_import_claim', /\bBatch 4 import smoke\b[^.\n]*(?:passed|performed|executed|enabled|approved now|true)\b/i],
  ['batch4_fixture_claim', /\bBatch 4 synthetic fixture proof\b[^.\n]*(?:passed|performed|executed|enabled|approved now|true)\b/i],
  ['resvg_rasterization_claim', /\bresvg rasterization\b[^.\n]*(?:passed|performed|executed|enabled|approved now|true)\b/i],
  ['remotion_render_claim', /\bRemotion render\/export\b[^.\n]*(?:passed|performed|executed|enabled|approved now|true)\b/i],
  ['browser_runtime_claim', /\bbrowser runtime\b[^.\n]*(?:performed|executed|enabled|approved now|true)\b/i],
  ['webgl_runtime_claim', /\bWebGL runtime\b[^.\n]*(?:performed|executed|enabled|approved now|true)\b/i],
  ['canvas_runtime_claim', /\bcanvas runtime\b[^.\n]*(?:performed|executed|enabled|approved now|true)\b/i],
  ['tool_execution_claim', /\bactual tool execution\b[^.\n]*(?:performed|executed|enabled|approved now|true)\b/i],
  ['route_execution_claim', /\broute execution\b[^.\n]*(?:performed|executed|enabled|approved now|true)\b/i],
  ['worker_execution_claim', /\bworker execution\b[^.\n]*(?:performed|executed|enabled|approved now|true)\b/i],
  ['provider_runtime_claim', /\bprovider\/?model (?:calls?|runtime)\b[^.\n]*(?:performed|executed|enabled|approved now|true)\b/i],
  ['supabase_claim', /\bSupabase (?:mutation|write|SQL)\b[^.\n]*(?:performed|executed|enabled|approved now|true)\b/i],
  ['gcs_claim', /\b(?:GCS upload|storage transfer)\b[^.\n]*(?:performed|executed|enabled|approved now|true)\b/i],
  ['signed_url_claim', /\bsigned URLs?\b[^.\n]*(?:created|enabled|approved now|true)\b/i],
  ['public_artifact_claim', /\bpublic artifacts?\b[^.\n]*(?:created|enabled|approved now|true)\b/i],
  ['beta_claim', /\b(?:internal beta|external beta)\b[^.\n]*(?:unlocked|enabled|approved now|true)\b/i],
  ['production_claim', /\bproduction\b[^.\n]*(?:unlocked|enabled|approved now|true)\b/i],
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

for (const path of [...requiredDocs, ...requiredSourceDocs]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = [...requiredDocs, ...requiredSourceDocs]
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

const unsafeClaimText = docsText
  .split('\n')
  .filter(
    (line) =>
      !/\b(?:No|no|not|blocked|unapproved|does not approve|do not approve|remains|stays|false|future-only|policy only|handoff only|planning only|separate|separately|without|not a release unlock)\b/i.test(
        line,
      ),
  )
  .join('\n')

for (const [name, pattern] of forbiddenPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision) && !decision.startsWith('ai_graphics_batch_3_')) {
    failures.push(`invalid_decision:${decision}`)
  }
}

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-approval-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-approval-decision.md', 'utf8')
  : ''
for (const field of requiredTrueBooleans) {
  if (!new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`true\`\\s*\\|`).test(decisionDoc)) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (!new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`false\`\\s*\\|`).test(decisionDoc)) failures.push(`required_boolean_not_false:${field}`)
}

for (const token of requiredTokens) {
  if (!docsText.includes(token)) failures.push(`required_token_missing:${token}`)
}
for (const tool of batchTools) {
  if (!docsText.includes(`\`${tool}\``)) failures.push(`batch_tool_missing:${tool}`)
}

const packageJson = readJson('package.json')
const basePackageJson = (() => {
  try {
    return JSON.parse(execFileSync('git', ['show', `${baseRef}:package.json`], { env, encoding: 'utf8' }))
  } catch (error) {
    failures.push(`base_package_json_unavailable:${error.message}`)
    return null
  }
})()

if (
  packageJson?.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:batch-4-approval:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-4-approval-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:batch-4-approval:diagnostics')
}

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
  pr445SourceEvidence: '87af29d7e058d4cdcba1198ef13c9d99297d1926',
  futureDependencyInstallApproved: false,
  packageLockMutationApproved: false,
  futureImportSmokeApproved: false,
  futureSyntheticFixtureApproved: false,
  futureResvgLinuxImportProofApproved: false,
  futureResvgRasterizationApproved: false,
  futureRemotionHandoffApproved: true,
  remotionRenderExportApprovedNow: false,
  batch4ExecutionApprovedNow: false,
  actualToolExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  renderExportApprovedNow: false,
  browserRuntimeApprovedNow: false,
  webglRuntimeApprovedNow: false,
  canvasRuntimeApprovedNow: false,
  supabaseUpdateRequired: 'no write',
  supabaseStatus: 'docs_only',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  milestoneSync: 'not_performed',
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
