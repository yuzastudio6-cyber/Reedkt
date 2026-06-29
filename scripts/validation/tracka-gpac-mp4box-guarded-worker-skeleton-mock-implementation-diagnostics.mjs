#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-skeleton-mock-implementation'
const decisionText = 'tracka_gpac_mp4box_guarded_worker_skeleton_mock_implementation_passed_ready_for_private_artifact_policy_mock'
const executionText = 'completed_disabled_worker_skeleton_contract_no_worker_or_tool_execution'
const priorDecision = 'tracka_gpac_mp4box_guarded_worker_enqueue_mock_implementation_passed_ready_for_guarded_worker_skeleton_mock'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-POLICY-MOCK-IMPLEMENTATION-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-worker-skeleton-mock-implementation-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-worker-skeleton-mock-implementation-decision.md`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/worker-skeleton-contract.json`,
  `${packetDir}/worker-skeleton-contract.md`,
]

const sourceFiles = [
  'src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts.ts',
  'src/backend/contracts/gpac-mp4box-private-artifact-policy-mock-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/tracka-gpac-mp4box-guarded-worker-skeleton-mock-implementation-smoke.ts',
  'server/smoke/tracka-gpac-mp4box-private-artifact-policy-mock-implementation-smoke.ts',
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const priorFiles = [
  'docs/activation-phase-tracka-gpac-mp4box-guarded-worker-enqueue-mock-implementation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-worker-skeleton-mock-implementation-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-enqueue-mock-implementation/gpac-mp4box-guarded-worker-enqueue-mock-implementation-decision.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-worker-enqueue-mock-implementation-diagnostics.mjs',
]

const nextPrivateArtifactPolicyFiles = [
  'docs/activation-phase-tracka-gpac-mp4box-private-artifact-policy-mock-implementation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-private-artifact-manifest-mock-implementation-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-policy-mock-implementation/gpac-mp4box-private-artifact-policy-mock-implementation-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-policy-mock-implementation/gpac-mp4box-private-artifact-policy-mock-implementation-decision.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-policy-mock-implementation/private-artifact-manifest.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-policy-mock-implementation/private-artifact-policy.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-policy-mock-implementation/private-artifact-policy.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-policy-mock-implementation/readiness-report.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-policy-mock-implementation/source-of-truth-audit.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-policy-mock-implementation/source-of-truth-audit.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-policy-mock-implementation/validation-results.md',
  'src/backend/contracts/gpac-mp4box-private-artifact-policy-mock-contracts.ts',
  'server/smoke/tracka-gpac-mp4box-private-artifact-policy-mock-implementation-smoke.ts',
  'scripts/validation/tracka-gpac-mp4box-private-artifact-policy-mock-implementation-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...sourceFiles,
  ...statusFiles,
  ...priorFiles,
  ...nextPrivateArtifactPolicyFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-worker-skeleton-mock-implementation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-private-artifact-policy-mock-implementation-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-worker-skeleton-mock-implementation-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-SKELETON-MOCK-IMPLEMENTATION-1',
  nextPrompt,
  decisionText,
  executionText,
  priorDecision,
  'worker.gpacMp4box.packageValidation.mock',
  'disabled_mock_worker_skeleton_only',
  'metadata_validation_only',
  'render_export',
  'blocked_worker_execution_not_enabled',
  'blocked_queue_item_not_queued',
  'blocked_public_or_signed_artifact_attempt',
  'Product-ready local OSS tools: `0`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
]

const forbiddenDocPatterns = [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForProductRuntime"\s*:\s*true/i,
  /readyForExternalBetaProductUse"\s*:\s*true/i,
  /readyForProduction"\s*:\s*true/i,
  /readyForWorkerDispatch"\s*:\s*true/i,
  /readyForWorkerExecution"\s*:\s*true/i,
  /readyForGpacMp4boxExecution"\s*:\s*true/i,
  /readyForMediaProcessing"\s*:\s*true/i,
  /readyForStorageTransfer"\s*:\s*true/i,
  /routeExecution"\s*:\s*true/i,
  /workerDispatchAttempted"\s*:\s*true/i,
  /workerExecution"\s*:\s*true/i,
  /gpacMp4boxExecution"\s*:\s*true/i,
  /mediaProcessing"\s*:\s*true/i,
  /storageTransfer"\s*:\s*true/i,
  /supabaseMutation"\s*:\s*true/i,
  /sqlExecution"\s*:\s*true/i,
  /signedUrlCreation"\s*:\s*true/i,
  /publicArtifactCreation"\s*:\s*true/i,
  /externalBetaExpansion"\s*:\s*true/i,
  /paidProductionUnlock"\s*:\s*true/i,
  /productionUnlock"\s*:\s*true/i,
]

const forbiddenSourcePatterns = [
  /from ['"]node:child_process['"]/,
  /\bexec(File|Sync)?\s*\(/,
  /\bspawn\s*\(/,
  /\bfork\s*\(/,
  /\bfetch\s*\(/,
  /createClient\s*\(/,
  /service[_-]?role[_-]?key/i,
  /SUPABASE_SERVICE_ROLE/i,
  /\bdocker\s+(build|run|push|compose|deploy)/i,
  /\bffmpeg\b/i,
  /\bffprobe\b/i,
  /\bgst-launch\b/i,
  /\bmkvmerge\b/i,
  /\bMP4Box\s+-/i,
  /\bgpac\s+-/i,
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-GUARDED-WORKER-SKELETON-MOCK-IMPLEMENTATION-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-worker-skeleton-mock-implementation:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-worker-skeleton-mock-implementation-diagnostics.mjs') fail('missing package diagnostics script')
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-guarded-worker-skeleton-mock-implementation'] !== 'tsx server/smoke/tracka-gpac-mp4box-guarded-worker-skeleton-mock-implementation-smoke.ts') fail('missing package smoke script')

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .filter((file) => !file.startsWith('src/'))
  .filter((file) => !file.startsWith('server/smoke/'))
  .map((file) => read(file))
  .join('\n')
const sourceCorpus = sourceFiles.map((file) => read(file)).join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text) && !sourceCorpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim matched ${pattern}`)
}
for (const file of sourceFiles) {
  const source = read(file)
  for (const pattern of forbiddenSourcePatterns) {
    if (pattern.test(source)) fail(`${file} contains forbidden runtime pattern ${pattern}`)
  }
}

const contractSource = read('src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts.ts')
for (const text of [
  'GpacMp4boxGuardedWorkerSkeletonMockInput',
  'GpacMp4boxGuardedWorkerSkeletonMockResult',
  'workerSkeletonEnabled: false',
  'workerDispatchAttempted: false',
  'workerExecution: false',
  'gpacMp4boxExecution: false',
  'storageTransfer: false',
  'publicArtifactCreation: false',
]) {
  if (!contractSource.includes(text)) fail(`worker skeleton contract missing ${text}`)
}
if (contractSource.includes('dispatchMockWorkerJob')) fail('worker skeleton must not call dispatchMockWorkerJob')
if (!read('src/backend/contracts/index.ts').includes("export * from './gpac-mp4box-guarded-worker-skeleton-mock-contracts'")) fail('contract index export missing')

const decision = json(`${packetDir}/gpac-mp4box-guarded-worker-skeleton-mock-implementation-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.skeletonId !== 'worker.gpacMp4box.packageValidation.mock') fail('skeleton id drift')
if (decision.skeletonMode !== 'disabled_mock_worker_skeleton_only') fail('skeleton mode drift')
if (decision.queueConsumptionMode !== 'metadata_validation_only') fail('queue consumption drift')
if (decision.workerKind !== 'render_export') fail('worker kind drift')
if (decision.readiness?.privateArtifactPolicyMock !== 'ready') fail('next readiness drift')
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const contract = json(`${packetDir}/worker-skeleton-contract.json`)
if (contract.typeScriptContract !== 'src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts.ts') fail('contract source path drift')
if (contract.skeletonMode !== 'disabled_mock_worker_skeleton_only') fail('contract skeleton mode drift')
for (const key of ['routeExecution', 'workerDispatchAttempted', 'workerExecution', 'gpacMp4boxExecution', 'mediaProcessing', 'storageTransfer', 'supabaseMutation', 'sqlExecution']) {
  if (contract.execution?.[key] !== false) fail(`contract ${key} was enabled`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.disabledWorkerSkeletonContractPassed !== true) fail('readiness skeleton contract drift')
if (readiness.readyForPrivateArtifactPolicyMockPacket !== true) fail('readiness next gate drift')
for (const key of ['readyForRuntimeRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')

const prior = json('docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-enqueue-mock-implementation/gpac-mp4box-guarded-worker-enqueue-mock-implementation-decision.json')
if (prior.decision !== priorDecision) fail('prior enqueue decision drift')

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'committedMediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs', 'storageTransfers']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`manifest ${key} is not empty`)
}
if (manifest.skeletonMetadataOnly !== true) fail('skeleton metadata flag drift')

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\//.test(file) && !sourceFiles.includes(file)) fail(`forbidden src path changed ${file}`)
  if (/^server\//.test(file) && !sourceFiles.includes(file)) fail(`forbidden server path changed ${file}`)
  if (/^supabase\/|^database\/|^public\//.test(file)) fail(`forbidden changed path ${file}`)
  if (/^docker\//.test(file)) fail(`Docker path changed ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i.test(file)) fail(`artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
  if (/package-lock\.json|\.dockerignore|requirements|supabase|database|public/i.test(file)) fail(`protected path changed ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log('TRACKA-GPAC-MP4BOX-GUARDED-WORKER-SKELETON-MOCK-IMPLEMENTATION-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log('Worker skeleton: registered disabled mock-only')
console.log('Worker dispatch, worker execution, GPAC/MP4Box execution, media processing, and storage transfer: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
