#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/track-a/native-container-render-tools/install-proof-3'
const requiredFiles = [
  `${packetDir}/install-proof-3.md`,
  `${packetDir}/install-proof-3.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/package-source-review.md`,
  `${packetDir}/tool-status-matrix.md`,
  `${packetDir}/blocked-scope-register.md`,
  `${packetDir}/next-phase-plan.md`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-tracka-native-container-render-tools-install-proof-3-results.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-build-proof-4.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-package-source-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-vapoursynth-package-source-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-vapoursynth-core-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-revideo-owner-approval-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-native-container-render-tools-install-proof-3-diagnostics.mjs',
  'scripts/validation/tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, 'package.json'])

const requiredText = [
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3',
  'blocked_no_safe_resolved_identity_install_source_available',
  'completed_docs_only_blocked_install_source_review',
  'f85e8255902a8b753ee21fc61e5b6f94f0503ccd',
  'e357ca31906c1cfcad8ed36a941f81247d889297',
  '#601',
  '#609',
  '#624',
  '#649',
  '#652',
  '#659',
  '#667',
  '#662',
  '#666',
  '#675',
  '#673',
  '#680',
  '#682',
  '#693',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'bento4_mp4box_packaging_validation',
  'vapoursynth_frame_pipeline',
  'revideo_render_preview_alternative',
  'hyperframe_render_handoff',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
  'blocked_gpac_mp4box_package_source_unavailable',
  'blocked_core_vapoursynth_package_source_unavailable',
  'blocked_vapoursynth_native_plugin_policy_not_satisfied',
  'evaluation_only_non_core_owner_approval_required_before_install_source',
  'handoff_only_no_install_source_change',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-4 readiness: blocked_pending_package_source_resolution',
  'TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-RESOLUTION-1 readiness: ready_for_package_source_review',
  'TRACKA-GPAC-MP4BOX-RUNTIME-PROOF-1 readiness: blocked_pending_package_source_resolution_and_install_proof',
  'TRACKA-VAPOURSYNTH-PACKAGE-SOURCE-RESOLUTION-1 readiness: ready_for_package_source_and_plugin_policy_review',
  'TRACKA-VAPOURSYNTH-CORE-RUNTIME-PROOF-1 readiness: blocked_pending_package_source_resolution_and_install_proof',
  'TRACKA-REVIDEO-OWNER-APPROVAL-1 readiness: blocked_pending_owner_approval',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness: still_blocked_pending_worker_supabase_remotion_and_tracka_private_e2e_gates',
  'Product-ready end-to-end local OSS tools: `0`',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this install-proof phase, MKVToolNix execution in this install-proof phase, GPAC/MP4Box execution, VapourSynth execution, Revideo execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, or broad service-role handler was enabled.',
]

const packageSourceResolutionFiles = [
  'docs/track-a/native-container-render-tools/package-source-resolution-batch-1/package-source-resolution-batch-1.md',
  'docs/track-a/native-container-render-tools/package-source-resolution-batch-1/package-source-resolution-batch-1.json',
  'docs/track-a/native-container-render-tools/package-source-resolution-batch-1/source-of-truth-audit.md',
  'docs/track-a/native-container-render-tools/package-source-resolution-batch-1/package-source-review.md',
  'docs/track-a/native-container-render-tools/package-source-resolution-batch-1/tool-status-matrix.md',
  'docs/track-a/native-container-render-tools/package-source-resolution-batch-1/blocked-scope-register.md',
  'docs/track-a/native-container-render-tools/package-source-resolution-batch-1/next-phase-plan.md',
  'docs/track-a/native-container-render-tools/package-source-resolution-batch-1/validation-results.md',
  'docs/activation-phase-tracka-native-container-package-source-resolution-batch-1-results.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-4.md',
  'scripts/validation/tracka-native-container-package-source-resolution-batch-1-diagnostics.mjs',
]

for (const file of packageSourceResolutionFiles) {
  allowedChangedFiles.add(file)
}

const packageSourcePolicyReviewFiles = [
  'docs/track-a/native-container-render-tools/package-source-policy-review-1/package-source-policy-review-1.md',
  'docs/track-a/native-container-render-tools/package-source-policy-review-1/package-source-policy-review-1.json',
  'docs/track-a/native-container-render-tools/package-source-policy-review-1/source-of-truth-audit.md',
  'docs/track-a/native-container-render-tools/package-source-policy-review-1/source-policy-review.md',
  'docs/track-a/native-container-render-tools/package-source-policy-review-1/tool-status-matrix.md',
  'docs/track-a/native-container-render-tools/package-source-policy-review-1/blocked-scope-register.md',
  'docs/track-a/native-container-render-tools/package-source-policy-review-1/next-phase-plan.md',
  'docs/track-a/native-container-render-tools/package-source-policy-review-1/validation-results.md',
  'docs/track-a/native-container-render-tools/package-source-policy-review-1/readiness-report.json',
  'docs/activation-phase-tracka-native-container-package-source-policy-review-1-results.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-4.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-package-source-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-vapoursynth-package-source-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-revideo-owner-approval-1.md',
  'scripts/validation/tracka-native-container-package-source-policy-review-1-diagnostics.mjs',
]

for (const file of packageSourcePolicyReviewFiles) {
  allowedChangedFiles.add(file)
}

const packageSourceOwnerEnvironmentReviewFiles = [
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/package-source-owner-environment-review-1.md',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/package-source-owner-environment-review-1.json',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/source-of-truth-audit.md',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/source-of-truth-audit.json',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/gpac-mp4box-owner-review.md',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/gpac-mp4box-owner-review.json',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/vapoursynth-owner-review.md',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/vapoursynth-owner-review.json',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/revideo-hyperframe-carry-forward.md',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/revideo-hyperframe-carry-forward.json',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/tool-status-matrix.md',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/tool-status-matrix.json',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/blocked-scope-register.md',
  'docs/track-a/native-container-render-tools/package-source-owner-environment-review-1/readiness-report.json',
  'docs/activation-phase-tracka-native-container-package-source-owner-environment-review-1-results.md',
  'scripts/validation/tracka-native-container-package-source-owner-environment-review-1-diagnostics.mjs',
]

for (const file of packageSourceOwnerEnvironmentReviewFiles) {
  allowedChangedFiles.add(file)
}

const forbiddenPatterns = [
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /private E2E readiness:\s*`?(ready|unlocked|enabled|true)/i,
  /final render\/export:\s*`?(completed|enabled|true|run)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /GPAC\/MP4Box (?:runtime|command|execution):\s*`?(completed|passed|true|run|executed)/i,
  /VapourSynth (?:runtime|command|execution):\s*`?(completed|passed|true|run|executed)/i,
  /Revideo (?:runtime|command|execution):\s*`?(completed|passed|true|run|executed)/i,
  /GStreamer execution in this install-proof phase:\s*`?(completed|passed|true|run|executed)/i,
  /MKVToolNix execution in this install-proof phase:\s*`?(completed|passed|true|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|passed|true|run|executed)/i,
  /Docker execution:\s*`?(completed|passed|true|run|executed)/i,
  /Remotion execution:\s*`?(completed|passed|true|run|executed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true)/i,
  /package installation:\s*`?(completed|enabled|true)/i,
]

function fail(message) {
  console.error(`TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3 diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

const corpus = requiredFiles.map((file) => read(file)).join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
const script = packageJson.scripts?.['tracka:native-container-render-tools-install-proof-3:diagnostics']
if (script !== 'node scripts/validation/tracka-native-container-render-tools-install-proof-3-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const dep of [
    'gpac',
    'bento4',
    'vapoursynth',
    'python3-vapoursynth',
    'revideo',
    '@revideo/core',
    '@revideo/renderer',
    'hyperframe',
  ]) {
    if (packageJson[section]?.[dep]) fail(`unexpected direct dependency ${dep} in ${section}`)
  }
}

try {
  execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
} catch {
  fail('package-lock.json changed')
}

for (const file of [
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/render-worker/requirements.render.txt',
  '.dockerignore',
]) {
  try {
    execFileSync('git', ['diff', '--quiet', '--', file], { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(`${file} changed`)
  }
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (
    file === 'package-lock.json' ||
    file === '.dockerignore' ||
    file.startsWith('docker/') ||
    file.startsWith('src/') ||
    file.startsWith('server/') ||
    file.startsWith('database/') ||
    file.startsWith('supabase/') ||
    file.endsWith('.sql')
  ) {
    fail(`forbidden changed path ${file}`)
  }
}

const generatedArtifactPatterns = [
  /^dist(?:-|\/|$)/,
  /^dist-server(?:\/|$)/,
  /^node_modules\//,
  /^tmp\//,
  /^\.reeditpro-local-storage-smoke\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|jsonl)$/i,
]
for (const file of changedFiles) {
  if (generatedArtifactPatterns.some((pattern) => pattern.test(file)) && !file.startsWith(packetDir)) {
    fail(`generated artifact appears changed: ${file}`)
  }
}

console.log('TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3 diagnostics passed')
console.log('Decision: blocked_no_safe_resolved_identity_install_source_available')
console.log('Execution: completed_docs_only_blocked_install_source_review')
console.log('GPAC/MP4Box blocker: blocked_gpac_mp4box_package_source_unavailable')
console.log('VapourSynth blockers: blocked_core_vapoursynth_package_source_unavailable; blocked_vapoursynth_native_plugin_policy_not_satisfied')
console.log('Product-ready end-to-end local OSS tools: 0')
console.log('Package-lock: unchanged')
