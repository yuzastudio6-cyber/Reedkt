import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildProColorImageRuntimeCommandPlans,
  buildProColorImageRuntimeFixturePlan,
  buildProColorImageRuntimeIamPlan,
  buildProColorImageRuntimeReport,
  buildProColorImageRuntimeToolResolverSummary,
  proColorImageRuntimeConfig,
  validateProColorImageRuntimeExecutionEnv,
} from '../activation/pro-color-image-runtime'
import type { ProColorImageRuntimeExecutionReport } from '../activation/pro-color-image-runtime'

const sampleExecution: ProColorImageRuntimeExecutionReport = {
  ok: true,
  phase: '40B',
  runId: 'phase40b-smoke',
  projectId: 'reeditpro',
  jobName: proColorImageRuntimeConfig.runtimeJobName,
  runtimeMode: 'generated_fixture_color_image',
  compute: {
    mode: 'cpu',
    cpu: 4,
    memory: '8Gi',
    gpuRequested: false,
  },
  runtimeDiagnostics: {
    pythonVersion: '3.11.x',
    pythonExecutable: '/usr/bin/python3',
    numpyVersion: '1.26.4',
    pillowVersion: '10.4.0',
  },
  fixture: {
    generated: true,
    width: 256,
    height: 256,
    frameCount: 3,
    frameUris: [
      'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/phase40b-smoke/fixtures/color-bars.png',
      'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/phase40b-smoke/fixtures/gradient.png',
      'gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/phase40b-smoke/fixtures/alpha-checker.png',
    ],
  },
  tools: [
    {
      toolId: 'opencolorio',
      status: 'passed',
      version: '2.4.2',
      operation: 'Generated/raw identity transform on deterministic RGB samples.',
      artifacts: [],
      metrics: { maxAbsDiff: 0 },
      blockers: [],
      warnings: [],
    },
    {
      toolId: 'openimageio',
      status: 'passed',
      version: '3.0.18.1',
      operation: 'Read/write/inspect generated image sequence.',
      artifacts: [],
      metrics: { width: 256, height: 256, channels: 3 },
      blockers: [],
      warnings: [],
    },
    {
      toolId: 'kornia',
      status: 'passed',
      version: '0.8.1',
      operation: 'CPU grayscale/blur/difference metrics on generated fixture.',
      artifacts: [],
      metrics: { meanAbsoluteDiff: 0.01 },
      blockers: [],
      warnings: [],
    },
  ],
  artifacts: [],
  qa: {
    status: 'passed',
    gates: [
      { gateId: 'tool_runtime_integrity', passed: true, severity: 'mandatory', summary: 'Tool imports and operations succeeded.' },
      { gateId: 'fixture_integrity', passed: true, severity: 'mandatory', summary: 'Generated fixtures produced.' },
      { gateId: 'opencolorio_result', passed: true, severity: 'mandatory', summary: 'OCIO identity transform passed.' },
      { gateId: 'openimageio_result', passed: true, severity: 'mandatory', summary: 'OIIO read/write passed.' },
      { gateId: 'kornia_result', passed: true, severity: 'mandatory', summary: 'Kornia metric passed.' },
      { gateId: 'image_artifact_integrity', passed: true, severity: 'mandatory', summary: 'Image artifacts recorded.' },
      { gateId: 'metadata_integrity', passed: true, severity: 'mandatory', summary: 'Metadata recorded.' },
      { gateId: 'color_transform_safety', passed: true, severity: 'mandatory', summary: 'No color clipping detected.' },
      { gateId: 'artifact_privacy', passed: true, severity: 'mandatory', summary: 'Private prefixes only.' },
      { gateId: 'blocked_features', passed: true, severity: 'mandatory', summary: 'Blocked features remain blocked.' },
    ],
    blockers: [],
    warnings: [],
  },
  safety: {
    realMediaUsed: false,
    realVideoUsed: false,
    userMediaUsed: false,
    providerExecuted: false,
    revideoUsed: false,
    publicAccessEnabled: false,
    finalDeliveryCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  },
  phase40CReadiness: {
    readyForControlledRealVideoProColorImageSample: true,
    reason: 'Generated-fixture runtime QA passed.',
  },
  warnings: [],
}

assert.equal(proColorImageRuntimeConfig.phase, '40B')
assert.equal(proColorImageRuntimeConfig.track, 'A visual/video')
assert.equal(proColorImageRuntimeConfig.runtimeMode, 'generated_fixture_color_image')
assert.equal(proColorImageRuntimeConfig.runtimeJobName, 'reeditpro-staging-pro-color-image-runtime-job')
assert.equal(proColorImageRuntimeConfig.runtimeTargetImage, 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime:staging-pro-color-image-runtime-torch-001')
assert.equal(proColorImageRuntimeConfig.serviceAccountEmail, 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(proColorImageRuntimeConfig.computeMode, 'cpu')
assert.equal(proColorImageRuntimeConfig.cpu, 4)
assert.equal(proColorImageRuntimeConfig.memory, '8Gi')

const fixturePlan = buildProColorImageRuntimeFixturePlan()
assert.equal(fixturePlan.generatedOnly, true)
assert.equal(fixturePlan.width, 256)
assert.equal(fixturePlan.height, 256)
assert.equal(fixturePlan.frameCount, 3)
assert.ok(fixturePlan.fixtures.some((fixture) => fixture.includes('color bars')))
assert.ok(fixturePlan.fixtures.some((fixture) => fixture.includes('gradients')))
assert.ok(fixturePlan.fixtures.some((fixture) => fixture.includes('alpha checker')))

assert.deepEqual(buildProColorImageRuntimeToolResolverSummary().map((tool) => tool.toolId), ['opencolorio', 'openimageio', 'kornia'])

const env = validateProColorImageRuntimeExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  korniaTorchFixConfirmation: 'true',
  runtimeMode: 'generated_fixture_color_image',
  providerExecutionEnabled: 'false',
  realMediaInputEnabled: 'false',
  revideoEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
})
assert.equal(env.allowed, true)
assert.ok(validateProColorImageRuntimeExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_RUNTIME=true')))
assert.ok(validateProColorImageRuntimeExecutionEnv({ korniaTorchFixConfirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_KORNIA_TORCH_FIX=true')))
assert.ok(validateProColorImageRuntimeExecutionEnv({ runtimeMode: 'real_video_color_image' }).blockers.length > 0)
assert.ok(validateProColorImageRuntimeExecutionEnv({ realMediaInputEnabled: 'true' }).blockers.length > 0)

const iamPlan = buildProColorImageRuntimeIamPlan()
assert.equal(iamPlan.length, 3)
for (const binding of iamPlan) {
  assert.equal(binding.role, 'roles/storage.objectCreator')
  assert.match(binding.conditionExpression, /activation-pro-color-image\/phase40b\//)
  assert.doesNotMatch(binding.commandString, /allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/)
}

const commandPlans = buildProColorImageRuntimeCommandPlans()
assert.ok(commandPlans.some((plan) => plan.commandId === 'build-push-image'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'deploy-job'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'execute-job'))
for (const plan of commandPlans) {
  assert.equal(plan.textOnlyByDefault, true)
  const text = plan.commandString.toLowerCase()
  assert.doesNotMatch(text, /allusers|allauthenticatedusers|real_media_input_enabled=true|provider_execution_enabled=true|revideo_enabled=true|production_ready=true/)
}

const report = buildProColorImageRuntimeReport({ executionReport: sampleExecution })
assert.equal(report.status, 'ready')
assert.equal(report.proColorImageRuntimeVerified, true)
assert.equal(report.phase40CReadiness.readyForControlledRealVideoProColorImageSample, true)
assert.equal(report.generatedFixtureOnly, true)
assert.equal(report.realVideoInputAllowed, false)
assert.equal(report.realUserMediaAllowed, false)
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)

for (const gateId of [
  'tool_runtime_integrity',
  'fixture_integrity',
  'opencolorio_result',
  'openimageio_result',
  'kornia_result',
  'image_artifact_integrity',
  'metadata_integrity',
  'color_transform_safety',
  'artifact_privacy',
  'blocked_features',
] as const) {
  assert.ok(report.executionReport?.qa.gates.some((gate) => gate.gateId === gateId), `${gateId} QA gate must exist.`)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:pro-color-image-runtime'], 'tsx server/cli/activation-pro-color-image-runtime.ts')
assert.equal(packageJson.scripts['activation:pro-color-image-runtime:report'], 'tsx server/cli/activation-pro-color-image-runtime-report.ts')
assert.equal(packageJson.scripts['activation:pro-color-image-runtime:iam-plan'], 'tsx server/cli/activation-pro-color-image-runtime-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-pro-color-image-runtime'], 'tsx server/smoke/activation-pro-color-image-runtime-smoke.ts')
assert.equal(packageJson.scripts['build:staging-pro-color-image-runtime-worker'], 'npm run typecheck:server && vite build --config vite.staging-pro-color-image-runtime-worker.config.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'runtime_report_builds',
    'generated_fixture_only',
    'cpu_worker_config',
    'private_artifact_prefixes',
    'qa_gates',
    'confirmation_gate',
    'blocked_features',
    'package_scripts',
  ],
}))
