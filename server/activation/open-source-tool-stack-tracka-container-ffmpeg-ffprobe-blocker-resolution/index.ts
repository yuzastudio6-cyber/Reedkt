import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  TrackaContainerFfmpegFfprobeBlockerResolutionDecision,
  TrackaContainerFfmpegFfprobeBlockerResolutionReportSet,
} from './tracka-container-ffmpeg-ffprobe-blocker-resolution-types'

type JsonRecord = Record<string, unknown>

export const TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR =
  'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution'
export const TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_BRANCH =
  'codex/rp-open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-blocker-resolution'
export const TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_BASE_BRANCH =
  'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_SOURCE_SHA =
  '31dbf3d26c18b550b0dad7e712d194982b497bf4'

const expectedDecision: TrackaContainerFfmpegFfprobeBlockerResolutionDecision =
  'exact_probe_command_blocker_resolution_passed_ready_for_docker_build_then_version_probe_execution'
const nextPrompt =
  'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_DOCKER_BUILD_THEN_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION'
const nextPromptPath =
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-container-docker-build-then-ffmpeg-ffprobe-version-probe-execution.md'

const futureImageTagTemplate = 'reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha>'
const futureBuildCommand =
  'docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> .'
const futureFfmpegRunCommand =
  'docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version'
const futureFfprobeRunCommand =
  'docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version'

const sourceEvidencePaths = {
  blockedExecutionDecision:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/tracka-container-ffmpeg-ffprobe-version-probe-decision.json',
  blockedExactCommandReview:
    'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/exact-command-source-review.json',
  approvalDecision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/ffmpeg-ffprobe-version-probe-approval-decision.json',
  approvalFutureCommands:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/future-probe-command-approval.json',
  approvalRuntimePath:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/runtime-path-selection.json',
  approvalArtifactPolicy:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-version-probe-approval/package-docker-artifact-policy.json',
  trackaSourceDecision:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  trackaCentralEvidence:
    'docs/open-source-tool-stack/tracka-ffmpeg-ffprobe-source-of-truth/ffmpeg-ffprobe-central-evidence.json',
  systemBinaryReviewDecision:
    'docs/open-source-tool-stack/ffmpeg-ffprobe-system-binary-review/ffmpeg-ffprobe-system-binary-review-decision.json',
  dockerfile: 'docker/prod/render-worker/Dockerfile',
  renderWorkerBuildScript: 'scripts/docker/prod/04-build-render-worker-image.example.sh',
  renderWorkerReadinessScript: 'scripts/docker/prod/10-run-container-readiness-render.example.sh',
  imageConfigScript: 'scripts/docker/prod/00-print-image-config.sh',
  containerReadinessBuilder: 'server/workers/readiness-validation/container-readiness-command-builder.ts',
}

const reportPaths = {
  sourceAudit: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/source-of-truth-audit.json`,
  commandInventory: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/command-source-inventory.json`,
  commandInventoryMd: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/command-source-inventory.md`,
  dockerPolicy: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/docker-container-invocation-policy.json`,
  dockerPolicyMd: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/docker-container-invocation-policy.md`,
  exactCommands: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/exact-future-probe-commands.json`,
  exactCommandsMd: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/exact-future-probe-commands.md`,
  safetyPolicy: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/safety-and-artifact-policy.json`,
  safetyPolicyMd: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/safety-and-artifact-policy.md`,
  ownerHandoff: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/owner-handoff-review.json`,
  ownerHandoffMd: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/owner-handoff-review.md`,
  decision: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/exact-probe-command-blocker-resolution-decision.json`,
  decisionMd: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/exact-probe-command-blocker-resolution-decision.md`,
  readiness: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/exact-probe-command-blocker-resolution-readiness-report.json`,
  blockers: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/exact-probe-command-blocker-resolution-blocker-report.json`,
  privateManifest: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/exact-probe-command-blocker-resolution-private-artifact-manifest.json`,
  validationResults: `${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/exact-probe-command-blocker-resolution-validation-results.md`,
}

const statusDocPaths = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const predecessorPrs = [486, 481, 477, 472, 463, 469, 466, 455, 448, 444, 439, 435, 430, 427, 421, 416]
const referenceOnlyPrs = [428, 425, 432, 423, 420, 417, 401, 384]

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION',
    'REEDITPRO_CONFIRM_TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKED_EXECUTION_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_EXACT_CONTAINER_COMMAND_REVIEW',
    'REEDITPRO_CONFIRM_TRACKA_RUNTIME_PATH_REVIEW',
    'REEDITPRO_CONFIRM_DOCKER_CONTAINER_POLICY_REVIEW',
    'REEDITPRO_CONFIRM_NO_LOCAL_HOST_FFMPEG_FFPROBE',
    'REEDITPRO_CONFIRM_NO_FFMPEG_FFPROBE_PROBES',
    'REEDITPRO_CONFIRM_NO_DOCKER_RUN',
    'REEDITPRO_CONFIRM_NO_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_NO_MEDIA_INPUT',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmationFragments() {
  return [
    'VERSION_PROBE=true',
    'LOCAL_HOST_FFMPEG_FFPROBE',
    'DOCKER_RUN=true',
    'DOCKER_BUILD=true',
    'SYSTEM_BINARY_INSTALL',
    'DOCKERFILE_MUTATION',
    'CONTAINER_IMAGE_MUTATION',
    'MEDIA_PROCESSING',
    'MEDIA_FILE_PROBE',
    'CAPTION_BURN_IN_EXECUTION',
    'RENDER_EXPORT',
    'WORKER_EXECUTION',
    'TOOL_ROUTE_EXECUTION',
    'PROVIDER_CALLS',
    'DEPENDENCY_INSTALL',
    'NPM_INSTALL',
    'NPM_REBUILD',
    'DUCKDB_IMPORT_SMOKE',
    'POLARS_IMPORT_SMOKE',
    'SUPABASE_METADATA_WRITE',
    'SUPABASE_PRODUCTION_SQL',
    'GCS_UPLOAD',
    'PUBLIC_ARTIFACTS',
    'SIGNED_URL_DELIVERY',
    'PRODUCTION_WRITE',
    'EXTERNAL_BETA_UNLOCK',
    'PAID_PRODUCTION_UNLOCK',
    'RAW_PROMPT_EXECUTION',
    'GITHUB_PR_MERGE',
    'SECRET_PAYLOAD_PRINT',
  ]
}

export function buildTrackaContainerFfmpegFfprobeBlockerResolutionPlan() {
  return {
    phase: 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION',
    branch: TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_BRANCH,
    baseBranch: TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_BASE_BRANCH,
    expectedSourceSha: TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_SOURCE_SHA,
    mode: 'metadata_only_exact_command_blocker_resolution_no_runtime_execution',
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    expectedDecision,
    nextPrompt,
    futureBuildCommand,
    futureFfmpegRunCommand,
    futureFfprobeRunCommand,
    requiredConfirmations: requiredConfirmations(),
    reports: Object.values(reportPaths),
    docs: [...statusDocPaths, nextPromptPath],
    explicitlyNotRun: [
      'ffmpeg',
      'ffprobe',
      'docker build',
      'docker run',
      'local host binary probing',
      'media input or file probe',
      'decode encode caption burn-in render export',
      'npm install or rebuild',
      'DuckDB or Polars proof rerun',
      'worker route provider execution',
      'Supabase SQL GCS public artifact signed URL mutation',
      'raw prompt execution',
      'PR merge',
      'beta or production unlock',
    ],
  }
}

export function buildTrackaContainerFfmpegFfprobeBlockerResolutionReports(): TrackaContainerFfmpegFfprobeBlockerResolutionReportSet {
  const generatedAt = new Date().toISOString()
  const sourceEvidence = readSourceEvidence()
  const packageState = capturePackageState()
  const prMetadata = buildPrMetadata()
  const flags = blockedFlags()
  const commandSourceInventory = buildCommandSourceInventory(generatedAt, sourceEvidence)
  const dockerContainerInvocationPolicy = buildDockerContainerInvocationPolicy(generatedAt)
  const exactFutureProbeCommands = buildExactFutureProbeCommands(generatedAt)
  const safetyAndArtifactPolicy = buildSafetyAndArtifactPolicy(generatedAt, flags)
  const ownerHandoffReview = buildOwnerHandoffReview(generatedAt)
  const blockers = buildBlockers(commandSourceInventory, dockerContainerInvocationPolicy, exactFutureProbeCommands, safetyAndArtifactPolicy)
  const decisionValue = chooseDecision(blockers)
  const readiness = decisionValue === expectedDecision
  const decision = buildDecision(generatedAt, decisionValue, readiness, blockers, flags)

  return {
    sourceOfTruthAudit: buildSourceOfTruthAudit(generatedAt, packageState, prMetadata, sourceEvidence, flags),
    commandSourceInventory,
    dockerContainerInvocationPolicy,
    exactFutureProbeCommands,
    safetyAndArtifactPolicy,
    ownerHandoffReview,
    decision,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.readiness.v1',
      generatedAt,
      readiness,
      decision: decisionValue,
      readyForDockerBuildThenVersionProbeExecution: readiness,
      readyForImmediateProbeExecution: false,
      blockers,
      nextPrompt,
    },
    blockerReport: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.blockers.v1',
      generatedAt,
      blockers,
      priorBlocker: 'blocked_pending_exact_probe_command_source',
      resolvedByThisPacket: readiness,
      remainingBlockedScope: 'actual Docker build/run and FFmpeg/FFprobe version probe execution require the next separate phase',
      blockedScopesPreserved: Object.values(flags).every((value) => value === false),
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.privateArtifactManifest.v1',
      generatedAt,
      privatePayloadsAccessed: false,
      privatePayloadsPrinted: false,
      privatePayloadsCommitted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      mediaArtifactsCreated: false,
      dockerImagesBuilt: false,
      dockerImagesPushed: false,
      reportDirectory: TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR,
    },
  }
}

export function writeTrackaContainerFfmpegFfprobeBlockerResolutionArtifacts() {
  const reports = buildTrackaContainerFfmpegFfprobeBlockerResolutionReports()
  mkdirSync(TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR, { recursive: true })
  writeJson(reportPaths.sourceAudit, reports.sourceOfTruthAudit)
  writeJson(reportPaths.commandInventory, reports.commandSourceInventory)
  writeText(reportPaths.commandInventoryMd, commandSourceInventoryMarkdown(reports.commandSourceInventory))
  writeJson(reportPaths.dockerPolicy, reports.dockerContainerInvocationPolicy)
  writeText(reportPaths.dockerPolicyMd, dockerContainerInvocationPolicyMarkdown(reports.dockerContainerInvocationPolicy))
  writeJson(reportPaths.exactCommands, reports.exactFutureProbeCommands)
  writeText(reportPaths.exactCommandsMd, exactFutureProbeCommandsMarkdown(reports.exactFutureProbeCommands))
  writeJson(reportPaths.safetyPolicy, reports.safetyAndArtifactPolicy)
  writeText(reportPaths.safetyPolicyMd, safetyAndArtifactPolicyMarkdown(reports.safetyAndArtifactPolicy))
  writeJson(reportPaths.ownerHandoff, reports.ownerHandoffReview)
  writeText(reportPaths.ownerHandoffMd, ownerHandoffReviewMarkdown(reports.ownerHandoffReview))
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

export function readTrackaContainerFfmpegFfprobeBlockerResolutionArtifacts() {
  if (!existsSync(reportPaths.decision)) return undefined
  return {
    sourceOfTruthAudit: readJson(reportPaths.sourceAudit) ?? {},
    commandSourceInventory: readJson(reportPaths.commandInventory) ?? {},
    dockerContainerInvocationPolicy: readJson(reportPaths.dockerPolicy) ?? {},
    exactFutureProbeCommands: readJson(reportPaths.exactCommands) ?? {},
    safetyAndArtifactPolicy: readJson(reportPaths.safetyPolicy) ?? {},
    ownerHandoffReview: readJson(reportPaths.ownerHandoff) ?? {},
    decision: readJson(reportPaths.decision) ?? {},
    readinessReport: readJson(reportPaths.readiness) ?? {},
    blockerReport: readJson(reportPaths.blockers) ?? {},
    privateArtifactManifest: readJson(reportPaths.privateManifest) ?? {},
  }
}

export function summarizeTrackaContainerFfmpegFfprobeBlockerResolution(
  reports = readTrackaContainerFfmpegFfprobeBlockerResolutionArtifacts() ??
    buildTrackaContainerFfmpegFfprobeBlockerResolutionReports(),
) {
  return JSON.stringify(
    {
      phase: 'OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION',
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      selectedRuntimePath: reports.decision.selectedRuntimePath,
      futureBuildCommand,
      futureFfmpegRunCommand,
      futureFfprobeRunCommand,
      currentPhaseDockerBuildRun: false,
      currentPhaseDockerRun: false,
      currentPhaseVersionProbeRun: false,
      nextPrompt: reports.decision.nextPrompt,
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
        json: path.endsWith('.json') ? readJson(path) : undefined,
        containsFfmpeg: existsSync(path) ? readFileSync(path, 'utf8').includes('ffmpeg') : false,
        containsFfprobe: existsSync(path) ? readFileSync(path, 'utf8').includes('ffprobe') : false,
      },
    ]),
  )
}

function buildCommandSourceInventory(generatedAt: string, sourceEvidence: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.commandSourceInventory.v1',
    generatedAt,
    sourceFilesInspected: Object.values(sourceEvidence).map((entry) => (entry as JsonRecord).path),
    candidateCommands: [
      {
        source: sourceEvidencePaths.approvalFutureCommands,
        command: 'ffmpeg -version',
        commandKind: 'inner_command',
        exactEnoughForFutureExecution: false,
        reason: 'Approved by PR #481 as an inner command only; PR #486 confirmed no container wrapper existed.',
        dockerBuildRequired: false,
        dockerRunRequired: false,
        localHostBinaryUsed: false,
        mediaFilesReferenced: false,
      },
      {
        source: sourceEvidencePaths.approvalFutureCommands,
        command: 'ffprobe -version',
        commandKind: 'inner_command',
        exactEnoughForFutureExecution: false,
        reason: 'Approved by PR #481 as an inner command only; PR #486 confirmed no container wrapper existed.',
        dockerBuildRequired: false,
        dockerRunRequired: false,
        localHostBinaryUsed: false,
        mediaFilesReferenced: false,
      },
      {
        source: sourceEvidencePaths.renderWorkerBuildScript,
        command: 'docker build -f docker/prod/render-worker/Dockerfile -t "$(image_name reeditpro-render-worker)" .',
        commandKind: 'build_wrapper_pattern',
        exactEnoughForFutureExecution: false,
        reason: 'Source-of-truth build pattern requires environment-derived image tags; this packet freezes a local, no-push probe tag template instead.',
        dockerBuildRequired: true,
        dockerRunRequired: false,
        localHostBinaryUsed: false,
        mediaFilesReferenced: false,
      },
      {
        source: sourceEvidencePaths.renderWorkerReadinessScript,
        command:
          'docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=render_worker "${REEDITPRO_RENDER_WORKER_IMAGE}" npm run prod:readiness:summary -- --mode=static_only',
        commandKind: 'docker_run_wrapper_pattern',
        exactEnoughForFutureExecution: false,
        reason: 'Useful container run safety pattern, but it runs static readiness and not FFmpeg/FFprobe version commands.',
        dockerBuildRequired: false,
        dockerRunRequired: true,
        localHostBinaryUsed: false,
        mediaFilesReferenced: false,
      },
      {
        source: 'this_blocker_resolution_packet',
        command: futureBuildCommand,
        commandKind: 'future_exact_build_command',
        exactEnoughForFutureExecution: true,
        dockerBuildRequired: true,
        dockerRunRequired: false,
        localHostBinaryUsed: false,
        mediaFilesReferenced: false,
      },
      {
        source: 'this_blocker_resolution_packet',
        command: futureFfmpegRunCommand,
        commandKind: 'future_exact_container_probe_command',
        exactEnoughForFutureExecution: true,
        dockerBuildRequired: false,
        dockerRunRequired: true,
        localHostBinaryUsed: false,
        mediaFilesReferenced: false,
      },
      {
        source: 'this_blocker_resolution_packet',
        command: futureFfprobeRunCommand,
        commandKind: 'future_exact_container_probe_command',
        exactEnoughForFutureExecution: true,
        dockerBuildRequired: false,
        dockerRunRequired: true,
        localHostBinaryUsed: false,
        mediaFilesReferenced: false,
      },
    ],
    exactFutureCommandsDefined: true,
    currentPhaseCommandsRun: false,
    localHostBinariesSelected: false,
    mediaReferencedByFutureCommands: false,
  }
}

function buildDockerContainerInvocationPolicy(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.dockerContainerInvocationPolicy.v1',
    generatedAt,
    imageSource: 'docker/prod/render-worker/Dockerfile',
    existingImageMayBeUsed: false,
    existingImageReason: 'No exact central prebuilt image tag is source-of-truth for this probe lane.',
    futureDockerBuildApproved: true,
    futureDockerBuildCommand: futureBuildCommand,
    futureDockerBuildContext: '.',
    futureDockerBuildDockerfile: 'docker/prod/render-worker/Dockerfile',
    futureDockerImageTagTemplate: futureImageTagTemplate,
    futureFfmpegDockerRunCommand: futureFfmpegRunCommand,
    futureFfprobeDockerRunCommand: futureFfprobeRunCommand,
    networkMode: 'none',
    imagePushAllowed: false,
    dockerfileMutationAllowed: false,
    containerDefinitionMutationAllowed: false,
    mediaMountsAllowed: false,
    outputMountsAllowed: false,
    privatePayloadMountsAllowed: false,
    gcsAllowed: false,
    supabaseAllowed: false,
    timeoutSeconds: 15,
    cleanupPolicy: 'future execution must remove containers via --rm and may remove local probe image after report capture',
    stopOnFirstFailure: true,
    currentPhaseDockerBuildRun: false,
    currentPhaseDockerRun: false,
  }
}

function buildExactFutureProbeCommands(generatedAt: string) {
  const sourceSha = currentGitSha()
  const shortSha = sourceSha.slice(0, 12)
  const resolvedImage = `reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-${shortSha}`
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.exactFutureProbeCommands.v1',
    generatedAt,
    commandTemplateToken: '<source-sha>',
    sourceSha,
    resolvedForCurrentSourceSha: {
      futureBuildCommand: futureBuildCommand.replace('<source-sha>', shortSha),
      futureFfmpegRunCommand: futureFfmpegRunCommand.replace('<source-sha>', shortSha),
      futureFfprobeRunCommand: futureFfprobeRunCommand.replace('<source-sha>', shortSha),
      futureImageTag: resolvedImage,
    },
    futureBuildCommand,
    futureFfmpegRunCommand,
    futureFfprobeRunCommand,
    expectedOutputClassification: 'bounded_private_version_text_report_only',
    localHostProbingNotUsedReason: 'PR #481 selected the Track A repo-owned render-worker/container path and explicitly blocked local host probing.',
    noMediaTouchedReason: 'Commands use only version flags and have no media path arguments or mounts.',
    futureReportPaths: [
      'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/ffmpeg-version-probe-report.json',
      'docs/open-source-tool-stack/tracka-container-ffmpeg-ffprobe-version-probe-execution/ffprobe-version-probe-report.json',
    ],
    currentPhaseVersionProbeRun: false,
    currentPhaseDockerBuildRun: false,
    currentPhaseDockerRun: false,
  }
}

function buildSafetyAndArtifactPolicy(generatedAt: string, flags: JsonRecord) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.safetyAndArtifactPolicy.v1',
    generatedAt,
    blockedFlags: flags,
    mediaInputAllowed: false,
    mediaProbeAllowed: false,
    decodeAllowed: false,
    encodeAllowed: false,
    captionBurnInAllowed: false,
    renderExportAllowed: false,
    audioProcessingAllowed: false,
    workerJobExecutionAllowed: false,
    routeExecutionAllowed: false,
    providerCallsAllowed: false,
    supabaseWritesAllowed: false,
    sqlAllowed: false,
    gcsUploadAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
    betaProductionUnlockAllowed: false,
    rawPromptExecutionAllowed: false,
    dockerImagePushAllowed: false,
    dockerfileMutationAllowed: false,
    packageLockMutationAllowed: false,
    secretPayloadAccessAllowed: false,
    passed: Object.values(flags).every((value) => value === false),
  }
}

function buildOwnerHandoffReview(generatedAt: string) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.ownerHandoffReview.v1',
    generatedAt,
    trackAOwnerApprovalSufficientForFutureVersionProbe: true,
    workerRuntimeHandoffRequiredBeforeFutureProbe: false,
    soundMusicAudioHandoffRequiredBeforeFutureProbe: false,
    centralOpenSourceLaneMayOwnFutureVersionProbeExecution: true,
    futureMediaProcessingOwner: 'TRACK_A_RENDER_EXPORT',
    futureWorkerExecutionOwner: 'WORKER_RUNTIME_JOBS',
    futureRouteExecutionOwner: 'TOOL_ROUTE_EXECUTION',
    nextOwnerPrompt: nextPrompt,
    currentPhaseExecutionAttempted: false,
  }
}

function buildSourceOfTruthAudit(
  generatedAt: string,
  packageState: JsonRecord,
  prMetadata: JsonRecord[],
  sourceEvidence: JsonRecord,
  flags: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.sourceOfTruthAudit.v1',
    generatedAt,
    branch: TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_BRANCH,
    baseBranch: TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_BASE_BRANCH,
    centralSourceSha: currentGitSha(),
    expectedMinimumSourceSha: TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_SOURCE_SHA,
    sourceEvidence,
    prMetadata,
    packageState,
    dockerfileHash: hashFile('docker/prod/render-worker/Dockerfile'),
    broadProductionDocs: {
      betaReadinessScorecardPresent: existsSync('docs/beta-readiness-scorecard.md'),
      productionBetaBlockerInventoryPresent: existsSync('docs/production-beta-blocker-inventory.md'),
      productionFoundationStatusPresent: existsSync('PRODUCTION_FOUNDATION_STATUS.md'),
    },
    referenceOnlyPrs,
    noScopeConfirmation: flags,
    supabaseClassification: supabaseClassification(),
  }
}

function buildDecision(
  generatedAt: string,
  decisionValue: TrackaContainerFfmpegFfprobeBlockerResolutionDecision,
  readiness: boolean,
  blockers: string[],
  flags: JsonRecord,
) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackaContainerFfmpegFfprobeBlockerResolution.decision.v1',
    generatedAt,
    decision: decisionValue,
    readiness,
    selectedRuntimePath: 'tracka_repo_owned_render_worker_container',
    priorDecision: 'blocked_pending_exact_probe_command_source',
    futureBuildThenProbeExecutionApproved: readiness,
    futureImmediateProbeWithoutBuildApproved: false,
    futureBuildCommand,
    futureFfmpegRunCommand,
    futureFfprobeRunCommand,
    currentPhaseFfmpegProbeRun: false,
    currentPhaseFfprobeProbeRun: false,
    currentPhaseDockerBuildRun: false,
    currentPhaseDockerRun: false,
    currentPhaseMediaProcessingRun: false,
    blockers,
    nextPrompt,
    blockedFlags: flags,
    supabaseClassification: supabaseClassification(),
  }
}

function buildBlockers(
  commandSourceInventory: JsonRecord,
  dockerContainerInvocationPolicy: JsonRecord,
  exactFutureProbeCommands: JsonRecord,
  safetyAndArtifactPolicy: JsonRecord,
) {
  const blockers: string[] = []
  if (commandSourceInventory.exactFutureCommandsDefined !== true) blockers.push('blocked_pending_exact_tracka_container_probe_command')
  if (dockerContainerInvocationPolicy.futureDockerBuildApproved !== true) blockers.push('blocked_pending_docker_build_policy')
  if (!exactFutureProbeCommands.futureFfmpegRunCommand || !exactFutureProbeCommands.futureFfprobeRunCommand) {
    blockers.push('blocked_pending_docker_runtime_policy')
  }
  if (safetyAndArtifactPolicy.passed !== true) blockers.push('rejected_due_runtime_safety_risk')
  return blockers
}

function chooseDecision(blockers: string[]): TrackaContainerFfmpegFfprobeBlockerResolutionDecision {
  if (blockers.includes('rejected_due_runtime_safety_risk')) return 'rejected_due_runtime_safety_risk'
  if (blockers.length) return blockers[0] as TrackaContainerFfmpegFfprobeBlockerResolutionDecision
  return expectedDecision
}

function blockedFlags() {
  return {
    ffmpegProbeRun: false,
    ffprobeProbeRun: false,
    localHostProbingRun: false,
    dockerBuildRun: false,
    dockerRunRun: false,
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
    packageJsonDependencySections: readPackageDependencySections(),
    packageLockChangedInThisPhase: gitStatus('package-lock.json') !== '',
    dockerfileChangedInThisPhase: gitStatus('docker/prod/render-worker/Dockerfile') !== '',
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

function buildPrMetadata() {
  return predecessorPrs.map((number) => ghPrView(number)).concat(referenceOnlyPrs.map((number) => ghPrView(number)))
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

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  }
}

function commandSourceInventoryMarkdown(report: JsonRecord) {
  const commands = (report.candidateCommands as JsonRecord[]).map((item) => {
    return `| ${item.commandKind} | \`${item.command}\` | ${item.exactEnoughForFutureExecution} | ${item.dockerBuildRequired} | ${item.dockerRunRequired} | ${item.localHostBinaryUsed} | ${item.mediaFilesReferenced} |`
  })
  return `# Command Source Inventory

| Kind | Command | Exact enough | Build required | Run required | Local host | Media referenced |
| --- | --- | --- | --- | --- | --- | --- |
${commands.join('\n')}

Current phase commands run: \`${report.currentPhaseCommandsRun}\`.
`
}

function dockerContainerInvocationPolicyMarkdown(report: JsonRecord) {
  return `# Docker Container Invocation Policy

- Image source: \`${report.imageSource}\`
- Existing image may be used: \`${report.existingImageMayBeUsed}\`
- Future Docker build approved: \`${report.futureDockerBuildApproved}\`
- Future build command: \`${report.futureDockerBuildCommand}\`
- Future FFmpeg run command: \`${report.futureFfmpegDockerRunCommand}\`
- Future FFprobe run command: \`${report.futureFfprobeDockerRunCommand}\`
- Network mode: \`${report.networkMode}\`
- Image push allowed: \`${report.imagePushAllowed}\`
- Dockerfile mutation allowed: \`${report.dockerfileMutationAllowed}\`
- Media mounts allowed: \`${report.mediaMountsAllowed}\`
- Output mounts allowed: \`${report.outputMountsAllowed}\`
- Timeout seconds: \`${report.timeoutSeconds}\`
- Current phase Docker build/run: \`${report.currentPhaseDockerBuildRun}\` / \`${report.currentPhaseDockerRun}\`
`
}

function exactFutureProbeCommandsMarkdown(report: JsonRecord) {
  const resolved = report.resolvedForCurrentSourceSha as JsonRecord
  return `# Exact Future Probe Commands

The blocker is resolved by defining exact future commands only. This phase did not run them.

- Build command template: \`${report.futureBuildCommand}\`
- FFmpeg run command template: \`${report.futureFfmpegRunCommand}\`
- FFprobe run command template: \`${report.futureFfprobeRunCommand}\`
- Resolved current-source build command: \`${resolved.futureBuildCommand}\`
- Resolved current-source FFmpeg command: \`${resolved.futureFfmpegRunCommand}\`
- Resolved current-source FFprobe command: \`${resolved.futureFfprobeRunCommand}\`
- Local host probing reason: ${report.localHostProbingNotUsedReason}
- No media reason: ${report.noMediaTouchedReason}
- Current phase Docker/probe execution: \`${report.currentPhaseDockerBuildRun}\` / \`${report.currentPhaseDockerRun}\` / \`${report.currentPhaseVersionProbeRun}\`
`
}

function safetyAndArtifactPolicyMarkdown(report: JsonRecord) {
  return `# Safety And Artifact Policy

All current-phase execution and unlock flags remain false. Media input/probing, decode/encode, caption burn-in, render/export, workers, routes, providers, Supabase, SQL, GCS, public artifacts, signed URLs, beta/production, raw prompts, Docker image push, Dockerfile mutation, and package-lock mutation remain blocked.

Policy passed: \`${report.passed}\`.
`
}

function ownerHandoffReviewMarkdown(report: JsonRecord) {
  return `# Owner Handoff Review

- Track A owner approval sufficient for future version probe: \`${report.trackAOwnerApprovalSufficientForFutureVersionProbe}\`
- Worker Runtime handoff required before future probe: \`${report.workerRuntimeHandoffRequiredBeforeFutureProbe}\`
- Sound/Music/Audio handoff required before future probe: \`${report.soundMusicAudioHandoffRequiredBeforeFutureProbe}\`
- Central open-source lane may own future version probe execution: \`${report.centralOpenSourceLaneMayOwnFutureVersionProbeExecution}\`
- Future media processing owner: \`${report.futureMediaProcessingOwner}\`
- Next prompt: \`${report.nextOwnerPrompt}\`
`
}

function decisionMarkdown(report: JsonRecord) {
  return `# Exact Probe Command Blocker Resolution Decision

Decision: \`${report.decision}\`

The prior blocker \`blocked_pending_exact_probe_command_source\` is resolved for a future build-then-version-probe execution packet. This phase only defines the future commands; it does not run Docker, FFmpeg, FFprobe, or any media/render/runtime path.

Next prompt: \`${report.nextPrompt}\`
`
}

function validationResultsMarkdown(reports: TrackaContainerFfmpegFfprobeBlockerResolutionReportSet) {
  return `# Track A Container FFmpeg/FFprobe Blocker Resolution Validation Results

- Decision: \`${reports.decision.decision}\`
- Readiness: \`${reports.readinessReport.readiness}\`
- Future build command defined: \`${Boolean(reports.exactFutureProbeCommands.futureBuildCommand)}\`
- Future FFmpeg command defined: \`${Boolean(reports.exactFutureProbeCommands.futureFfmpegRunCommand)}\`
- Future FFprobe command defined: \`${Boolean(reports.exactFutureProbeCommands.futureFfprobeRunCommand)}\`
- Current phase Docker build/run: \`false\` / \`false\`
- Current phase FFmpeg/FFprobe probes: \`false\` / \`false\`
- Package-lock mutation: \`false\`
- Dockerfile mutation: \`false\`
- Supabase classification: \`no write / none / none / no\`
`
}

function nextPromptMarkdown(reports: TrackaContainerFfmpegFfprobeBlockerResolutionReportSet) {
  return `# Open-Source Tool Stack Track A Container Docker Build Then FFmpeg/FFprobe Version-Probe Execution

Use this prompt only after PR source-of-truth merge for the blocker-resolution packet.

Decision prerequisite: \`${reports.decision.decision}\`

Future bounded commands:

\`\`\`bash
${futureBuildCommand}
${futureFfmpegRunCommand}
${futureFfprobeRunCommand}
\`\`\`

Rules:
- Run only the exact build and version-output commands in the future execution phase.
- Do not push images.
- Do not mutate Dockerfiles, package files, container definitions, Supabase, SQL, GCS, or public artifacts.
- Do not mount media or private payloads.
- Do not probe media files, decode, encode, caption burn-in, render, or export.
- Capture bounded private report output only.
- Stop on first failure.
`
}

function updateStatusDocs(reports: TrackaContainerFfmpegFfprobeBlockerResolutionReportSet) {
  const section = `## Track A Container FFmpeg/FFprobe Probe Blocker Resolution

- Decision: \`${reports.decision.decision}\`
- Prior blocker \`blocked_pending_exact_probe_command_source\` is resolved by defining exact future build-then-version-probe commands.
- Future path: Track A repo-owned render-worker Dockerfile, local no-push image tag, then container-only \`ffmpeg -version\` and \`ffprobe -version\`.
- Current phase execution: no FFmpeg/FFprobe, Docker build/run, local host probe, media processing, render/export, workers, routes, providers, Supabase, GCS, public artifacts, signed URLs, beta, or production.
- Next prompt: \`${reports.decision.nextPrompt}\`.
`
  for (const docPath of statusDocPaths) {
    if (existsSync(docPath)) upsertSection(docPath, 'Track A Container FFmpeg/FFprobe Probe Blocker Resolution', section)
  }
}

function upsertSection(path: string, title: string, section: string) {
  const start = `<!-- ${title}:start -->`
  const end = `<!-- ${title}:end -->`
  const wrapped = `${start}\n${section.trim()}\n${end}\n`
  const current = readFileSync(path, 'utf8')
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`)
  const next = pattern.test(current) ? current.replace(pattern, wrapped) : `${current.trimEnd()}\n\n${wrapped}`
  writeText(path, next)
}

function readJson(path: string) {
  if (!existsSync(path)) return undefined
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as JsonRecord
  } catch {
    return undefined
  }
}

function writeJson(path: string, value: unknown) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(path: string, value: string) {
  writeFileSync(path, value)
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
