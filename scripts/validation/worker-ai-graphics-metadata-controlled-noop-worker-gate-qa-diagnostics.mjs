import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-worker-ai-graphics-metadata-controlled-noop-worker-gate-execution'
const decision = 'worker_ai_graphics_metadata_controlled_noop_worker_gate_qa_passed_with_warnings'
const packageScriptName = 'worker:ai-graphics-metadata-controlled-noop-worker-gate-qa:diagnostics'
const expectedScript =
  'node scripts/validation/worker-ai-graphics-metadata-controlled-noop-worker-gate-qa-diagnostics.mjs'

const allowedDecisions = new Set([
  decision,
  'worker_ai_graphics_metadata_controlled_noop_worker_gate_qa_passed',
  'blocked_pending_worker_ai_graphics_controlled_noop_qa_fixes',
  'blocked_pending_worker_ai_graphics_controlled_noop_boundary_qa',
  'blocked_pending_worker_ai_graphics_controlled_noop_artifact_scope_qa',
])

const requiredDocs = [
  'docs/worker-runtime/ai-graphics-metadata-controlled-noop-worker-gate-qa-review.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-qa-source-lockfile.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-qa-run-results.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-scoped-pass-claim-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-generic-claim-rejection-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-job-payload-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-worker-runtime-boundary-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-no-real-job-claim-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-no-lease-mutation-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-no-queue-execution-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-route-tool-boundary-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-provider-boundary-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-supabase-storage-boundary-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-plan-snapshot-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-scoped-manifest-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-private-artifact-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-worker-intake-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-observability-audit-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-fail-closed-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-cleanup-qa.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-warning-blocker-register.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-qa-decision.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-qa-next-lane-recommendation.md',
  'docs/prompt-worker-ai-graphics-metadata-controlled-noop-worker-gate-qa-review-results.md',
  'docs/implementation-prompts/prompt-worker-ai-graphics-metadata-controlled-noop-worker-gate-qa-review.md',
]

const tools = [
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
  'PR #528',
  '183f94c2c2ddb4fb92d1e9e0fa787a6f0769bfdd',
  'worker_ai_graphics_metadata_controlled_noop_worker_gate_passed_with_warnings',
  'ai-graphics-controlled-noop-worker-gate-local-static',
  'PR #526',
  '44f5e959dee353da62f1172395f0eea292f2938c',
  'worker_ai_graphics_metadata_controlled_noop_worker_gate_approved_with_warnings',
  'PR #524',
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_owner_approved_with_warnings',
  'PR #521',
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_qa_passed_with_warnings',
  'PR #517',
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_ready_with_warnings',
  'PR #500',
  'worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings',
  'ai-graphics-job-payload-dry-run-local-static',
  'PR #491',
  'worker_ai_graphics_metadata_job_payload_schema_validation_passed_with_warnings',
  'ai-graphics-job-payload-schema-validation-local-static',
  'workerAiGraphicsMetadataControlledNoopPassed',
  'workerAiGraphicsMetadataJobPayloadDryRunPassed',
  'WORKER_AI_GRAPHICS_METADATA_CONTROLLED_NOOP_WORKER_GATE_OWNER_REVIEW',
  'no write',
  'docs_only',
  'environment touched:',
  'SQL executed:',
  'migration deployed:',
  'milestone sync:',
  '`none`',
  '`no`',
  '`not_performed`',
]

const requiredTrueBooleans = [
  'controlledNoopWorkerGateQaAccepted',
  'controlledNoopWorkerGateQaAcceptedWithWarnings',
  'controlledNoopWorkerGateExecutionAccepted',
  'workerAiGraphicsMetadataControlledNoopPassed',
  'workerAiGraphicsMetadataJobPayloadDryRunPassed',
  'readyForControlledNoopWorkerGateOwnerReview',
  'scopedPassClaimAccepted',
  'noRealJobClaimAccepted',
  'noLeaseMutationAccepted',
  'noQueueExecutionAccepted',
  'noRouteExecutionAccepted',
  'noActualToolExecutionAccepted',
  'noProviderRuntimeAccepted',
  'noSupabaseMutationAccepted',
  'noGcsUploadAccepted',
  'noSignedUrlAccepted',
  'noPublicArtifactAccepted',
  'planSnapshotPlaceholderAccepted',
  'scopedManifestPlaceholderAccepted',
  'privateArtifactPlaceholderAccepted',
  'workerIntakeCoverageAccepted',
  'observabilityAuditPlaceholderAccepted',
  'failClosedMetadataAccepted',
]

const requiredFalseBooleans = [
  'readyForWorkerExecutionPlanning',
  'genericDryRunPassedClaimed',
  'genericDryRunPassedClaimAccepted',
  'dryRunPassedClaimed',
  'dryRunPassedClaimAccepted',
  'generatedLocalFixturePassedClaimed',
  'generatedLocalFixturePassedClaimAccepted',
  'liveWorkerExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerJobClaimApprovedNow',
  'workerLeaseMutationApprovedNow',
  'queueExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'actualToolExecutionApprovedNow',
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
  ['snake_generic_pass_claim', /\bdry_run_passed\b/i],
  ['snake_generated_fixture_pass_claim', /\bgenerated_local_fixture_passed\b/i],
  ['internal_beta_readiness_claim', /\binternal beta readiness\b/i],
  ['live_worker_execution_claim', /\blive worker execution\b/i],
  ['real_job_claim_claim', /\breal job claim\b/i],
  ['lease_mutation_claim', /\blease mutation\b/i],
  ['queue_execution_claim', /\bqueue execution\b/i],
  ['route_execution_claim', /\broute execution\b/i],
  ['tool_execution_claim', /\b(?:actual tool execution|tool execution)\b/i],
  ['provider_runtime_claim', /\bprovider\/?model (?:calls?|runtime|execution)\b/i],
  ['browser_runtime_claim', /\bbrowser\/?WebGL\/?canvas runtime\b|\bbrowser runtime\b|\bWebGL runtime\b|\bcanvas runtime\b/i],
  ['resvg_claim', /\bresvg rasterization\b/i],
  ['remotion_claim', /\bRemotion render\/export\b/i],
  ['supabase_claim', /\bSupabase (?:mutation|write|SQL)\b/i],
  ['gcs_claim', /\b(?:GCS upload|storage transfer)\b/i],
  ['signed_url_claim', /\bsigned URL/i],
  ['public_artifact_claim', /\bpublic artifact/i],
  ['raw_prompt_claim', /\braw prompt execution\b/i],
  ['beta_claim', /\b(?:internal beta|external beta|beta\/production unlock)\b/i],
  ['production_claim', /\bproduction (?:unlock|readiness|approval)\b/i],
  ['service_role_claim', /\bbroad service-role handler\b/i],
]

const negativePattern =
  /\b(?:No|no|not|does not|must not|blocked|remain(?:s|ed)?|false|rejected|excluded|excludes|without|keeps|keep|fail closed|never|only)\b/i

const failures = []

function sh(args) {
  return execFileSync(args[0], args.slice(1), {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function read(path) {
  return readFileSync(path, 'utf8')
}

function requireFile(path) {
  if (!existsSync(path)) {
    failures.push(`missing_required_file:${path}`)
    return ''
  }
  return read(path)
}

function requireToken(content, token) {
  if (!content.includes(token)) failures.push(`missing_token:${token}`)
}

function requireBoolean(content, name, expected) {
  const pattern = new RegExp('\\|\\s*' + name + '\\s*\\|\\s*`' + expected + '`\\s*\\|')
  if (!pattern.test(content)) failures.push(`missing_boolean:${name}:${expected}`)
}

const docsContent = requiredDocs.map(requireFile).join('\n')
const decisionDoc = requireFile('docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-qa-decision.md')

requireFile('scripts/validation/worker-ai-graphics-metadata-controlled-noop-worker-gate-qa-diagnostics.mjs')
requireToken(docsContent, decision)
for (const token of requiredTokens) requireToken(docsContent, token)
for (const tool of tools) requireToken(docsContent, `\`${tool}\``)
for (const bool of requiredTrueBooleans) requireBoolean(decisionDoc, bool, 'true')
for (const bool of requiredFalseBooleans) requireBoolean(decisionDoc, bool, 'false')

const decisionMatch = decisionDoc.match(/Decision:\s*`([^`]+)`/)
if (!decisionMatch) failures.push('missing_decision_state')
else if (!allowedDecisions.has(decisionMatch[1])) failures.push(`unsupported_decision_state:${decisionMatch[1]}`)

const noScope =
  'No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.'
if (!docsContent.replace(/\s+/g, ' ').includes(noScope)) failures.push('missing_exact_no_scope_statement')

for (const [label, pattern] of forbiddenPatterns) {
  for (const [index, paragraph] of docsContent.split(/\n\s*\n/).entries()) {
    if (!pattern.test(paragraph)) continue
    if (negativePattern.test(paragraph)) continue
    failures.push(`unsafe_claim:${label}:paragraph_${index + 1}:${paragraph.trim()}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.[packageScriptName] !== expectedScript) {
  failures.push(`missing_or_invalid_package_script:${packageScriptName}`)
}

const basePackageJson = JSON.parse(sh(['git', 'show', `${baseRef}:package.json`]))
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(packageJson[section] ?? {}) !== JSON.stringify(basePackageJson[section] ?? {})) {
    failures.push(`unexpected_package_dependency_section_diff:${section}`)
  }
}

const packageDiff = sh(['git', 'diff', '--', 'package.json'])
  .split('\n')
  .filter((line) => /^[+-]\s{4}"/.test(line))
  .filter((line) => !line.includes(packageScriptName))
if (packageDiff.length > 0) failures.push(`unexpected_package_json_diff:${packageDiff.join(' | ')}`)

if (sh(['git', 'diff', '--name-only', `${baseRef}...HEAD`, '--', 'package-lock.json'])) {
  failures.push('unexpected_package_lock_diff')
}

const trackedLocalArtifacts = sh(['git', 'ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`tracked_local_artifacts:${trackedLocalArtifacts}`)

const trackedOutputs = sh(['git', 'diff', '--name-only', `${baseRef}...HEAD`])
  .split('\n')
  .filter(Boolean)
  .filter((file) =>
    /(^|\/)(dist|dist-server|coverage|playwright-report|test-results)(\/|$)|\.(mp4|mov|webm|png|jpg|jpeg|gif)$/i.test(
      file,
    ),
  )
if (trackedOutputs.length > 0) failures.push(`tracked_generated_outputs:${trackedOutputs.join(',')}`)

if (!docsContent.includes('Supabase classification: `no write` / `docs_only`')) {
  failures.push('missing_supabase_docs_only_classification')
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: 'failed', decision, failures }, null, 2))
  process.exit(1)
}

console.log('WORKER_AI_GRAPHICS_METADATA_CONTROLLED_NOOP_WORKER_GATE_QA diagnostics passed.')
