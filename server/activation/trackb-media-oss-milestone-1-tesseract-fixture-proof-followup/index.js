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
  'docs/open-source-tool-stack/trackb-media-oss-milestone-1-tesseract-fixture-proof-followup'
export const branchName =
  'codex/rp-trackb-media-oss-milestone-1-tesseract-fixture-proof-followup'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = '89f920212dfd35f3dece781473df36665073f4b2'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const dockerfilePath = 'docker/prod/cpu-worker/Dockerfile'
export const imageTag = `reeditpro-cpu-worker:trackb-milestone1-tesseract-followup-${expectedSourceSha}`

export const passDecision =
  'trackb_media_oss_milestone1_tesseract_fixture_followup_passed_ready_for_qa'
export const dependencyHydrationDecision =
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_dependency_hydration'
export const buildContextGenerationDecision =
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_build_context_generation'
export const artifactScanDecision =
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_generated_artifact_scan'
export const dockerBuildDecision =
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_docker_build'
export const imageMagickFixtureDecision =
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_imagemagick_fixture_generation'
export const tesseractOutputDecision =
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_tesseract_ocr_output'
export const cleanupDecision =
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_artifact_cleanup'
export const safetyScanDecision =
  'trackb_media_oss_milestone1_tesseract_fixture_followup_blocked_by_safety_scan'
export const runtimeSafetyDecision = 'rejected_due_runtime_safety_risk'

const qaNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW'
const blockerNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_TESSERACT_FIXTURE_FOLLOWUP_BLOCKER_RESOLUTION'
const qaPromptPath = 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-qa-review.md'
const blockerPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-tesseract-fixture-followup-blocker-resolution.md'

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
const buildContextCommands = [
  { command: 'npm', args: ['run', 'build:server'], outputDir: 'dist-server' },
  {
    command: 'npm',
    args: ['run', 'build:staging-fixture-worker'],
    outputDir: 'dist-staging-fixture-worker',
  },
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
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_1_TESSERACT_FIXTURE_PROOF_FOLLOWUP',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_BUILD_CONTEXT_GENERATION_EXECUTION',
    'REEDITPRO_CONFIRM_DIST_SERVER_GENERATION',
    'REEDITPRO_CONFIRM_DIST_STAGING_FIXTURE_WORKER_GENERATION',
    'REEDITPRO_CONFIRM_GENERATED_ARTIFACT_SCAN',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_TESSERACT_PROOF',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_IMAGEMAGICK_FIXTURE_GENERATION',
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
    'REEDITPRO_CONFIRM_GRAPHICSMAGICK_EXECUTION',
    'REEDITPRO_CONFIRM_HOST_EXIFTOOL_PROOF',
    'REEDITPRO_CONFIRM_HOST_MEDIAINFO_PROOF',
    'REEDITPRO_CONFIRM_HOST_TESSERACT_PROOF',
    'REEDITPRO_CONFIRM_HOST_IMAGEMAGICK_PROOF',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_EXIFTOOL_PROOF',
    'REEDITPRO_CONFIRM_CONTAINER_ONLY_MEDIAINFO_PROOF',
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

export function buildTrackBMilestone1TesseractFixtureFollowupPlan() {
  return {
    branchName,
    baseBranch,
    expectedSourceSha,
    ownerId,
    decisionCandidates: [
      passDecision,
      dependencyHydrationDecision,
      buildContextGenerationDecision,
      artifactScanDecision,
      dockerBuildDecision,
      imageMagickFixtureDecision,
      tesseractOutputDecision,
      cleanupDecision,
      safetyScanDecision,
      runtimeSafetyDecision,
    ],
    buildContextCommands: buildContextCommands.map((entry) => ({
      command: `${entry.command} ${entry.args.join(' ')}`,
      outputDir: entry.outputDir,
    })),
    dockerBuildCommand: `docker build -f ${dockerfilePath} -t ${imageTag} .`,
    tesseractProofBoundary:
      'container_only_network_none_synthetic_fixture_exact_REEDITPRO_normalized_output',
    cleanupCommand: 'rm -rf dist dist-server dist-staging-fixture-worker node_modules',
    supabaseClassification: supabaseClassification(),
  }
}

function buildSourceAudit(generated) {
  const sourceSha = git(['rev-parse', 'HEAD'])
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.sourceAudit.v1',
    generatedAt: generated,
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceSha,
    sourceCompatible: sourceSha === expectedSourceSha,
    ownerId,
    evidence: [
      {
        pr: 557,
        state: 'MERGED',
        decision: 'trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof',
        resolved: ['dist-server', 'dist-staging-fixture-worker', 'docker_build', 'exiftool', 'mediainfo', 'imagemagick', 'tesseract_version'],
        blocker: 'tesseract_fixture_output_REEDLTPRU_expected_REEDITPRO',
      },
      { pr: 551, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context' },
      { pr: 549, state: 'MERGED', decision: 'trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution' },
      { pr: 546, state: 'MERGED', decision: 'trackb_media_oss_milestone1_blocked_pending_container_packaging_approval' },
      { pr: 545, state: 'MERGED', decision: 'trackb_media_oss_install_proof_milestone_plan_passed_ready_for_milestone_1_execution' },
      { pr: 542, state: 'MERGED', ownerId },
    ],
    targetDockerfile: dockerfilePath,
    imageTag,
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dockerfileHash: hashFile(dockerfilePath),
    supabaseClassification: supabaseClassification(),
  }
}

function buildImagePolicy(generated) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.imagePolicy.v1',
    generatedAt: generated,
    priorImageAcceptedFromPr557: false,
    reason: 'PR #557 evidence is accepted, but the local image was cleanup-only and must be rebuilt for a bounded Tesseract follow-up.',
    buildContextOutputs: generatedOutputs,
    dockerBuildCommand: `docker build -f ${dockerfilePath} -t ${imageTag} .`,
    imageTag,
    dockerImagePushRun: false,
    deploymentRun: false,
    containerProofsAllowed: ['tesseract', 'imagemagick'],
    containerProofsNotRerun: ['exiftool', 'mediainfo'],
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

function maybeText(file) {
  const buffer = readFileSync(file)
  if (buffer.includes(0) || buffer.length > 1024 * 1024) return null
  return buffer.toString('utf8')
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
      const text = maybeText(file)
      if (text) {
        for (const pattern of secretPatterns) {
          if (pattern.test(text)) {
            findings.push({ type: 'secret_like_pattern', output, file: relativeFile })
            break
          }
        }
      }
    }
    outputSummaries.push({ output, fileCount: files.length, bytes, extensionCounts })
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.generatedArtifactScan.v1',
    generatedAt: generated,
    skipped: generationReport.allCommandsPassed !== true || generationReport.allOutputsPresent !== true,
    outputSummaries,
    warnings,
    forbiddenFindings: findings,
    passed: generationReport.allCommandsPassed === true && generationReport.allOutputsPresent === true && findings.length === 0,
    syntheticOnly: true,
    realUserMediaUsed: false,
  }
}

function runDockerBuild(execute, artifactScanReport) {
  const readiness = run('docker', ['version', '--format', '{{json .}}'], { timeout: 30000 })
  if (!execute || artifactScanReport.passed !== true) {
    return {
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'artifact_scan_not_passed',
      imageTag,
      command: `docker build -f ${dockerfilePath} -t ${imageTag} .`,
      exitCode: null,
      dockerReadiness: readiness,
      buildPassed: false,
    }
  }
  const result = run('docker', ['build', '-f', dockerfilePath, '-t', imageTag, '.'], { timeout: 1800000 })
  return {
    ...result,
    skipped: false,
    imageTag,
    dockerReadiness: readiness,
    buildPassed: result.exitCode === 0,
  }
}

function runVersionSanity(execute, dockerBuildReport) {
  if (!execute || dockerBuildReport.buildPassed !== true) {
    return {
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'docker_build_not_passed',
      localHostProbeRun: false,
      reports: [
        { id: 'tesseract', versionProven: false },
        { id: 'imagemagick', versionProven: false },
      ],
    }
  }
  const tesseract = dockerRun('tesseract', ['--version'])
  let imageMagick = dockerRun('magick', ['-version'])
  let selectedImageMagickCommand = 'magick'
  if (imageMagick.exitCode !== 0) {
    imageMagick = dockerRun('convert', ['-version'])
    selectedImageMagickCommand = 'convert'
  }
  return {
    skipped: false,
    localHostProbeRun: false,
    reports: [
      {
        id: 'tesseract',
        selectedCommand: 'tesseract',
        ...tesseract,
        versionProven: tesseract.exitCode === 0,
      },
      {
        id: 'imagemagick',
        selectedCommand: selectedImageMagickCommand,
        ...imageMagick,
        versionProven: imageMagick.exitCode === 0,
      },
    ],
  }
}

function normalizeOcr(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z]/g, '')
}

function runTesseractFixtureProof(execute, versionReport) {
  const proofDir = `/private/tmp/reeditpro-trackb-milestone1-tesseract-followup-proof-${expectedSourceSha}`
  rmSync(proofDir, { recursive: true, force: true })
  mkdirSync(proofDir, { recursive: true })
  const versionReady =
    versionReport.reports?.find((entry) => entry.id === 'tesseract')?.versionProven === true &&
    versionReport.reports?.find((entry) => entry.id === 'imagemagick')?.versionProven === true
  if (!execute || !versionReady) {
    return {
      skipped: true,
      skipReason: !execute ? 'not_execute_mode' : 'version_sanity_not_ready',
      proofDir,
      cleaned: false,
      syntheticFixturesOnly: true,
      realUserMediaUsed: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      imageMagickFixtureGenerationPassed: false,
      tesseractFixtureProven: false,
      acceptedVariant: null,
      variants: [],
    }
  }

  const imageCommand =
    versionReport.reports.find((entry) => entry.id === 'imagemagick')?.selectedCommand === 'magick'
      ? 'magick'
      : 'convert'
  const variants = [
    {
      id: 'dejavu_sans_bold_large_psm7',
      output: 'reeditpro-dejavu-bold.png',
      setupArgs: [
        '-size',
        '1400x360',
        'xc:white',
        '-gravity',
        'center',
        '-font',
        'DejaVu-Sans-Bold',
        '-pointsize',
        '180',
        '-fill',
        'black',
        '-annotate',
        '+0+0',
        'REEDITPRO',
        '-colorspace',
        'Gray',
        '-threshold',
        '55%',
        '/proof/reeditpro-dejavu-bold.png',
      ],
      tesseractArgs: ['/proof/reeditpro-dejavu-bold.png', 'stdout', '-l', 'eng', '--psm', '7'],
    },
    {
      id: 'default_label_large_psm7',
      output: 'reeditpro-label.png',
      setupArgs: [
        '-background',
        'white',
        '-fill',
        'black',
        '-pointsize',
        '190',
        'label:REEDITPRO',
        '-bordercolor',
        'white',
        '-border',
        '90x90',
        '-resize',
        '1500x380',
        '-gravity',
        'center',
        '-extent',
        '1500x380',
        '-colorspace',
        'Gray',
        '-threshold',
        '55%',
        '/proof/reeditpro-label.png',
      ],
      tesseractArgs: ['/proof/reeditpro-label.png', 'stdout', '-l', 'eng', '--psm', '7'],
    },
    {
      id: 'dejavu_sans_bold_tall_psm6',
      output: 'reeditpro-tall.png',
      setupArgs: [
        '-size',
        '1800x480',
        'xc:white',
        '-gravity',
        'center',
        '-font',
        'DejaVu-Sans-Bold',
        '-pointsize',
        '220',
        '-fill',
        'black',
        '-annotate',
        '+0+0',
        'REEDITPRO',
        '-colorspace',
        'Gray',
        '-threshold',
        '60%',
        '/proof/reeditpro-tall.png',
      ],
      tesseractArgs: ['/proof/reeditpro-tall.png', 'stdout', '-l', 'eng', '--psm', '6'],
    },
  ]
  const reports = []
  let acceptedVariant = null
  for (const variant of variants) {
    const setup = dockerRun(imageCommand, variant.setupArgs, {
      volumes: [`${proofDir}:/proof`],
      timeout: 120000,
    })
    let tesseract = null
    let normalizedOutput = ''
    let exactMatch = false
    if (setup.exitCode === 0) {
      tesseract = dockerRun('tesseract', variant.tesseractArgs, {
        volumes: [`${proofDir}:/proof:ro`],
        timeout: 120000,
      })
      normalizedOutput = normalizeOcr(tesseract.stdoutSummary)
      exactMatch = tesseract.exitCode === 0 && normalizedOutput === 'REEDITPRO'
    }
    const report = {
      id: variant.id,
      imageCommand,
      setupCommand: `docker run --rm --network none -v ${proofDir}:/proof --entrypoint ${imageCommand} ${imageTag} ${variant.setupArgs.join(' ')}`,
      setup,
      tesseractCommand:
        setup.exitCode === 0
          ? `docker run --rm --network none -v ${proofDir}:/proof:ro --entrypoint tesseract ${imageTag} ${variant.tesseractArgs.join(' ')}`
          : null,
      tesseract,
      expectedNormalizedOutput: 'REEDITPRO',
      normalizedOutput,
      exactMatch,
      fixtureHashes: existsSync(join(proofDir, variant.output))
        ? { [variant.output]: hashPath(join(proofDir, variant.output)) }
        : {},
    }
    reports.push(report)
    if (exactMatch) {
      acceptedVariant = variant.id
      break
    }
  }
  return {
    skipped: false,
    proofDir,
    cleaned: false,
    syntheticFixturesOnly: true,
    realUserMediaUsed: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    priorRejectedOutput: 'REEDLTPRU',
    acceptedVariant,
    imageMagickFixtureGenerationPassed: reports.some((entry) => entry.setup?.exitCode === 0),
    tesseractFixtureProven: acceptedVariant !== null,
    variants: reports,
  }
}

function runArtifactCleanup(generated, fixtureReport) {
  const proofDir = fixtureReport.proofDir
  const cleanupResults = []
  for (const output of cleanupOutputs) {
    rmSync(join(repoRoot, output), { recursive: true, force: true })
    cleanupResults.push({ path: output, existsAfter: existsSync(join(repoRoot, output)) })
  }
  if (proofDir) {
    rmSync(proofDir, { recursive: true, force: true })
    cleanupResults.push({ path: proofDir, existsAfter: existsSync(proofDir) })
  }
  const imageCleanup = run('docker', ['image', 'rm', imageTag], { timeout: 120000 })
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.cleanup.v1',
    generatedAt: generated,
    cleanupCommand: 'rm -rf dist dist-server dist-staging-fixture-worker node_modules',
    cleanupResults,
    generatedOutputsCleaned: cleanupResults.every((entry) => entry.existsAfter === false),
    imageCleanup,
    imageCleanupRequiredToPass: false,
    dockerImagePushed: false,
  }
}

export function protectedFilesHaveNoDiff() {
  const unstaged = git(['diff', '--name-only', '--', ...protectedNoDiffFiles])
  const staged = git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles])
  return unstaged === '' && staged === ''
}

export function forbiddenOutputsPresent() {
  return ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']
    .filter((output) => existsSync(join(repoRoot, output)))
}

function runSafetyScan(generated) {
  const findings = []
  const forbiddenOutputs = forbiddenOutputsPresent()
  for (const output of forbiddenOutputs) findings.push({ type: 'forbidden_output_present', output })
  if (!protectedFilesHaveNoDiff()) findings.push({ type: 'protected_file_mutation' })
  const changed = [
    ...git(['diff', '--name-only']).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean),
  ]
  for (const file of new Set(changed)) {
    const fullPath = join(repoRoot, file)
    if (!existsSync(fullPath) || !statSync(fullPath).isFile()) continue
    const text = maybeText(fullPath)
    if (!text) continue
    for (const pattern of secretPatterns) {
      if (pattern.test(text)) {
        findings.push({ type: 'secret_like_pattern', file })
        break
      }
    }
  }
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.safetyScan.v1',
    generatedAt: generated,
    findings,
    passed: findings.length === 0,
    generatedOutputsCommitted: false,
    fixtureOutputsCommitted: false,
    packageLockMutated: false,
    dockerfileMutated: false,
    dockerignoreMutated: false,
    realUserMediaUsed: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    supabaseClassification: supabaseClassification(),
  }
}

function decide(reports) {
  if (reports.hydrationReport.exitCode !== 0 || reports.hydrationReport.packageFilesUnchanged !== true) return dependencyHydrationDecision
  if (reports.generationReport.allCommandsPassed !== true || reports.generationReport.allOutputsPresent !== true) return buildContextGenerationDecision
  if (reports.artifactScanReport.passed !== true) return artifactScanDecision
  if (reports.dockerBuildReport.buildPassed !== true) return dockerBuildDecision
  if (reports.fixtureReport.imageMagickFixtureGenerationPassed !== true) return imageMagickFixtureDecision
  if (reports.fixtureReport.tesseractFixtureProven !== true) return tesseractOutputDecision
  if (reports.cleanupReport.generatedOutputsCleaned !== true) return cleanupDecision
  if (reports.safetyScanReport.passed !== true) return safetyScanDecision
  return passDecision
}

function buildStatusMatrix(generated, decision, versionReport, fixtureReport) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.statusMatrix.v1',
    generatedAt: generated,
    decision,
    tools: [
      {
        id: 'exiftool',
        acceptedFromPr557: true,
        rerunInThisPhase: false,
        accepted_proven: true,
        blocker: null,
      },
      {
        id: 'mediainfo',
        acceptedFromPr557: true,
        rerunInThisPhase: false,
        accepted_proven: true,
        blocker: null,
      },
      {
        id: 'imagemagick',
        acceptedFromPr557: true,
        version_sanity_rerun: versionReport.reports?.find((entry) => entry.id === 'imagemagick')?.versionProven === true,
        fixture_generation_for_tesseract: fixtureReport.imageMagickFixtureGenerationPassed === true,
        accepted_proven: true,
        blocker: null,
      },
      {
        id: 'tesseract',
        acceptedFromPr557Version: true,
        version_sanity_rerun: versionReport.reports?.find((entry) => entry.id === 'tesseract')?.versionProven === true,
        synthetic_fixture_proven: fixtureReport.tesseractFixtureProven === true,
        accepted_proven: fixtureReport.tesseractFixtureProven === true,
        acceptedVariant: fixtureReport.acceptedVariant,
        blocker: fixtureReport.tesseractFixtureProven === true ? null : 'synthetic_fixture_not_proven',
      },
    ],
    milestone1QaReady: decision === passDecision,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
  }
}

function buildDecisionReport(generated, decision, statusMatrix) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.decision.v1',
    generatedAt: generated,
    decision,
    sourceSha: git(['rev-parse', 'HEAD']),
    ownerId,
    imageTag,
    targetDockerfile: dockerfilePath,
    priorPr557Decision: 'trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof',
    priorPr557RejectedOutput: 'REEDLTPRU',
    expectedNormalizedOutput: 'REEDITPRO',
    acceptedVariant: statusMatrix.tools.find((entry) => entry.id === 'tesseract')?.acceptedVariant || null,
    nextPrompt: decision === passDecision ? qaNextPrompt : blockerNextPrompt,
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
    containerOnlyTesseractProof: true,
    containerOnlyImageMagickFixtureGeneration: true,
    exifToolRerunInThisPhase: false,
    mediaInfoRerunInThisPhase: false,
    graphicsMagickRunInThisPhase: false,
    ffmpegFfprobeRunInThisPhase: false,
    forbiddenTrackBToolsRunInThisPhase: false,
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

function markdownReport(title, lines) {
  return `# ${title}\n\n${lines.join('\n')}\n`
}

function writeReportSet(reports) {
  const {
    sourceAudit,
    imagePolicy,
    hydrationReport,
    generationReport,
    artifactScanReport,
    dockerBuildReport,
    versionReport,
    fixtureReport,
    cleanupReport,
    safetyScanReport,
    statusMatrix,
    decisionReport,
    readinessReport,
    manifestReport,
  } = reports
  const reportPairs = [
    ['source-of-truth-audit', sourceAudit, markdownReport('Source Of Truth Audit', [
      `Decision: \`${decisionReport.decision}\`.`,
      `Source SHA: \`${sourceAudit.sourceSha}\`.`,
      'PR #557 is merged and supplies the prior bounded Track B evidence; only Tesseract fixture proof is rerun here.',
    ])],
    ['build-context-and-image-policy', imagePolicy, markdownReport('Build Context And Image Policy', [
      `Image tag: \`${imageTag}\`.`,
      'The local image is rebuilt only for container-only Tesseract/ImageMagick proof. No image push or deployment is allowed.',
    ])],
    ['dependency-hydration-report', hydrationReport, markdownReport('Dependency Hydration Report', [
      `Command: \`${hydrationReport.command}\`.`,
      `Exit code: \`${hydrationReport.exitCode}\`.`,
      `Package files unchanged: \`${hydrationReport.packageFilesUnchanged}\`.`,
    ])],
    ['build-context-generation-report', generationReport, markdownReport('Build Context Generation Report', [
      `All commands passed: \`${generationReport.allCommandsPassed}\`.`,
      `Outputs present before cleanup: \`${generationReport.allOutputsPresent}\`.`,
    ])],
    ['generated-artifact-scan-report', artifactScanReport, markdownReport('Generated Artifact Scan Report', [
      `Passed: \`${artifactScanReport.passed}\`.`,
      `Forbidden findings: \`${artifactScanReport.forbiddenFindings.length}\`.`,
    ])],
    ['docker-build-report', dockerBuildReport, markdownReport('Docker Build Report', [
      `Command: \`docker build -f ${dockerfilePath} -t ${imageTag} .\`.`,
      `Build passed: \`${dockerBuildReport.buildPassed}\`.`,
      `Exit code: \`${dockerBuildReport.exitCode}\`.`,
    ])],
    ['version-sanity-report', versionReport, markdownReport('Version Sanity Report', [
      'Container-only `--network none` Tesseract and ImageMagick version sanity commands were allowed.',
      `Local host probing: \`${versionReport.localHostProbeRun}\`.`,
    ])],
    ['tesseract-fixture-proof-report', fixtureReport, markdownReport('Tesseract Fixture Proof Report', [
      `Accepted variant: \`${fixtureReport.acceptedVariant || 'none'}\`.`,
      `Tesseract fixture proven: \`${fixtureReport.tesseractFixtureProven}\`.`,
      'Acceptance requires normalized OCR output exactly equal to `REEDITPRO`.',
    ])],
    ['artifact-cleanup-report', cleanupReport, markdownReport('Artifact Cleanup Report', [
      `Generated outputs cleaned: \`${cleanupReport.generatedOutputsCleaned}\`.`,
      'Docker image cleanup is report-only unless an image push or unrelated image mutation occurs.',
    ])],
    ['safety-scan-report', safetyScanReport, markdownReport('Safety Scan Report', [
      `Passed: \`${safetyScanReport.passed}\`.`,
      `Findings: \`${safetyScanReport.findings.length}\`.`,
    ])],
    ['tesseract-followup-status-matrix', statusMatrix, markdownReport('Tesseract Follow-Up Status Matrix', [
      `Milestone 1 QA ready: \`${statusMatrix.milestone1QaReady}\`.`,
      '| Tool | Accepted | Rerun scope | Blocker |',
      '| --- | --- | --- | --- |',
      ...statusMatrix.tools.map((tool) => `| \`${tool.id}\` | ${tool.accepted_proven} | ${tool.rerunInThisPhase === false ? 'not rerun' : 'tesseract follow-up'} | ${tool.blocker || 'none'} |`),
    ])],
    ['tesseract-fixture-followup-decision', decisionReport, markdownReport('Tesseract Fixture Follow-Up Decision', [
      `Decision: \`${decisionReport.decision}\`.`,
      `Next prompt: \`${decisionReport.nextPrompt}\`.`,
      'Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.',
    ])],
    ['readiness-report', readinessReport, null],
    ['private-artifact-manifest', manifestReport, null],
  ]
  for (const [name, json, md] of reportPairs) {
    writeJson(`${reportDir}/${name}.json`, json)
    if (md) writeText(`${reportDir}/${name}.md`, md)
  }
  writeText(`${reportDir}/validation-results.md`, markdownReport('Validation Results', [
    `Generated decision: \`${decisionReport.decision}\`.`,
    '- Build contexts were generated, scanned, and cleaned before commit.',
    '- Docker build was local-only and image cleanup was attempted.',
    '- Only container-only Tesseract/ImageMagick follow-up proof was run.',
    '- ExifTool and MediaInfo proof evidence remains accepted from PR #557 and was not rerun.',
    '- Dependency-backed readiness/beta/lint/typecheck/tsc commands are skipped after cleanup when `node_modules` is absent, per no-install validation boundary.',
    '- Supabase classification: no write / none / none / no.',
  ]))
}

function writeNextPrompt(decision) {
  if (decision === passDecision) {
    writeText(
      qaPromptPath,
      `# Track B Media OSS Milestone 1 QA Review\n\nReview the bounded Track B Milestone 1 evidence after the Tesseract fixture follow-up passed. Keep media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production blocked.\n`,
    )
    return
  }
  writeText(
    blockerPromptPath,
    `# Track B Media OSS Milestone 1 Tesseract Fixture Follow-Up Blocker Resolution\n\nResolve the exact blocker recorded by the Tesseract fixture follow-up packet before any QA review. Do not widen scope beyond CPU-only synthetic fixture proof.\n`,
  )
}

function updateStatusDocs(decisionReport, statusMatrix) {
  const block = [
    `Decision: \`${decisionReport.decision}\`.`,
    `Next prompt: \`${decisionReport.nextPrompt}\`.`,
    'PR #557 evidence remains accepted for ExifTool, MediaInfo, ImageMagick, Docker build, build-context generation, and Tesseract version proof.',
    `Tesseract fixture proof accepted variant: \`${decisionReport.acceptedVariant || 'none'}\`.`,
    'Track B end-to-end product-ready tools remain `0`; do not claim 40+ tools are installed/proven end-to-end.',
    'Supabase classification: no write / none / none / no.',
  ].join('\n')
  for (const file of [
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
    'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
    'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
    'docs/cross-chat/CURRENT_HANDOFF.md',
    'docs/cross-chat/NEXT_UNLOCK_LANES.md',
    'docs/cross-chat/BLOCKED_SCOPES.md',
  ]) {
    if (existsSync(join(repoRoot, file))) {
      replaceOrAppend(
        file,
        '<!-- TRACKB_MILESTONE_1_TESSERACT_FIXTURE_FOLLOWUP_STATUS:start -->',
        '<!-- TRACKB_MILESTONE_1_TESSERACT_FIXTURE_FOLLOWUP_STATUS:end -->',
        block,
      )
    }
  }
  const statusJsonPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'
  if (existsSync(join(repoRoot, statusJsonPath))) {
    const status = readJson(statusJsonPath)
    status.milestone1TesseractFixtureFollowup = {
      decision: decisionReport.decision,
      reportKey: 'trackb_milestone_1_tesseract_fixture_followup_reports',
      imageTag,
      priorPr557Decision: decisionReport.priorPr557Decision,
      priorRejectedOutput: decisionReport.priorPr557RejectedOutput,
      expectedNormalizedOutput: decisionReport.expectedNormalizedOutput,
      acceptedVariant: decisionReport.acceptedVariant,
      tools: statusMatrix.tools,
      nextPrompt: decisionReport.nextPrompt,
      mediaProcessingAccepted: false,
      renderExportAccepted: false,
      workerRuntimeAccepted: false,
      betaProductionAccepted: false,
    }
    writeJson(statusJsonPath, status)
  }
}

export function writeTrackBMilestone1TesseractFixtureFollowupArtifacts({ execute = false } = {}) {
  if (execute) assertConfirmations()
  const generated = generatedAt()
  const sourceAudit = buildSourceAudit(generated)
  const imagePolicy = buildImagePolicy(generated)
  const hydrationCore = runDependencyHydration(execute)
  const generationCore = runBuildContextGeneration(execute, hydrationCore)
  const artifactScanReport = scanGeneratedArtifacts(generated, generationCore)
  const dockerBuildCore = runDockerBuild(execute, artifactScanReport)
  const versionCore = runVersionSanity(execute, dockerBuildCore)
  const fixtureCore = runTesseractFixtureProof(execute, versionCore)
  const cleanupReport = runArtifactCleanup(generated, fixtureCore)
  const safetyScanReport = runSafetyScan(generated)
  const draftReports = {
    hydrationReport: hydrationCore,
    generationReport: generationCore,
    artifactScanReport,
    dockerBuildReport: dockerBuildCore,
    fixtureReport: fixtureCore,
    cleanupReport,
    safetyScanReport,
  }
  const decision = decide(draftReports)
  const hydrationReport = { schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.dependencyHydration.v1', generatedAt: generated, decision, ...hydrationCore }
  const generationReport = { schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.buildContextGeneration.v1', generatedAt: generated, decision, ...generationCore }
  const dockerBuildReport = { schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.dockerBuild.v1', generatedAt: generated, decision, ...dockerBuildCore }
  const versionReport = { schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.versionSanity.v1', generatedAt: generated, decision, imageTag, ...versionCore }
  const fixtureReport = { schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.tesseractFixtureProof.v1', generatedAt: generated, decision, imageTag, ...fixtureCore, cleaned: !existsSync(fixtureCore.proofDir) }
  const statusMatrix = buildStatusMatrix(generated, decision, versionReport, fixtureReport)
  const decisionReport = buildDecisionReport(generated, decision, statusMatrix)
  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.readiness.v1',
    generatedAt: generated,
    decision,
    readyForQa: decision === passDecision,
    nextPrompt: decisionReport.nextPrompt,
    blockedScopesRemainBlocked: true,
  }
  const manifestReport = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1TesseractFixtureFollowup.privateManifest.v1',
    generatedAt: generated,
    decision,
    reportsDirectory: reportDir,
    generatedBuildContextOutputsCommitted: false,
    fixtureOutputsCommitted: false,
    localDockerImagePushed: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
  }
  const reports = {
    sourceAudit: { ...sourceAudit, decision },
    imagePolicy: { ...imagePolicy, decision },
    hydrationReport,
    generationReport,
    artifactScanReport: { ...artifactScanReport, decision },
    dockerBuildReport,
    versionReport,
    fixtureReport,
    cleanupReport: { ...cleanupReport, decision },
    safetyScanReport: { ...safetyScanReport, decision },
    statusMatrix,
    decisionReport,
    readinessReport,
    manifestReport,
  }
  writeReportSet(reports)
  writeNextPrompt(decision)
  updateStatusDocs(decisionReport, statusMatrix)
  return reports
}

export function readTrackBMilestone1TesseractFixtureFollowupArtifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    imagePolicy: readJson(`${reportDir}/build-context-and-image-policy.json`),
    hydrationReport: readJson(`${reportDir}/dependency-hydration-report.json`),
    generationReport: readJson(`${reportDir}/build-context-generation-report.json`),
    artifactScanReport: readJson(`${reportDir}/generated-artifact-scan-report.json`),
    dockerBuildReport: readJson(`${reportDir}/docker-build-report.json`),
    versionReport: readJson(`${reportDir}/version-sanity-report.json`),
    fixtureReport: readJson(`${reportDir}/tesseract-fixture-proof-report.json`),
    cleanupReport: readJson(`${reportDir}/artifact-cleanup-report.json`),
    safetyScanReport: readJson(`${reportDir}/safety-scan-report.json`),
    statusMatrix: readJson(`${reportDir}/tesseract-followup-status-matrix.json`),
    decisionReport: readJson(`${reportDir}/tesseract-fixture-followup-decision.json`),
    readinessReport: readJson(`${reportDir}/readiness-report.json`),
    manifestReport: readJson(`${reportDir}/private-artifact-manifest.json`),
  }
}
