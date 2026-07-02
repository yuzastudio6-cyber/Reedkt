#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-QA-ROLLUP-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-record.json'
const decision = 'qa_passed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_registration_source_metadata'
const execution = 'completed_docs_only_fail_closed_handler_registration_qa_rollup_no_runtime_registration_or_execution'
const sourceDecision = 'completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_registration_source_metadata'
const sourceExecution = 'completed_source_handler_registration_metadata_no_runtime_registration_or_execution'
const integrationBase = '4ee8cc582ed0c535e7c99c093ec3708d083ff0e6'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-DISABLED-ROUTE-WIRING-PLAN-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/qa-decision.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-disabled-route-wiring-plan-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  sourceDecision,
  sourceExecution,
  integrationBase,
  'Handler registration implementation PR: `#2108`',
  'Handler registration implementation merge SHA: `4ee8cc582ed0c535e7c99c093ec3708d083ff0e6`',
  'Handler registration plan PR: `#2106`',
  'Handler registration plan merge SHA: `dd63e904d7597b60c99b7e988ada7c5806708b9f`',
  'Handler contract QA rollup PR: `#2104`',
  'Handler contract QA rollup merge SHA: `4ecaa50cf35098b63e4ac2d61c8ddb72c516ab02`',
  'Handler contract PR: `#2103`',
  'Handler contract merge SHA: `a2a207634c9312b63c7d20e5b67ee5c960662e20`',
  'Route registration metadata PR: `#2100`',
  'Route registration metadata merge SHA: `340f6f405a2307e364ecd15d7219fdb66a824c81`',
  '#577 remains `open_draft_blocked_excluded`',
  'source_registration_metadata_evidence_review_only',
  'registrationSourceReview',
  'handlerContractLinkageReview',
  'routeMetadataLinkageReview',
  'disabledResponseReview',
  'negativeRuntimeMatrixReview',
  'routeExecutionBoundaryReview',
  'workerExecutionBoundaryReview',
  'toolMediaExecutionBoundaryReview',
  'safetyBoundaryReview',
  'Handler runtime registration in this QA rollup phase: `false`',
  'Route execution in this QA rollup phase: `false`',
  'Worker dispatch in this QA rollup phase: `false`',
  'Worker execution in this QA rollup phase: `false`',
  'GStreamer execution in this QA rollup phase: `false`',
  'MKVToolNix execution in this QA rollup phase: `false`',
  'Supabase mutation in this QA rollup phase: `false`',
  'SQL execution in this QA rollup phase: `false`',
  'GStreamer readiness: `ready_for_disabled_route_wiring_planning`',
  'MKVToolNix readiness: `ready_for_disabled_route_wiring_planning`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
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
  /\b(?:Handler runtime registration in this QA rollup phase|Route execution in this QA rollup phase|Worker dispatch in this QA rollup phase|Worker execution in this QA rollup phase|Worker process start in this QA rollup phase|Worker lease claim in this QA rollup phase|Persistent job queue write in this QA rollup phase|GStreamer execution in this QA rollup phase|MKVToolNix execution in this QA rollup phase|Docker execution in this QA rollup phase|FFmpeg\/FFprobe execution in this QA rollup phase|Remotion execution in this QA rollup phase|Media processing in this QA rollup phase|Private media processing in this QA rollup phase|User media processing in this QA rollup phase|Supabase mutation in this QA rollup phase|SQL execution in this QA rollup phase|Signed URL creation in this QA rollup phase|Public artifact creation in this QA rollup phase|Final render\/export in this QA rollup phase|Broad external beta unlock in this QA rollup phase|Paid production unlock in this QA rollup phase|Production unlock in this QA rollup phase):\s*`?(true|enabled|completed|run|executed)\b/i,
  /"handlerRuntimeRegistrationInThisQaRollupPhase"\s*:\s*true/i,
  /"routeExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"workerDispatchInThisQaRollupPhase"\s*:\s*true/i,
  /"workerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"workerProcessStartInThisQaRollupPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisQaRollupPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisQaRollupPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"dockerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"remotionExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"mediaProcessingInThisQaRollupPhase"\s*:\s*true/i,
  /"supabaseMutationInThisQaRollupPhase"\s*:\s*true/i,
  /"sqlExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"providerCallInThisQaRollupPhase"\s*:\s*true/i,
  /"modelCallInThisQaRollupPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisQaRollupPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisQaRollupPhase"\s*:\s*true/i,
  /"finalRenderExportInThisQaRollupPhase"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
  /"dependencyMutation"\s*:\s*true/i,
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

for (const file of [...packetFiles, sourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing QA rollup diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const source = json(sourceRecordPath)
if (source.packet !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-IMPLEMENTATION-1') fail('source packet mismatch')
if (source.integrationBase !== 'dd63e904d7597b60c99b7e988ada7c5806708b9f') fail('source integration base mismatch')
if (source.decision !== sourceDecision) fail('source decision mismatch')
if (source.execution !== sourceExecution) fail('source execution mismatch')
if (source.sourceChain?.handlerRegistrationPlanPr !== 2106) fail('registration plan PR mismatch')
if (source.sourceChain?.handlerRegistrationPlanMergeSha !== 'dd63e904d7597b60c99b7e988ada7c5806708b9f') fail('registration plan merge mismatch')
if (source.sourceChain?.handlerContractQaRollupPr !== 2104) fail('handler contract QA rollup PR mismatch')
if (source.sourceChain?.handlerContractQaRollupMergeSha !== '4ecaa50cf35098b63e4ac2d61c8ddb72c516ab02') fail('handler contract QA rollup merge mismatch')
if (source.sourceChain?.handlerContractPr !== 2103) fail('handler contract PR mismatch')
if (source.sourceChain?.handlerContractMergeSha !== 'a2a207634c9312b63c7d20e5b67ee5c960662e20') fail('handler contract merge mismatch')
if (source.sourceChain?.routeRegistrationPr !== 2100) fail('route registration PR mismatch')
if (source.sourceChain?.routeRegistrationMergeSha !== '340f6f405a2307e364ecd15d7219fdb66a824c81') fail('route registration merge mismatch')
if (source.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 source exclusion mismatch')
if (source.registrationSource?.status !== 'accepted_fail_closed_handler_registration_source_metadata') fail('source registration status mismatch')
if (source.registrationSource?.registrationMode !== 'source_metadata_only_disabled_backend_required') fail('source registration mode mismatch')
if (source.registrationSource?.runtimeMode !== 'backend_required') fail('source runtime mode mismatch')
if (source.validation !== 'passed') fail('source validation mismatch')
if (source.packageLock !== 'unchanged') fail('source package-lock mismatch')
if (source.generatedArtifactsCommitted !== 'none') fail('source generated artifact mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.qaScope !== 'source_registration_metadata_evidence_review_only') fail('QA scope mismatch')
if (record.sourceChain?.handlerRegistrationImplementationPr !== 2108) fail('handler registration implementation PR mismatch')
if (record.sourceChain?.handlerRegistrationImplementationMergeSha !== integrationBase) fail('handler registration implementation merge mismatch')
if (record.sourceChain?.handlerRegistrationImplementationDecision !== sourceDecision) fail('handler registration implementation decision mismatch')
if (record.sourceChain?.handlerRegistrationImplementationExecution !== sourceExecution) fail('handler registration implementation execution mismatch')
if (record.sourceChain?.handlerRegistrationImplementationValidation !== 'passed') fail('handler registration implementation validation mismatch')
if (record.sourceChain?.handlerRegistrationPlanPr !== 2106) fail('registration plan PR mismatch')
if (record.sourceChain?.handlerRegistrationPlanMergeSha !== 'dd63e904d7597b60c99b7e988ada7c5806708b9f') fail('registration plan merge mismatch')
if (record.sourceChain?.handlerContractQaRollupPr !== 2104) fail('handler contract QA rollup PR mismatch')
if (record.sourceChain?.handlerContractQaRollupMergeSha !== '4ecaa50cf35098b63e4ac2d61c8ddb72c516ab02') fail('handler contract QA rollup merge mismatch')
if (record.sourceChain?.handlerContractPr !== 2103) fail('handler contract PR mismatch')
if (record.sourceChain?.handlerContractMergeSha !== 'a2a207634c9312b63c7d20e5b67ee5c960662e20') fail('handler contract merge mismatch')
if (record.sourceChain?.routeRegistrationPr !== 2100) fail('route registration PR mismatch')
if (record.sourceChain?.routeRegistrationMergeSha !== '340f6f405a2307e364ecd15d7219fdb66a824c81') fail('route registration merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
for (const key of [
  'registrationSourceReview',
  'handlerContractLinkageReview',
  'routeMetadataLinkageReview',
  'disabledResponseReview',
  'negativeRuntimeMatrixReview',
  'routeExecutionBoundaryReview',
  'workerExecutionBoundaryReview',
  'toolMediaExecutionBoundaryReview',
  'safetyBoundaryReview',
]) {
  if (record.qa?.[key] !== 'passed') fail(`QA field mismatch: ${key}`)
}
if (record.readiness?.gstreamer !== 'ready_for_disabled_route_wiring_planning') fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== 'ready_for_disabled_route_wiring_planning') fail('MKVToolNix readiness mismatch')
if (
  record.readiness?.externalAgentFailClosedHandlerRegistration !==
  'qa_passed_source_metadata_ready_for_disabled_route_wiring_planning'
) fail('handler registration readiness mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (!['pending_final_validation', 'passed', 'full_validation_passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag should be false: ${key}`)
}

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`changed file outside QA rollup scope: ${file}`)
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
}

if (gitLines(['diff', '--name-only', '--', 'package-lock.json']).length) fail('package-lock changed')
if (gitLines(['diff', '--cached', '--name-only', '--', 'package-lock.json']).length) fail('staged package-lock changed')

console.log(
  JSON.stringify(
    {
      ok: true,
      packet,
      decision,
      execution,
      acceptedPr: 2108,
      changedFiles,
      nextMilestone,
      safety: 'qa_rollup_docs_only_no_runtime_registration_route_worker_tool_media_supabase_sql_unlock_paths_enabled',
    },
    null,
    2
  )
)
