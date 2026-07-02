#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-EXECUTION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1-record.json`
const handoffRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1/gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1-record.json'
const runtimeReadyRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1/gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1-record.json'
const decision =
  'blocked_pending_gstreamer_mkvtoolnix_external_agent_controlled_generated_fixture_execution_confirmation'
const execution = 'blocked_confirmation_absent_no_route_worker_or_tool_execution'
const handoffDecision = 'completed_external_agent_controlled_generated_fixture_handoff_ready_for_guarded_execution'
const runtimeReadyDecision = 'completed_narrow_external_agent_runtime_ready_rollup_for_controlled_generated_fixture_path'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION=true'
const gateObserved = 'absent'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const allowedClass = 'controlled_generated_fixture_runtime_only'
const outputDirectory =
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1/<runId>/'
const runId = '2026-07-02T12-00-03-397Z-aa991010'
const runtimeReadyMergeSha = '9d8bc93f30a36e6aeea845340ae213d178d26dc9'
const confirmedMergeSha = '73099b53cee52c61aca0ef72384051a8544a4885'
const runtimePacketMergeSha = '14045c17a99a826557033e4b572db1dd4855f1f9'
const executionQaMergeSha = '5621ee3cfb7146ee0ba13617b5c8d24f9ebf80d2'
const routeBridgeMergeSha = '67602b088009779d45b0d1f26eabac65c48902fc'
const realignmentMergeSha = 'c76b98c63773687a9c5588e15443b60b9b719e3f'
const readiness =
  'ready_for_guarded_external_agent_controlled_generated_fixture_execution_confirmation_gate_required'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-EXECUTION-1 confirmed run with REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION=true'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-chain.md`,
  `${dir}/execution-gate.md`,
  `${dir}/evidence-manifest-requirements.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/blocked-result.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-confirmed-execution-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tracka-tool-lane-ownership-realignment-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])
const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
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
  /\b(?:Route execution in this phase|Worker execution in this phase|GStreamer execution in this phase|MKVToolNix execution in this phase|FFmpeg\/FFprobe execution in this phase|Docker execution in this phase|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export|Private media processing|User media processing):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisPhase"\s*:\s*true/i,
  /"workerExecutionInThisPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisPhase"\s*:\s*true/i,
  /"dockerExecutionInThisPhase"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  handoffDecision,
  runtimeReadyDecision,
  gate,
  'Confirmation gate observed: `absent`',
  routePath,
  allowedClass,
  outputDirectory,
  runtimeReadyMergeSha,
  confirmedMergeSha,
  runtimePacketMergeSha,
  executionQaMergeSha,
  routeBridgeMergeSha,
  realignmentMergeSha,
  runId,
  'completed_controlled_generated_fixture_only',
  'controlled_generated_fixture_only',
  readiness,
  'Route execution in this phase: `false`',
  'Worker execution in this phase: `false`',
  'GStreamer execution in this phase: `false`',
  'MKVToolNix execution in this phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked and excluded',
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

for (const file of [...packetFiles, ...implementationFiles, handoffRecordPath, runtimeReadyRecordPath]) read(file)
const packageJson = json('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1-diagnostics.mjs'
) {
  fail('missing execution diagnostics package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden execution claim matched: ${pattern}`)
}

const handoffRecord = json(handoffRecordPath)
if (handoffRecord.decision !== handoffDecision) fail('handoff decision mismatch')
if (handoffRecord.handoff?.routePath !== routePath) fail('handoff route path mismatch')
if (handoffRecord.handoff?.confirmationGate !== gate) fail('handoff gate mismatch')
if (handoffRecord.acceptedRuntimeEvidence?.runId !== runId) fail('handoff accepted run mismatch')

const runtimeReadyRecord = json(runtimeReadyRecordPath)
if (runtimeReadyRecord.decision !== runtimeReadyDecision) fail('runtime ready decision mismatch')
if (runtimeReadyRecord.acceptedRuntimeEvidence?.runId !== runId) fail('runtime ready run mismatch')
if (runtimeReadyRecord.acceptedRuntimeEvidence?.routePath !== routePath) fail('runtime ready route mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.runtimeReadyRollupMergeSha !== runtimeReadyMergeSha) fail('runtime ready merge mismatch')
if (record.sourceChain?.controlledGeneratedFixtureHandoffDecision !== handoffDecision) fail('handoff source mismatch')
if (record.sourceChain?.confirmedRuntimeEvidenceReconciliationMergeSha !== confirmedMergeSha) fail('confirmed merge mismatch')
if (record.sourceChain?.externalAgentRuntimeExecutionPacketMergeSha !== runtimePacketMergeSha) fail('runtime packet merge mismatch')
if (record.sourceChain?.externalAgentExecutionQaMergeSha !== executionQaMergeSha) fail('execution QA merge mismatch')
if (record.sourceChain?.routeWorkerBridgeQaMergeSha !== routeBridgeMergeSha) fail('route bridge merge mismatch')
if (record.sourceChain?.toolLaneRealignmentMergeSha !== realignmentMergeSha) fail('realignment merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.executionGate?.required !== gate) fail('gate mismatch')
if (record.executionGate?.observed !== gateObserved) fail('observed gate mismatch')
if (record.executionGate?.routePath !== routePath) fail('route path mismatch')
if (record.executionGate?.allowedClass !== allowedClass) fail('allowed class mismatch')
if (record.executionGate?.outputDirectoryTemplate !== outputDirectory) fail('output directory mismatch')
if (record.acceptedRuntimeEvidence?.runId !== runId) fail('accepted run mismatch')
if (record.acceptedRuntimeEvidence?.httpStatus !== 201) fail('HTTP status mismatch')
if (record.acceptedRuntimeEvidence?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer evidence mismatch')
if (record.acceptedRuntimeEvidence?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix evidence mismatch')
if (record.acceptedRuntimeEvidence?.mediaProcessing !== 'controlled_generated_fixture_only') fail('media evidence mismatch')
for (const [key, value] of Object.entries(record.currentPhaseResult ?? {})) {
  if (key === 'reportFilesGenerated' || key === 'generatedArtifactsCommitted') {
    if (value !== 'none') fail(`${key} must remain none`)
  } else if (value !== false) {
    fail(`current phase result must remain false: ${key}`)
  }
}
if (record.readiness?.gstreamer !== readiness) fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix readiness mismatch')
if (record.readiness?.approvedPathClass !== allowedClass) fail('approved path class mismatch')
for (const [key, value] of Object.entries(record.blockedScope ?? {})) {
  if (value !== true) fail(`blocked scope must remain true: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'pending_local_validation' && record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

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
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile() && (/^docs\//.test(file) || file === 'package.json'))
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(changedCorpus)) fail(`forbidden changed-file execution claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  routePath,
  gate,
  changedFiles: uniqueChangedFiles,
}, null, 2))
