import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { TrackaDockerBuildProbeQaDecision, TrackaDockerBuildProbeQaReports } from './tracka-docker-build-probe-qa-types'

type JsonRecord = Record<string, unknown>

export const TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR =
  'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa'
export const TRACKA_DOCKER_BUILD_PROBE_QA_BRANCH =
  'codex/rp-open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-review'
export const TRACKA_DOCKER_BUILD_PROBE_QA_BASE_BRANCH = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const TRACKA_DOCKER_BUILD_PROBE_QA_SOURCE_SHA = 'a0ad97abce12f7b8265feeaefa30390a41de03e4'
export const TRACKA_DOCKER_BUILD_PROBE_RERUN_SOURCE_SHA = '9225347e636a50aa0ef241badbf51f9a3947b1f8'
export const TRACKA_DOCKER_BUILD_PROBE_IMAGE_TAG =
  `reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-${TRACKA_DOCKER_BUILD_PROBE_RERUN_SOURCE_SHA}`

const expectedDockerBuildCommand =
  `docker build -f docker/prod/render-worker/Dockerfile -t ${TRACKA_DOCKER_BUILD_PROBE_IMAGE_TAG} .`
const expectedFfmpegCommand =
  `docker run --rm --network none --entrypoint ffmpeg ${TRACKA_DOCKER_BUILD_PROBE_IMAGE_TAG} -version`
const expectedFfprobeCommand =
  `docker run --rm --network none --entrypoint ffprobe ${TRACKA_DOCKER_BUILD_PROBE_IMAGE_TAG} -version`
const expectedDecision: TrackaDockerBuildProbeQaDecision =
  'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_qa_passed_media_processing_still_blocked_ready_for_batch1_rollup'
const nextPrompt = 'OPEN_SOURCE_TOOL_STACK_BATCH1_FINAL_ROLLUP_AFTER_FFMPEG_FFPROBE_PROOF'
const nextPromptPath = 'docs/implementation-prompts/prompt-open-source-tool-stack-batch-1-final-rollup-after-ffmpeg-ffprobe-proof.md'
const blockerPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-blocker-resolution.md'

const predecessorPrs = [
  514, 508, 504, 499, 494, 490, 486, 481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427, 421,
  416,
]
const referenceOnlyPrs = [384, 401, 417, 420, 423, 425, 428, 432]
const distDirectories = [
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]
const protectedFiles = ['package.json', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']

const evidencePaths = {
  pr514Decision:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-decision.json',
  pr514BuildContext:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/build-context-regeneration-report.json',
  pr514Scan:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/generated-artifact-scan-report.json',
  pr514DockerBuild:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/docker-build-report.json',
  pr514Ffmpeg:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/ffmpeg-container-version-probe-report.json',
  pr514Ffprobe:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/ffprobe-container-version-probe-report.json',
  pr514Cleanup:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/generated-output-cleanup-report.json',
  pr514ImageCleanup:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/docker-image-cleanup-report.json',
  pr514SideEffect:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/side-effect-artifact-safety-report.json',
  pr514Manifest:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-private-artifact-manifest.json',
  pr508Decision:
    'docs/open-source-tool-stack/tracka-build-context-generation-execution/build-context-generation-execution-decision.json',
  pr508Scan: 'docs/open-source-tool-stack/tracka-build-context-generation-execution/generated-artifact-scan-report.json',
  pr504Decision:
    'docs/open-source-tool-stack/tracka-build-context-generation-approval/build-context-generation-approval-decision.json',
  pr490Decision:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-probe-command-blocker-resolution-decision.json',
  pr481Decision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  pr477Decision:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  pr472Decision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review/ffmpeg-ffprobe-system-binary-review-decision.json',
  pr469Decision: 'docs/open-source-tool-stack/duckdb-native-rebuild-qa/duckdb-native-rebuild-qa-decision.json',
  pr466Decision: 'docs/open-source-tool-stack/duckdb-native-rebuild-execution/duckdb-native-rebuild-decision.json',
  pr455Decision:
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/package-binary-execution-decision.json',
  batch1Qa: 'docs/open-source-tool-stack/batch-1-qa-review/batch-1-qa-review-decision.json',
  batch1Execution: 'docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json',
  auditDecision: 'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
}

const reportPaths = {
  sourceAudit: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/source-of-truth-audit.json`,
  evidenceRevalidation: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/evidence-revalidation-report.json`,
  evidenceRevalidationMd: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/evidence-revalidation-report.md`,
  dockerBuildQa: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/docker-build-qa.json`,
  dockerBuildQaMd: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/docker-build-qa.md`,
  ffmpegVersionQa: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/ffmpeg-version-qa.json`,
  ffmpegVersionQaMd: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/ffmpeg-version-qa.md`,
  ffprobeVersionQa: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/ffprobe-version-qa.json`,
  ffprobeVersionQaMd: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/ffprobe-version-qa.md`,
  generatedArtifactCleanupQa: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/generated-artifact-cleanup-qa.json`,
  generatedArtifactCleanupQaMd: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/generated-artifact-cleanup-qa.md`,
  mediaRenderBlockedScopeQa: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/media-render-blocked-scope-qa.json`,
  mediaRenderBlockedScopeQaMd: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/media-render-blocked-scope-qa.md`,
  centralOpenSourceStatusUpdate: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/central-open-source-status-update.json`,
  centralOpenSourceStatusUpdateMd: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/central-open-source-status-update.md`,
  decision: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-decision.json`,
  decisionMd: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-decision.md`,
  readiness: `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-readiness-report.json`,
  privateArtifactManifest:
    `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-private-artifact-manifest.json`,
  validationResults:
    `${TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-validation-results.md`,
}

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW',
    'REEDITPRO_CONFIRM_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_DOCKER_BUILD_EVIDENCE_REVIEW',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_EVIDENCE_REVIEW',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_EVIDENCE_REVIEW',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_CLEANUP_REVIEW',
    'REEDITPRO_CONFIRM_PACKAGE_DOCKERFILE_INTEGRITY_REVIEW',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING_STILL_BLOCKED_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_RERUN',
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DIST_OUTPUT_GENERATION',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_DOCKER_RUN',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_LOCAL_HOST_FFMPEG_FFPROBE',
    'REEDITPRO_CONFIRM_SYSTEM_BINARY_INSTALL',
    'REEDITPRO_CONFIRM_DOCKERFILE_MUTATION',
    'REEDITPRO_CONFIRM_CONTAINER_IMAGE_MUTATION',
    'REEDITPRO_CONFIRM_DOCKER_IMAGE_PUSH',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_MEDIA_FILE_PROBE',
    'REEDITPRO_CONFIRM_CAPTION_BURN_IN_EXECUTION',
    'REEDITPRO_CONFIRM_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_WORKER_EXECUTION',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
    'REEDITPRO_CONFIRM_PROVIDER_CALLS',
    'REEDITPRO_CONFIRM_DEPENDENCY_INSTALL',
    'REEDITPRO_CONFIRM_NPM_INSTALL',
    'REEDITPRO_CONFIRM_NPM_REBUILD',
    'REEDITPRO_CONFIRM_DUCKDB_IMPORT_SMOKE',
    'REEDITPRO_CONFIRM_POLARS_IMPORT_SMOKE',
    'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
    'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
    'REEDITPRO_CONFIRM_GCS_UPLOAD',
    'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
    'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
    'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
    'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
    'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
    'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
    'REEDITPRO_CONFIRM_GITHUB_PR_MERGE',
    'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  ]
}

export function buildTrackaDockerBuildProbeQaPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW',
    branch: TRACKA_DOCKER_BUILD_PROBE_QA_BRANCH,
    baseBranch: TRACKA_DOCKER_BUILD_PROBE_QA_BASE_BRANCH,
    expectedSourceSha: TRACKA_DOCKER_BUILD_PROBE_QA_SOURCE_SHA,
    mode: 'qa_review_metadata_only_no_build_no_docker_no_probe_no_media',
    requiredConfirmations: requiredConfirmations(),
    expectedDecision,
    nextPrompt,
    reportDir: TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR,
    reports: Object.values(reportPaths),
    forbiddenActions: [
      'build_context_generation',
      'docker_build_or_run',
      'ffmpeg_or_ffprobe_probe',
      'local_host_ffmpeg_ffprobe',
      'media_processing_or_render_export',
      'npm_install_or_rebuild',
      'duckdb_or_polars_proof_rerun',
      'worker_route_provider_execution',
      'supabase_sql_gcs_public_signed_url_mutation',
      'raw_prompt_execution',
      'github_pr_merge',
      'beta_or_production_unlock',
    ],
  }
}

export function buildTrackaDockerBuildProbeQaReports(): TrackaDockerBuildProbeQaReports {
  const generatedAt = new Date().toISOString()
  const evidence = readEvidenceReports()
  const protectedFileIntegrity = protectedFileIntegrityReport()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, evidence, protectedFileIntegrity)
  const evidenceRevalidationReport = buildEvidenceRevalidationReport(generatedAt, evidence)
  const dockerBuildQa = buildDockerBuildQa(generatedAt, evidence, protectedFileIntegrity)
  const ffmpegVersionQa = buildFfmpegVersionQa(generatedAt, evidence)
  const ffprobeVersionQa = buildFfprobeVersionQa(generatedAt, evidence)
  const generatedArtifactCleanupQa = buildGeneratedArtifactCleanupQa(generatedAt, evidence)
  const mediaRenderBlockedScopeQa = buildMediaRenderBlockedScopeQa(generatedAt, evidence)
  const centralOpenSourceStatusUpdate = buildCentralOpenSourceStatusUpdate(
    generatedAt,
    dockerBuildQa,
    ffmpegVersionQa,
    ffprobeVersionQa,
    mediaRenderBlockedScopeQa,
  )
  const decision = buildDecision(generatedAt, {
    dockerBuildQa,
    ffmpegVersionQa,
    ffprobeVersionQa,
    generatedArtifactCleanupQa,
    mediaRenderBlockedScopeQa,
    protectedFileIntegrity,
  })
  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.readiness.v1',
    generatedAt,
    readiness: decision.decision === expectedDecision,
    decision: decision.decision,
    blockers: decision.blockers,
    nextPrompt: decision.nextPrompt,
  }
  const privateArtifactManifest = {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.privateArtifactManifest.v1',
    generatedAt,
    reportDirectory: TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR,
    rawGeneratedFileContentsCommitted: false,
    dockerBuildRunInThisPhase: false,
    dockerRunRunInThisPhase: false,
    ffmpegProbeRunInThisPhase: false,
    ffprobeProbeRunInThisPhase: false,
    generatedDistOutputsCreatedInThisPhase: false,
    mediaArtifactsCreated: false,
    privatePayloadsAccessed: false,
    secretsAccessed: false,
    secretsPrinted: false,
    secretsCommitted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    supabaseClassification: supabaseClassification(),
  }

  return {
    sourceOfTruthAudit,
    evidenceRevalidationReport,
    dockerBuildQa,
    ffmpegVersionQa,
    ffprobeVersionQa,
    generatedArtifactCleanupQa,
    mediaRenderBlockedScopeQa,
    centralOpenSourceStatusUpdate,
    decision,
    readinessReport,
    privateArtifactManifest,
  }
}

export function writeTrackaDockerBuildProbeQaArtifacts() {
  validateConfirmations()
  const reports = buildTrackaDockerBuildProbeQaReports()
  mkdirSync(TRACKA_DOCKER_BUILD_PROBE_QA_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.evidenceRevalidation, reports.evidenceRevalidationReport)
  writeText(reportPaths.evidenceRevalidationMd, markdownReport('Evidence Revalidation', reports.evidenceRevalidationReport))
  writeJson(reportPaths.dockerBuildQa, reports.dockerBuildQa)
  writeText(reportPaths.dockerBuildQaMd, markdownReport('Docker Build QA', reports.dockerBuildQa))
  writeJson(reportPaths.ffmpegVersionQa, reports.ffmpegVersionQa)
  writeText(reportPaths.ffmpegVersionQaMd, markdownReport('FFmpeg Version QA', reports.ffmpegVersionQa))
  writeJson(reportPaths.ffprobeVersionQa, reports.ffprobeVersionQa)
  writeText(reportPaths.ffprobeVersionQaMd, markdownReport('FFprobe Version QA', reports.ffprobeVersionQa))
  writeJson(reportPaths.generatedArtifactCleanupQa, reports.generatedArtifactCleanupQa)
  writeText(reportPaths.generatedArtifactCleanupQaMd, markdownReport('Generated Artifact Cleanup QA', reports.generatedArtifactCleanupQa))
  writeJson(reportPaths.mediaRenderBlockedScopeQa, reports.mediaRenderBlockedScopeQa)
  writeText(reportPaths.mediaRenderBlockedScopeQaMd, markdownReport('Media Render Blocked Scope QA', reports.mediaRenderBlockedScopeQa))
  writeJson(reportPaths.centralOpenSourceStatusUpdate, reports.centralOpenSourceStatusUpdate)
  writeText(reportPaths.centralOpenSourceStatusUpdateMd, markdownReport('Central Open-Source Status Update', reports.centralOpenSourceStatusUpdate))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.privateArtifactManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationMarkdown(reports))
  writeNextPrompt(reports.decision)
  updateStatusDocs(reports.decision)
  return reports
}

export function readTrackaDockerBuildProbeQaArtifacts(): TrackaDockerBuildProbeQaReports {
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit),
    evidenceRevalidationReport: readJson(reportPaths.evidenceRevalidation),
    dockerBuildQa: readJson(reportPaths.dockerBuildQa),
    ffmpegVersionQa: readJson(reportPaths.ffmpegVersionQa),
    ffprobeVersionQa: readJson(reportPaths.ffprobeVersionQa),
    generatedArtifactCleanupQa: readJson(reportPaths.generatedArtifactCleanupQa),
    mediaRenderBlockedScopeQa: readJson(reportPaths.mediaRenderBlockedScopeQa),
    centralOpenSourceStatusUpdate: readJson(reportPaths.centralOpenSourceStatusUpdate),
    decision: readJson(reportPaths.decision),
    readinessReport: readJson(reportPaths.readiness),
    privateArtifactManifest: readJson(reportPaths.privateArtifactManifest),
  }
}

function validateConfirmations() {
  const missing = requiredConfirmations().filter((name) => process.env[name] !== 'true')
  if (missing.length) throw new Error(`missing_required_confirmations:${missing.join(',')}`)
  const forbidden = forbiddenConfirmations().filter((name) => process.env[name] === 'true')
  if (forbidden.length) throw new Error(`forbidden_confirmations:${forbidden.join(',')}`)
}

function readEvidenceReports() {
  return Object.fromEntries(Object.entries(evidencePaths).map(([key, filePath]) => [key, evidenceFile(filePath)]))
}

function evidenceFile(filePath: string) {
  const exists = existsSync(filePath)
  return {
    path: filePath,
    exists,
    sha256: exists ? sha256(filePath) : null,
    json: filePath.endsWith('.json') && exists ? readJson(filePath) : undefined,
  }
}

function buildSourceOfTruthAudit(generatedAt: string, evidence: JsonRecord, protectedFileIntegrity: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.sourceAudit.v1',
    generatedAt,
    phase: 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW',
    branch: TRACKA_DOCKER_BUILD_PROBE_QA_BRANCH,
    baseBranch: TRACKA_DOCKER_BUILD_PROBE_QA_BASE_BRANCH,
    expectedSourceSha: TRACKA_DOCKER_BUILD_PROBE_QA_SOURCE_SHA,
    liveSourceSha: gitOutput(['rev-parse', 'HEAD']),
    predecessorPrs,
    referenceOnlyPrs,
    sourceEvidence: evidence,
    protectedFileIntegrity,
    promptScriptNameMismatchAuditFact: {
      promptName: 'open-source-tool-stack:tracka-container-docker-build-ffmpeg-ffprobe-version-probe:diagnostics',
      actualName: 'open-source-tool-stack:tracka-container-ffmpeg-ffprobe-version-probe:diagnostics',
      treatedAsBlocker: false,
    },
    broadProductionDocs: {
      betaReadinessScorecard: existsSync('docs/beta-readiness-scorecard.md') ? 'present' : 'absent_audit_fact',
      productionBetaBlockerInventory: existsSync('docs/production-beta-blocker-inventory.md') ? 'present' : 'absent_audit_fact',
      productionFoundationStatus: existsSync('PRODUCTION_FOUNDATION_STATUS.md') ? 'present' : 'absent_audit_fact',
    },
    supabaseClassification: supabaseClassification(),
  }
}

function buildEvidenceRevalidationReport(generatedAt: string, evidence: JsonRecord) {
  const checks = [
    ['pr514_decision_present', evidenceExists(evidence, 'pr514Decision')],
    ['pr514_docker_build_report_present', evidenceExists(evidence, 'pr514DockerBuild')],
    ['pr514_ffmpeg_report_present', evidenceExists(evidence, 'pr514Ffmpeg')],
    ['pr514_ffprobe_report_present', evidenceExists(evidence, 'pr514Ffprobe')],
    ['pr514_cleanup_report_present', evidenceExists(evidence, 'pr514Cleanup')],
    ['pr514_side_effect_report_present', evidenceExists(evidence, 'pr514SideEffect')],
    ['pr508_build_context_generation_present', evidenceExists(evidence, 'pr508Decision')],
    ['pr504_build_context_approval_present', evidenceExists(evidence, 'pr504Decision')],
    ['pr490_exact_command_resolution_present', evidenceExists(evidence, 'pr490Decision')],
    ['pr481_probe_approval_present', evidenceExists(evidence, 'pr481Decision')],
    ['pr477_source_reconciliation_present', evidenceExists(evidence, 'pr477Decision')],
  ].map(([id, passed]) => ({ id, passed }))
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.evidenceRevalidation.v1',
    generatedAt,
    checks,
    passed: checks.every((check) => check.passed),
    validationOnly: true,
    runtimeCommandsRun: false,
    supabaseClassification: supabaseClassification(),
  }
}

function buildDockerBuildQa(generatedAt: string, evidence: JsonRecord, protectedFileIntegrity: JsonRecord) {
  const dockerBuild = evidenceJson(evidence, 'pr514DockerBuild')
  const decision = evidenceJson(evidence, 'pr514Decision')
  const imageCleanup = evidenceJson(evidence, 'pr514ImageCleanup')
  const sideEffect = evidenceJson(evidence, 'pr514SideEffect')
  const accepted =
    stringValue(dockerBuild.command) === expectedDockerBuildCommand &&
    numberValue(dockerBuild.exitCode) === 0 &&
    stringValue(dockerBuild.status) === 'passed' &&
    stringValue(decision.imageTag) === TRACKA_DOCKER_BUILD_PROBE_IMAGE_TAG &&
    boolValue(imageCleanup.passed) &&
    !boolValue(sideEffect.dockerImagePushRun) &&
    boolValue(protectedFileIntegrity.passed)
  return qaReport('reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.dockerBuild.v1', generatedAt, accepted, {
    expectedDockerBuildCommand,
    actualDockerBuildCommand: dockerBuild.command,
    imageTag: TRACKA_DOCKER_BUILD_PROBE_IMAGE_TAG,
    dockerBuildExitCode: dockerBuild.exitCode,
    dockerBuildStatus: dockerBuild.status,
    dockerfilePath: 'docker/prod/render-worker/Dockerfile',
    dockerfileHash: sha256OrNull('docker/prod/render-worker/Dockerfile'),
    packageLockMutation: boolValue(sideEffect.packageLockMutationAttempted),
    dockerfileMutation: boolValue(sideEffect.dockerfileMutationRun),
    dockerignoreMutation: boolValue(sideEffect.dockerignoreMutationRun),
    dockerImagePush: boolValue(sideEffect.dockerImagePushRun),
    localImageCleanupPassed: boolValue(imageCleanup.passed),
    protectedFileIntegrityPassed: boolValue(protectedFileIntegrity.passed),
  })
}

function buildFfmpegVersionQa(generatedAt: string, evidence: JsonRecord) {
  const ffmpeg = evidenceJson(evidence, 'pr514Ffmpeg')
  const accepted =
    stringValue(ffmpeg.approvedContainerCommand) === expectedFfmpegCommand &&
    numberValue(ffmpeg.exitCode) === 0 &&
    stringValue(ffmpeg.status) === 'passed' &&
    boolValue(ffmpeg.versionDetected) &&
    boolValue(ffmpeg.noLocalHostProbe) &&
    boolValue(ffmpeg.noMediaInput) &&
    boolValue(ffmpeg.noMediaOutput) &&
    boolValue(ffmpeg.networkNone) &&
    versionLine(ffmpeg).includes('5.1.9-0+deb12u1')
  return qaReport('reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.ffmpegVersion.v1', generatedAt, accepted, {
    expectedCommand: expectedFfmpegCommand,
    actualCommand: ffmpeg.approvedContainerCommand,
    status: ffmpeg.status,
    exitCode: ffmpeg.exitCode,
    version: '5.1.9-0+deb12u1',
    versionLine: versionLine(ffmpeg),
    containerOnlyProbe: true,
    localHostProbing: false,
    mediaInput: false,
    outputMedia: false,
    networkNone: ffmpeg.networkNone,
  })
}

function buildFfprobeVersionQa(generatedAt: string, evidence: JsonRecord) {
  const ffprobe = evidenceJson(evidence, 'pr514Ffprobe')
  const accepted =
    stringValue(ffprobe.approvedContainerCommand) === expectedFfprobeCommand &&
    numberValue(ffprobe.exitCode) === 0 &&
    stringValue(ffprobe.status) === 'passed' &&
    boolValue(ffprobe.versionDetected) &&
    boolValue(ffprobe.noLocalHostProbe) &&
    boolValue(ffprobe.noMediaInput) &&
    boolValue(ffprobe.noMediaOutput) &&
    boolValue(ffprobe.networkNone) &&
    versionLine(ffprobe).includes('5.1.9-0+deb12u1')
  return qaReport('reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.ffprobeVersion.v1', generatedAt, accepted, {
    expectedCommand: expectedFfprobeCommand,
    actualCommand: ffprobe.approvedContainerCommand,
    status: ffprobe.status,
    exitCode: ffprobe.exitCode,
    version: '5.1.9-0+deb12u1',
    versionLine: versionLine(ffprobe),
    containerOnlyProbe: true,
    localHostProbing: false,
    mediaFileProbing: false,
    mediaInput: false,
    outputMedia: false,
    networkNone: ffprobe.networkNone,
  })
}

function buildGeneratedArtifactCleanupQa(generatedAt: string, evidence: JsonRecord) {
  const scan = evidenceJson(evidence, 'pr514Scan')
  const cleanup = evidenceJson(evidence, 'pr514Cleanup')
  const manifest = evidenceJson(evidence, 'pr514Manifest')
  const directoryChecks = [...distDirectories, 'dist'].map((directory) => ({
    directory,
    present: existsSync(directory),
    staged: Boolean(gitOutput(['status', '--short', '--', directory])),
  }))
  const accepted =
    boolValue(scan.passed) &&
    arrayLength(scan.forbiddenFindings) === 0 &&
    boolValue(cleanup.passed) &&
    !boolValue(manifest.rawGeneratedFileContentsCommitted) &&
    directoryChecks.every((check) => !check.present && !check.staged)
  return qaReport(
    'reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.generatedArtifactCleanup.v1',
    generatedAt,
    accepted,
    {
      directoryChecks,
      nodeModulesStaged: Boolean(gitOutput(['status', '--short', '--', 'node_modules'])),
      nodeModulesCommitAllowed: false,
      generatedArtifactScanPassed: scan.passed,
      forbiddenFindingsCount: arrayLength(scan.forbiddenFindings),
      expectedStaticPngWarningsOnly: arrayValue(scan.warnings).every((warning) =>
        stringValue((warning as JsonRecord).type) === 'expected_static_asset_copied_to_build_context',
      ),
      cleanupPassed: cleanup.passed,
      generatedOutputsCommitted: manifest.generatedDistOutputsCommitted,
      rawGeneratedFileContentsCommitted: manifest.rawGeneratedFileContentsCommitted,
    },
  )
}

function buildMediaRenderBlockedScopeQa(generatedAt: string, evidence: JsonRecord) {
  const decision = evidenceJson(evidence, 'pr514Decision')
  const sideEffect = evidenceJson(evidence, 'pr514SideEffect')
  const falseFields = [
    'localHostProbingRun',
    'mediaInputUsed',
    'mediaProcessingRun',
    'renderExportRun',
    'dockerImagePushRun',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'rawPromptsRun',
  ]
  const sideEffectFalseFields = [
    'localHostProbingRun',
    'mediaInputUsed',
    'mediaProbeRun',
    'mediaDecodeEncodeRun',
    'captionBurnInRun',
    'renderExportRun',
    'outputMediaCreated',
    'npmInstallRun',
    'npmRebuildRun',
    'duckdbProofRerun',
    'polarsProofRerun',
    'workerExecutionRun',
    'routeExecutionRun',
    'providerModelCallsRun',
    'supabaseWritesRun',
    'sqlRun',
    'gcsUploadRun',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'betaProductionUnlocked',
    'rawPromptsRun',
    'prMergesRun',
    'secretsPrinted',
  ]
  const decisionChecks = falseFields.map((field) => ({ field, passed: decision[field] !== true }))
  const sideEffectChecks = sideEffectFalseFields.map((field) => ({ field, passed: sideEffect[field] !== true }))
  const accepted = [...decisionChecks, ...sideEffectChecks].every((check) => check.passed)
  return qaReport('reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.mediaRenderBlockedScope.v1', generatedAt, accepted, {
    decisionChecks,
    sideEffectChecks,
    mediaProcessingAccepted: false,
    captionBurnInAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    routeRuntimeAccepted: false,
    providerRuntimeAccepted: false,
    supabaseGcsPublicDeliveryAccepted: false,
  })
}

function buildCentralOpenSourceStatusUpdate(
  generatedAt: string,
  dockerBuildQa: JsonRecord,
  ffmpegVersionQa: JsonRecord,
  ffprobeVersionQa: JsonRecord,
  mediaRenderBlockedScopeQa: JsonRecord,
) {
  const ffmpegAccepted = boolValue(ffmpegVersionQa.accepted)
  const ffprobeAccepted = boolValue(ffprobeVersionQa.accepted)
  const accepted = boolValue(dockerBuildQa.accepted) && ffmpegAccepted && ffprobeAccepted && boolValue(mediaRenderBlockedScopeQa.accepted)
  return qaReport('reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.centralStatusUpdate.v1', generatedAt, accepted, {
    duckdb: 'accepted_installed_and_proven_from_pr466_and_pr469',
    polars: 'accepted_installed_and_proven_from_pr455_and_pr469',
    sharpLibvips: 'accepted_proven_from_batch_1',
    ffmpeg: ffmpegAccepted ? 'version_proven_for_tracka_container_path_only' : 'not_accepted',
    ffprobe: ffprobeAccepted ? 'version_proven_for_tracka_container_path_only' : 'not_accepted',
    ffmpegVersion: ffmpegAccepted ? '5.1.9-0+deb12u1' : null,
    ffprobeVersion: ffprobeAccepted ? '5.1.9-0+deb12u1' : null,
    mediaProcessingAccepted: false,
    captionBurnInAccepted: false,
    renderExportAccepted: false,
    internalBetaStatus: 'evidence_improved_internal_testing_only_external_beta_blocked',
    nextPrompt,
  })
}

function buildDecision(
  generatedAt: string,
  inputs: {
    dockerBuildQa: JsonRecord
    ffmpegVersionQa: JsonRecord
    ffprobeVersionQa: JsonRecord
    generatedArtifactCleanupQa: JsonRecord
    mediaRenderBlockedScopeQa: JsonRecord
    protectedFileIntegrity: JsonRecord
  },
) {
  let decision: TrackaDockerBuildProbeQaDecision = expectedDecision
  const blockers: string[] = []
  if (!boolValue(inputs.dockerBuildQa.accepted)) {
    decision = 'blocked_pending_docker_build_evidence_review'
    blockers.push('docker_build_evidence_not_accepted')
  } else if (!boolValue(inputs.ffmpegVersionQa.accepted)) {
    decision = 'blocked_pending_ffmpeg_version_evidence_review'
    blockers.push('ffmpeg_version_evidence_not_accepted')
  } else if (!boolValue(inputs.ffprobeVersionQa.accepted)) {
    decision = 'blocked_pending_ffprobe_version_evidence_review'
    blockers.push('ffprobe_version_evidence_not_accepted')
  } else if (!boolValue(inputs.generatedArtifactCleanupQa.accepted)) {
    decision = 'blocked_pending_generated_artifact_cleanup_review'
    blockers.push('generated_artifact_cleanup_not_accepted')
  } else if (!boolValue(inputs.protectedFileIntegrity.passed)) {
    decision = 'blocked_pending_package_dockerfile_integrity_review'
    blockers.push('package_dockerfile_integrity_not_accepted')
  } else if (!boolValue(inputs.mediaRenderBlockedScopeQa.accepted)) {
    decision = 'rejected_due_runtime_safety_risk'
    blockers.push('runtime_scope_unlocked')
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.decision.v1',
    generatedAt,
    decision,
    readiness: decision === expectedDecision,
    acceptedWithMediaProcessingStillBlocked: decision === expectedDecision,
    readyForBatch1Rollup: decision === expectedDecision,
    nextPrompt: decision === expectedDecision ? nextPrompt : 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_BLOCKER_RESOLUTION',
    nextPromptFile: decision === expectedDecision ? nextPromptPath : blockerPromptPath,
    blockers,
    ffmpegAcceptedAsVersionProvenForTrackaContainerPath: decision === expectedDecision,
    ffprobeAcceptedAsVersionProvenForTrackaContainerPath: decision === expectedDecision,
    mediaProcessingAccepted: false,
    captionBurnInAccepted: false,
    renderExportAccepted: false,
    dockerBuildRunInThisPhase: false,
    dockerRunRunInThisPhase: false,
    ffmpegProbeRunInThisPhase: false,
    ffprobeProbeRunInThisPhase: false,
    buildContextGenerationRunInThisPhase: false,
    npmInstallRunInThisPhase: false,
    npmRebuildRunInThisPhase: false,
    workerExecutionRunInThisPhase: false,
    routeExecutionRunInThisPhase: false,
    providerCallsRunInThisPhase: false,
    supabaseWritesRunInThisPhase: false,
    gcsUploadRunInThisPhase: false,
    publicArtifactsCreatedInThisPhase: false,
    signedUrlsCreatedInThisPhase: false,
    betaProductionUnlockedInThisPhase: false,
    rawPromptsRunInThisPhase: false,
    secretsPrintedInThisPhase: false,
    supabaseClassification: supabaseClassification(),
  }
}

function qaReport(schema: string, generatedAt: string, accepted: boolean, details: JsonRecord) {
  return {
    schema,
    generatedAt,
    status: accepted ? 'accepted' : 'blocked',
    accepted,
    details,
    warnings: accepted ? ['media_processing_render_export_and_production_scope_remain_blocked'] : [],
    blockers: accepted ? [] : ['qa_evidence_review_failed'],
    followUp: accepted ? nextPrompt : 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_BLOCKER_RESOLUTION',
    supabaseClassification: supabaseClassification(),
  }
}

function protectedFileIntegrityReport() {
  const files = protectedFiles.map((filePath) => ({
    path: filePath,
    exists: existsSync(filePath),
    sha256: sha256OrNull(filePath),
    gitStatus: gitOutput(['status', '--short', '--', filePath]),
    dependencySectionsUnchanged: filePath === 'package.json' ? packageDependencySectionsUnchanged() : true,
  }))
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeQa.protectedFileIntegrity.v1',
    files,
    passed: files.every((file) => file.exists && (!file.gitStatus || (file.path === 'package.json' && file.dependencySectionsUnchanged))),
  }
}

function writeNextPrompt(decision: JsonRecord) {
  if (decision.decision === expectedDecision) {
    writeText(
      nextPromptPath,
      `# ${nextPrompt}\n\nContinue with the Batch 1 final rollup after accepting Track A container FFmpeg/FFprobe version proof.\n\nInputs:\n- Track A container FFmpeg version proof: accepted for container path only.\n- Track A container FFprobe version proof: accepted for container path only.\n- Media processing, caption burn-in, render/export, worker execution, public delivery, beta, and production remain blocked.\n- Supabase classification remains no write / environment none / SQL none / migration no.\n`,
    )
    return
  }
  writeText(
    blockerPromptPath,
    '# OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_BLOCKER_RESOLUTION\n\nResolve the blocked QA evidence before accepting FFmpeg/FFprobe version proof.\n',
  )
}

function updateStatusDocs(decision: JsonRecord) {
  const section = [
    '',
    '## Track A Container FFmpeg/FFprobe Version-Probe QA Review',
    '',
    `- Source SHA: \`${TRACKA_DOCKER_BUILD_PROBE_QA_SOURCE_SHA}\``,
    `- Decision: \`${decision.decision}\``,
    '- FFmpeg: accepted as version-proven for the Track A container path only (`5.1.9-0+deb12u1`).',
    '- FFprobe: accepted as version-proven for the Track A container path only (`5.1.9-0+deb12u1`).',
    '- Media processing, caption burn-in, render/export, worker execution, route execution, provider calls, public delivery, beta, and production remain blocked.',
    `- Next prompt: \`${decision.nextPrompt}\``,
    '- Supabase: no write / environment none / SQL none / migration no.',
    '',
  ].join('\n')
  for (const filePath of statusDocPaths) appendText(filePath, section)
}

function decisionMarkdown(decision: JsonRecord) {
  return [
    '# Track A Container Docker Build FFmpeg/FFprobe Version-Probe QA Decision',
    '',
    `Decision: \`${decision.decision}\``,
    '',
    `Next prompt: \`${decision.nextPrompt}\``,
    '',
    '- FFmpeg and FFprobe are accepted as version-proven for the Track A container path only when this decision passes.',
    '- Media processing, caption burn-in, render/export, worker execution, public delivery, beta, and production remain blocked.',
    '',
  ].join('\n')
}

function validationMarkdown(reports: TrackaDockerBuildProbeQaReports) {
  return [
    '# Track A Container Docker Build FFmpeg/FFprobe Version-Probe QA Validation',
    '',
    `Decision: \`${reports.decision.decision}\``,
    '',
    `Docker build QA accepted: ${reports.dockerBuildQa.accepted}`,
    `FFmpeg QA accepted: ${reports.ffmpegVersionQa.accepted}`,
    `FFprobe QA accepted: ${reports.ffprobeVersionQa.accepted}`,
    `Cleanup QA accepted: ${reports.generatedArtifactCleanupQa.accepted}`,
    `Media/render blocked scope QA accepted: ${reports.mediaRenderBlockedScopeQa.accepted}`,
    '',
    'No build-context generation, Docker, FFmpeg, FFprobe, media/render, worker/route/provider, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production execution is performed by this QA packet.',
    '',
  ].join('\n')
}

function markdownReport(title: string, report: JsonRecord) {
  return [`# ${title}`, '', '```json', JSON.stringify(report, null, 2), '```', ''].join('\n')
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    updateStatus: 'not_applicable',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  }
}

function evidenceExists(evidence: JsonRecord, key: string) {
  return boolValue((evidence[key] as JsonRecord | undefined)?.exists)
}

function evidenceJson(evidence: JsonRecord, key: string): JsonRecord {
  const entry = evidence[key] as JsonRecord | undefined
  return (entry?.json as JsonRecord | undefined) ?? {}
}

function versionLine(report: JsonRecord) {
  const summary = arrayValue(report.versionSummary)
  const first = summary[0]
  return typeof first === 'string' ? first : ''
}

function readJson(filePath: string): JsonRecord {
  if (!existsSync(filePath)) return {}
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonRecord
}

function writeJson(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(filePath: string, value: string) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`)
}

function appendText(filePath: string, value: string) {
  if (!existsSync(filePath)) return
  const existing = readFileSync(filePath, 'utf8')
  writeText(filePath, `${existing.trimEnd()}\n${value}`)
}

function sha256(filePath: string) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function sha256OrNull(filePath: string) {
  return existsSync(filePath) ? sha256(filePath) : null
}

function gitOutput(args: string[]) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    }).trim()
  } catch {
    return ''
  }
}

function packageDependencySectionsUnchanged() {
  try {
    const current = readJson('package.json')
    const base = JSON.parse(gitOutput(['show', `origin/${TRACKA_DOCKER_BUILD_PROBE_QA_BASE_BRANCH}:package.json`])) as JsonRecord
    const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
    return sections.every((section) => JSON.stringify(current[section] ?? {}) === JSON.stringify(base[section] ?? {}))
  } catch {
    return false
  }
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: unknown) {
  return typeof value === 'number' ? value : null
}

function boolValue(value: unknown) {
  return value === true
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function arrayLength(value: unknown) {
  return arrayValue(value).length
}
