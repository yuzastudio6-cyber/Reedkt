#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-QA-ROLLUP-1'
const decision = 'qa_passed_three_tool_external_agent_controlled_generated_fixture_execution_evidence'
const execution = 'completed_docs_only_three_tool_execution_qa_no_new_runtime_execution'
const acceptance = 'ready_for_three_tool_external_agent_execution_bridge'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-record.json`
const executionRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1-record.json'
const activationPath =
  'docs/activation-phase-tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-execution-bridge-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const combinedRunId = '2026-07-02T23-06-37-783Z-735edf80'
const gstreamerRunId = '2026-07-02T23-06-37-953Z-ee1ebbec'
const gstreamerGuardedRunId = '2026-07-02T23-06-38-140Z-687e30fc'
const gpacRunId = '2026-07-02T23-06-42-095Z-21ff9b93'
const executionMergeSha = '6ad10faf36bdc447e232044e3857d5d0220ffa54'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXECUTION-BRIDGE-1'

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/evidence-review.md`,
  `${dir}/tool-readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-process-noop-invoke-1-diagnostics.mjs',
]

const bridgeFollowupFiles = [
  'docs/activation-phase-tracka-three-tool-external-agent-execution-bridge-1-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-1/source-audit.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-1/bridge-contract.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-1/request-envelope.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-1/safety-boundary.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-1/validation-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-1/tracka-three-tool-external-agent-execution-bridge-1-record.json',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-execution-bridge-dry-run-1.md',
  'scripts/validation/tracka-three-tool-external-agent-execution-bridge-1-diagnostics.mjs',
  'server/services/tracka-three-tool-external-agent-execution-bridge-1.ts',
  'server/smoke/tracka-three-tool-external-agent-execution-bridge-1-smoke.ts',
]

const approvedSnapshotJobExecutionFiles = [
  'docs/activation-phase-tracka-three-tool-external-agent-approved-snapshot-job-execution-1-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/source-audit.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/execution-result.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/command-matrix.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/artifact-manifest-summary.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/safety-boundary.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/validation-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-record.json',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-production-readiness-review-1.md',
  'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1.mjs',
  'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...implementationFiles,
  ...bridgeFollowupFiles,
  ...approvedSnapshotJobExecutionFiles,
])
const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/tracka-three-tool-external-agent-execution-bridge-1\.ts$|smoke\/tracka-three-tool-external-agent-execution-bridge-1-smoke\.ts$)/,
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
  /\bexternal beta unlock:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\binternal beta unlock:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Route execution|Worker execution|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Private media processing|User media processing|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer execution in this QA phase|MKVToolNix execution in this QA phase|GPAC\/MP4Box execution in this QA phase|Docker execution in this QA phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"newRuntimeExecutionInThisQaPhase"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  acceptance,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  combinedRunId,
  gstreamerRunId,
  gstreamerGuardedRunId,
  gpacRunId,
  executionMergeSha,
  'e8cf179250214f473da15d18203680fd37fb6b3a',
  '102828f889cff62f865f13a856582f07197e8a321032f7b651f14a46a7047df4',
  'd179b6140b65665ab25a647725d665607822cdb0c715ae19f77cd789aa1d0a35',
  '0a60bd92ee776ccf0ba3eb78d8e25172206b331e44d70e0006b1d00c248e0b36',
  '2784900314498d7f5932f6a87bfcbf9cf286b01494b9da757153be24e71913d7',
  '#577 open_draft_blocked_excluded',
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

for (const file of [...packetFiles, ...implementationFiles, executionRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-controlled-generated-fixture-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing QA rollup diagnostics package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const sourceRecord = json(executionRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_controlled_generated_fixture_execution') {
  fail('source execution decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source execution next milestone mismatch')
if (sourceRecord.runId !== combinedRunId) fail('source execution run ID mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.activeNativeContainerToolLaneCount !== 3) fail('active lane count mismatch')
if (record.sourceChain?.threeToolExecutionMergeSha !== executionMergeSha) fail('execution merge SHA mismatch')
if (record.sourceChain?.combinedExecutionRunId !== combinedRunId) fail('combined run ID mismatch')
if (record.sourceChain?.gstreamerMkvtoolnixRunId !== gstreamerRunId) fail('GStreamer/MKVToolNix run ID mismatch')
if (record.sourceChain?.gstreamerMkvtoolnixGuardedRuntimeRunId !== gstreamerGuardedRunId) {
  fail('GStreamer/MKVToolNix guarded run ID mismatch')
}
if (record.sourceChain?.gpacMp4boxRunId !== gpacRunId) fail('GPAC/MP4Box run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.qa?.acceptance !== acceptance) fail('QA acceptance mismatch')
if (record.qa?.sourceEvidenceReviewOnly !== true) fail('source-evidence-only flag mismatch')
if (record.qa?.newRuntimeExecutionInThisQaPhase !== false) fail('new runtime execution flag mismatch')
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (record.readiness?.[tool] !== acceptance) fail(`readiness mismatch: ${tool}`)
}
for (const [key, value] of Object.entries(record.blockedScope ?? {})) {
  if (value !== true) fail(`blocked scope must stay true: ${key}`)
}
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

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
  if (pattern.test(changedCorpus)) fail(`forbidden changed-file claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  acceptance,
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone,
}, null, 2))
