import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  TrackaContainerDockerBuildBlockerResolutionDecision,
  TrackaContainerDockerBuildBlockerResolutionReportSet,
} from './tracka-container-docker-build-blocker-resolution-types'

type JsonRecord = Record<string, unknown>

export const TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR =
  'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-build-context-blocker-resolution'
export const TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_BRANCH =
  'codex/rp-open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-build-context-blocker-resolution'
export const TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_SOURCE_SHA =
  'dd49ff920cdebc1795034c09950a57b4ca09ad31'

const phase = 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_BUILD_CONTEXT_BLOCKER_RESOLUTION'
const expectedDecision: TrackaContainerDockerBuildBlockerResolutionDecision =
  'docker_build_blocker_resolution_passed_ready_for_build_context_generation_approval'
const nextPrompt = 'OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL'
const nextPromptPath = 'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-build-context-generation-approval.md'

const sourceEvidencePaths = {
  pr494Decision:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/tracka-container-ffmpeg-ffprobe-version-probe-decision.json',
  pr494Readiness:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/docker-container-readiness-report.json',
  pr490Decision:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-probe-command-blocker-resolution-decision.json',
  pr490Commands:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-future-probe-commands.json',
  pr481Decision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  pr477Decision:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  pr472Decision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review/ffmpeg-ffprobe-system-binary-review-decision.json',
  dockerfile: 'docker/prod/render-worker/Dockerfile',
  dockerignore: '.dockerignore',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
  gitignore: '.gitignore',
}

const reportPaths = {
  sourceAudit: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/source-of-truth-audit.json`,
  dockerfileReview: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/dockerfile-build-context-review.json`,
  dockerfileReviewMd: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/dockerfile-build-context-review.md`,
  buildScriptInventory: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/build-script-inventory.json`,
  buildScriptInventoryMd: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/build-script-inventory.md`,
  buildContextPolicy: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/build-context-generation-policy.json`,
  buildContextPolicyMd: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/build-context-generation-policy.md`,
  dockerStrategy: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/docker-build-strategy-review.json`,
  dockerStrategyMd: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/docker-build-strategy-review.md`,
  futureScope: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/future-execution-scope.json`,
  futureScopeMd: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/future-execution-scope.md`,
  decision: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/docker-build-blocker-resolution-decision.json`,
  decisionMd: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/docker-build-blocker-resolution-decision.md`,
  readiness: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/docker-build-blocker-resolution-readiness-report.json`,
  blockers: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/docker-build-blocker-resolution-blocker-report.json`,
  privateManifest: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/docker-build-blocker-resolution-private-artifact-manifest.json`,
  validationResults: `${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/docker-build-blocker-resolution-validation-results.md`,
}

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const predecessorPrs = [494, 490, 486, 481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427, 421, 416]
const referenceOnlyPrs = [384, 401, 417, 420, 423, 425, 428, 432]

const buildContextTargets = [
  {
    directory: 'dist-server',
    packageScript: 'build:server',
    command: 'npm run build:server',
    config: 'vite.server.config.ts',
    expectedEntry: 'server.js',
  },
  {
    directory: 'dist-remotion-worker',
    packageScript: 'build:remotion-worker:mock',
    command: 'npm run build:remotion-worker:mock',
    config: 'vite.remotion-worker.config.ts',
    expectedEntry: 'remotion-worker-cli.js',
  },
  {
    directory: 'dist-staging-fixture-worker',
    packageScript: 'build:staging-fixture-worker',
    command: 'npm run build:staging-fixture-worker',
    config: 'vite.staging-fixture-worker.config.ts',
    expectedEntry: 'staging-fixture-worker-cli.js',
  },
  {
    directory: 'dist-staging-real-video-export-worker',
    packageScript: 'build:staging-real-video-export-worker',
    command: 'npm run build:staging-real-video-export-worker',
    config: 'vite.staging-real-video-export-worker.config.ts',
    expectedEntry: 'staging-real-video-export-worker-cli.js',
  },
]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION',
    'REEDITPRO_CONFIRM_TRACKA_CONTAINER_DOCKER_BUILD_BLOCKED_EXECUTION_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_DOCKER_BUILD_CONTEXT_BLOCKER_REVIEW',
    'REEDITPRO_CONFIRM_DOCKERFILE_SOURCE_REVIEW',
    'REEDITPRO_CONFIRM_PACKAGE_SCRIPT_REVIEW',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_POLICY_REVIEW',
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
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
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

export function buildTrackaContainerDockerBuildBlockerResolutionPlan() {
  return {
    phase,
    branch: TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_BRANCH,
    baseBranch: TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_BASE_BRANCH,
    expectedSourceSha: TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_SOURCE_SHA,
    mode: 'metadata_only_build_context_blocker_resolution_no_docker_no_probes',
    decision: expectedDecision,
    nextPrompt,
    buildContextTargets,
    reports: Object.values(reportPaths),
    docs: [...statusDocPaths, nextPromptPath],
    explicitlyNotRun: [
      'Docker build or run',
      'FFmpeg or FFprobe version probes',
      'build-context generation scripts',
      'media input, probe, decode, encode, caption burn-in, render, or export',
      'npm install, npm rebuild, broad lifecycle scripts, DuckDB or Polars proof rerun',
      'workers, routes, providers, browser capture, maps, Supabase, SQL, GCS, public artifacts, signed URLs, raw prompts, beta, or production',
    ],
  }
}

export function buildTrackaContainerDockerBuildBlockerResolutionReports(): TrackaContainerDockerBuildBlockerResolutionReportSet {
  const generatedAt = new Date().toISOString()
  const flags = blockedFlags()
  const sourceEvidence = readSourceEvidence()
  const packageState = capturePackageState()
  const dockerfileBuildContextReview = buildDockerfileBuildContextReview(generatedAt)
  const buildScriptInventory = buildBuildScriptInventory(generatedAt)
  const buildContextGenerationPolicy = buildBuildContextGenerationPolicy(generatedAt, buildScriptInventory)
  const dockerBuildStrategyReview = buildDockerBuildStrategyReview(generatedAt)
  const futureExecutionScope = buildFutureExecutionScope(generatedAt)
  const blockers = buildBlockers(dockerfileBuildContextReview, buildScriptInventory, buildContextGenerationPolicy, flags)
  const decisionValue = chooseDecision(blockers)
  const readiness = decisionValue === expectedDecision
  const decision = buildDecision(generatedAt, decisionValue, readiness, blockers, flags)

  return {
    sourceOfTruthAudit: buildSourceOfTruthAudit(generatedAt, sourceEvidence, packageState, flags),
    dockerfileBuildContextReview,
    buildScriptInventory,
    buildContextGenerationPolicy,
    dockerBuildStrategyReview,
    futureExecutionScope,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.readiness.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      readyForBuildContextGenerationApproval: readiness,
      readyForBuildContextGenerationExecution: false,
      readyForDockerBuildOrProbeExecution: false,
      blockers,
      nextPrompt,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.blockers.v1',
      generatedAt,
      priorBlocker: 'blocked_pending_docker_build',
      resolvedForApprovalOnly: readiness,
      blockers,
      remainingBlockedScope:
        'Build-context generation, Docker build, Docker run, and FFmpeg/FFprobe version probes remain future separate phases.',
      blockedScopesPreserved: Object.values(flags).every((value) => value === false),
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.privateArtifactManifest.v1',
      generatedAt,
      reportDirectory: TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR,
      generatedDistOutputsCreated: false,
      dockerImagesBuilt: false,
      dockerImagesPushed: false,
      mediaArtifactsCreated: false,
      privatePayloadsAccessed: false,
      privatePayloadsPrinted: false,
      privatePayloadsCommitted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
    },
  }
}

export function writeTrackaContainerDockerBuildBlockerResolutionArtifacts() {
  const reports = buildTrackaContainerDockerBuildBlockerResolutionReports()
  mkdirSync(TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.dockerfileReview, reports.dockerfileBuildContextReview)
  writeText(reportPaths.dockerfileReviewMd, dockerfileBuildContextReviewMarkdown(reports.dockerfileBuildContextReview))
  writeJson(reportPaths.buildScriptInventory, reports.buildScriptInventory)
  writeText(reportPaths.buildScriptInventoryMd, buildScriptInventoryMarkdown(reports.buildScriptInventory))
  writeJson(reportPaths.buildContextPolicy, reports.buildContextGenerationPolicy)
  writeText(reportPaths.buildContextPolicyMd, buildContextGenerationPolicyMarkdown(reports.buildContextGenerationPolicy))
  writeJson(reportPaths.dockerStrategy, reports.dockerBuildStrategyReview)
  writeText(reportPaths.dockerStrategyMd, dockerBuildStrategyReviewMarkdown(reports.dockerBuildStrategyReview))
  writeJson(reportPaths.futureScope, reports.futureExecutionScope)
  writeText(reportPaths.futureScopeMd, futureExecutionScopeMarkdown(reports.futureExecutionScope))
  writeJson(reportPaths.decision, reports.decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(reports.decision))
  writeJson(reportPaths.readiness, reports.readinessReport)
  writeJson(reportPaths.blockers, reports.blockerReport)
  writeJson(reportPaths.privateManifest, reports.privateArtifactManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(reports))
  writeText(nextPromptPath, nextPromptMarkdown(reports))
  updateStatusDocs(reports)
  return reports
}

export function readTrackaContainerDockerBuildBlockerResolutionArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    dockerfileBuildContextReview: readJson(reportPaths.dockerfileReview) ?? {},
    buildScriptInventory: readJson(reportPaths.buildScriptInventory) ?? {},
    buildContextGenerationPolicy: readJson(reportPaths.buildContextPolicy) ?? {},
    dockerBuildStrategyReview: readJson(reportPaths.dockerStrategy) ?? {},
    futureExecutionScope: readJson(reportPaths.futureScope) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    blockerReport: readJson(reportPaths.blockers) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateManifest) ?? {},
  }
}

export function summarizeTrackaContainerDockerBuildBlockerResolution(
  reports = readTrackaContainerDockerBuildBlockerResolutionArtifacts() ??
    buildTrackaContainerDockerBuildBlockerResolutionReports(),
) {
  return JSON.stringify(
    {
      phase,
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      nextPrompt: reports.decision.nextPrompt,
      futureBuildContextCommands: reports.buildContextGenerationPolicy.futureBuildContextCommands,
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

function buildSourceOfTruthAudit(generatedAt: string, sourceEvidence: JsonRecord, packageState: JsonRecord, flags: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.sourceAudit.v1',
    generatedAt,
    phase,
    branch: TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_BRANCH,
    baseBranch: TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_BASE_BRANCH,
    centralSourceSha: currentGitSha(),
    expectedMinimumSourceSha: TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_SOURCE_SHA,
    sourceEvidence,
    prMetadata: [...predecessorPrs, ...referenceOnlyPrs].map((number) => ghPrView(number)),
    packageState,
    dockerfileHash: hashFile('docker/prod/render-worker/Dockerfile'),
    dockerignoreHash: hashFile('.dockerignore'),
    noScopeConfirmation: flags,
    supabaseClassification: supabaseClassification(),
  }
}

function buildDockerfileBuildContextReview(generatedAt: string) {
  const dockerfile = readFileSync('docker/prod/render-worker/Dockerfile', 'utf8')
  const dockerignore = readFileSync('.dockerignore', 'utf8')
  const gitignore = existsSync('.gitignore') ? readFileSync('.gitignore', 'utf8') : ''
  const copyRequirements = buildContextTargets.map((target) => {
    const copyLine = dockerfile.split('\n').find((line) => line.includes(`COPY ${target.directory} `)) ?? null
    return {
      directory: target.directory,
      dockerfileCopyLine: copyLine,
      dockerfileRequiresDirectory: copyLine !== null,
      existsInCurrentCheckout: existsSync(target.directory),
      dockerignoreBlocksDirectory: ignoreTextBlocks(dockerignore, target.directory),
      gitignoreBlocksDirectory: ignoreTextBlocks(gitignore, target.directory),
      generatedByPackageScript: target.packageScript,
      generatedOutputMayBeCommitted: false,
    }
  })
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.dockerfileBuildContextReview.v1',
    generatedAt,
    dockerfilePath: 'docker/prod/render-worker/Dockerfile',
    dockerignorePath: '.dockerignore',
    dockerfileUnchanged: gitStatus('docker/prod/render-worker/Dockerfile') === '',
    dockerignoreUnchanged: gitStatus('.dockerignore') === '',
    copyRequirements,
    allRequiredDirectoriesAbsent: copyRequirements.every((item) => item.existsInCurrentCheckout === false),
    dockerignoreAllowsBuildOutputs: copyRequirements.every((item) => item.dockerignoreBlocksDirectory === false),
    dockerfileTooBroadForVersionProbeOnly: true,
    slimProbeDockerfileWouldBeSafer: true,
    slimmingRequiresSeparatePolicyReview: true,
    mutationOccurred: false,
  }
}

function buildBuildScriptInventory(generatedAt: string) {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
  const scripts = packageJson.scripts ?? {}
  const targetScripts = buildContextTargets.map((target) => {
    const configText = existsSync(target.config) ? readFileSync(target.config, 'utf8') : ''
    return {
      ...target,
      packageScriptValue: scripts[target.packageScript] ?? null,
      packageScriptExists: Boolean(scripts[target.packageScript]),
      viteConfigExists: existsSync(target.config),
      viteConfigDeclaresOutDir: configText.includes(`outDir: '${target.directory}'`),
      viteConfigDeclaresEntry: configText.includes(target.expectedEntry),
      executionAllowedInThisPhase: false,
      safeCandidateForFutureApproval: Boolean(scripts[target.packageScript]) && configText.includes(`outDir: '${target.directory}'`),
      mayWriteGeneratedBuildOutput: true,
      mayCommitGeneratedBuildOutput: false,
      mediaProcessingExpected: false,
      renderExportExpected: false,
    }
  })
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.buildScriptInventory.v1',
    generatedAt,
    scriptsInspected: targetScripts.map((item) => item.packageScript),
    targetScripts,
    exactBuildContextGenerationCommandsDerived: targetScripts.every((item) => item.safeCandidateForFutureApproval),
    currentPhaseBuildScriptsRun: false,
  }
}

function buildBuildContextGenerationPolicy(generatedAt: string, inventory: JsonRecord) {
  const targetScripts = inventory.targetScripts as JsonRecord[]
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.buildContextGenerationPolicy.v1',
    generatedAt,
    futureBuildContextGenerationApprovedNow: false,
    readyForFutureBuildContextGenerationApproval: true,
    futureBuildContextCommands: targetScripts.map((item) => item.command),
    futureBuildContextCommandSequence: targetScripts.map((item) => item.command).join(' && '),
    generatedOutputsMayBeCreatedLocallyInFutureApprovedPhase: true,
    generatedOutputsMayBeCommitted: false,
    cleanupPolicy:
      'Future execution must remove dist-server, dist-remotion-worker, dist-staging-fixture-worker, and dist-staging-real-video-export-worker before commit; git status must be clean for those paths.',
    gitignorePolicy:
      'Do not change .gitignore in this phase. dist-staging-real-video-export-worker is not currently ignored, so future execution must explicitly remove or guard it.',
    npmScriptsAllowedInFutureApproval: true,
    mediaRenderExportBlocked: true,
    workerExecutionBlocked: true,
    dockerBuildStillSeparate: true,
    ffmpegFfprobeProbesStillSeparate: true,
    ownerHandoffRequiredBeforeApproval: false,
  }
}

function buildDockerBuildStrategyReview(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.dockerBuildStrategyReview.v1',
    generatedAt,
    strategies: [
      {
        id: 'generate_existing_build_context_then_rerun_approved_docker_build',
        risk: 'medium',
        owner: 'OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF with Track A awareness',
        exactCommandAvailability: 'available_for_future_approval',
        artifactPolicy: 'generated dist outputs are local-only and uncommitted',
        allowedNext: true,
        reason: 'Committed package scripts and Vite configs map exactly to every Dockerfile COPY directory.',
      },
      {
        id: 'slim_version_probe_only_dockerfile',
        risk: 'medium',
        owner: 'TRACK_A_RENDER_EXPORT plus Docker/container owner',
        exactCommandAvailability: 'not_currently_approved',
        artifactPolicy: 'would require Dockerfile policy review and source mutation approval',
        allowedNext: false,
        reason: 'Safer for version-only probing, but this phase must not mutate Dockerfiles.',
      },
      {
        id: 'tracka_worker_image_handoff',
        risk: 'low',
        owner: 'TRACK_A_RENDER_EXPORT and WORKER_RUNTIME_JOBS',
        exactCommandAvailability: 'not_required_before_next_approval',
        artifactPolicy: 'future image source-of-truth can supersede local build if approved',
        allowedNext: false,
        reason: 'Useful later if build-context generation policy changes, but exact commands are already derivable.',
      },
      {
        id: 'block_pending_source_policy',
        risk: 'low',
        owner: 'OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF',
        exactCommandAvailability: 'not_needed',
        artifactPolicy: 'no generated output',
        allowedNext: false,
        reason: 'Not selected because exact build-context commands are now available.',
      },
    ],
    selectedStrategy: 'generate_existing_build_context_then_rerun_approved_docker_build',
    selectedDecision: expectedDecision,
  }
}

function buildFutureExecutionScope(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.futureExecutionScope.v1',
    generatedAt,
    nextPhase: nextPrompt,
    exactNextPhaseCommands: buildContextTargets.map((target) => target.command),
    buildContextGenerationIncludedInNextPhaseApproval: true,
    dockerBuildIncludedInNextPhaseApproval: false,
    ffmpegFfprobeProbesIncludedInNextPhaseApproval: false,
    noMediaInput: true,
    noMediaOutput: true,
    noMediaProcessing: true,
    noRenderExport: true,
    noCaptionBurnIn: true,
    noDockerImagePush: true,
    noDockerfileMutation: true,
    noPackageLockMutation: true,
    noSupabaseGcsPublicArtifacts: true,
    stopOnFirstFailure: true,
  }
}

function buildDecision(
  generatedAt: string,
  decisionValue: TrackaContainerDockerBuildBlockerResolutionDecision,
  readiness: boolean,
  blockers: string[],
  flags: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerDockerBuildBlockerResolution.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    priorDecision: 'blocked_pending_docker_build',
    readyForBuildContextGenerationApproval: readiness,
    readyForBuildContextGenerationAndProbeExecution: false,
    currentPhaseBuildContextGenerationRun: false,
    currentPhaseDockerBuildRun: false,
    currentPhaseDockerRun: false,
    currentPhaseFfmpegProbeRun: false,
    currentPhaseFfprobeProbeRun: false,
    currentPhaseMediaProcessingRun: false,
    dockerfileMutationAttempted: false,
    packageLockMutationAttempted: false,
    generatedDistOutputsCommitted: false,
    blockers,
    nextPrompt,
    nextPromptFile: nextPromptPath,
    blockedFlags: flags,
    supabaseClassification: supabaseClassification(),
  }
}

function buildBlockers(dockerfileReview: JsonRecord, inventory: JsonRecord, policy: JsonRecord, flags: JsonRecord) {
  const blockers: string[] = []
  if (dockerfileReview.mutationOccurred !== false) blockers.push('blocked_pending_dockerfile_copy_policy_review')
  if (inventory.exactBuildContextGenerationCommandsDerived !== true) blockers.push('blocked_pending_exact_build_context_generation_command')
  if (policy.generatedOutputsMayBeCommitted !== false) blockers.push('blocked_pending_generated_artifact_policy')
  if (!Object.values(flags).every((value) => value === false)) blockers.push('rejected_due_runtime_safety_risk')
  return blockers
}

function chooseDecision(blockers: string[]): TrackaContainerDockerBuildBlockerResolutionDecision {
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.length) return blockers[0] as TrackaContainerDockerBuildBlockerResolutionDecision
  return expectedDecision
}

function blockedFlags() {
  return {
    buildContextGenerationRun: false,
    dockerBuildRun: false,
    dockerRunRun: false,
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    localHostProbingRun: false,
    dockerfileMutationRun: false,
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

function capturePackageState() {
  return {
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dockerfileHash: hashFile('docker/prod/render-worker/Dockerfile'),
    dockerignoreHash: hashFile('.dockerignore'),
    packageJsonDependencySections: readPackageDependencySections(),
    packageLockChangedInThisPhase: gitStatus('package-lock.json') !== '',
    packageJsonChangedInThisPhase: gitStatus('package.json') !== '',
    dockerfileChangedInThisPhase: gitStatus('docker/prod/render-worker/Dockerfile') !== '',
    dockerignoreChangedInThisPhase: gitStatus('.dockerignore') !== '',
  }
}

function readPackageDependencySections() {
  const parsed = JSON.parse(readFileSync('package.json', 'utf8'))
  return {
    dependencies: parsed.dependencies ?? {},
    devDependencies: parsed.devDependencies ?? {},
    optionalDependencies: parsed.optionalDependencies ?? {},
    peerDependencies: parsed.peerDependencies ?? {},
  }
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
    return JSON.parse(output)
  } catch (error) {
    return { number, unavailable: true, error: String(error) }
  }
}

function dockerfileBuildContextReviewMarkdown(report: JsonRecord) {
  const rows = (report.copyRequirements as JsonRecord[]).map((item) => {
    return `| \`${item.directory}\` | \`${item.dockerfileCopyLine}\` | ${item.existsInCurrentCheckout} | ${item.dockerignoreBlocksDirectory} | ${item.gitignoreBlocksDirectory} | \`${item.generatedByPackageScript}\` |`
  })
  return `# Dockerfile Build Context Review

| Directory | Dockerfile COPY | Exists now | Blocked by .dockerignore | Ignored by .gitignore | Generator |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

- Dockerfile too broad for version-probe-only purpose: \`${report.dockerfileTooBroadForVersionProbeOnly}\`
- Slim probe Dockerfile would be safer: \`${report.slimProbeDockerfileWouldBeSafer}\`
- Mutation occurred: \`${report.mutationOccurred}\`
`
}

function buildScriptInventoryMarkdown(report: JsonRecord) {
  const rows = (report.targetScripts as JsonRecord[]).map((item) => {
    return `| \`${item.directory}\` | \`${item.command}\` | ${item.packageScriptExists} | ${item.viteConfigDeclaresOutDir} | ${item.safeCandidateForFutureApproval} | ${item.mayCommitGeneratedBuildOutput} |`
  })
  return `# Build Script Inventory

| Directory | Command | Script exists | Config declares outDir | Future candidate | May commit output |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

Current phase build scripts run: \`${report.currentPhaseBuildScriptsRun}\`.
`
}

function buildContextGenerationPolicyMarkdown(report: JsonRecord) {
  return `# Build Context Generation Policy

- Future generation approved now: \`${report.futureBuildContextGenerationApprovedNow}\`
- Ready for future approval: \`${report.readyForFutureBuildContextGenerationApproval}\`
- Future commands: ${(report.futureBuildContextCommands as string[]).map((command) => `\`${command}\``).join(', ')}
- Generated outputs may be committed: \`${report.generatedOutputsMayBeCommitted}\`
- Cleanup policy: ${report.cleanupPolicy}
- Gitignore policy: ${report.gitignorePolicy}
- Docker build still separate: \`${report.dockerBuildStillSeparate}\`
- FFmpeg/FFprobe probes still separate: \`${report.ffmpegFfprobeProbesStillSeparate}\`
`
}

function dockerBuildStrategyReviewMarkdown(report: JsonRecord) {
  const rows = (report.strategies as JsonRecord[]).map((item) => {
    return `| \`${item.id}\` | ${item.risk} | ${item.owner} | ${item.exactCommandAvailability} | ${item.allowedNext} | ${item.reason} |`
  })
  return `# Docker Build Strategy Review

| Strategy | Risk | Owner | Exact command availability | Allowed next | Reason |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

Selected strategy: \`${report.selectedStrategy}\`.
`
}

function futureExecutionScopeMarkdown(report: JsonRecord) {
  return `# Future Execution Scope

The next phase is \`${report.nextPhase}\`. It may approve build-context generation commands only. Docker build, Docker run, and FFmpeg/FFprobe probes remain excluded from that next approval packet unless a later prompt explicitly expands scope.

- Build-context generation included in next approval: \`${report.buildContextGenerationIncludedInNextPhaseApproval}\`
- Docker build included in next approval: \`${report.dockerBuildIncludedInNextPhaseApproval}\`
- FFmpeg/FFprobe probes included in next approval: \`${report.ffmpegFfprobeProbesIncludedInNextPhaseApproval}\`
- No media input/output: \`${report.noMediaInput}\` / \`${report.noMediaOutput}\`
- No Docker image push: \`${report.noDockerImagePush}\`
- Stop on first failure: \`${report.stopOnFirstFailure}\`
`
}

function decisionMarkdown(report: JsonRecord) {
  return `# Docker Build Blocker Resolution Decision

Decision: \`${report.decision}\`

The PR #494 blocker is resolved only to the next approval step. Build-context generation, Docker build, Docker run, FFmpeg/FFprobe probes, media processing, render/export, Supabase/GCS, public artifacts, signed URLs, beta, and production remain blocked.

Next prompt: \`${report.nextPrompt}\`
`
}

function validationResultsMarkdown(reports: TrackaContainerDockerBuildBlockerResolutionReportSet) {
  return `# Docker Build Blocker Resolution Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: \`${reports.readinessReport.readiness}\`
- Build-context generation run: \`${reports.decision.currentPhaseBuildContextGenerationRun}\`
- Docker build run: \`${reports.decision.currentPhaseDockerBuildRun}\`
- FFmpeg probe run: \`${reports.decision.currentPhaseFfmpegProbeRun}\`
- FFprobe probe run: \`${reports.decision.currentPhaseFfprobeProbeRun}\`
- Package-lock mutation: \`${reports.decision.packageLockMutationAttempted}\`
- Dockerfile mutation: \`${reports.decision.dockerfileMutationAttempted}\`
- Supabase classification: \`${JSON.stringify(reports.decision.supabaseClassification)}\`
`
}

function nextPromptMarkdown(reports: TrackaContainerDockerBuildBlockerResolutionReportSet) {
  return `# OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL

Use this prompt after the Docker build-context blocker-resolution PR lands.

Approve a future execution packet for these build-context generation commands only:

${(reports.buildContextGenerationPolicy.futureBuildContextCommands as string[]).map((command) => `- \`${command}\``).join('\n')}

Do not approve Docker build, Docker run, FFmpeg/FFprobe probes, local host probing, media processing, caption burn-in, render/export, package-lock mutation, Dockerfile mutation, public artifacts, signed URLs, Supabase/GCS mutation, beta, or production in this approval packet.

Generated \`dist-*\` outputs must remain uncommitted and must be cleaned before commit.
`
}

function updateStatusDocs(reports: TrackaContainerDockerBuildBlockerResolutionReportSet) {
  const block = `\n\n<!-- tracka-docker-build-context-blocker-resolution:start -->\n## Track A Docker Build Context Blocker Resolution\n\n- Decision: \`${reports.decision.decision}\`\n- PR #494 blocker: missing Docker build-context directories for render-worker image COPY steps.\n- Derived future build-context commands: ${(reports.buildContextGenerationPolicy.futureBuildContextCommands as string[]).map((command) => `\`${command}\``).join(', ')}.\n- Docker build/run and FFmpeg/FFprobe probes remain blocked until later separately approved phases.\n- Generated \`dist-*\` outputs must remain uncommitted; \`dist-staging-real-video-export-worker\` is not ignored by current \`.gitignore\`, so future execution must remove or guard it explicitly.\n- Supabase classification: no write / environment none / SQL none / migration no.\n- Next prompt: \`${nextPrompt}\`.\n<!-- tracka-docker-build-context-blocker-resolution:end -->\n`
  for (const path of statusDocPaths) {
    if (!existsSync(path)) continue
    const current = readFileSync(path, 'utf8')
    const next = replaceMarkedBlock(current, block, 'tracka-docker-build-context-blocker-resolution')
    writeFileSync(path, next)
  }
}

function replaceMarkedBlock(current: string, block: string, marker: string) {
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const startIndex = current.indexOf(start)
  const endIndex = current.indexOf(end)
  if (startIndex >= 0 && endIndex > startIndex) {
    return `${current.slice(0, startIndex).trimEnd()}${block}${current.slice(endIndex + end.length).replace(/^\n+/, '')}`
  }
  return `${current.trimEnd()}${block}`
}

function ignoreTextBlocks(text: string, directory: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .some((line) => line === directory || line === `${directory}/`)
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

function hashFile(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function readJson(path: string) {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as JsonRecord
}

function writeJson(path: string, value: unknown) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(path: string, value: string) {
  writeFileSync(path, value)
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  }
}
