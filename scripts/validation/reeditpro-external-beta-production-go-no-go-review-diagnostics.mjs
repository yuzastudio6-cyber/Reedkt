#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-external-beta-production-go-no-go-review'
const previousDir = 'docs/reeditpro-delivery-share-policy-readiness-plan'
const decision =
  'reeditpro_external_beta_production_go_no_go_review_blocked_pending_runtime_owner_approval'
const previousDecision =
  'reeditpro_delivery_share_policy_readiness_plan_passed_ready_for_external_beta_production_go_no_go_review'
const nextPrompt = 'REEDITPRO_LIMITED_EXTERNAL_BETA_RUNTIME_OWNER_APPROVAL_PLAN'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'go-no-go-review.json',
  'go-no-go-review.md',
  'satisfied-gates.json',
  'satisfied-gates.md',
  'blocking-gaps.json',
  'blocking-gaps.md',
  'limited-external-beta-owner-approval-plan.json',
  'limited-external-beta-owner-approval-plan.md',
  'production-boundary.json',
  'production-boundary.md',
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
  if (report.ownerId !== 'REEDITPRO_EXTERNAL_BETA_PRODUCTION_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
  if (report.decision !== decision) fail(`${label}_decision_drift:${report.decision}`)
  if (report.previousDecision !== previousDecision) fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.readyForLimitedExternalBetaRuntimeOwnerApprovalPlan !== true) fail(`${label}_not_ready_for_owner_plan`)
  if (report.readyForExternalBeta !== false) fail(`${label}_external_beta_unblocked`)
  if (report.readyForProduction !== false) fail(`${label}_production_unblocked`)
  if (report.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
    fail(`${label}_supabase_classification_drift:${report.supabaseClassification}`)
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of requiredProductionDocs) readText(file)
readText('docs/implementation-prompts/prompt-reeditpro-limited-external-beta-runtime-owner-approval-plan.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  goNoGo: readJson(`${reportDir}/go-no-go-review.json`),
  satisfied: readJson(`${reportDir}/satisfied-gates.json`),
  gaps: readJson(`${reportDir}/blocking-gaps.json`),
  ownerPlan: readJson(`${reportDir}/limited-external-beta-owner-approval-plan.json`),
  production: readJson(`${reportDir}/production-boundary.json`),
  runtime: readJson(`${reportDir}/runtime-boundary.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

const previousReadiness = readJson(`${previousDir}/readiness-report.json`)
if (previousReadiness.decision !== previousDecision) fail(`previous_decision_drift:${previousReadiness.decision}`)
if (previousReadiness.readyForExternalBetaProductionGoNoGoReview !== true) fail('previous_not_ready_for_go_no_go')
if (previousReadiness.readyForExternalBeta !== false) fail('previous_external_beta_unblocked')
if (previousReadiness.readyForProduction !== false) fail('previous_production_unblocked')

if (reports.goNoGo.externalBetaGo !== false) fail('external_beta_go_not_false')
if (reports.goNoGo.productionGo !== false) fail('production_go_not_false')
if (reports.goNoGo.limitedExternalBetaPlanningAllowed !== true) fail('limited_external_beta_planning_not_allowed')
if (!reports.goNoGo.reason?.includes('runtime owner approval')) fail('go_no_go_reason_missing_runtime_owner')
for (const gate of [
  'deploymentRollback',
  'modelLicenseSecurityCost',
  'privateStorageDeletion',
  'observabilityIncidentSupport',
  'backendDatabaseBillingCreditLedger',
  'workerGenerationExportE2E',
  'deliverySharePolicy',
]) {
  if (!reports.satisfied.satisfiedMetadataGates?.includes(gate)) fail(`missing_satisfied_gate:${gate}`)
}
if (reports.satisfied.trackBToolsProductReady !== 16) fail('trackb_product_ready_count_drift')
for (const blocker of [
  'runtime owner approval not proven',
  'human external beta go/no-go owner approval not proven',
  'staging/live-smoke scope not authorized',
  'support coverage acceptance not signed off',
  'production traffic approval not proven',
]) {
  if (!reports.gaps.blockingGaps?.includes(blocker)) fail(`missing_blocker:${blocker}`)
}
if (reports.ownerPlan.ownerApprovalPlanRequired !== true) fail('owner_approval_plan_not_required')
if (reports.ownerPlan.productionRemainsBlocked !== true) fail('owner_plan_production_not_blocked')
for (const owner of [
  'release owner',
  'incident owner',
  'support owner',
  'privacy/storage owner',
  'billing/credit owner',
  'worker/runtime owner',
]) {
  if (!reports.ownerPlan.requiredOwnerSlots?.includes(owner)) fail(`missing_owner_slot:${owner}`)
}
for (const field of ['productionGo', 'productionTrafficAllowed', 'paidProductionAllowed']) {
  if (reports.production[field] !== false) fail(`production_field_not_false:${field}`)
}
if (reports.production.requiresSeparateProductionGoNoGoAfterLimitedBeta !== true) fail('production_separate_go_no_go_missing')
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
  packageJson.scripts?.['reeditpro:external-beta-production-go-no-go-review:diagnostics'] !==
  'node scripts/validation/reeditpro-external-beta-production-go-no-go-review-diagnostics.mjs'
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
if (/external beta (?:is )?(?:ready|approved|enabled|unlocked)/i.test(allText)) fail('forbidden_external_beta_ready_claim')
if (/production (?:is )?(?:ready|approved|enabled|unlocked)/i.test(allText)) fail('forbidden_production_ready_claim')
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
      readyForLimitedExternalBetaRuntimeOwnerApprovalPlan: true,
      readyForExternalBeta: false,
      readyForProduction: false,
    },
    null,
    2,
  ),
)
