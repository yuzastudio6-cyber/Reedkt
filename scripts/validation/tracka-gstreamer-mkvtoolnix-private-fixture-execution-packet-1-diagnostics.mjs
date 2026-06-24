import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const packetDir = 'docs/track-a/gstreamer-mkvtoolnix/private-fixture-execution-packet'
const downstreamQaRepairFiles = [
  'docs/activation-phase-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-results.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/controlled-generated-private-fixture-qa-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/controlled-generated-private-fixture-qa-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/qa-status-matrix.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/qa-status-matrix.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/runtime-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/runtime-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/source-refresh-after-pr-680-drift.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/source-refresh-after-pr-680-drift.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/live-head-draft-readiness-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/live-head-draft-readiness-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/dependency-validation-gate-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/dependency-validation-gate-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/post-merge-dependency-gate-reconciliation.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/post-merge-dependency-gate-reconciliation.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/validation-results.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs',
]

const requiredFiles = [
  `${packetDir}/reconciliation.md`,
  `${packetDir}/reconciliation.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/status-matrix.md`,
  `${packetDir}/status-matrix.json`,
  `${packetDir}/validation-results.md`,
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  `${packetDir}/reconciliation.md`,
  `${packetDir}/reconciliation.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/status-matrix.md`,
  `${packetDir}/status-matrix.json`,
  `${packetDir}/validation-results.md`,
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1r-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1r-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1-diagnostics.mjs',
  ...downstreamQaRepairFiles,
  'package.json',
])

function isPostPr697ReviewChangedFile(file) {
  return file.startsWith('docs/track-a/native-container-render-tools/post-pr697-install-proof-3-review/')
    || file === 'docs/production-beta-blocker-inventory.md'
    || file === 'docs/implementation-prompts/prompt-tracka-gpac-mp4box-package-source-resolution-1.md'
    || file === 'scripts/validation/tracka-install-proof-3-post-pr697-review-diagnostics.mjs'
    || file === 'scripts/validation/tracka-native-container-render-tools-install-proof-3-diagnostics.mjs'
    || file === 'scripts/validation/tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-diagnostics.mjs'
    || file === 'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs'
}

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-EXECUTION-PACKET-1',
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-EXECUTION-PACKET-1 decision: satisfied_by_merged_controlled_generated_private_fixture_execution_1',
  'satisfied_by_merged_controlled_generated_private_fixture_execution_1',
  'completed_docs_only_post_673_reconciliation_no_runtime_execution',
  'Private fixture execution in this reconciliation phase: `false`',
  'PR #673',
  '536d24bbe37763b8262e3b70dd8950e264482dfd',
  'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-EXECUTION-1',
  'PR #675',
  'b9c4136850b5247a2b1e300a18804674df99731d',
  'PR #666',
  '5df02d3d5920f1329c5058e772fdcd669cb03824',
  'PR #662',
  'ba3d8d5850601a8effb4ec971cbefb0ff7f786a9',
  'PR #667',
  '45ed9fc7325fdae722e0e8cb9b1282f70e147000',
  'PR #659',
  '535b6003606430df88e6905ecd2db36be19a9e8b',
  'PR #652',
  'a9256e97bcded71f7b72a611261471cdb5739a94',
  'PR #649',
  '7aaa0b5b8004a401e92b23da5ad3444b3e59cec9',
  'PR #609',
  'e36b1a691eb1616cde95ba89bd51f480a337997c',
  'PR #601',
  'f19c173a6a3d9a4cf381fc23826bd14a6385bc1f',
  'PR #624',
  'afc9983cecaef0eeeb536409c16c3e0ad2eda7c6',
  'PR #577 remains open, draft, blocked/conflicting, and excluded as source-of-truth',
  'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-QA-REVIEW-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
  'no Atlas Track A ownership claim',
]

const forbiddenPatterns = [
  /Private fixture execution in this reconciliation phase:\s*`?true/i,
  /Docker execution:\s*`?(true|completed|passed|run|executed)/i,
  /Remotion execution:\s*`?(true|completed|passed|run|executed)/i,
  /private media processing:\s*`?(true|completed|passed|run|executed)/i,
  /user media processing:\s*`?(true|completed|passed|run|executed)/i,
  /Supabase mutation:\s*`?(true|completed|passed|run|executed)/i,
  /SQL execution:\s*`?(true|completed|passed|run|executed)/i,
  /signed URL creation:\s*`?(true|created|enabled)/i,
  /public artifact creation:\s*`?(true|created|enabled)/i,
  /package-lock changed:\s*`?true/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

function read(file) {
  return readFileSync(file, 'utf8')
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

for (const file of requiredFiles.filter((file) => file.endsWith('.json'))) {
  try {
    JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON file ${file}: ${error.message}`)
  }
}

const combined = requiredFiles.map((file) => read(file)).join('\n')
for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

const reconciliation = JSON.parse(read(`${packetDir}/reconciliation.json`))
if (reconciliation.decision !== 'satisfied_by_merged_controlled_generated_private_fixture_execution_1') {
  fail('reconciliation decision drift')
}
if (reconciliation.execution !== 'completed_docs_only_post_673_reconciliation_no_runtime_execution') {
  fail('reconciliation execution drift')
}
if (reconciliation.privateFixtureExecutionInThisPhase !== false) {
  fail('privateFixtureExecutionInThisPhase must be false')
}
if (reconciliation.sourceOfTruthExecutionMergeSha !== '536d24bbe37763b8262e3b70dd8950e264482dfd') {
  fail('source-of-truth #673 merge SHA mismatch')
}
if (reconciliation.productReadyEndToEndLocalOssTools !== 0) {
  fail('product-ready local OSS count must remain 0')
}
if (reconciliation.supabase?.status !== 'not_applicable_docs_only') {
  fail('Supabase classification must remain not_applicable_docs_only')
}

const matrix = JSON.parse(read(`${packetDir}/status-matrix.json`))
if (!Array.isArray(matrix.rows) || matrix.rows.length !== 4) fail('status matrix must include four rows')
for (const tool of ['gstreamer_render_pipeline_support', 'mkvtoolnix_container_validation']) {
  const row = matrix.rows.find((candidate) => candidate.tool === tool)
  if (!row) fail(`missing matrix row: ${tool}`)
  if (row.controlledGeneratedPrivateFixtureExecution !== 'completed_by_673') {
    fail(`matrix row must point ${tool} to #673`)
  }
  if (row.privateFixtureExecutionNow !== false) fail(`${tool} must keep privateFixtureExecutionNow false`)
  if (row.productReady !== false) fail(`${tool} must keep productReady false`)
}
for (const tool of ['shared_dependency_ffmpeg_trackb_owned', 'shared_dependency_ffprobe_trackb_owned']) {
  const row = matrix.rows.find((candidate) => candidate.tool === tool)
  if (!row) fail(`missing matrix row: ${tool}`)
  if (row.atlasTrackAOwnershipClaim !== false) fail(`${tool} must not be claimed by Atlas Track A`)
}

const decision = JSON.parse(read('docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.json'))
if (decision.decision !== 'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_execution_passed_ready_for_qa') {
  fail('#673 execution decision source drift')
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-private-fixture-execution-packet-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:gstreamer-mkvtoolnix-private-fixture-execution-packet-1:diagnostics')
}

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', env: gitEnv }).trim()
}

for (const protectedPath of [
  'package-lock.json',
  '.dockerignore',
  'docker',
  'src',
  'server',
  'supabase',
  'database',
]) {
  const changed = git(['diff', '--name-only', 'HEAD', '--', protectedPath])
  if (changed) fail(`protected path changed unexpectedly: ${changed}`)
}

const diffFiles = git(['diff', '--name-only', 'HEAD'])
const untrackedFiles = git(['ls-files', '--others', '--exclude-standard'])
const changedFiles = [...new Set([
  ...(diffFiles ? diffFiles.split('\n') : []),
  ...(untrackedFiles ? untrackedFiles.split('\n') : []),
])].filter(Boolean)

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file) && !isPostPr697ReviewChangedFile(file)) fail(`unexpected changed file: ${file}`)
  if (file === 'package-lock.json') fail('package-lock.json must not be changed')
  if (/\.(mkv|srt|mp4|mov|avi|wav|mp3|m4a|webm)$/i.test(file)) fail(`media/generated artifact changed: ${file}`)
  if (file.startsWith('dist') || file.includes('/dist') || file.includes('node_modules')) {
    fail(`generated dependency/build artifact changed: ${file}`)
  }
  if (file === '.dockerignore' || file.startsWith('docker/')) fail(`Docker path changed unexpectedly: ${file}`)
  if (file.startsWith('src/') || file.startsWith('server/')) fail(`runtime source changed unexpectedly: ${file}`)
  if (file.startsWith('supabase/') || file.startsWith('database/') || file.endsWith('.sql')) {
    fail(`Supabase/SQL changed unexpectedly: ${file}`)
  }
}

const stagedForbidden = git([
  'diff',
  '--cached',
  '--name-only',
  '--',
  'dist',
  'dist-server',
  'node_modules',
  'package-lock.json',
  '.dockerignore',
  'docker',
  'src',
  'server',
  'supabase',
  'database',
])
if (stagedForbidden) fail(`forbidden generated/protected path staged unexpectedly: ${stagedForbidden}`)

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-EXECUTION-PACKET-1 diagnostics passed')
