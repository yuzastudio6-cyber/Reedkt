#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/controlled-tester-ui-flow-smoke-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runner-contract.md`,
  `${packetDir}/ui-surface-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/controlled-tester-ui-flow-smoke-record.json`,
  'docs/activation-phase-rp-external-beta-controlled-tester-ui-flow-smoke-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-tester-ui-flow-smoke-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-deployed-browser-ui-surface-1.md',
  'scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1.mjs',
  'scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1-diagnostics.mjs',
  'package.json',
]

const rollupFiles = [
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
]

const productFlowFiles = [
  'docs/external-beta/controlled-tester-product-flow-smoke-1/controlled-tester-product-flow-smoke-record.json',
  'scripts/validation/rp-external-beta-controlled-tester-product-flow-smoke-1-diagnostics.mjs',
]

const followOnDeployedBrowserUiSurfaceFiles = [
  '.dockerignore',
  'Dockerfile.backend',
  'src/server/server-router.ts',
  'docs/external-beta/deployed-browser-ui-surface-1/source-audit.md',
  'docs/external-beta/deployed-browser-ui-surface-1/server-surface.md',
  'docs/external-beta/deployed-browser-ui-surface-1/local-smoke-evidence.md',
  'docs/external-beta/deployed-browser-ui-surface-1/readiness-gate.md',
  'docs/external-beta/deployed-browser-ui-surface-1/safety-boundary.md',
  'docs/external-beta/deployed-browser-ui-surface-1/validation-results.md',
  'docs/external-beta/deployed-browser-ui-surface-1/deployed-browser-ui-surface-record.json',
  'docs/activation-phase-rp-external-beta-deployed-browser-ui-surface-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-deployed-browser-ui-surface-1.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'scripts/validation/rp-external-beta-deployed-browser-ui-surface-1.mjs',
  'scripts/validation/rp-external-beta-deployed-browser-ui-surface-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnDeployedBrowserUiSurface1rStagingDeployFiles = [
  'docs/external-beta/deployed-browser-ui-surface-1r-staging-deploy/source-audit.md',
  'docs/external-beta/deployed-browser-ui-surface-1r-staging-deploy/cloud-build-deploy-evidence.md',
  'docs/external-beta/deployed-browser-ui-surface-1r-staging-deploy/controlled-tester-ui-smoke-evidence.md',
  'docs/external-beta/deployed-browser-ui-surface-1r-staging-deploy/readiness-gate.md',
  'docs/external-beta/deployed-browser-ui-surface-1r-staging-deploy/safety-boundary.md',
  'docs/external-beta/deployed-browser-ui-surface-1r-staging-deploy/validation-results.md',
  'docs/external-beta/deployed-browser-ui-surface-1r-staging-deploy/deployed-browser-ui-surface-1r-staging-deploy-record.json',
  'docs/activation-phase-rp-external-beta-deployed-browser-ui-surface-1r-staging-deploy-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-owner-browser-walkthrough-1.md',
  'scripts/validation/rp-external-beta-deployed-browser-ui-surface-1r-staging-deploy-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1.mjs',
  'scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_external_beta_controlled_tester_ui_flow_smoke',
  'blocked_deployed_browser_ui_surface_not_present',
  'completed_guarded_authenticated_ui_surface_probe_no_runtime_mutation',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_UI_FLOW_SMOKE',
  'REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL',
  'aiediting@reeditpro.com',
  'owner_approved_primary_real_tester_account',
  'external-beta-testers@reeditpro.com',
  'group:external-beta-testers@reeditpro.com',
  'reeditpro-staging-api',
  'us-central1',
  'reeditpro-staging-api-00005-7gs',
  '2026-06-27T16-07-23-427Z-7e136bc9',
  '0bf0f4a53c435b3e8e1c62412d7f2cef7b7633de821eee36f62ace16f068b2e3',
  '5672d630490da26bfc5b0ef37d66b5da5bbcb041f83ebdcbf0dfa1d328dc3dae',
  'authenticated_html_probe_root',
  'Route not found: /dashboard',
  'deployedBrowserUiSurfacePresent',
  'blocked_pending_deployed_browser_ui_surface_for_owner_walkthrough',
  'ready_for_controlled_owner_tester_product_walkthrough',
  'RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const falseSafetyKeys = [
  'groupMembershipMutation',
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
  'persistentCreditReservationCreation',
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
]

const blockedPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'src/',
  'server/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
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

const corpus = [...requiredFiles, ...rollupFiles.filter(fs.existsSync), ...productFlowFiles.filter(fs.existsSync)]
  .map((file) => read(file))
  .join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/controlled-tester-ui-flow-smoke-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_external_beta_controlled_tester_ui_flow_smoke') fail('decision mismatch')
if (record.execution !== 'completed_guarded_authenticated_ui_surface_probe_no_runtime_mutation') fail('execution mismatch')
if (record.blocker !== 'blocked_deployed_browser_ui_surface_not_present') fail('blocker mismatch')
if (record.integrationBase !== 'ee88b79f85a71cebfe6c8c81cc02ce13529ad126') fail('integration base mismatch')
if (record.target?.testerEmail !== 'aiediting@reeditpro.com') fail('tester email mismatch')
if (record.target?.testerClassification !== 'owner_approved_primary_real_tester_account') fail('tester classification mismatch')
if (record.target?.groupEmail !== 'external-beta-testers@reeditpro.com') fail('group email mismatch')
if (record.target?.cloudRunIamMember !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run IAM member mismatch')
if (record.target?.uiServiceCandidates !== 0) fail('UI service candidate count mismatch')
if (record.runEvidence?.runId !== '2026-06-27T16-07-23-427Z-7e136bc9') fail('run id mismatch')
if (record.runEvidence?.report?.bytes !== 6576) fail('report byte count mismatch')
if (record.runEvidence?.report?.sha256 !== '0bf0f4a53c435b3e8e1c62412d7f2cef7b7633de821eee36f62ace16f068b2e3') fail('report checksum mismatch')
if (record.runEvidence?.manifest?.bytes !== 432) fail('manifest byte count mismatch')
if (record.runEvidence?.manifest?.sha256 !== '5672d630490da26bfc5b0ef37d66b5da5bbcb041f83ebdcbf0dfa1d328dc3dae') fail('manifest checksum mismatch')
if (record.uiSurface?.deployedBrowserUiSurfacePresent !== false) fail('browser UI surface must be false')
if (record.uiSurface?.unauthenticatedRoot?.status !== 403) fail('unauthenticated root status mismatch')
for (const probe of record.uiSurface?.authenticatedHtmlProbes || []) {
  if (probe.status !== 404) fail(`authenticated HTML probe did not 404: ${probe.path}`)
  if (probe.contentType !== 'application/json; charset=utf-8') fail(`authenticated HTML probe content type mismatch: ${probe.path}`)
  if (probe.htmlLike !== false) fail(`authenticated HTML probe unexpectedly HTML-like: ${probe.path}`)
}
if (record.readiness?.externalProductBeta !== 'blocked_pending_deployed_browser_ui_surface_for_owner_walkthrough') fail('external product beta readiness mismatch')
if (record.readiness?.productApiReadiness !== 'ready_for_controlled_owner_tester_product_walkthrough') fail('product API readiness mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const runnerSource = read('scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1.mjs')
for (const text of [
  "process.env[confirmEnv] === 'true'",
  'blocked_pending_external_beta_controlled_tester_ui_flow_smoke_confirmation',
  'blocked_tester_email_not_owner_approved_primary_account',
  'blocked_pending_owner_approved_tester_group_membership',
  'blocked_deployed_browser_ui_surface_not_present',
  'blocked_broad_cloud_run_invoker_binding_present',
  'print-identity-token',
  'identityTokenPrinted',
  'identityTokenPersisted',
  'authenticated_html_probe_',
]) {
  if (!runnerSource.includes(text)) fail(`runner missing required guard/source: ${text}`)
}
const forbiddenRunnerCommandPatterns = [
  ['memberships add', /\bmemberships\b[\s\S]{0,80}\badd\b/],
  ['add-iam-policy-binding', /\badd-iam-policy-binding\b/],
  ['remove-iam-policy-binding', /\bremove-iam-policy-binding\b/],
  ['run deploy', /\brun\b[\s\S]{0,80}\bdeploy\b/],
  ['secrets versions access', /\bsecrets\b[\s\S]{0,80}\bversions\b[\s\S]{0,80}\baccess\b/],
  ['psql executable', /execFileSync\(\s*['"]psql['"]|spawnSync\(\s*['"]psql['"]|\[\s*['"]psql['"]/],
  ['ffmpeg executable', /execFileSync\(\s*['"]ffmpeg['"]|spawnSync\(\s*['"]ffmpeg['"]|\[\s*['"]ffmpeg['"]/],
  ['ffprobe executable', /execFileSync\(\s*['"]ffprobe['"]|spawnSync\(\s*['"]ffprobe['"]|\[\s*['"]ffprobe['"]/],
  ['docker executable', /execFileSync\(\s*['"]docker['"]|spawnSync\(\s*['"]docker['"]|\[\s*['"]docker['"]/],
]
for (const [label, pattern] of forbiddenRunnerCommandPatterns) {
  if (pattern.test(runnerSource)) fail(`runner contains forbidden command/source: ${label}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-tester-ui-flow-smoke-1'] !==
  'node scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-tester-ui-flow-smoke-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowed = new Set([
  ...requiredFiles,
  ...rollupFiles,
  ...productFlowFiles,
  ...followOnDeployedBrowserUiSurfaceFiles,
  ...followOnDeployedBrowserUiSurface1rStagingDeployFiles,
])
for (const file of changedFiles()) {
  if (!allowed.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if ((file === blocked || file.startsWith(blocked)) && !followOnDeployedBrowserUiSurfaceFiles.includes(file)) {
      fail(`blocked file scope changed: ${file}`)
    }
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  if (!file.startsWith('scripts/validation/')) {
    for (const pattern of forbiddenClaims) {
      if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_external_beta_controlled_tester_ui_flow_smoke')
console.log('Blocker: blocked_deployed_browser_ui_surface_not_present')
console.log('External product beta readiness: blocked_pending_deployed_browser_ui_surface_for_owner_walkthrough')
