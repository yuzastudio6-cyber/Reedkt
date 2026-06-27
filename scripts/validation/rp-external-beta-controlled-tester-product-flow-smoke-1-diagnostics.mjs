#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-TESTER-PRODUCT-FLOW-SMOKE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/controlled-tester-product-flow-smoke-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runner-contract.md`,
  `${packetDir}/product-flow-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/controlled-tester-product-flow-smoke-record.json`,
  'docs/activation-phase-rp-external-beta-controlled-tester-product-flow-smoke-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-tester-ui-flow-smoke-1.md',
  'scripts/validation/rp-external-beta-controlled-tester-product-flow-smoke-1.mjs',
  'scripts/validation/rp-external-beta-controlled-tester-product-flow-smoke-1-diagnostics.mjs',
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

const relatedDiagnostics = [
  'scripts/validation/rp-external-beta-tester-account-membership-smoke-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-private-invite-iam-grant-1r-diagnostics.mjs',
  'scripts/validation/rp-external-beta-owner-member-smoke-readback-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'completed_external_beta_controlled_tester_product_flow_smoke',
  'completed_guarded_authenticated_tester_mock_product_flow_smoke_no_persistent_runtime_mutation',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_PRODUCT_FLOW_SMOKE',
  'REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL',
  'aiediting@reeditpro.com',
  'owner_approved_primary_real_tester_account',
  'external-beta-testers@reeditpro.com',
  'group:external-beta-testers@reeditpro.com',
  'reeditpro-staging-api',
  'us-central1',
  '2026-06-27T15-34-26-957Z-dbe78e9d',
  'ed4be5c34449725443592cf1bcf459b5847601b229abacb48018c36a56f86522',
  'a0b67ee1a562d5f3c2d91678eb7dd4bc6dd1bab814b615abd0055c43a3cd187e',
  'planning.demo.chatNative.create',
  'credits.estimate.create',
  'credits.gate.check',
  'jobs.gate.check',
  'render.creditGate.check',
  'render.readiness.check',
  'planning.editPlan.approve',
  'render.preview.create',
  'backend_runtime_required',
  'ready_for_controlled_owner_tester_product_walkthrough',
  'RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1',
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

const corpus = [...requiredFiles, ...rollupFiles.filter(fs.existsSync)]
  .map((file) => read(file))
  .join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/controlled-tester-product-flow-smoke-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_external_beta_controlled_tester_product_flow_smoke') fail('decision mismatch')
if (record.execution !== 'completed_guarded_authenticated_tester_mock_product_flow_smoke_no_persistent_runtime_mutation') fail('execution mismatch')
if (record.integrationBase !== '5513c610ede7f96995b8b2f5da748064dca95ade') fail('integration base mismatch')
if (record.target?.testerEmail !== 'aiediting@reeditpro.com') fail('tester email mismatch')
if (record.target?.testerClassification !== 'owner_approved_primary_real_tester_account') fail('tester classification mismatch')
if (record.target?.groupEmail !== 'external-beta-testers@reeditpro.com') fail('group email mismatch')
if (record.target?.cloudRunIamMember !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run IAM member mismatch')
if (record.runEvidence?.runId !== '2026-06-27T15-34-26-957Z-dbe78e9d') fail('run id mismatch')
if (record.runEvidence?.report?.bytes !== 4967) fail('report byte count mismatch')
if (record.runEvidence?.report?.sha256 !== 'ed4be5c34449725443592cf1bcf459b5847601b229abacb48018c36a56f86522') fail('report checksum mismatch')
if (record.runEvidence?.manifest?.bytes !== 442) fail('manifest byte count mismatch')
if (record.runEvidence?.manifest?.sha256 !== 'a0b67ee1a562d5f3c2d91678eb7dd4bc6dd1bab814b615abd0055c43a3cd187e') fail('manifest checksum mismatch')
if (record.routeMap?.status !== 200) fail('route map status mismatch')
if (record.routeMap?.totalRoutes !== 109) fail('route map total route count mismatch')
if (record.routeMap?.mockReadyRoutes !== 67) fail('route map mock-ready count mismatch')
if (record.routeMap?.requiredRoutesPresent !== true) fail('required routes presence mismatch')
if (record.smoke?.unauthenticatedHealth !== 'blocked_403') fail('unauthenticated health mismatch')
if (record.smoke?.planningDemo?.nextRequiredAction !== 'approve_plan_and_credits') fail('planning did not stop at approval')
if (record.smoke?.planningDemo?.editPlanStatus !== 'awaiting_approval') fail('edit plan status mismatch')
if (record.smoke?.planningDemo?.creditEstimateCredits !== 18) fail('planning credit estimate mismatch')
if (record.smoke?.creditEstimate?.nextStep !== 'approve_plan_and_credits') fail('credit estimate next step mismatch')
if (record.smoke?.creditGate?.creditGateOk !== true) fail('credit gate mismatch')
if (record.smoke?.jobGate?.jobGateOk !== false) fail('job gate must remain blocked')
if (record.smoke?.renderCreditGate?.creditGateOk !== true) fail('render credit gate mismatch')
if (record.smoke?.renderReadiness?.mockOnly !== true) fail('render readiness mock-only mismatch')
for (const item of record.smoke?.backendRequiredBlockedRoutes || []) {
  if (item.httpStatus !== 424 || item.errorCode !== 'backend_runtime_required') fail(`backend-required route did not block: ${item.routeId}`)
}
if (record.readiness?.externalProductBeta !== 'ready_for_controlled_owner_tester_product_walkthrough') fail('external product beta readiness mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const runnerSource = read('scripts/validation/rp-external-beta-controlled-tester-product-flow-smoke-1.mjs')
for (const text of [
  "process.env[confirmEnv] === 'true'",
  'blocked_pending_external_beta_controlled_tester_product_flow_smoke_confirmation',
  'blocked_tester_email_not_owner_approved_primary_account',
  'blocked_pending_owner_approved_tester_group_membership',
  'blocked_broad_cloud_run_invoker_binding_present',
  'blocked_backend_required_route_not_safely_blocked',
  'blocked_planning_flow_did_not_stop_before_approval',
  'blocked_job_gate_unexpectedly_allowed_execution',
  'planning.demo.chatNative.create',
  'render.preview.create',
  '/api/mock',
  '/api/routes',
]) {
  if (!runnerSource.includes(text)) fail(`runner missing required guard/source: ${text}`)
}
const forbiddenRunnerCommandPatterns = [
  ['memberships add', /\bmemberships\b[\s\S]{0,80}\badd\b/],
  ['add-iam-policy-binding', /\badd-iam-policy-binding\b/],
  ['remove-iam-policy-binding', /\bremove-iam-policy-binding\b/],
  ['run deploy', /\brun\b[\s\S]{0,80}\bdeploy\b/],
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
  packageJson.scripts?.['rp-external-beta-controlled-tester-product-flow-smoke-1'] !==
  'node scripts/validation/rp-external-beta-controlled-tester-product-flow-smoke-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-tester-product-flow-smoke-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-tester-product-flow-smoke-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowed = new Set([...requiredFiles, ...rollupFiles, ...relatedDiagnostics])
for (const file of changedFiles()) {
  if (!allowed.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (!file.startsWith('scripts/validation/') && /\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  if (!file.startsWith('scripts/validation/')) {
    for (const pattern of forbiddenClaims) {
      if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_external_beta_controlled_tester_product_flow_smoke')
console.log('External product beta readiness: ready_for_controlled_owner_tester_product_walkthrough')
