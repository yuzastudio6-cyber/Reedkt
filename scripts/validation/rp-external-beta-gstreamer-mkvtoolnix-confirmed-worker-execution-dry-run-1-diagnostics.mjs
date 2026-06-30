#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-record.json`
const decision = 'blocked_missing_confirmation_gate'
const execution = 'blocked_missing_confirmation_gate_no_worker_or_tool_execution'
const requiredGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_EXECUTION=true'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1R'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/blocked-scope-register.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/gstreamer-mkvtoolnix-guarded-worker-enablement-review-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/gstreamer-mkvtoolnix-disabled-worker-scaffold-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/gstreamer-mkvtoolnix-agent-execution-contract-record.json',
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  '0fe56f01a455439683cf6cfa47b0b8993ae3c482',
  'completed_gstreamer_mkvtoolnix_confirmation_gated_worker_execution_plan_ready_for_confirmed_dry_run',
  requiredGate,
  'Observed confirmation gate: `absent`',
  'Dry-run status: `not_run_confirmation_gate_absent`',
  'Worker dispatch: `not_run_confirmation_gate_absent`',
  'Worker execution: `not_run_confirmation_gate_absent`',
  'GStreamer execution: `not_run_confirmation_gate_absent`',
  'MKVToolNix execution: `not_run_confirmation_gate_absent`',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked/excluded',
]

const falseSafetyKeys = [
  'workerEnablementInThisPhase',
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
  /^src\//,
  /^server\//,
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
  /\bWorker dispatch:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bWorker execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bTool execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer|MKVToolNix|GPAC\/MP4Box|VapourSynth|Revideo|FILM|QWEN|FFmpeg\/FFprobe|Docker|Remotion) execution in this dry-run phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Route execution|Service-role route execution|Signed URL creation|Public artifact creation|Private media processing|User media processing|Dependency mutation|Package-lock mutation)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
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
if (record.integrationBase !== '0fe56f01a455439683cf6cfa47b0b8993ae3c482') fail('integration base mismatch')
if (record.sourceChain?.confirmationGatedWorkerExecutionPlanMerge !== '0fe56f01a455439683cf6cfa47b0b8993ae3c482') fail('plan merge mismatch')
if (record.sourceChain?.confirmationGatedWorkerExecutionPlan !== 'completed_gstreamer_mkvtoolnix_confirmation_gated_worker_execution_plan_ready_for_confirmed_dry_run') fail('plan source mismatch')
if (record.dryRun?.status !== 'not_run_confirmation_gate_absent') fail('dry-run status mismatch')
if (record.dryRun?.blocker !== decision) fail('dry-run blocker mismatch')
if (record.dryRun?.confirmationGateRequired !== requiredGate) fail('confirmation gate required mismatch')
if (record.dryRun?.confirmationGateObserved !== 'absent') fail('confirmation gate observed mismatch')
if (record.dryRun?.workerDispatch !== 'not_run_confirmation_gate_absent') fail('worker dispatch status mismatch')
if (record.dryRun?.workerExecution !== 'not_run_confirmation_gate_absent') fail('worker execution status mismatch')
if (record.dryRun?.toolExecution !== 'not_run_confirmation_gate_absent') fail('tool execution status mismatch')
if (record.dryRun?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.safety?.failClosedBeforeExecution !== true) fail('fail-closed safety flag mismatch')
if (record.safety?.docsOnlyResult !== true) fail('docs-only result safety flag mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const plan = json('docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-record.json')
if (plan.decision !== 'completed_gstreamer_mkvtoolnix_confirmation_gated_worker_execution_plan_ready_for_confirmed_dry_run') fail('plan source drift')
if (plan.plan?.confirmationGate !== requiredGate) fail('plan confirmation gate drift')

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-diagnostics.mjs'
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
console.log('GStreamer/MKVToolNix dry run: blocked_missing_confirmation_gate')
console.log(`Next milestone: ${nextMilestone}`)
