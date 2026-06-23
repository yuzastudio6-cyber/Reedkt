import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const packetDir = 'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'private-fixture-source-approval.json',
  'private-fixture-source-approval.md',
  'tool-command-approval.json',
  'tool-command-approval.md',
  'artifact-log-policy.json',
  'artifact-log-policy.md',
  'boundary-preservation-review.json',
  'boundary-preservation-review.md',
  'future-execution-plan.json',
  'future-execution-plan.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'private-fixture-approval-decision.json',
  'private-fixture-approval-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
].map((file) => `${packetDir}/${file}`)

const requiredFiles = [
  ...requiredReports,
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-plan-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
]

const predecessorScopeFiles = [
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/synthetic-evidence-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/synthetic-evidence-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-policy-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-policy-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/trackb-ffmpeg-ffprobe-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/trackb-ffmpeg-ffprobe-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/render-export-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/render-export-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/artifact-privacy-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/artifact-privacy-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/future-command-scope-plan.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/future-command-scope-plan.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/runtime-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/runtime-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-scope-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-scope-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/validation-results.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-approval-1.md',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...requiredReports,
  ...predecessorScopeFiles,
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
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-private-fixture-approval-1.md',
  'package.json',
])

const decision = 'tracka_gstreamer_mkvtoolnix_private_fixture_approval_passed_ready_for_private_fixture_plan'
const nextPrompt = 'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-PLAN-1'

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-APPROVAL-1',
  '#659',
  '535b6003606430df88e6905ecd2db36be19a9e8b',
  '479b7bba918f27e58ecd9591b8fade0b79680d84',
  'tracka_gstreamer_mkvtoolnix_private_fixture_scope_decision_passed_ready_for_private_fixture_approval',
  '#652',
  'a3074af2eff53380402708ee055fa0db70b2f77a',
  'completed_gstreamer_mkvtoolnix_controlled_synthetic_fixture_proof',
  '2026-06-22T14-31-44-660Z-390958ab',
  'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  decision,
  nextPrompt,
  'Product-ready end-to-end local OSS tools: `0`',
  'FFmpeg/FFprobe remain Track B-owned shared dependencies only.',
  'GStreamer execution: `not_run`',
  'MKVToolNix execution: `not_run`',
  'FFmpeg/FFprobe execution: `not_run`',
  'Private/user/real media: `not_used`',
  'Media processing: `not_run`',
  'Render/export: `not_run`',
  'Docker build/run: `not_run`',
  'Supabase/SQL/GCS: `not_touched`',
  'Public artifacts/signed URLs: `not_created`',
  'Beta/production: `not_unlocked`',
  'Migration deployed: `no`',
]

const forbiddenPatterns = [
  /GStreamer execution:\s*`?(true|completed|passed|run|executed)/i,
  /MKVToolNix execution:\s*`?(true|completed|passed|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(true|completed|passed|run|executed)/i,
  /Private\/user\/real media:\s*`?(true|used|processed)/i,
  /Media processing:\s*`?(true|completed|passed|run|executed)/i,
  /Render\/export:\s*`?(true|enabled|completed|passed|run|executed)/i,
  /Docker build\/run:\s*`?(true|completed|passed|run|executed)/i,
  /Supabase\/SQL\/GCS:\s*`?(touched|mutated|executed|uploaded|true)/i,
  /Public artifacts\/signed URLs:\s*`?(created|enabled|true)/i,
  /Beta\/production:\s*`?(unlocked|enabled|true)/i,
  /Raw prompts?:\s*`?(executed|true)/i,
  /Secret payloads? in logs:\s*`?(true|enabled|printed|allowed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /40\+ tools.*end-to-end/i,
  /private fixture execution:\s*`?(authorized|approved|enabled|true)/i,
  /user media:\s*`?(allowed|approved|true)/i,
  /real media:\s*`?(allowed|approved|true)/i,
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
const expectedScript = 'node scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-private-fixture-approval-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:gstreamer-mkvtoolnix-private-fixture-approval-1:diagnostics')
}

const combined = requiredFiles.map((file) => read(file)).join('\n')
for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
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
const untrackedFiles = git(['ls-files', '--others', '--exclude-standard'])
const changedFiles = [...new Set([
  ...(diffFiles ? diffFiles.split('\n') : []),
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

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-APPROVAL-1 diagnostics passed')
