#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-runtime-proof'
const decisionText = 'tracka_gpac_mp4box_controlled_runtime_proof_passed_ready_for_controlled_synthetic_media_command_proof'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-PROOF-1'
const candidateVersion = '26.02-rev0-g118e60a90-HEAD'

const packetFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/docker-build-runtime-proof.json`,
  `${packetDir}/docker-build-runtime-proof.md`,
  `${packetDir}/runtime-checks.json`,
  `${packetDir}/runtime-checks.md`,
  `${packetDir}/boundary-review.json`,
  `${packetDir}/boundary-review.md`,
  `${packetDir}/gpac-mp4box-controlled-runtime-proof-decision.json`,
  `${packetDir}/gpac-mp4box-controlled-runtime-proof-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`
]

const requiredFiles = [
  ...packetFiles,
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-controlled-synthetic-media-command-proof-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-qa/gpac-mp4box-official-apt-install-source-qa-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-execution/gpac-mp4box-official-apt-install-source-execution-decision.json',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-controlled-runtime-proof-diagnostics.mjs'
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-CONTROLLED-RUNTIME-PROOF-1',
  nextPrompt,
  decisionText,
  'tracka_gpac_mp4box_official_apt_install_source_qa_passed_ready_for_controlled_runtime_proof',
  'tracka_gpac_mp4box_official_apt_install_source_execution_passed_ready_for_install_source_qa',
  'reeditpro-tracka-gpac-mp4box-controlled-runtime-proof-1:20260625T1147Z-3ed9e38',
  'sha256:b9050399119a28535aa576573390fe520dbf0bb8e15474d962e8d9c36d8688fe',
  'https://dist.gpac.io/gpac/linux/debian',
  'bookworm',
  'main',
  'nightly',
  'gpac',
  candidateVersion,
  'arm64',
  '/usr/bin/MP4Box',
  '/usr/bin/gpac',
  'MP4Box - GPAC version 26.02-rev0-g118e60a90-HEAD',
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
  /productRuntimeApproval"\s*:\s*true/i,
  /betaUnlock"\s*:\s*true/i,
  /productionUnlock"\s*:\s*true/i,
  /"publicArtifacts"\s*:\s*\[[^\]]+\]/i,
  /"signedUrls"\s*:\s*\[[^\]]+\]/i,
  /MP4Box media command:\s*`?(completed|passed|true|run|executed)/i,
  /media processing:\s*`?(completed|passed|true|run|executed|approved)/i,
  /Supabase\/SQL\/GCS:\s*`?(touched|mutated|executed|uploaded|true)/i
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-CONTROLLED-RUNTIME-PROOF-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-controlled-runtime-proof:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-controlled-runtime-proof-diagnostics.mjs') {
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

const decision = json(`${packetDir}/gpac-mp4box-controlled-runtime-proof-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.version !== candidateVersion) fail('version drift')
if (decision.architecture !== 'arm64') fail('architecture drift')
if (decision.mp4boxPath !== '/usr/bin/MP4Box') fail('MP4Box path drift')
if (decision.gpacCliPath !== '/usr/bin/gpac') fail('GPAC CLI path drift')
if (decision.runtimeProof?.dockerBuildPassed !== true) fail('Docker proof drift')
if (decision.runtimeProof?.networkDisabledChecksPassed !== true) fail('network proof drift')
if (decision.runtimeProof?.mp4boxVersionPassed !== true) fail('MP4Box version proof drift')
if (decision.runtimeProof?.gpacHelpPassed !== true) fail('GPAC help proof drift')
if (decision.runtimeProof?.mp4boxMediaCommandExecuted !== false) fail('media command boundary drift')
if (decision.runtimeProof?.mediaProcessingExecuted !== false) fail('media processing boundary drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const build = json(`${packetDir}/docker-build-runtime-proof.json`)
if (build.buildResult !== 'passed') fail('Docker build result drift')
if (build.pushed !== false || build.deployed !== false) fail('push/deploy drift')
if (build.buildContext?.packageLockMutated !== false) fail('package-lock mutation drift')
if (build.buildContext?.remotionExecution !== false || build.buildContext?.renderExportExecution !== false) fail('build context boundary drift')

const runtime = json(`${packetDir}/runtime-checks.json`)
if (runtime.containerNetwork !== 'none') fail('container network drift')
if (runtime.mp4box?.versionCommandPassed !== true) fail('MP4Box version command drift')
if (runtime.mp4box?.mediaCommandExecuted !== false) fail('MP4Box media command drift')
if (runtime.gpacCli?.helpCommandPassed !== true) fail('GPAC help command drift')
if (runtime.gpacCli?.containerLocalCredentialKeyCommitted !== false) fail('container credential artifact drift')

const boundary = json(`${packetDir}/boundary-review.json`)
for (const key of ['mp4boxMediaCommand', 'mediaProcessing', 'userPrivateRealMedia', 'renderExport', 'ffmpegFfprobeExecution', 'gstreamerExecution', 'mkvtoolnixExecution', 'bento4Execution', 'vapoursynthExecution', 'workerRouteProviderExecution', 'supabaseGcsSql', 'publicArtifacts', 'signedUrls', 'betaUnlock', 'productionUnlock', 'productRuntimeApproval']) {
  if (boundary[key] !== false) fail(`boundary ${key} was enabled`)
}

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'mediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`artifact manifest ${key} is not empty`)
}
if (manifest.containerLocalOnlyArtifactsCommitted !== false) fail('container local artifact commit drift')

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

console.log('TRACKA-GPAC-MP4BOX-CONTROLLED-RUNTIME-PROOF-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log(`GPAC/MP4Box: ${candidateVersion} arm64`)
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
