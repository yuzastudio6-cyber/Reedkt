import fs from 'node:fs';
import path from 'node:path';

const PHASE = 'TOOL-ROUTE-EXECUTION-UNLOCK-7';
const REPORT_DIR = 'docs/activation-tool-route-execution-unlock-7-local-fixture-plan-reports';
const DECISION = 'tool_route_local_fixture_plan_ready_with_warnings';
const NEXT_PROMPT = 'TOOL-ROUTE-EXECUTION-UNLOCK-8: tool-route local fixture validation, no execution';

const EXPECTED_REPORTS = [
  'tool_route_local_fixture_plan_decision.json',
  'tool_route_local_fixture_plan_source_of_truth_audit.json',
  'tool_route_local_fixture_scope.json',
  'tool_route_local_fixture_input_matrix.json',
  'tool_route_local_fixture_validation_matrix.json',
  'tool_route_local_fixture_execution_blocker_plan.json',
  'tool_route_local_fixture_case_plan.json',
  'tool_route_local_fixture_valid_fixture_plan.json',
  'tool_route_local_fixture_invalid_fixture_plan.json',
  'tool_route_local_fixture_manifest_checksum_plan.json',
  'tool_route_local_fixture_schema_contract_plan.json',
  'tool_route_local_fixture_scoring_policy_plan.json',
  'tool_route_local_fixture_handoff_plan.json',
  'tool_route_local_fixture_observability_cost_plan.json',
  'tool_route_local_fixture_billing_credit_plan.json',
  'tool_route_local_fixture_supabase_handoff_plan.json',
  'tool_route_local_fixture_worker_provider_handoff_plan.json',
  'tool_route_local_fixture_no_execution_policy.json',
  'tool_route_dry_run_passed_not_claimed_register.json',
  'tool_route_generated_local_fixture_not_claimed_register.json',
  'tool_route_local_fixture_plan_summary.json',
];

const REQUIRED_DOCS = [
  'docs/tool-route-execution-unlock-7-local-fixture-plan.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-8-local-fixture-validation.md',
];

const SOURCE_DOCS = [
  'docs/activation-tool-route-execution-unlock-6-dry-run-pass-review-reports/tool_route_dry_run_pass_review_decision.json',
  'docs/activation-tool-route-execution-unlock-6-dry-run-pass-review-reports/tool_route_dry_run_pass_review_summary.json',
  'docs/activation-tool-route-execution-unlock-5-dry-run-gate-status-reports/tool_route_dry_run_gate_status_decision.json',
  'docs/activation-tool-route-execution-unlock-4-owner-approval-reports/tool_route_owner_approval_decision.json',
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_decision.json',
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_case_coverage.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-reports/tool_route_dry_run_contract_decision.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_dry_run_cases.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_valid_request_fixtures.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_invalid_request_fixtures.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_fixture_manifest.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_fixture_checksums.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_fixture_schema_versions.json',
  'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_scoring_policy.json',
  'docs/activation-tool-route-execution-unlock-1-dry-run-plan-reports/tool_route_dry_run_plan_decision.json',
  'docs/activation-tool-route-execution-unlock-0-repo-audit-reports/tool_route_repo_audit_decision.json',
  'docs/activation-tool-study-pending-owners-0-reports/tool_study_decision.json',
  'docs/tool-studies/ai-tools-creative-graphics-tool-study.md',
  'docs/tool-studies/track-a-render-export-tool-study.md',
  'docs/tool-studies/track-b-media-processing-tool-study.md',
  'docs/tool-studies/sound-music-audio-tool-study.md',
  'docs/activation-worker-runtime-unlock-4-local-fixture-plan-reports/worker_runtime_local_fixture_plan_decision.json',
];

const ALLOWED_DECISIONS = [
  'tool_route_local_fixture_plan_ready',
  'tool_route_local_fixture_plan_ready_with_warnings',
  'tool_route_local_fixture_plan_blocked_missing_dry_run_contract_fixtures',
  'tool_route_local_fixture_plan_blocked_missing_validation_evidence',
  'tool_route_local_fixture_plan_blocked_runtime_gate_ambiguity',
  'tool_route_local_fixture_plan_blocked_source_of_truth_conflict',
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
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
];

const FORBIDDEN_TEXT_PATTERNS = [
  { label: 'auth header value', pattern: /auth(?:orization)?\s*[:=]\s*bearer/i },
  { label: 'token-shaped value', pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { label: 'database url', pattern: new RegExp('postgres' + '(?:ql)?://' + '|database' + '_url', 'i') },
  { label: 'Supabase project url', pattern: /https?:\/\/[a-z0-9-]+\.supabase\.co/i },
  { label: 'service role value', pattern: /service[_-]?role[_-]?key\s*[:=]\s*['"][^'"]+/i },
  { label: 'anon key value', pattern: /anon[_-]?key\s*[:=]\s*['"][^'"]+/i },
  { label: 'provider key value', pattern: /(api|provider|dashscope|deepseek)[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{16,}/i },
  { label: 'private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  {
    label: 'signed link marker',
    pattern: new RegExp(
      [
        ['x', 'goog', 'signature'].join('-'),
        ['x', 'amz', 'signature'].join('-'),
        'signature' + '=',
      ].join('|'),
      'i',
    ),
  },
  { label: 'raw provider output assignment', pattern: /rawProviderOutput\s*[:=]\s*['"][^'"]+/i },
  { label: 'env file marker', pattern: /(^|\/)\.env(\.|$)/i },
  { label: 'unsafe generated fixture pass claim', pattern: /generatedLocalFixturePassedClaimed\s*[:=]\s*true/i },
  { label: 'unsafe dry-run pass claim', pattern: /dryRunPassedClaimed\s*[:=]\s*true/i },
];

const FORBIDDEN_RUNTIME_IMPORT_PATTERNS = [
  /from\s+['"].*server\/workers/i,
  /from\s+['"].*server\/routes/i,
  /from\s+['"].*server\/tools/i,
  /from\s+['"].*supabase/i,
  /from\s+['"].*provider/i,
  /require\(['"].*server\/workers/i,
  /require\(['"].*server\/routes/i,
  /require\(['"].*server\/tools/i,
  /require\(['"].*supabase/i,
  /require\(['"].*provider/i,
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
    'tool-route-execution-unlock-7:diagnostics',
    'tool-route-execution-unlock-7:report',
    'tool-route-execution-unlock-7:summary',
  ]) {
    assert(packageJson.scripts?.[script], `Missing package script: ${script}`);
  }

  const decision = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_plan_decision.json`);
  const sourceAudit = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_plan_source_of_truth_audit.json`);
  const scope = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_scope.json`);
  const inputMatrix = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_input_matrix.json`);
  const validationMatrix = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_validation_matrix.json`);
  const blockerPlan = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_execution_blocker_plan.json`);
  const casePlan = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_case_plan.json`);
  const validPlan = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_valid_fixture_plan.json`);
  const invalidPlan = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_invalid_fixture_plan.json`);
  const manifestPlan = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_manifest_checksum_plan.json`);
  const schemaPlan = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_schema_contract_plan.json`);
  const scoringPlan = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_scoring_policy_plan.json`);
  const handoffPlan = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_handoff_plan.json`);
  const supabaseHandoff = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_supabase_handoff_plan.json`);
  const workerProviderHandoff = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_worker_provider_handoff_plan.json`);
  const noExecution = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_no_execution_policy.json`);
  const dryRunRegister = readJson(root, `${REPORT_DIR}/tool_route_dry_run_passed_not_claimed_register.json`);
  const generatedRegister = readJson(root, `${REPORT_DIR}/tool_route_generated_local_fixture_not_claimed_register.json`);
  const summary = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_plan_summary.json`);

  assert(decision.phase === PHASE, 'decision phase mismatch');
  assert(ALLOWED_DECISIONS.includes(decision.decision), `unexpected decision ${decision.decision}`);
  assert(decision.decision === DECISION, `expected ${DECISION}, got ${decision.decision}`);
  assert(decision.nextPrompt === NEXT_PROMPT, 'next prompt mismatch');
  assert(decision.readyForLocalFixtureValidation === true, 'local fixture validation readiness expected');
  assert(decision.sourceOfTruthConflictsFound === false, 'decision reports source conflicts');
  assert(decision.dryRunPassedClaimed === false, 'dry-run pass must not be claimed');
  assert(decision.generatedLocalFixturePassedClaimed === false, 'generated local fixture pass must not be claimed');
  assert(decision.fixtureScope?.caseCount === 18, 'decision case count mismatch');
  assert(decision.fixtureScope?.metadataAcceptedFixtureCount === 10, 'decision accepted fixture count mismatch');
  assert(decision.fixtureScope?.failClosedFixtureCount === 8, 'decision fail-closed fixture count mismatch');

  assert(sourceAudit.githubMergeHygiene?.pr398Merged === true, 'PR #398 must be merged');
  assert(
    sourceAudit.githubMergeHygiene?.pr398MergeCommit === 'c50532d5c509522cc39477f7a0d653569e1e57b4',
    'PR #398 merge commit mismatch',
  );
  assert(sourceAudit.sourceOfTruthConflictsFound === false, 'source audit reports conflicts');
  for (const pr of [398, 392, 385, 381, 377, 374, 369, 360]) {
    assert(
      sourceAudit.acceptedEvidence?.some((entry) => entry.pr === pr && entry.accepted === true),
      `missing accepted source evidence for PR #${pr}`,
    );
  }
  assert(sourceAudit.completedOwnerStudiesDuplicated === false, 'completed owner studies must not be duplicated');

  assert(scope.scopeStatus === 'local_fixture_planning_only', 'scope status mismatch');
  assert(inputMatrix.caseCount === 18, 'input matrix case count mismatch');
  assert(inputMatrix.metadataAcceptedFixtureCount === 10, 'input matrix accepted count mismatch');
  assert(inputMatrix.failClosedFixtureCount === 8, 'input matrix fail-closed count mismatch');
  assert(validationMatrix.acceptanceCriteria?.caseCount === 18, 'validation matrix case count mismatch');
  assert(casePlan.caseCount === 18, 'case plan case count mismatch');
  assert(validPlan.fixtureCount === 10, 'valid fixture count mismatch');
  assert(invalidPlan.fixtureCount === 8, 'invalid fixture count mismatch');
  assert(manifestPlan.checksumAlgorithm === 'sha256_canonical_json_content_only', 'checksum algorithm mismatch');
  assert(schemaPlan.requiredSchemas?.includes('approved_plan_snapshot_v1'), 'approved snapshot schema missing');
  assert(scoringPlan.runtimeScoreCanOverrideSafety === false, 'scoring safety override must be false');
  assert(handoffPlan.ownerHandoffs?.length >= 8, 'owner handoff coverage too small');
  assert(supabaseHandoff.supabaseUpdateRequired === false, 'Supabase update must not be required');
  assert(supabaseHandoff.supabaseEnvironmentTouched === false, 'Supabase environment must not be touched');
  assert(supabaseHandoff.sqlExecuted === false, 'SQL must not be executed');
  assert(supabaseHandoff.migrationDeployed === false, 'migration must not be deployed');
  assert(workerProviderHandoff.workerExecutionAllowed === false, 'worker execution must remain blocked');
  assert(workerProviderHandoff.providerExecutionAllowed === false, 'provider execution must remain blocked');
  assert(noExecution.policyStatus === 'all_runtime_gates_closed', 'no-execution policy mismatch');
  assert(dryRunRegister.dryRunPassedClaimed === false, 'dry-run pass register must be false');
  assert(generatedRegister.generatedLocalFixturePassedClaimed === false, 'generated local fixture register must be false');
  assert(summary.decision === DECISION, 'summary decision mismatch');
  assert(summary.nextPrompt === NEXT_PROMPT, 'summary next prompt mismatch');

  const fixtureCases = readJson(
    root,
    'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_dry_run_cases.json',
  );
  const validFixtures = readJson(
    root,
    'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_valid_request_fixtures.json',
  );
  const invalidFixtures = readJson(
    root,
    'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/tool_route_invalid_request_fixtures.json',
  );
  assert(fixtureCases.caseCount === 18, 'source fixture case count mismatch');
  assert(validFixtures.fixtureCount === 10, 'source valid fixture count mismatch');
  assert(invalidFixtures.fixtureCount === 8, 'source invalid fixture count mismatch');

  for (const report of EXPECTED_REPORTS) {
    const reportPath = `${REPORT_DIR}/${report}`;
    assertNoForbiddenText(root, reportPath);
    assertRuntimeFlagsFalse(reportPath, readJson(root, reportPath));
  }
  for (const doc of REQUIRED_DOCS) {
    assertNoForbiddenText(root, doc);
  }
  assertNoForbiddenRuntimeImports(root, 'scripts/validation/tool-route-execution-unlock-7-local-fixture-plan-diagnostics.mjs');

  return {
    phase: PHASE,
    decision: decision.decision,
    readyForLocalFixtureValidation: decision.readyForLocalFixtureValidation,
    caseCount: inputMatrix.caseCount,
    metadataAcceptedFixtureCount: inputMatrix.metadataAcceptedFixtureCount,
    failClosedFixtureCount: inputMatrix.failClosedFixtureCount,
    pr398Merged: sourceAudit.githubMergeHygiene.pr398Merged,
    dryRunPassedClaimed: decision.dryRunPassedClaimed,
    generatedLocalFixturePassedClaimed: decision.generatedLocalFixturePassedClaimed,
    runtimeGatesClosed: noExecution.policyStatus === 'all_runtime_gates_closed',
    supabaseUpdateRequired: supabaseHandoff.supabaseUpdateRequired,
    nextPrompt: decision.nextPrompt,
  };
}

const mode = process.argv.includes('--report')
  ? 'report'
  : process.argv.includes('--summary')
    ? 'summary'
    : 'diagnostics';

const root = process.cwd();
const summary = validate(root);

if (mode === 'summary') {
  console.log(JSON.stringify(summary, null, 2));
} else if (mode === 'report') {
  console.log(
    JSON.stringify(
      {
        ...summary,
        reports: EXPECTED_REPORTS.map((report) => `${REPORT_DIR}/${report}`),
        requiredDocs: REQUIRED_DOCS,
      },
      null,
      2,
    ),
  );
} else {
  console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
}
