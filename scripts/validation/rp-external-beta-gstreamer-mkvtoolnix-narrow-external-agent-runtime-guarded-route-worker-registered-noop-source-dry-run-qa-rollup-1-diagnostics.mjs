#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-DRY-RUN-QA-ROLLUP-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1-record.json'
const integrationBase = 'af748afe4992b7326f9952bc5a3c09ff5ffbbf75'
const decision = 'qa_passed_gstreamer_mkvtoolnix_narrow_registered_noop_source_dry_run_evidence'
const execution =
  'completed_docs_only_registered_noop_source_dry_run_qa_rollup_no_route_worker_tool_or_media_execution'
const sourceDecision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_dry_run'
const sourceExecution =
  'completed_confirmation_gated_registered_noop_source_contract_dry_run_no_route_worker_tool_or_media_execution'
const sourceReadiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_dry_run_qa_rollup'
const readiness = 'ready_for_guarded_narrow_route_worker_registered_noop_source_route_worker_dry_run'
const runId = '2026-07-01T13-04-23-510Z-0e78b3a6'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-DRY-RUN-1'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-matrix.md`,
  `${dir}/qa-decision.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-qa-rollup-1-diagnostics.mjs',
  'package.json',
]

const nextRouteWorkerDryRunFiles = [
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1.ts',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/command-matrix.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/artifact-manifest.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/negative-cases.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-qa-rollup-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1-diagnostics.mjs',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1/artifact-manifest.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-1/validation-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...nextRouteWorkerDryRunFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  sourceDecision,
  sourceExecution,
  sourceReadiness,
  readiness,
  'Source dry-run PR: `#1991`',
  'Source dry-run merge SHA: `af748afe4992b7326f9952bc5a3c09ff5ffbbf75`',
  'Run ID: `2026-07-01T13-04-23-510Z-0e78b3a6`',
  gate,
  'accepted_registered_noop_source_contract',
  'Negative fail-closed blocker matrix',
  'registered-noop-source-dry-run-report.json',
  'registered-noop-source-dry-run-manifest.json',
  '4869290dc0df43e7198cd08dc195dccc566dd20278fc220705b4af1a2c890ad5',
  'a3e83d794526cf99e29340549406b0e47118bfcc83b611af4c8418177b17ae59',
  'Production route file created in this QA rollup phase: `false`',
  'Route registered in this QA rollup phase: `false`',
  'Route enabled in this QA rollup phase: `false`',
  'Route execution in this QA rollup phase: `false`',
  'Worker dispatch in this QA rollup phase: `false`',
  'Worker execution in this QA rollup phase: `false`',
  'Worker process start in this QA rollup phase: `false`',
  'Worker lease claim in this QA rollup phase: `false`',
  'Persistent job queue write in this QA rollup phase: `false`',
  'GStreamer execution in this QA rollup phase: `false`',
  'MKVToolNix execution in this QA rollup phase: `false`',
  'Docker execution in this QA rollup phase: `false`',
  'FFmpeg/FFprobe execution in this QA rollup phase: `false`',
  'Supabase mutation in this QA rollup phase: `false`',
  'SQL execution in this QA rollup phase: `false`',
  'Public artifact creation in this QA rollup phase: `false`',
  'Final render/export in this QA rollup phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-route-worker-dry-run-1\.ts$)/,
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
  /\b(?:Production route file created in this QA rollup phase|Route registered in this QA rollup phase|Route enabled in this QA rollup phase|Route execution in this QA rollup phase|Worker dispatch in this QA rollup phase|Worker execution in this QA rollup phase|Worker process start in this QA rollup phase|Worker lease claim in this QA rollup phase|Persistent job queue write in this QA rollup phase|GStreamer execution in this QA rollup phase|MKVToolNix execution in this QA rollup phase|Docker execution in this QA rollup phase|FFmpeg\/FFprobe execution in this QA rollup phase|Remotion execution in this QA rollup phase|Private media processing in this QA rollup phase|User media processing in this QA rollup phase|Media processing in this QA rollup phase|Supabase mutation in this QA rollup phase|SQL execution in this QA rollup phase|Signed URL creation in this QA rollup phase|Public artifact creation in this QA rollup phase|Final render\/export in this QA rollup phase|Broad external beta unlock in this QA rollup phase|Paid production unlock in this QA rollup phase|Production unlock in this QA rollup phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreatedInThisQaRollupPhase"\s*:\s*true/i,
  /"routeRegisteredInThisQaRollupPhase"\s*:\s*true/i,
  /"routeEnabledInThisQaRollupPhase"\s*:\s*true/i,
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
  /"supabaseMutationInThisQaRollupPhase"\s*:\s*true/i,
  /"sqlExecutionInThisQaRollupPhase"\s*:\s*true/i,
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
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-dry-run-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing registered no-op source dry-run QA rollup diagnostics package script')
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
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.registeredNoopSourceDryRunPr !== 1991) fail('dry-run PR mismatch')
if (record.sourceChain?.registeredNoopSourceDryRunMergeSha !== integrationBase) fail('dry-run merge SHA mismatch')
if (record.sourceChain?.registeredNoopSourceDryRunDecision !== sourceDecision) fail('dry-run decision mismatch')
if (record.sourceChain?.registeredNoopSourceDryRunExecution !== sourceExecution) fail('dry-run execution mismatch')
if (record.sourceChain?.registeredNoopSourceDryRunReadiness !== sourceReadiness) fail('dry-run readiness mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.qa?.scope !== 'dry_run_evidence_review_only') fail('QA scope mismatch')
if (record.qa?.dryRunEvidence !== 'passed') fail('dry-run evidence mismatch')
if (record.qa?.dryRunDiagnostics !== 'passed') fail('dry-run diagnostics mismatch')
if (record.qa?.priorRegisteredNoopSourceQaDiagnostics !== 'passed') fail('prior QA diagnostics mismatch')
if (record.qa?.runId !== runId) fail('run ID mismatch')
if (record.qa?.confirmationGate !== gate) fail('confirmation gate mismatch')
if (record.qa?.responseShapeStatus !== 'accepted_registered_noop_source_contract') fail('response shape mismatch')
if (record.qa?.negativeFailClosedMatrix !== 'passed') fail('negative matrix mismatch')
for (const flag of [
  'productionRouteFileCreated',
  'routeRegistered',
  'routeEnabled',
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseClaim',
  'persistentQueueWrite',
]) {
  if (record.qa?.[flag] !== false) fail(`QA flag must be false: ${flag}`)
}
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
if (record.readiness?.externalAgentBoundary !== readiness) fail('external-agent readiness mismatch')
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
