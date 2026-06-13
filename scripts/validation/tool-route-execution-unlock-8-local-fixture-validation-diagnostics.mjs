import fs from 'node:fs';
import path from 'node:path';

const PHASE = 'TOOL-ROUTE-EXECUTION-UNLOCK-8';
const REPORT_DIR = 'docs/activation-tool-route-execution-unlock-8-local-fixture-validation-reports';
const FIXTURE_DIR = 'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures';
const DECISION = 'tool_route_local_fixture_validation_passed_with_warnings_ready_for_owner_approval';
const NEXT_PROMPT =
  'TOOL-ROUTE-EXECUTION-UNLOCK-9: owner approval for tool-route local fixture gate, no execution';

const EXPECTED_REPORTS = [
  'tool_route_local_fixture_validation_decision.json',
  'tool_route_local_fixture_validation_source_of_truth_audit.json',
  'tool_route_local_fixture_presence_validation.json',
  'tool_route_local_fixture_case_coverage_validation.json',
  'tool_route_local_fixture_input_matrix_validation.json',
  'tool_route_local_fixture_validation_matrix_validation.json',
  'tool_route_local_fixture_schema_contract_validation.json',
  'tool_route_local_fixture_scoring_policy_validation.json',
  'tool_route_local_fixture_valid_fixture_validation.json',
  'tool_route_local_fixture_invalid_fixture_validation.json',
  'tool_route_local_fixture_blocked_raw_prompt_validation.json',
  'tool_route_local_fixture_blocked_signed_url_public_artifact_validation.json',
  'tool_route_local_fixture_blocked_runtime_execution_validation.json',
  'tool_route_local_fixture_handoff_owner_validation.json',
  'tool_route_local_fixture_observability_cost_validation.json',
  'tool_route_local_fixture_billing_credit_validation.json',
  'tool_route_local_fixture_supabase_handoff_validation.json',
  'tool_route_local_fixture_worker_provider_handoff_validation.json',
  'tool_route_local_fixture_no_execution_policy_validation.json',
  'tool_route_dry_run_passed_not_claimed_validation.json',
  'tool_route_generated_local_fixture_not_claimed_validation.json',
  'tool_route_local_fixture_validation_summary.json',
];

const EXPECTED_FIXTURES = [
  'tool_route_dry_run_cases.json',
  'tool_route_valid_request_fixtures.json',
  'tool_route_invalid_request_fixtures.json',
  'tool_route_expected_result_fixtures.json',
  'tool_route_fixture_manifest.json',
  'tool_route_fixture_checksums.json',
  'tool_route_fixture_schema_versions.json',
  'tool_route_scoring_policy.json',
];

const REQUIRED_DOCS = [
  'docs/tool-route-execution-unlock-8-local-fixture-validation.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-9-owner-approval-for-local-fixture-gate.md',
];

const SOURCE_DOCS = [
  'docs/tool-route-execution-unlock-7-local-fixture-plan.md',
  'docs/activation-tool-route-execution-unlock-7-local-fixture-plan-reports/tool_route_local_fixture_plan_decision.json',
  'docs/activation-tool-route-execution-unlock-7-local-fixture-plan-reports/tool_route_local_fixture_plan_summary.json',
  'docs/activation-tool-route-execution-unlock-7-local-fixture-plan-reports/tool_route_local_fixture_case_plan.json',
  'docs/activation-tool-route-execution-unlock-6-dry-run-pass-review-reports/tool_route_dry_run_pass_review_summary.json',
  'docs/activation-tool-route-execution-unlock-5-dry-run-gate-status-reports/tool_route_dry_run_gate_status_decision.json',
  'docs/activation-tool-route-execution-unlock-4-owner-approval-reports/tool_route_owner_approval_decision.json',
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_summary.json',
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
];

const REQUIRED_CASES = [
  'intent_to_capability_text_edit',
  'intent_to_capability_graphics_request',
  'intent_to_capability_map_request',
  'intent_to_capability_web_capture_request',
  'intent_to_capability_audio_request',
  'intent_to_capability_media_processing_request',
  'intent_to_capability_render_export_request',
  'multi_tool_plan_graphics_to_tracka_handoff',
  'multi_tool_plan_trackb_to_tracka_handoff',
  'multi_tool_plan_sound_to_tracka_handoff',
  'blocked_raw_prompt_direct_execution',
  'blocked_signed_url_source_of_truth',
  'blocked_public_artifact_request',
  'blocked_tool_runtime_execution',
  'blocked_route_runtime_execution',
  'blocked_provider_runtime_execution',
  'blocked_worker_runtime_execution',
  'blocked_supabase_mutation_request',
];

const VALID_CASES = REQUIRED_CASES.slice(0, 10);
const INVALID_CASES = REQUIRED_CASES.slice(10);

const ALLOWED_DECISIONS = [
  'tool_route_local_fixture_validation_passed_ready_for_owner_approval',
  'tool_route_local_fixture_validation_passed_with_warnings_ready_for_owner_approval',
  'tool_route_local_fixture_validation_blocked_missing_plan',
  'tool_route_local_fixture_validation_blocked_missing_contract_fixtures',
  'tool_route_local_fixture_validation_blocked_case_coverage_gap',
  'tool_route_local_fixture_validation_blocked_schema_policy_gap',
  'tool_route_local_fixture_validation_blocked_runtime_gate_ambiguity',
  'tool_route_local_fixture_validation_blocked_source_of_truth_conflict',
];

const FORBIDDEN_DECISIONS = [
  'tool_route_execution_ready',
  'route_execution_ready',
  'tool_execution_ready',
  'worker_execution_ready',
  'staging_ready',
  'production_ready',
  'beta_ready',
  'external_beta_ready',
  'paid_production_ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
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
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
  'toolExecutionReady',
  'routeExecutionReady',
  'workerExecutionReady',
  'supabasePersistenceReady',
  'providerExecutionReady',
  'betaReady',
  'externalBetaReady',
  'paidProductionReady',
  'productionReady',
  'realExecutionReady',
  'runtimeReady',
  'resourcesCreated',
  'localFixturesExecuted',
  'fixturesExecuted',
  'rawPromptExecutionAllowed',
  'rawPromptDirectExecutionAllowed',
  'rawProviderOutputPersisted',
];

const REQUIRED_RUNTIME_FALSE_IN_POLICY = [
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'providerExecutionAllowed',
  'supabaseWriteAllowed',
  'sqlExecutionAllowed',
  'publicArtifactCreationAllowed',
  'signedUrlCreationAllowed',
  'productionUnlockAllowed',
  'externalBetaUnlockAllowed',
  'paidProductionUnlockAllowed',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
];

const REQUIRED_REQUEST_FIELDS = [
  'toolRouteDryRunCaseId',
  'syntheticInputRef',
  'structuredAgentFindingsRef',
  'editIntentsRef',
  'approvedPlanSnapshotRef',
  'approvedPlanSnapshotHash',
  'capabilityCandidates',
  'toolCandidates',
  'routeCandidates',
  'scoringPolicyRef',
  'handoffOwner',
  'sourceOfTruthRequirement',
  'artifactPolicy',
  'signedUrlPolicy',
  'publicArtifactPolicy',
  'runtimeFlags',
];

const FORBIDDEN_TEXT_PATTERNS = [
  { label: 'authorization header value', pattern: /authorization\s*[:=]\s*bearer/i },
  { label: 'jwt', pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { label: 'db url', pattern: new RegExp('postgres' + '(?:ql)?://' + '|database' + '_url', 'i') },
  { label: 'supabase project url', pattern: /https?:\/\/[a-z0-9-]+\.supabase\.co/i },
  { label: 'service role value', pattern: /service[_-]?role[_-]?key\s*[:=]\s*['"][^'"]+/i },
  { label: 'anon key value', pattern: /anon[_-]?key\s*[:=]\s*['"][^'"]+/i },
  { label: 'provider key value', pattern: /(api|provider|dashscope|deepseek)[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{16,}/i },
  { label: 'private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  { label: 'signed link marker', pattern: new RegExp('x-goog-' + 'signature|x-amz-' + 'signature|signature' + '=', 'i') },
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

function values(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) values(item, visitor);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      visitor(key, child);
      values(child, visitor);
    }
  }
}

function assertRuntimeFlagsFalse(label, value) {
  values(value, (key, child) => {
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

function ids(items) {
  return items.map((item) => item.toolRouteDryRunCaseId);
}

function assertSameSet(label, actual, expected) {
  const actualSet = new Set(actual);
  const missing = expected.filter((item) => !actualSet.has(item));
  const extra = actual.filter((item) => !expected.includes(item));
  assert(missing.length === 0, `${label} missing: ${missing.join(', ')}`);
  assert(extra.length === 0, `${label} has extra: ${extra.join(', ')}`);
}

function assertRequiredFields(label, fixture) {
  for (const field of REQUIRED_REQUEST_FIELDS) {
    assert(Object.hasOwn(fixture, field), `${label} missing ${field}`);
  }
}

function validate(root) {
  assert(fs.existsSync(path.join(root, REPORT_DIR)), `${REPORT_DIR} is missing`);
  for (const report of EXPECTED_REPORTS) {
    assert(fs.existsSync(path.join(root, REPORT_DIR, report)), `${report} is missing`);
  }
  for (const fixture of EXPECTED_FIXTURES) {
    assert(fs.existsSync(path.join(root, FIXTURE_DIR, fixture)), `${fixture} is missing`);
  }
  for (const doc of [...REQUIRED_DOCS, ...SOURCE_DOCS]) {
    assert(fs.existsSync(path.join(root, doc)), `${doc} is missing`);
  }

  const packageJson = readJson(root, 'package.json');
  for (const script of [
    'tool-route-execution-unlock-8:diagnostics',
    'tool-route-execution-unlock-8:report',
    'tool-route-execution-unlock-8:summary',
  ]) {
    assert(packageJson.scripts?.[script], `Missing package script: ${script}`);
  }

  const decision = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_validation_decision.json`);
  const sourceAudit = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_validation_source_of_truth_audit.json`);
  const presence = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_presence_validation.json`);
  const coverage = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_case_coverage_validation.json`);
  const schema = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_schema_contract_validation.json`);
  const scoring = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_scoring_policy_validation.json`);
  const valid = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_valid_fixture_validation.json`);
  const invalid = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_invalid_fixture_validation.json`);
  const rawPrompt = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_blocked_raw_prompt_validation.json`);
  const signedPublic = readJson(
    root,
    `${REPORT_DIR}/tool_route_local_fixture_blocked_signed_url_public_artifact_validation.json`,
  );
  const blockedRuntime = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_blocked_runtime_execution_validation.json`);
  const handoff = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_handoff_owner_validation.json`);
  const noExecution = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_no_execution_policy_validation.json`);
  const dryRun = readJson(root, `${REPORT_DIR}/tool_route_dry_run_passed_not_claimed_validation.json`);
  const generated = readJson(root, `${REPORT_DIR}/tool_route_generated_local_fixture_not_claimed_validation.json`);
  const summary = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_validation_summary.json`);

  assert(ALLOWED_DECISIONS.includes(decision.decision), `Unexpected decision: ${decision.decision}`);
  assert(decision.decision === DECISION, `Decision mismatch: ${decision.decision}`);
  for (const forbidden of FORBIDDEN_DECISIONS) {
    assert(decision.decision !== forbidden, `Forbidden decision used: ${forbidden}`);
  }
  assert(decision.nextPrompt === NEXT_PROMPT, 'Next prompt mismatch');
  assert(sourceAudit.pr404Merged === true, 'PR #404 merge evidence missing');
  assert(sourceAudit.pr404MergeCommit === '24ed77812ea9dedd132687d0ca04a656bea58b8f', 'PR #404 merge commit mismatch');
  for (const pr of [404, 398, 392, 385, 381, 377, 374, 369, 360]) {
    assert(
      sourceAudit.acceptedSourceChain?.some((entry) => entry.pr === pr),
      `Source audit missing PR #${pr}`,
    );
  }

  const cases = readJson(root, `${FIXTURE_DIR}/tool_route_dry_run_cases.json`).cases;
  const validFixtures = readJson(root, `${FIXTURE_DIR}/tool_route_valid_request_fixtures.json`).fixtures;
  const invalidFixtures = readJson(root, `${FIXTURE_DIR}/tool_route_invalid_request_fixtures.json`).fixtures;
  const expectedResults = readJson(root, `${FIXTURE_DIR}/tool_route_expected_result_fixtures.json`).fixtures;
  const manifest = readJson(root, `${FIXTURE_DIR}/tool_route_fixture_manifest.json`);
  const scoringPolicy = readJson(root, `${FIXTURE_DIR}/tool_route_scoring_policy.json`);

  assert(Array.isArray(cases) && cases.length === 18, 'Expected 18 dry-run cases');
  assert(Array.isArray(validFixtures) && validFixtures.length === 10, 'Expected 10 valid request fixtures');
  assert(Array.isArray(invalidFixtures) && invalidFixtures.length === 8, 'Expected 8 invalid request fixtures');
  assert(Array.isArray(expectedResults) && expectedResults.length === 18, 'Expected 18 expected result fixtures');
  assertSameSet('case ids', ids(cases), REQUIRED_CASES);
  assertSameSet('valid fixture ids', ids(validFixtures), VALID_CASES);
  assertSameSet('invalid fixture ids', ids(invalidFixtures), INVALID_CASES);
  assertSameSet('expected result ids', ids(expectedResults), REQUIRED_CASES);
  assert(new Set(ids(cases)).size === cases.length, 'Case ids must be unique');

  for (const fixture of [...cases, ...validFixtures, ...invalidFixtures]) {
    assertRequiredFields(fixture.toolRouteDryRunCaseId, fixture);
    assert(fixture.syntheticInputRef?.startsWith('synthetic_input_ref:'), `${fixture.toolRouteDryRunCaseId} has non-synthetic input ref`);
    assert(fixture.approvedPlanSnapshotRef?.startsWith('approved_plan_snapshot_ref:'), `${fixture.toolRouteDryRunCaseId} has non-synthetic snapshot ref`);
    assert(fixture.sourceOfTruthRequirement?.resourcesCreated === false, `${fixture.toolRouteDryRunCaseId} creates resources`);
    assert(fixture.signedUrlPolicy?.signedUrlCreationAllowed === false, `${fixture.toolRouteDryRunCaseId} allows signed URLs`);
    assert(fixture.publicArtifactPolicy?.publicArtifactCreationAllowed === false, `${fixture.toolRouteDryRunCaseId} allows public artifacts`);
    assertRuntimeFlagsFalse(fixture.toolRouteDryRunCaseId, fixture);
  }

  for (const fixture of validFixtures) {
    assert(fixture.selectedCandidate, `${fixture.toolRouteDryRunCaseId} lacks metadata selected candidate`);
    assert(fixture.blockedDecision === null, `${fixture.toolRouteDryRunCaseId} should not have a blocked decision`);
  }
  for (const fixture of invalidFixtures) {
    assert(fixture.selectedCandidate === null, `${fixture.toolRouteDryRunCaseId} should not select a candidate`);
    assert(Boolean(fixture.blockedDecision), `${fixture.toolRouteDryRunCaseId} missing blocked decision`);
  }

  assert(manifest.caseCount === 18, 'Manifest case count mismatch');
  assert(manifest.validFixtureCount === 10, 'Manifest valid count mismatch');
  assert(manifest.invalidFixtureCount === 8, 'Manifest invalid count mismatch');
  assert(scoringPolicy.schemaVersion === 'tool_route_scoring_policy_v1', 'Scoring policy schema mismatch');

  for (const [label, report] of Object.entries({
    decision,
    sourceAudit,
    presence,
    coverage,
    schema,
    scoring,
    valid,
    invalid,
    rawPrompt,
    signedPublic,
    blockedRuntime,
    handoff,
    noExecution,
    dryRun,
    generated,
    summary,
  })) {
    assertRuntimeFlagsFalse(label, report);
  }

  assert(presence.requiredFixtureFilesPresent === true, 'Fixture presence validation did not pass');
  assert(coverage.caseIdsUnique === true && coverage.missingCaseIds?.length === 0, 'Case coverage validation did not pass');
  assert(schema.requiredRequestFieldsRepresented === true, 'Schema contract validation did not pass');
  assert(scoring.scoringPolicyPresent === true, 'Scoring policy validation did not pass');
  assert(valid.validFixturesAcceptedAsMetadataOnly === true, 'Valid fixture metadata validation did not pass');
  assert(invalid.invalidFixturesFailClosed === true, 'Invalid fixture fail-closed validation did not pass');
  assert(rawPrompt.rawPromptDirectExecutionAllowed === false, 'Raw prompt direct execution is not blocked');
  assert(signedPublic.signedUrlCreationAllowed === false, 'Signed URL creation is not blocked');
  assert(signedPublic.publicArtifactCreationAllowed === false, 'Public artifact creation is not blocked');
  assert(blockedRuntime.runtimeExecutionAllowed === false, 'Runtime execution is not blocked');
  assert(handoff.readyForOwnerApprovalForLocalFixtureGate === true, 'Owner approval handoff not ready');
  for (const key of REQUIRED_RUNTIME_FALSE_IN_POLICY) {
    assert(noExecution[key] === false, `No-execution policy missing false ${key}`);
  }
  assert(dryRun.dryRunPassedClaimed === false, 'Dry-run pass was claimed');
  assert(generated.generatedLocalFixturePassedClaimed === false, 'Generated local fixture pass was claimed');

  for (const report of EXPECTED_REPORTS) {
    assertNoForbiddenText(root, `${REPORT_DIR}/${report}`);
  }
  for (const doc of REQUIRED_DOCS) {
    assertNoForbiddenText(root, doc);
  }
  assertNoForbiddenRuntimeImports(root, 'scripts/validation/tool-route-execution-unlock-8-local-fixture-validation-diagnostics.mjs');

  return {
    mode: 'diagnostics',
    status: 'passed',
    phase: PHASE,
    decision: decision.decision,
    readyForOwnerApproval: decision.readyForOwnerApproval,
    readyForToolExecution: false,
    readyForRouteExecution: false,
    readyForWorkerExecution: false,
    caseCount: cases.length,
    metadataAcceptedFixtureCount: validFixtures.length,
    failClosedFixtureCount: invalidFixtures.length,
    expectedReports: EXPECTED_REPORTS.length,
    fixtureFilesPresent: EXPECTED_FIXTURES.length,
    sourceOfTruthConflictsFound: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
    runtimeFlagsClosed: true,
    supabaseUpdateRequired: false,
    nextPrompt: decision.nextPrompt,
  };
}

function main() {
  const root = process.cwd();
  const result = validate(root);
  const mode = process.argv.includes('--summary') ? 'summary' : process.argv.includes('--report') ? 'report' : 'diagnostics';
  console.log(JSON.stringify({ ...result, mode }, null, 2));
}

main();
