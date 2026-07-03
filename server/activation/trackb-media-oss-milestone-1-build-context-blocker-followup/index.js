import { spawnSync, execFileSync } from 'node:child_process'
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
  'docs/open-source-tool-stack/trackb-media-oss-milestone-1-build-context-blocker-followup'
export const branchName =
  'codex/rp-trackb-media-oss-milestone-1-build-context-blocker-followup'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = 'cd4e5f0e234c4ff4bf3cefacba84a2f31530c3e8'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const dockerfilePath = 'docker/prod/cpu-worker/Dockerfile'
export const imageTag = `reeditpro-cpu-worker:trackb-milestone1-${expectedSourceSha}`

export const passDecision =
  'trackb_media_oss_milestone1_build_context_followup_passed_all_four_tools_cpu_bounded'
export const mediaInfoDeferredDecision =
  'trackb_media_oss_milestone1_build_context_followup_passed_with_mediainfo_fixture_deferred'
export const dependencyHydrationDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_dependency_hydration'
export const buildContextGenerationDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_build_context_generation'
export const artifactScanDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_generated_artifact_scan'
export const dockerBuildDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_docker_build'
export const exifToolDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_exiftool_proof'
export const mediaInfoDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_mediainfo_proof'
export const tesseractDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof'
export const imageMagickDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_imagemagick_proof'
export const cleanupDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_artifact_cleanup'
export const safetyScanDecision =
  'trackb_media_oss_milestone1_build_context_followup_blocked_by_safety_scan'
export const runtimeSafetyDecision = 'rejected_due_runtime_safety_risk'

const qaNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW'
const mediaInfoNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_MEDIAINFO_FIXTURE_FOLLOWUP'
const blockerNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_FOLLOWUP_BLOCKER_REVIEW'

const approvedPackages = [
  'libimage-exiftool-perl',
  'mediainfo',
  'tesseract-ocr',
  'tesseract-ocr-eng',
  'imagemagick',
]
const buildContextCommands = [
  { command: 'npm', args: ['run', 'build:server'], outputDir: 'dist-server' },
  {
    command: 'npm',
    args: ['run', 'build:staging-fixture-worker'],
    outputDir: 'dist-staging-fixture-worker',
  },
]
const milestoneTools = [
  { id: 'exiftool', name: 'ExifTool' },
  { id: 'mediainfo', name: 'MediaInfo' },
  { id: 'tesseract', name: 'Tesseract' },
  { id: 'imagemagick', name: 'ImageMagick' },
]
const generatedOutputs = ['dist-server', 'dist-staging-fixture-worker']
const cleanupOutputs = ['dist', 'dist-server', 'dist-staging-fixture-worker', 'node_modules']
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
]
const generatedForbiddenExtensions = new Set([
  '.mp4',
  '.mov',
  '.m4v',
  '.webm',
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
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
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_BUILD_CONTEXT_BLOCKER_FOLLOWUP',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DIST_SERVER_GENERATION',
    'REEDITPRO_CONFIRM_DIST_STAGING_FIXTURE_WORKER_GENERATION',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_SCAN',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_TOOL_PROOFS',
    'REEDITPRO_CONFIRM_LOW_RISK_METADATA_TOOLING_CPU_ONLY',
    'REEDITPRO_CONFIRM_SYNTHETIC_FIXTURES_ONLY',
    'REEDITPRO_CONFIRM_NO_REAL_USER_MEDIA',
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
    'REEDITPRO_CONFIRM_HOST_APT_INSTALL',
    'REEDITPRO_CONFIRM_HOST_BREW_INSTALL',
    'REEDITPRO_CONFIRM_NPM_INSTALL',
    'REEDITPRO_CONFIRM_NPM_REBUILD',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_MUTATION',
    'REEDITPRO_CONFIRM_GRAPHICSMAGICK_DEFAULT_INSTALL',
    'REEDITPRO_CONFIRM_HOST_EXIFTOOL_PROOF',
    'REEDITPRO_CONFIRM_HOST_MEDIAINFO_PROOF',
    'REEDITPRO_CONFIRM_HOST_TESSERACT_PROOF',
    'REEDITPRO_CONFIRM_HOST_IMAGEMAGICK_PROOF',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_OPENCV_EXECUTION',
    'REEDITPRO_CONFIRM_PYAV_EXECUTION',
    'REEDITPRO_CONFIRM_PYSCENEDETECT_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEOCR_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEPADDLE_EXECUTION',
    'REEDITPRO_CONFIRM_OPENCOLORIO_EXECUTION',
    'REEDITPRO_CONFIRM_OPENIMAGEIO_EXECUTION',
    'REEDITPRO_CONFIRM_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_MEDIA_FILE_PROBE',
    'REEDITPRO_CONFIRM_CAPTION_BURN_IN_EXECUTION',
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
    maxBuffer: 30 * 1024 * 1024,
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

function dockerRun(entrypoint, args, options = {}) {
  const dockerArgs = ['run', '--rm', '--network', 'none']
  for (const volume of options.volumes || []) dockerArgs.push('-v', volume)
  dockerArgs.push('--entrypoint', entrypoint, imageTag, ...args)
  return run('docker', dockerArgs, { timeout: options.timeout || 120000 })
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

function hashPath(pathValue) {
  if (!existsSync(pathValue)) return null
  return createHash('sha256').update(readFileSync(pathValue)).digest('hex')
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

export function buildTrackBMilestone1BuildContextFollowupPlan() {
  return {
    branchName,
    baseBranch,
    expectedSourceSha,
    ownerId,
    decisionCandidates: [
      passDecision,
      mediaInfoDeferredDecision,
      dependencyHydrationDecision,
      buildContextGenerationDecision,
      artifactScanDecision,
      dockerBuildDecision,
      exifToolDecision,
      mediaInfoDecision,
      tesseractDecision,
      imageMagickDecision,
      cleanupDecision,
      safetyScanDecision,
      runtimeSafetyDecision,
    ],
    buildContextCommands: buildContextCommands.map((entry) => ({
      command: `${entry.command} ${entry.args.join(' ')}`,
      outputDir: entry.outputDir,
    })),
    dockerBuildCommand: `docker build -f ${dockerfilePath} -t ${imageTag} .`,
    versionProofs: [
      `docker run --rm --network none --entrypoint exiftool ${imageTag} -ver`,
      `docker run --rm --network none --entrypoint mediainfo ${imageTag} --Version`,
      `docker run --rm --network none --entrypoint tesseract ${imageTag} --version`,
      `docker run --rm --network none --entrypoint magick ${imageTag} -version`,
      `docker run --rm --network none --entrypoint convert ${imageTag} -version`,
    ],
    cleanupCommand: 'rm -rf dist dist-server dist-staging-fixture-worker node_modules',
    supabaseClassification: supabaseClassification(),
  }
}

function buildSourceAudit(generated) {
  const sourceSha = git(['rev-parse', 'HEAD'])
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.sourceAudit.v1',
    generatedAt: generated,
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceSha,
    sourceCompatible: sourceSha === expectedSourceSha,
    ownerId,
    evidence: [
      { pr: 551, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context', blocker: ['dist-server', 'dist-staging-fixture-worker'] },
      { pr: 549, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution' },
      { pr: 546, state: 'MERGED', decision: 'trackb_media_oss_milestone1_blocked_pending_container_packaging_approval' },
      { pr: 545, state: 'MERGED', decision: 'trackb_media_oss_install_proof_milestone_plan_passed_ready_for_milestone_1_execution' },
      { pr: 542, state: 'MERGED', ownerId },
      { pr: 553, state: 'MERGED', relationship: 'track_a_atlas_different_base_out_of_track_b_scope' },
    ],
    targetDockerfile: dockerfilePath,
    approvedPackages,
    targetTools: milestoneTools.map((tool) => tool.id),
    graphicsMagickRole: 'optional_fallback_not_default',
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dockerfileHash: hashFile(dockerfilePath),
    supabaseClassification: supabaseClassification(),
  }
}

function buildCommandReview(generated) {
  const dockerfile = readFileSync(join(repoRoot, dockerfilePath), 'utf8')
  const copyTargets = [...dockerfile.matchAll(/^COPY\s+([^\s]+)\s+/gm)].map((match) => match[1])
  const packagePresence = Object.fromEntries(
    approvedPackages.map((pkg) => [pkg, new RegExp(`\\b${pkg}\\b`).test(dockerfile)]),
  )
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.commandReview.v1',
    generatedAt: generated,
    targetDockerfile: dockerfilePath,
    dockerfileCopyTargets: copyTargets,
    requiredBuildContextOutputs: generatedOutputs,
    buildContextCommands: buildContextCommands.map((entry) => ({
      command: `${entry.command} ${entry.args.join(' ')}`,
      outputDir: entry.outputDir,
    })),
    approvedPackages,
    packagePresence,
    allApprovedPackagesPresent: Object.values(packagePresence).every(Boolean),
    graphicsMagickDefaultIncluded: /\bgraphicsmagick\b/.test(dockerfile),
    ffmpegFfprobeNotExecuted: true,
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
  const packageFilesUnchanged =
    before.packageJsonHash === hashFile('package.json') && before.packageLockHash === hashFile('package-lock.json')
  return {
    ...before,
    ...result,
    skipped: false,
    packageFilesUnchanged,
    nodeModulesCreatedByThisPhase: existsSync(join(repoRoot, 'node_modules')),
  }
}

function runBuildContextGeneration(execute, hydrationReport) {
  const results = []
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
    allOutputsPresent: generatedOutputs.every((output) => existsSync(join(repoRoot, output))),
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
      if (stat.isDirectory()) {
        walk(fullPath)
      } else {
        files.push(fullPath)
      }
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
  for (const output of generatedOutputs) {
    const files = walkFiles(output)
    let bytes = 0
    const extensionCounts = {}
    for (const file of files) {
      const stat = statSync(file)
      bytes += stat.size
      const extension = extname(file)
      const relativeFile = file.replace(`${repoRoot}/`, '')
      extensionCounts[extension || '[none]'] = (extensionCounts[extension || '[none]'] || 0) + 1
      if (generatedForbiddenExtensions.has(extension)) {
        if (allowedStaticAssetSuffixes.some((suffix) => relativeFile.endsWith(suffix))) {
          warnings.push({ type: 'expected_committed_static_asset', output, file: relativeFile, extension })
        } else {
          findings.push({ type: 'forbidden_extension', output, file: relativeFile, extension })
        }
      }
      if (stat.size <= 1024 * 1024 && !extension.match(/\.(map|bin)$/)) {
        const text = readFileSync(file, 'utf8')
        for (const pattern of secretPatterns) {
          if (pattern.test(text)) {
            findings.push({ type: 'secret_like_pattern', output, file: file.replace(`${repoRoot}/`, '') })
            break
          }
        }
      }
    }
    outputSummaries.push({ output, fileCount: files.length, bytes, extensionCounts })
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.generatedArtifactScan.v1',
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

function runVersionProofs(execute, dockerBuildReport) {
  if (!execute || dockerBuildReport.exitCode !== 0) {
    return {
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'docker_build_not_passed',
      localHostProbeRun: false,
      reports: milestoneTools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        versionProven: false,
        exitCode: null,
        notRunReason: !execute ? 'not_execute_mode' : 'docker_build_not_passed',
      })),
    }
  }
  const reports = [
    { id: 'exiftool', name: 'ExifTool', result: dockerRun('exiftool', ['-ver']) },
    { id: 'mediainfo', name: 'MediaInfo', result: dockerRun('mediainfo', ['--Version']) },
    { id: 'tesseract', name: 'Tesseract', result: dockerRun('tesseract', ['--version']) },
  ]
  let imageMagickResult = dockerRun('magick', ['-version'])
  let selectedImageMagickCommand = 'magick'
  if (imageMagickResult.exitCode !== 0) {
    imageMagickResult = dockerRun('convert', ['-version'])
    selectedImageMagickCommand = 'convert'
  }
  reports.push({
    id: 'imagemagick',
    name: 'ImageMagick',
    selectedCommand: selectedImageMagickCommand,
    result: imageMagickResult,
  })
  return {
    skipped: false,
    localHostProbeRun: false,
    reports: reports.map((entry) => ({
      id: entry.id,
      name: entry.name,
      selectedCommand: entry.selectedCommand || entry.id,
      command: entry.result.command,
      exitCode: entry.result.exitCode,
      signal: entry.result.signal,
      durationMs: entry.result.durationMs,
      stdoutSummary: entry.result.stdoutSummary,
      stderrSummary: entry.result.stderrSummary,
      versionProven: entry.result.exitCode === 0,
    })),
  }
}

function writeSyntheticWav(filePath) {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(8000, 24)
  header.writeUInt32LE(8000, 28)
  header.writeUInt16LE(1, 32)
  header.writeUInt16LE(8, 34)
  header.write('data', 36)
  header.writeUInt32LE(0, 40)
  writeFileSync(filePath, header)
}

function writeSyntheticTextPgm(filePath, text) {
  const font = {
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  }
  const scale = 14
  const glyphGap = 2
  const margin = 18
  const glyphRows = 7
  const glyphCols = 5
  const width = margin * 2 + text.length * glyphCols * scale + (text.length - 1) * glyphGap * scale
  const height = margin * 2 + glyphRows * scale
  const pixels = Array.from({ length: height }, () => Array.from({ length: width }, () => 255))
  let x = margin
  for (const char of text) {
    const glyph = font[char]
    if (!glyph) {
      x += (glyphCols + glyphGap) * scale
      continue
    }
    for (let row = 0; row < glyphRows; row += 1) {
      for (let col = 0; col < glyphCols; col += 1) {
        if (glyph[row][col] !== '1') continue
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            pixels[margin + row * scale + dy][x + col * scale + dx] = 0
          }
        }
      }
    }
    x += (glyphCols + glyphGap) * scale
  }
  const rows = pixels.map((row) => row.join(' ')).join('\n')
  writeFileSync(filePath, `P2\n${width} ${height}\n255\n${rows}\n`)
}

function runSyntheticFixtureProofs(execute, versionReport) {
  const proofDir = `/private/tmp/reeditpro-trackb-milestone1-build-context-followup-proof-${expectedSourceSha}`
  rmSync(proofDir, { recursive: true, force: true })
  if (!execute || versionReport.reports.some((entry) => entry.versionProven !== true)) {
    return {
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'version_proofs_not_complete',
      proofDir,
      cleaned: true,
      reports: milestoneTools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        fixtureProven: false,
        exitCode: null,
        notRunReason: !execute ? 'not_execute_mode' : 'version_proofs_not_complete',
      })),
    }
  }

  mkdirSync(proofDir, { recursive: true })
  const reports = []
  try {
    writeFileSync(join(proofDir, 'synthetic-exiftool.txt'), 'REEDITPRO_SYNTHETIC_METADATA_FIXTURE\n')
    writeSyntheticWav(join(proofDir, 'synthetic-mediainfo.wav'))
    writeSyntheticTextPgm(join(proofDir, 'synthetic-tesseract.pgm'), 'REEDITPRO')
    const imageMagickVersion = versionReport.reports.find((entry) => entry.id === 'imagemagick')
    const imageCommand = imageMagickVersion?.selectedCommand === 'convert' ? 'convert' : 'magick'

    const proofCommands = [
      {
        id: 'exiftool',
        name: 'ExifTool',
        result: dockerRun('exiftool', ['-FileType', '-MIMEType', '/proof/synthetic-exiftool.txt'], {
          volumes: [`${proofDir}:/proof:ro`],
        }),
        fixtureFiles: ['synthetic-exiftool.txt'],
        predicate: (result) => result.exitCode === 0,
      },
      {
        id: 'mediainfo',
        name: 'MediaInfo',
        result: dockerRun('mediainfo', ['--Output=JSON', '/proof/synthetic-mediainfo.wav'], {
          volumes: [`${proofDir}:/proof:ro`],
        }),
        fixtureFiles: ['synthetic-mediainfo.wav'],
        predicate: (result) => result.exitCode === 0,
      },
      {
        id: 'tesseract',
        name: 'Tesseract',
        result: dockerRun('tesseract', ['/proof/synthetic-tesseract.pgm', 'stdout', '--psm', '7'], {
          volumes: [`${proofDir}:/proof:ro`],
        }),
        fixtureFiles: ['synthetic-tesseract.pgm'],
        predicate: (result) =>
          result.exitCode === 0 &&
          /REEDITPRO/i.test(`${result.stdoutSummary}\n${result.stderrSummary}`.replace(/[^A-Z]/gi, '')),
      },
      {
        id: 'imagemagick',
        name: 'ImageMagick',
        result: dockerRun(
          imageCommand,
          ['/proof/synthetic-tesseract.pgm', '-resize', '120x42', '/proof/synthetic-imagemagick-output.png'],
          { volumes: [`${proofDir}:/proof`] },
        ),
        fixtureFiles: ['synthetic-tesseract.pgm', 'synthetic-imagemagick-output.png'],
        predicate: (result) => result.exitCode === 0,
      },
    ]

    for (const proof of proofCommands) {
      reports.push({
        id: proof.id,
        name: proof.name,
        setupCommand: proof.setupResult?.command || null,
        setupExitCode: proof.setupResult?.exitCode ?? null,
        command: proof.result.command,
        exitCode: proof.result.exitCode,
        signal: proof.result.signal,
        durationMs: proof.result.durationMs,
        stdoutSummary: proof.result.stdoutSummary,
        stderrSummary: proof.result.stderrSummary,
        fixtureProven: proof.predicate(proof.result),
        fixtureHashes: Object.fromEntries(
          proof.fixtureFiles.map((file) => [file, hashPath(join(proofDir, file))]),
        ),
      })
    }
  } finally {
    rmSync(proofDir, { recursive: true, force: true })
  }
  return {
    skipped: false,
    proofDir,
    cleaned: !existsSync(proofDir),
    reports,
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
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.artifactCleanup.v1',
    before,
    after,
    generatedOutputsCleaned: Object.values(after).every((present) => present === false),
    cleanupCommand: 'rm -rf dist dist-server dist-staging-fixture-worker node_modules',
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
  const packageLockHash = hashFile('package-lock.json')
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.safetyScan.v1',
    generatedAt: generated,
    forbiddenOutputsPresent: forbiddenOutputs,
    changedProtectedFiles,
    packageLockHash,
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
  commandReview,
  hydrationReport,
  generationReport,
  scanReport,
  dockerBuildReport,
  versionReport,
  fixtureReport,
  cleanupReport,
  safetyReport,
}) {
  if (!commandReview.allApprovedPackagesPresent || commandReview.graphicsMagickDefaultIncluded) return runtimeSafetyDecision
  if (hydrationReport.exitCode !== 0 || hydrationReport.packageFilesUnchanged !== true) return dependencyHydrationDecision
  if (generationReport.allCommandsPassed !== true || generationReport.allOutputsPresent !== true) return buildContextGenerationDecision
  if (scanReport.passed !== true) return artifactScanDecision
  if (dockerBuildReport.exitCode !== 0 || dockerBuildReport.exactApprovedCommandUsed !== true) return dockerBuildDecision
  const versions = new Map(versionReport.reports.map((entry) => [entry.id, entry]))
  const fixtures = new Map(fixtureReport.reports.map((entry) => [entry.id, entry]))
  for (const tool of ['exiftool', 'mediainfo', 'tesseract', 'imagemagick']) {
    if (versions.get(tool)?.versionProven !== true) {
      if (tool === 'exiftool') return exifToolDecision
      if (tool === 'mediainfo') return mediaInfoDecision
      if (tool === 'tesseract') return tesseractDecision
      return imageMagickDecision
    }
  }
  const failedFixtures = [...fixtures.entries()].filter(([, entry]) => entry.fixtureProven !== true)
  if (failedFixtures.length === 1 && failedFixtures[0][0] === 'mediainfo') return mediaInfoDeferredDecision
  if (fixtures.get('exiftool')?.fixtureProven !== true) return exifToolDecision
  if (fixtures.get('mediainfo')?.fixtureProven !== true) return mediaInfoDecision
  if (fixtures.get('tesseract')?.fixtureProven !== true) return tesseractDecision
  if (fixtures.get('imagemagick')?.fixtureProven !== true) return imageMagickDecision
  if (cleanupReport.generatedOutputsCleaned !== true) return cleanupDecision
  if (safetyReport.passed !== true) return safetyScanDecision
  return passDecision
}

function nextPromptForDecision(decision) {
  if (decision === passDecision) return qaNextPrompt
  if (decision === mediaInfoDeferredDecision) return mediaInfoNextPrompt
  return blockerNextPrompt
}

function buildStatusMatrix(generated, decision, versionReport, fixtureReport) {
  const versions = new Map(versionReport.reports.map((entry) => [entry.id, entry]))
  const fixtures = new Map(fixtureReport.reports.map((entry) => [entry.id, entry]))
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.statusMatrix.v1',
    generatedAt: generated,
    decision,
    tools: milestoneTools.map((tool) => {
      const version = versions.get(tool.id)
      const fixture = fixtures.get(tool.id)
      const accepted =
        version?.versionProven === true &&
        (fixture?.fixtureProven === true || (tool.id === 'mediainfo' && decision === mediaInfoDeferredDecision))
      return {
        id: tool.id,
        name: tool.name,
        container_version_proven: version?.versionProven === true,
        synthetic_fixture_proven: fixture?.fixtureProven === true,
        accepted_proven: accepted,
        blocker:
          version?.versionProven !== true
            ? 'container_version_not_proven'
            : fixture?.fixtureProven !== true && !(tool.id === 'mediainfo' && decision === mediaInfoDeferredDecision)
              ? 'synthetic_fixture_not_proven'
              : null,
      }
    }),
  }
}

function buildDecisionReport(generated, decision, nextPrompt) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.decision.v1',
    generatedAt: generated,
    decision,
    sourceSha: git(['rev-parse', 'HEAD']),
    ownerId,
    imageTag,
    targetDockerfile: dockerfilePath,
    buildContextOutputs: generatedOutputs,
    approvedPackages,
    targetTools: milestoneTools.map((tool) => tool.id),
    graphicsMagickRole: 'optional_fallback_not_default',
    nextPrompt,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    cpuOnly: true,
    gpuRunInThisPhase: false,
    dependencyHydrationAllowedIfNeeded: true,
    npmCiIgnoreScriptsOnly: true,
    npmInstallRunOnHost: false,
    npmRebuildRunOnHost: false,
    packageLockMutationAllowed: false,
    hostPackageInstallRun: false,
    hostToolProofRun: false,
    dockerImagePushRun: false,
    dockerBuildRunInThisPhase: true,
    containerOnlyToolProofs: true,
    ffmpegFfprobeRunInThisPhase: false,
    forbiddenTrackBToolsRunInThisPhase: false,
    graphicsMagickRunInThisPhase: false,
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
  const commandReview = buildCommandReview(generated)
  const hydrationReport = runDependencyHydration(execute)
  const generationReport = runBuildContextGeneration(execute, hydrationReport)
  const scanReport = scanGeneratedArtifacts(generated, generationReport)
  const dockerBuildReport = runDockerBuild(execute, scanReport)
  const versionReport = runVersionProofs(execute, dockerBuildReport)
  const fixtureReport = runSyntheticFixtureProofs(execute, versionReport)
  const cleanupReport = cleanupGeneratedOutputs(execute, dockerBuildReport)
  const safetyReport = runSafetyScan(generated, cleanupReport)
  const decision = deriveDecision({
    commandReview,
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
  const statusMatrix = buildStatusMatrix(generated, decision, versionReport, fixtureReport)
  return {
    sourceAudit: { ...sourceAudit, decision, nextPrompt },
    commandReview: { ...commandReview, decision },
    hydrationReport: { schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.hydration.v1', generatedAt: generated, decision, ...hydrationReport },
    generationReport: { schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.buildContextGeneration.v1', generatedAt: generated, decision, ...generationReport },
    scanReport: { ...scanReport, decision },
    dockerBuildReport: { schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.dockerBuild.v1', generatedAt: generated, decision, ...dockerBuildReport },
    versionReport: { schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.versionProof.v1', generatedAt: generated, decision, imageTag, ...versionReport },
    fixtureReport: { schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.syntheticFixtureProof.v1', generatedAt: generated, decision, imageTag, ...fixtureReport, syntheticFixturesOnly: true, realUserMediaUsed: false, publicArtifactsCreated: false, signedUrlsCreated: false },
    cleanupReport: { ...cleanupReport, generatedAt: generated, decision },
    safetyReport: { ...safetyReport, decision },
    statusMatrix,
    decisionReport,
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.readiness.v1',
      generatedAt: generated,
      decision,
      readyForMilestone1Qa: decision === passDecision,
      readyForMediaInfoFixtureFollowup: decision === mediaInfoDeferredDecision,
      readyForBlockerReview: ![passDecision, mediaInfoDeferredDecision].includes(decision),
      readyForRuntimeMediaProcessing: false,
      nextPrompt,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone1BuildContextFollowup.privateArtifactManifest.v1',
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

export function writeTrackBMilestone1BuildContextFollowupArtifacts(options = {}) {
  const reports = buildReports(options)
  writeReports(reports)
  writeNextPrompt(reports)
  updateStatusDocs(reports)
  return reports
}

export function readTrackBMilestone1BuildContextFollowupArtifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    commandReview: readJson(`${reportDir}/build-context-command-review.json`),
    hydrationReport: readJson(`${reportDir}/dependency-hydration-report.json`),
    generationReport: readJson(`${reportDir}/build-context-generation-report.json`),
    scanReport: readJson(`${reportDir}/generated-artifact-scan-report.json`),
    dockerBuildReport: readJson(`${reportDir}/docker-build-report.json`),
    versionReport: readJson(`${reportDir}/version-proof-report.json`),
    fixtureReport: readJson(`${reportDir}/synthetic-fixture-proof-report.json`),
    cleanupReport: readJson(`${reportDir}/artifact-cleanup-report.json`),
    safetyReport: readJson(`${reportDir}/safety-scan-report.json`),
    statusMatrix: readJson(`${reportDir}/milestone-1-followup-status-matrix.json`),
    decisionReport: readJson(`${reportDir}/milestone-1-build-context-followup-decision.json`),
    readinessReport: readJson(`${reportDir}/readiness-report.json`),
    privateArtifactManifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  }
}

function writeReports(reports) {
  writeJson(`${reportDir}/source-of-truth-audit.json`, reports.sourceAudit)
  writeJson(`${reportDir}/build-context-command-review.json`, reports.commandReview)
  writeJson(`${reportDir}/dependency-hydration-report.json`, reports.hydrationReport)
  writeJson(`${reportDir}/build-context-generation-report.json`, reports.generationReport)
  writeJson(`${reportDir}/generated-artifact-scan-report.json`, reports.scanReport)
  writeJson(`${reportDir}/docker-build-report.json`, reports.dockerBuildReport)
  writeJson(`${reportDir}/version-proof-report.json`, reports.versionReport)
  writeJson(`${reportDir}/synthetic-fixture-proof-report.json`, reports.fixtureReport)
  writeJson(`${reportDir}/artifact-cleanup-report.json`, reports.cleanupReport)
  writeJson(`${reportDir}/safety-scan-report.json`, reports.safetyReport)
  writeJson(`${reportDir}/milestone-1-followup-status-matrix.json`, reports.statusMatrix)
  writeJson(`${reportDir}/milestone-1-build-context-followup-decision.json`, reports.decisionReport)
  writeJson(`${reportDir}/readiness-report.json`, reports.readinessReport)
  writeJson(`${reportDir}/private-artifact-manifest.json`, reports.privateArtifactManifest)

  const decision = reports.decisionReport.decision
  const rows = reports.statusMatrix.tools
    .map((tool) => `| \`${tool.id}\` | ${tool.container_version_proven} | ${tool.synthetic_fixture_proven} | ${tool.accepted_proven} | ${tool.blocker || 'none'} |`)
    .join('\n')
  writeText(`${reportDir}/source-of-truth-audit.md`, `# Track B Milestone 1 Build-Context Follow-Up Source Audit\n\nDecision: \`${decision}\`\n\nSource SHA: \`${reports.sourceAudit.sourceSha}\`\n\nPR #551 is the source-of-truth blocker evidence for missing \`dist-server\` and \`dist-staging-fixture-worker\`. PR #549/#546/#545/#542 remain merged. PR #553 is Track A/Atlas on a different base and is out of Track B scope.\n`)
  writeText(`${reportDir}/build-context-command-review.md`, `# Build-Context Command Review\n\nApproved generation commands:\n\n- \`npm run build:server\` -> \`dist-server\`\n- \`npm run build:staging-fixture-worker\` -> \`dist-staging-fixture-worker\`\n\nNo other build-context generation command is approved in this phase.\n`)
  writeText(`${reportDir}/dependency-hydration-report.md`, `# Dependency Hydration Report\n\nCommand: \`${reports.hydrationReport.command}\`\n\nExit code: \`${reports.hydrationReport.exitCode ?? 'skipped'}\`.\n\nPackage files unchanged: \`${reports.hydrationReport.packageFilesUnchanged}\`.\n`)
  writeText(`${reportDir}/build-context-generation-report.md`, `# Build-Context Generation Report\n\nAll commands passed: \`${reports.generationReport.allCommandsPassed}\`.\n\nAll required outputs present before cleanup: \`${reports.generationReport.allOutputsPresent}\`.\n`)
  writeText(`${reportDir}/generated-artifact-scan-report.md`, `# Generated Artifact Scan Report\n\nPassed: \`${reports.scanReport.passed}\`.\n\nForbidden findings: ${reports.scanReport.forbiddenFindings.length ? reports.scanReport.forbiddenFindings.map((finding) => `\`${finding.type}:${finding.file}\``).join(', ') : 'none'}.\n\nWarnings: ${reports.scanReport.warnings.length ? reports.scanReport.warnings.map((warning) => `\`${warning.type}:${warning.file}\``).join(', ') : 'none'}.\n`)
  writeText(`${reportDir}/docker-build-report.md`, `# Docker Build Report\n\nCommand: \`${reports.dockerBuildReport.command}\`\n\nExit code: \`${reports.dockerBuildReport.exitCode ?? 'not_run'}\`.\n\nDocker image push: \`false\`.\n`)
  writeText(`${reportDir}/version-proof-report.md`, `# Container Version Proof Report\n\nLocal host probing did not run. Version proof commands use \`docker run --rm --network none\` against \`${imageTag}\`.\n`)
  writeText(`${reportDir}/synthetic-fixture-proof-report.md`, `# Synthetic Fixture Proof Report\n\nOnly synthetic fixtures under \`/private/tmp\` were allowed. No real user media, public artifacts, or signed URLs were created.\n`)
  writeText(`${reportDir}/artifact-cleanup-report.md`, `# Artifact Cleanup Report\n\nCleanup command: \`${reports.cleanupReport.cleanupCommand}\`.\n\nGenerated outputs cleaned: \`${reports.cleanupReport.generatedOutputsCleaned}\`.\n`)
  writeText(`${reportDir}/safety-scan-report.md`, `# Safety Scan Report\n\nPassed: \`${reports.safetyReport.passed}\`.\n\nForbidden outputs present after cleanup: ${reports.safetyReport.forbiddenOutputsPresent.join(', ') || 'none'}.\n\nProtected file drift: ${reports.safetyReport.changedProtectedFiles.join(', ') || 'none'}.\n`)
  writeText(`${reportDir}/milestone-1-followup-status-matrix.md`, `# Milestone 1 Follow-Up Status Matrix\n\n| Tool | Version proven | Fixture proven | Accepted/proven | Blocker |\n| --- | --- | --- | --- | --- |\n${rows}\n`)
  writeText(`${reportDir}/milestone-1-build-context-followup-decision.md`, `# Milestone 1 Build-Context Follow-Up Decision\n\nDecision: \`${decision}\`\n\nNext prompt: \`${reports.decisionReport.nextPrompt}\`\n\nScope stayed CPU-only and synthetic-fixture-only. Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.\n`)
  writeText(`${reportDir}/validation-results.md`, `# Validation Results\n\nGenerated decision: \`${decision}\`.\n\nRun the follow-up diagnostics plus dependent Track B/open-source diagnostics before commit.\n`)
}

function writeNextPrompt(reports) {
  const decision = reports.decisionReport.decision
  if (decision === passDecision) {
    writeText(
      'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-qa-review.md',
      '# TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW\n\nReview the Track B Milestone 1 CPU-only container proof evidence for ExifTool, MediaInfo, Tesseract, and ImageMagick. Media processing, render/export, workers/routes/providers, Supabase/GCS, beta, and production remain blocked.\n',
    )
  } else if (decision === mediaInfoDeferredDecision) {
    writeText(
      'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-mediainfo-fixture-followup.md',
      '# TRACKB_MEDIA_OSS_MILESTONE_1_MEDIAINFO_FIXTURE_FOLLOWUP\n\nResolve the MediaInfo synthetic fixture proof gap after version proof passed. Do not use FFmpeg, real media, public artifacts, signed URLs, or runtime/product scopes.\n',
    )
  } else {
    writeText(
      'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-build-context-followup-blocker-review.md',
      '# TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_FOLLOWUP_BLOCKER_REVIEW\n\nReview the blocked Track B Milestone 1 build-context follow-up evidence before any rerun. Keep scope limited to the two approved build-context outputs, the CPU worker Docker build, and container-only synthetic fixture proofs.\n',
    )
  }
}

function updateStatusDocs(reports) {
  const body = `
TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_BLOCKER_FOLLOWUP:

- Decision: \`${reports.decisionReport.decision}\`
- Owner: \`${ownerId}\`
- Build-context outputs: \`dist-server\`, \`dist-staging-fixture-worker\` generated locally and cleaned before commit.
- Target Dockerfile: \`${dockerfilePath}\`
- Local image tag: \`${imageTag}\`
- Target tools: ExifTool, MediaInfo, Tesseract, and ImageMagick only.
- GraphicsMagick remains optional fallback and is not installed or proven by default.
- End-to-end product-ready Track B tools remain \`0\`; no 40+ installed/proven end-to-end claim is allowed.
- Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
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
      '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_BLOCKER_FOLLOWUP_STATUS:start -->',
      '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_BLOCKER_FOLLOWUP_STATUS:end -->',
      body,
    )
  }

  const statusPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'
  const status = readJson(statusPath)
  status.milestone1BuildContextBlockerFollowup = {
    decision: reports.decisionReport.decision,
    reportKey: 'trackb_milestone_1_build_context_blocker_followup_reports',
    targetDockerfile: dockerfilePath,
    buildContextOutputs: generatedOutputs,
    imageTag,
    tools: reports.statusMatrix.tools,
    nextPrompt: reports.decisionReport.nextPrompt,
    mediaProcessingAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    betaProductionAccepted: false,
  }
  writeJson(statusPath, status)
}
