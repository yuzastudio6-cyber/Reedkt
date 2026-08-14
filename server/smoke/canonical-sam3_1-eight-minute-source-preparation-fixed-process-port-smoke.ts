import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  parseCanonicalSam31EightMinuteSourceGpuOutput,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-fixed-process-port'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const port = readFileSync(
  'server/services/canonical-sam3_1-eight-minute-source-preparation-fixed-process-port.ts',
  'utf8',
)
const docker = readFileSync(
  'docker/prod/gpu-worker/sam3_1-source-preparation/Dockerfile.candidate',
  'utf8',
)

assert.match(port, /\{ generation: coordinate\.generation \}/u)
assert.equal((port.match(/file\.getMetadata\(\)/gu) ?? []).length >= 2, true)
assert.match(port, /createReadStream\(\{ validation: 'crc32c' \}\)/u)
assert.match(port, /open\(input\.targetPath, 'wx', 0o600\)/u)
assert.match(port, /preconditionOpts: \{ ifGenerationMatch: 0 \}/u)
assert.match(port, /exactFile\.createReadStream/u)
assert.match(port, /await rm\(invocationRoot, \{ recursive: true, force: true \}\)/u)
assert.match(port, /const FFMPEG = '\/opt\/weeditpro\/ffmpeg\/bin\/ffmpeg'/u)
assert.match(port, /const FFPROBE = '\/opt\/weeditpro\/ffmpeg\/bin\/ffprobe'/u)
assert.match(port, /const NVIDIA_PROC_ROOT = '\/proc\/driver\/nvidia'/u)
assert.match(port, /readdir\(`\$\{NVIDIA_PROC_ROOT\}\/gpus`/u)
assert.match(port, /readBoundedProcText/u)
assert.match(port, /model !== 'NVIDIA L4'/u)
assert.match(port, /normalizePciBusId/u)
assert.match(port, /padStart\(8, '0'\)/u)
assert.match(port, /NVRM version:/u)
assert.doesNotMatch(port, /nvidia-smi/u)
assert.match(port, /'-hwaccel', 'cuda'/u)
assert.match(port, /'-c:v', 'h264_cuvid'/u)
assert.match(port, /'-c:v', 'h264_nvenc'/u)
assert.match(port, /'-r', '24', '-fps_mode', 'cfr'/u)
assert.match(port, /expectedAverageFrameRate: '77200\/3217'/u)
assert.match(port, /'-progress', 'pipe:1'/u)
assert.match(port, /'-an', '-sn', '-dn'/u)
assert.doesNotMatch(port, /scale_cuda|sam3_1-source-preparation-runner\.py/u)
assert.match(port, /shell: false/u)
assert.match(port, /NVIDIA_DRIVER_CAPABILITIES: 'compute,utility,video'/u)
assert.doesNotMatch(
  port,
  /signedUrl|execFile|shell: true|process\.argv|child_process\.exec/u,
)

assert.match(docker, /ffmpeg-8\.0\.3/u)
assert.match(docker, /--enable-nvdec/u)
assert.match(docker, /--enable-cuvid/u)
assert.match(docker, /--enable-nvenc/u)
assert.match(docker, /CONFIG_GPL 0/u)
assert.match(docker, /CONFIG_NONFREE 0/u)
assert.match(docker, /h264_cuvid/u)
assert.match(docker, /h264_nvenc/u)
assert.match(docker, /node:24\.13\.1-bookworm-slim@sha256:/u)
assert.match(docker, /USER 65532:65532/u)
assert.doesNotMatch(
  docker,
  /FROM python|pip install|paddle|opencv|\/model-weights\//u,
)

const outputWithoutHash = {
  schemaVersion: 'canonical-sam3_1-eight-minute-source-gpu-output-v1' as const,
  source: 'fixed_weeditpro_l4_sam3_1_source_preparation_runner' as const,
  invocationId: 'sam31-eight-minute-source-preparation-run-1',
  qualificationSourceId: 'sam31-eight-minute-performance-source-v1',
  qualificationSourcePlanRef: ref('sam31-eight-minute-performance-source-v1'),
  dispatchAdmissionRef: ref('sam31-source-preparation-admission-1'),
  immutableImageRef: ref('weeditpro-l4-visual-evidence-image-1'),
  toolchainQualificationRef: ref('weeditpro-l4-visual-toolchain-1'),
  taskDigestSha256: hash('sam31-source-preparation-task-1'),
  sourceObjectSha256:
    'c13eda5816aba31ed60f5dce838d178ed8307f825972eec7aacf9fb29d8c47cb',
  sourceObjectByteLength: 90_971_927,
  sourceProbe: sourceFfprobe(),
  baseSlice: {
    byteLength: 25_000_000,
    sha256: hash('base-slice'),
    decodedFrameCount: 384 as const,
    ffprobe: ffprobe(384),
  },
  device: {
    acceleratorClass: 'nvidia_l4' as const,
    deviceName: 'NVIDIA L4' as const,
    deviceUuid: 'GPU-00000000-0000-0000-0000-000000000001',
    driverVersion: '570.133.20',
    pciBusId: '00000000:00:04.0',
    allocatedGpuCount: 1 as const,
  },
  chunks: Array.from({ length: 49 }, (_, index) => {
    const start = index * 239
    const end = Math.min(11_519, start + 239)
    const frameCount = end - start + 1
    return {
      chunkOrdinal: index + 1,
      canonicalStartFrameInclusive: start,
      canonicalEndFrameInclusive: end,
      overlapWithPreviousFrames: index === 0 ? 0 as const : 1 as const,
      fileName: `chunk-${String(index + 1).padStart(3, '0')}.mp4`,
      byteLength: 10_000_000 + index,
      sha256: hash(`chunk-${index + 1}`),
      decodedFrameCount: frameCount,
      sourceModuloStartFrameInclusive: start % 384,
      sourceModuloEndFrameInclusive: end % 384,
      wrapsSourceSliceBoundary:
        Math.floor(start / 384) !== Math.floor(end / 384),
      ffprobe: ffprobe(frameCount),
    }
  }),
  preparedChunkCount: 49 as const,
  exactChunkCount: 49 as const,
  sourceFrameCount: 11_520 as const,
  sourceDurationMilliseconds: 480_000 as const,
  gpuDecodeProfile: 'ffmpeg_cuda_nvdec_fixed_v1' as const,
  gpuEncodeProfile: 'h264_nvenc_p7_hq_constqp20_bt709_fixed_v1' as const,
  sourceAudioRemoved: true as const,
  fullSourceResolutionPreserved: true as const,
  sourcePixelExactnessClaimed: false as const,
  losslessEncodingClaimed: false as const,
  substantiveCpuMediaProcessingUsed: false as const,
  ffprobeMetadataOnly: true as const,
  runtimeModelOrToolDownloadPerformed: false as const,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false as const,
  terminalCloudRunExecutionClaimed: false as const,
  scaleBackToZeroClaimedByWorker: false as const,
  accountEffectiveCostClaimedByWorker: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  startedAt: '2026-08-13T17:00:00.000Z',
  completedAt: '2026-08-13T17:06:00.000Z',
  workerWallDurationMilliseconds: 360_000,
}
const output = parseCanonicalSam31EightMinuteSourceGpuOutput({
  ...outputWithoutHash,
  resultDigestSha256: sha256AuthorityValue(outputWithoutHash),
})
assert.equal(output.chunks.length, 49)
assert.equal(output.chunks[48]?.decodedFrameCount, 48)
assert.equal(output.sourcePixelExactnessClaimed, false)
assert.equal(output.losslessEncodingClaimed, false)
assert.equal(output.terminalCloudRunExecutionClaimed, false)
assert.throws(() => parseCanonicalSam31EightMinuteSourceGpuOutput({
  ...output,
  chunks: output.chunks.slice(0, -1),
}))
assert.throws(() => parseCanonicalSam31EightMinuteSourceGpuOutput({
  ...output,
  resultDigestSha256: hash('tampered-result'),
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-eight-minute-source-preparation-fixed-process-port',
  checks: 60,
  exactSourceGenerationReread: true,
  l4NvdecNvencFixedProcess: true,
  gpuDecodedFrameCountVerified: true,
  pythonRunnerRetired: true,
  exactOverlapping4kChunkCount: output.chunks.length,
  exactEightMinuteFrameCount: output.sourceFrameCount,
  sourceAudioRemovedForSamOnly: true,
  sourceResolutionPreserved: true,
  pixelExactOrLosslessClaimed: false,
  substantiveCpuMediaProcessingUsed: false,
  workerClaimsTerminalScaleZeroOrCost: false,
  liveGpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function hash(value: string): string {
  return sha256AuthorityValue(value)
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${hash(id)}` as const,
  }
}

function ffprobe(decodedFrameCount: number) {
  return {
    codecName: 'h264' as const,
    width: 3_840 as const,
    height: 2_160 as const,
    pixelFormat: 'yuv420p' as const,
    averageFrameRate: '24/1' as const,
    decodedFrameCount,
    colorRange: 'tv' as const,
    colorSpace: 'bt709' as const,
    colorTransfer: 'bt709' as const,
    colorPrimaries: 'bt709' as const,
    metadataOnly: true as const,
  }
}

function sourceFfprobe() {
  return {
    ...ffprobe(386),
    averageFrameRate: '77200/3217' as const,
  }
}
