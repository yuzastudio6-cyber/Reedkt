import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildSam2RuntimeCommandPlans,
  buildSam2RuntimeFixturePlan,
  buildSam2RuntimeIamPlan,
  buildSam2RuntimeReport,
  sam2RuntimeConfig,
  validateSam2RuntimeExecutionEnv,
} from '../activation/sam2-runtime'
import type { Sam2RuntimeExecutionReport } from '../activation/sam2-runtime'

const sampleExecution: Sam2RuntimeExecutionReport = {
  ok: true,
  runId: 'phase35c-smoke',
  projectId: 'reeditpro',
  jobName: sam2RuntimeConfig.runtimeJobName,
  image: {
    image: sam2RuntimeConfig.runtimeTargetImage,
    digest: 'sha256:' + 'a'.repeat(64),
  },
  gpu: {
    requested: true,
    type: 'nvidia-l4',
    count: 1,
    cudaAvailable: true,
    deviceName: 'NVIDIA L4',
  },
  model: {
    family: 'SAM2 / Segment Anything Model 2',
    modelId: 'sam2.1_hiera_tiny',
    checkpointFileName: 'sam2.1_hiera_tiny.pt',
    configFileName: 'sam2.1_hiera_t.yaml',
    gcsPath: sam2RuntimeConfig.modelGcsPath,
    runtimePath: sam2RuntimeConfig.modelRuntimePath,
    checkpointSha256: sam2RuntimeConfig.checkpointSha256,
    configSha256: sam2RuntimeConfig.configSha256,
    aggregateSha256: sam2RuntimeConfig.aggregateSha256,
    copiedFiles: ['sam2.1_hiera_tiny.pt', 'sam2.1_hiera_t.yaml', 'file_checksums_sha256.txt', 'model_tree_manifest.json', 'source_evidence.json'],
  },
  fixture: {
    generated: true,
    width: 512,
    height: 512,
    frameCount: 5,
    promptType: 'box',
    promptBox: [168, 176, 336, 344],
    frameUris: Array.from({ length: 5 }, (_, index) => `gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/phase35c-smoke/fixture/frames/frame-00${index}.png`),
  },
  masks: {
    status: 'completed',
    frameCount: 5,
    maskUris: Array.from({ length: 5 }, (_, index) => `gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/phase35c-smoke/masks/frame-00${index}-mask.png`),
    overlayUris: Array.from({ length: 5 }, (_, index) => `gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/phase35c-smoke/overlays/frame-00${index}-overlay.png`),
    perFrame: Array.from({ length: 5 }, (_, index) => ({
      frameIndex: index,
      nonZeroRatio: 0.2,
      centroidX: 240 + index * 10,
      centroidY: 250,
    })),
  },
  qa: {
    status: 'warning',
    gates: [
      { gateId: 'model_artifacts', status: 'passed', summary: 'Model checksums verified.' },
      { gateId: 'runtime_integrity', status: 'passed', summary: 'CUDA/L4 confirmed.' },
      { gateId: 'fixture_integrity', status: 'passed', summary: 'Generated fixture exists.' },
      { gateId: 'mask_artifacts', status: 'passed', summary: 'Masks exist.' },
      { gateId: 'temporal_fixture_consistency', status: 'passed', summary: 'Continuity sanity check passed.' },
      { gateId: 'artifact_privacy', status: 'passed', summary: 'Private prefixes only.' },
      { gateId: 'blocked_features', status: 'passed', summary: 'Blocked features remained blocked.' },
    ],
    blockers: [],
    warnings: ['Generated fixture only.'],
  },
  artifacts: [],
  safety: {
    generatedFixtureOnly: true,
    providerExecuted: false,
    modelDownloadedExternally: false,
    realMediaUsed: false,
    realVideoInputUsed: false,
    fullVideoMaskExecuted: false,
    fullVideoTextBehindSubjectExecuted: false,
    filmUsed: false,
    slowMotionExecuted: false,
    revideoUsed: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    rtxPro6000Used: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  },
  uploadedReport: {
    bucket: sam2RuntimeConfig.qaBucket,
    object: 'activation-sam2-runtime/phase35c/phase35c-smoke/reports/phase35c-report.json',
    gcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-sam2-runtime/phase35c/phase35c-smoke/reports/phase35c-report.json',
  },
  warnings: ['Generated fixture only.'],
}

assert.equal(sam2RuntimeConfig.modelGcsPath, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/')
assert.equal(sam2RuntimeConfig.checkpointSha256, '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69')
assert.equal(sam2RuntimeConfig.configSha256, 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d')
assert.equal(sam2RuntimeConfig.aggregateSha256, '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2')
assert.equal(sam2RuntimeConfig.gpuType, 'nvidia-l4')
assert.equal(sam2RuntimeConfig.gpuCount, 1)

const env = validateSam2RuntimeExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: 'generated_synthetic_sequence',
  modelGcsPath: sam2RuntimeConfig.modelGcsPath,
  checkpointSha256: sam2RuntimeConfig.checkpointSha256,
  configSha256: sam2RuntimeConfig.configSha256,
  aggregateSha256: sam2RuntimeConfig.aggregateSha256,
  gpuType: 'nvidia-l4',
  providerExecutionEnabled: 'false',
  realMediaInputEnabled: 'false',
  productionReady: 'false',
})
assert.equal(env.allowed, true)
assert.ok(validateSam2RuntimeExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_SAM2_RUNTIME=true')))
assert.ok(validateSam2RuntimeExecutionEnv({ runtimeMode: 'real_video' }).blockers.length > 0)
assert.ok(validateSam2RuntimeExecutionEnv({ gpuType: 'nvidia-rtx-pro-6000' }).blockers.length > 0)

const fixturePlan = buildSam2RuntimeFixturePlan()
assert.equal(fixturePlan.generatedFixtureOnly, true)
assert.equal(fixturePlan.frameCount, 5)
assert.equal(fixturePlan.width, 512)
assert.equal(fixturePlan.height, 512)

const iamPlan = buildSam2RuntimeIamPlan()
assert.equal(iamPlan.length, 4)
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iamPlan.every((plan) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/i.test(plan.commandString)))

const commands = buildSam2RuntimeCommandPlans({ imageDigest: 'sha256:' + 'a'.repeat(64), runId: 'phase35c-smoke' })
assert.ok(commands.some((command) => command.commandId === 'build-push-image'))
assert.ok(commands.some((command) => command.commandId === 'deploy-job'))
assert.ok(commands.some((command) => command.commandId === 'execute-job'))
assert.ok(commands.some((command) => command.commandString.includes('--gpu-type=nvidia-l4')))
assert.ok(commands.every((command) => command.textOnlyByDefault))
assert.ok(commands.every((command) => !/allUsers|allAuthenticatedUsers|rtx.pro.6000|PROVIDER_EXECUTION_ENABLED=true|REAL_MEDIA_INPUT_ENABLED=true|REEDITPRO_PRODUCTION_READY=true/i.test(command.commandString)))

const report = buildSam2RuntimeReport({ executionReport: sampleExecution, imageDigest: 'sha256:' + 'a'.repeat(64), runId: 'phase35c-smoke' })
assert.equal(report.status, 'ready')
assert.equal(report.sam2RuntimeVerified, true)
assert.equal(report.phase35DReadiness.readyForControlledShortRealVideoTemporalMaskTracking, true)
assert.equal(report.generatedFixtureOnly, true)
assert.equal(report.realVideoInputAllowed, false)
assert.equal(report.sam2TemporalTrackingAllowed, false)
assert.equal(report.sam2FullVideoMaskAllowed, false)
assert.equal(report.fullVideoTextBehindSubjectAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.filmAllowed, false)
assert.equal(report.slowMotionAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['build:staging-sam2-runtime-worker'], 'npm run typecheck:server && vite build --config vite.staging-sam2-runtime-worker.config.ts')
assert.equal(packageJson.scripts['activation:sam2-runtime'], 'tsx server/cli/activation-sam2-runtime.ts')
assert.equal(packageJson.scripts['activation:sam2-runtime:report'], 'tsx server/cli/activation-sam2-runtime-report.ts')
assert.equal(packageJson.scripts['activation:sam2-runtime:iam-plan'], 'tsx server/cli/activation-sam2-runtime-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-sam2-runtime'], 'tsx server/smoke/activation-sam2-runtime-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase35b_model_path_checksums_locked',
    'confirmation_required',
    'generated_fixture_only',
    'l4_gpu_config',
    'private_artifact_prefixes',
    'qa_gates',
    'false_launch_gates',
    'blocked_provider_revideo_film_slow_motion',
    'package_scripts',
  ],
}))
