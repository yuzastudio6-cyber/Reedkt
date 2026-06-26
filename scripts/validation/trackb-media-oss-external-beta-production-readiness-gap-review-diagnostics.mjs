#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-external-beta-production-readiness-gap-review'
const handoffDir = 'docs/open-source-tool-stack/trackb-media-oss-product-beta-tools-call-lane-ready-handoff'
const remediationPlanDir = 'docs/reeditpro-external-beta-production-readiness-remediation-plan'
const deploymentRollbackDir = 'docs/reeditpro-deployment-rollback-readiness-plan'
const modelSecurityCostDir = 'docs/reeditpro-model-license-security-cost-readiness-plan'
const privateStorageDir = 'docs/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan'
const decision =
  'trackb_media_oss_external_beta_production_readiness_gap_review_blocked_pending_reeditpro_global_readiness_remediation_plan'
const previousDecision =
  'trackb_media_oss_product_beta_tools_call_lane_handoff_passed_ready_for_external_beta_production_readiness_gap_review'
const nextPrompt = 'REEDITPRO_EXTERNAL_BETA_PRODUCTION_READINESS_REMEDIATION_PLAN'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 16,
}
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'trackb-tools-readiness-acceptance.json',
  'trackb-tools-readiness-acceptance.md',
  'external-beta-blocker-matrix.json',
  'external-beta-blocker-matrix.md',
  'production-blocker-matrix.json',
  'production-blocker-matrix.md',
  'runtime-storage-ops-governance.json',
  'runtime-storage-ops-governance.md',
  'remediation-roadmap.json',
  'remediation-roadmap.md',
  'decision.json',
  'decision.md',
  'readiness-report.json',
  'readiness-report.md',
  'private-artifact-manifest.json',
  'private-artifact-manifest.md',
  'validation-results.md',
]
const statusDocs = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
]
const remediationProductionDocs = [
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
const requiredExternalBetaBlockers = [
  'deploymentRollbackPlan',
  'modelLicenseApprovals',
  'securityReview',
  'costBudgetsConcurrencyKillSwitches',
  'privateStorageDeletionWorkflows',
  'observabilityAlertRouting',
  'incidentResponse',
  'fullE2EDryRunLocalFixtureValidation',
  'finalDeliverySharePolicy',
  'legalSupportOperationalApprovals',
]
const requiredProductionBlockers = [
  'backendDatabase',
  'stripeBillingProductionLedger',
  'productionCreditLedger',
  'realGenerationExportWorkers',
  'supabaseGcsWritePolicy',
  'publicArtifactPolicy',
  'signedUrlPolicy',
  'externalBetaGateSet',
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
  if (report.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
  if (report.decision !== decision) fail(`${label}_decision_drift:${report.decision}`)
  if (report.previousDecision !== previousDecision) fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (JSON.stringify(report.trackBTotals ?? totals) !== JSON.stringify(totals)) fail(`${label}_totals_drift`)
  if (report.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
    fail(`${label}_supabase_classification_drift:${report.supabaseClassification}`)
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText('docs/implementation-prompts/prompt-reeditpro-external-beta-production-readiness-remediation-plan.md')
for (const file of [
  'docs/production-go-no-go-checklist.md',
  'docs/production-beta-readiness-scorecard.md',
  'docs/production-hardening-overview.md',
  'product-plan.md',
]) readText(file)

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  tools: readJson(`${reportDir}/trackb-tools-readiness-acceptance.json`),
  beta: readJson(`${reportDir}/external-beta-blocker-matrix.json`),
  production: readJson(`${reportDir}/production-blocker-matrix.json`),
  governance: readJson(`${reportDir}/runtime-storage-ops-governance.json`),
  roadmap: readJson(`${reportDir}/remediation-roadmap.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

const handoffReadiness = readJson(`${handoffDir}/readiness-report.json`)
if (handoffReadiness.decision !== previousDecision) fail(`handoff_decision_drift:${handoffReadiness.decision}`)
if (handoffReadiness.readyForRankedToolCalls !== true) fail('handoff_ranked_tool_calls_not_ready')
if (handoffReadiness.readyForExternalBeta !== false) fail('handoff_external_beta_unblocked')
if (handoffReadiness.readyForProduction !== false) fail('handoff_production_unblocked')

if (reports.tools.acceptedTrackBReadiness?.rankedToolsCallLaneReady !== true) fail('trackb_tools_not_accepted')
if (reports.tools.acceptedTrackBReadiness?.productReadyToolCount !== 16) fail('trackb_tool_count_drift')
if (reports.readiness.readyForRankedToolCalls !== true) fail('ranked_tool_calls_not_ready')
if (reports.readiness.readyForExternalBeta !== false) fail('external_beta_unblocked')
if (reports.readiness.readyForProduction !== false) fail('production_unblocked')
if (reports.readiness.readyForReeditProGlobalRemediationPlan !== true) fail('remediation_plan_not_ready')
if (reports.decisionReport.readyForRemediationPlan !== true) fail('decision_not_ready_for_remediation_plan')
if (reports.roadmap.readyForRemediationPlan !== true) fail('roadmap_not_ready_for_remediation_plan')

const betaBlockers = new Set((reports.beta.externalBetaBlockers ?? []).map((entry) => entry.id))
for (const blocker of requiredExternalBetaBlockers) {
  if (!betaBlockers.has(blocker)) fail(`missing_external_beta_blocker:${blocker}`)
}
const productionBlockers = new Set((reports.production.productionBlockers ?? []).map((entry) => entry.id))
for (const blocker of requiredProductionBlockers) {
  if (!productionBlockers.has(blocker)) fail(`missing_production_blocker:${blocker}`)
}
for (const value of Object.values(reports.governance.runtimeGovernance ?? {})) {
  if (value !== false) fail('runtime_governance_scope_ran')
}
for (const [flag, value] of Object.entries(reports.governance.storageGovernance ?? {})) {
  if (value !== false) fail(`storage_governance_not_false:${flag}`)
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
  packageJson.scripts?.['trackb-media-oss:external-beta-production-readiness-gap-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-external-beta-production-readiness-gap-review-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

const registry = readJson('docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json')
const steward = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json')
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const owner = registry.owners?.find((entry) => entry.ownerId === 'TRACK_B_MEDIA_OSS_STEWARD') ?? {}
for (const [label, object] of Object.entries({ owner, steward, status })) {
  if (object.externalBetaProductionReadinessGapReview?.decision !== decision) fail(`${label}_gap_decision_missing`)
  if (object.externalBetaProductionReadinessGapReview?.readyForExternalBeta !== false) fail(`${label}_external_beta_unblocked`)
  if (object.externalBetaProductionReadinessGapReview?.readyForProduction !== false) fail(`${label}_production_unblocked`)
}
if (owner.endToEndProductReadyToolCount !== 16) fail('owner_registry_product_ready_count_drift')
if (steward.statusCounts?.endToEndProductReady !== 16) fail('steward_product_ready_count_drift')
if (status.counts?.endToEndProductReady !== 16) fail('tool_status_product_ready_count_drift')

for (const file of statusDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_missing_next_prompt:${file}`)
  if (file.endsWith('.md') && !text.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 16 product-ready')) {
    fail(`status_missing_totals:${file}`)
  }
  if (/40\+ tools proven end-to-end/i.test(text)) fail(`forbidden_40_plus_claim:${file}`)
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
    file === 'docs/implementation-prompts/prompt-reeditpro-external-beta-production-readiness-remediation-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-deployment-rollback-readiness-plan.md' ||
    file === 'docs/implementation-prompts/prompt-reeditpro-model-license-security-cost-readiness-plan.md' ||
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
    file.startsWith(`${remediationPlanDir}/`) ||
    file.startsWith(`${deploymentRollbackDir}/`) ||
    file.startsWith(`${modelSecurityCostDir}/`) ||
    file.startsWith(`${privateStorageDir}/`) ||
    file.startsWith(`${reportDir}/`) ||
    remediationProductionDocs.includes(file) ||
    statusDocs.includes(file)
  if (!allowed) fail(`unexpected_changed_file:${file}`)
  if (/\.(ttf|otf|onnx|mp4|mov|mkv|srt|png|jpe?g|webp|gpg|asc|deb)$/i.test(file)) {
    fail(`forbidden_artifact_changed:${file}`)
  }
}

const scanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-reeditpro-external-beta-production-readiness-remediation-plan.md',
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
  trackBTotals: totals,
  readyForRankedToolCalls: true,
  readyForExternalBeta: false,
  readyForProduction: false,
  readyForRemediationPlan: true,
}, null, 2))
