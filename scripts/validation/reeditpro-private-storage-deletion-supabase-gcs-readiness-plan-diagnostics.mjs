#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan'
const previousDir = 'docs/reeditpro-model-license-security-cost-readiness-plan'
const decision =
  'reeditpro_private_storage_deletion_supabase_gcs_readiness_plan_passed_ready_for_observability_incident_support_readiness_plan'
const previousDecision =
  'reeditpro_model_license_security_cost_readiness_plan_passed_ready_for_private_storage_deletion_supabase_gcs_readiness_plan'
const nextPrompt = 'REEDITPRO_OBSERVABILITY_INCIDENT_SUPPORT_READINESS_PLAN'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 16,
}
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'private-storage-boundary.json',
  'private-storage-boundary.md',
  'deletion-retention-policy.json',
  'deletion-retention-policy.md',
  'signed-url-delivery-policy.json',
  'signed-url-delivery-policy.md',
  'rls-service-role-prerequisites.json',
  'rls-service-role-prerequisites.md',
  'environment-bucket-separation.json',
  'environment-bucket-separation.md',
  'downstream-gate-prerequisites.json',
  'downstream-gate-prerequisites.md',
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
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/ocr-runtime/requirements.ocr.txt',
  'src/backend/contracts/trackb-media-oss-tool-call-contracts.ts',
  'src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts',
  'src/backend/api/index.ts',
  'src/backend/contracts/index.ts',
  'supabase/config.toml',
]
const forbiddenOutputs = [
  'node_modules',
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]
const requiredBuckets = [
  'source-media',
  'generated-assets',
  'processed-media',
  'previews',
  'exports',
  'thumbnails',
  'qa-artifacts',
  'worker-temp',
]
const requiredRlsEvidence = [
  'workspace/project membership select policy',
  'approved snapshot immutability policy',
  'worker/service-role write boundary',
  'audit event append-only policy',
  'credit/ledger service-only policy',
  'media asset project scoping',
  'storage object path ownership policy',
  'service-role audit and non-frontend exposure policy',
]
const requiredDeletionEvidence = [
  'project-scoped deletion request path',
  'workspace owner/admin authorization policy',
  'source media deletion behavior',
  'generated asset deletion behavior',
  'processed media deletion behavior',
  'preview/export deletion behavior',
  'worker-temp TTL cleanup',
  'audit log retention exception policy',
  'provider-side deletion/retention dependency review',
]
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
  return Array.from(new Set([
    ...git(['diff', '--name-only'], true).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only'], true).split('\n').filter(Boolean),
    ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n').filter(Boolean),
  ]))
}

function requireCommon(label, report) {
  if (report.ownerId !== 'REEDITPRO_PRIVACY_STORAGE_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
  if (report.decision !== decision) fail(`${label}_decision_drift:${report.decision}`)
  if (report.previousDecision !== previousDecision) fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.readyForExternalBeta !== false) fail(`${label}_external_beta_unblocked`)
  if (report.readyForProduction !== false) fail(`${label}_production_unblocked`)
  if (report.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
    fail(`${label}_supabase_classification_drift:${report.supabaseClassification}`)
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of requiredProductionDocs) readText(file)
readText('docs/implementation-prompts/prompt-reeditpro-observability-incident-support-readiness-plan.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  storage: readJson(`${reportDir}/private-storage-boundary.json`),
  deletion: readJson(`${reportDir}/deletion-retention-policy.json`),
  signedUrl: readJson(`${reportDir}/signed-url-delivery-policy.json`),
  rls: readJson(`${reportDir}/rls-service-role-prerequisites.json`),
  environment: readJson(`${reportDir}/environment-bucket-separation.json`),
  downstream: readJson(`${reportDir}/downstream-gate-prerequisites.json`),
  validation: readJson(`${reportDir}/validation-command-plan.json`),
  runtime: readJson(`${reportDir}/runtime-boundary.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

const previousReadiness = readJson(`${previousDir}/readiness-report.json`)
if (previousReadiness.decision !== previousDecision) fail(`previous_decision_drift:${previousReadiness.decision}`)
if (previousReadiness.readyForPrivateStorageDeletionSupabaseGcsReadinessPlan !== true) {
  fail('previous_not_ready_for_private_storage_plan')
}
if (previousReadiness.readyForExternalBeta !== false) fail('previous_external_beta_unblocked')
if (previousReadiness.readyForProduction !== false) fail('previous_production_unblocked')

if (JSON.stringify(reports.source.trackBTotals ?? {}) !== JSON.stringify(totals)) fail('source_trackb_totals_drift')
if (reports.source.readyForObservabilityIncidentSupportReadinessPlan !== true) fail('source_not_ready_for_observability_plan')
if (reports.decisionReport.readyForObservabilityIncidentSupportReadinessPlan !== true) fail('decision_not_ready_for_observability_plan')
if (reports.readiness.readyForObservabilityIncidentSupportReadinessPlan !== true) fail('readiness_not_ready_for_observability_plan')

if (reports.storage.privateByDefault !== true) fail('storage_not_private_by_default')
if (reports.storage.publicBucketsAllowed !== false) fail('public_buckets_allowed')
const buckets = new Set(reports.storage.plannedBuckets ?? [])
for (const bucket of requiredBuckets) {
  if (!buckets.has(bucket)) fail(`missing_bucket:${bucket}`)
}
const deletionEvidence = new Set(reports.deletion.requiredDeletionWorkflowEvidence ?? [])
for (const item of requiredDeletionEvidence) {
  if (!deletionEvidence.has(item)) fail(`missing_deletion_evidence:${item}`)
}
if (reports.deletion.deletionJobsImplemented !== false) fail('deletion_jobs_implemented')
if (reports.deletion.retentionEnforced !== false) fail('retention_enforced')
if (reports.signedUrl.signedUrlsAuthorized !== false) fail('signed_urls_authorized')
if (reports.signedUrl.publicArtifactsAuthorized !== false) fail('public_artifacts_authorized')
const rlsEvidence = new Set(reports.rls.requiredRlsEvidence ?? [])
for (const item of requiredRlsEvidence) {
  if (!rlsEvidence.has(item)) fail(`missing_rls_evidence:${item}`)
}
if (reports.rls.sqlExecuted !== false) fail('sql_executed')
if (reports.rls.migrationCreated !== false) fail('migration_created')
if (reports.rls.supabaseClientMutation !== false) fail('supabase_client_mutation')
if (reports.environment.environmentMutationRan !== false) fail('environment_mutation_ran')
if (reports.environment.bucketCreated !== false) fail('bucket_created')
if (!reports.downstream.downstreamGates?.includes('observabilityIncidentSupport')) fail('downstream_missing_observability')
if (reports.downstream.readyForObservabilityIncidentSupportReadinessPlan !== true) fail('downstream_not_ready_for_next_gate')
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
  'bucketsCreated',
  'uploadsRan',
  'deletionJobsRan',
]) {
  if (reports.manifest[flag] !== false) fail(`manifest_flag_not_false:${flag}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['reeditpro:private-storage-deletion-supabase-gcs-readiness-plan:diagnostics'] !==
  'node scripts/validation/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

for (const file of requiredProductionDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`production_doc_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`production_doc_missing_next_prompt:${file}`)
}

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
    file === 'docs/implementation-prompts/prompt-reeditpro-observability-incident-support-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-backend-database-billing-credit-ledger-readiness-plan.md' ||
    file === 'scripts/validation/reeditpro-observability-incident-support-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-model-license-security-cost-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-deployment-rollback-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-external-beta-production-readiness-remediation-plan-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-external-beta-production-readiness-gap-review-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-product-beta-tools-call-lane-ready-handoff-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-closeout-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs' ||
    file.startsWith('docs/reeditpro-observability-incident-support-readiness-plan/') ||
    file.startsWith(`${reportDir}/`) ||
    requiredProductionDocs.includes(file)
  if (!allowed) fail(`unexpected_changed_file:${file}`)
  if (/\.(ttf|otf|onnx|mp4|mov|mkv|srt|png|jpe?g|webp|gpg|asc|deb)$/i.test(file)) {
    fail(`forbidden_artifact_changed:${file}`)
  }
}

const scanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...requiredProductionDocs,
  'docs/implementation-prompts/prompt-reeditpro-observability-incident-support-readiness-plan.md',
]
for (const file of scanFiles) {
  const text = readText(file)
  if (/\b(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_-]{20,}|github_pat_|postgres(?:ql)?:\/\/|BEGIN [A-Z ]*PRIVATE KEY|X-Amz-Signature=)\b/i.test(text)) {
    fail(`secret_material:${file}`)
  }
  if (/https:\/\/[^\s)]+(?:X-Goog-Signature=|X-Amz-Signature=)/i.test(text)) fail(`signed_url:${file}`)
  if (/external beta (?:is )?ready|production (?:is )?ready/i.test(text)) fail(`forbidden_ready_claim:${file}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, decision, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  previousDecision,
  nextPrompt,
  readyForObservabilityIncidentSupportReadinessPlan: true,
  readyForExternalBeta: false,
  readyForProduction: false,
  trackBTotals: totals,
}, null, 2))
