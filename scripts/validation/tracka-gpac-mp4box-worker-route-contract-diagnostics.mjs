#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-worker-route-contract'
const decisionText = 'tracka_gpac_mp4box_worker_route_contract_passed_ready_for_mock_worker_interface_packet'
const executionText = 'completed_docs_only_route_contract_no_runtime_execution'
const priorDecisionText = 'tracka_gpac_mp4box_worker_integration_plan_passed_ready_for_route_contract_and_mock_worker_interface'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1'
const outputSha = 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8'

const packetFiles = [
  `${packetDir}/gpac-mp4box-worker-route-contract-decision.json`,
  `${packetDir}/gpac-mp4box-worker-route-contract-decision.md`,
  `${packetDir}/mock-worker-interface.json`,
  `${packetDir}/mock-worker-interface.md`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/route-contract.json`,
  `${packetDir}/route-contract.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`
]

const requiredFiles = [
  ...packetFiles,
  'docs/activation-phase-tracka-gpac-mp4box-worker-route-contract-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-mock-worker-interface-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-worker-route-contract-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/gpac-mp4box-worker-integration-plan-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/route-boundary.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-worker-integration-plan-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-worker-route-contract-diagnostics.mjs'
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-WORKER-ROUTE-CONTRACT-1',
  nextPrompt,
  decisionText,
  executionText,
  priorDecisionText,
  'gpac=26.02-rev0-g118e60a90-HEAD',
  'arm64',
  '/usr/bin/MP4Box',
  outputSha,
  'approvedSnapshotRef',
  'approvalRecordRef',
  'routeIdempotencyKey',
  'privateInputManifestRef',
  'gpacMp4boxRouteContractRef',
  'blocked_pending_mock_worker_interface_route_implementation_guarded_worker_execution_and_private_artifact_policy',
  'External beta GPAC/MP4Box product use: `blocked`',
  'Product-ready local OSS tools: `0`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  '#577 remains excluded'
]

const forbiddenPatterns = [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForProductRuntime"\s*:\s*true/i,
  /readyForExternalBeta"\s*:\s*true/i,
  /readyForProduction"\s*:\s*true/i,
  /readyForRouteImplementation"\s*:\s*true/i,
  /readyForWorkerExecution"\s*:\s*true/i,
  /runtimeExecution"\s*:\s*true/i,
  /packageDependencyChangeAllowed"\s*:\s*true/i,
  /packageLockMutationAllowed"\s*:\s*true/i,
  /supabaseMutationAccepted"\s*:\s*true/i,
  /sqlExecutionAccepted"\s*:\s*true/i,
  /publicArtifactCreationAccepted"\s*:\s*true/i,
  /signedUrlCreationAccepted"\s*:\s*true/i,
  /productionUnlockAccepted"\s*:\s*true/i
]

const forbiddenEnv = [
  'REEDITPRO_CONFIRM_DOCKER_BUILD',
  'REEDITPRO_CONFIRM_DOCKER_RUN',
  'REEDITPRO_CONFIRM_GPAC_EXECUTION',
  'REEDITPRO_CONFIRM_MP4BOX_EXECUTION',
  'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_RENDER_EXPORT',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK'
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-WORKER-ROUTE-CONTRACT-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-worker-route-contract:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-worker-route-contract-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

const corpus = requiredFiles.filter((file) => !file.startsWith('scripts/validation/')).map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched ${pattern}`)
}

const priorDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/gpac-mp4box-worker-integration-plan-decision.json')
if (priorDecision.decision !== priorDecisionText) fail('prior integration plan decision drift')
if (priorDecision.nextPrompt !== 'TRACKA-GPAC-MP4BOX-WORKER-ROUTE-CONTRACT-1') fail('prior integration next prompt drift')
if (priorDecision.productReadyLocalOssTools !== 0) fail('prior product-ready count drift')

const proofDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json')
if (proofDecision.proof?.outputSha256 !== outputSha) fail('accepted output SHA drift')

const decision = json(`${packetDir}/gpac-mp4box-worker-route-contract-decision.json`)
if (decision.decision !== decisionText) fail('route contract decision drift')
if (decision.execution !== executionText) fail('route contract execution drift')
if (decision.readiness?.routeContract !== 'passed') fail('route contract readiness drift')
if (decision.readiness?.mockWorkerInterfacePacket !== 'ready') fail('mock worker packet readiness drift')
if (decision.readiness?.routeImplementation !== 'blocked_pending_mock_worker_interface_and_service_role_route_implementation_packet') fail('route implementation readiness drift')
if (decision.readiness?.workerExecution !== 'blocked') fail('worker execution blocker drift')
if (decision.readiness?.productRuntime !== 'blocked_pending_mock_worker_interface_route_implementation_guarded_worker_execution_and_private_artifact_policy') fail('product runtime blocker drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}

const route = json(`${packetDir}/route-contract.json`)
if (route.decision !== decisionText) fail('route decision drift')
if (route.execution !== executionText) fail('route execution drift')
for (const input of ['rawChat', 'rawCommandString', 'frontendFilePath', 'publicUrl', 'signedUrlAsSourceOfTruth', 'arbitraryPrivateMedia']) {
  if (!route.rejectedRequestInputs?.includes(input)) fail(`missing rejected input ${input}`)
}
if (route.runtimeExecution !== false) fail('route runtime execution drift')

const mock = json(`${packetDir}/mock-worker-interface.json`)
if (mock.typeScriptOnlyFuturePacket !== true) fail('mock interface future packet drift')
if (mock.packageDependencyChangeAllowed !== false) fail('package dependency boundary drift')
if (mock.packageLockMutationAllowed !== false) fail('package-lock boundary drift')
if (mock.runtimeExecutionAllowed !== false) fail('runtime boundary drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.routeContractPassed !== true) fail('route contract passed drift')
if (readiness.mockWorkerInterfacePacketReady !== true) fail('mock worker packet readiness drift')
for (const key of ['readyForRouteImplementation', 'readyForWorkerExecution', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'committedMediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`manifest ${key} is not empty`)
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
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log('TRACKA-GPAC-MP4BOX-WORKER-ROUTE-CONTRACT-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log('Mock worker interface packet readiness: ready')
console.log('Product runtime: blocked_pending_mock_worker_interface_route_implementation_guarded_worker_execution_and_private_artifact_policy')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
