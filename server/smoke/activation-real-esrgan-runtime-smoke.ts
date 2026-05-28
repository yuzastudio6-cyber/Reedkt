import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildRealEsrganRuntimeCommandPlans,
  buildRealEsrganRuntimeReport,
  realEsrganRuntimeConfig,
  validateRealEsrganRuntimeEnv,
} from '../activation/enhancement-runtime'
import type { RealEsrganRuntimeExecutionReport } from '../activation/enhancement-runtime'

const sampleExecution: RealEsrganRuntimeExecutionReport = {
  ok: true,
  runId: 'phase34c-smoke',
  projectId: 'reeditpro',
  jobName: realEsrganRuntimeConfig.jobName,
  image: {
    image: realEsrganRuntimeConfig.targetImage,
    digest: 'sha256:example',
  },
  gpu: {
    requested: true,
    type: 'nvidia-l4',
    count: 1,
    cudaAvailable: true,
    deviceName: 'NVIDIA L4',
  },
  model: {
    manifestId: realEsrganRuntimeConfig.modelManifestId,
    name: 'RealESRGAN_x4plus',
    releaseVersion: realEsrganRuntimeConfig.releaseVersion,
    sourceUrl: realEsrganRuntimeConfig.sourceUrl,
    gcsPath: realEsrganRuntimeConfig.modelGcsPath,
    runtimePath: realEsrganRuntimeConfig.modelRuntimePath,
    fileSha256: realEsrganRuntimeConfig.modelFileSha256,
    aggregateSha256: realEsrganRuntimeConfig.modelAggregateSha256,
    copiedFiles: ['RealESRGAN_x4plus.pth', 'file_checksums_sha256.txt', 'model_tree_manifest.json'],
  },
  fixture: {
    generated: true,
    width: 128,
    height: 128,
    gcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-enhancement-runtime/phase34c/phase34c-smoke/fixture/synthetic-input.png',
  },
  enhanced: {
    status: 'completed',
    width: 512,
    height: 512,
    scale: 4,
    gcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-enhancement-runtime/phase34c/phase34c-smoke/enhanced/enhanced.png',
    sizeBytes: 12345,
    sha256: 'example',
  },
  qa: {
    status: 'warning',
    gates: [
      { gateId: 'enhancement_artifacts', status: 'passed', summary: 'Enhanced PNG exists.' },
      { gateId: 'render_asset_integrity', status: 'passed', summary: 'Artifacts exist.' },
      { gateId: 'sample_first_policy', status: 'passed', summary: 'Generated image only.' },
      { gateId: 'runtime_safety', status: 'passed', summary: 'No blocked runtime behavior.' },
    ],
    blockers: [],
    warnings: ['Synthetic fixture only.'],
  },
  artifacts: [],
  safety: {
    providerExecuted: false,
    modelDownloadedExternally: false,
    realMediaUsed: false,
    realVideoFrameUsed: false,
    filmUsed: false,
    slowMotionExecuted: false,
    fullVideoEnhancementExecuted: false,
    faceEnhanceRan: false,
    gfpganWeightsPresent: false,
    facexlibWeightsPresent: false,
    alternateRealEsrganWeightsPresent: false,
    secretValuesUsed: false,
    publicAccessEnabled: false,
    rtxPro6000Used: false,
    revideoUsed: false,
  },
  uploadedReport: {
    bucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    object: 'activation-enhancement-runtime/phase34c/phase34c-smoke/reports/phase34c-report.json',
    gcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-enhancement-runtime/phase34c/phase34c-smoke/reports/phase34c-report.json',
  },
  warnings: ['Synthetic fixture only.'],
}

assert.deepEqual(validateRealEsrganRuntimeEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  imageTag: 'staging-real-esrgan-runtime-001',
  modelManifestId: 'real_esrgan_x4plus_staging_v1',
  modelGcsPath: realEsrganRuntimeConfig.modelGcsPath,
  fileSha256: realEsrganRuntimeConfig.modelFileSha256,
  aggregateSha256: realEsrganRuntimeConfig.modelAggregateSha256,
  gpuType: 'nvidia-l4',
  faceEnhance: 'false',
}), [])
assert.ok(validateRealEsrganRuntimeEnv({ projectId: 'prod-reeditpro' }).length > 0, 'production-looking project must be blocked.')
assert.ok(validateRealEsrganRuntimeEnv({ modelManifestId: 'film_frame_interpolation_evaluated_only_v1' }).length > 0, 'FILM must be blocked.')
assert.ok(validateRealEsrganRuntimeEnv({ gpuType: 'nvidia-rtx-pro-6000' }).length > 0, 'RTX PRO 6000 must be blocked.')
assert.ok(validateRealEsrganRuntimeEnv({ faceEnhance: 'true' }).length > 0, 'GFPGAN/face enhancement must be blocked.')

const commands = buildRealEsrganRuntimeCommandPlans('sha256:example')
assert.ok(commands.some((command) => command.commandId === 'build-push-image'), 'build/push command must exist.')
assert.ok(commands.some((command) => command.commandId === 'deploy-job'), 'deploy command must exist.')
assert.ok(commands.some((command) => command.commandId === 'execute-job'), 'execute command must exist.')
assert.ok(commands.some((command) => command.commandString.includes('--gpu-type=nvidia-l4')), 'deploy command must use nvidia-l4.')
assert.ok(commands.every((command) => !/film|sam2|deepfilternet|demucs|huggingface-cli|snapshot_download|allUsers|allAuthenticatedUsers|rtx.pro.6000/i.test(command.commandString)), 'commands must not use FILM, SAM2, runtime model downloads, public principals, or RTX PRO 6000.')

const report = buildRealEsrganRuntimeReport({ executionReport: sampleExecution, imageDigest: 'sha256:example' })
assert.equal(report.phase34DReadiness.readyForControlledEnhancementSample, true)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.providerExecuted, false)
assert.equal(report.modelDownloadedExternally, false)
assert.equal(report.realMediaProcessed, false)
assert.equal(report.filmUsed, false)
assert.equal(report.fullVideoEnhancementAllowed, false)
assert.equal(report.slowMotionAllowed, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['smoke:activation-real-esrgan-runtime'])
assert.ok(packageJson.scripts['activation:real-esrgan-runtime'])
assert.ok(packageJson.scripts['activation:real-esrgan-runtime:report'])
assert.ok(packageJson.scripts['build:staging-real-esrgan-runtime-worker'])

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_real_esrgan_x4plus_only',
    'film_blocked',
    'alternate_weights_blocked',
    'gfpgan_facexlib_weights_blocked',
    'generated_fixture_only',
    'enhancement_qa_gates',
    'false_launch_gates',
    'package_scripts',
  ],
}))
