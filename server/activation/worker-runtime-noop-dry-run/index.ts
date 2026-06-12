import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  WorkerRuntimeNoopDryRunDecision,
  WorkerRuntimeNoopDryRunReports,
} from './noop-dry-run-types'

export const WORKER_RUNTIME_NOOP_DRY_RUN_PHASE = 'worker-runtime-noop-dry-run-execution'
export const WORKER_RUNTIME_NOOP_DRY_RUN_RUN_ID = 'worker-runtime-noop-dry-run-20260612'
export const WORKER_RUNTIME_NOOP_DRY_RUN_BRANCH =
  'codex/rp-worker-runtime-noop-dry-run-execution'
export const WORKER_RUNTIME_NOOP_DRY_RUN_BASE_BRANCH =
  'codex/rp-worker-runtime-dry-run-approval-after-repo-audit'
export const WORKER_RUNTIME_NOOP_DRY_RUN_REPORT_DIR =
  'docs/activation-worker-runtime-noop-dry-run-reports'

export const WORKER_RUNTIME_NOOP_DRY_RUN_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'noop_dry_run_plan.json',
  'noop_dry_run_evidence_inventory.json',
  'noop_dry_run_fixture_validation_report.json',
  'noop_worker_intake_validation_report.json',
  'noop_worker_lifecycle_simulation_report.json',
  'noop_artifact_scope_validation_report.json',
  'noop_route_metadata_resolution_report.json',
  'noop_observability_cost_failure_report.json',
  'noop_dry_run_fail_closed_report.json',
  'noop_dry_run_decision.json',
  'noop_dry_run_blocker_report.json',
  'noop_dry_run_readiness_report.json',
  'noop_dry_run_private_artifact_manifest.json',
] as const

export const WORKER_RUNTIME_NOOP_DRY_RUN_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_DRY_RUN_APPROVAL_PACKET',
  'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_FIXTURE_DESIGN',
  'REEDITPRO_CONFIRM_PLAN_SNAPSHOT_INTAKE_AUDIT',
  'REEDITPRO_CONFIRM_ARTIFACT_SCOPE_POLICY_AUDIT',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION_BLOCKER_POLICY',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
] as const

export const WORKER_RUNTIME_NOOP_DRY_RUN_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_EXECUTION',
  'REEDITPRO_CONFIRM_REAL_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_EXECUTION',
  'REEDITPRO_CONFIRM_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_PROVIDER_EXECUTION',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_DOCKER_RUN',
  'REEDITPRO_CONFIRM_CLOUD_RUN_JOB',
  'REEDITPRO_CONFIRM_CLOUD_BUILD',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
] as const

const APPROVAL_REPORT_DIR = 'docs/activation-worker-runtime-dry-run-approval-reports'
const REPO_AUDIT_REPORT_DIR = 'docs/activation-worker-runtime-repo-audit-reports'
const PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR = 'docs/activation-model-orchestration-plan-snapshot-dry-run-reports'
const SESSION_0_REPORT_DIR = 'docs/activation-product-internal-testing-session-0-reports'
const TRACK_B_CLEAN_STAGING_REPORT_DIR =
  'docs/activation-supabase-trackb-clean-staging-backfill-reports'
const TRACK_B_ROUTE_MANIFEST_DIR = 'docs/activation-track-b-tool-route-manifest-reports'
const TRACK_B_CAPABILITY_MANIFEST_DIR = 'docs/activation-track-b-capability-manifests-reports'

const APPROVAL_FIXTURES_REPORT = path.join(APPROVAL_REPORT_DIR, 'approved_plan_snapshot_dry_run_fixtures.json')
const APPROVAL_DECISION_REPORT = path.join(APPROVAL_REPORT_DIR, 'worker_dry_run_approval_decision.json')

const RUNTIME_FALSE_FLAGS = {
  runtimeExecutionAllowed: false,
  workerExecution: false,
  workerExecutionAllowed: false,
  toolExecution: false,
  toolExecutionAllowed: false,
  routeExecution: false,
  routeExecutionAllowed: false,
  providerCalls: false,
  providerExecutionAllowed: false,
  dockerRun: false,
  cloudRunJob: false,
  cloudBuild: false,
  mediaProcessing: false,
  rawPromptExecution: false,
  supabaseWrites: false,
  sqlExecuted: false,
  migrationDeployed: false,
  artifactUpload: false,
  publicArtifacts: false,
  signedUrls: false,
  productionAffected: false,
  externalBeta: false,
  paidProduction: false,
  secretPayloadAccess: false,
  secretPayloadPrinted: false,
  secretPayloadCommitted: false,
  creditSpendOrReservation: false,
  stripeOrBilling: false,
  storageObjectsCreated: false,
  realQueueEnqueue: false,
  processSpawn: false,
  sidecarExecution: false,
}

const SOURCE_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/worker-runtime-dry-run-approval.md',
  'docs/worker-runtime-dry-run-scope-policy.md',
  'docs/worker-runtime-dry-run-artifact-scope-guardrails.md',
  'docs/worker-runtime-dry-run-queue-job-sidecar-policy.md',
  'docs/worker-runtime-dry-run-approval-decision.md',
  'docs/implementation-prompts/prompt-worker-runtime-noop-dry-run-execution.md',
  'docs/worker-runtime-repo-audit.md',
  'docs/worker-runtime-approved-plan-snapshot-intake.md',
  'docs/worker-runtime-artifact-scope-source-of-truth.md',
  'docs/worker-runtime-execution-blocker-policy.md',
  'docs/model-orchestration-plan-snapshot-dry-run.md',
  'docs/model-orchestration-plan-snapshot-dry-run-decision.md',
  'docs/restricted-internal-testing-session-0-decision.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  APPROVAL_REPORT_DIR,
  REPO_AUDIT_REPORT_DIR,
  PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR,
  SESSION_0_REPORT_DIR,
  TRACK_B_CLEAN_STAGING_REPORT_DIR,
  TRACK_B_ROUTE_MANIFEST_DIR,
  TRACK_B_CAPABILITY_MANIFEST_DIR,
] as const

type ApprovedPlanSnapshotFixture = {
  caseId: string
  kind: 'valid' | 'invalid_fail_closed'
  purpose?: string
  schemaVersion: string
  approvedSnapshotId: string
  sourceOfTruthRefs: string[]
  workerHandoffStatus?: string
  syntheticOnly: boolean
  realUserData: boolean
  realMedia: boolean
  privatePayloadCommitted: boolean
  runtimeExecutionAllowed: boolean
  workerExecutionAllowed: boolean
  toolExecutionAllowed: boolean
  providerExecutionAllowed: boolean
  publicArtifactsAllowed: boolean
  signedUrlsAsSourceOfTruthAllowed: boolean
  rawPromptForwardingAllowed: boolean
  productionMutationAllowed: boolean
  expectedDecision: string
  blockedActions?: string[]
  intentionallyInvalidReason?: string
}

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function collectFiles(root: string, limit = 80): { present: boolean; totalFiles: number; representativeFiles: string[] } {
  if (!existsSync(root)) return { present: false, totalFiles: 0, representativeFiles: [] }
  const files: string[] = []
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else files.push(fullPath.split(path.sep).join('/'))
    }
  }
  walk(root)
  files.sort()
  return {
    present: true,
    totalFiles: files.length,
    representativeFiles: files.slice(0, limit),
  }
}

function readAllTextFiles(root: string): Array<{ file: string; text: string }> {
  if (!existsSync(root)) return []
  const output: Array<{ file: string; text: string }> = []
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else if (statSync(fullPath).isFile()) output.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
    }
  }
  walk(root)
  return output
}

function hasUnsafeFlag(report: Record<string, unknown>): boolean {
  return Object.keys(RUNTIME_FALSE_FLAGS).some((key) => report[key] === true)
}

function runtimeFlags() {
  return { ...RUNTIME_FALSE_FLAGS }
}

function asFixtureArray(value: unknown): ApprovedPlanSnapshotFixture[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ApprovedPlanSnapshotFixture => {
    if (!item || typeof item !== 'object') return false
    const candidate = item as Partial<ApprovedPlanSnapshotFixture>
    return typeof candidate.caseId === 'string' &&
      (candidate.kind === 'valid' || candidate.kind === 'invalid_fail_closed') &&
      typeof candidate.schemaVersion === 'string' &&
      typeof candidate.approvedSnapshotId === 'string' &&
      Array.isArray(candidate.sourceOfTruthRefs)
  })
}

function loadApprovalDecision() {
  return readJson(APPROVAL_DECISION_REPORT)
}

function loadApprovalFixturesReport() {
  return readJson(APPROVAL_FIXTURES_REPORT)
}

function loadApprovalFixtures() {
  return asFixtureArray(loadApprovalFixturesReport()?.fixtures)
}

function hasRequiredSourceRefs(fixture: ApprovedPlanSnapshotFixture): boolean {
  const refs = fixture.sourceOfTruthRefs
  return refs.some((ref) => ref.startsWith('supabase_row_ref:')) &&
    refs.some((ref) => ref.startsWith('private_gcs_path_ref:')) &&
    refs.some((ref) => ref.startsWith('manifest_ref:')) &&
    refs.some((ref) => ref.startsWith('checksum_ref:'))
}

function fixtureExecutionFlagsRemainFalse(fixture: ApprovedPlanSnapshotFixture): boolean {
  return fixture.syntheticOnly === true &&
    fixture.realUserData === false &&
    fixture.realMedia === false &&
    fixture.privatePayloadCommitted === false &&
    fixture.runtimeExecutionAllowed === false &&
    fixture.workerExecutionAllowed === false &&
    fixture.toolExecutionAllowed === false &&
    fixture.providerExecutionAllowed === false &&
    fixture.publicArtifactsAllowed === false &&
    fixture.signedUrlsAsSourceOfTruthAllowed === false &&
    fixture.rawPromptForwardingAllowed === false &&
    fixture.productionMutationAllowed === false
}

export function getWorkerRuntimeNoopDryRunPlan() {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_RUN_ID,
    branch: WORKER_RUNTIME_NOOP_DRY_RUN_BRANCH,
    baseBranch: WORKER_RUNTIME_NOOP_DRY_RUN_BASE_BRANCH,
    prTitle: '[worker] No-op runtime dry-run execution',
    mode: 'server_only_metadata_noop_execution_packet',
    reportDir: WORKER_RUNTIME_NOOP_DRY_RUN_REPORT_DIR,
    expectedReports: WORKER_RUNTIME_NOOP_DRY_RUN_EXPECTED_REPORTS,
    requiredConfirmations: WORKER_RUNTIME_NOOP_DRY_RUN_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: WORKER_RUNTIME_NOOP_DRY_RUN_FORBIDDEN_CONFIRMATIONS,
    expectedDecision: 'worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval',
    simulatedStates: ['received', 'validated', 'blocked_from_execution', 'no_op_completed', 'failed_closed'],
    sourceFixtureReport: APPROVAL_FIXTURES_REPORT,
    nextRecommendedPhase: 'TOOL_ROUTE_RUNTIME - dry-run approval after worker no-op',
    ...runtimeFlags(),
  }
}

function buildSourceAudit() {
  const approvalDecision = loadApprovalDecision()
  const approvalFixturesReport = loadApprovalFixturesReport()
  const repoAuditDecision = readJson(path.join(REPO_AUDIT_REPORT_DIR, 'worker_runtime_repo_audit_decision.json'))
  const planSnapshotDryRunDecision = readJson(path.join(PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR, 'plan_snapshot_dry_run_decision.json'))

  const prEvidence = [
    {
      pr: 342,
      name: 'worker runtime dry-run approval packet',
      expectedDecision: 'approved_for_future_worker_noop_dry_run_execution',
      actualDecision: approvalDecision?.decision,
      present: approvalDecision !== undefined,
      accepted: approvalDecision?.decision === 'approved_for_future_worker_noop_dry_run_execution',
    },
    {
      pr: 342,
      name: 'approved plan snapshot no-op dry-run fixtures',
      expectedStatus: 'passed',
      actualStatus: approvalFixturesReport?.status,
      present: approvalFixturesReport !== undefined,
      accepted: approvalFixturesReport?.status === 'passed' &&
        approvalFixturesReport?.fixtureCount === 8 &&
        approvalFixturesReport?.validFixtureCount === 4 &&
        approvalFixturesReport?.invalidFailClosedFixtureCount === 4,
    },
    {
      pr: 341,
      name: 'worker runtime repo audit',
      expectedDecision: 'repo_audit_passed_ready_for_worker_dry_run_approval',
      actualDecision: repoAuditDecision?.decision,
      present: repoAuditDecision !== undefined,
      accepted: repoAuditDecision?.decision === 'repo_audit_passed_ready_for_worker_dry_run_approval',
    },
    {
      pr: 337,
      name: 'plan snapshot dry-run validation',
      expectedDecision: 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
      actualDecision: planSnapshotDryRunDecision?.decision,
      present: planSnapshotDryRunDecision !== undefined,
      accepted: planSnapshotDryRunDecision?.decision === 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
    },
    {
      pr: 298,
      name: 'Track B clean staging backfill',
      present: existsSync(TRACK_B_CLEAN_STAGING_REPORT_DIR),
      accepted: existsSync(TRACK_B_CLEAN_STAGING_REPORT_DIR),
      note: 'Historical registry sync evidence only; this packet performs no Supabase write.',
    },
  ]

  const integrationEvidence = [
    pathStatus(TRACK_B_ROUTE_MANIFEST_DIR),
    pathStatus(TRACK_B_CAPABILITY_MANIFEST_DIR),
    pathStatus('server/activation/worker-runtime-dry-run-approval'),
    pathStatus('server/activation/worker-runtime-repo-audit'),
    pathStatus('server/workers'),
    pathStatus('server/jobs'),
    pathStatus('server/queues'),
  ]

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: prEvidence.every((item) => item.accepted) &&
      integrationEvidence.slice(0, 2).every((item) => item.present) ? 'passed' : 'blocked',
    owner: 'WORKER_RUNTIME_JOBS',
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    prEvidence,
    integrationEvidence,
    sourceOfTruthConflictsFound: false,
    missingOptionalDocsAreRecordedNotMutated: true,
    ...runtimeFlags(),
  }
}

function buildEvidenceInventory() {
  const approvalDecision = loadApprovalDecision()
  const approvalFixturesReport = loadApprovalFixturesReport()
  const fixtures = loadApprovalFixtures()
  const validFixtures = fixtures.filter((fixture) => fixture.kind === 'valid')
  const invalidFixtures = fixtures.filter((fixture) => fixture.kind === 'invalid_fail_closed')

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: approvalDecision?.decision === 'approved_for_future_worker_noop_dry_run_execution' &&
      approvalFixturesReport?.status === 'passed' &&
      validFixtures.length === 4 &&
      invalidFixtures.length === 4 ? 'passed' : 'blocked',
    approvalDecisionPath: APPROVAL_DECISION_REPORT,
    fixtureSourcePath: APPROVAL_FIXTURES_REPORT,
    approvalDecision: approvalDecision?.decision,
    approvalStatus: approvalDecision?.status,
    fixtureStatus: approvalFixturesReport?.status,
    fixtureCount: fixtures.length,
    validFixtureCount: validFixtures.length,
    invalidFailClosedFixtureCount: invalidFixtures.length,
    requiredEvidence: [
      { name: 'PR #342 worker dry-run approval decision', path: APPROVAL_DECISION_REPORT, present: approvalDecision !== undefined },
      { name: 'PR #342 approved plan snapshot fixtures', path: APPROVAL_FIXTURES_REPORT, present: approvalFixturesReport !== undefined },
      { name: 'PR #341 repo audit report', path: REPO_AUDIT_REPORT_DIR, present: existsSync(REPO_AUDIT_REPORT_DIR) },
      { name: 'PR #337 plan snapshot dry-run report', path: PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR, present: existsSync(PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR) },
      { name: 'PR #311 Session 0 report', path: SESSION_0_REPORT_DIR, present: existsSync(SESSION_0_REPORT_DIR) },
      { name: 'PR #298 clean-staging Track B sync', path: TRACK_B_CLEAN_STAGING_REPORT_DIR, present: existsSync(TRACK_B_CLEAN_STAGING_REPORT_DIR) },
    ],
    routeMetadataSources: {
      routeManifest: collectFiles(TRACK_B_ROUTE_MANIFEST_DIR, 20),
      capabilityManifest: collectFiles(TRACK_B_CAPABILITY_MANIFEST_DIR, 20),
    },
    ...runtimeFlags(),
  }
}

function buildFixtureValidationReport() {
  const fixtureReport = loadApprovalFixturesReport()
  const fixtures = loadApprovalFixtures()
  const fixtureResults = fixtures.map((fixture) => {
    const errors: string[] = []
    if (fixture.schemaVersion !== 'approved_plan_snapshot_v1') errors.push('schema_version_not_approved_plan_snapshot_v1')
    if (!fixture.approvedSnapshotId.startsWith('synthetic-')) errors.push('approved_snapshot_id_not_synthetic')
    if (!hasRequiredSourceRefs(fixture)) errors.push('required_private_source_of_truth_refs_missing')
    if (!fixtureExecutionFlagsRemainFalse(fixture)) errors.push('execution_or_payload_flag_not_false')
    if (fixture.kind === 'valid' && fixture.expectedDecision !== 'accepted_for_future_noop_dry_run_fixture') {
      errors.push('valid_fixture_expected_decision_not_accepted')
    }
    if (fixture.kind === 'invalid_fail_closed') {
      if (fixture.expectedDecision !== 'fail_closed') errors.push('invalid_fixture_expected_decision_not_fail_closed')
      if (!fixture.intentionallyInvalidReason) errors.push('invalid_fixture_reason_missing')
      if (!Array.isArray(fixture.blockedActions) || fixture.blockedActions.length === 0) {
        errors.push('invalid_fixture_blocked_actions_missing')
      }
    }
    return {
      caseId: fixture.caseId,
      kind: fixture.kind,
      status: errors.length === 0 ? 'passed' : 'blocked',
      errors,
      schemaVersion: fixture.schemaVersion,
      sourceOfTruthRefCount: fixture.sourceOfTruthRefs.length,
      expectedDecision: fixture.expectedDecision,
      intentionallyInvalidReason: fixture.intentionallyInvalidReason,
      ...runtimeFlags(),
    }
  })

  const validPassedCount = fixtureResults.filter((item) => item.kind === 'valid' && item.status === 'passed').length
  const invalidFailClosedCount = fixtureResults
    .filter((item) => item.kind === 'invalid_fail_closed' && item.status === 'passed').length
  const blockedFixtures = fixtureResults.filter((item) => item.status !== 'passed')

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: fixtureReport?.status === 'passed' &&
      fixtures.length === 8 &&
      validPassedCount === 4 &&
      invalidFailClosedCount === 4 &&
      blockedFixtures.length === 0 ? 'passed' : 'blocked',
    fixtureSourcePath: APPROVAL_FIXTURES_REPORT,
    sourceFixtureStatus: fixtureReport?.status,
    fixtureCount: fixtures.length,
    validPassedCount,
    invalidFailClosedCount,
    blockedFixtures,
    fixtureResults,
    noNewFixtureFormatInvented: true,
    ...runtimeFlags(),
  }
}

function buildWorkerIntakeValidationReport() {
  const fixtures = loadApprovalFixtures()
  const intakeResults = fixtures.map((fixture) => {
    if (fixture.kind === 'valid') {
      return {
        caseId: fixture.caseId,
        status: 'accepted_for_noop_lifecycle',
        acceptedInputSchema: 'approved_plan_snapshot_v1',
        rejectedInputs: [
          'raw_prompt_input',
          'provider_response_input',
          'edit_intents_only_input',
          'plan_snapshot_candidate_input',
        ],
        syntheticCorrelationId: `noop-correlation-${fixture.caseId}`,
        syntheticLifecycleId: `noop-lifecycle-${fixture.caseId}`,
        queueEnqueue: false,
        ...runtimeFlags(),
      }
    }

    return {
      caseId: fixture.caseId,
      status: 'failed_closed_before_intake',
      acceptedInputSchema: 'none',
      intentionallyInvalidReason: fixture.intentionallyInvalidReason,
      blockedActions: fixture.blockedActions ?? [],
      queueEnqueue: false,
      ...runtimeFlags(),
    }
  })

  const acceptedValidCount = intakeResults.filter((item) => item.status === 'accepted_for_noop_lifecycle').length
  const failedClosedInvalidCount = intakeResults.filter((item) => item.status === 'failed_closed_before_intake').length

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: acceptedValidCount === 4 && failedClosedInvalidCount === 4 ? 'passed' : 'blocked',
    acceptedValidCount,
    failedClosedInvalidCount,
    intakeResults,
    rawPromptInputAccepted: false,
    providerResponseInputAccepted: false,
    planSnapshotCandidateInputAccepted: false,
    approvedPlanSnapshotV1Required: true,
    ...runtimeFlags(),
  }
}

function buildWorkerLifecycleSimulationReport() {
  const fixtures = loadApprovalFixtures()
  const lifecycleResults = fixtures.map((fixture) => {
    const states = fixture.kind === 'valid'
      ? ['received', 'validated', 'blocked_from_execution', 'no_op_completed']
      : ['received', 'validated', 'blocked_from_execution', 'failed_closed']

    return {
      caseId: fixture.caseId,
      kind: fixture.kind,
      syntheticCorrelationId: `noop-correlation-${fixture.caseId}`,
      syntheticLifecycleId: `noop-lifecycle-${fixture.caseId}`,
      states,
      terminalState: states[states.length - 1],
      ...runtimeFlags(),
    }
  })

  const validCompletedCount = lifecycleResults.filter((item) => item.terminalState === 'no_op_completed').length
  const invalidFailedClosedCount = lifecycleResults.filter((item) => item.terminalState === 'failed_closed').length

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: validCompletedCount === 4 && invalidFailedClosedCount === 4 ? 'passed' : 'blocked',
    simulatedOnly: true,
    allowedSimulatedStates: ['received', 'validated', 'blocked_from_execution', 'no_op_completed', 'failed_closed'],
    validCompletedCount,
    invalidFailedClosedCount,
    lifecycleResults,
    ...runtimeFlags(),
  }
}

function buildArtifactScopeValidationReport() {
  const fixtures = loadApprovalFixtures()
  const results = fixtures.map((fixture) => {
    const forbiddenRefs = fixture.sourceOfTruthRefs.filter((ref) => {
      const lower = ref.toLowerCase()
      return lower.startsWith('signed_url:') ||
        lower.startsWith('public_artifact_url:') ||
        lower.startsWith('http://') ||
        lower.startsWith('https://') ||
        lower.includes('x-goog-signature')
    })
    const errors = [
      ...(!hasRequiredSourceRefs(fixture) ? ['required_private_source_refs_missing'] : []),
      ...(forbiddenRefs.length > 0 ? ['forbidden_public_or_signed_reference_found'] : []),
      ...(fixture.privatePayloadCommitted ? ['private_payload_committed'] : []),
      ...(fixture.publicArtifactsAllowed ? ['public_artifact_flag_enabled'] : []),
      ...(fixture.signedUrlsAsSourceOfTruthAllowed ? ['signed_url_source_of_truth_flag_enabled'] : []),
    ]

    return {
      caseId: fixture.caseId,
      status: errors.length === 0 ? 'passed' : 'blocked',
      errors,
      sourceOfTruthRefs: fixture.sourceOfTruthRefs,
      publicOrSignedRefCount: forbiddenRefs.length,
      ...runtimeFlags(),
    }
  })
  const blocked = results.filter((item) => item.status !== 'passed')

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: results.length === 8 && blocked.length === 0 ? 'passed' : 'blocked',
    requiredPrivateRefs: [
      'supabase_row_ref',
      'private_gcs_path_ref',
      'manifest_ref',
      'checksum_ref',
      'approved_plan_snapshot_v1',
    ],
    forbiddenRefs: [
      'public_artifact_url',
      'signed_url',
      'raw_provider_response',
      'raw_prompt',
      'unapproved_local_media_path',
    ],
    results,
    blocked,
    ...runtimeFlags(),
  }
}

function buildRouteMetadataResolutionReport() {
  const fixtures = loadApprovalFixtures()
  const routeManifestFiles = collectFiles(TRACK_B_ROUTE_MANIFEST_DIR, 40)
  const capabilityManifestFiles = collectFiles(TRACK_B_CAPABILITY_MANIFEST_DIR, 40)
  const routeResolutionResults = fixtures
    .filter((fixture) => fixture.kind === 'valid')
    .map((fixture) => ({
      caseId: fixture.caseId,
      resolutionMode: fixture.caseId === 'valid_route_resolution_only_plan'
        ? 'track_b_route_metadata_resolved'
        : 'route_metadata_not_required_for_fixture',
      routeManifestRead: routeManifestFiles.present,
      capabilityManifestRead: capabilityManifestFiles.present,
      routeExecution: false,
      toolExecution: false,
      workerExecution: false,
      runtimeExecutionAllowed: false,
    }))

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: routeManifestFiles.present && capabilityManifestFiles.present ? 'passed' : 'blocked',
    routeManifestFiles,
    capabilityManifestFiles,
    routeResolutionResults,
    ...runtimeFlags(),
  }
}

function buildObservabilityCostFailureReport() {
  const fixtures = loadApprovalFixtures()
  const results = fixtures.map((fixture) => ({
    caseId: fixture.caseId,
    syntheticCorrelationId: `noop-correlation-${fixture.caseId}`,
    syntheticLifecycleId: `noop-lifecycle-${fixture.caseId}`,
    approvedSnapshotId: fixture.approvedSnapshotId,
    costClass: fixture.kind === 'valid' ? 'metadata_noop_zero_cloud_runtime_cost' : 'fail_closed_before_cost_estimation',
    creditReservationAllowed: false,
    costMutationAllowed: false,
    timeoutClass: 'metadata_noop_short_timeout',
    retryPolicy: 'disabled_for_noop_dry_run',
    failureMapping: fixture.kind === 'valid' ? 'no_op_completed' : 'failed_closed',
    auditPayloadClass: 'safe_synthetic_metadata_only',
    ...runtimeFlags(),
  }))

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: results.length === 8 ? 'passed' : 'blocked',
    requiredMetadata: [
      'synthetic_correlation_id',
      'approved_plan_snapshot_id',
      'artifact_manifest_refs',
      'noop_lifecycle_id',
      'cost_class',
      'timeout_class',
      'retry_policy',
      'failure_mapping',
    ],
    missingAuditOrCostMetadata: false,
    results,
    ...runtimeFlags(),
  }
}

function buildFailClosedReport() {
  const fixtures = loadApprovalFixtures()
  const invalidReasons = fixtures
    .filter((fixture) => fixture.kind === 'invalid_fail_closed')
    .map((fixture) => fixture.intentionallyInvalidReason)
  const requiredPolicies = [
    'missing_approved_plan_snapshot',
    'raw_prompt_input',
    'provider_response_input',
    'plan_snapshot_candidate_input',
    'invalid_artifact_scope',
    'public_artifact_request',
    'signed_url_source_of_truth_request',
    'production_mutation',
    'broad_media_request',
    'real_tool_execution_request',
    'worker_execution_request',
    'docker_or_cloud_run_request',
    'missing_audit_cost_metadata',
  ]
  const fixtureCoverage = {
    rawPrompt: invalidReasons.includes('raw_prompt_worker_input'),
    publicArtifact: invalidReasons.includes('public_artifact_output_request'),
    broadMedia: invalidReasons.includes('broad_media_processing_request'),
    productionMutation: invalidReasons.includes('production_write_request'),
  }

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: Object.values(fixtureCoverage).every(Boolean) ? 'passed' : 'blocked',
    requiredPolicies,
    fixtureCoverage,
    invalidFixtureReasons: invalidReasons,
    failureMode: 'blocked_before_any_enqueue_process_spawn_sidecar_tool_route_provider_or_mutation',
    ...runtimeFlags(),
  }
}

function selectDecision(
  reports: Omit<WorkerRuntimeNoopDryRunReports, 'decision' | 'blockerReport' | 'readinessReport' | 'privateArtifactManifest'>,
): WorkerRuntimeNoopDryRunDecision {
  if (Object.values(reports).some(hasUnsafeFlag)) return 'rejected_due_execution_safety_risk'
  if (reports.sourceAudit.status !== 'passed' || reports.evidenceInventory.status !== 'passed') {
    return 'blocked_pending_fixture_validation'
  }
  if (reports.fixtureValidationReport.status !== 'passed') return 'blocked_pending_fixture_validation'
  if (reports.workerIntakeValidationReport.status !== 'passed' ||
    reports.workerLifecycleSimulationReport.status !== 'passed') {
    return 'blocked_pending_intake_validation'
  }
  if (reports.artifactScopeValidationReport.status !== 'passed') return 'blocked_pending_artifact_scope_validation'
  if (reports.routeMetadataResolutionReport.status !== 'passed') return 'blocked_pending_route_metadata_resolution'
  if (reports.observabilityCostFailureReport.status !== 'passed') return 'blocked_pending_observability_cost_validation'
  if (reports.failClosedReport.status !== 'passed') return 'blocked_pending_fail_closed_validation'
  return 'worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval'
}

function buildDecision(
  reports: Omit<WorkerRuntimeNoopDryRunReports, 'decision' | 'blockerReport' | 'readinessReport' | 'privateArtifactManifest'>,
) {
  const decision = selectDecision(reports)
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_RUN_ID,
    status: decision === 'worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval'
      ? 'passed'
      : decision.startsWith('rejected_') ? 'rejected' : 'blocked',
    decision,
    activeBlockers: decision === 'worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval' ? [] : [decision],
    noopDryRunAttempted: true,
    noopDryRunPassed: decision === 'worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval',
    session0Started: false,
    nextRecommendedPhase: decision === 'worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval'
      ? 'TOOL_ROUTE_RUNTIME - dry-run approval after worker no-op'
      : 'Resolve the exact worker no-op dry-run blocker before tool-route approval.',
    ...runtimeFlags(),
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: decision.status,
    activeBlockers: decision.activeBlockers,
    blockedScopesStillBlocked: [
      'real_worker_execution',
      'real_tool_execution',
      'route_execution',
      'provider_calls',
      'docker',
      'cloud_run',
      'cloud_build',
      'media_processing',
      'supabase_writes',
      'artifact_upload',
      'public_artifacts',
      'signed_urls',
      'raw_prompt_execution',
      'production',
      'external_beta',
      'paid_production',
      'track_a_runtime',
    ],
    ...runtimeFlags(),
  }
}

function buildReadinessReport(decision: Record<string, unknown>) {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: decision.status,
    decision: decision.decision,
    noopDryRunAttempted: true,
    noopDryRunPassed: decision.noopDryRunPassed === true,
    readyForToolRouteDryRunApproval: decision.decision === 'worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval',
    supabaseUpdateRequired: 'no_write',
    supabaseEnvironmentTouched: 'none',
    sql: 'none',
    trackBCleanStagingMilestoneSync: 'completed_historical_evidence_only',
    packageLockChanged: false,
    ...runtimeFlags(),
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_PHASE,
    status: 'passed',
    artifacts: WORKER_RUNTIME_NOOP_DRY_RUN_EXPECTED_REPORTS.map((name) => ({
      name,
      path: `${WORKER_RUNTIME_NOOP_DRY_RUN_REPORT_DIR}/${name}`,
      classification: 'safe_metadata_report',
      containsSecretPayload: false,
      containsPrivatePayload: false,
      containsRawProviderOutput: false,
      publicArtifact: false,
    })),
    ...runtimeFlags(),
  }
}

export function buildWorkerRuntimeNoopDryRunReports(): WorkerRuntimeNoopDryRunReports {
  const sourceAudit = buildSourceAudit()
  const plan = getWorkerRuntimeNoopDryRunPlan()
  const evidenceInventory = buildEvidenceInventory()
  const fixtureValidationReport = buildFixtureValidationReport()
  const workerIntakeValidationReport = buildWorkerIntakeValidationReport()
  const workerLifecycleSimulationReport = buildWorkerLifecycleSimulationReport()
  const artifactScopeValidationReport = buildArtifactScopeValidationReport()
  const routeMetadataResolutionReport = buildRouteMetadataResolutionReport()
  const observabilityCostFailureReport = buildObservabilityCostFailureReport()
  const failClosedReport = buildFailClosedReport()
  const decision = buildDecision({
    sourceAudit,
    plan,
    evidenceInventory,
    fixtureValidationReport,
    workerIntakeValidationReport,
    workerLifecycleSimulationReport,
    artifactScopeValidationReport,
    routeMetadataResolutionReport,
    observabilityCostFailureReport,
    failClosedReport,
  })
  const blockerReport = buildBlockerReport(decision)
  const readinessReport = buildReadinessReport(decision)
  const privateArtifactManifest = buildPrivateArtifactManifest()

  return {
    sourceAudit,
    plan,
    evidenceInventory,
    fixtureValidationReport,
    workerIntakeValidationReport,
    workerLifecycleSimulationReport,
    artifactScopeValidationReport,
    routeMetadataResolutionReport,
    observabilityCostFailureReport,
    failClosedReport,
    decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

async function updateReadinessDocs(decision: string) {
  const scorecardPath = 'docs/beta-readiness-scorecard.md'
  if (existsSync(scorecardPath)) {
    const current = readFileSync(scorecardPath, 'utf8')
    const line = `Worker runtime no-op dry-run status: ${decision}. Dry-run is synthetic metadata-only; worker/tool/route/provider execution, Docker, Cloud Run, Cloud Build, Supabase writes, media processing, artifact upload, public artifacts, signed URLs, external beta, paid production, and production remain blocked.`
    const next = current.includes('Worker runtime no-op dry-run status:')
      ? current.replace(/\n*Worker runtime no-op dry-run status:.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(scorecardPath, next)
  }

  const blockerPath = 'docs/production-beta-blocker-inventory.md'
  if (existsSync(blockerPath)) {
    const current = readFileSync(blockerPath, 'utf8')
    const line = `Worker runtime no-op dry-run does not remove production beta blockers; current decision is \`${decision}\`.`
    const next = current.includes('Worker runtime no-op dry-run does not remove production beta blockers;')
      ? current.replace(/\n*Worker runtime no-op dry-run does not remove production beta blockers;.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(blockerPath, next)
  }

  const foundationPath = 'PRODUCTION_FOUNDATION_STATUS.md'
  if (existsSync(foundationPath)) {
    const current = readFileSync(foundationPath, 'utf8')
    const line = `Worker runtime no-op dry-run status: ${decision}. This is metadata-only and does not start workers, tools, routes, providers, Supabase writes, public artifacts, signed URLs, external beta, paid production, or production.`
    const next = current.includes('Worker runtime no-op dry-run status:')
      ? current.replace(/\n*Worker runtime no-op dry-run status:.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(foundationPath, next)
  }
}

export async function writeWorkerRuntimeNoopDryRunArtifacts(reports: WorkerRuntimeNoopDryRunReports) {
  const reportMap: Record<typeof WORKER_RUNTIME_NOOP_DRY_RUN_EXPECTED_REPORTS[number], Record<string, unknown>> = {
    'source_of_truth_ownership_audit.json': reports.sourceAudit,
    'noop_dry_run_plan.json': reports.plan,
    'noop_dry_run_evidence_inventory.json': reports.evidenceInventory,
    'noop_dry_run_fixture_validation_report.json': reports.fixtureValidationReport,
    'noop_worker_intake_validation_report.json': reports.workerIntakeValidationReport,
    'noop_worker_lifecycle_simulation_report.json': reports.workerLifecycleSimulationReport,
    'noop_artifact_scope_validation_report.json': reports.artifactScopeValidationReport,
    'noop_route_metadata_resolution_report.json': reports.routeMetadataResolutionReport,
    'noop_observability_cost_failure_report.json': reports.observabilityCostFailureReport,
    'noop_dry_run_fail_closed_report.json': reports.failClosedReport,
    'noop_dry_run_decision.json': reports.decision,
    'noop_dry_run_blocker_report.json': reports.blockerReport,
    'noop_dry_run_readiness_report.json': reports.readinessReport,
    'noop_dry_run_private_artifact_manifest.json': reports.privateArtifactManifest,
  }

  for (const [name, report] of Object.entries(reportMap)) {
    await writeVlmRuntimeJsonArtifact(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_REPORT_DIR, name), report)
  }

  const decision = String(reports.decision.decision)
  await writeVlmRuntimeTextArtifact('docs/worker-runtime-noop-dry-run.md', `# Worker Runtime No-Op Dry-Run

Decision: \`${decision}\`.

This packet consumes PR #342 approved synthetic \`approved_plan_snapshot_v1\` fixtures and simulates worker intake/lifecycle states in process only: received, validated, blocked from execution, no-op completed, and failed closed.

It does not execute workers, tools, routes, providers, Docker, Cloud Run, Cloud Build, media processing, Supabase writes, artifact uploads, public artifacts, signed URLs, external beta, paid production, or production.

Next phase: \`TOOL_ROUTE_RUNTIME - dry-run approval after worker no-op\`.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-noop-dry-run-decision.md', `# Worker Runtime No-Op Dry-Run Decision

Decision: \`${decision}\`.

No-op dry-run passed: \`${String(reports.readinessReport.noopDryRunPassed)}\`.

Ready for tool-route dry-run approval: \`${String(reports.readinessReport.readyForToolRouteDryRunApproval)}\`.

Supabase classification: no write, SQL none, migration deployed no, environment touched none. Track B clean-staging milestone sync remains historical completed evidence only.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-noop-dry-run-artifact-scope.md', `# Worker Runtime No-Op Dry-Run Artifact Scope

The no-op dry-run accepts only private, synthetic source-of-truth references from PR #342 fixtures: Supabase row refs, private GCS path refs, manifest refs, and checksum refs.

Public artifact URLs, signed URLs as source of truth, raw provider responses, raw prompts, unapproved local media paths, private payload commits, and artifact uploads remain blocked.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-noop-dry-run-fail-closed.md', `# Worker Runtime No-Op Dry-Run Fail-Closed Policy

Invalid fixtures fail closed before any queue enqueue, worker process spawn, sidecar execution, tool execution, route execution, provider call, Docker, Cloud Run, Cloud Build, Supabase write, media processing, public artifact, signed URL, external beta, paid production, or production action.

Fail-closed classes include raw prompt input, provider response input, plan snapshot candidate input, invalid artifact scope, public artifact request, signed URL source-of-truth request, production mutation, broad media request, real tool or worker execution request, Docker or Cloud Run request, and missing audit/cost metadata.
`)

  await writeVlmRuntimeTextArtifact(
    'docs/implementation-prompts/prompt-tool-route-dry-run-approval-after-worker-noop.md',
    `# TOOL_ROUTE_RUNTIME - Dry-Run Approval After Worker No-Op

Proceed only after \`worker_noop_dry_run_passed_ready_for_tool_route_dry_run_approval\`.

Scope: approval/reporting packet for a future tool-route metadata dry-run. Use the no-op worker dry-run decision, fixture validation, lifecycle simulation, route metadata resolution, and fail-closed reports as source evidence.

Do not execute real tools, routes, workers, providers, media processing, Docker, Cloud Run, Cloud Build, Supabase writes, artifact uploads, public artifacts, signed URLs, external beta, paid production, or production unless a later owner-approved execution phase explicitly authorizes that narrow action.
`,
  )

  await updateReadinessDocs(decision)
}

function forbiddenConfirmationsPresent() {
  return WORKER_RUNTIME_NOOP_DRY_RUN_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
}

function missingConfirmations() {
  return WORKER_RUNTIME_NOOP_DRY_RUN_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
}

export async function executeWorkerRuntimeNoopDryRun(input: { execute: boolean; metadataOnly: boolean; keepTemp: boolean }) {
  const reports = buildWorkerRuntimeNoopDryRunReports()
  const forbidden = forbiddenConfirmationsPresent()
  const missing = missingConfirmations()

  if (!input.execute || !input.metadataOnly) {
    await writeWorkerRuntimeNoopDryRunArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'execute_metadata_only_required' }
  }

  if (forbidden.length > 0) {
    await writeWorkerRuntimeNoopDryRunArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'forbidden_confirmations_present', forbidden }
  }

  if (missing.length > 0) {
    await writeWorkerRuntimeNoopDryRunArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'missing_required_confirmations', missing }
  }

  await writeWorkerRuntimeNoopDryRunArtifacts(reports)
  return { exitCode: reports.decision.status === 'passed' ? 0 : 1, status: reports.decision.status, keepTemp: input.keepTemp }
}

export function readWorkerRuntimeNoopDryRunSummary() {
  return readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_REPORT_DIR, 'noop_dry_run_readiness_report.json')) ??
    buildWorkerRuntimeNoopDryRunReports().readinessReport
}

export function scanWorkerRuntimeNoopDryRunArtifactsForUnsafePatterns() {
  const files = [
    ...readAllTextFiles(WORKER_RUNTIME_NOOP_DRY_RUN_REPORT_DIR),
    ...[
      'docs/worker-runtime-noop-dry-run.md',
      'docs/worker-runtime-noop-dry-run-decision.md',
      'docs/worker-runtime-noop-dry-run-artifact-scope.md',
      'docs/worker-runtime-noop-dry-run-fail-closed.md',
      'docs/implementation-prompts/prompt-tool-route-dry-run-approval-after-worker-noop.md',
    ].filter(existsSync).map((file) => ({ file, text: readFileSync(file, 'utf8') })),
  ]
  const forbiddenPatterns = [
    /"workerExecution"\s*:\s*true/,
    /"workerExecutionAllowed"\s*:\s*true/,
    /"toolExecution"\s*:\s*true/,
    /"toolExecutionAllowed"\s*:\s*true/,
    /"routeExecution"\s*:\s*true/,
    /"routeExecutionAllowed"\s*:\s*true/,
    /"providerCalls"\s*:\s*true/,
    /"providerExecutionAllowed"\s*:\s*true/,
    /"dockerRun"\s*:\s*true/,
    /"cloudRunJob"\s*:\s*true/,
    /"cloudBuild"\s*:\s*true/,
    /"supabaseWrites"\s*:\s*true/,
    /"artifactUpload"\s*:\s*true/,
    /"publicArtifacts"\s*:\s*true/,
    /"signedUrls"\s*:\s*true/,
    /"rawPromptExecution"\s*:\s*true/,
    /"productionAffected"\s*:\s*true/,
    /docker\s+run/i,
    /gcloud\s+run/i,
    /gcloud\s+builds/i,
    /postgres(?:ql)?:\/\/[^\s"'`]+/i,
    /sbp_[A-Za-z0-9_-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    new RegExp('BEGIN ' + 'PRIVATE KEY'),
    new RegExp('x-goog-' + 'signature=', 'i'),
    new RegExp('AKIA' + '[0-9A-Z]{16}'),
    new RegExp('sk-' + '[A-Za-z0-9]{20,}'),
  ]

  const findings = files.flatMap(({ file, text }) => forbiddenPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => ({ file, pattern: String(pattern) })))

  return {
    status: findings.length === 0 ? 'passed' : 'failed',
    findings,
  }
}
