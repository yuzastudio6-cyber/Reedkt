import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildDeepFilterNetRuntimeCommandPlans,
  buildDeepFilterNetRuntimeFixturePlan,
  buildDeepFilterNetRuntimeIamPlan,
  buildDeepFilterNetRuntimeReport,
  deepFilterNetRuntimeConfig,
  expectedDeepFilterNetRuntimeQaGateIds,
  validateDeepFilterNetRuntimeExecutionEnv,
  validateDeepFilterNetRuntimeStaticPlan,
} from '../activation/deepfilternet-runtime'

assert.equal(deepFilterNetRuntimeConfig.phase, '36C')
assert.equal(deepFilterNetRuntimeConfig.runtimeMode, 'generated_audio')
assert.equal(deepFilterNetRuntimeConfig.artifactGcsPath, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/')
assert.equal(deepFilterNetRuntimeConfig.cliFileName, 'deep-filter-0.5.6-x86_64-unknown-linux-musl')
assert.equal(deepFilterNetRuntimeConfig.modelArchiveFileName, 'DeepFilterNet3_onnx.tar.gz')
assert.equal(deepFilterNetRuntimeConfig.cliSha256, '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da')
assert.equal(deepFilterNetRuntimeConfig.modelArchiveSha256, 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616')
assert.equal(deepFilterNetRuntimeConfig.aggregateSha256, 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b')
assert.equal(deepFilterNetRuntimeConfig.runtimeJobName, 'reeditpro-staging-deepfilternet-runtime-job')
assert.equal(deepFilterNetRuntimeConfig.runtimeTargetImage, 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime:staging-deepfilternet-runtime-001')
assert.equal(deepFilterNetRuntimeConfig.serviceAccountEmail, 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(deepFilterNetRuntimeConfig.cpu, 4)
assert.equal(deepFilterNetRuntimeConfig.memory, '8Gi')

const fixturePlan = buildDeepFilterNetRuntimeFixturePlan()
assert.equal(fixturePlan.generatedAudioOnly, true)
assert.equal(fixturePlan.sampleRate, 48000)
assert.equal(fixturePlan.channels, 1)
assert.equal(fixturePlan.durationSeconds, 10)

const staticPlan = validateDeepFilterNetRuntimeStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'generated_audio',
  artifactGcsPath: deepFilterNetRuntimeConfig.artifactGcsPath,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateDeepFilterNetRuntimeStaticPlan({ runtimeMode: 'real_media' }).blockers.length > 0)

const executionEnv = validateDeepFilterNetRuntimeExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: 'generated_audio',
  artifactGcsPath: deepFilterNetRuntimeConfig.artifactGcsPath,
  cliSha256: deepFilterNetRuntimeConfig.cliSha256,
  modelArchiveSha256: deepFilterNetRuntimeConfig.modelArchiveSha256,
  aggregateSha256: deepFilterNetRuntimeConfig.aggregateSha256,
  generatedAudioOnly: 'true',
  realMediaInputEnabled: 'false',
  providerExecutionEnabled: 'false',
  rnnoiseEnabled: 'false',
  demucsEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
})
assert.equal(executionEnv.allowed, true)
assert.ok(validateDeepFilterNetRuntimeExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME=true')))
assert.ok(validateDeepFilterNetRuntimeExecutionEnv({ providerExecutionEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Provider')))
assert.ok(validateDeepFilterNetRuntimeExecutionEnv({ rnnoiseEnabled: 'true' }).blockers.some((blocker) => blocker.includes('RNNoise')))
assert.ok(validateDeepFilterNetRuntimeExecutionEnv({ demucsEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Demucs')))

const iamPlan = buildDeepFilterNetRuntimeIamPlan()
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectViewer' && binding.bucket === 'reeditpro-staging-reeditpro-generated-assets'))
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectCreator' && binding.bucket === 'reeditpro-staging-reeditpro-qa-artifacts'))
assert.ok(iamPlan.every((binding) => binding.member === 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'))
assert.ok(iamPlan.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iamPlan.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|owner|editor/i.test(binding.commandString)))

const commandPlans = buildDeepFilterNetRuntimeCommandPlans()
assert.ok(commandPlans.some((plan) => plan.commandId === 'build-push-image'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'deploy-job'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'execute-job'))
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(commandPlans.every((plan) => !/gpu|nvidia|provider=true|REAL_MEDIA_INPUT_ENABLED=true|RNNOISE_ENABLED=true|DEMUCS_ENABLED=true|allUsers|allAuthenticatedUsers|signed-url|revideo|film|slow-motion/i.test(plan.commandString)))

const report = buildDeepFilterNetRuntimeReport()
assert.equal(report.generatedAudioOnly, true)
assert.equal(report.realVideoInputAllowed, false)
assert.equal(report.realUserMediaAllowed, false)
assert.equal(report.realMediaAudioAiAllowed, false)
assert.equal(report.rnnoiseAllowed, false)
assert.equal(report.demucsAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.filmAllowed, false)
assert.equal(report.slowMotionAllowed, false)
assert.deepEqual(expectedDeepFilterNetRuntimeQaGateIds(), [
  'model_artifacts',
  'runtime_integrity',
  'fixture_integrity',
  'enhanced_audio_artifacts',
  'audio_safety_metrics',
  'artifact_privacy',
  'blocked_features',
])
if (report.approvedEvidence.status === 'verified') {
  assert.equal(report.deepFilterNetRuntimeVerified, true)
  assert.equal(report.phase36DReadiness.readyForControlledRealVideoAudioAiCleanupSample, true)
  assert.match(report.approvedEvidence.runId ?? '', /^phase36c-/)
  assert.match(report.approvedEvidence.runtimeImageDigest ?? '', /^sha256:[a-f0-9]{64}$/)
} else {
  assert.equal(report.deepFilterNetRuntimeVerified, false)
  assert.equal(report.phase36DReadiness.readyForControlledRealVideoAudioAiCleanupSample, false)
  assert.ok(report.blockers.length > 0)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:deepfilternet-runtime'], 'tsx server/cli/activation-deepfilternet-runtime.ts')
assert.equal(packageJson.scripts['activation:deepfilternet-runtime:report'], 'tsx server/cli/activation-deepfilternet-runtime-report.ts')
assert.equal(packageJson.scripts['activation:deepfilternet-runtime:iam-plan'], 'tsx server/cli/activation-deepfilternet-runtime-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-deepfilternet-runtime'], 'tsx server/smoke/activation-deepfilternet-runtime-smoke.ts')
assert.equal(packageJson.scripts['build:staging-deepfilternet-runtime-worker'], 'npm run typecheck:server && vite build --config vite.staging-deepfilternet-runtime-worker.config.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'exact_phase36b_artifact_path_and_checksums',
    'confirmation_gate',
    'generated_audio_only_mode',
    'cpu_worker_config',
    'private_artifact_prefixes',
    'qa_gates',
    'blocked_real_media_rnnoise_demucs_provider_revideo_film_slow_motion',
    'blocked_production_beta_broad_media',
    'package_scripts',
  ],
  status: report.status,
}))
