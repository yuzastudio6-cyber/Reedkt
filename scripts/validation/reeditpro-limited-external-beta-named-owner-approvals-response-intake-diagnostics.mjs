#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/reeditpro-limited-external-beta-named-owner-approvals-response-intake'
const previousDir = 'docs/reeditpro-limited-external-beta-named-owner-approvals-request'
const decision =
  'reeditpro_limited_external_beta_named_owner_approvals_response_intake_blocked_pending_submitted_owner_responses'
const previousDecision =
  'reeditpro_limited_external_beta_named_owner_approvals_request_passed_ready_for_owner_response_intake'
const nextPrompt = 'REEDITPRO_LIMITED_EXTERNAL_BETA_SUBMIT_NAMED_OWNER_APPROVAL_RESPONSES'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'response-intake-review.json',
  'response-intake-review.md',
  'owner-response-status.json',
  'owner-response-status.md',
  'response-evidence-gap.json',
  'response-evidence-gap.md',
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
  if (report.readyForSubmittedOwnerResponses !== true) fail(`${label}_not_ready_for_submitted_owner_responses`)
  if (report.readyForLimitedExternalBetaActivationPlan !== false) fail(`${label}_activation_plan_unblocked`)
  if (report.readyForExternalBeta !== false) fail(`${label}_external_beta_unblocked`)
  if (report.readyForProduction !== false) fail(`${label}_production_unblocked`)
  if (report.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
    fail(`${label}_supabase_classification_drift:${report.supabaseClassification}`)
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of requiredProductionDocs) readText(file)
readText('docs/implementation-prompts/prompt-reeditpro-limited-external-beta-submit-named-owner-approval-responses.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  review: readJson(`${reportDir}/response-intake-review.json`),
  status: readJson(`${reportDir}/owner-response-status.json`),
  gap: readJson(`${reportDir}/response-evidence-gap.json`),
  runtime: readJson(`${reportDir}/runtime-boundary.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

const previousReadiness = readJson(`${previousDir}/readiness-report.json`)
if (previousReadiness.decision !== previousDecision) fail(`previous_decision_drift:${previousReadiness.decision}`)
if (previousReadiness.readyForOwnerResponseIntake !== true) fail('previous_not_ready_for_owner_response_intake')
if (previousReadiness.readyForExternalBeta !== false) fail('previous_external_beta_unblocked')
if (previousReadiness.readyForProduction !== false) fail('previous_production_unblocked')

if (reports.source.legacyCrossWorkstreamOwnerLedgerAuthoritativeForThisGate !== false) {
  fail('legacy_cross_workstream_ledger_marked_authoritative')
}
if (reports.review.responseIntakeAttempted !== true) fail('response_intake_not_attempted')
if (reports.review.submittedResponsesFound !== false) fail('submitted_responses_claimed')
if (reports.review.acceptedApprovals !== 0) fail(`accepted_approvals_drift:${reports.review.acceptedApprovals}`)
if (reports.review.acceptedRejections !== 0) fail(`accepted_rejections_drift:${reports.review.acceptedRejections}`)
if (reports.review.requiredOwnerCount !== 7) fail(`required_owner_count_drift:${reports.review.requiredOwnerCount}`)
if (!reports.review.blockingReason?.includes('no submitted owner')) fail('review_missing_blocking_reason')
for (const owner of requiredOwnerSlots) {
  if (!reports.status.requiredOwnerSlots?.includes(owner)) fail(`missing_owner_slot:${owner}`)
  if (reports.status.ownerResponseStatus?.[owner] !== 'missing_submitted_response') {
    fail(`owner_response_status_drift:${owner}:${reports.status.ownerResponseStatus?.[owner]}`)
  }
}
if (reports.status.allOwnerResponsesRequired !== true) fail('all_owner_responses_not_required')
if (reports.status.partialApprovalAllowedForActivationPlan !== false) fail('partial_approval_allowed')
for (const field of [
  'owner name',
  'owner role',
  'owner slot',
  'approval decision',
  'approved or rejected scope',
  'approval timestamp',
  'accepted duty or explicit rejection reason',
  'explicit exclusions',
  'evidence reference',
]) {
  if (!reports.gap.missingEvidenceFields?.includes(field)) fail(`missing_gap_field:${field}`)
}
for (const invalid of [
  'legacy cross-workstream owner-response ledger',
  'previous metadata readiness',
  'diagnostics passing',
  'placeholder owner names',
  'generic readiness wording',
  'implicit consent',
]) {
  if (!reports.gap.invalidSubstitutes?.includes(invalid)) fail(`missing_invalid_substitute:${invalid}`)
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
  packageJson.scripts?.['reeditpro:limited-external-beta-named-owner-approvals-response-intake:diagnostics'] !==
  'node scripts/validation/reeditpro-limited-external-beta-named-owner-approvals-response-intake-diagnostics.mjs'
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
  readText('docs/implementation-prompts/prompt-reeditpro-limited-external-beta-submit-named-owner-approval-responses.md'),
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
    file === 'docs/implementation-prompts/prompt-reeditpro-limited-external-beta-submit-named-owner-approval-responses.md' ||
    file === 'scripts/validation/reeditpro-limited-external-beta-named-owner-approvals-response-intake-diagnostics.mjs' ||
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
      readyForSubmittedOwnerResponses: true,
      readyForLimitedExternalBetaActivationPlan: false,
      readyForExternalBeta: false,
      readyForProduction: false,
    },
    null,
    2,
  ),
)
