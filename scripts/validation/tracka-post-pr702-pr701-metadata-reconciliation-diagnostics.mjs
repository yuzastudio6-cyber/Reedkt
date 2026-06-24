#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/track-a/native-container-render-tools/post-pr702-pr701-metadata-reconciliation'
const requiredFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/pr701-metadata-preservation.json`,
  `${packetDir}/pr701-metadata-preservation.md`,
  `${packetDir}/pr702-source-status-review.json`,
  `${packetDir}/pr702-source-status-review.md`,
  `${packetDir}/boundary-review.json`,
  `${packetDir}/boundary-review.md`,
  `${packetDir}/pr701-close-readiness.json`,
  `${packetDir}/pr701-close-readiness.md`,
  `${packetDir}/next-lane-decision.json`,
  `${packetDir}/next-lane-decision.md`,
  `${packetDir}/post-pr702-pr701-metadata-reconciliation-decision.json`,
  `${packetDir}/post-pr702-pr701-metadata-reconciliation-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`,
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-package-source-policy-review-1.md',
  'docs/implementation-prompts/prompt-tracka-close-stale-pr701-after-post-pr702-reconciliation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-post-pr702-pr701-metadata-reconciliation-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-POST-PR702-PR701-METADATA-RECONCILIATION-1',
  'tracka_post_pr702_pr701_metadata_reconciliation_passed_pr701_context_preserved_ready_for_gpac_mp4box_policy_review',
  'tracka_install_proof_3_post_pr697_review_passed_pr697_supersedes_pushed_post_pr690_branch_ready_for_gpac_mp4box_source_resolution',
  'superseded_by_pr697_context_only_no_reconciliation_required',
  'blocked_no_safe_package_source_resolution_available',
  '93d574f35f40eed1b7b8b87540201750b94df304',
  '6c75dd02a2ff090428912efa1df88ee6835bbca4',
  '88ad565c678796369dfd46ca87b586959a0e4bcd',
  '3c65ec6c3115655a55e93099a884ee45562cf3a9',
  'TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-POLICY-REVIEW-1',
  'TRACKA-CLOSE-STALE-PR701-AFTER-POST-PR702-RECONCILIATION',
  'blocked_gpac_mp4box_package_source_unavailable',
  'blocked_pending_safe_package_source',
  'separate_not_selected_for_mp4box_command_path',
  'blocked_core_vapoursynth_package_source_unavailable',
  'blocked_vapoursynth_native_plugin_policy_not_satisfied',
  'evaluation_only_non_core_owner_approval_required_before_install_source',
  'handoff_only_no_install_source_change',
  'qa_passed_controlled_generated_private_fixture_execution_evidence',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Product-ready local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`',
  'Generated artifacts committed: `none`',
  'Supabase update status: `not_applicable_docs_only`',
]

const forbiddenPatterns = [
  /40\+ tools/i,
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /GPAC\/MP4Box execution:\s*`?(completed|passed|true|run|executed)/i,
  /VapourSynth execution:\s*`?(completed|passed|true|run|executed)/i,
  /Revideo execution:\s*`?(completed|passed|true|run|executed)/i,
  /Hyperframe execution:\s*`?(completed|passed|true|run|executed)/i,
  /GStreamer\/MKVToolNix execution:\s*`?(completed|passed|true|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|passed|true|run|executed)/i,
  /Docker build\/run:\s*`?(completed|passed|true|run|executed)/i,
  /package-lock:\s*`?changed/i,
  /Dockerfile(?:s)?\s*:\s*`?changed/i,
  /\.dockerignore\s*:\s*`?changed/i,
  /runtime source\s*:\s*`?changed/i,
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/ocr-runtime/Dockerfile',
])

const forbiddenPrefixes = ['src/', 'server/', 'supabase/', 'database/', 'public/', 'docker/']

function fail(message) {
  console.error(`TRACKA-POST-PR702-PR701-METADATA-RECONCILIATION diagnostics failed: ${message}`)
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

for (const file of requiredFiles) read(file)

for (const file of requiredFiles.filter((file) => file.endsWith('.json'))) {
  try {
    JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched ${pattern}`)
}

const decision = JSON.parse(read(`${packetDir}/post-pr702-pr701-metadata-reconciliation-decision.json`))
if (decision.decision !== 'tracka_post_pr702_pr701_metadata_reconciliation_passed_pr701_context_preserved_ready_for_gpac_mp4box_policy_review') {
  fail('decision drift')
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B FFmpeg/FFprobe ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== 'TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-POLICY-REVIEW-1') fail('next prompt drift')

const preservation = JSON.parse(read(`${packetDir}/pr701-metadata-preservation.json`))
if (preservation.pushedPostPr690BranchClassification !== 'superseded_by_pr697_context_only_no_reconciliation_required') {
  fail('PR #701 pushed branch classification missing')
}
if (preservation.postPr702Status.directMergeAllowed !== false) fail('PR #701 direct merge was enabled')

const pr702 = JSON.parse(read(`${packetDir}/pr702-source-status-review.json`))
if (pr702.decision !== 'blocked_no_safe_package_source_resolution_available') fail('PR #702 decision drift')
if (pr702.toolStatus.gpacMp4box !== 'blocked_gpac_mp4box_package_source_unavailable') fail('GPAC/MP4Box status drift')

const boundary = JSON.parse(read(`${packetDir}/boundary-review.json`))
for (const [key, value] of Object.entries(boundary)) {
  if (value !== false) fail(`boundary ${key} was enabled`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['tracka:post-pr702-pr701-metadata-reconciliation:diagnostics'] !== 'node scripts/validation/tracka-post-pr702-pr701-metadata-reconciliation-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

for (const file of forbiddenExactFiles) {
  gitQuiet(['diff', '--quiet', '--', file], `${file} changed`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file.endsWith('.sql')) {
    fail(`forbidden changed path ${file}`)
  }
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3)$/i.test(file)) {
    fail(`media artifact changed ${file}`)
  }
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) {
    fail(`generated output changed ${file}`)
  }
}

console.log('TRACKA-POST-PR702-PR701-METADATA-RECONCILIATION diagnostics passed')
console.log('Decision: tracka_post_pr702_pr701_metadata_reconciliation_passed_pr701_context_preserved_ready_for_gpac_mp4box_policy_review')
console.log('Next prompt: TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-POLICY-REVIEW-1')
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
