#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-DRY-RUN-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-qa-rollup-1-record.json'
const integrationBase = '3e95cfeaeebb22a15798333488812d028753b11d'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_dry_run'
const execution =
  'completed_confirmation_gated_registered_noop_source_contract_dry_run_no_route_worker_tool_or_media_execution'
const sourceDecision = 'qa_passed_gstreamer_mkvtoolnix_narrow_registered_noop_source_implementation_evidence'
const sourceExecution = 'completed_docs_only_registered_noop_source_qa_rollup_no_route_worker_tool_or_media_execution'
const sourceReadiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_dry_run'
const readiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_dry_run_qa_rollup'
const runId = '2026-07-01T13-04-23-510Z-0e78b3a6'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-DRY-RUN-QA-ROLLUP-1'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/command-matrix.md`,
  `${dir}/artifact-manifest.md`,
  `${dir}/negative-cases.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1.md',
]

const implementationFiles = [
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-qa-rollup-1-diagnostics.mjs',
  'package.json',
]

const nextDryRunQaRollupFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1/evidence-matrix.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1/qa-decision.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1-diagnostics.mjs',
]

const sourceFiles = [
  sourceRecordPath,
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1.ts',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...nextDryRunQaRollupFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceDecision,
  sourceExecution,
  sourceReadiness,
  readiness,
  runId,
  `${gate}=true`,
  'accepted_registered_noop_source_contract',
  'Runtime enabled: `false`',
  'Route registered at runtime: `false`',
  'Route execution: `false`',
  'Worker dispatch: `false`',
  'Worker execution: `false`',
  'Tool execution: `false`',
  'negative fail-closed blocker matrix',
  'registered-noop-source-dry-run-report.json',
  'registered-noop-source-dry-run-manifest.json',
  '4869290dc0df43e7198cd08dc195dccc566dd20278fc220705b4af1a2c890ad5',
  'a3e83d794526cf99e29340549406b0e47118bfcc83b611af4c8418177b17ae59',
  'Production route file created in this dry-run phase: `false`',
  'Route registered in this dry-run phase: `false`',
  'Route enabled in this dry-run phase: `false`',
  'Route execution in this dry-run phase: `false`',
  'Worker dispatch in this dry-run phase: `false`',
  'Worker execution in this dry-run phase: `false`',
  'Worker process start in this dry-run phase: `false`',
  'Worker lease claim in this dry-run phase: `false`',
  'Persistent job queue write in this dry-run phase: `false`',
  'GStreamer execution in this dry-run phase: `false`',
  'MKVToolNix execution in this dry-run phase: `false`',
  'Docker execution in this dry-run phase: `false`',
  'FFmpeg/FFprobe execution in this dry-run phase: `false`',
  'Supabase mutation in this dry-run phase: `false`',
  'SQL execution in this dry-run phase: `false`',
  'Public artifact creation in this dry-run phase: `false`',
  'Final render/export in this dry-run phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const requiredRunnerText = [
  "process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV] !==",
  'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_registered_noop_source_dry_run_confirmation',
  'validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput',
  'createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse',
  'routeRegisteredAtRuntime, false',
  'routeExecution, false',
  'workerDispatch, false',
  'workerExecution, false',
  'response.toolExecution, false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'supabaseMutation: false',
  'sqlExecution: false',
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-narrow-route-worker-registered-noop-source-dry-run-1',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1\.ts$)/,
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
  /\b(?:Production route file created in this dry-run phase|Route registered in this dry-run phase|Route enabled in this dry-run phase|Route execution in this dry-run phase|Worker dispatch in this dry-run phase|Worker execution in this dry-run phase|Worker process start in this dry-run phase|Worker lease claim in this dry-run phase|Persistent job queue write in this dry-run phase|GStreamer execution in this dry-run phase|MKVToolNix execution in this dry-run phase|Docker execution in this dry-run phase|FFmpeg\/FFprobe execution in this dry-run phase|Remotion execution in this dry-run phase|Private media processing in this dry-run phase|User media processing in this dry-run phase|Media processing in this dry-run phase|Supabase mutation in this dry-run phase|SQL execution in this dry-run phase|Signed URL creation in this dry-run phase|Public artifact creation in this dry-run phase|Final render\/export in this dry-run phase|Broad external beta unlock in this dry-run phase|Paid production unlock in this dry-run phase|Production unlock in this dry-run phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreatedInThisDryRunPhase"\s*:\s*true/i,
  /"routeRegisteredInThisDryRunPhase"\s*:\s*true/i,
  /"routeEnabledInThisDryRunPhase"\s*:\s*true/i,
  /"routeExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"workerDispatchInThisDryRunPhase"\s*:\s*true/i,
  /"workerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"workerProcessStartInThisDryRunPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisDryRunPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisDryRunPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"dockerExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"supabaseMutationInThisDryRunPhase"\s*:\s*true/i,
  /"sqlExecutionInThisDryRunPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisDryRunPhase"\s*:\s*true/i,
  /"finalRenderExportInThisDryRunPhase"\s*:\s*true/i,
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
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1'
  ] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1.ts'
) {
  fail('missing registered no-op source dry-run package script')
}
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1-diagnostics.mjs'
) {
  fail('missing registered no-op source dry-run diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const runnerText = read(implementationFiles[0])
for (const text of requiredRunnerText) {
  if (!runnerText.includes(text)) fail(`missing required runner text: ${text}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.registeredNoopSourceQaRollupPr !== 1989) fail('source QA PR mismatch')
if (record.sourceChain?.registeredNoopSourceQaRollupMergeSha !== integrationBase) fail('source QA merge SHA mismatch')
if (record.sourceChain?.registeredNoopSourceQaDecision !== sourceDecision) fail('source QA decision mismatch')
if (record.sourceChain?.registeredNoopSourceQaExecution !== sourceExecution) fail('source QA execution mismatch')
if (record.sourceChain?.registeredNoopSourceQaReadiness !== sourceReadiness) fail('source QA readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.confirmation?.value !== 'true') fail('confirmation gate value mismatch')
if (record.dryRun?.result !== 'passed') fail('dry-run result mismatch')
if (record.dryRun?.responseShapeStatus !== 'accepted_registered_noop_source_contract') fail('response status mismatch')
for (const flag of ['runtimeEnabled', 'routeRegisteredAtRuntime', 'routeExecution', 'workerDispatch', 'workerExecution', 'toolExecution']) {
  if (record.dryRun?.[flag] !== false) fail(`dry-run flag must be false: ${flag}`)
}
if (record.dryRun?.negativeFailClosedMatrix !== 'passed') fail('negative matrix mismatch')
if (record.artifacts?.report?.bytes !== 4809) fail('report bytes mismatch')
if (record.artifacts?.report?.sha256 !== '4869290dc0df43e7198cd08dc195dccc566dd20278fc220705b4af1a2c890ad5') {
  fail('report checksum mismatch')
}
if (record.artifacts?.manifest?.bytes !== 748) fail('manifest bytes mismatch')
if (record.artifacts?.manifest?.sha256 !== 'a3e83d794526cf99e29340549406b0e47118bfcc83b611af4c8418177b17ae59') {
  fail('manifest checksum mismatch')
}
if (record.readiness?.gstreamer !== readiness) fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== sourceDecision) fail('source record decision mismatch')
if (sourceRecord.execution !== sourceExecution) fail('source record execution mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source record next milestone mismatch')
if (sourceRecord.readiness?.gstreamer !== sourceReadiness) fail('source record readiness mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source record product-ready count mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
].sort()
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (!fs.existsSync(file) || file.startsWith('scripts/validation/')) continue
  const text = read(file)
  for (const pattern of forbiddenClaimPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in changed file ${file}: ${pattern}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json has unstaged changes')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json has staged changes')

console.log(
  JSON.stringify(
    {
      ok: true,
      packet,
      decision,
      execution,
      runId,
      changedFiles,
      nextMilestone,
    },
    null,
    2,
  ),
)
