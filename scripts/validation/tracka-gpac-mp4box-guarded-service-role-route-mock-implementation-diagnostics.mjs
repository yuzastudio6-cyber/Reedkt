#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-service-role-route-mock-implementation'
const decisionText = 'tracka_gpac_mp4box_guarded_service_role_route_mock_implementation_passed_ready_for_guarded_worker_enqueue_mock'
const executionText = 'completed_backend_route_metadata_and_typescript_mock_contract_no_route_or_worker_execution'
const priorDecisionText = 'tracka_gpac_mp4box_service_role_route_implementation_plan_passed_ready_for_guarded_route_mock_implementation'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1'
const routeId = 'render.gpacMp4box.serviceRolePackageMock'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-service-role-route-mock-implementation-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-service-role-route-mock-implementation-decision.md`,
  `${packetDir}/private-artifact-manifest.json`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/route-mock-contract.json`,
  `${packetDir}/route-mock-contract.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const sourceFiles = [
  'src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts.ts',
  'src/backend/contracts/index.ts',
  'src/backend/api/routes/gpac-mp4box-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/index.ts',
  'server/smoke/tracka-gpac-mp4box-guarded-service-role-route-mock-implementation-smoke.ts',
]

const priorDiagnosticFiles = [
  'scripts/validation/tracka-gpac-mp4box-mock-worker-interface-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-service-role-route-implementation-plan-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...sourceFiles,
  ...priorDiagnosticFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-service-role-route-mock-implementation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-service-role-route-mock-implementation-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-worker-enqueue-mock-implementation-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-service-role-route-implementation-plan/gpac-mp4box-service-role-route-implementation-plan-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-mock-worker-interface/gpac-mp4box-mock-worker-interface-decision.json',
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-service-role-route-mock-implementation-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-GUARDED-SERVICE-ROLE-ROUTE-MOCK-IMPLEMENTATION-1',
  nextPrompt,
  decisionText,
  executionText,
  priorDecisionText,
  routeId,
  '/api/render/gpac-mp4box/package/mock',
  'backend_service_role_only',
  'guarded_mock_route_implementation_first',
  'runtimeMode: backend_required',
  'status: disabled',
  'approvedSnapshotRef',
  'approvalRecordRef',
  'creditReservationRef',
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
  'registered_disabled_backend_required',
  'blocked_runtime_execution_not_enabled',
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
  /readyForRuntimeRouteExecution"\s*:\s*true/i,
  /readyForWorkerExecution"\s*:\s*true/i,
  /readyForGpacMp4boxExecution"\s*:\s*true/i,
  /readyForStorageTransfer"\s*:\s*true/i,
  /routeExecution"\s*:\s*true/i,
  /workerExecution"\s*:\s*true/i,
  /gpacMp4boxExecution"\s*:\s*true/i,
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
  console.error(`TRACKA-GPAC-MP4BOX-GUARDED-SERVICE-ROLE-ROUTE-MOCK-IMPLEMENTATION-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-service-role-route-mock-implementation:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-service-role-route-mock-implementation-diagnostics.mjs') {
  fail('missing package diagnostics script')
}
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-guarded-service-role-route-mock-implementation'] !== 'tsx server/smoke/tracka-gpac-mp4box-guarded-service-role-route-mock-implementation-smoke.ts') {
  fail('missing package smoke script')
}

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .filter((file) => !file.startsWith('src/'))
  .filter((file) => !file.startsWith('server/smoke/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text) && !sourceFiles.map((file) => read(file)).join('\n').includes(text)) {
    fail(`missing required text: ${text}`)
  }
}
for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim matched ${pattern}`)
}

const decision = json(`${packetDir}/gpac-mp4box-guarded-service-role-route-mock-implementation-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.routeId !== routeId) fail('route id drift')
if (decision.routeOwner !== 'backend_service_role_only') fail('route owner drift')
if (decision.runtimeMode !== 'backend_required') fail('runtime mode drift')
if (decision.routeStatus !== 'disabled') fail('route status drift')
if (decision.readiness?.routeMetadataRegistered !== 'passed') fail('route metadata readiness drift')
if (decision.readiness?.routeMockContract !== 'passed') fail('route mock contract readiness drift')
if (decision.readiness?.mockRouterExecutionBlock !== 'passed') fail('mock router execution block drift')
if (decision.readiness?.guardedWorkerEnqueueMock !== 'ready') fail('worker enqueue readiness drift')
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const contract = json(`${packetDir}/route-mock-contract.json`)
if (contract.routeId !== routeId) fail('contract route id drift')
if (contract.routeOwner !== 'backend_service_role_only') fail('contract owner drift')
if (contract.runtimeMode !== 'backend_required') fail('contract runtime drift')
if (contract.status !== 'disabled') fail('contract status drift')
if (contract.requiresServiceRole !== true) fail('contract service-role requirement drift')
for (const input of ['rawChat', 'rawCommandString', 'frontendFilePath', 'publicUrl', 'signedUrlAsSourceOfTruth', 'arbitraryPrivateMedia', 'providerModelPromptPayload', 'serviceRoleSecretPayload', 'broadServiceRoleHandlerPayload']) {
  if (!contract.rejectedInputs?.includes(input)) fail(`missing rejected input ${input}`)
}
for (const key of ['routeExecution', 'workerExecution', 'gpacMp4boxExecution', 'storageTransfer', 'supabaseMutation', 'sqlExecution']) {
  if (contract.execution?.[key] !== false) fail(`contract ${key} was enabled`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.routeMetadataRegistered !== true) fail('readiness route metadata drift')
if (readiness.routeMockContractPassed !== true) fail('readiness route mock contract drift')
if (readiness.mockRouterBackendRequiredBlockPassed !== true) fail('readiness mock router block drift')
if (readiness.readyForGuardedWorkerEnqueueMockPacket !== true) fail('readiness worker enqueue drift')
for (const key of ['readyForRuntimeRouteExecution', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForStorageTransfer', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const priorDecision = json('docs/track-a/native-container-render-tools/gpac-mp4box-service-role-route-implementation-plan/gpac-mp4box-service-role-route-implementation-plan-decision.json')
if (priorDecision.decision !== priorDecisionText) fail('prior service-role route plan decision drift')

const manifest = json(`${packetDir}/private-artifact-manifest.json`)
for (const key of ['privateArtifacts', 'publicArtifacts', 'signedUrls', 'committedMediaArtifacts', 'generatedOutputsCommitted', 'runtimeOutputs', 'storageTransfers']) {
  if (!Array.isArray(manifest[key]) || manifest[key].length !== 0) fail(`manifest ${key} is not empty`)
}

const routeSource = read('src/backend/api/routes/gpac-mp4box-api-routes.ts')
for (const text of ['GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_ID', 'backend_service_role', "runtimeMode: 'backend_required'", "status: 'disabled'", 'requiresServiceRole: true']) {
  if (!routeSource.includes(text)) fail(`route source missing ${text}`)
}

const contractSource = read('src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts.ts')
for (const pattern of forbiddenSourcePatterns) {
  if (pattern.test(contractSource) || pattern.test(routeSource)) fail(`source contains forbidden runtime pattern ${pattern}`)
}
if (!contractSource.includes('validateGpacMp4boxMockWorkerEnvelope')) fail('route contract must use mock worker interface validation')
if (!contractSource.includes('buildGpacMp4boxMockWorkerRouteIdempotencyKey')) fail('route contract must use mock worker idempotency helper')
if (!read('src/backend/contracts/index.ts').includes("export * from './gpac-mp4box-guarded-service-role-route-mock-contracts'")) {
  fail('contract index export missing')
}
if (!read('src/backend/api/index.ts').includes("export * from './routes/gpac-mp4box-api-routes'")) {
  fail('api index export missing')
}
if (!read('src/backend/api/api-route-registry.ts').includes('...GPAC_MP4BOX_API_ROUTES')) {
  fail('api route registry missing GPAC/MP4Box routes')
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

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

console.log('TRACKA-GPAC-MP4BOX-GUARDED-SERVICE-ROLE-ROUTE-MOCK-IMPLEMENTATION-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log(`Route id: ${routeId}`)
console.log('Route metadata: registered, disabled, backend_required, service-role only')
console.log('Runtime route, worker, GPAC/MP4Box execution, and storage transfer: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
