#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-PLAN-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1-record.json`
const qaRollupRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-qa-rollup-1-record.json'
const handlerContractRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_registration_plan'
const execution = 'completed_docs_only_fail_closed_handler_registration_plan_no_handler_route_worker_tool_or_media_execution'
const integrationBase = '4ecaa50cf35098b63e4ac2d61c8ddb72c516ab02'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-IMPLEMENTATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/registration-plan.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1.md',
]

const implementationDir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1'
const implementationFiles = [
  `${implementationDir}/source-audit.md`,
  `${implementationDir}/registration-source.md`,
  `${implementationDir}/readiness.md`,
  `${implementationDir}/safety-boundary.md`,
  `${implementationDir}/validation-results.md`,
  `${implementationDir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...implementationFiles,
  'server/routes/gstreamer-mkvtoolnix-narrow-source-execution-boundary-handler-registration-source.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-smoke.ts',
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  'Handler contract QA rollup PR: `#2104`',
  'Handler contract QA rollup merge SHA: `4ecaa50cf35098b63e4ac2d61c8ddb72c516ab02`',
  'Handler contract PR: `#2103`',
  'Handler contract merge SHA: `a2a207634c9312b63c7d20e5b67ee5c960662e20`',
  'Route metadata PR: `#2100`',
  'Route metadata merge SHA: `340f6f405a2307e364ecd15d7219fdb66a824c81`',
  '#577 remains `open_draft_blocked_excluded`',
  'Registration plan status: `ready_for_fail_closed_handler_registration_source_implementation`',
  'Registration mode in this phase: `planned_fail_closed_handler_registration_only`',
  'Handler contract id: `externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundary.failClosedHandlerContract`',
  'Route source id: `externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundaryRouteSource`',
  'Route path: `/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/source-execution-boundary`',
  'Runtime mode: `backend_required_disabled_fail_closed_boundary`',
  'Handler registered at runtime in this plan phase: `false`',
  'Route execution in this plan phase: `false`',
  'Worker dispatch in this plan phase: `false`',
  'Worker execution in this plan phase: `false`',
  'Persistent queue write in this plan phase: `false`',
  'GStreamer readiness: `ready_for_fail_closed_handler_registration_source_implementation`',
  'MKVToolNix readiness: `ready_for_fail_closed_handler_registration_source_implementation`',
  'External-agent fail-closed handler registration readiness: `planned_source_registration_ready_no_runtime_execution`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
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
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Handler registered at runtime in this plan phase|Handler runtime registration in this registration-plan phase|Route execution in this registration-plan phase|Worker dispatch in this registration-plan phase|Worker execution in this registration-plan phase|Worker process start in this registration-plan phase|Worker lease claim in this registration-plan phase|Persistent job queue write in this registration-plan phase|GStreamer execution in this registration-plan phase|MKVToolNix execution in this registration-plan phase|Docker execution in this registration-plan phase|FFmpeg\/FFprobe execution in this registration-plan phase|Remotion execution in this registration-plan phase|Media processing in this registration-plan phase|Private media processing in this registration-plan phase|User media processing in this registration-plan phase|Supabase mutation in this registration-plan phase|SQL execution in this registration-plan phase|Signed URL creation in this registration-plan phase|Public artifact creation in this registration-plan phase|Final render\/export in this registration-plan phase|Broad external beta unlock in this registration-plan phase|Paid production unlock in this registration-plan phase|Production unlock in this registration-plan phase):\s*`?(true|enabled|completed|run|executed)\b/i,
  /"handlerRuntimeRegistrationInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"routeExecutionInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"workerDispatchInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"workerExecutionInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"workerProcessStartInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"dockerExecutionInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"remotionExecutionInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"mediaProcessingInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"supabaseMutationInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"sqlExecutionInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"providerCallInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"modelCallInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisRegistrationPlanPhase"\s*:\s*true/i,
  /"finalRenderExportInThisRegistrationPlanPhase"\s*:\s*true/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
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
    fail(`invalid JSON ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  return execFileSync('git', args, { encoding: 'utf8', env: gitEnv }).split('\n').filter(Boolean)
}

const allPacketText = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!allPacketText.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(allPacketText)) fail(`forbidden claim matched: ${pattern}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1-diagnostics.mjs'
) fail('package script mismatch')

const qaRollup = readJson(qaRollupRecordPath)
const handlerContract = readJson(handlerContractRecordPath)
if (qaRollup.packet !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-CONTRACT-QA-ROLLUP-1') fail('QA rollup packet mismatch')
if (qaRollup.decision !== 'qa_passed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_contract_evidence') fail('QA rollup decision mismatch')
if (qaRollup.validation !== 'passed') fail('QA rollup validation mismatch')
if (qaRollup.nextMilestone !== packet) fail('QA rollup next milestone mismatch')
if (handlerContract.decision !== 'completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_contract') fail('handler contract decision mismatch')
if (handlerContract.validation !== 'full_validation_passed') fail('handler contract validation mismatch')

const record = readJson(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.handlerContractQaRollupPr !== 2104) fail('QA rollup PR mismatch')
if (record.sourceChain?.handlerContractQaRollupMergeSha !== integrationBase) fail('QA rollup merge mismatch')
if (record.sourceChain?.handlerContractPr !== 2103) fail('handler contract PR mismatch')
if (record.sourceChain?.handlerContractMergeSha !== 'a2a207634c9312b63c7d20e5b67ee5c960662e20') fail('handler contract merge mismatch')
if (record.sourceChain?.routeRegistrationPr !== 2100) fail('route registration PR mismatch')
if (record.sourceChain?.routeRegistrationMergeSha !== '340f6f405a2307e364ecd15d7219fdb66a824c81') fail('route registration merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.registrationPlan?.status !== 'ready_for_fail_closed_handler_registration_source_implementation') fail('registration status mismatch')
if (record.registrationPlan?.registrationModeInThisPhase !== 'planned_fail_closed_handler_registration_only') fail('registration mode mismatch')
if (record.registrationPlan?.runtimeMode !== 'backend_required_disabled_fail_closed_boundary') fail('runtime mode mismatch')
if (record.readiness?.externalAgentFailClosedHandlerRegistration !== 'planned_source_registration_ready_no_runtime_execution') fail('external agent readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (!['pending_final_validation', 'passed'].includes(record.validation)) fail('validation status mismatch')
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
  changedFiles: uniqueChanged,
  nextMilestone,
  safety: 'registration_plan_docs_only_no_handler_route_worker_tool_media_supabase_sql_unlock_paths_enabled',
}, null, 2))
