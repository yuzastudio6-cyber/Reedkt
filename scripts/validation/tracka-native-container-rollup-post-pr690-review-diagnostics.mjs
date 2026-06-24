#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/track-a/native-container-render-tools/post-pr690-rollup-review'
const requiredFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/pr690-dependency-gate-review.json`,
  `${packetDir}/pr690-dependency-gate-review.md`,
  `${packetDir}/pr693-rollup-review.json`,
  `${packetDir}/pr693-rollup-review.md`,
  `${packetDir}/boundary-review.json`,
  `${packetDir}/boundary-review.md`,
  `${packetDir}/install-proof-3-readiness.json`,
  `${packetDir}/install-proof-3-readiness.md`,
  `${packetDir}/post-pr690-rollup-review-decision.json`,
  `${packetDir}/post-pr690-rollup-review-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`,
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-3.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/tracka-native-container-rollup-post-pr690-review-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
  'scripts/validation/tracka-native-container-render-tools-rollup-after-gstreamer-mkvtoolnix-qa-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-execution-packet-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-plan-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-approval-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-private-fixture-scope-decision-1-diagnostics.mjs',
  'scripts/validation/tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-diagnostics.mjs',
])

const requiredText = [
  'TRACKA-NATIVE-CONTAINER-ROLLUP-POST-PR-690-SOURCE-OF-TRUTH-REVIEW',
  'PR #690',
  'PR #693',
  'f85e8255902a8b753ee21fc61e5b6f94f0503ccd',
  'e357ca31906c1cfcad8ed36a941f81247d889297',
  'd1dfcdbee62971313f6d7b017ed61747ac9d2518',
  'tracka_native_container_rollup_post_pr690_review_passed_rollup_valid_ready_for_install_proof_3',
  'rollup_valid_after_pr_690_dependency_gate_reconciliation',
  'completed_native_container_rollup_after_gstreamer_mkvtoolnix_qa',
  'completed_docs_only_rollup_no_runtime_execution',
  'qa_passed_controlled_generated_private_fixture_execution_evidence',
  'ready_for_tracka_native_container_install_proof_3',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3',
  'Product-ready end-to-end local OSS tools: `0`',
  'Product-ready local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'No runtime/tool/media',
]

const forbiddenPatterns = [
  /Product-ready (?:end-to-end )?local OSS tools:\s*`?[1-9]/i,
  /40\+ tools.*end-to-end/i,
  /GStreamer(?:\/MKVToolNix)?:\s*`?(?:run|executed|completed_runtime|passed_runtime)/i,
  /MKVToolNix:\s*`?(?:run|executed|completed_runtime|passed_runtime)/i,
  /GPAC\/MP4Box:\s*`?(?:run|executed|completed_runtime|passed_runtime)/i,
  /VapourSynth:\s*`?(?:run|executed|completed_runtime|passed_runtime)/i,
  /FFmpeg\/FFprobe:\s*`?(?:run|executed|completed|passed)/i,
  /Docker:\s*`?(?:run|executed|completed|passed|built)/i,
  /Supabase\/SQL\/GCS:\s*`?(?:touched|mutated|executed|uploaded|true)/i,
  /public artifacts?\/signed URLs?:\s*`?(?:created|enabled|true)/i,
  /Beta\/production:\s*`?(?:unlocked|enabled|true)/i,
  /Package-lock\/Dockerfile\/\.dockerignore\/runtime source mutation:\s*`?(?:changed|true|mutated|yes)/i,
  /package-lock changed/i,
]

const forbiddenEnv = [
  'REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_RENDER_TOOLS_INSTALL_PROOF_3',
  'REEDITPRO_CONFIRM_GSTREAMER_EXECUTION',
  'REEDITPRO_CONFIRM_MKVTOOLNIX_EXECUTION',
  'REEDITPRO_CONFIRM_GPAC_MP4BOX_EXECUTION',
  'REEDITPRO_CONFIRM_VAPOURSYNTH_EXECUTION',
  'REEDITPRO_CONFIRM_FFMPEG_EXECUTION',
  'REEDITPRO_CONFIRM_FFPROBE_EXECUTION',
  'REEDITPRO_CONFIRM_DOCKER_BUILD',
  'REEDITPRO_CONFIRM_DOCKER_RUN',
  'REEDITPRO_CONFIRM_PRIVATE_MEDIA',
  'REEDITPRO_CONFIRM_USER_MEDIA',
  'REEDITPRO_CONFIRM_REAL_MEDIA',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_RENDER_EXPORT',
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
  console.error(`TRACKA-NATIVE-CONTAINER-ROLLUP-POST-PR690-REVIEW diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!existsSync(file)) fail(`missing required file ${file}`)
  return readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

for (const name of forbiddenEnv) {
  if (process.env[name]) fail(`forbidden confirmation env var is set: ${name}`)
}

for (const file of requiredFiles) read(file)

for (const file of requiredFiles.filter((file) => file.endsWith('.json'))) {
  try {
    JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON report ${file}: ${error.message}`)
  }
}

const corpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched ${pattern}`)
}

const decision = JSON.parse(read(`${packetDir}/post-pr690-rollup-review-decision.json`))
if (decision.decision !== 'tracka_native_container_rollup_post_pr690_review_passed_rollup_valid_ready_for_install_proof_3') {
  fail(`decision drift: ${decision.decision}`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready local OSS count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B FFmpeg/FFprobe ownership drift')

const readiness = JSON.parse(read(`${packetDir}/install-proof-3-readiness.json`))
if (readiness.nextPrompt !== 'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3') {
  fail('next prompt drift')
}
if (readiness.readiness !== 'ready') fail('install-proof 3 readiness drift')

const manifest = JSON.parse(read(`${packetDir}/private-artifact-manifest.json`))
for (const [key, value] of Object.entries(manifest)) {
  if (typeof value === 'boolean' && value !== false) fail(`private artifact manifest drift: ${key}`)
}

const packageJson = JSON.parse(read('package.json'))
const script = packageJson.scripts?.['tracka:native-container-rollup-post-pr690-review:diagnostics']
if (script !== 'node scripts/validation/tracka-native-container-rollup-post-pr690-review-diagnostics.mjs') {
  fail('missing package diagnostics script')
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

console.log('TRACKA-NATIVE-CONTAINER-ROLLUP-POST-PR690-REVIEW diagnostics passed')
console.log('Decision: tracka_native_container_rollup_post_pr690_review_passed_rollup_valid_ready_for_install_proof_3')
console.log('Next prompt: TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3')
console.log('Product-ready local OSS tools: 0')
