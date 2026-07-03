import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  TrackaBuildContextGenerationApprovalDecision,
  TrackaBuildContextGenerationApprovalReportSet,
} from './tracka-build-context-generation-approval-types'

type JsonRecord = Record<string, unknown>

export const TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR =
  'docs/open-source-tool-stack/tracka-build-context-generation-approval'
export const TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_BRANCH =
  'codex/rp-open-source-tool-stack-tracka-build-context-generation-approval'
export const TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_SOURCE_SHA =
  'd5a46c12952922c8c977f52368563dc1ba12868c'

const phase = 'OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL'
const expectedDecision: TrackaBuildContextGenerationApprovalDecision =
  'build_context_generation_approval_passed_ready_for_generation_execution'
const nextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION'
const nextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-build-context-generation-execution.md'

const sourceEvidencePaths = {
  pr499Decision:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-build-context-blocker-resolution/docker-build-blocker-resolution-decision.json',
  pr499Policy:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-build-context-blocker-resolution/build-context-generation-policy.json',
  pr499Inventory:
    'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-build-context-blocker-resolution/build-script-inventory.json',
  pr494Decision:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/tracka-container-ffmpeg-ffprobe-version-probe-decision.json',
  pr490Decision:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-probe-command-blocker-resolution-decision.json',
  pr490Commands:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-future-probe-commands.json',
  pr481Decision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  pr477Decision:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  dockerfile: 'docker/prod/render-worker/Dockerfile',
  dockerignore: '.dockerignore',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
}

const reportPaths = {
  sourceAudit: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/source-of-truth-audit.json`,
  commandMatrix: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/build-command-approval-matrix.json`,
  commandMatrixMd: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/build-command-approval-matrix.md`,
  artifactPolicy: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/generated-artifact-policy.json`,
  artifactPolicyMd: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/generated-artifact-policy.md`,
  futureScope: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/future-execution-scope.json`,
  futureScopeMd: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/future-execution-scope.md`,
  decision: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/build-context-generation-approval-decision.json`,
  decisionMd: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/build-context-generation-approval-decision.md`,
  readiness: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/build-context-generation-approval-readiness-report.json`,
  privateManifest: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/build-context-generation-approval-private-artifact-manifest.json`,
  validationResults: `${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/build-context-generation-approval-validation-results.md`,
}

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const absentBroadProductionDocs = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
]

const predecessorPrs = [499, 494, 490, 486, 481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427, 421, 416]
const referenceOnlyPrs = [384, 401, 417, 420, 423, 425, 428, 432]

const buildContextTargets = [
  {
    id: 'server_runtime_bundle',
    directory: 'dist-server',
    packageScript: 'build:server',
    command: 'npm run build:server',
    config: 'vite.server.config.ts',
    expectedEntry: 'server.js',
    timeoutSeconds: 180,
  },
  {
    id: 'remotion_worker_bundle',
    directory: 'dist-remotion-worker',
    packageScript: 'build:remotion-worker:mock',
    command: 'npm run build:remotion-worker:mock',
    config: 'vite.remotion-worker.config.ts',
    expectedEntry: 'remotion-worker-cli.js',
    timeoutSeconds: 180,
  },
  {
    id: 'staging_fixture_worker_bundle',
    directory: 'dist-staging-fixture-worker',
    packageScript: 'build:staging-fixture-worker',
    command: 'npm run build:staging-fixture-worker',
    config: 'vite.staging-fixture-worker.config.ts',
    expectedEntry: 'staging-fixture-worker-cli.js',
    timeoutSeconds: 180,
  },
  {
    id: 'staging_real_video_export_worker_bundle',
    directory: 'dist-staging-real-video-export-worker',
    packageScript: 'build:staging-real-video-export-worker',
    command: 'npm run build:staging-real-video-export-worker',
    config: 'vite.staging-real-video-export-worker.config.ts',
    expectedEntry: 'staging-real-video-export-worker-cli.js',
    timeoutSeconds: 180,
  },
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL',
    'REEDITPRO_CONFIRM_TRACKA_DOCKER_BUILD_CONTEXT_BLOCKER_RESOLUTION_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_COMMAND_REVIEW',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_CLEANUP_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_DOCKERFILE_SOURCE_REVIEW',
    'REEDITPRO_CONFIRM_PACKAGE_SCRIPT_REVIEW',
    'REEDITPRO_CONFIRM_NO_BUILD_CONTEXT_GENERATION',
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
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DIST_OUTPUT_GENERATION',
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

export function buildTrackaBuildContextGenerationApprovalPlan() {
  return {
    phase,
    branch: TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_BRANCH,
    baseBranch: TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_BASE_BRANCH,
    expectedSourceSha: TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_SOURCE_SHA,
    mode: 'metadata_only_build_context_generation_approval_no_dist_no_docker_no_probes',
    decision: expectedDecision,
    nextPrompt,
    buildContextTargets,
    reports: Object.values(reportPaths),
    docs: [...statusDocPaths, nextPromptPath],
    explicitlyNotRun: [
      'build-context generation scripts',
      'Docker build or run',
      'FFmpeg or FFprobe version probes',
      'media input, probe, decode, encode, caption burn-in, render, or export',
      'npm install, npm rebuild, broad lifecycle scripts, DuckDB or Polars proof rerun',
      'workers, routes, providers, browser capture, maps, Supabase, SQL, GCS, public artifacts, signed URLs, raw prompts, beta, or production',
    ],
  }
}

export function buildTrackaBuildContextGenerationApprovalReports(): TrackaBuildContextGenerationApprovalReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const sourceEvidence = readSourceEvidence()
  const commandMatrix = buildCommandApprovalMatrix(generatedAt)
  const artifactPolicy = buildGeneratedArtifactPolicy(generatedAt)
  const futureScope = buildFutureExecutionScope(generatedAt, commandMatrix, artifactPolicy)
  const blockers = buildBlockers(commandMatrix, artifactPolicy, futureScope, flags)
  const decisionValue = chooseDecision(blockers)
  const readiness = decisionValue === expectedDecision
  const decision = buildDecision(generatedAt, decisionValue, readiness, blockers, flags)

  return {
    sourceOfTruthAudit: buildSourceOfTruthAudit(generatedAt, sourceEvidence, flags),
    buildCommandApprovalMatrix: commandMatrix,
    generatedArtifactPolicy: artifactPolicy,
    futureExecutionScope: futureScope,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationApproval.readiness.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      readyForGenerationExecution: readiness,
      readyForGenerationThenDockerProbeExecution: false,
      blockers,
      nextPrompt,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationApproval.privateArtifactManifest.v1',
      generatedAt,
      reportDirectory: TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR,
      generatedDistOutputsCreated: false,
      dockerImagesBuilt: false,
      dockerImagesPushed: false,
      mediaArtifactsCreated: false,
      privatePayloadsAccessed: false,
      privatePayloadsPrinted: false,
      privatePayloadsCommitted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      supabaseClassification: supabaseClassification(),
    },
  }
}

export function writeTrackaBuildContextGenerationApprovalArtifacts() {
  const reports = buildTrackaBuildContextGenerationApprovalReports()
  mkdirSync(TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.commandMatrix, reports.buildCommandApprovalMatrix)
  writeText(reportPaths.commandMatrixMd, commandMatrixMarkdown(reports.buildCommandApprovalMatrix))
  writeJson(reportPaths.artifactPolicy, reports.generatedArtifactPolicy)
  writeText(reportPaths.artifactPolicyMd, generatedArtifactPolicyMarkdown(reports.generatedArtifactPolicy))
  writeJson(reportPaths.futureScope, reports.futureExecutionScope)
  writeText(reportPaths.futureScopeMd, futureExecutionScopeMarkdown(reports.futureExecutionScope))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.privateManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(nextPromptPath, nextPromptMarkdown(reports))
  updateStatusDocs(reports)
  return reports
}

export function readTrackaBuildContextGenerationApprovalArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    buildCommandApprovalMatrix: readJson(reportPaths.commandMatrix) ?? {},
    generatedArtifactPolicy: readJson(reportPaths.artifactPolicy) ?? {},
    futureExecutionScope: readJson(reportPaths.futureScope) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateManifest) ?? {},
  }
}

export function summarizeTrackaBuildContextGenerationApproval(
  reports = readTrackaBuildContextGenerationApprovalArtifacts() ?? buildTrackaBuildContextGenerationApprovalReports(),
) {
  return JSON.stringify(
    {
      phase,
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      nextPrompt: reports.decision.nextPrompt,
      futureBuildContextCommands: reports.buildCommandApprovalMatrix.commands,
      buildContextGenerationRun: reports.decision.currentPhaseBuildContextGenerationRun,
      dockerBuildRun: reports.decision.currentPhaseDockerBuildRun,
      ffmpegProbeRun: reports.decision.currentPhaseFfmpegProbeRun,
      ffprobeProbeRun: reports.decision.currentPhaseFfprobeProbeRun,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  )
}

function buildSourceOfTruthAudit(generatedAt: string, sourceEvidence: JsonRecord, flags: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationApproval.sourceAudit.v1',
    generatedAt,
    phase,
    branch: TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_BRANCH,
    baseBranch: TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_BASE_BRANCH,
    centralSourceSha: currentGitSha(),
    expectedMinimumSourceSha: TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_SOURCE_SHA,
    prEvidence: [...predecessorPrs, ...referenceOnlyPrs].map((number) => ghPrView(number)),
    sourceEvidence,
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dockerfileHash: hashFile('docker/prod/render-worker/Dockerfile'),
    dockerignoreHash: hashFile('.dockerignore'),
    packageJsonChangedInThisPhase: gitStatus('package.json') !== '',
    packageLockChangedInThisPhase: gitStatus('package-lock.json') !== '',
    dockerfileChangedInThisPhase: gitStatus('docker/prod/render-worker/Dockerfile') !== '',
    dockerignoreChangedInThisPhase: gitStatus('.dockerignore') !== '',
    absentBroadProductionDocs: absentBroadProductionDocs.map((path) => ({ path, exists: existsSync(path) })),
    noScopeConfirmation: flags,
    supabaseClassification: supabaseClassification(),
  }
}

function buildCommandApprovalMatrix(generatedAt: string) {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
  const scripts = packageJson.scripts ?? {}
  const commands = buildContextTargets.map((target) => {
    const configText = existsSync(target.config) ? readFileSync(target.config, 'utf8') : ''
    const packageScriptValue = scripts[target.packageScript] ?? null
    const scriptMatchesExpected = packageScriptValue === `npm run typecheck:server && vite build --config ${target.config}`
    const configDeclaresOutDir = configText.includes(`outDir: '${target.directory}'`)
    const configDeclaresEntry = configText.includes(target.expectedEntry)
    const approvedForFutureGeneration =
      scriptMatchesExpected && existsSync(target.config) && configDeclaresOutDir && configDeclaresEntry
    return {
      ...target,
      commandSource: 'package.json scripts plus Vite SSR build config',
      packageScriptValue,
      packageScriptExists: Boolean(packageScriptValue),
      scriptMatchesExpected,
      viteConfigExists: existsSync(target.config),
      viteConfigDeclaresOutDir: configDeclaresOutDir,
      viteConfigDeclaresEntry: configDeclaresEntry,
      safeForFutureExecution: approvedForFutureGeneration,
      currentPhaseExecutionAllowed: false,
      currentPhaseCommandRun: false,
      mayProcessMedia: false,
      mayRenderExport: false,
      mayRunWorkerJobs: false,
      mayMutateSupabaseGcs: false,
      mayWriteSecretsPrivatePayloads: false,
      writesGeneratedBuildOutput: true,
      generatedOutputMayBeCommitted: false,
      cleanupCommand: `rm -rf ${target.directory}`,
      approval: approvedForFutureGeneration,
      blockers: approvedForFutureGeneration ? [] : ['blocked_pending_exact_build_context_generation_command'],
      warnings:
        target.directory === 'dist-staging-real-video-export-worker'
          ? ['directory_not_currently_ignored_by_gitignore_future_execution_must_remove_before_commit']
          : [],
    }
  })

  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationApproval.commandMatrix.v1',
    generatedAt,
    commands,
    allCommandsExact: commands.every((item) => item.scriptMatchesExpected === true),
    allOutputsExact: commands.every((item) => item.viteConfigDeclaresOutDir === true),
    allApprovedForFutureGenerationOnly: commands.every((item) => item.approval === true),
    currentPhaseBuildContextGenerationRun: false,
    currentPhaseBuildScriptsRun: false,
  }
}

function buildGeneratedArtifactPolicy(generatedAt: string) {
  const outputDirectories = buildContextTargets.map((target) => target.directory)
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationApproval.generatedArtifactPolicy.v1',
    generatedAt,
    outputDirectories,
    futurePhaseMayCreateGeneratedOutputsLocally: true,
    currentPhaseGeneratedOutputsCreated: false,
    generatedOutputsMayBeCommitted: false,
    generatedOutputsMustBeScannedBeforeCleanup: true,
    generatedOutputsMustNotContainSecrets: true,
    generatedOutputsMustNotContainDbUrls: true,
    generatedOutputsMustNotContainApiKeys: true,
    generatedOutputsMustNotContainServiceKeys: true,
    generatedOutputsMustNotContainSignedUrls: true,
    generatedOutputsMustNotContainPrivatePayloads: true,
    generatedOutputsMustNotContainMediaArtifacts: true,
    generatedOutputsMustNotContainPublicArtifacts: true,
    exactCleanupCommand: `rm -rf ${outputDirectories.join(' ')}`,
    cleanupTargetsOnly: outputDirectories,
    gitStatusGuard: 'git status --short must show no tracked or staged dist-* output before commit',
    gitignoreMutationAllowed: false,
    dockerfileMutationAllowed: false,
    packageLockMutationAllowed: false,
    cleanupPolicyDefined: true,
  }
}

function buildFutureExecutionScope(generatedAt: string, matrix: JsonRecord, policy: JsonRecord) {
  const commands = (matrix.commands as JsonRecord[]).map((item) => item.command)
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationApproval.futureScope.v1',
    generatedAt,
    selectedPath: 'build_context_generation_only',
    selectedDecision: expectedDecision,
    futurePhase: nextPrompt,
    exactFutureCommands: commands,
    exactFutureCleanupCommand: policy.exactCleanupCommand,
    buildContextGenerationIncludedInNextPhase: true,
    dockerBuildIncludedInNextPhase: false,
    dockerRunIncludedInNextPhase: false,
    ffmpegFfprobeProbesIncludedInNextPhase: false,
    noMediaInput: true,
    noMediaProbeDecodeEncode: true,
    noCaptionBurnIn: true,
    noRenderExport: true,
    noSupabaseSqlGcs: true,
    noPublicArtifactsSignedUrls: true,
    noBetaProductionUnlock: true,
    noDistOutputCommit: true,
    stopOnFirstFailure: true,
  }
}

function buildDecision(
  generatedAt: string,
  decisionValue: TrackaBuildContextGenerationApprovalDecision,
  readiness: boolean,
  blockers: string[],
  flags: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaBuildContextGenerationApproval.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    readyForGenerationExecution: readiness,
    readyForGenerationThenDockerProbeExecution: false,
    currentPhaseBuildContextGenerationRun: false,
    currentPhaseDockerBuildRun: false,
    currentPhaseDockerRun: false,
    currentPhaseFfmpegProbeRun: false,
    currentPhaseFfprobeProbeRun: false,
    currentPhaseMediaProcessingRun: false,
    currentPhaseRenderExportRun: false,
    generatedDistOutputsCommitted: false,
    dockerfileMutationAttempted: false,
    dockerignoreMutationAttempted: false,
    packageLockMutationAttempted: false,
    blockers,
    nextPrompt,
    nextPromptFile: nextPromptPath,
    blockedFlags: flags,
    supabaseClassification: supabaseClassification(),
  }
}

function buildBlockers(matrix: JsonRecord, policy: JsonRecord, futureScope: JsonRecord, flags: JsonRecord) {
  const blockers: string[] = []
  if (matrix.allCommandsExact !== true || matrix.allOutputsExact !== true) {
    blockers.push('blocked_pending_exact_build_context_generation_command')
  }
  if (policy.cleanupPolicyDefined !== true || policy.generatedOutputsMayBeCommitted !== false) {
    blockers.push('blocked_pending_generated_artifact_cleanup_policy')
  }
  if (futureScope.dockerBuildIncludedInNextPhase !== false || futureScope.ffmpegFfprobeProbesIncludedInNextPhase !== false) {
    blockers.push('blocked_pending_tracka_owner_build_context_review')
  }
  if (!Object.values(flags).every((value) => value === false)) blockers.push('rejected_due_runtime_safety_risk')
  return blockers
}

function chooseDecision(blockers: string[]): TrackaBuildContextGenerationApprovalDecision {
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.length) return blockers[0] as TrackaBuildContextGenerationApprovalDecision
  return expectedDecision
}

function blockedFlags() {
  return {
    buildContextGenerationRun: false,
    distOutputGenerationRun: false,
    dockerBuildRun: false,
    dockerRunRun: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    localHostProbingRun: false,
    dockerfileMutationRun: false,
    dockerignoreMutationRun: false,
    containerImageMutationRun: false,
    mediaInputUsed: false,
    mediaProbeRun: false,
    mediaProcessingAttempted: false,
    captionBurnInAttempted: false,
    renderExportAttempted: false,
    npmInstallRun: false,
    npmRebuildRun: false,
    lifecycleScriptsRun: false,
    packageLockMutationAttempted: false,
    duckdbProofRerun: false,
    polarsProofRerun: false,
    workerExecutionAttempted: false,
    routeExecutionAttempted: false,
    providerCallsAttempted: false,
    browserCaptureAttempted: false,
    mapRenderingAttempted: false,
    supabaseWritesAttempted: false,
    sqlExecuted: false,
    gcsUploadAttempted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptsExecuted: false,
    betaProductionUnlocked: false,
    prMergesAttempted: false,
    secretsPrinted: false,
  }
}

function readSourceEvidence() {
  return Object.fromEntries(
    Object.entries(sourceEvidencePaths).map(([key, path]) => [
      key,
      {
        path,
        exists: existsSync(path),
        sha256: existsSync(path) ? hashFile(path) : null,
        json: path.endsWith('.json') && path.startsWith('docs/') ? readJson(path) : undefined,
      },
    ]),
  )
}

function commandMatrixMarkdown(report: JsonRecord) {
  const rows = (report.commands as JsonRecord[]).map((item) => {
    return `| \`${item.command}\` | \`${item.directory}\` | ${item.safeForFutureExecution} | ${item.currentPhaseCommandRun} | ${item.mayProcessMedia} | ${item.mayRenderExport} | ${item.generatedOutputMayBeCommitted} | \`${item.cleanupCommand}\` |`
  })
  return `# Build Command Approval Matrix

| Command | Expected output | Future-safe | Ran now | May process media | May render/export | May commit output | Cleanup |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

All commands exact: \`${report.allCommandsExact}\`
All outputs exact: \`${report.allOutputsExact}\`
`
}

function generatedArtifactPolicyMarkdown(report: JsonRecord) {
  return `# Generated Artifact Policy

- Future phase may create outputs locally: \`${report.futurePhaseMayCreateGeneratedOutputsLocally}\`
- Current phase generated outputs: \`${report.currentPhaseGeneratedOutputsCreated}\`
- Generated outputs may be committed: \`${report.generatedOutputsMayBeCommitted}\`
- Exact cleanup command: \`${report.exactCleanupCommand}\`
- Git status guard: ${report.gitStatusGuard}
- \`.gitignore\` mutation allowed: \`${report.gitignoreMutationAllowed}\`
- Dockerfile mutation allowed: \`${report.dockerfileMutationAllowed}\`
- Package-lock mutation allowed: \`${report.packageLockMutationAllowed}\`
`
}

function futureExecutionScopeMarkdown(report: JsonRecord) {
  return `# Future Execution Scope

Selected path: \`${report.selectedPath}\`

The next phase may execute build-context generation only. Docker build/run and FFmpeg/FFprobe version probes remain separate future phases.

- Build-context generation included: \`${report.buildContextGenerationIncludedInNextPhase}\`
- Docker build included: \`${report.dockerBuildIncludedInNextPhase}\`
- FFmpeg/FFprobe probes included: \`${report.ffmpegFfprobeProbesIncludedInNextPhase}\`
- No media input/probe/decode/encode: \`${report.noMediaProbeDecodeEncode}\`
- No render/export: \`${report.noRenderExport}\`
- No dist output commit: \`${report.noDistOutputCommit}\`
- Stop on first failure: \`${report.stopOnFirstFailure}\`
`
}

function decisionMarkdown(report: JsonRecord) {
  return `# Build Context Generation Approval Decision

Decision: \`${report.decision}\`

This approval is for a future build-context generation execution packet only. Docker build, Docker run, FFmpeg/FFprobe version probes, media processing, render/export, Supabase/GCS, public artifacts, signed URLs, beta, and production remain blocked.

Next prompt: \`${report.nextPrompt}\`
`
}

function validationResultsMarkdown(reports: TrackaBuildContextGenerationApprovalReportSet) {
  return `# Build Context Generation Approval Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: \`${reports.readinessReport.readiness}\`
- Build-context generation run: \`${reports.decision.currentPhaseBuildContextGenerationRun}\`
- Docker build run: \`${reports.decision.currentPhaseDockerBuildRun}\`
- FFmpeg probe run: \`${reports.decision.currentPhaseFfmpegProbeRun}\`
- FFprobe probe run: \`${reports.decision.currentPhaseFfprobeProbeRun}\`
- Generated outputs committed: \`${reports.decision.generatedDistOutputsCommitted}\`
- Package-lock mutation: \`${reports.decision.packageLockMutationAttempted}\`
- Dockerfile mutation: \`${reports.decision.dockerfileMutationAttempted}\`
- Supabase classification: \`${JSON.stringify(reports.decision.supabaseClassification)}\`
`
}

function nextPromptMarkdown(reports: TrackaBuildContextGenerationApprovalReportSet) {
  const commands = (reports.buildCommandApprovalMatrix.commands as JsonRecord[])
    .map((item) => `- \`${item.command}\` -> \`${item.directory}\``)
    .join('\n')
  return `# OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION

Execute only the approved build-context generation lane.

Approved commands:
${commands}

Required safety boundaries:
- Do not run Docker build/run or FFmpeg/FFprobe probes in the generation execution packet.
- Do not process media, caption burn-in, render/export, mutate Supabase/GCS, create public artifacts/signed URLs, run raw prompts, or unlock beta/production.
- Generated \`dist-*\` outputs must be scanned, kept local-only, removed with \`${reports.generatedArtifactPolicy.exactCleanupCommand}\`, and never committed.
`
}

function updateStatusDocs(reports: TrackaBuildContextGenerationApprovalReportSet) {
  const block = `\n\n<!-- tracka-build-context-generation-approval:start -->\n## Track A Build Context Generation Approval\n\n- Decision: \`${reports.decision.decision}\`\n- Approved next lane: build-context generation execution only.\n- Future commands: ${(reports.buildCommandApprovalMatrix.commands as JsonRecord[]).map((item) => `\`${item.command}\` -> \`${item.directory}\``).join(', ')}.\n- Generated outputs must be scanned, must remain uncommitted, and must be removed with \`${reports.generatedArtifactPolicy.exactCleanupCommand}\` before commit.\n- Docker build/run and FFmpeg/FFprobe probes remain blocked until later separately approved phases.\n- Supabase classification: no write / environment none / SQL none / migration no.\n- Absent broad production docs recorded as audit facts: ${absentBroadProductionDocs.map((path) => `\`${path}\``).join(', ')}.\n- Next prompt: \`${nextPrompt}\`.\n<!-- tracka-build-context-generation-approval:end -->\n`
  for (const path of statusDocPaths) {
    if (!existsSync(path)) continue
    const current = readFileSync(path, 'utf8')
    const next = replaceMarkedBlock(current, block, 'tracka-build-context-generation-approval')
    writeFileSync(path, next)
  }
}

function replaceMarkedBlock(current: string, block: string, marker: string) {
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const startIndex = current.indexOf(start)
  const endIndex = current.indexOf(end)
  if (startIndex >= 0 && endIndex > startIndex) {
    const suffix = current.slice(endIndex + end.length).replace(/^\n+/, '')
    return `${current.slice(0, startIndex).trimEnd()}${block}${suffix}`
  }
  return `${current.trimEnd()}${block}`
}

function writeJson(path: string, value: unknown) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(path: string, value: string) {
  const directory = path.split('/').slice(0, -1).join('/')
  if (directory) mkdirSync(directory, { recursive: true })
  writeFileSync(path, value)
}

function readJson(path: string) {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as JsonRecord
}

function hashFile(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function currentGitSha() {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function gitStatus(path: string) {
  return execFileSync('git', ['status', '--short', '--', path], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function ghPrView(number: number) {
  try {
    const output = execFileSync(
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
    )
    return JSON.parse(output) as JsonRecord
  } catch (error) {
    return { number, unavailable: true, error: String(error) }
  }
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
