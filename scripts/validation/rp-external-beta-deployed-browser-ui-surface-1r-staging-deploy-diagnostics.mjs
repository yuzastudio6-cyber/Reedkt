#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1R-STAGING-DEPLOY'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/deployed-browser-ui-surface-1r-staging-deploy'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/cloud-build-deploy-evidence.md`,
  `${packetDir}/controlled-tester-ui-smoke-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/deployed-browser-ui-surface-1r-staging-deploy-record.json`,
  'docs/activation-phase-rp-external-beta-deployed-browser-ui-surface-1r-staging-deploy-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-owner-browser-walkthrough-1.md',
  'scripts/validation/rp-external-beta-deployed-browser-ui-surface-1r-staging-deploy-diagnostics.mjs',
  'scripts/validation/rp-external-beta-deployed-browser-ui-surface-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1.mjs',
  'package.json',
]

const rollupFiles = [
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
]

const allowedFiles = new Set([
  ...requiredFiles,
  ...rollupFiles,
  'scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1-diagnostics.mjs',
  'docs/external-beta/controlled-owner-browser-walkthrough-1/source-audit.md',
  'docs/external-beta/controlled-owner-browser-walkthrough-1/runner-contract.md',
  'docs/external-beta/controlled-owner-browser-walkthrough-1/browser-walkthrough-evidence.md',
  'docs/external-beta/controlled-owner-browser-walkthrough-1/readiness-gate.md',
  'docs/external-beta/controlled-owner-browser-walkthrough-1/safety-boundary.md',
  'docs/external-beta/controlled-owner-browser-walkthrough-1/validation-results.md',
  'docs/external-beta/controlled-owner-browser-walkthrough-1/controlled-owner-browser-walkthrough-record.json',
  'docs/activation-phase-rp-external-beta-controlled-owner-browser-walkthrough-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-owner-go-no-go-1.md',
  'scripts/validation/rp-external-beta-controlled-owner-browser-walkthrough-1.mjs',
  'scripts/validation/rp-external-beta-controlled-owner-browser-walkthrough-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  'completed_external_beta_deployed_browser_ui_surface_staging_deploy_and_controlled_tester_ui_smoke',
  'completed_guarded_staging_cloud_build_deploy_and_authenticated_ui_surface_smoke',
  'aiediting@reeditpro.com',
  'owner_approved_primary_real_tester_account',
  'external-beta-testers@reeditpro.com',
  'group:external-beta-testers@reeditpro.com',
  '54fd2cfd-4f19-472d-8b5f-5fbfe55f59b1',
  'sha256:f283e7222db4abefdd01c6eb0ca928e779e6159725d49e96e9d43203e238a76c',
  'reeditpro-staging-api-00006-6gw',
  '2026-06-27T17-15-34-003Z-a728f2ff',
  '63f1730ebcfc018141e9ebd8a29b1104363cab6f75c9a2ccfb7c850dc7d311fb',
  'a1f89539506674d0c2877b437b39d6cf0c9592eeb08a2978f52970f35b666ffe',
  'ready_for_controlled_owner_browser_walkthrough',
  'RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /\ballUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\ballAuthenticatedUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bpaid production unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed)\b/i,
]

const blockedPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'src/',
  'server/',
  'docker/',
  '.github/',
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

const corpus = [...requiredFiles, ...rollupFiles.filter(fs.existsSync)].map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/deployed-browser-ui-surface-1r-staging-deploy-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_external_beta_deployed_browser_ui_surface_staging_deploy_and_controlled_tester_ui_smoke') fail('decision mismatch')
if (record.execution !== 'completed_guarded_staging_cloud_build_deploy_and_authenticated_ui_surface_smoke') fail('execution mismatch')
if (record.ownerAccount !== 'aiediting@reeditpro.com') fail('owner account mismatch')
if (record.testerAccount !== 'aiediting@reeditpro.com') fail('tester account mismatch')
if (record.cloudBuild?.status !== 'SUCCESS') fail('Cloud Build status mismatch')
if (record.cloudBuild?.buildId !== '54fd2cfd-4f19-472d-8b5f-5fbfe55f59b1') fail('Cloud Build ID mismatch')
if (record.cloudRun?.latestReadyRevision !== 'reeditpro-staging-api-00006-6gw') fail('Cloud Run revision mismatch')
if (record.cloudRun?.invokerMember !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run invoker mismatch')
if (record.cloudRun?.allUsersGrant !== false) fail('allUsers grant must be false')
if (record.cloudRun?.allAuthenticatedUsersGrant !== false) fail('allAuthenticatedUsers grant must be false')
if (record.controlledTesterUiSmoke?.decision !== 'completed_external_beta_controlled_tester_ui_flow_smoke') fail('UI smoke decision mismatch')
if (record.controlledTesterUiSmoke?.deployedBrowserUiSurfacePresent !== true) fail('browser UI surface must be present')
for (const key of ['authenticatedRoot', 'authenticatedDashboard', 'authenticatedProjects', 'authenticatedEditor']) {
  if (record.controlledTesterUiSmoke?.[key] !== 'passed_200_html') fail(`${key} mismatch`)
}
if (record.controlledTesterUiSmoke?.unauthenticatedRoot !== 'blocked_403') fail('unauthenticated root mismatch')
if (record.readiness?.externalProductBeta !== 'ready_for_controlled_owner_browser_walkthrough') fail('readiness mismatch')
if (record.readiness?.broadExternalBetaAudience !== 'blocked') fail('broad external beta must remain blocked')
if (record.readiness?.paidProduction !== 'blocked') fail('paid production must remain blocked')
if (record.readiness?.finalDeliveryExport !== 'blocked') fail('final delivery/export must remain blocked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const [key, value] of Object.entries(record.safety || {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const runnerSource = read('scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1.mjs')
if (!runnerSource.includes("report.readiness.externalProductBeta = 'ready_for_controlled_owner_browser_walkthrough'")) {
  fail('UI smoke runner success readiness not updated')
}
if (!runnerSource.includes("report.readiness.nextMilestone = 'RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1'")) {
  fail('UI smoke runner next milestone not updated')
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-deployed-browser-ui-surface-1r-staging-deploy:diagnostics'] !==
  'node scripts/validation/rp-external-beta-deployed-browser-ui-surface-1r-staging-deploy-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(`${blocked}/`)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_external_beta_deployed_browser_ui_surface_staging_deploy_and_controlled_tester_ui_smoke')
console.log('External product beta readiness: ready_for_controlled_owner_browser_walkthrough')
