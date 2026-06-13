import fs from 'node:fs';
import path from 'node:path';

const PHASE = 'TOOL-ROUTE-EXECUTION-UNLOCK-4';
const REPORT_DIR = 'docs/activation-tool-route-execution-unlock-4-owner-approval-reports';
const DECISION = 'tool_route_owner_approved_with_warnings_for_next_dry_run_gate';
const NEXT_PROMPT =
  'TOOL-ROUTE-EXECUTION-UNLOCK-5: tool-route dry-run gate status packet, no execution';

const EXPECTED_REPORTS = [
  'tool_route_owner_approval_decision.json',
  'tool_route_owner_approval_source_of_truth_audit.json',
  'tool_route_dry_run_validation_evidence_acceptance.json',
  'tool_route_dependency_validation_handoff_acceptance.json',
  'tool_route_capability_routing_owner_acceptance.json',
  'tool_route_schema_contract_owner_acceptance.json',
  'tool_route_fixture_coverage_owner_acceptance.json',
  'tool_route_blocked_case_owner_acceptance.json',
  'tool_route_worker_handoff_owner_status.json',
  'tool_route_provider_handoff_owner_status.json',
  'tool_route_supabase_handoff_owner_status.json',
  'tool_route_observability_cost_owner_status.json',
  'tool_route_billing_credit_owner_status.json',
  'tool_route_tracka_trackb_owner_status.json',
  'tool_route_runtime_execution_blocker_register.json',
  'tool_route_no_execution_owner_policy.json',
  'tool_route_owner_approval_summary.json',
];

const REQUIRED_DOCS = [
  'docs/tool-route-execution-unlock-4-owner-approval.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-5-dry-run-gate-status.md',
];

const SOURCE_DOCS = [
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_decision.json',
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
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
  'docs/activation-product-internal-testing-session-0-reports/session_0_decision.json',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json',
];

const ALLOWED_DECISIONS = [
  'tool_route_owner_approved_for_next_dry_run_gate',
  'tool_route_owner_approved_with_warnings_for_next_dry_run_gate',
  'tool_route_owner_approval_blocked_missing_validation_evidence',
  'tool_route_owner_approval_blocked_missing_dependency_validation',
  'tool_route_owner_approval_blocked_missing_handoff_owner',
  'tool_route_owner_approval_blocked_source_of_truth_conflict',
  'tool_route_owner_approval_blocked_runtime_gate_ambiguity',
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
  { label: 'unsafe dry-run pass claim', pattern: new RegExp('dry' + '_run_passed', 'i') },
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
    'tool-route-execution-unlock-4:diagnostics',
    'tool-route-execution-unlock-4:report',
    'tool-route-execution-unlock-4:summary',
  ]) {
    assert(packageJson.scripts?.[script], `Missing package script: ${script}`);
  }

  const decision = readJson(root, `${REPORT_DIR}/tool_route_owner_approval_decision.json`);
  const summary = readJson(root, `${REPORT_DIR}/tool_route_owner_approval_summary.json`);
  const sourceAudit = readJson(root, `${REPORT_DIR}/tool_route_owner_approval_source_of_truth_audit.json`);
  const validationAcceptance = readJson(root, `${REPORT_DIR}/tool_route_dry_run_validation_evidence_acceptance.json`);
  const dependencyAcceptance = readJson(root, `${REPORT_DIR}/tool_route_dependency_validation_handoff_acceptance.json`);
  const capabilityAcceptance = readJson(root, `${REPORT_DIR}/tool_route_capability_routing_owner_acceptance.json`);
  const schemaAcceptance = readJson(root, `${REPORT_DIR}/tool_route_schema_contract_owner_acceptance.json`);
  const fixtureAcceptance = readJson(root, `${REPORT_DIR}/tool_route_fixture_coverage_owner_acceptance.json`);
  const blockedAcceptance = readJson(root, `${REPORT_DIR}/tool_route_blocked_case_owner_acceptance.json`);
  const workerStatus = readJson(root, `${REPORT_DIR}/tool_route_worker_handoff_owner_status.json`);
  const providerStatus = readJson(root, `${REPORT_DIR}/tool_route_provider_handoff_owner_status.json`);
  const supabaseStatus = readJson(root, `${REPORT_DIR}/tool_route_supabase_handoff_owner_status.json`);
  const noExecution = readJson(root, `${REPORT_DIR}/tool_route_no_execution_owner_policy.json`);

  assert(decision.phase === PHASE, 'decision phase mismatch');
  assert(ALLOWED_DECISIONS.includes(decision.decision), `unexpected decision ${decision.decision}`);
  assert(!FORBIDDEN_DECISIONS.includes(decision.decision), `forbidden decision ${decision.decision}`);
  assert(decision.decision === DECISION, `expected ${DECISION}, got ${decision.decision}`);
  assert(decision.nextPrompt === NEXT_PROMPT, 'next prompt mismatch');
  assert(decision.readyForNextGateStatusPacket === true, 'next gate status should be ready');
  assert(decision.dryRunPassedClaimed === false, 'dry-run pass must not be claimed');
  assert(decision.generatedLocalFixturePassedClaimed === false, 'generated local fixture pass must not be claimed');
  assert(decision.readyForToolExecution === false, 'tool execution readiness must remain false');
  assert(decision.readyForRouteExecution === false, 'route execution readiness must remain false');
  assert(decision.readyForWorkerExecution === false, 'worker execution readiness must remain false');
  assert(decision.readyForSupabasePersistence === false, 'Supabase persistence readiness must remain false');

  assert(sourceAudit.pr381?.state === 'merged', 'PR #381 must be recorded as merged');
  assert(sourceAudit.pr381?.mergeCommit === '7e5fb0335fb7ad5be0311bfdf1f19c12a1a6bd05', 'PR #381 merge commit mismatch');
  assert(sourceAudit.sourceOfTruthConflictsFound === false, 'source audit reports conflicts');
  assert(sourceAudit.referencedHistoricalEvidence?.completedOwnerStudiesDuplicated === false, 'completed owner studies must not be duplicated');
  assert(validationAcceptance.accepted === true, 'validation evidence must be accepted');
  assert(validationAcceptance.caseCount === 18, 'validation acceptance case count mismatch');
  assert(validationAcceptance.metadataAcceptedFixtureCount === 10, 'metadata accepted fixture count mismatch');
  assert(validationAcceptance.failClosedFixtureCount === 8, 'fail-closed fixture count mismatch');
  assert(validationAcceptance.readyForOwnerApproval === true, 'validation evidence should be ready for owner approval');
  assert(validationAcceptance.dryRunPassedClaimed === false, 'validation acceptance claims dry-run pass');
  assert(dependencyAcceptance.accepted === true, 'dependency validation handoff must be accepted');
  assert(
    dependencyAcceptance.handoffDecision === 'dependency_validation_passed_with_inherited_readiness_blockers_ready_to_merge',
    'dependency validation handoff decision mismatch',
  );
  assert(dependencyAcceptance.staleMissingNodeModulesWarningSuperseded === true, 'stale dependency warning must be superseded');
  assert(dependencyAcceptance.packageLockChanged === false, 'package lock must not be changed');
  assert(capabilityAcceptance.accepted === true, 'capability routing must be accepted');
  assert(capabilityAcceptance.completedOwnerStudiesDuplicated === false, 'completed owners duplicated');
  assert(schemaAcceptance.accepted === true, 'schema contracts must be accepted');
  assert(fixtureAcceptance.accepted === true, 'fixture coverage must be accepted');
  assert(fixtureAcceptance.caseCount === 18, 'fixture coverage case count mismatch');
  assert(blockedAcceptance.accepted === true, 'blocked cases must be accepted');
  assert(blockedAcceptance.blockedCaseCount === 8, 'blocked case count mismatch');
  assert(blockedAcceptance.allBlockedCasesFailClosed === true, 'blocked cases must fail closed');
  assert(workerStatus.status === 'handoff_required_real_execution_blocked', 'worker handoff status mismatch');
  assert(providerStatus.status === 'handoff_required_provider_runtime_blocked', 'provider handoff status mismatch');
  assert(supabaseStatus.status === 'handoff_required_persistence_blocked', 'Supabase handoff status mismatch');
  assert(supabaseStatus.supabaseUpdateRequired === false, 'Supabase update must not be required');
  assert(noExecution.policyStatus === 'all_runtime_gates_closed', 'no-execution policy mismatch');
  assert(summary.decision === DECISION, 'summary decision mismatch');
  assert(summary.nextPrompt === NEXT_PROMPT, 'summary next prompt mismatch');
  assert(summary.dryRunPassedClaimed !== true, 'summary claims dry-run pass');

  for (const report of EXPECTED_REPORTS) {
    const relativePath = `${REPORT_DIR}/${report}`;
    assertRuntimeFlagsFalse(report, readJson(root, relativePath));
    assertNoForbiddenText(root, relativePath);
  }
  for (const doc of REQUIRED_DOCS) {
    assertNoForbiddenText(root, doc);
  }
  assertNoForbiddenRuntimeImports(root, 'scripts/validation/tool-route-execution-unlock-4-owner-approval-diagnostics.mjs');

  return {
    status: 'passed',
    phase: PHASE,
    decision: decision.decision,
    readyForNextGateStatusPacket: decision.readyForNextGateStatusPacket,
    readyForToolExecution: false,
    readyForRouteExecution: false,
    readyForWorkerExecution: false,
    readyForSupabasePersistence: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
    caseCount: validationAcceptance.caseCount,
    metadataAcceptedFixtureCount: validationAcceptance.metadataAcceptedFixtureCount,
    failClosedFixtureCount: validationAcceptance.failClosedFixtureCount,
    expectedReports: EXPECTED_REPORTS.length,
    runtimeFlagsClosed: true,
    dependencyValidationHandoffAccepted: dependencyAcceptance.accepted,
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
