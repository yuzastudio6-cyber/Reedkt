#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-owner-source-classification-request'

const requiredFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/official-gpac-apt-source-class.json`,
  `${packetDir}/official-gpac-apt-source-class.md`,
  `${packetDir}/debian-bookworm-compatibility.json`,
  `${packetDir}/debian-bookworm-compatibility.md`,
  `${packetDir}/keyring-signature-policy.json`,
  `${packetDir}/keyring-signature-policy.md`,
  `${packetDir}/component-pinning-policy.json`,
  `${packetDir}/component-pinning-policy.md`,
  `${packetDir}/blocked-alternatives.json`,
  `${packetDir}/blocked-alternatives.md`,
  `${packetDir}/runtime-boundary.json`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/decision.json`,
  `${packetDir}/decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`,
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-official-apt-repo-approval-1.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-owner-source-classification-request-diagnostics.mjs'
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1',
  'TRACKA-GPAC-MP4BOX-OFFICIAL-APT-REPO-APPROVAL-1',
  'tracka_gpac_mp4box_owner_source_classification_passed_ready_for_official_gpac_apt_repo_approval',
  'official_gpac_apt_repository',
  'https://gpac.io/downloads/gpac-nightly-builds/',
  'https://dist.gpac.io/gpac/linux/debian',
  'https://dist.gpac.io/gpac/linux/debian/dists/bookworm/Release',
  'https://dist.gpac.io/gpac/linux/debian/dists/bookworm/main/binary-amd64/Packages',
  'https://dist.gpac.io/gpac/linux/gpg.asc',
  'bookworm',
  'main',
  'nightly',
  'gpac',
  'c88993c228200dece139005eb28fec06b7f3933122fee5612a85d4cb5b94c7ad',
  '18bce363dc74f1bd13e9af5fa71545d470605134359e1be79339388c4f246ff1',
  '565259a5111d6294b6ee93a979677eeab55ca23f4e7e0266af711aaffb036a04',
  '2.4-rev0-g5d70253ac-HEAD',
  '26.02-rev0-g118e60a90-HEAD',
  'pinningRequiredBeforeExecution',
  'blocked_no_owner_environment_package_source_approval',
  'tracka_gpac_mp4box_owner_environment_followup_blocked_no_owner_environment_source_approval',
  'separate_not_selected_for_mp4box_command_path',
  'closed_without_merge_stale_context',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Product-ready local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`',
  'Generated artifacts committed: `none`'
]

const forbiddenPatterns = [
  /40\+ tools/i,
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /installApproved"\s*:\s*true/i,
  /runtimeApproved"\s*:\s*true/i,
  /readyForInstallProof"\s*:\s*true/i,
  /readyForRuntimeExecution"\s*:\s*true/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /GPAC\/MP4Box execution:\s*`?(completed|passed|true|run|executed)/i,
  /Bento4 execution:\s*`?(completed|passed|true|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|passed|true|run|executed)/i,
  /Docker build\/run:\s*`?(completed|passed|true|run|executed)/i,
  /apt-get install:\s*`?(completed|passed|true|run|executed)/i,
  /key import:\s*`?(completed|passed|true|run|executed)/i,
  /package-lock:\s*`?changed/i,
  /Dockerfile(?:s)?\s*:\s*`?changed/i,
  /\.dockerignore\s*:\s*`?changed/i,
  /runtime source\s*:\s*`?changed/i
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/render-worker/requirements.render.txt'
])

const forbiddenPrefixes = ['src/', 'server/', 'supabase/', 'database/', 'public/', 'docker/']

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1 diagnostics failed: ${message}`)
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

const decision = json(`${packetDir}/decision.json`)
if (decision.decision !== 'tracka_gpac_mp4box_owner_source_classification_passed_ready_for_official_gpac_apt_repo_approval') fail('decision drift')
if (decision.selectedSourceClass !== 'official_gpac_apt_repository') fail('source class drift')
if (decision.installApproved !== false || decision.runtimeApproved !== false) fail('install/runtime approval drift')
if (decision.gpacMp4box?.component !== 'main') fail('component drift')
if (decision.gpacMp4box?.pinningRequiredBeforeExecution !== true) fail('pinning requirement drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== 'TRACKA-GPAC-MP4BOX-OFFICIAL-APT-REPO-APPROVAL-1') fail('next prompt drift')

const sourceClass = json(`${packetDir}/official-gpac-apt-source-class.json`)
if (sourceClass.repositoryEvidence?.debianBookwormReleaseStatus !== 'HTTP 200') fail('Release endpoint status drift')
if (sourceClass.repositoryEvidence?.selectedComponent !== 'main') fail('selected component drift')
if (sourceClass.repositoryEvidence?.blockedComponent !== 'nightly') fail('blocked component drift')
if (sourceClass.keyEvidence?.status !== 'HTTP 200') fail('key endpoint status drift')
if (sourceClass.packageEvidence?.packageName !== 'gpac') fail('package name drift')
if (sourceClass.classificationOnly !== true || sourceClass.installApproved !== false || sourceClass.runtimeApproved !== false) fail('classification boundary drift')

const boundary = json(`${packetDir}/runtime-boundary.json`)
for (const [key, value] of Object.entries(boundary)) {
  if (value !== false) fail(`boundary ${key} was enabled`)
}

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'mediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`artifact manifest ${key} is not empty`)
}

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-owner-source-classification-request:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-owner-source-classification-request-diagnostics.mjs') {
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
  ...gitLines(['diff', '--cached', '--name-only'])
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file.endsWith('.sql')) fail(`forbidden changed path ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i.test(file)) fail(`artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
}

console.log('TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1 diagnostics passed')
console.log('Decision: tracka_gpac_mp4box_owner_source_classification_passed_ready_for_official_gpac_apt_repo_approval')
console.log('Next prompt: TRACKA-GPAC-MP4BOX-OFFICIAL-APT-REPO-APPROVAL-1')
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
