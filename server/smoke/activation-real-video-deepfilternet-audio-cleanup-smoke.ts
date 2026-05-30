import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildRealVideoDeepFilterNetCommandPlans,
  buildRealVideoDeepFilterNetIamPlan,
  buildRealVideoDeepFilterNetPlanSnapshot,
  buildRealVideoDeepFilterNetReport,
  buildRealVideoDeepFilterNetSourceSummary,
  expectedRealVideoDeepFilterNetQaGateIds,
  realVideoDeepFilterNetConfig,
  validateRealVideoDeepFilterNetAudioCleanupExecutionEnv,
  validateRealVideoDeepFilterNetAudioCleanupStaticPlan,
} from '../activation/real-video-deepfilternet-audio-cleanup'

assert.equal(realVideoDeepFilterNetConfig.phase, '36D')
assert.equal(realVideoDeepFilterNetConfig.runtimeMode, 'real_video_audio_cleanup_sample')
assert.equal(realVideoDeepFilterNetConfig.approvedInputVideo, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(realVideoDeepFilterNetConfig.referencePhase31Audio, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4')
assert.equal(realVideoDeepFilterNetConfig.artifactGcsPath, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/')
assert.equal(realVideoDeepFilterNetConfig.cliSha256, '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da')
assert.equal(realVideoDeepFilterNetConfig.modelArchiveSha256, 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616')
assert.equal(realVideoDeepFilterNetConfig.aggregateSha256, 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b')
assert.equal(realVideoDeepFilterNetConfig.runtimeTargetImage, 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime:staging-deepfilternet-real-video-audio-001')
assert.equal(realVideoDeepFilterNetConfig.serviceAccountEmail, 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(realVideoDeepFilterNetConfig.cpu, 4)
assert.equal(realVideoDeepFilterNetConfig.memory, '8Gi')

const sourceSummary = buildRealVideoDeepFilterNetSourceSummary()
assert.equal(sourceSummary.approvedInputVideo, realVideoDeepFilterNetConfig.approvedInputVideo)
assert.equal(sourceSummary.referencePhase31Audio, realVideoDeepFilterNetConfig.referencePhase31Audio)
assert.equal(sourceSummary.phase36CRunId, 'phase36c-20260530T133009')

const snapshot = buildRealVideoDeepFilterNetPlanSnapshot('phase36d-20260530T140000')
assert.equal(snapshot.approval.approvedPlanSnapshot, true)
assert.equal(snapshot.approval.rawPromptExecution, false)
assert.equal(snapshot.feature, 'real_video_deepfilternet_audio_cleanup')
assert.equal(snapshot.tool.artifactGcsPath, realVideoDeepFilterNetConfig.artifactGcsPath)
assert.equal(snapshot.safety.finalDeliveryAllowed, false)
assert.ok(snapshot.outputPrefixes.generatedAssets.startsWith('gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36d/'))

const staticPlan = validateRealVideoDeepFilterNetAudioCleanupStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'real_video_audio_cleanup_sample',
  inputVideo: realVideoDeepFilterNetConfig.approvedInputVideo,
  artifactGcsPath: realVideoDeepFilterNetConfig.artifactGcsPath,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateRealVideoDeepFilterNetAudioCleanupStaticPlan({ inputVideo: 'gs://example/other.mp4' }).blockers.length > 0)

const executionEnv = validateRealVideoDeepFilterNetAudioCleanupExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: 'real_video_audio_cleanup_sample',
  inputVideo: realVideoDeepFilterNetConfig.approvedInputVideo,
  referencePhase31Audio: realVideoDeepFilterNetConfig.referencePhase31Audio,
  artifactGcsPath: realVideoDeepFilterNetConfig.artifactGcsPath,
  cliSha256: realVideoDeepFilterNetConfig.cliSha256,
  modelArchiveSha256: realVideoDeepFilterNetConfig.modelArchiveSha256,
  aggregateSha256: realVideoDeepFilterNetConfig.aggregateSha256,
  inputDurationSeconds: 15.467,
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
assert.ok(validateRealVideoDeepFilterNetAudioCleanupExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_REAL_VIDEO_DEEPFILTERNET_AUDIO_CLEANUP=true')))
assert.ok(validateRealVideoDeepFilterNetAudioCleanupExecutionEnv({ providerExecutionEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Provider')))
assert.ok(validateRealVideoDeepFilterNetAudioCleanupExecutionEnv({ rnnoiseEnabled: 'true' }).blockers.some((blocker) => blocker.includes('RNNoise')))
assert.ok(validateRealVideoDeepFilterNetAudioCleanupExecutionEnv({ demucsEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Demucs')))
assert.ok(validateRealVideoDeepFilterNetAudioCleanupExecutionEnv({ finalDeliveryEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Final delivery')))

const iamPlan = buildRealVideoDeepFilterNetIamPlan()
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectViewer' && binding.bucket === 'reeditpro-staging-reeditpro-final-exports'))
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectViewer' && binding.bucket === 'reeditpro-staging-reeditpro-generated-assets'))
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectCreator' && binding.bucket === 'reeditpro-staging-reeditpro-qa-artifacts'))
assert.ok(iamPlan.every((binding) => binding.member === 'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'))
assert.ok(iamPlan.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iamPlan.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|owner|editor/i.test(binding.commandString)))

const commandPlans = buildRealVideoDeepFilterNetCommandPlans()
assert.ok(commandPlans.some((plan) => plan.commandId === 'build-push-image'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'deploy-job'))
assert.ok(commandPlans.some((plan) => plan.commandId === 'execute-job'))
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(commandPlans.every((plan) => !/provider=true|RNNOISE_ENABLED=true|DEMUCS_ENABLED=true|allUsers|allAuthenticatedUsers|signed-url|revideo|film|slow-motion|FINAL_DELIVERY_ENABLED=true|REEDITPRO_PRODUCTION_READY=true/i.test(plan.commandString)))

const report = buildRealVideoDeepFilterNetReport()
assert.equal(report.audioCleanupAllowedForApprovedChain, true)
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
assert.deepEqual(expectedRealVideoDeepFilterNetQaGateIds(), [
  'source_integrity',
  'plan_snapshot_integrity',
  'model_artifacts',
  'audio_extraction',
  'deepfilternet_cleanup',
  'audio_safety_metrics',
  'review_preview',
  'artifact_privacy',
  'blocked_features',
])
if (report.approvedEvidence.status === 'completed') {
  assert.equal(report.realMediaAudioAiCleanupCompleted, true)
  assert.equal(report.phase36EReadiness.readyForDeepFilterNetPrivateAudioFeatureE2E, true)
  assert.match(report.approvedEvidence.runId ?? '', /^phase36d-/)
  assert.match(report.approvedEvidence.runtimeImageDigest ?? '', /^sha256:[a-f0-9]{64}$/)
} else {
  assert.equal(report.realMediaAudioAiCleanupCompleted, false)
  assert.equal(report.phase36EReadiness.readyForDeepFilterNetPrivateAudioFeatureE2E, false)
  assert.ok(report.blockers.length > 0)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:real-video:deepfilternet-audio-cleanup'], 'tsx server/cli/activation-real-video-deepfilternet-audio-cleanup.ts')
assert.equal(packageJson.scripts['activation:real-video:deepfilternet-audio-cleanup:report'], 'tsx server/cli/activation-real-video-deepfilternet-audio-cleanup-report.ts')
assert.equal(packageJson.scripts['activation:real-video:deepfilternet-audio-cleanup:iam-plan'], 'tsx server/cli/activation-real-video-deepfilternet-audio-cleanup-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-real-video-deepfilternet-audio-cleanup'], 'tsx server/smoke/activation-real-video-deepfilternet-audio-cleanup-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_source_locks',
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
