import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-native-container-render-tools-batch-2.md',
  'docs/track-a/tracka-native-container-render-tools-batch-2-tool-matrix.md',
  'docs/track-a/tracka-native-container-render-tools-batch-2-identity-reviews.md',
  'docs/track-a/tracka-native-container-render-tools-batch-2-build-proof-support.md',
  'docs/activation-phase-tracka-native-container-render-tools-batch-2-results.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-tool-matrix.md',
  'docs/activation-phase-tracka-native-container-package-identity-batch-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-bento4-mp4box-package-identity-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-vapoursynth-native-policy-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-revideo-package-identity-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3.md',
  'docs/activation-phase-tracka-native-container-render-tools-build-proof-3-results.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-build-proof-3.md',
  'scripts/validation/tracka-native-container-render-tools-build-proof-3.mjs',
  'scripts/validation/tracka-native-container-render-tools-build-proof-3-diagnostics.mjs',
  'scripts/validation/tracka-native-container-render-tools-batch-2-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'docs/track-a/tracka-native-container-package-identity-batch-1-source-audit.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-duplicate-scan.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-bento4-mp4box-review.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-vapoursynth-review.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-revideo-review.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-hyperframe-review.md',
  'docs/track-a/tracka-native-container-package-identity-batch-1-next-phase-plan.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-batch-2r-confirmed-build.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'scripts/validation/tracka-native-container-package-identity-batch-1-diagnostics.mjs',
  'docs/implementation-prompts/prompt-tracka-bento4-mp4box-package-identity-review-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-validation-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-revideo-package-identity-review-1.md',
  'docs/implementation-prompts/prompt-tracka-vapoursynth-native-policy-review-1.md',
  '.dockerignore',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-blocked-scope-register.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-build-result.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-install-metadata-verification.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-artifact-manifest-summary.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-duplicate-scan.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-next-phase-plan.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-source-audit.md',
  'package.json',
])

const requiredText = [
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2 decision: completed_render_worker_docker_build_install_metadata_proof_with_identity_reviews',
  'Execution: `completed_docker_build_metadata_only`',
  'Future success decision, only after confirmed build proof: `completed_render_worker_docker_build_install_metadata_proof_with_identity_reviews`',
  'Docker build status: `completed`',
  'Metadata verification: `passed`',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2R result: completed_render_worker_docker_build_install_metadata_proof_with_identity_reviews',
  'Batch-2R blocker: `none`',
  'Runner failure before report: `none`',
  'Runner repair status: `completed_developer_dir_fallback`',
  'Prebuilt worker outputs: `present_generated_by_safe_build_scripts_not_committed`',
  'COPYFILE_DISABLE=1 npm run build:remotion-worker:mock',
  'COPYFILE_DISABLE=1 npm run build:staging-fixture-worker',
  'COPYFILE_DISABLE=1 npm run build:staging-real-video-export-worker',
  'Batch-2R run ID: `2026-06-22T01-24-10-232Z-4e862aa8`',
  'Batch-2R local image tag: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8`',
  'build-proof-3-report.json',
  'build-proof-3-manifest.json',
  '083c2ead99873175e51b493958ae02cadac00e011ffd3268f88784ffca99999a',
  '2b041c11e9a2373a6d0ed197d85cf358f03783c6d228287e6e9231e36400ed8e',
  'Docker build was limited to the local repo-owned render-worker build/install metadata proof for Atlas Track A GStreamer and MKVToolNix declarations; the image was not pushed or deployed.',
  'Product-ready end-to-end local OSS tools: `0`',
  '#601',
  'f19c173a6a3d9a4cf381fc23826bd14a6385bc1f',
  '#624',
  'afc9983cecaef0eeeb536409c16c3e0ad2eda7c6',
  '#577 is draft/open/blocked/conflicting and excluded as source-of-truth',
  'PR #577 live readback: `OPEN`, draft, `CONFLICTING` / `DIRTY`',
  'REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true',
  'tracka:native-container-render-tools-build-proof-3',
  'tracka:native-container-render-tools-batch-2:diagnostics',
  'hyperframe_render_handoff',
  'handoff_only_no_install_source_change',
  'no_install_target_unless_future_source_evidence_proves_one',
  'gstreamer_render_pipeline_support',
  'installed_source_declared_by_601',
  'mkvtoolnix_container_validation',
  'bento4_mp4box_packaging_validation',
  'resolved_mp4box_provider_gpac_ready_for_future_install_proof',
  'GPAC is the future MP4Box provider',
  'Bento4 remains separate',
  'vapoursynth_frame_pipeline',
  'resolved_vapoursynth_native_policy_ready_for_future_install_proof',
  'plugins remain separately reviewed',
  'revideo_render_preview_alternative',
  'resolved_revideo_package_identity_ready_for_future_install_proof',
  'evaluation-only/non-core',
  'TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3',
  'TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1',
  'FFmpeg/FFprobe remain Track B-owned shared dependencies only',
  'Atlas Track A does not claim Track B media OSS tools',
  'Atlas Track A does not claim AI Graphics / Worker tools',
  'Atlas Track A does not claim Worker Runtime infrastructure',
  'Atlas Track A does not claim Supabase schema/RLS/migrations',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, media processing, runtime media execution, FFmpeg/FFprobe execution, GStreamer pipeline execution, MKVToolNix media execution, Docker push, Docker deployment, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /runtime media execution:\s*`?true/i,
  /GStreamer pipeline execution:\s*`?(true|completed|passed|run)/i,
  /MKVToolNix media execution:\s*`?(true|completed|passed|run)/i,
  /FFmpeg execution:\s*`?(true|completed|passed|run)/i,
  /FFprobe execution:\s*`?(true|completed|passed|run)/i,
  /Remotion execution:\s*`?(true|completed|passed|run)/i,
  /Supabase mutation:\s*`?(true|completed|passed|run)/i,
  /SQL execution:\s*`?(true|completed|passed|run)/i,
  /Internal beta unlocked:\s*`?true/i,
  /external beta.*unlocked:\s*`?(true|enabled|approved)/i,
  /production.*unlocked:\s*`?(true|enabled|approved)/i,
  /final render\/export:\s*`?(true|enabled|completed|passed|run)/i,
  /signed URL creation:\s*`?(true|enabled|completed|created)/i,
  /public artifact creation:\s*`?(true|enabled|completed|created)/i,
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
  'tracka:native-container-render-tools-build-proof-3': 'node scripts/validation/tracka-native-container-render-tools-build-proof-3.mjs',
  'tracka:native-container-render-tools-build-proof-3:diagnostics': 'node scripts/validation/tracka-native-container-render-tools-build-proof-3-diagnostics.mjs',
  'tracka:native-container-render-tools-batch-2:diagnostics': 'node scripts/validation/tracka-native-container-render-tools-batch-2-diagnostics.mjs',
}
for (const [name, command] of Object.entries(expectedScripts)) {
  if (packageJson.scripts?.[name] !== command) fail(`missing package script: ${name}`)
}

const dockerfile = read('docker/prod/render-worker/Dockerfile')
for (const token of ['gstreamer1.0-plugins-base', 'gstreamer1.0-plugins-good', 'gstreamer1.0-tools', 'mkvtoolnix']) {
  if (!dockerfile.includes(token)) fail(`missing #601 Dockerfile package declaration: ${token}`)
}

const dockerignore = read('.dockerignore')
for (const token of ['._*', '**/._*', '.DS_Store', '**/.DS_Store', '__MACOSX/', '**/__MACOSX/']) {
  if (!dockerignore.includes(token)) fail(`missing Docker metadata ignore pattern: ${token}`)
}

const buildProofRunner = read('scripts/validation/tracka-native-container-render-tools-build-proof-3.mjs')
for (const token of [
  'removeUntrackedMacMetadataFiles',
  'git',
  'ls-files',
  'removedUntrackedMacMetadataFiles',
  'skippedTrackedMacMetadataFiles',
  'macMetadataCleanup',
  'blocked_missing_prebuilt_worker_outputs',
  'completed_render_worker_docker_build_install_metadata_proof_with_identity_reviews',
]) {
  if (!buildProofRunner.includes(token)) fail(`missing guarded runner token: ${token}`)
}

const combined = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lockDiff = execFileSync('git', ['diff', '--name-only', '--', 'package-lock.json'], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
if (lockDiff) fail('package-lock.json must remain unchanged')

const diffOutput = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
const untrackedOutput = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
const changedFiles = [...new Set([
  ...(diffOutput ? diffOutput.split('\n') : []),
  ...(untrackedOutput ? untrackedOutput.split('\n') : []),
])].filter((file) => ![
  'dist-remotion-worker/',
  'dist-staging-fixture-worker/',
  'dist-staging-real-video-export-worker/',
].some((dir) => file === dir.slice(0, -1) || file.startsWith(dir)))

const stagedOutput = execFileSync('git', ['diff', '--cached', '--name-only', '--',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
if (stagedOutput) fail('generated prebuilt worker outputs must not be staged')

const trackedOutput = execFileSync('git', ['ls-files',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
if (trackedOutput) fail('generated prebuilt worker outputs must not be tracked')

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
}

for (const forbiddenFile of [
  'package-lock.json',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
]) {
  if (changedFiles.includes(forbiddenFile)) fail(`forbidden changed file: ${forbiddenFile}`)
}

console.log('TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2 diagnostics passed')
console.log('Decision: completed_render_worker_docker_build_install_metadata_proof_with_identity_reviews')
console.log('Execution: completed_docker_build_metadata_only')
console.log('Docker build: completed')
console.log('Metadata verification: passed')
console.log('Package-lock: unchanged')
console.log('Product-ready end-to-end local OSS tools: 0')
