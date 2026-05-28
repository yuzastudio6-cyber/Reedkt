import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  birefnetRuntimeConfig,
  buildBiRefNetRuntimeCommandPlans,
  buildBiRefNetRuntimeReport,
  validateBiRefNetRuntimeEnv,
} from '../activation/mask-runtime'
import type { BiRefNetRuntimeExecutionReport } from '../activation/mask-runtime'

const sampleExecution: BiRefNetRuntimeExecutionReport = {
  ok: true,
  runId: 'phase33c-smoke',
  projectId: 'reeditpro',
  jobName: birefnetRuntimeConfig.jobName,
  image: {
    image: birefnetRuntimeConfig.targetImage,
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
    manifestId: 'birefnet_main_staging_v1',
    name: 'ZhengPeng7/BiRefNet',
    revision: birefnetRuntimeConfig.modelRevision,
    gcsPath: birefnetRuntimeConfig.modelGcsPath,
    runtimePath: birefnetRuntimeConfig.modelRuntimePath,
    aggregateSha256: birefnetRuntimeConfig.modelAggregateSha256,
    copiedFiles: ['BiRefNet_config.py', 'birefnet.py', 'handler.py', 'model.safetensors', 'file_checksums_sha256.txt', 'model_tree_manifest.json'],
  },
  customCodeScan: {
    customCodeFiles: ['BiRefNet_config.py', 'birefnet.py', 'handler.py'],
    executedAllowlist: ['BiRefNet_config.py', 'birefnet.py'],
    neverImportedFiles: ['handler.py'],
    blockedPatterns: ['requests/network imports in executed files'],
    warnings: ['handler.py includes network helper behavior and was not imported.'],
    blockers: [],
  },
  fixture: {
    generated: true,
    width: 512,
    height: 512,
    gcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-mask-runtime/phase33c/phase33c-smoke/fixture/synthetic-input.png',
  },
  mask: {
    status: 'completed',
    width: 512,
    height: 512,
    nonZeroRatio: 0.35,
    meanAlpha: 0.42,
    maskUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-mask-runtime/phase33c/phase33c-smoke/mask/mask.png',
    cutoutUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-mask-runtime/phase33c/phase33c-smoke/mask/cutout.png',
  },
  qa: {
    status: 'warning',
    gates: [
      { gateId: 'mask_edge_quality', status: 'passed', summary: 'Mask has separation.' },
      { gateId: 'mask_subject_coverage', status: 'passed', summary: 'Coverage is non-empty and not full-frame.' },
      { gateId: 'render_asset_integrity', status: 'passed', summary: 'Artifacts exist.' },
      { gateId: 'mask_temporal_stability', status: 'not_applicable', summary: 'Single image only.' },
    ],
    blockers: [],
    warnings: ['Temporal stability is not applicable.'],
  },
  artifacts: [],
  safety: {
    providerExecuted: false,
    modelDownloadedExternally: false,
    realMediaUsed: false,
    realVideoFrameUsed: false,
    sam2Used: false,
    textBehindSubjectExecuted: false,
    secretValuesUsed: false,
    publicAccessEnabled: false,
    rtxPro6000Used: false,
    revideoUsed: false,
  },
  uploadedReport: {
    bucket: 'reeditpro-staging-reeditpro-qa-artifacts',
    object: 'activation-mask-runtime/phase33c/phase33c-smoke/reports/phase33c-report.json',
    gcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-mask-runtime/phase33c/phase33c-smoke/reports/phase33c-report.json',
  },
  warnings: ['handler.py includes network helper behavior and was not imported.'],
}

assert.deepEqual(validateBiRefNetRuntimeEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  imageTag: 'staging-birefnet-runtime-001',
  modelManifestId: 'birefnet_main_staging_v1',
  modelGcsPath: birefnetRuntimeConfig.modelGcsPath,
  modelRevision: birefnetRuntimeConfig.modelRevision,
  modelChecksum: birefnetRuntimeConfig.modelAggregateSha256,
  gpuType: 'nvidia-l4',
}), [])
assert.ok(validateBiRefNetRuntimeEnv({ projectId: 'prod-reeditpro' }).length > 0, 'production-looking project must be blocked.')
assert.ok(validateBiRefNetRuntimeEnv({ modelManifestId: 'sam2_hiera_tiny_evaluated_only' }).length > 0, 'SAM2 must be blocked.')
assert.ok(validateBiRefNetRuntimeEnv({ gpuType: 'nvidia-rtx-pro-6000' }).length > 0, 'RTX PRO 6000 must be blocked.')

const commands = buildBiRefNetRuntimeCommandPlans('sha256:example')
assert.ok(commands.some((command) => command.commandId === 'build-push-image'), 'build/push command must exist.')
assert.ok(commands.some((command) => command.commandId === 'deploy-job'), 'deploy command must exist.')
assert.ok(commands.some((command) => command.commandId === 'execute-job'), 'execute command must exist.')
assert.ok(commands.some((command) => command.commandString.includes('--gpu-type=nvidia-l4')), 'deploy command must use nvidia-l4.')
assert.ok(commands.every((command) => !/sam2|realesrgan|deepfilternet|demucs|huggingface-cli|snapshot_download|allUsers|allAuthenticatedUsers|rtx.pro.6000/i.test(command.commandString)), 'commands must not use SAM2, provider model downloads, public principals, or RTX PRO 6000.')

const report = buildBiRefNetRuntimeReport({ executionReport: sampleExecution, imageDigest: 'sha256:example' })
assert.equal(report.phase33DReadiness.readyForControlledMaskTest, true)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.providerExecuted, false)
assert.equal(report.modelDownloadedExternally, false)
assert.equal(report.realMediaProcessed, false)
assert.equal(report.sam2Used, false)
assert.equal(report.textBehindSubjectAllowed, false)
assert.ok(report.warnings.some((warning) => /handler\.py/i.test(warning)), 'handler.py warning must be recorded.')

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['smoke:activation-birefnet-runtime'])
assert.ok(packageJson.scripts['activation:birefnet-runtime'])
assert.ok(packageJson.scripts['activation:birefnet-runtime:report'])
assert.ok(packageJson.scripts['build:staging-birefnet-runtime-worker'])

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_birefnet_only',
    'sam2_blocked',
    'model_path_checksum_revision_locked',
    'handler_warning_not_imported',
    'generated_fixture_only',
    'mask_qa_gates',
    'false_launch_gates',
    'package_scripts',
  ],
}))
