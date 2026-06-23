import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'

const packetDir = 'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'synthetic-evidence-review.json',
  'synthetic-evidence-review.md',
  'private-fixture-policy-review.json',
  'private-fixture-policy-review.md',
  'trackb-ffmpeg-ffprobe-boundary-review.json',
  'trackb-ffmpeg-ffprobe-boundary-review.md',
  'render-export-boundary-review.json',
  'render-export-boundary-review.md',
  'artifact-privacy-review.json',
  'artifact-privacy-review.md',
  'future-command-scope-plan.json',
  'future-command-scope-plan.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'private-fixture-scope-decision.json',
  'private-fixture-scope-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
  'post-merge-safety-closure.json',
  'post-merge-safety-closure.md',
].map((file) => `${packetDir}/${file}`)

const requiredFiles = [
  ...requiredReports,
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-approval-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1r-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
]

const privateFixtureApprovalFiles = [
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-source-approval.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-source-approval.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/tool-command-approval.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/tool-command-approval.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/artifact-log-policy.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/artifact-log-policy.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/boundary-preservation-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/boundary-preservation-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/future-execution-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/future-execution-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/runtime-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/runtime-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-approval-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-approval-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/validation-results.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/post-667-reconciliation.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/post-667-reconciliation.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-plan-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1r-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...privateFixtureApprovalFiles,
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/generated-synthetic-private-fixture-design.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/generated-synthetic-private-fixture-design.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/gstreamer-command-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/gstreamer-command-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/mkvtoolnix-command-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/mkvtoolnix-command-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/privacy-artifact-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/privacy-artifact-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/boundary-preservation-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/boundary-preservation-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/future-execution-validation-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/future-execution-validation-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/runtime-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/runtime-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/private-fixture-plan-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/private-fixture-plan-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-target-image-check.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-target-image-check.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/run-directory-fixture-design.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/run-directory-fixture-design.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/gstreamer-execution-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/gstreamer-execution-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/mkvtoolnix-execution-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/mkvtoolnix-execution-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/artifact-privacy-cleanup-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/artifact-privacy-cleanup-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/boundary-verification.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/boundary-verification.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/latency-cost-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/latency-cost-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/safety-scan-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/safety-scan-report.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/status-matrix.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/status-matrix.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'package.json',
])

const decision = 'tracka_gstreamer_mkvtoolnix_private_fixture_scope_decision_passed_ready_for_private_fixture_approval'
const nextPrompt = 'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-APPROVAL-1'

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-SCOPE-DECISION-1',
  '#652',
  'a9256e97bcded71f7b72a611261471cdb5739a94',
  'a3074af2eff53380402708ee055fa0db70b2f77a',
  '2026-06-22T14:52:30Z',
  'completed_gstreamer_mkvtoolnix_controlled_synthetic_fixture_proof',
  '2026-06-22T14-31-44-660Z-390958ab',
  'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  'gst-launch-1.0 -q fakesrc num-buffers=3 ! fakesink',
  'mkvmerge -o synthetic-subtitle-only.mkv synthetic.srt',
  'mkvmerge --identify synthetic-subtitle-only.mkv',
  decision,
  nextPrompt,
  'Product-ready end-to-end local OSS tools: `0`',
  'FFmpeg/FFprobe remain Track B-owned shared dependencies only.',
  'GStreamer execution: `not_run`',
  'MKVToolNix execution: `not_run`',
  'Pushed PR path FFmpeg/FFprobe execution: `not_run`',
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-SCOPE-DECISION-1R',
  '535b6003606430df88e6905ecd2db36be19a9e8b',
  'pushed PR path did not execute FFmpeg/FFprobe',
  'local unpushed ad hoc safety-scan quoting error invoked `ffprobe` with no media input',
  'produced no artifacts',
  'not accepted source evidence',
  'must not be repeated',
  'Future safety scans must avoid shell patterns that accidentally invoke tool binaries.',
  'Private/user/real media: `not_used`',
  'Media processing: `not_run`',
  'Render/export: `not_run`',
  'Docker build/run: `not_run`',
  'Supabase/SQL/GCS: `not_touched`',
  'Public artifacts/signed URLs: `not_created`',
  'Beta/production: `not_unlocked`',
  'Supabase Classification',
  'Migration deployed: `no`',
]

const forbiddenPatterns = [
  /GStreamer execution:\s*`?(true|completed|passed|run|executed)/i,
  /MKVToolNix execution:\s*`?(true|completed|passed|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(true|completed|passed|run|executed)/i,
  /FFmpeg execution:\s*`?(true|completed|passed|run|executed)/i,
  /FFprobe execution:\s*`?(true|completed|passed|run|executed)/i,
  /Private\/user\/real media:\s*`?(true|used|processed)/i,
  /private media execution:\s*`?(true|completed|passed|run|executed)/i,
  /user media execution:\s*`?(true|completed|passed|run|executed)/i,
  /real media execution:\s*`?(true|completed|passed|run|executed)/i,
  /Media processing:\s*`?(true|completed|passed|run|executed)/i,
  /Render\/export:\s*`?(true|enabled|completed|passed|run|executed)/i,
  /Docker build\/run:\s*`?(true|completed|passed|run|executed)/i,
  /Supabase\/SQL\/GCS:\s*`?(touched|mutated|executed|uploaded|true)/i,
  /Public artifacts\/signed URLs:\s*`?(created|enabled|true)/i,
  /Beta\/production:\s*`?(unlocked|enabled|true)/i,
  /Raw prompts?:\s*`?(executed|true)/i,
  /Secret payload printing:\s*`?(true|enabled|printed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /40\+ tools.*end-to-end/i,
  /private\/user media readiness is claimed/i,
  /(private fixture execution now|private fixture execution in this phase|private fixture execution performed):\s*`?(authorized|approved|enabled|true)/i,
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

for (const file of requiredReports.filter((file) => file.endsWith('.json'))) {
  try {
    JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON report ${file}: ${error.message}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-private-fixture-scope-decision-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:gstreamer-mkvtoolnix-private-fixture-scope-decision-1:diagnostics')
}

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
    fail(`unqualified FFmpeg/FFprobe not-run claim must be scoped to the pushed PR path: ${trimmed}`)
  }
  if (/no FFmpeg\/FFprobe execution occurred/i.test(trimmed) && !/(pushed PR path|guarded PR path)/i.test(trimmed)) {
    fail(`unqualified no-FFmpeg/FFprobe execution claim: ${trimmed}`)
  }
}

const artifactManifest = JSON.parse(read(`${packetDir}/private-artifact-manifest.json`))
for (const key of [
  'private_artifacts_created',
  'public_artifacts_created',
  'signed_urls_created',
  'gcs_uploads',
  'media_files_used',
  'generated_outputs_committed',
]) {
  if (!Array.isArray(artifactManifest[key]) || artifactManifest[key].length !== 0) {
    fail(`artifact manifest must keep ${key} empty`)
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

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (/\.(mkv|srt|mp4|mov|avi|wav|mp3|m4a)$/i.test(file)) fail(`media artifact changed unexpectedly: ${file}`)
  if (file.startsWith('dist') || file.includes('/dist')) fail(`generated dist output changed unexpectedly: ${file}`)
  if (file === 'package-lock.json') fail('package-lock.json must not be changed')
  if (file === '.dockerignore' || file.startsWith('docker/')) fail(`Docker/.dockerignore changed unexpectedly: ${file}`)
  if (file.startsWith('src/') || file.startsWith('server/')) fail(`runtime source changed unexpectedly: ${file}`)
  if (file.startsWith('supabase/') || file.startsWith('database/') || file.endsWith('.sql')) fail(`Supabase/SQL changed unexpectedly: ${file}`)
  if (file.includes('node_modules')) fail(`node_modules must not be changed: ${file}`)
}

const stagedGenerated = git(['diff', '--cached', '--name-only', '--', 'dist', 'dist-server', 'node_modules'])
if (stagedGenerated) fail(`generated output staged unexpectedly: ${stagedGenerated}`)

const forbiddenChangedContent = [
  /renderMedia\s*\(/,
  /renderStill\s*\(/,
  /getCompositions\s*\(/,
  /^\s*(docker|podman)\s+(build|run|push|compose)\b/m,
  /\b(Docker|Cloud Run)\s+(push|deployment):\s*`?(completed|enabled|true)/i,
  /signed\s+url\s*:\s*`?(created|enabled|true)/i,
  /public\s+artifact\s*:\s*`?(created|enabled|true)/i,
  /Supabase\s+(mutation|SQL)\s*:\s*`?(executed|mutated|true)/i,
  /beta\/production\/final delivery unlock:\s*`?(enabled|unlocked|true)/i,
]

for (const file of changedFiles) {
  if (!existsSync(file) || !statSync(file).isFile()) continue
  const text = read(file)
  for (const pattern of forbiddenChangedContent) {
    if (pattern.test(text)) fail(`forbidden changed-file content matched ${pattern} in ${file}`)
  }
}

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-SCOPE-DECISION-1 diagnostics passed')
