#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/track-a/native-container-render-tools/rollup-after-gstreamer-mkvtoolnix-qa'
const requiredFiles = [
  `${packetDir}/rollup.md`,
  `${packetDir}/rollup.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/tool-status-matrix.md`,
  `${packetDir}/tool-status-matrix.json`,
  `${packetDir}/next-phase-plan.md`,
  `${packetDir}/next-phase-plan.json`,
  `${packetDir}/blocked-scope-register.md`,
  `${packetDir}/readiness-report.json`,
  'docs/activation-phase-tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-results.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, 'package.json'])

const requiredText = [
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1',
  'completed_native_container_rollup_after_gstreamer_mkvtoolnix_qa',
  'completed_docs_only_rollup_no_runtime_execution',
  'd1dfcdbee62971313f6d7b017ed61747ac9d2518',
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
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'bento4_mp4box_packaging_validation',
  'vapoursynth_frame_pipeline',
  'revideo_render_preview_alternative',
  'hyperframe_render_handoff',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
  'qa_passed_controlled_generated_private_fixture_execution_evidence',
  'resolved_mp4box_provider_gpac_ready_for_future_install_proof',
  'resolved_vapoursynth_native_policy_ready_for_future_install_proof',
  'resolved_revideo_package_identity_ready_for_future_install_proof',
  'evaluation_only_non_core',
  'handoff_only_no_install_source_change',
  'ready_for_tracka_native_container_install_proof_3_and_future_private_e2e_planning',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3 readiness: ready',
  'TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1 readiness: ready_for_gpu_scope_decision_planning',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness: still_blocked_pending_worker_supabase_remotion_and_tracka_private_e2e_gates',
  'Product-ready end-to-end local OSS tools: `0`',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this rollup phase, MKVToolNix execution in this rollup phase, FFmpeg/FFprobe execution in this rollup phase, Docker execution in this rollup phase, Remotion execution, package installation, dependency mutation, or broad service-role handler was enabled.',
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
  /GStreamer execution in this rollup phase:\s*`?(completed|passed|true|run|executed)/i,
  /MKVToolNix execution in this rollup phase:\s*`?(completed|passed|true|run|executed)/i,
  /FFmpeg\/FFprobe execution in this rollup phase:\s*`?(completed|passed|true|run|executed)/i,
  /Docker execution in this rollup phase:\s*`?(completed|passed|true|run|executed)/i,
  /Remotion execution:\s*`?(completed|passed|true|run|executed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true)/i,
  /package installation:\s*`?(completed|enabled|true)/i,
]

function fail(message) {
  console.error(`TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1 diagnostics failed: ${message}`)
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
const script = packageJson.scripts?.['tracka:native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1:diagnostics']
if (script !== 'node scripts/validation/tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const dep of ['gpac', 'bento4', 'vapoursynth', 'revideo', '@revideo/core', '@revideo/renderer', 'hyperframe']) {
    if (packageJson[section]?.[dep]) fail(`unexpected direct dependency ${dep} in ${section}`)
  }
}

try {
  execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
} catch {
  fail('package-lock.json changed')
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (
    file === 'package-lock.json' ||
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

console.log('TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1 diagnostics passed')
console.log('Decision: completed_native_container_rollup_after_gstreamer_mkvtoolnix_qa')
console.log('Execution: completed_docs_only_rollup_no_runtime_execution')
console.log('GStreamer rollup: qa_passed_controlled_generated_private_fixture_execution_evidence')
console.log('MKVToolNix rollup: qa_passed_controlled_generated_private_fixture_execution_evidence')
console.log('Product-ready end-to-end local OSS tools: 0')
console.log('Package-lock: unchanged')
