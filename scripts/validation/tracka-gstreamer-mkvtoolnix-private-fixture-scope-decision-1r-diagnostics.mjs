import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'

const packetDir = 'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision'
const closureMd = `${packetDir}/post-merge-safety-closure.md`
const closureJson = `${packetDir}/post-merge-safety-closure.json`
const nextPrompt = 'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-approval-1.md'
const diagnosticsPath = 'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1r-diagnostics.mjs'

const requiredFiles = [
  closureMd,
  closureJson,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/runtime-boundary-review.md`,
  `${packetDir}/runtime-boundary-review.json`,
  `${packetDir}/trackb-ffmpeg-ffprobe-boundary-review.md`,
  `${packetDir}/trackb-ffmpeg-ffprobe-boundary-review.json`,
  `${packetDir}/artifact-privacy-review.md`,
  `${packetDir}/artifact-privacy-review.json`,
  `${packetDir}/private-fixture-scope-decision.md`,
  `${packetDir}/private-fixture-scope-decision.json`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/validation-results.md`,
  nextPrompt,
  diagnosticsPath,
  'package.json',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
])

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-SCOPE-DECISION-1R',
  'completed_docs_only_post_merge_safety_closure',
  '535b6003606430df88e6905ecd2db36be19a9e8b',
  'PR #659 body closure',
  'post_merge_pr_body_updated_after_merge',
  'tracka_gstreamer_mkvtoolnix_private_fixture_scope_decision_passed_ready_for_private_fixture_approval',
  'Private fixture execution in #659: `false`',
  'pushed PR path did not execute FFmpeg/FFprobe',
  'local unpushed ad hoc safety-scan quoting error invoked `ffprobe` with no media input',
  'produced no artifacts',
  'not accepted source evidence',
  'must not be repeated',
  'Future safety scans must avoid shell patterns that accidentally invoke tool binaries.',
  'GStreamer private fixture execution: `not_run`',
  'MKVToolNix private fixture execution: `not_run`',
  'Media processing: `not_run`',
  'Supabase mutation / SQL execution: `none`',
  'Signed/public artifacts: `none`',
  'Beta/production/final delivery unlock: `none`',
  'Product-ready end-to-end local OSS tools: `0`',
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-APPROVAL-1',
  '#577 remains draft/blocked/conflicting and excluded as source-of-truth',
  'Supabase Classification',
  'Status: `not_applicable_docs_only`',
  'Migration deployed: `no`',
]

const forbiddenPatterns = [
  /GStreamer private fixture execution:\s*`?(true|completed|passed|run|executed)/i,
  /MKVToolNix private fixture execution:\s*`?(true|completed|passed|run|executed)/i,
  /private fixture execution:\s*`?(authorized|approved|enabled|true)/i,
  /Media processing:\s*`?(true|completed|passed|run|executed)/i,
  /Supabase mutation \/ SQL execution:\s*`?(executed|mutated|true)/i,
  /SQL executed:\s*`?(true|yes|executed)/i,
  /Signed\/public artifacts:\s*`?(created|enabled|true)/i,
  /Beta\/production\/final delivery unlock:\s*`?(unlocked|enabled|true)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /accepted source evidence["`]?:\s*true/i,
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
    fail(`invalid JSON ${file}: ${error.message}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1r-diagnostics.mjs'
if (packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-private-fixture-scope-decision-1r:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:gstreamer-mkvtoolnix-private-fixture-scope-decision-1r:diagnostics')
}

const closure = JSON.parse(read(closureJson))
if (closure.pr_659?.merge_sha !== '535b6003606430df88e6905ecd2db36be19a9e8b') fail('closure JSON missing #659 merge SHA')
if (closure.private_fixture_execution_in_659 !== false) fail('closure JSON must keep private fixture execution false')
if (closure.product_ready_end_to_end_local_oss_tools !== 0) fail('closure JSON must keep product-ready count at 0')
if (closure.local_unpushed_ad_hoc_safety_scan_quoting_error?.artifacts_produced !== 'none') fail('local ffprobe caveat must record no artifacts')
if (closure.local_unpushed_ad_hoc_safety_scan_quoting_error?.accepted_source_evidence !== false) fail('local ffprobe caveat must not be source evidence')

const combined = requiredFiles.map((file) => read(file)).join('\n')
for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

for (const line of combined.split(/\r?\n/)) {
  const trimmed = line.trim()
  if (/^FFmpeg\/FFprobe execution:\s*`?not_run/i.test(trimmed)) {
    fail(`unqualified FFmpeg/FFprobe not-run claim must be scoped to pushed PR path: ${trimmed}`)
  }
  if (/no FFmpeg\/FFprobe execution occurred/i.test(trimmed) && !/(pushed PR path|guarded PR path)/i.test(trimmed)) {
    fail(`unqualified no-FFmpeg/FFprobe execution claim: ${trimmed}`)
  }
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
const stagedFiles = git(['diff', '--cached', '--name-only'])
const untrackedFiles = git(['ls-files', '--others', '--exclude-standard'])
const changedFiles = [...new Set([
  ...(diffFiles ? diffFiles.split('\n') : []),
  ...(stagedFiles ? stagedFiles.split('\n') : []),
  ...(untrackedFiles ? untrackedFiles.split('\n') : []),
])].filter(Boolean)

const forbiddenPath = /(^package-lock\.json$|^docker\/|^\.dockerignore$|^src\/|^server\/|^supabase\/|^database\/|\.sql$|node_modules|^dist|\/dist|\.(mkv|srt|mp4|mov|avi|wav|mp3|m4a)$)/i
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenPath.test(file)) fail(`forbidden changed path: ${file}`)
}

const forbiddenChangedContent = [
  /renderMedia\s*\(/,
  /renderStill\s*\(/,
  /getCompositions\s*\(/,
  /^\s*(docker|podman)\s+(build|run|push|compose)\b/m,
  /\b(Docker|Cloud Run)\s+(push|deployment):\s*`?(completed|enabled|true)/i,
  /private media processing:\s*`?(completed|enabled|true|run)/i,
  /user media processing:\s*`?(completed|enabled|true|run)/i,
  /signed URL creation:\s*`?(created|enabled|true)/i,
  /public artifact creation:\s*`?(created|enabled|true)/i,
  /internal beta unlock:\s*`?(unlocked|enabled|true)/i,
  /external beta unlock:\s*`?(unlocked|enabled|true)/i,
  /production unlock:\s*`?(unlocked|enabled|true)/i,
  /final render\/export:\s*`?(completed|enabled|true|run)/i,
]

for (const file of changedFiles) {
  if (!existsSync(file) || !statSync(file).isFile()) continue
  const text = read(file)
  for (const pattern of forbiddenChangedContent) {
    if (pattern.test(text)) fail(`forbidden changed-file content matched ${pattern} in ${file}`)
  }
}

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-SCOPE-DECISION-1R diagnostics passed')
