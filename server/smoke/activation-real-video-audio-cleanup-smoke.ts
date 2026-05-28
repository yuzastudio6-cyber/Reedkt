import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildPhase31AudioQaSummary,
  buildPhase31IamConditionExpression,
  buildPhase31IamPlan,
  buildPhase31LoudnessCommandPlan,
  buildPhase31MuxCommandPlan,
  buildRealVideoAudioCleanupPlan,
  phase31ForbiddenMembers,
  phase31ForbiddenRoles,
  phase31RenderServiceAccountMember,
  realVideoAudioCleanupConfig,
  resolvePhase31ApprovedArtifactUris,
  validatePhase31IamScopes,
  validateRealVideoAudioCleanupEnv,
  validateRealVideoAudioCleanupRuntimeReport,
} from '../activation/real-video-audio-cleanup'

const runId = 'phase31-smoke'
const uris = resolvePhase31ApprovedArtifactUris(runId)
const plan = buildRealVideoAudioCleanupPlan({ runId })
const iamPlan = buildPhase31IamPlan()
const loudnessPlan = buildPhase31LoudnessCommandPlan()
const muxPlan = buildPhase31MuxCommandPlan()

assert.equal(realVideoAudioCleanupConfig.phase30RunId, 'phase30-20260528T12421')
assert.equal(uris.input, realVideoAudioCleanupConfig.inputGcsUri)
assert.equal(plan.inputGcsUri, realVideoAudioCleanupConfig.inputGcsUri)
assert.equal(plan.targets.integratedLufs, -16)
assert.equal(plan.targets.truePeakDbtp, -1.5)
assert.equal(plan.safety.gpuAllowed, false)
assert.equal(plan.safety.providerExecutionAllowed, false)
assert.equal(plan.safety.modelDownloadAllowed, false)
assert.equal(plan.safety.deepFilterNetAllowed, false)
assert.equal(plan.safety.rnnoiseAllowed, false)
assert.equal(plan.safety.demucsAllowed, false)
assert.ok(plan.output.normalizedExportGcsUri.startsWith(`gs://${realVideoAudioCleanupConfig.finalExportsBucket}/activation-real-video/phase31/`))
assert.ok(loudnessPlan.measurementCommand.includes('-af'))
assert.ok(loudnessPlan.measurementCommand.join(' ').includes('loudnorm=I=-16:TP=-1.5:LRA=11'))
assert.equal(muxPlan.includes('-c:v'), true)
assert.equal(muxPlan.includes('copy'), true)
assert.equal(iamPlan.bindings.length, 5)
assert.equal(iamPlan.renderServiceAccountMember, phase31RenderServiceAccountMember)
assert.deepEqual(validatePhase31IamScopes(), [])
assert.equal(iamPlan.bindings.some((binding) => phase31ForbiddenRoles.includes(binding.scope.role)), false)
assert.equal(iamPlan.bindings.some((binding) => phase31ForbiddenMembers.includes(binding.member)), false)
for (const binding of iamPlan.bindings) {
  assert.equal(binding.conditionExpression, buildPhase31IamConditionExpression(binding.scope))
  assert.ok(binding.command.includes(`--role=${binding.scope.role}`))
  assert.ok(binding.command.includes(`--member=${phase31RenderServiceAccountMember}`))
}
assert.equal(validateRealVideoAudioCleanupEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
}).length, 0)
assert.ok(validateRealVideoAudioCleanupEnv({
  projectId: 'wrong',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
}).length > 0)
const qa = buildPhase31AudioQaSummary({
  normalizedExportExists: true,
  inputDurationSeconds: 15.47,
  outputDurationSeconds: 15.48,
  outputHasAudio: true,
  outputVideoCodec: 'h264',
  outputAudioCodec: 'aac',
  loudnessAfter: -16.1,
  truePeakAfter: -1.8,
})
assert.notEqual(qa.status, 'blocked')
assert.ok(qa.gates.some((gate) => gate.gateType === 'final_delivery' && gate.status === 'passed'))
assert.ok(validateRealVideoAudioCleanupRuntimeReport().length > 0)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(Boolean(packageJson.scripts['activation:real-video:audio-cleanup']), true)
assert.equal(Boolean(packageJson.scripts['activation:real-video:audio-cleanup:report']), true)
assert.equal(Boolean(packageJson.scripts['smoke:activation-real-video-audio-cleanup']), true)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase30_input_scope_locked',
    'ffmpeg_loudnorm_only',
    'private_output_prefixes',
    'conditional_iam_scopes',
    'env_guard',
    'qa_final_delivery_private_audio_export',
    'scripts_present',
    'gpu_provider_model_download_audio_models_blocked',
  ],
  qaStatus: qa.status,
}, null, 2))
