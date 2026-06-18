import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-qa-review'
const expectedDecision = 'worker_ai_graphics_metadata_job_payload_owner_review_after_dry_run_passed_with_warnings'
const allowedDecisions = new Set([
  'worker_ai_graphics_metadata_job_payload_owner_review_after_dry_run_passed_with_warnings',
  'worker_ai_graphics_metadata_job_payload_owner_review_after_dry_run_passed',
  'blocked_pending_worker_ai_graphics_owner_review_after_dry_run_fixes',
  'blocked_pending_worker_ai_graphics_dry_run_claim_review',
  'blocked_pending_worker_ai_graphics_worker_execution_scope_review',
  'blocked_pending_worker_ai_graphics_claim_lease_scope_review',
  'blocked_pending_worker_ai_graphics_queue_scope_review',
])

const requiredDocs = [
  'docs/worker-runtime/ai-graphics-metadata-job-payload-owner-review-after-dry-run.md',
  'docs/worker-runtime/ai-graphics-job-payload-owner-review-after-dry-run-source-lockfile.md',
  'docs/worker-runtime/ai-graphics-job-payload-owner-review-after-dry-run-matrix.md',
  'docs/worker-runtime/ai-graphics-job-payload-scoped-pass-claim-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-generic-claim-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-valid-dry-run-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-blocked-dry-run-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-invalid-dry-run-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-static-executor-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-plan-snapshot-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-scoped-manifest-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-private-artifact-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-claim-lease-owner-review-after-dry-run.md',
  'docs/worker-runtime/ai-graphics-job-payload-queue-owner-review-after-dry-run.md',
  'docs/worker-runtime/ai-graphics-job-payload-no-execution-owner-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-observability-audit-owner-review-after-dry-run.md',
  'docs/worker-runtime/ai-graphics-job-payload-fail-closed-owner-review-after-dry-run.md',
  'docs/worker-runtime/ai-graphics-job-payload-worker-intake-owner-review-after-dry-run.md',
  'docs/worker-runtime/ai-graphics-job-payload-owner-review-after-dry-run-blocked-use-register.md',
  'docs/worker-runtime/ai-graphics-job-payload-owner-review-after-dry-run-decision.md',
  'docs/worker-runtime/ai-graphics-job-payload-owner-review-after-dry-run-next-lane-recommendation.md',
  'docs/prompt-worker-ai-graphics-metadata-job-payload-owner-review-after-dry-run-results.md',
  'docs/implementation-prompts/prompt-worker-ai-graphics-metadata-job-payload-owner-review-after-dry-run.md',
]

const requiredScripts = [
  'scripts/validation/worker-ai-graphics-metadata-job-payload-owner-review-after-dry-run-diagnostics.mjs',
]

const sourceEvidenceDocs = [
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-qa-decision.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-qa-run-results.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-worker-intake-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-readiness-decision.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-run-results.md',
  'docs/worker-runtime/ai-graphics-job-payload-owner-approval-decision.md',
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
  'ownerReviewAfterDryRunAccepted',
  'ownerReviewAfterDryRunAcceptedWithWarnings',
  'workerAiGraphicsMetadataJobPayloadDryRunAccepted',
  'ownerApprovedFutureWorkerDryRunGateStatusPacket',
  'scopedPassClaimAccepted',
  'validDryRunCaseAccepted',
  'blockedDryRunCaseAccepted',
  'invalidDryRunCaseAccepted',
  'staticDryRunExecutorAccepted',
  'planSnapshotDryRunMappingAccepted',
  'scopedManifestDryRunMappingAccepted',
  'privateArtifactDryRunRefsAccepted',
  'claimLeaseDryRunPlaceholdersAccepted',
  'queueDryRunPlaceholdersAccepted',
  'noExecutionDryRunAssertionsAccepted',
  'observabilityAuditDryRunAccepted',
  'failClosedDryRunAccepted',
  'workerIntakeDryRunAccepted',
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

const requiredTokens = [
  'PR #503',
  'd189f8be0634eaff62baacb8e18c842f997fa3dd',
  'worker_ai_graphics_metadata_job_payload_dry_run_qa_passed_with_warnings',
  'PR #500',
  '3e4a4f6900a26c22972d8e0859f1f8c3391063c1',
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
  'PR #414',
  'PR #409',
  'PR #404',
  'PR #398',
  'PR #164',
  'dry_run_passed',
  'generated_local_fixture_passed',
  'WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_DRY_RUN_GATE_STATUS_PACKET',
  'no write',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'migration deployed: `no`',
  'milestone sync: `not_performed`',
]

const forbiddenFixturePatterns = [
  ['url', /\bhttps?:\/\//i],
  ['signed_url_marker', /\b(?:signedUrl|signed_url|X-Goog-Signature|X-Amz-Signature)\b/i],
  ['public_artifact_ref', /\bpublic[_ -]?artifact[_ -]?ref\b/i],
  ['raw_prompt_text', /\braw prompt text\b/i],
  ['provider_raw_output', /\bprovider raw output\b/i],
  ['real_user_data', /\breal user data\b/i],
  [
    'secret_material',
    /\b(sk-[A-Za-z0-9_-]{32,}|Bearer\s+[A-Za-z0-9._~+/-]{32,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|X-Goog-Signature=|X-Amz-Signature=)\b/i,
  ],
]

const forbiddenClaimPatterns = [
  ['snake_generic_pass_claim', /\bdry_run_passed\b/i],
  ['snake_generated_fixture_pass_claim', /\bgenerated_local_fixture_passed\b/i],
  ['worker_execution_claim', /\bworker execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['job_claim_claim', /\bjob claim\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['lease_mutation_claim', /\blease mutation\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['queue_execution_claim', /\bqueue execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['route_execution_claim', /\broute execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['tool_execution_claim', /\b(?:actual tool execution|tool execution)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['provider_runtime_claim', /\bprovider\/?model (?:calls?|runtime|execution)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['browser_webgl_canvas_claim', /\b(?:browser|WebGL|canvas) runtime\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['resvg_claim', /\bresvg rasterization\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['remotion_claim', /\bRemotion render\/export\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['supabase_claim', /\bSupabase (?:mutation|write|SQL)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['gcs_claim', /\b(?:GCS upload|storage transfer)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true)\b/i],
  ['signed_url_claim', /\bsigned URLs?\b[^.\n|]*(?:created|enabled|approved now|approved with|true)\b/i],
  ['public_artifact_claim', /\bpublic artifacts?\b[^.\n|]*(?:created|enabled|approved now|approved with|true)\b/i],
  ['raw_prompt_claim', /\braw prompt\b[^.\n|]*(?:executed|enabled|approved now|approved with|true)\b/i],
  ['beta_claim', /\b(?:internal beta|external beta)\b[^.\n|]*(?:unlocked|enabled|approved now|approved with|true)\b/i],
  ['production_claim', /\bproduction\b[^.\n|]*(?:unlocked|enabled|approved now|approved with|true)\b/i],
  ['secret_material', forbiddenFixturePatterns[6][1]],
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
  const text = read(path)
  try {
    return JSON.parse(text)
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return null
  }
}

for (const path of [...requiredDocs, ...requiredScripts, ...sourceEvidenceDocs]) read(path)

const docsText = requiredDocs.map(read).join('\n')
const allEvidenceText = `${docsText}\n${sourceEvidenceDocs.map(read).join('\n')}`
const decisionDoc = read('docs/worker-runtime/ai-graphics-job-payload-owner-review-after-dry-run-decision.md')
const matrixDoc = read('docs/worker-runtime/ai-graphics-job-payload-owner-review-after-dry-run-matrix.md')

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

for (const token of requiredTokens) {
  if (!allEvidenceText.includes(token)) failures.push(`required_token_missing:${token}`)
}

for (const tool of requiredTools) {
  const row = matrixDoc.split('\n').find((line) => line.includes(`\`${tool}\``))
  if (!row) failures.push(`owner_review_matrix_tool_missing:${tool}`)
  else {
    for (const requiredCell of [
      'workerAiGraphicsMetadataJobPayloadDryRunPassed',
      'generic claims rejected',
      '<APPROVED_PLAN_SNAPSHOT_FIXTURE>',
      '<SCOPED_TOOL_CALL_MANIFEST_REF>',
      '<PRIVATE_ARTIFACT_MANIFEST_REF>',
      '<CHECKSUM_REF>',
      'placeholder only; no job claim or lease mutation',
      'placeholder only; no queue execution',
      'accepted_with_warnings',
    ]) {
      if (!row.includes(requiredCell)) failures.push(`owner_review_matrix_tool_cell_missing:${tool}:${requiredCell}`)
    }
  }
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
      !/\b(?:No|no|not|blocked|unapproved|does not approve|do not approve|must not|may not|remains|remain|stays|false|metadata-only|static|separately gated|without|warning|warnings|defer|deferred|none|placeholder|required|source evidence|source chain|context only|policy context|not source of truth|pending|later|future|planning|accepted_with_warnings|blocked|fail closed|dry-run|local\/static|ignored|cleanup|docs_only|no write|passed_with_warnings|scoped|broad service-role|review-only|rejected|rejects|reject|Blocked snake-case tokens)\b/i.test(
        line,
      ),
  )
  .join('\n')

for (const [name, pattern] of forbiddenClaimPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

if (docsText.includes('/private/tmp/') || docsText.includes('/Volumes/backup/')) failures.push('absolute_local_artifact_path_claimed')

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['worker:ai-graphics-metadata-job-payload-owner-review-after-dry-run:diagnostics'] !==
  'node scripts/validation/worker-ai-graphics-metadata-job-payload-owner-review-after-dry-run-diagnostics.mjs'
) {
  failures.push('missing_package_script:worker:ai-graphics-metadata-job-payload-owner-review-after-dry-run:diagnostics')
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
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-owner-review-after-dry-run:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-gate-status:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-gate-status-qa:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-gate-status-owner-approval:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-runtime-gate:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-runtime-gate-qa:diagnostics'))
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-runtime-gate-owner-approval:diagnostics'))
if (unexpectedPackageJsonDiff.length > 0) failures.push(`unexpected_package_json_diff:${unexpectedPackageJsonDiff.join(' | ')}`)

if (git(['diff', '--name-only', `${baseRef}...HEAD`, '--', 'package-lock.json']).trim()) failures.push('package_lock_changed')
if (git(['diff', '--name-only', '--', 'package-lock.json']).trim()) failures.push('package_lock_changed_worktree')
if (git(['ls-files', '.local-artifacts']).trim()) failures.push('local_artifacts_tracked')

const changedFiles = [
  ...git(['diff', '--name-only', `${baseRef}...HEAD`]).split('\n').filter(Boolean),
  ...git(['diff', '--name-only']).split('\n').filter(Boolean),
  ...git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
]
for (const file of new Set(changedFiles)) {
  if (/\.local-artifacts\//.test(file)) failures.push(`local_artifact_changed:${file}`)
  if (/(^|\/)(dist|dist-server)\//.test(file)) failures.push(`build_output_changed:${file}`)
  if (/(^|\/)(media|render|browser|canvas|webgl|public-artifacts?|schema-validation-output|local-fixture-output|dry-run-output)\//i.test(file)) {
    failures.push(`forbidden_output_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|pdf)$/i.test(file)) failures.push(`generated_binary_output_changed:${file}`)
}

if (!docsText.includes('No worker execution, job claim, lease mutation, queue execution')) {
  failures.push('no_scope_statement_missing')
}

if (failures.length > 0) {
  console.error('WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_OWNER_REVIEW_AFTER_DRY_RUN diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_OWNER_REVIEW_AFTER_DRY_RUN diagnostics passed.')
