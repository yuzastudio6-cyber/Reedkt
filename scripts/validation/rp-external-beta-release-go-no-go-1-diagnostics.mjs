#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const releaseDir = 'docs/external-beta/release-go-no-go-1'
const releaseFiles = [
  `${releaseDir}/source-audit.md`,
  `${releaseDir}/release-boundary.md`,
  `${releaseDir}/readiness-gate.md`,
  `${releaseDir}/safety-boundary.md`,
  `${releaseDir}/release-decision-record.json`,
  `${releaseDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-release-go-no-go-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-enablement-1.md',
]

const release1rFiles = [
  'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/source-audit.md',
  'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/compatibility-decision.md',
  'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/validation-results.md',
  'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/release-go-no-go-1r-record.json',
  'docs/activation-phase-rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker.md',
]

const rollupFiles = [
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
]

const afterQwenRollupFiles = [
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/current-readiness-rollup-record.json',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/qwen-evidence-review.md',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/readiness-rollup.md',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/safety-boundary.md',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/validation-results.md',
]

const qwenDryRunFiles = [
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/dry-run-blocker.md',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/transport-readback.md',
]

const controlledEnablementFiles = [
  'docs/external-beta/controlled-enablement-1/source-audit.md',
  'docs/external-beta/controlled-enablement-1/flag-boundary.md',
  'docs/external-beta/controlled-enablement-1/rollback-boundary.md',
  'docs/external-beta/controlled-enablement-1/controlled-enablement-record.json',
  'docs/external-beta/controlled-enablement-1/validation-results.md',
  'docs/activation-phase-rp-external-beta-controlled-enablement-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-staging-flag-application-1.md',
  'server/config/external-beta-controlled-enablement-contract.ts',
  'server/smoke/external-beta-controlled-enablement-contract-smoke.ts',
  'scripts/validation/rp-external-beta-controlled-enablement-1-diagnostics.mjs',
]

const diagnosticFiles = [
  'scripts/validation/rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qa-cleanup-observability-rollback-review-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const requiredFiles = [
  ...releaseFiles,
  ...release1rFiles,
  ...rollupFiles,
  ...afterQwenRollupFiles,
  ...qwenDryRunFiles,
  ...controlledEnablementFiles,
  ...diagnosticFiles,
]

const requiredText = [
  packet,
  'approved_external_beta_release_go_no_go_source_chain_accepted',
  'completed_docs_only_release_go_no_go_no_runtime_unlock',
  'ready_for_explicit_staging_flag_application',
  'External beta unlocked in this packet: `false`',
  'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1',
  'completed_release_go_no_go_compatibility_after_qwen_dry_run_blocker',
  'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt',
  'completed_external_beta_current_readiness_rollup_after_qwen_orchestration',
  'go_controlled_single_tester_external_beta_lane_remains_open',
  'blocked_no_additional_named_tester_list',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging',
  'fajinbvwhcjnutkaumkm',
  'PR #577 remains open/draft/blocked and excluded',
  'completed_reeditpro_main_supabase_target_migration_history_sync',
  'completed_main_supabase_service_role_runtime_grant_boundary_validation',
  'completed_approved_snapshot_persistence_guarded_remote_write_readback',
  'completed_credit_reservation_ledger_guarded_remote_write_readback',
  'completed_job_queue_lease_event_guarded_remote_write_readback',
  'completed_private_artifact_storage_access_guarded_remote_write_readback',
  'completed_service_role_storage_object_metadata_read_route_runtime_validation',
  'completed_approved_snapshot_route_write_runtime_validation',
  'completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation',
  'completed_external_beta_provider_model_call_policy_closure_no_runtime_calls',
  'completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution',
  'paid production',
  'public artifacts',
  'final delivery/export',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /External beta unlocked in this packet:\s*`?true`?/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /productionApproved"?\s*:\s*true/i,
  /paidBillingApproved"?\s*:\s*true/i,
  /publicArtifactsApproved"?\s*:\s*true/i,
  /finalDeliveryExportApproved"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /routeExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretManagerPayloadAccess"?\s*:\s*true/i,
  /creditSpend"?\s*:\s*true/i,
  /deployment"?\s*:\s*true/i,
  /rawPromptExecution"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /privateMediaProcessing"?\s*:\s*true/i,
  /userMediaProcessing"?\s*:\s*true/i,
  /dockerExecution"?\s*:\s*true/i,
  /remotionExecutionInThisPhase"?\s*:\s*true/i,
  /ffmpegExecution"?\s*:\s*true/i,
  /ffprobeExecution"?\s*:\s*true/i,
  /dependencyMutation"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /package-lock mutation:\s*`?true`?/i,
]

const blockedPathPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'server/',
  'src/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
]
const allowedServerFiles = new Set([
  'server/config/external-beta-controlled-enablement-contract.ts',
  'server/smoke/external-beta-controlled-enablement-contract-smoke.ts',
])

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
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const releaseRecord = JSON.parse(read(`${releaseDir}/release-decision-record.json`))
if (releaseRecord.decision !== 'approved_external_beta_release_go_no_go_source_chain_accepted') fail('release decision mismatch')
if (releaseRecord.execution !== 'completed_docs_only_release_go_no_go_no_runtime_unlock') fail('release execution mismatch')
if (releaseRecord.integrationHead !== 'd365e1195690daabe00edf10c95b13f62bfd3c7c') fail('integration head mismatch')
if (releaseRecord.singleActiveSupabaseTarget?.projectRef !== 'wmyyttnynmteqgcdishd') fail('single active target mismatch')
if (releaseRecord.singleActiveSupabaseTarget?.historicalIsolatedProjectActive !== false) fail('historical isolated target must not be active')
if (releaseRecord.singleActiveSupabaseTarget?.dataCopiedFromHistoricalIsolatedProject !== false) fail('historical isolated data copy must be false')
if (releaseRecord.sourceChainAccepted?.pr577 !== 'open_draft_blocked_excluded') fail('PR #577 exclusion mismatch')
if (releaseRecord.readiness?.externalProductBeta !== 'ready_for_controlled_external_beta_enablement') fail('external beta readiness mismatch')
if (releaseRecord.readiness?.externalBetaReleaseGoNoGo !== 'approved') fail('release go/no-go approval mismatch')
if (releaseRecord.readiness?.externalBetaUnlock !== false) fail('external beta unlock must remain false')
if (releaseRecord.readiness?.controlledEnablementRequired !== true) fail('controlled enablement required flag mismatch')
if (releaseRecord.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (releaseRecord.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1') fail('next milestone mismatch')
if (releaseRecord.operatorApprovalBoundary?.accepted !== true) fail('operator/source acceptance mismatch')
if (releaseRecord.operatorApprovalBoundary?.productionApproved !== false) fail('production approval must remain false')
if (releaseRecord.operatorApprovalBoundary?.paidBillingApproved !== false) fail('paid billing approval must remain false')
if (releaseRecord.operatorApprovalBoundary?.publicArtifactsApproved !== false) fail('public artifacts approval must remain false')
if (releaseRecord.operatorApprovalBoundary?.finalDeliveryExportApproved !== false) fail('final delivery approval must remain false')

for (const key of [
  'supabaseMutation',
  'sqlExecution',
  'secretManagerPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'creditReservationCreation',
  'creditSpend',
  'jobEnqueue',
  'jobEventWrite',
  'stripeCheckoutWebhookPaymentProcessing',
  'deployment',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
  'rawPromptExecution',
  'finalRenderExport',
  'privateMediaProcessing',
  'userMediaProcessing',
  'dockerExecution',
  'remotionExecutionInThisPhase',
  'ffmpegExecution',
  'ffprobeExecution',
  'dependencyMutation',
  'packageLockMutation',
  'broadServiceRoleHandler',
]) {
  if (releaseRecord.safety?.[key] !== false) fail(`release safety flag must be false: ${key}`)
}
if (releaseRecord.packageLock !== 'unchanged') fail('release package-lock status mismatch')
if (releaseRecord.generatedArtifactsCommitted !== 'none') fail('release generated artifact status mismatch')

const rollupRecord = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
const acceptedRollupDecisions = new Set([
  'approved_external_beta_release_go_no_go_source_chain_accepted',
  'completed_controlled_external_beta_enablement_source_contract_default_off',
  'blocked_no_additional_named_tester_list',
])
if (!acceptedRollupDecisions.has(rollupRecord.decision)) fail('rollup decision mismatch')
if (
  ![
    'd365e1195690daabe00edf10c95b13f62bfd3c7c',
    '05a815f0f9b210393a1b02c8b4257046f11ca5a7',
    '3c56071c0274abeb513f302414d702c113cc6ab7',
  ].includes(rollupRecord.integrationHead)
) {
  fail('rollup integration head mismatch')
}
if (rollupRecord.sourceClosure?.releaseGoNoGo !== 'rp_external_beta_release_go_no_go_1') fail('rollup release closure missing')
if (rollupRecord.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('rollup product-ready count mismatch')
if (rollupRecord.mainSupabaseTarget?.projectRef !== 'wmyyttnynmteqgcdishd') fail('rollup target mismatch')
if (rollupRecord.mainSupabaseTarget?.releaseGoNoGo !== 'approved_external_beta_release_go_no_go_source_chain_accepted') fail('rollup release status mismatch')
if (rollupRecord.mainSupabaseTarget?.externalBetaUnlock !== false) fail('rollup external beta unlock must remain false')
if (rollupRecord.safety?.releaseGoNoGoApproved !== true) fail('rollup release approval flag mismatch')
if (rollupRecord.safety?.externalBetaUnlock !== false) fail('rollup external beta unlock safety mismatch')
if (rollupRecord.decision === 'blocked_no_additional_named_tester_list') {
  if (rollupRecord.integrationHead !== '3c56071c0274abeb513f302414d702c113cc6ab7') fail('bounded tester integration head mismatch')
  if (
    rollupRecord.statuses?.externalProductBeta !==
    'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list'
  ) {
    fail('bounded tester external beta readiness mismatch')
  }
  if (rollupRecord.sourceClosure?.boundedTesterExpansionDecision !== 'rp_external_beta_bounded_tester_expansion_decision_1') {
    fail('bounded tester expansion source closure missing')
  }
  if (rollupRecord.mainSupabaseTarget?.boundedTesterExpansionDecision !== 'blocked_no_additional_named_tester_list') {
    fail('bounded tester expansion decision mismatch')
  }
  if (rollupRecord.mainSupabaseTarget?.boundedTesterExpansionApproved !== false) fail('bounded tester expansion must remain false')
  if (rollupRecord.mainSupabaseTarget?.currentApprovedTesterEmail !== 'aiediting@reeditpro.com') fail('current tester mismatch')
  if (rollupRecord.safety?.additionalTesterExpansionApproved !== false) fail('additional tester expansion must remain false')
  if (rollupRecord.safety?.boundedTesterExpansionDecision !== 'blocked_no_additional_named_tester_list_no_access_mutation') {
    fail('bounded tester expansion safety mismatch')
  }
} else if (rollupRecord.decision === 'completed_controlled_external_beta_enablement_source_contract_default_off') {
  if (rollupRecord.integrationHead !== '05a815f0f9b210393a1b02c8b4257046f11ca5a7') fail('post-controlled integration head mismatch')
  if (rollupRecord.sourceClosure?.controlledEnablement !== 'rp_external_beta_controlled_enablement_1') fail('rollup controlled enablement closure missing')
  if (rollupRecord.statuses?.externalProductBeta !== 'ready_for_explicit_staging_flag_application') fail('rollup controlled readiness mismatch')
  if (rollupRecord.mainSupabaseTarget?.controlledEnablement !== 'completed_controlled_external_beta_enablement_source_contract_default_off') fail('rollup controlled enablement status mismatch')
  if (rollupRecord.mainSupabaseTarget?.externalBetaEnabledInThisPhase !== false) fail('rollup external beta phase enablement must remain false')
  if (rollupRecord.requiredNextOwnerDecision?.[0] !== 'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1') fail('rollup staging flag next decision mismatch')
  if (rollupRecord.safety?.controlledExternalBetaEnablementSourceContract !== true) fail('rollup controlled source contract flag mismatch')
  if (rollupRecord.safety?.externalBetaEnvironmentUnlock !== false) fail('rollup external beta environment unlock mismatch')
} else {
  if (rollupRecord.statuses?.externalProductBeta !== 'ready_for_controlled_external_beta_enablement') fail('rollup external beta readiness mismatch')
  if (rollupRecord.mainSupabaseTarget?.controlledEnablementRequired !== true) fail('rollup controlled enablement flag mismatch')
  if (rollupRecord.mainSupabaseTarget?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1') fail('rollup next milestone mismatch')
  if (rollupRecord.requiredNextOwnerDecision?.[0] !== 'RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1') fail('rollup next owner decision mismatch')
  if (rollupRecord.safety?.controlledExternalBetaEnablement !== false) fail('rollup controlled enablement must remain false')
}
if (rollupRecord.packageLock !== 'unchanged') fail('rollup package-lock status mismatch')
if (rollupRecord.generatedArtifactsCommitted !== 'none') fail('rollup generated artifact status mismatch')

const afterQwenRollupRecord = JSON.parse(
  read('docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/current-readiness-rollup-record.json'),
)
if (afterQwenRollupRecord.decision !== 'completed_external_beta_current_readiness_rollup_after_qwen_orchestration') {
  fail('after-QWEN rollup decision mismatch')
}
if (
  afterQwenRollupRecord.statuses?.externalProductBeta !==
  'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list'
) {
  fail('after-QWEN external beta readiness mismatch')
}
if (afterQwenRollupRecord.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('after-QWEN product-ready count mismatch')
if (afterQwenRollupRecord.safety?.externalBetaGlobalUnlock !== false) fail('after-QWEN global unlock must remain false')

const qwenDryRunRecord = JSON.parse(read('docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json'))
if (qwenDryRunRecord.decision !== 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt') {
  fail('QWEN dry-run blocker decision mismatch')
}
if (qwenDryRunRecord.transportReadback?.result !== 'blocked_reauthentication_required') fail('QWEN dry-run readback mismatch')
if (qwenDryRunRecord.transportReadback?.remoteRequestSent !== false) fail('QWEN dry-run remote request must be false')
if (qwenDryRunRecord.runtimePosture?.cloudRunInvocation !== false) fail('QWEN dry-run Cloud Run invocation must be false')
if (qwenDryRunRecord.runtimePosture?.identityTokenFetch !== false) fail('QWEN dry-run identity token fetch must be false')
if (qwenDryRunRecord.runtimePosture?.qwen25VlExecution !== false) fail('QWEN dry-run execution must be false')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-release-go-no-go-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-release-go-no-go-1-diagnostics.mjs'
) {
  fail('missing release go/no-go diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowed = new Set(requiredFiles)
for (const file of changedFiles()) {
  if (!allowed.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blockedPath of blockedPathPrefixes) {
    if ((file === blockedPath || file.startsWith(blockedPath)) && !allowedServerFiles.has(file)) {
      fail(`blocked path changed: ${file}`)
    }
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: approved_external_beta_release_go_no_go_source_chain_accepted')
console.log('External product beta readiness: ready_for_explicit_staging_flag_application')
console.log('External beta unlocked in this packet: false')
