import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const confirmation = process.env.REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_SYNTHETIC_FIXTURE_PROOF
const proofRoot = '/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1'
const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8)
const outputDir = join(proofRoot, runId)
const previousImageTag = 'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8'
const freshImageTag = `reeditpro-tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1:${runId}`

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function fileMeta(file) {
  return {
    file,
    bytes: statSync(file).size,
    sha256: sha256(file),
  }
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
  return fileMeta(file)
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
    proof: 'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1',
    decision: blocker,
    execution: blocker,
    runId,
    outputDir,
    imageTag: extra.imageTag || null,
    message,
    runtimeMediaExecution: false,
    privateOrUserMediaUsed: false,
    generatedSyntheticFixtureOnly: false,
    gstreamerPipelineExecution: false,
    mkvtoolnixSyntheticFixtureExecution: false,
    mkvtoolnixPrivateMediaExecution: false,
    ffmpegExecution: false,
    ffprobeExecution: false,
    dockerPush: false,
    deployment: false,
    generatedArtifactsCommitted: false,
    ...extra,
  }
  const reportMeta = writeJson('gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-blocked-report.json', report)
  const manifestMeta = writeJson('gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-blocked-manifest.json', {
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
    'blocked_pending_gstreamer_mkvtoolnix_synthetic_fixture_confirmation',
    'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_SYNTHETIC_FIXTURE_PROOF must be true before controlled synthetic fixture proof is allowed.',
  )
}

mkdirSync(outputDir, { recursive: true })

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

function assertNoForbiddenTool(args) {
  const commandText = args.join(' ')
  if (/\b(ffmpeg|ffprobe)\b/.test(commandText)) {
    failClosed('blocked_unexpected_ffmpeg_ffprobe_execution', 'Blocked FFmpeg/FFprobe command before execution.', {
      attemptedCommand: commandText,
    })
  }
}

function assertTmpFixturePath(file) {
  if (!file.startsWith(`${outputDir}/`)) {
    failClosed('blocked_unexpected_private_or_user_media', 'Blocked fixture path outside the generated /tmp proof directory.', {
      attemptedPath: file,
    })
  }
}

function dockerRun(imageTag, args, blocker, message, options = {}) {
  assertNoForbiddenTool(args)
  try {
    const stdout = run('docker', ['run', '--rm', '--network', 'none', ...(options.dockerArgs || []), imageTag, ...args])
    return {
      command: args.join(' '),
      dockerNetwork: 'none',
      status: 'passed',
      exitStatus: 0,
      stdout: sanitizeOutput(stdout),
    }
  } catch (error) {
    failClosed(blocker, message, {
      imageTag,
      command: args.join(' '),
      stdout: sanitizeOutput(error.stdout),
      stderr: sanitizeOutput(error.stderr || error.message),
    })
  }
}

function runGStreamerProof(imageTag) {
  return dockerRun(
    imageTag,
    ['gst-launch-1.0', '-q', 'fakesrc', 'num-buffers=3', '!', 'fakesink'],
    'blocked_gstreamer_synthetic_pipeline_failed',
    'GStreamer controlled synthetic fakesrc/fakesink pipeline failed.',
  )
}

function writeSyntheticSubtitleFixture() {
  const file = join(outputDir, 'synthetic.srt')
  assertTmpFixturePath(file)
  writeFileSync(file, [
    '1',
    '00:00:00,000 --> 00:00:00,500',
    'REEDITPRO TRACK A SYNTHETIC SUBTITLE',
    '',
  ].join('\n'))
  return fileMeta(file)
}

function runMkvToolNixProof(imageTag) {
  const subtitle = writeSyntheticSubtitleFixture()
  const output = join(outputDir, 'synthetic-subtitle-only.mkv')
  assertTmpFixturePath(output)

  const merge = dockerRun(
    imageTag,
    ['mkvmerge', '-o', '/proof/synthetic-subtitle-only.mkv', '/proof/synthetic.srt'],
    'blocked_mkvtoolnix_synthetic_fixture_failed',
    'MKVToolNix synthetic subtitle-only mux failed.',
    { dockerArgs: ['-v', `${outputDir}:/proof`] },
  )

  const identify = dockerRun(
    imageTag,
    ['mkvmerge', '--identify', '/proof/synthetic-subtitle-only.mkv'],
    'blocked_mkvtoolnix_synthetic_fixture_failed',
    'MKVToolNix synthetic subtitle-only identify failed.',
    { dockerArgs: ['-v', `${outputDir}:/proof:ro`] },
  )

  const outputMeta = fileMeta(output)

  return {
    subtitle,
    output: outputMeta,
    merge,
    identify,
  }
}

const image = ensureImage()
const gstreamerProof = runGStreamerProof(image.imageTag)
const mkvtoolnixProof = runMkvToolNixProof(image.imageTag)

const report = {
  proof: 'TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1',
  decision: 'completed_gstreamer_mkvtoolnix_controlled_synthetic_fixture_proof',
  execution: 'completed_controlled_synthetic_fixture_checks',
  runId,
  outputDir,
  imageTag: image.imageTag,
  imageSource: image.imageSource,
  prebuiltOutputGeneration: image.prebuiltOutputGeneration,
  macMetadataCleanup: image.macMetadataCleanup,
  gstreamer: {
    command: 'gst-launch-1.0 -q fakesrc num-buffers=3 ! fakesink',
    fixtureType: 'in_memory_fakesrc_fakesink',
    proof: gstreamerProof,
    readiness: 'ready_for_private_fixture_scope_decision',
  },
  mkvtoolnix: {
    fixtureType: 'generated_synthetic_subtitle_only_mkv',
    proof: mkvtoolnixProof,
    readiness: 'ready_for_private_fixture_scope_decision',
  },
  runtimeMediaExecution: false,
  privateOrUserMediaUsed: false,
  generatedSyntheticFixtureOnly: true,
  gstreamerPipelineExecution: 'controlled_synthetic_fakesrc_fakesink_only',
  mkvtoolnixSyntheticFixtureExecution: 'controlled_generated_srt_to_mkv_only',
  mkvtoolnixPrivateMediaExecution: false,
  ffmpegExecution: false,
  ffprobeExecution: false,
  dockerPush: false,
  deployment: false,
  generatedArtifactsCommitted: false,
}

const reportMeta = writeJson('gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-report.json', report)
const manifestMeta = writeJson('gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1-manifest.json', {
  runId,
  imageTag: image.imageTag,
  files: [
    mkvtoolnixProof.subtitle,
    mkvtoolnixProof.output,
    reportMeta,
  ],
  generatedArtifactsCommitted: false,
})

console.log('TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1 passed')
console.log(`runId: ${runId}`)
console.log(`outputDir: ${outputDir}`)
console.log(`imageTag: ${image.imageTag}`)
console.log(`report: ${reportMeta.file}`)
console.log(`manifest: ${manifestMeta.file}`)
