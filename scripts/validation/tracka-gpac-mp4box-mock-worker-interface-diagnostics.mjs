#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-mock-worker-interface'
const decisionText = 'tracka_gpac_mp4box_mock_worker_interface_passed_ready_for_service_role_route_implementation_plan'
const executionText = 'completed_typescript_only_mock_worker_interface_no_runtime_execution'
const priorRouteDecisionText = 'tracka_gpac_mp4box_worker_route_contract_passed_ready_for_mock_worker_interface_packet'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-SERVICE-ROLE-ROUTE-IMPLEMENTATION-PLAN-1'
const outputSha = 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8'

const packetFiles = [
  `${packetDir}/gpac-mp4box-mock-worker-interface-decision.json`,
  `${packetDir}/gpac-mp4box-mock-worker-interface-decision.md`,
  `${packetDir}/mock-worker-interface-contract.json`,
  `${packetDir}/mock-worker-interface-contract.md`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const sourceFiles = [
  'src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/tracka-gpac-mp4box-mock-worker-interface-smoke.ts',
]

const requiredFiles = [
  ...packetFiles,
  ...sourceFiles,
  'docs/activation-phase-tracka-gpac-mp4box-mock-worker-interface-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-mock-worker-interface-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-service-role-route-implementation-plan-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-route-contract/gpac-mp4box-worker-route-contract-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-route-contract/route-contract.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-worker-route-contract/mock-worker-interface.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-worker-route-contract-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-mock-worker-interface-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1',
  nextPrompt,
  decisionText,
  executionText,
  priorRouteDecisionText,
  'GpacMp4boxMockWorkerJobEnvelope',
  'GpacMp4boxCommandTemplateId',
  'validateGpacMp4boxMockWorkerEnvelope',
  'buildGpacMp4boxMockWorkerRouteIdempotencyKey',
  'approvedSnapshotRef',
  'approvalRecordRef',
  'jobRef',
  'workerLeaseRef',
  'routeIdempotencyKey',
  'privateInputManifestRef',
  'privateArtifactManifestRef',
  'privateArtifactChecksumRef',
  'qaPolicyRef',
  'cleanupPolicyRef',
  'auditRecordRef',
  'mp4box_add_generated_subtitle_only_v1',
  'mp4box_info_generated_subtitle_only_v1',
  'mp4box_package_validation_metadata_v1',
  'blocked_missing_approved_snapshot',
  'blocked_missing_approval_record',
  'blocked_missing_private_input_manifest',
  'blocked_input_checksum_mismatch',
  'blocked_unapproved_command_template',
  'blocked_idempotency_conflict',
  'blocked_worker_lease_unavailable',
  'blocked_public_or_signed_artifact_attempt',
  'blocked_cleanup_policy_missing',
  'blocked_runtime_execution_not_enabled',
  outputSha,
  '#577 remains open/draft/blocked/conflicting and excluded',
  'Product-ready local OSS tools: `0`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForProductRuntime"\s*:\s*true/i,
  /readyForExternalBetaProductUse"\s*:\s*true/i,
  /readyForProduction"\s*:\s*true/i,
  /readyForRuntimeRouteImplementation"\s*:\s*true/i,
  /readyForWorkerExecution"\s*:\s*true/i,
  /readyForGpacMp4boxExecution"\s*:\s*true/i,
  /runtimeExecution"\s*:\s*true/i,
  /workerExecution"\s*:\s*true/i,
  /routeExecution"\s*:\s*true/i,
  /packageDependencyChangeAllowed"\s*:\s*true/i,
  /packageLockMutationAllowed"\s*:\s*true/i,
  /supabaseMutation"\s*:\s*true/i,
  /sqlExecution"\s*:\s*true/i,
  /signedUrlCreation"\s*:\s*true/i,
  /publicArtifactCreation"\s*:\s*true/i,
  /externalBetaExpansion"\s*:\s*true/i,
  /productionUnlock"\s*:\s*true/i,
]

const forbiddenSourcePatterns = [
  /\bexec(File|Sync)?\b/,
  /child_process/,
  /from ['"]node:fs['"]/,
  /from ['"]node:child_process['"]/,
  /\bfetch\s*\(/,
  /\bnew\s+Worker\b/,
  /createClient\s*\(/,
  /supabase/i,
  /docker\s+(build|run|push)/i,
  /(?:^|[^A-Za-z])MP4Box\s*\(/,
  /(?:^|[^A-Za-z])gpac\s*\(/,
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
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-mock-worker-interface:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-mock-worker-interface-diagnostics.mjs') {
  fail('missing package diagnostics script')
}
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-mock-worker-interface'] !== 'tsx server/smoke/tracka-gpac-mp4box-mock-worker-interface-smoke.ts') {
  fail('missing package smoke script')
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

const contractSource = read('src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts.ts')
for (const pattern of forbiddenSourcePatterns) {
  if (pattern.test(contractSource)) fail(`contract source contains forbidden runtime pattern ${pattern}`)
}
if (!read('src/backend/contracts/index.ts').includes("export * from './gpac-mp4box-mock-worker-interface-contracts'")) {
  fail('contract index export missing')
}

const priorRouteDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-worker-route-contract/gpac-mp4box-worker-route-contract-decision.json')
if (priorRouteDecision.decision !== priorRouteDecisionText) fail('prior route contract decision drift')
if (priorRouteDecision.nextPrompt !== 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1') fail('prior route next prompt drift')
if (priorRouteDecision.productReadyLocalOssTools !== 0) fail('prior route product-ready count drift')

const proofDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-proof/gpac-mp4box-controlled-synthetic-media-command-proof-decision.json')
if (proofDecision.proof?.outputSha256 !== outputSha) fail('accepted output SHA drift')

const decision = json(`${packetDir}/gpac-mp4box-mock-worker-interface-decision.json`)
if (decision.decision !== decisionText) fail('mock worker interface decision drift')
if (decision.execution !== executionText) fail('mock worker interface execution drift')
if (decision.readiness?.mockWorkerInterfaceContract !== 'passed') fail('mock worker interface readiness drift')
if (decision.readiness?.serviceRoleRouteImplementationPlan !== 'ready') fail('service-role route implementation plan readiness drift')
if (decision.readiness?.runtimeRouteImplementation !== 'blocked_pending_service_role_route_implementation_packet') fail('runtime route implementation readiness drift')
if (decision.readiness?.workerExecution !== 'blocked') fail('worker execution blocker drift')
if (decision.readiness?.productRuntime !== 'blocked_pending_service_role_route_implementation_guarded_worker_execution_private_artifact_policy_and_external_beta_gate') fail('product runtime blocker drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}

const contract = json(`${packetDir}/mock-worker-interface-contract.json`)
if (contract.executionMode !== 'mock_contract_only') fail('contract execution mode drift')
for (const key of ['runtimeExecution', 'workerExecution', 'routeExecution', 'packageDependencyChangeAllowed', 'packageLockMutationAllowed']) {
  if (contract[key] !== false) fail(`contract ${key} was enabled`)
}
for (const blocker of [
  'blocked_missing_approved_snapshot',
  'blocked_missing_approval_record',
  'blocked_missing_private_input_manifest',
  'blocked_input_checksum_mismatch',
  'blocked_unapproved_command_template',
  'blocked_idempotency_conflict',
  'blocked_worker_lease_unavailable',
  'blocked_public_or_signed_artifact_attempt',
  'blocked_cleanup_policy_missing',
  'blocked_runtime_execution_not_enabled',
]) {
  if (!contract.structuredBlockers?.includes(blocker)) fail(`missing structured blocker ${blocker}`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.mockWorkerInterfaceContractPassed !== true) fail('mock worker interface contract passed drift')
if (readiness.readyForServiceRoleRouteImplementationPlan !== true) fail('service-role route plan readiness drift')
for (const key of ['readyForRuntimeRouteImplementation', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForProduction']) {
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
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\//.test(file) && !file.startsWith('src/backend/contracts/')) fail(`forbidden src path changed ${file}`)
  if (/^server\//.test(file) && !file.startsWith('server/smoke/')) fail(`forbidden server path changed ${file}`)
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

console.log('TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log('Mock worker interface contract: passed')
console.log('Runtime and worker execution: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
