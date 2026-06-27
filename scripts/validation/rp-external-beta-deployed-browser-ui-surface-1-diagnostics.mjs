#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/deployed-browser-ui-surface-1'

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/server-surface.md`,
  `${packetDir}/local-smoke-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/deployed-browser-ui-surface-record.json`,
  'docs/activation-phase-rp-external-beta-deployed-browser-ui-surface-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-deployed-browser-ui-surface-1.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
]

const implementationFiles = [
  '.dockerignore',
  'Dockerfile.backend',
  'src/server/server-router.ts',
  'scripts/validation/rp-external-beta-deployed-browser-ui-surface-1.mjs',
  'scripts/validation/rp-external-beta-deployed-browser-ui-surface-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const rollupFiles = [
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
]

const requiredFiles = [...packetFiles, ...implementationFiles]

const requiredText = [
  packet,
  'completed_external_beta_deployed_browser_ui_surface_source_smoke',
  'completed_local_browser_ui_static_surface_smoke_no_remote_mutation',
  'ready_for_controlled_staging_browser_ui_deploy_and_ui_flow_resmoke',
  'blocked_pending_controlled_staging_browser_ui_deploy_and_resmoke',
  'RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1R-STAGING-DEPLOY',
  'blocked_deployed_browser_ui_surface_not_present',
  'completed_external_beta_controlled_tester_product_flow_smoke',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'group:external-beta-testers@reeditpro.com',
  'reeditpro-staging-api',
  'REEDITPRO_WEB_DIST_DIR',
  'Dockerfile.backend',
  'src/server/server-router.ts',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenClaims = [
  /\ballUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\ballAuthenticatedUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bFFmpeg execution:\s*`?(true|enabled|completed)\b/i,
  /\bFFprobe execution:\s*`?(true|enabled|completed)\b/i,
  /\bDocker execution:\s*`?(true|enabled|completed)\b/i,
  /\bbrowser capture:\s*`?(true|enabled|completed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed)\b/i,
]

const forbiddenExecutablePatterns = [
  ['gcloud mutation', /\b(gcloud)\b[\s\S]{0,120}\b(run deploy|add-iam-policy-binding|remove-iam-policy-binding|secrets versions access)\b/],
  ['docker executable', /execFileSync\(\s*['"]docker['"]|spawnSync\(\s*['"]docker['"]|\[\s*['"]docker['"]/],
  ['ffmpeg executable', /execFileSync\(\s*['"]ffmpeg['"]|spawnSync\(\s*['"]ffmpeg['"]|\[\s*['"]ffmpeg['"]/],
  ['ffprobe executable', /execFileSync\(\s*['"]ffprobe['"]|spawnSync\(\s*['"]ffprobe['"]|\[\s*['"]ffprobe['"]/],
  ['psql executable', /execFileSync\(\s*['"]psql['"]|spawnSync\(\s*['"]psql['"]|\[\s*['"]psql['"]/],
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of requiredFiles) read(file)

const corpus = [...packetFiles, ...rollupFiles.filter(fs.existsSync)].map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/deployed-browser-ui-surface-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_external_beta_deployed_browser_ui_surface_source_smoke') fail('decision mismatch')
if (record.execution !== 'completed_local_browser_ui_static_surface_smoke_no_remote_mutation') fail('execution mismatch')
if (record.sourceInputs?.controlledTesterUiFlowSmoke !== 'blocked_deployed_browser_ui_surface_not_present') fail('UI smoke blocker carry-forward mismatch')
if (record.sourceInputs?.testerAccount !== 'aiediting@reeditpro.com') fail('tester account mismatch')
if (record.sourceInputs?.cloudRunInvoker !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run invoker mismatch')
if (record.localSurface?.htmlProbesPassed !== true) fail('HTML probes not recorded as passed')
if (record.localSurface?.apiRoutesRegressionPassed !== true) fail('API routes regression not recorded as passed')
if (record.dockerfilePackaging?.frontendBuildIncluded !== true) fail('frontend build packaging not recorded')
if (record.dockerfilePackaging?.distCopiedToRuntimeImage !== true) fail('frontend dist runtime copy not recorded')
if (record.readiness?.sourceReadiness !== 'ready_for_controlled_staging_browser_ui_deploy_and_ui_flow_resmoke') fail('source readiness mismatch')
if (record.readiness?.externalProductBeta !== 'blocked_pending_controlled_staging_browser_ui_deploy_and_resmoke') fail('external product beta readiness mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1R-STAGING-DEPLOY') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

for (const key of [
  'cloudRunIamMutation',
  'cloudRunServiceUpdate',
  'deployment',
  'broadPublicInvokerGrant',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'persistentCreditMutation',
  'stripePaymentProcessing',
  'renderExecution',
  'mediaProcessing',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'dockerExecution',
  'browserCapture',
  'internalBetaBroadUnlock',
  'externalBetaBroadAudienceUnlock',
  'productionUnlock',
  'packageLockMutation',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const dockerfile = read('Dockerfile.backend')
if (!dockerfile.includes('RUN npm run build && npm run build:server')) fail('Dockerfile does not build frontend dist before server')
if (!dockerfile.includes('COPY --from=build /app/dist ./dist')) fail('Dockerfile does not copy frontend dist into runtime image')

const dockerignore = read('.dockerignore')
for (const text of [
  '!src/backend/providers/gateway/provider-secret-boundary.ts',
  '!server/activation/gcp-staging/gcp-staging-secret-plan.ts',
  '!server/security-review/secret-safety-policy.ts',
  '!server/config/internal-beta-supabase-credential-context-contract.ts',
  '!server/model-weights/',
  '!server/model-weights/*.ts',
]) {
  if (!dockerignore.includes(text)) fail(`.dockerignore must allow required TypeScript source module: ${text}`)
}

const router = read('src/server/server-router.ts')
for (const text of [
  'REEDITPRO_WEB_DIST_DIR',
  'sendStaticWebSurface',
  "STATIC_ROUTE_EXCLUDED_PREFIXES = ['/api', '/v1']",
  "STATIC_ROUTE_EXCLUDED_PATHS = new Set(['/health', '/ready'])",
  "'cache-control': isSpaEntry ? 'no-store' : 'public, max-age=31536000, immutable'",
]) {
  if (!router.includes(text)) fail(`server router missing static surface source: ${text}`)
}

const runnerSource = read('scripts/validation/rp-external-beta-deployed-browser-ui-surface-1.mjs')
for (const [label, pattern] of forbiddenExecutablePatterns) {
  if (pattern.test(runnerSource)) {
    fail(`scripts/validation/rp-external-beta-deployed-browser-ui-surface-1.mjs contains forbidden command/source: ${label}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-deployed-browser-ui-surface-1'] !==
  'node scripts/validation/rp-external-beta-deployed-browser-ui-surface-1.mjs'
) {
  fail('missing local browser UI surface smoke script')
}
if (
  packageJson.scripts?.['rp-external-beta-deployed-browser-ui-surface-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-deployed-browser-ui-surface-1-diagnostics.mjs'
) {
  fail('missing browser UI surface diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowed = new Set([...packetFiles, ...implementationFiles, ...rollupFiles])
for (const file of changedFiles()) {
  if (!allowed.has(file)) fail(`unexpected changed file: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file === 'package-lock.json') fail('package-lock changed')
  if (/^(supabase|database|server|docker|\.github)\//.test(file)) fail(`blocked file scope changed: ${file}`)
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text
    .replaceAll('postgresql://[redacted]', '')
    .replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (!file.startsWith('scripts/validation/')) {
    for (const pattern of forbiddenClaims) {
      if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_external_beta_deployed_browser_ui_surface_source_smoke')
console.log('Source readiness: ready_for_controlled_staging_browser_ui_deploy_and_ui_flow_resmoke')
console.log('External product beta readiness: blocked_pending_controlled_staging_browser_ui_deploy_and_resmoke')
