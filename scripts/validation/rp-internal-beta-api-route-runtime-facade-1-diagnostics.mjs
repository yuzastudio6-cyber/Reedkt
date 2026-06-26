#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-API-ROUTE-RUNTIME-FACADE-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-api-route-runtime-facade-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/route-facade-matrix.md`,
  `${packetDir}/fail-closed-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/api-route-runtime-facade-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-internal-beta-api-route-runtime-facade-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-api-route-runtime-facade-1.md',
]

const touchedStatusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
]

const codeFiles = [
  'server/services/internal-beta-api-route-runtime-facade.ts',
  'server/smoke/internal-beta-api-route-runtime-facade-smoke.ts',
  'scripts/validation/rp-internal-beta-api-route-runtime-facade-1-diagnostics.mjs',
  'package.json',
]

const requiredFiles = [...packetFiles, ...touchedStatusFiles, ...codeFiles]
const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_fail_closed_internal_beta_api_route_runtime_facade_no_route_execution',
  'completed_backend_api_facade_mapping_no_route_handler_registration',
  'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'RP-BACKEND-01-INTERNAL-BETA-SERVICE-ROLE-API-CONTRACTS',
  'RP-BACKEND-02-INTERNAL-BETA-SERVICE-ROLE-RUNTIME-SCAFFOLD',
  'RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-2-LOCAL-E2E-CHAIN-INTEGRATION',
  'RP-INTERNAL-BETA-SUPABASE-CREDENTIAL-CONTEXT-CONTRACT-1',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-CREDENTIAL-CONTEXT-PREFLIGHT-1',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'Route facade count: `8`',
  'Route handler registration: `false`',
  'Mock handler registration: `false`',
  'Route execution: `false`',
  'Service-role route execution: `false`',
  'Remote Supabase mutation: `false`',
  'SQL execution: `false`',
  'Storage write: `false`',
  'Storage read: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Credit mutation: `false`',
  'Worker dispatch: `false`',
  'Worker execution: `false`',
  'Provider/model call: `false`',
  'Render/export execution: `false`',
  'Internal beta end-to-end ready: `false`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Validation status: `full_validation_passed`',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role route execution, API route handler registration, mock route handler registration, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, package installation beyond dependency validation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Route facade count:\s*`?(?!8\b)\d+/i,
  /Route handler registration:\s*`?true/i,
  /Mock handler registration:\s*`?true/i,
  /Route execution:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /Storage (?:write|read):\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Model call:\s*`?true/i,
  /Render\/export execution:\s*`?true/i,
  /Media processing:\s*`?true/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
  /service-role route handler implementation:\s*`?(completed|enabled|true|passed)/i,
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
])

const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'server/providers/',
  'src/',
  'supabase/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  '.github/workflows/',
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

const docsCorpus = [...packetFiles, ...touchedStatusFiles].map(read).join('\n')
const packetCorpus = packetFiles.map(read).join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/api-route-runtime-facade-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'completed_fail_closed_internal_beta_api_route_runtime_facade_no_route_execution') {
  fail('record decision mismatch')
}
if (record.execution !== 'completed_backend_api_facade_mapping_no_route_handler_registration') {
  fail('record execution mismatch')
}
if (record.status !== 'blocked_pending_supabase_target_validation_and_runtime_enablement') fail('record status mismatch')
if (record.baseIntegrationHead !== '1307dc7353cbb3ed1e4e052a42c2dc8f183238ad') fail('base integration head mismatch')
if (record.routeCount !== 8) fail('route count mismatch')
if (record.backendRequiredRouteCount !== 7) fail('backend-required route count mismatch')
if (record.disabledRouteCount !== 1) fail('disabled route count mismatch')
if (record.facadeStatus !== 'blocked_pending_supabase_target_validation_and_runtime_enablement') fail('facade status mismatch')
if (record.internalBetaEndToEndReady !== false) fail('internal beta readiness must stay false')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must remain not_ready')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validationStatus !== 'full_validation_passed') fail('validation status mismatch')
if (record.nextMilestone !== 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN') {
  fail('next milestone mismatch')
}

for (const key of [
  'routeHandlerRegistration',
  'mockHandlerRegistration',
  'routeExecution',
  'serviceRoleRouteExecution',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'storageWrite',
  'storageRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'workerDispatch',
  'workerExecution',
  'providerModelCall',
  'modelCall',
  'rawPromptExecution',
  'renderExportExecution',
  'mediaProcessing',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must be false`)
}

const facade = read('server/services/internal-beta-api-route-runtime-facade.ts')
if (!facade.includes('INTERNAL_BETA_API_ROUTES')) fail('facade must import the API route contract matrix')
for (const routeId of [
  'internalBeta.session.create',
  'internalBeta.approvedPlan.commit',
  'internalBeta.creditReservation.create',
  'internalBeta.job.enqueue',
  'internalBeta.job.status.get',
  'internalBeta.artifactManifest.write',
  'internalBeta.privateArtifactAccess.create',
  'internalBeta.qaReport.read',
]) {
  if (!docsCorpus.includes(routeId)) fail(`docs missing route id ${routeId}`)
}
for (const required of [
  "status: 'blocked_pending_supabase_target_validation_and_runtime_enablement'",
  'routeHandlerRegistered: false',
  'mockHandlerRegistered: false',
  'routeExecution: false',
  'serviceRoleRouteExecution: false',
  'remoteSupabaseMutation: false',
  'sqlExecution: false',
  'storageWrite: false',
  'storageRead: false',
  'signedUrlCreation: false',
  'publicArtifactCreation: false',
  'creditMutation: false',
  'workerDispatch: false',
  'workerExecution: false',
  'providerModelCall: false',
  'renderExportExecution: false',
  'internalBetaUnlock: false',
  'externalBetaUnlock: false',
  'productionUnlock: false',
]) {
  if (!facade.includes(required)) fail(`facade missing safety field ${required}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.update\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /exec(File)?Sync\(/,
  /spawn\(/,
  /registerMockRouteHandler\(/,
  /app\.(get|post|put|patch|delete)\(/,
]) {
  if (pattern.test(facade)) fail(`facade contains forbidden runtime signal ${pattern}`)
}

const smoke = read('server/smoke/internal-beta-api-route-runtime-facade-smoke.ts')
if (!smoke.includes('assertInternalBetaApiRouteRuntimeFacadeFailClosed')) fail('smoke missing fail-closed assertion')
if (!smoke.includes('must_not_appear')) fail('smoke must assert sanitization')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:internal-beta-api-route-runtime-facade'] !==
  'tsx server/smoke/internal-beta-api-route-runtime-facade-smoke.ts'
) {
  fail('missing smoke package script')
}
if (
  packageJson.scripts?.['rp-internal-beta-api-route-runtime-facade-1:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-api-route-runtime-facade-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const path of [
  'supabase',
  'database',
  '.dockerignore',
  'docker',
  'server/routes',
  'server/workers',
  'server/providers',
  'src',
  'tests',
]) {
  gitQuiet(['diff', '--quiet', '--', path], `${path} changed`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]
const stagedFiles = gitLines(['diff', '--cached', '--name-only'])

for (const file of [...changedFiles, ...stagedFiles]) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (
    forbiddenExactFiles.has(file) ||
    forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) ||
    file.endsWith('.sql') ||
    file.endsWith('.mp4') ||
    file.endsWith('.mov') ||
    file.endsWith('.mkv') ||
    file.endsWith('.webm') ||
    file.endsWith('.srt') ||
    file.endsWith('.zip') ||
    file.endsWith('.tar') ||
    file.endsWith('.tgz')
  ) {
    fail(`forbidden changed path ${file}`)
  }
}

for (const file of changedFiles) {
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  if (file.startsWith('scripts/validation/')) continue
  if (touchedStatusFiles.includes(file)) continue
  const text = read(file)
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
