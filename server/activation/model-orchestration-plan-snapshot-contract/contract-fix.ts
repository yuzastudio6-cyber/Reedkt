import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  buildModelOrchestrationPlanSnapshotContractReadyReports,
} from './contract-ready'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_REPORT_DIR =
  'docs/activation-model-orchestration-plan-snapshot-contract-fix-reports'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_RESULT_DOC =
  'docs/model-orchestration-plan-snapshot-contract-fix-result.md'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_EXPECTED_REPORTS = [
  'contract_packet_source_lineage_fix.json',
  'contract_packet_integrated_files.json',
  'provider_evidence_reconciliation_after_fix.json',
  'plan_snapshot_contract_ready_decision_after_fix.json',
  'plan_snapshot_schema_contract_readiness_after_fix.json',
  'plan_snapshot_fail_closed_fixture_readiness_after_fix.json',
  'plan_snapshot_approval_gate_readiness_after_fix.json',
  'plan_snapshot_worker_handoff_readiness_after_fix.json',
  'plan_snapshot_supabase_persistence_blocker_after_fix.json',
  'plan_snapshot_no_runtime_unlocks_after_fix.json',
  'plan_snapshot_contract_fix_summary.json',
] as const

const RUN_ID = 'model-orchestration-plan-snapshot-contract-fix-20260612'
const PR332_PRIOR_DECISION = 'blocked_pending_contract_merge_source_mismatch'
const PR332_PRIOR_SOURCE_LINEAGE_STATUS = 'blocked_source_mismatch'
const READY_NEXT_PROMPT = 'WORKER-RUNTIME-UNLOCK-0: worker runtime unlock repo audit, no execution'
const BLOCKED_NEXT_PROMPT =
  'MODEL-ORCHESTRATION-PLAN-SNAPSHOT-CONTRACT-FIX-2: fix remaining plan snapshot contract readiness blockers, no workers/tools/routes'

const INTEGRATED_PACKET_FILES = [
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
] as const

const DISALLOWED_FILES = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
] as const

function reportPath(fileName: string): string {
  return path.join(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_REPORT_DIR, fileName)
}

function readJson(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) throw new Error(`Missing source-of-truth file: ${filePath}`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function git(args: string[]): string {
  return execFileSync('/usr/bin/git', args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  }).trim()
}

function changedDisallowedFiles(): string[] {
  const unstaged = git(['diff', '--name-only', '--', ...DISALLOWED_FILES]).split('\n').filter(Boolean)
  const staged = git(['diff', '--cached', '--name-only', '--', ...DISALLOWED_FILES]).split('\n').filter(Boolean)
  return [...new Set([...unstaged, ...staged])].sort()
}

export function buildModelOrchestrationPlanSnapshotContractFixReports() {
  const readyReports = buildModelOrchestrationPlanSnapshotContractReadyReports()
  const readySummary = readyReports.summary
  const qwenRerun = readJson('docs/activation-model-orchestration-qwen-deepseek-provider-dry-run-rerun-reports/qwen_rerun_summary.json')
  const deepseek = readJson('docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json')
  const integratedFileStatus = INTEGRATED_PACKET_FILES.map((file) => ({ file, present: existsSync(file) }))
  const missingIntegratedFiles = integratedFileStatus.filter((entry) => !entry.present).map((entry) => entry.file)
  const disallowedChanged = changedDisallowedFiles()
  const packetIntegrated = missingIntegratedFiles.length === 0
  const disallowedFilesUntouched = disallowedChanged.length === 0
  const readyForHandoff = readySummary.contractReadyForHandoff === true && packetIntegrated && disallowedFilesUntouched
  const status = readyForHandoff ? 'ready' : 'blocked'
  const decision = readyForHandoff
    ? 'ready_for_plan_snapshot_contract_handoff'
    : 'blocked_pending_package_script_merge_issue'
  const activeBlockers = [
    ...missingIntegratedFiles.map((file) => `missing_integrated_packet_file:${file}`),
    ...disallowedChanged.map((file) => `disallowed_file_changed:${file}`),
  ]

  const sourceLineageFix = {
    phase: 'model-orchestration-plan-snapshot-contract-fix',
    runId: RUN_ID,
    status,
    pr332SourceMismatchReviewed: true,
    pr332PriorDecision: PR332_PRIOR_DECISION,
    pr332PriorSourceLineageStatus: PR332_PRIOR_SOURCE_LINEAGE_STATUS,
    fullPr327CherryPickPerformed: false,
    selectivePacketIntegrationPerformed: packetIntegrated,
    pr327PacketSource: 'origin/codex/rp-model-orchestration-plan-snapshot-contract',
    disallowedFilesUntouched,
    disallowedChangedFiles: disallowedChanged,
    sourceMismatchResolved: packetIntegrated && disallowedFilesUntouched,
  }

  const integratedFiles = {
    phase: 'model-orchestration-plan-snapshot-contract-fix',
    runId: RUN_ID,
    status: packetIntegrated ? 'passed' : 'blocked',
    integratedFiles: integratedFileStatus,
    missingIntegratedFiles,
    disallowedFiles: DISALLOWED_FILES,
    disallowedFilesUntouched,
  }

  const providerEvidenceAfterFix = {
    ...readyReports.providerEvidenceReconciliation,
    phase: 'model-orchestration-plan-snapshot-contract-fix',
    runId: RUN_ID,
    status: readyReports.providerEvidenceReconciliation.status,
    pr332SourceMismatchResolvedByFix: packetIntegrated && disallowedFilesUntouched,
  }

  const decisionAfterFix = {
    phase: 'model-orchestration-plan-snapshot-contract-fix',
    runId: RUN_ID,
    status,
    decision,
    contractFixAttempted: true,
    sourceMismatchResolved: packetIntegrated && disallowedFilesUntouched,
    contractReadyForHandoff: readyForHandoff,
    providerEvidenceBlockerResolved: readySummary.providerEvidenceBlockerResolved,
    qwenEvidenceAccepted: readySummary.qwenEvidenceAccepted,
    deepseekEvidenceAccepted: readySummary.deepseekEvidenceAccepted,
    schemaContractReady: readySummary.schemaContractReady,
    failClosedFixtureReady: readySummary.failClosedFixtureReady,
    approvalGateReady: readySummary.approvalGateReady,
    workerHandoffReady: readySummary.workerHandoffReady,
    supabasePersistenceReady: false,
    activeBlockers,
    nextRecommendedPrompt: readyForHandoff ? READY_NEXT_PROMPT : BLOCKED_NEXT_PROMPT,
    providerCallsInThisPrompt: false,
    providerSecretPayloadAccess: false,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationsDeployed: false,
    workerExecution: false,
    toolExecution: false,
    routeExecution: false,
    rawPromptExecution: false,
    mediaProcessing: false,
    publicArtifacts: false,
    signedUrls: false,
    generatedAssets: false,
    production: false,
    externalBeta: false,
    paidProduction: false,
  }

  const noRuntimeAfterFix = {
    ...readyReports.noRuntimeUnlocks,
    phase: 'model-orchestration-plan-snapshot-contract-fix',
    runId: RUN_ID,
  }

  const summary = {
    phase: 'model-orchestration-plan-snapshot-contract-fix',
    runId: RUN_ID,
    status,
    decision,
    contractFixAttempted: true,
    sourceMismatchResolved: packetIntegrated && disallowedFilesUntouched,
    pr327PacketSelectivelyIntegrated: packetIntegrated,
    fullPr327CherryPickPerformed: false,
    disallowedFilesUntouched,
    disallowedChangedFiles: disallowedChanged,
    contractReadyForHandoff: readyForHandoff,
    providerEvidenceBlockerResolved: readySummary.providerEvidenceBlockerResolved,
    qwenEvidenceAccepted: qwenRerun.qwenProviderCallsPassed === 4,
    deepseekEvidenceAccepted: deepseek.providerCallsPassed === 3,
    schemaContractReady: readySummary.schemaContractReady,
    failClosedFixtureReady: readySummary.failClosedFixtureReady,
    approvalGateReady: readySummary.approvalGateReady,
    workerHandoffReady: readySummary.workerHandoffReady,
    supabasePersistenceReady: false,
    workerToolRouteExecutionReady: false,
    productionOrBetaReady: false,
    activeBlockers,
    nextRecommendedPrompt: readyForHandoff ? READY_NEXT_PROMPT : BLOCKED_NEXT_PROMPT,
    providerCallsInThisPrompt: false,
    providerSecretPayloadAccess: false,
    supabaseWrites: false,
    sqlExecuted: false,
    migrationsDeployed: false,
    workerExecution: false,
    toolExecution: false,
    routeExecution: false,
    rawPromptExecution: false,
    mediaProcessing: false,
    publicArtifacts: false,
    signedUrls: false,
    generatedAssets: false,
    creditSpendOrReservation: false,
    demucsRuntime: false,
    trackARuntime: false,
    qwenRuntime: false,
    deepseekRuntime: false,
    externalBeta: false,
    paidProduction: false,
    production: false,
  }

  return {
    sourceLineageFix,
    integratedFiles,
    providerEvidenceAfterFix,
    decisionAfterFix,
    schemaReadinessAfterFix: { ...readyReports.schemaReadiness, phase: 'model-orchestration-plan-snapshot-contract-fix', runId: RUN_ID },
    failClosedReadinessAfterFix: { ...readyReports.failClosedReadiness, phase: 'model-orchestration-plan-snapshot-contract-fix', runId: RUN_ID },
    approvalGateReadinessAfterFix: { ...readyReports.approvalGateReadiness, phase: 'model-orchestration-plan-snapshot-contract-fix', runId: RUN_ID },
    workerHandoffReadinessAfterFix: { ...readyReports.workerHandoffReadiness, phase: 'model-orchestration-plan-snapshot-contract-fix', runId: RUN_ID },
    supabasePersistenceBlockerAfterFix: { ...readyReports.supabasePersistenceBlocker, phase: 'model-orchestration-plan-snapshot-contract-fix', runId: RUN_ID },
    noRuntimeAfterFix,
    summary,
  }
}

function writeJson(fileName: string, value: Record<string, unknown>): void {
  mkdirSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_REPORT_DIR, { recursive: true })
  writeFileSync(reportPath(fileName), `${JSON.stringify(value, null, 2)}\n`)
}

function renderResultMarkdown(summary: Record<string, unknown>): string {
  return `# Model Orchestration Plan Snapshot Contract Fix Result

Decision: \`${summary.decision}\`.

Status: \`${summary.status}\`.

Contract fix attempted: \`${summary.contractFixAttempted}\`.

Source mismatch resolved: \`${summary.sourceMismatchResolved}\`.

PR #327 packet selectively integrated: \`${summary.pr327PacketSelectivelyIntegrated}\`.

Full PR #327 cherry-pick performed: \`${summary.fullPr327CherryPickPerformed}\`.

Disallowed readiness files untouched: \`${summary.disallowedFilesUntouched}\`.

Contract ready for handoff: \`${summary.contractReadyForHandoff}\`.

Provider evidence blocker resolved: \`${summary.providerEvidenceBlockerResolved}\`.

Qwen PR #329 evidence accepted: \`${summary.qwenEvidenceAccepted}\`.

DeepSeek PR #320 evidence accepted: \`${summary.deepseekEvidenceAccepted}\`.

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

export async function writeModelOrchestrationPlanSnapshotContractFixArtifacts(
  reports = buildModelOrchestrationPlanSnapshotContractFixReports(),
): Promise<void> {
  writeJson('contract_packet_source_lineage_fix.json', reports.sourceLineageFix)
  writeJson('contract_packet_integrated_files.json', reports.integratedFiles)
  writeJson('provider_evidence_reconciliation_after_fix.json', reports.providerEvidenceAfterFix)
  writeJson('plan_snapshot_contract_ready_decision_after_fix.json', reports.decisionAfterFix)
  writeJson('plan_snapshot_schema_contract_readiness_after_fix.json', reports.schemaReadinessAfterFix)
  writeJson('plan_snapshot_fail_closed_fixture_readiness_after_fix.json', reports.failClosedReadinessAfterFix)
  writeJson('plan_snapshot_approval_gate_readiness_after_fix.json', reports.approvalGateReadinessAfterFix)
  writeJson('plan_snapshot_worker_handoff_readiness_after_fix.json', reports.workerHandoffReadinessAfterFix)
  writeJson('plan_snapshot_supabase_persistence_blocker_after_fix.json', reports.supabasePersistenceBlockerAfterFix)
  writeJson('plan_snapshot_no_runtime_unlocks_after_fix.json', reports.noRuntimeAfterFix)
  writeJson('plan_snapshot_contract_fix_summary.json', reports.summary)
  writeFileSync(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FIX_RESULT_DOC, renderResultMarkdown(reports.summary))
}

export function readModelOrchestrationPlanSnapshotContractFixSummary(): Record<string, unknown> {
  const summaryPath = reportPath('plan_snapshot_contract_fix_summary.json')
  if (existsSync(summaryPath)) return readJson(summaryPath)
  return buildModelOrchestrationPlanSnapshotContractFixReports().summary
}
