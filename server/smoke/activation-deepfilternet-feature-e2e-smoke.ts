import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildDeepFilterNetFeatureE2ECommandPlans,
  buildDeepFilterNetFeatureE2EIamPlan,
  buildDeepFilterNetFeatureE2EPlanSnapshot,
  buildDeepFilterNetFeatureE2EReport,
  buildDeepFilterNetFeatureE2ESourceSummary,
  deepFilterNetFeatureE2EConfig,
  expectedDeepFilterNetFeatureE2EQaGateIds,
  validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv,
  validateDeepFilterNetFeatureE2EAudioCleanupStaticPlan,
} from '../activation/deepfilternet-feature-e2e'

assert.equal(deepFilterNetFeatureE2EConfig.phase, '36E')
assert.equal(deepFilterNetFeatureE2EConfig.runtimeMode, 'audio_feature_e2e')
assert.equal(deepFilterNetFeatureE2EConfig.approvedInputVideo, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(deepFilterNetFeatureE2EConfig.referencePhase31Audio, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4')
assert.equal(deepFilterNetFeatureE2EConfig.phase36DRunId, 'phase36d-20260530T141724')
assert.equal(deepFilterNetFeatureE2EConfig.artifactGcsPath, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/')
assert.equal(deepFilterNetFeatureE2EConfig.cliSha256, '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da')
assert.equal(deepFilterNetFeatureE2EConfig.modelArchiveSha256, 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616')
assert.equal(deepFilterNetFeatureE2EConfig.aggregateSha256, 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b')
assert.equal(deepFilterNetFeatureE2EConfig.runtimeTargetImage, 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime:staging-deepfilternet-audio-feature-e2e-001')

const sourceSummary = buildDeepFilterNetFeatureE2ESourceSummary()
assert.equal(sourceSummary.approvedInputVideo, deepFilterNetFeatureE2EConfig.approvedInputVideo)
assert.equal(sourceSummary.phase36DRunId, deepFilterNetFeatureE2EConfig.phase36DRunId)
assert.equal(sourceSummary.phase36DReportUri, deepFilterNetFeatureE2EConfig.phase36DReportUri)

const snapshot = buildDeepFilterNetFeatureE2EPlanSnapshot('phase36e-20260530T150000')
assert.equal(snapshot.approval.approvedPlanSnapshot, true)
assert.equal(snapshot.approval.rawPromptExecution, false)
assert.equal(snapshot.feature, 'deepfilternet_audio_feature_e2e')
assert.equal(snapshot.phase36DRunId, deepFilterNetFeatureE2EConfig.phase36DRunId)
assert.equal(snapshot.phase36DEvidence.qaReportUri, deepFilterNetFeatureE2EConfig.phase36DReportUri)
assert.equal(snapshot.tool.artifactGcsPath, deepFilterNetFeatureE2EConfig.artifactGcsPath)
assert.equal(snapshot.safety.finalDeliveryAllowed, false)
assert.ok(snapshot.outputPrefixes.generatedAssets.startsWith('gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36e/'))

const staticPlan = validateDeepFilterNetFeatureE2EAudioCleanupStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'audio_feature_e2e',
  inputVideo: deepFilterNetFeatureE2EConfig.approvedInputVideo,
  artifactGcsPath: deepFilterNetFeatureE2EConfig.artifactGcsPath,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateDeepFilterNetFeatureE2EAudioCleanupStaticPlan({ inputVideo: 'gs://example/other.mp4' }).blockers.length > 0)

const executionEnv = validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: 'audio_feature_e2e',
  inputVideo: deepFilterNetFeatureE2EConfig.approvedInputVideo,
  referencePhase31Audio: deepFilterNetFeatureE2EConfig.referencePhase31Audio,
  artifactGcsPath: deepFilterNetFeatureE2EConfig.artifactGcsPath,
  cliSha256: deepFilterNetFeatureE2EConfig.cliSha256,
  modelArchiveSha256: deepFilterNetFeatureE2EConfig.modelArchiveSha256,
  aggregateSha256: deepFilterNetFeatureE2EConfig.aggregateSha256,
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
  rnnoiseEnabled: 'false',
  demucsEnabled: 'false',
  finalDeliveryEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
})
assert.equal(executionEnv.allowed, true)
assert.ok(validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_DEEPFILTERNET_AUDIO_FEATURE_E2E=true')))
assert.ok(validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv({ providerExecutionEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Provider')))
assert.ok(validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv({ rnnoiseEnabled: 'true' }).blockers.some((blocker) => blocker.includes('RNNoise')))
assert.ok(validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv({ demucsEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Demucs')))
assert.ok(validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv({ finalDeliveryEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Final delivery')))

const iamPlan = buildDeepFilterNetFeatureE2EIamPlan()
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectViewer' && binding.conditionTitle === 'phase36e_phase36d_qa_read'))
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectCreator' && binding.conditionTitle === 'phase36e_qa_create'))
assert.ok(iamPlan.every((binding) => binding.member === 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'))
assert.ok(iamPlan.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iamPlan.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|owner|editor/i.test(binding.commandString)))

const commandPlans = buildDeepFilterNetFeatureE2ECommandPlans()
assert.ok(commandPlans.some((plan) => plan.commandId === 'build-push-image'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'deploy-job'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'execute-job'))
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(commandPlans.every((plan) => !/provider=true|RNNOISE_ENABLED=true|DEMUCS_ENABLED=true|allUsers|allAuthenticatedUsers|signed-url|revideo|film|slow-motion|FINAL_DELIVERY_ENABLED=true|REEDITPRO_PRODUCTION_READY=true/i.test(plan.commandString)))

const report = buildDeepFilterNetFeatureE2EReport()
assert.equal(report.audioFeatureE2EAllowed, true)
assert.equal(report.arbitraryRealUserMediaAllowed, false)
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
assert.equal(report.finalDeliveryAllowed, false)
assert.deepEqual(expectedDeepFilterNetFeatureE2EQaGateIds(), [
  'source_integrity',
  'plan_snapshot_integrity',
  'phase36d_evidence',
  'model_artifacts',
  'audio_extraction',
  'deepfilternet_cleanup',
  'audio_safety_metrics',
  'review_preview',
  'artifact_privacy',
  'feature_readiness_evidence',
  'blocked_features',
])

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:deepfilternet-feature-e2e'], 'tsx server/cli/activation-deepfilternet-feature-e2e.ts')
assert.equal(packageJson.scripts['activation:deepfilternet-feature-e2e:report'], 'tsx server/cli/activation-deepfilternet-feature-e2e-report.ts')
assert.equal(packageJson.scripts['activation:deepfilternet-feature-e2e:iam-plan'], 'tsx server/cli/activation-deepfilternet-feature-e2e-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-deepfilternet-feature-e2e'], 'tsx server/smoke/activation-deepfilternet-feature-e2e-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_phase32_source_lock',
    'img_6024_not_used',
    'phase36d_evidence',
    'plan_snapshot_required',
    'exact_phase36b_artifact_path_and_checksums',
    'confirmation_gate',
    'private_artifact_prefixes',
    'qa_gates',
    'blocked_rnnoise_demucs_provider_revideo_film_slow_motion_final_delivery',
    'blocked_production_beta_broad_media',
    'package_scripts',
  ],
  status: report.status,
}))
