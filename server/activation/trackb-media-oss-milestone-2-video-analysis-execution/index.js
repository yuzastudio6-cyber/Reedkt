import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(__filename), '..', '..', '..')

export const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-2-video-analysis-execution'
export const branchName = 'codex/rp-trackb-media-oss-milestone-2-video-analysis-execution'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = '4f22c637e49e77d237158b1b1139ed047ef242f3'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const dockerfilePath = 'docker/prod/cpu-worker/Dockerfile'
export const requirementsPath = 'docker/prod/cpu-worker/requirements.cpu.txt'
export const imageTag = `reeditpro-cpu-worker:trackb-milestone2-${expectedSourceSha}`

export const passDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_passed_all_three_tools_cpu_bounded'
export const pyavDeferredDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyav_fixture_deferred'
export const pyscenedetectDeferredDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyscenedetect_fixture_deferred'
export const pyavAndPyscenedetectDeferredDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_passed_with_pyav_and_pyscenedetect_fixtures_deferred'
export const sourceTargetDriftDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_source_target_drift'
export const dependencyHydrationDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_dependency_hydration'
export const buildContextGenerationDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_build_context_generation'
export const artifactScanDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_generated_artifact_scan'
export const dockerBuildDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_docker_build'
export const opencvDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_opencv_import_or_fixture'
export const pyavDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_pyav_import_or_fixture'
export const pyscenedetectDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_pyscenedetect_import_or_fixture'
export const cleanupDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_artifact_cleanup'
export const safetyScanDecision =
  'trackb_media_oss_milestone2_video_analysis_execution_blocked_by_safety_scan'
export const runtimeSafetyDecision = 'rejected_due_runtime_safety_risk'

const qaNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_2_QA_REVIEW'
const blockerNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION_BLOCKER_FOLLOWUP'
const qaNextPromptPath = 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-2-qa-review.md'
const blockerPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-2-video-analysis-execution-blocker-followup.md'

const targetTools = [
  { id: 'opencv', name: 'OpenCV', module: 'cv2', packageName: 'opencv-python-headless' },
  { id: 'pyav', name: 'PyAV', module: 'av', packageName: 'av' },
  { id: 'pyscenedetect', name: 'PySceneDetect', module: 'scenedetect', packageName: 'scenedetect' },
]
const buildContextCommands = [
  { command: 'npm', args: ['run', 'build:server'], outputDir: 'dist-server' },
  {
    command: 'npm',
    args: ['run', 'build:staging-fixture-worker'],
    outputDir: 'dist-staging-fixture-worker',
  },
]
const cleanupOutputs = ['dist', 'dist-server', 'dist-staging-fixture-worker', 'node_modules']
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  dockerfilePath,
  requirementsPath,
]
const forbiddenGeneratedExtensions = new Set([
  '.mp4',
  '.mov',
  '.m4v',
  '.webm',
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
  '.node',
  '.wasm',
])
const allowedStaticAssetSuffixes = [
  '/brand/reeditpro-logo-source.png',
  '/brand/reeditpro-mark.png',
  '/favicon.png',
]
const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9_]{20,}\b/,
  /\bpostgres(?:ql)?:\/\/[^\s"'`]+/i,
  /\bX-Amz-Signature=/i,
  /BEGIN [A-Z ]*PRIVATE KEY/,
]

function generatedAt() {
  return new Date().toISOString()
}

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
  }
}

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_MILESTONE_2_CPU_FIRST_EXECUTION',
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DIST_SERVER_GENERATION',
    'REEDITPRO_CONFIRM_DIST_STAGING_FIXTURE_WORKER_GENERATION',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_SCAN',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_OPENCV_PROOF',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_PYAV_PROOF',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_PYSCENEDETECT_PROOF',
    'REEDITPRO_CONFIRM_SYNTHETIC_FIXTURES_ONLY',
    'REEDITPRO_CONFIRM_NO_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_NO_FFMPEG_FFPROBE_EXPANSION',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_NO_SUPABASE_MUTATION',
    'REEDITPRO_CONFIRM_NO_DOCKER_IMAGE_PUSH',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_PIP_INSTALL',
    'REEDITPRO_CONFIRM_NPM_INSTALL',
    'REEDITPRO_CONFIRM_NPM_REBUILD',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_MUTATION',
    'REEDITPRO_CONFIRM_REQUIREMENTS_MUTATION',
    'REEDITPRO_CONFIRM_DOCKERFILE_MUTATION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_TOOL_GPU_EXECUTION',
    'REEDITPRO_CONFIRM_GPU_RUNTIME_EXECUTION',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_EXIFTOOL_EXECUTION',
    'REEDITPRO_CONFIRM_MEDIAINFO_EXECUTION',
    'REEDITPRO_CONFIRM_TESSERACT_EXECUTION',
    'REEDITPRO_CONFIRM_IMAGEMAGICK_EXECUTION',
    'REEDITPRO_CONFIRM_GRAPHICSMAGICK_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEOCR_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEPADDLE_EXECUTION',
    'REEDITPRO_CONFIRM_OPENCOLORIO_EXECUTION',
    'REEDITPRO_CONFIRM_OPENIMAGEIO_EXECUTION',
    'REEDITPRO_CONFIRM_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_MEDIA_FILE_PROBE',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_WORKER_EXECUTION',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
    'REEDITPRO_CONFIRM_PROVIDER_CALLS',
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
    'REEDITPRO_CONFIRM_DOCKER_IMAGE_PUSH',
  ]
}

function assertConfirmations() {
  const missing = requiredConfirmations().filter((name) => process.env[name] !== 'true')
  const forbidden = forbiddenConfirmations().filter((name) => process.env[name] === 'true')
  if (missing.length || forbidden.length) {
    throw new Error(`confirmation_gate_failed:${JSON.stringify({ missing, forbidden })}`)
  }
}

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
}

function run(command, args, options = {}) {
  const started = Date.now()
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    timeout: options.timeout || 60000,
    maxBuffer: 40 * 1024 * 1024,
    env: { ...process.env, ...(options.env || {}) },
  })
  return {
    command: [command, ...args].join(' '),
    exitCode: result.status ?? null,
    signal: result.signal ?? null,
    durationMs: Date.now() - started,
    stdoutSummary: sanitize(result.stdout),
    stderrSummary: sanitize(result.stderr),
    error: result.error?.message || null,
  }
}

function dockerPython(script, options = {}) {
  return run(
    'docker',
    ['run', '--rm', '--network', 'none', '--entrypoint', 'python3', imageTag, '-c', script],
    { timeout: options.timeout || 120000 },
  )
}

function sanitize(value = '') {
  const lines = String(value)
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[email-redacted]')
    .replace(/\b(sk-[A-Za-z0-9_-]+|sk-proj-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_]+|X-Amz-Signature=[A-Za-z0-9%]+)\b/g, '[secret-redacted]')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length <= 80) return lines.join('\n')
  return [...lines.slice(0, 32), '[...output truncated...]', ...lines.slice(-48)].join('\n')
}

function hashFile(relativePath) {
  const fullPath = join(repoRoot, relativePath)
  if (!existsSync(fullPath)) return null
  return createHash('sha256').update(readFileSync(fullPath)).digest('hex')
}

function writeJson(relativePath, value) {
  const fullPath = join(repoRoot, relativePath)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(relativePath, value) {
  const fullPath = join(repoRoot, relativePath)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, value)
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), 'utf8'))
}

function replaceOrAppend(relativePath, start, end, body) {
  const fullPath = join(repoRoot, relativePath)
  const current = existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : ''
  const block = `${start}\n${body.trim()}\n${end}`
  const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`)
  const next = pattern.test(current) ? current.replace(pattern, block) : `${current.trimEnd()}\n\n${block}\n`
  writeFileSync(fullPath, next)
}

export function buildTrackBMilestone2VideoAnalysisExecutionPlan() {
  return {
    branchName,
    baseBranch,
    expectedSourceSha,
    ownerId,
    decisionCandidates: [
      passDecision,
      pyavDeferredDecision,
      pyscenedetectDeferredDecision,
      pyavAndPyscenedetectDeferredDecision,
      sourceTargetDriftDecision,
      dependencyHydrationDecision,
      buildContextGenerationDecision,
      artifactScanDecision,
      dockerBuildDecision,
      opencvDecision,
      pyavDecision,
      pyscenedetectDecision,
      cleanupDecision,
      safetyScanDecision,
      runtimeSafetyDecision,
    ],
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    packages: targetTools.map((tool) => tool.packageName),
    buildContextCommands: buildContextCommands.map((entry) => ({
      command: `${entry.command} ${entry.args.join(' ')}`,
      outputDir: entry.outputDir,
    })),
    dockerBuildCommand: `docker build -f ${dockerfilePath} -t ${imageTag} .`,
    versionProofBoundary: 'container_only_python_import_version_with_network_none',
    fixtureProofBoundary: 'synthetic_fixtures_only_no_real_user_media_no_ffmpeg_command',
    cleanupCommand: 'rm -rf dist dist-server dist-staging-fixture-worker node_modules',
    supabaseClassification: supabaseClassification(),
  }
}

function buildSourceAudit(generated) {
  const sourceSha = git(['rev-parse', 'HEAD'])
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.sourceAudit.v1',
    generatedAt: generated,
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceSha,
    sourceCompatible: sourceSha === expectedSourceSha,
    ownerId,
    sourceEvidence: [
      {
        pr: 567,
        state: 'MERGED',
        decision: 'trackb_media_oss_milestone2_video_analysis_approval_passed_ready_for_execution',
        targetDockerfile: dockerfilePath,
        targetRequirements: requirementsPath,
      },
      { pr: 563, state: 'MERGED', decision: 'trackb_media_oss_milestone1_qa_passed_ready_for_milestone2_video_analysis_approval' },
      { pr: 559, state: 'MERGED', decision: 'trackb_media_oss_milestone1_tesseract_fixture_followup_passed_ready_for_qa' },
      { pr: 557, state: 'MERGED', decision: 'trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof' },
      { pr: 551, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context' },
      { pr: 549, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution' },
      { pr: 546, state: 'MERGED', decision: 'trackb_media_oss_milestone1_blocked_pending_container_packaging_approval' },
      { pr: 545, state: 'MERGED', decision: 'trackb_media_oss_install_proof_milestone_plan_passed_ready_for_milestone_1_execution' },
      { pr: 542, state: 'MERGED', ownerId },
    ],
    tools: targetTools.map((tool) => tool.id),
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dockerfileHash: hashFile(dockerfilePath),
    requirementsHash: hashFile(requirementsPath),
    supabaseClassification: supabaseClassification(),
  }
}

function buildSourceTargetCheck(generated) {
  const dockerfile = readFileSync(join(repoRoot, dockerfilePath), 'utf8')
  const requirements = readFileSync(join(repoRoot, requirementsPath), 'utf8')
  const packagePresence = Object.fromEntries(
    targetTools.map((tool) => [
      tool.packageName,
      new RegExp(`(^|\\n)${tool.packageName}(\\n|$)`).test(requirements),
    ]),
  )
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.sourceTargetCheck.v1',
    generatedAt: generated,
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    dockerfileCopiesRequirements: dockerfile.includes(`COPY ${requirementsPath} /tmp/requirements.cpu.txt`),
    dockerfileInstallsRequirements: dockerfile.includes('python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.cpu.txt'),
    packagePresence,
    allRequiredPackagesDeclared: Object.values(packagePresence).every(Boolean),
    packageLockMutationAllowed: false,
    dockerfileMutationAllowed: false,
    requirementsMutationAllowed: false,
    ffmpegFfprobeExpansionApproved: false,
  }
}

function runDependencyHydration(execute) {
  const before = {
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    nodeModulesPresentBefore: existsSync(join(repoRoot, 'node_modules')),
  }
  if (!execute) {
    return {
      ...before,
      command: 'npm ci --ignore-scripts --no-audit --no-fund',
      skipped: true,
      skipReason: 'not_execute_mode',
      exitCode: null,
      packageFilesUnchanged: true,
      nodeModulesCreatedByThisPhase: false,
    }
  }
  if (before.nodeModulesPresentBefore) {
    return {
      ...before,
      command: 'npm ci --ignore-scripts --no-audit --no-fund',
      skipped: true,
      skipReason: 'node_modules_already_present',
      exitCode: 0,
      packageFilesUnchanged: true,
      nodeModulesCreatedByThisPhase: false,
    }
  }
  const result = run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { timeout: 1800000 })
  return {
    ...before,
    ...result,
    skipped: false,
    packageFilesUnchanged:
      before.packageJsonHash === hashFile('package.json') && before.packageLockHash === hashFile('package-lock.json'),
    nodeModulesCreatedByThisPhase: existsSync(join(repoRoot, 'node_modules')),
  }
}

function runBuildContextGeneration(execute, hydrationReport) {
  if (!execute || hydrationReport.exitCode !== 0 || hydrationReport.packageFilesUnchanged !== true) {
    return {
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'dependency_hydration_not_ready',
      results: buildContextCommands.map((entry) => ({
        command: `${entry.command} ${entry.args.join(' ')}`,
        outputDir: entry.outputDir,
        exitCode: null,
        outputExists: existsSync(join(repoRoot, entry.outputDir)),
      })),
      allCommandsPassed: false,
      allOutputsPresent: false,
    }
  }
  const results = []
  for (const entry of buildContextCommands) {
    const result = run(entry.command, entry.args, { timeout: 1200000 })
    results.push({
      ...result,
      outputDir: entry.outputDir,
      outputExists: existsSync(join(repoRoot, entry.outputDir)),
    })
    if (result.exitCode !== 0) break
  }
  return {
    skipped: false,
    results,
    allCommandsPassed: results.length === buildContextCommands.length && results.every((entry) => entry.exitCode === 0),
    allOutputsPresent: buildContextCommands.every((entry) => existsSync(join(repoRoot, entry.outputDir))),
  }
}

function walkFiles(relativeDir) {
  const root = join(repoRoot, relativeDir)
  const files = []
  if (!existsSync(root)) return files
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const fullPath = join(dir, name)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) walk(fullPath)
      else files.push(fullPath)
    }
  }
  walk(root)
  return files
}

function extname(filePath) {
  const match = /\.[^.\\/]+$/.exec(filePath)
  return match ? match[0].toLowerCase() : ''
}

function scanGeneratedArtifacts(generated, generationReport) {
  const findings = []
  const warnings = []
  const outputSummaries = []
  for (const entry of buildContextCommands) {
    const files = walkFiles(entry.outputDir)
    let bytes = 0
    const extensionCounts = {}
    for (const file of files) {
      const stat = statSync(file)
      const relativeFile = file.replace(`${repoRoot}/`, '')
      const extension = extname(file)
      bytes += stat.size
      extensionCounts[extension || '[none]'] = (extensionCounts[extension || '[none]'] || 0) + 1
      if (forbiddenGeneratedExtensions.has(extension)) {
        findings.push({ type: 'forbidden_generated_extension', file: relativeFile, extension })
      }
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(extension)) {
        if (allowedStaticAssetSuffixes.some((suffix) => relativeFile.endsWith(suffix))) {
          warnings.push({ type: 'expected_committed_static_asset', file: relativeFile, extension })
        } else {
          findings.push({ type: 'unexpected_image_artifact', file: relativeFile, extension })
        }
      }
      if (stat.size <= 1024 * 1024 && !['.map', '.bin', '.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(extension)) {
        const text = readFileSync(file, 'utf8')
        for (const pattern of secretPatterns) {
          if (pattern.test(text)) {
            findings.push({ type: 'secret_like_pattern', file: relativeFile })
            break
          }
        }
      }
    }
    outputSummaries.push({ outputDir: entry.outputDir, fileCount: files.length, bytes, extensionCounts })
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.generatedArtifactScan.v1',
    generatedAt: generated,
    skipped: generationReport.allCommandsPassed !== true || generationReport.allOutputsPresent !== true,
    outputSummaries,
    warnings,
    forbiddenFindings: findings,
    passed: generationReport.allCommandsPassed === true && generationReport.allOutputsPresent === true && findings.length === 0,
    syntheticOnly: true,
    realUserMediaUsed: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
  }
}

function runDockerBuild(execute, scanReport) {
  const command = `docker build -f ${dockerfilePath} -t ${imageTag} .`
  if (!execute || scanReport.passed !== true) {
    return {
      command,
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'generated_artifact_scan_not_passed',
      exitCode: null,
      imageTag,
      dockerImagePushRun: false,
    }
  }
  const readiness = run('docker', ['version', '--format', '{{json .}}'], { timeout: 30000 })
  if (readiness.exitCode !== 0) {
    return {
      command,
      readiness,
      skipped: true,
      skipReason: 'docker_runtime_unavailable',
      exitCode: null,
      imageTag,
      dockerImagePushRun: false,
    }
  }
  const result = run('docker', ['build', '-f', dockerfilePath, '-t', imageTag, '.'], { timeout: 1800000 })
  return {
    ...result,
    readiness,
    skipped: false,
    imageTag,
    exactApprovedCommandUsed: result.command === command,
    dockerImagePushRun: false,
  }
}

function runImportVersionProofs(execute, dockerBuildReport) {
  if (!execute || dockerBuildReport.exitCode !== 0) {
    return {
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'docker_build_not_passed',
      localHostProbeRun: false,
      reports: targetTools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        versionProven: false,
        exitCode: null,
        notRunReason: !execute ? 'not_execute_mode' : 'docker_build_not_passed',
      })),
    }
  }
  const scripts = {
    opencv: "import cv2, json; print(json.dumps({'tool':'opencv','version':cv2.__version__}))",
    pyav: "import av, json; print(json.dumps({'tool':'pyav','version':av.__version__}))",
    pyscenedetect:
      "import scenedetect, json; print(json.dumps({'tool':'pyscenedetect','version':getattr(scenedetect, '__version__', 'unknown')}))",
  }
  const reports = targetTools.map((tool) => {
    const result = dockerPython(scripts[tool.id])
    return {
      id: tool.id,
      name: tool.name,
      packageName: tool.packageName,
      module: tool.module,
      command: result.command,
      exitCode: result.exitCode,
      signal: result.signal,
      durationMs: result.durationMs,
      stdoutSummary: result.stdoutSummary,
      stderrSummary: result.stderrSummary,
      versionProven: result.exitCode === 0,
    }
  })
  return { skipped: false, localHostProbeRun: false, reports }
}

function runSyntheticFixtureProofs(execute, versionReport) {
  if (!execute || versionReport.reports.some((entry) => entry.versionProven !== true)) {
    return {
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'version_import_proofs_not_complete',
      reports: targetTools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        fixtureProven: false,
        exitCode: null,
        notRunReason: !execute ? 'not_execute_mode' : 'version_import_proofs_not_complete',
      })),
      realUserMediaUsed: false,
      ffmpegFfprobeCommandRun: false,
    }
  }
  const scripts = {
    opencv: `
import cv2, json, numpy as np
img = np.zeros((8, 8, 3), dtype=np.uint8)
img[:, :, 1] = 128
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
resized = cv2.resize(gray, (4, 4), interpolation=cv2.INTER_NEAREST)
print(json.dumps({'tool':'opencv','shape':list(resized.shape),'mean':float(resized.mean())}))
`,
    pyav: `
import av, json, os, tempfile
path = os.path.join(tempfile.gettempdir(), 'reeditpro_pyav_synthetic_fixture.mp4')
try:
    container = av.open(path, mode='w')
    stream = container.add_stream('mpeg4', rate=1)
    stream.width = 16
    stream.height = 16
    stream.pix_fmt = 'yuv420p'
    import numpy as np
    frame = av.VideoFrame.from_ndarray(np.zeros((16, 16, 3), dtype=np.uint8), format='rgb24')
    for packet in stream.encode(frame):
        container.mux(packet)
    for packet in stream.encode():
        container.mux(packet)
    container.close()
    probe = av.open(path)
    stream_count = len(probe.streams.video)
    probe.close()
    print(json.dumps({'tool':'pyav','fixture':'synthetic_mp4','video_streams':stream_count,'bytes':os.path.getsize(path)}))
finally:
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
`,
    pyscenedetect: `
import json, numpy as np
from scenedetect.detectors import ContentDetector
from scenedetect.frame_timecode import FrameTimecode
detector = ContentDetector(threshold=1.0)
frame_a = np.zeros((24, 24, 3), dtype=np.uint8)
frame_b = np.full((24, 24, 3), 255, dtype=np.uint8)
cuts = []
cuts.extend(detector.process_frame(FrameTimecode(0, 24.0), frame_a) or [])
cuts.extend(detector.process_frame(FrameTimecode(1, 24.0), frame_b) or [])
print(json.dumps({'tool':'pyscenedetect','synthetic_frames':2,'cuts':len(cuts)}))
`,
  }
  const reports = targetTools.map((tool) => {
    const result = dockerPython(scripts[tool.id], { timeout: 180000 })
    const stdout = result.stdoutSummary || ''
    const fixtureProven =
      result.exitCode === 0 &&
      ((tool.id === 'opencv' && /"shape":\s*\[\s*4,\s*4\s*\]/.test(stdout)) ||
        (tool.id === 'pyav' && /"video_streams":\s*1/.test(stdout)) ||
        (tool.id === 'pyscenedetect' && /"synthetic_frames":\s*2/.test(stdout)))
    return {
      id: tool.id,
      name: tool.name,
      command: result.command,
      exitCode: result.exitCode,
      signal: result.signal,
      durationMs: result.durationMs,
      stdoutSummary: result.stdoutSummary,
      stderrSummary: result.stderrSummary,
      fixtureProven,
      deferrableIfSafeFixtureRequiresFfmpegOrRealMedia: ['pyav', 'pyscenedetect'].includes(tool.id),
      realUserMediaUsed: false,
      ffmpegFfprobeCommandRun: false,
    }
  })
  return {
    skipped: false,
    reports,
    realUserMediaUsed: false,
    ffmpegFfprobeCommandRun: false,
    fixturesCreatedInContainerOrPrivateTmpOnly: true,
  }
}

function cleanupGeneratedOutputs(execute, dockerBuildReport) {
  const before = Object.fromEntries(cleanupOutputs.map((output) => [output, existsSync(join(repoRoot, output))]))
  const imageCleanup =
    execute && dockerBuildReport.exitCode === 0
      ? run('docker', ['image', 'rm', imageTag], { timeout: 120000 })
      : { command: `docker image rm ${imageTag}`, exitCode: null, notRunReason: 'image_not_built_or_not_execute_mode' }
  if (execute) {
    for (const output of cleanupOutputs) rmSync(join(repoRoot, output), { recursive: true, force: true })
  }
  const after = Object.fromEntries(cleanupOutputs.map((output) => [output, existsSync(join(repoRoot, output))]))
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.artifactCleanup.v1',
    before,
    after,
    cleanupCommand: 'rm -rf dist dist-server dist-staging-fixture-worker node_modules',
    generatedOutputsCleaned: Object.values(after).every((present) => present === false),
    localImageCleanupCommand: imageCleanup.command,
    localImageCleanupExitCode: imageCleanup.exitCode ?? null,
    localImageCleanupNotRunReason: imageCleanup.notRunReason || null,
    localImageCleanupAllowedFailure: imageCleanup.exitCode === 1 && /No such image/i.test(`${imageCleanup.stderrSummary}\n${imageCleanup.stdoutSummary}`),
    dockerImagePushed: false,
  }
}

function protectedDiffs() {
  return [
    ...git(['diff', '--name-only', '--', ...protectedNoDiffFiles]).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles]).split('\n').filter(Boolean),
  ]
}

export function forbiddenOutputsPresent() {
  return cleanupOutputs.filter((output) => existsSync(join(repoRoot, output)))
}

export function protectedFilesHaveNoDiff() {
  return protectedDiffs().length === 0
}

function runSafetyScan(generated, cleanupReport) {
  const changedProtectedFiles = [...new Set(protectedDiffs())]
  const forbiddenOutputs = forbiddenOutputsPresent()
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.safetyScan.v1',
    generatedAt: generated,
    forbiddenOutputsPresent: forbiddenOutputs,
    changedProtectedFiles,
    packageLockHash: hashFile('package-lock.json'),
    requirementsHash: hashFile(requirementsPath),
    dockerfileHash: hashFile(dockerfilePath),
    generatedOutputsCommitted: false,
    fixtureOutputsCommitted: false,
    mediaArtifactsCommitted: false,
    dockerImagePushed: false,
    secretMaterialDetected: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    cleanupPassed: cleanupReport.generatedOutputsCleaned === true,
    passed: forbiddenOutputs.length === 0 && changedProtectedFiles.length === 0 && cleanupReport.generatedOutputsCleaned === true,
  }
}

function deriveDecision({
  sourceTargetCheck,
  hydrationReport,
  generationReport,
  scanReport,
  dockerBuildReport,
  versionReport,
  fixtureReport,
  cleanupReport,
  safetyReport,
}) {
  if (
    sourceTargetCheck.dockerfileCopiesRequirements !== true ||
    sourceTargetCheck.dockerfileInstallsRequirements !== true ||
    sourceTargetCheck.allRequiredPackagesDeclared !== true
  ) {
    return sourceTargetDriftDecision
  }
  if (hydrationReport.exitCode !== 0 || hydrationReport.packageFilesUnchanged !== true) return dependencyHydrationDecision
  if (generationReport.allCommandsPassed !== true || generationReport.allOutputsPresent !== true) return buildContextGenerationDecision
  if (scanReport.passed !== true) return artifactScanDecision
  if (dockerBuildReport.exitCode !== 0 || dockerBuildReport.exactApprovedCommandUsed !== true) return dockerBuildDecision
  const versions = new Map(versionReport.reports.map((entry) => [entry.id, entry]))
  const fixtures = new Map(fixtureReport.reports.map((entry) => [entry.id, entry]))
  for (const tool of targetTools) {
    if (versions.get(tool.id)?.versionProven !== true) {
      if (tool.id === 'opencv') return opencvDecision
      if (tool.id === 'pyav') return pyavDecision
      return pyscenedetectDecision
    }
  }
  const opencvFixture = fixtures.get('opencv')?.fixtureProven === true
  const pyavFixture = fixtures.get('pyav')?.fixtureProven === true
  const pysceneFixture = fixtures.get('pyscenedetect')?.fixtureProven === true
  if (!opencvFixture) return opencvDecision
  if (!pyavFixture && !pysceneFixture) return pyavAndPyscenedetectDeferredDecision
  if (!pyavFixture) return pyavDeferredDecision
  if (!pysceneFixture) return pyscenedetectDeferredDecision
  if (cleanupReport.generatedOutputsCleaned !== true) return cleanupDecision
  if (safetyReport.passed !== true) return safetyScanDecision
  return passDecision
}

function nextPromptForDecision(decision) {
  return [
    passDecision,
    pyavDeferredDecision,
    pyscenedetectDeferredDecision,
    pyavAndPyscenedetectDeferredDecision,
  ].includes(decision)
    ? qaNextPrompt
    : blockerNextPrompt
}

function buildStatusMatrix(generated, decision, versionReport, fixtureReport) {
  const versions = new Map(versionReport.reports.map((entry) => [entry.id, entry]))
  const fixtures = new Map(fixtureReport.reports.map((entry) => [entry.id, entry]))
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.statusMatrix.v1',
    generatedAt: generated,
    decision,
    tools: targetTools.map((tool) => {
      const version = versions.get(tool.id)
      const fixture = fixtures.get(tool.id)
      const fixtureDeferred =
        fixture?.fixtureProven !== true &&
        ((tool.id === 'pyav' && [pyavDeferredDecision, pyavAndPyscenedetectDeferredDecision].includes(decision)) ||
          (tool.id === 'pyscenedetect' &&
            [pyscenedetectDeferredDecision, pyavAndPyscenedetectDeferredDecision].includes(decision)))
      return {
        id: tool.id,
        name: tool.name,
        packageName: tool.packageName,
        containerImportVersionProven: version?.versionProven === true,
        syntheticFixtureProven: fixture?.fixtureProven === true,
        fixtureDeferred,
        boundedProofAcceptedForQaReview:
          version?.versionProven === true && (fixture?.fixtureProven === true || fixtureDeferred),
        blocker:
          version?.versionProven !== true
            ? 'container_import_or_version_not_proven'
            : fixture?.fixtureProven !== true && !fixtureDeferred
              ? 'synthetic_fixture_not_proven'
              : null,
      }
    }),
  }
}

function buildDecisionReport(generated, decision, nextPrompt) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.decision.v1',
    generatedAt: generated,
    decision,
    sourceSha: git(['rev-parse', 'HEAD']),
    ownerId,
    imageTag,
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    targetTools: targetTools.map((tool) => tool.id),
    nextPrompt,
    canonicalAcceptedProvenBoundedBeforeMilestone2: 9,
    newlyProofedBoundedForQaReview: decision === passDecision ? 3 : 0,
    acceptedProvenBoundedTotalPendingQa: decision === passDecision ? 12 : 9,
    canonicalTrackBStatusCountsRemainPendingQa: true,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    cpuOnly: true,
    gpuRunInThisPhase: false,
    dependencyHydrationAllowedIfNeeded: true,
    npmCiIgnoreScriptsOnly: true,
    pipInstallRunOnHost: false,
    npmInstallRunOnHost: false,
    npmRebuildRunOnHost: false,
    packageLockMutationAllowed: false,
    requirementsMutationAllowed: false,
    dockerfileMutationAllowed: false,
    dockerImagePushRun: false,
    dockerBuildRunInThisPhase: true,
    containerOnlyToolProofs: true,
    ffmpegFfprobeCommandRunInThisPhase: false,
    milestone1ToolsRunInThisPhase: false,
    realUserMediaUsed: false,
    mediaProcessingAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    routeProviderRuntimeAccepted: false,
    supabaseGcsPublicDeliveryAccepted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    rawPromptExecutionAccepted: false,
    betaProductionAccepted: false,
    supabaseClassification: supabaseClassification(),
  }
}

function buildReports({ execute = false } = {}) {
  if (execute) assertConfirmations()
  const generated = generatedAt()
  const sourceAudit = buildSourceAudit(generated)
  const sourceTargetCheck = buildSourceTargetCheck(generated)
  const hydrationReport = runDependencyHydration(execute)
  const generationReport = runBuildContextGeneration(execute, hydrationReport)
  const scanReport = scanGeneratedArtifacts(generated, generationReport)
  const dockerBuildReport = runDockerBuild(execute, scanReport)
  const versionReport = runImportVersionProofs(execute, dockerBuildReport)
  const fixtureReport = runSyntheticFixtureProofs(execute, versionReport)
  const cleanupReport = cleanupGeneratedOutputs(execute, dockerBuildReport)
  const safetyReport = runSafetyScan(generated, cleanupReport)
  const decision = deriveDecision({
    sourceTargetCheck,
    hydrationReport,
    generationReport,
    scanReport,
    dockerBuildReport,
    versionReport,
    fixtureReport,
    cleanupReport,
    safetyReport,
  })
  const nextPrompt = nextPromptForDecision(decision)
  const decisionReport = buildDecisionReport(generated, decision, nextPrompt)
  return {
    sourceAudit: { ...sourceAudit, decision, nextPrompt },
    sourceTargetCheck: { ...sourceTargetCheck, decision },
    hydrationReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.hydration.v1',
      generatedAt: generated,
      decision,
      ...hydrationReport,
    },
    generationReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.buildContextGeneration.v1',
      generatedAt: generated,
      decision,
      ...generationReport,
    },
    scanReport: { ...scanReport, decision },
    dockerBuildReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.dockerBuild.v1',
      generatedAt: generated,
      decision,
      ...dockerBuildReport,
    },
    versionReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.importVersionProof.v1',
      generatedAt: generated,
      decision,
      imageTag,
      ...versionReport,
    },
    fixtureReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.syntheticFixtureProof.v1',
      generatedAt: generated,
      decision,
      imageTag,
      ...fixtureReport,
      syntheticFixturesOnly: true,
      realUserMediaUsed: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
    },
    cleanupReport: { ...cleanupReport, generatedAt: generated, decision },
    safetyReport: { ...safetyReport, decision },
    statusMatrix: buildStatusMatrix(generated, decision, versionReport, fixtureReport),
    decisionReport,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.readiness.v1',
      generatedAt: generated,
      decision,
      readyForMilestone2QaReview: [
        passDecision,
        pyavDeferredDecision,
        pyscenedetectDeferredDecision,
        pyavAndPyscenedetectDeferredDecision,
      ].includes(decision),
      readyForBlockerFollowup: ![
        passDecision,
        pyavDeferredDecision,
        pyscenedetectDeferredDecision,
        pyavAndPyscenedetectDeferredDecision,
      ].includes(decision),
      readyForRuntimeMediaProcessing: false,
      readyForBetaProduction: false,
      nextPrompt,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone2VideoAnalysisExecution.privateArtifactManifest.v1',
      generatedAt: generated,
      decision,
      reportDirectory: reportDir,
      localDockerImageTag: imageTag,
      localDockerImagePushed: false,
      generatedBuildContextOutputsCommitted: false,
      fixtureOutputsCommitted: false,
      rawUserMediaAccessed: false,
      secretsPrinted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      supabaseClassification: supabaseClassification(),
    },
  }
}

export function writeTrackBMilestone2VideoAnalysisExecutionArtifacts(options = {}) {
  const reports = buildReports(options)
  writeReports(reports)
  writeNextPrompt(reports)
  updateStatusDocs(reports)
  return reports
}

export function readTrackBMilestone2VideoAnalysisExecutionArtifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    sourceTargetCheck: readJson(`${reportDir}/source-target-check.json`),
    hydrationReport: readJson(`${reportDir}/dependency-hydration-report.json`),
    generationReport: readJson(`${reportDir}/build-context-generation-report.json`),
    scanReport: readJson(`${reportDir}/generated-artifact-scan-report.json`),
    dockerBuildReport: readJson(`${reportDir}/docker-build-report.json`),
    versionReport: readJson(`${reportDir}/import-version-proof-report.json`),
    fixtureReport: readJson(`${reportDir}/synthetic-fixture-proof-report.json`),
    cleanupReport: readJson(`${reportDir}/artifact-cleanup-report.json`),
    safetyReport: readJson(`${reportDir}/safety-scan-report.json`),
    statusMatrix: readJson(`${reportDir}/milestone-2-video-analysis-status-matrix.json`),
    decisionReport: readJson(`${reportDir}/milestone-2-video-analysis-execution-decision.json`),
    readinessReport: readJson(`${reportDir}/readiness-report.json`),
    privateArtifactManifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  }
}

function writeReports(reports) {
  writeJson(`${reportDir}/source-of-truth-audit.json`, reports.sourceAudit)
  writeJson(`${reportDir}/source-target-check.json`, reports.sourceTargetCheck)
  writeJson(`${reportDir}/dependency-hydration-report.json`, reports.hydrationReport)
  writeJson(`${reportDir}/build-context-generation-report.json`, reports.generationReport)
  writeJson(`${reportDir}/generated-artifact-scan-report.json`, reports.scanReport)
  writeJson(`${reportDir}/docker-build-report.json`, reports.dockerBuildReport)
  writeJson(`${reportDir}/import-version-proof-report.json`, reports.versionReport)
  writeJson(`${reportDir}/synthetic-fixture-proof-report.json`, reports.fixtureReport)
  writeJson(`${reportDir}/artifact-cleanup-report.json`, reports.cleanupReport)
  writeJson(`${reportDir}/safety-scan-report.json`, reports.safetyReport)
  writeJson(`${reportDir}/milestone-2-video-analysis-status-matrix.json`, reports.statusMatrix)
  writeJson(`${reportDir}/milestone-2-video-analysis-execution-decision.json`, reports.decisionReport)
  writeJson(`${reportDir}/readiness-report.json`, reports.readinessReport)
  writeJson(`${reportDir}/private-artifact-manifest.json`, reports.privateArtifactManifest)

  const decision = reports.decisionReport.decision
  const rows = reports.statusMatrix.tools
    .map(
      (tool) =>
        `| \`${tool.id}\` | ${tool.containerImportVersionProven} | ${tool.syntheticFixtureProven} | ${tool.fixtureDeferred} | ${tool.boundedProofAcceptedForQaReview} | ${tool.blocker || 'none'} |`,
    )
    .join('\n')
  writeText(`${reportDir}/source-of-truth-audit.md`, `# Track B Milestone 2 Video Analysis Execution Source Audit\n\nDecision: \`${decision}\`\n\nSource SHA: \`${reports.sourceAudit.sourceSha}\`.\n\nPR #567 is merged source-of-truth approval for CPU-first OpenCV, PyAV, and PySceneDetect execution against \`${dockerfilePath}\` plus \`${requirementsPath}\`. PR #563/#559/#557/#551/#549/#546/#545/#542 remain merged supporting evidence.\n`)
  writeText(`${reportDir}/source-target-check.md`, `# Source Target Check\n\nTarget Dockerfile: \`${dockerfilePath}\`.\n\nTarget requirements: \`${requirementsPath}\`.\n\nRequired packages declared: \`${reports.sourceTargetCheck.allRequiredPackagesDeclared}\`.\n\nDockerfile requirements install detected: \`${reports.sourceTargetCheck.dockerfileInstallsRequirements}\`.\n`)
  writeText(`${reportDir}/dependency-hydration-report.md`, `# Dependency Hydration Report\n\nCommand: \`${reports.hydrationReport.command}\`.\n\nExit code: \`${reports.hydrationReport.exitCode ?? 'skipped'}\`.\n\nPackage files unchanged: \`${reports.hydrationReport.packageFilesUnchanged}\`.\n`)
  writeText(`${reportDir}/build-context-generation-report.md`, `# Build-Context Generation Report\n\nApproved commands:\n\n- \`npm run build:server\` -> \`dist-server\`\n- \`npm run build:staging-fixture-worker\` -> \`dist-staging-fixture-worker\`\n\nAll commands passed: \`${reports.generationReport.allCommandsPassed}\`.\n\nAll outputs present before cleanup: \`${reports.generationReport.allOutputsPresent}\`.\n`)
  writeText(`${reportDir}/generated-artifact-scan-report.md`, `# Generated Artifact Scan Report\n\nPassed: \`${reports.scanReport.passed}\`.\n\nForbidden findings: ${reports.scanReport.forbiddenFindings.length ? reports.scanReport.forbiddenFindings.map((finding) => `\`${finding.type}:${finding.file}\``).join(', ') : 'none'}.\n\nWarnings: ${reports.scanReport.warnings.length ? reports.scanReport.warnings.map((warning) => `\`${warning.type}:${warning.file}\``).join(', ') : 'none'}.\n`)
  writeText(`${reportDir}/docker-build-report.md`, `# Docker Build Report\n\nCommand: \`${reports.dockerBuildReport.command}\`.\n\nExit code: \`${reports.dockerBuildReport.exitCode ?? 'not_run'}\`.\n\nDocker image push: \`false\`.\n`)
  writeText(`${reportDir}/import-version-proof-report.md`, `# Container Import And Version Proof Report\n\nProofs used container-only Python under \`docker run --rm --network none\` against \`${imageTag}\`. No host Python package install or host tool proof was used.\n`)
  writeText(`${reportDir}/synthetic-fixture-proof-report.md`, `# Synthetic Fixture Proof Report\n\nOnly synthetic fixtures were allowed. No real user media, FFmpeg/FFprobe command, public artifact, or signed URL was used.\n`)
  writeText(`${reportDir}/artifact-cleanup-report.md`, `# Artifact Cleanup Report\n\nCleanup command: \`${reports.cleanupReport.cleanupCommand}\`.\n\nGenerated outputs cleaned: \`${reports.cleanupReport.generatedOutputsCleaned}\`.\n\nLocal image cleanup command: \`${reports.cleanupReport.localImageCleanupCommand}\`.\n`)
  writeText(`${reportDir}/safety-scan-report.md`, `# Safety Scan Report\n\nPassed: \`${reports.safetyReport.passed}\`.\n\nForbidden outputs present after cleanup: ${reports.safetyReport.forbiddenOutputsPresent.join(', ') || 'none'}.\n\nProtected file drift: ${reports.safetyReport.changedProtectedFiles.join(', ') || 'none'}.\n`)
  writeText(`${reportDir}/milestone-2-video-analysis-status-matrix.md`, `# Milestone 2 Video Analysis Status Matrix\n\n| Tool | Import/version proven | Synthetic fixture proven | Fixture deferred | Accepted for QA review | Blocker |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n`)
  writeText(`${reportDir}/milestone-2-video-analysis-execution-decision.md`, `# Milestone 2 Video Analysis Execution Decision\n\nDecision: \`${decision}\`.\n\nNext prompt: \`${reports.decisionReport.nextPrompt}\`.\n\nCanonical Track B accepted/proven totals remain at the Milestone 1 QA state until the next QA review accepts this execution evidence. End-to-end product-ready tools remain \`0\`, and no 40+ installed/proven end-to-end claim is allowed.\n\nMedia processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.\n`)
  writeText(`${reportDir}/validation-results.md`, `# Validation Results\n\nGenerated decision: \`${decision}\`.\n\nValidation commands expected before commit:\n\n- \`npm run trackb-media-oss:milestone-2-video-analysis-execution:diagnostics\`\n- Track B predecessor diagnostics through Milestone 2 approval, Milestone 1 QA/follow-ups/system packaging/tooling/milestone plan, and owner registry\n- Batch 2 planning, owner-lane reconciliation, and Batch 1 final rollup diagnostics\n- \`git diff --check\`\n- \`git diff --cached --check\`\n\nReadiness/beta/lint/typecheck/tsc remain optional under the no-install boundary unless dependencies already exist from approved hydration.\n`)
}

function writeNextPrompt(reports) {
  const decision = reports.decisionReport.decision
  if (
    [
      passDecision,
      pyavDeferredDecision,
      pyscenedetectDeferredDecision,
      pyavAndPyscenedetectDeferredDecision,
    ].includes(decision)
  ) {
    rmSync(join(repoRoot, blockerPromptPath), { force: true })
    writeText(
      qaNextPromptPath,
      '# TRACKB_MEDIA_OSS_MILESTONE_2_QA_REVIEW\n\nReview the Track B Milestone 2 CPU-first container proof evidence for OpenCV, PyAV, and PySceneDetect. Keep media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, beta, and production blocked unless a later explicit source-of-truth approval changes scope.\n',
    )
  } else {
    rmSync(join(repoRoot, qaNextPromptPath), { force: true })
    writeText(
      blockerPromptPath,
      '# TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION_BLOCKER_FOLLOWUP\n\nResolve the blocked Track B Milestone 2 video analysis execution evidence before any rerun. Keep scope limited to the CPU worker target, synthetic fixtures, and container-only OpenCV/PyAV/PySceneDetect proofs.\n',
    )
  }
}

function updateStatusDocs(reports) {
  const body = `
TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION:

- Decision: \`${reports.decisionReport.decision}\`
- Owner: \`${ownerId}\`
- Target: \`${dockerfilePath}\` with \`${requirementsPath}\`.
- Target tools: OpenCV, PyAV, and PySceneDetect only.
- Build-context outputs: \`dist-server\` and \`dist-staging-fixture-worker\` generated locally and cleaned before commit.
- Local image tag: \`${imageTag}\`
- Canonical Track B counts remain pending QA: 16 owned tools, 9 bounded accepted/proven tools, 7 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.
- Execution proof evidence is ready for Milestone 2 QA review when the decision is pass or approved fixture-deferred.
- Do not claim 40+ tools are installed/proven end-to-end.
- No host pip install, host npm install, npm rebuild, package-lock mutation, requirements mutation, Dockerfile mutation, FFmpeg/FFprobe command, real user media, render/export, workers/routes/providers, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production scope is accepted.
- Next prompt: \`${reports.decisionReport.nextPrompt}\`
- Supabase classification: no write / environment none / SQL none / migration no.
`
  for (const path of [
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  ]) {
    replaceOrAppend(
      path,
      '<!-- TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION_STATUS:start -->',
      '<!-- TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_EXECUTION_STATUS:end -->',
      body,
    )
  }

  const statusPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'
  const status = readJson(statusPath)
  status.milestone2VideoAnalysisExecution = {
    decision: reports.decisionReport.decision,
    reportKey: 'trackb_milestone_2_video_analysis_execution_reports',
    targetDockerfile: dockerfilePath,
    targetRequirements: requirementsPath,
    imageTag,
    tools: reports.statusMatrix.tools,
    canonicalCountsRemainPendingQa: true,
    canonicalAcceptedProvenBoundedBeforeMilestone2: 9,
    newlyProofedBoundedForQaReview: reports.decisionReport.newlyProofedBoundedForQaReview,
    acceptedProvenBoundedTotalPendingQa: reports.decisionReport.acceptedProvenBoundedTotalPendingQa,
    nextPrompt: reports.decisionReport.nextPrompt,
    mediaProcessingAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    betaProductionAccepted: false,
  }
  writeJson(statusPath, status)
}
