import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-worker-ai-graphics-metadata-job-payload-schema-validation-execution'
const expectedDecision = 'worker_ai_graphics_metadata_job_payload_schema_validation_qa_passed_with_warnings'
const allowedDecisions = new Set([
  'worker_ai_graphics_metadata_job_payload_schema_validation_qa_passed_with_warnings',
  'worker_ai_graphics_metadata_job_payload_schema_validation_qa_passed',
  'blocked_pending_worker_ai_graphics_schema_validation_qa_fixes',
  'blocked_pending_worker_ai_graphics_schema_fixture_safety_qa',
  'blocked_pending_worker_ai_graphics_artifact_schema_validation_qa',
])

const requiredDocs = [
  'docs/worker-runtime/ai-graphics-metadata-job-payload-schema-validation-qa-review.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-qa-source-lockfile.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-qa-run-results.md',
  'docs/worker-runtime/ai-graphics-job-payload-valid-schema-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-blocked-schema-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-invalid-schema-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-plan-snapshot-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-scoped-manifest-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-private-artifact-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-claim-lease-placeholder-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-queue-placeholder-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-no-execution-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-observability-audit-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-fail-closed-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-worker-intake-validation-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-cleanup-qa.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-warning-blocker-register.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-qa-decision.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-qa-next-lane-recommendation.md',
  'docs/prompt-worker-ai-graphics-metadata-job-payload-schema-validation-qa-review-results.md',
  'docs/implementation-prompts/prompt-worker-ai-graphics-metadata-job-payload-schema-validation-qa-review.md',
]

const requiredScripts = [
  'scripts/validation/worker-ai-graphics-metadata-job-payload-schema-validation-qa-diagnostics.mjs',
]

const jsonFixtures = [
  'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-shape.schema.json',
  'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.valid.json',
  'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.blocked.json',
  'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.invalid.json',
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
  'schemaValidationQaAccepted',
  'schemaValidationQaAcceptedWithWarnings',
  'readyForWorkerJobPayloadOwnerApproval',
  'schemaValidationExecutionAccepted',
  'schemaValidationPassed',
  'validSchemaValidationAccepted',
  'blockedSchemaValidationAccepted',
  'invalidSchemaValidationAccepted',
  'planSnapshotValidationAccepted',
  'scopedManifestValidationAccepted',
  'privateArtifactValidationAccepted',
  'claimLeasePlaceholderValidationAccepted',
  'queuePlaceholderValidationAccepted',
  'noExecutionValidationAccepted',
  'observabilityAuditValidationAccepted',
  'failClosedValidationAccepted',
  'workerIntakeValidationAccepted',
  'cleanupQaAccepted',
]

const requiredFalseBooleans = [
  'readyForWorkerExecutionPlanning',
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
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
]

const requiredTokens = [
  'PR #491',
  '1bd6ed2a4d276066d0ca134ce674358e18f64b7a',
  'worker_ai_graphics_metadata_job_payload_schema_validation_passed_with_warnings',
  'ai-graphics-job-payload-schema-validation-local-static',
  'PR #487',
  '0dbb1b3617af9d33bd066cdef2ad385376c383a6',
  'worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings',
  'PR #485',
  'worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings',
  'PR #482',
  'worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings',
  'PR #480',
  'worker_ai_graphics_metadata_handoff_qa_passed_with_warnings',
  'PR #478',
  'PR #476',
  'tool_route_ai_graphics_metadata_local_fixture_gate_status_owner_approved_with_warnings',
  'PR #473',
  'tool_route_ai_graphics_metadata_local_fixture_gate_status_qa_passed_with_warnings',
  'PR #471',
  'dryRunPassedClaimed=false',
  'generatedLocalFixturePassedClaimed=false',
  'PR #464',
  'tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings',
  'ai-graphics-local-fixture-validation-local-static',
  'PR #414',
  'PR #409',
  'PR #404',
  'PR #398',
  'PR #164',
  'WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_OWNER_APPROVAL',
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
  ['snake_dry_run_pass_claim', /\bdry_run_passed\b/i],
  ['snake_generated_fixture_pass_claim', /\bgenerated_local_fixture_passed\b/i],
  ['worker_execution_claim', /\bworker execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['job_claim_claim', /\bjob claim\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['lease_mutation_claim', /\blease mutation\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['queue_execution_claim', /\bqueue execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['route_execution_claim', /\broute execution\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['tool_execution_claim', /\b(?:actual tool execution|tool execution)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['provider_runtime_claim', /\bprovider\/?model (?:calls?|runtime|execution)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['browser_webgl_canvas_claim', /\b(?:browser|WebGL|canvas) runtime\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['resvg_claim', /\bresvg rasterization\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['remotion_claim', /\bRemotion render\/export\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['supabase_claim', /\bSupabase (?:mutation|write|SQL)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['gcs_claim', /\b(?:GCS upload|storage transfer)\b[^.\n|]*(?:performed|executed|enabled|approved now|approved with|true|passed)\b/i],
  ['signed_url_claim', /\bsigned URLs?\b[^.\n|]*(?:created|enabled|approved now|approved with|true|passed)\b/i],
  ['public_artifact_claim', /\bpublic artifacts?\b[^.\n|]*(?:created|enabled|approved now|approved with|true|passed)\b/i],
  ['raw_prompt_claim', /\braw prompt\b[^.\n|]*(?:executed|enabled|approved now|approved with|true|passed)\b/i],
  ['beta_claim', /\b(?:internal beta|external beta)\b[^.\n|]*(?:unlocked|enabled|approved now|approved with|true|passed)\b/i],
  ['production_claim', /\bproduction\b[^.\n|]*(?:unlocked|enabled|approved now|approved with|true|passed)\b/i],
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

for (const path of [...requiredDocs, ...requiredScripts]) read(path)
for (const path of jsonFixtures) readJson(path)

const docsText = requiredDocs.map(read).join('\n')
const decisionDoc = read('docs/worker-runtime/ai-graphics-job-payload-schema-validation-qa-decision.md')
const workerIntakeDoc = read('docs/worker-runtime/ai-graphics-job-payload-worker-intake-validation-qa.md')

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

for (const token of requiredTokens) {
  if (!docsText.includes(token)) failures.push(`required_token_missing:${token}`)
}

for (const tool of requiredTools) {
  const row = workerIntakeDoc.split('\n').find((line) => line.includes(`\`${tool}\``))
  if (!row) {
    failures.push(`worker_intake_qa_tool_missing:${tool}`)
    continue
  }
  for (const requiredCell of ['accepted', 'approved', 'passed', 'plan snapshot', 'scoped manifest', 'private artifact', 'checksum', 'owner', 'capability', 'tool', 'claim/lease', 'queue', 'accepted_with_warnings']) {
    if (!row.includes(requiredCell)) failures.push(`worker_intake_qa_tool_cell_missing:${tool}:${requiredCell}`)
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

for (const path of jsonFixtures) {
  const text = read(path)
  for (const [name, pattern] of forbiddenFixturePatterns) {
    const match = text.match(pattern)
    if (match) failures.push(`forbidden_json:${path}:${name}:${match[0]}`)
  }
}

const unsafeClaimText = docsText
  .split('\n')
  .filter(
    (line) =>
      !/\b(?:No|no|not|blocked|unapproved|does not approve|do not approve|must not|may not|remains|remain|stays|false|metadata-only|static|separately gated|without|warning|warnings|defer|deferred|none|placeholder|required|source evidence|source chain|context only|policy context|not source of truth|pending|later|future|planning|accepted_with_warnings|blocked|fail closed|shape only|docs_only|no write|passed_with_warnings|cleanup|ignored|local\/static|validation|QA|review|accepted|accepts|source|owner approval|allowed)\b/i.test(
        line,
      ),
  )
  .join('\n')

for (const [name, pattern] of forbiddenClaimPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['worker:ai-graphics-metadata-job-payload-schema-validation-qa:diagnostics'] !==
  'node scripts/validation/worker-ai-graphics-metadata-job-payload-schema-validation-qa-diagnostics.mjs'
) {
  failures.push('missing_package_script:worker:ai-graphics-metadata-job-payload-schema-validation-qa:diagnostics')
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
  .filter((line) => !line.includes('worker:ai-graphics-metadata-job-payload-schema-validation-qa:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-owner-approval:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-approval:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-dry-run:execute') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-dry-run:diagnostics') &&
  !line.includes('worker:ai-graphics-metadata-job-payload-dry-run-qa:diagnostics'))
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
  if (/(^|\/)(media|render|browser|canvas|webgl|public-artifacts?|schema-validation-output|local-fixture-output)\//i.test(file)) {
    failures.push(`forbidden_output_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|pdf)$/i.test(file)) failures.push(`generated_binary_output_changed:${file}`)
}

if (!docsText.includes('No worker execution, job claim, lease mutation, queue execution')) {
  failures.push('no_scope_statement_missing')
}

if (failures.length > 0) {
  console.error('WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_SCHEMA_VALIDATION_QA_REVIEW diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_SCHEMA_VALIDATION_QA_REVIEW diagnostics passed.')
