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
import { dirname, extname, join, relative } from 'node:path'
import type {
  BuildContextGenerationReport,
  BuildContextTarget,
  CommandRunReport,
  TrackaDockerBuildProbeRerunDecision,
  TrackaDockerBuildProbeRerunReportSet,
} from './docker-build-probe-rerun-types'

type JsonRecord = Record<string, unknown>

export const TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR =
  'docs/open-source-tool-stack/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun'
export const TRACKA_DOCKER_BUILD_PROBE_RERUN_BRANCH =
  'codex/rp-open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun'
export const TRACKA_DOCKER_BUILD_PROBE_RERUN_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const TRACKA_DOCKER_BUILD_PROBE_RERUN_SOURCE_SHA =
  '9225347e636a50aa0ef241badbf51f9a3947b1f8'

const phase =
  'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_RERUN'
const passDecision: TrackaDockerBuildProbeRerunDecision =
  'tracka_container_docker_build_ffmpeg_ffprobe_version_probe_rerun_passed_media_processing_still_blocked'
const passNextPrompt =
  'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW'
const blockedNextPrompt =
  'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_RERUN_BLOCKER_RESOLUTION'
const passNextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-qa-review.md'
const blockedNextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-blocker-resolution.md'
const imageTag =
  `reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-${TRACKA_DOCKER_BUILD_PROBE_RERUN_SOURCE_SHA}`
const dockerfilePath = 'docker/prod/render-worker/Dockerfile'
const cleanupCommand =
  'rm -rf dist-server dist-remotion-worker dist-staging-fixture-worker dist-staging-real-video-export-worker'
const dockerBuildArgs = ['build', '-f', dockerfilePath, '-t', imageTag, '.']
const dockerFfmpegArgs = ['run', '--rm', '--network', 'none', '--entrypoint', 'ffmpeg', imageTag, '-version']
const dockerFfprobeArgs = ['run', '--rm', '--network', 'none', '--entrypoint', 'ffprobe', imageTag, '-version']
const dockerBuildCommand = `docker ${dockerBuildArgs.join(' ')}`
const dockerFfmpegCommand = `docker ${dockerFfmpegArgs.join(' ')}`
const dockerFfprobeCommand = `docker ${dockerFfprobeArgs.join(' ')}`

const buildContextTargets: BuildContextTarget[] = [
  {
    id: 'server_runtime_bundle',
    directory: 'dist-server',
    command: 'npm run build:server',
    args: ['run', 'build:server'],
    expectedEntry: 'server.js',
  },
  {
    id: 'remotion_worker_bundle',
    directory: 'dist-remotion-worker',
    command: 'npm run build:remotion-worker:mock',
    args: ['run', 'build:remotion-worker:mock'],
    expectedEntry: 'remotion-worker-cli.js',
  },
  {
    id: 'staging_fixture_worker_bundle',
    directory: 'dist-staging-fixture-worker',
    command: 'npm run build:staging-fixture-worker',
    args: ['run', 'build:staging-fixture-worker'],
    expectedEntry: 'staging-fixture-worker-cli.js',
  },
  {
    id: 'staging_real_video_export_worker_bundle',
    directory: 'dist-staging-real-video-export-worker',
    command: 'npm run build:staging-real-video-export-worker',
    args: ['run', 'build:staging-real-video-export-worker'],
    expectedEntry: 'staging-real-video-export-worker-cli.js',
  },
]

const sourceEvidencePaths = {
  pr508Decision:
    'docs/open-source-tool-stack/tracka-build-context-generation-execution/build-context-generation-execution-decision.json',
  pr508Manifest:
    'docs/open-source-tool-stack/tracka-build-context-generation-execution/build-context-generation-manifest.json',
  pr508Scan:
    'docs/open-source-tool-stack/tracka-build-context-generation-execution/generated-artifact-scan-report.json',
  pr508Cleanup:
    'docs/open-source-tool-stack/tracka-build-context-generation-execution/generated-artifact-cleanup-report.json',
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
  pr490Commands:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution/exact-future-probe-commands.json',
  pr481Decision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  pr477Decision:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  pr463Evidence:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/pr-463-diff-review.json',
  duckdbQa:
    'docs/open-source-tool-stack/duckdb-native-rebuild-qa/duckdb-native-rebuild-qa-decision.json',
  polarsProof:
    'docs/open-source-tool-stack/missing-optional-package-binary-execution/polars-proof-report.json',
  dockerfile: dockerfilePath,
  dockerignore: '.dockerignore',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
}

const reportPaths = {
  sourceAudit: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/source-of-truth-audit.json`,
  preExecutionValidation: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/pre-execution-validation-report.json`,
  preExecutionValidationMd: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/pre-execution-validation-report.md`,
  buildContextRegeneration: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/build-context-regeneration-report.json`,
  buildContextRegenerationMd: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/build-context-regeneration-report.md`,
  scan: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/generated-artifact-scan-report.json`,
  scanMd: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/generated-artifact-scan-report.md`,
  dockerReadiness: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/docker-readiness-report.json`,
  dockerBuild: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/docker-build-report.json`,
  dockerBuildMd: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/docker-build-report.md`,
  ffmpegProbe: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/ffmpeg-container-version-probe-report.json`,
  ffprobeProbe: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/ffprobe-container-version-probe-report.json`,
  cleanup: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/generated-output-cleanup-report.json`,
  imageCleanup: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/docker-image-cleanup-report.json`,
  sideEffectSafety: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/side-effect-artifact-safety-report.json`,
  sideEffectSafetyMd: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/side-effect-artifact-safety-report.md`,
  decision: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-decision.json`,
  decisionMd: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-decision.md`,
  readiness: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-readiness-report.json`,
  privateManifest: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-private-artifact-manifest.json`,
  validationResults: `${TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR}/tracka-container-docker-build-ffmpeg-ffprobe-version-probe-rerun-validation-results.md`,
}

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const predecessorPrs = [508, 504, 499, 494, 490, 486, 481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427, 421, 416]
const referenceOnlyPrs = [384, 401, 417, 420, 423, 425, 428, 432]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION_RERUN',
    'REEDITPRO_CONFIRM_TRACKA_BUILD_CONTEXT_GENERATION_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DIST_OUTPUT_GENERATION',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_SCAN',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_CLEANUP',
    'REEDITPRO_CONFIRM_DOCKER_BUILD_EXACT_APPROVED_COMMAND',
    'REEDITPRO_CONFIRM_TRACKA_CONTAINER_VERSION_PROBE_ONLY',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_NO_LOCAL_HOST_FFMPEG_FFPROBE',
    'REEDITPRO_CONFIRM_NO_MEDIA_INPUT',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_NO_DOCKER_IMAGE_PUSH',
    'REEDITPRO_CONFIRM_DOCKER_ARTIFACT_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_SYSTEM_BINARY_INSTALL',
    'REEDITPRO_CONFIRM_DOCKERFILE_MUTATION',
    'REEDITPRO_CONFIRM_CONTAINER_IMAGE_MUTATION',
    'REEDITPRO_CONFIRM_DOCKER_IMAGE_PUSH',
    'REEDITPRO_CONFIRM_LOCAL_HOST_FFMPEG_FFPROBE',
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

export function buildTrackaDockerBuildProbeRerunPlan() {
  return {
    phase,
    branch: TRACKA_DOCKER_BUILD_PROBE_RERUN_BRANCH,
    baseBranch: TRACKA_DOCKER_BUILD_PROBE_RERUN_BASE_BRANCH,
    sourceSha: TRACKA_DOCKER_BUILD_PROBE_RERUN_SOURCE_SHA,
    imageTag,
    buildContextTargets,
    approvedCommands: {
      dockerBuildCommand,
      dockerFfmpegCommand,
      dockerFfprobeCommand,
      cleanupCommand,
    },
    expectedDecision: passDecision,
    nextPromptOnPass: passNextPrompt,
    reportDirectory: TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR,
    requiredConfirmations: requiredConfirmations(),
    forbiddenConfirmations: forbiddenConfirmations(),
    explicitlyBlocked: [
      'local host FFmpeg/FFprobe',
      'media input, media probing, decode, encode, caption burn-in, render, export',
      'Docker image push, Dockerfile mutation, .dockerignore mutation, container definition mutation',
      'npm install, npm rebuild, package-lock mutation',
      'DuckDB or Polars proof rerun',
      'app worker, route, provider/model, browser, map execution',
      'Supabase, SQL, GCS, public artifacts, signed URLs, raw prompts, beta, production',
    ],
  }
}

export function readTrackaDockerBuildProbeRerunArtifacts(): TrackaDockerBuildProbeRerunReportSet {
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    preExecutionValidationReport: readJson(reportPaths.preExecutionValidation) ?? {},
    buildContextRegenerationReport: readJson(reportPaths.buildContextRegeneration) ?? {},
    generatedArtifactScanReport: readJson(reportPaths.scan) ?? {},
    dockerReadinessReport: readJson(reportPaths.dockerReadiness) ?? {},
    dockerBuildReport: readJson(reportPaths.dockerBuild) ?? {},
    ffmpegContainerVersionProbeReport: readJson(reportPaths.ffmpegProbe) ?? {},
    ffprobeContainerVersionProbeReport: readJson(reportPaths.ffprobeProbe) ?? {},
    generatedOutputCleanupReport: readJson(reportPaths.cleanup) ?? {},
    dockerImageCleanupReport: readJson(reportPaths.imageCleanup) ?? {},
    sideEffectArtifactSafetyReport: readJson(reportPaths.sideEffectSafety) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateManifest) ?? {},
  }
}

export function writeTrackaDockerBuildProbeRerunArtifacts(options: { execute?: boolean; args?: string[] } = {}) {
  if (options.execute) assertExecutionAllowed(options.args ?? [])
  const generatedAt = new Date().toISOString()
  const baseline = captureBaseline()
  const sourceAudit = buildSourceAudit(generatedAt, baseline)
  const preExecutionValidation = buildPreExecutionValidation(generatedAt, baseline)
  const buildContextRegeneration = options.execute
    ? runBuildContextRegeneration(generatedAt)
    : buildNotRunBuildContextRegeneration(generatedAt)
  const buildContextGenerated = buildContextRegeneration.reports.every(
    (report) => report.status === 'passed',
  )
  const scanReport = options.execute
    ? scanGeneratedArtifacts(generatedAt)
    : buildNotRunScanReport(generatedAt)
  const scanPassed = scanReport.passed === true
  const dockerReadiness =
    options.execute && buildContextGenerated && scanPassed
      ? checkDockerReadiness(generatedAt)
      : buildNotRunDockerReadiness(generatedAt, 'blocked_until_build_context_and_scan_pass')
  const dockerBuild =
    options.execute && dockerReadiness.dockerAvailable === true
      ? runDockerBuild(generatedAt)
      : buildNotRunCommandReport(
          generatedAt,
          'docker_build',
          dockerBuildCommand,
          dockerBuildArgs,
          'blocked_until_docker_ready',
        )
  const ffmpegProbe =
    options.execute && dockerBuild.exitCode === 0
      ? runContainerProbe(generatedAt, 'ffmpeg_container_version_probe', dockerFfmpegCommand, dockerFfmpegArgs)
      : buildNotRunCommandReport(
          generatedAt,
          'ffmpeg_container_version_probe',
          dockerFfmpegCommand,
          dockerFfmpegArgs,
          'blocked_until_docker_build_passes',
        )
  const ffprobeProbe =
    options.execute && ffmpegProbe.exitCode === 0
      ? runContainerProbe(generatedAt, 'ffprobe_container_version_probe', dockerFfprobeCommand, dockerFfprobeArgs)
      : buildNotRunCommandReport(
          generatedAt,
          'ffprobe_container_version_probe',
          dockerFfprobeCommand,
          dockerFfprobeArgs,
          'blocked_until_ffmpeg_probe_passes',
        )
  const cleanupReport = options.execute
    ? cleanupGeneratedOutputs(generatedAt)
    : buildNotRunCleanupReport(generatedAt)
  const imageCleanupReport =
    options.execute && ffmpegProbe.exitCode === 0 && ffprobeProbe.exitCode === 0
      ? cleanupDockerImage(generatedAt)
      : buildSkippedImageCleanupReport(generatedAt, 'skipped_until_both_probes_pass')
  const sideEffectSafety = buildSideEffectSafety(
    generatedAt,
    baseline,
    cleanupReport,
    imageCleanupReport,
  )
  const decisionValue = chooseDecision({
    buildContextRegeneration,
    scanReport,
    dockerReadiness,
    dockerBuild,
    ffmpegProbe,
    ffprobeProbe,
    cleanupReport,
    sideEffectSafety,
  })
  const nextPrompt = decisionValue === passDecision ? passNextPrompt : blockedNextPrompt
  const nextPromptPath = decisionValue === passDecision ? passNextPromptPath : blockedNextPromptPath
  const decision = buildDecision(generatedAt, decisionValue, nextPrompt, nextPromptPath, {
    dockerBuild,
    ffmpegProbe,
    ffprobeProbe,
    cleanupReport,
    scanReport,
    sideEffectSafety,
  })
  const readiness = {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.readiness.v1',
    generatedAt,
    readiness: decisionValue === passDecision,
    decision: decisionValue,
    blockers: decisionValue === passDecision ? [] : [decisionValue],
    nextPrompt,
  }
  const privateManifest = {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.privateArtifactManifest.v1',
    generatedAt,
    reportDirectory: TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR,
    generatedDistOutputsCreated: options.execute,
    generatedDistOutputsCommitted: false,
    generatedDistOutputsRemovedBeforeCommit: cleanupReport.passed === true,
    rawGeneratedFileContentsCommitted: false,
    dockerImageBuilt: dockerBuild.exitCode === 0,
    dockerImagePushed: false,
    dockerImageCleanupAttempted: imageCleanupReport.attempted === true,
    mediaArtifactsCreated: false,
    privatePayloadsAccessed: false,
    secretsAccessed: false,
    secretsPrinted: false,
    secretsCommitted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    supabaseClassification: supabaseClassification(),
  }

  mkdirSync(TRACKA_DOCKER_BUILD_PROBE_RERUN_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, sourceAudit)
  writeJson(reportPaths.preExecutionValidation, preExecutionValidation)
  writeText(reportPaths.preExecutionValidationMd, preExecutionValidationMarkdown(preExecutionValidation))
  writeJson(reportPaths.buildContextRegeneration, buildContextRegeneration)
  writeText(reportPaths.buildContextRegenerationMd, buildContextRegenerationMarkdown(buildContextRegeneration))
  writeJson(reportPaths.scan, scanReport)
  writeText(reportPaths.scanMd, scanMarkdown(scanReport))
  writeJson(reportPaths.dockerReadiness, dockerReadiness)
  writeJson(reportPaths.dockerBuild, dockerBuild)
  writeText(reportPaths.dockerBuildMd, dockerBuildMarkdown(dockerBuild))
  writeJson(reportPaths.ffmpegProbe, ffmpegProbe)
  writeJson(reportPaths.ffprobeProbe, ffprobeProbe)
  writeJson(reportPaths.cleanup, cleanupReport)
  writeJson(reportPaths.imageCleanup, imageCleanupReport)
  writeJson(reportPaths.sideEffectSafety, sideEffectSafety)
  writeText(reportPaths.sideEffectSafetyMd, sideEffectMarkdown(sideEffectSafety))
  writeJson(reportPaths.decision, decision)
  writeText(reportPaths.decisionMd, decisionMarkdown(decision))
  writeJson(reportPaths.readiness, readiness)
  writeJson(reportPaths.privateManifest, privateManifest)
  writeText(reportPaths.validationResults, validationResultsMarkdown(decision, buildContextRegeneration, scanReport))
  writeText(nextPromptPath, nextPromptMarkdown(decisionValue))
  updateStatusDocs(generatedAt, decisionValue, nextPrompt)

  return readTrackaDockerBuildProbeRerunArtifacts()
}

function assertExecutionAllowed(args: string[]) {
  for (const name of requiredConfirmations()) {
    if (process.env[name] !== 'true') throw new Error(`missing_required_confirmation:${name}`)
  }
  for (const name of forbiddenConfirmations()) {
    if (process.env[name] === 'true') throw new Error(`forbidden_confirmation:${name}`)
  }
  for (const flag of [
    '--execute',
    '--generate-build-context',
    '--build',
    '--version-only',
    '--tracka-container-only',
    '--no-media',
    '--cleanup',
  ]) {
    if (!args.includes(flag)) throw new Error(`missing_required_execution_flag:${flag}`)
  }
}

function buildSourceAudit(generatedAt: string, baseline: JsonRecord) {
  const sourceEvidence: JsonRecord = {}
  for (const [key, path] of Object.entries(sourceEvidencePaths)) {
    sourceEvidence[key] = {
      path,
      exists: existsSync(path),
      sha256: existsSync(path) ? hashFile(path) : null,
      json: path.endsWith('.json') && existsSync(path) ? readJson(path) : undefined,
    }
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.sourceAudit.v1',
    generatedAt,
    phase,
    branch: TRACKA_DOCKER_BUILD_PROBE_RERUN_BRANCH,
    baseBranch: TRACKA_DOCKER_BUILD_PROBE_RERUN_BASE_BRANCH,
    sourceSha: currentGitSha(),
    expectedSourceSha: TRACKA_DOCKER_BUILD_PROBE_RERUN_SOURCE_SHA,
    imageTag,
    predecessorPrs,
    referenceOnlyPrs,
    sourceEvidence,
    protectedHashesBeforeExecution: baseline,
    approvedCommands: {
      buildContext: buildContextTargets.map((target) => target.command),
      dockerBuildCommand,
      dockerFfmpegCommand,
      dockerFfprobeCommand,
      cleanupCommand,
    },
    scope: scopeFlags({ buildContextGenerationRun: false, dockerBuildRun: false, ffmpegProbeRun: false, ffprobeProbeRun: false }),
    supabaseClassification: supabaseClassification(),
  }
}

function buildPreExecutionValidation(generatedAt: string, baseline: JsonRecord) {
  const pkg = readJson('package.json') as { scripts?: Record<string, string> } | undefined
  const checks = [
    {
      id: 'source_sha_contains_pr_508',
      passed: typeof baseline.sourceSha === 'string' && existsSync(sourceEvidencePaths.pr508Decision),
    },
    {
      id: 'pr_508_decision_passed',
      passed:
        (readJson(sourceEvidencePaths.pr508Decision) as JsonRecord | undefined)?.decision ===
        'build_context_generation_execution_passed_ready_for_docker_build_probe_execution',
    },
    {
      id: 'pr_504_approval_passed',
      passed:
        (readJson(sourceEvidencePaths.pr504Decision) as JsonRecord | undefined)?.decision ===
        'build_context_generation_approval_passed_ready_for_generation_execution',
    },
    {
      id: 'pr_499_resolution_passed',
      passed:
        (readJson(sourceEvidencePaths.pr499Decision) as JsonRecord | undefined)?.decision ===
        'docker_build_blocker_resolution_passed_ready_for_build_context_generation_approval',
    },
    {
      id: 'pr_494_previous_docker_build_blocked',
      passed:
        (readJson(sourceEvidencePaths.pr494Decision) as JsonRecord | undefined)?.decision ===
        'blocked_pending_docker_build',
    },
    {
      id: 'pr_490_exact_command_source_passed',
      passed:
        (readJson(sourceEvidencePaths.pr490Decision) as JsonRecord | undefined)?.decision ===
        'exact_probe_command_blocker_resolution_passed_ready_for_docker_build_then_version_probe_execution',
    },
    {
      id: 'build_scripts_exist',
      passed: buildContextTargets.every((target) => typeof pkg?.scripts?.[target.command.replace('npm run ', '')] === 'string'),
    },
    {
      id: 'protected_hashes_captured',
      passed: Boolean(baseline.packageJsonHash && baseline.packageLockHash && baseline.dockerfileHash && baseline.dockerignoreHash),
    },
  ]
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.preExecutionValidation.v1',
    generatedAt,
    checks,
    passed: checks.every((check) => check.passed),
    approvedCommands: {
      dockerBuildCommand,
      dockerFfmpegCommand,
      dockerFfprobeCommand,
    },
  }
}

function runBuildContextRegeneration(generatedAt: string) {
  const reports: BuildContextGenerationReport[] = []
  let blocked = false
  for (const target of buildContextTargets) {
    if (blocked) {
      reports.push(buildNotRunBuildContextReport(generatedAt, target, 'blocked_after_prior_build_context_failure'))
      continue
    }
    const run = runCommand('npm', target.args, 240_000)
    const directoryExists = existsSync(target.directory)
    const expectedEntryExists = existsSync(join(target.directory, target.expectedEntry))
    const passed = run.exitCode === 0 && directoryExists && expectedEntryExists
    if (!passed) blocked = true
    reports.push({
      ...run,
      schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.buildContextGenerationTarget.v1',
      generatedAt,
      targetId: target.id,
      expectedDirectory: target.directory,
      expectedEntry: target.expectedEntry,
      exactApprovedCommand: run.command === target.command,
      status: passed ? 'passed' : 'failed',
      directoryExists,
      expectedEntryExists,
      fileCount: directoryExists ? countFiles(target.directory) : 0,
      totalSizeBytes: directoryExists ? directorySize(target.directory) : 0,
      sha256: directoryExists ? hashDirectory(target.directory) : null,
    })
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.buildContextRegeneration.v1',
    generatedAt,
    reports,
    passed: reports.every((report) => report.status === 'passed'),
    generatedDirectories: reports.map((report) => ({
      directory: report.expectedDirectory,
      exists: report.directoryExists,
      fileCount: report.fileCount,
      totalSizeBytes: report.totalSizeBytes,
      sha256: report.sha256,
    })),
  }
}

function scanGeneratedArtifacts(generatedAt: string) {
  const warnings: JsonRecord[] = []
  const forbiddenFindings: JsonRecord[] = []
  const scannedFiles: JsonRecord[] = []
  for (const target of buildContextTargets) {
    if (!existsSync(target.directory)) {
      forbiddenFindings.push({ type: 'missing_expected_directory', path: target.directory })
      continue
    }
    for (const file of listFiles(target.directory)) {
      const extension = extname(file).toLowerCase()
      const stats = statSync(file)
      scannedFiles.push({ path: file, sizeBytes: stats.size, extension })
      if (isExpectedStaticAsset(file)) {
        warnings.push({ type: 'expected_static_asset_copied_to_build_context', path: file, extension })
        continue
      }
      if (isMediaOrBinaryExtension(extension)) {
        forbiddenFindings.push({ type: 'forbidden_media_or_binary_extension', path: file, extension })
        continue
      }
      if (stats.size > 1_000_000) continue
      const text = readFileSync(file, 'utf8')
      for (const finding of scanTextForForbiddenMaterial(file, text)) forbiddenFindings.push(finding)
    }
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.generatedArtifactScan.v1',
    generatedAt,
    scannedDirectories: buildContextTargets.map((target) => target.directory),
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    warnings,
    forbiddenFindings,
    passed: forbiddenFindings.length === 0,
    rawGeneratedFileContentsCommitted: false,
  }
}

function checkDockerReadiness(generatedAt: string) {
  const command = 'docker version --format {{json .}}'
  const run = runCommand('docker', ['version', '--format', '{{json .}}'], 30_000)
  return {
    ...run,
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.dockerReadiness.v1',
    generatedAt,
    id: 'docker_readiness',
    command,
    dockerAvailable: run.exitCode === 0,
    dockerBuildCommand,
    dockerImagePushRun: false,
    dockerfileMutationRun: false,
    containerDefinitionMutationRun: false,
  }
}

function runDockerBuild(generatedAt: string): CommandRunReport {
  return {
    ...runCommand('docker', dockerBuildArgs, 900_000),
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.dockerBuild.v1',
    generatedAt,
    id: 'docker_build',
    command: dockerBuildCommand,
    exactApprovedCommand: true,
  }
}

function runContainerProbe(generatedAt: string, id: string, command: string, args: string[]): JsonRecord {
  const run = runCommand('docker', args, 60_000)
  const output = `${run.stdoutPreview}\n${run.stderrPreview}`
  return {
    ...run,
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.containerVersionProbe.v1',
    generatedAt,
    id,
    command,
    exactApprovedCommand: true,
    probeRun: true,
    approvedContainerCommand: command,
    noLocalHostProbe: true,
    noMediaInput: true,
    noMediaOutput: true,
    networkNone: args.includes('--network') && args.includes('none'),
    versionDetected: /ffmpeg version|ffprobe version/i.test(output),
    versionSummary: summarizeVersionOutput(output),
  }
}

function cleanupGeneratedOutputs(generatedAt: string) {
  const dirs = buildContextTargets.map((target) => target.directory)
  const run = runCommand('rm', ['-rf', ...dirs], 30_000)
  return {
    ...run,
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.generatedOutputCleanup.v1',
    generatedAt,
    id: 'generated_output_cleanup',
    command: cleanupCommand,
    exactApprovedCommand: true,
    directories: dirs.map((directory) => ({
      directory,
      removed: !existsSync(directory),
      staged: gitStatus(directory) !== '',
    })),
    generatedOutputsStaged: dirs.some((directory) => gitStatus(directory) !== ''),
    passed: run.exitCode === 0 && dirs.every((directory) => !existsSync(directory) && gitStatus(directory) === ''),
  }
}

function cleanupDockerImage(generatedAt: string) {
  const inspect = runCommand('docker', ['image', 'inspect', imageTag], 30_000)
  if (inspect.exitCode !== 0) {
    return {
      schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.dockerImageCleanup.v1',
      generatedAt,
      imageTag,
      attempted: false,
      skippedReason: 'image_not_present_after_probe_or_already_removed',
      exitCode: null,
      status: 'not_run',
      dockerImagePushRun: false,
      unrelatedImageMutationRun: false,
      passed: true,
    }
  }
  const remove = runCommand('docker', ['image', 'rm', imageTag], 120_000)
  return {
    ...remove,
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.dockerImageCleanup.v1',
    generatedAt,
    id: 'docker_image_cleanup',
    imageTag,
    attempted: true,
    command: `docker image rm ${imageTag}`,
    exactApprovedCommand: true,
    dockerImagePushRun: false,
    unrelatedImageMutationRun: false,
    passed: remove.exitCode === 0,
  }
}

function buildSideEffectSafety(
  generatedAt: string,
  baseline: JsonRecord,
  cleanupReport: JsonRecord,
  imageCleanupReport: JsonRecord,
) {
  const distPresent = buildContextTargets.filter((target) => existsSync(target.directory)).map((target) => target.directory)
  const checks = [
    { id: 'no_generated_dist_outputs_present', passed: distPresent.length === 0, details: distPresent },
    {
      id: 'no_generated_dist_outputs_staged',
      passed: buildContextTargets.every((target) => gitStatus(target.directory) === ''),
    },
    { id: 'package_lock_unchanged', passed: hashFile('package-lock.json') === baseline.packageLockHash },
    { id: 'dockerfile_unchanged', passed: hashFile(dockerfilePath) === baseline.dockerfileHash },
    { id: 'dockerignore_unchanged', passed: hashFile('.dockerignore') === baseline.dockerignoreHash },
    { id: 'generated_output_cleanup_passed', passed: cleanupReport.passed === true },
    { id: 'docker_image_not_pushed', passed: imageCleanupReport.dockerImagePushRun !== true },
  ]
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.sideEffectArtifactSafety.v1',
    generatedAt,
    checks,
    passed: checks.every((check) => check.passed),
    ...scopeFlags({
      buildContextGenerationRun: true,
      dockerBuildRun: true,
      ffmpegProbeRun: true,
      ffprobeProbeRun: true,
    }),
    generatedDistOutputsCommitted: false,
    dockerImagePushRun: false,
    dockerfileMutationRun: false,
    dockerignoreMutationRun: false,
    containerDefinitionMutationRun: false,
    packageLockMutationAttempted: false,
    supabaseClassification: supabaseClassification(),
  }
}

function chooseDecision(reports: {
  buildContextRegeneration: JsonRecord
  scanReport: JsonRecord
  dockerReadiness: JsonRecord
  dockerBuild: JsonRecord
  ffmpegProbe: JsonRecord
  ffprobeProbe: JsonRecord
  cleanupReport: JsonRecord
  sideEffectSafety: JsonRecord
}): TrackaDockerBuildProbeRerunDecision {
  if (reports.buildContextRegeneration.passed !== true) return 'blocked_pending_build_context_generation'
  if (reports.scanReport.passed !== true) return 'blocked_pending_generated_artifact_scan'
  if (reports.cleanupReport.passed !== true) return 'blocked_pending_generated_artifact_cleanup'
  if (reports.dockerReadiness.dockerAvailable !== true) return 'blocked_pending_docker_runtime_availability'
  if (reports.dockerBuild.exitCode !== 0) return 'blocked_pending_docker_build'
  if (reports.ffmpegProbe.exitCode !== 0) return 'blocked_pending_ffmpeg_version_probe'
  if (reports.ffprobeProbe.exitCode !== 0) return 'blocked_pending_ffprobe_version_probe'
  if (reports.sideEffectSafety.passed !== true) return 'blocked_pending_artifact_safety_review'
  return passDecision
}

function buildDecision(
  generatedAt: string,
  decision: TrackaDockerBuildProbeRerunDecision,
  nextPrompt: string,
  nextPromptPath: string,
  reports: {
    dockerBuild: JsonRecord
    ffmpegProbe: JsonRecord
    ffprobeProbe: JsonRecord
    cleanupReport: JsonRecord
    scanReport: JsonRecord
    sideEffectSafety: JsonRecord
  },
) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.decision.v1',
    generatedAt,
    decision,
    readiness: decision === passDecision,
    readyForQaReview: decision === passDecision,
    mediaProcessingStillBlocked: true,
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    imageTag,
    approvedCommands: { dockerBuildCommand, dockerFfmpegCommand, dockerFfprobeCommand },
    nextPrompt,
    nextPromptFile: nextPromptPath,
    blockers: decision === passDecision ? [] : [decision],
    buildContextGenerationRun: true,
    dockerBuildRun: reports.dockerBuild.exitCode === 0,
    dockerRunRun: reports.ffmpegProbe.probeRun === true || reports.ffprobeProbe.probeRun === true,
    ffmpegProbeRun: reports.ffmpegProbe.probeRun === true,
    ffprobeProbeRun: reports.ffprobeProbe.probeRun === true,
    localHostProbingRun: false,
    mediaInputUsed: false,
    mediaProcessingRun: false,
    renderExportRun: false,
    dockerImagePushRun: false,
    generatedDistOutputsCommitted: false,
    generatedDistOutputsCleaned: reports.cleanupReport.passed === true,
    generatedArtifactScanPassed: reports.scanReport.passed === true,
    sideEffectArtifactSafetyPassed: reports.sideEffectSafety.passed === true,
    supabaseClassification: supabaseClassification(),
  }
}

function buildNotRunBuildContextRegeneration(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.buildContextRegeneration.v1',
    generatedAt,
    reports: buildContextTargets.map((target) => buildNotRunBuildContextReport(generatedAt, target, 'not_executed')),
    passed: false,
    generatedDirectories: [],
  }
}

function buildNotRunBuildContextReport(
  generatedAt: string,
  target: BuildContextTarget,
  reason: string,
): BuildContextGenerationReport {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.buildContextGenerationTarget.v1',
    generatedAt,
    id: target.id,
    targetId: target.id,
    command: target.command,
    run: false,
    exactApprovedCommand: true,
    exitCode: null,
    status: 'not_run',
    stdoutPreview: '',
    stderrPreview: '',
    errorMessage: reason,
    timedOut: false,
    expectedDirectory: target.directory,
    expectedEntry: target.expectedEntry,
    directoryExists: existsSync(target.directory),
    expectedEntryExists: existsSync(join(target.directory, target.expectedEntry)),
    fileCount: existsSync(target.directory) ? countFiles(target.directory) : 0,
    totalSizeBytes: existsSync(target.directory) ? directorySize(target.directory) : 0,
    sha256: existsSync(target.directory) ? hashDirectory(target.directory) : null,
  }
}

function buildNotRunScanReport(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.generatedArtifactScan.v1',
    generatedAt,
    scannedDirectories: buildContextTargets.map((target) => target.directory),
    scannedFileCount: 0,
    warnings: [],
    forbiddenFindings: [],
    passed: false,
    notRunReason: 'not_executed',
  }
}

function buildNotRunDockerReadiness(generatedAt: string, reason: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.dockerReadiness.v1',
    generatedAt,
    id: 'docker_readiness',
    command: 'docker version --format {{json .}}',
    run: false,
    exactApprovedCommand: true,
    exitCode: null,
    status: 'not_run',
    stdoutPreview: '',
    stderrPreview: '',
    errorMessage: reason,
    timedOut: false,
    dockerAvailable: false,
    dockerBuildCommand,
    dockerImagePushRun: false,
    dockerfileMutationRun: false,
    containerDefinitionMutationRun: false,
  }
}

function buildNotRunCommandReport(
  generatedAt: string,
  id: string,
  command: string,
  args: string[],
  reason: string,
): CommandRunReport {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.command.v1',
    generatedAt,
    id,
    command,
    run: false,
    exactApprovedCommand: args.length > 0,
    exitCode: null,
    status: 'not_run',
    stdoutPreview: '',
    stderrPreview: '',
    errorMessage: reason,
    timedOut: false,
  }
}

function buildNotRunCleanupReport(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.generatedOutputCleanup.v1',
    generatedAt,
    id: 'generated_output_cleanup',
    command: cleanupCommand,
    run: false,
    exactApprovedCommand: true,
    exitCode: null,
    status: 'not_run',
    errorMessage: 'not_executed',
    directories: buildContextTargets.map((target) => ({
      directory: target.directory,
      removed: !existsSync(target.directory),
      staged: gitStatus(target.directory) !== '',
    })),
    generatedOutputsStaged: buildContextTargets.some((target) => gitStatus(target.directory) !== ''),
    passed: false,
  }
}

function buildSkippedImageCleanupReport(generatedAt: string, reason: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.dockerImageCleanup.v1',
    generatedAt,
    imageTag,
    attempted: false,
    skippedReason: reason,
    exitCode: null,
    status: 'not_run',
    dockerImagePushRun: false,
    unrelatedImageMutationRun: false,
    passed: true,
  }
}

function runCommand(command: string, args: string[], timeoutMs: number): CommandRunReport {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  const exitCode = typeof result.status === 'number' ? result.status : null
  return {
    schema: 'reeditpro.openSourceToolStack.trackaDockerBuildProbeRerun.command.v1',
    generatedAt: new Date().toISOString(),
    id: command,
    command: `${command} ${args.join(' ')}`.trim(),
    run: true,
    exactApprovedCommand: true,
    exitCode,
    status: exitCode === 0 ? 'passed' : 'failed',
    stdoutPreview: sanitizeOutput(result.stdout ?? ''),
    stderrPreview: sanitizeOutput(result.stderr ?? ''),
    errorMessage: result.error ? String(result.error.message) : null,
    timedOut: Boolean(result.error && /timed out|ETIMEDOUT/i.test(String(result.error.message))),
  }
}

function captureBaseline(): JsonRecord {
  return {
    sourceSha: currentGitSha(),
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dockerfileHash: hashFile(dockerfilePath),
    dockerignoreHash: hashFile('.dockerignore'),
    gitStatus: gitStatus(),
  }
}

function scopeFlags(flags: Partial<Record<string, boolean>>) {
  return {
    buildContextGenerationRun: flags.buildContextGenerationRun ?? false,
    dockerBuildRun: flags.dockerBuildRun ?? false,
    dockerRunRun: (flags.ffmpegProbeRun ?? false) || (flags.ffprobeProbeRun ?? false),
    ffmpegProbeRun: flags.ffmpegProbeRun ?? false,
    ffprobeProbeRun: flags.ffprobeProbeRun ?? false,
    localHostProbingRun: false,
    dockerImagePushRun: false,
    dockerfileMutationRun: false,
    dockerignoreMutationRun: false,
    containerDefinitionMutationRun: false,
    mediaInputUsed: false,
    mediaProbeRun: false,
    mediaDecodeEncodeRun: false,
    captionBurnInRun: false,
    renderExportRun: false,
    outputMediaCreated: false,
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
  }
}

function scanTextForForbiddenMaterial(path: string, text: string): JsonRecord[] {
  const findings: JsonRecord[] = []
  const patterns: Array<[string, RegExp]> = [
    ['private_key_block', /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+?-----END [A-Z ]*PRIVATE KEY-----/],
    ['aws_access_key', /\bAKIA[0-9A-Z]{16}\b/],
    ['openai_or_secret_key', /\bsk-(?:proj|live|test)-[A-Za-z0-9_-]{20,}\b/],
    ['jwt_token', /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/],
    ['database_url', /\b(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis):\/\/[^\s"'`<>]+/i],
    ['signed_url_material', /https?:\/\/[^\s"'`<>]*(?:X-Amz-Signature|X-Goog-Signature)=[^\s"'`<>]+/i],
    ['supabase_service_key_assignment', /\b(?:SUPABASE_SERVICE_ROLE_KEY|supabase_service_role)\s*[:=]\s*['"][^'"]{16,}['"]/i],
  ]
  for (const [type, pattern] of patterns) {
    const match = text.match(pattern)
    if (match) findings.push({ type, path, preview: sanitizeOutput(match[0]).slice(0, 120) })
  }
  return findings
}

function isExpectedStaticAsset(path: string) {
  return /(?:^|\/)(brand\/reeditpro-logo-source\.png|brand\/reeditpro-mark\.png|favicon\.png)$/.test(path)
}

function isMediaOrBinaryExtension(extension: string) {
  return new Set([
    '.mp4',
    '.mov',
    '.webm',
    '.mp3',
    '.wav',
    '.aac',
    '.flac',
    '.m4a',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.wasm',
    '.node',
    '.so',
    '.dylib',
    '.dll',
  ]).has(extension)
}

function listFiles(root: string): string[] {
  const files: string[] = []
  if (!existsSync(root)) return files
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) files.push(...listFiles(path))
    else files.push(path)
  }
  return files
}

function countFiles(root: string) {
  return listFiles(root).length
}

function directorySize(root: string) {
  return listFiles(root).reduce((total, file) => total + statSync(file).size, 0)
}

function hashDirectory(root: string) {
  const hash = createHash('sha256')
  for (const file of listFiles(root).sort()) {
    hash.update(relative(root, file))
    hash.update('\0')
    hash.update(readFileSync(file))
  }
  return hash.digest('hex')
}

function sanitizeOutput(value: string) {
  const ansiPattern = new RegExp(String.raw`\u001b\[[0-9;]*m`, 'g')
  return value
    .replace(ansiPattern, '')
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+?-----END [A-Z ]*PRIVATE KEY-----/g, '[redacted-private-key]')
    .replace(/\b(?:Bearer\s+)?[A-Za-z0-9._~+/-]{80,}\b/g, '[redacted-long-token]')
    .slice(0, 6000)
}

function summarizeVersionOutput(output: string) {
  const clean = sanitizeOutput(output)
  return clean
    .split(/\r?\n/)
    .filter((line) => /ffmpeg version|ffprobe version|configuration:|libav/i.test(line))
    .slice(0, 12)
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

function hashFile(path: string) {
  if (!existsSync(path)) return null
  return createHash('sha256').update(readFileSync(path)).digest('hex')
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

function preExecutionValidationMarkdown(report: JsonRecord) {
  return `# Pre-Execution Validation\n\nPassed: ${report.passed === true ? 'yes' : 'no'}\n`
}

function buildContextRegenerationMarkdown(report: JsonRecord) {
  const rows = Array.isArray(report.reports)
    ? report.reports
        .map((item) => `- ${item.command}: ${item.status}; ${item.expectedDirectory} files=${item.fileCount}`)
        .join('\n')
    : ''
  return `# Build-Context Regeneration\n\nPassed: ${report.passed === true ? 'yes' : 'no'}\n\n${rows}\n`
}

function scanMarkdown(report: JsonRecord) {
  return `# Generated Artifact Scan\n\nPassed: ${report.passed === true ? 'yes' : 'no'}\nForbidden findings: ${Array.isArray(report.forbiddenFindings) ? report.forbiddenFindings.length : 0}\nWarnings: ${Array.isArray(report.warnings) ? report.warnings.length : 0}\n`
}

function dockerBuildMarkdown(report: JsonRecord) {
  return `# Docker Build\n\nCommand: \`${report.command ?? dockerBuildCommand}\`\nExit code: ${report.exitCode ?? 'not_run'}\nStatus: ${report.status ?? 'not_run'}\nDocker image push: false\n`
}

function sideEffectMarkdown(report: JsonRecord) {
  return `# Side-Effect And Artifact Safety\n\nPassed: ${report.passed === true ? 'yes' : 'no'}\nGenerated outputs committed: false\nDocker image push: false\nSupabase writes: false\n`
}

function decisionMarkdown(decision: JsonRecord) {
  return `# Track A Container Docker Build FFmpeg/FFprobe Version-Probe Rerun Decision\n\nDecision: \`${decision.decision}\`\n\nNext prompt: \`${decision.nextPrompt}\`\n\nMedia processing and render/export remain blocked.\n`
}

function validationResultsMarkdown(
  decision: JsonRecord,
  buildContextRegeneration: JsonRecord,
  scanReport: JsonRecord,
) {
  return `# Validation Results\n\n- Decision: \`${decision.decision}\`\n- Build-context regeneration passed: ${buildContextRegeneration.passed === true}\n- Generated artifact scan passed: ${scanReport.passed === true}\n- Docker build command: \`${dockerBuildCommand}\`\n- FFmpeg probe command: \`${dockerFfmpegCommand}\`\n- FFprobe probe command: \`${dockerFfprobeCommand}\`\n- Supabase: no write / environment none / SQL none / migration no\n`
}

function nextPromptMarkdown(decision: TrackaDockerBuildProbeRerunDecision) {
  if (decision === passDecision) {
    return `# OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_QA_REVIEW\n\nReview the committed Track A container Docker build and FFmpeg/FFprobe version-probe rerun evidence. Do not rerun Docker, FFmpeg, FFprobe, build-context generation, media processing, render/export, Supabase, GCS, public artifact, signed URL, beta, or production scopes during QA.\n`
  }
  return `# OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_FFMPEG_FFPROBE_VERSION_PROBE_RERUN_BLOCKER_RESOLUTION\n\nResolve the exact blocker recorded by the Track A container Docker build FFmpeg/FFprobe version-probe rerun packet. Do not broaden execution scope or infer unapproved commands.\n`
}

function updateStatusDocs(generatedAt: string, decision: TrackaDockerBuildProbeRerunDecision, nextPrompt: string) {
  const block = [
    '',
    `## Track A Container Docker Build FFmpeg/FFprobe Version-Probe Rerun - ${generatedAt}`,
    '',
    `- Decision: \`${decision}\`.`,
    `- Image tag: \`${imageTag}\`.`,
    '- Build-context outputs were local-only and must not be committed.',
    '- Local-host probing, media processing, caption burn-in, render/export, Supabase/GCS, public artifact, signed URL, beta, and production scopes remain blocked.',
    `- Next prompt: \`${nextPrompt}\`.`,
    '',
  ].join('\n')
  for (const path of statusDocPaths) {
    if (existsSync(path)) writeText(path, `${readFileSync(path, 'utf8').trimEnd()}\n${block}`)
  }
}
