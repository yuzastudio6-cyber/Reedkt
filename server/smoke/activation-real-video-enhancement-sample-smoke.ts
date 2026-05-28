import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildRealVideoEnhancementSampleCommandPlans,
  buildRealVideoEnhancementSampleCropPlan,
  buildRealVideoEnhancementSampleReport,
  realVideoEnhancementSampleConfig,
  validateRealVideoEnhancementSampleEnv,
} from '../activation/real-video-enhancement-sample'
import type { RealVideoEnhancementSampleExecutionReport } from '../activation/real-video-enhancement-sample'

const runId = 'phase34d-smoke'
const sampleReport: RealVideoEnhancementSampleExecutionReport = {
  ok: true,
  runId,
  sourcePhase33DRunId: realVideoEnhancementSampleConfig.phase33dRunId,
  sourceFrameGcsUri: realVideoEnhancementSampleConfig.sourceFrameGcsUri,
  projectId: 'reeditpro',
  jobName: realVideoEnhancementSampleConfig.runtimeJobName,
  image: {
    image: realVideoEnhancementSampleConfig.runtimeTargetImage,
    digest: 'sha256:example',
  },
  gpu: { requested: true, type: 'nvidia-l4', count: 1, cudaAvailable: true, deviceName: 'NVIDIA L4' },
  model: {
    manifestId: realVideoEnhancementSampleConfig.modelManifestId,
    name: realVideoEnhancementSampleConfig.modelName,
    releaseVersion: realVideoEnhancementSampleConfig.modelReleaseVersion,
    gcsPath: realVideoEnhancementSampleConfig.modelGcsPath,
    runtimePath: realVideoEnhancementSampleConfig.modelRuntimePath,
    fileSha256: realVideoEnhancementSampleConfig.modelFileSha256,
    aggregateSha256: realVideoEnhancementSampleConfig.modelAggregateSha256,
    copiedFiles: ['RealESRGAN_x4plus.pth', 'file_checksums_sha256.txt', 'model_tree_manifest.json'],
  },
  sourceFrame: { gcsUri: realVideoEnhancementSampleConfig.sourceFrameGcsUri, width: 3840, height: 2160 },
  sampleCrop: {
    x: 1664,
    y: 824,
    width: 512,
    height: 512,
    reason: 'Centered 512x512 crop from the approved Phase 33D representative frame.',
    gcsUri: `gs://${realVideoEnhancementSampleConfig.generatedAssetsBucket}/activation-real-video/phase34d/${runId}/sample/input-sample.png`,
  },
  enhancedSample: {
    status: 'completed',
    width: 2048,
    height: 2048,
    scale: 4,
    gcsUri: `gs://${realVideoEnhancementSampleConfig.generatedAssetsBucket}/activation-real-video/phase34d/${runId}/enhanced/enhanced-sample.png`,
    metadataUri: `gs://${realVideoEnhancementSampleConfig.generatedAssetsBucket}/activation-real-video/phase34d/${runId}/metadata/before-after-metadata.json`,
    sizeBytes: 123456,
    sha256: 'example',
  },
  qa: {
    status: 'warning',
    gates: [
      { gateId: 'enhancement_artifacts', status: 'passed', summary: 'Enhanced sample exists.' },
      { gateId: 'render_asset_integrity', status: 'passed', summary: 'Artifacts exist.' },
      { gateId: 'sample_first_policy', status: 'passed', summary: 'Exactly one crop.' },
      { gateId: 'hallucination_risk', status: 'warning', summary: 'Human review needed.' },
      { gateId: 'oversharpening_risk', status: 'warning', summary: 'Human review needed.' },
      { gateId: 'texture_artifact_risk', status: 'warning', summary: 'Human review needed.' },
      { gateId: 'runtime_safety', status: 'passed', summary: 'No blocked runtime behavior.' },
    ],
    blockers: [],
    warnings: ['Human review warning-only.'],
  },
  artifacts: [],
  uploadedReport: {
    bucket: realVideoEnhancementSampleConfig.qaBucket,
    object: `activation-real-video/phase34d/${runId}/reports/phase34d-report.json`,
    gcsUri: `gs://${realVideoEnhancementSampleConfig.qaBucket}/activation-real-video/phase34d/${runId}/reports/phase34d-report.json`,
  },
  safety: {
    approvedPhase33DFrameOnly: true,
    exactlyOneBoundedSample: true,
    fullFrameEnhanced: false,
    fullVideoEnhancementExecuted: false,
    secondFrameOrVideoUsed: false,
    filmUsed: false,
    slowMotionExecuted: false,
    faceEnhanceRan: false,
    gfpganWeightsPresent: false,
    facexlibWeightsPresent: false,
    alternateRealEsrganWeightsPresent: false,
    providerExecuted: false,
    modelDownloadedExternally: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    rtxPro6000Used: false,
    revideoUsed: false,
  },
  blockers: [],
  warnings: ['Human review warning-only.'],
}

assert.deepEqual(validateRealVideoEnhancementSampleEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  sourceFrameGcsUri: realVideoEnhancementSampleConfig.sourceFrameGcsUri,
  modelManifestId: realVideoEnhancementSampleConfig.modelManifestId,
  modelGcsPath: realVideoEnhancementSampleConfig.modelGcsPath,
  fileSha256: realVideoEnhancementSampleConfig.modelFileSha256,
  aggregateSha256: realVideoEnhancementSampleConfig.modelAggregateSha256,
  gpuType: 'nvidia-l4',
  faceEnhance: 'false',
  providerExecution: 'false',
  modelDownloads: 'false',
}), [])
assert.ok(validateRealVideoEnhancementSampleEnv({ projectId: 'prod-reeditpro' }).length > 0, 'production-looking project must be blocked.')
assert.ok(validateRealVideoEnhancementSampleEnv({ sourceFrameGcsUri: 'gs://other/frame.png' }).length > 0, 'unapproved frame must be blocked.')
assert.ok(validateRealVideoEnhancementSampleEnv({ modelManifestId: 'film_frame_interpolation_evaluated_only_v1' }).length > 0, 'FILM must be blocked.')
assert.ok(validateRealVideoEnhancementSampleEnv({ faceEnhance: 'true' }).length > 0, 'GFPGAN/face enhancement must be blocked.')

const cropPlan = buildRealVideoEnhancementSampleCropPlan()
assert.equal(cropPlan.exactlyOneSample, true)
assert.equal(cropPlan.fullFrameEnhancementAllowed, false)
assert.equal(cropPlan.fullVideoEnhancementAllowed, false)
assert.equal(cropPlan.preferredCrop.width, 512)

const commands = buildRealVideoEnhancementSampleCommandPlans(runId, 'sha256:example')
assert.ok(commands.some((command) => command.commandId === 'deploy-job'), 'deploy command must exist.')
assert.ok(commands.some((command) => command.commandString.includes('phase34d_real_video_sample')), 'deploy command must use Phase 34D sample mode.')
assert.ok(commands.some((command) => command.commandString.includes('--gpu-type=nvidia-l4')), 'deploy command must use nvidia-l4.')
assert.ok(commands.every((command) => !/film|sam2|deepfilternet|demucs|huggingface-cli|snapshot_download|allUsers|allAuthenticatedUsers|rtx.pro.6000/i.test(command.commandString)), 'commands must not use FILM, SAM2, runtime model downloads, public principals, or RTX PRO 6000.')

const report = buildRealVideoEnhancementSampleReport({ executionReport: sampleReport, imageDigest: 'sha256:example' })
assert.equal(report.status, 'ready')
assert.equal(report.phase34EReadiness.readyForNextEnhancementPhase, true)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.fullVideoEnhancementAllowed, false)
assert.equal(report.slowMotionAllowed, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['smoke:activation-real-video-enhancement-sample'])
assert.ok(packageJson.scripts['activation:real-video:enhancement-sample'])
assert.ok(packageJson.scripts['activation:real-video:enhancement-sample:report'])

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_phase33d_frame_only',
    'exactly_one_bounded_sample',
    'real_esrgan_x4plus_only',
    'film_blocked',
    'full_frame_and_full_video_blocked',
    'gfpgan_facexlib_face_enhancement_blocked',
    'runtime_downloads_blocked',
    'qa_gates',
    'false_launch_gates',
    'package_scripts',
  ],
}))
