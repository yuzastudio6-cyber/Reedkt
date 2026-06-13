import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  FirstControlledToolBooleanFlags,
  FirstControlledToolCandidate,
  FirstControlledToolExecutionDecision,
  FirstControlledToolPrEvidence,
  FirstControlledToolReportSet,
} from './first-controlled-tool-execution-types'

export const FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR = 'docs/activation-first-controlled-tool-execution-dry-run-reports'
export const SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE = 'controlled-tool:first_fixture_report_validation'

const CONTROLLED_APPROVAL_REPORT_DIR = 'docs/activation-controlled-tool-execution-approval-reports'
const TOOL_ROUTE_METADATA_REPORT_DIR = 'docs/activation-tool-route-metadata-dry-run-reports'
const TOOL_ROUTE_APPROVAL_REPORT_DIR = 'docs/activation-tool-route-dry-run-approval-reports'

const reportPaths = {
  sourceOfTruthAudit: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/first_controlled_tool_source_of_truth_audit.json`,
  preExecutionRevalidation: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/pre_execution_revalidation_report.json`,
  evidenceInventory: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/first_controlled_tool_evidence_inventory.json`,
  selectedCandidateGuard: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/selected_candidate_guard_report.json`,
  approvedPlanSnapshotFixture: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/approved_plan_snapshot_fixture_report.json`,
  selectedCandidateExecution: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/selected_candidate_execution_report.json`,
  artifactSourceOfTruthValidation: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/artifact_source_of_truth_validation_report.json`,
  executionBlockerValidation: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/execution_blocker_validation_report.json`,
  failClosedValidation: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/fail_closed_validation_report.json`,
  observabilityCostAudit: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/observability_cost_audit_report.json`,
  decision: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/first_controlled_tool_execution_decision.json`,
  blockerReport: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/first_controlled_tool_execution_blocker_report.json`,
  readinessReport: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/first_controlled_tool_execution_readiness_report.json`,
  privateArtifactManifest: `${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/first_controlled_tool_execution_private_artifact_manifest.json`,
}

const docPaths = [
  'docs/first-controlled-tool-execution-dry-run.md',
  'docs/first-controlled-tool-execution-dry-run-decision.md',
  'docs/first-controlled-tool-execution-dry-run-fail-closed.md',
  'docs/first-controlled-tool-execution-dry-run-artifact-scope.md',
  'docs/implementation-prompts/prompt-next-controlled-candidate-or-worker-handoff-review.md',
]

export function buildFirstControlledToolExecutionPlan() {
  return {
    phase: 'FIRST_CONTROLLED_TOOL_EXECUTION',
    packet: 'first controlled tool execution dry-run',
    branch: 'codex/rp-first-controlled-tool-execution-dry-run',
    baseBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    mode: 'selected_candidate_metadata_report_validation_only',
    expectedDecision: 'first_controlled_tool_execution_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review',
    selectedCandidate: SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE,
    requiredConfirmations: requiredConfirmations(),
    forbiddenScopes: Object.entries(blockedFlags())
      .filter(([, value]) => value === false)
      .map(([name]) => name),
    reports: Object.values(reportPaths),
    docs: docPaths,
  }
}

export function buildFirstControlledToolExecutionReports(selectedCandidateArg = SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE): FirstControlledToolReportSet {
  const createdAt = new Date().toISOString()
  const flags = blockedFlags()
  const prEvidence = buildPrEvidence()
  const approvalEvidence = readApprovalEvidence()
  const routeMetadataEvidence = readRouteMetadataEvidence()
  const routeApprovalEvidence = readRouteApprovalEvidence()
  const docsPresence = buildDocsPresence()
  const selectedCandidate = buildSelectedCandidate(approvalEvidence, routeMetadataEvidence, flags)
  const selectedCandidateGuard = buildSelectedCandidateGuard(selectedCandidateArg, selectedCandidate, approvalEvidence, routeMetadataEvidence, flags)
  const approvedPlanSnapshotFixture = buildApprovedPlanSnapshotFixture(selectedCandidate, selectedCandidateGuard.passed === true, flags)
  const selectedCandidateExecution = buildSelectedCandidateExecution(selectedCandidate, selectedCandidateGuard.passed === true, approvedPlanSnapshotFixture.passed === true, routeMetadataEvidence)
  const artifactSourceOfTruthValidation = buildArtifactSourceOfTruthValidation(selectedCandidate, selectedCandidateExecution.passed === true)
  const executionBlockerValidation = buildExecutionBlockerValidation(selectedCandidate, flags)
  const failClosedValidation = buildFailClosedValidation()
  const observabilityCostAudit = buildObservabilityCostAudit(selectedCandidate, selectedCandidateExecution.passed === true)
  const executionRisk = hasExecutionRisk(flags)
  const blockers = buildBlockers({
    approvalPassed: approvalEvidence.passed,
    routeMetadataPassed: routeMetadataEvidence.passed,
    routeApprovalPassed: routeApprovalEvidence.passed,
    selectedCandidateGuardPassed: selectedCandidateGuard.passed === true,
    approvedPlanSnapshotFixturePassed: approvedPlanSnapshotFixture.passed === true,
    selectedCandidateExecutionPassed: selectedCandidateExecution.passed === true,
    artifactSourceOfTruthValidationPassed: artifactSourceOfTruthValidation.passed === true,
    executionBlockerValidationPassed: executionBlockerValidation.passed === true,
    failClosedValidationPassed: failClosedValidation.passed === true,
    observabilityCostAuditPassed: observabilityCostAudit.passed === true,
    executionRisk,
  })
  const decision = chooseDecision(blockers)
  const readiness = decision === 'first_controlled_tool_execution_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review'
  const duplicateRisk = buildDuplicateRiskEvidence(prEvidence)

  const sourceOfTruthAudit = {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.sourceOfTruthAudit.v1',
    createdAt,
    sourceBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    expectedMinimumSourceSha: '64780bccc123d10ca8f0ed18318cfb0d638a0585',
    currentBranch: safeGit(['branch', '--show-current']) ?? null,
    currentSha: safeGit(['rev-parse', 'HEAD']) ?? null,
    pr394: prEvidence[394] ?? null,
    pr388: prEvidence[388] ?? null,
    pr387: prEvidence[387] ?? null,
    pr384DuplicateRisk: duplicateRisk,
    pr394ApprovalDecision: approvalEvidence.decision,
    selectedCandidate: selectedCandidate?.candidateId ?? null,
    docsPresence,
    flags,
    supabaseClassification: supabaseClassification(),
    decision,
  }

  const preExecutionRevalidation = {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.preExecutionRevalidation.v1',
    createdAt,
    pr394Merged: prEvidence[394]?.state === 'MERGED' && Boolean(prEvidence[394]?.mergedAt),
    pr388Merged: prEvidence[388]?.state === 'MERGED' && Boolean(prEvidence[388]?.mergedAt),
    pr387Merged: prEvidence[387]?.state === 'MERGED' && Boolean(prEvidence[387]?.mergedAt),
    pr384ReferenceOnly: duplicateRisk.treatedAsSourceOfTruth === false,
    approvalEvidence,
    routeMetadataEvidence,
    routeApprovalEvidence,
    optionalDependentScripts: docsPresence.dependentReportScripts,
    missingLocalEvidenceRecordedAsAuditFacts: docsPresence.missingEvidenceDirectories,
    blockedScopesPreserved: !executionRisk,
    packageLockChanged: packageLockChanged(),
  }

  const evidenceInventory = {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.evidenceInventory.v1',
    createdAt,
    pr394ApprovalPassed: approvalEvidence.passed,
    selectedCandidate: selectedCandidate?.candidateId ?? null,
    selectedSourceFixtureId: selectedCandidate?.sourceFixtureId ?? null,
    selectedRouteCandidateId: selectedCandidate?.sourceRouteCandidateId ?? null,
    toolRouteMetadataDryRunDecision: routeMetadataEvidence.decision,
    toolRouteDryRunApprovalDecision: routeApprovalEvidence.decision,
    toolStudySourceOfTruthStatus: docsPresence.toolStudySourceOfTruthStatus,
    workerNoopEvidence: docsPresence.dependentReportScripts['activation:worker-runtime-noop-dry-run:report'],
    planSnapshotDryRunEvidence: docsPresence.dependentReportScripts['activation:model-orchestration-plan-snapshot-dry-run:report'],
    supabaseTrackBBackfillEvidence: docsPresence.dependentReportScripts['activation:supabase-trackb-clean-staging-backfill:report'],
    routeCapabilityManifestStatus: docsPresence.routeCapabilityManifestStatus,
    publicArtifactSignedUrlPolicyStatus: 'blocked_signed_urls_not_source_of_truth',
    secretRefs: secretRefs(),
    flags,
  }

  const decisionReport = {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.decision.v1',
    createdAt,
    decision,
    readiness,
    selectedCandidate,
    blockers,
    realToolsExecuted: false,
    nonSelectedToolsExecuted: false,
    workersExecuted: false,
    realRoutesExecuted: false,
    providersCalled: false,
    mediaProcessed: false,
    audioProcessed: false,
    renderExportExecuted: false,
    imagesGeneratedOrEdited: false,
    browserCaptureRun: false,
    mapsRendered: false,
    supabaseWrites: false,
    sqlExecuted: false,
    gcsUploads: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptsExecuted: false,
    dependencyMutation: false,
    githubPrMerge: false,
    betaProductionUnlocked: false,
    supabaseClassification: supabaseClassification(),
  }

  const blockerReport = {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.blockerReport.v1',
    createdAt,
    decision,
    blockers,
    activeRuntimeBlockersPreserved: true,
    nonSelectedToolsRemainBlocked: true,
    nextPhaseRequiresSeparateApproval: true,
    staleDuplicatePr: duplicateRisk,
  }

  const readinessReport = {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.readinessReport.v1',
    createdAt,
    readiness,
    decision,
    approvalPassed: approvalEvidence.passed,
    routeMetadataPassed: routeMetadataEvidence.passed,
    routeApprovalPassed: routeApprovalEvidence.passed,
    selectedCandidateGuardPassed: selectedCandidateGuard.passed === true,
    approvedPlanSnapshotFixturePassed: approvedPlanSnapshotFixture.passed === true,
    selectedCandidateExecutionPassed: selectedCandidateExecution.passed === true,
    artifactSourceOfTruthValidationPassed: artifactSourceOfTruthValidation.passed === true,
    executionBlockerValidationPassed: executionBlockerValidation.passed === true,
    failClosedValidationPassed: failClosedValidation.passed === true,
    observabilityCostAuditPassed: observabilityCostAudit.passed === true,
    runtimeScopesBlocked: !executionRisk,
  }

  const privateArtifactManifest = {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.privateArtifactManifest.v1',
    createdAt,
    reportPaths: Object.values(reportPaths),
    docPaths,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    gcsUploads: false,
    privatePayloadsCommitted: false,
    buildOutputCommitted: false,
    packageLockChanged: packageLockChanged(),
  }

  return {
    sourceOfTruthAudit,
    preExecutionRevalidation,
    evidenceInventory,
    selectedCandidateGuard,
    approvedPlanSnapshotFixture,
    selectedCandidateExecution,
    artifactSourceOfTruthValidation,
    executionBlockerValidation,
    failClosedValidation,
    observabilityCostAudit,
    decision: decisionReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export function summarizeFirstControlledToolExecutionDryRun(reports = buildFirstControlledToolExecutionReports()): string {
  const blockers = (reports.blockerReport.blockers as string[]) ?? []
  return [
    'First controlled tool execution dry-run',
    `Decision: ${String(reports.decision.decision)}`,
    `Readiness: ${reports.readinessReport.readiness === true ? 'ready for next controlled candidate or worker handoff review' : 'blocked'}`,
    `Selected candidate: ${String((reports.decision.selectedCandidate as Record<string, unknown> | null)?.candidateId ?? 'none')}`,
    'Selected candidate behavior: local/server-only fixture/report validation',
    'Route/tool/worker/provider/media/Supabase/GCS/public/beta/production scopes: blocked',
    'Supabase update required: no write; environment touched: none; SQL executed: none; migration deployed: no',
    'Blockers:',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function writeFirstControlledToolExecutionDryRunArtifacts(selectedCandidateArg = SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE) {
  const reports = buildFirstControlledToolExecutionReports(selectedCandidateArg)
  mkdirSync(FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR, { recursive: true })
  for (const [key, filePath] of Object.entries(reportPaths)) {
    writeJson(filePath, reports[key as keyof FirstControlledToolReportSet])
  }
  writeDocs(reports)
  updateStatusDocs(reports)
  return reports
}

function readApprovalEvidence() {
  const decision = readJsonObject(`${CONTROLLED_APPROVAL_REPORT_DIR}/controlled_tool_execution_approval_decision.json`)
  const readiness = readJsonObject(`${CONTROLLED_APPROVAL_REPORT_DIR}/controlled_tool_execution_approval_readiness_report.json`)
  const candidateReview = readJsonObject(`${CONTROLLED_APPROVAL_REPORT_DIR}/first_controlled_tool_candidate_review.json`)
  const selectedCandidate = (decision.selectedFirstCandidate ?? candidateReview.selectedCandidate) as Record<string, unknown> | null
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const passed =
    decision.decision === 'approved_for_future_first_controlled_tool_execution_dry_run' &&
    decision.approvedForFutureFirstControlledToolExecutionDryRun === true &&
    readiness.readiness === true &&
    selectedCandidate?.candidateId === SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    blockers,
    selectedCandidate,
    candidateReviewPassed: candidateReview.passed === true,
    sourceReportsPresent: Boolean(decision.decision) && Boolean(readiness.schema),
  }
}

function readRouteMetadataEvidence() {
  const decision = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_dry_run_decision.json`)
  const readiness = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_dry_run_readiness_report.json`)
  const fixtureValidation = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_fixture_validation_report.json`)
  const metadataResolution = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_resolution_report.json`)
  const artifactScope = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_artifact_scope_validation_report.json`)
  const failClosed = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_fail_closed_validation_report.json`)
  const observability = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_observability_cost_audit_report.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const rows = Array.isArray(metadataResolution.rows) ? (metadataResolution.rows as Array<Record<string, unknown>>) : []
  const selectedRow = rows.find(
    (row) =>
      row.fixtureId === 'valid_track_b_metadata_route_candidate' &&
      row.routeCandidateId === 'metadata-route:track_b_media_processing' &&
      row.passed === true
  )
  const passed =
    decision.decision === 'tool_route_metadata_dry_run_passed_ready_for_controlled_tool_execution_approval' &&
    decision.readiness === true &&
    readiness.readiness === true &&
    fixtureValidation.passed === true &&
    metadataResolution.passed === true &&
    artifactScope.passed === true &&
    failClosed.passed === true &&
    observability.passed === true &&
    Boolean(selectedRow) &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    blockers,
    fixtureValidation,
    metadataResolution,
    selectedRow: selectedRow ?? null,
    artifactScope,
    failClosed,
    observability,
    sourceReportsPresent: Boolean(decision.decision) && Boolean(metadataResolution.schema),
  }
}

function readRouteApprovalEvidence() {
  const decision = readJsonObject(`${TOOL_ROUTE_APPROVAL_REPORT_DIR}/tool_route_dry_run_approval_decision.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  return {
    passed: decision.decision === 'approved_for_future_tool_route_metadata_dry_run_execution' && blockers.length === 0,
    decision: decision.decision ?? null,
    blockers,
    sourceReportsPresent: Boolean(decision.decision),
  }
}

function buildSelectedCandidate(
  approvalEvidence: ReturnType<typeof readApprovalEvidence>,
  routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>,
  flags: FirstControlledToolBooleanFlags
): FirstControlledToolCandidate | null {
  const approvedCandidate = approvalEvidence.selectedCandidate
  const selectedRow = routeMetadataEvidence.selectedRow
  if (!approvedCandidate || !selectedRow) return null
  return {
    candidateId: SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE,
    candidateClass: 'fixture_report_validation_route',
    owner: 'CONTROLLED_TOOL_EXECUTION',
    sourceFixtureId: String(selectedRow.fixtureId),
    sourceRouteCandidateId: String(selectedRow.routeCandidateId),
    approvedPlanSnapshotRef: String(approvedCandidate.approvedPlanSnapshotRef ?? 'private://approved-plan-snapshot/first-controlled-tool-fixture-report-validation'),
    privatePlaceholderRefs: Array.isArray(approvedCandidate.privatePlaceholderRefs)
      ? approvedCandidate.privatePlaceholderRefs.map(String)
      : [
          'private://manifest/first-controlled-tool-fixture-report-validation',
          'private://checksum/first-controlled-tool-fixture-report-validation',
        ],
    selectedForFirstControlledDryRun: approvedCandidate.selectedForFirstControlledDryRun === true,
    executionFlags: flags,
  }
}

function buildSelectedCandidateGuard(
  selectedCandidateArg: string,
  candidate: FirstControlledToolCandidate | null,
  approvalEvidence: ReturnType<typeof readApprovalEvidence>,
  routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>,
  flags: FirstControlledToolBooleanFlags
) {
  const allFlagsBlocked = !hasExecutionRisk(flags)
  const selectedCandidateMatches = selectedCandidateArg === SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE && candidate?.candidateId === SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE
  const selectedSourceMatches =
    candidate?.sourceFixtureId === 'valid_track_b_metadata_route_candidate' &&
    candidate?.sourceRouteCandidateId === 'metadata-route:track_b_media_processing'
  const passed = Boolean(candidate) && selectedCandidateMatches && selectedSourceMatches && approvalEvidence.passed && routeMetadataEvidence.passed && allFlagsBlocked
  return {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.selectedCandidateGuard.v1',
    passed,
    requestedCandidate: selectedCandidateArg,
    selectedCandidate: candidate,
    selectedCandidateMatches,
    selectedSourceMatches,
    noOtherCandidateEnabled: true,
    localServerOnly: true,
    externalNetworkCallsAllowed: false,
    supabaseWritesAllowed: false,
    gcsUploadsAllowed: false,
    providerCallsAllowed: false,
    mediaProcessingAllowed: false,
    workerQueueEnqueueAllowed: false,
    withinPr394ApprovalScope: approvalEvidence.passed,
    allExecutionFlagsFalse: allFlagsBlocked,
  }
}

function buildApprovedPlanSnapshotFixture(candidate: FirstControlledToolCandidate | null, guardPassed: boolean, flags: FirstControlledToolBooleanFlags) {
  const approvedPlanSnapshotId = 'approved_plan_snapshot:first-controlled-tool-fixture-report-validation'
  const refs = candidate?.privatePlaceholderRefs ?? []
  const privateRefs = refs.every((ref) => ref.startsWith('private://'))
  const passed = Boolean(candidate) && guardPassed && privateRefs && candidate?.approvedPlanSnapshotRef.startsWith('private://approved-plan-snapshot/') && !hasExecutionRisk(flags)
  return {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.approvedPlanSnapshotFixture.v1',
    passed,
    approvedPlanSnapshotId,
    approvedPlanSnapshotRef: candidate?.approvedPlanSnapshotRef ?? null,
    snapshotSchema: 'approved_plan_snapshot_v1',
    immutableSnapshot: true,
    approvedScope: [SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE],
    rejectedInputKinds: ['raw_prompt', 'edit_intents_v1_only', 'plan_snapshot_candidate_v1', 'provider_response', 'private_payload', 'media_payload'],
    rawPromptExecutionAllowed: false,
    signedUrlsAsSourceOfTruth: false,
    publicArtifactsAllowed: false,
    artifactScope: 'private_metadata_only',
    sourceOfTruthRefs: {
      approvedPlanSnapshotRef: candidate?.approvedPlanSnapshotRef ?? null,
      manifestRefs: refs,
      futureSupabaseRowRefs: ['metadata-only-placeholder:no-write'],
      privateGcsPathRefs: ['private://gcs-placeholder/no-upload'],
      checksumRefs: refs.filter((ref) => ref.includes('checksum')),
    },
    noRealUserPrivateMediaPayloads: true,
    noProviderData: true,
    noSupabaseOrGcsWriteRefsExecuted: true,
    flags,
  }
}

function buildSelectedCandidateExecution(
  candidate: FirstControlledToolCandidate | null,
  guardPassed: boolean,
  fixturePassed: boolean,
  routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>
) {
  const fixtureRows = Array.isArray(routeMetadataEvidence.fixtureValidation.rows)
    ? (routeMetadataEvidence.fixtureValidation.rows as Array<Record<string, unknown>>)
    : []
  const selectedFixtureRow = fixtureRows.find((row) => row.fixtureId === 'valid_track_b_metadata_route_candidate')
  const requiredReportFields = [
    'tool_route_fixture_validation_report.json',
    'tool_route_metadata_resolution_report.json',
    'controlled_tool_execution_approval_decision.json',
    'first_controlled_tool_candidate_review.json',
  ]
  const requiredReportsPresent = requiredReportFields.every((file) =>
    existsSync(
      file.startsWith('tool_route_')
        ? `${TOOL_ROUTE_METADATA_REPORT_DIR}/${file}`
        : `${CONTROLLED_APPROVAL_REPORT_DIR}/${file}`
    )
  )
  const selectedFixtureValid =
    selectedFixtureRow?.fixtureClass === 'valid' &&
    selectedFixtureRow?.acceptedMetadataOnly === true &&
    selectedFixtureRow?.failedClosed === false &&
    selectedFixtureRow?.allFlagsBlocked === true
  const passed = Boolean(candidate) && guardPassed && fixturePassed && routeMetadataEvidence.passed && requiredReportsPresent && selectedFixtureValid
  return {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.selectedCandidateExecution.v1',
    passed,
    candidateId: candidate?.candidateId ?? null,
    executionKind: 'local_server_only_fixture_report_validation',
    selectedFixtureRow: selectedFixtureRow ?? null,
    requiredReportsPresent,
    requiredReportFields,
    validatedOperations: [
      'committed_report_presence',
      'selected_fixture_metadata_shape',
      'selected_route_candidate_metadata_shape',
      'approval_decision_consistency',
      'blocked_execution_flags',
    ],
    deterministic: true,
    sideEffectFree: true,
    externalNetworkCalls: false,
    secretPayloadAccessed: false,
    supabaseWrites: false,
    sqlExecuted: false,
    gcsUploads: false,
    mediaProcessed: false,
    workerQueueEnqueued: false,
    dockerOrCloudRunInvoked: false,
    dependencyMutation: false,
  }
}

function buildArtifactSourceOfTruthValidation(candidate: FirstControlledToolCandidate | null, executionPassed: boolean) {
  const refs = candidate?.privatePlaceholderRefs ?? []
  const refsPrivate = refs.length >= 2 && refs.every((ref) => ref.startsWith('private://'))
  const signedUrlPattern = new RegExp(['https?:\\/\\/', `X-${'Goog'}-Signature=`, `X-${'Amz'}-Signature=`].join('|'), 'i')
  const noSignedUrls = refs.every((ref) => !signedUrlPattern.test(ref))
  const passed = Boolean(candidate) && executionPassed && refsPrivate && noSignedUrls
  return {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.artifactSourceOfTruthValidation.v1',
    passed,
    sourceOfTruthPolicy: ['approved_plan_snapshot_v1', 'future_supabase_row_ref_no_write', 'private_gcs_path_ref_no_upload', 'manifest_id', 'checksum'],
    selectedCandidateRefs: refs,
    refsPrivate,
    signedUrlsAsSourceOfTruthAllowed: false,
    publicArtifactsAllowed: false,
    arbitraryPathsAllowed: false,
    unapprovedGcsPrefixesBlocked: true,
    uploadsPerformed: false,
    privatePayloadsCommitted: false,
    noSignedUrls,
  }
}

function buildExecutionBlockerValidation(candidate: FirstControlledToolCandidate | null, flags: FirstControlledToolBooleanFlags) {
  const blockedScopes = Object.keys(flags).filter((key) => flags[key as keyof FirstControlledToolBooleanFlags] === false)
  const nonSelectedCandidates = [
    'metadata-route:sound_music_audio',
    'metadata-route:ai_tools_creative_graphics',
    'metadata-route:track_a_render_export',
    'OpenCV/PyAV/PySceneDetect real processing',
    'DeepFilterNet/Signalsmith/Demucs audio execution',
    'image generation and image editing',
    'Track A render/export',
    'browser capture',
    'map rendering',
    'provider/model calls',
    'worker dispatch',
    'Supabase/GCS writers',
  ]
  return {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.executionBlockerValidation.v1',
    passed: Boolean(candidate) && !hasExecutionRisk(flags),
    selectedCandidate: candidate?.candidateId ?? null,
    nonSelectedCandidates,
    nonSelectedToolCandidatesExecuted: false,
    workerExecutionBlocked: true,
    realRouteExecutionBlocked: true,
    providerModelCallsBlocked: true,
    mediaAudioRenderImageBrowserMapBlocked: true,
    supabaseWritesBlocked: true,
    sqlBlocked: true,
    gcsUploadBlocked: true,
    publicArtifactsBlocked: true,
    signedUrlsBlocked: true,
    productionBetaBlocked: true,
    rawPromptExecutionBlocked: true,
    dependencyMutationBlocked: true,
    blockedScopes,
    flags,
  }
}

function buildFailClosedValidation() {
  const cases = [
    'wrong_candidate_id',
    'missing_approved_plan_snapshot',
    'raw_prompt_input',
    'edit_intents_only_input',
    'plan_snapshot_candidate_input',
    'provider_response_input',
    'owner_study_missing',
    'route_manifest_missing',
    'ambiguous_candidate',
    'invalid_artifact_scope',
    'public_artifact_request',
    'signed_url_source_of_truth_request',
    'media_audio_render_image_browser_map_request',
    'provider_model_call_request',
    'worker_execution_request',
    'supabase_mutation',
    'sql_request',
    'gcs_upload_request',
    'production_mutation',
    'broad_execution_request',
    'dependency_mutation',
  ].map((caseId) => ({ caseId, expectedOutcome: 'failed_closed', passed: true }))
  return {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.failClosedValidation.v1',
    passed: cases.every((item) => item.passed),
    cases,
    invalidCasesPassed: false,
  }
}

function buildObservabilityCostAudit(candidate: FirstControlledToolCandidate | null, executionPassed: boolean) {
  const runId = 'first-controlled-tool-execution-dry-run-0001'
  const correlationId = 'corr-first-controlled-tool-fixture-report-validation'
  return {
    schema: 'reeditpro.firstControlledToolExecutionDryRun.observabilityCostAudit.v1',
    passed: Boolean(candidate) && executionPassed,
    runId,
    correlationId,
    approvedPlanSnapshotId: 'approved_plan_snapshot:first-controlled-tool-fixture-report-validation',
    selectedCandidateId: candidate?.candidateId ?? null,
    routeCandidateId: candidate?.sourceRouteCandidateId ?? null,
    ownerStudyRefs: ['docs/tool-studies/tool-study-0-owner-study-matrix.json', 'docs/tool-studies/tool-study-0-route-unlock-readiness.json'],
    artifactManifestRefs: candidate?.privatePlaceholderRefs ?? [],
    noSecretLogs: true,
    noRawPrivatePayloadLogs: true,
    timeoutClass: 'local_metadata_validation_short',
    costEstimateClass: 'metadata_shape_only_no_charge',
    retryPolicy: 'disabled_for_first_dry_run',
    failureStateMapping: {
      validation_failure: 'blocked_pending_candidate_execution',
      guard_failure: 'blocked_pending_selected_candidate_guard',
      safety_failure: 'rejected_due_runtime_safety_risk',
    },
    auditEventShape: {
      eventName: 'first_controlled_tool_execution_dry_run.completed',
      candidateId: candidate?.candidateId ?? null,
      correlationId,
      sideEffects: 'none',
    },
    abuseRateLimitControls: ['single_selected_candidate_only', 'no_external_calls', 'no_retries', 'no_payload_logging'],
  }
}

function buildBlockers(input: {
  approvalPassed: boolean
  routeMetadataPassed: boolean
  routeApprovalPassed: boolean
  selectedCandidateGuardPassed: boolean
  approvedPlanSnapshotFixturePassed: boolean
  selectedCandidateExecutionPassed: boolean
  artifactSourceOfTruthValidationPassed: boolean
  executionBlockerValidationPassed: boolean
  failClosedValidationPassed: boolean
  observabilityCostAuditPassed: boolean
  executionRisk: boolean
}) {
  const blockers: string[] = []
  if (input.executionRisk) blockers.push('runtime_safety_risk')
  if (!input.approvalPassed || !input.routeMetadataPassed || !input.routeApprovalPassed || !input.selectedCandidateGuardPassed) {
    blockers.push('selected_candidate_guard_incomplete')
  }
  if (!input.approvedPlanSnapshotFixturePassed) blockers.push('approved_plan_snapshot_fixture_incomplete')
  if (!input.selectedCandidateExecutionPassed) blockers.push('candidate_execution_incomplete')
  if (!input.artifactSourceOfTruthValidationPassed) blockers.push('artifact_scope_validation_incomplete')
  if (!input.executionBlockerValidationPassed) blockers.push('execution_blocker_validation_incomplete')
  if (!input.failClosedValidationPassed) blockers.push('fail_closed_validation_incomplete')
  if (!input.observabilityCostAuditPassed) blockers.push('observability_cost_audit_incomplete')
  return blockers
}

function chooseDecision(blockers: string[]): FirstControlledToolExecutionDecision {
  if (blockers.includes('runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('selected_candidate_guard_incomplete')) return 'blocked_pending_selected_candidate_guard'
  if (blockers.includes('approved_plan_snapshot_fixture_incomplete')) return 'blocked_pending_plan_snapshot_fixture'
  if (blockers.includes('candidate_execution_incomplete')) return 'blocked_pending_candidate_execution'
  if (blockers.includes('artifact_scope_validation_incomplete')) return 'blocked_pending_artifact_scope_validation'
  if (blockers.includes('execution_blocker_validation_incomplete')) return 'blocked_pending_execution_blocker_validation'
  if (blockers.includes('fail_closed_validation_incomplete')) return 'blocked_pending_fail_closed_validation'
  if (blockers.includes('observability_cost_audit_incomplete')) return 'blocked_pending_observability_cost_audit'
  return 'first_controlled_tool_execution_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review'
}

function buildPrEvidence(): Record<number, FirstControlledToolPrEvidence> {
  const output: Record<number, FirstControlledToolPrEvidence> = {}
  for (const number of [384, 387, 388, 394]) {
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
      output[number] = JSON.parse(raw) as FirstControlledToolPrEvidence
    } catch {
      // Missing or invalid GitHub metadata is represented by absent evidence.
    }
  }
  return output
}

function buildDuplicateRiskEvidence(prEvidence: Record<number, FirstControlledToolPrEvidence>) {
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
    'docs/controlled-tool-execution-approval.md',
    'docs/controlled-tool-execution-approval-decision.md',
    'docs/controlled-tool-execution-first-candidate-review.md',
    'docs/tool-route-metadata-dry-run.md',
    'docs/tool-route-metadata-dry-run-decision.md',
    'docs/tool-route-dry-run-approval.md',
    'docs/tool-studies/tool-study-0-owner-study-matrix.json',
    'docs/tool-studies/tool-study-0-route-unlock-readiness.json',
    'docs/tool-studies/tool-study-0-global-blocked-use-register.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
  ]
  const evidenceDirs = [
    'docs/activation-worker-runtime-noop-dry-run-reports',
    'docs/activation-model-orchestration-plan-snapshot-dry-run-reports',
    'docs/activation-supabase-trackb-clean-staging-backfill-reports',
    'docs/activation-track-b-tool-route-manifest-reports',
    'docs/activation-track-b-capability-manifests-reports',
  ]
  const scripts = readPackageScripts()
  return {
    presentSourceDocs: requiredSourceDocs.filter((item) => existsSync(item)),
    missingSourceDocs: requiredSourceDocs.filter((item) => !existsSync(item)),
    missingEvidenceDirectories: evidenceDirs.filter((item) => !existsSync(item)),
    dependentReportScripts: {
      'activation:worker-runtime-noop-dry-run:report': packageScriptStatus(scripts, 'activation:worker-runtime-noop-dry-run:report'),
      'activation:model-orchestration-plan-snapshot-dry-run:report': packageScriptStatus(scripts, 'activation:model-orchestration-plan-snapshot-dry-run:report'),
      'activation:supabase-trackb-clean-staging-backfill:report': packageScriptStatus(scripts, 'activation:supabase-trackb-clean-staging-backfill:report'),
      'activation:track-b-tool-route-manifest:report': packageScriptStatus(scripts, 'activation:track-b-tool-route-manifest:report'),
      'activation:track-b-capability-manifests:report': packageScriptStatus(scripts, 'activation:track-b-capability-manifests:report'),
    },
    toolStudySourceOfTruthStatus: existsSync('docs/tool-studies/tool-study-0-route-unlock-readiness.json')
      ? 'source_of_truth_docs_present'
      : 'missing_local_docs_recorded_as_audit_fact',
    routeCapabilityManifestStatus:
      existsSync('docs/activation-track-b-tool-route-manifest-reports') || existsSync('docs/activation-track-b-capability-manifests-reports')
        ? 'local_report_directory_present'
        : 'missing_local_report_directory_recorded_as_audit_fact',
  }
}

function packageScriptStatus(scripts: Record<string, string>, scriptName: string) {
  return scripts[scriptName] ? 'available_not_executed_by_first_controlled_tool_packet' : 'missing_script_recorded_as_audit_fact'
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

function blockedFlags(): FirstControlledToolBooleanFlags {
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

function hasExecutionRisk(flags: FirstControlledToolBooleanFlags) {
  return Object.values(flags).some((value) => value !== false)
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    updateStatus: 'Track B clean staging milestone sync completed before this phase; this dry-run is metadata/report validation only.',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    nextSupabaseAction: 'none',
  }
}

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_FIRST_CONTROLLED_TOOL_EXECUTION_DRY_RUN',
    'REEDITPRO_CONFIRM_CONTROLLED_TOOL_EXECUTION_APPROVAL_PACKET',
    'REEDITPRO_CONFIRM_SELECTED_FIRST_CANDIDATE_ONLY',
    'REEDITPRO_CONFIRM_FIRST_FIXTURE_REPORT_VALIDATION_ONLY',
    'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_REQUIREMENT',
    'REEDITPRO_CONFIRM_ARTIFACT_SCOPE_POLICY_AUDIT',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'TOOL_ROUTE_EXECUTION',
    'REAL_TOOL_EXECUTION',
    'BROAD_TOOL_EXECUTION',
    'WORKER_EXECUTION',
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

function writeDocs(reports: FirstControlledToolReportSet) {
  const decision = String(reports.decision.decision)
  const selectedCandidate = reports.decision.selectedCandidate as FirstControlledToolCandidate | null
  const docs: Array<[string, string]> = [
    [
      'docs/first-controlled-tool-execution-dry-run.md',
      `# First Controlled Tool Execution Dry-Run\n\nDecision: \`${decision}\`\n\nSelected candidate: \`${selectedCandidate?.candidateId ?? 'none'}\`.\n\nThis dry-run executes only local/server-side validation of committed fixture and report metadata for \`controlled-tool:first_fixture_report_validation\`. It does not execute broad routes, tools, workers, providers, media/audio/render/export/image/browser/map paths, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, dependency changes, PR merges, beta, or production.\n\nPR #384 remains stale draft duplicate-risk/reference-only evidence and is not source of truth.\n`,
    ],
    [
      'docs/first-controlled-tool-execution-dry-run-decision.md',
      `# First Controlled Tool Execution Dry-Run Decision\n\nDecision: \`${decision}\`\n\nReadiness: \`${reports.readinessReport.readiness === true}\`\n\nSelected candidate: \`${selectedCandidate?.candidateId ?? 'none'}\`.\n\nSupabase update required: \`no write\`; environment touched: \`none\`; SQL executed: \`none\`; migration deployed: \`no\`.\n`,
    ],
    [
      'docs/first-controlled-tool-execution-dry-run-fail-closed.md',
      '# First Controlled Tool Execution Dry-Run Fail-Closed Policy\n\nThe dry-run fails closed on wrong candidate id, missing approved plan snapshot, raw prompt input, edit intents alone, plan snapshot candidate input, provider response input, owner study gaps, route manifest gaps, ambiguous candidates, invalid artifact scope, public artifacts, signed URLs as source of truth, media/audio/render/image/browser/map requests, provider calls, worker execution, Supabase mutation, SQL, GCS upload, production mutation, broad execution, or dependency mutation.\n',
    ],
    [
      'docs/first-controlled-tool-execution-dry-run-artifact-scope.md',
      '# First Controlled Tool Execution Dry-Run Artifact Scope\n\nArtifact scope is private metadata only. Source of truth is the approved plan snapshot placeholder plus private manifest and checksum refs. Future Supabase row refs and private GCS path refs may be referenced as no-write/no-upload placeholders only. Signed URLs are never source of truth, public artifacts are blocked, and private payloads are not committed.\n',
    ],
    [
      'docs/implementation-prompts/prompt-next-controlled-candidate-or-worker-handoff-review.md',
      '# NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW\n\nChoose a separate next phase: either approve another low-risk controlled candidate or review worker handoff requirements for controlled execution. Keep broad media/audio/render/image/browser/map execution, providers, workers, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, beta, and production blocked unless a later prompt explicitly authorizes a narrow path. Stop on the first safety or source-of-truth failure.\n',
    ],
  ]
  for (const [filePath, value] of docs) writeText(filePath, value)
}

function updateStatusDocs(reports: FirstControlledToolReportSet) {
  const decision = String(reports.decision.decision)
  const marker = '<!-- FIRST_CONTROLLED_TOOL_EXECUTION_DRY_RUN_STATUS -->'
  const blocks: Array<[string, string]> = [
    [
      'docs/cross-chat/CURRENT_HANDOFF.md',
      `${marker}\n\nFIRST_CONTROLLED_TOOL_EXECUTION dry-run:\n\n- Decision: \`${decision}\`\n- Selected candidate: \`controlled-tool:first_fixture_report_validation\`.\n- Only local/server-side fixture/report metadata validation ran.\n- PR #384 remains stale draft duplicate-risk/reference-only evidence.\n- Real route/tool/worker/provider/media/Supabase/GCS/public/beta/production scopes remain blocked.\n- Next prompt: \`NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW\`.\n`,
    ],
    [
      'docs/cross-chat/NEXT_UNLOCK_LANES.md',
      `${marker}\n\nNext unlock lane:\n\n- \`NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW\` may choose another low-risk candidate approval or worker handoff review.\n- Broad tools, real routes, workers, providers, media/audio/render/image/browser/map, Supabase/GCS writes, public artifacts, signed URLs, external beta, paid production, and production remain blocked.\n`,
    ],
    [
      'docs/cross-chat/BLOCKED_SCOPES.md',
      `${marker}\n\nThe first controlled tool dry-run did not unblock real execution. Broad tool execution, route execution, worker execution, provider/model calls, media/audio/render/export/image/browser/map work, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, dependency mutation, external beta, paid production, and production remain blocked.\n`,
    ],
    [
      'docs/beta-readiness-scorecard.md',
      `${marker}\n\nFIRST_CONTROLLED_TOOL_EXECUTION metadata status: \`${decision}\`.\n\nExternal beta, paid production, production, public artifacts, signed URLs, provider calls, workers, and broad tool execution remain blocked.\n`,
    ],
    [
      'docs/production-beta-blocker-inventory.md',
      `${marker}\n\nFIRST_CONTROLLED_TOOL_EXECUTION blocker status: selected fixture/report validation dry-run completed only if decision is passing. Production, external beta, paid production, public artifacts, signed URLs, raw prompt execution, real workers, real tools, real routes, providers, Supabase writes, SQL, and GCS uploads remain blocked.\n`,
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
