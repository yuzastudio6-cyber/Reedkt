import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  NextControlledBooleanFlags,
  NextControlledCandidate,
  NextControlledCandidateDecision,
  NextControlledPrEvidence,
  NextControlledReportSet,
} from './next-controlled-review-types'

export const NEXT_CONTROLLED_REVIEW_REPORT_DIR = 'docs/activation-next-controlled-candidate-or-worker-handoff-reports'
export const RECOMMENDED_SECOND_CONTROLLED_CANDIDATE = 'controlled-tool:second_fixture_report_validation'
export const RECOMMENDED_SECOND_SOURCE_FIXTURE = 'valid_sound_music_audio_metadata_route_candidate'
export const RECOMMENDED_SECOND_ROUTE_CANDIDATE = 'metadata-route:sound_music_audio'

const FIRST_CONTROLLED_REPORT_DIR = 'docs/activation-first-controlled-tool-execution-dry-run-reports'
const CONTROLLED_APPROVAL_REPORT_DIR = 'docs/activation-controlled-tool-execution-approval-reports'
const TOOL_ROUTE_METADATA_REPORT_DIR = 'docs/activation-tool-route-metadata-dry-run-reports'
const TOOL_ROUTE_APPROVAL_REPORT_DIR = 'docs/activation-tool-route-dry-run-approval-reports'

const reportPaths = {
  sourceOfTruthAudit: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/source_of_truth_audit.json`,
  preReviewRevalidation: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/pre_review_revalidation_report.json`,
  evidenceInventory: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/evidence_inventory.json`,
  candidateInventory: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/controlled_candidate_inventory.json`,
  riskRanking: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/next_candidate_risk_ranking.json`,
  workerHandoffReadinessReview: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/worker_handoff_readiness_review.json`,
  artifactSourceOfTruthReview: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/artifact_source_of_truth_review.json`,
  observabilityCostAuditReview: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/observability_cost_audit_review.json`,
  decision: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/next_controlled_candidate_or_worker_handoff_decision.json`,
  blockerReport: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/next_controlled_candidate_or_worker_handoff_blocker_report.json`,
  readinessReport: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/next_controlled_candidate_or_worker_handoff_readiness_report.json`,
  privateArtifactManifest: `${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/next_controlled_candidate_or_worker_handoff_private_artifact_manifest.json`,
}

const docPaths = [
  'docs/next-controlled-candidate-or-worker-handoff-review.md',
  'docs/next-controlled-candidate-inventory.md',
  'docs/next-controlled-candidate-risk-ranking.md',
  'docs/worker-handoff-readiness-after-first-controlled-tool.md',
  'docs/next-controlled-candidate-or-worker-handoff-decision.md',
  'docs/implementation-prompts/prompt-second-controlled-tool-candidate-approval.md',
]

export function buildNextControlledCandidateOrWorkerHandoffPlan() {
  return {
    phase: 'NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW',
    packet: 'next controlled candidate or worker handoff review',
    branch: 'codex/rp-next-controlled-candidate-or-worker-handoff-review',
    baseBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    mode: 'metadata_docs_reports_only',
    expectedDecision: 'recommended_next_controlled_candidate_approval',
    recommendedNextCandidate: RECOMMENDED_SECOND_CONTROLLED_CANDIDATE,
    recommendedSourceFixture: RECOMMENDED_SECOND_SOURCE_FIXTURE,
    recommendedRouteCandidate: RECOMMENDED_SECOND_ROUTE_CANDIDATE,
    requiredConfirmations: requiredConfirmations(),
    forbiddenScopes: Object.entries(blockedFlags())
      .filter(([, value]) => value === false)
      .map(([name]) => name),
    reports: Object.values(reportPaths),
    docs: docPaths,
  }
}

export function buildNextControlledCandidateOrWorkerHandoffReports(): NextControlledReportSet {
  const createdAt = new Date().toISOString()
  const flags = blockedFlags()
  const prEvidence = buildPrEvidence()
  const firstControlledEvidence = readFirstControlledEvidence()
  const controlledApprovalEvidence = readControlledApprovalEvidence()
  const routeMetadataEvidence = readRouteMetadataEvidence()
  const routeApprovalEvidence = readRouteApprovalEvidence()
  const docsPresence = buildDocsPresence()
  const duplicateRisk = buildDuplicateRiskEvidence(prEvidence)
  const candidateRows = buildCandidateRows(routeMetadataEvidence, flags)
  const recommendedCandidate = candidateRows.find((row) => row.candidateId === RECOMMENDED_SECOND_CONTROLLED_CANDIDATE) ?? null
  const riskRanking = buildRiskRanking(candidateRows, recommendedCandidate)
  const workerHandoffReadinessReview = buildWorkerHandoffReadinessReview(recommendedCandidate, docsPresence, flags, createdAt)
  const artifactSourceOfTruthReview = buildArtifactSourceOfTruthReview(recommendedCandidate, flags, createdAt)
  const observabilityCostAuditReview = buildObservabilityCostAuditReview(recommendedCandidate, createdAt)
  const executionRisk = hasExecutionRisk(flags)
  const blockers = buildBlockers({
    firstControlledPassed: firstControlledEvidence.passed,
    controlledApprovalPassed: controlledApprovalEvidence.passed,
    routeMetadataPassed: routeMetadataEvidence.passed,
    routeApprovalPassed: routeApprovalEvidence.passed,
    recommendedCandidate,
    workerHandoffPassed: workerHandoffReadinessReview.passed === true,
    artifactReviewPassed: artifactSourceOfTruthReview.passed === true,
    observabilityPassed: observabilityCostAuditReview.passed === true,
    executionRisk,
    pr384ReferenceOnly: duplicateRisk.treatedAsSourceOfTruth === false,
  })
  const decision = chooseDecision(blockers, recommendedCandidate)
  const readiness = decision === 'recommended_next_controlled_candidate_approval'

  const sourceOfTruthAudit = {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.sourceOfTruthAudit.v1',
    createdAt,
    sourceBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    expectedSourceSha: '153d0cf09a9b71681b5889785dbc6e851bb3c8ba',
    currentBranch: safeGit(['branch', '--show-current']) ?? null,
    currentSha: safeGit(['rev-parse', 'HEAD']) ?? null,
    pr399: prEvidence[399] ?? null,
    pr394: prEvidence[394] ?? null,
    pr388: prEvidence[388] ?? null,
    pr387: prEvidence[387] ?? null,
    pr384DuplicateRisk: duplicateRisk,
    duplicatePhasePrSearch: searchOpenPhasePrs(),
    docsPresence,
    flags,
    supabaseClassification: supabaseClassification(),
    decision,
  }

  const preReviewRevalidation = {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.preReviewRevalidation.v1',
    createdAt,
    pr399Merged: prEvidence[399]?.state === 'MERGED' && Boolean(prEvidence[399]?.mergedAt),
    pr394Merged: prEvidence[394]?.state === 'MERGED' && Boolean(prEvidence[394]?.mergedAt),
    pr388Merged: prEvidence[388]?.state === 'MERGED' && Boolean(prEvidence[388]?.mergedAt),
    pr387Merged: prEvidence[387]?.state === 'MERGED' && Boolean(prEvidence[387]?.mergedAt),
    pr384ReferenceOnly: duplicateRisk.treatedAsSourceOfTruth === false,
    firstControlledEvidence,
    controlledApprovalEvidence,
    routeMetadataEvidence: summarizeEvidence(routeMetadataEvidence),
    routeApprovalEvidence,
    optionalDependentScripts: docsPresence.dependentReportScripts,
    missingOptionalEvidenceRecordedAsAuditFacts: docsPresence.missingEvidenceDirectories,
    packageLockChanged: packageLockChanged(),
    blockedScopesPreserved: !executionRisk,
  }

  const evidenceInventory = {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.evidenceInventory.v1',
    createdAt,
    pr399FirstControlledDryRunPassed: firstControlledEvidence.passed,
    alreadyExecutedCandidate: 'controlled-tool:first_fixture_report_validation',
    pr394ControlledApprovalPassed: controlledApprovalEvidence.passed,
    pr388RouteMetadataDryRunPassed: routeMetadataEvidence.passed,
    pr387RouteDryRunApprovalPassed: routeApprovalEvidence.passed,
    toolStudySourceOfTruthStatus: docsPresence.toolStudySourceOfTruthStatus,
    workerNoopEvidence: docsPresence.dependentReportScripts['activation:worker-runtime-noop-dry-run:report'],
    planSnapshotDryRunEvidence: docsPresence.dependentReportScripts['activation:model-orchestration-plan-snapshot-dry-run:report'],
    routeCapabilityManifestStatus: docsPresence.routeCapabilityManifestStatus,
    supabaseTrackBBackfillEvidence: docsPresence.dependentReportScripts['activation:supabase-trackb-clean-staging-backfill:report'],
    publicArtifactSignedUrlPolicyStatus: 'blocked_signed_urls_not_source_of_truth',
    secretRefs: secretRefs(),
    flags,
  }

  const candidateInventory = {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.candidateInventory.v1',
    createdAt,
    alreadyExecutedCandidate: 'controlled-tool:first_fixture_report_validation',
    recommendedNextCandidate: recommendedCandidate,
    rows: candidateRows,
  }

  const decisionReport = {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.decision.v1',
    createdAt,
    decision,
    readiness,
    recommendedNextCandidate: readiness ? recommendedCandidate : null,
    nextPrompt:
      decision === 'recommended_next_controlled_candidate_approval'
        ? 'SECOND_CONTROLLED_TOOL_CANDIDATE_APPROVAL'
        : 'WORKER_HANDOFF_REVIEW_BEFORE_NEXT_CONTROLLED_CANDIDATE',
    blockers,
    realToolsExecuted: false,
    routesExecuted: false,
    workersExecuted: false,
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
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.blockerReport.v1',
    createdAt,
    decision,
    blockers,
    activeRuntimeBlockersPreserved: true,
    workerExecutionStillBlocked: true,
    secondCandidateApprovalStillFutureOnly: true,
    staleDuplicatePr: duplicateRisk,
  }

  const readinessReport = {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.readinessReport.v1',
    createdAt,
    readiness,
    decision,
    firstControlledDryRunPassed: firstControlledEvidence.passed,
    controlledApprovalPassed: controlledApprovalEvidence.passed,
    routeMetadataDryRunPassed: routeMetadataEvidence.passed,
    routeApprovalPassed: routeApprovalEvidence.passed,
    recommendedCandidateSafe: recommendedCandidate?.approvedAsNextCandidate === true,
    workerHandoffReviewPassed: workerHandoffReadinessReview.passed === true,
    artifactSourceOfTruthReviewPassed: artifactSourceOfTruthReview.passed === true,
    observabilityCostAuditReviewPassed: observabilityCostAuditReview.passed === true,
    runtimeScopesBlocked: !executionRisk,
  }

  const privateArtifactManifest = {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.privateArtifactManifest.v1',
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
    preReviewRevalidation,
    evidenceInventory,
    candidateInventory,
    riskRanking,
    workerHandoffReadinessReview,
    artifactSourceOfTruthReview,
    observabilityCostAuditReview,
    decision: decisionReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export function summarizeNextControlledCandidateOrWorkerHandoffReview(reports = buildNextControlledCandidateOrWorkerHandoffReports()): string {
  const blockers = (reports.blockerReport.blockers as string[]) ?? []
  const candidate = reports.decision.recommendedNextCandidate as NextControlledCandidate | null
  return [
    'Next controlled candidate or worker handoff review',
    `Decision: ${String(reports.decision.decision)}`,
    `Readiness: ${reports.readinessReport.readiness === true ? 'ready for second controlled candidate approval packet' : 'blocked'}`,
    `Recommended next candidate: ${candidate?.candidateId ?? 'none'}`,
    `Recommended fixture: ${candidate?.sourceFixtureId ?? 'none'}`,
    `Recommended route candidate: ${candidate?.sourceRouteCandidateId ?? 'none'}`,
    'Worker handoff: reviewed; not required for the recommended local/server-only metadata candidate',
    'Route/tool/worker/provider/media/Supabase/GCS/public/beta/production scopes: blocked',
    'Supabase update required: no write; environment touched: none; SQL executed: none; migration deployed: no',
    'Blockers:',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function writeNextControlledCandidateOrWorkerHandoffArtifacts() {
  const reports = buildNextControlledCandidateOrWorkerHandoffReports()
  mkdirSync(NEXT_CONTROLLED_REVIEW_REPORT_DIR, { recursive: true })
  for (const [key, filePath] of Object.entries(reportPaths)) {
    writeJson(filePath, reports[key as keyof NextControlledReportSet])
  }
  writeDocs(reports)
  updateStatusDocs(reports)
  return reports
}

function readFirstControlledEvidence() {
  const decision = readJsonObject(`${FIRST_CONTROLLED_REPORT_DIR}/first_controlled_tool_execution_decision.json`)
  const readiness = readJsonObject(`${FIRST_CONTROLLED_REPORT_DIR}/first_controlled_tool_execution_readiness_report.json`)
  const selectedCandidate = decision.selectedCandidate as Record<string, unknown> | null
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const passed =
    decision.decision === 'first_controlled_tool_execution_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review' &&
    decision.readiness === true &&
    readiness.readiness === true &&
    selectedCandidate?.candidateId === 'controlled-tool:first_fixture_report_validation' &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    selectedCandidate,
    blockers,
    sourceReportsPresent: Boolean(decision.decision) && Boolean(readiness.schema),
  }
}

function readControlledApprovalEvidence() {
  const decision = readJsonObject(`${CONTROLLED_APPROVAL_REPORT_DIR}/controlled_tool_execution_approval_decision.json`)
  const readiness = readJsonObject(`${CONTROLLED_APPROVAL_REPORT_DIR}/controlled_tool_execution_approval_readiness_report.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const passed =
    decision.decision === 'approved_for_future_first_controlled_tool_execution_dry_run' &&
    decision.approvedForFutureFirstControlledToolExecutionDryRun === true &&
    readiness.readiness === true &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    selectedFirstCandidate: summarizeCandidate(decision.selectedFirstCandidate),
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
  const fixtures = readJsonObject(`${TOOL_ROUTE_APPROVAL_REPORT_DIR}/tool_route_synthetic_approved_plan_snapshot_fixtures.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const resolutionRows = Array.isArray(metadataResolution.rows) ? (metadataResolution.rows as Array<Record<string, unknown>>) : []
  const fixtureRows = Array.isArray(fixtureValidation.rows) ? (fixtureValidation.rows as Array<Record<string, unknown>>) : []
  const approvedFixtures = Array.isArray(fixtures.fixtures) ? (fixtures.fixtures as Array<Record<string, unknown>>) : []
  const recommendedResolution = resolutionRows.find(
    (row) => row.fixtureId === RECOMMENDED_SECOND_SOURCE_FIXTURE && row.routeCandidateId === RECOMMENDED_SECOND_ROUTE_CANDIDATE && row.passed === true
  )
  const recommendedFixture = approvedFixtures.find((row) => row.fixtureId === RECOMMENDED_SECOND_SOURCE_FIXTURE)
  const recommendedValidation = fixtureRows.find((row) => row.fixtureId === RECOMMENDED_SECOND_SOURCE_FIXTURE)
  const passed =
    decision.decision === 'tool_route_metadata_dry_run_passed_ready_for_controlled_tool_execution_approval' &&
    decision.readiness === true &&
    readiness.readiness === true &&
    fixtureValidation.passed === true &&
    metadataResolution.passed === true &&
    artifactScope.passed === true &&
    failClosed.passed === true &&
    observability.passed === true &&
    Boolean(recommendedResolution) &&
    Boolean(recommendedFixture) &&
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
    approvedFixtures,
    recommendedResolution,
    recommendedFixture,
    recommendedValidation,
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

function buildCandidateRows(routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>, flags: NextControlledBooleanFlags): NextControlledCandidate[] {
  const soundSafe = Boolean(routeMetadataEvidence.recommendedResolution) && Boolean(routeMetadataEvidence.recommendedFixture) && !hasExecutionRisk(flags)
  return [
    {
      candidateId: RECOMMENDED_SECOND_CONTROLLED_CANDIDATE,
      candidateClass: 'fixture_report_validation_route_variant',
      ownerLane: 'SOUND_MUSIC_AUDIO',
      evidenceSource: 'docs/activation-tool-route-dry-run-approval-reports/tool_route_synthetic_approved_plan_snapshot_fixtures.json',
      expectedInput: 'approved_plan_snapshot_v1 placeholder plus private manifest/checksum refs',
      expectedOutput: 'metadata-only validation report for sound/music/audio route fixture',
      sideEffects: [],
      requiresWorker: false,
      requiresSupabase: false,
      requiresGcs: false,
      requiresProvider: false,
      requiresMedia: false,
      requiresPublicArtifact: false,
      routeCapabilityManifestSupport: 'metadata-route:sound_music_audio present in route metadata dry-run resolution',
      ownerStudyCoverage: 'SOUND_MUSIC_AUDIO TOOL-STUDY-0 diagnostics passed on merged source branch',
      riskClass: 'lowest',
      approvedAsNextCandidate: soundSafe,
      reason: soundSafe
        ? 'Next unexecuted owner-study metadata fixture after Track B; local/server-only and side-effect-free.'
        : 'Blocked until route metadata reports prove the sound fixture remains safe.',
      sourceFixtureId: RECOMMENDED_SECOND_SOURCE_FIXTURE,
      sourceRouteCandidateId: RECOMMENDED_SECOND_ROUTE_CANDIDATE,
    },
    {
      candidateId: 'controlled-tool:ai_creative_graphics_fixture_report_validation',
      candidateClass: 'fixture_report_validation_route_variant',
      ownerLane: 'AI_TOOLS_CREATIVE_GRAPHICS',
      evidenceSource: 'tool-route approved synthetic fixture set',
      expectedInput: 'approved_plan_snapshot_v1 placeholder plus private refs',
      expectedOutput: 'metadata-only validation report for creative graphics route fixture',
      sideEffects: [],
      requiresWorker: false,
      requiresSupabase: false,
      requiresGcs: false,
      requiresProvider: false,
      requiresMedia: false,
      requiresPublicArtifact: false,
      routeCapabilityManifestSupport: 'metadata-route:ai_tools_creative_graphics present',
      ownerStudyCoverage: 'AI_TOOLS_CREATIVE_GRAPHICS TOOL-STUDY-0 diagnostics passed',
      riskClass: 'low',
      approvedAsNextCandidate: false,
      reason: 'Safe-looking but lower priority than the next sequential Sound/Music/Audio fixture.',
      sourceFixtureId: 'valid_ai_creative_graphics_metadata_route_candidate',
      sourceRouteCandidateId: 'metadata-route:ai_tools_creative_graphics',
    },
    {
      candidateId: 'controlled-tool:track_a_render_export_fixture_report_validation',
      candidateClass: 'fixture_report_validation_route_variant',
      ownerLane: 'TRACK_A_RENDER_EXPORT',
      evidenceSource: 'tool-route approved synthetic fixture set',
      expectedInput: 'approved_plan_snapshot_v1 placeholder plus private refs',
      expectedOutput: 'metadata-only validation report for Track A render/export route fixture',
      sideEffects: [],
      requiresWorker: false,
      requiresSupabase: false,
      requiresGcs: false,
      requiresProvider: false,
      requiresMedia: false,
      requiresPublicArtifact: false,
      routeCapabilityManifestSupport: 'metadata-route:track_a_render_export present',
      ownerStudyCoverage: 'TRACK_A_RENDER_EXPORT TOOL-STUDY-0 diagnostics passed',
      riskClass: 'low',
      approvedAsNextCandidate: false,
      reason: 'Safe-looking but render/export ownership should stay behind Sound and creative graphics fixture reviews.',
      sourceFixtureId: 'valid_track_a_render_export_metadata_route_candidate',
      sourceRouteCandidateId: 'metadata-route:track_a_render_export',
    },
    {
      candidateId: 'controlled-tool:route_manifest_validation_route',
      candidateClass: 'route_manifest_validation_route',
      ownerLane: 'TOOL_ROUTE_EXECUTION',
      evidenceSource: 'merged route metadata dry-run reports',
      expectedInput: 'committed route manifest/report metadata',
      expectedOutput: 'read-only route manifest consistency report',
      sideEffects: [],
      requiresWorker: false,
      requiresSupabase: false,
      requiresGcs: false,
      requiresProvider: false,
      requiresMedia: false,
      requiresPublicArtifact: false,
      routeCapabilityManifestSupport: 'partial: local dedicated Track B route manifest activation directory is absent on this branch',
      ownerStudyCoverage: 'TOOL-STUDY-0 source-of-truth evidence present',
      riskClass: 'medium',
      approvedAsNextCandidate: false,
      reason: 'Useful review path, but less direct than the already approved synthetic fixture set.',
    },
    {
      candidateId: 'controlled-tool:capability_manifest_validation_route',
      candidateClass: 'capability_manifest_validation_route',
      ownerLane: 'TOOL_ROUTE_EXECUTION',
      evidenceSource: 'owner-study capability docs and route metadata reports',
      expectedInput: 'committed capability metadata only',
      expectedOutput: 'read-only capability coverage report',
      sideEffects: [],
      requiresWorker: false,
      requiresSupabase: false,
      requiresGcs: false,
      requiresProvider: false,
      requiresMedia: false,
      requiresPublicArtifact: false,
      routeCapabilityManifestSupport: 'partial: local dedicated capability manifest activation directory is absent on this branch',
      ownerStudyCoverage: 'owner studies present',
      riskClass: 'medium',
      approvedAsNextCandidate: false,
      reason: 'Keep as a follow-up review candidate after the remaining fixture/report validation variants.',
    },
    {
      candidateId: 'controlled-tool:cost_capacity_estimator_route',
      candidateClass: 'cost_capacity_estimator_route',
      ownerLane: 'OBSERVABILITY_AUDIT_COST',
      evidenceSource: 'route metadata costCapacityClass fields',
      expectedInput: 'metadata estimate classes only',
      expectedOutput: 'cost/capacity review metadata',
      sideEffects: [],
      requiresWorker: false,
      requiresSupabase: false,
      requiresGcs: false,
      requiresProvider: false,
      requiresMedia: false,
      requiresPublicArtifact: false,
      routeCapabilityManifestSupport: 'metadata_estimate_only classes present',
      ownerStudyCoverage: 'owner-study diagnostics present',
      riskClass: 'low',
      approvedAsNextCandidate: false,
      reason: 'Side-effect-free, but it should follow a concrete second controlled candidate approval.',
    },
    {
      candidateId: 'controlled-tool:read_only_metadata_classification_route',
      candidateClass: 'read_only_metadata_classification_route',
      ownerLane: 'CONTROLLED_TOOL_EXECUTION',
      evidenceSource: 'committed report/docs metadata',
      expectedInput: 'safe metadata only',
      expectedOutput: 'classification labels and blockers',
      sideEffects: [],
      requiresWorker: false,
      requiresSupabase: false,
      requiresGcs: false,
      requiresProvider: false,
      requiresMedia: false,
      requiresPublicArtifact: false,
      routeCapabilityManifestSupport: 'not route-specific',
      ownerStudyCoverage: 'cross-chat owner matrix and blocked-scope docs',
      riskClass: 'low',
      approvedAsNextCandidate: false,
      reason: 'Safe but less valuable than exercising another already-approved route fixture.',
    },
    {
      candidateId: 'controlled-tool:source_of_truth_consistency_validation_route',
      candidateClass: 'source_of_truth_consistency_validation_route',
      ownerLane: 'GITHUB_SOURCE_OF_TRUTH_COORDINATION',
      evidenceSource: 'merged PR/source-of-truth docs',
      expectedInput: 'GitHub/source branch metadata and committed reports',
      expectedOutput: 'source-of-truth consistency report',
      sideEffects: [],
      requiresWorker: false,
      requiresSupabase: false,
      requiresGcs: false,
      requiresProvider: false,
      requiresMedia: false,
      requiresPublicArtifact: false,
      routeCapabilityManifestSupport: 'not route-specific',
      ownerStudyCoverage: 'source branch contains merged controlled-tool stack',
      riskClass: 'low',
      approvedAsNextCandidate: false,
      reason: 'Safe review route, but does not advance controlled candidate coverage as directly as the Sound fixture.',
    },
  ]
}

function buildRiskRanking(candidateRows: NextControlledCandidate[], recommendedCandidate: NextControlledCandidate | null) {
  return {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.riskRanking.v1',
    rankedLowestRiskFirst: [...candidateRows].sort((a, b) => riskWeight(a.riskClass) - riskWeight(b.riskClass)),
    recommendedCandidateId: recommendedCandidate?.candidateId ?? null,
    rankingPolicy:
      'Prefer local/server-only metadata candidates already present in approved synthetic fixture reports. Block anything requiring workers, providers, Supabase/GCS writes, public artifacts, signed URLs, media/runtime execution, raw prompts, beta, or production.',
    broadRuntimeCandidatesBlocked: true,
  }
}

function buildWorkerHandoffReadinessReview(
  recommendedCandidate: NextControlledCandidate | null,
  docsPresence: ReturnType<typeof buildDocsPresence>,
  flags: NextControlledBooleanFlags,
  createdAt: string
) {
  const candidateAvailable = recommendedCandidate?.approvedAsNextCandidate === true
  return {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.workerHandoffReadinessReview.v1',
    createdAt,
    passed: candidateAvailable && !hasExecutionRisk(flags),
    anotherInProcessLocalServerOnlyCandidateAvailable: candidateAvailable,
    nextMeaningfulStepRequiresWorkerExecution: false,
    workerExecutionApprovedThisPhase: false,
    workerOwnedApprovalRequiredBeforeRealWorkerExecution: true,
    approvedPlanSnapshotHandoffRequirementsSufficientForMetadataCandidate: true,
    futureWorkerHandoffRequires: [
      'approved_plan_snapshot_v1 ref',
      'idempotency key',
      'correlation id',
      'private artifact manifest refs',
      'checksum refs',
      'cost/audit metadata',
      'explicit no-op or worker-owned dry-run approval',
    ],
    workerMustReject: ['raw prompts', 'provider responses', 'candidate snapshots', 'public artifacts', 'signed URLs as source of truth'],
    optionalWorkerNoopEvidence: docsPresence.dependentReportScripts['activation:worker-runtime-noop-dry-run:report'],
    flags,
  }
}

function buildArtifactSourceOfTruthReview(recommendedCandidate: NextControlledCandidate | null, flags: NextControlledBooleanFlags, createdAt: string) {
  return {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.artifactSourceOfTruthReview.v1',
    createdAt,
    passed: recommendedCandidate?.approvedAsNextCandidate === true && !hasExecutionRisk(flags),
    recommendedCandidateId: recommendedCandidate?.candidateId ?? null,
    sourceOfTruthPolicy: ['approved_plan_snapshot_v1', 'future_supabase_row_ref_no_write', 'private_gcs_path_ref_no_upload', 'manifest_id', 'checksum'],
    signedUrlsAsSourceOfTruthAllowed: false,
    publicArtifactsAllowed: false,
    arbitraryPathsAllowed: false,
    unapprovedGcsPrefixesBlocked: true,
    uploadsPerformed: false,
    supabaseWritesPerformed: false,
    privatePayloadsCommitted: false,
    noSignedUrls: true,
    flags,
  }
}

function buildObservabilityCostAuditReview(recommendedCandidate: NextControlledCandidate | null, createdAt: string) {
  return {
    schema: 'reeditpro.nextControlledCandidateOrWorkerHandoff.observabilityCostAuditReview.v1',
    createdAt,
    passed: Boolean(recommendedCandidate?.approvedAsNextCandidate),
    recommendedCandidateId: recommendedCandidate?.candidateId ?? null,
    candidateAuditRequirements: [
      'correlation id',
      'approved plan snapshot id',
      'route candidate id',
      'selected candidate id',
      'owner-study refs',
      'artifact manifest refs',
      'blocker/fail-closed outcome',
    ],
    workerHandoffAuditRequirements: ['idempotency key', 'worker dry-run mode', 'queue/job/sidecar approval ref before worker execution'],
    noSecretLogs: true,
    timeoutClass: 'metadata_validation_short_timeout',
    costEstimateClass: 'metadata_only_no_provider_or_worker_cost',
    retryPolicy: 'single retry only for future metadata read failure; no retry of runtime execution',
    failureStateMapping: {
      missingEvidence: 'blocked_pending_route_manifest_evidence',
      unsafeCandidate: 'rejected_due_runtime_safety_risk',
      artifactPolicyGap: 'blocked_pending_artifact_scope_policy',
      auditGap: 'blocked_pending_observability_cost_audit',
    },
    abuseRateLimitControls: ['no provider calls', 'no worker enqueue', 'no uploaded media', 'no public artifacts', 'no signed URL delivery'],
  }
}

function buildBlockers(input: {
  firstControlledPassed: boolean
  controlledApprovalPassed: boolean
  routeMetadataPassed: boolean
  routeApprovalPassed: boolean
  recommendedCandidate: NextControlledCandidate | null
  workerHandoffPassed: boolean
  artifactReviewPassed: boolean
  observabilityPassed: boolean
  executionRisk: boolean
  pr384ReferenceOnly: boolean
}) {
  const blockers: string[] = []
  if (input.executionRisk) blockers.push('runtime_safety_risk')
  if (!input.pr384ReferenceOnly) blockers.push('pr384_duplicate_risk_not_reference_only')
  if (!input.firstControlledPassed) blockers.push('pr399_first_controlled_dry_run_evidence_missing_or_blocked')
  if (!input.controlledApprovalPassed) blockers.push('pr394_controlled_approval_evidence_missing_or_blocked')
  if (!input.routeMetadataPassed) blockers.push('pr388_route_metadata_dry_run_evidence_missing_or_blocked')
  if (!input.routeApprovalPassed) blockers.push('pr387_route_approval_evidence_missing_or_blocked')
  if (!input.recommendedCandidate?.approvedAsNextCandidate) blockers.push('safe_second_controlled_candidate_missing')
  if (!input.workerHandoffPassed) blockers.push('worker_handoff_readiness_review_incomplete')
  if (!input.artifactReviewPassed) blockers.push('artifact_source_of_truth_review_incomplete')
  if (!input.observabilityPassed) blockers.push('observability_cost_audit_review_incomplete')
  return blockers
}

function chooseDecision(blockers: string[], recommendedCandidate: NextControlledCandidate | null): NextControlledCandidateDecision {
  if (blockers.includes('runtime_safety_risk') || blockers.includes('pr384_duplicate_risk_not_reference_only')) return 'rejected_due_runtime_safety_risk'
  if (blockers.some((blocker) => blocker.includes('route') || blocker.includes('pr388') || blocker.includes('pr387'))) return 'blocked_pending_route_manifest_evidence'
  if (blockers.includes('safe_second_controlled_candidate_missing')) return 'recommended_worker_handoff_review_before_next_candidate'
  if (blockers.includes('worker_handoff_readiness_review_incomplete')) return 'blocked_pending_worker_handoff_requirements'
  if (blockers.includes('artifact_source_of_truth_review_incomplete')) return 'blocked_pending_artifact_scope_policy'
  if (blockers.includes('observability_cost_audit_review_incomplete')) return 'blocked_pending_observability_cost_audit'
  if (blockers.length) return 'blocked_pending_candidate_inventory'
  if (recommendedCandidate?.approvedAsNextCandidate) return 'recommended_next_controlled_candidate_approval'
  return 'recommended_worker_handoff_review_before_next_candidate'
}

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW',
    'REEDITPRO_CONFIRM_FIRST_CONTROLLED_TOOL_EXECUTION_DRY_RUN_PASSED',
    'REEDITPRO_CONFIRM_NEXT_CONTROLLED_CANDIDATE_INVENTORY',
    'REEDITPRO_CONFIRM_WORKER_HANDOFF_READINESS_REVIEW',
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

function writeDocs(reports: NextControlledReportSet) {
  const decision = String(reports.decision.decision)
  const candidate = reports.decision.recommendedNextCandidate as NextControlledCandidate | null
  const docs: Array<[string, string]> = [
    [
      'docs/next-controlled-candidate-or-worker-handoff-review.md',
      `# Next Controlled Candidate Or Worker Handoff Review\n\nDecision: \`${decision}\`.\n\nRecommended next candidate: \`${candidate?.candidateId ?? 'none'}\`.\n\nThis review chooses the next safe path after the first controlled tool dry-run. It recommends a separate second controlled candidate approval packet for the Sound/Music/Audio metadata fixture only. This phase does not approve or execute the second candidate, workers, routes, tools, providers, media/audio/render/image/browser/map paths, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, dependency changes, PR merges, beta, or production.\n\nPR #384 remains stale draft duplicate-risk/reference-only evidence and is not source of truth.\n`,
    ],
    [
      'docs/next-controlled-candidate-inventory.md',
      `# Next Controlled Candidate Inventory\n\nRecommended candidate: \`${candidate?.candidateId ?? 'none'}\` using fixture \`${candidate?.sourceFixtureId ?? 'none'}\` and route \`${candidate?.sourceRouteCandidateId ?? 'none'}\`.\n\nThe inventory ranks local/server-only metadata candidates before any path that needs workers, providers, Supabase/GCS writes, public artifacts, signed URLs, media/runtime execution, raw prompts, beta, or production. The already executed Track B fixture remains complete; Sound/Music/Audio is the next lowest-risk unexecuted owner-study fixture.\n`,
    ],
    [
      'docs/next-controlled-candidate-risk-ranking.md',
      `# Next Controlled Candidate Risk Ranking\n\nLowest-risk recommendation: \`${candidate?.candidateId ?? 'none'}\`.\n\nThe ranking blocks every candidate with side effects. Fixture/report validation variants are lower risk than route-manifest, capability-manifest, cost/capacity, or source-of-truth consistency reviews because they reuse the approved synthetic fixture set and keep every execution flag false.\n`,
    ],
    [
      'docs/worker-handoff-readiness-after-first-controlled-tool.md',
      '# Worker Handoff Readiness After First Controlled Tool\n\nWorker handoff was reviewed and remains blocked for this phase. The recommended second candidate is local/server-only metadata validation and does not require worker execution. Any future worker handoff must include an `approved_plan_snapshot_v1` ref, idempotency key, correlation id, private artifact refs, checksums, cost/audit metadata, and a separate worker-owned dry-run or execution approval.\n',
    ],
    [
      'docs/next-controlled-candidate-or-worker-handoff-decision.md',
      `# Next Controlled Candidate Or Worker Handoff Decision\n\nDecision: \`${decision}\`.\n\nReadiness: \`${reports.readinessReport.readiness === true}\`.\n\nRecommended next prompt: \`SECOND_CONTROLLED_TOOL_CANDIDATE_APPROVAL\`.\n\nSupabase update required: \`no write\`; environment touched: \`none\`; SQL executed: \`none\`; migration deployed: \`no\`.\n`,
    ],
    [
      'docs/implementation-prompts/prompt-second-controlled-tool-candidate-approval.md',
      '# SECOND_CONTROLLED_TOOL_CANDIDATE_APPROVAL\n\nCreate a separate approval packet for `controlled-tool:second_fixture_report_validation` using `valid_sound_music_audio_metadata_route_candidate` and `metadata-route:sound_music_audio`. The packet must be approval-only. Do not execute tools, routes, workers, providers, media/audio/render/image/browser/map paths, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, dependency changes, PR merges, beta, or production. Stop on the first source-of-truth, artifact, worker handoff, observability, or blocked-scope failure.\n',
    ],
  ]
  for (const [filePath, value] of docs) writeText(filePath, value)
}

function updateStatusDocs(reports: NextControlledReportSet) {
  const decision = String(reports.decision.decision)
  const candidate = reports.decision.recommendedNextCandidate as NextControlledCandidate | null
  const marker = '<!-- NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW_STATUS -->'
  const blocks: Array<[string, string]> = [
    [
      'docs/cross-chat/CURRENT_HANDOFF.md',
      `${marker}\n\nNEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW:\n\n- Decision: \`${decision}\`.\n- Recommended next candidate: \`${candidate?.candidateId ?? 'none'}\`.\n- Recommended fixture/route: \`${candidate?.sourceFixtureId ?? 'none'}\` / \`${candidate?.sourceRouteCandidateId ?? 'none'}\`.\n- Worker handoff reviewed; worker execution remains blocked and is not required for this metadata-only candidate.\n- PR #384 remains stale draft duplicate-risk/reference-only evidence.\n- Next prompt: \`SECOND_CONTROLLED_TOOL_CANDIDATE_APPROVAL\`.\n`,
    ],
    [
      'docs/cross-chat/NEXT_UNLOCK_LANES.md',
      `${marker}\n\nNext unlock lane:\n\n- \`SECOND_CONTROLLED_TOOL_CANDIDATE_APPROVAL\` may approve only \`${candidate?.candidateId ?? RECOMMENDED_SECOND_CONTROLLED_CANDIDATE}\` using the Sound/Music/Audio metadata fixture.\n- Broad tools, real routes, workers, providers, media/audio/render/image/browser/map, Supabase/GCS writes, public artifacts, signed URLs, external beta, paid production, and production remain blocked.\n`,
    ],
    [
      'docs/cross-chat/BLOCKED_SCOPES.md',
      `${marker}\n\nThe next controlled candidate review does not unblock real execution. Broad tool execution, route execution, worker execution, provider/model calls, media/audio/render/export/image/browser/map work, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, dependency mutation, external beta, paid production, and production remain blocked.\n`,
    ],
    [
      'docs/beta-readiness-scorecard.md',
      `${marker}\n\nNEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW metadata status: \`${decision}\`.\n\nRecommended next phase is a second controlled candidate approval packet only. External beta, paid production, production, public artifacts, signed URLs, provider calls, workers, and broad tool execution remain blocked.\n`,
    ],
    [
      'docs/production-beta-blocker-inventory.md',
      `${marker}\n\nNEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW blocker status: worker handoff reviewed and still blocked for real execution; second candidate approval remains future-only. Production, external beta, paid production, public artifacts, signed URLs, raw prompt execution, real workers, real tools, real routes, providers, Supabase writes, SQL, and GCS uploads remain blocked.\n`,
    ],
  ]
  for (const [filePath, block] of blocks) {
    if (!existsSync(filePath)) continue
    const current = readFileSync(filePath, 'utf8')
    const next = current.includes(marker) ? current.replace(new RegExp(`${marker}[\\s\\S]*$`), block) : `${current.trimEnd()}\n\n${block}`
    writeText(filePath, next)
  }
}

function buildDocsPresence() {
  const scripts = readPackageScripts()
  const dependentReportScripts = {
    'activation:worker-runtime-noop-dry-run:report': scripts['activation:worker-runtime-noop-dry-run:report'] ? 'available' : 'missing_local_script_audit_fact',
    'activation:model-orchestration-plan-snapshot-dry-run:report': scripts['activation:model-orchestration-plan-snapshot-dry-run:report'] ? 'available' : 'missing_local_script_audit_fact',
    'activation:supabase-trackb-clean-staging-backfill:report': scripts['activation:supabase-trackb-clean-staging-backfill:report'] ? 'available' : 'missing_local_script_audit_fact',
  }
  const missingEvidenceDirectories = [
    'docs/activation-worker-runtime-noop-dry-run-reports',
    'docs/activation-model-orchestration-plan-snapshot-dry-run-reports',
    'docs/activation-supabase-trackb-clean-staging-backfill-reports',
    'docs/activation-track-b-tool-route-manifest-reports',
    'docs/activation-track-b-capability-manifests-reports',
  ].filter((dir) => !existsSync(dir))
  return {
    requiredDocs: Object.fromEntries(docPaths.map((doc) => [doc, existsSync(doc)])),
    sourceDocs: {
      firstControlled: existsSync('docs/first-controlled-tool-execution-dry-run.md'),
      controlledApproval: existsSync('docs/controlled-tool-execution-approval.md'),
      toolRouteMetadata: existsSync('docs/tool-route-metadata-dry-run.md'),
      toolRouteApproval: existsSync('docs/tool-route-dry-run-approval.md'),
      workerHandoffRequirements: existsSync('docs/controlled-tool-execution-worker-handoff-requirements.md'),
    },
    dependentReportScripts,
    missingEvidenceDirectories,
    toolStudySourceOfTruthStatus: existsSync('docs/tool-studies/tool-study-0-owner-study-matrix.json')
      ? 'merged_local_tool_study_docs_present'
      : 'missing_local_tool_study_docs',
    routeCapabilityManifestStatus: missingEvidenceDirectories.some((dir) => dir.includes('track-b'))
      ? 'route_capability_activation_dirs_missing_locally_recorded_as_audit_facts'
      : 'route_capability_activation_dirs_present',
  }
}

function buildPrEvidence(): Record<number, NextControlledPrEvidence | null> {
  const numbers = [399, 394, 388, 387, 384]
  return Object.fromEntries(numbers.map((number) => [number, safeGhPr(number)]))
}

function buildDuplicateRiskEvidence(prEvidence: Record<number, NextControlledPrEvidence | null>) {
  const pr384 = prEvidence[384]
  return {
    prNumber: 384,
    state: pr384?.state ?? null,
    isDraft: pr384?.isDraft ?? null,
    title: pr384?.title ?? null,
    url: pr384?.url ?? null,
    treatedAsSourceOfTruth: false,
    referenceOnly: pr384?.state === 'OPEN' && pr384?.isDraft === true,
  }
}

function searchOpenPhasePrs() {
  const result = safeGh([
    'pr',
    'list',
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--state',
    'open',
    '--search',
    'NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW',
    '--json',
    'number,title,state,isDraft,headRefName,baseRefName,mergeStateStatus,url',
  ])
  if (!result) return { available: false, matches: [] }
  try {
    return { available: true, matches: JSON.parse(result) as unknown[] }
  } catch {
    return { available: false, matches: [] }
  }
}

function safeGhPr(number: number): NextControlledPrEvidence | null {
  const result = safeGh([
    'pr',
    'view',
    String(number),
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--json',
    'number,title,state,mergedAt,isDraft,baseRefName,headRefName,headRefOid,mergeStateStatus,url',
  ])
  if (!result) return null
  try {
    return JSON.parse(result) as NextControlledPrEvidence
  } catch {
    return null
  }
}

function summarizeEvidence(value: Record<string, unknown>) {
  return {
    passed: value.passed,
    decision: value.decision,
    readiness: value.readiness,
    blockers: value.blockers,
    sourceReportsPresent: value.sourceReportsPresent,
    recommendedResolutionPresent: Boolean(value.recommendedResolution),
    recommendedFixturePresent: Boolean(value.recommendedFixture),
  }
}

function summarizeCandidate(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  return {
    candidateId: candidate.candidateId ?? null,
    candidateClass: candidate.candidateClass ?? null,
    sourceFixtureId: candidate.sourceFixtureId ?? null,
    sourceRouteCandidateId: candidate.sourceRouteCandidateId ?? null,
    selectedForFirstControlledDryRun: candidate.selectedForFirstControlledDryRun ?? null,
  }
}

function blockedFlags(): NextControlledBooleanFlags {
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

function hasExecutionRisk(flags: NextControlledBooleanFlags) {
  return Object.values(flags).some((value) => value !== false)
}

function riskWeight(risk: NextControlledCandidate['riskClass']) {
  return { lowest: 0, low: 1, medium: 2, blocked: 3 }[risk]
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    updateStatus: 'Track B clean staging milestone sync completed before this phase; this review is docs/reports metadata only.',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    nextSupabaseAction: 'none',
  }
}

function secretRefs() {
  return [
    { name: 'SUPABASE_ACCESS_TOKEN', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
    { name: 'SUPABASE_DB_URL', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
    { name: 'DASHSCOPE_API_KEY', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
    { name: 'DEEPSEEK_API_KEY', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
  ]
}

function packageLockChanged() {
  return Boolean(safeGit(['status', '--short', 'package-lock.json']))
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
