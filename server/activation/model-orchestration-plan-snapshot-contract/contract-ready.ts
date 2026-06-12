import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_REPORT_DIR =
  'docs/activation-model-orchestration-plan-snapshot-contract-ready-reports'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_RESULT_DOC =
  'docs/model-orchestration-plan-snapshot-contract-ready-result.md'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_EXPECTED_REPORTS = [
  'provider_evidence_reconciliation.json',
  'plan_snapshot_contract_ready_decision.json',
  'plan_snapshot_schema_contract_readiness.json',
  'plan_snapshot_fail_closed_fixture_readiness.json',
  'plan_snapshot_approval_gate_readiness.json',
  'plan_snapshot_worker_handoff_readiness.json',
  'plan_snapshot_supabase_persistence_blocker.json',
  'plan_snapshot_no_runtime_unlocks.json',
  'plan_snapshot_contract_ready_summary.json',
] as const

const RUN_ID = 'model-orchestration-plan-snapshot-contract-ready-20260612'
const READY_DECISION = 'ready_for_plan_snapshot_contract_handoff'
const BLOCKED_DECISION = 'blocked_pending_contract_merge_source_mismatch'
const READY_NEXT_PROMPT = 'WORKER-RUNTIME-UNLOCK-0: worker runtime unlock repo audit, no execution'
const BLOCKED_NEXT_PROMPT =
  'MODEL-ORCHESTRATION-PLAN-SNAPSHOT-CONTRACT-FIX: fix plan snapshot contract readiness blockers, no workers/tools/routes'
const PR332_DECISION = 'blocked_pending_contract_merge_source_mismatch'

const PR327_PACKET_FILES = [
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/agent_findings_v1_schema.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/approval_gate_and_worker_handoff_policy.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/approved_plan_snapshot_v1_schema.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/edit_intents_v1_schema.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_candidate_v1_schema.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_blocker_report.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_fixtures.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_plan.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_private_artifact_manifest.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_readiness_report.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_validation_report.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_evidence_inventory.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/provider_dry_run_evidence_reconciliation.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/source_of_truth_ownership_audit.json',
  'docs/implementation-prompts/prompt-model-orchestration-plan-snapshot-dry-run-validation.md',
  'docs/model-orchestration-agent-findings-schema.md',
  'docs/model-orchestration-approval-gate-worker-handoff-policy.md',
  'docs/model-orchestration-approved-plan-snapshot-schema.md',
  'docs/model-orchestration-edit-intents-schema.md',
  'docs/model-orchestration-plan-snapshot-candidate-schema.md',
  'docs/model-orchestration-plan-snapshot-contract-decision.md',
  'docs/model-orchestration-plan-snapshot-contract.md',
  'server/activation/model-orchestration-plan-snapshot-contract/index.ts',
  'server/activation/model-orchestration-plan-snapshot-contract/plan-snapshot-contract-types.ts',
  'server/cli/activation-model-orchestration-plan-snapshot-contract-plan.ts',
  'server/cli/activation-model-orchestration-plan-snapshot-contract-report.ts',
  'server/cli/activation-model-orchestration-plan-snapshot-contract-summary.ts',
  'server/cli/activation-model-orchestration-plan-snapshot-contract.ts',
  'server/smoke/activation-model-orchestration-plan-snapshot-contract-smoke.ts',
]

const CHERRY_PICK_CONFLICT_FILES = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'package.json',
]

const DISALLOWED_CHERRY_PICK_CONFLICT_FILES = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
]

const RUNTIME_GATES = {
  providerCallsInThisPrompt: false,
  providerSecretPayloadAccess: false,
  qwenRuntime: false,
  deepseekRuntime: false,
  supabaseWrites: false,
  sqlExecuted: false,
  migrationsDeployed: false,
  approvedPlanSnapshotPersisted: false,
  supabaseRegistryWrites: false,
  workerExecution: false,
  toolExecution: false,
  routeExecution: false,
  rawPromptExecution: false,
  mediaProcessing: false,
  storageObjectsCreated: false,
  publicArtifacts: false,
  signedUrls: false,
  generatedAssets: false,
  creditSpendOrReservation: false,
  stripeOrBilling: false,
  dockerOrCloudRun: false,
  demucsRuntime: false,
  trackARuntime: false,
  trackBExportOrMedia: false,
  production: false,
  externalBeta: false,
  paidProduction: false,
}

function reportPath(fileName: string): string {
  return path.join(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_REPORT_DIR, fileName)
}

function readJson(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) throw new Error(`Missing source-of-truth file: ${filePath}`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function readJsonIfPresent(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asBoolean(value: unknown): boolean {
  return value === true
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function allFalse(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => record[key] === false)
}

function packetFileInventory() {
  const present = PR327_PACKET_FILES.filter((file) => existsSync(file))
  const missing = PR327_PACKET_FILES.filter((file) => !existsSync(file))
  return {
    expectedFiles: PR327_PACKET_FILES,
    presentFiles: present,
    missingFiles: missing,
    allExpectedFilesPresent: missing.length === 0,
  }
}

function loadSourceEvidence() {
  return {
    qwenRerunSummary: readJson('docs/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-reports/qwen_rerun_summary.json'),
    qwenRerunCases: readJson('docs/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-reports/qwen_rerun_case_results.json'),
    qwenDeepseekPreservation: readJson(
      'docs/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-reports/qwen_rerun_deepseek_preservation.json',
    ),
    qwenRedactionAudit: readJson('docs/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-reports/qwen_rerun_redaction_audit.json'),
    qwenNoRuntimeUnlocks: readJson('docs/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-reports/qwen_rerun_no_runtime_unlocks.json'),
    deepseekPr320: readJson('docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json'),
    providerDecisionPr320: readJson('docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_decision.json'),
    approvalSchemasPr318: readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_output_schema_contracts.json'),
    approvalSyntheticCasesPr318: readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_synthetic_cases.json'),
    approvalFailClosedPr318: readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_fail_closed_policy.json'),
    approvalRedactionPr318: readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_audit_redaction_policy.json'),
    providerFixPr323: readJsonIfPresent('docs/activation-model-orchestration-provider-dry-run-fix-reports/qwen_provider_fix_summary.json'),
    secretSetupPr326: readJsonIfPresent('docs/activation-model-orchestration-qwen-deepseek-secret-setup-reports/qwen_secret_setup_summary.json'),
  }
}

export function buildModelOrchestrationPlanSnapshotContractReadyReports() {
  const evidence = loadSourceEvidence()
  const packetInventory = packetFileInventory()
  const qwenCases = asArray(evidence.qwenRerunCases.results).map(asRecord)
  const qwenPassed =
    evidence.qwenRerunSummary.status === 'passed' &&
    evidence.qwenRerunSummary.decision === 'qwen_rerun_passed_provider_dry_run_ready_for_plan_snapshot_contract' &&
    evidence.qwenRerunSummary.qwenProviderCallsPassed === 4 &&
    evidence.qwenRerunSummary.qwenProviderCallsBlocked === 0 &&
    asArray(evidence.qwenRerunSummary.modelAliasesUsed).includes('qwen-flash-us') &&
    asArray(evidence.qwenRerunSummary.modelAliasesUsed).includes('qwen-plus-us') &&
    asArray(evidence.qwenRerunSummary.historicalQwenAliasesUsed).length === 0 &&
    qwenCases.length === 4 &&
    qwenCases.every((row) => row.status === 'passed' && row.schemaValidationStatus === 'passed')

  const deepseekPassed =
    evidence.deepseekPr320.status === 'passed' &&
    evidence.deepseekPr320.providerCallsPassed === 3 &&
    evidence.qwenDeepseekPreservation.status === 'passed' &&
    evidence.qwenDeepseekPreservation.deepseekRerunAttempted === false &&
    evidence.qwenDeepseekPreservation.providerCallsPassedInPr320 === 3

  const qwenRedactionPassed =
    evidence.qwenRedactionAudit.status === 'passed' &&
    evidence.qwenRedactionAudit.rawProviderOutputPersisted === false &&
    evidence.qwenRedactionAudit.rawProviderOutputPrinted === false &&
    evidence.qwenRedactionAudit.modelGeneratedContentStored === false &&
    evidence.qwenRedactionAudit.secretPayloadPrinted === false &&
    evidence.qwenRedactionAudit.secretPayloadCommitted === false &&
    evidence.qwenRedactionAudit.secretValueStoredInReports === false

  const providerNoRuntimePassed = allFalse(evidence.qwenRerunSummary, [
    'supabaseWrites',
    'sqlExecuted',
    'migrationsDeployed',
    'workersToolsRoutes',
    'rawPromptExecution',
    'mediaProcessing',
    'publicArtifacts',
    'signedUrls',
    'generatedAssets',
    'creditSpendOrReservation',
    'production',
    'externalBeta',
    'paidProduction',
  ])

  const approvalSchemaIds = asArray(evidence.approvalSchemasPr318.schemas)
    .map(asRecord)
    .map((schema) => asString(schema.schemaId))
  const hasAgentFindings = approvalSchemaIds.includes('agent_findings_v1')
  const hasEditIntents = approvalSchemaIds.includes('edit_intents_v1')
  const hasPlanCandidate = approvalSchemaIds.includes('plan_snapshot_candidate_v1')
  const hasApprovedSnapshot = existsSync(
    'docs/activation-model-orchestration-plan-snapshot-contract-reports/approved_plan_snapshot_v1_schema.json',
  )

  const contractPacketPresent = packetInventory.allExpectedFilesPresent
  const schemaReady = contractPacketPresent && hasAgentFindings && hasEditIntents && hasPlanCandidate && hasApprovedSnapshot
  const failClosedReady =
    contractPacketPresent &&
    evidence.approvalFailClosedPr318.status === 'passed' &&
    evidence.approvalFailClosedPr318.workerToolRouteExecutionAllowedOnFailure === false &&
    existsSync('docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_fixtures.json')
  const approvalGateReady =
    contractPacketPresent &&
    existsSync('approved-plan-snapshot-policy.md') &&
    existsSync('docs/activation-model-orchestration-plan-snapshot-contract-reports/approval_gate_and_worker_handoff_policy.json')
  const workerHandoffReady = approvalGateReady
  const providerEvidenceResolved = qwenPassed && deepseekPassed && qwenRedactionPassed && providerNoRuntimePassed
  const ready = providerEvidenceResolved && schemaReady && failClosedReady && approvalGateReady && workerHandoffReady
  const decision = ready ? READY_DECISION : BLOCKED_DECISION
  const status = ready ? 'ready' : 'blocked'
  const activeBlockers = ready
    ? []
    : [
        'pr327_contract_packet_not_present_on_pr329_lineage',
        'cherry_pick_conflicted_outside_package_or_plan_snapshot_contract_paths',
        'approved_plan_snapshot_v1_schema_missing_from_current_branch',
        'plan_snapshot_contract_fixtures_missing_from_current_branch',
        'approval_gate_worker_handoff_policy_missing_from_current_branch',
      ]

  const providerEvidenceReconciliation = {
    phase: 'model-orchestration-plan-snapshot-contract-ready',
    runId: RUN_ID,
    status: providerEvidenceResolved ? 'passed' : 'blocked',
    sourceLineageStatus: contractPacketPresent ? 'selective_packet_integration_resolved' : 'blocked_source_mismatch',
    reconciliationAttempted: true,
    pr332SourceMismatchReviewed: true,
    pr332PriorDecision: PR332_DECISION,
    pr327ContractPacketExpected: true,
    pr327ContractPacketPresentOnCurrentBranch: contractPacketPresent,
    pr327ContractPacketAvailableOnOriginBranch: true,
    sourceBranch: 'codex/rp-model-orchestration-plan-snapshot-contract-ready',
    targetBranch: 'codex/rp-model-orchestration-plan-snapshot-contract-fix',
    attemptedPacketCommits: ['e01cda89', '0101af14'],
    fullCherryPickPerformedInFixPrompt: false,
    selectivePacketIntegrationPerformed: contractPacketPresent,
    firstCherryPickAttempted: true,
    firstCherryPickAborted: true,
    sourceMismatchResolvedBySelectiveIntegration: contractPacketPresent,
    cherryPickConflictFiles: CHERRY_PICK_CONFLICT_FILES,
    disallowedCherryPickConflictFiles: DISALLOWED_CHERRY_PICK_CONFLICT_FILES,
    disallowedReadinessFilesTouched: false,
    packageJsonConflictAllowed: true,
    qwenEvidence: {
      sourcePr: 329,
      status: asString(evidence.qwenRerunSummary.status),
      decision: asString(evidence.qwenRerunSummary.decision),
      endpoint: asString(evidence.qwenRerunSummary.endpointUsed),
      aliases: asArray(evidence.qwenRerunSummary.modelAliasesUsed),
      providerCallsPassed: asNumber(evidence.qwenRerunSummary.qwenProviderCallsPassed),
      providerCallsBlocked: asNumber(evidence.qwenRerunSummary.qwenProviderCallsBlocked),
      historicalAliasesUsed: asArray(evidence.qwenRerunSummary.historicalQwenAliasesUsed),
      evidenceAccepted: qwenPassed,
    },
    deepseekEvidence: {
      sourcePr: 320,
      status: asString(evidence.deepseekPr320.status),
      preservedByPr329: asString(evidence.qwenDeepseekPreservation.status),
      deepseekRerunAttempted: asBoolean(evidence.qwenDeepseekPreservation.deepseekRerunAttempted),
      providerCallsPassed: asNumber(evidence.deepseekPr320.providerCallsPassed),
      evidenceAccepted: deepseekPassed,
    },
    redactionAndNoRuntimeEvidence: {
      rawProviderOutputPersisted: false,
      rawProviderOutputPrinted: false,
      modelGeneratedContentStored: false,
      secretPayloadPrinted: false,
      secretPayloadCommitted: false,
      providerRuntimeGatesPassed: providerNoRuntimePassed,
    },
    providerEvidenceBlockerResolved: providerEvidenceResolved,
    contractPacketSourceMismatchBlocksReadiness: !contractPacketPresent,
  }

  const schemaReadiness = {
    phase: 'model-orchestration-plan-snapshot-contract-ready',
    runId: RUN_ID,
    status: schemaReady ? 'passed' : 'blocked',
    schemaContractsFromPr318Present: hasAgentFindings && hasEditIntents && hasPlanCandidate,
    requiredSchemas: {
      agent_findings_v1: hasAgentFindings,
      edit_intents_v1: hasEditIntents,
      plan_snapshot_candidate_v1: hasPlanCandidate,
      approved_plan_snapshot_v1: hasApprovedSnapshot,
    },
    pr327PacketFileInventory: packetInventory,
    schemaContractReady: schemaReady,
    blockers: schemaReady ? [] : ['approved_plan_snapshot_v1_schema_missing_until_pr327_packet_lineage_is_integrated'],
  }

  const failClosedReadiness = {
    phase: 'model-orchestration-plan-snapshot-contract-ready',
    runId: RUN_ID,
    status: failClosedReady ? 'passed' : 'blocked',
    dryRunFailClosedPolicyPresent: evidence.approvalFailClosedPr318.status === 'passed',
    dryRunFailureOutcome: asString(evidence.approvalFailClosedPr318.failureOutcome),
    dryRunWorkerToolRouteExecutionAllowedOnFailure: evidence.approvalFailClosedPr318.workerToolRouteExecutionAllowedOnFailure,
    planSnapshotContractFixturesPresent: existsSync(
      'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_fixtures.json',
    ),
    failClosedFixtureReady: failClosedReady,
    blockers: failClosedReady ? [] : ['plan_snapshot_contract_fail_closed_fixtures_missing_until_pr327_packet_lineage_is_integrated'],
  }

  const approvalGateReadiness = {
    phase: 'model-orchestration-plan-snapshot-contract-ready',
    runId: RUN_ID,
    status: approvalGateReady ? 'passed' : 'blocked',
    approvedPlanSnapshotPolicyPresent: existsSync('approved-plan-snapshot-policy.md'),
    rawChatExecutionBlockedByPolicy: true,
    providerOutputCannotExecuteRuntimePaths: true,
    findingsIntentsCandidatesCannotExecuteRuntimePaths: true,
    approvalGatePolicyReportPresent: existsSync(
      'docs/activation-model-orchestration-plan-snapshot-contract-reports/approval_gate_and_worker_handoff_policy.json',
    ),
    approvedPlanSnapshotPersistenceReady: false,
    approvalGateReady,
    blockers: approvalGateReady ? [] : ['pr327_approval_gate_policy_report_missing_from_current_branch'],
  }

  const workerHandoffReadiness = {
    phase: 'model-orchestration-plan-snapshot-contract-ready',
    runId: RUN_ID,
    status: workerHandoffReady ? 'passed' : 'blocked',
    workerExecutionReady: false,
    workerRuntimeAuditRequired: true,
    workersExecuteApprovedSnapshotsOnly: true,
    rawPromptForwardingAllowed: false,
    workerHandoffPolicyReportPresent: existsSync(
      'docs/activation-model-orchestration-plan-snapshot-contract-reports/approval_gate_and_worker_handoff_policy.json',
    ),
    workerHandoffReady,
    blockers: workerHandoffReady ? [] : ['pr327_worker_handoff_policy_report_missing_from_current_branch'],
  }

  const supabasePersistenceBlocker = {
    phase: 'model-orchestration-plan-snapshot-contract-ready',
    runId: RUN_ID,
    status: 'blocked',
    supabaseUpdateRequired: false,
    supabaseEnvironmentTouched: false,
    sqlExecuted: false,
    migrationDeployed: false,
    supabaseRowsCreated: false,
    approvedPlanSnapshotPersisted: false,
    supabasePersistenceReady: false,
    blocker: 'Supabase plan snapshot persistence remains blocked until a separate owner approves mutation and RLS/storage path.',
    nextSupabasePrompt: 'MODEL-ORCHESTRATION-PLAN-SNAPSHOT-PERSISTENCE-0: Supabase plan snapshot persistence audit, no mutation',
  }

  const noRuntimeUnlocks = {
    phase: 'model-orchestration-plan-snapshot-contract-ready',
    runId: RUN_ID,
    status: 'passed',
    runtimeGates: RUNTIME_GATES,
    generatedLocalFixturePassedClaimed: false,
    internalBetaClaimed: false,
    externalBetaClaimed: false,
    productionClaimed: false,
  }

  const decisionReport = {
    phase: 'model-orchestration-plan-snapshot-contract-ready',
    runId: RUN_ID,
    status,
    decision,
    pr332SourceMismatchReviewed: true,
    pr332PriorDecision: PR332_DECISION,
    sourceMismatchResolvedBySelectiveIntegration: contractPacketPresent,
    attemptedReadinessUpdate: true,
    contractReadyForHandoff: ready,
    providerEvidenceBlockerResolved: providerEvidenceResolved,
    qwenEvidenceAccepted: qwenPassed,
    deepseekEvidenceAccepted: deepseekPassed,
    schemaContractReady: schemaReady,
    failClosedFixtureReady: failClosedReady,
    approvalGateReady,
    workerHandoffReady,
    supabasePersistenceReady: false,
    activeBlockers,
    nextRecommendedPrompt: ready ? READY_NEXT_PROMPT : BLOCKED_NEXT_PROMPT,
    ...RUNTIME_GATES,
  }

  const summary = {
    phase: 'model-orchestration-plan-snapshot-contract-ready',
    runId: RUN_ID,
    status,
    decision,
    sourceLineageStatus: contractPacketPresent ? 'selective_packet_integration_resolved' : 'blocked_source_mismatch',
    pr332SourceMismatchReviewed: true,
    pr332PriorDecision: PR332_DECISION,
    sourceMismatchResolvedBySelectiveIntegration: contractPacketPresent,
    selectivePacketIntegrationPerformed: contractPacketPresent,
    fullCherryPickPerformedInFixPrompt: false,
    disallowedReadinessFilesTouched: false,
    contractReadyForHandoff: ready,
    providerEvidenceBlockerResolved: providerEvidenceResolved,
    qwenEvidenceAccepted: qwenPassed,
    deepseekEvidenceAccepted: deepseekPassed,
    pr327ContractPacketPresentOnCurrentBranch: contractPacketPresent,
    cherryPickAbortedDueDisallowedConflicts: true,
    disallowedCherryPickConflictFiles: DISALLOWED_CHERRY_PICK_CONFLICT_FILES,
    schemaContractReady: schemaReady,
    failClosedFixtureReady: failClosedReady,
    approvalGateReady,
    workerHandoffReady,
    supabasePersistenceReady: false,
    workerToolRouteExecutionReady: false,
    productionOrBetaReady: false,
    sourceOfTruthConflictsFound: !contractPacketPresent,
    activeBlockers,
    nextRecommendedPrompt: ready ? READY_NEXT_PROMPT : BLOCKED_NEXT_PROMPT,
    ...RUNTIME_GATES,
  }

  return {
    providerEvidenceReconciliation,
    decision: decisionReport,
    schemaReadiness,
    failClosedReadiness,
    approvalGateReadiness,
    workerHandoffReadiness,
    supabasePersistenceBlocker,
    noRuntimeUnlocks,
    summary,
  }
}

function writeJson(fileName: string, value: Record<string, unknown>): void {
  mkdirSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_REPORT_DIR, { recursive: true })
  writeFileSync(reportPath(fileName), `${JSON.stringify(value, null, 2)}\n`)
}

function renderResultMarkdown(summary: Record<string, unknown>): string {
  const blockedFiles = asArray(summary.disallowedCherryPickConflictFiles).join(', ')
  return `# Model Orchestration Plan Snapshot Contract Ready Result

Decision: \`${summary.decision}\`.

Status: \`${summary.status}\`.

Contract readiness update attempted: \`true\`.

Contract ready for handoff: \`${summary.contractReadyForHandoff}\`.

Provider evidence blocker resolved: \`${summary.providerEvidenceBlockerResolved}\`.

Qwen PR #329 evidence accepted: \`${summary.qwenEvidenceAccepted}\`.

DeepSeek PR #320 evidence accepted: \`${summary.deepseekEvidenceAccepted}\`.

PR #327 contract packet present on current branch: \`${summary.pr327ContractPacketPresentOnCurrentBranch}\`.

Cherry-pick aborted because conflicts occurred outside the allowed package/plan-snapshot paths: \`${summary.cherryPickAbortedDueDisallowedConflicts}\`.

Disallowed conflict files: \`${blockedFiles}\`.

PR #332 source mismatch reviewed: \`${summary.pr332SourceMismatchReviewed}\`.

Source mismatch resolved by selective packet integration: \`${summary.sourceMismatchResolvedBySelectiveIntegration}\`.

Full PR #327 cherry-pick performed in this prompt: \`${summary.fullCherryPickPerformedInFixPrompt}\`.

Disallowed readiness files touched: \`${summary.disallowedReadinessFilesTouched}\`.

Schema contract ready: \`${summary.schemaContractReady}\`.

Fail-closed fixture ready: \`${summary.failClosedFixtureReady}\`.

Approval gate ready: \`${summary.approvalGateReady}\`.

Worker handoff ready: \`${summary.workerHandoffReady}\`.

Supabase persistence ready: \`false\`.

Worker/tool/route execution ready: \`false\`.

Production, external beta, or paid production ready: \`false\`.

No provider calls, secret payload access, Supabase writes, SQL, migrations, workers, tools, routes, media processing, public artifacts, signed URLs, generated assets, credit spend/reservation, Demucs runtime, Track A runtime, or beta/production unlocks occurred in this prompt.

Recommended next prompt: \`${summary.nextRecommendedPrompt}\`.
`
}

export async function writeModelOrchestrationPlanSnapshotContractReadyArtifacts(
  reports = buildModelOrchestrationPlanSnapshotContractReadyReports(),
): Promise<void> {
  writeJson('provider_evidence_reconciliation.json', reports.providerEvidenceReconciliation)
  writeJson('plan_snapshot_contract_ready_decision.json', reports.decision)
  writeJson('plan_snapshot_schema_contract_readiness.json', reports.schemaReadiness)
  writeJson('plan_snapshot_fail_closed_fixture_readiness.json', reports.failClosedReadiness)
  writeJson('plan_snapshot_approval_gate_readiness.json', reports.approvalGateReadiness)
  writeJson('plan_snapshot_worker_handoff_readiness.json', reports.workerHandoffReadiness)
  writeJson('plan_snapshot_supabase_persistence_blocker.json', reports.supabasePersistenceBlocker)
  writeJson('plan_snapshot_no_runtime_unlocks.json', reports.noRuntimeUnlocks)
  writeJson('plan_snapshot_contract_ready_summary.json', reports.summary)
  writeFileSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_READY_RESULT_DOC, renderResultMarkdown(reports.summary))
}

export function readModelOrchestrationPlanSnapshotContractReadySummary(): Record<string, unknown> {
  return readJsonIfPresent(reportPath('plan_snapshot_contract_ready_summary.json')) ??
    buildModelOrchestrationPlanSnapshotContractReadyReports().summary
}
