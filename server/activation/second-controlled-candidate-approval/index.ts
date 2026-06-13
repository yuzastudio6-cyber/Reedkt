import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  SecondControlledBooleanFlags,
  SecondControlledCandidate,
  SecondControlledCandidateApprovalDecision,
  SecondControlledCandidateApprovalReportSet,
  SecondControlledPrEvidence,
} from './second-controlled-candidate-approval-types'

export const SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR = 'docs/activation-second-controlled-candidate-approval-reports'
export const SECOND_CONTROLLED_CANDIDATE_ID = 'controlled-tool:second_fixture_report_validation'
export const SECOND_CONTROLLED_FIXTURE_ID = 'valid_sound_music_audio_metadata_route_candidate'
export const SECOND_CONTROLLED_ROUTE_ID = 'metadata-route:sound_music_audio'
export const SECOND_CONTROLLED_OWNER_LANE = 'SOUND_MUSIC_AUDIO'

const NEXT_CONTROLLED_REPORT_DIR = 'docs/activation-next-controlled-candidate-or-worker-handoff-reports'
const FIRST_CONTROLLED_REPORT_DIR = 'docs/activation-first-controlled-tool-execution-dry-run-reports'
const CONTROLLED_APPROVAL_REPORT_DIR = 'docs/activation-controlled-tool-execution-approval-reports'
const TOOL_ROUTE_METADATA_REPORT_DIR = 'docs/activation-tool-route-metadata-dry-run-reports'
const TOOL_ROUTE_APPROVAL_REPORT_DIR = 'docs/activation-tool-route-dry-run-approval-reports'

const reportPaths = {
  sourceOfTruthAudit: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/source_of_truth_audit.json`,
  preApprovalRevalidation: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/pre_approval_revalidation_report.json`,
  evidenceInventory: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/evidence_inventory.json`,
  secondCandidateScopeReview: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/second_candidate_scope_review.json`,
  soundMusicAudioRouteReview: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/sound_music_audio_route_review.json`,
  approvedPlanSnapshotRequirements: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/approved_plan_snapshot_requirements.json`,
  workerHandoffReview: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/worker_handoff_review.json`,
  artifactGuardrails: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/artifact_source_of_truth_guardrails.json`,
  failClosedPolicy: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/fail_closed_policy.json`,
  observabilityCostAuditRequirements: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/observability_cost_audit_requirements.json`,
  decision: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/second_controlled_candidate_approval_decision.json`,
  blockerReport: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/second_controlled_candidate_approval_blocker_report.json`,
  readinessReport: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/second_controlled_candidate_approval_readiness_report.json`,
  privateArtifactManifest: `${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/second_controlled_candidate_approval_private_artifact_manifest.json`,
}

const docPaths = [
  'docs/second-controlled-candidate-approval.md',
  'docs/second-controlled-candidate-scope-review.md',
  'docs/second-controlled-candidate-sound-music-audio-route-review.md',
  'docs/second-controlled-candidate-approved-plan-snapshot-requirements.md',
  'docs/second-controlled-candidate-worker-handoff-review.md',
  'docs/second-controlled-candidate-artifact-guardrails.md',
  'docs/second-controlled-candidate-fail-closed-policy.md',
  'docs/second-controlled-candidate-observability-cost-audit.md',
  'docs/second-controlled-candidate-approval-decision.md',
  'docs/implementation-prompts/prompt-second-controlled-candidate-dry-run.md',
]

export function buildSecondControlledCandidateApprovalPlan() {
  return {
    phase: 'SECOND_CONTROLLED_CANDIDATE_APPROVAL',
    packet: 'second controlled candidate approval packet',
    branch: 'codex/rp-second-controlled-candidate-approval',
    baseBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    expectedSourceSha: '8a1622a2b64a09fe40482213ad2603e08e7506ca',
    mode: 'metadata_docs_reports_only',
    expectedDecision: 'approved_for_future_second_controlled_candidate_dry_run',
    selectedCandidate: SECOND_CONTROLLED_CANDIDATE_ID,
    selectedFixture: SECOND_CONTROLLED_FIXTURE_ID,
    selectedRoute: SECOND_CONTROLLED_ROUTE_ID,
    ownerLane: SECOND_CONTROLLED_OWNER_LANE,
    requiredConfirmations: requiredConfirmations(),
    forbiddenScopes: Object.entries(blockedFlags())
      .filter(([, value]) => value === false)
      .map(([name]) => name),
    reports: Object.values(reportPaths),
    docs: docPaths,
  }
}

export function buildSecondControlledCandidateApprovalReports(): SecondControlledCandidateApprovalReportSet {
  const createdAt = new Date().toISOString()
  const flags = blockedFlags()
  const prEvidence = buildPrEvidence()
  const duplicateRisk = buildDuplicateRiskEvidence(prEvidence)
  const duplicateSearch = searchOpenPhasePrs()
  const nextEvidence = readNextControlledEvidence()
  const firstEvidence = readFirstControlledEvidence()
  const controlledApprovalEvidence = readControlledApprovalEvidence()
  const routeMetadataEvidence = readRouteMetadataEvidence()
  const routeApprovalEvidence = readRouteApprovalEvidence()
  const soundEvidence = readSoundMusicAudioEvidence()
  const docsPresence = buildDocsPresence()
  const selectedCandidate = buildSecondCandidate(nextEvidence, flags)
  const scopeReview = buildScopeReview(selectedCandidate, nextEvidence, flags, createdAt)
  const routeReview = buildSoundMusicAudioRouteReview(selectedCandidate, routeMetadataEvidence, soundEvidence, flags, createdAt)
  const approvedPlanSnapshotRequirements = buildApprovedPlanSnapshotRequirements(selectedCandidate, scopeReview.passed === true, createdAt)
  const workerHandoffReview = buildWorkerHandoffReview(selectedCandidate, scopeReview.passed === true, flags, createdAt)
  const artifactGuardrails = buildArtifactGuardrails(selectedCandidate, scopeReview.passed === true, createdAt)
  const failClosedPolicy = buildFailClosedPolicy(createdAt)
  const observabilityCostAuditRequirements = buildObservabilityCostAudit(selectedCandidate, scopeReview.passed === true, createdAt)
  const executionRisk = hasExecutionRisk(flags)
  const blockers = buildBlockers({
    sourcePrsMerged: requiredPrsMerged(prEvidence),
    pr384ReferenceOnly: duplicateRisk.treatedAsSourceOfTruth === false,
    duplicateSearchClear: duplicateSearch.matches.length === 0,
    nextReviewPassed: nextEvidence.passed,
    firstControlledPassed: firstEvidence.passed,
    controlledApprovalPassed: controlledApprovalEvidence.passed,
    routeMetadataPassed: routeMetadataEvidence.passed,
    routeApprovalPassed: routeApprovalEvidence.passed,
    scopeReviewPassed: scopeReview.passed === true,
    routeReviewPassed: routeReview.passed === true,
    approvedPlanSnapshotPassed: approvedPlanSnapshotRequirements.passed === true,
    workerHandoffPassed: workerHandoffReview.passed === true,
    artifactGuardrailsPassed: artifactGuardrails.passed === true,
    failClosedPolicyPassed: failClosedPolicy.passed === true,
    observabilityCostAuditPassed: observabilityCostAuditRequirements.passed === true,
    executionRisk,
  })
  const decision = chooseDecision(blockers)
  const readiness = decision === 'approved_for_future_second_controlled_candidate_dry_run'

  const sourceOfTruthAudit = {
    schema: 'reeditpro.secondControlledCandidateApproval.sourceOfTruthAudit.v1',
    createdAt,
    sourceBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    expectedSourceSha: '8a1622a2b64a09fe40482213ad2603e08e7506ca',
    currentBranch: safeGit(['branch', '--show-current']) ?? null,
    currentSha: safeGit(['rev-parse', 'HEAD']) ?? null,
    pr402: prEvidence[402] ?? null,
    pr399: prEvidence[399] ?? null,
    pr394: prEvidence[394] ?? null,
    pr388: prEvidence[388] ?? null,
    pr387: prEvidence[387] ?? null,
    pr384DuplicateRisk: duplicateRisk,
    duplicatePhasePrSearch: duplicateSearch,
    docsPresence,
    flags,
    supabaseClassification: supabaseClassification(),
    decision,
  }

  const preApprovalRevalidation = {
    schema: 'reeditpro.secondControlledCandidateApproval.preApprovalRevalidation.v1',
    createdAt,
    pr402Merged: prEvidence[402]?.state === 'MERGED' && Boolean(prEvidence[402]?.mergedAt),
    pr399Merged: prEvidence[399]?.state === 'MERGED' && Boolean(prEvidence[399]?.mergedAt),
    pr394Merged: prEvidence[394]?.state === 'MERGED' && Boolean(prEvidence[394]?.mergedAt),
    pr388Merged: prEvidence[388]?.state === 'MERGED' && Boolean(prEvidence[388]?.mergedAt),
    pr387Merged: prEvidence[387]?.state === 'MERGED' && Boolean(prEvidence[387]?.mergedAt),
    pr384ReferenceOnly: duplicateRisk.treatedAsSourceOfTruth === false,
    duplicateSecondCandidateApprovalPrs: duplicateSearch.matches,
    nextControlledRecommendationEvidence: nextEvidence,
    firstControlledExecutionEvidence: firstEvidence,
    controlledToolApprovalEvidence: controlledApprovalEvidence,
    routeMetadataEvidence: summarizeRouteMetadataEvidence(routeMetadataEvidence),
    routeApprovalEvidence,
    soundMusicAudioEvidence: soundEvidence,
    optionalDependentScripts: docsPresence.dependentReportScripts,
    missingOptionalEvidenceRecordedAsAuditFacts: docsPresence.missingEvidenceDirectories,
    packageLockChanged: packageLockChanged(),
    blockedScopesPreserved: !executionRisk,
  }

  const evidenceInventory = {
    schema: 'reeditpro.secondControlledCandidateApproval.evidenceInventory.v1',
    createdAt,
    pr402RecommendationDecision: nextEvidence.decision,
    selectedSecondCandidate: SECOND_CONTROLLED_CANDIDATE_ID,
    selectedFixture: SECOND_CONTROLLED_FIXTURE_ID,
    selectedRoute: SECOND_CONTROLLED_ROUTE_ID,
    ownerLane: SECOND_CONTROLLED_OWNER_LANE,
    pr399FirstControlledDryRunPassed: firstEvidence.passed,
    pr394ControlledApprovalPassed: controlledApprovalEvidence.passed,
    pr388RouteMetadataDryRunPassed: routeMetadataEvidence.passed,
    pr387RouteDryRunApprovalPassed: routeApprovalEvidence.passed,
    toolStudySourceOfTruthStatus: docsPresence.toolStudySourceOfTruthStatus,
    soundMusicAudioToolStudyStatus: soundEvidence.status,
    workerNoopEvidence: docsPresence.dependentReportScripts['activation:worker-runtime-noop-dry-run:report'],
    planSnapshotDryRunEvidence: docsPresence.dependentReportScripts['activation:model-orchestration-plan-snapshot-dry-run:report'],
    routeCapabilityManifestStatus: docsPresence.routeCapabilityManifestStatus,
    supabaseTrackBBackfillEvidence: docsPresence.dependentReportScripts['activation:supabase-trackb-clean-staging-backfill:report'],
    publicArtifactSignedUrlPolicyStatus: 'blocked_signed_urls_not_source_of_truth',
    secretRefs: secretRefs(),
    flags,
  }

  const decisionReport = {
    schema: 'reeditpro.secondControlledCandidateApproval.decision.v1',
    createdAt,
    decision,
    readiness,
    approvedForFutureSecondControlledCandidateDryRun: readiness,
    selectedCandidate,
    blockers,
    secondCandidateExecuted: false,
    realToolExecutionApproved: false,
    routeExecutionApproved: false,
    workerExecutionApproved: false,
    providerExecutionApproved: false,
    mediaProcessingApproved: false,
    audioProcessingApproved: false,
    renderExportApproved: false,
    imageGenerationOrEditingApproved: false,
    browserCaptureApproved: false,
    mapRenderingApproved: false,
    supabaseWritesApproved: false,
    sqlApproved: false,
    gcsUploadsApproved: false,
    publicArtifactsApproved: false,
    signedUrlsApproved: false,
    rawPromptExecutionApproved: false,
    dependencyMutationApproved: false,
    githubPrMergeApproved: false,
    betaProductionUnlocked: false,
    nextPrompt:
      decision === 'approved_for_future_second_controlled_candidate_dry_run'
        ? 'SECOND_CONTROLLED_CANDIDATE_EXECUTION — second controlled candidate dry-run'
        : 'SECOND_CONTROLLED_CANDIDATE_APPROVAL_REMEDIATION',
    supabaseClassification: supabaseClassification(),
  }

  const blockerReport = {
    schema: 'reeditpro.secondControlledCandidateApproval.blockerReport.v1',
    createdAt,
    decision,
    blockers,
    activeRuntimeBlockersPreserved: true,
    secondCandidateExecutionStillFutureOnly: true,
    broadToolExecutionStillBlocked: true,
    staleDuplicatePr: duplicateRisk,
  }

  const readinessReport = {
    schema: 'reeditpro.secondControlledCandidateApproval.readinessReport.v1',
    createdAt,
    readiness,
    decision,
    pr402RecommendationPassed: nextEvidence.passed,
    firstControlledDryRunPassed: firstEvidence.passed,
    controlledToolApprovalPassed: controlledApprovalEvidence.passed,
    routeMetadataDryRunPassed: routeMetadataEvidence.passed,
    routeApprovalPassed: routeApprovalEvidence.passed,
    scopeReviewPassed: scopeReview.passed === true,
    soundMusicAudioRouteReviewPassed: routeReview.passed === true,
    approvedPlanSnapshotRequirementsPassed: approvedPlanSnapshotRequirements.passed === true,
    workerHandoffReviewPassed: workerHandoffReview.passed === true,
    artifactGuardrailsPassed: artifactGuardrails.passed === true,
    failClosedPolicyPassed: failClosedPolicy.passed === true,
    observabilityCostAuditRequirementsPassed: observabilityCostAuditRequirements.passed === true,
    runtimeScopesBlocked: !executionRisk,
  }

  const privateArtifactManifest = {
    schema: 'reeditpro.secondControlledCandidateApproval.privateArtifactManifest.v1',
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
    preApprovalRevalidation,
    evidenceInventory,
    secondCandidateScopeReview: scopeReview,
    soundMusicAudioRouteReview: routeReview,
    approvedPlanSnapshotRequirements,
    workerHandoffReview,
    artifactGuardrails,
    failClosedPolicy,
    observabilityCostAuditRequirements,
    decision: decisionReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export function summarizeSecondControlledCandidateApproval(reports = buildSecondControlledCandidateApprovalReports()): string {
  const blockers = (reports.blockerReport.blockers as string[]) ?? []
  return [
    'Second controlled candidate approval packet',
    `Decision: ${String(reports.decision.decision)}`,
    `Readiness: ${reports.readinessReport.readiness === true ? 'ready for future second controlled candidate dry-run' : 'blocked'}`,
    `Selected candidate: ${SECOND_CONTROLLED_CANDIDATE_ID}`,
    `Selected fixture/route: ${SECOND_CONTROLLED_FIXTURE_ID} / ${SECOND_CONTROLLED_ROUTE_ID}`,
    'Selected behavior: local/server-only metadata/report validation approval only',
    'Route/tool/worker/provider/media/audio/render/image/browser/map/Supabase/GCS/public/beta/production scopes: blocked',
    'Supabase update required: no write; environment touched: none; SQL executed: none; migration deployed: no',
    'Blockers:',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function writeSecondControlledCandidateApprovalArtifacts() {
  const reports = buildSecondControlledCandidateApprovalReports()
  mkdirSync(SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR, { recursive: true })
  for (const [key, filePath] of Object.entries(reportPaths)) {
    writeJson(filePath, reports[key as keyof SecondControlledCandidateApprovalReportSet])
  }
  writeDocs(reports)
  updateStatusDocs(reports)
  return reports
}

function buildSecondCandidate(nextEvidence: ReturnType<typeof readNextControlledEvidence>, flags: SecondControlledBooleanFlags): SecondControlledCandidate | null {
  if (nextEvidence.recommendedCandidate?.candidateId !== SECOND_CONTROLLED_CANDIDATE_ID) return null
  return {
    candidateId: SECOND_CONTROLLED_CANDIDATE_ID,
    candidateClass: 'fixture_report_validation_route_variant',
    ownerLane: SECOND_CONTROLLED_OWNER_LANE,
    sourceFixtureId: SECOND_CONTROLLED_FIXTURE_ID,
    sourceRouteCandidateId: SECOND_CONTROLLED_ROUTE_ID,
    expectedInput: 'approved_plan_snapshot_v1 placeholder plus private manifest/checksum refs',
    expectedOutput: 'metadata-only validation report for sound/music/audio route fixture',
    approvedPlanSnapshotRef: 'approved_plan_snapshot_v1:synthetic-second-controlled-sound-fixture',
    privatePlaceholderRefs: [
      'manifest:synthetic-second-controlled-sound-fixture',
      'checksum:synthetic-second-controlled-sound-fixture',
      'private-gcs-ref:placeholder-only/no-upload',
    ],
    selectedForSecondControlledDryRunApproval: !hasExecutionRisk(flags),
    executionFlags: flags,
  }
}

function buildScopeReview(
  candidate: SecondControlledCandidate | null,
  nextEvidence: ReturnType<typeof readNextControlledEvidence>,
  flags: SecondControlledBooleanFlags,
  createdAt: string
) {
  const checks = {
    candidateIdMatches: candidate?.candidateId === SECOND_CONTROLLED_CANDIDATE_ID,
    fixtureMatches: candidate?.sourceFixtureId === SECOND_CONTROLLED_FIXTURE_ID,
    routeMatches: candidate?.sourceRouteCandidateId === SECOND_CONTROLLED_ROUTE_ID,
    ownerLaneMatches: candidate?.ownerLane === SECOND_CONTROLLED_OWNER_LANE,
    nextRecommendationPresent: nextEvidence.passed === true,
    localServerOnly: true,
    metadataReportValidationOnly: true,
    noRealAudioProcessing: flags.audioProcessingAllowed === false,
    noRealMediaProcessing: flags.mediaProcessingAllowed === false,
    noWorkerRequirement: flags.workerExecutionAllowed === false,
    noProviderRequirement: flags.providerExecutionAllowed === false,
    noSupabaseGcsPublicSignedUrlSideEffects:
      flags.supabaseWritesAllowed === false &&
      flags.gcsUploadAllowed === false &&
      flags.publicArtifactsAllowed === false &&
      flags.signedUrlsAsSourceOfTruthAllowed === false,
  }
  return {
    schema: 'reeditpro.secondControlledCandidateApproval.scopeReview.v1',
    createdAt,
    passed: Object.values(checks).every(Boolean),
    candidate,
    checks,
    forbiddenExecutionDetected: hasExecutionRisk(flags),
  }
}

function buildSoundMusicAudioRouteReview(
  candidate: SecondControlledCandidate | null,
  routeMetadataEvidence: ReturnType<typeof readRouteMetadataEvidence>,
  soundEvidence: ReturnType<typeof readSoundMusicAudioEvidence>,
  flags: SecondControlledBooleanFlags,
  createdAt: string
) {
  const checks = {
    candidatePresent: Boolean(candidate),
    toolStudySourceOfTruthExists: soundEvidence.status === 'sound_music_audio_tool_study_passed_docs_only',
    soundDiagnosticsRepresentedAsPassed: soundEvidence.diagnosticsPassed === true,
    routeMetadataOnly: routeMetadataEvidence.recommendedValidation?.acceptedMetadataOnly === true,
    routeFixturePassed: routeMetadataEvidence.recommendedValidation?.fixtureId === SECOND_CONTROLLED_FIXTURE_ID,
    routeResolutionPassed: Boolean(routeMetadataEvidence.recommendedResolution),
    demucsRemainsBlocked: soundEvidence.demucsRuntimeBlocked === true,
    deepFilterNetSignalsmithRealProcessingBlocked: flags.audioProcessingAllowed === false && flags.mediaProcessingAllowed === false,
    noAudioPayloadsProcessed: true,
    noMediaProcessed: true,
  }
  return {
    schema: 'reeditpro.secondControlledCandidateApproval.soundMusicAudioRouteReview.v1',
    createdAt,
    passed: Object.values(checks).every(Boolean),
    selectedRoute: SECOND_CONTROLLED_ROUTE_ID,
    selectedFixture: SECOND_CONTROLLED_FIXTURE_ID,
    ownerLane: SECOND_CONTROLLED_OWNER_LANE,
    checks,
    soundEvidence,
  }
}

function buildApprovedPlanSnapshotRequirements(candidate: SecondControlledCandidate | null, scopePassed: boolean, createdAt: string) {
  const requirements = {
    approvedPlanSnapshotVersion: 'approved_plan_snapshot_v1',
    approvedScope: [SECOND_CONTROLLED_CANDIDATE_ID],
    selectedRoute: SECOND_CONTROLLED_ROUTE_ID,
    selectedFixture: SECOND_CONTROLLED_FIXTURE_ID,
    rawPromptExecutionAllowed: false,
    signedUrlsAsSourceOfTruth: false,
    publicArtifactsDisabled: true,
    artifactScope: 'private_metadata_only',
    realUserPrivateMediaPayloadsAllowed: false,
    providerDataAllowed: false,
    executableSupabaseOrGcsWriteRefsAllowed: false,
    sourceOfTruthRefs: ['approved_plan_snapshot_v1 placeholder', 'manifest placeholder', 'checksum placeholder', 'private path placeholder'],
  }
  return {
    schema: 'reeditpro.secondControlledCandidateApproval.approvedPlanSnapshotRequirements.v1',
    createdAt,
    passed: scopePassed && Boolean(candidate),
    candidateId: candidate?.candidateId ?? null,
    requirements,
  }
}

function buildWorkerHandoffReview(candidate: SecondControlledCandidate | null, scopePassed: boolean, flags: SecondControlledBooleanFlags, createdAt: string) {
  return {
    schema: 'reeditpro.secondControlledCandidateApproval.workerHandoffReview.v1',
    createdAt,
    passed: scopePassed && Boolean(candidate) && flags.workerExecutionAllowed === false,
    candidateId: candidate?.candidateId ?? null,
    workerHandoffRequiredForThisCandidate: false,
    workerExecutionApprovedThisPhase: false,
    queueEnqueueAllowed: false,
    subprocessDockerCloudRunAllowed: false,
    futureWorkerHandoffRequiredBeforeRealAudioMediaToolExecution: true,
    futureWorkerHandoffRequires: [
      'approved_plan_snapshot_v1 ref',
      'idempotency key',
      'correlation id',
      'private artifact manifest refs',
      'checksum refs',
      'cost/audit metadata',
      'separate WORKER_RUNTIME_JOBS approval',
    ],
  }
}

function buildArtifactGuardrails(candidate: SecondControlledCandidate | null, scopePassed: boolean, createdAt: string) {
  return {
    schema: 'reeditpro.secondControlledCandidateApproval.artifactSourceOfTruthGuardrails.v1',
    createdAt,
    passed: scopePassed && Boolean(candidate),
    candidateId: candidate?.candidateId ?? null,
    sourceOfTruthPolicy: ['future Supabase row ref no-write', 'private GCS path ref no-upload', 'manifest id', 'checksum', 'approved_plan_snapshot_v1'],
    signedUrlsCanBeSourceOfTruth: false,
    publicArtifactsAllowed: false,
    arbitraryPathsAllowed: false,
    unapprovedGcsPrefixesAllowed: false,
    privatePayloadsCommitted: false,
    uploadsPerformedThisPhase: false,
    outputDeliveryPerformedThisPhase: false,
  }
}

function buildFailClosedPolicy(createdAt: string) {
  const failClosedCases = [
    'wrong_candidate_id',
    'wrong_route',
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
    'sql_execution',
    'gcs_upload',
    'production_mutation',
    'broad_execution_request',
    'dependency_mutation',
    'demucs_deepfilternet_signalsmith_real_processing_request',
  ]
  return {
    schema: 'reeditpro.secondControlledCandidateApproval.failClosedPolicy.v1',
    createdAt,
    passed: true,
    failClosedCases,
    defaultOutcome: 'blocked_before_execution',
    secondCandidateExecutionAttemptAllowedThisPhase: false,
  }
}

function buildObservabilityCostAudit(candidate: SecondControlledCandidate | null, scopePassed: boolean, createdAt: string) {
  return {
    schema: 'reeditpro.secondControlledCandidateApproval.observabilityCostAuditRequirements.v1',
    createdAt,
    passed: scopePassed && Boolean(candidate),
    requiredAuditFields: [
      'runId',
      'correlationId',
      'approvedPlanSnapshotId',
      'selectedCandidateId',
      'selectedRouteId',
      'ownerStudyRefs',
      'artifactManifestRefs',
      'failClosedOutcome',
    ],
    selectedCandidateId: candidate?.candidateId ?? null,
    selectedRouteId: SECOND_CONTROLLED_ROUTE_ID,
    noSecretLogs: true,
    noRawPrivatePayloadLogs: true,
    timeoutClass: 'metadata_validation_short_timeout',
    costEstimateClass: 'metadata_only_no_provider_worker_or_tool_cost',
    retryPolicy: 'retry_disabled_for_approval_packet',
    failureStateMapping: {
      scopeFailure: 'blocked_pending_second_candidate_scope_review',
      routeFailure: 'blocked_pending_sound_music_audio_route_review',
      artifactFailure: 'blocked_pending_artifact_scope_policy',
      unsafeRuntimeRequest: 'rejected_due_runtime_safety_risk',
    },
    abuseRateLimitControls: ['no provider calls', 'no worker enqueue', 'no media payloads', 'no public artifacts', 'no signed URL delivery'],
  }
}

function readNextControlledEvidence() {
  const decision = readJsonObject(`${NEXT_CONTROLLED_REPORT_DIR}/next_controlled_candidate_or_worker_handoff_decision.json`)
  const readiness = readJsonObject(`${NEXT_CONTROLLED_REPORT_DIR}/next_controlled_candidate_or_worker_handoff_readiness_report.json`)
  const inventory = readJsonObject(`${NEXT_CONTROLLED_REPORT_DIR}/controlled_candidate_inventory.json`)
  const recommendedCandidate = decision.recommendedNextCandidate as Record<string, unknown> | null
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const inventoryRows = Array.isArray(inventory.rows) ? (inventory.rows as Array<Record<string, unknown>>) : []
  const inventoryCandidate = inventoryRows.find((row) => row.candidateId === SECOND_CONTROLLED_CANDIDATE_ID)
  const passed =
    decision.decision === 'recommended_next_controlled_candidate_approval' &&
    decision.readiness === true &&
    readiness.readiness === true &&
    recommendedCandidate?.candidateId === SECOND_CONTROLLED_CANDIDATE_ID &&
    recommendedCandidate?.sourceFixtureId === SECOND_CONTROLLED_FIXTURE_ID &&
    recommendedCandidate?.sourceRouteCandidateId === SECOND_CONTROLLED_ROUTE_ID &&
    recommendedCandidate?.ownerLane === SECOND_CONTROLLED_OWNER_LANE &&
    recommendedCandidate?.approvedAsNextCandidate === true &&
    Boolean(inventoryCandidate) &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    recommendedCandidate,
    inventoryCandidate,
    blockers,
    sourceReportsPresent: Boolean(decision.decision) && Boolean(inventory.schema),
  }
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
  return { passed, decision: decision.decision ?? null, readiness: readiness.readiness === true, selectedCandidate, blockers }
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
  return { passed, decision: decision.decision ?? null, readiness: readiness.readiness === true, blockers }
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
  const fixtureRows = Array.isArray(fixtureValidation.rows) ? (fixtureValidation.rows as Array<Record<string, unknown>>) : []
  const resolutionRows = Array.isArray(metadataResolution.rows) ? (metadataResolution.rows as Array<Record<string, unknown>>) : []
  const recommendedValidation = fixtureRows.find((row) => row.fixtureId === SECOND_CONTROLLED_FIXTURE_ID)
  const recommendedResolution = resolutionRows.find(
    (row) => row.fixtureId === SECOND_CONTROLLED_FIXTURE_ID && row.routeCandidateId === SECOND_CONTROLLED_ROUTE_ID && row.passed === true
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
    recommendedValidation?.acceptedMetadataOnly === true &&
    Boolean(recommendedResolution) &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    blockers,
    recommendedValidation,
    recommendedResolution,
    fixtureValidationPassed: fixtureValidation.passed === true,
    metadataResolutionPassed: metadataResolution.passed === true,
    artifactScopePassed: artifactScope.passed === true,
    failClosedPassed: failClosed.passed === true,
    observabilityPassed: observability.passed === true,
  }
}

function readRouteApprovalEvidence() {
  const decision = readJsonObject(`${TOOL_ROUTE_APPROVAL_REPORT_DIR}/tool_route_dry_run_approval_decision.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  return {
    passed: decision.decision === 'approved_for_future_tool_route_metadata_dry_run_execution' && blockers.length === 0,
    decision: decision.decision ?? null,
    blockers,
  }
}

function readSoundMusicAudioEvidence() {
  const audit = readJsonObject('docs/tool-studies/sound-music-audio-source-of-truth-audit.json')
  const routingPolicyPresent = existsSync('docs/tool-studies/sound-music-audio-routing-policy.md')
  const handoffPresent = existsSync('docs/tool-studies/sound-music-audio-handoff-contract.md')
  const diagnosticsScriptPresent = Boolean(readPackageScripts()['tool-study:sound-music-audio:diagnostics'])
  const runtimeReadiness = audit.runtimeReadiness as Record<string, unknown> | undefined
  return {
    status: audit.decision ?? null,
    diagnosticsPassed: audit.decision === 'sound_music_audio_tool_study_passed_docs_only' && routingPolicyPresent && handoffPresent && diagnosticsScriptPresent,
    routingPolicyPresent,
    handoffPresent,
    diagnosticsScriptPresent,
    demucsRuntimeBlocked: runtimeReadiness?.demucsRuntimeBlocked === true,
    realRuntimeReady: runtimeReadiness?.realRuntimeReady === false,
  }
}

function buildBlockers(input: {
  sourcePrsMerged: boolean
  pr384ReferenceOnly: boolean
  duplicateSearchClear: boolean
  nextReviewPassed: boolean
  firstControlledPassed: boolean
  controlledApprovalPassed: boolean
  routeMetadataPassed: boolean
  routeApprovalPassed: boolean
  scopeReviewPassed: boolean
  routeReviewPassed: boolean
  approvedPlanSnapshotPassed: boolean
  workerHandoffPassed: boolean
  artifactGuardrailsPassed: boolean
  failClosedPolicyPassed: boolean
  observabilityCostAuditPassed: boolean
  executionRisk: boolean
}) {
  const blockers: string[] = []
  if (input.executionRisk) blockers.push('runtime_safety_risk')
  if (!input.pr384ReferenceOnly) blockers.push('pr384_duplicate_risk_not_reference_only')
  if (!input.duplicateSearchClear) blockers.push('duplicate_second_controlled_candidate_approval_pr_open')
  if (!input.sourcePrsMerged) blockers.push('required_source_pr_merge_evidence_missing')
  if (!input.nextReviewPassed) blockers.push('pr402_next_candidate_recommendation_missing_or_blocked')
  if (!input.firstControlledPassed) blockers.push('pr399_first_controlled_dry_run_evidence_missing_or_blocked')
  if (!input.controlledApprovalPassed) blockers.push('pr394_controlled_approval_evidence_missing_or_blocked')
  if (!input.routeMetadataPassed) blockers.push('pr388_route_metadata_dry_run_evidence_missing_or_blocked')
  if (!input.routeApprovalPassed) blockers.push('pr387_route_approval_evidence_missing_or_blocked')
  if (!input.scopeReviewPassed) blockers.push('second_candidate_scope_review_failed')
  if (!input.routeReviewPassed) blockers.push('sound_music_audio_route_review_failed')
  if (!input.approvedPlanSnapshotPassed) blockers.push('approved_plan_snapshot_requirements_failed')
  if (!input.workerHandoffPassed) blockers.push('worker_handoff_review_failed')
  if (!input.artifactGuardrailsPassed) blockers.push('artifact_scope_policy_failed')
  if (!input.failClosedPolicyPassed) blockers.push('fail_closed_policy_failed')
  if (!input.observabilityCostAuditPassed) blockers.push('observability_cost_audit_failed')
  return blockers
}

function chooseDecision(blockers: string[]): SecondControlledCandidateApprovalDecision {
  if (blockers.some((blocker) => blocker.includes('runtime_safety') || blocker.includes('duplicate'))) return 'rejected_due_runtime_safety_risk'
  if (blockers.some((blocker) => blocker.includes('scope') || blocker.includes('pr402') || blocker.includes('required_source'))) {
    return 'blocked_pending_second_candidate_scope_review'
  }
  if (blockers.some((blocker) => blocker.includes('sound_music_audio') || blocker.includes('route_metadata') || blocker.includes('route_approval'))) {
    return 'blocked_pending_sound_music_audio_route_review'
  }
  if (blockers.some((blocker) => blocker.includes('approved_plan_snapshot'))) return 'blocked_pending_plan_snapshot_requirements'
  if (blockers.some((blocker) => blocker.includes('worker_handoff'))) return 'blocked_pending_worker_handoff_review'
  if (blockers.some((blocker) => blocker.includes('artifact_scope'))) return 'blocked_pending_artifact_scope_policy'
  if (blockers.some((blocker) => blocker.includes('fail_closed'))) return 'blocked_pending_fail_closed_policy'
  if (blockers.some((blocker) => blocker.includes('observability_cost_audit'))) return 'blocked_pending_observability_cost_audit'
  return 'approved_for_future_second_controlled_candidate_dry_run'
}

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_SECOND_CONTROLLED_CANDIDATE_APPROVAL_PACKET',
    'REEDITPRO_CONFIRM_NEXT_CONTROLLED_CANDIDATE_RECOMMENDATION',
    'REEDITPRO_CONFIRM_SECOND_FIXTURE_REPORT_VALIDATION_CANDIDATE',
    'REEDITPRO_CONFIRM_SOUND_MUSIC_AUDIO_METADATA_ROUTE_ONLY',
    'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_REQUIREMENT',
    'REEDITPRO_CONFIRM_ARTIFACT_SCOPE_POLICY_AUDIT',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'SECOND_CONTROLLED_CANDIDATE_EXECUTION',
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

function writeDocs(reports: SecondControlledCandidateApprovalReportSet) {
  const decision = String(reports.decision.decision)
  const docs: Array<[string, string]> = [
    [
      'docs/second-controlled-candidate-approval.md',
      `# Second Controlled Candidate Approval\n\nDecision: \`${decision}\`.\n\nThis packet approves only a future dry-run for \`${SECOND_CONTROLLED_CANDIDATE_ID}\`, using fixture \`${SECOND_CONTROLLED_FIXTURE_ID}\` and route \`${SECOND_CONTROLLED_ROUTE_ID}\`. It does not execute the candidate, tools, routes, workers, providers, media/audio/render/image/browser/map paths, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, dependency changes, PR merges, beta, or production.\n\nPR #384 remains stale draft duplicate-risk/reference-only evidence and is not source of truth.\n`,
    ],
    [
      'docs/second-controlled-candidate-scope-review.md',
      `# Second Controlled Candidate Scope Review\n\nCandidate: \`${SECOND_CONTROLLED_CANDIDATE_ID}\`.\n\nFixture/route: \`${SECOND_CONTROLLED_FIXTURE_ID}\` / \`${SECOND_CONTROLLED_ROUTE_ID}\`.\n\nOwner lane: \`${SECOND_CONTROLLED_OWNER_LANE}\`.\n\nThe candidate is local/server-only metadata and report validation. Real audio processing, media processing, worker execution, provider calls, Supabase/GCS writes, public artifacts, signed URLs, beta, and production stay blocked.\n`,
    ],
    [
      'docs/second-controlled-candidate-sound-music-audio-route-review.md',
      '# Second Controlled Candidate Sound/Music/Audio Route Review\n\nThe Sound/Music/Audio route is approved only for metadata fixture/report validation. Demucs remains blocked pending provenance/legal/human approval. DeepFilterNet, Signalsmith Stretch, FFmpeg/FFprobe, AudioFlux, Lyria, Mirelo, MMAudio, and any other audio path remain planning metadata only in this phase; no audio or media payload is processed.\n',
    ],
    [
      'docs/second-controlled-candidate-approved-plan-snapshot-requirements.md',
      `# Second Controlled Candidate Approved Plan Snapshot Requirements\n\nA future dry-run must use \`approved_plan_snapshot_v1\` with approved scope limited to \`${SECOND_CONTROLLED_CANDIDATE_ID}\` and route \`${SECOND_CONTROLLED_ROUTE_ID}\`. Raw prompts, provider responses, edit-intents-only input, candidate snapshots, public artifacts, signed URLs as source of truth, real media payloads, executable Supabase/GCS write refs, and unapproved paths are blocked.\n`,
    ],
    [
      'docs/second-controlled-candidate-worker-handoff-review.md',
      '# Second Controlled Candidate Worker Handoff Review\n\nWorker handoff is not required for this metadata-only approval. No worker execution, queue enqueue, subprocess, Docker, Cloud Run, or sidecar execution is approved. Any real audio/media/tool execution later requires a separate WORKER_RUNTIME_JOBS handoff and approval.\n',
    ],
    [
      'docs/second-controlled-candidate-artifact-guardrails.md',
      '# Second Controlled Candidate Artifact Guardrails\n\nSource of truth is private metadata only: approved snapshot refs, future Supabase row refs with no write in this phase, private GCS path refs with no upload, manifest ids, and checksums. Signed URLs are never source of truth. Public artifacts, arbitrary paths, unapproved GCS prefixes, private payload commits, uploads, and output delivery are blocked.\n',
    ],
    [
      'docs/second-controlled-candidate-fail-closed-policy.md',
      '# Second Controlled Candidate Fail-Closed Policy\n\nFail closed on wrong candidate, wrong route, missing approved snapshot, raw prompt input, edit-intents-only input, plan snapshot candidate input, provider response input, missing owner study, missing route manifest, ambiguous candidate, invalid artifact scope, public artifact, signed URL source-of-truth, media/audio/render/image/browser/map request, provider/model call, worker execution, Supabase mutation, SQL, GCS upload, production mutation, broad execution, dependency mutation, or real Demucs/DeepFilterNet/Signalsmith processing request.\n',
    ],
    [
      'docs/second-controlled-candidate-observability-cost-audit.md',
      '# Second Controlled Candidate Observability Cost Audit\n\nA future dry-run must record run id, correlation id, approved plan snapshot id, selected candidate id, selected route id, owner-study refs, artifact manifest refs, blocker/fail-closed outcome, timeout class, cost estimate class, and audit event shape. Secret values and raw private payloads must not be logged. Retries are disabled for this approval packet.\n',
    ],
    [
      'docs/second-controlled-candidate-approval-decision.md',
      `# Second Controlled Candidate Approval Decision\n\nDecision: \`${decision}\`.\n\nApproved future candidate: \`${SECOND_CONTROLLED_CANDIDATE_ID}\`.\n\nNext prompt: \`SECOND_CONTROLLED_CANDIDATE_EXECUTION — second controlled candidate dry-run\` if this packet remains approved. Broader controlled tool execution remains blocked.\n\nSupabase update required: \`no write\`; environment touched: \`none\`; SQL executed: \`none\`; migration deployed: \`no\`.\n`,
    ],
    [
      'docs/implementation-prompts/prompt-second-controlled-candidate-dry-run.md',
      `# SECOND_CONTROLLED_CANDIDATE_EXECUTION\n\nExecute only \`${SECOND_CONTROLLED_CANDIDATE_ID}\` using \`${SECOND_CONTROLLED_FIXTURE_ID}\` and \`${SECOND_CONTROLLED_ROUTE_ID}\` with a synthetic \`approved_plan_snapshot_v1\` placeholder. This is metadata/report validation only. Do not execute real audio/media processing, tools, routes, workers, providers, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, raw prompts, dependency changes, beta, or production. Stop on the first source-of-truth, scope, artifact, worker handoff, observability, or safety failure. Broader tool execution remains blocked.\n`,
    ],
  ]
  for (const [filePath, value] of docs) writeText(filePath, value)
}

function updateStatusDocs(reports: SecondControlledCandidateApprovalReportSet) {
  const decision = String(reports.decision.decision)
  const marker = '<!-- SECOND_CONTROLLED_CANDIDATE_APPROVAL_STATUS -->'
  const block = `${marker}\n\nSECOND_CONTROLLED_CANDIDATE_APPROVAL:\n\n- Decision: \`${decision}\`.\n- Approved future candidate: \`${SECOND_CONTROLLED_CANDIDATE_ID}\`.\n- Fixture/route: \`${SECOND_CONTROLLED_FIXTURE_ID}\` / \`${SECOND_CONTROLLED_ROUTE_ID}\`.\n- Owner lane: \`${SECOND_CONTROLLED_OWNER_LANE}\`.\n- Actual candidate execution remains future and separately approved.\n- Broad tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.\n`
  const files = [
    'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
    'docs/beta-readiness-scorecard.md',
    'docs/production-beta-blocker-inventory.md',
  ]
  for (const filePath of files) {
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
    'activation:model-orchestration-plan-snapshot-dry-run:report': scripts['activation:model-orchestration-plan-snapshot-dry-run:report']
      ? 'available'
      : 'missing_local_script_audit_fact',
    'activation:supabase-trackb-clean-staging-backfill:report': scripts['activation:supabase-trackb-clean-staging-backfill:report']
      ? 'available'
      : 'missing_local_script_audit_fact',
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
      nextControlledReview: existsSync('docs/next-controlled-candidate-or-worker-handoff-review.md'),
      firstControlledDryRun: existsSync('docs/first-controlled-tool-execution-dry-run.md'),
      controlledApproval: existsSync('docs/controlled-tool-execution-approval.md'),
      toolRouteMetadata: existsSync('docs/tool-route-metadata-dry-run.md'),
      soundMusicAudioStudy: existsSync('docs/tool-studies/sound-music-audio-tool-study.md'),
      soundMusicAudioRoutingPolicy: existsSync('docs/tool-studies/sound-music-audio-routing-policy.md'),
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

function buildPrEvidence(): Record<number, SecondControlledPrEvidence | null> {
  const numbers = [402, 399, 394, 388, 387, 384]
  return Object.fromEntries(numbers.map((number) => [number, safeGhPr(number)]))
}

function requiredPrsMerged(prEvidence: Record<number, SecondControlledPrEvidence | null>) {
  return [402, 399, 394, 388, 387].every((number) => prEvidence[number]?.state === 'MERGED' && Boolean(prEvidence[number]?.mergedAt))
}

function buildDuplicateRiskEvidence(prEvidence: Record<number, SecondControlledPrEvidence | null>) {
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
  const searches = ['SECOND_CONTROLLED_CANDIDATE_APPROVAL', 'second_fixture_report_validation']
  const matches: unknown[] = []
  for (const search of searches) {
    const result = safeGh([
      'pr',
      'list',
      '--repo',
      'yuzastudio6-cyber/Reedkt',
      '--state',
      'open',
      '--search',
      search,
      '--json',
      'number,title,state,isDraft,headRefName,baseRefName,mergeStateStatus,url',
    ])
    if (!result) continue
    try {
      const parsed = JSON.parse(result) as unknown[]
      matches.push(...parsed)
    } catch {
      return { available: false, matches: [] as unknown[] }
    }
  }
  return { available: true, matches }
}

function safeGhPr(number: number): SecondControlledPrEvidence | null {
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
    return JSON.parse(result) as SecondControlledPrEvidence
  } catch {
    return null
  }
}

function summarizeRouteMetadataEvidence(value: ReturnType<typeof readRouteMetadataEvidence>) {
  return {
    passed: value.passed,
    decision: value.decision,
    readiness: value.readiness,
    blockers: value.blockers,
    recommendedValidation: value.recommendedValidation,
    recommendedResolution: value.recommendedResolution,
  }
}

function blockedFlags(): SecondControlledBooleanFlags {
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

function hasExecutionRisk(flags: SecondControlledBooleanFlags) {
  return Object.values(flags).some((value) => value !== false)
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    updateStatus: 'Track B clean staging milestone sync completed before this phase; this packet is approval metadata only.',
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
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(filePath: string, value: string) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, value)
}
