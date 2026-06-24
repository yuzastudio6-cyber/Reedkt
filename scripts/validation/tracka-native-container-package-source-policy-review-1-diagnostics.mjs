#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/track-a/native-container-render-tools/package-source-policy-review-1'
const requiredFiles = [
  `${packetDir}/package-source-policy-review-1.md`,
  `${packetDir}/package-source-policy-review-1.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/source-policy-review.md`,
  `${packetDir}/tool-status-matrix.md`,
  `${packetDir}/blocked-scope-register.md`,
  `${packetDir}/next-phase-plan.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/readiness-report.json`,
  'docs/activation-phase-tracka-native-container-package-source-policy-review-1-results.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-4.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-package-source-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-vapoursynth-package-source-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-revideo-owner-approval-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-diagnostics.mjs',
  'scripts/validation/tracka-native-container-render-tools-install-proof-3-diagnostics.mjs',
  'scripts/validation/tracka-native-container-package-source-resolution-batch-1-diagnostics.mjs',
  'scripts/validation/tracka-native-container-package-source-policy-review-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, 'package.json'])

const requiredText = [
  'TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-POLICY-REVIEW-1',
  'TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-POLICY-REVIEW-1 decision: blocked_no_safe_package_source_policy_available',
  'blocked_no_safe_package_source_policy_available',
  'completed_docs_only_package_source_policy_review_no_install_changes',
  '93d574f35f40eed1b7b8b87540201750b94df304',
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
  '#697',
  '#702',
  '#701 remains open/conflicting historical context only',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'node:24-bookworm',
  'Debian bookworm `python3` 3.11.2',
  'Debian source search shows exact source package `gpac` only in bullseye',
  'Debian sid `gpac` is not a stable bookworm package source',
  'Ubuntu 24.04',
  'Debian 12 bookworm 32-bit/source-build',
  'VapourSynth install docs recommend pip with Python 3.12+',
  'deb-multimedia',
  'bento4_mp4box_packaging_validation',
  'vapoursynth_frame_pipeline',
  'revideo_render_preview_alternative',
  'hyperframe_render_handoff',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
  'blocked_gpac_mp4box_package_source_unavailable',
  'blocked_pending_safe_package_source',
  'separate_not_selected_for_mp4box_command_path',
  'blocked_core_vapoursynth_package_source_unavailable',
  'blocked_vapoursynth_native_plugin_policy_not_satisfied',
  'evaluation_only_non_core_owner_approval_required_before_install_source',
  'handoff_only_no_install_source_change',
  'qa_passed_controlled_generated_private_fixture_execution_evidence',
  'owner_or_environment_package_source_review',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-4 readiness: blocked_pending_owner_or_environment_package_source_policy_changes',
  'TRACKA-REVIDEO-OWNER-APPROVAL-1 readiness: blocked_pending_owner_approval',
  'TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1 readiness: ready_for_gpu_scope_decision_planning',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness: still_blocked_pending_worker_supabase_remotion_and_tracka_private_e2e_gates',
  'Product-ready end-to-end local OSS tools: `0`',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Dockerfile install-source change: `none`',
  'Requirements install-source change: `none`',
  'Package installation: `none`',
  'Dependency mutation: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this phase, MKVToolNix execution in this phase, GPAC/MP4Box execution in this phase, VapourSynth execution in this phase, Revideo execution in this phase, FFmpeg/FFprobe execution, Docker build, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /private E2E readiness:\s*`?(ready|unlocked|enabled|true)/i,
  /final render\/export:\s*`?(completed|enabled|true|run)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /GStreamer execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /MKVToolNix execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /GPAC\/MP4Box execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /VapourSynth execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /Revideo execution in this phase:\s*`?(completed|passed|true|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|passed|true|run|executed)/i,
  /Docker build:\s*`?(completed|passed|true|run|executed)/i,
  /Docker push\/deploy:\s*`?(completed|passed|true|run|executed)/i,
  /Remotion execution:\s*`?(completed|passed|true|run|executed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true)/i,
  /package installation:\s*`?(completed|enabled|true)/i,
  /Dockerfile install-source change:\s*`?(completed|enabled|true|added|changed)/i,
  /requirements install-source change:\s*`?(completed|enabled|true|added|changed)/i,
  /TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-4 readiness:\s*`?(ready|enabled|unblocked)/i,
]

const forbiddenPathPrefixes = [
  'docker/',
  'src/',
  'server/',
  'database/',
  'supabase/',
  'public/',
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/render-worker/requirements.render.txt',
])

const forbiddenSourceTerms = [
  'Docker build `completed`',
  'Docker build: `completed`',
  'Docker push: `completed`',
  'signed URL creation: `completed`',
  'public artifact creation: `completed`',
  'internal beta unlock: `enabled`',
  'external beta unlock: `enabled`',
  'production unlock: `enabled`',
  'package-lock: `changed`',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-4 readiness: ready',
]

function fail(message) {
  console.error(`TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-POLICY-REVIEW-1 diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
const script = packageJson.scripts?.['tracka:native-container-package-source-policy-review-1:diagnostics']
if (script !== 'node scripts/validation/tracka-native-container-package-source-policy-review-1-diagnostics.mjs') {
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

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')

for (const file of [
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/render-worker/requirements.render.txt',
  '.dockerignore',
]) {
  gitQuiet(['diff', '--quiet', '--', file], `${file} changed`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]
const stagedFiles = gitLines(['diff', '--cached', '--name-only'])

for (const file of [...changedFiles, ...stagedFiles]) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (
    forbiddenExactFiles.has(file) ||
    forbiddenPathPrefixes.some((prefix) => file.startsWith(prefix)) ||
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

for (const file of changedFiles) {
  if (file.startsWith('scripts/validation/')) continue
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  const text = fs.readFileSync(file, 'utf8')
  for (const term of forbiddenSourceTerms) {
    if (text.includes(term)) fail(`forbidden source term in ${file}: ${term}`)
  }
}

console.log('TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-POLICY-REVIEW-1 diagnostics passed')
console.log('Decision: blocked_no_safe_package_source_policy_available')
console.log('Execution: completed_docs_only_package_source_policy_review_no_install_changes')
console.log('GPAC/MP4Box blocker: blocked_gpac_mp4box_package_source_unavailable')
console.log('VapourSynth blockers: blocked_core_vapoursynth_package_source_unavailable; blocked_vapoursynth_native_plugin_policy_not_satisfied')
console.log('Next milestone: owner_or_environment_package_source_review')
console.log('Product-ready end-to-end local OSS tools: 0')
console.log('Package-lock: unchanged')
