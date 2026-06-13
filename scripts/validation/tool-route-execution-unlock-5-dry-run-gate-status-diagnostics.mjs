import fs from 'node:fs';
import path from 'node:path';

const PHASE = 'TOOL-ROUTE-EXECUTION-UNLOCK-5';
const REPORT_DIR = 'docs/activation-tool-route-execution-unlock-5-dry-run-gate-status-reports';
const DECISION =
  'tool_route_dry_run_gate_status_recorded_with_warnings_ready_for_dry_run_pass_review';
const NEXT_PROMPT =
  'TOOL-ROUTE-EXECUTION-UNLOCK-6: tool-route dry-run pass review, no execution';

const EXPECTED_REPORTS = [
  'tool_route_dry_run_gate_status_decision.json',
  'tool_route_dry_run_gate_status_source_of_truth_audit.json',
  'tool_route_owner_approval_rollup.json',
  'tool_route_dry_run_validation_evidence_rollup.json',
  'tool_route_dry_run_contract_evidence_rollup.json',
  'tool_route_dry_run_plan_evidence_rollup.json',
  'tool_route_repo_audit_evidence_rollup.json',
  'tool_route_tool_study_evidence_rollup.json',
  'tool_route_dependency_evidence_rollup.json',
  'tool_route_gate_status_blocker_register.json',
  'tool_route_dry_run_pass_not_claimed_register.json',
  'tool_route_generated_local_fixture_not_claimed_register.json',
  'tool_route_runtime_blocker_status.json',
  'tool_route_owner_handoff_status.json',
  'tool_route_gate_status_no_execution_policy.json',
  'tool_route_dry_run_gate_status_summary.json',
];

const REQUIRED_DOCS = [
  'docs/tool-route-execution-unlock-5-dry-run-gate-status.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-6-dry-run-pass-review.md',
];

const SOURCE_DOCS = [
  'docs/activation-tool-route-execution-unlock-4-owner-approval-reports/tool_route_owner_approval_decision.json',
  'docs/activation-tool-route-execution-unlock-4-owner-approval-reports/tool_route_owner_approval_summary.json',
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_decision.json',
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_summary.json',
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_case_coverage.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-reports/tool_route_dry_run_contract_decision.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-reports/tool_route_dry_run_contract_summary.json',
  'docs/activation-tool-route-execution-unlock-1-dry-run-plan-reports/tool_route_dry_run_plan_decision.json',
  'docs/activation-tool-route-execution-unlock-0-repo-audit-reports/tool_route_repo_audit_decision.json',
  'docs/activation-tool-study-pending-owners-0-reports/tool_study_decision.json',
  'docs/tool-studies/ai-tools-creative-graphics-tool-study.md',
  'docs/tool-studies/track-a-render-export-tool-study.md',
  'docs/tool-studies/track-b-media-processing-tool-study.md',
  'docs/tool-studies/sound-music-audio-tool-study.md',
  'docs/activation-worker-runtime-unlock-4-local-fixture-plan-reports/worker_runtime_local_fixture_plan_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
  'docs/activation-product-internal-testing-session-0-reports/session_0_decision.json',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json',
];

const ALLOWED_DECISIONS = [
  'tool_route_dry_run_gate_status_recorded_ready_for_dry_run_pass_review',
  'tool_route_dry_run_gate_status_recorded_with_warnings_ready_for_dry_run_pass_review',
  'tool_route_dry_run_gate_status_blocked_missing_owner_approval',
  'tool_route_dry_run_gate_status_blocked_missing_validation_evidence',
  'tool_route_dry_run_gate_status_blocked_missing_dependency_handoff',
  'tool_route_dry_run_gate_status_blocked_runtime_gate_ambiguity',
  'tool_route_dry_run_gate_status_blocked_source_of_truth_conflict',
];

const FORBIDDEN_DECISIONS = [
  'dry' + '_run_passed',
  'generated' + '_local_fixture_passed',
  'tool_route_execution_ready',
  'route_execution_ready',
  'tool_execution_ready',
  'worker_execution_ready',
  'staging_ready',
  'production_ready',
  'beta_ready',
  'external_beta_ready',
  'paid_production_ready',
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
  'rawProviderOutputPersisted',
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
  'runtimeReady',
  'resourcesCreated',
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
  { label: 'snake-case dry-run pass claim', pattern: new RegExp('dry' + '_run_passed', 'i') },
  { label: 'snake-case generated fixture pass claim', pattern: new RegExp('generated' + '_local_fixture_passed', 'i') },
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
    'tool-route-execution-unlock-5:diagnostics',
    'tool-route-execution-unlock-5:report',
    'tool-route-execution-unlock-5:summary',
  ]) {
    assert(packageJson.scripts?.[script], `Missing package script: ${script}`);
  }

  const decision = readJson(root, `${REPORT_DIR}/tool_route_dry_run_gate_status_decision.json`);
  const summary = readJson(root, `${REPORT_DIR}/tool_route_dry_run_gate_status_summary.json`);
  const sourceAudit = readJson(root, `${REPORT_DIR}/tool_route_dry_run_gate_status_source_of_truth_audit.json`);
  const ownerRollup = readJson(root, `${REPORT_DIR}/tool_route_owner_approval_rollup.json`);
  const validationRollup = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_evidence_rollup.json`);
  const contractRollup = readJson(root, `${REPORT_DIR}/tool_route_dry_run_contract_evidence_rollup.json`);
  const planRollup = readJson(root, `${REPORT_DIR}/tool_route_dry_run_plan_evidence_rollup.json`);
  const repoAuditRollup = readJson(root, `${REPORT_DIR}/tool_route_repo_audit_evidence_rollup.json`);
  const toolStudyRollup = readJson(root, `${REPORT_DIR}/tool_route_tool_study_evidence_rollup.json`);
  const dependencyRollup = readJson(root, `${REPORT_DIR}/tool_route_dependency_evidence_rollup.json`);
  const blockerRegister = readJson(root, `${REPORT_DIR}/tool_route_gate_status_blocker_register.json`);
  const dryRunNotClaimed = readJson(root, `${REPORT_DIR}/tool_route_dry_run_pass_not_claimed_register.json`);
  const generatedNotClaimed = readJson(root, `${REPORT_DIR}/tool_route_generated_local_fixture_not_claimed_register.json`);
  const runtimeBlocker = readJson(root, `${REPORT_DIR}/tool_route_runtime_blocker_status.json`);
  const ownerHandoff = readJson(root, `${REPORT_DIR}/tool_route_owner_handoff_status.json`);
  const noExecution = readJson(root, `${REPORT_DIR}/tool_route_gate_status_no_execution_policy.json`);

  assert(decision.phase === PHASE, 'decision phase mismatch');
  assert(ALLOWED_DECISIONS.includes(decision.decision), `unexpected decision ${decision.decision}`);
  assert(!FORBIDDEN_DECISIONS.includes(decision.decision), `forbidden decision ${decision.decision}`);
  assert(decision.decision === DECISION, `expected ${DECISION}, got ${decision.decision}`);
  assert(decision.nextPrompt === NEXT_PROMPT, 'next prompt mismatch');
  assert(decision.statusScope === 'gate_status_only', 'decision scope must be gate status only');
  assert(decision.ownerApprovalAccepted === true, 'owner approval must be accepted');
  assert(decision.readyForDryRunPassReview === true, 'dry-run pass review should be ready');
  assert(decision.dryRunPassedClaimed === false, 'dry-run pass must not be claimed');
  assert(decision.generatedLocalFixturePassedClaimed === false, 'generated local fixture pass must not be claimed');
  assert(decision.readyForToolExecution === false, 'tool execution readiness must remain false');
  assert(decision.readyForRouteExecution === false, 'route execution readiness must remain false');
  assert(decision.readyForWorkerExecution === false, 'worker execution readiness must remain false');
  assert(decision.readyForSupabasePersistence === false, 'Supabase persistence readiness must remain false');
  assert(decision.readyForBeta === false, 'beta readiness must remain false');
  assert(decision.readyForProduction === false, 'production readiness must remain false');

  assert(sourceAudit.pr385?.state === 'merged', 'PR #385 must be recorded as merged');
  assert(sourceAudit.pr385?.mergeCommit === '57ee230a7cec0a342b1738d1acb8a812935156cc', 'PR #385 merge commit mismatch');
  assert(sourceAudit.pr385?.approvalScope === 'next_gate_status_packet_only', 'PR #385 scope mismatch');
  assert(sourceAudit.sourceOfTruthConflictsFound === false, 'source audit reports conflicts');
  assert(sourceAudit.referencedHistoricalEvidence?.completedOwnerStudiesDuplicated === false, 'completed owner studies must not be duplicated');
  assert(ownerRollup.accepted === true, 'owner approval rollup must be accepted');
  assert(ownerRollup.approvesThisGateStatusPacket === true, 'owner rollup must approve this packet');
  assert(ownerRollup.approvesToolExecution === false, 'owner rollup must not approve tool execution');
  assert(validationRollup.accepted === true, 'validation evidence must be accepted');
  assert(validationRollup.caseCount === 18, 'validation case count mismatch');
  assert(validationRollup.metadataAcceptedFixtureCount === 10, 'metadata accepted fixture count mismatch');
  assert(validationRollup.failClosedFixtureCount === 8, 'fail-closed fixture count mismatch');
  assert(validationRollup.dryRunPassedClaimed === false, 'validation rollup claims dry-run pass');
  assert(contractRollup.accepted === true, 'contract evidence must be accepted');
  assert(contractRollup.caseCount === 18, 'contract case count mismatch');
  assert(planRollup.accepted === true, 'plan evidence must be accepted');
  assert(planRollup.syntheticCaseCount === 18, 'plan synthetic case count mismatch');
  assert(repoAuditRollup.accepted === true, 'repo audit evidence must be accepted');
  assert(toolStudyRollup.accepted === true, 'tool study evidence must be accepted');
  assert(toolStudyRollup.pendingOwnerStudiesCompleted?.length === 4, 'pending owner study count mismatch');
  assert(toolStudyRollup.completedOwnerStudiesDuplicated === false, 'completed owner studies duplicated');
  assert(dependencyRollup.accepted === true, 'dependency evidence must be accepted');
  assert(
    dependencyRollup.handoffDecision === 'dependency_validation_passed_with_inherited_readiness_blockers_ready_to_merge',
    'dependency handoff decision mismatch',
  );
  assert(dependencyRollup.staleMissingNodeModulesWarningSuperseded === true, 'stale dependency warning must be superseded');
  assert(dependencyRollup.packageLockChanged === false, 'package lock must not be changed');
  assert(blockerRegister.hardBlockers.length === 0, 'hard blockers should be empty');
  assert(dryRunNotClaimed.dryRunPassedClaimed === false, 'dry-run pass register must stay false');
  assert(dryRunNotClaimed.dryRunExecutionAttempted === false, 'dry-run execution must not be attempted');
  assert(generatedNotClaimed.generatedLocalFixturePassedClaimed === false, 'generated local fixture register must stay false');
  assert(generatedNotClaimed.generatedAssetsCreated === false, 'generated assets must not be created');
  assert(runtimeBlocker.status === 'all_runtime_gates_blocked', 'runtime blocker status mismatch');
  assert(ownerHandoff.allRequiredOwnersRepresented === true, 'owner handoff coverage mismatch');
  assert(ownerHandoff.ownerStatuses.length >= 10, 'owner handoff owner count too low');
  assert(noExecution.policyStatus === 'all_runtime_gates_closed', 'no-execution policy mismatch');
  assert(noExecution.supabaseClassification?.supabaseUpdateRequired === false, 'Supabase update must not be required');
  assert(summary.decision === DECISION, 'summary decision mismatch');
  assert(summary.nextPrompt === NEXT_PROMPT, 'summary next prompt mismatch');
  assert(summary.acceptedEvidence?.pr385OwnerApproval === true, 'summary must accept PR #385');
  assert(summary.coverage?.caseCount === 18, 'summary case count mismatch');
  assert(summary.runtimeFlags?.dryRunPassedClaimed === false, 'summary claims dry-run pass');
  assert(summary.runtimeFlags?.generatedLocalFixturePassedClaimed === false, 'summary claims generated local fixture pass');

  for (const report of EXPECTED_REPORTS) {
    const relativePath = `${REPORT_DIR}/${report}`;
    assertRuntimeFlagsFalse(report, readJson(root, relativePath));
    assertNoForbiddenText(root, relativePath);
  }
  for (const doc of REQUIRED_DOCS) {
    assertNoForbiddenText(root, doc);
  }
  assertNoForbiddenRuntimeImports(root, 'scripts/validation/tool-route-execution-unlock-5-dry-run-gate-status-diagnostics.mjs');

  return {
    status: 'passed',
    phase: PHASE,
    decision: decision.decision,
    gateStatusRecorded: summary.gateStatusRecorded,
    readyForDryRunPassReview: decision.readyForDryRunPassReview,
    readyForToolExecution: false,
    readyForRouteExecution: false,
    readyForWorkerExecution: false,
    readyForSupabasePersistence: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
    caseCount: validationRollup.caseCount,
    metadataAcceptedFixtureCount: validationRollup.metadataAcceptedFixtureCount,
    failClosedFixtureCount: validationRollup.failClosedFixtureCount,
    expectedReports: EXPECTED_REPORTS.length,
    runtimeFlagsClosed: true,
    dependencyValidationHandoffAccepted: dependencyRollup.accepted,
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
