#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-deployment-rollback-readiness-plan'
const modelSecurityCostDir = 'docs/reeditpro-model-license-security-cost-readiness-plan'
const privateStorageDir = 'docs/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan'
const observabilityDir = 'docs/reeditpro-observability-incident-support-readiness-plan'
const remediationDir = 'docs/reeditpro-external-beta-production-readiness-remediation-plan'
const decision =
  'reeditpro_deployment_rollback_readiness_plan_passed_ready_for_model_license_security_cost_readiness_plan'
const previousDecision =
  'reeditpro_external_beta_production_readiness_remediation_plan_passed_ready_for_deployment_rollback_readiness_plan'
const nextPrompt = 'REEDITPRO_MODEL_LICENSE_SECURITY_COST_READINESS_PLAN'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 16,
}
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'environment-separation-plan.json',
  'environment-separation-plan.md',
  'release-rollback-owner-plan.json',
  'release-rollback-owner-plan.md',
  'rollback-freeze-policy.json',
  'rollback-freeze-policy.md',
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
const requiredEnvironments = ['local_development', 'internal_staging', 'production']
const requiredRollbackEvidence = [
  'rollback command plan',
  'previous version target',
  'data migration compatibility statement',
  'post-rollback smoke validation plan',
  'incident contact and escalation path',
  'release freeze exception policy',
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
  if (report.ownerId !== 'REEDITPRO_RELEASE_READINESS_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
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
readText('docs/implementation-prompts/prompt-reeditpro-model-license-security-cost-readiness-plan.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  environment: readJson(`${reportDir}/environment-separation-plan.json`),
  owners: readJson(`${reportDir}/release-rollback-owner-plan.json`),
  rollback: readJson(`${reportDir}/rollback-freeze-policy.json`),
  downstream: readJson(`${reportDir}/downstream-gate-prerequisites.json`),
  validation: readJson(`${reportDir}/validation-command-plan.json`),
  runtime: readJson(`${reportDir}/runtime-boundary.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

const remediationReadiness = readJson(`${remediationDir}/readiness-report.json`)
if (remediationReadiness.decision !== previousDecision) fail(`remediation_decision_drift:${remediationReadiness.decision}`)
if (remediationReadiness.readyForDeploymentRollbackReadinessPlan !== true) {
  fail('remediation_not_ready_for_deployment_rollback_plan')
}
if (remediationReadiness.readyForExternalBeta !== false) fail('remediation_external_beta_unblocked')
if (remediationReadiness.readyForProduction !== false) fail('remediation_production_unblocked')

if (JSON.stringify(reports.source.trackBTotals ?? {}) !== JSON.stringify(totals)) fail('source_trackb_totals_drift')
if (reports.source.readyForModelLicenseSecurityCostReadinessPlan !== true) fail('source_not_ready_for_model_license_security_cost_plan')
if (reports.decisionReport.readyForModelLicenseSecurityCostReadinessPlan !== true) fail('decision_not_ready_for_model_license_security_cost_plan')
if (reports.readiness.readyForModelLicenseSecurityCostReadinessPlan !== true) fail('readiness_not_ready_for_model_license_security_cost_plan')

const environments = new Set((reports.environment.environments ?? []).map((entry) => entry.id))
for (const id of requiredEnvironments) {
  if (!environments.has(id)) fail(`missing_environment:${id}`)
}
for (const entry of reports.environment.environments ?? []) {
  if (entry.externalUsersAllowed !== false) fail(`environment_external_users_allowed:${entry.id}`)
  if (entry.productionDataAllowed !== false) fail(`environment_production_data_allowed:${entry.id}`)
}
for (const field of ['releaseOwner', 'rollbackOwner', 'incidentCommander']) {
  if (!String(reports.owners[field] ?? '').includes('required_before_external_beta')) fail(`owner_slot_not_blocked:${field}`)
}
if (reports.rollback.releaseFreezePolicy?.requiredBeforeExternalBeta !== true) fail('release_freeze_policy_not_required')
const rollbackEvidence = new Set(reports.rollback.rollbackEvidenceRequirements ?? [])
for (const requirement of requiredRollbackEvidence) {
  if (!rollbackEvidence.has(requirement)) fail(`missing_rollback_evidence:${requirement}`)
}
if (!reports.downstream.downstreamGates?.includes('modelLicenseSecurityCost')) fail('downstream_missing_model_license_security_cost')
if (reports.downstream.readyForModelLicenseSecurityCostReadinessPlan !== true) fail('downstream_not_ready_for_next_gate')
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
  packageJson.scripts?.['reeditpro:deployment-rollback-readiness-plan:diagnostics'] !==
  'node scripts/validation/reeditpro-deployment-rollback-readiness-plan-diagnostics.mjs'
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
    file === 'docs/implementation-prompts/prompt-reeditpro-model-license-security-cost-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-private-storage-deletion-supabase-gcs-readiness-plan.md' ||
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
    file.startsWith(`${observabilityDir}/`) ||
    file.startsWith(`${modelSecurityCostDir}/`) ||
    file.startsWith(`${privateStorageDir}/`) ||
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
  'docs/implementation-prompts/prompt-reeditpro-model-license-security-cost-readiness-plan.md',
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
  readyForModelLicenseSecurityCostReadinessPlan: true,
  readyForExternalBeta: false,
  readyForProduction: false,
  trackBTotals: totals,
}, null, 2))
