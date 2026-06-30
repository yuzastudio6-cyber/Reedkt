#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-agent-execution-bridge-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_ready_for_confirmation_gated_bridge_dry_run'
const execution = 'completed_backend_source_agent_execution_bridge_no_route_worker_dispatch_or_tool_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-DRY-RUN-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/bridge-contract.md`,
  `${dir}/request-envelope.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1.md',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/gstreamer-mkvtoolnix-agent-execution-contract-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-implementation-1/gstreamer-mkvtoolnix-guarded-worker-route-implementation-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-1/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-record.json',
]

const followOnBridgeDryRunFiles = [
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/request-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-record.json',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-diagnostics.mjs',
]

const followOnControlledDispatchFiles = [
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/controlled-dispatch-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/dispatch-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1/gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-record.json',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.md',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, ...followOnBridgeDryRunFiles, ...followOnControlledDispatchFiles])

const requiredText = [
  packet,
  decision,
  execution,
  '4dec43f1edce87531eee61a7704b58545afd50b9',
  '2026-06-30T16-19-10-513Z-a91246d2',
  'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture',
  'ready_for_confirmation_gated_agent_execution_bridge_dry_run',
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_DRY_RUN=true',
  'approved snapshot',
  'approval record',
  'no-spend fixture policy',
  'worker lease',
  'idempotency',
  'command-template allowlist',
  'private input manifest',
  'output manifest',
  'QA report',
  'cleanup policy',
  'retention policy',
  'failure policy',
  'audit',
  'raw command strings allowed: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\/(?!backend\/contracts\/index\.ts$)/,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-smoke\.ts$|services\/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-smoke\.ts$)/,
  /^docker\//,
  /^\.dockerignore$/,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /(?:^|\/)(?:dist|node_modules)\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]

const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Provider call|Model call|Worker execution|Worker dispatch|Route execution|Signed URL creation|Public artifact creation|Credit mutation|Deployment|External beta expansion|Paid production unlock|Production unlock|Final render\/export|Private media processing|User media processing|FFmpeg\/FFprobe execution|Remotion execution|GStreamer execution in this bridge|MKVToolNix execution in this bridge|Package-lock mutation|Dependency mutation)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"runtimeExecutedInThisPacket"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisBridge"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisBridge"\s*:\s*true/i,
  /"dockerExecutionInThisBridge"\s*:\s*true/i,
  /"mediaProcessingInThisBridge"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"externalBetaExpansion"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
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

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '4dec43f1edce87531eee61a7704b58545afd50b9') fail('integration base mismatch')
if (record.sourceChain?.runtimeExecutionImplementationPr !== 1882) fail('runtime execution PR source mismatch')
if (record.sourceChain?.runtimeExecutionImplementationMergeSha !== '4dec43f1edce87531eee61a7704b58545afd50b9') fail('runtime execution merge source mismatch')
if (record.sourceChain?.runtimeExecutionRunId !== '2026-06-30T16-19-10-513Z-a91246d2') fail('runtime execution run id mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.bridge?.status !== 'ready_for_confirmation_gated_agent_execution_bridge_dry_run') fail('bridge status mismatch')
if (record.bridge?.confirmationGate !== 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_DRY_RUN=true') fail('confirmation gate mismatch')
for (const key of [
  'approvedSnapshotRequired',
  'approvalRecordRequired',
  'creditOrNoSpendPolicyRequired',
  'jobReferenceRequired',
  'workerLeaseRequired',
  'idempotencyKeyRequired',
  'commandTemplateAllowlistRequired',
  'privateInputManifestRequired',
  'privateInputManifestChecksumRequired',
  'outputManifestSchemaRequired',
  'qaReportSchemaRequired',
  'cleanupPolicyRequired',
  'retentionPolicyRequired',
  'failurePolicyRequired',
  'auditParentRequired',
  'runtimeExecutionEvidenceRequired',
]) {
  if (record.bridge?.[key] !== true) fail(`bridge requirement must be true: ${key}`)
}
for (const key of [
  'rawCommandsAccepted',
  'rawChatAccepted',
  'arbitraryFilePathsAccepted',
  'publicUrlSourceOfTruthAccepted',
  'signedUrlSourceOfTruthAccepted',
  'arbitraryPrivateMediaAccepted',
]) {
  if (record.bridge?.[key] !== false) fail(`unsafe input flag must be false: ${key}`)
}
for (const template of [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]) {
  if (!record.allowedCommandTemplates?.includes(template)) fail(`missing command template: ${template}`)
}
if (record.runtimeResult?.runtimeExecutedInThisPacket !== false) fail('runtime execution flag must be false')
if (record.runtimeResult?.routeExecution !== false) fail('route execution flag must be false')
if (record.runtimeResult?.workerDispatch !== false) fail('worker dispatch flag must be false')
if (record.runtimeResult?.workerExecution !== false) fail('worker execution flag must be false')
if (record.runtimeResult?.gstreamerExecutionInThisBridge !== false) fail('GStreamer bridge execution flag must be false')
if (record.runtimeResult?.mkvtoolnixExecutionInThisBridge !== false) fail('MKVToolNix bridge execution flag must be false')
if (record.readiness?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'backendSourceBridge' || key === 'sourceContractOnly') {
    if (value !== true) fail(`${key} must be true`)
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const runtimeRecord = json(
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-record.json',
)
if (runtimeRecord.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture') fail('runtime source decision mismatch')
if (runtimeRecord.runId !== '2026-06-30T16-19-10-513Z-a91246d2') fail('runtime source run id mismatch')

const dryRunRecord = json(
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1/gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-record.json',
)
if (dryRunRecord.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_dry_run_envelope_validation') fail('dry-run source decision mismatch')

const service = read('server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1.ts')
for (const text of [
  'blocked_missing_agent_execution_bridge_reference',
  'blocked_unapproved_command_template',
  'blocked_unsupported_external_agent_input',
  'blocked_unsafe_agent_execution_bridge_request',
  'rawCommandString',
  'publicUrlSourceOfTruth',
  'workerDispatchRequestedNow',
  'gstreamerExecutionRequestedNow',
  'directRuntimeExecutionInThisBridge: false',
]) {
  if (!service.includes(text)) fail(`bridge service missing required text: ${text}`)
}

const smoke = read('server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-smoke.ts')
for (const text of [
  'missing_refs_block',
  'unapproved_template_blocks',
  'raw_command_and_public_url_block',
  'dispatch_and_tool_execution_requests_block',
  'runtime_evidence_mismatch_blocks',
]) {
  if (!smoke.includes(text)) fail(`smoke missing required assertion summary: ${text}`)
}

const packageJson = json('package.json')
if (
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-smoke.ts'
) {
  fail('missing smoke package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-diagnostics.mjs'
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
  for (const pattern of blockedChangedPatterns) {
    if (pattern.test(file)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase API URL leaked in ${file}`)
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Next milestone: ${nextMilestone}`)
