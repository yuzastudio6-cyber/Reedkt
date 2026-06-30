#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-DRY-RUN-ATTEMPT-1R-AFTER-GCLOUD-REAUTH'
const packetDir = 'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth'
const decision = 'completed_qwen_real_dispatch_dry_run_attempt_1r_after_gcloud_reauth_transport_readback'
const execution = 'completed_authenticated_transport_metadata_readback_no_runtime_invocation'
const nextMilestone = 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_EXECUTION_ATTEMPT_1R'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/transport-readback.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-attempt-1r.md',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-diagnostics.mjs',
  'package.json',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/qwen-real-dispatch-auth-path-readback-record.json',
  'docs/external-beta/qwen-transport-dependency-preflight-current-1/qwen-transport-dependency-preflight-current-record.json',
  'docs/external-beta/operator-gcloud-auth-preflight-1/operator-gcloud-auth-preflight-record.json',
  'docs/external-beta/single-tester-real-usage-qa-1/single-tester-real-usage-qa-record.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/source-audit.md',
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/attempt-result-review.md',
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/runtime-boundary.md',
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/validation-results.md',
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/qwen-transport-dependency-attempt-result-review-current-record.json',
  'docs/activation-phase-rp-external-beta-qwen-transport-dependency-attempt-result-review-current-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-transport-readiness-plan-current-1.md',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-attempt-result-review-current-1-diagnostics.mjs',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/source-audit.md',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/transport-readiness-plan.md',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/runtime-boundary.md',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/validation-results.md',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/qwen-transport-readiness-plan-current-record.json',
  'docs/activation-phase-rp-external-beta-qwen-transport-readiness-plan-current-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1.md',
  'scripts/validation/rp-external-beta-qwen-transport-readiness-plan-current-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-enablement-current-import-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-operator-gcloud-auth-preflight-1-diagnostics.mjs',
])

const noScopeStatement =
  'No full draft stack import, PR merge, retarget, branch rewrite, worker runtime source import, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, Cloud Run invocation, Cloud Run deployment, Cloud Run service update, identity token fetch, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, Remotion execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, IAM mutation, group membership mutation, or broad service-role handler was enabled.'

const requiredText = [
  packet,
  decision,
  execution,
  'e1332004c757747fcfe3477c0c5163a2a2a7bc01',
  '2026-06-30T02-20-45-545Z-8324b215',
  '/tmp/reeditpro-rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/2026-06-30T02-20-45-545Z-8324b215',
  'aiediting@reeditpro.com',
  'reeditpro',
  'us-central1',
  'reeditpro-staging-api',
  'reeditpro-qwen2-5-vl-l4-worker',
  'closed_gcloud_user_and_adc_reauth_preflight_passed',
  'transport_metadata_readback_passed_runtime_invocation_still_blocked',
  'reeditpro-staging-api-00006-6gw',
  'reeditpro-qwen2-5-vl-l4-worker-00037-658',
  'QWEN2.5-VL execution: `false`',
  'Worker dispatch: `false`',
  'Identity token fetch: `false`',
  'Request sent: `false`',
  'Cloud Run invocation: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
  noScopeStatement,
]

const falseSafetyKeys = [
  'tokenValuePrinted',
  'tokenValuePersistedInRepo',
  'cloudRunInvocation',
  'cloudRunDeployment',
  'cloudRunServiceUpdate',
  'identityTokenFetch',
  'requestSent',
  'qwen25VlExecution',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'signedUrlCreation',
  'publicArtifactCreation',
  'generatedAssetCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'broadExternalBetaAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'finalRenderExport',
  'mediaProcessing',
  'dockerExecution',
  'remotionExecution',
  'dependencyMutation',
  'packageLockMutation',
  'iamMutation',
  'groupMembershipMutation',
]

const trueSafetyKeys = [
  'localGcloudConfigRead',
  'userAccessTokenProbe',
  'adcAccessTokenProbe',
  'tokenTempFileDeleted',
  'cloudRunServiceMetadataReadback',
]

const forbiddenClaims = [
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run invocation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run service update:\s*`?(true|enabled|completed|passed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bRequest sent:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bgenerated asset creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /"tokenValuePrinted"\s*:\s*true/i,
  /"tokenValuePersistedInRepo"\s*:\s*true/i,
  /"cloudRunInvocation"\s*:\s*true/i,
  /"identityTokenFetch"\s*:\s*true/i,
  /"requestSent"\s*:\s*true/i,
  /"qwen25VlExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

const blockedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!smoke\/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-dry-run-attempt-1-smoke\.ts$)/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^Dockerfile$/,
  /^requirements/i,
  /^\.env/,
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
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== 'e1332004c757747fcfe3477c0c5163a2a2a7bc01') fail('integration base mismatch')
if (record.runEvidence?.runId !== '2026-06-30T02-20-45-545Z-8324b215') fail('run id mismatch')
if (record.runEvidence?.reportBytes !== 4708) fail('report bytes mismatch')
if (record.runEvidence?.reportSha256 !== '36822f5f6a9561f0335ef0c0d2d45811f190b61869d6949953bed8a2315d56fd') fail('report checksum mismatch')
if (record.runEvidence?.manifestBytes !== 768) fail('manifest bytes mismatch')
if (record.runEvidence?.manifestSha256 !== 'bdbdd324bcb7370974fe6851e3e53f1b394a66056f7a74428defdeb190cba206') fail('manifest checksum mismatch')
if (record.runEvidence?.checksumsBytes !== 1190) fail('checksums bytes mismatch')
if (record.runEvidence?.checksumsSha256 !== 'aebb80d3c1128be503cad1cf84673bd90f0f97b63be8498d5c55920ef51ebac5') fail('checksums checksum mismatch')
if (record.observedContext?.account !== 'aiediting@reeditpro.com') fail('account mismatch')
if (record.observedContext?.project !== 'reeditpro') fail('project mismatch')
if (record.authReadback?.userAccessTokenProbe !== 'passed') fail('user token probe mismatch')
if (record.authReadback?.applicationDefaultCredentialTokenProbe !== 'passed') fail('ADC token probe mismatch')
if (record.authReadback?.tokenValuePrinted !== false) fail('token printed flag mismatch')
if (record.authReadback?.tokenValuePersistedInRepo !== false) fail('token persisted flag mismatch')
if (record.authReadback?.tokenTempFileDeleted !== true) fail('token temp delete flag mismatch')
if (record.serviceReadback?.staging?.readyStatus !== 'True') fail('staging ready status mismatch')
if (record.serviceReadback?.qwenWorker?.readyStatus !== 'True') fail('qwen worker ready status mismatch')
if (record.readiness?.qwenAuthPath !== 'closed_gcloud_user_and_adc_reauth_preflight_passed') fail('auth path readiness mismatch')
if (record.readiness?.qwenRealDispatchDryRunAttempt1r !== 'transport_metadata_readback_passed_runtime_invocation_still_blocked') fail('1R readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.readiness?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
for (const key of trueSafetyKeys) {
  if (record.safety?.[key] !== true) fail(`safety flag must be true: ${key}`)
}
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const previousDryRun = parseJson('docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json')
if (previousDryRun.decision !== 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt') {
  fail('previous dry-run source drift')
}
const authPath = parseJson('docs/external-beta/qwen-real-dispatch-auth-path-readback-1/qwen-real-dispatch-auth-path-readback-record.json')
if (authPath.decision !== 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r') {
  fail('auth-path source drift')
}
const qwenPreflight = parseJson('docs/external-beta/qwen-transport-dependency-preflight-current-1/qwen-transport-dependency-preflight-current-record.json')
if (qwenPreflight.nextMilestone !== 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH') {
  fail('transport preflight next milestone drift')
}
const singleTester = parseJson('docs/external-beta/single-tester-real-usage-qa-1/single-tester-real-usage-qa-record.json')
if (singleTester.decision !== 'completed_single_tester_real_usage_qa_authenticated_staging_readback') {
  fail('single tester QA source drift')
}

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth'] !==
  'node scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedPathPatterns.some((pattern) => pattern.test(file))) fail(`blocked path changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc|bin)$/i.test(file)) {
    fail(`generated/media artifact changed: ${file}`)
  }
  const text = read(file)
  if (/ya29\.[A-Za-z0-9_-]+/.test(text)) fail(`Google OAuth token leaked in ${file}`)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log('Runtime invocation, identity-token fetch, worker dispatch, QWEN execution, Supabase/SQL, and generated assets remain blocked')
