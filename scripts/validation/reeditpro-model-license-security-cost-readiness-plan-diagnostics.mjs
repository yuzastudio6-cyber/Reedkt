#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-model-license-security-cost-readiness-plan'
const privateStorageDir = 'docs/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan'
const previousDir = 'docs/reeditpro-deployment-rollback-readiness-plan'
const decision =
  'reeditpro_model_license_security_cost_readiness_plan_passed_ready_for_private_storage_deletion_supabase_gcs_readiness_plan'
const previousDecision =
  'reeditpro_deployment_rollback_readiness_plan_passed_ready_for_model_license_security_cost_readiness_plan'
const nextPrompt = 'REEDITPRO_PRIVATE_STORAGE_DELETION_SUPABASE_GCS_READINESS_PLAN'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 16,
}
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'model-license-owner-plan.json',
  'model-license-owner-plan.md',
  'provider-model-policy.json',
  'provider-model-policy.md',
  'security-review-prerequisites.json',
  'security-review-prerequisites.md',
  'cost-concurrency-kill-switch-plan.json',
  'cost-concurrency-kill-switch-plan.md',
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
const requiredOwnerSlots = [
  'model_policy_owner_required_before_external_beta',
  'model_license_owner_required_before_external_beta',
  'provider_contract_owner_required_before_external_beta',
  'security_review_owner_required_before_external_beta',
  'cost_controls_owner_required_before_external_beta',
]
const requiredSecurityEvidence = [
  'secret storage and rotation policy',
  'provider key backend-only boundary',
  'prompt and uploaded media privacy review',
  'user data retention and deletion dependency',
  'abuse monitoring and rate-limit policy',
  'audit log policy for generation and export',
  'model output safety and review path',
  'incident escalation handoff',
]
const requiredCostEvidence = [
  'per-provider budget',
  'per-route budget',
  'per-user spend limit',
  'concurrency limit',
  'queue depth limit',
  'provider kill switch',
  'route kill switch',
  'credit estimate and reservation enforcement',
  'refund/release policy for failed generation',
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
  if (report.ownerId !== 'REEDITPRO_MODEL_SECURITY_COST_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
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
readText('docs/implementation-prompts/prompt-reeditpro-private-storage-deletion-supabase-gcs-readiness-plan.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  ownerPlan: readJson(`${reportDir}/model-license-owner-plan.json`),
  providerPolicy: readJson(`${reportDir}/provider-model-policy.json`),
  security: readJson(`${reportDir}/security-review-prerequisites.json`),
  cost: readJson(`${reportDir}/cost-concurrency-kill-switch-plan.json`),
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
if (previousReadiness.readyForModelLicenseSecurityCostReadinessPlan !== true) {
  fail('previous_not_ready_for_model_license_security_cost_plan')
}
if (previousReadiness.readyForExternalBeta !== false) fail('previous_external_beta_unblocked')
if (previousReadiness.readyForProduction !== false) fail('previous_production_unblocked')

if (JSON.stringify(reports.source.trackBTotals ?? {}) !== JSON.stringify(totals)) fail('source_trackb_totals_drift')
if (reports.source.readyForPrivateStorageDeletionSupabaseGcsReadinessPlan !== true) fail('source_not_ready_for_private_storage_plan')
if (reports.decisionReport.readyForPrivateStorageDeletionSupabaseGcsReadinessPlan !== true) fail('decision_not_ready_for_private_storage_plan')
if (reports.readiness.readyForPrivateStorageDeletionSupabaseGcsReadinessPlan !== true) fail('readiness_not_ready_for_private_storage_plan')

const ownerSlots = new Set(reports.ownerPlan.requiredOwnerSlots ?? [])
for (const slot of requiredOwnerSlots) {
  if (!ownerSlots.has(slot)) fail(`missing_owner_slot:${slot}`)
}
if (reports.providerPolicy.launchRouter?.stillKeyframeGraphicFrame !== 'GPT-Image-2') fail('provider_policy_gpt_image_route_drift')
if (reports.providerPolicy.launchRouter?.animationPrimary !== 'Wan') fail('provider_policy_wan_route_drift')
if (reports.providerPolicy.launchRouter?.animationFallback !== 'Hailuo') fail('provider_policy_hailuo_route_drift')
if (reports.providerPolicy.launchRouter?.premiumFinalFallbackOnly !== 'Veo 3.1 Lite') fail('provider_policy_veo_route_drift')
if (reports.providerPolicy.tierRestrictions?.basicVeoAllowed !== false) fail('basic_veo_allowed')
if (reports.providerPolicy.tierRestrictions?.proVeoAllowed !== false) fail('pro_veo_allowed')
if (reports.providerPolicy.tierRestrictions?.premiumVeoDefaultAllowed !== false) fail('premium_veo_default_allowed')
if (reports.providerPolicy.providerCallsAuthorized !== false) fail('provider_calls_authorized')

const securityEvidence = new Set(reports.security.requiredSecurityEvidence ?? [])
for (const item of requiredSecurityEvidence) {
  if (!securityEvidence.has(item)) fail(`missing_security_evidence:${item}`)
}
if (reports.security.securityToolsRun !== false) fail('security_tools_ran')
if (reports.security.secretsMutated !== false) fail('secrets_mutated')
const costEvidence = new Set(reports.cost.requiredCostEvidence ?? [])
for (const item of requiredCostEvidence) {
  if (!costEvidence.has(item)) fail(`missing_cost_evidence:${item}`)
}
if (reports.cost.billingCreditLedgerStatus !== 'blocked_pending_backend_database_billing_credit_ledger_gate') {
  fail(`billing_credit_ledger_status_drift:${reports.cost.billingCreditLedgerStatus}`)
}
if (reports.cost.costControlsExecuted !== false) fail('cost_controls_executed')
if (reports.cost.providerCallsAuthorized !== false) fail('cost_provider_calls_authorized')
if (!reports.downstream.downstreamGates?.includes('privateStorageDeletionSupabaseGcs')) fail('downstream_missing_private_storage')
if (reports.downstream.readyForPrivateStorageDeletionSupabaseGcsReadinessPlan !== true) fail('downstream_not_ready_for_next_gate')
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
  'providerCallsRan',
  'modelDownloadsRan',
  'secretsMutated',
]) {
  if (reports.manifest[flag] !== false) fail(`manifest_flag_not_false:${flag}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['reeditpro:model-license-security-cost-readiness-plan:diagnostics'] !==
  'node scripts/validation/reeditpro-model-license-security-cost-readiness-plan-diagnostics.mjs'
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
    file === 'docs/implementation-prompts/prompt-reeditpro-private-storage-deletion-supabase-gcs-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-observability-incident-support-readiness-plan.md' ||
    file === 'scripts/validation/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-model-license-security-cost-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-deployment-rollback-readiness-plan-diagnostics.mjs' ||
    file === 'scripts/validation/reeditpro-external-beta-production-readiness-remediation-plan-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-external-beta-production-readiness-gap-review-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-product-beta-tools-call-lane-ready-handoff-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-closeout-diagnostics.mjs' ||
    file === 'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs' ||
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
  'docs/implementation-prompts/prompt-reeditpro-private-storage-deletion-supabase-gcs-readiness-plan.md',
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
  readyForPrivateStorageDeletionSupabaseGcsReadinessPlan: true,
  readyForExternalBeta: false,
  readyForProduction: false,
  trackBTotals: totals,
}, null, 2))
