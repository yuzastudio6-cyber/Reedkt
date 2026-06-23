import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const packetDir = 'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-qa-review'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'gstreamer-evidence-acceptance.json',
  'gstreamer-evidence-acceptance.md',
  'mkvtoolnix-evidence-acceptance.json',
  'mkvtoolnix-evidence-acceptance.md',
  'artifact-cleanup-acceptance.json',
  'artifact-cleanup-acceptance.md',
  'boundary-qa.json',
  'boundary-qa.md',
  'qa-status-matrix.json',
  'qa-status-matrix.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'controlled-generated-private-fixture-qa-decision.json',
  'controlled-generated-private-fixture-qa-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
].map((file) => `${packetDir}/${file}`)

const predecessorFiles = [
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/source-of-truth-audit.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/gstreamer-execution-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/mkvtoolnix-execution-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/artifact-privacy-cleanup-report.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/controlled-generated-private-fixture-execution-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/controlled-generated-private-fixture-execution/private-artifact-manifest.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/private-fixture-plan-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-approval/private-fixture-approval-decision.json',
  'docs/track-a/gstreamer-mkvtoolnix/private-fixture-scope-decision/private-fixture-scope-decision.json',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1.md',
]

const requiredFiles = [
  ...requiredReports,
  ...predecessorFiles,
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
]

const allowedChangedFiles = new Set([
  ...requiredReports,
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'package.json',
])

const decision = 'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_qa_passed_ready_for_tracka_native_container_tools_rollup'
const nextPrompt = 'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1'
const tempRoot = '/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1/2026-06-23T03-37-56-bc4d88cf'

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-QA-REVIEW-1',
  '#673',
  '536d24bbe37763b8262e3b70dd8950e264482dfd',
  '71705e3b6081cf2e0e4870d2e24e7f29f421dfec',
  'tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_execution_passed_ready_for_qa',
  '#666',
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
  'gst-launch-1.0 -q videotestsrc num-buffers=3 ! fakesink',
  'generated-private-subtitles.srt',
  'generated-private-subtitle-only.mkv',
  'SubRip/SRT',
  '2487edd658e8459b7818baf0422c8db6679f693020d78aeb90d5be0fb5aa446b',
  'ea659dec22a7492be8af90a521be03f76367723e99570e32e9f3b59d68ec1b82',
  decision,
  nextPrompt,
  'Product-ready end-to-end local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  'QA-phase GStreamer execution: `not_run`',
  'QA-phase MKVToolNix execution: `not_run`',
  'QA-phase FFmpeg/FFprobe execution: `not_run`',
  'QA-phase Docker build/run: `not_run`',
  'Private/user/real media: `not_used`',
  'Update required: `none`',
  'Environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
]

const forbiddenPatterns = [
  /QA-phase GStreamer execution:\s*`?(true|completed|passed|run|executed)/i,
  /QA-phase MKVToolNix execution:\s*`?(true|completed|passed|run|executed)/i,
  /QA-phase FFmpeg\/FFprobe execution:\s*`?(true|completed|passed|run|executed)/i,
  /QA-phase Docker build\/run:\s*`?(true|completed|passed|run|executed)/i,
  /private\/user\/real media:\s*`?(true|used|processed|allowed|approved)/i,
  /user media:\s*`?(used|allowed|approved|true)/i,
  /real media:\s*`?(used|allowed|approved|true)/i,
  /arbitrary media probing:\s*`?(used|allowed|approved|true)/i,
  /media processing:\s*`?(true|completed|passed|run|executed)/i,
  /render\/export:\s*`?(true|enabled|completed|passed|run|executed)/i,
  /Supabase\/SQL\/GCS:\s*`?(touched|mutated|executed|uploaded|true)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /beta\/production:\s*`?(unlocked|enabled|true)/i,
  /raw prompts?:\s*`?(executed|true)/i,
  /secret payloads?:\s*`?(printed|true)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /40\+ tools.*end-to-end/i,
]

const forbiddenEnv = [
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_SYNTHETIC_FIXTURE_PROOF',
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_PRIVATE_MEDIA_EXECUTION',
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_PRIVATE_FIXTURE_EXECUTION',
  'REEDITPRO_CONFIRM_FFMPEG_EXECUTION',
  'REEDITPRO_CONFIRM_FFPROBE_EXECUTION',
  'REEDITPRO_CONFIRM_DOCKER_BUILD',
  'REEDITPRO_CONFIRM_DOCKER_RUN',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_RENDER_EXPORT',
  'REEDITPRO_CONFIRM_REMOTION_EXECUTION',
  'REEDITPRO_CONFIRM_BROWSER_CAPTURE',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_GCS_UPLOAD',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
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
const expectedScript = 'node scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1:diagnostics')
}

const combined = requiredFiles.map((file) => read(file)).join('\n')
for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

const decisionReport = JSON.parse(read(`${packetDir}/controlled-generated-private-fixture-qa-decision.json`))
if (decisionReport.decision !== decision) fail('decision drift in QA decision report')
if (decisionReport.next_prompt !== nextPrompt) fail('next prompt drift in QA decision report')
if (decisionReport.productReadyLocalOssTools !== 0) fail('product-ready local OSS count must remain 0')
if (decisionReport.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B FFmpeg/FFprobe ownership must be preserved')

const gst = JSON.parse(read(`${packetDir}/gstreamer-evidence-acceptance.json`))
if (gst.accepted !== true || gst.sourcePullRequest !== 673) fail('GStreamer evidence must accept PR #673')
if (gst.exitStatus !== 0 || gst.fileOutput !== false || gst.networkDisabled !== true) fail('GStreamer evidence must be exit 0, network disabled, and no file output')
if (gst.qaPhaseExecution !== false) fail('GStreamer must not execute in QA phase')
if (!gst.acceptedPipeline.includes('videotestsrc num-buffers=3 ! fakesink')) fail('GStreamer accepted pipeline drift')

const mkv = JSON.parse(read(`${packetDir}/mkvtoolnix-evidence-acceptance.json`))
if (mkv.accepted !== true || mkv.sourcePullRequest !== 673) fail('MKVToolNix evidence must accept PR #673')
if (mkv.mergeExitStatus !== 0 || mkv.identifyExitStatus !== 0 || mkv.networkDisabled !== true) fail('MKVToolNix evidence must be exit 0 and network disabled')
if (mkv.qaPhaseExecution !== false) fail('MKVToolNix must not execute in QA phase')
if (mkv.generatedSubtitle?.name !== 'generated-private-subtitles.srt') fail('unexpected subtitle fixture name')
if (mkv.generatedMkv?.name !== 'generated-private-subtitle-only.mkv') fail('unexpected MKV fixture name')

const cleanup = JSON.parse(read(`${packetDir}/artifact-cleanup-acceptance.json`))
if (cleanup.accepted !== true || cleanup.cleanupCompleted !== true || cleanup.runRootRemoved !== true) fail('cleanup evidence must be accepted and complete')
if (cleanup.generatedMediaArtifactsCommitted !== false || cleanup.tmpArtifactsCopiedToRepo !== false) fail('generated artifacts must not be committed or copied')
if (existsSync(tempRoot)) fail(`temp run root still exists: ${tempRoot}`)

const boundary = JSON.parse(read(`${packetDir}/boundary-qa.json`))
if (boundary.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('boundary QA must preserve Track B FFmpeg/FFprobe ownership')
if (boundary.productReadyLocalOssTools !== 0) fail('boundary QA must keep product-ready count 0')
for (const [scope, status] of Object.entries(boundary.blockedScope)) {
  if (status !== 'blocked') fail(`blocked scope drift for ${scope}: ${status}`)
}

const statusMatrix = JSON.parse(read(`${packetDir}/qa-status-matrix.json`))
if (!Array.isArray(statusMatrix.rows) || statusMatrix.rows.length !== 2) fail('QA status matrix must include exactly two rows')
for (const row of statusMatrix.rows) {
  if (row.qaAccepted !== true) fail(`QA row must be accepted for ${row.tool}`)
  if (row.qaPhaseExecution !== false) fail(`QA row must not execute for ${row.tool}`)
  if (row.productReady !== false) fail(`QA row must keep productReady false for ${row.tool}`)
}

const runtimeBoundary = JSON.parse(read(`${packetDir}/runtime-boundary-review.json`))
for (const [key, value] of Object.entries(runtimeBoundary)) {
  if (key === 'supabaseClassification') continue
  if (value !== false) fail(`runtime boundary must remain false for ${key}`)
}

const manifest = JSON.parse(read(`${packetDir}/private-artifact-manifest.json`))
for (const key of [
  'committedArtifacts',
  'privateArtifactsCreated',
  'userMediaUsed',
  'realMediaUsed',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'gcsUploads',
  'tmpArtifactsCopiedToRepo',
  'qaPhaseArtifactsCreated',
]) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) {
    fail(`private artifact manifest must keep ${key} empty`)
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

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-QA-REVIEW-1 diagnostics passed')
