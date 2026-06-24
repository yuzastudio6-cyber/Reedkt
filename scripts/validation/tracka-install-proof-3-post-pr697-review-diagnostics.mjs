#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/track-a/native-container-render-tools/post-pr697-install-proof-3-review'
const requiredFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/pr697-install-proof-3-review.json`,
  `${packetDir}/pr697-install-proof-3-review.md`,
  `${packetDir}/pushed-post-pr690-branch-classification.json`,
  `${packetDir}/pushed-post-pr690-branch-classification.md`,
  `${packetDir}/boundary-review.json`,
  `${packetDir}/boundary-review.md`,
  `${packetDir}/next-lane-readiness.json`,
  `${packetDir}/next-lane-readiness.md`,
  `${packetDir}/post-pr697-install-proof-3-review-decision.json`,
  `${packetDir}/post-pr697-install-proof-3-review-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`,
  'docs/track-a/native-container-render-tools/install-proof-3/install-proof-3.md',
  'docs/track-a/native-container-render-tools/install-proof-3/install-proof-3.json',
  'docs/track-a/native-container-render-tools/install-proof-3/next-phase-plan.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-package-source-resolution-1.md',
  'docs/implementation-prompts/prompt-tracka-vapoursynth-package-source-resolution-1.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/production-beta-blocker-inventory.md',
  'scripts/validation/tracka-install-proof-3-post-pr697-review-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
  'scripts/validation/tracka-native-container-render-tools-install-proof-3-diagnostics.mjs',
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
  'TRACKA-NATIVE-CONTAINER-INSTALL-PROOF-3-POST-PR697-SOURCE-OF-TRUTH-REVIEW',
  'PR #697',
  'PR #690',
  'PR #693',
  '702cf924db4c8c29688f8c9335ef08f147314bd9',
  'f85e8255902a8b753ee21fc61e5b6f94f0503ccd',
  'e357ca31906c1cfcad8ed36a941f81247d889297',
  '2abd27e4f63eb7deb962b30308cb2a86343f0e95',
  '3c65ec6c3115655a55e93099a884ee45562cf3a9',
  'codex/rp-tracka-native-container-rollup-post-pr690-source-review',
  'blocked_no_safe_resolved_identity_install_source_available',
  'completed_docs_only_blocked_install_source_review',
  'blocked_gpac_mp4box_package_source_unavailable',
  'blocked_core_vapoursynth_package_source_unavailable',
  'blocked_vapoursynth_native_plugin_policy_not_satisfied',
  'evaluation_only_non_core_owner_approval_required_before_install_source',
  'handoff_only_no_install_source_change',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'superseded_by_pr697_context_only_no_reconciliation_required',
  'tracka_install_proof_3_post_pr697_review_passed_pr697_supersedes_pushed_post_pr690_branch_ready_for_gpac_mp4box_source_resolution',
  'TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-RESOLUTION-1',
  'TRACKA-VAPOURSYNTH-PACKAGE-SOURCE-RESOLUTION-1',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-4 readiness: blocked_pending_package_source_resolution',
  'Product-ready local OSS tools: `0`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /Product-ready (?:end-to-end )?local OSS tools:\s*`?[1-9]/i,
  /40\+ tools.*end-to-end/i,
  /GPAC\/MP4Box execution:\s*`?(?!not_run)(true|completed|passed|run|executed)/i,
  /VapourSynth execution:\s*`?(?!not_run)(true|completed|passed|run|executed)/i,
  /Revideo\/Hyperframe execution:\s*`?(?!not_run)(true|completed|passed|run|executed)/i,
  /GStreamer\/MKVToolNix execution:\s*`?(?!not_run)(true|completed|passed|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(?!not_run)(true|completed|passed|run|executed)/i,
  /Docker build\/run:\s*`?(?!not_run)(true|completed|passed|run|executed)/i,
  /Private\/user\/real media:\s*`?(?!not_used)(true|used|processed|allowed|approved)/i,
  /Generated media artifacts:\s*`?(?!none)(created|true|present)/i,
  /Media processing\/probing:\s*`?(?!not_run)(true|completed|passed|run|executed)/i,
  /Render\/export:\s*`?(?!not_run)(true|enabled|completed|passed|run|executed)/i,
  /Supabase\/SQL\/GCS:\s*`?(?!not_touched)(touched|mutated|executed|uploaded|true)/i,
  /Public artifacts\/signed URLs:\s*`?(?!not_created)(created|enabled|true)/i,
  /Beta\/production:\s*`?(?!not_unlocked)(unlocked|enabled|true)/i,
  /Raw prompts\/secrets:\s*`?(?!not_executed_or_printed)(executed|printed|true)/i,
  /Package-lock\/Dockerfile\/\.dockerignore\/runtime source mutation:\s*`?(?!none)(changed|true|mutated|yes)/i,
  /package-lock:\s*`?changed/i,
]

const forbiddenEnv = [
  'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_PACKAGE_SOURCE_RESOLUTION',
  'REEDITPRO_CONFIRM_TRACKA_VAPOURSYNTH_PACKAGE_SOURCE_RESOLUTION',
  'REEDITPRO_CONFIRM_GPAC_MP4BOX_EXECUTION',
  'REEDITPRO_CONFIRM_VAPOURSYNTH_EXECUTION',
  'REEDITPRO_CONFIRM_REVIDEO_EXECUTION',
  'REEDITPRO_CONFIRM_HYPERFRAME_EXECUTION',
  'REEDITPRO_CONFIRM_GSTREAMER_EXECUTION',
  'REEDITPRO_CONFIRM_MKVTOOLNIX_EXECUTION',
  'REEDITPRO_CONFIRM_FFMPEG_EXECUTION',
  'REEDITPRO_CONFIRM_FFPROBE_EXECUTION',
  'REEDITPRO_CONFIRM_DOCKER_BUILD',
  'REEDITPRO_CONFIRM_DOCKER_RUN',
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
  console.error(`TRACKA-INSTALL-PROOF-3-POST-PR697-REVIEW diagnostics failed: ${message}`)
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

const decision = JSON.parse(read(`${packetDir}/post-pr697-install-proof-3-review-decision.json`))
if (decision.decision !== 'tracka_install_proof_3_post_pr697_review_passed_pr697_supersedes_pushed_post_pr690_branch_ready_for_gpac_mp4box_source_resolution') {
  fail(`decision drift: ${decision.decision}`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready local OSS count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B FFmpeg/FFprobe ownership drift')
if (decision.nextPrompt !== 'TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-RESOLUTION-1') fail('next prompt drift')

const classification = JSON.parse(read(`${packetDir}/pushed-post-pr690-branch-classification.json`))
if (classification.classification !== 'superseded_by_pr697_context_only_no_reconciliation_required') {
  fail(`classification drift: ${classification.classification}`)
}
if (classification.reconciliationRequired !== false) fail('unexpected reconciliation requirement')
if (classification.shouldOpenPushedBranchPr !== false) fail('unexpected pushed branch PR requirement')

const readiness = JSON.parse(read(`${packetDir}/next-lane-readiness.json`))
if (readiness.selectedNextPrompt !== 'TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-RESOLUTION-1') fail('selected next lane drift')

const manifest = JSON.parse(read(`${packetDir}/private-artifact-manifest.json`))
for (const [key, value] of Object.entries(manifest)) {
  if (value !== false) fail(`private artifact manifest drift: ${key}`)
}

const packageJson = JSON.parse(read('package.json'))
const script = packageJson.scripts?.['tracka:install-proof-3-post-pr697-review:diagnostics']
if (script !== 'node scripts/validation/tracka-install-proof-3-post-pr697-review-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

try {
  execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
} catch {
  fail('package-lock.json changed')
}

for (const file of [
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/render-worker/requirements.render.txt',
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

console.log('TRACKA-INSTALL-PROOF-3-POST-PR697-REVIEW diagnostics passed')
console.log('Decision: tracka_install_proof_3_post_pr697_review_passed_pr697_supersedes_pushed_post_pr690_branch_ready_for_gpac_mp4box_source_resolution')
console.log('Pushed post-PR690 branch classification: superseded_by_pr697_context_only_no_reconciliation_required')
console.log('Next prompt: TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-RESOLUTION-1')
console.log('Product-ready local OSS tools: 0')
