import fs from 'node:fs';
import path from 'node:path';

const PHASE = 'TOOL-ROUTE-EXECUTION-UNLOCK-6';
const REPORT_DIR = 'docs/activation-tool-route-execution-unlock-6-dry-run-pass-review-reports';
const DECISION = 'tool_route_dry_run_pass_review_recorded_with_warnings_ready_for_local_fixture_planning';
const NEXT_PROMPT = 'TOOL-ROUTE-EXECUTION-UNLOCK-7: tool-route local fixture plan, no execution';

const EXPECTED_REPORTS = [
  'tool_route_dry_run_pass_review_decision.json',
  'tool_route_dry_run_pass_review_source_of_truth_audit.json',
  'tool_route_gate_status_evidence_acceptance.json',
  'tool_route_owner_approval_evidence_acceptance.json',
  'tool_route_dry_run_validation_evidence_acceptance.json',
  'tool_route_dry_run_contract_evidence_acceptance.json',
  'tool_route_dry_run_plan_evidence_acceptance.json',
  'tool_route_repo_audit_evidence_acceptance.json',
  'tool_route_tool_study_evidence_acceptance.json',
  'tool_route_dependency_validation_evidence_acceptance.json',
  'tool_route_dry_run_passed_claim_review.json',
  'tool_route_generated_local_fixture_not_claimed_register.json',
  'tool_route_runtime_execution_blocker_register.json',
  'tool_route_next_gate_recommendation.json',
  'tool_route_no_execution_policy.json',
  'tool_route_dry_run_pass_review_summary.json',
];

const REQUIRED_DOCS = [
  'docs/tool-route-execution-unlock-6-dry-run-pass-review.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-7-local-fixture-plan.md',
];

const SOURCE_DOCS = [
  'docs/activation-tool-route-execution-unlock-5-dry-run-gate-status-reports/tool_route_dry_run_gate_status_decision.json',
  'docs/activation-tool-route-execution-unlock-5-dry-run-gate-status-reports/tool_route_dry_run_gate_status_summary.json',
  'docs/activation-tool-route-execution-unlock-5-dry-run-gate-status-reports/tool_route_dependency_evidence_rollup.json',
  'docs/activation-tool-route-execution-unlock-4-owner-approval-reports/tool_route_owner_approval_decision.json',
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_decision.json',
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_case_coverage.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-reports/tool_route_dry_run_contract_decision.json',
  'docs/activation-tool-route-execution-unlock-1-dry-run-plan-reports/tool_route_dry_run_plan_decision.json',
  'docs/activation-tool-route-execution-unlock-0-repo-audit-reports/tool_route_repo_audit_decision.json',
  'docs/activation-tool-study-pending-owners-0-reports/tool_study_decision.json',
  'docs/tool-studies/ai-tools-creative-graphics-tool-study.md',
  'docs/tool-studies/track-a-render-export-tool-study.md',
  'docs/tool-studies/track-b-media-processing-tool-study.md',
  'docs/tool-studies/sound-music-audio-tool-study.md',
  'docs/activation-worker-runtime-unlock-4-local-fixture-plan-reports/worker_runtime_local_fixture_plan_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json',
];

const ALLOWED_DECISIONS = [
  'tool_route_dry_run_pass_review_recorded_ready_for_local_fixture_planning',
  'tool_route_dry_run_pass_review_recorded_with_warnings_ready_for_local_fixture_planning',
  'tool_route_dry_run_pass_review_recorded_without_dry_run_pass_claim',
  'tool_route_dry_run_pass_review_blocked_missing_gate_status',
  'tool_route_dry_run_pass_review_blocked_missing_owner_approval',
  'tool_route_dry_run_pass_review_blocked_missing_validation_evidence',
  'tool_route_dry_run_pass_review_blocked_dry_run_pass_claim_ambiguity',
  'tool_route_dry_run_pass_review_blocked_runtime_gate_ambiguity',
  'tool_route_dry_run_pass_review_blocked_source_of_truth_conflict',
];

const FALSE_RUNTIME_FLAGS = [
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'jobDispatchAllowed',
  'jobClaimAllowed',
  'jobLeaseAllowed',
  'queueEnqueueAllowed',
  'providerExecutionAllowed',
  'modelCallAllowed',
  'supabaseWriteAllowed',
  'sqlExecutionAllowed',
  'migrationAllowed',
  'storageWriteAllowed',
  'signedUrlCreationAllowed',
  'signedUrlAsSourceOfTruthAllowed',
  'publicArtifactCreationAllowed',
  'publicArtifactAllowed',
  'mediaExecutionAllowed',
  'browserCaptureAllowed',
  'mapExecutionAllowed',
  'dockerExecutionAllowed',
  'cloudRunExecutionAllowed',
  'cloudBuildExecutionAllowed',
  'creditMutationAllowed',
  'stripeMutationAllowed',
  'internalBetaUnlockAllowed',
  'externalBetaUnlockAllowed',
  'paidProductionUnlockAllowed',
  'productionUnlockAllowed',
  'demucsExecutionAllowed',
  'trackARenderExecutionAllowed',
  'trackBMediaExecutionAllowed',
  'rawPromptExecutionAllowed',
  'dependencyMutationAllowed',
  'toolExecutionReady',
  'routeExecutionReady',
  'workerExecutionReady',
  'providerExecutionReady',
  'supabasePersistenceReady',
  'betaReady',
  'externalBetaReady',
  'paidProductionReady',
  'productionReady',
  'realExecutionReady',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
];

const FORBIDDEN_TEXT_PATTERNS = [
  { label: 'authorization header', pattern: /authorization\s*[:=]\s*bearer/i },
  { label: 'jwt', pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { label: 'db url', pattern: new RegExp('postgres' + '(?:ql)?://' + '|database' + '_url', 'i') },
  { label: 'supabase project url', pattern: /https?:\/\/[a-z0-9-]+\.supabase\.co/i },
  { label: 'service role value', pattern: /service[_-]?role[_-]?key\s*[:=]\s*['"][^'"]+/i },
  { label: 'anon key value', pattern: /anon[_-]?key\s*[:=]\s*['"][^'"]+/i },
  { label: 'provider key value', pattern: /(api|provider|dashscope|deepseek)[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{16,}/i },
  { label: 'private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  { label: 'signed url marker', pattern: new RegExp('x-goog-' + 'signature|x-amz-' + 'signature|signature' + '=', 'i') },
  { label: 'raw provider output assignment', pattern: /rawProviderOutput\s*[:=]\s*['"][^'"]+/i },
  { label: 'env file marker', pattern: /(^|\/)\.env(\.|$)/i },
  { label: 'unsafe generated fixture pass claim', pattern: /generatedLocalFixturePassedClaimed\s*[:=]\s*true/i },
  { label: 'unsafe dry-run pass claim', pattern: /dryRunPassedClaimed\s*[:=]\s*true/i },
];

const FORBIDDEN_RUNTIME_IMPORT_PATTERNS = [
  /from\s+['"].*server\/workers/i,
  /from\s+['"].*supabase/i,
  /from\s+['"].*provider/i,
  /from\s+['"].*route/i,
  /require\(['"].*server\/workers/i,
  /require\(['"].*supabase/i,
  /require\(['"].*provider/i,
  /require\(['"].*route/i,
  /from\s+['"]node:child_process['"]/i,
  /require\(['"]node:child_process['"]\)/i,
  /\bfetch\s*\(/i,
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function flattenValues(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) flattenValues(item, visitor);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      visitor(key, child);
      flattenValues(child, visitor);
    }
  }
}

function assertRuntimeFlagsFalse(label, value) {
  flattenValues(value, (key, child) => {
    if (FALSE_RUNTIME_FLAGS.includes(key)) {
      assert(child === false, `${label} has unsafe true flag ${key}`);
    }
  });
}

function assertNoForbiddenText(root, relativePath) {
  const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
  for (const { label, pattern } of FORBIDDEN_TEXT_PATTERNS) {
    assert(!pattern.test(text), `${relativePath} contains forbidden ${label}`);
  }
}

function assertNoForbiddenRuntimeImports(root, relativePath) {
  const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
  for (const pattern of FORBIDDEN_RUNTIME_IMPORT_PATTERNS) {
    assert(!pattern.test(text), `${relativePath} contains forbidden runtime import/reference`);
  }
}

function validate(root) {
  assert(fs.existsSync(path.join(root, REPORT_DIR)), `${REPORT_DIR} is missing`);
  for (const report of EXPECTED_REPORTS) {
    assert(fs.existsSync(path.join(root, REPORT_DIR, report)), `${report} is missing`);
  }
  for (const doc of [...REQUIRED_DOCS, ...SOURCE_DOCS]) {
    assert(fs.existsSync(path.join(root, doc)), `${doc} is missing`);
  }

  const packageJson = readJson(root, 'package.json');
  for (const script of [
    'tool-route-execution-unlock-6:diagnostics',
    'tool-route-execution-unlock-6:report',
    'tool-route-execution-unlock-6:summary',
  ]) {
    assert(packageJson.scripts?.[script], `Missing package script: ${script}`);
  }

  const decision = readJson(root, `${REPORT_DIR}/tool_route_dry_run_pass_review_decision.json`);
  const sourceAudit = readJson(root, `${REPORT_DIR}/tool_route_dry_run_pass_review_source_of_truth_audit.json`);
  const gateStatus = readJson(root, `${REPORT_DIR}/tool_route_gate_status_evidence_acceptance.json`);
  const ownerApproval = readJson(root, `${REPORT_DIR}/tool_route_owner_approval_evidence_acceptance.json`);
  const validationEvidence = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_evidence_acceptance.json`);
  const contractEvidence = readJson(root, `${REPORT_DIR}/tool_route_dry_run_contract_evidence_acceptance.json`);
  const planEvidence = readJson(root, `${REPORT_DIR}/tool_route_dry_run_plan_evidence_acceptance.json`);
  const repoAudit = readJson(root, `${REPORT_DIR}/tool_route_repo_audit_evidence_acceptance.json`);
  const toolStudy = readJson(root, `${REPORT_DIR}/tool_route_tool_study_evidence_acceptance.json`);
  const dependency = readJson(root, `${REPORT_DIR}/tool_route_dependency_validation_evidence_acceptance.json`);
  const claimReview = readJson(root, `${REPORT_DIR}/tool_route_dry_run_passed_claim_review.json`);
  const generatedRegister = readJson(root, `${REPORT_DIR}/tool_route_generated_local_fixture_not_claimed_register.json`);
  const runtimeBlocker = readJson(root, `${REPORT_DIR}/tool_route_runtime_execution_blocker_register.json`);
  const nextGate = readJson(root, `${REPORT_DIR}/tool_route_next_gate_recommendation.json`);
  const noExecution = readJson(root, `${REPORT_DIR}/tool_route_no_execution_policy.json`);
  const summary = readJson(root, `${REPORT_DIR}/tool_route_dry_run_pass_review_summary.json`);

  assert(decision.phase === PHASE, 'decision phase mismatch');
  assert(ALLOWED_DECISIONS.includes(decision.decision), `unexpected decision ${decision.decision}`);
  assert(decision.decision === DECISION, `expected ${DECISION}, got ${decision.decision}`);
  assert(decision.nextPrompt === NEXT_PROMPT, 'next prompt mismatch');
  assert(decision.reviewScope === 'metadata_only_pass_review', 'review scope mismatch');
  assert(decision.dryRunPassReviewRecorded === true, 'pass review must be recorded');
  assert(decision.readyForLocalFixturePlanning === true, 'local fixture planning readiness expected');
  assert(decision.dryRunPassedClaimed === false, 'dry-run pass must not be claimed');
  assert(decision.dryRunPassedClaimStatus === 'not_claimed', 'dry-run pass claim status mismatch');
  assert(decision.generatedLocalFixturePassedClaimed === false, 'generated local fixture pass must not be claimed');
  assert(sourceAudit.githubMergeHygiene?.pr392Merged === true, 'PR #392 must be merged');
  assert(
    sourceAudit.githubMergeHygiene?.pr392MergeCommit === 'ac26f53d80c74e96d48371c1c7e6d5de7060fa41',
    'PR #392 merge commit mismatch',
  );
  assert(sourceAudit.sourceOfTruthConflictsFound === false, 'source audit reports conflicts');
  assert(gateStatus.accepted === true, 'gate status evidence must be accepted');
  assert(ownerApproval.accepted === true, 'owner approval evidence must be accepted');
  assert(ownerApproval.approvesToolExecution === false, 'owner approval must not unlock tool execution');
  assert(validationEvidence.accepted === true, 'validation evidence must be accepted');
  assert(validationEvidence.caseCount === 18, 'validation case count mismatch');
  assert(validationEvidence.metadataAcceptedFixtureCount === 10, 'metadata accepted fixture count mismatch');
  assert(validationEvidence.failClosedFixtureCount === 8, 'fail-closed fixture count mismatch');
  assert(contractEvidence.accepted === true, 'contract evidence must be accepted');
  assert(contractEvidence.caseCount === 18, 'contract case count mismatch');
  assert(planEvidence.accepted === true, 'plan evidence must be accepted');
  assert(planEvidence.syntheticCaseCount === 18, 'plan synthetic case count mismatch');
  assert(repoAudit.accepted === true, 'repo audit evidence must be accepted');
  assert(toolStudy.accepted === true, 'tool study evidence must be accepted');
  assert(toolStudy.pendingOwnerStudiesCompleted?.length === 4, 'pending owner study count mismatch');
  assert(toolStudy.completedOwnerStudiesDuplicated === false, 'completed owner studies must not be duplicated');
  assert(dependency.accepted === true, 'dependency evidence must be accepted');
  assert(
    dependency.handoffDecision === 'dependency_validation_passed_with_inherited_readiness_blockers_ready_to_merge',
    'dependency handoff decision mismatch',
  );
  assert(dependency.packageLockChanged === false, 'package lock must not be changed');
  assert(claimReview.reviewAttempted === true, 'dry-run pass claim review missing');
  assert(claimReview.metadataEvidenceSufficientForPassReview === true, 'pass-review evidence should be sufficient');
  assert(claimReview.dryRunPassedClaimed === false, 'claim review must not claim dry-run pass');
  assert(claimReview.dryRunPassedClaimStatus === 'not_claimed', 'claim review status mismatch');
  assert(generatedRegister.generatedLocalFixturePassedClaimed === false, 'generated fixture pass must remain unclaimed');
  assert(generatedRegister.generatedAssetsCreated === false, 'generated assets must not be created');
  assert(runtimeBlocker.status === 'all_runtime_gates_blocked', 'runtime blocker status mismatch');
  assert(runtimeBlocker.blockedScopes.length >= 15, 'runtime blocker register incomplete');
  assert(nextGate.nextPrompt === NEXT_PROMPT, 'next gate prompt mismatch');
  assert(noExecution.policyStatus === 'all_runtime_gates_closed', 'no-execution policy mismatch');
  assert(noExecution.supabaseClassification?.supabaseUpdateRequired === false, 'Supabase update must not be required');
  assert(summary.decision === DECISION, 'summary decision mismatch');
  assert(summary.nextPrompt === NEXT_PROMPT, 'summary next prompt mismatch');
  assert(summary.acceptedEvidence?.pr392GateStatus === true, 'summary must accept PR #392');
  assert(summary.coverage?.caseCount === 18, 'summary case count mismatch');
  assert(summary.dryRunPassedClaimed === false, 'summary must not claim dry-run pass');
  assert(summary.generatedLocalFixturePassedClaimed === false, 'summary must not claim generated fixture pass');

  for (const report of EXPECTED_REPORTS) {
    const relativePath = `${REPORT_DIR}/${report}`;
    assertRuntimeFlagsFalse(report, readJson(root, relativePath));
    assertNoForbiddenText(root, relativePath);
  }
  for (const doc of REQUIRED_DOCS) {
    assertNoForbiddenText(root, doc);
  }
  assertNoForbiddenRuntimeImports(root, 'scripts/validation/tool-route-execution-unlock-6-dry-run-pass-review-diagnostics.mjs');

  return {
    status: 'passed',
    phase: PHASE,
    decision: decision.decision,
    dryRunPassReviewRecorded: decision.dryRunPassReviewRecorded,
    readyForLocalFixturePlanning: decision.readyForLocalFixturePlanning,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
    caseCount: validationEvidence.caseCount,
    metadataAcceptedFixtureCount: validationEvidence.metadataAcceptedFixtureCount,
    failClosedFixtureCount: validationEvidence.failClosedFixtureCount,
    expectedReports: EXPECTED_REPORTS.length,
    runtimeFlagsClosed: true,
    dependencyValidationHandoffAccepted: dependency.accepted,
    nextPrompt: decision.nextPrompt,
  };
}

try {
  const result = validate(process.cwd());
  const mode = process.argv.includes('--report')
    ? 'report'
    : process.argv.includes('--summary')
      ? 'summary'
      : 'diagnostics';
  console.log(JSON.stringify({ mode, ...result }, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        status: 'failed',
        phase: PHASE,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
