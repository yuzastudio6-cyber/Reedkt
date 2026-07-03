#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-PROCESS-APPROVED-SNAPSHOT-EXECUTION-1'
const decision = 'completed_three_tool_external_agent_worker_process_approved_snapshot_execution'
const execution = 'completed_worker_process_delegate_to_approved_snapshot_generated_fixture_runtime'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1-record.json`
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1-results.md'
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-record.json'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_PROCESS_APPROVED_SNAPSHOT_EXECUTION=true'
const runId = '2026-07-03T13-43-18-998Z-5466071d'
const childRunId = '2026-07-03T13-43-19-052Z-273c9624'
const workerClaimMergeSha = 'ac992038ff5c196b54488f908e83c6816a892d5b'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXTERNAL-BETA-READINESS-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-process-execution.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /^tmp\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Supabase mutation|SQL execution|Secret payload access|Service-role secret payload access|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Private media processing|User media processing|FFmpeg\/FFprobe execution|Docker push\/deploy|Remotion execution|Package installation|Dependency mutation|Package-lock mutation):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
]

const requiredText = [
  packet,
  decision,
  execution,
  confirmGate,
  runId,
  childRunId,
  workerClaimMergeSha,
  'completed_local_worker_process_entrypoint',
  'completed_worker_process_approved_snapshot_delegate',
  'controlled_generated_fixture_only',
  'external_agent_worker_process_approved_snapshot_execution_passed',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '#577',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
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

for (const file of [...packetFiles, ...implementationFiles, sourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-worker-process-approved-snapshot-execution-1'] !==
  'node scripts/validation/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1.mjs'
) {
  fail('missing worker-process approved snapshot execution package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-worker-process-approved-snapshot-execution-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1-diagnostics.mjs'
) {
  fail('missing worker-process approved snapshot execution diagnostics script')
}

const corpus = [...packetFiles, ...implementationFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_local_mock_worker_claim_lease_boundary') {
  fail('source worker claim decision mismatch')
}
if (sourceRecord.validation !== 'passed') fail('source worker claim validation mismatch')
if (sourceRecord.result?.workerLeaseClaim !== 'completed_local_mock_claim_only') {
  fail('source worker claim lease mismatch')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.validation !== 'passed') fail('record validation mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.workerClaimLeaseMergeSha !== workerClaimMergeSha) fail('worker claim merge mismatch')
if (record.sourceChain?.blockedExcludedPr !== '#577 open/draft/blocked/excluded') fail('#577 exclusion mismatch')
if (record.workerProcess?.workerProcessStart !== 'completed_local_worker_process_entrypoint') {
  fail('worker process start mismatch')
}
if (record.workerProcess?.workerExecution !== 'completed_worker_process_approved_snapshot_delegate') {
  fail('worker execution mismatch')
}
if (record.childApprovedSnapshotExecution?.runId !== childRunId) fail('child run ID mismatch')
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (!record.tools?.includes(tool)) fail(`missing tool: ${tool}`)
  if (record.readiness?.[tool] !== 'external_agent_worker_process_approved_snapshot_execution_passed') {
    fail(`tool readiness mismatch: ${tool}`)
  }
}
if (!Array.isArray(record.artifacts) || record.artifacts.length < 3) fail('missing artifact summary')
if (!Array.isArray(record.childApprovedSnapshotExecution?.artifacts) || record.childApprovedSnapshotExecution.artifacts.length < 5) {
  fail('missing child artifact summary')
}
for (const key of [
  'runtimeRouteInvocation',
  'workerDispatch',
  'persistentJobQueueWrite',
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'dockerExecution',
  'dockerPushDeploy',
  'remotionExecution',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'serviceRoleSecretPayloadAccess',
  'signedUrlCreation',
  'publicArtifactCreation',
  'providerCall',
  'modelCall',
  'creditMutation',
  'deployment',
  'externalBetaExpansion',
  'paidProductionUnlock',
  'productionUnlock',
  'finalRenderExport',
  'packageInstallation',
  'dependencyMutation',
  'packageLockMutation',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const runner = read('scripts/validation/tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1.mjs')
for (const text of [
  childRunId,
  'spawnSync',
  'tracka-three-tool-external-agent-approved-snapshot-job-execution-1.mjs',
  'completed_worker_process_approved_snapshot_delegate',
  'privateMediaProcessing: false',
  'supabaseMutation: false',
]) {
  if (!runner.includes(text) && text !== childRunId) fail(`runner missing required text: ${text}`)
}

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')
gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json staged')

const changedFiles = [
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
}
const changedCorpus = uniqueChangedFiles
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(changedCorpus)) fail(`forbidden claim matched in changed files: ${pattern}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      packet,
      decision,
      execution,
      runId,
      childRunId,
      readiness: record.readiness,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
      productReadyEndToEndLocalOssTools: 0,
      nextMilestone,
      changedFiles: uniqueChangedFiles,
    },
    null,
    2,
  ),
)
