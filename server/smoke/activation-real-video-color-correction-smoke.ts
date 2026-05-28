import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildColorAnalysisSummary,
  buildColorGradeRecipe,
  buildPhase32ColorExportCommandPlan,
  buildPhase32ColorQaSummary,
  buildPhase32IamConditionExpression,
  buildPhase32IamPlan,
  buildPhase32SignalStatsCommandPlan,
  buildRealVideoColorCorrectionPlan,
  phase32ForbiddenMembers,
  phase32ForbiddenRoles,
  phase32RenderServiceAccountMember,
  realVideoColorCorrectionConfig,
  resolvePhase32ApprovedArtifactUris,
  validatePhase32IamScopes,
  validateRealVideoColorCorrectionEnv,
  validateRealVideoColorRuntimeReport,
} from '../activation/real-video-color-correction'

const runId = 'phase32-smoke'
const uris = resolvePhase32ApprovedArtifactUris(runId)
const plan = buildRealVideoColorCorrectionPlan({ runId })
const iamPlan = buildPhase32IamPlan()
const signalstats = buildPhase32SignalStatsCommandPlan()
const noOpCommand = buildPhase32ColorExportCommandPlan()
const correctionCommand = buildPhase32ColorExportCommandPlan({ ffmpegFilter: 'eq=brightness=0.025:contrast=1.04:saturation=1.03:gamma=1' })
const analysis = buildColorAnalysisSummary({
  durationSeconds: 15.467,
  colorSpace: 'bt709',
  colorTransfer: 'bt709',
  samples: [
    { sampleId: 'start', timestampSeconds: 0.5, stats: { YAVG: 100, YMIN: 10, YMAX: 230, SATAVG: 75 } },
    { sampleId: 'middle', timestampSeconds: 7.7, stats: { YAVG: 103, YMIN: 12, YMAX: 232, SATAVG: 76 } },
    { sampleId: 'end', timestampSeconds: 14.9, stats: { YAVG: 98, YMIN: 9, YMAX: 228, SATAVG: 74 } },
  ],
})
const recipe = buildColorGradeRecipe(analysis)
const qa = buildPhase32ColorQaSummary({
  colorExportExists: true,
  inputDurationSeconds: 15.467,
  outputDurationSeconds: 15.47,
  outputHasAudio: true,
  outputVideoCodec: 'h264',
  outputAudioCodec: 'aac',
  analysis,
  recipe,
})

assert.equal(realVideoColorCorrectionConfig.phase31RunId, 'phase31-20260528T13060')
assert.equal(uris.input, realVideoColorCorrectionConfig.inputGcsUri)
assert.equal(plan.inputGcsUri, realVideoColorCorrectionConfig.inputGcsUri)
assert.equal(plan.safety.gpuAllowed, false)
assert.equal(plan.safety.providerExecutionAllowed, false)
assert.equal(plan.safety.modelDownloadAllowed, false)
assert.equal(plan.safety.openColorIoAllowed, false)
assert.equal(plan.safety.openImageIoAllowed, false)
assert.equal(plan.safety.arbitraryFfmpegArgsAllowed, false)
assert.ok(plan.output.colorCorrectedExportGcsUri.startsWith(`gs://${realVideoColorCorrectionConfig.finalExportsBucket}/activation-real-video/phase32/`))
assert.ok(signalstats.join(' ').includes('signalstats'))
assert.ok(noOpCommand.join(' ').includes('-c copy'))
assert.ok(correctionCommand.join(' ').includes('eq=brightness=0.025'))
assert.equal(recipe.decision, 'no_op')
assert.notEqual(qa.status, 'blocked')
assert.ok(qa.gates.some((gate) => gate.gateType === 'final_delivery' && gate.status === 'passed'))
assert.ok(qa.gates.some((gate) => gate.gateType === 'color_skin_tone' && gate.status === 'warning'))
assert.equal(iamPlan.bindings.length, 6)
assert.equal(iamPlan.renderServiceAccountMember, phase32RenderServiceAccountMember)
assert.deepEqual(validatePhase32IamScopes(), [])
assert.equal(iamPlan.bindings.some((binding) => phase32ForbiddenRoles.includes(binding.scope.role)), false)
assert.equal(iamPlan.bindings.some((binding) => phase32ForbiddenMembers.includes(binding.member)), false)
for (const binding of iamPlan.bindings) {
  assert.equal(binding.conditionExpression, buildPhase32IamConditionExpression(binding.scope))
  assert.ok(binding.command.includes(`--role=${binding.scope.role}`))
  assert.ok(binding.command.includes(`--member=${phase32RenderServiceAccountMember}`))
}
assert.equal(validateRealVideoColorCorrectionEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
}).length, 0)
assert.ok(validateRealVideoColorCorrectionEnv({
  projectId: 'wrong',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
}).length > 0)
assert.ok(validateRealVideoColorRuntimeReport().length > 0)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(Boolean(packageJson.scripts['activation:real-video:color-correction']), true)
assert.equal(Boolean(packageJson.scripts['activation:real-video:color-correction:report']), true)
assert.equal(Boolean(packageJson.scripts['smoke:activation-real-video-color-correction']), true)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase31_input_scope_locked',
    'ffmpeg_color_only',
    'private_output_prefixes',
    'conditional_iam_scopes',
    'env_guard',
    'qa_final_delivery_private_color_export',
    'scripts_present',
    'gpu_provider_model_download_opencolorio_openimageio_blocked',
  ],
  qaStatus: qa.status,
}, null, 2))
