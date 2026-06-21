import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const confirmation = process.env.REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF
const proofRoot = '/tmp/reeditpro-tracka-native-container-render-tools-build-proof-3'
const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8)
const outputDir = join(proofRoot, runId)
const imageTag = `reeditpro-tracka-native-container-render-tools-build-proof-3:${runId}`

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
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

function failClosed(blocker, message, extra = {}) {
  const report = {
    proof: 'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3',
    decision: blocker,
    execution: blocker === 'blocked_pending_native_container_build_confirmation'
      ? 'blocked_confirmation_absent'
      : 'blocked_before_or_during_build',
    runtimeMediaExecution: false,
    dockerBuildPushed: false,
    deployed: false,
    imageTag: blocker === 'blocked_pending_native_container_build_confirmation' ? null : imageTag,
    outputDir,
    message,
    ...extra,
  }
  const reportMeta = writeJson('build-proof-3-blocked-report.json', report)
  const manifestMeta = writeJson('build-proof-3-blocked-manifest.json', {
    runId,
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
    'blocked_pending_native_container_build_confirmation',
    'REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF must be true before a local render-worker Docker build is allowed.',
  )
}

const requiredPrebuiltWorkerOutputs = [
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]
const missingPrebuiltWorkerOutputs = requiredPrebuiltWorkerOutputs.filter((dir) => !existsSync(dir))
if (missingPrebuiltWorkerOutputs.length > 0) {
  failClosed(
    'blocked_missing_prebuilt_worker_outputs',
    'Required prebuilt worker output directories are missing before Docker build.',
    {
      requiredPrebuiltWorkerOutputs,
      missingPrebuiltWorkerOutputs,
    },
  )
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

try {
  run('docker', ['info', '--format', '{{.ServerVersion}}'])
} catch (error) {
  failClosed('blocked_docker_daemon_unavailable', 'Docker daemon is unavailable or docker is not callable.', {
    stderr: String(error.stderr || error.message || '').slice(0, 2000),
  })
}

try {
  run('docker', [
    'build',
    '-f',
    'docker/prod/render-worker/Dockerfile',
    '-t',
    imageTag,
    '.',
  ])
} catch (error) {
  const stderr = String(error.stderr || error.message || '')
  const isBuildContextFailure = /load build context|load \.dockerignore|failed to xattr|readdir: failed to xattr|error from sender/i.test(stderr)
  failClosed(
    isBuildContextFailure ? 'blocked_docker_build_context_transfer_failed' : 'blocked_render_worker_docker_build_failed',
    isBuildContextFailure ? 'Docker build context transfer failed before render-worker image build completed.' : 'Render-worker Docker build failed.',
    {
      stderr: stderr.slice(0, 4000),
    },
  )
}

let metadataOutput = ''
try {
  metadataOutput = run('docker', [
    'run',
    '--rm',
    imageTag,
    'sh',
    '-lc',
    [
      'dpkg-query -W -f="${Package}\\t${Version}\\n" gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-tools mkvtoolnix',
      'command -v gst-launch-1.0',
      'command -v mkvmerge',
    ].join(' && '),
  ])
} catch (error) {
  failClosed('blocked_metadata_install_verification_failed', 'Metadata-only package/path verification failed.', {
    stderr: String(error.stderr || error.message || '').slice(0, 4000),
  })
}

const report = {
  proof: 'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3',
  decision: 'completed_render_worker_docker_build_install_metadata_proof_with_identity_reviews',
  execution: 'completed_docker_build_metadata_only',
  runId,
  outputDir,
  imageTag,
  dockerfile: 'docker/prod/render-worker/Dockerfile',
  requiredPrebuiltWorkerOutputs,
  prebuiltWorkerOutputsStatus: 'present_generated_by_safe_build_scripts_not_committed',
  metadataVerification: 'passed',
  metadataOutput,
  runtimeMediaExecution: false,
  gstreamerPipelineExecution: false,
  mkvtoolnixMediaExecution: false,
  ffmpegExecution: false,
  ffprobeExecution: false,
  dockerPush: false,
  deployment: false,
  generatedArtifactsCommitted: false,
}

const reportMeta = writeJson('build-proof-3-report.json', report)
const manifestMeta = writeJson('build-proof-3-manifest.json', {
  runId,
  imageTag,
  files: [reportMeta],
})

console.log('TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 passed')
console.log(`runId: ${runId}`)
console.log(`outputDir: ${outputDir}`)
console.log(`report: ${reportMeta.file}`)
console.log(`manifest: ${manifestMeta.file}`)
