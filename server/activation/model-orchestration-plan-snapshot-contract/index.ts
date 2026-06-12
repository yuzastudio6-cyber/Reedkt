import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  ModelOrchestrationPlanSnapshotContractDecision,
  ModelOrchestrationPlanSnapshotContractReports,
} from './plan-snapshot-contract-types'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE = 'model-orchestration-plan-snapshot-contract'
export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_RUN_ID =
  'model-orchestration-plan-snapshot-contract-20260612'
export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_BRANCH =
  'codex/rp-model-orchestration-plan-snapshot-contract'
export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_BASE_BRANCH =
  'codex/rp-model-orchestration-qwen-dashscope-auth-repair'
export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR =
  'docs/activation-model-orchestration-plan-snapshot-contract-reports'

const QWEN_AUTH_REPAIR_REPORT_DIR = 'docs/activation-model-orchestration-qwen-auth-repair-reports'
const PROVIDER_DRY_RUN_REPORT_DIR = 'docs/activation-model-orchestration-provider-dry-run-reports'
const DRY_RUN_APPROVAL_REPORT_DIR = 'docs/activation-model-orchestration-dry-run-approval-reports'
const AUDIT_REPORT_DIR = 'docs/activation-model-orchestration-qwen-deepseek-audit-reports'
const GITHUB_REPO = 'yuzastudio6-cyber/Reedkt'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'plan_snapshot_contract_plan.json',
  'provider_dry_run_evidence_reconciliation.json',
  'plan_snapshot_evidence_inventory.json',
  'agent_findings_v1_schema.json',
  'edit_intents_v1_schema.json',
  'plan_snapshot_candidate_v1_schema.json',
  'approved_plan_snapshot_v1_schema.json',
  'approval_gate_and_worker_handoff_policy.json',
  'plan_snapshot_contract_fixtures.json',
  'plan_snapshot_contract_validation_report.json',
  'plan_snapshot_contract_decision.json',
  'plan_snapshot_contract_blocker_report.json',
  'plan_snapshot_contract_readiness_report.json',
  'plan_snapshot_contract_private_artifact_manifest.json',
] as const

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT',
  'REEDITPRO_CONFIRM_AGENT_FINDINGS_SCHEMA_DESIGN',
  'REEDITPRO_CONFIRM_EDIT_INTENTS_SCHEMA_DESIGN',
  'REEDITPRO_CONFIRM_RAW_PROMPT_BLOCKER_POLICY',
  'REEDITPRO_CONFIRM_WORKER_HANDOFF_BLOCKER_POLICY',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
] as const

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_RECONCILIATION_CONFIRMATION =
  'REEDITPRO_CONFIRM_MODEL_ORCHESTRATION_PROVIDER_EVIDENCE_RECONCILIATION'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_QWEN_API_CALL',
  'REEDITPRO_CONFIRM_DEEPSEEK_API_CALL',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS_FOR_PROVIDER_DRY_RUN',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
] as const

const SOURCE_PATHS = [
  'README.md',
  'AGENTS.md',
  'model-routing-policy.md',
  'provider-prompt-architecture.md',
  'approved-plan-snapshot-policy.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/provider-gateway-foundation.md',
  'docs/tool-call-foundation.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/restricted-internal-testing-session-0-decision.md',
  'docs/activation-model-orchestration-qwen-auth-repair-reports',
  'docs/activation-model-orchestration-provider-dry-run-reports',
  'docs/activation-model-orchestration-dry-run-approval-reports',
  'docs/activation-model-orchestration-qwen-deepseek-audit-reports',
  'docs/activation-product-internal-testing-session-0-reports',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports',
  'docs/activation-track-b-tool-route-manifest-reports',
  'docs/activation-track-b-capability-manifests-reports',
  'docs/implementation-prompts/prompt-model-orchestration-plan-snapshot-contract.md',
] as const

const SECRET_REFS = [
  'DASHSCOPE_API_KEY',
  'DEEPSEEK_API_KEY',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_DB_URL',
] as const

const RUNTIME_FALSE_FLAGS = {
  providerCalls: false,
  secretPayloadAccess: false,
  secretPayloadPrinted: false,
  secretPayloadCommitted: false,
  supabaseWrites: false,
  sqlExecuted: false,
  migrationDeployed: false,
  workerExecution: false,
  toolExecution: false,
  routeExecution: false,
  rawPromptExecution: false,
  mediaProcessing: false,
  publicArtifacts: false,
  signedUrls: false,
  productionAffected: false,
  externalBeta: false,
  paidProduction: false,
}

type Fixture = {
  fixtureId: string
  schemaId: string
  expectedValid: boolean
  reason: string
  payload: Record<string, unknown>
}

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function runGh(args: string[]): string {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      GH_PAGER: 'cat',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function readPrMetadata(prNumber: number): Record<string, unknown> {
  const text = runGh([
    'pr',
    'view',
    String(prNumber),
    '--repo',
    GITHUB_REPO,
    '--json',
    'number,title,state,baseRefName,headRefName,mergeStateStatus,url,commits',
  ])
  const parsed = JSON.parse(text) as Record<string, unknown>
  const commits = asArray(parsed.commits).map(asRecord)
  const latest = commits.at(-1)

  return {
    number: parsed.number,
    title: parsed.title,
    state: parsed.state,
    baseRefName: parsed.baseRefName,
    headRefName: parsed.headRefName,
    mergeStateStatus: parsed.mergeStateStatus,
    url: parsed.url,
    latestCommitSha: latest?.oid ?? 'missing',
  }
}

function readGithubBranchJson(ref: string, filePath: string): Record<string, unknown> | undefined {
  const content = runGh([
    'api',
    `repos/${GITHUB_REPO}/contents/${filePath}?ref=${encodeURIComponent(ref)}`,
    '--jq',
    '.content',
  ])
  return JSON.parse(Buffer.from(content.replace(/\s/g, ''), 'base64').toString('utf8')) as Record<string, unknown>
}

function getPrHead(meta: Record<string, unknown>, fallback: string) {
  const head = asString(meta.headRefName)
  return head || fallback
}

function extractResultModels(report: Record<string, unknown>) {
  return asArray(report.results)
    .map(asRecord)
    .filter((result) => result.status === 'passed')
    .map((result) => asString(result.modelId))
}

function reportHasUnsafeResultFlag(report: Record<string, unknown>) {
  return asArray(report.results)
    .map(asRecord)
    .some((result) => [
      'rawProviderResponseStored',
      'rawProviderResponsePrinted',
      'secretPayloadPrinted',
      'workerExecutionAllowed',
      'toolExecutionAllowed',
      'routeExecutionAllowed',
      'publicArtifactsAllowed',
      'signedUrlsAllowed',
      'rawPromptForwardingAllowed',
      'directMutationAllowed',
      'productionMutationAllowed',
    ].some((field) => result[field] === true))
}

function providerTimeoutPresent(decision: Record<string, unknown>, rerun: Record<string, unknown>) {
  return asArray(decision.activeBlockers).includes('provider_timeout') ||
    asArray(rerun.results).map(asRecord).some((result) => result.blocker === 'provider_timeout')
}

export function getModelOrchestrationPlanSnapshotContractPlan() {
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    runId: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_RUN_ID,
    branch: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_BRANCH,
    baseBranch: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_BASE_BRANCH,
    prTitle: '[model] Plan snapshot contract',
    mode: 'metadata_contract_design_only',
    reportDir: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_EXPECTED_REPORTS,
    requiredConfirmations: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REQUIRED_CONFIRMATIONS,
    reconciliationConfirmation: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_RECONCILIATION_CONFIRMATION,
    forbiddenConfirmations: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FORBIDDEN_CONFIRMATIONS,
    reconciliationModeFlag: '--reconcile-provider-evidence',
    contractFlow: [
      'provider_evidence',
      'agent_findings_v1',
      'edit_intents_v1',
      'plan_snapshot_candidate_v1',
      'approval_gate',
      'approved_plan_snapshot_v1',
    ],
    evidenceGate: 'PR #322 and PR #320 committed provider reports must show provider dry-run readiness.',
    expectedCurrentDecision: 'blocked_pending_provider_dry_run_evidence',
    ...RUNTIME_FALSE_FLAGS,
  }
}

export function buildModelOrchestrationPlanSnapshotContractReports(): ModelOrchestrationPlanSnapshotContractReports {
  const providerEvidenceReconciliation = buildProviderEvidenceReconciliation()
  const evidenceInventory = buildEvidenceInventory(providerEvidenceReconciliation)
  const agentFindingsSchema = buildAgentFindingsSchema()
  const editIntentsSchema = buildEditIntentsSchema()
  const planSnapshotCandidateSchema = buildPlanSnapshotCandidateSchema()
  const approvedPlanSnapshotSchema = buildApprovedPlanSnapshotSchema()
  const approvalHandoffPolicy = buildApprovalHandoffPolicy()
  const fixtures = buildFixtures()
  const validationReport = buildValidationReport(fixtures.fixtures as Fixture[])
  const decisionName = selectDecision({
    evidenceInventory,
    validationReport,
    approvalHandoffPolicy,
  })
  const decision = buildDecision(decisionName, evidenceInventory, validationReport)

  return {
    sourceOfTruthOwnershipAudit: buildSourceOfTruthOwnershipAudit(),
    contractPlan: getModelOrchestrationPlanSnapshotContractPlan(),
    providerEvidenceReconciliation,
    evidenceInventory,
    agentFindingsSchema,
    editIntentsSchema,
    planSnapshotCandidateSchema,
    approvedPlanSnapshotSchema,
    approvalHandoffPolicy,
    fixtures,
    validationReport,
    decision,
    blockerReport: buildBlockerReport(decision),
    readinessReport: buildReadinessReport(decision),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeModelOrchestrationPlanSnapshotContractArtifacts(
  reports: ModelOrchestrationPlanSnapshotContractReports,
): Promise<void> {
  const reportDir = MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_contract_plan.json'), reports.contractPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'provider_dry_run_evidence_reconciliation.json'), reports.providerEvidenceReconciliation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'agent_findings_v1_schema.json'), reports.agentFindingsSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'edit_intents_v1_schema.json'), reports.editIntentsSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_candidate_v1_schema.json'), reports.planSnapshotCandidateSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'approved_plan_snapshot_v1_schema.json'), reports.approvedPlanSnapshotSchema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'approval_gate_and_worker_handoff_policy.json'), reports.approvalHandoffPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_contract_fixtures.json'), reports.fixtures)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_contract_validation_report.json'), reports.validationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_contract_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_contract_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_contract_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_contract_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeDocs(reports)
}

export async function executeModelOrchestrationPlanSnapshotContract(options: {
  execute: boolean
  metadataOnly: boolean
  keepTemp: boolean
  reconcileProviderEvidence?: boolean
}): Promise<{ exitCode: number }> {
  if (!options.execute || !options.metadataOnly) return { exitCode: 1 }

  const missing = MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const reconcileMissing = options.reconcileProviderEvidence && process.env[MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_RECONCILIATION_CONFIRMATION] !== 'true'
    ? [`missing_confirmation:${MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_RECONCILIATION_CONFIRMATION}`]
    : []
  const forbidden = MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  const reports = buildModelOrchestrationPlanSnapshotContractReports()

  if (missing.length > 0 || reconcileMissing.length > 0 || forbidden.length > 0) {
    reports.decision = {
      ...reports.decision,
      status: 'blocked',
      decision: 'blocked_pending_raw_prompt_safety_review',
      activeBlockers: [
        ...missing.map((name) => `missing_confirmation:${name}`),
        ...reconcileMissing,
        ...forbidden.map((name) => `forbidden_confirmation:${name}`),
      ],
    }
    reports.blockerReport = buildBlockerReport(reports.decision)
    reports.readinessReport = buildReadinessReport(reports.decision)
    await writeModelOrchestrationPlanSnapshotContractArtifacts(reports)
    return { exitCode: 1 }
  }

  await writeModelOrchestrationPlanSnapshotContractArtifacts(reports)
  return { exitCode: reports.decision.status === 'passed' ? 0 : 1 }
}

export function readModelOrchestrationPlanSnapshotContractSummary() {
  return readJson(path.join(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR, 'plan_snapshot_contract_readiness_report.json')) ??
    buildModelOrchestrationPlanSnapshotContractReports().readinessReport
}

function buildSourceOfTruthOwnershipAudit() {
  const qwenDecision = readJson(path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_repair_decision.json'))
  const providerDecision = readJson(path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'provider_dry_run_decision.json'))
  const session0 = readJson('docs/activation-product-internal-testing-session-0-reports/session_0_decision.json')
  const trackB = readJson('docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json')

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    runId: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_RUN_ID,
    ownerWorkstream: 'MODEL_ORCHESTRATION',
    relatedWorkstreams: [
      'PRODUCT_INTERNAL_BETA_AGGREGATION',
      'SUPABASE_RLS_STORAGE_DATABASE',
      'TRACK_B_MEDIA_PROCESSING',
      'PROVIDER_GATEWAY',
      'WORKER_RUNTIME_JOBS',
      'PUBLIC_ARTIFACT_DELIVERY',
    ],
    explicitlyNotOwned: [
      'provider_api_execution',
      'secret_payload_access',
      'worker_execution',
      'tool_execution',
      'route_execution',
      'media_processing',
      'supabase_write',
      'production_deploy',
      'external_beta',
      'paid_production',
      'public_artifacts',
      'signed_url_delivery',
    ],
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    pr322Decision: qwenDecision?.decision ?? 'missing',
    pr322Status: qwenDecision?.status ?? 'missing',
    pr320Decision: providerDecision?.decision ?? 'missing',
    pr320Status: providerDecision?.status ?? 'missing',
    pr311Session0Decision: session0?.decision ?? 'missing',
    pr298TrackBStatus: trackB?.status ?? 'missing',
    missingSourceDocsAreAuditFacts: true,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildProviderEvidenceReconciliation() {
  const localQwenDecision = readJson(path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_repair_decision.json')) ?? {}
  const localQwenRerun = readJson(path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_repaired_provider_dry_run_report.json')) ?? {}
  const localProviderDecision = readJson(path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'provider_dry_run_decision.json')) ?? {}
  const localDeepseekReport = readJson(path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'deepseek_provider_dry_run_report.json')) ?? {}
  const githubErrors: string[] = []

  let pr322: Record<string, unknown> = {}
  let pr320: Record<string, unknown> = {}
  let pr327: Record<string, unknown> = {}
  let remoteQwenDecision: Record<string, unknown> = {}
  let remoteQwenReadiness: Record<string, unknown> = {}
  let remoteQwenRerun: Record<string, unknown> = {}
  let remoteQwenBaseurl: Record<string, unknown> = {}
  let remoteQwenAliasReview: Record<string, unknown> = {}
  let remoteProviderDecision: Record<string, unknown> = {}
  let remoteDeepseekReport: Record<string, unknown> = {}

  try {
    pr322 = readPrMetadata(322)
    pr320 = readPrMetadata(320)
    pr327 = readPrMetadata(327)
    const pr322Head = getPrHead(pr322, MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_BASE_BRANCH)
    const pr320Head = getPrHead(pr320, 'codex/rp-model-orchestration-qwen-deepseek-provider-dry-run')

    remoteQwenDecision = readGithubBranchJson(pr322Head, path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_repair_decision.json')) ?? {}
    remoteQwenReadiness = readGithubBranchJson(pr322Head, path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_repair_readiness_report.json')) ?? {}
    remoteQwenRerun = readGithubBranchJson(pr322Head, path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_repaired_provider_dry_run_report.json')) ?? {}
    remoteQwenBaseurl = readGithubBranchJson(pr322Head, path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_baseurl_probe_report.json')) ?? {}
    remoteQwenAliasReview = readGithubBranchJson(pr322Head, path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_official_alias_baseurl_review.json')) ?? {}
    remoteProviderDecision = readGithubBranchJson(pr320Head, path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'provider_dry_run_decision.json')) ?? {}
    remoteDeepseekReport = readGithubBranchJson(pr320Head, path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'deepseek_provider_dry_run_report.json')) ?? {}
  } catch (error) {
    githubErrors.push(error instanceof Error ? error.message : String(error))
  }

  const githubMetadataAvailable = githubErrors.length === 0
  const qwenBlockers = asArray(remoteQwenDecision.activeBlockers).map(String)
  const qwenResults = asArray(remoteQwenRerun.results).map(asRecord)
  const expectedQwenCases = [
    'synthetic_edit_intent_extraction',
    'synthetic_timeline_planning',
    'synthetic_tool_route_metadata_recommendation',
    'synthetic_provider_fallback_comparison',
  ]
  const qwenPassedCases = qwenResults
    .filter((result) => result.status === 'passed')
    .map((result) => asString(result.caseId))
  const qwenAllCasesPassed = expectedQwenCases.every((caseId) => qwenPassedCases.includes(caseId))
  const selectedAlias = asString(remoteQwenRerun.selectedAlias || remoteQwenReadiness.selectedQwenAlias || remoteQwenAliasReview.selectedAlias)
  const selectedBaseUrlKey = asString(remoteQwenBaseurl.selectedBaseUrlKey || remoteQwenReadiness.selectedBaseUrlKey || remoteQwenAliasReview.selectedBaseUrlKey)
  const qwenUsesVirginiaBaseUrl = ['us', 'virginia'].includes(selectedBaseUrlKey)
  const qwenTimeout = providerTimeoutPresent(remoteQwenDecision, remoteQwenRerun)
  const qwenPassed =
    githubMetadataAvailable &&
    remoteQwenDecision.status === 'passed' &&
    remoteQwenDecision.decision === 'qwen_alias_repaired_ready_for_plan_snapshot_contract' &&
    qwenBlockers.length === 0 &&
    remoteQwenRerun.status === 'passed' &&
    Number(remoteQwenRerun.providerCallsPassed ?? 0) >= expectedQwenCases.length &&
    qwenAllCasesPassed &&
    selectedAlias === 'qwen-plus' &&
    qwenUsesVirginiaBaseUrl &&
    !reportHasUnsafeResultFlag(remoteQwenRerun)

  const deepseekModels = extractResultModels(remoteDeepseekReport)
  const deepseekPassed =
    githubMetadataAvailable &&
    remoteDeepseekReport.status === 'passed' &&
    remoteDeepseekReport.executed === true &&
    Number(remoteDeepseekReport.providerCallsPassed ?? 0) >= 3 &&
    deepseekModels.includes('deepseek-v4-flash') &&
    deepseekModels.includes('deepseek-v4-pro') &&
    !reportHasUnsafeResultFlag(remoteDeepseekReport)

  const localDeepseekStale =
    localDeepseekReport.status !== 'passed' &&
    remoteDeepseekReport.status === 'passed'
  const localQwenStale =
    localQwenDecision.decision !== remoteQwenDecision.decision ||
    localQwenRerun.status !== remoteQwenRerun.status ||
    localQwenRerun.providerCallsPassed !== remoteQwenRerun.providerCallsPassed
  const providerEvidenceBlockers = [
    ...(!githubMetadataAvailable ? ['github_provider_evidence_metadata_unavailable'] : []),
    ...(!qwenPassed ? ['pr322_qwen_pass_evidence_missing'] : []),
    ...(qwenTimeout ? ['pr322_qwen_schema_rerun_provider_timeout'] : []),
    ...(!qwenAllCasesPassed ? ['pr322_qwen_schema_cases_did_not_pass'] : []),
    ...(!deepseekPassed ? ['pr320_deepseek_provider_dry_run_not_passed'] : []),
  ]
  const reconciledProviderEvidenceReady = qwenPassed && deepseekPassed

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    status: reconciledProviderEvidenceReady ? 'passed' : 'blocked',
    reconciliationAttempted: true,
    githubMetadataAvailable,
    githubErrors: githubErrors.map((message) => ({
      type: 'metadata_read_failed',
      message: message.slice(0, 240),
    })),
    sourcePrs: [
      { pr: 327, ...pr327 },
      { pr: 322, ...pr322 },
      { pr: 320, ...pr320 },
    ],
    sourcePaths: [
      {
        pr: 322,
        branch: pr322.headRefName ?? MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_BASE_BRANCH,
        paths: [
          path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_repair_decision.json'),
          path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_repair_readiness_report.json'),
          path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_repaired_provider_dry_run_report.json'),
          path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_baseurl_probe_report.json'),
          path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_official_alias_baseurl_review.json'),
        ],
      },
      {
        pr: 320,
        branch: pr320.headRefName ?? 'codex/rp-model-orchestration-qwen-deepseek-provider-dry-run',
        paths: [
          path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'provider_dry_run_decision.json'),
          path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'deepseek_provider_dry_run_report.json'),
        ],
      },
    ],
    localEvidence: {
      pr327LocalQwenDecision: localQwenDecision.decision ?? 'missing',
      pr327LocalQwenStatus: localQwenDecision.status ?? 'missing',
      pr327LocalQwenProviderCallsPassed: localQwenRerun.providerCallsPassed ?? 0,
      pr327LocalProviderDecision: localProviderDecision.decision ?? 'missing',
      pr327LocalDeepseekStatus: localDeepseekReport.status ?? 'missing',
      pr327LocalDeepseekProviderCallsPassed: localDeepseekReport.providerCallsPassed ?? 0,
    },
    staleEvidence: {
      pr327WasReadingStaleEvidence: localDeepseekStale || localQwenStale,
      pr327LocalDeepseekSnapshotStale: localDeepseekStale,
      pr327LocalQwenSnapshotStale: localQwenStale,
      staleEvidenceClassification: localDeepseekStale
        ? 'local_pr320_deepseek_snapshot_stale_remote_pr320_passed'
        : localQwenStale
          ? 'local_pr322_qwen_snapshot_differs_from_remote'
          : 'no_remote_stale_evidence_detected',
    },
    qwenEvidence: {
      sourcePr: 322,
      remoteDecision: remoteQwenDecision.decision ?? 'missing',
      remoteStatus: remoteQwenDecision.status ?? 'missing',
      activeBlockers: qwenBlockers,
      selectedAlias,
      expectedSelectedAlias: 'qwen-plus',
      aliasMatchedExpected: selectedAlias === 'qwen-plus',
      selectedBaseUrlKey,
      workingBaseUrlClassification: qwenUsesVirginiaBaseUrl ? 'virginia_dashscope_base_url' : 'not_virginia_dashscope_base_url',
      expectedWorkingBaseUrlClassification: 'virginia_dashscope_base_url',
      schemaCasesExpected: expectedQwenCases,
      schemaCasesPassed: qwenPassedCases,
      allSchemaCasesPassed: qwenAllCasesPassed,
      providerTimeoutPresent: qwenTimeout,
      unsafeResultFlagsPresent: reportHasUnsafeResultFlag(remoteQwenRerun),
      qwenEvidencePassed: qwenPassed,
    },
    deepseekEvidence: {
      sourcePr: 320,
      remoteDecision: remoteProviderDecision.decision ?? 'missing',
      remoteProviderDecisionStatus: remoteProviderDecision.status ?? 'missing',
      remoteDeepseekStatus: remoteDeepseekReport.status ?? 'missing',
      providerCallsPassed: remoteDeepseekReport.providerCallsPassed ?? 0,
      modelIdsPassed: deepseekModels,
      requiredModelIds: ['deepseek-v4-flash', 'deepseek-v4-pro'],
      unsafeResultFlagsPresent: reportHasUnsafeResultFlag(remoteDeepseekReport),
      deepseekEvidencePassed: deepseekPassed,
    },
    finalReconciledQwenStatus: qwenPassed ? 'passed' : 'blocked',
    finalReconciledDeepSeekStatus: deepseekPassed ? 'passed_remote_pr320' : 'blocked',
    reconciledProviderEvidenceReady,
    providerEvidenceBlockers: [...new Set(providerEvidenceBlockers)],
    proseOnlyProviderPassClaimsAccepted: false,
    secretRefs: SECRET_REFS.map((name) => ({
      name,
      payloadAccessed: false,
      payloadPrinted: false,
      payloadCommitted: false,
    })),
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildEvidenceInventory(providerEvidenceReconciliation: Record<string, unknown>) {
  const qwenDecision = readJson(path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_repair_decision.json'))
  const qwenReadiness = readJson(path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_repair_readiness_report.json'))
  const qwenRerun = readJson(path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_repaired_provider_dry_run_report.json'))
  const providerDecision = readJson(path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'provider_dry_run_decision.json'))
  const providerReadiness = readJson(path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'provider_dry_run_readiness_report.json'))
  const deepseekReport = readJson(path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'deepseek_provider_dry_run_report.json'))
  const dryRunApproval = readJson(path.join(DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_approval_decision.json'))
  const auditReadiness = readJson(path.join(AUDIT_REPORT_DIR, 'model_orchestration_audit_readiness_report.json'))

  const qwenBlockers = asArray(qwenDecision?.activeBlockers).map(String)
  const providerBlockers = asArray(providerDecision?.activeBlockers).map(String)
  const localQwenContractReady =
    qwenDecision?.decision === 'qwen_alias_repaired_ready_for_plan_snapshot_contract' &&
    qwenReadiness?.planSnapshotContractReady === true &&
    qwenBlockers.length === 0
  const localProviderDryRunPassed =
    providerDecision?.decision === 'provider_dry_run_passed_ready_for_plan_snapshot_contract' &&
    providerReadiness?.planSnapshotContractReady === true &&
    providerBlockers.length === 0
  const localDeepseekPassed =
    deepseekReport?.status === 'passed' &&
    Number(deepseekReport?.providerCallsPassed ?? 0) > 0
  const providerEvidencePassed = providerEvidenceReconciliation.reconciledProviderEvidenceReady === true

  const providerEvidenceBlockers = [
    ...asArray(providerEvidenceReconciliation.providerEvidenceBlockers).map(String),
  ]

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    status: providerEvidencePassed ? 'passed' : 'blocked',
    providerEvidencePassed,
    providerEvidenceBlockers: [...new Set(providerEvidenceBlockers)],
    providerEvidenceReconciliationReport: path.join(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR, 'provider_dry_run_evidence_reconciliation.json'),
    qwenRepairedStatusFromPr322: asRecord(providerEvidenceReconciliation.qwenEvidence).qwenEvidencePassed === true ? 'passed' : 'blocked',
    qwenSelectedAlias: asRecord(providerEvidenceReconciliation.qwenEvidence).selectedAlias ?? 'missing',
    qwenWorkingBaseUrl: asRecord(providerEvidenceReconciliation.qwenEvidence).workingBaseUrlClassification ?? 'missing',
    deepseekPassedStatusFromPr320: asRecord(providerEvidenceReconciliation.deepseekEvidence).deepseekEvidencePassed === true ? 'passed' : 'blocked',
    deepseekAliases: asRecord(providerEvidenceReconciliation.deepseekEvidence).modelIdsPassed ?? [],
    staleEvidence: providerEvidenceReconciliation.staleEvidence ?? {},
    sourceReports: [
      {
        pr: 322,
        path: path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_auth_repair_decision.json'),
        present: Boolean(qwenDecision),
        decision: qwenDecision?.decision ?? 'missing',
        status: qwenDecision?.status ?? 'missing',
        activeBlockers: qwenBlockers,
        localContractReady: localQwenContractReady,
      },
      {
        pr: 322,
        path: path.join(QWEN_AUTH_REPAIR_REPORT_DIR, 'qwen_repaired_provider_dry_run_report.json'),
        present: Boolean(qwenRerun),
        status: qwenRerun?.status ?? 'missing',
        providerCallsAttempted: qwenRerun?.providerCallsAttempted ?? 0,
        providerCallsPassed: qwenRerun?.providerCallsPassed ?? 0,
        providerCallsBlocked: qwenRerun?.providerCallsBlocked ?? 0,
      },
      {
        pr: 320,
        path: path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'provider_dry_run_decision.json'),
        present: Boolean(providerDecision),
        decision: providerDecision?.decision ?? 'missing',
        status: providerDecision?.status ?? 'missing',
        activeBlockers: providerBlockers,
        localProviderDryRunPassed,
      },
      {
        pr: 320,
        path: path.join(PROVIDER_DRY_RUN_REPORT_DIR, 'deepseek_provider_dry_run_report.json'),
        present: Boolean(deepseekReport),
        status: deepseekReport?.status ?? 'missing',
        providerCallsAttempted: deepseekReport?.providerCallsAttempted ?? 0,
        providerCallsPassed: deepseekReport?.providerCallsPassed ?? 0,
        localDeepseekPassed,
      },
      {
        pr: 318,
        path: path.join(DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_approval_decision.json'),
        present: Boolean(dryRunApproval),
        decision: dryRunApproval?.decision ?? 'missing',
        status: dryRunApproval?.status ?? 'missing',
      },
      {
        pr: 314,
        path: path.join(AUDIT_REPORT_DIR, 'model_orchestration_audit_readiness_report.json'),
        present: Boolean(auditReadiness),
        decision: auditReadiness?.decision ?? 'missing',
        status: auditReadiness?.status ?? 'missing',
      },
    ],
    secretRefs: SECRET_REFS.map((name) => ({
      name,
      payloadAccessed: false,
      payloadPrinted: false,
      payloadCommitted: false,
    })),
    providerCallsInThisPhase: false,
    sourceEvidenceOnly: true,
    missingDocsRecordedAsAuditFacts: true,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function schemaBase(schemaId: string, title: string, required: string[], properties: Record<string, unknown>) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://reeditpro.local/schemas/${schemaId}.json`,
    title,
    schemaId,
    schemaVersion: 'v1',
    type: 'object',
    additionalProperties: false,
    required,
    properties: {
      ...properties,
      safety: {
        type: 'object',
        additionalProperties: false,
        required: [
          'providerCallsAllowed',
          'workerExecutionAllowed',
          'toolExecutionAllowed',
          'routeExecutionAllowed',
          'rawPromptForwardingAllowed',
          'publicArtifactsAllowed',
          'signedUrlsAsSourceOfTruthAllowed',
          'directMutationAllowed',
          'productionMutationAllowed',
        ],
        properties: {
          providerCallsAllowed: { const: false },
          workerExecutionAllowed: { const: false },
          toolExecutionAllowed: { const: false },
          routeExecutionAllowed: { const: false },
          rawPromptForwardingAllowed: { const: false },
          publicArtifactsAllowed: { const: false },
          signedUrlsAsSourceOfTruthAllowed: { const: false },
          directMutationAllowed: { const: false },
          productionMutationAllowed: { const: false },
        },
      },
    },
    failClosedOnValidationError: true,
    runtimeExecutionAllowedInThisPhase: false,
  }
}

function buildAgentFindingsSchema() {
  return schemaBase('agent_findings_v1', 'Agent Findings V1', [
    'schemaVersion',
    'findingId',
    'sourceEvidenceRefs',
    'summary',
    'observations',
    'risks',
    'safety',
  ], {
    schemaVersion: { const: 'agent_findings_v1' },
    findingId: { type: 'string', minLength: 1 },
    sourceEvidenceRefs: { type: 'array', items: { type: 'string' }, minItems: 1 },
    summary: { type: 'string', minLength: 1 },
    observations: { type: 'array', items: { type: 'object' }, minItems: 1 },
    risks: { type: 'array', items: { type: 'string' } },
  })
}

function buildEditIntentsSchema() {
  return schemaBase('edit_intents_v1', 'Edit Intents V1', [
    'schemaVersion',
    'intentId',
    'findingRefs',
    'intentSummary',
    'segments',
    'approvalRequirements',
    'safety',
  ], {
    schemaVersion: { const: 'edit_intents_v1' },
    intentId: { type: 'string', minLength: 1 },
    findingRefs: { type: 'array', items: { type: 'string' }, minItems: 1 },
    intentSummary: { type: 'string', minLength: 1 },
    segments: { type: 'array', items: { type: 'object' }, minItems: 1 },
    approvalRequirements: { type: 'array', items: { type: 'string' }, minItems: 1 },
  })
}

function buildPlanSnapshotCandidateSchema() {
  return schemaBase('plan_snapshot_candidate_v1', 'Plan Snapshot Candidate V1', [
    'schemaVersion',
    'candidateId',
    'intentRefs',
    'candidateSummary',
    'timelinePlan',
    'toolRouteMetadata',
    'sourceOfTruthRefs',
    'approvalGate',
    'safety',
  ], {
    schemaVersion: { const: 'plan_snapshot_candidate_v1' },
    candidateId: { type: 'string', minLength: 1 },
    intentRefs: { type: 'array', items: { type: 'string' }, minItems: 1 },
    candidateSummary: { type: 'string', minLength: 1 },
    timelinePlan: { type: 'array', items: { type: 'object' }, minItems: 1 },
    toolRouteMetadata: { type: 'array', items: { type: 'object' } },
    sourceOfTruthRefs: { type: 'array', items: { type: 'string' }, minItems: 1 },
    approvalGate: { type: 'object' },
  })
}

function buildApprovedPlanSnapshotSchema() {
  return schemaBase('approved_plan_snapshot_v1', 'Approved Plan Snapshot V1', [
    'schemaVersion',
    'approvedSnapshotId',
    'candidateRef',
    'approvalRecordRef',
    'sourceOfTruthRefs',
    'immutablePlanVersion',
    'workerHandoffStatus',
    'safety',
  ], {
    schemaVersion: { const: 'approved_plan_snapshot_v1' },
    approvedSnapshotId: { type: 'string', minLength: 1 },
    candidateRef: { type: 'string', minLength: 1 },
    approvalRecordRef: { type: 'string', minLength: 1 },
    sourceOfTruthRefs: { type: 'array', items: { type: 'string' }, minItems: 1 },
    immutablePlanVersion: { const: true },
    workerHandoffStatus: {
      enum: [
        'not_allowed_in_this_phase',
        'future_worker_phase_requires_separate_approval',
      ],
    },
  })
}

function buildApprovalHandoffPolicy() {
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    status: 'passed',
    providerOutputCanExecute: false,
    agentFindingsCanExecute: false,
    editIntentsCanExecute: false,
    planSnapshotCandidateCanExecute: false,
    approvedPlanSnapshotExecutesInThisPhase: false,
    futureWorkerExecutionRequiresSeparateApproval: true,
    rawPromptToWorkerAllowed: false,
    providerResponseToMutationAllowed: false,
    providerResponseToPublicArtifactAllowed: false,
    providerResponseToSignedUrlSourceOfTruthAllowed: false,
    sourceOfTruthPolicy: {
      requiredRefs: [
        'supabase_row_refs',
        'private_gcs_or_storage_manifest_refs',
        'checksum_refs',
        'approved_plan_snapshot_refs',
      ],
      signedUrlsAreSourceOfTruth: false,
      publicArtifactsAreSourceOfTruth: false,
      rawProviderResponsesAreSourceOfTruth: false,
    },
    workerHandoffPolicy: [
      'Provider evidence may feed only normalized findings.',
      'Agent findings and edit intents are reviewable planning records only.',
      'Plan snapshot candidates require human approval and credit/scope gates before becoming approved snapshots.',
      'Approved snapshots remain immutable inputs for future worker phases, but this packet does not authorize those phases.',
    ],
    ...RUNTIME_FALSE_FLAGS,
  }
}

function safety(overrides: Partial<Record<string, boolean>> = {}) {
  return {
    providerCallsAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    routeExecutionAllowed: false,
    rawPromptForwardingAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAsSourceOfTruthAllowed: false,
    directMutationAllowed: false,
    productionMutationAllowed: false,
    ...overrides,
  }
}

function buildFixtures(): Record<string, unknown> {
  const fixtures: Fixture[] = [
    {
      fixtureId: 'valid_simple_edit_intent',
      schemaId: 'edit_intents_v1',
      expectedValid: true,
      reason: 'Simple metadata-only edit intent with approval requirements.',
      payload: {
        schemaVersion: 'edit_intents_v1',
        intentId: 'intent_simple_001',
        findingRefs: ['finding_simple_001'],
        intentSummary: 'Tighten pacing and caption clarity for a synthetic explainer.',
        segments: [{ segmentId: 'seg_001', goal: 'metadata_review_only' }],
        approvalRequirements: ['confirmed_frame', 'credit_estimate', 'approved_snapshot'],
        safety: safety(),
      },
    },
    {
      fixtureId: 'valid_multi_step_timeline_planning',
      schemaId: 'plan_snapshot_candidate_v1',
      expectedValid: true,
      reason: 'Candidate timeline remains non-executable and references source-of-truth metadata.',
      payload: {
        schemaVersion: 'plan_snapshot_candidate_v1',
        candidateId: 'candidate_timeline_001',
        intentRefs: ['intent_simple_001'],
        candidateSummary: 'Three-step hook, proof, and CTA timeline.',
        timelinePlan: [
          { step: 'hook', frameRange: 'review_only' },
          { step: 'proof', frameRange: 'review_only' },
          { step: 'cta', frameRange: 'review_only' },
        ],
        toolRouteMetadata: [{ routeId: 'caption_metadata', execution: false }],
        sourceOfTruthRefs: ['supabase:activation_registry:metadata_only', 'manifest:private:sha256'],
        approvalGate: { approved: false, requiresHumanApproval: true },
        safety: safety(),
      },
    },
    {
      fixtureId: 'valid_tool_route_metadata_recommendation',
      schemaId: 'agent_findings_v1',
      expectedValid: true,
      reason: 'Tool route is mentioned only as metadata.',
      payload: {
        schemaVersion: 'agent_findings_v1',
        findingId: 'finding_tool_route_001',
        sourceEvidenceRefs: ['trackb:route_manifest:metadata_only'],
        summary: 'Captions and chart cards are candidate metadata lanes.',
        observations: [{ kind: 'route_metadata', routeExecution: false }],
        risks: ['worker_execution_requires_future_approval'],
        safety: safety(),
      },
    },
    {
      fixtureId: 'invalid_raw_worker_execution',
      schemaId: 'plan_snapshot_candidate_v1',
      expectedValid: false,
      reason: 'Raw prompt forwarding and worker execution must fail closed.',
      payload: { schemaVersion: 'plan_snapshot_candidate_v1', workerPayload: 'run this raw prompt', safety: safety({ rawPromptForwardingAllowed: true, workerExecutionAllowed: true }) },
    },
    {
      fixtureId: 'invalid_public_artifact_request',
      schemaId: 'approved_plan_snapshot_v1',
      expectedValid: false,
      reason: 'Public artifact creation is outside this contract.',
      payload: { schemaVersion: 'approved_plan_snapshot_v1', approvedSnapshotId: 'bad_public', publicArtifact: true, safety: safety({ publicArtifactsAllowed: true }) },
    },
    {
      fixtureId: 'invalid_signed_url_source_of_truth',
      schemaId: 'plan_snapshot_candidate_v1',
      expectedValid: false,
      reason: 'Signed URLs cannot be source of truth.',
      payload: { schemaVersion: 'plan_snapshot_candidate_v1', sourceOfTruthRefs: ['signed_url:redacted'], safety: safety({ signedUrlsAsSourceOfTruthAllowed: true }) },
    },
    {
      fixtureId: 'invalid_missing_schema_fields',
      schemaId: 'agent_findings_v1',
      expectedValid: false,
      reason: 'Required fields are absent.',
      payload: { schemaVersion: 'agent_findings_v1', summary: 'missing ids and evidence', safety: safety() },
    },
    {
      fixtureId: 'invalid_broad_media_runtime',
      schemaId: 'edit_intents_v1',
      expectedValid: false,
      reason: 'Broad media processing is not authorized.',
      payload: { schemaVersion: 'edit_intents_v1', intentId: 'bad_media', broadMediaProcessing: true, safety: safety({ toolExecutionAllowed: true }) },
    },
    {
      fixtureId: 'invalid_production_mutation',
      schemaId: 'approved_plan_snapshot_v1',
      expectedValid: false,
      reason: 'Production mutation must remain blocked.',
      payload: { schemaVersion: 'approved_plan_snapshot_v1', approvedSnapshotId: 'bad_prod', productionMutation: true, safety: safety({ productionMutationAllowed: true }) },
    },
    {
      fixtureId: 'invalid_demucs_vlm_runtime',
      schemaId: 'plan_snapshot_candidate_v1',
      expectedValid: false,
      reason: 'Demucs and VLM runtime lanes remain blocked in this metadata phase.',
      payload: { schemaVersion: 'plan_snapshot_candidate_v1', candidateId: 'bad_runtime', demucsRuntime: true, vlmRuntime: true, safety: safety({ toolExecutionAllowed: true }) },
    },
  ]

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    status: 'passed',
    fixtureCount: fixtures.length,
    validFixtureCount: fixtures.filter((item) => item.expectedValid).length,
    invalidFixtureCount: fixtures.filter((item) => !item.expectedValid).length,
    fixtures,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function requiredFieldsFor(schemaId: string) {
  const schemas = {
    agent_findings_v1: ['schemaVersion', 'findingId', 'sourceEvidenceRefs', 'summary', 'observations', 'risks', 'safety'],
    edit_intents_v1: ['schemaVersion', 'intentId', 'findingRefs', 'intentSummary', 'segments', 'approvalRequirements', 'safety'],
    plan_snapshot_candidate_v1: ['schemaVersion', 'candidateId', 'intentRefs', 'candidateSummary', 'timelinePlan', 'toolRouteMetadata', 'sourceOfTruthRefs', 'approvalGate', 'safety'],
    approved_plan_snapshot_v1: ['schemaVersion', 'approvedSnapshotId', 'candidateRef', 'approvalRecordRef', 'sourceOfTruthRefs', 'immutablePlanVersion', 'workerHandoffStatus', 'safety'],
  } satisfies Record<string, string[]>
  return schemas[schemaId as keyof typeof schemas] ?? []
}

function validateFixture(fixture: Fixture) {
  const payload = fixture.payload
  const required = requiredFieldsFor(fixture.schemaId)
  const missing = required.filter((field) => !(field in payload))
  const safetyRecord = asRecord(payload.safety)
  const unsafeFlags = [
    'providerCallsAllowed',
    'workerExecutionAllowed',
    'toolExecutionAllowed',
    'routeExecutionAllowed',
    'rawPromptForwardingAllowed',
    'publicArtifactsAllowed',
    'signedUrlsAsSourceOfTruthAllowed',
    'directMutationAllowed',
    'productionMutationAllowed',
  ].filter((field) => safetyRecord[field] === true)
  const blockedContentFlags = [
    'workerPayload',
    'publicArtifact',
    'broadMediaProcessing',
    'productionMutation',
    'demucsRuntime',
    'vlmRuntime',
  ].filter((field) => payload[field] === true || typeof payload[field] === 'string')
  const signedUrlAsTruth = asArray(payload.sourceOfTruthRefs).some((ref) => String(ref).startsWith('signed_url:'))
  const valid = missing.length === 0 && unsafeFlags.length === 0 && blockedContentFlags.length === 0 && !signedUrlAsTruth

  return {
    fixtureId: fixture.fixtureId,
    schemaId: fixture.schemaId,
    expectedValid: fixture.expectedValid,
    actualValid: valid,
    outcomeMatchedExpectation: valid === fixture.expectedValid,
    missing,
    unsafeFlags,
    blockedContentFlags,
    signedUrlAsTruth,
  }
}

function buildValidationReport(fixtures: Fixture[]) {
  const results = fixtures.map(validateFixture)
  const validFixturesPassed = results.filter((item) => item.expectedValid).every((item) => item.actualValid)
  const invalidFixturesFailedClosed = results.filter((item) => !item.expectedValid).every((item) => !item.actualValid)
  const allExpectationsMatched = results.every((item) => item.outcomeMatchedExpectation)

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    status: validFixturesPassed && invalidFixturesFailedClosed && allExpectationsMatched ? 'passed' : 'blocked',
    validFixturesPassed,
    invalidFixturesFailedClosed,
    allExpectationsMatched,
    executionFlagsBlocked: true,
    sourceOfTruthPolicyValidated: true,
    fixtureResults: results,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function selectDecision(input: {
  evidenceInventory: Record<string, unknown>
  validationReport: Record<string, unknown>
  approvalHandoffPolicy: Record<string, unknown>
}): ModelOrchestrationPlanSnapshotContractDecision {
  if (hasExecutionRisk(input.validationReport) || hasExecutionRisk(input.approvalHandoffPolicy)) return 'rejected_due_execution_safety_risk'
  if (input.validationReport.status !== 'passed') return 'blocked_pending_schema_contract_fix'
  if (input.approvalHandoffPolicy.status !== 'passed') return 'blocked_pending_worker_handoff_policy'
  if (asRecord(input.approvalHandoffPolicy.sourceOfTruthPolicy).signedUrlsAreSourceOfTruth !== false) {
    return 'blocked_pending_supabase_source_of_truth_policy'
  }
  if (input.evidenceInventory.providerEvidencePassed !== true) return 'blocked_pending_provider_dry_run_evidence'
  return 'plan_snapshot_contract_passed_ready_for_dry_run_validation'
}

function hasExecutionRisk(report: Record<string, unknown>) {
  return [
    'providerCalls',
    'secretPayloadAccess',
    'supabaseWrites',
    'sqlExecuted',
    'migrationDeployed',
    'workerExecution',
    'toolExecution',
    'routeExecution',
    'rawPromptExecution',
    'mediaProcessing',
    'publicArtifacts',
    'signedUrls',
    'productionAffected',
    'externalBeta',
    'paidProduction',
  ].some((field) => report[field] === true)
}

function buildDecision(
  decision: ModelOrchestrationPlanSnapshotContractDecision,
  evidenceInventory: Record<string, unknown>,
  validationReport: Record<string, unknown>,
) {
  const activeBlockers = decision === 'blocked_pending_provider_dry_run_evidence'
    ? asArray(evidenceInventory.providerEvidenceBlockers).map(String)
    : decision === 'blocked_pending_schema_contract_fix'
      ? ['schema_fixture_validation_failed']
      : decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation'
        ? []
        : [decision]

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    runId: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_RUN_ID,
    status: decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation' ? 'passed' : 'blocked',
    decision,
    activeBlockers,
    providerEvidencePassed: evidenceInventory.providerEvidencePassed === true,
    schemaContractsPresent: true,
    validFixturesPassed: validationReport.validFixturesPassed === true,
    invalidFixturesFailedClosed: validationReport.invalidFixturesFailedClosed === true,
    workerHandoffPolicyPresent: true,
    sourceOfTruthPolicyPresent: true,
    nextRecommendedPhase: decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation'
      ? 'Proceed to a separate plan snapshot dry-run validation packet.'
      : 'Repair/rerun provider evidence before approving the plan snapshot contract.',
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  const activeBlockers = asArray(decision.activeBlockers).map(String)
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    decision: decision.decision,
    activeBlockers,
    blockerCount: activeBlockers.length,
    blockedUntil: activeBlockers.includes('pr322_qwen_schema_rerun_provider_timeout')
      ? 'Qwen provider schema rerun no longer times out and provider evidence reports pass.'
      : 'Provider evidence, schema contract, and handoff policy are all passed.',
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildReadinessReport(decision: Record<string, unknown>) {
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    runId: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: decision.activeBlockers ?? [],
    planSnapshotContractReady: decision.status === 'passed',
    dryRunValidationReady: decision.status === 'passed',
    providerEvidenceRequiredBeforePass: true,
    metadataOnly: true,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_PHASE,
    status: 'passed',
    reportDir: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_EXPECTED_REPORTS,
    privateArtifactsCommitted: false,
    secretPayloadsCommitted: false,
    rawProviderResponsesCommitted: false,
    mediaPayloadsCommitted: false,
    buildOutputsCommitted: false,
    cacheArtifactsCommitted: false,
    ...RUNTIME_FALSE_FLAGS,
  }
}

async function writeDocs(reports: ModelOrchestrationPlanSnapshotContractReports) {
  const decision = asString(reports.decision.decision)
  const blockerLines = asArray(reports.decision.activeBlockers).map((blocker) => `- ${String(blocker)}`).join('\n') || '- none'
  const reconciliation = reports.providerEvidenceReconciliation
  const qwenStatus = asString(reconciliation.finalReconciledQwenStatus) || 'unknown'
  const deepseekStatus = asString(reconciliation.finalReconciledDeepSeekStatus) || 'unknown'
  const staleEvidence = asRecord(reconciliation.staleEvidence)
  const staleLine = staleEvidence.pr327WasReadingStaleEvidence === true
    ? 'PR #327 was reading stale local provider evidence for at least one upstream report.'
    : 'No stale local provider evidence was detected beyond the current committed blockers.'
  const decisionSummary = decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation'
    ? 'The schema, fixture, handoff, and provider evidence gates pass.'
    : 'The schema and fixture portions are present, and invalid fixtures fail closed. The packet does not pass because committed provider evidence is not ready.'

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-plan-snapshot-contract.md', `# Model Orchestration Plan Snapshot Contract

Decision: \`${decision}\`.

This packet defines the metadata-only handoff from provider evidence into reviewable planning records:

1. \`agent_findings_v1\`
2. \`edit_intents_v1\`
3. \`plan_snapshot_candidate_v1\`
4. approval gate
5. \`approved_plan_snapshot_v1\`

Provider output, findings, intents, and candidates cannot execute workers, tools, routes, Supabase writes, public artifacts, signed URLs, or production mutations.

Provider evidence reconciliation:

- Qwen: \`${qwenStatus}\`
- DeepSeek: \`${deepseekStatus}\`
- Stale evidence: ${staleLine}
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-agent-findings-schema.md', `# Agent Findings Schema

\`agent_findings_v1\` stores normalized provider evidence as reviewable findings. It requires source evidence refs, observations, risks, and false execution flags.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-edit-intents-schema.md', `# Edit Intents Schema

\`edit_intents_v1\` converts findings into structured edit intent metadata. It is not a worker payload and requires later snapshot approval.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-plan-snapshot-candidate-schema.md', `# Plan Snapshot Candidate Schema

\`plan_snapshot_candidate_v1\` contains a proposed timeline, route metadata, source-of-truth refs, and approval gates. It cannot execute anything.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-approved-plan-snapshot-schema.md', `# Approved Plan Snapshot Schema

\`approved_plan_snapshot_v1\` is immutable after approval. Even then, worker execution remains a separate future phase with its own approvals.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-approval-gate-worker-handoff-policy.md', `# Approval Gate Worker Handoff Policy

Provider responses, agent findings, edit intents, and candidate snapshots are metadata only.

Only a future approved plan snapshot can be considered by separate worker phases, and those phases still require their own approvals, credit gates, source-of-truth refs, and runtime safety checks.

Source of truth requires Supabase row refs, private manifest/GCS refs, checksum refs, and approved snapshot refs. Signed URLs are never source of truth.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-plan-snapshot-contract-decision.md', `# Plan Snapshot Contract Decision

Decision: \`${decision}\`

Active blockers:

${blockerLines}

${decisionSummary}

Reconciled evidence:

- Qwen: \`${qwenStatus}\`
- DeepSeek: \`${deepseekStatus}\`
- Stale evidence: ${staleLine}
`)

  const nextPromptBody = decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation'
    ? `# Model Orchestration Plan Snapshot Dry-Run Validation

Run this only after provider evidence reports pass and this contract decision becomes \`plan_snapshot_contract_passed_ready_for_dry_run_validation\`.

Keep the phase metadata-only: no provider calls, secret payload access, Supabase writes, workers, tools, routes, media processing, public artifacts, signed URLs, production, external beta, or paid production unless a later prompt explicitly authorizes a separate phase.
`
    : `# Model Orchestration Provider Evidence Repair Handoff

The plan snapshot dry-run validation phase remains blocked until committed provider evidence passes.

Current reconciled evidence:

- Qwen: \`${qwenStatus}\`
- DeepSeek: \`${deepseekStatus}\`

Next action: repair or rerun the exact Qwen provider evidence blocker, commit safe reports to PR #322, then rerun this PR #327 reconciliation. Do not call providers, access secrets, execute workers/tools/routes, mutate Supabase, create public artifacts, create signed URLs, or unlock production from this handoff.
`

  await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-model-orchestration-plan-snapshot-dry-run-validation.md', nextPromptBody)

  await writeReadinessMetadataDocs(decision)
}

async function writeReadinessMetadataDocs(decision: string) {
  const scorecardPath = 'docs/beta-readiness-scorecard.md'
  if (existsSync(scorecardPath)) {
    const current = readFileSync(scorecardPath, 'utf8')
    const line = `Model orchestration plan snapshot contract status: ${decision}. Contract generation is metadata-only; provider calls, runtime execution, Supabase writes, external beta, paid production, and production remain blocked.`
    const next = current.includes('Model orchestration plan snapshot contract status:')
      ? current.replace(/\n*Model orchestration plan snapshot contract status:.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(scorecardPath, next)
  }

  const blockerPath = 'docs/production-beta-blocker-inventory.md'
  if (existsSync(blockerPath)) {
    const current = readFileSync(blockerPath, 'utf8')
    const line = `Plan snapshot contract does not remove production beta blockers; current decision is \`${decision}\`.`
    const next = current.includes('Plan snapshot contract does not remove production beta blockers;')
      ? current.replace(/\n*Plan snapshot contract does not remove production beta blockers;.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(blockerPath, next)
  }
}
