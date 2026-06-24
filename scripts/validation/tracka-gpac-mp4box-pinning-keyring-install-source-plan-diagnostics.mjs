#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-pinning-keyring-install-source-plan'

const requiredFiles = [
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/apt-source-stanza-plan.json`,
  `${packetDir}/apt-source-stanza-plan.md`,
  `${packetDir}/keyring-plan.json`,
  `${packetDir}/keyring-plan.md`,
  `${packetDir}/apt-pinning-plan.json`,
  `${packetDir}/apt-pinning-plan.md`,
  `${packetDir}/version-package-metadata-plan.json`,
  `${packetDir}/version-package-metadata-plan.md`,
  `${packetDir}/future-dockerfile-patch-proposal.json`,
  `${packetDir}/future-dockerfile-patch-proposal.md`,
  `${packetDir}/rollback-cleanup-policy.json`,
  `${packetDir}/rollback-cleanup-policy.md`,
  `${packetDir}/boundary-review.json`,
  `${packetDir}/boundary-review.md`,
  `${packetDir}/gpac-mp4box-pinning-keyring-install-source-plan-decision.json`,
  `${packetDir}/gpac-mp4box-pinning-keyring-install-source-plan-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/validation-results.md`,
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-official-apt-install-source-execution-1.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-pinning-keyring-install-source-plan-diagnostics.mjs'
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-PINNING-KEYRING-INSTALL-SOURCE-PLAN-1',
  'TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-EXECUTION-1',
  'tracka_gpac_mp4box_pinning_keyring_install_source_plan_passed_ready_for_official_apt_install_source_execution',
  'tracka_gpac_mp4box_official_apt_repo_approval_passed_ready_for_pinning_keyring_install_source_plan',
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
  'gpac=<candidate-version>',
  'Pin: origin "dist.gpac.io"',
  'Pin-Priority: 501',
  'Signed-By: /usr/share/keyrings/gpac-archive-keyring.gpg',
  'c88993c228200dece139005eb28fec06b7f3933122fee5612a85d4cb5b94c7ad',
  '2.4-rev0-g5d70253ac-HEAD',
  '26.02-rev0-g118e60a90-HEAD',
  'separate_not_selected_for_mp4box_command_path',
  'closed_without_merge_stale_context',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Product-ready local OSS tools: `0`',
  'Track B FFmpeg/FFprobe ownership remains preserved',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`',
  'Generated artifacts committed: `none`',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'PRODUCTION_FOUNDATION_STATUS.md'
]

const forbiddenPatterns = [
  /40\+ tools/i,
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /aptSourceMutationApproved(?:Now)?"\s*:\s*true/i,
  /aptKeyImportApproved(?:Now)?"\s*:\s*true/i,
  /aptUpdateApproved(?:Now)?"\s*:\s*true/i,
  /packageInstallApproved(?:Now)?"\s*:\s*true/i,
  /dockerfileMutationApproved(?:Now)?"\s*:\s*true/i,
  /runtimeApproved(?:Now)?"\s*:\s*true/i,
  /productUseApproved(?:Now)?"\s*:\s*true/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /public artifacts?:\s*`?(created|enabled|true)/i,
  /signed URLs?:\s*`?(created|enabled|true)/i,
  /GPAC\/MP4Box execution:\s*`?(completed|passed|true|run|executed)/i,
  /Bento4 execution:\s*`?(completed|passed|true|run|executed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|passed|true|run|executed)/i,
  /Docker build\/run:\s*`?(completed|passed|true|run|executed)/i,
  /apt source mutation:\s*`?(completed|passed|true|run|executed)/i,
  /apt key import:\s*`?(completed|passed|true|run|executed)/i,
  /apt update:\s*`?(completed|passed|true|run|executed)/i,
  /package install:\s*`?(completed|passed|true|run|executed)/i,
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
  console.error(`TRACKA-GPAC-MP4BOX-PINNING-KEYRING-INSTALL-SOURCE-PLAN-1 diagnostics failed: ${message}`)
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

const decision = json(`${packetDir}/gpac-mp4box-pinning-keyring-install-source-plan-decision.json`)
if (decision.decision !== 'tracka_gpac_mp4box_pinning_keyring_install_source_plan_passed_ready_for_official_apt_install_source_execution') fail('decision drift')
if (decision.sourceClass !== 'official_gpac_apt_repository') fail('source class drift')
if (decision.repository?.uri !== 'https://dist.gpac.io/gpac/linux/debian') fail('repository uri drift')
if (decision.repository?.codename !== 'bookworm') fail('codename drift')
if (decision.repository?.component !== 'main') fail('component drift')
if (decision.repository?.blockedComponent !== 'nightly') fail('blocked component drift')
if (decision.repository?.sourceFile !== '/etc/apt/sources.list.d/gpac.sources') fail('source file drift')
if (decision.repository?.keyringPath !== '/usr/share/keyrings/gpac-archive-keyring.gpg') fail('keyring path drift')
if (decision.repository?.preferencesFile !== '/etc/apt/preferences.d/gpac.pref') fail('preferences path drift')
if (decision.repository?.packageCandidate !== 'gpac') fail('package candidate drift')
if (decision.futureExecutionPlan?.readyForOfficialAptInstallSourceExecution !== true) fail('future execution readiness drift')
if (decision.futureExecutionPlan?.packageInstallForm !== 'gpac=<candidate-version>') fail('package install form drift')
for (const key of ['aptSourceMutationApprovedNow', 'aptKeyImportApprovedNow', 'aptUpdateApprovedNow', 'packageInstallApprovedNow', 'dockerfileMutationApprovedNow', 'runtimeApprovedNow', 'productUseApprovedNow']) {
  if (decision.approvalBoundary?.[key] !== false) fail(`${key} drift`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B ownership drift')
if (decision.pr577Excluded !== true) fail('#577 exclusion drift')
if (decision.nextPrompt !== 'TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-EXECUTION-1') fail('next prompt drift')

const stanza = json(`${packetDir}/apt-source-stanza-plan.json`)
if (stanza.sourceType !== 'deb822_sources_file') fail('source type drift')
if (stanza.repository?.components !== 'main') fail('stanza component drift')
if (stanza.repository?.signedBy !== '/usr/share/keyrings/gpac-archive-keyring.gpg') fail('signed-by drift')
if (stanza.blocked?.componentNightly !== true) fail('nightly block drift')
for (const key of ['sourceFileMutationApproved', 'aptUpdateApproved', 'packageInstallApproved', 'runtimeApproved', 'productUseApproved']) {
  if (stanza.approvalBoundary?.[key] !== false) fail(`${key} drift`)
}

const keyring = json(`${packetDir}/keyring-plan.json`)
if (keyring.futureKeyringPath !== '/usr/share/keyrings/gpac-archive-keyring.gpg') fail('keyring plan path drift')
if (keyring.keyImportMethod !== 'future_gpg_dearmor_only_no_apt_key') fail('key import method drift')
for (const key of ['keyFetchApproved', 'keyImportApproved', 'keyringWriteApproved', 'aptKeyApproved', 'runtimeApproved', 'productUseApproved']) {
  if (keyring.approvalBoundary?.[key] !== false) fail(`${key} drift`)
}

const pinning = json(`${packetDir}/apt-pinning-plan.json`)
if (pinning.futurePreferencesFile !== '/etc/apt/preferences.d/gpac.pref') fail('pinning preferences path drift')
if (pinning.scope !== 'package_only_gpac') fail('pinning scope drift')
if (pinning.policy?.avoidBroadOriginPriority !== true || pinning.policy?.componentMainOnly !== true || pinning.policy?.componentNightlyBlocked !== true) fail('pinning policy drift')

const version = json(`${packetDir}/version-package-metadata-plan.json`)
if (version.packageCandidate !== 'gpac') fail('version package candidate drift')
if (version.futureVersionSelectionPolicy?.installForm !== 'gpac=<candidate-version>') fail('version install form drift')
if (version.futureVersionSelectionPolicy?.blockIfCandidateNotFromMain !== true) fail('candidate source block drift')
if (version.approvalBoundary?.versionSelectedNow !== false || version.approvalBoundary?.packageInstallApproved !== false) fail('version approval drift')

const boundary = json(`${packetDir}/boundary-review.json`)
for (const [key, value] of Object.entries(boundary)) {
  if (value !== false) fail(`boundary ${key} was enabled`)
}

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'mediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`artifact manifest ${key} is not empty`)
}

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-pinning-keyring-install-source-plan:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-pinning-keyring-install-source-plan-diagnostics.mjs') {
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

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log('TRACKA-GPAC-MP4BOX-PINNING-KEYRING-INSTALL-SOURCE-PLAN-1 diagnostics passed')
