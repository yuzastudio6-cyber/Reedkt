import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  audioStackDemucsConfig,
  audioStackDemucsQaGateIds,
  buildAudioStackDemucsCommandPlans,
  buildAudioStackDemucsIamPlan,
  buildAudioStackDemucsQaGates,
  buildAudioStackDemucsReport,
  buildAudioStackToolRoutingDecision,
  buildDemucsLicenseReview,
  buildDemucsSourceEvidence,
  validateAudioStackDemucsExecutionEnv,
  validateAudioStackDemucsStaticPlan,
} from '../activation/audio-stack-demucs'

assert.equal(audioStackDemucsConfig.phase, '36G')
assert.equal(audioStackDemucsConfig.projectId, 'reeditpro')
assert.equal(audioStackDemucsConfig.region, 'us-central1')
assert.equal(audioStackDemucsConfig.env, 'staging')
assert.equal(audioStackDemucsConfig.approvedInputVideo, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(audioStackDemucsConfig.referencePhase31Audio, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4')
assert.equal(audioStackDemucsConfig.phase36ERunId, 'phase36e-20260530T152327')
assert.equal(audioStackDemucsConfig.phase36FRunId, 'phase36f-20260530T161352')
assert.equal(audioStackDemucsConfig.demucsModelCandidate, 'htdemucs')

const routing = buildAudioStackToolRoutingDecision()
assert.equal(routing.find((tool) => tool.toolId === 'deepfilternet')?.productStatus, 'active_internal')
assert.equal(routing.find((tool) => tool.toolId === 'demucs')?.productStatus, 'candidate_blocked')
assert.equal(routing.find((tool) => tool.toolId === 'rnnoise')?.productStatus, 'removed_from_active_flow')
assert.ok(routing.find((tool) => tool.toolId === 'deepfilternet')?.ownsActions.includes('Clean Voice'))
assert.ok(routing.find((tool) => tool.toolId === 'demucs')?.ownsActions.includes('Separate Vocals'))
assert.equal(routing.find((tool) => tool.toolId === 'rnnoise')?.ownsActions.length, 0)

const evidence = buildDemucsSourceEvidence()
assert.ok(evidence.some((entry) => entry.sourceUrl === 'https://github.com/facebookresearch/demucs'))
assert.ok(evidence.some((entry) => entry.sourceUrl === 'https://github.com/facebookresearch/demucs/issues/327'))
assert.ok(evidence.some((entry) => entry.status === 'blocked'))

const licenseReview = buildDemucsLicenseReview()
assert.equal(licenseReview.codeLicense, 'MIT')
assert.equal(licenseReview.pretrainedModelLicenseStatus, 'ambiguous_open_issue')
assert.equal(licenseReview.humanLegalApprovalRequired, true)

const staticPlan = validateAudioStackDemucsStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  approvedInputVideo: audioStackDemucsConfig.approvedInputVideo,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateAudioStackDemucsStaticPlan({ approvedInputVideo: 'file:///Users/macuser/Downloads/IMG_6024.MOV' }).blockers.length > 0)

const executionEnv = validateAudioStackDemucsExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  approvedInputVideo: audioStackDemucsConfig.approvedInputVideo,
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
  rnnoiseEnabled: 'false',
  demucsRuntimeEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
})
assert.equal(executionEnv.allowed, true)
assert.ok(validateAudioStackDemucsExecutionEnv({ confirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_AUDIO_STACK_DEMUCS_E2E=true')))
assert.ok(validateAudioStackDemucsExecutionEnv({ rnnoiseEnabled: 'true' }).blockers.some((blocker) => blocker.includes('RNNoise')))
assert.ok(validateAudioStackDemucsExecutionEnv({ demucsRuntimeEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Demucs runtime')))
assert.ok(validateAudioStackDemucsExecutionEnv({ providerExecutionEnabled: 'true' }).blockers.some((blocker) => blocker.includes('Provider')))

const iamPlan = buildAudioStackDemucsIamPlan()
assert.ok(iamPlan.every((binding) => binding.mutationPlanned === false))
assert.ok(iamPlan.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|owner|editor/i.test(JSON.stringify(binding))))

const commandPlans = buildAudioStackDemucsCommandPlans()
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(commandPlans.some((plan) => plan.commandId === 'blocked-demucs-download' && !plan.enabledInPhase36G))
assert.ok(commandPlans.some((plan) => plan.commandId === 'blocked-demucs-runtime' && !plan.enabledInPhase36G))
assert.ok(commandPlans.every((plan) => !/allUsers|allAuthenticatedUsers|signed-url|provider=true|RNNOISE_ENABLED=true|DEMUCS_RUNTIME_ENABLED=true|REEDITPRO_PRODUCTION_READY=true|REEDITPRO_EXTERNAL_BETA_READY=true/i.test(plan.commandString)))

assert.deepEqual(audioStackDemucsQaGateIds, [
  'tool_routing',
  'rnnoise_removal',
  'demucs_source_evidence',
  'demucs_license_provenance',
  'download_runtime_block',
  'controlled_source_scope',
  'privacy_security',
  'blocked_features',
  'phase37a_scope',
])
assert.ok(buildAudioStackDemucsQaGates().some((gate) => gate.gateId === 'demucs_license_provenance' && gate.status === 'blocked'))

const report = buildAudioStackDemucsReport()
assert.equal(report.status, 'closed_with_demucs_blocked')
assert.equal(report.deepFilterNetSpeechCleanupAllowed, true)
assert.equal(report.rnnoiseActiveProductFlowAllowed, false)
assert.equal(report.demucsDownloadAllowed, false)
assert.equal(report.demucsRuntimeAllowed, false)
assert.equal(report.demucsInternalBetaAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.arbitraryRealUserMediaAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.filmAllowed, false)
assert.equal(report.slowMotionAllowed, false)
assert.equal(report.phase37AReadiness.readyForOcrApprovalWorkflow, true)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:audio-stack-demucs'], 'tsx server/cli/activation-audio-stack-demucs.ts')
assert.equal(packageJson.scripts['activation:audio-stack-demucs:report'], 'tsx server/cli/activation-audio-stack-demucs-report.ts')
assert.equal(packageJson.scripts['activation:audio-stack-demucs:iam-plan'], 'tsx server/cli/activation-audio-stack-demucs-iam-plan.ts')
assert.equal(packageJson.scripts['smoke:activation-audio-stack-demucs'], 'tsx server/smoke/activation-audio-stack-demucs-smoke.ts')
assert.equal(packageJson.scripts['build:staging-demucs-runtime-worker'], 'npm run typecheck:server')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'deepfilternet_speech_cleanup_preserved',
    'rnnoise_removed_from_active_flow',
    'demucs_separation_candidate_documented',
    'demucs_model_license_blocked',
    'no_demucs_download_or_runtime',
    'approved_phase32_scope_only',
    'blocked_external_beta_production_provider_revideo_film_slow_motion',
    'package_scripts',
  ],
  status: report.status,
}))
