#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-qa'
const decisionText = 'tracka_gpac_mp4box_controlled_synthetic_media_command_qa_passed_ready_for_worker_contract_review'
const reviewedDecision = 'tracka_gpac_mp4box_controlled_synthetic_media_command_proof_passed_ready_for_qa_review'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-WORKER-CONTRACT-REVIEW-1'
const candidateVersion = '26.02-rev0-g118e60a90-HEAD'
const outputSha = 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8'

const packetFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/proof-evidence-acceptance.json`,
  `${packetDir}/proof-evidence-acceptance.md`,
  `${packetDir}/runtime-boundary-qa.json`,
  `${packetDir}/runtime-boundary-qa.md`,
  `${packetDir}/artifact-cleanup-qa.json`,
  `${packetDir}/artifact-cleanup-qa.md`,
  `${packetDir}/gpac-mp4box-controlled-synthetic-media-command-qa-decision.json`,
  `${packetDir}/gpac-mp4box-controlled-synthetic-media-command-qa-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`
]

const requiredFiles = [
  ...packetFiles,
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-worker-contract-review-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-controlled-synthetic-media-command-qa-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/mp4box-command-report.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-runtime-proof/gpac-mp4box-controlled-runtime-proof-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-qa/gpac-mp4box-official-apt-install-source-qa-decision.json',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-controlled-synthetic-media-command-qa-diagnostics.mjs'
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-QA-1',
  nextPrompt,
  decisionText,
  reviewedDecision,
  'tracka_gpac_mp4box_controlled_runtime_proof_passed_ready_for_controlled_synthetic_media_command_proof',
  'tracka_gpac_mp4box_official_apt_install_source_qa_passed_ready_for_controlled_runtime_proof',
  'gpac=26.02-rev0-g118e60a90-HEAD',
  'arm64',
  '/usr/bin/MP4Box',
  'MP4Box -add generated-synthetic-subtitles.srt:hdlr=sbtl -new generated-synthetic-subtitle-only.mp4',
  'MP4Box -info generated-synthetic-subtitle-only.mp4',
  '8070a36d0b5f724e75512fa1ab2f722b75aaba91ec46a37936d38cb6fa9f42ea',
  outputSha,
  'sbtl:tx3g',
  'tx3g',
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
  /productRuntimeAccepted"\s*:\s*true/i,
  /workerRouteProviderAccepted"\s*:\s*true/i,
  /userPrivateRealMediaAccepted"\s*:\s*true/i,
  /arbitraryMediaProbingAccepted"\s*:\s*true/i,
  /ffmpegFfprobeAccepted"\s*:\s*true/i,
  /renderExportAccepted"\s*:\s*true/i,
  /internalBetaAccepted"\s*:\s*true/i,
  /externalBetaAccepted"\s*:\s*true/i,
  /productionAccepted"\s*:\s*true/i,
  /"publicArtifacts"\s*:\s*\[[^\]]+\]/i,
  /"signedUrls"\s*:\s*\[[^\]]+\]/i,
  /Supabase\/SQL\/GCS:\s*`?(touched|mutated|executed|uploaded|true)/i
]

const forbiddenEnv = [
  'REEDITPRO_CONFIRM_DOCKER_BUILD',
  'REEDITPRO_CONFIRM_DOCKER_RUN',
  'REEDITPRO_CONFIRM_APT_MUTATION',
  'REEDITPRO_CONFIRM_GPAC_EXECUTION',
  'REEDITPRO_CONFIRM_MP4BOX_EXECUTION',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_RENDER_EXPORT',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_GCS_UPLOAD',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT'
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-QA-1 diagnostics failed: ${message}`)
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

for (const name of forbiddenEnv) {
  if (process.env[name]) fail(`forbidden confirmation env var is set: ${name}`)
}

for (const file of requiredFiles) read(file)
for (const file of packetFiles.filter((file) => file.endsWith('.json'))) json(file)

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-controlled-synthetic-media-command-qa:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-controlled-synthetic-media-command-qa-diagnostics.mjs') {
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

const proofDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json')
if (proofDecision.decision !== reviewedDecision) fail('reviewed proof decision drift')
if (proofDecision.version !== candidateVersion) fail('proof version drift')
if (proofDecision.architecture !== 'arm64') fail('proof architecture drift')
if (proofDecision.mp4boxPath !== '/usr/bin/MP4Box') fail('proof MP4Box path drift')
if (proofDecision.proof?.mp4boxAddPassed !== true) fail('MP4Box add proof drift')
if (proofDecision.proof?.mp4boxInfoPassed !== true) fail('MP4Box info proof drift')
if (proofDecision.proof?.outputSha256 !== outputSha) fail('proof output sha drift')
if (proofDecision.proof?.cleanupPassed !== true) fail('proof cleanup drift')

const commandReport = json('docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/mp4box-command-report.json')
if (commandReport.infoEvidence?.mediaType !== 'sbtl:tx3g') fail('accepted media type drift')
if (commandReport.infoEvidence?.codec !== 'tx3g') fail('accepted codec drift')
if (commandReport.ffmpegFfprobeUsed !== false) fail('FFmpeg/FFprobe helper drift')
if (commandReport.userPrivateRealMediaUsed !== false) fail('user/private/real media drift')

const decision = json(`${packetDir}/gpac-mp4box-controlled-synthetic-media-command-qa-decision.json`)
if (decision.decision !== decisionText) fail('QA decision drift')
if (decision.reviewedDecision !== reviewedDecision) fail('reviewed decision mismatch')
if (decision.qaAccepted?.boundedLocalToolchainProof !== true) fail('bounded toolchain acceptance drift')
if (decision.qaAccepted?.gpacPackage !== `gpac=${candidateVersion}`) fail('accepted package drift')
if (decision.qaAccepted?.architecture !== 'arm64') fail('accepted architecture drift')
if (decision.qaAccepted?.mp4boxPath !== '/usr/bin/MP4Box') fail('accepted MP4Box path drift')
if (decision.qaAccepted?.mp4boxSyntheticCommandProof !== true) fail('accepted synthetic command drift')
if (decision.qaAccepted?.mp4boxInfoProof !== true) fail('accepted info proof drift')
if (decision.qaAccepted?.artifactCleanup !== true) fail('accepted cleanup drift')
for (const value of Object.values(decision.notAccepted ?? {})) {
  if (value !== true) fail('not-accepted boundary drift')
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.boundedLocalToolchainProofAccepted !== true) fail('bounded readiness drift')
if (readiness.readyForWorkerContractReview !== true) fail('worker contract readiness drift')
for (const key of ['readyForProductRuntime', 'readyForInternalBeta', 'readyForExternalBeta', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}

const boundary = json(`${packetDir}/runtime-boundary-qa.json`)
for (const key of ['gpacMediaFilterRuntimeAccepted', 'userPrivateRealMediaAccepted', 'arbitraryMediaProbingAccepted', 'ffmpegFfprobeAccepted', 'renderExportAccepted', 'workerRouteProviderAccepted', 'productRuntimeAccepted', 'internalBetaAccepted', 'externalBetaAccepted', 'productionAccepted']) {
  if (boundary[key] !== false) fail(`boundary ${key} was enabled`)
}

const cleanup = json(`${packetDir}/artifact-cleanup-qa.json`)
if (cleanup.cleanupAccepted !== true) fail('cleanup acceptance drift')
for (const key of ['committedMediaArtifacts', 'privateArtifacts', 'publicArtifacts', 'signedUrls', 'generatedOutputsCommitted']) {
  if (!Array.isArray(cleanup[key]) || cleanup[key].length !== 0) fail(`cleanup ${key} is not empty`)
}

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'committedMediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`artifact manifest ${key} is not empty`)
}

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

console.log('TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-QA-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log(`Accepted output SHA-256: ${outputSha}`)
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
