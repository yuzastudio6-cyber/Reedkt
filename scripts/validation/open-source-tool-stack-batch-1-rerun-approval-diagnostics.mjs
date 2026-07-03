import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const expectedDecision = 'approved_for_future_open_source_tool_stack_batch_1_install_proof_execution'
const expectedNextPrompt = 'OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1'

const requiredDocs = [
  'docs/open-source-tool-stack/batch-1-rerun/source-of-truth-audit.json',
  'docs/open-source-tool-stack/batch-1-rerun/dependency-baseline-revalidation.json',
  'docs/open-source-tool-stack/batch-1-rerun/dependency-baseline-revalidation.md',
  'docs/open-source-tool-stack/batch-1-rerun/batch-1-candidate-approval-rerun.json',
  'docs/open-source-tool-stack/batch-1-rerun/batch-1-candidate-approval-rerun.md',
  'docs/open-source-tool-stack/batch-1-rerun/future-execution-scope.json',
  'docs/open-source-tool-stack/batch-1-rerun/future-execution-scope.md',
  'docs/open-source-tool-stack/batch-1-rerun/synthetic-fixture-plan.json',
  'docs/open-source-tool-stack/batch-1-rerun/synthetic-fixture-plan.md',
  'docs/open-source-tool-stack/batch-1-rerun/e2e-proof-plan.json',
  'docs/open-source-tool-stack/batch-1-rerun/e2e-proof-plan.md',
  'docs/open-source-tool-stack/batch-1-rerun/blocker-register.json',
  'docs/open-source-tool-stack/batch-1-rerun/blocker-register.md',
  'docs/open-source-tool-stack/batch-1-rerun/batch-1-rerun-approval-decision.json',
  'docs/open-source-tool-stack/batch-1-rerun/batch-1-rerun-approval-decision.md',
  'docs/open-source-tool-stack/batch-1-rerun/validation-results.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-install-proof-execution-batch-1.md',
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

const requiredMergedPrs = ['427', '421', '416', '412', '407', '402', '399', '394', '388', '387']
const requiredReferenceOnlyPrs = ['423', '420', '417', '401', '384']

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

const forbiddenDependencyNames = ['duckdb', 'polars', 'ffmpeg', 'ffprobe', 'd3', 'echarts', 'vega', 'vega-lite']

const forbiddenPatterns = [
  ['production_enabled', /\bproduction\s+(?:is\s+)?(?:enabled|unlocked|approved|ready)\b/i],
  ['external_beta_enabled', /\bexternal beta\s+(?:is\s+)?(?:enabled|unlocked|approved|ready)\b/i],
  ['paid_production_enabled', /\bpaid production\s+(?:is\s+)?(?:enabled|unlocked|approved|ready)\b/i],
  ['dependency_install_claim', /\bdependencies?\s+(?:were|was|are|is|have been)\s+(?:installed|added)\b/i],
  ['package_lock_mutation_claim', /\bpackage-lock(?:\.json)?\s+(?:was|is|has been)\s+(?:mutated|updated|changed|rewritten)\b/i],
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

function stable(value) {
  return JSON.stringify(value)
}

function gitShowHead(path) {
  return execFileSync('git', ['show', `HEAD:${path}`], {
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  })
}

function assertExecutionScope(document, label) {
  for (const flag of falseScopeFlags) {
    if (document?.executionScope?.[flag] !== false) failures.push(`${label}:${flag}_not_false`)
  }
}

function assertSupabaseClassification(document, label) {
  if (document?.supabaseClassification?.updateRequired !== 'no write') failures.push(`${label}:supabase_update_required_not_no_write`)
  if (document?.supabaseClassification?.environmentTouched !== 'none') failures.push(`${label}:supabase_environment_not_none`)
  if (document?.supabaseClassification?.sqlExecuted !== 'none') failures.push(`${label}:sql_not_none`)
  if (document?.supabaseClassification?.migrationDeployed !== 'no') failures.push(`${label}:migration_not_no`)
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
const dependencyBaseline = existsSync(requiredDocs[1]) ? readJson(requiredDocs[1]) : undefined
const candidateReview = existsSync(requiredDocs[3]) ? readJson(requiredDocs[3]) : undefined
const futureScope = existsSync(requiredDocs[5]) ? readJson(requiredDocs[5]) : undefined
const fixturePlan = existsSync(requiredDocs[7]) ? readJson(requiredDocs[7]) : undefined
const proofPlan = existsSync(requiredDocs[9]) ? readJson(requiredDocs[9]) : undefined
const blockerRegister = existsSync(requiredDocs[11]) ? readJson(requiredDocs[11]) : undefined
const decision = existsSync(requiredDocs[13]) ? readJson(requiredDocs[13]) : undefined

for (const [label, document] of [
  ['source_audit', sourceAudit],
  ['dependency_baseline', dependencyBaseline],
  ['candidate_review', candidateReview],
  ['future_scope', futureScope],
  ['fixture_plan', fixturePlan],
  ['proof_plan', proofPlan],
  ['blocker_register', blockerRegister],
  ['decision', decision],
]) {
  if (!document) continue
  if (document.decision !== expectedDecision) failures.push(`${label}:decision:${document.decision}`)
  assertExecutionScope(document, label)
}

assertSupabaseClassification(sourceAudit, 'source_audit')
assertSupabaseClassification(dependencyBaseline, 'dependency_baseline')
assertSupabaseClassification(decision, 'decision')

if (sourceAudit) {
  if (sourceAudit.sourceHeadSha !== 'aae8567b5f28bc4349d60461c0748fe6b91ddff4') failures.push(`source_audit_source_sha:${sourceAudit.sourceHeadSha}`)
  for (const pr of requiredMergedPrs) {
    const entry = sourceAudit.prEvidence?.find((item) => String(item.number) === pr)
    if (entry?.state !== 'MERGED' || !entry?.mergedAt) failures.push(`source_audit_pr_not_merged:${pr}`)
  }
  for (const pr of requiredReferenceOnlyPrs) {
    const entry = sourceAudit.referenceOnlyPrEvidence?.find((item) => String(item.number) === pr)
    if (!entry?.referenceOnly || entry?.canonical === true) failures.push(`source_audit_reference_pr_not_reference_only:${pr}`)
  }
  if (sourceAudit.secretPolicy?.payloadAccessed !== false || sourceAudit.secretPolicy?.payloadPrinted !== false || sourceAudit.secretPolicy?.payloadCommitted !== false) {
    failures.push('source_audit_secret_policy_not_false')
  }
  if (sourceAudit.dependencyBaselineEvidence?.decision !== 'dependency_baseline_repair_passed_ready_for_batch_1_approval_rerun') {
    failures.push(`source_audit_dependency_decision:${sourceAudit.dependencyBaselineEvidence?.decision}`)
  }
}

if (dependencyBaseline) {
  if (dependencyBaseline.dependencyBaselineReady !== true) failures.push('dependency_baseline_not_ready')
  if (dependencyBaseline.packageLockMutationAllowedInThisPacket !== false) failures.push('dependency_baseline_package_lock_mutation_packet_not_false')
  if (dependencyBaseline.packageLockMutationAllowedInFutureBatch1Execution !== false) failures.push('dependency_baseline_package_lock_mutation_future_not_false')
  if (dependencyBaseline.dependencyInstallAllowedInThisPacket !== false) failures.push('dependency_baseline_install_packet_not_false')
  if (dependencyBaseline.dependencyInstallAllowedInFutureBatch1Execution !== false) failures.push('dependency_baseline_install_future_not_false')
  if (dependencyBaseline.newToolDependenciesAdded !== false) failures.push('dependency_baseline_new_tool_dependencies_not_false')
}

if (candidateReview) {
  if (candidateReview.actualExecutionAuthorizedByThisPacket !== false) failures.push('candidate_review_actual_execution_not_false')
  if (candidateReview.approvedCandidateCount !== requiredCandidateIds.length) failures.push(`candidate_count:${candidateReview.approvedCandidateCount}`)
  const candidates = candidateReview.candidates ?? []
  const ids = new Set(candidates.map((candidate) => candidate.id))
  for (const id of requiredCandidateIds) {
    if (!ids.has(id)) failures.push(`missing_candidate:${id}`)
  }
  for (const candidate of candidates) {
    if (!requiredCandidateIds.includes(candidate.id)) failures.push(`unexpected_candidate:${candidate.id}`)
    if (candidate.approvedForFutureInstallProofExecution !== true) failures.push(`candidate_future_approval_not_true:${candidate.id}`)
    if (candidate.approvedForCurrentExecution !== false) failures.push(`candidate_current_execution_not_false:${candidate.id}`)
    if (candidate.packageLockMutationAllowed !== false) failures.push(`candidate_package_lock_mutation_not_false:${candidate.id}`)
    if (candidate.dependencyInstallAllowed !== false) failures.push(`candidate_dependency_install_not_false:${candidate.id}`)
  }
}

if (futureScope) {
  if (futureScope.futureExecutionRequiresSeparatePrompt !== true) failures.push('future_scope_separate_prompt_not_true')
  if (futureScope.futureExecutionPrompt !== expectedNextPrompt) failures.push(`future_scope_next_prompt:${futureScope.futureExecutionPrompt}`)
  const commands = futureScope.approvedFutureCommands ?? []
  for (const id of requiredCandidateIds) {
    if (!commands.some((command) => command.candidateId === id)) failures.push(`future_scope_missing_command:${id}`)
  }
  for (const command of commands) {
    if (command.dependencyInstallAllowed === true) failures.push(`future_command_install_true:${command.candidateId}`)
    if (command.packageLockMutationAllowed === true) failures.push(`future_command_lock_mutation_true:${command.candidateId}`)
    if (command.mediaProcessingAllowed === true) failures.push(`future_command_media_processing_true:${command.candidateId}`)
  }
}

if (fixturePlan) {
  if (fixturePlan.actualFixtureExecutionAuthorized !== false) failures.push('fixture_plan_actual_execution_not_false')
  if ((fixturePlan.fixtures ?? []).length !== requiredCandidateIds.length) failures.push(`fixture_count:${fixturePlan.fixtures?.length}`)
  if (fixturePlan.fixtureSafety?.usesSecrets !== false || fixturePlan.fixtureSafety?.usesSignedUrls !== false || fixturePlan.fixtureSafety?.usesRealMedia !== false) {
    failures.push('fixture_safety_not_false')
  }
}

if (proofPlan) {
  if (proofPlan.actualProofExecutionAuthorized !== false) failures.push('proof_plan_actual_execution_not_false')
  if (proofPlan.requiresSeparateExecutionApproval !== true) failures.push('proof_plan_separate_approval_not_true')
  if ((proofPlan.futureProofPlan ?? []).length !== requiredCandidateIds.length) failures.push(`proof_plan_count:${proofPlan.futureProofPlan?.length}`)
}

if (blockerRegister) {
  if (!Array.isArray(blockerRegister.activeBlockers) || blockerRegister.activeBlockers.length !== 0) failures.push('blocker_register_active_blockers_not_empty')
  if (!blockerRegister.resolvedBlockers?.some((blocker) => blocker.id === 'package_lock_sync_review')) failures.push('blocker_register_missing_resolved_package_lock')
}

if (decision) {
  if (decision.readyForFutureInstallProofExecution !== true) failures.push('decision_future_ready_not_true')
  if (decision.actualExecutionAuthorizedByThisPacket !== false) failures.push('decision_actual_execution_not_false')
  if (decision.docsDiagnosticsComplete !== true) failures.push('decision_docs_diagnostics_not_true')
  if (decision.dependencyBaselineReady !== true) failures.push('decision_dependency_baseline_not_true')
  if (decision.nextPrompt !== expectedNextPrompt) failures.push(`decision_next_prompt:${decision.nextPrompt}`)
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['open-source-tool-stack:batch-1-rerun:approval:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-batch-1-rerun-approval-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:batch-1-rerun:approval:diagnostics')
}

try {
  const headPackageJson = JSON.parse(gitShowHead('package.json'))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const current = packageJson?.[section] ?? {}
    const head = headPackageJson?.[section] ?? {}
    for (const name of forbiddenDependencyNames) {
      if (current[name] && current[name] !== head[name]) failures.push(`new_forbidden_dependency:${section}:${name}`)
    }
  }
} catch (error) {
  failures.push(`package_json_dependency_compare_failed:${error.message}`)
}

try {
  const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
  if (packageLockStatus) failures.push(`package_lock_changed:${packageLockStatus}`)
} catch (error) {
  failures.push(`package_lock_status_failed:${error.message}`)
}

if (failures.length > 0) {
  console.error('Open-source tool stack Batch 1 rerun approval diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Open-source tool stack Batch 1 rerun approval diagnostics passed.')
console.log(`Decision: ${expectedDecision}`)
console.log(`Next prompt: ${expectedNextPrompt}`)
