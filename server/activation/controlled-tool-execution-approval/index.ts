import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  ControlledToolApprovalReportSet,
  ControlledToolBooleanFlags,
  ControlledToolCandidate,
  ControlledToolExecutionApprovalDecision,
  ControlledToolPrEvidence,
} from './controlled-tool-execution-approval-types'

export const CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR = 'docs/activation-controlled-tool-execution-approval-reports'
const TOOL_ROUTE_METADATA_REPORT_DIR = 'docs/activation-tool-route-metadata-dry-run-reports'
const TOOL_ROUTE_APPROVAL_REPORT_DIR = 'docs/activation-tool-route-dry-run-approval-reports'

const reportPaths = {
  sourceOfTruthAudit: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_tool_execution_source_of_truth_audit.json`,
  preApprovalRevalidation: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/pre_approval_revalidation_report.json`,
  evidenceInventory: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_tool_execution_evidence_inventory.json`,
  firstCandidateReview: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/first_controlled_tool_candidate_review.json`,
  scopePolicy: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_execution_scope_policy.json`,
  approvedPlanSnapshotRequirements: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/approved_plan_snapshot_requirements.json`,
  workerHandoffRequirements: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/worker_handoff_requirements.json`,
  artifactGuardrails: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_tool_artifact_source_of_truth_guardrails.json`,
  failClosedPolicy: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_tool_fail_closed_policy.json`,
  observabilityCostAuditRequirements: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_tool_observability_cost_audit_requirements.json`,
  decision: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_tool_execution_approval_decision.json`,
  blockerReport: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_tool_execution_approval_blocker_report.json`,
  readinessReport: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_tool_execution_approval_readiness_report.json`,
  privateArtifactManifest: `${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/controlled_tool_execution_approval_private_artifact_manifest.json`,
}

const docPaths = [
  'docs/controlled-tool-execution-approval.md',
  'docs/controlled-tool-execution-first-candidate-review.md',
  'docs/controlled-tool-execution-scope-policy.md',
  'docs/controlled-tool-execution-approved-plan-snapshot-requirements.md',
  'docs/controlled-tool-execution-worker-handoff-requirements.md',
  'docs/controlled-tool-execution-artifact-guardrails.md',
  'docs/controlled-tool-execution-fail-closed-policy.md',
  'docs/controlled-tool-execution-observability-cost-audit.md',
  'docs/controlled-tool-execution-approval-decision.md',
  'docs/implementation-prompts/prompt-first-controlled-tool-execution-dry-run.md',
]

export function buildControlledToolExecutionApprovalPlan() {
  return {
    phase: 'CONTROLLED_TOOL_EXECUTION',
    packet: 'controlled tool execution approval after route metadata dry-run',
    branch: 'codex/rp-controlled-tool-execution-approval-after-route-dry-run',
    baseBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    mode: 'metadata_docs_reports_only',
    expectedDecision: 'approved_for_future_first_controlled_tool_execution_dry_run',
    selectedFirstCandidate: 'controlled-tool:first_fixture_report_validation',
    requiredConfirmations: requiredConfirmations(),
    forbiddenScopes: Object.entries(blockedFlags())
      .filter(([, value]) => value === false)
      .map(([name]) => name),
    reports: Object.values(reportPaths),
    docs: docPaths,
  }
}

export function buildControlledToolExecutionApprovalReports(): ControlledToolApprovalReportSet {
  const createdAt = new Date().toISOString()
  const flags = blockedFlags()
  const prEvidence = buildPrEvidence()
  const duplicateRisk = buildDuplicateRiskEvidence(prEvidence)
  const metadataEvidence = readMetadataDryRunEvidence()
  const routeApprovalEvidence = readToolRouteApprovalEvidence()
  const docsPresence = buildDocsPresence()
  const selectedCandidate = buildFirstCandidate(metadataEvidence, flags)
  const firstCandidateReview = buildFirstCandidateReview(selectedCandidate, metadataEvidence, flags)
  const scopePolicy = buildScopePolicy(createdAt, flags)
  const approvedPlanSnapshotRequirements = buildApprovedPlanSnapshotRequirements(createdAt, selectedCandidate)
  const workerHandoffRequirements = buildWorkerHandoffRequirements(createdAt, selectedCandidate, flags)
  const artifactGuardrails = buildArtifactGuardrails(createdAt, selectedCandidate)
  const failClosedPolicy = buildFailClosedPolicy(createdAt)
  const observabilityCostAuditRequirements = buildObservabilityCostAudit(createdAt, selectedCandidate)
  const executionRisk = hasExecutionRisk(flags)
  const blockers = buildBlockers({
    metadataDryRunPassed: metadataEvidence.passed,
    routeApprovalPassed: routeApprovalEvidence.passed,
    firstCandidatePassed: firstCandidateReview.passed === true,
    approvedPlanSnapshotPassed: approvedPlanSnapshotRequirements.passed === true,
    workerHandoffPassed: workerHandoffRequirements.passed === true,
    artifactGuardrailsPassed: artifactGuardrails.passed === true,
    failClosedPolicyPassed: failClosedPolicy.passed === true,
    observabilityCostAuditPassed: observabilityCostAuditRequirements.passed === true,
    executionRisk,
  })
  const decision = chooseDecision(blockers)
  const readiness = decision === 'approved_for_future_first_controlled_tool_execution_dry_run'

  const sourceOfTruthAudit = {
    schema: 'reeditpro.controlledToolExecutionApproval.sourceOfTruthAudit.v1',
    createdAt,
    sourceBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    expectedSourceSha: 'd60f629836acc30085e4f83cdb3cff2c9f0bc454',
    currentBranch: safeGit(['branch', '--show-current']) ?? null,
    currentSha: safeGit(['rev-parse', 'HEAD']) ?? null,
    pr387: prEvidence[387] ?? null,
    pr388: prEvidence[388] ?? null,
    pr384DuplicateRisk: duplicateRisk,
    mergedToolRouteSourceEvidencePresent: prEvidence[387]?.state === 'MERGED' && prEvidence[388]?.state === 'MERGED',
    localToolRouteMetadataDryRunReportsPresent: metadataEvidence.sourceReportsPresent,
    docsPresence,
    flags,
    supabaseClassification: supabaseClassification(),
    decision,
  }

  const preApprovalRevalidation = {
    schema: 'reeditpro.controlledToolExecutionApproval.preApprovalRevalidation.v1',
    createdAt,
    pr387Merged: prEvidence[387]?.state === 'MERGED' && Boolean(prEvidence[387]?.mergedAt),
    pr388Merged: prEvidence[388]?.state === 'MERGED' && Boolean(prEvidence[388]?.mergedAt),
    routeApprovalEvidence,
    metadataEvidence,
    pr384ReferenceOnly: duplicateRisk.treatedAsSourceOfTruth === false,
    blockedScopesPreserved: !executionRisk,
    packageLockChanged: packageLockChanged(),
    missingLocalEvidenceRecordedAsAuditFacts: docsPresence.missingEvidenceDirectories,
  }

  const evidenceInventory = {
    schema: 'reeditpro.controlledToolExecutionApproval.evidenceInventory.v1',
    createdAt,
    toolRouteApprovalDecision: routeApprovalEvidence.decision,
    toolRouteMetadataDryRunDecision: metadataEvidence.decision,
    toolRouteMetadataDryRunReadiness: metadataEvidence.readiness,
    selectedCandidate: selectedCandidate ? selectedCandidate.candidateId : null,
    ownerStudySourceOfTruth: 'merged_tool_study_0_stack_recorded_on_source_branch',
    approvedPlanSnapshotPolicy: 'approved_plan_snapshot_v1_required_before any future controlled dry-run',
    workerNoopEvidence: docsPresence.dependentReportScripts['activation:worker-runtime-noop-dry-run:report'],
    planSnapshotDryRunEvidence: docsPresence.dependentReportScripts['activation:model-orchestration-plan-snapshot-dry-run:report'],
    supabaseTrackBBackfillEvidence: docsPresence.dependentReportScripts['activation:supabase-trackb-clean-staging-backfill:report'],
    missingLocalEvidenceRecordedAsAuditFacts: docsPresence.missingEvidenceDirectories,
    secretRefs: secretRefs(),
    flags,
  }

  const decisionReport = {
    schema: 'reeditpro.controlledToolExecutionApproval.decision.v1',
    createdAt,
    decision,
    approvedForFutureFirstControlledToolExecutionDryRun: readiness,
    selectedFirstCandidate: selectedCandidate,
    blockers,
    realToolExecutionApproved: false,
    routeExecutionApproved: false,
    workerExecutionApproved: false,
    providerExecutionApproved: false,
    mediaProcessingApproved: false,
    supabaseWritesApproved: false,
    gcsUploadsApproved: false,
    publicArtifactsApproved: false,
    signedUrlsApproved: false,
    betaProductionUnlocked: false,
    supabaseClassification: supabaseClassification(),
  }

  const blockerReport = {
    schema: 'reeditpro.controlledToolExecutionApproval.blockerReport.v1',
    createdAt,
    decision,
    blockers,
    activeRuntimeBlockersPreserved: true,
    firstControlledToolExecutionStillFutureOnly: true,
    staleDuplicatePr: duplicateRisk,
  }

  const readinessReport = {
    schema: 'reeditpro.controlledToolExecutionApproval.readinessReport.v1',
    createdAt,
    readiness,
    decision,
    toolRouteApprovalPassed: routeApprovalEvidence.passed,
    toolRouteMetadataDryRunPassed: metadataEvidence.passed,
    firstCandidateReviewPassed: firstCandidateReview.passed === true,
    approvedPlanSnapshotRequirementsPassed: approvedPlanSnapshotRequirements.passed === true,
    workerHandoffRequirementsPassed: workerHandoffRequirements.passed === true,
    artifactGuardrailsPassed: artifactGuardrails.passed === true,
    failClosedPolicyPassed: failClosedPolicy.passed === true,
    observabilityCostAuditRequirementsPassed: observabilityCostAuditRequirements.passed === true,
    runtimeScopesBlocked: !executionRisk,
  }

  const privateArtifactManifest = {
    schema: 'reeditpro.controlledToolExecutionApproval.privateArtifactManifest.v1',
    createdAt,
    reportPaths: Object.values(reportPaths),
    docPaths,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    gcsUploads: false,
    privatePayloadsCommitted: false,
    buildOutputCommitted: false,
  }

  return {
    sourceOfTruthAudit,
    preApprovalRevalidation,
    evidenceInventory,
    firstCandidateReview,
    scopePolicy,
    approvedPlanSnapshotRequirements,
    workerHandoffRequirements,
    artifactGuardrails,
    failClosedPolicy,
    observabilityCostAuditRequirements,
    decision: decisionReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export function summarizeControlledToolExecutionApproval(reports = buildControlledToolExecutionApprovalReports()): string {
  const decision = String(reports.decision.decision)
  const blockers = (reports.blockerReport.blockers as string[]) ?? []
  return [
    'Controlled tool execution approval packet',
    `Decision: ${decision}`,
    `Readiness: ${reports.readinessReport.readiness === true ? 'ready for future first controlled tool execution dry-run' : 'blocked'}`,
    `Selected first candidate: ${String((reports.decision.selectedFirstCandidate as Record<string, unknown> | null)?.candidateId ?? 'none')}`,
    'Route/tool/worker/provider/media/Supabase/GCS/public/beta/production scopes: blocked',
    'Supabase update required: no write; environment touched: none; SQL executed: none; migration deployed: no',
    'Blockers:',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function writeControlledToolExecutionApprovalArtifacts() {
  const reports = buildControlledToolExecutionApprovalReports()
  mkdirSync(CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR, { recursive: true })
  for (const [key, filePath] of Object.entries(reportPaths)) {
    writeJson(filePath, reports[key as keyof ControlledToolApprovalReportSet])
  }
  writeDocs(reports)
  updateCrossChatDocs(reports)
  return reports
}

function readMetadataDryRunEvidence() {
  const decision = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_dry_run_decision.json`)
  const readiness = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_dry_run_readiness_report.json`)
  const fixtureValidation = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_fixture_validation_report.json`)
  const metadataResolution = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_resolution_report.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const passed =
    decision.decision === 'tool_route_metadata_dry_run_passed_ready_for_controlled_tool_execution_approval' &&
    decision.readiness === true &&
    readiness.readiness === true &&
    fixtureValidation.passed === true &&
    metadataResolution.passed === true &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: decision.readiness === true && readiness.readiness === true,
    blockers,
    fixtureValidation,
    metadataResolution,
    sourceReportsPresent: Boolean(decision.decision) && Boolean(metadataResolution.schema),
  }
}

function readToolRouteApprovalEvidence() {
  const decision = readJsonObject(`${TOOL_ROUTE_APPROVAL_REPORT_DIR}/tool_route_dry_run_approval_decision.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const passed = decision.decision === 'approved_for_future_tool_route_metadata_dry_run_execution' && blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    blockers,
    sourceReportsPresent: Boolean(decision.decision),
  }
}

function buildFirstCandidate(metadataEvidence: ReturnType<typeof readMetadataDryRunEvidence>, flags: ControlledToolBooleanFlags): ControlledToolCandidate | null {
  const resolution = metadataEvidence.metadataResolution as Record<string, unknown>
  const rows = Array.isArray(resolution.rows) ? (resolution.rows as Array<Record<string, unknown>>) : []
  const trackBRow = rows.find((row) => row.fixtureId === 'valid_track_b_metadata_route_candidate' && row.passed === true)
  if (!trackBRow) return null
  return {
    candidateId: 'controlled-tool:first_fixture_report_validation',
    candidateClass: 'fixture_report_validation_route',
    owner: 'CONTROLLED_TOOL_EXECUTION',
    sourceFixtureId: String(trackBRow.fixtureId),
    sourceRouteCandidateId: String(trackBRow.routeCandidateId),
    approvedPlanSnapshotRef: 'private://approved-plan-snapshot/first-controlled-tool-fixture-report-validation',
    privatePlaceholderRefs: [
      'private://manifest/first-controlled-tool-fixture-report-validation',
      'private://checksum/first-controlled-tool-fixture-report-validation',
    ],
    selectedForFirstControlledDryRun: true,
    reason:
      'This candidate validates already-committed route fixture/report metadata using an approved_plan_snapshot_v1 placeholder. It does not require media payloads, provider calls, worker dispatch, route execution, Supabase writes, GCS uploads, public artifacts, or signed URLs.',
    executionFlags: flags,
  }
}

function buildFirstCandidateReview(candidate: ControlledToolCandidate | null, metadataEvidence: ReturnType<typeof readMetadataDryRunEvidence>, flags: ControlledToolBooleanFlags) {
  const resolution = metadataEvidence.metadataResolution as Record<string, unknown>
  const rows = Array.isArray(resolution.rows) ? (resolution.rows as Array<Record<string, unknown>>) : []
  const alternatives = rows.map((row) => ({
    sourceFixtureId: row.fixtureId,
    sourceRouteCandidateId: row.routeCandidateId,
    owner: row.owner,
    disposition:
      row.fixtureId === 'valid_track_b_metadata_route_candidate'
        ? 'selected_as_fixture_report_validation_source'
        : 'deferred_because_owner_lane_needs_separate_controlled_execution_review',
    realExecutionApproved: false,
  }))
  return {
    schema: 'reeditpro.controlledToolExecutionApproval.firstCandidateReview.v1',
    passed: Boolean(candidate) && metadataEvidence.passed && !hasExecutionRisk(flags),
    selectedCandidate: candidate,
    candidateSelectionRule:
      'Pick the lowest-risk metadata/report validation route first; defer media/audio/render/image/browser/map and broad owner-lane execution to later approvals.',
    alternatives,
    explicitDeferrals: [
      'OpenCV/PyAV/PySceneDetect real processing',
      'DeepFilterNet/Signalsmith/Demucs audio execution',
      'image generation and image editing',
      'Track A render/export',
      'browser capture',
      'map rendering',
      'provider/model calls',
      'worker dispatch',
      'Supabase/GCS writers',
    ],
    flags,
  }
}

function buildScopePolicy(createdAt: string, flags: ControlledToolBooleanFlags) {
  return {
    schema: 'reeditpro.controlledToolExecutionApproval.scopePolicy.v1',
    createdAt,
    passed: !hasExecutionRisk(flags),
    allowedFutureDryRunScope: [
      'approved_plan_snapshot_v1 intake validation',
      'committed fixture/report existence checks',
      'route metadata compatibility checks',
      'artifact source-of-truth ref validation',
      'observability/cost/audit metadata shaping',
      'fail-closed simulation for unsafe requests',
    ],
    blockedUntilSeparateApproval: [
      'real tool execution',
      'real route execution',
      'worker execution',
      'provider/model calls',
      'media/audio/render/export/image/browser/map execution',
      'Supabase writes',
      'SQL',
      'GCS uploads',
      'public artifacts',
      'signed URLs',
      'dependency mutation',
      'raw prompt execution',
      'external beta',
      'paid production',
      'production',
    ],
    flags,
  }
}

function buildApprovedPlanSnapshotRequirements(createdAt: string, candidate: ControlledToolCandidate | null) {
  const hasSnapshot = typeof candidate?.approvedPlanSnapshotRef === 'string' && candidate.approvedPlanSnapshotRef.startsWith('private://approved-plan-snapshot/')
  return {
    schema: 'reeditpro.controlledToolExecutionApproval.approvedPlanSnapshotRequirements.v1',
    createdAt,
    passed: hasSnapshot,
    requiredInputKind: 'approved_plan_snapshot_v1',
    rejectedInputKinds: ['raw_prompt', 'provider_response', 'edit_intents_v1_only', 'plan_snapshot_candidate_v1', 'unapproved_manifest_ref'],
    immutableSnapshotRequired: true,
    creditApprovalRefRequiredForFutureRealExecution: true,
    currentCandidateSnapshotRef: candidate?.approvedPlanSnapshotRef ?? null,
    futureWorkerMayNotUseRawChat: true,
  }
}

function buildWorkerHandoffRequirements(createdAt: string, candidate: ControlledToolCandidate | null, flags: ControlledToolBooleanFlags) {
  return {
    schema: 'reeditpro.controlledToolExecutionApproval.workerHandoffRequirements.v1',
    createdAt,
    passed: Boolean(candidate) && !hasExecutionRisk(flags),
    workerExecutionApprovedThisPhase: false,
    futureHandoffRequires: [
      'approved_plan_snapshot_v1 ref',
      'idempotency key',
      'correlation id',
      'private artifact manifest refs',
      'checksum refs',
      'cost/audit metadata',
      'explicit no-op dry-run mode for the next phase',
    ],
    workerMustReject: ['raw prompts', 'provider responses', 'candidate snapshots', 'public artifacts', 'signed URLs as source of truth'],
    selectedCandidateId: candidate?.candidateId ?? null,
    flags,
  }
}

function buildArtifactGuardrails(createdAt: string, candidate: ControlledToolCandidate | null) {
  const refs = candidate?.privatePlaceholderRefs ?? []
  const refsPrivate = refs.length >= 2 && refs.every((ref) => ref.startsWith('private://'))
  const noSignedUrls = refs.every((ref) => !/https?:\/\/|X-Goog-Signature=|X-Amz-Signature=/i.test(ref))
  return {
    schema: 'reeditpro.controlledToolExecutionApproval.artifactGuardrails.v1',
    createdAt,
    passed: refsPrivate && noSignedUrls,
    requiredSourceOfTruthRefs: ['approved_plan_snapshot_v1', 'supabase_row_ref_future_only', 'private_gcs_path_ref', 'manifest_id', 'checksum'],
    candidateRefs: refs,
    refsPrivate,
    signedUrlsAsSourceOfTruthAllowed: false,
    publicArtifactsAllowed: false,
    gcsUploadsInThisPhase: false,
    arbitraryPathsAllowed: false,
    privatePayloadsCommitted: false,
  }
}

function buildFailClosedPolicy(createdAt: string) {
  return {
    schema: 'reeditpro.controlledToolExecutionApproval.failClosedPolicy.v1',
    createdAt,
    passed: true,
    failClosedOn: [
      'missing approved plan snapshot',
      'raw prompt input',
      'provider response input',
      'plan snapshot candidate input',
      'direct route execution request',
      'direct tool execution request',
      'worker execution request',
      'provider/model call request',
      'media/audio/render/export/image/browser/map request',
      'invalid artifact scope',
      'public artifact request',
      'signed URL source-of-truth request',
      'Supabase mutation',
      'SQL request',
      'GCS upload request',
      'dependency mutation request',
      'production or beta unlock request',
      'secret printing request',
    ],
    invalidFixtureClassesRequiredForNextPhase: [
      'raw_prompt',
      'provider_response',
      'candidate_snapshot',
      'public_artifact',
      'signed_url_source_of_truth',
      'real_tool_execution',
      'worker_execution',
      'production_mutation',
    ],
  }
}

function buildObservabilityCostAudit(createdAt: string, candidate: ControlledToolCandidate | null) {
  return {
    schema: 'reeditpro.controlledToolExecutionApproval.observabilityCostAuditRequirements.v1',
    createdAt,
    passed: Boolean(candidate),
    selectedCandidateId: candidate?.candidateId ?? null,
    requiredFutureFields: [
      'correlationId',
      'approvedPlanSnapshotRef',
      'idempotencyKey',
      'routeCandidateId',
      'owner',
      'artifactManifestRefs',
      'costEstimateClass',
      'timeoutClass',
      'retryPolicy',
      'failClosedOutcome',
    ],
    costEstimateClass: 'metadata_shape_only_no_charge',
    providerCostAllowed: false,
    workerRuntimeCostAllowed: false,
    retriesEnabledInApprovalPhase: false,
    secretLogsAllowed: false,
    rawPrivatePayloadLogsAllowed: false,
  }
}

function buildBlockers(input: {
  metadataDryRunPassed: boolean
  routeApprovalPassed: boolean
  firstCandidatePassed: boolean
  approvedPlanSnapshotPassed: boolean
  workerHandoffPassed: boolean
  artifactGuardrailsPassed: boolean
  failClosedPolicyPassed: boolean
  observabilityCostAuditPassed: boolean
  executionRisk: boolean
}) {
  const blockers: string[] = []
  if (input.executionRisk) blockers.push('runtime_safety_risk')
  if (!input.metadataDryRunPassed || !input.routeApprovalPassed || !input.firstCandidatePassed) blockers.push('first_candidate_review_incomplete')
  if (!input.approvedPlanSnapshotPassed) blockers.push('approved_plan_snapshot_requirements_incomplete')
  if (!input.workerHandoffPassed) blockers.push('worker_handoff_review_incomplete')
  if (!input.artifactGuardrailsPassed) blockers.push('artifact_scope_policy_incomplete')
  if (!input.failClosedPolicyPassed) blockers.push('fail_closed_policy_incomplete')
  if (!input.observabilityCostAuditPassed) blockers.push('observability_cost_audit_incomplete')
  return blockers
}

function chooseDecision(blockers: string[]): ControlledToolExecutionApprovalDecision {
  if (blockers.includes('runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('first_candidate_review_incomplete')) return 'blocked_pending_first_candidate_review'
  if (blockers.includes('approved_plan_snapshot_requirements_incomplete')) return 'blocked_pending_plan_snapshot_requirements'
  if (blockers.includes('worker_handoff_review_incomplete')) return 'blocked_pending_worker_handoff_review'
  if (blockers.includes('artifact_scope_policy_incomplete')) return 'blocked_pending_artifact_scope_policy'
  if (blockers.includes('fail_closed_policy_incomplete')) return 'blocked_pending_fail_closed_policy'
  if (blockers.includes('observability_cost_audit_incomplete')) return 'blocked_pending_observability_cost_audit'
  return 'approved_for_future_first_controlled_tool_execution_dry_run'
}

function buildPrEvidence(): Record<number, ControlledToolPrEvidence> {
  const output: Record<number, ControlledToolPrEvidence> = {}
  for (const number of [384, 387, 388]) {
    const raw = safeGh([
      'pr',
      'view',
      String(number),
      '--repo',
      'yuzastudio6-cyber/Reedkt',
      '--json',
      'number,title,state,mergedAt,isDraft,baseRefName,headRefName,headRefOid,mergeStateStatus,url',
    ])
    if (!raw) continue
    try {
      output[number] = JSON.parse(raw) as ControlledToolPrEvidence
    } catch {
      // Missing or invalid GitHub metadata is represented by absent evidence.
    }
  }
  return output
}

function buildDuplicateRiskEvidence(prEvidence: Record<number, ControlledToolPrEvidence>) {
  const pr384 = prEvidence[384]
  return {
    status: pr384?.isDraft ? 'stale_reference_only_duplicate_risk' : 'reference_only_duplicate_risk_metadata_unavailable_or_changed',
    treatedAsSourceOfTruth: false,
    reuseBlocked: true,
    evidence: pr384 ?? null,
  }
}

function buildDocsPresence() {
  const requiredSourceDocs = [
    'docs/tool-route-metadata-dry-run.md',
    'docs/tool-route-metadata-dry-run-decision.md',
    'docs/tool-route-metadata-dry-run-fail-closed.md',
    'docs/tool-route-metadata-dry-run-artifact-scope.md',
    'docs/tool-route-dry-run-approval.md',
    'docs/tool-route-dry-run-scope-policy.md',
    'docs/tool-route-artifact-source-of-truth-guardrails.md',
    'docs/tool-studies/tool-study-0-owner-study-matrix.json',
    'docs/tool-studies/tool-study-0-route-unlock-readiness.json',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
  ]
  const evidenceDirs = [
    'docs/activation-worker-runtime-noop-dry-run-reports',
    'docs/activation-model-orchestration-plan-snapshot-dry-run-reports',
    'docs/activation-supabase-trackb-clean-staging-backfill-reports',
  ]
  return {
    presentSourceDocs: requiredSourceDocs.filter((item) => existsSync(item)),
    missingSourceDocs: requiredSourceDocs.filter((item) => !existsSync(item)),
    missingEvidenceDirectories: evidenceDirs.filter((item) => !existsSync(item)),
    dependentReportScripts: {
      'activation:worker-runtime-noop-dry-run:report': packageScriptStatus('activation:worker-runtime-noop-dry-run:report'),
      'activation:model-orchestration-plan-snapshot-dry-run:report': packageScriptStatus('activation:model-orchestration-plan-snapshot-dry-run:report'),
      'activation:supabase-trackb-clean-staging-backfill:report': packageScriptStatus('activation:supabase-trackb-clean-staging-backfill:report'),
    },
    missingOptionalReadinessDocs: ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md', 'PRODUCTION_FOUNDATION_STATUS.md'].filter((item) => !existsSync(item)),
  }
}

function packageScriptStatus(scriptName: string) {
  const scripts = readPackageScripts()
  return scripts[scriptName] ? 'available_not_executed_by_approval_packet' : 'missing_script_recorded_as_audit_fact'
}

function packageLockChanged() {
  const output = safeGit(['status', '--short', '--', 'package-lock.json'])
  return Boolean(output)
}

function secretRefs() {
  return [
    { refName: 'SUPABASE_ACCESS_TOKEN', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
    { refName: 'SUPABASE_DB_URL', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
    { refName: 'GCS_PRIVATE_BUCKET_REF', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
  ]
}

function blockedFlags(): ControlledToolBooleanFlags {
  return {
    routeExecutionAllowed: false,
    runtimeExecutionAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    providerExecutionAllowed: false,
    mediaProcessingAllowed: false,
    audioProcessingAllowed: false,
    renderExecutionAllowed: false,
    exportExecutionAllowed: false,
    imageGenerationAllowed: false,
    imageEditingAllowed: false,
    browserCaptureAllowed: false,
    mapRenderingAllowed: false,
    supabaseWritesAllowed: false,
    sqlAllowed: false,
    gcsUploadAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAsSourceOfTruthAllowed: false,
    dependencyMutationAllowed: false,
    rawPromptExecutionAllowed: false,
    externalBetaUnlockAllowed: false,
    paidProductionUnlockAllowed: false,
    productionUnlockAllowed: false,
    githubPrMergeAllowed: false,
    secretPayloadAccessed: false,
    secretPayloadPrinted: false,
    secretPayloadCommitted: false,
  }
}

function hasExecutionRisk(flags: ControlledToolBooleanFlags) {
  return Object.values(flags).some((value) => value !== false)
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    updateStatus: 'Track B clean staging milestone sync completed before this phase; this packet is metadata/reporting only.',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    nextSupabaseAction: 'none',
  }
}

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_CONTROLLED_TOOL_EXECUTION_APPROVAL_PACKET',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_METADATA_DRY_RUN_PASSED',
    'REEDITPRO_CONFIRM_FIRST_CONTROLLED_TOOL_CANDIDATE_REVIEW',
    'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_REQUIREMENT',
    'REEDITPRO_CONFIRM_ARTIFACT_SCOPE_POLICY_AUDIT',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'REAL_ROUTE_EXECUTION',
    'ROUTE_EXECUTION',
    'REAL_TOOL_EXECUTION',
    'TOOL_EXECUTION',
    'TOOL_EXECUTION_DRY_RUN',
    'WORKER_EXECUTION',
    'WORKER_RUNTIME',
    'PROVIDER_CALLS',
    'PROVIDER_EXECUTION',
    'MEDIA_PROCESSING',
    'AUDIO_PROCESSING',
    'RENDER_EXPORT',
    'IMAGE_GENERATION',
    'IMAGE_EDITING',
    'BROWSER_CAPTURE',
    'MAP_RENDERING',
    'SUPABASE_METADATA_WRITE',
    'SUPABASE_PRODUCTION_SQL',
    'GCS_UPLOAD',
    'PUBLIC_ARTIFACTS',
    'SIGNED_URL_DELIVERY',
    'PRODUCTION_WRITE',
    'EXTERNAL_BETA_UNLOCK',
    'PAID_PRODUCTION_UNLOCK',
    'DEPENDENCY_MUTATION',
    'RAW_PROMPT_EXECUTION',
    'GITHUB_PR_MERGE',
    'SECRET_PAYLOAD_PRINT',
  ]
}

function writeDocs(reports: ControlledToolApprovalReportSet) {
  const decision = String(reports.decision.decision)
  const selectedCandidate = reports.decision.selectedFirstCandidate as ControlledToolCandidate | null
  const docs: Array<[string, string]> = [
    [
      'docs/controlled-tool-execution-approval.md',
      `# Controlled Tool Execution Approval\n\nDecision: \`${decision}\`\n\nThis packet approves only a future first controlled tool execution dry-run. It does not execute tools, routes, workers, providers, media/audio/render/export/image/browser/map paths, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, dependency changes, beta, or production.\n\nSelected first candidate: \`${selectedCandidate?.candidateId ?? 'none'}\`.\n`,
    ],
    [
      'docs/controlled-tool-execution-first-candidate-review.md',
      `# Controlled Tool Execution First Candidate Review\n\nSelected candidate: \`${selectedCandidate?.candidateId ?? 'none'}\`.\n\nThe selected candidate is a synthetic fixture/report-validation route using an \`approved_plan_snapshot_v1\` placeholder and private metadata refs. It is lower risk than media, audio, render/export, image, browser, map, provider, worker, Supabase, or GCS lanes because it validates committed reports and route metadata only.\n`,
    ],
    [
      'docs/controlled-tool-execution-scope-policy.md',
      '# Controlled Tool Execution Scope Policy\n\nAllowed future dry-run scope is limited to approved snapshot intake validation, committed fixture/report checks, route metadata compatibility checks, artifact source-of-truth validation, observability/cost/audit metadata shaping, and fail-closed simulation.\n\nBlocked: real tool execution, real route execution, worker execution, provider/model calls, media/audio/render/export/image/browser/map execution, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, dependency mutation, raw prompt execution, external beta, paid production, and production.\n',
    ],
    [
      'docs/controlled-tool-execution-approved-plan-snapshot-requirements.md',
      '# Controlled Tool Execution Approved Plan Snapshot Requirements\n\nFuture controlled tool dry-runs must accept only `approved_plan_snapshot_v1` input. Raw prompts, provider responses, edit intents alone, plan snapshot candidates, and unapproved manifest refs fail closed. Any later real execution still needs separate worker/runtime approvals and credit/audit metadata.\n',
    ],
    [
      'docs/controlled-tool-execution-worker-handoff-requirements.md',
      '# Controlled Tool Execution Worker Handoff Requirements\n\nThis phase does not approve worker execution. A later handoff must include an approved snapshot ref, idempotency key, correlation id, private artifact refs, checksums, cost/audit metadata, and explicit dry-run mode. Workers must reject raw prompts, provider responses, candidate snapshots, public artifacts, and signed URLs as source of truth.\n',
    ],
    [
      'docs/controlled-tool-execution-artifact-guardrails.md',
      '# Controlled Tool Execution Artifact Guardrails\n\nSource of truth requires approved snapshot refs, future Supabase row refs, private GCS path refs, manifest ids, and checksums. Signed URLs are never source of truth. Public artifacts, arbitrary paths, unapproved uploads, private payload commits, and output delivery are blocked in this phase.\n',
    ],
    [
      'docs/controlled-tool-execution-fail-closed-policy.md',
      '# Controlled Tool Execution Fail-Closed Policy\n\nFail closed on missing approved snapshots, raw prompts, provider responses, candidate snapshots, direct route/tool/worker execution requests, provider calls, media/audio/render/export/image/browser/map requests, invalid artifact scope, public artifacts, signed URLs as source of truth, Supabase/SQL/GCS mutation, dependency mutation, beta/production unlocks, and secret printing.\n',
    ],
    [
      'docs/controlled-tool-execution-observability-cost-audit.md',
      '# Controlled Tool Execution Observability Cost Audit\n\nFuture dry-run evidence must include correlation id, approved snapshot ref, idempotency key, route candidate id, owner, private artifact manifest refs, cost estimate class, timeout class, retry policy, and fail-closed outcome. Provider cost, worker runtime cost, retries, secret logs, and raw private payload logs are not allowed in this approval phase.\n',
    ],
    [
      'docs/controlled-tool-execution-approval-decision.md',
      `# Controlled Tool Execution Approval Decision\n\nDecision: \`${decision}\`\n\nReadiness: \`${reports.readinessReport.readiness === true}\`\n\nSelected first candidate: \`${selectedCandidate?.candidateId ?? 'none'}\`.\n\nSupabase update required: \`no write\`; environment touched: \`none\`; SQL executed: \`none\`; migration deployed: \`no\`.\n`,
    ],
    [
      'docs/implementation-prompts/prompt-first-controlled-tool-execution-dry-run.md',
      '# CONTROLLED_TOOL_EXECUTION - First Controlled Tool Execution Dry-Run\n\nRun a separate future dry-run for the selected fixture/report-validation candidate only. Use `approved_plan_snapshot_v1` input and private metadata refs. Keep real tool execution, route execution, worker execution, provider calls, media/audio/render/export/image/browser/map execution, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, dependency mutation, beta, and production blocked unless a later prompt explicitly authorizes a narrower scope.\n',
    ],
  ]
  for (const [filePath, value] of docs) writeText(filePath, value)
}

function updateCrossChatDocs(reports: ControlledToolApprovalReportSet) {
  const decision = String(reports.decision.decision)
  const marker = '<!-- CONTROLLED_TOOL_EXECUTION_APPROVAL_STATUS -->'
  const blocks: Array<[string, string]> = [
    [
      'docs/cross-chat/CURRENT_HANDOFF.md',
      `${marker}\n\nCONTROLLED_TOOL_EXECUTION approval packet:\n\n- Decision: \`${decision}\`\n- Selected first candidate: \`controlled-tool:first_fixture_report_validation\`.\n- PR #387/#388 tool-route source-of-truth evidence is merged and consumed.\n- This is approval-only; real tool/route/worker/provider/media/Supabase/GCS/public/beta/production scopes remain blocked.\n- Next prompt: \`CONTROLLED_TOOL_EXECUTION - first controlled tool execution dry-run\`.\n`,
    ],
    [
      'docs/cross-chat/NEXT_UNLOCK_LANES.md',
      `${marker}\n\nNext unlock lane:\n\n- \`CONTROLLED_TOOL_EXECUTION - first controlled tool execution dry-run\` may use only the selected fixture/report-validation candidate after separate approval.\n- Media/audio/render/image/browser/map, workers, providers, Supabase/GCS writes, public artifacts, signed URLs, beta, and production remain blocked.\n`,
    ],
    [
      'docs/cross-chat/BLOCKED_SCOPES.md',
      `${marker}\n\nControlled tool execution approval does not unblock real execution. Tool execution, route execution, worker execution, provider calls, media/audio/render/export/image/browser/map processing, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompt execution, dependency mutation, external beta, paid production, and production remain blocked.\n`,
    ],
  ]
  for (const [filePath, block] of blocks) {
    if (!existsSync(filePath)) continue
    const current = readFileSync(filePath, 'utf8')
    const next = current.includes(marker) ? current.replace(new RegExp(`${marker}[\\s\\S]*$`), block) : `${current.trimEnd()}\n\n${block}`
    writeText(filePath, next)
  }
}

function readJsonObject(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {}
  try {
    const value = JSON.parse(readFileSync(filePath, 'utf8'))
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function readPackageScripts(): Record<string, string> {
  const pkg = readJsonObject('package.json')
  return pkg.scripts && typeof pkg.scripts === 'object' && !Array.isArray(pkg.scripts) ? (pkg.scripts as Record<string, string>) : {}
}

function safeGh(args: string[]) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function safeGit(args: string[]) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }, stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function writeJson(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeText(filePath: string, value: string) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`, 'utf8')
}
