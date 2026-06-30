#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-DRY-RUN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_dry_run_envelope_validation'
const execution = 'completed_confirmation_gated_agent_execution_bridge_dry_run_no_route_worker_dispatch_or_tool_execution'
const runId = '2026-06-30T18-13-47-512Z-1707fbec'
const integrationBase = '4effa512450664c648db9cf9e95b0653de41e96d'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_DRY_RUN=true'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-CONTROLLED-DISPATCH-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/request-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/gstreamer-mkvtoolnix-agent-execution-bridge-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1/gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-record.json',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1.ts',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  runId,
  integrationBase,
  '4dec43f1edce87531eee61a7704b58545afd50b9',
  '2026-06-30T16-19-10-513Z-a91246d2',
  confirmationGate,
  'Confirmation gate observed: `present_true`',
  'completed_agent_execution_bridge_dry_run_envelope_validation',
  'approved-snapshot-agent-execution-bridge-dry-run-1',
  'approval-record-agent-execution-bridge-dry-run-1',
  'no-spend-fixture-policy-agent-execution-bridge-dry-run-1',
  'job-agent-execution-bridge-dry-run-1',
  'worker-lease-agent-execution-bridge-dry-run-1',
  'gstreamer-mkvtoolnix:agent-bridge-dry-run-1:approved-snapshot:job:template',
  'gst_controlled_generated_fixture_pipeline_v1',
  'private-input-manifest-agent-execution-bridge-dry-run-1',
  'output-manifest-schema-agent-execution-bridge-dry-run-1',
  'qa-report-schema-agent-execution-bridge-dry-run-1',
  'cleanup-policy-agent-execution-bridge-dry-run-1',
  'retention-policy-agent-execution-bridge-dry-run-1',
  'failure-policy-agent-execution-bridge-dry-run-1',
  'audit-parent-agent-execution-bridge-dry-run-1',
  'Route execution: `not_run_bridge_dry_run_envelope_validation_only`',
  'Worker dispatch: `not_run_bridge_dry_run_envelope_validation_only`',
  'Worker execution: `not_run_bridge_dry_run_envelope_validation_only`',
  'Tool execution: `not_run_bridge_dry_run_envelope_validation_only`',
  'GStreamer execution in this dry run: `false`',
  'MKVToolNix execution in this dry run: `false`',
  'ready_for_confirmation_gated_agent_execution_bridge_controlled_dispatch',
  '9c2b3bb387022b6c225b52b20f4dbc7307ef156244d9638ad9b0cd5e8217cf0e',
  '30696177ca97bb9d7cc959e516b1a2d28804ab778cbb8a2894a6e2945ade3aeb',
  '6a04b03d54a6eb1e0f2df6a2a11314f9502bd2c086a496dfbc7c1900ae27728d',
  '42b665c1c6aab924fa8fcf950e2381d5a93acf31ebcbd2fcf8ae1fdb526746e9',
  '3690f29496dc41f350dbafb26c1012ddebc39dbc5b583de462f286710663828d',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1\.ts$)/,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.github\//,
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
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Route execution|Worker dispatch|Worker execution|Tool execution|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisDryRun"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDryRun"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
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

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1'] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1.ts'
) {
  fail('missing bridge dry-run package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-diagnostics.mjs'
) {
  fail('missing bridge dry-run diagnostics package script')
}

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
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.confirmationGate?.observed !== 'present_true') fail('confirmation gate mismatch')
if (record.sourceChain?.agentExecutionBridgePr !== 1887) fail('bridge PR mismatch')
if (record.sourceChain?.agentExecutionBridgeMergeSha !== integrationBase) fail('bridge merge mismatch')
if (record.sourceChain?.runtimeExecutionImplementationPr !== 1882) fail('runtime source PR mismatch')
if (record.sourceChain?.runtimeExecutionImplementationMergeSha !== '4dec43f1edce87531eee61a7704b58545afd50b9') fail('runtime source merge mismatch')
if (record.sourceChain?.runtimeExecutionRunId !== '2026-06-30T16-19-10-513Z-a91246d2') fail('runtime source run id mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.bridgeDryRun?.status !== 'completed_agent_execution_bridge_dry_run_envelope_validation') fail('dry-run status mismatch')
if (record.bridgeDryRun?.bridgeStatus !== 'ready_for_confirmation_gated_agent_execution_bridge_dry_run') fail('bridge status mismatch')
if (record.bridgeDryRun?.directRuntimeExecutionInThisBridge !== false) fail('direct runtime execution flag mismatch')
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'toolExecution']) {
  if (record.bridgeDryRun?.[key] !== 'not_run_bridge_dry_run_envelope_validation_only') fail(`${key} mismatch`)
}
if (record.readiness?.gstreamer !== 'ready_for_confirmation_gated_agent_execution_bridge_controlled_dispatch') fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== 'ready_for_confirmation_gated_agent_execution_bridge_controlled_dispatch') fail('MKVToolNix readiness mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 5) fail('artifact count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}

const bridgeRecord = json('docs/external-beta/gstreamer-mkvtoolnix-agent-execution-bridge-1/gstreamer-mkvtoolnix-agent-execution-bridge-record.json')
if (bridgeRecord.decision !== 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_ready_for_confirmation_gated_bridge_dry_run') fail('bridge source decision mismatch')

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ...gitLines(['diff', '--cached', '--name-only']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const content = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(content)) fail(`Supabase token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(content)) fail(`Supabase URL leaked in ${file}`)
  const redacted = content.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(content)) fail(`secret-like assignment in ${file}`)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(content)) fail(`forbidden claim matched in ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Execution: ${execution}`)
console.log(`Run ID: ${runId}`)
console.log(`Next milestone: ${nextMilestone}`)
console.log('Product-ready end-to-end local OSS tools: 0')
