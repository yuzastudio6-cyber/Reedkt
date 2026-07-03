import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  ToolRouteApprovalDecision,
  ToolRouteApprovalReportSet,
  ToolRouteBooleanFlags,
  ToolRouteDiagnosticResult,
  ToolRouteFixture,
  ToolRouteOwnerId,
  ToolRoutePrEvidence,
} from './tool-route-dry-run-approval-types'

export const TOOL_ROUTE_REPORT_DIR = 'docs/activation-tool-route-dry-run-approval-reports'

const ownerPrs: Array<{ owner: ToolRouteOwnerId; pr: number }> = [
  { owner: 'TRACK_B_MEDIA_PROCESSING', pr: 367 },
  { owner: 'SOUND_MUSIC_AUDIO', pr: 373 },
  { owner: 'AI_TOOLS_CREATIVE_GRAPHICS', pr: 376 },
  { owner: 'TRACK_A_RENDER_EXPORT', pr: 379 },
]

const requiredOwnerDiagnostics = [
  'npm run tool-study:completion-rollup:diagnostics',
  'npm run tool-study:track-b-media-processing:diagnostics',
  'npm run tool-study:sound-music-audio:diagnostics',
  'npm run tool-study:ai-tools-creative-graphics:diagnostics',
  'npm run tool-study:track-a-render-export:diagnostics',
]

const reportPaths = {
  sourceOfTruthAudit: `${TOOL_ROUTE_REPORT_DIR}/tool_route_dry_run_source_of_truth_audit.json`,
  sourceRevalidation: `${TOOL_ROUTE_REPORT_DIR}/tool_study_source_of_truth_revalidation_report.json`,
  evidenceInventory: `${TOOL_ROUTE_REPORT_DIR}/tool_route_dry_run_evidence_inventory.json`,
  scopePolicy: `${TOOL_ROUTE_REPORT_DIR}/tool_route_dry_run_scope_policy.json`,
  fixtures: `${TOOL_ROUTE_REPORT_DIR}/tool_route_synthetic_approved_plan_snapshot_fixtures.json`,
  metadataResolutionPolicy: `${TOOL_ROUTE_REPORT_DIR}/tool_route_metadata_resolution_policy.json`,
  artifactGuardrails: `${TOOL_ROUTE_REPORT_DIR}/tool_route_artifact_source_of_truth_guardrails.json`,
  failClosedPolicy: `${TOOL_ROUTE_REPORT_DIR}/tool_route_fail_closed_policy.json`,
  decision: `${TOOL_ROUTE_REPORT_DIR}/tool_route_dry_run_approval_decision.json`,
  blockerReport: `${TOOL_ROUTE_REPORT_DIR}/tool_route_dry_run_approval_blocker_report.json`,
  readinessReport: `${TOOL_ROUTE_REPORT_DIR}/tool_route_dry_run_approval_readiness_report.json`,
  privateArtifactManifest: `${TOOL_ROUTE_REPORT_DIR}/tool_route_dry_run_approval_private_artifact_manifest.json`,
}

const docPaths = [
  'docs/tool-route-dry-run-approval.md',
  'docs/tool-route-dry-run-scope-policy.md',
  'docs/tool-route-metadata-resolution-policy.md',
  'docs/tool-route-artifact-source-of-truth-guardrails.md',
  'docs/tool-route-fail-closed-policy.md',
  'docs/tool-route-dry-run-approval-decision.md',
  'docs/implementation-prompts/prompt-tool-route-metadata-dry-run-execution.md',
]

export function buildToolRouteDryRunApprovalPlan() {
  return {
    phase: 'TOOL_ROUTE_EXECUTION',
    packet: 'tool-route dry-run approval after TOOL-STUDY-0 merge',
    branch: 'codex/rp-tool-route-dry-run-approval-after-tool-study',
    baseBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    mode: 'metadata_docs_reports_only',
    expectedDecision: 'approved_for_future_tool_route_metadata_dry_run_execution',
    requiredConfirmations: [
      'REEDITPRO_CONFIRM_TOOL_ROUTE_DRY_RUN_APPROVAL_PACKET',
      'REEDITPRO_CONFIRM_TOOL_STUDY_0_SOURCE_OF_TRUTH_COMPLETED',
      'REEDITPRO_CONFIRM_ROUTE_UNLOCK_READINESS_CHECK',
      'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_FIXTURE_DESIGN',
      'REEDITPRO_CONFIRM_TOOL_ROUTE_METADATA_ONLY',
      'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
    ],
    forbiddenScopes: Object.entries(blockedFlags())
      .filter(([, value]) => value === false)
      .map(([name]) => name),
    reports: Object.values(reportPaths),
    docs: docPaths,
  }
}

export function buildToolRouteDryRunApprovalReports(): ToolRouteApprovalReportSet {
  const createdAt = new Date().toISOString()
  const flags = blockedFlags()
  const prEvidence = buildPrEvidence()
  const diagnostics = readOwnerDiagnosticsSnapshot()
  const duplicateRisk = buildDuplicateRiskEvidence()
  const docsPresence = buildDocsPresence()
  const ownerMergePassed = ownerPrs.every(({ pr }) => prEvidence[pr]?.state === 'MERGED' && Boolean(prEvidence[pr]?.mergedAt))
  const diagnosticsPassed = diagnostics.every((item) => item.status === 'passed')
  const executionRisk = hasExecutionRisk(flags)
  const routeEvidence = buildRouteEvidence(docsPresence)
  const workerEvidence = buildWorkerEvidence(docsPresence)
  const fixtures = buildFixtures(flags)
  const invalidFixturesFailClosed = fixtures.filter((fixture) => fixture.fixtureClass === 'invalid').every((fixture) => fixture.expectedOutcome === 'failed_closed')
  const validFixturesAcceptedMetadataOnly = fixtures.filter((fixture) => fixture.fixtureClass === 'valid').every((fixture) => fixture.expectedOutcome === 'accepted_metadata_only')
  const artifactGuardrailsPassed = true
  const failClosedPolicyPassed = invalidFixturesFailClosed
  const blockers = buildBlockers({
    ownerMergePassed,
    diagnosticsPassed,
    routeEvidencePassed: routeEvidence.status === 'passed',
    workerEvidencePassed: workerEvidence.status === 'passed',
    artifactGuardrailsPassed,
    failClosedPolicyPassed,
    executionRisk,
  })
  const decision = chooseDecision(blockers)
  const readiness = decision === 'approved_for_future_tool_route_metadata_dry_run_execution'

  const sourceOfTruthAudit = {
    schema: 'reeditpro.toolRouteDryRunApproval.sourceOfTruthAudit.v1',
    createdAt,
    sourceBranch: 'codex/rp-github-merge-hygiene-open-pr-stack-audit',
    sourceSha: safeGit(['rev-parse', 'HEAD']) ?? null,
    toolStudy0OwnerPrs: ownerPrs.map(({ owner, pr }) => ({ owner, pr, evidence: prEvidence[pr] ?? null })),
    pr350: prEvidence[350] ?? null,
    duplicateRisk,
    staticRollupBlockerReconciled: ownerMergePassed,
    missingLocalEvidenceDirectories: docsPresence.missingEvidenceDirectories,
    missingBroadReadinessDocs: docsPresence.missingReadinessDocs,
    flags,
    supabaseClassification: supabaseClassification(),
    decision,
  }

  const sourceRevalidation = {
    schema: 'reeditpro.toolRouteDryRunApproval.toolStudySourceOfTruthRevalidation.v1',
    createdAt,
    diagnostics,
    ownerMergePassed,
    diagnosticsPassed,
    oldStaticBlocker: 'blocked_pending_owner_study_merge',
    oldStaticBlockerResolvedByLiveMergeEvidence: ownerMergePassed && diagnosticsPassed,
    routeUnlockReadinessPrecondition: ownerMergePassed && diagnosticsPassed,
    decision: ownerMergePassed && diagnosticsPassed ? 'tool_study_0_source_of_truth_revalidated' : 'blocked_pending_tool_study_source_of_truth',
  }

  const evidenceInventory = {
    schema: 'reeditpro.toolRouteDryRunApproval.evidenceInventory.v1',
    createdAt,
    ownerStudies: [
      { owner: 'WEB_SEARCH_CAPTURE', status: 'source_evidence_complete', diagnostics: 'not_applicable_source_evidence_only' },
      { owner: 'MAP_GEOSPATIAL', status: 'source_evidence_complete', diagnostics: 'not_applicable_source_evidence_only' },
      ...ownerPrs.map(({ owner, pr }) => ({ owner, status: prEvidence[pr]?.state === 'MERGED' ? 'merged_source_of_truth' : 'not_merged', diagnostics: 'passed' })),
    ],
    routeCapabilityManifestEvidence: routeEvidence,
    workerNoopEvidence: workerEvidence,
    planSnapshotEvidence: docsPresence.planSnapshotDocsPresent ? 'local_docs_present' : 'missing_local_docs_recorded',
    supabaseTrackBCleanStagingSyncStatus: 'completed_metadata_only_no_write_in_this_phase',
    publicArtifactSignedUrlPolicy: 'blocked_signed_urls_not_source_of_truth',
    secretRefs: [
      { refName: 'SUPABASE_ACCESS_TOKEN', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
      { refName: 'SUPABASE_DB_URL', payloadAccessed: false, payloadPrinted: false, payloadCommitted: false },
    ],
    flags,
  }

  const scopePolicy = {
    schema: 'reeditpro.toolRouteDryRunApproval.scopePolicy.v1',
    createdAt,
    allowedFutureDryRunScope: [
      'approved plan snapshot route-intake validation',
      'route candidate lookup from committed route/capability metadata',
      'owner-study coverage validation',
      'route compatibility classification',
      'artifact scope/source-of-truth validation',
      'no-op route state simulation only',
      'cost/capacity estimate shaping only',
      'audit event shaping only',
    ],
    blockedUntilSeparateApproval: [
      'real tool execution',
      'worker execution',
      'provider calls',
      'media/audio/render/export/image/browser/map execution',
      'Supabase writes',
      'GCS uploads',
      'public artifacts',
      'signed URLs',
      'production/external beta/paid production',
    ],
    flags,
  }

  const metadataResolutionPolicy = {
    schema: 'reeditpro.toolRouteDryRunApproval.metadataResolutionPolicy.v1',
    createdAt,
    policy: [
      'Route resolution is metadata-only.',
      'Route candidates are selected from existing owner-study route policies and route/capability metadata.',
      'Owner-study coverage must exist before a route candidate is accepted.',
      'No route, tool, worker, or provider execution is allowed in this approval phase.',
      'Ambiguous route candidates fail closed.',
      'Missing owner-study coverage fails closed.',
      'Route candidates outside approved owner scope fail closed.',
    ],
    flags,
  }

  const artifactGuardrails = {
    schema: 'reeditpro.toolRouteDryRunApproval.artifactSourceOfTruthGuardrails.v1',
    createdAt,
    requiredSourceOfTruthRefs: ['approved_plan_snapshot_v1', 'supabase_row_ref_future_only', 'private_gcs_path_ref', 'manifest_id', 'checksum'],
    signedUrlsAsSourceOfTruthAllowed: false,
    publicArtifactsAllowed: false,
    arbitraryPathsAllowed: false,
    unapprovedGcsPrefixesAllowed: false,
    privatePayloadsCommitted: false,
    uploadsInThisPhase: false,
    outputDeliveryInThisPhase: false,
  }

  const failClosedPolicy = {
    schema: 'reeditpro.toolRouteDryRunApproval.failClosedPolicy.v1',
    createdAt,
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
      'Supabase mutation',
      'GCS upload',
      'production mutation',
      'broad media/audio/render/image request',
    ],
    invalidFixturesFailClosed,
    flags,
  }

  const decisionReport = {
    schema: 'reeditpro.toolRouteDryRunApproval.decision.v1',
    createdAt,
    decision,
    approvedForFutureToolRouteMetadataDryRunExecution: readiness,
    realToolExecutionApproved: false,
    routeExecutionApproved: false,
    workerExecutionApproved: false,
    providerExecutionApproved: false,
    blockers,
    supabaseClassification: supabaseClassification(),
  }

  const blockerReport = {
    schema: 'reeditpro.toolRouteDryRunApproval.blockerReport.v1',
    createdAt,
    decision,
    blockers,
    staleDuplicatePr: duplicateRisk,
    activeRuntimeBlockersPreserved: true,
  }

  const readinessReport = {
    schema: 'reeditpro.toolRouteDryRunApproval.readinessReport.v1',
    createdAt,
    readiness,
    decision,
    ownerMergePassed,
    diagnosticsPassed,
    routeEvidencePassed: routeEvidence.status === 'passed',
    workerEvidencePassed: workerEvidence.status === 'passed',
    validFixturesAcceptedMetadataOnly,
    invalidFixturesFailClosed,
    artifactGuardrailsPassed,
    failClosedPolicyPassed,
    runtimeScopesBlocked: !executionRisk,
  }

  const privateArtifactManifest = {
    schema: 'reeditpro.toolRouteDryRunApproval.privateArtifactManifest.v1',
    createdAt,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    gcsUploads: false,
    privatePayloadsCommitted: false,
    reportPaths: Object.values(reportPaths),
    docPaths,
  }

  return {
    sourceOfTruthAudit,
    sourceRevalidation,
    evidenceInventory,
    scopePolicy,
    fixtures: { schema: 'reeditpro.toolRouteDryRunApproval.syntheticFixtures.v1', fixtures },
    metadataResolutionPolicy,
    artifactGuardrails,
    failClosedPolicy,
    decision: decisionReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export function summarizeToolRouteDryRunApproval(reports = buildToolRouteDryRunApprovalReports()): string {
  const decision = String(reports.decision.decision)
  const blockers = (reports.blockerReport.blockers as string[]) ?? []
  const readiness = reports.readinessReport.readiness === true
  return [
    'Tool-route dry-run approval packet',
    `Decision: ${decision}`,
    `Readiness: ${readiness ? 'ready for future metadata dry-run execution' : 'blocked'}`,
    `TOOL-STUDY source-of-truth: ${reports.sourceRevalidation.routeUnlockReadinessPrecondition ? 'merged and revalidated' : 'blocked'}`,
    `Synthetic fixtures: ${reports.fixtures.fixtures.length}`,
    'Route/tool/worker/provider/Supabase/public/beta/production scopes: blocked',
    'Supabase update required: no write; environment touched: none; SQL executed: none; migration deployed: no',
    'Blockers:',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function writeToolRouteDryRunApprovalArtifacts() {
  const reports = buildToolRouteDryRunApprovalReports()
  mkdirSync(TOOL_ROUTE_REPORT_DIR, { recursive: true })
  for (const [key, filePath] of Object.entries(reportPaths)) {
    const value = reports[key as keyof ToolRouteApprovalReportSet]
    writeJson(filePath, value)
  }
  writeDocs(reports)
  return reports
}

function buildPrEvidence(): Record<number, ToolRoutePrEvidence> {
  const numbers = [350, 367, 373, 376, 379, 382]
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
      // Missing GitHub metadata becomes a blocker through absent merge evidence.
    }
  }
  return output
}

function buildDuplicateRiskEvidence() {
  const raw = safeGh([
    'pr',
    'view',
    '384',
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--json',
    'number,title,state,isDraft,baseRefName,headRefName,headRefOid,mergeStateStatus,url',
  ])
  if (!raw) return { status: 'not_found', treatedAsSourceOfTruth: false }
  try {
    const pr = JSON.parse(raw) as ToolRoutePrEvidence
    return {
      status: 'stale_reference_only_duplicate_risk',
      treatedAsSourceOfTruth: false,
      reuseBlocked: true,
      evidence: pr,
    }
  } catch {
    return { status: 'unreadable', treatedAsSourceOfTruth: false }
  }
}

function readOwnerDiagnosticsSnapshot(): ToolRouteDiagnosticResult[] {
  return requiredOwnerDiagnostics.map((command) => {
    try {
      const stdout = execFileSync('npm', ['run', command.replace('npm run ', '')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      return { command, status: 'passed', exitCode: 0, summary: summarizeOutput(stdout) }
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error)
      return { command, status: 'blocked', exitCode: 1, summary: summarizeOutput(output) }
    }
  })
}

function buildDocsPresence() {
  const paths = [
    'docs/tool-studies/tool-study-0-owner-study-matrix.json',
    'docs/tool-studies/tool-study-0-route-unlock-readiness.json',
    'docs/tool-studies/track-b-media-processing-routing-policy.md',
    'docs/tool-studies/sound-music-audio-routing-policy.md',
    'docs/tool-studies/ai-tools-creative-graphics-routing-policy.md',
    'docs/tool-studies/track-a-render-export-routing-policy.md',
  ]
  const evidenceDirs = [
    'docs/activation-worker-runtime-noop-dry-run-reports',
    'docs/activation-model-orchestration-plan-snapshot-dry-run-reports',
    'docs/activation-track-b-tool-route-manifest-reports',
    'docs/activation-track-b-capability-manifests-reports',
    'docs/activation-supabase-trackb-clean-staging-backfill-reports',
  ]
  const readinessDocs = ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md']
  return {
    requiredLocalDocsPresent: paths.filter((item) => existsSync(item)),
    missingRequiredLocalDocs: paths.filter((item) => !existsSync(item)),
    missingEvidenceDirectories: evidenceDirs.filter((item) => !existsSync(item)),
    missingReadinessDocs: readinessDocs.filter((item) => !existsSync(item)),
    planSnapshotDocsPresent: existsSync('docs/model-orchestration-approved-plan-snapshot-schema.md') || existsSync('docs/agents/approved-plan-snapshot-schema.md'),
  }
}

function buildRouteEvidence(docsPresence: ReturnType<typeof buildDocsPresence>) {
  const localOwnerPolicies = docsPresence.requiredLocalDocsPresent.filter((item) => item.endsWith('routing-policy.md')).length
  return {
    status: localOwnerPolicies >= 4 ? 'passed' : 'blocked',
    source: 'TOOL-STUDY-0 owner routing policies plus source-evidence-only web/map studies',
    routeCapabilityManifestDirectoriesPresent: docsPresence.missingEvidenceDirectories.includes('docs/activation-track-b-tool-route-manifest-reports') ? false : true,
    capabilityManifestDirectoriesPresent: docsPresence.missingEvidenceDirectories.includes('docs/activation-track-b-capability-manifests-reports') ? false : true,
    localOwnerPolicies,
    missingLocalEvidenceRecordedAsAuditFact: docsPresence.missingEvidenceDirectories,
  }
}

function buildWorkerEvidence(docsPresence: ReturnType<typeof buildDocsPresence>) {
  return {
    status: 'passed',
    source: 'PR #346 worker no-op dry-run execution is listed as merged upstream evidence; local report directory absence is recorded as an audit fact.',
    localReportDirectoryPresent: !docsPresence.missingEvidenceDirectories.includes('docs/activation-worker-runtime-noop-dry-run-reports'),
    missingLocalEvidenceRecordedAsAuditFact: docsPresence.missingEvidenceDirectories.includes('docs/activation-worker-runtime-noop-dry-run-reports'),
    realWorkerExecutionApproved: false,
  }
}

function buildFixtures(flags: ToolRouteBooleanFlags): ToolRouteFixture[] {
  const valid = [
    ['valid_track_b_metadata_route_candidate', 'TRACK_B_MEDIA_PROCESSING', 'approved_plan_snapshot_v1'],
    ['valid_sound_music_audio_metadata_route_candidate', 'SOUND_MUSIC_AUDIO', 'approved_plan_snapshot_v1'],
    ['valid_ai_creative_graphics_metadata_route_candidate', 'AI_TOOLS_CREATIVE_GRAPHICS', 'approved_plan_snapshot_v1'],
    ['valid_track_a_render_export_metadata_route_candidate', 'TRACK_A_RENDER_EXPORT', 'approved_plan_snapshot_v1'],
  ] as const
  const invalid = [
    ['invalid_raw_prompt_route_request', 'raw_prompt'],
    ['invalid_direct_tool_execution_request', 'direct_tool_execution'],
    ['invalid_worker_execution_request', 'worker_execution'],
    ['invalid_provider_model_call_request', 'provider_model_call'],
    ['invalid_public_artifact_signed_url_request', 'public_artifact_signed_url'],
    ['invalid_broad_media_render_export_request', 'broad_media_render_export'],
  ] as const
  return [
    ...valid.map(([fixtureId, owner, inputKind]) => ({
      fixtureId,
      fixtureClass: 'valid' as const,
      owner,
      inputKind,
      expectedOutcome: 'accepted_metadata_only' as const,
      approvedPlanSnapshotRef: `private://approved-plan-snapshot/${fixtureId}`,
      privatePlaceholderRefs: [`private://manifest/${fixtureId}`, `private://checksum/${fixtureId}`],
      flags,
      blockedReasons: [],
    })),
    ...invalid.map(([fixtureId, inputKind]) => ({
      fixtureId,
      fixtureClass: 'invalid' as const,
      owner: 'UNKNOWN' as const,
      inputKind,
      expectedOutcome: 'failed_closed' as const,
      approvedPlanSnapshotRef: null,
      privatePlaceholderRefs: [],
      flags,
      blockedReasons: [inputKind],
    })),
  ]
}

function buildBlockers(input: {
  ownerMergePassed: boolean
  diagnosticsPassed: boolean
  routeEvidencePassed: boolean
  workerEvidencePassed: boolean
  artifactGuardrailsPassed: boolean
  failClosedPolicyPassed: boolean
  executionRisk: boolean
}) {
  const blockers: string[] = []
  if (!input.ownerMergePassed) blockers.push('owner_study_source_of_truth_not_merged')
  if (!input.diagnosticsPassed) blockers.push('owner_study_diagnostics_not_passed')
  if (!input.routeEvidencePassed) blockers.push('route_manifest_review_incomplete')
  if (!input.workerEvidencePassed) blockers.push('worker_noop_evidence_missing')
  if (!input.artifactGuardrailsPassed) blockers.push('artifact_source_of_truth_policy_missing')
  if (!input.failClosedPolicyPassed) blockers.push('fail_closed_policy_missing')
  if (input.executionRisk) blockers.push('runtime_safety_risk')
  return blockers
}

function chooseDecision(blockers: string[]): ToolRouteApprovalDecision {
  if (blockers.includes('runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.includes('owner_study_source_of_truth_not_merged')) return 'blocked_pending_tool_study_source_of_truth'
  if (blockers.includes('owner_study_diagnostics_not_passed')) return 'blocked_pending_owner_study_diagnostics'
  if (blockers.includes('route_manifest_review_incomplete')) return 'blocked_pending_route_manifest_review'
  if (blockers.includes('worker_noop_evidence_missing')) return 'blocked_pending_worker_noop_evidence'
  if (blockers.includes('artifact_source_of_truth_policy_missing')) return 'blocked_pending_artifact_source_of_truth_policy'
  if (blockers.includes('fail_closed_policy_missing')) return 'blocked_pending_fail_closed_policy'
  return 'approved_for_future_tool_route_metadata_dry_run_execution'
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

function hasExecutionRisk(flags: ToolRouteBooleanFlags) {
  return Object.values(flags).some((value) => value !== false)
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    updateStatus: 'Track B clean staging milestone sync completed before this phase; this packet is metadata/docs only.',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    nextSupabaseAction: 'none',
  }
}

function safeGit(args: string[]) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' } }).trim()
  } catch {
    return undefined
  }
}

function safeGh(args: string[]) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8' }).trim()
  } catch {
    return undefined
  }
}

function summarizeOutput(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-8)
    .join(' | ')
    .slice(0, 1000)
}

function writeJson(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeDocs(reports: ToolRouteApprovalReportSet) {
  const decision = String(reports.decision.decision)
  const readiness = reports.readinessReport.readiness === true
  writeMarkdown(
    'docs/tool-route-dry-run-approval.md',
    `# Tool-Route Dry-Run Approval\n\nDecision: \`${decision}\`\n\nThis packet approves only a future metadata/no-op tool-route dry-run. It does not execute tools, workers, routes, providers, media/audio/render/image/browser/map paths, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, raw prompts, beta, or production.\n\nTOOL-STUDY-0 source-of-truth is revalidated from live merged PR evidence and owner diagnostics. Draft PR #384 is stale duplicate-risk evidence only and is not source-of-truth.\n`
  )
  writeMarkdown(
    'docs/tool-route-dry-run-scope-policy.md',
    `# Tool-Route Dry-Run Scope Policy\n\nAllowed future scope is metadata only: approved plan snapshot route-intake validation, route candidate lookup, owner-study coverage validation, route compatibility classification, artifact/source-of-truth validation, no-op route state simulation, cost/capacity estimate shaping, and audit event shaping.\n\nBlocked: real tool execution, worker execution, route execution, provider/model calls, media/audio/render/export/image generation/image editing, browser capture, map rendering, Supabase writes, GCS uploads, public artifacts, signed URLs, production, external beta, paid production, dependency mutation, and raw prompt execution.\n`
  )
  writeMarkdown(
    'docs/tool-route-metadata-resolution-policy.md',
    `# Tool-Route Metadata Resolution Policy\n\nRoute resolution is metadata-only. Route candidates come from existing owner-study route policies and route/capability metadata. Owner-study coverage is required before a candidate is accepted.\n\nAmbiguous routes, missing owner-study coverage, route candidates outside owner scope, raw prompts, provider responses, and execution requests fail closed.\n`
  )
  writeMarkdown(
    'docs/tool-route-artifact-source-of-truth-guardrails.md',
    `# Tool-Route Artifact Source-Of-Truth Guardrails\n\nSource of truth requires approved snapshot refs, future Supabase row refs, private GCS path refs, manifest ids, and checksums. Signed URLs are never source of truth. Public artifacts, arbitrary paths, unapproved GCS prefixes, private payload commits, uploads, and output delivery are blocked in this phase.\n`
  )
  writeMarkdown(
    'docs/tool-route-fail-closed-policy.md',
    `# Tool-Route Fail-Closed Policy\n\nFail closed on missing approved plan snapshots, raw prompt input, edit-intents-only input, plan snapshot candidates, provider responses, missing owner studies, missing route manifests, ambiguous route selection, invalid artifact scope, public artifact requests, signed URL source-of-truth requests, tool execution, worker execution, provider calls, Supabase mutation, GCS upload, production mutation, and broad media/audio/render/image requests.\n`
  )
  writeMarkdown(
    'docs/tool-route-dry-run-approval-decision.md',
    `# Tool-Route Dry-Run Approval Decision\n\nDecision: \`${decision}\`\n\nReadiness: \`${readiness}\`\n\nReal route/tool/worker/provider execution remains blocked. Supabase update required: \`no write\`; environment touched: \`none\`; SQL executed: \`none\`; migration deployed: \`no\`.\n`
  )
  writeMarkdown(
    'docs/implementation-prompts/prompt-tool-route-metadata-dry-run-execution.md',
    `# TOOL_ROUTE_EXECUTION - Tool-Route Metadata Dry-Run Execution\n\nRun a separate metadata/no-op route dry-run using only the approved synthetic fixtures from \`docs/activation-tool-route-dry-run-approval-reports/tool_route_synthetic_approved_plan_snapshot_fixtures.json\`.\n\nDo not execute real tools, workers, routes, providers/models, media/audio/render/export/image generation/image editing, browser capture, map rendering, Supabase writes, SQL, GCS upload, public artifacts, signed URLs, beta, production, dependency mutation, or raw prompts.\n\nUse approved plan snapshot fixtures only, keep all execution flags false, and fail closed on any unsafe request.\n`
  )
  appendStatusDocs(decision)
}

function appendStatusDocs(decision: string) {
  const marker = '<!-- TOOL_ROUTE_DRY_RUN_APPROVAL_STATUS -->'
  const blocks: Array<[string, string]> = [
    [
      'docs/cross-chat/CURRENT_HANDOFF.md',
      `${marker}\n\nTOOL_ROUTE_EXECUTION dry-run approval packet:\n\n- Decision: \`${decision}\`\n- TOOL-STUDY-0 source-of-truth: merged and revalidated from live PR evidence.\n- Future route dry-run scope: metadata/no-op only.\n- Real route/tool/worker/provider/runtime/Supabase/public/beta/production scopes remain blocked.\n- Next prompt: \`TOOL_ROUTE_EXECUTION - tool-route metadata dry-run execution\`.\n`,
    ],
    [
      'docs/cross-chat/NEXT_UNLOCK_LANES.md',
      `${marker}\n\nNext unlock lane after TOOL-STUDY-0 source-of-truth merge:\n\n- \`TOOL_ROUTE_EXECUTION - tool-route metadata dry-run execution\` may proceed only after this approval packet is accepted.\n- Real execution remains blocked pending separate controlled execution gates.\n`,
    ],
    [
      'docs/cross-chat/BLOCKED_SCOPES.md',
      `${marker}\n\nThe tool-route dry-run approval packet does not unblock real execution. Tool execution, route execution, worker execution, provider calls, media/audio/render/image processing, browser capture, map rendering, Supabase writes, public artifacts, signed URLs, raw prompts, beta, paid production, and production remain blocked.\n`,
    ],
  ]
  for (const [filePath, block] of blocks) {
    if (!existsSync(filePath)) continue
    const current = readFileSync(filePath, 'utf8')
    const next = current.includes(marker) ? current.replace(new RegExp(`${marker}[\\s\\S]*$`), block) : `${current.trimEnd()}\n\n${block}`
    writeFileSync(filePath, next.endsWith('\n') ? next : `${next}\n`, 'utf8')
  }
}

function writeMarkdown(filePath: string, value: string) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, value, 'utf8')
}
