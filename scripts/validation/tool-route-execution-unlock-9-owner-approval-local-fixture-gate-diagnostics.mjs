import fs from 'node:fs';
import path from 'node:path';

const PHASE = 'TOOL-ROUTE-EXECUTION-UNLOCK-9';
const REPORT_DIR =
  'docs/activation-tool-route-execution-unlock-9-owner-approval-local-fixture-gate-reports';
const DECISION = 'tool_route_owner_approved_with_warnings_for_local_fixture_gate_status_packet';
const NEXT_PROMPT =
  'TOOL-ROUTE-EXECUTION-UNLOCK-10: tool-route local fixture gate status packet, no execution';

const EXPECTED_REPORTS = [
  'tool_route_local_fixture_owner_approval_decision.json',
  'tool_route_local_fixture_owner_approval_source_of_truth_audit.json',
  'tool_route_local_fixture_validation_evidence_acceptance.json',
  'tool_route_local_fixture_plan_evidence_acceptance.json',
  'tool_route_dry_run_pass_review_evidence_acceptance.json',
  'tool_route_gate_status_evidence_acceptance.json',
  'tool_route_owner_approval_chain_evidence_acceptance.json',
  'tool_route_contract_and_fixture_evidence_acceptance.json',
  'tool_route_dependency_validation_handoff_acceptance.json',
  'tool_route_local_fixture_gate_scope_approval.json',
  'tool_route_remaining_runtime_blocker_register.json',
  'tool_route_dry_run_passed_not_claimed_register.json',
  'tool_route_generated_local_fixture_not_claimed_register.json',
  'tool_route_owner_handoff_status.json',
  'tool_route_no_execution_owner_policy.json',
  'tool_route_local_fixture_owner_approval_summary.json',
];

const REQUIRED_DOCS = [
  'docs/tool-route-execution-unlock-9-owner-approval-local-fixture-gate.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-10-local-fixture-gate-status.md',
];

const SOURCE_DOCS = [
  'docs/activation-tool-route-execution-unlock-8-local-fixture-validation-reports/tool_route_local_fixture_validation_decision.json',
  'docs/activation-tool-route-execution-unlock-8-local-fixture-validation-reports/tool_route_local_fixture_validation_summary.json',
  'docs/activation-tool-route-execution-unlock-8-local-fixture-validation-reports/tool_route_local_fixture_validation_source_of_truth_audit.json',
  'docs/activation-tool-route-execution-unlock-7-local-fixture-plan-reports/tool_route_local_fixture_plan_decision.json',
  'docs/activation-tool-route-execution-unlock-6-dry-run-pass-review-reports/tool_route_dry_run_pass_review_summary.json',
  'docs/activation-tool-route-execution-unlock-5-dry-run-gate-status-reports/tool_route_dry_run_gate_status_decision.json',
  'docs/activation-tool-route-execution-unlock-4-owner-approval-reports/tool_route_owner_approval_decision.json',
  'docs/activation-tool-route-execution-unlock-3-dry-run-validation-reports/tool_route_dry_run_validation_summary.json',
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
  'tool_route_owner_approved_for_local_fixture_gate_status_packet',
  'tool_route_owner_approved_with_warnings_for_local_fixture_gate_status_packet',
  'tool_route_owner_approval_blocked_missing_local_fixture_validation',
  'tool_route_owner_approval_blocked_missing_dependency_validation',
  'tool_route_owner_approval_blocked_runtime_gate_ambiguity',
  'tool_route_owner_approval_blocked_source_of_truth_conflict',
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
  'rawPromptExecutionAllowed',
  'rawProviderOutputPersisted',
  'localFixtureExecutionAllowed',
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
  'readyForToolExecution',
  'readyForRouteExecution',
  'readyForWorkerExecution',
  'readyForSupabasePersistence',
  'runtimeExecutionReadinessClaimed',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
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
  { label: 'unsafe generated fixture pass claim', pattern: /generatedLocalFixturePassedClaimed\s*[:=]\s*true/i },
  { label: 'unsafe dry-run pass claim', pattern: /dryRunPassedClaimed\s*[:=]\s*true/i },
  { label: 'unsafe snake dry-run pass claim', pattern: /dry_run_passed\s*[:=]\s*true/i },
  { label: 'unsafe snake generated local fixture pass claim', pattern: /generated_local_fixture_passed\s*[:=]\s*true/i },
  { label: 'tool-route execution ready claim', pattern: /tool[_-]?route[_-]?execution[_-]?ready\s*[:=]\s*true/i },
  { label: 'env file marker', pattern: /(^|\/)\.env(\.|$)/i },
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
    'tool-route-execution-unlock-9:diagnostics',
    'tool-route-execution-unlock-9:report',
    'tool-route-execution-unlock-9:summary',
  ]) {
    assert(packageJson.scripts?.[script], `Missing package script: ${script}`);
  }

  const decision = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_owner_approval_decision.json`);
  const sourceAudit = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_owner_approval_source_of_truth_audit.json`);
  const validationAcceptance = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_validation_evidence_acceptance.json`);
  const dependencyAcceptance = readJson(root, `${REPORT_DIR}/tool_route_dependency_validation_handoff_acceptance.json`);
  const scopeApproval = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_gate_scope_approval.json`);
  const blockerRegister = readJson(root, `${REPORT_DIR}/tool_route_remaining_runtime_blocker_register.json`);
  const dryRun = readJson(root, `${REPORT_DIR}/tool_route_dry_run_passed_not_claimed_register.json`);
  const generated = readJson(root, `${REPORT_DIR}/tool_route_generated_local_fixture_not_claimed_register.json`);
  const ownerHandoff = readJson(root, `${REPORT_DIR}/tool_route_owner_handoff_status.json`);
  const noExecution = readJson(root, `${REPORT_DIR}/tool_route_no_execution_owner_policy.json`);
  const summary = readJson(root, `${REPORT_DIR}/tool_route_local_fixture_owner_approval_summary.json`);

  assert(decision.phase === PHASE, 'decision phase mismatch');
  assert(ALLOWED_DECISIONS.includes(decision.decision), `unexpected decision ${decision.decision}`);
  assert(!FORBIDDEN_DECISIONS.includes(decision.decision), `forbidden decision ${decision.decision}`);
  assert(decision.decision === DECISION, `expected ${DECISION}, got ${decision.decision}`);
  assert(decision.nextPrompt === NEXT_PROMPT, 'next prompt mismatch');
  assert(decision.readyForLocalFixtureGateStatusPacket === true, 'local fixture gate status packet should be ready');
  assert(decision.readyForToolExecution === false, 'tool execution readiness must remain false');
  assert(decision.readyForRouteExecution === false, 'route execution readiness must remain false');
  assert(decision.readyForWorkerExecution === false, 'worker execution readiness must remain false');
  assert(decision.readyForSupabasePersistence === false, 'Supabase persistence readiness must remain false');
  assert(decision.dryRunPassedClaimed === false, 'dry-run pass must not be claimed');
  assert(decision.generatedLocalFixturePassedClaimed === false, 'generated local fixture pass must not be claimed');
  assert(decision.runtimeExecutionReadinessClaimed === false, 'runtime readiness must not be claimed');

  assert(sourceAudit.pr409?.state === 'merged', 'PR #409 must be recorded as merged');
  assert(
    sourceAudit.pr409?.mergeCommit === '7d000f4b0af419607af975cae1b830df073e1294',
    'PR #409 merge commit mismatch',
  );
  assert(sourceAudit.sourceOfTruthConflictsFound === false, 'source audit reports conflicts');
  assert(sourceAudit.completedOwnerStudiesDuplicated === false, 'completed owner studies must not be duplicated');
  assert(validationAcceptance.accepted === true, 'local fixture validation evidence must be accepted');
  assert(validationAcceptance.caseCount === 18, 'case count mismatch');
  assert(validationAcceptance.metadataAcceptedFixtureCount === 10, 'metadata accepted fixture count mismatch');
  assert(validationAcceptance.failClosedFixtureCount === 8, 'fail-closed fixture count mismatch');
  assert(validationAcceptance.readyForOwnerApproval === true, 'validation evidence should be ready for owner approval');
  assert(dependencyAcceptance.accepted === true, 'dependency validation handoff must be accepted');
  assert(
    dependencyAcceptance.handoffDecision === 'dependency_validation_passed_with_inherited_readiness_blockers_ready_to_merge',
    'dependency handoff decision mismatch',
  );
  assert(dependencyAcceptance.packageLockChanged === false, 'package lock must not be changed');
  assert(dependencyAcceptance.nodeModulesStaged === false, 'node_modules must not be staged');
  assert(scopeApproval.approvedScope === 'next_local_fixture_gate_status_packet_only', 'approved scope mismatch');
  assert(blockerRegister.blockersRemainActive === true, 'runtime blockers must remain active');
  assert(dryRun.dryRunPassedClaimed === false, 'dry-run pass was claimed');
  assert(generated.generatedLocalFixturePassedClaimed === false, 'generated local fixture pass was claimed');
  assert(ownerHandoff.toolRoute?.runtimeExecutionAllowed === false, 'tool-route runtime execution should be blocked');
  assert(ownerHandoff.supabase?.supabaseWritesAllowed === false, 'Supabase writes should be blocked');
  assert(noExecution.toolExecutionAllowed === false, 'tool execution allowed unexpectedly');
  assert(summary.decision === DECISION, 'summary decision mismatch');
  assert(summary.nextPrompt === NEXT_PROMPT, 'summary next prompt mismatch');
  assert(summary.readyForToolExecution === false, 'summary claims tool execution readiness');
  assert(summary.generatedLocalFixturePassedClaimed === false, 'summary claims generated local fixture pass');

  const reportsAndDocs = [
    ...EXPECTED_REPORTS.map((report) => `${REPORT_DIR}/${report}`),
    ...REQUIRED_DOCS,
  ];
  for (const relativePath of reportsAndDocs) {
    assertNoForbiddenText(root, relativePath);
    if (relativePath.endsWith('.json')) {
      assertRuntimeFlagsFalse(relativePath, readJson(root, relativePath));
    }
  }

  assertNoForbiddenRuntimeImports(
    root,
    'scripts/validation/tool-route-execution-unlock-9-owner-approval-local-fixture-gate-diagnostics.mjs',
  );

  return {
    mode: process.argv.includes('--report')
      ? 'report'
      : process.argv.includes('--summary')
        ? 'summary'
        : 'diagnostics',
    status: 'passed',
    phase: PHASE,
    decision: DECISION,
    readyForLocalFixtureGateStatusPacket: true,
    readyForToolExecution: false,
    readyForRouteExecution: false,
    readyForWorkerExecution: false,
    readyForSupabasePersistence: false,
    caseCount: validationAcceptance.caseCount,
    metadataAcceptedFixtureCount: validationAcceptance.metadataAcceptedFixtureCount,
    failClosedFixtureCount: validationAcceptance.failClosedFixtureCount,
    expectedReports: EXPECTED_REPORTS.length,
    sourceOfTruthConflictsFound: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
    runtimeFlagsClosed: true,
    dependencyValidationHandoffAccepted: true,
    supabaseUpdateRequired: false,
    nextPrompt: NEXT_PROMPT,
  };
}

try {
  const root = process.cwd();
  const result = validate(root);
  console.log(JSON.stringify(result, null, 2));
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
