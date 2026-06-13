import fs from 'node:fs';
import path from 'node:path';

const PHASE = 'TOOL-ROUTE-EXECUTION-UNLOCK-1';
const REPORT_DIR = 'docs/activation-tool-route-execution-unlock-1-dry-run-plan-reports';
const DECISION = 'tool_route_dry_run_plan_ready_with_warnings';
const NEXT_PROMPT =
  'TOOL-ROUTE-EXECUTION-UNLOCK-2: tool-route execution dry-run contract, no execution';

const EXPECTED_REPORTS = [
  'tool_route_dry_run_plan_decision.json',
  'tool_route_dry_run_source_of_truth_audit.json',
  'tool_route_dry_run_scope.json',
  'tool_route_dry_run_case_matrix.json',
  'tool_route_capability_routing_decision_matrix.json',
  'tool_route_intent_to_capability_fixture_plan.json',
  'tool_route_capability_to_tool_fixture_plan.json',
  'tool_route_tool_candidate_scoring_plan.json',
  'tool_route_route_request_schema_plan.json',
  'tool_route_tool_request_schema_plan.json',
  'tool_route_route_result_schema_plan.json',
  'tool_route_tool_result_schema_plan.json',
  'tool_route_blocked_raw_prompt_fixture_plan.json',
  'tool_route_blocked_signed_url_public_artifact_fixture_plan.json',
  'tool_route_blocked_runtime_execution_fixture_plan.json',
  'tool_route_worker_handoff_plan.json',
  'tool_route_provider_handoff_plan.json',
  'tool_route_supabase_handoff_plan.json',
  'tool_route_observability_cost_plan.json',
  'tool_route_billing_credit_plan.json',
  'tool_route_tracka_trackb_handoff_plan.json',
  'tool_route_no_execution_policy.json',
  'tool_route_dry_run_plan_summary.json',
];

const REQUIRED_DOCS = [
  'docs/tool-route-execution-unlock-1-dry-run-plan.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-2-dry-run-contract.md',
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
  'betaProductionTarget',
  'realUserData',
  'privateProjectPayload',
  'mediaPayload',
];

const REQUIRED_SCHEMA_FIELDS = [
  'approvedPlanSnapshotRef',
  'approvedPlanSnapshotHash',
  'planSnapshotSchemaVersion',
  'structuredFindingsRef',
  'editIntentRef',
  'candidateCapabilityIds',
  'candidateToolIds',
  'candidateRouteIds',
  'scoringPolicyRef',
  'sourceTruthRefs',
  'artifactPolicyRef',
  'idempotencyKey',
  'correlationId',
  'auditCostRef',
  'billingPolicyRef',
  'validationEvidenceRefs',
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
  'productionUnlockAllowed',
  'demucsExecutionAllowed',
  'trackARenderExecutionAllowed',
  'trackBMediaExecutionAllowed',
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
  { label: 'real url', pattern: /https?:\/\//i },
  { label: 'raw provider output assignment', pattern: /rawProviderOutput\s*[:=]\s*['"][^'"]+/i },
  { label: 'env file marker', pattern: /(^|\/)\.env(\.|$)/i },
  { label: 'generated local fixture pass claim', pattern: /generatedLocalFixturePassedClaimed\s*[:=]\s*true/i },
];

function readJson(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

function assertRuntimeFlagsFalse(reportName, value) {
  flattenValues(value, (key, child) => {
    if (FALSE_RUNTIME_FLAGS.includes(key)) {
      assert(child === false, `${reportName} has unsafe true flag ${key}`);
    }
  });
}

function assertNoForbiddenText(root, relativePath) {
  const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
  for (const { label, pattern } of FORBIDDEN_TEXT_PATTERNS) {
    assert(!pattern.test(text), `${relativePath} contains forbidden ${label}`);
  }
}

function validate(root) {
  const reportRoot = path.join(root, REPORT_DIR);
  assert(fs.existsSync(reportRoot), `${REPORT_DIR} is missing`);

  for (const reportName of EXPECTED_REPORTS) {
    assert(fs.existsSync(path.join(reportRoot, reportName)), `${reportName} is missing`);
  }
  for (const doc of REQUIRED_DOCS) {
    assert(fs.existsSync(path.join(root, doc)), `${doc} is missing`);
  }

  const decision = readJson(root, `${REPORT_DIR}/tool_route_dry_run_plan_decision.json`);
  const summary = readJson(root, `${REPORT_DIR}/tool_route_dry_run_plan_summary.json`);
  const sourceAudit = readJson(root, `${REPORT_DIR}/tool_route_dry_run_source_of_truth_audit.json`);
  const cases = readJson(root, `${REPORT_DIR}/tool_route_dry_run_case_matrix.json`);
  const routeRequest = readJson(root, `${REPORT_DIR}/tool_route_route_request_schema_plan.json`);
  const toolRequest = readJson(root, `${REPORT_DIR}/tool_route_tool_request_schema_plan.json`);
  const noExecution = readJson(root, `${REPORT_DIR}/tool_route_no_execution_policy.json`);

  assert(decision.phase === PHASE, 'decision phase mismatch');
  assert(decision.decision === DECISION, `unexpected decision ${decision.decision}`);
  assert(decision.readyForDryRunContract === true, 'dry-run contract readiness should be true');
  assert(decision.readyForRealExecution === false, 'real execution readiness must remain false');
  assert(decision.nextPrompt === NEXT_PROMPT, 'next prompt mismatch');

  assert(summary.syntheticCaseCount === 18, 'summary synthetic case count must be 18');
  assert(summary.validPlanningCaseCount === 10, 'summary valid planning case count must be 10');
  assert(summary.blockedPlanningCaseCount === 8, 'summary blocked planning case count must be 8');
  assert(summary.duplicateCompletedOwnerStudiesCreated === false, 'duplicate completed-owner studies must not be created');
  assert(sourceAudit.duplicateCompletedOwnerStudiesCreated === false, 'source audit duplicate completed-owner guard failed');
  assert(sourceAudit.hardBlockerDetected === false, 'source audit unexpectedly reports hard blocker');

  assert(cases.caseCount === 18, 'case matrix case count must be 18');
  const caseIds = new Set(cases.cases.map((entry) => entry.caseId));
  for (const caseId of REQUIRED_CASES) {
    assert(caseIds.has(caseId), `missing synthetic case ${caseId}`);
  }
  for (const entry of cases.cases) {
    assert(entry.sourceOfTruthRefs?.supabaseRowRef?.startsWith('supabase_row_ref:synthetic_'), `${entry.caseId} missing synthetic Supabase row ref`);
    assert(entry.sourceOfTruthRefs?.privateGcsPathRef?.startsWith('private_gcs_path_ref:synthetic_'), `${entry.caseId} missing synthetic private GCS path ref`);
    assert(entry.sourceOfTruthRefs?.manifestRef?.startsWith('manifest_ref:synthetic_'), `${entry.caseId} missing synthetic manifest ref`);
    assert(entry.sourceOfTruthRefs?.checksumRef?.startsWith('checksum_ref:synthetic_'), `${entry.caseId} missing synthetic checksum ref`);
    assert(entry.sourceOfTruthRefs?.approvedPlanSnapshotRef?.startsWith('approved_plan_snapshot_ref:synthetic_'), `${entry.caseId} missing synthetic approved snapshot ref`);
    assert(entry.rawPromptAccepted === false, `${entry.caseId} must reject raw prompts`);
    assert(entry.rawProviderOutputAccepted === false, `${entry.caseId} must reject raw provider output`);
    assert(entry.directToolInvocationAccepted === false, `${entry.caseId} must reject direct tool invocation`);
    assert(entry.directRouteInvocationAccepted === false, `${entry.caseId} must reject direct route invocation`);
  }

  for (const field of REQUIRED_SCHEMA_FIELDS) {
    assert(routeRequest.requiredFields.includes(field), `route request schema missing ${field}`);
    assert(toolRequest.requiredFields.includes(field), `tool request schema missing ${field}`);
  }
  for (const field of REQUIRED_BLOCKED_FIELDS) {
    assert(routeRequest.blockedFields.includes(field), `route request blocked fields missing ${field}`);
    assert(toolRequest.blockedFields.includes(field), `tool request blocked fields missing ${field}`);
  }

  assert(noExecution.policyStatus === 'all_runtime_gates_closed', 'no-execution policy status mismatch');
  assert(noExecution.generatedLocalFixturePassedClaimed === false, 'generated local fixture claim must remain false');

  for (const reportName of EXPECTED_REPORTS) {
    const relativePath = `${REPORT_DIR}/${reportName}`;
    const report = readJson(root, relativePath);
    assertRuntimeFlagsFalse(reportName, report);
    assertNoForbiddenText(root, relativePath);
  }
  for (const doc of REQUIRED_DOCS) {
    assertNoForbiddenText(root, doc);
  }

  return {
    status: 'passed',
    phase: PHASE,
    decision: decision.decision,
    readyForDryRunContract: decision.readyForDryRunContract,
    readyForRealExecution: decision.readyForRealExecution,
    syntheticCaseCount: cases.caseCount,
    expectedReports: EXPECTED_REPORTS.length,
    runtimeFlagsClosed: true,
    duplicateCompletedOwnerStudiesCreated: false,
    nextPrompt: decision.nextPrompt,
  };
}

try {
  const root = process.cwd();
  const result = validate(root);
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
