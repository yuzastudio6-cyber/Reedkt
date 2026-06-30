#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-agent-execution-contract-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold'
const execution = 'completed_docs_only_agent_execution_contract_no_runtime_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-DISABLED-WORKER-SCAFFOLD-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/agent-execution-contract.md`,
  `${dir}/command-template-registry.md`,
  `${dir}/worker-io-contract.md`,
  `${dir}/fail-closed-boundary.md`,
  `${dir}/readiness-report.json`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1.md',
]

const sourceFiles = [
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix-record.json',
  'docs/track-a/native-container-render-tools/rollup-after-gstreamer-mkvtoolnix-qa/rollup.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/controlled-generated-private-fixture-qa-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.json',
  'editing-agent-execution-architecture.md',
  'editing-asset-manifest.md',
  'open-source-tool-registry.md',
  'tool-strategy-planner.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/disabled-worker-scaffold.md',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/negative-test-matrix.md',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/gstreamer-mkvtoolnix-disabled-worker-scaffold-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1.md',
  'src/backend/contracts/gstreamer-mkvtoolnix-disabled-worker-scaffold-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-diagnostics.mjs',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/guarded-worker-enablement-review.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/boundary-register.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/gstreamer-mkvtoolnix-guarded-worker-enablement-review-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1-diagnostics.mjs',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/execution-plan.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/gate-and-input-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1-diagnostics.mjs',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/blocked-scope-register.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  '332ed385e5bf4d1f3406d47a1e8b81e19ff25b03',
  'ready_for_disabled_worker_scaffold_and_negative_tests',
  'contract_ready_worker_disabled_until_scaffold_negative_tests_pass',
  nextMilestone,
  'approvedPlanSnapshotId',
  'approvalRecordId',
  'creditReservationId',
  'noSpendFixturePolicyId',
  'workerLeaseId',
  'idempotencyKey',
  'toolCommandTemplateId',
  'privateInputManifestId',
  'privateInputManifestSha256',
  'expectedOutputManifestSchemaId',
  'expectedQaReportSchemaId',
  'cleanupPolicyId',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'blocked_missing_approved_plan_snapshot',
  'blocked_raw_command_string',
  'blocked_unapproved_command_template',
  'blocked_missing_private_input_manifest',
  'blocked_public_or_signed_url_source',
  'PR #577 remains open/draft/blocked/excluded as source-of-truth',
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
  /\bworker execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer|MKVToolNix|GPAC\/MP4Box|VapourSynth|Revideo|FILM|QWEN|FFmpeg\/FFprobe|Docker|Remotion) execution in this contract phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Signed URL creation|Public artifact creation|Private media processing|User media processing|Dependency mutation|Package-lock mutation)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
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

for (const file of [...packetFiles, ...sourceFiles]) read(file)

const corpus = packetFiles.map((file) => read(file)).join('\n')
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
if (record.integrationBase !== '332ed385e5bf4d1f3406d47a1e8b81e19ff25b03') fail('integration base mismatch')
if (record.sourceChain?.toolExecutionReadinessMatrix !== 'completed_external_beta_tool_execution_readiness_matrix_for_guarded_agent_execution') fail('matrix source mismatch')
if (record.sourceChain?.gstreamerMkvtoolnixRollup !== 'completed_native_container_rollup_after_gstreamer_mkvtoolnix_qa') fail('rollup source mismatch')
if (
  record.sourceChain?.controlledGeneratedPrivateFixtureQa !==
  'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_qa_passed_ready_for_tracka_native_container_tools_rollup'
) {
  fail('controlled generated private fixture QA source mismatch')
}
if (
  record.sourceChain?.controlledGeneratedPrivateFixtureExecution !==
  'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_execution_passed_ready_for_qa'
) {
  fail('controlled generated private fixture execution source mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open/draft/blocked/excluded') fail('#577 exclusion mismatch')
if (record.toolReadiness?.gstreamer_render_pipeline_support?.contractStatus !== 'ready_for_disabled_worker_scaffold_and_negative_tests') fail('GStreamer contract status mismatch')
if (record.toolReadiness?.mkvtoolnix_container_validation?.contractStatus !== 'ready_for_disabled_worker_scaffold_and_negative_tests') fail('MKVToolNix contract status mismatch')
if (!record.allowedTemplateIds?.includes('gst_fakesrc_fakesink_no_media_healthcheck_v1')) fail('missing GStreamer healthcheck template')
if (!record.allowedTemplateIds?.includes('gst_controlled_generated_fixture_pipeline_v1')) fail('missing GStreamer generated fixture template')
if (!record.allowedTemplateIds?.includes('mkvmerge_generated_subtitle_only_package_v1')) fail('missing mkvmerge package template')
if (!record.allowedTemplateIds?.includes('mkvmerge_identify_generated_subtitle_only_v1')) fail('missing mkvmerge identify template')
for (const required of [
  'approvedPlanSnapshotId',
  'approvalRecordId',
  'creditReservationId_or_noSpendFixturePolicyId',
  'jobId',
  'workerLeaseId',
  'idempotencyKey',
  'toolCommandTemplateId',
  'privateInputManifestId',
  'privateInputManifestSha256',
  'expectedOutputManifestSchemaId',
  'expectedQaReportSchemaId',
  'cleanupPolicyId',
]) {
  if (!record.requiredAgentInputs?.includes(required)) fail(`missing required agent input: ${required}`)
}
if (!record.requiredFailureCategories?.includes('blocked_raw_command_string')) fail('missing raw command failure category')
if (!record.requiredFailureCategories?.includes('blocked_public_or_signed_url_source')) fail('missing public/signed URL failure category')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.safety?.docsOnly !== true) fail('docs-only safety flag mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const matrix = json('docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix-record.json')
if (matrix.toolReadiness?.gstreamer_render_pipeline_support?.agentExecutionReadiness !== 'ready_for_guarded_agent_execution_contract_planning') fail('matrix GStreamer source mismatch')
if (matrix.toolReadiness?.mkvtoolnix_container_validation?.agentExecutionReadiness !== 'ready_for_guarded_agent_execution_contract_planning') fail('matrix MKVToolNix source mismatch')

const rollup = json('docs/track-a/native-container-render-tools/rollup-after-gstreamer-mkvtoolnix-qa/rollup.json')
if (rollup.status?.gstreamer !== 'qa_passed_controlled_generated_private_fixture_execution_evidence') fail('rollup GStreamer source mismatch')
if (rollup.status?.mkvtoolnix !== 'qa_passed_controlled_generated_private_fixture_execution_evidence') fail('rollup MKVToolNix source mismatch')

const qa = json(
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/controlled-generated-private-fixture-qa-decision.json',
)
if (qa.decision !== 'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_qa_passed_ready_for_tracka_native_container_tools_rollup') fail('QA decision source mismatch')
if (qa.privateFixtureExecutionInThisPhase !== false) fail('QA phase execution source drift')

const executionSource = json(
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.json',
)
if (executionSource.decision !== 'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_execution_passed_ready_for_qa') fail('execution source decision mismatch')

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
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
console.log('GStreamer/MKVToolNix contract: ready_for_disabled_worker_scaffold_and_negative_tests')
console.log(`Next milestone: ${nextMilestone}`)
