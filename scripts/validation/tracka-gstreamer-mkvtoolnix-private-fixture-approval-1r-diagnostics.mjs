import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const packetDir = 'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval'

const requiredFiles = [
  `${packetDir}/post-667-reconciliation.md`,
  `${packetDir}/post-667-reconciliation.json`,
  `${packetDir}/private-fixture-approval-decision.md`,
  `${packetDir}/private-fixture-approval-decision.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/future-execution-plan.md`,
  `${packetDir}/future-execution-plan.json`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/runtime-boundary-review.md`,
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-plan-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1r-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-APPROVAL-1R',
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-APPROVAL-1 decision: approved_for_guarded_private_fixture_execution_packet_planning',
  'completed_docs_only_private_fixture_approval',
  'Private fixture execution in this reconciliation phase: `false`',
  'approved_for_separate_guarded_execution_packet_only',
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_PRIVATE_FIXTURE_EXECUTION=true',
  'Product-ready end-to-end local OSS tools: `0`',
  'PR #662 is the original',
  'PR #666 is the current downstream private fixture planning source-of-truth',
  '45ed9fc7325fdae722e0e8cb9b1282f70e147000',
  'PR #577 remains open, draft, blocked/conflicting, and excluded as source-of-truth',
  'FFmpeg/FFprobe execution without Track B coordination and ownership',
  'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-EXECUTION-1',
  'Generated artifacts committed: none',
]

const forbiddenPatterns = [
  /private fixture execution in this (phase|reconciliation phase):\s*`?true/i,
  /GStreamer private fixture execution:\s*`?(true|completed|passed|run|executed)/i,
  /MKVToolNix private fixture execution:\s*`?(true|completed|passed|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(true|completed|passed|run|executed)/i,
  /Docker execution:\s*`?(true|completed|passed|run|executed)/i,
  /Remotion execution:\s*`?(true|completed|passed|run|executed)/i,
  /private media processing:\s*`?(true|completed|passed|run|executed)/i,
  /user media processing:\s*`?(true|completed|passed|run|executed)/i,
  /Supabase mutation:\s*`?(true|completed|passed|run|executed)/i,
  /SQL execution:\s*`?(true|completed|passed|run|executed)/i,
  /signed URL creation:\s*`?(true|created|enabled)/i,
  /public artifact creation:\s*`?(true|created|enabled)/i,
  /internal beta unlock:\s*`?(true|unlocked|enabled)/i,
  /external beta unlock:\s*`?(true|unlocked|enabled)/i,
  /production unlock:\s*`?(true|unlocked|enabled)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const allowedChangedFiles = new Set([
  `${packetDir}/post-667-reconciliation.md`,
  `${packetDir}/post-667-reconciliation.json`,
  `${packetDir}/private-fixture-approval-decision.md`,
  `${packetDir}/private-fixture-approval-decision.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/future-execution-plan.md`,
  `${packetDir}/future-execution-plan.json`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/runtime-boundary-review.md`,
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1r-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1r-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'package.json',
])

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file)
    || file.startsWith('docs/track-a/gstreamer-mkvtoolnix/private-fixture-execution-packet/')
    || file === 'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1.md'
    || (file.startsWith('scripts/validation/tracka-gstreamer-mkvtoolnix-') && file.endsWith('-diagnostics.mjs'))
    || file === 'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1-diagnostics.mjs'
}

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

const reconciliation = JSON.parse(read(`${packetDir}/post-667-reconciliation.json`))
if (reconciliation.privateFixtureExecutionInThisPhase !== false) {
  fail('post-667 reconciliation must keep privateFixtureExecutionInThisPhase false')
}
if (reconciliation.productReadyEndToEndLocalOssTools !== 0) {
  fail('productReadyEndToEndLocalOssTools must remain 0')
}
if (reconciliation.post659SafetyClosureMergeSha !== '45ed9fc7325fdae722e0e8cb9b1282f70e147000') {
  fail('post-#659 safety closure merge SHA mismatch')
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1r-diagnostics.mjs'
if (packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-private-fixture-approval-1r:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:gstreamer-mkvtoolnix-private-fixture-approval-1r:diagnostics')
}

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', env: gitEnv }).trim()
}

const protectedPaths = [
  'package-lock.json',
  '.dockerignore',
  'docker',
  'src',
  'server',
  'supabase',
  'database',
]
for (const protectedPath of protectedPaths) {
  const changed = git(['diff', '--name-only', 'HEAD', '--', protectedPath])
  if (changed) fail(`protected path changed unexpectedly: ${changed}`)
}

const changed = git(['diff', '--name-only', 'HEAD'])
const untracked = git(['ls-files', '--others', '--exclude-standard'])
const changedFiles = [...new Set([
  ...(changed ? changed.split('\n') : []),
  ...(untracked ? untracked.split('\n') : []),
])].filter(Boolean)

for (const file of changedFiles) {
  if (!isAllowedChangedFile(file)) fail(`unexpected changed file: ${file}`)
  if (file === 'package-lock.json') fail('package-lock.json must remain unchanged')
  if (/\.(mkv|srt|mp4|mov|avi|wav|mp3|m4a|webm)$/i.test(file)) fail(`media/generated artifact changed: ${file}`)
  if (file.startsWith('dist') || file.includes('/dist') || file.includes('node_modules')) {
    fail(`generated dependency/build artifact changed: ${file}`)
  }
}

const stagedGenerated = git(['diff', '--cached', '--name-only', '--', 'dist', 'dist-server', 'node_modules'])
if (stagedGenerated) fail(`generated output staged unexpectedly: ${stagedGenerated}`)

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-APPROVAL-1R diagnostics passed')
