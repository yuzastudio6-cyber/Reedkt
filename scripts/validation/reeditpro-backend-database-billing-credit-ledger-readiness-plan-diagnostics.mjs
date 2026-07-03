#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-backend-database-billing-credit-ledger-readiness-plan'
const previousDir = 'docs/reeditpro-observability-incident-support-readiness-plan'
const decision =
  'reeditpro_backend_database_billing_credit_ledger_readiness_plan_passed_ready_for_worker_generation_export_e2e_readiness_plan'
const previousDecision =
  'reeditpro_observability_incident_support_readiness_plan_passed_ready_for_backend_database_billing_credit_ledger_readiness_plan'
const nextPrompt = 'REEDITPRO_WORKER_GENERATION_EXPORT_E2E_READINESS_PLAN'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'backend-ownership-plan.json',
  'backend-ownership-plan.md',
  'database-schema-migration-readiness.json',
  'database-schema-migration-readiness.md',
  'billing-integration-proof-plan.json',
  'billing-integration-proof-plan.md',
  'credit-ledger-policy.json',
  'credit-ledger-policy.md',
  'audit-logging-prerequisites.json',
  'audit-logging-prerequisites.md',
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
  'docker/prod/ocr-runtime/Dockerfile',
  'supabase/config.toml',
]
const forbiddenOutputs = ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker']
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
  if (report.ownerId !== 'REEDITPRO_BACKEND_BILLING_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
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
readText('docs/implementation-prompts/prompt-reeditpro-worker-generation-export-e2e-readiness-plan.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  owners: readJson(`${reportDir}/backend-ownership-plan.json`),
  database: readJson(`${reportDir}/database-schema-migration-readiness.json`),
  billing: readJson(`${reportDir}/billing-integration-proof-plan.json`),
  ledger: readJson(`${reportDir}/credit-ledger-policy.json`),
  audit: readJson(`${reportDir}/audit-logging-prerequisites.json`),
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
if (previousReadiness.readyForBackendDatabaseBillingCreditLedgerReadinessPlan !== true) fail('previous_not_ready_for_backend_gate')

if (reports.source.readyForWorkerGenerationExportE2EReadinessPlan !== true) fail('source_not_ready_for_worker_gate')
if (reports.decisionReport.readyForWorkerGenerationExportE2EReadinessPlan !== true) fail('decision_not_ready_for_worker_gate')
if (reports.readiness.readyForWorkerGenerationExportE2EReadinessPlan !== true) fail('readiness_not_ready_for_worker_gate')
if (!reports.owners.requiredOwners?.includes('credit ledger owner')) fail('missing_credit_ledger_owner')
if (reports.owners.ownersNamed !== false) fail('owners_named')
if (reports.owners.backendRuntimeImplemented !== false) fail('backend_runtime_implemented')
if (!reports.database.requiredSchemaAreas?.includes('credit estimates, reservations, spends, releases, and refunds')) {
  fail('missing_credit_schema_area')
}
for (const flag of ['sqlExecuted', 'migrationCreated', 'rlsPoliciesCreated', 'storagePoliciesCreated']) {
  if (reports.database[flag] !== false) fail(`database_flag_not_false:${flag}`)
}
for (const flag of ['billingProviderConnected', 'webhooksCreated', 'paymentMutationRan']) {
  if (reports.billing[flag] !== false) fail(`billing_flag_not_false:${flag}`)
}
for (const flag of ['creditsReserved', 'creditsSpent', 'creditsRefunded', 'ledgerMutationRan']) {
  if (reports.ledger[flag] !== false) fail(`ledger_flag_not_false:${flag}`)
}
if (reports.audit.auditTablesCreated !== false) fail('audit_tables_created')
if (reports.audit.auditEventsWritten !== false) fail('audit_events_written')
if (!reports.downstream.downstreamGates?.includes('workerGenerationExportE2E')) fail('downstream_missing_worker_gate')
if (reports.downstream.readyForWorkerGenerationExportE2EReadinessPlan !== true) fail('downstream_not_ready_for_worker_gate')
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
  'billingProviderCallsRan',
  'creditLedgerMutationsRan',
]) {
  if (reports.manifest[flag] !== false) fail(`manifest_flag_not_false:${flag}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['reeditpro:backend-database-billing-credit-ledger-readiness-plan:diagnostics'] !==
  'node scripts/validation/reeditpro-backend-database-billing-credit-ledger-readiness-plan-diagnostics.mjs'
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
    file === 'docs/implementation-prompts/prompt-reeditpro-worker-generation-export-e2e-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-delivery-share-policy-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-external-beta-production-go-no-go-review.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-limited-external-beta-runtime-owner-approval-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-limited-external-beta-runtime-owner-approval-execution.md' ||
    file === 'scripts/validation/reeditpro-limited-external-beta-runtime-owner-approval-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-external-beta-production-go-no-go-review-diagnostics.mjs' ||
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
    file.startsWith('docs/reeditpro-limited-external-beta-runtime-owner-approval-plan/') ||
    file.startsWith('docs/reeditpro-external-beta-production-go-no-go-review/') ||
    file.startsWith('docs/reeditpro-delivery-share-policy-readiness-plan/') ||
    file.startsWith('docs/reeditpro-worker-generation-export-e2e-readiness-plan/') ||
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
  'docs/implementation-prompts/prompt-reeditpro-worker-generation-export-e2e-readiness-plan.md',
]
for (const file of scanFiles) {
  const text = readText(file)
  if (/\b(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_-]{20,}|github_pat_|postgres(?:ql)?:\/\/|BEGIN [A-Z ]*PRIVATE KEY|X-Amz-Signature=)\b/i.test(text)) fail(`secret_material:${file}`)
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
  readyForWorkerGenerationExportE2EReadinessPlan: true,
  readyForExternalBeta: false,
  readyForProduction: false,
}, null, 2))
