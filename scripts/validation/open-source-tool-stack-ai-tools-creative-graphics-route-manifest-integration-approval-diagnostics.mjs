import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-tools-creative-graphics-batch-4-policy-qa-review'
const expectedDecision = 'approved_with_warnings_for_ai_graphics_route_manifest_integration'
const allowedDecisions = new Set([
  expectedDecision,
  'approved_for_ai_graphics_route_manifest_integration_metadata_only',
  'blocked_pending_route_manifest_scope_fixes',
  'blocked_pending_tool_route_owner_review',
  'blocked_pending_worker_handoff_review',
  'blocked_pending_tracka_handoff_review',
])
const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-integration-approval.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-source-evidence-lockfile.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-eligibility-matrix.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-scoped-tool-call-manifest-shape.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-artifact-scope-policy.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-owner-handoff-contract.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-blocked-use-register.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-validation-plan.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-allowed-blocked-scope.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-approval-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-next-lane-recommendation.md',
  'docs/prompt-ai-tools-creative-graphics-route-manifest-integration-approval-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-route-manifest-integration-approval.md',
]
const sourceDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-policy-qa-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-route-manifest-readiness-qa.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-qa-decision.md',
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
  'PR #449',
  '0f8b658f28981088f5744b5ccf7991ba3deb7c62',
  'ai_graphics_batch_4_policy_qa_passed_with_warnings',
  'PR #164',
  '1553d50118919bf013d35bbc23a534af9d86c8ae',
  'approved plan snapshot',
  'scoped tool-call manifest',
  'private artifact',
  'fail_closed_return_blocked_reason_never_fallback_to_raw_execution',
  'AI_TOOLS_CREATIVE_GRAPHICS_ROUTE_MANIFEST_INTEGRATION_QA_REVIEW',
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]
const requiredTrueBooleans = [
  'futureRouteManifestMetadataIntegrationApproved',
  'futureScopedToolCallManifestApproved',
]
const requiredFalseBooleans = [
  'routeExecutionApprovedNow',
  'actualToolExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'renderExportApprovedNow',
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
const allowedEligibilityStates = new Set([
  'eligible_metadata_only',
  'eligible_manifest_only',
  'blocked_pending_runtime_review',
  'blocked_pending_owner_handoff',
])
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
  ['tool_execution_claim', /\bactual tool execution\b[^.\n]*(?:performed|executed|enabled|approved now|true|passed)\b/i],
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

for (const path of [...requiredDocs, ...sourceDocs]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = [...requiredDocs, ...sourceDocs]
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

const unsafeClaimText = docsText
  .split('\n')
  .filter(
    (line) =>
      !/\b(?:No|no|not|blocked|unapproved|does not approve|do not approve|remains|stays|false|future|metadata-only|manifest-only|policy context|context only|planning|handoff|separately gated|without|warning|warnings|defer|deferred|none)\b/i.test(
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
  if (
    !allowedDecisions.has(decision) &&
    !decision.startsWith('ai_graphics_batch_4_') &&
    !decision.startsWith('approved_with_warnings_for_ai_graphics_batch_4')
  ) {
    failures.push(`invalid_decision:${decision}`)
  }
}

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-approval-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-manifest-approval-decision.md', 'utf8')
  : ''
for (const field of requiredTrueBooleans) {
  if (!new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`true\`\\s*\\|`).test(decisionDoc)) {
    failures.push(`required_boolean_not_true:${field}`)
  }
}
for (const field of requiredFalseBooleans) {
  if (!new RegExp(`\\|\\s*${field}\\s*\\|\\s*\`false\`\\s*\\|`).test(decisionDoc)) {
    failures.push(`required_boolean_not_false:${field}`)
  }
}
for (const token of requiredTokens) {
  if (!docsText.includes(token)) failures.push(`required_token_missing:${token}`)
}

const matrix = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-eligibility-matrix.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-route-eligibility-matrix.md', 'utf8')
  : ''
for (const tool of requiredTools) {
  const row = matrix.split('\n').find((line) => line.includes(`\`${tool}\``))
  if (!row) failures.push(`route_matrix_tool_missing:${tool}`)
  else {
    const stateMatch = row.match(/`(eligible_metadata_only|eligible_manifest_only|blocked_pending_runtime_review|blocked_pending_owner_handoff)`/)
    if (!stateMatch || !allowedEligibilityStates.has(stateMatch[1])) failures.push(`route_matrix_invalid_state:${tool}`)
    for (const requiredPhrase of ['Batch', 'private']) {
      if (!row.includes(requiredPhrase)) failures.push(`route_matrix_row_missing_${requiredPhrase}:${tool}`)
    }
  }
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
  packageJson?.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:route-manifest-integration-approval:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-route-manifest-integration-approval-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:route-manifest-integration-approval:diagnostics')
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
  sourcePr: '#449',
  sourceHead: '0f8b658f28981088f5744b5ccf7991ba3deb7c62',
  acceptedToolCount: requiredTools.length,
  futureRouteManifestMetadataIntegrationApproved: true,
  futureScopedToolCallManifestApproved: true,
  routeExecutionApprovedNow: false,
  actualToolExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  browserRuntimeApprovedNow: false,
  webglRuntimeApprovedNow: false,
  canvasRuntimeApprovedNow: false,
  resvgRasterizationApprovedNow: false,
  remotionRenderExportApprovedNow: false,
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
