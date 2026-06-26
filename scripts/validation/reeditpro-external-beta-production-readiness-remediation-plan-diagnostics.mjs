#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-external-beta-production-readiness-remediation-plan'
const deploymentRollbackDir = 'docs/reeditpro-deployment-rollback-readiness-plan'
const modelSecurityCostDir = 'docs/reeditpro-model-license-security-cost-readiness-plan'
const privateStorageDir = 'docs/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan'
const observabilityDir = 'docs/reeditpro-observability-incident-support-readiness-plan'
const backendReadinessDir = 'docs/reeditpro-backend-database-billing-credit-ledger-readiness-plan'
const workerReadinessDir = 'docs/reeditpro-worker-generation-export-e2e-readiness-plan'
const gapDir = 'docs/open-source-tool-stack/trackb-media-oss-external-beta-production-readiness-gap-review'
const decision =
  'reeditpro_external_beta_production_readiness_remediation_plan_passed_ready_for_deployment_rollback_readiness_plan'
const previousDecision =
  'trackb_media_oss_external_beta_production_readiness_gap_review_blocked_pending_reeditpro_global_readiness_remediation_plan'
const nextPrompt = 'REEDITPRO_DEPLOYMENT_ROLLBACK_READINESS_PLAN'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 16,
}
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'remediation-workstream-plan.json',
  'remediation-workstream-plan.md',
  'owner-gate-evidence-matrix.json',
  'owner-gate-evidence-matrix.md',
  'sequencing-plan.json',
  'sequencing-plan.md',
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
const requiredWorkstreams = [
  'deploymentRollback',
  'modelLicenseSecurityCost',
  'privateStorageDeletionSupabaseGcs',
  'observabilityIncidentSupport',
  'backendDatabaseBillingCreditLedger',
  'realGenerationExportWorkerE2E',
  'publicArtifactSignedUrlDeliveryPolicy',
  'externalBetaGoNoGo',
]
const requiredGateIds = [
  'deploymentRollback',
  'modelLicenseApprovals',
  'securityReview',
  'costBudgetsConcurrencyKillSwitches',
  'privateStorageDeletionWorkflows',
  'observabilityAlertRouting',
  'incidentResponse',
  'backendDatabaseBillingCreditLedger',
  'realGenerationExportWorkers',
  'publicArtifactSignedUrlDeliveryPolicy',
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
  if (report.ownerId !== 'REEDITPRO_PRODUCT_READINESS_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
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
readText('docs/implementation-prompts/prompt-reeditpro-deployment-rollback-readiness-plan.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  workstream: readJson(`${reportDir}/remediation-workstream-plan.json`),
  matrix: readJson(`${reportDir}/owner-gate-evidence-matrix.json`),
  sequence: readJson(`${reportDir}/sequencing-plan.json`),
  validation: readJson(`${reportDir}/validation-command-plan.json`),
  runtime: readJson(`${reportDir}/runtime-boundary.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

const gapReadiness = readJson(`${gapDir}/readiness-report.json`)
if (gapReadiness.decision !== previousDecision) fail(`gap_decision_drift:${gapReadiness.decision}`)
if (gapReadiness.readyForRemediationPlan !== true && gapReadiness.readyForReeditProGlobalRemediationPlan !== true) {
  fail('gap_not_ready_for_remediation_plan')
}
if (gapReadiness.readyForExternalBeta !== false) fail('gap_external_beta_unblocked')
if (gapReadiness.readyForProduction !== false) fail('gap_production_unblocked')

if (JSON.stringify(reports.source.acceptedInputs?.trackBTotals ?? {}) !== JSON.stringify(totals)) fail('source_trackb_totals_drift')
if (reports.source.readyForDeploymentRollbackReadinessPlan !== true) fail('source_not_ready_for_deployment_rollback_plan')
if (reports.decisionReport.readyForDeploymentRollbackReadinessPlan !== true) fail('decision_not_ready_for_deployment_rollback_plan')
if (reports.readiness.readyForDeploymentRollbackReadinessPlan !== true) fail('readiness_not_ready_for_deployment_rollback_plan')
if (reports.readiness.acceptedTrackBToolsCallLaneReady !== true) fail('trackb_input_not_accepted')

const workstreamIds = new Set((reports.workstream.workstreams ?? []).map((entry) => entry.id))
for (const id of requiredWorkstreams) {
  if (!workstreamIds.has(id)) fail(`missing_workstream:${id}`)
}
const gateIds = new Set((reports.matrix.requiredGates ?? []).map((entry) => entry.id))
for (const id of requiredGateIds) {
  if (!gateIds.has(id)) fail(`missing_gate:${id}`)
}
if (reports.sequence.sequence?.[0] !== 'deploymentRollback') fail('first_sequence_not_deployment_rollback')
if (reports.sequence.firstNextPrompt !== nextPrompt) fail('first_next_prompt_drift')
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
]) {
  if (reports.manifest[flag] !== false) fail(`manifest_flag_not_false:${flag}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['reeditpro:external-beta-production-readiness-remediation-plan:diagnostics'] !==
  'node scripts/validation/reeditpro-external-beta-production-readiness-remediation-plan-diagnostics.mjs'
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
    file === 'docs/implementation-prompts/prompt-reeditpro-deployment-rollback-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-model-license-security-cost-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-private-storage-deletion-supabase-gcs-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-observability-incident-support-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-backend-database-billing-credit-ledger-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-worker-generation-export-e2e-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-delivery-share-policy-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-external-beta-production-go-no-go-review.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-limited-external-beta-runtime-owner-approval-plan.md' ||
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
    file.startsWith(`${workerReadinessDir}/`) ||
    file.startsWith(`${backendReadinessDir}/`) ||
    file.startsWith(`${observabilityDir}/`) ||
    file.startsWith(`${deploymentRollbackDir}/`) ||
    file.startsWith(`${modelSecurityCostDir}/`) ||
    file.startsWith(`${privateStorageDir}/`) ||
    file.startsWith('docs/reeditpro-external-beta-production-go-no-go-review/') ||
    file.startsWith('docs/reeditpro-delivery-share-policy-readiness-plan/') ||
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
  'docs/implementation-prompts/prompt-reeditpro-deployment-rollback-readiness-plan.md',
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
  readyForDeploymentRollbackReadinessPlan: true,
  readyForExternalBeta: false,
  readyForProduction: false,
  trackBTotals: totals,
}, null, 2))
