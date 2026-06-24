#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-owner-environment-followup'

const requiredFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/owner-environment-source-review.json`,
  `${packetDir}/owner-environment-source-review.md`,
  `${packetDir}/gpac-vs-bento4-policy-review.json`,
  `${packetDir}/gpac-vs-bento4-policy-review.md`,
  `${packetDir}/environment-base-compatibility.json`,
  `${packetDir}/environment-base-compatibility.md`,
  `${packetDir}/boundary-review.json`,
  `${packetDir}/boundary-review.md`,
  `${packetDir}/gpac-mp4box-owner-environment-followup-decision.json`,
  `${packetDir}/gpac-mp4box-owner-environment-followup-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`,
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-owner-source-classification-request-1.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-owner-environment-followup-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('scripts/validation/tracka-native-container-package-source-owner-environment-review-1-diagnostics.mjs')
allowedChangedFiles.add('scripts/validation/tracka-native-container-package-source-owner-decision-1-diagnostics.mjs')

const requiredText = [
  'TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-OWNER-ENVIRONMENT-FOLLOWUP-1',
  'TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1',
  'tracka_gpac_mp4box_owner_environment_followup_blocked_no_owner_environment_source_approval',
  'blocked_no_owner_environment_source_approval_for_gpac_mp4box',
  'blocked_no_owner_environment_package_source_approval',
  'blocked_no_owner_package_source_approval_for_gpac_mp4box_or_core_vapoursynth',
  'blocked_no_safe_package_source_policy_available',
  'blocked_no_safe_package_source_resolution_available',
  '03286b3b155fedffd5173239877e36a937998440',
  'c526f42fa428a4945b4d2a7b280cc00fa186923a',
  'a293ec57a304728b2ab4f731ab1fd58f5c9aaec8',
  '93d574f35f40eed1b7b8b87540201750b94df304',
  '6c75dd02a2ff090428912efa1df88ee6835bbca4',
  '59dea660c547fa0d8756372ab92cec2a2c72804c',
  'closed_without_merge_stale_context',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'bento4_mp4box_packaging_validation',
  'resolved_mp4box_provider_gpac_ready_for_future_install_proof',
  'GPAC/MP4Box',
  'separate_not_selected_for_mp4box_command_path',
  'none_until_owner_environment_source_approval',
  'blocked_core_vapoursynth_package_source_policy_not_approved',
  'evaluation_only_non_core_owner_approval_required_before_install_source',
  'handoff_only_no_install_source_change',
  'qa_passed_controlled_generated_private_fixture_execution_evidence',
  'Product-ready local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`',
  'Generated artifacts committed: `none`',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
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
  /Bento4 execution:\s*`?(completed|passed|true|run|executed)/i,
  /VapourSynth execution:\s*`?(completed|passed|true|run|executed)/i,
  /Revideo execution:\s*`?(completed|passed|true|run|executed)/i,
  /Hyperframe execution:\s*`?(completed|passed|true|run|executed)/i,
  /GStreamer execution:\s*`?(completed|passed|true|run|executed)/i,
  /MKVToolNix execution:\s*`?(completed|passed|true|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|passed|true|run|executed)/i,
  /Docker build\/run:\s*`?(completed|passed|true|run|executed)/i,
  /package-lock:\s*`?changed/i,
  /Dockerfile(?:s)?\s*:\s*`?changed/i,
  /\.dockerignore\s*:\s*`?changed/i,
  /runtime source\s*:\s*`?changed/i,
  /approved_gpac_mp4box_owner_environment_source/i,
  /ready_for_gpac_mp4box_install_proof/i,
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/render-worker/requirements.render.txt',
])

const forbiddenPrefixes = ['src/', 'server/', 'supabase/', 'database/', 'public/', 'docker/']

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-OWNER-ENVIRONMENT-FOLLOWUP-1 diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of requiredFiles) read(file)
for (const file of requiredFiles.filter((file) => file.endsWith('.json'))) json(file)

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

const decision = json(`${packetDir}/gpac-mp4box-owner-environment-followup-decision.json`)
if (decision.decision !== 'tracka_gpac_mp4box_owner_environment_followup_blocked_no_owner_environment_source_approval') fail('decision drift')
if (decision.gpacMp4box?.allowedFutureInstallSource !== 'none_until_owner_environment_source_approval') fail('allowed source drift')
if (decision.gpacMp4box?.bento4Status !== 'separate_not_selected_for_mp4box_command_path') fail('Bento4 status drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B FFmpeg/FFprobe ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== 'TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1') fail('next prompt drift')

const audit = json(`${packetDir}/source-of-truth-audit.json`)
if (audit.sourceTruth?.pr701?.classification !== 'closed_without_merge_stale_context') fail('PR #701 stale classification drift')
if (audit.sourceTruth?.pr708?.classification !== 'closed_without_merge_stale_context') fail('PR #708 stale classification drift')
if (audit.sourceTruth?.pr577?.classification !== 'open_draft_blocked_excluded') fail('PR #577 exclusion classification drift')

const boundary = json(`${packetDir}/boundary-review.json`)
for (const [key, value] of Object.entries(boundary)) {
  if (value !== false) fail(`boundary ${key} was enabled`)
}

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'mediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`artifact manifest ${key} is not empty`)
}

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-owner-environment-followup:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-owner-environment-followup-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const dep of ['gpac', 'bento4', 'vapoursynth', 'python3-vapoursynth', 'revideo', '@revideo/core', '@revideo/renderer', 'hyperframe']) {
    if (packageJson[section]?.[dep]) fail(`unexpected direct dependency ${dep} in ${section}`)
  }
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
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file.endsWith('.sql')) fail(`forbidden changed path ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3)$/i.test(file)) fail(`media artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
}

console.log('TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-OWNER-ENVIRONMENT-FOLLOWUP-1 diagnostics passed')
console.log('Decision: tracka_gpac_mp4box_owner_environment_followup_blocked_no_owner_environment_source_approval')
console.log('Next prompt: TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1')
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
