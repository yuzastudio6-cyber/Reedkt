import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const confirmation = process.env.REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_NO_MEDIA_RUNTIME_PROOF
const proofRoot = '/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1'
const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8)
const outputDir = join(proofRoot, runId)
const previousImageTag = 'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8'
const freshImageTag = `reeditpro-tracka-gstreamer-mkvtoolnix-no-media-runtime-proof-1:${runId}`

const noMediaChecks = [
  { id: 'path_gst_launch', category: 'command_path', command: 'command -v gst-launch-1.0' },
  { id: 'path_gst_inspect', category: 'command_path', command: 'command -v gst-inspect-1.0' },
  { id: 'path_mkvmerge', category: 'command_path', command: 'command -v mkvmerge' },
  { id: 'version_gst_launch', category: 'version_help', command: 'gst-launch-1.0 --version' },
  { id: 'version_gst_inspect', category: 'version_help', command: 'gst-inspect-1.0 --version' },
  { id: 'version_mkvmerge', category: 'version_help', command: 'mkvmerge --version' },
  { id: 'plugin_coreelements', category: 'plugin_availability', command: 'gst-inspect-1.0 coreelements' },
  { id: 'plugin_fakesrc', category: 'plugin_availability', command: 'gst-inspect-1.0 fakesrc' },
  { id: 'plugin_fakesink', category: 'plugin_availability', command: 'gst-inspect-1.0 fakesink' },
]

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function sanitizeOutput(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .slice(0, 18)
    .join('\n')
    .slice(0, 1800)
}

function writeJson(name, value) {
  mkdirSync(outputDir, { recursive: true })
  const file = join(outputDir, name)
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
  return {
    file,
    bytes: Buffer.byteLength(readFileSync(file)),
    sha256: sha256(file),
  }
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: process.env.DEVELOPER_DIR || '/Library/Developer/CommandLineTools',
      ...(options.env || {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function failClosed(blocker, message, extra = {}) {
  const report = {
    proof: 'TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1',
    decision: blocker,
    execution: blocker,
    runId,
    outputDir,
    imageTag: extra.imageTag || null,
    message,
    runtimeMediaExecution: false,
    gstreamerPipelineExecution: false,
    mkvtoolnixMediaExecution: false,
    ffmpegExecution: false,
    ffprobeExecution: false,
    dockerPush: false,
    deployment: false,
    generatedArtifactsCommitted: false,
    ...extra,
  }
  const reportMeta = writeJson('gstreamer-mkvtoolnix-no-media-runtime-proof-1-blocked-report.json', report)
  const manifestMeta = writeJson('gstreamer-mkvtoolnix-no-media-runtime-proof-1-blocked-manifest.json', {
    runId,
    blocker,
    report: reportMeta,
    generatedArtifactsCommitted: false,
  })
  console.error(`${blocker}: ${message}`)
  console.error(`report: ${reportMeta.file}`)
  console.error(`manifest: ${manifestMeta.file}`)
  process.exit(1)
}

if (confirmation !== 'true') {
  failClosed(
    'blocked_pending_gstreamer_mkvtoolnix_no_media_runtime_confirmation',
    'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_NO_MEDIA_RUNTIME_PROOF must be true before no-media runtime checks are allowed.',
  )
}

function trackedFiles() {
  return new Set(run('git', ['ls-files', '-z']).split('\0').filter(Boolean))
}

function collectMacMetadataFiles(root = '.', prefix = '') {
  const files = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
    const absolutePath = join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectMacMetadataFiles(absolutePath, relativePath))
    } else if (entry.isFile() && (entry.name.startsWith('._') || entry.name === '.DS_Store')) {
      files.push({ relativePath, absolutePath })
    }
  }
  return files
}

function removeUntrackedMacMetadataFiles() {
  const tracked = trackedFiles()
  const removed = []
  const skippedTracked = []
  for (const candidate of collectMacMetadataFiles()) {
    if (tracked.has(candidate.relativePath)) {
      skippedTracked.push(candidate.relativePath)
      continue
    }
    rmSync(candidate.absolutePath, { force: true })
    removed.push(candidate.relativePath)
  }
  return {
    removedUntrackedMacMetadataFiles: removed,
    skippedTrackedMacMetadataFiles: skippedTracked,
    removedUntrackedMacMetadataFileCount: removed.length,
    skippedTrackedMacMetadataFileCount: skippedTracked.length,
  }
}

function ensurePrebuiltOutputs() {
  const commands = [
    ['npm', ['run', 'build:remotion-worker:mock']],
    ['npm', ['run', 'build:staging-fixture-worker']],
    ['npm', ['run', 'build:staging-real-video-export-worker']],
  ]
  const results = []
  for (const [command, args] of commands) {
    run(command, args, { env: { COPYFILE_DISABLE: '1' } })
    results.push(`${command} ${args.join(' ')}`)
  }
  return results
}

function imageExists(imageTag) {
  try {
    run('docker', ['image', 'inspect', imageTag, '--format', '{{.Id}}'])
    return true
  } catch {
    return false
  }
}

function ensureImage() {
  try {
    run('docker', ['info', '--format', '{{.ServerVersion}}'])
  } catch (error) {
    failClosed('blocked_docker_daemon_unavailable', 'Docker daemon is unavailable or docker is not callable.', {
      stderr: sanitizeOutput(error.stderr || error.message),
    })
  }

  if (imageExists(previousImageTag)) {
    return {
      imageTag: previousImageTag,
      imageSource: 'reused_local_609_proof_image',
      prebuiltOutputGeneration: [],
      macMetadataCleanup: { reusedImageNoCleanupRequired: true },
    }
  }

  const prebuiltOutputGeneration = ensurePrebuiltOutputs()
  const requiredOutputs = ['dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']
  const missingOutputs = requiredOutputs.filter((dir) => !existsSync(dir))
  if (missingOutputs.length > 0) {
    failClosed('blocked_render_worker_image_unavailable', 'Required prebuilt worker outputs were unavailable before image build.', {
      requiredOutputs,
      missingOutputs,
      prebuiltOutputGeneration,
    })
  }

  const macMetadataCleanup = removeUntrackedMacMetadataFiles()
  try {
    run('docker', [
      'build',
      '-f',
      'docker/prod/render-worker/Dockerfile',
      '-t',
      freshImageTag,
      '.',
    ])
  } catch (error) {
    failClosed('blocked_render_worker_image_unavailable', 'Render-worker proof image was unavailable and fresh local build failed.', {
      imageTag: freshImageTag,
      prebuiltOutputGeneration,
      macMetadataCleanup,
      stderr: sanitizeOutput(error.stderr || error.message),
    })
  }

  return {
    imageTag: freshImageTag,
    imageSource: 'fresh_local_render_worker_build',
    prebuiltOutputGeneration,
    macMetadataCleanup,
  }
}

function assertAllowedCheck(check) {
  if (/gst-launch-1\.0\s+(?!(-{1,2}version)\b)/.test(check.command)) {
    failClosed('blocked_unexpected_gstreamer_pipeline_execution', 'Blocked a GStreamer pipeline command before execution.', { attemptedCommand: check.command })
  }
  if (/mkvmerge\s+(?!(-{1,2}version)\b)/.test(check.command)) {
    failClosed('blocked_unexpected_mkvtoolnix_media_execution', 'Blocked an MKVToolNix media command before execution.', { attemptedCommand: check.command })
  }
  if (/\b(ffmpeg|ffprobe)\b/.test(check.command)) {
    failClosed('blocked_no_media_runtime_command_check_failed', 'Blocked FFmpeg/FFprobe command before execution.', { attemptedCommand: check.command })
  }
}

function runNoMediaCheck(imageTag, check) {
  assertAllowedCheck(check)
  try {
    const stdout = run('docker', [
      'run',
      '--rm',
      '--network',
      'none',
      '--entrypoint',
      'sh',
      imageTag,
      '-lc',
      check.command,
    ])
    return {
      ...check,
      status: 'passed',
      exitStatus: 0,
      stdout: sanitizeOutput(stdout),
    }
  } catch (error) {
    const blocker = check.category === 'command_path'
      ? 'blocked_no_media_command_path_check_failed'
      : 'blocked_no_media_runtime_command_check_failed'
    failClosed(blocker, `No-media check failed: ${check.id}`, {
      imageTag,
      failedCheck: check,
      stdout: sanitizeOutput(error.stdout),
      stderr: sanitizeOutput(error.stderr || error.message),
    })
  }
}

const image = ensureImage()
const checks = noMediaChecks.map((check) => runNoMediaCheck(image.imageTag, check))

const report = {
  proof: 'TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1',
  decision: 'completed_gstreamer_mkvtoolnix_no_media_runtime_proof',
  execution: 'completed_no_media_runtime_command_checks',
  runId,
  outputDir,
  imageTag: image.imageTag,
  imageSource: image.imageSource,
  prebuiltOutputGeneration: image.prebuiltOutputGeneration,
  macMetadataCleanup: image.macMetadataCleanup,
  checks,
  gstreamer: {
    commandPaths: checks.filter((check) => check.id.startsWith('path_gst')).map((check) => check.stdout),
    noMediaRuntimeProof: 'passed',
    pipelineExecution: 'not_run',
    readiness: 'ready_for_controlled_synthetic_fixture_planning',
  },
  mkvtoolnix: {
    commandPath: checks.find((check) => check.id === 'path_mkvmerge')?.stdout || '',
    noMediaRuntimeProof: 'passed',
    mediaExecution: 'not_run',
    readiness: 'ready_for_controlled_synthetic_fixture_planning',
  },
  runtimeMediaExecution: false,
  gstreamerPipelineExecution: false,
  mkvtoolnixMediaExecution: false,
  ffmpegExecution: false,
  ffprobeExecution: false,
  dockerPush: false,
  deployment: false,
  generatedArtifactsCommitted: false,
}

const reportMeta = writeJson('gstreamer-mkvtoolnix-no-media-runtime-proof-1-report.json', report)
const manifestMeta = writeJson('gstreamer-mkvtoolnix-no-media-runtime-proof-1-manifest.json', {
  runId,
  imageTag: image.imageTag,
  files: [reportMeta],
  generatedArtifactsCommitted: false,
})

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1 passed')
console.log(`runId: ${runId}`)
console.log(`outputDir: ${outputDir}`)
console.log(`imageTag: ${image.imageTag}`)
console.log(`report: ${reportMeta.file}`)
console.log(`manifest: ${manifestMeta.file}`)
