import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/open-source-tool-stack/batch-1/install-proof-approval-source-of-truth-audit.json',
  'docs/open-source-tool-stack/batch-1/batch-1-candidate-review.json',
  'docs/open-source-tool-stack/batch-1/batch-1-candidate-review.md',
  'docs/open-source-tool-stack/batch-1/dependency-baseline-review.json',
  'docs/open-source-tool-stack/batch-1/dependency-baseline-review.md',
  'docs/open-source-tool-stack/batch-1/batch-1-install-proof-scope-policy.json',
  'docs/open-source-tool-stack/batch-1/batch-1-install-proof-scope-policy.md',
  'docs/open-source-tool-stack/batch-1/batch-1-synthetic-fixture-plan.json',
  'docs/open-source-tool-stack/batch-1/batch-1-synthetic-fixture-plan.md',
  'docs/open-source-tool-stack/batch-1/batch-1-e2e-proof-plan.json',
  'docs/open-source-tool-stack/batch-1/batch-1-e2e-proof-plan.md',
  'docs/open-source-tool-stack/batch-1/batch-1-blocker-register.json',
  'docs/open-source-tool-stack/batch-1/batch-1-blocker-register.md',
  'docs/open-source-tool-stack/batch-1/batch-1-install-proof-approval-decision.json',
  'docs/open-source-tool-stack/batch-1/batch-1-install-proof-approval-decision.md',
  'docs/open-source-tool-stack/batch-1/batch-1-readiness-report.json',
  'docs/open-source-tool-stack/batch-1/batch-1-private-artifact-manifest.json',
  'docs/open-source-tool-stack/batch-1/batch-1-validation-results.md',
  'docs/implementation-prompts/prompt-dependency-baseline-repair-before-tool-batch-1.md',
]

const expectedDecision = 'blocked_pending_package_lock_sync_review'
const dependencyBaselineRepairDecisionPath =
  'docs/open-source-tool-stack/dependency-baseline-repair/dependency-baseline-repair-decision.json'
const expectedDependencyBaselineRepairDecision = 'dependency_baseline_repair_passed_ready_for_batch_1_approval_rerun'
const dependencyBaselineRepairPackageKeys = [
  'node_modules/@emnapi/core',
  'node_modules/@emnapi/runtime',
  'node_modules/@emnapi/wasi-threads',
  'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/core',
  'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/runtime',
  'node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/wasi-threads',
]

const requiredCandidateIds = [
  'duckdb_metadata_query_proof',
  'polars_metadata_dataframe_proof',
  'sharp_libvips_import_version_probe',
  'ffmpeg_version_probe',
  'ffprobe_version_probe',
  'route_capability_manifest_validation',
  'fixture_report_validation_harness',
  'open_source_tool_inventory_validator',
]

const exactBaselineBlockers = [
  'missing @emnapi/runtime@1.11.1',
  'missing @emnapi/core@1.11.1',
  'invalid @emnapi/wasi-threads@1.2.1 not satisfying 1.2.2',
  'missing @emnapi/core@1.10.0',
  'missing @emnapi/runtime@1.10.0',
  'missing @emnapi/wasi-threads@1.2.1',
]

const falseScopeFlags = [
  'dependencyInstallAllowed',
  'packageLockMutationAllowed',
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'providerExecutionAllowed',
  'runtimeExecutionAllowed',
  'mediaProcessingAllowed',
  'audioProcessingAllowed',
  'renderExecutionAllowed',
  'imageGenerationAllowed',
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
  ['production_enabled', /\bproduction\s+(?:is\s+)?(?:enabled|unlocked|approved|ready)\b/i],
  ['external_beta_enabled', /\bexternal beta\s+(?:is\s+)?(?:enabled|unlocked|approved|ready)\b/i],
  ['paid_production_enabled', /\bpaid production\s+(?:is\s+)?(?:enabled|unlocked|approved|ready)\b/i],
  ['dependency_install_ran', /\b(?:npm install|npm ci)\s+(?:ran|executed|completed|succeeded)\b/i],
  ['package_lock_mutation', /\bpackage-lock(?:\.json)?\s+(?:was\s+)?(?:mutated|updated|changed|rewritten)\b/i],
  ['tools_installed_claim', /\bBatch 1 tools (?:are|were|have been) installed\b/i],
  ['tools_proven_claim', /\bBatch 1 tools (?:are|were|have been) proven\b/i],
  ['tool_execution_true', /\btoolExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['route_execution_true', /\brouteExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['worker_execution_true', /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['provider_execution_true', /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['media_processing_true', /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_write_true', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_true', /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i],
  ['public_artifact_true', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i],
  ['signed_url_truth_true', /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i],
  ['raw_prompt_true', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i],
  [
    'secret_material',
    new RegExp(
      String.raw`\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|` +
        'X-' +
        String.raw`Goog-Signature=|X-` +
        String.raw`Amz-Signature=)\b`,
      'i',
    ),
  ],
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

function isAllowedDependencyBaselineRepair() {
  if (!existsSync(dependencyBaselineRepairDecisionPath)) return false
  const repairDecision = readJson(dependencyBaselineRepairDecisionPath)
  if (repairDecision?.decision !== expectedDependencyBaselineRepairDecision) return false

  const before = JSON.parse(
    execFileSync('git', ['show', 'HEAD:package-lock.json'], {
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
      encoding: 'utf8',
    }),
  )
  const after = JSON.parse(readFileSync('package-lock.json', 'utf8'))
  const topLevelKeys = new Set([...Object.keys(before), ...Object.keys(after)].filter((key) => key !== 'packages'))
  for (const key of topLevelKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) return false
  }

  const beforePackages = before.packages ?? {}
  const afterPackages = after.packages ?? {}
  const keys = new Set([...Object.keys(beforePackages), ...Object.keys(afterPackages)])
  const changedKeys = [...keys].filter((key) => JSON.stringify(beforePackages[key]) !== JSON.stringify(afterPackages[key])).sort()
  return JSON.stringify(changedKeys) === JSON.stringify([...dependencyBaselineRepairPackageKeys].sort())
}

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const sourceAudit = existsSync(requiredDocs[0]) ? readJson(requiredDocs[0]) : undefined
const candidateReview = existsSync(requiredDocs[1]) ? readJson(requiredDocs[1]) : undefined
const dependencyBaseline = existsSync(requiredDocs[3]) ? readJson(requiredDocs[3]) : undefined
const scopePolicy = existsSync(requiredDocs[5]) ? readJson(requiredDocs[5]) : undefined
const proofPlan = existsSync(requiredDocs[9]) ? readJson(requiredDocs[9]) : undefined
const blockerRegister = existsSync(requiredDocs[11]) ? readJson(requiredDocs[11]) : undefined
const decision = existsSync(requiredDocs[13]) ? readJson(requiredDocs[13]) : undefined
const readiness = existsSync(requiredDocs[15]) ? readJson(requiredDocs[15]) : undefined
const manifest = existsSync(requiredDocs[16]) ? readJson(requiredDocs[16]) : undefined

for (const document of [sourceAudit, scopePolicy, decision, readiness]) {
  if (!document) continue
  for (const flag of falseScopeFlags) {
    if (document.executionScope?.[flag] !== false) failures.push(`${document.schema ?? 'document'}:${flag}_not_false`)
  }
}

if (sourceAudit) {
  if (sourceAudit.decision !== expectedDecision) failures.push(`source_audit_decision:${sourceAudit.decision}`)
  if (sourceAudit.supabaseClassification?.updateRequired !== 'no write') failures.push('source_audit_supabase_update_required_not_no_write')
  if (sourceAudit.supabaseClassification?.environmentTouched !== 'none') failures.push('source_audit_supabase_environment_not_none')
  if (sourceAudit.supabaseClassification?.sqlExecuted !== 'none') failures.push('source_audit_sql_not_none')
  if (sourceAudit.supabaseClassification?.migrationDeployed !== 'no') failures.push('source_audit_migration_not_no')
  for (const pr of ['416', '412', '407', '402', '399', '394', '388', '387']) {
    const entry = sourceAudit.prEvidence?.find((item) => String(item.number) === pr)
    if (entry?.state !== 'MERGED' || !entry?.mergedAt) failures.push(`source_audit_pr_not_merged:${pr}`)
  }
  for (const pr of ['384', '401', '417']) {
    const entry = sourceAudit.referenceOnlyPrEvidence?.find((item) => String(item.number) === pr)
    if (!entry?.referenceOnly || entry?.canonical === true) failures.push(`source_audit_reference_pr_not_reference_only:${pr}`)
  }
  if (sourceAudit.secretPolicy?.payloadAccessed !== false || sourceAudit.secretPolicy?.payloadPrinted !== false || sourceAudit.secretPolicy?.payloadCommitted !== false) {
    failures.push('source_audit_secret_policy_not_false')
  }
}

if (candidateReview) {
  if (candidateReview.decision !== expectedDecision) failures.push(`candidate_review_decision:${candidateReview.decision}`)
  const ids = new Set((candidateReview.candidates ?? []).map((candidate) => candidate.id))
  for (const id of requiredCandidateIds) {
    if (!ids.has(id)) failures.push(`missing_candidate:${id}`)
  }
  for (const candidate of candidateReview.candidates ?? []) {
    if (candidate.currentApprovalStatus !== 'conditionally_eligible_after_dependency_baseline_repair') {
      failures.push(`candidate_not_conditionally_eligible:${candidate.id}:${candidate.currentApprovalStatus}`)
    }
    if (candidate.approvedForInstallOrProofExecution !== false) failures.push(`candidate_execution_not_false:${candidate.id}`)
  }
}

if (dependencyBaseline) {
  if (dependencyBaseline.decision !== expectedDecision) failures.push(`dependency_baseline_decision:${dependencyBaseline.decision}`)
  if (dependencyBaseline.command !== 'npm ci --dry-run --ignore-scripts --no-audit --no-fund') failures.push('dependency_baseline_command_mismatch')
  if (dependencyBaseline.packageLockMutated !== false) failures.push('dependency_baseline_package_lock_mutated_not_false')
  if (dependencyBaseline.dependencyInstallOccurred !== false) failures.push('dependency_baseline_install_occurred_not_false')
  for (const blocker of exactBaselineBlockers) {
    if (!dependencyBaseline.blockers?.includes(blocker)) failures.push(`missing_dependency_blocker:${blocker}`)
  }
}

if (proofPlan) {
  if (proofPlan.approvedForExecution !== false) failures.push('proof_plan_execution_not_false')
  if (proofPlan.activeNextPrompt !== 'DEPENDENCY_BASELINE_REPAIR_BEFORE_TOOL_BATCH_1') failures.push(`proof_plan_next_prompt:${proofPlan.activeNextPrompt}`)
}

if (blockerRegister) {
  if (!blockerRegister.blockers?.some((blocker) => blocker.id === 'package_lock_sync_review')) failures.push('blocker_register_missing_package_lock_sync_review')
}

if (decision) {
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.readyForInstallProofExecution !== false) failures.push('decision_ready_for_execution_not_false')
  if (decision.nextPrompt !== 'DEPENDENCY_BASELINE_REPAIR_BEFORE_TOOL_BATCH_1') failures.push(`decision_next_prompt:${decision.nextPrompt}`)
}

if (readiness) {
  if (readiness.readyForInstallProofExecution !== false) failures.push('readiness_ready_for_execution_not_false')
  if (readiness.docsDiagnosticsComplete !== true) failures.push('readiness_docs_diagnostics_not_true')
  if (readiness.dependencyBaselineReady !== false) failures.push('readiness_dependency_baseline_not_false')
}

if (manifest) {
  if (manifest.publicArtifactsCreated !== false) failures.push('manifest_public_artifacts_not_false')
  if (manifest.signedUrlsCreated !== false) failures.push('manifest_signed_urls_not_false')
  if (manifest.artifacts?.some((artifact) => artifact.public === true || artifact.signedUrl === true)) failures.push('manifest_public_or_signed_artifact')
}

const packageJson = readJson('package.json')
if (packageJson?.scripts?.['open-source-tool-stack:batch-1:approval:diagnostics'] !== 'node scripts/validation/open-source-tool-stack-batch-1-approval-diagnostics.mjs') {
  failures.push('missing_package_script:open-source-tool-stack:batch-1:approval:diagnostics')
}

try {
  const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
  if (packageLockStatus && !isAllowedDependencyBaselineRepair()) failures.push(`package_lock_changed:${packageLockStatus}`)
} catch (error) {
  failures.push(`package_lock_status_failed:${error.message}`)
}

if (failures.length > 0) {
  console.error('Open-source tool stack Batch 1 approval diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Open-source tool stack Batch 1 approval diagnostics passed.')
console.log(`Decision: ${expectedDecision}`)
console.log('Next prompt: DEPENDENCY_BASELINE_REPAIR_BEFORE_TOOL_BATCH_1')
