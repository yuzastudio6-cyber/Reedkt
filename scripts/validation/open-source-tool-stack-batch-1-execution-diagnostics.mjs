import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const reportDir = 'docs/open-source-tool-stack/batch-1-execution'
const allowedDecisions = [
  'open_source_tool_stack_batch_1_execution_passed_ready_for_batch_1_qa_review',
  'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools',
  'blocked_pending_batch_1_dependency_presence',
  'blocked_pending_batch_1_system_binary_presence',
  'blocked_pending_batch_1_proof_validation',
  'blocked_pending_package_lock_integrity',
  'rejected_due_runtime_safety_risk',
]

const requiredReports = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/dependency-baseline-validation.json`,
  `${reportDir}/dependency-baseline-validation.md`,
  `${reportDir}/selected-target-guard.json`,
  `${reportDir}/selected-target-guard.md`,
  `${reportDir}/duckdb-proof-report.json`,
  `${reportDir}/polars-proof-report.json`,
  `${reportDir}/sharp-libvips-proof-report.json`,
  `${reportDir}/ffmpeg-version-probe-report.json`,
  `${reportDir}/ffprobe-version-probe-report.json`,
  `${reportDir}/route-capability-manifest-validation-report.json`,
  `${reportDir}/fixture-report-validation-report.json`,
  `${reportDir}/inventory-proof-matrix-validation-report.json`,
  `${reportDir}/side-effect-and-lock-integrity-report.json`,
  `${reportDir}/batch-1-execution-decision.json`,
  `${reportDir}/batch-1-execution-decision.md`,
  `${reportDir}/batch-1-execution-blocker-report.json`,
  `${reportDir}/batch-1-execution-readiness-report.json`,
  `${reportDir}/batch-1-execution-private-artifact-manifest.json`,
  `${reportDir}/batch-1-execution-validation-results.md`,
]

const expectedTargets = [
  'duckdb_metadata_query_proof',
  'polars_metadata_dataframe_proof',
  'sharp_libvips_import_version_probe',
  'ffmpeg_version_probe',
  'ffprobe_version_probe',
  'route_capability_manifest_validation',
  'fixture_report_validation_harness',
  'open_source_tool_inventory_validator',
]

const falseFlags = [
  'dependencyInstallAllowed',
  'packageLockMutationAllowed',
  'newToolDependencyAdditionAllowed',
  'broadToolExecutionAllowed',
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'providerExecutionAllowed',
  'runtimeExecutionAllowed',
  'mediaProcessingAllowed',
  'audioProcessingAllowed',
  'renderExecutionAllowed',
  'imageGenerationAllowed',
  'imageEditingAllowed',
  'browserCaptureAllowed',
  'mapRenderingAllowed',
  'supabaseWritesAllowed',
  'sqlAllowed',
  'gcsUploadAllowed',
  'publicArtifactsAllowed',
  'signedUrlsAsSourceOfTruthAllowed',
  'rawPromptExecutionAllowed',
  'githubPrMergeAllowed',
  'externalBetaUnlockAllowed',
  'paidProductionUnlockAllowed',
  'productionUnlockAllowed',
]

const forbiddenPatterns = [
  ['dependency_install_allowed', /\bdependencyInstallAllowed["']?\s*[:=]\s*true\b/i],
  ['package_lock_mutation_allowed', /\bpackageLockMutationAllowed["']?\s*[:=]\s*true\b/i],
  ['tool_execution_allowed', /\btoolExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['route_execution_allowed', /\brouteExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['worker_execution_allowed', /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['provider_execution_allowed', /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['media_processing_allowed', /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_write_allowed', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_allowed', /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i],
  ['public_artifact_allowed', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i],
  ['signed_url_truth_allowed', /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i],
  ['raw_prompt_allowed', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['production_unlock_allowed', /\bproductionUnlockAllowed["']?\s*[:=]\s*true\b/i],
  ['pr384_canonical', /PR #384.*canonical/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i],
]

const failures = []

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return undefined
  }
}

for (const path of requiredReports) {
  if (!existsSync(path)) failures.push(`missing_report:${path}`)
}

const docsText = requiredReports
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const sourceAudit = existsSync(requiredReports[0]) ? readJson(requiredReports[0]) : undefined
const baseline = existsSync(requiredReports[1]) ? readJson(requiredReports[1]) : undefined
const selectedTargetGuard = existsSync(requiredReports[3]) ? readJson(requiredReports[3]) : undefined
const routeValidation = existsSync(requiredReports[10]) ? readJson(requiredReports[10]) : undefined
const fixtureValidation = existsSync(requiredReports[11]) ? readJson(requiredReports[11]) : undefined
const inventoryValidation = existsSync(requiredReports[12]) ? readJson(requiredReports[12]) : undefined
const lockIntegrity = existsSync(requiredReports[13]) ? readJson(requiredReports[13]) : undefined
const decision = existsSync(requiredReports[14]) ? readJson(requiredReports[14]) : undefined
const readiness = existsSync(requiredReports[17]) ? readJson(requiredReports[17]) : undefined

if (sourceAudit) {
  if (sourceAudit.approvalDecision !== 'approved_for_future_open_source_tool_stack_batch_1_install_proof_execution') {
    failures.push(`source_approval_decision:${sourceAudit.approvalDecision}`)
  }
  if (sourceAudit.dependencyRepairDecision !== 'dependency_baseline_repair_passed_ready_for_batch_1_approval_rerun') {
    failures.push(`source_dependency_repair_decision:${sourceAudit.dependencyRepairDecision}`)
  }
  for (const flag of falseFlags) {
    if (sourceAudit.executionScope?.[flag] !== false) failures.push(`source_scope_not_false:${flag}`)
  }
}

if (baseline) {
  if (baseline.baselineClean !== true) failures.push('baseline_not_clean')
  if (baseline.packageLockChanged !== false) failures.push('baseline_package_lock_changed')
  if (baseline.dependencyInstallRequested !== false) failures.push('baseline_dependency_install_requested')
}

if (selectedTargetGuard) {
  if (selectedTargetGuard.passed !== true) failures.push('selected_target_guard_failed')
  const targets = selectedTargetGuard.approvedTargets ?? []
  for (const target of expectedTargets) {
    if (!targets.includes(target)) failures.push(`missing_target:${target}`)
  }
  for (const target of targets) {
    if (!expectedTargets.includes(target)) failures.push(`unexpected_target:${target}`)
  }
}

for (const [name, report] of [
  ['route_validation', routeValidation],
  ['fixture_validation', fixtureValidation],
  ['inventory_validation', inventoryValidation],
]) {
  if (report?.passed !== true) failures.push(`${name}_not_passed`)
}

if (lockIntegrity) {
  if (lockIntegrity.packageLockChanged !== false) failures.push('lock_integrity_package_lock_changed')
  if (lockIntegrity.nodeModulesCommitted !== false) failures.push('lock_integrity_node_modules_committed')
  if (lockIntegrity.buildOutputsCommitted !== false) failures.push('lock_integrity_build_outputs_committed')
  if (lockIntegrity.mediaArtifactsCommitted !== false) failures.push('lock_integrity_media_artifacts_committed')
}

if (decision) {
  if (!allowedDecisions.includes(decision.decision)) failures.push(`unexpected_decision:${decision.decision}`)
  if (decision.dependencyInstallAttempted !== false) failures.push('decision_dependency_install_attempted')
  if (decision.packageLockMutationAttempted !== false) failures.push('decision_package_lock_mutation_attempted')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('decision_supabase_update_not_no_write')
  for (const flag of falseFlags) {
    if (decision.executionScope?.[flag] !== false) failures.push(`decision_scope_not_false:${flag}`)
  }
}

if (readiness) {
  if (readiness.packageLockIntegrityPassed !== true) failures.push('readiness_package_lock_integrity_not_true')
}

let packageLockStatus = ''
try {
  packageLockStatus = execFileSync('git', ['status', '--short', '--', 'package-lock.json'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
} catch (error) {
  failures.push(`git_status_package_lock_failed:${error.message}`)
}
if (packageLockStatus) failures.push(`package_lock_has_git_status:${packageLockStatus}`)

if (failures.length) {
  console.error('Open-source Batch 1 execution diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      readiness: readiness?.readiness,
      readyWithMissingOptional: readiness?.readyWithMissingOptional,
      targetCount: expectedTargets.length,
      packageLockChanged: lockIntegrity?.packageLockChanged,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2
  )
)
