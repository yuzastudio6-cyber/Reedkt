import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-qa-review'
const expectedDecision =
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_owner_approved_with_warnings'
const expectedScript =
  'node scripts/validation/worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval-diagnostics.mjs'
const packageScriptName =
  'worker:ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval:diagnostics'

const allowedDecisions = new Set([
  expectedDecision,
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_owner_approved',
  'blocked_pending_worker_ai_graphics_runtime_gate_owner_fixes',
  'blocked_pending_worker_ai_graphics_claim_lease_runtime_owner_review',
  'blocked_pending_worker_ai_graphics_queue_runtime_owner_review',
  'blocked_pending_worker_ai_graphics_supabase_storage_owner_review',
  'blocked_pending_worker_ai_graphics_observability_owner_review',
])

const requiredDocs = [
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-owner-approval-source-lockfile.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-owner-approval-matrix.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-scope-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-controlled-noop-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-scoped-pass-claim-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-generic-claim-rejection-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-preconditions-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-worker-intake-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-plan-snapshot-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-scoped-manifest-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-private-artifact-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-claim-lease-boundary-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-queue-boundary-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-route-tool-boundary-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-provider-boundary-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-supabase-storage-boundary-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-observability-audit-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-fail-closed-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-rollback-cleanup-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-owner-approval-blocked-use-register.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-owner-approval-decision.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-owner-approval-next-lane-recommendation.md',
  'docs/prompt-worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval-results.md',
  'docs/implementation-prompts/prompt-worker-ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval.md',
]

const sourceEvidenceDocs = [
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-runtime-gate-qa-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-qa-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-runtime-gate-packet.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-gate-status-owner-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-gate-status-owner-approval-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-gate-status-qa-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-gate-status-qa-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-gate-status-packet.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-gate-status-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-owner-review-after-dry-run.md',
  'docs/worker-runtime/ai-graphics-job-payload-owner-review-after-dry-run-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-job-payload-dry-run-qa-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-qa-decision.md',
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
  'runtimeGateOwnerApproved',
  'runtimeGateOwnerApprovedWithWarnings',
  'ownerApprovedRuntimeGateQaAccepted',
  'ownerApprovedFutureControlledNoopWorkerGateApprovalPacket',
  'readyForControlledNoopWorkerGateApproval',
  'workerAiGraphicsMetadataJobPayloadDryRunPassed',
  'scopedPassClaimAccepted',
  'runtimeGateScopeOwnerApproved',
  'controlledNoopOwnerApproved',
  'preconditionsOwnerApproved',
  'workerIntakeOwnerApproved',
  'planSnapshotOwnerApproved',
  'scopedManifestOwnerApproved',
  'privateArtifactOwnerApproved',
  'claimLeaseBoundaryOwnerApproved',
  'queueBoundaryOwnerApproved',
  'routeToolBoundaryOwnerApproved',
  'providerBoundaryOwnerApproved',
  'supabaseStorageBoundaryOwnerApproved',
  'observabilityAuditOwnerApproved',
  'failClosedOwnerApproved',
  'rollbackCleanupOwnerApproved',
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
  'PR #521',
  'f70c43379eaa2981922e7e8a2dcba391cd8f5f05',
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_qa_passed_with_warnings',
  'PR #517',
  'fa7f3d13bba56f18267c7e1e894984da2eba9322',
  'worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_ready_with_warnings',
  'PR #515',
  '37e6b724517d1ed61ed79cc5a8034cc04da3a4a3',
  'worker_ai_graphics_metadata_job_payload_dry_run_gate_status_owner_approved_with_warnings',
  'PR #511',
  '02e3de73fa86ec3f7b713e539bc79797c4a44f6a',
  'worker_ai_graphics_metadata_job_payload_dry_run_gate_status_qa_passed_with_warnings',
  'PR #509',
  '06acd79d71f2bebb4648dfe6c5bb55d66a27bbb5',
  'worker_ai_graphics_metadata_job_payload_dry_run_gate_status_ready_with_warnings',
  'PR #506',
  '915ac654e612eec120e7397373478c84aea42b9f',
  'worker_ai_graphics_metadata_job_payload_owner_review_after_dry_run_passed_with_warnings',
  'PR #503',
  'd189f8be0634eaff62baacb8e18c842f997fa3dd',
  'worker_ai_graphics_metadata_job_payload_dry_run_qa_passed_with_warnings',
  'PR #500',
  '3e4a4f6900a26c22972d8e0859f1f8c3391063c1',
  'worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings',
  'ai-graphics-job-payload-dry-run-local-static',
  'workerAiGraphicsMetadataJobPayloadDryRunPassed',
  'PR #498',
  '23017a7f35a088de2fc77fd0c1427378fd7aa373',
  'worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings',
  'PR #496',
  'ce204a63fc08412af212609eecf0c8201ae88794',
  'worker_ai_graphics_metadata_job_payload_owner_approved_with_warnings',
  'PR #493',
  '58f4e7839057d8c9e54d52c81f0e791e40e2574c',
  'worker_ai_graphics_metadata_job_payload_schema_validation_qa_passed_with_warnings',
  'PR #491',
  '1bd6ed2a4d276066d0ca134ce674358e18f64b7a',
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
  'WORKER_AI_GRAPHICS_METADATA_CONTROLLED_NOOP_WORKER_GATE_APPROVAL',
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

const forbiddenClaimPatterns = [
  ['snake_generic_pass_claim', /\bdry_run_passed\b/i],
  ['snake_generated_fixture_pass_claim', /\bgenerated_local_fixture_passed\b/i],
  ['internal_beta_readiness_claim', /\binternal beta readiness\b/i],
  ['route_execution_readiness_claim', /\broute execution readiness\b/i],
  [
    'worker_execution_claim',
    /\b(?:live )?worker execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'job_claim_claim',
    /\b(?:real )?job claim\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'lease_mutation_claim',
    /\blease mutation\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'queue_execution_claim',
    /\bqueue execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'route_execution_claim',
    /\broute execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'tool_execution_claim',
    /\b(?:actual tool execution|tool execution)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'provider_runtime_claim',
    /\bprovider\/?model (?:calls?|runtime|execution)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'browser_webgl_canvas_claim',
    /\b(?:browser|WebGL|canvas) runtime\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'resvg_claim',
    /\bresvg rasterization\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'remotion_claim',
    /\bRemotion render\/export\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'supabase_claim',
    /\bSupabase (?:mutation|write|SQL)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'gcs_claim',
    /\b(?:GCS upload|storage transfer)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'signed_url_claim',
    /\bsigned URL(?: creation)?\b[^.\n|]*(?:performed|created|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'public_artifact_claim',
    /\bpublic artifact(?: creation)?\b[^.\n|]*(?:performed|created|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  [
    'beta_production_claim',
    /\b(?:internal beta|external beta|production|beta\/production) unlock\b[^.\n|]*(?:performed|enabled|approved now|approved with|ready|true|passed)\b/i,
  ],
  ['broad_service_role_claim', /\bbroad service-role handler\b[^.\n|]*(?:enabled|approved|ready|true|passed)\b/i],
]

const fail = (message) => {
  console.error(`WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_DRY_RUN_RUNTIME_GATE_OWNER_APPROVAL diagnostics failed: ${message}`)
  process.exit(1)
}

const read = (file) => {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
  return readFileSync(file, 'utf8')
}

const sh = (args) =>
  execFileSync(args[0], args.slice(1), {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  }).trim()

for (const file of requiredDocs) read(file)
for (const file of sourceEvidenceDocs) read(file)

const combined = requiredDocs.map((file) => read(file)).join('\n')
const decisionDoc = read('docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-owner-approval-decision.md')
const matrixDoc = read('docs/worker-runtime/ai-graphics-job-payload-dry-run-runtime-gate-owner-approval-matrix.md')

const decisionMatch = combined.match(/Decision:\s*`([^`]+)`/)
if (!decisionMatch) fail('missing decision field')
if (!allowedDecisions.has(decisionMatch[1])) fail(`unsupported decision state: ${decisionMatch[1]}`)
if (decisionMatch[1] !== expectedDecision) fail(`expected decision ${expectedDecision}, found ${decisionMatch[1]}`)

for (const token of requiredTokens) {
  if (!combined.includes(token)) fail(`missing required source/decision token: ${token}`)
}

for (const tool of requiredTools) {
  if (!matrixDoc.includes(`\`${tool}\``)) fail(`missing tool in owner matrix: ${tool}`)
}

for (const field of requiredTrueBooleans) {
  const pattern = new RegExp(`\\| ${field} \\| \`true\` \\|`)
  if (!pattern.test(decisionDoc)) fail(`missing true boolean: ${field}`)
}

for (const field of requiredFalseBooleans) {
  const pattern = new RegExp(`\\| ${field} \\| \`false\` \\|`)
  if (!pattern.test(decisionDoc)) fail(`missing false boolean: ${field}`)
}

const isSafeNegativeLine = (line) =>
  /\b(no|not|blocked|remain[s]? blocked|keeps? .* blocked|does not|must not|cannot|rejected|false)\b/i.test(
    line,
  ) || line.trim() === 'unlock, or broad service-role handler was enabled.'

for (const [name, pattern] of forbiddenClaimPatterns) {
  const offendingLine = combined
    .split('\n')
    .find((line) => pattern.test(line) && !isSafeNegativeLine(line))
  if (offendingLine) fail(`${name}: ${offendingLine.trim()}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.[packageScriptName] !== expectedScript) {
  fail(`missing or incorrect package script: ${packageScriptName}`)
}

const packageDiff = sh(['git', 'diff', '--', 'package.json'])
  .split('\n')
  .filter((line) => /^[+-]\s{4}"/.test(line))
  .filter((line) => !line.includes(packageScriptName))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-controlled-noop-worker-gate-approval:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-controlled-noop-worker-gate:execute'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-controlled-noop-worker-gate:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-controlled-noop-worker-gate-qa:diagnostics'))
if (packageDiff.length > 0) fail(`unexpected package.json dependency/script drift: ${packageDiff.join(' | ')}`)

if (sh(['git', 'diff', '--name-only', '--', 'package-lock.json'])) fail('package-lock.json changed')

const changedFiles = sh(['git', 'diff', '--name-only'])
  .split('\n')
  .filter(Boolean)
const forbiddenChangedFile = changedFiles.find((file) =>
  /(^\.local-artifacts\/|^dist\/|^dist-server\/|^public\/|^media\/|render|browser|canvas|webgl|signed-url|\.png$|\.jpg$|\.jpeg$|\.webp$|\.gif$|\.mp4$|\.mov$|\.webm$|\.wav$|\.mp3$)/i.test(file),
)
if (forbiddenChangedFile) fail(`forbidden generated/output file changed: ${forbiddenChangedFile}`)

const trackedLocalArtifacts = sh(['git', 'ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`.local-artifacts is tracked: ${trackedLocalArtifacts}`)

console.log('WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_DRY_RUN_RUNTIME_GATE_OWNER_APPROVAL diagnostics passed.')
