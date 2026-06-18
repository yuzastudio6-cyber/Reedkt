import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef =
  'origin/codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval'
const expectedDecision =
  'worker_ai_graphics_metadata_controlled_noop_worker_gate_approved_with_warnings'
const packageScriptName =
  'worker:ai-graphics-metadata-controlled-noop-worker-gate-approval:diagnostics'
const expectedScript =
  'node scripts/validation/worker-ai-graphics-metadata-controlled-noop-worker-gate-approval-diagnostics.mjs'

const allowedDecisions = new Set([
  expectedDecision,
  'worker_ai_graphics_metadata_controlled_noop_worker_gate_approved',
  'blocked_pending_worker_ai_graphics_controlled_noop_gate_source_fixes',
  'blocked_pending_worker_ai_graphics_controlled_noop_claim_lease_review',
  'blocked_pending_worker_ai_graphics_controlled_noop_queue_review',
  'blocked_pending_worker_ai_graphics_controlled_noop_runtime_boundary_review',
])

const requiredDocs = [
  'docs/worker-runtime/ai-graphics-metadata-controlled-noop-worker-gate-approval.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-source-lockfile.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-matrix.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-scoped-pass-claim-policy.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-generic-claim-rejection.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-noop-worker-boundary.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-job-claim-placeholder.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-lease-placeholder.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-queue-placeholder.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-route-tool-provider-boundary.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-supabase-storage-boundary.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-observability-audit.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-fail-closed.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-rollback-cleanup.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-blocked-use-register.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-decision.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-next-lane-recommendation.md',
  'docs/prompt-worker-ai-graphics-metadata-controlled-noop-worker-gate-approval-results.md',
  'docs/implementation-prompts/prompt-worker-ai-graphics-metadata-controlled-noop-worker-gate-approval.md',
]

const sourceEvidenceDocs = [
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-owner-approval-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-runtime-gate-qa-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-qa-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-runtime-gate-packet.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-gate-status-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-gate-status-owner-approval-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-qa-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-readiness-decision.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-readiness-decision.md',
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
  'controlledNoopWorkerGateApproved',
  'controlledNoopWorkerGateApprovedWithWarnings',
  'sourceRuntimeGateOwnerApprovalAccepted',
  'futureControlledNoopWorkerGateExecutionApproved',
  'futureNoopWorkerBoundaryValidationApproved',
  'futurePlaceholderJobPayloadIntakeApproved',
  'futureClaimPlaceholderVerificationApproved',
  'futureLeasePlaceholderVerificationApproved',
  'futureQueuePlaceholderVerificationApproved',
  'futureObservabilityAuditApproved',
  'futureFailClosedValidationApproved',
  'futureRollbackCleanupValidationApproved',
  'workerAiGraphicsMetadataJobPayloadDryRunPassed',
  'scopedPassClaimAccepted',
]

const requiredFalseBooleans = [
  'genericDryRunPassedClaimed',
  'genericDryRunPassedClaimAccepted',
  'dryRunPassedClaimed',
  'dryRunPassedClaimAccepted',
  'generatedLocalFixturePassedClaimed',
  'generatedLocalFixturePassedClaimAccepted',
  'readyForWorkerExecutionPlanning',
  'liveWorkerExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'realJobClaimApprovedNow',
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

const requiredTokens = [
  'PR #524',
  '4c99de74cefaa68c6ace853e22998a5fb8c1e6b4',
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_owner_approved_with_warnings',
  'PR #521',
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_qa_passed_with_warnings',
  'PR #517',
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_ready_with_warnings',
  'PR #515',
  'worker_ai_graphics_metadata_job_payload_dry_run_gate_status_owner_approved_with_warnings',
  'PR #511',
  'worker_ai_graphics_metadata_job_payload_dry_run_gate_status_qa_passed_with_warnings',
  'PR #509',
  'worker_ai_graphics_metadata_job_payload_dry_run_gate_status_ready_with_warnings',
  'PR #506',
  'worker_ai_graphics_metadata_job_payload_owner_review_after_dry_run_passed_with_warnings',
  'PR #503',
  'worker_ai_graphics_metadata_job_payload_dry_run_qa_passed_with_warnings',
  'PR #500',
  'worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings',
  'ai-graphics-job-payload-dry-run-local-static',
  'workerAiGraphicsMetadataJobPayloadDryRunPassed',
  'PR #498',
  'worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings',
  'PR #496',
  'worker_ai_graphics_metadata_job_payload_owner_approved_with_warnings',
  'PR #493',
  'worker_ai_graphics_metadata_job_payload_schema_validation_qa_passed_with_warnings',
  'PR #491',
  'worker_ai_graphics_metadata_job_payload_schema_validation_passed_with_warnings',
  'ai-graphics-job-payload-schema-validation-local-static',
  'PR #487',
  'PR #485',
  'PR #482',
  'PR #480',
  'PR #478',
  'PR #476',
  'PR #464',
  'ai-graphics-local-fixture-validation-local-static',
  'PR #414',
  'PR #409',
  'PR #404',
  'PR #398',
  'PR #164',
  'WORKER_AI_GRAPHICS_METADATA_CONTROLLED_NOOP_WORKER_GATE_EXECUTION',
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

const forbiddenLinePatterns = [
  ['snake_generic_pass_claim', /\bdry_run_passed\b/i],
  ['snake_generated_fixture_pass_claim', /\bgenerated_local_fixture_passed\b/i],
  ['internal_beta_readiness_claim', /\binternal beta readiness\b/i],
  ['route_execution_readiness_claim', /\broute execution readiness\b/i],
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

const negativeOrBlockedPattern =
  /\b(?:No|no|not|does not|must not|blocked|remain(?:s|ed)?|false|rejected|excluded|excludes|without|keeps|keep|fail closed|real URLs|true live runtime booleans|executable Worker)\b/i

const failures = []

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
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
  if (!content.includes(token)) {
    failures.push(`missing_token:${token}`)
  }
}

function requireBoolean(content, name, expected) {
  const pattern = new RegExp(
    '\\|\\s*' + name + '\\s*\\|\\s*`' + expected + '`\\s*\\|',
  )
  if (!pattern.test(content)) {
    failures.push(`missing_boolean:${name}:${expected}`)
  }
}

for (const path of [...requiredDocs, ...sourceEvidenceDocs]) {
  requireFile(path)
}

const docsContent = requiredDocs.map(requireFile).join('\n')
const decisionDoc = requireFile(
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-decision.md',
)
const matrixDoc = requireFile(
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-matrix.md',
)

if (!allowedDecisions.has(expectedDecision)) {
  failures.push(`expected_decision_not_allowlisted:${expectedDecision}`)
}
requireToken(docsContent, expectedDecision)
requireToken(docsContent, 'approved_with_warnings')

for (const token of requiredTokens) {
  requireToken(docsContent, token)
}

for (const tool of requiredTools) {
  requireToken(matrixDoc, `\`${tool}\``)
  requireToken(matrixDoc, '`approved_with_warnings`')
}

for (const name of requiredTrueBooleans) {
  requireBoolean(decisionDoc, name, 'true')
}

for (const name of requiredFalseBooleans) {
  requireBoolean(decisionDoc, name, 'false')
}

const noScopeStatement =
  'No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.'

const normalizedDocsContent = docsContent.replace(/\s+/g, ' ')
if (!normalizedDocsContent.includes(noScopeStatement)) {
  failures.push('missing_exact_no_scope_statement')
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.[packageScriptName] !== expectedScript) {
  failures.push(`missing_or_invalid_package_script:${packageScriptName}`)
}

const basePackageJson = JSON.parse(runGit(['show', `${baseRef}:package.json`]))
for (const section of [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]) {
  const current = JSON.stringify(packageJson[section] ?? {})
  const base = JSON.stringify(basePackageJson[section] ?? {})
  if (current !== base) {
    failures.push(`unexpected_package_dependency_section_diff:${section}`)
  }
}

if (runGit(['diff', '--name-only', `${baseRef}...HEAD`, '--', 'package-lock.json'])) {
  failures.push('unexpected_package_lock_diff')
}

const trackedLocalArtifacts = runGit(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) {
  failures.push(`tracked_local_artifacts:${trackedLocalArtifacts}`)
}

const trackedOutputs = runGit(['ls-files'])
  .split('\n')
  .filter(Boolean)
  .filter((path) =>
    /(^|\/)(dist|dist-server|coverage|playwright-report|test-results)(\/|$)|\.(mp4|mov|webm|png|jpg|jpeg|gif|svg)$/i.test(
      path,
    ),
  )
  .filter(
    (path) =>
      !path.startsWith('docs/') &&
      !path.startsWith('public/') &&
      !path.startsWith('attached_assets/'),
  )
if (trackedOutputs.length > 0) {
  failures.push(`tracked_generated_outputs:${trackedOutputs.join(',')}`)
}

for (const [label, pattern] of forbiddenLinePatterns) {
  for (const [index, paragraph] of docsContent.split(/\n\s*\n/).entries()) {
    if (!pattern.test(paragraph)) {
      continue
    }
    if (negativeOrBlockedPattern.test(paragraph)) {
      continue
    }
    failures.push(`unsafe_claim:${label}:paragraph_${index + 1}:${paragraph.trim()}`)
  }
}

if (!docsContent.includes('Supabase classification: `no write` / `docs_only`')) {
  failures.push('missing_supabase_docs_only_classification')
}

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: 'failed',
        decision: expectedDecision,
        failures,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

console.log('WORKER_AI_GRAPHICS_METADATA_CONTROLLED_NOOP_WORKER_GATE_APPROVAL diagnostics passed.')
