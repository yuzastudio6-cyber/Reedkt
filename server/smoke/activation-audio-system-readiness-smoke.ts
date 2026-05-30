import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  audioSystemReadinessConfig,
  audioSystemReadinessQaGateIds,
  buildAudioSystemBetaScopeManifest,
  buildAudioSystemEvidenceChain,
  buildAudioSystemReadinessCommandPlans,
  buildAudioSystemReadinessIamPlan,
  buildAudioSystemReadinessReport,
  buildStaticPhase36EArtifactRequirements,
  requiredPhase36EArtifactIds,
  validateAudioSystemReadinessExecutionEnv,
  validateAudioSystemReadinessStaticPlan,
} from '../activation/audio-system-readiness'

assert.equal(audioSystemReadinessConfig.phase, '36F')
assert.equal(audioSystemReadinessConfig.projectId, 'reeditpro')
assert.equal(audioSystemReadinessConfig.region, 'us-central1')
assert.equal(audioSystemReadinessConfig.env, 'staging')
assert.equal(audioSystemReadinessConfig.approvedInputVideo, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(audioSystemReadinessConfig.referencePhase31Audio, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4')
assert.equal(audioSystemReadinessConfig.phase36ERunId, 'phase36e-20260530T152327')
assert.equal(audioSystemReadinessConfig.deepFilterNetToolVersion, 'v0.5.6')

const chain = buildAudioSystemEvidenceChain()
assert.deepEqual(chain.map((entry) => entry.phase), ['31', '36A', '36B', '36C', '36D', '36E'])
assert.ok(chain.every((entry) => entry.summary.length > 0))

const betaScope = buildAudioSystemBetaScopeManifest({ runId: 'phase36f-20260530T160000', ready: true })
assert.deepEqual(betaScope.includedFeatures, ['ffmpeg_loudness_normalization', 'deepfilternet_noise_reduction'])
for (const excluded of ['rnnoise', 'demucs', 'provider_audio', 'revideo', 'film', 'slow_motion', 'arbitrary_media', 'production_delivery']) {
  assert.ok(betaScope.excludedFeatures.includes(excluded as typeof betaScope.excludedFeatures[number]), `${excluded} must be excluded.`)
}
assert.equal(betaScope.readiness.externalBetaAllowed, false)
assert.equal(betaScope.readiness.paidProductionAllowed, false)
assert.equal(betaScope.readiness.broadRealUserMediaAllowed, false)
assert.equal(betaScope.readiness.productionReadyAllowed, false)

assert.ok(requiredPhase36EArtifactIds.includes('deepfilternet-cleaned-wav'))
assert.ok(requiredPhase36EArtifactIds.includes('deepfilternet-audio-feature-review-mp4'))
assert.ok(requiredPhase36EArtifactIds.includes('loudness-report-json'))
assert.ok(buildStaticPhase36EArtifactRequirements().every((artifact) => artifact.required))

const staticPlan = validateAudioSystemReadinessStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  approvedInputVideo: audioSystemReadinessConfig.approvedInputVideo,
  phase36ERunId: audioSystemReadinessConfig.phase36ERunId,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateAudioSystemReadinessStaticPlan({ approvedInputVideo: 'gs://example/IMG_6024.MOV' }).blockers.length > 0)

const executionEnv = validateAudioSystemReadinessExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  approvedInputVideo: audioSystemReadinessConfig.approvedInputVideo,
  phase36ERunId: audioSystemReadinessConfig.phase36ERunId,
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
  rnnoiseEnabled: 'false',
  demucsEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
})
assert.equal(executionEnv.allowed, true)
assert.ok(validateAudioSystemReadinessExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_AUDIO_SYSTEM_INTERNAL_BETA_READINESS=true')))
assert.ok(validateAudioSystemReadinessExecutionEnv({ rnnoiseEnabled: 'true' }).blockers.some((blocker) => blocker.includes('RNNoise')))
assert.ok(validateAudioSystemReadinessExecutionEnv({ demucsEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Demucs')))
assert.ok(validateAudioSystemReadinessExecutionEnv({ providerExecutionEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Provider')))

const iamPlan = buildAudioSystemReadinessIamPlan()
assert.ok(iamPlan.every((binding) => binding.mutationPlanned === false))
assert.ok(iamPlan.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|owner|editor/i.test(binding.commandString)))

const commandPlans = buildAudioSystemReadinessCommandPlans()
assert.ok(commandPlans.some((plan) => plan.commandId === 'execute-phase36f-readiness'))
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(commandPlans.every((plan) => !/provider=true|RNNOISE_ENABLED=true|DEMUCS_ENABLED=true|allUsers|allAuthenticatedUsers|signed-url|revideo|film|slow-motion|REEDITPRO_PRODUCTION_READY=true|REEDITPRO_EXTERNAL_BETA_READY=true/i.test(plan.commandString)))

const report = buildAudioSystemReadinessReport()
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.arbitraryRealUserMediaAllowed, false)
assert.equal(report.rnnoiseAllowed, false)
assert.equal(report.demucsAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.filmAllowed, false)
assert.equal(report.slowMotionAllowed, false)
assert.deepEqual(audioSystemReadinessQaGateIds, [
  'evidence_chain',
  'artifact_integrity',
  'source_integrity',
  'plan_snapshot_integrity',
  'audio_metrics',
  'privacy_security',
  'operational_readiness',
  'beta_scope',
  'blocked_features',
])
assert.ok(report.approvedEvidence.phase37AReadiness.reason.length > 0)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:audio-system-readiness'], 'tsx server/cli/activation-audio-system-readiness.ts')
assert.equal(packageJson.scripts['activation:audio-system-readiness:report'], 'tsx server/cli/activation-audio-system-readiness-report.ts')
assert.equal(packageJson.scripts['activation:audio-system-readiness:iam-plan'], 'tsx server/cli/activation-audio-system-readiness-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-audio-system-readiness'], 'tsx server/smoke/activation-audio-system-readiness-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'evidence_chain_phase31_36a_36e',
    'beta_scope_ffmpeg_deepfilternet_only',
    'rnnoise_demucs_provider_revideo_film_slow_motion_excluded',
    'phase36e_artifacts_required',
    'rollback_fallback_policy_present',
    'confirmation_gate',
    'private_artifact_prefixes',
    'qa_gates',
    'blocked_production_external_beta_paid_broad_media',
    'package_scripts',
  ],
  status: report.status,
}))
