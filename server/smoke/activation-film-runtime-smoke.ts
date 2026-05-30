import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildFilmRuntimeCommandPlans,
  buildFilmRuntimeFixturePlan,
  buildFilmRuntimeIamPlan,
  buildFilmRuntimeReport,
  filmRuntimeConfig,
  validateFilmRuntimeExecutionEnv,
} from '../activation/film-runtime'
import type { FilmRuntimeExecutionReport } from '../activation/film-runtime'

const sampleExecution: FilmRuntimeExecutionReport = {
  ok: true,
  runId: 'phase38c-smoke',
  projectId: 'reeditpro',
  jobName: filmRuntimeConfig.runtimeJobName,
  image: {
    image: filmRuntimeConfig.runtimeTargetImage,
    digest: 'sha256:' + 'a'.repeat(64),
  },
  compute: {
    mode: 'cpu',
    cpu: 4,
    memory: '8Gi',
    gpuRequested: false,
  },
  model: {
    toolId: 'film',
    artifactId: 'film_net_style_saved_model',
    gcsPath: filmRuntimeConfig.artifactGcsPath,
    runtimePath: filmRuntimeConfig.artifactRuntimePath,
    kerasMetadataSha256: filmRuntimeConfig.kerasMetadataSha256,
    savedModelSha256: filmRuntimeConfig.savedModelSha256,
    variablesDataSha256: filmRuntimeConfig.variablesDataSha256,
    variablesIndexSha256: filmRuntimeConfig.variablesIndexSha256,
    aggregateSha256: filmRuntimeConfig.aggregateSha256,
    copiedFiles: [
      'film_net/Style/saved_model/keras_metadata.pb',
      'film_net/Style/saved_model/saved_model.pb',
      'film_net/Style/saved_model/variables/variables.data-00000-of-00001',
      'film_net/Style/saved_model/variables/variables.index',
    ],
  },
  fixture: {
    generated: true,
    width: 256,
    height: 256,
    frameCount: 2,
    interpolationTime: 0.5,
    frameUris: [
      'gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38c/phase38c-smoke/fixture/frame-a.png',
      'gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38c/phase38c-smoke/fixture/frame-b.png',
    ],
    manifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38c/phase38c-smoke/fixture/fixture-manifest.json',
  },
  interpolation: {
    status: 'completed',
    interpolatedFrameCount: 1,
    interpolatedFrameUris: ['gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38c/phase38c-smoke/interpolated/interpolated-frame-000.png'],
    metrics: {
      meanAbsoluteDiffFromFrameA: 0.04,
      meanAbsoluteDiffFromFrameB: 0.04,
      outputStddev: 0.2,
    },
  },
  qa: {
    status: 'warning',
    gates: [
      { gateId: 'model_artifacts', status: 'passed', summary: 'Model checksums verified.' },
      { gateId: 'runtime_integrity', status: 'passed', summary: 'TensorFlow loaded FILM.' },
      { gateId: 'fixture_integrity', status: 'passed', summary: 'Generated frames exist.' },
      { gateId: 'interpolated_frame_artifacts', status: 'passed', summary: 'Interpolated frame exists.' },
      { gateId: 'motion_sanity', status: 'passed', summary: 'Basic sanity passed.' },
      { gateId: 'artifact_privacy', status: 'passed', summary: 'Private prefixes only.' },
      { gateId: 'blocked_features', status: 'passed', summary: 'Blocked features remained blocked.' },
    ],
    blockers: [],
    warnings: ['Generated-frame fixture only.'],
  },
  artifacts: [],
  safety: {
    generatedFramesOnly: true,
    providerExecuted: false,
    modelDownloadedExternally: false,
    realMediaUsed: false,
    realVideoInputUsed: false,
    realVideoSlowMotionExecuted: false,
    fullVideoInterpolationExecuted: false,
    slowMotionExecuted: false,
    revideoUsed: false,
    publicAccessEnabled: false,
    secretValuesUsed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  },
  uploadedReport: {
    bucket: filmRuntimeConfig.qaBucket,
    object: 'activation-film-runtime/phase38c/phase38c-smoke/reports/phase38c-report.json',
    gcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38c/phase38c-smoke/reports/phase38c-report.json',
  },
  warnings: ['Generated-frame fixture only.'],
}

assert.equal(filmRuntimeConfig.artifactGcsPath, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/')
assert.equal(filmRuntimeConfig.aggregateSha256, '6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b')
assert.equal(filmRuntimeConfig.kerasMetadataSha256, '0291f451e35e62a042fa49a1341af1dc8a94632188a24a16b71a9516e9fc6853')
assert.equal(filmRuntimeConfig.savedModelSha256, '4df311e80e9a7282b362a7e93bef22a1ce4f84e7cdeda01f246894545eaaf985')
assert.equal(filmRuntimeConfig.variablesDataSha256, '8c47323923bc4826b730dd882c8c7700761aa3ac03b2c8180d3ffc82d18111f9')
assert.equal(filmRuntimeConfig.variablesIndexSha256, 'd19bb117eb9abe6121b5711649bb7d5d1c4fe1912b9deabbdafa2be3f5a273e5')
assert.equal(filmRuntimeConfig.computeMode, 'cpu')
assert.equal(filmRuntimeConfig.cpu, 4)
assert.equal(filmRuntimeConfig.memory, '8Gi')

const env = validateFilmRuntimeExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: 'generated_frame_interpolation',
  artifactGcsPath: filmRuntimeConfig.artifactGcsPath,
  kerasMetadataSha256: filmRuntimeConfig.kerasMetadataSha256,
  savedModelSha256: filmRuntimeConfig.savedModelSha256,
  variablesDataSha256: filmRuntimeConfig.variablesDataSha256,
  variablesIndexSha256: filmRuntimeConfig.variablesIndexSha256,
  aggregateSha256: filmRuntimeConfig.aggregateSha256,
  generatedFramesOnly: 'true',
  providerExecutionEnabled: 'false',
  realMediaInputEnabled: 'false',
  revideoEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
})
assert.equal(env.allowed, true)
assert.ok(validateFilmRuntimeExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_FILM_RUNTIME=true')))
assert.ok(validateFilmRuntimeExecutionEnv({ runtimeMode: 'real_video_slow_motion' }).blockers.length > 0)
assert.ok(validateFilmRuntimeExecutionEnv({ realMediaInputEnabled: 'true' }).blockers.length > 0)

const fixturePlan = buildFilmRuntimeFixturePlan()
assert.equal(fixturePlan.generatedFramesOnly, true)
assert.equal(fixturePlan.frameCount, 2)
assert.equal(fixturePlan.width, 256)
assert.equal(fixturePlan.height, 256)
assert.equal(fixturePlan.interpolationTime, 0.5)

const iamPlan = buildFilmRuntimeIamPlan()
assert.equal(iamPlan.length, 4)
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iamPlan.every((plan) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/i.test(plan.commandString)))

const commands = buildFilmRuntimeCommandPlans({ imageDigest: 'sha256:' + 'a'.repeat(64), runId: 'phase38c-smoke' })
assert.ok(commands.some((command) => command.commandId === 'build-push-image'))
assert.ok(commands.some((command) => command.commandId === 'deploy-job'))
assert.ok(commands.some((command) => command.commandId === 'execute-job'))
assert.ok(commands.some((command) => command.commandString.includes('--cpu=4')))
assert.ok(commands.some((command) => command.commandString.includes('--memory=8Gi')))
assert.ok(commands.every((command) => command.textOnlyByDefault))
assert.ok(commands.every((command) => !/allUsers|allAuthenticatedUsers|--gpu|PROVIDER_EXECUTION_ENABLED=true|REAL_MEDIA_INPUT_ENABLED=true|REEDITPRO_PRODUCTION_READY=true|REVIDEO_ENABLED=true/i.test(command.commandString)))

const report = buildFilmRuntimeReport({ executionReport: sampleExecution, imageDigest: 'sha256:' + 'a'.repeat(64), runId: 'phase38c-smoke' })
assert.equal(report.status, 'ready')
assert.equal(report.filmRuntimeVerified, true)
assert.equal(report.phase38DReadiness.readyForControlledSelectedRealVideoSlowMotionSample, true)
assert.equal(report.generatedFramesOnly, true)
assert.equal(report.realVideoInputAllowed, false)
assert.equal(report.fullVideoInterpolationAllowed, false)
assert.equal(report.slowMotionAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)

const gateIds = new Set(report.executionReport?.qa.gates.map((gate) => gate.gateId))
for (const gate of ['model_artifacts', 'runtime_integrity', 'fixture_integrity', 'interpolated_frame_artifacts', 'motion_sanity', 'artifact_privacy', 'blocked_features'] as const) {
  assert.equal(gateIds.has(gate), true)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['build:staging-film-runtime-worker'], 'npm run typecheck:server && vite build --config vite.staging-film-runtime-worker.config.ts')
assert.equal(packageJson.scripts['activation:film-runtime'], 'tsx server/cli/activation-film-runtime.ts')
assert.equal(packageJson.scripts['activation:film-runtime:report'], 'tsx server/cli/activation-film-runtime-report.ts')
assert.equal(packageJson.scripts['activation:film-runtime:iam-plan'], 'tsx server/cli/activation-film-runtime-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-film-runtime'], 'tsx server/smoke/activation-film-runtime-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase38b_artifact_path_checksums_locked',
    'confirmation_required',
    'generated_frame_only',
    'cpu_cloud_run_config',
    'private_artifact_prefixes',
    'qa_gates_present',
    'blocked_feature_gates_false',
    'package_scripts_present',
  ],
}, null, 2))
