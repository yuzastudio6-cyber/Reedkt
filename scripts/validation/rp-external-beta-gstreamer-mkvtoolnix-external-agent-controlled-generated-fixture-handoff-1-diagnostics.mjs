#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-HANDOFF-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1-record.json`
const readyRollupRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1/gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1-record.json'
const decision = 'completed_external_agent_controlled_generated_fixture_handoff_ready_for_guarded_execution'
const execution = 'completed_docs_only_external_agent_handoff_no_new_runtime_execution'
const readyRollupDecision = 'completed_narrow_external_agent_runtime_ready_rollup_for_controlled_generated_fixture_path'
const readyRollupMergeSha = '9d8bc93f30a36e6aeea845340ae213d178d26dc9'
const confirmedMergeSha = '73099b53cee52c61aca0ef72384051a8544a4885'
const runtimePacketMergeSha = '14045c17a99a826557033e4b572db1dd4855f1f9'
const routeBridgeMergeSha = '67602b088009779d45b0d1f26eabac65c48902fc'
const runId = '2026-07-02T12-00-03-397Z-aa991010'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const confirmGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION=true'
const readiness = 'ready_for_guarded_external_agent_controlled_generated_fixture_execution'
const handoffReadiness = 'ready_for_guarded_controlled_generated_fixture_execution_packet'
const allowedClass = 'controlled_generated_fixture_runtime_only'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-EXECUTION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-chain.md`,
  `${dir}/handoff-contract.md`,
  `${dir}/execution-readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/artifact-manifest-policy.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-runtime-ready-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1-diagnostics.mjs',
]

const executionDir = 'docs/external-beta/gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1'
const executionFiles = [
  `${executionDir}/source-chain.md`,
  `${executionDir}/execution-gate.md`,
  `${executionDir}/evidence-manifest-requirements.md`,
  `${executionDir}/safety-boundary.md`,
  `${executionDir}/blocked-result.md`,
  `${executionDir}/validation-results.md`,
  `${executionDir}/gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1-record.json`,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-confirmed-execution-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tracka-tool-lane-ownership-realignment-1-diagnostics.mjs',
]

const threeToolHandoffDir = 'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1'
const threeToolHandoffFiles = [
  `${threeToolHandoffDir}/source-chain.md`,
  `${threeToolHandoffDir}/handoff-contract.md`,
  `${threeToolHandoffDir}/execution-readiness.md`,
  `${threeToolHandoffDir}/artifact-manifest-policy.md`,
  `${threeToolHandoffDir}/safety-boundary.md`,
  `${threeToolHandoffDir}/validation-results.md`,
  `${threeToolHandoffDir}/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1-record.json`,
  'docs/activation-phase-tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1-results.md',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-controlled-generated-fixture-execution-1.md',
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-runtime-ready-rollup-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...executionFiles, ...threeToolHandoffFiles])
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
  /\b(?:Route execution in this handoff phase|Worker execution in this handoff phase|GStreamer execution in this handoff phase|MKVToolNix execution in this handoff phase|FFmpeg\/FFprobe execution in this handoff phase|Docker execution in this handoff phase|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export|Private media processing|User media processing):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"workerExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"dockerExecutionInThisHandoffPhase"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  readyRollupDecision,
  readyRollupMergeSha,
  confirmedMergeSha,
  runtimePacketMergeSha,
  routeBridgeMergeSha,
  routePath,
  runId,
  confirmGate,
  allowedClass,
  readiness,
  handoffReadiness,
  'completed_controlled_generated_fixture_only',
  'controlled_generated_fixture_only',
  'Arbitrary private media',
  'User media',
  'Public URL media',
  'Signed URL source-of-truth',
  'GCS/private artifact',
  'Broad service-role',
  'Public artifact',
  'Final render/export',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded',
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

for (const file of [...packetFiles, ...implementationFiles, readyRollupRecordPath]) read(file)
const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-external-agent-controlled-generated-fixture-handoff-1-diagnostics.mjs'
) fail('missing handoff diagnostics package script')

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const readyRollupRecord = json(readyRollupRecordPath)
if (readyRollupRecord.decision !== readyRollupDecision) fail('ready rollup decision mismatch')
if (readyRollupRecord.sourceChain?.confirmedRuntimeEvidenceReconciliationMergeSha !== confirmedMergeSha) {
  fail('ready rollup confirmed-runtime source mismatch')
}
if (readyRollupRecord.readiness?.externalAgent !== 'ready_for_controlled_generated_fixture_runtime_handoff_only') {
  fail('ready rollup external-agent readiness mismatch')
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.runtimeReadyRollupMergeSha !== readyRollupMergeSha) fail('runtime ready rollup merge mismatch')
if (record.sourceChain?.confirmedRuntimeEvidenceReconciliationMergeSha !== confirmedMergeSha) fail('confirmed runtime merge mismatch')
if (record.sourceChain?.externalAgentRuntimeExecutionPacketMergeSha !== runtimePacketMergeSha) fail('runtime packet merge mismatch')
if (record.sourceChain?.routeWorkerBridgeQaMergeSha !== routeBridgeMergeSha) fail('route bridge merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.handoff?.allowedClass !== allowedClass) fail('handoff allowed class mismatch')
if (record.handoff?.routePath !== routePath) fail('handoff route path mismatch')
if (record.handoff?.confirmationGate !== confirmGate) fail('handoff confirmation gate mismatch')
for (const key of ['idempotencyRequired', 'artifactManifestRequired', 'qaReportRequired', 'cleanupPolicyRequired']) {
  if (record.handoff?.[key] !== true) fail(`handoff requirement missing: ${key}`)
}
if (record.acceptedRuntimeEvidence?.runId !== runId) fail('accepted run ID mismatch')
if (record.acceptedRuntimeEvidence?.httpStatus !== 201) fail('HTTP status mismatch')
if (record.acceptedRuntimeEvidence?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer evidence mismatch')
if (record.acceptedRuntimeEvidence?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix evidence mismatch')
if (record.readiness?.gstreamer !== readiness) fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix readiness mismatch')
if (record.readiness?.externalAgentHandoff !== handoffReadiness) fail('handoff readiness mismatch')
for (const [key, value] of Object.entries(record.blockedScope ?? {})) {
  if (value !== true) fail(`blocked scope must remain true: ${key}`)
}
for (const [key, value] of Object.entries(record.handoffPhaseSafety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail(`${key} safety flag must be true`)
  } else if (value !== false) {
    fail(`handoff safety flag must be false: ${key}`)
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
  if (pattern.test(changedCorpus)) fail(`forbidden changed-file claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  readiness: record.readiness,
  changedFiles: uniqueChangedFiles,
}, null, 2))
