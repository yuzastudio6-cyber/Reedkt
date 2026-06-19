import { spawnSync, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(__filename), '..', '..', '..')

export const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-1-system-packaging-execution'
export const branchName =
  'codex/rp-trackb-media-oss-milestone-1-system-packaging-execution'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = '7dcdebdcd979de9072c2fb89223dc9f4f6647585'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const dockerfilePath = 'docker/prod/cpu-worker/Dockerfile'
export const passDecision =
  'trackb_media_oss_milestone1_system_packaging_execution_passed_all_four_tools_cpu_bounded'
export const mediaInfoDeferredDecision =
  'trackb_media_oss_milestone1_system_packaging_execution_passed_with_mediainfo_fixture_deferred'
export const dockerRuntimeDecision =
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_runtime_availability'
export const dockerBuildContextDecision =
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context'
export const dockerBuildDecision =
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build'
export const artifactSafetyDecision =
  'trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_artifact_safety_review'
export const runtimeSafetyDecision = 'rejected_due_runtime_safety_risk'

const qaNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW'
const mediaInfoNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_MEDIAINFO_FIXTURE_FOLLOWUP'
const blockerNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_BLOCKER_FOLLOWUP'
const buildContextNextPrompt =
  'TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_BUILD_CONTEXT_BLOCKER_FOLLOWUP'

const approvedPackages = [
  'libimage-exiftool-perl',
  'mediainfo',
  'tesseract-ocr',
  'tesseract-ocr-eng',
  'imagemagick',
]
const milestoneTools = [
  { id: 'exiftool', name: 'ExifTool', versionArgs: ['exiftool', '-ver'] },
  { id: 'mediainfo', name: 'MediaInfo', versionArgs: ['mediainfo', '--Version'] },
  { id: 'tesseract', name: 'Tesseract', versionArgs: ['tesseract', '--version'] },
  { id: 'imagemagick', name: 'ImageMagick', versionArgs: ['magick', '-version'] },
]
const requiredBuildContext = ['dist-server', 'dist-staging-fixture-worker']
const forbiddenOutputs = [
  'node_modules',
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
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
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_SYSTEM_PACKAGING_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_CPU_WORKER_DOCKERFILE_PATCH_ONLY',
    'REEDITPRO_CONFIRM_DOCKER_BUILD_EXACT_APPROVED_COMMAND',
    'REEDITPRO_CONFIRM_CONTAINER_VERSION_PROOF_ONLY',
    'REEDITPRO_CONFIRM_CPU_ONLY_SYNTHETIC_FIXTURES_ONLY',
    'REEDITPRO_CONFIRM_NO_HOST_PACKAGE_INSTALL',
    'REEDITPRO_CONFIRM_NO_PACKAGE_LOCK_MUTATION',
    'REEDITPRO_CONFIRM_NO_FFMPEG_FFPROBE',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_SUPABASE_MUTATION',
    'REEDITPRO_CONFIRM_NO_DOCKER_IMAGE_PUSH',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_HOST_APT_INSTALL',
    'REEDITPRO_CONFIRM_HOST_BREW_INSTALL',
    'REEDITPRO_CONFIRM_NPM_CI',
    'REEDITPRO_CONFIRM_NPM_INSTALL',
    'REEDITPRO_CONFIRM_NPM_REBUILD',
    'REEDITPRO_CONFIRM_PACKAGE_LOCK_MUTATION',
    'REEDITPRO_CONFIRM_GRAPHICSMAGICK_DEFAULT_INSTALL',
    'REEDITPRO_CONFIRM_FFMPEG_VERSION_PROBE',
    'REEDITPRO_CONFIRM_FFPROBE_VERSION_PROBE',
    'REEDITPRO_CONFIRM_OPENCV_EXECUTION',
    'REEDITPRO_CONFIRM_PYAV_EXECUTION',
    'REEDITPRO_CONFIRM_PYSCENEDETECT_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEOCR_EXECUTION',
    'REEDITPRO_CONFIRM_PADDLEPADDLE_EXECUTION',
    'REEDITPRO_CONFIRM_OPENCOLORIO_EXECUTION',
    'REEDITPRO_CONFIRM_OPENIMAGEIO_EXECUTION',
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

function sanitize(value = '') {
  return String(value)
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[email-redacted]')
    .replace(/\b(sk-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_]+|X-Amz-Signature=[A-Za-z0-9%]+)\b/g, '[secret-redacted]')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join('\n')
}

function run(command, args, options = {}) {
  const started = Date.now()
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    timeout: options.timeout || 60000,
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

function dockerRun(imageTag, entrypoint, args, options = {}) {
  const dockerArgs = ['run', '--rm', '--network', 'none']
  for (const volume of options.volumes || []) dockerArgs.push('-v', volume)
  dockerArgs.push('--entrypoint', entrypoint, imageTag, ...args)
  return run('docker', dockerArgs, { timeout: options.timeout || 90000 })
}

function buildDockerfilePatchReport(generated) {
  const dockerfile = readFileSync(join(repoRoot, dockerfilePath), 'utf8')
  const packagePresence = Object.fromEntries(
    approvedPackages.map((pkg) => [pkg, new RegExp(`\\b${pkg}\\b`).test(dockerfile)]),
  )
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.dockerfilePatch.v1',
    generatedAt: generated,
    decision: null,
    targetDockerfile: dockerfilePath,
    approvedPackages,
    packagePresence,
    allApprovedPackagesPresent: Object.values(packagePresence).every(Boolean),
    graphicsMagickAdded: /\bgraphicsmagick\b/.test(dockerfile),
    ffmpegLineTouchedByThisPhase: false,
    packageLockMutationAllowed: false,
  }
}

function sourceAudit(generated, imageTag) {
  const sourceSha = git(['rev-parse', 'HEAD'])
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.sourceAudit.v1',
    generatedAt: generated,
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceSha,
    sourceCompatible: sourceSha === expectedSourceSha,
    imageTag,
    ownerId,
    evidence: [
      { pr: 549, state: 'MERGED', head: '9daace1de0da0f137ba1660abbe562d0668e68f7', mergedAt: '2026-06-19T21:09:19Z' },
      { pr: 546, state: 'MERGED', head: '52d901c62069e5d44747ea40942a23728558c73e', mergedAt: '2026-06-19T20:36:29Z' },
      { pr: 545, state: 'MERGED', head: '4864d969ec509f34788f4fa0f9b3cfaeaa9917b7', mergedAt: '2026-06-19T20:04:45Z' },
      { pr: 542, state: 'MERGED', head: 'c2007f6bb20bc5cfae35d9e4eaef03feeca3218f', mergedAt: '2026-06-19T19:07:30Z' },
    ],
    approvedTarget: dockerfilePath,
    approvedPackages,
    graphicsMagickRole: 'optional_fallback_not_default',
    packageJsonHash: hashFile('package.json'),
    packageLockHash: hashFile('package-lock.json'),
    dockerfileHash: hashFile(dockerfilePath),
    supabaseClassification: supabaseClassification(),
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

function tempProofDir(sourceSha) {
  const dir = `/private/tmp/reeditpro-trackb-milestone1-system-packaging-proof-${sourceSha}`
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  return dir
}

function fileHashIfPresent(filePath) {
  if (!existsSync(filePath)) return null
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function runVersionProofs(imageTag, buildPassed) {
  const reports = []
  if (!buildPassed) {
    for (const tool of milestoneTools) {
      reports.push({
        id: tool.id,
        name: tool.name,
        versionCommand: `docker run --rm --network none --entrypoint ${tool.versionArgs[0]} ${imageTag} ${tool.versionArgs.slice(1).join(' ')}`,
        exitCode: null,
        versionProven: false,
        notRunReason: 'docker_build_not_passed',
      })
    }
    return reports
  }

  for (const tool of milestoneTools) {
    let entrypoint = tool.versionArgs[0]
    let args = tool.versionArgs.slice(1)
    let report = dockerRun(imageTag, entrypoint, args)
    if (tool.id === 'imagemagick' && report.exitCode !== 0) {
      entrypoint = 'convert'
      args = ['-version']
      report = dockerRun(imageTag, entrypoint, args)
    }
    reports.push({
      id: tool.id,
      name: tool.name,
      selectedCommand: entrypoint,
      versionCommand: report.command,
      exitCode: report.exitCode,
      signal: report.signal,
      durationMs: report.durationMs,
      stdoutSummary: report.stdoutSummary,
      stderrSummary: report.stderrSummary,
      versionProven: report.exitCode === 0,
    })
  }
  return reports
}

function runFixtureProofs(imageTag, versionReports, sourceSha) {
  const proofDir = tempProofDir(sourceSha)
  const reports = []
  try {
    writeFileSync(join(proofDir, 'synthetic-exiftool.txt'), 'REEDITPRO_SYNTHETIC_METADATA_FIXTURE\n')
    writeSyntheticWav(join(proofDir, 'synthetic-mediainfo.wav'))

    const imageMagickVersion = versionReports.find((report) => report.id === 'imagemagick')
    const imageCommand = imageMagickVersion?.selectedCommand || 'convert'
    const imageCreate = dockerRun(
      imageTag,
      imageCommand,
      ['-size', '240x80', 'xc:white', '-fill', 'black', '-pointsize', '24', '-gravity', 'center', '-annotate', '0', 'REEDITPRO', '/proof/synthetic-tesseract.png'],
      { volumes: [`${proofDir}:/proof`] },
    )
    const imageTransform = dockerRun(
      imageTag,
      imageCommand,
      ['/proof/synthetic-tesseract.png', '-resize', '120x40', '/proof/synthetic-imagemagick-output.png'],
      { volumes: [`${proofDir}:/proof`] },
    )

    const proofCommands = [
      {
        id: 'exiftool',
        name: 'ExifTool',
        report: dockerRun(imageTag, 'exiftool', ['-FileType', '-MIMEType', '/proof/synthetic-exiftool.txt'], {
          volumes: [`${proofDir}:/proof:ro`],
        }),
        fixtureFiles: ['synthetic-exiftool.txt'],
        predicate: (report) => report.exitCode === 0,
      },
      {
        id: 'mediainfo',
        name: 'MediaInfo',
        report: dockerRun(imageTag, 'mediainfo', ['--Output=JSON', '/proof/synthetic-mediainfo.wav'], {
          volumes: [`${proofDir}:/proof:ro`],
        }),
        fixtureFiles: ['synthetic-mediainfo.wav'],
        predicate: (report) => report.exitCode === 0,
      },
      {
        id: 'tesseract',
        name: 'Tesseract',
        report: dockerRun(imageTag, 'tesseract', ['/proof/synthetic-tesseract.png', 'stdout', '--psm', '7'], {
          volumes: [`${proofDir}:/proof:ro`],
        }),
        setupReport: imageCreate,
        fixtureFiles: ['synthetic-tesseract.png'],
        predicate: (report) => report.exitCode === 0 && /REEDITPRO/i.test(`${report.stdoutSummary}\n${report.stderrSummary}`),
      },
      {
        id: 'imagemagick',
        name: 'ImageMagick',
        report: imageTransform,
        setupReport: imageCreate,
        fixtureFiles: ['synthetic-tesseract.png', 'synthetic-imagemagick-output.png'],
        predicate: (report) => imageCreate.exitCode === 0 && report.exitCode === 0,
      },
    ]

    for (const proof of proofCommands) {
      reports.push({
        id: proof.id,
        name: proof.name,
        setupCommand: proof.setupReport?.command || null,
        setupExitCode: proof.setupReport?.exitCode ?? null,
        fixtureCommand: proof.report.command,
        exitCode: proof.report.exitCode,
        signal: proof.report.signal,
        durationMs: proof.report.durationMs,
        stdoutSummary: proof.report.stdoutSummary,
        stderrSummary: proof.report.stderrSummary,
        fixtureProven: proof.predicate(proof.report),
        fixtureHashes: Object.fromEntries(
          proof.fixtureFiles.map((file) => [file, fileHashIfPresent(join(proofDir, file))]),
        ),
      })
    }
  } finally {
    rmSync(proofDir, { recursive: true, force: true })
  }
  return {
    proofDir,
    cleaned: !existsSync(proofDir),
    reports,
  }
}

function deriveDecision({ dockerReadiness, dockerBuild, versionReports, fixtureProofs, patchReport, missingBuildContext }) {
  if (!patchReport.allApprovedPackagesPresent || patchReport.graphicsMagickAdded) return runtimeSafetyDecision
  if (dockerReadiness.exitCode !== 0) return dockerRuntimeDecision
  if (dockerBuild.exitCode !== 0) {
    if (missingBuildContext.length > 0) return dockerBuildContextDecision
    const combined = `${dockerBuild.stdoutSummary}\n${dockerBuild.stderrSummary}`
    return /dist-server|dist-staging-fixture-worker|COPY failed|failed to compute cache key/i.test(combined)
      ? dockerBuildContextDecision
      : dockerBuildDecision
  }
  const byTool = new Map()
  for (const version of versionReports) byTool.set(version.id, { version })
  for (const proof of fixtureProofs.reports) byTool.set(proof.id, { ...byTool.get(proof.id), proof })

  const failures = [...byTool.entries()].filter(
    ([, value]) => value.version?.versionProven !== true || value.proof?.fixtureProven !== true,
  )
  if (!failures.length && fixtureProofs.cleaned) return passDecision
  if (
    failures.length === 1 &&
    failures[0][0] === 'mediainfo' &&
    byTool.get('mediainfo')?.version?.versionProven === true
  ) {
    return mediaInfoDeferredDecision
  }
  return artifactSafetyDecision
}

function nextPromptForDecision(decision) {
  if (decision === passDecision) return qaNextPrompt
  if (decision === mediaInfoDeferredDecision) return mediaInfoNextPrompt
  if (decision === dockerBuildContextDecision) return buildContextNextPrompt
  return blockerNextPrompt
}

function buildArtifacts({ execute = false } = {}) {
  if (execute) assertConfirmations()
  const generated = generatedAt()
  const sourceSha = git(['rev-parse', 'HEAD'])
  const imageTag = `reeditpro-cpu-worker:trackb-milestone1-${sourceSha}`
  const patchReport = buildDockerfilePatchReport(generated)
  const audit = sourceAudit(generated, imageTag)
  const missingBuildContext = requiredBuildContext.filter((relativePath) => !existsSync(join(repoRoot, relativePath)))
  const dockerBuildCommand = `docker build -f ${dockerfilePath} -t ${imageTag} .`
  const dockerReadiness = execute
    ? run('docker', ['version', '--format', '{{json .}}'], { timeout: 30000 })
    : { command: 'docker version --format {{json .}}', exitCode: null, notRunReason: 'not_execute_mode' }
  const dockerBuild = execute && dockerReadiness.exitCode === 0
    ? run('docker', ['build', '-f', dockerfilePath, '-t', imageTag, '.'], { timeout: 1800000 })
    : { command: dockerBuildCommand, exitCode: null, notRunReason: execute ? 'docker_runtime_unavailable' : 'not_execute_mode' }
  const buildPassed = dockerBuild.exitCode === 0
  const versionReports = runVersionProofs(imageTag, execute && buildPassed)
  const fixtureProofs = execute && buildPassed
    ? runFixtureProofs(imageTag, versionReports, sourceSha)
    : {
        proofDir: `/private/tmp/reeditpro-trackb-milestone1-system-packaging-proof-${sourceSha}`,
        cleaned: true,
        reports: milestoneTools.map((tool) => ({
          id: tool.id,
          name: tool.name,
          fixtureCommand: null,
          exitCode: null,
          fixtureProven: false,
          notRunReason: 'docker_build_not_passed',
        })),
      }
  const imageCleanup = execute && buildPassed
    ? run('docker', ['image', 'rm', imageTag], { timeout: 120000 })
    : { command: `docker image rm ${imageTag}`, exitCode: null, notRunReason: buildPassed ? 'not_execute_mode' : 'image_not_built' }
  const decision = deriveDecision({ dockerReadiness, dockerBuild, versionReports, fixtureProofs, patchReport, missingBuildContext })
  const nextPrompt = nextPromptForDecision(decision)
  const finalPatchReport = { ...patchReport, decision }

  const dockerBuildReport = {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.dockerBuild.v1',
    generatedAt: generated,
    decision,
    command: dockerBuildCommand,
    exactApprovedCommandUsed: execute ? dockerBuild.command === dockerBuildCommand : false,
    exitCode: dockerBuild.exitCode,
    signal: dockerBuild.signal ?? null,
    durationMs: dockerBuild.durationMs ?? null,
    stdoutSummary: dockerBuild.stdoutSummary || null,
    stderrSummary: dockerBuild.stderrSummary || null,
    error: dockerBuild.error || null,
    notRunReason: dockerBuild.notRunReason || null,
    missingBuildContext,
    imageTag,
    dockerImagePushRun: false,
  }
  const reports = {
    sourceAudit: { ...audit, decision, nextPrompt },
    dockerfilePatchReport: finalPatchReport,
    dockerBuildReport,
    versionProofReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.versionProof.v1',
      generatedAt: generated,
      decision,
      imageTag,
      localHostProbeRun: false,
      reports: versionReports,
    },
    syntheticFixtureProofReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.syntheticFixtureProof.v1',
      generatedAt: generated,
      decision,
      imageTag,
      tempProofDir: fixtureProofs.proofDir,
      tempProofDirCleaned: fixtureProofs.cleaned,
      syntheticFixturesOnly: true,
      realUserMediaUsed: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      reports: fixtureProofs.reports,
    },
    artifactCleanupReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.artifactCleanup.v1',
      generatedAt: generated,
      decision,
      tempProofDir: fixtureProofs.proofDir,
      tempProofDirCleaned: fixtureProofs.cleaned,
      localImageCleanupCommand: imageCleanup.command,
      localImageCleanupExitCode: imageCleanup.exitCode,
      localImageCleanupNotRunReason: imageCleanup.notRunReason || null,
      localImagePushRun: false,
    },
    safetyScanReport: buildSafetyScan(generated, decision),
    statusMatrix: buildStatusMatrix(generated, decision, versionReports, fixtureProofs.reports),
    decisionReport: buildDecisionReport(generated, decision, nextPrompt, sourceSha, imageTag),
    readinessReport: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.readiness.v1',
      generatedAt: generated,
      decision,
      readyForMilestone1Qa: decision === passDecision,
      readyForMediaInfoFixtureFollowup: decision === mediaInfoDeferredDecision,
      readyForBuildContextFollowup: decision === dockerBuildContextDecision,
      readyForRuntimeMediaProcessing: false,
      nextPrompt,
    },
    privateArtifactManifest: {
      schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.privateArtifactManifest.v1',
      generatedAt: generated,
      decision,
      reportDirectory: reportDir,
      dockerImagePushed: false,
      localDockerImageTag: imageTag,
      localDockerImageCleanupAttempted: execute && buildPassed,
      fixtureOutputsCommitted: false,
      fixtureOutputsCleaned: fixtureProofs.cleaned,
      rawUserMediaAccessed: false,
      secretsPrinted: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      supabaseClassification: supabaseClassification(),
    },
  }
  return reports
}

function buildStatusMatrix(generated, decision, versions, proofs) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.statusMatrix.v1',
    generatedAt: generated,
    decision,
    tools: milestoneTools.map((tool) => {
      const version = versions.find((entry) => entry.id === tool.id)
      const proof = proofs.find((entry) => entry.id === tool.id)
      return {
        id: tool.id,
        name: tool.name,
        container_version_proven: version?.versionProven === true,
        synthetic_fixture_proven: proof?.fixtureProven === true,
        accepted_proven:
          version?.versionProven === true &&
          (proof?.fixtureProven === true || (tool.id === 'mediainfo' && decision === mediaInfoDeferredDecision)),
        blocker:
          version?.versionProven !== true
            ? 'container_version_not_proven'
            : proof?.fixtureProven !== true
              ? 'synthetic_fixture_not_proven'
              : null,
      }
    }),
  }
}

function buildDecisionReport(generated, decision, nextPrompt, sourceSha, imageTag) {
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.decision.v1',
    generatedAt: generated,
    decision,
    sourceSha,
    imageTag,
    ownerId,
    targetDockerfile: dockerfilePath,
    approvedPackages,
    targetTools: milestoneTools.map((tool) => tool.id),
    graphicsMagickRole: 'optional_fallback_not_default',
    nextPrompt,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    cpuOnly: true,
    gpuRunInThisPhase: false,
    hostPackageInstallRun: false,
    npmCiRunOnHost: false,
    npmInstallRunOnHost: false,
    npmRebuildRunOnHost: false,
    packageLockMutationAllowed: false,
    dockerImagePushRun: false,
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

function buildSafetyScan(generated, decision) {
  const forbiddenPresent = forbiddenOutputs.filter((relativePath) => existsSync(join(repoRoot, relativePath)))
  const changedProtected = [
    ...git(['diff', '--name-only', '--', ...protectedNoDiffFiles]).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles]).split('\n').filter(Boolean),
  ]
  const tempProofPrefixes = ['/private/tmp/reeditpro-trackb-milestone1-system-packaging-proof-']
  return {
    schema: 'reeditpro.openSourceToolStack.trackBMilestone1SystemPackagingExecution.safetyScan.v1',
    generatedAt: generated,
    decision,
    forbiddenOutputsPresent: forbiddenPresent,
    protectedNoDiffFiles,
    changedProtectedFiles: [...new Set(changedProtected)],
    cpuWorkerDockerfileMutationAllowed: true,
    packageLockMutationAllowed: false,
    dockerfileMutationLimitedToCpuWorker: changedProtected.length === 0,
    tempProofPrefixes,
    mediaArtifactsCommitted: false,
    secretMaterialDetected: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    passed: forbiddenPresent.length === 0 && changedProtected.length === 0,
  }
}

function writeReports(reports) {
  writeJson(`${reportDir}/source-of-truth-audit.json`, reports.sourceAudit)
  writeJson(`${reportDir}/dockerfile-patch-report.json`, reports.dockerfilePatchReport)
  writeJson(`${reportDir}/docker-build-report.json`, reports.dockerBuildReport)
  writeJson(`${reportDir}/version-proof-report.json`, reports.versionProofReport)
  writeJson(`${reportDir}/synthetic-fixture-proof-report.json`, reports.syntheticFixtureProofReport)
  writeJson(`${reportDir}/artifact-cleanup-report.json`, reports.artifactCleanupReport)
  writeJson(`${reportDir}/safety-scan-report.json`, reports.safetyScanReport)
  writeJson(`${reportDir}/milestone-1-packaging-status-matrix.json`, reports.statusMatrix)
  writeJson(`${reportDir}/milestone-1-system-packaging-execution-decision.json`, reports.decisionReport)
  writeJson(`${reportDir}/readiness-report.json`, reports.readinessReport)
  writeJson(`${reportDir}/private-artifact-manifest.json`, reports.privateArtifactManifest)

  const decision = reports.decisionReport.decision
  const rows = reports.statusMatrix.tools
    .map((tool) => `| \`${tool.id}\` | ${tool.container_version_proven} | ${tool.synthetic_fixture_proven} | ${tool.accepted_proven} | ${tool.blocker || 'none'} |`)
    .join('\n')
  writeText(`${reportDir}/source-of-truth-audit.md`, `# Track B Milestone 1 System Packaging Execution Source Audit\n\nDecision: \`${decision}\`\n\nSource SHA: \`${reports.sourceAudit.sourceSha}\`\n\nPR #549, #546, #545, and #542 are recorded as merged source-of-truth evidence. Supabase classification remains no write / environment none / SQL none / migration no.\n`)
  writeText(`${reportDir}/dockerfile-patch-report.md`, `# Dockerfile Patch Report\n\nTarget: \`${dockerfilePath}\`\n\nApproved packages added: ${approvedPackages.map((pkg) => `\`${pkg}\``).join(', ')}.\n\nGraphicsMagick remains optional fallback and is not installed by default.\n`)
  writeText(`${reportDir}/docker-build-report.md`, `# Docker Build Report\n\nCommand: \`${reports.dockerBuildReport.command}\`\n\nExit code: \`${reports.dockerBuildReport.exitCode ?? 'not_run'}\`\n\nMissing build context at preflight: ${reports.dockerBuildReport.missingBuildContext.map((entry) => `\`${entry}\``).join(', ') || 'none'}.\n`)
  writeText(`${reportDir}/version-proof-report.md`, `# Container Version Proof Report\n\nLocal host probing did not run. All version proof commands, when executed, used \`docker run --rm --network none\` against the local probe image.\n`)
  writeText(`${reportDir}/synthetic-fixture-proof-report.md`, `# Synthetic Fixture Proof Report\n\nOnly synthetic fixtures in a private temporary directory were allowed. No user media, public artifacts, or signed URLs were created.\n`)
  writeText(`${reportDir}/safety-scan-report.md`, `# Safety Scan Report\n\nPassed: \`${reports.safetyScanReport.passed}\`\n\nForbidden outputs present: ${reports.safetyScanReport.forbiddenOutputsPresent.join(', ') || 'none'}.\n`)
  writeText(`${reportDir}/milestone-1-packaging-status-matrix.md`, `# Milestone 1 Packaging Status Matrix\n\n| Tool | Version proven | Fixture proven | Accepted/proven | Blocker |\n| --- | --- | --- | --- | --- |\n${rows}\n`)
  writeText(`${reportDir}/milestone-1-system-packaging-execution-decision.md`, `# Milestone 1 System Packaging Execution Decision\n\nDecision: \`${decision}\`\n\nNext prompt: \`${reports.decisionReport.nextPrompt}\`\n\nMedia processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.\n`)
  writeText(`${reportDir}/validation-results.md`, `# Validation Results\n\nGenerated decision: \`${decision}\`.\n\nNo-install diagnostics are required after generation. Dependency-backed checks remain skipped unless dependencies already exist without installation.\n`)
}

function writeNextPrompt(reports) {
  const decision = reports.decisionReport.decision
  if (decision === passDecision) {
    writeText(
      'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-qa-review.md',
      '# TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW\n\nReview the Track B Milestone 1 CPU-only container proof evidence. Media processing, render/export, workers/routes/providers, Supabase/GCS, beta, and production remain blocked.\n',
    )
  } else if (decision === dockerBuildContextDecision) {
    writeText(
      'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-system-packaging-build-context-blocker-followup.md',
      '# TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_BUILD_CONTEXT_BLOCKER_FOLLOWUP\n\nResolve the CPU worker Docker build-context blocker before rerunning Track B Milestone 1 system packaging proofs. Do not generate build contexts, run Docker, process media, or unlock runtime/product scopes without a separate approval and execution packet.\n',
    )
  } else {
    writeText(
      'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-system-packaging-execution-blocker-followup.md',
      '# TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_BLOCKER_FOLLOWUP\n\nReview the blocked Track B Milestone 1 packaging execution evidence before any rerun. Keep scope limited to CPU-only synthetic fixtures and the approved target tools.\n',
    )
  }
}

function updateStatusDocs(reports) {
  const body = `
TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION:

- Decision: \`${reports.decisionReport.decision}\`
- Owner: \`${ownerId}\`
- Target: \`${dockerfilePath}\`
- Approved package set: ${approvedPackages.map((pkg) => `\`${pkg}\``).join(', ')}
- Target tools: ExifTool, MediaInfo, Tesseract, and ImageMagick only.
- GraphicsMagick remains optional fallback and is not installed by default.
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
  ]) {
    replaceOrAppend(
      path,
      '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_STATUS:start -->',
      '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_STATUS:end -->',
      body,
    )
  }

  const ownerPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'
  const ownerStatus = readJson(ownerPath)
  ownerStatus.milestone1SystemPackagingExecution = {
    decision: reports.decisionReport.decision,
    reportKey: 'trackb_milestone_1_system_packaging_execution_reports',
    targetDockerfile: dockerfilePath,
    requiredPackages: approvedPackages,
    imageTag: reports.decisionReport.imageTag,
    tools: reports.statusMatrix.tools,
    nextPrompt: reports.decisionReport.nextPrompt,
    mediaProcessingAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    betaProductionAccepted: false,
  }
  writeJson(ownerPath, ownerStatus)
  replaceOrAppend(
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
    '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_STATUS:start -->',
    '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_STATUS:end -->',
    body,
  )
}

export function buildTrackBMilestone1SystemPackagingExecutionPlan() {
  const sourceSha = git(['rev-parse', 'HEAD'])
  const imageTag = `reeditpro-cpu-worker:trackb-milestone1-${sourceSha}`
  return {
    phase: 'TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION',
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceSha,
    reportDir,
    targetDockerfile: dockerfilePath,
    approvedPackages,
    imageTag,
    dockerBuildCommand: `docker build -f ${dockerfilePath} -t ${imageTag} .`,
    tools: milestoneTools.map((tool) => tool.id),
    requiredConfirmations: requiredConfirmations(),
    forbiddenConfirmations: forbiddenConfirmations(),
    blockedScopes: [
      'host package installation',
      'package-lock mutation',
      'FFmpeg/FFprobe execution',
      'media processing/render/export',
      'workers/routes/providers',
      'Supabase/GCS/public artifacts/signed URLs',
      'raw prompts, beta, production',
    ],
  }
}

export function writeTrackBMilestone1SystemPackagingExecutionArtifacts(options = {}) {
  const reports = buildArtifacts(options)
  writeReports(reports)
  writeNextPrompt(reports)
  updateStatusDocs(reports)
  return reports
}

export function readTrackBMilestone1SystemPackagingExecutionArtifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    dockerfilePatchReport: readJson(`${reportDir}/dockerfile-patch-report.json`),
    dockerBuildReport: readJson(`${reportDir}/docker-build-report.json`),
    versionProofReport: readJson(`${reportDir}/version-proof-report.json`),
    syntheticFixtureProofReport: readJson(`${reportDir}/synthetic-fixture-proof-report.json`),
    artifactCleanupReport: readJson(`${reportDir}/artifact-cleanup-report.json`),
    safetyScanReport: readJson(`${reportDir}/safety-scan-report.json`),
    statusMatrix: readJson(`${reportDir}/milestone-1-packaging-status-matrix.json`),
    decisionReport: readJson(`${reportDir}/milestone-1-system-packaging-execution-decision.json`),
    readinessReport: readJson(`${reportDir}/readiness-report.json`),
    privateArtifactManifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  }
}

export function forbiddenOutputsPresent() {
  return forbiddenOutputs.filter((relativePath) => existsSync(join(repoRoot, relativePath)))
}

export function protectedNoDiffFilesHaveNoDiff() {
  const diff = git(['diff', '--name-only', '--', ...protectedNoDiffFiles])
  const cached = git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles])
  return !diff && !cached
}

export function cpuWorkerDockerfilePatchIsApprovedOnly() {
  const dockerfile = readFileSync(join(repoRoot, dockerfilePath), 'utf8')
  return approvedPackages.every((pkg) => dockerfile.includes(pkg)) && !dockerfile.includes('graphicsmagick')
}

export { approvedPackages, milestoneTools, supabaseClassification }
