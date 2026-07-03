import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(__filename), '..', '..', '..')

export const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-low-risk-metadata-tooling-execution'
export const branchName = 'codex/rp-trackb-media-oss-milestone-1-low-risk-metadata-tooling-execution'
export const baseBranch = 'codex/rp-github-merge-hygiene-open-pr-stack-audit'
export const expectedSourceSha = '89784140047ca722c77b8d3f899284023623681f'
export const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
export const expectedBlockedDecision = 'trackb_media_oss_milestone1_blocked_pending_container_packaging_approval'
export const passDecision = 'trackb_media_oss_milestone1_execution_passed_all_four_tools_cpu_bounded'
export const partialDecision = 'trackb_media_oss_milestone1_execution_passed_partial_pending_system_binary_packaging'
export const qaNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW'
export const packagingNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL'

const generatedAt = () => new Date().toISOString()

const milestoneTools = [
  {
    id: 'exiftool',
    name: 'ExifTool',
    commands: ['exiftool'],
    versionCommand: ['exiftool', ['-ver']],
    proofBoundary: 'version plus tiny synthetic metadata-safe text fixture',
    futurePackages: { debianUbuntu: ['libimage-exiftool-perl'] },
  },
  {
    id: 'mediainfo',
    name: 'MediaInfo',
    commands: ['mediainfo'],
    versionCommand: ['mediainfo', ['--Version']],
    proofBoundary: 'version plus tiny synthetic header-only WAV fixture',
    futurePackages: { debianUbuntu: ['mediainfo'] },
  },
  {
    id: 'tesseract',
    name: 'Tesseract',
    commands: ['tesseract'],
    versionCommand: ['tesseract', ['--version']],
    proofBoundary: 'version plus tiny synthetic PBM OCR fixture',
    futurePackages: { debianUbuntu: ['tesseract-ocr', 'tesseract-ocr-eng'] },
  },
  {
    id: 'imagemagick_graphicsmagick',
    name: 'ImageMagick / GraphicsMagick',
    commands: ['magick', 'convert', 'gm'],
    versionCommand: null,
    proofBoundary: 'version plus tiny synthetic image transform fixture',
    futurePackages: { debianUbuntu: ['imagemagick', 'graphicsmagick'] },
  },
]

const forbiddenToolIds = ['ffmpeg', 'ffprobe', 'opencv', 'pyav', 'pyscenedetect', 'paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio']
const protectedFiles = ['package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']
const forbiddenOutputs = ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']

export function requiredConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_1_LOW_RISK_METADATA_TOOLING_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_STEWARD_SOURCE_OF_TRUTH',
    'REEDITPRO_CONFIRM_LOW_RISK_METADATA_TOOLING_CPU_ONLY',
    'REEDITPRO_CONFIRM_SYNTHETIC_FIXTURES_ONLY',
    'REEDITPRO_CONFIRM_NO_REAL_USER_MEDIA',
    'REEDITPRO_CONFIRM_NO_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_NO_RENDER_EXPORT',
    'REEDITPRO_CONFIRM_NO_SUPABASE_MUTATION',
    'REEDITPRO_CONFIRM_TOOL_EXECUTION_BLOCKER_POLICY',
    'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  ]
}

export function forbiddenConfirmations() {
  return [
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_MILESTONE_2_EXECUTION',
    'REEDITPRO_CONFIRM_TRACKB_MEDIA_OSS_TOOL_GPU_EXECUTION',
    'REEDITPRO_CONFIRM_GPU_RUNTIME_EXECUTION',
    'REEDITPRO_CONFIRM_DOCKER_BUILD',
    'REEDITPRO_CONFIRM_DOCKER_RUN',
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

function supabaseClassification() {
  return {
    updateRequired: 'no write',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
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

function commandPath(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], { cwd: repoRoot, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : null
}

function safeRun(command, args, options = {}) {
  const started = Date.now()
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, ...(options.env || {}) },
  })
  return {
    command: [command, ...args].join(' '),
    exitCode: result.status ?? null,
    signal: result.signal ?? null,
    durationMs: Date.now() - started,
    stdoutSummary: sanitizeOutput(result.stdout),
    stderrSummary: sanitizeOutput(result.stderr),
  }
}

function sanitizeOutput(value = '') {
  return value
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[email-redacted]')
    .replace(/\b(sk-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_]+|X-Amz-Signature=[A-Za-z0-9%]+)\b/g, '[secret-redacted]')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join('\n')
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
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`)
  const next = pattern.test(current) ? current.replace(pattern, block) : `${current.trimEnd()}\n\n${block}\n`
  writeFileSync(fullPath, next)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildAvailability(generated) {
  return milestoneTools.map((tool) => {
    const commands = tool.commands.map((command) => ({ command, path: commandPath(command), available: Boolean(commandPath(command)) }))
    const selected = commands.find((entry) => entry.available) || null
    let versionCommand = tool.versionCommand
    if (tool.id === 'imagemagick_graphicsmagick' && selected) {
      versionCommand = selected.command === 'gm' ? ['gm', ['version']] : [selected.command, ['-version']]
    }
    const version = selected && versionCommand ? safeRun(versionCommand[0], versionCommand[1]) : null
    return {
      id: tool.id,
      name: tool.name,
      generatedAt: generated,
      commands,
      selectedCommand: selected?.command || null,
      selectedPath: selected?.path || null,
      available: Boolean(selected),
      versionCommand: version?.command || null,
      versionExitCode: version?.exitCode ?? null,
      versionSummary: version?.stdoutSummary || version?.stderrSummary || null,
    }
  })
}

function createTempProofDir() {
  const dir = `/private/tmp/reeditpro-trackb-media-oss-milestone1-${process.pid}`
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  return dir
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

function writeSyntheticPbm(filePath) {
  const rows = [
    '00000000000000000000',
    '01110111011101110110',
    '01000100010001000101',
    '01110111011101110110',
    '01000101010001000101',
    '01000111011101110110',
    '00000000000000000000',
  ]
  writeFileSync(filePath, `P1\n20 7\n${rows.map((row) => row.split('').join(' ')).join('\n')}\n`)
}

function runProofs(availability) {
  const tempDir = createTempProofDir()
  const reports = []
  try {
    for (const tool of milestoneTools) {
      const available = availability.find((entry) => entry.id === tool.id)
      const report = {
        id: tool.id,
        name: tool.name,
        available: available?.available === true,
        selectedCommand: available?.selectedCommand || null,
        versionProven: available?.versionExitCode === 0,
        fixtureProven: false,
        fixtureRun: false,
        fixtureHash: null,
        fixtureOutputSummary: null,
        acceptedProven: false,
        packagingRequired: available?.available !== true,
        blocker: available?.available ? null : 'missing_system_binary',
        proofBoundary: tool.proofBoundary,
      }
      if (!available?.available) {
        reports.push(report)
        continue
      }

      let fixturePath = null
      let proof = null
      if (tool.id === 'exiftool') {
        fixturePath = join(tempDir, 'synthetic-exiftool.txt')
        writeFileSync(fixturePath, 'REEDITPRO_SYNTHETIC_METADATA_FIXTURE\n')
        proof = safeRun(available.selectedCommand, ['-FileType', '-MIMEType', fixturePath])
      } else if (tool.id === 'mediainfo') {
        fixturePath = join(tempDir, 'synthetic-mediainfo.wav')
        writeSyntheticWav(fixturePath)
        proof = safeRun(available.selectedCommand, ['--Output=JSON', fixturePath])
      } else if (tool.id === 'tesseract') {
        fixturePath = join(tempDir, 'synthetic-tesseract.pbm')
        writeSyntheticPbm(fixturePath)
        proof = safeRun(available.selectedCommand, [fixturePath, 'stdout', '--psm', '7'])
      } else if (tool.id === 'imagemagick_graphicsmagick') {
        fixturePath = join(tempDir, 'synthetic-image-output.png')
        if (available.selectedCommand === 'gm') {
          proof = safeRun('gm', ['convert', '-size', '8x8', 'xc:white', '-fill', 'black', '-draw', 'point 1,1', fixturePath])
        } else {
          proof = safeRun(available.selectedCommand, ['-size', '8x8', 'xc:white', '-fill', 'black', '-draw', 'point 1,1', fixturePath])
        }
      }
      report.fixtureRun = Boolean(proof)
      report.fixtureProven = proof?.exitCode === 0
      report.fixtureOutputSummary = proof?.stdoutSummary || proof?.stderrSummary || null
      report.fixtureHash = fixturePath && existsSync(fixturePath)
        ? createHash('sha256').update(readFileSync(fixturePath)).digest('hex')
        : null
      report.acceptedProven = report.versionProven && report.fixtureProven
      report.packagingRequired = !report.acceptedProven
      report.blocker = report.acceptedProven ? null : 'fixture_or_version_proof_failed'
      reports.push(report)
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
  return reports
}

function deriveDecision(proofs) {
  if (proofs.every((proof) => proof.acceptedProven)) return passDecision
  if (proofs.some((proof) => proof.available && proof.blocker === 'fixture_or_version_proof_failed')) {
    return 'trackb_media_oss_milestone1_blocked_pending_fixture_safety_review'
  }
  if (proofs.some((proof) => proof.acceptedProven)) return partialDecision
  return expectedBlockedDecision
}

function nextPromptForDecision(decision) {
  return decision === passDecision ? qaNextPrompt : packagingNextPrompt
}

function buildArtifacts() {
  const generated = generatedAt()
  const sourceSha = git(['rev-parse', 'HEAD'])
  const packageJsonHash = hashFile('package.json')
  const packageLockHash = hashFile('package-lock.json')
  const availability = buildAvailability(generated)
  const proofs = runProofs(availability)
  const decision = deriveDecision(proofs)
  const nextPrompt = nextPromptForDecision(decision)
  const acceptedCount = proofs.filter((proof) => proof.acceptedProven).length
  const blockedCount = proofs.length - acceptedCount
  const duplicateSearchNotes = [
    'No open central duplicate matched TRACKB_MEDIA_OSS_MILESTONE_1_LOW_RISK_METADATA_TOOLING_EXECUTION during preflight.',
    'Broad ExifTool/MediaInfo/Tesseract/ImageMagick search may surface AI/Track A owner registry PRs; those are non-Track-B duplicates.',
  ]

  const sourceAudit = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone1Execution.sourceAudit.v1',
    generatedAt: generated,
    branchName,
    baseBranch,
    expectedSourceSha,
    sourceSha,
    sourceCompatible: sourceSha === expectedSourceSha,
    packageJsonHash,
    packageLockHash,
    mergedEvidence: [
      { pr: 545, state: 'MERGED', head: '4864d969ec509f34788f4fa0f9b3cfaeaa9917b7', mergedAt: '2026-06-19T20:04:45Z' },
      { pr: 542, state: 'MERGED', head: 'c2007f6bb20bc5cfae35d9e4eaef03feeca3218f', mergedAt: '2026-06-19T19:07:30Z' },
    ],
    aiGraphicsOwnerPr543: {
      state: 'OPEN',
      isDraft: true,
      base: 'codex/rp-open-source-tool-stack-refresh-after-ai-graphics-worker-qa-review',
      ownsTrackBTools: false,
      note: 'PR #543 is an AI graphics owner assignment lane and is not a central Track B Milestone 1 execution duplicate.',
    },
    ownerId,
    lane: 'TRACK_B_MEDIA_PROCESSING',
    milestoneTools: milestoneTools.map((tool) => tool.id),
    cpuOnly: true,
    syntheticFixturesOnly: true,
    noRealUserMedia: true,
    duplicateSearchNotes,
    supabaseClassification: supabaseClassification(),
  }

  const toolAvailabilityReport = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone1Execution.toolAvailability.v1',
    generatedAt: generated,
    decision,
    tools: availability,
  }
  const syntheticFixturePolicy = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone1Execution.syntheticFixturePolicy.v1',
    generatedAt: generated,
    decision,
    tinySyntheticFixturesOnly: true,
    realUserMediaUsed: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    fixtureOutputsCommitted: false,
    fixtureOutputsCleaned: true,
    committedEvidence: 'versions, exit codes, sanitized summaries, hashes, counts, and blocker metadata only',
  }
  const packagingManifest = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone1Execution.systemPackagingManifest.v1',
    generatedAt: generated,
    decision,
    installationRunInThisPhase: false,
    dockerfileMutationAllowed: false,
    packageLockMutationAllowed: false,
    dockerBuildRunInThisPhase: false,
    futureContainerPackagingRequired: proofs.some((proof) => proof.packagingRequired),
    tools: milestoneTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      futurePackages: tool.futurePackages,
      currentStatus: proofs.find((proof) => proof.id === tool.id)?.blocker || 'available_and_proven',
    })),
  }
  const cpuGpuCostReport = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone1Execution.cpuGpuCostPerformance.v1',
    generatedAt: generated,
    decision,
    computeDefault: 'cpu_only',
    gpuRequired: false,
    gpuRunInThisPhase: false,
    expectedFutureRuntime: 'cpu_cloud_run_job_or_cpu_worker_image_after_packaging_approval',
    costTier: 'low',
    latencyRisk: 'low_for_tiny_synthetic_fixtures_higher_for_future_user_media_not_authorized_here',
    fallback: 'block_until_cpu_worker_image_packaging_includes_missing_tool',
  }
  const statusMatrix = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone1Execution.statusMatrix.v1',
    generatedAt: generated,
    decision,
    tools: proofs.map((proof) => ({
      id: proof.id,
      available: proof.available,
      version_proven: proof.versionProven,
      fixture_proven: proof.fixtureProven,
      packaging_required: proof.packagingRequired,
      accepted_proven: proof.acceptedProven,
      blocker: proof.blocker,
    })),
  }
  const decisionReport = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone1Execution.decision.v1',
    generatedAt: generated,
    decision,
    ownerId,
    lane: 'TRACK_B_MEDIA_PROCESSING',
    acceptedProvenMilestone1Tools: acceptedCount,
    blockedMilestone1Tools: blockedCount,
    endToEndProductReadyTools: 0,
    fortyPlusEndToEndClaimAllowed: false,
    nextPrompt,
    cpuOnly: true,
    gpuRunInThisPhase: false,
    dependencyInstallRunInThisPhase: false,
    packageLockMutationAllowed: false,
    dockerBuildRunInThisPhase: false,
    dockerRunInThisPhase: false,
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
  const readinessReport = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone1Execution.readiness.v1',
    generatedAt: generated,
    decision,
    readiness: decision === passDecision,
    blocker: decision === passDecision ? null : 'system_binary_packaging_approval_required_before_milestone_1_proof_can_pass',
    nextPrompt,
  }
  const privateArtifactManifest = {
    schema: 'reeditpro.openSourceToolStack.trackbMediaOssMilestone1Execution.privateArtifactManifest.v1',
    generatedAt: generated,
    decision,
    reportDirectory: reportDir,
    temporaryFixtureDirectoryCommitted: false,
    fixtureOutputsCommitted: false,
    rawUserMediaAccessed: false,
    secretPayloadAccessed: false,
    secretsPrinted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    supabaseClassification: supabaseClassification(),
  }

  return {
    sourceAudit,
    toolAvailabilityReport,
    syntheticFixturePolicy,
    proofReports: proofs,
    packagingManifest,
    cpuGpuCostReport,
    statusMatrix,
    decisionReport,
    readinessReport,
    privateArtifactManifest,
  }
}

function writeMarkdownReports(artifacts) {
  const { decision, nextPrompt } = artifacts.decisionReport
  const statusRows = artifacts.statusMatrix.tools
    .map((tool) => `| \`${tool.id}\` | ${tool.available} | ${tool.version_proven} | ${tool.fixture_proven} | ${tool.packaging_required} | ${tool.blocker || 'none'} |`)
    .join('\n')
  const availabilityRows = artifacts.toolAvailabilityReport.tools
    .map((tool) => `| \`${tool.id}\` | \`${tool.selectedCommand || 'none'}\` | ${tool.available} | ${tool.versionExitCode ?? 'n/a'} |`)
    .join('\n')

  writeText(`${reportDir}/source-of-truth-audit.md`, `# Track B Milestone 1 Source Audit\n\nDecision: \`${decision}\`\n\nSource SHA: \`${artifacts.sourceAudit.sourceSha}\`\n\nMerged evidence: PR #545 and PR #542 are recorded as source-of-truth. PR #543 remains AI graphics owner evidence and does not claim Track B tools.\n`)
  writeText(`${reportDir}/tool-availability-report.md`, `# Tool Availability Report\n\n| Tool | Selected command | Available | Version exit |\n| --- | --- | --- | --- |\n${availabilityRows}\n`)
  writeText(`${reportDir}/synthetic-fixture-policy.md`, `# Synthetic Fixture Policy\n\nTiny synthetic fixtures only. No real user media, public artifacts, signed URLs, or committed fixture outputs. Temporary fixture outputs are cleaned before commit.\n`)
  for (const proof of artifacts.proofReports) {
    writeText(`${reportDir}/${proof.id === 'imagemagick_graphicsmagick' ? 'imagemagick-graphicsmagick' : proof.id}-proof-report.md`, `# ${proof.name} Proof Report\n\nStatus: \`${proof.acceptedProven ? 'available_and_proven' : proof.blocker}\`\n\n- Available: ${proof.available}\n- Version proven: ${proof.versionProven}\n- Fixture run: ${proof.fixtureRun}\n- Fixture proven: ${proof.fixtureProven}\n- Packaging required: ${proof.packagingRequired}\n`)
  }
  writeText(`${reportDir}/system-packaging-manifest.md`, `# System Packaging Manifest\n\nNo package installation, Docker build, Dockerfile mutation, or package-lock mutation ran in this phase. Missing binaries require future CPU worker/container packaging approval.\n`)
  writeText(`${reportDir}/cpu-gpu-cost-performance-report.md`, `# CPU/GPU Cost Performance Report\n\nMilestone 1 is CPU-only/default. GPU is not required or used. Future runtime target is a CPU Cloud Run Job or CPU worker image after packaging approval. Cost tier: low.\n`)
  writeText(`${reportDir}/milestone-1-status-matrix.md`, `# Milestone 1 Status Matrix\n\n| Tool | Available | Version proven | Fixture proven | Packaging required | Blocker |\n| --- | --- | --- | --- | --- | --- |\n${statusRows}\n`)
  writeText(`${reportDir}/milestone-1-decision.md`, `# Milestone 1 Decision\n\nDecision: \`${decision}\`\n\nNext prompt: \`${nextPrompt}\`\n\nMedia processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.\n`)
  writeText(`${reportDir}/validation-results.md`, `# Validation Results\n\nGenerated packet decision: \`${decision}\`.\n\nRequired diagnostics are expected to run after generation. Dependency-backed checks remain optional only when dependencies already exist without installation.\n`)
}

function writeJsonReports(artifacts) {
  writeJson(`${reportDir}/source-of-truth-audit.json`, artifacts.sourceAudit)
  writeJson(`${reportDir}/tool-availability-report.json`, artifacts.toolAvailabilityReport)
  writeJson(`${reportDir}/synthetic-fixture-policy.json`, artifacts.syntheticFixturePolicy)
  for (const proof of artifacts.proofReports) {
    const name = proof.id === 'imagemagick_graphicsmagick' ? 'imagemagick-graphicsmagick' : proof.id
    writeJson(`${reportDir}/${name}-proof-report.json`, proof)
  }
  writeJson(`${reportDir}/system-packaging-manifest.json`, artifacts.packagingManifest)
  writeJson(`${reportDir}/cpu-gpu-cost-performance-report.json`, artifacts.cpuGpuCostReport)
  writeJson(`${reportDir}/milestone-1-status-matrix.json`, artifacts.statusMatrix)
  writeJson(`${reportDir}/milestone-1-decision.json`, artifacts.decisionReport)
  writeJson(`${reportDir}/readiness-report.json`, artifacts.readinessReport)
  writeJson(`${reportDir}/private-artifact-manifest.json`, artifacts.privateArtifactManifest)
}

function writeNextPrompt(artifacts) {
  const decision = artifacts.decisionReport.decision
  if (decision === passDecision) {
    writeText(
      'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-qa-review.md',
      '# TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW\n\nReview the committed Milestone 1 CPU-only proof evidence before any broader Track B execution. Media processing, render/export, workers/routes/providers, Supabase/GCS, beta, and production remain blocked.\n',
    )
  } else {
    writeText(
      'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-system-packaging-approval.md',
      '# TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL\n\nApprove the exact CPU worker/container packaging path for missing Milestone 1 system binaries before rerunning ExifTool, MediaInfo, Tesseract, or ImageMagick/GraphicsMagick proofs. Do not install packages, mutate Dockerfiles, run media processing, or unlock runtime/product scopes without a separate execution prompt.\n',
    )
  }
}

function updateStatusDocs(artifacts) {
  const { decision, nextPrompt } = artifacts.decisionReport
  const body = `
TRACKB_MEDIA_OSS_MILESTONE_1_LOW_RISK_METADATA_TOOLING_EXECUTION:

- Decision: \`${decision}\`
- Owner: \`${ownerId}\`
- Scope: ExifTool, MediaInfo, Tesseract, and ImageMagick/GraphicsMagick only.
- CPU/GPU policy: CPU-only/default; no GPU.
- Current result: ${artifacts.readinessReport.readiness ? 'all four tools are version/fixture proven in bounded synthetic scope' : 'system binary packaging approval is required before Milestone 1 can pass'}.
- End-to-end product-ready Track B tools remain ` + '`0`' + `; no 40+ installed/proven end-to-end claim is allowed.
- Next prompt: \`${nextPrompt}\`
- Supabase classification: no write / environment none / SQL none / migration no.
`
  replaceOrAppend('docs/cross-chat/CURRENT_HANDOFF.md', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:start -->', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:end -->', body)
  replaceOrAppend('docs/cross-chat/NEXT_UNLOCK_LANES.md', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:start -->', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:end -->', body)
  replaceOrAppend('docs/cross-chat/BLOCKED_SCOPES.md', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:start -->', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:end -->', `${body}\nBlocked scopes remain: no FFmpeg/FFprobe, OpenCV, PyAV, PySceneDetect, PaddleOCR, PaddlePaddle, OpenColorIO, OpenImageIO, real user media, media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, or production.\n`)
  replaceOrAppend('docs/open-source-tool-stack/open-source-tool-stack-decision.md', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:start -->', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:end -->', body)
  replaceOrAppend('docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:start -->', '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:end -->', body)

  const ownerStatusPath = 'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json'
  const ownerStatus = readJson(ownerStatusPath)
  ownerStatus.milestone1Execution = {
    decision,
    reportKey: 'trackb_milestone_1_execution_reports',
    tools: artifacts.statusMatrix.tools,
    nextPrompt,
    executionScope: 'cpu_only_synthetic_fixtures_only',
    mediaProcessingAccepted: false,
    renderExportAccepted: false,
    workerRuntimeAccepted: false,
    betaProductionAccepted: false,
  }
  writeJson(ownerStatusPath, ownerStatus)
  replaceOrAppend(
    'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
    '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:start -->',
    '<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:end -->',
    body,
  )
}

export function buildTrackBMilestone1Plan() {
  return {
    phase: 'TRACKB_MEDIA_OSS_MILESTONE_1_LOW_RISK_METADATA_TOOLING_EXECUTION',
    branchName,
    baseBranch,
    expectedSourceSha,
    reportDir,
    requiredConfirmations: requiredConfirmations(),
    forbiddenConfirmations: forbiddenConfirmations(),
    tools: milestoneTools.map((tool) => tool.id),
    expectedConservativeDecision: expectedBlockedDecision,
    passDecision,
    packagingNextPrompt,
    qaNextPrompt,
  }
}

export function writeTrackBMilestone1Artifacts() {
  assertConfirmations()
  const artifacts = buildArtifacts()
  writeJsonReports(artifacts)
  writeMarkdownReports(artifacts)
  writeNextPrompt(artifacts)
  updateStatusDocs(artifacts)
  return artifacts
}

export function readTrackBMilestone1Artifacts() {
  return {
    sourceAudit: readJson(`${reportDir}/source-of-truth-audit.json`),
    toolAvailabilityReport: readJson(`${reportDir}/tool-availability-report.json`),
    syntheticFixturePolicy: readJson(`${reportDir}/synthetic-fixture-policy.json`),
    exiftoolProofReport: readJson(`${reportDir}/exiftool-proof-report.json`),
    mediainfoProofReport: readJson(`${reportDir}/mediainfo-proof-report.json`),
    tesseractProofReport: readJson(`${reportDir}/tesseract-proof-report.json`),
    imageMagickGraphicsMagickProofReport: readJson(`${reportDir}/imagemagick-graphicsmagick-proof-report.json`),
    packagingManifest: readJson(`${reportDir}/system-packaging-manifest.json`),
    cpuGpuCostReport: readJson(`${reportDir}/cpu-gpu-cost-performance-report.json`),
    statusMatrix: readJson(`${reportDir}/milestone-1-status-matrix.json`),
    decisionReport: readJson(`${reportDir}/milestone-1-decision.json`),
    readinessReport: readJson(`${reportDir}/readiness-report.json`),
    privateArtifactManifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  }
}

export function protectedFilesHaveNoDiff() {
  const diff = git(['diff', '--name-only', '--', ...protectedFiles])
  const cached = git(['diff', '--cached', '--name-only', '--', ...protectedFiles])
  return !diff && !cached
}

export function forbiddenOutputsPresent() {
  return forbiddenOutputs.filter((relativePath) => existsSync(join(repoRoot, relativePath)))
}

export { forbiddenToolIds, milestoneTools, supabaseClassification }
