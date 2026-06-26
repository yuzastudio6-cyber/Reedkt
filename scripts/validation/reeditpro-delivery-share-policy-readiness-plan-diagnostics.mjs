#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-delivery-share-policy-readiness-plan'
const previousDir = 'docs/reeditpro-worker-generation-export-e2e-readiness-plan'
const decision =
  'reeditpro_delivery_share_policy_readiness_plan_passed_ready_for_external_beta_production_go_no_go_review'
const previousDecision =
  'reeditpro_worker_generation_export_e2e_readiness_plan_passed_ready_for_delivery_share_policy_readiness_plan'
const nextPrompt = 'REEDITPRO_EXTERNAL_BETA_PRODUCTION_GO_NO_GO_REVIEW'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'delivery-share-policy.json',
  'delivery-share-policy.md',
  'signed-url-access-policy.json',
  'signed-url-access-policy.md',
  'public-artifact-boundary.json',
  'public-artifact-boundary.md',
  'share-revocation-retention-policy.json',
  'share-revocation-retention-policy.md',
  'download-export-eligibility.json',
  'download-export-eligibility.md',
  'support-privacy-redaction.json',
  'support-privacy-redaction.md',
  'downstream-go-no-go-prerequisites.json',
  'downstream-go-no-go-prerequisites.md',
  'validation-command-plan.json',
  'validation-command-plan.md',
  'runtime-boundary.json',
  'runtime-boundary.md',
  'decision.json',
  'decision.md',
  'readiness-report.json',
  'readiness-report.md',
  'private-artifact-manifest.json',
  'private-artifact-manifest.md',
  'validation-results.md',
]
const requiredProductionDocs = [
  'docs/production-go-no-go-checklist.md',
  'docs/production-beta-readiness-scorecard.md',
  'docs/production-hardening-overview.md',
]
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/ocr-runtime/Dockerfile',
  'supabase/config.toml',
]
const forbiddenOutputs = ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', '.next']
const failures = []
const fail = (message) => failures.push(message)
const fullPath = (relativePath) => path.join(repoRoot, relativePath)

function readText(relativePath) {
  const resolved = fullPath(relativePath)
  if (!fs.existsSync(resolved)) {
    fail(`missing_file:${relativePath}`)
    return ''
  }
  return fs.readFileSync(resolved, 'utf8')
}

function readJson(relativePath) {
  const text = readText(relativePath)
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`invalid_json:${relativePath}:${error.message}`)
    return {}
  }
}

function git(args, allowFailure = false) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
      encoding: 'utf8',
    }).trim()
  } catch (error) {
    if (allowFailure) return ''
    throw error
  }
}

function changedFiles() {
  return Array.from(
    new Set([
      ...git(['diff', '--name-only'], true).split('\n').filter(Boolean),
      ...git(['diff', '--cached', '--name-only'], true).split('\n').filter(Boolean),
      ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n').filter(Boolean),
    ]),
  )
}

function requireCommon(label, report) {
  if (report.ownerId !== 'REEDITPRO_DELIVERY_SHARE_POLICY_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
  if (report.decision !== decision) fail(`${label}_decision_drift:${report.decision}`)
  if (report.previousDecision !== previousDecision) fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.readyForExternalBetaProductionGoNoGoReview !== true) fail(`${label}_not_ready_for_go_no_go`)
  if (report.readyForExternalBeta !== false) fail(`${label}_external_beta_unblocked`)
  if (report.readyForProduction !== false) fail(`${label}_production_unblocked`)
  if (report.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
    fail(`${label}_supabase_classification_drift:${report.supabaseClassification}`)
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of requiredProductionDocs) readText(file)
readText('docs/implementation-prompts/prompt-reeditpro-external-beta-production-go-no-go-review.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  delivery: readJson(`${reportDir}/delivery-share-policy.json`),
  signedUrl: readJson(`${reportDir}/signed-url-access-policy.json`),
  publicArtifact: readJson(`${reportDir}/public-artifact-boundary.json`),
  revocation: readJson(`${reportDir}/share-revocation-retention-policy.json`),
  download: readJson(`${reportDir}/download-export-eligibility.json`),
  support: readJson(`${reportDir}/support-privacy-redaction.json`),
  downstream: readJson(`${reportDir}/downstream-go-no-go-prerequisites.json`),
  validation: readJson(`${reportDir}/validation-command-plan.json`),
  runtime: readJson(`${reportDir}/runtime-boundary.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

const previousReadiness = readJson(`${previousDir}/readiness-report.json`)
if (previousReadiness.decision !== previousDecision) fail(`previous_decision_drift:${previousReadiness.decision}`)
if (previousReadiness.readyForDeliverySharePolicyReadinessPlan !== true) fail('previous_not_ready_for_delivery_gate')

if (reports.delivery.deliveryPolicyDefined !== true) fail('delivery_policy_not_defined')
if (reports.delivery.publicDeliveryEnabled !== false) fail('public_delivery_enabled')
if (reports.delivery.signedUrlsCreated !== false) fail('delivery_signed_urls_created')
if (!reports.delivery.allowedFutureDeliveryClasses?.includes('private signed-url preview/download after approved plan and completed export')) {
  fail('missing_private_signed_url_delivery_class')
}
if (!reports.delivery.blockedDeliveryClasses?.includes('public artifact by default')) fail('missing_public_artifact_block')
if (reports.signedUrl.signedUrlPolicyDefined !== true) fail('signed_url_policy_not_defined')
for (const flag of ['requiresExpiration', 'requiresRevocation', 'requiresAuthContext', 'requiresAuditEvent']) {
  if (reports.signedUrl[flag] !== true) fail(`signed_url_missing_${flag}`)
}
if (reports.signedUrl.signedUrlsCreated !== false) fail('signed_url_created')
if (reports.publicArtifact.publicArtifactDefault !== 'blocked') fail('public_artifact_default_drift')
if (reports.publicArtifact.publicArtifactsCreated !== false) fail('public_artifacts_created')
if (reports.publicArtifact.publicBucketRequired !== false) fail('public_bucket_required')
if (reports.publicArtifact.publicDeliveryRequiresSeparateApproval !== true) fail('public_delivery_not_separate_approval')
if (reports.revocation.revocationPolicyDefined !== true) fail('revocation_policy_not_defined')
if (reports.revocation.retentionPolicyDefined !== true) fail('retention_policy_not_defined')
if (reports.revocation.deletionDependency !== 'private_storage_deletion_plan') fail('deletion_dependency_drift')
if (reports.revocation.deletionJobRan !== false) fail('deletion_job_ran')
if (reports.revocation.storageMutationRan !== false) fail('storage_mutation_ran')
for (const flag of [
  'exportEligibilityDefined',
  'requiresApprovedPlan',
  'requiresCompletedExport',
  'requiresManifestReady',
  'requiresCreditLedgerSettled',
  'requiresOwnerOrAuthorizedShareRecipient',
]) {
  if (reports.download[flag] !== true) fail(`download_missing_${flag}`)
}
if (reports.download.downloadRouteImplemented !== false) fail('download_route_implemented')
if (reports.support.redactionPolicyDefined !== true) fail('support_redaction_policy_not_defined')
if (reports.support.supportAccessRequiresIncidentOrTicket !== true) fail('support_ticket_requirement_missing')
if (reports.support.supportQueueMutationRan !== false) fail('support_queue_mutation_ran')
if (!reports.downstream.downstreamGates?.includes('externalBetaProductionGoNoGoReview')) fail('downstream_missing_go_no_go')
if (reports.validation.noInstallBoundary !== true) fail('validation_no_install_boundary_missing')
for (const [scope, value] of Object.entries(reports.runtime.blockedScopes ?? {})) {
  if (value !== false) fail(`runtime_scope_not_false:${scope}`)
}
for (const flag of [
  'privateArtifactsCommitted',
  'generatedOutputsCommitted',
  'mediaArtifactsCommitted',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'supabaseGcsWritesRan',
  'sqlRan',
  'migrationCreated',
  'workerDispatchRan',
  'providerCallsRan',
  'renderExportRan',
]) {
  if (reports.manifest[flag] !== false) fail(`manifest_flag_not_false:${flag}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['reeditpro:delivery-share-policy-readiness-plan:diagnostics'] !==
  'node scripts/validation/reeditpro-delivery-share-policy-readiness-plan-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}
for (const file of requiredProductionDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`production_doc_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`production_doc_missing_next_prompt:${file}`)
}
const allText = [
  ...requiredProductionDocs.map((file) => readText(file)),
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
].join('\n')
if (/40\+ tools proven end-to-end/i.test(allText)) fail('forbidden_40_plus_end_to_end_claim')
if (/readyForExternalBeta[\\s"':]+true/.test(allText)) fail('external_beta_true_claim')
if (/readyForProduction[\\s"':]+true/.test(allText)) fail('production_true_claim')
for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', '--', file], true)) fail(`protected_file_mutated:${file}`)
  if (git(['diff', '--cached', '--name-only', '--', file], true)) fail(`protected_file_staged:${file}`)
}
for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}
for (const file of changedFiles()) {
  const allowed =
    file === 'package.json' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-external-beta-production-go-no-go-review.md' ||
    file === 'scripts/validation/reeditpro-delivery-share-policy-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-worker-generation-export-e2e-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-backend-database-billing-credit-ledger-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-observability-incident-support-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-model-license-security-cost-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-deployment-rollback-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-external-beta-production-readiness-remediation-plan-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-external-beta-production-readiness-gap-review-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-product-beta-tools-call-lane-ready-handoff-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-closeout-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs' ||
    file.startsWith(`${reportDir}/`) ||
    requiredProductionDocs.includes(file)
  if (!allowed) fail(`unexpected_changed_file:${file}`)
  if (/\.(ttf|otf|onnx|mp4|mov|mkv|srt|png|jpe?g|webp|gpg|asc|deb)$/i.test(file)) fail(`forbidden_artifact_changed:${file}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      previousDecision,
      nextPrompt,
      readyForExternalBetaProductionGoNoGoReview: true,
      readyForExternalBeta: false,
      readyForProduction: false,
    },
    null,
    2,
  ),
)
