#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-CONTRACT-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1-record.json`
const activationResultsPath =
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1-results.md'
const handlerSourcePath =
  'server/routes/gstreamer-mkvtoolnix-narrow-source-execution-boundary-handler-contract.ts'
const smokePath =
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1-smoke.ts'
const promptPath =
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-qa-rollup-1.md'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_contract'
const execution = 'completed_source_handler_contract_no_route_worker_tool_or_media_execution'
const baseIntegrationHead = '340f6f405a2307e364ecd15d7219fdb66a824c81'
const handlerContractId =
  'externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundary.failClosedHandlerContract'
const routeId = 'externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundaryRouteSource'
const routePath = '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/source-execution-boundary'
const confirmationGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-CONTRACT-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/handler-contract.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationResultsPath,
  promptPath,
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  handlerSourcePath,
  smokePath,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  baseIntegrationHead,
  handlerContractId,
  routeId,
  routePath,
  confirmationGate,
  'Handler contract status: `accepted_fail_closed_handler_contract`',
  'handler registered at runtime: `false`',
  'route execution: `false`',
  'worker dispatch: `false`',
  'worker execution: `false`',
  'tool execution: `false`',
  'GStreamer readiness: `ready_for_fail_closed_handler_contract_qa_rollup`',
  'MKVToolNix readiness: `ready_for_fail_closed_handler_contract_qa_rollup`',
  'External-agent handler contract readiness: `source_handler_contract_ready_for_qa_rollup_no_runtime_execution`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '`#577` remains `open_draft_blocked_excluded`',
  nextMilestone,
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
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
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bbroad external beta unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpaid production unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed|passed)\b/i,
  /\bhandler registered at runtime:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bpersistent queue write:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bGStreamer execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bMKVToolNix execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bDocker execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bFFmpeg\/FFprobe execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bmedia processing:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
]

function fail(message) {
  console.error(`diagnostic failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function readJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid json ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  return execFileSync('git', args, { encoding: 'utf8', env: gitEnv }).split('\n').filter(Boolean)
}

const allPacketText = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!allPacketText.includes(text)) fail(`missing required text: ${text}`)
}

const handlerSource = read(handlerSourcePath)
for (const text of [
  'GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID',
  handlerContractId,
  'GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID',
  'GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH',
  'GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV',
  'buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput',
  'validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput',
  'createGstreamerMkvtoolnixNarrowSourceExecutionBoundaryDisabledResponse',
  'blocked_route_worker_or_tool_execution_not_enabled',
  'blocked_public_or_signed_artifact_attempt',
  'blocked_delivery_or_unlock_attempt',
  'handlerRegisteredAtRuntime: false',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'mediaProcessing: false',
  'productReadyEndToEndLocalOssTools: 0',
]) {
  if (!handlerSource.includes(text)) fail(`handler source missing required text: ${text}`)
}
if (/\bexecFileSync\b|\bspawn\(|\bexec\(/.test(handlerSource)) {
  fail('handler source must not contain executable tool/process calls')
}

const smoke = read(smokePath)
for (const text of [
  'valid_fail_closed_handler_contract',
  'disabled_backend_required_route_metadata',
  'negative_cases_block_runtime_tool_media_paths',
  'blocked_missing_handler_contract_confirmation',
  'blocked_invalid_route_registration_metadata',
  'blocked_route_worker_or_tool_execution_not_enabled',
]) {
  if (!smoke.includes(text)) fail(`smoke missing required text: ${text}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1-smoke.ts'
) fail('smoke package script mismatch')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1-diagnostics.mjs'
) fail('diagnostics package script mismatch')

const record = readJson(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.baseIntegrationHead !== baseIntegrationHead) fail('base integration mismatch')
if (record.sourceChain?.routeRegistrationPr !== 2100) fail('route registration PR mismatch')
if (record.sourceChain?.routeRegistrationMergeSha !== baseIntegrationHead) fail('route registration merge mismatch')
if (record.sourceChain?.sourceRegistrationPlanReconciliationPr !== 2098) fail('source registration PR mismatch')
if (record.sourceChain?.sourceImplementationQaRollupPr !== 2094) fail('source implementation QA PR mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('excluded #577 mismatch')
if (record.handlerContract?.handlerContractId !== handlerContractId) fail('handler contract id mismatch')
if (record.handlerContract?.routeId !== routeId) fail('route id mismatch')
if (record.handlerContract?.routePath !== routePath) fail('route path mismatch')
if (record.handlerContract?.confirmationGate !== confirmationGate) fail('confirmation gate mismatch')
if (record.handlerContract?.status !== 'accepted_fail_closed_handler_contract') fail('handler status mismatch')
for (const key of [
  'handlerRegisteredAtRuntime',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'gstreamerExecutionInThisPhase',
  'mkvtoolnixExecutionInThisPhase',
  'mediaProcessing',
]) {
  if (record.handlerContract?.[key] !== false) fail(`handler contract flag must be false: ${key}`)
}
for (const [key, value] of Object.entries(record.requiredReferences ?? {})) {
  if (value !== 'required') fail(`required ref mismatch: ${key}`)
}
if (record.readiness?.gstreamer !== 'ready_for_fail_closed_handler_contract_qa_rollup') fail('gstreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== 'ready_for_fail_closed_handler_contract_qa_rollup') fail('mkvtoolnix readiness mismatch')
if (record.readiness?.externalAgentHandlerContract !== 'source_handler_contract_ready_for_qa_rollup_no_runtime_execution') fail('handler readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (!['pending_final_validation', 'passed', 'full_validation_passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

if (gitLines(['diff', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must be unchanged')
if (gitLines(['diff', '--cached', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must not be staged')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChanged = [...new Set(changedFiles)].sort()
for (const file of uniqueChanged) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const text = read(file)
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim ${pattern} in ${file}`)
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  handlerContractId,
  routeId,
  changedFiles: uniqueChanged,
  nextMilestone,
  safety: 'handler_contract_source_only_no_route_worker_tool_media_supabase_sql_unlock_paths_enabled',
}, null, 2))
