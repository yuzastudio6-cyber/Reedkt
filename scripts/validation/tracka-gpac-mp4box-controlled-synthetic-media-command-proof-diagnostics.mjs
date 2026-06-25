#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof'
const decisionText = 'tracka_gpac_mp4box_controlled_synthetic_media_command_proof_passed_ready_for_qa_review'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-QA-1'
const candidateVersion = '26.02-rev0-g118e60a90-HEAD'

const packetFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/docker-build-report.json`,
  `${packetDir}/docker-build-report.md`,
  `${packetDir}/synthetic-fixture-report.json`,
  `${packetDir}/synthetic-fixture-report.md`,
  `${packetDir}/mp4box-command-report.json`,
  `${packetDir}/mp4box-command-report.md`,
  `${packetDir}/cleanup-report.json`,
  `${packetDir}/cleanup-report.md`,
  `${packetDir}/boundary-review.json`,
  `${packetDir}/boundary-review.md`,
  `${packetDir}/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json`,
  `${packetDir}/gpac-mp4box-controlled-synthetic-media-command-proof-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`
]

const requiredFiles = [
  ...packetFiles,
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-controlled-synthetic-media-command-qa-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-runtime-proof/gpac-mp4box-controlled-runtime-proof-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-qa/gpac-mp4box-official-apt-install-source-qa-decision.json',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-controlled-synthetic-media-command-proof-diagnostics.mjs'
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-PROOF-1',
  nextPrompt,
  decisionText,
  'tracka_gpac_mp4box_controlled_runtime_proof_passed_ready_for_controlled_synthetic_media_command_proof',
  'tracka_gpac_mp4box_official_apt_install_source_qa_passed_ready_for_controlled_runtime_proof',
  'reeditpro-tracka-gpac-mp4box-controlled-synthetic-media-command-proof-1:20260625T1158Z-1f33b4a',
  'sha256:c7c9c316a0cf54f8a4bf24e086e9a13372f77506418dbf9c4ff4559ab8d33e89',
  'gpac',
  candidateVersion,
  'arm64',
  '/usr/bin/MP4Box',
  'MP4Box -add generated-synthetic-subtitles.srt:hdlr=sbtl -new generated-synthetic-subtitle-only.mp4',
  'MP4Box -info generated-synthetic-subtitle-only.mp4',
  '8070a36d0b5f724e75512fa1ab2f722b75aaba91ec46a37936d38cb6fa9f42ea',
  'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8',
  'sbtl:tx3g',
  'tx3g',
  'cleanup=passed',
  'Product-ready local OSS tools remain `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  '#577 remains excluded',
  'Supabase classification: no write / environment none / SQL none / migration no'
]

const forbiddenPatterns = [
  /40\+ tools/i,
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForProductRuntime"\s*:\s*true/i,
  /readyForInternalBeta"\s*:\s*true/i,
  /readyForExternalBeta"\s*:\s*true/i,
  /readyForProduction"\s*:\s*true/i,
  /userPrivateRealMedia"\s*:\s*true/i,
  /arbitraryMediaProbing"\s*:\s*true/i,
  /ffmpegFfprobeExecution"\s*:\s*true/i,
  /renderExport"\s*:\s*true/i,
  /productRuntimeApproval"\s*:\s*true/i,
  /betaUnlock"\s*:\s*true/i,
  /productionUnlock"\s*:\s*true/i,
  /"publicArtifacts"\s*:\s*\[[^\]]+\]/i,
  /"signedUrls"\s*:\s*\[[^\]]+\]/i,
  /Supabase\/SQL\/GCS:\s*`?(touched|mutated|executed|uploaded|true)/i
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-PROOF-1 diagnostics failed: ${message}`)
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
for (const file of packetFiles.filter((file) => file.endsWith('.json'))) json(file)

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-controlled-synthetic-media-command-proof:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-controlled-synthetic-media-command-proof-diagnostics.mjs') {
  fail('missing package diagnostics script')
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

const decision = json(`${packetDir}/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.version !== candidateVersion) fail('version drift')
if (decision.architecture !== 'arm64') fail('architecture drift')
if (decision.mp4boxPath !== '/usr/bin/MP4Box') fail('MP4Box path drift')
if (decision.proof?.dockerBuildPassed !== true) fail('Docker proof drift')
if (decision.proof?.networkDisabled !== true) fail('network proof drift')
if (decision.proof?.syntheticInputCreated !== true) fail('input creation drift')
if (decision.proof?.mp4boxAddPassed !== true) fail('MP4Box add drift')
if (decision.proof?.mp4boxInfoPassed !== true) fail('MP4Box info drift')
if (decision.proof?.outputBytes !== 857) fail('output size drift')
if (decision.proof?.outputSha256 !== 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8') fail('output sha drift')
if (decision.proof?.cleanupPassed !== true) fail('cleanup drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const fixture = json(`${packetDir}/synthetic-fixture-report.json`)
if (fixture.input?.bytes !== 73) fail('input byte drift')
if (fixture.output?.bytes !== 857) fail('output byte drift')
if (fixture.cleanup !== 'passed') fail('fixture cleanup drift')
if (fixture.committedArtifacts?.length !== 0) fail('committed fixture artifact drift')

const command = json(`${packetDir}/mp4box-command-report.json`)
for (const item of command.commands ?? []) {
  if (item.exitStatus !== 0 || item.accepted !== true) fail(`command ${item.name} was not accepted`)
}
if (command.infoEvidence?.movieTracks !== 1) fail('track count drift')
if (command.infoEvidence?.mediaType !== 'sbtl:tx3g') fail('media type drift')
if (command.ffmpegFfprobeUsed !== false || command.userPrivateRealMediaUsed !== false) fail('forbidden helper/user media drift')

const boundary = json(`${packetDir}/boundary-review.json`)
for (const key of ['userPrivateRealMedia', 'arbitraryMediaProbing', 'ffmpegFfprobeExecution', 'gstreamerExecution', 'mkvtoolnixExecution', 'bento4Execution', 'vapoursynthExecution', 'renderExport', 'workerRouteProviderExecution', 'supabaseGcsSql', 'publicArtifacts', 'signedUrls', 'betaUnlock', 'productionUnlock', 'productRuntimeApproval']) {
  if (boundary[key] !== false) fail(`boundary ${key} was enabled`)
}

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'committedMediaArtifacts', 'generatedOutputsCommitted']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`artifact manifest ${key} is not empty`)
}
if (!Array.isArray(manifest.transientContainerArtifacts) || manifest.transientContainerArtifacts.length !== 2) fail('transient artifact summary drift')

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only'])
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\/|^server\/|^supabase\/|^database\/|^public\//.test(file)) fail(`forbidden changed path ${file}`)
  if (/^docker\//.test(file)) fail(`Docker path changed ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i.test(file)) fail(`artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
  if (/package-lock\.json|\.dockerignore|requirements|supabase|database|public/i.test(file)) fail(`protected path changed ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log('TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-PROOF-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log(`Output SHA-256: ${decision.proof.outputSha256}`)
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
