import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  buildApprovedStagingTargetReferenceReport,
} from './milestone-registry-approved-staging-target-reference'

export const SUPABASE_APPROVED_STAGING_TARGET_PHASE = 'supabase-approved-staging-target-reference'
export const SUPABASE_APPROVED_STAGING_TARGET_RUN_ID = 'supabase-approved-staging-target-reference-20260605'
export const SUPABASE_APPROVED_STAGING_TARGET_BRANCH =
  'codex/rp-foundation-supabase-approved-staging-target-reference'
export const SUPABASE_APPROVED_STAGING_TARGET_BASE_BRANCH =
  'codex/rp-foundation-supabase-staging-target-proof-deploy-rerun'
export const SUPABASE_APPROVED_STAGING_TARGET_PR_TITLE =
  '[foundation] Supabase approved staging target reference'
export const SUPABASE_APPROVED_STAGING_TARGET_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_APPROVED_STAGING_TARGET_REFERENCE'
export const SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR =
  'docs/activation-supabase-approved-staging-target-reports'

export const SUPABASE_APPROVED_STAGING_TARGET_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'approved_staging_target_reference.json',
  'approved_staging_target_policy_report.json',
  'approved_staging_target_blocker_report.json',
  'approved_staging_target_readiness_report.json',
  'approved_staging_target_private_artifact_manifest.json',
  'approved_staging_target_readiness_report.md',
] as const

const REQUIRED_SOURCE_FILES = [
  'AGENTS.md',
  'docs/supabase-approved-staging-target-reference.md',
  'docs/supabase-staging-target-proof-policy.md',
  'docs/supabase-plugin-staging-target-proof-report.md',
] as const

const OPTIONAL_SOURCE_FILES = [
  'docs/supabase-plugin-staging-target-policy.md',
  'docs/supabase-milestone-registry-staging-deploy-rerun.md',
  'docs/supabase-trackb-backfill-rerun-after-target-proof.md',
  'docs/activation-readiness-state.md',
  'docs/activation-phase-roadmap.md',
  'docs/production-beta-readiness-scorecard.md',
  'docs/production-model-weight-readiness-plan.md',
  'docs/track-b-tool-readiness-summary.md',
] as const

const SECRET_PATTERNS = [
  /BEGIN PRIVATE KEY/i,
  /postgres(?:ql)?:\/\//i,
  /service[_-]?role[_-]?key\s*[:=]/i,
  /anon[_-]?key\s*[:=]/i,
  /access[_-]?token\s*[:=]/i,
  /password\s*[:=]/i,
  /signed[_-]?url\s*[:=]/i,
] as const

type ApprovedTargetReportBundle = {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  approvedStagingTargetReference: Record<string, unknown>
  policyReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}

export function getSupabaseApprovedStagingTargetPlan() {
  return {
    phase: SUPABASE_APPROVED_STAGING_TARGET_PHASE,
    runId: SUPABASE_APPROVED_STAGING_TARGET_RUN_ID,
    branch: SUPABASE_APPROVED_STAGING_TARGET_BRANCH,
    baseBranch: SUPABASE_APPROVED_STAGING_TARGET_BASE_BRANCH,
    sourcePr209: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/209',
    prTitle: SUPABASE_APPROVED_STAGING_TARGET_PR_TITLE,
    mode: 'metadata_only_non_secret_staging_target_reference_approval',
    reportDir: SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR,
    expectedReports: SUPABASE_APPROVED_STAGING_TARGET_EXPECTED_REPORTS,
    confirmationForReportGeneration: SUPABASE_APPROVED_STAGING_TARGET_CONFIRMATION,
    approvedTarget: {
      projectName: 'Reeditpro',
      projectRef: 'wmyyttnynmteqgcdishd',
      environment: 'staging',
      projectRefIsSafeMetadata: true,
    },
    allowedFutureUses: [
      'PR #209 staging target proof rerun',
      'PR #206 migration-safe staging registry schema deploy/verify after separate confirmations',
      'PR #198 guarded Track B staging metadata backfill after separate approvals and confirmations',
    ],
    forbiddenActionsInThisPhase: [
      'supabase_sql_execution',
      'migration_deployment',
      'staging_mutation',
      'production_mutation',
      'track_b_backfill_write',
      'provider_call',
      'route_tool_worker_execution',
      'media_processing',
      'beta_or_production_unlock',
      'track_a',
    ],
    nextRecommendedPhase:
      'Rerun the PR #209 staging target proof/deploy wrapper with its own confirmations; do not write Supabase data in this approval-reference phase.',
  }
}

export function buildSupabaseApprovedStagingTargetReports(): ApprovedTargetReportBundle {
  const sourceOfTruthOwnershipAudit = buildSourceOfTruthOwnershipAudit()
  const approvedStagingTargetReference = buildApprovedReferenceApprovalReport()
  const policyReport = buildPolicyReport(approvedStagingTargetReference)
  const blockers = collectBlockers(sourceOfTruthOwnershipAudit, approvedStagingTargetReference, policyReport)
  const blockerReport = buildBlockerReport(blockers)
  const readinessReport = buildReadinessReport(blockers, approvedStagingTargetReference)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  return {
    sourceOfTruthOwnershipAudit,
    approvedStagingTargetReference,
    policyReport,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

export async function writeSupabaseApprovedStagingTargetArtifacts(
  reports = buildSupabaseApprovedStagingTargetReports(),
  reportDir = SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR,
): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'approved_staging_target_reference.json'), reports.approvedStagingTargetReference)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'approved_staging_target_policy_report.json'), reports.policyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'approved_staging_target_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'approved_staging_target_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'approved_staging_target_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'approved_staging_target_readiness_report.md'), renderReadinessMarkdown(reports))
}

export function readSupabaseApprovedStagingTargetSummary() {
  const reports = buildSupabaseApprovedStagingTargetReports()
  const readiness = reports.readinessReport as { status?: string; stagingExecutionAllowed?: boolean; nextRecommendedPhase?: string }
  const reference = reports.approvedStagingTargetReference as {
    decision?: string
    approvalStatus?: string
    approvedStagingProjectName?: string
    approvedStagingProjectRef?: string
    approvedEnvironment?: string
  }
  const blocker = reports.blockerReport as { activeBlockers?: string[] }
  return {
    phase: SUPABASE_APPROVED_STAGING_TARGET_PHASE,
    runId: SUPABASE_APPROVED_STAGING_TARGET_RUN_ID,
    status: readiness.status,
    decision: reference.decision,
    approvalStatus: reference.approvalStatus,
    approvedStagingProjectName: reference.approvedStagingProjectName,
    approvedStagingProjectRef: reference.approvedStagingProjectRef,
    approvedEnvironment: reference.approvedEnvironment,
    stagingExecutionAllowed: readiness.stagingExecutionAllowed,
    remoteSqlRun: false,
    migrationDeployment: false,
    productionAffected: false,
    trackBBackfillRowsWritten: false,
    providerCalls: 'not_run',
    routeToolWorkerExecution: 'not_run',
    trackA: 'not_touched',
    activeBlockers: blocker.activeBlockers,
    nextRecommendedPhase: readiness.nextRecommendedPhase,
  }
}

function buildSourceOfTruthOwnershipAudit() {
  const files = [...REQUIRED_SOURCE_FILES, ...OPTIONAL_SOURCE_FILES].map((file) => {
    const exists = existsSync(file)
    const text = exists ? readFileSync(file, 'utf8') : ''
    return {
      file,
      required: REQUIRED_SOURCE_FILES.includes(file as typeof REQUIRED_SOURCE_FILES[number]),
      exists,
      secretLikePayloadDetected: SECRET_PATTERNS.some((pattern) => pattern.test(text)),
    }
  })
  const missingRequired = files.filter((file) => file.required && !file.exists).map((file) => file.file)
  const unsafeFiles = files.filter((file) => file.secretLikePayloadDetected).map((file) => file.file)
  const blockers = [
    ...missingRequired.map((file) => `required_source_file_missing:${file}`),
    ...unsafeFiles.map((file) => `secret_like_payload_detected:${file}`),
  ]
  return {
    phase: SUPABASE_APPROVED_STAGING_TARGET_PHASE,
    runId: SUPABASE_APPROVED_STAGING_TARGET_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    ownerWorkstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    relatedWorkstreams: [
      'TRACK_B_MEDIA_PROCESSING',
      'OBSERVABILITY_AUDIT_COST',
      'WORKER_RUNTIME_JOBS',
    ],
    nonOwnedWorkstreams: [
      'Track B runtime/tool execution',
      'Track A visual/video runtime',
      'provider gateway/model execution',
      'frontend UX',
      'production or beta unlocks',
    ],
    sourceFiles: files,
    integrationPrs: [
      { pr: 196, role: 'Track B rollup export evidence' },
      { pr: 198, role: 'Track B staging backfill path' },
      { pr: 200, role: 'registry schema/RLS migration' },
      { pr: 202, role: 'CLI staging deploy/verify wrapper' },
      { pr: 206, role: 'plugin-assisted deploy/verify wrapper' },
      { pr: 209, role: 'staging target proof deploy rerun' },
    ],
    duplicateWorkAvoidance: [
      'do not add or deploy registry schema in this phase',
      'do not write Track B milestone rows in this phase',
      'do not infer staging from plugin project name alone after this approval; PR #209 still requires proof confirmations',
    ],
    secretPayloadsRead: false,
    secretPayloadsPrinted: false,
    blockers,
  }
}

function buildApprovedReferenceApprovalReport() {
  const loaderReport = buildApprovedStagingTargetReferenceReport()
  const blockers = [...(loaderReport.blockers ?? [])]
  if (loaderReport.approvedStagingProjectName !== 'Reeditpro') {
    blockers.push('approved_staging_target_name_mismatch')
  }
  if (loaderReport.approvedStagingProjectRef !== 'wmyyttnynmteqgcdishd') {
    blockers.push('approved_staging_target_ref_mismatch')
  }
  if (loaderReport.approvedEnvironment !== 'staging') {
    blockers.push('approved_staging_target_environment_mismatch')
  }
  return {
    phase: SUPABASE_APPROVED_STAGING_TARGET_PHASE,
    runId: SUPABASE_APPROVED_STAGING_TARGET_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    decision: blockers.length === 0
      ? 'approved_for_staging_target_reference'
      : 'approved_staging_target_reference_not_confirmed_by_human',
    approvalStatus: blockers.length === 0 ? 'approved' : 'blocked',
    approved: blockers.length === 0,
    decisionDate: '2026-06-05',
    humanProductApprovalInput: 'confirmed_by_user_prompt',
    approvedStagingProjectName: loaderReport.approvedStagingProjectName,
    approvedStagingProjectRef: loaderReport.approvedStagingProjectRef,
    approvedEnvironment: loaderReport.approvedEnvironment,
    approvedReferenceSource: loaderReport.approvedReferenceSource,
    loaderReport,
    allowedUses: [
      'staging target proof comparison in PR #209',
      'staging activation milestone registry schema/RLS deploy verification after separate deploy confirmations',
      'staging Track B milestone metadata backfill after separate PR #198 confirmations',
    ],
    forbiddenUses: [
      'production Supabase target proof',
      'production SQL',
      'remote SQL execution in this phase',
      'migration deployment in this phase',
      'Track B backfill write in this phase',
      'service-role secret exposure',
      'provider calls',
      'route/tool/worker execution',
      'media processing',
      'public artifacts',
      'beta or production unlock',
      'Track A',
    ],
    secretValuesIncluded: false,
    credentialPayloadViewed: false,
    credentialPayloadPrinted: false,
    remoteSqlRun: false,
    migrationDeployment: false,
    productionAffected: false,
    blockers: collectUnique(blockers),
  }
}

function buildPolicyReport(approvedReference: Record<string, unknown>) {
  const approved = approvedReference as { approved?: boolean }
  return {
    phase: SUPABASE_APPROVED_STAGING_TARGET_PHASE,
    runId: SUPABASE_APPROVED_STAGING_TARGET_RUN_ID,
    status: approved.approved === true ? 'passed' : 'blocked',
    approvedReferencePolicy: {
      projectRefIsSafeMetadata: true,
      projectNameIsSafeMetadata: true,
      environmentLabelIsSafeMetadata: true,
      dbUrlsForbidden: true,
      serviceRoleKeysForbidden: true,
      anonKeysForbidden: true,
      accessTokensForbidden: true,
      passwordsForbidden: true,
      signedUrlsForbidden: true,
      credentialPayloadViewingForbidden: true,
      pluginObservationAloneIsNotApproval: true,
      runtimeEnvReferenceAloneIsNotApproval: true,
    },
    executionPolicy: {
      stagingSqlExecutionAllowedInThisPhase: false,
      remoteSqlRun: false,
      migrationDeployment: false,
      trackBBackfillWrite: false,
      productionAffected: false,
      providerCalls: 'not_run',
      routeToolWorkerExecution: 'not_run',
      mediaProcessing: 'not_run',
      trackA: 'not_touched',
    },
    futureGatePolicy: {
      pr209StillRequiresOwnConfirmations: true,
      pr206DeployVerifyStillRequiresSeparateConfirmations: true,
      pr198BackfillStillRequiresSeparateConfirmations: true,
      productionPromotionRequiresSeparateHumanReview: true,
    },
    blockers: approved.approved === true ? [] : ['approved_staging_target_reference_not_confirmed_by_human'],
  }
}

function buildBlockerReport(blockers: string[]) {
  return {
    phase: SUPABASE_APPROVED_STAGING_TARGET_PHASE,
    runId: SUPABASE_APPROVED_STAGING_TARGET_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    resolvedPriorBlockerForPr209: blockers.length === 0
      ? 'approved_staging_target_reference_missing'
      : null,
    stillBlockedScopes: [
      'staging_schema_deploy_until_pr209_target_proof_confirmations_pass',
      'staging_schema_verify_until_pr209_target_proof_confirmations_pass',
      'track_b_backfill_write_until_pr198_confirmations_pass',
      'production_supabase',
      'production_sql',
      'direct_manual_remote_sql',
      'provider_calls',
      'route_execution',
      'worker_execution',
      'tool_execution',
      'media_processing',
      'public_artifacts',
      'beta_unlock',
      'production_unlock',
      'track_a',
    ],
    operatorActionRequired: blockers.length === 0
      ? 'Rerun PR #209 target proof wrapper with its own confirmations; do not write data in this phase.'
      : 'Review and fix the approved staging target reference metadata.',
  }
}

function buildReadinessReport(blockers: string[], approvedReference: Record<string, unknown>) {
  const approved = approvedReference as { approved?: boolean }
  return {
    phase: SUPABASE_APPROVED_STAGING_TARGET_PHASE,
    runId: SUPABASE_APPROVED_STAGING_TARGET_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    approvalStatus: approved.approved === true
      ? 'approved_staging_reference_recorded'
      : 'blocked_pending_human_confirmation',
    stagingTargetReferenceApproved: approved.approved === true,
    stagingExecutionAllowed: false,
    stagingSchemaDeployAuthorizedByThisPhase: false,
    stagingSchemaVerifyAuthorizedByThisPhase: false,
    trackBBackfillAuthorizedByThisPhase: false,
    remoteSqlRun: false,
    migrationDeployment: false,
    productionAffected: false,
    providerCalls: 'not_run',
    routeToolWorkerExecution: 'not_run',
    mediaProcessing: 'not_run',
    trackA: 'not_touched',
    nextRecommendedPhase: blockers.length === 0
      ? 'Rerun the PR #209 staging target proof/deploy wrapper with its own proof and deploy confirmations.'
      : 'Resolve the approved staging target reference blocker before PR #209 rerun.',
    blockers,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: SUPABASE_APPROVED_STAGING_TARGET_PHASE,
    runId: SUPABASE_APPROVED_STAGING_TARGET_RUN_ID,
    status: 'metadata_committed_only',
    reportDir: SUPABASE_APPROVED_STAGING_TARGET_REPORT_DIR,
    expectedReports: SUPABASE_APPROVED_STAGING_TARGET_EXPECTED_REPORTS,
    privateUploadRequired: false,
    secretsIncluded: false,
    dbUrlsIncluded: false,
    serviceKeysIncluded: false,
    signedUrlsIncluded: false,
    privatePayloadsIncluded: false,
    mediaPayloadsIncluded: false,
  }
}

function collectBlockers(...reports: Array<Record<string, unknown>>) {
  return collectUnique(reports.flatMap((report) => Array.isArray(report.blockers) ? report.blockers.map(String) : []))
}

function collectUnique(values: string[]) {
  return [...new Set(values)].sort()
}

function renderReadinessMarkdown(reports: ApprovedTargetReportBundle) {
  const readiness = reports.readinessReport as { status?: string; nextRecommendedPhase?: string }
  const blocker = reports.blockerReport as { activeBlockers?: string[]; stillBlockedScopes?: string[] }
  const reference = reports.approvedStagingTargetReference as {
    approvalStatus?: string
    approvedStagingProjectName?: string
    approvedStagingProjectRef?: string
    approvedEnvironment?: string
  }
  return [
    '# Supabase Approved Staging Target Readiness',
    '',
    `Status: \`${readiness.status}\``,
    `Approval status: \`${reference.approvalStatus}\``,
    `Approved target: \`${reference.approvedStagingProjectName}\` / \`${reference.approvedStagingProjectRef}\``,
    `Environment: \`${reference.approvedEnvironment}\``,
    '',
    'This phase records a non-secret staging target reference only. It does not run staging SQL, deploy migrations, write Track B data, touch production, call providers, execute tools/workers/routes, process media, unlock beta/production, or touch Track A.',
    '',
    `Active blockers: ${(blocker.activeBlockers ?? []).length ? blocker.activeBlockers?.map((value) => `\`${value}\``).join(', ') : '`none`'}`,
    '',
    'Still blocked scopes:',
    ...(blocker.stillBlockedScopes ?? []).map((scope) => `- \`${scope}\``),
    '',
    `Next recommended phase: ${readiness.nextRecommendedPhase}`,
  ].join('\n')
}
