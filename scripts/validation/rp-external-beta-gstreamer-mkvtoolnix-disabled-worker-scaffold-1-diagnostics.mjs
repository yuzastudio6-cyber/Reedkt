#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-DISABLED-WORKER-SCAFFOLD-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-disabled-worker-scaffold-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_disabled_worker_scaffold_negative_tests_ready_for_guarded_worker_enablement_review'
const execution = 'completed_disabled_worker_scaffold_no_tool_or_worker_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENABLEMENT-REVIEW-1'
const contractFile = 'src/backend/contracts/gstreamer-mkvtoolnix-disabled-worker-scaffold-contracts.ts'
const smokeFile = 'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-smoke.ts'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/disabled-worker-scaffold.md`,
  `${dir}/negative-test-matrix.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1.md',
]

const implementationFiles = [
  contractFile,
  'src/backend/contracts/index.ts',
  smokeFile,
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/gstreamer-mkvtoolnix-agent-execution-contract-record.json',
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix-record.json',
  'docs/track-a/native-container-render-tools/rollup-after-gstreamer-mkvtoolnix-qa/rollup.json',
  'approved-plan-snapshot-policy.md',
  'async-edit-work-graph.md',
  'editing-agent-execution-architecture.md',
  'editing-asset-manifest.md',
]

const reviewFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/guarded-worker-enablement-review.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/boundary-register.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/gstreamer-mkvtoolnix-guarded-worker-enablement-review-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1-diagnostics.mjs',
]

const planFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/execution-plan.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/gate-and-input-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1-diagnostics.mjs',
]

const dryRunFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/blocked-scope-register.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-diagnostics.mjs',
]

const dryRun1rFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/worker-dry-run-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/blocked-scope-register.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...reviewFiles, ...planFiles, ...dryRunFiles, ...dryRun1rFiles])

const requiredText = [
  packet,
  decision,
  execution,
  '4213bb31a92c6585359f95b0d3fc13bc055b526c',
  'workerScaffold.gstreamerMkvtoolnix.disabled',
  'disabled_worker_scaffold_only',
  'disabled_worker_scaffold_registered_no_tool_execution',
  'ready_for_guarded_worker_enablement_review_after_disabled_scaffold_negative_tests',
  nextMilestone,
  'blocked_missing_approved_plan_snapshot',
  'blocked_missing_approval_record',
  'blocked_missing_credit_or_no_spend_policy',
  'blocked_missing_worker_lease',
  'blocked_missing_idempotency_key',
  'blocked_unapproved_command_template',
  'blocked_raw_command_string',
  'blocked_missing_private_input_manifest',
  'blocked_manifest_checksum_mismatch',
  'blocked_unapproved_media_source',
  'blocked_public_or_signed_url_source',
  'blocked_output_manifest_missing',
  'blocked_qa_report_missing',
  'blocked_cleanup_policy_missing',
  'blocked_worker_or_tool_execution_attempt',
  'blocked_delivery_or_unlock_attempt',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const falseSafetyKeys = [
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCallInThisPhase',
  'modelCallInThisPhase',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'deployment',
  'iamMutation',
  'googleGroupMembershipMutation',
  'broadExternalBetaAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'rawPromptExecution',
  'finalRenderExport',
  'privateMediaProcessing',
  'userMediaProcessing',
  'gstreamerExecutionInThisPhase',
  'mkvtoolnixExecutionInThisPhase',
  'gpacMp4boxExecutionInThisPhase',
  'vapoursynthExecutionInThisPhase',
  'revideoExecutionInThisPhase',
  'filmExecutionInThisPhase',
  'qwenExecutionInThisPhase',
  'aiGraphicsExecution',
  'ffmpegFfprobeExecutionInThisPhase',
  'dockerExecutionInThisPhase',
  'remotionExecutionInThisPhase',
  'packageInstallationBeyondDependencyValidation',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'cloudRunReadback',
  'cloudRunServiceUpdate',
  'broadServiceRoleHandler',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_live_worker_dispatch\b/i,
  /\b(?:GStreamer|MKVToolNix|GPAC\/MP4Box|VapourSynth|Revideo|FILM|QWEN|FFmpeg\/FFprobe|Docker|Remotion) execution in this scaffold phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Worker execution|Worker dispatch|Route execution|Service-role route execution|Signed URL creation|Public artifact creation|Private media processing|User media processing|Dependency mutation|Package-lock mutation)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisPhase"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...implementationFiles, ...sourceFiles]) read(file)

const corpus = [...packetFiles, contractFile, smokeFile].map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '4213bb31a92c6585359f95b0d3fc13bc055b526c') fail('integration base mismatch')
if (record.sourceChain?.agentExecutionContract !== 'completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold') fail('contract source mismatch')
if (record.scaffold?.contractFile !== contractFile) fail('contract file mismatch')
if (record.scaffold?.smoke !== smokeFile) fail('smoke file mismatch')
if (record.scaffold?.scaffoldId !== 'workerScaffold.gstreamerMkvtoolnix.disabled') fail('scaffold id mismatch')
if (record.scaffold?.scaffoldStatus !== 'disabled_worker_scaffold_registered_no_tool_execution') fail('scaffold status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.safety?.disabledScaffoldOnly !== true) fail('disabled scaffold safety flag mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const agentContract = json('docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/gstreamer-mkvtoolnix-agent-execution-contract-record.json')
if (agentContract.decision !== 'completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold') fail('agent contract source drift')
const matrix = json('docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix-record.json')
if (matrix.toolReadiness?.gstreamer_render_pipeline_support?.agentExecutionReadiness !== 'ready_for_guarded_agent_execution_contract_planning') fail('matrix GStreamer source drift')
if (matrix.toolReadiness?.mkvtoolnix_container_validation?.agentExecutionReadiness !== 'ready_for_guarded_agent_execution_contract_planning') fail('matrix MKVToolNix source drift')

const contractText = read(contractFile)
for (const text of [
  'workerScaffold.gstreamerMkvtoolnix.disabled',
  'disabled_worker_scaffold_only',
  'validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput',
  'buildGstreamerMkvtoolnixDisabledWorkerScaffoldInput',
  'blocked_raw_command_string',
  'blocked_worker_or_tool_execution_attempt',
  'blocked_delivery_or_unlock_attempt',
]) {
  if (!contractText.includes(text)) fail(`contract missing ${text}`)
}

const smokeText = read(smokeFile)
for (const text of [
  'baseline_disabled_worker_scaffold_validates',
  'all_allowed_command_templates_validate_as_contract_metadata',
  'missing_snapshot_approval_credit_worker_lease_idempotency_block',
  'unapproved_template_and_raw_command_block',
  'all_worker_tool_runtime_attempts_block',
  'all_delivery_unlock_attempts_block',
]) {
  if (!smokeText.includes(text)) fail(`smoke missing ${text}`)
}

const packageJson = json('package.json')
if (
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-smoke.ts'
) {
  fail('missing smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`changed file is outside packet scope: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`blocked changed path: ${file}`)
  }
  if (/^src\//.test(file) && file !== contractFile && file !== 'src/backend/contracts/index.ts') {
    fail(`unexpected source file changed: ${file}`)
  }
  if (/^server\//.test(file) && file !== smokeFile) {
    fail(`unexpected server file changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase API URL leaked in ${file}`)
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log('Disabled worker scaffold: disabled_worker_scaffold_registered_no_tool_execution')
console.log(`Next milestone: ${nextMilestone}`)
