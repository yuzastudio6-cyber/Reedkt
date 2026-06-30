#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-STAGING-API-ROUTE-DEPLOYMENT-ALIGNMENT-1'
const packetDir = 'docs/external-beta/qwen-staging-api-route-deployment-alignment-1'
const decision = 'completed_qwen_staging_api_route_deployment_alignment_current_source_bridge'
const execution = 'completed_confirmed_staging_api_image_alignment_and_route_preflight_no_provider_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/deployment-result.md`,
  `${packetDir}/runtime-preflight-result.md`,
  `${packetDir}/artifact-manifest.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-staging-api-route-deployment-alignment-1-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-staging-api-route-deployment-alignment-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-provider-runtime-fixture-current-1.md',
  'scripts/validation/rp-external-beta-qwen-staging-api-route-deployment-alignment-1-diagnostics.mjs',
  'src/server/server-router.ts',
  'package.json',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-transport-readiness-plan-current-1/qwen-transport-readiness-plan-current-record.json',
  'docs/external-beta/qwen-confirmed-transport-runtime-preflight-current-1/qwen-confirmed-transport-runtime-preflight-current-1-record.json',
  'docs/activation-phase-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1-results.md',
  'server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts',
  'server/routes/provider-gateway-routes.ts',
  'Dockerfile.backend',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'scripts/validation/rp-external-beta-qwen-transport-readiness-plan-current-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  '5cf82e6242677af8add6b53d5b5dd4c78c9ee9fe',
  '805bad1f3d5ad738ecb0204ebf696552a4364eca',
  '0258873cd11acd4fbc91f829e4c45ce25a44ebf8',
  'reeditpro-staging-api-00008-4ct',
  'reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com',
  'wmyyttnynmteqgcdishd',
  'providers.qwen25Vl.structuredVisualMetadataPlan',
  'POST /api/providers/qwen2-5-vl/structured-visual-metadata',
  'src/server/server-router.ts',
  'server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts',
  'ef61e232-f563-4e16-bf3e-50b5878d1658',
  'sha256:f3deaee047e8f5b9dda7835d1140900c7f4e1f33dc240ddc2743e820be27cf55',
  '2026-06-30T03-49-20-516Z-10d064e3',
  'completed_confirmed_qwen_transport_runtime_preflight_route_reached_fail_closed_no_provider_execution',
  'passed_route_reached_fail_closed_no_provider_execution',
  'HTTP `424`',
  'd5b6c436770d0c2af2c928ad71dda95601241213980006832ac61bf606108256',
  'c20c5060a5cf0e0803686a24f99a2c3dec9b6a2532c590972219ba47960bb75e',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bservice-role route execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bgenerated asset creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpaid production unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed|passed)\b/i,
  /\bRemotion execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bdependency mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /"qwen25VlExecution"\s*:\s*true/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"serviceRoleRouteExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"generatedAssetCreation"\s*:\s*true/i,
  /"creditMutation"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"dependencyMutation"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

const blockedPathPatterns = [
  /^package-lock\.json$/,
  /^src\/(?!server\/server-router\.ts$)/,
  /^server\/(?!services\/qwen2-5-vl-external-beta-product-route-handler-source\.ts$)(?!routes\/provider-gateway-routes\.ts$)/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^cloudbuild\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^Dockerfile(?!\.backend$)/,
  /^requirements/i,
  /^\.env/,
  /^dist(?:-|\/)/,
  /^node_modules\//,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJson(file) {
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

for (const file of [...packetFiles, ...requiredExistingFiles]) read(file)

const corpus = [...packetFiles, ...requiredExistingFiles].map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/qwen-staging-api-route-deployment-alignment-1-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.route?.serverRouterBridge !== 'src/server/server-router.ts') fail('server router bridge mismatch')
if (record.route?.failClosedHttpStatus !== 424) fail('fail-closed HTTP status mismatch')
if (record.cloudBuilds?.[1]?.id !== 'ef61e232-f563-4e16-bf3e-50b5878d1658') fail('successful build id mismatch')
if (record.cloudBuilds?.[1]?.deployedRevision !== 'reeditpro-staging-api-00008-4ct') fail('successful revision mismatch')
if (record.cloudBuilds?.[1]?.routePreflightHttpStatus !== 424) fail('successful route status mismatch')
if (record.serviceReadback?.service !== 'reeditpro-staging-api') fail('service mismatch')
if (record.serviceReadback?.trafficPercent !== 100) fail('traffic mismatch')
if (record.serviceReadback?.targetRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.readiness?.qwenTransportRuntimePreflightCurrent1 !== 'passed_route_reached_fail_closed_no_provider_execution') {
  fail('qwen transport readiness mismatch')
}
if (record.readiness?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const allowedTrueSafety = new Set([
  'cloudBuild',
  'cloudRunServiceUpdate',
  'cloudRunDeployment',
  'boundedRouteRequestSent',
  'routeHandlerReached',
])
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (allowedTrueSafety.has(key)) {
    if (value !== true) fail(`expected true safety flag missing: ${key}`)
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const routeBridge = read('src/server/server-router.ts')
if (!routeBridge.includes('QWEN_STRUCTURED_VISUAL_METADATA_PATH')) fail('missing QWEN route path constant')
if (!routeBridge.includes('createQwen25VlExternalBetaProductRouteHandlerSource')) {
  fail('missing fail-closed route-handler source bridge')
}
if (!routeBridge.includes('buildBlockedResult(routeInput)')) fail('missing fail-closed result return')

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-staging-api-route-deployment-alignment-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-staging-api-route-deployment-alignment-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

const changedFiles = new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
])
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedPathPatterns.some((pattern) => pattern.test(file))) fail(`blocked path changed: ${file}`)
}

if (changedFiles.has('package-lock.json')) fail('package-lock changed')
gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json has unstaged changes')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json has staged changes')

for (const file of changedFiles) {
  if (!fs.existsSync(file)) continue
  const text = read(file)
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden changed-file claim matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed.`)
