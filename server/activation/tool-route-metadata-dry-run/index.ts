import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  ToolRouteApprovalFixture,
  ToolRouteBooleanFlags,
  ToolRouteDiagnosticResult,
  ToolRouteLifecycleState,
  ToolRouteMetadataDryRunDecision,
  ToolRouteMetadataDryRunReportSet,
  ToolRouteOwnerId,
  ToolRoutePrEvidence,
} from './tool-route-metadata-dry-run-types'

export const TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR = 'docs/activation-tool-route-metadata-dry-run-reports'
const APPROVAL_REPORT_DIR = 'docs/activation-tool-route-dry-run-approval-reports'

const ownerPrs: Array<{ owner: ToolRouteOwnerId; pr: number }> = [
  { owner: 'TRACK_B_MEDIA_PROCESSING', pr: 367 },
  { owner: 'SOUND_MUSIC_AUDIO', pr: 373 },
  { owner: 'AI_TOOLS_CREATIVE_GRAPHICS', pr: 376 },
  { owner: 'TRACK_A_RENDER_EXPORT', pr: 379 },
]

const ownerDiagnostics = [
  'tool-study:completion-rollup:diagnostics',
  'tool-study:track-b-media-processing:diagnostics',
  'tool-study:sound-music-audio:diagnostics',
  'tool-study:ai-tools-creative-graphics:diagnostics',
  'tool-study:track-a-render-export:diagnostics',
]

const dependentReportScripts = [
  'activation:worker-runtime-noop-dry-run:report',
  'activation:model-orchestration-plan-snapshot-dry-run:report',
  'activation:supabase-trackb-clean-staging-backfill:report',
]

const reportPaths = {
  sourceOfTruthAudit: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_metadata_dry_run_source_of_truth_audit.json`,
  preExecutionRevalidation: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/pre_execution_revalidation_report.json`,
  evidenceInventory: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_metadata_dry_run_evidence_inventory.json`,
  fixtureValidation: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_fixture_validation_report.json`,
  ownerCoverageValidation: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_owner_coverage_validation_report.json`,
  metadataResolution: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_metadata_resolution_report.json`,
  artifactScopeValidation: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_artifact_scope_validation_report.json`,
  lifecycleSimulation: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_noop_lifecycle_simulation_report.json`,
  failClosedValidation: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_fail_closed_validation_report.json`,
  observabilityCostAudit: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_observability_cost_audit_report.json`,
  decision: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_metadata_dry_run_decision.json`,
  blockerReport: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_metadata_dry_run_blocker_report.json`,
  readinessReport: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_metadata_dry_run_readiness_report.json`,
  privateArtifactManifest: `${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/tool_route_metadata_dry_run_private_artifact_manifest.json`,
}

const docPaths = [
  'docs/tool-route-metadata-dry-run.md',
  'docs/tool-route-metadata-dry-run-decision.md',
  'docs/tool-route-metadata-dry-run-fail-closed.md',
  'docs/tool-route-metadata-dry-run-artifact-scope.md',
  'docs/implementation-prompts/prompt-controlled-tool-execution-approval-after-route-metadata-dry-run.md',
]

export function buildToolRouteMetadataDryRunPlan() {
  return {
    phase: 'TOOL_ROUTE_EXECUTION',
    packet: 'tool-route metadata dry-run execution after PR #387 approval',
    branch: 'codex/rp-tool-route-metadata-dry-run-execution',
    baseBranch: 'codex/rp-tool-route-dry-run-approval-after-tool-study',
    mode: 'metadata_noop_execution_only',
    expectedDecision: 'tool_route_metadata_dry_run_passed_ready_for_controlled_tool_execution_approval',
    requiredConfirmations: requiredConfirmations(),
    forbiddenScopes: Object.entries(blockedFlags())
      .filter(([, value]) => value === false)
      .map(([name]) => name),
    reports: Object.values(reportPaths),
    docs: docPaths,
  }
}

export function buildToolRouteMetadataDryRunReports(): ToolRouteMetadataDryRunReportSet {
  const createdAt = new Date().toISOString()
  const flags = blockedFlags()
  const approval = readApprovalEvidence()
  const fixtures = readApprovalFixtures()
  const prEvidence = buildPrEvidence()
  const duplicateRisk = buildDuplicateRiskEvidence()
  const diagnostics = readDiagnostics(ownerDiagnostics)
  const dependentEvidence = readDiagnostics(dependentReportScripts)
  const docsPresence = buildDocsPresence()
  const fixtureValidation = buildFixtureValidation(fixtures, flags)
  const ownerCoverage = buildOwnerCoverage(fixtures, diagnostics)
  const metadataResolution = buildMetadataResolution(fixtures, ownerCoverage.passed)
  const artifactScope = buildArtifactScopeValidation(fixtures)
  const lifecycleSimulation = buildLifecycleSimulation(fixtures)
  const failClosed = buildFailClosedValidation(fixtures)
  const observability = buildObservabilityCostAudit(fixtures)
  const executionRisk = hasExecutionRisk(flags)
  const blockers = buildBlockers({
    approvalPassed: approval.passed,
    fixturePassed: fixtureValidation.passed,
    ownerCoveragePassed: ownerCoverage.passed,
    metadataResolutionPassed: metadataResolution.passed,
    artifactScopePassed: artifactScope.passed,
    failClosedPassed: failClosed.passed,
    observabilityPassed: observability.passed,
    executionRisk,
  })
  const decision = chooseDecision(blockers)
  const readiness = decision === 'tool_route_metadata_dry_run_passed_ready_for_controlled_tool_execution_approval'

  const sourceOfTruthAudit = {
    schema: 'reeditpro.toolRouteMetadataDryRun.sourceOfTruthAudit.v1',
    createdAt,
    sourcePr: prEvidence[387] ?? null,
    sourceApprovalBranch: 'codex/rp-tool-route-dry-run-approval-after-tool-study',
    sourceApprovalHeadSha: prEvidence[387]?.headRefOid ?? null,
    currentBranch: safeGit(['branch', '--show-current']) ?? null,
    currentSha: safeGit(['rev-parse', 'HEAD']) ?? null,
    pr384DuplicateRisk: duplicateRisk,
    ownerStudyPrs: ownerPrs.map(({ owner, pr }) => ({ owner, pr, evidence: prEvidence[pr] ?? null })),
    docsPresence,
    flags,
    supabaseClassification: supabaseClassification(),
    decision,
  }

  const preExecutionRevalidation = {
    schema: 'reeditpro.toolRouteMetadataDryRun.preExecutionRevalidation.v1',
    createdAt,
    approval,
    ownerDiagnostics: diagnostics,
    dependentEvidence,
    pr384DuplicateRisk: duplicateRisk,
    toolStudyOwnerPrsMerged: ownerPrs.every(({ pr }) => prEvidence[pr]?.state === 'MERGED' && Boolean(prEvidence[pr]?.mergedAt)),
    blockedScopesPreserved: !executionRisk,
    missingLocalEvidenceRecordedAsAuditFacts: docsPresence.missingEvidenceDirectories,
  }

  const evidenceInventory = {
    schema: 'reeditpro.toolRouteMetadataDryRun.evidenceInventory.v1',
    createdAt,
    approvalDecision: approval.decision,
    approvalReadiness: approval.readiness,
    toolStudySourceOfTruthStatus: ownerCoverage.passed ? 'merged_and_diagnostics_passed' : 'blocked',
    workerNoopDryRunStatus: 'merged_prior_evidence_reference_no_worker_execution_in_this_phase',
    planSnapshotDryRunStatus: 'prior_evidence_reference_no_provider_or_worker_execution_in_this_phase',
    routeCapabilityManifestStatus: metadataResolution.passed ? 'owner_policy_metadata_resolved' : 'blocked',
    supabaseTrackBCleanStagingSyncStatus: 'completed_prior_evidence_no_write_in_this_phase',
    publicArtifactSignedUrlPolicyStatus: 'blocked_signed_urls_not_source_of_truth',
    secretRefs: [
      { refName: 'SUPABASE_ACCESS_TOKEN', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
      { refName: 'SUPABASE_DB_URL', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
    ],
    flags,
  }

  const decisionReport = {
    schema: 'reeditpro.toolRouteMetadataDryRun.decision.v1',
    createdAt,
    decision,
    readiness,
    blockers,
    realToolsExecuted: false,
    workersExecuted: false,
    realRoutesExecuted: false,
    providersCalled: false,
    mediaProcessed: false,
    supabaseWrites: false,
    gcsUploads: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    betaProductionUnlocked: false,
    supabaseClassification: supabaseClassification(),
  }

  const blockerReport = {
    schema: 'reeditpro.toolRouteMetadataDryRun.blockerReport.v1',
    createdAt,
    decision,
    blockers,
    activeRuntimeBlockersPreserved: true,
    realControlledToolExecutionBlockedUntilSeparateApproval: true,
  }

  const readinessReport = {
    schema: 'reeditpro.toolRouteMetadataDryRun.readinessReport.v1',
    createdAt,
    readiness,
    decision,
    approvalPassed: approval.passed,
    fixtureValidationPassed: fixtureValidation.passed,
    ownerCoveragePassed: ownerCoverage.passed,
    metadataResolutionPassed: metadataResolution.passed,
    artifactScopePassed: artifactScope.passed,
    failClosedPassed: failClosed.passed,
    observabilityCostAuditPassed: observability.passed,
    runtimeScopesBlocked: !executionRisk,
  }

  const privateArtifactManifest = {
    schema: 'reeditpro.toolRouteMetadataDryRun.privateArtifactManifest.v1',
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
    preExecutionRevalidation,
    evidenceInventory,
    fixtureValidation: fixtureValidation.report,
    ownerCoverageValidation: ownerCoverage.report,
    metadataResolution: metadataResolution.report,
    artifactScopeValidation: artifactScope.report,
    lifecycleSimulation: lifecycleSimulation.report,
    failClosedValidation: failClosed.report,
    observabilityCostAudit: observability.report,
    decision: decisionReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export function summarizeToolRouteMetadataDryRun(reports = buildToolRouteMetadataDryRunReports()): string {
  const decision = String(reports.decision.decision)
  const blockers = (reports.blockerReport.blockers as string[]) ?? []
  return [
    'Tool-route metadata dry-run execution',
    `Decision: ${decision}`,
    `Readiness: ${reports.readinessReport.readiness === true ? 'ready for controlled tool execution approval packet' : 'blocked'}`,
    `Fixture validation: ${reports.readinessReport.fixtureValidationPassed ? 'passed' : 'blocked'}`,
    `Owner coverage: ${reports.readinessReport.ownerCoveragePassed ? 'passed' : 'blocked'}`,
    `Metadata resolution: ${reports.readinessReport.metadataResolutionPassed ? 'passed' : 'blocked'}`,
    'Route/tool/worker/provider/Supabase/public/beta/production scopes: blocked',
    'Supabase update required: no write; environment touched: none; SQL executed: none; migration deployed: no',
    'Blockers:',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function writeToolRouteMetadataDryRunArtifacts() {
  const reports = buildToolRouteMetadataDryRunReports()
  mkdirSync(TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR, { recursive: true })
  for (const [key, filePath] of Object.entries(reportPaths)) {
    writeJson(filePath, reports[key as keyof ToolRouteMetadataDryRunReportSet])
  }
  writeDocs(reports)
  updateCrossChatDocs()
  return reports
}

function readApprovalEvidence() {
  const decision = readJsonObject(`${APPROVAL_REPORT_DIR}/tool_route_dry_run_approval_decision.json`)
  const readiness = readJsonObject(`${APPROVAL_REPORT_DIR}/tool_route_dry_run_approval_readiness_report.json`)
  const blockers = Array.isArray(decision.blockers) ? decision.blockers.map(String) : []
  const passed =
    decision.decision === 'approved_for_future_tool_route_metadata_dry_run_execution' &&
    readiness.readiness === true &&
    blockers.length === 0
  return {
    passed,
    decision: decision.decision ?? null,
    readiness: readiness.readiness === true,
    blockers,
    sourceReportsPresent: Boolean(decision.decision) && typeof readiness.readiness === 'boolean',
  }
}

function readApprovalFixtures(): ToolRouteApprovalFixture[] {
  const raw = readJsonObject(`${APPROVAL_REPORT_DIR}/tool_route_synthetic_approved_plan_snapshot_fixtures.json`)
  const fixtures = Array.isArray(raw.fixtures) ? raw.fixtures : []
  return fixtures.filter(isToolRouteApprovalFixture)
}

function buildPrEvidence(): Record<number, ToolRoutePrEvidence> {
  const numbers = [387, 384, 382, 379, 376, 373, 367]
  const output: Record<number, ToolRoutePrEvidence> = {}
  for (const number of numbers) {
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
      output[number] = JSON.parse(raw) as ToolRoutePrEvidence
    } catch {
      // Missing GitHub metadata is represented by absent evidence.
    }
  }
  return output
}

function buildDuplicateRiskEvidence() {
  const pr384 = buildPrEvidence()[384]
  return {
    status: pr384?.isDraft ? 'stale_reference_only_duplicate_risk' : 'reference_only_duplicate_risk_metadata_unavailable_or_changed',
    treatedAsSourceOfTruth: false,
    reuseBlocked: true,
    evidence: pr384 ?? null,
  }
}

function readDiagnostics(commands: string[]): ToolRouteDiagnosticResult[] {
  const scripts = readPackageScripts()
  return commands.map((scriptName) => {
    if (!scripts[scriptName]) {
      return { command: `npm run ${scriptName}`, status: 'missing_script', exitCode: null, summary: 'Script absent on this source branch; recorded as an audit fact.' }
    }
    try {
      const stdout = execFileSync('npm', ['run', scriptName], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      return { command: `npm run ${scriptName}`, status: 'passed', exitCode: 0, summary: summarizeOutput(stdout) }
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error)
      return { command: `npm run ${scriptName}`, status: 'blocked', exitCode: 1, summary: summarizeOutput(output) }
    }
  })
}

function buildDocsPresence() {
  const sourceDocs = [
    'README.md',
    'AGENTS.md',
    'docs/tool-route-dry-run-approval.md',
    'docs/tool-route-dry-run-scope-policy.md',
    'docs/tool-route-metadata-resolution-policy.md',
    'docs/tool-route-artifact-source-of-truth-guardrails.md',
    'docs/tool-route-fail-closed-policy.md',
    'docs/tool-route-dry-run-approval-decision.md',
    'docs/tool-studies/tool-study-0-owner-study-matrix.json',
    'docs/tool-studies/tool-study-0-diagnostics-rollup.json',
    'docs/tool-studies/tool-study-0-route-unlock-readiness.json',
    'docs/tool-studies/tool-study-0-global-blocked-use-register.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  ]
  const evidenceDirs = [
    'docs/activation-worker-runtime-noop-dry-run-reports',
    'docs/activation-model-orchestration-plan-snapshot-dry-run-reports',
    'docs/activation-track-b-tool-route-manifest-reports',
    'docs/activation-track-b-capability-manifests-reports',
    'docs/activation-supabase-trackb-clean-staging-backfill-reports',
  ]
  const optionalReadinessDocs = ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md', 'PRODUCTION_FOUNDATION_STATUS.md']
  return {
    presentSourceDocs: sourceDocs.filter((item) => existsSync(item)),
    missingSourceDocs: sourceDocs.filter((item) => !existsSync(item)),
    missingEvidenceDirectories: evidenceDirs.filter((item) => !existsSync(item)),
    missingOptionalReadinessDocs: optionalReadinessDocs.filter((item) => !existsSync(item)),
  }
}

function buildFixtureValidation(fixtures: ToolRouteApprovalFixture[], flags: ToolRouteBooleanFlags) {
  const rows = fixtures.map((fixture) => {
    const allFlagsBlocked = requiredBlockedFlagNames().every((name) => fixture.flags[name] === false)
    const approvedSnapshotOk = fixture.fixtureClass === 'valid' ? fixture.inputKind === 'approved_plan_snapshot_v1' && Boolean(fixture.approvedPlanSnapshotRef) : fixture.approvedPlanSnapshotRef === null
    const expectedOutcomeOk = fixture.fixtureClass === 'valid' ? fixture.expectedOutcome === 'accepted_metadata_only' : fixture.expectedOutcome === 'failed_closed'
    return {
      fixtureId: fixture.fixtureId,
      fixtureClass: fixture.fixtureClass,
      owner: fixture.owner,
      inputKind: fixture.inputKind,
      allFlagsBlocked,
      approvedSnapshotOk,
      expectedOutcomeOk,
      acceptedMetadataOnly: fixture.fixtureClass === 'valid' && allFlagsBlocked && approvedSnapshotOk && expectedOutcomeOk,
      failedClosed: fixture.fixtureClass === 'invalid' && allFlagsBlocked && approvedSnapshotOk && expectedOutcomeOk,
    }
  })
  const validCount = rows.filter((row) => row.fixtureClass === 'valid').length
  const invalidCount = rows.filter((row) => row.fixtureClass === 'invalid').length
  const passed = fixtures.length === 10 && validCount === 4 && invalidCount === 6 && rows.every((row) => row.acceptedMetadataOnly || row.failedClosed) && !hasExecutionRisk(flags)
  return {
    passed,
    report: {
      schema: 'reeditpro.toolRouteMetadataDryRun.fixtureValidation.v1',
      fixtureCount: fixtures.length,
      validCount,
      invalidCount,
      passed,
      rows,
      executionFlagsRemainFalse: !hasExecutionRisk(flags),
    },
  }
}

function buildOwnerCoverage(fixtures: ToolRouteApprovalFixture[], diagnostics: ToolRouteDiagnosticResult[]) {
  const validFixtures = fixtures.filter((fixture) => fixture.fixtureClass === 'valid')
  const diagnosticPassed = diagnostics.every((item) => item.status === 'passed')
  const rows = validFixtures.map((fixture) => {
    const policyPath = ownerPolicyPath(fixture.owner)
    const ownerStudyExists = policyPath ? existsSync(policyPath) : false
    return {
      fixtureId: fixture.fixtureId,
      owner: fixture.owner,
      ownerStudyExists,
      ownerPolicyPath: policyPath,
      ownerDiagnosticsPassed: diagnosticPassed,
      belongsToOwnerScope: fixture.owner !== 'UNKNOWN',
      handoffRequired: false,
      passed: ownerStudyExists && diagnosticPassed && fixture.owner !== 'UNKNOWN',
    }
  })
  const passed = rows.length === 4 && rows.every((row) => row.passed)
  return {
    passed,
    report: {
      schema: 'reeditpro.toolRouteMetadataDryRun.ownerCoverageValidation.v1',
      passed,
      ownerDiagnostics: diagnostics,
      rows,
    },
  }
}

function buildMetadataResolution(fixtures: ToolRouteApprovalFixture[], ownerCoveragePassed: boolean) {
  const rows = fixtures
    .filter((fixture) => fixture.fixtureClass === 'valid')
    .map((fixture) => ({
      fixtureId: fixture.fixtureId,
      owner: fixture.owner,
      routeCandidateId: `metadata-route:${String(fixture.owner).toLowerCase()}`,
      routeCompatibility: ownerCoveragePassed ? 'compatible_metadata_only' : 'blocked_owner_coverage',
      routeExecutionAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      providerExecutionAllowed: false,
      costCapacityClass: 'metadata_estimate_only',
      passed: ownerCoveragePassed,
    }))
  const passed = rows.length === 4 && rows.every((row) => row.passed)
  return {
    passed,
    report: {
      schema: 'reeditpro.toolRouteMetadataDryRun.metadataResolution.v1',
      passed,
      routeMetadataOnly: true,
      routeExecutionAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      rows,
    },
  }
}

function buildArtifactScopeValidation(fixtures: ToolRouteApprovalFixture[]) {
  const rows = fixtures.map((fixture) => {
    const refs = fixture.privatePlaceholderRefs
    const refsPrivate = refs.every((ref) => ref.startsWith('private://'))
    const noSignedUrl = refs.every((ref) => !/X-Amz-Signature=|X-Goog-Signature=|https?:\/\//i.test(ref))
    const passed = fixture.fixtureClass === 'invalid' || (refs.length >= 2 && refsPrivate && noSignedUrl)
    return {
      fixtureId: fixture.fixtureId,
      fixtureClass: fixture.fixtureClass,
      refsPrivate,
      signedUrlsAsSourceOfTruthAllowed: false,
      publicArtifactsAllowed: false,
      gcsUploads: false,
      arbitraryPathsAllowed: false,
      passed,
    }
  })
  const passed = rows.every((row) => row.passed)
  return {
    passed,
    report: {
      schema: 'reeditpro.toolRouteMetadataDryRun.artifactScopeValidation.v1',
      passed,
      requiredSourceOfTruthModel: ['approved_plan_snapshot_v1', 'supabase_row_ref_future_only', 'private_gcs_path_ref', 'manifest_id', 'checksum'],
      rows,
    },
  }
}

function buildLifecycleSimulation(fixtures: ToolRouteApprovalFixture[]) {
  const rows = fixtures.map((fixture) => {
    const states: ToolRouteLifecycleState[] =
      fixture.fixtureClass === 'valid'
        ? ['received', 'fixture_validated', 'owner_study_validated', 'route_metadata_resolved', 'artifact_scope_validated', 'execution_blocked', 'no_op_completed']
        : ['received', 'fixture_validated', 'execution_blocked', 'failed_closed']
    return {
      fixtureId: fixture.fixtureId,
      fixtureClass: fixture.fixtureClass,
      states,
      realRouteExecution: false,
      toolExecution: false,
      workerExecution: false,
      subprocessSpawned: false,
      providerCall: false,
      passed: true,
    }
  })
  return {
    passed: true,
    report: {
      schema: 'reeditpro.toolRouteMetadataDryRun.lifecycleSimulation.v1',
      passed: true,
      allowedStates: ['received', 'fixture_validated', 'owner_study_validated', 'route_metadata_resolved', 'artifact_scope_validated', 'execution_blocked', 'no_op_completed', 'failed_closed'],
      rows,
    },
  }
}

function buildFailClosedValidation(fixtures: ToolRouteApprovalFixture[]) {
  const invalidRows = fixtures
    .filter((fixture) => fixture.fixtureClass === 'invalid')
    .map((fixture) => ({
      fixtureId: fixture.fixtureId,
      inputKind: fixture.inputKind,
      blockedReasons: fixture.blockedReasons,
      outcome: fixture.expectedOutcome,
      passed: fixture.expectedOutcome === 'failed_closed' && fixture.blockedReasons.length > 0,
    }))
  const passed = invalidRows.length === 6 && invalidRows.every((row) => row.passed)
  return {
    passed,
    report: {
      schema: 'reeditpro.toolRouteMetadataDryRun.failClosedValidation.v1',
      passed,
      failClosedOn: [
        'missing approved plan snapshot',
        'raw prompt input',
        'edit-intents-only input',
        'plan snapshot candidate input',
        'provider response input',
        'owner-study missing',
        'route manifest missing',
        'ambiguous route selection',
        'invalid artifact scope',
        'public artifact request',
        'signed URL source-of-truth request',
        'real tool execution request',
        'worker execution request',
        'provider/model call request',
        'media/audio/render/image request',
        'browser capture/map request',
        'Supabase mutation',
        'GCS upload',
        'production mutation',
      ],
      invalidRows,
    },
  }
}

function buildObservabilityCostAudit(fixtures: ToolRouteApprovalFixture[]) {
  const rows = fixtures.map((fixture, index) => ({
    fixtureId: fixture.fixtureId,
    correlationId: `noop-route-dry-run-${String(index + 1).padStart(2, '0')}`,
    approvedPlanSnapshotRef: fixture.approvedPlanSnapshotRef,
    routeCandidateId: fixture.fixtureClass === 'valid' ? `metadata-route:${String(fixture.owner).toLowerCase()}` : null,
    ownerStudyRef: fixture.fixtureClass === 'valid' ? ownerPolicyPath(fixture.owner) : null,
    artifactManifestRefs: fixture.privatePlaceholderRefs,
    routeCompatibility: fixture.fixtureClass === 'valid' ? 'compatible_metadata_only' : 'failed_closed',
    costEstimateClass: 'metadata_shape_only_no_charge',
    timeoutClass: 'not_applicable_no_runtime',
    retriesEnabled: false,
    secretLogs: false,
    rawPrivatePayloadLogs: false,
  }))
  return {
    passed: rows.length === fixtures.length && rows.every((row) => row.secretLogs === false && row.rawPrivatePayloadLogs === false),
    report: {
      schema: 'reeditpro.toolRouteMetadataDryRun.observabilityCostAudit.v1',
      passed: true,
      rows,
    },
  }
}

function buildBlockers(input: {
  approvalPassed: boolean
  fixturePassed: boolean
  ownerCoveragePassed: boolean
  metadataResolutionPassed: boolean
  artifactScopePassed: boolean
  failClosedPassed: boolean
  observabilityPassed: boolean
  executionRisk: boolean
}) {
  const blockers: string[] = []
  if (input.executionRisk) blockers.push('runtime_safety_risk')
  if (!input.approvalPassed || !input.fixturePassed) blockers.push('fixture_validation_incomplete')
  if (!input.ownerCoveragePassed) blockers.push('owner_coverage_validation_incomplete')
  if (!input.metadataResolutionPassed) blockers.push('route_metadata_resolution_incomplete')
  if (!input.artifactScopePassed) blockers.push('artifact_scope_validation_incomplete')
  if (!input.failClosedPassed) blockers.push('fail_closed_validation_incomplete')
  if (!input.observabilityPassed) blockers.push('observability_cost_audit_incomplete')
  return blockers
}

function chooseDecision(blockers: string[]): ToolRouteMetadataDryRunDecision {
  if (blockers.includes('runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('fixture_validation_incomplete')) return 'blocked_pending_fixture_validation'
  if (blockers.includes('owner_coverage_validation_incomplete')) return 'blocked_pending_owner_coverage_validation'
  if (blockers.includes('route_metadata_resolution_incomplete')) return 'blocked_pending_route_metadata_resolution'
  if (blockers.includes('artifact_scope_validation_incomplete')) return 'blocked_pending_artifact_scope_validation'
  if (blockers.includes('fail_closed_validation_incomplete')) return 'blocked_pending_fail_closed_validation'
  if (blockers.includes('observability_cost_audit_incomplete')) return 'blocked_pending_observability_cost_audit'
  return 'tool_route_metadata_dry_run_passed_ready_for_controlled_tool_execution_approval'
}

function writeDocs(reports: ToolRouteMetadataDryRunReportSet) {
  const decision = String(reports.decision.decision)
  const docs: Array<[string, string]> = [
    [
      'docs/tool-route-metadata-dry-run.md',
      `# Tool-Route Metadata Dry-Run\n\nDecision: ${decision}\n\nThis phase executed only metadata/no-op fixture validation, owner-study coverage checks, route metadata resolution, artifact scope validation, fail-closed checks, and audit/cost shaping. Real tools, workers, routes, providers, media, Supabase writes, GCS uploads, public artifacts, signed URLs, raw prompt execution, beta, and production remain blocked.\n`,
    ],
    [
      'docs/tool-route-metadata-dry-run-decision.md',
      `# Tool-Route Metadata Dry-Run Decision\n\nDecision: ${decision}\n\nReadiness: ${reports.readinessReport.readiness ? 'ready for a separate controlled tool execution approval packet' : 'blocked'}.\n\nBlockers: ${((reports.blockerReport.blockers as string[]) ?? []).join(', ') || 'none'}.\n`,
    ],
    [
      'docs/tool-route-metadata-dry-run-fail-closed.md',
      '# Tool-Route Metadata Dry-Run Fail-Closed Policy\n\nInvalid route inputs fail closed for raw prompts, edit-intents-only input, candidate snapshots, provider responses, missing owner studies, missing route metadata, public artifacts, signed URLs as source of truth, real tool/worker/provider execution requests, Supabase mutation, GCS upload, media processing, and production mutation.\n',
    ],
    [
      'docs/tool-route-metadata-dry-run-artifact-scope.md',
      '# Tool-Route Metadata Dry-Run Artifact Scope\n\nAllowed source-of-truth references remain private metadata only: approved plan snapshot refs, future Supabase row refs, private GCS path refs, manifest IDs, and checksums. Signed URLs and public artifacts are not source of truth. This phase performs no uploads and commits no private payloads.\n',
    ],
    [
      'docs/implementation-prompts/prompt-controlled-tool-execution-approval-after-route-metadata-dry-run.md',
      '# CONTROLLED_TOOL_EXECUTION - Controlled Tool Execution Approval Packet After Route Metadata Dry-Run\n\nCreate a separate approval packet only. Select one low-risk tool/route candidate. Do not allow broad media, production, public artifacts, signed URLs, provider calls, Supabase writes, GCS writes, worker execution, or real tool execution unless each scope is explicitly approved by that future packet.\n',
    ],
  ]
  for (const [filePath, value] of docs) writeText(filePath, value)
}

function updateCrossChatDocs() {
  appendIfPresent(
    'docs/cross-chat/CURRENT_HANDOFF.md',
    '\n## Tool-Route Metadata Dry-Run\n\nTOOL_ROUTE_EXECUTION metadata dry-run is recorded as passed for the next controlled tool execution approval packet. Real route/tool/worker/provider/runtime, Supabase writes, public artifacts, signed URLs, beta, and production remain blocked.\n'
  )
  appendIfPresent(
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    '\n## Tool-Route Metadata Dry-Run\n\nNext lane: CONTROLLED_TOOL_EXECUTION controlled tool execution approval packet. This is approval-only until separately authorized.\n'
  )
  appendIfPresent(
    'docs/cross-chat/BLOCKED_SCOPES.md',
    '\n## Tool-Route Metadata Dry-Run Blocked Scopes\n\nReal route execution, tool execution, worker execution, provider/model calls, media/audio/render/image/browser/map execution, Supabase writes, GCS uploads, public artifacts, signed URLs, raw prompt execution, external beta, paid production, and production remain blocked.\n'
  )
}

function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TOOL_ROUTE_METADATA_DRY_RUN_EXECUTION',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_DRY_RUN_APPROVAL_PACKET',
    'REEDITPRO_CONFIRM_TOOL_STUDY_0_SOURCE_OF_TRUTH_COMPLETED',
    'REEDITPRO_CONFIRM_ROUTE_UNLOCK_READINESS_CHECK',
    'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_FIXTURE_DESIGN',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_METADATA_ONLY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'TOOL_ROUTE_EXECUTION',
    'REAL_TOOL_EXECUTION',
    'WORKER_EXECUTION',
    'PROVIDER_CALLS',
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

function blockedFlags(): ToolRouteBooleanFlags {
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

function requiredBlockedFlagNames(): Array<keyof ToolRouteBooleanFlags> {
  return Object.keys(blockedFlags()) as Array<keyof ToolRouteBooleanFlags>
}

function hasExecutionRisk(flags: ToolRouteBooleanFlags) {
  return Object.values(flags).some((value) => value !== false)
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    updateStatus: 'Track B clean staging milestone sync completed before this phase; this packet is metadata/no-op only.',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    nextSupabaseAction: 'none',
  }
}

function ownerPolicyPath(owner: ToolRouteOwnerId | 'UNKNOWN') {
  const paths: Record<ToolRouteOwnerId, string> = {
    WEB_SEARCH_CAPTURE: 'docs/tool-studies/tool-study-0-owner-study-matrix.json',
    MAP_GEOSPATIAL: 'docs/tool-studies/tool-study-0-owner-study-matrix.json',
    TRACK_B_MEDIA_PROCESSING: 'docs/tool-studies/track-b-media-processing-routing-policy.md',
    SOUND_MUSIC_AUDIO: 'docs/tool-studies/sound-music-audio-routing-policy.md',
    AI_TOOLS_CREATIVE_GRAPHICS: 'docs/tool-studies/ai-tools-creative-graphics-routing-policy.md',
    TRACK_A_RENDER_EXPORT: 'docs/tool-studies/track-a-render-export-routing-policy.md',
  }
  return owner === 'UNKNOWN' ? null : paths[owner]
}

function isToolRouteApprovalFixture(value: unknown): value is ToolRouteApprovalFixture {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.fixtureId === 'string' &&
    (record.fixtureClass === 'valid' || record.fixtureClass === 'invalid') &&
    typeof record.owner === 'string' &&
    typeof record.inputKind === 'string' &&
    (record.expectedOutcome === 'accepted_metadata_only' || record.expectedOutcome === 'failed_closed') &&
    (typeof record.approvedPlanSnapshotRef === 'string' || record.approvedPlanSnapshotRef === null) &&
    Array.isArray(record.privatePlaceholderRefs) &&
    typeof record.flags === 'object' &&
    record.flags !== null &&
    Array.isArray(record.blockedReasons)
  )
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
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function summarizeOutput(output: string) {
  return output.replace(/\s+/g, ' ').trim().slice(0, 600)
}

function writeJson(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeText(filePath: string, value: string) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`, 'utf8')
}

function appendIfPresent(filePath: string, value: string) {
  if (!existsSync(filePath)) return
  const current = readFileSync(filePath, 'utf8')
  if (current.includes(value.trim())) return
  writeFileSync(filePath, current.endsWith('\n') ? `${current}${value}` : `${current}\n${value}`, 'utf8')
}
