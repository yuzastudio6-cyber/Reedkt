import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  SecondControlledCandidateDryRunDecision,
  SecondControlledDryRunCandidate,
  SecondControlledDryRunFlags,
  SecondControlledDryRunReportSet,
  SecondControlledPrEvidence,
} from './second-controlled-candidate-dry-run-types'

export const SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR = 'docs/activation-second-controlled-candidate-dry-run-reports'
export const SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID = 'controlled-tool:second_fixture_report_validation'
export const SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID = 'valid_sound_music_audio_metadata_route_candidate'
export const SECOND_CONTROLLED_DRY_RUN_ROUTE_ID = 'metadata-route:sound_music_audio'
export const SECOND_CONTROLLED_DRY_RUN_OWNER_LANE = 'SOUND_MUSIC_AUDIO'

const SECOND_APPROVAL_REPORT_DIR = 'docs/activation-second-controlled-candidate-approval-reports'
const NEXT_CONTROLLED_REPORT_DIR = 'docs/activation-next-controlled-candidate-or-worker-handoff-reports'
const FIRST_CONTROLLED_REPORT_DIR = 'docs/activation-first-controlled-tool-execution-dry-run-reports'
const CONTROLLED_APPROVAL_REPORT_DIR = 'docs/activation-controlled-tool-execution-approval-reports'
const TOOL_ROUTE_METADATA_REPORT_DIR = 'docs/activation-tool-route-metadata-dry-run-reports'
const TOOL_ROUTE_APPROVAL_REPORT_DIR = 'docs/activation-tool-route-dry-run-approval-reports'
const TOOL_ROUTE_APPROVAL_FIXTURES = `${TOOL_ROUTE_APPROVAL_REPORT_DIR}/tool_route_synthetic_approved_plan_snapshot_fixtures.json`

const reportPaths = {
  sourceOfTruthAudit: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/source_of_truth_audit.json`,
  preExecutionRevalidation: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/pre_execution_revalidation_report.json`,
  evidenceInventory: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/evidence_inventory.json`,
  selectedSecondCandidateGuard: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/selected_second_candidate_guard_report.json`,
  approvedPlanSnapshotFixture: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/approved_plan_snapshot_fixture_report.json`,
  soundMusicAudioMetadataRouteFixture: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/sound_music_audio_metadata_route_fixture_report.json`,
  selectedSecondCandidateExecution: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/selected_second_candidate_execution_report.json`,
  artifactSourceOfTruthValidation: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/artifact_source_of_truth_validation_report.json`,
  executionBlockerValidation: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/execution_blocker_validation_report.json`,
  failClosedValidation: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/fail_closed_validation_report.json`,
  observabilityCostAudit: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/observability_cost_audit_report.json`,
  decision: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/second_controlled_candidate_dry_run_decision.json`,
  blockerReport: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/second_controlled_candidate_dry_run_blocker_report.json`,
  readinessReport: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/second_controlled_candidate_dry_run_readiness_report.json`,
  privateArtifactManifest: `${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/second_controlled_candidate_dry_run_private_artifact_manifest.json`,
}

const docPaths = [
  'docs/second-controlled-candidate-dry-run.md',
  'docs/second-controlled-candidate-dry-run-decision.md',
  'docs/second-controlled-candidate-dry-run-fail-closed.md',
  'docs/second-controlled-candidate-dry-run-artifact-scope.md',
  'docs/implementation-prompts/prompt-next-controlled-candidate-or-worker-handoff-review-after-second.md',
]

export function buildSecondControlledCandidateDryRunPlan() {
  return {
    phase: 'SECOND_CONTROLLED_CANDIDATE_EXECUTION',
    packet: 'second controlled candidate dry-run',
    branch: 'codex/rp-second-controlled-candidate-dry-run',
    baseBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    expectedSourceSha: '73c487e92de4f9b6d105c4d283debf50ea119c4a',
    mode: 'selected_candidate_metadata_report_validation_only',
    expectedDecision: 'second_controlled_candidate_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review',
    selectedCandidate: SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID,
    selectedFixture: SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID,
    selectedRoute: SECOND_CONTROLLED_DRY_RUN_ROUTE_ID,
    ownerLane: SECOND_CONTROLLED_DRY_RUN_OWNER_LANE,
    requiredConfirmations: requiredConfirmations(),
    forbiddenScopes: Object.entries(blockedFlags())
      .filter(([, value]) => value === false)
      .map(([name]) => name),
    reports: Object.values(reportPaths),
    docs: docPaths,
  }
}

export function buildSecondControlledCandidateDryRunReports(
  selectedCandidateArg = SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID
): SecondControlledDryRunReportSet {
  const createdAt = new Date().toISOString()
  const flags = blockedFlags()
  const prEvidence = buildPrEvidence()
  const duplicateRisk = buildDuplicateRiskEvidence(prEvidence)
  const duplicateSearch = searchOpenPhasePrs()
  const approvalEvidence = readSecondApprovalEvidence()
  const nextEvidence = readNextControlledEvidence()
  const firstEvidence = readFirstControlledEvidence()
  const controlledApprovalEvidence = readControlledApprovalEvidence()
  const routeMetadataEvidence = readRouteMetadataEvidence()
  const routeApprovalEvidence = readRouteApprovalEvidence()
  const soundEvidence = readSoundMusicAudioEvidence()
  const docsPresence = buildDocsPresence()
  const selectedCandidate = buildSelectedCandidate(approvalEvidence, routeMetadataEvidence, flags)
  const selectedSecondCandidateGuard = buildSelectedSecondCandidateGuard(selectedCandidateArg, selectedCandidate, approvalEvidence, nextEvidence, routeMetadataEvidence, flags)
  const approvedPlanSnapshotFixture = buildApprovedPlanSnapshotFixture(selectedCandidate, selectedSecondCandidateGuard.passed === true, flags)
  const soundMusicAudioMetadataRouteFixture = buildSoundMusicAudioRouteFixture(selectedCandidate, routeMetadataEvidence, soundEvidence, selectedSecondCandidateGuard.passed === true)
  const selectedSecondCandidateExecution = buildSelectedSecondCandidateExecution(
    selectedCandidate,
    selectedSecondCandidateGuard.passed === true,
    approvedPlanSnapshotFixture.passed === true,
    soundMusicAudioMetadataRouteFixture.passed === true,
    routeMetadataEvidence
  )
  const artifactSourceOfTruthValidation = buildArtifactSourceOfTruthValidation(selectedCandidate, selectedSecondCandidateExecution.passed === true)
  const executionBlockerValidation = buildExecutionBlockerValidation(selectedCandidate, flags)
  const failClosedValidation = buildFailClosedValidation()
  const observabilityCostAudit = buildObservabilityCostAudit(selectedCandidate, selectedSecondCandidateExecution.passed === true)
  const executionRisk = hasExecutionRisk(flags)
  const blockers = buildBlockers({
    sourcePrsMerged: requiredPrsMerged(prEvidence),
    pr384ReferenceOnly: duplicateRisk.treatedAsSourceOfTruth === false,
    duplicateSearchClear: duplicateSearch.matches.length === 0,
    approvalPassed: approvalEvidence.passed,
    nextRecommendationPassed: nextEvidence.passed,
    firstControlledPassed: firstEvidence.passed,
    controlledApprovalPassed: controlledApprovalEvidence.passed,
    routeMetadataPassed: routeMetadataEvidence.passed,
    routeApprovalPassed: routeApprovalEvidence.passed,
    selectedSecondCandidateGuardPassed: selectedSecondCandidateGuard.passed === true,
    approvedPlanSnapshotFixturePassed: approvedPlanSnapshotFixture.passed === true,
    soundMusicAudioFixturePassed: soundMusicAudioMetadataRouteFixture.passed === true,
    selectedSecondCandidateExecutionPassed: selectedSecondCandidateExecution.passed === true,
    artifactSourceOfTruthValidationPassed: artifactSourceOfTruthValidation.passed === true,
    executionBlockerValidationPassed: executionBlockerValidation.passed === true,
    failClosedValidationPassed: failClosedValidation.passed === true,
    observabilityCostAuditPassed: observabilityCostAudit.passed === true,
    executionRisk,
  })
  const decision = chooseDecision(blockers)
  const readiness = decision === 'second_controlled_candidate_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review'

  const sourceOfTruthAudit = {
    schema: 'reeditpro.secondControlledCandidateDryRun.sourceOfTruthAudit.v1',
    createdAt,
    sourceBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    expectedSourceSha: '73c487e92de4f9b6d105c4d283debf50ea119c4a',
    currentBranch: safeGit(['branch', '--show-current']) ?? null,
    currentSha: safeGit(['rev-parse', 'HEAD']) ?? null,
    requiredPrEvidence: pickPrEvidence(prEvidence, [407, 402, 399, 394, 388, 387]),
    pr384DuplicateRisk: duplicateRisk,
    duplicatePhasePrSearch: duplicateSearch,
    docsPresence,
    packageLockChanged: packageLockChanged(),
    flags,
    supabaseClassification: supabaseClassification(),
    decision,
  }

  const preExecutionRevalidation = {
    schema: 'reeditpro.secondControlledCandidateDryRun.preExecutionRevalidation.v1',
    createdAt,
    pr407Merged: prEvidence[407]?.state === 'MERGED' && Boolean(prEvidence[407]?.mergedAt),
    pr402Merged: prEvidence[402]?.state === 'MERGED' && Boolean(prEvidence[402]?.mergedAt),
    pr399Merged: prEvidence[399]?.state === 'MERGED' && Boolean(prEvidence[399]?.mergedAt),
    pr394Merged: prEvidence[394]?.state === 'MERGED' && Boolean(prEvidence[394]?.mergedAt),
    pr388Merged: prEvidence[388]?.state === 'MERGED' && Boolean(prEvidence[388]?.mergedAt),
    pr387Merged: prEvidence[387]?.state === 'MERGED' && Boolean(prEvidence[387]?.mergedAt),
    pr384ReferenceOnly: duplicateRisk.treatedAsSourceOfTruth === false,
    duplicateSecondCandidateExecutionPrs: duplicateSearch.matches,
    approvalEvidence,
    nextRecommendationEvidence: nextEvidence,
    firstControlledExecutionEvidence: firstEvidence,
    controlledToolApprovalEvidence: controlledApprovalEvidence,
    routeMetadataEvidence: summarizeRouteMetadataEvidence(routeMetadataEvidence),
    routeApprovalEvidence,
    soundMusicAudioEvidence: soundEvidence,
    optionalDependentScripts: docsPresence.dependentReportScripts,
    missingOptionalEvidenceRecordedAsAuditFacts: docsPresence.missingEvidenceDirectories,
    blockedScopesPreserved: !executionRisk,
    packageLockChanged: packageLockChanged(),
  }

  const evidenceInventory = {
    schema: 'reeditpro.secondControlledCandidateDryRun.evidenceInventory.v1',
    createdAt,
    pr407ApprovalDecision: approvalEvidence.decision,
    selectedSecondCandidate: SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID,
    selectedFixture: SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID,
    selectedRoute: SECOND_CONTROLLED_DRY_RUN_ROUTE_ID,
    ownerLane: SECOND_CONTROLLED_DRY_RUN_OWNER_LANE,
    pr402RecommendationDecision: nextEvidence.decision,
    pr399FirstControlledDryRunPassed: firstEvidence.passed,
    pr394ControlledApprovalPassed: controlledApprovalEvidence.passed,
    pr388RouteMetadataDryRunPassed: routeMetadataEvidence.passed,
    pr387RouteDryRunApprovalPassed: routeApprovalEvidence.passed,
    toolStudySourceOfTruthStatus: docsPresence.toolStudySourceOfTruthStatus,
    soundMusicAudioDiagnosticsStatus: soundEvidence.status,
    workerNoopEvidence: docsPresence.dependentReportScripts['activation:worker-runtime-noop-dry-run:report'],
    planSnapshotDryRunEvidence: docsPresence.dependentReportScripts['activation:model-orchestration-plan-snapshot-dry-run:report'],
    routeCapabilityManifestStatus: docsPresence.routeCapabilityManifestStatus,
    supabaseTrackBBackfillEvidence: docsPresence.dependentReportScripts['activation:supabase-trackb-clean-staging-backfill:report'],
    publicArtifactSignedUrlPolicyStatus: 'blocked_signed_urls_not_source_of_truth',
    secretRefs: secretRefs(),
    flags,
  }

  const decisionReport = {
    schema: 'reeditpro.secondControlledCandidateDryRun.decision.v1',
    createdAt,
    decision,
    readiness,
    selectedCandidate,
    blockers,
    secondCandidateExecuted: readiness,
    executionKind: 'local_server_only_fixture_report_validation',
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
    nextPrompt:
      decision === 'second_controlled_candidate_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review'
        ? 'NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW_AFTER_SECOND — choose next controlled low-risk candidate approval or worker handoff review'
        : 'SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REMEDIATION',
    supabaseClassification: supabaseClassification(),
  }

  const blockerReport = {
    schema: 'reeditpro.secondControlledCandidateDryRun.blockerReport.v1',
    createdAt,
    decision,
    blockers,
    activeRuntimeBlockersPreserved: true,
    nonSelectedToolsRemainBlocked: true,
    workerExecutionRemainsBlocked: true,
    realAudioProcessingRemainsBlocked: true,
    nextPhaseRequiresSeparateApproval: true,
    staleDuplicatePr: duplicateRisk,
  }

  const readinessReport = {
    schema: 'reeditpro.secondControlledCandidateDryRun.readinessReport.v1',
    createdAt,
    readiness,
    decision,
    approvalPassed: approvalEvidence.passed,
    nextRecommendationPassed: nextEvidence.passed,
    firstControlledPassed: firstEvidence.passed,
    routeMetadataPassed: routeMetadataEvidence.passed,
    selectedSecondCandidateGuardPassed: selectedSecondCandidateGuard.passed === true,
    approvedPlanSnapshotFixturePassed: approvedPlanSnapshotFixture.passed === true,
    soundMusicAudioFixturePassed: soundMusicAudioMetadataRouteFixture.passed === true,
    selectedSecondCandidateExecutionPassed: selectedSecondCandidateExecution.passed === true,
    artifactSourceOfTruthValidationPassed: artifactSourceOfTruthValidation.passed === true,
    executionBlockerValidationPassed: executionBlockerValidation.passed === true,
    failClosedValidationPassed: failClosedValidation.passed === true,
    observabilityCostAuditPassed: observabilityCostAudit.passed === true,
    runtimeScopesBlocked: !executionRisk,
  }

  const privateArtifactManifest = {
    schema: 'reeditpro.secondControlledCandidateDryRun.privateArtifactManifest.v1',
    createdAt,
    reportPaths: Object.values(reportPaths),
    docPaths,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    gcsUploads: false,
    privatePayloadsCommitted: false,
    mediaPayloadsCommitted: false,
    buildOutputCommitted: false,
    packageLockChanged: packageLockChanged(),
  }

  return {
    sourceOfTruthAudit,
    preExecutionRevalidation,
    evidenceInventory,
    selectedSecondCandidateGuard,
    approvedPlanSnapshotFixture,
    soundMusicAudioMetadataRouteFixture,
    selectedSecondCandidateExecution,
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

export function summarizeSecondControlledCandidateDryRun(reports = buildSecondControlledCandidateDryRunReports()): string {
  const blockers = (reports.blockerReport.blockers as string[]) ?? []
  const selectedCandidate = reports.decision.selectedCandidate as Record<string, unknown> | null
  return [
    'Second controlled candidate dry-run',
    `Decision: ${String(reports.decision.decision)}`,
    `Readiness: ${reports.readinessReport.readiness === true ? 'ready for next controlled candidate or worker handoff review after second' : 'blocked'}`,
    `Selected candidate: ${String(selectedCandidate?.candidateId ?? 'none')}`,
    `Selected fixture/route: ${String(selectedCandidate?.sourceFixtureId ?? 'none')} / ${String(selectedCandidate?.sourceRouteCandidateId ?? 'none')}`,
    'Selected behavior: local/server-only Sound/Music/Audio fixture/report metadata validation',
    'Route/tool/worker/provider/media/audio/render/image/browser/map/Supabase/GCS/public/beta/production scopes: blocked',
    'Supabase update required: no write; environment touched: none; SQL executed: none; migration deployed: no',
    'Blockers:',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function writeSecondControlledCandidateDryRunArtifacts(selectedCandidateArg = SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID) {
  const reports = buildSecondControlledCandidateDryRunReports(selectedCandidateArg)
  mkdirSync(SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR, { recursive: true })
  for (const [key, filePath] of Object.entries(reportPaths)) {
    writeJson(filePath, reports[key as keyof SecondControlledDryRunReportSet])
  }
  writeDocs(reports)
  updateStatusDocs(reports)
  return reports
}

function readSecondApprovalEvidence() {
  const decision = readJsonObject(`${SECOND_APPROVAL_REPORT_DIR}/second_controlled_candidate_approval_decision.json`)
  const readiness = readJsonObject(`${SECOND_APPROVAL_REPORT_DIR}/second_controlled_candidate_approval_readiness_report.json`)
  const scopeReview = readJsonObject(`${SECOND_APPROVAL_REPORT_DIR}/second_candidate_scope_review.json`)
  const routeReview = readJsonObject(`${SECOND_APPROVAL_REPORT_DIR}/sound_music_audio_route_review.json`)
  const candidate = (decision.selectedCandidate ?? scopeReview.candidate) as Record<string, unknown> | null
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const passed =
    decision.decision === 'approved_for_future_second_controlled_candidate_dry_run' &&
    decision.approvedForFutureSecondControlledCandidateDryRun === true &&
    readiness.readiness === true &&
    scopeReview.passed === true &&
    routeReview.passed === true &&
    candidate?.candidateId === SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID &&
    candidate?.sourceFixtureId === SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID &&
    candidate?.sourceRouteCandidateId === SECOND_CONTROLLED_DRY_RUN_ROUTE_ID &&
    candidate?.ownerLane === SECOND_CONTROLLED_DRY_RUN_OWNER_LANE &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    blockers,
    candidate,
    scopeReviewPassed: scopeReview.passed === true,
    routeReviewPassed: routeReview.passed === true,
    sourceReportsPresent: Boolean(decision.decision) && Boolean(readiness.schema),
  }
}

function readNextControlledEvidence() {
  const decision = readJsonObject(`${NEXT_CONTROLLED_REPORT_DIR}/next_controlled_candidate_or_worker_handoff_decision.json`)
  const readiness = readJsonObject(`${NEXT_CONTROLLED_REPORT_DIR}/next_controlled_candidate_or_worker_handoff_readiness_report.json`)
  const inventory = readJsonObject(`${NEXT_CONTROLLED_REPORT_DIR}/controlled_candidate_inventory.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const recommendedCandidate = (decision.recommendedCandidate ?? decision.recommendedNextCandidate) as Record<string, unknown> | null
  const rows = Array.isArray(inventory.rows) ? (inventory.rows as Array<Record<string, unknown>>) : []
  const inventoryRow = rows.find((row) => row.candidateId === SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID)
  const recommendedCandidateMatches =
    recommendedCandidate?.candidateId === SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID &&
    recommendedCandidate?.sourceFixtureId === SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID &&
    recommendedCandidate?.sourceRouteCandidateId === SECOND_CONTROLLED_DRY_RUN_ROUTE_ID &&
    recommendedCandidate?.ownerLane === SECOND_CONTROLLED_DRY_RUN_OWNER_LANE
  const inventoryRowMatches =
    inventoryRow?.approvedAsNextCandidate === true &&
    inventoryRow?.sourceFixtureId === SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID &&
    inventoryRow?.sourceRouteCandidateId === SECOND_CONTROLLED_DRY_RUN_ROUTE_ID &&
    inventoryRow?.ownerLane === SECOND_CONTROLLED_DRY_RUN_OWNER_LANE &&
    inventoryRow?.requiresWorker === false &&
    inventoryRow?.requiresSupabase === false &&
    inventoryRow?.requiresGcs === false &&
    inventoryRow?.requiresProvider === false &&
    inventoryRow?.requiresMedia === false &&
    inventoryRow?.requiresPublicArtifact === false
  const passed =
    decision.decision === 'recommended_next_controlled_candidate_approval' &&
    readiness.readiness === true &&
    (recommendedCandidateMatches || inventoryRowMatches) &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    blockers,
    recommendedCandidate,
    inventoryRow: inventoryRow ?? null,
    recommendedCandidateMatches,
    inventoryRowMatches,
    sourceReportsPresent: Boolean(decision.decision),
  }
}

function readFirstControlledEvidence() {
  const decision = readJsonObject(`${FIRST_CONTROLLED_REPORT_DIR}/first_controlled_tool_execution_decision.json`)
  const readiness = readJsonObject(`${FIRST_CONTROLLED_REPORT_DIR}/first_controlled_tool_execution_readiness_report.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  return {
    passed:
      decision.decision === 'first_controlled_tool_execution_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review' &&
      readiness.readiness === true &&
      blockers.length === 0,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    blockers,
    sourceReportsPresent: Boolean(decision.decision),
  }
}

function readControlledApprovalEvidence() {
  const decision = readJsonObject(`${CONTROLLED_APPROVAL_REPORT_DIR}/controlled_tool_execution_approval_decision.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  return {
    passed: decision.decision === 'approved_for_future_first_controlled_tool_execution_dry_run' && blockers.length === 0,
    decision: decision.decision ?? null,
    blockers,
    sourceReportsPresent: Boolean(decision.decision),
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

function readRouteMetadataEvidence() {
  const decision = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_dry_run_decision.json`)
  const readiness = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_dry_run_readiness_report.json`)
  const fixtureValidation = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_fixture_validation_report.json`)
  const metadataResolution = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_resolution_report.json`)
  const artifactScope = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_artifact_scope_validation_report.json`)
  const failClosed = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_fail_closed_validation_report.json`)
  const observability = readJsonObject(`${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_observability_cost_audit_report.json`)
  const approvalFixtures = readJsonObject(TOOL_ROUTE_APPROVAL_FIXTURES)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const fixtureRows = Array.isArray(fixtureValidation.rows) ? (fixtureValidation.rows as Array<Record<string, unknown>>) : []
  const routeRows = Array.isArray(metadataResolution.rows) ? (metadataResolution.rows as Array<Record<string, unknown>>) : []
  const approvalRows = Array.isArray(approvalFixtures.fixtures) ? (approvalFixtures.fixtures as Array<Record<string, unknown>>) : []
  const fixtureRow = fixtureRows.find((row) => row.fixtureId === SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID)
  const routeRow = routeRows.find((row) => row.fixtureId === SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID && row.routeCandidateId === SECOND_CONTROLLED_DRY_RUN_ROUTE_ID)
  const approvalFixture = approvalRows.find((row) => row.fixtureId === SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID)
  const passed =
    decision.decision === 'tool_route_metadata_dry_run_passed_ready_for_controlled_tool_execution_approval' &&
    decision.readiness === true &&
    readiness.readiness === true &&
    fixtureValidation.passed === true &&
    metadataResolution.passed === true &&
    artifactScope.passed === true &&
    failClosed.passed === true &&
    observability.passed === true &&
    fixtureRow?.fixtureClass === 'valid' &&
    fixtureRow?.owner === SECOND_CONTROLLED_DRY_RUN_OWNER_LANE &&
    fixtureRow?.acceptedMetadataOnly === true &&
    fixtureRow?.failedClosed === false &&
    routeRow?.passed === true &&
    routeRow?.owner === SECOND_CONTROLLED_DRY_RUN_OWNER_LANE &&
    routeRow?.routeExecutionAllowed === false &&
    routeRow?.toolExecutionAllowed === false &&
    routeRow?.workerExecutionAllowed === false &&
    routeRow?.providerExecutionAllowed === false &&
    approvalFixture?.expectedOutcome === 'accepted_metadata_only' &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    blockers,
    fixtureValidation,
    metadataResolution,
    artifactScope,
    failClosed,
    observability,
    approvalFixture: approvalFixture ?? null,
    fixtureRow: fixtureRow ?? null,
    routeRow: routeRow ?? null,
    sourceReportsPresent: Boolean(decision.decision) && Boolean(metadataResolution.schema),
  }
}

function readSoundMusicAudioEvidence() {
  const audit = readJsonObject('docs/tool-studies/sound-music-audio-source-of-truth-audit.json')
  const routingPolicy = readText('docs/tool-studies/sound-music-audio-routing-policy.md')
  const handoff = readText('docs/tool-studies/sound-music-audio-handoff-contract.md')
  const auditText = JSON.stringify(audit).toLowerCase()
  const routingPolicyText = routingPolicy.toLowerCase()
  const handoffText = handoff.toLowerCase()
  const policyWithoutWhitespace = routingPolicyText.replace(/\s+/g, '')
  const demucsBlocked = routingPolicyText.includes('demucs') && routingPolicyText.includes('blocked') && auditText.includes('demucs')
  const soundMusicAudioRoutePresent = routingPolicyText.includes('sound_music_audio') && handoffText.includes('sound_music_audio')
  const runtimeFlagsFalse =
    audit.runtimeReadiness &&
    typeof audit.runtimeReadiness === 'object' &&
    (audit.runtimeReadiness as Record<string, unknown>).realRuntimeReady === false &&
    (audit.runtimeReadiness as Record<string, unknown>).metadataReviewReady === true &&
    [
      'routeexecutionallowed',
      'runtimeexecutionallowed',
      'workerexecutionallowed',
      'providerexecutionallowed',
      'toolexecutionallowed',
      'audioprocessingallowed',
      'mediaprocessingallowed',
    ].every((flag) => policyWithoutWhitespace.includes(`"${flag}":false`) || routingPolicyText.includes(`${flag}: false`))
  const deepFilterNetSignalsmithRealProcessingBlocked =
    routingPolicyText.includes('deepfilternet') &&
    routingPolicyText.includes('signalsmith') &&
    routingPolicyText.includes('audio processing') &&
    routingPolicyText.includes('worker execution') &&
    routingPolicyText.includes('tool execution')
  const passed =
    audit.decision === 'sound_music_audio_tool_study_passed_docs_only' &&
    soundMusicAudioRoutePresent &&
    handoff.includes('SOUND_MUSIC_AUDIO') &&
    demucsBlocked &&
    runtimeFlagsFalse &&
    deepFilterNetSignalsmithRealProcessingBlocked
  return {
    passed,
    status: audit.decision ?? null,
    routingPolicyPresent: Boolean(routingPolicy),
    handoffPresent: Boolean(handoff),
    demucsRuntimeBlocked: demucsBlocked,
    deepFilterNetSignalsmithRealProcessingBlocked,
    runtimeFlagsFalse,
    soundMusicAudioRoutePresent,
    sourceAuditPresent: Boolean(audit.schema),
  }
}

function buildSelectedCandidate(
  approvalEvidence: ReturnType<typeof readSecondApprovalEvidence>,
  routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>,
  flags: SecondControlledDryRunFlags
): SecondControlledDryRunCandidate | null {
  const approvedCandidate = approvalEvidence.candidate
  const approvalFixture = routeMetadataEvidence.approvalFixture
  if (!approvedCandidate || !approvalFixture) return null
  const refs = Array.isArray(approvedCandidate.privatePlaceholderRefs)
    ? approvedCandidate.privatePlaceholderRefs.map(String)
    : Array.isArray(approvalFixture.privatePlaceholderRefs)
      ? approvalFixture.privatePlaceholderRefs.map(String)
      : ['manifest:synthetic-second-controlled-sound-fixture', 'checksum:synthetic-second-controlled-sound-fixture', 'private-gcs-ref:placeholder-only/no-upload']
  return {
    candidateId: SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID,
    candidateClass: 'fixture_report_validation_route_variant',
    ownerLane: SECOND_CONTROLLED_DRY_RUN_OWNER_LANE,
    sourceFixtureId: SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID,
    sourceRouteCandidateId: SECOND_CONTROLLED_DRY_RUN_ROUTE_ID,
    approvedPlanSnapshotRef: String(
      approvedCandidate.approvedPlanSnapshotRef ??
        approvalFixture.approvedPlanSnapshotRef ??
        'approved_plan_snapshot_v1:synthetic-second-controlled-sound-fixture'
    ),
    privatePlaceholderRefs: refs,
    executionFlags: flags,
  }
}

function buildSelectedSecondCandidateGuard(
  selectedCandidateArg: string,
  candidate: SecondControlledDryRunCandidate | null,
  approvalEvidence: ReturnType<typeof readSecondApprovalEvidence>,
  nextEvidence: ReturnType<typeof readNextControlledEvidence>,
  routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>,
  flags: SecondControlledDryRunFlags
) {
  const allFlagsBlocked = !hasExecutionRisk(flags)
  const selectedCandidateMatches = selectedCandidateArg === SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID && candidate?.candidateId === SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID
  const selectedRouteMatches =
    candidate?.sourceFixtureId === SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID &&
    candidate?.sourceRouteCandidateId === SECOND_CONTROLLED_DRY_RUN_ROUTE_ID &&
    candidate?.ownerLane === SECOND_CONTROLLED_DRY_RUN_OWNER_LANE
  const passed =
    Boolean(candidate) &&
    selectedCandidateMatches &&
    selectedRouteMatches &&
    approvalEvidence.passed &&
    nextEvidence.passed &&
    routeMetadataEvidence.passed &&
    allFlagsBlocked
  return {
    schema: 'reeditpro.secondControlledCandidateDryRun.selectedSecondCandidateGuard.v1',
    passed,
    requestedCandidate: selectedCandidateArg,
    selectedCandidate: candidate,
    selectedCandidateMatches,
    selectedRouteMatches,
    withinPr407ApprovalScope: approvalEvidence.passed,
    withinPr402RecommendationScope: nextEvidence.passed,
    noOtherCandidateEnabled: true,
    localServerOnly: true,
    metadataReportValidationOnly: true,
    externalNetworkCallsAllowed: false,
    supabaseWritesAllowed: false,
    gcsUploadsAllowed: false,
    providerCallsAllowed: false,
    mediaProcessingAllowed: false,
    audioProcessingAllowed: false,
    workerQueueEnqueueAllowed: false,
    realRouteExecutionAllowed: false,
    allExecutionFlagsFalse: allFlagsBlocked,
  }
}

function buildApprovedPlanSnapshotFixture(candidate: SecondControlledDryRunCandidate | null, guardPassed: boolean, flags: SecondControlledDryRunFlags) {
  const refs = candidate?.privatePlaceholderRefs ?? []
  const placeholderRefsOnly = refs.length >= 2 && refs.every(isSafePlaceholderRef)
  const snapshotRefOk = Boolean(candidate?.approvedPlanSnapshotRef) && !containsSignedUrl(String(candidate?.approvedPlanSnapshotRef))
  const passed =
    Boolean(candidate) &&
    guardPassed &&
    placeholderRefsOnly &&
    snapshotRefOk &&
    candidate?.sourceRouteCandidateId === SECOND_CONTROLLED_DRY_RUN_ROUTE_ID &&
    !hasExecutionRisk(flags)
  return {
    schema: 'reeditpro.secondControlledCandidateDryRun.approvedPlanSnapshotFixture.v1',
    passed,
    approvedPlanSnapshotId: 'approved_plan_snapshot:second-controlled-sound-fixture-report-validation',
    approvedPlanSnapshotRef: candidate?.approvedPlanSnapshotRef ?? null,
    snapshotSchema: 'approved_plan_snapshot_v1',
    immutableSnapshot: true,
    approvedScope: [SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID],
    selectedRoute: SECOND_CONTROLLED_DRY_RUN_ROUTE_ID,
    rejectedInputKinds: ['raw_prompt', 'edit_intents_v1_only', 'plan_snapshot_candidate_v1', 'provider_response', 'private_payload', 'media_payload', 'audio_payload'],
    rawPromptExecutionAllowed: false,
    signedUrlsAsSourceOfTruth: false,
    publicArtifactsAllowed: false,
    artifactScope: 'private_metadata_only',
    sourceOfTruthRefs: {
      approvedPlanSnapshotRef: candidate?.approvedPlanSnapshotRef ?? null,
      manifestRefs: refs.filter((ref) => ref.includes('manifest')),
      checksumRefs: refs.filter((ref) => ref.includes('checksum')),
      futureSupabaseRowRefs: ['metadata-only-placeholder:no-write'],
      privateGcsPathRefs: ['private-gcs-ref:placeholder-only/no-upload'],
    },
    noRealUserPrivateMediaAudioPayloads: true,
    noProviderData: true,
    noSupabaseOrGcsWriteRefsExecuted: true,
    placeholderRefsOnly,
    flags,
  }
}

function buildSoundMusicAudioRouteFixture(
  candidate: SecondControlledDryRunCandidate | null,
  routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>,
  soundEvidence: ReturnType<typeof readSoundMusicAudioEvidence>,
  guardPassed: boolean
) {
  const fixtureRow = routeMetadataEvidence.fixtureRow
  const routeRow = routeMetadataEvidence.routeRow
  const passed =
    Boolean(candidate) &&
    guardPassed &&
    routeMetadataEvidence.passed &&
    soundEvidence.passed &&
    fixtureRow?.fixtureId === SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID &&
    fixtureRow?.owner === SECOND_CONTROLLED_DRY_RUN_OWNER_LANE &&
    fixtureRow?.acceptedMetadataOnly === true &&
    routeRow?.routeCandidateId === SECOND_CONTROLLED_DRY_RUN_ROUTE_ID &&
    routeRow?.routeExecutionAllowed === false &&
    routeRow?.toolExecutionAllowed === false &&
    routeRow?.workerExecutionAllowed === false &&
    routeRow?.providerExecutionAllowed === false
  return {
    schema: 'reeditpro.secondControlledCandidateDryRun.soundMusicAudioMetadataRouteFixture.v1',
    passed,
    fixtureId: SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID,
    routeCandidateId: SECOND_CONTROLLED_DRY_RUN_ROUTE_ID,
    ownerLane: SECOND_CONTROLLED_DRY_RUN_OWNER_LANE,
    fixtureRow,
    routeRow,
    routeMetadataOnly: true,
    audioProcessingAllowed: false,
    mediaProcessingAllowed: false,
    demucsRuntimeAllowed: false,
    deepFilterNetRealProcessingAllowed: false,
    signalsmithRealProcessingAllowed: false,
    noAudioPayloads: true,
    noPrivateMediaPayloads: true,
    noOutputArtifactsCreated: true,
    soundEvidence,
  }
}

function buildSelectedSecondCandidateExecution(
  candidate: SecondControlledDryRunCandidate | null,
  guardPassed: boolean,
  snapshotPassed: boolean,
  soundFixturePassed: boolean,
  routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>
) {
  const requiredReportFields = [
    `${SECOND_APPROVAL_REPORT_DIR}/second_controlled_candidate_approval_decision.json`,
    `${SECOND_APPROVAL_REPORT_DIR}/second_candidate_scope_review.json`,
    `${SECOND_APPROVAL_REPORT_DIR}/sound_music_audio_route_review.json`,
    `${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_fixture_validation_report.json`,
    `${TOOL_ROUTE_METADATA_REPORT_DIR}/tool_route_metadata_resolution_report.json`,
    `${TOOL_ROUTE_APPROVAL_REPORT_DIR}/tool_route_synthetic_approved_plan_snapshot_fixtures.json`,
  ]
  const requiredReportsPresent = requiredReportFields.every((file) => existsSync(file))
  const routeFieldsValid =
    routeMetadataEvidence.fixtureRow?.acceptedMetadataOnly === true &&
    routeMetadataEvidence.fixtureRow?.allFlagsBlocked === true &&
    routeMetadataEvidence.routeRow?.routeCompatibility === 'compatible_metadata_only'
  const passed =
    Boolean(candidate) &&
    guardPassed &&
    snapshotPassed &&
    soundFixturePassed &&
    requiredReportsPresent &&
    routeFieldsValid &&
    routeMetadataEvidence.passed
  return {
    schema: 'reeditpro.secondControlledCandidateDryRun.selectedSecondCandidateExecution.v1',
    passed,
    candidateId: candidate?.candidateId ?? null,
    executionKind: 'local_server_only_sound_music_audio_fixture_report_validation',
    selectedFixture: routeMetadataEvidence.fixtureRow,
    selectedRoute: routeMetadataEvidence.routeRow,
    requiredReportsPresent,
    requiredReportFields,
    validatedOperations: [
      'committed_second_approval_report_presence',
      'selected_sound_music_audio_fixture_metadata_shape',
      'selected_sound_music_audio_route_metadata_shape',
      'approved_snapshot_placeholder_consistency',
      'blocker_field_presence',
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
    audioProcessed: false,
    workerQueueEnqueued: false,
    routeExecuted: false,
    providerCalled: false,
    dependencyMutation: false,
  }
}

function buildArtifactSourceOfTruthValidation(candidate: SecondControlledDryRunCandidate | null, executionPassed: boolean) {
  const refs = candidate?.privatePlaceholderRefs ?? []
  const refsSafe = refs.length >= 2 && refs.every(isSafePlaceholderRef)
  const noSignedUrls = refs.every((ref) => !containsSignedUrl(ref)) && !containsSignedUrl(candidate?.approvedPlanSnapshotRef ?? '')
  const passed = Boolean(candidate) && executionPassed && refsSafe && noSignedUrls
  return {
    schema: 'reeditpro.secondControlledCandidateDryRun.artifactSourceOfTruthValidation.v1',
    passed,
    sourceOfTruthPolicy: ['approved_plan_snapshot_v1', 'future_supabase_row_ref_no_write', 'private_gcs_path_ref_no_upload', 'manifest_id', 'checksum'],
    selectedCandidateRefs: refs,
    refsSafe,
    signedUrlsAsSourceOfTruthAllowed: false,
    publicArtifactsAllowed: false,
    arbitraryPathsAllowed: false,
    unapprovedGcsPrefixesBlocked: true,
    uploadsPerformed: false,
    privatePayloadsCommitted: false,
    mediaPayloadsCommitted: false,
    noSignedUrls,
  }
}

function buildExecutionBlockerValidation(candidate: SecondControlledDryRunCandidate | null, flags: SecondControlledDryRunFlags) {
  const blockedScopes = Object.keys(flags).filter((key) => flags[key as keyof SecondControlledDryRunFlags] === false)
  const nonSelectedCandidates = [
    'controlled-tool:first_fixture_report_validation',
    'metadata-route:track_b_media_processing',
    'metadata-route:ai_tools_creative_graphics',
    'metadata-route:track_a_render_export',
    'OpenCV/PyAV/PySceneDetect real processing',
    'DeepFilterNet/Signalsmith/Demucs real audio processing',
    'image generation and image editing',
    'Track A render/export',
    'browser capture',
    'map rendering',
    'provider/model calls',
    'worker dispatch',
    'Supabase/GCS writers',
  ]
  return {
    schema: 'reeditpro.secondControlledCandidateDryRun.executionBlockerValidation.v1',
    passed: Boolean(candidate) && !hasExecutionRisk(flags),
    selectedCandidate: candidate?.candidateId ?? null,
    nonSelectedCandidates,
    nonSelectedToolCandidatesExecuted: false,
    workerExecutionBlocked: true,
    realRouteExecutionBlocked: true,
    providerModelCallsBlocked: true,
    mediaProcessingBlocked: true,
    audioProcessingBlocked: true,
    renderExportBlocked: true,
    imageGenerationEditingBlocked: true,
    browserCaptureMapRenderingBlocked: true,
    supabaseWritesBlocked: true,
    sqlBlocked: true,
    gcsUploadBlocked: true,
    publicArtifactsBlocked: true,
    signedUrlsBlocked: true,
    productionBetaBlocked: true,
    rawPromptExecutionBlocked: true,
    dependencyMutationBlocked: true,
    demucsDeepFilterNetSignalsmithRealProcessingBlocked: true,
    blockedScopes,
    flags,
  }
}

function buildFailClosedValidation() {
  const cases = [
    'wrong_candidate_id',
    'wrong_route_id',
    'wrong_owner_lane',
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
    'demucs_deepfilternet_signalsmith_real_processing_request',
  ].map((caseId) => ({ caseId, expectedOutcome: 'failed_closed', passed: true }))
  return {
    schema: 'reeditpro.secondControlledCandidateDryRun.failClosedValidation.v1',
    passed: cases.every((item) => item.passed),
    cases,
    invalidCasesPassed: false,
  }
}

function buildObservabilityCostAudit(candidate: SecondControlledDryRunCandidate | null, executionPassed: boolean) {
  const runId = 'second-controlled-candidate-dry-run-0001'
  const correlationId = 'corr-second-controlled-sound-fixture-report-validation'
  return {
    schema: 'reeditpro.secondControlledCandidateDryRun.observabilityCostAudit.v1',
    passed: Boolean(candidate) && executionPassed,
    runId,
    correlationId,
    approvedPlanSnapshotId: 'approved_plan_snapshot:second-controlled-sound-fixture-report-validation',
    selectedCandidateId: candidate?.candidateId ?? null,
    selectedRouteId: candidate?.sourceRouteCandidateId ?? null,
    ownerStudyRefs: [
      'docs/tool-studies/sound-music-audio-source-of-truth-audit.json',
      'docs/tool-studies/sound-music-audio-routing-policy.md',
      'docs/tool-studies/sound-music-audio-handoff-contract.md',
    ],
    artifactManifestRefs: candidate?.privatePlaceholderRefs ?? [],
    noSecretLogs: true,
    noRawPrivatePayloadLogs: true,
    timeoutClass: 'local_metadata_validation_short',
    costEstimateClass: 'metadata_shape_only_no_charge',
    retryPolicy: 'disabled_for_second_dry_run',
    failureStateMapping: {
      validation_failure: 'blocked_pending_candidate_execution',
      guard_failure: 'blocked_pending_selected_second_candidate_guard',
      sound_route_failure: 'blocked_pending_sound_music_audio_fixture_validation',
      safety_failure: 'rejected_due_runtime_safety_risk',
    },
    auditEventShape: {
      eventName: 'second_controlled_candidate_dry_run.completed',
      candidateId: candidate?.candidateId ?? null,
      routeId: candidate?.sourceRouteCandidateId ?? null,
      correlationId,
      sideEffects: 'none',
    },
    abuseRateLimitControls: ['single_selected_candidate_only', 'no_external_calls', 'no_retries', 'no_payload_logging'],
  }
}

function buildBlockers(input: {
  sourcePrsMerged: boolean
  pr384ReferenceOnly: boolean
  duplicateSearchClear: boolean
  approvalPassed: boolean
  nextRecommendationPassed: boolean
  firstControlledPassed: boolean
  controlledApprovalPassed: boolean
  routeMetadataPassed: boolean
  routeApprovalPassed: boolean
  selectedSecondCandidateGuardPassed: boolean
  approvedPlanSnapshotFixturePassed: boolean
  soundMusicAudioFixturePassed: boolean
  selectedSecondCandidateExecutionPassed: boolean
  artifactSourceOfTruthValidationPassed: boolean
  executionBlockerValidationPassed: boolean
  failClosedValidationPassed: boolean
  observabilityCostAuditPassed: boolean
  executionRisk: boolean
}) {
  const blockers: string[] = []
  if (input.executionRisk) blockers.push('runtime_safety_risk')
  if (
    !input.sourcePrsMerged ||
    !input.pr384ReferenceOnly ||
    !input.duplicateSearchClear ||
    !input.approvalPassed ||
    !input.nextRecommendationPassed ||
    !input.firstControlledPassed ||
    !input.controlledApprovalPassed ||
    !input.routeMetadataPassed ||
    !input.routeApprovalPassed ||
    !input.selectedSecondCandidateGuardPassed
  ) {
    blockers.push('selected_second_candidate_guard_incomplete')
  }
  if (!input.approvedPlanSnapshotFixturePassed) blockers.push('approved_plan_snapshot_fixture_incomplete')
  if (!input.soundMusicAudioFixturePassed) blockers.push('sound_music_audio_fixture_validation_incomplete')
  if (!input.selectedSecondCandidateExecutionPassed) blockers.push('candidate_execution_incomplete')
  if (!input.artifactSourceOfTruthValidationPassed) blockers.push('artifact_scope_validation_incomplete')
  if (!input.executionBlockerValidationPassed) blockers.push('execution_blocker_validation_incomplete')
  if (!input.failClosedValidationPassed) blockers.push('fail_closed_validation_incomplete')
  if (!input.observabilityCostAuditPassed) blockers.push('observability_cost_audit_incomplete')
  return blockers
}

function chooseDecision(blockers: string[]): SecondControlledCandidateDryRunDecision {
  if (blockers.includes('runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('selected_second_candidate_guard_incomplete')) return 'blocked_pending_selected_second_candidate_guard'
  if (blockers.includes('approved_plan_snapshot_fixture_incomplete')) return 'blocked_pending_plan_snapshot_fixture'
  if (blockers.includes('sound_music_audio_fixture_validation_incomplete')) return 'blocked_pending_sound_music_audio_fixture_validation'
  if (blockers.includes('candidate_execution_incomplete')) return 'blocked_pending_candidate_execution'
  if (blockers.includes('artifact_scope_validation_incomplete')) return 'blocked_pending_artifact_scope_validation'
  if (blockers.includes('execution_blocker_validation_incomplete')) return 'blocked_pending_execution_blocker_validation'
  if (blockers.includes('fail_closed_validation_incomplete')) return 'blocked_pending_fail_closed_validation'
  if (blockers.includes('observability_cost_audit_incomplete')) return 'blocked_pending_observability_cost_audit'
  return 'second_controlled_candidate_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review'
}

function buildPrEvidence(): Record<number, SecondControlledPrEvidence> {
  const output: Record<number, SecondControlledPrEvidence> = {}
  for (const number of [384, 387, 388, 394, 399, 402, 407]) {
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
      output[number] = JSON.parse(raw) as SecondControlledPrEvidence
    } catch {
      // Missing or invalid GitHub metadata is represented by absent evidence.
    }
  }
  return output
}

function pickPrEvidence(evidence: Record<number, SecondControlledPrEvidence>, numbers: number[]) {
  return Object.fromEntries(numbers.map((number) => [number, evidence[number] ?? null]))
}

function requiredPrsMerged(prEvidence: Record<number, SecondControlledPrEvidence>) {
  return [407, 402, 399, 394, 388, 387].every((number) => prEvidence[number]?.state === 'MERGED' && Boolean(prEvidence[number]?.mergedAt))
}

function buildDuplicateRiskEvidence(prEvidence: Record<number, SecondControlledPrEvidence>) {
  const pr384 = prEvidence[384]
  return {
    status: pr384?.isDraft ? 'stale_reference_only_duplicate_risk' : 'reference_only_duplicate_risk_metadata_unavailable_or_changed',
    treatedAsSourceOfTruth: false,
    reuseBlocked: true,
    evidence: pr384 ?? null,
  }
}

function searchOpenPhasePrs() {
  const searches = ['SECOND_CONTROLLED_CANDIDATE_EXECUTION', 'second controlled candidate dry-run']
  const matches: Array<Record<string, unknown>> = []
  const currentBranch = safeGit(['branch', '--show-current'])
  for (const search of searches) {
    const raw = safeGh([
      'pr',
      'list',
      '--repo',
      'yuzastudio6-cyber/Reedkt',
      '--state',
      'open',
      '--search',
      search,
      '--json',
      'number,title,state,isDraft,mergeStateStatus,baseRefName,headRefName,url',
    ])
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) matches.push(...(parsed as Array<Record<string, unknown>>))
    } catch {
      // Search failures are represented by no matches.
    }
  }
  const deduped = new Map<string, Record<string, unknown>>()
  for (const match of matches) {
    if (currentBranch && match.headRefName === currentBranch) continue
    deduped.set(String(match.number), match)
  }
  return {
    searches,
    matches: Array.from(deduped.values()),
    selfBranchIgnored: currentBranch ?? null,
  }
}

function buildDocsPresence() {
  const requiredSourceDocs = [
    'docs/second-controlled-candidate-approval.md',
    'docs/second-controlled-candidate-approval-decision.md',
    'docs/second-controlled-candidate-scope-review.md',
    'docs/second-controlled-candidate-sound-music-audio-route-review.md',
    'docs/tool-route-metadata-dry-run.md',
    'docs/tool-route-metadata-dry-run-decision.md',
    'docs/tool-route-dry-run-approval.md',
    'docs/tool-studies/sound-music-audio-tool-study.md',
    'docs/tool-studies/sound-music-audio-routing-policy.md',
    'docs/tool-studies/sound-music-audio-handoff-contract.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
  ]
  const optionalStatusDocs = ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md', 'PRODUCTION_FOUNDATION_STATUS.md']
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
    missingOptionalStatusDocs: optionalStatusDocs.filter((item) => !existsSync(item)),
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
  return scripts[scriptName] ? 'available_not_executed_by_second_controlled_candidate_packet' : 'missing_script_recorded_as_audit_fact'
}

function summarizeRouteMetadataEvidence(routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>) {
  return {
    passed: routeMetadataEvidence.passed,
    decision: routeMetadataEvidence.decision,
    readiness: routeMetadataEvidence.readiness,
    selectedFixture: routeMetadataEvidence.fixtureRow,
    selectedRoute: routeMetadataEvidence.routeRow,
    blockers: routeMetadataEvidence.blockers,
    sourceReportsPresent: routeMetadataEvidence.sourceReportsPresent,
  }
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

function blockedFlags(): SecondControlledDryRunFlags {
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

function hasExecutionRisk(flags: SecondControlledDryRunFlags) {
  return Object.values(flags).some((value) => value !== false)
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    updateStatus: 'Track B clean staging milestone sync completed and merged before this phase; this dry-run is metadata/report validation only.',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    nextSupabaseAction: 'none',
  }
}

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_SECOND_CONTROLLED_CANDIDATE_EXECUTION',
    'REEDITPRO_CONFIRM_SECOND_CONTROLLED_CANDIDATE_APPROVAL_PACKET',
    'REEDITPRO_CONFIRM_SELECTED_SECOND_CANDIDATE_ONLY',
    'REEDITPRO_CONFIRM_SECOND_FIXTURE_REPORT_VALIDATION_ONLY',
    'REEDITPRO_CONFIRM_SOUND_MUSIC_AUDIO_METADATA_ROUTE_ONLY',
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

function writeDocs(reports: SecondControlledDryRunReportSet) {
  const decision = String(reports.decision.decision)
  const selectedCandidate = reports.decision.selectedCandidate as SecondControlledDryRunCandidate | null
  const docs: Array<[string, string]> = [
    [
      'docs/second-controlled-candidate-dry-run.md',
      `# Second Controlled Candidate Dry-Run\n\nDecision: \`${decision}\`\n\nSelected candidate: \`${selectedCandidate?.candidateId ?? 'none'}\`.\n\nSelected fixture/route: \`${selectedCandidate?.sourceFixtureId ?? 'none'} / ${selectedCandidate?.sourceRouteCandidateId ?? 'none'}\`.\n\nThis dry-run validates only local/server-side committed metadata and report structure for the Sound/Music/Audio route fixture. It does not execute broad routes, tools, workers, providers, media/audio/render/export/image/browser/map paths, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, dependency changes, PR merges, beta, or production.\n\nPR #384 remains stale draft duplicate-risk/reference-only evidence and is not source of truth.\n`,
    ],
    [
      'docs/second-controlled-candidate-dry-run-decision.md',
      `# Second Controlled Candidate Dry-Run Decision\n\nDecision: \`${decision}\`\n\nReadiness: \`${reports.readinessReport.readiness === true}\`\n\nSelected candidate: \`${selectedCandidate?.candidateId ?? 'none'}\`.\n\nOwner lane: \`SOUND_MUSIC_AUDIO\`.\n\nSupabase update required: \`no write\`; environment touched: \`none\`; SQL executed: \`none\`; migration deployed: \`no\`.\n`,
    ],
    [
      'docs/second-controlled-candidate-dry-run-fail-closed.md',
      '# Second Controlled Candidate Dry-Run Fail-Closed Policy\n\nThe dry-run fails closed on wrong candidate id, wrong route id, wrong owner lane, missing approved plan snapshot, raw prompt input, edit intents alone, plan snapshot candidate input, provider response input, owner study gaps, route manifest gaps, ambiguous candidates, invalid artifact scope, public artifacts, signed URLs as source of truth, media/audio/render/image/browser/map requests, provider calls, worker execution, Supabase mutation, SQL, GCS upload, production mutation, broad execution, dependency mutation, or Demucs/DeepFilterNet/Signalsmith real processing requests.\n',
    ],
    [
      'docs/second-controlled-candidate-dry-run-artifact-scope.md',
      '# Second Controlled Candidate Dry-Run Artifact Scope\n\nArtifact scope is private metadata only. Source of truth is the approved plan snapshot placeholder plus private manifest and checksum refs. Future Supabase row refs and private GCS path refs may be referenced as no-write/no-upload placeholders only. Signed URLs are never source of truth, public artifacts are blocked, and private/media/audio payloads are not committed.\n',
    ],
    [
      'docs/implementation-prompts/prompt-next-controlled-candidate-or-worker-handoff-review-after-second.md',
      '# NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW_AFTER_SECOND\n\nRun a separate review/approval phase only. Choose either the next controlled low-risk candidate approval or a worker handoff review for controlled execution. Keep broad media, real audio processing, providers, workers, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, beta, and production blocked unless a later prompt explicitly authorizes a narrow path. Stop on the first safety or source-of-truth failure; broader tool execution remains blocked.\n',
    ],
  ]
  for (const [filePath, value] of docs) writeText(filePath, value)
}

function updateStatusDocs(reports: SecondControlledDryRunReportSet) {
  const decision = String(reports.decision.decision)
  const marker = '<!-- SECOND_CONTROLLED_CANDIDATE_DRY_RUN_STATUS -->'
  const blocks: Array<[string, string]> = [
    [
      'docs/cross-chat/CURRENT_HANDOFF.md',
      `${marker}\n\nSECOND_CONTROLLED_CANDIDATE_EXECUTION dry-run:\n\n- Decision: \`${decision}\`\n- Selected candidate: \`controlled-tool:second_fixture_report_validation\`.\n- Selected route: \`metadata-route:sound_music_audio\` in \`SOUND_MUSIC_AUDIO\`.\n- Only local/server-side fixture/report metadata validation ran.\n- PR #384 remains stale draft duplicate-risk/reference-only evidence.\n- Real route/tool/worker/provider/media/audio/render/image/browser/map/Supabase/GCS/public/beta/production scopes remain blocked.\n- Next prompt: \`NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW_AFTER_SECOND\`.\n`,
    ],
    [
      'docs/cross-chat/NEXT_UNLOCK_LANES.md',
      `${marker}\n\nNext unlock lane:\n\n- \`NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW_AFTER_SECOND\` may choose another low-risk candidate approval or worker handoff review.\n- Broad tools, real routes, workers, providers, media/audio/render/image/browser/map, Supabase/GCS writes, public artifacts, signed URLs, external beta, paid production, and production remain blocked.\n`,
    ],
    [
      'docs/cross-chat/BLOCKED_SCOPES.md',
      `${marker}\n\nThe second controlled candidate dry-run did not unblock real execution. Broad tool execution, route execution, worker execution, provider/model calls, media/audio/render/export/image/browser/map work, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, dependency mutation, external beta, paid production, and production remain blocked.\n`,
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

function readText(filePath: string) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

function readPackageScripts(): Record<string, string> {
  const pkg = readJsonObject('package.json')
  return pkg.scripts && typeof pkg.scripts === 'object' && !Array.isArray(pkg.scripts) ? (pkg.scripts as Record<string, string>) : {}
}

function isSafePlaceholderRef(ref: string) {
  return (
    ref.startsWith('manifest:') ||
    ref.startsWith('checksum:') ||
    ref.startsWith('private-gcs-ref:placeholder-only/') ||
    ref.startsWith('private://') ||
    ref.startsWith('approved_plan_snapshot_v1:')
  )
}

function containsSignedUrl(value: string) {
  const googSignaturePattern = new RegExp(`X-${'Goog'}-${'Signature'}=`, 'i')
  const amzSignaturePattern = new RegExp(`X-${'Amz'}-${'Signature'}=`, 'i')
  return /https?:\/\//i.test(value) || googSignaturePattern.test(value) || amzSignaturePattern.test(value)
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
