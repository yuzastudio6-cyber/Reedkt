#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-worker-generation-export-e2e-readiness-plan'
const previousDir = 'docs/reeditpro-backend-database-billing-credit-ledger-readiness-plan'
const decision =
  'reeditpro_worker_generation_export_e2e_readiness_plan_passed_ready_for_delivery_share_policy_readiness_plan'
const previousDecision =
  'reeditpro_backend_database_billing_credit_ledger_readiness_plan_passed_ready_for_worker_generation_export_e2e_readiness_plan'
const nextPrompt = 'REEDITPRO_DELIVERY_SHARE_POLICY_READINESS_PLAN'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'worker-e2e-dry-run-evidence.json',
  'worker-e2e-dry-run-evidence.md',
  'generation-export-state-machine-proof.json',
  'generation-export-state-machine-proof.md',
  'approved-plan-snapshot-coupling.json',
  'approved-plan-snapshot-coupling.md',
  'artifact-manifest-proof.json',
  'artifact-manifest-proof.md',
  'failure-retry-rollback-behavior.json',
  'failure-retry-rollback-behavior.md',
  'no-user-media-fixture-policy.json',
  'no-user-media-fixture-policy.md',
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
  if (report.ownerId !== 'REEDITPRO_WORKER_E2E_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
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
readText('docs/implementation-prompts/prompt-reeditpro-delivery-share-policy-readiness-plan.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  dryRun: readJson(`${reportDir}/worker-e2e-dry-run-evidence.json`),
  stateMachine: readJson(`${reportDir}/generation-export-state-machine-proof.json`),
  snapshot: readJson(`${reportDir}/approved-plan-snapshot-coupling.json`),
  manifestProof: readJson(`${reportDir}/artifact-manifest-proof.json`),
  failure: readJson(`${reportDir}/failure-retry-rollback-behavior.json`),
  fixture: readJson(`${reportDir}/no-user-media-fixture-policy.json`),
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
if (previousReadiness.readyForWorkerGenerationExportE2EReadinessPlan !== true) fail('previous_not_ready_for_worker_gate')
if (reports.source.readyForDeliverySharePolicyReadinessPlan !== true) fail('source_not_ready_for_delivery_gate')
if (reports.decisionReport.readyForDeliverySharePolicyReadinessPlan !== true) fail('decision_not_ready_for_delivery_gate')
if (reports.readiness.readyForDeliverySharePolicyReadinessPlan !== true) fail('readiness_not_ready_for_delivery_gate')

if (!reports.dryRun.requiredFutureEvidence?.includes('approved plan snapshot loaded by worker')) fail('missing_snapshot_worker_evidence')
if (reports.dryRun.workerDispatchRan !== false) fail('worker_dispatch_ran')
if (reports.dryRun.providerCallsRan !== false) fail('provider_calls_ran')
if (reports.dryRun.renderExportRan !== false) fail('render_export_ran')
if (!reports.stateMachine.requiredStates?.includes('failed_refunded_or_released')) fail('missing_failure_state')
if (reports.stateMachine.stateMachineImplemented !== false) fail('state_machine_implemented')
if (!reports.snapshot.requiredCouplingEvidence?.includes('worker rejects mutable draft plan')) fail('missing_snapshot_rejection_evidence')
if (reports.snapshot.snapshotRuntimeProofRan !== false) fail('snapshot_runtime_proof_ran')
if (!reports.manifestProof.requiredManifestEvidence?.includes('deletion eligibility tag')) fail('missing_deletion_manifest_tag')
if (reports.manifestProof.artifactManifestMutated !== false) fail('artifact_manifest_mutated')
if (reports.failure.retryProofRan !== false) fail('retry_proof_ran')
if (reports.failure.rollbackProofRan !== false) fail('rollback_proof_ran')
if (reports.fixture.allowedFutureFixtureClass !== 'synthetic_no_user_media_fixture_only') fail('fixture_class_drift')
if (reports.fixture.fixtureGenerated !== false) fail('fixture_generated')
if (reports.fixture.mediaProcessed !== false) fail('media_processed')
if (!reports.downstream.downstreamGates?.includes('deliverySharePolicy')) fail('downstream_missing_delivery_gate')
if (reports.downstream.readyForDeliverySharePolicyReadinessPlan !== true) fail('downstream_not_ready_for_delivery_gate')
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
  packageJson.scripts?.['reeditpro:worker-generation-export-e2e-readiness-plan:diagnostics'] !==
  'node scripts/validation/reeditpro-worker-generation-export-e2e-readiness-plan-diagnostics.mjs'
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
    file.startsWith(`${reportDir}/`) ||
    requiredProductionDocs.includes(file)
  if (!allowed) fail(`unexpected_changed_file:${file}`)
  if (/\.(ttf|otf|onnx|mp4|mov|mkv|srt|png|jpe?g|webp|gpg|asc|deb)$/i.test(file)) fail(`forbidden_artifact_changed:${file}`)
}

const scanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...requiredProductionDocs,
  'docs/implementation-prompts/prompt-reeditpro-delivery-share-policy-readiness-plan.md',
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
  readyForDeliverySharePolicyReadinessPlan: true,
  readyForExternalBeta: false,
  readyForProduction: false,
}, null, 2))
