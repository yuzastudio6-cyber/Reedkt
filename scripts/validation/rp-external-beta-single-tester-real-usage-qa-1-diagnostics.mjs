#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1'
const packetDir = 'docs/external-beta/single-tester-real-usage-qa-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runner-contract.md`,
  `${packetDir}/real-usage-qa-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/single-tester-real-usage-qa-record.json`,
  'docs/activation-phase-rp-external-beta-single-tester-real-usage-qa-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-feedback-issue-fix-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-real-usage-qa-1r-after-gcloud-reauth.md',
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1.mjs',
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-active-lane-closure-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-operator-gcloud-auth-preflight-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_single_tester_real_usage_qa_authenticated_staging_readback',
  'completed_guarded_authenticated_single_tester_real_usage_qa_readonly',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_REAL_USAGE_QA',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'reeditpro-staging-api',
  'blocked_no_additional_named_tester_list',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1',
  'daff6905af21d9623b14197a4c9a2d61eed47501',
  'completed_current_base_qwen_transport_dependency_preflight_runtime_still_blocked',
  'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r',
  'RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1',
  '387678f5b884364f078a424ca47210b5eca27c19',
  'completed_operator_gcloud_auth_preflight_helper_ready_no_runtime_invocation',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_OPERATOR_GCLOUD_AUTH_PREFLIGHT=true npm run rp-external-beta-operator-gcloud-auth-preflight-1',
  'completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry',
  '2026-06-30T02-01-10-237Z-03964b88',
  'aa2b21bef41ccd8d321391a224bf7419a2c9cec0259000e5dbcf86f72330468f',
  'single-tester-real-usage-qa-1-2026-06-30T02-02-22-270Z-1629c2ff',
  '261d23a9651587511d1c30f980a819b651924878d3a163d884ec87fe874e2c99',
  'unauthenticated `/`: `403`',
  'authenticated `/api/routes`: `200`',
  'required product route IDs present: `true`',
  'route map total routes: `117`',
]

const allowedFiles = new Set(requiredFiles)
const blockedPrefixes = [
  'package-lock.json',
  'src/',
  'server/',
  'supabase/',
  'database/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
  'dist/',
  'dist-server/',
  'node_modules/',
]
const forbiddenText = [
  /\bgroup membership mutation:\s*`?(true|enabled|completed)\b/i,
  /\bIAM mutation:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed)\b/i,
  /\bmedia processing:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed)\b/i,
  /"groupMembershipMutation"\s*:\s*true/i,
  /"cloudRunIamMutation"\s*:\s*true/i,
  /"deployment"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
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

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenText) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/single-tester-real-usage-qa-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_single_tester_real_usage_qa_authenticated_staging_readback') fail('decision mismatch')
if (record.execution !== 'completed_guarded_authenticated_single_tester_real_usage_qa_readonly') fail('execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.service !== 'reeditpro-staging-api') fail('service mismatch')
if (record.tester?.email !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.tester?.group !== 'external-beta-testers@reeditpro.com') fail('tester group mismatch')
if (record.tester?.activeAccount !== 'aiediting@reeditpro.com') fail('active account mismatch')
if (record.tester?.activeAccountMatches !== true) fail('active account match missing')
if (record.readback?.blocker !== 'none') fail('readback blocker mismatch')
if (record.post1738SourceClosure?.mergeSha !== 'daff6905af21d9623b14197a4c9a2d61eed47501') fail('post-#1738 merge SHA mismatch')
if (record.post1738SourceClosure?.decision !== 'completed_current_base_qwen_transport_dependency_preflight_runtime_still_blocked') fail('post-#1738 decision mismatch')
if (record.post1738SourceClosure?.blocker !== 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r') fail('post-#1738 blocker mismatch')
if (record.post1738SourceClosure?.cloudRunInvocation !== false) fail('post-#1738 Cloud Run invocation must remain false')
if (record.post1738SourceClosure?.identityTokenFetch !== false) fail('post-#1738 identity token fetch must remain false')
if (record.post1738SourceClosure?.requestSent !== false) fail('post-#1738 request sent must remain false')
if (record.post1738SourceClosure?.qwen25VlExecution !== false) fail('post-#1738 QWEN execution must remain false')
if (record.post1738SourceClosure?.workerDispatch !== false) fail('post-#1738 worker dispatch must remain false')
if (record.readback?.qwenTransportCurrentBaseBlocker !== 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r') fail('QWEN transport blocker mismatch')
if (record.post1744SourceClosure?.mergeSha !== '387678f5b884364f078a424ca47210b5eca27c19') fail('post-#1744 merge SHA mismatch')
if (record.post1744SourceClosure?.decision !== 'completed_operator_gcloud_auth_preflight_helper_ready_no_runtime_invocation') fail('post-#1744 decision mismatch')
if (record.post1744SourceClosure?.runnerExecutedInThisRepair !== false) fail('operator helper source closure should remain historical')
if (record.readback?.operatorGcloudAuthPreflightHelper !== 'completed_operator_gcloud_auth_preflight_helper_ready_no_runtime_invocation') fail('operator helper status mismatch')
if (record.priorOperatorGcloudAuthPreflightAttempt?.decision !== 'blocked_gcloud_user_reauthentication_required') fail('prior operator preflight decision mismatch')
if (record.priorOperatorGcloudAuthPreflightAttempt?.execution !== 'blocked_user_access_token_preflight_no_runtime_invocation') fail('prior operator preflight execution mismatch')
if (record.operatorGcloudAuthPreflightAttempt?.decision !== 'completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry') fail('operator preflight decision mismatch')
if (record.operatorGcloudAuthPreflightAttempt?.execution !== 'completed_local_gcloud_auth_preflight_no_runtime_invocation') fail('operator preflight execution mismatch')
if (record.operatorGcloudAuthPreflightAttempt?.observedAccount !== 'aiediting@reeditpro.com') fail('operator preflight account mismatch')
if (record.operatorGcloudAuthPreflightAttempt?.observedProject !== 'reeditpro') fail('operator preflight project mismatch')
if (record.operatorGcloudAuthPreflightAttempt?.userTokenProbe !== 'passed') fail('operator user token probe mismatch')
if (record.operatorGcloudAuthPreflightAttempt?.adcTokenProbe !== 'passed') fail('operator ADC token probe mismatch')
if (record.operatorGcloudAuthPreflightAttempt?.tokenValuePrinted !== false) fail('operator preflight token print flag must be false')
if (record.operatorGcloudAuthPreflightAttempt?.tokenValuePersistedInRepo !== false) fail('operator preflight token repo flag must be false')
if (record.operatorGcloudAuthPreflightAttempt?.tokenTempFileDeleted !== true) fail('operator preflight temp token deletion mismatch')
if (record.operatorGcloudAuthPreflightAttempt?.reportSha256 !== 'aa2b21bef41ccd8d321391a224bf7419a2c9cec0259000e5dbcf86f72330468f') fail('operator preflight report checksum mismatch')
if (record.readback?.operatorGcloudAuthPreflightAttempt !== 'completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry') fail('operator preflight readback mismatch')
if (record.readback?.unauthenticatedRootStatus !== 403) fail('unauthenticated root should be 403')
if (!Array.isArray(record.readback?.authenticatedHtmlRoutes) || record.readback.authenticatedHtmlRoutes.length !== 4) fail('authenticated HTML route count mismatch')
for (const route of ['/', '/dashboard', '/projects', '/editor']) {
  const match = record.readback.authenticatedHtmlRoutes.find((item) => item.route === route)
  if (!match || match.status !== 200 || match.htmlLike !== true) fail(`authenticated HTML route mismatch: ${route}`)
}
if (!Array.isArray(record.readback?.authenticatedJsonRoutes) || record.readback.authenticatedJsonRoutes.length !== 2) fail('authenticated JSON route count mismatch')
for (const route of ['/api/runtime/status', '/api/routes']) {
  const match = record.readback.authenticatedJsonRoutes.find((item) => item.route === route)
  if (!match || match.status !== 200 || match.jsonLike !== true) fail(`authenticated JSON route mismatch: ${route}`)
}
if (record.readback?.requiredRoutesPresent !== true) fail('required routes should be verified')
if (record.readback?.routeMapTotalRoutes !== 117) fail('route total mismatch')
if (record.readback?.routeMapMockReadyRoutes !== 0) fail('mock-ready route count mismatch')
if (!Array.isArray(record.readback?.staticAssetFetches) || record.readback.staticAssetFetches.length !== 2) fail('static asset fetch count mismatch')
if (!record.readback.staticAssetFetches.every((item) => item.status === 200)) fail('static asset status mismatch')
if (record.runEvidence?.reportSha256 !== '261d23a9651587511d1c30f980a819b651924878d3a163d884ec87fe874e2c99') fail('real-usage report checksum mismatch')
if (record.readiness?.singleTesterRealUsageQa !== 'qa_passed_authenticated_staging_readback') fail('readiness mismatch')
if (record.readiness?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') fail('additional tester blocker mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'authenticatedStagingReadbackOnly' || key === 'safeGetRouteExecutionOnly') {
    if (value !== true) fail(`safety flag must be true: ${key}`)
  } else if (value !== false) {
    fail(`safety flag must remain false: ${key}`)
  }
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-single-tester-real-usage-qa-1'] !==
  'node scripts/validation/rp-external-beta-single-tester-real-usage-qa-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-single-tester-real-usage-qa-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-single-tester-real-usage-qa-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const prefix of blockedPrefixes) {
    if (file === prefix || file.startsWith(prefix)) fail(`blocked changed file: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_single_tester_real_usage_qa_authenticated_staging_readback')
console.log('Next milestone: RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1')
