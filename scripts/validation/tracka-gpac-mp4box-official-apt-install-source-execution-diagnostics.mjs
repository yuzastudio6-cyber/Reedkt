#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-official-apt-install-source-execution'
const decisionText = 'tracka_gpac_mp4box_official_apt_install_source_execution_passed_ready_for_install_source_qa'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1'
const candidateVersion = '26.02-rev0-g118e60a90-HEAD'
const architecture = 'arm64'
const dockerfile = 'docker/prod/render-worker/Dockerfile'

const packetFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/dockerfile-patch-report.json`,
  `${packetDir}/dockerfile-patch-report.md`,
  `${packetDir}/apt-source-keyring-report.json`,
  `${packetDir}/apt-source-keyring-report.md`,
  `${packetDir}/apt-pinning-report.json`,
  `${packetDir}/apt-pinning-report.md`,
  `${packetDir}/candidate-version-selection-report.json`,
  `${packetDir}/candidate-version-selection-report.md`,
  `${packetDir}/docker-build-report.json`,
  `${packetDir}/docker-build-report.md`,
  `${packetDir}/package-install-proof-report.json`,
  `${packetDir}/package-install-proof-report.md`,
  `${packetDir}/binary-presence-proof-report.json`,
  `${packetDir}/binary-presence-proof-report.md`,
  `${packetDir}/boundary-review.json`,
  `${packetDir}/boundary-review.md`,
  `${packetDir}/cleanup-report.json`,
  `${packetDir}/cleanup-report.md`,
  `${packetDir}/gpac-mp4box-official-apt-install-source-execution-decision.json`,
  `${packetDir}/gpac-mp4box-official-apt-install-source-execution-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`
]

const requiredFiles = [
  ...packetFiles,
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-official-apt-install-source-qa-1.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  dockerfile,
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-official-apt-install-source-execution-diagnostics.mjs'
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-EXECUTION-1',
  nextPrompt,
  decisionText,
  'tracka_gpac_mp4box_pinning_keyring_install_source_plan_passed_ready_for_official_apt_install_source_execution',
  'tracka_gpac_mp4box_official_apt_repo_approval_passed_ready_for_pinning_keyring_install_source_plan',
  'official_gpac_apt_repository',
  'https://gpac.io/downloads/gpac-nightly-builds/',
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
  'Signed-By: /usr/share/keyrings/gpac-archive-keyring.gpg',
  'Pin: origin "dist.gpac.io"',
  'Pin-Priority: 501',
  'separate_not_selected_for_mp4box_command_path',
  'Product-ready local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock/Dockerfile/.dockerignore/runtime source mutation',
  'Generated artifacts committed'
]

const forbiddenPatterns = [
  /40\+ tools/i,
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /runtimeApproved(?:Now)?"\s*:\s*true/i,
  /productUseApproved(?:Now)?"\s*:\s*true/i,
  /mediaProcessingApproved(?:Now)?"\s*:\s*true/i,
  /betaApproved(?:Now)?"\s*:\s*true/i,
  /productionApproved(?:Now)?"\s*:\s*true/i,
  /publicArtifactApproved(?:Now)?"\s*:\s*true/i,
  /signedUrlApproved(?:Now)?"\s*:\s*true/i,
  /ready_for_product/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /Supabase write:\s*`?(true|enabled|completed|passed)/i,
  /GCS mutation:\s*`?(true|enabled|completed|passed)/i,
  /MP4Box media command:\s*`?(completed|passed|true|run|executed)/i,
  /GPAC\/MP4Box runtime(?: behavior)?:\s*`?(completed|passed|true|run|executed|approved)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|passed|true|run|executed)/i,
  /Bento4 execution:\s*`?(completed|passed|true|run|executed)/i,
  /media processing:\s*`?(completed|passed|true|run|executed|approved)/i,
  /package-lock:\s*`?changed/i,
  /\.dockerignore\s*:\s*`?changed/i,
  /runtime source\s*:\s*`?changed/i,
  /requirements(?: files?)?\s*:\s*`?changed/i
]

const protectedUnchangedFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/requirements.render.txt',
  'docker/prod/tool-readiness-worker/Dockerfile'
]

const forbiddenPrefixes = ['src/', 'server/', 'supabase/', 'database/', 'public/']

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-EXECUTION-1 diagnostics failed: ${message}`)
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

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-official-apt-install-source-execution:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-official-apt-install-source-execution-diagnostics.mjs') {
  fail('missing package diagnostics script')
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const dep of ['gpac', 'bento4', 'vapoursynth', 'python3-vapoursynth', 'revideo', '@revideo/core', '@revideo/renderer', 'hyperframe']) {
    if (packageJson[section]?.[dep]) fail(`unexpected direct dependency ${dep} in ${section}`)
  }
}

const docker = read(dockerfile)
const dockerRequired = [
  'curl',
  'gnupg',
  'https://dist.gpac.io/gpac/linux/gpg.asc',
  '/usr/share/keyrings/gpac-archive-keyring.gpg',
  '/etc/apt/sources.list.d/gpac.sources',
  '/etc/apt/preferences.d/gpac.pref',
  'Types: deb',
  'URIs: https://dist.gpac.io/gpac/linux/debian',
  'Suites: bookworm',
  'Components: main',
  'Signed-By: /usr/share/keyrings/gpac-archive-keyring.gpg',
  'Package: gpac',
  'Pin: origin "dist.gpac.io"',
  'Pin-Priority: 501',
  'apt-cache policy gpac',
  'gpac=${candidate}',
  'apt-get install -s --no-install-recommends',
  'dpkg-query -W',
  'command -v MP4Box'
]
for (const text of dockerRequired) {
  if (!docker.includes(text)) fail(`Dockerfile missing ${text}`)
}
if (/Components:\s*nightly/i.test(docker)) fail('Dockerfile uses nightly component')
if (/Bento4/i.test(docker)) fail('Dockerfile references Bento4')
if (/MP4Box\s+-version/i.test(docker)) fail('Dockerfile executes MP4Box version')
if (/MP4Box\s+[^|&;]/i.test(docker.replace(/command -v MP4Box/g, ''))) fail('Dockerfile appears to execute MP4Box')
if (!/for package_name in/.test(docker) || !/unexpected GPAC repository package/.test(docker)) fail('Dockerfile missing simulated dependency source guard')

const decision = json(`${packetDir}/gpac-mp4box-official-apt-install-source-execution-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.sourceClass !== 'official_gpac_apt_repository') fail('source class drift')
if (decision.repository?.uri !== 'https://dist.gpac.io/gpac/linux/debian') fail('repository uri drift')
if (decision.repository?.codename !== 'bookworm') fail('codename drift')
if (decision.repository?.component !== 'main') fail('component drift')
if (decision.repository?.blockedComponent !== 'nightly') fail('blocked component drift')
if (decision.repository?.keyEndpoint !== 'https://dist.gpac.io/gpac/linux/gpg.asc') fail('key endpoint drift')
if (decision.repository?.sourceFile !== '/etc/apt/sources.list.d/gpac.sources') fail('source file drift')
if (decision.repository?.keyringPath !== '/usr/share/keyrings/gpac-archive-keyring.gpg') fail('keyring path drift')
if (decision.repository?.preferencesFile !== '/etc/apt/preferences.d/gpac.pref') fail('preferences path drift')
if (decision.repository?.packageName !== 'gpac') fail('package name drift')
if (decision.repository?.selectedCandidateVersion !== candidateVersion) fail('candidate version drift')
if (decision.repository?.architecture !== architecture) fail('architecture drift')
if (decision.installSourceExecution?.dockerfileTarget !== dockerfile) fail('dockerfile target drift')
for (const key of ['dockerBuildPassed', 'aptSourceWritten', 'keyringWritten', 'preferencesWritten', 'aptPolicyRecorded', 'packageInstalled', 'packagePresenceProven', 'binaryPresenceProven']) {
  if (decision.installSourceExecution?.[key] !== true) fail(`${key} drift`)
}
if (decision.installSourceExecution?.exactCandidateSelected !== candidateVersion) fail('exact candidate drift')
if (decision.installSourceExecution?.mp4boxPath !== '/usr/bin/MP4Box') fail('MP4Box path drift')
if (decision.installSourceExecution?.localImagePushed !== false || decision.installSourceExecution?.deployed !== false) fail('push/deploy drift')
for (const key of ['runtimeApprovedNow', 'mp4boxVersionApprovedNow', 'mediaProcessingApprovedNow', 'productUseApprovedNow', 'betaApprovedNow', 'productionApprovedNow', 'publicArtifactApprovedNow', 'signedUrlApprovedNow']) {
  if (decision.approvalBoundary?.[key] !== false) fail(`${key} drift`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const source = json(`${packetDir}/apt-source-keyring-report.json`)
if (source.aptSource?.fields?.URIs !== 'https://dist.gpac.io/gpac/linux/debian') fail('source report URI drift')
if (source.aptSource?.fields?.Suites !== 'bookworm') fail('source report suite drift')
if (source.aptSource?.fields?.Components !== 'main') fail('source report component drift')
if (source.aptSource?.fields?.['Signed-By'] !== '/usr/share/keyrings/gpac-archive-keyring.gpg') fail('source report Signed-By drift')
if (source.keyring?.aptKeyUsed !== false) fail('legacy apt-key drift')
for (const value of Object.values(source.blocked ?? {})) {
  if (value !== true) fail('blocked alternative drift')
}

const pinning = json(`${packetDir}/apt-pinning-report.json`)
if (pinning.preferences?.package !== 'gpac') fail('pinning package drift')
if (pinning.preferences?.pin !== 'origin \"dist.gpac.io\"') fail('pinning origin drift')
if (pinning.preferences?.pinPriority !== 501) fail('pin priority drift')
if (pinning.preferences?.scope !== 'package_only_gpac') fail('pinning scope drift')
if (pinning.simulationPolicy?.rejectNonGpacPackageFromGpacRepo !== true) fail('simulation guard drift')

const build = json(`${packetDir}/docker-build-report.json`)
if (build.docker?.buildResult !== 'passed') fail('Docker build result drift')
if (build.docker?.pushed !== false || build.docker?.deployed !== false) fail('Docker push/deploy drift')
if (build.docker?.buildContext?.packageLockMutated !== false) fail('package-lock mutation drift')
if (build.docker?.buildContext?.remotionExecution !== false || build.docker?.buildContext?.renderExportExecution !== false) fail('build context proof boundary drift')

const install = json(`${packetDir}/package-install-proof-report.json`)
if (install.packageProof?.package !== 'gpac') fail('install package drift')
if (install.packageProof?.version !== candidateVersion) fail('install version drift')
if (install.packageProof?.architecture !== architecture) fail('install architecture drift')
if (install.packageProof?.nonGpacPackagesFromGpacRepo?.length !== 0) fail('unexpected GPAC repo dependency drift')

const binary = json(`${packetDir}/binary-presence-proof-report.json`)
if (binary.containerCheck?.network !== 'none') fail('container network drift')
if (binary.containerCheck?.mp4boxPath !== '/usr/bin/MP4Box') fail('binary MP4Box path drift')
if (binary.containerCheck?.mp4boxExecuted !== false || binary.containerCheck?.mp4boxVersionExecuted !== false || binary.containerCheck?.mediaCommandExecuted !== false) fail('binary execution boundary drift')
if (binary.containerCheck?.packageResourceFilesCommittedToRepo !== false) fail('package resource commit drift')

const boundary = json(`${packetDir}/boundary-review.json`)
const boundaryKeys = [
  'gpacMp4boxRuntimeExecution',
  'mp4boxVersionExecution',
  'mp4boxMediaCommand',
  'gpacMediaProcessing',
  'bento4Execution',
  'vapoursynthExecution',
  'revideoExecution',
  'hyperframeExecution',
  'gstreamerExecution',
  'mkvtoolnixExecution',
  'ffmpegFfprobeExecution',
  'remotionExecutionAcceptedAsProof',
  'renderExport',
  'browserCapture',
  'workerRouteProviderExecution',
  'supabaseGcsSql',
  'publicArtifacts',
  'signedUrls',
  'betaUnlock',
  'productionUnlock',
  'productRuntimeApproval'
]
for (const key of boundaryKeys) {
  if (boundary[key] !== false) fail(`boundary ${key} was enabled`)
}

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'mediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`artifact manifest ${key} is not empty`)
}
if (manifest.transientLocalEvidenceCommitted !== false) fail('transient evidence commit drift')

for (const file of protectedUnchangedFiles) {
  gitQuiet(['diff', '--quiet', '--', file], `${file} changed`)
  gitQuiet(['diff', '--cached', '--quiet', '--', file], `${file} staged`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only'])
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file.endsWith('.sql')) fail(`forbidden changed path ${file}`)
  if (file.startsWith('docker/') && file !== dockerfile) fail(`unexpected Docker path ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i.test(file)) fail(`artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
  if (/package-lock\.json|\.dockerignore|requirements|supabase|database|public/i.test(file)) fail(`protected path changed ${file}`)
}

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log('TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-EXECUTION-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log(`Candidate: ${candidateVersion} (${architecture})`)
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
