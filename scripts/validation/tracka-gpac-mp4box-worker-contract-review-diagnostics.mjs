#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-worker-contract-review'
const decisionText = 'tracka_gpac_mp4box_worker_contract_review_passed_ready_for_worker_integration_plan'
const executionText = 'completed_docs_only_worker_contract_review_no_runtime_execution'
const priorDecisionText = 'tracka_gpac_mp4box_controlled_synthetic_media_command_qa_passed_ready_for_worker_contract_review'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-WORKER-INTEGRATION-PLAN-1'
const outputSha = 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8'

const packetFiles = [
  `${packetDir}/artifact-policy.json`,
  `${packetDir}/artifact-policy.md`,
  `${packetDir}/gpac-mp4box-worker-contract-review-decision.json`,
  `${packetDir}/gpac-mp4box-worker-contract-review-decision.md`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/product-boundary.json`,
  `${packetDir}/product-boundary.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/worker-contract.json`,
  `${packetDir}/worker-contract.md`
]

const workerIntegrationPlanFiles = [
  'docs/activation-phase-tracka-gpac-mp4box-worker-integration-plan-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-worker-route-contract-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/artifact-policy.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/artifact-policy.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/gpac-mp4box-worker-integration-plan-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/gpac-mp4box-worker-integration-plan-decision.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/private-artifact-manifest.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/readiness-report.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/route-boundary.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/route-boundary.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/source-of-truth-audit.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/source-of-truth-audit.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/validation-results.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/worker-integration-plan.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-integration-plan/worker-integration-plan.md',
  'scripts/validation/tracka-gpac-mp4box-worker-integration-plan-diagnostics.mjs'
]

const requiredFiles = [
  ...packetFiles,
  ...workerIntegrationPlanFiles,
  'docs/activation-phase-tracka-gpac-mp4box-worker-contract-review-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-worker-integration-plan-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-worker-contract-review-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-qa/gpac-mp4box-controlled-synthetic-media-command-qa-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/mp4box-command-report.json',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-controlled-synthetic-media-command-qa-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-worker-contract-review-diagnostics.mjs'
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-WORKER-CONTRACT-REVIEW-1',
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
  'workerLeaseRef',
  'routeIdempotencyKey',
  'privateInputManifestRef',
  'privateArtifactManifestRef',
  'toolRuntimePolicyRef',
  'gpacMp4boxWorkerContractRef',
  'blocked_pending_worker_integration_plan_private_artifact_policy_and_route_gate',
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
  /workerExecutionAccepted"\s*:\s*true/i,
  /routeExecutionAccepted"\s*:\s*true/i,
  /providerExecutionAccepted"\s*:\s*true/i,
  /mediaProcessingAccepted"\s*:\s*true/i,
  /userPrivateRealMediaAccepted"\s*:\s*true/i,
  /signedUrlCreationAccepted"\s*:\s*true/i,
  /publicArtifactCreationAccepted"\s*:\s*true/i,
  /gpacMp4boxRuntimeExecution"\s*:\s*true/i,
  /ffmpegFfprobeAccepted"\s*:\s*true/i,
  /supabaseMutationAccepted"\s*:\s*true/i,
  /sqlExecutionAccepted"\s*:\s*true/i,
  /deploymentAccepted"\s*:\s*true/i,
  /productionUnlockAccepted"\s*:\s*true/i,
  /packageLockMutationAccepted"\s*:\s*true/i
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
  'REEDITPRO_CONFIRM_GCS_UPLOAD',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT'
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-WORKER-CONTRACT-REVIEW-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-worker-contract-review:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-worker-contract-review-diagnostics.mjs') {
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

const priorDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-qa/gpac-mp4box-controlled-synthetic-media-command-qa-decision.json')
if (priorDecision.decision !== priorDecisionText) fail('prior QA decision drift')
if (priorDecision.nextPrompt !== 'TRACKA-GPAC-MP4BOX-WORKER-CONTRACT-REVIEW-1') fail('prior QA next prompt drift')
if (priorDecision.productReadyLocalOssTools !== 0) fail('prior QA product-ready count drift')
if (priorDecision.pr577Excluded !== true) fail('#577 exclusion drift in prior QA')

const commandReport = json('docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/mp4box-command-report.json')
const proofDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json')
if (proofDecision.proof?.outputSha256 !== outputSha) fail('accepted output SHA drift')
if (commandReport.ffmpegFfprobeUsed !== false) fail('FFmpeg/FFprobe helper drift')
if (commandReport.userPrivateRealMediaUsed !== false) fail('user/private/real media drift')

const decision = json(`${packetDir}/gpac-mp4box-worker-contract-review-decision.json`)
if (decision.decision !== decisionText) fail('worker contract decision drift')
if (decision.execution !== executionText) fail('worker contract execution drift')
if (decision.readiness?.workerContractReview !== 'passed') fail('worker contract review status drift')
if (decision.readiness?.workerIntegrationPlan !== 'ready') fail('worker integration plan readiness drift')
if (decision.readiness?.productRuntime !== 'blocked_pending_worker_integration_plan_private_artifact_policy_and_route_gate') fail('product runtime readiness drift')
if (decision.readiness?.externalBeta !== 'blocked_for_gpac_mp4box_product_use') fail('external beta GPAC/MP4Box blocker drift')
if (decision.readiness?.production !== 'blocked') fail('production blocker drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}

const contract = json(`${packetDir}/worker-contract.json`)
if (contract.contract !== 'gpac_mp4box_worker_contract') fail('contract name drift')
if (contract.status !== 'worker_contract_review_passed_no_worker_execution') fail('contract status drift')
for (const field of ['approvedSnapshotRef', 'approvalRecordRef', 'jobRef', 'workerLeaseRef', 'routeIdempotencyKey', 'sourceSequenceMapRef', 'compiledIntentRef', 'modelRoutingPolicyRef', 'qaPolicyRef', 'privateInputManifestRef', 'privateArtifactManifestRef', 'privateArtifactChecksumRef', 'toolRuntimePolicyRef', 'gpacMp4boxWorkerContractRef']) {
  if (!contract.requiredInputs?.includes(field)) fail(`missing contract input ${field}`)
}
if (contract.futureCommandScope?.exactCommandTemplatesRequiredBeforeExecution !== true) fail('exact command template requirement drift')
if (contract.futureCommandScope?.networkDisabledByDefault !== true) fail('network-disabled future default drift')
for (const key of ['ffmpegFfprobeHelperExpansion', 'finalRenderExport', 'publicArtifactWrite', 'signedUrlSourceOfTruth']) {
  if (contract.futureCommandScope?.[key] !== false) fail(`future command scope ${key} drift`)
}

const artifactPolicy = json(`${packetDir}/artifact-policy.json`)
if (artifactPolicy.artifactPolicy !== 'gpac_mp4box_worker_artifact_policy') fail('artifact policy name drift')
if (artifactPolicy.publicArtifacts !== 'blocked') fail('public artifact policy drift')
if (artifactPolicy.signedUrls !== 'blocked_as_source_of_truth') fail('signed URL policy drift')
if (artifactPolicy.productRuntimeArtifactHandoff !== 'blocked_pending_worker_integration_plan') fail('artifact handoff drift')
for (const key of ['committedMediaArtifacts', 'generatedArtifactsCommitted']) {
  if (!Array.isArray(artifactPolicy[key]) || artifactPolicy[key].length !== 0) fail(`artifact policy ${key} is not empty`)
}

const productBoundary = json(`${packetDir}/product-boundary.json`)
for (const value of Object.values(productBoundary.allowedByThisReview ?? {})) {
  if (value !== true) fail('allowed planning boundary drift')
}
for (const value of Object.values(productBoundary.stillBlocked ?? {})) {
  if (value !== true) fail('product blocked boundary drift')
}
if (productBoundary.trackBFFmpegFFprobeOwnershipPreserved !== true) fail('Track B ownership drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.workerContractReview !== 'passed') fail('worker contract readiness drift')
if (readiness.readyForWorkerIntegrationPlan !== true) fail('worker integration plan readiness drift')
for (const key of ['readyForWorkerExecution', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForProduction']) {
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

console.log('TRACKA-GPAC-MP4BOX-WORKER-CONTRACT-REVIEW-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log('Worker integration plan readiness: ready')
console.log('Product runtime: blocked_pending_worker_integration_plan_private_artifact_policy_and_route_gate')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
