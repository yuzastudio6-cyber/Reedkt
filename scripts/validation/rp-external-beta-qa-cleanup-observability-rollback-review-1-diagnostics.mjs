#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-ROLLBACK-REVIEW-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/qa-cleanup-observability-rollback-review-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/qa-cleanup-readiness.md`,
  `${packetDir}/observability-rollback-readiness.md`,
  `${packetDir}/security-privacy-cost-deployment.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/review-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-qa-cleanup-observability-rollback-review-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-release-go-no-go-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qa-cleanup-observability-rollback-review-1.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-external-beta-qa-cleanup-observability-rollback-review-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const sourcePolicyFiles = [
  'edit-qa-architecture.md',
  'editing-agent-qa-gates.md',
  'agent-failure-fallback-decision-matrix.md',
  'agent-recovery-user-review-policy.md',
  'data-privacy-retention-plan.md',
  'async-checkback-policy.md',
]

const requiredText = [
  packet,
  'completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution',
  'completed_docs_only_qa_cleanup_observability_rollback_review_no_runtime_execution',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging',
  'completed_external_beta_provider_model_call_policy_closure_no_runtime_calls',
  'completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation',
  'completed_approved_snapshot_route_write_runtime_validation',
  'completed_private_artifact_storage_access_guarded_remote_write_readback',
  'source_evidence_review_passed_ready_for_release_go_no_go',
  'ephemeral_fixture_cleanup_evidence_passed_ready_for_release_go_no_go',
  'audit_manifest_checksum_status_evidence_passed_ready_for_release_go_no_go',
  'transaction_rollback_and_fixture_residue_evidence_passed_ready_for_release_go_no_go',
  'reviewed_pending_release_go_no_go_operator_acceptance',
  'blocked_external_product_beta_pending_release_go_no_go_operator_approval_after_qa_cleanup_observability_rollback_review',
  'RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1',
  'PR #577 remains open/draft/blocked and excluded',
  'fajinbvwhcjnutkaumkm` remains sandbox evidence only',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No provider call, model call, worker execution',
]

const forbiddenPatterns = [
  /external product beta status:\s*`?(ready|approved|unlocked)`?/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /releaseGoNoGoApproved"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /routeExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretManagerPayloadAccess"?\s*:\s*true/i,
  /remotionExecutionInThisPhase"?\s*:\s*true/i,
  /ffmpegExecution"?\s*:\s*true/i,
  /ffprobeExecution"?\s*:\s*true/i,
  /package-lock mutation:\s*`?true`?/i,
]

const allowedChanged = new Set(requiredFiles)
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

for (const file of [...requiredFiles, ...sourcePolicyFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

for (const file of sourcePolicyFiles) {
  const text = read(file)
  if (!text.includes('No real') && !text.includes('mock-only') && !text.includes('Non-goals') && !text.includes('does not')) {
    fail(`source policy file does not preserve non-runtime posture: ${file}`)
  }
}

const record = JSON.parse(read(`${packetDir}/review-record.json`))
if (record.decision !== 'completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_qa_cleanup_observability_rollback_review_no_runtime_execution') fail('record execution mismatch')
if (record.singleActiveSupabaseTarget?.projectRef !== 'wmyyttnynmteqgcdishd') fail('main target mismatch')
if (record.singleActiveSupabaseTarget?.historicalIsolatedProjectActive !== false) fail('historical isolated target must not be active')
if (record.singleActiveSupabaseTarget?.dataCopiedFromHistoricalIsolatedProject !== false) fail('historical isolated data copy must be false')
if (record.sourceChain?.pr577 !== 'open_draft_blocked_excluded') fail('PR #577 exclusion mismatch')
if (record.review?.qaReview !== 'source_evidence_review_passed_ready_for_release_go_no_go') fail('QA review mismatch')
if (record.review?.cleanupReview !== 'ephemeral_fixture_cleanup_evidence_passed_ready_for_release_go_no_go') fail('cleanup review mismatch')
if (record.review?.observabilityReview !== 'audit_manifest_checksum_status_evidence_passed_ready_for_release_go_no_go') fail('observability review mismatch')
if (record.review?.rollbackReview !== 'transaction_rollback_and_fixture_residue_evidence_passed_ready_for_release_go_no_go') fail('rollback review mismatch')
if (record.review?.securityPrivacySupportCostDeploymentReview !== 'reviewed_pending_release_go_no_go_operator_acceptance') fail('security/privacy/support/cost/deployment review mismatch')
if (record.readiness?.externalProductBeta !== 'blocked_external_product_beta_pending_release_go_no_go_operator_approval_after_qa_cleanup_observability_rollback_review') fail('external beta blocker mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')

for (const [key, value] of Object.entries(record.cleanupEvidence ?? {})) {
  if (key.endsWith('ResidueCount') && value !== 0) fail(`cleanup residue must be zero: ${key}`)
}
if (record.cleanupEvidence?.generatedRemotionArtifactCommitted !== false) fail('generated Remotion artifact commit flag mismatch')

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
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_external_product_beta_pending_release_go_no_go_operator_approval_after_qa_cleanup_observability_rollback_review') fail('rollup decision mismatch')
if (rollup.sourceClosure?.qaCleanupObservabilityRollbackReview !== 'rp_external_beta_qa_cleanup_observability_rollback_review_1') fail('rollup source closure missing')
if (rollup.mainSupabaseTarget?.qaCleanupObservabilityRollbackReview !== 'completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution') fail('rollup QA review status mismatch')
if (rollup.mainSupabaseTarget?.qaReview !== 'source_evidence_review_passed_ready_for_release_go_no_go') fail('rollup QA review mismatch')
if (rollup.mainSupabaseTarget?.cleanupReview !== 'ephemeral_fixture_cleanup_evidence_passed_ready_for_release_go_no_go') fail('rollup cleanup review mismatch')
if (rollup.mainSupabaseTarget?.observabilityReview !== 'audit_manifest_checksum_status_evidence_passed_ready_for_release_go_no_go') fail('rollup observability review mismatch')
if (rollup.mainSupabaseTarget?.rollbackReview !== 'transaction_rollback_and_fixture_residue_evidence_passed_ready_for_release_go_no_go') fail('rollup rollback review mismatch')
if (rollup.mainSupabaseTarget?.securityPrivacySupportCostDeploymentReview !== 'reviewed_pending_release_go_no_go_operator_acceptance') fail('rollup security/privacy review mismatch')
if (rollup.requiredNextOwnerDecision?.[0] !== 'RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1') fail('rollup next decision mismatch')
if (rollup.safety?.qaCleanupObservabilityRollbackReviewRuntimeExecution !== false) fail('rollup QA review runtime flag mismatch')
if (rollup.safety?.releaseGoNoGoApproved !== false) fail('rollup release approval flag mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-qa-cleanup-observability-rollback-review-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qa-cleanup-observability-rollback-review-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChanged.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blockedPath of blockedPathPrefixes) {
    if (file === blockedPath || file.startsWith(blockedPath)) {
      if (!file.startsWith('scripts/validation/') && file !== 'package.json') fail(`blocked path changed: ${file}`)
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
console.log('Decision: completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution')
console.log('External product beta: blocked_external_product_beta_pending_release_go_no_go_operator_approval_after_qa_cleanup_observability_rollback_review')
