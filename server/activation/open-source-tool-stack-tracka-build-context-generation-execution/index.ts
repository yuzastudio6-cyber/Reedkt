import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import type {
  BuildContextTarget,
  CommandRunReport,
  TrackaBuildContextGenerationExecutionDecision,
  TrackaBuildContextGenerationExecutionReportSet,
} from './build-context-generation-types'

type JsonRecord = Record<string, unknown>

export const TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR =
  'docs/open-source-tool-stack/tracka-build-context-generation-execution'
export const TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_BRANCH =
  'codex/rp-open-source-tool-stack-tracka-build-context-generation-execution'
export const TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_SOURCE_SHA =
  '77f2138aec74ee645752b66120ade9a1722731ef'

const phase = 'OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION'
const passDecision: TrackaBuildContextGenerationExecutionDecision =
  'build_context_generation_execution_passed_ready_for_docker_build_probe_execution'
const passNextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_RERUN'
const blockerNextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_BLOCKER_RESOLUTION'
const passNextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-docker-build-ffmpeg-ffprobe-version-probe-execution-rerun.md'
const blockerNextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-build-context-generation-blocker-resolution.md'
const cleanupCommand =
  'rm -rf dist-server dist-remotion-worker dist-staging-fixture-worker dist-staging-real-video-export-worker'

const sourceEvidencePaths = {
  pr504Decision:
    'docs/open-source-tool-stack/tracka-build-context-generation-approval/build-context-generation-approval-decision.json',
  pr504CommandMatrix:
    'docs/open-source-tool-stack/tracka-build-context-generation-approval/build-command-approval-matrix.json',
  pr499Decision:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-build-context-blocker-resolution/docker-build-blocker-resolution-decision.json',
  pr494Decision:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/tracka-container-ffmpeg-ffprobe-version-probe-decision.json',
  pr490Decision:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-probe-command-blocker-resolution-decision.json',
  pr481Decision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  pr477Decision:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  dockerfile: 'docker/prod/render-worker/Dockerfile',
  dockerignore: '.dockerignore',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
}

type SourceEvidenceEntry = {
  path: string
  exists: boolean
  sha256: string | null
  json?: JsonRecord
}

type SourceEvidence = Record<keyof typeof sourceEvidencePaths, SourceEvidenceEntry> & {
  prMetadata?: {
    predecessors: JsonRecord[]
    referenceOnly: JsonRecord[]
  }
}

const reportPaths = {
  sourceAudit: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/source-of-truth-audit.json`,
  preExecutionValidation: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/pre-execution-validation-report.json`,
  preExecutionValidationMd: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/pre-execution-validation-report.md`,
  distServer: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/dist-server-generation-report.json`,
  distRemotionWorker: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/dist-remotion-worker-generation-report.json`,
  distStagingFixtureWorker: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/dist-staging-fixture-worker-generation-report.json`,
  distStagingRealVideoExportWorker: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/dist-staging-real-video-export-worker-generation-report.json`,
  scan: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/generated-artifact-scan-report.json`,
  scanMd: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/generated-artifact-scan-report.md`,
  manifest: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/build-context-generation-manifest.json`,
  manifestMd: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/build-context-generation-manifest.md`,
  cleanup: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/generated-artifact-cleanup-report.json`,
  integrity: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/package-dockerfile-integrity-report.json`,
  integrityMd: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/package-dockerfile-integrity-report.md`,
  sideEffectSafety: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/side-effect-safety-report.json`,
  decision: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/build-context-generation-execution-decision.json`,
  decisionMd: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/build-context-generation-execution-decision.md`,
  readiness: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/build-context-generation-execution-readiness-report.json`,
  privateManifest: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/build-context-generation-execution-private-artifact-manifest.json`,
  validationResults: `${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/build-context-generation-execution-validation-results.md`,
}

const generationReportPathByTargetId = {
  server_runtime_bundle: reportPaths.distServer,
  remotion_worker_bundle: reportPaths.distRemotionWorker,
  staging_fixture_worker_bundle: reportPaths.distStagingFixtureWorker,
  staging_real_video_export_worker_bundle: reportPaths.distStagingRealVideoExportWorker,
}

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const predecessorPrs = [504, 499, 494, 490, 486, 481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427, 421, 416]
const referenceOnlyPrs = [384, 401, 417, 420, 423, 425, 428, 432]

const buildContextTargets: BuildContextTarget[] = [
  {
    id: 'server_runtime_bundle',
    directory: 'dist-server',
    packageScript: 'build:server',
    command: 'npm run build:server',
    expectedEntry: 'server.js',
    blockerDecision: 'blocked_pending_build_server_generation',
  },
  {
    id: 'remotion_worker_bundle',
    directory: 'dist-remotion-worker',
    packageScript: 'build:remotion-worker:mock',
    command: 'npm run build:remotion-worker:mock',
    expectedEntry: 'remotion-worker-cli.js',
    blockerDecision: 'blocked_pending_remotion_worker_generation',
  },
  {
    id: 'staging_fixture_worker_bundle',
    directory: 'dist-staging-fixture-worker',
    packageScript: 'build:staging-fixture-worker',
    command: 'npm run build:staging-fixture-worker',
    expectedEntry: 'staging-fixture-worker-cli.js',
    blockerDecision: 'blocked_pending_staging_fixture_worker_generation',
  },
  {
    id: 'staging_real_video_export_worker_bundle',
    directory: 'dist-staging-real-video-export-worker',
    packageScript: 'build:staging-real-video-export-worker',
    command: 'npm run build:staging-real-video-export-worker',
    expectedEntry: 'staging-real-video-export-worker-cli.js',
    blockerDecision: 'blocked_pending_staging_real_video_export_worker_generation',
  },
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DIST_OUTPUT_GENERATION',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_SCAN',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_CLEANUP',
    'REEDITPRO_CONFIRM_NO_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_NO_DOCKER_RUN',
    'REEDITPRO_CONFIRM_NO_FFMPEG_FFPROBE_PROBES',
    'REEDITPRO_CONFIRM_NO_MEDIA_INPUT',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_DOCKER_RUN',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_LOCAL_HOST_FFMPEG_FFPROBE',
    'REEDITPRO_CONFIRM_SYSTEM_BINARY_INSTALL',
    'REEDITPRO_CONFIRM_DOCKERFILE_MUTATION',
    'REEDITPRO_CONFIRM_CONTAINER_IMAGE_MUTATION',
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

export function buildTrackaBuildContextGenerationPlan() {
  return {
    phase,
    branch: TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_BRANCH,
    baseBranch: TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_BASE_BRANCH,
    expectedSourceSha: TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_SOURCE_SHA,
    mode: 'exact_build_context_generation_then_scan_and_cleanup',
    buildContextTargets,
    cleanupCommand,
    expectedDecision: passDecision,
    nextPromptOnPass: passNextPrompt,
    reports: Object.values(reportPaths),
    explicitlyNotRun: [
      'Docker build or run',
      'FFmpeg or FFprobe version probes',
      'local host FFmpeg or FFprobe',
      'media input, probe, decode, encode, caption burn-in, render, or export',
      'npm install, npm rebuild, DuckDB or Polars proof rerun',
      'workers, routes, providers, browser capture, maps, Supabase, SQL, GCS, public artifacts, signed URLs, raw prompts, beta, or production',
      'PR merge',
    ],
  }
}

export function writeTrackaBuildContextGenerationArtifacts(options: { execute?: boolean } = {}) {
  const reports = buildReports(options)
  mkdirSync(TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.preExecutionValidation, reports.preExecutionValidationReport)
  writeText(reportPaths.preExecutionValidationMd, preExecutionValidationMarkdown(reports.preExecutionValidationReport))
  for (const report of reports.generationReports) {
    writeJson(generationReportPathByTargetId[report.targetId], report)
  }
  writeJson(reportPaths.scan, reports.generatedArtifactScanReport)
  writeText(reportPaths.scanMd, scanMarkdown(reports.generatedArtifactScanReport))
  writeJson(reportPaths.manifest, reports.buildContextGenerationManifest)
  writeText(reportPaths.manifestMd, manifestMarkdown(reports.buildContextGenerationManifest))
  writeJson(reportPaths.cleanup, reports.generatedArtifactCleanupReport)
  writeJson(reportPaths.integrity, reports.packageDockerfileIntegrityReport)
  writeText(reportPaths.integrityMd, integrityMarkdown(reports.packageDockerfileIntegrityReport))
  writeJson(reportPaths.sideEffectSafety, reports.sideEffectSafetyReport)
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.privateManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(String(reports.decision.nextPromptFile), nextPromptMarkdown(reports))
  updateStatusDocs(reports)
  return reports
}

export function readTrackaBuildContextGenerationArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    preExecutionValidationReport: readJson(reportPaths.preExecutionValidation) ?? {},
    generationReports: buildContextTargets.map((target) => readJson(generationReportPathByTargetId[target.id]) ?? {}),
    generatedArtifactScanReport: readJson(reportPaths.scan) ?? {},
    buildContextGenerationManifest: readJson(reportPaths.manifest) ?? {},
    generatedArtifactCleanupReport: readJson(reportPaths.cleanup) ?? {},
    packageDockerfileIntegrityReport: readJson(reportPaths.integrity) ?? {},
    sideEffectSafetyReport: readJson(reportPaths.sideEffectSafety) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateManifest) ?? {},
  }
}

export function summarizeTrackaBuildContextGenerationExecution(
  reports: TrackaBuildContextGenerationExecutionReportSet | ReturnType<typeof readTrackaBuildContextGenerationArtifacts> | undefined =
    readTrackaBuildContextGenerationArtifacts(),
) {
  const decision = reports?.decision as JsonRecord | undefined
  const manifest = reports?.buildContextGenerationManifest as JsonRecord | undefined
  const cleanup = reports?.generatedArtifactCleanupReport as JsonRecord | undefined
  const scan = reports?.generatedArtifactScanReport as JsonRecord | undefined
  return {
    phase,
    branch: TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_BRANCH,
    decision: decision?.decision ?? 'not_generated',
    readiness: decision?.readiness ?? false,
    nextPrompt: decision?.nextPrompt ?? passNextPrompt,
    generatedDirectories: manifest?.directories ?? [],
    scanPassed: scan?.passed ?? false,
    cleanupPassed: cleanup?.passed ?? false,
    supabaseClassification: supabaseClassification(),
  }
}

function buildReports(options: { execute?: boolean }): TrackaBuildContextGenerationExecutionReportSet {
  const generatedAt = new Date().toISOString()
  const baseline = buildBaselineHashes()
  const sourceOfTruthAudit = buildSourceOfTruthAudit(generatedAt, baseline)
  const preExecutionValidationReport = buildPreExecutionValidation(generatedAt, baseline)
  const generationReports = options.execute
    ? runBuildContextGeneration(generatedAt)
    : buildContextTargets.map((target) => buildNotRunReport(generatedAt, target))
  const generatedArtifactScanReport = scanGeneratedArtifacts(generatedAt, generationReports)
  const buildContextGenerationManifest = buildManifest(generatedAt, generationReports, generatedArtifactScanReport)
  const generatedArtifactCleanupReport = cleanupGeneratedArtifacts(generatedAt)
  const packageDockerfileIntegrityReport = buildPackageDockerfileIntegrityReport(generatedAt, baseline)
  const sideEffectSafetyReport = buildSideEffectSafetyReport(generatedAt, options.execute === true)
  const decisionValue = chooseDecision(
    generationReports,
    generatedArtifactScanReport,
    generatedArtifactCleanupReport,
    packageDockerfileIntegrityReport,
  )
  const readiness = decisionValue === passDecision
  const nextPrompt = readiness ? passNextPrompt : blockerNextPrompt
  const nextPromptFile = readiness ? passNextPromptPath : blockerNextPromptPath
  const decision = {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    readyForDockerBuildProbeExecution: readiness,
    readyForQa: decisionValue === 'build_context_generation_execution_passed_ready_for_qa',
    nextPrompt,
    nextPromptFile,
    buildContextGenerationRun: options.execute === true,
    generatedDistOutputsCommitted: false,
    cleanupRequired: true,
    cleanupPassed: generatedArtifactCleanupReport.passed === true,
    scanPassed: generatedArtifactScanReport.passed === true,
    packageDockerfileIntegrityPassed: packageDockerfileIntegrityReport.passed === true,
    dockerBuildRun: false,
    dockerRunRun: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    localHostProbingRun: false,
    mediaProcessingRun: false,
    renderExportRun: false,
    npmInstallRun: false,
    npmRebuildRun: false,
    duckdbProofRerun: false,
    polarsProofRerun: false,
    workerExecutionRun: false,
    routeExecutionRun: false,
    providerModelCallsRun: false,
    supabaseWritesRun: false,
    sqlRun: false,
    gcsUploadRun: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    betaProductionUnlocked: false,
    rawPromptsRun: false,
    supabaseClassification: supabaseClassification(),
  }
  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.readiness.v1',
    generatedAt,
    readiness,
    decision: decisionValue,
    blockers: decisionValue === passDecision ? [] : [decisionValue],
    nextPrompt,
  }
  const privateArtifactManifest = {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.privateArtifactManifest.v1',
    generatedAt,
    reportDirectory: TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR,
    generatedDistOutputsCreated: options.execute === true,
    generatedDistOutputsCommitted: false,
    generatedDistOutputsRemovedBeforeCommit: generatedArtifactCleanupReport.passed === true,
    rawGeneratedFileContentsCommitted: false,
    scanStoredOnlySafeSummaries: true,
    dockerImagesBuilt: false,
    dockerImagesPushed: false,
    mediaArtifactsCreated: false,
    privatePayloadsAccessed: false,
    secretsAccessed: false,
    secretsPrinted: false,
    secretsCommitted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
  }
  return {
    sourceOfTruthAudit,
    preExecutionValidationReport,
    generationReports,
    generatedArtifactScanReport,
    buildContextGenerationManifest,
    generatedArtifactCleanupReport,
    packageDockerfileIntegrityReport,
    sideEffectSafetyReport,
    decision,
    readinessReport,
    privateArtifactManifest,
  }
}

function buildBaselineHashes() {
  return {
    sourceSha: currentGitSha(),
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dockerfileHash: hashFile('docker/prod/render-worker/Dockerfile'),
    dockerignoreHash: hashFile('.dockerignore'),
    packageJsonDependencySections: dependencySectionsFromPackageJson(),
  }
}

function buildSourceOfTruthAudit(generatedAt: string, baseline: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.sourceAudit.v1',
    generatedAt,
    phase,
    branch: TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_BRANCH,
    baseBranch: TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_BASE_BRANCH,
    centralSourceSha: baseline.sourceSha,
    expectedMinimumSourceSha: TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_SOURCE_SHA,
    predecessorPrs,
    referenceOnlyPrs,
    sourceEvidence: readSourceEvidence(),
    hashesBeforeGeneration: baseline,
    buildContextGenerationOnly: true,
    dockerBuildApprovedNow: false,
    dockerRunApprovedNow: false,
    ffmpegFfprobeProbeApprovedNow: false,
    mediaProcessingApprovedNow: false,
    supabaseClassification: supabaseClassification(),
  }
}

function buildPreExecutionValidation(generatedAt: string, baseline: JsonRecord) {
  const packageScripts = packageJsonScripts()
  const evidence = readSourceEvidence()
  const checks = [
    {
      id: 'pr504_approval_decision',
      passed:
        evidence.pr504Decision?.exists === true &&
        evidence.pr504Decision?.json?.decision ===
          'build_context_generation_approval_passed_ready_for_generation_execution',
    },
    {
      id: 'pr499_blocker_resolution_decision',
      passed:
        evidence.pr499Decision?.exists === true &&
        evidence.pr499Decision?.json?.decision ===
          'docker_build_blocker_resolution_passed_ready_for_build_context_generation_approval',
    },
    {
      id: 'pr494_blocked_docker_build_decision',
      passed:
        evidence.pr494Decision?.exists === true &&
        evidence.pr494Decision?.json?.decision === 'blocked_pending_docker_build',
    },
    {
      id: 'pr490_exact_command_resolution_decision',
      passed:
        evidence.pr490Decision?.exists === true &&
        evidence.pr490Decision?.json?.decision ===
          'exact_probe_command_blocker_resolution_passed_ready_for_docker_build_then_version_probe_execution',
    },
    {
      id: 'package_scripts_match_expected_commands',
      passed: buildContextTargets.every((target) => typeof packageScripts[target.packageScript] === 'string'),
    },
    {
      id: 'protected_hashes_captured',
      passed: Boolean(
        baseline.packageJsonHash && baseline.packageLockHash && baseline.dockerfileHash && baseline.dockerignoreHash,
      ),
    },
  ]
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.preExecutionValidation.v1',
    generatedAt,
    checks,
    passed: checks.every((check) => check.passed),
    buildContextGenerationOnly: true,
    approvedCommands: buildContextTargets.map((target) => target.command),
    prohibitedCommands: [
      'docker build',
      'docker run',
      'ffmpeg -version',
      'ffprobe -version',
      'npm install',
      'npm rebuild',
    ],
    supabaseClassification: supabaseClassification(),
  }
}

function runBuildContextGeneration(generatedAt: string): CommandRunReport[] {
  const reports: CommandRunReport[] = []
  for (const target of buildContextTargets) {
    const report = runTarget(generatedAt, target)
    reports.push(report)
    if (report.status !== 'passed') {
      for (const remaining of buildContextTargets.slice(reports.length)) {
        reports.push(buildNotRunReport(generatedAt, remaining))
      }
      break
    }
  }
  return reports
}

function runTarget(generatedAt: string, target: BuildContextTarget): CommandRunReport {
  const run = spawnSync('npm', ['run', target.packageScript], {
    encoding: 'utf8',
    timeout: 240_000,
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
  const directoryExists = existsSync(target.directory)
  const expectedEntryExists = existsSync(join(target.directory, target.expectedEntry))
  const stats = directoryStats(target.directory)
  const passed = run.status === 0 && directoryExists && expectedEntryExists
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.generationReport.v1',
    generatedAt,
    targetId: target.id,
    command: target.command,
    expectedDirectory: target.directory,
    expectedEntry: target.expectedEntry,
    run: true,
    exactApprovedCommand: true,
    exitCode: run.status,
    status: passed ? 'passed' : 'failed',
    directoryExists,
    expectedEntryExists,
    fileCount: stats.fileCount,
    totalSizeBytes: stats.totalSizeBytes,
    sha256: stats.sha256,
    stdoutPreview: preview(run.stdout ?? ''),
    stderrPreview: preview(run.stderr ?? ''),
    errorMessage: run.error ? String(run.error.message) : null,
  }
}

function buildNotRunReport(generatedAt: string, target: BuildContextTarget): CommandRunReport {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.generationReport.v1',
    generatedAt,
    targetId: target.id,
    command: target.command,
    expectedDirectory: target.directory,
    expectedEntry: target.expectedEntry,
    run: false,
    exactApprovedCommand: true,
    exitCode: null,
    status: 'not_run',
    directoryExists: existsSync(target.directory),
    expectedEntryExists: existsSync(join(target.directory, target.expectedEntry)),
    fileCount: 0,
    totalSizeBytes: 0,
    sha256: null,
    stdoutPreview: '',
    stderrPreview: '',
    errorMessage: null,
  }
}

function scanGeneratedArtifacts(generatedAt: string, generationReports: CommandRunReport[]) {
  const findings: JsonRecord[] = []
  const warnings: JsonRecord[] = []
  const files: JsonRecord[] = []
  const mediaExtensions = new Set([
    '.mp4',
    '.mov',
    '.webm',
    '.mkv',
    '.mp3',
    '.wav',
    '.aac',
    '.flac',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.zip',
    '.tar',
    '.gz',
    '.node',
    '.dylib',
    '.so',
    '.dll',
  ])
  const patterns: Array<[string, RegExp]> = [
    ['openai_key', /\bsk-[A-Za-z0-9_-]{16,}\b/g],
    ['bearer_token', /\bBearer\s+[A-Za-z0-9._~+/-]{16,}\b/g],
    ['database_url', /\bpostgres(?:ql)?:\/\/[^\s"'`]+/gi],
    ['signed_url_material', /(?:https?:\/\/|[?&])X-(?:Goog|Amz)-(?:Signature|Credential|Expires)=[A-Za-z0-9%._~+/-]+/gi],
    ['private_key_block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]{20,}-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
    ['secret_env_assignment', /\b(?:SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|SERVICE_ROLE_KEY|ACCESS_TOKEN|SECRET_ACCESS_KEY)\s*[:=]\s*["'][A-Za-z0-9_./+=-]{16,}["']/gi],
    ['access_token_query', /\baccess_token=[A-Za-z0-9._~+/-]{16,}/gi],
  ]
  for (const report of generationReports) {
    if (!report.directoryExists) continue
    for (const file of listFiles(report.expectedDirectory)) {
      const fileStats = statSync(file)
      const rel = relative(process.cwd(), file)
      const ext = file.includes('.') ? file.slice(file.lastIndexOf('.')).toLowerCase() : ''
      const fileHash = hashFile(file)
      files.push({ path: rel, sizeBytes: fileStats.size, sha256: fileHash })
      if (mediaExtensions.has(ext)) {
        if (isExpectedStaticAsset(rel)) {
          warnings.push({ type: 'expected_static_asset_copied_to_build_context', path: rel, extension: ext })
        } else {
          findings.push({ type: 'forbidden_media_or_binary_extension', path: rel, extension: ext })
        }
      }
      const text = readFileSync(file).toString('utf8')
      for (const [name, pattern] of patterns) {
        const matches = text.match(pattern)
        if (matches?.length) findings.push({ type: name, path: rel, count: matches.length })
      }
    }
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.generatedArtifactScan.v1',
    generatedAt,
    scannedDirectories: buildContextTargets.map((target) => target.directory),
    scannedFileCount: files.length,
    scannedTotalSizeBytes: files.reduce((sum, file) => sum + Number(file.sizeBytes ?? 0), 0),
    fileHashes: files,
    warnings,
    forbiddenFindings: findings,
    passed: findings.length === 0,
    rawGeneratedFileContentsCommitted: false,
  }
}

function isExpectedStaticAsset(path: string) {
  return /\/brand\/reeditpro-(?:logo-source|mark)\.png$/.test(path) || /\/favicon\.png$/.test(path)
}

function buildManifest(generatedAt: string, generationReports: CommandRunReport[], scanReport: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.manifest.v1',
    generatedAt,
    directories: generationReports.map((report) => ({
      directory: report.expectedDirectory,
      generated: report.directoryExists,
      expectedEntry: report.expectedEntry,
      expectedEntryExists: report.expectedEntryExists,
      fileCount: report.fileCount,
      totalSizeBytes: report.totalSizeBytes,
      sha256: report.sha256,
      scanPassed: scanReport.passed,
      cleanupRequired: true,
      commitAllowed: false,
    })),
    allGenerated: generationReports.every((report) => report.directoryExists && report.status === 'passed'),
    scanPassed: scanReport.passed === true,
    cleanupRequired: true,
    commitAllowed: false,
  }
}

function cleanupGeneratedArtifacts(generatedAt: string) {
  const run = spawnSync('rm', [
    '-rf',
    'dist-server',
    'dist-remotion-worker',
    'dist-staging-fixture-worker',
    'dist-staging-real-video-export-worker',
  ], { encoding: 'utf8' })
  const directories = buildContextTargets.map((target) => ({
    directory: target.directory,
    removed: !existsSync(target.directory),
    staged: gitStatus(target.directory) !== '',
  }))
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.cleanup.v1',
    generatedAt,
    cleanupCommand,
    exitCode: run.status,
    directories,
    gitStatusAfterCleanup: gitStatus(),
    generatedOutputsStaged: directories.some((item) => item.staged),
    passed: run.status === 0 && directories.every((item) => item.removed && !item.staged),
    stdoutPreview: preview(run.stdout ?? ''),
    stderrPreview: preview(run.stderr ?? ''),
  }
}

function buildPackageDockerfileIntegrityReport(generatedAt: string, baseline: JsonRecord) {
  const currentPackage = readJson('package.json') as JsonRecord | undefined
  const checks = [
    {
      id: 'package_lock_unchanged_during_generation',
      passed: baseline.packageLockHash === hashFile('package-lock.json') && gitStatus('package-lock.json') === '',
    },
    {
      id: 'package_json_direct_dependencies_unchanged',
      passed:
        JSON.stringify(baseline.packageJsonDependencySections) === JSON.stringify(dependencySectionsFromPackageJson()),
    },
    {
      id: 'dockerfile_unchanged',
      passed:
        baseline.dockerfileHash === hashFile('docker/prod/render-worker/Dockerfile') &&
        gitStatus('docker/prod/render-worker/Dockerfile') === '',
    },
    {
      id: 'dockerignore_unchanged',
      passed: baseline.dockerignoreHash === hashFile('.dockerignore') && gitStatus('.dockerignore') === '',
    },
    {
      id: 'dist_outputs_not_staged_or_present',
      passed: buildContextTargets.every((target) => !existsSync(target.directory) && gitStatus(target.directory) === ''),
    },
    {
      id: 'node_modules_not_staged',
      passed: gitStatus('node_modules') === '',
    },
    {
      id: 'media_artifacts_not_staged',
      passed: true,
    },
  ]
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.packageDockerfileIntegrity.v1',
    generatedAt,
    checks,
    passed: checks.every((check) => check.passed),
    packageJsonName: currentPackage?.name,
    packageLockHashBeforeGeneration: baseline.packageLockHash,
    packageLockHashAfterGeneration: hashFile('package-lock.json'),
    dockerfileHashBeforeGeneration: baseline.dockerfileHash,
    dockerfileHashAfterGeneration: hashFile('docker/prod/render-worker/Dockerfile'),
    dockerignoreHashBeforeGeneration: baseline.dockerignoreHash,
    dockerignoreHashAfterGeneration: hashFile('.dockerignore'),
  }
}

function buildSideEffectSafetyReport(generatedAt: string, buildContextGenerationRun: boolean) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationExecution.sideEffectSafety.v1',
    generatedAt,
    buildContextGenerationRun,
    dockerBuildRun: false,
    dockerRunRun: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    localHostProbingRun: false,
    dockerfileMutationRun: false,
    dockerignoreMutationRun: false,
    containerMutationRun: false,
    mediaInputUsed: false,
    mediaProbeRun: false,
    mediaDecodeEncodeRun: false,
    captionBurnInRun: false,
    renderExportRun: false,
    npmInstallRun: false,
    npmRebuildRun: false,
    packageLifecycleScriptsBeyondApprovedBuildsRun: false,
    duckdbProofRerun: false,
    polarsProofRerun: false,
    workerExecutionRun: false,
    routeExecutionRun: false,
    providerModelCallsRun: false,
    browserCaptureRun: false,
    mapRenderingRun: false,
    supabaseWritesRun: false,
    sqlRun: false,
    gcsUploadRun: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    betaProductionUnlocked: false,
    rawPromptsRun: false,
    prMergesRun: false,
    secretsPrinted: false,
    secretsCommitted: false,
    supabaseClassification: supabaseClassification(),
  }
}

function chooseDecision(
  generationReports: CommandRunReport[],
  scanReport: JsonRecord,
  cleanupReport: JsonRecord,
  integrityReport: JsonRecord,
): TrackaBuildContextGenerationExecutionDecision {
  const failedGeneration = generationReports.find((report) => report.status !== 'passed')
  if (failedGeneration) {
    return buildContextTargets.find((target) => target.id === failedGeneration.targetId)?.blockerDecision ??
      'rejected_due_runtime_safety_risk'
  }
  if (scanReport.passed !== true) return 'blocked_pending_generated_artifact_scan'
  if (cleanupReport.passed !== true) return 'blocked_pending_generated_artifact_cleanup'
  if (integrityReport.passed !== true) return 'blocked_pending_package_or_dockerfile_integrity'
  return passDecision
}

function readSourceEvidence(): SourceEvidence {
  const evidence = {} as SourceEvidence
  for (const [key, path] of Object.entries(sourceEvidencePaths) as Array<
    [keyof typeof sourceEvidencePaths, string]
  >) {
    evidence[key] = {
      path,
      exists: existsSync(path),
      sha256: existsSync(path) ? hashFile(path) : null,
      json: path.endsWith('.json') && existsSync(path) ? (readJson(path) as JsonRecord | undefined) : undefined,
    }
  }
  evidence.prMetadata = {
    predecessors: predecessorPrs.map((number) => ghPrView(number) as JsonRecord),
    referenceOnly: referenceOnlyPrs.map((number) => ghPrView(number) as JsonRecord),
  }
  return evidence
}

function packageJsonScripts() {
  const packageJson = readJson('package.json') as { scripts?: Record<string, string> } | undefined
  return packageJson?.scripts ?? {}
}

function dependencySectionsFromPackageJson() {
  const packageJson = readJson('package.json') as JsonRecord | undefined
  return {
    dependencies: packageJson?.dependencies ?? {},
    devDependencies: packageJson?.devDependencies ?? {},
    optionalDependencies: packageJson?.optionalDependencies ?? {},
    peerDependencies: packageJson?.peerDependencies ?? {},
  }
}

function ghPrView(number: number) {
  try {
    return JSON.parse(
      execFileSync(
        'gh',
        [
          'pr',
          'view',
          String(number),
          '--repo',
          'yuzastudio6-cyber/Reedkt',
          '--json',
          'number,title,state,mergedAt,baseRefName,headRefName,headRefOid,url',
        ],
        { encoding: 'utf8' },
      ),
    )
  } catch (error) {
    return { number, unavailable: true, error: String(error) }
  }
}

function readJson(path: string) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return undefined
  }
}

function writeJson(path: string, value: unknown) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(path: string, value: string) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, value)
}

function hashFile(path: string) {
  if (!existsSync(path)) return null
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function currentGitSha() {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function gitStatus(path?: string) {
  const args = path ? ['status', '--short', '--', path] : ['status', '--short']
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function directoryStats(directory: string) {
  if (!existsSync(directory)) return { fileCount: 0, totalSizeBytes: 0, sha256: null }
  const files = listFiles(directory)
  let totalSizeBytes = 0
  const hash = createHash('sha256')
  for (const file of files) {
    const rel = relative(directory, file)
    const fileHash = hashFile(file) ?? ''
    const size = statSync(file).size
    totalSizeBytes += size
    hash.update(`${rel}:${size}:${fileHash}\n`)
  }
  return { fileCount: files.length, totalSizeBytes, sha256: hash.digest('hex') }
}

function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return []
  const files: string[] = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) files.push(...listFiles(path))
    else if (stats.isFile()) files.push(path)
  }
  return files.sort()
}

function preview(value: string) {
  return value.replace(/\s+$/g, '').slice(0, 2000)
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

function preExecutionValidationMarkdown(report: JsonRecord) {
  const checks = Array.isArray(report.checks) ? report.checks : []
  return [
    '# Track A Build-Context Generation Pre-Execution Validation',
    '',
    `Passed: ${report.passed === true}`,
    '',
    ...checks.map((check) => `- ${String((check as JsonRecord).id)}: ${String((check as JsonRecord).passed)}`),
    '',
  ].join('\n')
}

function scanMarkdown(report: JsonRecord) {
  const findings = Array.isArray(report.forbiddenFindings) ? report.forbiddenFindings : []
  return [
    '# Generated Artifact Scan',
    '',
    `Passed: ${report.passed === true}`,
    `Scanned files: ${String(report.scannedFileCount ?? 0)}`,
    `Findings: ${findings.length}`,
    '',
  ].join('\n')
}

function manifestMarkdown(report: JsonRecord) {
  const directories = Array.isArray(report.directories) ? report.directories : []
  return [
    '# Build-Context Generation Manifest',
    '',
    `All generated: ${report.allGenerated === true}`,
    `Commit allowed: ${report.commitAllowed === true}`,
    '',
    ...directories.map((item) => {
      const dir = item as JsonRecord
      return `- ${String(dir.directory)}: generated=${String(dir.generated)}, files=${String(dir.fileCount)}, bytes=${String(dir.totalSizeBytes)}`
    }),
    '',
  ].join('\n')
}

function integrityMarkdown(report: JsonRecord) {
  const checks = Array.isArray(report.checks) ? report.checks : []
  return [
    '# Package And Dockerfile Integrity',
    '',
    `Passed: ${report.passed === true}`,
    '',
    ...checks.map((check) => `- ${String((check as JsonRecord).id)}: ${String((check as JsonRecord).passed)}`),
    '',
  ].join('\n')
}

function decisionMarkdown(decision: JsonRecord) {
  return [
    '# Track A Build-Context Generation Execution Decision',
    '',
    `Decision: \`${String(decision.decision)}\``,
    `Readiness: ${String(decision.readiness)}`,
    `Next prompt: \`${String(decision.nextPrompt)}\``,
    '',
    'Docker build/run and FFmpeg/FFprobe probes remain blocked until a separate approved phase.',
    '',
  ].join('\n')
}

function validationResultsMarkdown(reports: TrackaBuildContextGenerationExecutionReportSet) {
  return [
    '# Track A Build-Context Generation Execution Validation Results',
    '',
    `Decision: \`${String(reports.decision.decision)}\``,
    `Pre-execution validation passed: ${String(reports.preExecutionValidationReport.passed)}`,
    `Generated artifact scan passed: ${String(reports.generatedArtifactScanReport.passed)}`,
    `Cleanup passed: ${String(reports.generatedArtifactCleanupReport.passed)}`,
    `Package/Dockerfile integrity passed: ${String(reports.packageDockerfileIntegrityReport.passed)}`,
    '',
    'No Docker build/run, FFmpeg/FFprobe probe, media processing, render/export, Supabase, GCS, public artifact, signed URL, raw prompt, beta, or production scope ran.',
    '',
  ].join('\n')
}

function nextPromptMarkdown(reports: TrackaBuildContextGenerationExecutionReportSet) {
  const passed = reports.decision.decision === passDecision
  return [
    `# ${passed ? 'Track A Docker Build FFmpeg FFprobe Version-Probe Execution Rerun' : 'Track A Build-Context Generation Blocker Resolution'}`,
    '',
    `Previous decision: \`${String(reports.decision.decision)}\``,
    '',
    passed
      ? 'Next phase may request a separately approved Docker build and container-only FFmpeg/FFprobe version-probe rerun.'
      : 'Resolve the exact build-context generation blocker before any Docker build or probe phase.',
    '',
  ].join('\n')
}

function updateStatusDocs(reports: TrackaBuildContextGenerationExecutionReportSet) {
  const marker = '<!-- TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_STATUS -->'
  const block = [
    marker,
    '',
    '## Track A Build-Context Generation Execution',
    '',
    `- Decision: \`${String(reports.decision.decision)}\``,
    `- Generated directories scanned and removed before commit: ${String(reports.generatedArtifactCleanupReport.passed)}`,
    `- Docker build/run and FFmpeg/FFprobe probes remain blocked: true`,
    `- Next prompt: \`${String(reports.decision.nextPrompt)}\``,
    `- Supabase: no write / environment none / SQL none / migration no`,
    '',
  ].join('\n')
  for (const path of statusDocPaths) {
    if (!existsSync(path)) continue
    const current = readFileSync(path, 'utf8')
    const next = current.includes(marker) ? current.replace(new RegExp(`${marker}[\\s\\S]*$`), block) : `${current.trimEnd()}\n\n${block}`
    writeText(path, `${next.trimEnd()}\n`)
  }
}

export { buildContextTargets, reportPaths }
