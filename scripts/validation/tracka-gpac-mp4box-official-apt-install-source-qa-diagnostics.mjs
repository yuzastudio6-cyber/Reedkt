#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-qa'
const decisionText = 'tracka_gpac_mp4box_official_apt_install_source_qa_passed_ready_for_controlled_runtime_proof'
const reviewedDecision = 'tracka_gpac_mp4box_official_apt_install_source_execution_passed_ready_for_install_source_qa'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-CONTROLLED-RUNTIME-PROOF-1'
const candidateVersion = '26.02-rev0-g118e60a90-HEAD'
const architecture = 'arm64'

const packetFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/install-source-evidence-acceptance.json`,
  `${packetDir}/install-source-evidence-acceptance.md`,
  `${packetDir}/package-presence-qa.json`,
  `${packetDir}/package-presence-qa.md`,
  `${packetDir}/mp4box-binary-presence-qa.json`,
  `${packetDir}/mp4box-binary-presence-qa.md`,
  `${packetDir}/boundary-qa.json`,
  `${packetDir}/boundary-qa.md`,
  `${packetDir}/runtime-readiness-matrix.json`,
  `${packetDir}/runtime-readiness-matrix.md`,
  `${packetDir}/gpac-mp4box-official-apt-install-source-qa-decision.json`,
  `${packetDir}/gpac-mp4box-official-apt-install-source-qa-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`
]

const requiredFiles = [
  ...packetFiles,
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-controlled-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-official-apt-install-source-qa-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-execution/gpac-mp4box-official-apt-install-source-execution-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-execution/package-install-proof-report.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-execution/binary-presence-proof-report.json',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-official-apt-install-source-qa-diagnostics.mjs'
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1',
  nextPrompt,
  decisionText,
  reviewedDecision,
  'official_gpac_apt_repository',
  'https://dist.gpac.io/gpac/linux/debian',
  'https://dist.gpac.io/gpac/linux/gpg.asc',
  '/etc/apt/sources.list.d/gpac.sources',
  '/usr/share/keyrings/gpac-archive-keyring.gpg',
  '/etc/apt/preferences.d/gpac.pref',
  'bookworm',
  'main',
  'nightly',
  'gpac',
  candidateVersion,
  architecture,
  '/usr/bin/MP4Box',
  'Product-ready local OSS tools remain `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
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
  /productRuntimeApproval"\s*:\s*true/i,
  /betaUnlock"\s*:\s*true/i,
  /productionUnlock"\s*:\s*true/i,
  /"publicArtifacts"\s*:\s*\[[^\]]+\]/i,
  /"signedUrls"\s*:\s*\[[^\]]+\]/i,
  /GPAC\/MP4Box runtime(?: behavior)?:\s*`?(completed|passed|true|run|executed|approved)/i,
  /MP4Box media command:\s*`?(completed|passed|true|run|executed)/i,
  /media processing:\s*`?(completed|passed|true|run|executed|approved)/i,
  /Docker build\/run:\s*`?(completed|passed|true|run|executed)/i,
  /apt mutation:\s*`?(completed|passed|true|run|executed)/i,
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
  console.error(`TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-official-apt-install-source-qa:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-official-apt-install-source-qa-diagnostics.mjs') {
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

const priorDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-execution/gpac-mp4box-official-apt-install-source-execution-decision.json')
if (priorDecision.decision !== reviewedDecision) fail('reviewed decision drift')
if (priorDecision.repository?.selectedCandidateVersion !== candidateVersion) fail('candidate version drift')
if (priorDecision.repository?.architecture !== architecture) fail('architecture drift')
if (priorDecision.installSourceExecution?.mp4boxPath !== '/usr/bin/MP4Box') fail('MP4Box path drift')
if (priorDecision.installSourceExecution?.packageInstalled !== true) fail('package install evidence drift')
if (priorDecision.installSourceExecution?.binaryPresenceProven !== true) fail('binary presence evidence drift')
for (const key of ['runtimeApprovedNow', 'mp4boxVersionApprovedNow', 'mediaProcessingApprovedNow', 'productUseApprovedNow', 'betaApprovedNow', 'productionApprovedNow']) {
  if (priorDecision.approvalBoundary?.[key] !== false) fail(`prior boundary ${key} drift`)
}

const decision = json(`${packetDir}/gpac-mp4box-official-apt-install-source-qa-decision.json`)
if (decision.decision !== decisionText) fail('QA decision drift')
if (decision.reviewedDecision !== reviewedDecision) fail('reviewed decision mismatch')
if (decision.qaAccepted?.exactGpacPackage !== `gpac=${candidateVersion}`) fail('accepted package drift')
if (decision.qaAccepted?.architecture !== architecture) fail('accepted architecture drift')
if (decision.qaAccepted?.mp4boxBinaryPath !== '/usr/bin/MP4Box') fail('accepted MP4Box path drift')
for (const value of Object.values(decision.notAccepted ?? {})) {
  if (value !== true) fail('not-accepted boundary drift')
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.readyForControlledRuntimeProof !== true) fail('controlled runtime readiness drift')
for (const key of ['readyForProductRuntime', 'readyForInternalBeta', 'readyForExternalBeta', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}

const boundary = json(`${packetDir}/boundary-qa.json`)
for (const [key, value] of Object.entries(boundary)) {
  if (key === 'supabase') continue
  if (value !== false) fail(`boundary ${key} was enabled`)
}

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'mediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`artifact manifest ${key} is not empty`)
}
if (manifest.transientLocalEvidenceCommitted !== false) fail('transient evidence commit drift')

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

console.log('TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log(`Accepted package: gpac=${candidateVersion} (${architecture})`)
console.log(`MP4Box path: /usr/bin/MP4Box`)
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
