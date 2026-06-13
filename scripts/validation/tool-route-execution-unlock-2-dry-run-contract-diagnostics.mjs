import fs from 'node:fs';
import path from 'node:path';

const PHASE = 'TOOL-ROUTE-EXECUTION-UNLOCK-2';
const REPORT_DIR = 'docs/activation-tool-route-execution-unlock-2-dry-run-contract-reports';
const FIXTURE_DIR = 'docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures';
const DECISION = 'tool_route_dry_run_contract_ready_with_warnings';
const NEXT_PROMPT =
  'TOOL-ROUTE-EXECUTION-UNLOCK-3: tool-route execution dry-run validation, no execution';

const EXPECTED_REPORTS = [
  'tool_route_dry_run_contract_decision.json',
  'tool_route_dry_run_contract_source_of_truth_audit.json',
  'tool_route_dry_run_contract_schema_inventory.json',
  'tool_route_dry_run_contract_fixture_inventory.json',
  'tool_route_intent_to_capability_contract.json',
  'tool_route_capability_to_tool_contract.json',
  'tool_route_candidate_scoring_contract.json',
  'tool_route_route_request_schema_contract.json',
  'tool_route_tool_request_schema_contract.json',
  'tool_route_route_result_schema_contract.json',
  'tool_route_tool_result_schema_contract.json',
  'tool_route_blocked_raw_prompt_contract.json',
  'tool_route_blocked_signed_url_public_artifact_contract.json',
  'tool_route_blocked_runtime_execution_contract.json',
  'tool_route_worker_handoff_contract.json',
  'tool_route_provider_handoff_contract.json',
  'tool_route_supabase_handoff_contract.json',
  'tool_route_observability_cost_contract.json',
  'tool_route_billing_credit_contract.json',
  'tool_route_no_execution_policy.json',
  'tool_route_dry_run_contract_summary.json',
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
  'docs/tool-route-execution-unlock-2-dry-run-contract.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-3-dry-run-validation.md',
];

const SOURCE_DOCS = [
  'docs/activation-tool-route-execution-unlock-1-dry-run-plan-reports/tool_route_dry_run_plan_decision.json',
  'docs/activation-tool-route-execution-unlock-1-dry-run-plan-reports/tool_route_dry_run_case_matrix.json',
  'docs/activation-tool-route-execution-unlock-0-repo-audit-reports/tool_route_repo_audit_decision.json',
  'docs/activation-tool-route-execution-unlock-0-repo-audit-reports/tool_route_completed_tool_study_rollup.json',
  'docs/tool-studies/ai-tools-creative-graphics-tool-study.md',
  'docs/tool-studies/track-a-render-export-tool-study.md',
  'docs/tool-studies/track-b-media-processing-tool-study.md',
  'docs/tool-studies/sound-music-audio-tool-study.md',
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

const REQUIRED_REQUEST_FIELDS = [
  'toolRouteDryRunCaseId',
  'userIntentClass',
  'syntheticInputRef',
  'structuredAgentFindingsRef',
  'editIntentsRef',
  'approvedPlanSnapshotRef',
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
  'tool_route_dry_run_contract_ready',
  'tool_route_dry_run_contract_ready_with_warnings',
  'tool_route_dry_run_contract_blocked_missing_request_schema',
  'tool_route_dry_run_contract_blocked_missing_result_schema',
  'tool_route_dry_run_contract_blocked_missing_fixture_coverage',
  'tool_route_dry_run_contract_blocked_missing_scoring_policy',
  'tool_route_dry_run_contract_blocked_missing_handoff_contract',
  'tool_route_dry_run_contract_blocked_source_of_truth_conflict',
];

const FALSE_RUNTIME_FLAGS = [
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'jobDispatchAllowed',
  'jobClaimAllowed',
  'jobLeaseAllowed',
  'providerExecutionAllowed',
  'modelCallAllowed',
  'supabaseWriteAllowed',
  'sqlExecutionAllowed',
  'migrationAllowed',
  'storageWriteAllowed',
  'signedUrlCreationAllowed',
  'publicArtifactCreationAllowed',
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
  'betaReady',
  'productionReady',
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

function validate(root) {
  for (const dir of [REPORT_DIR, FIXTURE_DIR]) {
    assert(fs.existsSync(path.join(root, dir)), `${dir} is missing`);
  }
  for (const file of EXPECTED_REPORTS) {
    assert(fs.existsSync(path.join(root, REPORT_DIR, file)), `${file} is missing`);
  }
  for (const file of EXPECTED_FIXTURES) {
    assert(fs.existsSync(path.join(root, FIXTURE_DIR, file)), `${file} is missing`);
  }
  for (const file of [...REQUIRED_DOCS, ...SOURCE_DOCS]) {
    assert(fs.existsSync(path.join(root, file)), `${file} is missing`);
  }

  const packageJson = readJson(root, 'package.json');
  for (const script of [
    'tool-route-execution-unlock-2:diagnostics',
    'tool-route-execution-unlock-2:report',
    'tool-route-execution-unlock-2:summary',
  ]) {
    assert(packageJson.scripts?.[script], `Missing package script: ${script}`);
  }

  const decision = readJson(root, `${REPORT_DIR}/tool_route_dry_run_contract_decision.json`);
  const summary = readJson(root, `${REPORT_DIR}/tool_route_dry_run_contract_summary.json`);
  const sourceAudit = readJson(root, `${REPORT_DIR}/tool_route_dry_run_contract_source_of_truth_audit.json`);
  const schemaInventory = readJson(root, `${REPORT_DIR}/tool_route_dry_run_contract_schema_inventory.json`);
  const fixtureInventory = readJson(root, `${REPORT_DIR}/tool_route_dry_run_contract_fixture_inventory.json`);
  const noExecution = readJson(root, `${REPORT_DIR}/tool_route_no_execution_policy.json`);

  assert(decision.phase === PHASE, 'decision phase mismatch');
  assert(ALLOWED_DECISIONS.includes(decision.decision), `unexpected decision ${decision.decision}`);
  assert(decision.decision === DECISION, `expected ${DECISION}, got ${decision.decision}`);
  assert(decision.readyForDryRunValidation === true, 'dry-run validation readiness should be true');
  assert(decision.readyForToolExecution === false, 'tool execution readiness must remain false');
  assert(decision.readyForRouteExecution === false, 'route execution readiness must remain false');
  assert(decision.readyForRealExecution === false, 'real execution readiness must remain false');
  assert(decision.nextPrompt === NEXT_PROMPT, 'next prompt mismatch');
  assert(sourceAudit.sourceOfTruthConflictsFound === false, 'source-of-truth conflict reported');
  assert(sourceAudit.hardBlockerDetected === false, 'hard blocker reported');
  assert(sourceAudit.duplicateCompletedOwnerStudiesCreated === false, 'completed owner studies must not be duplicated');

  assert(summary.caseCount === 18, 'summary case count must be 18');
  assert(summary.validFixtureCount === 10, 'summary valid fixture count must be 10');
  assert(summary.invalidFixtureCount === 8, 'summary invalid fixture count must be 8');
  assert(summary.schemaContractsPresent === true, 'schema contracts must be present');
  assert(summary.scoringPolicyPresent === true, 'scoring policy must be present');
  assert(summary.handoffContractsPresent === true, 'handoff contracts must be present');
  assert(fixtureInventory.fixtureInventory.caseCount === 18, 'fixture inventory case count must be 18');

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
  assert(expectedResults.fixtureCount === 18, 'expected result fixture count must be 18');
  assert(scoring.scoringPolicyRef === 'scoring_policy_ref:tool_route_dry_run_contract_v1', 'scoring policy ref mismatch');
  assert(manifest.fixtureFiles.length >= EXPECTED_FIXTURES.length - 2, 'manifest should list generated fixture files');
  assert(checksums.checksumAlgorithm === 'sha256_canonical_json_content_only', 'checksum algorithm mismatch');
  assert(schemaVersions.requestSchema === 'tool_route_dry_run_request_contract_v1', 'request schema version mismatch');
  assert(schemaVersions.resultSchema === 'tool_route_dry_run_result_contract_v1', 'result schema version mismatch');

  const caseIds = new Set(cases.cases.map((entry) => entry.toolRouteDryRunCaseId));
  for (const caseId of REQUIRED_CASES) {
    assert(caseIds.has(caseId), `missing contract case ${caseId}`);
  }

  for (const fixture of [...valid.fixtures, ...invalid.fixtures]) {
    assertRequiredFields(fixture.toolRouteDryRunCaseId, Object.keys(fixture), REQUIRED_REQUEST_FIELDS);
    assert(fixture.syntheticInputRef.startsWith('synthetic_input_ref:synthetic_'), `${fixture.toolRouteDryRunCaseId} has non-synthetic input ref`);
    assert(fixture.structuredAgentFindingsRef.startsWith('structured_agent_findings_ref:synthetic_'), `${fixture.toolRouteDryRunCaseId} has non-synthetic findings ref`);
    assert(fixture.editIntentsRef.startsWith('edit_intents_ref:synthetic_'), `${fixture.toolRouteDryRunCaseId} has non-synthetic edit intents ref`);
    assert(fixture.approvedPlanSnapshotRef.startsWith('approved_plan_snapshot_ref:synthetic_'), `${fixture.toolRouteDryRunCaseId} has non-synthetic approved snapshot ref`);
    assert(fixture.sourceOfTruthRequirement?.resourcesCreated === false, `${fixture.toolRouteDryRunCaseId} must not create resources`);
    assert(fixture.artifactPolicy?.publicArtifactAllowed === false, `${fixture.toolRouteDryRunCaseId} must block public artifacts`);
    assert(fixture.signedUrlPolicy?.signedUrlCreationAllowed === false, `${fixture.toolRouteDryRunCaseId} must block signed URLs`);
    assert(fixture.publicArtifactPolicy?.publicArtifactCreationAllowed === false, `${fixture.toolRouteDryRunCaseId} must block public artifact creation`);
    for (const field of REQUIRED_BLOCKED_FIELDS) {
      assert(fixture.blockedFieldClasses.includes(field), `${fixture.toolRouteDryRunCaseId} missing blocked field ${field}`);
    }
  }
  for (const fixture of valid.fixtures) {
    assert(fixture.selectedCandidate, `${fixture.toolRouteDryRunCaseId} must have selected candidate`);
    assert(fixture.blockedDecision === null, `${fixture.toolRouteDryRunCaseId} should not have blocked decision`);
  }
  for (const fixture of invalid.fixtures) {
    assert(fixture.selectedCandidate === null, `${fixture.toolRouteDryRunCaseId} must not have selected candidate`);
    assert(typeof fixture.blockedDecision === 'string' && fixture.blockedDecision.length > 0, `${fixture.toolRouteDryRunCaseId} must fail closed`);
  }
  for (const result of expectedResults.fixtures) {
    assertRequiredFields(result.toolRouteDryRunCaseId, Object.keys(result), REQUIRED_RESULT_FIELDS);
  }

  const routeRequest = schemaInventory.schemaInventory.routeRequestSchema;
  const toolRequest = schemaInventory.schemaInventory.toolRequestSchema;
  const routeResult = schemaInventory.schemaInventory.routeResultSchema;
  const toolResult = schemaInventory.schemaInventory.toolResultSchema;
  assertRequiredFields('route request schema', routeRequest.requiredFields, REQUIRED_REQUEST_FIELDS);
  assertRequiredFields('tool request schema', toolRequest.requiredFields, REQUIRED_REQUEST_FIELDS);
  assertRequiredFields('route result schema', routeResult.requiredFields, REQUIRED_RESULT_FIELDS);
  assertRequiredFields('tool result schema', toolResult.requiredFields, REQUIRED_RESULT_FIELDS);
  for (const blockedField of REQUIRED_BLOCKED_FIELDS) {
    assert(routeRequest.blockedFields.includes(blockedField), `route request schema missing blocked field ${blockedField}`);
    assert(toolRequest.blockedFields.includes(blockedField), `tool request schema missing blocked field ${blockedField}`);
  }

  assert(noExecution.policyStatus === 'all_runtime_gates_closed', 'no-execution policy mismatch');
  assert(noExecution.generatedLocalFixturePassedClaimed === false, 'generated local fixture claim must remain false');

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
    readyForDryRunValidation: decision.readyForDryRunValidation,
    readyForToolExecution: false,
    readyForRouteExecution: false,
    caseCount: cases.caseCount,
    validFixtureCount: valid.fixtureCount,
    invalidFixtureCount: invalid.fixtureCount,
    expectedReports: EXPECTED_REPORTS.length,
    expectedFixtures: EXPECTED_FIXTURES.length,
    runtimeFlagsClosed: true,
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
