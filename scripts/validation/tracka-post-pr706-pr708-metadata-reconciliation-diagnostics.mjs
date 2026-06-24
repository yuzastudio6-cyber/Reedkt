#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/post-pr706-pr708-metadata-reconciliation'
const requiredFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/pr708-context-preservation.json`,
  `${packetDir}/pr708-context-preservation.md`,
  `${packetDir}/pr706-source-status.json`,
  `${packetDir}/pr706-source-status.md`,
  `${packetDir}/boundary-review.json`,
  `${packetDir}/boundary-review.md`,
  `${packetDir}/close-readiness.json`,
  `${packetDir}/close-readiness.md`,
  `${packetDir}/post-pr706-pr708-metadata-reconciliation-decision.json`,
  `${packetDir}/post-pr706-pr708-metadata-reconciliation-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/source-refresh-after-pr713-drift.json`,
  `${packetDir}/source-refresh-after-pr713-drift.md`,
  'docs/implementation-prompts/prompt-tracka-close-stale-pr701-pr708-after-post-pr706-reconciliation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-post-pr706-pr708-metadata-reconciliation-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)
const requiredText = [
  'TRACKA-POST-PR706-PR708-METADATA-RECONCILIATION-1',
  'TRACKA-PR711-SOURCE-REFRESH-AFTER-PR713-DRIFT',
  'tracka_pr711_source_refresh_after_pr713_drift_passed_ready_for_merge_hygiene',
  'tracka_post_pr706_pr708_metadata_reconciliation_passed_pr708_context_preserved_ready_for_stale_pr_close_prompt',
  'tracka_post_pr702_pr701_metadata_reconciliation_passed_pr701_context_preserved_ready_for_gpac_mp4box_policy_review',
  'blocked_no_safe_package_source_policy_available',
  'blocked_no_owner_environment_package_source_approval',
  'blocked_gpac_mp4box_package_source_policy_not_approved',
  'blocked_pending_owner_environment_package_source_approval',
  'none_until_owner_environment_approval',
  'blocked_core_vapoursynth_package_source_policy_not_approved',
  'core_vapoursynth_only_plugins_excluded',
  'completed_docs_only_package_source_policy_review_no_install_changes',
  'a293ec57a304728b2ab4f731ab1fd58f5c9aaec8',
  'd392351457314cca5b51259f44b0a27ab74ecf39',
  'c526f42fa428a4945b4d2a7b280cc00fa186923a',
  '59dea660c547fa0d8756372ab92cec2a2c72804c',
  '6c75dd02a2ff090428912efa1df88ee6835bbca4',
  '93d574f35f40eed1b7b8b87540201750b94df304',
  'superseded_by_pr697_context_only_no_reconciliation_required',
  'TRACKA-CLOSE-STALE-PR701-PR708-AFTER-POST-PR706-RECONCILIATION',
  'TRACKA-CLOSE-STALE-PR701-AFTER-POST-PR702-RECONCILIATION',
  'blocked_gpac_mp4box_package_source_unavailable',
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
  console.error(`TRACKA-POST-PR706-PR708-METADATA-RECONCILIATION diagnostics failed: ${message}`)
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

const decision = JSON.parse(read(`${packetDir}/post-pr706-pr708-metadata-reconciliation-decision.json`))
if (decision.decision !== 'tracka_post_pr706_pr708_metadata_reconciliation_passed_pr708_context_preserved_ready_for_stale_pr_close_prompt') fail('decision drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== 'TRACKA-CLOSE-STALE-PR701-PR708-AFTER-POST-PR706-RECONCILIATION') fail('next prompt drift')
if (decision.pr708DirectMergeAllowed !== false || decision.pr701DirectMergeAllowed !== false) fail('stale PR direct merge enabled')

const pr708 = JSON.parse(read(`${packetDir}/pr708-context-preservation.json`))
if (pr708.pushedPostPr690BranchClassification !== 'superseded_by_pr697_context_only_no_reconciliation_required') fail('PR708 context classification drift')
if (pr708.pr708.directMergeAllowedAfterPr706 !== false) fail('PR708 direct merge enabled')

const pr706 = JSON.parse(read(`${packetDir}/pr706-source-status.json`))
if (pr706.pr706.decision !== 'blocked_no_safe_package_source_policy_available') fail('PR706 decision drift')
if (pr706.sourceTruth.gpacMp4box !== 'blocked_gpac_mp4box_package_source_unavailable') fail('GPAC source status drift')

const boundary = JSON.parse(read(`${packetDir}/boundary-review.json`))
for (const [key, value] of Object.entries(boundary)) {
  if (value !== false) fail(`boundary ${key} was enabled`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['tracka:post-pr706-pr708-metadata-reconciliation:diagnostics'] !== 'node scripts/validation/tracka-post-pr706-pr708-metadata-reconciliation-diagnostics.mjs') {
  fail('missing package diagnostics script')
}
if (packageJson.scripts?.['tracka:native-container-package-source-owner-environment-review-1:diagnostics'] !== 'node scripts/validation/tracka-native-container-package-source-owner-environment-review-1-diagnostics.mjs') {
  fail('missing owner/environment package-source diagnostics script')
}

const refresh = JSON.parse(read(`${packetDir}/source-refresh-after-pr713-drift.json`))
if (refresh.decision !== 'tracka_pr711_source_refresh_after_pr713_drift_passed_ready_for_merge_hygiene') fail('source refresh decision drift')
if (refresh.pr711?.preservedDecision !== 'tracka_post_pr706_pr708_metadata_reconciliation_passed_pr708_context_preserved_ready_for_stale_pr_close_prompt') fail('source refresh PR711 decision drift')
if (refresh.pr713?.preservedDecision !== 'blocked_no_owner_environment_package_source_approval') fail('source refresh PR713 decision drift')
if (refresh.conflictResolution?.protectedFileConflicts !== false) fail('source refresh protected conflict drift')
if (refresh.preservedContext?.productReadyLocalOssTools !== 0) fail('source refresh product-ready count drift')
if (refresh.preservedContext?.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('source refresh Track B ownership drift')

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
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file.endsWith('.sql')) fail(`forbidden changed path ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3)$/i.test(file)) fail(`media artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
}

console.log('TRACKA-POST-PR706-PR708-METADATA-RECONCILIATION diagnostics passed')
console.log('Decision: tracka_post_pr706_pr708_metadata_reconciliation_passed_pr708_context_preserved_ready_for_stale_pr_close_prompt')
console.log('Next prompt: TRACKA-CLOSE-STALE-PR701-PR708-AFTER-POST-PR706-RECONCILIATION')
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
