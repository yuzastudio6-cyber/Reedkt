import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-source-audit.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-runtime-result.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-command-matrix.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-artifact-manifest-summary.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-duplicate-scan.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-blocked-scope-register.md',
  'docs/track-a/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-next-phase-plan.md',
  'docs/activation-phase-tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
])

const requiredText = [
  'TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1 decision: completed_gstreamer_mkvtoolnix_no_media_runtime_proof',
  'Execution: `completed_no_media_runtime_command_checks`',
  'GStreamer readiness: `ready_for_controlled_synthetic_fixture_planning`',
  'MKVToolNix readiness: `ready_for_controlled_synthetic_fixture_planning`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Run ID: `2026-06-22T03-09-19-435Z-786d1380`',
  'Local output directory: `/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1/2026-06-22T03-09-19-435Z-786d1380`',
  'Image tag: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8`',
  'Image source: `reused_local_609_proof_image`',
  'Fresh render-worker Docker build: `not_run_reused_609_image`',
  'Prebuilt worker output generation: `not_run_reused_609_image`',
  'command -v gst-launch-1.0',
  'command -v gst-inspect-1.0',
  'command -v mkvmerge',
  'gst-launch-1.0 --version',
  'gst-inspect-1.0 --version',
  'mkvmerge --version',
  'gst-inspect-1.0 coreelements',
  'gst-inspect-1.0 fakesrc',
  'gst-inspect-1.0 fakesink',
  'gst-launch-1.0 version 1.22.0',
  'gst-inspect-1.0 version 1.22.0',
  "mkvmerge v74.0.0 ('You Oughta Know') 64-bit",
  'gstreamer-mkvtoolnix-no-media-runtime-proof-1-report.json',
  'gstreamer-mkvtoolnix-no-media-runtime-proof-1-manifest.json',
  'c36f2ef4d1336062efd3f39b5b47a3e83b8474c0e8b66551eb9304690fbdfef4',
  'f059353a62e94a678c8f758f7de37615a5da7f3f637cfb09ae9379dce9bb61fb',
  '#601',
  'f19c173a6a3d9a4cf381fc23826bd14a6385bc1f',
  '#624',
  'afc9983cecaef0eeeb536409c16c3e0ad2eda7c6',
  '#609',
  'e36b1a691eb1616cde95ba89bd51f480a337997c',
  '#577 is draft/open/blocked/conflicting and excluded as source-of-truth',
  'FFmpeg/FFprobe remain Track B-owned shared dependencies only.',
  'Atlas Track A does not claim FFmpeg/FFprobe ownership or install proof.',
  'Atlas Track A does not claim Track B media OSS tools.',
  'Atlas Track A does not claim AI Graphics / Worker tools.',
  'Atlas Track A does not claim Worker Runtime infrastructure.',
  'Atlas Track A does not claim Supabase schema/RLS/migrations.',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1 readiness: ready_for_future_owner_approved_planning',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3 readiness: ready_for_resolved_identity_install_source_planning',
  'TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1 readiness: unchanged_ready_for_scope_decision_planning',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, media processing, runtime media execution, FFmpeg/FFprobe execution, GStreamer pipeline execution, MKVToolNix media execution, Docker push, Docker deployment, or broad service-role handler was enabled. Runtime proof was limited to no-media command availability/version/help checks for Atlas Track A GStreamer and MKVToolNix inside the local repo-owned render-worker image.',
]

const forbiddenPatterns = [
  /GStreamer pipeline execution:\s*`?(true|completed|passed|run)/i,
  /MKVToolNix media execution:\s*`?(true|completed|passed|run)/i,
  /runtime media execution:\s*`?true/i,
  /media processing:\s*`?(true|completed|passed|run)/i,
  /FFmpeg execution:\s*`?(true|completed|passed|run)/i,
  /FFprobe execution:\s*`?(true|completed|passed|run)/i,
  /Remotion execution:\s*`?(true|completed|passed|run)/i,
  /Supabase mutation:\s*`?(true|completed|passed|run)/i,
  /SQL execution:\s*`?(true|completed|passed|run)/i,
  /Docker push:\s*`?(true|completed|passed|run)/i,
  /Docker deployment:\s*`?(true|completed|passed|run)/i,
  /signed URL creation:\s*`?(true|enabled|completed|created)/i,
  /public artifact creation:\s*`?(true|enabled|completed|created)/i,
  /internal beta unlock:\s*`?(true|enabled|completed)/i,
  /external beta unlock:\s*`?(true|enabled|completed)/i,
  /production unlock:\s*`?(true|enabled|completed)/i,
  /final render\/export:\s*`?(true|enabled|completed|passed|run)/i,
  /Atlas Track A (claims|owns).*`ffmpeg`/i,
  /Atlas Track A (claims|owns).*`ffprobe`/i,
  /Atlas Track A (claims|owns).*`sam2`/i,
  /Atlas Track A (claims|owns).*`kornia`/i,
  /Atlas Track A (claims|owns).*`real_esrgan`/i,
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

const packageJson = JSON.parse(read('package.json'))
const expectedScripts = {
  'tracka:gstreamer-mkvtoolnix-no-media-runtime-proof-1': 'node scripts/validation/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1.mjs',
  'tracka:gstreamer-mkvtoolnix-no-media-runtime-proof-1:diagnostics': 'node scripts/validation/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1-diagnostics.mjs',
}
for (const [name, command] of Object.entries(expectedScripts)) {
  if (packageJson.scripts?.[name] !== command) fail(`missing package script: ${name}`)
}

const runner = read('scripts/validation/tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1.mjs')
for (const token of [
  'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_NO_MEDIA_RUNTIME_PROOF',
  'blocked_pending_gstreamer_mkvtoolnix_no_media_runtime_confirmation',
  'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  'blocked_unexpected_gstreamer_pipeline_execution',
  'blocked_unexpected_mkvtoolnix_media_execution',
  'blocked_no_media_command_path_check_failed',
  'blocked_no_media_runtime_command_check_failed',
  '--network',
  'none',
  'gst-launch-1.0 --version',
  'gst-inspect-1.0 coreelements',
  'mkvmerge --version',
  'completed_gstreamer_mkvtoolnix_no_media_runtime_proof',
  'completed_no_media_runtime_command_checks',
]) {
  if (!runner.includes(token)) fail(`missing runner token: ${token}`)
}

const combined = requiredFiles
  .filter((file) => file.endsWith('.md'))
  .map((file) => read(file))
  .join('\n')

for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', env: gitEnv }).trim()
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
  if (file.includes('package-lock.json')) fail('package-lock.json must not be changed')
  if (file.startsWith('docker/')) fail(`Dockerfile/install source changed unexpectedly: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/')) fail(`runtime/source changed unexpectedly: ${file}`)
  if (file.startsWith('supabase/') || file.startsWith('database/') || file.endsWith('.sql')) fail(`Supabase/SQL changed unexpectedly: ${file}`)
  if (file.includes('dist-') || file.startsWith('dist/')) fail(`generated output changed unexpectedly: ${file}`)
  if (file.includes('._') || file.endsWith('.DS_Store')) fail(`macOS metadata file changed unexpectedly: ${file}`)
}

const stagedGenerated = git(['diff', '--cached', '--name-only', '--',
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
])
if (stagedGenerated) fail('generated build outputs must not be staged')

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1 diagnostics passed')
