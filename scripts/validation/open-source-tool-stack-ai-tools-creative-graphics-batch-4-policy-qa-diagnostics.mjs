import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-tools-creative-graphics-batch-4-approval-packet'
const expectedDecision = 'ai_graphics_batch_4_policy_qa_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'blocked_pending_resvg_policy_fixes',
  'blocked_pending_tracka_handoff_fixes',
  'blocked_pending_route_manifest_readiness_fixes',
  'blocked_pending_ai_graphics_batch_4_policy_qa_fixes',
])
const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-policy-qa-review.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-policy-acceptance-matrix.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-resvg-policy-qa.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-svg-raster-fallback-qa.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-remotion-tracka-handoff-qa.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-route-manifest-readiness-qa.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-warning-blocker-register.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-next-lane-recommendation.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-qa-decision.md',
  'docs/prompt-ai-tools-creative-graphics-batch-4-policy-qa-review-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-batch-4-policy-qa-review.md',
]
const sourceDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-approval-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-resvg-policy.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-svg-raster-fallback-policy.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-remotion-tracka-handoff-policy.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-route-manifest-readiness-plan.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-5-recommendation.md',
]
const acceptanceAreas = [
  '@resvg/resvg-js',
  'SVG raster fallback',
  'Remotion / Track A',
  'Route-manifest readiness plan',
  'Batch 5 recommendation',
]
const allowedFutureScriptDiffs = [
  'worker:ai-graphics-metadata-job-payload-shape-approval:diagnostics',
  'worker:ai-graphics-metadata-job-payload-shape-qa:diagnostics',
  'worker:ai-graphics-metadata-job-payload-schema-validation-approval:diagnostics',
  'worker:ai-graphics-metadata-job-payload-schema-validation:execute',
  'worker:ai-graphics-metadata-job-payload-schema-validation:diagnostics',
  'worker:ai-graphics-metadata-job-payload-schema-validation-qa:diagnostics',
  'worker:ai-graphics-metadata-job-payload-owner-approval:diagnostics',
  'worker:ai-graphics-metadata-job-payload-dry-run-approval:diagnostics',
  'worker:ai-graphics-metadata-job-payload-dry-run:execute',
  'worker:ai-graphics-metadata-job-payload-dry-run:diagnostics',
  'worker:ai-graphics-metadata-handoff-qa:diagnostics',
  'worker:ai-graphics-metadata-handoff-approval:diagnostics',
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
const requiredTokens = [
  'PR #446',
  '80d7ed52502a808cb0c27ae6d55a6667dd6ee5a4',
  'approved_with_warnings_for_ai_graphics_batch_4_policy_and_handoff_review',
  'AI_TOOLS_CREATIVE_GRAPHICS_ROUTE_MANIFEST_INTEGRATION_APPROVAL_PACKET',
  '@resvg/resvg-js',
  'SVG raster fallback',
  'Remotion / Track A',
  'route-manifest readiness',
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]
const requiredTrueBooleans = [
  'batch4PolicyAccepted',
  'batch4PolicyAcceptedWithWarnings',
  'readyForResvgLinuxImportProofApproval',
  'readyForRouteManifestIntegrationApproval',
  'readyForTrackAHandoffReview',
]
const requiredFalseBooleans = [
  'futureDependencyInstallApproved',
  'packageLockMutationApproved',
  'futureImportSmokeApproved',
  'futureSyntheticFixtureApproved',
  'futureResvgLinuxImportProofApproved',
  'futureResvgRasterizationApproved',
  'futureRemotionRenderExportApproved',
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
      !/\b(?:No|no|not|blocked|unapproved|does not approve|do not approve|remains|stays|false|future-only|policy only|planning-only|handoff-only|separately gated|without|warning|warnings|defer|deferred|none)\b/i.test(
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
    !decision.startsWith('approved_with_warnings_for_ai_graphics_batch_4') &&
    !decision.startsWith('ai_graphics_batch_3_')
  ) {
    failures.push(`invalid_decision:${decision}`)
  }
}

const decisionDoc = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-qa-decision.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-qa-decision.md', 'utf8')
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

const acceptanceMatrix = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-policy-acceptance-matrix.md')
  ? readFileSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-4-policy-acceptance-matrix.md', 'utf8')
  : ''
for (const area of acceptanceAreas) {
  const row = acceptanceMatrix.split('\n').find((line) => line.includes(area))
  if (!row) failures.push(`acceptance_row_missing:${area}`)
  else if (!row.includes('`accepted_with_warnings`')) failures.push(`acceptance_not_with_warnings:${area}`)
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
  packageJson?.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:batch-4-policy-qa:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-batch-4-policy-qa-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:batch-4-policy-qa:diagnostics')
}
const packageJsonDiff = `${git(['diff', '--', 'package.json'])}\n${git(['diff', '--cached', '--', 'package.json'])}`
const unexpectedPackageJsonDiff = packageJsonDiff
  .split('\n')
  .filter((line) => /^[+-]\s*"/.test(line))
  .filter((line) => !allowedFutureScriptDiffs.some((scriptName) => line.includes(scriptName)))
if (unexpectedPackageJsonDiff.length > 0) failures.push(`unexpected_package_json_diff:${unexpectedPackageJsonDiff.join(' | ')}`)
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
  sourcePr: '#446',
  sourceHead: '80d7ed52502a808cb0c27ae6d55a6667dd6ee5a4',
  policyAreasReviewed: acceptanceAreas,
  batch4PolicyAccepted: true,
  batch4PolicyAcceptedWithWarnings: true,
  readyForResvgLinuxImportProofApproval: true,
  readyForRouteManifestIntegrationApproval: true,
  readyForTrackAHandoffReview: true,
  futureDependencyInstallApproved: false,
  packageLockMutationApproved: false,
  futureImportSmokeApproved: false,
  futureSyntheticFixtureApproved: false,
  futureResvgLinuxImportProofApproved: false,
  futureResvgRasterizationApproved: false,
  futureRemotionRenderExportApproved: false,
  batch4ExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  actualToolExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
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
