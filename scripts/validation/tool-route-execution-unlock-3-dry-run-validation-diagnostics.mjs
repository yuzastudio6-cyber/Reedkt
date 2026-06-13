import fs from 'node:fs';
import path from 'node:path';

const PHASE = 'TOOL-ROUTE-EXECUTION-UNLOCK-3';
const REPORT_DIR = 'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports';
const CONTRACT_REPORT_DIR = 'docs/activation-tool-route-execution-unlock-2-dry-run-contract-reports';
const FIXTURE_DIR = 'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures';
const DECISION = 'tool_route_dry_run_validation_passed_with_warnings_ready_for_owner_approval';
const NEXT_PROMPT =
  'TOOL-ROUTE-EXECUTION-UNLOCK-4: owner approval for tool-route dry-run gate, no execution';

const EXPECTED_REPORTS = [
  'tool_route_dry_run_validation_decision.json',
  'tool_route_dry_run_validation_source_of_truth_audit.json',
  'tool_route_dry_run_validation_fixture_presence.json',
  'tool_route_dry_run_validation_case_coverage.json',
  'tool_route_dry_run_validation_schema_contracts.json',
  'tool_route_dry_run_validation_scoring_policy.json',
  'tool_route_dry_run_validation_valid_fixture_results.json',
  'tool_route_dry_run_validation_invalid_fixture_results.json',
  'tool_route_dry_run_validation_blocked_raw_prompt.json',
  'tool_route_dry_run_validation_blocked_signed_url_public_artifact.json',
  'tool_route_dry_run_validation_blocked_runtime_execution.json',
  'tool_route_dry_run_validation_handoff_contracts.json',
  'tool_route_dry_run_validation_no_execution_policy.json',
  'tool_route_dry_run_validation_redaction_scan.json',
  'tool_route_dry_run_validation_supabase_blocker.json',
  'tool_route_dry_run_validation_worker_provider_blocker.json',
  'tool_route_dry_run_validation_observability_billing_metadata.json',
  'tool_route_dry_run_validation_summary.json',
];

const EXPECTED_FIXTURES = [
  'tool_route_dry_run_cases.json',
  'tool_route_capability_candidates.json',
  'tool_route_tool_candidates.json',
  'tool_route_route_candidates.json',
  'tool_route_scoring_policy.json',
  'tool_route_valid_request_fixtures.json',
  'tool_route_invalid_request_fixtures.json',
  'tool_route_expected_result_fixtures.json',
  'tool_route_fixture_manifest.json',
  'tool_route_fixture_checksums.json',
  'tool_route_fixture_schema_versions.json',
];

const REQUIRED_DOCS = [
  'docs/tool-route-execution-unlock-3-dry-run-validation.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-4-owner-approval.md',
];

const SOURCE_DOCS = [
  'docs/tool-route-execution-unlock-2-dry-run-contract.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-3-dry-run-validation.md',
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
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-reports/worker_runtime_fixture_hardening_decision.json',
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_dry_run_contract_review_decision.json',
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

const REQUIRED_REQUEST_FIELDS = [
  'toolRouteDryRunCaseId',
  'sourcePlanCaseId',
  'userIntentClass',
  'syntheticInputRef',
  'structuredAgentFindingsRef',
  'editIntentsRef',
  'approvedPlanSnapshotRef',
  'approvedPlanSnapshotHash',
  'capabilityCandidates',
  'toolCandidates',
  'routeCandidates',
  'scoringPolicyRef',
  'selectedCandidate',
  'blockedDecision',
  'blockedActions',
  'readinessStage',
  'handoffOwner',
  'sourceOfTruthRequirement',
  'artifactPolicy',
  'signedUrlPolicy',
  'publicArtifactPolicy',
  'workerHandoffRequired',
  'providerHandoffRequired',
  'supabaseHandoffRequired',
  'observabilityPolicyRef',
  'billingPolicyRef',
  'validationEvidenceRefs',
  'idempotencyKey',
  'correlationId',
  'blockedFieldClasses',
  'runtimeFlags',
];

const REQUIRED_RESULT_FIELDS = [
  'toolRouteDryRunCaseId',
  'status',
  'acceptedAsMetadataOnly',
  'selectedCapabilityId',
  'selectedToolId',
  'selectedRouteId',
  'blockedDecision',
  'blockedActions',
  'handoffOwner',
  'sourceOfTruthRequirement',
  'artifactPolicy',
  'observabilityPolicyRef',
  'billingPolicyRef',
  'validationEvidenceRefs',
  'idempotencyKey',
  'correlationId',
  'runtimeFlags',
];

const REQUIRED_BLOCKED_FIELDS = [
  'rawPrompt',
  'rawProviderOutput',
  'directToolInvocation',
  'directRouteInvocation',
  'executableWorkerPayload',
  'providerSecret',
  'serviceRoleKey',
  'signedUrlAsSourceOfTruth',
  'publicArtifactUrl',
  'productionTarget',
  'externalBetaTarget',
  'paidProductionTarget',
  'realUserData',
  'privateProjectPayload',
  'mediaPayload',
];

const ALLOWED_DECISIONS = [
  'tool_route_dry_run_validation_passed_ready_for_owner_approval',
  'tool_route_dry_run_validation_passed_with_warnings_ready_for_owner_approval',
  'tool_route_dry_run_validation_blocked_missing_fixtures',
  'tool_route_dry_run_validation_blocked_case_coverage_gap',
  'tool_route_dry_run_validation_blocked_schema_contract_failure',
  'tool_route_dry_run_validation_blocked_scoring_policy_failure',
  'tool_route_dry_run_validation_blocked_blocked_fixture_gap',
  'tool_route_dry_run_validation_blocked_handoff_contract_gap',
  'tool_route_dry_run_validation_blocked_source_of_truth_conflict',
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
  'runtimeReady',
  'resourcesCreated',
  'rawPromptExecutionAllowed',
  'rawPromptDirectExecutionAllowed',
  'rawProviderOutputPersisted',
  'realExecutionReady',
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
  { label: 'real url', pattern: /https?:\/\//i },
  { label: 'raw provider output assignment', pattern: /rawProviderOutput\s*[:=]\s*['"][^'"]+/i },
  { label: 'env file marker', pattern: /(^|\/)\.env(\.|$)/i },
  { label: 'generated local fixture pass claim', pattern: /generatedLocalFixturePassedClaimed\s*[:=]\s*true/i },
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

function assertRequiredFields(label, fields, required) {
  for (const field of required) {
    assert(fields.includes(field), `${label} missing required field ${field}`);
  }
}

function validateSyntheticRef(label, value, prefix) {
  assert(typeof value === 'string', `${label} must be a string`);
  assert(value.startsWith(prefix), `${label} must start with ${prefix}`);
  assert(value.includes('synthetic_'), `${label} must be synthetic`);
}

function validateFixtureShape(fixture, expectedInvalid) {
  assertRequiredFields(fixture.toolRouteDryRunCaseId, Object.keys(fixture), REQUIRED_REQUEST_FIELDS);
  validateSyntheticRef(`${fixture.toolRouteDryRunCaseId}.syntheticInputRef`, fixture.syntheticInputRef, 'synthetic_input_ref:');
  validateSyntheticRef(
    `${fixture.toolRouteDryRunCaseId}.structuredAgentFindingsRef`,
    fixture.structuredAgentFindingsRef,
    'structured_agent_findings_ref:',
  );
  validateSyntheticRef(`${fixture.toolRouteDryRunCaseId}.editIntentsRef`, fixture.editIntentsRef, 'edit_intents_ref:');
  validateSyntheticRef(
    `${fixture.toolRouteDryRunCaseId}.approvedPlanSnapshotRef`,
    fixture.approvedPlanSnapshotRef,
    'approved_plan_snapshot_ref:',
  );
  assert(fixture.sourceOfTruthRequirement?.resourcesCreated === false, `${fixture.toolRouteDryRunCaseId} creates source resources`);
  assert(fixture.artifactPolicy?.publicArtifactAllowed === false, `${fixture.toolRouteDryRunCaseId} allows public artifacts`);
  assert(fixture.artifactPolicy?.mediaPayloadAllowed === false, `${fixture.toolRouteDryRunCaseId} allows media payloads`);
  assert(fixture.signedUrlPolicy?.signedUrlCreationAllowed === false, `${fixture.toolRouteDryRunCaseId} allows signed URL creation`);
  assert(fixture.publicArtifactPolicy?.publicArtifactCreationAllowed === false, `${fixture.toolRouteDryRunCaseId} allows public artifact creation`);
  for (const field of REQUIRED_BLOCKED_FIELDS) {
    assert(fixture.blockedFieldClasses.includes(field), `${fixture.toolRouteDryRunCaseId} missing blocked field class ${field}`);
    assert(!Object.prototype.hasOwnProperty.call(fixture, field), `${fixture.toolRouteDryRunCaseId} contains blocked field ${field}`);
  }
  if (expectedInvalid) {
    assert(fixture.selectedCandidate === null, `${fixture.toolRouteDryRunCaseId} invalid fixture must not select a candidate`);
    assert(typeof fixture.blockedDecision === 'string' && fixture.blockedDecision.length > 0, `${fixture.toolRouteDryRunCaseId} must fail closed`);
  } else {
    assert(fixture.selectedCandidate && typeof fixture.selectedCandidate === 'object', `${fixture.toolRouteDryRunCaseId} valid fixture must select a candidate`);
    assert(fixture.blockedDecision === null, `${fixture.toolRouteDryRunCaseId} valid fixture should not have a blocked decision`);
  }
}

function validate(root) {
  for (const dir of [REPORT_DIR, CONTRACT_REPORT_DIR, FIXTURE_DIR]) {
    assert(fs.existsSync(path.join(root, dir)), `${dir} is missing`);
  }
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
    'tool-route-execution-unlock-3:diagnostics',
    'tool-route-execution-unlock-3:report',
    'tool-route-execution-unlock-3:summary',
  ]) {
    assert(packageJson.scripts?.[script], `Missing package script: ${script}`);
  }

  const decision = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_decision.json`);
  const summary = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_summary.json`);
  const sourceAudit = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_source_of_truth_audit.json`);
  const fixturePresence = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_fixture_presence.json`);
  const caseCoverage = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_case_coverage.json`);
  const schemaContracts = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_schema_contracts.json`);
  const scoringPolicy = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_scoring_policy.json`);
  const validResults = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_valid_fixture_results.json`);
  const invalidResults = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_invalid_fixture_results.json`);
  const noExecution = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_no_execution_policy.json`);
  const redactionScan = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_redaction_scan.json`);

  assert(decision.phase === PHASE, 'decision phase mismatch');
  assert(ALLOWED_DECISIONS.includes(decision.decision), `unexpected decision ${decision.decision}`);
  assert(!FORBIDDEN_DECISIONS.includes(decision.decision), `forbidden execution-ready decision ${decision.decision}`);
  assert(decision.decision === DECISION, `expected ${DECISION}, got ${decision.decision}`);
  assert(decision.readyForOwnerApproval === true, 'owner approval readiness should be true');
  assert(decision.readyForToolExecution === false, 'tool execution readiness must remain false');
  assert(decision.readyForRouteExecution === false, 'route execution readiness must remain false');
  assert(decision.readyForRealExecution === false, 'real execution readiness must remain false');
  assert(decision.generatedLocalFixturePassedClaimed === false, 'generated local fixture pass must not be claimed');
  assert(decision.nextPrompt === NEXT_PROMPT, 'next prompt mismatch');

  assert(sourceAudit.pr377Merged === true, 'PR #377 must be recorded as merged');
  assert(sourceAudit.pr377MergeCommit === '80582655ada1e133a17dd00cff2691f7a9e13655', 'PR #377 merge commit mismatch');
  assert(sourceAudit.sourceOfTruthConflictsFound === false, 'source-of-truth conflict reported');
  assert(sourceAudit.duplicateCompletedOwnerStudiesCreated === false, 'completed owner studies must not be duplicated');

  assert(fixturePresence.allExpectedFixtureFilesPresent === true, 'fixture presence report failed');
  assert(fixturePresence.expectedFixtureFileCount === EXPECTED_FIXTURES.length, 'fixture file count mismatch');
  assert(caseCoverage.caseCount === 18, 'case coverage count must be 18');
  assert(caseCoverage.validFixtureCount === 10, 'valid coverage count must be 10');
  assert(caseCoverage.invalidFixtureCount === 8, 'invalid coverage count must be 8');
  assert(caseCoverage.caseIdsUnique === true, 'case IDs must be unique');
  assert(validResults.validFixtureCount === 10, 'valid fixture result count mismatch');
  assert(validResults.allValidFixturesMetadataAccepted === true, 'valid fixtures must be metadata accepted');
  assert(invalidResults.invalidFixtureCount === 8, 'invalid fixture result count mismatch');
  assert(invalidResults.allInvalidFixturesFailClosed === true, 'invalid fixtures must fail closed');

  assert(schemaContracts.routeRequestSchemaPresent === true, 'route request schema missing');
  assert(schemaContracts.toolRequestSchemaPresent === true, 'tool request schema missing');
  assert(schemaContracts.routeResultSchemaPresent === true, 'route result schema missing');
  assert(schemaContracts.toolResultSchemaPresent === true, 'tool result schema missing');
  assert(scoringPolicy.scoringPolicyPresent === true, 'scoring policy missing');
  assert(scoringPolicy.runtimeScoreCanOverrideSafety === false, 'runtime score must not override safety');
  assert(noExecution.policyStatus === 'all_runtime_gates_closed', 'no-execution policy mismatch');
  assert(redactionScan.secretValuesFound === false, 'redaction scan reports secret values');

  const cases = readJson(root, `${FIXTURE_DIR}/tool_route_dry_run_cases.json`);
  const valid = readJson(root, `${FIXTURE_DIR}/tool_route_valid_request_fixtures.json`);
  const invalid = readJson(root, `${FIXTURE_DIR}/tool_route_invalid_request_fixtures.json`);
  const expectedResults = readJson(root, `${FIXTURE_DIR}/tool_route_expected_result_fixtures.json`);
  const scoring = readJson(root, `${FIXTURE_DIR}/tool_route_scoring_policy.json`);
  const manifest = readJson(root, `${FIXTURE_DIR}/tool_route_fixture_manifest.json`);
  const checksums = readJson(root, `${FIXTURE_DIR}/tool_route_fixture_checksums.json`);
  const schemaVersions = readJson(root, `${FIXTURE_DIR}/tool_route_fixture_schema_versions.json`);

  assert(cases.caseCount === 18, 'case fixture count must be 18');
  assert(valid.fixtureCount === 10, 'valid fixture count must be 10');
  assert(invalid.fixtureCount === 8, 'invalid fixture count must be 8');
  assert(expectedResults.fixtureCount === 18, 'expected result count must be 18');
  assert(scoring.scoringPolicyRef === 'scoring_policy_ref:tool_route_dry_run_contract_v1', 'scoring policy ref mismatch');
  assert(scoring.runtimeScoreCanOverrideSafety === false, 'scoring policy must fail closed on safety');
  assert(manifest.caseCount === 18, 'manifest case count must be 18');
  assert(manifest.validFixtureCount === 10, 'manifest valid fixture count must be 10');
  assert(manifest.invalidFixtureCount === 8, 'manifest invalid fixture count must be 8');
  assert(checksums.checksumAlgorithm === 'sha256_canonical_json_content_only', 'checksum algorithm mismatch');
  assert(schemaVersions.requestSchema === 'tool_route_dry_run_request_contract_v1', 'request schema mismatch');
  assert(schemaVersions.resultSchema === 'tool_route_dry_run_result_contract_v1', 'result schema mismatch');

  const caseIds = cases.cases.map((entry) => entry.toolRouteDryRunCaseId);
  assert(new Set(caseIds).size === caseIds.length, 'case IDs are not unique');
  for (const caseId of REQUIRED_CASES) {
    assert(caseIds.includes(caseId), `missing dry-run case ${caseId}`);
  }
  for (const caseId of VALID_CASES) {
    assert(valid.fixtures.some((fixture) => fixture.toolRouteDryRunCaseId === caseId), `missing valid fixture ${caseId}`);
  }
  for (const caseId of INVALID_CASES) {
    assert(invalid.fixtures.some((fixture) => fixture.toolRouteDryRunCaseId === caseId), `missing invalid fixture ${caseId}`);
  }

  for (const fixture of valid.fixtures) validateFixtureShape(fixture, false);
  for (const fixture of invalid.fixtures) validateFixtureShape(fixture, true);
  for (const result of expectedResults.fixtures) {
    assertRequiredFields(result.toolRouteDryRunCaseId, Object.keys(result), REQUIRED_RESULT_FIELDS);
    assert(result.sourceOfTruthRequirement?.resourcesCreated === false, `${result.toolRouteDryRunCaseId} result creates resources`);
  }

  for (const schemaName of ['routeRequest', 'toolRequest']) {
    const schema = schemaContracts.schemas[schemaName];
    assertRequiredFields(`${schemaName} required fields`, schema.requiredFields, REQUIRED_REQUEST_FIELDS);
    for (const field of REQUIRED_BLOCKED_FIELDS) {
      assert(schema.blockedFields.includes(field), `${schemaName} missing blocked field ${field}`);
    }
  }
  for (const schemaName of ['routeResult', 'toolResult']) {
    const schema = schemaContracts.schemas[schemaName];
    assertRequiredFields(`${schemaName} required fields`, schema.requiredFields, REQUIRED_RESULT_FIELDS);
  }

  for (const report of EXPECTED_REPORTS) {
    const relativePath = `${REPORT_DIR}/${report}`;
    assertRuntimeFlagsFalse(report, readJson(root, relativePath));
    assertNoForbiddenText(root, relativePath);
  }
  for (const fixture of EXPECTED_FIXTURES) {
    const relativePath = `${FIXTURE_DIR}/${fixture}`;
    assertRuntimeFlagsFalse(fixture, readJson(root, relativePath));
    assertNoForbiddenText(root, relativePath);
  }
  for (const doc of REQUIRED_DOCS) {
    assertNoForbiddenText(root, doc);
  }

  return {
    status: 'passed',
    phase: PHASE,
    decision: decision.decision,
    readyForOwnerApproval: decision.readyForOwnerApproval,
    readyForToolExecution: false,
    readyForRouteExecution: false,
    readyForRealExecution: false,
    caseCount: cases.caseCount,
    validFixtureCount: valid.fixtureCount,
    invalidFixtureCount: invalid.fixtureCount,
    expectedReports: EXPECTED_REPORTS.length,
    expectedFixtures: EXPECTED_FIXTURES.length,
    runtimeFlagsClosed: true,
    generatedLocalFixturePassedClaimed: false,
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
