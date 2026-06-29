#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-service-role-route-implementation-plan'
const decisionText = 'tracka_gpac_mp4box_service_role_route_implementation_plan_passed_ready_for_guarded_route_mock_implementation'
const executionText = 'completed_docs_only_service_role_route_implementation_plan_no_route_or_worker_execution'
const priorDecisionText = 'tracka_gpac_mp4box_mock_worker_interface_passed_ready_for_service_role_route_implementation_plan'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-SERVICE-ROLE-ROUTE-MOCK-IMPLEMENTATION-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-service-role-route-implementation-plan-decision.json`,
  `${packetDir}/gpac-mp4box-service-role-route-implementation-plan-decision.md`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/route-implementation-plan.json`,
  `${packetDir}/route-implementation-plan.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const requiredFiles = [
  ...packetFiles,
  'docs/activation-phase-tracka-gpac-mp4box-service-role-route-implementation-plan-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-service-role-route-implementation-plan-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-service-role-route-mock-implementation-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-mock-worker-interface/gpac-mp4box-mock-worker-interface-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-mock-worker-interface/mock-worker-interface-contract.json',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-mock-worker-interface-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-service-role-route-implementation-plan-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-SERVICE-ROLE-ROUTE-IMPLEMENTATION-PLAN-1',
  nextPrompt,
  decisionText,
  executionText,
  priorDecisionText,
  'backend_service_role_only',
  'guarded_mock_route_implementation_first',
  'approvedSnapshotRef',
  'approvalRecordRef',
  'creditReservationRef',
  'jobRef',
  'workerLeaseRef',
  'routeIdempotencyKey',
  'privateInputManifestRef',
  'privateArtifactManifestRef',
  'privateArtifactChecksumRef',
  'qaPolicyRef',
  'cleanupPolicyRef',
  'auditRecordRef',
  'commandTemplateId',
  'rawCommandString',
  'signedUrlAsSourceOfTruth',
  'serviceRoleSecretPayload',
  'broadServiceRoleHandlerPayload',
  'Product-ready local OSS tools: `0`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
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
  /readyForStorageTransfer"\s*:\s*true/i,
  /runtimeRouteImplementation"\s*:\s*true/i,
  /routeExecution"\s*:\s*true/i,
  /workerExecution"\s*:\s*true/i,
  /gpacMp4boxExecutionThisPhase"\s*:\s*true/i,
  /storageTransfer"\s*:\s*true/i,
  /supabaseMutation"\s*:\s*true/i,
  /sqlExecution"\s*:\s*true/i,
  /signedUrlCreation"\s*:\s*true/i,
  /publicArtifactCreation"\s*:\s*true/i,
  /externalBetaExpansion"\s*:\s*true/i,
  /productionUnlock"\s*:\s*true/i,
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
  console.error(`TRACKA-GPAC-MP4BOX-SERVICE-ROLE-ROUTE-IMPLEMENTATION-PLAN-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-service-role-route-implementation-plan:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-service-role-route-implementation-plan-diagnostics.mjs') {
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

const priorDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-mock-worker-interface/gpac-mp4box-mock-worker-interface-decision.json')
if (priorDecision.decision !== priorDecisionText) fail('prior mock worker interface decision drift')
if (priorDecision.nextPrompt !== 'TRACKA-GPAC-MP4BOX-SERVICE-ROLE-ROUTE-IMPLEMENTATION-PLAN-1') fail('prior mock worker interface next prompt drift')
if (priorDecision.productReadyLocalOssTools !== 0) fail('prior product-ready count drift')

const decision = json(`${packetDir}/gpac-mp4box-service-role-route-implementation-plan-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.readiness?.serviceRoleRouteImplementationPlan !== 'passed') fail('route plan readiness drift')
if (decision.readiness?.guardedRouteMockImplementationPacket !== 'ready') fail('guarded route mock implementation readiness drift')
if (decision.readiness?.runtimeRouteImplementation !== 'blocked_pending_guarded_route_mock_implementation_packet') fail('runtime route implementation readiness drift')
if (decision.readiness?.workerExecution !== 'blocked') fail('worker execution drift')
if (decision.readiness?.storageTransfer !== 'blocked') fail('storage transfer drift')
if (decision.readiness?.productRuntime !== 'blocked_pending_guarded_route_mock_implementation_worker_execution_private_artifact_policy_and_external_beta_gate') fail('product runtime blocker drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}

const plan = json(`${packetDir}/route-implementation-plan.json`)
if (plan.futureRouteOwner !== 'backend_service_role_only') fail('route owner drift')
if (plan.futureRouteClass !== 'guarded_mock_route_implementation_first') fail('route class drift')
for (const key of ['runtimeRouteImplementation', 'routeExecution', 'workerExecution']) {
  if (plan[key] !== false) fail(`plan ${key} was enabled`)
}
for (const input of ['rawChat', 'rawCommandString', 'frontendFilePath', 'publicUrl', 'signedUrlAsSourceOfTruth', 'arbitraryPrivateMedia', 'providerModelPromptPayload', 'serviceRoleSecretPayload', 'broadServiceRoleHandlerPayload']) {
  if (!plan.rejectedInputs?.includes(input)) fail(`missing rejected input ${input}`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.serviceRoleRouteImplementationPlanPassed !== true) fail('service-role route plan passed drift')
if (readiness.readyForGuardedRouteMockImplementationPacket !== true) fail('guarded route mock packet readiness drift')
for (const key of ['readyForRuntimeRouteImplementation', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForStorageTransfer', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'committedMediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs', 'storageTransfers']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`manifest ${key} is not empty`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
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

console.log('TRACKA-GPAC-MP4BOX-SERVICE-ROLE-ROUTE-IMPLEMENTATION-PLAN-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log('Service-role route implementation plan: passed')
console.log('Runtime route and worker execution: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
