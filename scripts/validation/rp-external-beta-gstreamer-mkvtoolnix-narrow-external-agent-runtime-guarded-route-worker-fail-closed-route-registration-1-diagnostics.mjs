#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-ROUTE-REGISTRATION-1'
const dir =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-route-registration-1'
const recordPath =
  `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-route-registration-1-record.json`
const activationResultsPath =
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-route-registration-1-results.md'
const routeFilePath = 'src/backend/api/routes/gstreamer-mkvtoolnix-api-routes.ts'
const routeRegistryPath = 'src/backend/api/api-route-registry.ts'
const promptPath =
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1.md'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_fail_closed_route_registration_metadata'
const execution = 'completed_source_route_registry_metadata_no_route_worker_tool_or_media_execution'
const baseIntegrationHead = '2c73e29e518ff684fccade23b43414612841f61a'
const routeId = 'externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundaryRouteSource'
const routePath = '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/source-execution-boundary'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-CONTRACT-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/route-registration.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationResultsPath,
  promptPath,
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  routeFilePath,
  routeRegistryPath,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-route-registration-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  baseIntegrationHead,
  routeId,
  routePath,
  'registered_disabled_backend_required_metadata_only',
  '`status`: `disabled`',
  '`runtimeMode`: `backend_required`',
  '`requiresServiceRole`: `true`',
  'Mock-ready: `false`',
  'Frontend-safe: `false`',
  'GStreamer readiness: `ready_for_fail_closed_handler_contract`',
  'MKVToolNix readiness: `ready_for_fail_closed_handler_contract`',
  'External-agent route registry readiness: `registered_disabled_backend_required_ready_for_fail_closed_handler_contract`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '`#577` remains `open_draft_blocked_excluded`',
  nextMilestone,
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bbroad external beta unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpaid production unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed|passed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bpersistent queue write:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bGStreamer execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bMKVToolNix execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bDocker execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bFFmpeg\/FFprobe execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bmedia processing:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
]

function fail(message) {
  console.error(`diagnostic failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function readJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid json ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  return execFileSync('git', args, { encoding: 'utf8', env: gitEnv }).split('\n').filter(Boolean)
}

const allPacketText = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!allPacketText.includes(text)) fail(`missing required text: ${text}`)
}

const routeFile = read(routeFilePath)
for (const text of [
  'GSTREAMER_MKVTOOLNIX_API_ROUTES',
  routeId,
  routePath,
  "domain: 'render'",
  "method: 'POST'",
  "securityLevel: 'backend_service_role'",
  "runtimeMode: 'backend_required'",
  "status: 'disabled'",
  'requiresSupabase: true',
  'requiresServiceRole: true',
  'requiresProviderSecret: false',
  'requiresStripeSecret: false',
  'futureHandlerName',
  'The mock router returns a backend-required response for this route and does not call a handler.',
]) {
  if (!routeFile.includes(text)) fail(`route file missing required text: ${text}`)
}
if (/mockHandlerName\s*:/.test(routeFile)) fail('route must not register a mock handler')
if (/status:\s*'mock_ready'|runtimeMode:\s*'frontend_safe'|requiresServiceRole:\s*false/.test(routeFile)) {
  fail('route must remain disabled/backend-required/service-role-only')
}

const routeRegistry = read(routeRegistryPath)
if (!routeRegistry.includes("import { GSTREAMER_MKVTOOLNIX_API_ROUTES } from './routes/gstreamer-mkvtoolnix-api-routes'")) {
  fail('api route registry missing GStreamer/MKVToolNix import')
}
if (!routeRegistry.includes('...GSTREAMER_MKVTOOLNIX_API_ROUTES,')) {
  fail('api route registry missing GStreamer/MKVToolNix route spread')
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-route-registration-1:diagnostics'
  ] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-route-registration-1-diagnostics.mjs'
) fail('package script mismatch')

const record = readJson(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.baseIntegrationHead !== baseIntegrationHead) fail('base integration mismatch')
if (record.sourceChain?.sourceRegistrationPlanReconciliationPr !== 2098) fail('source registration PR mismatch')
if (record.sourceChain?.sourceRegistrationPlanReconciliationMergeSha !== baseIntegrationHead) fail('source registration merge mismatch')
if (record.sourceChain?.sourceImplementationQaRollupPr !== 2094) fail('source QA PR mismatch')
if (record.sourceChain?.sourceImplementationQaRollupMergeSha !== 'bedd205ee37abe841795d811b3e47eb1359ef217') fail('source QA merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('excluded #577 mismatch')
if (record.routeRegistry?.routeId !== routeId) fail('route id mismatch')
if (record.routeRegistry?.routePath !== routePath) fail('route path mismatch')
if (record.routeRegistry?.method !== 'POST') fail('route method mismatch')
if (record.routeRegistry?.domain !== 'render') fail('route domain mismatch')
if (record.routeRegistry?.securityLevel !== 'backend_service_role') fail('route security mismatch')
if (record.routeRegistry?.runtimeMode !== 'backend_required') fail('route runtime mode mismatch')
if (record.routeRegistry?.status !== 'disabled') fail('route status mismatch')
if (record.routeRegistry?.requiresSupabase !== true) fail('route requiresSupabase mismatch')
if (record.routeRegistry?.requiresServiceRole !== true) fail('route requiresServiceRole mismatch')
if (record.routeRegistry?.requiresProviderSecret !== false) fail('route provider secret mismatch')
if (record.routeRegistry?.requiresStripeSecret !== false) fail('route stripe secret mismatch')
if (record.routeRegistry?.mockReady !== false) fail('route mockReady mismatch')
if (record.routeRegistry?.frontendSafe !== false) fail('route frontendSafe mismatch')
if (record.readiness?.gstreamer !== 'ready_for_fail_closed_handler_contract') fail('gstreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== 'ready_for_fail_closed_handler_contract') fail('mkvtoolnix readiness mismatch')
if (record.readiness?.externalAgentRouteRegistry !== 'registered_disabled_backend_required_ready_for_fail_closed_handler_contract') fail('route registry readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (!['pending_final_validation', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

if (gitLines(['diff', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must be unchanged')
if (gitLines(['diff', '--cached', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must not be staged')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChanged = [...new Set(changedFiles)].sort()
for (const file of uniqueChanged) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const text = read(file)
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim ${pattern} in ${file}`)
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  routeId,
  routePath,
  changedFiles: uniqueChanged,
  nextMilestone,
  safety: 'route_registry_metadata_only_no_route_worker_tool_media_supabase_sql_unlock_paths_enabled',
}, null, 2))
