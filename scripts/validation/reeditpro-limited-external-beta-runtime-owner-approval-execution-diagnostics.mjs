#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-limited-external-beta-runtime-owner-approval-execution'
const previousDir = 'docs/reeditpro-limited-external-beta-runtime-owner-approval-plan'
const decision =
  'reeditpro_limited_external_beta_runtime_owner_approval_execution_blocked_pending_named_owner_approvals'
const previousDecision =
  'reeditpro_limited_external_beta_runtime_owner_approval_plan_passed_ready_for_owner_approval_execution'
const nextPrompt = 'REEDITPRO_LIMITED_EXTERNAL_BETA_NAMED_OWNER_APPROVALS_REQUEST'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'owner-approval-execution.json',
  'owner-approval-execution.md',
  'missing-owner-approvals.json',
  'missing-owner-approvals.md',
  'runtime-evidence-blockers.json',
  'runtime-evidence-blockers.md',
  'activation-boundary.json',
  'activation-boundary.md',
  'downstream-owner-request.json',
  'downstream-owner-request.md',
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
const requiredOwnerSlots = [
  'release owner',
  'runtime worker owner',
  'incident owner',
  'support owner',
  'privacy storage owner',
  'billing credit owner',
  'security owner',
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
  return Array.from(
    new Set([
      ...git(['diff', '--name-only'], true).split('\n').filter(Boolean),
      ...git(['diff', '--cached', '--name-only'], true).split('\n').filter(Boolean),
      ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n').filter(Boolean),
    ]),
  )
}

function requireCommon(label, report) {
  if (report.ownerId !== 'REEDITPRO_LIMITED_EXTERNAL_BETA_OWNER_APPROVAL_STEWARD') {
    fail(`${label}_owner_drift:${report.ownerId}`)
  }
  if (report.decision !== decision) fail(`${label}_decision_drift:${report.decision}`)
  if (report.previousDecision !== previousDecision) fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.readyForNamedOwnerApprovalsRequest !== true) fail(`${label}_not_ready_for_named_owner_request`)
  if (report.readyForLimitedExternalBetaActivationPlan !== false) fail(`${label}_activation_plan_unblocked`)
  if (report.readyForExternalBeta !== false) fail(`${label}_external_beta_unblocked`)
  if (report.readyForProduction !== false) fail(`${label}_production_unblocked`)
  if (report.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
    fail(`${label}_supabase_classification_drift:${report.supabaseClassification}`)
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of requiredProductionDocs) readText(file)
readText('docs/implementation-prompts/prompt-reeditpro-limited-external-beta-named-owner-approvals-request.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  execution: readJson(`${reportDir}/owner-approval-execution.json`),
  missingOwners: readJson(`${reportDir}/missing-owner-approvals.json`),
  runtimeEvidence: readJson(`${reportDir}/runtime-evidence-blockers.json`),
  activation: readJson(`${reportDir}/activation-boundary.json`),
  downstream: readJson(`${reportDir}/downstream-owner-request.json`),
  runtime: readJson(`${reportDir}/runtime-boundary.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

const previousReadiness = readJson(`${previousDir}/readiness-report.json`)
if (previousReadiness.decision !== previousDecision) fail(`previous_decision_drift:${previousReadiness.decision}`)
if (previousReadiness.readyForOwnerApprovalExecution !== true) fail('previous_not_ready_for_owner_approval_execution')
if (previousReadiness.readyForExternalBeta !== false) fail('previous_external_beta_unblocked')
if (previousReadiness.readyForProduction !== false) fail('previous_production_unblocked')

if (reports.execution.approvalExecutionAttempted !== true) fail('approval_execution_not_attempted')
if (reports.execution.approvalExecutionMode !== 'source_truth_metadata_review_only') {
  fail(`approval_execution_mode_drift:${reports.execution.approvalExecutionMode}`)
}
if (reports.execution.namedOwnerApprovalsProvided !== false) fail('named_owner_approvals_claimed')
if (!reports.execution.blockingReason?.includes('named approvals are absent')) fail('execution_missing_blocking_reason')
if (reports.missingOwners.ownerNamesProvided !== false) fail('owner_names_claimed')
if (reports.missingOwners.ownerApprovalCount !== 0) fail(`owner_approval_count_drift:${reports.missingOwners.ownerApprovalCount}`)
for (const owner of requiredOwnerSlots) {
  if (!reports.missingOwners.requiredOwnerSlots?.includes(owner)) fail(`missing_owner_slot:${owner}`)
  if (reports.missingOwners.ownerApprovalStatus?.[owner] !== 'missing_authoritative_approval') {
    fail(`owner_status_drift:${owner}:${reports.missingOwners.ownerApprovalStatus?.[owner]}`)
  }
}
for (const evidence of [
  'staging smoke command plan owner acceptance',
  'worker dispatch authorization boundary owner acceptance',
  'provider call authorization boundary owner acceptance',
  'storage and signed URL dry-run owner acceptance',
  'credit ledger dry-run owner acceptance',
  'support escalation owner acceptance',
  'rollback kill-switch owner acceptance',
]) {
  if (!reports.runtimeEvidence.blockedPendingOwnerApprovalEvidence?.includes(evidence)) {
    fail(`missing_runtime_evidence_blocker:${evidence}`)
  }
}
if (reports.runtimeEvidence.runtimeEvidenceCollectedInThisPhase !== false) fail('runtime_evidence_collected')
for (const field of [
  'limitedExternalBetaActivationAllowed',
  'externalBetaUserExposureAllowed',
  'productionTrafficAllowed',
  'publicDeliveryAllowed',
  'paidProductionAllowed',
]) {
  if (reports.activation[field] !== false) fail(`activation_field_not_false:${field}`)
}
if (reports.activation.requiresSeparateActivationPlanAfterNamedApprovals !== true) {
  fail('missing_separate_activation_plan_requirement')
}
if (reports.activation.requiresSeparateProductionGoNoGoAfterLimitedBetaEvidence !== true) {
  fail('missing_later_production_go_no_go_requirement')
}
if (!reports.downstream.requiredNextAction?.includes('collect named owner approvals')) {
  fail('downstream_missing_named_owner_request')
}
for (const field of ['owner name', 'owner role', 'approved scope', 'approval timestamp', 'accepted duty or explicit rejection', 'explicit exclusions']) {
  if (!reports.downstream.requiredApprovalFields?.includes(field)) fail(`missing_required_approval_field:${field}`)
}
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
  packageJson.scripts?.['reeditpro:limited-external-beta-runtime-owner-approval-execution:diagnostics'] !==
  'node scripts/validation/reeditpro-limited-external-beta-runtime-owner-approval-execution-diagnostics.mjs'
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
  readText('docs/implementation-prompts/prompt-reeditpro-limited-external-beta-named-owner-approvals-request.md'),
].join('\n')
if (/40\+ tools proven end-to-end/i.test(allText)) fail('forbidden_40_plus_end_to_end_claim')
if (/readyForExternalBeta[\s"':]+true/.test(allText)) fail('external_beta_true_claim')
if (/readyForProduction[\s"':]+true/.test(allText)) fail('production_true_claim')
if (/readyForLimitedExternalBetaActivationPlan[\s"':]+true/.test(allText)) fail('activation_plan_true_claim')
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
    file === 'docs/implementation-prompts/prompt-reeditpro-limited-external-beta-named-owner-approvals-request.md' ||
    file === 'scripts/validation/reeditpro-limited-external-beta-runtime-owner-approval-execution-diagnostics.mjs' ||
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
      readyForNamedOwnerApprovalsRequest: true,
      readyForLimitedExternalBetaActivationPlan: false,
      readyForExternalBeta: false,
      readyForProduction: false,
    },
    null,
    2,
  ),
)
