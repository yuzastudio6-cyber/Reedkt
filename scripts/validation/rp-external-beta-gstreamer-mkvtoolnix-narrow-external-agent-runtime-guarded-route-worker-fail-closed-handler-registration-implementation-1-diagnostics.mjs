#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-IMPLEMENTATION-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-record.json`
const planRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1-record.json'
const sourcePath = 'server/routes/gstreamer-mkvtoolnix-narrow-source-execution-boundary-handler-registration-source.ts'
const smokePath =
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-smoke.ts'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_registration_source_metadata'
const execution = 'completed_source_handler_registration_metadata_no_runtime_registration_or_execution'
const integrationBase = 'dd63e904d7597b60c99b7e988ada7c5806708b9f'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/registration-source.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1.md',
]

const qaRollupDir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1'
const qaRollupFiles = [
  `${qaRollupDir}/source-audit.md`,
  `${qaRollupDir}/evidence-matrix.md`,
  `${qaRollupDir}/qa-decision.md`,
  `${qaRollupDir}/readiness.md`,
  `${qaRollupDir}/safety-boundary.md`,
  `${qaRollupDir}/validation-results.md`,
  `${qaRollupDir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-disabled-route-wiring-plan-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...qaRollupFiles,
  sourcePath,
  smokePath,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  'Handler registration plan PR: `#2106`',
  'Handler registration plan merge SHA: `dd63e904d7597b60c99b7e988ada7c5806708b9f`',
  'Registration source id: `externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundary.failClosedHandlerRegistrationSource`',
  'Registration mode: `source_metadata_only_disabled_backend_required`',
  'Handler runtime registration: `false`',
  'Route execution: `false`',
  'Worker dispatch: `false`',
  'GStreamer execution: `false`',
  'MKVToolNix execution: `false`',
  'GStreamer readiness: `ready_for_fail_closed_handler_registration_qa_rollup`',
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
  /\b(?:Handler runtime registration|Route execution|Worker dispatch|Worker execution|GStreamer execution|MKVToolNix execution|Docker execution|FFmpeg\/FFprobe execution|Remotion execution|Media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|run|executed)\b/i,
  /"handlerRuntimeRegistrationInThisRegistrationImplementationPhase"\s*:\s*true/i,
  /"routeExecutionInThisRegistrationImplementationPhase"\s*:\s*true/i,
  /"workerDispatchInThisRegistrationImplementationPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisRegistrationImplementationPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisRegistrationImplementationPhase"\s*:\s*true/i,
  /"supabaseMutationInThisRegistrationImplementationPhase"\s*:\s*true/i,
  /"sqlExecutionInThisRegistrationImplementationPhase"\s*:\s*true/i,
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

const corpus = [...packetFiles, sourcePath, smokePath].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}
if (/\bexecFileSync\b|\bspawn\(|\bexec\(/.test(read(sourcePath))) fail('registration source must not contain process execution calls')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-smoke.ts'
) fail('smoke package script mismatch')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-diagnostics.mjs'
) fail('diagnostics package script mismatch')

const plan = readJson(planRecordPath)
if (plan.decision !== 'completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_registration_plan') fail('plan decision mismatch')
if (plan.validation !== 'passed') fail('plan validation mismatch')
if (plan.nextMilestone !== packet) fail('plan next milestone mismatch')

const record = readJson(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.handlerRegistrationPlanPr !== 2106) fail('registration plan PR mismatch')
if (record.sourceChain?.handlerRegistrationPlanMergeSha !== integrationBase) fail('registration plan merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.registrationSource?.status !== 'accepted_fail_closed_handler_registration_source_metadata') fail('registration status mismatch')
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
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  changedFiles: uniqueChanged,
  nextMilestone,
  safety: 'registration_source_metadata_no_runtime_route_worker_tool_media_supabase_sql_unlock_paths_enabled',
}, null, 2))
