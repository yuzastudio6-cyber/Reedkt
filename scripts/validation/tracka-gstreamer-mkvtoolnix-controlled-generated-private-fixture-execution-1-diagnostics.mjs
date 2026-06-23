import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const packetDir = 'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'source-target-image-check.json',
  'source-target-image-check.md',
  'run-directory-fixture-design.json',
  'run-directory-fixture-design.md',
  'gstreamer-execution-report.json',
  'gstreamer-execution-report.md',
  'mkvtoolnix-execution-report.json',
  'mkvtoolnix-execution-report.md',
  'artifact-privacy-cleanup-report.json',
  'artifact-privacy-cleanup-report.md',
  'boundary-verification.json',
  'boundary-verification.md',
  'latency-cost-report.json',
  'latency-cost-report.md',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'status-matrix.json',
  'status-matrix.md',
  'controlled-generated-private-fixture-execution-decision.json',
  'controlled-generated-private-fixture-execution-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
].map((file) => `${packetDir}/${file}`)

const requiredFiles = [
  ...requiredReports,
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
]

const predecessorDiagnosticFiles = [
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
]

const qaReviewFiles = [
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/source-of-truth-audit.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/gstreamer-evidence-acceptance.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/gstreamer-evidence-acceptance.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/mkvtoolnix-evidence-acceptance.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/mkvtoolnix-evidence-acceptance.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/artifact-cleanup-acceptance.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/artifact-cleanup-acceptance.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/boundary-qa.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/boundary-qa.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/qa-status-matrix.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/qa-status-matrix.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/runtime-boundary-review.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/runtime-boundary-review.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/controlled-generated-private-fixture-qa-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/controlled-generated-private-fixture-qa-decision.md',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/readiness-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review/validation-results.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...predecessorDiagnosticFiles,
  ...qaReviewFiles,
  'package.json',
])

const decision = 'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_execution_passed_ready_for_qa'
const nextPrompt = 'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-QA-REVIEW-1'
const runId = '2026-06-23T03-37-56-bc4d88cf'
const tempRoot = `/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1/${runId}`

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-EXECUTION-1',
  '#666',
  '5df02d3d5920f1329c5058e772fdcd669cb03824',
  '8184a3af6499d1a05f56c95273f0bc44acf8540b',
  'tracka_gstreamer_mkvtoolnix_private_fixture_plan_passed_ready_for_controlled_generated_private_fixture_execution',
  '#662',
  '4ed3cc562ca2656f103282a1344fa060fc75bac5',
  'tracka_gstreamer_mkvtoolnix_private_fixture_approval_passed_ready_for_private_fixture_plan',
  '#659',
  '479b7bba918f27e58ecd9591b8fade0b79680d84',
  'tracka_gstreamer_mkvtoolnix_private_fixture_scope_decision_passed_ready_for_private_fixture_approval',
  '#652',
  'a3074af2eff53380402708ee055fa0db70b2f77a',
  'completed_gstreamer_mkvtoolnix_controlled_synthetic_fixture_proof',
  '2026-06-22T14-31-44-660Z-390958ab',
  'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  'gst-launch-1.0 -q videotestsrc num-buffers=3 ! fakesink',
  'generated-private-subtitles.srt',
  'generated-private-subtitle-only.mkv',
  'mkvmerge -o /proof/generated-private-subtitle-only.mkv /proof/generated-private-subtitles.srt',
  'mkvmerge --identify /proof/generated-private-subtitle-only.mkv',
  'SubRip/SRT',
  'sha256',
  decision,
  nextPrompt,
  'Product-ready end-to-end local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  'Update required: `none`',
  'Environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
]

const forbiddenPatterns = [
  /FFmpeg execution:\s*`?(true|completed|passed|run|executed)/i,
  /FFprobe execution:\s*`?(true|completed|passed|run|executed)/i,
  /FFmpeg\/FFprobe:\s*`?(true|completed|passed|run|executed)/i,
  /user media:\s*`?(used|allowed|approved|true)/i,
  /real media:\s*`?(used|allowed|approved|true)/i,
  /private media:\s*`?(used|allowed|approved|true)/i,
  /broad private folder access:\s*`?(used|allowed|approved|true)/i,
  /GCS upload:\s*`?(true|completed|passed|run|uploaded)/i,
  /Supabase mutation:\s*`?(true|completed|passed|run|executed)/i,
  /SQL execution:\s*`?(true|completed|passed|run|executed)/i,
  /Render\/export:\s*`?(true|enabled|completed|passed|run|executed)/i,
  /Remotion execution:\s*`?(true|enabled|completed|passed|run|executed)/i,
  /Docker build:\s*`?(true|enabled|completed|passed|run|executed)/i,
  /Docker push:\s*`?(true|enabled|completed|passed|run|executed)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /Beta\/production:\s*`?(unlocked|enabled|true)/i,
  /Raw prompts?:\s*`?(executed|true)/i,
  /Secret payloads?:\s*`?(printed|true)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /40\+ tools.*end-to-end/i,
]

const forbiddenEnv = [
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_PRIVATE_MEDIA_EXECUTION',
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_PRIVATE_FIXTURE_PLAN',
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_PRIVATE_FIXTURE_APPROVAL',
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_SYNTHETIC_FIXTURE_PROOF',
  'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
  'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
  'REEDITPRO_CONFIRM_FFMPEG_EXECUTION',
  'REEDITPRO_CONFIRM_FFPROBE_EXECUTION',
  'REEDITPRO_CONFIRM_PRIVATE_MEDIA',
  'REEDITPRO_CONFIRM_USER_MEDIA',
  'REEDITPRO_CONFIRM_REAL_MEDIA',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_MEDIA_FILE_PROBE',
  'REEDITPRO_CONFIRM_RENDER_EXPORT',
  'REEDITPRO_CONFIRM_REMOTION_EXECUTION',
  'REEDITPRO_CONFIRM_BROWSER_CAPTURE',
  'REEDITPRO_CONFIRM_DOCKER_BUILD',
  'REEDITPRO_CONFIRM_DOCKER_PUSH',
  'REEDITPRO_CONFIRM_DEPLOY',
  'REEDITPRO_CONFIRM_GCS_UPLOAD',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_PACKAGE_LOCK_MUTATION',
  'REEDITPRO_CONFIRM_DOCKERFILE_MUTATION',
  'REEDITPRO_CONFIRM_DOCKERIGNORE_MUTATION',
  'REEDITPRO_CONFIRM_RUNTIME_SOURCE_MUTATION',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

function read(file) {
  return readFileSync(file, 'utf8')
}

for (const name of forbiddenEnv) {
  if (process.env[name]) fail(`forbidden confirmation env var is set: ${name}`)
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
const expectedScript = 'node scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1:diagnostics')
}

const combined = requiredFiles.map((file) => read(file)).join('\n')
for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

const decisionReport = JSON.parse(read(`${packetDir}/controlled-generated-private-fixture-execution-decision.json`))
if (decisionReport.decision !== decision) fail('decision drift in controlled-generated-private-fixture-execution-decision.json')
if (decisionReport.next_prompt !== nextPrompt) fail('next prompt drift in controlled-generated-private-fixture-execution-decision.json')
if (decisionReport.productReadyLocalOssTools !== 0) fail('product-ready local OSS count must remain 0')

const imageCheck = JSON.parse(read(`${packetDir}/source-target-image-check.json`))
if (imageCheck.dockerBuildNeeded !== false) fail('Docker build must not be required in source-target-image-check.json')
if (imageCheck.imageAvailability !== 'present_local_image') fail('approved local image availability is not recorded')

const gst = JSON.parse(read(`${packetDir}/gstreamer-execution-report.json`))
if (gst.exitStatus !== 0 || gst.fileOutput !== false) fail('GStreamer report must show exit 0 with no file output')

const mkv = JSON.parse(read(`${packetDir}/mkvtoolnix-execution-report.json`))
if (mkv.mergeExitStatus !== 0 || mkv.identifyExitStatus !== 0) fail('MKVToolNix report must show merge and identify exit 0')
if (mkv.generatedSubtitle?.name !== 'generated-private-subtitles.srt') fail('unexpected generated subtitle name')
if (mkv.generatedMkv?.name !== 'generated-private-subtitle-only.mkv') fail('unexpected generated MKV name')

const cleanup = JSON.parse(read(`${packetDir}/artifact-privacy-cleanup-report.json`))
if (cleanup.cleanupCompleted !== true || cleanup.runRootRemoved !== true) fail('artifact cleanup did not complete')
if (existsSync(tempRoot)) fail(`temp run root still exists: ${tempRoot}`)

const manifest = JSON.parse(read(`${packetDir}/private-artifact-manifest.json`))
for (const key of [
  'committedArtifacts',
  'privateArtifactsCreated',
  'userMediaUsed',
  'realMediaUsed',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'gcsUploads',
]) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) {
    fail(`private artifact manifest must keep ${key} empty`)
  }
}
if (manifest.cleanupStatus !== 'completed') fail('private artifact manifest cleanupStatus must be completed')

const statusMatrix = JSON.parse(read(`${packetDir}/status-matrix.json`))
if (!Array.isArray(statusMatrix.rows) || statusMatrix.rows.length !== 2) fail('status matrix must include exactly GStreamer and MKVToolNix rows')
for (const row of statusMatrix.rows) {
  if (row.proofPassed !== true) fail(`status matrix proof did not pass for ${row.tool}`)
  if (row.artifactsCleaned !== true) fail(`status matrix cleanup did not pass for ${row.tool}`)
  if (row.productReady !== false) fail(`status matrix must keep productReady false for ${row.tool}`)
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

if (git(['diff', '--name-only', '--', 'package-lock.json'])) {
  fail('package-lock.json must remain unchanged')
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
  if (file.includes('node_modules')) fail(`node_modules must not be changed: ${file}`)
  if (file === 'package-lock.json') fail('package-lock.json must not be changed')
  if (file === '.dockerignore' || file.startsWith('docker/')) fail(`Docker/.dockerignore changed unexpectedly: ${file}`)
  if (file.startsWith('src/') || file.startsWith('server/')) fail(`runtime source changed unexpectedly: ${file}`)
  if (file.startsWith('supabase/') || file.startsWith('database/') || file.endsWith('.sql')) fail(`Supabase/SQL changed unexpectedly: ${file}`)
}

const stagedForbidden = git(['diff', '--cached', '--name-only', '--',
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

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-EXECUTION-1 diagnostics passed')
